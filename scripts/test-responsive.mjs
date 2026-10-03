import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { root } from './build.mjs';
import { fixtures, scaffold } from './ui-fixtures.mjs';
import { sixteenNine, adaptedViewports } from './viewports.mjs';

const css = await readFile(path.join(root,'dist/noirglass.min.css'),'utf8');
const dir = path.join(root,'test-results/responsive'); await mkdir(dir,{recursive:true});
const browser = await chromium.launch({headless:true}), results=[];
const button = (name,icon) => `<button class="headerButton ${name} headerButtonLeft"><span class="material-icons ${icon}">${icon}</span></button>`;
const header = `<header class="skinHeader"><div class="headerTop"><div class="headerLeft">${button('headerBackButton','arrow_back')}${button('headerHomeButton','home')}${button('mainDrawerButton','menu')}</div><div class="headerRight">${button('headerSyncButton','people')}${button('headerCastButton','cast')}${button('headerSearchButton','search')}${button('headerUserButton','person')}</div></div></header>`;
const tracks = `<main id="itemDetailPage" class="libraryPage itemDetailPage"><form class="trackSelections">${['Video','Audio','Subtitles'].map(name=>`<div class="selectContainer select${name}Container trackSelectionFieldContainer"><label class="selectLabel">${name}</label><select class="detailTrackSelect emby-select"><option>A long selected ${name} description</option></select><div class="selectArrowContainer">⌄</div></div>`).join('')}<div class="ng-format-badges"><span class="ng-format-badge">Dolby TrueHD</span></div></form></main>`;
const native = `html{font-size:14.88px}body{margin:0;padding:0}.skinHeader{position:fixed;top:0;left:0;right:0;z-index:20}.headerTop{display:flex;align-items:center;justify-content:space-between}.headerLeft,.headerRight{display:flex}.headerButton{display:inline-flex;align-items:center;justify-content:center;border:0;margin:0}.material-icons{display:inline-block}.libraryPage{min-height:100vh}.trackSelections{padding:0}.selectContainer{min-width:0}.selectLabel{display:block}.emby-select{width:100%}.backgroundContainer{position:fixed;inset:0;background:#222}.backdropContainer{position:fixed;inset:0}.backdropImage{position:absolute;inset:0;background:linear-gradient(90deg,#73aec0,#546470)}#loginPage{position:relative;background:#000;min-height:100vh}.MuiDialogContent-root{background:#19191c}.MuiDialogTitle-root,.MuiDialogActions-root{background:#29292d}`;
const inspect = () => ({overflow:document.documentElement.scrollWidth>innerWidth});
try {
  // The alternate-aspect group is entered only after the complete 16:9 group passes.
  for (const [group,sizes] of [['16:9',sixteenNine],['adapted',adaptedViewports]]) {
    for (const [width,height] of sizes) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:width<=500});
      const page=await context.newPage();
      const load=async(markup,extra='')=>{await page.setContent(`<html class="layout-${width<=500?'mobile':'desktop'}"><head><style>${native}${extra}</style></head><body>${markup}</body></html>`);await page.addStyleTag({content:css});};
      for(const fixture of fixtures){await load(fixture.markup,scaffold);assert(!(await page.evaluate(inspect)).overflow,`${group} ${width} ${fixture.id}: document overflow`);for(const selector of fixture.selectors)assert(await page.locator(selector).count());results.push({group,width,height,family:fixture.id,result:'passed'});}
      await load(header+'<main class="libraryPage"></main>');
      const controls=await page.locator('.headerButton').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().toJSON()));
      for(const b of controls)assert(b.x>=0&&b.x+b.width<=width+.1&&b.width>=44&&b.height>=44,'Header controls stay inside viewport with touch targets');
      for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];assert(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),`${width}: Header controls overlap`);}
      const base=await page.locator('.headerRight').evaluate(e=>getComputedStyle(e).backgroundColor);
      assert.notEqual(await page.locator('.headerRight').evaluate(e=>getComputedStyle(e).backdropFilter),'none','Right navigation retains glass');
      await page.addStyleTag({content:':root{--ng-glass-opacity-scale:.5}'});
      const faded=await page.locator('.headerRight').evaluate(e=>getComputedStyle(e).backgroundColor);assert.notEqual(base,faded,'Global multiplier changes material alpha');
      assert.equal(await page.locator('.headerButton').first().evaluate(e=>getComputedStyle(e).opacity),'1','Glass transparency never fades whole controls');
      await page.screenshot({path:path.join(dir,`header-${width}-${height}.png`)});
      await load(tracks);
      const boxes=await page.locator('.trackSelectionFieldContainer').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().toJSON()));
      assert(boxes[1].y>=boxes[0].bottom,'Track controls stack in Desktop and narrow Mobile layouts');
      if(width>500)for(const b of boxes)assert(b.height>=44&&b.height<=50,'Desktop track rows remain slim');
      assert(!(await page.evaluate(inspect)).overflow);
      for(const field of await page.locator('.trackSelectionFieldContainer').all()){const select=await field.locator('select').boundingBox(),arrow=await field.locator('.selectArrowContainer').boundingBox();assert(Math.abs(select.y+select.height/2-arrow.y-arrow.height/2)<1,'Track arrows align with selected values rather than labels');}
      assert.equal(await page.locator('.ng-format-badges').evaluate(e=>getComputedStyle(e).display),'flex');
      await page.addStyleTag({content:':root{--ng-format-badges-display:none}'});assert.equal(await page.locator('.ng-format-badges').evaluate(e=>getComputedStyle(e).display),'none');
      await load('<main id="videoOsdPage"><div class="videoOsdBottom"><div class="buttons"><button class="btnPause"><span class="material-icons pause">pause</span></button></div></div></main>');
      const icon=page.locator('.btnPause .material-icons'),playing=await icon.evaluate(e=>getComputedStyle(e).maskImage);
      await icon.evaluate(e=>{e.classList.replace('pause','play_arrow');e.textContent='play_arrow';});
      assert.notEqual(await icon.evaluate(e=>getComputedStyle(e).maskImage),playing,'Native paused state selects a Play silhouette');
      assert.equal(await icon.evaluate(e=>getComputedStyle(e).animationDuration),'0.2s');
      await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await icon.evaluate(e=>getComputedStyle(e).animationDuration),'0s');await page.emulateMedia({reducedMotion:'no-preference'});
      assert.equal(await page.locator('.videoOsdBottom').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
      const playerButton=name=>`<button class="paper-icon-button-light ${name}"><span class="material-icons">${name}</span></button>`;
      await load(`<main id="videoOsdPage"><div class="videoOsdBottom"><div class="buttons"><div dir="ltr">${['btnPreviousChapter','btnPause','btnNextChapter'].map(playerButton).join('')}</div><span class="osdTimeText">01:23 / 02:43:57</span>${['btnUserRating','btnAudio','btnSubtitles','btnVideoOsdSettings','btnPip','btnFullscreen','btnStop'].map(playerButton).join('')}</div></div></main>`,'.videoOsdBottom{position:fixed;bottom:0;left:0;right:0}.paper-icon-button-light{border:0;padding:0}.material-icons{width:24px;height:24px}');
      const docks=await page.locator('.buttons button').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect().toJSON()));
      for(const b of docks)assert(b.x>=-.1&&b.right<=width+.1&&b.y>=0&&b.bottom<=height+.1,'Native player docks stay in viewport');
      for(let i=0;i<docks.length;i++)for(let j=i+1;j<docks.length;j++){const a=docks[i],b=docks[j];assert(!(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y),`${width}: player controls overlap`);}
      await load('<main class="dashboardDocument"><div class="content-primary"><div class="MuiStack-root"><table class="MuiTable-root"><tbody><tr><td class="MuiTableCell-root">Every 24 hours</td><td class="MuiTableCell-root"><button class="MuiIconButton-root">Delete trigger</button></td></tr></tbody></table></div></div></main>','.content-primary{width:100%;box-sizing:border-box}.MuiStack-root{width:100%}');
      assert(!(await page.evaluate(inspect)).overflow,'Native bare task table uses a contained scroll wrapper');
      assert.equal(await page.locator('.MuiStack-root').evaluate(e=>getComputedStyle(e).overflowX),'auto');
      await load('<main class="page"><div class="readOnlyContent" style="display:flex;align-items:center;width:100%"><div style="width:170px;flex-shrink:0;height:170px"></div><div style="margin:1em 2em;display:flex;flex-direction:column;align-items:center"><h2 class="username">An exceptionally long profile name</h2><button id="btnAddImage" class="emby-button raised">Add image</button></div></div></main>');
      assert(!(await page.evaluate(inspect)).overflow,'Native profile image/name row wraps without shrinking password fields');
      await load('<div class="MuiDialog-root"><div class="MuiDialog-paper"><h2 class="MuiDialogTitle-root">Restart</h2><div class="MuiDialogContent-root">Are you sure?</div><footer class="MuiDialogActions-root"><button class="MuiButton-root">Cancel</button><button class="MuiButton-root MuiButton-colorError">Restart</button></footer></div></div>');
      for(const selector of ['.MuiDialogTitle-root','.MuiDialogContent-root','.MuiDialogActions-root'])assert.equal(await page.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Dialog sections share the panel material');
      await page.screenshot({path:path.join(dir,`dialog-${width}-${height}.png`)});
      for(const splash of [false,true]){await load(`<div class="backgroundContainer ${splash?'withBackdrop':''}"></div>${splash?'<div class="backdropContainer"><div class="backdropImage displayingBackdropImage"></div></div>':''}<main id="loginPage" class="libraryPage backdropPage"></main>`);assert.equal(await page.locator('#loginPage').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');assert.equal(await page.locator('.backgroundContainer').evaluate(e=>getComputedStyle(e).backgroundColor),splash?'rgba(0, 0, 0, 0)':'rgb(0, 0, 0)');}
      results.push({group,width,height,family:'navigation/tracks/native-playback/dialogs/splash',result:'passed'});
      await context.close();
    }
    console.log('PASS '+group+' component geometry at '+sizes.length+' resolutions');
  }
  await writeFile(path.join(dir,'coverage.json'),JSON.stringify(results,null,2)+'\n');
  console.log('PASS '+results.length+' responsive component states, 480p–4K followed by alternative aspect ratios');
} finally {await browser.close();}
