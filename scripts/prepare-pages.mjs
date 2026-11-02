import { cp, copyFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const source = name => fileURLToPath(new URL(`dist/${name}`, root));
const target = name => fileURLToPath(new URL(name, root));

// GitHub Pages serves main:/, while Vite builds from index.source.html.
// Keep older hashed bundles available for visitors with cached HTML.
await cp(source('assets'), target('assets'), { recursive: true });
await cp(source('fonts'), target('fonts'), { recursive: true });
await copyFile(source('favicon.svg'), target('favicon.svg'));
await copyFile(source('index.source.html'), target('index.html'));
// Publish every discovered local app, not only the first one added.
const apps = JSON.parse(await readFile(new URL('../src/data/apps.json', import.meta.url), 'utf8'));
for (const app of apps) if (app.folder) await cp(source(app.folder), target(app.folder), { recursive: true });

// Guardian information pages do not have an app-discovery manifest.
await cp(source('guardian'), target('guardian'), { recursive: true });
