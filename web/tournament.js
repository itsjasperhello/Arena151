/* =====================================================================
   Section 19: tournaments (client side)
   Host a tournament for up to 16 players; everyone joins with the code.
   The server draws a random single-elimination bracket; this screen
   shows the players, the live bracket and the champion. Your matches
   start automatically and you come back here after each one.
   ===================================================================== */
NET.tour = null;     // { code, you, token, state }
const tourMe = () => NET.tour && NET.tour.state && NET.tour.state.players.find(p => p.id === NET.tour.you);
const tourName = id => { const p = NET.tour && NET.tour.state && NET.tour.state.players.find(x => x.id === id); return p ? p.name : ''; };
function roundTitle(k, n) { const fromEnd = n - 1 - k; return fromEnd === 0 ? 'Final' : fromEnd === 1 ? 'Semifinals' : fromEnd === 2 ? 'Quarterfinals' : `Round ${k + 1}`; }

/* ---------- start screen: name, tournament size, host tournament ---------- */
(function tourControls() {
  const panel = document.querySelector('#startOv .st-online'); if (!panel) return;
  const codeRow = $('olCode').parentElement;
  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = `<input id="olName" maxlength="16" placeholder="Your name" aria-label="Your name" style="max-width:150px">
    <select id="olSize" aria-label="Tournament size">${Array.from({ length: 15 }, (_, k) => k + 2).map(n => `<option value="${n}"${n === 8 ? ' selected' : ''}>Up to ${n} players</option>`).join('')}</select>
    <button type="button" class="big alt" id="olTHost">Host tournament</button>`;
  codeRow.insertAdjacentElement('afterend', row);
  const st = document.createElement('style');
  st.textContent = `#startOv .st-online select{background:rgba(6,10,28,.85);color:#fff;border:1px solid rgba(255,255,255,.22);border-radius:10px;padding:8px 9px;font:14px var(--ui)}
@media (max-height:560px){#startOv .st-online select{padding:4px 6px;font-size:11px}}`;
  document.head.appendChild(st);
  try { $('olName').value = localStorage.getItem('arena151.name') || ''; } catch (e) { }
  $('olName').onchange = () => { try { localStorage.setItem('arena151.name', $('olName').value.trim()); } catch (e) { } };
  $('olTHost').onclick = hostTournament;
  const p = panel.querySelector('p'); if (p) p.textContent = 'Both phones connect to your Arena 151 server. Duel a friend, or host a tournament for up to 16 players — everyone joins with the same code.';
})();
const playerName = () => ($('olName') && $('olName').value.trim()) || trainerTitle(TRSEL.A);
// every hosted or joined game now carries the player's name
const _myInfo = myInfo; myInfo = () => ({ ..._myInfo(), name: playerName() });
async function hostTournament() {
  try { await netConnect(); } catch (e) { return; }
  netSend({ t: 'thost', ...myInfo(), max: +$('olSize').value || 8, arena: START.arena, timeLimit: +$('stTime').value || 0 });
  netStatus('Creating a tournament…');
}

/* ---------- messages ---------- */
const _onNet = onNetMessage;
onNetMessage = function (m) {
  if (m.t === 'tjoined') {
    NET.tour = { ...(NET.tour || {}), code: m.code, you: m.you, token: m.token };
    if (m.resumed) { NET.reconnecting = 0; netBanner(''); }
    if (!NET.active) showTour();
    return;
  }
  if (m.t === 'tstate') { if (!NET.tour) return; NET.tour.state = m.tour; NET.tour.you = m.you; renderTour(); return; }
  if (m.t === 'start' && NET.tour) hideTour();
  if (m.t === 'over' && NET.tour) setTimeout(() => { if (NET.tour && NET.over && $('ovResults').classList.contains('show')) showTour(); }, 7000);
  if (m.t === 'opponentLeft' && NET.tour && NET.active && !NET.over) toast('Your opponent left — you advance!');
  return _onNet(m);
};

/* ---------- reconnecting into a tournament ---------- */
const _startReconnect = startReconnect;
startReconnect = function () {
  if (!NET.tour) return _startReconnect();
  if (NET.reconnecting) return;
  NET.reconnecting = performance.now() + 20000; netBanner('Reconnecting…');
  const attempt = () => {
    if (!NET.reconnecting || !NET.tour) return;
    if (performance.now() > NET.reconnecting) { NET.reconnecting = 0; netBanner(''); toast('Lost the connection to the tournament.'); if (NET.active && !NET.over) endOnline('B', 'DISCONNECTED', 'Lost the connection to the server.'); return; }
    let ws; try { ws = new WebSocket(NET.wsUrl); } catch (e) { setTimeout(attempt, 1500); return; }
    const giveUp = setTimeout(() => { if (ws.readyState !== 1) { try { ws.close(); } catch (e) { } } }, 4000);
    ws.onopen = () => { clearTimeout(giveUp); NET.ws = ws; ws.send(JSON.stringify({ t: 'hello', v: APP_VERSION })); ws.send(JSON.stringify({ t: 'tresume', code: NET.tour.code, token: NET.tour.token })); };
    ws.onmessage = e => { NET.lastRx = performance.now(); let m; try { m = JSON.parse(e.data); } catch (x) { return; } onNetMessage(m); };
    ws.onclose = () => { if (NET.ws === ws) NET.ws = null; if (NET.reconnecting) setTimeout(attempt, 1500); else if (NET.tour) startReconnect(); };
    ws.onerror = () => {};
  };
  attempt();
};
// The lobby connection is opened by netConnect; while in a tournament, a drop there reconnects too.
setInterval(() => { if (NET.tour && !NET.active && !NET.reconnecting && (!NET.ws || NET.ws.readyState > 1)) startReconnect(); }, 2000);

/* ---------- leaving ---------- */
function leaveTournament() {
  if (NET.tour) netSend({ t: 'tleave' });
  NET.tour = null; hideTour(); document.documentElement.classList.remove('tourmode');
  if (NET.active) leaveOnline();
  else if (NET.prevTrsel) { Object.assign(TRSEL, NET.prevTrsel); NET.prevTrsel = null; try { refreshTrainerLabels(); drawMinis(); } catch (e) { } }
  NET.active = false; showStart();
}
const _showStartT = showStart;
showStart = function () {
  if (NET.tour) { if (!confirm('Leave the tournament?')) { if (!NET.active) showTour(); return; } netSend({ t: 'tleave' }); NET.tour = null; hideTour(); document.documentElement.classList.remove('tourmode'); }
  _showStartT();
};
{ const b = $('rMenu'); if (b) b.onclick = () => { if (NET.tour) showTour(); else showStart(); }; }

/* ---------- the tournament screen ---------- */
(function tourUi() {
  const st = document.createElement('style');
  st.textContent = `
#tourOv{position:fixed;inset:0;z-index:58;display:none;overflow:auto;color:#fff;font-family:var(--ui);background:radial-gradient(1100px 650px at 50% -10%,#3a2f8f 0%,#171a44 45%,#0a0c1e 100%)}
#tourOv.show{display:block}
#tourOv .tw{max-width:1280px;margin:0 auto;padding:16px 18px 24px;display:flex;flex-direction:column;gap:12px;min-height:100%;box-sizing:border-box}
#tourOv .th{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
#tourOv .tt{font-family:var(--display);font-size:clamp(28px,4vw,44px);color:#ffd84a;-webkit-text-stroke:1.5px #3a1608;text-shadow:0 3px 0 #b3471b}
#tourOv .tcode{font-family:var(--display);font-size:clamp(26px,3.6vw,40px);letter-spacing:6px;padding:2px 14px;border-radius:12px;background:rgba(255,255,255,.08);border:1px dashed rgba(255,255,255,.3)}
#tourOv .tstatus{flex:1;min-width:220px;font:700 15px var(--ui);color:#c7cff0}
#tourOv .tbody{display:grid;grid-template-columns:240px 1fr;gap:14px;align-items:start}
#tourOv .tplayers{border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:10px;display:flex;flex-direction:column;gap:5px}
#tourOv .tplayers h4,#tourOv .tbracket h4{margin:0 0 4px;font:800 12px var(--ui);letter-spacing:.18em;text-transform:uppercase;color:#a9b6ff}
#tourOv .tp{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:10px;background:rgba(8,12,32,.5);font:700 14px var(--ui)}
#tourOv .tp.me{box-shadow:inset 0 0 0 2px #ffd84a}#tourOv .tp.out{opacity:.45;text-decoration:line-through}
#tourOv .tp .dot{width:9px;height:9px;border-radius:50%;background:#5a6390;flex:none}#tourOv .tp .dot.on{background:#5be38a}#tourOv .tp .dot.live{background:#ffd84a;box-shadow:0 0 8px #ffd84a}
#tourOv .tp .tag{margin-left:auto;font:800 10px var(--ui);letter-spacing:.06em;color:#ffd84a}
#tourOv .tbracket{border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);padding:10px;overflow-x:auto}
#tourOv .tcols{display:flex;gap:18px;min-width:max-content}
#tourOv .tcol{display:flex;flex-direction:column;gap:8px;min-width:170px}
#tourOv .tcol .tms{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:10px}
#tourOv .tcol h5{margin:0;font:800 11px var(--ui);letter-spacing:.14em;text-transform:uppercase;color:#8f9bd0;text-align:center}
#tourOv .tm{border-radius:12px;background:#121838;border:1px solid rgba(255,255,255,.12);overflow:hidden;position:relative}
#tourOv .tm.live{border-color:#ffd84a;box-shadow:0 0 0 2px rgba(255,216,74,.35),0 0 18px rgba(255,216,74,.25);animation:tmPulse 1.2s ease-in-out infinite alternate}
#tourOv .tm.mine{box-shadow:inset 0 0 0 2px #6fb8ff}
#tourOv .tm .r{display:flex;justify-content:space-between;gap:8px;padding:6px 9px;font:700 13px var(--ui);color:#c7cff0}
#tourOv .tm .r+.r{border-top:1px solid rgba(255,255,255,.08)}
#tourOv .tm .r.win{color:#fff;background:linear-gradient(90deg,rgba(91,227,138,.25),transparent)}#tourOv .tm .r.win::after{content:'✓';color:#5be38a}
#tourOv .tm .r.lose{opacity:.45}#tourOv .tm .r.tbd{color:#5f6895;font-style:italic}
#tourOv .tm .note{font:700 10px var(--ui);color:#ffd84a;padding:0 9px 5px}
@keyframes tmPulse{to{box-shadow:0 0 0 2px rgba(255,216,74,.6),0 0 26px rgba(255,216,74,.45)}}
#tourOv .tfoot{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
#tourOv .tbtn{border:0;border-radius:14px;padding:11px 22px;font:800 15px var(--ui);cursor:pointer;background:rgba(255,255,255,.14);color:#fff}
#tourOv .tbtn.go{font-family:var(--display);font-size:24px;padding:10px 34px;color:#2a1206;background:linear-gradient(#ffe066,#ffb627);box-shadow:0 5px 0 #b86a0d}
#tourOv .tbtn:disabled{opacity:.4;cursor:default}
#tourOv .tchamp{display:none;text-align:center;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(255,216,74,.25),rgba(255,120,60,.15));border:2px solid #ffd84a}
#tourOv .tchamp.show{display:block}#tourOv .tchamp b{display:block;font-family:var(--display);font-size:clamp(30px,5vw,54px);color:#ffd84a;-webkit-text-stroke:1.5px #3a1608;text-shadow:0 4px 0 #b3471b}
@media (max-width:820px),(max-height:560px){#tourOv .tbody{grid-template-columns:1fr}#tourOv .tplayers{flex-direction:row;flex-wrap:wrap}#tourOv .tp{font-size:12px;padding:4px 7px}
 #tourOv .tw{padding:8px 10px 12px;gap:8px}#tourOv .tchamp{padding:6px}#tourOv .tchamp b{font-size:30px}#tourOv .tt{font-size:24px}#tourOv .tcode{font-size:22px}#tourOv .tcol{min-width:140px}#tourOv .tm .r{font-size:11px;padding:4px 7px}#tourOv .tbtn{padding:8px 16px;font-size:13px}#tourOv .tbtn.go{font-size:19px;padding:8px 24px}}
@media (prefers-reduced-motion:reduce){#tourOv .tm.live{animation:none}}`;
  document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'tourOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Tournament');
  ov.innerHTML = `<div class="tw">
    <div class="th"><div class="tt">🏆 TOURNAMENT</div><div class="tcode" id="tourCode"></div><div class="tstatus" id="tourStatus" aria-live="polite"></div></div>
    <div class="tchamp" id="tourChamp"><span>Champion</span><b id="tourChampName"></b></div>
    <div class="tbody"><div class="tplayers" id="tourPlayers"></div><div class="tbracket"><h4>Bracket</h4><div class="tcols" id="tourCols"></div></div></div>
    <div class="tfoot"><button class="tbtn go" id="tourStart" type="button">START TOURNAMENT</button><button class="tbtn" id="tourLeave" type="button">Leave tournament</button></div>
  </div>`;
  document.body.appendChild(ov);
  $('tourStart').onclick = () => netSend({ t: 'tstart' });
  $('tourLeave').onclick = () => { if (confirm('Leave the tournament?')) leaveTournament(); };
})();
function showTour() {
  NET.active = false; document.documentElement.classList.add('tourmode');
  ['ovResults', 'ovSwitch'].forEach(id => showOverlay(id, false)); hideStart();
  $('tourOv').classList.add('show'); renderTour();
}
function hideTour() { const o = $('tourOv'); if (o) o.classList.remove('show'); }
function renderTour() {
  const T = NET.tour && NET.tour.state; if (!T) return;
  const me = tourMe(), active = T.players.filter(p => !p.left), isHost = me && me.id === T.host;
  $('tourCode').textContent = T.code;
  // players
  const pl = $('tourPlayers'); pl.innerHTML = `<h4>Players ${active.length}/${T.max}</h4>`;
  for (const p of T.players) {
    if (p.left && T.phase === 'lobby') continue;
    const d = document.createElement('div'); d.className = 'tp' + (me && p.id === me.id ? ' me' : '') + (!p.alive || p.left ? ' out' : '');
    d.innerHTML = `<span class="dot ${p.inMatch ? 'live' : p.online ? 'on' : ''}"></span><span>${escapeHtml(p.name)}</span><span class="tag">${p.id === T.host ? '★ HOST' : ''}${T.champion === p.id ? ' 🏆' : ''}</span>`;
    pl.appendChild(d);
  }
  // bracket
  const cols = $('tourCols'); cols.innerHTML = '';
  if (!T.rounds.length) cols.innerHTML = `<div style="color:#8f9bd0;font:600 14px var(--ui);padding:20px">The bracket is drawn at random when the host starts the tournament.</div>`;
  T.rounds.forEach((rd, k) => {
    const c = document.createElement('div'); c.className = 'tcol'; c.innerHTML = `<h5>${roundTitle(k, T.rounds.length)}</h5><div class="tms"></div>`; const box = c.lastChild;
    for (const x of rd) {
      const m = document.createElement('div'); m.className = 'tm' + (x.state === 'live' ? ' live' : '') + (me && (x.a === me.id || x.b === me.id) ? ' mine' : '');
      const row = id => { const cls = id == null ? 'tbd' : x.winner == null ? '' : x.winner === id ? 'win' : 'lose'; return `<div class="r ${cls}"><span>${id == null ? (x.state === 'bye' ? '— bye —' : 'TBD') : escapeHtml(tourName(id))}</span></div>`; };
      m.innerHTML = row(x.a) + row(x.b) + (x.note && x.note !== 'Bye' ? `<div class="note">${escapeHtml(x.note)}</div>` : x.state === 'live' ? '<div class="note">LIVE</div>' : x.state === 'starting' ? '<div class="note">Starting…</div>' : '');
      box.appendChild(m);
    }
    cols.appendChild(c);
  });
  // status
  let msg;
  if (T.phase === 'lobby') msg = isHost ? `Share the code. ${active.length} of ${T.max} joined — start whenever you're ready (at least 2).` : `Waiting for the host to start… ${active.length} of ${T.max} joined.`;
  else if (T.phase === 'done') msg = T.champion === (me && me.id) ? 'You won the tournament!' : 'The tournament is over.';
  else if (me && !me.alive) msg = 'You were knocked out — follow the rest of the bracket here.';
  else if (me && me.inMatch) msg = 'Your match is starting…';
  else { const nextMine = T.rounds.flat().find(x => (x.a === me.id || x.b === me.id) && x.state !== 'done' && x.state !== 'bye'); msg = nextMine && nextMine.state === 'starting' ? 'Your next match starts in a few seconds!' : nextMine ? 'You advance! Waiting for your next opponent…' : 'Waiting…'; }
  $('tourStatus').textContent = msg;
  $('tourStart').style.display = T.phase === 'lobby' && isHost ? '' : 'none'; $('tourStart').disabled = active.length < 2;
  $('tourChamp').classList.toggle('show', T.phase === 'done' && T.champion != null); $('tourChampName').textContent = T.champion != null ? tourName(T.champion) : '';
}
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// in a tournament the results screen offers the bracket instead of rematch / swap / edit teams
(function tourResultsCss() { const st = document.createElement('style'); st.textContent = `.tourmode #rRematch,.tourmode #rSwap,.tourmode #rTeams{display:none!important}`; document.head.appendChild(st);
  const relabel = () => { const b = $('rMenu'); if (b) b.textContent = NET.tour ? 'Back to bracket' : 'Main menu'; }; setInterval(relabel, 500); })();
