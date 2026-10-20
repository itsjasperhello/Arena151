/* Runs inside each room's sandbox, after data.js, arenas.js and sim.js.
   Records effects for the phones, builds state snapshots and applies player input. */
let __events = [], __needPick = false, __ended = null, __id = 0;
// Effects: the server records them (with plain data instead of object references) for the phones to play.
const VFX = new Proxy({}, { get: (_, name) => (...args) => { __events.push([name, ...args.map(a => __enc(a, 0))]); } });
function onLog(text, cls) { __events.push(['__log', text, cls || '']); }
function onNeedPick() { __needPick = true; }
function onBattleEnd(w, big) { __ended = { winner: w, big: big || '', reason: G.decision || '' }; }
const clock = { t: 0, paused: false };

// Plain-data copy: moves become {__mv: name}; back-references to Pokémon ('u') and functions are dropped.
function __enc(v, d) {
  if (v === null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
  if (v.name && MOVES[v.name] === v) return { __mv: v.name };
  if (d > 5) return null;
  if (Array.isArray(v)) return v.map(x => __enc(x, d + 1));
  const o = {}; for (const k in v) { if (k === 'u') continue; const e = __enc(v[k], d + 1); if (e !== undefined) o[k] = e; } return o;
}
function __init(teamA, teamB, names, arena, timeLimit) {
  TEAM_NAME.A = names.A; TEAM_NAME.B = names.B;
  const id = setArena(arena);
  G = newBattle(teamA, teamB, { auto: false, timeLimit: timeLimit || 0 }); G.human = { A: true, B: true }; G.phase = 'intro';
  G.staleMs = 90000;          // two people need longer than the AI to find each other; a warning shows 10 s before
  __events = []; __needPick = false; __ended = null;
  return id;
}
function __tagIds() { for (const arr of [G.shots, G.beams, G.marks, G.waves]) for (const o of arr) if (!o.id) o.id = ++__id; }
function __step(dt) { clock.t += dt; simStep(dt); __tagIds(); }
function __spawn(S) { spawnIn(S, side(S).active || 0); __tagIds(); }
function __startBattle() { G.phase = 'battle'; G.lastDmgT = G.time; }
function __takeEvents() { const e = __events; __events = []; return e; }
function __snapshot(full) {          // full: every Pokémon (keyframes); otherwise only the active ones are copied
  const sides = {}, teams = {};
  for (const S of ['A', 'B']) {
    const sd = G.sides[S], o = {}; for (const k in sd) if (k !== 'team') o[k] = __enc(sd[k], 1); sides[S] = o;
    teams[S] = sd.team.map((m, i) => (full !== false || i === sd.active) ? __enc(m, 1) : null);
  }
  return { ph: G.phase, time: G.time, el: G.elapsed, ot: G.overtime || 0, lastDmgT: G.lastDmgT, sides, teams,
    shots: __enc(G.shots, 0), beams: __enc(G.beams, 0), marks: __enc(G.marks, 0), waves: __enc(G.waves, 0) };
}
// Player input (server-side coordinates already).
function __input(S, m) {
  if (!G) return;
  const sd = side(S);
  if (m.t === 'in') { if (m.off) { sd.manualT = 0; } else { const x = +m.x || 0, y = +m.y || 0, l = Math.hypot(x, y); if (l > 0) { sd.manual = { x: x / Math.max(1, l), y: y / Math.max(1, l) }; sd.manualT = 220; } } return; }
  if (G.phase === 'battle') {
    if (m.t === 'mv') { const mon = act(S), i = m.i | 0; if (i >= 0 && i < mon.moves.length && !tryCast(S, i)) { sd.queued = i; sd.queuedT = 600; } }
    else if (m.t === 'sw') requestSwitch(S, m.i | 0);
    else if (m.t === 'mega') { if (canMega(S)) megaEvolve(S); }
  }
  if (m.t === 'pick') __pick(S, m.i | 0);
}
function __waiting() { return ['A', 'B'].filter(S => side(S).state === 'wait'); }
function __pick(S, i) {
  const sd = side(S); if (G.phase !== 'pick' || sd.state !== 'wait') return false;
  if (!sd.team[i] || sd.team[i].hp <= 0) i = bestSwitchFor(S);
  spawnIn(S, i); __tagIds();
  if (!__waiting().length) { G.phase = 'battle'; __needPick = false; }
  return true;
}
function __autoPick(S) { return __pick(S, bestSwitchFor(S)); }
function __state() { return { phase: G ? G.phase : 'none', waiting: G ? __waiting() : [], ended: __ended }; }
function __forfeit(loser) { if (G && G.phase !== 'over') { G.decision = 'Opponent disconnected.'; endBattle(other(loser), 'FORFEIT'); } }
function __validTeam(t) { return Array.isArray(t) && t.length === 6 && t.every(n => DEX.some(d => d.name === n)); }
