const cache=new Map(),pictures=new Map();
const environments=['jungle','volcanic','night','underwater','jungle','jungle','ice','jungle'];
const dinosaurs=['stego','bronto','bronto','plesiosaurus','oviraptor','tricera','trex','trex'];
function load(path){
 const url=new URL('../../../../assets/'+path,import.meta.url).href;
 if(!cache.has(url))cache.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;}));
 return cache.get(url);
}
function fit(c,image,x,y,w,h){const k=Math.min(w/image.width,h/image.height);c.drawImage(image,x+(w-image.width*k)/2,y+h-image.height*k,image.width*k,image.height*k);}
export async function photoPuzzle(scene,index){
 if(pictures.has(index))return pictures.get(index);
 const [background,dino]=await Promise.all([load('environments/'+environments[index]+'.webp'),load('prehistoric/'+dinosaurs[index]+'.webp')]);
 const canvas=document.createElement('canvas');canvas.width=720;canvas.height=480;const c=canvas.getContext('2d');
 const k=Math.max(720/background.width,480/background.height);c.drawImage(background,(720-background.width*k)/2,(480-background.height*k)/2,background.width*k,background.height*k);
 fit(c,dino,200,170,340,250);
 // A find is drawn from the one library that decides what a specimen looks like:
 // the objects layer. This file used to keep its own nine-glyph table, which
 // meant a jigsaw and a screen could disagree about the same animal (🦕 was a
 // bronto here and a hatchling there) and that anything not named in the table
 // was stamped as a cartoon into a photograph puzzle forever.
 for(const find of scene.finds){
  const x=find.x*720,y=find.y*480;
  const slug=window.DUFX&&window.DUFX.objects&&window.DUFX.objects.slug(find.ch);
  if(slug){const image=await load('objects/'+slug+'.webp');fit(c,image,x-42,y-44,84,88);}
  // A find this universe has no photograph for keeps a museum marker, not a
  // cartoon: an unknown specimen is still a place a child can click.
  else {c.strokeStyle='rgba(255,252,240,.92)';c.lineWidth=4;c.beginPath();c.arc(x,y,20,0,Math.PI*2);c.stroke();c.fillStyle='rgba(255,252,240,.5)';c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();}
 }
 const result=canvas.toDataURL('image/png');pictures.set(index,result);return result;
}
