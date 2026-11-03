/* =====================================================================
   Section 36: JOHTO — the second story region (like DLC)
   Three story types for a new journey: Kanto (exactly the original), Johto,
   or Combined (Kanto, then set sail for Johto with the same team).
   Loading a journey switches the region: gyms, map, routes, route trainers,
   starters, badges, the rival (Silver), events and evolutions. Kanto's own
   data is snapshotted at load and restored exactly for Kanto journeys.
   ===================================================================== */
(function johtoRegion() {
  if (typeof STORY === 'undefined' || typeof GYMS === 'undefined' || typeof KANTO === 'undefined' || !window.STORY_DATA) return;
  const $ = id => document.getElementById(id), D = STORY_DATA;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const arena = (...ids) => ids.find(id => typeof STAGES !== 'undefined' && STAGES[id]) || 'random';

  /* ---------- Johto's gym leaders, Elite Four member and Champion ---------- */
  const J = [
    { n: 1, rulesKey: 'j1', style: 'aggro', leader: 'Falkner', file: 'Falkner', city: 'Violet City', type: 'Flying', badge: 'Zephyr Badge', arena: arena('castle', 'summit'), x: 395, y: 240,
      team: ['Hoothoot', 'Spearow', 'Natu', 'Doduo', 'Farfetch’d', 'Pidgeotto'], levels: [9, 10, 10, 11, 12, 13],
      hello: 'People call Flying Pokémon weak. I’ll show you the real power of the magnificent bird Pokémon!', win: 'Grounded! Come back when you can reach the sky.', lose: 'For my father’s sake… take the Zephyr Badge.' },
    { n: 2, rulesKey: 'j2', style: 'switcher', leader: 'Bugsy', file: 'Bugsy', city: 'Azalea Town', type: 'Bug', badge: 'Hive Badge', arena: arena('ruins', 'meteor'), x: 375, y: 400,
      team: ['Ledyba', 'Spinarak', 'Paras', 'Metapod', 'Kakuna', 'Scyther'], levels: [14, 15, 15, 16, 16, 18],
      hello: 'I’ve studied Bug Pokémon more than anyone. Let me show you what I’ve learned!', win: 'My research pays off! Study harder.', lose: 'Whoa, amazing! You’re an expert on Pokémon! Here’s the Hive Badge.' },
    { n: 3, rulesKey: 'j3', style: 'aggro', leader: 'Whitney', file: 'Whitney', city: 'Goldenrod City', type: 'Normal', badge: 'Plain Badge', arena: arena('plaza', 'grand'), x: 265, y: 200,
      team: ['Sentret', 'Aipom', 'Teddiursa', 'Clefairy', 'Snubbull', 'Miltank'], levels: [18, 19, 19, 20, 20, 22],
      hello: 'Everyone was into Pokémon, so I got into it too! They’re super cute — and super strong!', win: 'Waaah… just kidding! I won! Hehe.', lose: '…Sniff… Waaaah! Fine, take the Plain Badge!' },
    { n: 4, rulesKey: 'j4', style: 'status', leader: 'Morty', file: 'Morty', city: 'Ecruteak City', type: 'Ghost', badge: 'Fog Badge', arena: arena('meteor', 'cavern'), x: 345, y: 155,
      team: ['Murkrow', 'Noctowl', 'Misdreavus', 'Hypno', 'Xatu', 'Gengar'], levels: [23, 24, 24, 25, 25, 27],
      hello: 'I see the legendary rainbow Pokémon in my visions. Will it appear before you? Let us find out.', win: 'Your vision is still clouded.', lose: 'I see… your journey will take you far. The Fog Badge is yours.' },
    { n: 5, rulesKey: 'j5', style: 'aggro', leader: 'Chuck', file: 'Chuck', city: 'Cianwood City', type: 'Fighting', badge: 'Storm Badge', arena: arena('cerulean', 'summit'), x: 85, y: 240,
      team: ['Machoke', 'Hitmontop', 'Primeape', 'Heracross', 'Granbull', 'Poliwrath'], levels: [27, 28, 28, 29, 29, 31],
      hello: 'WAHAHAH! I train under the waterfall every day! You’ll never beat my fighting spirit!', win: 'HAH! More training under the falls for you!', lose: 'Gwaaah! You’re strong! Take the Storm Badge!' },
    { n: 6, rulesKey: 'j6', style: 'defensive', leader: 'Jasmine', file: 'Jasmine', city: 'Olivine City', type: 'Steel', badge: 'Mineral Badge', arena: arena('vermilion', 'castle'), x: 315, y: 300,
      team: ['Magneton', 'Skarmory', 'Forretress', 'Scizor', 'Ampharos', 'Steelix'], levels: [30, 31, 31, 32, 33, 35],
      hello: '…Thank you for helping at the lighthouse. But this is different. Please, let me show you my Steel Pokémon.', win: 'Um… I’m sorry. Please train a little more.', lose: '…You’re a better trainer than me. Please accept the Mineral Badge.' },
    { n: 7, rulesKey: 'j7', style: 'defensive', leader: 'Pryce', file: 'Pryce', city: 'Mahogany Town', type: 'Ice', badge: 'Glacier Badge', arena: arena('cavern', 'ice'), x: 490, y: 160,
      team: ['Dewgong', 'Piloswine', 'Sneasel', 'Delibird', 'Jynx', 'Lapras'], levels: [32, 33, 33, 34, 35, 36],
      hello: 'Pokémon have many experiences in their lives, just like us. I have seen and suffered much. Let me show you what I mean.', win: 'Hmm. The ice did not crack.', lose: 'Ah, I am impressed by your prowess. The Glacier Badge is yours.' },
    { n: 8, rulesKey: 'j8', style: 'aggro', leader: 'Clair', file: 'Clair', city: 'Blackthorn City', type: 'Dragon', badge: 'Rising Badge', arena: arena('summit', 'castle'), x: 580, y: 155,
      team: ['Arbok', 'Gyarados', 'Aerodactyl', 'Charizard', 'Dragonair', 'Kingdra'], levels: [36, 37, 38, 38, 39, 41],
      hello: 'I am Clair, the world’s best Dragon master. Do you still want to take me on?', win: 'Hmph. As expected.', lose: '…I lost? I don’t believe it. …Fine. The Rising Badge is yours.' },
    { n: 9, rulesKey: 'j9', style: 'switcher', leader: 'Karen', file: 'Karen', city: 'Indigo Plateau', type: 'Dark', badge: 'Elite Four', arena: arena('grand', 'hall'), x: 775, y: 180,
      team: ['Crobat', 'Vileplume', 'Weezing', 'Houndoom', 'Tyranitar', 'Umbreon'], levels: [45, 46, 46, 47, 48, 50],
      hello: 'I am Karen of the Elite Four. Strong Pokémon, weak Pokémon — that is only selfish perception. Truly skilled trainers try to win with their favorites.', win: 'You remind me of who I was before I learned that.', lose: 'Well, aren’t you good. I like that in a trainer. Go on — the Champion is waiting.' },
    { n: 10, rulesKey: 'j10', style: 'switcher', leader: 'Silver', file: 'Silver', city: 'Indigo Plateau', type: 'Rival', badge: 'Champion', arena: arena('hall', 'grand'), x: 805, y: 155,
      team: ['Sneasel', 'Crobat', 'Magneton', 'Gengar', 'Alakazam', 'Feraligatr'], levels: [52, 53, 52, 54, 54, 56],
      hello: 'So you made it here. I’ve been waiting — the Champion’s room is mine.', win: 'Hmph. Still weak.', lose: '…I lost. But I’m not the same as before. Neither are my Pokémon.' }
  ];
  // Silver takes the Johto starter that is strong against yours
  const LINES = { grass: ['Chikorita', 'Bayleef', 'Meganium'], fire: ['Cyndaquil', 'Quilava', 'Typhlosion'], water: ['Totodile', 'Croconaw', 'Feraligatr'] };
  function silverCounter() {
    const s = STORY.save, have = new Set([...(s && s.team || []), ...Object.keys((s && s.dex) || {})].map(n => String(n).split('|')[0]));
    const has = (...ns) => ns.some(n => have.has(n));
    if (has('Chikorita', 'Bayleef', 'Meganium', 'Bulbasaur', 'Ivysaur', 'Venusaur')) return LINES.fire;
    if (has('Cyndaquil', 'Quilava', 'Typhlosion', 'Charmander', 'Charmeleon', 'Charizard')) return LINES.water;
    if (has('Totodile', 'Croconaw', 'Feraligatr', 'Squirtle', 'Wartortle', 'Blastoise')) return LINES.grass;
    return LINES.water;
  }
  J[9].pickTeam = () => ['Sneasel', 'Crobat', 'Magneton', 'Gengar', 'Alakazam', silverCounter()[2]];

  /* ---------- the Johto map (story/johto_map.webp, 2576×1438) ---------- */
  const JMAP = { img: 'story/johto_map.webp', w: 2576, h: 1438, home: { x: 2230, y: 1010, city: 'New Bark Town' },
    gyms: { 1: [1180, 720], 2: [1120, 1200], 3: [800, 600], 4: [1040, 470], 5: [260, 720], 6: [940, 900], 7: [1470, 480], 8: [1740, 460], 9: [2330, 540], 10: [2420, 455] },
    legs: [
      [[2230, 1010], [2050, 1000], [1880, 1005], [1700, 1000], [1450, 995], [1380, 930], [1300, 860], [1230, 790], [1180, 720]],      // Route 29 → Cherrygrove → Routes 30 · 31
      [[1180, 720], [1200, 800], [1210, 880], [1190, 960], [1160, 1060], [1120, 1200]],                                              // Route 32 → Union Cave → Route 33
      [[1120, 1200], [1040, 1170], [980, 1100], [960, 1000], [910, 880], [860, 740], [800, 600]],                                   // Ilex Forest → Route 34
      [[800, 600], [880, 600], [960, 630], [1000, 580], [1030, 520], [1040, 470]],                                                   // Route 35 → National Park → Routes 36 · 37
      [[1040, 470], [960, 500], [900, 560], [870, 680], [910, 800], [940, 900], [800, 940], [640, 930], [470, 860], [330, 780], [260, 720]],   // Routes 38 · 39 → Olivine → Sea Routes 40 · 41
      [[260, 720], [330, 780], [470, 860], [640, 930], [800, 940], [940, 900]],                                                      // Sea Routes 41 · 40 → Olivine
      [[940, 900], [900, 800], [870, 680], [930, 540], [1040, 470], [1150, 480], [1260, 470], [1370, 470], [1470, 480]],            // Ecruteak → Route 42 · Mt. Mortar → Mahogany
      [[1470, 480], [1560, 470], [1650, 465], [1740, 460]],                                                                           // Route 44 → Ice Path
      [[1740, 460], [1760, 580], [1780, 720], [1820, 880], [1960, 960], [2120, 950], [2240, 860], [2300, 720], [2330, 540]],         // Routes 45 · 46 → 27 · 26 → Victory Road
      [[2330, 540], [2380, 500], [2420, 455]]                                                                                         // the Champion's room
    ] };
  const JNAMES = ['Route 29 → Cherrygrove City → Routes 30 · 31', 'Route 32 → Union Cave → Route 33', 'Ilex Forest → Route 34', 'Route 35 → National Park → Routes 36 · 37',
    'Routes 38 · 39 → Olivine City → Sea Routes 40 · 41', 'Sea Routes 41 · 40 → Olivine City', 'Route 42 → Mt. Mortar → Mahogany Town', 'Route 44 → Ice Path',
    'Routes 45 · 46 → Routes 27 · 26 → Victory Road', 'Indigo Plateau · the Champion’s room', 'Victory Road → Route 28 → Mt. Silver'];
  const JASH = [[2420, 455], [2440, 420], [2380, 400], [2300, 430]];
  /* ---------- wild Pokémon on Johto's routes (Pokédex runs) ---------- */
  const JROUTES = [
    { leg: 0, name: 'Route 29 · Cherrygrove · Routes 30 · 31', scene: 'meadow', mons: [['Sentret', 2, 4, 10], ['Pidgey', 2, 4, 10], ['Rattata', 2, 4, 8], ['Hoothoot', 3, 5, 7], ['Ledyba', 3, 5, 6], ['Spinarak', 3, 5, 6], ['Caterpie', 3, 4, 5], ['Weedle', 3, 4, 5], ['Hoppip', 3, 5, 5], ['Poliwag', 4, 5, 3], ['Bellsprout', 4, 5, 4], ['Zubat', 4, 5, 3], ['Pichu', 4, 5, 1], ['Togepi', 5, 5, .4]] },
    { leg: 1, name: 'Route 32 · Union Cave · Route 33', scene: 'cave', mons: [['Mareep', 6, 8, 8], ['Wooper', 6, 8, 7], ['Ekans', 6, 8, 6], ['Geodude', 6, 8, 8], ['Zubat', 6, 9, 8], ['Onix', 8, 10, 3], ['Sandshrew', 7, 9, 5], ['Hoppip', 7, 9, 5], ['Bellsprout', 6, 8, 5], ['Rattata', 6, 8, 5], ['Quagsire', 12, 12, 1], ['Lapras', 15, 15, .2]] },
    { leg: 2, name: 'Ilex Forest · Route 34', scene: 'forest', mons: [['Oddish', 10, 12, 7], ['Paras', 10, 12, 6], ['Caterpie', 10, 11, 4], ['Metapod', 10, 12, 4], ['Weedle', 10, 11, 4], ['Kakuna', 10, 12, 4], ['Zubat', 10, 12, 5], ['Psyduck', 11, 12, 5], ['Drowzee', 11, 13, 5], ['Abra', 11, 12, 3], ['Snubbull', 11, 13, 4], ['Jigglypuff', 11, 13, 4], ['Pineco', 11, 13, 5], ['Ditto', 12, 12, 1], ['Celebi', 30, 30, .03]] },
    { leg: 3, name: 'Route 35 · National Park · Routes 36 · 37', scene: 'safari', mons: [['Nidoran♀', 13, 15, 6], ['Nidoran♂', 13, 15, 6], ['Yanma', 13, 15, 4], ['Sunkern', 12, 14, 7], ['Scyther', 15, 15, 1.5], ['Pinsir', 15, 15, 1.5], ['Venonat', 13, 15, 5], ['Growlithe', 13, 15, 4], ['Vulpix', 13, 15, 4], ['Stantler', 14, 16, 4], ['Ledian', 14, 16, 3], ['Sudowoodo', 20, 20, .6], ['Eevee', 15, 15, .5], ['Ho-Oh', 50, 50, .03]] },
    { leg: 4, name: 'Routes 38 · 39 · Olivine · Sea Routes 40 · 41', scene: 'sea', mons: [['Tauros', 16, 18, 5], ['Miltank', 16, 18, 5], ['Magnemite', 16, 18, 6], ['Farfetch’d', 16, 18, 3], ['Tentacool', 16, 20, 9], ['Mantine', 18, 20, 3], ['Chinchou', 18, 20, 6], ['Shellder', 18, 20, 5], ['Krabby', 18, 20, 5], ['Corsola', 18, 20, 3], ['Remoraid', 18, 20, 5], ['Raikou', 40, 40, .05], ['Lugia', 50, 50, .03]] },
    { leg: 5, name: 'Sea Routes 41 · 40 · Olivine Lighthouse', scene: 'tower', mons: [['Tentacruel', 22, 24, 5], ['Mantine', 22, 24, 4], ['Qwilfish', 22, 24, 5], ['Lanturn', 23, 25, 3], ['Octillery', 23, 25, 3], ['Slowpoke', 22, 24, 6], ['Gastly', 22, 24, 5], ['Haunter', 23, 25, 3], ['Krabby', 22, 24, 5], ['Magnemite', 22, 24, 5], ['Entei', 40, 40, .05]] },
    { leg: 6, name: 'Route 42 · Mt. Mortar · Lake of Rage', scene: 'cave', mons: [['Machop', 26, 28, 7], ['Marill', 26, 28, 6], ['Spearow', 26, 28, 5], ['Zubat', 26, 28, 5], ['Golbat', 27, 29, 4], ['Geodude', 26, 28, 5], ['Mankey', 26, 28, 5], ['Magikarp', 20, 25, 6], ['Gyarados', 30, 30, 1], ['Girafarig', 27, 29, 3], ['Murkrow', 27, 29, 3], ['Tyrogue', 28, 28, 1], ['Suicune', 40, 40, .05]] },
    { leg: 7, name: 'Route 44 · Ice Path', scene: 'mountain', mons: [['Swinub', 30, 32, 8], ['Delibird', 30, 32, 4], ['Sneasel', 31, 33, 4], ['Jynx', 31, 33, 4], ['Zubat', 30, 32, 5], ['Golbat', 31, 33, 5], ['Poliwhirl', 30, 32, 4], ['Lickitung', 31, 33, 3], ['Tangela', 30, 32, 4], ['Weepinbell', 30, 32, 4], ['Smoochum', 30, 30, 2]] }
  ].map(r => ({ ...r, mons: r.mons.map(([a, lo, hi, w]) => [a, lo, hi, Math.round(Math.sqrt(w) * 1000) / 1000]) }));   // the same rarity balance as Kanto
  /* ---------- optional battles: Johto route trainers ---------- */
  const JMINORS = [
    { id: 'j-joey', name: 'Youngster Joey', keys: ['youngster'], where: 'Route 30', at: [1320, 880], unlock: 0, ai: 1, arena: arena('plaza'), team: [['Rattata', 6], ['Sentret', 5], ['Pidgey', 5]],
      hello: 'My Rattata is in the top percentage of all Rattata! Wanna battle?', lose: 'Aww… my top-percentage Rattata…', win: 'Told ya! Top percentage!' },
    { id: 'j-sage', name: 'Sage Li', keys: ['sage', 'channeler'], where: 'Sprout Tower', at: [1230, 650], unlock: 0, ai: 2, arena: arena('grand'), team: [['Bellsprout', 9], ['Hoothoot', 9], ['Gastly', 10], ['Natu', 10]],
      hello: 'The tower sways, yet it stands. Show me that your bond with your Pokémon is as steady.', lose: 'Your bond is strong. Go in peace.', win: 'Sway like the pillar, and try again.' },
    { id: 'j-wade', name: 'Bug Catcher Wade', keys: ['bugcatcher'], where: 'Route 31', at: [1260, 800], unlock: 1, ai: 2, arena: arena('ruins'), team: [['Caterpie', 12], ['Ledyba', 12], ['Spinarak', 13], ['Metapod', 13], ['Weedle', 12]],
      hello: 'I caught all of these in the grass by Dark Cave!', lose: 'My bugs got squished…', win: 'Bugs win again!' },
    { id: 'j-beverly', name: 'Pokéfan Beverly', keys: ['pokefan', 'pokefanf', 'lass', 'beauty'], where: 'National Park', at: [960, 640], unlock: 3, ai: 3, arena: arena('plaza'), team: [['Snubbull', 18], ['Marill', 18], ['Clefairy', 19], ['Togetic', 20]],
      hello: 'Aren’t my Pokémon simply adorable? They’re strong, too!', lose: 'Oh my, you’re good.', win: 'Cute AND strong!' },
    { id: 'j-kirk', name: 'Swimmer Kirk', keys: ['swimmer'], where: 'Sea Route 41', at: [560, 900], unlock: 4, ai: 4, arena: arena('cerulean'), team: [['Tentacool', 24], ['Chinchou', 24], ['Qwilfish', 25], ['Seaking', 26]],
      hello: 'The currents around the Whirl Islands are rough. Can you keep up?', lose: 'Swept away!', win: 'Too slow for these waters!' },
    { id: 'j-anthony', name: 'Hiker Anthony', keys: ['hiker'], where: 'Mt. Mortar', at: [1260, 470], unlock: 6, ai: 5, arena: arena('cavern', 'meteor'), team: [['Geodude', 30], ['Machoke', 31], ['Graveler', 32], ['Onix', 32], ['Donphan', 33]],
      hello: 'I’ve climbed every peak in Johto. Mt. Mortar is my backyard!', lose: 'Whoa, avalanche!', win: 'Solid as a mountain!' },
    { id: 'j-gaven', name: 'Cooltrainer Gaven', keys: ['cooltrainermale', 'cooltrainerm', 'acetrainermale', 'acetrainerm'], where: 'Route 44', at: [1600, 470], unlock: 7, ai: 6, arena: arena('summit'), team: [['Victreebel', 36], ['Kingler', 36], ['Flareon', 37], ['Ampharos', 38]],
      hello: 'The Ice Path ahead is brutal. Prove you can make it!', lose: 'You’re ready for Blackthorn.', win: 'Turn back while you can.' },
    { id: 'j-lola', name: 'Ace Trainer Lola', keys: ['cooltrainerfemale', 'cooltrainerf', 'acetrainerfemale', 'acetrainerf'], where: 'Route 27', at: [1990, 960], unlock: 8, ai: 7, arena: arena('castle'), team: [['Dragonair', 42], ['Togetic', 42], ['Clefable', 43], ['Starmie', 44]],
      hello: 'Only the strongest trainers make it to Victory Road. Let’s see if you’re one of them.', lose: 'You’re the real thing.', win: 'Not yet. Train more.' }
  ];
  /* ---------- gym twists and scenes (keyed j1–j10; the engine finds them by the gym's key) ---------- */
  Object.assign(D.RULES, {
    j1: { banA: ['Rock'], title: 'Tower winds', text: 'High winds at the top of Violet Gym: your ROCK moves are banned.' },
    j2: { banA: ['Fire'], title: 'Hive rules', text: 'No open flames near the hive: your FIRE moves are banned.' },
    j3: { handicap: 4, title: 'Whitney’s rules', text: 'Whitney insists on fair play — her way: bring only your first FOUR Pokémon.' },
    j4: { banA: ['Dark', 'Ghost'], title: 'Spirit veil', text: 'The spirits of Ecruteak shield Morty: your DARK and GHOST moves are banned.' },
    j5: { weather: 'rain', title: 'Waterfall training', text: 'Chuck trains under a waterfall: permanent RAIN — Water moves 50% harder, Fire 50% weaker.' },
    j6: { weather: 'sand', title: 'Steel sandstorm', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel — Jasmine’s team is immune.' },
    j7: { weather: 'hail', title: 'Frozen gym', text: 'Permanent HAIL chips every Pokémon that isn’t Ice.' },
    j8: { banA: ['Ice'], title: 'Dragon’s Den heat', text: 'The heat of the Dragon’s Den melts ice: your ICE moves are banned.' },
    j9: { handicap: 5, title: 'Favorites only', text: 'Karen’s test: bring only your first FIVE Pokémon — your favorites.' }
  });
  Object.assign(D.SCRIPT.gym, {
    j1: [['foe', 'Hmph. You think you can climb to the top of my gym?'], ['foe', 'The winds up here will keep your rocks on the ground!'], ['me', 'Then we’ll fly higher.']],
    j2: [['foe', 'You came all the way from Violet? I’ve been studying Bug Pokémon this whole time!'], ['me', 'Show me what you’ve learned.']],
    j3: [['foe', 'Hi! I’m Whitney! Everyone’s into Pokémon, so I am too!'], ['foe', 'And my Miltank is super strong. Let’s go!'], ['me', 'Ready when you are.']],
    j4: [['foe', 'Here in Ecruteak, Pokémon are revered. I have trained here all my life to see the legendary Pokémon.'], ['me', 'Then let’s see your training.']],
    j5: [['foe', 'WAHAHAH! So you’ve come this far! Let me tell you, I’m tough!'], ['foe', 'My Pokémon will crush stones and shatter bones! Watch this!'], ['me', 'Bring it on!']],
    j6: [['foe', 'Thank you for helping Amphy at the lighthouse.'], ['foe', '…But a battle is a battle. I use the clad-in-steel Steel type.'], ['me', 'I’m ready, Jasmine.']],
    j7: [['foe', 'Pokémon have many experiences in their lives, just like we do. I, too, have seen and suffered much.'], ['me', 'Then teach me.']],
    j8: [['foe', 'I am Clair. The world’s best Dragon master.'], ['foe', 'I can hold my own against even the Pokémon League’s Elite Four. Do you still want to take me on?'], ['me', 'Yes.']],
    j9: [['foe', 'I am Karen of the Elite Four. You’re the trainer who came through Victory Road?'], ['foe', 'I love the Dark type. I find its wild, tough image so appealing.'], ['me', 'Let’s battle.']]
  });
  /* ---------- Silver: Johto's rival ---------- */
  const SILVER = { file: 'Silver', leader: 'Silver' };
  const SRIVAL_AT = { 2: 0, 5: 1, 8: 2 };                 // before Whitney, before Jasmine, and on Victory Road before Karen
  const SRIVAL_BASE = [['Gastly', 'Zubat', '*1'], ['Haunter', 'Golbat', 'Magnemite', 'Sneasel', '*1'], ['Haunter', 'Crobat', 'Magneton', 'Sneasel', 'Kadabra', '*2']];
  const SRIVAL_SCRIPT = {
    before: [
      { cocky: [['foe', '…You again. You’re the kid from New Bark Town.'], ['foe', 'I don’t care about weak Pokémon. I only want the strong ones. Let me show you.']],
        rattled: [['foe', 'You beat me once. That was luck.'], ['me', 'Want to find out?']],
        bitter: [['foe', 'Every time… why do you keep beating me?'], ['me', 'Maybe because I trust my Pokémon.']] },
      { cocky: [['foe', 'Team Rocket? Pathetic. They group together because they’re weak.'], ['foe', 'I’m going to be the strongest trainer — alone. Move.']],
        rattled: [['foe', 'I’ve been training harder than anyone. My team has changed.'], ['me', 'So has mine.']],
        bitter: [['foe', 'My Pokémon… they don’t listen like yours do. Why?'], ['me', 'Battle me and find out.']] },
      { cocky: [['foe', 'Victory Road is no place for you. Turn back.'], ['me', 'Not a chance.']],
        rattled: [['foe', 'This is where it ends. I won’t lose here.'], ['me', 'Let’s go, Silver.']],
        bitter: [['foe', '…I’ve been thinking about what you said. About trusting Pokémon.'], ['foe', 'I still want to beat you. But I want to do it right this time.']] }
    ],
    win: { cocky: [['foe', '…Tch. A fluke. I won’t lose again.']], rattled: [['foe', '…Hmph. Get out of my way.']], bitter: [['foe', '…I see. You’re stronger. For now.']] },
    lose: { cocky: [['foe', 'Weak. Just like I thought.']], rattled: [['foe', 'That’s what happens when you get in my way.']], bitter: [['foe', 'Finally… I won. …Why doesn’t it feel the way I thought it would?']] }
  };
  const SCHAMP = {
    cocky: [['foe', 'So you made it here. Good. I’ve been waiting to crush you in front of everyone.'], ['me', 'Let’s settle it, Silver.']],
    rattled: [['foe', 'The Champion’s room. Of course it’s you who shows up.'], ['foe', 'This time I fight with my Pokémon, not just with them.'], ['me', 'I can see that. Let’s go.']],
    bitter: [['foe', 'You taught me something on this journey. I hate that you did.'], ['foe', 'Now — one last battle. Everything we have.'], ['me', 'Everything we have.']]
  };
  /* ---------- Johto story events (before gyms 2, 4, 5, 7 and 8) ---------- */
  window.JOHTO_EV = {
    1: { id: 'jwell', title: 'Slowpoke Well', arena: arena('cavern', 'meteor'), text: 'Team Rocket is cutting off Slowpoke tails! Two Rocket battles back to back — no healing between.',
      before: [['foe', 'What do you want, kid? We’re busy selling SlowpokeTails!'], ['me', 'Leave those Slowpoke alone!']],
      stages: [{ name: 'Rocket Grunt', keys: ['rocketgrunt', 'teamrocketgrunt', 'grunt'], team: ['Rattata', 'Zubat', 'Koffing'], style: 'aggro' },
        { name: 'Rocket Executive', keys: ['rocketexecutive', 'proton', 'rocketadmin'], team: ['Golbat', 'Weezing', 'Arbok'], style: 'status', line: 'You beat my grunt? Then I’ll handle you myself!' }],
      win: [['foe', 'Fine, we’ll pull out of the well… but Team Rocket isn’t finished in Johto!']], lose: [['foe', 'Ha! Kids should stay out of the well!']] },
    3: { id: 'jkimono', title: 'Dance Theater', format: '1v1', name: 'Kimono Girl', keys: ['kimonogirl', 'kimono'], team: ['Espeon'], style: 'switcher', arena: arena('grand', 'hall'),
      text: 'A 1v1 duel with a Kimono Girl at the Dance Theater: your lead against her Espeon.',
      before: [['foe', 'Welcome to the Dance Theater. We dance with our Pokémon as one.'], ['foe', 'Will you show me one Pokémon, and your bond with it?'], ['me', 'Gladly.']],
      win: [['foe', 'Beautiful. The bond between you two is true.']], lose: [['foe', 'Your steps are not yet in harmony. Please, come again.']] },
    4: { id: 'jlight', title: 'Glitter Lighthouse puzzle', format: 'puzzle', name: 'Sailor', keys: ['sailor'], team: ['Steelix'], fixedTeam: ['Flaaffy', 'Togetic', 'Scyther', 'Croconaw'], foeScale: 1.6, style: 'defensive', arena: arena('vermilion', 'castle'),
      text: 'Puzzle battle: a sailor’s Steelix blocks the lighthouse stairs. Your team is fixed — only one of these four can really beat it.',
      before: [['foe', 'Jasmine’s Amphy is sick up there, and nobody gets past my Steelix!'], ['foe', 'Here, use my crew’s Pokémon. Let’s see if you can figure it out.'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'Water! Of course — Steelix is part Ground. Go on up, the lighthouse is yours.']], lose: [['foe', 'Think about what Steelix is weak to… and try again.']] },
    6: { id: 'jgyarados', title: 'Lake of Rage', format: '1v1', name: 'Red Gyarados', keys: [], team: ['Gyarados|shiny'], foeScale: 1.25, style: 'aggro', arena: arena('cerulean'),
      text: 'The Red Gyarados rises from the Lake of Rage! A 1v1 battle: your lead against it.',
      before: [['foe', 'GYAAAAAAH!'], ['me', 'A red Gyarados… Team Rocket must be behind this. Let’s calm it down!']],
      win: [['me', 'It’s calm now. Something is forcing Pokémon to evolve here… Team Rocket.']], lose: [['foe', 'GYAAAH!']] },
    7: { id: 'jradio', title: 'Radio Tower takeover', arena: arena('plaza', 'grand'), text: 'Team Rocket has seized Goldenrod’s Radio Tower! Three Rocket battles back to back — no healing between.',
      before: [['foe', 'Team Rocket has taken over the Radio Tower! We’ll broadcast a message to Giovanni!'], ['me', 'Not on my watch.']],
      stages: [{ name: 'Rocket Grunt', keys: ['rocketgrunt', 'teamrocketgrunt', 'grunt'], team: ['Raticate', 'Koffing', 'Golbat'], style: 'aggro' },
        { name: 'Executive Ariana', keys: ['ariana', 'rocketexecutivef', 'rocketadmin'], team: ['Arbok', 'Vileplume', 'Murkrow'], style: 'status', line: 'You won’t get past me. I’ll make you regret coming here.' },
        { name: 'Executive Archer', keys: ['archer', 'rocketexecutive', 'rocketadmin'], team: ['Houndoom', 'Crobat', 'Weezing'], style: 'switcher', line: 'I am Archer, Team Rocket’s acting boss. This ends now.' }],
      win: [['foe', 'Team Rocket… is finished. Giovanni… we failed you.']], lose: [['foe', 'The Radio Tower is ours! Hahaha!']] }
  };
  /* ---------- evolutions: Johto lines always; cross-generation ones only in Johto ---------- */
  Object.assign(EVO, { Chikorita: ['Bayleef', 16], Bayleef: ['Meganium', 32], Cyndaquil: ['Quilava', 14], Quilava: ['Typhlosion', 36], Totodile: ['Croconaw', 18], Croconaw: ['Feraligatr', 30],
    Sentret: ['Furret', 15], Hoothoot: ['Noctowl', 20], Ledyba: ['Ledian', 18], Spinarak: ['Ariados', 22], Chinchou: ['Lanturn', 27], Pichu: ['Pikachu', 12], Cleffa: ['Clefairy', 12],
    Igglybuff: ['Jigglypuff', 12], Togepi: ['Togetic', 15], Natu: ['Xatu', 25], Mareep: ['Flaaffy', 15], Flaaffy: ['Ampharos', 30], Marill: ['Azumarill', 18], Hoppip: ['Skiploom', 18],
    Skiploom: ['Jumpluff', 27], Sunkern: ['Sunflora', 20], Wooper: ['Quagsire', 20], Pineco: ['Forretress', 31], Snubbull: ['Granbull', 23], Teddiursa: ['Ursaring', 30], Slugma: ['Magcargo', 38],
    Swinub: ['Piloswine', 33], Remoraid: ['Octillery', 25], Houndour: ['Houndoom', 24], Phanpy: ['Donphan', 25], Tyrogue: ['Hitmontop', 20], Smoochum: ['Jynx', 30], Elekid: ['Electabuzz', 30],
    Magby: ['Magmar', 30], Larvitar: ['Pupitar', 30], Pupitar: ['Tyranitar', 55] });
  const CROSS = { Golbat: ['Crobat', 40], Onix: ['Steelix', 35], Scyther: ['Scizor', 40], Seadra: ['Kingdra', 45], Chansey: ['Blissey', 40], Porygon: ['Porygon2', 35] };
  const EEVEE_K = EVO.Eevee ? JSON.parse(JSON.stringify(EVO.Eevee)) : null;

  /* ---------- the region switch ---------- */
  const K = { gyms: GYMS.slice(), map: { img: KANTO.img, w: KANTO.w, h: KANTO.h, home: KANTO.home, gyms: KANTO.gyms, legs: KANTO.legs },
    names: ROUTE_NAMES.slice(), ash: ASH_LEG.map(p => p.slice()), routes: ROUTES.slice(), minors: typeof MINORS !== 'undefined' ? MINORS.slice() : [], starters: STARTERS.slice(),
    badges: BADGE_FILES.slice(), rivalAt: Object.assign({}, D.RIVAL_AT), rivalBase: D.RIVAL_BASE.map(a => a.slice()), gary: Object.assign({}, D.GARY), rival: D.SCRIPT.rival, champ: D.SCRIPT.champion };
  const fill = (arr, items) => { arr.splice(0, arr.length, ...items); };
  const swapObj = (o, n) => { for (const k of Object.keys(o)) delete o[k]; Object.assign(o, n); };
  const regionOf = s => (!s ? 'kanto' : s.region === 'johto' ? 'johto' : s.region === 'combined' ? (s.phase || 'kanto') : 'kanto');
  function applyRegion(R) {
    if (STORY.region === R && GYMS[0] === (R === 'johto' ? J[0] : K.gyms[0])) return;
    const jo = R === 'johto';
    fill(GYMS, jo ? J : K.gyms);
    Object.assign(KANTO, jo ? JMAP : K.map);
    fill(ROUTE_NAMES, jo ? JNAMES : K.names); fill(ASH_LEG, jo ? JASH : K.ash);
    fill(ROUTES, jo ? JROUTES : K.routes); if (typeof MINORS !== 'undefined') fill(MINORS, jo ? JMINORS : K.minors);
    fill(STARTERS, jo ? ['Chikorita', 'Cyndaquil', 'Totodile'] : K.starters);
    fill(BADGE_FILES, jo ? ['zephyr', 'hive', 'plain', 'fog', 'storm', 'mineral', 'glacier', 'rising', 'elite', 'champion'] : K.badges);
    swapObj(D.RIVAL_AT, jo ? SRIVAL_AT : K.rivalAt); fill(D.RIVAL_BASE, jo ? SRIVAL_BASE : K.rivalBase); swapObj(D.GARY, jo ? SILVER : K.gary);
    D.SCRIPT.rival = jo ? SRIVAL_SCRIPT : K.rival; D.SCRIPT.champion = jo ? SCHAMP : K.champ; D.rivalCounter = jo ? silverCounter : null;
    for (const [a, v] of Object.entries(CROSS)) { if (jo) EVO[a] = v; else delete EVO[a]; }        // cross-generation evolutions: Johto only
    if (EEVEE_K) EVO.Eevee = jo ? [EEVEE_K[0].concat(['Espeon', 'Umbreon']), EEVEE_K[1]] : JSON.parse(JSON.stringify(EEVEE_K));
    STORY.region = R; STORY.rivalKey = jo ? 'rivalJ' : 'rival';
    if (!jo && typeof applyStoryBranch === 'function') applyStoryBranch();                         // Kanto: Giovanni or Professor Oak, by the save's choice
    STORY.kanto = true;
  }
  window.applyRegion = applyRegion; window.storyRegion = () => STORY.region || 'kanto';
  const sync = () => applyRegion(regionOf(STORY.save));
  STORY.region = 'kanto'; STORY.rivalKey = 'rival';

  /* ---------- choosing the story type for a new journey ---------- */
  function chooseRegion() {
    return new Promise(done => {
      const ov = $('csOv'); STORY.cutscene = true;
      const opts = [['kanto', 'Kanto', 'The original journey — 8 gyms, Lance and Gary.'], ['johto', 'Johto', 'A new region — 8 Johto gyms, Karen and your rival Silver.'], ['combined', 'Combined', 'Kanto first, then set sail for Johto with the same team.']];
      ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">Where will your journey begin?</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${opts.map(([v, t, sub], k) => `<button class="sy-btn${k ? '' : ' go'}" type="button" data-r="${v}" style="min-width:190px">${t}<br><small style="font-weight:600;opacity:.85">${sub}</small></button>`).join('')}</div><button class="sy-btn" type="button" data-r="" style="margin-top:10px">Cancel</button></div>`;
      ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-r]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; STORY.cutscene = false; done(b.dataset.r || null); };
    });
  }
  const _begin = beginJourney;
  beginJourney = async function (fresh) {
    if (fresh) { const r = await chooseRegion(); if (!r) return; STORY.nextRegion = r; applyRegion(r === 'johto' ? 'johto' : 'kanto'); }
    else sync();
    return _begin.apply(this, arguments);
  };
  const _save = saveStory;
  saveStory = function () {                                       // a new journey takes the chosen story type
    const s = STORY.save; if (s && STORY.nextRegion && !s.region && !s.badges) { s.region = STORY.nextRegion; if (s.region === 'combined') s.phase = 'kanto'; STORY.nextRegion = null; }
    return _save.apply(this, arguments);
  };
  const _open = openStoryScreen;
  openStoryScreen = function () { sync(); const r = _open.apply(this, arguments); setTimeout(offerJohto, 900); return r; };
  const _render = renderStory;
  renderStory = function () { sync(); const r = _render.apply(this, arguments); try { tagRegion(); } catch (e) { } return r; };
  if (typeof useSlot === 'function') { const _use = useSlot; useSlot = function () { const r = _use.apply(this, arguments); try { sync(); } catch (e) { } return r; }; }
  const _sg = startGymBattle; startGymBattle = function () { sync(); return _sg.apply(this, arguments); };
  const _card = openGymCard; openGymCard = function () { sync(); return _card.apply(this, arguments); };
  function tagRegion() { const h = [...document.querySelectorAll('#storyOv h1, #storyOv h2, #storyOv .sy-title')].find(e => /BADGE JOURNEY/i.test(e.textContent)); if (!h || h.querySelector('.sy-reg')) return;
    const t = document.createElement('span'); t.className = 'sy-reg'; t.style.cssText = 'margin-left:10px;font-size:.55em;letter-spacing:.12em;color:#9fd0ff;vertical-align:middle';
    const s = STORY.save; t.textContent = s && s.region === 'combined' ? `· COMBINED · ${String(STORY.region).toUpperCase()}` : `· ${String(STORY.region).toUpperCase()}`; h.appendChild(t); }
  // Combined journeys: after Kanto's Champion, set sail for Johto with the same team
  let offering = false;
  async function offerJohto() {
    const s = STORY.save; if (offering || !s || s.region !== 'combined' || (s.phase || 'kanto') !== 'kanto' || s.badges < TOTAL || !STORY.open || STORY.cutscene || STORY.battle) return;
    offering = true;
    try { const ov = $('csOv'); STORY.cutscene = true;
      const go = await new Promise(done => { ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">You’re Kanto’s Champion! The S.S. Aqua is ready to sail for Johto — your team and Pokédex come with you.</div><div style="display:flex;gap:10px;justify-content:center"><button class="sy-btn go" type="button" data-g="1">Set sail for Johto</button><button class="sy-btn" type="button" data-g="">Not yet</button></div></div>`;
        ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; done(!!b.dataset.g); }; });
      STORY.cutscene = false;
      if (go) { s.kanto = { badges: s.badges, wins: s.wins, losses: s.losses, at: Date.now() }; s.phase = 'johto'; s.badges = 0; saveStory(); sync(); renderStory();
        setTimeout(() => { try { openGymCard(0); } catch (e) { } }, 400); }
    } finally { offering = false; STORY.cutscene = false; }
  }
  // the Johto badges until their images are added: a generated badge in the badge's colours
  const BADGE_COL = { zephyr: ['#9ec8ff', '#ffffff'], hive: ['#e83a3a', '#ffd84a'], plain: ['#ffd84a', '#ffffff'], fog: ['#7a6ad0', '#d8d0ff'], storm: ['#b07a3a', '#ffd8a0'], mineral: ['#9db4c8', '#ffffff'], glacier: ['#7ad7ff', '#e8f8ff'], rising: ['#4a6ae0', '#ff7a7a'] };
  document.addEventListener('error', e => { const im = e.target; if (!im || im.tagName !== 'IMG' || !/story\/badges\/(\w+)\.png/.test(im.src || '')) return; const k = RegExp.$1, c = BADGE_COL[k]; if (!c || im.dataset.fb) return; im.dataset.fb = '1';
    im.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><polygon points="20,2 36,12 36,28 20,38 4,28 4,12" fill="${c[0]}" stroke="${c[1]}" stroke-width="3"/><circle cx="20" cy="20" r="7" fill="${c[1]}" opacity=".85"/></svg>`); }, true);
  // Kanto journeys keep the Kanto Pokédex (151); Johto and Combined show all 251
  window.dexHidesJohto = () => (STORY.region || 'kanto') === 'kanto' && !(STORY.save && STORY.save.region === 'combined');
  sync();
})();
