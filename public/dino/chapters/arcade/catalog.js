// The ten worlds of the Prehistoric Arcade. Display copy lives here so the
// menu can paint instantly without loading a single game module.

export const CATALOG = [
  {
    id: 'raptor-run', title: 'Raptor Run', no: 1,
    tagline: 'Sprint the fern corridor before the light goes.',
    how: 'Jump the fallen logs, duck beneath branches, and gather shed feathers for speed. Every fifth feather opens a tailwind.',
    controls: 'Move to steer · tap or Space to jump · hold down to duck',
    mood: 'jungle', accent: '#ffd06a', emblem: 'claw', unit: 'paces', stars: [450, 720, 960]
  },
  {
    id: 'trike-charge', title: 'Trike Charge', no: 2,
    tagline: 'Build the charge. Break the way open.',
    how: 'Hold to lower your horns and gather force, then release to shatter boulders. Turn a raider away before it reaches the herd.',
    controls: 'Hold to charge · release to ram · move to cover the line',
    mood: 'canyon', accent: '#ffb06a', emblem: 'horn', unit: 'force', stars: [16, 30, 46]
  },
  {
    id: 'ptero-plunge', title: 'Pterosaur Plunge', no: 3,
    tagline: 'The reef is bright, and the air is running out.',
    how: 'Dive for silver fish among the rocks, then rise through the kelp to breathe. Each clean catch lengthens your next breath.',
    controls: 'Move to swim · tap to dive faster · surface to breathe',
    mood: 'underwater', accent: '#7de3d4', emblem: 'wave', unit: 'fish', stars: [14, 26, 40]
  },
  {
    id: 'stego-stand', title: 'Stego Stand', no: 4,
    tagline: 'One nest. One tail. All night.',
    how: 'Face the hunter and swing the spiked tail at the right moment. Let the plate-sail glow charge your heaviest blow.',
    controls: 'Turn toward danger · tap or Space to swing',
    mood: 'dusk', accent: '#ff8f5e', emblem: 'spike', unit: 'stands', stars: [10, 20, 32]
  },
  {
    id: 'volcano-escape', title: 'Volcano Escape', no: 5,
    tagline: 'The mountain is awake. Climb.',
    how: 'Leap the rising ledges as lava fills the caldera. Smash cracked vents for a burst of steam and height.',
    controls: 'Move to climb · tap or Space to leap · hold to cling',
    mood: 'volcanic', accent: '#ff7d4d', emblem: 'volcano', unit: 'ledges', stars: [14, 26, 40]
  },
  {
    id: 'tar-pit', title: 'Tar Pit Lifeline', no: 6,
    tagline: 'Every bubble is a countdown.',
    how: 'Swing the vine to each stranded hatchling and pull them free before the tar closes over. The rope strains — let go at the top of the arc.',
    controls: 'Hold to grip · release to fly · move to aim',
    mood: 'amber', accent: '#ffcf5a', emblem: 'rope', unit: 'rescued', stars: [6, 11, 16]
  },
  {
    id: 'meteor-herd', title: 'Meteor Herd', no: 7,
    tagline: 'Keep them together under a burning sky.',
    how: 'Guide the herd across the plain and raise a shelter call when fire falls. Bring the stragglers back to the group.',
    controls: 'Move to lead · hold to call the herd into shelter',
    mood: 'storm', accent: '#9fe8d4', emblem: 'meteor', unit: 'survived', stars: [14, 26, 40]
  },
  {
    id: 'starlight-stalk', title: 'Starlight Stalk', no: 8,
    tagline: 'Stay in the dark. Keep the egg warm.',
    how: 'Slip between shadows while the great hunters sleep. Noise wakes them; carrying the egg slows you. Reach the far nest.',
    controls: 'Move to creep · hold to muffle your steps',
    mood: 'night', accent: '#c9b6ff', emblem: 'moon', unit: 'distance', stars: [700, 1100, 1500]
  },
  {
    id: 'bone-bridge', title: 'Bone Bridge', no: 9,
    tagline: 'The ravine is deep. The bones are old.',
    how: 'Lay ribs across the chasm, test the span, then send the herd across. A bridge that holds is a bridge that stays.',
    controls: 'Move to place a rib · tap or Space to test the span',
    mood: 'ice', accent: '#9fe6ff', emblem: 'bridge', unit: 'crossed', stars: [2, 4, 6]
  },
  {
    id: 'primal-rhythm', title: 'Primal Rhythm', no: 10,
    tagline: 'The herd drums the world awake.',
    how: 'Catch each falling note as it crosses the ring and stomp it in time. A clean run builds the great chorus.',
    controls: 'Tap a lane as its note reaches the ring · keys 1–4',
    mood: 'dusk', accent: '#ff8f5e', emblem: 'drum', unit: 'beats', stars: [40, 90, 150]
  }
];

export const byId = (id) => CATALOG.find((g) => g.id === id);

export const LOADERS = {
  'raptor-run': () => import('./games/raptor-run.js'),
  'trike-charge': () => import('./games/trike-charge.js'),
  'ptero-plunge': () => import('./games/ptero-plunge.js'),
  'stego-stand': () => import('./games/stego-stand.js'),
  'volcano-escape': () => import('./games/volcano-escape.js'),
  'tar-pit': () => import('./games/tar-pit.js'),
  'meteor-herd': () => import('./games/meteor-herd.js'),
  'starlight-stalk': () => import('./games/starlight-stalk.js'),
  'bone-bridge': () => import('./games/bone-bridge.js'),
  'primal-rhythm': () => import('./games/primal-rhythm.js')
};
