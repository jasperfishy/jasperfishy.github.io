// The distinct emoji the games draw, and where they get put on screen.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}][\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]*/gu;
const counts = new Map(), files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(js|html|css)$/.test(e.name)) continue;
    const t = fs.readFileSync(p, 'utf8');
    const m = t.match(EMO);
    if (!m) continue;
    files.push([p.replace(root + path.sep, ''), m.length]);
    for (const g of m) counts.set(g, (counts.get(g) || 0) + 1);
  }
})(root);
console.log('distinct emoji: ' + counts.size);
console.log([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) => g).join(' '));
console.log('\nhow they reach the screen:');
const draw = {};
for (const f of files.map(([p]) => path.join(root, p))) {
  const t = fs.readFileSync(f, 'utf8');
  if (/fillText/.test(t)) draw.fillText = (draw.fillText || 0) + 1;
  if (/innerHTML/.test(t)) draw.innerHTML = (draw.innerHTML || 0) + 1;
  if (/textContent/.test(t)) draw.textContent = (draw.textContent || 0) + 1;
  if (/background-image|backgroundImage/.test(t)) draw.css = (draw.css || 0) + 1;
  if (/ctx\.drawImage/.test(t)) draw.drawImage = (draw.drawImage || 0) + 1;
}
console.log('  files using each route: ' + JSON.stringify(draw));
console.log('  emoji-bearing files: ' + files.length);
