import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { root } from './build.mjs';
import path from 'node:path';

const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const script = await readFile(path.join(root, 'dist/noirglass.companion.js'), 'utf8');
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l6cAAAAASUVORK5CYII=', 'base64');
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let images = 0;
  await context.route('**/images/**', route => { images++; return route.fulfill({ contentType: 'image/png', body: pixel }); });
  await context.route('http://noirglass.test/web/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body><header class="skinHeader"><div class="headerTabs"><button id="native-home">Home</button><button id="native-favorites">Favorites</button></div></header><div id="indexPage"><div id="homeTab" class="is-active"><div class="card">Native shelf</div></div></div></body></html>' }));
  const page = await context.newPage();
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 100));
  await page.goto('http://noirglass.test/web/#/home');
  await page.addStyleTag({ content: css });
  await page.evaluate(() => {
    const id = n => String(n).padStart(32, '0');
    const items = Array.from({ length: 1210 }, (_, i) => ({ Id: id(i+1), Type: 'Movie', Name: 'Film '+(i+1), BackdropImageTags: ['a'] }));
    window.fixture = { items, calls: [], user: 'viewer', settingsFailure: false, itemsFailure: false,
      settings: { enabled: true, featuredItemCount: 10, lineupRefreshMinutes: 1, rotationRevision: 'a', homeLinksEnabled: true, hideBranding: true,
        pinnedItemIds: [id(1210)], homeLinks: [{ kind: 'library', libraryId: id(2001), label: 'Cinema' }, { kind: 'collections' }, { kind: 'library', libraryId: id(9999), label: 'Private' }] } };
    window.ApiClient = {
      getCurrentUserId: () => window.fixture.user,
      getUrl: p => location.origin+'/'+p,
      getJSON: async () => { if (window.fixture.settingsFailure) throw Error('offline'); return { ...window.fixture.settings }; },
      getItems: async (_user, query) => { if (window.fixture.itemsFailure) throw Error('offline'); window.fixture.calls.push(query); return { Items: window.fixture.items.slice(query.StartIndex, query.StartIndex+query.Limit), TotalRecordCount: window.fixture.items.length }; },
      getItem: async (_user, id) => window.fixture.items.find(x => x.Id === id),
      getImageUrl: id => location.origin+'/images/'+id+'.png',
      getUserViews: async () => ({ Items: [{ Id: id(2001), Name: 'Movies', CollectionType: 'movies' }] })
    };
    Math.random = () => .25;
  });
  await page.mouse.move(1400, 880);
  const start = async () => { await page.addScriptTag({ content: script }); await page.clock.runFor(300); await page.locator('.ng-feature').waitFor(); };
  await start();
  assert.equal(await page.locator('.ng-feature').getAttribute('data-total'), '10');
  assert.equal(await page.locator('.ng-feature__title').textContent(), 'Film 1210');
  assert.equal(await page.locator('.ng-home-link').count(), 2);
  assert.equal(await page.locator('.ng-home-link').first().textContent(), 'Cinema');
  assert.equal(await page.locator('.ng-home-link').nth(1).getAttribute('href'), '#/list?type=BoxSet');
  await page.evaluate(() => document.querySelector('.headerTabs').replaceWith(Object.assign(document.createElement('div'), {className:'headerTabs',innerHTML:'<button id="native-home">Home</button><button id="native-favorites">Favorites</button>'})));
  await page.clock.runFor(500);
  assert.equal(await page.locator('.ng-home-link').count(), 2, 'Recreated native tabs regain authorized links');
  assert.equal(await page.locator('#native-home,#native-favorites').count(), 2);
  assert(await page.evaluate(() => document.documentElement.classList.contains('ng-hide-branding')));
  assert.equal(await page.evaluate(() => window.fixture.calls.length), 7, 'Stable discovery paginates the complete accessible pool');
  assert(images <= 2, 'Only opening and neighboring artwork is fetched');
  await page.clock.runFor(9000); assert.equal(await page.locator('.ng-feature__title').textContent(), 'Film 1210');
  await page.clock.runFor(2000); assert.equal(await page.locator('.ng-feature__title').textContent(), 'Film 1', 'Unset autoplay defaults to ten seconds');
  assert.equal(await page.locator('.ng-feature__slide').count(), 1);
  assert((await page.locator('.ng-feature__dot').count()) <= 7);
  await page.evaluate(() => { window.oldHero = document.querySelector('.ng-feature'); });
  await page.clock.runFor(60000);
  assert(await page.evaluate(() => window.oldHero !== document.querySelector('.ng-feature')), 'Periodic refresh replaces the lineup');
  await page.evaluate(() => document.querySelector('.ng-feature__dot[data-index="1"]').click());
  await page.clock.runFor(800);
  const refreshed = await page.locator('.ng-feature__title').textContent();
  assert(!Array.from({length:9},(_,i)=>'Film '+(i+1)).includes(refreshed), 'Rotation favors titles outside the preceding lineup');
  await page.evaluate(() => { window.fixture.settings.lineupRefreshMinutes=0; window.fixture.settings.rotationRevision='b'; window.oldHero=document.querySelector('.ng-feature'); });
  await page.locator('.ng-feature__arrow').first().focus();
  await page.clock.runFor(60000);
  assert(await page.evaluate(() => window.oldHero === document.querySelector('.ng-feature')), 'Manual global revision is queued during keyboard interaction');
  await page.evaluate(() => document.activeElement.blur()); await page.clock.runFor(500);
  assert(await page.evaluate(() => window.oldHero !== document.querySelector('.ng-feature')), 'Queued global rotation applies once idle');
  await page.evaluate(() => { window.fixture.itemsFailure=true; window.fixture.settings.rotationRevision='c'; window.oldHero=document.querySelector('.ng-feature'); });
  await page.clock.runFor(60000);
  assert(await page.evaluate(() => window.oldHero === document.querySelector('.ng-feature')), 'A failed lineup query preserves the working hero');
  await page.evaluate(() => { window.fixture.settingsFailure=true; }); await page.clock.runFor(60000);
  assert.equal(await page.locator('.ng-feature').count(), 1, 'Settings failure preserves cached enabled behavior');
  await page.evaluate(() => { window.fixture.settingsFailure=false; window.fixture.itemsFailure=false; window.fixture.settings.featuredItemCount=1000; window.fixture.settings.intervalSeconds=0; window.fixture.settings.lineupRefreshMinutes=0; });
  await start();
  assert.equal(await page.locator('.ng-feature').getAttribute('data-total'), '1000');
  assert.equal(await page.locator('.ng-feature__slide').count(), 1);
  assert.equal(await page.locator('.ng-feature__dot').count(), 7);
  for (let i=0;i<20;i++) await page.evaluate(() => document.querySelector('.ng-feature__arrow[aria-label="Next featured title"]').click());
  await page.clock.runFor(800); assert.equal(await page.locator('.ng-feature__slide').count(), 1);
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(() => document.querySelector('.ng-feature__arrow[aria-label="Next featured title"]').click()); await page.clock.runFor(800);
  assert((await page.locator('.ng-feature__dot').count()) <= 3);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.evaluate(() => { window.fixture.settings.featuredItemCount=2000; }); await start();
  assert.equal(await page.locator('.ng-feature').getAttribute('data-total'), '1210', 'Count is bounded by available library items only');
  await page.evaluate(() => { location.hash='#/search'; document.querySelector('#indexPage').classList.add('hide'); }); await page.clock.runFor(250);
  assert.equal(await page.locator('.ng-feature,.ng-home-links').count(), 0);
  assert.equal(await page.locator('#homeTab .card').count(), 1);
  await page.evaluate(() => window.__NoirGlassCompanion.destroy());
  assert(!await page.evaluate(() => document.documentElement.classList.contains('ng-hide-branding')));
  console.log('PASS Home defaults, 1,000-title bounded rendering, permission-filtered links, rotation/idle/failure handling and cleanup');
  await context.close();
} finally { await browser.close(); }
