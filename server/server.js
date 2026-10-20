/* =====================================================================
   ARENA 151 — online battle server (server-authoritative)
   Every battle runs here, in its own sandbox using the game's own
   simulation (game/data.js + game/sim.js). Phones send input and draw
   the snapshots this server streams 20 times a second.
   Each player always sees themselves as Red on the left: the guest's
   view is mirrored here before it is sent.
   ===================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8151;
const VERSION = fs.readFileSync(path.join(__dirname, 'game', 'VERSION'), 'utf8').trim();
const WW = 1000;                 // arena width in world units (positions are mirrored around this)
const TICK = 16, SNAP_EVERY = 50, PICK_TIMEOUT = 15000, CUE_TIMEOUT = 6000, READY_TIMEOUT = 15000;
const GRACE = 20000;                         // a dropped player has this long to reconnect before forfeiting
const MAX_BUFFER = 128 * 1024;               // stop queueing snapshots for a phone that is not keeping up
const crypto = require('crypto');
const CODE = ['data.js', 'fxdata.js', 'arenas.js', 'sim.js', 'glue.js'].map(f => fs.readFileSync(path.join(__dirname, 'game', f), 'utf8')).join('\n;\n');
const SCRIPT = new vm.Script(CODE, { filename: 'arena151-game.js' });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const CHECK = vm.createContext({ console, Math, JSON, Date }); SCRIPT.runInContext(CHECK);      // used to validate team names
const validTeam = t => CHECK.__validTeam(t);

/* ---------- mirroring the guest's view ---------- */
const swapSide = s => (s === 'A' ? 'B' : s === 'B' ? 'A' : s);
function mirror(v, key, inManual) {
  if (Array.isArray(v)) return v.map(x => mirror(x, key, inManual));
  if (v && typeof v === 'object') {
    if (v.__mv) return v;
    const o = {}; for (const k in v) o[k] = mirror(v[k], k, inManual || k === 'manual'); return o;
  }
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
function mirrorSnap(s) {
  return { ...s, sides: { A: mirror(s.sides.B), B: mirror(s.sides.A) }, teams: { A: s.teams.B, B: s.teams.A }, pickLeft: s.pickLeft ? { A: s.pickLeft.B, B: s.pickLeft.A } : null,
    shots: mirror(s.shots), beams: mirror(s.beams), marks: mirror(s.marks), waves: mirror(s.waves) };
}

/* ---------- rooms ---------- */
const rooms = new Map();
const tours = new Map();                     // tournaments by code (their matches live in rooms)
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join(''); } while (rooms.has(c) || tours.has(c)); return c; };
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const sideOf = (room, ws) => (room.players.A === ws ? 'A' : room.players.B === ws ? 'B' : null);
const fromSide = (S, server) => (S === 'A' ? server : swapSide(server));   // a client's "A" is the host's A and the guest's B

function startRoom(room) {
  const ctx = vm.createContext({ console, Math, JSON, Date });
  SCRIPT.runInContext(ctx); room.ctx = ctx;
  room.arenaId = ctx.__init(room.info.A.team, room.info.B.team, { A: room.info.A.trainer, B: room.info.B.trainer }, room.arena, room.timeLimit);
  room.state = 'intro'; room.seen = { A: {}, B: {} }; room.pendingEv = { A: [], B: [] }; room.away = {}; room.tokens = room.tokens || { A: crypto.randomUUID(), B: crypto.randomUUID() }; room.ready = {}; room.cues = {}; room.snapAt = 0; room.pickSince = {}; room.over = false; room.rematch = {};
  for (const S of ['A', 'B']) {
    const me = room.info[S], opp = room.info[swapSide(S)];
    room.startMsg = room.startMsg || {}; room.startMsg[S] = { arena: room.arenaId, timeLimit: room.timeLimit, me, opp, role: S === 'A' ? 'host' : 'guest', code: room.code, token: room.tokens[S] };
    send(room.players[S], { t: 'start', ...room.startMsg[S] });
  }
  log(`room ${room.code}: battle on ${room.arenaId} — ${room.info.A.trainer} vs ${room.info.B.trainer}`);
  runIntro(room).catch(e => log('intro error', e));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(room, test, timeout) { const t0 = Date.now(); while (!test() && Date.now() - t0 < timeout && rooms.get(room.code) === room && !room.closed) await sleep(40); }
async function runIntro(room) {
  await waitFor(room, () => room.ready.A && room.ready.B, READY_TIMEOUT);
  for (const S of ['A', 'B']) {                                // Red's side (host) first, then the guest
    if (room.closed) return;
    room.ctx.__spawn(S); room.cues[S] = {};
    await waitFor(room, () => room.cues[S].A && room.cues[S].B, CUE_TIMEOUT);   // both phones finished the send-out sound and cry
  }
  if (room.closed) return;
  for (const S of ['A', 'B']) send(room.players[S], { t: 'countdown' });
  await sleep(2150);
  if (room.closed) return;
  room.ctx.__startBattle(); room.state = 'battle';
}
function closeRoom(room, why) { room.closed = true; rooms.delete(room.code); log(`room ${room.code} closed: ${why}`); }

// Team data changes rarely (except cooldowns), so each player only gets the Pokémon that changed since their last snapshot.
function sendSnap(room, S, snap, ev) {
  const ws = room.players[S], pend = room.pendingEv[S];
  pend.push(...ev); if (pend.length > 400) pend.splice(0, pend.length - 400);
  if (!ws || ws.readyState !== 1 || ws.bufferedAmount > MAX_BUFFER) return;   // phone is behind or away: its events wait for the next snapshot
  ev = pend.splice(0, pend.length);
  const seen = room.seen[S], tm = { A: {}, B: {} };
  for (const T of ['A', 'B']) snap.teams[T].forEach((mon, i) => { const j = JSON.stringify(mon), key = T + i; if (seen[key] !== j) { seen[key] = j; tm[T][i] = mon; } });
  const { teams, ...rest } = snap;
  ws.send(JSON.stringify({ t: 'snap', s: { ...rest, tm, sw: Date.now() }, ev }));
}
/* ---------- the loop: simulate, then stream snapshots ---------- */
function tickRoom(room, now, dt) {
    const ctx = room.ctx, awayS = ['A', 'B'].find(S => room.away[S]);
    if (awayS) {                                                  // someone dropped: hold the battle while they reconnect
      const expired = ['A', 'B'].filter(S => room.away[S] && now - room.away[S] > GRACE);
      if (expired.length) {
        if (room.away.A && room.away.B) { if (room.tour) matchFinished(room, null); closeRoom(room, 'both players gone'); return; }
        const gone = expired[0]; log(`room ${room.code}: ${gone} did not come back`); try { ctx.__forfeit(gone); } catch (e) { }
        const other = room.players[swapSide(gone)]; send(other, { t: 'opponentLeft' }); if (other) other.room = null; if (room.tour) matchFinished(room, swapSide(gone)); closeRoom(room, 'reconnect timed out'); return;
      }
      for (const S of ['A', 'B']) if (room.pickSince[S]) room.pickSince[S] += dt;   // pick timers wait too
    } else {
      let left = dt; while (left > 0) { const step = Math.min(TICK, left); ctx.__step(step); left -= step; }
    }
    const st = ctx.__state();
    // pick phase: each waiting player has a time limit, then the best replacement is sent automatically
    for (const S of ['A', 'B']) {
      if (st.waiting.includes(S)) { room.pickSince[S] = room.pickSince[S] || now; if (!awayS && now - room.pickSince[S] > PICK_TIMEOUT) { ctx.__autoPick(S); room.pickSince[S] = 0; } }
      else room.pickSince[S] = 0;
    }
    if ((room.snapAt += dt) >= SNAP_EVERY) {
      room.snapAt = 0;
      const snap = ctx.__snapshot(), ev = ctx.__takeEvents();
      snap.pickLeft = { A: room.pickSince.A ? Math.max(0, PICK_TIMEOUT - (now - room.pickSince.A)) : 0, B: room.pickSince.B ? Math.max(0, PICK_TIMEOUT - (now - room.pickSince.B)) : 0 };
      snap.hold = awayS ? { side: awayS, left: Math.max(0, GRACE - (now - room.away[awayS])) } : null;
      sendSnap(room, 'A', snap, ev);
      const m = mirrorSnap(snap); if (m.hold) m.hold = { side: swapSide(m.hold.side), left: m.hold.left };
      sendSnap(room, 'B', m, ev.map(mirrorEvent));
    }
    if (st.ended && !room.over) {
      room.over = true; room.state = 'over';
      for (const S of ['A', 'B']) send(room.players[S], { t: 'over', winner: st.ended.winner === 'draw' ? 'draw' : (st.ended.winner === S ? 'A' : 'B'), big: st.ended.big, reason: st.ended.reason });
      log(`room ${room.code}: winner ${st.ended.winner}`);
      if (room.tour) matchFinished(room, st.ended.winner);
    }
}
let last = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(100, now - last); last = now;
  for (const room of rooms.values()) {
    if (!room.ctx || room.closed) continue;
    try { tickRoom(room, now, dt); } catch (e) { if (!room.errLogged) { room.errLogged = true; log(`room ${room.code} tick error`, e); } }
  }
}, TICK);

/* ---------- connections ---------- */
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, game: 'Arena 151', version: VERSION, rooms: rooms.size, players: wss.clients.size }));
  } else { res.writeHead(404); res.end(); }
});
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024, perMessageDeflate: { threshold: 256 } });
wss.on('connection', (ws, req) => {
  ws.room = null; ws.isAlive = true; ws.on('pong', () => (ws.isAlive = true));
  log('connect', req.socket.remoteAddress);
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    try { handle(ws, m); } catch (e) { log('message error', e); }
  });
  ws.on('close', () => { leave(ws, false); tourDisconnect(ws); });
});
function handle(ws, m) {
    const room = ws.room;
    switch (m.t) {
      case 'hello':
        if (m.v !== VERSION) send(ws, { t: 'error', msg: `Version mismatch: your app is v${m.v}, the server is v${VERSION}. Update both to the same version.` });
        else send(ws, { t: 'hi', v: VERSION });
        break;
      case 'thost': tourHost(ws, m); break;
      case 'tstart': tourStart(ws); break;
      case 'tleave': tourLeave(ws); break;
      case 'tresume': tourResume(ws, m); break;
      case 'dbgWin': if (process.env.ARENA_TEST && room && room.ctx && !room.over) { const S = sideOf(room, ws); room.ctx.__forfeit(swapSide(S)); } break;
      case 'host': {
        if (ws.tour) tourLeave(ws);
        if (room) leave(ws);
        const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
        const code = newCode(), r = { code, players: { A: ws, B: null }, info: { A: info, B: null }, arena: String(m.arena || 'random'), timeLimit: +m.timeLimit || 0, state: 'lobby' };
        rooms.set(code, r); ws.room = r; send(ws, { t: 'hosted', code }); log(`room ${code} hosted by ${info.trainer}`);
        break;
      }
      case 'join': {
        if (room) leave(ws);
        const jc = String(m.code || '').toUpperCase().trim();
        if (tours.has(jc)) { tourJoin(ws, tours.get(jc), m); break; }
        const r = rooms.get(jc);
        if (!r) return send(ws, { t: 'error', msg: 'No game with that code. Check the code with the host.' });
        if (r.players.B) return send(ws, { t: 'error', msg: 'That game is already full.' });
        const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
        r.players.B = ws; r.info.B = info; ws.room = r; send(ws, { t: 'joined', code: r.code });
        startRoom(r);
        break;
      }
      case 'ready': if (room) room.ready[sideOf(room, ws)] = true; break;
      case 'cue': if (room && room.cues) { const S = sideOf(room, ws), srv = fromSide(S, m.s); if (room.cues[srv]) room.cues[srv][S] = true; } break;
      case 'in': case 'mv': case 'sw': case 'mega': case 'pick':
        if (room && room.ctx) { const S = sideOf(room, ws); if (!S) return; const msg = { ...m }; if (S === 'B' && m.t === 'in') msg.x = -(+m.x || 0); try { room.ctx.__input(S, msg); } catch (e) { log('input error', e); } }
        break;
      case 'rematch':
        if (room && room.over && !room.tour) { room.rematch[sideOf(room, ws)] = true; const other = room.players[swapSide(sideOf(room, ws))]; send(other, { t: 'rematchAsked' }); if (room.rematch.A && room.rematch.B) startRoom(room); }
        break;
      case 'leave': leave(ws, true); break;
      case 'ping': send(ws, { t: 'pong', c: m.c }); break;
      case 'resume': {
        const r = rooms.get(String(m.code || '').toUpperCase()); const S = r && r.tokens && ['A', 'B'].find(k => r.tokens[k] === m.token);
        if (!r || !S || r.closed) return send(ws, { t: 'resumeFailed' });
        const old = r.players[S]; if (old && old !== ws) { old.room = null; try { old.terminate(); } catch (e) { } }
        r.players[S] = ws; ws.room = r; delete r.away[S]; r.seen[S] = {};
        send(ws, { t: 'resumed', ...r.startMsg[S], phase: r.state }); send(r.players[swapSide(S)], { t: 'oppBack' });
        log(`room ${r.code}: ${S} reconnected`);
        break;
      }
    }
}
function cleanInfo(m) {
  const team = Array.isArray(m.team) ? m.team.slice(0, 6).map(String) : [];
  if (!validTeam(team)) return null;
  return { trainer: String(m.name || m.trainer || 'Trainer').slice(0, 24), trainerFile: String(m.trainerFile || '').slice(0, 40), team };
}
function leave(ws, deliberate) {
  const room = ws.room; if (!room) return; ws.room = null;
  const S = sideOf(room, ws); if (!S) return;
  const other = room.players[swapSide(S)]; room.players[S] = null;
  if (!deliberate && room.ctx && !room.over) {                    // connection dropped mid-match: hold it for them (both, if both drop)
    room.away[S] = Date.now(); send(other, { t: 'oppAway', secs: GRACE / 1000 }); log(`room ${room.code}: ${S} dropped, waiting ${GRACE / 1000}s`); return;
  }
  if (other) {
    if (room.ctx && !room.over) { try { room.ctx.__forfeit(S); } catch (e) { } }
    send(other, { t: 'opponentLeft' }); other.room = null;
  }
  if (room.tour && !room.over) matchFinished(room, swapSide(S));
  closeRoom(room, deliberate ? 'player left' : 'player disconnected');
}
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);
/* =====================================================================
   Tournaments: up to 16 players, random single-elimination bracket.
   Each match is an ordinary battle room; winners move on as soon as
   their next opponent is decided.
   ===================================================================== */
const TOUR_MATCH_DELAY = 7000, LOBBY_DROP = 30000;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tmember = (t, id) => t.members.find(m => m.id === id);
function tourPublic(t) {
  return { code: t.code, max: t.max, phase: t.phase, host: t.hostId, arena: t.arena, champion: t.champion,
    players: t.members.map(m => ({ id: m.id, name: m.name, trainerFile: m.trainerFile, online: !!(m.ws && m.ws.readyState === 1), alive: m.alive, left: m.left, inMatch: !!m.match })),
    rounds: t.rounds.map(r => r.map(x => ({ a: x.a, b: x.b, winner: x.winner, state: x.state, note: x.note || '' }))) };
}
function tourBroadcast(t) { const pub = tourPublic(t); for (const m of t.members) send(m.ws, { t: 'tstate', tour: pub, you: m.id }); }
function addMember(t, ws, info) {
  const m = { id: t.nextId++, name: uniqueName(t, info.trainer), trainerFile: info.trainerFile, team: info.team, token: crypto.randomUUID(), ws, alive: true, left: false, match: null };
  t.members.push(m); ws.tour = t; ws.tid = m.id; return m;
}
function uniqueName(t, base) { let n = base, k = 2; while (t.members.some(m => !m.left && m.name === n)) n = `${base} ${k++}`; return n; }
function tourHost(ws, m) {
  if (ws.tour) tourLeave(ws); if (ws.room) leave(ws, true);
  const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
  const t = { code: newCode(), max: Math.max(2, Math.min(16, m.max | 0 || 8)), arena: String(m.arena || 'random'), timeLimit: +m.timeLimit || 0,
    members: [], phase: 'lobby', rounds: [], champion: null, nextId: 1, created: Date.now() };
  tours.set(t.code, t); const me = addMember(t, ws, info); t.hostId = me.id;
  send(ws, { t: 'tjoined', code: t.code, you: me.id, token: me.token }); tourBroadcast(t);
  log(`tournament ${t.code} created by ${me.name} (max ${t.max})`);
}
function tourJoin(ws, t, m) {
  if (ws.tour === t) return;
  if (t.phase !== 'lobby') return send(ws, { t: 'error', msg: 'That tournament has already started.' });
  if (t.members.filter(x => !x.left).length >= t.max) return send(ws, { t: 'error', msg: `That tournament is full (${t.max} players).` });
  const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
  if (ws.tour) tourLeave(ws); if (ws.room) leave(ws, true);
  const me = addMember(t, ws, info); send(ws, { t: 'tjoined', code: t.code, you: me.id, token: me.token }); tourBroadcast(t);
  log(`tournament ${t.code}: ${me.name} joined (${t.members.filter(x => !x.left).length}/${t.max})`);
}
function tourStart(ws) {
  const t = ws.tour; if (!t || t.phase !== 'lobby' || ws.tid !== t.hostId) return;
  const ids = shuffle(t.members.filter(m => !m.left).map(m => m.id));
  if (ids.length < 2) return send(ws, { t: 'error', msg: 'At least 2 players are needed to start.' });
  let size = 1; while (size < ids.length) size *= 2;
  t.rounds = []; for (let n = size / 2; n >= 1; n /= 2) t.rounds.push(Array.from({ length: n }, () => ({ a: null, b: null, winner: null, state: 'waiting' })));
  const byeSlots = new Set(shuffle([...Array(size / 2).keys()]).slice(0, size - ids.length));     // byes land on random first-round matches
  let p = 0;
  t.rounds[0].forEach((x, i) => { x.a = ids[p++]; if (byeSlots.has(i)) { x.state = 'bye'; x.winner = x.a; x.note = 'Bye'; } else { x.b = ids[p++]; x.state = 'ready'; } });
  t.phase = 'running';
  t.rounds[0].forEach((x, i) => { if (x.state === 'bye') place(t, 0, i, x.winner); });
  log(`tournament ${t.code} started: ${ids.length} players, ${t.rounds.length} rounds`);
  tourBroadcast(t); advanceTour(t);
}
function place(t, r, i, id) {
  if (r + 1 >= t.rounds.length) { t.champion = id; t.phase = 'done'; log(`tournament ${t.code}: champion ${tmember(t, id).name}`); return; }
  const nx = t.rounds[r + 1][i >> 1]; if (i % 2 === 0) nx.a = id; else nx.b = id;
  if (nx.a != null && nx.b != null && nx.state === 'waiting') nx.state = 'ready';
}
// Start every match whose two players are both decided (after a short pause to see the bracket).
function advanceTour(t) {
  if (t.phase !== 'running') return;
  t.rounds.forEach((round, r) => round.forEach((x, i) => {
    if (x.state !== 'ready') return; x.state = 'starting';
    setTimeout(() => startTourMatch(t, r, i), TOUR_MATCH_DELAY);
  }));
  tourBroadcast(t);
}
function decide(t, r, i, winId, note) {
  const x = t.rounds[r][i]; x.winner = winId; x.state = 'done'; x.note = note || x.note || '';
  const loser = winId === x.a ? x.b : x.a; const lm = loser != null && tmember(t, loser); if (lm) lm.alive = false;
  for (const id of [x.a, x.b]) { const m = id != null && tmember(t, id); if (m) m.match = null; }
  place(t, r, i, winId); tourBroadcast(t); advanceTour(t);
}
function startTourMatch(t, r, i) {
  if (!tours.has(t.code) || t.phase !== 'running') return;
  const x = t.rounds[r][i], ma = tmember(t, x.a), mb = tmember(t, x.b);
  if (ma.left && mb.left) return decide(t, r, i, Math.random() < .5 ? ma.id : mb.id, 'Both players left');
  if (ma.left) return decide(t, r, i, mb.id, 'Walkover'); if (mb.left) return decide(t, r, i, ma.id, 'Walkover');
  const on = m => m.ws && m.ws.readyState === 1 && !m.ws.room ? m.ws : null;
  const room = { code: `${t.code}-${r + 1}.${i + 1}`, players: { A: on(ma), B: on(mb) },
    info: { A: { trainer: ma.name, trainerFile: ma.trainerFile, team: ma.team }, B: { trainer: mb.name, trainerFile: mb.trainerFile, team: mb.team } },
    arena: t.arena, timeLimit: t.timeLimit, state: 'lobby', tour: t, slot: { r, i }, memberIds: { A: ma.id, B: mb.id } };
  rooms.set(room.code, room);
  for (const S of ['A', 'B']) if (room.players[S]) room.players[S].room = room;
  ma.match = room; mb.match = room; x.state = 'live';
  startRoom(room);
  for (const S of ['A', 'B']) if (!room.players[S]) room.away[S] = Date.now();      // offline right now: the usual 20 s to come back
  log(`tournament ${t.code}: round ${r + 1} match ${i + 1} — ${ma.name} vs ${mb.name}`);
  tourBroadcast(t);
}
function matchFinished(room, winnerSide) {
  if (!room.tour || room.reported) return; room.reported = true;
  let w = winnerSide, note = '';
  if (w !== 'A' && w !== 'B') { w = Math.random() < .5 ? 'A' : 'B'; note = 'Tie broken by coin flip'; }
  const t = room.tour, { r, i } = room.slot;
  setTimeout(() => { for (const S of ['A', 'B']) { const p = room.players[S]; if (p && p.room === room) p.room = null; } if (!room.closed) closeRoom(room, 'tournament match finished'); }, 1500);
  decide(t, r, i, room.memberIds[w], note);
}
function tourLeave(ws) {
  const t = ws.tour; if (!t) return; const m = tmember(t, ws.tid); ws.tour = null; ws.tid = null; if (!m) return;
  if (t.phase === 'lobby') {
    t.members = t.members.filter(x => x !== m);
    if (!t.members.length) { tours.delete(t.code); log(`tournament ${t.code} closed (empty)`); return; }
    if (t.hostId === m.id) t.hostId = t.members[0].id;
  } else { m.left = true; m.ws = null; if (m.match && ws.room === m.match) leave(ws, true); }
  log(`tournament ${t.code}: ${m.name} left`); tourBroadcast(t); cleanupTour(t);
}
function tourDisconnect(ws) {
  const t = ws.tour; if (!t) return; const m = tmember(t, ws.tid); if (!m || m.ws !== ws) return;
  m.ws = null; tourBroadcast(t);
  if (t.phase === 'lobby') setTimeout(() => { if (!m.ws && tours.get(t.code) === t && t.phase === 'lobby' && t.members.includes(m)) { ws.tour = t; ws.tid = m.id; tourLeave(ws); } }, LOBBY_DROP);
  cleanupTour(t);
}
function tourResume(ws, msg) {
  const t = tours.get(String(msg.code || '').toUpperCase()); const m = t && t.members.find(x => x.token === msg.token);
  if (!m || m.left) return send(ws, { t: 'resumeFailed' });
  if (m.ws && m.ws !== ws) { const old = m.ws; old.tour = null; old.room = null; try { old.terminate(); } catch (e) { } }
  m.ws = ws; ws.tour = t; ws.tid = m.id;
  send(ws, { t: 'tjoined', code: t.code, you: m.id, token: m.token, resumed: true });
  const room = m.match;
  if (room && !room.closed) {                                       // back into the live match
    const S = room.memberIds.A === m.id ? 'A' : 'B';
    room.players[S] = ws; ws.room = room; delete room.away[S]; room.seen[S] = {};
    send(ws, { t: 'resumed', ...room.startMsg[S], phase: room.state }); send(room.players[swapSide(S)], { t: 'oppBack' });
  }
  log(`tournament ${t.code}: ${m.name} reconnected`); tourBroadcast(t);
}
function cleanupTour(t) {
  const anyone = t.members.some(m => m.ws && m.ws.readyState === 1);
  if (!anyone && (t.phase === 'done' || t.phase === 'lobby')) { tours.delete(t.code); log(`tournament ${t.code} closed`); }
}
setInterval(() => { const now = Date.now(); for (const t of tours.values()) if (now - t.created > 6 * 3600 * 1000) tours.delete(t.code); }, 600000);
server.listen(PORT, () => log(`Arena 151 server v${VERSION} listening on port ${PORT}`));
