import assert from 'node:assert/strict';
import { appendFile, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateTag, releaseSection } from './release-notes.mjs';

export function releaseDecision({ tag, commit, releases, tagCommit, allowCreate }) {
  validateTag(tag);
  assert.match(commit, /^[a-f0-9]{40}$/i, 'A tested commit SHA is required');
  const existing = releases.find(release => release.tag_name === tag);
  if (existing) {
    if (existing.draft || existing.prerelease) throw new Error(`Release ${tag} is a draft or prerelease; refusing to overwrite`);
    return 'already-released';
  }
  if (tagCommit && tagCommit !== commit) throw new Error(`Conflicting tag ${tag}: it does not point to the tested commit`);
  if (!tagCommit && !allowCreate) throw new Error(`Release tag ${tag} must already exist for a tag or manual run`);
  return tagCommit ? 'publish' : 'create-tag';
}

export function verifyReleaseAssets({ manifest, zip, tag, changelog }) {
  const version = validateTag(tag);
  const entry = manifest[0]?.versions?.[0];
  assert.equal(manifest[0]?.name, 'NoirGlass');
  assert.equal(entry?.version, `${version}.0`, 'Artifact version differs');
  assert.equal(entry?.sourceUrl, `https://github.com/iammarxg/NoirGlass/releases/download/${tag}/NoirGlass.Plugin_12.1.0.zip`);
  assert.equal(entry?.checksum, createHash('md5').update(zip).digest('hex'), 'Artifact ZIP checksum differs');
  assert.equal(entry?.changelog, releaseSection(changelog, tag), 'Artifact changelog differs');
}

function command(name, args, optional = false) {
  const result = spawnSync(name, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (optional && result.status === 1) return null;
    throw new Error(`${name} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

export function preparePublication({ tag, commit, repository, allowCreate, run = command }) {
  assert.match(repository || '', /^[\w.-]+\/[\w.-]+$/);
  validateTag(tag);
  assert.equal(run('git', ['rev-parse', 'HEAD']), commit, 'Checkout must match the tested commit');
  run(process.execPath, ['scripts/check-release-version.mjs', tag]);
  // Refresh tags while holding the repository-wide publish lock.
  run('git', ['fetch', 'origin', '--tags']);
  run('git', ['merge-base', '--is-ancestor', commit, 'origin/main']);
  const releases = JSON.parse(run('gh', ['api', '--paginate', '--slurp', `repos/${repository}/releases?per_page=100`])).flat();
  const tagCommit = run('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`], true);
  const decision = releaseDecision({ tag, commit, releases, tagCommit, allowCreate });
  if (decision === 'create-tag') {
    run('git', ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'tag', '-a', tag, commit, '-m', `NoirGlass ${tag}`]);
    run('git', ['push', 'origin', `refs/tags/${tag}`]);
    assert.equal(run('git', ['rev-parse', `refs/tags/${tag}^{commit}`]), commit);
  }
  return decision;
}

async function prepare() {
  const tag = process.env.RELEASE_TAG;
  const decision = preparePublication({ tag, commit:process.env.TESTED_COMMIT, repository:process.env.GH_REPO, allowCreate:process.env.ALLOW_CREATE_TAG === 'true' });
  if (decision === 'already-released') {
    console.log('Version already released.');
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `Version already released: ${tag}. Existing tag, notes and assets were left unchanged.\n`);
  }
  const output = `publish=${decision !== 'already-released'}\ntag=${tag}\n`;
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, output);
  else console.log(output.trim());
}

async function verify(directory) {
  verifyReleaseAssets({
    manifest: JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8')),
    zip: await readFile(path.join(directory, 'dist/NoirGlass.Plugin_12.1.0.zip')),
    tag: process.env.RELEASE_TAG,
    changelog: await readFile('CHANGELOG.md', 'utf8')
  });
  console.log('Release artifact version, changelog and ZIP checksum verified.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  if (process.argv[2] === '--verify-assets') await verify(process.argv[3] || 'release-files');
  else await prepare();
}
