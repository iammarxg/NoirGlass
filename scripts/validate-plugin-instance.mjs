import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
await mkdir(path.join(root,'.local/verification'),{recursive:true});
const { origin, movie } = JSON.parse(await readFile(path.join(root, '.local/instance.json'), 'utf8'));
const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const signedIn = await fetch('http://127.0.0.1:4319', {
  method: 'POST',
  body: JSON.stringify({ action: 'evaluate', expression: 'Object.fromEntries(Object.entries(localStorage))' })
});
assert(signedIn.ok, 'Open the Playwright browser and sign in before live verification');
// Authenticated localStorage remains in this process; never log or save it.
const storage = await signedIn.json();
const browser = await chromium.launch({ headless: true });
const report = {
  product: 'NoirGlass',
  version,
  date: new Date().toISOString(),
  target: 'Jellyfin Server/Web 12.1 Legacy',
  browser: browser.version(),
  checks: [],
  limitations: []
};
const pass = (name, details = {}) => {
  report.checks.push({ name, result: 'passed', ...details });
  console.log(`PASS ${name}`);
};
const ready = page => page.locator('#indexPage:not(.hide) #homeTab.is-active .card').first()
  .waitFor({ state: 'attached', timeout: 45000 });
const noOverflow = async (page, name) => {
  const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert(size.content <= size.viewport, `${name}: horizontal overflow ${JSON.stringify(size)}`);
  pass(`${name}: no horizontal overflow`, size);
};

async function setup(name, viewport, {
  noCompanion = false, disabledSettings = false
} = {}) {
  const mode = viewport.width <= 500 ? 'mobile' : 'desktop';
  const entries = { ...storage, layout: `${mode}-legacy` };
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    hasTouch: mode === 'mobile',
    storageState: {
      cookies: [],
      origins: [{ origin, localStorage: Object.entries(entries).map(([key, value]) => ({ name: key, value })) }]
    }
  });
  await context.route('https://noirglass.invalid/**', route => route.fulfill({
    contentType: 'text/css', body: css
  }));
  if (noCompanion) await context.route('**/NoirGlass/companion.js*', route => route.abort());
  if (disabledSettings) await context.route('**/NoirGlass/Settings*', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ enabled: false, pinnedItemIds: [] })
  }));
  const page = await context.newPage();
  await page.goto(`${origin}/web/?ng-plugin-check=${Date.now()}#/home`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  await page.addStyleTag({ content: '@import url("https://noirglass.invalid/dist/noirglass.min.css");' });
  await page.waitForFunction(() => !!getComputedStyle(document.documentElement).getPropertyValue('--ng-bg').trim());
  await page.evaluate(() => document.fonts.ready);
  return { context, page, name };
}

await mkdir(path.join(root, 'test-results'), { recursive: true });
try {
  for (const [name, viewport] of [
    ['desktop-1920', { width: 1920, height: 1080 }],
    ['desktop-1440', { width: 1440, height: 900 }],
    ['mobile-390', { width: 390, height: 844 }]
  ]) {
    const { context, page } = await setup(name, viewport);
    try {
      await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 45000 });
      const injected = await page.evaluate(() => ({
        src: document.querySelector('script[data-noirglass-plugin]')?.src,
        companion: !!window.__NoirGlassCompanion,
        features: document.querySelectorAll('.ng-feature').length,
        shelves: document.querySelectorAll('#homeTab .card').length
      }));
      assert(injected.src?.startsWith(`${origin}/NoirGlass/companion.js`), 'Installed plugin did not inject its script');
      assert(injected.companion && injected.features === 1 && injected.shelves > 0,
        'Installed plugin must show one feature while retaining native shelves');
      pass(`${name}: installed plugin renders one hero`, {
        viewport, nativeCards: injected.shelves
      });
      await noOverflow(page, `${name} Home`);
      await page.locator('.ng-feature').hover();
      await page.waitForFunction(() => document.querySelectorAll('.ng-feature__slide').length === 1);
      const firstTitle = await page.locator('.ng-feature__title').textContent();
      if (await page.locator('.ng-feature__dot').count() > 1) {
        await page.getByRole('button', { name: 'Next featured title' }).click();
        await page.waitForFunction(() => document.querySelectorAll('.ng-feature__slide').length === 1);
        assert.notEqual(await page.locator('.ng-feature__title').textContent(), firstTitle);
        await page.getByRole('button', { name: 'Previous featured title' }).focus();
        await page.keyboard.press('ArrowLeft');
        await page.waitForFunction(() => document.querySelectorAll('.ng-feature__slide').length === 1);
        pass(`${name}: carousel button and keyboard navigation`);
      }
      if (name === 'mobile-390') {
        await page.locator('.ng-feature').evaluate(element => {
          const start = new Touch({ identifier: 1, target: element, clientX: 320, clientY: 300 });
          const end = new Touch({ identifier: 1, target: element, clientX: 100, clientY: 304 });
          element.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [start], touches: [start], bubbles: true }));
          element.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], touches: [], bubbles: true }));
        });
        await page.waitForFunction(() => document.querySelectorAll('.ng-feature__slide').length === 1);
        assert(await page.locator('.ng-feature').isVisible());
        pass('mobile-390: touch swipe retains the feature');
      }
      await page.locator('.ng-feature__art').evaluate(image => image.decode().catch(() => {}));
      await page.screenshot({
        path: path.join(root, 'test-results', `plugin-live-${name}.png`), animations: 'disabled'
      });
      await page.evaluate(id => { location.hash = `#/details?id=${id}`; }, movie);
      await page.locator('#itemDetailPage:not(.hide) .trackSelections').waitFor({ state: 'visible', timeout: 45000 });
      await page.waitForFunction(() => !document.querySelector('.ng-feature'));
      assert.equal(await page.locator('script[data-noirglass-plugin]').count(), 1);
      pass(`${name}: route cleanup restores native detail`);
      await page.locator('#itemDetailPage:not(.hide) .ng-format-badge[data-format="4k"]')
        .waitFor({ state: 'visible', timeout: 30000 });
      pass(`${name}: installed plugin adds source-confirmed detail badge`);
      if (name === 'desktop-1440') {
        const audio = page.locator('#itemDetailPage:not(.hide) .selectAudio');
        const values = await audio.locator('option').evaluateAll(options => options.map(option => option.value));
        if (values.includes('1') && values.includes('2')) {
          await audio.selectOption('1');
          await page.locator('#itemDetailPage:not(.hide) .ng-format-badge[data-format="da"]')
            .waitFor({ state: 'visible', timeout: 15000 });
          await audio.selectOption('2');
          await page.locator('#itemDetailPage:not(.hide) .ng-format-badge[data-format="da"]')
            .waitFor({ state: 'detached', timeout: 15000 });
          pass('desktop-1440: format badges follow native audio selection');
        } else report.limitations.push('Live movie did not expose the two audio tracks required to verify badge updates.');
      }
      await noOverflow(page, `${name} detail`);
      await page.screenshot({
        path: path.join(root, 'test-results', `plugin-live-detail-${name}.png`), animations: 'disabled'
      });
      await page.evaluate(() => { location.hash = '#/home'; });
      await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 45000 });
      assert.equal(await page.locator('.ng-feature').count(), 1);
      pass(`${name}: Home restoration leaves one feature`);
      if (name === 'desktop-1440') {
        // Observe the native Play button without starting a stream or changing watch progress.
        await page.evaluate(() => {
          window.__ngNativePlayClicks = 0;
          document.addEventListener('click', event => {
            if (!event.target.closest('#itemDetailPage .btnPlay')) return;
            window.__ngNativePlayClicks += 1;
            event.preventDefault();
            event.stopImmediatePropagation();
          }, true);
        });
        await page.locator('.ng-feature__action--primary').click();
        await page.waitForFunction(() => window.__ngNativePlayClicks === 1, null, { timeout: 15000 });
        assert(await page.locator('#itemDetailPage:not(.hide)').isVisible());
        pass('desktop-1440: featured Play delegates to Jellyfin native Play');
      }
      if (name === 'mobile-390') {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const duration = await page.evaluate(() => getComputedStyle(document.documentElement)
          .getPropertyValue('--ng-motion-duration').trim());
        assert.equal(duration, '0ms');
        pass('mobile-390: reduced-motion token applies');
      }
    } finally { await context.close(); }
  }

  for (const [name, options] of [
    ['CSS-only', { noCompanion: true }],
    ['disabled-settings', { disabledSettings: true }]
  ]) {
    const { context, page } = await setup(name, { width: 1440, height: 900 }, options);
    try {
      await page.waitForTimeout(2000);
      assert.equal(await page.locator('.ng-feature').count(), 0);
      assert((await page.locator('#homeTab .card').count()) > 0);
      pass(`${name}: native shelves remain usable`);
      await noOverflow(page, `${name} Home`);
    } finally { await context.close(); }
  }
} catch (error) {
  report.limitations.push(error.message.replaceAll(origin, '[private server]').replace(/[a-f0-9]{32}/gi, '[private item]'));
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  const filename = 'verification-live-plugin.json';
  await writeFile(path.join(root, '.local/verification', filename), JSON.stringify(report, null, 2) + '\n');
}
