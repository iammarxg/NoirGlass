import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import postcss from 'postcss';
import { root, modules, compile, variableTable } from './build.mjs';

const declared = new Set();
const used = new Set();
assert.equal(modules.length,16,'Shared UI and media components must be included in the explicit build');
for (const name of modules) {
  const css = await readFile(path.join(root,'src',`${name}.css`),'utf8');
  const ast = postcss.parse(css, { from: `${name}.css`, map: false });
  ast.walkDecls(d => {
    if (d.prop.startsWith('--ng-')) declared.add(d.prop);
    for (const match of d.value.matchAll(/var\((--ng-[a-z-]+)/g)) used.add(match[1]);
    if (name !== 'variables') {
      assert(!/#(?:[\da-f]{3,8})\b|\brgba?\(|\bhsla?\(/i.test(d.value), `${name}: visual color is not a token: ${d.value}`);
      assert(!/\b\d+(?:\.\d+)?(?:px|rem|em|ms|svh|vw|vh)\b/.test(d.value.replace(/var\([^)]*\)/g,'')), `${name}: visual length is not a token: ${d.value}`);
    }
    assert(!/nflxext|JellyFlix|Ultrachromic/.test(d.value), 'Borrowed external runtime asset detected');
  });
}
for (const token of used) assert(declared.has(token), `Undefined custom property ${token}`);
const first = await compile(), second = await compile();
assert.equal(first,second,'Build output must be deterministic');
assert.equal(await readFile(path.join(root,'dist/noirglass.min.css'),'utf8'),first,'Committed distribution is stale; run npm run build');
const ast = postcss.parse(first, { from: undefined, map: false });
assert(first.includes('--ng-companion-contract:1') && !first.includes('--nl-'), 'Compiled CSS must use the NoirGlass compatibility contract and tokens');
for (const token of declared) assert(first.includes(token),`Minifier dropped custom property ${token}`);
assert(ast.nodes.length > 0);
const readme = await readFile(path.join(root,'README.md'),'utf8');
const customization = await readFile(path.join(root,'docs/CUSTOMIZATION.md'),'utf8');
const setup = await readFile(path.join(root,'docs/SETUP.md'),'utf8');
assert(customization.includes(await variableTable()), 'Customization variable table is stale');
assert(!readme.includes('<!-- variables:start -->'), 'Generated variables belong in the customization guide');
assert.equal((readme.match(/@import\s+url\(/g) || []).length,1,'README must show the CSS import once');
assert(readme.includes('@import url("https://cdn.jsdelivr.net/gh/iammarxg/NoirGlass@latest/dist/noirglass.min.css");'), 'README CSS installation URL must match the release distribution');
const catalogUrl = 'https://github.com/iammarxg/NoirGlass/releases/latest/download/manifest.json';
assert(readme.includes(catalogUrl) && setup.includes(catalogUrl), 'README and setup must use the latest release catalog');
assert(readme.includes('<details>') && readme.includes('<summary>Screenshots</summary>') && readme.includes('</details>'), 'README screenshots must be collapsed');
const screenshotSection = readme.match(/<details>\s*<summary>Screenshots<\/summary>([\s\S]*?)<\/details>/)?.[1] || '';
for (const name of ['desktop-feature','mobile-feature','desktop-navigation','mobile-navigation','desktop-detail','mobile-detail','desktop-library','mobile-library','desktop-search-results','mobile-search-results','desktop-episodes','mobile-episodes','login-desktop','login-mobile']) assert(screenshotSection.includes(`${name}.png`), `Missing gallery preview: ${name}`);
assert.equal((screenshotSection.match(/!\[/g) || []).length,14,'Gallery must contain seven desktop/mobile pairs');
assert(readme.includes('Tested on Jellyfin 12.1.'), 'README must retain the Jellyfin testing target');
assert(readme.includes('Desktop (Legacy)') && readme.includes('Mobile (Legacy)'), 'README must retain the supported display modes');
assert(!readme.includes('tv-feature.png'), 'The removed TV-size feature showcase must not return to the README');
await assert.rejects(readFile(path.join(root,'docs/images/tv-feature.png')), { code: 'ENOENT' });
for (const token of declared) assert(customization.includes(`\`${token}\``),`Undocumented variable ${token}`);
const font = await readFile(path.join(root,'dist/fonts/InterVariable.woff2'));
const companion = await readFile(path.join(root,'dist/noirglass.companion.js'),'utf8');
assert.equal(companion,await readFile(path.join(root,'scripts/companion.js'),'utf8'),'Companion asset is stale; run npm run build');
assert(!companion.includes('==UserScript==') && companion.includes("getJSON(api.getUrl('NoirGlass/Settings'))"),'Plugin companion must load authenticated settings');
assert(!companion.includes('localStorage.setItem') && !companion.includes('sessionStorage.setItem'),'Companion must not persist authentication or metadata');
assert.equal(font.subarray(0,4).toString(),'wOF2','Font must be a real WOFF2 file');
assert(font.equals(await readFile(path.join(root,'assets/fonts/InterVariable.woff2'))),'Distribution font differs from source');
assert(first.includes(font.toString('base64')),'Single-import distribution must embed the font');
assert(first.includes('data:image/svg+xml,'),'Single-import distribution must embed original icons');
assert(!first.includes('../assets/icons/') && !first.includes('./fonts/InterVariable.woff2'),'Distribution must not reference local source assets');
assert(!readme.includes('<OWNER>') && readme.includes('iammarxg/NoirGlass'),'Installation examples must use the requested GitHub owner');
const manifest = JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
assert.equal(manifest[0].name,'NoirGlass');
assert.equal(manifest[0].versions[0].targetAbi,'12.1.0.0');
const archive = await readFile(path.join(root,'dist/NoirGlass.Plugin_12.1.0.zip'));
assert.equal(archive.readUInt32LE(0),0x04034b50,'Plugin archive must be ZIP');
assert.equal(createHash('md5').update(archive).digest('hex'),manifest[0].versions[0].checksum,'Plugin ZIP checksum differs from manifest');
assert((await readFile(path.join(root,'LICENSE'),'utf8')).includes('Ammar Alghamdi'),'MIT copyright name must match the requested owner');
assert(first.includes('SIL OPEN FONT LICENSE') && first.includes('Permission is hereby granted'),'Distribution must retain both licenses');
assert((await readFile(path.join(root,'dist/fonts/OFL.txt'),'utf8')).includes('SIL OPEN FONT LICENSE'));
for (const filename of ['README.md','CHANGELOG.md','docs/SETUP.md','docs/CUSTOMIZATION.md','docs/DEVELOPMENT.md','docs/UI-COVERAGE.md']) {
  const markdown = await readFile(path.join(root,filename),'utf8');
  assert(!/MediaBar|NoirLucent|Ubuntu|pre-rename|--nl-|\.nl-|\bpending\b|\bunverified\b/i.test(markdown), `Historical or internal-status content in ${filename}`);
  assert(!/\b(?:before|after) publication\b|\buntil then\b|\buntil[^\n.]*\bpublished\b/i.test(markdown), `Temporary publication instructions in ${filename}`);
  assert(!/\bNoirGlass\s+(?:theme\s+)?(?:\*\*)?\d+\.\d+\.\d+|\bplugin\s+(?:\(version\s+|\*\*)\d+\.\d+\.\d+/i.test(markdown), `Descriptive product version label in ${filename}`);
  assert.equal((markdown.match(/^```/gm) || []).length % 2,0, `Unclosed code fence in ${filename}`);
  for (const match of markdown.matchAll(/(!?)\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const target = match[2];
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const relative = decodeURIComponent(target.split('#')[0]);
    const resolved = path.resolve(root,path.dirname(filename),relative);
    const entry = await stat(resolved).catch(() => null);
    assert(entry, `Broken relative link in ${filename}: ${target}`);
    const fragment = target.split('#')[1];
    if (fragment && resolved.endsWith('.md')) {
      const destination = await readFile(resolved,'utf8');
      const anchors = [...destination.matchAll(/^#{1,6}\s+(.+)$/gm)].map(heading => heading[1].toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s/g,'-'));
      assert(anchors.includes(decodeURIComponent(fragment)), `Broken heading link in ${filename}: ${target}`);
    }
    if (match[1]) {
      assert(entry.isFile(), `Screenshot must be a file: ${target}`);
      const png = await readFile(resolved);
      assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a', `Invalid PNG in ${filename}: ${target}`);
    }
  }
}
const tvos = JSON.parse(await readFile(path.join(root,'reference/tvos-page-matrix.json'),'utf8'));
for (const page of ['home','navigation','search','library','movie-and-series-detail','episodes','player']) assert(tvos.screens.some(screen => screen.page === page), `Missing tvOS research page ${page}`);
assert.equal(declared.size,211,'Every public token must be documented');
assert(!/mediabar|slides-container|ss-settings|guardPlugin|silencePluginMedia|ng-companion-active/i.test(first + companion),'Distribution must not contain third-party hero integration');
for (const old of ['dist/jellytv.min.css','dist/jellytv.user.js','dist/noirlucent.min.css','dist/noirlucent.companion.js','dist/NoirLucent.Plugin_12.1.0.zip']) await assert.rejects(readFile(path.join(root,old)),{code:'ENOENT'});
console.log(`Checks passed: ${declared.size} tokens, ${modules.length} modules, deterministic minification, reference coverage, fonts, plugin package and documentation links.`);
