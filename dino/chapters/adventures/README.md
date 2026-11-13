# Dinosaur Universe

An original, modular dinosaur play world. This starter build establishes the shared home, parent settings, player name, progress and rewards, offline shell, and several original playable activities. The architecture is deliberately ready to absorb the finished Dino Park games and Dino Meadow as chapters after their source and integration seams are reviewed.

## Included in this foundation

- Dino Builder: pick up and drag head, body, tail, feet and plates into matching places on a friendly dinosaur outline. Difficulty changes the number of parts.
- Fossil Hunt: uncover a small fossil story with gentle progress and no fail state.
- Dino Memory: find dinosaur pairs; the number of pairs follows the selected difficulty.
- Dino Picnic: choose food for a hungry dinosaur, with personalized spoken prompts when speech is enabled.
- Dino Care Clinic: choose from the growing dinosaur roster and offer gentle comforts such as water, brushing, a fern snack and a cosy rest. Each visit gains a few steps as levels advance.
- Mummy’s Cozy Corner: help illustrated Mummy Courtney with a chair, tidying, a little pretend snack or tea, a leaf fan, and soothing dinosaur burbles. The number of kind tasks grows with level; there are no timers or fail states.
- Moonbeam Rescue: remember a sequence of glowing symbols to guide a baby dinosaur across a moonlit meadow to its family. The trail grows from two steps to six, with a replay button and gentle retries.
- Hatchling Nursery: gently hatch a baby dinosaur and pick its first toy.
- Footprint Trail: follow a numbered path at a comfortable pace.
- Shape Safari: spot shapes hidden in the dinosaur meadow.
- Dino Beat Parade: watch and repeat a gentle dinosaur rhythm.
- Dino Habitat Builder: choose water, plants, shade and other features to prepare a welcoming prehistoric home. New habitat details appear as levels grow.
- Dino Storybook: combine 30 prehistoric heroes, eight places, eight surprises, a dozen plot openings and discoveries, and eight ending choices to make millions of story combinations. Five ending choices are happy, two are hopeful, and one gently tender choice handles ordinary sadness with comfort. Optional narration reads the tale and a little creature fact; lightweight CSS motion respects reduced-motion settings.
- Prehistoric Discoveries: browse a field guide with 24 dinosaur varieties and six other ancient animals, including flying and marine reptiles. Gentle facts can be read aloud, and the wider dinosaur roster also supplies the celebration rewards.
- Coloring Studio: eighteen original vector pages featuring twelve dinosaur silhouettes and twelve distinct prehistoric scene accents, with tap-to-fill regions, palette, undo, a local gallery, crisp SVG downloads and printing.
- Naughty Daddy: choose a dinosaur, guide it with large touch controls, and catch Daddy Ellis in a gentle cartoon chase. His illustrated avatar is a compact local asset.

## Modular structure

Each activity has a catalog card and a registered mount function. The shared registration API lives in src/module-registry.js. Newer activities live in separate files under src/modules and receive the same context for the home, name, parent settings, rewards and saved progress. Older activities in src/main.js can move into that structure as they are expanded. Planned integration seams are reserved for:

- Dino Meadow chapter: import mechanics, its expanded drawing catalogue and its preserved dm- local-data namespace after compatibility review.
- Chief's Dino Park chapter: import only after Chief's build is complete and its final source and checkpoint have been reviewed.

This starter intentionally does not modify either source project or claim that their games are already integrated. The Coloring Studio currently includes twelve original dinosaur silhouettes and twelve themed background treatments across eighteen pages, with later pages unlocking as a child earns stars.

## Educational references

Creature descriptions and category distinctions are written for young children and should remain short, gentle and evidence-based. The distinction between dinosaurs, pterosaurs, marine reptiles and Dimetrodon follows the [Natural History Museum's guide to what dinosaurs are](https://www.nhm.ac.uk/discover/what-are-dinosaurs.html); dinosaur variety and selected facts draw on its [Dino Directory](https://www.nhm.ac.uk/discover/dino-directory). The guide labels Pteranodon and Quetzalcoatlus as flying reptiles, Mosasaurus, Plesiosaurus and Ichthyosaurus as marine reptiles, and Dimetrodon as a different ancient animal.

The Daddy Ellis avatar is an original cartoon illustration created from the second reference photo supplied for this character and approved for image generation. The Mummy Courtney portrait is an original illustration based on her supplied photo reference. Neither original photo is included in this project.

## Run locally

Serve this folder over HTTPS or localhost. For example, use any static file server whose root is this directory. Open index.html through that server to play. Service workers do not work from a file:// URL.

## Child and parent experience

The child's name and settings stay on the device. Sound and speech can be switched off. A parent gate protects settings. Difficulty presets are Little Explorer, Curious Explorer and Dino Adventurer. There are no timers, losing screens, ads, accounts or remote assets in this starter.

## Expansion approach

The long-term aim is a broad, polished collection. Count a module as new when its play goal or interaction offers a meaningful new experience. Add themed packs in small, reviewable batches, optimize artwork and audio, and let families choose which optional packs to keep offline.
