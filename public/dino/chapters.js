// Dinosaur Universe — chapter registry.
// To add a chapter:
//  1. Put its files under chapters/<id>/ (its own html, css, js, assets).
//  2. The chapter page must NOT load its own service worker when embedded:
//     it checks window.self === window.top before registering.
//  3. Give it its own localStorage key prefix so data stays separate
//     (Park uses "dino_", Meadow uses "dm-").
//  4. Add one entry below. The hub menu, routing and offline cache update automatically.
export const chapters = [
  {
    id: 'park',
    title: 'Dino Park',
    subtitle: '10 puzzle games · full Park chapter',
    icon: '🦖',
    url: 'chapters/park/index.html',
    storagePrefix: 'dino_',
  },
  {
    id: 'meadow',
    title: 'Dino Meadow',
    subtitle: '20 game types · 100 variations · 120-page colouring book',
    icon: '🌿',
    url: 'chapters/meadow/index.html',
    storagePrefix: 'dm-',
  },
  {
    id: 'drive',
    title: 'Dino Car Studio',
    subtitle: '6 dinosaur worlds · race rivals · unlock 48 cars',
    icon: '🏎️',
    url: 'chapters/drive/index.html',
    storagePrefix: 'dino-car-studio-v1',
  },
  {
    id: 'adventures',
    title: 'Dino Adventures',
    subtitle: '21 adventures · chase Daddy · help Mummy · hatch, build, rescue',
    icon: '🎈',
    url: 'chapters/adventures/index.html',
    storagePrefix: 'dinosaur-universe-player-v1',
  },
];

// Original quick-play activities use the same hub shell and launch directly
// into their module. Add a new module here and in adventures/src/main.js.
export const activities = [
  { id: 'rescue', title: 'The Great Dino Rescue', subtitle: 'A seven-chapter quest to save Mummy and Daddy', icon: '🏇', category: 'Adventures' },
  { id: 'builder', title: 'Build a Dinosaur', subtitle: 'Fit the dinosaur parts together', icon: '🦖', category: 'Puzzles' },
  { id: 'jigsaw', title: 'Dino Picture Jigsaw', subtitle: 'Piece together a prehistoric scene', icon: '🧩', category: 'Puzzles' },
  { id: 'fossil', title: 'Fossil Explorer', subtitle: 'Brush away the earth and discover bones', icon: '🦴', category: 'Discovery' },
  { id: 'memory', title: 'Memory Eggs', subtitle: 'Find the dinosaur friends hiding inside', icon: '🥚', category: 'Puzzles' },
  { id: 'picnic', title: 'Dino Picnic', subtitle: 'Choose a tasty treat for a hungry dino', icon: '🍓', category: 'Cozy play' },
  { id: 'hatchling', title: 'Hatchling Nursery', subtitle: 'Help a baby dino hatch and choose a toy', icon: '🥚', category: 'Cozy play' },
  { id: 'trail', title: 'Footprint Trail', subtitle: 'Follow the footprints to see who passed by', icon: '👣', category: 'Learning' },
  { id: 'shapes', title: 'Shape Safari', subtitle: 'Spot shapes around the meadow', icon: '🔎', category: 'Learning' },
  { id: 'beat', title: 'Dino Beat Parade', subtitle: 'Listen, remember and play the rhythm', icon: '🥁', category: 'Creative' },
  { id: 'habitat', title: 'Dino Habitat Builder', subtitle: 'Make a welcoming prehistoric home', icon: '🌱', category: 'Discovery' },
  { id: 'storybook', title: 'Dino Storybook', subtitle: 'Make a magical story together', icon: '📖', category: 'Creative' },
  { id: 'discoveries', title: 'Prehistoric Discoveries', subtitle: 'Meet dinosaurs and other ancient animals', icon: '🦴', category: 'Learning' },
  { id: 'care', title: 'Dino Care Clinic', subtitle: 'Help a dinosaur feel cosy and cared for', icon: '🧺', category: 'Cozy play' },
  { id: 'mummy', title: 'Mummy’s Cozy Corner', subtitle: 'Help Mummy Courtney with dinosaur friends', icon: '🌿', category: 'Cozy play' },
  { id: 'moonbeam', title: 'Moonbeam Rescue', subtitle: 'Remember a glowing trail and reunite a dino family', icon: '🌙', category: 'Adventures' },
  { id: 'parade', title: 'Dinosaur Dress-up Parade', subtitle: 'Choose a dinosaur, parade look and magical world', icon: '🎉', category: 'Creative' },
  { id: 'constellations', title: 'Starry Dino Constellations', subtitle: 'Connect the stars to draw a dinosaur in the night sky', icon: '🌌', category: 'Puzzles' },
  { id: 'skymail', title: 'Prehistoric Sky Mail', subtitle: 'Deliver little surprises to ancient flying friends', icon: '📮', category: 'Adventures' },
  { id: 'weather', title: 'Dino Weather Workshop', subtitle: 'Help prehistoric friends feel just right in every kind of weather', icon: '🌦️', category: 'Discovery' },
  { id: 'coloring', title: 'Coloring Studio', subtitle: 'Colour dinosaur scenes and keep your art', icon: '🎨', category: 'Creative' },
  { id: 'quest', title: 'Dino Quest: The Lost Egg', subtitle: 'Climb a mountain, find a cave, save an egg', icon: '⛰️', category: 'Adventures' },
  { id: 'daddy', title: 'Naughty Daddy', subtitle: 'Guide a dinosaur through a silly chase', icon: '🏃', category: 'Adventures' },
];
