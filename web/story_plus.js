/* =====================================================================
   Section 24: STORY PLUS (Pokédex Adventure)
   1. Faster levelling. Every battle now gives a lot more experience:
        gain = the old amount x 4, but never less than 1.1 levels' worth, and a Pokémon that
        is behind for the gym you are about to face (for example a fresh catch) gets up to 3x more.
      Searching the grass (below) also trains your whole party.
   2. "Where to find" lookup. For every Pokémon: which routes, which levels, the chance, and which
      gym badge you need before that route opens (or "from the start"), plus evolutions.
      Open it from the story map, the Pokédex, or a gym card (that gym's route).
   3. Search the grass. On any unlocked gym's card you can walk its route and meet a wild Pokémon
      instead of fighting the leader. It can be repeated as often as you like and trains your party.
   ===================================================================== */
/* ---------- 1. faster levelling ---------- */
const EXP_BOOST = 4, MIN_LEVELS_PER_BATTLE = 1.1;
function easyExp(e, base) {
  const sv = STORY.save, need = expFor(e.level + 1) - expFor(e.level);
  let gain = Math.max(base * EXP_BOOST, need * MIN_LEVELS_PER_BATTLE);
  const target = Math.min(75, 8 + 6 * (sv ? sv.badges : 0)), lag = Math.max(0, target - e.level);      // catch-up for low-level Pokémon
  return Math.round(gain * (1 + Math.min(2, lag / 8)));
}
awardExp = function () {
  const sv = STORY.save; if (!isDexSave(sv) || !G || !G.sides) return [];
  return G.sides.A.team.map(m => {
    const key = m.pick || m.name, e = dexEntry(sv, key); if (!e) return null;
    return dexGainExp(sv, key, easyExp(e, Math.round((m.dmgDealt || 0) * .8) + 200));
  }).filter(Boolean);
};

/* ---------- 2. where to find Pokémon ---------- */
const locReq = leg => (leg <= 0 ? { text: 'From the start', badge: null } : { text: `After the ${GYMS[leg - 1].badge}`, badge: GYMS[leg - 1] });
function locInfo(name) {
  const routes = [];
  for (const R of ROUTES) { const tot = R.mons.reduce((s, m) => s + m[3], 0); for (const m of R.mons) if (m[0] === name) routes.push({ leg: R.leg, name: R.name, lo: m[1], hi: m[2], pct: m[3] / tot * 100, rare: m[3] < 1 }); }
  const evoFrom = Object.entries(EVO).filter(([k, v]) => [].concat(v[0]).includes(name)).map(([k, v]) => ({ from: k, lv: v[1] }));
  return { routes, evoFrom, starter: STARTERS.includes(name) };
}
// the earliest point this Pokémon can be obtained (-1 = starter), following its pre-evolutions
function locEarliest(name, seen = new Set()) {
  if (seen.has(name)) return Infinity; seen.add(name); const I = locInfo(name); let best = I.starter ? -1 : Infinity;
  for (const r of I.routes) best = Math.min(best, r.leg);
  for (const f of I.evoFrom) best = Math.min(best, locEarliest(f.from, seen));
  return best;
}
const fmtPct = p => (p < 1 ? '<1%' : p < 10 ? p.toFixed(1) + '%' : Math.round(p) + '%');
(function locUi() {
  const st = document.createElement('style');
  st.textContent = `
#locOv{position:fixed;inset:0;z-index:92;display:none;align-items:center;justify-content:center;background:rgba(5,8,22,.8);backdrop-filter:blur(3px);padding:10px;font-family:var(--ui);color:#fff}
#locOv.show{display:flex}
#locOv .lc{width:min(940px,100%);max-height:100%;display:flex;flex-direction:column;border-radius:20px;background:linear-gradient(160deg,#1d2766,#121838 60%);border:2px solid #ffd84a;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden}
#locOv .lc-top{display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,216,74,.12);border-bottom:2px solid rgba(255,216,74,.4)}
#locOv .lc-top h3{margin:0;font-family:var(--display);font-size:clamp(20px,3vw,28px);color:#ffd84a;flex:1}
#locOv .lc-top h3 small{display:block;font:700 12px var(--ui);color:#a9b6ff}
#locOv .lc-x{border:0;border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font:900 16px var(--ui);width:36px;height:36px;cursor:pointer}
#locOv .lc-bar{display:flex;gap:8px;flex-wrap:wrap;padding:8px 12px;align-items:center}
#locOv .lc-bar input,#locOv .lc-bar select{border:0;border-radius:10px;padding:8px 10px;font:700 14px var(--ui);background:rgba(255,255,255,.14);color:#fff;min-width:0}
#locOv .lc-bar input{flex:1;min-width:140px}
#locOv .lc-bar select option{color:#111}
#locOv .lc-bar button{border:0;border-radius:10px;padding:8px 12px;font:800 13px var(--ui);cursor:pointer;background:rgba(255,255,255,.12);color:#fff}
#locOv .lc-bar button.on{background:#ffd84a;color:#2a1206}
#locOv .lc-list{flex:1;overflow:auto;padding:8px 12px 14px;display:flex;flex-direction:column;gap:6px}
#locOv .lr{display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:center;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:6px 10px}
#locOv .lr.got{border-color:rgba(122,215,255,.55)}
#locOv .lr .p{height:56px;display:flex;align-items:center;justify-content:center}
#locOv .lr .p img,#locOv .lr .p canvas{max-height:54px;max-width:100%;image-rendering:pixelated}
#locOv .lr .nm{font:900 15px var(--ui)} #locOv .lr .nm small{font:800 11px var(--ui);color:#a9b6ff;margin-left:6px}
#locOv .lr .ok{color:#7ad7ff;font:800 11px var(--ui);margin-left:6px}
#locOv .lr .w{display:flex;flex-direction:column;gap:3px;margin-top:3px}
#locOv .lr .w div{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font:700 12px var(--ui);color:#dfe5ff}
#locOv .chip{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:2px 9px;font:800 11px var(--ui);background:rgba(255,255,255,.14);white-space:nowrap}
#locOv .chip.req{background:#ffd84a;color:#2a1206} #locOv .chip.start{background:#58d65a;color:#06240a} #locOv .chip.evo{background:#7ad7ff;color:#06243a} #locOv .chip.rare{background:#ff7ab8;color:#2a0616}
#locOv .chip img{width:15px;height:15px}
#locOv .none{padding:24px;text-align:center;color:#a9b6ff;font:700 14px var(--ui)}
#dexOv .dm .loc{position:absolute;bottom:3px;left:4px;width:18px;height:18px;border-radius:50%;border:0;background:#1d2766;color:#ffd84a;font:900 11px var(--ui);cursor:pointer;padding:0;line-height:18px}
#dexOv .dx-where{border:0;border-radius:10px;background:#ffd84a;color:#2a1206;font:800 13px var(--ui);padding:8px 12px;cursor:pointer}
@media (max-height:560px){#locOv .lr{grid-template-columns:48px 1fr}#locOv .lr .p{height:42px}}`;
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'locOv'; d.setAttribute('role', 'dialog'); document.body.appendChild(d);
  addEventListener('keydown', e => { if (e.key === 'Escape' && d.classList.contains('show')) { d.classList.remove('show'); e.stopPropagation(); } }, true);
})();
const LOC = { q: '', show: 'all', leg: 'all' };
function openLocations(opts = {}) {
  const sv = STORY.save; if (!isDexSave(sv)) return;
  if ('query' in opts) LOC.q = opts.query || ''; if ('leg' in opts) LOC.leg = opts.leg === null ? 'all' : String(opts.leg); if (opts.show) LOC.show = opts.show;
  const ov = $('locOv'), owned = n => !!dexEntry(sv, n);
  ov.innerHTML = `<div class="lc"><div class="lc-top"><h3>WHERE TO FIND POKÉMON<small>Routes, levels, chances and the gym badge that opens each route</small></h3><button class="lc-x" type="button" aria-label="Close">✕</button></div>
    <div class="lc-bar"><input id="lcQ" type="search" placeholder="Search a Pokémon…" value="${escapeHtml(LOC.q)}" autocomplete="off">
      <select id="lcLeg"><option value="all">All routes</option>${ROUTES.map(R => `<option value="${R.leg}">${R.leg + 1}. ${escapeHtml(R.name)} — ${locReq(R.leg).text}</option>`).join('')}</select>
      <button type="button" data-s="all">All</button><button type="button" data-s="new">Not caught</button><button type="button" data-s="got">Caught</button></div>
    <div class="lc-list" id="lcList"></div></div>`;
  $('lcLeg').value = LOC.leg;
  const draw = () => {
    const q = LOC.q.trim().toLowerCase(), list = $('lcList'); list.innerHTML = '';
    for (const b of ov.querySelectorAll('.lc-bar button')) b.classList.toggle('on', b.dataset.s === LOC.show);
    let rows = DEX.map(d => ({ d, I: locInfo(d.name), got: owned(d.name) || owned(d.name + '|shiny') }));
    if (q) rows = rows.filter(r => r.d.name.toLowerCase().includes(q) || String(r.d.id) === q);
    if (LOC.leg !== 'all') { const L = +LOC.leg; rows = rows.filter(r => r.I.routes.some(x => x.leg === L)); rows.sort((a, b) => b.I.routes.find(x => x.leg === L).pct - a.I.routes.find(x => x.leg === L).pct); }
    if (LOC.show === 'new') rows = rows.filter(r => !r.got); else if (LOC.show === 'got') rows = rows.filter(r => r.got);
    ov.querySelector('.lc-top small').textContent = `${rows.length} Pokémon shown · caught ${DEX.filter(d => owned(d.name) || owned(d.name + '|shiny')).length} / ${DEX.length}`;
    if (!rows.length) { list.innerHTML = '<div class="none">No Pokémon match.</div>'; return; }
    for (const { d, I, got } of rows.slice(0, 160)) {
      const lines = [];
      if (I.starter) lines.push(`<div><span class="chip start">Starter</span> Choose it at the start of a run</div>`);
      for (const r of I.routes.filter(x => LOC.leg === 'all' || x.leg === +LOC.leg)) { const q2 = locReq(r.leg); lines.push(`<div><span class="chip req">${q2.badge ? `<img src="${badgeUrl(q2.badge)}" alt="">` : ''}${q2.text}</span><span>${escapeHtml(r.name)}</span><span class="chip">Lv ${r.lo === r.hi ? r.lo : r.lo + '–' + r.hi}</span><span class="chip ${r.rare ? 'rare' : ''}">${r.rare ? 'Rare · ' : ''}${fmtPct(r.pct)}</span></div>`); }
      for (const f of I.evoFrom) { const e0 = locEarliest(f.from), q3 = e0 < 0 ? 'Starter' : locReq(e0).text; lines.push(`<div><span class="chip evo">Evolves</span><span>from ${escapeHtml(f.from)} at Lv ${f.lv} — ${escapeHtml(f.from)}: ${e0 < 0 ? 'a starter' : q3.toLowerCase()}</span></div>`); }
      if (!lines.length) lines.push('<div>Not found in the wild</div>');
      const row = document.createElement('div'); row.className = 'lr' + (got ? ' got' : '');
      row.innerHTML = `<div class="p"></div><div><div class="nm">${escapeHtml(d.name)}<small>#${String(d.id).padStart(3, '0')} · ${d.types.join(' / ')}</small>${got ? '<span class="ok">● in your Pokédex</span>' : ''}</div><div class="w">${lines.join('')}</div></div>`;
      try { row.querySelector('.p').appendChild(monPic(d.name)); } catch (e) { }
      list.appendChild(row);
    }
    if (rows.length > 160) list.insertAdjacentHTML('beforeend', '<div class="none">Showing the first 160 — search to narrow it down.</div>');
  };
  $('lcQ').oninput = e => { LOC.q = e.target.value; draw(); };
  $('lcLeg').onchange = e => { LOC.leg = e.target.value; draw(); };
  for (const b of ov.querySelectorAll('.lc-bar button')) b.onclick = () => { LOC.show = b.dataset.s; draw(); };
  ov.querySelector('.lc-x').onclick = () => ov.classList.remove('show');
  ov.onclick = e => { if (e.target === ov) ov.classList.remove('show'); };
  draw(); ov.classList.add('show');
  if (opts.focus !== false && !LOC.q) setTimeout(() => { try { $('lcQ').focus(); } catch (e) { } }, 60);
}

/* the Pokédex gets a "Where to find" button, and an info dot on every card (also on Pokémon you have not caught yet) */
const _lpOpenDex = openDex;
openDex = function () {
  const r = _lpOpenDex.apply(this, arguments);
  const ov = $('dexOv'), top = ov && ov.querySelector('.dx-top'); if (!top) return r;
  if (!top.querySelector('.dx-where')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'dx-where'; b.textContent = 'Where to find'; b.onclick = () => openLocations({ query: '', leg: null, show: 'all' }); top.insertBefore(b, top.querySelector('.dx-close')); }
  for (const card of ov.querySelectorAll('.dm')) {
    if (card.querySelector('.loc')) continue; const num = card.querySelector('.num'), id = num && parseInt(num.textContent.replace('#', ''), 10), d = DEX[id - 1]; if (!d) continue;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'loc'; b.textContent = 'i'; b.title = `Where to find ${d.name}`;
    b.onclick = e => { e.stopPropagation(); openLocations({ query: d.name, leg: null, show: 'all', focus: false }); }; card.appendChild(b);
    if (card.classList.contains('no')) card.onclick = () => openLocations({ query: d.name, leg: null, show: 'all', focus: false });
  }
  return r;
};

/* ---------- 3. search the grass instead of fighting ---------- */
function grassExp(res) {
  const sv = STORY.save, out = [], base = 100 + (res && res.lv ? res.lv : 5) * 30;
  for (const key of sv.team || []) { const e = dexEntry(sv, key); if (!e) continue; const r = dexGainExp(sv, key, easyExp(e, base)); if (r) out.push(r); }
  return out;
}
async function searchGrass(i) {
  const sv = STORY.save; if (!isDexSave(sv) || SAFARI.busy || i >= ROUTES.length || i > sv.badges) return;
  SAFARI.busy = true; closeModal(); let res = null;
  try { res = await safariEncounter(i); }   // searching the grass: the trainer stays where it is (only gym challenges walk the route)
  finally { SAFARI.busy = false; }
  const gains = grassExp(res); saveStory(); renderStory();
  const m = $('syModal'), R = ROUTES[i], g = GYMS[i];
  m.innerHTML = `<div class="sy-cer"><h2>${res && res.caught ? 'Caught ' + escapeHtml(res.sp) + '!' : 'Grass search over'}</h2>
    <p>${escapeHtml(R.name)} · on the way to ${escapeHtml(g.city)}. Your party trained while you searched.</p>${expSummaryHtml(gains)}
    <div class="acts" style="justify-content:center;margin-top:12px"><button class="sy-btn go" type="button" id="gsAgain">Search again</button><button class="sy-btn" type="button" id="gsFight">Gym card</button><button class="sy-btn" type="button" id="gsBack">Back to map</button></div></div>`;
  m.classList.add('show');
  $('gsAgain').onclick = () => searchGrass(i); $('gsFight').onclick = () => openGymCard(i); $('gsBack').onclick = closeModal; $('gsAgain').focus();
}
const _lpOpenGymCard = openGymCard;
openGymCard = function (i) {
  const r = _lpOpenGymCard.apply(this, arguments); const sv = STORY.save;
  if (!isDexSave(sv) || i >= ROUTES.length) return r;
  const acts = document.querySelector('#syModal .acts'); if (!acts || acts.querySelector('#syGrass')) return r;
  const open = i <= sv.badges, back = acts.querySelector('#syBack'), g = GYMS[i];
  const grass = document.createElement('button'); grass.type = 'button'; grass.className = 'sy-btn'; grass.id = 'syGrass';
  grass.textContent = open ? 'Search the grass' : 'Search the grass (locked)'; grass.disabled = !open;
  grass.title = open ? `Walk the route to ${g.city}, meet a wild Pokémon and train your party — no gym battle` : `Earn the ${GYMS[Math.max(0, i - 1)].badge} first`;
  const loc = document.createElement('button'); loc.type = 'button'; loc.className = 'sy-btn'; loc.id = 'syRouteMons'; loc.textContent = 'Route Pokémon'; loc.title = 'Which Pokémon live on this route';
  acts.insertBefore(grass, back); acts.insertBefore(loc, back);
  grass.onclick = () => searchGrass(i); loc.onclick = () => openLocations({ leg: i, query: '', show: 'all', focus: false });
  return r;
};

/* a "Locations" button on the story map */
(function locButton() {
  const top = document.querySelector('#storyOv .sy-top'); if (!top) return;
  const b = document.createElement('button'); b.className = 'sy-btn'; b.id = 'syLoc'; b.type = 'button'; b.textContent = 'Where to find'; b.style.display = 'none';
  b.onclick = () => openLocations({ query: '', leg: null, show: 'all' }); top.insertBefore(b, $('syDex') || $('syMenu'));
})();
const _lpRenderStory = renderStory;
renderStory = function () { const r = _lpRenderStory.apply(this, arguments); const b = $('syLoc'); if (b) b.style.display = isDexSave(STORY.save) ? '' : 'none'; return r; };
{ const sb = $('syDex'); if (sb) sb.onclick = () => openDex(); }   // the map's Pokédex button was bound to the old function
window.openLocations = openLocations; window.searchGrass = searchGrass;
