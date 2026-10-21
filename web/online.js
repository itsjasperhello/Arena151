/* =====================================================================
   Section 18: online battles (client side)
   The battle runs on the Arena 151 server. This phone sends its input
   (joystick, moves, switches, Mega, picks) and draws the snapshots the
   server streams; between snapshots it glides Pokémon and projectiles
   so motion stays smooth. You always play Red, on the left.
   ===================================================================== */
const NET = { ws: null, active: false, mode: 'local', url: '', status: '', code: null, over: false, pickShown: false, steerOn: false, lastSteer: 0, prevTrsel: null,
  latest: null, evq: [], lastRx: 0, lastSnap: 0, predicting: false, hist: [], corr: { x: 0, y: 0 }, interp: { A: [], B: [] }, clockOff: null, offs: [], token: null, wsUrl: '', reconnecting: 0, rtt: null, oppAway: 0 };
try { NET.url = localStorage.getItem('arena151.server') || ''; NET.mode = localStorage.getItem('arena151.mode') === 'online' ? 'online' : 'local'; } catch (e) { }
const netSend = msg => { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(msg)); };
function serverUrl(input) {
  let s = String(input || '').trim(); if (!s) return '';
  if (/^https?:\/\//i.test(s)) s = s.replace(/^http/i, 'ws');
  if (!/^wss?:\/\//i.test(s)) s = 'ws://' + s;
  try { const u = new URL(s); if (!u.port && u.protocol === 'ws:') u.port = '8151'; return u.toString().replace(/\/$/, ''); } catch (e) { return ''; }
}
function netStatus(text, kind) { NET.status = text; const el = $('olStatus'); if (el) { el.textContent = text; el.dataset.kind = kind || ''; } }

/* ---------- connection ---------- */
function netConnect() {
  const url = serverUrl($('olServer').value); if (!url) { netStatus('Enter the server address shown in the setup guide, e.g. 192.168.1.20', 'err'); return Promise.reject(); }
  try { localStorage.setItem('arena151.server', $('olServer').value.trim()); } catch (e) { }
  if (NET.ws && NET.ws.readyState === 1 && NET.ws._url === url) return Promise.resolve();
  if (NET.ws) try { NET.ws.close(); } catch (e) { }
  netStatus('Connecting to ' + url + '…');
  return new Promise((res, rej) => {
    let ws; try { ws = new WebSocket(url); } catch (e) { netStatus('Could not open a connection to ' + url, 'err'); return rej(); }
    ws._url = url; NET.ws = ws; NET.wsUrl = url; let ok = false;
    const fail = setTimeout(() => { if (!ok) { netStatus('No answer from ' + url + '. Is the server running, and is this device on the same network?', 'err'); try { ws.close(); } catch (e) { } rej(); } }, 6000);
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', v: APP_VERSION }));
    ws.onmessage = e => { NET.lastRx = performance.now(); let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t === 'hi' && !ok) { ok = true; clearTimeout(fail); netStatus('Connected to the server (v' + m.v + ').', 'ok'); res(); } onNetMessage(m); };
    ws.onclose = () => { clearTimeout(fail); if (NET.ws === ws) { NET.ws = null; if (NET.active && !NET.over) startReconnect(); } if (!ok) rej(); };
    ws.onerror = () => {};
  });
}
function myInfo() { return { trainer: trainerTitle(TRSEL.A), trainerFile: TRSEL.A, team: readPickers('A') }; }
async function hostGame() { try { await netConnect(); } catch (e) { return; } netSend({ t: 'host', ...myInfo(), arena: START.arena, timeLimit: +$('stTime').value || 0 }); netStatus('Creating a game…'); }
async function joinGame() {
  const code = $('olCode').value.trim().toUpperCase(); if (code.length !== 4) { netStatus('Enter the 4-letter code from the host.', 'err'); return; }
  try { await netConnect(); } catch (e) { return; } netSend({ t: 'join', code, ...myInfo() }); netStatus('Joining ' + code + '…');
}
function leaveOnline() {
  if (NET.ws) { netSend({ t: 'leave' }); }
  NET.active = false; NET.code = null; NET.over = false;
  if (NET.prevTrsel) { Object.assign(TRSEL, NET.prevTrsel); NET.prevTrsel = null; try { refreshTrainerLabels(); drawMinis(); } catch (e) { } }
  $('olCodeShow').textContent = '';
}

/* ---------- messages from the server ---------- */
function onNetMessage(m) {
  switch (m.t) {
    case 'error': netStatus(m.msg, 'err'); toast(m.msg); break;
    case 'hosted': NET.code = m.code; $('olCodeShow').textContent = m.code; netStatus('Game created. Tell your friend the code — waiting for them to join…', 'ok'); break;
    case 'joined': NET.code = m.code; netStatus('Joined! Starting…', 'ok'); break;
    case 'start': beginOnline(m); break;
    case 'snap': NET.lastSnap = performance.now(); if (NET.active && G) { NET.latest = m.s; NET.evq.push(...(m.ev || [])); if (NET.evq.length > 500) NET.evq.splice(0, NET.evq.length - 500); } break;
    case 'pong': NET.rtt = Math.round(performance.now() - m.c); break;
    case 'oppAway': NET.oppAway = performance.now() + m.secs * 1000; toast('Your opponent lost connection — waiting for them to come back…'); break;
    case 'oppBack': NET.oppAway = 0; toast('Your opponent is back!'); break;
    case 'resumed': NET.reconnecting = 0; NET.lastRx = NET.lastSnap = performance.now(); netBanner(''); toast('Reconnected!'); break;
    case 'resumeFailed': NET.reconnecting = 0; netBanner(''); endOnline('B', 'DISCONNECTED', 'Could not rejoin the match.'); break;
    case 'countdown': if (NET.active) battleCountdown(epoch); break;
    case 'over': if (NET.active) endOnline(m.winner, m.big, m.reason); break;
    case 'rematchAsked': toast('Your opponent wants a rematch — tap Rematch to play again.'); break;
    case 'opponentLeft': if (NET.active) { toast('Your opponent left the game.'); if (!NET.over) endOnline('A', 'FORFEIT', 'Your opponent left the game.'); NET.code = null; } else netStatus('Your opponent left.', 'err'); break;
  }
}
async function beginOnline(m) {
  NET.token = m.token; NET.code = m.code || NET.code; NET.latest = null; NET.evq = []; NET.predicting = false; NET.hist = []; NET.interp = { A: [], B: [] }; NET.offs = []; NET.clockOff = null; NET.lastRx = NET.lastSnap = performance.now(); NET.oppAway = 0; NET.reconnecting = 0;
  if (!NET.prevTrsel) NET.prevTrsel = { ...TRSEL };
  NET.active = true; NET.over = false; NET.pickShown = false; NET.steerOn = false;
  hideStart();
  TRSEL.A = TRAINERS.includes(m.me.trainerFile) ? m.me.trainerFile : TRSEL.A;
  TRSEL.B = TRAINERS.includes(m.opp.trainerFile) ? m.opp.trainerFile : (TRAINERS[1] || TRAINERS[0]);
  loadTrainer(TRSEL.A); loadTrainer(TRSEL.B); try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
  watchMode = false; syncWatchButton();
  setStage(m.arena); resetScene(); const my = epoch; $('titleStage').textContent = STAGE.name;
  clock.paused = false; $('pausedTag').classList.remove('show');
  G = newBattle(m.me.team, m.opp.team, { auto: false, timeLimit: m.timeLimit || 0 }); G.phase = 'intro'; G.online = true;
  ['ovTitle', 'ovResults', 'ovSwitch'].forEach(id => showOverlay(id, false));
  $('log').innerHTML = ''; $('timer').textContent = '0:00'; movesKey = ''; rosterKey = '';
  logLine(`Online battle: ${m.me.trainer} vs ${m.opp.trainer} in the ${STAGE.name}.`, 't');
  updateHUD(true); warmSprites([...m.me.team, ...m.opp.team]);
  try { await playIntro(my); } catch (e) { }
  netSend({ t: 'ready' });
}

/* ---------- applying snapshots ---------- */
const dec = v => (v && typeof v === 'object') ? (v.__mv ? MOVES[v.__mv] : Array.isArray(v) ? v.map(dec) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, dec(x)]))) : v;
function mergeWorld(arr, incoming) {
  const byId = new Map(arr.map(o => [o.id, o]));
  const out = (incoming || []).map(n => { const d = dec(n), o = byId.get(d.id); return o ? Object.assign(o, d) : d; });   // keeps each object's own visual state
  arr.length = 0; arr.push(...out);
}
function applySnap(s, events) {
  const wasPhase = G.phase; NET.lastHold = s.hold || null;
  if (s.sw) clockSample(s.sw);
  if (G.phase !== 'over') G.phase = s.ph; G.time = s.time; G.elapsed = s.el; G.overtime = s.ot; G.lastDmgT = s.lastDmgT;
  for (const S of ['A', 'B']) {
    const sd = G.sides[S], o = dec(s.sides[S]), tx = o.x, ty = o.y; delete o.x; delete o.y;
    if (S === 'A') { delete o.manual; delete o.manualT; if (NET.predicting) { delete o.vx; delete o.vy; } }   // this phone owns its own steering and, while predicting, its velocity: the server's copy is a round trip old
    const activeChanged = o.active !== sd.active;
    Object.assign(sd, o); sd._tx = tx; sd._ty = ty;
    const buf = NET.interp[S]; const jump = activeChanged || sd.state === 'entering' || (buf.length && Math.hypot(tx - buf[buf.length - 1].x, ty - buf[buf.length - 1].y) > 160);
    if (jump) buf.length = 0;
    buf.push({ t: s.sw || performance.now(), x: tx, y: ty }); if (buf.length > 40) buf.shift();
    if (sd.x == null || jump) { sd.x = tx; sd.y = ty; if (S === 'A') NET.hist = []; }
    if (S === 'A' && NET.predicting && !jump) reconcile(tx, ty);
    for (const [i, mon] of Object.entries(s.tm[S] || {})) Object.assign(sd.team[+i], dec(mon));
  }
  mergeWorld(G.shots, s.shots); mergeWorld(G.beams, s.beams); mergeWorld(G.marks, s.marks); mergeWorld(G.waves, s.waves);
  G.hudDirty = true;
  for (const ev of events || []) {
    const [name, ...args] = ev;
    if (name === '__log') { onLog(args[0], args[1]); continue; }
    const f = VFX[name]; if (typeof f === 'function') { try { f.apply(VFX, args.map(dec)); } catch (e) { console.error(e); } }
    if (name === 'sendOut' && (G.phase === 'intro')) { const S = args[0]; sendOutDone(S).then(() => netSend({ t: 'cue', s: S })); }
  }
  // your Pokémon fainted: choose the next one (the server waits up to 20 seconds, then picks for you)
  if (G.phase === 'pick' && G.sides.A.state === 'wait' && !NET.pickShown) { NET.pickShown = true; onNeedPick(); }
  if (G.phase === 'pick' && s.pickLeft) {           // live countdown so nobody wonders why the battle stopped
    const secs = Math.ceil(Math.max(s.pickLeft.A, s.pickLeft.B) / 1000);
    if (secs !== NET.pickSecs) { NET.pickSecs = secs;
      if (G.sides.A.state === 'wait') { const h = document.querySelector('#ovSwitch h2, #ovSwitch h3'); if (h) h.textContent = `Choose your next Pokémon — ${secs}s`; }
      else toast(`Your opponent is choosing their next Pokémon… ${secs}s`); }
  } else NET.pickSecs = null;
  if (G.phase !== 'pick') NET.pickShown = false;
  updateHUD();
}
// Between snapshots: glide toward the server's positions and keep projectiles and timers moving.
function netStep(dt) {
  if (!G) return;
  if (NET.latest) { const snap = NET.latest, ev = NET.evq; NET.latest = null; NET.evq = []; applySnap(snap, ev); }
  const now0 = performance.now(), age = now0 - NET.lastSnap;      // battle updates only: a ping reply is not proof the battle is flowing
  watchConnection(age, now0);
  predictOrInterpolate(dt);                                // your own Pokémon always answers the stick, even between updates
  if (age > 750) return;                                   // no fresh data for a while: hold the clock rather than run ahead of the server
  G.time += dt; if (G.phase === 'battle') G.elapsed += dt;
  for (const S of ['A', 'B']) {
    const sd = G.sides[S];
    sd.hit = Math.max(0, sd.hit - dt); sd.hop = Math.max(0, sd.hop - dt / 300); if (sd.state !== 'idle') sd.stateT += dt;
    if (sd.cast) sd.cast.t += dt;
    const m = sd.team[sd.active]; if (m && G.phase === 'battle') for (let i = 0; i < m.cd.length; i++) m.cd[i] = Math.max(0, m.cd[i] - dt);
  }
  for (const p of G.shots) { p.t += dt; p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; }
  for (const mk of G.marks) mk.t += dt;
  for (const b of G.beams) b.t += dt;
  for (const w of G.waves) w.r += w.speed * dt / 1000;
  // send the joystick (or WASD) to the server ~15 times a second while it is held
  const a = G.sides.A, now = performance.now(), on = G.phase === 'battle' && a.manualT > 0;
  if (on && now - NET.lastSteer > 66) { netSend({ t: 'in', x: a.manual.x, y: a.manual.y }); NET.lastSteer = now; NET.steerOn = true; }
  else if (!on && NET.steerOn) { netSend({ t: 'in', off: true }); NET.steerOn = false; }
  if (a.manualT > 0) a.manualT -= dt;
}
function endOnline(winner, big, reason, keepConnection) {
  if (NET.over) return; NET.over = true;
  G.phase = 'over'; G.winner = winner; G.decision = reason || '';
  G.shots.length = G.marks.length = G.waves.length = 0;
  showOverlay('ovSwitch', false);
  try { onBattleEnd(winner, big); } catch (e) { console.error(e); }
}

/* ---------- local actions become messages while online ---------- */
const _simStep = simStep; simStep = dt => NET.active ? netStep(dt) : _simStep(dt);
const _queueMove = queueMove; queueMove = i => {
  if (!NET.active) return _queueMove(i);
  if (!G || G.phase !== 'battle') return;
  if (performance.now() - NET.lastSnap > 600 || !NET.ws || NET.ws.readyState !== 1) { toast('Waiting for the connection…'); return; }
  netSend({ t: 'mv', i }); const sd = side('A'); if (!sd.cast) { sd.queued = i; sd.queuedT = 600; }
};
const _requestSwitch = requestSwitch; requestSwitch = (S, idx) => { if (!NET.active) return _requestSwitch(S, idx); if (S === 'A') netSend({ t: 'sw', i: idx }); return true; };
const _megaEvolve = megaEvolve; megaEvolve = S => { if (!NET.active) return _megaEvolve(S); if (S === 'A' && canMega('A')) { netSend({ t: 'mega' }); return true; } return false; };
const _forcePick = forcePick; forcePick = i => { if (!NET.active) return _forcePick(i); if (side('A').team[i] && side('A').team[i].hp > 0) { netSend({ t: 'pick', i }); showOverlay('ovSwitch', false); } };
const _autosave = autosave; autosave = () => { if (!NET.active) _autosave(); };
const _togglePause = togglePause; togglePause = () => { if (NET.active) { toast('Online battles can’t be paused.'); return; } _togglePause(); };
const _toggleWatch = toggleWatch; toggleWatch = () => { if (NET.active) { toast('Watch mode is off in online battles.'); return; } _toggleWatch(); };
for (const id of ['bPause', 'tPause']) { const b = $(id); if (b) b.onclick = () => togglePause(); }
{ const b = $('bWatch'); if (b) b.onclick = () => toggleWatch(); }
for (const id of ['rRematch', 'bRematch']) { const b = $(id); if (!b) continue; const old = b.onclick; b.onclick = e => { if (NET.active) { if (NET.code) { netSend({ t: 'rematch' }); toast('Rematch requested — waiting for your opponent…'); } else toast('Your opponent has left. Go to the main menu to start a new game.'); return; } old && old(e); }; }
const _showStart = showStart; showStart = () => { if (NET.active) leaveOnline(); _showStart(); syncOnlineUi(); };
{ const b = $('rMenu'); if (b) b.onclick = () => showStart(); }          // this button captured the old function at start-up

/* ---------- start screen: Local / Online ---------- */
(function onlineUi() {
  const st = document.createElement('style');
  st.textContent = `#startOv .st-mode{display:flex;justify-content:center;margin:2px auto 0;border-radius:999px;background:rgba(0,0,0,.35);padding:3px;width:max-content;gap:0}
#startOv .st-mode button{border:0;border-radius:999px;padding:7px 18px;font:700 13px var(--ui);color:#c7cff0;background:transparent;cursor:pointer;letter-spacing:.06em}
#startOv .st-mode button.on{background:#ffd84a;color:#2a1206}
#startOv .st-online{display:none;position:absolute;inset:0;border-radius:22px;padding:16px;flex-direction:column;gap:10px;justify-content:center;
  background:linear-gradient(200deg,#23407c,#151c4a 60%,#121838);box-shadow:inset 0 0 0 2px rgba(74,166,255,.45);z-index:2}
#startOv.online .st-online{display:flex}
#startOv.online .st-ctrl,#startOv.online #stNoteA,#startOv.online #stGo{display:none}
#startOv .st-online h3{margin:0;font-family:var(--display);font-size:26px;color:#6fb8ff;letter-spacing:.5px}
#startOv .st-online p{margin:0;font:13px var(--ui);color:#c7cff0}
#startOv .st-online input{background:rgba(6,10,28,.85);border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:9px 11px;color:#fff;font:15px var(--ui);min-width:0}
#startOv .st-online .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#startOv .st-online .row input{flex:1}
#startOv .st-online .big{border:0;border-radius:12px;padding:10px 16px;font:800 14px var(--ui);cursor:pointer;background:#ffd84a;color:#2a1206}
#startOv .st-online .big.alt{background:#fff;color:#141a33}
#startOv #olCodeShow{font-family:var(--display);font-size:44px;letter-spacing:8px;color:#ffd84a;text-align:center;min-height:0}
#startOv #olCodeShow:empty{display:none}
#startOv .st-online>*{flex-shrink:0}#startOv #olCodeShow{padding:2px 0 4px}
#startOv #olStatus{font:600 12px var(--ui);color:#a9b6ff;min-height:16px}
#startOv #olStatus[data-kind=err]{color:#ff8a8a}#startOv #olStatus[data-kind=ok]{color:#8affb0}
@media (max-height:560px){#startOv .st-online{padding:8px 10px;gap:5px;border-radius:16px}#startOv .st-online h3{font-size:17px}#startOv .st-online p{display:none}
 #startOv .st-online input{padding:5px 8px;font-size:12px}#startOv .st-online .big{padding:6px 10px;font-size:12px}#startOv #olCodeShow{position:absolute;top:7px;right:14px;font-size:22px;letter-spacing:4px;line-height:1;padding:0}#startOv #olStatus{font-size:10px;line-height:1.25}
 #startOv .st-online{justify-content:flex-start;overflow-y:auto}}`;
  document.head.appendChild(st);
  const head = document.querySelector('#startOv .st-head');
  const mode = document.createElement('div'); mode.className = 'st-mode'; mode.setAttribute('role', 'group'); mode.setAttribute('aria-label', 'Battle type');
  mode.innerHTML = '<button type="button" data-m="local">LOCAL vs AI</button><button type="button" data-m="online">ONLINE vs PLAYER</button>';
  head.appendChild(mode);
  const blue = document.querySelector('#startOv .st-side.blue'), panel = document.createElement('div'); panel.className = 'st-online';
  panel.innerHTML = `<h3>Online battle</h3><p>Both phones connect to your Arena 151 server. The host picks the arena; each player brings their own trainer and team (set yours on the left).</p>
    <div class="row"><input id="olServer" placeholder="Server address, e.g. 192.168.1.20" autocomplete="off" inputmode="url" aria-label="Server address"></div>
    <div class="row"><button type="button" class="big" id="olHost">Host game</button><input id="olCode" maxlength="4" placeholder="CODE" autocomplete="off" aria-label="Game code" style="text-transform:uppercase;max-width:110px;text-align:center;letter-spacing:3px"><button type="button" class="big alt" id="olJoin">Join game</button></div>
    <div id="olCodeShow" aria-live="polite"></div><div id="olStatus" aria-live="polite"></div>`;
  blue.appendChild(panel);
  $('olServer').value = NET.url; $('olHost').onclick = hostGame; $('olJoin').onclick = joinGame;
  $('olCode').onkeydown = e => { if (e.key === 'Enter') joinGame(); };
  for (const b of mode.children) b.onclick = () => { NET.mode = b.dataset.m; try { localStorage.setItem('arena151.mode', NET.mode); } catch (e) { } if (NET.mode === 'local' && NET.code) leaveOnline(); syncOnlineUi(); };
  syncOnlineUi();
})();
function syncOnlineUi() {
  const ov = $('startOv'); if (!ov) return; ov.classList.toggle('online', NET.mode === 'online');
  for (const b of document.querySelectorAll('#startOv .st-mode button')) { b.classList.toggle('on', b.dataset.m === NET.mode); b.setAttribute('aria-pressed', String(b.dataset.m === NET.mode)); }
  if (NET.mode === 'online' && !NET.status) netStatus('Enter your server address, then host a game or join one with a code.');
}

/* ---------- connection health: banner, reconnect-and-resume, ping ---------- */
(function netUi() {
  const st = document.createElement('style');
  st.textContent = `#netBanner{position:absolute;left:50%;top:64px;transform:translateX(-50%);z-index:9;display:none;padding:8px 16px;border-radius:12px;font:700 14px var(--ui);color:#fff;
  background:rgba(170,40,40,.92);box-shadow:0 6px 20px rgba(0,0,0,.4);pointer-events:none;text-align:center;white-space:nowrap}
#netBanner.show{display:block}#netBanner.warn{background:rgba(190,120,20,.95)}
#netPing{position:absolute;left:50%;top:44px;transform:translateX(-50%);z-index:7;font:700 11px var(--ui);color:#8affb0;text-shadow:0 1px 2px #000;pointer-events:none;display:none}
#netPing.show{display:block}#netPing.mid{color:#ffd84a}#netPing.bad{color:#ff8a8a}`;
  document.head.appendChild(st);
  const host = scene.parentElement;
  const b = document.createElement('div'); b.id = 'netBanner'; b.setAttribute('role', 'status'); host.appendChild(b);
  const p = document.createElement('div'); p.id = 'netPing'; host.appendChild(p);
})();
function netBanner(text, warn) { const b = $('netBanner'); if (!b) return; b.textContent = text; b.classList.toggle('show', !!text); b.classList.toggle('warn', !!warn); }
function watchConnection(age, now) {
  const p = $('netPing');
  if (p) { const on = NET.active && NET.rtt != null; p.classList.toggle('show', on); if (on) { p.textContent = `ping ${NET.rtt} ms`; p.classList.toggle('mid', NET.rtt >= 120 && NET.rtt < 250); p.classList.toggle('bad', NET.rtt >= 250); } }
  if (!NET.active || NET.over) { netBanner(''); return; }
  const hold = NET.lastHold, rxAge = now - NET.lastRx;
  if (NET.reconnecting) netBanner(`Reconnecting… ${Math.max(0, Math.ceil((NET.reconnecting - now) / 1000))}s`);
  else if (hold && hold.side === 'B') netBanner(`Opponent's connection dropped — waiting ${Math.ceil(hold.left / 1000)}s`, true);
  else if (rxAge > 3000) netBanner('Connection unstable — waiting for the server…', true);
  else if (age > 1500) netBanner('Battle updates paused — resyncing…', true);
  else netBanner('');
  if (NET.reconnecting || !NET.ws) return;
  if (age < 1500) NET.resyncs = 0;
  // The server answers but battle updates stopped: ask for a full update on this same connection (no reconnect, no pause).
  if (age > 2500 && rxAge < 2500 && now - (NET.lastResync || 0) > 3000 && !(hold && hold.side === 'B')) {
    NET.lastResync = now; NET.resyncs = (NET.resyncs || 0) + 1;
    if (NET.resyncs <= 3) { netSend({ t: 'resync', code: NET.code, token: NET.token, why: `no battle update for ${Math.round(age / 100) / 10}s` }); return; }
  }
  // Truly dead (nothing at all for 8 s), or three resyncs did not help: reconnect on a fresh connection.
  if (rxAge > 8000 || (NET.resyncs > 3 && age > 2500)) {
    NET.reconnectWhy = rxAge > 8000 ? `nothing received for ${Math.round(rxAge / 1000)}s` : 'resync did not restore updates';
    NET.resyncs = 0;
    const dead = NET.ws; NET.ws = null; dead.onclose = dead.onmessage = null; try { dead.close(); } catch (e) { } startReconnect();
  }
}
// Reconnect to the same match with this player's token (the server holds the battle for 20 seconds).
function startReconnect() {
  if (NET.reconnecting || NET.over) return;
  NET.reconnecting = performance.now() + 30000; netBanner('Reconnecting…');
  const attempt = () => {
    if (!NET.reconnecting || NET.over) return;
    if (performance.now() > NET.reconnecting) { NET.reconnecting = 0; netBanner(''); endOnline('B', 'DISCONNECTED', 'Lost the connection to the server.'); return; }
    let ws; try { ws = new WebSocket(NET.wsUrl); } catch (e) { setTimeout(attempt, 1500); return; }
    ws._url = NET.wsUrl; const giveUp = setTimeout(() => { if (ws.readyState !== 1) { try { ws.close(); } catch (e) { } } }, 4000);   // an attempt never hangs
    ws.onopen = () => { clearTimeout(giveUp); NET.ws = ws; ws.send(JSON.stringify({ t: 'hello', v: APP_VERSION })); ws.send(JSON.stringify({ t: 'resume', code: NET.code, token: NET.token, why: NET.reconnectWhy || 'connection lost' })); NET.reconnectWhy = ''; };
    ws.onmessage = e => { NET.lastRx = performance.now(); let m; try { m = JSON.parse(e.data); } catch (x) { return; } onNetMessage(m); };
    ws.onclose = () => { if (NET.ws === ws) NET.ws = null; if (NET.reconnecting) setTimeout(attempt, 1500); else if (NET.active && !NET.over) startReconnect(); };
    ws.onerror = () => {};
  };
  attempt();
}
setInterval(() => { if (NET.ws && NET.ws.readyState === 1) netSend({ t: 'ping', c: performance.now() }); }, 2000);   // in battle, lobby or bracket

/* ---------- latency hiding: client-side prediction, server reconciliation, entity interpolation ---------- */
// Server clock vs this phone's clock (plus the fastest one-way delay), from the server time stamped on each update.
function clockSample(sw) {
  const now = performance.now(), o = sw - now; NET.offs.push([now, o]);   // monotonic: phone clock corrections can't disturb smoothing
  while (NET.offs.length && now - NET.offs[0][0] > 4000) NET.offs.shift();
  let best = -Infinity; for (const [, v] of NET.offs) if (v > best) best = v;             // least-delayed update = best estimate
  NET.clockOff = best;
  const spread = NET.offs.map(([, v]) => best - v).sort((a, b) => a - b);
  NET.jitter = spread[Math.floor(spread.length * .9)] || 0;
}
// Draw others slightly in the past, between two real updates: smooth even when updates arrive unevenly or one is lost.
function interpAt(buf, t) {
  if (!buf.length) return null;
  if (t <= buf[0].t) return buf[0];
  for (let i = buf.length - 1; i > 0; i--) {
    const a = buf[i - 1], b = buf[i];
    if (t >= a.t && t <= b.t) { const f = (t - a.t) / Math.max(1, b.t - a.t); return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }; }
  }
  const b = buf[buf.length - 1], a = buf[buf.length - 2];
  if (!a) return b;
  const over = Math.min(120, t - b.t), f = over / Math.max(1, b.t - a.t);                 // briefly continue the last motion
  return { x: b.x + (b.x - a.x) * f, y: b.y + (b.y - a.y) * f };
}
function predictOrInterpolate(dt) {
  const delay = Math.min(300, 75 + (NET.jitter || 0)), renderT = performance.now() + (NET.clockOff || 0) - delay;
  const a = G.sides.A, me = act('A');
  // Your Pokémon: moves the instant you steer, using the same movement rules as the server.
  const steering = !NET.noPredict && G.phase === 'battle' && a.manualT > 0 && a.state === 'idle' && me && me.hp > 0 && !isRooted('A');
  if (steering) {
    if (!NET.predicting) { NET.predicting = true; NET.hist = []; NET.corr = { x: 0, y: 0 }; }
    const keepT = a.manualT; try { move('A', dt, false); } catch (e) { } a.manualT = keepT;
    const kc = 1 - Math.exp(-dt / 100), cx = NET.corr.x * kc, cy = NET.corr.y * kc;           // fold server corrections in gently
    a.x += cx; a.y += cy; NET.corr.x -= cx; NET.corr.y -= cy;
    for (const h of NET.hist) { h.x += cx; h.y += cy; }
    [a.x, a.y] = clampWalk(a.x, a.y);
    const now = performance.now(); NET.hist.push({ t: now, x: a.x, y: a.y });
    while (NET.hist.length && now - NET.hist[0].t > 1500) NET.hist.shift();
  } else {
    if (NET.predicting) { NET.predicting = false; NET.hist = []; }
    const p = interpAt(NET.interp.A, renderT); if (p) { const k = 1 - Math.exp(-dt / 60); a.x += (p.x - a.x) * k; a.y += (p.y - a.y) * k; }
  }
  const b = G.sides.B, p = interpAt(NET.interp.B, renderT);
  if (p) { b.x = p.x; b.y = p.y; }
}
// The server's position is where you were about one round trip ago: compare against that moment and correct the difference.
function reconcile(tx, ty) {
  const rtt = NET.rtt != null ? NET.rtt : 100, at = performance.now() - rtt - 25;
  let h = null; for (const e of NET.hist) { if (e.t <= at) h = e; else break; }
  if (!h) return;
  const ex = tx - h.x, ey = ty - h.y;
  if (Math.hypot(ex, ey) > 150) { const a = G.sides.A; a.x = tx; a.y = ty; NET.hist = []; NET.corr = { x: 0, y: 0 }; return; }   // knocked back / teleported
  NET.corr = { x: ex, y: ey };
}
// A phone that changes network (Wi-Fi <-> mobile data) or comes back to the foreground checks its connection right away.
function quickCheck() {
  if (!NET.active || NET.over || NET.reconnecting || !NET.ws) return;
  if (performance.now() - NET.lastRx > 2500) { const dead = NET.ws; NET.ws = null; dead.onclose = dead.onmessage = null; try { dead.close(); } catch (e) { } NET.reconnectWhy = 'network changed'; startReconnect(); }
  else netSend({ t: 'ping', c: performance.now() });
}
window.addEventListener('online', () => setTimeout(quickCheck, 300));
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(quickCheck, 300); });
