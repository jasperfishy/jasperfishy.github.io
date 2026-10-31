// The Great Dino Rescue: a seven-chapter story quest. Mummy and Daddy are trapped at the Sky Nest by
// Grumblecloud the storm, and Grayson rides a dinosaur through forest, bridge, cave, lava and sky to save them.
// Progress is saved after every chapter, so the quest can be played across many days and replayed.
import { createEngine, writeSave, wait, MOUNTS } from './rescue/engine.js';
import { chapter1, chapter2, chapter3 } from './rescue/chapters-a.js';
import { chapter4, chapter5, chapter6, chapter7 } from './rescue/chapters-b.js';
const FX = window.DUFX;
const CHAPTERS = [
  { name: 'The Call', icon: '🏡', fn: chapter1, x: 9, y: 76, blurb: 'A storm! Pip brings terrible news.' },
  { name: 'Whispering Forest', icon: '🌲', fn: chapter2, x: 24, y: 48, blurb: 'Ride through the glowing trees.' },
  { name: 'Rickety Bridge', icon: '🌉', fn: chapter3, x: 37, y: 74, blurb: 'Stomp in time to cross the canyon.' },
  { name: 'Crystal Cave', icon: '💎', fn: chapter4, x: 50, y: 42, blurb: 'Light the dark and sing the door open.' },
  { name: 'River of Fire', icon: '🌋', fn: chapter5, x: 62, y: 72, blurb: 'Hop the stones. Sing the volcano to sleep.' },
  { name: 'Sky Ride', icon: '☁️', fn: chapter6, x: 76, y: 40, blurb: 'Soar through the clouds on Pip’s wings.' },
  { name: 'Grumblecloud’s Peak', icon: '⛈️', fn: chapter7, x: 90, y: 16, blurb: 'The final rescue!' },
];

export function mountDinoRescue(context) {
  const E = createEngine(context);
  E.build();
  const mountInfo = () => MOUNTS.find((m) => m.id === E.save.mount) || MOUNTS[0];

  async function map() {
    if (!E.alive) return;
    const done = E.save.next, finished = done >= CHAPTERS.length;
    E.setChapter(0, 'The Great Dino Rescue');
    const path = CHAPTERS.map((c) => c.x * 8 + ',' + c.y * 5).join(' ');
    E.scene('<div class="rs-sky" style="background:linear-gradient(#8fd0f5,#dff3d0 60%,#9ed77f)"></div><i class="rs-cloud" style="top:8%;--w:110px"></i><i class="rs-cloud" style="top:20%;--w:70px;animation-delay:-18s"></i>' +
      '<svg class="rs-mapsvg" viewBox="0 0 800 500" preserveAspectRatio="none"><path d="M0 500V400Q120 330 240 390T480 380T800 300V500Z" fill="#7dc47a"/><path d="M0 500V450Q200 400 400 450T800 420V500Z" fill="#5eab63"/><path d="M560 260L650 120 720 200 770 60 800 100V300Z" fill="#a98a6e"/><path d="M770 60L755 95 770 88 785 98Z" fill="#fff"/><polyline points="' + path + '" fill="none" stroke="#fff6d0" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 22" opacity=".95"/></svg>' +
      '<div class="rs-maptitle"><h2>The Great Dino Rescue</h2><p>' + (finished ? 'You saved the day! Play any chapter again.' : done === 0 ? 'Rescue Mummy and Daddy from the storm!' : 'Chapter ' + (done + 1) + ' is next. Off we go!') + '</p></div>',
      { ambient: 'meadow', music: 'home' });
    E.hush();
    const nodes = CHAPTERS.map((c, i) => {
      const st = i < done ? 'done' : i === done ? 'now' : 'locked';
      const b = E.add('<span>' + (st === 'locked' ? '🔒' : c.icon) + '</span><small>' + (i + 1) + '. ' + c.name + '</small>', 'rs-node ' + st, 'left:' + c.x + '%;top:' + c.y + '%');
      b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('aria-label', c.name + ' ' + st);
      return b;
    });
    // the rider sits on the next chapter
    const at = Math.min(done, CHAPTERS.length - 1), rider = E.mount(CHAPTERS[at].x - 6, CHAPTERS[at].y - 24, 11, 'happy'); rider.style.zIndex = 4; rider.style.pointerEvents = 'none';
    const shelf = E.add(E.save.badges.length ? '<b>Badges</b> ' + E.save.badges.map((b) => ({ rider: '🏇', forest: '🌲', bridge: '🌉', cave: '💎', lava: '🌋', sky: '☁️', hero: '👑' })[b] || '⭐').join(' ') : '<b>Your badges will appear here</b>', 'rs-shelf');
    const info = E.add(mountInfo().name + ' · 💎 ' + E.save.gems + (E.save.party.length ? ' · Friends: ' + E.save.party.map((p) => ({ pip: 'Pip', bumper: 'Bumper' })[p] || p).join(', ') : ''), 'rs-info');
    const reset = E.add('Start again', 'rs-reset'); reset.setAttribute('role', 'button');
    const idx = await new Promise((resolve) => {
      nodes.forEach((n, i) => { const go = () => { if (i <= done || i < CHAPTERS.length && i <= E.save.next) { E.sfx.roar(); resolve(i); } else { E.sfx.boing(); n.animate([{ translate: '0' }, { translate: '-6px' }, { translate: '6px' }, { translate: '0' }], { duration: 300 }); } }; n.addEventListener('click', go); n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); }); });
      reset.addEventListener('click', () => { if (confirm('Start the whole rescue from the beginning?')) { E.save.next = 0; E.save.badges = []; E.save.party = []; E.save.gems = 0; writeSave(E.save); resolve(-1); } });
      E.world._go = resolve;
    });
    if (!E.alive) return;
    if (idx >= 0) await play(idx);
    map();
  }

  async function play(i) {
    const before = E.save.next;
    try { await CHAPTERS[i].fn(E); } catch (err) { if (E.alive) console.error(err); }
    E.stopMusic(); E.hush();
    if (E.alive && i === CHAPTERS.length - 1 && E.save.next >= CHAPTERS.length && !E.save.advanced) {
      E.save.advanced = true; writeSave(E.save);
      context.advance('you rescued Mummy and Daddy from Grumblecloud and became a Hero Dino Rider!');
      await new Promise(() => {}); // the celebration screen takes over; leaving the activity ends this
    }
  }
  map();
}
