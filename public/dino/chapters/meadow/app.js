import {normalizeName,address} from './profile.js';
import {types,themes,activities,tokens,colours,shuffle,mazeFor} from './catalog.js';
import {dinosaurs,scenes,dinoSVG,pageSVG,heroSVG} from './art.js';
import * as E from './engine.js';
import {games} from './games.js';
import * as Studio from './studio.js';
import {artRead,artWrite,artList,artSVG,validPicture} from './studio.js';
const app=document.querySelector('#app');
let profile={name:'',asked:false};
try{const saved=JSON.parse(localStorage.getItem('dm-profile')||'null');if(saved&&normalizeName(saved.name)!==null)profile={name:normalizeName(saved.name),asked:saved.asked===true};}catch{}
const sayToChild=text=>address(text,profile.name);
function personalizeView(){
 document.title='Dino Meadow';
 const brand=document.querySelector('.brand span');if(brand)brand.textContent=document.title;
 if(!profile.name)return;
 const set=(selector,text)=>{const el=document.querySelector(selector);if(el)el.textContent=text;};
 if(view==='home'){set('.hero h1','Hello, '+profile.name+'!');set('.hero p','Welcome to your Dino Meadow. Your dinosaur friends are waiting!');set('.section-head h2','Where shall we go, '+profile.name+'?');}
 if(view==='games')set('main h1','Pick a game, '+profile.name+'!');
 if(view==='book')set('main h1',profile.name+'’s dinosaur colouring book');
 if(view==='gallery')set('main h1',profile.name+'’s little gallery');
 if(view==='stickers')set('main h1',profile.name+'’s meadow discoveries');
 if(view==='art'){const heading=document.querySelector('main h1');if(heading)heading.textContent=art?.free?profile.name+'’s drawing pad':heading.textContent+' for '+profile.name;}
 const promptEl=document.querySelector('#prompt');if(promptEl)promptEl.textContent=sayToChild(promptEl.textContent);
}
function nameDialog(first=false){
 modal('<h2>A meadow just for you</h2><p>Grown-ups: what first name should the dinosaur friends use?</p><form id="name-form"><label>First name<input id="child-name" type="text" maxlength="24" autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Child’s first name"></label><p class="subtle">Optional. Saved only in this browser on this device. Never sent to us or included in artwork backups.</p><p id="name-error" role="status"></p><div class="toolbar"><button class="pill primary" type="submit">Let’s play</button><button class="pill" type="button" id="skip-name">'+(first?'Skip for now':'Remove name')+'</button></div></form>');
 const input=document.querySelector('#child-name');input.value=profile.name;
 const apply=name=>{profile={name,asked:true};try{localStorage.setItem('dm-profile',JSON.stringify(profile));}catch{toast('This browser cannot save the name. It will last for this visit only.');}document.querySelector('.modal-backdrop').remove();goHome();notifyHubSettings();speak(name?'Welcome to your Dino Meadow!':'Welcome to Dino Meadow!');};
 document.querySelector('#name-form').onsubmit=e=>{e.preventDefault();const name=normalizeName(input.value);if(name===null){document.querySelector('#name-error').textContent='Use a first name with letters, spaces, apostrophes or hyphens (up to 24 characters).';return;}apply(name);};
 document.querySelector('#skip-name').onclick=()=>apply('');
}

let settings={speech:true,sound:true,calm:false,easy:true},completed=[],favourites=[];
try{Object.assign(settings,JSON.parse(localStorage.getItem('dm-settings')||'{}'));completed=JSON.parse(localStorage.getItem('dm-completed')||'[]');favourites=JSON.parse(localStorage.getItem('dm-favourites')||'[]');}catch{}
const ROUNDS=5;
syncSound();
let view='home',category=null,game=null,round=0,epoch=0,art=null,bookPage=0,offline=false,audioContext,toastTimer;
const timers=new Set();
function later(fn,ms){const current=epoch;const id=setTimeout(()=>{timers.delete(id);if(current===epoch)fn();},ms);timers.add(id);return id;}
function clean(){epoch++;for(const t of timers)clearTimeout(t);timers.clear();window.speechSynthesis?.cancel();Studio.close();art=null;}
function savePrefs(){try{localStorage.setItem('dm-settings',JSON.stringify(settings));localStorage.setItem('dm-completed',JSON.stringify(completed));localStorage.setItem('dm-favourites',JSON.stringify(favourites));}catch{toast('Storage is full. Your changes may not be saved.');}}
function notifyHubSettings(){if(window.top&&window.top!==window.self)window.parent.postMessage({type:'du-settings-update',name:profile.name,sound:settings.sound},location.origin);}
function toast(text){const t=document.querySelector('#toast');t.textContent=text;t.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.display='none',3500);}
function speak(text){text=sayToChild(text);if(!settings.speech||!window.speechSynthesis)return;window.speechSynthesis.cancel();const names={'🥚':'eggs','🍓':'strawberries','🍃':'leaves','🌻':'sunflowers','🦋':'butterflies','🍄':'mushrooms','🐚':'shells','🍎':'apples','🥕':'carrots','⭐':'stars','🍇':'grapes','🍞':'bread','🥬':'lettuce','🧀':'cheese','🍌':'banana','🫐':'blueberries','🥣':'the bowl','🫓':'flatbread','🍅':'tomato','🌿':'herbs','🥛':'milk','🍐':'pear'}; for(const [symbol,name] of Object.entries(names))text=text.replaceAll(symbol,name);const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.82;u.pitch=1.08;window.speechSynthesis.speak(u);}
function syncSound(){try{window.DUFX.configure({sound:settings.sound});}catch{}}
function header(){return `<header><button class="brand" data-action="home" aria-label="Dino Meadow home"><img src="./icon.svg" alt=""><span>Dino Meadow</span></button><div class="tools"><button class="pill" data-action="sound" aria-label="${settings.sound?'Mute':'Enable'} sounds">${settings.sound?'🔊':'🔇'}</button><button class="pill" data-action="parents">Parents</button></div></header>`;}
function shell(content){document.body.classList.toggle('art-view',view==='art');document.body.classList.toggle('calm',settings.calm);app.innerHTML=header()+`<main>${content}</main>`;personalizeView();window.scrollTo(0,0);}
function goHome(){clean();view='home';game=null;renderHome();}
function renderHome(){shell(`<section class="hero"><div class="hero-copy"><h1>A little world.<br>Big dino fun.</h1><p>Pick a place to play.<br>Your dinosaur friends are waiting!</p><button class="pill primary" data-action="surprise">▶ Let’s play</button></div><div class="hero-art">${heroSVG()}</div></section><nav class="destinations" aria-label="Choose a place"><button class="destination" style="background:#ffd66d" data-action="games"><span class="big-icon">🦕</span>Play games<small>100 little adventures</small></button><button class="destination" style="background:#f7b7bf" data-action="book"><span class="big-icon">🎨</span>Colouring<small>120 dinosaur pictures</small></button><button class="destination" style="background:#bfcdf5" data-action="free-draw"><span class="big-icon">🖍️</span>Make a picture<small>Draw anything you like</small></button><button class="destination" style="background:#a8d9b7" data-action="gallery"><span class="big-icon">🖼️</span>My pictures<small>Your own little gallery</small></button></nav>${E.meadowPanel()}<div class="section-head"><h2>Where shall we go?</h2><button class="pill" data-action="stickers">⭐ ${completed.length} discoveries</button></div>${typeGrid()}<p class="footer-note">A little play. A little wonder. All yours.</p>`);E.wakeMeadow(app);}
function typeGrid(){return `<div class="grid">${types.map(t=>`<button class="tile" data-type="${t.id}" style="background:${t.colour}"><span class="tile-art" aria-hidden="true">${t.icon}</span>${t.name}</button>`).join('')}</div>`;}
function renderGames(){clean();view='games';shell(`<div class="section-head"><h1>Pick a game</h1><button class="pill" data-action="home">🏡 Home</button></div>${typeGrid()}`);speak('Pick a game.');}
function showType(id){clean();view='category';category=types.find(t=>t.id===id);shell(`<div class="section-head"><h1>${category.icon} ${category.name}</h1><button class="pill" data-action="games">↩ Games</button></div><p>${category.hint}. Choose a little adventure.</p><div class="grid">${themes.map((theme,i)=>`<button class="tile" data-game="${id}-${i}" style="background:${category.colour}">${completed.includes(`${id}-${i}`)?`<span class="badge">${'⭐'.repeat(E.bestStars(`${id}-${i}`)||1)}</span>`:''}${dinoSVG(i,['#76c7a2','#ebac7f','#aa9cda','#79b8d3','#dc9bb6'][i])}${theme}</button>`).join('')}</div>`);speak(category.hint);}
function start(id){clean();game=activities.find(a=>a.id===id);if(!game)return;view='game';round=0;E.newSession(ROUNDS);if(game.type==='draw')return openArt('draw-'+game.level,true);if(game.type==='colouring')return renderPicker();stageShell('Get ready…');beginRound();}
function toolbarHTML(){const type=types.find(t=>t.id===game.type);return `<div class="toolbar"><button class="pill" data-action="home">🏡 Home</button><button class="pill" data-action="category">↩ ${type.name}</button><button class="pill" data-action="replay">↻ Again</button><button class="pill" data-action="help">🔈 Listen</button><button class="pill" data-action="favourite" aria-label="${favourites.includes(game.id)?'Remove favourite':'Add favourite'}">${favourites.includes(game.id)?'❤️':'🤍'}</button></div>`;}
function stageShell(promptText){const type=types.find(t=>t.id===game.type);shell(`${toolbarHTML()}<div class="game-heading"><h1>${type.icon} ${type.name}</h1><p id="prompt">${promptText}</p></div>${E.stageHTML(game.level,ROUNDS)}<div id="feedback" class="feedback" role="status" aria-live="polite"></div>`);E.mountStage();}
function beginRound(){E.beginRound(game,round,games[game.type]);}
function nextRound(){round++;if(round>=ROUNDS)finishGame();else beginRound();}
function finishGame(){if(!completed.includes(game.id)){completed.push(game.id);savePrefs();}const p=document.querySelector('#prompt');if(p)p.textContent='A new meadow discovery!';E.finish(game,{title:profile.name?'You did it, '+profile.name+'!':'You did it!'});}
E.setup({epoch:()=>epoch,settings:()=>settings,prompt:t=>prompt(t),feedback:t=>feedback(t),speak:t=>speak(t),later:(fn,ms)=>later(fn,ms),next:()=>nextRound(),currentLevel:()=>game?.level});
function feedback(text){const el=document.querySelector('#feedback');if(el)el.textContent=sayToChild(text);}
function prompt(text){document.querySelector('#prompt').textContent=sayToChild(text);speak(text);}
function renderPicker(){
 shell(`${toolbarHTML()}<div class="game-heading"><h1>🎨 Colouring book</h1><p id="prompt">Choose a picture to colour.</p></div><section class="stage picker"><button class="pill primary" data-action="book">🎨 Open all 120 pictures</button><div class="grid book-grid" style="width:100%">${Array.from({length:5},(_,i)=>game.level*24+i).map(i=>`<button class="tile frame" data-art="${i}" aria-label="Colour ${dinosaurs[i%12]} in ${scenes[Math.floor(i/12)]}">${pageSVG(i)}${dinosaurs[i%12]}</button>`).join('')}</div></section>`);
 speak('Choose a picture to colour.');decorateTiles();
}
function decorateTiles(){
 const marker=epoch;
 artList().then(list=>{
  if(marker!==epoch)return;
  const map=new Map(list.map(a=>[a.id,a]));
  const mine=list.filter(a=>!a.free);
  const stats=document.querySelector('#book-stats');if(stats)stats.textContent=`🎨 ${mine.length} started · ⭐ ${mine.filter(a=>a.done).length} finished · of 120`;
  document.querySelectorAll('.book-grid .tile[data-art]').forEach(t=>{
   const a=map.get(t.dataset.art);if(!a)return;
   const svg=t.querySelector('svg');if(svg)svg.outerHTML=artSVG(a);
   t.classList.add(a.done?'finished':'started');
   if(a.done)t.insertAdjacentHTML('afterbegin','<span class="rosette">⭐</span>');
  });
 }).catch(()=>{});
}
function renderBook(){
 clean();view='book';
 shell(`<div class="section-head"><div><h1>My dinosaur colouring book</h1><p>Pick a picture. Make it yours.</p></div><button class="pill" data-action="home">🏡 Home</button></div><div class="toolbar"><button class="pill" data-action="gallery">🖼️ My pictures</button><button class="pill yellow" data-action="random-art">🎲 Surprise picture</button><span class="chip book-stats" id="book-stats">🎨 120 pictures to colour</span></div><div class="grid book-grid">${Array.from({length:12},(_,i)=>bookPage*12+i).map(i=>`<button class="tile frame" data-art="${i}" aria-label="Colour ${dinosaurs[i%12]} in ${scenes[Math.floor(i/12)]}">${pageSVG(i)}${dinosaurs[i%12]}</button>`).join('')}</div><div class="book-controls"><button class="pill" data-action="prev-book" ${bookPage===0?'disabled':''}>◀ Back</button><span>${scenes[bookPage]}<br><small>${bookPage+1} / 10</small></span><button class="pill primary" data-action="next-book" ${bookPage===9?'disabled':''}>More ▶</button></div>`);
 speak('Pick a dinosaur picture.');
 decorateTiles();
}
async function openArt(id,free=false){
 clean();view='art';const marker=epoch;let saved;
 try{saved=await artRead(String(id));}catch{toast('Pictures cannot be saved in this browser mode.');}
 if(marker!==epoch)return;
 art=Studio.newArt(id,free,saved);
 shell(Studio.studioHTML(art));
 Studio.mountStudio(art,{toast,say:sayToChild,speak,onFinish:()=>{if(game&&['colouring','draw'].includes(game.type)&&!completed.includes(game.id)){completed.push(game.id);savePrefs();}}});
 speak(free?'Pick a colour and draw with your finger.':'Pick a colour, then tap the picture.');
}
async function gallery(){
 clean();view='gallery';const marker=epoch;
 shell('<h1>My pictures</h1><p>Opening your little gallery…</p>');
 let pictures=[];
 try{pictures=await artList();}catch{toast('Your gallery is unavailable in this browser mode.');}
 if(marker!==epoch)return;
 const done=pictures.filter(a=>a.done).length;
 shell(`<div class="section-head"><h1>My little gallery</h1><button class="pill" data-action="home">🏡 Home</button></div>${pictures.length?`<p class="gallery-sub">${pictures.length} picture${pictures.length>1?'s':''} on the wall${done?` · ⭐ ${done} finished`:''}</p><div class="wall">${pictures.map(a=>`<button class="framed ${a.done?'gold':''}" data-art="${a.id}" data-free="${a.free}" aria-label="${Studio.title(a)}">${a.done?'<span class="rosette">⭐</span>':''}<span class="mat">${artSVG(a)}</span><span class="plaque">${Studio.title(a)}</span></button>`).join('')}</div>`:'<div class="empty">🎨<h2>Your pictures will live here.</h2><button class="pill primary" data-action="book">Pick a dinosaur</button></div>'}`);
 E.sfx('sparkle');
}
function stickers(){clean();view='stickers';shell(`<div class="section-head"><h1>My meadow discoveries</h1><button class="pill" data-action="home">🏡 Home</button></div><p>Every little adventure is yours to explore. You have visited ${completed.length} of 100.</p><div class="grid">${types.map(t=>{const count=completed.filter(id=>id.startsWith(t.id+'-')).length;return `<button class="tile" data-type="${t.id}" style="background:${t.colour}"><span class="tile-art">${t.icon}</span>${t.name}<p>${'⭐'.repeat(count)}${'○'.repeat(5-count)}</p></button>`;}).join('')}</div>${favourites.length?`<h2 style="margin:30px 0">Favourite adventures</h2><div class="grid">${favourites.map(id=>{const a=activities.find(a=>a.id===id);return a?`<button class="tile" data-game="${id}">❤️<p>${a.title}</p></button>`:'';}).join('')}</div>`:''}`);}
function modal(html){const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-label="Parent settings"><button class="pill close" data-action="close-modal" aria-label="Close">✕</button>${html}</section>`;document.body.append(wrap);wrap.querySelector('button').focus();wrap.onkeydown=e=>{if(e.key==='Escape'){wrap.remove();return;}if(e.key==='Tab'){const els=[...wrap.querySelectorAll('button,input,select,a')].filter(x=>!x.disabled),first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};}
function parentGate(){window.speechSynthesis?.cancel();const a=7+Math.floor(Math.random()*8),b=5+Math.floor(Math.random()*7);modal(`<h2>Grown-ups only</h2><p>Please solve this to open settings.</p><form id="gate"><label>${a} + ${b} = <input type="number" inputmode="numeric" required aria-label="Answer"></label><button class="pill primary">Open settings</button><p id="gate-message" role="status"></p></form>`);document.querySelector('#gate').onsubmit=e=>{e.preventDefault();if(Number(e.target.querySelector('input').value)!==a+b){document.querySelector('#gate-message').textContent='Please try again.';return;}document.querySelector('.modal-backdrop').remove();parentSettings();};}
function parentSettings(){modal(`<h2>A happy place to play</h2><button class="pill" data-action="change-name">Change or remove child’s name</button><label>Spoken instructions<input type="checkbox" data-setting="speech" ${settings.speech?'checked':''}></label><label>Gentle game sounds<input type="checkbox" data-setting="sound" ${settings.sound?'checked':''}></label><label>Calmer celebrations<input type="checkbox" data-setting="calm" ${settings.calm?'checked':''}></label><label>Play level<select data-setting="easy"><option value="true" ${settings.easy?'selected':''}>Little explorers</option><option value="false" ${!settings.easy?'selected':''}>Growing explorers</option></select></label><div class="parent-info"><strong>${offline?'✓ Offline game files are ready':'Offline files are not ready yet'}</strong><p>Open online once and wait for this message to say ready. Then try Airplane Mode. Device storage can be cleared by iPadOS; keep favourite artwork backed up.</p><strong>Install on iPad</strong><p>Open the secure website in Safari. Tap Share, then Add to Home Screen. If shown, turn on Open as Web App, then tap Add. Open the new Dino Meadow icon while online once.</p><strong>Everything stays here</strong><p>No accounts, ads, purchases, analytics, camera, or microphone. Pictures and progress stay in this browser on this device. The hosting provider may keep normal access logs. Spoken prompts use the device’s speech service; voice availability and offline speech vary.</p><strong>What’s inside</strong><p>100 activities: 20 game types with five variations. 120 original colouring compositions: 12 dinosaurs in 10 scenes. All unlocked. No timers or losing screens.</p><p>For younger children, use Guided Access in iPad settings to help keep them in the app.</p></div><div class="toolbar"><button class="pill" data-action="export-art">Back up pictures</button><button class="pill" data-action="import-art">Restore backup</button></div><p class="subtle">Parent gate is a convenience, not a security control. Suitable difficulty depends on the child. An adult should help with installation and first play.</p>`);document.querySelectorAll('[data-setting]').forEach(el=>el.onchange=()=>{settings[el.dataset.setting]=el.type==='checkbox'?el.checked:el.value==='true';savePrefs();if(el.dataset.setting==='sound'){syncSound();notifyHubSettings();}document.body.classList.toggle('calm',settings.calm);if(!settings.speech)window.speechSynthesis?.cancel();});}
async function exportArt(){try{const pictures=await artList();const url=URL.createObjectURL(new Blob([JSON.stringify({format:'dino-meadow-1',pictures,completed,favourites,settings,...E.extrasForBackup()})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='dino-meadow-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Backup is ready in Downloads.');}catch{toast('Backup could not be created.');}}
function importArt(){const input=document.createElement('input');input.type='file';input.accept='application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file||file.size>20*1024*1024)throw Error();const data=JSON.parse(await file.text());if(data.format!=='dino-meadow-1'||!Array.isArray(data.pictures)||data.pictures.length>125||!data.pictures.every(validPicture))throw Error();for(const p of data.pictures){const existing=await artRead(p.id);if(!existing)await artWrite({...p,time:Date.now()});}if(Array.isArray(data.completed))completed=[...new Set([...completed,...data.completed.filter(id=>activities.some(a=>a.id===id))])];E.restoreExtras(data);savePrefs();toast('Backup restored. Existing pictures were kept.');}catch{toast('That backup could not be read. Nothing was replaced.');}};input.click();}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.type)return showType(b.dataset.type);
 if(b.dataset.game)return start(b.dataset.game);
 if(b.dataset.art!==undefined)return openArt(b.dataset.art,b.dataset.free==='true'||b.dataset.art.startsWith('draw-'));
  const action=b.dataset.action;
 if(action==='home')goHome();else if(action==='games')renderGames();else if(action==='category')showType(game.type);else if(action==='book')renderBook();else if(action==='gallery')gallery();else if(action==='stickers')stickers();else if(action==='free-draw')openArt('draw-0',true);else if(action==='replay')start(game.id);else if(action==='surprise')start(activities.filter(a=>!['colouring','draw'].includes(a.type))[Math.floor(Math.random()*90)].id);else if(action==='sound'){settings.sound=!settings.sound;settings.speech=settings.sound;savePrefs();syncSound();notifyHubSettings();if(!settings.sound)window.speechSynthesis?.cancel();b.textContent=settings.sound?'🔊':'🔇';b.setAttribute('aria-label',settings.sound?'Mute sounds':'Enable sounds');}else if(action==='parents')parentGate();else if(action==='change-name'){b.closest('.modal-backdrop').remove();nameDialog();}else if(action==='close-modal')b.closest('.modal-backdrop').remove();else if(action==='help')speak(document.querySelector('#prompt')?.textContent||'Choose a game.');else if(action==='favourite'){favourites=favourites.includes(game.id)?favourites.filter(x=>x!==game.id):[...favourites,game.id];savePrefs();b.textContent=favourites.includes(game.id)?'❤️':'🤍';}else if(action==='prev-book'){bookPage=Math.max(0,bookPage-1);renderBook();}else if(action==='next-book'){bookPage=Math.min(9,bookPage+1);renderBook();}else if(action==='random-art')openArt(Math.floor(Math.random()*120));else if(action==='export-art')exportArt();else if(action==='import-art')importArt();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){window.speechSynthesis?.cancel();Studio.flush();}});
goHome();
if(!profile.asked && !(window.top && window.top !== window.self))nameDialog(true);
if(window.top && window.top !== window.self) {
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.type !== 'du-settings') return;
    try {
      if (typeof e.data.name === 'string') {
        const n = normalizeName(e.data.name);
        if (n === null) return;
        if (n !== profile.name) {
          profile = { name: n, asked: true };
          try { localStorage.setItem('dm-profile', JSON.stringify(profile)); } catch (err) {}
        }
      }
      if (typeof e.data.sound === 'boolean' && settings.sound !== e.data.sound) {
        settings.sound = e.data.sound;
        try { localStorage.setItem('dm-settings', JSON.stringify(settings)); } catch (err) {}
      }
      personalizeView();
      const sound = document.querySelector('[data-action="sound"]');
      if (sound) {
        syncSound();
        sound.textContent = settings.sound ? '🔊' : '🔇';
        sound.setAttribute('aria-label', settings.sound ? 'Mute sounds' : 'Enable sounds');
      }
    } catch (err) {}
  });
  setTimeout(function () { try { window.top.postMessage({ type: 'du-ready' }, location.origin); } catch (err) {} }, 0);
}
