import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const css=await readFile(new URL('../dist/noirglass.min.css',import.meta.url),'utf8'),script=await readFile(new URL('../dist/noirglass.companion.js',import.meta.url),'utf8');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 await page.route('http://noirglass.test/**',r=>r.fulfill({contentType:'text/html',body:'<main id="itemDetailPage"><form class="trackSelections"><select class="selectSource"><option value="a">Main</option><option value="b">Alternate</option></select><select class="selectVideo"><option value="0">Video</option></select><select class="selectAudio"><option value="1">Audio</option><option value="2">Other audio</option></select></form></main>'}));
 await page.goto('http://noirglass.test/web/#/details?id=1234567890abcdef1234567890abcdef');await page.evaluate(()=>document.documentElement.classList.add('layout-desktop'));await page.addStyleTag({content:css});
 await page.evaluate(()=>{window.fixture={};window.ApiClient={getCurrentUserId:()=> 'viewer',getItems:async()=>({Items:[]}),getImageUrl:()=>location.origin+'/image',getUrl:p=>location.origin+'/'+p,getJSON:async()=>({enabled:true}),getItem:async()=>window.fixture.item};});
 const cases=[
  {video:{Width:3840,VideoRangeType:'DOVIWithHDR10'},audio:{Codec:'truehd',Title:'Atmos',ChannelLayout:'7.1'},expected:['4K','Dolby Vision','HDR10','Dolby Atmos','Dolby TrueHD','7.1']},
  {video:{VideoRangeType:'HDR10Plus'},audio:{Codec:'eac3',Profile:'JOC',Channels:6},expected:['HDR10+','Dolby Atmos','Dolby Digital+','6 channels']},
  {video:{VideoRangeType:'HLG'},audio:{Codec:'dts',Profile:'DTS-HD MA DTS:X',Channels:8},expected:['HLG','DTS:X','DTS-HD MA','8 channels']},
  {video:{VideoRangeType:'SDR'},audio:{Codec:'ac3',ChannelLayout:'stereo'},expected:['SDR','Dolby Digital','Stereo']},
  {video:{},audio:{Codec:'dts',Profile:'DTS-HD HRA'},expected:['DTS-HD HR']},
  {video:{},audio:{Codec:'dts',Profile:'DTS-HD'},expected:['DTS-HD']},
  {video:{VideoRange:'HDR'},audio:{Codec:'dts'},expected:['HDR','DTS']},
  {video:{Width:1920,Height:800},audio:{Codec:'aac',Channels:2},expected:['2 channels']},
  {video:{},audio:{},labels:['REMUX','WEB-DL','WEBRip','Blu-ray','Open Matte','35mm','70mm','IMAX','DCP'],expected:['REMUX','WEB-DL','WEBRip','Blu-ray','Open Matte','35mm','70mm','IMAX','DCP']}
 ];
 for(const [index,test]of cases.entries()){
  await page.evaluate(test=>{window.fixture.item={Id:'1234567890abcdef1234567890abcdef',Tags:test.labels||[],MediaSources:[{Id:'a',Name:'Source',MediaStreams:[{Type:'Video',Index:0,...test.video},{Type:'Audio',Index:1,...test.audio},{Type:'Audio',Index:2,Codec:'aac'}]},{Id:'b',Name:'Alternate source',MediaStreams:[{Type:'Video',Index:0},{Type:'Audio',Index:1,Codec:'aac'}]}]};document.querySelector('.selectSource').value='a';document.querySelector('.selectAudio').value='1';},test);
  await page.addScriptTag({content:script});await page.waitForTimeout(350);
  assert.deepEqual(await page.locator('.ng-format-badge').allTextContents(),test.expected,'Format case '+index);
  assert(await page.locator('.trackSelections').evaluate(e=>e.firstElementChild.classList.contains('ng-format-badges')),'Desktop badges precede native controls in DOM order');
  const evidence=await page.locator('.ng-format-badge').evaluateAll(nodes=>nodes.map(e=>e.dataset.evidence));assert(evidence.every(e=>e=== (test.labels?'Explicit source filename/name or Jellyfin tag':'Selected stream metadata')));
  if(index===0){await page.locator('.selectAudio').selectOption('2');await page.waitForTimeout(350);assert.deepEqual(await page.locator('.ng-format-badge').allTextContents(),['4K','Dolby Vision','HDR10'],'Audio track changes remove the previous track formats');}
 }
 await page.locator('.selectAudio').selectOption('2');await page.waitForTimeout(350);
 assert(!(await page.locator('.ng-format-badge').allTextContents()).includes('Dolby TrueHD'));
 await page.evaluate(()=>{window.__NoirGlassCompanion.destroy();document.documentElement.classList.remove('layout-desktop');document.documentElement.classList.add('layout-mobile');});await page.addScriptTag({content:script});await page.waitForTimeout(350);
 assert(await page.locator('.trackSelections').evaluate(e=>e.lastElementChild.classList.contains('ng-format-badges')),'Deferred Mobile layout keeps its badge placement');
 await page.locator('.selectSource').selectOption('b');await page.waitForTimeout(350);
 // Tags are item-level; source changes remove technical labels but retain explicit tags.
 assert.deepEqual(await page.locator('.ng-format-badge').allTextContents(),cases.at(-1).expected);
 await page.evaluate(()=>{window.fixture.item.Tags=[];window.fixture.item.MediaSources=[];});await page.addScriptTag({content:script});await page.waitForTimeout(350);assert.equal(await page.locator('.ng-format-badge').count(),0);
 await page.addStyleTag({content:':root{--ng-format-badges-display:none}'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ng-format-badges-display').trim()),'none');
 console.log('PASS format families, explicit label evidence, unknown range/channel safety, track/source changes and missing metadata');
}finally{await browser.close();}
