import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { root } from './build.mjs';
import { sixteenNine, adaptedViewports } from './viewports.mjs';

const css = await readFile(path.resolve(root, process.env.NOIRGLASS_TEST_CSS || 'dist/noirglass.min.css'), 'utf8');
const dir = path.join(root, 'test-results/dashboard-layout');
await mkdir(dir, { recursive: true });
// Structural rules measured in Jellyfin 12.1 Legacy: 48px native toolbar and
// independent spacer; 240px sidebar; absolutely positioned legacy pages;
// content and direct forms each have their own native width cap. The real
// application owns breakpoint/grid behavior, scrolling and route offsets.
const scaffold = `
  html{font-size:14.88px;background:#101010}*{box-sizing:border-box}body{margin:0;background:transparent!important}
  .MuiAppBar-root{position:fixed;left:240px;right:0;top:0;z-index:100}
  .MuiToolbar-root,.header-spacer{height:48px;min-height:48px}
  .MuiToolbar-root{display:flex;align-items:center;padding:0 16px}
  .MuiDrawer-paper{position:fixed;top:0;bottom:0;left:0;width:240px}
  main{position:relative;height:100vh}.skinBody{position:relative;height:calc(100vh - 48px)}
  .mainAnimatedPage{position:absolute;top:0;bottom:0;left:240px;right:0;overflow:auto;padding-bottom:5em}
  .content-primary{max-width:56rem;padding:0 1em 5em}
  .content-primary>form{max-width:54em;margin:0}
  .pluginConfigurationPage .content-primary{margin:auto}
  h1,h2{margin:0 0 24px}.MuiFormControl-root,.MuiInputBase-root,input.emby-input{display:block;width:100%}
  .MuiInputBase-input{width:100%;padding:16px;border:0;background:transparent}
  .inputContainer,.MuiFormControl-root{margin:0 0 24px}
  .overview-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:-24px 0 0 -24px;width:calc(100% + 24px)}
  .overview-grid>.MuiGrid-item{padding:24px 0 0 24px;min-width:0}
  .plugin-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:24px}
  .MuiCard-root{min-width:0}.MuiCardActionArea-root{display:block;width:100%;border:0;background:none}
  .plugin-art{height:120px;background:#393942}.MuiTableContainer-root{width:100%}
  .MuiTable-root{width:100%;border-collapse:collapse}.MuiTablePagination-toolbar{display:flex;align-items:center;justify-content:flex-end}
  .metadataEditorPage{left:0}.metadata .MuiAppBar-root{left:0}.metadata .MuiDrawer-paper{display:none}
  .editPageSidebar{position:fixed;top:3.25em;bottom:0;left:0;width:25%;overflow:auto}
  .libraryTree{margin-left:4px}.jstree-anchor{display:block}
  .editPageInnerContent{margin-left:calc(25% + 2.5em);margin-right:10px}
  .MuiContainer-root{margin:auto;max-width:1200px;padding:0 24px}
  .container-shell .skinBody{margin-left:240px;width:calc(100% - 240px)}
  .tabs-shell .MuiAppBar-root{height:auto}.tabs-shell .header-spacer{height:96px}
  .tabs-shell .skinBody{height:calc(100vh - 96px)}
  .tabs-shell .MuiTabs-root{height:48px;display:flex;align-items:center}
  @media(max-width:899px){.MuiDrawer-paper{display:none}.MuiAppBar-root,.mainAnimatedPage{left:0}.container-shell .skinBody{margin-left:0;width:100%}}
  @media(max-width:1199px){.overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.plugin-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:599px){.overview-grid{grid-template-columns:1fr}.plugin-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.editPageSidebar{width:100%}.editPageSidebar-withcontent{display:none}.editPageSidebar-withcontent+.editPageInnerContent{margin-left:0}}
`;
const field = '<div class="inputContainer"><label>Example field<input class="emby-input" value="Long readable configuration value"></label></div>';
const muiField = '<div class="MuiFormControl-root"><div class="MuiInputBase-root"><input class="MuiInputBase-input" aria-label="Example field" value="Example configuration"></div></div>';
const cards = (count, title) => Array.from({ length: count }, (_, i) => `<article class="MuiCard-root"><div class="plugin-art"></div><div class="MuiCardContent-root">${title} ${i+1}<p class="MuiTypography-root">Readable information with a long label</p></div></article>`).join('');
const rows = Array.from({ length: 25 }, (_, i) => `<tr class="MuiTableRow-root"><td class="MuiTableCell-root">Example device ${i+1}</td><td class="MuiTableCell-root">Today</td><td class="MuiTableCell-root"><button class="MuiIconButton-root" aria-label="More">⋯</button></td></tr>`).join('');
const table = `<h1>Devices</h1><div class="MuiTableContainer-root MuiPaper-root"><table class="MuiTable-root"><thead class="MuiTableHead-root"><tr><th class="MuiTableCell-root">Device</th><th class="MuiTableCell-root">Activity</th><th class="MuiTableCell-root">Actions</th></tr></thead><tbody>${rows}</tbody></table></div><footer class="MuiTablePagination-toolbar">1–25 of 25<button class="MuiIconButton-root" aria-label="Next page">→</button></footer>`;
const fixtures = [
  { id: 'react-form', markup: `<form><h1 class="MuiTypography-root">General</h1>${muiField.repeat(8)}<button class="MuiButton-root">Save</button></form>`, form: true },
  { id: 'plugin-settings', page: 'pluginConfigurationPage', markup: `<form><h1>Plugin settings</h1>${field.repeat(5)}<button class="emby-button raised">Save</button></form>`, form: true },
  { id: 'overview', markup: `<div class="overview-grid MuiGrid-root MuiGrid-container">${Array.from({length:3},()=>`<div class="MuiGrid-item">${cards(1,'Overview panel')}</div>`).join('')}</div>`, cards: 3 },
  { id: 'plugins', markup: `<h1>Plugins</h1><div class="plugin-grid">${cards(6,'Plugin')}</div>`, cards: 6 },
  { id: 'table', markup: table, table: true },
  { id: 'react-container', container: true, markup: `<h1>Container page</h1>${muiField.repeat(2)}` },
  { id: 'tabbed-header', tabs: true, markup: `<form><h1>Configuration tabs</h1>${muiField}</form>`, form: true },
  { id: 'metadata', metadata: true, markup: `<aside class="editPageSidebar editPageSidebar-withcontent"><div class="libraryTree">${'<a class="jstree-anchor" href="#">Library item</a>'.repeat(40)}</div></aside><div class="editPageInnerContent"><h1>Metadata editor</h1><form>${field.repeat(15)}</form></div>` },
  { id: 'metadata-tree', metadata: true, treeOnly: true, markup: `<aside class="editPageSidebar"><div class="libraryTree">${'<a class="jstree-anchor" href="#">Library item</a>'.repeat(40)}</div></aside><div class="editPageInnerContent" hidden></div>` }
];
const sizes = [...sixteenNine, ...adaptedViewports];
const browser = await chromium.launch({ headless: true });
const results = [];
function shell(fixture, width) {
  const classes = ['dashboardDocument',fixture.metadata?'metadata':'',fixture.tabs?'tabs-shell':'',fixture.container?'container-shell':''].join(' ');
  const content = fixture.metadata ? fixture.markup : `<div class="content-primary">${fixture.markup}</div>`;
  const body = fixture.container ? `<div class="MuiContainer-root">${fixture.markup}</div>` : `<div class="page mainAnimatedPage ${fixture.page || ''} ${fixture.metadata?'metadataEditorPage':''}">${content}</div>`;
  return `<!doctype html><html class="layout-${width<=500?'mobile':'desktop'}"><head><style>${scaffold}</style></head><body class="${classes}"><header class="MuiAppBar-root MuiPaper-root"><div class="MuiToolbar-root">Native toolbar</div>${fixture.tabs?'<nav class="MuiTabs-root"><button class="MuiTab-root">Profile</button></nav>':''}</header><aside class="MuiDrawer-paper">Native sidebar</aside><main><div class="header-spacer"></div><div class="skinBody">${body}</div></main></body></html>`;
}
async function check(page, fixture, width, height) {
  const geometry = await page.evaluate(fixture => {
    const rect = e => { const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}; };
    const content=document.querySelector(fixture.container?'.MuiContainer-root':'.content-primary');
    return { header:rect(document.querySelector('.MuiAppBar-root')),spacer:rect(document.querySelector('.header-spacer')),
      available:content?.parentElement.clientWidth,
      content:content&&rect(content),heading:rect(document.querySelector(fixture.treeOnly?'.jstree-anchor':fixture.id==='overview'?'.MuiCard-root':'h1')),
      form:fixture.form&&rect(content.querySelector('form')),field:fixture.form&&rect(content.querySelector('.MuiInputBase-root,.emby-input')),
      cards:[...document.querySelectorAll('.MuiCard-root')].map(rect),
      tree:fixture.metadata&&rect(document.querySelector('.libraryTree')),editor:fixture.metadata&&rect(document.querySelector('.editPageInnerContent')),
      overflow:document.documentElement.scrollWidth>innerWidth };
  }, fixture);
  const gutter=width<=768?16:32,gap=width<=768?16:24,offset=fixture.metadata||width<900?0:240;
  assert.equal(geometry.header.height,fixture.tabs?96:48,`${fixture.id} ${width}: AppBar border must not enlarge native toolbar`);
  assert.equal(geometry.header.bottom,geometry.spacer.bottom,`${fixture.id}: header/spacer mismatch`);
  assert(!geometry.overflow,`${fixture.id} ${width}: document overflow`);
  assert.equal(await page.locator('html').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)','Dashboard canvas overrides native gray');
  assert(Math.abs(geometry.heading.y-(geometry.header.bottom+gap))<1,`${fixture.id} ${width}: heading clearance`);
  if(fixture.metadata) {
    if(geometry.tree.width>0) assert(geometry.tree.y>=geometry.header.bottom+gap-1,'Fixed tree must clear header');
    if(!fixture.treeOnly) {
      assert.equal(geometry.editor.y,geometry.header.bottom+gap);
      assert(geometry.editor.x>=width*(width<=599?0:0.25),'Keep native split');
      assert(geometry.editor.x+geometry.editor.width<=width,'Editor stays in its pane');
      if(width<=599) assert.equal(geometry.tree.width,0,'Mobile editor retains native tree dismissal');
    } else if(width<=599) assert.equal(geometry.tree.width,width-4,'Mobile tree uses native full width');
  } else {
    assert.equal(geometry.content.x,offset,`${fixture.id}: keep native sidebar offset`);
    assert.equal(geometry.content.width,geometry.available,`${fixture.id}: use available width`);
    assert(geometry.available>=width-offset-20,`${fixture.id}: only native scrollbars may reduce available width`);
    assert.equal(geometry.heading.x,offset+gutter,`${fixture.id}: inline gutter`);
    if(fixture.form) {
      const expectedForm=fixture.id==='plugin-settings'&&width>500?Math.min(geometry.available-gutter*2,56*14.88):geometry.available-gutter*2;
      assert(Math.abs(geometry.form.width-expectedForm)<1,`${fixture.id}: bounded plugin form or full-width Dashboard form`);
      const expectedField=width<=768?geometry.form.width:Math.min(geometry.form.width,Math.max(320,Math.min(geometry.form.width*.5,Math.max(geometry.form.width*.25,48*14.88))));
      assert(Math.abs(geometry.field.width-expectedField)<1,`${fixture.id}: compact fields within full-width form`);
    }
    if(fixture.cards) {
      assert.equal(geometry.cards.length,fixture.cards);
      if(width>=1440) assert(geometry.cards[0].width>=(fixture.cards===3?360:160),'Cards have readable desktop width');
    }
    if(fixture.table) {
      const footer=page.locator('.MuiTablePagination-toolbar');
      const before=await footer.boundingBox();
      await footer.scrollIntoViewIfNeeded();
      const bounds=await footer.boundingBox();
      assert(bounds.y>=geometry.header.bottom&&bounds.y+bounds.height<=height,'Pagination reachable through native page scroll');
      if(before.y+before.height>height) assert(await page.locator('.mainAnimatedPage').evaluate(e=>e.scrollTop>0),'Off-screen footer is reached through page scrolling');
      if(width===390) assert(await page.locator('.MuiTableContainer-root').evaluate(e=>e.scrollWidth>e.clientWidth),'Wide table scrolls inside container');
    }
  }
  results.push({fixture:fixture.id,width,height,...geometry});
}
try {
  const page=await browser.newPage();
  for(const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    for(const fixture of fixtures) {
      await page.setContent(shell(fixture,width));await page.addStyleTag({content:css});await page.evaluate(()=>document.fonts.ready);
      await check(page,fixture,width,height);
      await page.screenshot({path:path.join(dir,`${fixture.id}-${width}.png`),animations:'disabled'});
    }
  }
  // Resize in place: CSS must not depend on a route reload or desktop widths.
  await page.setContent(shell(fixtures[0],1920));await page.addStyleTag({content:css});
  for(const [width,height] of [...sizes].reverse()) {await page.setViewportSize({width,height});await check(page,fixtures[0],width,height);}
  // Later Settings rules cannot recenter a plugin page; post-import tokens work.
  await page.setViewportSize({width:2560,height:1440});await page.setContent(shell(fixtures[1],2560));await page.addStyleTag({content:css});
  await page.addStyleTag({content:':root{--ng-admin-page-gutter:40px;--ng-admin-page-top-gap:30px}'});
  assert.equal((await page.locator('h1').boundingBox()).x,280);assert.equal((await page.locator('h1').boundingBox()).y,78);
  assert(Math.abs((await page.locator('.content-primary>form').boundingBox()).width-56*14.88)<1,'Plugin form keeps its own width while page gutter overrides apply');
  // User Settings and portaled editors retain their independent width limits.
  await page.setContent(`<!doctype html><html class="layout-desktop"><head><style>${scaffold}</style></head><body><div id="displayPreferencesPage"><div class="content-primary">${field}</div></div><div class="pluginConfigurationPage"><div class="content-primary">${field}</div></div><div class="dialog formDialog"><form>${field}</form></div></body></html>`);
  await page.addStyleTag({content:css});
  for(const selector of ['#displayPreferencesPage .content-primary','.pluginConfigurationPage .content-primary']) assert((await page.locator(selector).boundingBox()).width<850,'User Settings keep compact columns');
  assert((await page.locator('.formDialog').boundingBox()).width<=834,'Portaled editor keeps its token-based width');
  await writeFile(path.join(dir,'geometry.json'),JSON.stringify(results,null,2)+'\n');
  console.log(`PASS ${results.length} full-shell Dashboard geometry states: native header/spacer/sidebar, inner forms, grids, tables, plugin settings, Metadata Manager, resizing and overrides`);
} finally { await browser.close(); }
