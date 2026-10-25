import { cp, copyFile } from 'node:fs/promises';
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
