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
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join(''); } while (rooms.has(c)); return c; };
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const sideOf = (room, ws) => (room.players.A === ws ? 'A' : room.players.B === ws ? 'B' : null);
const fromSide = (S, server) => (S === 'A' ? server : swapSide(server));   // a client's "A" is the host's A and the guest's B

function startRoom(room) {
  const ctx = vm.createContext({ console, Math, JSON, Date });
  SCRIPT.runInContext(ctx); room.ctx = ctx;
  room.arenaId = ctx.__init(room.info.A.team, room.info.B.team, { A: room.info.A.trainer, B: room.info.B.trainer }, room.arena, room.timeLimit);
  room.state = 'intro'; room.seen = { A: {}, B: {} }; room.ready = {}; room.cues = {}; room.snapAt = 0; room.pickSince = {}; room.over = false; room.rematch = {};
  for (const S of ['A', 'B']) {
    const me = room.info[S], opp = room.info[swapSide(S)];
    send(room.players[S], { t: 'start', arena: room.arenaId, timeLimit: room.timeLimit, me, opp, role: S === 'A' ? 'host' : 'guest' });
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
  const ws = room.players[S]; if (!ws || ws.readyState !== 1) return;
  const seen = room.seen[S], tm = { A: {}, B: {} };
  for (const T of ['A', 'B']) snap.teams[T].forEach((mon, i) => { const j = JSON.stringify(mon), key = T + i; if (seen[key] !== j) { seen[key] = j; tm[T][i] = mon; } });
  const { teams, ...rest } = snap;
  ws.send(JSON.stringify({ t: 'snap', s: { ...rest, tm }, ev }));
}
/* ---------- the loop: simulate, then stream snapshots ---------- */
let last = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(100, now - last); last = now;
  for (const room of rooms.values()) {
    if (!room.ctx || room.closed) continue;
    const ctx = room.ctx;
    let left = dt; while (left > 0) { const step = Math.min(TICK, left); try { ctx.__step(step); } catch (e) { log('sim error', e); } left -= step; }
    const st = ctx.__state();
    // pick phase: each waiting player has a time limit, then the best replacement is sent automatically
    for (const S of ['A', 'B']) {
      if (st.waiting.includes(S)) { room.pickSince[S] = room.pickSince[S] || now; if (now - room.pickSince[S] > PICK_TIMEOUT) { ctx.__autoPick(S); room.pickSince[S] = 0; } }
      else room.pickSince[S] = 0;
    }
    if ((room.snapAt += dt) >= SNAP_EVERY) {
      room.snapAt = 0;
      const snap = ctx.__snapshot(), ev = ctx.__takeEvents();
      snap.pickLeft = { A: room.pickSince.A ? Math.max(0, PICK_TIMEOUT - (now - room.pickSince.A)) : 0, B: room.pickSince.B ? Math.max(0, PICK_TIMEOUT - (now - room.pickSince.B)) : 0 };
      sendSnap(room, 'A', snap, ev);
      sendSnap(room, 'B', mirrorSnap(snap), ev.map(mirrorEvent));
    }
    if (st.ended && !room.over) {
      room.over = true; room.state = 'over';
      for (const S of ['A', 'B']) send(room.players[S], { t: 'over', winner: st.ended.winner === 'draw' ? 'draw' : (st.ended.winner === S ? 'A' : 'B'), big: st.ended.big, reason: st.ended.reason });
      log(`room ${room.code}: winner ${st.ended.winner}`);
    }
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
  ws.on('close', () => leave(ws));
});
function handle(ws, m) {
    const room = ws.room;
    switch (m.t) {
      case 'hello':
        if (m.v !== VERSION) send(ws, { t: 'error', msg: `Version mismatch: your app is v${m.v}, the server is v${VERSION}. Update both to the same version.` });
        else send(ws, { t: 'hi', v: VERSION });
        break;
      case 'host': {
        if (room) leave(ws);
        const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
        const code = newCode(), r = { code, players: { A: ws, B: null }, info: { A: info, B: null }, arena: String(m.arena || 'random'), timeLimit: +m.timeLimit || 0, state: 'lobby' };
        rooms.set(code, r); ws.room = r; send(ws, { t: 'hosted', code }); log(`room ${code} hosted by ${info.trainer}`);
        break;
      }
      case 'join': {
        if (room) leave(ws);
        const r = rooms.get(String(m.code || '').toUpperCase().trim());
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
        if (room && room.over) { room.rematch[sideOf(room, ws)] = true; const other = room.players[swapSide(sideOf(room, ws))]; send(other, { t: 'rematchAsked' }); if (room.rematch.A && room.rematch.B) startRoom(room); }
        break;
      case 'leave': leave(ws); break;
    }
}
function cleanInfo(m) {
  const team = Array.isArray(m.team) ? m.team.slice(0, 6).map(String) : [];
  if (!validTeam(team)) return null;
  return { trainer: String(m.trainer || 'Trainer').slice(0, 24), trainerFile: String(m.trainerFile || '').slice(0, 40), team };
}
function leave(ws) {
  const room = ws.room; if (!room) return; ws.room = null;
  const S = sideOf(room, ws); if (!S) return;
  const other = room.players[swapSide(S)]; room.players[S] = null;
  if (other) {
    if (room.ctx && !room.over) { try { room.ctx.__forfeit(S); } catch (e) { } }
    send(other, { t: 'opponentLeft' }); other.room = null;
  }
  closeRoom(room, 'player left');
}
setInterval(() => { for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); } }, 15000);
server.listen(PORT, () => log(`Arena 151 server v${VERSION} listening on port ${PORT}`));
