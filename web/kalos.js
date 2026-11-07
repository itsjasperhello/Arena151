/* =====================================================================
   Section 44: KALOS — the sixth story region (registers with the region
   switch in johto.js; earlier regions are untouched)
   ===================================================================== */
(function kalosRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, $ = id => document.getElementById(id), arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  const GYMS_K = [
    G(1, 'k1', 'switcher', 'Viola', 'Viola', 'Santalune City', 'Bug', 'Bug Badge', arena('ruins', 'plaza'), ['Surskit', 'Scatterbug', 'Ledyba', 'Venipede', 'Dwebble', 'Vivillon'], [10, 11, 11, 12, 12, 13],
      'I’m Viola, the Gym Leader! I capture battles through my lens — let me see your best shot!', 'What a picture-perfect win!', 'You and your Pokémon make a lovely picture. Take the Bug Badge!'),
    G(2, 'k2', 'defensive', 'Grant', 'Grant', 'Cyllage City', 'Rock', 'Cliff Badge', arena('pewter', 'cavern'), ['Amaura', 'Tyrunt', 'Binacle', 'Roggenrola', 'Onix', 'Carbink'], [22, 23, 23, 24, 25, 26],
      'I’m Grant. Climbing walls teaches you to never give up. Let’s see if you can climb over me!', 'Keep climbing.', 'You reached the top. The Cliff Badge is yours.'),
    G(3, 'k3', 'aggro', 'Korrina', 'Korrina', 'Shalour City', 'Fighting', 'Rumble Badge', arena('summit', 'plaza'), ['Mienfoo', 'Machoke', 'Pancham', 'Hawlucha', 'Throh', 'Lucario'], [29, 30, 30, 31, 31, 32],
      'I’m Korrina, heir to the Tower of Mastery! Let’s go, Lucario — show them our power!', 'Ha! That’s Mega power!', 'Oh! I have been defeated! The Rumble Badge is yours!'),
    G(4, 'k4', 'status', 'Ramos', 'Ramos', 'Coumarine City', 'Grass', 'Plant Badge', arena('ruins', 'castle'), ['Jumpluff', 'Weepinbell', 'Skiddo', 'Phantump', 'Ferroseed', 'Gogoat'], [30, 31, 31, 32, 33, 34],
      'Hohoho! I’m Ramos. Plants teach patience — and my Grass Pokémon grow strong and tough!', 'Hohoho! Pruned!', 'You’ve grown strong! The Plant Badge is yours.'),
    G(5, 'k5', 'status', 'Clemont', 'Clemont', 'Lumiose City', 'Electric', 'Voltage Badge', arena('vermilion', 'plaza'), ['Emolga', 'Magneton', 'Dedenne', 'Pachirisu', 'Rotom', 'Heliolisk'], [35, 36, 36, 37, 37, 38],
      'The future is now — thanks to science! I’m Clemont, and my inventions and Electric Pokémon are ready!', 'Science wins again!', 'Your battle had a spark I couldn’t calculate. The Voltage Badge is yours.'),
    G(6, 'k6', 'switcher', 'Valerie', 'Valerie', 'Laverre City', 'Fairy', 'Fairy Badge', arena('grand', 'plaza'), ['Mawile', 'Mr. Mime', 'Aromatisse', 'Klefki', 'Granbull', 'Sylveon'], [38, 39, 39, 40, 41, 42],
      'Oh… welcome. I am Valerie. My Fairy Pokémon are delicate… but do not underestimate them.', 'How graceful.', 'That was a dream… The Fairy Badge is yours.'),
    G(7, 'k7', 'status', 'Olympia', 'Olympia', 'Anistar City', 'Psychic', 'Psychic Badge', arena('saffron', 'grand'), ['Sigilyph', 'Slowking', 'Meowstic', 'Espeon', 'Gothitelle', 'Malamar'], [44, 45, 45, 46, 47, 48],
      'A ritual to decide your fate… I am Olympia. The stars have foreseen this battle.', 'As the stars foretold.', 'Create your future. The Psychic Badge is yours.'),
    G(8, 'k8', 'defensive', 'Wulfric', 'Wulfric', 'Snowbelle City', 'Ice', 'Iceberg Badge', arena('cavern', 'ice'), ['Abomasnow', 'Cryogonal', 'Beartic', 'Aurorus', 'Froslass', 'Avalugg'], [48, 49, 49, 50, 51, 52],
      'Hey there! I’m Wulfric. Don’t let the cold get to you — this is going to be a blast!', 'Brr! Too cold for you!', 'Hahaha! Great battle! The Iceberg Badge is yours.'),
    G(9, 'k9', 'aggro', 'Drasna', 'Drasna', 'Pokémon League', 'Dragon', 'Elite Four', arena('summit', 'castle'), ['Dragalge', 'Druddigon', 'Altaria', 'Noivern', 'Kingdra', 'Goodra'], [55, 56, 56, 57, 57, 58],
      'Oh, dear me! A challenger! I’m Drasna of the Elite Four — my dragons are terribly strong, you know.', 'Oh my, that was fun!', 'Oh, dear me. You beat my dragons! The Champion awaits.'),
    G(10, 'k10', 'switcher', 'Diantha', 'Diantha', 'Pokémon League', 'Champion', 'Champion', arena('hall', 'grand'), ['Hawlucha', 'Tyrantrum', 'Aurorus', 'Gourgeist', 'Goodra', 'Gardevoir'], [60, 61, 61, 62, 62, 64],
      'I’m Diantha, Champion of Kalos. Witnessing the noble spirits of you and your Pokémon — I’m ready.', 'A lovely battle.', 'Witnessing your noble spirits… you are the Champion of Kalos!')
  ];
  GYMS_K[9].pickTeam = () => GYMS_K[9].team.slice();
  const MAP = { img: 'story/kalos_map.webp', w: 2576, h: 1438, home: { x: 1660, y: 1170, city: 'Vaniville Town' },
    gyms: { 1: [1630, 990], 2: [560, 820], 3: [440, 520], 4: [880, 400], 5: [1320, 500], 6: [1320, 160], 7: [2080, 560], 8: [1700, 390], 9: [2060, 790], 10: [2100, 740] },
    legs: [
      [[1660, 1170], [1645, 1080], [1630, 990]],
      [[1630, 990], [1500, 860], [1320, 640], [1100, 700], [900, 780], [700, 800], [560, 820]],
      [[560, 820], [520, 700], [480, 600], [440, 520]],
      [[440, 520], [560, 440], [720, 420], [880, 400]],
      [[880, 400], [1000, 450], [1150, 480], [1320, 500]],
      [[1320, 500], [1340, 350], [1330, 240], [1320, 160]],
      [[1320, 160], [1500, 220], [1700, 300], [1900, 420], [2080, 560]],
      [[2080, 560], [1950, 480], [1820, 420], [1700, 390]],
      [[1700, 390], [1850, 560], [1960, 700], [2060, 790]],
      [[2060, 790], [2100, 740]]
    ] };
  const NAMES = ['Vaniville → Aquacorde → Santalune City', 'Route 4 → Lumiose → Camphrier → Cyllage City', 'Route 10 → Geosenge → Reflection Cave → Shalour City', 'Route 12 → Azure Bay → Coumarine City',
    'Lumiose Badlands → Lumiose City', 'Route 14 → Laverre City', 'Routes 15 · 16 → Dendemille → Route 17 → Anistar City', 'Route 18 → Couriway → Snowbelle City',
    'Route 21 → Victory Road → Pokémon League', 'Pokémon League · the Champion’s room', 'Route 18 → Terminus Cave'];
  const ASH = [[2100, 740], [2200, 600], [2280, 480]];
  const ROUTES_K = [
    { leg: 0, name: 'Routes 1 · 2 · Santalune Forest', scene: 'meadow', mons: [['Bunnelby', 2, 4, 10], ['Fletchling', 2, 4, 10], ['Scatterbug', 2, 4, 8], ['Zigzagoon', 3, 5, 5], ['Pidgey', 3, 5, 5], ['Caterpie', 3, 4, 4], ['Weedle', 3, 4, 4], ['Pikachu', 4, 5, 1.5], ['Dunsparce', 4, 5, 2]] },
    { leg: 1, name: 'Routes 4 · 5 · 7 · Camphrier', scene: 'meadow', mons: [['Flabébé', 8, 10, 8], ['Litleo', 9, 11, 5], ['Skiddo', 9, 11, 6], ['Pancham', 9, 11, 5], ['Furfrou', 10, 12, 3], ['Ralts', 9, 11, 3], ['Espurr', 10, 12, 4], ['Honedge', 12, 12, .8], ['Doduo', 10, 12, 4]] },
    { leg: 2, name: 'Glittering Cave · Routes 10 · 11', scene: 'cave', mons: [['Onix', 16, 18, 5], ['Cubone', 16, 18, 5], ['Rhyhorn', 16, 18, 5], ['Machop', 16, 18, 5], ['Lunatone', 18, 18, 3], ['Solrock', 18, 18, 3], ['Hawlucha', 18, 18, 1.5], ['Sawk', 17, 19, 3], ['Throh', 17, 19, 3], ['Nosepass', 17, 19, 4], ['Kangaskhan', 20, 20, .5]] },
    { leg: 3, name: 'Route 12 · Azure Bay', scene: 'sea', mons: [['Tauros', 24, 26, 5], ['Miltank', 24, 26, 5], ['Slowpoke', 24, 26, 5], ['Wingull', 24, 26, 6], ['Tentacool', 24, 26, 6], ['Chinchou', 24, 26, 5], ['Mantyke', 24, 26, 4], ['Binacle', 24, 26, 5], ['Skrelp', 24, 26, 5], ['Clauncher', 24, 26, 5], ['Inkay', 24, 26, 4], ['Lapras', 30, 30, .4]] },
    { leg: 4, name: 'Lumiose Badlands · Route 13', scene: 'safari', mons: [['Trapinch', 28, 30, 7], ['Dugtrio', 28, 30, 5], ['Slugma', 28, 30, 5], ['Helioptile', 28, 30, 6], ['Sandile', 28, 30, 5], ['Gible', 30, 30, .8]] },
    { leg: 5, name: 'Route 14 · Laverre', scene: 'forest', mons: [['Haunter', 30, 32, 5], ['Skorupi', 30, 32, 5], ['Quagsire', 30, 32, 5], ['Bellsprout', 30, 32, 5], ['Karrablast', 30, 32, 4], ['Shelmet', 30, 32, 4], ['Carnivine', 30, 32, 3], ['Spritzee', 30, 32, 5], ['Swirlix', 30, 32, 5], ['Goomy', 32, 32, .8]] },
    { leg: 6, name: 'Routes 15 · 16 · 17 · Frost Cavern', scene: 'mountain', mons: [['Snover', 36, 38, 6], ['Bergmite', 36, 38, 6], ['Cryogonal', 38, 38, 2], ['Spheal', 36, 38, 5], ['Sneasel', 36, 38, 4], ['Phantump', 36, 38, 5], ['Pumpkaboo', 36, 38, 5], ['Foongus', 36, 38, 4], ['Klefki', 37, 39, 4], ['Murkrow', 36, 38, 4], ['Mamoswine', 40, 40, 1]] },
    { leg: 7, name: 'Routes 18 · 19 · 21 · Victory Road', scene: 'tower', mons: [['Noibat', 44, 46, 6], ['Zweilous', 44, 46, 3], ['Durant', 44, 46, 4], ['Heatmor', 44, 46, 4], ['Lickitung', 44, 46, 3], ['Druddigon', 45, 47, 3], ['Floatzel', 44, 46, 4], ['Graveler', 44, 46, 5], ['Gurdurr', 44, 46, 4], ['Tyrunt', 44, 44, .6], ['Amaura', 44, 44, .6],
      ['Xerneas', 55, 55, .02], ['Yveltal', 55, 55, .02], ['Zygarde', 55, 55, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at, unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_K = [
    T('k-youngster', 'Youngster Austin', ['youngster'], 'Route 2', [1700, 1080], 0, 1, arena('plaza'), [['Bunnelby', 5], ['Fletchling', 5], ['Zigzagoon', 6]], 'Santalune Forest is full of strong Pokémon — like mine!', 'Aww…', 'Yes!'),
    T('k-lass', 'Lass Anna', ['lass', 'picnicker'], 'Route 4', [1520, 880], 1, 2, arena('plaza'), [['Flabébé', 11], ['Skiddo', 11], ['Pancham', 12]], 'The flowers on Route 4 are perfect for a battle!', 'Petals everywhere…', 'Lovely!'),
    T('k-hiker', 'Hiker Bergin', ['hiker'], 'Glittering Cave', [600, 760], 2, 3, arena('cavern', 'meteor'), [['Onix', 20], ['Machop', 20], ['Rhyhorn', 21], ['Nosepass', 22]], 'This cave glitters with fossils — and fighters!', 'Cave-in!', 'Rock solid!'),
    T('k-swimmer', 'Swimmer Lucas', ['swimmer'], 'Azure Bay', [700, 430], 3, 4, arena('cerulean'), [['Wingull', 27], ['Binacle', 27], ['Clauncher', 28], ['Skrelp', 28]], 'Azure Bay is the best swim in Kalos!', 'Swept away!', 'Splash!'),
    T('k-scientist', 'Scientist Marcus', ['scientist'], 'Lumiose Badlands', [1060, 460], 4, 4, arena('vermilion'), [['Helioptile', 31], ['Magneton', 31], ['Klefki', 32], ['Rotom', 33]], 'My research on the Badlands’ electrical storms is nearly done!', 'Data lost…', 'Eureka!'),
    T('k-fairy', 'Fairy Tale Girl Lily', ['fairytalegirl', 'lass', 'beauty'], 'Route 14', [1335, 330], 5, 5, arena('grand'), [['Spritzee', 35], ['Swirlix', 35], ['Floette', 36], ['Dedenne', 36]], 'Once upon a time, a trainer battled me… and lost!', 'The end…', 'Happily ever after!'),
    T('k-skier', 'Skier Clyde', ['skier', 'boarder'], 'Route 17', [1800, 360], 6, 6, arena('cavern', 'ice'), [['Snover', 42], ['Bergmite', 42], ['Sneasel', 43], ['Mamoswine', 44]], 'Route 17 is buried in snow — perfect!', 'Wiped out!', 'Fresh powder!'),
    T('k-veteran', 'Veteran Lyra', ['veteran', 'cooltrainerfemale', 'cooltrainerf'], 'Victory Road', [1920, 660], 8, 7, arena('castle'), [['Noivern', 52], ['Aegislash', 52], ['Greninja', 53], ['Goodra', 54]], 'Victory Road is the final test before the League.', 'You’re ready.', 'Not yet.')
  ];
  Object.assign(D.RULES, {
    k1: { banA: ['Flying'], title: 'Sticky webs', text: 'Viola’s gym is strung with webs: your FLYING moves are banned.' },
    k2: { weather: 'sand', title: 'Climbing wall', text: 'Dust from the climbing wall: a permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    k3: { handicap: 4, title: 'Tower of Mastery', text: 'Korrina’s training rules: bring only your first FOUR Pokémon.' },
    k4: { weather: 'sun', title: 'Greenhouse sun', text: 'Permanent HARSH SUN: Fire moves 50% harder, Water moves 50% weaker.' },
    k5: { banA: ['Ground'], title: 'Insulated floor', text: 'Clemont’s invention grounds the gym: your GROUND moves are banned.' },
    k6: { banA: ['Steel', 'Poison'], title: 'Fairy grace', text: 'Valerie’s gym shields the fairies: your STEEL and POISON moves are banned.' },
    k7: { handicap: 5, title: 'The stars foretell', text: 'Olympia has foreseen your plans: bring only your first FIVE Pokémon.' },
    k8: { weather: 'hail', title: 'Snowbelle blizzard', text: 'Permanent HAIL chips every Pokémon that isn’t Ice.' },
    k9: { banA: ['Ice'], title: 'Dragon’s warmth', text: 'Drasna’s chamber is warmed by dragon breath: your ICE moves are banned.' }
  });
  Object.assign(D.SCRIPT.gym, {
    k1: [['foe', 'I’m Viola! Every battle is a photo opportunity — let’s make it a good one!'], ['me', 'Say cheese!']],
    k2: [['foe', 'I’m Grant. Every wall can be climbed with the right grip.'], ['me', 'Then let’s climb.']],
    k3: [['foe', 'I’m Korrina! Lucario and I are ready to roll!'], ['me', 'So am I!']],
    k4: [['foe', 'Hohoho! I’m Ramos. Let’s see if your Pokémon have strong roots!'], ['me', 'They do.']],
    k5: [['foe', 'Clemont here! My latest invention says I’ll win — let’s test the hypothesis!'], ['me', 'Let’s test it.']],
    k6: [['foe', 'Welcome… I am Valerie. My Fairy Pokémon are like a dream.'], ['me', 'Let’s battle.']],
    k7: [['foe', 'The stars have spoken. I am Olympia.'], ['me', 'Then let’s see what they said.']],
    k8: [['foe', 'I’m Wulfric! Let’s make this battle a blast!'], ['me', 'Bring the cold.']],
    k9: [['foe', 'Oh, dear me! A challenger! My dragons are ever so strong, you know.'], ['me', 'Let’s find out.']]
  });
  const CHAMP = { cocky: [['foe', 'I’m Diantha. As Champion, I want to see the noble spirits of you and your Pokémon.'], ['me', 'Let’s battle, Diantha.']] }; CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  const STARTER_TYPE = {};
  for (const [t, names] of Object.entries({
    grass: ['Chespin', 'Quilladin', 'Chesnaught', 'Snivy', 'Servine', 'Serperior', 'Turtwig', 'Grotle', 'Torterra', 'Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur'],
    fire: ['Fennekin', 'Braixen', 'Delphox', 'Tepig', 'Pignite', 'Emboar', 'Chimchar', 'Monferno', 'Infernape', 'Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard'],
    water: ['Froakie', 'Frogadier', 'Greninja', 'Oshawott', 'Dewott', 'Samurott', 'Piplup', 'Prinplup', 'Empoleon', 'Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise'] })) for (const n of names) STARTER_TYPE[n] = t;
  const base = n => String(n || '').split('|')[0];
  function starterType() { const s = STORY.save; if (!s) return 'grass';
    if (s.starter && STARTER_TYPE[base(s.starter)]) return STARTER_TYPE[base(s.starter)];
    for (const n of s.team || []) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    for (const n of Object.keys(s.dex || {})) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    return 'grass'; }
  const LINES = { grass: ['Chespin', 'Quilladin', 'Chesnaught'], fire: ['Fennekin', 'Braixen', 'Delphox'], water: ['Froakie', 'Frogadier', 'Greninja'] };
  const shaunaCounter = () => ({ grass: LINES.fire, fire: LINES.water, water: LINES.grass })[starterType()];
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'Hiya! It’s me, Shauna! Let’s have a battle — it’ll be super fun!'], ['me', 'Let’s go, Shauna!']], rattled: [['foe', 'I’ve been practicing! This time I’ll win for sure!']], bitter: [['foe', 'You’re so strong! But I’m not giving up!']] },
      { cocky: [['foe', 'Laverre is so pretty! Let’s battle before you take on the gym!']], rattled: [['foe', 'My Pokémon and I have grown so much!']], bitter: [['foe', 'Okay, okay, one more! I want to see how far we’ve come!']] },
      { cocky: [['foe', 'Victory Road! I came to cheer you on — after one last battle!']], rattled: [['foe', 'Before the League, let me give it everything!']], bitter: [['foe', 'Whatever happens… I’m so glad we went on this journey together!']] }
    ],
    win: { cocky: [['foe', 'Aww! You’re amazing!']], rattled: [['foe', 'Next time for sure!']], bitter: [['foe', 'Go be the Champion!']] },
    lose: { cocky: [['foe', 'Yay! I won!']], rattled: [['foe', 'All that practice paid off!']], bitter: [['foe', 'I won! …Now go win the League anyway!']] }
  };
  const EV = {
    1: { id: 'kglitter', title: 'Glittering Cave', arena: arena('cavern', 'meteor'), text: 'Team Flare is stealing fossils in Glittering Cave! Two Flare battles back to back — no healing between.',
      before: [['foe', 'Team Flare only cares about Team Flare! Out of our way!'], ['me', 'Those fossils aren’t yours!']],
      stages: [{ name: 'Flare Grunt', keys: ['flaregrunt', 'teamflaregrunt', 'flare'], team: ['Houndour', 'Croagunk', 'Scraggy'], style: 'aggro' }, { name: 'Flare Admin', keys: ['flareadmin', 'celosia', 'flaregrunt'], team: ['Golbat', 'Mightyena', 'Toxicroak'], style: 'switcher', line: 'You think you can get past a Team Flare Admin? How unstylish.' }],
      win: [['foe', 'How dreadful. Team Flare will remember this.']], lose: [['foe', 'Stylish and victorious — that’s Team Flare.']] },
    3: { id: 'klysandre', title: 'Lysandre Café', format: '1v1', name: 'Lysandre', keys: ['lysandre'], team: ['Pyroar'], style: 'aggro', arena: arena('grand', 'plaza'),
      text: 'Lysandre wants to see your strength: a 1v1 — your lead against his Pyroar.',
      before: [['foe', 'This world is going to be ugly soon. Only the chosen should remain.'], ['foe', 'Show me — are you one of the chosen?'], ['me', 'I’ll show you.']],
      win: [['foe', 'Impressive. Perhaps you are chosen after all.']], lose: [['foe', 'As I thought. Not one of the chosen.']] },
    4: { id: 'kpower', title: 'Power Plant puzzle', format: 'puzzle', name: 'Scientist', keys: ['scientist'], team: ['Klefki'], fixedTeam: ['Noibat', 'Swirlix', 'Skrelp', 'Litleo'], foeScale: 1.6, style: 'defensive', arena: arena('vermilion', 'plaza'),
      text: 'Puzzle battle: a Klefki locks the Lumiose Power Plant. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'Team Flare stole the power, and my Klefki locked the controls!'], ['foe', 'Use my Pokémon to break through — if you can work it out.'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Fire! Steel can’t stand the heat. Lumiose has power again!']], lose: [['foe', 'Dragon moves can’t touch a Fairy type… think again!']] },
    6: { id: 'khq', title: 'Team Flare Secret HQ', arena: arena('hall', 'castle'), text: 'Storm Team Flare’s Secret HQ under Lumiose! Two Flare battles back to back — no healing between.',
      before: [['foe', 'The ultimate weapon is nearly ready. You cannot stop it!'], ['me', 'Watch me.']],
      stages: [{ name: 'Flare Grunt', keys: ['flaregrunt', 'teamflaregrunt', 'flare'], team: ['Golbat', 'Manectric', 'Houndoom'], style: 'aggro' }, { name: 'Xerosic', keys: ['xerosic', 'flareadmin'], team: ['Crobat', 'Malamar', 'Klefki'], style: 'status', line: 'I am Xerosic, Team Flare’s scientist. Your interference ends here.' }],
      win: [['foe', 'It matters not. The weapon will fire.']], lose: [['foe', 'Beauty belongs to Team Flare!']] },
    7: { id: 'klysfinal', title: 'The ultimate weapon', arena: arena('hall', 'grand'), text: 'Lysandre has awakened Yveltal at the ultimate weapon! Lysandre, then Yveltal — back to back, no healing between.',
      before: [['foe', 'I will create a beautiful world. Only the chosen will remain.'], ['me', 'I won’t let you destroy Kalos!']],
      stages: [{ name: 'Lysandre', keys: ['lysandre'], team: ['Mienshao', 'Honchkrow', 'Pyroar', 'Gyarados'], style: 'switcher' }, { name: 'Yveltal', keys: [], team: ['Yveltal'], foeScale: .85, style: 'aggro', line: 'Yveltal spreads its wings — the sky turns crimson!' }],
      win: [['me', 'The weapon is stopped… Kalos is safe.']], lose: [['foe', 'The world will be beautiful — without you.']] }
  };
  Object.assign(EVO, { Chespin: ['Quilladin', 16], Quilladin: ['Chesnaught', 36], Fennekin: ['Braixen', 16], Braixen: ['Delphox', 36], Froakie: ['Frogadier', 16], Frogadier: ['Greninja', 36],
    Bunnelby: ['Diggersby', 20], Fletchling: ['Fletchinder', 17], Fletchinder: ['Talonflame', 35], Scatterbug: ['Spewpa', 9], Spewpa: ['Vivillon', 12], Litleo: ['Pyroar', 35], 'Flabébé': ['Floette', 19],
    Floette: ['Florges', 36], Skiddo: ['Gogoat', 32], Pancham: ['Pangoro', 32], Espurr: ['Meowstic', 25], Honedge: ['Doublade', 35], Doublade: ['Aegislash', 45], Spritzee: ['Aromatisse', 30],
    Swirlix: ['Slurpuff', 30], Inkay: ['Malamar', 30], Binacle: ['Barbaracle', 39], Skrelp: ['Dragalge', 48], Clauncher: ['Clawitzer', 37], Helioptile: ['Heliolisk', 30], Tyrunt: ['Tyrantrum', 39],
    Amaura: ['Aurorus', 39], Goomy: ['Sliggoo', 40], Sliggoo: ['Goodra', 50], Phantump: ['Trevenant', 30], Pumpkaboo: ['Gourgeist', 30], Bergmite: ['Avalugg', 37], Noibat: ['Noivern', 48] });
  window.KALOS = { gyms: GYMS_K, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_K, minors: MINORS_K, starters: ['Chespin', 'Fennekin', 'Froakie'],
    badges: ['ksbug', 'kscliff', 'ksrumble', 'ksplant', 'ksvoltage', 'ksfairy', 'kspsychic', 'ksiceberg', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Flabébé', 'Litleo', '*1'], ['Floette', 'Pyroar', 'Furfrou', '*1'], ['Florges', 'Pyroar', 'Furfrou', 'Gogoat', '*2']],
    rival: { file: 'Shauna', leader: 'Shauna' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter: shaunaCounter, rivalKey: 'rivalK', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { kalos: EV });
  const _saveS = saveStory;
  saveStory = function () { const s = STORY.save; if (s && !s.starter && !s.badges && (s.team || []).length && STARTER_TYPE[base(s.team[0])]) s.starter = base(s.team[0]); return _saveS.apply(this, arguments); };
  let offering = false;
  async function offerKalos() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || s.phase !== 'unova' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Unova’s Champion too! A flight leaves for Kalos — a land of beauty, Prism Tower, and the legends of life and destruction.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Fly to Kalos</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.unova = { badges: s.badges, at: Date.now() }; s.phase = 'kalos'; s.badges = 0; saveStory(); if (typeof syncRegion === 'function') syncRegion(); renderStory(); setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  const _open = openStoryScreen; openStoryScreen = function () { const r = _open.apply(this, arguments); setTimeout(offerKalos, 945); return r; };
  /* ---------- post-game: Zygarde in Terminus Cave ---------- */
  let offeringZ = false;
  async function offerZygarde() {
    const s = STORY.save; if (offeringZ || !s || STORY.region !== 'kalos' || s.badges < TOTAL || s.zygarde || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringZ = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Kalos’s Champion! Deep in Terminus Cave, something watches over the ecosystem of Kalos — and it has noticed you…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Enter Terminus Cave</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await enterTerminus();
    } finally { offeringZ = false; STORY.cutscene = false; }
  }
  async function enterTerminus() {
    const s = STORY.save, who = { file: 'Zygarde', leader: 'Zygarde' };
    closeModal();
    await playScene([['foe', 'ZYGAAAARRRD!'], ['me', 'Zygarde — the guardian of Kalos’s ecosystem. Everyone, together!']], who, { title: 'Terminus Cave', text: 'Your whole team against Zygarde, in a sandstorm stirred up by the order Pokémon itself.' });
    STORY.battle = { gym: 9, zygarde: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.8, aiStyle: 'defensive', weather: 'sand', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Zygarde'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Zygarde'], arena('cavern', 'meteor')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.enterTerminusCave = enterTerminus;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.zygarde) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.zygarde = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Zygarde', 75); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['me', 'Zygarde has calmed down… it’s choosing to come with us to protect Kalos together!']] : [['foe', 'ZYGAAARRRD!']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open2 = openStoryScreen; openStoryScreen = function () { const r = _open2.apply(this, arguments); setTimeout(offerZygarde, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
})();
