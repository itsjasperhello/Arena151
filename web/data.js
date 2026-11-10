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
/* Battle slots. Singles: A (player 1) and B (player 2). Doubles add C (player 1's second Pokémon) and D (player 2's second).
   teamOf maps a slot to its team; other(s) is the opponent to face and attack: in singles the one opponent, in doubles the
   nearest opponent still standing (or, while a move or hit is resolving, the one it is aimed at: G.forceFoe). */
const slotTeam = s => (s === 'C' ? 'A' : s === 'D' ? 'B' : s);
const foeTeam = s => (slotTeam(s) === 'A' ? 'B' : 'A');
const partnerOf = s => ({ A: 'C', C: 'A', B: 'D', D: 'B' })[s];
const SLOTS = () => (typeof G !== 'undefined' && G && G.doubles ? ['A', 'B', 'C', 'D'] : ['A', 'B']);
const foeSlots = s => (typeof G !== 'undefined' && G && G.doubles ? (slotTeam(s) === 'A' ? ['B', 'D'] : ['A', 'C']) : [slotTeam(s) === 'A' ? 'B' : 'A']);
const slotLive = s => { const sd = G && G.sides[s]; if (!sd || sd.state === 'empty') return false; const m = sd.team[sd.active]; return !!m && m.hp > 0; };
function nearestFoe(s) { const me = G.sides[s], foes = foeSlots(s).filter(slotLive); if (!foes.length) return foeSlots(s)[0];
  let best = foes[0], bd = Infinity; for (const f of foes) { const o = G.sides[f], d = Math.hypot(o.x - me.x, o.y - me.y); if (d < bd) { bd = d; best = f; } } return best; }
const other = s => {
  if (typeof G === 'undefined' || !G || !G.doubles) return s === 'A' ? 'B' : 'A';
  if (G.forceFoe && slotTeam(G.forceFoe) !== slotTeam(s) && G.sides[G.forceFoe]) return G.forceFoe;
  return nearestFoe(s);
};
const TEAM_NAME = { A: 'Red', B: 'Blue' };
Object.defineProperty(TEAM_NAME, 'C', { get() { return TEAM_NAME.A; }, enumerable: false }); Object.defineProperty(TEAM_NAME, 'D', { get() { return TEAM_NAME.B; }, enumerable: false });

/* =====================================================================
   Section 2: data — roster, types, moves
   ===================================================================== */
// name|type1|type2|tier   tier → base stat total used for generated stats
const ROSTER_RAW = `Bulbasaur|Grass|Poison|B;Ivysaur|Grass|Poison|M;Venusaur|Grass|Poison|F;Charmander|Fire||B;Charmeleon|Fire||M;Charizard|Fire|Flying|F;Squirtle|Water||B;Wartortle|Water||M;Blastoise|Water||F;Caterpie|Bug||W;Metapod|Bug||W;Butterfree|Bug|Flying|k;Weedle|Bug|Poison|W;Kakuna|Bug|Poison|W;Beedrill|Bug|Poison|k;Pidgey|Normal|Flying|B;Pidgeotto|Normal|Flying|M;Pidgeot|Normal|Flying|f;Rattata|Normal||b;Raticate|Normal||k;Spearow|Normal|Flying|b;Fearow|Normal|Flying|g;Ekans|Poison||b;Arbok|Poison||g;Pikachu|Electric||b;Raichu|Electric||f;Sandshrew|Ground||b;Sandslash|Ground||g;Nidoran♀|Poison||B;Nidorina|Poison||M;Nidoqueen|Poison|Ground|F;Nidoran♂|Poison||B;Nidorino|Poison||M;Nidoking|Poison|Ground|F;Clefairy|Fairy||b;Clefable|Fairy||f;Vulpix|Fire||b;Ninetales|Fire||f;Jigglypuff|Normal|Fairy|b;Wigglytuff|Normal|Fairy|g;Zubat|Poison|Flying|b;Golbat|Poison|Flying|g;Oddish|Grass|Poison|B;Gloom|Grass|Poison|M;Vileplume|Grass|Poison|F;Paras|Bug|Grass|b;Parasect|Bug|Grass|k;Venonat|Bug|Poison|b;Venomoth|Bug|Poison|g;Diglett|Ground||b;Dugtrio|Ground||k;Meowth|Normal||b;Persian|Normal||g;Psyduck|Water||b;Golduck|Water||f;Mankey|Fighting||b;Primeape|Fighting||g;Growlithe|Fire||b;Arcanine|Fire||F;Poliwag|Water||B;Poliwhirl|Water||M;Poliwrath|Water|Fighting|F;Abra|Psychic||B;Kadabra|Psychic||M;Alakazam|Psychic||F;Machop|Fighting||B;Machoke|Fighting||M;Machamp|Fighting||F;Bellsprout|Grass|Poison|B;Weepinbell|Grass|Poison|M;Victreebel|Grass|Poison|F;Tentacool|Water|Poison|b;Tentacruel|Water|Poison|f;Geodude|Rock|Ground|B;Graveler|Rock|Ground|M;Golem|Rock|Ground|F;Ponyta|Fire||b;Rapidash|Fire||f;Slowpoke|Water|Psychic|b;Slowbro|Water|Psychic|f;Magnemite|Electric|Steel|b;Magneton|Electric|Steel|f;Farfetch’d|Normal|Flying|k;Doduo|Normal|Flying|b;Dodrio|Normal|Flying|f;Seel|Water||b;Dewgong|Water|Ice|f;Grimer|Poison||b;Muk|Poison||f;Shellder|Water||b;Cloyster|Water|Ice|F;Gastly|Ghost|Poison|B;Haunter|Ghost|Poison|M;Gengar|Ghost|Poison|F;Onix|Rock|Ground|k;Drowzee|Psychic||b;Hypno|Psychic||f;Krabby|Water||b;Kingler|Water||f;Voltorb|Electric||b;Electrode|Electric||f;Exeggcute|Grass|Psychic|b;Exeggutor|Grass|Psychic|F;Cubone|Ground||b;Marowak|Ground||g;Hitmonlee|Fighting||g;Hitmonchan|Fighting||g;Lickitung|Normal||k;Koffing|Poison||b;Weezing|Poison||f;Rhyhorn|Ground|Rock|b;Rhydon|Ground|Rock|f;Chansey|Normal||g;Tangela|Grass||g;Kangaskhan|Normal||f;Horsea|Water||b;Seadra|Water||g;Goldeen|Water||b;Seaking|Water||g;Staryu|Water||b;Starmie|Water|Psychic|f;Mr. Mime|Psychic|Fairy|g;Scyther|Bug|Flying|f;Jynx|Ice|Psychic|g;Electabuzz|Electric||f;Magmar|Fire||f;Pinsir|Bug||f;Tauros|Normal||f;Magikarp|Water||W;Gyarados|Water|Flying|F;Lapras|Water|Ice|F;Ditto|Normal||b;Eevee|Normal||b;Vaporeon|Water||F;Jolteon|Electric||F;Flareon|Fire||F;Porygon|Normal||k;Omanyte|Rock|Water|b;Omastar|Rock|Water|f;Kabuto|Rock|Water|b;Kabutops|Rock|Water|f;Aerodactyl|Rock|Flying|F;Snorlax|Normal||F;Articuno|Ice|Flying|L;Zapdos|Electric|Flying|L;Moltres|Fire|Flying|L;Dratini|Dragon||B;Dragonair|Dragon||M;Dragonite|Dragon|Flying|L;Mewtwo|Psychic||X;Mew|Psychic||L;Chikorita|Grass||B;Bayleef|Grass||M;Meganium|Grass||F;Cyndaquil|Fire||B;Quilava|Fire||M;Typhlosion|Fire||F;Totodile|Water||B;Croconaw|Water||M;Feraligatr|Water||F;Sentret|Normal||b;Furret|Normal||g;Hoothoot|Normal|Flying|b;Noctowl|Normal|Flying|g;Ledyba|Bug|Flying|b;Ledian|Bug|Flying|k;Spinarak|Bug|Poison|b;Ariados|Bug|Poison|k;Crobat|Poison|Flying|F;Chinchou|Water|Electric|b;Lanturn|Water|Electric|f;Pichu|Electric||W;Cleffa|Fairy||W;Igglybuff|Normal|Fairy|W;Togepi|Fairy||W;Togetic|Fairy|Flying|g;Natu|Psychic|Flying|b;Xatu|Psychic|Flying|f;Mareep|Electric||B;Flaaffy|Electric||M;Ampharos|Electric||F;Bellossom|Grass||F;Marill|Water|Fairy|b;Azumarill|Water|Fairy|g;Sudowoodo|Rock||g;Politoed|Water||F;Hoppip|Grass|Flying|b;Skiploom|Grass|Flying|M;Jumpluff|Grass|Flying|g;Aipom|Normal||b;Sunkern|Grass||W;Sunflora|Grass||g;Yanma|Bug|Flying|k;Wooper|Water|Ground|b;Quagsire|Water|Ground|f;Espeon|Psychic||F;Umbreon|Dark||F;Murkrow|Dark|Flying|k;Slowking|Water|Psychic|F;Misdreavus|Ghost||k;Unown|Psychic||W;Wobbuffet|Psychic||g;Girafarig|Normal|Psychic|g;Pineco|Bug||b;Forretress|Bug|Steel|f;Dunsparce|Normal||k;Gligar|Ground|Flying|g;Steelix|Steel|Ground|F;Snubbull|Fairy||b;Granbull|Fairy||f;Qwilfish|Water|Poison|g;Scizor|Bug|Steel|F;Shuckle|Bug|Rock|k;Heracross|Bug|Fighting|F;Sneasel|Dark|Ice|g;Teddiursa|Normal||b;Ursaring|Normal||F;Slugma|Fire||b;Magcargo|Fire|Rock|g;Swinub|Ice|Ground|b;Piloswine|Ice|Ground|f;Corsola|Water|Rock|k;Remoraid|Water||b;Octillery|Water||f;Delibird|Ice|Flying|k;Mantine|Water|Flying|f;Skarmory|Steel|Flying|F;Houndour|Dark|Fire|B;Houndoom|Dark|Fire|F;Kingdra|Water|Dragon|F;Phanpy|Ground||b;Donphan|Ground||F;Porygon2|Normal||F;Stantler|Normal||g;Smeargle|Normal||k;Tyrogue|Fighting||W;Hitmontop|Fighting||g;Smoochum|Ice|Psychic|W;Elekid|Electric||b;Magby|Fire||b;Miltank|Normal||f;Blissey|Normal||F;Raikou|Electric||L;Entei|Fire||L;Suicune|Water||L;Larvitar|Rock|Ground|B;Pupitar|Rock|Ground|M;Tyranitar|Rock|Dark|L;Lugia|Psychic|Flying|X;Ho-Oh|Fire|Flying|X;Celebi|Psychic|Grass|L;Treecko|Grass||B;Grovyle|Grass||M;Sceptile|Grass||F;Torchic|Fire||B;Combusken|Fire|Fighting|M;Blaziken|Fire|Fighting|F;Mudkip|Water||B;Marshtomp|Water|Ground|M;Swampert|Water|Ground|F;Poochyena|Dark||b;Mightyena|Dark||g;Zigzagoon|Normal||b;Linoone|Normal||g;Wurmple|Bug||W;Silcoon|Bug||W;Beautifly|Bug|Flying|k;Cascoon|Bug||W;Dustox|Bug|Poison|k;Lotad|Water|Grass|b;Lombre|Water|Grass|M;Ludicolo|Water|Grass|f;Seedot|Grass||b;Nuzleaf|Grass|Dark|M;Shiftry|Grass|Dark|f;Taillow|Normal|Flying|b;Swellow|Normal|Flying|f;Wingull|Water|Flying|b;Pelipper|Water|Flying|g;Ralts|Psychic|Fairy|b;Kirlia|Psychic|Fairy|M;Gardevoir|Psychic|Fairy|F;Surskit|Bug|Water|b;Masquerain|Bug|Flying|g;Shroomish|Grass||b;Breloom|Grass|Fighting|F;Slakoth|Normal||b;Vigoroth|Normal||M;Slaking|Normal||F;Nincada|Bug|Ground|b;Ninjask|Bug|Flying|g;Shedinja|Bug|Ghost|k;Whismur|Normal||b;Loudred|Normal||M;Exploud|Normal||f;Makuhita|Fighting||b;Hariyama|Fighting||f;Azurill|Normal|Fairy|W;Nosepass|Rock||k;Skitty|Normal||b;Delcatty|Normal||g;Sableye|Dark|Ghost|k;Mawile|Steel|Fairy|k;Aron|Steel|Rock|b;Lairon|Steel|Rock|M;Aggron|Steel|Rock|F;Meditite|Fighting|Psychic|b;Medicham|Fighting|Psychic|f;Electrike|Electric||b;Manectric|Electric||f;Plusle|Electric||k;Minun|Electric||k;Volbeat|Bug||k;Illumise|Bug||k;Roselia|Grass|Poison|k;Gulpin|Poison||b;Swalot|Poison||g;Carvanha|Water|Dark|b;Sharpedo|Water|Dark|f;Wailmer|Water||b;Wailord|Water||f;Numel|Fire|Ground|b;Camerupt|Fire|Ground|f;Torkoal|Fire||g;Spoink|Psychic||b;Grumpig|Psychic||g;Spinda|Normal||k;Trapinch|Ground||b;Vibrava|Ground|Dragon|M;Flygon|Ground|Dragon|F;Cacnea|Grass||b;Cacturne|Grass|Dark|g;Swablu|Normal|Flying|b;Altaria|Dragon|Flying|f;Zangoose|Normal||g;Seviper|Poison||g;Lunatone|Rock|Psychic|g;Solrock|Rock|Psychic|g;Barboach|Water|Ground|b;Whiscash|Water|Ground|g;Corphish|Water||b;Crawdaunt|Water|Dark|f;Baltoy|Ground|Psychic|b;Claydol|Ground|Psychic|f;Lileep|Rock|Grass|b;Cradily|Rock|Grass|f;Anorith|Rock|Bug|b;Armaldo|Rock|Bug|f;Feebas|Water||W;Milotic|Water||F;Castform|Normal||k;Kecleon|Normal||g;Shuppet|Ghost||b;Banette|Ghost||g;Duskull|Ghost||b;Dusclops|Ghost||f;Tropius|Grass|Flying|g;Chimecho|Psychic||k;Absol|Dark||f;Wynaut|Psychic||W;Snorunt|Ice||b;Glalie|Ice||f;Spheal|Ice|Water|b;Sealeo|Ice|Water|M;Walrein|Ice|Water|F;Clamperl|Water||b;Huntail|Water||f;Gorebyss|Water||f;Relicanth|Water|Rock|g;Luvdisc|Water||W;Bagon|Dragon||B;Shelgon|Dragon||M;Salamence|Dragon|Flying|L;Beldum|Steel|Psychic|B;Metang|Steel|Psychic|M;Metagross|Steel|Psychic|L;Regirock|Rock||L;Regice|Ice||L;Registeel|Steel||L;Latias|Dragon|Psychic|L;Latios|Dragon|Psychic|L;Kyogre|Water||X;Groudon|Ground||X;Rayquaza|Dragon|Flying|X;Jirachi|Steel|Psychic|L;Deoxys|Psychic||X;Turtwig|Grass||B;Grotle|Grass||M;Torterra|Grass|Ground|F;Chimchar|Fire||B;Monferno|Fire|Fighting|M;Infernape|Fire|Fighting|F;Piplup|Water||B;Prinplup|Water||M;Empoleon|Water|Steel|F;Starly|Normal|Flying|b;Staravia|Normal|Flying|M;Staraptor|Normal|Flying|f;Bidoof|Normal||b;Bibarel|Normal|Water|g;Kricketot|Bug||W;Kricketune|Bug||k;Shinx|Electric||b;Luxio|Electric||M;Luxray|Electric||f;Budew|Grass|Poison|W;Roserade|Grass|Poison|f;Cranidos|Rock||b;Rampardos|Rock||f;Shieldon|Rock|Steel|b;Bastiodon|Rock|Steel|f;Burmy|Bug||W;Wormadam|Bug|Grass|k;Mothim|Bug|Flying|k;Combee|Bug|Flying|W;Vespiquen|Bug|Flying|g;Pachirisu|Electric||k;Buizel|Water||b;Floatzel|Water||g;Cherubi|Grass||W;Cherrim|Grass||k;Shellos|Water||b;Gastrodon|Water|Ground|g;Ambipom|Normal||g;Drifloon|Ghost|Flying|b;Drifblim|Ghost|Flying|g;Buneary|Normal||b;Lopunny|Normal||g;Mismagius|Ghost||f;Honchkrow|Dark|Flying|f;Glameow|Normal||b;Purugly|Normal||g;Chingling|Psychic||W;Stunky|Poison|Dark|b;Skuntank|Poison|Dark|g;Bronzor|Steel|Psychic|b;Bronzong|Steel|Psychic|f;Bonsly|Rock||W;Mime Jr.|Psychic|Fairy|W;Happiny|Normal||W;Chatot|Normal|Flying|k;Spiritomb|Ghost|Dark|g;Gible|Dragon|Ground|B;Gabite|Dragon|Ground|M;Garchomp|Dragon|Ground|L;Munchlax|Normal||b;Riolu|Fighting||b;Lucario|Fighting|Steel|F;Hippopotas|Ground||b;Hippowdon|Ground||f;Skorupi|Poison|Bug|b;Drapion|Poison|Dark|f;Croagunk|Poison|Fighting|b;Toxicroak|Poison|Fighting|f;Carnivine|Grass||k;Finneon|Water||W;Lumineon|Water||g;Mantyke|Water|Flying|W;Snover|Grass|Ice|b;Abomasnow|Grass|Ice|f;Weavile|Dark|Ice|F;Magnezone|Electric|Steel|F;Lickilicky|Normal||f;Rhyperior|Ground|Rock|F;Tangrowth|Grass||f;Electivire|Electric||F;Magmortar|Fire||F;Togekiss|Fairy|Flying|F;Yanmega|Bug|Flying|f;Leafeon|Grass||f;Glaceon|Ice||f;Gliscor|Ground|Flying|f;Mamoswine|Ice|Ground|F;Porygon-Z|Normal||F;Gallade|Psychic|Fighting|F;Probopass|Rock|Steel|g;Dusknoir|Ghost||f;Froslass|Ice|Ghost|f;Rotom|Electric|Ghost|g;Uxie|Psychic||L;Mesprit|Psychic||L;Azelf|Psychic||L;Dialga|Steel|Dragon|X;Palkia|Water|Dragon|X;Heatran|Fire|Steel|L;Regigigas|Normal||L;Giratina|Ghost|Dragon|X;Cresselia|Psychic||L;Phione|Water||k;Manaphy|Water||L;Darkrai|Dark||L;Shaymin|Grass||L;Arceus|Normal||X;Victini|Psychic|Fire|L;Snivy|Grass||B;Servine|Grass||M;Serperior|Grass||F;Tepig|Fire||B;Pignite|Fire|Fighting|M;Emboar|Fire|Fighting|F;Oshawott|Water||B;Dewott|Water||M;Samurott|Water||F;Patrat|Normal||b;Watchog|Normal||g;Lillipup|Normal||b;Herdier|Normal||M;Stoutland|Normal||f;Purrloin|Dark||b;Liepard|Dark||g;Pansage|Grass||b;Simisage|Grass||g;Pansear|Fire||b;Simisear|Fire||g;Panpour|Water||b;Simipour|Water||g;Munna|Psychic||b;Musharna|Psychic||g;Pidove|Normal|Flying|b;Tranquill|Normal|Flying|M;Unfezant|Normal|Flying|f;Blitzle|Electric||b;Zebstrika|Electric||g;Roggenrola|Rock||b;Boldore|Rock||M;Gigalith|Rock||f;Woobat|Psychic|Flying|b;Swoobat|Psychic|Flying|g;Drilbur|Ground||b;Excadrill|Ground|Steel|F;Audino|Normal||k;Timburr|Fighting||b;Gurdurr|Fighting||M;Conkeldurr|Fighting||F;Tympole|Water||b;Palpitoad|Water|Ground|M;Seismitoad|Water|Ground|f;Throh|Fighting||g;Sawk|Fighting||g;Sewaddle|Bug|Grass|b;Swadloon|Bug|Grass|M;Leavanny|Bug|Grass|f;Venipede|Bug|Poison|b;Whirlipede|Bug|Poison|M;Scolipede|Bug|Poison|f;Cottonee|Grass|Fairy|b;Whimsicott|Grass|Fairy|f;Petilil|Grass||b;Lilligant|Grass||f;Basculin|Water||g;Sandile|Ground|Dark|b;Krokorok|Ground|Dark|M;Krookodile|Ground|Dark|F;Darumaka|Fire||b;Darmanitan|Fire||F;Maractus|Grass||k;Dwebble|Bug|Rock|b;Crustle|Bug|Rock|f;Scraggy|Dark|Fighting|b;Scrafty|Dark|Fighting|f;Sigilyph|Psychic|Flying|g;Yamask|Ghost||b;Cofagrigus|Ghost||f;Tirtouga|Water|Rock|b;Carracosta|Water|Rock|f;Archen|Rock|Flying|b;Archeops|Rock|Flying|f;Trubbish|Poison||b;Garbodor|Poison||g;Zorua|Dark||b;Zoroark|Dark||F;Minccino|Normal||b;Cinccino|Normal||f;Gothita|Psychic||b;Gothorita|Psychic||M;Gothitelle|Psychic||f;Solosis|Psychic||b;Duosion|Psychic||M;Reuniclus|Psychic||F;Ducklett|Water|Flying|b;Swanna|Water|Flying|g;Vanillite|Ice||b;Vanillish|Ice||M;Vanilluxe|Ice||f;Deerling|Normal|Grass|b;Sawsbuck|Normal|Grass|g;Emolga|Electric|Flying|k;Karrablast|Bug||b;Escavalier|Bug|Steel|f;Foongus|Grass|Poison|b;Amoonguss|Grass|Poison|f;Frillish|Water|Ghost|b;Jellicent|Water|Ghost|f;Alomomola|Water||g;Joltik|Bug|Electric|b;Galvantula|Bug|Electric|f;Ferroseed|Grass|Steel|b;Ferrothorn|Grass|Steel|F;Klink|Steel||b;Klang|Steel||M;Klinklang|Steel||f;Tynamo|Electric||W;Eelektrik|Electric||M;Eelektross|Electric||f;Elgyem|Psychic||b;Beheeyem|Psychic||g;Litwick|Ghost|Fire|b;Lampent|Ghost|Fire|M;Chandelure|Ghost|Fire|F;Axew|Dragon||B;Fraxure|Dragon||M;Haxorus|Dragon||F;Cubchoo|Ice||b;Beartic|Ice||g;Cryogonal|Ice||g;Shelmet|Bug||b;Accelgor|Bug||f;Stunfisk|Ground|Electric|g;Mienfoo|Fighting||b;Mienshao|Fighting||f;Druddigon|Dragon||g;Golett|Ground|Ghost|b;Golurk|Ground|Ghost|f;Pawniard|Dark|Steel|b;Bisharp|Dark|Steel|F;Bouffalant|Normal||g;Rufflet|Normal|Flying|b;Braviary|Normal|Flying|f;Vullaby|Dark|Flying|b;Mandibuzz|Dark|Flying|f;Heatmor|Fire||g;Durant|Bug|Steel|g;Deino|Dark|Dragon|B;Zweilous|Dark|Dragon|M;Hydreigon|Dark|Dragon|L;Larvesta|Bug|Fire|B;Volcarona|Bug|Fire|F;Cobalion|Steel|Fighting|L;Terrakion|Rock|Fighting|L;Virizion|Grass|Fighting|L;Tornadus|Flying||L;Thundurus|Electric|Flying|L;Reshiram|Dragon|Fire|X;Zekrom|Dragon|Electric|X;Landorus|Ground|Flying|L;Kyurem|Dragon|Ice|X;Keldeo|Water|Fighting|L;Meloetta|Normal|Psychic|L;Genesect|Bug|Steel|L;Chespin|Grass||B;Quilladin|Grass||M;Chesnaught|Grass|Fighting|F;Fennekin|Fire||B;Braixen|Fire||M;Delphox|Fire|Psychic|F;Froakie|Water||B;Frogadier|Water||M;Greninja|Water|Dark|F;Bunnelby|Normal||b;Diggersby|Normal|Ground|g;Fletchling|Normal|Flying|b;Fletchinder|Fire|Flying|M;Talonflame|Fire|Flying|f;Scatterbug|Bug||W;Spewpa|Bug||W;Vivillon|Bug|Flying|k;Litleo|Fire|Normal|b;Pyroar|Fire|Normal|f;Flabébé|Fairy||b;Floette|Fairy||M;Florges|Fairy||f;Skiddo|Grass||b;Gogoat|Grass||g;Pancham|Fighting||b;Pangoro|Fighting|Dark|f;Furfrou|Normal||g;Espurr|Psychic||b;Meowstic|Psychic||g;Honedge|Steel|Ghost|b;Doublade|Steel|Ghost|M;Aegislash|Steel|Ghost|F;Spritzee|Fairy||b;Aromatisse|Fairy||g;Swirlix|Fairy||b;Slurpuff|Fairy||g;Inkay|Dark|Psychic|b;Malamar|Dark|Psychic|f;Binacle|Rock|Water|b;Barbaracle|Rock|Water|f;Skrelp|Poison|Water|b;Dragalge|Poison|Dragon|f;Clauncher|Water||b;Clawitzer|Water||f;Helioptile|Electric|Normal|b;Heliolisk|Electric|Normal|f;Tyrunt|Rock|Dragon|b;Tyrantrum|Rock|Dragon|f;Amaura|Rock|Ice|b;Aurorus|Rock|Ice|f;Sylveon|Fairy||f;Hawlucha|Fighting|Flying|f;Dedenne|Electric|Fairy|k;Carbink|Rock|Fairy|g;Goomy|Dragon||B;Sliggoo|Dragon||M;Goodra|Dragon||L;Klefki|Steel|Fairy|g;Phantump|Ghost|Grass|b;Trevenant|Ghost|Grass|f;Pumpkaboo|Ghost|Grass|b;Gourgeist|Ghost|Grass|f;Bergmite|Ice||b;Avalugg|Ice||f;Noibat|Flying|Dragon|b;Noivern|Flying|Dragon|F;Xerneas|Fairy||X;Yveltal|Dark|Flying|X;Zygarde|Dragon|Ground|X;Diancie|Rock|Fairy|L;Hoopa|Psychic|Ghost|L;Volcanion|Fire|Water|L;Rowlet|Grass|Flying|B;Dartrix|Grass|Flying|M;Decidueye|Grass|Ghost|F;Litten|Fire||B;Torracat|Fire||M;Incineroar|Fire|Dark|F;Popplio|Water||B;Brionne|Water||M;Primarina|Water|Fairy|F;Pikipek|Normal|Flying|b;Trumbeak|Normal|Flying|M;Toucannon|Normal|Flying|f;Yungoos|Normal||b;Gumshoos|Normal||g;Grubbin|Bug||b;Charjabug|Bug|Electric|M;Vikavolt|Bug|Electric|f;Crabrawler|Fighting||b;Crabominable|Fighting|Ice|f;Oricorio|Fire|Flying|g;Cutiefly|Bug|Fairy|b;Ribombee|Bug|Fairy|f;Rockruff|Rock||b;Lycanroc|Rock||f;Wishiwashi|Water||k;Mareanie|Poison|Water|b;Toxapex|Poison|Water|F;Mudbray|Ground||b;Mudsdale|Ground||f;Dewpider|Water|Bug|b;Araquanid|Water|Bug|f;Fomantis|Grass||b;Lurantis|Grass||f;Morelull|Grass|Fairy|b;Shiinotic|Grass|Fairy|g;Salandit|Poison|Fire|b;Salazzle|Poison|Fire|f;Stufful|Normal|Fighting|b;Bewear|Normal|Fighting|f;Bounsweet|Grass||b;Steenee|Grass||M;Tsareena|Grass||f;Comfey|Fairy||g;Oranguru|Normal|Psychic|g;Passimian|Fighting||g;Wimpod|Bug|Water|W;Golisopod|Bug|Water|F;Sandygast|Ghost|Ground|b;Palossand|Ghost|Ground|f;Pyukumuku|Water||k;Type: Null|Normal||L;Silvally|Normal||L;Minior|Rock|Flying|g;Komala|Normal||g;Turtonator|Fire|Dragon|f;Togedemaru|Electric|Steel|g;Mimikyu|Ghost|Fairy|F;Bruxish|Water|Psychic|f;Drampa|Normal|Dragon|f;Dhelmise|Ghost|Grass|f;Jangmo-o|Dragon||B;Hakamo-o|Dragon|Fighting|M;Kommo-o|Dragon|Fighting|L;Tapu Koko|Electric|Fairy|L;Tapu Lele|Psychic|Fairy|L;Tapu Bulu|Grass|Fairy|L;Tapu Fini|Water|Fairy|L;Cosmog|Psychic||W;Cosmoem|Psychic||k;Solgaleo|Psychic|Steel|X;Lunala|Psychic|Ghost|X;Nihilego|Rock|Poison|L;Buzzwole|Bug|Fighting|L;Pheromosa|Bug|Fighting|L;Xurkitree|Electric||L;Celesteela|Steel|Flying|L;Kartana|Grass|Steel|L;Guzzlord|Dark|Dragon|L;Necrozma|Psychic||X;Magearna|Steel|Fairy|L;Marshadow|Fighting|Ghost|L;Poipole|Poison||k;Naganadel|Poison|Dragon|L;Stakataka|Rock|Steel|L;Blacephalon|Fire|Ghost|L;Zeraora|Electric||L;Meltan|Steel||k;Melmetal|Steel||L;Grookey|Grass||B;Thwackey|Grass||M;Rillaboom|Grass||F;Scorbunny|Fire||B;Raboot|Fire||M;Cinderace|Fire||F;Sobble|Water||B;Drizzile|Water||M;Inteleon|Water||F;Skwovet|Normal||b;Greedent|Normal||g;Rookidee|Flying||b;Corvisquire|Flying||M;Corviknight|Flying|Steel|F;Blipbug|Bug||W;Dottler|Bug|Psychic|M;Orbeetle|Bug|Psychic|f;Nickit|Dark||b;Thievul|Dark||g;Gossifleur|Grass||b;Eldegoss|Grass||g;Wooloo|Normal||b;Dubwool|Normal||g;Chewtle|Water||b;Drednaw|Water|Rock|f;Yamper|Electric||b;Boltund|Electric||f;Rolycoly|Rock||b;Carkol|Rock|Fire|M;Coalossal|Rock|Fire|f;Applin|Grass|Dragon|b;Flapple|Grass|Dragon|f;Appletun|Grass|Dragon|f;Silicobra|Ground||b;Sandaconda|Ground||f;Cramorant|Flying|Water|g;Arrokuda|Water||b;Barraskewda|Water||f;Toxel|Electric|Poison|W;Toxtricity|Electric|Poison|f;Sizzlipede|Fire|Bug|b;Centiskorch|Fire|Bug|f;Clobbopus|Fighting||b;Grapploct|Fighting||f;Sinistea|Ghost||b;Polteageist|Ghost||f;Hatenna|Psychic||b;Hattrem|Psychic||M;Hatterene|Psychic|Fairy|F;Impidimp|Dark|Fairy|b;Morgrem|Dark|Fairy|M;Grimmsnarl|Dark|Fairy|F;Obstagoon|Dark|Normal|f;Perrserker|Steel||g;Cursola|Ghost||g;Sirfetch’d|Fighting||f;Mr. Rime|Ice|Psychic|f;Runerigus|Ground|Ghost|f;Milcery|Fairy||b;Alcremie|Fairy||f;Falinks|Fighting||g;Pincurchin|Electric||g;Snom|Ice|Bug|W;Frosmoth|Ice|Bug|f;Stonjourner|Rock||g;Eiscue|Ice||g;Indeedee|Psychic|Normal|g;Morpeko|Electric|Dark|g;Cufant|Steel||b;Copperajah|Steel||f;Dracozolt|Electric|Dragon|f;Arctozolt|Electric|Ice|f;Dracovish|Water|Dragon|F;Arctovish|Water|Ice|f;Duraludon|Steel|Dragon|F;Dreepy|Dragon|Ghost|B;Drakloak|Dragon|Ghost|M;Dragapult|Dragon|Ghost|L;Zacian|Fairy||X;Zamazenta|Fighting||X;Eternatus|Poison|Dragon|X;Kubfu|Fighting||k;Urshifu|Fighting|Dark|L;Zarude|Dark|Grass|L;Regieleki|Electric||L;Regidrago|Dragon||L;Glastrier|Ice||L;Spectrier|Ghost||L;Calyrex|Psychic|Grass|L;MissingNo.|Bird|Normal|F`;
const TIER_BST = { W: 200, b: 300, B: 310, k: 400, M: 405, g: 440, f: 480, F: 530, L: 590, X: 680 };
const TIER_SIZE = { W: .62, b: .66, B: .64, k: .8, M: .8, g: .84, f: .92, F: .97, L: 1, X: 1 };
const DEX = ROSTER_RAW.split(';').map((s, i) => { const p = s.split('|'); return { id: i + 1, name: p[0], types: p[2] ? [p[1], p[2]] : [p[1]], tier: p[3] }; });
const DEX_BY_NAME = Object.fromEntries(DEX.map(d => [d.name, d]));
// MissingNo. — the Gen 1 glitch Pokémon — is Pokédex #000 (it sits at the end of the list so everything indexed by position still lines up)
if (DEX_BY_NAME['MissingNo.']) DEX_BY_NAME['MissingNo.'].id = 0;

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
  Eevee: [55, 55, 50, 45, 65, 55],
  'MissingNo.': [33, 136, 0, 6, 6, 29],
  // Johto (Gen 2): real base stats for the starters, legendaries and stars
  Meganium: [80, 82, 100, 83, 100, 80], Typhlosion: [78, 84, 78, 109, 85, 100], Feraligatr: [85, 105, 100, 79, 83, 78], Crobat: [85, 90, 80, 70, 80, 130],
  Ampharos: [90, 75, 85, 115, 90, 55], Espeon: [65, 65, 60, 130, 95, 110], Umbreon: [95, 65, 110, 60, 130, 65], Steelix: [75, 85, 200, 55, 65, 30],
  Scizor: [70, 130, 100, 55, 80, 65], Heracross: [80, 125, 75, 40, 95, 85], Skarmory: [65, 80, 140, 40, 70, 70], Houndoom: [75, 90, 50, 110, 80, 95],
  Kingdra: [75, 95, 95, 95, 95, 85], Blissey: [255, 10, 10, 75, 135, 55], Raikou: [90, 85, 75, 115, 100, 115], Entei: [115, 115, 85, 90, 75, 100],
  Suicune: [100, 75, 115, 90, 115, 85], Tyranitar: [100, 134, 110, 95, 100, 61], Lugia: [106, 90, 130, 90, 154, 110], 'Ho-Oh': [106, 130, 90, 110, 154, 90],
  Celebi: [100, 100, 100, 100, 100, 100], Porygon2: [85, 80, 90, 105, 95, 60], Miltank: [95, 80, 105, 40, 70, 100], Slowking: [95, 75, 80, 100, 110, 30],
  Wobbuffet: [190, 33, 58, 33, 58, 33], Shuckle: [20, 10, 230, 10, 230, 5], Donphan: [90, 120, 120, 60, 60, 50], Ursaring: [90, 130, 75, 75, 75, 55],
  Politoed: [90, 75, 75, 90, 100, 70],
  // Galar (Gen 8): real base stats for the starters, legendaries and stars
  Rillaboom: [100, 125, 90, 60, 70, 85], Cinderace: [80, 116, 75, 65, 75, 119], Inteleon: [70, 85, 65, 125, 65, 120], Corviknight: [98, 87, 105, 53, 85, 67], Orbeetle: [60, 45, 110, 80, 120, 90],
  Drednaw: [90, 115, 90, 48, 68, 74], Boltund: [69, 90, 60, 90, 60, 121], Coalossal: [110, 80, 120, 80, 90, 30], Flapple: [70, 110, 80, 95, 60, 70], Appletun: [110, 85, 80, 100, 80, 30],
  Sandaconda: [72, 107, 125, 65, 70, 71], Barraskewda: [61, 123, 60, 60, 50, 136], Toxtricity: [75, 98, 70, 114, 70, 75], Centiskorch: [100, 115, 65, 90, 90, 65], Grapploct: [80, 118, 90, 70, 80, 42],
  Polteageist: [60, 65, 65, 134, 114, 70], Hatterene: [57, 90, 95, 136, 103, 29], Grimmsnarl: [95, 120, 65, 95, 75, 60], Obstagoon: [93, 90, 101, 60, 81, 95], Perrserker: [70, 110, 100, 50, 60, 50],
  Cursola: [60, 95, 50, 145, 130, 30], 'Sirfetch’d': [62, 135, 95, 68, 82, 65], 'Mr. Rime': [80, 85, 75, 110, 100, 70], Runerigus: [58, 95, 145, 50, 105, 30], Alcremie: [65, 60, 75, 110, 121, 64],
  Falinks: [65, 100, 100, 70, 60, 75], Frosmoth: [70, 65, 60, 125, 90, 65], Stonjourner: [100, 125, 135, 20, 20, 70], Eiscue: [75, 80, 110, 65, 90, 50], Copperajah: [122, 130, 69, 80, 69, 30],
  Dracozolt: [90, 100, 90, 80, 70, 75], Arctozolt: [90, 100, 90, 90, 80, 55], Dracovish: [90, 90, 100, 70, 80, 75], Arctovish: [90, 90, 100, 80, 90, 55], Duraludon: [70, 95, 115, 120, 50, 85],
  Dragapult: [88, 120, 75, 100, 75, 142], Zacian: [92, 130, 115, 80, 115, 138], Zamazenta: [92, 130, 115, 80, 115, 138], Eternatus: [140, 85, 95, 145, 95, 130], Urshifu: [100, 130, 100, 63, 60, 97],
  Zarude: [105, 120, 105, 70, 95, 105], Regieleki: [80, 100, 50, 100, 50, 200], Regidrago: [200, 100, 50, 100, 50, 80], Glastrier: [100, 145, 130, 65, 110, 30], Spectrier: [100, 65, 60, 145, 80, 130],
  Calyrex: [100, 80, 80, 80, 80, 80], Greedent: [120, 95, 95, 55, 75, 20], Morpeko: [58, 95, 58, 70, 58, 97], Indeedee: [60, 65, 55, 105, 95, 95],
  // Alola (Gen 7): real base stats for the starters, legendaries and stars
  Decidueye: [78, 107, 75, 100, 100, 70], Incineroar: [95, 115, 90, 80, 90, 60], Primarina: [80, 74, 74, 126, 116, 60], Toucannon: [80, 120, 75, 75, 75, 60], Vikavolt: [77, 70, 90, 145, 75, 43],
  Crabominable: [97, 132, 77, 62, 67, 43], Ribombee: [60, 55, 60, 95, 70, 124], Lycanroc: [75, 115, 65, 55, 65, 112], Toxapex: [50, 63, 152, 53, 142, 35], Mudsdale: [100, 125, 100, 55, 85, 35],
  Araquanid: [68, 70, 92, 50, 132, 42], Lurantis: [70, 105, 90, 80, 90, 45], Salazzle: [68, 64, 60, 111, 60, 117], Bewear: [120, 125, 80, 55, 60, 60], Tsareena: [72, 120, 98, 50, 98, 72],
  Golisopod: [75, 125, 140, 60, 90, 40], Palossand: [85, 75, 110, 100, 75, 35], Silvally: [95, 95, 95, 95, 95, 95], 'Type: Null': [95, 95, 95, 95, 95, 59], Turtonator: [60, 78, 135, 91, 85, 36],
  Mimikyu: [55, 90, 80, 50, 105, 96], Drampa: [78, 60, 85, 135, 91, 36], 'Kommo-o': [75, 110, 125, 100, 105, 85], 'Tapu Koko': [70, 115, 85, 95, 75, 130], 'Tapu Lele': [70, 85, 75, 130, 115, 95],
  'Tapu Bulu': [70, 130, 115, 85, 95, 75], 'Tapu Fini': [70, 75, 115, 95, 130, 85], Solgaleo: [137, 137, 107, 113, 89, 97], Lunala: [137, 113, 89, 137, 107, 97], Nihilego: [109, 53, 47, 127, 131, 103],
  Buzzwole: [107, 139, 139, 53, 53, 79], Pheromosa: [71, 137, 37, 137, 37, 151], Xurkitree: [83, 89, 71, 173, 71, 83], Celesteela: [97, 101, 103, 107, 101, 61], Kartana: [59, 181, 131, 59, 31, 109],
  Guzzlord: [223, 101, 53, 97, 53, 43], Necrozma: [97, 107, 101, 127, 89, 79], Magearna: [80, 95, 115, 130, 115, 65], Marshadow: [90, 125, 80, 90, 90, 125], Naganadel: [73, 73, 73, 127, 73, 121],
  Stakataka: [61, 131, 211, 53, 101, 13], Blacephalon: [53, 127, 53, 151, 79, 107], Zeraora: [88, 112, 75, 102, 80, 143], Melmetal: [135, 143, 143, 80, 65, 34], Cosmog: [43, 29, 31, 29, 31, 37], Cosmoem: [43, 29, 131, 29, 131, 37],
  // Kalos (Gen 6): real base stats for the starters, legendaries and stars
  Chesnaught: [88, 107, 122, 74, 75, 64], Delphox: [75, 69, 72, 114, 100, 104], Greninja: [72, 95, 67, 103, 71, 122], Talonflame: [78, 81, 71, 74, 69, 126], Pyroar: [86, 68, 72, 109, 66, 106],
  Florges: [78, 65, 68, 112, 154, 75], Pangoro: [95, 124, 78, 69, 71, 58], Aegislash: [60, 90, 120, 90, 120, 60], Malamar: [86, 92, 88, 68, 75, 73], Barbaracle: [72, 105, 115, 54, 86, 68],
  Dragalge: [65, 75, 90, 97, 123, 44], Clawitzer: [71, 73, 88, 120, 89, 59], Heliolisk: [62, 55, 52, 109, 94, 109], Tyrantrum: [82, 121, 119, 69, 59, 71], Aurorus: [123, 77, 72, 99, 92, 58],
  Sylveon: [95, 65, 65, 110, 130, 60], Hawlucha: [78, 92, 75, 74, 63, 118], Goodra: [90, 100, 70, 110, 150, 80], Trevenant: [85, 110, 76, 65, 82, 56], Avalugg: [95, 117, 184, 44, 46, 28],
  Noivern: [85, 70, 80, 97, 80, 123], Xerneas: [126, 131, 95, 131, 98, 99], Yveltal: [126, 131, 95, 131, 98, 99], Zygarde: [108, 100, 121, 81, 95, 95], Diancie: [50, 100, 150, 100, 150, 50],
  Hoopa: [80, 110, 60, 150, 130, 70], Volcanion: [80, 110, 120, 130, 90, 70], Klefki: [57, 80, 91, 80, 87, 75], Carbink: [50, 50, 150, 50, 150, 50], Gogoat: [123, 100, 62, 97, 81, 68],
  // Unova (Gen 5): real base stats for the starters, legendaries and stars
  Victini: [100, 100, 100, 100, 100, 100], Serperior: [75, 75, 95, 75, 95, 113], Emboar: [110, 123, 65, 100, 65, 65], Samurott: [95, 100, 85, 108, 70, 70], Excadrill: [110, 135, 60, 50, 65, 88],
  Conkeldurr: [105, 140, 95, 55, 65, 45], Krookodile: [95, 117, 80, 65, 70, 92], Darmanitan: [105, 140, 55, 30, 55, 95], Zoroark: [60, 105, 60, 120, 60, 105], Reuniclus: [110, 65, 75, 125, 85, 30],
  Ferrothorn: [74, 94, 131, 54, 116, 20], Chandelure: [60, 55, 90, 145, 90, 80], Haxorus: [76, 147, 90, 60, 70, 97], Bisharp: [65, 125, 100, 60, 70, 70], Hydreigon: [92, 105, 90, 125, 90, 98],
  Volcarona: [85, 60, 65, 135, 105, 100], Cobalion: [91, 90, 129, 90, 72, 108], Terrakion: [91, 129, 90, 72, 90, 108], Virizion: [91, 90, 72, 90, 129, 108], Tornadus: [79, 115, 70, 125, 80, 111],
  Thundurus: [79, 115, 70, 125, 80, 111], Reshiram: [100, 120, 100, 150, 120, 90], Zekrom: [100, 150, 120, 120, 100, 90], Landorus: [89, 125, 90, 115, 80, 101], Kyurem: [125, 130, 90, 130, 90, 95],
  Keldeo: [91, 72, 90, 129, 90, 108], Meloetta: [100, 77, 77, 128, 128, 90], Genesect: [71, 120, 95, 120, 95, 99], Galvantula: [70, 77, 60, 97, 60, 108], Scolipede: [60, 100, 89, 55, 69, 112],
  Gothitelle: [70, 55, 95, 95, 110, 65], Cofagrigus: [58, 50, 145, 95, 105, 30], Golurk: [89, 124, 80, 55, 80, 55], Braviary: [100, 123, 75, 57, 75, 80], Mienshao: [65, 125, 60, 95, 60, 105],
  Eelektross: [85, 115, 80, 105, 80, 50], Gigalith: [85, 135, 130, 60, 80, 25], Archeops: [75, 140, 65, 112, 65, 110], Escavalier: [70, 135, 105, 60, 105, 20], Accelgor: [80, 70, 40, 100, 60, 145],
  Jellicent: [100, 60, 70, 85, 105, 60], Amoonguss: [114, 85, 70, 85, 80, 30], Mandibuzz: [110, 65, 105, 55, 95, 80], Durant: [58, 109, 112, 48, 48, 109],
  // Sinnoh (Gen 4): real base stats for the starters, legendaries and stars
  Torterra: [95, 109, 105, 75, 85, 56], Infernape: [76, 104, 71, 104, 71, 108], Empoleon: [84, 86, 88, 111, 101, 60], Staraptor: [85, 120, 70, 50, 60, 100], Luxray: [80, 120, 79, 95, 79, 70],
  Roserade: [60, 70, 65, 125, 105, 90], Rampardos: [97, 165, 60, 65, 50, 58], Bastiodon: [60, 52, 168, 47, 138, 30], Garchomp: [108, 130, 95, 80, 85, 102], Lucario: [70, 110, 70, 115, 70, 90],
  Hippowdon: [108, 112, 118, 68, 72, 47], Drapion: [70, 90, 110, 60, 75, 95], Toxicroak: [83, 106, 65, 86, 65, 85], Abomasnow: [90, 92, 75, 92, 85, 60], Weavile: [70, 120, 65, 45, 85, 125],
  Magnezone: [70, 70, 115, 130, 90, 60], Rhyperior: [115, 140, 130, 55, 55, 40], Electivire: [75, 123, 67, 95, 85, 95], Magmortar: [75, 95, 67, 125, 95, 83], Togekiss: [85, 50, 95, 120, 115, 80],
  Gliscor: [75, 95, 125, 45, 75, 95], Mamoswine: [110, 130, 80, 70, 60, 80], 'Porygon-Z': [85, 80, 70, 135, 75, 90], Gallade: [68, 125, 65, 65, 115, 80], Dusknoir: [45, 100, 135, 65, 135, 45],
  Froslass: [70, 80, 70, 80, 70, 110], Rotom: [50, 50, 77, 95, 77, 91], Uxie: [75, 75, 130, 75, 130, 95], Mesprit: [80, 105, 105, 105, 105, 80], Azelf: [75, 125, 70, 125, 70, 115],
  Dialga: [100, 120, 120, 150, 100, 90], Palkia: [90, 120, 100, 150, 120, 100], Heatran: [91, 90, 106, 130, 106, 77], Regigigas: [110, 160, 110, 80, 110, 100], Giratina: [150, 100, 120, 100, 120, 90],
  Cresselia: [120, 70, 120, 75, 130, 85], Manaphy: [100, 100, 100, 100, 100, 100], Darkrai: [70, 90, 90, 135, 90, 125], Shaymin: [100, 100, 100, 100, 100, 100], Arceus: [120, 120, 120, 120, 120, 120],
  Honchkrow: [100, 125, 52, 105, 52, 71], Mismagius: [60, 60, 60, 105, 105, 105], Spiritomb: [50, 92, 108, 92, 108, 35], Yanmega: [86, 76, 86, 116, 56, 95], Leafeon: [65, 110, 130, 60, 65, 95], Glaceon: [65, 60, 110, 130, 95, 65],
  // Hoenn (Gen 3): real base stats for the starters, legendaries and stars
  Sceptile: [70, 85, 65, 105, 85, 120], Blaziken: [80, 120, 70, 110, 70, 80], Swampert: [100, 110, 90, 85, 90, 60], Gardevoir: [68, 65, 65, 125, 115, 80], Breloom: [60, 130, 80, 60, 60, 70],
  Slaking: [150, 160, 100, 95, 65, 100], Aggron: [70, 110, 180, 60, 60, 50], Flygon: [80, 100, 80, 80, 80, 100], Altaria: [75, 70, 90, 70, 105, 80], Milotic: [95, 60, 79, 100, 125, 81],
  Absol: [65, 130, 60, 75, 60, 75], Salamence: [95, 135, 80, 110, 80, 100], Metagross: [80, 135, 130, 95, 90, 70], Regirock: [80, 100, 200, 50, 100, 50], Regice: [80, 50, 100, 100, 200, 50],
  Registeel: [80, 75, 150, 75, 150, 50], Latias: [80, 80, 90, 110, 130, 110], Latios: [80, 90, 80, 130, 110, 110], Kyogre: [100, 100, 90, 150, 140, 90], Groudon: [100, 150, 140, 100, 90, 90],
  Rayquaza: [105, 150, 90, 150, 90, 95], Jirachi: [100, 100, 100, 100, 100, 100], Deoxys: [50, 150, 50, 150, 50, 150], Shedinja: [1, 90, 45, 30, 30, 40], Wailord: [170, 90, 45, 90, 45, 60],
  Walrein: [110, 80, 90, 95, 90, 65], Ninjask: [61, 90, 45, 50, 50, 160], Sharpedo: [70, 120, 40, 95, 40, 95], Manectric: [70, 75, 60, 105, 60, 105], Hariyama: [144, 120, 60, 40, 60, 50],
  Medicham: [60, 60, 75, 60, 75, 80], Camerupt: [70, 100, 70, 105, 75, 40], Claydol: [60, 70, 105, 70, 120, 75], Exploud: [104, 91, 63, 91, 73, 68], Swellow: [60, 85, 60, 50, 50, 125],
  Crawdaunt: [63, 120, 85, 90, 55, 55], Glalie: [80, 80, 80, 80, 80, 80], Banette: [64, 115, 65, 83, 63, 65], Dusclops: [40, 70, 130, 60, 130, 25], Cradily: [86, 81, 97, 81, 107, 43],
  Armaldo: [75, 125, 100, 70, 80, 45], Ludicolo: [80, 70, 70, 90, 100, 70], Shiftry: [90, 100, 60, 90, 60, 80], Bellossom: [75, 80, 95, 90, 100, 50], Lanturn: [125, 58, 58, 76, 76, 67], Xatu: [65, 75, 70, 95, 70, 95]      // Red/Blue: HP 33, Attack 136, Defense 0, Special 6 (Sp. Atk and Sp. Def here), Speed 29
};
// Type archetype weights: hp, atk, def, spa, spd, spe
const ARCH = {
  Normal: [1.2, 1, .9, .8, .9, 1], Fire: [.9, 1.05, .85, 1.15, .95, 1.1], Water: [1.05, .95, 1.1, 1, 1, .9],
  Grass: [1, .95, 1, 1.1, 1.05, .9], Electric: [.85, .9, .85, 1.15, .95, 1.3], Psychic: [.85, .7, .8, 1.4, 1.1, 1.15],
  Ice: [1.05, .95, .95, 1.1, 1, .95], Fighting: [1.05, 1.4, .9, .6, .9, 1], Poison: [1, 1, 1, .95, .95, 1],
  Ground: [1, 1.2, 1.15, .8, .85, .9], Rock: [.95, 1.15, 1.4, .75, .8, .8], Bug: [.9, 1.1, 1, .9, .95, 1.05],
  Ghost: [.8, .8, .8, 1.35, .9, 1.25], Dragon: [1.05, 1.25, 1, 1.05, 1, 1], Fairy: [1.2, .8, .9, 1.05, 1.15, .85],
  Steel: [.85, .9, 1.4, 1.1, .9, .8], Flying: [.95, 1.05, .9, .95, .9, 1.25],
  Dark: [.95, 1.2, .9, .95, .9, 1.15]          // Johto: physical and quick (Murkrow, Sneasel, Houndour)
};
const TYPE_COLOR = {
  Normal: '#b9b7a3', Fire: '#ff7d3b', Water: '#4a9dff', Grass: '#4cc860', Electric: '#ffd02e', Psychic: '#ff6fb1',
  Ice: '#7fe0ea', Fighting: '#d4553d', Poison: '#b066d6', Ground: '#d9b062', Rock: '#b5a05a', Bug: '#a3c22c',
  Ghost: '#7a6ad0', Dragon: '#6f5cf0', Fairy: '#f4a6d8', Steel: '#9db4c8', Flying: '#97b3f2', Dark: '#6e5a4e', Bird: '#9a8c7a'
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
M('Sky Attack', 'Flying', 'P', 140, 90, 0, 'contact', { charge: 900 });
// ---- Johto (Gen 2) moves ----
M('Sacred Fire', 'Fire', 'P', 100, 95, 0, 'burst', { st: ['brn', 50], thaw: 1 });          // Ho-Oh
M('Aeroblast', 'Flying', 'S', 100, 95, 0, 'beam', { hc: 1 });                               // Lugia
M('Megahorn', 'Bug', 'P', 120, 85, 0, 'contact', {});                                       // Heracross
M('Steel Wing', 'Steel', 'P', 70, 90, 0, 'contact', { self: { def: 1 }, sch: 10 });
M('Dynamic Punch', 'Fighting', 'P', 100, 50, 0, 'contact', { cf: 100 });
M('Zap Cannon', 'Electric', 'S', 120, 50, 0, 'projectile', { st: ['par', 100] });
M('Ancient Power', 'Rock', 'S', 60, 100, 0, 'projectile', { self: { atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }, sch: 10 });
M('Faint Attack', 'Dark', 'P', 60, null, 0, 'dash', {});                                      // never misses
M('Pursuit', 'Dark', 'P', 40, 100, 1, 'dash', {});
M('Icy Wind', 'Ice', 'S', 55, 95, 0, 'wind', { tg: { spe: -1 }, ch: 100 });
M('Spark', 'Electric', 'P', 65, 100, 0, 'contact', { st: ['par', 30] });
M('Twister', 'Dragon', 'S', 40, 100, 0, 'wind', { fl: 20 });
M('Moonlight', 'Fairy', 'X', 0, null, 0, 'heal', { heal: .5 });
M('Fury Cutter', 'Bug', 'P', 40, 95, 0, 'slash', { hc: 1 });
M('Synthesis', 'Grass', 'X', 0, null, 0, 'heal', { heal: .5 });
M('Morning Sun', 'Normal', 'X', 0, null, 0, 'heal', { heal: .5 });
M('Milk Drink', 'Normal', 'X', 0, null, 0, 'heal', { heal: .5 });
M('Rollout', 'Rock', 'P', 50, 90, 0, 'contact', {});
M('Octazooka', 'Water', 'S', 65, 85, 0, 'projectile', { tg: { spe: -1 }, ch: 50 });
M('Cotton Spore', 'Grass', 'X', 0, 100, 0, 'powder', { tg: { spe: -2 } });
M('Triple Kick', 'Fighting', 'P', 60, 90, 0, 'contact', { hc: 1 });
M('Present', 'Normal', 'S', 70, 90, 0, 'projectile', {});
M('Rapid Spin', 'Normal', 'P', 50, 100, 0, 'contact', { self: { spe: 1 } });
// ---- Hoenn (Gen 3) moves ----
M('Blaze Kick', 'Fire', 'P', 85, 90, 0, 'contact', { hc: 1, st: ['brn', 10] });
M('Leaf Blade', 'Grass', 'P', 90, 100, 0, 'slash', { hc: 1 });
M('Muddy Water', 'Water', 'S', 90, 85, 0, 'wind', { tg: { spe: -1 }, ch: 30 });
M('Psycho Boost', 'Psychic', 'S', 140, 90, 0, 'beam', { self: { spa: -2 }, sch: 100 });
M('Doom Desire', 'Steel', 'S', 140, 100, 0, 'burst', { charge: 900 });
M('Water Spout', 'Water', 'S', 150, 100, 0, 'burst', {});
M('Eruption', 'Fire', 'S', 150, 100, 0, 'burst', {});
M('Mist Ball', 'Psychic', 'S', 70, 100, 0, 'projectile', { tg: { spa: -1 }, ch: 50 });
M('Luster Purge', 'Psychic', 'S', 70, 100, 0, 'beam', { tg: { spd: -1 }, ch: 50 });
M('Sky Uppercut', 'Fighting', 'P', 85, 90, 0, 'contact', {});
M('Meteor Mash', 'Steel', 'P', 90, 90, 0, 'contact', { self: { atk: 1 }, sch: 20 });
M('Shadow Punch', 'Ghost', 'P', 60, null, 0, 'dash', {});
M('Hyper Voice', 'Normal', 'S', 90, 100, 0, 'wind', {});
M('Overheat', 'Fire', 'S', 130, 90, 0, 'burst', { self: { spa: -2 }, sch: 100 });
M('Shock Wave', 'Electric', 'S', 60, null, 0, 'bolt', {});
M('Silver Wind', 'Bug', 'S', 60, 100, 0, 'wind', { self: { atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }, sch: 10 });
M('Bullet Seed', 'Grass', 'P', 60, 100, 0, 'multi', {});
M('Magical Leaf', 'Grass', 'S', 60, null, 0, 'leaves', {});
M('Rock Tomb', 'Rock', 'P', 60, 95, 0, 'projectile', { tg: { spe: -1 }, ch: 100 });
M('Water Pulse', 'Water', 'S', 60, 100, 0, 'projectile', { cf: 20 });
M('Heat Wave', 'Fire', 'S', 95, 90, 0, 'wind', { st: ['brn', 10] });
M('Air Cutter', 'Flying', 'S', 60, 95, 0, 'wind', { hc: 1 });
M('Poison Fang', 'Poison', 'P', 50, 100, 0, 'contact', { st: ['tox', 50] });
M('Needle Arm', 'Grass', 'P', 60, 100, 0, 'contact', { fl: 30 });
M('Arm Thrust', 'Fighting', 'P', 60, 100, 0, 'contact', {});
M('Weather Ball', 'Normal', 'S', 80, 100, 0, 'projectile', {});
// ---- Sinnoh (Gen 4) moves ----
M('Roar of Time', 'Dragon', 'S', 150, 90, 0, 'burst', { charge: 900 });
M('Spacial Rend', 'Dragon', 'S', 100, 95, 0, 'slash', { hc: 1 });
M('Shadow Force', 'Ghost', 'P', 120, 100, 0, 'dash', { charge: 800 });
M('Magma Storm', 'Fire', 'S', 100, 75, 0, 'burst', { st: ['brn', 30] });
M('Judgment', 'Normal', 'S', 100, 100, 0, 'burst', {});
M('Seed Flare', 'Grass', 'S', 120, 85, 0, 'burst', { tg: { spd: -2 }, ch: 40 });
M('Crush Grip', 'Normal', 'P', 120, 100, 0, 'contact', {});
M('Draco Meteor', 'Dragon', 'S', 130, 90, 0, 'burst', { self: { spa: -2 }, sch: 100 });
M('Head Smash', 'Rock', 'P', 150, 80, 0, 'contact', { rc: 1 / 2 });
M('Wood Hammer', 'Grass', 'P', 120, 100, 0, 'contact', { rc: 1 / 3 });
M('Bullet Punch', 'Steel', 'P', 40, 100, 1, 'dash', {});
M('Power Gem', 'Rock', 'S', 80, 100, 0, 'beam', {});
M('Dark Pulse', 'Dark', 'S', 80, 100, 0, 'projectile', { fl: 20 });
M('Shadow Sneak', 'Ghost', 'P', 40, 100, 1, 'dash', {});
M('Vacuum Wave', 'Fighting', 'S', 40, 100, 1, 'projectile', {});
M('Discharge', 'Electric', 'S', 80, 100, 0, 'burst', { st: ['par', 30] });
M('Psycho Cut', 'Psychic', 'P', 70, 100, 0, 'slash', { hc: 1 });
M('Night Slash', 'Dark', 'P', 70, 100, 0, 'slash', { hc: 1 });
M('Thunder Fang', 'Electric', 'P', 65, 95, 0, 'contact', { st: ['par', 10] });
M('Ice Fang', 'Ice', 'P', 65, 95, 0, 'contact', { st: ['frz', 10] });
M('Fire Fang', 'Fire', 'P', 65, 95, 0, 'contact', { st: ['brn', 10] });
M('Iron Head', 'Steel', 'P', 80, 100, 0, 'contact', { fl: 30 });
M('Aqua Tail', 'Water', 'P', 90, 90, 0, 'contact', {});
M('Dragon Rush', 'Dragon', 'P', 100, 75, 0, 'dash', { fl: 20 });
M('Focus Blast', 'Fighting', 'S', 120, 70, 0, 'projectile', { tg: { spd: -1 }, ch: 10 });
M('Nasty Plot', 'Dark', 'X', 0, null, 0, 'aura', { self: { spa: 2 } });
// ---- Unova (Gen 5) moves ----
M('Blue Flare', 'Fire', 'S', 130, 85, 0, 'beam', { st: ['brn', 20] });
M('Bolt Strike', 'Electric', 'P', 130, 85, 0, 'dash', { st: ['par', 20] });
M('Glaciate', 'Ice', 'S', 90, 95, 0, 'wind', { tg: { spe: -1 }, ch: 100 });
M('V-create', 'Fire', 'P', 180, 95, 0, 'contact', { self: { def: -1, spd: -1, spe: -1 }, sch: 100 });
M('Secret Sword', 'Fighting', 'S', 85, 100, 0, 'slash', {});
M('Relic Song', 'Normal', 'S', 75, 100, 0, 'wind', { st: ['slp', 10] });
M('Techno Blast', 'Normal', 'S', 120, 100, 0, 'beam', {});
M('Sacred Sword', 'Fighting', 'P', 90, 100, 0, 'slash', {});
M('Wild Charge', 'Electric', 'P', 90, 100, 0, 'dash', { rc: 1 / 4 });
M('Fiery Dance', 'Fire', 'S', 80, 100, 0, 'burst', { self: { spa: 1 }, sch: 50 });
M('Quiver Dance', 'Bug', 'X', 0, null, 0, 'aura', { self: { spa: 1, spd: 1, spe: 1 } });
M('Night Daze', 'Dark', 'S', 85, 95, 0, 'burst', {});
M('Razor Shell', 'Water', 'P', 75, 95, 0, 'slash', { tg: { def: -1 }, ch: 50 });
M('Hex', 'Ghost', 'S', 65, 100, 0, 'projectile', {});
M('Head Charge', 'Normal', 'P', 120, 100, 0, 'dash', { rc: 1 / 4 });
M('Leaf Tornado', 'Grass', 'S', 85, 90, 0, 'wind', {});
M('Flame Charge', 'Fire', 'P', 50, 100, 0, 'dash', { self: { spe: 1 }, sch: 100 });
M('Icicle Crash', 'Ice', 'P', 85, 90, 0, 'projectile', { fl: 30 });
M('Gear Grind', 'Steel', 'P', 100, 85, 0, 'contact', {});
M('Searing Shot', 'Fire', 'S', 100, 100, 0, 'burst', { st: ['brn', 30] });
M('Psyshock', 'Psychic', 'S', 80, 100, 0, 'projectile', {});
M('Dual Chop', 'Dragon', 'P', 80, 90, 0, 'slash', {});
M('Sludge Wave', 'Poison', 'S', 95, 100, 0, 'wind', { st: ['psn', 10] });
M('Shell Smash', 'Normal', 'X', 0, null, 0, 'aura', { self: { atk: 2, spa: 2, spe: 2, def: -1, spd: -1 } });
M('Storm Throw', 'Fighting', 'P', 60, 100, 0, 'contact', { hc: 1 });
// ---- Kalos (Gen 6) moves ----
M('Geomancy', 'Fairy', 'X', 0, null, 0, 'aura', { self: { spa: 2, spd: 2, spe: 2 } });
M('Oblivion Wing', 'Flying', 'S', 80, 100, 0, 'drain', { dr: .75 });
M('Thousand Arrows', 'Ground', 'P', 90, 100, 0, 'burst', {});
M('Diamond Storm', 'Rock', 'P', 100, 95, 0, 'burst', { self: { def: 2 }, sch: 50 });
M('Hyperspace Hole', 'Psychic', 'S', 80, null, 0, 'burst', {});
M('Steam Eruption', 'Water', 'S', 110, 95, 0, 'burst', { st: ['brn', 30] });
M('Water Shuriken', 'Water', 'S', 60, 100, 1, 'projectile', {});
M('Mystical Fire', 'Fire', 'S', 75, 100, 0, 'projectile', { tg: { spa: -1 }, ch: 100 });
M('Draining Kiss', 'Fairy', 'S', 50, 100, 0, 'drain', { dr: .75 });
M('Flying Press', 'Fighting', 'P', 100, 95, 0, 'contact', {});
M('Phantom Force', 'Ghost', 'P', 90, 100, 0, 'dash', { charge: 600 });
M('Boomburst', 'Normal', 'S', 140, 100, 0, 'wind', {});
M('Petal Blizzard', 'Grass', 'P', 90, 100, 0, 'wind', {});
M('Parabolic Charge', 'Electric', 'S', 65, 100, 0, 'drain', { dr: .5 });
M('Power-Up Punch', 'Fighting', 'P', 40, 100, 0, 'contact', { self: { atk: 1 }, sch: 100 });
M('Disarming Voice', 'Fairy', 'S', 60, null, 0, 'wind', {});
M('Freeze-Dry', 'Ice', 'S', 70, 100, 0, 'beam', { st: ['frz', 10] });
M('Nuzzle', 'Electric', 'P', 40, 100, 0, 'contact', { st: ['par', 100] });
M('Fell Stinger', 'Bug', 'P', 60, 100, 0, 'contact', { self: { atk: 2 }, sch: 30 });
M('Light of Ruin', 'Fairy', 'S', 140, 90, 0, 'beam', { rc: 1 / 2 });
M('Thousand Waves', 'Ground', 'P', 90, 100, 0, 'wind', {});
M('Hyperspace Fury', 'Dark', 'P', 100, null, 0, 'burst', { self: { def: -1 }, sch: 100 });
M('Belch', 'Poison', 'S', 120, 90, 0, 'burst', {});
M('Parting Shot', 'Dark', 'X', 0, null, 0, 'aura', { tg: { atk: -1, spa: -1 } });
M('Venom Drench', 'Poison', 'X', 0, 100, 0, 'powder', { tg: { atk: -1, spa: -1, spe: -1 } });
// ---- Alola (Gen 7) moves ----
M('Spirit Shackle', 'Ghost', 'P', 80, 100, 0, 'projectile', {});
M('Darkest Lariat', 'Dark', 'P', 85, 100, 0, 'contact', {});
M('Sparkling Aria', 'Water', 'S', 90, 100, 0, 'wind', {});
M('Sunsteel Strike', 'Steel', 'P', 100, 100, 0, 'dash', {});
M('Moongeist Beam', 'Ghost', 'S', 100, 100, 0, 'beam', {});
M('Photon Geyser', 'Psychic', 'S', 100, 100, 0, 'burst', {});
M('Spectral Thief', 'Ghost', 'P', 90, 100, 0, 'dash', {});
M('Plasma Fists', 'Electric', 'P', 100, 100, 0, 'contact', {});
M('Fleur Cannon', 'Fairy', 'S', 130, 90, 0, 'beam', { self: { spa: -2 }, sch: 100 });
M('Clanging Scales', 'Dragon', 'S', 110, 100, 0, 'wind', { self: { def: -1 }, sch: 100 });
M('Multi-Attack', 'Normal', 'P', 90, 100, 0, 'contact', {});
M('Double Iron Bash', 'Steel', 'P', 120, 100, 0, 'contact', { fl: 30 });
M('Mind Blown', 'Fire', 'S', 150, 100, 0, 'burst', { rc: 1 / 2 });
M('Beak Blast', 'Flying', 'P', 100, 100, 0, 'contact', { st: ['brn', 30] });
M('Liquidation', 'Water', 'P', 85, 100, 0, 'contact', { tg: { def: -1 }, ch: 20 });
M('Accelerock', 'Rock', 'P', 40, 100, 1, 'dash', {});
M('Trop Kick', 'Grass', 'P', 70, 100, 0, 'contact', { tg: { atk: -1 }, ch: 100 });
M('Anchor Shot', 'Steel', 'P', 80, 100, 0, 'projectile', {});
M('Fire Lash', 'Fire', 'P', 80, 100, 0, 'slash', { tg: { def: -1 }, ch: 100 });
M('Pollen Puff', 'Bug', 'S', 90, 100, 0, 'projectile', {});
M('Stomping Tantrum', 'Ground', 'P', 75, 100, 0, 'contact', {});
M('Zing Zap', 'Electric', 'P', 80, 100, 0, 'dash', { fl: 30 });
M('Prismatic Laser', 'Psychic', 'S', 160, 100, 0, 'beam', { charge: 900 });
M('Revelation Dance', 'Normal', 'S', 90, 100, 0, 'burst', {});
M('Psychic Fangs', 'Psychic', 'P', 85, 100, 0, 'contact', {});
M('Ice Hammer', 'Ice', 'P', 100, 90, 0, 'contact', { self: { spe: -1 }, sch: 100 });
// ---- Galar (Gen 8) moves ----
M('Behemoth Blade', 'Steel', 'P', 100, 100, 0, 'slash', {});
M('Behemoth Bash', 'Steel', 'P', 100, 100, 0, 'dash', {});
M('Dynamax Cannon', 'Dragon', 'S', 100, 100, 0, 'beam', {});
M('Drum Beating', 'Grass', 'P', 80, 100, 0, 'burst', { tg: { spe: -1 }, ch: 100 });
M('Pyro Ball', 'Fire', 'P', 120, 90, 0, 'projectile', { st: ['brn', 10] });
M('Snipe Shot', 'Water', 'S', 80, 100, 0, 'projectile', { hc: 1 });
M('Bolt Beak', 'Electric', 'P', 85, 100, 0, 'dash', {});
M('Fishious Rend', 'Water', 'P', 85, 100, 0, 'contact', {});
M('Dragon Darts', 'Dragon', 'P', 90, 100, 0, 'projectile', {});
M('Wicked Blow', 'Dark', 'P', 75, 100, 0, 'contact', { hc: 1 });
M('Astral Barrage', 'Ghost', 'S', 120, 100, 0, 'burst', {});
M('Glacial Lance', 'Ice', 'P', 120, 100, 0, 'projectile', {});
M('Thunder Cage', 'Electric', 'S', 80, 90, 0, 'burst', { st: ['par', 30] });
M('Dragon Energy', 'Dragon', 'S', 150, 100, 0, 'beam', {});
M('Spirit Break', 'Fairy', 'P', 75, 100, 0, 'contact', { tg: { spa: -1 }, ch: 100 });
M('Overdrive', 'Electric', 'S', 80, 100, 0, 'wind', {});
// Johto moves are marked Gen 2; Sacred Fire and Aeroblast are signatures (Ho-Oh, Lugia only). Automatic movesets never give
// Gen 2 moves to Gen 1 Pokémon (Kanto movesets stay exactly as they were) and never hand out a signature move.
for (const n of ['Sacred Fire', 'Aeroblast', 'Megahorn', 'Steel Wing', 'Dynamic Punch', 'Zap Cannon', 'Ancient Power', 'Faint Attack', 'Pursuit', 'Icy Wind', 'Spark', 'Twister', 'Moonlight', 'Fury Cutter',
  'Synthesis', 'Morning Sun', 'Milk Drink', 'Rollout', 'Octazooka', 'Cotton Spore', 'Triple Kick', 'Present', 'Rapid Spin']) MOVES[n].gen = 2;
MOVES['Sacred Fire'].sig = MOVES['Aeroblast'].sig = MOVES['Present'].sig = true;
for (const n of ['Blaze Kick', 'Leaf Blade', 'Muddy Water', 'Psycho Boost', 'Doom Desire', 'Water Spout', 'Eruption', 'Mist Ball', 'Luster Purge', 'Sky Uppercut', 'Meteor Mash', 'Shadow Punch', 'Hyper Voice', 'Overheat', 'Shock Wave', 'Silver Wind']) MOVES[n].gen = 3;
for (const n of ['Psycho Boost', 'Doom Desire', 'Mist Ball', 'Luster Purge', 'Water Spout']) MOVES[n].sig = true;
for (const n of ['Bullet Seed', 'Magical Leaf', 'Rock Tomb', 'Water Pulse', 'Heat Wave', 'Air Cutter', 'Poison Fang', 'Needle Arm', 'Arm Thrust', 'Weather Ball']) MOVES[n].gen = 3;
MOVES['Weather Ball'].sig = true;   // Castform
for (const n of ['Roar of Time', 'Spacial Rend', 'Shadow Force', 'Magma Storm', 'Judgment', 'Seed Flare', 'Crush Grip', 'Draco Meteor', 'Head Smash', 'Wood Hammer', 'Bullet Punch', 'Power Gem', 'Dark Pulse', 'Shadow Sneak', 'Vacuum Wave', 'Discharge']) MOVES[n].gen = 4;
for (const n of ['Roar of Time', 'Spacial Rend', 'Shadow Force', 'Magma Storm', 'Judgment', 'Seed Flare', 'Crush Grip']) MOVES[n].sig = true;
for (const n of ['Psycho Cut', 'Night Slash', 'Thunder Fang', 'Ice Fang', 'Fire Fang', 'Iron Head', 'Aqua Tail', 'Dragon Rush', 'Focus Blast', 'Nasty Plot']) MOVES[n].gen = 4;
for (const n of ['Blue Flare', 'Bolt Strike', 'Glaciate', 'V-create', 'Secret Sword', 'Relic Song', 'Techno Blast', 'Sacred Sword', 'Wild Charge', 'Fiery Dance', 'Quiver Dance', 'Night Daze', 'Razor Shell', 'Hex', 'Head Charge']) MOVES[n].gen = 5;
for (const n of ['Blue Flare', 'Bolt Strike', 'Glaciate', 'V-create', 'Secret Sword', 'Relic Song', 'Techno Blast', 'Night Daze', 'Head Charge']) if (MOVES[n]) MOVES[n].sig = true;   // Reshiram, Zekrom, Kyurem, Victini, Keldeo, Meloetta, Genesect, Zoroark, Bouffalant
for (const n of ['Leaf Tornado', 'Flame Charge', 'Icicle Crash', 'Gear Grind', 'Searing Shot', 'Psyshock', 'Dual Chop', 'Sludge Wave', 'Shell Smash', 'Storm Throw']) MOVES[n].gen = 5;
MOVES['Gear Grind'].sig = MOVES['Searing Shot'].sig = true;   // Klinklang, Victini
for (const n of ['Geomancy', 'Oblivion Wing', 'Thousand Arrows', 'Diamond Storm', 'Hyperspace Hole', 'Steam Eruption', 'Water Shuriken', 'Mystical Fire', 'Draining Kiss', 'Flying Press', 'Phantom Force', 'Boomburst', 'Petal Blizzard', 'Parabolic Charge', 'Power-Up Punch', 'Disarming Voice']) MOVES[n].gen = 6;
for (const n of ['Geomancy', 'Oblivion Wing', 'Thousand Arrows', 'Diamond Storm', 'Hyperspace Hole', 'Steam Eruption', 'Flying Press']) MOVES[n].sig = true;   // Xerneas, Yveltal, Zygarde, Diancie, Hoopa, Volcanion, Hawlucha
for (const n of ['Freeze-Dry', 'Nuzzle', 'Fell Stinger', 'Light of Ruin', 'Thousand Waves', 'Hyperspace Fury', 'Belch', 'Parting Shot', 'Venom Drench']) MOVES[n].gen = 6;
for (const n of ['Light of Ruin', 'Thousand Waves', 'Hyperspace Fury']) MOVES[n].sig = true;   // Florges, Zygarde, Hoopa
for (const n of ['Spirit Shackle', 'Darkest Lariat', 'Sparkling Aria', 'Sunsteel Strike', 'Moongeist Beam', 'Photon Geyser', 'Spectral Thief', 'Plasma Fists', 'Fleur Cannon', 'Clanging Scales', 'Multi-Attack', 'Double Iron Bash', 'Mind Blown', 'Beak Blast', 'Liquidation', 'Accelerock']) MOVES[n].gen = 7;
for (const n of ['Spirit Shackle', 'Darkest Lariat', 'Sparkling Aria', 'Sunsteel Strike', 'Moongeist Beam', 'Photon Geyser', 'Spectral Thief', 'Plasma Fists', 'Fleur Cannon', 'Clanging Scales', 'Multi-Attack', 'Double Iron Bash', 'Mind Blown', 'Beak Blast', 'Accelerock']) MOVES[n].sig = true;   // Alola's signature moves
for (const n of ['Trop Kick', 'Anchor Shot', 'Fire Lash', 'Pollen Puff', 'Stomping Tantrum', 'Zing Zap', 'Prismatic Laser', 'Revelation Dance', 'Psychic Fangs', 'Ice Hammer']) MOVES[n].gen = 7;
for (const n of ['Trop Kick', 'Anchor Shot', 'Zing Zap', 'Prismatic Laser', 'Revelation Dance']) MOVES[n].sig = true;   // Tsareena, Dhelmise, Togedemaru, Necrozma, Oricorio
for (const n of ['Behemoth Blade', 'Behemoth Bash', 'Dynamax Cannon', 'Drum Beating', 'Pyro Ball', 'Snipe Shot', 'Bolt Beak', 'Fishious Rend', 'Dragon Darts', 'Wicked Blow', 'Astral Barrage', 'Glacial Lance', 'Thunder Cage', 'Dragon Energy', 'Spirit Break', 'Overdrive']) MOVES[n].gen = 8;
for (const n of ['Behemoth Blade', 'Behemoth Bash', 'Dynamax Cannon', 'Drum Beating', 'Pyro Ball', 'Snipe Shot', 'Bolt Beak', 'Fishious Rend', 'Dragon Darts', 'Wicked Blow', 'Astral Barrage', 'Glacial Lance', 'Thunder Cage', 'Dragon Energy', 'Overdrive']) MOVES[n].sig = true;   // Galar's signature moves   // Dialga, Palkia, Giratina, Heatran, Arceus, Shaymin, Regigigas   // Deoxys, Jirachi, Latias, Latios, Kyogre   // signatures: Ho-Oh, Lugia, Delibird
let MOVESET_GEN = 1;   // Gen 1: 140 power, 90% accuracy, a charging turn first
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
  // Galar signatures and new Gen 8 moves
  Zacian: ['Behemoth Blade', 'Play Rough', 'Close Combat', 'Swords Dance'], Zamazenta: ['Behemoth Bash', 'Close Combat', 'Crunch', 'Bulk Up'], Eternatus: ['Dynamax Cannon', 'Sludge Bomb', 'Flamethrower', 'Calm Mind'],
  Rillaboom: ['Drum Beating', 'Wood Hammer', 'Earthquake', 'Swords Dance'], Cinderace: ['Pyro Ball', 'Zen Headbutt', 'Gunk Shot', 'Bulk Up'], Inteleon: ['Snipe Shot', 'Ice Beam', 'Dark Pulse', 'Nasty Plot'],
  Dracozolt: ['Bolt Beak', 'Dragon Claw', 'Earthquake', 'Dragon Dance'], Dracovish: ['Fishious Rend', 'Dragon Claw', 'Crunch', 'Dragon Dance'], Arctozolt: ['Bolt Beak', 'Icicle Crash', 'Earthquake', 'Bulk Up'],
  Arctovish: ['Fishious Rend', 'Icicle Crash', 'Crunch', 'Bulk Up'], Dragapult: ['Dragon Darts', 'Phantom Force', 'Fire Fang', 'Dragon Dance'], Urshifu: ['Wicked Blow', 'Close Combat', 'Iron Head', 'Bulk Up'],
  Spectrier: ['Astral Barrage', 'Dark Pulse', 'Psychic', 'Nasty Plot'], Glastrier: ['Glacial Lance', 'Close Combat', 'Earthquake', 'Swords Dance'], Regieleki: ['Thunder Cage', 'Thunderbolt', 'Hyper Voice', 'Agility'],
  Regidrago: ['Dragon Energy', 'Draco Meteor', 'Earth Power', 'Dragon Dance'], Grimmsnarl: ['Spirit Break', 'Crunch', 'Play Rough', 'Bulk Up'], Toxtricity: ['Overdrive', 'Sludge Wave', 'Boomburst', 'Nasty Plot'],
  Tsareena: ['Trop Kick', 'Play Rough', 'Zen Headbutt', 'Swords Dance'], Dhelmise: ['Anchor Shot', 'Phantom Force', 'Earthquake', 'Swords Dance'], Salazzle: ['Fire Lash', 'Sludge Wave', 'Flamethrower', 'Nasty Plot'],
  Ribombee: ['Pollen Puff', 'Moonblast', 'Psychic', 'Quiver Dance'], Mudsdale: ['Stomping Tantrum', 'Close Combat', 'Rock Slide', 'Bulk Up'], Togedemaru: ['Zing Zap', 'Iron Head', 'Nuzzle', 'Thunder Wave'],
  Necrozma: ['Photon Geyser', 'Prismatic Laser', 'Earth Power', 'Calm Mind'], Oricorio: ['Revelation Dance', 'Hurricane', 'Quiver Dance', 'Calm Mind'], Bruxish: ['Psychic Fangs', 'Liquidation', 'Ice Fang', 'Aqua Jet'],
  Crabominable: ['Ice Hammer', 'Close Combat', 'Earthquake', 'Bulk Up'],
  // Alola signatures and new Gen 7 moves
  Decidueye: ['Spirit Shackle', 'Leaf Blade', 'Brave Bird', 'Swords Dance'], Incineroar: ['Darkest Lariat', 'Flare Blitz', 'Close Combat', 'Bulk Up'], Primarina: ['Sparkling Aria', 'Moonblast', 'Ice Beam', 'Calm Mind'],
  Solgaleo: ['Sunsteel Strike', 'Psychic', 'Earthquake', 'Flare Blitz'], Lunala: ['Moongeist Beam', 'Psyshock', 'Moonblast', 'Calm Mind'], 
  Marshadow: ['Spectral Thief', 'Close Combat', 'Shadow Sneak', 'Bulk Up'], Zeraora: ['Plasma Fists', 'Close Combat', 'Blaze Kick', 'Bulk Up'], Magearna: ['Fleur Cannon', 'Flash Cannon', 'Aura Sphere', 'Calm Mind'],
  'Kommo-o': ['Clanging Scales', 'Close Combat', 'Dragon Claw', 'Bulk Up'], Silvally: ['Multi-Attack', 'Flamethrower', 'Iron Head', 'Swords Dance'], Melmetal: ['Double Iron Bash', 'Earthquake', 'Ice Punch', 'Thunder Punch'],
  Blacephalon: ['Mind Blown', 'Shadow Ball', 'Psyshock', 'Calm Mind'], Toucannon: ['Beak Blast', 'Brave Bird', 'Rock Slide', 'Swords Dance'], Golisopod: ['Liquidation', 'Leech Life', 'Aqua Jet', 'Swords Dance'],
  Lycanroc: ['Accelerock', 'Stone Edge', 'Close Combat', 'Swords Dance'], Araquanid: ['Liquidation', 'Leech Life', 'Poison Jab', 'Swords Dance'],
  Aurorus: ['Freeze-Dry', 'Power Gem', 'Earth Power', 'Thunderbolt'], Dedenne: ['Nuzzle', 'Parabolic Charge', 'Dazzling Gleam', 'Thunderbolt'], Vivillon: ['Hurricane', 'Bug Buzz', 'Fell Stinger', 'Quiver Dance'],
  Florges: ['Light of Ruin', 'Moonblast', 'Psychic', 'Calm Mind'], Zygarde: ['Thousand Arrows', 'Thousand Waves', 'Dragon Claw', 'Dragon Dance'], Hoopa: ['Hyperspace Hole', 'Hyperspace Fury', 'Focus Blast', 'Nasty Plot'],
  Dragalge: ['Belch', 'Draco Meteor', 'Hydro Pump', 'Venom Drench'], Pangoro: ['Power-Up Punch', 'Night Slash', 'Close Combat', 'Parting Shot'], Floette: ['Fairy Wind', 'Moonblast', 'Petal Blizzard', 'Calm Mind'],
  // Kalos signatures and new Gen 6 moves
  Xerneas: ['Moonblast', 'Geomancy', 'Focus Blast', 'Thunderbolt'], Yveltal: ['Oblivion Wing', 'Dark Pulse', 'Focus Blast', 'Nasty Plot'], 
  Diancie: ['Diamond Storm', 'Moonblast', 'Earth Power', 'Calm Mind'],  Volcanion: ['Steam Eruption', 'Flamethrower', 'Earth Power', 'Sludge Bomb'],
  Greninja: ['Water Shuriken', 'Hydro Pump', 'Dark Pulse', 'Ice Beam'], Delphox: ['Mystical Fire', 'Psychic', 'Shadow Ball', 'Calm Mind'], Hawlucha: ['Flying Press', 'Close Combat', 'Brave Bird', 'Swords Dance'],
  Trevenant: ['Phantom Force', 'Wood Hammer', 'Earthquake', 'Will-O-Wisp'], Noivern: ['Boomburst', 'Dragon Pulse', 'Hurricane', 'Flamethrower'], 
  Heliolisk: ['Parabolic Charge', 'Thunderbolt', 'Hyper Voice', 'Focus Blast'],  Sylveon: ['Moonblast', 'Disarming Voice', 'Draining Kiss', 'Calm Mind'],
  Gogoat: ['Petal Blizzard', 'Earthquake', 'Rock Slide', 'Bulk Up'], Slurpuff: ['Play Rough', 'Zen Headbutt', 'Body Slam', 'Swords Dance'], Tyrantrum: ['Head Smash', 'Dragon Claw', 'Earthquake', 'Dragon Dance'],
  Serperior: ['Leaf Tornado', 'Leaf Blade', 'Dragon Pulse', 'Swords Dance'], Emboar: ['Flare Blitz', 'Close Combat', 'Flame Charge', 'Bulk Up'], Beartic: ['Icicle Crash', 'Ice Shard', 'Close Combat', 'Swords Dance'],
  Klinklang: ['Gear Grind', 'Wild Charge', 'Iron Head', 'Bulk Up'], Victini: ['V-create', 'Searing Shot', 'Zen Headbutt', 'Close Combat'], Reuniclus: ['Psyshock', 'Focus Blast', 'Shadow Ball', 'Calm Mind'],
  Haxorus: ['Dual Chop', 'Earthquake', 'Night Slash', 'Dragon Dance'], Garbodor: ['Sludge Wave', 'Gunk Shot', 'Seed Bomb', 'Rock Slide'], Crustle: ['Shell Smash', 'X-Scissor', 'Stone Edge', 'Earthquake'],
  Throh: ['Storm Throw', 'Earthquake', 'Ice Punch', 'Bulk Up'], Sawk: ['Storm Throw', 'Close Combat', 'Stone Edge', 'Bulk Up'],
  // Unova signatures and new Gen 5 moves
  Reshiram: ['Blue Flare', 'Dragon Pulse', 'Earth Power', 'Draco Meteor'], Zekrom: ['Bolt Strike', 'Dragon Claw', 'Earthquake', 'Dragon Dance'], Kyurem: ['Glaciate', 'Draco Meteor', 'Earth Power', 'Ice Beam'],
  Keldeo: ['Secret Sword', 'Hydro Pump', 'Ice Beam', 'Calm Mind'], Meloetta: ['Relic Song', 'Psychic', 'Shadow Ball', 'Calm Mind'],
  Genesect: ['Techno Blast', 'X-Scissor', 'Flamethrower', 'Thunderbolt'], Cobalion: ['Sacred Sword', 'Iron Head', 'Stone Edge', 'Swords Dance'], Terrakion: ['Sacred Sword', 'Stone Edge', 'Earthquake', 'Swords Dance'],
  Virizion: ['Sacred Sword', 'Leaf Blade', 'Stone Edge', 'Swords Dance'], Tornadus: ['Hurricane', 'Focus Blast', 'Dark Pulse', 'Nasty Plot'], Thundurus: ['Wild Charge', 'Thunderbolt', 'Focus Blast', 'Nasty Plot'],
  Volcarona: ['Fiery Dance', 'Bug Buzz', 'Psychic', 'Quiver Dance'], Zoroark: ['Night Daze', 'Flamethrower', 'Focus Blast', 'Nasty Plot'], Samurott: ['Razor Shell', 'Aqua Jet', 'Megahorn', 'Swords Dance'],
  Chandelure: ['Hex', 'Flamethrower', 'Energy Ball', 'Calm Mind'], Bouffalant: ['Head Charge', 'Earthquake', 'Stone Edge', 'Swords Dance'], Zebstrika: ['Wild Charge', 'Overheat', 'Thunderbolt', 'Agility'],
  Landorus: ['Earthquake', 'Stone Edge', 'Hurricane', 'Swords Dance'], Hydreigon: ['Dark Pulse', 'Draco Meteor', 'Flamethrower', 'Nasty Plot'], 
  Gallade: ['Psycho Cut', 'Close Combat', 'Night Slash', 'Swords Dance'], Weavile: ['Night Slash', 'Ice Shard', 'Ice Fang', 'Swords Dance'], Honchkrow: ['Night Slash', 'Brave Bird', 'Psycho Cut', 'Nasty Plot'],
  Floatzel: ['Aqua Tail', 'Aqua Jet', 'Ice Fang', 'Crunch'], Mamoswine: ['Earthquake', 'Ice Fang', 'Ice Shard', 'Stone Edge'], Garchomp: ['Dragon Rush', 'Earthquake', 'Fire Fang', 'Swords Dance'],
  Drapion: ['Night Slash', 'Poison Jab', 'Ice Fang', 'Swords Dance'], Infernape: ['Flare Blitz', 'Close Combat', 'Thunder Punch', 'Nasty Plot'], Lucario: ['Aura Sphere', 'Flash Cannon', 'Focus Blast', 'Nasty Plot'],
  Bastiodon: ['Iron Head', 'Stone Edge', 'Earthquake', 'Iron Defense'], Shinx: ['Thunder Fang', 'Bite', 'Quick Attack', 'Thunder Wave'], Glaceon: ['Ice Beam', 'Shadow Ball', 'Focus Blast', 'Calm Mind'],
  // Sinnoh signatures and new Gen 4 moves
  Dialga: ['Roar of Time', 'Flash Cannon', 'Draco Meteor', 'Earth Power'], Palkia: ['Spacial Rend', 'Hydro Pump', 'Thunderbolt', 'Draco Meteor'], Giratina: ['Shadow Force', 'Dragon Claw', 'Earthquake', 'Will-O-Wisp'],
  Heatran: ['Magma Storm', 'Earth Power', 'Flash Cannon', 'Dragon Pulse'], Arceus: ['Judgment', 'Extreme Speed', 'Earthquake', 'Swords Dance'], Shaymin: ['Seed Flare', 'Earth Power', 'Psychic', 'Synthesis'],
  Regigigas: ['Crush Grip', 'Earthquake', 'Stone Edge', 'Bulk Up'], Darkrai: ['Dark Pulse', 'Ice Beam', 'Thunderbolt', 'Calm Mind'],   Rampardos: ['Head Smash', 'Earthquake', 'Zen Headbutt', 'Swords Dance'], Torterra: ['Wood Hammer', 'Earthquake', 'Stone Edge', 'Synthesis'], 
  Empoleon: ['Hydro Pump', 'Flash Cannon', 'Ice Beam', 'Drill Peck'],  Roserade: ['Leaf Storm', 'Sludge Bomb', 'Shadow Ball', 'Sleep Powder'],
  Toxicroak: ['Gunk Shot', 'Close Combat', 'Crunch', 'Bulk Up'], Probopass: ['Power Gem', 'Earth Power', 'Flash Cannon', 'Thunder Wave'], Dusknoir: ['Shadow Sneak', 'Shadow Punch', 'Ice Punch', 'Will-O-Wisp'],
  Luxray: ['Discharge', 'Crunch', 'Iron Tail', 'Thunder Wave'], Electivire: ['Discharge', 'Cross Chop', 'Ice Punch', 'Thunder Punch'], Bronzong: ['Bullet Punch', 'Psychic', 'Earthquake', 'Iron Defense'],
  Roselia: ['Magical Leaf', 'Sludge Bomb', 'Giga Drain', 'Sleep Powder'], Ludicolo: ['Water Pulse', 'Giga Drain', 'Ice Beam', 'Hydro Pump'],
  Pelipper: ['Water Pulse', 'Air Cutter', 'Hydro Pump', 'Ice Beam'], Altaria: ['Dragon Pulse', 'Heat Wave', 'Air Cutter', 'Dragon Dance'],
  Castform: ['Weather Ball', 'Ice Beam', 'Thunderbolt', 'Flamethrower'], Cacturne: ['Needle Arm', 'Faint Attack', 'Seed Bomb', 'Swords Dance'], Seviper: ['Poison Fang', 'Crunch', 'Earthquake', 'Swords Dance'],
  Hariyama: ['Arm Thrust', 'Sky Uppercut', 'Close Combat', 'Bulk Up'], Shiftry: ['Leaf Blade', 'Faint Attack', 'Air Cutter', 'Swords Dance'],
  // Hoenn signatures and new Gen 3 moves
  Rayquaza: ['Dragon Claw', 'Extreme Speed', 'Earthquake', 'Dragon Dance'], Kyogre: ['Water Spout', 'Ice Beam', 'Thunder', 'Calm Mind'], Groudon: ['Earthquake', 'Eruption', 'Stone Edge', 'Bulk Up'],
  Deoxys: ['Psycho Boost', 'Extreme Speed', 'Shadow Ball', 'Thunderbolt'], Jirachi: ['Doom Desire', 'Psychic', 'Thunderbolt', 'Calm Mind'], Latias: ['Mist Ball', 'Dragon Pulse', 'Recover', 'Thunderbolt'],
  Latios: ['Luster Purge', 'Dragon Pulse', 'Thunderbolt', 'Recover'], Blaziken: ['Blaze Kick', 'Sky Uppercut', 'Brave Bird', 'Swords Dance'], Sceptile: ['Leaf Blade', 'Dragon Claw', 'Earthquake', 'Swords Dance'],
  Swampert: ['Muddy Water', 'Earthquake', 'Ice Beam', 'Rock Slide'], Metagross: ['Meteor Mash', 'Zen Headbutt', 'Earthquake', 'Agility'], Salamence: ['Dragon Claw', 'Flamethrower', 'Aerial Ace', 'Dragon Dance'],
  Gardevoir: ['Psychic', 'Moonblast', 'Shadow Ball', 'Calm Mind'], Breloom: ['Sky Uppercut', 'Bullet Seed', 'Rock Tomb', 'Swords Dance'], Exploud: ['Hyper Voice', 'Flamethrower', 'Ice Beam', 'Crunch'],
  Manectric: ['Shock Wave', 'Thunderbolt', 'Flamethrower', 'Agility'], Banette: ['Shadow Punch', 'Shadow Claw', 'Will-O-Wisp', 'Swords Dance'], Dusclops: ['Shadow Punch', 'Will-O-Wisp', 'Ice Beam', 'Night Shade'],
  Ninjask: ['Silver Wind', 'X-Scissor', 'Aerial Ace', 'Swords Dance'], Beautifly: ['Silver Wind', 'Giga Drain', 'Psybeam', 'Agility'], Camerupt: ['Eruption', 'Earthquake', 'Overheat', 'Rock Slide'],
  Torkoal: ['Heat Wave', 'Overheat', 'Earthquake', 'Iron Defense'], Hariyama: ['Sky Uppercut', 'Close Combat', 'Body Slam', 'Bulk Up'], Medicham: ['Sky Uppercut', 'Zen Headbutt', 'Ice Punch', 'Bulk Up'],
  Absol: ['Crunch', 'Slash', 'Faint Attack', 'Swords Dance'], Milotic: ['Hydro Pump', 'Ice Beam', 'Recover', 'Dragon Pulse'], Shedinja: ['Shadow Claw', 'X-Scissor', 'Silver Wind', 'Swords Dance'],
  Aggron: ['Iron Tail', 'Earthquake', 'Rock Slide', 'Iron Defense'],
  Meganium: ['Giga Drain', 'Synthesis', 'Body Slam', 'Earthquake'], Bellossom: ['Giga Drain', 'Synthesis', 'Moonblast', 'Sludge Bomb'], Miltank: ['Rollout', 'Milk Drink', 'Body Slam', 'Iron Tail'],
  Blissey: ['Milk Drink', 'Ice Beam', 'Thunderbolt', 'Flamethrower'], Donphan: ['Rollout', 'Earthquake', 'Rapid Spin', 'Iron Tail'], Octillery: ['Octazooka', 'Flamethrower', 'Ice Beam', 'Psybeam'],
  Jumpluff: ['Cotton Spore', 'Giga Drain', 'Aerial Ace', 'Sleep Powder'], Forretress: ['Rapid Spin', 'Megahorn', 'Flash Cannon', 'Iron Defense'],
  // Johto signatures and new Gen 2 moves
  'Ho-Oh': ['Sacred Fire', 'Brave Bird', 'Earthquake', 'Recover'], Lugia: ['Aeroblast', 'Psychic', 'Ice Beam', 'Recover'], Celebi: ['Giga Drain', 'Psychic', 'Ancient Power', 'Recover'],
  Heracross: ['Megahorn', 'Close Combat', 'Rock Slide', 'Swords Dance'], Scizor: ['Steel Wing', 'X-Scissor', 'Quick Attack', 'Swords Dance'], Skarmory: ['Steel Wing', 'Drill Peck', 'Aerial Ace', 'Iron Defense'],
  Tyranitar: ['Crunch', 'Stone Edge', 'Earthquake', 'Dragon Dance'], Umbreon: ['Faint Attack', 'Moonlight', 'Shadow Ball', 'Iron Tail'], Espeon: ['Psychic', 'Dazzling Gleam', 'Shadow Ball', 'Morning Sun'],
  Ampharos: ['Zap Cannon', 'Thunderbolt', 'Dragon Pulse', 'Signal Beam'], Porygon2: ['Zap Cannon', 'Ice Beam', 'Psybeam', 'Recover'], Sneasel: ['Faint Attack', 'Ice Shard', 'Slash', 'Agility'],
  Murkrow: ['Faint Attack', 'Drill Peck', 'Pursuit', 'Agility'], Houndoom: ['Crunch', 'Flamethrower', 'Faint Attack', 'Sludge Bomb'], Houndour: ['Pursuit', 'Ember', 'Bite', 'Faint Attack'],
  Kingdra: ['Twister', 'Hydro Pump', 'Dragon Pulse', 'Ice Beam'], Piloswine: ['Icy Wind', 'Earthquake', 'Blizzard', 'Rock Slide'], Delibird: ['Present', 'Icy Wind', 'Drill Peck', 'Blizzard'],
  Suicune: ['Hydro Pump', 'Ice Beam', 'Icy Wind', 'Calm Mind'], Raikou: ['Thunder', 'Spark', 'Crunch', 'Calm Mind'], Entei: ['Flare Blitz', 'Fire Blast', 'Crunch', 'Extreme Speed'],
  Lanturn: ['Spark', 'Hydro Pump', 'Thunderbolt', 'Ice Beam'], Yanma: ['Ancient Power', 'Bug Buzz', 'Air Slash', 'Quick Attack'], Corsola: ['Ancient Power', 'Surf', 'Recover', 'Ice Beam'],
  Togetic: ['Ancient Power', 'Dazzling Gleam', 'Aerial Ace', 'Charm'], Granbull: ['Play Rough', 'Crunch', 'Dynamic Punch', 'Charm'], Ursaring: ['Body Slam', 'Crunch', 'Dynamic Punch', 'Swords Dance'],
  Hitmontop: ['Triple Kick', 'Close Combat', 'Rapid Spin', 'Dynamic Punch'], Tyrogue: ['Mach Punch', 'Brick Break', 'Tackle', 'Bulk Up'], Pichu: ['Spark', 'Thunder Shock', 'Charm', 'Quick Attack'],
  Elekid: ['Spark', 'Thunder Punch', 'Quick Attack', 'Thunder Wave'], Ariados: ['Fury Cutter', 'Poison Jab', 'Pin Missile', 'String Shot'], Ledian: ['Fury Cutter', 'Mach Punch', 'Air Slash', 'Agility'],
  Gligar: ['Faint Attack', 'Earthquake', 'X-Scissor', 'Wing Attack'], Sudowoodo: ['Rock Slide', 'Faint Attack', 'Brick Break', 'Rock Throw'], Xatu: ['Psychic', 'Air Slash', 'Faint Attack', 'Calm Mind'],
  'MissingNo.': ['Water Gun', 'Water Gun', 'Sky Attack'],   // exactly as in Red/Blue: three moves, Water Gun twice
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
function movesOfType(type, cat) { return Object.values(MOVES).filter(m => m.type === type && m.cat === cat && !m.sig && !((m.gen || 1) > MOVESET_GEN)).sort((a, b) => a.pow - b.pow); }
function buildMoveset(d, stats) {
  const out = buildMovesetRaw(d, stats);
  // Balance (16.2): a Pokémon with a healing move (Recover, Rest) can't also carry other status moves — no heal + boost/status stalling.
  const heals = out.filter(n => MOVES[n] && (MOVES[n].e.heal || MOVES[n].e.rest));
  if (heals.length) for (let i = 0; i < out.length; i++) { const mv = MOVES[out[i]]; if (!mv || mv.cat !== 'X' || heals.includes(out[i])) continue;
    const pref = stats.atk >= stats.spa ? 'P' : 'S', pool = [...movesOfType(d.types[0], pref), ...movesOfType(d.types[0], pref === 'P' ? 'S' : 'P'), ...(d.types[1] ? movesOfType(d.types[1], pref) : []), ...movesOfType('Normal', pref)]
      .filter(m => (m.pow || 0) > 0 && !m.e.rch && !m.e.fix && !out.includes(m.name)).sort((a, b) => Math.abs(a.pow - 85) - Math.abs(b.pow - 85));
    out[i] = pool.length ? pool[0].name : 'Body Slam'; }
  return out;
}
function buildMovesetRaw(d, stats) {
  if (MOVESET_OVERRIDE[d.name]) return MOVESET_OVERRIDE[d.name].slice();
  MOVESET_GEN = d.id >= 810 ? 8 : d.id >= 722 ? 7 : d.id >= 650 ? 6 : d.id >= 494 ? 5 : d.id >= 387 ? 4 : d.id >= 252 ? 3 : d.id >= 152 ? 2 : 1;   // which moves the automatic builder may use (never a later generation's)
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
    const pri = Object.values(MOVES).find(m => m.type === t1 && m.pri > 0 && m.cat === 'P' && !m.sig && !((m.gen || 1) > MOVESET_GEN));   // never a later generation's
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

