import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { sixteenNine, adaptedViewports } from './viewports.mjs';

const css = await readFile(new URL('../dist/noirglass.min.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../plugin/NoirGlass.Plugin/Configuration/configPage.html', import.meta.url), 'utf8');
const popular = [[1920,1080],[2560,1440],[1366,768],[1440,900]];
const sizes = [...popular, ...sixteenNine.filter(([w,h]) => !popular.some(([x,y]) => x===w && y===h)), ...adaptedViewports.filter(([w]) => w>=1024), [999,800],[1000,800]];
const browser = await chromium.launch({headless:true});
let states = 0;
try {
  const page = await browser.newPage();
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    await page.setContent(html);
    await page.evaluate(() => {
      document.documentElement.classList.add('layout-desktop'); document.body.classList.add('dashboardDocument');
      document.querySelector('.pluginConfigurationPage').classList.add('mainAnimatedPage');
      window.Dashboard={showLoadingMsg(){},hideLoadingMsg(){},processPluginConfigurationUpdateResult(){}};
      window.ApiClient={getCurrentUserId:()=> 'fixture', getUserViews:async()=>({Items:[{Id:'library',Name:'A library with a deliberately long descriptive destination name'}]}),getPluginConfiguration:async()=>({HomeLinks:[{Kind:'collections',Label:'Collections'},{Kind:'library',LibraryId:'library',Label:'Cinema'}]})};
      document.querySelector('#NoirGlassConfigPage').dispatchEvent(new Event('pageshow'));
    });
    await page.addStyleTag({content:'html{font-size:14.88px}body{margin:0}.content-primary{padding:32px}.inputLabel{display:inline}.block{display:block;width:100%}.checkboxContainer{display:flex}.checkboxContainer>label{flex:1}'});
    await page.addStyleTag({content:css});
    await page.waitForSelector('.ng-plugin-link-row');
    const geometry = await page.evaluate(() => {
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
      const form=document.querySelector('form');
      return {form:rect(form),page:rect(document.querySelector('.content-primary')),save:rect(form.querySelector('[type=submit]')),overflow:document.documentElement.scrollWidth>innerWidth,
        fields:[...form.querySelectorAll('.inputContainer,.selectContainer')].map(e=>({container:rect(e),label:rect(e.querySelector('label')),input:rect(e.querySelector('input,textarea,select')),multiline:!!e.querySelector('textarea')})),
        rows:[...form.querySelectorAll('.ng-plugin-link-row')].map(e=>({row:rect(e),actions:rect(e.querySelector('.ng-plugin-link-actions')),buttons:[...e.querySelectorAll('button')].map(rect)}))};
    });
    assert(geometry.form.width<=56*14.88+1, 'Form stays bounded on wide Dashboard pages');
    assert.equal(geometry.form.x,geometry.save.x,'Save is left-aligned');
    assert(geometry.save.width<=320.1,'Save stays compact');
    assert(!geometry.overflow,`${width}: no document overflow`);
    for(const field of geometry.fields){
      assert(field.input.y>=field.label.y+field.label.height-.1,'Label appears above control');
      assert(Math.abs(field.input.x-field.label.x)<1,'Label and control align');
      assert(Math.abs(field.input.width-field.container.width)<1,'Control fills its own compact wrapper');
    }
    for(const row of geometry.rows) for(const b of row.buttons) {
      assert(b.x>=row.row.x-.1 && b.x+b.width<=row.row.x+row.row.width+.1,'Link actions stay inside form');
    }
    assert(await page.locator('.ng-plugin-link-actions button').first().isDisabled(),'First link cannot move up');
    await page.locator('.ng-plugin-link-actions button').filter({hasText:'Move up'}).nth(1).click();
    assert.equal(await page.locator('#NoirGlassLinkList input').first().inputValue(),'Cinema','Reordering retains edited labels');
    await page.locator('.ng-plugin-link-actions button').filter({hasText:'Remove'}).first().click();
    assert.equal(await page.locator('.ng-plugin-link-row').count(),1);
    await page.locator('.ng-plugin-link-actions button').filter({hasText:'Remove'}).click();
    assert.equal(await page.locator('.ng-plugin-link-row').count(),0,'Empty list remains usable');
    states++;
  }
  console.log(`PASS ${states} Desktop plugin-form layouts: bounded width, label alignment, multiline sizing, action wrapping, disabled controls, reorder and empty lists`);
} finally { await browser.close(); }
