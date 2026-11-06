/* =====================================================================
   Section 42: UNOVA — the fifth story region (registers with the region
   switch in johto.js; earlier regions are untouched)
   ===================================================================== */
(function unovaRegion() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA || typeof applyRegion !== 'function') return;
  const D = STORY_DATA, $ = id => document.getElementById(id), arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';
  const G = (n, rk, style, leader, file, city, type, badge, ar, team, levels, hello, win, lose) => ({ n, rulesKey: rk, style, leader, file, city, type, badge, arena: ar, x: 0, y: 0, team, levels, hello, win, lose });
  // Striaton: the leader whose type beats your starter (as in Black and White)
  const TRIO = {
    Chili: { type: 'Fire', team: ['Pansear', 'Darumaka', 'Litwick', 'Growlithe', 'Vulpix', 'Ponyta'], hello: 'I’m Chili! Ta-da! The Fire-type scorcher! I’ll burn you to a crisp!' },
    Cress: { type: 'Water', team: ['Panpour', 'Tympole', 'Ducklett', 'Frillish', 'Psyduck', 'Wingull'], hello: 'I’m Cress, the Water-type expert. Allow me to show you a refreshing battle.' },
    Cilan: { type: 'Grass', team: ['Pansage', 'Petilil', 'Cottonee', 'Sewaddle', 'Deerling', 'Oddish'], hello: 'I’m Cilan, Grass-type connoisseur. Allow me to serve you a battle of the finest vintage.' } };
  const GYMS_U = [
    G(1, 'u1', 'aggro', 'Chili', 'Chili', 'Striaton City', 'Fire', 'Trio Badge', arena('plaza', 'grand'), TRIO.Chili.team, [12, 13, 13, 14, 14, 15], TRIO.Chili.hello, 'Too hot for you!', 'You’re strong… Take the Trio Badge!'),
    G(2, 'u2', 'defensive', 'Lenora', 'Lenora', 'Nacrene City', 'Normal', 'Basic Badge', arena('grand', 'plaza'), ['Herdier', 'Watchog', 'Minccino', 'Audino', 'Pidove', 'Bouffalant'], [18, 19, 19, 20, 20, 22],
      'I’m Lenora, the museum director and Gym Leader. Let’s research how you battle!', 'Research complete — you need more training.', 'Wonderful! The Basic Badge is yours.'),
    G(3, 'u3', 'switcher', 'Burgh', 'Burgh', 'Castelia City', 'Bug', 'Insect Badge', arena('ruins', 'plaza'), ['Whirlipede', 'Dwebble', 'Karrablast', 'Shelmet', 'Joltik', 'Leavanny'], [22, 23, 23, 24, 25, 26],
      'I’m Burgh, artist and Gym Leader! My Bug Pokémon are my muse — let’s make a masterpiece!', 'A masterpiece!', 'Oh, my inspiration! Take the Insect Badge.'),
    G(4, 'u4', 'status', 'Elesa', 'Elesa', 'Nimbasa City', 'Electric', 'Bolt Badge', arena('vermilion', 'plaza'), ['Emolga', 'Zebstrika', 'Eelektrik', 'Klang', 'Pachirisu', 'Galvantula'], [26, 27, 27, 28, 29, 30],
      'I’m Elesa. My Electric Pokémon will dazzle you — shall we take the runway?', 'Simply electrifying.', 'You were a little more fabulous than I expected. The Bolt Badge is yours.'),
    G(5, 'u5', 'defensive', 'Clay', 'Clay', 'Driftveil City', 'Ground', 'Quake Badge', arena('cavern', 'meteor'), ['Krokorok', 'Palpitoad', 'Golett', 'Stunfisk', 'Sandslash', 'Excadrill'], [30, 31, 31, 32, 33, 34],
      'I’m Clay. I struck it rich digging up this town — and I dig a good battle too!', 'Still got the rough edges.', 'Well, I’ll be! The Quake Badge is yours.'),
    G(6, 'u6', 'aggro', 'Skyla', 'Skyla', 'Mistralton City', 'Flying', 'Jet Badge', arena('castle', 'summit'), ['Swoobat', 'Unfezant', 'Swanna', 'Sigilyph', 'Archeops', 'Braviary'], [34, 35, 35, 36, 37, 38],
      'I’m Skyla! Let’s battle in the sky — prepare for take-off!', 'Smooth landing — for me!', 'You’re amazing! The Jet Badge is yours.'),
    G(7, 'u7', 'defensive', 'Brycen', 'Brycen', 'Icirrus City', 'Ice', 'Freeze Badge', arena('cavern', 'ice'), ['Vanillish', 'Cryogonal', 'Beartic', 'Glaceon', 'Weavile', 'Mamoswine'], [38, 39, 39, 40, 41, 42],
      'I am Brycen. Your battle spirit will be put to the test by the cold of Icirrus.', 'Your spirit froze.', 'Your spirit is strong. The Freeze Badge is yours.'),
    G(8, 'u8', 'aggro', 'Drayden', 'Drayden', 'Opelucid City', 'Dragon', 'Legend Badge', arena('summit', 'castle'), ['Druddigon', 'Flygon', 'Zweilous', 'Altaria', 'Dragonite', 'Haxorus'], [42, 43, 43, 44, 45, 47],
      'I am Drayden, Mayor of Opelucid. Show me the truth — or the ideals — that drive you.', 'Not yet.', 'Wonderful. The Legend Badge is yours.'),
    G(9, 'u9', 'switcher', 'Grimsley', 'Grimsley', 'Pokémon League', 'Dark', 'Elite Four', arena('grand', 'hall'), ['Liepard', 'Scrafty', 'Krookodile', 'Bisharp', 'Mandibuzz', 'Hydreigon'], [48, 49, 49, 50, 51, 52],
      'I am Grimsley of the Elite Four. Life is a serious battle — and the dice always roll in the end.', 'The dice rolled my way.', 'Whether you win or lose, you gamble with everything. Go on — the Champion awaits.'),
    G(10, 'u10', 'switcher', 'Alder', 'Alder', 'Pokémon League', 'Champion', 'Champion', arena('hall', 'grand'), ['Accelgor', 'Bouffalant', 'Druddigon', 'Vanilluxe', 'Escavalier', 'Volcarona'], [55, 56, 56, 57, 57, 60],
      'I’m Alder, Champion of Unova. Let me feel the bond between you and your Pokémon!', 'A good battle — come again.', 'Bravo! You are the Champion of Unova!')
  ];
  GYMS_U[9].pickTeam = () => GYMS_U[9].team.slice();
  // which starter line a Pokémon belongs to (every region's starters, by type)
  const STARTER_TYPE = {};
  for (const [t, names] of Object.entries({
    grass: ['Snivy', 'Servine', 'Serperior', 'Turtwig', 'Grotle', 'Torterra', 'Treecko', 'Grovyle', 'Sceptile', 'Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur'],
    fire: ['Tepig', 'Pignite', 'Emboar', 'Chimchar', 'Monferno', 'Infernape', 'Torchic', 'Combusken', 'Blaziken', 'Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard'],
    water: ['Oshawott', 'Dewott', 'Samurott', 'Piplup', 'Prinplup', 'Empoleon', 'Mudkip', 'Marshtomp', 'Swampert', 'Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise'] })) for (const n of names) STARTER_TYPE[n] = t;
  const base = n => String(n || '').split('|')[0];
  // The journey's own starter decides: the one recorded when it began, else the first starter on the current team,
  // and only then any starter in the Pokédex (earlier runs keep their Pokédex, so it must not take priority).
  function starterType() {
    const s = STORY.save; if (!s) return 'grass';
    if (s.starter && STARTER_TYPE[base(s.starter)]) return STARTER_TYPE[base(s.starter)];
    for (const n of s.team || []) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    for (const n of Object.keys(s.dex || {})) if (STARTER_TYPE[base(n)]) return STARTER_TYPE[base(n)];
    return 'grass';
  }
  // record the starter when a journey begins (a Pokédex run's first Pokémon is the starter you chose)
  const _saveS = saveStory;
  saveStory = function () { const s = STORY.save; if (s && !s.starter && !s.badges && (s.team || []).length && STARTER_TYPE[base(s.team[0])]) s.starter = base(s.team[0]); return _saveS.apply(this, arguments); };
  function pickTrio() { const t = starterType(), who = t === 'grass' ? 'Chili' : t === 'fire' ? 'Cress' : 'Cilan', L = TRIO[who], g = GYMS_U[0];
    Object.assign(g, { leader: who, file: who, type: L.type, team: L.team, hello: L.hello }); }
  const LINES = { grass: ['Snivy', 'Servine', 'Serperior'], fire: ['Tepig', 'Pignite', 'Emboar'], water: ['Oshawott', 'Dewott', 'Samurott'] };
  const cherenCounter = () => ({ grass: LINES.fire, fire: LINES.water, water: LINES.grass })[starterType()];
  /* ---------- the Unova map (story/unova_map.webp, 2576×1438) ---------- */
  const MAP = { img: 'story/unova_map.webp', w: 2576, h: 1438, home: { x: 2300, y: 1200, city: 'Nuvema Town' },
    gyms: { 1: [2220, 820], 2: [1950, 930], 3: [1320, 1140], 4: [1420, 740], 5: [680, 1000], 6: [270, 480], 7: [600, 700], 8: [1240, 320], 9: [1540, 90], 10: [1610, 55] },
    legs: [
      [[2300, 1200], [2300, 1050], [2280, 880], [2220, 820]],
      [[2220, 820], [2100, 880], [1950, 930]],
      [[1950, 930], [1850, 1000], [1750, 1060], [1600, 1100], [1320, 1140]],
      [[1320, 1140], [1310, 960], [1340, 820], [1420, 740]],
      [[1420, 740], [1200, 760], [950, 760], [800, 850], [680, 1000]],
      [[680, 1000], [650, 800], [560, 620], [400, 520], [270, 480]],
      [[270, 480], [420, 560], [600, 700]],
      [[600, 700], [400, 380], [700, 300], [1000, 300], [1240, 320]],
      [[1240, 320], [1350, 250], [1450, 160], [1540, 90]],
      [[1540, 90], [1610, 55]]
    ] };
  const NAMES = ['Routes 1 · 2 → Accumula Town → Striaton City', 'Route 3 → Wellspring Cave → Nacrene City', 'Pinwheel Forest → Skyarrow Bridge → Castelia City', 'Route 4 → Desert Resort → Nimbasa City',
    'Route 5 → Driftveil Drawbridge → Driftveil City', 'Route 6 → Chargestone Cave → Mistralton City', 'Route 7 → Twist Mountain → Icirrus City', 'Dragonspiral Tower → Route 8 → Opelucid City',
    'Routes 9 · 10 → Victory Road → Pokémon League', 'Pokémon League · the Champion’s room', 'Route 11 → Giant Chasm'];
  const ASH = [[1610, 55], [1900, 150], [2200, 300]];
  const ROUTES_U = [
    { leg: 0, name: 'Routes 1 · 2 · 3', scene: 'meadow', mons: [['Patrat', 2, 4, 10], ['Lillipup', 2, 4, 10], ['Purrloin', 3, 5, 7], ['Pidove', 3, 5, 7], ['Sewaddle', 3, 5, 5], ['Blitzle', 4, 5, 4], ['Pansage', 5, 5, 1], ['Pansear', 5, 5, 1], ['Panpour', 5, 5, 1], ['Audino', 5, 5, .8]] },
    { leg: 1, name: 'Wellspring Cave · Dreamyard', scene: 'cave', mons: [['Munna', 8, 10, 6], ['Roggenrola', 8, 10, 7], ['Woobat', 8, 10, 7], ['Drilbur', 9, 11, 5], ['Tympole', 8, 10, 5], ['Purrloin', 8, 10, 5], ['Audino', 10, 10, 1]] },
    { leg: 2, name: 'Pinwheel Forest · Skyarrow Bridge', scene: 'forest', mons: [['Sewaddle', 12, 14, 7], ['Venipede', 12, 14, 6], ['Cottonee', 12, 14, 5], ['Petilil', 12, 14, 5], ['Timburr', 12, 14, 6], ['Throh', 14, 14, 2], ['Sawk', 14, 14, 2], ['Tympole', 12, 14, 5], ['Basculin', 13, 15, 3]] },
    { leg: 3, name: 'Route 4 · Desert Resort · Relic Castle', scene: 'safari', mons: [['Sandile', 16, 18, 8], ['Darumaka', 16, 18, 5], ['Scraggy', 16, 18, 5], ['Dwebble', 16, 18, 5], ['Trubbish', 16, 18, 5], ['Minccino', 16, 18, 5], ['Sigilyph', 18, 18, 2], ['Yamask', 17, 19, 4], ['Gothita', 16, 18, 3], ['Solosis', 16, 18, 3]] },
    { leg: 4, name: 'Route 5 · Driftveil Drawbridge', scene: 'city', mons: [['Minccino', 20, 22, 6], ['Liepard', 21, 23, 4], ['Trubbish', 20, 22, 5], ['Gothita', 20, 22, 4], ['Solosis', 20, 22, 4], ['Ducklett', 20, 22, 6], ['Zebstrika', 22, 22, 2], ['Emolga', 21, 23, 3]] },
    { leg: 5, name: 'Route 6 · Chargestone Cave', scene: 'cave', mons: [['Joltik', 24, 26, 8], ['Ferroseed', 24, 26, 6], ['Klink', 24, 26, 6], ['Tynamo', 24, 26, 3], ['Boldore', 25, 27, 4], ['Deerling', 24, 26, 5], ['Karrablast', 24, 26, 4], ['Shelmet', 24, 26, 4], ['Foongus', 24, 26, 5], ['Swadloon', 25, 27, 4]] },
    { leg: 6, name: 'Route 7 · Twist Mountain · Celestial Tower', scene: 'mountain', mons: [['Cubchoo', 30, 32, 7], ['Vanillite', 30, 32, 6], ['Litwick', 30, 32, 5], ['Elgyem', 30, 32, 4], ['Tranquill', 30, 32, 5], ['Gurdurr', 31, 33, 4], ['Boldore', 31, 33, 5], ['Cryogonal', 32, 32, 2], ['Mienfoo', 30, 32, 4], ['Cobalion', 42, 42, .03]] },
    { leg: 7, name: 'Dragonspiral Tower · Route 9 · Victory Road', scene: 'tower', mons: [['Druddigon', 36, 38, 3], ['Golett', 36, 38, 5], ['Rufflet', 36, 38, 4], ['Vullaby', 36, 38, 4], ['Pawniard', 36, 38, 5], ['Bouffalant', 37, 39, 3], ['Heatmor', 37, 39, 3], ['Durant', 37, 39, 3], ['Axew', 36, 36, .8], ['Deino', 36, 36, .6], ['Larvesta', 36, 36, .5],
      ['Terrakion', 42, 42, .03], ['Virizion', 42, 42, .03], ['Tornadus', 42, 42, .03], ['Reshiram', 50, 50, .02], ['Zekrom', 50, 50, .02], ['Kyurem', 50, 50, .02]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));
  const T = (id, name, keys, where, at, unlock, ai, ar, team, hello, lose, win) => ({ id, name, keys, where, at, unlock, ai, arena: ar, team, hello, lose, win });
  const MINORS_U = [
    T('u-youngster', 'Youngster Jimmy', ['youngster'], 'Route 2', [2290, 1000], 0, 1, arena('plaza'), [['Patrat', 6], ['Lillipup', 6], ['Purrloin', 7]], 'My Pokémon and I are just starting out too! Battle!', 'Aww, nice job.', 'Yes!'),
    T('u-lass', 'Lass Sara', ['lass', 'picnicker'], 'Dreamyard', [2080, 900], 1, 2, arena('ruins'), [['Munna', 10], ['Pidove', 10], ['Cottonee', 11]], 'They say the Dreamyard shows you strange dreams…', 'Like a dream…', 'Sweet dreams!'),
    T('u-backpacker', 'Backpacker Kiyo', ['backpacker', 'hiker'], 'Pinwheel Forest', [1800, 1030], 2, 3, arena('ruins'), [['Timburr', 15], ['Venipede', 15], ['Sewaddle', 16], ['Throh', 17]], 'I’ve hiked every trail in Pinwheel Forest!', 'Lost the trail…', 'Onward!'),
    T('u-ruin', 'Ruin Maniac Dan', ['ruinmaniac', 'hiker'], 'Desert Resort', [1320, 900], 3, 4, arena('oasis', 'cavern'), [['Sandile', 20], ['Yamask', 21], ['Dwebble', 21], ['Sigilyph', 22]], 'Relic Castle holds secrets older than Unova itself!', 'Buried in sand…', 'Treasure!'),
    T('u-worker', 'Worker Tim', ['worker', 'hiker'], 'Route 5', [1000, 760], 4, 4, arena('plaza'), [['Timburr', 24], ['Roggenrola', 24], ['Gurdurr', 25], ['Boldore', 26]], 'We build bridges and we build muscle!', 'Break time…', 'Back to work!'),
    T('u-scientist', 'Scientist Ann', ['scientist'], 'Chargestone Cave', [600, 700], 5, 5, arena('cavern'), [['Joltik', 28], ['Klink', 28], ['Ferroseed', 29], ['Eelektrik', 30]], 'The magnetic stones here are fascinating — let me show you!', 'Data acquired…', 'Hypothesis confirmed!'),
    T('u-skier', 'Skier Rae', ['skier', 'boarder'], 'Twist Mountain', [460, 600], 6, 6, arena('cavern', 'ice'), [['Cubchoo', 34], ['Vanillish', 34], ['Cryogonal', 35], ['Beartic', 36]], 'Twist Mountain in winter is the best run in Unova!', 'Wiped out!', 'Fresh powder!'),
    T('u-veteran', 'Veteran Chaz', ['veteran', 'cooltrainermale', 'cooltrainerm'], 'Victory Road', [1420, 200], 8, 7, arena('castle'), [['Haxorus', 48], ['Chandelure', 48], ['Conkeldurr', 49], ['Hydreigon', 50]], 'Victory Road is where legends are made.', 'You might be one.', 'Turn back.')
  ];
  Object.assign(D.RULES, {
    u1: { title: 'Type advantage', text: 'The Striaton leader you face uses the type that beats your starter.' },
    u2: { handicap: 4, title: 'Museum rules', text: 'Lenora’s museum is crowded: bring only your first FOUR Pokémon.' },
    u3: { banA: ['Fire'], title: 'Art gallery', text: 'No open flames in Burgh’s gallery: your FIRE moves are banned.' },
    u4: { weather: 'rain', title: 'Runway storm', text: 'Permanent RAIN: Water moves 50% harder, Fire moves 50% weaker.' },
    u5: { weather: 'sand', title: 'Mine dust', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    u6: { banA: ['Electric'], title: 'Grounded wires', text: 'Skyla’s cannon gym grounds all electricity: your ELECTRIC moves are banned.' },
    u7: { weather: 'hail', title: 'Icirrus cold', text: 'Permanent HAIL chips every Pokémon that isn’t Ice.' },
    u8: { banA: ['Ice', 'Fairy'], title: 'Dragon’s ideals', text: 'Drayden’s gym repels the dragons’ weaknesses: your ICE and FAIRY moves are banned.' },
    u9: { handicap: 4, title: 'High stakes', text: 'Grimsley bets it all: bring only your first FOUR Pokémon.' }
  });
  Object.assign(D.SCRIPT.gym, {
    u1: [['foe', 'Welcome to the Striaton Restaurant — and Gym! Today’s special: a battle chosen just for you.'], ['me', 'I’ll take it.']],
    u2: [['foe', 'I’m Lenora! Let’s see what kind of trainer you are — I’ll research you thoroughly!'], ['me', 'Let’s go.']],
    u3: [['foe', 'Ah, a challenger! My Bug Pokémon and I will paint a masterpiece!'], ['me', 'Let’s see it.']],
    u4: [['foe', 'Welcome. I’m Elesa — let’s make this battle shine.'], ['me', 'Bring the lights.']],
    u5: [['foe', 'Clay’s the name. I dig deep — in mines and in battles!'], ['me', 'Let’s dig in.']],
    u6: [['foe', 'Welcome aboard! I’m Skyla — fasten your seatbelt!'], ['me', 'Ready for take-off.']],
    u7: [['foe', 'I am Brycen. The cold of Icirrus will test your spirit.'], ['me', 'Test it, then.']],
    u8: [['foe', 'I am Drayden. Show me your truth, or your ideals.'], ['me', 'Here they are.']],
    u9: [['foe', 'Grimsley. Life is a gamble — let’s see your hand.'], ['me', 'All in.']]
  });
  const CHAMP = { cocky: [['foe', 'I’m Alder, the Champion! Let’s have a fun battle!'], ['me', 'Let’s go, Alder!']] }; CHAMP.rattled = CHAMP.cocky; CHAMP.bitter = CHAMP.cocky;
  const RIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', 'I’m Cheren. I want to become the Champion — so I need to know how strong I am. Battle me.'], ['me', 'Let’s go, Cheren!']], rattled: [['foe', 'I lost last time. I’ve been analyzing why.']], bitter: [['foe', 'Why do you keep winning? What does strength even mean?']] },
      { cocky: [['foe', 'Mistralton’s Gym Leader is tough. I need to be tougher. Battle me.']], rattled: [['foe', 'My Pokémon have grown. I’ve grown too.']], bitter: [['foe', 'I’ve been thinking — maybe strength isn’t just winning.']] },
      { cocky: [['foe', 'Before the League, let’s see who’s stronger — once and for all.']], rattled: [['foe', 'One more battle. I need to know.']], bitter: [['foe', 'Whatever happens, I’m glad we traveled together. Now — battle!']] }
    ],
    win: { cocky: [['foe', 'I see… I need to rethink my approach.']], rattled: [['foe', 'Again… I won’t give up.']], bitter: [['foe', 'You really are strong. Go win it all.']] },
    lose: { cocky: [['foe', 'As I calculated.']], rattled: [['foe', 'My analysis was right this time.']], bitter: [['foe', 'I won… and somehow it doesn’t matter as much as I thought.']] }
  };
  const EV = {
    1: { id: 'udream', title: 'The Dreamyard', arena: arena('ruins', 'meteor'), text: 'Team Plasma is hurting Munna in the Dreamyard! Two Plasma battles back to back — no healing between.',
      before: [['foe', 'Team Plasma will liberate Pokémon from people! Starting with this Munna!'], ['me', 'You’re hurting it! Stop!']],
      stages: [{ name: 'Plasma Grunt', keys: ['plasmagrunt', 'teamplasmagrunt', 'plasma'], team: ['Patrat', 'Purrloin', 'Trubbish'], style: 'aggro' }, { name: 'Plasma Grunt', keys: ['plasmagrunt', 'teamplasmagrunt', 'plasma'], team: ['Watchog', 'Scraggy', 'Sandile'], style: 'switcher', line: 'You won’t get past me too!' }],
      win: [['foe', 'Retreat! Report to Lord Ghetsis!']], lose: [['foe', 'Pokémon must be liberated!']] },
    3: { id: 'unferris', title: 'The Ferris wheel', format: '1v1', name: 'N', keys: ['n'], team: ['Zorua'], style: 'switcher', arena: arena('plaza'),
      text: 'N wants to battle at the top of the Nimbasa Ferris wheel: a 1v1 — your lead against his Zorua.',
      before: [['foe', 'I am the king of Team Plasma. I will liberate all Pokémon.'], ['foe', 'Let me hear your Pokémon’s voice.'], ['me', 'Then listen.']],
      win: [['foe', 'Your Pokémon say they want to stay with you… Interesting.']], lose: [['foe', 'Your Pokémon are suffering. I will free them.']] },
    4: { id: 'ucold', title: 'Cold Storage puzzle', format: 'puzzle', name: 'Worker', keys: ['worker', 'hiker'], team: ['Ferrothorn'], fixedTeam: ['Eelektrik', 'Simisage', 'Simipour', 'Darumaka'], foeScale: 1.6, style: 'defensive', arena: arena('cavern', 'vermilion'),
      text: 'Puzzle battle: a worker’s Ferrothorn guards Cold Storage. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'Nobody gets into Cold Storage past my Ferrothorn!'], ['foe', 'Here — use these. Let’s see if you can work it out.'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Fire! Grass and Steel are both weak to it — four times! Nicely done.']], lose: [['foe', 'Ferrothorn shrugs off most attacks… think about what melts steel.']] },
    6: { id: 'uspiral', title: 'Dragonspiral Tower', arena: arena('summit', 'hall'), text: 'Team Plasma is storming Dragonspiral Tower! Two Plasma battles back to back — no healing between.',
      before: [['foe', 'The legendary dragon will awaken for our king!'], ['me', 'Not while I’m here.']],
      stages: [{ name: 'Plasma Grunt', keys: ['plasmagrunt', 'teamplasmagrunt', 'plasma'], team: ['Liepard', 'Garbodor', 'Krokorok'], style: 'aggro' }, { name: 'Sage Zinzolin', keys: ['zinzolin', 'sage'], team: ['Cryogonal', 'Weavile', 'Klang'], style: 'status', line: 'I am Zinzolin, one of the Seven Sages. You will go no further.' }],
      win: [['foe', 'It matters not. N has already found the dragon.']], lose: [['foe', 'Glory to Team Plasma!']] },
    7: { id: 'unchallenge', title: 'N’s challenge', arena: arena('hall', 'castle'), text: 'N has awakened Zekrom! N, then the legendary dragon itself — back to back, no healing between.',
      before: [['foe', 'Zekrom has chosen me as its hero. Show me your ideals — or your truth.'], ['me', 'I’ll show you both.']],
      stages: [{ name: 'N', keys: ['n'], team: ['Zoroark', 'Carracosta', 'Vanilluxe', 'Archeops', 'Klinklang'], style: 'switcher' }, { name: 'Zekrom', keys: [], team: ['Zekrom'], foeScale: .85, style: 'aggro', line: 'Zekrom roars with black lightning!' }],
      win: [['foe', 'Your bond with your Pokémon… it’s real. I was wrong.']], lose: [['foe', 'My ideals prevail.']] }
  };
  Object.assign(EVO, { Snivy: ['Servine', 17], Servine: ['Serperior', 36], Tepig: ['Pignite', 17], Pignite: ['Emboar', 36], Oshawott: ['Dewott', 17], Dewott: ['Samurott', 36], Patrat: ['Watchog', 20],
    Lillipup: ['Herdier', 16], Herdier: ['Stoutland', 32], Purrloin: ['Liepard', 20], Pansage: ['Simisage', 25], Pansear: ['Simisear', 25], Panpour: ['Simipour', 25], Munna: ['Musharna', 30],
    Pidove: ['Tranquill', 21], Tranquill: ['Unfezant', 32], Blitzle: ['Zebstrika', 27], Roggenrola: ['Boldore', 25], Boldore: ['Gigalith', 40], Woobat: ['Swoobat', 25], Drilbur: ['Excadrill', 31],
    Timburr: ['Gurdurr', 25], Gurdurr: ['Conkeldurr', 40], Tympole: ['Palpitoad', 25], Palpitoad: ['Seismitoad', 36], Sewaddle: ['Swadloon', 20], Swadloon: ['Leavanny', 30], Venipede: ['Whirlipede', 22],
    Whirlipede: ['Scolipede', 30], Cottonee: ['Whimsicott', 25], Petilil: ['Lilligant', 25], Sandile: ['Krokorok', 29], Krokorok: ['Krookodile', 40], Darumaka: ['Darmanitan', 35], Dwebble: ['Crustle', 34],
    Scraggy: ['Scrafty', 39], Yamask: ['Cofagrigus', 34], Tirtouga: ['Carracosta', 37], Archen: ['Archeops', 37], Trubbish: ['Garbodor', 36], Zorua: ['Zoroark', 30], Minccino: ['Cinccino', 30],
    Gothita: ['Gothorita', 32], Gothorita: ['Gothitelle', 41], Solosis: ['Duosion', 32], Duosion: ['Reuniclus', 41], Ducklett: ['Swanna', 35], Vanillite: ['Vanillish', 35], Vanillish: ['Vanilluxe', 47],
    Deerling: ['Sawsbuck', 34], Karrablast: ['Escavalier', 30], Foongus: ['Amoonguss', 39], Frillish: ['Jellicent', 40], Joltik: ['Galvantula', 36], Ferroseed: ['Ferrothorn', 40], Klink: ['Klang', 38],
    Klang: ['Klinklang', 49], Tynamo: ['Eelektrik', 39], Eelektrik: ['Eelektross', 45], Elgyem: ['Beheeyem', 42], Litwick: ['Lampent', 41], Lampent: ['Chandelure', 45], Axew: ['Fraxure', 38],
    Fraxure: ['Haxorus', 48], Cubchoo: ['Beartic', 37], Shelmet: ['Accelgor', 30], Mienfoo: ['Mienshao', 50], Golett: ['Golurk', 43], Pawniard: ['Bisharp', 52], Rufflet: ['Braviary', 54],
    Vullaby: ['Mandibuzz', 54], Deino: ['Zweilous', 50], Zweilous: ['Hydreigon', 64], Larvesta: ['Volcarona', 59] });
  window.UNOVA = { gyms: GYMS_U, map: MAP, names: NAMES, ash: ASH, routes: ROUTES_U, minors: MINORS_U, starters: ['Snivy', 'Tepig', 'Oshawott'],
    badges: ['trio', 'basic', 'insect', 'bolt', 'quake', 'jet', 'freeze', 'legend', 'elite', 'champion'], rivalAt: { 2: 0, 5: 1, 8: 2 },
    rivalBase: [['Lillipup', 'Purrloin', '*1'], ['Herdier', 'Liepard', 'Pidove', '*1'], ['Stoutland', 'Liepard', 'Unfezant', 'Simipour', '*2']],
    rival: { file: 'Cheren', leader: 'Cheren' }, rivalScript: RIVAL_SCRIPT, champ: CHAMP, counter: cherenCounter, rivalKey: 'rivalU', events: EV };
  window.REGION_EV = Object.assign(window.REGION_EV || {}, { unova: EV });
  const _onApplied = window.onRegionApplied;
  window.onRegionApplied = R => { if (_onApplied) _onApplied(R); if (R === 'unova') pickTrio(); };   // the Striaton leader follows your starter
  let offering = false;
  async function offerUnova() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || s.phase !== 'sinnoh' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Sinnoh’s Champion too! A plane leaves for faraway Unova — a land of great cities, bridges, and the legends of truth and ideals.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Fly to Unova</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.sinnoh = { badges: s.badges, at: Date.now() }; s.phase = 'unova'; s.badges = 0; saveStory(); if (typeof syncRegion === 'function') syncRegion(); renderStory(); setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  const _open = openStoryScreen; openStoryScreen = function () { if (STORY.region === 'unova') pickTrio(); const r = _open.apply(this, arguments); setTimeout(offerUnova, 940); return r; };
  const _card = openGymCard; openGymCard = function () { if (STORY.region === 'unova') pickTrio(); return _card.apply(this, arguments); };   // a new journey's starter decides too
  /* ---------- post-game: Kyurem in the Giant Chasm ---------- */
  let offeringK = false;
  async function offerKyurem() {
    const s = STORY.save; if (offeringK || !s || STORY.region !== 'unova' || s.badges < TOTAL || s.kyurem || !STORY.open || STORY.cutscene || STORY.battle) return;
    offeringK = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Unova’s Champion! An icy wind howls out of the Giant Chasm — something ancient sleeps at its frozen heart…</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Enter the Giant Chasm</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false; if (go) await enterChasm();
    } finally { offeringK = false; STORY.cutscene = false; }
  }
  async function enterChasm() {
    const s = STORY.save, who = { file: 'Kyurem', leader: 'Kyurem' };
    closeModal();
    await playScene([['foe', 'KYUUUUURRRR!'], ['me', 'Kyurem — the empty shell of the dragon of legend. Everyone, together!']], who, { title: 'Giant Chasm', text: 'Your whole team against Kyurem, in a permanent blizzard — HAIL chips every Pokémon that isn’t Ice.' });
    STORY.battle = { gym: 9, kyurem: true, level: 13, practice: false };
    STORY.nextRules = { foeScale: D.diff().scale * 1.8, aiStyle: 'aggro', weather: 'hail', bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = 'Kyurem'; loadTrainer(s.trainer);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), ['Kyurem'], arena('cavern', 'ice')); STORY.battle.G = G; STORY.battle.who = who;
  }
  window.enterGiantChasm = enterChasm;
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.kyurem) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save;
    if (won) { s.kyurem = Date.now(); if (typeof isDexSave === 'function' && isDexSave(s) && typeof dexAdd === 'function') dexAdd(s, 'Kyurem', 75); } saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene(won ? [['me', 'The ice is melting… Kyurem has calmed down — and it wants to come with us!']] : [['foe', 'KYUUURRR!']], b.who);
    try { renderStory(); } catch (e) { }
  };
  const _open2 = openStoryScreen; openStoryScreen = function () { const r = _open2.apply(this, arguments); setTimeout(offerKyurem, 1000); return r; };
  if (typeof syncRegion === 'function') syncRegion();
  if (STORY.region === 'unova') pickTrio();
})();
