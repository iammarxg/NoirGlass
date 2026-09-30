import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const tagPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateTag(tag) {
  if (!tagPattern.test(tag || '')) throw new Error('Release tag must be vMAJOR.MINOR.PATCH');
  return tag.slice(1);
}

export function releaseSection(markdown, tag) {
  const version = validateTag(tag);
  const headings = [...markdown.matchAll(/^## \[(Unreleased|\d+\.\d+\.\d+)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/gm)];
  const seen = new Set();
  let section;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const name = heading[1];
    if (seen.has(name)) throw new Error(`Duplicate changelog section: ${name}`);
    seen.add(name);
    if (name === 'Unreleased') continue;
    validateTag(`v${name}`);
    const date = heading[2];
    if (!date || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
      throw new Error(`Changelog section needs a valid release date: ${name}`);
    }
    const content = markdown.slice(heading.index + heading[0].length, headings[i + 1]?.index ?? markdown.length).trim();
    if (!/^(?:[-*]\s+\S|[^\s#])/m.test(content)) throw new Error(`Empty changelog section: ${name}`);
    if (name === version) section = content;
  }
  if (!section) throw new Error(`Missing changelog section: ${version}`);
  return section;
}

function compareTags(a, b) {
  const left = validateTag(a).split('.').map(BigInt), right = validateTag(b).split('.').map(BigInt);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  return 0;
}

export function previousRelease(releases, tag, isAncestor) {
  validateTag(tag);
  return [...new Set(releases.filter(release => !release.draft && !release.prerelease && tagPattern.test(release.tag_name))
    .map(release => release.tag_name))].filter(candidate => compareTags(candidate, tag) < 0 && isAncestor(candidate, tag))
    .sort((a, b) => compareTags(b, a))[0] ?? null;
}

export function assertUnpublished(releases, tag) {
  validateTag(tag);
  if (releases.some(release => release.tag_name === tag)) throw new Error(`Release already exists for ${tag}`);
}

export function composeNotes({ repository, tag, previous, section, generated = '' }) {
  validateTag(tag);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Repository must be owner/name');
  if (previous && compareTags(previous, tag) >= 0) throw new Error('Comparison tag must precede the release');
  // GitHub may include its own comparison footer; write one explicit, verified link below.
  const automatic = generated.replace(/^.*(?:\*\*Full Changelog\*\*|Full Changelog:).*$/gm, '').trim();
  const base = `https://github.com/${repository}`;
  const history = previous
    ? `**Full Changelog:** [${previous}...${tag}](${base}/compare/${previous}...${tag})`
    : `**Initial release — commit history:** [${tag}](${base}/commits/${tag})`;
  return [section.trim(), automatic, history].filter(Boolean).join('\n\n') + '\n';
}

export async function changelogFor(tag) {
  return releaseSection(await readFile(path.join(root, 'CHANGELOG.md'), 'utf8'), tag);
}

function command(name, args) {
  const result = spawnSync(name, args, { cwd: root, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${name} failed: ${result.stderr.trim()}`);
  return result.stdout;
}

async function generate(tag, filename) {
  const section = await changelogFor(tag);
  const repository = process.env.GH_REPO || process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '')) throw new Error('GH_REPO or GITHUB_REPOSITORY must be owner/name');
  const pages = JSON.parse(command('gh', ['api', '--paginate', '--slurp', `repos/${repository}/releases?per_page=100`]));
  const releases = pages.flat();
  assertUnpublished(releases, tag);
  const previous = previousRelease(releases, tag, (candidate, current) => {
    const result = spawnSync('git', ['merge-base', '--is-ancestor', candidate, current], { cwd: root, encoding: 'utf8' });
    if (result.error) throw result.error;
    if (result.status !== 0 && result.status !== 1) throw new Error(`Cannot resolve release tag ${candidate}: ${result.stderr.trim()}`);
    return result.status === 0;
  });
  const args = ['api', '--method', 'POST', `repos/${repository}/releases/generate-notes`, '-f', `tag_name=${tag}`];
  if (previous) args.push('-f', `previous_tag_name=${previous}`);
  const generated = JSON.parse(command('gh', args)).body;
  await writeFile(path.resolve(root, filename), composeNotes({ repository, tag, previous, section, generated }));
  console.log(`Prepared notes for ${tag}${previous ? ` since ${previous}` : ' (initial release)'}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const [tag, filename] = process.argv.slice(2);
  if (!filename) throw new Error('Usage: node scripts/release-notes.mjs vMAJOR.MINOR.PATCH output.md');
  await generate(tag, filename);
}
