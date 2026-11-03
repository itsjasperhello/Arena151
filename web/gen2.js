/* =====================================================================
   Section 35: Johto (Gen 2) support
   - Catch rates for the 100 Johto Pokémon (their Gen 2 values)
   - Generation helpers, and Gen 1 / Gen 2 / All tabs in the Pokémon
     chooser (they work together with the search box)
   ===================================================================== */
const GEN_OF = name => { const d = typeof DEX_BY_NAME !== 'undefined' && DEX_BY_NAME[String(name).split('|')[0]]; return d && d.id >= 152 ? 2 : 1; };
(function johtoSupport() {
  const $ = id => document.getElementById(id);
  // ---- catch rates (story mode) ----
  if (typeof CATCH_RATE !== 'undefined') Object.assign(CATCH_RATE, {
    Chikorita: 45, Bayleef: 45, Meganium: 45, Cyndaquil: 45, Quilava: 45, Typhlosion: 45, Totodile: 45, Croconaw: 45, Feraligatr: 45, Sentret: 255, Furret: 90, Hoothoot: 255, Noctowl: 90,
    Ledyba: 255, Ledian: 90, Spinarak: 255, Ariados: 90, Crobat: 90, Chinchou: 190, Lanturn: 75, Pichu: 190, Cleffa: 150, Igglybuff: 170, Togepi: 190, Togetic: 75, Natu: 190, Xatu: 75,
    Mareep: 235, Flaaffy: 120, Ampharos: 45, Bellossom: 45, Marill: 190, Azumarill: 75, Sudowoodo: 65, Politoed: 45, Hoppip: 255, Skiploom: 120, Jumpluff: 45, Aipom: 45, Sunkern: 235,
    Sunflora: 120, Yanma: 75, Wooper: 255, Quagsire: 90, Espeon: 45, Umbreon: 45, Murkrow: 30, Slowking: 70, Misdreavus: 45, Unown: 225, Wobbuffet: 45, Girafarig: 60, Pineco: 190,
    Forretress: 75, Dunsparce: 190, Gligar: 60, Steelix: 25, Snubbull: 190, Granbull: 75, Qwilfish: 45, Scizor: 25, Shuckle: 190, Heracross: 45, Sneasel: 60, Teddiursa: 120, Ursaring: 60,
    Slugma: 190, Magcargo: 75, Swinub: 225, Piloswine: 75, Corsola: 60, Remoraid: 190, Octillery: 75, Delibird: 45, Mantine: 25, Skarmory: 25, Houndour: 120, Houndoom: 45, Kingdra: 45,
    Phanpy: 120, Donphan: 60, Porygon2: 45, Stantler: 45, Smeargle: 45, Tyrogue: 75, Hitmontop: 45, Smoochum: 45, Elekid: 45, Magby: 45, Miltank: 45, Blissey: 30, Raikou: 3, Entei: 3,
    Suicune: 3, Larvitar: 45, Pupitar: 45, Tyranitar: 45, Lugia: 3, 'Ho-Oh': 3, Celebi: 45 });
  // ---- the chooser: Gen 1 / Gen 2 / All ----
  let gen = (() => { try { return localStorage.getItem('arena151.pickGen') || 'all'; } catch (e) { return 'all'; } })();
  const css = document.createElement('style'); css.textContent = `
  #stPick .pk-gen{display:flex;gap:4px;flex:none}#stPick .pk-gen button{border:0;border-radius:9px;padding:6px 10px;font:800 12px var(--ui,Rubik,sans-serif);background:#2a3456;color:#fff;cursor:pointer;white-space:nowrap}
  #stPick .pk-gen button.on{background:#ffd84a;color:#141c34}
  #stGridPk button.gen-off{display:none!important}`;
  document.head.appendChild(css);
  function applyGen() { const grid = $('stGridPk'); if (!grid) return; for (const b of grid.querySelectorAll('button[data-n]')) b.classList.toggle('gen-off', gen !== 'all' && String(GEN_OF(b.dataset.n)) !== gen);
    document.querySelectorAll('#stPick .pk-gen button').forEach(x => { x.classList.toggle('on', x.dataset.g === gen); x.setAttribute('aria-pressed', String(x.dataset.g === gen)); }); }
  function mountTabs() { const top = document.querySelector('#stPick .pk-top'); if (!top || top.querySelector('.pk-gen')) return;
    const box = document.createElement('div'); box.className = 'pk-gen'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Generation');
    box.innerHTML = [['all', 'All'], ['1', 'Gen 1 · Kanto'], ['2', 'Gen 2 · Johto']].map(([g, t]) => `<button type="button" data-g="${g}">${t}</button>`).join('');
    const search = $('stSearch'); if (search) search.after(box); else top.prepend(box);
    box.onclick = e => { const b = e.target.closest('button[data-g]'); if (!b) return; gen = b.dataset.g; try { localStorage.setItem('arena151.pickGen', gen); } catch (x) { } applyGen(); }; }
  if (typeof openMonPicker === 'function') { const _o = openMonPicker; openMonPicker = function () { const r = _o.apply(this, arguments); mountTabs(); applyGen(); return r; }; }
  window.applyPickGen = applyGen;
})();
