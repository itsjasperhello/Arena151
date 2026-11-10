/* =====================================================================
   Section 46: ALOLA — the seventh story region: island trials instead of
   gyms (captains and kahunas), registered with the region switch in johto.js
   ===================================================================== */
(function alolaRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, $ = id => document.getElementById(id), arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  const GYMS_A = [
    G(1, 'a1', 'switcher', 'Captain Ilima', 'Ilima', 'Verdant Cavern · Melemele', 'Normal', 'Normalium Z', arena('cavern', 'plaza'), ['Smeargle', 'Eevee', 'Pikipek', 'Komala', 'Bunnelby', 'Gumshoos'], [10, 11, 11, 12, 12, 13],
      'I’m Ilima, captain of the Verdant Cavern trial. Shall we see what you’re capable of?', 'A fine effort — but not yet.', 'Splendid! You’ve cleared my trial. Take the Normalium Z.'),
    G(2, 'a2', 'aggro', 'Kahuna Hala', 'Hala', 'Iki Town · Melemele', 'Fighting', 'Fightinium Z', arena('summit', 'plaza'), ['Mankey', 'Crabrawler', 'Passimian', 'Machop', 'Pancham', 'Hariyama'], [14, 15, 15, 16, 16, 17],
      'I am Hala, kahuna of Melemele! Show me the spirit you’ve built on your island challenge!', 'Hoo-hah! Train more!', 'Hoo-hah! You have a fine spirit. The Fightinium Z is yours.'),
    G(3, 'a3', 'status', 'Captain Lana', 'Lana', 'Brooklet Hill · Akala', 'Water', 'Waterium Z', arena('cerulean', 'hall'), ['Wishiwashi', 'Wingull', 'Shellder', 'Chinchou', 'Corsola', 'Araquanid'], [18, 19, 19, 20, 21, 22],
      'I’m Lana, captain of Brooklet Hill. Let’s go fishing… for a battle.', '…I caught you.', 'You passed my trial. Here’s the Waterium Z.'),
    G(4, 'a4', 'aggro', 'Captain Kiawe', 'Kiawe', 'Wela Volcano · Akala', 'Fire', 'Firium Z', arena('cinnabar', 'meteor'), ['Growlithe', 'Fletchinder', 'Salazzle', 'Turtonator', 'Torkoal', 'Magmar'], [22, 23, 23, 24, 25, 26],
      'I’m Kiawe, captain of Wela Volcano! Feel the burning passion of my Fire Pokémon!', 'Your fire burned out.', 'Your passion burns brighter than mine. The Firium Z is yours.'),
    G(5, 'a5', 'defensive', 'Kahuna Olivia', 'Olivia', 'Ruins of Life · Akala', 'Rock', 'Rockium Z', arena('pewter', 'cavern'), ['Boldore', 'Lycanroc', 'Minior', 'Relicanth', 'Carbink', 'Probopass'], [26, 27, 27, 28, 29, 30],
      'I’m Olivia, kahuna of Akala. My Rock Pokémon are as solid as diamonds — let’s see you crack them.', 'Solid as a rock.', 'You cracked them! The Rockium Z is yours.'),
    G(6, 'a6', 'status', 'Captain Acerola', 'Acerola', 'Thrifty Megamart · Ula’ula', 'Ghost', 'Ghostium Z', arena('meteor', 'grand'), ['Sableye', 'Drifblim', 'Dhelmise', 'Froslass', 'Palossand', 'Mimikyu'], [32, 33, 33, 34, 35, 36],
      'Hiya! I’m Acerola! My Ghost Pokémon love to play — wanna play with us?', 'Boo! I win!', 'Aww, you’re good! The Ghostium Z is yours.'),
    G(7, 'a7', 'switcher', 'Kahuna Nanu', 'Nanu', 'Po Town · Ula’ula', 'Dark', 'Darkinium Z', arena('meteor', 'plaza'), ['Krokorok', 'Honchkrow', 'Absol', 'Liepard', 'Weavile', 'Umbreon'], [36, 37, 37, 38, 39, 40],
      'Nanu. Kahuna of Ula’ula, if you can believe it. Fine — let’s get this over with.', 'Heh. Too bad.', 'Huh. You’re the real thing. Darkinium Z’s yours.'),
    G(8, 'a8', 'defensive', 'Kahuna Hapu', 'Hapu', 'Vast Poni Canyon · Poni', 'Ground', 'Groundium Z', arena('cavern', 'oasis'), ['Dugtrio', 'Gastrodon', 'Flygon', 'Golurk', 'Rhyperior', 'Mudsdale'], [42, 43, 43, 44, 45, 46],
      'I am Hapu, the new kahuna of Poni Island. The earth itself will judge you!', 'The earth has spoken.', 'The earth accepts you. The Groundium Z is yours — you have completed the island challenge!'),
    G(9, 'a9', 'aggro', 'Kahili', 'Kahili', 'Mt. Lanakila · Pokémon League', 'Flying', 'Elite Four', arena('castle', 'summit'), ['Skarmory', 'Crobat', 'Oricorio', 'Mandibuzz', 'Toucannon', 'Braviary'], [50, 51, 51, 52, 53, 54],
      'I’m Kahili of the Elite Four. My Flying Pokémon soar like a perfect golf drive. Fore!', 'A hole in one.', 'You’ve got a strong swing. The Champion awaits.'),
    G(10, 'a10', 'switcher', 'Professor Kukui', 'Kukui', 'Mt. Lanakila · Pokémon League', 'Champion', 'Champion', arena('hall', 'grand'), ['Lycanroc', 'Ninetales', 'Braviary', 'Magnezone', 'Snorlax', 'Primarina'], [56, 57, 57, 58, 58, 62],
      'Woo! I built this League so Alola could have a Champion. Let’s make it you — show me everything!', 'Woo! That was a great battle!', 'Woo! You are the first Champion of Alola!')
  ];
  const STARTER_TYPE = {};
  for (const [t, names] of Object.entries({
    grass: ['Rowlet', 'Dartrix', 'Decidueye', 'Chespin', 'Quilladin', 'Chesnaught', 'Snivy', 'Servine', 'Serperior', 'Turtwig', 'Grotle', 'Torterra', 'Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur'],
    fire: ['Litten', 'Torracat', 'Incineroar', 'Fennekin', 'Braixen', 'Delphox', 'Tepig', 'Pignite', 'Emboar', 'Chimchar', 'Monferno', 'Infernape', 'Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard'],
    water: ['Popplio', 'Brionne', 'Primarina', 'Froakie', 'Frogadier', 'Greninja', 'Oshawott', 'Dewott', 'Samurott', 'Piplup', 'Prinplup', 'Empoleon', 'Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise'] })) for (const n of names) STARTER_TYPE[n] = t;
  const base = n => String(n || '').split('|')[0];
  function starterType() { const s = STORY.save; if (!s) return 'grass';
    if (s.starter && STARTER_TYPE[base(s.starter)]) return STARTER_TYPE[base(s.starter)];
    for (const n of s.team || []) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    for (const n of Object.keys(s.dex || {})) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    return 'grass'; }
  const LINES = { grass: ['Rowlet', 'Dartrix', 'Decidueye'], fire: ['Litten', 'Torracat', 'Incineroar'], water: ['Popplio', 'Brionne', 'Primarina'] };
  const counter = () => ({ grass: LINES.fire, fire: LINES.water, water: LINES.grass })[starterType()];
  GYMS_A[9].pickTeam = () => ['Lycanroc', 'Ninetales', 'Braviary', 'Magnezone', 'Snorlax', counter()[2]];   // Kukui’s starter beats yours
  const MAP = { img: 'story/alola_map.webp', w: 2576, h: 1438, home: { x: 1860, y: 520, city: 'Route 1 · Melemele' },
    gyms: { 1: [1640, 440], 2: [1480, 300], 3: [660, 360], 4: [1000, 460], 5: [720, 530], 6: [1860, 900], 7: [1940, 660], 8: [500, 800], 9: [2120, 860], 10: [2180, 760] },
    legs: [
      [[1860, 520], [1760, 500], [1640, 440]],
      [[1640, 440], [1560, 380], [1480, 300]],
      [[1480, 300], [1420, 480], [1200, 560], [900, 560], [700, 500], [660, 360]],
      [[660, 360], [820, 400], [1000, 460]],
      [[1000, 460], [860, 510], [720, 530]],
      [[720, 530], [980, 620], [1120, 660], [1500, 800], [1760, 880], [1860, 900]],
      [[1860, 900], [1880, 780], [1940, 660]],
      [[1940, 660], [1700, 760], [1300, 760], [900, 760], [700, 780], [500, 800]],
      [[500, 800], [900, 800], [1400, 850], [1800, 950], [2000, 960], [2120, 860]],
      [[2120, 860], [2180, 760]]
    ] };
  const NAMES = ['Route 1 → Hau’oli City → Verdant Cavern', 'Route 2 → Iki Town', 'Ferry to Akala → Heahea City → Brooklet Hill', 'Route 5 → Wela Volcano Park', 'Route 8 → Konikoni City → Ruins of Life',
    'Ferry past Aether Paradise → Malie City → Route 14', 'Route 17 → Po Town', 'Ferry to Poni → Seafolk Village → Vast Poni Canyon', 'Ferry to Ula’ula → Mount Lanakila → Pokémon League', 'Pokémon League · the Champion’s room', 'Altar of the Sunne · Poni'];
  const ASH = [[2180, 760], [1700, 700], [1000, 720], [400, 700]];
  const ROUTES_A = [
    { leg: 0, name: 'Routes 1 · 2 · Melemele Meadow', scene: 'meadow', mons: [['Pikipek', 2, 4, 10], ['Yungoos', 2, 4, 10], ['Grubbin', 3, 5, 6], ['Caterpie', 3, 4, 5], ['Cutiefly', 3, 5, 5], ['Oricorio', 4, 5, 3], ['Mankey', 4, 5, 4], ['Pichu', 4, 5, 2], ['Rockruff', 5, 5, 1.5]] },
    { leg: 1, name: 'Ten Carat Hill · Kala’e Bay', scene: 'cave', mons: [['Zubat', 7, 9, 6], ['Diglett', 7, 9, 6], ['Roggenrola', 7, 9, 6], ['Rockruff', 8, 10, 3], ['Carbink', 9, 9, 1.5], ['Wingull', 7, 9, 5], ['Slowpoke', 8, 10, 4], ['Bagon', 10, 10, .5]] },
    { leg: 2, name: 'Brooklet Hill · Route 4', scene: 'sea', mons: [['Wishiwashi', 12, 14, 6], ['Dewpider', 12, 14, 6], ['Psyduck', 12, 14, 5], ['Wingull', 12, 14, 5], ['Mudbray', 13, 15, 5], ['Lillipup', 12, 14, 5], ['Eevee', 14, 14, 1], ['Pikipek', 12, 14, 5]] },
    { leg: 3, name: 'Wela Volcano Park · Route 5', scene: 'mountain', mons: [['Salandit', 16, 18, 7], ['Cubone', 16, 18, 5], ['Fletchinder', 16, 18, 5], ['Kangaskhan', 18, 18, 1], ['Fomantis', 16, 18, 5], ['Butterfree', 16, 18, 4], ['Trumbeak', 16, 18, 5], ['Litleo', 17, 17, 1]] },
    { leg: 4, name: 'Lush Jungle · Route 8', scene: 'forest', mons: [['Bounsweet', 20, 22, 6], ['Morelull', 20, 22, 6], ['Comfey', 21, 23, 3], ['Oranguru', 22, 22, 2], ['Passimian', 22, 22, 2], ['Stufful', 21, 23, 4], ['Goomy', 22, 22, .8], ['Fomantis', 20, 22, 5]] },
    { leg: 5, name: 'Malie Garden · Route 10 · Hokulani', scene: 'city', mons: [['Snorlax', 26, 26, .6], ['Magnemite', 24, 26, 6], ['Elekid', 24, 26, 3], ['Togedemaru', 24, 26, 5], ['Skarmory', 25, 27, 3], ['Minior', 25, 27, 3], ['Meowth', 24, 26, 5], ['Poliwag', 24, 26, 5]] },
    { leg: 6, name: 'Route 17 · Haina Desert · Po Town', scene: 'safari', mons: [['Sandile', 28, 30, 6], ['Trapinch', 28, 30, 5], ['Gastly', 28, 30, 5], ['Mimikyu', 30, 30, 1], ['Absol', 30, 30, 1.5], ['Sneasel', 29, 31, 4], ['Murkrow', 29, 31, 4], ['Ultra Beasts', 0, 0, 0]].filter(m => m[0] !== 'Ultra Beasts') },
    { leg: 7, name: 'Poni Plains · Vast Poni Canyon · Ultra Space', scene: 'tower', mons: [['Tauros', 36, 38, 4], ['Miltank', 36, 38, 4], ['Jangmo-o', 36, 36, .8], ['Hakamo-o', 40, 40, .4], ['Golett', 36, 38, 4], ['Boldore', 36, 38, 5], ['Lycanroc', 38, 38, 2], ['Wimpod', 34, 36, 4],
      ['Tapu Fini', 50, 50, .03], ['Tapu Bulu', 50, 50, .03], ['Nihilego', 55, 55, .02], ['Buzzwole', 55, 55, .02], ['Pheromosa', 55, 55, .02], ['Kartana', 55, 55, .02], ['Solgaleo', 60, 60, .02], ['Lunala', 60, 60, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at, unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_A = [
    T('a-youngster', 'Youngster Joey', ['youngster'], 'Route 1', [1800, 470], 0, 1, arena('plaza'), [['Pikipek', 6], ['Yungoos', 6], ['Grubbin', 7]], 'Welcome to Alola! Let’s battle!', 'Aww, nice!', 'Woo!'),
    T('a-tourist', 'Tourist Cindy', ['lass', 'beauty', 'picnicker'], 'Hau’oli City', [1560, 520], 1, 2, arena('plaza'), [['Oricorio', 10], ['Cutiefly', 10], ['Wingull', 11]], 'I came to Alola for the beaches — and the battles!', 'Vacation’s over…', 'Aloha!'),
    T('a-mallow', 'Captain Mallow', ['mallow'], 'Lush Jungle · Akala', [800, 300], 3, 4, arena('ruins', 'plaza'), [['Bounsweet', 22], ['Fomantis', 22], ['Shiinotic', 23], ['Steenee', 24]], 'I’m Mallow, captain of the Lush Jungle! Let’s cook up a battle!', 'You’ve got great taste!', 'A delicious win!'),
    T('a-surfer', 'Surfer Kai', ['swimmer', 'surfer'], 'Heahea City', [560, 500], 4, 4, arena('cerulean'), [['Wishiwashi', 26], ['Pyukumuku', 26], ['Mareanie', 27], ['Bruxish', 28]], 'The waves off Akala are perfect today!', 'Wiped out!', 'Tubular!'),
    T('a-sophocles', 'Captain Sophocles', ['sophocles', 'scientist'], 'Hokulani Observatory · Ula’ula', [2280, 760], 5, 5, arena('vermilion'), [['Togedemaru', 32], ['Charjabug', 32], ['Magneton', 33], ['Vikavolt', 34]], 'I’m Sophocles, captain of the Hokulani trial. My calculations say I’ll win!', 'Recalculating…', 'As calculated!'),
    T('a-skull', 'Team Skull Grunt', ['skullgrunt', 'teamskullgrunt', 'skull'], 'Route 17', [1900, 760], 6, 6, arena('plaza'), [['Golbat', 36], ['Salazzle', 36], ['Garbodor', 37], ['Mareanie', 37]], 'Yo! Team Skull runs this road, yo!', 'Not cool, yo…', 'Skull out!'),
    T('a-seafolk', 'Fisherman Kaimana', ['fisherman'], 'Seafolk Village · Poni', [460, 900], 7, 6, arena('cerulean'), [['Wailmer', 42], ['Bruxish', 42], ['Lanturn', 43], ['Gyarados', 44]], 'The Seafolk have fished these waters for generations!', 'The one that got away…', 'Hooked!'),
    T('a-veteran', 'Veteran Ikaika', ['veteran', 'cooltrainermale', 'cooltrainerm'], 'Mount Lanakila', [2040, 900], 8, 7, arena('cavern', 'ice'), [['Crabominable', 50], ['Kommo-o', 50], ['Golisopod', 51], ['Toxapex', 52]], 'Mount Lanakila is the final climb before the League.', 'You’re ready.', 'Not yet.')
  ];
  Object.assign(D.RULES, {
    a1: { banA: ['Fighting'], title: 'Verdant Cavern', text: 'Ilima’s trial rules: your FIGHTING moves are banned.' },
    a2: { banA: ['Psychic'], title: 'Kahuna’s spirit', text: 'Hala’s grand trial tests your fighting spirit: your PSYCHIC moves are banned.' },
    a3: { weather: 'rain', title: 'Brooklet Hill rain', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    a4: { weather: 'sun', title: 'Wela Volcano', text: 'Permanent HARSH SUN: Fire moves 50% harder, Water moves 50% weaker.' },
    a5: { weather: 'sand', title: 'Ruins of Life', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    a6: { banA: ['Dark'], title: 'Abandoned Megamart', text: 'The spirits of the Megamart veil the totem: your DARK moves are banned.' },
    a7: { handicap: 4, title: 'Po Town rules', text: 'Nanu doesn’t care for crowds: bring only your first FOUR Pokémon.' },
    a8: { banA: ['Water'], title: 'Dry canyon', text: 'Vast Poni Canyon is bone dry: your WATER moves are banned.' },
    a9: { banA: ['Ice'], title: 'Clear skies', text: 'Kahili’s summit court is calm and clear: your ICE moves are banned.' }
  });
  Object.assign(D.SCRIPT.gym, {
    a1: [['foe', 'Welcome to my trial! The totem Pokémon awaits — but first, me!'], ['me', 'Let’s go!']],
    a2: [['foe', 'Hoo-hah! The grand trial of Melemele begins!'], ['me', 'I’m ready, Hala.']],
    a3: [['foe', '…The fish are biting. So are my Pokémon.'], ['me', 'Let’s battle.']],
    a4: [['foe', 'The volcano burns — and so does my passion! Let’s dance!'], ['me', 'Bring the heat!']],
    a5: [['foe', 'Akala’s grand trial is as hard as diamond.'], ['me', 'I’ll crack it.']],
    a6: [['foe', 'Ooh, the Megamart is spooky, right? Let’s battle!'], ['me', 'I’m not scared!']],
    a7: [['foe', 'Kahuna, huh… Fine. Let’s battle.'], ['me', 'Let’s go.']],
    a8: [['foe', 'The guardian of Poni chose me. Now I test you.'], ['me', 'Test me.']],
    a9: [['foe', 'Welcome to the summit. Ready to tee off?'], ['me', 'Fore!']]
  });
  const CHAMP = { cocky: [['foe', 'Woo! Alola’s very first League challenger! I’m the Champion-to-be-beaten — let’s go!'], ['me', 'Woo! Let’s go, Professor!']] }; CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'Hey! It’s me, Hau! Let’s have a battle and then go get some malasadas!'], ['me', 'Let’s go, Hau!']], rattled: [['foe', 'I’ve been training! This time I’m winning!']], bitter: [['foe', 'Man, you’re tough! One more!']] },
      { cocky: [['foe', 'Ula’ula’s amazing! Battle me before the trial!']], rattled: [['foe', 'My Pokémon and I are way stronger now!']], bitter: [['foe', 'I keep thinking about why you’re so strong…']] },
      { cocky: [['foe', 'The League! Before you go in — one more battle!']], rattled: [['foe', 'This is it! Everything I’ve got!']], bitter: [['foe', 'Win or lose, I’m glad we did the island challenge together!']] }
    ],
    win: { cocky: [['foe', 'Aww, man! You’re awesome!']], rattled: [['foe', 'Next time for sure!']], bitter: [['foe', 'Go win it all!']] },
    lose: { cocky: [['foe', 'Yeah! I won! Malasadas on me!']], rattled: [['foe', 'All that training paid off!']], bitter: [['foe', 'I won! …Now go show the League what you’ve got!']] }
  };
  const EV = {
    1: { id: 'askull', title: 'Team Skull in Hau’oli', arena: arena('plaza'), text: 'Team Skull is causing trouble in Hau’oli City! Two Skull battles back to back — no healing between.',
      before: [['foe', 'Yo yo yo! Team Skull’s here to bust up your island challenge!'], ['me', 'Not happening.']],
      stages: [{ name: 'Skull Grunt', keys: ['skullgrunt', 'teamskullgrunt', 'skull'], team: ['Zubat', 'Salandit', 'Drowzee'], style: 'aggro' }, { name: 'Skull Grunt', keys: ['skullgrunt', 'teamskullgrunt', 'skull'], team: ['Yungoos', 'Mareanie', 'Grimer'], style: 'switcher', line: 'Yo, you beat my homie? Now face me, yo!' }],
      win: [['foe', 'Ugh, not cool! We’re outta here!']], lose: [['foe', 'Team Skull rules, yo!']] },
    3: { id: 'agladion', title: 'Gladion’s challenge', format: '1v1', name: 'Gladion', keys: ['gladion'], team: ['Type: Null'], style: 'aggro', arena: arena('summit', 'plaza'),
      text: 'Gladion wants to test you: a 1v1 — your lead against his Type: Null.',
      before: [['foe', 'You’re the kid doing the island challenge. Let’s see if you’re worth anything.'], ['me', 'Let’s go.']],
      win: [['foe', 'Hmph. You’re stronger than I thought.']], lose: [['foe', 'As expected.']] },
    4: { id: 'atotem', title: 'Totem puzzle', format: 'puzzle', name: 'Totem Toxapex', keys: [], team: ['Toxapex'], fixedTeam: ['Ribombee', 'Lurantis', 'Crabrawler', 'Vikavolt'], foeScale: 1.6, style: 'defensive', arena: arena('cerulean', 'cavern'),
      text: 'Puzzle battle: a totem Toxapex blocks the trial site. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', '…!'], ['me', 'A totem Toxapex! Its defenses are huge — I need the right Pokémon.']],
      win: [['me', 'Electric! Toxapex is part Water — that did it!']], lose: [['me', 'Neutral hits barely scratch it… think about what Water and Poison are both weak to.']] },
    6: { id: 'apotown', title: 'Shady House', arena: arena('meteor', 'plaza'), text: 'Storm Team Skull’s Shady House in Po Town! Plumeria, then Guzma — back to back, no healing between.',
      before: [['foe', 'You came all the way to Po Town? Guzma’s waiting upstairs.'], ['me', 'Then let’s go.']],
      stages: [{ name: 'Plumeria', keys: ['plumeria'], team: ['Golbat', 'Salazzle', 'Garbodor'], style: 'status' }, { name: 'Guzma', keys: ['guzma'], team: ['Masquerain', 'Ariados', 'Pinsir', 'Golisopod'], style: 'aggro', line: 'Guzma! The big bad boss of Team Skull! Destruction in human form!' }],
      win: [['foe', 'Guzma… lost again? What’s wrong with me?']], lose: [['foe', 'Guzma wins! Destruction!']] },
    7: { id: 'aaether', title: 'Aether Paradise', arena: arena('hall', 'grand'), text: 'Lusamine has opened an Ultra Wormhole! Lusamine, then the Ultra Beast Nihilego — back to back, no healing between.',
      before: [['foe', 'My beautiful Ultra Beasts… I will love them forever. You will not stand in my way.'], ['me', 'Lusamine, stop this!']],
      stages: [{ name: 'Lusamine', keys: ['lusamine'], team: ['Clefable', 'Lilligant', 'Milotic', 'Mismagius', 'Bewear'], style: 'switcher' }, { name: 'Nihilego', keys: [], team: ['Nihilego'], foeScale: .9, style: 'status', line: 'An Ultra Beast slips through the wormhole!' }],
      win: [['me', 'The wormhole is closing… Alola is safe.']], lose: [['foe', 'My beautiful beasts will never leave me!']] }
  };
  Object.assign(EVO, { Rowlet: ['Dartrix', 17], Dartrix: ['Decidueye', 34], Litten: ['Torracat', 17], Torracat: ['Incineroar', 34], Popplio: ['Brionne', 17], Brionne: ['Primarina', 34],
    Pikipek: ['Trumbeak', 14], Trumbeak: ['Toucannon', 28], Yungoos: ['Gumshoos', 20], Grubbin: ['Charjabug', 20], Charjabug: ['Vikavolt', 30], Crabrawler: ['Crabominable', 30], Cutiefly: ['Ribombee', 25],
    Rockruff: ['Lycanroc', 25], Mareanie: ['Toxapex', 38], Mudbray: ['Mudsdale', 30], Dewpider: ['Araquanid', 22], Fomantis: ['Lurantis', 34], Morelull: ['Shiinotic', 24], Salandit: ['Salazzle', 33],
    Stufful: ['Bewear', 27], Bounsweet: ['Steenee', 18], Steenee: ['Tsareena', 29], Wimpod: ['Golisopod', 30], Sandygast: ['Palossand', 42], 'Type: Null': ['Silvally', 40], 'Jangmo-o': ['Hakamo-o', 35],
    'Hakamo-o': ['Kommo-o', 45], Cosmog: ['Cosmoem', 43], Poipole: ['Naganadel', 40], Meltan: ['Melmetal', 50] });
  window.ALOLA = { gyms: GYMS_A, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_A, minors: MINORS_A, starters: ['Rowlet', 'Litten', 'Popplio'],
    badges: ['normalium', 'fightinium', 'waterium', 'firium', 'rockium', 'ghostium', 'darkinium', 'groundium', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Pikachu', 'Pikipek', '*1'], ['Pikachu', 'Trumbeak', 'Eevee', '*1'], ['Raichu', 'Toucannon', 'Flareon', 'Tauros', '*2']],
    rival: { file: 'Hau', leader: 'Hau' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter, rivalKey: 'rivalA', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { alola: EV });
  const _saveS = saveStory;
  saveStory = function () { const s = STORY.save; if (s && !s.starter && !s.badges && (s.team || []).length && STARTER_TYPE[base(s.team[0])]) s.starter = base(s.team[0]); return _saveS.apply(this, arguments); };
  let offering = false;
  async function offerAlola() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || s.phase !== 'kalos' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Kalos’s Champion too! A flight leaves for Alola — four tropical islands, the island challenge, and the legends of the sun and moon.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Fly to Alola</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.kalos = { badges: s.badges, at: Date.now() }; s.phase = 'alola'; s.badges = 0; saveStory(); if (typeof syncRegion === 'function') syncRegion(); renderStory(); setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  const _open = openStoryScreen; openStoryScreen = function () { const r = _open.apply(this, arguments); setTimeout(offerAlola, 948); return r; };
  /* ---------- post-game: Necrozma in Ultra Space ---------- */
  let offeringN = false;
  async function offerNecrozma() {
    const s = STORY.save; if (offeringN || !s || STORY.region !== 'alola' || s.badges < TOTAL || s.necrozma || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringN = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Alola’s first Champion! An Ultra Wormhole has opened above Mt. Lanakila — and a blinding light is pouring through…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Enter Ultra Space</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await enterUltraSpace();
    } finally { offeringN = false; STORY.cutscene = false; }
  }
  async function enterUltraSpace() {
    const s = STORY.save, who = { file: 'Necrozma', leader: 'Necrozma' };
    closeModal();
    await playScene([['foe', '…LIGHT…'], ['me', 'Necrozma — it’s been starving for light. Everyone, give it everything!']], who, { title: 'Ultra Space', text: 'Your whole team against Necrozma, the Prism Pokémon, in the blinding glare of Ultra Space.' });
    STORY.battle = { gym: 9, necrozma: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.8, aiStyle: 'switcher', weather: 'sun', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Necrozma'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Necrozma'], arena('hall', 'grand')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.enterUltraSpace = enterUltraSpace;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.necrozma) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.necrozma = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Necrozma', 75); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['me', 'The light is back… and Necrozma wants to come with us!']] : [['foe', '…LIGHT…']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open2 = openStoryScreen; openStoryScreen = function () { const r = _open2.apply(this, arguments); setTimeout(offerNecrozma, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
})();
