import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await readFile(new URL('../plugin/NoirGlass.Plugin/Configuration/configPage.html',import.meta.url),'utf8');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.setContent(html);
 await page.evaluate(()=>{window.fixture={config:{RotationRevision:'preserve-me',FeaturedIntervalSeconds:15},saved:[],rotations:0,fail:false};window.Dashboard={showLoadingMsg(){},hideLoadingMsg(){},processPluginConfigurationUpdateResult(){}};window.ApiClient={getCurrentUserId:()=> 'admin',getPluginConfiguration:async()=>({...window.fixture.config}),getUserViews:async()=>({Items:[{Id:'1234567890abcdef1234567890abcdef',Name:'Cinema'}]}),updatePluginConfiguration:async(_id,config)=>{window.fixture.saved.push(config);return{};},getUrl:p=>p,ajax:async options=>{if(window.fixture.fail)throw Error('offline');window.fixture.rotations++;window.fixture.request=options;return{rotationRevision:'new'};}};document.querySelector('#NoirGlassConfigPage').dispatchEvent(new Event('pageshow'));});
 await page.waitForFunction(()=>document.querySelector('#NoirGlassCount').value==='10');
 assert.equal(await page.locator('#NoirGlassInterval').inputValue(),'15','Previously saved autoplay remains unchanged');assert.equal(await page.locator('#NoirGlassRefresh').inputValue(),'360');
 await page.locator('#NoirGlassCount').fill('2500');await page.locator('#NoirGlassInterval').fill('10');await page.locator('#NoirGlassRefresh').fill('0');
 await page.locator('#NoirGlassAddLink').click();await page.locator('#NoirGlassLibrary').selectOption('1234567890abcdef1234567890abcdef');await page.locator('#NoirGlassAddLink').click();await page.locator('#NoirGlassLinkList input').nth(1).fill('Cinema Nights');
 await page.locator('#NoirGlassLinkList button').filter({hasText:'Move up'}).nth(1).click();
 await page.locator('#NoirGlassConfigForm button[type=submit]').click();await page.waitForFunction(()=>window.fixture.saved.length===1);
 const config=await page.evaluate(()=>window.fixture.saved[0]);assert.equal(config.FeaturedItemCount,2500);assert.equal(config.LineupRefreshMinutes,0);assert.equal(config.RotationRevision,'preserve-me');assert.deepEqual(config.HomeLinks.map(x=>x.Kind),['library','collections']);assert.equal(config.HomeLinks[0].Label,'Cinema Nights');
 await page.locator('#NoirGlassInterval').fill('3');await page.locator('#NoirGlassConfigForm button[type=submit]').click();assert.equal(await page.evaluate(()=>window.fixture.saved.length),1,'Invalid intervals are not saved');
 await page.locator('#NoirGlassRotate').click();assert.equal(await page.evaluate(()=>window.fixture.rotations),1);assert.equal(await page.evaluate(()=>window.fixture.request.type),'POST');assert.equal(await page.evaluate(()=>window.fixture.request.url),'NoirGlass/Rotate');
 await page.evaluate(()=>window.fixture.fail=true);await page.locator('#NoirGlassRotate').click();assert((await page.locator('#NoirGlassRotationStatus').textContent()).includes('failed'));assert(!await page.locator('#NoirGlassRotate').isDisabled());
 console.log('PASS plugin settings defaults, preserved intervals/revisions, count, ordered labels, validation and Rotate Now success/failure');
}finally{await browser.close();}
