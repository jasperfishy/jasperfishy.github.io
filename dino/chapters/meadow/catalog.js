export const types=[
 ['match','Matching','🧩','Find the same picture','#d4ede5'],['count','Counting','🥚','Count the dinosaur eggs','#fff0b5'],['colours','Colour hunt','🌈','Find the colour','#f8d6df'],['shapes','Shape picnic','🔷','Find the shape','#d4e5fc'],['size','Big & small','🦕','Compare sizes','#cdeedc'],
 ['pattern','Patterns','🍄','What comes next?','#f9ddc3'],['sort','Sorting','🧺','Put things together','#d9e8fb'],['order','Number trail','👣','Tap numbers in order','#fbe9a9'],['memory','Memory eggs','🥚','Find the pairs','#e5dcf5'],['maze','Meadow paths','🗺️','Help Dino reach the nest','#d1eddd'],
 ['dig','Fossil finder','🦴','Brush away the soil','#f3dfc4'],['bubbles','Bubble meadow','🫧','Pop the picture bubbles','#cceef7'],['feed','Dino picnic','🍓','Feed a hungry friend','#f9d5d9'],['wash','Bath time','🧼','Wash a muddy dinosaur','#d4eafa'],['cook','Little kitchen','🥣','Make a dinosaur snack','#ffebc7'],
 ['dress','Dress up','👒','Dress your dinosaur friend','#f7d8e7'],['music','Dino music','🎵','Play a little tune','#e4dcfa'],['colouring','Colouring book','🎨','Colour your dinosaur world','#fbdac6'],['draw','Drawing pad','🖍️','Make your own picture','#d4eee8'],['trace','Trail tracing','〰️','Follow a gentle path','#d9e6f6']
].map(([id,name,icon,hint,colour])=>({id,name,icon,hint,colour}));
export const themes=['Sunny meadow','Berry forest','Rainbow river','Starry valley','Flower island'];
export const activities=types.flatMap(t=>themes.map((theme,level)=>({id:`${t.id}-${level}`,type:t.id,level,title:`${t.name}: ${theme}`})));
export const tokens=['🥚','🍓','🍃','🌻','🦋','🍄','🐚','🍎','🥕','⭐'];
export const colours=[['Red','#e95b65'],['Orange','#f39c4a'],['Yellow','#f6ce4d'],['Green','#66b882'],['Blue','#55a5d9'],['Purple','#a48bd3'],['Pink','#ec91b6'],['Brown','#ab805c'],['White','#ffffff'],['Black','#344c58'],['Mint','#a5ddcc'],['Peach','#f5bba2']];
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function mazeFor(level){const paths=[[0,1,5,9,10,14,15],[0,4,8,9,5,6,10,11,15],[0,1,2,6,5,9,13,14,15],[0,4,5,6,2,3,7,11,15],[0,1,5,4,8,12,13,14,15]];return paths[level%5];}
