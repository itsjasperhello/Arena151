/* =====================================================================
   Section 18: online battles (client side)
   The battle runs on the Arena 151 server. This phone sends its input
   (joystick, moves, switches, Mega, picks) and draws the snapshots the
   server streams; between snapshots it glides Pokémon and projectiles
   so motion stays smooth. You always play Red, on the left.
   ===================================================================== */
const NET = { ws: null, active: false, mode: 'local', url: '', status: '', code: null, over: false, pickShown: false, steerOn: false, lastSteer: 0, prevTrsel: null };
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
    ws._url = url; NET.ws = ws; let ok = false;
    const fail = setTimeout(() => { if (!ok) { netStatus('No answer from ' + url + '. Is the server running, and is this device on the same network?', 'err'); try { ws.close(); } catch (e) { } rej(); } }, 6000);
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', v: APP_VERSION }));
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t === 'hi' && !ok) { ok = true; clearTimeout(fail); netStatus('Connected to the server (v' + m.v + ').', 'ok'); res(); } onNetMessage(m); };
    ws.onclose = () => { clearTimeout(fail); if (NET.ws === ws) { NET.ws = null; if (NET.active && !NET.over) { netStatus('Connection lost.', 'err'); endOnline('A', 'DISCONNECTED', 'Connection to the server was lost.', true); } } if (!ok) rej(); };
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
    case 'snap': if (NET.active && G) applySnap(m.s, m.ev); break;
    case 'countdown': if (NET.active) battleCountdown(epoch); break;
    case 'over': if (NET.active) endOnline(m.winner, m.big, m.reason); break;
    case 'rematchAsked': toast('Your opponent wants a rematch — tap Rematch to play again.'); break;
    case 'opponentLeft': if (NET.active) { toast('Your opponent left the game.'); if (!NET.over) endOnline('A', 'FORFEIT', 'Your opponent left the game.'); NET.code = null; } else netStatus('Your opponent left.', 'err'); break;
  }
}
async function beginOnline(m) {
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
  const wasPhase = G.phase;
  if (G.phase !== 'over') G.phase = s.ph; G.time = s.time; G.elapsed = s.el; G.overtime = s.ot; G.lastDmgT = s.lastDmgT;
  for (const S of ['A', 'B']) {
    const sd = G.sides[S], o = dec(s.sides[S]), tx = o.x, ty = o.y; delete o.x; delete o.y;
    const activeChanged = o.active !== sd.active;
    Object.assign(sd, o); sd._tx = tx; sd._ty = ty;
    if (activeChanged || sd.x == null || Math.hypot(tx - sd.x, ty - sd.y) > 140 || sd.state === 'entering') { sd.x = tx; sd.y = ty; }
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
  if (G.phase === 'pick' && G.sides.B.state === 'wait' && G.sides.A.state !== 'wait' && wasPhase !== 'pick') toast('Your opponent is choosing their next Pokémon…');
  if (G.phase !== 'pick') NET.pickShown = false;
  updateHUD();
}
// Between snapshots: glide toward the server's positions and keep projectiles and timers moving.
function netStep(dt) {
  if (!G) return;
  G.time += dt; if (G.phase === 'battle') G.elapsed += dt;
  const k = 1 - Math.exp(-dt / 55);
  for (const S of ['A', 'B']) {
    const sd = G.sides[S]; if (sd._tx != null) { sd.x += (sd._tx - sd.x) * k; sd.y += (sd._ty - sd.y) * k; }
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
  if (!G || G.phase !== 'battle') return; netSend({ t: 'mv', i }); const sd = side('A'); if (!sd.cast) { sd.queued = i; sd.queuedT = 600; }
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
#startOv #olStatus{font:600 12px var(--ui);color:#a9b6ff;min-height:16px}
#startOv #olStatus[data-kind=err]{color:#ff8a8a}#startOv #olStatus[data-kind=ok]{color:#8affb0}
@media (max-height:560px){#startOv .st-online{padding:8px 10px;gap:5px;border-radius:16px}#startOv .st-online h3{font-size:17px}#startOv .st-online p{display:none}
 #startOv .st-online input{padding:5px 8px;font-size:12px}#startOv .st-online .big{padding:6px 10px;font-size:12px}#startOv #olCodeShow{font-size:26px;letter-spacing:5px}#startOv #olStatus{font-size:10px}}`;
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
