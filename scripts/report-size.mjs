import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const files = await readdir('dist/assets');
const assets = await Promise.all(files.filter(file => file.endsWith('.js')).map(async file => { const bytes = await readFile(`dist/assets/${file}`); return { file, bytes:bytes.length, gzipBytes:gzipSync(bytes).length }; }));
console.log(JSON.stringify({ lightweightChartsVersion: pkg.dependencies['lightweight-charts'], assets }, null, 2));
