/* =====================================================================
   ARENA 151 — online battle server (server-authoritative, multi-core)
   The main thread handles connections, lobbies, tournaments and
   reconnects. Battles run in a pool of worker threads (battle-worker.js),
   one per CPU core by default, so a busy match never slows the others.
   Each player always sees themselves as Red on the left.
   ===================================================================== */
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '16';   // compression runs on this pool
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8151;
const VERSION = fs.readFileSync(path.join(__dirname, 'game', 'VERSION'), 'utf8').trim();
const WORKERS = Math.max(1, +process.env.WORKERS || Math.min(8, Math.max(1, os.cpus().length - 1)));
const GRACE = 30000;                 // a dropped player has this long to reconnect (covers Wi-Fi ↔ mobile data handoffs)
// Internet exposure: per-address limits and message rate limits. All configurable in docker-compose.yml.
const TRUST_PROXY = !!process.env.TRUST_PROXY;   // set when behind a tunnel / reverse proxy so limits apply per real player
const MAX_CONN_PER_IP = +process.env.MAX_CONN_PER_IP || 30, NEW_CONN_PER_MIN = 60, BAD_CODES_PER_MIN = 15;
const MAX_CONNECTIONS = +process.env.MAX_CONNECTIONS || 1000, BAD_CODES_PER_MIN_TOTAL = 300;
// Docker Desktop (and tunnels without TRUST_PROXY) make every player appear to come from one internal address, so
// per-address limits only apply to real public addresses; everyone else is covered by per-connection and server-wide limits.
const isPrivate = ip => /^(::ffff:)?(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) || ip === '::1' || /^f[cd]/i.test(ip);
const badCodesAll = [];
const MSG_RATE = 80, MSG_BURST = 160;            // per connection (real play sends ~20 a second)
const MAX_BUFFER = 1024 * 1024;      // a phone this far behind gets updates skipped (never disconnected); keyframes heal it
const SILENT_MS = 20000;             // a battling connection that sends nothing (phones ping every 2 s) for this long is dead
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const CODE = ['data.js', 'fxdata.js', 'arenas.js', 'sim.js', 'glue.js'].map(f => fs.readFileSync(path.join(__dirname, 'game', f), 'utf8')).join('\n;\n');
const CHECK = vm.createContext({ console, Math, JSON, Date }); new vm.Script(CODE).runInContext(CHECK);   // validates team names
const validTeam = t => CHECK.__validTeam(t);
const swapSide = s => (s === 'A' ? 'B' : s === 'B' ? 'A' : s);

/* ---------- worker pool ---------- */
const pool = [];
function spawnWorker(id) {
  const w = new Worker(path.join(__dirname, 'battle-worker.js'), { workerData: { id } });
  w.id = id; w.load = 0; w.stats = {}; w.lastBeat = Date.now();
  w.on('message', m => onWorker(w, m));
  w.on('error', e => log(`worker ${id} error`, e));
  w.on('exit', code => {
    log(`worker ${id} stopped (code ${code}) — restarting it`);
    for (const room of [...rooms.values()]) if (room.worker === w) endByHp(room, 'The server restarted this match\'s battle engine; the match was decided by remaining HP.');
    if (pool[id] === w) pool[id] = spawnWorker(id);
  });
  return w;
}
for (let i = 0; i < WORKERS; i++) pool.push(spawnWorker(i));
const pickWorker = () => pool.reduce((a, b) => (b.load < a.load ? b : a));
// A match that cannot continue still gets a proper result: whoever has more HP left wins (a draw if level).
function endByHp(room, reason) {
  if (room.closed) return;
  if (!room.over) {
    room.over = true;
    const hp = room.lastHp || { A: 0, B: 0 }, w = hp.A === hp.B ? 'draw' : hp.A > hp.B ? 'A' : 'B';
    for (const S of ['A', 'B']) send(room.players[S], { t: 'over', winner: w === 'draw' ? 'draw' : (w === S ? 'A' : 'B'), big: 'MATCH ENDED', reason });
    if (room.tour) matchFinished(room, w);
    log(`room ${room.code}: ended by HP (${hp.A} vs ${hp.B}) — ${reason}`);
  }
  for (const S of ['A', 'B']) { const p = room.players[S]; if (p && p.room === room) p.room = null; }
  closeRoom(room, 'ended by HP');
}
// Watchdog: a worker that stops reporting (it sends a heartbeat twice a second) is replaced.
let lastWatch = Date.now();
setInterval(() => {
  const now = Date.now(), late = now - lastWatch - 1000; lastWatch = now;
  // If this check itself ran late, the whole server was paused (Docker/WSL hiccup, PC sleeping): nobody is to blame — start fresh.
  if (late > 1500) { for (const w of pool) w.lastBeat = now; log(`server was paused for ${Math.round(late / 1000)} s — not treating workers as stuck`); return; }
  for (const w of pool) if (now - w.lastBeat > 5000 && !w.replacing) {
    w.replacing = true; log(`worker ${w.id} has not responded for ${Math.round((now - w.lastBeat) / 1000)} s — replacing it`);
    pool[w.id] = spawnWorker(w.id);
    for (const room of [...rooms.values()]) if (room.worker === w) endByHp(room, 'The battle engine for this match stopped responding; the match was decided by remaining HP.');
    w.terminate().catch(() => {});
  }
}, 1000);
const toWorker = (room, msg) => { if (room.worker) room.worker.postMessage({ code: room.code, ...msg }); };
function onWorker(w, m) {
  if (m.ev === 'out') { for (const [code, S, str] of m.batch) deliver(code, S, str); return; }
  if (m.ev === 'stats') { w.stats = m; return; }
  if (m.ev === 'beat') { w.lastBeat = Date.now(); for (const code in m.hp) { const r = rooms.get(code); if (r) r.lastHp = m.hp[code]; } return; }
  if (m.ev === 'log') { log(m.text); return; }
  const room = rooms.get(m.code); if (!room || room.closed) return;
  if (m.ev === 'started') {
    room.arenaId = m.arenaId;
    for (const S of ['A', 'B']) {
      const me = room.info[S], opp = room.info[swapSide(S)];
      room.startMsg[S] = { arena: room.arenaId, timeLimit: room.timeLimit, me, opp, role: S === 'A' ? 'host' : 'guest', code: room.code, token: room.tokens[S] };
      send(room.players[S], { t: 'start', ...room.startMsg[S] });
    }
    log(`room ${room.code}: battle on ${room.arenaId} — ${room.info.A.trainer} vs ${room.info.B.trainer} (worker ${room.worker.id})`);
  } else if (m.ev === 'ended') {
    if (room.over) return; room.over = true;
    for (const S of ['A', 'B']) send(room.players[S], { t: 'over', winner: m.winner === 'draw' ? 'draw' : (m.winner === S ? 'A' : 'B'), big: m.big, reason: m.reason });
    log(`room ${room.code}: winner ${m.winner}`);
    if (room.tour) matchFinished(room, m.winner);
  }
}
// A message for one phone ('A' / 'B') or both ('*'). A phone that is far behind gets this update skipped.
function deliver(code, S, str) {
  const room = rooms.get(code); if (!room || room.closed) return;
  for (const side of S === '*' ? ['A', 'B'] : [S]) {
    const ws = room.players[side]; if (!ws || ws.readyState !== 1) continue;
    if (ws.bufferedAmount > MAX_BUFFER) { if (Date.now() - (ws.slowLogged || 0) > 10000) { ws.slowLogged = Date.now(); log(`room ${room.code}: ${side} is slow (${Math.round(ws.bufferedAmount / 1024)} KB waiting) — skipping updates until it catches up`); } continue; }
    ws.send(str);
  }
}

/* ---------- rooms (main-thread side) ---------- */
const rooms = new Map();
const tours = new Map();                     // tournaments by code (their matches live in rooms)
const newCode = () => { let c; do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join(''); } while (rooms.has(c) || tours.has(c)); return c; };
const send = (ws, msg) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const sideOf = (room, ws) => (room.players.A === ws ? 'A' : room.players.B === ws ? 'B' : null);
const fromSide = (S, server) => (S === 'A' ? server : swapSide(server));   // a client's "A" is the host's A and the guest's B

function startRoom(room) {
  if (!room.worker) { room.worker = pickWorker(); room.worker.load++; }
  room.tokens = room.tokens || { A: crypto.randomUUID(), B: crypto.randomUUID() };
  room.startMsg = {}; room.away = {}; room.over = false; room.rematch = {}; room.state = 'battle';
  toWorker(room, { cmd: 'start', teamA: room.info.A.team, teamB: room.info.B.team, names: { A: room.info.A.trainer, B: room.info.B.trainer }, arena: room.arena, timeLimit: room.timeLimit });
}
function closeRoom(room, why) {
  if (room.closed) return; room.closed = true; rooms.delete(room.code);
  if (room.worker) { toWorker(room, { cmd: 'close' }); room.worker.load = Math.max(0, room.worker.load - 1); }
  log(`room ${room.code} closed: ${why}`);
}
// The battle pauses while a player is away; the worker shows the other phone a countdown.
function syncHold(room) {
  const S = ['A', 'B'].find(k => room.away[k]);
  toWorker(room, { cmd: 'hold', side: S || null, until: S ? room.away[S] + GRACE : 0 });
}
function rebind(room, S, ws) {
  const old = room.players[S]; if (old && old !== ws) { old.room = null; try { old.terminate(); } catch (e) { } }
  room.players[S] = ws; ws.room = room; delete room.away[S]; syncHold(room);
  toWorker(room, { cmd: 'resync', S });
}
setInterval(() => {                         // reconnect grace: forfeit (or close) when time runs out
  const now = Date.now();
  for (const room of [...rooms.values()]) {
    const expired = ['A', 'B'].filter(S => room.away[S] && now - room.away[S] > GRACE); if (!expired.length || room.closed) continue;
    if (room.away.A && room.away.B) { if (room.tour && !room.over) matchFinished(room, null); closeRoom(room, 'both players gone'); continue; }
    const gone = expired[0]; log(`room ${room.code}: ${gone} did not come back`);
    toWorker(room, { cmd: 'forfeit', loser: gone });
    const other = room.players[swapSide(gone)]; send(other, { t: 'opponentLeft' }); if (other) other.room = null;
    if (room.tour && !room.over) matchFinished(room, swapSide(gone));
    closeRoom(room, 'reconnect timed out');
  }
}, 500);

/* ---------- connections ---------- */
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, game: 'Arena 151', version: VERSION, rooms: rooms.size, tournaments: tours.size, players: wss.clients.size,
      workers: pool.map(w => ({ id: w.id, games: w.load, avgTickMs: w.stats.avgTickMs, p99TickMs: w.stats.p99TickMs })) }));
  } else { res.writeHead(404); res.end(); }
});
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024, perMessageDeflate: { threshold: 512 } });
const perIp = new Map();                                 // ip -> { open, recent: [timestamps], badCodes: [timestamps] }
const ipOf = req => (TRUST_PROXY && (req.headers['cf-connecting-ip'] || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim())) || req.socket.remoteAddress || '?';
const recentCount = (arr, ms) => { const now = Date.now(); while (arr.length && now - arr[0] > ms) arr.shift(); return arr.length; };
wss.on('connection', (ws, req) => {
  const ip = ipOf(req), rec = perIp.get(ip) || { open: 0, recent: [], badCodes: [] }; perIp.set(ip, rec);
  const limited = !isPrivate(ip);
  if (wss.clients.size > MAX_CONNECTIONS || (limited && (rec.open >= MAX_CONN_PER_IP || recentCount(rec.recent, 60000) >= NEW_CONN_PER_MIN))) { log(`refused a connection from ${ip} (too many)`); ws.close(1013, 'Too many connections'); return; }
  rec.open++; rec.recent.push(Date.now()); ws.ip = ip; ws.ipRec = rec;
  ws.room = null; ws.missed = 0; ws.lastMsg = Date.now(); ws.tokens = MSG_BURST; ws.tokenAt = Date.now(); ws.dropped = 0;
  ws.on('pong', () => (ws.missed = 0));
  log('connect', ip);
  ws.on('message', raw => {
    ws.lastMsg = Date.now();
    const now = Date.now(); ws.tokens = Math.min(MSG_BURST, ws.tokens + (now - ws.tokenAt) * MSG_RATE / 1000); ws.tokenAt = now;
    if (ws.tokens < 1) { if (++ws.dropped > 1000) { log(`closing a flooding connection from ${ip}`); ws.terminate(); } return; }
    ws.tokens--;
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    try { handle(ws, clean(m)); } catch (e) { log('message error', e); }
  });
  ws.on('close', () => { rec.open = Math.max(0, rec.open - 1); leave(ws, false); tourDisconnect(ws); });
});
const int = (v, lo, hi) => { v = Math.trunc(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo; };
const num = (v, lo, hi) => { v = +v; return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0; };
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
function clean(m) {                                  // only well-formed fields reach the game
  const o = { t: str(m.t, 12) };
  if ('code' in m) o.code = str(m.code, 12); if ('token' in m) o.token = str(m.token, 64); if ('v' in m) o.v = str(m.v, 12);
  if ('name' in m) o.name = str(m.name, 24); if ('trainer' in m) o.trainer = str(m.trainer, 24); if ('trainerFile' in m) o.trainerFile = str(m.trainerFile, 40).replace(/[^A-Za-z0-9_ .-]/g, '');
  if (Array.isArray(m.team)) o.team = m.team.slice(0, 6).map(x => str(x, 24));
  if ('arena' in m) o.arena = str(m.arena, 16); if ('timeLimit' in m) o.timeLimit = int(m.timeLimit, 0, 3600); if ('max' in m) o.max = int(m.max, 2, 16);
  if ('i' in m) o.i = int(m.i, 0, 5); if ('q' in m) o.q = int(m.q, 0, 2147483647); if ('s' in m) o.s = m.s === 'B' ? 'B' : 'A'; if ('x' in m) o.x = num(m.x, -1, 1); if ('y' in m) o.y = num(m.y, -1, 1);
  if (m.off) o.off = true; if ('c' in m) o.c = num(m.c, -1e15, 1e15); if ('ms' in m) o.ms = int(m.ms, 0, 60000); if ('why' in m) o.why = str(m.why, 80);
  return o;
}
function handle(ws, m) {
  const room = ws.room;
  switch (m.t) {
    case 'hello':
      if (m.v !== VERSION) return send(ws, { t: 'error', msg: `Version mismatch: your app is v${m.v}, the server is v${VERSION}. Update both to the same version.` });
      send(ws, { t: 'hi', v: VERSION });
      break;
    case 'thost': tourHost(ws, m); break;
    case 'tstart': tourStart(ws); break;
    case 'tleave': tourLeave(ws); break;
    case 'tresume': tourResume(ws, m); break;
    case 'host': {
      if (ws.tour) tourLeave(ws);
      if (room) leave(ws, true);
      const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
      const code = newCode(), r = { code, players: { A: ws, B: null }, info: { A: info, B: null }, arena: String(m.arena || 'random'), timeLimit: +m.timeLimit || 0, state: 'lobby', away: {} };
      rooms.set(code, r); ws.room = r; send(ws, { t: 'hosted', code }); log(`room ${code} hosted by ${info.trainer}`);
      break;
    }
    case 'join': {
      if (room) leave(ws);
      const jc = String(m.code || '').toUpperCase().trim();
      if (tours.has(jc)) { tourJoin(ws, tours.get(jc), m); break; }
      const r = rooms.get(jc);
      if (!r) {
        const now = Date.now(); ws.badCodes = ws.badCodes || []; ws.badCodes.push(now); badCodesAll.push(now); if (!isPrivate(ws.ip)) ws.ipRec.badCodes.push(now);
        if (recentCount(ws.badCodes, 60000) > BAD_CODES_PER_MIN || recentCount(ws.ipRec.badCodes, 60000) > BAD_CODES_PER_MIN || recentCount(badCodesAll, 60000) > BAD_CODES_PER_MIN_TOTAL) return send(ws, { t: 'error', msg: 'Too many wrong codes — wait a minute and try again.' });
        return send(ws, { t: 'error', msg: 'No game with that code. Check the code with the host.' });
      }
      if (r.players.B || r.tour) return send(ws, { t: 'error', msg: 'That game is already full.' });
      const info = cleanInfo(m); if (!info) return send(ws, { t: 'error', msg: 'Pick six valid Pokémon first.' });
      r.players.B = ws; r.info.B = info; ws.room = r; send(ws, { t: 'joined', code: r.code });
      startRoom(r);
      break;
    }
    case 'ready': if (room && room.worker) toWorker(room, { cmd: 'ready', S: sideOf(room, ws) }); break;
    case 'cue': if (room && room.worker) { const S = sideOf(room, ws); if (S) toWorker(room, { cmd: 'cue', S, srv: fromSide(S, m.s) }); } break;
    case 'in': case 'mv': case 'sw': case 'mega': case 'pick':
      if (room && room.worker) { const S = sideOf(room, ws); if (S) toWorker(room, { cmd: 'input', S, msg: m }); }
      break;
    case 'rematch':
      if (room && room.over && !room.tour) { room.rematch[sideOf(room, ws)] = true; send(room.players[swapSide(sideOf(room, ws))], { t: 'rematchAsked' }); if (room.rematch.A && room.rematch.B) startRoom(room); }
      break;
    case 'leave': leave(ws, true); break;
    case 'ping': send(ws, { t: 'pong', c: m.c }); break;
    // Pings are answered but battle updates stopped arriving: re-attach this connection and send a full update.
    case 'resync': {
      const r = rooms.get(String(m.code || '').toUpperCase()); const S = r && r.tokens && ['A', 'B'].find(k => r.tokens[k] === m.token);
      if (!r || !S || r.closed) return send(ws, { t: 'resumeFailed' });
      if (r.players[S] !== ws) log(`room ${r.code}: ${S} re-attached on resync (${m.why || 'no reason given'})`); else log(`room ${r.code}: ${S} asked for a full update (${m.why || ''})`);
      rebind(r, S, ws);
      break;
    }
    case 'resume': {
      const r = rooms.get(String(m.code || '').toUpperCase()); const S = r && r.tokens && ['A', 'B'].find(k => r.tokens[k] === m.token);
      if (!r || !S || r.closed) return send(ws, { t: 'resumeFailed' });
      rebind(r, S, ws);
      send(ws, { t: 'resumed', ...r.startMsg[S] }); send(r.players[swapSide(S)], { t: 'oppBack' });
      log(`room ${r.code}: ${S} reconnected (${m.why || 'connection lost'})`);
      break;
    }
    case 'dbgFreeze': if (process.env.ARENA_TEST && room && room.worker) room.worker.postMessage({ cmd: 'dbgFreeze', ms: +m.ms || 10000 }); break;
    case 'dbgMute': case 'dbgThrow': case 'dbgWin': case 'dbgHang':
      if (process.env.ARENA_TEST && room && room.worker) toWorker(room, { cmd: m.t, S: sideOf(room, ws), ms: +m.ms || 0 });
      break;
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
  if (!deliberate && room.worker && !room.over) {                 // connection dropped mid-match: hold it for them (both, if both drop)
    room.away[S] = Date.now(); syncHold(room); send(other, { t: 'oppAway', secs: GRACE / 1000 }); log(`room ${room.code}: ${S} dropped, waiting ${GRACE / 1000}s`); return;
  }
  if (other) {
    if (room.worker && !room.over) toWorker(room, { cmd: 'forfeit', loser: S });
    send(other, { t: 'opponentLeft' }); other.room = null;
  }
  if (room.tour && !room.over) matchFinished(room, swapSide(S));
  closeRoom(room, deliberate ? 'player left' : 'player disconnected');
}
setInterval(() => {                                               // dead connections: no pong at the socket level, or total silence
  const now = Date.now();
  for (const ws of wss.clients) {
    const inBattle = ws.room && ws.room.worker && !ws.room.over;    // only battling phones must keep talking (they ping every 2 s)
    if (ws.missed >= 2 || (inBattle && now - ws.lastMsg > SILENT_MS)) { log(`closing a dead connection (${ws.missed >= 2 ? 'no keep-alive answer for 20 s' : 'silent for 20 s'})`); ws.terminate(); continue; }
    ws.missed++; ws.ping();              // two missed answers in a row (about 20 s) before giving up
  }
}, 10000);
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
  const room = { code: `${t.code}-${r + 1}.${i + 1}`, players: { A: on(ma), B: on(mb) }, away: {},
    info: { A: { trainer: ma.name, trainerFile: ma.trainerFile, team: ma.team }, B: { trainer: mb.name, trainerFile: mb.trainerFile, team: mb.team } },
    arena: t.arena, timeLimit: t.timeLimit, state: 'lobby', tour: t, slot: { r, i }, memberIds: { A: ma.id, B: mb.id } };
  rooms.set(room.code, room);
  for (const S of ['A', 'B']) if (room.players[S]) room.players[S].room = room;
  ma.match = room; mb.match = room; x.state = 'live';
  startRoom(room);
  for (const S of ['A', 'B']) if (!room.players[S]) room.away[S] = Date.now();      // offline right now: the usual 20 s to come back
  syncHold(room);
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
    rebind(room, S, ws);
    send(ws, { t: 'resumed', ...room.startMsg[S] }); send(room.players[swapSide(S)], { t: 'oppBack' });
  }
  log(`tournament ${t.code}: ${m.name} reconnected`); tourBroadcast(t);
}
function cleanupTour(t) {
  const anyone = t.members.some(m => m.ws && m.ws.readyState === 1);
  if (!anyone && (t.phase === 'done' || t.phase === 'lobby')) { tours.delete(t.code); log(`tournament ${t.code} closed`); }
}
setInterval(() => { const now = Date.now(); for (const t of tours.values()) if (now - t.created > 6 * 3600 * 1000) tours.delete(t.code); }, 600000);
setInterval(() => { for (const [ip, r] of perIp) if (!r.open && !recentCount(r.recent, 60000) && !recentCount(r.badCodes, 60000)) perIp.delete(ip); }, 60000);
server.listen(PORT, () => log(`Arena 151 server v${VERSION} listening on port ${PORT} with ${WORKERS} battle worker${WORKERS > 1 ? 's' : ''}`));
