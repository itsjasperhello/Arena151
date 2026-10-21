/* =====================================================================
   ARENA 151 — battle worker
   Each worker thread runs many battles. Every battle has its own
   sandbox with the game's simulation. The worker sends finished
   messages (snapshots, countdowns, results) to the main thread, which
   only moves them to the right phone.
   Snapshots are self-correcting: every one carries the active Pokémon
   in full, and every second a keyframe carries both whole teams, so a
   skipped or late message never leaves a phone wrong for long.
   ===================================================================== */
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WW = 1000, TICK = 16, SNAP_EVERY = 50, KEYFRAME_EVERY = 1000;
const PICK_TIMEOUT = 15000, CUE_TIMEOUT = 6000, READY_TIMEOUT = 15000, COUNTDOWN_MS = 2150;
const TEST = !!process.env.ARENA_TEST;
const CODE = ['data.js', 'fxdata.js', 'arenas.js', 'sim.js', 'glue.js'].map(f => fs.readFileSync(path.join(__dirname, 'game', f), 'utf8')).join('\n;\n');
const SCRIPT = new vm.Script(CODE, { filename: 'arena151-game.js' });
const rooms = new Map();
const mono = () => performance.now();                       // monotonic: the system clock may jump, this never does
const stamp = () => Math.round(performance.timeOrigin + performance.now());   // steady time stamp for the phones' smoothing
const HANG_MS = 400;                                          // no match's code may run longer than this in one go
// Every match runs inside one time-limited call per tick: if any match's code ever gets stuck (even an endless
// loop), V8 stops it after HANG_MS, that match is ended cleanly, and every other match keeps running.
const DRIVER = vm.createContext({ list: [], cur: { i: -1 }, start: 0, job: null });
const RUN_ALL = new vm.Script('for (cur.i = start; cur.i < list.length; cur.i++) list[cur.i](); cur.i = -1;');
const RUN_ONE = new vm.Script('job(); job = null;');
function guarded(room, fn, what) {                            // run one piece of match code under the time limit
  if (room.broken) return;
  DRIVER.job = fn;
  try { RUN_ONE.runInContext(DRIVER, { timeout: HANG_MS }); }
  catch (e) { DRIVER.job = null; if (/timed out/i.test(e.message)) breakRoom(room, `${what} ran for over ${HANG_MS} ms`); else logErr(room, what, e); }
}
function breakRoom(room, why) {
  if (room.broken) return; room.broken = true;
  const hp = room.lastHp || { A: 0, B: 0 }, winner = hp.A === hp.B ? 'draw' : hp.A > hp.B ? 'A' : 'B';
  note('log', { text: `room ${room.code}: MATCH STOPPED — ${why}. Ended and decided by remaining HP (${hp.A} vs ${hp.B}). Incident report: ${JSON.stringify({ arena: room.arenaId, lastState: room.lastInfo, recentInputs: room.diag })}` });
  room.over = true; room.ctx = null;                          // nothing in this match runs again
  note('ended', { code: room.code, winner, big: 'MATCH ENDED', reason: 'This match hit a server problem and was decided by remaining HP.' });
}
let outbox = [];                                              // [code, side or '*', message string] — flushed once per tick
const post = (code, S, obj) => outbox.push([code, S, typeof obj === 'string' ? obj : JSON.stringify(obj)]);
const note = (kind, data) => parentPort.postMessage({ ev: kind, ...data });
const errSeen = new Map();
function logErr(room, kind, e) {
  const k = room.code + kind, now = mono(); if (now - (errSeen.get(k) || 0) < 10000) return; errSeen.set(k, now);
  note('log', { text: `room ${room.code}: ${kind} error — ${(e && e.stack) || e}` });
}

/* ---------- mirroring the guest's view ---------- */
const swapSide = s => (s === 'A' ? 'B' : s === 'B' ? 'A' : s);
function mirror(v, key, inManual) {
  if (Array.isArray(v)) return v.map(x => mirror(x, key, inManual));
  if (v && typeof v === 'object') { if (v.__mv) return v; const o = {}; for (const k in v) o[k] = mirror(v[k], k, inManual || k === 'manual'); return o; }
  if (typeof v === 'number') {
    if (key === 'x') return inManual ? -v : WW - v;
    if (key === 'vx' || key === 'kbx' || key === 'face') return -v;
    if (key === 'ang') return Math.PI - v;
  }
  if (typeof v === 'string' && (key === 'owner' || key === 'S')) return swapSide(v);
  return v;
}
const POS_EVENTS = new Set(['erupt', 'explode', 'impactAt', 'missAt']);
function mirrorEvent(ev) {
  const [name, ...args] = ev;
  if (name === '__log') return ev;
  if (name === 'markFire') return [name, mirror(args[0])];
  return [name, ...args.map((a, i) => (POS_EVENTS.has(name) && i === 0 && typeof a === 'number') ? WW - a : (a === 'A' || a === 'B') ? swapSide(a) : a)];
}

/* ---------- battles ---------- */
function start(m) {
  let room = rooms.get(m.code);
  if (!room) { room = { code: m.code }; rooms.set(m.code, room); }
  const ctx = vm.createContext({ console, Math, JSON, Date });
  SCRIPT.runInContext(ctx);
  Object.assign(room, { ctx, state: 'intro', ready: {}, cues: {}, snapAt: 0, keyAt: 0, needKey: { A: true, B: true }, pend: { A: [], B: [] },
    pickSince: {}, hold: null, over: false, seq: 0, introToken: (room.introToken || 0) + 1, closed: false, broken: false, diag: [], lastHp: null, lastInfo: null });
  guarded(room, () => { room.arenaId = ctx.__init(m.teamA, m.teamB, m.names, m.arena, m.timeLimit); }, 'match setup');
  if (room.broken) return;
  note('started', { code: m.code, arenaId: room.arenaId });
  runIntro(room, room.introToken).catch(e => logErr(room, 'intro', e));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(room, tok, test, timeout) { const t0 = mono(); while (!test() && mono() - t0 < timeout && live(room, tok)) await sleep(40); }
const live = (room, tok) => rooms.get(room.code) === room && !room.closed && !room.broken && room.introToken === tok;
async function runIntro(room, tok) {
  await waitFor(room, tok, () => room.ready.A && room.ready.B, READY_TIMEOUT);
  for (const S of ['A', 'B']) {                                // Red's side (host) first, then the guest
    if (!live(room, tok)) return;
    guarded(room, () => room.ctx.__spawn(S), 'send-out'); room.cues[S] = {};
    await waitFor(room, tok, () => room.cues[S].A && room.cues[S].B, CUE_TIMEOUT);   // both phones finished the send-out sound and cry
  }
  if (!live(room, tok)) return;
  post(room.code, '*', { t: 'countdown' });
  await sleep(COUNTDOWN_MS);
  if (!live(room, tok)) return;
  guarded(room, () => room.ctx.__startBattle(), 'battle start'); room.state = 'battle';
}
function tick(room, now, dt) {
  const ctx = room.ctx;
  if (!room.hold) {
    let left = dt; while (left > 0) {
      const step = Math.min(TICK, left); left -= step;
      try { if (TEST && room.throwUntil > now) throw new Error('test error in battle step'); if (TEST && room.hangNow) for (;;) { } ctx.__step(step); } catch (e) { if (/timed out/i.test(e && e.message)) throw e; logErr(room, 'battle step', e); }
    }
  } else for (const S of ['A', 'B']) if (room.pickSince[S]) room.pickSince[S] += dt;   // pick timers wait while a player reconnects
  let st; try { st = ctx.__state(); } catch (e) { if (/timed out/i.test(e && e.message)) throw e; logErr(room, 'state', e); return; }
  for (const S of ['A', 'B']) {
    if (st.waiting.includes(S)) { room.pickSince[S] = room.pickSince[S] || now; if (!room.hold && now - room.pickSince[S] > PICK_TIMEOUT) { try { ctx.__autoPick(S); } catch (e) { logErr(room, 'auto pick', e); } room.pickSince[S] = 0; } }
    else room.pickSince[S] = 0;
  }
  if (room.lastSnapAt && now - room.lastSnapAt > 1000 && room.snapAt < SNAP_EVERY) {         // self-check: never silent for long
    if (now - (room.healLogged || 0) > 30000) { room.healLogged = now; note('log', { text: `room ${room.code}: no update for ${Math.round((now - room.lastSnapAt) / 100) / 10}s (timer ${Math.round(room.snapAt)}) — sending a full update now` }); }
    room.snapAt = SNAP_EVERY; room.needKey.A = room.needKey.B = true;
  }
  if ((room.snapAt += dt) >= SNAP_EVERY) {
    room.snapAt = 0; room.lastSnapAt = now;
    const key = (room.keyAt += SNAP_EVERY) >= KEYFRAME_EVERY; if (key) room.keyAt = 0;
    try { snapshot(room, now, key); } catch (e) { if (/timed out/i.test(e && e.message)) throw e; logErr(room, 'snapshot', e); }
  }
  if (st.ended && !room.over) {
    room.over = true; room.state = 'over';
    note('ended', { code: room.code, winner: st.ended.winner, big: st.ended.big, reason: st.ended.reason });
  }
}
function snapshot(room, now, key) {
  const ctx = room.ctx, anyFull = key || room.needKey.A || room.needKey.B, snap = ctx.__snapshot(anyFull), ev = ctx.__takeEvents();
  room.seq++;
  room.lastHp = { A: snap.sides.A && snap.teams.A ? sumHp(room, 'A') : 0, B: sumHp(room, 'B') };
  room.lastInfo = { t: Math.round(snap.el / 100) / 10, ph: snap.ph, A: info(snap, 'A'), B: info(snap, 'B'),
    inFlight: [...snap.shots, ...snap.beams, ...snap.marks, ...snap.waves].map(o => (o.mv && o.mv.__mv) || o.kind || '?') };
  snap.pickLeft = { A: room.pickSince.A ? Math.max(0, PICK_TIMEOUT - (now - room.pickSince.A)) : 0, B: room.pickSince.B ? Math.max(0, PICK_TIMEOUT - (now - room.pickSince.B)) : 0 };
  snap.hold = room.hold ? { side: room.hold.side, left: Math.max(0, room.hold.until - now) } : null;
  for (const S of ['A', 'B']) {
    const view = S === 'A' ? snap : mirrorView(snap), evs = S === 'A' ? ev : ev.map(mirrorEvent);
    const pend = room.pend[S]; pend.push(...evs); if (pend.length > 300) pend.splice(0, pend.length - 300);
    if (TEST && room.muteSide === S && now < room.muteUntil) continue;          // test hook: this phone gets nothing for a while
    const full = key || room.needKey[S]; room.needKey[S] = false;
    const tm = { A: {}, B: {} };
    for (const T of ['A', 'B']) view.teams[T].forEach((mon, i) => { if (mon && (full || i === view.sides[T].active)) tm[T][i] = mon; });
    const { teams, ...rest } = view;
    post(room.code, S, { t: 'snap', s: { ...rest, tm, key: full, seq: room.seq, sw: stamp() }, ev: pend.splice(0, pend.length) });
  }
}
function sumHp(room, S) { try { return room.ctx.__teamHp(S); } catch (e) { return 0; } }
function info(snap, S) { const sd = snap.sides[S] || {}; return { mon: (snap.teams[S][sd.active] || {}).name, state: sd.state, cast: sd.cast && sd.cast.mv && sd.cast.mv.__mv, x: Math.round(sd.x), y: Math.round(sd.y) }; }
function mirrorView(s) {
  const m = { ...s, sides: { A: mirror(s.sides.B), B: mirror(s.sides.A) }, teams: { A: s.teams.B, B: s.teams.A },
    shots: mirror(s.shots), beams: mirror(s.beams), marks: mirror(s.marks), waves: mirror(s.waves),
    pickLeft: s.pickLeft ? { A: s.pickLeft.B, B: s.pickLeft.A } : null };
  if (s.hold) m.hold = { side: swapSide(s.hold.side), left: s.hold.left };
  return m;
}

/* ---------- commands from the main thread ---------- */
parentPort.on('message', m => {
  if (m.cmd === 'start') return start(m);
  if (TEST && m.cmd === 'dbgFreeze') { const t = mono(); while (mono() - t < (m.ms || 10000)) { } return; }   // test: block this whole worker
  const room = rooms.get(m.code); if (!room) return;
  if (m.cmd === 'close') { room.closed = true; rooms.delete(m.code); return; }
  if (!room.ctx || room.broken) return;
  if (m.cmd === 'input' || m.cmd === 'hold' || m.cmd === 'forfeit') { room.diag.push([Math.round(((room.lastInfo && room.lastInfo.t) || 0) * 10) / 10, m.S || '', m.cmd === 'input' ? m.msg.t + (m.msg.i != null ? ':' + m.msg.i : '') : m.cmd]); if (room.diag.length > 30) room.diag.shift(); }
  guarded(room, () => {
    switch (m.cmd) {
      case 'ready': room.ready[m.S] = true; break;
      case 'cue': if (room.cues[m.srv]) room.cues[m.srv][m.S] = true; break;
      case 'input': { const msg = { ...m.msg }; if (m.S === 'B' && msg.t === 'in') msg.x = -(+msg.x || 0); room.ctx.__input(m.S, msg); break; }
      case 'hold': room.hold = m.side ? { side: m.side, until: mono() + (m.left || 0) } : null; break;
      case 'resync': room.needKey[m.S] = true; room.pend[m.S] = []; break;     // next snapshot to this phone is complete
      case 'forfeit': if (!room.over) room.ctx.__forfeit(m.loser); break;
      case 'dbgThrow': if (TEST) room.throwUntil = mono() + (m.ms || 3000); break;
      case 'dbgMute': if (TEST) { room.muteSide = m.S; room.muteUntil = mono() + (m.ms || 10000); } break;
      case 'dbgWin': if (TEST && !room.over) room.ctx.__forfeit(swapSide(m.S)); break;
      case 'dbgHang': if (TEST) room.hangNow = true; break;
    }
  }, 'command ' + m.cmd);
});

/* ---------- the loop ---------- */
let last = mono(), tickMs = [], lastStats = mono(), lastBeat = 0;
setInterval(() => {
  const now = mono(), dt = Math.max(0, Math.min(100, now - last)); last = now;
  const t0 = performance.now();
  const list = []; for (const room of rooms.values()) if (room.ctx && !room.closed && !room.broken) list.push(room);
  DRIVER.list = list.map(room => () => { try { tick(room, now, dt); } catch (e) { if (/timed out/i.test(e && e.message)) throw e; logErr(room, 'tick', e); } });
  DRIVER.start = 0;
  while (DRIVER.start < list.length) {
    try { RUN_ALL.runInContext(DRIVER, { timeout: HANG_MS }); break; }
    catch (e) {
      const i = DRIVER.cur.i;
      if (/timed out/i.test(e.message) && i >= 0 && list[i]) breakRoom(list[i], `its battle code ran for over ${HANG_MS} ms`);
      else note('log', { text: 'worker tick error ' + ((e && e.stack) || e) });
      DRIVER.start = (i >= 0 ? i : list.length) + 1;          // carry on with the rest of this tick's matches
    }
  }
  DRIVER.list = [];
  if (outbox.length) { parentPort.postMessage({ ev: 'out', batch: outbox }); outbox = []; }
  tickMs.push(performance.now() - t0);
  if (now - lastBeat >= 500) { lastBeat = now; const hp = {}; for (const r of rooms.values()) if (r.lastHp) hp[r.code] = r.lastHp; parentPort.postMessage({ ev: 'beat', hp }); }
  if (now - lastStats > 5000) {
    lastStats = now; const s = tickMs.slice().sort((a, b) => a - b);
    note('stats', { id: workerData.id, rooms: rooms.size, avgTickMs: +(s.reduce((a, b) => a + b, 0) / (s.length || 1)).toFixed(2), p99TickMs: +(s[Math.floor(s.length * .99)] || 0).toFixed(2) });
    tickMs = [];
  }
}, TICK);
