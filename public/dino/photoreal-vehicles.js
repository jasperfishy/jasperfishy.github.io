// Two photographic views per vehicle; the six body choices retain their identity.
const bounds={monster:{side:[29,195,1025,601],rear:[1139,164,588,628]},pickup:{side:[23,267,1075,443],rear:[1188,166,527,546]},race:{side:[39,320,1011,308],rear:[1171,258,548,383]},sport:{side:[46,307,996,326],rear:[1153,254,531,403]},truck:{side:[52,253,1023,480],rear:[1180,153,461,618]},van:{side:[21,245,1105,448],rear:[1198,205,522,500]}};
const images=new Map(),painted=new Map();
const bodyFor=config=>bounds[config.body]?config.body:'sport';
const urlFor=body=>new URL('./assets/vehicles/'+body+'.webp',import.meta.url).href;
function paintFilter(hex){
 const rgb=/^#[0-9a-f]{6}$/i.test(hex||'')?hex:'#e74c3c';
 const [r,g,b]=[1,3,5].map(i=>parseInt(rgb.slice(i,i+2),16)/255);
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 const h=d===0?0:60*(max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4);
 const s=d===0?0:d/(1-Math.abs(2*l-1));
 return `hue-rotate(${h}deg) saturate(${s/.8}) brightness(${.65+l*.7})`;
}
export function vehicleSVG(config,view='side'){
 const body=bodyFor(config),box=bounds[body][view];
 return `<svg x="8" y="15" width="304" height="130" viewBox="${box.join(' ')}" preserveAspectRatio="xMidYMax meet" style="filter:${paintFilter(config.paint)}"><image href="${urlFor(body)}" width="1774" height="887"/></svg>`;
}
export function drawVehicle(ctx,config,view,x,y,width,height){
 const body=bodyFor(config);
 if(!images.has(body)){const image=new Image();image.src=urlFor(body);images.set(body,image);}
 const image=images.get(body);if(!image.complete||!image.naturalWidth)return false;
 const key=body+'|'+view+'|'+config.paint;
 if(!painted.has(key)){
  const [sx,sy,sw,sh]=bounds[body][view],canvas=document.createElement('canvas');
  canvas.width=sw;canvas.height=sh;const c=canvas.getContext('2d');
  c.filter=paintFilter(config.paint);c.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);painted.set(key,canvas);
 }
 const canvas=painted.get(key),scale=Math.min(width/canvas.width,height/canvas.height);
 ctx.drawImage(canvas,x+(width-canvas.width*scale)/2,y+height-canvas.height*scale,canvas.width*scale,canvas.height*scale);
 return true;
}
export async function vehicleCanvas(config,view='side',width=240,height=120){
 const body=bodyFor(config);
 if(!images.has(body)){const image=new Image();image.src=urlFor(body);images.set(body,image);}
 await images.get(body).decode();
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 drawVehicle(canvas.getContext('2d'),config,view,0,0,width,height);return canvas;
}
