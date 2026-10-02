import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import CleanCSS from 'clean-css';
import postcss from 'postcss';
import { tokenDocs, quickTokens, groups } from './token-docs.mjs';

export const root = path.resolve(import.meta.dirname, '..');
export const modules = ['variables','icons','controls','dialogs','settings','dashboard','header','home','hero','cards','library','search','detail-page','player','login','companion'];
const icons = ['back','home','menu','users','cast','search','user','display','audio','audio-track','captions','play-all','shuffle','grid','sort','filter','info','check','heart','heart-filled','more','play','pause','rewind','forward','previous','next','volume','mute','settings','pip','fullscreen','fullscreen-exit'];
export async function compile() {
  const sources = await Promise.all(modules.map(name => readFile(path.join(root,'src',`${name}.css`),'utf8')));
  // Embed assets so the single stylesheet requires no separate font or icon requests.
  const font = await readFile(path.join(root,'assets/fonts/InterVariable.woff2'));
  const licenses = await Promise.all(['LICENSE','assets/fonts/OFL.txt'].map(file => readFile(path.join(root,file),'utf8')));
  let source = licenses.map(text => `/*! ${text.trim()} */`).join('\n') + '\n' + sources.join('\n').replace('url("./fonts/InterVariable.woff2")', `url("data:font/woff2;base64,${font.toString('base64')}")`);
  for (const name of icons) {
    const svg = await readFile(path.join(root, 'assets/icons', `${name}.svg`), 'utf8');
    source = source.replaceAll(`url("../assets/icons/${name}.svg")`, `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  }
  postcss.parse(source, { from: undefined, map: false });
  const result = new CleanCSS({ level: 1, rebase: false, compatibility: '*', format: false }).minify(source);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  if (result.warnings.length) console.warn(result.warnings.join('\n'));
  return result.styles + '\n';
}
export async function variableTable(entries = tokenDocs) {
  const ast = postcss.parse(await readFile(path.join(root,'src/variables.css'),'utf8'), { from: undefined, map: false });
  const defaults = new Map(), alternatives = new Map();
  ast.walkDecls(/^--ng-/, declaration => {
    const ancestor = declaration.parent.parent;
    if (ancestor.type === 'root') defaults.set(declaration.prop, declaration.value);
    else {
      const condition = ancestor.params || ancestor.name;
      alternatives.set(declaration.prop, [...(alternatives.get(declaration.prop) || []), `${condition}: ${declaration.value}`]);
    }
  });
  const esc = value => value.replaceAll('|','\\|');
  const docs = new Map();
  for (const entry of entries) {
    if (docs.has(entry.name)) throw new Error(`Duplicate token documentation: ${entry.name}`);
    if (!defaults.has(entry.name)) throw new Error(`Obsolete token documentation: ${entry.name}`);
    if (!entry.label || !entry.description || !entry.values || !entry.examples?.length || !groups.some(group => group.id === entry.group)) throw new Error(`Incomplete token documentation: ${entry.name}`);
    if ((entry.description.match(/[.!?](?=\s|$)/g) || []).length > 1 || /\n/.test(entry.description)) throw new Error(`Description must be one sentence: ${entry.name}`);
    docs.set(entry.name, entry);
  }
  for (const name of defaults.keys()) if (!docs.has(name)) throw new Error(`Missing token documentation: ${name}`);
  if (new Set(quickTokens).size !== 12 || quickTokens.some(name => !docs.has(name))) throw new Error('Quick guide must contain twelve distinct documented tokens');
  const responsive = value => value.replace('(max-width: 48rem):', 'Mobile (up to 48rem):').replace('(prefers-reduced-motion: reduce):', 'Reduced motion:').replace('not (backdrop-filter: blur(1px)):', 'Without backdrop blur:');
  const table = names => '| Setting / variable | What it does | Possible values & examples | Default | Responsive / fallback |\n| --- | --- | --- | --- | --- |\n' + names.map(name => {
    const entry = docs.get(name);
    return `| **${esc(entry.label)}**<br>\`${name}\` | ${esc(entry.description)} | ${esc(entry.values)}<br>Examples: ${entry.examples.map(value => `\`${esc(value)}\``).join(', ')} | \`${esc(defaults.get(name))}\` | ${alternatives.has(name) ? alternatives.get(name).map(value => esc(responsive(value))).join('<br>') : '—'} |`;
  }).join('\n');
  return '### Common settings\n\n' + table(quickTokens) + '\n\n### Advanced settings\n\n' + groups.map(group => {
    const names = entries.filter(entry => entry.group === group.id && !quickTokens.includes(entry.name)).map(entry => entry.name);
    return `<details>\n<summary>${group.label}</summary>\n\n${table(names)}\n\n</details>`;
  }).join('\n\n');
}
export async function build() {
  const css = await compile();
  await mkdir(path.join(root,'dist/fonts'), { recursive: true });
  await writeFile(path.join(root,'dist/noirglass.min.css'),css);
  await copyFile(path.join(root,'scripts/companion.js'), path.join(root,'dist/noirglass.companion.js'));
  for (const name of ['InterVariable.woff2','OFL.txt']) await copyFile(path.join(root,'assets/fonts',name), path.join(root,'dist/fonts',name));
  const filename = path.join(root,'docs/CUSTOMIZATION.md');
  const guide = await readFile(filename,'utf8');
  const tableRegion = /<!-- variables:start -->[\s\S]*?<!-- variables:end -->/;
  if (!tableRegion.test(guide)) throw new Error('Customization guide is missing variable-table markers');
  await writeFile(filename,guide.replace(tableRegion, `<!-- variables:start -->\n${await variableTable()}\n<!-- variables:end -->`));
  console.log(`Built dist/noirglass.min.css (${Buffer.byteLength(css)} bytes) and dist/noirglass.companion.js, with Inter font and OFL license.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) await build();
