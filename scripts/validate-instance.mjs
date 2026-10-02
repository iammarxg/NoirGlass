import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
await mkdir(path.join(root,'.local/verification'),{recursive:true});
const profile = JSON.parse(await readFile(path.join(root,'.local/instance.json'),'utf8'));
const css = await readFile(path.join(root,'dist/noirglass.min.css'),'utf8');
// Transfer the already authorized browser session in memory. Never log or save it.
const response = await fetch('http://127.0.0.1:4319', { method:'POST', body:JSON.stringify({action:'evaluate',expression:'Object.fromEntries(Object.entries(localStorage))'}) });
assert(response.ok,'Sign in manually using npm run browser first');
const storage = await response.json();
const browser = await chromium.launch({ headless:true, ...(process.env.NOIRGLASS_BROWSER_EXECUTABLE ? {executablePath:process.env.NOIRGLASS_BROWSER_EXECUTABLE}: {}) });
await mkdir(path.join(root,'docs/images'),{recursive:true});
await mkdir(path.join(root,'test-results'),{recursive:true});
const report = { date:new Date().toISOString(), browser:browser.version(), server:'12.1.0', web:'12.1', checks:[], limitations:[] };
let lastPage;
function pass(name, details={}) { report.checks.push({name,result:'passed',...details}); console.log(`PASS ${name}`); }
async function setup(mode, signedIn=true) {
  const viewport = mode==='desktop' ? {width:1440,height:900} : {width:390,height:844};
  const entries = signedIn ? {...storage} : {};
  entries.layout = `${mode}-legacy`;
  const context = await browser.newContext({ viewport, storageState:{cookies:[],origins:[{origin:profile.origin,localStorage:Object.entries(entries).map(([name,value])=>({name,value}))}]}, deviceScaleFactor:1 });
  await context.route('https://noirglass.invalid/**',r=>r.fulfill({contentType:'text/css',body:css}));
  const page = await context.newPage();
  lastPage=page;
  return {context,page,viewport};
}
async function theme(page) {
  await page.evaluate(() => {
    document.querySelector('#noirglass-preview')?.remove();
  });
  await page.addStyleTag({content:'@import url("https://noirglass.invalid/dist/noirglass.min.css");'}).then(h=>h.evaluate(e=>{e.id='noirglass-preview';document.body.append(e);}));
  await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--ng-bg').trim()==='#000');
  await page.evaluate(()=>document.fonts.ready);
}
async function visit(page,hash,ready) {
  await page.goto(`${profile.origin}/web/?ng-validation=${Date.now()}#/${hash}`,{waitUntil:'domcontentloaded'});
  await page.locator(ready).first().waitFor({state:'visible',timeout:30000});
  await page.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{});
  await page.waitForTimeout(2000);
  await theme(page);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(1200);
  await page.evaluate(async()=>{
    await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight && i.getBoundingClientRect().bottom>0).map(i=>Promise.race([i.decode().catch(()=>{}),new Promise(r=>setTimeout(r,3000))])));
  });
}
async function overflow(page,name) {
  const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(dimensions.scroll<=dimensions.width,`${name}: horizontal overflow ${JSON.stringify(dimensions)}`);
  pass(`${name}: no horizontal overflow`,dimensions);
}
async function capture(page,name) { await page.screenshot({path:path.join(root,'test-results',`instance-${name}.png`),animations:'disabled'}); }
try {
  for(const mode of (process.env.NOIRGLASS_TEST_MODE ? [process.env.NOIRGLASS_TEST_MODE] : ['desktop','mobile'])) {
    const {context,page,viewport}=await setup(mode);
    await visit(page,'home','#indexPage:not(.hide) .card');
    assert(await page.evaluate(()=>document.documentElement.classList.contains('layout-'+(innerWidth<500?'mobile':'desktop'))));
    assert(await page.evaluate(()=>document.fonts.check('16px "Inter Variable"')));
    pass(`${mode}: legacy home, embedded font`,{viewport});
    await overflow(page,`${mode} home`);
    await capture(page,`${mode}-home`);
    await page.evaluate(()=>window.scrollTo(0,600));
    assert(await page.locator('.skinHeader').first().isVisible());
    pass(`${mode}: header after scrolling`);
    await visit(page,`movies?topParentId=${profile.library}&collectionType=movies`,'.itemsContainer .card');
    await overflow(page,`${mode} library`);
    await capture(page,`${mode}-library`);
    const card=page.locator('.card:visible .cardBox').first();
    if(mode==='desktop') {
      await card.hover();
      await page.waitForTimeout(250);
      assert.notEqual(await card.evaluate(e=>getComputedStyle(e).transform),'none');
      pass('desktop: native card hover');
      await page.screenshot({path:path.join(root,'test-results','card-hover.png')});
    }
    await page.keyboard.press('Tab');
    const focus=await page.evaluate(()=>({tag:document.activeElement.tagName,outline:getComputedStyle(document.activeElement).outlineWidth}));
    assert.notEqual(focus.tag,'BODY');
    assert(parseFloat(focus.outline)>=2,'Keyboard focus must have a visible outline');
    pass(`${mode}: keyboard navigation`,focus);
    await visit(page,`details?id=${mode==='desktop'?profile.movie:profile.series}`,'#itemDetailPage:not(.hide) .btnPlay');
    await overflow(page,`${mode} detail`);
    await capture(page,`${mode}-detail`);
    assert(await page.locator('#itemDetailPage:not(.hide) .btnPlay').isVisible());
    pass(`${mode}: detail actions and artwork`);
    await page.locator('#noirglass-preview').evaluate(e=>{e.textContent+='\n:root{--ng-primary-bg:rgb(210,220,230)}';});
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#itemDetailPage:not(.hide) .btnPlay').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(210, 220, 230)');
    pass(`${mode}: override after import`);
    await page.evaluate(()=>{
      const p=document.querySelector('#itemDetailPage:not(.hide)');
      p.querySelector('.detailLogo')?.classList.add('hide');
      p.querySelector('.itemName').textContent='An Extremely Long Film Title That Continues Across Several Lines Without Concealing Any Native Actions';
      for(const b of document.querySelectorAll('.backdropImage')) {b.classList.remove('displayingBackdropImage'); b.style.backgroundImage='none';}
      p.querySelector('#itemBackdrop').style.backgroundImage='none';
    });
    await overflow(page,`${mode} missing artwork and long title`);
    await page.screenshot({path:path.join(root,'test-results',`${mode}-fallback.png`)});
    assert(await page.locator('#itemDetailPage:not(.hide) .itemName').first().isVisible(),'Fallback title is not visible');
    assert(await page.locator('#itemDetailPage:not(.hide) .detailImageContainer .card:visible').count()>0,'Fallback poster is not visible');
    pass(`${mode}: readable fallback title and native poster`);
    await page.screenshot({path:path.join(root,'test-results',`${mode}-fallback.png`)});
    await visit(page,`details?id=${profile.season}`,'#itemDetailPage:not(.hide) #listChildrenCollapsible .listItem');
    assert(await page.locator('#itemDetailPage:not(.hide) .subtitle').isVisible(),'Season heading must remain visible');
    await page.locator('#itemDetailPage:not(.hide) #listChildrenCollapsible').evaluate(e=>{window.scrollTo(0,e.getBoundingClientRect().top+scrollY-110)});
    await overflow(page,`${mode} episodes`);
    await capture(page,`${mode}-episodes`);
    pass(`${mode}: responsive episode list`);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ng-card-lift').trim()),'0px');
    pass(`${mode}: reduced motion`);
    await context.close();
  }
  for(const mode of ['desktop','mobile']) {
    const {context,page}=await setup(mode,false);
    await visit(page,'login','#loginPage');
    const manual=page.locator('.btnManual');
    if(await manual.isVisible()) await manual.click();
    await page.locator('#txtManualName').waitFor({state:'visible'});
    await capture(page,`login-${mode}`);
    await overflow(page,`${mode} login`);
    assert(await page.locator('.btnForgotPassword').isVisible());
    pass(`${mode}: manual login and password recovery available`);
    await context.close();
  }
} catch(error) {
  if(lastPage && !lastPage.isClosed()) {
    await lastPage.screenshot({path:path.join(root,'test-results','validation-failure.png')}).catch(()=>{});
    console.log(await lastPage.evaluate(()=>({title:document.title,layout:document.documentElement.className,pages:[...document.querySelectorAll('[data-role="page"]')].map(e=>({id:e.id,classes:e.className}))})).catch(()=>({})));
  }
  report.limitations.push(error.message.replaceAll(profile.origin,'[private server]').replace(/[a-f0-9]{32}/gi,'[private item]'));
  console.error(error.message);
  process.exitCode=1;
} finally {
  await browser.close();
  await writeFile(path.join(root,'.local/verification/live-pages.json'),JSON.stringify(report,null,2)+'\n');
}
