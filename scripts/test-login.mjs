import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const css = await readFile(new URL('../dist/noirglass.min.css', import.meta.url), 'utf8');
const script = await readFile(new URL('../dist/noirglass.companion.js', import.meta.url), 'utf8');
const browser = await chromium.launch({ headless: true });
const sizes = [[1920,1080],[2560,1440],[1366,768],[1440,900],[854,480],[960,540],[1024,576],[1280,720],[1536,864],[1600,900],[2048,1152],[3200,1800],[3840,2160],[1920,1200],[1024,768],[3440,1440],[5120,1440],[999,800],[1000,800]];
let states = 0;
try {
  for (const variant of ['legacy','react']) {
    const page = await browser.newPage();
    page.on('pageerror',error=>console.error(error.message));
    let flags = { enabled: true, hideBranding: false }, fail = false, delay = 0;
    await page.route('http://login.test/**', async route => {
      const url = route.request().url();
      if (url.endsWith('/NoirGlass/Branding')) return route.fulfill({ json: flags });
      if (url.includes('.svg')) {
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        return route.fulfill({ status: fail ? 404 : 200, contentType: 'image/svg+xml', body: fail ? 'unavailable' : '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="32"><rect width="160" height="32" fill="white"/></svg>' });
      }
      const header = variant === 'legacy'
        ? '<div class="skinHeader"><button id="menu">Menu</button><h3 class="pageTitleWithDefaultLogo" style="background-image:url(/banner.svg);width:160px;height:32px"></h3></div>'
        : '<header class="MuiAppBar-root"><a class="MuiButton-root" href="#/"><span class="MuiButton-startIcon"><img src="/icon-transparent.svg"></span></a></header>';
      return route.fulfill({ contentType: 'text/html', body: '<html class="layout-desktop"><body>'+header+'<div class="backgroundContainer withBackdrop"></div><main id="loginPage"><div class="padded-left padded-right padded-bottom-page"><h1>Please sign in</h1><form class="manualLoginForm"><div class="inputContainer"><label>User<input class="emby-input"></label></div><button class="emby-button">Sign In</button></form><div class="readOnlyContent"><button class="emby-button">Quick Connect</button><button class="emby-button">Forgot Password</button></div></div></main></body></html>' });
    });
    const load = async () => {
      await page.goto('about:blank');
      await page.goto('http://login.test/web/index.html#/login',{waitUntil:'domcontentloaded'});
      await page.addStyleTag({ content: 'body{margin:0}.hide{display:none!important}.skinHeader,.MuiAppBar-root{position:fixed;top:0}'+css });
      if (delay) await page.evaluate(() => { const img=document.querySelector('.MuiAppBar-root img'),legacy=document.querySelector('.pageTitleWithDefaultLogo'); if(img)img.src='/icon-transparent-delayed.svg';else legacy.style.backgroundImage='url(/banner-delayed.svg)'; });
      await page.addScriptTag({ content: script });
    };
    for (const [width,height] of sizes) {
      await page.setViewportSize({ width, height }); await load();
      await page.waitForSelector('.ng-login-brand');
      assert.equal(await page.locator('.ng-login-brand').count(), 1);
      const row = await page.locator('.ng-login-brand').boundingBox(), heading = await page.locator('h1').boundingBox();
      assert.equal(row.height, 32); assert.equal(heading.y-row.y-row.height, 12);
      assert.equal(await page.locator('.skinHeader,.MuiAppBar-root').evaluate(e=>getComputedStyle(e).backdropFilter),'none');
      assert.equal(await page.locator('#loginPage > div').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(32, 32, 35)');
      assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
      for (const scale of [0,.7,1,2]) {
        await page.evaluate(value=>document.documentElement.style.setProperty('--ng-glass-opacity-scale',value),String(scale));
        assert.equal(await page.locator('#loginPage > div').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(32, 32, 35)');
      }
      await page.addScriptTag({ content: script }); await page.waitForSelector('.ng-login-brand');
      assert.equal(await page.locator('.ng-login-brand').count(),1);
      await page.evaluate(()=>document.querySelector('#loginPage').classList.add('hide'));
      await page.waitForFunction(()=>!document.querySelector('.ng-login-brand'));
      assert.equal(await page.locator('[data-ng-login-header-brand]').count(),0);
      await page.evaluate(()=>window.__NoirGlassCompanion.destroy()); states++;
    }
    for (const scenario of ['disabled','hidden','failure','delayed','mobile']) {
      flags={enabled:scenario!=='disabled',hideBranding:scenario==='hidden'};
      fail=scenario==='failure';delay=scenario==='delayed'?1000:0;
      await load();
      if(scenario==='mobile') await page.evaluate(()=>document.documentElement.className='layout-mobile');
      await page.waitForTimeout(400);
      assert.equal(await page.locator('.ng-login-brand').count(),0,variant+' '+scenario);
      assert.equal(await page.locator('[data-ng-login-header-brand]').count(),0);
      if(scenario==='delayed') { await page.waitForSelector('.ng-login-brand'); }
      await page.evaluate(()=>window.__NoirGlassCompanion.destroy());
      assert.equal(await page.locator('.ng-login-brand').count(),0);states++;
    }
    await page.close();
  }
  console.log(`PASS ${states} login branding states: both headers, desktop matrix, async fallback, duplicates, cleanup, flags and Mobile exclusion`);
} finally { await browser.close(); }
