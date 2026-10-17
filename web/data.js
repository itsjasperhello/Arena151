'use strict';
/* =====================================================================
   ARENA 151 — Milestone 3
   Section 1: utilities
   ===================================================================== */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const Ease = {
  inQ: t => t * t,
  outQ: t => 1 - (1 - t) * (1 - t),
  inOut: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outBack: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
};
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = () => Math.random();
const randInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const other = s => (s === 'A' ? 'B' : 'A');
const TEAM_NAME = { A: 'Red', B: 'Gold' };

/* =====================================================================
   Section 2: data — roster, types, moves
   ===================================================================== */
// name|type1|type2|tier   tier → base stat total used for generated stats
const ROSTER_RAW = `Bulbasaur|Grass|Poison|B;Ivysaur|Grass|Poison|M;Venusaur|Grass|Poison|F;Charmander|Fire||B;Charmeleon|Fire||M;Charizard|Fire|Flying|F;Squirtle|Water||B;Wartortle|Water||M;Blastoise|Water||F;Caterpie|Bug||W;Metapod|Bug||W;Butterfree|Bug|Flying|k;Weedle|Bug|Poison|W;Kakuna|Bug|Poison|W;Beedrill|Bug|Poison|k;Pidgey|Normal|Flying|B;Pidgeotto|Normal|Flying|M;Pidgeot|Normal|Flying|f;Rattata|Normal||b;Raticate|Normal||k;Spearow|Normal|Flying|b;Fearow|Normal|Flying|g;Ekans|Poison||b;Arbok|Poison||g;Pikachu|Electric||b;Raichu|Electric||f;Sandshrew|Ground||b;Sandslash|Ground||g;Nidoran♀|Poison||B;Nidorina|Poison||M;Nidoqueen|Poison|Ground|F;Nidoran♂|Poison||B;Nidorino|Poison||M;Nidoking|Poison|Ground|F;Clefairy|Fairy||b;Clefable|Fairy||f;Vulpix|Fire||b;Ninetales|Fire||f;Jigglypuff|Normal|Fairy|b;Wigglytuff|Normal|Fairy|g;Zubat|Poison|Flying|b;Golbat|Poison|Flying|g;Oddish|Grass|Poison|B;Gloom|Grass|Poison|M;Vileplume|Grass|Poison|F;Paras|Bug|Grass|b;Parasect|Bug|Grass|k;Venonat|Bug|Poison|b;Venomoth|Bug|Poison|g;Diglett|Ground||b;Dugtrio|Ground||k;Meowth|Normal||b;Persian|Normal||g;Psyduck|Water||b;Golduck|Water||f;Mankey|Fighting||b;Primeape|Fighting||g;Growlithe|Fire||b;Arcanine|Fire||F;Poliwag|Water||B;Poliwhirl|Water||M;Poliwrath|Water|Fighting|F;Abra|Psychic||B;Kadabra|Psychic||M;Alakazam|Psychic||F;Machop|Fighting||B;Machoke|Fighting||M;Machamp|Fighting||F;Bellsprout|Grass|Poison|B;Weepinbell|Grass|Poison|M;Victreebel|Grass|Poison|F;Tentacool|Water|Poison|b;Tentacruel|Water|Poison|f;Geodude|Rock|Ground|B;Graveler|Rock|Ground|M;Golem|Rock|Ground|F;Ponyta|Fire||b;Rapidash|Fire||f;Slowpoke|Water|Psychic|b;Slowbro|Water|Psychic|f;Magnemite|Electric|Steel|b;Magneton|Electric|Steel|f;Farfetch’d|Normal|Flying|k;Doduo|Normal|Flying|b;Dodrio|Normal|Flying|f;Seel|Water||b;Dewgong|Water|Ice|f;Grimer|Poison||b;Muk|Poison||f;Shellder|Water||b;Cloyster|Water|Ice|F;Gastly|Ghost|Poison|B;Haunter|Ghost|Poison|M;Gengar|Ghost|Poison|F;Onix|Rock|Ground|k;Drowzee|Psychic||b;Hypno|Psychic||f;Krabby|Water||b;Kingler|Water||f;Voltorb|Electric||b;Electrode|Electric||f;Exeggcute|Grass|Psychic|b;Exeggutor|Grass|Psychic|F;Cubone|Ground||b;Marowak|Ground||g;Hitmonlee|Fighting||g;Hitmonchan|Fighting||g;Lickitung|Normal||k;Koffing|Poison||b;Weezing|Poison||f;Rhyhorn|Ground|Rock|b;Rhydon|Ground|Rock|f;Chansey|Normal||g;Tangela|Grass||g;Kangaskhan|Normal||f;Horsea|Water||b;Seadra|Water||g;Goldeen|Water||b;Seaking|Water||g;Staryu|Water||b;Starmie|Water|Psychic|f;Mr. Mime|Psychic|Fairy|g;Scyther|Bug|Flying|f;Jynx|Ice|Psychic|g;Electabuzz|Electric||f;Magmar|Fire||f;Pinsir|Bug||f;Tauros|Normal||f;Magikarp|Water||W;Gyarados|Water|Flying|F;Lapras|Water|Ice|F;Ditto|Normal||b;Eevee|Normal||b;Vaporeon|Water||F;Jolteon|Electric||F;Flareon|Fire||F;Porygon|Normal||k;Omanyte|Rock|Water|b;Omastar|Rock|Water|f;Kabuto|Rock|Water|b;Kabutops|Rock|Water|f;Aerodactyl|Rock|Flying|F;Snorlax|Normal||F;Articuno|Ice|Flying|L;Zapdos|Electric|Flying|L;Moltres|Fire|Flying|L;Dratini|Dragon||B;Dragonair|Dragon||M;Dragonite|Dragon|Flying|L;Mewtwo|Psychic||X;Mew|Psychic||L`;
const TIER_BST = { W: 200, b: 300, B: 310, k: 400, M: 405, g: 440, f: 480, F: 530, L: 590, X: 680 };
const TIER_SIZE = { W: .62, b: .66, B: .64, k: .8, M: .8, g: .84, f: .92, F: .97, L: 1, X: 1 };
const DEX = ROSTER_RAW.split(';').map((s, i) => { const p = s.split('|'); return { id: i + 1, name: p[0], types: p[2] ? [p[1], p[2]] : [p[1]], tier: p[3] }; });
const DEX_BY_NAME = Object.fromEntries(DEX.map(d => [d.name, d]));

// Canonical base stats for well-known species (public reference values); others are generated.
const BASE_OVERRIDE = {
  Pikachu: [35, 55, 40, 50, 50, 90], Raichu: [60, 90, 55, 90, 80, 110], Charizard: [78, 84, 78, 109, 85, 100],
  Blastoise: [79, 83, 100, 85, 105, 78], Venusaur: [80, 82, 83, 100, 100, 80], Snorlax: [160, 110, 65, 65, 110, 30],
  Chansey: [250, 5, 5, 35, 105, 50], Alakazam: [55, 50, 45, 135, 95, 120], Gengar: [60, 65, 60, 130, 75, 110],
  Mewtwo: [106, 110, 90, 154, 90, 130], Mew: [100, 100, 100, 100, 100, 100], Dragonite: [91, 134, 95, 100, 100, 80],
  Gyarados: [95, 125, 79, 60, 100, 81], Lapras: [130, 85, 80, 85, 95, 60], Arcanine: [90, 110, 80, 100, 80, 95],
  Jolteon: [65, 65, 60, 110, 95, 130], Golbat: [75, 80, 70, 65, 75, 90], Pinsir: [65, 125, 100, 55, 70, 85],
  Magikarp: [20, 10, 55, 15, 20, 80], Onix: [35, 45, 160, 30, 45, 70], Machamp: [90, 130, 80, 65, 85, 55],
  Golem: [80, 120, 130, 55, 65, 45], Starmie: [60, 75, 85, 100, 85, 115], Ditto: [48, 48, 48, 48, 48, 48],
  Eevee: [55, 55, 50, 45, 65, 55]
};
// Type archetype weights: hp, atk, def, spa, spd, spe
const ARCH = {
  Normal: [1.2, 1, .9, .8, .9, 1], Fire: [.9, 1.05, .85, 1.15, .95, 1.1], Water: [1.05, .95, 1.1, 1, 1, .9],
  Grass: [1, .95, 1, 1.1, 1.05, .9], Electric: [.85, .9, .85, 1.15, .95, 1.3], Psychic: [.85, .7, .8, 1.4, 1.1, 1.15],
  Ice: [1.05, .95, .95, 1.1, 1, .95], Fighting: [1.05, 1.4, .9, .6, .9, 1], Poison: [1, 1, 1, .95, .95, 1],
  Ground: [1, 1.2, 1.15, .8, .85, .9], Rock: [.95, 1.15, 1.4, .75, .8, .8], Bug: [.9, 1.1, 1, .9, .95, 1.05],
  Ghost: [.8, .8, .8, 1.35, .9, 1.25], Dragon: [1.05, 1.25, 1, 1.05, 1, 1], Fairy: [1.2, .8, .9, 1.05, 1.15, .85],
  Steel: [.85, .9, 1.4, 1.1, .9, .8], Flying: [.95, 1.05, .9, .95, .9, 1.25]
};
const TYPE_COLOR = {
  Normal: '#b9b7a3', Fire: '#ff7d3b', Water: '#4a9dff', Grass: '#4cc860', Electric: '#ffd02e', Psychic: '#ff6fb1',
  Ice: '#7fe0ea', Fighting: '#d4553d', Poison: '#b066d6', Ground: '#d9b062', Rock: '#b5a05a', Bug: '#a3c22c',
  Ghost: '#7a6ad0', Dragon: '#6f5cf0', Fairy: '#f4a6d8', Steel: '#9db4c8', Flying: '#97b3f2', Dark: '#6e5a4e'
};
// Full 18-type chart (attacker → defender)
const CHART = {
  Normal: { Rock: .5, Ghost: 0, Steel: .5 },
  Fire: { Fire: .5, Water: .5, Grass: 2, Ice: 2, Bug: 2, Rock: .5, Dragon: .5, Steel: 2 },
  Water: { Fire: 2, Water: .5, Grass: .5, Ground: 2, Rock: 2, Dragon: .5 },
  Electric: { Water: 2, Electric: .5, Grass: .5, Ground: 0, Flying: 2, Dragon: .5 },
  Grass: { Fire: .5, Water: 2, Grass: .5, Poison: .5, Ground: 2, Flying: .5, Bug: .5, Rock: 2, Dragon: .5, Steel: .5 },
  Ice: { Fire: .5, Water: .5, Grass: 2, Ice: .5, Ground: 2, Flying: 2, Dragon: 2, Steel: .5 },
  Fighting: { Normal: 2, Ice: 2, Poison: .5, Flying: .5, Psychic: .5, Bug: .5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: .5 },
  Poison: { Grass: 2, Poison: .5, Ground: .5, Rock: .5, Ghost: .5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: .5, Poison: 2, Flying: 0, Bug: .5, Rock: 2, Steel: 2 },
  Flying: { Electric: .5, Grass: 2, Fighting: 2, Bug: 2, Rock: .5, Steel: .5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: .5, Dark: 0, Steel: .5 },
  Bug: { Fire: .5, Grass: 2, Fighting: .5, Poison: .5, Flying: .5, Psychic: 2, Ghost: .5, Dark: 2, Steel: .5, Fairy: .5 },
  Rock: { Fire: 2, Ice: 2, Fighting: .5, Ground: .5, Flying: 2, Bug: 2, Steel: .5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: .5 },
  Dragon: { Dragon: 2, Steel: .5, Fairy: 0 },
  Dark: { Fighting: .5, Psychic: 2, Ghost: 2, Dark: .5, Fairy: .5 },
  Steel: { Fire: .5, Water: .5, Electric: .5, Ice: 2, Rock: 2, Steel: .5, Fairy: 2 },
  Fairy: { Fire: .5, Fighting: 2, Poison: .5, Dragon: 2, Dark: 2, Steel: .5 }
};
function typeEff(atkType, defTypes) { let v = 1; for (const t of defTypes) v *= (CHART[atkType] || {})[t] ?? 1; return v; }

// Moves: name, type, category (P physical / S special / X status), power, accuracy (null = never misses), priority, animation, effects
const MOVES = {};
function M(name, type, cat, pow, acc, pri, anim, e = {}) { MOVES[name] = { name, type, cat, pow, acc, pri, anim, e }; }
// Normal
M('Tackle', 'Normal', 'P', 40, 100, 0, 'contact');
M('Quick Attack', 'Normal', 'P', 40, 100, 1, 'dash');
M('Extreme Speed', 'Normal', 'P', 80, 100, 2, 'dash');
M('Body Slam', 'Normal', 'P', 85, 100, 0, 'contact', { st: ['par', 30] });
M('Headbutt', 'Normal', 'P', 70, 100, 0, 'contact', { fl: 30 });
M('Slash', 'Normal', 'P', 70, 100, 0, 'slash', { hc: 1 });
M('Double-Edge', 'Normal', 'P', 120, 100, 0, 'contact', { rc: 1 / 3 });
M('Swift', 'Normal', 'S', 60, null, 0, 'stars');
M('Hyper Beam', 'Normal', 'S', 150, 90, 0, 'beam', { rch: 1 });
M('Swords Dance', 'Normal', 'X', 0, null, 0, 'aura', { self: { atk: 2 } });
M('Harden', 'Normal', 'X', 0, null, 0, 'aura', { self: { def: 1 } });
M('Recover', 'Normal', 'X', 0, null, 0, 'heal', { heal: .5 });
M('Splash', 'Normal', 'X', 0, null, 0, 'splash', { none: 1 });
// Fire
M('Ember', 'Fire', 'S', 40, 100, 0, 'projectile', { st: ['brn', 10] });
M('Flamethrower', 'Fire', 'S', 90, 100, 0, 'beam', { st: ['brn', 10] });
M('Fire Blast', 'Fire', 'S', 110, 85, 0, 'burst', { st: ['brn', 10] });
M('Fire Punch', 'Fire', 'P', 75, 100, 0, 'contact', { st: ['brn', 10] });
M('Flare Blitz', 'Fire', 'P', 120, 100, 0, 'contact', { rc: 1 / 3, st: ['brn', 10], thaw: 1 });
M('Will-O-Wisp', 'Fire', 'X', 0, 85, 0, 'hex', { st: ['brn', 100] });
// Water
M('Water Gun', 'Water', 'S', 40, 100, 0, 'projectile');
M('Bubble Beam', 'Water', 'S', 65, 100, 0, 'projectile', { tg: { spe: -1 }, ch: 10 });
M('Surf', 'Water', 'S', 90, 100, 0, 'wave');
M('Hydro Pump', 'Water', 'S', 110, 80, 0, 'beam');
M('Scald', 'Water', 'S', 80, 100, 0, 'beam', { st: ['brn', 30] });
M('Aqua Jet', 'Water', 'P', 40, 100, 1, 'dash');
M('Waterfall', 'Water', 'P', 80, 100, 0, 'contact', { fl: 20 });
M('Crabhammer', 'Water', 'P', 100, 90, 0, 'slash', { hc: 1 });
// Grass
M('Vine Whip', 'Grass', 'P', 45, 100, 0, 'slash');
M('Razor Leaf', 'Grass', 'P', 55, 95, 0, 'leaves', { hc: 1 });
M('Seed Bomb', 'Grass', 'P', 80, 100, 0, 'projectile');
M('Giga Drain', 'Grass', 'S', 75, 100, 0, 'drain', { dr: .5 });
M('Energy Ball', 'Grass', 'S', 90, 100, 0, 'projectile', { tg: { spd: -1 }, ch: 10 });
M('Leaf Storm', 'Grass', 'S', 130, 90, 0, 'leaves', { self: { spa: -2 } });
M('Sleep Powder', 'Grass', 'X', 0, 75, 0, 'powder', { st: ['slp', 100], powder: 1 });
M('Stun Spore', 'Grass', 'X', 0, 75, 0, 'powder', { st: ['par', 100], powder: 1 });
// Electric
M('Thunder Shock', 'Electric', 'S', 40, 100, 0, 'bolt', { st: ['par', 10] });
M('Thunderbolt', 'Electric', 'S', 90, 100, 0, 'bolt', { st: ['par', 10] });
M('Thunder', 'Electric', 'S', 110, 70, 0, 'bolt', { st: ['par', 30] });
M('Thunder Punch', 'Electric', 'P', 75, 100, 0, 'contact', { st: ['par', 10] });
M('Volt Tackle', 'Electric', 'P', 120, 100, 0, 'contact', { rc: 1 / 3, st: ['par', 10] });
M('Thunder Wave', 'Electric', 'X', 0, 90, 0, 'hex', { st: ['par', 100], tw: 1 });
// Ice
M('Ice Shard', 'Ice', 'P', 40, 100, 1, 'projectile');
M('Ice Punch', 'Ice', 'P', 75, 100, 0, 'contact', { st: ['frz', 10] });
M('Aurora Beam', 'Ice', 'S', 65, 100, 0, 'beam', { tg: { atk: -1 }, ch: 10 });
M('Ice Beam', 'Ice', 'S', 90, 100, 0, 'beam', { st: ['frz', 10] });
M('Blizzard', 'Ice', 'S', 110, 70, 0, 'sky', { st: ['frz', 10] });
// Fighting
M('Mach Punch', 'Fighting', 'P', 40, 100, 1, 'dash');
M('Karate Chop', 'Fighting', 'P', 50, 100, 0, 'slash', { hc: 1 });
M('Brick Break', 'Fighting', 'P', 75, 100, 0, 'contact');
M('Cross Chop', 'Fighting', 'P', 100, 80, 0, 'slash', { hc: 1 });
M('Close Combat', 'Fighting', 'P', 120, 100, 0, 'contact', { self: { def: -1, spd: -1 } });
M('Aura Sphere', 'Fighting', 'S', 80, null, 0, 'projectile');
M('Bulk Up', 'Fighting', 'X', 0, null, 0, 'aura', { self: { atk: 1, def: 1 } });
// Poison
M('Poison Sting', 'Poison', 'P', 15, 100, 0, 'projectile', { st: ['psn', 30] });
M('Poison Jab', 'Poison', 'P', 80, 100, 0, 'contact', { st: ['psn', 30] });
M('Sludge Bomb', 'Poison', 'S', 90, 100, 0, 'projectile', { st: ['psn', 30] });
M('Gunk Shot', 'Poison', 'P', 120, 80, 0, 'projectile', { st: ['psn', 30] });
M('Toxic', 'Poison', 'X', 0, 90, 0, 'hex', { st: ['tox', 100] });
M('Acid Armor', 'Poison', 'X', 0, null, 0, 'aura', { self: { def: 2 } });
// Ground
M('Mud Shot', 'Ground', 'S', 55, 95, 0, 'projectile', { tg: { spe: -1 }, ch: 100 });
M('Dig', 'Ground', 'P', 80, 100, 0, 'dig');
M('Drill Run', 'Ground', 'P', 80, 95, 0, 'contact', { hc: 1 });
M('Earth Power', 'Ground', 'S', 90, 100, 0, 'quake', { tg: { spd: -1 }, ch: 10 });
M('Earthquake', 'Ground', 'P', 100, 100, 0, 'quake');
// Flying
M('Peck', 'Flying', 'P', 35, 100, 0, 'contact');
M('Wing Attack', 'Flying', 'P', 60, 100, 0, 'slash');
M('Aerial Ace', 'Flying', 'P', 60, null, 0, 'slash');
M('Air Slash', 'Flying', 'S', 75, 95, 0, 'wind', { fl: 30 });
M('Drill Peck', 'Flying', 'P', 80, 100, 0, 'contact');
M('Brave Bird', 'Flying', 'P', 120, 100, 0, 'contact', { rc: 1 / 3 });
M('Hurricane', 'Flying', 'S', 110, 70, 0, 'wind', { cf: 30 });
// Psychic
M('Confusion', 'Psychic', 'S', 50, 100, 0, 'psy', { cf: 10 });
M('Psybeam', 'Psychic', 'S', 65, 100, 0, 'beam', { cf: 10 });
M('Psychic', 'Psychic', 'S', 90, 100, 0, 'psy', { tg: { spd: -1 }, ch: 10 });
M('Zen Headbutt', 'Psychic', 'P', 80, 90, 0, 'contact', { fl: 20 });
M('Calm Mind', 'Psychic', 'X', 0, null, 0, 'aura', { self: { spa: 1, spd: 1 } });
M('Agility', 'Psychic', 'X', 0, null, 0, 'aura', { self: { spe: 2 } });
M('Amnesia', 'Psychic', 'X', 0, null, 0, 'aura', { self: { spd: 2 } });
M('Hypnosis', 'Psychic', 'X', 0, 60, 0, 'hex', { st: ['slp', 100] });
M('Rest', 'Psychic', 'X', 0, null, 0, 'heal', { rest: 1 });
// Bug
M('Bug Bite', 'Bug', 'P', 60, 100, 0, 'contact');
M('X-Scissor', 'Bug', 'P', 80, 100, 0, 'slash');
M('Leech Life', 'Bug', 'P', 80, 100, 0, 'drain', { dr: .5 });
M('Pin Missile', 'Bug', 'P', 25, 95, 0, 'multi', { hits: 1 });
M('Signal Beam', 'Bug', 'S', 75, 100, 0, 'beam', { cf: 10 });
M('Bug Buzz', 'Bug', 'S', 90, 100, 0, 'wave', { tg: { spd: -1 }, ch: 10 });
M('String Shot', 'Bug', 'X', 0, 95, 0, 'hex', { tg: { spe: -2 } });
// Ghost
M('Lick', 'Ghost', 'P', 30, 100, 0, 'contact', { st: ['par', 30] });
M('Shadow Claw', 'Ghost', 'P', 70, 100, 0, 'slash', { hc: 1 });
M('Shadow Ball', 'Ghost', 'S', 80, 100, 0, 'projectile', { tg: { spd: -1 }, ch: 20 });
M('Night Shade', 'Ghost', 'S', 1, 100, 0, 'psy', { fix: 50 });
M('Confuse Ray', 'Ghost', 'X', 0, null, 0, 'hex', { cf: 100 });
// Dragon
M('Dragon Breath', 'Dragon', 'S', 60, 100, 0, 'beam', { st: ['par', 30] });
M('Dragon Claw', 'Dragon', 'P', 80, 100, 0, 'slash');
M('Dragon Pulse', 'Dragon', 'S', 85, 100, 0, 'beam');
M('Outrage', 'Dragon', 'P', 120, 100, 0, 'contact', { ucf: 1 });
M('Dragon Dance', 'Dragon', 'X', 0, null, 0, 'aura', { self: { atk: 1, spe: 1 } });
// Steel
M('Metal Claw', 'Steel', 'P', 50, 95, 0, 'slash', { self: { atk: 1 }, sch: 10 });
M('Flash Cannon', 'Steel', 'S', 80, 100, 0, 'beam', { tg: { spd: -1 }, ch: 10 });
M('Iron Tail', 'Steel', 'P', 100, 75, 0, 'contact', { tg: { def: -1 }, ch: 30 });
M('Iron Defense', 'Steel', 'X', 0, null, 0, 'aura', { self: { def: 2 } });
// Rock
M('Rock Throw', 'Rock', 'P', 50, 90, 0, 'projectile');
M('Rock Slide', 'Rock', 'P', 75, 90, 0, 'sky', { fl: 30 });
M('Stone Edge', 'Rock', 'P', 100, 80, 0, 'sky', { hc: 1 });
M('Rock Polish', 'Rock', 'X', 0, null, 0, 'aura', { self: { spe: 2 } });
// Fairy
M('Fairy Wind', 'Fairy', 'S', 40, 100, 0, 'wind');
M('Dazzling Gleam', 'Fairy', 'S', 80, 100, 0, 'burst');
M('Moonblast', 'Fairy', 'S', 95, 100, 0, 'projectile', { tg: { spa: -1 }, ch: 30 });
M('Play Rough', 'Fairy', 'P', 90, 90, 0, 'contact', { tg: { atk: -1 }, ch: 10 });
M('Charm', 'Fairy', 'X', 0, 100, 0, 'hex', { tg: { atk: -2 } });
// Dark (coverage)
M('Bite', 'Dark', 'P', 60, 100, 0, 'contact', { fl: 30 });
M('Crunch', 'Dark', 'P', 80, 100, 0, 'contact', { tg: { def: -1 }, ch: 20 });

// Hand-picked movesets for signature teams; every other species gets a generated set.
const MOVESET_OVERRIDE = {
  Pikachu: ['Thunderbolt', 'Volt Tackle', 'Quick Attack', 'Iron Tail'],
  Charizard: ['Flamethrower', 'Air Slash', 'Dragon Pulse', 'Earth Power'],
  Blastoise: ['Hydro Pump', 'Ice Beam', 'Flash Cannon', 'Iron Defense'],
  Venusaur: ['Giga Drain', 'Sludge Bomb', 'Sleep Powder', 'Earth Power'],
  Snorlax: ['Body Slam', 'Crunch', 'Earthquake', 'Rest'],
  Lapras: ['Ice Beam', 'Surf', 'Thunderbolt', 'Rest'],
  Arcanine: ['Flare Blitz', 'Extreme Speed', 'Crunch', 'Will-O-Wisp'],
  Pinsir: ['X-Scissor', 'Close Combat', 'Stone Edge', 'Swords Dance'],
  Golbat: ['Brave Bird', 'Poison Jab', 'Bite', 'Confuse Ray'],
  Jolteon: ['Thunderbolt', 'Shadow Ball', 'Pin Missile', 'Agility'],
  Gyarados: ['Waterfall', 'Crunch', 'Hyper Beam', 'Dragon Dance'],
  Alakazam: ['Psychic', 'Shadow Ball', 'Calm Mind', 'Recover'],
  Gengar: ['Shadow Ball', 'Sludge Bomb', 'Hypnosis', 'Thunderbolt'],
  Mewtwo: ['Psychic', 'Aura Sphere', 'Ice Beam', 'Recover'],
  Mew: ['Psychic', 'Earth Power', 'Flamethrower', 'Calm Mind'],
  Dragonite: ['Outrage', 'Extreme Speed', 'Earthquake', 'Dragon Dance'],
  Machamp: ['Cross Chop', 'Stone Edge', 'Poison Jab', 'Bulk Up'],
  Chansey: ['Ice Beam', 'Thunderbolt', 'Toxic', 'Recover'],
  Magikarp: ['Splash', 'Tackle'],
  Caterpie: ['Tackle', 'String Shot', 'Bug Bite'],
  Metapod: ['Harden', 'Tackle', 'String Shot'],
  Weedle: ['Poison Sting', 'String Shot', 'Bug Bite'],
  Kakuna: ['Harden', 'Poison Sting', 'String Shot'],
  Ditto: ['Tackle', 'Swift', 'Harden']
};
// Held items (the reference HUD shows an item chip next to the type)
const ITEMS = { Pikachu: 'Light Ball', Snorlax: 'Leftovers', Lapras: 'Leftovers', Alakazam: 'Leftovers' };
const COVERAGE = {
  Normal: ['Dark', 'Ground', 'Ghost'], Fire: ['Ground', 'Dragon'], Water: ['Ice'], Grass: ['Poison', 'Ground'],
  Electric: ['Steel', 'Normal'], Psychic: ['Ghost', 'Fighting'], Ice: ['Water', 'Psychic'], Fighting: ['Rock', 'Dark'],
  Poison: ['Dark', 'Ground'], Ground: ['Rock'], Rock: ['Ground'], Bug: ['Flying', 'Fighting'], Ghost: ['Psychic', 'Dark'],
  Dragon: ['Fire', 'Ground'], Fairy: ['Psychic', 'Normal'], Steel: ['Ground', 'Rock'], Flying: ['Normal', 'Dark']
};
const TYPE_STATUS_MOVE = {
  Electric: 'Thunder Wave', Fire: 'Will-O-Wisp', Grass: 'Sleep Powder', Poison: 'Toxic', Psychic: 'Hypnosis',
  Ghost: 'Confuse Ray', Fairy: 'Charm', Fighting: 'Bulk Up', Dragon: 'Dragon Dance', Steel: 'Iron Defense',
  Rock: 'Rock Polish', Bug: 'String Shot', Ice: 'Amnesia', Water: 'Rest', Ground: 'Swords Dance', Normal: 'Swords Dance',
  Flying: 'Agility'
};
const STATUS_INFO = {
  brn: { label: 'BRN', name: 'burned', color: '#ff6b2b' }, psn: { label: 'PSN', name: 'poisoned', color: '#a24fd0' },
  tox: { label: 'TOX', name: 'badly poisoned', color: '#7a2fb0' }, par: { label: 'PAR', name: 'paralyzed', color: '#d8b400' },
  slp: { label: 'SLP', name: 'asleep', color: '#6c7a99' }, frz: { label: 'FRZ', name: 'frozen', color: '#3fb6d6' }
};
const STAT_LABEL = { atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'accuracy', eva: 'evasiveness' };
const STAT_CHIP = { atk: 'ATK', def: 'DEF', spa: 'SPA', spd: 'SPD', spe: 'SPE', acc: 'ACC', eva: 'EVA' };

/* =====================================================================
   Section 3: creature factory
   ===================================================================== */
function baseStats(d) {
  if (BASE_OVERRIDE[d.name]) { const b = BASE_OVERRIDE[d.name]; return { hp: b[0], atk: b[1], def: b[2], spa: b[3], spd: b[4], spe: b[5] }; }
  const r = mulberry(hashStr(d.name) ^ 0x51ed);
  const w1 = ARCH[d.types[0]], w2 = d.types[1] ? ARCH[d.types[1]] : w1;
  const w = w1.map((v, i) => (v * .7 + w2[i] * .3) * (0.85 + r() * .3));
  const sum = w.reduce((a, b) => a + b, 0), bst = TIER_BST[d.tier];
  const s = w.map(v => Math.max(10, Math.round(v / sum * bst)));
  return { hp: s[0], atk: s[1], def: s[2], spa: s[3], spd: s[4], spe: s[5] };
}
function levelStats(b) { // level 50, neutral nature, no training
  return { hp: b.hp + 60, atk: b.atk + 5, def: b.def + 5, spa: b.spa + 5, spd: b.spd + 5, spe: b.spe + 5 };
}
function pickBy(list, r) { return list[Math.floor(r() * list.length)]; }
function movesOfType(type, cat) { return Object.values(MOVES).filter(m => m.type === type && m.cat === cat).sort((a, b) => a.pow - b.pow); }
function buildMoveset(d, stats) {
  if (MOVESET_OVERRIDE[d.name]) return MOVESET_OVERRIDE[d.name].slice();
  const r = mulberry(hashStr(d.name) ^ 0xa11ce);
  const pref = stats.atk >= stats.spa ? 'P' : 'S', alt = pref === 'P' ? 'S' : 'P';
  const small = 'Wb B'.includes(d.tier);
  const out = [];
  const add = n => { if (n && MOVES[n] && !out.includes(n)) out.push(n); };
  const strong = (type, cat, level) => {
    let list = movesOfType(type, cat); if (!list.length) list = movesOfType(type, cat === 'P' ? 'S' : 'P'); if (!list.length) return null;
    list = list.filter(m => !m.e.rch || !small);
    if (level === 'mid') return list[Math.min(list.length - 1, Math.floor(list.length / 2))].name;
    const top = list.slice(-2); return pickBy(top, r).name;
  };
  const t1 = d.types[0], t2 = d.types[1];
  add(strong(t1, pref, small ? 'mid' : 'top'));
  if (t2) add(strong(t2, pref, small ? 'mid' : 'top'));
  else {
    const pri = Object.values(MOVES).find(m => m.type === t1 && m.pri > 0 && m.cat === 'P');
    if (pri && pref === 'P' && r() < .6) add(pri.name); else add(strong(t1, alt, 'mid'));
  }
  const cov = COVERAGE[t1] || ['Normal'];
  add(strong(pickBy(cov, r), pref, 'mid'));
  let status = TYPE_STATUS_MOVE[t1];
  if (stats.def > stats.spe + 25 && r() < .4) status = 'Recover';
  if (stats.spa > stats.atk + 20 && r() < .35) status = 'Calm Mind';
  add(status);
  for (let guardN = 0; out.length < 4 && guardN < 20; guardN++) {
    add(strong(pickBy(['Normal', t1, t2 || t1], r), pref, r() < .5 ? 'mid' : 'top'));
    if (out.length < 4 && guardN > 4) add(pickBy(['Swift', 'Headbutt', 'Body Slam', 'Tackle', 'Quick Attack'], r));
  }
  return out.slice(0, 4);
}
const zeroStages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 });
function makeMon(name) {
  const d = DEX_BY_NAME[name]; if (!d) return null;
  const base = baseStats(d), stats = levelStats(base);
  const m = {
    id: d.id, name: d.name, types: d.types, tier: d.tier, base, stats, max: stats.hp, hp: stats.hp,
    moves: buildMoveset(d, stats), status: '', slp: 0, tox: 0, stages: zeroStages(),
    vol: { conf: 0, flinch: false, recharge: false }, dmg: 0, kos: 0, fntShown: false, item: ITEMS[d.name] || ''
  };
  m.v = snapOf(m);
  return m;
}
function snapOf(m) { return { hp: m.hp, status: m.status, stages: { ...m.stages }, conf: m.vol.conf > 0 }; }

