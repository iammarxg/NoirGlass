import { createHash } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const cssAlias = 'https://cdn.jsdelivr.net/gh/iammarxg/NoirGlass@latest/dist/noirglass.min.css';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export async function checkCdn({ expectedHash, expectedVersion, fetchImpl = fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 5, interval = 30000, timeout = 10000 }) {
  const observations = [];
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(cssAlias, { signal: AbortSignal.timeout(timeout), cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const hash = sha256(Buffer.from(await response.arrayBuffer()));
      const version = response.headers.get('x-jsd-version')?.replace(/^v/, '') || 'unknown';
      observations.push({ attempt, version, hash });
      if (hash === expectedHash && version === expectedVersion.replace(/^v/, '')) return { fresh: true, observations };
    } catch (error) { observations.push({ attempt, error: error.message }); }
    if (attempt < attempts) await wait(interval);
  }
  return { fresh: false, observations };
}

async function main() {
  let result, expectedVersion;
  try {
    const repository = process.env.GH_REPO || 'iammarxg/NoirGlass';
    if (repository !== 'iammarxg/NoirGlass') throw new Error('CDN verification is scoped to iammarxg/NoirGlass');
    const lookup = spawnSync('gh', ['api', `repos/${repository}/releases/latest`], { encoding: 'utf8', timeout: 10000 });
    if (lookup.error || lookup.status !== 0) throw new Error('Cannot read the latest published release');
    const release = JSON.parse(lookup.stdout);
    expectedVersion = release.tag_name;
    const asset = release.assets.find(item => item.name === 'noirglass.min.css');
    if (!asset) throw new Error('Latest release has no CSS asset');
    let expectedHash = asset.digest?.match(/^sha256:([a-f0-9]{64})$/i)?.[1];
    if (!expectedHash) {
      const response = await fetch(asset.browser_download_url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Cannot download the published CSS asset');
      expectedHash = sha256(Buffer.from(await response.arrayBuffer()));
    }
    result = await checkCdn({ expectedHash, expectedVersion });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { result = { fresh: false, observations: [{ error: error.message }] }; }
  const message = result.fresh
    ? `CDN @latest matches ${expectedVersion}: resolved version and SHA-256 verified.`
    : 'CDN @latest is stale or unavailable. The GitHub release remains published. Purge the CSS alias at https://www.jsdelivr.com/tools/purge, then reload Jellyfin Web.';
  console.log(result.fresh ? message : `::warning::${message}`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n### CSS CDN freshness\n\n${message}\n\nCSS URL: ${cssAlias}\n`);
  // CDN propagation must not roll back or fail an already-published release.
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) await main();
