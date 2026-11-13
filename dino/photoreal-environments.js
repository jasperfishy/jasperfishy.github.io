// Shared photographic environments. Gameplay objects retain their own depths.
const loaded = new Map();
const canvasImages = new Map();
// Live geometry masks keep moving shorelines, playable paths and collision
// silhouettes aligned while replacing their flat fills with photographic detail.
export function addMaterialLayer(scene, geometry, name, width, height, options={}) {
  const key='photo-material-'+name;
  let active=true;
  scene.events.once('shutdown',()=>{active=false;});
  const image=new Image();
  image.onload=()=>{
    if(!active)return;
    if(!scene.textures.exists(key))scene.textures.addImage(key,image);
    const layer=scene.add.tileSprite(0,0,width,height,key).setOrigin(0)
      .setDepth(options.depth ?? geometry.depth+.01).setAlpha(options.alpha ?? .8);
    layer.setMask(geometry.createGeometryMask());
    layer.tileScaleX=layer.tileScaleY=options.scale ?? .5;
    if(options.flow && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.DUFX?.settings?.calm)
      scene.tweens.add({targets:layer,tilePositionX:image.width,duration:40000,repeat:-1,ease:'Linear'});
  };
  image.src=new URL('./assets/environments/'+name+'.webp',import.meta.url).href;
}
export function drawEnvironment(context,width,height,mood,offset=0) {
  const name=environmentName(mood);
  if (!canvasImages.has(name)) {
    const image=new Image();
    image.src=new URL('./assets/environments/'+name+'.webp',import.meta.url).href;
    canvasImages.set(name,image);
  }
  const image=canvasImages.get(name);
  if (!image.complete || !image.naturalWidth) return false;
  const scale=Math.max(width/image.naturalWidth,height/image.naturalHeight)*1.035;
  const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  context.drawImage(image,(width-w)/2+Math.sin(offset)*width*.012,(height-h)/2,w,h);
  return true;
}
export function environmentName(mood) {
  return ({night:'night',dusk:'night',volcanic:'volcanic',underwater:'underwater',ice:'ice',canyon:'canyon',coast:'coast',mountain:'mountain',space:'space',city:'city',cave:'cave'})[mood] || 'jungle';
}
export function addEnvironment(scene, width, height, mood, depth=-10) {
  const name=environmentName(mood), key='photo-world-'+name;
  if (!loaded.has(name)) loaded.set(name,new Promise((resolve,reject)=>{
    const img=new Image(); img.onload=()=>resolve(img); img.onerror=reject;
    img.src=new URL('./assets/environments/'+name+'.webp',import.meta.url).href;
  }));
  let active=true;
  scene.events.once('shutdown',()=>{active=false;});
  return loaded.get(name).then(img=>{
    if (!active) return null;
    if (!scene.textures.exists(key)) scene.textures.addImage(key,img);
    const scale=Math.max(width/img.width,height/img.height)*1.035;
    const background=scene.add.image(width/2,height/2,key).setDepth(depth).setScale(scale);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !window.DUFX?.settings?.calm) {
      scene.tweens.add({targets:background,x:width/2+width*.008,scale:scale*1.025,duration:24000,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    return background;
  }).catch(()=>null);
}
