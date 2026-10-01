import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './build.mjs';

const script = await readFile(path.join(root, 'dist/noirglass.companion.js'), 'utf8');
const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const browser = await chromium.launch({ headless: true });
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l6cAAAAASUVORK5CYII=', 'base64');
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.route('**/backdrop.png', route => route.fulfill({ contentType: 'image/png', body: tinyPng }));
  await context.route('**/missing.png', route => route.abort());
  await context.route('http://noirglass.test/web/**', route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><style>:root{--ng-bg:#000}.hide{display:none}</style></head><body><div id="indexPage"><div id="homeTab" class="is-active"><div class="card" style="width:100px;height:100px"></div></div></div><div id="searchPage" class="hide"></div><div id="itemDetailPage" class="hide"><form class="trackSelections"><div class="selectVideoContainer"><select class="selectVideo"><option value="0">Video</option></select></div><div class="selectAudioContainer"><select class="selectAudio"><option value="1">Atmos</option><option value="2">Stereo</option></select></div></form></div></body></html>` }));
  const page = await context.newPage();
  await page.goto('http://noirglass.test/web/#/home');
  await page.addStyleTag({ content: css });
  await page.addStyleTag({ content: ':root{--ng-feature-height:700px}' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ng-feature-height').trim()), '700px');
  console.log('PASS single stylesheet parses and later token override wins');
  await page.evaluate(() => {
    const item = { Id: '1234567890abcdef1234567890abcdef', Type: 'Movie', Name: 'A Cinematic Film', ProductionYear: 2026, BackdropImageTags: ['a'], Overview: 'A test title', MediaSources: [{ Id: 'source', MediaStreams: [{ Type: 'Video', Index: 0, Width: 3840, Height: 2160 }, { Type: 'Audio', Index: 1, Codec: 'eac3', Title: 'Dolby Atmos JOC' }, { Type: 'Audio', Index: 2, Codec: 'aac' }] }] };
    window.__ngFixture = { enabled: true, pinnedItemIds: [], items: [item], missingArt: false, userId: 'test-user', settingsCalls: 0 };
    window.ApiClient = {
      getCurrentUserId: () => window.__ngFixture.userId,
      getItems: async () => ({ Items: window.__ngFixture.items }),
      getItem: async (_user, id) => window.__ngFixture.items.find(candidate => candidate.Id === id),
      getImageUrl: () => `${location.origin}/${window.__ngFixture.missingArt ? 'missing' : 'backdrop'}.png`,
      getUrl: path => `${location.origin}/${path}`,
      getJSON: async () => {
        window.__ngFixture.settingsCalls++;
        return { enabled: window.__ngFixture.enabled, pinnedItemIds: window.__ngFixture.pinnedItemIds };
      }
    };
    addEventListener('hashchange', () => {
      const home = location.hash.includes('/home');
      document.querySelector('#homeTab').classList.toggle('is-active', home);
      document.querySelector('#searchPage').classList.toggle('hide', home);
      document.querySelector('#itemDetailPage').classList.toggle('hide', !location.hash.includes('/details'));
    });
  });
  await page.addScriptTag({ content: script });
  await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('.ng-feature').count(), 1);
  assert.equal(await page.locator('.ng-feature__title').textContent(), 'A Cinematic Film');
  console.log('PASS authenticated plugin renders one independent hero');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile feature overflows horizontally');
  await page.setViewportSize({ width: 1440, height: 900 });
  console.log('PASS mobile carousel has no horizontal overflow');
  await page.evaluate(() => {
    const pinned = { ...window.__ngFixture.items[0], Id: 'abcdefabcdefabcdefabcdefabcdefab', Name: 'Pinned Film' };
    window.__ngFixture.items.push(pinned);
    window.__ngFixture.pinnedItemIds = [pinned.Id];
  });
  await page.addScriptTag({ content: script });
  await page.waitForFunction(() => document.querySelector('.ng-feature__title')?.textContent === 'Pinned Film');
  console.log('PASS accessible pinned title leads the carousel');
  await page.addScriptTag({ content: script });
  await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('.ng-feature').count(), 1);
  console.log('PASS duplicate script load leaves one hero');
  await page.evaluate(() => { location.hash = '#/search'; document.querySelector('#indexPage').classList.add('hide'); });
  await page.locator('.ng-feature').waitFor({ state: 'detached', timeout: 10000 });
  assert.equal(await page.locator('#homeTab .card').count(), 1);
  console.log('PASS route cleanup preserves native shelf');
  await page.evaluate(() => { location.hash = '#/home'; document.querySelector('#indexPage').classList.remove('hide'); });
  await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 10000 });
  await page.evaluate(() => { window.__ngFixture.enabled = false; });
  await page.addScriptTag({ content: script });
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.ng-feature').count(), 0);
  console.log('PASS disabled plugin leaves native shelf');
  await page.evaluate(() => { window.__ngFixture.enabled = true; window.__ngFixture.missingArt = true; });
  await page.addScriptTag({ content: script });
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.ng-feature').count(), 0);
  console.log('PASS missing artwork leaves native shelf');
  await page.evaluate(() => {
    location.hash = '#/details?id=1234567890abcdef1234567890abcdef';
    document.querySelector('#indexPage').classList.add('hide');
    window.__ngFixture.missingArt = false;
  });
  await page.locator('.ng-format-badge[data-format="4k"]').waitFor({ state: 'attached', timeout: 10000 });
  assert.equal(await page.locator('.ng-format-badge[data-format="da"]').count(), 1);
  await page.locator('.selectAudio').selectOption('2');
  await page.locator('.ng-format-badge[data-format="da"]').waitFor({ state: 'detached', timeout: 10000 });
  console.log('PASS detail badges follow selected source tracks');
  const anonymousCalls = await page.evaluate(() => {
    window.__ngFixture.userId = null;
    document.dispatchEvent(new Event('change'));
    return window.__ngFixture.settingsCalls;
  });
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.ng-format-badges').count(),0,'Sign-out must clear cached detail enhancements without reloading the payload');
  assert.equal(await page.locator('.ng-feature').count(),0);
  await page.addScriptTag({ content: script });
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.__ngFixture.settingsCalls), anonymousCalls);
  console.log('PASS unsigned session makes no settings request');
  await context.close();
} finally { await browser.close(); }
