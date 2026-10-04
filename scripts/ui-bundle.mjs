import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
const root = process.argv[2] ?? 'out/_next/static';
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(join(dir, e.name)) : join(dir, e.name)))).flat();
}
const totals = { js: { files: 0, raw: 0, gzip: 0 }, css: { files: 0, raw: 0, gzip: 0 } };
for (const file of await files(root)) {
  const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : null;
  if (!kind) continue;
  const data = await readFile(file);
  totals[kind].files++;
  totals[kind].raw += data.length;
  totals[kind].gzip += gzipSync(data).length;
}
console.log(JSON.stringify(totals, null, 2));
