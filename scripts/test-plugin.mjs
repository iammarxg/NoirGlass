import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root } from './build.mjs';

const dotnet = process.env.NOIRGLASS_DOTNET || (process.platform === 'win32' ? 'C:\\Program Files\\dotnet\\dotnet.exe' : 'dotnet');
const project = path.join(root, 'plugin/NoirGlass.Plugin.Tests/NoirGlass.Plugin.Tests.csproj');
const result = spawnSync(dotnet, ['run', '--project', project, '-c', 'Release', '-p:RestoreSources=https://api.nuget.org/v3/index.json'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1' }
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
