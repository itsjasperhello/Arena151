/* =====================================================================
   Section 48: GALAR — the eighth story region (Pokémon Sword's gym leaders),
   registered with the region switch in johto.js
   ===================================================================== */
(function galarRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, $ = id => document.getElementById(id), arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  const GYMS_G = [
    G(1, 'g1', 'defensive', 'Milo', 'Milo', 'Turffield', 'Grass', 'Grass Badge', arena('ruins', 'plaza'), ['Bounsweet', 'Applin', 'Budew', 'Cottonee', 'Seedot', 'Eldegoss'], [12, 13, 13, 14, 14, 15],
      'I’m Milo! My Grass Pokémon grow strong out here in the fields — let’s have a fun battle!', 'That was fun! Grow a little stronger.', 'You’re strong! Take the Grass Badge!'),
    G(2, 'g2', 'aggro', 'Nessa', 'Nessa', 'Hulbury', 'Water', 'Water Badge', arena('cerulean', 'hall'), ['Goldeen', 'Arrokuda', 'Wooper', 'Remoraid', 'Wingull', 'Drednaw'], [16, 17, 17, 18, 19, 20],
      'I’m Nessa! My Water Pokémon will sweep you away like the tide!', 'Washed away!', 'You’re pretty great! Here — the Water Badge.'),
    G(3, 'g3', 'aggro', 'Kabu', 'Kabu', 'Motostoke', 'Fire', 'Fire Badge', arena('cinnabar', 'meteor'), ['Vulpix', 'Growlithe', 'Rolycoly', 'Litwick', 'Torkoal', 'Centiskorch'], [20, 21, 22, 23, 24, 25],
      'I am Kabu. Many challengers have fallen to my flames — I train every day so I don’t fall behind.', 'Your flame burned out.', 'You have earned the Fire Badge. Keep going.'),
    G(4, 'g4', 'aggro', 'Bea', 'Bea', 'Stow-on-Side', 'Fighting', 'Fighting Badge', arena('summit', 'plaza'), ['Hitmontop', 'Pangoro', 'Sirfetch’d', 'Falinks', 'Grapploct', 'Machamp'], [30, 31, 31, 32, 33, 34],
      'I am Bea. My Fighting Pokémon and I have trained without rest. Show me your resolve!', 'Train harder.', 'Your strength is real. The Fighting Badge is yours.'),
    G(5, 'g5', 'status', 'Opal', 'Opal', 'Ballonlea', 'Fairy', 'Fairy Badge', arena('grand', 'ruins'), ['Weezing', 'Mawile', 'Togekiss', 'Alcremie', 'Granbull', 'Hatterene'], [34, 35, 35, 36, 37, 38],
      'I’m Opal. Let’s see if you have the pink to be my successor — quiz time, and battle time!', 'Not pink enough.', 'You have plenty of pink! Take the Fairy Badge.'),
    G(6, 'g6', 'defensive', 'Gordie', 'Gordie', 'Circhester', 'Rock', 'Rock Badge', arena('pewter', 'cavern'), ['Barbaracle', 'Shuckle', 'Stonjourner', 'Coalossal', 'Tyranitar', 'Golem'], [38, 39, 39, 40, 41, 42],
      'I’m Gordie. My Rock Pokémon are as hard as they come — think you can break through?', 'Rock solid.', 'You broke through. The Rock Badge is yours.'),
    G(7, 'g7', 'switcher', 'Piers', 'Piers', 'Spikemuth', 'Dark', 'Dark Badge', arena('meteor', 'plaza'), ['Scrafty', 'Malamar', 'Skuntank', 'Obstagoon', 'Thievul', 'Liepard'], [42, 43, 43, 44, 45, 46],
      'Spikemuth’s Gym Leader, Piers. No Dynamax here — just raw, real battling. Let’s rock.', 'Encore.', 'That’s the show. The Dark Badge is yours.'),
    G(8, 'g8', 'aggro', 'Raihan', 'Raihan', 'Hammerlocke', 'Dragon', 'Dragon Badge', arena('summit', 'castle'), ['Flygon', 'Gigalith', 'Sandaconda', 'Goodra', 'Turtonator', 'Duraludon'], [46, 47, 47, 48, 49, 50],
      'I’m Raihan, Leon’s greatest rival. Let’s see if you can weather my sandstorm!', 'Better luck next time!', 'You’re something else. The Dragon Badge is yours.'),
    G(9, 'g9', 'switcher', 'Marnie', 'Marnie', 'Wyndon Stadium', 'Dark', 'Champion Cup', arena('hall', 'grand'), ['Toxicroak', 'Morpeko', 'Mandibuzz', 'Drapion', 'Weavile', 'Grimmsnarl'], [52, 53, 53, 54, 55, 56],
      'The Champion Cup final. I came all this way for Spikemuth — I’m not holdin’ back.', 'Spikemuth’s pride, yeah?', 'You earned it. Go on — Leon’s waitin’.'),
    G(10, 'g10', 'switcher', 'Leon', 'Leon', 'Wyndon Stadium', 'Champion', 'Champion', arena('hall', 'grand'), ['Aegislash', 'Dragapult', 'Haxorus', 'Seismitoad', 'Charizard', 'Rillaboom'], [58, 59, 59, 60, 60, 65],
      'I’m Leon, the undefeated Champion! Let’s have a champion time!', 'Champion time, as always!', 'That was the best champion time ever. You’re the new Champion of Galar!')
  ];
  const STARTER_TYPE = {};
  for (const [t, names] of Object.entries({
    grass: ['Grookey', 'Thwackey', 'Rillaboom', 'Rowlet', 'Dartrix', 'Decidueye', 'Chespin', 'Quilladin', 'Chesnaught', 'Snivy', 'Servine', 'Serperior', 'Turtwig', 'Grotle', 'Torterra', 'Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur'],
    fire: ['Scorbunny', 'Raboot', 'Cinderace', 'Litten', 'Torracat', 'Incineroar', 'Fennekin', 'Braixen', 'Delphox', 'Tepig', 'Pignite', 'Emboar', 'Chimchar', 'Monferno', 'Infernape', 'Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard'],
    water: ['Sobble', 'Drizzile', 'Inteleon', 'Popplio', 'Brionne', 'Primarina', 'Froakie', 'Frogadier', 'Greninja', 'Oshawott', 'Dewott', 'Samurott', 'Piplup', 'Prinplup', 'Empoleon', 'Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise'] })) for (const n of names) STARTER_TYPE[n] = t;
  const base = n => String(n || '').split('|')[0];
  function starterType() { const s = STORY.save; if (!s) return 'grass';
    if (s.starter && STARTER_TYPE[base(s.starter)]) return STARTER_TYPE[base(s.starter)];
    for (const n of s.team || []) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    for (const n of Object.keys(s.dex || {})) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    return 'grass'; }
  const LINES = { grass: ['Grookey', 'Thwackey', 'Rillaboom'], fire: ['Scorbunny', 'Raboot', 'Cinderace'], water: ['Sobble', 'Drizzile', 'Inteleon'] };
  const counter = () => ({ grass: LINES.fire, fire: LINES.water, water: LINES.grass })[starterType()];
  GYMS_G[9].pickTeam = () => ['Aegislash', 'Dragapult', 'Haxorus', 'Seismitoad', 'Charizard', counter()[2]];   // Leon’s starter beats yours
  const MAP = { img: 'story/galar_map.webp', w: 1728, h: 2442, home: { x: 880, y: 2200, city: 'Postwick' },
    gyms: { 1: [360, 1040], 2: [1100, 1080], 3: [740, 1280], 4: [500, 860], 5: [600, 680], 6: [1200, 740], 7: [1300, 900], 8: [860, 840], 9: [860, 380], 10: [900, 300] },
    legs: [
      [[880, 2200], [880, 2080], [800, 1800], [760, 1520], [740, 1300], [600, 1200], [460, 1120], [360, 1040]],
      [[360, 1040], [560, 1000], [800, 1050], [1000, 1080], [1100, 1080]],
      [[1100, 1080], [960, 1200], [740, 1280]],
      [[740, 1280], [820, 1100], [860, 900], [700, 880], [500, 860]],
      [[500, 860], [560, 760], [600, 680]],
      [[600, 680], [760, 760], [860, 840], [1000, 800], [1200, 740]],
      [[1200, 740], [1280, 820], [1300, 900]],
      [[1300, 900], [1100, 880], [860, 840]],
      [[860, 840], [860, 700], [860, 560], [860, 380]],
      [[860, 380], [900, 300]]
    ] };
  const NAMES = ['Postwick → Wedgehurst → Wild Area → Motostoke → Galar Mine → Turffield', 'Route 5 → Hulbury', 'Galar Mine No. 2 → Motostoke', 'Wild Area → Hammerlocke → Route 6 → Stow-on-Side',
    'Glimwood Tangle → Ballonlea', 'Hammerlocke → Routes 7 · 8 → Circhester', 'Route 9 → Spikemuth', 'Route 9 → Hammerlocke', 'Route 10 → Wyndon', 'Wyndon Stadium · the Champion Cup final', 'Slumbering Weald'];
  const ASH = [[900, 300], [860, 800], [700, 1700], [500, 1950]];
  const ROUTES_G = [
    { leg: 0, name: 'Routes 1 · 2 · Wild Area (south)', scene: 'meadow', mons: [['Skwovet', 2, 4, 10], ['Rookidee', 2, 4, 10], ['Wooloo', 3, 5, 8], ['Nickit', 3, 5, 6], ['Blipbug', 3, 5, 6], ['Gossifleur', 4, 6, 5], ['Chewtle', 4, 6, 4], ['Yamper', 4, 6, 4], ['Rolycoly', 5, 6, 3]] },
    { leg: 1, name: 'Route 5 · Bridge Field', scene: 'meadow', mons: [['Applin', 12, 14, 5], ['Toxel', 12, 13, 2], ['Hatenna', 12, 14, 3], ['Impidimp', 12, 14, 3], ['Skwovet', 12, 14, 6], ['Dottler', 13, 15, 4], ['Corvisquire', 14, 16, 3], ['Drednaw', 16, 16, 1]] },
    { leg: 2, name: 'Galar Mine No. 2 · Dappled Grove', scene: 'cave', mons: [['Chewtle', 16, 18, 6], ['Shellos', 16, 18, 5], ['Croagunk', 16, 18, 5], ['Binacle', 16, 18, 5], ['Rolycoly', 16, 18, 6], ['Carkol', 18, 20, 3], ['Pincurchin', 18, 18, 2]] },
    { leg: 3, name: 'Route 6 · Stow-on-Side desert', scene: 'safari', mons: [['Silicobra', 22, 24, 7], ['Sandaconda', 26, 26, 1], ['Hippopotas', 22, 24, 5], ['Duskull', 22, 24, 4], ['Torkoal', 23, 25, 4], ['Hawlucha', 24, 24, 1.5], ['Durant', 23, 25, 4], ['Heatmor', 23, 25, 4]] },
    { leg: 4, name: 'Glimwood Tangle', scene: 'forest', mons: [['Impidimp', 28, 30, 6], ['Hatenna', 28, 30, 6], ['Morelull', 28, 30, 6], ['Shiinotic', 30, 32, 3], ['Ponyta', 28, 30, 4], ['Indeedee', 30, 30, 2], ['Spritzee', 28, 30, 4], ['Swirlix', 28, 30, 4]] },
    { leg: 5, name: 'Routes 7 · 8 · Circhester', scene: 'mountain', mons: [['Snom', 32, 34, 6], ['Eiscue', 34, 34, 2], ['Vanillish', 32, 34, 5], ['Cubchoo', 32, 34, 5], ['Sneasel', 32, 34, 4], ['Falinks', 34, 34, 2], ['Sirfetch’d', 36, 36, .8], ['Stonjourner', 34, 34, 2]] },
    { leg: 6, name: 'Route 9 · Circhester Bay', scene: 'sea', mons: [['Arrokuda', 36, 38, 6], ['Barraskewda', 40, 40, 1.5], ['Cramorant', 36, 38, 4], ['Pincurchin', 36, 38, 4], ['Mantine', 36, 38, 4], ['Wailmer', 36, 38, 5], ['Lapras', 40, 40, .8], ['Frosmoth', 40, 40, 1]] },
    { leg: 7, name: 'Wild Area (north) · Lake of Outrage', scene: 'tower', mons: [['Dreepy', 40, 40, .8], ['Cufant', 40, 42, 4], ['Duraludon', 42, 42, 1], ['Toxtricity', 42, 42, 1], ['Hatterene', 42, 42, 1], ['Grimmsnarl', 42, 42, 1], ['Copperajah', 42, 42, 1], ['Dragapult', 50, 50, .3],
      ['Zacian', 60, 60, .02], ['Zamazenta', 60, 60, .02], ['Eternatus', 65, 65, .02], ['Regieleki', 55, 55, .02], ['Regidrago', 55, 55, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at, unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_G = [
    T('g-youngster', 'Youngster Dan', ['youngster'], 'Route 2', [860, 1950], 0, 1, arena('plaza'), [['Skwovet', 6], ['Rookidee', 6], ['Wooloo', 7]], 'You’re going to the Gym Challenge too? Battle!', 'Good luck!', 'Yes!'),
    T('g-camper', 'Camper Jim', ['camper', 'hiker'], 'Wild Area', [820, 1560], 0, 2, arena('ruins'), [['Nickit', 10], ['Yamper', 10], ['Chewtle', 11]], 'Camping in the Wild Area is the best!', 'Camp’s over…', 'Curry time!'),
    T('g-worker', 'Worker Bob', ['worker', 'hiker'], 'Galar Mine', [560, 1180], 1, 3, arena('cavern', 'meteor'), [['Rolycoly', 14], ['Roggenrola', 14], ['Carkol', 15], ['Diglett', 15]], 'The mine’s dangerous — and so am I!', 'Cave-in!', 'Back to work!'),
    T('g-yell', 'Team Yell Grunt', ['yellgrunt', 'teamyellgrunt', 'teamyell'], 'Route 5', [700, 1030], 1, 3, arena('plaza'), [['Zigzagoon', 16], ['Nickit', 16], ['Scraggy', 17]], 'Hey! Team Yell says you can’t go this way!', 'Marnie’s gonna be mad…', 'Yeah! Go Marnie!'),
    T('g-backpacker', 'Backpacker Ann', ['backpacker', 'picnicker'], 'Route 6', [640, 880], 3, 4, arena('oasis', 'cavern'), [['Silicobra', 28], ['Hippopotas', 28], ['Torkoal', 29], ['Hawlucha', 30]], 'The desert by Stow-on-Side is full of surprises!', 'Sunstroke…', 'Desert victory!'),
    T('g-fairy', 'Madame Rosa', ['beauty', 'lass', 'fairytalegirl'], 'Glimwood Tangle', [560, 740], 4, 5, arena('grand'), [['Morgrem', 34], ['Shiinotic', 34], ['Hattrem', 35], ['Spritzee', 35]], 'The glowing mushrooms of Glimwood are enchanting, aren’t they?', 'How enchanting…', 'Pink power!'),
    T('g-skier', 'Skier Lin', ['skier', 'boarder'], 'Route 8', [1080, 780], 5, 6, arena('cavern', 'ice'), [['Snom', 38], ['Eiscue', 38], ['Vanilluxe', 39], ['Frosmoth', 40]], 'Circhester’s slopes are perfect today!', 'Wiped out!', 'Fresh powder!'),
    T('g-veteran', 'Veteran Tom', ['veteran', 'cooltrainermale', 'cooltrainerm'], 'Route 10', [860, 520], 8, 7, arena('castle'), [['Dragapult', 50], ['Corviknight', 50], ['Toxtricity', 51], ['Grimmsnarl', 52]], 'Route 10 is the last stop before Wyndon.', 'You’re ready.', 'Not yet.')
  ];
  Object.assign(D.RULES, {
    g1: { banA: ['Fire'], title: 'Turffield fields', text: 'Milo’s fields must not burn: your FIRE moves are banned.' },
    g2: { weather: 'rain', title: 'Hulbury tide', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    g3: { weather: 'sun', title: 'Kabu’s heat', text: 'Permanent HARSH SUN: Fire moves 50% harder, Water moves 50% weaker.' },
    g4: { handicap: 4, title: 'Bea’s discipline', text: 'Bea trains without rest: bring only your first FOUR Pokémon.' },
    g5: { banA: ['Steel'], title: 'Opal’s pink', text: 'Opal’s gym repels the fairies’ weaknesses: your STEEL moves are banned.' },
    g6: { banA: ['Grass'], title: 'Frozen stone', text: 'Nothing grows in Gordie’s icy gym: your GRASS moves are banned.' },
    g7: { banA: ['Fairy'], title: 'Spikemuth show', text: 'No sparkle in Spikemuth: your FAIRY moves are banned.' },
    g8: { weather: 'sand', title: 'Raihan’s sandstorm', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    g9: { handicap: 4, title: 'Champion Cup rules', text: 'The Champion Cup final: bring only your first FOUR Pokémon.' }
  });
  Object.assign(D.SCRIPT.gym, {
    g1: [['foe', 'Welcome to the Turffield Stadium! Let’s grow a great battle!'], ['me', 'Let’s go!']],
    g2: [['foe', 'The tide’s coming in! Ready to get swept away?'], ['me', 'Bring the wave.']],
    g3: [['foe', 'I have been waiting for you. Let us battle with all our heat.'], ['me', 'I’m ready, Kabu.']],
    g4: [['foe', 'Strength is earned through endless training. Show me yours.'], ['me', 'Here it is.']],
    g5: [['foe', 'Quiz time! …Ah, never mind. Just battle me, dearie.'], ['me', 'Gladly.']],
    g6: [['foe', 'My Rock Pokémon don’t crack under pressure. Do yours?'], ['me', 'Let’s find out.']],
    g7: [['foe', 'Spikemuth. No Dynamax, no lights. Just us.'], ['me', 'Let’s rock.']],
    g8: [['foe', 'Let’s weather this storm together — and see who stands at the end!'], ['me', 'Bring the storm!']],
    g9: [['foe', 'The Champion Cup final… for Spikemuth.'], ['me', 'Let’s go, Marnie.']]
  });
  const CHAMP = { cocky: [['foe', 'The undefeated Champion, Leon! Let’s make this the best match Galar has ever seen!'], ['me', 'Let’s have a champion time!']] }; CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'Hey! It’s me, Hop — Leon’s little brother! Let’s battle so I can show how strong I am!'], ['me', 'Let’s go, Hop!']], rattled: [['foe', 'I’ve been training hard! This time I’ll win!']], bitter: [['foe', 'Man, you’re good. But I’m not giving up!']] },
      { cocky: [['foe', 'Circhester! Let’s battle before the Gym!']], rattled: [['foe', 'My team’s way stronger now!']], bitter: [['foe', 'I keep losing… maybe I need to find my own way.']] },
      { cocky: [['foe', 'The Champion Cup! Let’s see who’s really the best!']], rattled: [['foe', 'This is it — everything I’ve got!']], bitter: [['foe', 'Whatever happens, I’m proud of how far we’ve come!']] }
    ],
    win: { cocky: [['foe', 'Aww! You’re brilliant!']], rattled: [['foe', 'Next time for sure!']], bitter: [['foe', 'Go beat my brother!']] },
    lose: { cocky: [['foe', 'Yeah! Champion time!']], rattled: [['foe', 'All that training paid off!']], bitter: [['foe', 'I won! …Now go show Lee what you’ve got!']] }
  };
  const EV = {
    1: { id: 'gyell', title: 'Team Yell', arena: arena('plaza'), text: 'Team Yell is blocking the road to Hulbury! Two Yell battles back to back — no healing between.',
      before: [['foe', 'Team Yell is here to cheer for Marnie — and stop everyone else!'], ['me', 'Out of the way!']],
      stages: [{ name: 'Team Yell Grunt', keys: ['yellgrunt', 'teamyellgrunt', 'teamyell'], team: ['Zigzagoon', 'Nickit', 'Scraggy'], style: 'aggro' }, { name: 'Team Yell Grunt', keys: ['yellgrunt', 'teamyellgrunt', 'teamyell'], team: ['Purrloin', 'Croagunk', 'Morgrem'], style: 'switcher', line: 'You think you can beat Team Yell?!' }],
      win: [['foe', 'Ugh! Marnie’s gonna be so mad…']], lose: [['foe', 'Yeah! Go Marnie!']] },
    3: { id: 'gbede', title: 'Bede’s challenge', format: '1v1', name: 'Bede', keys: ['bede'], team: ['Hattrem'], style: 'status', arena: arena('grand', 'plaza'),
      text: 'Bede, the Chairman’s chosen challenger, wants a 1v1: your lead against his Hattrem.',
      before: [['foe', 'Chairman Rose endorsed me personally. You’re nothing but an obstacle.'], ['me', 'Then get past me.']],
      win: [['foe', 'This… this isn’t over.']], lose: [['foe', 'As expected of the Chairman’s chosen.']] },
    4: { id: 'gwild', title: 'Wild Area puzzle', format: 'puzzle', name: 'Ace Trainer', keys: ['cooltrainermale', 'cooltrainerm', 'acetrainerm'], team: ['Copperajah'], fixedTeam: ['Alcremie', 'Eldegoss', 'Frosmoth', 'Sandaconda'], foeScale: 1.6, style: 'defensive', arena: arena('oasis', 'summit'),
      text: 'Puzzle battle: a Copperajah blocks the path through the Wild Area. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'My Copperajah has never moved from this spot!'], ['foe', 'Here, use these Pokémon. Think it through…'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Ground! Steel can’t stand it. Nicely solved!']], lose: [['foe', 'Fairy, Grass, Ice — all resisted by Steel. Think again!']] },
    6: { id: 'grosetower', title: 'Rose Tower', arena: arena('hall', 'castle'), text: 'Something is wrong at Rose Tower! A Macro Cosmos employee, then Oleana — back to back, no healing between.',
      before: [['foe', 'The Chairman is very busy. You will not disturb him.'], ['me', 'Then I’ll go through you.']],
      stages: [{ name: 'Macro Cosmos Employee', keys: ['macrocosmos', 'worker', 'scientist'], team: ['Klang', 'Ferroseed', 'Cufant'], style: 'defensive' }, { name: 'Oleana', keys: ['oleana'], team: ['Froslass', 'Salazzle', 'Garbodor', 'Tsareena'], style: 'status', line: 'I am Oleana, the Chairman’s secretary. You are a nuisance.' }],
      win: [['foe', 'The Chairman’s plan will proceed regardless.']], lose: [['foe', 'Know your place.']] },
    7: { id: 'gdarknight', title: 'The Darkest Day', arena: arena('hall', 'grand'), text: 'Chairman Rose has awakened Eternatus! Rose, then Eternatus — back to back, no healing between.',
      before: [['foe', 'Galar’s energy will last a thousand years — and Eternatus is the key!'], ['me', 'You’re putting everyone in danger!']],
      stages: [{ name: 'Chairman Rose', keys: ['rose', 'chairmanrose'], team: ['Copperajah', 'Ferrothorn', 'Perrserker', 'Klinklang', 'Escavalier'], style: 'switcher' }, { name: 'Eternatus', keys: [], team: ['Eternatus'], foeScale: .85, style: 'aggro', line: 'Eternatus erupts with Dynamax energy!' }],
      win: [['me', 'Eternatus has calmed down… the Darkest Day is over.']], lose: [['foe', 'The future of Galar demands sacrifice!']] }
  };
  Object.assign(EVO, { Grookey: ['Thwackey', 16], Thwackey: ['Rillaboom', 35], Scorbunny: ['Raboot', 16], Raboot: ['Cinderace', 35], Sobble: ['Drizzile', 16], Drizzile: ['Inteleon', 35],
    Skwovet: ['Greedent', 24], Rookidee: ['Corvisquire', 18], Corvisquire: ['Corviknight', 38], Blipbug: ['Dottler', 10], Dottler: ['Orbeetle', 30], Nickit: ['Thievul', 18], Gossifleur: ['Eldegoss', 20],
    Wooloo: ['Dubwool', 24], Chewtle: ['Drednaw', 22], Yamper: ['Boltund', 25], Rolycoly: ['Carkol', 18], Carkol: ['Coalossal', 34], Applin: ['Flapple', 25], Silicobra: ['Sandaconda', 36], Arrokuda: ['Barraskewda', 26],
    Toxel: ['Toxtricity', 30], Sizzlipede: ['Centiskorch', 28], Clobbopus: ['Grapploct', 35], Sinistea: ['Polteageist', 30], Hatenna: ['Hattrem', 32], Hattrem: ['Hatterene', 42], Impidimp: ['Morgrem', 32],
    Morgrem: ['Grimmsnarl', 42], Milcery: ['Alcremie', 30], Snom: ['Frosmoth', 30], Cufant: ['Copperajah', 34], Dreepy: ['Drakloak', 50], Drakloak: ['Dragapult', 60], Kubfu: ['Urshifu', 40] });
  window.GALAR = { gyms: GYMS_G, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_G, minors: MINORS_G, starters: ['Grookey', 'Scorbunny', 'Sobble'],
    badges: ['gbgrass', 'gbwater', 'gbfire', 'gbfighting', 'gbfairy', 'gbrock', 'gbdark', 'gbdragon', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Wooloo', 'Rookidee', '*1'], ['Dubwool', 'Corvisquire', 'Snorlax', '*1'], ['Dubwool', 'Corviknight', 'Snorlax', 'Pincurchin', '*2']],
    rival: { file: 'Hop', leader: 'Hop' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter, rivalKey: 'rivalG', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { galar: EV });
  const _saveS = saveStory;
  saveStory = function () { const s = STORY.save; if (s && !s.starter && !s.badges && (s.team || []).length && STARTER_TYPE[base(s.team[0])]) s.starter = base(s.team[0]); return _saveS.apply(this, arguments); };
  let offering = false;
  async function offerGalar() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || s.phase !== 'alola' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Alola’s Champion too! A flight leaves for Galar — stadiums, the Gym Challenge, and the legends of the sword and shield.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Fly to Galar</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.alola = { badges: s.badges, at: Date.now() }; s.phase = 'galar'; s.badges = 0; saveStory(); if (typeof syncRegion === 'function') syncRegion(); renderStory(); setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  const _open = openStoryScreen; openStoryScreen = function () { const r = _open.apply(this, arguments); setTimeout(offerGalar, 950); return r; };
  /* ---------- post-game: Calyrex in the Crown Tundra ---------- */
  let offeringC = false;
  async function offerCalyrex() {
    const s = STORY.save; if (offeringC || !s || STORY.region !== 'galar' || s.badges < TOTAL || s.calyrex || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringC = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Galar’s new Champion! A train leaves for the snowy Crown Tundra, where an ancient king is said to rule the harvest…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Travel to the Crown Tundra</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await crownTundra();
    } finally { offeringC = false; STORY.cutscene = false; }
  }
  async function crownTundra() {
    const s = STORY.save, who = { file: 'Calyrex', leader: 'Calyrex' };
    closeModal();
    await playScene([['foe', 'I am Calyrex, King of Bountiful Harvests. Show me your worth, trainer.'], ['me', 'A Pokémon that speaks… Everyone, together!']], who, { title: 'Crown Tundra', text: 'Your whole team against Calyrex, the ancient king, in the snows of the Crown Tundra — permanent HAIL.' });
    STORY.battle = { gym: 9, calyrex: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.8, aiStyle: 'status', weather: 'hail', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Calyrex'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Calyrex'], arena('cavern', 'ice')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.travelCrownTundra = crownTundra;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.calyrex) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.calyrex = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Calyrex', 75); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['foe', 'You have proven yourself. I shall travel with you.']] : [['foe', 'Return when your bonds are stronger.']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open2 = openStoryScreen; openStoryScreen = function () { const r = _open2.apply(this, arguments); setTimeout(offerCalyrex, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
})();
