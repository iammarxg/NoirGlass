import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
await mkdir(path.join(root,'.local/verification'),{recursive:true});
const profile = JSON.parse(await readFile(path.join(root, '.local/instance.json'), 'utf8'));
const { origin } = profile;
const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const companion = await readFile(path.join(root, 'dist/noirglass.companion.js'), 'utf8');
const response = await fetch('http://127.0.0.1:4319', {
  method: 'POST', body: JSON.stringify({ action: 'evaluate', expression: 'Object.fromEntries(Object.entries(localStorage))' })
});
assert(response.ok, 'Sign in manually with npm run browser before runtime verification');
// This localStorage snapshot stays inside this process; never print or write it.
const storage = await response.json();
const browser = await chromium.launch({
  headless: true,
  ...(process.env.NOIRGLASS_BROWSER_EXECUTABLE ? { executablePath: process.env.NOIRGLASS_BROWSER_EXECUTABLE } : {})
});
await mkdir(path.join(root, 'docs/images'), { recursive: true });
const report = { version: '1.0.0', date: new Date().toISOString(), browser: browser.version(), target: 'Jellyfin Web 12.1 legacy', checks: [], limitations: [] };
const pass = (name, details = {}) => { report.checks.push({ name, result: 'passed', ...details }); console.log(`PASS ${name}`); };
async function setup(name, viewport) {
  const mode = name === 'mobile' ? 'mobile' : 'desktop';
  const entries = { ...storage, layout: `${mode}-legacy` };
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 1, hasTouch: mode === 'mobile',
    storageState: { cookies: [], origins: [{ origin, localStorage: Object.entries(entries).map(([key, value]) => ({ name: key, value })) }] }
  });
  await context.route('**/NoirGlass/companion.js*', route => route.abort());
  await context.route('**/NoirGlass/Settings*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ enabled: true, pinnedItemIds: [] }) }));
  await context.route('https://noirglass.invalid/**', route => route.fulfill({ contentType: 'text/css', body: css }));
  const page = await context.newPage();
  await page.goto(`${origin}/web/#/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('#indexPage:not(.hide) #homeTab.is-active .card').first().waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: '@import url("https://noirglass.invalid/dist/noirglass.min.css");' });
  await page.waitForFunction(() => !!getComputedStyle(document.documentElement).getPropertyValue('--ng-feature-height').trim());
  await page.addScriptTag({ content: companion });
  await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.ng-feature__art').evaluate(img => img.decode().catch(() => {}));
  return { page, context };
}
const noOverflow = async (page, name) => {
  const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  assert(size.content <= size.viewport, `${name}: horizontal overflow ${JSON.stringify(size)}`);
  pass(`${name}: no horizontal overflow`, size);
};
const settleArtwork = async page => {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1800);
  await page.evaluate(async () => {
    await Promise.all([...document.images].filter(image => {
      const bounds = image.getBoundingClientRect();
      return bounds.bottom > 0 && bounds.top < innerHeight;
    }).map(image => image.decode().catch(() => {})));
  });
};

try {
  for (const [name, viewport] of [['tv', { width: 1920, height: 1080 }], ['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const { page, context } = await setup(name, viewport);
    const nativeCards = await page.locator('#homeTab .card').count();
    assert(nativeCards > 0, 'Native shelves disappeared');
    assert((await page.locator('.ng-feature__dot').count()) >= 1, 'No featured-title pagination');
    const imageOrigin = await page.locator('.ng-feature__art').evaluate(img => new URL(img.src).origin);
    assert.equal(imageOrigin, origin, 'Featured image must be served by Jellyfin');
    pass(`${name}: authenticated feature with native shelves`, { viewport, nativeCards });
    await noOverflow(page, `${name} featured Home`);
    const first = await page.locator('.ng-feature__title').textContent();
    if ((await page.locator('.ng-feature__dot').count()) > 1) {
      await page.getByRole('button', { name: 'Next featured title' }).click();
      assert.notEqual(await page.locator('.ng-feature__title').textContent(), first);
      await page.getByRole('button', { name: 'Previous featured title' }).focus();
      await page.keyboard.press('ArrowLeft');
      pass(`${name}: carousel buttons and keyboard arrows`);
    }
    if (name === 'mobile') {
      await page.locator('.ng-feature').evaluate(element => {
        const start = new Touch({ identifier: 1, target: element, clientX: 320, clientY: 300 });
        const end = new Touch({ identifier: 1, target: element, clientX: 100, clientY: 305 });
        element.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [start], touches: [start], bubbles: true }));
        element.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], touches: [], bubbles: true }));
      });
      assert(await page.locator('.ng-feature').isVisible(), 'Swipe must not switch Jellyfin to another tab');
      pass('mobile: touch swipe advances feature');
      await page.getByRole('button', { name: 'Previous featured title' }).click();
    }
    await page.locator('.ng-feature__art').evaluate(img => img.decode().catch(() => {}));
    await page.locator('.ng-feature__logo').evaluate(img => img.decode().catch(() => {}));
    const playStyle = await page.locator('.ng-feature__action--primary').evaluate(button => ({
      text: button.textContent,
      color: getComputedStyle(button).color,
      background: getComputedStyle(button).backgroundColor,
      opacity: getComputedStyle(button).opacity
    }));
    assert(playStyle.text?.includes('Play') && playStyle.color !== playStyle.background, 'Primary action text is unreadable');
    const glass = await page.evaluate(() => {
      const alpha = selector => {
        const color = getComputedStyle(document.querySelector(selector)).backgroundColor;
        return color.startsWith('rgba(') ? Number(color.slice(color.lastIndexOf(',') + 1, -1)) : 1;
      };
      return {
        burger: alpha('.skinHeader:not(.osdHeader) .mainDrawerButton'),
        rightGroup: alpha('.skinHeader:not(.osdHeader) .headerRight'),
        selectedTab: alpha('.skinHeader:not(.osdHeader) .emby-tab-button-active'),
        details: alpha('.ng-feature__action:not(.ng-feature__action--primary)'),
        arrow: alpha('.ng-feature__arrow'),
        play: alpha('.ng-feature__action--primary')
      };
    });
    assert(glass.burger < 1 && glass.rightGroup < 1 && glass.selectedTab < 1 && glass.details < 1 && glass.arrow < 1, 'Home secondary controls must remain translucent');
    assert.equal(glass.play, 1, 'Home Play must remain opaque white');
    pass(`${name}: translucent Home controls with white Play`, glass);
    pass(`${name}: primary action readable`, playStyle);
    if (name !== 'tv') await page.screenshot({ path: path.join(root, 'docs/images', `${name}-feature.png`), animations: 'disabled' });
    await page.locator('.mainDrawerButton').click();
    await page.waitForFunction(() => {
      const drawer = document.querySelector('.mainDrawer');
      return drawer?.classList.contains('drawer-open') && drawer.getBoundingClientRect().x >= 0;
    });
    assert((await page.locator('.mainDrawer .navMenuOption').count()) > 0, 'Native navigation items missing');
    const homeSelection = await page.locator('.mainDrawer a.navMenuOption[href="#/home"]').evaluate(element => {
      const style = getComputedStyle(element), bounds = element.getBoundingClientRect(), drawer = document.querySelector('.mainDrawer').getBoundingClientRect();
      return { inset: bounds.left - drawer.left, radius: parseFloat(style.borderRadius), background: style.backgroundColor, color: style.color };
    });
    assert(homeSelection.inset >= 8 && homeSelection.radius >= 14, 'Home selection must be an inset rounded button');
    assert.notEqual(homeSelection.background, homeSelection.color, 'Home selection must remain legible');
    await page.screenshot({ path: path.join(root, 'docs/images', `${name}-navigation.png`), animations: 'disabled' });
    pass(`${name}: native sidebar opens with rounded Home selection`, homeSelection);
    await page.locator('.tmla-mask.backdrop').click({ position: { x: viewport.width - 20, y: viewport.height / 2 } });
    await page.waitForFunction(() => !document.querySelector('.mainDrawer')?.classList.contains('drawer-open'));
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await page.locator('#itemDetailPage:not(.hide) .btnPlay').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('.ng-feature').waitFor({ state: 'detached', timeout: 10000 });
    pass(`${name}: details use native route and feature cleans up`);
    await page.evaluate(() => { location.hash = '#/home'; });
    await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 30000 });
    await page.evaluate(() => window.__NoirGlassCompanion?.destroy());
    assert.equal(await page.locator('.ng-feature').count(), 0);
    assert((await page.locator('#homeTab .card').count()) > 0);
    pass(`${name}: disabling companion restores native Home`);
    if (name === 'desktop') {
      await page.evaluate(() => {
        window.__ngOriginalGetItems = window.ApiClient.getItems;
        window.ApiClient.getItems = async () => ({ Items: [] });
      });
      await page.addScriptTag({ content: companion });
      await page.waitForTimeout(600);
      assert.equal(await page.locator('.ng-feature').count(), 0, 'Empty metadata should not create an empty hero');
      assert((await page.locator('#homeTab .card').count()) > 0, 'Empty metadata should not remove native shelves');
      await page.evaluate(() => {
        window.__NoirGlassCompanion?.destroy();
        window.ApiClient.getItems = window.__ngOriginalGetItems;
        delete window.__ngOriginalGetItems;
      });
      pass('desktop: empty metadata leaves native shelves intact');
      await page.locator('.mainDrawerButton').click();
      await page.locator('.mainDrawer a.navMenuOption').filter({ hasText: 'Movies' }).first().click();
      await page.locator('.mainDrawerButton').click();
      const movieSelection = await page.locator('.mainDrawer .navMenuOption-selected').evaluate(element => {
        const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
        return { text: element.textContent.trim(), inset: bounds.left - document.querySelector('.mainDrawer').getBoundingClientRect().left, radius: parseFloat(style.borderRadius), background: style.backgroundColor };
      });
      assert(movieSelection.text.includes('Movies') && movieSelection.inset >= 8 && movieSelection.radius >= 14);
      await page.locator('.mainDrawer a.navMenuOption[href="#/dashboard"]').click();
      await page.locator('#dashboardPage:not(.hide)').waitFor({ state: 'visible', timeout: 30000 });
      await page.locator('.MuiDrawer-paper a.MuiListItemButton-root.Mui-selected[href="#/dashboard"]').waitFor({ state: 'visible', timeout: 30000 });
      const dashboardSelection = await page.locator('.MuiDrawer-paper a.MuiListItemButton-root.Mui-selected[href="#/dashboard"]').evaluate(element => {
        const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
        return { inset: bounds.left - element.closest('.MuiDrawer-paper').getBoundingClientRect().left, radius: parseFloat(style.borderRadius), background: style.backgroundColor };
      });
      assert(dashboardSelection.inset >= 8 && dashboardSelection.radius >= 14);
      assert.equal(dashboardSelection.background, homeSelection.background, 'Admin selection must use the same fill as legacy navigation');
      pass('desktop: Movies and Dashboard use matching rounded selected buttons', { movieSelection, dashboardSelection });
    }
    await page.evaluate(() => { location.hash = '#/search'; });
    await page.locator('#searchPage:not(.hide) #searchTextInput').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#searchPage .searchSuggestionsList .button-link').first().waitFor({ state: 'visible', timeout: 30000 });
    const searchFieldHeight = await page.locator('#searchTextInput').evaluate(input => input.getBoundingClientRect().height);
    assert(searchFieldHeight >= (name === 'mobile' ? 58 : 72), 'Search field is not enlarged');
    const searchAlignment = await page.locator('#searchTextInput').evaluate(input => {
      const icon = input.closest('.searchFieldsInner').querySelector('.searchfields-icon');
      const bounds = input.getBoundingClientRect();
      return { iconDisplay: getComputedStyle(icon).display, centerError: Math.abs((bounds.left + bounds.right) / 2 - document.documentElement.clientWidth / 2) };
    });
    assert.equal(searchAlignment.iconDisplay, 'none', 'Redundant in-page Search icon must be hidden');
    assert(searchAlignment.centerError <= 1, 'Search input must be centered');
    const inputStyle = await page.locator('#searchTextInput').evaluate(input => {
      const style = getComputedStyle(input);
      return { fontSize: parseFloat(style.fontSize), paddingLeft: parseFloat(style.paddingLeft), caret: style.caretColor, placeholder: getComputedStyle(input, '::placeholder').color };
    });
    assert(inputStyle.fontSize >= (name === 'mobile' ? 19 : 24) && inputStyle.paddingLeft >= 18, 'Search text treatment is too small or crowded');
    assert.notEqual(inputStyle.caret, 'rgba(0, 0, 0, 0)', 'Search caret must remain visible');
    await noOverflow(page, `${name} Search`);
    await page.screenshot({ path: path.join(root, 'docs/images', `${name}-search.png`), animations: 'disabled' });
    pass(`${name}: native Search input centered without duplicate icon`, { searchFieldHeight, searchAlignment });
    await page.locator('#searchTextInput').fill('Blade Runner');
    await page.locator('#searchPage .card:visible').first().waitFor({ state: 'visible', timeout: 30000 });
    await noOverflow(page, `${name} Search results`);
    const searchCard = page.locator('#searchPage .card:visible').first();
    if (name === 'mobile') {
      const actions = await searchCard.evaluate(element => ({
        overlays: element.querySelectorAll('.cardOverlayContainer').length,
        buttons: [...element.querySelectorAll('button')].filter(button => getComputedStyle(button).display !== 'none' && button.getBoundingClientRect().width > 0).map(button => button.className)
      }));
      assert(actions.buttons.length > 0, 'Touch Search card actions must stay visible');
      pass('mobile: Search poster actions remain touch-accessible', actions);
    } else {
      await searchCard.hover();
      await page.waitForFunction(() => {
        const card = [...document.querySelectorAll('#searchPage .card')].find(element => element.getBoundingClientRect().width > 0);
        return card && Number(getComputedStyle(card.querySelector('.cardOverlayContainer')).opacity) > 0.9;
      });
      const action = searchCard.locator('.cardOverlayButton').first();
      await action.focus();
      assert(await action.evaluate(element => element === document.activeElement), 'Search poster action must accept keyboard focus');
      const inset = await searchCard.locator('.cardOverlayButton-br').evaluate(rail => {
        const r = rail.getBoundingClientRect(), p = rail.closest('.cardScalable').getBoundingClientRect();
        return { right: p.right - r.right, bottom: p.bottom - r.bottom };
      });
      assert(inset.right >= 8 && inset.bottom >= 8, 'Search poster rail must be inset from both edges');
    }
    await page.screenshot({ path: path.join(root, 'docs/images', `${name}-search-results.png`), animations: 'disabled' });
    pass(`${name}: native Search result cards themed`);
    await page.evaluate(hash => { location.hash = hash; }, `#/movies?topParentId=${profile.library}&collectionType=movies`);
    await page.locator('.itemsContainer .card:visible').first().waitFor({ state: 'visible', timeout: 30000 });
    await settleArtwork(page);
    await noOverflow(page, `${name} Library`);
    const posterColumns = await page.locator('.vertical-wrap:has(> .portraitCard)').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    assert.equal(posterColumns, name === 'tv' ? 6 : name === 'mobile' ? 2 : 5, 'Library poster density differs from the intended viewport layout');
    const toolbar = await page.locator('.btnPlayAll > .material-icons').first().evaluate(icon => {
      const button = icon.parentElement.getBoundingClientRect(), shape = icon.getBoundingClientRect();
      return { mask: getComputedStyle(icon).maskImage, centerError: Math.abs((shape.left + shape.right - button.left - button.right) / 2) };
    });
    assert(toolbar.mask.startsWith('url(') && toolbar.centerError <= 1, 'Library toolbar icon must be original and optically centered');
    const libraryCard = page.locator('.vertical-wrap > .portraitCard:visible').first();
    if (name === 'mobile') {
      const actions = await libraryCard.evaluate(element => ({
        overlays: element.querySelectorAll('.cardOverlayContainer').length,
        buttons: [...element.querySelectorAll('button')].filter(button => getComputedStyle(button).display !== 'none' && button.getBoundingClientRect().width > 0).map(button => button.className)
      }));
      assert(actions.buttons.length > 0, 'Touch Library must expose a poster action');
      pass('mobile: Library poster actions remain touch-accessible', actions);
    } else {
      await libraryCard.hover();
      await page.waitForFunction(() => {
        const card = [...document.querySelectorAll('.vertical-wrap > .portraitCard')].find(element => element.getBoundingClientRect().width > 0);
        return card && Number(getComputedStyle(card.querySelector('.cardOverlayContainer')).opacity) > 0.9;
      });
      const inset = await libraryCard.locator('.cardOverlayButton-br').evaluate(rail => {
        const r = rail.getBoundingClientRect(), p = rail.closest('.cardScalable').getBoundingClientRect();
        return { right: p.right - r.right, bottom: p.bottom - r.bottom };
      });
      assert(inset.right >= 8 && inset.bottom >= 8, 'Library poster rail must be inset from both edges');
    }
    await page.screenshot({ path: path.join(root, 'docs/images', `${name}-library.png`), animations: 'disabled' });
    pass(`${name}: native Library grid and filters`, { posterColumns });
    await page.evaluate(hash => { location.hash = hash; }, `#/details?id=${profile.movie}`);
    await page.locator('#itemDetailPage:not(.hide) .btnPlay').waitFor({ state: 'visible', timeout: 30000 });
    await settleArtwork(page);
    await page.addScriptTag({ content: companion });
    await page.locator('#itemDetailPage:not(.hide) .ng-format-badge[data-format="4k"]').waitFor({ state: 'visible', timeout: 30000 });
    if (name === 'desktop') {
      const audioSelect = page.locator('#itemDetailPage:not(.hide) .selectAudio');
      await audioSelect.selectOption('1');
      await page.locator('#itemDetailPage:not(.hide) .ng-format-badge[data-format="da"]').waitFor({ state: 'visible' });
      await audioSelect.selectOption('2');
      await page.locator('#itemDetailPage:not(.hide) .ng-format-badge[data-format="da"]').waitFor({ state: 'detached' });
      pass('desktop: source badges follow native audio track selection');
    }
    await noOverflow(page, `${name} detail`);
    await page.screenshot({ path: path.join(root, 'docs/images', `${name}-detail.png`), animations: 'disabled' });
    pass(`${name}: movie detail artwork and native actions`);
    await page.evaluate(hash => { location.hash = hash; }, `#/details?id=${profile.season}`);
    await page.locator('#itemDetailPage:not(.hide) #listChildrenCollapsible .listItem').first().waitFor({ state: 'visible', timeout: 30000 });
    await settleArtwork(page);
    await page.locator('#itemDetailPage:not(.hide) #listChildrenCollapsible').evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 110));
    await noOverflow(page, `${name} episodes`);
    const episodeColumns = await page.locator('#listChildrenCollapsible .vertical-list').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    assert.equal(episodeColumns, name === 'mobile' ? 1 : 2, 'Episode landscape grid differs from the intended viewport layout');
    const episodeDock = await page.locator('#listChildrenCollapsible .listItem').first().evaluate(card => {
      const body = card.querySelector('.listItemBody').getBoundingClientRect();
      const dock = card.querySelector('.listViewUserDataButtons').getBoundingClientRect();
      const controls = [...card.querySelectorAll('.listViewUserDataButtons button')];
      return { body: { x: body.x, bottom: body.bottom }, dock: { x: dock.x, y: dock.y }, controls: controls.length,
        centered: controls.every(button => { const b = button.getBoundingClientRect(), icon = button.querySelector('.material-icons').getBoundingClientRect(); return Math.abs((b.left + b.right - icon.left - icon.right) / 2) <= 2; }) };
    });
    assert.equal(episodeDock.controls, name === 'mobile' ? 2 : 4, 'All episode actions exposed by this legacy mode must remain present');
    assert(episodeDock.centered, 'Episode icons must be centered in equal hit targets');
    assert(name === 'mobile' ? episodeDock.dock.y >= episodeDock.body.bottom - 1 : episodeDock.dock.x > episodeDock.body.x, 'Episode dock must move below metadata on mobile and beside it on desktop');
    await page.screenshot({ path: path.join(root, 'docs/images', `${name}-episodes.png`), animations: 'disabled', ...(name === 'desktop' ? { clip: { x: 0, y: 0, width: viewport.width, height: 700 } } : {}) });
    pass(`${name}: season episodes and actions`, { episodeColumns });
    if (name === 'desktop') {
      await page.evaluate(() => { location.hash = '#/home'; });
      await page.locator('#indexPage:not(.hide) #homeTab.is-active .card').first().waitFor({ state: 'visible', timeout: 30000 });
      // Pin the same playable movie verified by validate-player, so this check
      // does not depend on whichever recent title Jellyfin returns first.
      await page.route('**/NoirGlass/Settings*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ enabled: true, pinnedItemIds: [profile.movie] }) }));
      await page.addScriptTag({ content: companion });
      await page.locator('.ng-feature').waitFor({ state: 'visible', timeout: 30000 });
      await page.locator('.ng-feature__action--primary').click();
      const playbackResult = await page.waitForFunction(() => {
        if (document.querySelector('#videoOsdPage:not(.hide)')?.getBoundingClientRect().width) return 'player';
        if ([...document.querySelectorAll('.dialog')].some(element => element.getClientRects().length && element.innerText.includes('Playback Error'))) return 'playback-error';
        return false;
      }, {}, { timeout: 30000 }).then(handle => handle.jsonValue());
      if (playbackResult === 'playback-error') report.limitations.push('Featured Play reached Jellyfin playback, but the selected stream returned a native Playback Error in this run.');
      if (playbackResult === 'player') {
        const osdStyle = await page.evaluate(() => {
          const audio = getComputedStyle(document.querySelector('#videoOsdPage .btnAudio .material-icons')).maskImage;
          const volume = getComputedStyle(document.querySelector('#videoOsdPage .buttonMute .material-icons')).maskImage;
          const dock = getComputedStyle(document.querySelector('#videoOsdPage .videoOsdBottom .buttons')).backgroundColor;
          return { distinctIcons: audio !== volume && audio.includes('data:image/svg+xml') && volume.includes('data:image/svg+xml'), dockAlpha: dock.startsWith('rgba(') ? Number(dock.slice(dock.lastIndexOf(',') + 1, -1)) : 1 };
        });
        assert(osdStyle.distinctIcons && osdStyle.dockAlpha < 1, 'Player needs distinct Audio/Volume icons and a translucent dock');
        pass('desktop: distinct Audio waveform and translucent player dock', osdStyle);
      }
      pass('desktop: featured Play delegates to native Jellyfin playback', { playbackResult });
    }
    await context.close();
    const loginContext = await browser.newContext({ viewport, storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'layout', value: `${name === 'mobile' ? 'mobile' : 'desktop'}-legacy` }] }] } });
    await loginContext.route('https://noirglass.invalid/**', route => route.fulfill({ contentType: 'text/css', body: css }));
    const loginPage = await loginContext.newPage();
    await loginPage.goto(`${origin}/web/#/login`, { waitUntil: 'domcontentloaded' });
    await loginPage.locator('#loginPage').waitFor({ state: 'visible', timeout: 30000 });
    await loginPage.addStyleTag({ content: '@import url("https://noirglass.invalid/dist/noirglass.min.css");' });
    await noOverflow(loginPage, `${name} login`);
    await loginPage.screenshot({ path: path.join(root, 'docs/images', `login-${name}.png`), animations: 'disabled' });
    pass(`${name}: native login methods retained`);
    await loginContext.close();
  }
} catch (error) {
  report.limitations.push(error.message.replaceAll(origin, '[private server]').replace(/[a-f0-9]{32}/gi, '[private item]'));
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(path.join(root, '.local/verification/companion.json'), JSON.stringify(report, null, 2) + '\n');
}
