// Thermal Soar — the canyon at afternoon.
// Height is money, and the only bank in it is the warm air coming off the rock.

import { canvasTex, grain, rng, clamp, lerp, MOODS, W } from '../engine.js?v=du-1c099b1be40dab88';

const LEGS = 14;
const STAR = [5, 9, 14];
const RIM = 96;
const FLOOR = 498;
const ANCHOR = 300;
const LEFT = 70;
const RIGHT = 890;
const V_SPREAD = 175;
const V_TUCK = 355;
const V_STALL = 80;
const LAND_VS = 132;
const SHELF_UP = 54;
const SHELF_DOWN = 46;
const SHELF_REACH = 186;
const REST_TRAVEL = 72;
const PAL = MOODS.canyon;

const MESA_LINES = [
  'one mesa. the wind turns for the next leg',
  'feet on the shelf. resting is not the same as safe',
  'that ledge has taken better birds than you',
  'a mesa kept, and the day is shorter than it was',
  'stand still. the wings are not done yet'
];
const CRASH_LINES = {
  low: 'you came in under the shelf and the wall was still there',
  hot: 'too hot for that ledge. it is not a runway',
  high: 'over the shelf, and nowhere left to put it down',
  floor: 'the scree came up faster than you thought'
};

function art(scene, M) {
  const begin = (c) => { c.save(); c.translate(0, M.top); c.scale(1, M.band); };
  const end = (c) => { c.restore(); };

  const WING = {
    glide: { tip: [16, 40], lead: [62, 58], trail: [40, 100], root: [92, 112], far: [34, 66] },
    flap: { tip: [8, 8], lead: [56, 34], trail: [36, 78], root: [90, 104], far: [30, 40] },
    tuck: { tip: [74, 132], lead: [96, 106], trail: [112, 132], root: [106, 112], far: [88, 124] },
    perch: { tip: [86, 140], lead: [100, 112], trail: [120, 138], root: [112, 116], far: [96, 130] }
  };

  Object.keys(WING).forEach((frame) => {
    canvasTex(scene, 'ts-soar-' + frame, 250, 180, (c) => {
      const w = WING[frame];
      const folded = frame === 'tuck' || frame === 'perch';
      const membrane = (alpha) => {
        const g = c.createLinearGradient(120, 60, 40, 130);
        g.addColorStop(0, 'rgba(255,206,142,' + 0.92 * alpha + ')');
        g.addColorStop(0.45, 'rgba(214,126,70,' + 0.9 * alpha + ')');
        g.addColorStop(1, 'rgba(126,58,42,' + 0.88 * alpha + ')');
        return g;
      };

      // far wing, behind everything
      c.fillStyle = 'rgba(96,48,40,0.72)';
      c.beginPath();
      c.moveTo(126, 100);
      c.quadraticCurveTo(w.far[0] + 26, w.far[1] + 8, w.far[0], w.far[1]);
      c.quadraticCurveTo(w.far[0] + 30, w.far[1] + 42, 122, 114);
      c.closePath(); c.fill();

      // tail
      c.strokeStyle = '#8a4a34';
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(76, 114); c.quadraticCurveTo(44, 120, 22, 132); c.stroke();
      c.fillStyle = '#6d3a2c';
      c.beginPath();
      c.moveTo(22, 132); c.lineTo(6, 122); c.lineTo(10, 140); c.lineTo(4, 152); c.lineTo(26, 140);
      c.closePath(); c.fill();

      // body
      const body = c.createLinearGradient(84, 84, 170, 132);
      body.addColorStop(0, '#f0bd80');
      body.addColorStop(0.42, '#c07a45');
      body.addColorStop(1, '#6f3b2c');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(122, 108, 48, 25, -0.06, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,232,190,0.34)';
      c.beginPath(); c.ellipse(126, 122, 34, 10, -0.04, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(92,44,28,0.4)';
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(96 + i * 16, 92 + i);
        c.quadraticCurveTo(100 + i * 16, 108, 94 + i * 16, 122);
        c.stroke();
      }

      // legs
      c.strokeStyle = '#8c4c34';
      c.lineWidth = 5;
      if (frame === 'perch') {
        c.beginPath(); c.moveTo(112, 128); c.quadraticCurveTo(108, 148, 112, 164); c.stroke();
        c.beginPath(); c.moveTo(132, 128); c.quadraticCurveTo(134, 148, 138, 164); c.stroke();
        c.strokeStyle = '#e8d3a4'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(112, 164); c.lineTo(102, 170); c.moveTo(112, 164); c.lineTo(122, 170); c.stroke();
        c.beginPath(); c.moveTo(138, 164); c.lineTo(128, 170); c.moveTo(138, 164); c.lineTo(148, 170); c.stroke();
      } else {
        c.beginPath(); c.moveTo(114, 128); c.quadraticCurveTo(104, 142, 92, 146); c.stroke();
        c.beginPath(); c.moveTo(134, 128); c.quadraticCurveTo(130, 144, 122, 152); c.stroke();
      }

      // neck, head, crest, beak
      c.strokeStyle = '#d09358';
      c.lineWidth = 15;
      c.beginPath(); c.moveTo(160, 96); c.quadraticCurveTo(180, 84, 190, 76); c.stroke();
      c.fillStyle = '#e6a866';
      c.beginPath(); c.ellipse(198, 72, 19, 13, -0.24, 0, Math.PI * 2); c.fill();
      c.fillStyle = PAL.accent;
      c.beginPath();
      c.moveTo(196, 60);
      c.quadraticCurveTo(176, 34, 150, 32);
      c.quadraticCurveTo(168, 50, 182, 68);
      c.closePath(); c.fill();
      c.fillStyle = '#f3e3b4';
      c.beginPath();
      c.moveTo(212, 66);
      c.quadraticCurveTo(246, 72, 244, 80);
      c.quadraticCurveTo(230, 82, 210, 79);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(120,66,38,0.5)';
      c.beginPath();
      c.moveTo(212, 79); c.quadraticCurveTo(232, 81, 243, 80);
      c.quadraticCurveTo(230, 86, 212, 83);
      c.closePath(); c.fill();
      c.fillStyle = '#ffefc8';
      c.beginPath(); c.arc(202, 69, 4.8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#20130f';
      c.beginPath(); c.arc(203.6, 69, 2.4, 0, Math.PI * 2); c.fill();

      // near wing
      c.fillStyle = membrane(1);
      c.beginPath();
      c.moveTo(128, 96);
      c.quadraticCurveTo(w.lead[0], w.lead[1], w.tip[0], w.tip[1]);
      c.quadraticCurveTo(w.trail[0], w.trail[1], w.root[0], w.root[1]);
      c.quadraticCurveTo(118, 116, 128, 96);
      c.closePath(); c.fill();

      if (!folded) {
        // membrane fingers along the trailing edge
        c.strokeStyle = 'rgba(112,52,34,0.55)';
        c.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const t = i / 4;
          c.beginPath();
          c.moveTo(128 - t * 12, 98 + t * 12);
          c.quadraticCurveTo(lerp(96, w.tip[0], t), lerp(88, w.tip[1], t), lerp(60, w.tip[0], t), lerp(96, w.tip[1], t) + 6);
          c.stroke();
        }
        // leading edge light
        c.strokeStyle = 'rgba(255,226,170,0.7)';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(128, 96);
        c.quadraticCurveTo(w.lead[0], w.lead[1], w.tip[0], w.tip[1]);
        c.stroke();
      } else {
        c.strokeStyle = 'rgba(255,214,150,0.35)';
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(126, 100); c.quadraticCurveTo(w.lead[0], w.lead[1], w.tip[0], w.tip[1]);
        c.stroke();
      }

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(30, 20, 200, 150);
      rim.addColorStop(0, 'rgba(255,224,168,0.26)');
      rim.addColorStop(0.55, 'rgba(255,224,168,0)');
      c.fillStyle = rim; c.fillRect(0, 0, 250, 180);
      c.globalCompositeOperation = 'source-over';
      grain(c, 250, 180, 0.03, 61 + frame.length);
    });
  });

  canvasTex(scene, 'ts-vulture', 150, 112, (c) => {
    c.fillStyle = 'rgba(38,24,26,0.9)';
    c.beginPath(); c.ellipse(76, 68, 30, 15, -0.05, 0, Math.PI * 2); c.fill();
    c.beginPath();
    c.moveTo(70, 60); c.quadraticCurveTo(34, 22, 6, 30);
    c.quadraticCurveTo(34, 58, 66, 72); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(84, 60); c.quadraticCurveTo(118, 24, 146, 32);
    c.quadraticCurveTo(118, 58, 88, 72); c.closePath(); c.fill();
    c.fillStyle = 'rgba(16,10,12,0.5)';
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.moveTo(20 + i * 9, 34 + i * 4); c.lineTo(14 + i * 9, 44 + i * 5); c.lineTo(26 + i * 9, 44 + i * 4); c.closePath(); c.fill();
    }
    c.fillStyle = '#5d4438';
    c.beginPath(); c.moveTo(48, 74); c.lineTo(26, 92); c.lineTo(44, 94); c.closePath(); c.fill();
    c.fillStyle = '#c8804a';
    c.beginPath(); c.ellipse(104, 56, 11, 9, 0.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e8c39a';
    c.beginPath(); c.ellipse(98, 62, 10, 5, 0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f0dca8';
    c.beginPath(); c.arc(107, 54, 2.4, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,206,150,0.35)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(70, 58); c.quadraticCurveTo(38, 26, 10, 32); c.stroke();
    grain(c, 150, 112, 0.04, 733);
  });

  canvasTex(scene, 'ts-hawk', 160, 116, (c) => {
    c.fillStyle = 'rgba(28,30,42,0.92)';
    c.beginPath(); c.ellipse(84, 66, 30, 13, -0.06, 0, Math.PI * 2); c.fill();
    c.beginPath();
    c.moveTo(76, 58); c.quadraticCurveTo(40, 26, 4, 40);
    c.quadraticCurveTo(42, 62, 74, 72); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(92, 58); c.quadraticCurveTo(126, 24, 156, 34);
    c.quadraticCurveTo(124, 62, 94, 72); c.closePath(); c.fill();
    c.fillStyle = '#8d4636';
    c.beginPath(); c.ellipse(112, 60, 13, 10, 0.1, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a2233';
    c.beginPath(); c.moveTo(122, 56); c.lineTo(146, 52); c.lineTo(124, 64); c.closePath(); c.fill();
    c.fillStyle = 'rgba(240,220,170,0.9)';
    c.beginPath(); c.arc(120, 57, 2.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(200,180,150,0.3)';
    c.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.moveTo(20 + i * 9, 46 + i * 2); c.lineTo(30 + i * 8, 62 + i); c.stroke();
    }
    c.fillStyle = 'rgba(30,32,44,0.85)';
    c.beginPath(); c.moveTo(56, 68); c.lineTo(24, 84); c.lineTo(52, 86); c.closePath(); c.fill();
    grain(c, 160, 116, 0.04, 911);
  });

  canvasTex(scene, 'ts-ledge', 270, 150, (c) => {
    const rand = rng(1207);
    const top = 30;
    const slab = c.createLinearGradient(0, top, 0, 150);
    slab.addColorStop(0, '#c07f4c');
    slab.addColorStop(0.2, '#8d5339');
    slab.addColorStop(1, '#3a2120');
    c.fillStyle = slab;
    c.beginPath();
    c.moveTo(10, top + 4);
    c.quadraticCurveTo(90, top - 4, 176, top + 2);
    c.lineTo(268, top - 2);
    c.lineTo(270, 150);
    c.lineTo(120, 150);
    c.quadraticCurveTo(58, 118, 10, 74);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,214,150,0.5)';
    c.beginPath();
    c.moveTo(10, top + 4);
    c.quadraticCurveTo(90, top - 4, 176, top + 2);
    c.lineTo(268, top - 2);
    c.lineTo(268, top + 7);
    c.quadraticCurveTo(160, top + 10, 12, top + 12);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(24,14,14,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const y = top + 18 + i * 16;
      c.beginPath(); c.moveTo(20 + i * 14, y); c.quadraticCurveTo(140, y + 6, 266, y - 2); c.stroke();
    }
    c.fillStyle = 'rgba(90,54,36,0.7)';
    for (let i = 0; i < 12; i++) {
      c.beginPath(); c.ellipse(24 + rand() * 230, top + 2 + rand() * 4, 2 + rand() * 5, 1.4 + rand() * 2, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(74,58,34,0.8)';
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 28;
      c.beginPath();
      c.moveTo(x, top); c.quadraticCurveTo(x - 8, top - 12, x + 2, top - 16);
      c.quadraticCurveTo(x + 10, top - 8, x + 12, top); c.closePath(); c.fill();
    }
    c.globalCompositeOperation = 'source-atop';
    const shade = c.createLinearGradient(0, top, 0, 150);
    shade.addColorStop(0, 'rgba(255,206,150,0.16)');
    shade.addColorStop(1, 'rgba(10,6,10,0.3)');
    c.fillStyle = shade; c.fillRect(0, 0, 270, 150);
    c.globalCompositeOperation = 'source-over';
    grain(c, 270, 150, 0.05, 1213);
  });

  canvasTex(scene, 'ts-wall', 680, M.H, (c) => {
    const rand = rng(8801);
    begin(c);
    const face = [];
    let fy = 0;
    while (fy < 545) { face.push([18 + rand() * 30, fy]); fy += 22 + rand() * 26; }
    const rock = () => {
      c.beginPath();
      c.moveTo(680, 0);
      c.lineTo(face[0][0], 0);
      face.forEach(([x, y]) => c.lineTo(x, y));
      c.lineTo(44, 540);
      c.lineTo(680, 540);
      c.closePath();
    };
    const g = c.createLinearGradient(0, 0, 460, 0);
    g.addColorStop(0, '#c9854f');
    g.addColorStop(0.12, '#a05f3c');
    g.addColorStop(0.44, '#6d3c30');
    g.addColorStop(0.8, '#43272a');
    g.addColorStop(1, '#2a1a1e');
    c.fillStyle = g;
    rock(); c.fill();

    c.save();
    rock(); c.clip();
    // mesa strata, each band a different season of mud
    for (let y = 6; y < 540; y += 13) {
      const band = Math.floor(y / 62);
      c.fillStyle = band % 3 === 0 ? 'rgba(212,150,96,0.14)' : band % 3 === 1 ? 'rgba(120,62,44,0.16)' : 'rgba(58,32,34,0.18)';
      c.fillRect(0, y, 680, 7 + (y % 3));
    }
    c.strokeStyle = 'rgba(18,10,12,0.4)';
    for (let y = 20; y < 540; y += 34) {
      c.lineWidth = 1 + rand() * 2;
      c.beginPath();
      c.moveTo(20, y);
      for (let x = 20; x < 680; x += 70) c.lineTo(x, y + Math.sin(x * 0.012 + y) * 5);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,206,150,0.1)';
    for (let y = 30; y < 540; y += 68) {
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(30, y);
      for (let x = 30; x < 680; x += 80) c.lineTo(x, y + Math.sin(x * 0.01 + y * 0.2) * 4);
      c.stroke();
    }
    // vertical cracks
    c.strokeStyle = 'rgba(14,8,10,0.45)';
    for (let i = 0; i < 9; i++) {
      const x = 60 + rand() * 560;
      c.lineWidth = 1 + rand() * 3;
      c.beginPath();
      c.moveTo(x, rand() * 200);
      let cy = 0, cx = x;
      while (cy < 540) { cx += (rand() - 0.5) * 26; cy += 40 + rand() * 50; c.lineTo(cx, cy); }
      c.stroke();
    }
    // ledges holding scrub
    for (let i = 0; i < 8; i++) {
      const x = 70 + rand() * 520;
      const y = 60 + rand() * 420;
      c.fillStyle = 'rgba(20,12,14,0.5)';
      c.fillRect(x, y, 40 + rand() * 60, 6);
      c.fillStyle = 'rgba(126,104,58,0.5)';
      for (let k = 0; k < 4; k++) {
        c.beginPath(); c.ellipse(x + 8 + k * 12, y - 3, 5 + rand() * 4, 3 + rand() * 3, 0, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();

    // the sunlit lip of the face
    c.strokeStyle = 'rgba(255,214,150,0.55)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(face[0][0], 0);
    face.forEach(([x, y]) => c.lineTo(x, y));
    c.stroke();
    c.strokeStyle = 'rgba(70,34,28,0.5)';
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(face[0][0] + 12, 0);
    face.forEach(([x, y]) => c.lineTo(x + 12 + Math.sin(y * 0.05) * 4, y));
    c.stroke();

    // talus fan where the wall meets the scree
    c.fillStyle = 'rgba(150,92,58,0.5)';
    c.beginPath();
    c.moveTo(40, 540); c.lineTo(190, 540); c.lineTo(120, 496); c.quadraticCurveTo(64, 508, 30, 528);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(96,58,42,0.6)';
    for (let i = 0; i < 26; i++) {
      c.beginPath();
      c.ellipse(24 + rand() * 190, 502 + rand() * 36, 3 + rand() * 9, 2 + rand() * 4, rand(), 0, Math.PI * 2);
      c.fill();
    }
    end(c);
    grain(c, 680, M.H, 0.05, 8813);
  });

  canvasTex(scene, 'ts-far', W, M.H, (c) => {
    const rand = rng(3307);
    begin(c);
    const haze = c.createLinearGradient(0, 300, 0, 512);
    haze.addColorStop(0, 'rgba(234,179,130,0)');
    haze.addColorStop(0.55, 'rgba(234,179,130,0.22)');
    haze.addColorStop(1, 'rgba(226,154,96,0.34)');
    c.fillStyle = haze;
    c.fillRect(0, 300, W, 212);
    c.fillStyle = 'rgba(160,104,84,0.34)';
    let x = 40;
    while (x < W - 60) {
      const w = 140 + rand() * 210;
      const top = 374 + rand() * 52;
      c.beginPath();
      c.moveTo(x - 8, 502);
      c.lineTo(x + 26, top + 10);
      c.lineTo(x + 40, top);
      c.lineTo(x + w - 30, top + 2);
      c.lineTo(x + w - 14, top + 14);
      c.lineTo(x + w + 8, 502);
      c.closePath(); c.fill();
      x += w + 26 + rand() * 80;
    }
    end(c);
    grain(c, W, M.H, 0.02, 3311);
  });

  canvasTex(scene, 'ts-mid', W, M.H, (c) => {
    const rand = rng(3409);
    begin(c);
    let x = 10;
    while (x < W - 30) {
      const w = 170 + rand() * 220;
      const top = 398 + rand() * 44;
      const inset = 26 + rand() * 34;
      const butte = () => {
        c.beginPath();
        c.moveTo(x - 12, 514);
        c.lineTo(x + inset - 12, top + 16);
        c.lineTo(x + inset, top + 2);
        c.lineTo(x + w - inset, top - 2);
        c.lineTo(x + w - inset + 14, top + 14);
        c.lineTo(x + w + 12, 514);
        c.closePath();
      };
      const shade = c.createLinearGradient(0, top, 0, 514);
      shade.addColorStop(0, 'rgba(134,82,62,0.7)');
      shade.addColorStop(1, 'rgba(56,32,36,0.78)');
      c.fillStyle = shade;
      butte(); c.fill();
      c.save();
      butte(); c.clip();
      c.strokeStyle = 'rgba(28,16,18,0.26)';
      for (let i = 1; i < 5; i++) {
        const y = top + i * 20;
        c.lineWidth = 1 + (i % 2);
        c.beginPath();
        c.moveTo(x - 12, y);
        for (let sx = x; sx < x + w + 14; sx += 46) c.lineTo(sx, y + Math.sin(sx * 0.02 + i) * 2.5);
        c.stroke();
      }
      c.fillStyle = 'rgba(255,214,150,0.16)';
      c.fillRect(x + inset - 6, top - 2, w - inset * 2 + 12, 5);
      c.restore();
      x += w + 40 + rand() * 120;
    }
    end(c);
    grain(c, W, M.H, 0.03, 3413);
  });

  canvasTex(scene, 'ts-floor', W, M.H, (c) => {
    const rand = rng(3501);
    begin(c);
    const g = c.createLinearGradient(0, 486, 0, 540);
    g.addColorStop(0, '#a86a42');
    g.addColorStop(0.25, '#7d4632');
    g.addColorStop(1, '#2f1c1c');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 496);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, 494 + Math.sin(x * 0.011) * 3);
    c.lineTo(W, 540); c.lineTo(0, 540);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,214,150,0.4)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 496);
    for (let x = 0; x <= W; x += 40) c.lineTo(x, 494 + Math.sin(x * 0.011) * 3);
    c.stroke();
    c.strokeStyle = 'rgba(30,16,16,0.35)';
    for (let i = 0; i < 5; i++) {
      c.lineWidth = 1 + rand() * 2;
      const y = 502 + i * 8;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= W; x += 60) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 2);
      c.stroke();
    }
    c.fillStyle = 'rgba(196,142,94,0.5)';
    for (let i = 0; i < 40; i++) {
      c.beginPath();
      c.ellipse(rand() * W, 498 + rand() * 40, 2 + rand() * 8, 1.4 + rand() * 3, rand(), 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = 'rgba(52,28,24,0.8)';
    for (let i = 0; i < 9; i++) {
      const x = rand() * W;
      c.beginPath();
      c.moveTo(x, 500 + rand() * 20);
      c.lineTo(x + 12 + rand() * 16, 496 + rand() * 16);
      c.lineTo(x + 8, 512 + rand() * 16);
      c.closePath(); c.fill();
    }
    const shadow = c.createLinearGradient(0, 452, 0, 498);
    shadow.addColorStop(0, 'rgba(24,12,16,0)');
    shadow.addColorStop(1, 'rgba(24,12,16,0.4)');
    c.fillStyle = shadow;
    c.fillRect(0, 452, W, 46);
    end(c);
    if (M.bottom < M.H) {
      const deep = c.createLinearGradient(0, M.bottom, 0, M.H);
      deep.addColorStop(0, '#40231f');
      deep.addColorStop(1, '#1a1013');
      c.fillStyle = deep;
      c.fillRect(0, M.bottom - 3, W, M.H - M.bottom + 3);
      const dr = rng(3517);
      c.fillStyle = 'rgba(168,110,68,0.14)';
      for (let i = 0; i < 34; i++) {
        c.beginPath();
        c.ellipse(dr() * W, M.bottom + dr() * (M.H - M.bottom), 4 + dr() * 14, 1.6 + dr() * 3, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    grain(c, W, M.H, 0.04, 3511);
  });

  canvasTex(scene, 'ts-rim', W, M.H, (c) => {
    begin(c);
    const g = c.createLinearGradient(0, 0, 0, RIM + 34);
    g.addColorStop(0, 'rgba(28,14,22,0.05)');
    g.addColorStop(0.42, 'rgba(30,16,24,0.42)');
    g.addColorStop(0.78, 'rgba(26,14,20,0.2)');
    g.addColorStop(1, 'rgba(20,10,16,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, RIM + 34);
    c.strokeStyle = 'rgba(255,214,150,0.1)';
    c.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      const y = 8 + i * 14;
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= W; x += 80) c.lineTo(x, y + Math.sin(x * 0.008 + i) * 3);
      c.stroke();
    }
    end(c);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  art(scene, M);

  const r = rng(4127);
  const legs = [];
  const state = {
    t: 0, phase: 'launch', leg: 0, mesas: 0, hearts: 3, light: 1, over: false,
    travel: 0, speed: 140, vs: 0, stamina: 1, bank: 0, trim: 0,
    lift: 0, sink: 26, thermal: null, cold: false, pinned: false,
    straight: 0, stall: 0, flapT: 0, restT: 0, crashT: 0, launchT: 1.1,
    iFrames: 0, hold: false, popT: 0, gain: 0, thud: 0, hawkCd: 6
  };
  const p = { x: 250, tx: 250, y: 208, vx: 0, lastX: 250, lastTx: 250 };

  const far = scene.add.tileSprite(0, 0, W, M.H, 'ts-far').setOrigin(0).setDepth(-12);
  const mid = scene.add.tileSprite(0, 0, W, M.H, 'ts-mid').setOrigin(0).setDepth(-10);
  const floorTile = scene.add.tileSprite(0, 0, W, M.H, 'ts-floor').setOrigin(0).setDepth(8);
  const rimShade = scene.add.image(0, 0, 'ts-rim').setOrigin(0).setDepth(20);
  const veil = scene.add.rectangle(0, 0, W, M.H, 0x1c1226, 0).setOrigin(0).setDepth(21);
  const sunlit = scene.add.image(M.sunX, M.sunY, 'arc-glow').setDepth(-11).setScale(1.4 * K).setAlpha(0.4)
    .setTint(Phaser.Display.Color.HexStringToColor(PAL.sunGlow).color).setBlendMode(Phaser.BlendModes.ADD);

  const vortex = scene.add.particles(0, 0, 'arc-dot', {
    speedX: { min: -60, max: -14 }, speedY: { min: -14, max: 14 },
    lifespan: { min: 480, max: 900 }, scale: { start: 0.36, end: 0.02 },
    alpha: { start: 0.45, end: 0 }, tint: 0xffe6c0, emitting: false
  }).setDepth(12);
  const grit = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 40, max: 200 }, angle: { min: 150, max: 330 },
    lifespan: { min: 400, max: 900 }, scale: { start: 0.5, end: 0.04 },
    alpha: { start: 0.6, end: 0 }, tint: 0xd9a06a, gravityY: 260, emitting: false
  }).setDepth(15);
  const streaks = scene.add.particles(0, 0, 'arc-dot', {
    speedX: { min: -220, max: -80 }, speedY: { min: -8, max: 8 },
    lifespan: { min: 500, max: 1100 }, scale: { start: 0.3, end: 0.02 },
    alpha: { start: 0.3, end: 0 }, tint: 0xffe0b0, emitting: false
  }).setDepth(7);

  const bird = scene.add.image(p.x, M.Y(p.y), 'ts-soar-glide').setDepth(14).setScale(0.94 * K);
  const birdGlow = scene.add.image(p.x, M.Y(p.y), 'arc-glow').setDepth(9).setScale(0.9 * K).setAlpha(0.12)
    .setTint(Phaser.Display.Color.HexStringToColor(PAL.motes).color).setBlendMode(Phaser.BlendModes.ADD);
  const hawkImg = scene.add.image(-200, M.Y(RIM), 'ts-hawk').setDepth(13).setScale(0.8 * K).setVisible(false);

  const hawk = { on: false, x: 0, y: RIM + 20, t: 0, mode: 'circle' };
  let fx = { emitters: [], shimmer: [], bands: [], birds: [] };
  let pressAt = 0;

  function legStartOf(i) { return i === 0 ? 0 : buildLeg(i - 1).end - REST_TRAVEL; }

  function buildLeg(i) {
    if (legs[i]) return legs[i];
    const rr = rng(4127 + i * 977);
    const start = legStartOf(i);
    const len = 1180 + i * 120;
    const rad = Math.max(52, 112 - i * 5);
    const strength = Math.max(112, 154 - i * 4);
    const leg = {
      i, start, end: start + len, len, rad, strength,
      shelfY: 198 + rr() * 128,
      thermals: [], colds: [],
      wind: i === 0 ? 0 : (rr() < 0.5 ? -1 : 1) * Math.min(96, 26 + i * 6),
      hawk: i >= 2
    };
    const count = i < 5 ? 3 : 2;
    for (let k = 0; k < count; k++) {
      const f = (k + 0.42) / count + (rr() - 0.5) * 0.1;
      leg.thermals.push({
        d: start + 210 + f * (len - 340),
        rad, strength,
        top: 132 + rr() * 118,
        bird: rr() < 0.62,
        ph: rr() * 6.28
      });
    }
    if (i >= 1) {
      const cn = i < 4 ? 1 : 2;
      for (let k = 0; k < cn; k++) {
        const a = 148 + rr() * 186;
        leg.colds.push({ a, b: Math.min(FLOOR - 46, a + 54 + i * 5) });
      }
    }
    leg.wall = scene.add.image(-2000, 0, 'ts-wall').setOrigin(0).setDepth(7).setVisible(false);
    leg.ledge = scene.add.image(-2000, 0, 'ts-ledge').setOrigin(0).setDepth(9).setScale(K).setVisible(false);
    legs[i] = leg;
    return leg;
  }

  function clearFx() {
    fx.emitters.forEach((o) => o.em.destroy());
    fx.shimmer.forEach((o) => o.sh.destroy());
    fx.bands.forEach((o) => o.destroy());
    fx.birds.forEach((o) => o.v.destroy());
    fx = { emitters: [], shimmer: [], bands: [], birds: [] };
  }

  function activateLeg(i) {
    clearFx();
    const leg = buildLeg(i);
    leg.thermals.forEach((th) => {
      const h = FLOOR - th.top;
      const em = scene.add.particles(0, 0, 'arc-dot', {
        speedY: { min: -92, max: -48 }, speedX: { min: -16, max: 16 },
        lifespan: { min: 1500, max: 2600 }, scale: { start: 0.46, end: 0.04 },
        alpha: { start: 0.26 + 0.36 * state.light, end: 0 },
        tint: Phaser.Display.Color.HexStringToColor(PAL.motes).color,
        frequency: Math.round(132 - 70 * state.light), quantity: 1,
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-th.rad * 0.78, -h / 2, th.rad * 1.56, h) }
      }).setDepth(6);
      fx.emitters.push({ em, th });
      const sh = scene.add.rectangle(0, 0, th.rad * 1.4, 22 * M.band,
        Phaser.Display.Color.HexStringToColor(PAL.mist).color, 0.08 + 0.12 * state.light)
        .setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
      fx.shimmer.push({ sh, th });
      if (th.bird) {
        const v = scene.add.image(-2000, M.Y(th.top + 40), 'ts-vulture').setDepth(8)
          .setScale(0.76 * K).setAlpha(0.5 + 0.4 * state.light);
        fx.birds.push({ v, th, ph: th.ph });
      }
    });
    leg.colds.forEach((cd) => {
      const band = scene.add.rectangle(0, M.Y((cd.a + cd.b) / 2), W, (cd.b - cd.a) * M.band, 0xe4dcf0, 0.09)
        .setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
      band._cd = cd;
      fx.bands.push(band);
    });
  }

  function creak(power) {
    const a = scene.audio;
    try {
      if (!a || !a.ctx || a.muted) { scene.sfx('whoosh'); return; }
      const ctx = a.ctx, t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(76, t);
      o.frequency.exponentialRampToValueAtTime(76 + 170 * power, t + 0.75);
      f.type = 'bandpass';
      f.frequency.setValueAtTime(360, t);
      f.frequency.exponentialRampToValueAtTime(1300, t + 0.75);
      f.Q.value = 7;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      o.connect(f); f.connect(g); g.connect(a.sfxBus);
      o.start(t); o.stop(t + 0.9);
    } catch { scene.sfx('whoosh'); }
  }

  function flap() {
    if (state.over || state.phase === 'rest' || state.phase === 'crash') return;
    if (state.stamina < 0.24) { scene.notice('no air left in the wings', 1100); return; }
    state.stamina -= 0.24;
    state.vs -= 235;
    state.flapT = 0.7;
    scene.sfx('whoosh');
    scene.burst(p.x - 34 * K, M.Y(p.y + 14), 0xffe0b0, 6, { life: 420, gravity: 90 });
    vortex.emitParticleAt(p.x - 46 * K, M.Y(p.y - 26 * K), 3);
    vortex.emitParticleAt(p.x - 46 * K, M.Y(p.y + 26 * K), 3);
  }

  function windLine(leg) {
    if (Math.abs(leg.wind) < 12) return 'still air. read the rock for the warm columns';
    return leg.wind < 0
      ? 'crosswind off the west wall — it will have you against the rock'
      : 'the wind has turned and is pushing you at the far wall';
  }

  function startLaunch() {
    state.leg = state.mesas;
    activateLeg(state.leg);
    state.phase = 'launch';
    state.launchT = 0.9;
    state.speed = 150;
    state.vs = -22;
    state.trim = 0;
    state.straight = 0;
    state.hawkCd = 5;
    state.light = Math.max(0.3, state.light - 0.035);
    scene.sfx('whoosh');
    grit.emitParticleAt(p.x - 20 * K, M.Y(p.y + 20 * K), 5);
    scene.notice(windLine(legs[state.leg]), 1800);
  }

  function land(leg) {
    state.mesas++;
    state.phase = 'rest';
    state.restT = 1.5;
    state.travel = leg.end - REST_TRAVEL;
    state.hold = false;
    state.vs = 0;
    state.speed = 40;
    p.x = ANCHOR; p.tx = ANCHOR; p.y = leg.shelfY;
    scene.sfx('good');
    scene.burst(p.x, M.Y(p.y) - 8, 0xffd9a0, 12, { life: 640, gravity: 260, spin: true });
    grit.emitParticleAt(p.x, M.Y(p.y) + 6, 8);
    scene.popText(p.x, M.Y(p.y - 62), '+1 mesa', '#ffe6a8');
    if (state.mesas >= LEGS) endRun(true);
    else scene.notice(MESA_LINES[state.mesas % MESA_LINES.length], 1900);
  }

  function crash(leg, why) {
    state.hearts--;
    state.light = Math.max(0.3, state.light - 0.15);
    state.phase = 'crash';
    state.crashT = 1;
    state.hold = false;
    state.stall = 0;
    scene.sfx('hurt');
    scene.sfx('boom');
    scene.shake(340, 0.016);
    scene.cameras.main.flash(240, 120, 50, 30);
    scene.burst(p.x, M.Y(p.y), 0xd9a06a, 24, { life: 820, gravity: 320, spin: true });
    grit.emitParticleAt(p.x, M.Y(p.y), 14);
    scene.popText(p.x, M.Y(p.y - 66), 'rock', '#ffb08a');
    if (state.hearts <= 0) { endRun(false); return; }
    scene.notice(CRASH_LINES[why] || CRASH_LINES.floor, 2200);
  }

  function recover() {
    const leg = legs[state.leg];
    state.travel = leg.start;
    p.x = ANCHOR; p.tx = ANCHOR;
    p.y = state.leg > 0 ? clamp(legs[state.leg - 1].shelfY - 34, RIM + 40, FLOOR - 130) : 214;
    state.vs = 0;
    state.speed = 132;
    state.iFrames = 1.5;
    state.phase = 'launch';
    state.launchT = 1;
    state.stamina = Math.max(state.stamina, 0.65);
    state.hawkCd = 6;
    hawk.on = false;
    hawkImg.setVisible(false);
    scene.cameras.main.flash(200, 255, 210, 150);
    scene.notice(state.hearts === 1 ? 'one feather of luck left' : 'back on the ledge, and the light is thinner now', 2000);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    state.hold = false;
    scene.finish(win, {
      score: state.mesas,
      note: win
        ? 'fourteen mesas, and the canyon finally lets go of you'
        : `${state.mesas} mesas kept, and the light went before the far shelf did`
    });
  }

  function spawnHawk() {
    hawk.on = true;
    hawk.mode = 'circle';
    hawk.t = 0;
    hawk.x = clamp(p.x + 300, 140, 900);
    hawk.y = RIM + 24;
    hawkImg.setVisible(true);
    scene.sfx('tick');
    scene.notice('a hawk is bored of the sky. turn, and it loses interest', 1800);
  }

  function stallOut() {
    state.stall = 1.2;
    state.vs = 215;
    scene.sfx('bad');
    scene.shake(240, 0.012);
    scene.burst(p.x, M.Y(p.y), 0xffd0a0, 10, { life: 540 });
    scene.popText(p.x, M.Y(p.y - 60), 'stalled', '#ffc08a');
    scene.notice('the hawk had you. wing dropped, nose down, all of it', 1900);
  }

  function updateHawk(dt, time) {
    if (!hawk.on) return;
    hawk.t += dt;
    if (hawk.mode === 'circle') {
      hawk.x += (p.x + 280 - hawk.x) * Math.min(1, dt * 1.4);
      hawk.y = RIM + 22 + Math.sin(time / 640) * 12;
      if (hawk.t > 1.3) hawk.mode = 'dive';
      else if (state.bank > 0.55) { hawk.mode = 'away'; state.straight = 0; }
    }
    if (hawk.mode === 'dive') {
      const dx = p.x - hawk.x, dy = p.y - hawk.y;
      const d = Math.hypot(dx, dy) || 1;
      hawk.x += (dx / d) * 400 * dt;
      hawk.y += (dy / d) * 400 * dt;
      if (d < 42 * K) { stallOut(); hawk.mode = 'away'; }
      else if (hawk.t > 4.4) hawk.mode = 'away';
    }
    if (hawk.mode === 'away') {
      hawk.x -= 420 * dt;
      hawk.y -= 210 * dt;
      if (hawk.x < -160 || hawk.y < RIM - 60) {
        hawk.on = false;
        hawkImg.setVisible(false);
        state.hawkCd = 9 + r() * 6;
      }
    }
    hawkImg.x = hawk.x;
    hawkImg.y = M.Y(clamp(hawk.y, 20, FLOOR - 20));
    hawkImg.setAngle(clamp((hawk.y - p.y) * 0.5, -28, 34));
  }

  scene.input.on('pointermove', (ptr) => {
    p.tx = clamp(ptr.x, LEFT, RIGHT);
    state.trim = clamp((scene.uY(ptr.y) - p.y) / 150, -1, 1);
  });
  scene.input.on('pointerdown', (ptr) => {
    pressAt = scene.time.now;
    state.hold = true;
    p.tx = clamp(ptr.x, LEFT, RIGHT);
  });
  scene.input.on('pointerup', () => {
    state.hold = false;
    if (scene.time.now - pressAt < 200) flap();
  });

  const keys = scene.input.keyboard.addKeys({
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
    w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE', f: 'F'
  });
  scene.input.keyboard.on('keydown-SPACE', () => { state.hold = true; });
  scene.input.keyboard.on('keyup-SPACE', () => { state.hold = false; });
  scene.input.keyboard.on('keydown-F', flap);

  scene.hud({ score: 0, progress: 0.7, hearts: 3, extra: 'find the warm air' });
  scene.notice('no flapping for the sake of it. the rising air is the only bank there is', 2600);
  activateLeg(0);

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.t += dt;
    const leg = legs[state.leg];
    state.iFrames = Math.max(0, state.iFrames - dt);
    state.flapT = Math.max(0, state.flapT - dt);
    state.stall = Math.max(0, state.stall - dt);
    state.thud = Math.max(0, state.thud - dt);

    if (state.phase === 'rest') {
      state.restT -= dt;
      state.stamina = Math.min(1, state.stamina + dt * 0.55);
      if (Math.random() < dt * 3) grit.emitParticleAt(p.x + (r() - 0.5) * 90 * K, M.Y(p.y) + 4, 1);
      if (state.restT <= 0) startLaunch();
    } else if (state.phase === 'crash') {
      state.crashT -= dt;
      p.y = Math.min(FLOOR - 12, p.y + 130 * dt);
      p.x += (r() - 0.5) * 30 * dt;
      if (Math.random() < dt * 14) grit.emitParticleAt(p.x, M.Y(p.y) + 8, 2);
      if (state.crashT <= 0) recover();
    } else {
      // ---- steering
      const kbDir = (keys.left.isDown || keys.a.isDown ? -1 : 0) + (keys.right.isDown || keys.d.isDown ? 1 : 0);
      if (kbDir) p.tx = clamp(p.tx + kbDir * 460 * dt, LEFT, RIGHT);
      const kbTrim = (keys.up.isDown || keys.w.isDown ? -1 : 0) + (keys.down.isDown || keys.s.isDown ? 1 : 0);
      if (kbTrim) state.trim = clamp(state.trim + kbTrim * 1.8 * dt, -1, 1);
      else state.trim *= 1 - Math.min(1, dt * 1.6);

      p.x += (p.tx - p.x) * Math.min(1, dt * 5.4) + leg.wind * dt;
      p.x = clamp(p.x, LEFT, RIGHT);
      state.pinned = p.x <= LEFT + 1 && leg.wind < -18;
      const moved = p.x - p.lastX;
      p.vx = lerp(p.vx, moved / Math.max(dt, 0.001), 0.35);
      p.lastX = p.x;
      state.bank = clamp(Math.abs(p.vx - leg.wind) / 190, 0, 1);
      const steer = Math.abs(p.tx - p.lastTx);
      p.lastTx = p.tx;
      if (steer > 1.2 || state.bank > 0.55) state.straight = Math.max(0, state.straight - dt * 3);
      else state.straight += dt;

      // ---- speed
      const tucked = state.hold && state.stall <= 0;
      const target = state.stall > 0 ? V_STALL : (tucked ? V_TUCK : V_SPREAD) - state.trim * 26;
      const ease = Math.min(1, dt * (state.phase === 'launch' ? 1.5 : 2.4));
      state.speed += (target - state.speed) * ease;

      // ---- rising air
      let lift = 0;
      let hold = null;
      for (const th of leg.thermals) {
        const sx = th.d - state.travel + ANCHOR;
        const dx = Math.abs(sx - p.x);
        if (dx < th.rad && p.y > th.top) {
          const centre = clamp(1 - dx / th.rad, 0, 1);
          const l = th.strength * (0.55 + 0.45 * state.bank) * centre * (0.72 + 0.28 * state.light);
          if (l > lift) { lift = l; hold = th; }
        }
      }
      state.cold = leg.colds.some((cd) => p.y > cd.a && p.y < cd.b);
      if (state.cold) { lift = 0; hold = null; }
      if (state.stall > 0) lift = 0;
      state.lift = lift;
      if (hold && !state.thermal) { creak(clamp(lift / 150, 0.3, 1)); scene.popText(p.x, M.Y(p.y - 70), 'warm air', '#ffd9a0'); }
      state.thermal = hold;

      const riding = !!hold;
      const speedTarget = riding ? state.speed * 0.62 : state.speed;
      state.sink = 26 + Math.max(0, speedTarget - V_SPREAD) * 0.3
        + (state.cold ? 46 : 0) + (state.pinned ? 34 : 0)
        - (state.flapT > 0 ? 62 : 0);
      if (riding) state.speed += (V_SPREAD * 0.6 - state.speed) * Math.min(1, dt * 2.2);

      const vTarget = state.sink - lift;
      state.vs += (vTarget - state.vs) * Math.min(1, dt * 3.2);
      state.travel += state.speed * dt;
      p.y += state.vs * dt;
      state.stamina = Math.min(1, state.stamina + dt * 0.055);

      if (state.vs < 0) {
        state.gain += -state.vs * dt;
        state.popT -= dt;
        if (state.popT <= 0 && state.gain > 24) {
          scene.popText(p.x + 40 * K, M.Y(p.y - 40), '+' + Math.round(state.gain) + ' m', '#ffe6a8');
          state.gain = 0;
          state.popT = 0.8;
        }
      } else state.gain = 0;

      // ---- the band
      if (p.y < RIM) {
        p.y = RIM;
        state.vs = Math.max(state.vs, 34);
        if (state.thud <= 0) {
          state.thud = 0.7;
          scene.sfx('land');
          scene.burst(p.x, M.Y(RIM + 6), 0xc08a5a, 5, { life: 420, gravity: 240 });
        }
      }
      if (p.y > FLOOR - 8) { crash(leg, 'floor'); return; }

      // ---- the mesa
      const face = leg.end - state.travel + ANCHOR;
      const front = p.x + 34 * K;
      if (state.phase === 'glide' && state.iFrames <= 0) {
        const overShelf = front >= face - SHELF_REACH * K && face >= p.x - 26 * K;
        if (overShelf) {
          const dy = p.y - leg.shelfY;
          const gentle = Math.abs(state.vs) < LAND_VS && !tucked;
          if (dy > -SHELF_UP && dy < SHELF_DOWN && gentle) { land(leg); return; }
        }
        if (face <= front) {
          const hot = Math.abs(state.vs) >= LAND_VS || tucked;
          crash(leg, hot ? 'hot' : (p.y > leg.shelfY + SHELF_DOWN ? 'low' : 'high'));
          return;
        }
      }
      if (state.phase === 'launch') {
        state.launchT -= dt;
        if (state.launchT <= 0) state.phase = 'glide';
      }
      if (leg.hawk && !hawk.on && state.phase === 'glide') {
        state.hawkCd -= dt;
        if (state.straight > 3.2 && state.hawkCd <= 0) spawnHawk();
      }
    }

    updateHawk(dt, time);

    // ---- world positions
    const scroll = state.travel;
    far.tilePositionX = scroll * 0.055;
    mid.tilePositionX = scroll * 0.15;
    floorTile.tilePositionX = scroll * 0.92;
    for (const o of legs) {
      if (!o) continue;
      const face = o.end - scroll + ANCHOR;
      o.wall.x = face;
      o.ledge.x = face - SHELF_REACH * K - 8 * K;
      o.ledge.y = M.Y(o.shelfY) - 30 * K;
      const seen = face > -700 && face < W + 60;
      o.wall.setVisible(seen);
      o.ledge.setVisible(seen && face > -260);
    }
    for (const o of fx.emitters) {
      const sx = o.th.d - scroll + ANCHOR;
      o.em.x = sx;
      o.em.y = M.Y((o.th.top + FLOOR) / 2);
      o.em.visible = sx > -260 && sx < W + 260;
    }
    for (const o of fx.shimmer) {
      const sx = o.th.d - scroll + ANCHOR;
      o.sh.x = sx;
      o.sh.y = M.Y(FLOOR - 14);
      o.sh.alpha = (0.06 + 0.14 * state.light) * (0.7 + 0.3 * Math.sin(time / 420 + o.th.ph));
      o.sh.visible = sx > -200 && sx < W + 200;
    }
    for (const o of fx.birds) {
      const sx = o.th.d - scroll + ANCHOR;
      const swing = Math.cos(time / 880 + o.ph);
      o.v.x = sx + swing * o.th.rad * 0.5;
      o.v.y = M.Y(o.th.top + 44 + Math.sin(time / 620 + o.ph) * 16);
      o.v.setFlipX(swing < 0);
      o.v.setAngle(Math.sin(time / 700 + o.ph) * 5);
      o.v.visible = sx > -160 && sx < W + 160;
    }
    for (const band of fx.bands) {
      band.alpha = 0.06 + 0.05 * Math.sin(time / 1500 + band._cd.a);
    }
    if (Math.abs(leg.wind) > 22 && state.phase !== 'rest' && Math.random() < dt * 22) {
      streaks.emitParticleAt(leg.wind < 0 ? W + 20 : -20, M.Y(RIM + 20 + r() * (FLOOR - RIM - 40)), 1);
    }

    // ---- bird
    const tucked = state.hold && state.stall <= 0 && state.phase !== 'rest';
    let tex = 'ts-soar-glide';
    if (state.phase === 'rest') tex = 'ts-soar-perch';
    else if (state.phase === 'crash') tex = 'ts-soar-tuck';
    else if (state.flapT > 0.42) tex = 'ts-soar-flap';
    else if (tucked) tex = 'ts-soar-tuck';
    if (bird.texture.key !== tex) bird.setTexture(tex);
    bird.x = p.x;
    bird.y = M.Y(p.y);
    bird.rotation = state.phase === 'crash'
      ? Math.sin(state.t * 14) * 0.5
      : clamp(state.vs / 900, -0.42, 0.44) + state.trim * 0.08;
    bird.setScale(0.94 * K);
    bird.setAlpha(state.iFrames > 0 && Math.floor(time / 70) % 2 ? 0.4 : 1);
    birdGlow.x = p.x;
    birdGlow.y = M.Y(p.y);
    birdGlow.setAlpha(0.08 + (state.thermal ? 0.14 : 0) + Math.sin(time / 400) * 0.02);
    if (state.phase !== 'rest' && state.phase !== 'crash') {
      const rate = (state.speed - 120) / 620 + (state.thermal ? 0.35 : 0);
      if (Math.random() < rate * dt * 34) {
        vortex.emitParticleAt(p.x - 52 * K, M.Y(p.y - 30 * K), 1);
        vortex.emitParticleAt(p.x - 52 * K, M.Y(p.y + 30 * K), 1);
      }
    }
    veil.setFillStyle(0x1c1226, (1 - state.light) * 0.4);
    sunlit.setAlpha(0.16 + state.light * 0.4);

    const alt = FLOOR - p.y;
    let extra = 'find the warm air';
    if (state.phase === 'rest') extra = 'resting on the shelf';
    else if (state.phase === 'crash') extra = 'down you go';
    else if (state.stall > 0) extra = 'wing dropped';
    else if (state.thermal) extra = 'the column has you — bank it';
    else if (state.cold) extra = 'cold layer, no lift';
    else if (state.pinned) extra = 'the wind has you against the rock';
    else if (tucked) extra = 'tucked — buying ground';
    else if (state.light < 0.5) extra = 'the light is going';

    scene.hud({
      score: state.mesas,
      progress: clamp(alt / (FLOOR - RIM), 0, 1),
      hearts: state.hearts,
      extra
    });
    scene.audio.setTension(clamp(0.12 + (state.thermal ? 0.3 : 0) + (1 - state.light) * 0.3 + (tucked ? 0.2 : 0), 0, 1));
  }

  const faceOf = (i) => legs[i].end - state.travel + ANCHOR;

  return {
    update,
    flap,
    state: () => ({
      phase: state.phase, mesas: state.mesas, hearts: state.hearts, light: Number(state.light.toFixed(2)),
      leg: state.leg, travel: Math.round(state.travel), x: Math.round(p.x), y: Math.round(p.y),
      alt: Math.round(FLOOR - p.y), vs: Math.round(state.vs), speed: Math.round(state.speed),
      tucked: state.hold, bank: Number(state.bank.toFixed(2)), trim: Number(state.trim.toFixed(2)),
      lift: Math.round(state.lift || 0), sink: Math.round(state.sink), stamina: Number(state.stamina.toFixed(2)),
      inThermal: !!state.thermal, inCold: state.cold, pinned: state.pinned, stalled: state.stall > 0,
      hawk: hawk.on, straight: Number(state.straight.toFixed(2)), over: state.over,
      shelfY: Math.round(legs[state.leg].shelfY),
      faceX: Math.round(faceOf(state.leg)), wind: Math.round(legs[state.leg].wind),
      thermals: legs[state.leg].thermals.map((th) => ({
        x: Math.round(th.d - state.travel + ANCHOR), rad: Math.round(th.rad),
        top: Math.round(th.top), strength: Math.round(th.strength)
      })),
      colds: legs[state.leg].colds.map((cd) => ({ a: Math.round(cd.a), b: Math.round(cd.b) }))
    }),
    setTuck: (v) => { state.hold = !!v; },
    setHearts: (v) => { state.hearts = v; },
    setMesas: (v) => { state.mesas = v; },
    setLight: (v) => { state.light = clamp(v, 0.3, 1); },
    aim: (x) => { p.tx = clamp(x, LEFT, RIGHT); },
    climbTo: (v) => {
      state.phase = 'glide';
      state.launchT = 0;
      state.hold = false;
      state.stall = 0;
      state.iFrames = 0;
      state.vs = 0;
      p.y = clamp(v, RIM + 6, FLOOR - 40);
      return { y: Math.round(p.y), alt: Math.round(FLOOR - p.y) };
    },
    jumpToLeg: (i) => {
      const idx = clamp(i, 0, LEGS - 1);
      state.mesas = idx;
      state.hearts = Math.max(1, state.hearts);
      state.travel = buildLeg(idx).start;
      state.phase = 'launch';
      state.launchT = 0.6;
      state.vs = 0;
      state.speed = 170;
      state.stall = 0;
      state.iFrames = 0.8;
      p.x = ANCHOR; p.tx = ANCHOR; p.y = 210; p.lastX = ANCHOR;
      activateLeg(idx);
      state.leg = idx;
      return { leg: idx, shelfY: Math.round(legs[idx].shelfY) };
    },
    centerThermal: (k) => {
      const leg = legs[state.leg];
      const th = leg.thermals[clamp(k || 0, 0, leg.thermals.length - 1)];
      state.phase = 'glide';
      state.launchT = 0;
      state.hold = false;
      state.stall = 0;
      state.travel = th.d - 420 + ANCHOR;
      p.x = 420; p.tx = 420; p.lastX = 420;
      p.y = clamp(FLOOR - 60, th.top + 40, FLOOR - 20);
      state.vs = 0;
      state.speed = V_SPREAD;
      return { x: 420, y: Math.round(p.y), top: Math.round(th.top), rad: Math.round(th.rad) };
    },
    dropIntoCold: () => {
      const leg = legs[state.leg];
      const cd = leg.colds[0] || { a: 200, b: 260 };
      const th = leg.thermals[0];
      state.phase = 'glide';
      state.hold = false;
      if (th) state.travel = th.d - 420 + ANCHOR;
      p.x = 420; p.tx = 420; p.lastX = 420;
      p.y = (cd.a + cd.b) / 2;
      state.vs = 0;
      state.speed = V_SPREAD;
      return { y: Math.round(p.y), a: Math.round(cd.a), b: Math.round(cd.b) };
    },
    arriveClean: () => {
      const leg = buildLeg(state.leg);
      state.phase = 'glide';
      state.hold = false;
      state.stall = 0;
      state.iFrames = 0;
      p.x = ANCHOR; p.tx = ANCHOR; p.lastX = ANCHOR;
      p.y = leg.shelfY - 12;
      state.vs = 40;
      state.speed = V_SPREAD;
      state.travel = leg.end - SHELF_REACH * K - ANCHOR + p.x - 40;
      return { shelfY: Math.round(leg.shelfY), faceX: Math.round(faceOf(state.leg)), mesas: state.mesas };
    },
    arriveHot: () => {
      const leg = buildLeg(state.leg);
      state.phase = 'glide';
      state.iFrames = 0;
      p.x = ANCHOR; p.tx = ANCHOR; p.lastX = ANCHOR;
      p.y = leg.shelfY + 30;
      state.vs = 330;
      state.speed = V_TUCK;
      state.hold = true;
      state.travel = leg.end - SHELF_REACH * K - ANCHOR + p.x - 40;
      return { shelfY: Math.round(leg.shelfY), faceX: Math.round(faceOf(state.leg)), hearts: state.hearts };
    },
    arriveLow: () => {
      const leg = buildLeg(state.leg);
      state.phase = 'glide';
      state.hold = false;
      state.iFrames = 0;
      p.x = ANCHOR; p.tx = ANCHOR; p.lastX = ANCHOR;
      p.y = leg.shelfY + 150;
      state.vs = 40;
      state.speed = V_SPREAD;
      state.travel = leg.end - SHELF_REACH * K - ANCHOR + p.x - 40;
      return { shelfY: Math.round(leg.shelfY), y: Math.round(p.y) };
    }
  };
}

export default {
  id: 'thermal-soar',
  stars: STAR,
  unit: 'mesas',
  backdropOpts: { ridges: false, ground: false },
  create,
  update: (scene, t, d) => scene.gameObj.update(t, d)
};
