import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './build.mjs';

const script = await readFile(path.join(root, 'dist/noirglass.companion.js'), 'utf8');
const css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l6cAAAAASUVORK5CYII=', 'base64');
const browser = await chromium.launch({ headless: true });

async function fixture({ interval = 5, reducedMotion = 'no-preference', theme = true, fakeClock = true, viewport = { width: 1440, height: 900 } } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width <= 500, reducedMotion });
  await context.route('**/backdrop.png', route => route.fulfill({ contentType: 'image/png', body: tinyPng }));
  await context.route('http://noirglass.test/web/**', route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><div id="indexPage"><div id="homeTab" class="is-active"><div class="card">Native shelf</div></div></div><div style="height:2000px"></div></body></html>'
  }));
  const page = await context.newPage();
  if (fakeClock) {
    await page.clock.install();
    // Keep virtual time fixed between explicit advances, even on a busy CI host.
    await page.clock.pauseAt(new Date(Date.now() + 100));
  }
  await page.goto('http://noirglass.test/web/#/home');
  const style = await page.addStyleTag({ content: theme ? css : ':root{--ng-bg:#000}' });
  await page.evaluate(seconds => {
    const items = [
      { Id: '11111111111111111111111111111111', Type: 'Movie', Name: 'First Film', BackdropImageTags: ['a'] },
      { Id: '22222222222222222222222222222222', Type: 'Movie', Name: 'Second Film', BackdropImageTags: ['b'] }
    ];
    window.ApiClient = {
      getCurrentUserId: () => 'viewer',
      getItems: async () => ({ Items: items }),
      getImageUrl: () => `${location.origin}/backdrop.png`,
      getUrl: value => `${location.origin}/${value}`,
      getJSON: async () => ({ enabled: true, pinnedItemIds: [], intervalSeconds: seconds })
    };
  }, interval);
  await page.mouse.move(1400, 880);
  await page.addScriptTag({ content: script });
  if (fakeClock) await page.clock.runFor(250);
  else await page.waitForTimeout(250);
  if (theme) await page.locator('.ng-feature').waitFor({ state: 'visible' });
  return { page, context, style };
}

try {
  const { page, context } = await fixture();
  assert.equal(await page.locator('.ng-feature__title').textContent(), 'First Film');
  await page.clock.runFor(4000);
  assert.equal(await page.locator('.ng-feature__dot[aria-current="true"]').getAttribute('aria-label'), 'Show featured title 1: First Film');
  await page.clock.runFor(1200);
  assert.equal(await page.locator('.ng-feature__dot[aria-current="true"]').getAttribute('aria-label'), 'Show featured title 2: Second Film');
  assert.equal(await page.locator('.ng-feature__slide').count(), 2, 'Horizontal transition keeps outgoing and incoming slides');
  if (process.env.NOIRGLASS_CAPTURE === '1') {
    await mkdir(path.join(root, 'test-results'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'test-results/noirglass-carousel-transition.png') });
  }
  await page.clock.runFor(800);
  assert.equal(await page.locator('.ng-feature__slide').count(), 1, 'Outgoing slide is cleaned up');
  console.log('PASS 5-second autoplay uses a horizontal slide and cleans up');

  await page.mouse.move(500, 300);
  await page.clock.runFor(10000);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  await page.mouse.move(1400, 880);
  await page.clock.runFor(5200);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'First Film');
  await page.clock.runFor(800);
  console.log('PASS hover pauses and leaving resumes autoplay');

  await page.locator('.ng-feature__pause').click();
  assert.equal(await page.locator('.ng-feature__pause').getAttribute('aria-pressed'), 'true');
  await page.mouse.move(1400, 880);
  await page.evaluate(() => document.activeElement.blur());
  await page.clock.runFor(10000);
  assert.equal(await page.locator('.ng-feature__title').textContent(), 'First Film');
  await page.locator('.ng-feature__pause').click();
  await page.mouse.move(1400, 880);
  await page.evaluate(() => document.activeElement.blur());
  await page.clock.runFor(5200);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  console.log('PASS Pause/Resume control keeps its state and timing');

  await page.clock.runFor(800);
  await page.locator('.ng-feature__pause').focus();
  await page.clock.runFor(10000);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  await page.evaluate(() => document.activeElement.blur());
  await page.clock.runFor(5200);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'First Film');
  await page.clock.runFor(800);
  console.log('PASS keyboard focus pauses autoplay');

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(10000);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'First Film');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(5200);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  await page.clock.runFor(800);
  console.log('PASS hidden page pauses autoplay');

  await page.evaluate(() => scrollTo(0, 1200));
  await page.clock.runFor(200);
  await page.clock.runFor(10000);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  await page.evaluate(() => { scrollTo(0, 0); dispatchEvent(new Event('scroll')); });
  await page.clock.runFor(5200);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'First Film');
  await page.clock.runFor(800);
  console.log('PASS off-screen carousel pauses autoplay');

  await page.evaluate(() => document.querySelector('.ng-feature__arrow[aria-label="Next featured title"]').click());
  await page.clock.runFor(800);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  await page.clock.runFor(4000);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'Second Film');
  await page.clock.runFor(1200);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'First Film');
  await page.clock.runFor(800);
  await page.evaluate(() => {
    const next = document.querySelector('.ng-feature__arrow[aria-label="Next featured title"]');
    next.click();
    next.click();
  });
  await page.clock.runFor(800);
  assert.equal(await page.locator('.ng-feature__slide').count(), 1);
  assert.equal(await page.locator('.ng-feature__slide[aria-hidden="false"] .ng-feature__title').textContent(), 'First Film');
  console.log('PASS manual navigation resets the timer and rapid input leaves one slide');

  await page.evaluate(() => {
    const widget = document.createElement('section');
    widget.id = 'external-widget';
    widget.innerHTML = '<video id="external-video"></video><button>External action</button>';
    document.body.append(widget);
    window.__ngExternalPauseCalls = 0;
    const video = widget.querySelector('video');
    video.pause = () => { window.__ngExternalPauseCalls++; };
    video.dispatchEvent(new Event('play'));
  });
  await page.clock.runFor(1200);
  const externalState = () => page.evaluate(() => ({
    inert: document.querySelector('#external-widget').inert,
    aria: document.querySelector('#external-widget').getAttribute('aria-hidden'),
    muted: document.querySelector('#external-video').muted,
    pauses: window.__ngExternalPauseCalls
  }));
  assert.deepEqual(await externalState(), { inert: false, aria: null, muted: false, pauses: 0 });
  await page.evaluate(() => { location.hash = '#/search'; document.querySelector('#indexPage').classList.add('hide'); });
  await page.clock.runFor(200);
  assert.equal(await page.locator('.ng-feature').count(), 0);
  await page.clock.runFor(10000);
  assert.equal(await page.locator('#homeTab .card').count(), 1);
  assert.deepEqual(await externalState(), { inert: false, aria: null, muted: false, pauses: 0 });
  console.log('PASS route cleanup retains shelves and leaves unrelated video/widgets untouched');
  await context.close();

  const disabled = await fixture({ interval: 0 });
  assert.equal(await disabled.page.locator('.ng-feature__pause').isVisible(), false);
  await disabled.page.clock.runFor(30000);
  assert.equal(await disabled.page.locator('.ng-feature__title').textContent(), 'First Film');
  await disabled.context.close();
  console.log('PASS administrator interval 0 disables autoplay');

  const reduced = await fixture({ reducedMotion: 'reduce' });
  assert.equal(await reduced.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ng-feature-slide-duration').trim()), '0ms');
  await reduced.page.clock.runFor(30000);
  assert.equal(await reduced.page.locator('.ng-feature__title').textContent(), 'First Film');
  await reduced.page.locator('.ng-feature__dot').nth(1).click();
  assert.equal(await reduced.page.locator('.ng-feature__slide').count(), 1);
  assert.equal(await reduced.page.locator('.ng-feature__title').textContent(), 'Second Film');
  await reduced.context.close();
  console.log('PASS reduced motion stops autoplay and uses instant manual changes');

  const interaction = await fixture({ interval: 0, reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  await interaction.page.locator('.ng-feature__arrow[aria-label="Next featured title"]').focus();
  await interaction.page.keyboard.press('ArrowRight');
  assert.equal(await interaction.page.locator('.ng-feature__title').textContent(), 'Second Film');
  await interaction.page.locator('.ng-feature').evaluate(element => {
    const start = new Touch({ identifier: 1, target: element, clientX: 80, clientY: 300 });
    const end = new Touch({ identifier: 1, target: element, clientX: 300, clientY: 302 });
    element.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [start], touches: [start], bubbles: true }));
    element.dispatchEvent(new TouchEvent('touchend', { changedTouches: [end], touches: [], bubbles: true }));
  });
  assert.equal(await interaction.page.locator('.ng-feature__title').textContent(), 'First Film');
  await interaction.page.locator('.ng-feature__title').evaluate(element => {
    element.textContent = 'An Exceptionally Long Featured Title With Many Words And No Missing Native Actions';
  });
  assert(await interaction.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Long mobile title must not overflow horizontally');
  assert.equal(await interaction.page.locator('.ng-feature').count(), 1);
  await interaction.context.close();
  console.log('PASS mobile keyboard and touch navigation retain one hero with long-title containment');

  const mismatch = await fixture({ theme: false });
  assert.equal(await mismatch.page.locator('.ng-feature').count(), 0);
  assert.equal(await mismatch.page.locator('#homeTab .card').count(), 1);
  await mismatch.context.close();
  console.log('PASS incompatible CSS leaves native Home intact');

  const removedTheme = await fixture();
  await removedTheme.style.evaluate(element => element.remove());
  await removedTheme.page.clock.runFor(200);
  assert.equal(await removedTheme.page.locator('.ng-feature').count(), 0);
  assert.equal(await removedTheme.page.locator('#homeTab .card').count(), 1);
  await removedTheme.context.close();
  console.log('PASS removing CSS tears down the hero and restores native Home');

  const realMotion = await fixture({ interval: 0, fakeClock: false });
  await realMotion.page.evaluate(() => document.querySelector('.ng-feature__arrow[aria-label="Next featured title"]').click());
  await realMotion.page.waitForTimeout(325);
  const positions = await realMotion.page.locator('.ng-feature__slide').evaluateAll(slides => slides.map(slide => ({
    x: slide.getBoundingClientRect().x,
    width: slide.getBoundingClientRect().width
  })));
  assert.equal(positions.length, 2);
  assert(positions[0].x < 0 && positions[1].x > 0 && positions[1].x < positions[1].width,
    'Both panels must move horizontally during the live CSS transition');
  if (process.env.NOIRGLASS_CAPTURE === '1') {
    await realMotion.page.screenshot({ path: path.join(root, 'test-results/noirglass-carousel-real-transition.png') });
  }
  await realMotion.context.close();
  console.log('PASS real-time CSS transition moves both panels horizontally');
} finally {
  await browser.close();
}
