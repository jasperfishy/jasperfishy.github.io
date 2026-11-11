/* Dinosaur Universe — the story spine (DUSTORY) and its cutscene player.
 *
 * The collection had seven story-driven games that never referenced each other
 * and sixteen that had no story at all. This is one arc — The Starlight Garden —
 * that runs across every world, written around the characters the games already
 * use (Rex, Pip, Bumper, Zip, Spike, Gentle, Mummy Courtney, Daddy Ellis,
 * Grumblecloud) so it reads as the same universe rather than a new one.
 *
 *   DUSTORY.play(0, { onDone })     run a chapter cutscene in the hub
 *   DUSTORY.line('park.puzzle','intro')   a spoken line for one game
 *   DUSTORY.goal('park')            what the child is working towards
 *   DUSTORY.chapterFor('meadow')    which chapter belongs to a world
 *   DUSTORY.picks()                 { park: 'side', meadow: 'river', … }
 *
 * Nothing here is a wall of text: a beat is one short sentence, an illustrated
 * friend, and a big friendly arrow, because the audience is three to eight.
 * Six of the chapters ask the child to choose, and the finale is stitched
 * together from those choices, so two children never see quite the same ending.
 */
(function () {
  'use strict';
  if (window.DUSTORY && window.DUSTORY.play) return;
  const FX = () => window.DUFX;

  const FRIENDS = {
    rex: { name: 'Rex', species: 'trex', colour: 'green', role: 'Keeps the gate of Dino Park' },
    pip: { name: 'Pip', species: 'ptero', colour: 'pink', role: 'Flies news between the worlds' },
    bumper: { name: 'Bumper', species: 'tricera', colour: 'teal', role: 'Bumps things into place' },
    zip: { name: 'Zip', species: 'raptor', colour: 'red', role: 'Fastest feet in the meadow' },
    spike: { name: 'Spike', species: 'stego', colour: 'purple', role: 'Grows the friendliest plants' },
    gentle: { name: 'Gentle', species: 'bronto', colour: 'orange', role: 'Tallest, gentlest, best at reaching' },
    owl: { name: 'Wise Owl', species: 'ptero', colour: 'yellow', role: 'Asks one riddle a day' },
    grumble: { name: 'Grumblecloud', species: 'trex', colour: 'blue', role: 'Loud, but only because he is lonely' }
  };

  /* Each beat: text, which friend is on screen, and the background it plays over.
   *
   * Two kinds of beat do more than narrate, and they are what makes this a
   * branching story rather than a slideshow:
   *   ask    — the child picks a way forward. The reply beats splice in right
   *            after, and the pick is kept in the journey ledger forever as
   *            choice:<chapter>:<tag>.
   *   ifPick — only shows for a child who once chose that way. ifNone covers the
   *            child who skipped the choice, and ifPicks counts the choices made,
   *            so the finale is assembled from the path they actually took.
   */
  const CHAPTERS = [
    {
      id: 'prologue', title: 'The Night the Stars Came Down', world: null, scene: 'night',
      beats: [
        { text: 'LOOK! Over Mount Roar the whole sky is full of sparkling dinosaur eggs!', who: 'rex', state: 'happy' },
        { text: 'Those are Star Seeds. Every single one is a wish the universe made for a friend.', who: 'rex', state: 'idle' },
        { text: 'Oh dear. Grumblecloud sneezed the biggest sneeze in history and blew them everywhere.', who: 'grumble', state: 'roar' },
        { text: 'He did not mean it. He says sorry in a voice like thunder and then hides behind a hill.', who: 'grumble', state: 'sad' },
        { text: 'Will you help me gather them, NAME? Play in every world and the Starlight Garden will shine again!', who: 'rex', state: 'happy' },
        {
          text: 'First though, NAME — somebody has to ride with you. Who do you pick?', who: 'rex', state: 'happy',
          ask: {
            prompt: 'Who rides with you?',
            options: [
              {
                tag: 'pip', label: '🪽 Pip, who sees everything from the sky', reply: [
                  { text: 'Pip! She is already circling. From up there she can spot one little glow in any bush.', who: 'pip', state: 'happy' },
                  { text: 'Hold on tight, NAME. We fly at dawn, and she never gets dizzy, not even once.', who: 'pip', state: 'walk' }
                ]
              },
              {
                tag: 'bumper', label: '🦣 Bumper, who carries everybody', reply: [
                  { text: 'Bumper! His back is bigger than a bus and he never gets tired of carrying friends.', who: 'bumper', state: 'happy' },
                  { text: 'Climb aboard. He will not start walking until you say go, so go on and say it.', who: 'bumper', state: 'walk' }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      id: 'park', title: 'Dino Park and the Sleeping Dinosaurs', world: 'park', scene: 'sun',
      goal: { stars: 9, text: 'Earn 9 stars in Dino Park' },
      beats: [
        { text: 'Dino Park is very quiet. The dinosaurs have fallen asleep and forgotten all their games.', who: 'spike', state: 'sleep' },
        { text: 'Twelve games are waiting. Every one you finish wakes another dinosaur up.', who: 'spike', state: 'happy' },
        { text: 'The big gate is shut. Rex keeps the only key, and Rex has mislaid it, as usual.', who: 'gentle', state: 'idle' },
        { text: 'Bumper says he can hear something glowing inside. Two ways in, and both beat talking about it.', who: 'bumper', state: 'walk' },
        {
          text: 'Which way in, NAME?', who: 'bumper', state: 'happy',
          ask: {
            prompt: 'How do we get in?',
            options: [
              {
                tag: 'side', label: '🌿 Through the fern garden, where the small ones nap', reply: [
                  { text: 'Careful feet in here. The tiniest dinosaurs sleep under the ferns, and they dream in colours.', who: 'spike', state: 'happy' },
                  { text: 'There is the little gate. It was never locked — it just likes a very quiet push.', who: 'spike', state: 'idle' }
                ]
              },
              {
                tag: 'front', label: '🌋 Past the warm volcano, to the big front gate', reply: [
                  { text: 'The long road, then. Warm sand, warm rocks, and one enormous snoring T-Rex at the end.', who: 'gentle', state: 'walk' },
                  { text: 'The big gate swings open the moment you knock. Somebody was waiting for us.', who: 'gentle', state: 'happy' }
                ]
              }
            ]
          }
        },
        { text: 'The sun is coming up over the volcano. Ready, NAME?', who: 'rex', state: 'happy' }
      ],
      win: [
        { text: 'Every dinosaur in the fern garden woke up at once. That is a lot of yawning.', who: 'spike', state: 'happy', ifPick: 'park:side' },
        { text: 'The whole park is awake and dancing, all the way from the big front gate.', who: 'rex', state: 'happy', ifPick: 'park:front' },
        { text: 'The whole park is awake and dancing, and somebody left the gate wide open.', who: 'gentle', state: 'happy', ifNone: 'park' },
        { text: 'A Star Seed was sleeping in the tallest nest the whole time. It is yours!', who: 'rex', state: 'happy' },
        {
          text: 'Hold on, NAME — behind the snack shed a little triceratops has her head stuck in a lunch box, and the meadow gate closes at sundown.', who: 'spike', state: 'walk',
          ask: {
            prompt: 'What do we do first?',
            options: [
              {
                tag: 'help', label: '🦕 Stop and free the little one', reply: [
                  { text: 'Of course we stop. Bumper lifts the lunch box off like it is a hat and she does not even notice.', who: 'bumper', state: 'happy' },
                  { text: 'She has a name, by the way: Pebble. Pebble follows anybody who frees her, so expect company in the meadow.', who: 'spike', state: 'idle' }
                ]
              },
              {
                tag: 'quick', label: '🏃 Off to the meadow before the gate shuts', reply: [
                  { text: 'Straight for the gate then! Zip is already halfway there and pretending he only just started.', who: 'zip', state: 'run' },
                  { text: 'The park keeper shouts after you that the little triceratops will manage. You will remember her anyway.', who: 'gentle', state: 'sad' }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      id: 'meadow', title: 'The Meadow That Plays Hide and Seek', world: 'meadow', scene: 'meadow',
      goal: { stars: 8, text: 'Find the hidden meadow friends' },
      beats: [
        { text: 'Dino Meadow looks empty. That is because everybody here is extremely good at hiding.', who: 'zip', state: 'idle' },
        { text: 'Match the eggs, count the berries, follow the trails. Clever friends always get found.', who: 'zip', state: 'walk' },
        { text: 'Pip circles twice and comes straight down. She has found two paths and wants to argue.', who: 'pip', state: 'happy' },
        {
          text: 'Which way, NAME?', who: 'zip', state: 'happy',
          ask: {
            prompt: 'Which way through the meadow?',
            options: [
              {
                tag: 'flowers', label: '🌼 Into the buttercups, where the smell is silly', reply: [
                  { text: 'Buttercups it is. Zip always sneezes in there, which gives everybody away every single time.', who: 'zip', state: 'happy' },
                  { text: 'Spike hides in the tall grass and believes nobody can see his plates. Everybody sees his plates.', who: 'spike', state: 'idle' }
                ]
              },
              {
                tag: 'river', label: '💧 Down to the river, over the bumpy stones', reply: [
                  { text: 'Hopping stones! Mind the wet one, NAME. It has been wet for eleven million years.', who: 'zip', state: 'walk' },
                  { text: 'Gentle wades across so nobody has to get their feet splashy. That is just who he is.', who: 'gentle', state: 'happy' }
                ]
              }
            ]
          }
        },
        { text: 'Word has run ahead of you through the whole park: you stopped for a stuck little triceratops. Pebble is behind the bush and she is yours now.', who: 'spike', state: 'happy', ifPick: 'park:help' },
        { text: 'The gatekeeper says you came through the park at full speed. Zip likes a fast friend, as long as fast still means stopping to look.', who: 'zip', state: 'idle', ifPick: 'park:quick' },
        { text: 'Something is glinting in the grass over there. Quiet now, NAME. On the count of three.', who: 'bumper', state: 'happy' }
      ],
      win: [
        { text: 'Out they all come, giggling, from under every leaf and every petal!', who: 'zip', state: 'happy', ifPick: 'meadow:flowers' },
        { text: 'Up from the river they climb, one very wet dinosaur at a time.', who: 'gentle', state: 'happy', ifPick: 'meadow:river' },
        { text: 'Out they all come, giggling, from under every leaf!', who: 'zip', state: 'happy', ifNone: 'meadow' },
        { text: 'And there is a Star Seed, tangled up in the buttercups. Thank you for looking.', who: 'bumper', state: 'happy', ifPick: 'meadow:flowers' },
        { text: 'A Star Seed was holding its breath under a smooth stone. It has been waiting for you.', who: 'zip', state: 'happy', ifPick: 'meadow:river' },
        { text: 'And there is a Star Seed, tangled up in the grass. Thank you for looking.', who: 'bumper', state: 'happy', ifNone: 'meadow' },
        {
          text: 'The river has risen overnight, NAME, and the road to the car park is on the other side. Two ways over.', who: 'gentle', state: 'walk',
          ask: {
            prompt: 'How do we cross?',
            options: [
              {
                tag: 'hop', label: '🪨 Hop the wet stones, one at a time', reply: [
                  { text: 'Hopping stones it is. Gentle counts for you, because Gentle counts for everybody.', who: 'gentle', state: 'happy' },
                  { text: 'You got across with dry socks, which in this valley is a kind of magic.', who: 'zip', state: 'happy' }
                ]
              },
              {
                tag: 'bridge', label: '🌉 Walk the long log bridge, and look at the view', reply: [
                  { text: 'The bridge! It takes twice as long and is worth every step. There are fish down there waving.', who: 'pip', state: 'happy' },
                  { text: 'Halfway across, Pip drops a feather for luck. She does that for people she likes.', who: 'pip', state: 'idle' }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      id: 'drive', title: 'The Long Green Road', world: 'drive', scene: 'day',
      goal: { stars: 6, text: 'Build a car and deliver every parcel' },
      beats: [
        { text: 'Mummy Courtney has parcels for every corner of the universe and only one vehicle ready.', who: 'gentle', state: 'idle' },
        { text: 'It is a car shaped like a dinosaur, and it needs painting. That part is entirely your job.', who: 'gentle', state: 'walk' },
        { text: 'Bumper chose the colours. Zip picked the racing stripe. You have the final say, NAME.', who: 'rex', state: 'walk' },
        {
          text: 'Which road do we drive, NAME?', who: 'rex', state: 'happy',
          ask: {
            prompt: 'Which road?',
            options: [
              {
                tag: 'coast', label: '🌊 The coast road, where the wind smells like water', reply: [
                  { text: 'The coast! Pip flies alongside the window to point out every shiny thing she can see.', who: 'pip', state: 'happy' },
                  { text: 'Slow down at the bends, NAME. Out here the view is the whole point of the trip.', who: 'gentle', state: 'walk' }
                ]
              },
              {
                tag: 'mountain', label: '⛰️ The mountain cut, where the road goes up and up', reply: [
                  { text: 'The mountain! Bumper loves hills, mostly because Bumper loves absolutely everything.', who: 'bumper', state: 'run' },
                  { text: 'Third gear, NAME. Listen to that engine — it sounds like a very happy roar.', who: 'rex', state: 'happy' }
                ]
              }
            ]
          }
        },
        { text: 'Dry socks at the wheel! The meadow told us you hopped the stones, and Bumper refuses to be impressed by that.', who: 'bumper', state: 'happy', ifPick: 'meadow:hop' },
        { text: 'Pip kept watch from the bridge and saw the whole road from up there. She says it is beautiful, and she is not being polite.', who: 'pip', state: 'idle', ifPick: 'meadow:bridge' },
        { text: 'Six worlds to drive to. Buckle up!', who: 'rex', state: 'run' }
      ],
      win: [
        { text: 'Every parcel delivered, and the sea splashed the wheels on purpose, just to say hello.', who: 'gentle', state: 'happy', ifPick: 'drive:coast' },
        { text: 'Every parcel delivered, and Daddy Ellis honks the horn three whole times down the valley.', who: 'rex', state: 'happy', ifPick: 'drive:mountain' },
        { text: 'Every parcel delivered, and Daddy Ellis honks the horn three whole times.', who: 'gentle', state: 'happy', ifNone: 'drive' },
        { text: 'A Star Seed was stuck under a wheel the entire journey. It needed a good drive home.', who: 'pip', state: 'happy' },
        {
          text: 'One parcel left, NAME, and the address on it says only: behind the big snow hill, to whoever is loudest. That is a strange address.', who: 'gentle', state: 'idle',
          ask: {
            prompt: 'Do we stop?',
            options: [
              {
                tag: 'deliver', label: '📦 Drive around and deliver it properly', reply: [
                  { text: 'You drove all the way round for one parcel. The engine is warm and so is this story, and I am not being silly about it.', who: 'rex', state: 'happy' },
                  { text: 'The gate opens. There is somebody out there in the snow, and they did not expect anybody at all.', who: 'spike', state: 'happy' }
                ]
              },
              {
                tag: 'keep', label: '🚗 Post it from here and race on to the hill', reply: [
                  { text: 'The mail pterosaur takes it off your wing — pardon, your window — at full speed. Pip approves of the efficiency.', who: 'pip', state: 'walk' },
                  { text: 'It will arrive. Probably. The hill is right there, NAME, and the hill is the reason we came.', who: 'zip', state: 'run' }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      id: 'adventures', title: 'Twenty-Three Little Heroes', world: 'adventures', scene: 'rainbow',
      goal: { stars: 12, text: 'Help friends across the Adventures' },
      beats: [
        { text: 'Pip the pterosaur circles overhead. There is so much to do down there, she squeaks.', who: 'pip', state: 'happy' },
        { text: 'Rescue a family, hatch an egg, bake a cake, build a home, read a story, fly a balloon.', who: 'rex', state: 'walk' },
        { text: 'Wise Owl asks one riddle a day. Today: what weighs nothing, yet fills a whole valley?', who: 'owl', state: 'idle' },
        { text: 'She says the answer is a cheer. She is right, and you have already earned one.', who: 'grumble', state: 'happy' },
        {
          text: 'Where do we start, NAME?', who: 'pip', state: 'happy',
          ask: {
            prompt: 'Where do we start?',
            options: [
              {
                tag: 'small', label: '🐣 The small ones first — the egg, the chick, the lost little friend', reply: [
                  { text: 'The little ones. Gentle carries all of them at once and does not even notice he is doing it.', who: 'gentle', state: 'happy' },
                  { text: 'One small kindness, then another, then another. That is how a whole valley gets fixed.', who: 'pip', state: 'walk' }
                ]
              },
              {
                tag: 'big', label: '🎈 The big one — the rescue everybody is talking about', reply: [
                  { text: 'The big rescue! Rex is already running ahead and pretending that he is not.', who: 'rex', state: 'run' },
                  { text: 'Grumblecloud is coming too. He is extremely good at lifting and terrible at admitting it.', who: 'grumble', state: 'happy' }
                ]
              }
            ]
          }
        },
        { text: 'Every adventure teaches a dinosaur something they get to keep forever.', who: 'pip', state: 'happy' }
      ],
      win: [
        { text: 'The whole valley is cheering for you, one tiny rescue at a time.', who: 'rex', state: 'happy', ifPick: 'adventures:small' },
        { text: 'The whole valley is cheering, and Grumblecloud cheers loudest of all.', who: 'grumble', state: 'roar', ifPick: 'adventures:big' },
        { text: 'The whole valley is cheering for you, one enormous roar at a time.', who: 'rex', state: 'roar', ifNone: 'adventures' },
        { text: 'A Star Seed drifts slowly down and lands right in your two careful hands.', who: 'spike', state: 'happy' }
      ]
    },
    {
      id: 'egg-dash', title: 'The Last Hill', world: 'egg-dash', scene: 'snow',
      goal: { stars: 3, text: 'Race down the last hill' },
      beats: [
        { text: 'One Star Seed is still missing, and it rolled away down the longest hill in the universe.', who: 'zip', state: 'run' },
        { text: 'Hop the rocks. Duck the logs. Catch it before it reaches the river at the bottom.', who: 'zip', state: 'walk' },
        { text: 'Grumblecloud is sitting at the bottom of the hill. He wants to help and does not know how.', who: 'grumble', state: 'sad' },
        { text: 'And he is holding your parcel. He saved the string, and the string is now a very small flag he waves at you.', who: 'grumble', state: 'happy', ifPick: 'drive:deliver' },
        { text: 'He got the parcel after all, posted to him at full speed by a pterosaur who has never once missed a drop.', who: 'pip', state: 'happy', ifPick: 'drive:keep' },
        {
          text: 'What do we say to him, NAME?', who: 'rex', state: 'happy',
          ask: {
            prompt: 'What do we say?',
            options: [
              {
                tag: 'invite', label: '🤝 Come and slide down with us, Grumblecloud', reply: [
                  { text: 'He nearly cried. Nobody had ever invited him before, and he will not stop talking about it.', who: 'grumble', state: 'happy' },
                  { text: 'Now there are two of you sliding, which is twice the fun and about twice the noise.', who: 'grumble', state: 'walk' }
                ]
              },
              {
                tag: 'race', label: '🏁 Race him — he is fastest when he is happy', reply: [
                  { text: 'Race him?! He has been waiting all winter for somebody to ask him that.', who: 'grumble', state: 'roar' },
                  { text: 'Photo finish, NAME. Nobody will ever know who won, which is the best kind of race.', who: 'zip', state: 'run' }
                ]
              }
            ]
          }
        },
        { text: 'Deep breath. Ready when you are, NAME!', who: 'rex', state: 'happy' }
      ],
      win: [
        { text: 'You caught it, and Grumblecloud caught it with you. Two hands are better than one.', who: 'grumble', state: 'happy', ifPick: 'egg-dash:invite' },
        { text: 'You caught it! Even Grumblecloud is clapping, and that is a lot of clapping.', who: 'zip', state: 'run', ifPick: 'egg-dash:race' },
        { text: 'You caught it! Even Grumblecloud is clapping, which is a lot of clapping.', who: 'grumble', state: 'happy', ifNone: 'egg-dash' },
        { text: 'That was the very last Star Seed. Come up to the top of Mount Roar.', who: 'rex', state: 'happy' },
        {
          text: 'It is the last one, NAME, and it is warmer than the rest. Grumblecloud is holding out both hands, and so is the garden.', who: 'spike', state: 'happy',
          ask: {
            prompt: 'Where does the last Star Seed go?',
            options: [
              {
                tag: 'give', label: '🤲 Give it to Grumblecloud to plant', reply: [
                  { text: 'He plants it with both front claws in the dirt, very carefully, like it is an egg.', who: 'grumble', state: 'happy' },
                  { text: 'It is the first thing he has ever been in charge of. Say nothing, NAME. Just stand next to him.', who: 'rex', state: 'idle' }
                ]
              },
              {
                tag: 'plant', label: '🌱 Plant it yourself at the top of Mount Roar', reply: [
                  { text: 'You walk all the way to the top with it cupped in your hands, which is a longer walk than it looks.', who: 'gentle', state: 'walk' },
                  { text: 'The whole valley goes quiet at the same moment. They are all watching for you.', who: 'owl', state: 'idle' }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      id: 'finale', title: 'The Starlight Garden', world: null, scene: 'night',
      beats: [
        { text: 'Here we all are at the top of Mount Roar. Open your hands, NAME.', who: 'rex', state: 'idle' },
        { text: 'Pip flew beside you in every single world and saw all of it, from the very top.', who: 'pip', state: 'happy', ifPick: 'prologue:pip' },
        { text: 'Bumper carried you the whole way and never once asked for a break.', who: 'bumper', state: 'happy', ifPick: 'prologue:bumper' },
        { text: 'Rex kept the list of every Star Seed, and every single line on it is checked off.', who: 'rex', state: 'happy', ifNone: 'prologue' },
        { text: 'Far below, the fern garden waves. It remembers careful feet.', who: 'spike', state: 'happy', ifPick: 'park:side' },
        { text: 'The big gate stands open for good now. The key was in Rex\'s pocket all along.', who: 'gentle', state: 'happy', ifPick: 'park:front' },
        { text: 'Somewhere down there a buttercup is still tickling Zip, and Zip still sneezes about it.', who: 'zip', state: 'happy', ifPick: 'meadow:flowers' },
        { text: 'The hopping stones remember your feet. Eleven million years, and they still say your name.', who: 'zip', state: 'happy', ifPick: 'meadow:river' },
        { text: 'The coast road is shiny with sea, and your little car made most of that splashing.', who: 'pip', state: 'happy', ifPick: 'drive:coast' },
        { text: 'Your car is parked at the very top, still warm, and quietly proud of itself.', who: 'bumper', state: 'happy', ifPick: 'drive:mountain' },
        { text: 'Every small friend you helped is asleep already, and safe. That is the best kind of tired.', who: 'gentle', state: 'happy', ifPick: 'adventures:small' },
        { text: 'The big rescue is on the news in three worlds. They said your name twice.', who: 'rex', state: 'roar', ifPick: 'adventures:big' },
        { text: 'Grumblecloud has learned a brand new word this winter. The word is we.', who: 'grumble', state: 'happy', ifPick: 'egg-dash:invite' },
        { text: 'Grumblecloud is already planning the rematch. He swears it will be closer this time.', who: 'grumble', state: 'roar', ifPick: 'egg-dash:race' },
        { text: 'One by one the Star Seeds float up out of your arms and bloom into the sky.', who: 'gentle', state: 'happy', ifNone: 'egg-dash' },
        { text: 'Pebble has followed you all the way up the mountain and is now sitting at your feet like she paid for the ticket.', who: 'spike', state: 'happy', ifPick: 'park:help' },
        { text: 'Pip finds a spare feather in her wing and gives it to you at the top. She kept that one for the walk up.', who: 'pip', state: 'happy', ifPick: 'meadow:bridge' },
        { text: 'Grumblecloud has tied your parcel string around his smallest claw. He says it is a flag now, and everybody agrees.', who: 'grumble', state: 'happy', ifPick: 'drive:deliver' },
        { text: 'His little garden starts last, and it comes up LOUDER than the whole sky. Nobody minds. Nobody ever minded.', who: 'grumble', state: 'roar', ifPick: 'egg-dash:give' },
        { text: 'Grumblecloud digs the hole himself, with both claws, and puts it right in the middle of his garden so nobody has to look up to find it.', who: 'rex', state: 'happy', ifPick: 'egg-dash:give' },
        { text: 'From now on, when the sky is especially bright over Mount Roar, that is his garden, and he waters it.', who: 'spike', state: 'happy', ifPick: 'egg-dash:give' },
        { text: 'The garden blooms from the top down, one ring of light at a time, all the way to the sea.', who: 'gentle', state: 'happy', ifPick: 'egg-dash:plant' },
        { text: 'Rex makes you promise to remember which hole is yours. You both know you will.', who: 'rex', state: 'idle', ifPick: 'egg-dash:plant' },
        { text: 'Grumblecloud asks, very quietly, whether he might grow the next one beside you. Of course he might.', who: 'grumble', state: 'happy', ifPick: 'egg-dash:plant' },
        { text: 'Rex, Pip, Bumper, Zip, Spike, Gentle and Grumblecloud each get a star of their very own.', who: 'pip', state: 'happy' },
        { text: 'The Starlight Garden shines over the whole dinosaur universe again, and that was all you.', who: 'spike', state: 'happy' },
        { text: 'You chose your own way through {PICKS} parts of this story, so this ending is yours and nobody else\'s.', who: 'rex', state: 'happy', ifPicks: 3 },
        { text: 'Nine ways, NAME. There is no version of this story that does not have you in it, but this exact one has never happened before.', who: 'owl', state: 'happy', ifPicks: 8 },
        { text: 'Whenever you want to visit, the gate stays open. Happy exploring, NAME.', who: 'rex', state: 'roar' }
      ]
    }
  ];

  /* Per-game narration so no game opens on a bare instruction. */
  const GAME_LINES = {
    'park.bones': { who: 'rex', intro: 'These bones came up from the dig site. Put the skeleton back together!', win: 'It stands up and walks. You built a dinosaur.', lose: 'Which bone goes at the other end?' },
    'park.puzzle': { who: 'bumper', intro: 'The park sign fell into pieces. Put it back together!', win: 'The sign is fixed and the gate swings open!', lose: 'Almost. Try the corners first.' },
    'park.dig': { who: 'gentle', intro: 'Something old is sleeping under the sand. Be gentle with the brush.', win: 'A whole skeleton! Give it a name.', lose: 'Keep digging, carefully.' },
    'park.footprint': { who: 'zip', intro: 'Someone walked through the mud this morning. Who were they?', win: 'Every footprint matched. Well spotted.', lose: 'Look at the toes. Count them.' },
    'park.mixer': { who: 'spike', intro: 'Rex wants a surprise friend built. Head, body and colour!', win: 'That is the best dinosaur I have ever seen.', lose: 'Not quite. Which colour was it?' },
    'park.memory': { who: 'pip', intro: 'Baby dinosaurs are hiding behind these eggs. Remember where.', win: 'You found every single one!', lose: 'Peek again. Where was the green one?' },
    'park.size': { who: 'gentle', intro: 'The dinosaurs are lining up for dinner, smallest first.', win: 'A perfect line, tiny to enormous.', lose: 'Which one is the very smallest?' },
    'park.counting': { who: 'owl', intro: 'This dinosaur is hungry for exactly some berries. Count them!', win: 'Every berry eaten and none dropped.', lose: 'Let us count them again together.' },
    'park.dot': { who: 'pip', intro: 'Dots in the dark. Join them in order and see what appears.', win: 'A dinosaur made of stars!', lose: 'Find the next number.' },
    'park.color': { who: 'spike', intro: 'This dinosaur has lost all of its colours. Shall we help?', win: 'Beautiful. Look how happy it is!', lose: 'Try another patch of colour.' },
    'park.feed': { who: 'rex', intro: 'Lunch time! Catch the food they like and skip the silly stuff.', win: 'All fed up and wiggly with joy.', lose: 'Oops. That one was not lunch.' },
    'park.dash': { who: 'zip', intro: 'Run with Rex across the land. Jump the rocks and grab the stars.', win: 'You ran like a real dinosaur!', lose: 'So close! The next run will be longer.' },
    'park.catch': { who: 'pip', intro: 'Star eggs are falling! Move the basket and catch them.', win: 'A whole basket of glowing eggs.', lose: 'Some rolled away. Try again?' },
    /* The little animated arcade next to the park: one dino, one downpour of eggs. */
    'park.arcade': { who: 'pip', intro: 'Eggs and stars are raining down! Run the little dino along and catch them.', win: 'What catches! Not one good egg wasted.', lose: 'Nearly. Move early, not fast.' },
    /* Meadow — twenty games, each with five theme levels. One voice per game. */
    'meadow.match': { who: 'pip', intro: 'Two of everything live in the meadow. Find the pairs.', win: 'Matched! You see just like a dinosaur does.', lose: 'Look again — same shape, same colour?' },
    'meadow.count': { who: 'owl', intro: 'How many dinosaurs came to breakfast today?', win: 'You counted every single one.', lose: 'Count out loud with me, one by one.' },
    'meadow.colours': { who: 'spike', intro: 'The meadow is hiding a colour. Find everything that matches it.', win: 'That colour was everywhere and you found it all.', lose: 'Hold the colour in your mind and look again.' },
    'meadow.shapes': { who: 'bumper', intro: 'A picnic full of shapes. Tap the one the basket is asking for.', win: 'Every shape found. That is a full picnic.', lose: 'Count the sides. That tells you the shape.' },
    'meadow.size': { who: 'gentle', intro: 'Some dinosaurs are enormous and some fit in a pocket. Sort them out.', win: 'A perfect line, tiny to towering.', lose: 'Which one is the very biggest?' },
    'meadow.pattern': { who: 'owl', intro: 'What comes next in the pattern? Your brain already knows.', win: 'You read that pattern like a story.', lose: 'Say the pattern out loud, then answer.' },
    'meadow.sort': { who: 'bumper', intro: 'Things are tumble everywhere. Put each one in its own basket.', win: 'Sorted tidy. The whole meadow thanks you.', lose: 'Where does this one live?' },
    'meadow.order': { who: 'zip', intro: 'Footprints with numbers. Tap them in order and follow the trail.', win: 'You followed the whole trail without one skip.', lose: 'What number comes after that one?' },
    'meadow.memory': { who: 'pip', intro: 'Baby dinosaurs are asleep behind these eggs. Remember who was where.', win: 'Every pair remembered. What a brain!', lose: 'Peek again. Who was behind that egg?' },
    'meadow.maze': { who: 'gentle', intro: 'A little dino wants to reach the nest. Find the path home.', win: 'Home safe, and not one dead end.', lose: 'That path has a wall. Try another turn.' },
    'meadow.dig': { who: 'spike', intro: 'Old bones are dozing under the dirt. Brush them into the sunshine.', win: 'A whole fossil, sparkling clean.', lose: 'Brush gently — there is more under here.' },
    'meadow.bubbles': { who: 'zip', intro: 'Picture bubbles are floating up. Pop them before they drift away.', win: 'Every bubble popped. Fizzy work!', lose: 'They are quick. Watch the next one rise.' },
    'meadow.feed': { who: 'rex', intro: 'A hungry friend is waiting. Which food does the plate ask for?', win: 'Belly full and tail wagging, all done.', lose: 'That was not the order. Try the next plate.' },
    'meadow.wash': { who: 'gentle', intro: 'This dinosaur rolled in the mud. Scrub until they gleam.', win: 'Squeaky clean and smelling of flowers.', lose: 'Still muddy over there. Another scrub.' },
    'meadow.cook': { who: 'bumper', intro: 'The kitchen is open. Follow the recipe and make it right.', win: 'A chef of the first order. Dinner is served!', lose: 'That is not in the recipe yet.' },
    'meadow.dress': { who: 'pip', intro: 'Time to get dressed! Choose things that make your friend smile.', win: 'What a wonderful outfit. Look at that strut!', lose: 'Try something else on top of that.' },
    'meadow.music': { who: 'spike', intro: 'These stones each hold a note. Play the tune back to me.', win: 'You played it sweet as the meadow wind.', lose: 'Listen once more — which one sang first?' },
    'meadow.colouring': { who: 'spike', intro: 'A dinosaur is waiting for its colours. Fill every part.', win: 'Beautiful. Look how happy it is now!', lose: 'Which part still needs colour?' },
    'meadow.draw': { who: 'rex', intro: 'A blank pad and a whole imagination. Draw what you see in there.', win: 'I have never seen one like that before!', lose: 'Keep going — I want to see the ending.' },
    'meadow.trace': { who: 'zip', intro: 'A dotted path lies ahead. Trace it without leaving the line.', win: 'Right down the middle. Those are steady hands!', lose: 'Start at the flag and go slow.' },
    /* The meadow arcade: a table of cards to turn over. */
    'meadow.arcade': { who: 'pip', intro: 'Baby dinosaurs are hiding under these cards. Flip two at a time!', win: 'Every pair found. What a memory!', lose: 'Try again — you know where the flowers are.' },
    /* Car studio — the two ways to drive. The ledger key per world is
     * drive.<world>-<mode>, but a child hears the same two voices either way. */
    'drive.race': { who: 'zip', intro: 'Three rivals, three laps and one very fast dinosaur car.', win: 'What a drive! You took the bends like a pro.', lose: 'Slow down into the bends and you will fly past them.' },
    'drive.explore': { who: 'gentle', intro: 'Nobody is racing today. Look around and pick up everything lovely.', win: 'Your basket is full of treasures.', lose: 'Keep looking, it is all around you.' },
    /* The arcade runner reached from the studio: hop the rocks, grab the stars. */
    'drive.run': { who: 'zip', intro: 'Hop the rocks and logs, and catch every star on the road!', win: 'You drove like a real dinosaur racer.', lose: 'Nearly! Jump a little earlier next time.' },
    /* Adventures — twenty-three story games, plus the balloon flight. */
    'act.rescue': { who: 'rex', intro: 'A dinosaur is stuck up on the ridge. Get there before the rain!', win: 'Rescued and home before supper. Hero work.', lose: 'Nearly! Try the shortest way next time.' },
    'act.builder': { who: 'bumper', intro: 'Build a dinosaur from scratch — head, body, legs and all.', win: 'That dinosaur walks, talks and is entirely yours.', lose: 'Something is missing. What does it need?' },
    'act.jigsaw': { who: 'pip', intro: 'The picture fell to pieces. Turn the pieces and fit them together.', win: 'Whole again, and not one gap left.', lose: 'Look at the edges — the flat sides go outside.' },
    'act.fossil': { who: 'spike', intro: 'Dig carefully and the bones will tell you who slept out there.', win: 'A complete skeleton for the museum!', lose: 'One more brush and it will show itself.' },
    'act.memory': { who: 'pip', intro: 'Flip the eggs and hold the pictures in your mind.', win: 'Every pair found. That memory is enormous.', lose: 'Where was the spotted one?' },
    'act.picnic': { who: 'gentle', intro: 'Everyone is hungry. Lay out exactly what each friend asked for.', win: 'The finest picnic the meadow ever saw.', lose: 'That friend wanted something else.' },
    'act.hatchling': { who: 'rex', intro: 'An egg is about to hatch. Keep the little one warm and fed.', win: 'Hatched, healthy and hugging you.', lose: 'Still sleepy. Try once more, gently.' },
    'act.trail': { who: 'zip', intro: 'These footprints belong to different dinosaurs. Match each trail.', win: 'Every footprint sent home.', lose: 'Look at the toes and how big each print is.' },
    'act.shapes': { who: 'owl', intro: 'Shapes are hiding inside the landscape. Hunt them out.', win: 'Safari complete — every shape spotted.', lose: 'Squint. That hill is a shape too.' },
    'act.beat': { who: 'spike', intro: 'The parade needs a rhythm. Play the beats back exactly.', win: 'The whole parade marched to your drum.', lose: 'Listen again and clap along.' },
    'act.habitat': { who: 'gentle', intro: 'A dinosaur needs a home with the right plants, water and shade.', win: 'A perfect habitat. Move right in!', lose: 'Something this dinosaur needs is still missing.' },
    'act.storybook': { who: 'pip', intro: 'A story with its middle missing. Choose what happens next.', win: 'What an ending. Will you read it to me again?', lose: 'That does not fit here yet. Try another.' },
    'act.discoveries': { who: 'owl', intro: 'Real dinosaur facts — and one of them is made up. Find the truth.', win: 'A proper scientist. That one was the true tale.', lose: 'Careful — one of those was a fib.' },
    'act.care': { who: 'rex', intro: 'The clinic is open. Who is coughing, who is limping, who is sad?', win: 'All better! The clinic is proud of you.', lose: 'Check the next patient.' },
    'act.mummy': { who: 'gentle', intro: 'A cosy corner, a warm drink and one very sleepy dinosaur.', win: 'Cosy enough to fall asleep in. Well done.', lose: 'Try a different corner.' },
    'act.moonbeam': { who: 'pip', intro: 'The moonlight has gone out over the valley. Bring it back.', win: 'Moonbeams again, and dancing shadows.', lose: 'One more star still needs lighting.' },
    'act.parade': { who: 'bumper', intro: 'Dress every friend for the biggest day of the year.', win: 'What colours! The parade adores you.', lose: 'Add one more thing to that outfit.' },
    'act.constellations': { who: 'owl', intro: 'The stars are scattered. Join them up into dinosaurs.', win: 'The night sky has never looked better.', lose: 'Find the next number and join it on.' },
    'act.skymail': { who: 'zip', intro: 'Letters must reach the right nests before dark. Off you go!', win: 'Every letter delivered and none mixed up.', lose: 'Wrong nest! Whose letter was that one?' },
    'act.weather': { who: 'spike', intro: 'You run the weather today. Rain for the flowers, sun for the picnic.', win: 'Perfect weather for every single creature.', lose: 'Who was that weather meant for?' },
    'act.coloring': { who: 'spike', intro: 'Choose your colours and bring this dinosaur to life.', win: 'I am hanging this one on my wall.', lose: 'Which colour will you try next?' },
    'act.quest': { who: 'rex', intro: 'An egg has rolled out of the nest. Follow it over the mountain.', win: 'The egg is home and the whole valley is cheering.', lose: 'Keep looking — it is close by.' },
    'act.daddy': { who: 'grumble', intro: 'Dinosaur daddy is being silly and hiding everything. Find it all!', win: 'You beat daddy at his own game!', lose: 'He is quick. Have another go.' },
    'act.flight': { who: 'pip', intro: 'Balloons up! Flap gently and float through the clouds.', win: 'A sky full of eggs and stars. Best flight yet.', lose: 'Steady the basket and up you go again.' },
    'egg.dash': { who: 'rex', intro: 'A baby dinosaur, one good hop and a basket of sparkly eggs.', win: 'Every egg caught and not one cracked.', lose: 'Mind the rocks and hop again.' }
  };

  const WORLD_CHAPTER = {};
  CHAPTERS.forEach((c, i) => { if (c.world) WORLD_CHAPTER[c.world] = i; });

  const nameOf = () => {
    let n = '';
    try { n = (localStorage.getItem('du-name') || '').trim(); } catch (e) { }
    return n && n.length < 25 ? n : 'Explorer';
  };

  /** Every choice the child has ever made, keyed by chapter id. */
  function readPicks() {
    const out = {};
    const J = window.DUJourney;
    if (!J || !J.finds) return out;
    for (const f of J.finds()) {
      const m = /^choice:([a-z0-9-]+):([a-z0-9-]+)$/i.exec(f);
      if (m) out[m[1]] = m[2];
    }
    return out;
  }
  const pickCount = (p) => Object.keys(p).length;

  /* The payoffs other pages read: who rides with the child, which way each
   * chapter went and which of the two endings they have earned. Kept in the
   * story's own words so the map never invents a second vocabulary. */
  const PATH_WORDS = {
    'prologue:pip': '🪽 with Pip, from the sky',
    'prologue:bumper': '🦣 on Bumper\'s back',
    'park:side': 'in through the fern garden',
    'park:front': 'in past the big gate',
    'park:help': 'stopping for Pebble',
    'park:quick': 'straight to the gate',
    'meadow:flowers': 'by the buttercups',
    'meadow:river': 'down by the river',
    'meadow:hop': 'over the hopping stones',
    'meadow:bridge': 'the long way over the bridge',
    'drive:coast': 'along the coast road',
    'drive:mountain': 'over the mountain cut',
    'drive:deliver': 'delivering the last parcel',
    'drive:keep': 'racing on to the hill',
    'adventures:small': 'helping the small ones first',
    'adventures:big': 'going for the big rescue',
    'egg-dash:invite': 'sliding with Grumblecloud',
    'egg-dash:race': 'racing Grumblecloud',
    'egg-dash:give': 'planting it all together',
    'egg-dash:plant': 'planting it at the summit',
  };
  const pathOf = (chapterId, picks) => {
    const p = picks || readPicks(), t = p[chapterId];
    return t ? PATH_WORDS[chapterId + ':' + t] || null : null;
  };
  const companionOf = (picks) => {
    const t = (picks || readPicks()).prologue;
    return t === 'pip' || t === 'bumper' ? t : null;
  };
  // Every question the story asks, in any chapter, in either the intro or the
  // win sequence — so a parent can see how much of the path is still theirs.
  let FORK_TOTAL = null;
  function forkTotal() {
    if (FORK_TOTAL === null) FORK_TOTAL = CHAPTERS.reduce((n, c) =>
      n + (c.beats || []).concat(c.win || []).filter((b) => b.ask).length, 0);
    return FORK_TOTAL;
  }

  const say = (text, picks) => String(text || '')
    .replace(/\bNAME\b/g, nameOf())
    .replace(/\{PICKS\}/g, pickCount(picks || readPicks()));

  /* A beat is hidden when it belongs to a branch the child did not take. */
  function shown(b, picks) {
    if (b.ifPick) {
      const i = b.ifPick.indexOf(':');
      return picks[b.ifPick.slice(0, i)] === b.ifPick.slice(i + 1);
    }
    if (b.ifNone) return picks[b.ifNone] === undefined;
    if (b.ifPicks) return pickCount(picks) >= b.ifPicks;
    return true;
  }

  const esc = (text) => String(text == null ? '' : text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- the cutscene player ---------- */
  let root = null, state = null, timers = [];

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function speak(line) {
    let on = false;
    try { on = JSON.parse(localStorage.getItem('du-parent-settings') || '{}').speech === true; } catch (e) { }
    if (!on || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(say(line, state && state.picks).replace(/[!*]/g, ' '));
      u.rate = 0.92; u.pitch = 1.12; u.volume = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { }
  }

  /* The beats a child actually sees: the chapter's own list, minus any branch
   * they did not take. Copied, because a choice splices its reply into it.
   * The frame chapters have no separate win scene, so a win request falls back
   * to their beats rather than showing a child an empty screen. */
  function beatList(c, mode, picks) {
    const src = mode === 'win' ? (c.win || c.beats) : c.beats;
    return (src || []).filter((b) => shown(b, picks)).slice();
  }

  function paint() {
    const c = CHAPTERS[state.chapter], list = state.list, beat = list[state.beat];
    if (!beat) return finish();
    const reduce = FX() && FX().settings.reduce;
    const el = root.querySelector('.du-cut-scene');
    el.dataset.scene = c.scene;
    const art = root.querySelector('.du-cut-art');
    art.innerHTML = FX().dinoHTML(FRIENDS[beat.who].species, { state: beat.state || 'happy', color: FRIENDS[beat.who].colour, size: 'min(46vw,260px)' });
    art.dataset.friend = FRIENDS[beat.who].name;
    if (!reduce) { art.classList.remove('in'); void art.offsetWidth; art.classList.add('in'); }
    const txt = root.querySelector('.du-cut-text');
    const line = say(beat.text, state.picks);
    if (reduce) { txt.textContent = line; }
    else {
      txt.textContent = '';
      let i = 0;
      clearTimers();
      const tick = () => {
        txt.textContent = line.slice(0, ++i);
        if (i < line.length) timers.push(setTimeout(tick, 24));
      };
      tick();
    }
    root.querySelector('.du-cut-who').textContent = FRIENDS[beat.who].name;
    root.querySelector('.du-cut-count').textContent = (state.beat + 1) + ' / ' + list.length;
    root.querySelector('.du-cut-title').textContent = state.mode === 'win' ? ('Yay! ' + c.title) : c.title;
    const next = root.querySelector('#cutNext');
    next.textContent = state.beat >= list.length - 1 ? (state.mode === 'win' ? 'Done!' : 'Let\'s go!') : 'Next ▶';
    drawAsk(beat, reduce);
    speak(line);
    if (FX() && !reduce) FX().burst(innerWidth / 2, innerHeight * 0.32, { kind: state.mode === 'win' ? 'stars' : 'sparkle', n: state.mode === 'win' ? 20 : 9 });
  }

  /* The choice buttons. A child who cannot read yet still gets two big pictures
   * to point at, and nothing moves on until they have picked. */
  function drawAsk(beat, reduce) {
    const ask = root.querySelector('.du-cut-ask');
    const opts = beat.ask && Array.isArray(beat.ask.options) ? beat.ask.options : null;
    root.querySelector('#cutNext').hidden = !!opts;
    if (!opts) { ask.hidden = true; ask.innerHTML = ''; return; }
    ask.hidden = false;
    ask.innerHTML = '<span class="du-cut-askq">' + esc(say(beat.ask.prompt, state.picks)) + '</span>' +
      '<span class="du-cut-opts">' + opts.map((o, i) => `<button class="du-cut-opt" type="button" data-i="${i}">
          <span class="du-cut-opt-key">${i + 1}</span><span class="du-cut-opt-label">${esc(o.label)}</span>
        </button>`).join('') + '</span>';
    Array.prototype.forEach.call(ask.querySelectorAll('.du-cut-opt'), (btn) => {
      btn.onclick = (e) => { e.stopPropagation(); choose(Number(btn.dataset.i)); };
    });
    if (!reduce) { ask.classList.remove('in'); void ask.offsetWidth; ask.classList.add('in'); }
  }

  function choose(i) {
    const c = CHAPTERS[state.chapter], beat = state.list[state.beat];
    const o = beat && beat.ask ? beat.ask.options[i] : null;
    if (!o) return;
    if (o.tag) {
      state.picks[c.id] = o.tag;
      // The newest choice wins: DUJourney keeps finds in the order they happened
      // and readPicks() lets the later one overwrite, so a child who changes their
      // mind really does change their own ending.
      const J = window.DUJourney;
      if (J) J.find('choice:' + c.id + ':' + o.tag);
    }
    const FXn = FX();
    if (FXn) {
      FXn.sfx.good && FXn.sfx.good();
      if (!FXn.settings.reduce) FXn.burst(innerWidth / 2, innerHeight * .55, { kind: 'stars', n: 16 });
    }
    const reply = Array.isArray(o.reply) ? o.reply : (o.reply ? [o.reply] : []);
    // Splice the answer in behind the question so the story keeps flowing forwards.
    Array.prototype.splice.apply(state.list, [state.beat + 1, 0].concat(reply));
    state.beat++;
    paint();
  }

  function advance() {
    if (!state || !state.list.length) return finish();
    const beat = state.list[state.beat];
    if (beat && beat.ask) return;   // a question waits for an answer
    if (state.beat < state.list.length - 1) { state.beat++; paint(); return; }
    finish();
  }
  function unmount() {
    clearTimers();
    hideWhisper();
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) { } }
    if (root && root._key) window.removeEventListener('keydown', root._key);
    if (root) root.remove();
    root = null;
  }
  function finish() {
    const c = CHAPTERS[state.chapter], J = window.DUJourney, done = state.mode === 'win' ? c.id : null;
    if (J) {
      if (state.mode === 'win' && done) J.reach(CHAPTERS.findIndex((x) => x.id === done) + 1);
      if (state.mode === 'intro') J.find('story:' + c.id);
    }
    if (FX()) { FX().sfx.sparkle(); if (state.mode === 'win') FX().celebrate(); }
    const el = root, onDone = state.onDone, mode = state.mode;
    if (!FX() || FX().settings.reduce) { unmount(); onDone && onDone(mode); return; }
    const a = el.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(1.04)' }], { duration: 320, fill: 'forwards' });
    a.onfinish = () => { unmount(); onDone && onDone(mode); };
  }

  function show(chapterIndex, opts) {
    opts = opts || {};
    if (!FX() || !FX().dinoHTML) { opts.onDone && opts.onDone(opts.mode); return; }
    chapterIndex = Math.max(0, Math.min(CHAPTERS.length - 1, chapterIndex | 0));
    if (root) unmount();
    state = { chapter: chapterIndex, beat: 0, mode: opts.mode === 'win' ? 'win' : 'intro', onDone: opts.onDone };
    const c = CHAPTERS[chapterIndex];
    state.picks = readPicks();
    state.list = beatList(c, state.mode, state.picks);
    if (!state.list.length) { opts.onDone && opts.onDone(state.mode); return; }
    root = document.createElement('div');
    root.className = 'du-cut';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', c.title);
    root.innerHTML = `
      <div class="du-cut-scene" data-scene="${c.scene}"><span class="du-cut-stars" aria-hidden="true"></span></div>
      <div class="du-cut-wrap">
        <p class="du-cut-kicker">${state.mode === 'win' ? '★ CHAPTER COMPLETE ★' : 'A Dinosaur Universe story'}</p>
        <h2 class="du-cut-title"></h2>
        <div class="du-cut-stage"><div class="du-cut-art in"></div></div>
        <p class="du-cut-card">
          <span class="du-cut-who"></span>
          <span class="du-cut-text"></span>
        </p>
        <div class="du-cut-ask" id="cutAsk" hidden></div>
        <div class="du-cut-bar">
          <span class="du-cut-count"></span>
          <span class="du-cut-actions">
            <button class="pill" id="cutSkip" type="button">Skip story</button>
            <button class="pill primary" id="cutNext" type="button">Next ▶</button>
          </span>
        </div>
      </div>`;
    document.body.appendChild(root);
    root.querySelector('#cutNext').onclick = (e) => { e.stopPropagation(); advance(); };
    root.querySelector('#cutSkip').onclick = (e) => { e.stopPropagation(); finish(); };
    root.addEventListener('pointerdown', advance);
    const key = (e) => {
      const beat = state && state.list[state.beat];
      const asking = !!(beat && beat.ask);
      if (!asking && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) { e.preventDefault(); advance(); }
      if (asking && /^[1-9]$/.test(e.key)) { e.preventDefault(); choose(Number(e.key) - 1); }
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
    };
    window.addEventListener('keydown', key);
    root._key = key;
    paint();
    root.focus && root.focus();
  }

  /* ---------- the whisper band ----------
   * A cutscene asks for all of a child's attention; a game needs a friend
   * talking at the edge of the screen instead. This is that edge: one short
   * line from one friend, drawn over any game, gone again before it becomes
   * a nuisance. It never takes pointer input, so it cannot eat a tap.
   */
  let whisperEl = null, whisperTimer = 0;

  // One band for the whole page, shown and hidden rather than built and torn
  // down each time — a game speaks often and DOM churn under Phaser is wasted.
  function band() {
    if (!whisperEl) {
      whisperEl = document.createElement('div');
      whisperEl.className = 'du-whisper';
      document.body.appendChild(whisperEl);
    }
    return whisperEl;
  }

  function hideWhisper() {
    clearTimeout(whisperTimer);
    if (whisperEl) whisperEl.classList.remove('in');
  }

  function whisper(text, who) {
    const FXn = FX();
    if (!FXn || !FXn.dinoHTML || !text) return hideWhisper();
    // A cutscene owns the screen while it runs; a whisper must not talk over it.
    if (document.querySelector('.du-cut')) return hideWhisper();
    const f = FRIENDS[who] || FRIENDS.rex;
    const el = band();
    el.innerHTML = '<span class="du-whisper-art">' +
      FXn.dinoHTML(f.species, { state: 'happy', color: f.colour, size: '76px' }) +
      '</span><span class="du-whisper-body"><b>' + esc(f.name) + '</b><i>' + esc(text) + '</i></span>';
    void el.offsetWidth;
    el.classList.add('in');
    whisperTimer = setTimeout(hideWhisper, Math.min(9000, 2800 + String(text).length * 46));
  }

  const DUSTORY = window.DUSTORY = {
    CHAPTERS, FRIENDS,
    count: CHAPTERS.length,
    chapter: (i) => CHAPTERS[i],
    /** Story text with the child's name put in — for any page that prints a beat. */
    fill: (text) => say(text),
    chapterFor: (world) => WORLD_CHAPTER[world],
    /** Which chapter index a world belongs to, or null for the frame story. */
    goal: (world) => (CHAPTERS[WORLD_CHAPTER[world]] || {}).goal || null,
    line(key, kind) {
      const g = GAME_LINES[key];
      return g && g[kind] ? say(g[kind]) : '';
    },
    /** Spoken/printed line for a game, with a safe generic fallback. */
    forGame(key, kind) {
      const got = DUSTORY.line(key, kind);
      if (got) return got;
      return say({ intro: 'Let us play!', win: 'Hooray! Well done.', lose: 'Nearly. One more go?' }[kind]);
    },
    /** Show one line over a game, with the friend who says it on screen. */
    whisper,
    /** Clear any line still on screen. */
    hush: hideWhisper,
    /** Which friend introduces a game, so a page can draw the same face. */
    gameVoice: (key) => (GAME_LINES[key] || {}).who || null,
    /**
     * Let a friend introduce, praise or encourage a game by itself. The game
     * only has to know its own ledger key, like 'park.dig'.
     */
    voice(key, kind, who) {
      const text = DUSTORY.forGame(key, kind);
      whisper(text, who || (GAME_LINES[key] || {}).who || 'rex');
      speak(text);
      return text;
    },
    names: () => Object.keys(FRIENDS).map((k) => Object.assign({ id: k }, FRIENDS[k])),
    /** Which way the child chose, per chapter. The newest pick wins. */
    picks: readPicks,
    /** Who rides with this child: 'pip', 'bumper', or null until they choose. */
    companion: () => companionOf(),
    /** One chapter's branch in the story's own words, or null if unchosen. */
    path: (chapterId) => pathOf(chapterId),
    /** The whole path so far, in the order the story tells it. */
    trail: () => { const p = readPicks(); return CHAPTERS.map((c) => pathOf(c.id, p)).filter(Boolean); },
    /** How many decisions the story asks for, and how many this child made. */
    forkTotal,
    forksAnswered: () => pickCount(readPicks()),
    /** The name of the ending the child is on their way to, if they have chosen it. */
    ending: () => {
      const t = readPicks()['egg-dash'];
      return t === 'give' ? 'The Loudest Garden' : t === 'plant' ? 'The Top of Mount Roar' : null;
    },
    /** The beats this child will actually see in a chapter — branches and all. */
    beats: (i, mode) => beatList(CHAPTERS[i] || {}, mode === 'win' ? 'win' : 'intro', readPicks()),
    play: show,
    /** Play a world's intro the first time a child enters it. */
    intro(world, cb) {
      const i = WORLD_CHAPTER[world];
      if (i === undefined) return cb && cb();
      const seen = window.DUJourney && window.DUJourney.found('story:' + CHAPTERS[i].id);
      // Chapters are never locked: a child who wants Meadow plays Meadow, and
      // the arc only ever adds context, it never withholds a game.
      if (seen) return cb && cb();
      show(i, { mode: 'intro', onDone: cb });
    },
    /** The reward cutscene when a world's goal is met. */
    celebrateWorld(world, cb) {
      const i = WORLD_CHAPTER[world];
      if (i === undefined) return cb && cb();
      const c = CHAPTERS[i];
      if (!c.win) return cb && cb();
      if (window.DUJourney && window.DUJourney.has('crystal:' + c.id)) return cb && cb();
      if (window.DUJourney) window.DUJourney.badge('crystal:' + c.id);
      show(i, { mode: 'win', onDone: cb });
    },
    close() { if (root) unmount(); },
    open() { return !!root; }
  };
  window.addEventListener('pagehide', () => { if (root && root._key) window.removeEventListener('keydown', root._key); });
})();
