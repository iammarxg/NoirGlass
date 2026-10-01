import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './build.mjs';
import { fixtures, sources, scaffold } from './ui-fixtures.mjs';

const css = await readFile(path.join(root,'dist/noirglass.min.css'),'utf8');
const browser = await chromium.launch({headless:true});
const dir = path.join(root,'test-results/ui');
await mkdir(dir,{recursive:true});
const results=[];
try {
  for(const width of [1920,1440,390]) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:width===1920?1080:900},hasTouch:width===390});
    const page=await context.newPage();
    for(const fixture of fixtures) {
      const admin=fixture.source==='dashboard';
      await page.setContent(`<!doctype html><html class="${width===390?'layout-mobile':'layout-desktop'}"><head><style>${scaffold}</style></head><body class="${admin?'dashboardDocument':''}">${fixture.markup}</body></html>`);
      await page.addStyleTag({content:css});
      await page.evaluate(()=>document.fonts.ready);
      for(const selector of fixture.selectors) assert(await page.locator(selector).count(),`Missing ${fixture.id} selector ${selector}`);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${fixture.id} ${width}: document overflow`);
      const first=page.locator('input:not([disabled]):not([type=checkbox]):not([type=radio]),button:not([disabled]),a').first();
      if(await first.count()) {
        await page.keyboard.press('Tab');
        await first.focus();
        assert.equal(await first.evaluate(node=>getComputedStyle(node.closest('.MuiInputBase-root') || node).outlineStyle),'solid',`${fixture.id}: keyboard focus`);
      }
      for(const selector of ['.emby-input:not([type=color])','.emby-select','.MuiInputBase-root']) {
        for(const node of await page.locator(selector).all()) {
          const box=await node.boundingBox();
          assert(!box || box.height>=48,`${fixture.id}: field below 48px`);
          assert.equal(await node.evaluate(el=>getComputedStyle(el).borderRadius),'14px');
        }
      }
      for(const node of await page.locator('.actionSheetMenuItem,.MuiButton-root,.MuiIconButton-root').all()) {
        const box=await node.boundingBox();
        assert(!box || box.height>=44,`${fixture.id}: touch target below 44px`);
      }
      if(fixture.id==='legacy-forms') {
        await page.locator('input[type=checkbox]').uncheck();
        assert.equal(await page.locator('input[type=checkbox]').isChecked(),false);
        assert.equal(await page.locator('[aria-invalid=true]').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(255, 155, 152)');
        assert.equal(await page.locator('[disabled]').evaluate(el=>getComputedStyle(el).opacity),'0.45');
        await page.locator('input').first().fill('Readable input text');
        assert.equal(await page.locator('input').first().inputValue(),'Readable input text');
      }
      if(fixture.id==='mui-forms') {
        await page.locator('#indeterminate').evaluate(el=>el.indeterminate=true);
        assert(await page.locator('#indeterminate').evaluate(el=>el.indeterminate));
        assert.equal(await page.locator('.MuiCheckbox-indeterminate').evaluate(el=>getComputedStyle(el).color),'rgba(242, 242, 245, 0.85)');
      }
      if(fixture.id==='selected-contrast') assert.equal(await page.locator('.MuiTypography-root').evaluate(el=>getComputedStyle(el).color),'rgb(21, 21, 23)','Selected destination text must be dark');
      if(fixture.id==='native-radios') {
        assert.equal(await page.locator('.mdl-radio__circles').evaluate(el=>getComputedStyle(el).color),'rgba(242, 242, 245, 0.85)');
        assert((await page.locator('.mdl-radio').boundingBox()).height>=44);
        assert.equal(await page.locator('[data-id=delete]').evaluate(el=>getComputedStyle(el).color),'rgb(255, 155, 152)');
      }
      if(fixture.id==='editor') {
        await page.locator('.formDialogContent').evaluate(el=>el.scrollTop=el.scrollHeight);
        assert(await page.locator('.formDialogContent').evaluate(el=>el.scrollTop>0),'Long editor must scroll internally');
        const footer=await page.locator('.formDialogFooter').boundingBox();
        assert(footer.y+footer.height<=await page.evaluate(()=>innerHeight),'Footer actions must remain visible');
      }
      if(fixture.id==='table' && width===390) assert(await page.locator('.MuiTableContainer-root').evaluate(el=>el.scrollWidth>el.clientWidth),'Wide table must scroll locally');
      if(fixture.id==='player-surfaces') {
        assert.equal(await page.locator('.videoSubtitles span').evaluate(el=>getComputedStyle(el).fontFamily),'monospace');
        assert.equal(await page.locator('.videoSubtitles span').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 0)');
      }
      await page.screenshot({path:path.join(dir,`${fixture.id}-${width}.png`),animations:'disabled'});
      // Fixture-only interactions: no save, install, delete or credential action.
      await page.evaluate(()=>{
        document.querySelectorAll('.fixture-expand').forEach(button=>button.onclick=()=>{
          const expanded=button.getAttribute('aria-expanded')!=='true';
          button.setAttribute('aria-expanded',String(expanded));
          button.parentElement.querySelector('.fixture-expanded').hidden=!expanded;
        });
        document.querySelectorAll('.fixture-close').forEach(button=>button.onclick=()=>button.closest('.dialog,.MuiDialog-root,.playerStats')?.remove());
      });
      if(await page.locator('.fixture-expand').count()) {
        await page.locator('.fixture-expand').first().click();
        assert(await page.locator('.fixture-expanded').first().isVisible());
      }
      if(await page.locator('.fixture-nested').count()) {
        await page.locator('.fixture-nested').first().evaluate(button=>button.onclick=()=>{
          const nested=document.createElement('div');nested.className='dialog formDialog';nested.innerHTML='<header class="formDialogHeader">Confirmation (fixture)</header><div class="formDialogContent">Confirm a native action</div><div class="formDialogFooter"><button class="raised emby-button">Cancel</button></div>';document.body.append(nested);
        });
        await page.locator('.fixture-nested').first().click();
        assert(await page.getByText('Confirmation (fixture)',{exact:true}).isVisible());
      }
      results.push({family:fixture.id,width,mode:width===390?'Mobile class fixture':'Desktop class fixture',source:sources[fixture.source],liveAudit:fixture.captures,selectors:fixture.selectors,result:'passed'});
    }
    // All six native view families use source-backed structural classes; sizing
    // is allowed to differ, and no live display preference is saved.
    for(const view of ['bannerCard','list','portraitCard','portraitCard cardWithText','backdropCard','backdropCard cardWithText']) {
      const markup=view==='list'?'<div class="listItem"><div class="listItemBody">List item</div></div>':`<div class="card ${view}"><div class="cardBox"><div class="cardImageContainer" style="aspect-ratio:${view.includes('portrait')?'2/3':view==='bannerCard'?'4/1':'16/9'}"></div><div class="cardText">Long title</div></div></div>`;
      await page.setContent(`<style>${scaffold}</style><div class="libraryPage"><div class="itemsContainer vertical-wrap">${markup.repeat(8)}</div></div>`);
      await page.addStyleTag({content:css});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Library ${view} ${width} overflow`);
      results.push({family:`library-${view}`,width,result:'passed',source:sources.dialogs});
    }
    await context.close();
  }
  await writeFile(path.join(dir,'coverage.json'),JSON.stringify(results,null,2)+'\n');
  console.log(`PASS ${results.length} shared component / Library layout fixtures at three viewports; fields, focus, touch targets, states, internal scrolling and subtitle isolation`);
} finally {await browser.close();}
