// What is actually photoreal, measured rather than remembered.
//
//   node tools/coverage.cjs            print the table, rewrite COVERAGE.md
//   node tools/coverage.cjs --no-run   skip the browser pass (static columns only)
//
// Three things can be true apart, and conflating them is how this migration
// got reported as finished before: a file can exist on disk, a game can import
// the helper that would use it, and the picture can really reach the screen.
// Only the third is evidence.
const fs = require('fs');
const path = require('path');
const http = require('http');
const root = path.resolve(__dirname, '..');
const PORT = 4198;
const OUT = path.join(root, 'assets/environments/COVERAGE.md');
// One list, used by every hook in this file. The tracker once left `objects`
// out — the 96-photograph specimen library that fx/du-objects.js paints with —
// and every page that showed a real photo of a fern or a fossil egg scored
// zero, so the table said "unfinished" about work that was finished. A list
// typed out four times is a list that drifts, so it is typed once here and
// passed into the browser code that has to agree with it.
const LIBS = ['environments', 'props', 'vehicles', 'prehistoric', 'objects', 'cinema'];
const ART = new RegExp('assets\\/(' + LIBS.join('|') + ')\\/[\\w-]+\\.\\w+');
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

const HELPERS = ['photoreal-environments.js', 'photoreal-textures.js', 'photoreal-vehicles.js', 'du-intro.js'];

// every file a surface loads, so an import can be attributed to the game that
// uses it rather than to the shared module sitting at the root
function sourceFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'assets' || e.name === 'node_modules') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|html|cjs|mjs)$/.test(e.name)) out.push(p);
    }
  };
  walk(dir);
  return out;
}

function staticReport(dir) {
  const hits = new Set();
  const art = new Set();
  for (const f of sourceFiles(dir)) {
    const t = fs.readFileSync(f, 'utf8');
    for (const h of HELPERS) if (t.includes(h)) hits.add(h);
    for (const m of t.match(new RegExp('assets\\/(' + LIBS.join('|') + ')\\/[\\w-]+', 'g')) || []) art.add(m.split('/').pop());
  }
  return { helpers: [...hits], namedArt: [...art] };
}

function artOnDisk() {
  const groups = {};
  for (const g of LIBS) {
    const d = path.join(root, 'assets', g);
    groups[g] = fs.existsSync(d) ? fs.readdirSync(d).filter((f) => /\.(webp|png|jpe?g)$/.test(f)) : [];
  }
  return groups;
}

const surfaces = [
  ['Hub', '/', null, ['#world-park', '#meadowCard, .card']],
  ['Meadow', '/chapters/meadow/', 'chapters/meadow', ['.destination[data-action="games"]', '.tile[data-type]', '.tile[data-game]']],
  ['Park', '/chapters/park/', 'chapters/park', ['#gameGrid button', '.launch, .primary, #startBtn']],
  ['Adventures', '/chapters/adventures/', 'chapters/adventures', ['#skipIntro', '#skipName', '#exploreButton', '.primary-button']],
  ['Arcade', '/chapters/arcade/', 'chapters/arcade', ['[data-game]', '#startBtn']],
  ['Classic Drive', '/chapters/drive/', 'chapters/drive', ['#play', '.launch', '.primary']],
  ['Sky Mail', '/chapters/sky-mail/', 'chapters/sky-mail', ['#play', '.launch', '.primary']],
  ['Egg Dash', '/chapters/egg-dash/', 'chapters/egg-dash', ['#play', '.launch', '.primary']],
  ['Meadow (Phaser)', '/chapters/meadow-phaser/', 'chapters/meadow-phaser', []],
  ['Park (Phaser)', '/chapters/dino-park-phaser/', 'chapters/dino-park-phaser', []],
  ['Adventures (Phaser)', '/chapters/adventures-phaser/', 'chapters/adventures-phaser', []],
  ['Car Studio (Phaser)', '/chapters/car-studio-phaser/', 'chapters/car-studio-phaser', []],
  ['Dino Car Studio', '/games/dino-car-studio/', 'games/dino-car-studio', ['#play', '.launch', '.primary']],
  ['Dino Park', '/games/dino-park/', 'games/dino-park', ['#play', '.launch', '.primary']]
];

const ACTIVITY_ENTER = ['#skipIntro', '#skipName', '#playActivity, #storyBtn', '.primary-button', '.launch'];

const activityIds = () => {
  const t = fs.readFileSync(path.join(root, 'chapters.js'), 'utf8');
  return (t.match(/id: '([a-z]+)', title/g) || []).map((s) => s.match(/'(.*?)'/)[1]);
};

(async () => {
  const run = !process.argv.includes('--no-run');
  const groups = artOnDisk();
  const browser = run ? await (async () => { const { chromium, executablePath } = loadPlaywright(); return chromium.launch({ executablePath, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] }); })() : null;

  const probe = async (url, enter) => {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 720 } });
    const page = await ctx.newPage();
    const asked = new Set();
    page.on('response', (r) => { const m = r.url().match(ART); if (m && r.status() === 200) asked.add(m[0].replace('assets/', '').split('?')[0]); });
    // The library list has to be the same on both sides of the boundary, so it
    // is passed in rather than typed again here. Typed twice is how `objects`
    // ended up counted in the report and missed in the probe.
    await page.addInitScript((libs) => {
      window.__BLIT = [];
      const RX = () => new RegExp('assets\\/(' + libs + ')\\/[\\w-]+\\.\\w+');
      const note = (u) => { const m = String(u || '').match(RX()); if (m) window.__BLIT.push(m[0].replace('assets/', '')); };
      const d2 = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) { note(img && (img.currentSrc || img.src)); return d2.apply(this, [img, ...a]); };
      // Phaser uploads through WebGL, where drawImage is never called
      for (const proto of [typeof WebGLRenderingContext !== 'undefined' && WebGLRenderingContext.prototype,
                           typeof WebGL2RenderingContext !== 'undefined' && WebGL2RenderingContext.prototype]) {
        if (!proto) continue;
        const t2d = proto.texImage2D;
        proto.texImage2D = function (...a) {
          const img = a.find((x) => x && x.src);
          if (img) note(img.currentSrc || img.src);
          return t2d.apply(this, a);
        };
      }
      // Meadow and the hub paint through SVG and <img>, which never reach a
      // canvas at all, and Adventures through a CSS background — a page can be
      // fully photographic and score zero on the two hooks above.
      window.__SEEN = () => {
        const out = new Set(window.__BLIT);
        const note2 = (src, el) => {
          const m = String(src).match(RX());
          if (!m) return;
          const b = el.getBoundingClientRect();
          if (b.width > 2 && b.height > 2) out.add(m[0].replace('assets/', '').split('?')[0]);
        };
        for (const el of document.querySelectorAll('img, svg image')) {
          note2(String(el.currentSrc || el.src || el.getAttribute('href') || el.getAttribute('xlink:href') || ''), el);
        }
        for (const el of document.querySelectorAll('*')) {
          const bg = getComputedStyle(el).backgroundImage;
          if (!bg || bg === 'none' || bg.indexOf('url(') < 0) continue;
          for (const m of bg.matchAll(/url\("?([^")]+)"?\)/g)) note2(m[1], el);
        }
        return [...out];
      };
    }, LIBS.join('|'));
    let failed = null;
    try { await page.goto('http://127.0.0.1:' + PORT + url, { waitUntil: 'load', timeout: 20000 }); await page.waitForTimeout(2600); } catch (e) { failed = e.message; }
    const blitted = failed ? [] : await page.evaluate(() => window.__SEEN()).catch(() => []);
    // A landing screen is a shop window: most of these games only paint a world
    // after a tap, so measure again with the door kicked open.
    let entered = blitted;
    let askedAfter = asked.size;
    if (!failed) {
      const steps = enter && enter.length ? enter : [null];
      for (const sel of steps) {
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
        await page.waitForTimeout(1400);
      }
      await page.waitForTimeout(1800);
      entered = await page.evaluate(() => window.__SEEN()).catch(() => entered);
      askedAfter = asked.size;
    }
    await ctx.close();
    return { asked: [...asked], askedAfter, blitted, entered, failed };
  };

  const rows = [];
  for (const [name, url, dir, enter] of surfaces) {
    const s = dir ? staticReport(path.join(root, dir)) : { helpers: [], namedArt: [] };
    const r = run ? await probe(url, enter) : { asked: [], askedAfter: 0, blitted: [], entered: [], failed: 'skipped' };
    rows.push({ name, url, s, r });
    console.log((r.entered.length ? 'painted ' : r.blitted.length ? 'landing ' : r.asked.length ? 'asked    ' : 'nothing  ') + name.padEnd(22) + 'art=' + r.askedAfter + ' landing=' + r.blitted.length + ' after entry=' + r.entered.length + (r.failed ? ' ERR ' + r.failed.slice(0, 60) : ''));
  }

  const acts = [];
  if (run) {
    for (const id of activityIds()) {
      const r = await probe('/chapters/adventures/index.html?activity=' + id, ACTIVITY_ENTER);
      acts.push({ id, r });
      console.log((r.entered.length ? 'painted ' : r.blitted.length ? 'landing ' : r.asked.length ? 'asked    ' : 'nothing  ') + ('activity:' + id).padEnd(22) + 'art=' + r.askedAfter + ' landing=' + r.blitted.length + ' after entry=' + r.entered.length);
    }
  }

  const NOUN = { environments: 'Backdrops', props: 'Props', vehicles: 'Vehicles',
                 prehistoric: 'Dinos', objects: 'Objects', cinema: 'Film' };
  const byBucket = (files) => LIBS.map((b) => files.filter((f) => f.startsWith(b + '/')).length);
  const head = (what) => '| ' + what + ' | Photoreal painted | ' +
    LIBS.map((b) => NOUN[b]).join(' | ') + ' | Requested |';
  const rule = () => '| --- '.repeat(LIBS.length + 3) + '|';
  const cell = (row) => (row.r.entered.length ? 'yes' : row.r.blitted.length ? 'on its landing screen only' : row.r.asked.length ? 'requested, never painted' : row.s.helpers.length ? 'helper only' : 'no');
  const lines = [];
  lines.push('# Photoreal migration — measured coverage');
  lines.push('');
  lines.push('Generated by `node tools/coverage.cjs`. Do not hand-edit: prose about what');
  lines.push('is "pending" is how this migration was twice reported ahead of itself.');
  lines.push('');
  lines.push('**painted** means a real photoreal file reached the screen in a headless run');
  lines.push('of that page, caught either in a 2D `drawImage` or a WebGL texture upload.');
  lines.push('Each page is measured twice: once as it opens, and once after the run has');
  lines.push('clicked its way into play, because most of these worlds only draw on the');
  lines.push('far side of a tap. `helper only` means the code is wired but no photograph');
  lines.push('ever arrived, which is the state that looks finished in a diff and is not');
  lines.push('finished in a browser.');
  lines.push('');
  lines.push('## Art on disk');
  lines.push('');
  lines.push('| Library | Files |');
  lines.push('| --- | --- |');
  for (const [g, f] of Object.entries(groups)) lines.push('| ' + g + ' | ' + f.length + ' |');
  lines.push('');
  lines.push('## Surfaces');
  lines.push('');
  lines.push('Every count below is a file that actually reached the screen after the run');
  lines.push('tapped into play, sorted by the library it came from. A page can be all');
  lines.push('backdrop and no dinosaur, which is the difference between a wallpaper and');
  lines.push('a world. "requested" is how many art files the page asked the server for,');
  lines.push('which is larger than the painted count whenever something 404s or decodes');
  lines.push('but never gets drawn.');
  lines.push('');
  lines.push(head('Page'));
  lines.push(rule());
  for (const row of rows) {
    const b = byBucket(row.r.entered);
    lines.push('| ' + row.name + ' | ' + cell(row) + ' | ' + b.join(' | ') + ' | ' + row.r.askedAfter + ' |');
  }
  lines.push('');
  if (acts.length) {
    lines.push('## Adventures, per activity');
    lines.push('');
    lines.push(head('Activity'));
    lines.push(rule());
    for (const a of acts) {
      const b = byBucket(a.r.entered);
      lines.push('| ' + a.id + ' | ' + (a.r.entered.length ? 'yes' : a.r.blitted.length ? 'on its landing screen only' : a.r.asked.length ? 'requested, never painted' : 'no') + ' | ' + b.join(' | ') + ' | ' + a.r.askedAfter + ' |');
    }
    lines.push('');
  }
  const painted = rows.filter((r) => r.r.entered.length || r.r.blitted.length).length;
  const total = rows.length + (acts.length || 29);
  const done = painted + acts.filter((a) => a.r.entered.length || a.r.blitted.length).length;
  lines.push('Running total: **' + done + ' of ' + total + ' surfaces paint photoreal art**.');
  lines.push('');
  const all = rows.concat(acts.map((a) => ({ name: a.id, r: a.r })));
  const missing = (lib) => { const l = all.filter((x) => x.r.entered.length && !x.r.entered.some((f) => f.startsWith(lib + '/'))).map((x) => x.name); return l.length ? l.join(', ') : 'none'; };
  const silent = all.filter((x) => !x.r.entered.length).map((x) => x.name);
  lines.push('## What the numbers say is left');
  lines.push('');
  lines.push('- Paints a backdrop but no creature: ' + missing('prehistoric') + '.');
  lines.push('- Paints a backdrop but no prop: ' + missing('props') + '.');
  lines.push('- Paints a backdrop but no specimen object: ' + missing('objects') + '.');
  lines.push('- Paints no photograph at all: ' + (silent.length ? silent.join(', ') : 'none') + '.');
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log('\nwrote ' + OUT);
  if (browser) await browser.close();
  server.close();
})().catch((e) => { console.log('CRASH ' + e); server.close(); process.exit(1); });
