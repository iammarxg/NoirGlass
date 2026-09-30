import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Local developer helper. It does not start or administer a Jellyfin server.
const root = path.resolve(import.meta.dirname, '..');
const origin = new URL(process.env.NOIRGLASS_URL || 'http://localhost:8096').origin;
const port = Number(process.env.NOIRGLASS_BROWSER_PORT || 4319);
const browser = await chromium.launch({
  headless: false,
  ...(process.env.NOIRGLASS_BROWSER_EXECUTABLE ? { executablePath: process.env.NOIRGLASS_BROWSER_EXECUTABLE } : {})
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
let page = await context.newPage();
await page.goto(origin, { waitUntil: 'domcontentloaded' });
let css = '';
await context.route('https://noirglass.invalid/**', async route => {
  const requestPath = new URL(route.request().url()).pathname;
  if (requestPath === '/dist/noirglass.min.css') {
    await route.fulfill({ contentType: 'text/css', body: css });
  } else if (requestPath === '/dist/fonts/InterVariable.woff2') {
    await route.fulfill({ contentType: 'font/woff2', body: await readFile(path.join(root, 'dist/fonts/InterVariable.woff2')) });
  } else await route.abort();
});
async function preview() {
  css = await readFile(path.join(root, 'dist/noirglass.min.css'), 'utf8');
  await page.waitForLoadState('networkidle', {timeout:15000}).catch(() => {});
  await page.locator('#noirglass-preview').evaluateAll(elements => elements.forEach(e => e.remove()));
  await page.addStyleTag({ content: '@import url("https://noirglass.invalid/dist/noirglass.min.css");' }).then(h => h.evaluate(e => { e.id = 'noirglass-preview'; }));
  await page.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--ng-bg').trim() !== '');
  await page.evaluate(() => document.fonts.ready);
}
const server = http.createServer(async (req, res) => {
  if (req.headers.origin) { res.writeHead(403); res.end(); return; }
  try {
    if (req.method !== 'POST') throw new Error('POST only');
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 32768) throw new Error('Request too large'); }
    const command = JSON.parse(body || '{}');
    let result;
    switch (command.action) {
      case 'state':
        result = await page.evaluate(() => ({
          url: location.href, title: document.title, mode: document.documentElement.className,
          pages: [...document.querySelectorAll('[data-role="page"]')].filter(e => e.getBoundingClientRect().width).map(e => ({ id: e.id, classes: e.className })),
          ready: !!document.querySelector('#indexPage:not(.hide),#itemDetailPage:not(.hide)')
        })); break;
      case 'goto': {
        const url = new URL(command.url, origin);
        if (url.origin !== origin) throw new Error('Only the configured Jellyfin origin is allowed');
        await page.goto(url.href, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);
        if (css) await preview();
        result = { url: page.url() }; break;
      }
      case 'viewport':
        await page.setViewportSize(command.viewport);
        result = command.viewport; break;
      case 'hover':
        await page.locator(command.selector).nth(command.index || 0).hover();
        result = { hovered: command.selector }; break;
      case 'focus':
        await page.locator(command.selector).nth(command.index || 0).focus();
        result = { focused: command.selector }; break;
      case 'preview': await preview(); result = { preview: true, bytes: css.length }; break;
      case 'companion': {
        await page.evaluate(() => {
          const api = window.ApiClient;
          if (!api || window.__NoirGlassPreviewGetJSON) return;
          window.__NoirGlassPreviewGetJSON = api.getJSON.bind(api);
          api.getJSON = url => String(url).includes('NoirGlass/Settings')
            ? Promise.resolve({ enabled: true, pinnedItemIds: [] })
            : window.__NoirGlassPreviewGetJSON(url);
        });
        await page.addScriptTag({ content: await readFile(path.join(root, 'dist/noirglass.companion.js'), 'utf8') });
        result = { companion: true }; break;
      }
      case 'disable-companion': {
        result = await page.evaluate(() => {
          window.__NoirGlassCompanion?.destroy?.();
          if (window.__NoirGlassPreviewGetJSON && window.ApiClient) window.ApiClient.getJSON = window.__NoirGlassPreviewGetJSON;
          delete window.__NoirGlassPreviewGetJSON;
          return { companion: false, featureCount: document.querySelectorAll('.ng-feature').length };
        });
        break;
      }
      case 'inspect':
        result = await page.evaluate(({ selectors, properties }) => ({
          viewport: { width: innerWidth, height: innerHeight },
          overflow: document.documentElement.scrollWidth > innerWidth,
          elements: selectors.map(selector => {
            const e = document.querySelector(selector);
            if (!e) return { selector, missing: true };
            const s = getComputedStyle(e), b = e.getBoundingClientRect();
            return { selector, classes: e.className, rect: { x: b.x, y: b.y, width: b.width, height: b.height },
              styles: Object.fromEntries(properties.map(p => [p, s.getPropertyValue(p)])),
              count: document.querySelectorAll(selector).length };
          })
        }), { selectors: command.selectors, properties: command.properties || ['color','background-color','font-family','font-size','padding','gap','display','visibility'] }); break;
      case 'evaluate':
        // Developer-only, loopback endpoint; never expose this port remotely.
        result = await page.evaluate(command.expression); break;
      case 'capture': {
        if (!/^[a-z0-9-]+\.png$/.test(command.name)) throw new Error('Use a simple PNG filename');
        const dir = path.join(root, command.public ? 'docs/images' : 'test-results');
        await mkdir(dir, { recursive: true });
        await page.evaluate(() => document.fonts.ready);
        const file = path.join(dir, command.name);
        await page.screenshot({ path: file, fullPage: !!command.fullPage, animations: 'disabled' });
        result = { file }; break;
      }
      case 'close': result = { closed: true }; setTimeout(async () => { server.close(); await browser.close(); }, 150); break;
      default: throw new Error('Unknown action');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result));
  } catch (error) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: error.message })); }
});
server.listen(port, '127.0.0.1', () => console.log(`Playwright browser ready on loopback port ${port}. Sign in manually; authentication stays in memory.`));
browser.on('disconnected', () => server.close());
