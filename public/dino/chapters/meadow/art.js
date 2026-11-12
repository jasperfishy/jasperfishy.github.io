const photoSpecies=['bronto','tricera','stego','trex','spinosaurus','edmontosaurus','ankylosaurus','parasaurolophus','compsognathus','pachycephalosaurus','oviraptor','therizinosaurus'];
let photoId=0;
function photoDino(type,colour,colouring){
 const id='meadow-photo-'+(++photoId),url=new URL('../../assets/prehistoric/'+photoSpecies[type%12]+'.png',import.meta.url).href;
 const img=`<image href="${url}" x="8" y="12" width="404" height="320" preserveAspectRatio="xMidYMax meet"/>`;
 const regions=Array.from({length:8},(_,i)=>`<path data-fill="d-photo${i}" d="M${(i%4)*105} ${Math.floor(i/4)*180}h105v180h-105Z" fill="${colouring?'#ffffff':colour}" stroke="none"/>`).join('');
 return `<defs><mask id="${id}" mask-type="alpha">${img}</mask></defs><g mask="url(#${id})">${regions}<g style="mix-blend-mode:luminosity;opacity:.8;pointer-events:none">${img}</g></g>`;
}
export const dinosaurs=['Long-neck','Three-horns','Spiky-back','Little rex','Sail-back','Duck-bill','Armour-tail','Crest-head','Tiny runner','Dome-head','Feather-tail','Big-claw'];
export const scenes=['Flower meadow','Volcano valley','Moonlit lake','Birthday picnic','Rainbow garden','Snowy hills','Fossil beach','Jungle waterfall','Starry camp','Orchard adventure'];
const ink='#285357';
export function dino(type=0,colour='#73c9a2',colouring=false){return photoDino(type,colour,colouring);}
export function dinoSVG(type=0,colour='#73c9a2'){return `<svg viewBox="0 0 420 360" role="img" aria-label="${dinosaurs[type%12]} dinosaur">${dino(type%12,colour)}</svg>`;}
export function pageSVG(index=0,paint={}){
 const type=index%12,scene=Math.floor(index/12)%10;
 let n=0;const fill=(shape,c='#fff')=>shape.replace('<','<').replace(/\/>$/,` data-fill="s-${n++}" fill="${c}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`);
 let s=fill('<rect x="2" y="2" width="796" height="516" rx="16"/>');
 s+=fill('<path d="M0 365Q180 270 390 355Q620 270 800 355L800 520H0Z"/>');
 if(scene===0||scene===4||scene===9){s+=fill('<circle cx="680" cy="85" r="42"/>');s+=fill('<path d="M65 104Q45 64 95 61Q121 24 157 66Q203 66 193 106Z"/>');}
 if(scene===1){s+=fill('<path d="M60 342L230 93L390 345Z"/>');s+=fill('<path d="M184 160L230 93L278 162L249 148L224 169Z"/>');s+=fill('<path d="M215 71Q180 28 225 20Q262 1 272 33Q316 60 267 76Z"/>');}
 if(scene===2||scene===8){s+=fill('<path d="M660 30Q610 120 715 137Q615 172 591 100Q572 38 660 30Z"/>');for(let i=0;i<6;i++)s+=fill(`<path d="M${80+i*95} ${45+i%2*55}l6 17l18 0l-14 10l5 17l-15-10l-15 10l6-17l-14-10h17Z"/>`);s+=fill('<ellipse cx="410" cy="447" rx="240" ry="43"/>');}
 if(scene===3){s+=fill('<path d="M20 45Q390 150 780 45L780 75Q390 180 20 75Z"/>');for(let i=0;i<5;i++)s+=fill(`<path d="M${100+i*130} 100l50 5l-22 50Z"/>`);s+=fill('<rect x="550" y="345" width="160" height="100" rx="12"/>');s+=fill('<rect x="610" y="345" width="28" height="100"/>');}
 if(scene===4){for(let i=0;i<4;i++)s+=fill(`<path d="M${70+i*17} 280A${260-i*17} ${240-i*17} 0 0 1 ${590-i*17} 280L${573-i*17} 280A${243-i*17} ${223-i*17} 0 0 0 ${87+i*17} 280Z"/>`);}
 if(scene===5){s+=fill('<path d="M0 340L170 98L340 340L550 90L800 340Z"/>');s+=fill('<path d="M109 186L170 98L234 189L195 179L167 205L145 176Z"/>');for(let i=0;i<9;i++)s+=fill(`<circle cx="${45+i*85}" cy="${50+i%3*65}" r="7"/>`);}
 if(scene===6){s+=fill('<path d="M0 350Q180 300 360 350T800 330V430Q650 380 460 430T0 430Z"/>');for(let i=0;i<4;i++)s+=fill(`<path d="M${70+i*170} 470q-25-45 10-35q35-10 20 25l-15-5Z"/>`);}
 if(scene===7||scene===9){for(let i=0;i<2;i++){let x=70+i*615;s+=fill(`<rect x="${x}" y="155" width="35" height="205" rx="10"/>`);s+=fill(`<path d="M${x-50} 190Q${x-100} 80 ${x} 64Q${x+95} 38 ${x+100} 145Q${x+108} 213 ${x-50} 190Z"/>`);if(scene===9)for(let j=0;j<3;j++)s+=fill(`<circle cx="${x-25+j*35}" cy="${125+j%2*35}" r="14"/>`);}if(scene===7)s+=fill('<path d="M495 95h100v290q-50 40-100 0Z"/>');}
 if(scene===8)s+=fill('<path d="M570 415L655 237L751 415Z"/>')+fill('<path d="M620 415L655 310L696 415Z"/>');
 s+=`<g transform="translate(${scene===1?270:180} 140) scale(.95)">${dino(type,'white',true)}</g>`;
 for(let i=0;i<4;i++){const x=40+i*205,y=445+i%2*25;s+=fill(`<path d="M${x} ${y+40}v-35"/>`);s+=fill(`<path d="M${x} ${y}q-30-22-13-30q12-12 24 0q27-9 18 16q-2 20-29 14Z"/>`);s+=fill(`<circle cx="${x+3}" cy="${y-13}" r="7"/>`);}
 let result=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" role="img" aria-label="${dinosaurs[type]} in ${scenes[scene]}">${s}</svg>`;
 for(const [key,value]of Object.entries(paint))if(/^#[0-9a-f]{6}$/i.test(value))result=result.replace(new RegExp(`data-fill="${key}"([^>]*?)fill="[^"]*"`),`data-fill="${key}"$1fill="${value}"`);
 return result;
}
export function heroSVG(){return `<svg viewBox="0 0 680 380" aria-hidden="true"><circle cx="540" cy="70" r="44" fill="#ffda68"/><path d="M40 110q-20-40 30-40q30-42 55-4q50-15 55 34Z" fill="#ffffffb0"/><path d="M470 220l40-130l35 130Z" fill="#79b98c"/><path d="M550 240l45-140l45 140Z" fill="#6bb27f"/><g transform="translate(180 15) scale(.93)">${dino(0)}</g><g transform="translate(32 160) scale(.54)">${dino(2,'#f5b66e')}</g><path d="M0 360Q240 320 680 350v40H0Z" fill="#6dbb82"/><g fill="#fff0ad"><circle cx="110" cy="345" r="9"/><circle cx="575" cy="346" r="10"/><circle cx="608" cy="358" r="7"/></g></svg>`;}
