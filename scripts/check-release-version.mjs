import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './build.mjs';
import { changelogFor, validateTag } from './release-notes.mjs';

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const tag = process.argv[2] || `v${pkg.version}`;
validateTag(tag);
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const project = await readFile(path.join(root, 'plugin/NoirGlass.Plugin/NoirGlass.Plugin.csproj'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(tag, `v${pkg.version}`, 'Release tag and package version differ');
assert.equal(lock.version, pkg.version, 'Lockfile version differs');
assert.equal(lock.packages[''].version, pkg.version, 'Root lockfile version differs');
assert(project.includes(`<Version>${pkg.version}.0</Version>`), 'Plugin version differs');
assert.equal(manifest[0].name, 'NoirGlass');
assert.equal(manifest[0].versions[0].version, `${pkg.version}.0`);
assert.equal(manifest[0].versions[0].changelog, await changelogFor(tag), 'Catalog changelog differs from the release section');
assert.equal(manifest[0].versions[0].sourceUrl,
  `https://github.com/iammarxg/NoirGlass/releases/download/${tag}/NoirGlass.Plugin_12.1.0.zip`);
console.log(`Release version ${tag} matches npm, plugin, lockfile, catalog and changelog.`);
