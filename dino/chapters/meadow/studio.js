// The Dino Meadow art studio: colouring pages and the free drawing pad.
// Fill regions, draw with crayon / marker / rainbow / glitter brushes, press stamps, rub out, sparkle and finish.
import {colours} from './catalog.js?v=du-cd75bb4cc7df44ba';
import {dinosaurs,scenes,pageSVG} from './art.js?v=du-cd75bb4cc7df44ba';
import * as E from './engine.js?v=du-cd75bb4cc7df44ba';

/* ---------- storage (IndexedDB, this browser only) ---------- */
let dbPromise;
function db(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('dino-meadow-art',1);r.onupgradeneeded=()=>r.result.createObjectStore('pictures',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function artRead(id){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('pictures').objectStore('pictures').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function artWrite(value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('pictures','readwrite');tx.objectStore('pictures').put(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
export async function artList(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('pictures').objectStore('pictures').getAll();r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.time-a.time));r.onerror=()=>reject(r.error);});}

/* ---------- content ---------- */
/* A stamp is a thing a child presses into their picture, so every slot holds a
 * specimen the object layer can photograph. Two baby dinosaurs and two
 * sparkles were pairs of stamps no child could tell apart, and a heart and a
 * balloon are things this meadow has no picture of, so those four stamps are
 * now an ammonite, a moon, a feather and a snail. */
export const STAMPS=['🦕','🌀','🌸','🌟','🦋','🍄','🌈','☀️','🪶','🥚','🐾','🍓','🌳','🐚','🌙','🐌'];
const STAMP_SIZES=[58,96,150];
/* Brush choices are controls, not objects, so they take the drawn marks of
 * fx/du-icons.js: a crayon is the pencil and a marker the brush. */
const BRUSHES=[['pen','✏️','Crayon'],['marker','🖌️','Marker'],['rainbow','🌈','Rainbow'],['glitter','✨','Glitter']];
const BRUSH_SIZES={pen:[4,9,18],marker:[12,20,34],rainbow:[8,14,24],glitter:[8,14,24]};
const BGS=[['Paper','#ffffff'],['Sky','#d8f0ff'],['Meadow','#e2f6d0'],['Sunset','#ffe2c9'],['Sea','#bfe9ee'],['Night','#2d3b6e']];
export const PALETTE=[...colours,['Sky','#9fd8f5'],['Lime','#b8e04a'],['Gold','#f2b705'],['Magenta','#d6479b']];
const HEX=/^#[0-9a-f]{6}$/i;
const KINDS=['pen','marker','rainbow','glitter'];

/* ---------- drawing helpers shared by the canvas and the gallery thumbnails ---------- */
const seeded=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const pathOf=pts=>'M'+pts.map(p=>p.map(v=>Math.round(v*10)/10).join(',')).join('L');
const starPath=(x,y,r)=>`M${x} ${y-r}L${x+r*.28} ${y-r*.28}L${x+r} ${y}L${x+r*.28} ${y+r*.28}L${x} ${y+r}L${x-r*.28} ${y+r*.28}L${x-r} ${y}L${x-r*.28} ${y-r*.28}Z`;
function strokeSVG(s){
 const kind=s.kind||'pen',pts=s.points;
 if(kind==='rainbow'){let o='';for(let i=1;i<pts.length;i+=3){const seg=pts.slice(i-1,Math.min(pts.length,i+3));o+=`<path d="${pathOf(seg)}" stroke="hsl(${(i*9)%360} 90% 60%)" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;}return o||`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${s.width/2}" fill="hsl(0 90% 60%)"/>`;}
 let o=`<path d="${pathOf(pts)}" stroke="${s.colour}" stroke-width="${s.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"${kind==='marker'?' opacity=".6"':''}/>`;
 if(kind==='glitter')for(let i=0;i<pts.length;i+=3){const r=s.width*(.35+seeded(i)*.5);o+=`<path d="${starPath(pts[i][0]+(seeded(i+9)-.5)*s.width*1.6,pts[i][1]+(seeded(i+3)-.5)*s.width*1.6,r)}" fill="${seeded(i+5)>.5?'#fff':'#ffe066'}" stroke="${s.colour}" stroke-width="1"/>`;}
 return o;
}
/* A screen reader would call the ammonite stamp a cyclone and the dragonfly a
 * butterfly; the word fx/du-objects.js keeps for a photograph is the one a
 * child can match to the picture in front of them. */
const stampWord=s=>{const o=window.DUFX&&window.DUFX.objects;return (o&&o.word(s))||s;};
function stampSVG(st){
 const o=window.DUFX&&window.DUFX.objects,rot=`rotate(${st.r||0} ${st.x} ${st.y})`;
 /* A gallery thumbnail is SVG, so the stamp's photograph has to ride in as an
  * <image>; a stamp this universe cannot picture — an older saved heart, say —
  * keeps the glyph it was drawn with instead of vanishing from the wall. */
 const s=o&&o.slug(st.e);
 if(s)return `<image href="${o.file(s)}" x="${st.x-st.s/2}" y="${st.y-st.s/2}" width="${st.s}" height="${st.s}" transform="${rot}"/>`;
 return `<text x="${st.x}" y="${st.y}" font-size="${st.s}" text-anchor="middle" dominant-baseline="central" transform="${rot}" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,serif">${st.e}</text>`;
}
export function artSVG(a){
 const base=a.free?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><rect width="800" height="520" fill="${HEX.test(a.bg||'')?a.bg:'#ffffff'}"/></svg>`:pageSVG(Number(a.id),a.paint);
 return base.replace('</svg>',(a.strokes||[]).map(strokeSVG).join('')+(a.stamps||[]).map(stampSVG).join('')+'</svg>');
}
function drawStroke(c,s){
 const pts=s.points;if(!pts.length)return;
 const kind=s.kind||'pen';c.lineCap='round';c.lineJoin='round';c.lineWidth=s.width;
 if(kind==='rainbow'){for(let i=1;i<pts.length;i+=3){c.strokeStyle=`hsl(${(i*9)%360} 90% 60%)`;c.beginPath();c.moveTo(...pts[i-1]);for(const p of pts.slice(i,i+3))c.lineTo(...p);c.stroke();}if(pts.length<2){c.fillStyle='hsl(0 90% 60%)';c.beginPath();c.arc(pts[0][0],pts[0][1],s.width/2,0,7);c.fill();}return;}
 c.globalAlpha=kind==='marker'?.6:1;c.strokeStyle=s.colour;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();c.globalAlpha=1;
 if(kind==='glitter')for(let i=0;i<pts.length;i+=3){const r=s.width*(.35+seeded(i)*.5);const x=pts[i][0]+(seeded(i+9)-.5)*s.width*1.6,y=pts[i][1]+(seeded(i+3)-.5)*s.width*1.6;c.fillStyle=seeded(i+5)>.5?'#fff':'#ffe066';c.strokeStyle=s.colour;c.lineWidth=1;c.stroke(new Path2D(starPath(x,y,r)));c.fill(new Path2D(starPath(x,y,r)));}
}
function drawStamp(c,st){
 c.save();c.translate(st.x,st.y);c.rotate((st.r||0)*Math.PI/180);
 /* The board is a canvas, so this is where a stamp really becomes a
  * photograph: objects.draw blits the specimen and lays the glyph down
  * itself while the picture arrives. A stamp no layer claims — a heart from
  * an older picture — is drawn as it always was rather than left out. */
 const o=window.DUFX&&window.DUFX.objects;
 if(o&&o.has(st.e))o.draw(c,st.e,0,0,st.s);
 else{c.font=`${st.s}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(st.e,0,0);}
 c.restore();
}

/* ---------- validation for backups ---------- */
/* A backup can carry a stamp from before the current palette, and the sparkle
 * shower uses specimens the picker does not offer, so anything the object
 * layer can picture counts as a stamp — not only what the row shows today. */
const drawnStamp=e=>STAMPS.includes(e)||!!(window.DUFX&&window.DUFX.objects&&window.DUFX.objects.slug(e));
export function validPicture(p){
 return p&&/^(\d{1,3}|draw-[0-4])$/.test(p.id)&&(p.id.startsWith('draw-')||Number(p.id)<120)&&typeof p.free==='boolean'&&p.paint&&typeof p.paint==='object'
 &&Object.entries(p.paint).every(([k,v])=>/^(s-\d+|d-[a-z0-9]+)$/.test(k)&&HEX.test(v))
 &&Array.isArray(p.strokes)&&p.strokes.length<10000
 &&p.strokes.every(s=>HEX.test(s.colour)&&Number.isFinite(s.width)&&s.width>0&&s.width<=60&&(s.kind===undefined||KINDS.includes(s.kind))&&Array.isArray(s.points)&&s.points.length<100000&&s.points.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite)&&q[0]>=0&&q[0]<=800&&q[1]>=0&&q[1]<=520))
 &&(p.stamps===undefined||(Array.isArray(p.stamps)&&p.stamps.length<2000&&p.stamps.every(s=>drawnStamp(s.e)&&[s.x,s.y,s.s].every(Number.isFinite)&&s.x>=0&&s.x<=800&&s.y>=0&&s.y<=520&&s.s>=20&&s.s<=200&&(s.r===undefined||(Number.isFinite(s.r)&&Math.abs(s.r)<=90)))))
 &&(p.bg===undefined||HEX.test(p.bg))&&(p.done===undefined||typeof p.done==='boolean')&&(p.complete===undefined||typeof p.complete==='boolean');
}

/* ---------- the studio ---------- */
let art=null,env=null;
export const current=()=>art;
export function newArt(id,free,saved){
 return {id:String(id),free,paint:saved?.paint||{},strokes:saved?.strokes||[],stamps:(saved?.stamps||[]).filter(t=>t&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&Number.isFinite(t.s)),bg:HEX.test(saved?.bg||'')?saved.bg:'#ffffff',done:saved?.done===true,complete:saved?.complete===true,
  colour:'#e95b65',tool:free?'brush':'fill',brush:'pen',size:1,stamp:'🦕',stampSize:1,undo:[],dirty:false};
}
function cleanData(a){
 return {id:a.id,free:a.free,paint:structuredClone(a.paint),strokes:structuredClone(a.strokes),stamps:a.stamps.filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)).map(({e,x,y,s,r})=>({e,x,y,s,r})),bg:a.bg,done:a.done,complete:a.complete,time:Date.now()};
}
export async function persist(explicit=false){
 if(!art)return;const current=art;
 try{await artWrite(cleanData(current));if(art===current){current.dirty=false;const s=document.querySelector('#art-status');if(s)s.textContent='✓ Your picture is saved on this device.';}if(explicit)env.toast(env.say('Your picture is saved!'));}
 catch{env.toast('Could not save. This device may be out of storage.');}
}
export function flush(){if(art?.dirty)persist();}
export function close(){flush();art=null;}
const markDirty=()=>{if(!art)return;art.dirty=true;clearTimeout(markDirty.t);markDirty.t=setTimeout(()=>persist(),700);};
function remember(){art.undo.push(JSON.stringify({paint:art.paint,strokes:art.strokes,stamps:art.stamps.map(({e,x,y,s,r})=>({e,x,y,s,r})),bg:art.bg}));if(art.undo.length>40)art.undo.shift();}

function paintCanvas(){
 if(!art)return;const cv=document.querySelector('#artboard canvas');if(!cv)return;const c=cv.getContext('2d');
 c.clearRect(0,0,800,520);for(const s of art.strokes)drawStroke(c,s);for(const st of art.stamps)if(!st._hide)drawStamp(c,st);
}
export const title=a=>a.free?'My drawing pad':`${dinosaurs[Number(a.id)%12]} in the ${scenes[Math.floor(Number(a.id)/12)%10].toLowerCase()}`;

export function studioHTML(a){
 const free=a.free;
 /* A tab is a control, so the two whose glyph neither layer can picture take a
  * drawn mark: the object layer keeps the bucket as a photograph of a basket,
  * which tells a child nothing about filling, and nobody claims a sponge at
  * all. Both keep their words, so the pair still reads at a glance. */
 return `<div class="toolbar"><button class="pill" data-action="home">🏡 Home</button><button class="pill" data-action="book">🎨 More pictures</button><button class="pill" data-action="gallery">🖼️ My pictures</button></div><div class="game-heading"><h1>${free?'My drawing pad':dinosaurs[Number(a.id)%12]+' adventure'}</h1><p id="prompt">${free?'Draw, stamp and decorate your own picture!':'Pick a colour, then tap the picture.'}</p></div>
<section class="stage art-stage studio">
 ${free?'':'<div class="art-progress" aria-live="polite"><span class="bar-fill"></span><b id="art-count"></b></div>'}
 <div class="tool-tabs" role="tablist">${free?'':'<button class="tab" data-tool="fill">'+window.DUICONS.i('water',{size:20})+' Fill</button>'}<button class="tab" data-tool="brush">🖌️ Brush</button><button class="tab" data-tool="stamp">🌟 Stamps</button><button class="tab" data-tool="rub">${window.DUICONS.i('close',{size:20})} Rub out</button></div>
 <div class="tool-opts" id="tool-opts"></div>
 <div class="palette" id="palette">${PALETTE.map(([name,c])=>`<button class="swatch ${c===a.colour?'selected':''}" style="background:${c}" data-pick="${c}" aria-label="${name}" aria-pressed="${c===a.colour}"></button>`).join('')}</div>
 <div class="artboard ${a.tool==='fill'?'':'draw-mode'}" id="artboard">${free?`<svg viewBox="0 0 800 520"><rect id="bgrect" width="800" height="520" fill="${a.bg}"/></svg>`:pageSVG(Number(a.id),a.paint)}<canvas width="800" height="520" aria-label="Drawing area"></canvas><div class="stamp-fx" id="stamp-fx"></div></div>
 <div class="work-tools"><button class="pill" data-studio="undo">↶ Undo</button><button class="pill yellow" data-studio="sparkle">✨ Sparkle!</button><button class="pill primary" data-studio="finish">✓ I am finished!</button></div>
 <p class="subtle" id="art-status">Saved on this device as you colour.</p>
</section>`;
}

export function mountStudio(a,helpers){
 art=a;env=helpers;
 const board=document.querySelector('#artboard'),canvas=board.querySelector('canvas'),opts=document.querySelector('#tool-opts');
 const palette=document.querySelector('#palette');
 const status=t=>{const s=document.querySelector('#art-status');if(s)s.textContent=t;};
 /* options row changes with the tool */
 const renderOpts=()=>{
  const t=art.tool;let h='';
  if(t==='brush')h=`<span class="opt-group">${BRUSHES.map(([k,ic,nm])=>`<button class="opt ${art.brush===k?'on':''}" data-brush="${k}" aria-label="${nm}">${ic}<small>${nm}</small></button>`).join('')}</span><span class="opt-group">${[0,1,2].map(i=>`<button class="opt dot ${art.size===i?'on':''}" data-size="${i}" aria-label="${['Small','Medium','Big'][i]} brush"><i style="width:${8+i*9}px;height:${8+i*9}px"></i></button>`).join('')}</span>`;
  else if(t==='stamp')h=`<span class="opt-group stamps">${STAMPS.map(s=>`<button class="opt ${art.stamp===s?'on':''}" data-stamp="${s}" aria-label="Stamp ${stampWord(s)}">${s}</button>`).join('')}</span><span class="opt-group">${[0,1,2].map(i=>`<button class="opt dot ${art.stampSize===i?'on':''}" data-ssize="${i}" aria-label="${['Small','Medium','Big'][i]} stamp"><i style="width:${8+i*9}px;height:${8+i*9}px"></i></button>`).join('')}</span>`;
  else if(t==='rub')h='<span class="opt-note">Rub over pencil lines and stamps to take them away.</span>';
  else h='<span class="opt-note">Pick a colour, then tap a part of the picture.</span>';
  if(art.free&&t!=='stamp'&&t!=='rub')h+=`<span class="opt-group bgs"><small>Paper</small>${BGS.map(([nm,c])=>`<button class="opt bg ${art.bg===c?'on':''}" data-bg="${c}" style="background:${c}" aria-label="${nm} paper"></button>`).join('')}</span>`;
  opts.innerHTML=h;
  document.querySelectorAll('.tab').forEach(b=>{b.classList.toggle('on',b.dataset.tool===t);b.setAttribute('aria-selected',String(b.dataset.tool===t));});
  palette.classList.toggle('dim',t==='rub'||t==='stamp');
  board.classList.toggle('draw-mode',t!=='fill');board.classList.toggle('rub-mode',t==='rub');
 };
 /* progress for colouring pages */
 const regions=()=>[...board.querySelectorAll('svg [data-fill]')];
 const updateProgress=()=>{
  if(art.free)return;
  const total=regions().length,done=Object.keys(art.paint).length;
  const el=document.querySelector('#art-count');if(el)el.textContent=`🎨 ${Math.min(done,total)} / ${total}`;
  const f=document.querySelector('.bar-fill');if(f)f.style.width=`${Math.min(100,done/total*100)}%`;
  const near=done/total>=.85&&done<total;
  regions().forEach(r=>r.classList.toggle('todo',near&&!art.paint[r.dataset.fill]));
  if(done>=total&&!art.complete){art.complete=true;art.done=true;finale('All coloured! What a beautiful picture!');}
 };
 const finale=text=>{
  try{window.DUFX?.celebrate();}catch{}E.sfx('win');
  const r=board.getBoundingClientRect();E.burst(r.left+r.width/2,r.top+r.height/2,{kind:'stars',n:30,power:1.2});
  board.classList.add('shimmer');setTimeout(()=>board.classList.remove('shimmer'),3500);
  env.toast(env.say(text));env.speak(text);
  const p=document.querySelector('#prompt');if(p)p.textContent=env.say(text);
  env.onFinish();markDirty();
 };
 renderOpts();updateProgress();paintCanvas();
 /* Reopening a picture paints its stamps before the photographs have usually
  * decoded, which would leave the glyph fallback on the board until the child
  * drew something else, so the board is painted again when the object layer
  * says every queued picture has arrived. */
 window.DUFX?.objects?.ready?.().then(paintCanvas).catch(()=>{});
 /* colours */
 palette.onclick=e=>{const b=e.target.closest('[data-pick]');if(!b)return;art.colour=b.dataset.pick;palette.querySelectorAll('.swatch').forEach(s=>{s.classList.toggle('selected',s===b);s.setAttribute('aria-pressed',String(s===b));});E.sfx('tap');if(art.tool==='rub'||art.tool==='stamp'){art.tool=art.free?'brush':'fill';renderOpts();}};
 /* tools and options */
 document.querySelector('.studio').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tool){art.tool=b.dataset.tool;renderOpts();E.sfx('tap');document.querySelector('#prompt').textContent=env.say({fill:'Pick a colour, then tap the picture.',brush:'Draw with your finger.',stamp:'Pick a stamp, then tap the picture.',rub:'Rub over what you want to take away.'}[art.tool]);return;}
  if(b.dataset.brush){art.brush=b.dataset.brush;renderOpts();E.sfx('pop');return;}
  if(b.dataset.size){art.size=+b.dataset.size;renderOpts();return;}
  if(b.dataset.stamp){art.stamp=b.dataset.stamp;renderOpts();E.sfx('pop');return;}
  if(b.dataset.ssize){art.stampSize=+b.dataset.ssize;renderOpts();return;}
  if(b.dataset.bg){remember();art.bg=b.dataset.bg;const r=document.querySelector('#bgrect');if(r)r.setAttribute('fill',art.bg);renderOpts();E.sfx('whoosh');markDirty();return;}
  if(b.dataset.studio==='undo'){
   if(!art.undo.length)return;Object.assign(art,JSON.parse(art.undo.pop()));
   regions().forEach(el=>el.setAttribute('fill',art.paint[el.dataset.fill]||'#ffffff'));
   const r=document.querySelector('#bgrect');if(r)r.setAttribute('fill',art.bg);
   paintCanvas();updateProgress();E.sfx('whoosh');markDirty();return;
  }
  if(b.dataset.studio==='sparkle'){sparkle();return;}
  if(b.dataset.studio==='finish'){
   art.done=true;persist(true);env.onFinish();finale(art.complete||art.free?'Your picture is finished! A real masterpiece!':'Your picture is finished! A real masterpiece!');return;
  }
 });
 /* fill: pop the region, burst of paint, a note per colour */
 const svg=board.querySelector('svg');
 svg.onclick=e=>{
  if(!art||art.tool!=='fill')return;const el=e.target.closest('[data-fill]');if(!el)return;
  remember();art.paint[el.dataset.fill]=art.colour;el.setAttribute('fill',art.colour);
  el.style.transformBox='fill-box';el.style.transformOrigin='center';E.animate(el,[{transform:'scale(.93)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:380,easing:'cubic-bezier(.2,1.6,.4,1)'});
  E.burst(e.clientX,e.clientY,{kind:Math.random()<.5?'sparkle':'drops',n:9,color:art.colour,scale:.9});
  const idx=Math.max(0,PALETTE.findIndex(p=>p[1]===art.colour));E.step(idx,.18);E.sfx('pop');
  markDirty();updateProgress();
 };
 /* brush, stamp, rub */
 const pt=e=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width)),Math.max(0,Math.min(520,(e.clientY-r.top)*520/r.height))];};
 let stroke=null,rubbing=false,lastFx=0,rubHit=false;
 const fxEvery=(e,kind)=>{const n=performance.now();if(n-lastFx<110)return;lastFx=n;E.burst(e.clientX,e.clientY,{kind,n:art.brush==='glitter'?3:1,scale:.7,power:.5,color:art.colour});};
 const placeStamp=p=>{
  remember();
  const size=STAMP_SIZES[art.stampSize],st={e:art.stamp,x:Math.round(p[0]),y:Math.round(p[1]),s:size,r:Math.round((Math.random()-.5)*24),_hide:true};
  art.stamps.push(st);
  // a pop on top of the picture, then the stamp settles onto the canvas
  const fx=document.querySelector('#stamp-fx'),span=document.createElement('span');
  const o=window.DUFX&&window.DUFX.objects,pic=o&&o.slug(st.e);
  /* The pop has to grow with the board exactly as the canvas stamp does, so the
   * photograph is sized in the same container units; the watcher that turns a
   * glyph into a picture sizes it to the text it replaces, which is far too
   * small for a big stamp. */
  if(pic)span.innerHTML='<img src="'+o.file(pic)+'" alt="" style="display:block;width:'+size/8+'cqw;height:'+size/8+'cqw;object-fit:contain">';
  else span.textContent=st.e;
  span.style.cssText=`left:${st.x/8}%;top:${st.y/5.2}%;font-size:${st.s/8}cqw;--r:${st.r}deg`;fx.append(span);
  E.sfx('pop');E.step(art.stamps.length%8,.12);
  const r=canvas.getBoundingClientRect();E.burst(r.left+st.x*r.width/800,r.top+st.y*r.height/520,{kind:'sparkle',n:12,scale:1});
  setTimeout(()=>{st._hide=false;span.remove();paintCanvas();},420);
  markDirty();
 };
 const rubAt=p=>{
  let hit=false;
  art.strokes=art.strokes.filter(s=>{const near=s.points.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<s.width/2+22);if(near)hit=true;return !near;});
  art.stamps=art.stamps.filter(s=>{const near=Math.hypot(s.x-p[0],s.y-p[1])<s.s/2;if(near)hit=true;return !near;});
  if(hit){rubHit=true;E.sfx('whoosh');E.burst(...[(canvas.getBoundingClientRect().left+p[0]*canvas.getBoundingClientRect().width/800),(canvas.getBoundingClientRect().top+p[1]*canvas.getBoundingClientRect().height/520),{kind:'dust',n:4,scale:.8}]);paintCanvas();}
 };
 canvas.onpointerdown=e=>{
  if(!art)return;e.preventDefault();const p=pt(e);
  if(art.tool==='stamp'){placeStamp(p);return;}
  try{canvas.setPointerCapture(e.pointerId);}catch{}
  if(art.tool==='rub'){remember();rubbing=true;rubHit=false;rubAt(p);return;}
  remember();
  stroke={colour:art.colour,width:BRUSH_SIZES[art.brush][art.size],kind:art.brush,points:[p,[...p]]};art.strokes.push(stroke);paintCanvas();E.sfx('tap');
 };
 canvas.onpointermove=e=>{
  if(!art)return;const p=pt(e);
  if(rubbing){rubAt(p);return;}
  if(!stroke)return;
  stroke.points.push(p);paintCanvas();
  if(art.brush==='glitter')fxEvery(e,'sparkle');else if(art.brush==='rainbow')fxEvery(e,'hearts');
 };
 const end=()=>{
  if(rubbing){rubbing=false;if(!rubHit)art.undo.pop();else markDirty();return;}
  if(!stroke)return;
  stroke=null;markDirty();
 };
 canvas.onpointerup=end;canvas.onpointercancel=end;canvas.onlostpointercapture=end;
 /* a shower of sparkles to finish the picture */
 function sparkle(){
  remember();E.sfx('sparkle');
  /* The old list was four star glyphs, which the object layer draws as one
   * photograph, so the shower never actually changed. These are the four
   * sparkly things this meadow can really picture: a star, a crystal, a sheet
   * of mica and a live ember. */
  const picks=['⭐','💎','🪩','💥'];const n=18;
  for(let i=0;i<n;i++)setTimeout(()=>{
   if(!art)return;
   const st={e:picks[i%picks.length],x:Math.round(40+Math.random()*720),y:Math.round(40+Math.random()*440),s:36+Math.round(Math.random()*40),r:Math.round((Math.random()-.5)*40)};
   art.stamps.push(st);paintCanvas();
   const r=canvas.getBoundingClientRect();E.burst(r.left+st.x*r.width/800,r.top+st.y*r.height/520,{kind:'sparkle',n:5,scale:.8});E.step(i,.1);
  },i*70);
  board.classList.add('shimmer');setTimeout(()=>board.classList.remove('shimmer'),2600);
  markDirty();
 }
}
