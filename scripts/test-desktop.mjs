import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { root } from './build.mjs';
import { sixteenNine, adaptedViewports } from './viewports.mjs';

const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const config = (await readFile(path.join(root, 'plugin/NoirGlass.Plugin/Configuration/configPage.html'), 'utf8')).match(/<body>([\s\S]*?)<script>/)[1];
const native = `html{font-size:14.88px}body{margin:0}.skinHeader{position:fixed;top:0;left:0;right:0;z-index:20}.headerTop{display:flex;align-items:center;justify-content:space-between}.headerLeft,.headerRight{display:flex}.headerButton{display:inline-flex;align-items:center;justify-content:center;border:0;margin:0}.headerTabs{text-align:center;max-width:100%}.tabs-viewmenubar{overflow:hidden;white-space:nowrap}.emby-tabs-slider{white-space:nowrap}.emby-tab-button{border:0;background:none}.libraryPage{min-height:100vh}.inputLabel{display:inline}.checkboxContainer{display:flex;align-items:center}.checkboxContainer>label{flex:1}.content-primary{padding:32px}.overview-controls{text-align:right;width:100%}.overview-expand{float:right}.MuiAppBar-root{height:48px}.mainAnimatedPage{padding-top:48px}.fieldDescription{margin-top:4px}`;
const button = name => `<button class="headerButton headerButtonLeft" aria-label="${name}">${name}</button>`;
const nativeTabs = `<div class="tabs-viewmenubar emby-tabs focusable scrollX"><div class="emby-tabs-slider"><button class="emby-tab-button emby-tab-button-active" id="native-home">Home</button><button class="emby-tab-button" id="native-favorites">Favorites</button></div></div>`;
const header = links => `<header class="skinHeader"><div class="headerTop"><div class="headerLeft">${button('Menu')}</div><div class="headerRight">${button('Search')}${button('User')}</div></div><div class="headerTabs sectionTabs">${nativeTabs}${links ? '<nav class="ng-home-links" aria-label="Additional Home destinations">'+links.map(label=>`<a class="ng-home-link" href="#/list">${label}</a>`).join('')+'</nav>' : ''}</div></header><main class="libraryPage" id="indexPage"></main>`;
const dir = path.join(root,'test-results/desktop'); await mkdir(dir,{recursive:true});
const browser = await chromium.launch({headless:true}), results=[];
const common = [[1920,1080],[2560,1440],[1366,768],[1440,900]];
const sizes = [...common, ...sixteenNine.filter(([w,h])=>!common.some(([x,y])=>x===w&&y===h)), ...adaptedViewports.filter(([w,h])=>w>=1024&&!common.some(([x,y])=>x===w&&y===h)), [999,800],[1000,800]];
async function home(page,width,height,mobile=false) {
  const load = async labels => {
    await page.setContent(`<html class="layout-${mobile?'mobile':'desktop'}"><head><style>${native}</style></head><body>${header(labels)}</body></html>`);
    await page.addStyleTag({content:css});
  };
  let moviePalette;
  if(!mobile){
    await page.setContent(`<html class="layout-desktop"><head><style>${native}</style></head><body>${header(null).replace('id="indexPage"','id="moviesPage"')}</body></html>`);await page.addStyleTag({content:css});
    moviePalette=await page.locator('.emby-tabs-slider').evaluate(e=>({background:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderTopColor,active:getComputedStyle(e.querySelector('.emby-tab-button-active')).backgroundColor,inactive:getComputedStyle(e.querySelector('#native-favorites')).color}));
  }
  await load(['Collections','Movies','TV Shows']);
  const surface=page.locator('.headerTabs'), slider=page.locator('.emby-tabs-slider');
  assert.notEqual(await surface.evaluate(e=>getComputedStyle(e).backdropFilter),'none','One outer capsule provides glass');
  assert.equal(await slider.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Native inner surface is transparent');
  assert.equal(await slider.evaluate(e=>getComputedStyle(e).borderTopWidth),'0px');
  assert.equal(await page.locator('.ng-home-links').evaluate(e=>getComputedStyle(e).backdropFilter),'none','Extra links have no second glass panel');
  if(!mobile){
    await page.addStyleTag({content:'.emby-tab-button{opacity:.6}'});
    assert.equal(await page.locator('#native-favorites').evaluate(e=>getComputedStyle(e).opacity),'1');
    assert.equal(await page.locator('#native-favorites').evaluate(e=>getComputedStyle(e).color),await page.locator('.ng-home-link').first().evaluate(e=>getComputedStyle(e).color));
    assert.equal(await page.locator('#native-home').evaluate(e=>getComputedStyle(e).color),'rgb(21, 21, 23)');
    assert.equal(await surface.evaluate(e=>getComputedStyle(e).backgroundColor),moviePalette.background);
    assert.equal(await surface.evaluate(e=>getComputedStyle(e).borderTopColor),moviePalette.border);
    assert.equal(await page.locator('#native-home').evaluate(e=>getComputedStyle(e).backgroundColor),moviePalette.active);
    assert.equal(await page.locator('#native-favorites').evaluate(e=>getComputedStyle(e).color),moviePalette.inactive);
  }
  const rect=await surface.boundingBox(), right=await page.locator('.headerRight').boundingBox();
  assert(rect.x>=-.1&&rect.x+rect.width<=width+.1,'Capsule stays within viewport');
  assert(!(rect.x<right.x+right.width&&rect.x+rect.width>right.x&&rect.y<right.y+right.height&&rect.y+rect.height>right.y),'Navigation does not collide with header actions');
  await page.evaluate(()=>{window.nativeClicks=0;document.querySelector('#native-favorites').onclick=()=>window.nativeClicks++;});
  await page.locator('#native-favorites').click(); assert.equal(await page.evaluate(()=>window.nativeClicks),1);
  if(!mobile){
    await page.evaluate(()=>{document.querySelector('#native-home').classList.remove('emby-tab-button-active');document.querySelector('#native-favorites').classList.add('emby-tab-button-active');});
    assert.equal(await page.locator('#native-favorites').evaluate(e=>getComputedStyle(e).color),'rgb(21, 21, 23)');
    assert.equal(await page.locator('#native-home').evaluate(e=>getComputedStyle(e).color),'rgba(235, 235, 245, 0.64)');
  }
  const original=await surface.evaluate(e=>getComputedStyle(e).backgroundColor);
  for(const scale of [0,.7,1,2]){
    const override=await page.addStyleTag({content:`:root{--ng-glass-opacity-scale:${scale}}`});
    if(scale!==1)assert.notEqual(await surface.evaluate(e=>getComputedStyle(e).backgroundColor),original);
    assert.equal(await page.locator('.ng-home-link').first().evaluate(e=>getComputedStyle(e).opacity),'1');
    await override.evaluate(e=>e.remove());
  }
  await page.screenshot({path:path.join(dir,`home-${width}-${height}.png`)});
  await load(Array.from({length:20},(_,i)=>`An exceptionally long custom library destination ${i+1}`));
  assert(await surface.evaluate(e=>e.scrollWidth>e.clientWidth),'Long labels scroll within the capsule');
  await page.keyboard.press('Tab');
  await page.locator('.ng-home-link').last().focus();
  const focused=await page.locator('.ng-home-link').last().boundingBox(), bounds=await surface.boundingBox();
  assert(focused.x<bounds.x+bounds.width&&focused.x+focused.width>bounds.x,'Focused destination scrolls into view, including labels wider than the capsule');
  assert.equal(await page.locator('.ng-home-link').last().evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
  await load(null);
  assert.equal(await surface.evaluate(e=>getComputedStyle(e).backdropFilter),'none','CSS-only native Home retains its own inner capsule');
  assert.notEqual(await slider.evaluate(e=>getComputedStyle(e).backdropFilter),'none');
  if(!mobile)assert.equal(await slider.evaluate(e=>getComputedStyle(e).backgroundColor),moviePalette.background,'CSS-only Home matches Movies');
  results.push({width,height,mode:mobile?'mobile':'desktop',family:'unified-home',result:'passed'});
}
try {
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
    await home(page,width,height);
    await page.setContent(`<html class="layout-desktop"><head><style>${native}</style></head><body class="dashboardDocument">${config}</body></html>`);
    await page.addStyleTag({content:css});
    const pinned=await page.locator('#NoirGlassPinned').boundingBox(), label=await page.locator('label[for=NoirGlassPinned]').boundingBox(), form=await page.locator('#NoirGlassConfigForm').boundingBox();
    assert(pinned.y>=label.y+label.height,'Pinned editor sits below its label');
    assert(Math.abs(pinned.width-form.width)<1,'Multiline editor uses the available form width');
    for(const container of await page.locator('.checkboxContainer:has(>.fieldDescription)').all()){
      const l=await container.locator('label').boundingBox(),h=await container.locator('.fieldDescription').boundingBox();
      assert(h.y>=l.y+l.height,'Description flows below its checkbox');
    }
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
    await page.setContent(`<html class="layout-desktop"><head><style>${native}</style></head><body><main id="itemDetailPage"><div style="padding:32px"><p class="overview">Overview</p><div class="overview-controls"><a class="overview-expand emby-button" href="#">Show more</a></div></div></main></body></html>`);
    await page.addStyleTag({content:css});
    const overview=await page.locator('.overview-controls').boundingBox(),expand=await page.locator('.overview-expand').boundingBox();
    assert(Math.abs(expand.x-overview.x)<1,'Overview expansion aligns at the text edge');
    assert(overview.width<=640+.1);
    const track=(name,value,hidden=false)=>`<div class="trackSelectionFieldContainer selectContainer ${hidden?'hide':''}"><label class="selectLabel" for="${name}">${name}</label><select id="${name}" class="detailTrackSelect"><option>${value}</option><option>Another ${name} track</option></select><div class="selectArrowContainer">⌄</div></div>`;
    await page.setContent(`<html class="layout-desktop"><body><main id="itemDetailPage"><form class="trackSelections"><div class="ng-format-badges"><span class="ng-format-badge">4K</span><span class="ng-format-badge">Dolby TrueHD</span></div>${track('Video','Open Matte - 4K - H264 - SDR')}${track('Audio','English - Dolby TrueHD + Dolby Atmos - 7.1')}${track('Subtitles','English - SUBRIP')}${track('Version','Hidden source',true)}</form></main></body></html>`);
    await page.addStyleTag({content:css});
    await page.addStyleTag({content:'.hide{display:none!important}'});
    const rows=await page.locator('.trackSelectionFieldContainer:not(.hide)').all();
    let bottom=(await page.locator('.ng-format-badges').boundingBox()).y+(await page.locator('.ng-format-badges').boundingBox()).height;
    for(const row of rows){
      const r=await row.boundingBox(),l=await row.locator('label').boundingBox(),s=await row.locator('select').boundingBox();
      assert(r.y>=bottom-.1,'Track rows follow badges and stack vertically');bottom=r.y+r.height;
      assert(r.height>=44&&r.height<=50,'Track rows are slim but retain touch targets');
      assert(s.x>=l.x+l.width,'Native selector sits beside its label');
      assert(s.width>r.width/2,'Values use most of the row width');
      await row.locator('select').selectOption({index:1});
      assert.match(await row.locator('select').inputValue(),/Another/);
    }
    assert.equal(await page.locator('.trackSelectionFieldContainer.hide').isVisible(),false);
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
    await page.locator('.ng-format-badges').evaluate(e=>e.remove());
    assert.equal((await rows[0].boundingBox()).y,(await page.locator('.trackSelections').boundingBox()).y,'CSS-only tracks leave no blank badge row');
    await page.setContent(`<html class="layout-desktop"><body><header class="MuiAppBar-root"><a class="MuiButton-root" href="#/"><span class="MuiButton-startIcon"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'/%3E#icon-transparent" alt=""></span></a></header><div class="backgroundContainer withBackdrop"></div><main id="loginPage"><div class="padded-left padded-right padded-bottom-page"><form class="manualLoginForm"><div class="inputContainer"><label>User</label><input class="emby-input" aria-label="User"></div><div class="inputContainer"><label>Password</label><input class="emby-input" aria-label="Password"></div><label class="checkboxContainer">Remember Me</label><button class="emby-button">Sign in</button><div style="margin-top:.5em"><button class="btnCancel hide">Cancel</button></div></form><div class="readOnlyContent" style="margin:.5em auto 1em"><button class="emby-button">Quick Connect</button><button class="emby-button" style="margin-top:.5em">Forgot Password</button></div></div></main></body></html>`);
    await page.addStyleTag({content:css});
    await page.addStyleTag({content:'.hide{display:none!important}'});
    const card=await page.locator('#loginPage > div').boundingBox(),center=card.x+card.width/2;
    for(const control of await page.locator('#loginPage .inputContainer,#loginPage .checkboxContainer,#loginPage .emby-button').all()){
      const r=await control.boundingBox();assert(Math.abs(r.x+r.width/2-center)<1,'Login controls share the card center');assert(r.width<=320+.1);
    }
    const actions=await page.locator('#loginPage .emby-button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
    for(let i=1;i<actions.length;i++)assert(Math.abs(actions[i].y-actions[i-1].bottom-12)<.1,`Sign-in actions use equal 12px gaps: action ${i} gap ${actions[i].y-actions[i-1].bottom}`);
    for(const scale of [0,.7,1,2]){
      const override=await page.addStyleTag({content:`:root{--ng-glass-opacity-scale:${scale}}`});
      assert.equal(await page.locator('.MuiAppBar-root').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
      assert.equal(await page.locator('.MuiAppBar-root a').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
      assert.equal(await page.locator('#loginPage > div').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(32, 32, 35)');
      assert.equal(await page.locator('.backgroundContainer').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
      await override.evaluate(e=>e.remove());
    }
    await page.locator('.backgroundContainer').evaluate(e=>e.classList.remove('withBackdrop'));
    assert.equal(await page.locator('.backgroundContainer').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
    await page.setContent(`<html class="layout-desktop"><body><div class="dialog formDialog"><div class="imageEditorCard" style="width:136px"><div class="cardFooter" style="overflow:hidden;padding:8px"><div class="cardText" style="white-space:nowrap"><button disabled title="Move left">Left</button><button disabled title="Move right">Right</button><button title="Delete">Delete</button></div></div></div></div></body></html>`);
    await page.addStyleTag({content:css});
    await page.addStyleTag({content:'.imageEditorCard button{width:44px;height:44px;padding:0}'});
    const footer=await page.locator('.cardFooter').boundingBox();
    for(const button of await page.locator('.imageEditorCard button').all()){
      const b=await button.boundingBox();
      assert(b.x>=footer.x&&b.x+b.width<=footer.x+footer.width+.1,'Image editor actions stay inside the card');
      assert(b.y>=footer.y&&b.y+b.height<=footer.y+footer.height+.1,'Wrapped image actions remain reachable');
    }
    results.push({width,height,mode:'desktop',family:'forms/overview',result:'passed'});
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  await home(await context.newPage(),390,844,true);await context.close();
  await writeFile(path.join(dir,'coverage.json'),JSON.stringify(results,null,2)+'\n');
  console.log(`PASS ${results.length} Desktop form/overview and unified Legacy Home geometry states`);
} finally {await browser.close();}
