// Starlight Stalk — the sleeping wood.
// Walk the dark lane with the last egg on your back. Noise wakes the hunters;
// fern cover buys you the seconds you need. The far nest is far.

import { canvasTex, grain, rng, clamp, approach, lerp, W } from '../engine.js?v=du-7ebd3d49aa7fa37b';

const GROUND = 444;
const GOAL_M = 1500;
const PX_PER_M = 12;
const STAR = [700, 1100, 1500];
const WAKE_R = 320;
const STRIKE_R = 204;

function heroArt(scene) {
  ['a', 'b', 'crouch'].forEach((pose) => {
    canvasTex(scene, 'sl-hero-' + pose, 176, 150, (c) => {
      const rand = rng(205 + pose.charCodeAt(0));
      const crouch = pose === 'crouch';
      const step = pose === 'b' ? 1 : -1;
      const lift = crouch ? 22 : 0;
      const y = 108 + lift;

      // tail
      c.strokeStyle = '#5c6d52';
      c.lineWidth = 10;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(54, y - 4);
      c.quadraticCurveTo(26, y - 14, 10, y - (crouch ? 18 : 34));
      c.stroke();
      c.strokeStyle = '#43523c';
      c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(44 - i * 9, y - 6 - i * 4);
        c.lineTo(36 - i * 8, y - 16 - i * 6);
        c.stroke();
      }

      // legs
      c.strokeStyle = '#5f7254';
      c.lineWidth = 8;
      const legs = crouch
        ? [[74, y + 4, 66, y + 22, 60, y + 34], [92, y + 4, 104, y + 22, 108, y + 34]]
        : [[74, y + 2, 70 + step * 12, y + 20, 62 + step * 14, y + 36], [94, y + 2, 100 - step * 10, y + 20, 108 - step * 12, y + 36]];
      legs.forEach(([hx, hy, kx, ky, fx, fy], i) => {
        c.strokeStyle = i ? '#526347' : '#63765a';
        c.lineWidth = 8;
        c.beginPath();
        c.moveTo(hx, hy); c.quadraticCurveTo(kx, ky - 8, kx, ky); c.lineTo(fx, fy);
        c.stroke();
        c.strokeStyle = '#d6c79a';
        c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 11, fy + 1); c.stroke();
      });

      // body
      const body = c.createLinearGradient(56, y - 48, 132, y + 8);
      body.addColorStop(0, '#82966a');
      body.addColorStop(0.55, '#5d7250');
      body.addColorStop(1, '#3b4b38');
      c.fillStyle = body;
      c.beginPath(); c.ellipse(96, y - 20, 44, 26, -0.1, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(214,224,168,0.22)';
      c.beginPath(); c.ellipse(98, y - 8, 30, 9, -0.06, 0, Math.PI * 2); c.fill();

      // feather fringe along the spine
      c.fillStyle = 'rgba(46,58,42,0.8)';
      for (let i = 0; i < 6; i++) {
        const fx = 62 + i * 13;
        c.beginPath();
        c.moveTo(fx, y - 42 + i * 1.4);
        c.quadraticCurveTo(fx - 4, y - 56, fx + 7, y - 60 + i * 1.2);
        c.quadraticCurveTo(fx + 6, y - 48, fx + 9, y - 42 + i * 1.4);
        c.closePath(); c.fill();
      }

      // neck + head
      c.strokeStyle = '#6f8559';
      c.lineWidth = 13;
      c.beginPath();
      c.moveTo(128, y - 32);
      c.quadraticCurveTo(142, y - (crouch ? 40 : 52), 152, y - (crouch ? 44 : 62));
      c.stroke();
      c.fillStyle = '#7d9463';
      c.beginPath(); c.ellipse(158, y - (crouch ? 48 : 66), 17, 12, -0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c9a86a';
      c.beginPath();
      c.moveTo(168, y - (crouch ? 54 : 72));
      c.quadraticCurveTo(184, y - (crouch ? 52 : 70), 180, y - (crouch ? 46 : 64));
      c.quadraticCurveTo(172, y - (crouch ? 44 : 62), 164, y - (crouch ? 44 : 62));
      c.closePath(); c.fill();
      c.fillStyle = '#f6e9bd';
      c.beginPath(); c.arc(157, y - (crouch ? 52 : 70), 4.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b2417';
      c.beginPath(); c.arc(158, y - (crouch ? 52 : 70), 2.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath(); c.arc(156.4, y - (crouch ? 53.4 : 71.4), 0.9, 0, Math.PI * 2); c.fill();

      // arms tucked
      c.strokeStyle = '#5c7050';
      c.lineWidth = 5;
      c.beginPath(); c.moveTo(98, y - 10); c.quadraticCurveTo(106, y + 4, 100, y + 10); c.stroke();

      // the egg in its sling
      c.save();
      c.translate(74, y - 30);
      c.rotate(-0.28);
      c.strokeStyle = '#7a6242';
      c.lineWidth = 4;
      c.beginPath(); c.moveTo(-18, -22); c.quadraticCurveTo(-2, -30, 16, -20); c.stroke();
      const egg = c.createRadialGradient(-4, 2, 2, 2, 8, 24);
      egg.addColorStop(0, '#fff6da');
      egg.addColorStop(0.65, '#ecd8a6');
      egg.addColorStop(1, '#b99a62');
      c.fillStyle = egg;
      c.beginPath(); c.ellipse(0, 4, 15, 20, 0.08, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(126,98,58,0.4)';
      for (let i = 0; i < 6; i++) {
        c.beginPath(); c.ellipse(-8 + (i * 7) % 16, -8 + (i * 9) % 22, 1.7, 1.1, i, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.beginPath(); c.ellipse(-5, -6, 4, 7, -0.4, 0, Math.PI * 2); c.fill();
      c.restore();

      c.globalCompositeOperation = 'source-atop';
      const rim = c.createLinearGradient(40, 20, 180, 140);
      rim.addColorStop(0, 'rgba(168,206,255,0.26)');
      rim.addColorStop(0.6, 'rgba(168,206,255,0)');
      rim.addColorStop(1, 'rgba(255,190,110,0.14)');
      c.fillStyle = rim; c.fillRect(0, 0, 176, 150);
      c.globalCompositeOperation = 'source-over';
      grain(c, 176, 150, 0.03, 83 + rand() * 9);
    });
  });
}

function hunterArt(scene) {
  canvasTex(scene, 'sl-hunter-sleep', 400, 240, (c) => {
    const rand = rng(311);
    c.fillStyle = 'rgba(6,12,14,0.5)';
    c.beginPath(); c.ellipse(210, 234, 158, 10, 0, 0, Math.PI * 2); c.fill();

    // tail curled out behind and around the rump
    c.strokeStyle = '#26353d';
    c.lineWidth = 26;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(336, 176);
    c.quadraticCurveTo(390, 202, 362, 228);
    c.quadraticCurveTo(326, 240, 274, 234);
    c.stroke();
    c.strokeStyle = '#3d505a';
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(342, 182);
    c.quadraticCurveTo(376, 204, 350, 224);
    c.stroke();

    // long low sleeping body
    const body = c.createLinearGradient(60, 110, 360, 240);
    body.addColorStop(0, '#3b4d57');
    body.addColorStop(0.5, '#283741');
    body.addColorStop(1, '#141d23');
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(90, 232);
    c.quadraticCurveTo(68, 178, 96, 146);
    c.quadraticCurveTo(126, 114, 196, 108);
    c.quadraticCurveTo(268, 104, 322, 136);
    c.quadraticCurveTo(360, 160, 360, 194);
    c.quadraticCurveTo(352, 226, 306, 234);
    c.quadraticCurveTo(220, 244, 150, 238);
    c.closePath(); c.fill();

    // haunch over the folded hind leg
    c.fillStyle = '#2b3a43';
    c.beginPath(); c.ellipse(306, 184, 62, 44, -0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(126,158,172,0.13)';
    c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(306, 184, 47, 31, -0.2, Math.PI * 1.16, Math.PI * 1.8); c.stroke();
    c.fillStyle = '#22303a';
    c.beginPath(); c.ellipse(342, 212, 30, 20, 0.2, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#d8cba2';
    c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(362, 222); c.lineTo(378, 226); c.stroke();
    c.beginPath(); c.moveTo(356, 229); c.lineTo(370, 234); c.stroke();

    // neck sweeping down to the resting head
    c.strokeStyle = '#35474f';
    c.lineWidth = 42;
    c.beginPath();
    c.moveTo(166, 152);
    c.quadraticCurveTo(132, 160, 116, 188);
    c.stroke();
    c.strokeStyle = 'rgba(150,186,204,0.2)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(170, 132);
    c.quadraticCurveTo(136, 144, 122, 172);
    c.stroke();

    // big resting head, chin on the forelimb
    c.fillStyle = '#3f535e';
    c.beginPath(); c.ellipse(112, 194, 58, 33, -0.08, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#4c626e';
    c.beginPath();
    c.moveTo(92, 182);
    c.quadraticCurveTo(52, 178, 24, 188);
    c.quadraticCurveTo(14, 198, 28, 208);
    c.quadraticCurveTo(58, 216, 92, 212);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(210,216,190,0.18)';
    c.beginPath(); c.ellipse(56, 206, 28, 7, 0.02, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#141d21';
    c.beginPath(); c.arc(34, 193, 3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1a2429';
    c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(24, 201); c.quadraticCurveTo(52, 210, 88, 208); c.stroke();
    // pale eyelid and closed eye
    c.fillStyle = 'rgba(178,202,214,0.2)';
    c.beginPath(); c.ellipse(100, 188, 17, 11, -0.05, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#101a1f';
    c.lineWidth = 3.2;
    c.beginPath(); c.arc(100, 188, 11, Math.PI * 0.14, Math.PI * 0.86); c.stroke();
    c.strokeStyle = '#2a3a42';
    c.lineWidth = 6;
    c.beginPath(); c.moveTo(82, 173); c.quadraticCurveTo(104, 166, 126, 174); c.stroke();
    // brow horn and crown feathers
    c.fillStyle = '#2b3b43';
    c.beginPath();
    c.moveTo(128, 170);
    c.quadraticCurveTo(146, 152, 160, 168);
    c.quadraticCurveTo(146, 172, 132, 176);
    c.closePath(); c.fill();
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.moveTo(146 + i * 9, 158 - i * 5);
      c.quadraticCurveTo(160 + i * 10, 147 - i * 6, 168 + i * 9, 160 - i * 6);
      c.quadraticCurveTo(157 + i * 10, 162 - i * 5, 146 + i * 9, 158 - i * 5);
      c.fill();
    }

    // forelimb tucked under the snout with claws showing
    c.strokeStyle = '#33454d';
    c.lineWidth = 19;
    c.beginPath(); c.moveTo(162, 204); c.quadraticCurveTo(128, 224, 100, 234); c.stroke();
    c.strokeStyle = '#d8cba2';
    c.lineWidth = 3.4;
    c.beginPath(); c.moveTo(100, 234); c.lineTo(84, 238); c.stroke();
    c.beginPath(); c.moveTo(106, 238); c.lineTo(92, 242); c.stroke();

    // feather scallops along the spine
    c.strokeStyle = 'rgba(140,172,186,0.26)';
    c.lineWidth = 2.2;
    for (let i = 0; i < 9; i++) {
      const x = 104 + i * 26;
      const y = 128 + Math.sin(i * 0.62) * 10;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 12, y + 8, x + 26, y + 18);
      c.stroke();
    }
    c.strokeStyle = 'rgba(14,22,26,0.5)';
    c.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
      const x = 100 + (i * 61) % 230;
      const y = 136 + (i * 43) % 80;
      c.beginPath(); c.arc(x, y, 4 + (i % 3) * 2, 0.4, 2.4); c.stroke();
    }

    // moon rim tracing the back
    c.strokeStyle = 'rgba(170,208,236,0.46)';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(94, 226);
    c.quadraticCurveTo(70, 176, 98, 146);
    c.quadraticCurveTo(128, 116, 196, 110);
    c.quadraticCurveTo(268, 106, 322, 138);
    c.quadraticCurveTo(358, 162, 358, 192);
    c.stroke();

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(30, 60, 370, 240);
    rim.addColorStop(0, 'rgba(150,196,240,0.1)');
    rim.addColorStop(0.55, 'rgba(150,196,240,0)');
    rim.addColorStop(1, 'rgba(255,190,120,0.04)');
    c.fillStyle = rim; c.fillRect(0, 0, 400, 240);
    c.globalCompositeOperation = 'source-over';
    grain(c, 400, 240, 0.035, 97 + rand() * 12);
  });

  canvasTex(scene, 'sl-hunter-awake', 360, 270, (c) => {
    const rand = rng(337);
    // raked-back tail
    c.strokeStyle = '#3d4c54';
    c.lineWidth = 24;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(272, 176);
    c.quadraticCurveTo(322, 158, 344, 100);
    c.stroke();

    // legs braced
    c.strokeStyle = '#3f4f59';
    c.lineWidth = 20;
    [[208, 190, 196, 236, 184, 258], [252, 196, 272, 238, 288, 262]].forEach(([hx, hy, kx, ky, fx, fy]) => {
      c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(kx, ky - 12, kx, ky); c.lineTo(fx, fy); c.stroke();
      c.strokeStyle = '#d8cba2';
      c.lineWidth = 5;
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + 18, fy + 2); c.stroke();
      c.strokeStyle = '#3f4f59';
      c.lineWidth = 20;
    });

    // reared body
    const body = c.createLinearGradient(70, 60, 290, 210);
    body.addColorStop(0, '#5b6d78');
    body.addColorStop(0.5, '#3c4b55');
    body.addColorStop(1, '#222d33');
    c.fillStyle = body;
    c.beginPath(); c.ellipse(210, 160, 86, 58, -0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(196,200,172,0.14)';
    c.beginPath(); c.ellipse(200, 190, 56, 20, -0.4, 0, Math.PI * 2); c.fill();

    // neck and open head, reaching down at the lane
    c.strokeStyle = '#4d5f6a';
    c.lineWidth = 36;
    c.beginPath(); c.moveTo(150, 110); c.quadraticCurveTo(104, 92, 72, 104); c.stroke();
    c.fillStyle = '#5b6d78';
    c.beginPath(); c.ellipse(58, 106, 36, 24, 0.1, 0, Math.PI * 2); c.fill();
    // jaws
    c.fillStyle = '#2b363d';
    c.beginPath();
    c.moveTo(44, 94); c.quadraticCurveTo(2, 76, 2, 96);
    c.quadraticCurveTo(24, 104, 44, 104); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(44, 112); c.quadraticCurveTo(6, 122, 12, 140);
    c.quadraticCurveTo(32, 130, 50, 120); c.closePath(); c.fill();
    c.strokeStyle = '#f2e6bc';
    c.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      c.beginPath(); c.moveTo(10 + i * 6, 99); c.lineTo(12 + i * 6, 108); c.stroke();
    }
    // glowing eye
    c.fillStyle = '#ffd76a';
    c.beginPath(); c.arc(64, 98, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2a1a0c';
    c.beginPath(); c.arc(65.4, 98, 2.6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,190,90,0.5)';
    c.lineWidth = 2;
    c.beginPath(); c.arc(64, 98, 11, 0, Math.PI * 2); c.stroke();

    // raised claw
    c.strokeStyle = '#42535d';
    c.lineWidth = 11;
    c.beginPath(); c.moveTo(112, 176); c.quadraticCurveTo(80, 196, 56, 214); c.stroke();
    c.strokeStyle = '#ece0b8';
    c.lineWidth = 4;
    c.beginPath(); c.moveTo(56, 214); c.lineTo(30, 226); c.stroke();
    c.beginPath(); c.moveTo(56, 214); c.lineTo(38, 238); c.stroke();

    c.globalCompositeOperation = 'source-atop';
    const rim = c.createLinearGradient(30, 40, 300, 240);
    rim.addColorStop(0, 'rgba(255,206,140,0.24)');
    rim.addColorStop(0.5, 'rgba(160,204,255,0.06)');
    c.fillStyle = rim; c.fillRect(0, 0, 360, 270);
    c.globalCompositeOperation = 'source-over';
    grain(c, 360, 270, 0.035, 113 + rand() * 10);
  });
}

function woodArt(scene) {
  canvasTex(scene, 'sl-trunk', 320, 760, (c) => {
    const rand = rng(211);
    // trunk silhouette, flaring into roots at the forest floor
    const g = c.createLinearGradient(70, 0, 264, 760);
    g.addColorStop(0, '#263736');
    g.addColorStop(0.42, '#182523');
    g.addColorStop(0.78, '#101a19');
    g.addColorStop(1, '#0a1211');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(36, 760);
    c.quadraticCurveTo(62, 690, 82, 606);
    c.quadraticCurveTo(98, 540, 102, 456);
    c.quadraticCurveTo(108, 320, 116, 190);
    c.quadraticCurveTo(122, 90, 138, 0);
    c.lineTo(200, 0);
    c.quadraticCurveTo(208, 120, 210, 250);
    c.quadraticCurveTo(212, 380, 218, 500);
    c.quadraticCurveTo(226, 610, 254, 690);
    c.quadraticCurveTo(266, 730, 284, 760);
    c.closePath(); c.fill();

    // bark grooves
    c.strokeStyle = 'rgba(7,13,12,0.7)';
    c.lineWidth = 3.4;
    for (let i = 0; i < 13; i++) {
      const x = 112 + (i * 37) % 100;
      c.beginPath();
      c.moveTo(x, 756);
      c.quadraticCurveTo(x + 10, 520 - i * 16, x - 6 + (i % 3) * 8, 80 + i * 22);
      c.stroke();
    }
    // moonlit bark edge and slivers on the light side
    c.strokeStyle = 'rgba(152,190,182,0.16)';
    c.lineWidth = 2.4;
    for (let i = 0; i < 7; i++) {
      const x = 196 + (i % 3) * 4;
      c.beginPath();
      c.moveTo(x, 700 - i * 86);
      c.quadraticCurveTo(x + 5, 560 - i * 70, x + 2, 430 - i * 66);
      c.stroke();
    }
    c.strokeStyle = 'rgba(178,214,206,0.22)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(202, 60);
    c.quadraticCurveTo(210, 300, 214, 520);
    c.quadraticCurveTo(220, 620, 246, 700);
    c.stroke();

    // knots
    [[154, 300, 15, 32], [142, 540, 11, 22]].forEach(([x, y, rx, ry]) => {
      c.fillStyle = '#0d1615';
      c.beginPath(); c.ellipse(x, y, rx, ry, 0.05, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(28,42,38,0.55)';
      c.lineWidth = 2;
      c.beginPath(); c.ellipse(x, y, rx + 5, ry + 6, 0.05, 0, Math.PI * 2); c.stroke();
    });

    // mossy root shoulders
    c.fillStyle = 'rgba(58,92,66,0.75)';
    for (let i = 0; i < 16; i++) {
      const x = 34 + rand() * 250;
      const y = 724 + rand() * 34;
      c.beginPath(); c.ellipse(x, y, 8 + rand() * 14, 4 + rand() * 5, 0, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = 'rgba(120,164,128,0.35)';
    c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = 48 + rand() * 220;
      c.beginPath(); c.moveTo(x, 756); c.quadraticCurveTo(x + 6, 736, x + 18, 722); c.stroke();
    }

    // high branches
    c.strokeStyle = '#13201f';
    c.lineWidth = 17;
    c.beginPath(); c.moveTo(174, 168); c.quadraticCurveTo(92, 118, 20, 94); c.stroke();
    c.lineWidth = 11;
    c.beginPath(); c.moveTo(184, 300); c.quadraticCurveTo(254, 250, 298, 208); c.stroke();
    c.lineWidth = 7;
    c.beginPath(); c.moveTo(154, 88); c.quadraticCurveTo(126, 38, 66, 16); c.stroke();
    grain(c, 320, 760, 0.03, 137 + rand() * 8);
  });

  canvasTex(scene, 'sl-canopy', 560, 320, (c) => {
    const rand = rng(223);
    const g = c.createLinearGradient(0, 0, 0, 320);
    g.addColorStop(0, '#0a1515');
    g.addColorStop(0.55, '#132622');
    g.addColorStop(1, '#1f362e');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(560, 0);
    c.lineTo(560, 118);
    const lobes = [[502, 152, 46], [432, 200, 54], [352, 162, 48], [270, 214, 58], [188, 166, 50], [98, 210, 56], [24, 160, 48]];
    let px = 560, py = 118;
    lobes.forEach(([x, y, r]) => {
      c.quadraticCurveTo((px + x) / 2, py + r * 0.42, x, y);
      px = x; py = y;
    });
    c.quadraticCurveTo(-24, 150, 0, 0);
    c.closePath(); c.fill();

    // leaf fans hanging off the ragged fringe
    const leaf = (bx, by, ang, len, wid, fill) => {
      const tipX = bx + Math.cos(ang) * len;
      const tipY = by + Math.sin(ang) * len;
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const mx = (bx + tipX) / 2, my = (by + tipY) / 2;
      c.fillStyle = fill;
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(mx + nx * wid, my + ny * wid, tipX, tipY);
      c.quadraticCurveTo(mx - nx * wid, my - ny * wid, bx, by);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(136,178,158,0.18)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(mx + nx * wid * 0.5, my + ny * wid * 0.5, tipX, tipY);
      c.stroke();
    };
    const tones = ['#162a24', '#1c342b', '#244034'];
    for (let i = 0; i < 110; i++) {
      const x = rand() * 560;
      const y = 120 + rand() * 96;
      const ang = Math.PI * 0.32 + rand() * Math.PI * 0.36;
      leaf(x, y, ang, 24 + rand() * 44, 6 + rand() * 8, tones[i % 3]);
    }
    // gaps where the night sky shows through the crown
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 14; i++) {
      c.beginPath(); c.arc(16 + rand() * 528, rand() * 74, 5 + rand() * 15, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    grain(c, 560, 320, 0.03, 141);
  });

  canvasTex(scene, 'sl-bush', 300, 200, (c) => {
    const rand = rng(229);
    c.fillStyle = 'rgba(6,12,10,0.45)';
    c.beginPath(); c.ellipse(152, 194, 124, 9, 0, 0, Math.PI * 2); c.fill();

    // solid inner mass so the crown never shows sky through it
    const mass = c.createRadialGradient(136, 116, 8, 152, 124, 132);
    mass.addColorStop(0, '#2b4835');
    mass.addColorStop(0.62, '#1e3628');
    mass.addColorStop(1, '#12211b');
    c.fillStyle = mass;
    [[84, 130, 56], [152, 116, 64], [220, 132, 54]].forEach(([x, y, r]) => {
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    });

    // lanceolate leaves fanned up from three crowns
    const leaf = (bx, by, ang, len, wid, fill) => {
      const tipX = bx + Math.cos(ang) * len;
      const tipY = by + Math.sin(ang) * len;
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      const mx = (bx + tipX) / 2, my = (by + tipY) / 2;
      c.fillStyle = fill;
      c.beginPath();
      c.moveTo(bx, by);
      c.quadraticCurveTo(mx + nx * wid, my + ny * wid, tipX, tipY);
      c.quadraticCurveTo(mx - nx * wid, my - ny * wid, bx, by);
      c.closePath(); c.fill();
    };
    const tones = ['#24412e', '#2e5038', '#3a6044'];
    [[80, 138], [152, 122], [224, 140]].forEach(([cx, cy], k) => {
      for (let i = 0; i < 17; i++) {
        const ang = -Math.PI + 0.24 + (i / 16) * (Math.PI - 0.48) + (rand() - 0.5) * 0.26;
        const len = 38 + rand() * 56 + (i % 3) * 7;
        const wid = 11 + rand() * 10;
        leaf(cx + (rand() - 0.5) * 20, cy + (rand() - 0.5) * 14, ang, len, wid, tones[(i + k) % 3]);
      }
    });
    // moonlit upper edges
    c.strokeStyle = 'rgba(150,196,160,0.24)';
    c.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const x = 34 + rand() * 232;
      const y = 60 + rand() * 54;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 14, x + 17, y - 22); c.stroke();
    }
    for (let i = 0; i < 7; i++) {
      c.fillStyle = 'rgba(210,240,214,' + (0.24 + rand() * 0.3) + ')';
      c.beginPath(); c.arc(40 + rand() * 220, 66 + rand() * 92, 1 + rand() * 1.6, 0, Math.PI * 2); c.fill();
    }
    grain(c, 300, 200, 0.04, 149 + rand() * 10);
  });

  canvasTex(scene, 'sl-fern', 170, 190, (c) => {
    // filled leaflets on six arcing stems
    for (let f = 0; f < 6; f++) {
      const tipX = 18 + f * 27;
      const stemX = 85;
      c.strokeStyle = '#2c4834';
      c.lineWidth = 3.4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(stemX, 190);
      c.quadraticCurveTo(stemX + (tipX - stemX) * 0.3, 110, tipX, 26);
      c.stroke();
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const x = stemX + (tipX - stemX) * t;
        const y = 190 - 164 * t;
        const len = 20 - t * 9;
        const ang = 0.5 + t * 0.3;
        [-1, 1].forEach((side) => {
          c.fillStyle = i % 2 ? '#33553b' : '#29452f';
          c.beginPath();
          c.ellipse(x + side * len * 0.55, y - len * 0.35, len * 0.62, len * 0.26, side * ang, 0, Math.PI * 2);
          c.fill();
        });
      }
    }
  });

  canvasTex(scene, 'sl-grass', 220, 170, (c) => {
    const rand = rng(251);
    for (let i = 0; i < 34; i++) {
      const bx = 110 + (rand() - 0.5) * 120;
      const tipX = bx + (rand() - 0.5) * 190;
      const tipY = 8 + rand() * 74;
      const w = 4 + rand() * 6;
      const midX = (bx + tipX) / 2 + (rand() - 0.5) * 22;
      const midY = (170 + tipY) / 2;
      c.fillStyle = i % 3 === 0 ? '#20362a' : i % 3 === 1 ? '#182c22' : '#26412f';
      c.beginPath();
      c.moveTo(bx - w, 170);
      c.quadraticCurveTo(midX - w * 0.4, midY, tipX, tipY);
      c.quadraticCurveTo(midX + w * 0.4, midY, bx + w, 170);
      c.closePath(); c.fill();
    }
  });

  canvasTex(scene, 'sl-moth', 22, 16, (c) => {
    c.fillStyle = 'rgba(226,246,220,0.9)';
    c.beginPath(); c.ellipse(7, 8, 6, 4, -0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(15, 8, 6, 4, 0.4, 0, Math.PI * 2); c.fill();
  });
}

function groundArt(scene, M) {
  canvasTex(scene, 'sl-floor', 960, 150, (c) => {
    const rand = rng(241);
    for (let i = 0; i < 120; i++) {
      const x = rand() * 960;
      const y = 26 + rand() * 118;
      const w = 3 + rand() * 7;
      const a = 0.06 + rand() * 0.14;
      c.fillStyle = i % 3 === 0 ? `rgba(120,96,58,${a})` : `rgba(22,36,30,${a + 0.12})`;
      c.beginPath(); c.ellipse(x, y, w, w * (0.28 + rand() * 0.2), rand() * Math.PI, 0, Math.PI * 2); c.fill();
    }
    c.strokeStyle = 'rgba(12,20,18,0.42)';
    c.lineWidth = 2;
    for (let i = 0; i < 22; i++) {
      const x = rand() * 940;
      const y = 40 + rand() * 100;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 5, x + 18 + rand() * 16, y - 2); c.stroke();
    }
    for (let i = 0; i < 18; i++) {
      c.fillStyle = 'rgba(96,120,110,' + (0.1 + rand() * 0.18) + ')';
      c.beginPath(); c.arc(rand() * 960, 60 + rand() * 86, 1.4 + rand() * 2.6, 0, Math.PI * 2); c.fill();
    }
  });

  if (M.portrait) {
    canvasTex(scene, 'sl-topshade', W, 620, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 620);
      g.addColorStop(0, 'rgba(3,9,11,0.96)');
      g.addColorStop(0.5, 'rgba(3,9,11,0.72)');
      g.addColorStop(0.82, 'rgba(3,9,11,0.32)');
      g.addColorStop(1, 'rgba(3,9,11,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, 620);
    });
  }

  canvasTex(scene, 'sl-vignette', W, M.H, (c) => {
    const cy = M.Y(292);
    const g = c.createRadialGradient(W / 2, cy, M.portrait ? 300 : 150, W / 2, cy, M.portrait ? 1000 : 470);
    g.addColorStop(0, 'rgba(2,8,10,0)');
    g.addColorStop(0.62, 'rgba(2,8,10,0.22)');
    g.addColorStop(1, 'rgba(2,8,10,0.66)');
    c.fillStyle = g; c.fillRect(0, 0, W, M.H);
  });
}

function create(scene) {
  const M = scene.M;
  const K = scene.k;
  heroArt(scene);
  hunterArt(scene);
  woodArt(scene);
  groundArt(scene, M);
  const r = rng(8123);

  scene.add.image(0, M.Y(430), 'sl-floor').setOrigin(0).setDepth(6.3);
  scene.add.image(0, 0, 'sl-vignette').setOrigin(0).setDepth(29);
  if (M.portrait) scene.add.image(0, 0, 'sl-topshade').setOrigin(0).setDepth(30);

  const state = {
    x: 320, vx: 0, hearts: 3, crouch: false, noise: 0.06, hidden: false,
    over: false, iFrames: 0, score: 0, scroll: 0, t: 0
  };
  const START_X = 320;

  // camera offset is pure scenery; all gameplay lives in world x
  const scroll = { v: 0 };

  const hero = scene.add.image(320, M.Y(GROUND), 'sl-hero-a').setOrigin(0.5, 1).setDepth(20).setScale(0.92 * K);
  const eggGlow = scene.add.image(320 - 22 * K, M.Y(GROUND - 78), 'arc-glow').setDepth(19.5)
    .setScale(0.62 * K).setAlpha(0.3).setTint(0xffc06a).setBlendMode(Phaser.BlendModes.ADD);

  // moon shafts through the canopy
  const shafts = [];
  for (let i = 0; i < 4; i++) {
    const sh = scene.add.rectangle(150 + i * 240, M.Y(-20), 70 + r() * 40, M.Y(GROUND - 6), 0xa8ccff, 0.05)
      .setOrigin(0.5, 0).setDepth(7).setAngle(-9).setBlendMode(Phaser.BlendModes.ADD);
    sh._ph = r() * 6;
    sh._wx = 150 + i * 240;
    shafts.push(sh);
  }

  let genHunter = 980;
  let genBush = 420;
  let genTree = -200;
  let genFern = 60;
  let genFg = 160;
  const hunters = [];
  const bushes = [];
  const trees = [];
  const ferns = [];
  const foreground = [];

  const marks = scene.add.graphics().setDepth(26);
  const veil = scene.add.rectangle(0, 0, W, M.H, 0x7fb4ff, 0).setOrigin(0).setDepth(38);

  const sleepPuffs = scene.add.particles(0, 0, 'arc-dot', {
    speed: { min: 4, max: 20 }, lifespan: 2200, scale: { start: 0.22, end: 0 },
    alpha: { start: 0.28, end: 0 }, tint: 0xbfe0ff, frequency: 520, quantity: 1
  }).setDepth(17);

  const fireflies = scene.add.particles(0, 0, 'arc-dot', {
    x: { min: 0, max: W }, y: { min: M.Y(180), max: M.Y(GROUND) },
    speedX: { min: -18, max: 18 }, speedY: { min: -22, max: -4 },
    lifespan: { min: 1800, max: 3600 }, scale: { start: 0.42, end: 0 },
    alpha: { start: 0.75, end: 0 }, tint: 0xd8ffb0, frequency: 240, quantity: 1,
    blendMode: 'ADD'
  }).setDepth(15);

  const HUNTER_SCALE = 0.8;

  function makeHunter(wx) {
    const img = scene.add.image(0, M.Y(GROUND + 4), 'sl-hunter-sleep').setOrigin(0.5, 1)
      .setScale(HUNTER_SCALE * K).setDepth(19.4);
    const glow = scene.add.image(0, M.Y(GROUND - 40), 'arc-glow').setDepth(19.45)
      .setScale(0.42 * K).setAlpha(0).setTint(0xffc46a).setBlendMode(Phaser.BlendModes.ADD);
    hunters.push({ img, glow, wx, alert: 0, awake: 0, cooldown: 0, swiped: false, phase: r() * 6, headPuff: 0 });
  }

  function makeBush(wx) {
    const img = scene.add.image(0, M.Y(GROUND + 6), 'sl-bush').setOrigin(0.5, 1)
      .setScale((0.62 + r() * 0.22) * K).setDepth(19);
    bushes.push({ img, wx, r: 92 * (0.8 + r() * 0.3) });
  }

  function makeTree(wx) {
    const depth = r() < 0.5 ? 5 : 8.5;
    const s = (depth === 5 ? 0.75 : 1.02) * (0.85 + r() * 0.3) * K;
    const img = scene.add.image(0, M.Y(GROUND + 20), 'sl-trunk').setOrigin(0.5, 1)
      .setScale(s, M.portrait ? s * 1.9 : s).setDepth(depth)
      .setAlpha(depth === 5 ? 0.45 : 0.96).setTint(depth === 5 ? 0x6f8a8a : 0xffffff);
    const leaf = scene.add.image(0, M.portrait ? M.Y(70 + r() * 80) : M.Y(-10 + r() * 40), 'sl-canopy').setOrigin(0.5, 0)
      .setScale(((M.portrait ? 0.42 : 0.5) + r() * 0.22) * K).setDepth(depth + 0.1)
      .setAlpha(depth === 5 ? 0.58 : 0.95);
    trees.push({ img, leaf, wx, leafX: (r() - 0.5) * 40 });
  }

  function makeFern(wx) {
    const img = scene.add.image(0, M.Y(GROUND + 8), 'sl-fern').setOrigin(0.5, 1)
      .setScale((0.5 + r() * 0.3) * K).setDepth(15.5).setAlpha(0.8).setTint(0x8fb49a);
    ferns.push({ img, wx });
  }

  function makeForeground(wx) {
    const img = scene.add.image(0, M.Y(GROUND + 64), 'sl-grass').setOrigin(0.5, 1)
      .setScale((0.55 + r() * 0.35) * K).setDepth(24).setAlpha(0.96);
    foreground.push({ img, wx, drift: 0 });
  }

  function fastForward() {
    genHunter = Math.max(genHunter, state.x + 900);
    genBush = Math.max(genBush, state.x + 500);
    genTree = Math.max(genTree, state.x + 600);
    genFern = Math.max(genFern, state.x + 500);
    genFg = Math.max(genFg, state.x * 1.3 + 600);
  }

  function ensureWorld() {
    while (genHunter < state.x + 1500) {
      makeHunter(genHunter);
      genHunter += 400 + r() * 190;
    }
    while (genBush < state.x + 1700) {
      makeBush(genBush);
      genBush += 190 + r() * 150;
    }
    while (genTree < state.x + 1300) {
      makeTree(genTree);
      genTree += 150 + r() * 130;
    }
    while (genFern < state.x + 1500) {
      makeFern(genFern);
      genFern += 90 + r() * 110;
    }
    while (genFg < state.x * 1.3 + 1500) {
      makeForeground(genFg);
      genFg += 420 + r() * 260;
    }
  }
  ensureWorld();

  function cull() {
    const left = scroll.v - 500;
    for (let i = hunters.length - 1; i >= 0; i--) {
      if (hunters[i].wx < left) { hunters[i].img.destroy(); hunters[i].glow.destroy(); hunters.splice(i, 1); }
    }
    for (let i = bushes.length - 1; i >= 0; i--) {
      if (bushes[i].wx < left) { bushes[i].img.destroy(); bushes.splice(i, 1); }
    }
    for (let i = trees.length - 1; i >= 0; i--) {
      if (trees[i].wx < left) { trees[i].img.destroy(); trees[i].leaf.destroy(); trees.splice(i, 1); }
    }
    for (let i = ferns.length - 1; i >= 0; i--) {
      if (ferns[i].wx < left) { ferns[i].img.destroy(); ferns.splice(i, 1); }
    }
    for (let i = foreground.length - 1; i >= 0; i--) {
      if (foreground[i].wx < (scroll.v - 100) * 1.3) { foreground[i].img.destroy(); foreground.splice(i, 1); }
    }
  }

  function hurt(h) {
    if (state.iFrames > 0 || state.over) return;
    state.hearts--;
    state.iFrames = 1.7;
    state.x = Math.max(40, state.x - 120);
    scene.sfx('hurt');
    scene.shake(300, 0.016);
    veil.setAlpha(0.32);
    scene.tweens.add({ targets: veil, alpha: 0, duration: 420 });
    scene.popText(320, M.Y(GROUND - 150), 'caught', '#ffb8a4');
    h.awake = 0;
    h.alert = 0;
    h.cooldown = 3;
    if (state.hearts <= 0) endRun(false);
    else scene.notice('The hunter had you. Keep to the ferns.', 1900);
  }

  function endRun(win) {
    if (state.over) return;
    state.over = true;
    scene.finish(win, {
      score: Math.round(state.score),
      note: win ? 'the egg reached the far nest warm' : `the egg stopped ${Math.max(0, GOAL_M - Math.round(state.score))} m short`
    });
  }

  let pointerDown = false;
  scene.input.on('pointermove', (ptr) => { state.aimX = clamp(ptr.x, 40, W - 40); });
  scene.input.on('pointerdown', (ptr) => { pointerDown = true; state.aimX = clamp(ptr.x, 40, W - 40); });
  scene.input.on('pointerup', () => { pointerDown = false; });
  const keys = scene.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' });
  let keyCrouch = false;
  scene.input.keyboard.on('keydown-SPACE', () => { keyCrouch = true; });
  scene.input.keyboard.on('keyup-SPACE', () => { keyCrouch = false; });
  scene.input.keyboard.on('keydown-SHIFT', () => { keyCrouch = true; });
  scene.input.keyboard.on('keyup-SHIFT', () => { keyCrouch = false; });

  scene.hud({ score: 0, progress: 0, hearts: 3, extra: 'hold to muffle' });
  scene.notice('Keep to the dark. Hold to muffle your steps.', 2800);
  state.aimX = state.x;

  function update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (state.over) return;
    state.t += dt;
    state.iFrames = Math.max(0, state.iFrames - dt);

    // movement
    const crouchWant = pointerDown || keyCrouch;
    state.crouch = crouchWant;
    const speed = crouchWant ? 116 : 258;
    let want = 0;
    if (keys.left.isDown || keys.a.isDown) want -= 1;
    if (keys.right.isDown || keys.d.isDown) want += 1;
    if (!want) {
      const dx = state.aimX - (state.x - scroll.v);
      want = Math.abs(dx) > 12 ? clamp(dx * 0.02, -1, 1) : 0;
    }
    state.vx = approach(state.vx, want * speed, dt * 900);
    state.x = Math.max(40, state.x + state.vx * dt);
    if (state.vx > 2) state.x = Math.max(state.x, 40);

    // hidden inside good cover
    let inBush = false;
    bushes.forEach((b) => {
      if (Math.abs(b.wx - state.x) < b.r) inBush = true;
      b.img.setDepth(Math.abs(b.wx - state.x) < b.r ? 21.5 : 19);
    });
    state.hidden = crouchWant && inBush;

    // noise
    const moving = Math.abs(state.vx) > 14;
    const targetNoise = state.hidden ? 0.02 : crouchWant ? 0.14 : moving ? 0.6 : 0.05;
    state.noise = lerp(state.noise, targetNoise, Math.min(1, dt * 5));

    // distance + camera
    state.score = Math.max(0, (state.x - START_X) / PX_PER_M);
    scroll.v = approach(scroll.v, Math.max(0, state.x - 320), 620 * dt);
    scroll.v = Math.max(0, Math.min(scroll.v, Math.max(0, state.x - 40)));

    // hero
    const onScreen = state.x - scroll.v;
    hero.x = onScreen;
    hero.y = M.Y(GROUND) + Math.sin(time / 190) * 1.2;
    hero.setTexture(crouchWant ? 'sl-hero-crouch' : (moving ? (Math.floor(time / 140) % 2 ? 'sl-hero-b' : 'sl-hero-a') : 'sl-hero-a'));
    hero.setFlipX(false);
    hero.setScale((0.9 + (crouchWant ? 0 : moving ? 0.02 : 0)) * K);
    hero.setAlpha(state.iFrames > 0 && Math.floor(time / 80) % 2 ? 0.4 : 1);
    eggGlow.x = onScreen - 22 * K;
    eggGlow.y = M.Y(GROUND - (crouchWant ? 56 : 78));
    eggGlow.setAlpha(0.24 + Math.sin(time / 420) * 0.05 + (state.hidden ? 0.04 : 0));
    eggGlow.setScale((0.56 + Math.sin(time / 520) * 0.03) * K);

    // scenery follows the camera
    trees.forEach((t) => {
      const x = t.wx - scroll.v;
      t.img.x = x;
      t.img.setVisible(x > -200 && x < W + 200);
      t.leaf.x = x + t.leafX;
      t.leaf.setVisible(x > -300 && x < W + 300);
    });
    ferns.forEach((f) => {
      f.img.x = f.wx - scroll.v;
      f.img.setVisible(f.img.x > -100 && f.img.x < W + 100);
    });
    foreground.forEach((f) => {
      f.img.x = f.wx - scroll.v * 1.3;
      f.img.setVisible(f.img.x > -220 && f.img.x < W + 220);
    });
    bushes.forEach((b) => {
      b.img.x = b.wx - scroll.v;
      b.img.setVisible(b.img.x > -160 && b.img.x < W + 160);
    });
    shafts.forEach((sh, i) => {
      sh.x = 150 + i * 240 + Math.sin(time / 900 + sh._ph) * 10;
      sh.alpha = 0.04 + Math.sin(time / 2400 + sh._ph) * 0.016;
    });

    // hunters
    ensureWorld();
    cull();
    marks.clear();
    hunters.forEach((h) => {
      const x = h.wx - scroll.v;
      h.img.x = x;
      h.img.visible = x > -260 && x < W + 260;
      h.phase += dt;
      h.cooldown = Math.max(0, h.cooldown - dt);
      if (!h.img.visible) { h.alert = Math.max(0, h.alert - dt * 0.6); return; }

      const dx = state.x - h.wx;
      const near = Math.abs(dx) < WAKE_R;
      const hearing = state.hidden ? 0.06 : 1;
      if (h.awake <= 0) {
        if (near && h.cooldown <= 0 && state.iFrames <= 0) {
          const prox = clamp(1 - Math.abs(dx) / WAKE_R, 0, 1);
          h.alert += (0.16 + state.noise * 0.92) * prox * hearing * dt * (dx > 0 ? 1.15 : 0.8);
        } else {
          h.alert = Math.max(0, h.alert - dt * 0.3);
        }
        if (h.alert >= 1) {
          h.awake = 2.5;
          h.swiped = false;
          h.alert = 1;
          scene.sfx('bad');
          scene.shake(220, 0.01);
          scene.popText(clamp(x, 90, W - 90), M.Y(GROUND - 230), 'awake', '#ffcf8a');
        }
      } else {
        h.awake -= dt;
        if (!h.swiped && h.awake <= 2.0) {
          h.swiped = true;
          scene.sfx('whoosh');
          scene.burst(clamp(x - 110 * K, 40, W - 40), M.Y(GROUND - 60), 0xffd8a0, 12, { life: 420 });
          if (!state.hidden && state.iFrames <= 0 && Math.abs(state.x - h.wx) < STRIKE_R) hurt(h);
        }
        if (h.awake <= 0) { h.alert = 0; h.cooldown = 3.4; }
      }

      const sleep = h.awake <= 0;
      if (sleep) {
        h.img.setTexture('sl-hunter-sleep');
        h.img.setScale((HUNTER_SCALE + Math.sin(h.phase * 1.6) * 0.006) * K);
        h.img.setFlipX(false);
        h.img.y = M.Y(GROUND + 4);
        // head resting at the front of the curled body
        const hx = x - 92 * HUNTER_SCALE * K;
        const hy = M.Y(GROUND + 4) - 37 * HUNTER_SCALE * K;
        h.glow.x = hx;
        h.glow.y = hy;
        h.glow.setScale(0.32 * K);
        h.glow.setAlpha(h.alert * 0.36);
        if (Math.random() < dt * 0.8) sleepPuffs.emitParticleAt(hx - 14 * K, hy - 8 * K, 1);
        // alert builds as three signal bars over the sleeper's skull
        if (h.alert > 0.02) {
          const bob = Math.sin(time / 240 + h.phase) * 3 * K;
          for (let i = 0; i < 3; i++) {
            const px = hx - 11 * K + i * 11 * K;
            const py = hy - (74 + i * 9) * K + bob;
            const lit = h.alert > (i + 0.4) / 3;
            if (lit) {
              marks.fillStyle(i === 2 ? 0xff9a6a : 0xffcf7a, 0.18);
              marks.fillCircle(px, py, 9 * K);
            }
            marks.fillStyle(0x061011, 0.62);
            marks.fillCircle(px, py, 4.4 * K);
            marks.lineStyle(1.6 * K, 0xffcf7a, lit ? 0.95 : 0.3);
            marks.strokeCircle(px, py, 4.4 * K);
            if (lit) {
              marks.fillStyle(i === 2 ? 0xff9a6a : 0xffd88e, 0.98);
              marks.fillCircle(px, py, 3 * K);
            }
          }
        }
      } else {
        h.img.setTexture('sl-hunter-awake');
        h.img.setScale((HUNTER_SCALE + Math.sin(h.phase * 8) * 0.01) * K);
        h.img.setFlipX(false);
        h.img.y = M.Y(GROUND + 4);
        // warmth at the open eye
        h.glow.x = x - 122 * HUNTER_SCALE * K;
        h.glow.y = M.Y(GROUND + 4) - 164 * HUNTER_SCALE * K;
        h.glow.setScale(0.34 * K);
        h.glow.setAlpha(0.4 + Math.sin(time / 120) * 0.14);
      }
    });

    scene.hud({
      score: Math.round(state.score),
      progress: state.score / GOAL_M,
      hearts: state.hearts,
      extra: state.hidden ? 'hidden in the ferns' : state.crouch ? 'muffled' : state.noise > 0.4 ? 'loud steps' : 'hold to muffle'
    });
    const nearest = hunters.reduce((a, h) => Math.min(a, Math.abs(h.wx - state.x)), 9999);
    const tension = clamp(1 - nearest / 460, 0, 1) * (0.35 + state.noise * 0.65);
    scene.audio.setTension(tension);

    if (state.score >= GOAL_M) endRun(true);
  }

  return {
    update,
    state: () => ({
      dist: Math.round(state.score), hearts: state.hearts, noise: Number(state.noise.toFixed(2)),
      hidden: state.hidden, crouch: state.crouch, over: state.over,
      x: Math.round(state.x), scroll: Math.round(scroll.v),
      hunters: hunters.map((h) => ({ wx: Math.round(h.wx), x: Math.round(h.wx - scroll.v), alert: Number(h.alert.toFixed(2)), awake: h.awake > 0, cooldown: Number(h.cooldown.toFixed(1)) })),
      bushes: bushes.map((b) => ({ wx: Math.round(b.wx), r: Math.round(b.r) }))
    }),
    setDist: (m) => { state.x = START_X + m * PX_PER_M; scroll.v = Math.max(0, state.x - 320); fastForward(); },
    setHearts: (v) => { state.hearts = v; },
    setCrouch: (v) => { keyCrouch = !!v; },
    placeAt: (wx) => { state.x = wx; scroll.v = Math.max(0, wx - 320); fastForward(); },
    wake: (i) => { const h = hunters[i || 0]; if (h) { h.alert = 1; h.awake = 2.5; h.swiped = false; } },
    addHunterAt: (wx) => { makeHunter(wx); },
    addBushAt: (wx) => { makeBush(wx); },
    clearHunters: () => { hunters.forEach((h) => { h.img.destroy(); h.glow.destroy(); }); hunters.length = 0; genHunter = 1e9; }
  };
}

export default { id: 'starlight-stalk', unit: 'distance', stars: STAR, create, update: (scene, t, d) => scene.gameObj.update(t, d) };
