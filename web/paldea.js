/* =====================================================================
   Section 50: PALDEA — the ninth story region, registered with the region
   switch in johto.js (map coordinates are in the 2× map’s pixels)
   ===================================================================== */
(function paldeaRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, $ = id => document.getElementById(id), arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  const GYMS_P = [
    G(1, 'p1', 'switcher', 'Katy', 'Katy', 'Cortondo', 'Bug', 'Bug Badge', arena('ruins', 'plaza'), ['Nymble', 'Tarountula', 'Rellor', 'Combee', 'Kricketune', 'Teddiursa'], [12, 13, 13, 14, 14, 15],
      'I’m Katy, Cortondo’s Gym Leader and baker! My Bug Pokémon are sweet — but tough!', 'Fresh out of the oven!', 'Oh my, what a treat! Here’s the Bug Badge.'),
    G(2, 'p2', 'status', 'Brassius', 'Brassius', 'Artazon', 'Grass', 'Grass Badge', arena('ruins', 'castle'), ['Petilil', 'Sudowoodo', 'Bramblin', 'Toedscool', 'Capsakid', 'Arboliva'], [16, 17, 17, 18, 19, 20],
      'I am Brassius, artist! Let us create a masterpiece of battle together!', 'A masterpiece!', 'Magnificent art! The Grass Badge is yours.'),
    G(3, 'p3', 'status', 'Iono', 'Iono', 'Levincia', 'Electric', 'Electric Badge', arena('vermilion', 'plaza'), ['Bellibolt', 'Luxio', 'Mismagius', 'Pawmo', 'Rotom', 'Kilowattrel'], [22, 23, 23, 24, 25, 26],
      'Hey hey hey! It’s Iono, your electrifyin’ streamer! Let’s make this battle go viral!', 'That’s a win for the stream!', 'Ugh, you shocked me! Here’s the Electric Badge!'),
    G(4, 'p4', 'aggro', 'Kofu', 'Kofu', 'Cascarrafa', 'Water', 'Water Badge', arena('cerulean', 'hall'), ['Veluza', 'Wugtrio', 'Crabominable', 'Clauncher', 'Finizen', 'Dondozo'], [28, 29, 29, 30, 31, 32],
      'I’m Kofu! Seafood is my passion — and so is battling! Let’s cook!', 'Overcooked!', 'What a catch! The Water Badge is yours.'),
    G(5, 'p5', 'defensive', 'Larry', 'Larry', 'Medali', 'Normal', 'Normal Badge', arena('plaza', 'grand'), ['Komala', 'Dudunsparce', 'Staraptor', 'Oinkologne', 'Maushold', 'Farigiraf'], [34, 35, 35, 36, 37, 38],
      'Larry. Gym Leader. Let’s keep this simple and get it over with.', 'That’s that.', 'You beat me. Normal Badge. There you go.'),
    G(6, 'p6', 'status', 'Ryme', 'Ryme', 'Montenevera', 'Ghost', 'Ghost Badge', arena('meteor', 'plaza'), ['Banette', 'Mimikyu', 'Houndstone', 'Toxtricity', 'Brambleghast', 'Polteageist'], [40, 41, 41, 42, 43, 44],
      'Yo! MC Ryme in the house! Let’s drop a beat and battle!', 'Mic drop!', 'You got the flow! The Ghost Badge is yours!'),
    G(7, 'p7', 'switcher', 'Tulip', 'Tulip', 'Alfornada', 'Psychic', 'Psychic Badge', arena('saffron', 'grand'), ['Gardevoir', 'Espathra', 'Florges', 'Rabsca', 'Gothitelle', 'Indeedee'], [44, 45, 45, 46, 47, 48],
      'I’m Tulip, makeup artist and Gym Leader. Let me see how beautiful your battling is.', 'Beautiful.', 'Gorgeous! The Psychic Badge is yours.'),
    G(8, 'p8', 'defensive', 'Grusha', 'Grusha', 'Glaseado', 'Ice', 'Ice Badge', arena('cavern', 'ice'), ['Frosmoth', 'Beartic', 'Cetitan', 'Altaria', 'Weavile', 'Glalie'], [48, 49, 49, 50, 51, 52],
      'Grusha. Ice Gym Leader. Let’s see if you can handle the cold.', 'Too cold for you.', 'You thawed me out. The Ice Badge is yours.'),
    G(9, 'p9', 'aggro', 'Hassel', 'Hassel', 'Pokémon League', 'Dragon', 'Elite Four', arena('summit', 'castle'), ['Noivern', 'Dragalge', 'Flapple', 'Haxorus', 'Tatsugiri', 'Baxcalibur'], [54, 55, 55, 56, 57, 58],
      'I am Hassel of the Elite Four — and an art teacher. Show me the art of your battling!', 'A beautiful lesson.', 'Splendid! The Top Champion awaits you.'),
    G(10, 'p10', 'switcher', 'Top Champion Geeta', 'Geeta', 'Pokémon League', 'Champion', 'Champion', arena('hall', 'grand'), ['Espathra', 'Gogoat', 'Veluza', 'Avalugg', 'Kingambit', 'Glimmora'], [60, 61, 61, 62, 63, 65],
      'I am Geeta, Top Champion of Paldea. Let me assess you myself.', 'A worthy effort.', 'You have passed the final assessment. Welcome, Champion.')
  ];
  GYMS_P[9].pickTeam = () => GYMS_P[9].team.slice();
  const STARTER_TYPE = {};
  for (const [t, names] of Object.entries({
    grass: ['Sprigatito', 'Floragato', 'Meowscarada', 'Grookey', 'Thwackey', 'Rillaboom', 'Rowlet', 'Dartrix', 'Decidueye', 'Chespin', 'Quilladin', 'Chesnaught', 'Snivy', 'Servine', 'Serperior', 'Turtwig', 'Grotle', 'Torterra', 'Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur'],
    fire: ['Fuecoco', 'Crocalor', 'Skeledirge', 'Scorbunny', 'Raboot', 'Cinderace', 'Litten', 'Torracat', 'Incineroar', 'Fennekin', 'Braixen', 'Delphox', 'Tepig', 'Pignite', 'Emboar', 'Chimchar', 'Monferno', 'Infernape', 'Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard'],
    water: ['Quaxly', 'Quaxwell', 'Quaquaval', 'Sobble', 'Drizzile', 'Inteleon', 'Popplio', 'Brionne', 'Primarina', 'Froakie', 'Frogadier', 'Greninja', 'Oshawott', 'Dewott', 'Samurott', 'Piplup', 'Prinplup', 'Empoleon', 'Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise'] })) for (const n of names) STARTER_TYPE[n] = t;
  const base = n => String(n || '').split('|')[0];
  function starterType() { const s = STORY.save; if (!s) return 'grass';
    if (s.starter && STARTER_TYPE[base(s.starter)]) return STARTER_TYPE[base(s.starter)];
    for (const n of s.team || []) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    for (const n of Object.keys(s.dex || {})) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    return 'grass'; }
  const LINES = { grass: ['Sprigatito', 'Floragato', 'Meowscarada'], fire: ['Fuecoco', 'Crocalor', 'Skeledirge'], water: ['Quaxly', 'Quaxwell', 'Quaquaval'] };
  const counter = () => ({ grass: LINES.fire, fire: LINES.water, water: LINES.grass })[starterType()];
  const X = ([x, y]) => [x * 2, y * 2];   // coordinates were read off the original map; the story uses the 2× copy
  const MAP = { img: 'story/paldea_map_2x.webp', w: 2048, h: 1144, home: { x: 986, y: 1070, city: 'Cabo Poco' },
    gyms: { 1: X([240, 395]), 2: X([563, 437]), 3: X([845, 268]), 4: X([330, 352]), 5: X([662, 218]), 6: X([585, 158]), 7: X([176, 187]), 8: X([549, 85]), 9: X([395, 200]), 10: X([480, 150]) },
    legs: [
      [[493, 535], [500, 460], [500, 380], [400, 390], [300, 400], [240, 395]], [[240, 395], [350, 400], [470, 380], [540, 420], [563, 437]], [[563, 437], [650, 400], [740, 340], [845, 268]],
      [[845, 268], [700, 300], [600, 360], [500, 370], [400, 360], [330, 352]], [[330, 352], [380, 250], [480, 190], [580, 200], [662, 218]], [[662, 218], [630, 190], [585, 158]],
      [[585, 158], [480, 140], [340, 150], [240, 170], [176, 187]], [[176, 187], [260, 120], [400, 90], [549, 85]], [[549, 85], [500, 130], [430, 175], [395, 200]], [[395, 200], [440, 165], [480, 150]]
    ].map(l => l.map(X)) };
  const NAMES = ['Poco Path → Mesagoza → South Province → Cortondo', 'Mesagoza → Artazon', 'East Province → Levincia', 'Mesagoza → West Province → Cascarrafa', 'Asado Desert → North Province → Medali',
    'Medali → Montenevera', 'North Province → Alfornada', 'Glaseado Mountain → Glaseado Gym', 'Glaseado → Pokémon League', 'Pokémon League · the Top Champion', 'Area Zero'];
  const ASH = [[480, 150], [490, 200], [500, 246]].map(X);
  const ROUTES_P = [
    { leg: 0, name: 'South Province · Areas One · Two', scene: 'meadow', mons: [['Lechonk', 2, 4, 10], ['Tarountula', 2, 4, 8], ['Nymble', 2, 4, 8], ['Hoppip', 3, 5, 6], ['Fletchling', 3, 5, 6], ['Pawmi', 3, 5, 5], ['Smoliv', 4, 6, 5], ['Fidough', 4, 6, 4], ['Tandemaus', 5, 5, 2]] },
    { leg: 1, name: 'South Province · Area Three', scene: 'meadow', mons: [['Skwovet', 10, 12, 6], ['Shroodle', 10, 12, 5], ['Bramblin', 10, 12, 5], ['Rookidee', 10, 12, 5], ['Capsakid', 11, 13, 4], ['Toedscool', 11, 13, 4], ['Squawkabilly', 12, 12, 2]] },
    { leg: 2, name: 'East Province · Area One · Levincia coast', scene: 'sea', mons: [['Wattrel', 16, 18, 7], ['Tadbulb', 16, 18, 6], ['Wiglett', 16, 18, 5], ['Finizen', 18, 18, 2], ['Shellos', 16, 18, 5], ['Luvdisc', 16, 18, 4], ['Mareep', 16, 18, 4]] },
    { leg: 3, name: 'Asado Desert · West Province', scene: 'safari', mons: [['Silicobra', 22, 24, 6], ['Sandile', 22, 24, 5], ['Rellor', 22, 24, 5], ['Orthworm', 24, 24, 2], ['Klawf', 24, 24, 1.5], ['Maschiff', 22, 24, 5], ['Varoom', 23, 25, 4], ['Charcadet', 24, 24, 1]] },
    { leg: 4, name: 'North Province · Medali fields', scene: 'meadow', mons: [['Flittle', 28, 30, 5], ['Bombirdier', 30, 30, 2], ['Girafarig', 28, 30, 4], ['Dunsparce', 28, 30, 4], ['Gimmighoul', 30, 30, .8], ['Tinkatink', 28, 30, 3], ['Greavard', 28, 30, 4]] },
    { leg: 5, name: 'Montenevera slopes', scene: 'mountain', mons: [['Cetoddle', 34, 36, 5], ['Frigibax', 36, 36, .8], ['Snom', 34, 36, 5], ['Bergmite', 34, 36, 5], ['Sneasel', 34, 36, 4], ['Glimmet', 35, 37, 3], ['Houndstone', 38, 38, 1]] },
    { leg: 6, name: 'North Province · Alfornada cavern', scene: 'cave', mons: [['Glimmet', 38, 40, 5], ['Nacli', 38, 40, 6], ['Naclstack', 40, 40, 2], ['Gimmighoul', 38, 38, 1], ['Flittle', 38, 40, 4], ['Espathra', 42, 42, .6], ['Cyclizar', 40, 40, 2]] },
    { leg: 7, name: 'Glaseado Mountain · Area Zero', scene: 'tower', mons: [['Frigibax', 44, 44, 1], ['Cetitan', 46, 46, 1.5], ['Tatsugiri', 44, 46, 3], ['Dondozo', 46, 46, 1], ['Great Tusk', 55, 55, .1], ['Flutter Mane', 55, 55, .1], ['Iron Valiant', 55, 55, .1], ['Roaring Moon', 55, 55, .1],
      ['Ting-Lu', 60, 60, .02], ['Chien-Pao', 60, 60, .02], ['Koraidon', 65, 65, .02], ['Miraidon', 65, 65, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at: X(at), unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_P = [
    T('p-student', 'Student Ayumi', ['schoolkid', 'lass', 'youngster'], 'Poco Path', [495, 495], 0, 1, arena('plaza'), [['Lechonk', 6], ['Pawmi', 6], ['Fletchling', 7]], 'A new student? Let’s battle for Treasure Hunt practice!', 'Good luck out there!', 'Yay!'),
    T('p-hiker', 'Hiker Ernesto', ['hiker'], 'South Province', [380, 395], 0, 2, arena('cavern'), [['Nacli', 10], ['Rolycoly', 10], ['Geodude', 11]], 'The South Province hills are great training!', 'Rockslide…', 'Solid!'),
    T('p-star', 'Team Star Grunt', ['stargrunt', 'teamstargrunt', 'teamstar'], 'Mesagoza outskirts', [520, 400], 1, 3, arena('plaza'), [['Murkrow', 18], ['Shroodle', 18], ['Maschiff', 19]], 'Team Star! Starfall Street style!', 'Ugh, not cool…', 'Star power!'),
    T('p-fisher', 'Fisher Mario', ['fisherman'], 'Levincia coast', [800, 300], 2, 4, arena('cerulean'), [['Wiglett', 24], ['Finizen', 24], ['Tadbulb', 25], ['Wugtrio', 26]], 'The fish off Levincia bite all day!', 'The one that got away…', 'Hooked!'),
    T('p-worker', 'Worker Raúl', ['worker', 'hiker'], 'Asado Desert', [360, 300], 3, 5, arena('oasis', 'cavern'), [['Silicobra', 30], ['Orthworm', 30], ['Varoom', 31], ['Klawf', 32]], 'Asado Desert is tough on machines — and Pokémon!', 'Breakdown…', 'Built tough!'),
    T('p-artist', 'Artist Elena', ['artist', 'beauty', 'lass'], 'Medali', [720, 250], 4, 5, arena('grand'), [['Flittle', 36], ['Smeargle', 36], ['Dachsbun', 37], ['Farigiraf', 38]], 'Medali’s fields inspire my art — and my battling!', 'A smudge…', 'Masterpiece!'),
    T('p-skier', 'Snowboarder Iker', ['skier', 'boarder'], 'Glaseado Mountain', [470, 110], 6, 6, arena('cavern', 'ice'), [['Cetoddle', 44], ['Arctibax', 44], ['Frosmoth', 45], ['Cetitan', 46]], 'Glaseado has the best snow in Paldea!', 'Wiped out!', 'Fresh powder!'),
    T('p-ace', 'Ace Trainer Carmen', ['cooltrainerfemale', 'cooltrainerf', 'acetrainerf'], 'Pokémon League gate', [350, 260], 8, 7, arena('castle'), [['Garganacl', 54], ['Gholdengo', 54], ['Annihilape', 55], ['Baxcalibur', 56]], 'Only the strongest reach the League gate.', 'You’re ready.', 'Not yet.')
  ];
  Object.assign(D.RULES, {
    p1: { banA: ['Rock'], title: 'Olive roll', text: 'Katy’s olive-rolling gym test: your ROCK moves are banned.' },
    p2: { weather: 'sun', title: 'Sunflower art', text: 'Permanent HARSH SUN: Fire moves 50% harder, Water moves 50% weaker.' },
    p3: { weather: 'rain', title: 'Live stream storm', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    p4: { banA: ['Electric'], title: 'Seafood market', text: 'Kofu’s market keeps the fish safe: your ELECTRIC moves are banned.' },
    p5: { handicap: 4, title: 'Keep it simple', text: 'Larry wants a simple battle: bring only your first FOUR Pokémon.' },
    p6: { banA: ['Dark'], title: 'Ghostly beat', text: 'Ryme’s spirits jam the stage: your DARK moves are banned.' },
    p7: { handicap: 5, title: 'Makeover', text: 'Tulip’s styling session: bring only your first FIVE Pokémon.' },
    p8: { weather: 'hail', title: 'Glaseado blizzard', text: 'Permanent HAIL chips every Pokémon that isn’t Ice.' },
    p9: { banA: ['Ice'], title: 'Art lesson', text: 'Hassel’s dragons stay warm: your ICE moves are banned.' }
  });
  Object.assign(D.SCRIPT.gym, {
    p1: [['foe', 'Welcome to the Cortondo Gym! Fresh pastries and fresh battles!'], ['me', 'Let’s go!']], p2: [['foe', 'Art and battle are one! Let us create!'], ['me', 'Let’s create!']],
    p3: [['foe', 'Ready, chat? Iono’s about to stream a big battle!'], ['me', 'Let’s go viral!']], p4: [['foe', 'Seafood and battling — my two passions!'], ['me', 'Let’s cook!']],
    p5: [['foe', 'Normal Pokémon. Normal battle. Let’s go.'], ['me', 'Okay.']], p6: [['foe', 'Yo, the beat’s about to drop!'], ['me', 'Drop it!']],
    p7: [['foe', 'Let me see your best look in battle.'], ['me', 'Ready.']], p8: [['foe', 'Let’s keep this cool.'], ['me', 'Bring the cold.']],
    p9: [['foe', 'Welcome to the League. Let us paint a battle.'], ['me', 'Let’s battle.']]
  });
  const CHAMP = { cocky: [['foe', 'I am Geeta, Top Champion of Paldea. I will assess you personally.'], ['me', 'I’m ready, Geeta.']] }; CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'It’s me, Nemona! I’ve been waiting for this — let’s battle!'], ['me', 'Let’s go, Nemona!']], rattled: [['foe', 'You beat me? That’s AMAZING! Again!']], bitter: [['foe', 'You’re getting so strong! I love it!']] },
      { cocky: [['foe', 'Montenevera! Battle me before your next badge!']], rattled: [['foe', 'My team’s ready for a rematch!']], bitter: [['foe', 'Every battle with you is the best!']] },
      { cocky: [['foe', 'The League! Let’s have the best battle ever before you go in!']], rattled: [['foe', 'Champion vs. challenger — let’s go!']], bitter: [['foe', 'You’re my greatest rival! Show me everything!']] }
    ],
    win: { cocky: [['foe', 'Wow! You’re incredible!']], rattled: [['foe', 'Again! Again!']], bitter: [['foe', 'That was the best!']] },
    lose: { cocky: [['foe', 'Yes! That was so much fun!']], rattled: [['foe', 'Told you I’d win this one!']], bitter: [['foe', 'I won! But you’re still my favorite rival!']] }
  };
  const EV = {
    1: { id: 'pdarkcrew', title: 'Team Star Dark Crew', arena: arena('plaza', 'meteor'), text: 'Storm Team Star’s Dark Crew base! A grunt, then boss Giacomo — back to back, no healing between.',
      before: [['foe', 'Team Star! Get out of our base!'], ['me', 'Not until I talk to your boss.']],
      stages: [{ name: 'Star Grunt', keys: ['stargrunt', 'teamstargrunt', 'teamstar'], team: ['Murkrow', 'Nickit', 'Shroodle'], style: 'aggro' }, { name: 'Giacomo', keys: ['giacomo'], team: ['Pawniard', 'Revavroom'], style: 'switcher', line: 'Giacomo, Dark Crew boss. Let’s drop the beat — and you.' }],
      win: [['foe', 'Huh… you’re legit. The Dark Crew is done.']], lose: [['foe', 'Star power, baby!']] },
    3: { id: 'ptitan', title: 'Stony Cliff Titan', format: '1v1', name: 'Titan Klawf', keys: [], team: ['Klawf'], foeScale: 1.3, style: 'aggro', arena: arena('cavern', 'oasis'),
      text: 'The Stony Cliff Titan — a giant Klawf! A 1v1 battle: your lead against it.',
      before: [['foe', 'CLACK CLACK!'], ['me', 'It’s huge! Let’s take it down!']],
      win: [['me', 'The Titan retreated! There’s a Herba Mystica up here…']], lose: [['foe', 'CLACK!']] },
    4: { id: 'psaltmine', title: 'Salt mine puzzle', format: 'puzzle', name: 'Hiker', keys: ['hiker'], team: ['Garganacl'], fixedTeam: ['Fletchinder', 'Shroodle', 'Fidough', 'Quaxwell'], foeScale: 1.6, style: 'defensive', arena: arena('cavern', 'meteor'),
      text: 'Puzzle battle: a Garganacl guards the salt mine. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'My Garganacl is as tough as rock salt!'], ['foe', 'Use these Pokémon, if you can figure it out.'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Water! It dissolves salt and wears down rock. Smart!']], lose: [['foe', 'Neutral hits barely scratch it… think about what beats Rock!']] },
    6: { id: 'pfightcrew', title: 'Team Star Fighting Crew', arena: arena('summit', 'plaza'), text: 'Storm the Fighting Crew base! A grunt, then boss Eri — back to back, no healing between.',
      before: [['foe', 'You’re messing with Team Star? Big mistake!'], ['me', 'Let’s settle this.']],
      stages: [{ name: 'Star Grunt', keys: ['stargrunt', 'teamstargrunt', 'teamstar'], team: ['Croagunk', 'Mankey', 'Pawmo'], style: 'aggro' }, { name: 'Eri', keys: ['eri'], team: ['Toxicroak', 'Passimian', 'Lucario', 'Annihilape'], style: 'aggro', line: 'Eri, Fighting Crew boss. I don’t back down.' }],
      win: [['foe', 'You’re strong. Team Star… was never the bad guys, you know.']], lose: [['foe', 'Fighting Crew stands tall!']] },
    7: { id: 'pareazero', title: 'Area Zero', arena: arena('hall', 'meteor'), text: 'Deep in Area Zero, the Professor’s AI defends the Time Machine! Its Paradox team, then Koraidon — back to back, no healing between.',
      before: [['foe', 'I cannot let you shut down the Time Machine.'], ['me', 'Then I’ll battle my way through.']],
      stages: [{ name: 'Professor AI', keys: ['professorai', 'professor', 'scientist'], team: ['Slither Wing', 'Scream Tail', 'Brute Bonnet', 'Flutter Mane', 'Roaring Moon'], style: 'switcher' }, { name: 'Koraidon', keys: [], team: ['Koraidon'], foeScale: .85, style: 'aggro', line: 'Koraidon roars — the ancient power of Area Zero!' }],
      win: [['me', 'The Time Machine is shutting down… Paldea is safe.']], lose: [['foe', 'Paradise will be protected.']] }
  };
  Object.assign(EVO, { Sprigatito: ['Floragato', 16], Floragato: ['Meowscarada', 36], Fuecoco: ['Crocalor', 16], Crocalor: ['Skeledirge', 36], Quaxly: ['Quaxwell', 16], Quaxwell: ['Quaquaval', 36],
    Lechonk: ['Oinkologne', 18], Tarountula: ['Spidops', 15], Nymble: ['Lokix', 24], Pawmi: ['Pawmo', 18], Pawmo: ['Pawmot', 32], Tandemaus: ['Maushold', 25], Fidough: ['Dachsbun', 26], Smoliv: ['Dolliv', 25],
    Dolliv: ['Arboliva', 35], Nacli: ['Naclstack', 24], Naclstack: ['Garganacl', 38], Charcadet: ['Armarouge', 30], Tadbulb: ['Bellibolt', 25], Wattrel: ['Kilowattrel', 25], Maschiff: ['Mabosstiff', 30],
    Shroodle: ['Grafaiai', 28], Bramblin: ['Brambleghast', 30], Toedscool: ['Toedscruel', 30], Capsakid: ['Scovillain', 30], Rellor: ['Rabsca', 30], Flittle: ['Espathra', 35], Tinkatink: ['Tinkatuff', 24],
    Tinkatuff: ['Tinkaton', 38], Wiglett: ['Wugtrio', 26], Finizen: ['Palafin', 38], Varoom: ['Revavroom', 40], Glimmet: ['Glimmora', 35], Greavard: ['Houndstone', 30], Cetoddle: ['Cetitan', 35],
    Frigibax: ['Arctibax', 35], Arctibax: ['Baxcalibur', 54], Gimmighoul: ['Gholdengo', 50], Poltchageist: ['Sinistcha', 30] });
  window.PALDEA = { gyms: GYMS_P, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_P, minors: MINORS_P, starters: ['Sprigatito', 'Fuecoco', 'Quaxly'],
    badges: ['pbug', 'pgrass', 'pelectric', 'pwater', 'pnormal', 'pghost', 'ppsychic', 'pice', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Pawmi', 'Rockruff', '*1'], ['Pawmo', 'Lycanroc', 'Goomy', '*1'], ['Pawmot', 'Lycanroc', 'Goodra', 'Orthworm', '*2']],
    rival: { file: 'Nemona', leader: 'Nemona' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter, rivalKey: 'rivalP', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { paldea: EV });
  const _saveS = saveStory;
  saveStory = function () { const s = STORY.save; if (s && !s.starter && !s.badges && (s.team || []).length && STARTER_TYPE[base(s.team[0])]) s.starter = base(s.team[0]); return _saveS.apply(this, arguments); };
  let offering = false;
  async function offerPaldea() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || s.phase !== 'galar' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Galar’s Champion too! A flight leaves for Paldea — an open world, the Great Crater, and the legends of past and future.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Fly to Paldea</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.galar = { badges: s.badges, at: Date.now() }; s.phase = 'paldea'; s.badges = 0; saveStory(); if (typeof syncRegion === 'function') syncRegion(); renderStory(); setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  const _open = openStoryScreen; openStoryScreen = function () { const r = _open.apply(this, arguments); setTimeout(offerPaldea, 952); return r; };
  /* ---------- post-game: Terapagos at the heart of Area Zero ---------- */
  let offeringT = false;
  async function offerTerapagos() {
    const s = STORY.save; if (offeringT || !s || STORY.region !== 'paldea' || s.badges < TOTAL || s.terapagos || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringT = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Paldea’s new Champion! Deep beneath Area Zero, a crystal cavern glows with Terastal energy — and something ancient is waking…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Descend into Area Zero</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await descendAreaZero();
    } finally { offeringT = false; STORY.cutscene = false; }
  }
  async function descendAreaZero() {
    const s = STORY.save, who = { file: 'Terapagos', leader: 'Terapagos' };
    closeModal();
    await playScene([['foe', 'TERAAAA…!'], ['me', 'Terapagos — the source of all Terastal power. Everyone, give it everything!']], who, { title: 'Area Zero Underdepths', text: 'Your whole team against Terapagos, the Tera Pokémon, in the crystal heart of the Great Crater.' });
    STORY.battle = { gym: 9, terapagos: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.9, aiStyle: 'switcher', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Terapagos'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Terapagos'], arena('cavern', 'hall')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.descendAreaZero = descendAreaZero;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.terapagos) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.terapagos = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Terapagos', 75); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['me', 'The crystal light is calming… Terapagos wants to come with us!']] : [['foe', 'TERAAAA…']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open2 = openStoryScreen; openStoryScreen = function () { const r = _open2.apply(this, arguments); setTimeout(offerTerapagos, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
})();
