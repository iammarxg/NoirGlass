import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
console.log('Release checks passed: dated version sections, duplicate/missing/empty entries, version mismatch, stable ancestor selection, initial history, comparison links and duplicate-release rejection.');
