// The worlds of the Prehistoric Arcade. Display copy lives here so the
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
  },
  {
    id: 'tide-causeway', title: 'Tide Causeway', no: 11,
    tagline: 'The sea takes the road twice a day.',
    how: 'Read the swell and step the stones while the water is low. The far path is longer and drowns first — leave time enough.',
    controls: 'Move to choose a stone · tap or Space to leap the gap',
    mood: 'storm', accent: '#9fe8d4', emblem: 'causeway', unit: 'stones', stars: [12, 22, 34]
  },
  {
    id: 'amber-cairn', title: 'Amber Cairn', no: 12,
    tagline: 'Stone by stone, a mark the herd can find.',
    how: 'Drop each stone where the lean is safest and let it settle. A cairn past its balance tells you in a creak before it falls.',
    controls: 'Move to place · tap or Space to drop · hold to steady the stack',
    mood: 'amber', accent: '#ffcf5a', emblem: 'amber', unit: 'stones', stars: [8, 14, 21]
  },
  {
    id: 'spear-cast', title: 'Spear Cast', no: 13,
    tagline: 'One shadow under bright water.',
    how: 'Draw the spear back and lead the fish where it is going, not where it is. Light bends the shadow — cast below it.',
    controls: 'Move to aim · hold to draw · release to cast',
    mood: 'underwater', accent: '#7de3d4', emblem: 'spear', unit: 'cast', stars: [8, 15, 24]
  },
  {
    id: 'thermal-soar', title: 'Thermal Soar', no: 14,
    tagline: 'Flap once. Let the cliff do the rest.',
    how: 'Climb the warm air off the sunlit faces, then trade height for distance. Touch a mesa only to rest, never to stay.',
    controls: 'Move to bank · hold to tuck and pick up speed',
    mood: 'canyon', accent: '#ffb06a', emblem: 'thermal', unit: 'mesas', stars: [5, 9, 14]
  },
  {
    id: 'lantern-watch', title: 'Lantern Watch', no: 15,
    tagline: 'Keep the flame facing the dark.',
    how: 'Turn the beam so hunters will not cross it, then shield the flame when the wind takes it. A guttering light lets them in.',
    controls: 'Move to turn the beam · tap or Space to shield the flame',
    mood: 'night', accent: '#8fd0ff', emblem: 'lantern', unit: 'watches', stars: [6, 11, 17]
  },
  {
    id: 'geyser-leap', title: 'Geyser Leap', no: 16,
    tagline: 'The mountain breathes. Ride the breath.',
    how: 'Stand on the pad and wait for the plume, then let it lift you to the next terrace. Ash smothers a launch — count it.',
    controls: 'Move to step the pads · tap or Space to ride the plume',
    mood: 'volcanic', accent: '#ff7d4d', emblem: 'geyser', unit: 'terraces', stars: [10, 18, 28]
  },
  {
    id: 'river-braid', title: 'River Braid', no: 17,
    tagline: 'Swim the bends, rest in the wakes.',
    how: 'Tuck behind drifting logs and spend your breath only in the fast middle. The reeds are slow, and the reeds are long.',
    controls: 'Move to swim · hold to tuck behind a log',
    mood: 'jungle', accent: '#ffd06a', emblem: 'rapids', unit: 'bends', stars: [9, 16, 25]
  },
  {
    id: 'nest-gather', title: 'Nest and Rain', no: 18,
    tagline: 'Carry the nest before the sky opens.',
    how: 'Twigs, shell and fern each weigh you down, and the rain does not wait. Bring what the nest still lacks and get back.',
    controls: 'Move to walk · tap a pile to lift it · tap the nest to drop',
    mood: 'dawn', accent: '#ffb56b', emblem: 'nest', unit: 'loads', stars: [10, 18, 27]
  },
  {
    id: 'burrow-sense', title: 'Burrow Sense', no: 19,
    tagline: 'The sand is loud when you listen.',
    how: 'Dig toward the rumble of the colony and away from ringing root. Air runs out in the dark — surface before it runs out.',
    controls: 'Move to dig · hold to listen · tap to surface for air',
    mood: 'amber', accent: '#ffcf5a', emblem: 'burrow', unit: 'tunnels', stars: [7, 13, 20]
  },
  {
    id: 'egg-tilt', title: 'Egg Tilt', no: 20,
    tagline: 'One wrong lean and the year is gone.',
    how: 'Lean the ridge under the egg and let momentum carry the gaps. Too little and it stops in the cold; too much and it breaks.',
    controls: 'Move to lean the ridge · tap or Space to brace',
    mood: 'ice', accent: '#9fe6ff', emblem: 'egg', unit: 'ridges', stars: [8, 15, 24]
  },
  {
    id: 'vine-cannon', title: 'Vine Cannon', no: 21,
    tagline: 'Hatchlings dislike flying. They like landing.',
    how: 'Stretch the vine back, bend the arc over the branches and let go. The canopy swings — aim where the basket will be.',
    controls: 'Drag to stretch and aim · release to launch',
    mood: 'jungle', accent: '#ffd06a', emblem: 'vine', unit: 'landed', stars: [7, 13, 21]
  },
  {
    id: 'cave-line', title: 'Cave Line', no: 22,
    tagline: 'Paint the herd before the torch dies.',
    how: 'Draw each animal in one steady line. Lift the charcoal and the outline fades; press too hard and the pigment runs.',
    controls: 'Drag to draw the line · lift to reposition the hand',
    mood: 'night', accent: '#8fd0ff', emblem: 'charcoal', unit: 'murals', stars: [4, 7, 11]
  },
  {
    id: 'dawn-chorus', title: 'Dawn Chorus', no: 23,
    tagline: 'One voice answers, then another.',
    how: 'Add each voice as its bar comes round. A layer dropped off-beat clouds the whole chorus; three clean layers open the sky.',
    controls: 'Tap a voice as its bar returns · keys 1–4',
    mood: 'dawn', accent: '#ffb56b', emblem: 'chorus', unit: 'voices', stars: [10, 18, 27]
  },
  {
    id: 'frost-hollow', title: 'Frost Hollow', no: 24,
    tagline: 'The frost line walks at noon.',
    how: 'Get every hatchling into the wind shadow of the rocks before the white arrives. Drive them too hard and they scatter.',
    controls: 'Move between them to herd · hold to call them close',
    mood: 'ice', accent: '#9fe6ff', emblem: 'frost', unit: 'warmed', stars: [9, 16, 25]
  },
  {
    id: 'mud-wall', title: 'Mud Wall', no: 25,
    tagline: 'The lahar chooses the lowest way.',
    how: 'Pile walls and cut channels so the flow turns into the gully. Water never forgets a gap, and it never forgives one.',
    controls: 'Drag to cut a channel · tap to pile mud',
    mood: 'storm', accent: '#9fe8d4', emblem: 'trowel', unit: 'diverted', stars: [6, 11, 17]
  },
  {
    id: 'pack-draft', title: 'Pack Draft', no: 26,
    tagline: 'Run at the back. Finish at the front.',
    how: 'Ease the pace and let the fast runners break the wind for you. Surge only when the gap is yours to take.',
    controls: 'Move to weave · press, or set a second thumb down, to surge · release to settle',
    mood: 'dusk', accent: '#ff8f5e', emblem: 'trail', unit: 'paces led', stars: [12, 22, 34]
  },
  {
    id: 'star-path', title: 'Star Path', no: 27,
    tagline: 'The herd follows what you can see.',
    how: 'Call the line toward the true star while cloud wipes the sky. Guess its place and the whole herd turns wrong with you.',
    controls: 'Move to point the way · tap to call the turn',
    mood: 'night', accent: '#8fd0ff', emblem: 'starpath', unit: 'miles', stars: [8, 15, 24]
  },
  {
    id: 'ridge-mirror', title: 'Ridge Mirror', no: 28,
    tagline: 'Flash the lost ones home through the mist.',
    how: 'Tilt the hide mirror so the sun bounces once off the wet rock and onto the stragglers. One bend; choose where it lands.',
    controls: 'Move to tilt the mirror · tap to flash',
    mood: 'dawn', accent: '#ffb56b', emblem: 'mirror', unit: 'guided', stars: [8, 14, 22]
  },
  {
    id: 'fossil-brush', title: 'Fossil Brush', no: 29,
    tagline: 'Sixty million years, one afternoon.',
    how: 'Brush the sand off the bones grain by grain and keep them damp. Dry bone cracks under a hurried hand.',
    controls: 'Drag to brush · hold to dampen the bone',
    mood: 'canyon', accent: '#ffb06a', emblem: 'brush', unit: 'bones', stars: [5, 9, 14]
  }
];

export const byId = (id) => CATALOG.find((g) => g.id === id);

export const LOADERS = {
  'raptor-run': () => import('./games/raptor-run.js?v=du-f652baf3e7fda2b1'),
  'trike-charge': () => import('./games/trike-charge.js?v=du-f652baf3e7fda2b1'),
  'ptero-plunge': () => import('./games/ptero-plunge.js?v=du-f652baf3e7fda2b1'),
  'stego-stand': () => import('./games/stego-stand.js?v=du-f652baf3e7fda2b1'),
  'volcano-escape': () => import('./games/volcano-escape.js?v=du-f652baf3e7fda2b1'),
  'tar-pit': () => import('./games/tar-pit.js?v=du-f652baf3e7fda2b1'),
  'meteor-herd': () => import('./games/meteor-herd.js?v=du-f652baf3e7fda2b1'),
  'starlight-stalk': () => import('./games/starlight-stalk.js?v=du-f652baf3e7fda2b1'),
  'bone-bridge': () => import('./games/bone-bridge.js?v=du-f652baf3e7fda2b1'),
  'primal-rhythm': () => import('./games/primal-rhythm.js?v=du-f652baf3e7fda2b1'),
  'tide-causeway': () => import('./games/tide-causeway.js?v=du-f652baf3e7fda2b1'),
  'amber-cairn': () => import('./games/amber-cairn.js?v=du-f652baf3e7fda2b1'),
  'spear-cast': () => import('./games/spear-cast.js?v=du-f652baf3e7fda2b1'),
  'thermal-soar': () => import('./games/thermal-soar.js?v=du-f652baf3e7fda2b1'),
  'lantern-watch': () => import('./games/lantern-watch.js?v=du-f652baf3e7fda2b1'),
  'geyser-leap': () => import('./games/geyser-leap.js?v=du-f652baf3e7fda2b1'),
  'river-braid': () => import('./games/river-braid.js?v=du-f652baf3e7fda2b1'),
  'nest-gather': () => import('./games/nest-gather.js?v=du-f652baf3e7fda2b1'),
  'burrow-sense': () => import('./games/burrow-sense.js?v=du-f652baf3e7fda2b1'),
  'egg-tilt': () => import('./games/egg-tilt.js?v=du-f652baf3e7fda2b1'),
  'vine-cannon': () => import('./games/vine-cannon.js?v=du-f652baf3e7fda2b1'),
  'cave-line': () => import('./games/cave-line.js?v=du-f652baf3e7fda2b1'),
  'dawn-chorus': () => import('./games/dawn-chorus.js?v=du-f652baf3e7fda2b1'),
  'frost-hollow': () => import('./games/frost-hollow.js?v=du-f652baf3e7fda2b1'),
  'mud-wall': () => import('./games/mud-wall.js?v=du-f652baf3e7fda2b1'),
  'pack-draft': () => import('./games/pack-draft.js?v=du-f652baf3e7fda2b1'),
  'star-path': () => import('./games/star-path.js?v=du-f652baf3e7fda2b1'),
  'ridge-mirror': () => import('./games/ridge-mirror.js?v=du-f652baf3e7fda2b1'),
  'fossil-brush': () => import('./games/fossil-brush.js?v=du-f652baf3e7fda2b1')
};
