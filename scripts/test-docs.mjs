import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { chromium } from 'playwright';
import { root, variableTable } from './build.mjs';
import { tokenDocs, quickTokens } from './token-docs.mjs';

const guide = await readFile(path.join(root,'docs/CUSTOMIZATION.md'),'utf8');
const css = await readFile(path.join(root,'dist/noirglass.min.css'),'utf8');
const examples = [...guide.matchAll(/```css\n([\s\S]*?)```/g)].map(match=>match[1]);
assert.equal(examples.length,3,'Customization guide must contain exactly three scenario blocks');
assert.equal(new Set(tokenDocs.map(entry=>entry.name)).size,217,'Metadata must cover every distinct variable');
assert.equal(quickTokens.length,12);
await assert.rejects(variableTable(tokenDocs.slice(1)),/Missing token documentation/);
await assert.rejects(variableTable([...tokenDocs,tokenDocs[0]]),/Duplicate token documentation/);
await assert.rejects(variableTable([...tokenDocs,{...tokenDocs[0],name:'--ng-obsolete'}]),/Obsolete token documentation/);
await assert.rejects(variableTable(tokenDocs.map((entry,index)=>index===0?{...entry,description:'First sentence. Second sentence.'}:entry)),/Description must be one sentence/);
const defaults = new Map();
postcss.parse(await readFile(path.join(root,'src/variables.css'),'utf8')).walkDecls(/^--ng-/,decl=>{
  if(decl.parent.parent.type==='root') defaults.set(decl.prop,decl.value);
});
for(const entry of tokenDocs) assert(defaults.has(entry.name),`Unknown documented variable ${entry.name}`);
for(const name of defaults.keys()) assert(tokenDocs.some(entry=>entry.name===name),`Missing metadata ${name}`);
const declarations = examples.map(code=>{
  const entries=[];
  postcss.parse(code).walkDecls(decl=>{
    const documentation=tokenDocs.find(entry=>entry.name===decl.prop);
    assert(documentation,`Scenario uses an unknown variable ${decl.prop}`);
    assert(documentation.property,`Scenario must not alter internal ${decl.prop}`);
    entries.push({name:decl.prop,value:decl.value,property:documentation.property});
  });
  return entries;
});
const browser = await chromium.launch({headless:true});
await mkdir(path.join(root,'test-results'),{recursive:true});
try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.setContent('<div class="skinHeader"><div class="headerTop"></div></div><div id="indexPage"><div id="homeTab" class="is-active"><div class="ng-feature"><div class="ng-feature__title">Featured title</div></div></div></div><div id="moviesPage" class="libraryPage"><button class="btnFilter">Filter</button><div class="scrollSlider"></div><div class="itemsContainer vertical-wrap"><div class="card portraitCard"><div class="cardBox"><div class="cardImageContainer"></div><div class="cardOverlayButton-br"></div></div></div></div></div><div id="searchPage"><div class="searchFieldsInner"><input type="search" class="searchInput emby-input" value="Search text"></div></div>');
  await page.addStyleTag({content:css});
  const unsupported = await page.evaluate(entries=>entries.flatMap(entry=>entry.property ? entry.examples.filter(value=>!CSS.supports(entry.property,value)).map(value=>`${entry.name}: ${value}`) : []),tokenDocs);
  assert.deepEqual(unsupported,[],'Every documented example must be valid CSS for its value type');
  const invalidDefaults = await page.evaluate(entries=>entries.filter(entry=>entry.property && !CSS.supports(entry.property,entry.value)).map(entry=>entry.name),tokenDocs.map(entry=>({...entry,value:defaults.get(entry.name)})));
  assert.deepEqual(invalidDefaults,[],'Documented value types must accept the actual defaults');
  for(const [index,code] of examples.entries()) {
    const invalid=await page.evaluate(entries=>entries.filter(entry=>!CSS.supports(entry.property,entry.value)).map(entry=>entry.name),declarations[index]);
    assert.deepEqual(invalid,[]);
    const style=await page.addStyleTag({content:code});
    for(const width of [1440,390]) {
      await page.setViewportSize({width,height:width===390?844:900});
      const values=await page.evaluate(names=>Object.fromEntries(names.map(name=>[name,getComputedStyle(document.documentElement).getPropertyValue(name).trim()])),declarations[index].map(entry=>entry.name));
      if(index!==2 || width===390) {
        for(const entry of declarations[index]) assert.equal(values[entry.name],entry.value,`Scenario ${index+1} at ${width}px: ${entry.name}`);
      } else assert.equal(values['--ng-search-input-font-size'],'24px','Mobile scenario must leave desktop defaults intact');
      if(index===0) {
        assert.equal(await page.locator('.scrollSlider').evaluate(element=>getComputedStyle(element).gap),'32px');
        assert.equal(await page.locator('.itemsContainer').evaluate(element=>getComputedStyle(element).gap),'40px');
        assert.equal(await page.locator('.cardImageContainer').evaluate(element=>getComputedStyle(element).borderRadius),'18px');
      }
      if(index===1) {
        const paints=await page.evaluate(()=>{
          const reference=document.createElement('div');
          reference.style.background='rgb(52 52 59 / '+(184/255*.7)+')';
          document.body.append(reference);
          const expected=getComputedStyle(reference).backgroundColor;
          reference.remove();
          return {expected,actual:getComputedStyle(document.querySelector('.btnFilter')).backgroundColor};
        });
        assert.equal(paints.actual,paints.expected);
        assert((await page.locator('.cardOverlayButton-br').evaluate(element=>getComputedStyle(element).backdropFilter)).includes('blur(24px)'));
      }
      if(index===2 && width===390) {
        assert(Math.abs((await page.locator('.ng-feature').boundingBox()).height-844*.66)<.1,'Mobile hero must use the scenario height');
        assert.equal(await page.locator('.ng-feature__title').evaluate(element=>getComputedStyle(element).fontSize),'32px');
        assert.equal(await page.locator('.searchInput').evaluate(element=>getComputedStyle(element).fontSize),'20px');
      }
    }
    await style.evaluate(element=>element.remove());
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ng-feature-slide-duration').trim()),'0ms','Scenarios must preserve reduced-motion behavior');
  console.log(`Documentation browser checks passed: ${tokenDocs.length} value types, examples/defaults, three desktop/mobile scenarios and reduced motion.`);
} finally { await browser.close(); }
