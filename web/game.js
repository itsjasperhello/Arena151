/* =====================================================================
   Section 9: HUD and DOM
   ===================================================================== */
const statusChip = st => st ? `<span class="chip st" style="background:${STATUS_INFO[st].color}">${STATUS_INFO[st].label}</span>` : '';
const hpColor = f => f > .5 ? 'var(--hp)' : f > .2 ? 'var(--hpmid)' : 'var(--hplow)';
let hudKey = { A: '', B: '' }, movesKey = '', lastHud = 0;
function updateHUD(force) {
  if (!G) return;
  for (const S of ['A', 'B']) {
    const sd = side(S), m = act(S), f = m.hp / m.max;
    $('name' + S).textContent = displayName(m);
    let chips = m.types.map(t => `<span class="chip" style="background:${TYPE_COLOR[t]}">${t}</span>`).join('');
    if (m.item) chips += `<span class="chip" style="background:#f3e3a0">${m.item}</span>`;
    chips += statusChip(m.status);
    if (m.conf > 0) chips += '<span class="chip" style="background:#ffe86b">CONF</span>';
    const core = ['atk', 'def', 'spa', 'spd', 'spe'], allUp = core.every(k => m.stages[k] >= 1) ? Math.min(...core.map(k => m.stages[k])) : 0;
    if (allUp) chips += `<span class="chip up">ALL+${allUp}</span>`;
    for (const [k, v] of Object.entries(m.stages)) if (v - (core.includes(k) ? allUp : 0)) chips += `<span class="chip ${v > 0 ? 'up' : 'down'}">${STAT_CHIP[k]}${v - (core.includes(k) ? allUp : 0) > 0 ? '+' : ''}${v - (core.includes(k) ? allUp : 0)}</span>`;
    if ($('chips' + S).innerHTML !== chips) $('chips' + S).innerHTML = chips;
    const bar = $('bar' + S); bar.style.width = (f * 100) + '%'; bar.style.backgroundColor = hpColor(f);
    $('hp' + S).textContent = `${m.hp}`;
    const port = $('portrait' + S), pk = m.name + (m.mega ? '#M' : '') + (spriteOf(m.name, m.mega).custom ? 'C' : ''); if (port.dataset.mon !== pk || force) { drawSpriteTo(port, m.name, { portrait: true, mega: m.mega, faceRight: S === 'A', bg: mix(TYPE_COLOR[m.types[0]], '#20284a', .55) }); port.dataset.mon = pk; }
    $('port' + S).classList.toggle('fnt', m.hp <= 0);
    const toks = (S === 'B' ? `<span class="team-tag">GOLD</span>` : '') +
      sd.team.map((t, i) => `<span class="tok ${t.hp <= 0 ? 'fnt' : ''} ${t.status ? 'st' : ''} ${i === sd.active ? 'active' : ''}" title="${t.name} ${t.hp}/${t.max}"></span>`).join('') +
      (S === 'A' ? `<span class="team-tag">RED</span>` : '');
    if (hudKey[S] !== toks) { $('tok' + S).innerHTML = toks; hudKey[S] = toks; }
  }
  renderRosters();
}
function drawMinis() { for (const S of ['A', 'B']) { const c = $('mini' + S), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 16, 16); x.drawImage(trainerCanvas(S), 0, 0, 16, 16, 0, 0, 16, 16); } }
function tickTimer() { const s = Math.floor(G.elapsed / 1000), txt = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if ($('timer').textContent !== txt) $('timer').textContent = txt; }
function moveDescription(mv) {
  const e = mv.e, out = [];
  if (e.st) out.push(`${e.st[1]}% chance: ${STATUS_INFO[e.st[0]].name}`); if (e.fl) out.push(`${e.fl}% flinch`); if (e.cf) out.push(`${e.cf}% confuse`);
  if (e.hc) out.push('high crit ratio'); if (e.rc) out.push('1/3 recoil'); if (e.dr) out.push('drains half'); if (e.rch) out.push('must recharge after');
  if (e.hits) out.push('2–5 hits'); if (e.fix) out.push(`fixed ${e.fix * HP_MULT} damage`); if (e.ucf) out.push('confuses user');
  if (e.self) out.push('user ' + Object.entries(e.self).map(([k, v]) => `${STAT_CHIP[k]}${v > 0 ? '+' : ''}${v}`).join(' '));
  if (e.tg) out.push('target ' + Object.entries(e.tg).map(([k, v]) => `${STAT_CHIP[k]}${v}`).join(' '));
  if (e.heal) out.push('heals half'); if (e.rest) out.push('full heal, then sleep');
  const kind = { contact: 'charges in', dash: 'fast dash', slash: 'close slash', projectile: 'projectile', beam: 'beam — dodge the aim line', bolt: 'strikes the target spot', sky: 'falls on the target spot', psy: 'grips the target spot', quake: 'shockwave around the user', wave: 'shockwave around the user', burst: 'exploding shot', stars: 'homing stars', leaves: 'leaf volley', wind: 'wind blades', multi: 'rapid shots', drain: 'draining shot', dig: 'burrows under the target', hex: 'slow status shot', powder: 'slow powder' }[mv.anim];
  return `${mv.name}: ${[kind, ...out].filter(Boolean).join('; ')}. Cooldown ${(cooldownOf(mv) / 1000).toFixed(1)}s.`;
}
function renderMoves() {
  const el = $('moves'); if (!G) { el.innerHTML = ''; return; }
  const m = act('A'), foe = act('B'), key = m.name + '|' + foe.name + '|' + G.sides.A.active + '|' + G.auto;
  if (key === movesKey && el.children.length) return;
  movesKey = key; el.innerHTML = '';
  m.moves.forEach((n, i) => {
    const mv = MOVES[n], b = document.createElement('button'); b.className = 'move'; b.style.setProperty('--mc', TYPE_COLOR[mv.type]);
    const eff = mv.cat === 'X' ? null : typeEff(mv.type, foe.types);
    const effTag = eff === null ? '' : eff === 0 ? '<span class="me imm">No effect</span>' : eff > 1 ? `<span class="me se">${eff}× effective</span>` : eff < 1 ? `<span class="me nve">${eff}× effective</span>` : '<span class="me"></span>';
    const cat = mv.cat === 'P' ? 'Physical' : mv.cat === 'S' ? 'Special' : 'Status';
    b.innerHTML = `<span class="key">${i + 1}</span><span class="mn">${mv.name}</span><span class="mp">${mv.cat === 'X' ? '—' : mv.e.fix ? mv.e.fix * HP_MULT : mv.pow}</span>
      <span class="mm">${mv.type} · ${cat} · ${mv.acc == null ? 'never misses' : mv.acc + '%'} · ${(cooldownOf(mv) / 1000).toFixed(1)}s</span>${effTag}<span class="cdfill"></span><span class="cdtxt"></span>`;
    b.title = moveDescription(mv);
    b.onclick = () => queueMove(i);
    el.appendChild(b);
  });
}
function updateCooldowns() {
  if (!G) return;
  const mb = $('bMega'), tm = $('tMega'), can = !G.auto && !clock.paused && canMega('A'); if (mb.disabled === can) mb.disabled = !can; if (tm.disabled === can) tm.disabled = !can; const m = act('A'), sd = side('A'), btns = $('moves').children;
  for (let i = 0; i < btns.length; i++) {
    const b = btns[i], mv = MOVES[m.moves[i]]; if (!mv) continue;
    const cd = m.cd[i], frac = cd > 0 ? clamp(cd / cooldownOf(mv), 0, 1) : 0;
    b.style.setProperty('--cd', frac.toFixed(3));
    const txt = cd > 0 ? (cd / 1000).toFixed(1) : '';
    const t = b.querySelector('.cdtxt'); if (t.textContent !== txt) t.textContent = txt;
    b.classList.toggle('ready', cd <= 0 && G.phase === 'battle');
    b.classList.toggle('queued', sd.queued === i);
    b.disabled = G.phase !== 'battle' || clock.paused || G.auto;
  }
}
function rosterCard(m, i, S, opts = {}) {
  const el = document.createElement(opts.button ? 'button' : 'div'), isActive = G && i === side(S).active && !['title'].includes(G.phase);
  el.className = `card ${m.hp <= 0 ? 'fnt' : ''} ${isActive ? 'active' : ''} ${opts.pickable ? 'pickable' : ''}`;
  const cv = document.createElement('canvas'); cv.width = cv.height = 56; drawSpriteTo(cv, m.name, { mega: m.mega, faceRight: S === 'A' });
  const f = m.hp / m.max, badge = m.hp <= 0 ? 'FNT' : isActive ? 'ACTIVE' : m.status ? STATUS_INFO[m.status].label : '';
  if (badge) el.insertAdjacentHTML('beforeend', `<span class="badge">${badge}</span>`);
  el.appendChild(cv);
  el.insertAdjacentHTML('beforeend', `<div class="cn">${m.mega ? 'Mega ' : ''}${m.name}</div><div class="cb"><i style="width:${f * 100}%;background:${hpColor(f)}"></i></div>`);
  el.title = `${m.name} — ${m.hp}/${m.max} HP${m.status ? ' — ' + STATUS_INFO[m.status].name : ''}`;
  if (opts.button) { el.disabled = !opts.pickable; if (opts.onPick) el.onclick = () => opts.onPick(i); }
  return el;
}
let rosterKey = '';
function renderRosters() {
  if (!G) return;
  const sdA = side('A'), canSwitch = G.phase === 'battle' && !clock.paused && sdA.state === 'idle' && sdA.switchCd <= 0 && !G.auto;
  const key = ['A', 'B'].map(S => side(S).team.map(m => `${m.name}${m.hp}${m.status}`).join() + side(S).active).join('|') + canSwitch + G.phase;
  if (key !== rosterKey) {
    rosterKey = key;
    const A = $('rosterA'), B = $('rosterB'); A.innerHTML = ''; B.innerHTML = '';
    sdA.team.forEach((m, i) => A.appendChild(rosterCard(m, i, 'A', { button: true, pickable: canSwitch && i !== sdA.active && m.hp > 0, onPick: idx => requestSwitch('A', idx) })));
    side('B').team.forEach((m, i) => B.appendChild(rosterCard(m, i, 'B')));
  }
  renderMoves();
  const p = $('prompt'), m = act('A');
  const msg = G.phase === 'battle' ? (clock.paused ? 'Paused.' : G.auto ? 'Watch mode: both trainers are AI-controlled.' : sdA.state !== 'idle' ? '…' : m.status === 'slp' ? `${m.name} is asleep!` : m.status === 'frz' ? `${m.name} is frozen solid!` : sdA.stun > 0 && sdA.stunKind === 'recharge' ? `${m.name} must recharge!` : `${m.name} — attack when ready!`)
    : G.phase === 'pick' ? 'Choose your next Pokémon.' : G.phase === 'over' ? 'Battle over. Rematch or build new teams.' : G.phase === 'title' ? 'Start a battle to give commands.' : 'Get ready…';
  if (p.textContent !== msg) p.textContent = msg;
  $('bQuick').disabled = !['battle', 'pick', 'over'].includes(G.phase);
  if (APP) document.documentElement.classList.toggle('inbattle', G.phase === 'battle');
}
function onLog(text, cls) {
  const el = $('log'), d = document.createElement('div'); if (cls) d.className = 't'; d.textContent = '› ' + text; el.appendChild(d);
  while (el.children.length > 150) el.removeChild(el.firstChild); el.scrollTop = el.scrollHeight;
}
function renderLogFromState() { const el = $('log'); el.innerHTML = ''; for (const l of G.log) onLog(l.replace(/^§/, ''), l.startsWith('§')); }
let toastT = 0;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }
function drawWave() {
  const svg = $('wave'), w = 600, h = 100; let d = 'M0 ' + h; const r = mulberry(77);
  for (let x = 0; x <= w; x += 4) { const y = h * .5 + Math.sin(x / 37) * 14 + Math.sin(x / 11) * 6 + (r() - .5) * 26; d += ` L${x} ${y.toFixed(0)} L${x + 4} ${y.toFixed(0)}`; }
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.innerHTML = `<path d="${d} L${w} ${h} Z" fill="#2a355e"/><path d="${d}" fill="none" stroke="#3a4880" stroke-width="2"/>`;
}
let spritesDirtyT = 0;
function onSpritesChanged() { clearTimeout(spritesDirtyT); spritesDirtyT = setTimeout(() => { rosterKey = ''; movesKey = ''; if (G) updateHUD(true); }, 60); }

/* =====================================================================
   Section 10: flow — title, intro, battle, picks, results
   ===================================================================== */
const DEFAULT_A = ['Pikachu', 'Blastoise', 'Venusaur', 'Snorlax', 'Charizard', 'Lapras'];
const DEFAULT_B = ['Arcanine', 'Pinsir', 'Golbat', 'Jolteon', 'Gyarados', 'Alakazam'];
const showOverlay = (id, on) => $(id).classList.toggle('show', on);
let introSkip = null, autosaveT = 0;
function resetScene() { cancelAll(); buildScars(); crowdState.length = 0; for (const k in groupState) delete groupState[k]; trainerWalk.A = trainerWalk.B = 1; slide.t = -9999; bigText.t = -9999; }
function chooseStage() { const v = $('stageSel').value; return v === 'random' ? pickBy(STAGE_ORDER, Math.random) : v; }
async function startBattle(picksA, picksB, stageId) {
  setStage(stageId || chooseStage()); resetScene(); const my = epoch; $('titleStage').textContent = STAGE.name;
  clock.paused = false; $('pausedTag').classList.remove('show'); $('bPause').textContent = 'Pause';
  G = newBattle(picksA, picksB, { auto: watchMode, timeLimit: Number($('timeLimit').value) });
  ['ovTitle', 'ovResults', 'ovSwitch'].forEach(id => showOverlay(id, false));
  $('log').innerHTML = ''; $('timer').textContent = '0:00'; movesKey = ''; rosterKey = '';
  logLine(`Red and Gold meet in the ${STAGE.name}. Live battle — six Pokémon each.`, 't');
  updateHUD(true); warmSprites([...G.picks.A, ...G.picks.B]);
  try {
    await playIntro(my); guard(my);
    spawnIn('A', 0); await wait(250); guard(my); spawnIn('B', 0);
    await wait(1000); guard(my);
    VFX.big('FIGHT!', '#ffd23f'); await wait(600); guard(my);
    G.phase = 'battle'; G.lastDmgT = G.time; updateHUD(); autosave();
  } catch (e) { if (!(e instanceof Cancelled)) console.error(e); }
}
async function playIntro(my) {
  const vs = $('ovVs');
  const big = (id, S) => { const c = $(id), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, c.width, c.height); x.save(); if (S === 'B') { x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(trainerCanvas(S), 0, 0, c.width, c.height); x.restore(); };
  big('vsTrainerA', 'A'); big('vsTrainerB', 'B');
  for (const S of ['A', 'B']) { const el = $('vsTeam' + S); el.innerHTML = ''; side(S).team.forEach(m => { const c = document.createElement('canvas'); c.width = c.height = SPR; drawSpriteTo(c, m.name, { faceRight: S === 'A' }); c.title = m.name; el.appendChild(c); }); }
  vs.querySelectorAll('.vs-card,.vs-mark').forEach(n => { n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; });
  showOverlay('ovVs', true);
  let skipped = false; introSkip = () => { skipped = true; }; vs.onclick = introSkip;
  for (let t = 0; t < 2300 && !skipped; t += 50) { await wait(50); guard(my); }
  introSkip = null; showOverlay('ovVs', false);
  await Promise.all([anim(520, p => trainerWalk.A = 1 - Ease.outQ(p)), anim(520, p => trainerWalk.B = 1 - Ease.outQ(p))]);
  trainerWalk.A = trainerWalk.B = 0;
}
function onNeedPick() {
  const grid = $('pickGrid'); grid.innerHTML = '';
  side('A').team.forEach((m, i) => { if (m.hp > 0) grid.appendChild(rosterCard(m, i, 'A', { button: true, pickable: true, onPick: forcePick })); });
  showOverlay('ovSwitch', true); updateHUD(); autosave();
  const first = grid.querySelector('button'); if (first) first.focus();
}
function forcePick(i) {
  if (!G || G.phase !== 'pick' || side('A').team[i].hp <= 0) return;
  showOverlay('ovSwitch', false); G.phase = 'battle'; spawnIn('A', i); updateHUD();
}
async function onBattleEnd(w, bigTxt) {
  const my = epoch; updateHUD(); autosave();
  try {
    if (bigTxt) { VFX.big(bigTxt, '#ffffff'); await wait(900); guard(my); }
    else await wait(600);
    if (w !== 'draw' && side(w).state === 'idle') for (let i = 0; i < 3; i++) { side(w).hop = 1; await wait(320); guard(my); }
    showResults();
  } catch (e) { if (!(e instanceof Cancelled)) console.error(e); }
}
function showResults() {
  const w = G.winner, banner = $('resBanner');
  banner.textContent = w === 'draw' ? 'DRAW!' : `${w === 'A' ? 'RED' : 'GOLD'} WINS!`;
  banner.className = 'banner ' + (w === 'B' ? 'gold' : w === 'draw' ? 'draw' : '');
  banner.style.animation = 'none'; void banner.offsetWidth; banner.style.animation = '';
  $('resTitle').textContent = G.auto ? (w === 'draw' ? 'Draw' : `${TEAM_NAME[w]} wins`) : w === 'A' ? 'Victory' : w === 'B' ? 'Defeat' : 'Draw';
  $('resTitle').style.color = w === 'A' ? '#7dff9a' : w === 'B' ? '#ff8a8a' : '#e6ecff';
  const ms = w === 'draw' ? 'A' : w, mvp = side(ms).team.slice().sort((a, b) => (b.kos * 1e6 + b.dmg) - (a.kos * 1e6 + a.dmg))[0];
  drawSpriteTo($('resMvp'), mvp.name);
  $('resSub').textContent = (G.decision ? G.decision + ' ' : '') + `MVP: ${mvp.name} (${TEAM_NAME[ms]}) — ${mvp.kos} KO${mvp.kos === 1 ? '' : 's'}, ${mvp.dmg} damage`;
  const s = Math.floor(G.elapsed / 1000), st = G.stats, left = S => side(S).team.filter(m => m.hp > 0).length;
  $('resStats').innerHTML = `<span>Battle time</span><b>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</b>
    <span>Attacks used</span><b>${st.A.moves} – ${st.B.moves}</b>
    <span>Red damage / KOs</span><b>${st.A.dmg} / ${st.A.kos}</b>
    <span>Gold damage / KOs</span><b>${st.B.dmg} / ${st.B.kos}</b>
    <span>Pokémon left</span><b>${left('A')} – ${left('B')}</b>
    <span>Biggest hit</span><b>${st.best ? `${st.best.amt} (${st.best.move})` : '—'}</b>`;
  showOverlay('ovResults', true); $('rRematch').focus();
}

/* =====================================================================
   Section 11: saving — versioned, validated, slot-based
   ===================================================================== */
const SAVE_VERSION = 4, SAVE_PREFIX = 'arena151.v4.', OLD_PREFIX = 'arena151.v3.', LEGACY_KEY = 'arena151Save';
const memStore = {};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return memStore[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { memStore[k] = v; return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { delete memStore[k]; } }
};
const SAVEABLE = () => G && ['battle', 'pick', 'over'].includes(G.phase);
function serialize() {
  return {
    app: 'arena151', v: SAVE_VERSION, savedAt: new Date().toISOString(), phase: G.phase, elapsed: Math.round(G.elapsed),
    auto: G.auto, timeLimit: G.timeLimit, overtime: G.overtime || 0, stage: STAGE_ID, winner: G.winner, decision: G.decision, picks: G.picks, stats: G.stats, log: G.log.slice(-80),
    sides: Object.fromEntries(['A', 'B'].map(S => { const sd = side(S); return [S, {
      active: sd.active, x: Math.round(sd.x), y: Math.round(sd.y), switchCd: Math.max(0, Math.round(sd.switchCd)), megaUsed: sd.megaUsed, plotUsed: sd.plotUsed,
      team: sd.team.map(m => ({ name: m.name, hp: m.hp, status: m.status, stT: Math.round(m.stT), tox: m.tox, conf: Math.round(m.conf),
        stages: m.stages, cd: m.cd.map(Math.round), dmg: m.dmg, kos: m.kos, pinchShown: m.pinchShown, mega: !!m.mega }))
    }]; }))
  };
}
function saveLabel(d) {
  const a = d.sides.A.team[d.sides.A.active], b = d.sides.B.team[d.sides.B.active], s = Math.floor(d.elapsed / 1000);
  const when = new Date(d.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const stg = STAGES[d.stage] ? STAGES[d.stage].name + ' · ' : '';
  const state = d.phase === 'over' ? (d.winner === 'draw' ? 'draw' : `${TEAM_NAME[d.winner]} won`) : 'in progress';
  return `${stg}${a.name} vs ${b.name} · ${state} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · ${when}`;
}
function writeSave(key) { if (!SAVEABLE()) return false; const ok = store.set(SAVE_PREFIX + key, JSON.stringify(serialize())); renderSlots(); return ok; }
function autosave() { writeSave('auto'); }
// Older turn-based saves (Milestone 2 and 3) are converted: HP keeps its percentage.
function migrateOld(o) {
  const map = { burn: 'brn', paralyzed: 'par', frozen: 'frz' };
  let teams, active, picks;
  if (o.namesA) { teams = { A: o.namesA.map((n, i) => ({ name: n, frac: o.teamA?.[i]?.max ? o.teamA[i].hp / o.teamA[i].max : 1, status: map[o.teamA?.[i]?.status] || '' })), B: o.namesB.map((n, i) => ({ name: n, frac: o.teamB?.[i]?.max ? o.teamB[i].hp / o.teamB[i].max : 1, status: '' })) }; active = { A: o.ia || 0, B: o.ib || 0 }; }
  else if (o.v === 3) { teams = {}; for (const S of ['A', 'B']) teams[S] = o.teams[S].map(t => { const ref = makeMon(t.name); return { name: t.name, frac: ref ? t.hp / ref.stats.hp : 1, status: t.status || '', stages: t.stages }; }); active = o.active; }
  else throw new Error('This is not an Arena 151 save.');
  const sides = {};
  for (const S of ['A', 'B']) {
    const list = teams[S].filter(t => DEX_BY_NAME[t.name]);
    sides[S] = { active: clamp(active[S] || 0, 0, Math.max(0, list.length - 1)), x: ENTRY[S].x, y: ENTRY[S].y, switchCd: 0,
      team: list.map(t => { const m = makeBattleMon(t.name); return { name: t.name, hp: Math.round(clamp(t.frac, 0, 1) * m.max), status: t.status, stages: t.stages || {}, cd: [] }; }) };
  }
  return { app: 'arena151', v: SAVE_VERSION, savedAt: new Date().toISOString(), phase: 'battle', elapsed: o.elapsed || 0, auto: false, timeLimit: 0,
    picks: { A: sides.A.team.map(t => t.name), B: sides.B.team.map(t => t.name) }, log: ['§Converted from an earlier milestone save.'], sides };
}
function validateSave(raw) {
  let d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!d || typeof d !== 'object') throw new Error('Save file is empty.');
  if (d.namesA || (d.app === 'arena151' && d.v === 3)) d = migrateOld(d);
  if (d.app !== 'arena151' || d.v !== SAVE_VERSION) throw new Error('This is not an Arena 151 save.');
  const ST = ['', 'brn', 'psn', 'tox', 'par', 'slp', 'frz'];
  for (const S of ['A', 'B']) {
    const sd = d.sides?.[S];
    if (!sd || !Array.isArray(sd.team) || sd.team.length < 1 || sd.team.length > 6) throw new Error(`Team ${TEAM_NAME[S]} is missing or the wrong size.`);
    sd.team.forEach(t => {
      if (!DEX_BY_NAME[t.name]) throw new Error(`Unknown Pokémon "${t.name}".`);
      if (!ST.includes(t.status || '')) t.status = '';
      t.stages = Object.fromEntries(Object.keys(zeroStages()).map(k => [k, clamp(Math.round(Number(t.stages?.[k]) || 0), -6, 6)]));
    });
    sd.active = clamp(Number(sd.active) || 0, 0, sd.team.length - 1);
    sd.x = Number(sd.x) || ENTRY[S].x; sd.y = Number(sd.y) || ENTRY[S].y;
  }
  if (!['battle', 'pick', 'over'].includes(d.phase)) d.phase = 'battle';
  return d;
}
async function restore(d) {
  setStage(d.stage || 'summit'); resetScene(); const my = epoch; $('titleStage').textContent = STAGE.name;
  G = newBattle(d.sides.A.team.map(t => t.name), d.sides.B.team.map(t => t.name), { auto: !!d.auto, timeLimit: d.timeLimit || 0 });
  watchMode = G.auto; syncWatchButton();
  for (const S of ['A', 'B']) {
    const src = d.sides[S], sd = side(S);
    src.team.forEach((t, i) => {
      const m = sd.team[i];
      m.hp = clamp(Math.round(Number(t.hp)), 0, m.max); m.status = m.hp > 0 ? (t.status || '') : '';
      m.stT = m.status === 'slp' || m.status === 'frz' ? clamp(Number(t.stT) || 2500, 300, 6000) : 0;
      m.tox = m.status === 'tox' ? clamp(Number(t.tox) || 1, 1, 15) : 0; m.conf = clamp(Number(t.conf) || 0, 0, 9000);
      m.stages = { ...t.stages }; m.cd = m.moves.map((_, k) => clamp(Number(t.cd?.[k]) || 0, 0, 12000));
      m.dmg = Number(t.dmg) || 0; m.kos = Number(t.kos) || 0; m.pinchShown = !!t.pinchShown;
      if (t.mega && MEGA_ABLE.has(m.name)) { m.mega = true; for (const k of ['atk', 'def', 'spa', 'spd']) m.stats[k] = Math.round(m.stats[k] * 1.22); m.stats.spe = Math.round(m.stats.spe * 1.08); }
    });
    [sd.x, sd.y] = clampWalk(src.x, src.y); sd.active = src.active; sd.switchCd = Number(src.switchCd) || 0; sd.megaUsed = !!src.megaUsed || sd.team.some(m => m.mega); sd.plotUsed = !!src.plotUsed;
    sd.state = act(S).hp > 0 ? 'idle' : 'out';
  }
  G.elapsed = Math.max(0, Number(d.elapsed) || 0); G.overtime = clamp(Number(d.overtime) || 0, 0, 6); G.winner = d.winner || null; G.decision = d.decision || '';
  if (d.stats?.A) G.stats = d.stats;
  G.log = Array.isArray(d.log) ? d.log.slice(-80) : []; G.picks = d.picks || { A: side('A').team.map(m => m.name), B: side('B').team.map(m => m.name) };
  setPickers(G.picks.A, G.picks.B); $('timeLimit').value = String(G.timeLimit);
  ['ovTitle', 'ovResults', 'ovSwitch', 'ovVs'].forEach(id => showOverlay(id, false));
  clock.paused = false; $('pausedTag').classList.remove('show'); $('bPause').textContent = 'Pause';
  trainerWalk.A = trainerWalk.B = 0; movesKey = ''; rosterKey = '';
  renderLogFromState(); logLine('Battle restored from save.', 't'); tickTimer();
  const w = !teamAlive('A') || !teamAlive('B') ? (teamAlive('A') ? 'A' : teamAlive('B') ? 'B' : 'draw') : null;
  if (d.phase === 'over' || w) { G.phase = 'over'; G.winner = G.winner || w; updateHUD(true); showResults(); return; }
  if (act('B').hp <= 0) { side('B').active = bestSwitchFor('B'); side('B').state = 'idle'; }
  updateHUD(true);
  if (act('A').hp <= 0) { G.phase = 'pick'; side('A').state = 'wait'; onNeedPick(); return; }
  G.phase = 'intro'; VFX.big('RESUME!', '#ffffff');
  try { await wait(900); guard(my); G.phase = 'battle'; G.lastDmgT = G.time; updateHUD(); } catch (e) { if (!(e instanceof Cancelled)) console.error(e); }
}
function loadKey(key) {
  const raw = store.get(SAVE_PREFIX + key); if (!raw) { toast('That slot is empty.'); return; }
  try { restore(validateSave(raw)); toast(key === 'auto' ? 'Autosave loaded.' : `Slot ${key} loaded.`); } catch (e) { toast('Save could not be loaded: ' + e.message); }
}
function renderSlots() {
  const el = $('slots'); el.innerHTML = '';
  for (const key of ['auto', '1', '2', '3']) {
    const raw = store.get(SAVE_PREFIX + key); let meta = 'Empty';
    if (raw) { try { meta = saveLabel(validateSave(raw)); } catch { meta = 'Unreadable save'; } }
    const div = document.createElement('div'); div.className = 'slot';
    div.innerHTML = `<b>${key === 'auto' ? 'Autosave' : 'Slot ' + key}</b><div class="meta">${meta}</div>`;
    const row = document.createElement('div'); row.className = 'btnrow'; row.style.justifyContent = 'flex-start';
    if (key !== 'auto') { const sb = document.createElement('button'); sb.className = 'btn'; sb.textContent = 'Save here'; sb.disabled = !SAVEABLE(); sb.onclick = () => toast(writeSave(key) ? `Saved to slot ${key}.` : 'Saved for this session only (browser storage is blocked).'); row.appendChild(sb); }
    const lb = document.createElement('button'); lb.className = 'btn'; lb.textContent = 'Load'; lb.disabled = !raw; lb.onclick = () => loadKey(key); row.appendChild(lb);
    div.appendChild(row); el.appendChild(div);
  }
  const auto = store.get(SAVE_PREFIX + 'auto'); let can = false; if (auto) { try { can = validateSave(auto).phase !== 'over'; } catch { } }
  $('tContinue').hidden = !can;
}
function exportSave() {
  if (!SAVEABLE()) { toast('Start a battle first.'); return; }
  if (window.AndroidApp) {
    const where = AndroidApp.saveFile(`arena151-save-${Math.floor(G.elapsed / 1000)}s.json`, JSON.stringify(serialize(), null, 2));
    toast(where ? `Save file written to ${where}` : 'Could not write the save file.'); return;
  }
  const blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `arena151-save-${Math.floor(G.elapsed / 1000)}s.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Save file downloaded.');
}
function importSave(file) { const r = new FileReader(); r.onload = () => { try { restore(validateSave(r.result)); toast('Save file loaded.'); } catch (e) { toast('Save could not be loaded: ' + e.message); } }; r.readAsText(file); }

/* =====================================================================
   Section 12: input, controls, main loop, boot
   ===================================================================== */
let watchMode = false;
function syncWatchButton() { $('bWatch').textContent = `Watch mode: ${watchMode ? 'on' : 'off'}`; $('bWatch').setAttribute('aria-pressed', String(watchMode)); }
function toggleWatch() { watchMode = !watchMode; if (G) { G.auto = watchMode; if (G.phase === 'pick' && watchMode) { forcePick(bestSwitchFor('A') ?? side('A').team.findIndex(m => m.hp > 0)); } } syncWatchButton(); movesKey = ''; rosterKey = ''; toast(watchMode ? 'Watch mode on: the AI battles for Red.' : 'Watch mode off: you control Red.'); }
function queueMove(i) {
  if (!G || G.phase !== 'battle' || clock.paused || G.auto) return;
  const sd = side('A'), m = act('A'); if (i >= m.moves.length) return;
  if (!tryCast('A', i)) { sd.queued = i; sd.queuedT = 600; }
}
function buildPickers() {
  for (const S of ['A', 'B']) { const root = $('pick' + S); root.innerHTML = ''; for (let i = 0; i < 6; i++) { const sel = document.createElement('select'); sel.id = `pick${S}${i}`; sel.setAttribute('aria-label', `${TEAM_NAME[S]} slot ${i + 1}`); sel.innerHTML = DEX.map(d => `<option value="${d.name}">${String(d.id).padStart(3, '0')} · ${d.name} (${d.types.join('/')})</option>`).join(''); root.appendChild(sel); } }
}
function setPickers(a, b) { a.forEach((n, i) => { if ($('pickA' + i)) $('pickA' + i).value = n; }); b.forEach((n, i) => { if ($('pickB' + i)) $('pickB' + i).value = n; }); }
const readPickers = S => Array.from({ length: 6 }, (_, i) => $(`pick${S}${i}`).value);
const randomTeam = () => DEX.map(d => d.name).sort(() => Math.random() - .5).slice(0, 6);
function randomize() { setPickers(randomTeam(), randomTeam()); }
function togglePause() { if (!G || !['battle', 'pick', 'intro'].includes(G.phase)) return; clock.paused = !clock.paused; $('pausedTag').classList.toggle('show', clock.paused); $('bPause').textContent = clock.paused ? 'Resume' : 'Pause'; rosterKey = ''; }
function toggleSpeed() { clock.speed = clock.speed === 1 ? 2 : 1; $('bSpeed').textContent = `Speed ${clock.speed}×`; }
const rematch = () => { if (G) startBattle(G.picks.A, G.picks.B, STAGE_ID); };
const openBuilder = () => { $('builder').open = true; $('builder').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); };

$('tStart').onclick = () => startBattle(readPickers('A'), readPickers('B'));
$('tRandom').onclick = () => { randomize(); startBattle(readPickers('A'), readPickers('B')); };
$('tContinue').onclick = () => loadKey('auto');
$('tTeams').onclick = openBuilder; $('rTeams').onclick = openBuilder;
$('rRematch').onclick = rematch; $('bRematch').onclick = rematch;
$('rRandom').onclick = () => { randomize(); startBattle(readPickers('A'), readPickers('B')); };
$('bNew').onclick = () => startBattle(readPickers('A'), readPickers('B'));
$('bApply').onclick = () => { startBattle(readPickers('A'), readPickers('B')); $('arena').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); };
$('bRandom').onclick = randomize;
$('bPause').onclick = togglePause; $('bSpeed').onclick = toggleSpeed; $('bWatch').onclick = toggleWatch;
$('bMega').onclick = () => { if (G && !G.auto) megaEvolve('A'); };
function toggleCam() { camLock = !camLock; $('bCam').textContent = `Camera: ${camLock ? 'fixed' : 'dynamic'}`; }
$('bCam').onclick = toggleCam;
$('stageSel').onchange = () => { const v = $('stageSel').value; if (G && G.phase === 'title' && v !== 'random') { setStage(v); crowdState.length = 0; $('titleStage').textContent = STAGE.name; } };
$('bQuick').onclick = () => toast(writeSave('1') ? 'Quick saved to slot 1.' : 'Start a battle first.');
$('bExport').onclick = exportSave;
$('bImport').onclick = () => $('importFile').click();
$('importFile').onchange = e => { if (e.target.files[0]) importSave(e.target.files[0]); e.target.value = ''; };
$('bClear').onclick = () => { ['auto', '1', '2', '3'].forEach(k => { store.del(SAVE_PREFIX + k); store.del(OLD_PREFIX + k); }); store.del(LEGACY_KEY); renderSlots(); toast('All saves cleared.'); };
const held = new Set();
const MOVE_KEYS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if (k === ' ' && introSkip) { e.preventDefault(); introSkip(); return; }
  if (MOVE_KEYS[k]) { if (G && G.phase === 'battle') e.preventDefault(); held.add(k); return; }
  if (e.shiftKey && /^digit[1-6]$/i.test(e.code)) { const i = Number(e.code.slice(-1)) - 1; if (G && G.phase === 'pick') forcePick(i); else if (G && !G.auto) requestSwitch('A', i); return; }
  if (!e.shiftKey && k >= '1' && k <= '4') { queueMove(Number(k) - 1); return; }
  if (k === 'p') togglePause();
  if (k === 'f') toggleSpeed();
  if (k === 't') toggleWatch();
  if (k === 'm' && G && !G.auto) megaEvolve('A');
  if (k === 'c') toggleCam();
  if (k === 'r' && G && G.phase === 'over') rematch();
});
document.addEventListener('keyup', e => held.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => held.clear());
window.addEventListener('resize', () => resizeScene());

function frame(now) {
  const realDt = Math.min(50, now - clock.last); clock.last = now;
  const dt = clock.paused ? 0 : realDt * clock.speed * (now < HITSTOP.until && (!window.SETTINGS || SETTINGS.hitstop) ? .12 : 1);
  clock.t += dt;
  for (let i = tasks.length - 1; i >= 0; i--) { const k = tasks[i], p = clamp((clock.t - k.start) / k.dur, 0, 1); try { if (k.fn) k.fn(p); } catch (e) { console.error(e); } if (p >= 1) { tasks.splice(i, 1); k.res(); } }
  if (G && !clock.paused) {
    // player steering
    if (G.phase === 'battle' && !G.auto) { let x = 0, y = 0; for (const k of held) { x += MOVE_KEYS[k][0]; y += MOVE_KEYS[k][1]; } if (stickVec.on && Math.hypot(stickVec.x, stickVec.y) > .22) { x = stickVec.x; y = stickVec.y; } if (x || y) { const sd = side('A'); sd.manual = { x, y }; sd.manualT = 160; } }
    let left = dt; while (left > 0) { const step = Math.min(16, left); simStep(step); left -= step; }
    autosaveT += dt; if (G.phase === 'battle' && autosaveT > 10000) { autosaveT = 0; autosave(); }
  }
  updateParts(dt);
  draw(dt);
  if (G) {
    if (G.phase !== 'title') tickTimer();
    if (G.hudDirty || now - lastHud > 250) { G.hudDirty = false; lastHud = now; updateHUD(); }
    updateCooldowns();
  }
  requestAnimationFrame(frame);
}
/* =====================================================================
   Section 13: touch / Android app mode
   Turned on inside the Android app (window.AndroidApp), with ?app=1, or on
   any touch-first device. Desktop layout is unchanged.
   ===================================================================== */
const APP = !!window.AndroidApp || /[?&]app=1/.test(location.search) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
const stickVec = { x: 0, y: 0, on: false };
let menuPausedBattle = false;
function haptic(ms) { if (!window.AndroidApp || !$('optHaptics').checked) return; try { AndroidApp.vibrate(ms); } catch (e) { } }
function openMenu() {
  if (G && G.phase === 'battle' && !clock.paused) { togglePause(); menuPausedBattle = true; }
  $('drawer').classList.add('open'); rosterKey = '';
}
function closeMenu() {
  $('drawer').classList.remove('open');
  if (menuPausedBattle && G && G.phase === 'battle' && clock.paused) togglePause();
  menuPausedBattle = false;
}
// Called by the Android activity
window.appBack = () => {
  if ($('drawer').classList.contains('open')) { closeMenu(); return 'handled'; }
  if (G && G.phase === 'battle' && !clock.paused) { togglePause(); return 'handled'; }
  return 'exit';
};
window.appPaused = () => { if (G && G.phase === 'battle' && !clock.paused) togglePause(); if (SAVEABLE()) autosave(); };
function initAppMode() {
  if (!APP) return;
  document.documentElement.classList.add('appmode');
  const vp = document.querySelector('meta[name=viewport]'); if (vp) vp.setAttribute('content', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  $('touchUI').hidden = false;
  document.querySelector('.help').textContent = 'Attacks fire as soon as they are ready: tap a move. Your Pokémon moves on its own; drag the joystick to steer and dodge. Tap a team card to switch, and MEGA when it glows.';
  $('tMovesSlot').appendChild($('moves'));
  $('tRosterSlot').appendChild($('rosterA'));
  const body = $('drawerBody'); body.appendChild(document.querySelector('.deck')); body.appendChild($('builder')); $('builder').open = true;
  $('tMenu').onclick = openMenu; $('drawerClose').onclick = closeMenu;
  $('tPause').onclick = togglePause;
  $('tMega').onclick = () => { if (G && !G.auto && megaEvolve('A')) haptic(40); };
  $('tTeams').onclick = $('rTeams').onclick = openMenu;
  for (const id of ['bApply', 'bNew', 'bRematch']) { const b = $(id), old = b.onclick; b.onclick = e => { closeMenu(); old && old(e); }; }
  try { $('optHaptics').checked = store.get('arena151.haptics') !== '0'; } catch (e) { }
  $('optHaptics').onchange = () => store.set('arena151.haptics', $('optHaptics').checked ? '1' : '0');
  // joystick: drag inside the ring; the knob follows the thumb up to the rim
  const stick = $('stick'), knob = $('knob'); let pid = null;
  const setKnob = (x, y) => { knob.style.transform = `translate(${x}px,${y}px)`; };
  const move = e => {
    const r = stick.getBoundingClientRect(), R = r.width / 2, dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R), d = Math.hypot(dx, dy), k = d > R * .78 ? R * .78 / d : 1;
    setKnob(dx * k, dy * k); stickVec.x = dx * k / (R * .78); stickVec.y = dy * k / (R * .78);
  };
  stick.addEventListener('pointerdown', e => { pid = e.pointerId; stick.setPointerCapture(pid); stickVec.on = true; move(e); e.preventDefault(); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === pid) move(e); });
  const end = e => { if (e.pointerId !== pid) return; pid = null; stickVec.on = false; stickVec.x = stickVec.y = 0; setKnob(0, 0); };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
  // stop long-press menus and double-tap zoom on the game surface
  document.addEventListener('contextmenu', e => { if (e.target.closest('.arena,.touch-ui')) e.preventDefault(); });
  // haptics on big moments
  const wrap = (k, fn) => { const o = VFX[k]; VFX[k] = function () { const r = o.apply(this, arguments); fn.apply(this, arguments); return r; }; };
  wrap('hit', (S, mv, dmg, eff, crit) => { if (S === 'A' && (crit || eff > 1)) haptic(crit ? 45 : 25); });
  wrap('faint', () => haptic(90)); wrap('megaDone', () => haptic(60)); wrap('plotArmor', () => haptic(120));
  requestAnimationFrame(() => resizeScene());
}

function boot() {
  initAppMode();
  setStage('cavern'); $('titleStage').textContent = STAGE.name;
  buildPickers(); setPickers(DEFAULT_A, DEFAULT_B); drawWave(); drawMinis(); resizeScene(); syncWatchButton();
  const legacy = store.get(LEGACY_KEY) || store.get(OLD_PREFIX + 'auto');
  if (legacy && !store.get(SAVE_PREFIX + 'auto')) { try { store.set(SAVE_PREFIX + 'auto', JSON.stringify(validateSave(legacy))); } catch { } }
  renderSlots();
  G = newBattle(DEFAULT_A, DEFAULT_B); G.phase = 'title'; trainerWalk.A = trainerWalk.B = 0;
  for (const S of ['A', 'B']) { const sd = side(S); sd.state = 'idle'; sd.x = S === 'A' ? 330 : 670; sd.y = S === 'A' ? 330 : 250; sd.face = S === 'A' ? 1 : -1; }
  updateHUD(true);
  loadCustomPack();
  requestAnimationFrame(t => { clock.last = t; frame(t); });
}
const fontsReady = document.fonts ? Promise.all([document.fonts.load('40px "Lilita One"'), document.fonts.load('700 16px Rubik')]).then(() => document.fonts.ready) : Promise.resolve();
Promise.race([fontsReady, new Promise(r => setTimeout(r, 2000))]).then(boot);
