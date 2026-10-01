// Companion to npm run browser. Payload is base64-encoded JSON to avoid shell quoting.
const command = ['preview','companion','dashboard-preview','disable-companion','close','state'].includes(process.argv[2]) ? {action:process.argv[2]} : JSON.parse(Buffer.from(process.argv[2], 'base64').toString('utf8'));
const response = await fetch(`http://127.0.0.1:${process.env.NOIRGLASS_BROWSER_PORT || 4319}`, { method: 'POST', body: JSON.stringify(command) });
const result = await response.text();
console.log(result);
if (!response.ok) process.exitCode = 1;
