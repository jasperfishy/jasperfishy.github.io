// The Great Dino Rescue: a seven-chapter story quest. Mummy and Daddy are trapped at the Sky Nest by
// Grumblecloud the storm, and the player rides a dinosaur through forest, bridge, cave, lava and sky to save them.
// Progress is saved after every chapter, so the quest can be played across many days and replayed.
import { createEngine, writeSave, wait, MOUNTS, kidName } from './rescue/engine.js?v=du-b206df16c491b071';
import { chapter1, chapter2, chapter3 } from './rescue/chapters-a.js?v=du-b206df16c491b071';
import { chapter4, chapter5, chapter6, chapter7 } from './rescue/chapters-b.js?v=du-b206df16c491b071';
const FX = window.DUFX;
// five bands of the post-storm rainbow arc, shared by the finished map and the bonus round
const RAINBOW_ARC = ['M120 470A280 280 0 0 1 680 470', 'M148 470A252 252 0 0 1 652 470', 'M176 470A224 224 0 0 1 624 470', 'M204 470A196 196 0 0 1 596 470', 'M232 470A168 168 0 0 1 568 470'].map((d, i) => '<path d="' + d + '" fill="none" stroke="' + ['#ff6b6b', '#f6b273', '#f3d56b', '#6bcb77', '#4d96ff'][i] + '" stroke-width="26" stroke-linecap="round" opacity=".8"/>').join('');
const CHAPTERS = [
  { name: 'The Call', icon: '🏡', fn: chapter1, x: 9, y: 76, blurb: 'A storm! Pip brings terrible news.' },
  { name: 'Whispering Forest', icon: '🌲', fn: chapter2, x: 24, y: 48, blurb: 'Ride through the glowing trees.' },
  // The tile used to type a suspension bridge from a font. The bridge in chapter three is
  // rope, and rope is photographed.
  { name: 'Rickety Bridge', icon: '🪢', fn: chapter3, x: 37, y: 74, blurb: 'Stomp in time to cross the canyon.' },
  { name: 'Crystal Cave', icon: '💎', fn: chapter4, x: 50, y: 42, blurb: 'Light the dark and sing the door open.' },
  { name: 'River of Fire', icon: '🌋', fn: chapter5, x: 62, y: 72, blurb: 'Hop the stones. Sing the volcano to sleep.' },
  { name: 'Sky Ride', icon: '☁️', fn: chapter6, x: 76, y: 40, blurb: 'Soar through the clouds on Pip’s wings.' },
  // ☁ and ⛈ are one cloud photograph, so two levels of this quest would have
  // looked identical to a child who cannot read the names yet. The peak is the
  // storm's own lightning, which is a different specimen.
  { name: 'Grumblecloud’s Peak', icon: '⚡', fn: chapter7, x: 90, y: 16, blurb: 'The final rescue!' },
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
      (finished ? '<svg class="rs-mapsvg" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true" style="pointer-events:none">' + RAINBOW_ARC + '</svg><i class="rs-cloud" style="top:40%;--w:64px;animation-delay:-11s"></i><span style="position:absolute;left:30%;top:60%;font-size:26px;pointer-events:none">🦋</span><span style="position:absolute;left:66%;top:52%;font-size:24px;pointer-events:none">🌼</span>' : '') +
      '<div class="rs-maptitle"><h2>The Great Dino Rescue</h2><p>' + (finished ? 'You saved the day! Play any chapter again — or chase the rainbow!' : done === 0 ? 'Rescue Mummy and Daddy from the storm!' : 'Chapter ' + (done + 1) + ' is next. Off we go!') + '</p></div>',
      { ambient: 'meadow', music: 'home' });
    E.hush();
    const nodes = CHAPTERS.map((c, i) => {
      const st = i < done ? 'done' : i === done ? 'now' : 'locked';
      const b = E.add('<span>' + (st === 'locked' ? window.DUICONS.i('lock', { size: 18 }) : c.icon) + '</span><small>' + (i + 1) + '. ' + c.name + '</small>', 'rs-node ' + st, 'left:' + c.x + '%;top:' + c.y + '%');
      b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.setAttribute('aria-label', c.name + ' ' + st);
      return b;
    });
    // pop each node in with a stagger; uses the individual `scale` property so the CSS centring transform stays put
    if (FX.motionOK && FX.motionOK()) nodes.forEach((n, i) => E.later(() => { if (E.alive) n.animate([{ scale: '.4', opacity: 0 }, { scale: '1.12', opacity: 1, offset: .7 }, { scale: '1' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.3)' }); }, 80 * i));
    let bonusNode = null;
    if (finished) {
      bonusNode = E.add('<span>🌈</span><small>Bonus · Rainbow</small>', 'rs-node now', 'left:44%;top:90%');
      bonusNode.setAttribute('role', 'button'); bonusNode.setAttribute('tabindex', '0'); bonusNode.setAttribute('aria-label', 'Rainbow bonus round');
    }
    // the rider sits on the next chapter
    const at = Math.min(done, CHAPTERS.length - 1), rider = E.mount(CHAPTERS[at].x - 6, CHAPTERS[at].y - 24, 11, 'happy'); rider.style.zIndex = 4; rider.style.pointerEvents = 'none';
    // Two of these named things this universe cannot photograph. The rider is awarded the
    // dinosaur the child actually chose — the same running render chapter one's card handed
    // over, in its own colour — and the hero's crown is the app's drawn trophy, so the shelf
    // never shows a horse, a suspension bridge or someone else's font.
    const badgeIcon = (b) => {
      const m = mountInfo();
      if (b === 'rider') return FX.dinoHTML(m.id, { state: 'run', color: m.color, size: '1.3em' });
      if (b === 'hero') return window.DUICONS.i('trophy', { size: 18 });
      return { forest: '🌲', bridge: '🪢', cave: '💎', lava: '🌋', sky: '☁️', rainbow: '🌈' }[b] || '⭐';
    };
    const shelf = E.add(E.save.badges.length ? '<b>Badges</b> ' + E.save.badges.map(badgeIcon).join(' ') : '<b>Your badges will appear here</b>', 'rs-shelf');
    const stars = window.DUJourney ? DUJourney.stars('act.rescue') : 0;
    const info = E.add(mountInfo().name + ' · chapter ' + Math.min(done, CHAPTERS.length) + ' of ' + CHAPTERS.length + ' · 💎 ' + E.save.gems + (stars ? ' · ' + window.DUICONS.stars(stars) : '') + (E.save.party.length ? ' · Friends: ' + E.save.party.map((p) => ({ pip: 'Pip', bumper: 'Bumper' })[p] || p).join(', ') : ''), 'rs-info');
    const reset = E.add('Start again', 'rs-reset'); reset.setAttribute('role', 'button');
    const idx = await new Promise((resolve) => {
      nodes.forEach((n, i) => { const go = () => { if (i <= done || i < CHAPTERS.length && i <= E.save.next) { E.sfx.roar(); resolve(i); } else { E.sfx.boing(); n.animate([{ translate: '0' }, { translate: '-6px' }, { translate: '6px' }, { translate: '0' }], { duration: 300 }); } }; n.addEventListener('click', go); n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); }); });
      reset.addEventListener('click', () => { if (confirm('Start the whole rescue from the beginning?')) { E.save.next = 0; E.save.badges = []; E.save.party = []; E.save.gems = 0; writeSave(E.save); resolve(-1); } });
      if (bonusNode) { const go = () => { E.sfx.roar(); resolve(-2); }; bonusNode.addEventListener('click', go); bonusNode.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); }); if (FX.motionOK && FX.motionOK()) E.later(() => { if (E.alive) bonusNode.animate([{ scale: '.4', opacity: 0 }, { scale: '1.12', opacity: 1, offset: .7 }, { scale: '1' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.3)' }); }, 80 * nodes.length); }
      E.world._go = resolve;
    });
    if (!E.alive) return;
    if (idx === -2) { await bonus(); map(); return; }
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

  // post-quest bonus round: catch ten rainbow raindrops for the Rainbow Rider badge (never touches the advance contract)
  async function bonus() {
    E.setChapter(0, 'Bonus Round · Rainbow');
    await E.titleCard(0, 'Grumblecloud’s Rainbow', 'Even storm clouds can smile.');
    E.scene('<div class="rs-sky" style="background:linear-gradient(#bfe8ff,#eafaf0 55%,#c2e8a8)"></div><i class="rs-cloud" style="top:6%;--w:120px"></i><i class="rs-cloud" style="top:14%;--w:74px;animation-delay:-18s"></i>' +
      '<svg class="rs-mapsvg" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true"><path d="M120 470A280 280 0 0 1 680 470" fill="none" stroke="#ff6b6b" stroke-width="26" stroke-linecap="round" opacity=".55"/><path d="M176 470A224 224 0 0 1 624 470" fill="none" stroke="#f3d56b" stroke-width="26" stroke-linecap="round" opacity=".55"/><path d="M232 470A168 168 0 0 1 568 470" fill="none" stroke="#4d96ff" stroke-width="26" stroke-linecap="round" opacity=".55"/></svg>' +
      '<svg class="rs-mapsvg" viewBox="0 0 800 500" preserveAspectRatio="none" aria-hidden="true"><path d="M0 500V430Q220 380 440 420T800 400V500Z" fill="#7dc47a"/><path d="M0 500V462Q260 430 520 462T800 452V500Z" fill="#5eab63"/></svg>' +
      '<span style="position:absolute;left:12%;top:82%;font-size:30px">🌲</span><span style="position:absolute;left:84%;top:80%;font-size:30px">🌳</span><span style="position:absolute;left:58%;top:86%;font-size:26px">🌷</span>',
      { ambient: 'rain', music: 'joy' });
    await E.say('Grumblecloud is raining rainbows! Tap all ten shiny drops before they fade.', 'narrator', 3600);
    // Four kinds of shine, four photographs: ✨ and ⭐ are one star, so a drop
    // could never read as both, and quartz is the thing that actually glitters.
    const kinds = ['🌈', '💧', '💎', '⭐'];
    const spots = [];
    for (let i = 0; i < 10; i++) spots.push([8 + Math.random() * 84, 16 + Math.random() * 58, kinds[i % 4]]);
    await E.tapAll(spots, 'crystal');
    if (!E.alive) return;
    E.hush();
    const r = E.world.getBoundingClientRect();
    E.addGems(3, { x: r.left + r.width / 2, y: r.top + r.height * 0.42 });
    const nm = kidName(E);
    await E.finishBadge('rainbow', '🌈', 'Rainbow Rider', 'You caught every rainbow drop' + (nm ? ', ' + nm : '') + ' — even Grumblecloud smiled!' + (E.save.badges.includes('rainbow') ? ' (Your badge shines on the map.)' : ''));
    E.music('home');
  }
  map();
}
