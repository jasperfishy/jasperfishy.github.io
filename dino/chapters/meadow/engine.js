// Dino Meadow play engine: layered scenery, wandering friends, streaks, star ratings and the growing meadow.
// Every game in games.js receives a context `g` from beginRound() and talks to the child through it.
import {shuffle} from './catalog.js?v=du-276e018775e133bb';

const D=()=>window.DUFX||{};
const safe=fn=>{try{return fn();}catch{}};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const $=s=>document.querySelector(s);
export const sfx=(name,...a)=>safe(()=>D().sfx[name](...a));
export const burst=(x,y,o)=>safe(()=>D().burst(x,y,o));
export const floatText=(x,y,t,o)=>safe(()=>D().floatText(x,y,t,o));
export const animate=(el,frames,opt)=>el&&safe(()=>D().anim(el,frames,opt));
export const centreOf=el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r};};
export const noise=(...a)=>safe(()=>D().noise(...a));
export const burstAt=(el,o)=>{if(!el)return;const c=centreOf(el);burst(c.x,c.y,o);return c;};
const SCALE=[523,587,659,784,880,1047,1175,1319];
export const step=(i,len=.25)=>safe(()=>D().tone(SCALE[((i%8)+8)%8],len,'triangle',.13));
export const oops=()=>safe(()=>{D().tone(392,.2,'sine',.09,0,311);D().tone(330,.26,'sine',.08,.14,262);});
export const PRAISE=['Lovely!','Wonderful!','Brilliant!','Super!','You did it!','Hooray!','Clever you!'];
const KIND_LINES=['Almost! Have another little look.','Hmm, try another one!','Nearly there. You can do it!','Ooh, not that one. Try again!'];
export const SPECIES=['trex','tricera','stego','bronto','raptor','ptero'];
export const SPECIES_NAMES=['T-rex','Triceratops','Stegosaurus','Brontosaurus','Raptor','Pterodactyl'];
// family-ok: the bed is scattered for density, the way a real meadow is many of
// one bloom — a child reads it as "lots of flowers", never as a choice of eight.
// The reward slot is the opposite case and so picks from BLOOMS below.
export const FLOWERS=['🌼','🌸','🌷','🌻','🌺','💐','🌹','🪻'];
/* This universe photographs exactly two different flowers, so a reward that
 * promised eight kinds would have shown one picture eight times over. Two real
 * specimens, chosen per round, is what a child can actually tell apart. */
export const BLOOMS=['🌼','🪻'];

/* ---------- scenery ---------- */
// family-ok: the deco bands are the trees and blooms standing in the picture,
// not things a child is asked to tell apart, and a wood of four pines is a wood.
export const THEMES=[
 {name:'Sunny meadow',sky:['#92d9f0','#f3fbe0'],far:'#97d6a2',mid:'#74c58a',near:'#53b074',sun:true,species:0,deco:['🌳','🌼','🌳']},
 {name:'Berry forest',sky:['#b9e3c6','#eef6d2'],far:'#7fc29a',mid:'#5fae86',near:'#3f9a72',sun:true,species:1,deco:['🌲','🍓','🌳','🍄']},
 {name:'Rainbow river',sky:['#9fd6ff','#eaf6ff'],far:'#8bd1b0',mid:'#63bfa0',near:'#41a58a',rainbow:true,species:2,deco:['🌴','🌷','🪷']},
 {name:'Starry valley',sky:['#3f4a94','#a98bd9'],far:'#586fb0',mid:'#455f98',near:'#335081',stars:true,species:3,deco:['🌲','🌙','🍄']},
 {name:'Flower island',sky:['#ffd1e4','#fff5da'],far:'#efb3cf',mid:'#8fd1a0',near:'#5fbb83',sun:true,species:4,deco:['🌸','🌷','🌺','🌻']}
];
function hill(color,amp,k,base,ph){
 let d='M0 400';
 for(let x=0;x<=800;x+=10)d+=`L${x} ${(base+amp*Math.sin(2*Math.PI*k*x/800+ph)).toFixed(1)}`;
 d+='L800 400Z';
 return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400' preserveAspectRatio='none'><path d='${d}' fill='${color}'/></svg>`).replace(/'/g,'%27')}')`;
}
export function scenery(level,garden){
 const name=['jungle','jungle','night','ice','jungle'][level%5];
 const url=new URL('../../assets/environments/'+name+'.webp',import.meta.url).href;
 return `<div class="backdrop photo-backdrop" style="background-image:url('${url}')"></div>`;
}
function walkerHTML(level){
 const sp=SPECIES[THEMES[level%5].species];
 return `<div class="walker" aria-hidden="true">${D().dinoHTML?D().dinoHTML(sp,{state:'walk',size:96}):''}</div>`;
}
export function stageHTML(level,rounds){
 const garden=loadGarden();
 return `<section id="stage" class="stage scene" aria-label="Game area">${scenery(level,garden)}<div class="hud"><span class="chip" id="hud-round"></span><span class="chip streak hidden" id="hud-streak"></span><span class="chip" id="hud-stars">⭐ 0</span></div><div id="play" class="play"></div><div class="grow" aria-hidden="true">${Array.from({length:rounds},()=>'<span class="slot">🌱</span>').join('')}</div><div class="lane">${walkerHTML(level)}</div><div id="reveal" class="reveal" aria-hidden="true"></div></section>`;
}

/* ---------- the growing meadow (kept in this browser only) ---------- */
const GKEY='dm-garden',SKEY='dm-stars';
export function loadGarden(){
 try{const g=JSON.parse(localStorage.getItem(GKEY)||'null');if(g&&typeof g==='object')return {flowers:Math.max(0,Math.min(999,g.flowers|0)),butterflies:Math.max(0,Math.min(99,g.butterflies|0)),babies:Array.isArray(g.babies)?g.babies.filter(n=>Number.isInteger(n)&&n>=0&&n<SPECIES.length).slice(-30):[]};}catch{}
 return {flowers:0,butterflies:0,babies:[]};
}
export function saveGarden(g){try{localStorage.setItem(GKEY,JSON.stringify(g));}catch{}}
export function loadStars(){try{const s=JSON.parse(localStorage.getItem(SKEY)||'{}');return s&&typeof s==='object'?s:{};}catch{return {};}}
export function bestStars(id){return Math.max(0,Math.min(3,Number(loadStars()[id])|0));}
function saveStars(id,n){const s=loadStars();if((Number(s[id])|0)<n){s[id]=n;try{localStorage.setItem(SKEY,JSON.stringify(s));}catch{}}}
export function restoreExtras(data){
 try{
  if(data.garden){const g=loadGarden(),o=data.garden;saveGarden({flowers:Math.max(g.flowers,o.flowers|0),butterflies:Math.max(g.butterflies,o.butterflies|0),babies:g.babies.length>=(o.babies||[]).length?g.babies:o.babies});}
  if(data.stars&&typeof data.stars==='object')for(const [k,v] of Object.entries(data.stars))if(/^[a-z]+-\d$/.test(k))saveStars(k,Math.min(3,Number(v)|0));
 }catch{}
}
export function extrasForBackup(){return {garden:loadGarden(),stars:loadStars()};}
const hash=i=>{let h=(i+1)*2654435761>>>0;h^=h>>>13;h=Math.imul(h,1274126177)>>>0;return h;};
export function meadowPanel(){
 const g=loadGarden();
 const nf=Math.min(g.flowers,48);
 let flowers='';
 for(let i=0;i<nf;i++){const h=hash(i);flowers+=`<span class="mf" style="left:${2+h%96}%;bottom:${4+(h>>8)%30}px;font-size:${20+(h>>16)%16}px;animation-delay:${-(h%30)/10}s">${FLOWERS[h%FLOWERS.length]}</span>`;}
 let babies='';
 g.babies.slice(-8).forEach((sp,i)=>{babies+=`<button class="baby" data-baby="${sp}" style="left:${6+i*11}%;--w:${18+i%3*4}s;animation-delay:${-i*3}s" aria-label="Baby ${SPECIES_NAMES[sp]}">${D().dinoHTML?D().dinoHTML(SPECIES[sp],{state:'walk',size:64}):'🦕'}</button>`;});
 let bf='';
 for(let i=0;i<Math.min(g.butterflies,8);i++)bf+=`<span class="bf" style="--y:${10+i*8}%;--s:${14+i%4*4}s;animation-delay:${-i*4}s" aria-hidden="true">🦋</span>`;
 const empty=!g.flowers&&!g.butterflies&&!g.babies.length;
 return `<section class="meadow-panel" aria-label="My meadow"><div class="mp-scene">${scenery(0,{butterflies:0})}${bf}<div class="mp-flowers" aria-hidden="true">${flowers}</div><div class="mp-babies">${babies}</div></div><div class="mp-count"><strong>My growing meadow</strong><span>🌼 ${g.flowers}</span><span>🦋 ${g.butterflies}</span><span>🥚 ${g.babies.length} baby dinos</span></div>${empty?'<p class="mp-hint">Win games to plant flowers, find butterflies and hatch baby dinosaurs!</p>':''}</section>`;
}
export function wakeMeadow(root){
 root.querySelectorAll('.baby').forEach(b=>{b.onclick=()=>{const d=b.querySelector('.du-dino');safe(()=>D().dinoState(d,'happy',1300));sfx('chirp');burstAt(b,{kind:'hearts',n:8});};});
}

/* ---------- a session is one play-through of five rounds ---------- */
let env={},S=null;
export function setup(o){env=o;}
export function newSession(rounds=5){return S={rounds,roundStars:[],mistakes:0,roundMistakes:0,streak:0,bestStreak:0,collected:0};}
export const session=()=>S;
export function mountStage(){
 const w=$('.walker .du-dino');if(w)w.setAttribute('data-base','walk');
 const walker=$('.walker');if(walker)walker.onclick=()=>{const d=walker.querySelector('.du-dino');safe(()=>D().dinoState(d,'happy',1000));sfx('roar');};
}
function hud(){
 const r=$('#hud-round');if(r)r.textContent=`Round ${S.current} of ${S.rounds}`;
 const st=$('#hud-stars');if(st)st.textContent=`⭐ ${S.collected}`;
 const sk=$('#hud-streak');if(sk){if(S.streak>=2){sk.classList.remove('hidden');sk.textContent=`🔥 ${S.streak} in a row!`;animate(sk,[{transform:'scale(.7)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:320});}else sk.classList.add('hidden');}
}
function critter(state,ms){const d=$('.walker .du-dino');if(d)safe(()=>D().dinoState(d,state,ms));}
function speechBubble(text){
 const lane=$('.lane');if(!lane)return;
 lane.querySelectorAll('.think').forEach(n=>n.remove());
 const w=$('.walker');if(!w)return;
 const b=document.createElement('span');b.className='think';b.textContent=text;w.append(b);
 setTimeout(()=>b.remove(),1500);
}

/* ---------- the context handed to every game round ---------- */
export function beginRound(game,round,fn){
 const play=$('#play');if(!play)return;
 S.roundMistakes=0;S.current=round+1;
 play.className='play enter';play.innerHTML='';
 play.onanimationend=()=>play.classList.remove('enter');
 hud();
 const ep=env.epoch();
 let won=false,assist=null;
 const g={
  game,round,rounds:S.rounds,level:game.level,type:game.type,easy:env.settings().easy,play,
  stage:$('#stage'),
  n:game.level+round,
  alive:()=>env.epoch()===ep&&document.contains(play),
  say:text=>env.prompt(text),
  note:text=>env.feedback(text),
  speak:text=>env.speak(text),
  later:(fn,ms)=>env.later(fn,ms),
  shuffle,pick,
  mistakes:()=>S.roundMistakes,
  onAssist:fn=>{assist=fn;},
  /* run fn(dt seconds) every frame until the round ends */
  loop(fn){let last=performance.now();const tick=t=>{if(!g.alive()||won)return;const dt=Math.min(.05,(t-last)/1000);last=t;fn(dt);requestAnimationFrame(tick);};requestAnimationFrame(tick);},
  right(el,o={}){
   if(!g.alive())return;
   S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);
   step(o.pitch??S.streak-1);sfx('good');
   const c=el?burstAt(el,{kind:o.kind||'stars',n:o.n||9}):null;
   if(c&&o.text!==false)floatText(c.x,c.y-20,o.text||'+1',{color:'#ffe066'});
   if(el)animate(el,[{transform:'scale(1)'},{transform:'scale(1.22) rotate(-4deg)'},{transform:'scale(1)'}],{duration:380});
   critter('happy',900);
   if(S.streak===3||S.streak===5||S.streak===8){
    S.collected++;sfx('star');
    const r=g.stage.getBoundingClientRect();burst(r.left+r.width/2,r.top+r.height*.35,{kind:'stars',n:16,power:1.1});
    floatText(r.left+r.width/2,r.top+r.height*.3,'Streak bonus! ⭐',{size:30});
    g.note(`${S.streak} in a row! A bonus star for you!`);
   }
   hud();
  },
  wrong(el,o={}){
   if(!g.alive())return;
   if(!o.soft){S.mistakes++;S.roundMistakes++;}S.streak=0;
   oops();
   if(el)animate(el,[{transform:'translateX(0) rotate(0)'},{transform:'translateX(-8px) rotate(-3deg)'},{transform:'translateX(7px) rotate(3deg)'},{transform:'translateX(-4px)'},{transform:'translateX(0)'}],{duration:360});
   /* Three thinking faces are three ways of typing the same idea, and this
    * universe draws faces only for the grown-ups in fx/du-people.js, so the
    * bubble shows what the dino actually says: have another little look. */
   critter('idle');speechBubble('🔍');
   g.note(o.text||pick(KIND_LINES));env.speak(o.speech||'Have another little look.');
   if(S.roundMistakes>=2&&assist)assist();
   hud();
  },
  /* an extra star for going the extra mile (collecting everything, a big combo...) */
  bonus(el,text='Bonus star!'){
   if(!g.alive())return;S.collected++;sfx('star');
   const c=el?centreOf(el):{x:innerWidth/2,y:innerHeight/2};
   burst(c.x,c.y,{kind:'stars',n:18,power:1.1});floatText(c.x,c.y-28,text+' ⭐',{size:30});hud();
  },
  /* glow a thing the child could tap next */
  hint(el){if(el&&!el.classList.contains('hint')){el.classList.add('hint');}},
  fly:(a,b,emoji)=>safe(()=>D().flyTo(a,b,{emoji,burst:false,size:34}))||Promise.resolve(),
  win(o={}){
   if(won||!g.alive())return;won=true;
   const stars=S.roundMistakes===0?3:S.roundMistakes<=1?2:1;
   S.roundStars.push(stars);S.collected+=stars;
   play.classList.add('done');
   const idx=S.roundStars.length-1;
   const slot=document.querySelectorAll('.grow .slot')[idx];
   if(slot){slot.textContent=pick(BLOOMS);slot.classList.add('on');}
   sfx('win');
   const rv=$('#reveal');
   if(rv){rv.innerHTML=`<div class="rv-text">${pick(PRAISE)}</div><div class="rv-stars">${[1,2,3].map(i=>`<span class="${i<=stars?'on':''}" style="animation-delay:${i*.14}s">⭐</span>`).join('')}</div>`;rv.classList.add('show');}
   const r=g.stage.getBoundingClientRect();
   burst(r.left+r.width/2,r.top+r.height*.4,{kind:['stars','hearts','sparkle','leaves','confetti'][idx%5],n:26,power:1.1});
   critter('happy',1500);
   env.speak(pick(PRAISE));g.note(`Lovely! ${stars===3?'Three':stars===2?'Two':'One'} star${stars>1?'s':''} for that one.`);
   hud();
   if(idx===1)g.later(()=>visitor(),500);
   if(idx===3)g.later(()=>parade(),500);
   g.later(()=>{if(rv)rv.classList.remove('show');env.next();},o.delay||1900);
  }
 };
 fn(g);
}

/* ---------- surprises that wander through the meadow ---------- */
function visitor(){
 const lane=$('.lane');if(!lane||!D().dino)return;
 const sp=pick(SPECIES.filter((_,i)=>i!==THEMES[(env.currentLevel?.()||0)%5].species));
 const d=D().dino(sp,{state:'run',size:110});
 const w=document.createElement('div');w.className='visitor';w.append(d);lane.append(w);
 sfx('roar');setTimeout(()=>sfx('chirp'),900);
 setTimeout(()=>{const c=centreOf(w);burst(c.x,c.y-30,{kind:'hearts',n:10});},1100);
 setTimeout(()=>w.remove(),3000);
}
function parade(){
 const st=$('#stage');if(!st)return;
 for(let i=0;i<5;i++){const b=document.createElement('span');b.className='parade';b.textContent='🦋';b.style.cssText=`top:${12+i*13}%;animation-delay:${i*.25}s`;st.append(b);setTimeout(()=>b.remove(),3200);}
 sfx('sparkle');
}

/* ---------- the finish: stars, a hatching egg, and a bigger meadow ---------- */
function eggSVG(){
 return `<svg viewBox="0 0 120 150" class="egg-svg" aria-hidden="true"><path d="M60 8C28 8 10 70 10 98c0 30 22 46 50 46s50-16 50-46C110 70 92 8 60 8Z" fill="#fff4d6" stroke="#285357" stroke-width="5"/><ellipse cx="38" cy="86" rx="9" ry="7" fill="#c5e8b2"/><ellipse cx="78" cy="68" rx="8" ry="6" fill="#f7b9a0"/><ellipse cx="72" cy="110" rx="10" ry="7" fill="#a8d6f2"/><ellipse cx="46" cy="52" rx="7" ry="5" fill="#f5dc85"/><path class="crack c1" d="M60 8l-8 24 14 12-12 20" fill="none" stroke="#285357" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path class="crack c2" d="M66 44l22 10-10 18 20 6" fill="none" stroke="#285357" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path class="crack c3" d="M54 64l-26 6 12 16-22 10" fill="none" stroke="#285357" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export function finish(game,labels){
 const play=$('#play');if(!play)return;
 const total=S.roundStars.reduce((a,b)=>a+b,0);
 const rating=S.mistakes<=2?3:S.mistakes<=6?2:1;
 saveStars(game.id,rating);
 const garden=loadGarden();
 const had=new Set(garden.babies);
 const choices=SPECIES.map((_,i)=>i).filter(i=>!had.has(i));
 const baby=choices.length?pick(choices):Math.floor(Math.random()*SPECIES.length);
 const gained={flowers:S.rounds,butterflies:rating===3?2:rating===2?1:0};
 garden.flowers=Math.min(999,garden.flowers+gained.flowers);
 garden.butterflies=Math.min(99,garden.butterflies+gained.butterflies);
 play.className='play enter finish';
 $('#hud-streak')?.classList.add('hidden');
 $('.grow')?.classList.add('all');
 const praise=labels?.title||'You did it!';
 play.innerHTML=`<div class="celebrate"><div class="finish-stars">${[1,2,3].map(i=>`<span class="${i<=rating?'on':''}" style="animation-delay:${.3+i*.35}s">⭐</span>`).join('')}</div><h2>${praise}</h2><p class="finish-sub">${S.collected} stars collected${S.bestStreak>=3?` · best streak ${S.bestStreak}`:''}</p><div class="egg-wrap"><button class="egg" id="egg" aria-label="Tap the egg to hatch it" data-cracks="0">${eggSVG()}</button><p id="egg-line" class="egg-line">A surprise egg! Tap it to hatch it.</p></div><div class="gain"><span>🌼 +${gained.flowers}</span>${gained.butterflies?`<span>🦋 +${gained.butterflies}</span>`:''}</div><div class="toolbar finish-buttons"><button class="pill primary" data-action="replay">▶ Play again</button><button class="pill yellow" data-action="surprise">🦕 Another game</button><button class="pill" data-action="home">🏡 My meadow</button></div></div>`;
 sfx('win');safe(()=>D().celebrate());
 [1,2,3].forEach(i=>{if(i<=rating)setTimeout(()=>{sfx('star');const el=play.querySelector(`.finish-stars span:nth-child(${i})`);if(el)burstAt(el,{kind:'sparkle',n:12});},300+i*350);});
 const egg=play.querySelector('#egg'),line=play.querySelector('#egg-line');
 let taps=0,hatched=false;
 egg.onclick=()=>{
  if(hatched)return;taps++;egg.dataset.cracks=String(taps);
  sfx(taps<3?'thud':'boing');animate(egg,[{transform:'rotate(0)'},{transform:'rotate(-8deg) scale(1.05)'},{transform:'rotate(8deg) scale(1.05)'},{transform:'rotate(0)'}],{duration:360});
  burstAt(egg,{kind:'dust',n:6});
  if(taps<3){line.textContent=taps===1?'Crack! Again!':'Nearly out! One more tap!';return;}
  hatched=true;
  garden.babies.push(baby);garden.babies=garden.babies.slice(-30);saveGarden(garden);
  egg.disabled=true;
  const holder=egg.parentElement;
  burstAt(egg,{kind:'confetti',n:34});burstAt(egg,{kind:'stars',n:14});sfx('roar');
  const d=D().dino?D().dino(SPECIES[baby],{state:'happy',size:150}):document.createElement('span');
  d.classList.add('hatch');
  egg.replaceWith(d);
  line.textContent=`A baby ${SPECIES_NAMES[baby]}! They live in your meadow now. ✨`;
  env.speak(`A baby ${SPECIES_NAMES[baby].replace('T-rex','T rex')}! They live in your meadow now.`);
  holder.querySelector('.du-dino')?.addEventListener('click',()=>{safe(()=>D().dinoState(d,'happy',900));sfx('chirp');});
 };
 // never lose the rewards if the egg is left alone
 saveGarden(garden);
 env.speak('You did it! Tap the egg to hatch it.');
}

export {shuffle,pick};
