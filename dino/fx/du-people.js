/* Dinosaur Universe — animated people (Daddy Ellis and Mummy Courtney).
 * A paper-doll style rig: the real cartoon face sits on a vector body whose arms, legs and head are
 * animated with CSS. States: idle, walk, run, panic, caught, yawn, tired, sleep, happy, sit, lie, wave.
 *     el.innerHTML = DUFX.personHTML('daddy', { state: 'run', size: .8 });
 *     DUFX.personState(el.querySelector('.du-person'), 'panic', 1500);
 *     DUFX.personHold(person, '☕');    // an item in the right hand (or null to clear)
 */
(function () {
  'use strict';
  const DUFX = window.DUFX = window.DUFX || {};
  const BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/fx\/du-people\.js.*$/, '') : '';
  })();
  const WHO = {
    daddy: { img: BASE + 'chapters/adventures/assets/daddy-head.webp', w: 120, h: 146, top: 0, sweater: '#13607a', sleeve: '#0f4e65', pants: '#3f5d8a', shoe: '#6b4a2b', skin: '#efb88c',
      eyes: [[.307, .478], [.62, .516]], eyeW: .17, mouth: [.4, .735], mouthW: .2, name: 'Daddy Ellis' },
    courtney: { img: BASE + 'chapters/adventures/assets/courtney-head.webp', w: 124, h: 124, top: 18, sweater: '#a9b99a', sleeve: '#97a888', pants: '#6c628f', shoe: '#e8dccb', skin: '#efb48b', round: true,
      eyes: [[.515, .52], [.706, .37]], eyeW: .15, mouth: [.74, .63], mouthW: .17, name: 'Mummy Courtney' },
  };
  DUFX.personWho = WHO;

  DUFX.personHTML = function (who, opts) {
    opts = opts || {};
    const W = WHO[who] || WHO.daddy, k = opts.size || 1, state = opts.state || 'idle';
    const lids = W.eyes.map(([x, y]) => `<i class="p-lid" style="left:${(x - W.eyeW / 2) * 100}%;top:${(y - .05) * 100}%;width:${W.eyeW * 100}%;background:${W.skin}"></i>`).join('');
    return `<div class="du-person" data-who="${who}" data-state="${state}" style="--k:${k};--sweater:${W.sweater};--sleeve:${W.sleeve};--pants:${W.pants};--shoe:${W.shoe};--skin:${W.skin};--d:${(-Math.random() * 3).toFixed(2)}s">
      <div class="p-rig">
        <div class="p-shadow"></div>
        <div class="p-leg p-l"><i class="p-foot"></i></div><div class="p-leg p-r"><i class="p-foot"></i></div>
        <div class="p-arm p-al"><i class="p-hand"></i></div>
        <div class="p-torso"><b class="p-collar"></b></div>
        <div class="p-arm p-ar"><i class="p-hand"></i><span class="p-hold"></span></div>
        <div class="p-head" style="width:${W.w}px;height:${W.h}px;top:${W.top}px">
          <img src="${W.img}" alt="${W.name}" draggable="false" class="${W.round ? 'p-round' : ''}">
          ${lids}
          <i class="p-mouth" style="left:${W.mouth[0] * 100}%;top:${W.mouth[1] * 100}%;width:${W.mouthW * 100}%"></i>
          <i class="p-blush" style="left:${(W.mouth[0] - .2) * 100}%;top:${(W.mouth[1] - .12) * 100}%"></i>
          <span class="p-sweat">💦</span><span class="p-stars">⭐💫✨</span><span class="p-zzz">💤</span>
        </div>
      </div>
    </div>`;
  };
  DUFX.person = function (who, opts) {
    const t = document.createElement('div'); t.innerHTML = DUFX.personHTML(who, opts);
    const el = t.firstElementChild; el.setState = (s, ms) => DUFX.personState(el, s, ms); return el;
  };
  const timers = new WeakMap();
  DUFX.personState = function (el, state, ms) {
    if (!el) return; if (!el.classList.contains('du-person')) el = el.querySelector('.du-person'); if (!el) return;
    clearTimeout(timers.get(el));
    el.setAttribute('data-state', state);
    if (ms) timers.set(el, setTimeout(() => el.setAttribute('data-state', el.getAttribute('data-base') || 'idle'), ms));
  };
  DUFX.personHold = function (el, item) {
    if (!el.classList.contains('du-person')) el = el.querySelector('.du-person');
    const h = el && el.querySelector('.p-hold'); if (!h) return;
    h.textContent = item || ''; el.classList.toggle('holding', !!item);
  };
})();
