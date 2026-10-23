/* =====================================================================
   Section 22: POKÉDEX ADVENTURE (story mode, per save slot)
   Start each run with one starter, catch Pokémon on the routes between
   gyms, and grow a Pokédex that is kept for the whole save slot.
   - New run: badges reset, choose a new starter, the Pokédex stays.
   - Delete (slot): everything is cleared.
   Levels are a story-progression mechanic only: they never change battles.
   Experience after each story battle = 0.8 × damage dealt + 200 for
   taking part. At its evolution level a Pokémon stops levelling and its
   evolved form joins the Pokédex at that level.
   ===================================================================== */
const STARTERS = ['Bulbasaur', 'Charmander', 'Squirtle'];
// Gen 1 (Red/Blue) catch rates.
const CATCH_RATE = { Bulbasaur: 45, Ivysaur: 45, Venusaur: 45, Charmander: 45, Charmeleon: 45, Charizard: 45, Squirtle: 45, Wartortle: 45, Blastoise: 45, Caterpie: 255, Metapod: 120, Butterfree: 45,
  Weedle: 255, Kakuna: 120, Beedrill: 45, Pidgey: 255, Pidgeotto: 120, Pidgeot: 45, Rattata: 255, Raticate: 90, Spearow: 255, Fearow: 90, Ekans: 255, Arbok: 90, Pikachu: 190, Raichu: 75,
  Sandshrew: 255, Sandslash: 90, 'Nidoran♀': 235, Nidorina: 120, Nidoqueen: 45, 'Nidoran♂': 235, Nidorino: 120, Nidoking: 45, Clefairy: 150, Clefable: 25, Vulpix: 190, Ninetales: 75,
  Jigglypuff: 170, Wigglytuff: 50, Zubat: 255, Golbat: 90, Oddish: 255, Gloom: 120, Vileplume: 45, Paras: 190, Parasect: 75, Venonat: 190, Venomoth: 75, Diglett: 255, Dugtrio: 50,
  Meowth: 255, Persian: 90, Psyduck: 190, Golduck: 75, Mankey: 190, Primeape: 75, Growlithe: 190, Arcanine: 75, Poliwag: 255, Poliwhirl: 120, Poliwrath: 45, Abra: 200, Kadabra: 100,
  Alakazam: 50, Machop: 180, Machoke: 90, Machamp: 45, Bellsprout: 255, Weepinbell: 120, Victreebel: 45, Tentacool: 190, Tentacruel: 60, Geodude: 255, Graveler: 120, Golem: 45,
  Ponyta: 190, Rapidash: 60, Slowpoke: 190, Slowbro: 75, Magnemite: 190, Magneton: 60, 'Farfetch’d': 45, Doduo: 190, Dodrio: 45, Seel: 190, Dewgong: 75, Grimer: 190, Muk: 75,
  Shellder: 190, Cloyster: 60, Gastly: 190, Haunter: 90, Gengar: 45, Onix: 45, Drowzee: 190, Hypno: 75, Krabby: 225, Kingler: 60, Voltorb: 190, Electrode: 60, Exeggcute: 90,
  Exeggutor: 45, Cubone: 190, Marowak: 75, Hitmonlee: 45, Hitmonchan: 45, Lickitung: 45, Koffing: 190, Weezing: 60, Rhyhorn: 120, Rhydon: 60, Chansey: 30, Tangela: 45, Kangaskhan: 45,
  Horsea: 225, Seadra: 75, Goldeen: 225, Seaking: 60, Staryu: 225, Starmie: 60, 'Mr. Mime': 45, Scyther: 45, Jynx: 45, Electabuzz: 45, Magmar: 45, Pinsir: 45, Tauros: 45, Magikarp: 255,
  Gyarados: 45, Lapras: 45, Ditto: 35, Eevee: 45, Vaporeon: 45, Jolteon: 45, Flareon: 45, Porygon: 45, Omanyte: 45, Omastar: 45, Kabuto: 45, Kabutops: 45, Aerodactyl: 45, Snorlax: 25,
  Articuno: 3, Zapdos: 3, Moltres: 3, Dratini: 45, Dragonair: 45, Dragonite: 45, Mewtwo: 3, Mew: 45 };
// Evolutions with Red/Blue levels; stone and trade evolutions use a fixed level here (stones 30–36, trades 40).
const EVO = { Bulbasaur: ['Ivysaur', 16], Ivysaur: ['Venusaur', 32], Charmander: ['Charmeleon', 16], Charmeleon: ['Charizard', 36], Squirtle: ['Wartortle', 16], Wartortle: ['Blastoise', 36],
  Caterpie: ['Metapod', 7], Metapod: ['Butterfree', 10], Weedle: ['Kakuna', 7], Kakuna: ['Beedrill', 10], Pidgey: ['Pidgeotto', 18], Pidgeotto: ['Pidgeot', 36], Rattata: ['Raticate', 20],
  Spearow: ['Fearow', 20], Ekans: ['Arbok', 22], Pikachu: ['Raichu', 30], Sandshrew: ['Sandslash', 22], 'Nidoran♀': ['Nidorina', 16], Nidorina: ['Nidoqueen', 36], 'Nidoran♂': ['Nidorino', 16],
  Nidorino: ['Nidoking', 36], Clefairy: ['Clefable', 30], Vulpix: ['Ninetales', 30], Jigglypuff: ['Wigglytuff', 30], Zubat: ['Golbat', 22], Oddish: ['Gloom', 21], Gloom: ['Vileplume', 36],
  Paras: ['Parasect', 24], Venonat: ['Venomoth', 31], Diglett: ['Dugtrio', 26], Meowth: ['Persian', 28], Psyduck: ['Golduck', 33], Mankey: ['Primeape', 28], Growlithe: ['Arcanine', 35],
  Poliwag: ['Poliwhirl', 25], Poliwhirl: ['Poliwrath', 36], Abra: ['Kadabra', 16], Kadabra: ['Alakazam', 40], Machop: ['Machoke', 28], Machoke: ['Machamp', 40], Bellsprout: ['Weepinbell', 21],
  Weepinbell: ['Victreebel', 36], Tentacool: ['Tentacruel', 30], Geodude: ['Graveler', 25], Graveler: ['Golem', 40], Ponyta: ['Rapidash', 40], Slowpoke: ['Slowbro', 37], Magnemite: ['Magneton', 30],
  Doduo: ['Dodrio', 31], Seel: ['Dewgong', 34], Grimer: ['Muk', 38], Shellder: ['Cloyster', 35], Gastly: ['Haunter', 25], Haunter: ['Gengar', 40], Drowzee: ['Hypno', 26], Krabby: ['Kingler', 28],
  Voltorb: ['Electrode', 30], Exeggcute: ['Exeggutor', 35], Cubone: ['Marowak', 28], Koffing: ['Weezing', 35], Rhyhorn: ['Rhydon', 42], Horsea: ['Seadra', 32], Goldeen: ['Seaking', 33],
  Staryu: ['Starmie', 35], Magikarp: ['Gyarados', 20], Eevee: [['Vaporeon', 'Jolteon', 'Flareon'], 30], Omanyte: ['Omastar', 40], Kabuto: ['Kabutops', 40], Dratini: ['Dragonair', 30], Dragonair: ['Dragonite', 55] };
/* The routes travelled between gyms 1–8 (map legs 0–7) and what can be caught there (Red/Blue), with wild levels.
   Gifts, trades, fossils and legendaries are placed on the nearest fitting leg. [species, minLv, maxLv, weight] */
const ROUTES = [
  { leg: 0, name: 'Route 1 · Viridian Forest · Route 22', scene: 'forest', mons: [['Pidgey', 2, 5, 10], ['Rattata', 2, 4, 10], ['Spearow', 3, 5, 6], ['Nidoran♀', 3, 4, 5], ['Nidoran♂', 3, 4, 5], ['Mankey', 3, 5, 4],
    ['Caterpie', 3, 5, 8], ['Weedle', 3, 5, 8], ['Metapod', 4, 6, 3], ['Kakuna', 4, 6, 3], ['Pikachu', 3, 5, 2], ['Poliwag', 5, 5, 3], ['Mr. Mime', 10, 10, .5]] },
  { leg: 1, name: 'Route 3 · Mt. Moon · Route 4', scene: 'cave', mons: [['Spearow', 6, 8, 8], ['Jigglypuff', 3, 7, 5], ['Ekans', 6, 8, 6], ['Sandshrew', 6, 8, 6], ['Rattata', 8, 10, 6], ['Zubat', 8, 11, 9],
    ['Geodude', 8, 10, 8], ['Paras', 8, 10, 6], ['Clefairy', 8, 12, 3], ['Magikarp', 5, 5, 3], ['Goldeen', 10, 10, 3], ['Omanyte', 15, 15, .8], ['Kabuto', 15, 15, .8], ['Aerodactyl', 30, 30, .3]] },
  { leg: 2, name: 'Route 5 · Underground Path · Route 6', scene: 'meadow', mons: [['Pidgey', 13, 16, 8], ['Oddish', 13, 16, 7], ['Bellsprout', 13, 16, 7], ['Meowth', 10, 16, 6], ['Mankey', 10, 16, 6],
    ['Abra', 10, 12, 4], ['Venonat', 13, 16, 5], ['Psyduck', 15, 15, 4], ['Krabby', 15, 15, 4], ['Shellder', 15, 15, 3], ['Horsea', 15, 15, 3], ['Jynx', 20, 20, .6], ['Farfetch’d', 20, 20, .6], ['Mewtwo', 70, 70, .15]] },
  { leg: 3, name: 'Route 6 · Saffron · Route 7', scene: 'city', mons: [['Pidgey', 19, 22, 7], ['Oddish', 19, 22, 5], ['Bellsprout', 19, 22, 5], ['Gloom', 22, 22, 2], ['Weepinbell', 22, 22, 2], ['Meowth', 17, 20, 6],
    ['Mankey', 17, 20, 6], ['Vulpix', 18, 20, 4], ['Growlithe', 18, 20, 4], ['Diglett', 15, 22, 6], ['Dugtrio', 29, 31, 1], ['Drowzee', 9, 15, 5], ['Ekans', 12, 15, 4], ['Sandshrew', 12, 15, 4],
    ['Slowpoke', 18, 18, 3], ['Eevee', 25, 25, .8], ['Porygon', 26, 26, .8]] },
  { leg: 4, name: 'Route 16 · Cycling Road · Route 18 · Safari Zone', scene: 'safari', mons: [['Spearow', 20, 22, 6], ['Fearow', 25, 27, 2], ['Doduo', 18, 29, 6], ['Rattata', 18, 22, 4], ['Raticate', 23, 29, 2],
    ['Ponyta', 28, 32, 3], ['Nidorino', 22, 27, 4], ['Nidorina', 22, 27, 4], ['Exeggcute', 24, 25, 4], ['Rhyhorn', 25, 25, 3], ['Venonat', 22, 22, 4], ['Paras', 22, 22, 3], ['Parasect', 25, 25, 2],
    ['Chansey', 26, 26, .8], ['Kangaskhan', 25, 25, .8], ['Scyther', 23, 25, .8], ['Pinsir', 23, 25, .8], ['Tauros', 21, 28, .8], ['Dratini', 15, 15, .8], ['Snorlax', 30, 30, .5], ['Lickitung', 15, 15, .6]] },
  { leg: 5, name: 'Routes 15–12 · Lavender Town · Route 8', scene: 'tower', mons: [['Pidgey', 23, 28, 6], ['Pidgeotto', 25, 30, 3], ['Oddish', 22, 26, 4], ['Gloom', 26, 28, 2], ['Bellsprout', 22, 26, 4], ['Weepinbell', 26, 28, 2],
    ['Venonat', 24, 28, 4], ['Ditto', 23, 28, 3], ['Gastly', 18, 25, 6], ['Haunter', 25, 30, 1], ['Cubone', 20, 25, 4], ['Abra', 15, 20, 3], ['Kadabra', 22, 25, 1], ['Machop', 15, 20, 4], ['Onix', 13, 17, 3],
    ['Magnemite', 21, 24, 4], ['Voltorb', 21, 24, 4], ['Pikachu', 20, 24, 2], ['Electabuzz', 33, 36, .8], ['Raichu', 33, 33, .5], ['Lapras', 15, 15, .8], ['Hitmonlee', 30, 30, .6], ['Hitmonchan', 30, 30, .6],
    ['Seaking', 25, 25, 2], ['Zapdos', 50, 50, .3]] },
  { leg: 6, name: 'Cycling Road · Sea Routes 19–20 · Seafoam Islands', scene: 'sea', mons: [['Tentacool', 25, 32, 8], ['Tentacruel', 35, 35, 1], ['Seel', 30, 35, 5], ['Dewgong', 38, 38, 1], ['Psyduck', 30, 30, 4], ['Golduck', 38, 38, 1],
    ['Slowpoke', 30, 30, 4], ['Slowbro', 37, 37, 1], ['Shellder', 30, 30, 4], ['Staryu', 30, 30, 4], ['Horsea', 30, 30, 4], ['Seadra', 35, 35, 1], ['Krabby', 30, 30, 4], ['Kingler', 37, 37, 1], ['Golbat', 30, 35, 3],
    ['Grimer', 30, 34, 3], ['Muk', 38, 38, .8], ['Koffing', 30, 34, 3], ['Weezing', 38, 38, .8], ['Ponyta', 30, 34, 2], ['Rapidash', 38, 38, .8], ['Magmar', 34, 38, .8], ['Aerodactyl', 30, 30, .4], ['Articuno', 50, 50, .3]] },
  { leg: 7, name: 'Sea Route 21 · Route 22 · Victory Road', scene: 'mountain', mons: [['Tangela', 28, 32, 6], ['Pidgeotto', 25, 30, 4], ['Raticate', 25, 30, 4], ['Tentacool', 25, 30, 4], ['Shellder', 30, 30, 3],
    ['Nidorino', 30, 35, 3], ['Nidorina', 30, 35, 3], ['Arbok', 35, 38, 2], ['Sandslash', 35, 38, 2], ['Fearow', 38, 40, 2], ['Graveler', 40, 42, 3], ['Onix', 40, 45, 3], ['Machoke', 42, 42, 1], ['Marowak', 40, 42, 1],
    ['Venomoth', 40, 40, 2], ['Golbat', 40, 40, 2], ['Ditto', 35, 35, 1], ['Moltres', 50, 50, .3], ['Mew', 30, 30, .15]] }
];
const expFor = lv => Math.pow(Math.max(1, lv), 3);                       // medium-fast growth: level n needs n³ experience
const levelFor = exp => Math.max(1, Math.min(100, Math.floor(Math.cbrt(exp + .5))));
const evoOf = sp => EVO[sp];
// Every Pokémon is a starter, a wild encounter, or reachable by evolution (development check).
function dexCoverage() {
  const have = new Set(STARTERS); for (const r of ROUTES) for (const [sp] of r.mons) have.add(sp);
  let grew = true; while (grew) { grew = false; for (const sp of [...have]) { const e = EVO[sp]; if (!e) continue; for (const nx of [].concat(e[0])) if (!have.has(nx)) { have.add(nx); grew = true; } } }
  return DEX.map(d => d.name).filter(n => !have.has(n));
}

/* ---------- the Pokédex of a save slot ---------- */
const isDexSave = sv => !!(sv && sv.type === 'dex');
function dexEntry(sv, sp) { return sv.dex && sv.dex[sp]; }
// Add (or improve) a Pokémon. Returns the entry.
function dexAdd(sv, sp, level) {
  sv.dex = sv.dex || {}; const e = sv.dex[sp];
  if (e) { if (level > e.level && !e.capped) { e.level = level; e.exp = expFor(level); } return e; }
  return (sv.dex[sp] = { species: sp, level, exp: expFor(level), capped: false, caughtAt: Date.now() });
}
// Gain experience; returns { from, to, evolved } for the summary.
function dexGainExp(sv, sp, amount) {
  const e = dexEntry(sv, sp); if (!e) return null;
  const from = e.level, out = { sp, from, to: from, gain: amount, evolved: null };
  if (e.capped) return out;                                             // at its evolution level: no more levels
  e.exp += amount; e.level = levelFor(e.exp);
  const evo = EVO[pickBase(sp)], suffix = pickShiny(sp) ? '|shiny' : '';    // a shiny evolves into the shiny form
  if (evo && e.level >= evo[1]) {
    e.level = evo[1]; e.exp = expFor(evo[1]); e.capped = true;
    let next = evo[0];
    if (Array.isArray(next)) { const fresh = next.filter(n => !dexEntry(sv, n + suffix)); next = (fresh.length ? fresh : next)[Math.floor(Math.random() * (fresh.length || next.length))]; }
    next += suffix;
    if (!dexEntry(sv, next)) { dexAdd(sv, next, evo[1]); out.evolved = next; }
  }
  out.to = e.level; return out;
}

/* ---------- styles ---------- */
(function dexCss() {
  const st = document.createElement('style');
  st.textContent = `
#dexOv,#starterOv{position:fixed;inset:0;z-index:85;display:none;align-items:center;justify-content:center;background:rgba(5,8,22,.78);backdrop-filter:blur(3px);padding:10px;font-family:var(--ui);color:#fff}
#dexOv.show,#starterOv.show{display:flex}
#dexOv .dx{width:min(980px,100%);max-height:100%;display:flex;flex-direction:column;border-radius:20px;background:linear-gradient(160deg,#c8202f,#8e1020);border:3px solid #2a0a10;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden}
#dexOv .dx-top{display:flex;align-items:center;gap:12px;padding:10px 14px;background:linear-gradient(#e0303f,#b01c2b);border-bottom:3px solid #2a0a10}
#dexOv .lens{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#bfe9ff,#2f8fe0 55%,#0b3a7a);border:3px solid #fff;box-shadow:0 0 12px #6fc3ff}
#dexOv .dx-top h3{margin:0;font-family:var(--display);font-size:clamp(20px,3vw,30px);flex:1}
#dexOv .dx-top small{display:block;font:700 12px var(--ui);color:#ffd3d8}
#dexOv .dx-close{border:0;border-radius:10px;background:#2a0a10;color:#fff;font:900 16px var(--ui);width:36px;height:36px;cursor:pointer}
#dexOv .dx-party{display:flex;gap:6px;padding:8px 12px;background:#2a0a10;align-items:center;flex-wrap:wrap}
#dexOv .dx-party b{font:900 11px var(--ui);letter-spacing:.14em;color:#ffb3bb;margin-right:4px}
#dexOv .dx-party .pm{width:46px;height:46px;border-radius:10px;background:#4a1320;display:flex;align-items:center;justify-content:center;position:relative}
#dexOv .dx-party .pm img,#dexOv .dx-party .pm canvas{max-width:42px;max-height:42px;image-rendering:pixelated}
#dexOv .dx-party .pm i{position:absolute;bottom:-3px;right:-3px;font:900 10px var(--ui);font-style:normal;background:#ffd84a;color:#2a1206;border-radius:6px;padding:0 3px}
#dexOv .dx-hint{flex:1;text-align:right;font:600 11px var(--ui);color:#ffb3bb}
#dexOv .dx-grid{flex:1;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;background:#f2f4f8}
#dexOv .dm{position:relative;border-radius:12px;background:#fff;border:2px solid #d8dce6;color:#1a1f33;padding:4px 4px 6px;text-align:center;cursor:pointer;font:700 11px var(--ui)}
#dexOv .dm.no{background:#e6e9f0;color:#9aa0b4;cursor:default}
#dexOv .dm.sh{background:linear-gradient(160deg,#fff8d8,#fff);border-color:#ffd84a}
#dexOv .dm.party{border-color:#ffb627;box-shadow:0 0 0 2px #ffb627}
#dexOv .dm .p{height:58px;display:flex;align-items:center;justify-content:center}
#dexOv .dm .p img,#dexOv .dm .p canvas{max-height:56px;max-width:100%;image-rendering:pixelated}
#dexOv .dm.no .p img,#dexOv .dm.no .p canvas{filter:brightness(0);opacity:.25}
#dexOv .dm .num{position:absolute;top:3px;left:6px;font:800 9px var(--ui);color:#8a90a6}
#dexOv .dm .lv{font:900 12px var(--ui);color:#c8202f}
#dexOv .dm .bar{height:5px;border-radius:9px;background:#e1e5ee;margin:3px 6px 0;overflow:hidden}
#dexOv .dm .bar i{display:block;height:100%;background:linear-gradient(90deg,#4aa6ff,#7ad7ff)}
#dexOv .dm .tag{position:absolute;top:3px;right:4px;font:900 8px var(--ui);padding:1px 4px;border-radius:5px;background:#ffd84a;color:#2a1206}
#dexOv .dm .tag.evo{background:#7ad7ff}
#starterOv .sb{width:min(760px,100%);border-radius:22px;background:linear-gradient(160deg,#1d2766,#121838 60%);border:2px solid #ffd84a;padding:18px;text-align:center}
#starterOv h3{margin:0 0 4px;font-family:var(--display);font-size:clamp(24px,3.4vw,36px);color:#ffd84a}
#starterOv p{margin:0 0 12px;color:#c7cff0;font:600 14px var(--ui)}
#starterOv .row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
#starterOv .st{border:3px solid rgba(255,255,255,.15);border-radius:18px;background:rgba(8,12,32,.6);padding:10px;cursor:pointer;color:#fff;font:800 16px var(--ui);transition:transform .15s}
#starterOv .st:hover,#starterOv .st:focus{transform:translateY(-4px);border-color:var(--c)}
#starterOv .st .p{height:110px;display:flex;align-items:center;justify-content:center}
#starterOv .st .p img,#starterOv .st .p canvas{max-height:104px;image-rendering:pixelated}
#starterOv .st small{display:block;font:700 12px var(--ui);color:#a9b6ff}
#starterOv .st .own{display:block;font:800 11px var(--ui);color:#ffd84a;margin-top:3px}
#storyOv .sy-exp{margin:8px auto 0;max-width:520px;text-align:left;background:rgba(8,12,32,.6);border-radius:12px;padding:8px 12px;font:700 13px var(--ui);color:#e6ebff}
#storyOv .sy-exp div{display:flex;gap:8px;justify-content:space-between}
#storyOv .sy-exp .ev{color:#7ad7ff}
@media (max-height:560px){#dexOv .dx-grid{grid-template-columns:repeat(auto-fill,minmax(92px,1fr))}#dexOv .dm .p{height:42px}#dexOv .dm .p img,#dexOv .dm .p canvas{max-height:40px}#starterOv .st .p{height:70px}#starterOv .st .p img,#starterOv .st .p canvas{max-height:66px}}`;
  document.head.appendChild(st);
  for (const id of ['dexOv', 'starterOv']) { const d = document.createElement('div'); d.id = id; d.setAttribute('role', 'dialog'); document.body.appendChild(d); }
  addEventListener('keydown', e => { if (e.key === 'Escape') { $('dexOv').classList.remove('show'); } });
})();

/* ---------- the Pokédex pop-up (from the map and gym cards): all 151, levels, party ---------- */
function openDex() {
  const sv = STORY.save; if (!isDexSave(sv)) return;
  const party = sv.team || [], owned = new Set(Object.keys(sv.dex || {}).map(pickBase)).size, shinies = Object.keys(sv.dex || {}).filter(pickShiny).length, ov = $('dexOv');
  const pic = n => { try { const el = monPic(n); return el; } catch (e) { return document.createElement('span'); } };
  ov.innerHTML = `<div class="dx"><div class="dx-top"><div class="lens"></div><h3>POKÉDEX<small>Caught ${owned} / ${DEX.length}${shinies ? ` · \u2728 ${shinies} shiny` : ''} · Party ${party.length} / 6 · tap a Pokémon to add or remove it from your party</small></h3><button class="dx-close" type="button" aria-label="Close">✕</button></div>
    <div class="dx-party" id="dxParty"><b>PARTY</b></div><div class="dx-grid" id="dxGrid"></div></div>`;
  ov.querySelector('.dx-close').onclick = () => { ov.classList.remove('show'); if (STORY.open) renderStory(); };
  ov.onclick = e => { if (e.target === ov) ov.querySelector('.dx-close').click(); };
  const pr = $('dxParty');
  for (const n of party) { const e = dexEntry(sv, n), d = document.createElement('div'); d.className = 'pm'; d.title = `${pickLabel(n)} · Lv ${e ? e.level : '?'}`; d.appendChild(pic(n)); d.insertAdjacentHTML('beforeend', `<i>${e ? e.level : ''}</i>`); pr.appendChild(d); }
  pr.insertAdjacentHTML('beforeend', `<span class="dx-hint">${party.length >= 6 ? 'Party full' : ''}</span>`);
  const grid = $('dxGrid');
  const card = (d, key) => {                                    // one card per form: the regular one, and the shiny one when caught
    const e = dexEntry(sv, key), shiny = pickShiny(key), el = document.createElement(e ? 'button' : 'div'); el.className = 'dm' + (e ? '' : ' no') + (party.includes(key) ? ' party' : '') + (shiny ? ' sh' : '');
    if (e) el.type = 'button';
    const next = e && e.exp - expFor(e.level), span = e && expFor(e.level + 1) - expFor(e.level), pct = e ? (e.capped ? 100 : Math.max(0, Math.min(100, next / span * 100))) : 0;
    el.innerHTML = `<span class="num">#${String(d.id).padStart(3, '0')}${shiny ? ' \u2728' : ''}</span>${e && party.includes(key) ? '<span class="tag">PARTY</span>' : e && e.capped ? '<span class="tag evo">EVOLVED</span>' : ''}<div class="p"></div>
      <div>${e ? pickLabel(key) : '???'}</div>${e ? `<div class="lv">Lv ${e.level}</div><div class="bar"><i style="width:${pct.toFixed(0)}%"></i></div>` : ''}`;
    el.querySelector('.p').appendChild(pic(key));
    if (e) el.onclick = () => {
      const t = sv.team = (sv.team || []).slice(), at = t.indexOf(key);
      if (at >= 0) { if (t.length <= 1) { toastMsg('Your party needs at least one Pokémon'); return; } t.splice(at, 1); }
      else { if (t.length >= 6) { toastMsg('Your party is full (6) — remove one first'); return; } t.push(key); }
      saveStory(); const y = grid.scrollTop; openDex(); $('dxGrid').scrollTop = y;
    };
    grid.appendChild(el);
  };
  for (const d of DEX) { card(d, d.name); if (dexEntry(sv, d.name + '|shiny')) card(d, d.name + '|shiny'); }
  ov.classList.add('show');
}

/* ---------- choosing a starter (a new run) ---------- */
function chooseStarter() {
  return new Promise(res => {
    const sv = STORY.save, ov = $('starterOv');
    ov.innerHTML = `<div class="sb"><h3>Choose your starter</h3><p>It will be the only Pokémon in your party. Catch more on the routes between gyms!</p><div class="row">${STARTERS.map((n, i) => {
      const e = isDexSave(sv) && dexEntry(sv, n); return `<button type="button" class="st" data-n="${n}" style="--c:${['#58d65a', '#ff7b2a', '#4aa6ff'][i]}"><div class="p"></div>${n}<small>${DEX_BY_NAME[n].types.join(' / ')} · Lv ${e ? e.level : 5}</small>${e ? '<span class="own">Already in your Pokédex</span>' : ''}</button>`; }).join('')}</div></div>`;
    for (const b of ov.querySelectorAll('.st')) { b.querySelector('.p').appendChild(monPic(b.dataset.n)); b.onclick = () => { ov.classList.remove('show'); res(b.dataset.n); }; }
    ov.classList.add('show'); setTimeout(() => ov.querySelector('.st').focus(), 50);
  });
}
// A new run in the current slot: badges reset, a new starter; the Pokédex is kept.
async function startDexRun() {
  const old = STORY.save, keep = isDexSave(old) ? old.dex : {};
  const starter = await chooseStarter();
  STORY.save = { type: 'dex', dex: keep, runs: ((old && old.runs) || 0) + 1, trainer: TRSEL.A, team: [starter], badges: 0, wins: 0, losses: 0, ash: null, encountered: {}, startedAt: Date.now(), finishedAt: null };
  dexAdd(STORY.save, starter, 5); saveStory();
  openStoryScreen(); setTimeout(() => openGymCard(0), 500);
}

/* ---------- experience after each story battle ---------- */
function awardExp() {
  const sv = STORY.save; if (!isDexSave(sv) || !G || !G.sides) return [];
  return G.sides.A.team.map(m => dexGainExp(sv, m.pick || m.name, Math.round((m.dmgDealt || 0) * .8) + 200)).filter(Boolean);
}
function expSummaryHtml(list) {
  if (!list.length) return '';
  return `<div class="sy-exp">${list.map(r => `<div><span>${pickLabel(r.sp)} +${r.gain} EXP</span><span>${r.from === r.to ? 'Lv ' + r.to : 'Lv ' + r.from + ' \u2192 ' + r.to}</span></div>${r.evolved ? `<div class="ev"><span>\u2728 ${pickLabel(r.sp)} reached its evolution level \u2014 ${pickLabel(r.evolved)} joined your Pok\u00E9dex!</span></div>` : ''}`).join('')}</div>`;
}
const _dexStoryResult = storyResult;
storyResult = function (won) {
  const gains = awardExp(); if (gains.length) saveStory();
  const r = _dexStoryResult.apply(this, arguments);
  if (gains.length) setTimeout(() => { const box = document.querySelector('#syModal .sy-cer'); if (box && !box.querySelector('.sy-exp')) { const btn = box.querySelector('button'); (btn ? btn.parentElement === box ? btn : btn.parentElement : box).insertAdjacentHTML('beforebegin', expSummaryHtml(gains)); } }, 60);
  return r;
};

/* ---------- the story screen and panel know about Pokédex runs ---------- */
(function dexStoryUi() {
  const top = document.querySelector('#storyOv .sy-top'); if (!top) return;
  const b = document.createElement('button'); b.className = 'sy-btn'; b.id = 'syDex'; b.type = 'button'; b.textContent = 'Pokédex'; b.style.display = 'none';
  b.onclick = openDex; top.insertBefore(b, $('syMenu'));
})();
const _dexRenderStory = renderStory;
renderStory = function () {
  const r = _dexRenderStory.apply(this, arguments);
  const sv = STORY.save, b = $('syDex'); if (b) b.style.display = isDexSave(sv) ? '' : 'none';
  if (isDexSave(sv)) { const nx = $('syNext'); if (nx && !nx.querySelector('.dx-team')) nx.insertAdjacentHTML('beforeend', `<button class="sy-btn dx-team" type="button" style="width:100%;margin-top:6px" onclick="openDex()">Edit party (${sv.team.length}/6)</button>`); }
  return r;
};
const _dexOpenGymCard = openGymCard;
openGymCard = function (i) {
  const r = _dexOpenGymCard.apply(this, arguments);
  if (isDexSave(STORY.save)) { const acts = document.querySelector('#syModal .acts'); if (acts && !acts.querySelector('.dx-team')) acts.insertAdjacentHTML('beforeend', `<button class="sy-btn dx-team" type="button" onclick="openDex()">Party (${STORY.save.team.length}/6)</button>`); }
  return r;
};
const _dexPanel = renderStoryPanel;
renderStoryPanel = function () {
  const r = _dexPanel.apply(this, arguments);
  const sv = STORY.save, row = document.querySelector('#stStoryP .row'); if (!row) return r;
  if (!sv) {                                                    // empty slot: choose which kind of journey
    const nb = $('stStoryNew'); if (nb) { nb.textContent = 'Classic journey'; nb.title = 'Pick a full team of six and challenge every gym'; }
    row.insertAdjacentHTML('afterbegin', '<button class="big" type="button" id="stStoryDexNew" title="Start with one starter and catch Pokémon on the routes">Pokédex Adventure</button>');
    $('stStoryDexNew').onclick = startDexRun;
  } else if (isDexSave(sv)) {                                   // Pokédex slot: continue, new run (keeps the Pokédex), Pokédex
    const nb = $('stStoryNew'); if (nb) { nb.textContent = 'New run'; nb.title = 'Badges reset and you pick a new starter — your Pokédex is kept'; nb.onclick = () => { if (!confirm(`Start a new run in slot ${STORY.slot}? Badges reset and you choose a new starter. Your Pokédex (${Object.keys(sv.dex || {}).length} Pokémon) is kept.`)) return; startDexRun(); }; }
    row.insertAdjacentHTML('beforeend', `<button class="big alt" type="button" id="stStoryDex">Pokédex (${Object.keys(sv.dex || {}).length})</button>`);
    $('stStoryDex').onclick = openDex;
  }
  for (const s2 of document.querySelectorAll('#stStoryP .slot')) { const v = readSlot(+s2.dataset.slot); if (isDexSave(v)) { const sm = s2.querySelector('small'); if (sm) sm.textContent = `Pok\u00E9dex ${Object.keys(v.dex || {}).length} \u00B7 ${v.badges}/${GYMS.length} badges`; } }
  return r;
};
syncOnlineUi();
window.dexCoverage = dexCoverage;
