import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { sixteenNine } from './viewports.mjs';
const root=path.resolve(import.meta.dirname,'..');
const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
await mkdir(path.join(root,'.local/verification'),{recursive:true});
const profile=JSON.parse(await readFile(path.join(root,'.local/instance.json'),'utf8'));
const css=await readFile(path.join(root,'dist/noirglass.min.css'),'utf8');
const response=await fetch('http://127.0.0.1:4319',{method:'POST',body:JSON.stringify({action:'evaluate',expression:'Object.fromEntries(Object.entries(localStorage))'})});
assert(response.ok);
const storage=await response.json(); // Session exists only in memory.
const report={product:'NoirGlass',version,date:new Date().toISOString(),target:'Jellyfin Web 12.1 Legacy',checks:[],limitations:[]};
const modes=process.env.NOIRGLASS_PLAYER_MODE?[process.env.NOIRGLASS_PLAYER_MODE]:['desktop','mobile'];
const desktopWidth=Number(process.env.NOIRGLASS_PLAYER_DESKTOP_WIDTH || 1440);
assert([1440,1920,...sixteenNine.map(([width])=>width)].includes(desktopWidth),'Use a supported desktop validation width');
const desktopHeight = sixteenNine.find(([width])=>width===desktopWidth)?.[1] || 900;
report.checks=report.checks.filter(c=>!modes.some(mode=>c.name.startsWith(`${mode}: real playback`)));
report.limitations=report.limitations.filter(l=>!modes.some(mode=>l.startsWith(`Player validation (${mode}):`)));
report.playerCheckedAt=new Date().toISOString();
const browser=await chromium.launch({headless:true,...(process.env.NOIRGLASS_BROWSER_EXECUTABLE?{executablePath:process.env.NOIRGLASS_BROWSER_EXECUTABLE}:{})});
const screenshotDirectory=path.join(root,process.env.NOIRGLASS_PUBLIC_CAPTURE==='1'?'docs/images':'test-results');
await mkdir(screenshotDirectory,{recursive:true});
try {
  for(const mode of modes) {
    const context=await browser.newContext({hasTouch:mode==='mobile',isMobile:mode==='mobile',viewport:mode==='desktop'?{width:desktopWidth,height:desktopHeight}:{width:390,height:844},storageState:{cookies:[],origins:[{origin:profile.origin,localStorage:Object.entries({...storage,layout:`${mode}-legacy`}).map(([name,value])=>({name,value}))}]}});
    await context.route('https://noirglass.invalid/**',r=>r.fulfill({contentType:'text/css',body:css}));
    const page=await context.newPage();
    const press=locator=>mode==='mobile'?locator.tap():locator.click();
    const openDetail=async id=>{
      await page.goto(`${profile.origin}/web/#/details?id=${id}`,{waitUntil:'domcontentloaded'});
      await page.locator('#itemDetailPage:not(.hide) .btnPlay:not(.hide)').first().waitFor({state:'visible'});
      await page.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{});
      await page.addStyleTag({content:'@import url("https://noirglass.invalid/dist/noirglass.min.css");'}).then(handle=>handle.evaluate(e=>document.body.append(e)));
    };
    await openDetail(profile.movie);
    const alternatives=await page.evaluate(async()=>{
      const api=window.ApiClient;
      const response=await api.getItems(api.getCurrentUserId(),{Recursive:true,IncludeItemTypes:'Movie',SortBy:'DateCreated',SortOrder:'Descending',Limit:15});
      return (response?.Items||[]).filter(item=>item.Id&&item.MediaType==='Video').map(item=>item.Id);
    });
    const candidates=[profile.movie,...alternatives.filter(id=>id!==profile.movie)].slice(0,4);
    let played=false;
    for(const [index,id] of candidates.entries()) {
      if(index)await openDetail(id);
      // The original fixture has a known, browser-compatible secondary audio track.
      if(index===0)await page.locator('#itemDetailPage:not(.hide) select').nth(2).selectOption('2');
      await press(page.locator('#itemDetailPage:not(.hide) .btnPlay:not(.hide)').first());
      let playbackResult = 'timeout';
      try {
        const playback=await page.waitForFunction(()=>{
          const v=document.querySelector('video');
          if(v&&v.currentTime>1&&v.readyState>=2)return 'playing';
          const dialog=[...document.querySelectorAll('.dialog')].find(e=>e.getClientRects().length&&e.innerText.includes('Playback Error'));
          return dialog?'error':false;
        },{},{timeout:30000});
        playbackResult = await playback.jsonValue();
      } catch {
        const state = await page.evaluate(() => ({
          player: !!document.querySelector('#videoOsdPage:not(.hide)'),
          video: !!document.querySelector('video'),
          readyState: document.querySelector('video')?.readyState ?? null,
          paused: document.querySelector('video')?.paused ?? null
        }));
        console.log(`${mode}: candidate ${index+1} timed out ${JSON.stringify(state)}`);
      }
      if(playbackResult==='playing'){played=true;break;}
      console.log(`${mode}: native HLS playback failed for candidate ${index+1}`);
      // A timed-out native player can outlive a hash-only detail navigation.
      // Unload its document before trying another source; never click through it.
      await page.goto('about:blank');
    }
    assert(played,'Jellyfin reported a native HLS playback error for all available test candidates');
    const start=await page.locator('video').evaluate(v=>v.currentTime);
    await page.waitForTimeout(1200);
    assert(await page.locator('video').evaluate(v=>v.currentTime)>start,'Playback must advance');
    await page.mouse.move(50,50);
    const playingMask=await page.locator('#videoOsdPage .btnPause .material-icons').evaluate(e=>getComputedStyle(e).maskImage);
    await press(page.locator('#videoOsdPage .btnPause'));
    assert(await page.locator('video').evaluate(v=>v.paused));
    await page.waitForFunction(()=>document.querySelector('#videoOsdPage .btnPause .play_arrow'));
    assert.notEqual(await page.locator('#videoOsdPage .btnPause .material-icons').evaluate(e=>getComputedStyle(e).maskImage),playingMask,'Paused playback must show Play');
    await page.locator('#videoOsdPage .btnPause').focus();
    await page.locator('#videoOsdPage .btnPause').press('Enter');
    await page.waitForFunction(()=>document.querySelector('#videoOsdPage .btnPause .pause'));
    assert.equal(await page.locator('#videoOsdPage .btnPause .material-icons').evaluate(e=>getComputedStyle(e).maskImage),playingMask,'Resumed playback must show Pause');
    await press(page.locator('#videoOsdPage .btnPause'));
    await press(page.locator('#videoOsdPage .btnSubtitles'));
    assert(await page.locator('.dialog:visible,.actionSheet:visible').count()>0,'Subtitle menu must open');
    await page.keyboard.press('Escape');
    await page.mouse.click(8,8);
    await page.locator('.dialog:visible,.actionSheet:visible').waitFor({state:'hidden',timeout:5000});
    await page.mouse.move(60,60);
    await press(page.locator('#videoOsdPage .btnAudio'));
    assert(await page.locator('.dialog:visible,.actionSheet:visible').count()>0,'Audio menu must open');
    await page.keyboard.press('Escape');
    await page.mouse.click(8,8);
    await page.locator('.dialog:visible,.actionSheet:visible').waitFor({state:'hidden',timeout:5000});
    await page.mouse.move(70,70);
    assert(await page.locator('#videoOsdPage .btnVideoOsdSettings').isVisible());
    await press(page.locator('#videoOsdPage .btnVideoOsdSettings'));
    await page.locator('.dialog:visible,.actionSheet:visible').first().waitFor({state:'visible',timeout:10000});
    assert(await page.locator('.dialog:visible,.actionSheet:visible').count()>0,'Playback settings menu must open');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Playback menu stays within viewport');
    await page.keyboard.press('Escape');
    await page.mouse.click(8,8);
    await page.locator('.dialog:visible,.actionSheet:visible').waitFor({state:'hidden',timeout:5000});
    await page.mouse.move(75,75);
    const seek=page.locator('#videoOsdPage .osdPositionSlider');
    assert(await seek.isVisible());
    const track=await seek.boundingBox();
    if(mode==='mobile') await page.touchscreen.tap(track.x+track.width*0.08,track.y+track.height/2);
    else await seek.click({position:{x:track.width*0.08,y:track.height/2}});
    await page.waitForFunction(()=>document.querySelector('video')?.currentTime>30,{},{timeout:30000});
    await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.seeking&&v.readyState>=2;},{},{timeout:60000});
    assert.equal(await page.locator('#videoOsdPage').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','OSD page must remain transparent over the video');
    await page.waitForTimeout(1000);
    await page.mouse.move(80,80);
    assert.equal(await page.locator('.backgroundContainer').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Background layer must remain transparent during playback');
    await page.evaluate(()=>document.fonts.ready);
    if(mode==='mobile') {
      await page.touchscreen.tap(195,422);
      await page.locator('#videoOsdPage .btnPause').waitFor({state:'visible'});
      await page.waitForFunction(()=>{const e=document.querySelector('.videoOsdBottom');return e&&Number(getComputedStyle(e).opacity)>0.9;},{},{timeout:5000});
    }
    const osdSurface=await page.locator('.videoOsdBottom').evaluate(e=>{const s=getComputedStyle(e);return {blur:s.backdropFilter,radius:s.borderRadius,image:s.backgroundImage};});
    assert.equal(osdSurface.blur,'none','Full-width OSD must not blur the video');
    assert.equal(osdSurface.radius,'0px','Full-width OSD must not appear as a rounded panel');
    assert(osdSurface.image.includes('linear-gradient'),'OSD must use a fading scrim');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Player must not overflow');
    const buttonBoxes=await page.locator('#videoOsdPage .videoOsdBottom button').evaluateAll(nodes=>nodes.filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').map(e=>({classes:e.className,box:e.getBoundingClientRect().toJSON()})));
    for(const {box:b,classes}of buttonBoxes)assert(b.x>=-.1&&b.x+b.width<= (mode==='desktop'?desktopWidth:390)+.1,'Player button outside viewport: '+classes);
    for(let i=0;i<buttonBoxes.length;i++)for(let j=i+1;j<buttonBoxes.length;j++){const a=buttonBoxes[i].box,b=buttonBoxes[j].box;assert(!(a.x<b.x+b.width-.5&&a.x+a.width>b.x+.5&&a.y<b.y+b.height-.5&&a.y+a.height>b.y+.5),'Overlapping player buttons: '+buttonBoxes[i].classes+' / '+buttonBoxes[j].classes);}
    await page.screenshot({path:path.join(screenshotDirectory,`player-${mode}.png`)});
    const hiddenSurface=await page.locator('#videoOsdPage').evaluate(osd=>{
      osd.classList.add('hide');
      const bottom=osd.querySelector('.videoOsdBottom');
      const hidden=!bottom.getClientRects().length;
      osd.classList.remove('hide');
      return hidden;
    });
    assert(hiddenSurface,'The native hidden state must remove the OSD scrim');
    report.checks.push({name:`${mode}: real playback, pause, audio/subtitle/settings menus and seek`,result:'passed',input:mode==='mobile'?'Touch-enabled context, touchscreen taps and keyboard':'Mouse and keyboard',transparentVideoLayers:true,osdScrim:'Gradient with no backdrop blur',subtitles:'Menus inspected without changing subtitle preferences'});
    console.log(`PASS ${mode}: actual video playback and OSD`);
    await context.close();
  }
} catch(error) {
  const failedMode = modes.find(mode => !report.checks.some(check => check.name.startsWith(`${mode}: real playback`))) || modes[0];
  report.limitations.push(`Player validation (${failedMode}): ${error.message.replaceAll(profile.origin,'[private server]').replace(/[a-f0-9]{32}/gi,'[private item]')}`);
  console.error(error.message);
  process.exitCode=1;
} finally {
  await browser.close();
  await writeFile(path.join(root,'.local/verification/live-player.json'),JSON.stringify(report,null,2)+'\n');
}
