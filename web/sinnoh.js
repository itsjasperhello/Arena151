/* =====================================================================
   Section 40: SINNOH — the fourth story region (registers with the region
   switch in johto.js; Kanto, Johto and Hoenn are untouched)
   ===================================================================== */
(function sinnohRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, $ = id => document.getElementById(id), arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  const GYMS_S = [
    G(1, 's1', 'defensive', 'Roark', 'Roark', 'Oreburgh City', 'Rock', 'Coal Badge', arena('pewter', 'cavern'), ['Geodude', 'Onix', 'Nosepass', 'Bonsly', 'Larvitar', 'Cranidos'], [12, 13, 13, 14, 14, 15],
      'Welcome to the Oreburgh Gym! I’m Roark, the Gym Leader — and I’ll show you the power of the rocks of the mine!', 'Back to the mines with you!', 'This is embarrassing… You’ve earned the Coal Badge.'),
    G(2, 's2', 'status', 'Gardenia', 'Gardenia', 'Eterna City', 'Grass', 'Forest Badge', arena('ruins', 'plaza'), ['Cherubi', 'Sunkern', 'Carnivine', 'Tangela', 'Bellsprout', 'Roserade'], [18, 19, 19, 20, 20, 22],
      'I’m Gardenia, the Eterna Gym Leader! My Grass Pokémon are going to make you work for it!', 'My Grass Pokémon bloomed!', 'Amazing! You’re very good, aren’t you? Here’s the Forest Badge.'),
    G(3, 's3', 'status', 'Fantina', 'Fantina', 'Hearthome City', 'Ghost', 'Relic Badge', arena('meteor', 'grand'), ['Drifblim', 'Duskull', 'Shuppet', 'Haunter', 'Spiritomb', 'Mismagius'], [24, 25, 25, 26, 27, 28],
      'Bonjour! I am Fantina! You will see how marvelous my Ghost Pokémon are — they will dazzle you!', 'Magnifique! I win!', 'You are so fantastically strong. I lose. Take the Relic Badge.'),
    G(4, 's4', 'aggro', 'Maylene', 'Maylene', 'Veilstone City', 'Fighting', 'Cobble Badge', arena('summit', 'plaza'), ['Meditite', 'Machoke', 'Croagunk', 'Hitmonchan', 'Heracross', 'Lucario'], [28, 29, 29, 30, 31, 32],
      'I’m Maylene. I train barefoot to toughen my feet. Let’s battle — no holding back!', 'Training pays off.', 'I shall admit defeat. You are much too strong. The Cobble Badge is yours.'),
    G(5, 's5', 'aggro', 'Crasher Wake', 'Crasher_Wake', 'Pastoria City', 'Water', 'Fen Badge', arena('cerulean', 'hall'), ['Quagsire', 'Gyarados', 'Gastrodon', 'Wailmer', 'Lumineon', 'Floatzel'], [31, 32, 32, 33, 34, 35],
      'I am… Crasher Wake! Watch the power of my Water Pokémon as it crashes over you!', 'WAHAHAH! Washed away!', 'Puwaah! You are strong! Take the Fen Badge!'),
    G(6, 's6', 'defensive', 'Byron', 'Byron', 'Canalave City', 'Steel', 'Mine Badge', arena('vermilion', 'castle'), ['Magneton', 'Steelix', 'Skarmory', 'Probopass', 'Bronzong', 'Bastiodon'], [36, 37, 37, 38, 39, 40],
      'Welcome! I am Byron, the father of Roark. My Steel Pokémon have been tempered for years. Bring it on!', 'Hah! Solid as steel!', 'Hmm! Well done, young one. Take the Mine Badge.'),
    G(7, 's7', 'switcher', 'Candice', 'Candice', 'Snowpoint City', 'Ice', 'Icicle Badge', arena('cavern', 'ice'), ['Sneasel', 'Piloswine', 'Lapras', 'Froslass', 'Jynx', 'Abomasnow'], [40, 41, 41, 42, 43, 44],
      'I’m Candice! Diamond dust — that’s my focus! Let’s see if your focus is as sharp as mine!', 'Focus, focus!', 'Wow! You’re great! Here — the Icicle Badge!'),
    G(8, 's8', 'aggro', 'Volkner', 'Volkner', 'Sunyshore City', 'Electric', 'Beacon Badge', arena('vermilion', 'plaza'), ['Raichu', 'Ambipom', 'Octillery', 'Jolteon', 'Luxray', 'Electivire'], [46, 47, 47, 48, 49, 50],
      'I’m Volkner. I was getting bored with weak challengers… Let’s see if you can light my fire again.', 'Still bored.', '…Hehe. Hahaha! That was the most fun I’ve had in ages. The Beacon Badge is yours.'),
    G(9, 's9', 'switcher', 'Lucian', 'Lucian', 'Pokémon League', 'Psychic', 'Elite Four', arena('grand', 'hall'), ['Mr. Mime', 'Espeon', 'Girafarig', 'Alakazam', 'Medicham', 'Gallade'], [53, 54, 54, 55, 56, 57],
      'Welcome. I am Lucian of the Elite Four. You are the last challenger I will face before the Champion — do not disappoint me.', 'A pity. Come back stronger.', 'Congratulations. You have beaten the Elite Four. The Champion awaits.'),
    G(10, 's10', 'switcher', 'Cynthia', 'Cynthia', 'Pokémon League', 'Champion', 'Champion', arena('hall', 'grand'), ['Spiritomb', 'Roserade', 'Togekiss', 'Lucario', 'Milotic', 'Garchomp'], [58, 60, 60, 60, 60, 64],
      'I’m Cynthia, the Champion of Sinnoh. As the Champion, I accept your challenge — I won’t hold back.', 'Your journey isn’t over. Come back stronger.', 'That was excellent. Truly, an outstanding battle. You are the new Champion of Sinnoh.')
  ];
  GYMS_S[9].pickTeam = () => GYMS_S[9].team.slice();   // Champion Cynthia brings her own team
  /* ---------- the Sinnoh map (story/sinnoh_map.webp, 2576×1438) ---------- */
  const MAP = { img: 'story/sinnoh_map.webp', w: 2576, h: 1438, home: { x: 450, y: 1250, city: 'Twinleaf Town' },
    gyms: { 1: [920, 1020], 2: [1000, 600], 3: [1380, 860], 4: [1900, 700], 5: [1380, 1120], 6: [560, 660], 7: [1120, 140], 8: [2300, 1040], 9: [2220, 660], 10: [2245, 600] },
    legs: [
      [[450, 1250], [540, 1235], [620, 1220], [620, 1120], [620, 1040], [780, 1030], [920, 1020]],                          // Routes 201 · 202 → Jubilife → Route 203 → Oreburgh
      [[920, 1020], [780, 1030], [620, 1040], [650, 900], [690, 770], [820, 660], [1000, 600]],                            // Route 204 → Floaroma → Eterna Forest → Eterna
      [[1000, 600], [1000, 760], [1100, 860], [1250, 870], [1380, 860]],                                                   // Route 206 → Mt. Coronet → Route 208 → Hearthome
      [[1380, 860], [1500, 830], [1600, 800], [1750, 760], [1900, 700]],                                                   // Routes 209 · 210 → Solaceon → Route 215 → Veilstone
      [[1900, 700], [1950, 850], [1920, 1000], [1700, 1080], [1380, 1120]],                                                // Route 214 → Valor Lakefront → Route 213 → Pastoria
      [[1380, 1120], [1380, 860], [1100, 860], [920, 1020], [620, 1040], [520, 900], [560, 660]],                          // back west → Jubilife → Route 218 → Canalave
      [[560, 660], [640, 800], [820, 660], [1000, 600], [1320, 560], [1250, 380], [1150, 250], [1120, 140]],               // Eterna → Route 211 → Celestic → Routes 216 · 217 → Snowpoint
      [[1120, 140], [1200, 360], [1320, 560], [1600, 800], [1920, 1000], [2100, 1060], [2300, 1040]],                      // Mt. Coronet · Spear Pillar → Route 222 → Sunyshore
      [[2300, 1040], [2330, 900], [2270, 760], [2220, 660]],                                                               // Route 223 → Victory Road → Pokémon League
      [[2220, 660], [2235, 630], [2245, 600]]                                                                              // the Champion’s room
    ] };
  const NAMES = ['Routes 201 · 202 → Jubilife City → Route 203', 'Route 204 → Floaroma → Eterna Forest', 'Route 206 → Mt. Coronet → Route 208', 'Routes 209 · 210 → Solaceon → Route 215',
    'Route 214 → Valor Lakefront → Route 213', 'Jubilife City → Route 218 → Canalave City', 'Route 211 → Celestic Town → Routes 216 · 217', 'Mt. Coronet · Spear Pillar → Route 222',
    'Route 223 → Victory Road → Pokémon League', 'Pokémon League · the Champion’s room', 'Fight Area → Stark Mountain'];
  const ASH = [[2245, 600], [2120, 420], [1980, 240], [1900, 140]];
  /* ---------- wild Pokémon (Pokédex runs) ---------- */
  const ROUTES_S = [
    { leg: 0, name: 'Routes 201 · 202 · 203', scene: 'meadow', mons: [['Starly', 2, 4, 10], ['Bidoof', 2, 4, 10], ['Kricketot', 2, 4, 7], ['Shinx', 3, 5, 7], ['Budew', 3, 5, 5], ['Abra', 4, 5, 3], ['Zubat', 4, 5, 4], ['Machop', 4, 5, 4], ['Psyduck', 4, 5, 2]] },
    { leg: 1, name: 'Route 204 · Floaroma · Eterna Forest', scene: 'forest', mons: [['Budew', 7, 9, 7], ['Wurmple', 6, 8, 6], ['Burmy', 7, 9, 5], ['Combee', 7, 9, 5], ['Cherubi', 7, 9, 5], ['Buneary', 8, 10, 5], ['Pachirisu', 8, 10, 4], ['Shellos', 8, 10, 5], ['Drifloon', 9, 10, 2], ['Gastly', 8, 10, 4], ['Murkrow', 10, 10, 1]] },
    { leg: 2, name: 'Route 206 · Mt. Coronet · Route 208', scene: 'cave', mons: [['Geodude', 14, 16, 8], ['Onix', 14, 16, 4], ['Machop', 14, 16, 5], ['Bronzor', 14, 16, 6], ['Zubat', 14, 16, 6], ['Ponyta', 14, 16, 5], ['Stunky', 14, 16, 4], ['Glameow', 14, 16, 4], ['Nosepass', 15, 17, 3], ['Chingling', 15, 17, 3], ['Gible', 16, 16, .8]] },
    { leg: 3, name: 'Routes 209 · 210 · Lost Tower', scene: 'tower', mons: [['Gastly', 20, 22, 7], ['Duskull', 20, 22, 6], ['Bonsly', 20, 22, 4], ['Mime Jr.', 20, 22, 3], ['Ponyta', 20, 22, 5], ['Roselia', 20, 22, 5], ['Staravia', 20, 22, 6], ['Swablu', 20, 22, 4], ['Chansey', 22, 22, .8], ['Spiritomb', 25, 25, .5]] },
    { leg: 4, name: 'Routes 214 · 213 · Great Marsh', scene: 'safari', mons: [['Croagunk', 24, 26, 6], ['Skorupi', 24, 26, 5], ['Carnivine', 25, 27, 4], ['Quagsire', 24, 26, 5], ['Yanma', 24, 26, 4], ['Tangela', 24, 26, 4], ['Hippopotas', 24, 26, 5], ['Shellos', 24, 26, 5], ['Buizel', 24, 26, 5], ['Finneon', 24, 26, 5], ['Mesprit', 40, 40, .03]] },
    { leg: 5, name: 'Route 218 · Iron Island', scene: 'sea', mons: [['Tentacool', 28, 30, 7], ['Finneon', 28, 30, 6], ['Lumineon', 30, 32, 3], ['Wingull', 28, 30, 6], ['Mr. Mime', 30, 30, 2], ['Floatzel', 30, 32, 3], ['Graveler', 30, 32, 5], ['Golbat', 30, 32, 5], ['Steelix', 32, 32, 1], ['Riolu', 30, 30, .6]] },
    { leg: 6, name: 'Routes 211 · 216 · 217 · Lake Acuity', scene: 'mountain', mons: [['Snover', 34, 36, 9], ['Sneasel', 34, 36, 5], ['Snorunt', 34, 36, 5], ['Swinub', 34, 36, 5], ['Machoke', 34, 36, 4], ['Meditite', 34, 36, 4], ['Chingling', 34, 36, 3], ['Noctowl', 35, 37, 3], ['Abomasnow', 38, 38, 1], ['Uxie', 45, 45, .03]] },
    { leg: 7, name: 'Route 222 · Sunyshore · Spear Pillar', scene: 'city', mons: [['Luxio', 40, 42, 6], ['Glameow', 40, 42, 4], ['Purugly', 41, 43, 3], ['Floatzel', 40, 42, 5], ['Chatot', 42, 42, 2], ['Pelipper', 40, 42, 5], ['Electabuzz', 41, 43, 3], ['Azelf', 45, 45, .03], ['Dialga', 50, 50, .02], ['Palkia', 50, 50, .02], ['Giratina', 50, 50, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  /* ---------- optional battles: Sinnoh route trainers ---------- */
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at, unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_S = [
    T('s-tristan', 'Youngster Tristan', ['youngster'], 'Route 202', [610, 1150], 0, 1, arena('plaza'), [['Starly', 5], ['Bidoof', 5], ['Shinx', 6]], 'I’m going to be the best in Sinnoh! Starting with you!', 'Aww… not yet.', 'Yeah!'),
    T('s-natalie', 'Picnicker Natalie', ['picnicker', 'lass'], 'Route 204', [660, 880], 0, 2, arena('ruins'), [['Budew', 9], ['Buneary', 9], ['Pachirisu', 10]], 'The flowers in Floaroma are blooming! Let’s battle under them!', 'Petals everywhere…', 'Blooming victory!'),
    T('s-dennis', 'Hiker Dennis', ['hiker'], 'Mt. Coronet', [1100, 830], 2, 3, arena('cavern', 'meteor'), [['Geodude', 16], ['Onix', 16], ['Machop', 17], ['Bronzor', 17]], 'Mt. Coronet cuts Sinnoh in two. I’ve climbed every inch!', 'Rockslide!', 'Solid as Coronet!'),
    T('s-ace', 'Ace Trainer Dennis', ['cooltrainermale', 'cooltrainerm', 'acetrainermale', 'acetrainerm'], 'Route 210', [1620, 760], 3, 4, arena('summit'), [['Staravia', 24], ['Ponyta', 24], ['Roselia', 25], ['Machoke', 26]], 'The fog on Route 210 hides strong trainers. Like me!', 'Lost in the fog…', 'Clear skies for me!'),
    T('s-fisher', 'Fisherman Ned', ['fisherman'], 'Valor Lakefront', [1940, 930], 4, 4, arena('cerulean'), [['Magikarp', 25], ['Shellos', 27], ['Finneon', 27], ['Gyarados', 29]], 'The fish are biting at Lake Valor today!', 'The big one got away…', 'Hooked!'),
    T('s-sailor', 'Sailor Luther', ['sailor'], 'Route 218', [540, 980], 5, 5, arena('cerulean'), [['Wingull', 30], ['Machoke', 31], ['Tentacool', 31], ['Floatzel', 32]], 'Ahoy! The sea off Canalave is rough — are you?', 'Sunk!', 'Anchors aweigh!'),
    T('s-skier', 'Skier Edward', ['skier', 'boarder'], 'Route 217', [1180, 320], 6, 6, arena('cavern', 'ice'), [['Snover', 36], ['Sneasel', 36], ['Swinub', 37], ['Glalie', 38]], 'Nothing beats a run down Route 217 in a blizzard!', 'Wiped out!', 'Smooth slopes!'),
    T('s-veteran', 'Veteran Arthur', ['veteran', 'cooltrainermale', 'cooltrainerm'], 'Victory Road', [2310, 860], 8, 7, arena('castle'), [['Gallade', 48], ['Weavile', 48], ['Staraptor', 49], ['Garchomp', 50]], 'Victory Road tests every trainer who passes. I’m the test.', 'You’re ready.', 'Turn back.')
  ];
  /* ---------- twists and scenes ---------- */
  Object.assign(D.RULES, {
    s1: { weather: 'sand', title: 'Mine dust', text: 'Dust from the Oreburgh Mine: a permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    s2: { weather: 'sun', title: 'Greenhouse sun', text: 'Permanent HARSH SUN: Fire moves 50% harder, Water moves 50% weaker.' },
    s3: { banA: ['Dark'], title: 'Ghostly mist', text: 'A ghostly mist fills Fantina’s stage: your DARK moves are banned.' },
    s4: { handicap: 4, title: 'Barefoot rules', text: 'Maylene trains with discipline: bring only your first FOUR Pokémon.' },
    s5: { weather: 'rain', title: 'Crashing waves', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    s6: { banA: ['Fire'], title: 'Fireproof gym', text: 'Byron’s gym is built of tempered steel: your FIRE moves are banned.' },
    s7: { weather: 'hail', title: 'Diamond dust', text: 'Permanent HAIL chips every Pokémon that isn’t Ice.' },
    s8: { weather: 'rain', title: 'Thunderstorm', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    s9: { handicap: 5, title: 'Read your mind', text: 'Lucian reads your plans: bring only your first FIVE Pokémon.' }
  });
  Object.assign(D.SCRIPT.gym, {
    s1: [['foe', 'I’m Roark! Let me show you how tough the rocks of the mine make my Pokémon!'], ['me', 'Let’s dig in.']],
    s2: [['foe', 'Welcome to my gym! I’m Gardenia — I love Grass Pokémon!'], ['me', 'Show me your garden.']],
    s3: [['foe', 'Bonjour! I am Fantina! Ghost Pokémon are… how you say… magnifique!'], ['me', 'Let’s see them.']],
    s4: [['foe', 'I’m Maylene. Strength comes from the heart — and from training.'], ['me', 'I’m ready.']],
    s5: [['foe', 'I am… CRASHER WAKE!'], ['foe', 'Watch my Water Pokémon crash over you like a tidal wave!'], ['me', 'Bring it!']],
    s6: [['foe', 'I am Byron! Roark is my son. My Steel Pokémon have been tempered for decades!'], ['me', 'Then let’s test them.']],
    s7: [['foe', 'I’m Candice! Focus, focus! Diamond dust!'], ['me', 'Focus, then.']],
    s8: [['foe', 'I’m Volkner. Lately no one gets me fired up… Let’s see if you can.'], ['me', 'I will.']],
    s9: [['foe', 'Welcome. I am Lucian of the Elite Four.'], ['foe', 'I have read many books… none of them could predict a trainer like you.'], ['me', 'Let’s battle.']]
  });
  const CHAMP = { cocky: [['foe', 'Hello. I’m Cynthia, the Champion of Sinnoh.'], ['foe', 'There’s something about you that tells me this will be fun.'], ['me', 'Let’s battle, Cynthia.']] };
  CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  /* ---------- Barry: Sinnoh’s rival ---------- */
  const LINES = { grass: ['Turtwig', 'Grotle', 'Torterra'], fire: ['Chimchar', 'Monferno', 'Infernape'], water: ['Piplup', 'Prinplup', 'Empoleon'] };
  function barryCounter() {
    const s = STORY.save, have = new Set([...(s && s.team || []), ...Object.keys((s && s.dex) || {})].map(n => String(n).split('|')[0])), has = (...ns) => ns.some(n => have.has(n));
    if (has('Turtwig', 'Grotle', 'Torterra', 'Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur')) return LINES.fire;
    if (has('Chimchar', 'Monferno', 'Infernape', 'Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard')) return LINES.water;
    if (has('Piplup', 'Prinplup', 'Empoleon', 'Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise')) return LINES.grass;
    return LINES.water;
  }
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'Hey! It’s me, Barry! What took you so long?! I’ll fine you a million if you lose!'], ['me', 'Let’s go, Barry!']], rattled: [['foe', 'You beat me last time — I’m not letting that happen again! Hurry up and battle!']], bitter: [['foe', 'Argh, you keep winning! Okay, okay — THIS time for sure!']] },
      { cocky: [['foe', 'Canalave’s Gym Leader is tough, but first — me! Battle now!']], rattled: [['foe', 'I trained like crazy! My Pokémon are way stronger now!']], bitter: [['foe', 'I’m gonna catch up to you if it’s the last thing I do!']] },
      { cocky: [['foe', 'Hey! I’m going to the League first — so out of my way!']], rattled: [['foe', 'Before you face the Elite Four, you have to get through me!']], bitter: [['foe', 'This is it! Our last battle before the League — everything I’ve got!']] }
    ],
    win: { cocky: [['foe', 'What?! I lost?! I’ll fine you… no wait, I lost…']], rattled: [['foe', 'Argh! Next time for sure!']], bitter: [['foe', 'You’re amazing. Go win it all!']] },
    lose: { cocky: [['foe', 'Ha! I win! Pay up — a million!']], rattled: [['foe', 'Yes! Told you my training would pay off!']], bitter: [['foe', 'I finally won! …Now go beat the League anyway!']] }
  };
  /* ---------- Team Galactic events (before gyms 2, 4, 5, 7 and 8) ---------- */
  const EV = {
    1: { id: 'swindworks', title: 'Valley Windworks', arena: arena('summit', 'plaza'), text: 'Team Galactic has taken over the Valley Windworks! Two Galactic battles back to back — no healing between.',
      before: [['foe', 'Team Galactic needs the energy of the Windworks! Go away, kid!'], ['me', 'Not happening.']],
      stages: [{ name: 'Galactic Grunt', keys: ['galacticgrunt', 'teamgalacticgrunt', 'galactic'], team: ['Glameow', 'Stunky', 'Zubat'], style: 'aggro' }, { name: 'Commander Mars', keys: ['mars', 'galacticadmin'], team: ['Zubat', 'Purugly', 'Bronzor'], style: 'switcher', line: 'I’m Mars, a Galactic Commander. You’ll regret getting in our way!' }],
      win: [['foe', 'Fine. We’ve got what we came for anyway.']], lose: [['foe', 'Team Galactic always wins!']] },
    3: { id: 'svalor', title: 'Lake Valor', format: '1v1', name: 'Commander Saturn', keys: ['saturn', 'galacticadmin'], team: ['Toxicroak'], style: 'aggro', arena: arena('cerulean', 'cavern'),
      text: 'Team Galactic has drained Lake Valor! A 1v1 duel with Commander Saturn: your lead against his Toxicroak.',
      before: [['foe', 'The bomb did its job. Azelf is ours.'], ['me', 'You drained the lake?! Battle me!']],
      win: [['foe', 'Hmph. It doesn’t matter. The boss already has what he needs.']], lose: [['foe', 'Go home, child.']] },
    4: { id: 'smarsh', title: 'Great Marsh puzzle', format: 'puzzle', name: 'Ruin Maniac', keys: ['ruinmaniac', 'hiker'], team: ['Gastrodon'], fixedTeam: ['Luxray', 'Pachirisu', 'Magnezone', 'Carnivine'], foeScale: 1.6, style: 'defensive', arena: arena('ruins', 'oasis'),
      text: 'Puzzle battle: a Gastrodon guards the Great Marsh. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'My Gastrodon has never lost in this marsh!'], ['foe', 'Use these Pokémon — if you can figure it out.'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Grass! Gastrodon is Water and Ground — four times weak! Well played.']], lose: [['foe', 'Electricity just sinks into the mud… think again!']] },
    6: { id: 'sacuity', title: 'Lake Acuity', arena: arena('cavern', 'ice'), text: 'Team Galactic is capturing Uxie! Two Galactic battles back to back — no healing between.',
      before: [['foe', 'The Lake Guardians belong to Team Galactic now!'], ['me', 'Let Uxie go!']],
      stages: [{ name: 'Galactic Grunt', keys: ['galacticgrunt', 'teamgalacticgrunt', 'galactic'], team: ['Croagunk', 'Glameow', 'Golbat'], style: 'aggro' }, { name: 'Commander Jupiter', keys: ['jupiter', 'galacticadmin'], team: ['Golbat', 'Skuntank', 'Bronzor'], style: 'status', line: 'Jupiter, Team Galactic Commander. You’re finished here.' }],
      win: [['foe', 'Too late. The boss is headed for Spear Pillar.']], lose: [['foe', 'Uxie is ours!']] },
    7: { id: 'sspear', title: 'Spear Pillar', arena: arena('hall', 'grand'), text: 'Cyrus is tearing open space and time at Spear Pillar! Cyrus, then Giratina from the distortion — back to back, no healing between.',
      before: [['foe', 'I will create a new world — one without spirit. Dialga and Palkia will obey me.'], ['me', 'I’ll stop you, Cyrus!']],
      stages: [{ name: 'Galactic Boss Cyrus', keys: ['cyrus'], team: ['Honchkrow', 'Weavile', 'Crobat', 'Gyarados'], style: 'switcher' }, { name: 'Giratina', keys: [], team: ['Giratina'], foeScale: .85, style: 'aggro', line: 'The world distorts — Giratina emerges from the shadows!' }],
      win: [['me', 'The distortion is closing… Sinnoh is safe.']], lose: [['foe', 'A new world will be born!']] }
  };
  /* ---------- evolutions: Sinnoh lines (and Gen 4 evolutions of older Pokémon, Sinnoh only) ---------- */
  Object.assign(EVO, { Turtwig: ['Grotle', 18], Grotle: ['Torterra', 32], Chimchar: ['Monferno', 14], Monferno: ['Infernape', 36], Piplup: ['Prinplup', 16], Prinplup: ['Empoleon', 36],
    Starly: ['Staravia', 14], Staravia: ['Staraptor', 34], Bidoof: ['Bibarel', 15], Kricketot: ['Kricketune', 10], Shinx: ['Luxio', 15], Luxio: ['Luxray', 30], Budew: ['Roselia', 15],
    Cranidos: ['Rampardos', 30], Shieldon: ['Bastiodon', 30], Combee: ['Vespiquen', 21], Buizel: ['Floatzel', 26], Cherubi: ['Cherrim', 25], Shellos: ['Gastrodon', 30], Drifloon: ['Drifblim', 28],
    Buneary: ['Lopunny', 25], Glameow: ['Purugly', 38], Stunky: ['Skuntank', 34], Bronzor: ['Bronzong', 33], Gible: ['Gabite', 24], Gabite: ['Garchomp', 48], Riolu: ['Lucario', 25],
    Hippopotas: ['Hippowdon', 34], Skorupi: ['Drapion', 40], Croagunk: ['Toxicroak', 37], Finneon: ['Lumineon', 31], Snover: ['Abomasnow', 40], Chingling: ['Chimecho', 20], Bonsly: ['Sudowoodo', 20],
    'Mime Jr.': ['Mr. Mime', 20], Happiny: ['Chansey', 20], Munchlax: ['Snorlax', 30], Mantyke: ['Mantine', 25] });
  const CROSS4 = { Magneton: ['Magnezone', 40], Rhydon: ['Rhyperior', 55], Electabuzz: ['Electivire', 45], Magmar: ['Magmortar', 45], Togetic: ['Togekiss', 40], Yanma: ['Yanmega', 30],
    Gligar: ['Gliscor', 35], Piloswine: ['Mamoswine', 45], 'Porygon2': ['Porygon-Z', 45], Kirlia: ['Gardevoir', 30], Dusclops: ['Dusknoir', 45], Sneasel: ['Weavile', 35], Murkrow: ['Honchkrow', 35],
    Misdreavus: ['Mismagius', 35], Aipom: ['Ambipom', 32], Lickitung: ['Lickilicky', 40], Tangela: ['Tangrowth', 40], Nosepass: ['Probopass', 40], Roselia: ['Roserade', 30] };
  const saved = {};
  function crossOn(on) { for (const [a, v] of Object.entries(CROSS4)) { if (on) { if (!(a in saved)) saved[a] = EVO[a]; EVO[a] = v; } else if (a in saved) { if (saved[a] === undefined) delete EVO[a]; else EVO[a] = saved[a]; delete saved[a]; } } }
  window.onRegionApplied = R => crossOn(R === 'sinnoh');   // Gen 4 evolutions of older Pokémon: Sinnoh only
  /* ---------- register Sinnoh ---------- */
  window.SINNOH = { gyms: GYMS_S, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_S, minors: MINORS_S, starters: ['Turtwig', 'Chimchar', 'Piplup'],
    badges: ['coal', 'forest', 'relic', 'cobble', 'fen', 'mine', 'icicle', 'beacon', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Starly', 'Buizel', '*1'], ['Staravia', 'Floatzel', 'Roselia', '*1'], ['Staraptor', 'Floatzel', 'Heracross', 'Snorlax', '*2']],
    rival: { file: 'Barry', leader: 'Barry' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter: barryCounter, rivalKey: 'rivalS', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { sinnoh: EV });
  /* ---------- Combined: after Hoenn’s Champion, set sail for Sinnoh ---------- */
  let offering = false;
  async function offerSinnoh() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || s.phase !== 'hoenn' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Hoenn’s Champion as well! A ship leaves Lilycove for Sinnoh — a land of snowy peaks, ancient myths, and Mt. Coronet.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Set sail for Sinnoh</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.hoenn = { badges: s.badges, at: Date.now() }; s.phase = 'sinnoh'; s.badges = 0; saveStory(); if (typeof syncRegion === 'function') syncRegion(); renderStory(); setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  const _open = openStoryScreen; openStoryScreen = function () { const r = _open.apply(this, arguments); setTimeout(offerSinnoh, 930); return r; };
  /* ---------- post-game: Arceus at the Hall of Origin ---------- */
  let offeringArc = false;
  async function offerArceus() {
    const s = STORY.save; if (offeringArc || !s || STORY.region !== 'sinnoh' || s.badges < TOTAL || s.arceus || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringArc = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Sinnoh’s Champion! At the summit of Mt. Coronet, a stairway of light appears — leading to the Hall of Origin…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Climb to the Hall of Origin</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await climbHall();
    } finally { offeringArc = false; STORY.cutscene = false; }
  }
  async function climbHall() {
    const s = STORY.save, who = { file: 'Arceus', leader: 'Arceus' };
    closeModal();
    await playScene([['foe', '…………'], ['me', 'Arceus — the Original One, who shaped the universe. Everyone, give it everything!']], who, { title: 'Hall of Origin', text: 'Your whole team against Arceus itself — the Pokémon said to have created the world.' });
    STORY.battle = { gym: 9, arceus: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.8, aiStyle: 'switcher', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Arceus'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Arceus'], arena('hall', 'grand')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.climbHallOfOrigin = climbHall;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.arceus) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.arceus = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Arceus', 80); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['me', 'The light is fading… Arceus is coming with us. Unbelievable.']] : [['foe', '…………']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open2 = openStoryScreen; openStoryScreen = function () { const r = _open2.apply(this, arguments); setTimeout(offerArceus, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
  crossOn(STORY.region === 'sinnoh');
})();
