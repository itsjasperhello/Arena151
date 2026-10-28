/* =====================================================================
   Section 18: Pokémon size classes (visual only)
   Each Pokémon's official Gen 1 height puts it in one of six size classes and its battle
   sprite is drawn at that class's scale. The smallest class is the normal 1x sprite, so every
   Pokémon stays easy to see. Hitboxes, stats and balance are not touched: this is drawing only.
     XS  up to 0.4 m     x1.00   Pikachu, Diglett, Eevee, Mew
     S   0.4 - 0.8 m     x1.10   Charmander, Squirtle, Vulpix
     M   0.8 - 1.3 m     x1.22   Wartortle, Raichu, Gengar
     L   1.3 - 2.0 m     x1.42   Charizard, Mewtwo, Blastoise
     XL  2.0 - 4.0 m     x1.68   Snorlax, Lapras, Dragonair, Arbok
     XXL over 4 m        x1.95   only Onix and Gyarados
   ===================================================================== */
const HEIGHT_M = { 'MissingNo.': 1.0, 'Bulbasaur': 0.7, 'Ivysaur': 1.0, 'Venusaur': 2.0, 'Charmander': 0.6, 'Charmeleon': 1.1, 'Charizard': 1.7, 'Squirtle': 0.5, 'Wartortle': 1.0, 'Blastoise': 1.6, 'Caterpie': 0.3, 'Metapod': 0.7, 'Butterfree': 1.1, 'Weedle': 0.3, 'Kakuna': 0.6, 'Beedrill': 1.0, 'Pidgey': 0.3, 'Pidgeotto': 1.1, 'Pidgeot': 1.5, 'Rattata': 0.3, 'Raticate': 0.7, 'Spearow': 0.3, 'Fearow': 1.2, 'Ekans': 2.0, 'Arbok': 3.5, 'Pikachu': 0.4, 'Raichu': 0.8, 'Sandshrew': 0.6, 'Sandslash': 1.0, 'Nidoran♀': 0.4, 'Nidorina': 0.8, 'Nidoqueen': 1.3, 'Nidoran♂': 0.5, 'Nidorino': 0.9, 'Nidoking': 1.4, 'Clefairy': 0.6, 'Clefable': 1.3, 'Vulpix': 0.6, 'Ninetales': 1.1, 'Jigglypuff': 0.5, 'Wigglytuff': 1.0, 'Zubat': 0.8, 'Golbat': 1.6, 'Oddish': 0.5, 'Gloom': 0.8, 'Vileplume': 1.2, 'Paras': 0.3, 'Parasect': 1.0, 'Venonat': 1.0, 'Venomoth': 1.5, 'Diglett': 0.2, 'Dugtrio': 0.7, 'Meowth': 0.4, 'Persian': 1.0, 'Psyduck': 0.8, 'Golduck': 1.7, 'Mankey': 0.5, 'Primeape': 1.0, 'Growlithe': 0.7, 'Arcanine': 1.9, 'Poliwag': 0.6, 'Poliwhirl': 1.0, 'Poliwrath': 1.3, 'Abra': 0.9, 'Kadabra': 1.3, 'Alakazam': 1.5, 'Machop': 0.8, 'Machoke': 1.5, 'Machamp': 1.6, 'Bellsprout': 0.7, 'Weepinbell': 1.0, 'Victreebel': 1.7, 'Tentacool': 0.9, 'Tentacruel': 1.6, 'Geodude': 0.4, 'Graveler': 1.0, 'Golem': 1.4, 'Ponyta': 1.0, 'Rapidash': 1.7, 'Slowpoke': 1.2, 'Slowbro': 1.6, 'Magnemite': 0.3, 'Magneton': 1.0, 'Farfetch’d': 0.8, 'Doduo': 1.4, 'Dodrio': 1.8, 'Seel': 1.1, 'Dewgong': 1.7, 'Grimer': 0.9, 'Muk': 1.2, 'Shellder': 0.3, 'Cloyster': 1.5, 'Gastly': 1.3, 'Haunter': 1.6, 'Gengar': 1.5, 'Onix': 8.8, 'Drowzee': 1.0, 'Hypno': 1.6, 'Krabby': 0.4, 'Kingler': 1.3, 'Voltorb': 0.5, 'Electrode': 1.2, 'Exeggcute': 0.4, 'Exeggutor': 2.0, 'Cubone': 0.4, 'Marowak': 1.0, 'Hitmonlee': 1.5, 'Hitmonchan': 1.4, 'Lickitung': 1.2, 'Koffing': 0.6, 'Weezing': 1.2, 'Rhyhorn': 1.0, 'Rhydon': 1.9, 'Chansey': 1.1, 'Tangela': 1.0, 'Kangaskhan': 2.2, 'Horsea': 0.4, 'Seadra': 1.2, 'Goldeen': 0.6, 'Seaking': 1.3, 'Staryu': 0.8, 'Starmie': 1.1, 'Mr. Mime': 1.3, 'Scyther': 1.5, 'Jynx': 1.4, 'Electabuzz': 1.1, 'Magmar': 1.3, 'Pinsir': 1.5, 'Tauros': 1.4, 'Magikarp': 0.9, 'Gyarados': 6.5, 'Lapras': 2.5, 'Ditto': 0.3, 'Eevee': 0.3, 'Vaporeon': 1.0, 'Jolteon': 0.8, 'Flareon': 0.9, 'Porygon': 0.8, 'Omanyte': 0.4, 'Omastar': 1.0, 'Kabuto': 0.5, 'Kabutops': 1.3, 'Aerodactyl': 1.8, 'Snorlax': 2.1, 'Articuno': 1.7, 'Zapdos': 1.6, 'Moltres': 2.0, 'Dratini': 1.8, 'Dragonair': 4.0, 'Dragonite': 2.2, 'Mewtwo': 2.0, 'Mew': 0.4 };
const MEGA_HEIGHT_M = { Venusaur: 2.4, Beedrill: 1.4, Pidgeot: 2.2, Slowbro: 2.0, Kangaskhan: 2.2, Aerodactyl: 2.1, Mewtwo: 2.3, Pinsir: 1.7 };
const SIZE_CLASSES = [
  { id: 'XS', max: .4, scale: 1.00, label: 'Extra small' }, { id: 'S', max: .79, scale: 1.10, label: 'Small' }, { id: 'M', max: 1.3, scale: 1.22, label: 'Medium' },
  { id: 'L', max: 2.0, scale: 1.42, label: 'Large' }, { id: 'XL', max: 4.0, scale: 1.68, label: 'Extra large' }, { id: 'XXL', max: 1e9, scale: 1.95, label: 'Huge' }
];
function sizeClassOf(name, mega) {
  const h = (mega && MEGA_HEIGHT_M[name]) || HEIGHT_M[name] || 1.0;
  return SIZE_CLASSES.find(c => h <= c.max + 1e-9) || SIZE_CLASSES[2];
}
const sizeScaleOf = (name, mega) => sizeClassOf(name, mega).scale;
// Scale of the Pokémon currently out on side S (1 when nobody is out). Used to lift floating text and effects to the head.
function bodyScaleOf(S) { try { const m = act(S); return m ? sizeScaleOf(m.name, !!m.mega) : 1; } catch (e) { return 1; } }
