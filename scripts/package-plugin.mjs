import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import path from 'node:path';
import { root } from './build.mjs';
import { changelogFor } from './release-notes.mjs';

const packageInfo = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(packageInfo.version)) throw new Error('package.json must use a numeric release version');
const tag = `v${packageInfo.version}`;
const changelog = await changelogFor(tag);
const version = `${packageInfo.version}.0`;
const zipName = 'NoirGlass.Plugin_12.1.0.zip';
const project = path.join(root, 'plugin/NoirGlass.Plugin/NoirGlass.Plugin.csproj');
if (!(await readFile(project, 'utf8')).includes(`<Version>${version}</Version>`)) throw new Error('Plugin version must match package.json');
const dotnet = process.env.NOIRGLASS_DOTNET || (process.platform === 'win32' ? 'C:\\Program Files\\dotnet\\dotnet.exe' : 'dotnet');
const result = spawnSync(dotnet, ['build', project, '-c', 'Release', '--source', 'https://api.nuget.org/v3/index.json'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1' }
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const files = [
  ['NoirGlass.Plugin.dll', await readFile(path.join(root, 'plugin/NoirGlass.Plugin/bin/Release/net10.0/NoirGlass.Plugin.dll'))],
  ['LICENSE', await readFile(path.join(root, 'LICENSE'))]
];

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  return value >>> 0;
});
const crc32 = bytes => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
};
function makeZip(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, content] of entries) {
    const nameBytes = Buffer.from(name, 'utf8');
    const compressed = deflateRawSync(content, { level: 9 });
    const crc = crc32(content);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(content.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    local.push(header, nameBytes, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(content.length, 24);
    record.writeUInt16LE(nameBytes.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, nameBytes);
    offset += header.length + nameBytes.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

const archive = makeZip(files);
await writeFile(path.join(root, 'dist', zipName), archive);
const checksum = createHash('md5').update(archive).digest('hex');
const gitDate = spawnSync('git', ['show', '-s', '--format=%cI', 'HEAD'], { cwd: root, encoding: 'utf8' });
const timestamp = gitDate.status === 0 && gitDate.stdout.trim()
  ? new Date(gitDate.stdout.trim()).toISOString()
  : '2026-09-30T00:00:00.000Z';
const manifest = [
  {
    guid: '72f7ec75-08a4-4f5b-90fa-df751666c621',
    name: 'NoirGlass',
    description: 'Adds NoirGlass’s featured Home carousel and source-format badges to Jellyfin Web Legacy layouts.',
    overview: 'Cinematic Home carousel, detail badges, and configured Dashboard styling for NoirGlass.',
    owner: 'iammarxg',
    category: 'General',
    versions: [{
      version,
      changelog,
      targetAbi: '12.1.0.0',
      sourceUrl: `https://github.com/iammarxg/NoirGlass/releases/download/${tag}/${zipName}`,
      checksum,
      timestamp
    }]
  }
];
await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Packaged dist/${zipName} (${archive.length} bytes, MD5 ${checksum}).`);
