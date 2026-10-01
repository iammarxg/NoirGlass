import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './build.mjs';

const payload = await readFile(path.join(root, 'dist/noirglass.companion.js'), 'utf8');
const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const browser = await chromium.launch({ headless: true });
const importCss = '@import url("https://cdn.jsdelivr.net/gh/iammarxg/NoirGlass@latest/dist/noirglass.min.css");';
async function fixture(options = {}) {
  const context = await browser.newContext();
  await context.route('https://cdn.jsdelivr.net/**', route => options.failedCss ? route.abort() : route.fulfill({ contentType: 'text/css', body: css }));
  await context.route('http://noirglass.test/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body class="dashboardDocument"><main><h1>Native administration</h1><button id="native-action">Native action</button></main><video id="unrelated"></video></body></html>' }));
  const page = await context.newPage();
  await page.goto(`http://noirglass.test/base/web/#/${options.route || 'dashboard/settings'}`);
  await page.evaluate(({ options, importCss, css }) => {
    window.state = { userId: 'admin', admin: true, enabled: true, themeDashboard: true,
      server: importCss, calls: [], delay: 0, ...options };
    if (options.inline) window.state.server = css;
    localStorage.setItem('admin-customCss', options.userCss || '');
    localStorage.setItem('admin-disableCustomCss', String(options.disableServer || false));
    window.ApiClient = {
      getCurrentUserId: () => window.state.userId,
      getCurrentUser: async () => ({ Policy: { IsAdministrator: window.state.admin } }),
      getUrl: value => `${location.origin}/base/${value}`,
      getJSON: async url => {
        window.state.calls.push(new URL(url).pathname);
        if (window.state.delay) await new Promise(resolve => setTimeout(resolve, window.state.delay));
        if (window.state.networkFailure) throw new Error('Fixture unavailable');
        if (url.endsWith('NoirGlass/Settings')) return { enabled: window.state.enabled, themeDashboard: window.state.themeDashboard };
        return { CustomCss: window.state.server };
      }
    };
  }, { options, importCss, css });
  await page.addScriptTag({ content: payload });
  return { page, context };
}
const styles = page => page.locator('style[data-noirglass-dashboard]');
const ready = page => page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--ng-companion-contract').trim() === '1');
try {
  for (const route of ['dashboard/settings', 'metadata?id=fixture', 'configurationpage?name=NoirGlass']) {
    const { page, context } = await fixture({ route, userCss: ':root{--ng-field-height:52px}' });
    await ready(page);
    assert.deepEqual(await styles(page).evaluateAll(nodes => nodes.map(node => node.dataset.noirglassDashboard)), ['server', 'user']);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ng-field-height').trim()), '52px');
    assert.deepEqual(await page.evaluate(() => window.state.calls), ['/base/NoirGlass/Settings', '/base/Branding/Configuration']);
    await page.addScriptTag({ content: payload });
    await ready(page);
    await page.waitForTimeout(400);
    assert.equal(await styles(page).count(), 2, 'Duplicate payload must not duplicate styles');
    await page.evaluate(() => { location.hash = '#/home'; document.body.classList.remove('dashboardDocument'); });
    await page.waitForFunction(() => !document.querySelector('style[data-noirglass-dashboard]'));
    assert.equal(await page.locator('#native-action').count(), 1);
    assert.equal(await page.locator('#unrelated').evaluate(video => video.muted), false);
    await context.close();
  }
  console.log('PASS direct Dashboard/Metadata Manager/plugin routes, base URLs, ordered overrides, duplicate loading, route cleanup and unrelated media');

  for (const options of [
    { admin: false }, { userId: null }, { enabled: false }, { themeDashboard: false },
    { server: ':root{color:red}' }, { disableServer: true }, { networkFailure: true }
  ]) {
    const { page, context } = await fixture(options);
    await page.waitForTimeout(600);
    assert.equal(await styles(page).count(), 0, JSON.stringify(options));
    assert(await page.locator('#native-action').isVisible());
    if (options.admin === false || options.userId === null) assert.equal((await page.evaluate(() => window.state.calls)).length, 0);
    await context.close();
  }
  console.log('PASS non-admin/anonymous/disabled/unconfigured/failure states leave native administration usable');

  const perUser = await fixture({ disableServer: true, userCss: `${importCss}\n:root{--ng-field-height:54px}` });
  await ready(perUser.page);
  assert.equal(await styles(perUser.page).count(), 1);
  assert.deepEqual(await perUser.page.evaluate(() => window.state.calls), ['/base/NoirGlass/Settings']);
  await perUser.page.evaluate(() => { window.state.userId = null; });
  await perUser.page.waitForFunction(() => !document.querySelector('style[data-noirglass-dashboard]'));
  await perUser.context.close();
  console.log('PASS disabled server CSS retains user-only theme; sign-out removes plugin-owned CSS');

  const inline = await fixture({ inline: true });
  await ready(inline.page);
  await inline.page.evaluate(() => window.__NoirGlassCompanion.destroy());
  assert.equal(await styles(inline.page).count(), 0);
  await inline.context.close();
  console.log('PASS pasted NoirGlass CSS and explicit destruction cleanup');

  const unsupported = await fixture({ server: ':root{--ng-companion-contract:1;--ng-bg:#000}' });
  await unsupported.page.waitForTimeout(6800);
  assert.equal(await styles(unsupported.page).count(),0);
  await unsupported.context.close();
  console.log('PASS CSS without the shared UI contract leaves native Dashboard intact');

  const stale = await fixture({ delay: 400 });
  await stale.page.waitForTimeout(200);
  await stale.page.evaluate(() => { location.hash = '#/home'; document.body.classList.remove('dashboardDocument'); });
  await stale.page.waitForTimeout(1100);
  assert.equal(await styles(stale.page).count(), 0);
  await stale.context.close();
  console.log('PASS stale asynchronous settings/branding results are discarded after route exit');

  const replaced = await fixture();
  await ready(replaced.page);
  await replaced.page.evaluate(() => {
    window.ApiClient = {
      ...window.ApiClient,
      getJSON: async url => {
        if (url.endsWith('NoirGlass/Settings')) {
          window.oldSettingsRequested = true;
          await new Promise(resolve => { window.resolveOldSettings = resolve; });
          return { enabled: true, themeDashboard: true };
        }
        return { CustomCss: window.state.server };
      }
    };
    document.body.classList.add('fixture-client-change');
  });
  await replaced.page.waitForFunction(() => window.oldSettingsRequested);
  await replaced.page.evaluate(() => {
    window.ApiClient = {
      ...window.ApiClient,
      getJSON: async url => url.endsWith('NoirGlass/Settings')
        ? { enabled: false, themeDashboard: false }
        : { CustomCss: window.state.server }
    };
    document.body.classList.remove('fixture-client-change');
  });
  await replaced.page.waitForTimeout(350);
  await replaced.page.evaluate(() => window.resolveOldSettings());
  await replaced.page.waitForTimeout(350);
  await replaced.page.evaluate(() => { location.hash = '#/dashboard/branding'; });
  await replaced.page.waitForTimeout(450);
  assert.equal(await styles(replaced.page).count(), 0, 'Previous client settings must not replace disabled settings from the current client');
  await replaced.context.close();
  console.log('PASS replacing the signed-in client discards its outstanding settings response');

  const preferences = await fixture();
  await ready(preferences.page);
  await preferences.page.evaluate(() => localStorage.setItem('admin-disableCustomCss', 'true'));
  await preferences.page.waitForFunction(() => !document.querySelector('style[data-noirglass-dashboard]'));
  await preferences.context.close();
  console.log('PASS same-tab Display preference changes remove disabled server styling');

  const failure = await fixture({ failedCss: true });
  await failure.page.waitForTimeout(6800);
  assert.equal(await styles(failure.page).count(), 0);
  assert(await failure.page.locator('#native-action').isVisible());
  await failure.context.close();
  console.log('PASS failed stylesheet loading removes candidate styles and preserves native controls');
} finally { await browser.close(); }
