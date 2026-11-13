// What a child actually sees, as pixels.
//
//   node tools/shots.cjs                     every surface, landing + after taps
//   node tools/shots.cjs --only park         surfaces whose name or path matches
//   node tools/shots.cjs --out C:/tmp/du     where to write the PNGs
//
// COVERAGE.md can say a photograph reached the screen and still be wrong about
// whether the screen looks good: a helper can paint a backdrop and hide the
// nest, the flowers and the butterflies underneath it. Only a picture shows
// that, so this boots the games headless, taps into play and saves frames.
const fs = require('fs');
const path = require('path');
const http = require('http');
const root = path.resolve(__dirname, '..');
const PORT = 4199;
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(process.env.LOCALAPPDATA || 'C:/Users/Me/AppData/Local', 'Temp/du/shots');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.jpg': 'image/jpeg', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.resolve(root, '.' + p);
  if (!f.startsWith(root + path.sep)) { res.writeHead(404); return res.end('no'); }
  fs.readFile(f, (e, b) => {
    if (e) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(b);
  });
});
server.listen(PORT, '127.0.0.1');

function loadPlaywright() {
  const avail = fs.readdirSync('C:/Users/Administrator/AppData/Local/ms-playwright');
  const base = 'C:/Users/Administrator/AppData/Local/npm-cache/_npx';
  for (const d of fs.readdirSync(base)) {
    const dir = path.join(base, d, 'node_modules');
    const bj = path.join(dir, 'playwright-core', 'browsers.json');
    if (!fs.existsSync(bj)) continue;
    const j = JSON.parse(fs.readFileSync(bj, 'utf8'));
    const cr = j.browsers.find((b) => b.name === 'chromium');
    if (!cr || !avail.includes('chromium-' + cr.revision)) continue;
    const cd = path.join('C:/Users/Administrator/AppData/Local/ms-playwright', 'chromium-' + cr.revision);
    const ex = [path.join(cd, 'chrome-win64', 'chrome.exe'), path.join(cd, 'chrome-win', 'chrome.exe')].find(fs.existsSync);
    if (!ex) continue;
    const full = path.join(dir, 'playwright');
    return { chromium: require(fs.existsSync(full) ? full : path.join(dir, 'playwright-core')).chromium, executablePath: ex };
  }
  throw new Error('no cached playwright matching downloaded chromium');
}

const surfaces = [
  ['Hub', '/', null],
  ['Meadow', '/chapters/meadow/', ['.destination[data-action="games"]', '.tile[data-type]']],
  ['Park', '/chapters/park/', ['#gameGrid button', '.launch, .primary, #startBtn']],
  ['Adventures', '/chapters/adventures/', ['#skipIntro', '#skipName', '#exploreButton']],
  ['Arcade', '/chapters/arcade/', ['[data-game]', '#startBtn']],
  ['Classic Drive', '/chapters/drive/', ['#play', '.launch', '.primary']],
  ['Sky Mail', '/chapters/sky-mail/', ['#play', '.launch', '.primary']],
  ['Egg Dash', '/chapters/egg-dash/', ['#play', '.launch', '.primary']],
  ['Meadow Phaser', '/chapters/meadow-phaser/', []],
  ['Park Phaser', '/chapters/dino-park-phaser/', []],
  ['Adventures Phaser', '/chapters/adventures-phaser/', []],
  ['Car Studio Phaser', '/chapters/car-studio-phaser/', []]
];

(async () => {
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].toLowerCase() : null;
  // An expression run in the page after the taps, printed next to the frame,
  // for the questions a picture can raise but not answer.
  const probe = process.argv.includes('--eval') ? process.argv[process.argv.indexOf('--eval') + 1] : null;
  const list = surfaces.filter((s) => !only || (s[0] + ' ' + s[1]).toLowerCase().includes(only));
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium, executablePath } = loadPlaywright();
  const browser = await chromium.launch({ executablePath, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader'] });
  for (const [name, url, enter] of list) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 160)));
    try {
      await page.goto('http://127.0.0.1:' + PORT + url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(2800);
      await page.screenshot({ path: path.join(OUT, slug + '-1-landing.png') });
      for (const sel of (enter && enter.length ? enter : [null])) {
        await page.evaluate((s) => {
          if (!s) {
            const want = /play|start|begin|enter|drive|race|go|open|continue/i;
            const el = [...document.querySelectorAll('button,[role=button],a,.pill,.card')]
              .find((b) => b.offsetParent && want.test((b.textContent || '') + (b.id || '')));
            if (el) el.click();
            else { const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0]; if (c) c.click(); }
          } else {
            for (const alt of s.split(', ')) { const el = document.querySelector(alt); if (el) { el.click(); return; } }
          }
        }, sel).catch(() => {});
        await page.waitForTimeout(1500);
      }
      /* The Phaser title cards listen for a real pointerdown inside the canvas
       * or a space bar, not for a DOM .click(), so a screenshot taken after only
       * clicking buttons shows the instruction card and never the world. */
      await page.mouse.click(500, 430);
      await page.waitForTimeout(900);
      /* A runner game is often dead within a few seconds of an unattended
       * start, and a frame of the game-over card proves nothing about the road.
       * Take one while the world is still moving. */
      await page.screenshot({ path: path.join(OUT, slug + '-2-early.png') });
      await page.keyboard.press('Space');
      await page.waitForTimeout(900);
      await page.mouse.click(500, 430);
      await page.waitForTimeout(1200);
      await page.waitForTimeout(2600);
      await page.screenshot({ path: path.join(OUT, slug + '-2-play.png') });
      if (probe) {
        const seen = await page.evaluate(probe).catch((e) => ({ probeError: String(e.message).slice(0, 200) }));
        console.log(name.padEnd(18) + 'probe ' + JSON.stringify(seen));
      }
    } catch (e) {
      console.log(name.padEnd(18) + ' FAILED ' + String(e.message).slice(0, 120));
      continue;
    }
    console.log(name.padEnd(18) + (errors.length ? 'errors: ' + errors.join(' | ') : 'clean'));
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log('\nwrote ' + list.length * 2 + ' frames to ' + OUT);
})();
