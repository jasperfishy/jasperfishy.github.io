/* A dangling `if (cond)` with nothing on its own line means the next statement
 * silently became its body. Flag every place that happens. */
const fs = require('fs'), path = require('path');
const ROOT = 'D:/FlagshipUI/app/dino-universe';
const skip = new Set(['node_modules', '.git', 'assets', 'archive']);
let hits = 0;
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) { walk(p); continue; }
    if (!/\.js$/.test(name)) continue;
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const m = lines[i].match(/^(\s*)if \(.*\)\s*$/);
      if (!m) continue;
      const nxt = lines[i + 1];
      if (!nxt.trim() || nxt.trim().startsWith('{') || nxt.trim().startsWith('//')) continue;
      const indA = m[1].length, indB = (nxt.match(/^\s*/) || [''])[0].length;
      if (indB <= indA) {
        console.log(p.slice(ROOT.length + 1) + ':' + (i + 1) + '  ' + lines[i].trim() + '   ==>   ' + nxt.trim());
        hits++;
      }
    }
  }
})(ROOT);
console.log(hits + ' candidates');
