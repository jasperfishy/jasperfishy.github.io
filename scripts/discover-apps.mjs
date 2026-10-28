import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'public');
const apps = JSON.parse(await readFile(path.join(root, 'apps.external.json'), 'utf8'));
for (const app of apps) {
  if (!app.name || !app.id || !app.description || !/^https:\/\//.test(app.url)) {
    throw new Error('External apps need an id, name, description and HTTPS URL.');
  }
}
async function scan(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const manifest = entries.find(e => e.isFile() && e.name === 'manifest.webmanifest')
    || entries.find(e => e.isFile() && e.name === 'manifest.json');
  if (manifest && directory !== publicRoot) {
    await access(path.join(directory, 'index.html'));
    const data = JSON.parse(await readFile(path.join(directory, manifest.name), 'utf8'));
    if (!data.name) throw new Error(`Missing app name in ${directory}`);
    const folder = path.relative(publicRoot, directory).split(path.sep).join('/');
    const url = '/' + folder + '/';
    const icon = data.icons?.find(i => i.type === 'image/png') || data.icons?.[0];
    const iconUrl = icon?.src ? new URL(icon.src, 'https://jasperfish.com' + url) : null;
    apps.push({ id: folder, name: data.name, description: data.description || 'Open this app to explore.', url,
      icon: iconUrl?.origin === 'https://jasperfish.com' ? iconUrl.pathname : undefined,
      category: 'Made to explore', folder });
    return;
  }
  for (const entry of entries) if (entry.isDirectory() && !entry.name.startsWith('.')) await scan(path.join(directory, entry.name));
}
await scan(publicRoot);
if (new Set(apps.map(a => a.id)).size !== apps.length || new Set(apps.map(a => a.url)).size !== apps.length) throw new Error('Duplicate app id or URL.');
await mkdir(path.join(root, 'src/data'), { recursive: true });
await writeFile(path.join(root, 'src/data/apps.json'), JSON.stringify(apps, null, 2) + '\n');
console.log(`App directory: ${apps.map(a => a.name).join(', ')}`);
