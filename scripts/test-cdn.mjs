import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { checkCdn, cssAlias } from './check-cdn.mjs';
const bytes = Buffer.from('published css'), hash = createHash('sha256').update(bytes).digest('hex');
const response = (text=bytes,version='1.2.1') => new Response(text,{headers:{'x-jsd-version':version}});
let calls=0,waits=[];
const options={expectedHash:hash,expectedVersion:'v1.2.1',wait:async ms=>waits.push(ms)};
assert((await checkCdn({...options,fetchImpl:async(url,config)=>{assert.equal(url,cssAlias);assert(config.signal);calls++;return response();}})).fresh);
assert.equal(calls,1);assert.equal(waits.length,0);
calls=0;
const eventual=await checkCdn({...options,fetchImpl:async()=>++calls<3?response('old','1.2.0'):response()});
assert(eventual.fresh);assert.equal(calls,3);assert.deepEqual(waits,[30000,30000]);
for(const scenario of ['stale','wrong-version','timeout','unavailable']){
  calls=0;waits=[];
  const result=await checkCdn({...options,fetchImpl:async()=>{calls++;if(scenario==='timeout')throw new DOMException('Timed out','TimeoutError');if(scenario==='unavailable')return new Response('',{status:503});return scenario==='wrong-version'?response(bytes,'1.2.0'):response('old','1.2.0');}});
  assert(!result.fresh);assert.equal(calls,5);assert.equal(result.observations.length,5);assert.deepEqual(waits,[30000,30000,30000,30000]);
}
const workflow=await readFile(new URL('../.github/workflows/release.yml',import.meta.url),'utf8');
assert(workflow.includes('node .release-tools/scripts/check-cdn.mjs'));
console.log('PASS CDN freshness: current, delayed, stale, version mismatch, timeout, unavailable, five attempts and 30-second intervals');
