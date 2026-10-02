import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';

// Native templates/state contracts, with harmless local handlers only.
// https://github.com/jellyfin/jellyfin-web/blob/master/src/components/dialog/dialog.js
// https://github.com/jellyfin/jellyfin-web/blob/master/src/elements/emby-ratingbutton/emby-ratingbutton.js
// https://github.com/jellyfin/jellyfin-web/blob/master/src/components/userdatabuttons/userdatabuttons.js
const css = await readFile(path.join(root,'dist/noirglass.min.css'),'utf8');
const dir = path.join(root,'test-results/polish');
await mkdir(dir,{recursive:true});
const browser = await chromium.launch({headless:true});
const sizes = [[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,2160],[390,844]];
const scaffold = `html{font-size:14.88px;overflow-y:scroll}*{box-sizing:border-box}body{margin:0;padding:32px}.form{width:100%}.inputContainer,.selectContainer,.MuiFormControl-root,input,select,textarea,.MuiInputBase-root{display:block;width:100%}label{display:block}.nested{width:240px}.compact{max-width:180px}.material-icons{display:inline-block;font-size:24px}.cardOverlayButton .cardOverlayButtonIcon{display:block;width:auto;height:auto;background:transparent}button{cursor:pointer}.hearts{display:flex;gap:16px;flex-wrap:wrap}.dialog{position:fixed;background:#111}.formDialogHeader{width:80%;margin:auto}.formDialogContent{box-sizing:content-box}.formDialogFooter{margin:1em}.formDialogFooterItem{padding:1em}.formDialogContent{overflow:auto}.dialog-fullscreen-lowres{min-height:100%;height:100%;top:0;left:0}.MuiDialog-paper{display:flex;flex-direction:column;width:340px}.MuiDialog-root{position:fixed;inset:0;display:grid;place-items:center}.MuiDialogActions-root{display:flex}.MuiDialogContent-root{padding:18px}@media(max-width:48rem){body{padding:16px}}`;
const field = (id, extra='') => `<div class="inputContainer ${extra}" id="${id}"><label for="${id}-input">A readable field label</label><input class="emby-input" id="${id}-input" value="Example"><div class="fieldDescription">Help text stays with the input.</div></div>`;
const fields = `<form class="form">${field('normal')}<div id="mui" class="MuiFormControl-root MuiTextField-root"><label class="MuiInputLabel-root">MUI field</label><div class="MuiInputBase-root"><input class="MuiInputBase-input"></div><p class="MuiFormHelperText-root">Help text</p></div><div class="selectContainer" id="select"><label>Select</label><select class="emby-select"><option>Example</option></select></div><div class="nested">${field('nested')}</div>${field('compact','compact')}<div class="inputContainer" id="explicit" style="width:160px"><input class="emby-input"></div><div class="inputContainer" id="multiline"><label>Custom CSS</label><textarea class="emby-textarea"></textarea></div><div class="MuiFormControl-root" id="mui-multiline"><div class="MuiInputBase-root MuiInputBase-multiline"><textarea></textarea></div></div><div id="searchPage"><div class="inputContainer" id="search"><input class="emby-input" type="search"></div></div><div class="trackSelections"><div class="selectContainer" id="track"><select class="emby-select"><option>Audio</option></select></div></div><div class="inputContainer" id="file"><input type="file"></div><div class="inputContainer" id="range"><input type="range"></div><div class="checkboxContainer" id="checkbox"><input type="checkbox"></div></form>`;
const heart = (id, attrs, classes='') => `<button id="${id}" ${attrs} class="paper-icon-button-light emby-button ${classes}" aria-label="Favorite"><span class="material-icons favorite cardOverlayButtonIcon">favorite</span></button>`;
const hearts = `<div class="hearts">${heart('poster','data-isfavorite="false"','cardOverlayButton')}${heart('detail','data-isfavorite="false"','ratingbutton')}${heart('episode','data-isfavorite="false"','listItemButton')}${heart('list','data-method="markFavorite"','btnUserData')}${heart('player','data-isfavorite="false"','btnUserRating')}${heart('fallback','','ratingbutton')}<a id="navigation" class="navMenuOption"><span class="material-icons favorite">favorite</span>Favorites</a></div>`;
const confirmation = text => `<div role="dialog" aria-modal="true" class="dialog formDialog dialog-fullscreen-lowres centeredDialog opened"><div class="formDialogHeader formDialogHeader-clear justify-content-center"><h1 class="formDialogHeaderTitle" style="margin-top:.5em;padding:0 1em">Confirmation</h1></div><div class="formDialogContent smoothScrollY no-grow" style="max-width:500px"><div class="dialogContentInner dialog-content-centered" style="padding-top:1em;padding-bottom:1em"><div class="text">${text}</div></div></div><div class="formDialogFooter formDialogFooter-clear formDialogFooter-flex" style="margin:1em"><button data-id="cancel" class="btnOption emby-button raised formDialogFooterItem formDialogFooterItem-autosize button-cancel">Cancel</button><button data-id="ok" class="btnOption emby-button raised formDialogFooterItem formDialogFooterItem-autosize button-submit">Continue</button></div></div>`;
const results=[];
try {
  for(const [width,height] of sizes) {
    const context=await browser.newContext({viewport:{width,height},hasTouch:width===390});
    const page=await context.newPage();
    const load=async markup=>{await page.setContent(`<html class="layout-${width===390?'mobile':'desktop'}"><head><style>${scaffold}</style></head><body>${markup}</body></html>`);await page.addStyleTag({content:css});await page.evaluate(()=>document.fonts.ready);};
    await load(fields);
    const geometry=await page.evaluate(()=>{const w=s=>document.querySelector(s).getBoundingClientRect().width;return {form:w('form'),normal:w('#normal'),mui:w('#mui'),select:w('#select'),nested:w('#nested'),compact:w('#compact'),explicit:w('#explicit'),multiline:w('#multiline'),muiMultiline:w('#mui-multiline'),search:w('#search'),track:w('#track'),file:w('#file'),range:w('#range'),checkbox:w('#checkbox'),input:w('#normal input'),help:w('#normal .fieldDescription'),label:w('#normal label'),overflow:document.documentElement.scrollWidth>innerWidth};});
    const expected=width===390?geometry.form:Math.min(geometry.form,Math.max(320,Math.min(geometry.form*.5,Math.max(geometry.form*.25,48*14.88))));
    for(const key of ['normal','mui','select','input','help','label']) assert(Math.abs(geometry[key]-expected)<1,`${width}: ${key} width`);
    assert.equal(geometry.nested,240,'Minimum is capped by parent');
    assert.equal(geometry.compact,180,'Already compact field stays compact');assert.equal(geometry.explicit,160,'Explicit sizing stays native');
    for(const key of ['multiline','muiMultiline','search','track','file','range','checkbox']) assert.equal(geometry[key],geometry.form,`${key} exception`);
    assert(!geometry.overflow,'Fields do not widen page');
    await page.addStyleTag({content:':root{--ng-form-field-width:40%;--ng-form-field-min-width:200px}'});
    assert(Math.abs((await page.locator('#normal').boundingBox()).width-Math.min(geometry.form,Math.max(200,geometry.form*.4)))<1,'Post-import field overrides');
    results.push({width,height,kind:'fields',...geometry});

    await load(hearts);
    for(const id of ['poster','detail','episode','list','player','fallback']) {
      const button=page.locator('#'+id),icon=button.locator('.favorite');
      const state=()=>icon.evaluate(e=>({color:getComputedStyle(e).color,mask:getComputedStyle(e).maskImage}));
      const iconBox=await icon.boundingBox();assert(iconBox.width>=20&&iconBox.height>=20,"Native glyph sizing cannot collapse masked icons");assert.notEqual(await icon.evaluate(e=>getComputedStyle(e).backgroundColor),"rgba(0, 0, 0, 0)","Masked silhouette has a visible fill");const off=await state();assert.equal(off.color,'rgb(245, 245, 247)');assert(off.mask.startsWith('url("data:image/svg+xml,'),'Standalone CSS embeds outline');
      await button.evaluate((e,id)=>{e.onclick=()=>{if(id==='list')e.classList.toggle('btnUserDataOn');else if(id==='fallback')e.classList.toggle('ratingbutton-withrating');else e.dataset.isfavorite=e.dataset.isfavorite==='true'?'false':'true';};},id);
      await button.click();const on=await state();assert.equal(on.color,'rgb(255, 69, 58)');assert.notEqual(on.mask,off.mask,'Filled silhouette differs');
      await button.hover();assert.equal((await state()).color,on.color,'Red on hover');await page.keyboard.press('Tab');await button.focus();assert.equal((await state()).color,on.color,'Red on keyboard focus');
      await button.click();assert.deepEqual(await state(),off,'Native state transition restores outline');
      await button.evaluate(e=>{e.dataset.isfavorite='false';e.classList.add('ratingbutton-withrating','btnUserDataOn');});assert.deepEqual(await state(),off,'Explicit false attribute overrides stale fallback classes');
    }
    assert.equal(await page.locator('#navigation .favorite').evaluate(e=>getComputedStyle(e).maskImage),'none','Navigation unaffected');
    await page.addStyleTag({content:':root{--ng-favorite-color:#ff00ff}'});await page.locator('#poster').click();assert.equal(await page.locator('#poster .favorite').evaluate(e=>getComputedStyle(e).color),'rgb(255, 0, 255)','Favorite override');
    await page.screenshot({path:path.join(dir,`hearts-${width}.png`)});results.push({width,height,kind:'favorites'});

    for(const long of [false,true]) {
      await load(confirmation(long?'Long confirmation message with wrapping text. '.repeat(200):'This operation needs confirmation.'));
      const dialog=page.locator('.dialog');
      const b=await dialog.boundingBox();assert(b.x>=16&&b.y>=16&&b.x+b.width<=width-16&&b.y+b.height<=height-16,'Viewport clearance');
      assert(Math.abs(b.x+b.width/2-(await page.evaluate(()=>document.documentElement.clientWidth))/2)<1&&Math.abs(b.y+b.height/2-height/2)<1,'Centered confirmation');
      if(!long)assert(b.height<height*.5,'Short mobile confirmation is compact');
      for(const s of ['.formDialogHeader','.formDialogFooter','.formDialogContent']){const r=await page.locator(s).boundingBox();assert(r.x>=b.x&&r.x+r.width<=b.x+b.width+.1,'No inset header strip or content spill');if(s!=='.formDialogContent')assert(Math.abs(r.width-(b.width-2))<1,'Aligned header/footer');}
      if(long)assert(await page.locator('.formDialogContent').evaluate(e=>e.scrollHeight>e.clientHeight),'Long content scrolls internally');
      await page.locator('[data-id=ok]').evaluate(e=>{e.dataset.id='delete';e.classList.add('button-delete');});assert.equal(await page.locator('[data-id=delete]').evaluate(e=>getComputedStyle(e).color),'rgb(255, 155, 152)','Destructive action overrides primary submit styling');
      const footer=await page.locator('.formDialogFooter').boundingBox();assert(footer.y+footer.height<=height-16,'Reachable footer');
      await page.locator('[data-id=cancel]').evaluate(e=>e.onclick=()=>e.closest('.dialog').remove());await page.keyboard.press('Tab');await page.locator('[data-id=cancel]').focus();assert.equal(await page.locator('[data-id=cancel]').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
      await page.screenshot({path:path.join(dir,`confirmation-${long?'long':'short'}-${width}.png`)});await page.locator('[data-id=cancel]').click();assert.equal(await dialog.count(),0,'Cancel dismisses without a consequential handler');results.push({width,height,kind:'confirmation',long});
    }
    // Restart/shutdown/delete/uninstall/restore/task and playback errors use
    // these shared MUI/Legacy surfaces; never attach or activate server actions.
    for(const title of ['Restart server','Shut down','Delete item','Uninstall plugin','Restore backup','Refresh metadata','Scan library','Run scheduled task','Playback error']) {
      await load(`<div class="MuiDialog-root"><div class="MuiDialog-paper" role="dialog"><h2 class="MuiDialogTitle-root">${title}</h2><div class="MuiDialogContent-root">Confirm or dismiss this message.</div><div class="MuiDialogActions-root"><button class="MuiButton-root">Cancel</button><button class="MuiButton-root MuiButton-colorError">${title}</button></div></div></div>`);
      assert.equal(await page.locator('.MuiDialog-paper').evaluate(e=>getComputedStyle(e).borderRadius),'20px');assert.equal(await page.locator('.MuiButton-colorError').evaluate(e=>getComputedStyle(e).color),'rgb(255, 155, 152)');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    results.push({width,height,kind:'shared-prompts',count:9});await context.close();
  }
  await writeFile(path.join(dir,'geometry.json'),JSON.stringify(results,null,2)+'\n');
  console.log(`PASS ${results.length} polish states at six resolutions: field geometry/exceptions/overrides, native favorite states and compact/scrolling confirmations; nine shared prompt presentations per size`);
} finally {await browser.close();}
