import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { releaseDecision, verifyReleaseAssets, preparePublication } from './prepare-release.mjs';
import { releaseSection, previousRelease, assertUnpublished, composeNotes, changelogFor, validateTag } from './release-notes.mjs';

const fixture = '# Changelog\n\n## [Unreleased]\n\n## [1.1.0] - 2026-10-01\n\n### Changed\n\n- Refined controls.\n\n## [1.0.0] - 2026-09-30\n\n- Initial theme.\n';
assert.equal(releaseSection(fixture, 'v1.0.0'), '- Initial theme.');
assert.equal(releaseSection(fixture, 'v1.1.0'), '### Changed\n\n- Refined controls.');
assert.throws(() => releaseSection(fixture, 'v1.2.0'), /Missing/);
assert.throws(() => releaseSection(fixture + '\n## [1.0.0] - 2026-09-30\n- Duplicate.\n', 'v1.0.0'), /Duplicate/);
assert.throws(() => releaseSection('## [1.0.0] - 2026-09-30\n\n### Added\n', 'v1.0.0'), /Empty/);
assert.throws(() => releaseSection('## [1.0.0]\n- Initial.\n', 'v1.0.0'), /date/);
assert.throws(() => releaseSection('## [1.0.0] - 2026-02-30\n- Initial.\n', 'v1.0.0'), /date/);
assert.throws(() => validateTag('v01.0.0'), /Release tag/);
assert.throws(() => validateTag('v1.0.0-beta.1'), /Release tag/);
const releases = [
  { tag_name: 'v1.9.0' }, { tag_name: 'v1.10.0' }, { tag_name: 'v1.10.1', draft: true },
  { tag_name: 'v1.10.2', prerelease: true }, { tag_name: 'v1.10.3' }, { tag_name: 'v2.0.0' },
  { tag_name: 'v1.11.0-beta' }, { tag_name: 'unrelated' }
];
assert.equal(previousRelease(releases, 'v1.11.0', candidate => candidate !== 'v1.10.3'), 'v1.10.0');
assert.equal(previousRelease([], 'v1.0.0', () => true), null);
assert.throws(() => assertUnpublished([{ tag_name: 'v1.0.0' }], 'v1.0.0'), /already exists/);
assert.throws(() => assertUnpublished([{ tag_name: 'v1.0.0', draft: true }], 'v1.0.0'), /already exists/);
assertUnpublished([], 'v1.0.0');
const repository = 'iammarxg/NoirGlass';
const first = composeNotes({ repository, tag: 'v1.0.0', previous: null, section: '- Initial theme.', generated: '## Contributors\n\n- @iammarxg\n\n**Full Changelog**: wrong-link' });
assert(first.includes('Initial theme.') && first.includes('Contributors') && first.includes('/commits/v1.0.0'));
assert(!first.includes('wrong-link') && !first.includes('/compare/'));
const next = composeNotes({ repository, tag: 'v1.1.0', previous: 'v1.0.0', section: '- Refined controls.', generated: '## What changed\n\n- A pull request.\n\n**Full Changelog**: wrong-link' });
assert(next.includes('/compare/v1.0.0...v1.1.0') && next.includes('A pull request.'));
assert.equal((next.match(/Full Changelog/g) || []).length, 1);
assert.throws(() => composeNotes({ repository, tag: 'v1.0.0', previous: 'v1.1.0', section: '- Initial.' }), /precede/);
assert((await changelogFor('v1.0.0')).includes('Single CSS import'));
const mismatch = spawnSync(process.execPath, ['scripts/check-release-version.mjs', 'v9.9.9'], { encoding: 'utf8' });
assert.notEqual(mismatch.status, 0, 'Mismatching release tag must fail');
assert(mismatch.stderr.includes('Release tag and package version differ'));
const commit = 'a'.repeat(40), otherCommit = 'b'.repeat(40);
const unpublished = { tag: 'v1.1.0', commit, releases: [], tagCommit: null, allowCreate: true };
assert.equal(releaseDecision(unpublished), 'create-tag', 'New main version creates an annotated tag');
assert.equal(releaseDecision({ ...unpublished, tagCommit: commit }), 'publish', 'Retry reuses the exact tag');
assert.equal(releaseDecision({ ...unpublished, releases: [{ tag_name: 'v1.1.0' }], tagCommit: otherCommit }), 'already-released', 'Documentation pushes preserve an existing release');
assert.equal(releaseDecision({ ...unpublished, releases: [{ tag_name: 'v1.1.0' }], allowCreate: false }), 'already-released', 'Repeated publication completes successfully');
assert.throws(() => releaseDecision({ ...unpublished, tagCommit: otherCommit }), /Conflicting tag/);
assert.throws(() => releaseDecision({ ...unpublished, allowCreate: false }), /must already exist/);
assert.equal(releaseDecision({ ...unpublished, allowCreate: false, tagCommit: commit }), 'publish', 'Tag/manual retry is supported');
for (const state of [{draft:true},{prerelease:true}]) assert.throws(() => releaseDecision({ ...unpublished, releases: [{ tag_name:'v1.1.0', ...state }] }), /refusing to overwrite/);
const zip = Buffer.from('fixture archive');
const manifest = [{ name:'NoirGlass', versions:[{version:'1.1.0.0',sourceUrl:'https://github.com/iammarxg/NoirGlass/releases/download/v1.1.0/NoirGlass.Plugin_12.1.0.zip',checksum:createHash('md5').update(zip).digest('hex'),changelog:releaseSection(fixture,'v1.1.0')}] }];
verifyReleaseAssets({ manifest,zip,tag:'v1.1.0',changelog:fixture });
assert.throws(() => verifyReleaseAssets({manifest,zip:Buffer.from('corrupt'),tag:'v1.1.0',changelog:fixture}), /checksum/);
assert.throws(() => verifyReleaseAssets({manifest,zip,tag:'v1.0.0',changelog:fixture}), /version/);
assert.throws(() => verifyReleaseAssets({manifest,zip,tag:'v1.1.0',changelog:''}), /Missing/);
const workflow = await readFile(new URL('../.github/workflows/release.yml',import.meta.url),'utf8');
assert.match(workflow,/publish:\s+needs: build-and-test/, 'Failed validation cannot publish');
assert.match(workflow,/if: github.ref == 'refs\/heads\/main' \|\| startsWith/);
assert.match(workflow,/ref: \$\{\{ needs.build-and-test.outputs.commit \}\}/, 'Publish checkout uses immutable validated SHA');
assert.match(workflow,/group: noirglass-publication/);
assert.match(workflow,/ref: \$\{\{ github.workflow_sha \}\}/, 'Retries obtain automation from the exact workflow revision');
assert.match(workflow,/run: node \.release-tools\/scripts\/prepare-release.mjs/, 'Old release tags do not need to contain the new helper');
assert.match(workflow,/ALLOW_CREATE_TAG: \$\{\{ github.event_name == 'push' && github.ref == 'refs\/heads\/main' \}\}/);
assert.equal((workflow.match(/if: steps.prepare.outputs.publish == 'true'/g)||[]).length,4, 'Existing releases skip all publishing mutations');
function publicationFixture(releases = [], tagCommit = null, failure = null) {
  const calls = [];
  const run = (name,args) => {
    calls.push([name,...args]);
    if (failure === 'version' && name === process.execPath) throw Error('Version mismatch');
    if (failure === 'api' && name === 'gh') throw Error('GitHub API unavailable');
    if (name === 'gh') return JSON.stringify([releases]);
    if (args[0] === 'rev-parse') return args.includes('--verify') ? tagCommit : commit;
    if (args.includes('tag') && args.includes('-a')) tagCommit = commit;
    return '';
  };
  return {run,calls};
}
const fresh = publicationFixture();
assert.equal(preparePublication({...unpublished,repository,run:fresh.run}),'create-tag');
assert(fresh.calls.some(args=>args.includes('tag')&&args.includes('-a')&&args.includes(commit)),'Annotated tag uses tested SHA');
assert.equal(fresh.calls.filter(args=>args.includes('push')).length,1,'Only the release tag is pushed');
assert(fresh.calls.some(args=>args.includes('merge-base')),'Publication checks main ancestry');
const docsOnly = publicationFixture([{tag_name:'v1.1.0'}],otherCommit);
assert.equal(preparePublication({...unpublished,repository,run:docsOnly.run}),'already-released');
assert(!docsOnly.calls.some(args=>args.includes('push')||args.includes('tag')),'Published versions never mutate tags');
for(const failure of ['version','api']){
  const failed=publicationFixture([],null,failure);
  assert.throws(()=>preparePublication({...unpublished,repository,run:failed.run}));
  assert(!failed.calls.some(args=>args.includes('push')||args.includes('tag')),'Failed validation/API cannot tag');
}
console.log('Release checks passed: dated version sections, duplicate/missing/empty entries, version mismatch, stable ancestor selection, initial history, comparison links and duplicate-release rejection.');
console.log('Automatic publication checks passed: new versions, unchanged documentation versions, retries, tag conflicts, drafts, immutable checkout, validation gate and artifact checksums.');
