// The Dino Meadow game types. Each takes a round context `g` from engine.js (see beginRound).
// Five rounds per play-through; round index drives a gentle difficulty ramp and a change of mechanic.
import {tokens,colours,shuffle} from './catalog.js?v=du-7df8fa9b17a78b51';
import {dinoSVG} from './art.js?v=du-7df8fa9b17a78b51';
import * as E from './engine.js?v=du-7df8fa9b17a78b51';

export const games={};
const withArticle=(name)=>(/^[aeiou]/i.test(name)?'an ':'a ')+name;
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
/* The valley's own things, because each of these is a photograph the universe
 * already has. It used to hold apples, carrots and ladybirds, which have no
 * picture here and so showed the child a cartoon next to a photoreal dinosaur. */
const NAME={'🥚':'egg','🍓':'berry','🌿':'fern','🌰':'seed cone','🐚':'shell','🦋':'butterfly','🍄':'mushroom','🌼':'flower','⭐':'star','🌈':'rainbow','🪨':'stone','🐟':'fish','🌙':'moon','🪶':'feather','☘️':'moss','🐌':'snail'};
const POOL=Object.keys(NAME);
function cards(g,items,{cls='',labels=[],values=[],onPick}){
 const box=el('div','choices '+cls);
 items.forEach((html,i)=>{
  const b=el('button','choice',html);
  if(labels[i])b.setAttribute('aria-label',labels[i]);
  /* Which thing this card really is, kept off its text: fx/du-objects.js swaps an
   * emoji text node for an <img class="du-obj"> as soon as the photograph decodes,
   * so textContent is empty long before a child can tap anything. A game that asks
   * the DOM what a card shows is asking a question the DOM can no longer answer. */
  if(values[i])b.dataset.value=values[i];
  b.onclick=()=>{if(b.classList.contains('gone')||box.classList.contains('locked'))return;onPick(i,b);};
  box.append(b);
 });
 g.play.append(box);
 return box;
}

/* ---------- living fields: things that actually move ----------
 * These rounds used to lay their pictures out in a tidy row, so the only verb a
 * child had was to scan left to right and tap. Here the crowd is walked by
 * g.loop every frame, so finding the right specimen means tracking something
 * that is really going about its business in the grass — and no two rounds ever
 * arrive in the same shape. Nothing counts down and nothing is lost when a
 * thing wanders past: the meadow still keeps its promise of no clocks. */
const ROLLERS = new Set(['🥚', '🍓', '🌰', '🐚', '🪨', '🍄', '🌼', '⭐']);
const FLOATERS = new Set(['🦋', '🌈', '🪶', '🌙', '☘️', '🌿']);
function roamField(g, items, o = {}) {
  const box = el('div', 'roam-field' + (o.cls || ''));
  box.style.setProperty('--rh', (o.height || 250) + 'px');
  g.play.append(box);
  const base = (o.speed ?? (g.easy ? .04 : .058)) + g.round * (o.ramp ?? .007);
  const crowd = items.map((it, i) => {
    const b = el('button', 'roamer', it.html);
    b.style.setProperty('--rs', (it.size || 84) + 'px');
    if (it.value) b.dataset.value = it.value;
    if (it.label) b.setAttribute('aria-label', it.label);
    const p = { b, it, i, x: .08 + Math.random() * .84, y: .12 + Math.random() * .74,
      a: Math.random() * 6.28, v: base * (.78 + Math.random() * .5),
      wob: .5 + Math.random() * .9, ph: Math.random() * 6.28,
      roll: ROLLERS.has(it.value), dist: 0, held: false };
    b.onclick = () => { if (box.classList.contains('still') || b.classList.contains('gone')) return; o.onPick(it, p, b); };
    box.append(b);
    return p;
  });
  let t = Math.random() * 9, w = 0, h = 0, rt = 0;
  g.loop(dt => {
    t += dt; rt += dt;
    if (rt > .4 || !w) { rt = 0; w = box.clientWidth || 520; h = box.clientHeight || 250; }
    if (box.classList.contains('still')) return;
    for (const p of crowd) {
      if (p.b.classList.contains('gone')) continue;
      p.a += Math.sin(t * p.wob + p.ph) * dt * 1.4;
      const v = p.held ? 0 : p.v, dx = Math.cos(p.a) * v * dt, dy = Math.sin(p.a) * v * dt * .55;
      p.x += dx; p.y += dy; p.dist += dx * w;
      if (p.x < .04) { p.x = .04; p.a = Math.PI - p.a; }
      if (p.x > .96) { p.x = .96; p.a = Math.PI - p.a; }
      if (p.y < .05) { p.y = .05; p.a = -p.a; }
      if (p.y > .95) { p.y = .95; p.a = -p.a; }
      const face = Math.cos(p.a) < 0 ? -1 : 1;
      const lift = (p.roll || p.held) ? 0 : Math.sin(t * 2.1 + p.ph) * (FLOATERS.has(p.it.value) ? 9 : 5);
      p.px = p.x * w; p.py = p.y * h + lift;
      /* Written as the separate translate/rotate/scale properties, not one
       * transform string: the cheer in g.right animates `transform`, and a
       * transform keyframe replaces the whole property, which would yank the
       * thing to the corner of the field for 380ms in the middle of praising
       * the child for finding it. */
      p.b.style.translate = `${p.px.toFixed(1)}px ${p.py.toFixed(1)}px`;
      p.b.style.rotate = `${(p.roll ? p.dist * .9 : 0).toFixed(1)}deg`;
      p.b.style.scale = `${p.it.flip === false ? 1 : face}`;
    }
    if (o.tick) o.tick(t, crowd);
  });
  return { box, crowd,
    still() { box.classList.add('still'); },
    live() { return crowd.filter(p => !p.b.classList.contains('gone')); } };
}
/* ---------- Matching: same picture, shadow, odd one out, pairs ---------- */
games.match = g => {
  const t = POOL[(g.level * 4 + g.round * 3) % POOL.length];
  const mode = ['same', 'same', 'shadow', 'odd', 'pairs'][g.round];
  const others = g.shuffle(POOL.filter(x => x !== t));
  if (mode === 'same' || mode === 'shadow') {
    const shadow = mode === 'shadow';
    const count = g.easy ? (g.round === 0 ? 3 : 4) : 5;
    g.say(shadow ? `Who is making this shadow? Catch the ${NAME[t]}.` : `Find the ${NAME[t]} — it is moving about in the grass!`);
    const target = el('div', 'target-card' + (shadow ? ' shadow' : ''), `<span>${t}</span><small>${shadow ? 'a shadow' : 'look at me!'}</small>`);
    g.play.append(target);
    const opts = g.shuffle([t, ...others.slice(0, count - 1)]);
    const f = roamField(g, opts.map(v => ({ html: v, value: v, label: NAME[v] })), {
      onPick: (it, p, b) => {
        if (it.value !== t) { b.classList.add('gone'); g.wrong(b, { text: `That is a ${NAME[it.value]}. Look for the ${NAME[t]}!` }); return; }
        f.still();
        f.crowd.forEach(p => { if (p.it.value !== t) p.b.classList.add('fade'); });
        g.right(b);
        g.fly(b, target, t).then(() => { target.classList.remove('shadow'); target.classList.add('lit'); E.burstAt(target, { kind: 'sparkle', n: 16 }); E.sfx('sparkle'); g.win(); });
      } });
    g.onAssist(() => g.hint(f.crowd[opts.indexOf(t)].b));
    return;
  }
  if (mode === 'odd') {
    const odd = others[0];
    g.say('One of these is not like the others. Which one, as they go by?');
    const items = g.shuffle([t, t, t, t, odd]);
    const f = roamField(g, items.map(v => ({ html: v, value: v, label: NAME[v] })), {
      height: 270, onPick: (it, p, b) => {
        if (it.value !== odd) { b.classList.add('gone'); g.wrong(b, { text: 'That one is the same as the others. Look again!' }); return; }
        f.still(); g.right(b, { kind: 'sparkle' }); b.classList.add('lit');
        f.crowd.forEach(p => { if (p.b !== b) p.b.classList.add('fade'); });
        g.win();
      } });
    g.onAssist(() => g.hint(f.crowd[items.indexOf(odd)].b));
    return;
  }
  // pairs: the whole deck is loose in the meadow — tap two of the same kind
  const kinds = g.shuffle(POOL).slice(0, g.easy ? 3 : 4);
  const deck = g.shuffle([...kinds, ...kinds]);
  let first = null, left = kinds.length;
  g.say('Tap two of the same kind. Hold one still and find its partner!');
  const f = roamField(g, deck.map(v => ({ html: v, value: v, label: NAME[v] })), {
    height: 300, speed: g.easy ? .05 : .072, onPick: (it, p, b) => {
      if (first === p) { p.held = false; b.classList.remove('selected'); first = null; return; }
      if (!first) { first = p; p.held = true; b.classList.add('selected'); E.sfx('tap'); return; }
      const a = first; first = null; a.held = false; a.b.classList.remove('selected');
      if (a.it.value === it.value) {
        g.right(b, { kind: 'sparkle', n: 12 }); E.burstAt(a.b, { kind: 'sparkle', n: 10 });
        [a.b, b].forEach(x => x.classList.add('lit'));
        g.later(() => { [a.b, b].forEach(x => x.classList.add('gone')); if (--left === 0) g.win(); }, 520);
      } else g.wrong(b, { text: 'Those are different. Try two more!' });
    } });
  g.onAssist(() => { const l = f.live(); const m = l.find((c, i) => l.some((d, j) => j !== i && d.it.value === c.it.value)); if (m) g.hint(m.b); });
};



/* ---------- Counting: tap to count, give the right number, which pile is more ---------- */
const WORDS=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const COUNT_ITEMS=['🥚','🍓','🌿','🐚','⭐'];
const PLURAL={'🥚':'eggs','🍓':'berries','🌿':'ferns','🐚':'shells','⭐':'stars'};
function numberCards(g,answer,onRight,note='How many in all?'){
 g.say(note);
 const opts=g.shuffle([answer,...g.shuffle([answer-2,answer-1,answer+1,answer+2].filter(n=>n>=1)).slice(0,2)]);
 const box=cards(g,opts.map(n=>`<b class="num">${n}</b><span class="dots">${'●'.repeat(Math.min(n,12))}</span>`),{cls:'numbers',labels:opts.map(String),onPick:(i,b)=>{
  if(opts[i]!==answer){b.classList.add('gone');g.wrong(b,{text:'Have another count. You can do it!'});return;}
  box.classList.add('locked');g.speak(WORDS[answer]||String(answer));g.right(b);onRight(b);
 }});
 g.onAssist(()=>g.hint(box.children[opts.indexOf(answer)]));
 return box;
}
games.count=g=>{
 const item=COUNT_ITEMS[g.level%5];
 const top=g.easy?[2,3,4,5,6][g.round]:[3,5,7,8,10][g.round];
 const mode=['tap','more','give','tap','give'][g.round];
 if(mode==='tap'){
  g.say(`Count the ${PLURAL[item]}. Tap each one!`);
  const field=el('div','count-field');g.play.append(field);
  let counted=0;
  for(let i=0;i<top;i++){
   const b=el('button','count-item',item);
   b.style.cssText=`--r:${Math.round(Math.random()*30-15)}deg;--d:${i*.12}s`;b.setAttribute('aria-label',`${item} ${i+1}`);
   b.onclick=()=>{
    if(b.classList.contains('counted'))return;
    b.classList.add('counted');counted++;b.insertAdjacentHTML('beforeend',`<i>${counted}</i>`);
    E.step(counted-1,.2);g.speak(WORDS[counted]);E.burstAt(b,{kind:'sparkle',n:6});
    if(counted===top)g.later(()=>{field.classList.add('done');numberCards(g,top,()=>g.win());},700);
   };
   field.append(b);
  }
  g.onAssist(()=>g.hint([...field.children].find(c=>!c.classList.contains('counted'))));
  return;
 }
 if(mode==='more'){
  const fewer=g.level%2===1,a=Math.max(1,top-1-(g.round%2)),b=a+1+(g.level%2);
  const mine=g.shuffle([a,b]);
  g.say(`Which pile has ${fewer?'fewer':'more'} ${PLURAL[item]}?`);
  const row=el('div','piles');g.play.append(row);
  const want=fewer?Math.min(a,b):Math.max(a,b);
  mine.forEach(k=>{
   const p=el('button','pile',`<span class="pile-items">${item.repeat(k)}</span><b>${k}</b>`);p.setAttribute('aria-label',`${k} ${PLURAL[item]}`);
   p.onclick=()=>{
    if(k!==want){g.wrong(p,{text:`Count them. Which has ${fewer?'fewer':'more'}?`});return;}
    row.classList.add('locked');g.right(p);p.classList.add('lit');
    row.querySelectorAll('b').forEach(x=>x.classList.add('show'));
    g.win();
   };
   row.append(p);
  });
  g.onAssist(()=>g.hint([...row.children].find((c,i)=>mine[i]===want)));
  return;
 }
 // give: put exactly N into the nest
 const N=Math.max(2,top);
 g.say(`Please give the dinosaur ${N} ${PLURAL[item]}.`);
 const wrap=el('div','give-top');
 const nest=el('div','nest',`<div class="ask"><b>${N}</b><span>${WORDS[N]}</span></div><div class="nest-dino">${dinoSVG(g.level)}</div><div class="nest-bowl"><div class="nest-items"></div><span class="nest-count">0 / ${N}</span></div>`);
 wrap.append(nest);g.play.append(wrap);
 const bowl=nest.querySelector('.nest-items'),countEl=nest.querySelector('.nest-count');
 const tray=el('div','tray');g.play.append(tray);
 let given=0;
 for(let i=0;i<N+3;i++){
  const b=el('button','tray-item',item);b.setAttribute('aria-label',`Give one ${item}`);
  b.onclick=()=>{
   if(b.classList.contains('gone')||given>=N)return;
   given++;b.classList.add('gone');
   g.fly(b,bowl,item).then(()=>{
    const s=el('span','nest-item',item);bowl.append(s);E.step(given-1,.2);g.speak(WORDS[given]);
    countEl.textContent=`${given} / ${N}`;E.animate(countEl,[{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:260});
    if(given===N){g.right(nest,{n:14});nest.classList.add('happy');g.win();}
   });
  };
  tray.append(b);
 }
 g.onAssist(()=>g.hint([...tray.children].find(c=>!c.classList.contains('gone'))));
};

/* ---------- Colour hunt: match, paint the dino, pop balloons, mix, build a rainbow ---------- */
const potHTML=(c,label=true)=>`<span class="pot" style="--c:${c[1]}"></span>${label?`<small>${c[0]}</small>`:''}`;
const BASIC=colours.slice(0,8);
const MIXES=[[0,2,1,'orange'],[4,2,3,'green'],[0,4,5,'purple'],[0,8,6,'pink']];
games.colours=g=>{
 const mode=['match','paint','balloons','mix','rainbow'][g.round];
 const target=BASIC[(g.level*2+g.round*3)%BASIC.length];
 const lower=target[0].toLowerCase();
 if(mode==='match'){
  g.say(`Find ${lower}. Which paint is the same colour?`);
  const tc=el('div','target-card',`<span class="pot big" style="--c:${target[1]}"></span><small>${target[0]}</small>`);g.play.append(tc);
  const opts=g.shuffle([target,...g.shuffle(BASIC.filter(c=>c!==target)).slice(0,g.easy?2:3)]);
  const box=cards(g,opts.map(c=>potHTML(c,false)),{labels:opts.map(c=>c[0]),onPick:(i,b)=>{
   if(opts[i]!==target){b.classList.add('gone');g.wrong(b,{text:`That one is ${opts[i][0].toLowerCase()}. Look for ${lower}!`});return;}
   box.classList.add('locked');g.speak(target[0]);g.right(b);b.classList.add('lit');g.win();
  }});
  g.onAssist(()=>g.hint(box.children[opts.indexOf(target)]));
  return;
 }
 if(mode==='paint'){
  g.say(`Paint the dinosaur ${lower}.`);
  const dino=el('div','paint-dino',dinoSVG(g.level,'#e9eef0'));g.play.append(dino);
  const opts=g.shuffle([target,...g.shuffle(BASIC.filter(c=>c!==target)).slice(0,g.easy?2:4)]);
  const box=cards(g,opts.map(c=>potHTML(c,false)),{cls:'pots',labels:opts.map(c=>c[0]),onPick:(i,b)=>{
   const c=opts[i];
   dino.innerHTML=dinoSVG(g.level,c[1]);E.animate(dino,[{transform:'scale(.9)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{duration:400});
   E.sfx('splash');E.burstAt(dino,{kind:'drops',n:12,color:c[1]});
   if(c!==target){g.wrong(b,{text:`Now the dinosaur is ${c[0].toLowerCase()}! Can you make it ${lower}?`,speech:`That makes ${c[0].toLowerCase()}. Can you make ${lower}?`});return;}
   box.classList.add('locked');g.right(b,{kind:'sparkle'});dino.classList.add('lit');g.win();
  }});
  g.onAssist(()=>g.hint(box.children[opts.indexOf(target)]));
  return;
 }
 if(mode==='balloons'){
  const want=g.easy?3:4;
  const others=g.shuffle(BASIC.filter(c=>c!==target)).slice(0,2);
  const list=g.shuffle([...Array(want).fill(target),...Array(g.easy?3:5).fill(0).map((_,i)=>others[i%2])]);
  g.say(`Pop all the ${lower} balloons!`);
  const field=el('div','balloons');g.play.append(field);
  const bar=el('div','want',`<span id="left">${want} to find</span>`);g.play.append(bar);
  let left=want;
  list.forEach((c,i)=>{
   const b=el('button','balloon',`<svg viewBox="0 0 60 92" aria-hidden="true"><ellipse cx="30" cy="32" rx="26" ry="30" fill="${c[1]}" stroke="#285357" stroke-width="3"/><path d="M30 62l-6 9h12z" fill="${c[1]}" stroke="#285357" stroke-width="3" stroke-linejoin="round"/><path d="M30 71q-9 9 0 20" stroke="#285357" stroke-width="2" fill="none"/><ellipse cx="19" cy="20" rx="6" ry="9" fill="#fff" opacity=".5"/></svg>`);
   b.style.cssText=`--d:${(i*.37).toFixed(2)}s;--s:${(2.6+i%3*.5).toFixed(1)}s`;b.setAttribute('aria-label',`${c[0]} balloon`);
   b.onclick=()=>{
    if(b.classList.contains('popped'))return;
    if(c!==target){g.wrong(b,{text:`That is a ${c[0].toLowerCase()} balloon. We want ${lower}!`});return;}
    b.classList.add('popped');E.sfx('pop');g.right(b,{kind:'confetti',n:12});left--;
    bar.querySelector('#left').textContent=left?`${left} to find`:'All found!';
    if(left===0)g.win();
   };
   field.append(b);
  });
  g.onAssist(()=>g.hint([...field.children].find((b,i)=>list[i]===target&&!b.classList.contains('popped'))));
  return;
 }
 if(mode==='mix'){
  const m=MIXES[g.level%4],a=colours[m[0]],b2=colours[m[1]],res=colours[m[2]];
  g.say(`Let's make ${m[3]}! Mix ${a[0].toLowerCase()} and ${b2[0].toLowerCase()}.`);
  const bowl=el('div','mix-bowl',`<div class="mix-paint"></div><span class="mix-q">?</span>`);g.play.append(bowl);
  const extra=g.shuffle(BASIC.filter(c=>c!==a&&c!==b2&&c!==res)).slice(0,g.easy?1:2);
  const opts=g.shuffle([a,b2,...extra]);
  const used=new Set();
  const box=cards(g,opts.map(c=>potHTML(c,true)),{cls:'pots',labels:opts.map(c=>c[0]),onPick:(i,b)=>{
   const c=opts[i];
   if(c!==a&&c!==b2){g.wrong(b,{text:`${c[0]} is not in this mix. Try ${a[0].toLowerCase()} and ${b2[0].toLowerCase()}!`});return;}
   if(used.has(c))return;used.add(c);b.classList.add('lit');E.sfx('splash');
   g.fly(b,bowl,'💧');
   const paint=bowl.querySelector('.mix-paint');paint.style.background=c[1];paint.style.height=used.size===1?'45%':'72%';
   if(used.size===2){
    box.classList.add('locked');
    g.later(()=>{paint.style.background=res[1];bowl.classList.add('stir');bowl.querySelector('.mix-q').textContent='✨';E.sfx('sparkle');g.speak(`${a[0]} and ${b2[0]} make ${m[3]}!`);g.right(bowl,{kind:'sparkle',n:20});g.win({delay:2300});},500);
   }else E.step(0);
  }});
  g.onAssist(()=>{[...box.children].forEach((c,i)=>{if((opts[i]===a||opts[i]===b2)&&!used.has(opts[i]))g.hint(c);});});
  return;
 }
 // rainbow: tap the colours from the top of the sky to the bottom
 const order=[0,1,2,3,4,5].map(i=>colours[i]);
 g.say('Build a rainbow! Start with red.');
 const arcs=el('div','rainbow-build',`<svg viewBox="0 0 400 210" aria-hidden="true">${order.map((c,i)=>`<path class="arc" data-i="${i}" d="M${20+i*14} 200A${180-i*14} ${180-i*14} 0 0 1 ${380-i*14} 200" fill="none" stroke="${c[1]}" stroke-width="13" stroke-linecap="round"/>`).join('')}</svg>`);
 g.play.append(arcs);
 let next=0;
 const opts=g.shuffle(order);
 const box=cards(g,opts.map(c=>potHTML(c,false)),{cls:'pots',labels:opts.map(c=>c[0]),onPick:(i,b)=>{
  const c=opts[i];
  if(c!==order[next]){g.wrong(b,{text:`Not yet! The next colour is ${order[next][0].toLowerCase()}.`,speech:`The next colour is ${order[next][0]}.`});return;}
  b.classList.add('gone');arcs.querySelector(`.arc[data-i="${next}"]`).classList.add('on');
  E.step(next);g.speak(c[0]);g.right(b,{kind:'sparkle',n:8,pitch:next});next++;
  if(next===6){arcs.classList.add('done');E.sfx('sparkle');g.win({delay:2300});}
  else g.say(`Now ${order[next][0].toLowerCase()}.`);
 }});
 g.onAssist(()=>g.hint([...box.children].find((c,i)=>opts[i]===order[next]&&!c.classList.contains('gone'))));
};

/* ---------- Shape picnic: find, post the shapes, shape hunt, build a picture, riddles ---------- */
const SHAPES=['circle','square','triangle','star','heart','diamond','oval'];
const SHAPE_COL={circle:'#f28b82',square:'#6fb7e9',triangle:'#f6ce4d',star:'#ffb44d',heart:'#ee8fb5',diamond:'#a48bd3',oval:'#66b882'};
const SHAPE_PATH={
 circle:'<circle cx="50" cy="50" r="40"/>',
 square:'<rect x="12" y="12" width="76" height="76" rx="8"/>',
 triangle:'<path d="M50 10L92 88H8Z" stroke-linejoin="round"/>',
 star:'<path d="M50 6l12 28 30 3-23 20 7 30-26-16-26 16 7-30L8 37l30-3z" stroke-linejoin="round"/>',
 heart:'<path d="M50 90C8 60 6 30 27 18c12-6 23 0 23 13c0-13 11-19 23-13c21 12 19 42-23 72Z" stroke-linejoin="round"/>',
 diamond:'<path d="M50 6L92 50L50 94L8 50Z" stroke-linejoin="round"/>',
 oval:'<ellipse cx="50" cy="50" rx="44" ry="30"/>'
};
const shapeSVG=(n,col=SHAPE_COL[n],extra='')=>`<svg viewBox="0 0 100 100" class="shape" aria-hidden="true" ${extra}><g fill="${col}" stroke="#285357" stroke-width="4">${SHAPE_PATH[n]}</g></svg>`;
const holeSVG=n=>`<svg viewBox="0 0 100 100" class="shape" aria-hidden="true"><g fill="#00000018" stroke="#285357" stroke-width="3" stroke-dasharray="7 6" opacity=".7">${SHAPE_PATH[n]}</g></svg>`;
const RECIPES=[
 {name:'house',parts:[['square',30,48,42,42,'#6fb7e9'],['triangle',22,18,58,34,'#f28b82'],['circle',72,4,20,20,'#f6ce4d']]},
 {name:'flower',parts:[['square',46,40,8,50,'#66b882'],['diamond',54,56,22,18,'#8fd1a0'],['heart',30,4,40,40,'#ee8fb5']]},
 {name:'night sky',parts:[['circle',62,10,28,28,'#fff3b0'],['star',14,12,26,26,'#ffb44d'],['heart',42,56,24,24,'#ee8fb5'],['diamond',10,56,24,24,'#a48bd3']]},
 {name:'little boat',parts:[['oval',14,60,72,26,'#a47a52'],['triangle',44,14,30,46,'#fff3b0'],['square',24,40,16,18,'#6fb7e9']]},
 {name:'castle',parts:[['square',24,44,52,46,'#cfd8dc'],['triangle',14,16,26,28,'#f28b82'],['triangle',60,16,26,28,'#f28b82'],['circle',42,62,16,16,'#f6ce4d']]}
];
const CLUES=[['triangle','Which shape has three sides?'],['square','Which shape has four equal sides?'],['circle','Which shape is round, with no corners?'],['star','Which shape has five points?'],['heart','Which shape is a love heart?'],['diamond','Which shape looks like a kite?'],['oval','Which shape looks like an egg lying down?']];
games.shapes=g=>{
 const mode=['find','post','hunt','build','clue'][g.round];
 const target=SHAPES[(g.level*2+g.round*3)%SHAPES.length];
 const pickOthers=(n,not)=>g.shuffle(SHAPES.filter(s=>!not.includes(s))).slice(0,n);
 if(mode==='find'){
  g.say(`Find the ${target}.`);
  const opts=g.shuffle([target,...pickOthers(g.easy?2:3,[target])]);
  const box=cards(g,opts.map(s=>shapeSVG(s)),{cls:'shape-choices',labels:opts,onPick:(i,b)=>{
   if(opts[i]!==target){b.classList.add('gone');g.wrong(b,{text:`That is a ${opts[i]}. Look for the ${target}!`});return;}
   box.classList.add('locked');g.speak(target);g.right(b);b.classList.add('lit');g.win();
  }});
  g.onAssist(()=>g.hint(box.children[opts.indexOf(target)]));
  return;
 }
 if(mode==='post'){
  const mine=g.shuffle([target,...pickOthers(2,[target])]);
  g.say('Post each shape into its own hole.');
  const board=el('div','holes');g.play.append(board);
  const holeOrder=g.shuffle(mine);
  holeOrder.forEach(s=>{const h=el('button','hole',holeSVG(s));h.dataset.shape=s;h.setAttribute('aria-label',`${s} hole`);board.append(h);});
  const tray=el('div','tray shapes-tray');g.play.append(tray);
  let sel=null,left=mine.length;
  const choose=b=>{tray.querySelectorAll('.tray-item').forEach(x=>x.classList.remove('selected'));sel=b;if(b){b.classList.add('selected');E.sfx('tap');g.speak(b.dataset.shape);}};
  mine.forEach(s=>{const b=el('button','tray-item',shapeSVG(s));b.dataset.shape=s;b.setAttribute('aria-label',s);b.onclick=()=>choose(sel===b?null:b);tray.append(b);});
  board.querySelectorAll('.hole').forEach(h=>h.onclick=()=>{
   if(h.classList.contains('filled'))return;
   if(!sel){g.note('Tap a shape first, then tap its hole.');g.speak('Tap a shape first.');E.animate(tray,[{transform:'scale(1)'},{transform:'scale(1.05)'},{transform:'scale(1)'}],{duration:300});return;}
   if(sel.dataset.shape!==h.dataset.shape){g.wrong(sel,{text:`The ${sel.dataset.shape} does not fit there. Try another hole!`});return;}
   const piece=sel;sel=null;piece.classList.add('gone');
   h.classList.add('filled');h.innerHTML=shapeSVG(h.dataset.shape);E.animate(h.firstChild,[{transform:'translateY(-60px) scale(1.3)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:400,easing:'cubic-bezier(.3,1.4,.5,1)'});
   E.sfx('thud');g.right(h,{kind:'sparkle'});
   if(--left===0)g.win();
  });
  g.onAssist(()=>{if(sel){g.hint([...board.children].find(h=>h.dataset.shape===sel.dataset.shape&&!h.classList.contains('filled')));}else g.hint([...tray.children].find(c=>!c.classList.contains('gone')));});
  return;
 }
 if(mode==='hunt'){
  const want=g.easy?3:4;
  const others=pickOthers(3,[target]);
  const list=g.shuffle([...Array(want).fill(target),...Array(g.easy?5:7).fill(0).map((_,i)=>others[i%3])]);
  g.say(`Find all the ${target==='star'?'stars':target+'s'}!`);
  const field=el('div','balloons shape-field');g.play.append(field);
  const bar=el('div','want',`<span id="left">${want} to find</span>`);g.play.append(bar);
  let left=want;
  list.forEach((s,i)=>{
   const b=el('button','balloon shape-item',shapeSVG(s));b.style.cssText=`--d:${(i*.31).toFixed(2)}s;--s:${(2.4+i%4*.4).toFixed(1)}s`;b.setAttribute('aria-label',s);
   b.onclick=()=>{
    if(b.classList.contains('popped'))return;
    if(s!==target){g.wrong(b,{text:`That is a ${s}. We want the ${target}s!`});return;}
    b.classList.add('popped');g.right(b,{n:10});left--;
    bar.querySelector('#left').textContent=left?`${left} to find`:'All found!';if(!left)g.win();
   };
   field.append(b);
  });
  g.onAssist(()=>g.hint([...field.children].find((b,i)=>list[i]===target&&!b.classList.contains('popped'))));
  return;
 }
 if(mode==='build'){
  const rec=RECIPES[g.level%RECIPES.length];
  g.say(`Let's build a ${rec.name}!`);
  const pic=el('div','build-pic',`<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="2" y="2" width="96" height="96" rx="10" fill="#ffffffd0" stroke="#285357" stroke-width="2"/><g id="build-layer"></g></svg>`);g.play.append(pic);
  const layer=pic.querySelector('#build-layer');
  let step_=0;
  const opts=el('div','choices shape-choices');g.play.append(opts);
  const render=()=>{
   const [shape]=rec.parts[step_];
   g.say(`Add a ${shape}${step_===0?` to start the ${rec.name}`:''}.`);
   opts.innerHTML='';
   const o=g.shuffle([shape,...pickOthers(2,[shape])]);
   o.forEach(s=>{const b=el('button','choice',shapeSVG(s));b.setAttribute('aria-label',s);b.onclick=()=>{
    if(s!==shape){b.classList.add('gone');g.wrong(b,{text:`That is a ${s}. We need a ${shape}!`});return;}
    const [,x,y,w,h,col]=rec.parts[step_];
    layer.insertAdjacentHTML('beforeend',`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none" class="drop"><g fill="${col}" stroke="#285357" stroke-width="3" vector-effect="non-scaling-stroke">${SHAPE_PATH[s].replace(/<(\w+)/,'<$1 vector-effect="non-scaling-stroke"')}</g></svg>`);
    E.sfx('thud');g.right(b,{kind:'sparkle',n:8});step_++;
    if(step_===rec.parts.length){opts.classList.add('locked');pic.classList.add('done');E.sfx('sparkle');g.speak(`You built a ${rec.name}!`);E.burstAt(pic,{kind:'confetti',n:30});g.win({delay:2300});}
    else render();
   };opts.append(b);});
   g.onAssist(()=>g.hint([...opts.children].find((c,i)=>o[i]===shape)));
  };
  render();
  return;
 }
 const [cs,q]=CLUES[(g.level+g.round*2)%CLUES.length];
 g.say(q);
 const opts=g.shuffle([cs,...pickOthers(g.easy?2:3,[cs])]);
 const box=cards(g,opts.map(s=>shapeSVG(s)),{cls:'shape-choices',labels:opts,onPick:(i,b)=>{
  if(opts[i]!==cs){b.classList.add('gone');g.wrong(b,{text:`Think about the clue: ${q}`});return;}
  box.classList.add('locked');g.speak(`A ${cs}!`);g.right(b);b.classList.add('lit');g.win();
 }});
 g.onAssist(()=>g.hint(box.children[opts.indexOf(cs)]));
};

/* ---------- Big & small: biggest, smallest, longest log, line them up, heavy and light ---------- */
/* Heavy and light, both sides photographed, and never the same picture
 * facing itself across the plank. */
const SEESAW=[['🪨','🪶'],['🦕','🥚'],['🥁','🍃'],['🧺','🌼'],['🏺','💧'],['🌳','🍂']];
games.size=g=>{
 const mode=['big','small','log','line','heavy'][g.round];
 const bigger=g.level%2===0;
 if(mode==='big'||mode==='small'){
  const big=mode==='big';
  g.say(`Tap the ${big?'biggest':'smallest'} dinosaur.`);
  const sets=[[70,115,160],[60,100,150],[80,120,170]];
  const sizes=g.shuffle(sets[(g.level+g.round)%3]);
  const want=big?Math.max(...sizes):Math.min(...sizes);
  const box=el('div','choices size-row');g.play.append(box);
  sizes.forEach(s=>{
   const b=el('button','choice size-dino',dinoSVG((g.level+sizes.indexOf(s))%12,['#76c7a2','#ebac7f','#aa9cda'][sizes.indexOf(s)%3]));
   b.style.width=`${s*1.1+30}px`;b.style.setProperty('--h',`${s*.8}px`);b.setAttribute('aria-label',`${s===60||s===70||s===80?'Small':s>=150?'Big':'Medium'} dinosaur`);
   b.onclick=()=>{
    if(s!==want){g.wrong(b,{text:`That one is ${big?'smaller':'bigger'}. Look again!`});return;}
    box.classList.add('locked');g.right(b);b.classList.add('lit');E.sfx(big?'roar':'chirp');g.win();
   };
   box.append(b);
  });
  g.onAssist(()=>g.hint([...box.children][sizes.indexOf(want)]));
  return;
 }
 if(mode==='log'){
  const longest=g.level%2===0;
  g.say(`Which log is the ${longest?'longest':'shortest'}?`);
  const lens=g.shuffle([90,170,250]);
  const want=longest?250:90;
  const col=el('div','logs');g.play.append(col);
  lens.forEach(w=>{
   const b=el('button','log photo-log',`<span class="log-end"></span>`);b.style.width=`${w}px`;b.setAttribute('aria-label',w===250?'Long log':w===170?'Medium log':'Short log');
   b.onclick=()=>{
    if(w!==want){g.wrong(b,{text:`That one is ${longest?'shorter':'longer'}. Which is the ${longest?'longest':'shortest'}?`});return;}
    col.classList.add('locked');g.right(b);b.classList.add('lit');g.win();
   };
   col.append(b);
  });
  g.onAssist(()=>g.hint([...col.children][lens.indexOf(want)]));
  return;
 }
 if(mode==='line'){
  g.say('Line them up from the smallest to the biggest.');
  const sizes=[70,100,130,160],mix=g.shuffle(sizes);
  const slots=el('div','line-slots');
  sizes.forEach((s,i)=>slots.append(el('div','line-slot',`<b>${i+1}</b>`)));
  const row=el('div','choices size-row');g.play.append(row);g.play.append(slots);
  let next=0;
  mix.forEach((s,i)=>{
   const b=el('button','choice size-dino',dinoSVG((g.level+i)%12,['#76c7a2','#ebac7f','#aa9cda','#79b8d3'][i]));b.style.width=`${s*.8+24}px`;b.dataset.s=s;b.setAttribute('aria-label',`Dinosaur size ${sizes.indexOf(s)+1}`);
   b.onclick=()=>{
    if(s!==sizes[next]){g.wrong(b,{text:next===0?'Start with the smallest one!':'Not that one yet. Who is next biggest?'});return;}
    const slot=slots.children[next];next++;
    b.classList.add('placed');b.style.width=`${Math.min(92,s*.58)}px`;slot.append(b);slot.classList.add('on');
    g.right(b,{n:8,pitch:next-1});
    if(next===sizes.length){slots.classList.add('done');E.sfx('sparkle');g.win();}
   };
   row.append(b);
  });
  g.onAssist(()=>g.hint([...row.children].find(c=>+c.dataset.s===sizes[next])));
  return;
 }
 // heavy and light on a see-saw
 const pair=SEESAW[(g.level*2+g.round)%SEESAW.length];
 const heavyLeft=Math.random()<.5,heavy=pair[0];
 const heavier=g.level%2===0;
 g.say(`Which is ${heavier?'heavier':'lighter'}?`);
 const ss=el('div','seesaw',`<div class="plank"><span class="end l">${heavyLeft?pair[0]:pair[1]}</span><span class="end r">${heavyLeft?pair[1]:pair[0]}</span></div><div class="pivot"></div>`);g.play.append(ss);
 const plank=ss.querySelector('.plank');
 const want=heavier?pair[0]:pair[1];
 const picks=g.shuffle([pair[0],pair[1]]);
 const box=cards(g,picks,{cls:'seesaw-choices',values:picks,onPick:(i,b)=>{
  const picked=b.dataset.value;
  if(picked!==want){g.wrong(b,{text:`Hmm, ${heavier?'that one is lighter':'that one is heavier'}. Which is ${heavier?'heavier':'lighter'}?`});return;}
  box.classList.add('locked');g.right(b);
  const sideLeft=heavyLeft;plank.style.transform=`rotate(${sideLeft?-11:11}deg)`;E.sfx('thud');b.classList.add('lit');
  g.speak(heavier?'Heavy!':'Light!');
  g.win({delay:2200});
 }});
 g.onAssist(()=>g.hint([...box.children].find(c=>c.dataset.value===want)));
};

/* ---------- Patterns: what comes next, two gaps, copy the pattern. Every bead plays a note. ---------- */
const PAT=['🍓','🌿','🌼','🦋','🍄','🥚','⭐','🐚'];
games.pattern=g=>{
 const mode=['next','next','next','gaps','copy'][g.round];
 const pool=g.shuffle(PAT.slice(g.level%3,g.level%3+5));
 const [A,B,C,D]=pool;
 const designs={
  0:[A,B,A,B,A,B],
  1:[A,A,B,A,A,B,A],
  2:[A,B,C,A,B,C,A,B],
  3:[A,B,B,A,B,B,A,B,B],
  4:g.easy?[A,B,A,B]:[A,B,C,A,B,C]
 };
 const full=designs[g.round];
 const kinds=[...new Set(full)];
 const pitch=t=>pool.indexOf(t)*2;
 const string=el('div','bead-string');g.play.append(string);
 const beadEls=full.map((t,i)=>{const b=el('span','bead',t);b.style.setProperty('--i',i);b.onclick=()=>{if(!b.classList.contains('blank')){E.step(pitch(t),.3);E.animate(b,[{transform:'translateY(0)'},{transform:'translateY(-14px)'},{transform:'translateY(0)'}],{duration:300});}};return b;});
 const play=(upTo=full.length)=>{
  beadEls.forEach((b,i)=>{if(i>=upTo||b.classList.contains('blank'))return;g.later(()=>{b.classList.add('ring');E.step(pitch(full[i]),.28);g.later(()=>b.classList.remove('ring'),260);},i*330);});
 };
 if(mode==='copy'){
  g.say('Copy the pattern. Tap the pictures in the same order.');
  beadEls.forEach(b=>string.append(b));
  const mine=el('div','bead-string mine');g.play.append(mine);
  const slots=full.map(()=>{const s=el('span','bead blank','');mine.append(s);return s;});
  let at=0;
  const box=cards(g,kinds.map(t=>t),{cls:'bead-choices',labels:kinds.map(t=>t),onPick:(i,b)=>{
   if(kinds[i]!==full[at]){g.wrong(b,{text:'Look at the top row. What comes next?'});return;}
   slots[at].classList.remove('blank');slots[at].textContent=full[at];E.animate(slots[at],[{transform:'scale(.2)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:360});
   g.right(slots[at],{kind:'sparkle',n:6,pitch:pitch(full[at]),text:false});at++;
   if(at===full.length){box.classList.add('locked');E.sfx('sparkle');g.win();}
  }});
  g.onAssist(()=>g.hint([...box.children].find((c,i)=>kinds[i]===full[at])));
  g.later(()=>play(),600);
  return;
 }
 const gaps=mode==='gaps'?[full.length-2,full.length-1]:[full.length-1];
 g.say(mode==='gaps'?'Two pictures are missing. Fill in the pattern!':'What comes next in the pattern?');
 gaps.forEach(i=>{beadEls[i].classList.add('blank');beadEls[i].textContent='?';});
 beadEls.forEach(b=>string.append(b));
 let gi=0;
 const opts=g.shuffle(kinds.length>=3?kinds:[...kinds,...g.shuffle(pool.filter(t=>!kinds.includes(t))).slice(0,1)]);
 const box=cards(g,opts,{cls:'bead-choices',labels:opts,onPick:(i,b)=>{
  const idx=gaps[gi];
  if(opts[i]!==full[idx]){b.classList.add('gone');g.wrong(b,{text:'Listen to the pattern again. What comes next?'});play(idx);return;}
  const bead=beadEls[idx];bead.classList.remove('blank');bead.textContent=full[idx];E.animate(bead,[{transform:'scale(.3)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],{duration:400});
  g.right(bead,{kind:'sparkle',n:8,pitch:pitch(full[idx])});gi++;
  box.querySelectorAll('.gone').forEach(x=>x.classList.remove('gone'));
  if(gi===gaps.length){box.classList.add('locked');g.later(()=>play(),300);g.win({delay:2800});}
 }});
 g.onAssist(()=>g.hint([...box.children].find((c,i)=>opts[i]===full[gaps[gi]])));
 g.later(()=>play(),700);
};

/* ---------- Sorting: drag (or tap) each thing into its basket ---------- */
/* What grows here against what the valley keeps, and big against small —
 * the old fruit basket and vegetable crate were a supermarket on a dinosaur.
 * Both lists are one picture per thing: two glyphs of one family would be the
 * same photograph twice, and a sorting game teaches nothing from a duplicate. */
const GROWS=['🌿','🍄','☘️','🌱','🌰','🌾'],KEEPS=['🐚','💎','🪨','🦴','🪶','🥌'];
const BIG=['🦕','🌳','🌋','🧺','🐢','🪵'],SMALL=['🐌','🪶','🌰','🥚','🐚','💧'];
const BALLS=[['Red','#e95b65'],['Blue','#55a5d9'],['Yellow','#f6ce4d'],['Green','#66b882']];
function sortSet(g){
 const easy=g.easy,pickN=(arr,n)=>g.shuffle(arr).slice(0,n);
 const per=easy?2:3;
 if(g.round===0){const [A,B]=g.shuffle(POOL).slice(0,2);return {say:`Sort the pictures. Put each one with its friend.`,baskets:[{html:A,label:NAME[A]},{html:B,label:NAME[B]}],items:g.shuffle([...Array(per+1).fill(0).map(()=>({html:A,to:0})),...Array(per+1).fill(0).map(()=>({html:B,to:1}))])};}
 if(g.round===1)return {say:'Things that grow go in one basket. Things the valley keeps go in the other.',baskets:[{html:'🌿',label:'Grows here'},{html:'💎',label:'Treasure'}],items:g.shuffle([...pickN(GROWS,per+1).map(h=>({html:h,to:0})),...pickN(KEEPS,per+1).map(h=>({html:h,to:1}))])};
 if(g.round===2)return {say:'Big things go in one basket. Small things go in the other.',baskets:[{html:'🦕',label:'Big'},{html:'🐌',label:'Small'}],items:g.shuffle([...pickN(BIG,per+1).map(h=>({html:h,to:0})),...pickN(SMALL,per+1).map(h=>({html:h,to:1}))])};
 if(g.round===3){const [A,B,C]=g.shuffle(POOL).slice(0,3);return {say:'Three baskets! Sort each picture.',baskets:[A,B,C].map(h=>({html:h,label:NAME[h]})),items:g.shuffle([A,B,C].flatMap((h,i)=>Array(per).fill(0).map(()=>({html:h,to:i}))))};}
 const cols=BALLS.slice(0,3);
 return {say:'Sort the balls by colour.',baskets:cols.map(c=>({html:`<span class="ball" style="--c:${c[1]}"></span>`,label:c[0]})),items:g.shuffle(cols.flatMap((c,i)=>Array(per).fill(0).map(()=>({html:`<span class="ball" style="--c:${c[1]}"></span>`,to:i,label:c[0]}))))};
}
games.sort=g=>{
 const set=sortSet(g);
 g.say(set.say);
 const queue=el('div','sort-queue');
 const stageBox=el('div','sort-stage');
 const baskets=el('div','baskets');
 g.play.append(stageBox,queue,baskets);
 let idx=0,done=0;
 const bEls=set.baskets.map((b,i)=>{
  const e=el('button','basket',`<span class="b-label">${b.label}</span><span class="b-pic">${b.html}</span><span class="b-items"></span>`);
  e.setAttribute('aria-label',`${b.label} basket`);e.dataset.i=i;baskets.append(e);return e;
 });
 let cur=null;
 const showNext=()=>{
  queue.innerHTML=set.items.slice(idx+1).map(it=>`<span class="q">${it.html}</span>`).join('');
  stageBox.innerHTML='';
  if(idx>=set.items.length)return;
  const it=set.items[idx];
  const e=el('div','sort-item',it.html);e.setAttribute('role','button');e.setAttribute('aria-label',`${it.label||NAME[it.html]||'item'}`);
  stageBox.append(e);cur=e;E.animate(e,[{transform:'translateY(-60px) scale(.3)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:420,easing:'cubic-bezier(.3,1.5,.5,1)'});
  drag(e,it);
 };
 const place=(it,i,fromEl)=>{
  const b=bEls[i];
  if(it.to!==i){g.wrong(b,{text:'That one belongs in the other basket. Try again!'});E.animate(fromEl,[{transform:'translate(0,0)'}],{duration:10});return false;}
  const small=el('span','b-item',it.html);b.querySelector('.b-items').append(small);
  E.sfx('pop');g.right(b,{kind:'sparkle',n:8,text:false});E.animate(b,[{transform:'scale(1)'},{transform:'scale(1.12) rotate(-3deg)'},{transform:'scale(1)'}],{duration:320});
  idx++;done++;
  if(done===set.items.length){stageBox.innerHTML='';queue.innerHTML='';E.sfx('sparkle');g.win();}else showNext();
  return true;
 };
 function drag(e,it){
  let sx=0,sy=0,moved=false,down=false;
  e.onpointerdown=ev=>{down=true;moved=false;sx=ev.clientX;sy=ev.clientY;e.setPointerCapture(ev.pointerId);e.classList.add('dragging');};
  e.onpointermove=ev=>{if(!down)return;const dx=ev.clientX-sx,dy=ev.clientY-sy;if(Math.hypot(dx,dy)>10)moved=true;e.style.transform=`translate(${dx}px,${dy}px) scale(1.1)`;};
  const end=ev=>{
   if(!down)return;down=false;e.classList.remove('dragging');
   let hit=null;
   if(moved){e.style.pointerEvents='none';const t=document.elementFromPoint(ev.clientX,ev.clientY);e.style.pointerEvents='';hit=t?.closest?.('.basket');}
   if(hit){if(place(it,+hit.dataset.i,e))return;}
   e.style.transition='transform .3s cubic-bezier(.3,1.5,.5,1)';e.style.transform='';setTimeout(()=>{e.style.transition='';},320);
  };
  e.onpointerup=end;e.onpointercancel=end;
 }
 bEls.forEach((b,i)=>b.onclick=()=>{if(cur&&idx<set.items.length)place(set.items[idx],i,cur);});
 g.onAssist(()=>{const it=set.items[idx];if(it)g.hint(bEls[it.to]);});
 showNext();
};

/* ---------- Number trail: the sequences a child hops in order (up, down, from a number, in twos) ---------- */
function trailSequence(g){
 const easy=g.easy,r=g.round;
 const range=(a,b,s=1)=>{const o=[];if(s>0)for(let i=a;i<=b;i+=s)o.push(i);else for(let i=a;i>=b;i+=s)o.push(i);return o;};
 if(r===0)return {seq:range(1,easy?3:5),say:'Hop down the river. Start with one!'};
 if(r===1)return {seq:range(1,easy?5:7),say:'Follow the numbers. Start with one.'};
 if(r===2){const s=easy?3:4;return {seq:range(s,s+(easy?3:4)),say:`Start at ${s} and count on!`};}
 if(r===3)return {seq:range(easy?4:6,1,-1),say:`Count down! Start with ${easy?4:6}.`};
 return {seq:range(2,easy?8:12,2),say:'Count in twos! Start with two.'};
}
/* ---------- the number trail, on a river that is actually flowing ----------
 * This round used to be a board of standing stones: read the row, tap them in
 * order, done — the very same verb as every other pick-the-right-card round.
 * Here the numbers ride lily pads drifting with the current and the dinosaur
 * rides whichever pad you last sent it to, so "which is next" is a moving
 * problem and no two rivers run the same. Nothing sinks and nothing is timed:
 * a pad that floats past simply comes round again. */
games.order = g => {
  const { seq, say } = trailSequence(g);
  let at = 0, over = false;
  const dino = el('div', 'river-dino', dinoSVG(g.level));
  const f = roamField(g, seq.map(n => ({ html: `<b class="padnum">${n}</b>`, value: String(n), label: String(n), size: 92, flip: false })), {
    cls: ' river', height: g.easy ? 250 : 300, speed: g.easy ? .026 : .038, ramp: .005,
    tick(t, crowd) {
      const p = crowd[Math.min(at, crowd.length - 1)];
      if (!p || p.px == null) return;
      dino.style.translate = `${(p.px - 4).toFixed(1)}px ${(p.py - 46).toFixed(1)}px`;
    },
    onPick: (it, p, b) => {
      if (over || b.classList.contains('visited')) return;
      if (p.i !== at) { g.wrong(b, { text: `Not that one yet. Look for ${seq[at]}!`, speech: `Find ${WORDS[seq[at]] || seq[at]}.` }); return; }
      b.classList.add('visited');
      E.sfx('boing'); E.step(at, .2); g.speak(WORDS[seq[p.i]] || String(seq[p.i]));
      g.right(b, { kind: 'sparkle', n: 8, pitch: at, text: false });
      E.burstAt(b, { kind: 'drops', n: 9 });
      b.append(el('span', 'bloom', TRAIL_BLOOM[at % 4]));
      at++;
      if (at === seq.length) {
        over = true;
        const last = el('span', 'nest-egg', '🥚'); b.append(last);
        g.later(() => { E.sfx('sparkle'); E.burstAt(b, { kind: 'hearts', n: 12 }); g.win({ delay: 1700 }); }, 500);
      } else g.say(`Now ${seq[at]}.`);
    } });
  f.box.append(dino);
  g.say(say + ' The lily pads are drifting — hop them in order!');
  g.onAssist(() => g.hint(f.crowd[Math.min(at, f.crowd.length - 1)].b));
};
/* Four different plants, not four flowers: the old list was one photograph
 * repeated four times, so the trail never actually changed as you hopped it. */
const TRAIL_BLOOM=['🌼','🌿','🌱','🍄'];

/* ---------- Memory eggs: flip the eggs, find the pairs ---------- */
const MEM_FACES=['🦋','🍓','🌼','🍄','🐚','🌿','⭐','🌈','🐟','🥚','🌙','🪶'];
games.memory=g=>{
 const pairs=g.easy?[2,3,3,4,4][g.round]:[3,4,5,6,6][g.round];
 const peek=g.round<2;
 const faces=g.shuffle(MEM_FACES.slice(g.level%4)).slice(0,pairs);
 const deck=g.shuffle([...faces,...faces]);
 g.say(peek?'Peek at the eggs, then find the pairs!':'Open two eggs. Can you find the pairs?');
 const cols=deck.length<=6?3:deck.length<=8?4:4;
 const board=el('div','mem-board');board.style.setProperty('--cols',cols);g.play.append(board);
 const tries=el('div','want',`Tries: <b id="tries">0</b>`);g.play.append(tries);
 let first=null,locked=peek,found=0,count=0;
 const cardEls=deck.map((f,i)=>{
  const c=el('button','mcard',`<span class="mface back"><i>🥚</i></span><span class="mface front">${f}</span>`);
  c.style.setProperty('--i',i);c.setAttribute('aria-label','Closed egg');c.dataset.f=f;
  c.onclick=()=>{
   if(locked||c.classList.contains('open')||c.classList.contains('matched'))return;
   c.classList.add('open');c.setAttribute('aria-label',NAME[f]||f);E.sfx('tap');
   if(!first){first=c;return;}
   const a=first;first=null;count++;board.parentElement.querySelector('#tries').textContent=count;
   if(a.dataset.f===f){
    locked=true;
    g.later(()=>{
     [a,c].forEach(x=>{x.classList.add('matched');});
     g.right(c,{kind:'sparkle',n:14,text:'Match!'});E.burstAt(a,{kind:'hearts',n:6});E.sfx('chirp');
     if(++found===pairs){E.sfx('sparkle');g.win({delay:1600});}
     locked=false;
    },350);
   }else{
    locked=true;
    g.later(()=>{
     g.wrong(c,{soft:true,text:'Not a pair. Try again, you will remember!',speech:'Not a pair. Try again.'});
     g.later(()=>{a.classList.remove('open');c.classList.remove('open');a.setAttribute('aria-label','Closed egg');c.setAttribute('aria-label','Closed egg');locked=false;},650);
    },350);
   }
  };
  board.append(c);return c;
 });
 g.onAssist(()=>{if(first){const m=cardEls.find(c=>c!==first&&c.dataset.f===first.dataset.f&&!c.classList.contains('matched'));if(m)g.hint(m);}});
 if(peek){
  g.later(()=>cardEls.forEach(c=>c.classList.add('open')),700);
  g.later(()=>{cardEls.forEach(c=>c.classList.remove('open'));locked=false;E.sfx('whoosh');},700+(g.easy?2400:2000)+pairs*250);
 }
};

/* ---------- Meadow paths: a fresh hedge maze every round. Tap anywhere and the dino walks there. ---------- */
function genMaze(n,pick){
 const cells=Array.from({length:n*n},()=>({n:1,s:1,e:1,w:1}));
 const seen=new Set([0]),stack=[0];
 while(stack.length){
  const c=stack[stack.length-1],x=c%n,y=(c/n)|0,nb=[];
  if(y>0)nb.push([c-n,'n','s']);if(y<n-1)nb.push([c+n,'s','n']);if(x>0)nb.push([c-1,'w','e']);if(x<n-1)nb.push([c+1,'e','w']);
  const open=nb.filter(([i])=>!seen.has(i));
  if(!open.length){stack.pop();continue;}
  const [i,a,b]=pick(open);cells[c][a]=0;cells[i][b]=0;seen.add(i);stack.push(i);
 }
 return cells;
}
function mazeRoute(cells,n,from,to){
 const prev=new Map([[from,-1]]),q=[from];
 while(q.length){
  const c=q.shift();if(c===to)break;
  const x=c%n,y=(c/n)|0,w=cells[c],nb=[];
  if(!w.n)nb.push(c-n);if(!w.s)nb.push(c+n);if(!w.w)nb.push(c-1);if(!w.e)nb.push(c+1);
  for(const i of nb)if(!prev.has(i)){prev.set(i,c);q.push(i);}
 }
 const path=[];for(let c=to;c!==-1&&prev.has(c);c=prev.get(c))path.unshift(c);
 return path;
}
games.maze=g=>{
 const n=(g.easy?[3,3,4,4,5]:[4,4,5,5,6])[g.round];
 const cells=genMaze(n,arr=>arr[Math.floor(Math.random()*arr.length)]);
 const end=n*n-1;
 g.say(g.round===0?'Tap a path to walk the dinosaur to the nest.':'Find the way to the nest. Collect the berries too!');
 const cs=n<=3?118:n===4?100:n===5?84:72;
 const grid=el('div','maze');grid.style.cssText=`--n:${n};--cs:${cs}px`;g.play.append(grid);
 const berryCells=g.shuffle(Array.from({length:n*n-2},(_,i)=>i+1).filter(i=>i!==end)).slice(0,n);
 const berries=new Map();
 cells.forEach((w,i)=>{
  const c=el('button','mcell'+(w.n?' wn':'')+(w.s?' ws':'')+(w.e?' we':'')+(w.w?' ww':''),'');
  c.setAttribute('aria-label',i===end?'The nest':`Path ${i+1}`);c.dataset.i=i;
  if(i===end)c.innerHTML='<span class="nest-big">🪺</span>';
  else if(berryCells.includes(i)){const b=el('span','berry','🍓');c.append(b);berries.set(i,b);}
  grid.append(c);
 });
 const dino=el('div','maze-dino',dinoSVG(g.level));grid.append(dino);
 let pos=0,moving=false,got=0;
 const put=i=>{dino.style.left=`calc(${i%n} * var(--cs))`;dino.style.top=`calc(${(i/n)|0} * var(--cs))`;};
 put(0);grid.children[0].classList.add('seen');
 const walk=to=>{
  if(moving||to===pos)return;
  const path=mazeRoute(cells,n,pos,to).slice(1);if(!path.length)return;
  moving=true;
  path.forEach((i,k)=>g.later(()=>{
   pos=i;put(i);E.sfx('tap');E.step(k,.12);grid.children[i].classList.add('seen');
   if(berries.has(i)){const b=berries.get(i);berries.delete(i);got++;b.classList.add('eaten');E.sfx('chomp');E.burstAt(grid.children[i],{kind:'hearts',n:5});counter.textContent=`🍓 ${got} / ${n}`;}
   if(k===path.length-1){
    moving=false;
    if(i===end){
     E.sfx('sparkle');E.burstAt(grid.children[i],{kind:'hearts',n:14});
     if(got===n)g.later(()=>g.bonus(grid.children[i],'All the berries!'),200);
     g.right(grid.children[i],{n:12});g.win({delay:got===n?2300:1900});
    }
   }
  },(k+1)*230));
 };
 const counter=el('div','want',`🍓 0 / ${n}`);g.play.append(counter);
 grid.addEventListener('click',e=>{const c=e.target.closest('.mcell');if(c&&!moving)walk(+c.dataset.i);});
 // arrow keys / swipe-free alternative for adults and keyboards
 const keys=e=>{
  if(!g.alive()){removeEventListener('keydown',keys);return;}
  const w=cells[pos];let to=null;
  if(e.key==='ArrowUp'&&!w.n)to=pos-n;else if(e.key==='ArrowDown'&&!w.s)to=pos+n;else if(e.key==='ArrowLeft'&&!w.w)to=pos-1;else if(e.key==='ArrowRight'&&!w.e)to=pos+1;
  if(to!==null){e.preventDefault();walk(to);}
 };
 addEventListener('keydown',keys);
 g.onAssist(()=>{const p=mazeRoute(cells,n,pos,end);if(p[1]!==undefined)g.hint(grid.children[p[1]]);});
};

/* ---------- Fossil finder: really brush the soil away with your finger to uncover buried treasure ---------- */
const FOSSILS=[['🦴','a dinosaur bone'],['🥚','a dinosaur egg'],['🐚','a shell'],['💎','a sparkly gem'],['🦷','a big tooth'],['🐾','a footprint'],['🌿','a fern leaf'],['🦕','a little dinosaur']];
const SOILS=[['#a98558','#8a6a42'],['#e6cf9a','#c9b077'],['#cfdde8','#a9bfd0'],['#8672ad','#6b5890'],['#c98a74','#a76b58']];
games.dig=g=>{
 const W=560,H=320,[soil,dark]=SOILS[g.level%5];
 const count=(g.easy?[2,2,3,3,4]:[2,3,4,4,5])[g.round];
 const wantNames=g.shuffle(FOSSILS).slice(0,count);
 const decoys=g.round>=2?2:0;
 g.say(`Brush away the soil with your finger. Find ${count===2?'two':count===3?'three':count===4?'four':'five'} fossils!`);
 const tray=el('div','found-tray');
 wantNames.forEach(([e,n])=>tray.append(el('span','ft',`<i>${e}</i>`)));
 g.play.append(tray);
 const site=el('div','dig-site');site.style.setProperty('--ar',`${W}/${H}`);g.play.append(site);
 // hidden things, placed in separate cells so they never overlap
 const cellsAll=g.shuffle([0,1,2,3,4,5,6,7]);
 const spots=cellsAll.slice(0,count+decoys).map(c=>({x:((c%4)+.5)/4+(Math.random()*.04-.02),y:((c/4|0)+.5)/2*.8+.1+(Math.random()*.04-.02)}));
 const hidden=wantNames.map(([e,n],i)=>({e,n,...spots[i],found:false,real:true}));
 for(let i=0;i<decoys;i++)hidden.push({e:'🪨',n:'just a rock',...spots[count+i],found:false,real:false});
 hidden.forEach(h=>{h.el=el('span','buried',h.e);h.el.style.left=`${h.x*100}%`;h.el.style.top=`${h.y*100}%`;site.append(h.el);});
 const cv=el('canvas','soil');cv.width=W;cv.height=H;cv.setAttribute('aria-label','Soil to brush away');site.append(cv);
 const ctx=cv.getContext('2d');
 ctx.fillStyle=soil;ctx.fillRect(0,0,W,H);
 for(let i=0;i<900;i++){ctx.fillStyle=Math.random()<.5?dark:'#ffffff22';ctx.beginPath();ctx.arc(Math.random()*W,Math.random()*H,Math.random()*4+1,0,7);ctx.fill();}
 for(let i=0;i<26;i++){ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(Math.random()*W,Math.random()*H,10+Math.random()*10,7+Math.random()*5,Math.random()*3,0,7);ctx.fill();ctx.fillStyle='#ffffff30';ctx.fillRect(Math.random()*W,Math.random()*H,10,2);}
 const brush=el('div','brush','🖌️');site.append(brush);
 const R=Math.round(W*.07);
 let down=false,last=null,lastDust=0,lastAct=performance.now(),left=count,dist=0;
 const pt=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];};
 const erase=(a,b)=>{
  ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=R*1.9;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  ctx.strokeStyle='#000';ctx.lineWidth=R*1.15;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  ctx.globalCompositeOperation='source-over';
 };
 const cleared=h=>{
  const cx=Math.round(h.x*W),cy=Math.round(h.y*H),r=R*.8,x0=Math.max(0,cx-r|0),y0=Math.max(0,cy-r|0),w=Math.min(W-x0,r*2|0),hh=Math.min(H-y0,r*2|0);
  const d=ctx.getImageData(x0,y0,w,hh).data;let tot=0,clear=0;
  for(let y=0;y<hh;y+=3)for(let x=0;x<w;x+=3){if(Math.hypot(x+x0-cx,y+y0-cy)>r)continue;tot++;if(d[(y*w+x)*4+3]<60)clear++;}
  return tot?clear/tot:0;
 };
 const check=()=>{
  hidden.forEach(h=>{
   if(h.found||cleared(h)<.55)return;
   h.found=true;
   ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(h.x*W,h.y*H,R*1.3,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';
   h.el.classList.add('found');
   const c=E.burstAt(h.el,{kind:h.real?'sparkle':'dust',n:h.real?20:8});
   if(h.real){
    const slot=[...tray.children][wantNames.findIndex(w=>w[0]===h.e)];if(slot)slot.classList.add('got');
    g.right(h.el,{kind:'stars',n:12,text:'Found!'});g.speak(`You found ${h.n}!`);g.note(`You found ${h.n}!`);
    if(--left===0){
     g.later(()=>{cv.classList.add('crumble');E.sfx('sparkle');g.win({delay:2100});},400);
    }
   }else{E.sfx('thud');g.note('Just a rock! Keep brushing.');g.speak('Just a rock.');E.animate(h.el,[{transform:'translate(-50%,-50%) rotate(0)'},{transform:'translate(-50%,-50%) rotate(15deg)'},{transform:'translate(-50%,-50%) rotate(0)'}],{duration:400});}
  });
 };
 cv.onpointerdown=e=>{e.preventDefault();down=true;try{cv.setPointerCapture(e.pointerId);}catch{}last=pt(e);erase(last,last);moveBrush(e);lastAct=performance.now();};
 const moveBrush=e=>{const r=site.getBoundingClientRect();brush.style.transform=`translate(${e.clientX-r.left-10}px,${e.clientY-r.top-34}px)`;brush.classList.add('on');};
 cv.onpointermove=e=>{
  moveBrush(e);if(!down)return;
  const p=pt(e);erase(last,p);dist+=Math.hypot(p[0]-last[0],p[1]-last[1]);last=p;lastAct=performance.now();
  const now=performance.now();
  if(now-lastDust>110){lastDust=now;E.burst(e.clientX,e.clientY,{kind:'dust',n:2,scale:.7,power:.6});E.noise(.07,.035,0,900,1700);}
 };
 const up=()=>{if(!down)return;down=false;check();};
 cv.onpointerup=cv.onpointercancel=up;cv.onpointerleave=()=>brush.classList.remove('on');
 g.loop(()=>{if(down){const now=performance.now();if(now-(cv._chk||0)>260){cv._chk=now;check();}}});
 // a shimmer nudges the child if they are unsure where to brush
 const nudge=()=>{
  if(!g.alive())return;
  if(performance.now()-lastAct>6500){const h=hidden.find(x=>x.real&&!x.found);if(h){const r=site.getBoundingClientRect();E.burst(r.left+h.x*r.width,r.top+h.y*r.height,{kind:'sparkle',n:8,power:.4});}}
  g.later(nudge,2500);
 };
 g.later(nudge,5000);
 g.onAssist(()=>{});
};

/* ---------- Bubble meadow: bubbles drift up all the time; pop the right kind, chase the golden one ---------- */
games.bubbles=g=>{
 const kindMode=['picture','picture','colour','number','picture'][g.round];
 const goal=(g.easy?[4,5,5,6,7]:[5,6,7,8,9])[g.round];
 let target,pool,say,render;
 if(kindMode==='picture'){
  const p=g.shuffle(POOL.slice(g.level%4)).slice(0,4);target=p[0];pool=p;
  say=`Pop all the ${NAME[target]} bubbles!`;
  render=(v,b)=>{b.textContent=v;};
 }else if(kindMode==='colour'){
  const cs=g.shuffle(BASIC).slice(0,4);target=cs[0][0];pool=cs.map(c=>c[0]);
  const map=Object.fromEntries(cs.map(c=>[c[0],c[1]]));
  say=`Pop all the ${target.toLowerCase()} bubbles!`;
  render=(v,b)=>{b.style.setProperty('--tint',map[v]);b.classList.add('tinted');b.setAttribute('aria-label',v+' bubble');};
 }else{
  const ns=g.shuffle([1,2,3,4,5,6,7,8,9]).slice(0,4);target=ns[0];pool=ns;
  say=`Pop all the number ${WORDS[target]} bubbles!`;
  render=(v,b)=>{b.innerHTML=`<b class="bn">${v}</b>`;};
 }
 g.say(say);
 const field=el('div','bubble-field');g.play.append(field);
 const bar=el('div','want',`<span id="left">${goal} to pop</span>`);g.play.append(bar);
 const fr=field.getBoundingClientRect();let FW=Math.max(280,fr.width||560),FH=Math.max(300,fr.height||320);
 const list=[];let left=goal,wrongs=0,spawnT=0,golden=0;
 const speed=g.easy?52:70;
 const spawn=(forceTarget=false,gold=false)=>{
  const isT=forceTarget||Math.random()<.42;
  const v=isT?target:pool[1+Math.floor(Math.random()*(pool.length-1))];
  const size=76+Math.random()*26;
  const b=el('button','bub'+(gold?' gold':''),'');
  b.style.width=b.style.height=size+'px';
  if(gold)b.textContent='⭐';else render(v,b);
  b.setAttribute('aria-label',gold?'Golden bubble':b.getAttribute('aria-label')||`Bubble ${NAME[v]||v}`);
  const o={b,v,gold,x:20+Math.random()*(FW-size-40),y:FH+10,size,vy:speed*(.8+Math.random()*.5),ph:Math.random()*6,amp:12+Math.random()*16};
  b.onclick=()=>{
   if(o.dead)return;
   if(gold){pop(o);g.right(b,{kind:'stars',n:14,text:'Golden!'});g.bonus(b,'Golden bubble!');return;}
   if(v!==target){wrongs++;E.sfx('boing');o.vy=-120;o.bounce=.5;g.wrong(b,{soft:wrongs<=2,text:`That is not the one. Look for ${say.replace(/^Pop all the | bubbles!$/g,'')}!`});if(wrongs>=2)list.filter(x=>x.v===target&&!x.dead).slice(0,1).forEach(x=>g.hint(x.b));return;}
   pop(o);left--;g.right(b,{kind:'bubbles',n:10});bar.querySelector('#left').textContent=left>0?`${left} to pop`:'All popped!';
   if(left<=0){list.forEach(x=>{if(!x.dead&&x.v!==target)pop(x,true);});g.later(()=>g.win({delay:1700}),200);}
  };
  field.append(b);list.push(o);return o;
 };
 const pop=(o,quiet)=>{
  if(o.dead)return;o.dead=true;
  if(!quiet){E.sfx('pop');}
  E.burstAt(o.b,{kind:'bubbles',n:quiet?4:9,scale:.8});
  o.b.classList.add('popped');setTimeout(()=>o.b.remove(),260);
 };
 for(let i=0;i<5;i++){const o=spawn(i<2);o.y=FH*(.25+i*.17);}
 g.loop(dt=>{
  spawnT-=dt;
  const live=list.filter(o=>!o.dead);
  const nT=live.filter(o=>o.v===target&&!o.gold).length;
  if(left>0&&(nT<2||(spawnT<=0&&live.length<8))){spawn(nT<2);spawnT=.9;}
  golden-=dt;if(left>0&&golden<=0&&g.round>=1){golden=14+Math.random()*8;spawn(false,true);}
  live.forEach(o=>{
   o.ph+=dt*2;o.y-=o.vy*dt;if(o.bounce){o.bounce-=dt;if(o.bounce<=0){o.vy=speed;o.bounce=0;}}
   const x=o.x+Math.sin(o.ph)*o.amp;
   o.b.style.transform=`translate(${x}px,${o.y}px)`;
   if(o.y<-o.size-10){o.dead=true;o.b.remove();}
  });
 });
 g.onAssist(()=>{});
};

/* ---------- Dino picnic: a hungry dinosaur asks for particular food; feed it into its mouth ---------- */
const FOOD_NAME={'🍓':'berry','🌿':'fern leaf','☘️':'moss cup','🌱':'sprout','🍄':'mushroom','🥚':'egg','🐟':'little fish','🌰':'seed cone','🌾':'seed head','🪻':'ginkgo leaf','🪴':'ivy leaf','🍯':'honey','💧':'water'};
const FOODS=Object.keys(FOOD_NAME);
const MASS=new Set(['🍯','💧']);
const FOOD_PLURAL={'🍓':'berries','🌿':'fern leaves','☘️':'moss cups','🌱':'sprouts','🍄':'mushrooms','🥚':'eggs','🐟':'little fish','🌰':'seed cones','🌾':'seed heads','🪻':'ginkgo leaves','🪴':'ivy leaves','🍯':'spoonfuls of honey','💧':'drops of water'};
/* A round that teaches a colour may only claim what the photographs actually
 * show, so these two sets are the measured mean pixel of every specimen picture
 * in this vocabulary, not a guess from the glyph. 🥍 is a rust-coloured stone
 * (149,83,59) and 🌾 has dried to straw (114,121,62), so neither belongs among
 * the greens; 🐚 has no food name at all and never reaches a blanket. */
const GREENS=['🌿','☘️','🌱','🪴','🪻'],NOTGREENS=['🍓','🥚','🐟','🌰','🍄','🍯','💧'];
const SPECIES_BY_LEVEL=['trex','tricera','stego','bronto','raptor'];
/* ---------- Dinner in the paddock: a brood that wanders, each with its own appetite ----------
 * There used to be one patient dinosaur standing still, asking for one thing at
 * a time, and the round was over after a few taps. Now the whole brood is loose
 * in the paddock: every baby wants something different, they keep walking while
 * you decide, and the food you picked has to be carried to the right moving
 * animal. Appetite only grows — it never takes a star away and nothing is ever
 * lost, because the meadow still promises no clocks and no losing screens. */
games.feed = g => {
  const pool = g.shuffle(FOODS);
  const nm = f => FOOD_NAME[f] || window.DUFX.objects.spoken(f);
  /* "a egg" is what the old fixed article said out loud to a child. */
  const article = f => MASS.has(f) ? 'some' : (/^[aeiou]/i.test(nm(f)) ? 'an' : 'a');
  const n = g.easy ? (g.round < 2 ? 2 : 3) : (g.round === 2 ? 3 : 4);
  /* One appetite per baby, built from the five rules this round has always
   * taught: name a food, name a food, count a portion, name a colour, name a
   * food under time pressure. The rules are unchanged; only the body around
   * them moved. */
  const babies = [];
  if (g.round === 3) {
    const greens = g.shuffle(GREENS).slice(0, n);
    greens.forEach((f, i) => babies.push({ ok: x => GREENS.includes(x), food: f, need: 1, got: 0, done: false, want: 'something green',
      say: i === 0 ? 'I want something green!' : 'Something green too, please!', html: f }));
  } else if (g.round === 2) {
    const f = pool[0], k = g.easy ? 2 : 3;
    for (let i = 0; i < n; i++) babies.push({ ok: x => x === f, food: f, need: k, got: 0, done: false, want: `${WORDS[k]} ${k > 1 ? FOOD_PLURAL[f] : nm(f)}`,
      say: `${WORDS[k]} ${k > 1 ? FOOD_PLURAL[f] : nm(f)}, please!`, html: f });
  } else {
    pool.slice(0, n).forEach(f => babies.push({ ok: x => x === f, food: f, need: 1, got: 0, done: false, want: `${article(f)} ${nm(f)}`,
      say: `I would like ${article(f)} ${nm(f)}, please!`, html: f }));
  }
  const wanted = [...new Set(babies.map(b => b.food))];
  /* In the colour round the wrong answers have to be things that really are not
   * green, or a picture that plainly looks green is marked wrong and the lesson
   * contradicts itself. */
  const shelf = g.round === 3 ? NOTGREENS : FOODS;
  const decoys = g.shuffle(shelf.filter(f => !wanted.includes(f))).slice(0, g.easy ? 1 : 3);
  const options = g.shuffle([...wanted, ...decoys]);
  const total = babies.length;
  let held = null, heldBtn = null, full = 0;

  const meter = el('div', 'tummy', '');
  const plate = el('div', 'blanket');
  const pad = roamField(g, babies.map((b, i) => ({ html: '', value: String(i), label: 'Hungry baby dinosaur' })), {
    cls: ' paddock', height: g.easy ? 300 : 340, speed: g.easy ? .05 : .072, ramp: .008,
    tick(t) {
      for (const p of pad.crowd) {
        const b = p.baby;
        if (!b || b.done) continue;
        b.hunger = Math.min(1, (t - b.born) / b.rate);
        if (b.bar) b.bar.style.setProperty('--hunger', (b.hunger * 100).toFixed(1) + '%');
        if (b.hunger >= 1) {
          b.born = t - b.rate * .45;
          b.dino.setState('sad', 900); E.sfx('chirp');
          p.b.classList.add('calling');
          g.later(() => p.b.classList.remove('calling'), 1400);
        }
      }
    },
    onPick: (it, p, b) => {
      const q = p.baby;
      /* A child taps twice. The cheer only lands when the food arrives, so
       * without this the same baby is counted full twice and the round waits
       * for a third tummy that never fills. */
      if (!q || q.done || q.busy) return;
      if (!held) { g.note('Pick up a food from the blanket first!'); g.speak('Pick up a food first.'); E.sfx('tap'); E.animate(plate, [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 260 }); return; }
      if (!q.ok(held)) {
        q.dino.setState('sad', 800);
        g.wrong(b, { text: `Not this one — it wants ${q.want}.`, speech: `This one wants ${q.want}.` });
        return;
      }
      const head = b.getBoundingClientRect();
      const from = heldBtn;
      held = null; heldBtn = null;
      [...plate.children].forEach(x => x.classList.remove('selected'));
      q.got++;
      q.busy = true;
      g.fly(from, { x: head.left + head.width * .62, y: head.top + head.height * .34 }, q.food).then(() => {
        q.busy = false;
        if (q.done) return;
        q.dino.setState('eat', 900); E.sfx('chomp'); E.burstAt(b, { kind: 'dust', n: 6 });
        if (q.got >= q.need) {
          q.done = true; b.classList.add('full');
          q.bubble.remove(); q.bar.remove();
          q.dino.setState('happy', 1600);
          E.floatText(head.left + head.width / 2, head.top, 'Yum!', { size: 26 });
          full++; g.right(b, { kind: 'hearts', n: 10, pitch: full - 1 });
          meter.innerHTML = window.DUICONS.stars(full, { max: total, size: 26 });
          if (full === total) g.later(() => { E.sfx('roar'); g.speak('Thank you! Every tummy is full.'); g.win({ delay: 2100 }); }, 600);
        } else {
          g.right(b, { kind: 'hearts', n: 5, pitch: q.got - 1, text: `${q.need - q.got} more` });
          setWant(q);
        }
      });
    } });

  function setWant(q) {
    if (!q.bubble) return;
    q.bubble.textContent = '';
    if (q.need > 1) { const b = el('b', '', String(q.need - q.got)); q.bubble.append(b, ' × '); }
    q.bubble.append(document.createTextNode(q.food));
  }

  pad.crowd.forEach((p, i) => {
    const b = babies[i];
    b.dino = D_dino(SPECIES_BY_LEVEL[(g.level + i) % 5], { state: 'walk', size: 158 });
    b.dino.setAttribute('data-base', 'walk');
    b.bubble = el('span', 'feed-want');
    b.bar = el('i', 'hunger');
    p.b.append(b.dino, b.bubble, b.bar);
    p.b.classList.add('roamer-animal');
    b.born = -Math.random() * 6; b.rate = g.easy ? 30 : 24; b.hunger = 0;
    b.call = i === 0 ? b.say : (g.round === 3 ? 'Something green, please!' : `I want ${nm(b.food)}, please!`);
    setWant(b);
    p.baby = b;
    /* a baby you tap is a baby you have to reach, so the spoken ask comes from
     * the crowd entry rather than a single queue position */
    if (g.round === 0 && i === 0) b.born = -b.rate * .7;
  });
  function heldClear() { held = null; heldBtn = null; [...plate.children].forEach(x => x.classList.remove('selected')); }
  options.forEach(f => {
    const btn = el('button', 'food', f);
    btn.setAttribute('aria-label', nm(f)); btn.dataset.food = f;
    btn.onclick = () => {
      if (full >= total) return;
      if (held === f) { heldClear(); E.sfx('tap'); return; }
      held = f; heldBtn = btn;
      [...plate.children].forEach(x => x.classList.toggle('selected', x === btn));
      E.sfx('tap'); g.speak(nm(f));
      g.note(`Now carry the ${nm(f)} to the baby that wants it.`);
    };
    plate.append(btn);
  });
  g.play.append(meter, plate);
  meter.innerHTML = window.DUICONS.stars(0, { max: total, size: 26 });
  const asking = babies.find(b => !b.done);
  g.say(total > 1 ? `${total} hungry babies are wandering the paddock. ${asking.call}` : asking.call);
  g.onAssist(() => {
    const q = babies.find(b => !b.done);
    if (!q) return;
    if (!held) { const o = [...plate.children].find(x => q.ok(x.dataset.food)); if (o) g.hint(o); return; }
    const p = pad.crowd.find(c => c.baby === q);
    if (p && q.ok(held)) g.hint(p.b);
    else { const o = [...plate.children].find(x => q.ok(x.dataset.food)); if (o) g.hint(o); }
  });
};
const safe2=fn=>{try{fn();}catch{}};
const D_dino=(sp,o)=>{const d=window.DUFX?.dino?window.DUFX.dino(sp,o):document.createElement('span');return d;};

/* ---------- Bath time: scrub off the mud, soap it up, rinse and towel dry. All of it is rubbed on with a finger. ---------- */
const ZONES=[[190,235],[255,228],[145,232],[300,215],[330,95],[300,150],[215,288],[105,252],[235,170],[180,170]];
games.wash=g=>{
 const W=420,H=360,mode=['mud','mud','soap','rinse','dry'][g.round];
 const K=g.easy?[3,4,3,3,4][g.round]:[5,6,5,5,6][g.round];
 const zones=ZONES.slice(0,K).map(([x,y])=>({x,y,done:false,r:46}));
 const say={mud:'Scrub the mud away with the rough leaf!',soap:'Rub the bubbles over the dirty spots!',rinse:'Rinse the bubbles away with clean water!',dry:'Let the sun dry your dinosaur!'}[mode];
 g.say(mode==='mud'&&g.round===1?'More mud! Scrub it all clean.':say);
 const box=el('div','wash-dino');box.style.setProperty('--ar',`${W}/${H}`);
 box.innerHTML=dinoSVG(g.level,['#76c7a2','#ebac7f','#aa9cda','#79b8d3','#dc9bb6'][g.level%5]);
 const cv=el('canvas','wash-cv');cv.width=W;cv.height=H;box.append(cv);g.play.append(box);
 const ctx=cv.getContext('2d');
 const tool={mud:'🍂',soap:'🫧',rinse:'💧',dry:'☀️'}[mode];
 const cursor=el('div','brush',tool);box.append(cursor);
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const mud=(x,y,r)=>{const gr=ctx.createRadialGradient(x,y,r*.1,x,y,r);gr.addColorStop(0,'#6b4a2b');gr.addColorStop(.75,'#7d5a36');gr.addColorStop(1,'#7d5a3600');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();};
 const foam=(x,y,r)=>{ctx.fillStyle='#ffffffee';ctx.strokeStyle='#a9d9ec';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.22,0,7);ctx.fill();};
 const drop=(x,y,r)=>{ctx.fillStyle='#7ec8ee66';ctx.strokeStyle='#ffffffcc';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,r*.8,r,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-r*.25,y-r*.35,r*.2,0,7);ctx.fill();};
 let stain=null,erasing=true,radius=34;
 if(mode==='mud'){zones.forEach(z=>{for(let i=0;i<(g.round===1?9:6);i++)mud(z.x+rnd(-28,28),z.y+rnd(-22,22),rnd(22,40));});}
 else if(mode==='soap'){
  erasing=false;radius=26;
  stain=el('canvas','wash-cv stain');stain.width=W;stain.height=H;box.insertBefore(stain,cv);
  const sc=stain.getContext('2d');zones.forEach(z=>{sc.fillStyle='#7d5a3699';for(let i=0;i<7;i++){sc.beginPath();sc.arc(z.x+rnd(-26,26),z.y+rnd(-20,20),rnd(10,22),0,7);sc.fill();}sc.strokeStyle='#ffffffaa';sc.setLineDash([6,6]);sc.lineWidth=3;sc.beginPath();sc.arc(z.x,z.y,z.r,0,7);sc.stroke();});
 }
 else if(mode==='rinse'){radius=40;zones.forEach(z=>{for(let i=0;i<16;i++)foam(z.x+rnd(-36,36),z.y+rnd(-30,30),rnd(10,22));});}
 else{radius=36;zones.forEach(z=>{for(let i=0;i<20;i++)drop(z.x+rnd(-40,40),z.y+rnd(-34,34),rnd(6,12));});}
 // how much of a zone is still covered (erase modes) or covered (soap)
 const measure=z=>{
  const x0=Math.max(0,z.x-z.r|0),y0=Math.max(0,z.y-z.r|0),w=Math.min(W-x0,z.r*2|0),h=Math.min(H-y0,z.r*2|0);
  const d=ctx.getImageData(x0,y0,w,h).data;let tot=0,on=0;
  for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){if(Math.hypot(x+x0-z.x,y+y0-z.y)>z.r)continue;tot++;if(d[(y*w+x)*4+3]>70)on++;}
  return tot?on/tot:0;
 };
 const startCover=erasing?zones.map(z=>Math.max(.05,measure(z))):null;
 let left=zones.length,down=false,last=null,acc=0,lastFx=0;
 const checkZones=()=>{
  zones.forEach((z,i)=>{
   if(z.done)return;
   const m=measure(z);
   const ok=erasing?m<startCover[i]*.14:m>.6;
   if(!ok)return;
   z.done=true;
   if(erasing){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(z.x,z.y,z.r*1.1,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';}
   else{for(let k=0;k<8;k++)foam(z.x+rnd(-30,30),z.y+rnd(-24,24),rnd(10,20));if(stain){const sc=stain.getContext('2d');sc.globalCompositeOperation='destination-out';sc.beginPath();sc.arc(z.x,z.y,z.r*1.2,0,7);sc.fill();sc.globalCompositeOperation='source-over';}}
   const r=cv.getBoundingClientRect();
   E.burst(r.left+z.x*r.width/W,r.top+z.y*r.height/H,{kind:'sparkle',n:12});E.sfx('sparkle');
   g.right(null,{n:0,pitch:K-left});E.floatText(r.left+z.x*r.width/W,r.top+z.y*r.height/H-16,mode==='soap'?'Bubbly!':'Clean!',{size:24});
   if(--left===0){
    box.classList.add('shiny');
    g.later(()=>{
     if(mode==='dry'){const bow=el('span','bow','🌼');box.append(bow);}
     E.sfx('splash');E.burstAt(box,{kind:mode==='rinse'||mode==='soap'?'bubbles':'stars',n:22});g.speak(mode==='dry'?'All clean and fluffy!':'Lovely!');
     g.win({delay:1900});
    },350);
   }
  });
 };
 const pt=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];};
 const stroke=(a,b)=>{
  if(erasing){
   ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';
   ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=radius*2;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
   ctx.strokeStyle='#000';ctx.lineWidth=radius*1.2;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
   ctx.globalCompositeOperation='source-over';
  }else{
   const d=Math.hypot(b[0]-a[0],b[1]-a[1]);acc+=d;
   if(acc>10){acc=0;for(let k=0;k<3;k++)foam(b[0]+rnd(-radius*.6,radius*.6),b[1]+rnd(-radius*.6,radius*.6),rnd(8,radius*.6));}
  }
 };
 const fx=e=>{
  const now=performance.now();if(now-lastFx<120)return;lastFx=now;
  if(mode==='rinse'){E.burst(e.clientX,e.clientY-10,{kind:'drops',n:3,scale:.8,power:.5});E.noise(.1,.05,0,2500,0,900);}
  else if(mode==='mud'){E.burst(e.clientX,e.clientY,{kind:'dust',n:2,scale:.7,power:.5});E.noise(.07,.04,0,700,1500);}
  else if(mode==='soap'){E.burst(e.clientX,e.clientY,{kind:'bubbles',n:2,scale:.7,power:.4});E.sfx('tap');}
  else E.noise(.08,.035,0,1200,2400);
 };
 const moveTool=e=>{const r=box.getBoundingClientRect();cursor.style.transform=`translate(${e.clientX-r.left-18}px,${e.clientY-r.top-36}px)`;cursor.classList.add('on');};
 cv.onpointerdown=e=>{e.preventDefault();down=true;try{cv.setPointerCapture(e.pointerId);}catch{}last=pt(e);stroke(last,last);moveTool(e);fx(e);};
 cv.onpointermove=e=>{moveTool(e);if(!down)return;const p=pt(e);stroke(last,p);last=p;fx(e);};
 const up=()=>{if(!down)return;down=false;checkZones();};
 cv.onpointerup=cv.onpointercancel=up;cv.onpointerleave=()=>cursor.classList.remove('on');
 g.loop(()=>{if(down){const now=performance.now();if(now-(cv._chk||0)>280){cv._chk=now;checkZones();}}});
 g.onAssist(()=>{const z=zones.find(z=>!z.done);if(z){const r=cv.getBoundingClientRect();E.burst(r.left+z.x*r.width/W,r.top+z.y*r.height/H,{kind:'sparkle',n:10,power:.4});}});
};

/* ---------- Valley kitchen: follow the recipe, stir, cook it over the fire and serve a hungry dinosaur ---------- */
/* A dinosaur's larder, so every ingredient is something the valley actually
 * grows and every one of them is a photograph the universe already has. Note
 * that the berry, fish, leaf and pine families are each *one* picture, so a
 * dish never lists two glyphs of the same family — that would show the child
 * the same thing twice under two different names. */
const DISHES=[
 {n:'fern and berry salad',ing:['🌿','🍓','💧'],result:'🧺',bake:false},
 {n:'claypot fish stew',ing:['🐟','🌿','🍄'],result:'🏺',bake:true},
 {n:'wild berry crush',ing:['🍓','🍯','🌰'],result:'🧺',bake:false},
 {n:'warm egg pudding',ing:['🥚','🍯','🌾'],result:'🍳',bake:true},
 {n:'pine cone roast',ing:['🌰','🌲','🍂'],result:'🧺',bake:true},
 {n:'mushroom and moss bake',ing:['🍄','☘️','🌱'],result:'🏺',bake:true},
 {n:'berry nest cup',ing:['🍓','🌿','🥚'],result:'🪹',bake:true},
 {n:'soft leaf mash',ing:['🍂','🌱','💧'],result:'🏺',bake:false},
 {n:'fish and seeds',ing:['🐟','🌾','🌵'],result:'🧺',bake:true},
 {n:'ginkgo and honey treat',ing:['🪻','🍯','🌱'],result:'🪹',bake:false}
];
const PANTRY=['🍓','🌿','🍂','🌱','🌰','🌲','🌵','🌾','☘️','🍄','🐟','🪻','🪴','🥚','🍯','💧'];
const ING_NAME={'🍓':'berries','🌿':'a fern leaf','🍂':'a dry leaf','🌱':'a green sprout','🌰':'a seed cone','🌲':'a pine branch','🌵':'a cycad frond','🌾':'a seed head','☘️':'a moss cup','🍄':'a mushroom','🐟':'a little fish','🪻':'a ginkgo leaf','🪴':'an ivy leaf','🥚':'an egg','🍯':'honey','💧':'cool water'};
games.cook=g=>{
 const dish=DISHES[(g.level*2+g.round)%DISHES.length];
 const recipe=g.round===2?[...dish.ing,dish.ing[1]]:dish.ing;
 const hidden=g.round>=3;
 g.say(`Let's make ${dish.n}!`);
 const card=el('div','recipe');g.play.append(card);
 const kitchen=el('div','kitchen');g.play.append(kitchen);
 const bowl=el('div','cook-bowl','<div class="bowl-in"></div><span class="bowl-rim"></span>');
 const dinoEl=D_dino(SPECIES_BY_LEVEL[(g.level+1)%5],{state:'idle',size:150});
 const guest=el('div','guest');guest.append(dinoEl,el('div','guest-say','hungry!'));
 kitchen.append(bowl,guest);
 const controls=el('div','controls-row');g.play.append(controls);
 let at=0,peek=!hidden;
 const bowlIn=bowl.querySelector('.bowl-in');
 const drawCard=()=>{
  card.innerHTML=`<b class="recipe-title">${dish.n}</b><span class="recipe-items">${recipe.map((x,i)=>`<span class="ri ${i<at?'done':i===at?'now':''}">${peek||i<at?x:'❓'}</span>`).join('')}</span>${hidden?'<button class="pill peek" aria-label="Peek at the recipe">👀 Peek</button>':''}`;
  const pk=card.querySelector('.peek');
  if(pk)pk.onclick=()=>{peek=true;drawCard();E.sfx('tap');g.later(()=>{peek=false;drawCard();},2200);};
 };
 drawCard();
 if(hidden){g.say(`Let's make ${dish.n}! Remember the recipe.`);peek=true;drawCard();g.later(()=>{peek=false;drawCard();},3200);}
 // phase 1: gather the ingredients
 const decoys=g.shuffle(PANTRY.filter(x=>!dish.ing.includes(x))).slice(0,g.easy?2:3);
 const opts=g.shuffle([...new Set(recipe),...decoys]);
 const shelf=el('div','shelf');controls.append(shelf);
 const btns=opts.map(x=>{
  const b=el('button','ingredient',x);b.setAttribute('aria-label',ING_NAME[x]||x);b.dataset.food=x;
  b.onclick=()=>{
   if(at>=recipe.length)return;
   if(x!==recipe[at]){g.wrong(b,{text:peek||!hidden?`Not yet! Next is ${ING_NAME[recipe[at]]}.`:'Not that one. Peek at the recipe!',speech:'Not that one.'});return;}
   b.classList.add('busy');
   g.fly(b,bowl,x).then(()=>{
    b.classList.remove('busy');
    bowlIn.append(el('span','bi',x));E.sfx('splash');E.step(at,.18);
    at++;drawCard();g.right(bowl,{kind:'sparkle',n:6,text:false,pitch:at-1});
    if(at===recipe.length)g.later(stir,500);
    else if(!hidden)g.speak(`Now add ${ING_NAME[recipe[at]]}.`);
   });
  };
  shelf.append(b);return b;
 });
 g.onAssist(()=>{if(at<recipe.length)g.hint(btns.find(b=>b.dataset.food===recipe[at]));});
 // phase 2: stir
 function stir(){
  controls.innerHTML='';g.say('Now stir it all together! Tap the stick.');
  let n=0;const need=g.easy?4:6;
  const stick=el('button','stir','🪵');stick.setAttribute('aria-label','wooden stirring stick');const meter=el('div','want',`Stir: <span id="stirs">0</span> / ${need}`);
  controls.append(stick,meter);
  g.onAssist(()=>g.hint(stick));
  stick.onclick=()=>{
   n++;meter.querySelector('#stirs').textContent=n;E.sfx('whoosh');E.step(n,.12);
   bowl.classList.remove('stirring');void bowl.offsetWidth;bowl.classList.add('stirring');
   E.animate(stick,[{transform:'rotate(0)'},{transform:'rotate(-30deg) translateX(-14px)'},{transform:'rotate(30deg) translateX(14px)'},{transform:'rotate(0)'}],{duration:420});
   E.burstAt(bowl,{kind:'sparkle',n:4});
   if(n>=need){stick.disabled=true;g.later(()=>dish.bake?hearthServe():serve(),500);}
  };
 }
 // phase 3: cook it over the fire
 function hearthServe(){
  controls.innerHTML='';g.say('Set it on the fire! Tap the hearth.');
  const hearth=el('button','hearth','<span class="hearth-fire"></span><span class="hearth-label">🔥 Fire pit</span>');controls.append(hearth);
  g.onAssist(()=>g.hint(hearth));
  hearth.onclick=()=>{
   hearth.disabled=true;hearth.classList.add('baking');E.sfx('whoosh');bowl.classList.add('away');
   const t=el('div','want','Cooking… 🔥');controls.append(t);
   g.speak('Cooking on the fire!');
   g.later(()=>{hearth.classList.remove('baking');hearth.classList.add('done');t.textContent='Ready! ✨';E.sfx('good');E.step(7,.3);bowlIn.innerHTML=`<span class="bi big">${dish.result}</span>`;bowl.classList.remove('away');g.later(serve,900);},2600);
  };
 }
 // phase 4: serve
 function serve(){
  controls.innerHTML='';
  bowlIn.innerHTML=`<span class="bi big">${dish.result}</span>`;
  g.say(`Your ${dish.n} is ready! Give it to your friend.`);
  const plate=el('button','serve',`Serve ${dish.result}`);controls.append(plate);
  g.onAssist(()=>g.hint(plate));
  plate.onclick=()=>{
   plate.disabled=true;
   const m=guest.getBoundingClientRect();
   g.fly(bowl,{x:m.left+m.width*.55,y:m.top+m.height*.35},dish.result).then(()=>{
    safe2(()=>window.DUFX.dinoState(dinoEl,'eat',1200));E.sfx('chomp');E.burstAt(guest,{kind:'sparkle',n:10});
    bowlIn.innerHTML='';guest.querySelector('.guest-say').textContent='yum!';
    g.later(()=>{safe2(()=>window.DUFX.dinoState(dinoEl,'happy'));E.sfx('roar');g.speak('Yum! Delicious!');g.right(guest,{kind:'stars',n:16,text:'Yummy!'});g.win({delay:2000});},900);
   });
  };
 }
};

/* ---------- Dress up: get Dino ready for the day in the valley, then style it freely and take a photo ---------- */
/* The old wardrobe was a holiday shop: sunglasses, a graduation cap, mittens
 * and ice cream, on a dinosaur. These are things the valley has, every one of
 * them a photograph, and no family appears in two slots — a shell hat and a
 * shell visor would be the same picture on two parts of the same animal. */
const WARDROBE={
 '🪶':{slot:'hat',name:'feather crest'},'🌺':{slot:'hat',name:'wildflower'},'🌰':{slot:'hat',name:'seed cone cap'},'☘️':{slot:'hat',name:'moss hat'},'🐚':{slot:'hat',name:'shell hat'},
 '🌿':{slot:'face',name:'fern veil'},'🪻':{slot:'face',name:'ginkgo shades'},'💎':{slot:'face',name:'quartz monocle'},'🌈':{slot:'face',name:'rainbow visor'},
 '📿':{slot:'neck',name:'bone beads'},'🪢':{slot:'neck',name:'knotted cord'},'🟠':{slot:'neck',name:'amber pendant'},
 '🧺':{slot:'hold',name:'basket'},'🎒':{slot:'hold',name:'satchel'},'🥁':{slot:'hold',name:'hide drum'},'💡':{slot:'hold',name:'oil lamp'},'🏺':{slot:'hold',name:'clay pot'},'🥌':{slot:'hold',name:'round stone'}
};
const SCENARIOS=[
 {id:'river',icon:'🌊',say:'Dino is paddling in the river! What will Dino need?',need:['🌿','🐚','🧺']},
 {id:'night',icon:'🌙',say:'It is growing dark in the valley! What will light Dino the way?',need:['📿','🪶','💡']},
 {id:'feast',icon:'🍯',say:'It is the valley feast! What will Dino bring?',need:['🌺','🏺','🥁']},
 {id:'learn',icon:'📜',say:'Dino is off to the elders for lessons! What does Dino take?',need:['🌰','🪻','🎒']},
 {id:'walk',icon:'☀️',say:'Dino is setting off on a long walk! What goes in the bag?',need:['🪢','🥌','🧺']}
];
const SLOT_XY={face:[345,160,44],hat:[318,105,70],neck:[296,222,50],hold:[262,296,54]};
const SLOT_XY_LONG={face:[336,72,40],hat:[316,24,66],neck:[285,140,50],hold:[262,296,54]};
games.dress=g=>{
 const free=g.round===4;
 const sc=SCENARIOS[(g.level+g.round)%5];
 const need=g.easy?sc.need.slice(0,2):sc.need;
 const long=g.level%12===0;
 const xy=long?SLOT_XY_LONG:SLOT_XY;
 g.say(free?'Free dress-up! Choose your favourite things, then take a photo.':sc.say);
 const scene=el('div','dress-scene');scene.append(el('span','dress-tag',free?'🌈':sc.icon));g.play.append(scene);
 const box=el('div','dress-dino',dinoSVG(g.level,['#76c7a2','#ebac7f','#aa9cda','#79b8d3','#dc9bb6'][g.level%5]));scene.append(box);
 const worn={};
 const place=(item)=>{
  const w=WARDROBE[item],[x,y,s]=xy[w.slot];
  worn[w.slot]?.remove();
  const e=el('span','worn '+w.slot,item);e.style.cssText=`left:${x/420*100}%;top:${y/360*100}%;font-size:${s/420*100}cqw`;
  box.append(e);worn[w.slot]=e;e.dataset.item=item;
  E.animate(e,[{transform:'translate(-50%,-90%) scale(.2)'},{transform:'translate(-50%,-50%) scale(1.3)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:420});
 };
 const take=slot=>{if(worn[slot]){worn[slot].remove();delete worn[slot];}};
 const options=free?Object.keys(WARDROBE):g.shuffle([...need,...g.shuffle(Object.keys(WARDROBE).filter(k=>!sc.need.includes(k))).slice(0,g.easy?3:4)]);
 const checklist=el('div','checklist');
 if(!free)need.forEach(n=>checklist.append(el('span','chk',`<i>❔</i>`)));
 const wardrobe=el('div','wardrobe');
 let got=0,photo=null;
 const btns=options.map(item=>{
  const w=WARDROBE[item];
  const b=el('button','wear',`<span>${item}</span><small>${w.name}</small>`);b.setAttribute('aria-label',w.name);b.dataset.item=item;
  b.onclick=()=>{
   if(free){
    if(worn[w.slot]?.dataset.item===item){take(w.slot);b.classList.remove('on');E.sfx('whoosh');return;}
    wardrobe.querySelectorAll(`.wear.on`).forEach(x=>{if(WARDROBE[x.dataset.item].slot===w.slot)x.classList.remove('on');});
    place(item);b.classList.add('on');E.sfx('pop');g.right(box,{kind:'sparkle',n:8,text:false,pitch:Object.keys(worn).length});
    camBtn.disabled=Object.keys(worn).length<3;
    return;
   }
   if(b.classList.contains('on')){take(w.slot);b.classList.remove('on');got--;const i=need.indexOf(item);const c=checklist.children[i];c.classList.remove('ok');c.innerHTML='<i>❔</i>';return;}
   if(!need.includes(item)){
    place(item);E.sfx('boing');
    const bad=worn[w.slot];setTimeout(()=>{if(bad&&bad.isConnected&&bad.dataset.item===item){bad.remove();if(worn[w.slot]===bad)delete worn[w.slot];}},650);
    g.wrong(b,{text:`Dino does not need ${withArticle(w.name)} for this. Try something else!`,speech:'Dino does not need that.'});return;
   }
   place(item);b.classList.add('on');got++;
   const c=checklist.children[need.indexOf(item)];c.classList.add('ok');c.innerHTML=`<i>${item}</i>`;
   g.right(box,{kind:'sparkle',n:10,text:false,pitch:got-1});g.speak(withArticle(w.name));
   if(got===need.length){
    wardrobe.classList.add('locked');E.sfx('sparkle');
    const kind={river:'bubbles',night:'stars',feast:'confetti',learn:'leaves',walk:'dust'}[sc.id];
    g.later(()=>{E.burstAt(box,{kind,n:30});E.sfx('roar');g.speak('Perfect! Dino looks great!');g.win({delay:2100});},500);
   }
  };
  wardrobe.append(b);return b;
 });
 const camBtn=el('button','pill primary','📸 Take a photo');camBtn.disabled=true;
 if(free){
  camBtn.onclick=()=>{
   camBtn.disabled=true;wardrobe.classList.add('locked');
   const flash=el('div','flash');g.play.append(flash);setTimeout(()=>flash.remove(),600);E.sfx('whoosh');setTimeout(()=>E.sfx('good'),160);
   const pol=el('div','polaroid',`<div class="pol-pic">${box.outerHTML}</div><b>My fabulous dinosaur!</b>`);pol.querySelector('.dress-dino')?.classList.add('still');
   g.later(()=>{g.play.append(pol);E.sfx('sparkle');E.burstAt(pol,{kind:'confetti',n:34});g.speak('What a fabulous dinosaur!');g.win({delay:3200});},500);
  };
  g.play.append(wardrobe,camBtn);
  g.onAssist(()=>{});
 }else{
  scene.after(checklist);g.play.append(wardrobe);
  g.onAssist(()=>{const b=btns.find(b=>need.includes(b.dataset.item)&&!b.classList.contains('on'));if(b)g.hint(b);});
 }
};

/* ---------- Dino music: a real xylophone and a dancing band. Follow the glow, listen and copy, then write your own song. ---------- */
const BAR_NAMES=['Do','Re','Mi','Fa','So','La','Ti','Do'];
const TUNES={
 hot:{name:'Hot Cross Buns',seq:[2,1,0]},row:{name:'Row, Row, Row Your Boat',seq:[0,0,0,1,2]},
 twinkle:{name:'Twinkle, Twinkle',seq:[0,0,4,4,5,5,4]},mary:{name:'Mary Had a Little Lamb',seq:[2,1,0,1,2,2,2]},ode:{name:'Ode to Joy',seq:[2,2,3,4,4,3,2,1]}
};
const TUNE_SETS=[['hot','twinkle'],['row','mary'],['hot','ode'],['row','twinkle'],['hot','mary']];
games.music=g=>{
 const mode=['follow','listen','follow','listen','compose'][g.round];
 const [short,long]=TUNE_SETS[g.level%5];
 const tune=mode==='follow'?TUNES[g.round===0?short:long]:null;
 let seq=tune?tune.seq:null;
 if(mode==='listen'){const len=g.easy?3:g.round===1?4:5;seq=Array.from({length:len},()=>Math.floor(Math.random()*5));}
 const COMPOSE=g.easy?6:8;
 g.say(mode==='follow'?`Play ${tune.name}! Tap the glowing bars.`:mode==='listen'?'Listen to the tune, then play it back!':`Write your own song! Play ${COMPOSE} notes.`);
 // the dancing band
 const band=el('div','band');
 const sp=['trex','tricera','stego'];
 const dancers=sp.map((s,i)=>{const d=D_dino(s,{state:'idle',size:96});const w=el('div','dancer');w.append(d);band.append(w);return d;});
 g.play.append(band);
 const status=el('div','want','');g.play.append(status);
 const xylo=el('div','xylo');
 const bars=BAR_NAMES.map((n,i)=>{
  const b=el('button','bar',`<span>${i+1}</span><small>${n}</small>`);b.style.setProperty('--c',colours[i%12===7?0:i][1]);b.style.setProperty('--h',`${190-i*12}px`);b.setAttribute('aria-label',`${n} ${i+1}`);
  xylo.append(b);return b;
 });
 g.play.append(xylo);
 let dn=0;
 const sound=(i,quiet)=>{
  E.sfx('note',i,.45);
  const b=bars[i];b.classList.add('ping');setTimeout(()=>b.classList.remove('ping'),260);
  E.animate(b,[{transform:'translateY(0)'},{transform:'translateY(6px)'},{transform:'translateY(0)'}],{duration:220});
  if(!quiet)E.burstAt(b,{kind:'notes',n:2,scale:.9,power:.6});
  const d=dancers[dn++%3];safe2(()=>window.DUFX.dinoState(d,'happy',420));
 };
 const lockBars=on=>xylo.classList.toggle('locked',on);
 const playSeq=(arr,gap,done)=>{
  lockBars(true);
  arr.forEach((n,i)=>g.later(()=>{bars[n].classList.add('glow');sound(n,true);g.later(()=>bars[n].classList.remove('glow'),gap*.7);},300+i*gap));
  g.later(()=>{lockBars(false);done&&done();},300+arr.length*gap);
 };
 let idx=0,played=[];
 const glowNext=()=>{bars.forEach(b=>b.classList.remove('glow'));if(mode==='follow'&&idx<seq.length)bars[seq[idx]].classList.add('glow');};
 const startListen=()=>{status.textContent='👂 Listen…';idx=0;playSeq(seq,560,()=>{status.textContent=`🎶 Your turn! ${seq.length} notes`;});};
 bars.forEach((b,i)=>b.onclick=()=>{
  if(xylo.classList.contains('locked'))return;
  sound(i);
  if(mode==='compose'){
   played.push(i);status.textContent=`🎵 ${played.length} / ${COMPOSE} notes`;
   if(played.length>=COMPOSE){
    lockBars(true);g.later(()=>{status.textContent='Listen to your song! 🎶';g.speak('Listen to your song!');playSeq(played,440,()=>{E.sfx('roar');E.burstAt(band,{kind:'confetti',n:28});g.right(band,{kind:'stars',n:16,text:'Wonderful song!'});g.win({delay:1900});});},500);
   }
   return;
  }
  if(i!==seq[idx]){
   g.wrong(b,{text:mode==='follow'?'Try the glowing bar!':'Almost! Listen again.',speech:mode==='follow'?'Try the glowing bar.':'Listen again.'});
   if(mode==='listen'){idx=0;g.later(startListen,1000);}return;
  }
  idx++;g.right(b,{kind:'notes',n:6,text:false,pitch:idx});
  if(mode==='follow')glowNext();
  if(mode==='listen')status.textContent=`🎶 ${idx} / ${seq.length}`;
  if(idx===seq.length){lockBars(true);bars.forEach(x=>x.classList.remove('glow'));g.later(()=>{E.sfx('roar');dancers.forEach(d=>safe2(()=>window.DUFX.dinoState(d,'happy',1500)));E.burstAt(band,{kind:'confetti',n:24});g.win({delay:1800});},400);}
 });
 // keyboard: 1-8
 const keys=e=>{if(!g.alive()){removeEventListener('keydown',keys);return;}const n=+e.key;if(n>=1&&n<=8)bars[n-1].click();};
 addEventListener('keydown',keys);
 if(mode==='follow'){status.textContent=`🎶 ${tune.name}`;glowNext();g.later(()=>playSeq(seq,520,()=>{glowNext();}),600);}
 else if(mode==='listen')g.later(startListen,700);
 else status.textContent=`🎵 0 / ${COMPOSE} notes`;
 g.onAssist(()=>{if(mode==='listen'){playSeq(seq.slice(idx),520);}else if(seq)g.hint(bars[seq[idx]]);});
};

/* ---------- Trail tracing: guide a running dinosaur along a path with your finger, collecting stars on the way ---------- */
const TW=800,TH=320;
const TRAILS=[
 ['a gentle wave',(t,l)=>[60+t*680,160+Math.sin(t*Math.PI*3+l*.5)*85]],
 ['a zigzag',(t,l)=>{const k=t*(4+l%2);const tri=Math.abs((k%1)*2-1)*2-1;return [60+t*680,160+tri*(105-l*4)];}],
 ['loop-the-loops',(t,l)=>{const p=t*Math.PI*6;return [70+t*650+Math.sin(p)*60,165+Math.cos(p)*58-(t>.5?0:0)];}],
 ['the big hills',(t,l)=>[60+t*680,265-Math.abs(Math.sin(t*Math.PI*(2.5+l%2*.5)))*190]],
 ['a spiral',(t,l)=>{const p=t*Math.PI*(3.4+l%2*.4)+l;const r=140*(1-t)+16;return [400+Math.cos(p+Math.PI)*r*1.5,160+Math.sin(p+Math.PI)*r];}]
];
games.trace=g=>{
 const [tname,fn]=TRAILS[g.round];
 // sample the trail by arc length so points are evenly spaced however the curve bends
 const dense=Array.from({length:801},(_,i)=>fn(i/800,g.level)),cum=[0];
 for(let i=1;i<dense.length;i++)cum.push(cum[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
 const N=Math.max(60,Math.min(160,Math.round(cum[800]/10))),pts=[];
 for(let i=0,j=0;i<=N;i++){const want=cum[800]*i/N;while(j<800&&cum[j+1]<want)j++;const k=Math.min(800,j+1),f=cum[k]>cum[j]?(want-cum[j])/(cum[k]-cum[j]):0;pts.push([dense[j][0]+(dense[k][0]-dense[j][0])*f,dense[j][1]+(dense[k][1]-dense[j][1])*f]);}
 const d='M'+pts.map(p=>p.map(v=>v.toFixed(1)).join(' ')).join('L');
 g.say(`Follow ${tname}! Drag your finger along the dots.`);
 const wrap=el('div','trace-box');wrap.style.setProperty('--ar',`${TW}/${TH}`);
 wrap.innerHTML=`<svg viewBox="0 0 ${TW} ${TH}" aria-label="Trail to trace"><defs><linearGradient id="rb${g.round}" x1="0" x2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".25" stop-color="#ffb347"/><stop offset=".5" stop-color="#ffe066"/><stop offset=".75" stop-color="#6bcb77"/><stop offset="1" stop-color="#4d96ff"/></linearGradient></defs><path class="t-track" d="${d}"/><path class="t-guide" d="${d}"/><path class="t-done" id="tdone" d="${d}" stroke="url(#rb${g.round})"/></svg>`;
 g.play.append(wrap);
 const svg=wrap.querySelector('svg'),done=wrap.querySelector('#tdone');
 const len=done.getTotalLength();done.style.strokeDasharray=`0 ${len}`;
 const nStars=g.easy?4:6,starAt=Array.from({length:nStars},(_,i)=>Math.round((i+1)*N/(nStars+1)));
 const starEls=starAt.map(i=>{const s=el('span','t-star','⭐');s.style.left=pts[i][0]/TW*100+'%';s.style.top=pts[i][1]/TH*100+'%';wrap.append(s);return s;});
 const flag=el('span','t-flag','🏁');flag.style.left=pts[N][0]/TW*100+'%';flag.style.top=pts[N][1]/TH*100+'%';wrap.append(flag);
 const dino=D_dino(SPECIES_BY_LEVEL[(g.level+g.round)%5],{state:'idle',size:84});
 const runner=el('div','runner');runner.append(dino);wrap.append(runner);
 const place=i=>{runner.style.left=pts[i][0]/TW*100+'%';runner.style.top=pts[i][1]/TH*100+'%';};
 const counter=el('div','want','⭐ 0');counter.id='tstars';g.play.append(counter);
 let prog=0,down=false,got=0,calm=0,finished=false;
 place(0);
 const toPt=e=>{const r=svg.getBoundingClientRect();return [(e.clientX-r.left)*TW/r.width,(e.clientY-r.top)*TH/r.height];};
 const tol=g.easy?62:50;
 const advance=p=>{
  let best=-1,bd=1e9;
  for(let j=prog;j<=Math.min(N,prog+14);j++){const dd=Math.hypot(p[0]-pts[j][0],p[1]-pts[j][1]);if(dd<bd){bd=dd;best=j;}}
  if(best<0||bd>tol)return false;
  if(best>prog){prog=best;render();return true;}
  return true;
 };
 const render=()=>{
  done.style.strokeDasharray=`${len*prog/N} ${len}`;place(prog);
  safe2(()=>window.DUFX.dinoState(dino,'run'));clearTimeout(render.t);render.t=setTimeout(()=>safe2(()=>window.DUFX.dinoState(dino,prog>=N?'happy':'idle')),350);
  starAt.forEach((si,k)=>{if(prog>=si&&!starEls[k].classList.contains('got')){starEls[k].classList.add('got');got++;counter.textContent=`⭐ ${got}`;E.sfx('star');E.step(k,.2);E.burstAt(starEls[k],{kind:'stars',n:8});E.floatText(centreAt(starEls[k]).x,centreAt(starEls[k]).y-10,'+1');}});
  if(prog>=N-1&&!finished){
   finished=true;down=false;
   g.right(runner,{kind:'confetti',n:24,text:false});E.sfx('sparkle');safe2(()=>window.DUFX.dinoState(dino,'happy'));flag.classList.add('wave');
   if(got===nStars)g.later(()=>g.bonus(runner,'All the stars!'),300);
   g.win({delay:got===nStars?2300:1800});
  }
 };
 const centreAt=e=>{const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};};
 svg.onpointerdown=e=>{
  if(finished)return;e.preventDefault();
  const p=toPt(e);
  if(Math.hypot(p[0]-pts[prog][0],p[1]-pts[prog][1])>110){g.note(prog?'Put your finger back on the dinosaur to carry on!':'Start with your finger on the dinosaur!');g.speak('Start at the dinosaur.');E.animate(runner,[{transform:'translate(-50%,-90%) scale(1)'},{transform:'translate(-50%,-90%) scale(1.2)'},{transform:'translate(-50%,-90%) scale(1)'}],{duration:400});return;}
  down=true;try{svg.setPointerCapture(e.pointerId);}catch{}advance(p);
 };
 svg.onpointermove=e=>{
  if(!down||finished)return;
  const p=toPt(e);
  if(!advance(p)){
   // wandered away: gently pause, never penalise
   if(++calm%25===1){g.note('Come back to the dots. The dinosaur is waiting!');}
  }else calm=0;
 };
 svg.onpointerup=svg.onpointercancel=()=>{down=false;};
 const reset=el('button','pill','↻ Start the trail again');reset.onclick=()=>{if(finished)return;prog=0;got=0;counter.textContent='⭐ 0';starEls.forEach(s=>s.classList.remove('got'));render();E.sfx('whoosh');};
 g.play.append(reset);
 g.onAssist(()=>{E.burst(...(()=>{const c=centreAt(runner);return [c.x,c.y,{kind:'sparkle',n:12,power:.5}];})());});
};
//__NEXT__
