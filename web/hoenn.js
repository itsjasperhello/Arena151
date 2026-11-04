/* =====================================================================
   Section 38: HOENN — the third story region (registers with the region
   switch in johto.js; Kanto and Johto are untouched)
   ===================================================================== */
(function hoennRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  const GYMS_H = [
    G(1, 'h1', 'defensive', 'Roxanne', 'Roxanne', 'Rustboro City', 'Rock', 'Stone Badge', arena('pewter', 'cavern'), ['Geodude', 'Aron', 'Lileep', 'Anorith', 'Omanyte', 'Nosepass'], [12, 13, 13, 14, 14, 15],
      'I became a Gym Leader so I could put what I learned at the Trainers’ School into practice. Shall we?', 'Study harder, and come back.', 'So I lost… I see I still have much to learn. Take the Stone Badge.'),
    G(2, 'h2', 'aggro', 'Brawly', 'Brawly', 'Dewford Town', 'Fighting', 'Knuckle Badge', arena('cerulean', 'summit'), ['Machop', 'Mankey', 'Meditite', 'Tyrogue', 'Makuhita', 'Heracross'], [15, 16, 16, 17, 18, 19],
      'I’m Brawly! I got swallowed by the big wave of fighting! Let’s see if you can ride it!', 'Wipeout! Better luck next swell.', 'Whoa, wow! You made a much bigger splash than I expected! The Knuckle Badge is yours.'),
    G(3, 'h3', 'status', 'Wattson', 'Wattson', 'Mauville City', 'Electric', 'Dynamo Badge', arena('vermilion', 'castle'), ['Voltorb', 'Pikachu', 'Plusle', 'Minun', 'Magneton', 'Manectric'], [20, 21, 21, 22, 23, 24],
      'Wahahahah! I’ve given up on trying to make Mauville modern. Now I just battle! Bring it on!', 'Wahahah! Shocking, isn’t it?', 'Wahahahah! Fine, I lost! You win the Dynamo Badge!'),
    G(4, 'h4', 'aggro', 'Flannery', 'Flannery', 'Lavaridge Town', 'Fire', 'Heat Badge', arena('cinnabar', 'meteor'), ['Slugma', 'Growlithe', 'Vulpix', 'Ponyta', 'Camerupt', 'Torkoal'], [24, 25, 25, 26, 27, 29],
      'I’m the Gym Leader of Lavaridge — Flannery! My Fire Pokémon will scorch you with the heat of Mt. Chimney!', 'Too hot to handle, huh?', 'Oh… I guess I was trying too hard. Take the Heat Badge.'),
    G(5, 'h5', 'aggro', 'Norman', 'Norman', 'Petalburg City', 'Normal', 'Balance Badge', arena('plaza', 'grand'), ['Spinda', 'Linoone', 'Kecleon', 'Zangoose', 'Tauros', 'Slaking'], [27, 28, 28, 29, 30, 31],
      'So you’ve come this far. As a Gym Leader, I won’t hold back — not even for family.', 'You still have a way to go.', '…I lost. You’ve grown strong. The Balance Badge is yours.'),
    G(6, 'h6', 'switcher', 'Winona', 'Winona', 'Fortree City', 'Flying', 'Feather Badge', arena('castle', 'summit'), ['Swellow', 'Pelipper', 'Tropius', 'Skarmory', 'Xatu', 'Altaria'], [30, 31, 31, 32, 33, 34],
      'I have become one with bird Pokémon and have soared the skies. Witness the elegant choreography of my bird Pokémon!', 'Grace and power. Remember them.', 'Never before have I seen a trainer command Pokémon with more grace than I. The Feather Badge is yours.'),
    G(7, 'h7', 'status', 'Tate & Liza', 'Tate_and_Liza', 'Mossdeep City', 'Psychic', 'Mind Badge', arena('saffron', 'grand'), ['Grumpig', 'Claydol', 'Gardevoir', 'Medicham', 'Lunatone', 'Solrock'], [41, 42, 42, 43, 43, 44],
      'Hehehe… were you surprised? There are two Gym Leaders! We can read each other’s minds — can you keep up?', 'Our combination was perfect!', 'Looks like the bond between you and your Pokémon is stronger than ours. Take the Mind Badge.'),
    G(8, 'h8', 'defensive', 'Wallace', 'Wallace', 'Sootopolis City', 'Water', 'Rain Badge', arena('cerulean', 'hall'), ['Luvdisc', 'Whiscash', 'Walrein', 'Seaking', 'Ludicolo', 'Milotic'], [40, 42, 43, 43, 44, 46],
      'The elegance with which you saved Sootopolis… let me see it again, in battle with my Water Pokémon.', 'Elegance takes practice.', 'I realize now your authenticity and magnificence as a trainer. The Rain Badge is yours.'),
    G(9, 'h9', 'aggro', 'Drake', 'Drake', 'Ever Grande City', 'Dragon', 'Elite Four', arena('summit', 'castle'), ['Charizard', 'Altaria', 'Flygon', 'Kingdra', 'Dragonite', 'Salamence'], [50, 51, 52, 52, 53, 55],
      'I am the last of the Elite Four, Drake the Dragon master! What does a trainer need most? Do you know?', 'You lack virtue. Come back stronger.', 'Superb, it should be said. You deserve every credit. Go — the Champion awaits.'),
    G(10, 'h10', 'switcher', 'Steven', 'Steven', 'Ever Grande City', 'Steel', 'Champion', arena('hall', 'grand'), ['Skarmory', 'Claydol', 'Aggron', 'Cradily', 'Armaldo', 'Metagross'], [57, 57, 58, 59, 59, 62],
      'Welcome. I am Steven, the Champion of the Hoenn League. I wanted to see how far you’d come. Let’s battle.', 'You were strong — but not yet strong enough.', 'I, the Champion, fall in defeat… Kudos to you. You are truly a noble Pokémon trainer.')
  ];
  GYMS_H[9].pickTeam = () => GYMS_H[9].team.slice();   // Champion Steven brings his own team (not Kanto’s rival logic)
  /* ---------- the Hoenn map (story/hoenn_map.webp, 2576×1438) ---------- */
  const MAP = { img: 'story/hoenn_map.webp', w: 2576, h: 1438, home: { x: 940, y: 910, city: 'Littleroot Town' },
    gyms: { 1: [530, 660], 2: [820, 1160], 3: [960, 550], 4: [880, 300], 5: [740, 880], 6: [1160, 260], 7: [2000, 360], 8: [1790, 640], 9: [2130, 640], 10: [2160, 555] },
    legs: [
      [[940, 910], [960, 820], [860, 840], [740, 880], [640, 800], [560, 720], [530, 660]],                 // Routes 101 · 102 → Petalburg → Petalburg Woods → Rustboro
      [[530, 660], [560, 760], [620, 900], [700, 1040], [820, 1160]],                                        // Mr. Briney’s boat: Routes 104 · 105 · 106
      [[820, 1160], [900, 1120], [960, 1040], [980, 900], [975, 750], [960, 550]],                           // Route 109 → Slateport → Route 110
      [[960, 550], [1000, 450], [980, 350], [920, 320], [880, 300]],                                         // Routes 111 · 112 → Fiery Path
      [[880, 300], [920, 350], [960, 450], [960, 550], [860, 600], [770, 720], [740, 880]],                  // back through Mauville → Route 117 → Petalburg
      [[740, 880], [860, 820], [960, 700], [960, 550], [1060, 520], [1120, 400], [1160, 260]],               // Mauville → Routes 118 · 119 → Fortree
      [[1160, 260], [1300, 280], [1450, 320], [1600, 340], [1780, 330], [2000, 360]],                        // Routes 120 · 121 → Lilycove → Route 124
      [[2000, 360], [1950, 480], [1850, 560], [1790, 640]],                                                  // Routes 127 · 126 → Sootopolis
      [[1790, 640], [1900, 720], [2050, 700], [2130, 640]],                                                  // Route 128 → Ever Grande → Victory Road
      [[2130, 640], [2145, 600], [2160, 555]]                                                                // the Champion’s room
    ] };
  const NAMES = ['Routes 101 · 102 → Petalburg City → Petalburg Woods', 'Routes 104 · 105 · 106 (Mr. Briney’s boat)', 'Route 109 → Slateport City → Route 110', 'Routes 111 · 112 → Fiery Path',
    'Route 117 → Verdanturf → Petalburg City', 'Routes 118 · 119 → Weather Institute', 'Routes 120 · 121 → Lilycove → Route 124', 'Routes 127 · 126 → Sootopolis City',
    'Route 128 → Ever Grande City → Victory Road', 'Ever Grande · the Champion’s room', 'Route 131 → Sky Pillar'];
  const ASH = [[2160, 555], [2000, 760], [1750, 860], [1500, 880]];
  /* ---------- wild Pokémon (Pokédex runs) ---------- */
  const ROUTES_H = [
    { leg: 0, name: 'Routes 101 · 102 · Petalburg Woods', scene: 'meadow', mons: [['Zigzagoon', 2, 4, 10], ['Wurmple', 2, 4, 9], ['Poochyena', 2, 4, 8], ['Lotad', 3, 5, 6], ['Seedot', 3, 5, 6], ['Taillow', 3, 5, 6], ['Wingull', 3, 5, 5], ['Shroomish', 4, 5, 5], ['Slakoth', 4, 5, 3], ['Surskit', 4, 5, 2], ['Ralts', 4, 5, .8]] },
    { leg: 1, name: 'Routes 104 · 105 · 106', scene: 'sea', mons: [['Tentacool', 6, 9, 9], ['Wingull', 6, 9, 8], ['Pelipper', 10, 12, 2], ['Magikarp', 5, 8, 8], ['Marill', 6, 9, 6], ['Wailmer', 7, 9, 5], ['Zubat', 6, 8, 5], ['Makuhita', 8, 10, 4], ['Sableye', 10, 10, .6], ['Mawile', 10, 10, .6]] },
    { leg: 2, name: 'Route 109 · Slateport · Route 110', scene: 'city', mons: [['Electrike', 12, 14, 8], ['Plusle', 12, 14, 4], ['Minun', 12, 14, 4], ['Gulpin', 12, 14, 6], ['Oddish', 12, 14, 6], ['Magnemite', 12, 14, 5], ['Abra', 12, 13, 4], ['Aron', 12, 14, 5], ['Zigzagoon', 12, 14, 6], ['Wingull', 12, 14, 5]] },
    { leg: 3, name: 'Routes 111 · 112 · Fiery Path · Desert', scene: 'mountain', mons: [['Numel', 15, 17, 9], ['Machop', 15, 17, 6], ['Slugma', 15, 17, 5], ['Torkoal', 16, 18, 3], ['Koffing', 15, 17, 5], ['Grimer', 15, 17, 4], ['Trapinch', 16, 18, 5], ['Cacnea', 16, 18, 5], ['Baltoy', 16, 18, 5], ['Sandshrew', 16, 18, 5], ['Regirock', 40, 40, .03], ['Groudon', 45, 45, .03]] },
    { leg: 4, name: 'Route 117 · Verdanturf · Rusturf Tunnel', scene: 'forest', mons: [['Illumise', 18, 20, 5], ['Volbeat', 18, 20, 5], ['Roselia', 18, 20, 5], ['Marill', 18, 20, 5], ['Seedot', 18, 20, 5], ['Oddish', 18, 20, 5], ['Whismur', 18, 20, 7], ['Skitty', 18, 20, 4], ['Spinda', 19, 21, 4], ['Swablu', 19, 21, 4], ['Zangoose', 20, 20, 2], ['Seviper', 20, 20, 2]] },
    { leg: 5, name: 'Routes 118 · 119 · Weather Institute', scene: 'forest', mons: [['Kecleon', 24, 26, 4], ['Tropius', 24, 26, 4], ['Castform', 25, 25, 1], ['Linoone', 24, 26, 6], ['Oddish', 24, 26, 6], ['Carvanha', 24, 26, 5], ['Manectric', 25, 27, 3], ['Tentacool', 24, 26, 5], ['Feebas', 20, 25, .4], ['Absol', 26, 26, .8]] },
    { leg: 6, name: 'Routes 120 · 121 · Mt. Pyre · Route 124', scene: 'tower', mons: [['Shuppet', 28, 30, 8], ['Duskull', 28, 30, 7], ['Vulpix', 28, 30, 4], ['Wingull', 28, 30, 5], ['Chimecho', 30, 30, 1], ['Gloom', 28, 30, 5], ['Spheal', 28, 30, 5], ['Clamperl', 28, 30, 4], ['Relicanth', 30, 30, .6], ['Registeel', 40, 40, .03], ['Latias', 40, 40, .04]] },
    { leg: 7, name: 'Routes 127 · 126 · Sootopolis', scene: 'sea', mons: [['Spheal', 32, 34, 6], ['Sealeo', 33, 35, 4], ['Clamperl', 32, 34, 5], ['Corsola', 32, 34, 4], ['Chinchou', 32, 34, 5], ['Wailmer', 32, 34, 6], ['Luvdisc', 30, 32, 6], ['Horsea', 32, 34, 4], ['Tentacruel', 33, 35, 4], ['Regice', 40, 40, .03], ['Latios', 40, 40, .04], ['Kyogre', 45, 45, .03], ['Rayquaza', 50, 50, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  /* ---------- optional battles: Hoenn route trainers ---------- */
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at, unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_H = [
    T('h-calvin', 'Youngster Calvin', ['youngster'], 'Route 102', [850, 840], 0, 1, arena('plaza'), [['Zigzagoon', 5], ['Poochyena', 5], ['Taillow', 6]], 'I just caught my first Pokémon too! Let’s battle!', 'Aww, you’re good!', 'Yes! I won!'),
    T('h-rick', 'Bug Catcher Rick', ['bugcatcher'], 'Petalburg Woods', [620, 780], 0, 2, arena('ruins'), [['Wurmple', 7], ['Silcoon', 8], ['Cascoon', 8], ['Nincada', 8]], 'The woods are full of bugs! Want to see mine?', 'Squashed…', 'Bugs rule!'),
    T('h-lola', 'Swimmer Lola', ['swimmer'], 'Route 109', [920, 1110], 1, 3, arena('cerulean'), [['Marill', 14], ['Wingull', 14], ['Tentacool', 15], ['Wailmer', 16]], 'The water off Slateport is perfect today!', 'Splashed!', 'Ride the wave!'),
    T('h-mike', 'Hiker Mike', ['hiker'], 'Route 111', [1000, 420], 3, 4, arena('cavern', 'meteor'), [['Geodude', 20], ['Machop', 20], ['Numel', 21], ['Graveler', 22]], 'The desert winds can’t stop a hiker!', 'Buried in sand!', 'Rock solid!'),
    T('h-rose', 'Aroma Lady Rose', ['aromalady', 'beauty', 'lass', 'picnicker'], 'Route 117', [820, 640], 4, 4, arena('plaza'), [['Roselia', 24], ['Shroomish', 24], ['Gloom', 25], ['Breloom', 26]], 'Breathe in the fragrance of my flowers… then battle!', 'Such a lovely battle.', 'Sweet victory!'),
    T('h-colin', 'Bird Keeper Colin', ['birdkeeper'], 'Route 119', [1100, 420], 5, 5, arena('castle'), [['Swellow', 30], ['Pelipper', 30], ['Xatu', 31], ['Skarmory', 32]], 'My birds ride the storm winds of Route 119!', 'Grounded…', 'They soar!'),
    T('h-edward', 'Psychic Edward', ['psychic', 'channeler', 'sage'], 'Mt. Pyre', [1480, 440], 6, 6, arena('grand'), [['Kirlia', 34], ['Shuppet', 34], ['Grumpig', 35], ['Chimecho', 36]], 'The spirits of Mt. Pyre whisper your name…', 'The spirits are quiet now.', 'As foretold.'),
    T('h-anna', 'Cooltrainer Anna', ['cooltrainerfemale', 'cooltrainerf', 'acetrainerfemale', 'acetrainerf'], 'Victory Road', [2060, 690], 8, 7, arena('summit'), [['Gardevoir', 46], ['Breloom', 46], ['Manectric', 47], ['Flygon', 48]], 'Only the strongest pass through Victory Road!', 'You’re ready for the League.', 'Turn back.')
  ];
  /* ---------- twists, scenes ---------- */
  Object.assign(D.RULES, {
    h1: { weather: 'sand', title: 'Rock-solid gym', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    h2: { banA: ['Psychic', 'Flying'], title: 'Wave-crash training', text: 'Brawly’s gym floods with waves: your PSYCHIC and FLYING moves are banned.' },
    h3: { weather: 'rain', title: 'Thunderstorm', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    h4: { weather: 'sun', title: 'Mt. Chimney heat', text: 'Permanent HARSH SUN: Fire moves 50% harder, Water moves 50% weaker.' },
    h5: { handicap: 4, title: 'A father’s rules', text: 'Norman allows only your first FOUR Pokémon.' },
    h6: { banA: ['Electric', 'Rock'], title: 'Feather dance', text: 'Winona’s birds dance between the clouds: your ELECTRIC and ROCK moves are banned.' },
    h7: { handicap: 5, title: 'Two minds as one', text: 'Tate & Liza read every move: bring only your first FIVE Pokémon.' },
    h8: { weather: 'rain', title: 'Rain over Sootopolis', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    h9: { weather: 'sand', title: 'Dragon’s desert', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' }
  });
  Object.assign(D.SCRIPT.gym, {
    h1: [['foe', 'Hello, I am Roxanne. I put what I learned at the Trainers’ School to use in battle.'], ['me', 'Then let’s see your lessons.']],
    h2: [['foe', 'I’m Brawly! I ride the big waves of fighting!'], ['foe', 'Can you keep your balance when the tide comes in?'], ['me', 'Bring the wave.']],
    h3: [['foe', 'Wahahahah! So you made it to Mauville! I’ve been charging up all day!'], ['me', 'Let’s see the spark.']],
    h4: [['foe', 'Welcome to Lavaridge! I’m… uh… Flannery! I mean — prepare to be scorched!'], ['me', 'I’m ready.']],
    h5: [['foe', 'You’ve come a long way. But as a Gym Leader, I won’t go easy on you.'], ['foe', 'Show me how strong you’ve become.'], ['me', 'Here I come.']],
    h6: [['foe', 'I am Winona. I have become one with bird Pokémon.'], ['foe', 'Witness the elegant choreography of my bird Pokémon!'], ['me', 'Let’s dance.']],
    h7: [['foe', 'Hehehe… were you surprised?'], ['foe', 'That there are two Gym Leaders? We can read each other’s minds!'], ['me', 'Then read this.']],
    h8: [['foe', 'Sootopolis is safe thanks to you. Now — let me see your elegance in battle.'], ['me', 'Of course, Wallace.']],
    h9: [['foe', 'I am Drake of the Elite Four. What does a trainer need most? Virtue!'], ['foe', 'Show me yours.'], ['me', 'Let’s battle.']]
  });
  const CHAMP = { cocky: [['foe', 'Welcome to the Hoenn League. I am Steven, the Champion.'], ['foe', 'I wanted to see how strong you’d become. Let us battle.'], ['me', 'I’m ready, Steven.']] };
  CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  /* ---------- May: Hoenn’s rival ---------- */
  const LINES = { grass: ['Treecko', 'Grovyle', 'Sceptile'], fire: ['Torchic', 'Combusken', 'Blaziken'], water: ['Mudkip', 'Marshtomp', 'Swampert'] };
  function mayCounter() {
    const s = STORY.save, have = new Set([...(s && s.team || []), ...Object.keys((s && s.dex) || {})].map(n => String(n).split('|')[0])), has = (...ns) => ns.some(n => have.has(n));
    if (has('Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur')) return LINES.fire;
    if (has('Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard')) return LINES.water;
    if (has('Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise')) return LINES.grass;
    return LINES.fire;
  }
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'Oh, hi! I’m May — my dad is Professor Birch!'], ['foe', 'I’ve been filling my Pokédex too. Let’s see whose Pokémon are stronger!']], rattled: [['foe', 'You won last time… but I’ve been training!'], ['me', 'Let’s go, May!']], bitter: [['foe', 'Wow, you’re getting really strong. I’m not giving up, though!']] },
      { cocky: [['foe', 'Route 119 is so rainy! Want to warm up with a battle?']], rattled: [['foe', 'My Pokémon have grown a lot. Watch this!']], bitter: [['foe', 'You keep winning… but I still think I can beat you this time!']] },
      { cocky: [['foe', 'Victory Road! I came to cheer you on — after one last battle!']], rattled: [['foe', 'Before you face the League, let me test you one more time.']], bitter: [['foe', 'I knew you’d make it here. Show me everything before you go in!']] }
    ],
    win: { cocky: [['foe', 'Wow! You’re really strong. Let’s both keep going!']], rattled: [['foe', 'Aww… again? I’ll catch up, you’ll see!']], bitter: [['foe', 'Amazing! Go get that Champion title!']] },
    lose: { cocky: [['foe', 'Yay! I won! Don’t feel bad — let’s both get stronger!']], rattled: [['foe', 'I did it! Our training paid off!']], bitter: [['foe', 'I finally won! …But you’ll beat the League, I just know it.']] }
  };
  /* ---------- Hoenn story events (before gyms 2, 4, 5, 7 and 8) ---------- */
  const EV = {
    1: { id: 'hdevon', title: 'The Devon Goods', arena: arena('ruins', 'cavern'), text: 'Team Aqua stole the Devon Goods! Two Aqua battles back to back — no healing between.',
      before: [['foe', 'Hand over those Devon Goods, kid! Team Aqua needs them!'], ['me', 'They’re not yours to take!']],
      stages: [{ name: 'Aqua Grunt', keys: ['aquagrunt', 'teamaquagrunt', 'aqua'], team: ['Poochyena', 'Carvanha', 'Zubat'], style: 'aggro' }, { name: 'Aqua Admin Shelly', keys: ['shelly', 'aquaadmin'], team: ['Mightyena', 'Carvanha', 'Wailmer'], style: 'switcher', line: 'You beat our grunt? I’ll show you what an Admin can do!' }],
      win: [['foe', 'Fine, take your precious Goods. Team Aqua will expand the seas anyway!']], lose: [['foe', 'The Goods are ours! Ahaha!']] },
    3: { id: 'hchimney', title: 'Mt. Chimney', arena: arena('cinnabar', 'meteor'), text: 'Team Magma is trying to erupt Mt. Chimney! Two Magma battles back to back — no healing between.',
      before: [['foe', 'Team Magma will use the meteorite to make the volcano erupt — and expand the land!'], ['me', 'I won’t let you!']],
      stages: [{ name: 'Magma Grunt', keys: ['magmagrunt', 'teammagmagrunt', 'magma'], team: ['Poochyena', 'Numel', 'Zubat'], style: 'aggro' }, { name: 'Magma Leader Maxie', keys: ['maxie'], team: ['Mightyena', 'Crobat', 'Camerupt'], style: 'switcher', line: 'I am Maxie, leader of Team Magma. You will not stand in the way of our ideals.' }],
      win: [['foe', 'Hmph. We will find another way to awaken Groudon.']], lose: [['foe', 'Mankind needs more land. Stand aside.']] },
    4: { id: 'hwally', title: 'Wally’s challenge', format: '1v1', name: 'Wally', keys: ['wally'], team: ['Kirlia'], style: 'switcher', arena: arena('plaza'),
      text: 'A 1v1 duel with Wally: your lead against his Kirlia.',
      before: [['foe', 'I-I want to become strong too! Will you battle me? Just one Pokémon each!'], ['me', 'Of course, Wally.']],
      win: [['foe', 'You’re amazing… I’m going to train even harder!']], lose: [['foe', 'I… I won? Kirlia, we did it!']] },
    6: { id: 'hmirage', title: 'Mirage Tower puzzle', format: 'puzzle', name: 'Ruin Maniac', keys: ['ruinmaniac', 'hiker'], team: ['Flygon'], fixedTeam: ['Manectric', 'Minun', 'Magneton', 'Snorunt'], foeScale: 1.6, style: 'defensive', arena: arena('oasis', 'summit'),
      text: 'Puzzle battle: a Ruin Maniac’s Flygon guards the desert tower. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'The Mirage Tower only appears to those who can beat my Flygon!'], ['foe', 'Take my crew’s Pokémon. Think carefully…'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Ice! Of course — Ground and Dragon, both weak to it. The tower is yours.']], lose: [['foe', 'Electric won’t touch a Ground type… think again!']] },
    7: { id: 'hseafloor', title: 'Seafloor Cavern', arena: arena('cerulean', 'cavern'), text: 'Team Aqua has awakened Kyogre! Archie, then Kyogre itself — back to back, no healing between.',
      before: [['foe', 'With Kyogre, the seas will cover the world! Nothing can stop us now!'], ['me', 'Archie, stop this!']],
      stages: [{ name: 'Aqua Leader Archie', keys: ['archie'], team: ['Mightyena', 'Crobat', 'Sharpedo'], style: 'aggro' }, { name: 'Kyogre', keys: [], team: ['Kyogre'], foeScale: .85, style: 'aggro', line: 'The sea itself rises against you!' }],
      win: [['me', 'The rain is stopping… Kyogre has calmed down.']], lose: [['foe', 'The seas will swallow everything!']] }
  };
  /* ---------- evolutions (Hoenn lines) ---------- */
  Object.assign(EVO, { Treecko: ['Grovyle', 16], Grovyle: ['Sceptile', 36], Torchic: ['Combusken', 16], Combusken: ['Blaziken', 36], Mudkip: ['Marshtomp', 16], Marshtomp: ['Swampert', 36],
    Poochyena: ['Mightyena', 18], Zigzagoon: ['Linoone', 20], Wurmple: ['Silcoon', 7], Silcoon: ['Beautifly', 10], Cascoon: ['Dustox', 10], Lotad: ['Lombre', 14], Lombre: ['Ludicolo', 30],
    Seedot: ['Nuzleaf', 14], Nuzleaf: ['Shiftry', 30], Taillow: ['Swellow', 22], Wingull: ['Pelipper', 25], Ralts: ['Kirlia', 20], Kirlia: ['Gardevoir', 30], Surskit: ['Masquerain', 22],
    Shroomish: ['Breloom', 23], Slakoth: ['Vigoroth', 18], Vigoroth: ['Slaking', 36], Nincada: ['Ninjask', 20], Whismur: ['Loudred', 20], Loudred: ['Exploud', 40], Makuhita: ['Hariyama', 24],
    Azurill: ['Marill', 12], Skitty: ['Delcatty', 25], Aron: ['Lairon', 32], Lairon: ['Aggron', 42], Meditite: ['Medicham', 37], Electrike: ['Manectric', 26], Gulpin: ['Swalot', 26],
    Carvanha: ['Sharpedo', 30], Wailmer: ['Wailord', 40], Numel: ['Camerupt', 33], Spoink: ['Grumpig', 32], Trapinch: ['Vibrava', 35], Vibrava: ['Flygon', 45], Cacnea: ['Cacturne', 32],
    Swablu: ['Altaria', 35], Barboach: ['Whiscash', 30], Corphish: ['Crawdaunt', 30], Baltoy: ['Claydol', 36], Lileep: ['Cradily', 40], Anorith: ['Armaldo', 40], Feebas: ['Milotic', 30],
    Shuppet: ['Banette', 37], Duskull: ['Dusclops', 37], Wynaut: ['Wobbuffet', 15], Snorunt: ['Glalie', 42], Spheal: ['Sealeo', 32], Sealeo: ['Walrein', 44], Clamperl: ['Huntail', 30],
    Bagon: ['Shelgon', 30], Shelgon: ['Salamence', 50], Beldum: ['Metang', 20], Metang: ['Metagross', 45] });
  /* ---------- register Hoenn with the region switch ---------- */
  window.HOENN = { gyms: GYMS_H, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_H, minors: MINORS_H, starters: ['Treecko', 'Torchic', 'Mudkip'],
    badges: ['stone', 'knuckle', 'dynamo', 'heat', 'balance', 'feather', 'mind', 'rain', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Wingull', 'Lotad', '*1'], ['Pelipper', 'Lombre', 'Slugma', '*1'], ['Pelipper', 'Ludicolo', 'Magcargo', 'Tropius', '*2']],
    rival: { file: 'May', leader: 'May' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter: mayCounter, rivalKey: 'rivalH', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { hoenn: EV });
  /* ---------- post-game: Rayquaza atop the Sky Pillar ---------- */
  const $ = id => document.getElementById(id);
  let offeringSky = false;
  async function offerSky() {
    const s = STORY.save; if (offeringSky || !s || STORY.region !== 'hoenn' || s.badges < TOTAL || s.rayquaza || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringSky = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Hoenn’s Champion! Far out on Route 131, the Sky Pillar rises into the clouds — and something stirs at the top…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Climb the Sky Pillar</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await climbSky();
    } finally { offeringSky = false; STORY.cutscene = false; }
  }
  async function climbSky() {
    const s = STORY.save, who = { file: 'Rayquaza', leader: 'Rayquaza' };
    closeModal();
    await playScene([['foe', 'GRAAAAAOOOH!'], ['me', 'Rayquaza… the guardian of the sky. Everyone — let’s go!']], who, { title: 'Sky Pillar', text: 'Your whole team against Rayquaza itself — the strongest Pokémon in Hoenn.' });
    STORY.battle = { gym: 9, sky: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.8, aiStyle: 'aggro', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Rayquaza'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Rayquaza'], arena('castle', 'summit')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.climbSkyPillar = climbSky;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.sky) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.rayquaza = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Rayquaza', 70); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['me', 'Rayquaza… it’s calm. It’s choosing to come with us!']] : [['foe', 'GRAAAOOOH!']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open = openStoryScreen; openStoryScreen = function () { const r = _open.apply(this, arguments); setTimeout(offerSky, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
})();
