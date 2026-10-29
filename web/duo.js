/* =====================================================================
   Section 29: on-screen controls editor + two players on one device
   1) Settings → "Customize controls": drag the joystick, the move panel,
      the team bar and the pause bar anywhere; tap one and use the slider
      (or pinch) to resize it. Saved on the device as screen fractions.
   2) Local battle on a phone or tablet with both sides HUMAN: the players
      sit at the two short ends facing each other. Each gets a panel along
      their end, rotated to face them: four big move buttons nearest them,
      and right above them their six Pokémon (avatar, HP, knocked out,
      current one marked) plus a Z button. No joystick or dodge — both
      Pokémon move on their own; players choose moves and switches.
      After a knockout, the player whose Pokémon fainted picks the next
      one from their own row.
   ===================================================================== */
window.duoCapable = () => document.documentElement.classList.contains('appmode') || !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
(function duoAndControls() {
  const $ = id => document.getElementById(id);
  const css = document.createElement('style'); css.textContent = `
  /* ---------- controls editor ---------- */
  html.ctl-editing .touch-ui{display:block!important;z-index:9001!important}
  html.ctl-editing #stick,html.ctl-editing #touchUI .tright,html.ctl-editing #tRosterSlot,html.ctl-editing #touchUI .tbar{visibility:visible!important;outline:2px dashed rgba(255,216,74,.85);outline-offset:4px;cursor:grab;touch-action:none}
  html.ctl-editing #touchUI .tright{min-width:150px;min-height:110px}
  html.ctl-editing #tRosterSlot{min-width:200px;min-height:44px}
  html.ctl-editing .ctl-sel{outline:3px solid #ffd84a!important;box-shadow:0 0 0 6px rgba(255,216,74,.25)}
  #ctlEdit{position:fixed;inset:0;z-index:9002;background:rgba(5,8,20,.55);pointer-events:none;display:none}
  #ctlEdit.show{display:block}
  #ctlEdit .bar{position:fixed;z-index:9003;left:50%;top:38%;transform:translate(-50%,-50%);pointer-events:auto;background:#141c34;border:2px solid #ffd84a;border-radius:14px;padding:10px 14px;color:#fff;font:600 13px Rubik,sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;max-width:94vw;box-shadow:0 8px 30px rgba(0,0,0,.5)}
  #ctlEdit .bar b{color:#ffd84a}
  #ctlEdit input[type=range]{width:140px;accent-color:#ffd84a}
  #ctlEdit button{border:0;border-radius:10px;padding:8px 14px;font:800 13px Rubik,sans-serif;cursor:pointer}
  #ctlEdit .done{background:#ffd84a;color:#141c34}#ctlEdit .reset{background:#2a3456;color:#fff}
  /* ---------- two players on one device ---------- */
  html.duo #stick,html.duo #touchUI .tright,html.duo #tRosterSlot,html.duo #ovSwitch{display:none!important}
  .duo-pad{--P:172px;position:fixed;top:0;left:0;width:100vh;height:var(--P);transform-origin:0 0;z-index:7;display:none;flex-direction:column;justify-content:flex-end;gap:6px;padding:6px 10px calc(6px + env(safe-area-inset-left,0px));box-sizing:border-box;
    background:linear-gradient(0deg,rgba(8,12,30,.92),rgba(8,12,30,.55) 70%,rgba(8,12,30,0));pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;font-family:Rubik,sans-serif}
  html.duo .duo-pad{display:flex}
  #duoA{transform:translate(var(--P),0) rotate(90deg)}
  #duoB{transform:translate(calc(100vw - var(--P)),100vh) rotate(-90deg)}
  .duo-top{display:flex;gap:6px;align-items:stretch}
  .duo-team{flex:1;display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
  .duo-mon{position:relative;border:2px solid rgba(255,255,255,.25);border-radius:10px;background:#101830;padding:2px 2px 6px;display:flex;align-items:center;justify-content:center;min-height:44px;cursor:pointer}
  .duo-mon canvas{width:34px;height:34px;image-rendering:pixelated}
  .duo-mon .hp{position:absolute;left:4px;right:4px;bottom:3px;height:3px;border-radius:2px;background:#2a3050;overflow:hidden}.duo-mon .hp i{display:block;height:100%;background:#5ce07a}
  .duo-mon.act{border-color:#ffd84a;box-shadow:0 0 8px rgba(255,216,74,.6)}
  .duo-mon.ko{filter:grayscale(1) brightness(.5)}.duo-mon.ko::after{content:'✕';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#ff5a5a;font:900 24px Rubik,sans-serif}
  .duo-mon.pickme{animation:duoPulse .8s infinite alternate;border-color:#7ad7ff}
  @keyframes duoPulse{to{box-shadow:0 0 14px #7ad7ff}}
  .duo-z{width:58px;border:0;border-radius:12px;font:900 20px "Lilita One",Rubik,sans-serif;color:#141c34;background:linear-gradient(0deg,#ffd84a var(--z,0%),#3a4366 var(--z,0%));cursor:pointer}
  .duo-z:disabled{opacity:.55}
  .duo-moves{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  .duo-move{position:relative;overflow:hidden;min-height:70px;border:0;border-radius:14px;color:#fff;font:800 14px Rubik,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.7);cursor:pointer;padding:4px}
  .duo-move small{display:block;font-size:10px;font-weight:600;opacity:.85}
  .duo-move .cd{position:absolute;left:0;top:0;bottom:0;background:rgba(0,0,0,.55);pointer-events:none}
  .duo-move.queued{outline:3px solid #fff}
  .duo-name{font:800 11px Rubik,sans-serif;color:#ffd84a;letter-spacing:.06em;text-align:center}
  .duo-msg{position:absolute;left:0;right:0;top:-22px;text-align:center;font:800 13px Rubik,sans-serif;color:#7ad7ff;text-shadow:0 1px 3px #000;pointer-events:none}`;
  document.head.appendChild(css);

  /* ---------- 1) the controls editor ---------- */
  const LAYOUT_KEY = 'arena151.ctlLayout';
  const ITEMS = [['stick', '#stick', 'Joystick'], ['moves', '#touchUI .tright', 'Moves & Z'], ['team', '#tRosterSlot', 'Team'], ['bar', '#touchUI .tbar', 'Pause & menu']];
  let layout = {}; try { layout = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}') || {}; } catch (e) { layout = {}; }
  const elOf = sel => document.querySelector(sel);
  function applyLayout() { for (const [k, sel] of ITEMS) { const el = elOf(sel); if (!el) continue; const L = layout[k] || { dx: 0, dy: 0, s: 1 }; el.style.translate = `${Math.round(L.dx * innerWidth)}px ${Math.round(L.dy * innerHeight)}px`; el.style.scale = String(L.s || 1); } }
  const saveLayout = () => { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch (e) { } };
  addEventListener('resize', applyLayout); setTimeout(applyLayout, 0);
  const ed = document.createElement('div'); ed.id = 'ctlEdit';
  ed.innerHTML = `<div class="bar"><span>Drag a control to move it · tap one, then resize · pinch works too</span><span>Selected: <b id="ctlSelName">none</b></span>
    <label>Size <input id="ctlSize" type="range" min="0.6" max="1.8" step="0.05" value="1" disabled></label><button class="reset" id="ctlReset" type="button">Reset</button><button class="done" id="ctlDone" type="button">Done</button></div>`;
  document.body.appendChild(ed);
  let editing = false, sel = null, drag = null; const pts = new Map();
  function select(k) { sel = k; for (const [kk, s2] of ITEMS) { const el = elOf(s2); if (el) el.classList.toggle('ctl-sel', kk === k); } $('ctlSelName').textContent = k ? ITEMS.find(i => i[0] === k)[2] : 'none'; const r = $('ctlSize'); r.disabled = !k; if (k) r.value = String((layout[k] || {}).s || 1); }
  function openEditor() { if (typeof setOv !== 'undefined' && setOv.classList) setOv.classList.remove('show'); editing = true; document.documentElement.classList.add('ctl-editing'); ed.classList.add('show'); select(null); applyLayout(); }
  function closeEditor() { editing = false; document.documentElement.classList.remove('ctl-editing'); ed.classList.remove('show'); select(null); saveLayout(); }
  window.openControlsEditor = openEditor;
  $('ctlDone').onclick = closeEditor;
  $('ctlReset').onclick = () => { layout = {}; saveLayout(); applyLayout(); select(sel); };
  $('ctlSize').oninput = e => { if (!sel) return; const L = layout[sel] || (layout[sel] = { dx: 0, dy: 0, s: 1 }); L.s = +e.target.value; applyLayout(); };
  const itemAt = target => { for (const [k, s2] of ITEMS) { const el = elOf(s2); if (el && el.contains(target)) return k; } return null; };
  document.addEventListener('pointerdown', e => { if (!editing) return; const k = itemAt(e.target); if (!k) return; e.preventDefault(); e.stopPropagation();
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); select(k); const L = layout[k] || (layout[k] = { dx: 0, dy: 0, s: 1 });
    if (pts.size === 1) drag = { k, x: e.clientX, y: e.clientY, dx: L.dx, dy: L.dy }; else { const [a, b] = [...pts.values()]; drag = { k, pinch: Math.hypot(a.x - b.x, a.y - b.y), s: L.s }; } }, true);
  document.addEventListener('pointermove', e => { if (!editing || !drag || !pts.has(e.pointerId)) return; e.preventDefault(); e.stopPropagation(); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); const L = layout[drag.k];
    if (drag.pinch && pts.size >= 2) { const [a, b] = [...pts.values()]; L.s = Math.max(.6, Math.min(1.8, drag.s * Math.hypot(a.x - b.x, a.y - b.y) / (drag.pinch || 1))); $('ctlSize').value = String(L.s); }
    else if (!drag.pinch) { L.dx = drag.dx + (e.clientX - drag.x) / innerWidth; L.dy = drag.dy + (e.clientY - drag.y) / innerHeight; }
    applyLayout(); }, true);
  const endPtr = e => { if (!editing) return; if (pts.has(e.pointerId)) { e.preventDefault(); e.stopPropagation(); } pts.delete(e.pointerId); if (!pts.size) { drag = null; saveLayout(); } };
  document.addEventListener('pointerup', endPtr, true); document.addEventListener('pointercancel', endPtr, true);
  // the Settings button (phones and tablets)
  (function addSettingsButton() { const help = $('setHelp'); if (!help) return; const b = document.createElement('button'); b.className = 'btn'; b.id = 'setCtl'; b.type = 'button'; b.textContent = 'Customize controls';
    b.onclick = openEditor; help.parentNode.insertBefore(b, help.nextSibling); const sync = () => { b.hidden = !document.documentElement.classList.contains('appmode'); }; sync(); setInterval(sync, 1500); })();

  /* ---------- 2) two players on one device ---------- */
  const duoActive = () => !!(typeof G !== 'undefined' && G && G.human && G.human.A && G.human.B && typeof NET !== 'undefined' && NET.mode === 'local' && duoCapable() && ['intro', 'battle', 'pick'].includes(G.phase));
  const pads = {}; for (const S of ['A', 'B']) { const p = document.createElement('div'); p.className = 'duo-pad'; p.id = 'duo' + S;
    p.innerHTML = `<div class="duo-msg"></div><div class="duo-top"><div class="duo-team"></div><button class="duo-z" type="button" disabled>Z</button></div><div class="duo-moves"></div><div class="duo-name"></div>`; document.body.appendChild(p); pads[S] = p; }
  let builtKey = { A: '', B: '' };
  function pressMove(S, i) { if (!duoActive() || G.phase !== 'battle' || clock.paused) return; const sd = side(S), m = act(S); if (!m || i >= m.moves.length) return; if (!tryCast(S, i)) { sd.queued = i; sd.queuedT = 600; } }
  function pressMon(S, i) { if (!duoActive()) return; const sd = side(S), m = sd.team[i]; if (!m || m.hp <= 0) return;
    if (G.phase === 'pick' && sd.state === 'wait') { spawnIn(S, i); const other = side(S === 'A' ? 'B' : 'A'); if (other.state !== 'wait') { G.phase = 'battle'; try { showOverlay('ovSwitch', false); } catch (e) { } } try { updateHUD(); } catch (e) { } return; }
    if (G.phase === 'battle' && i !== sd.active) requestSwitch(S, i); }
  function pressZ(S) { if (!duoActive() || G.phase !== 'battle') return; try { if (canZ(S)) zMove(S); } catch (e) { } }
  function build(S) { const p = pads[S], sd = side(S), key = sd.team.map(m => m.pick || m.name).join(',') + '|' + act(S).moves.join(','); if (builtKey[S] === key) return; builtKey[S] = key;
    const team = p.querySelector('.duo-team'); team.innerHTML = ''; sd.team.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'duo-mon'; b.dataset.i = i; const c = document.createElement('canvas'); c.width = c.height = 48; try { drawSpriteTo(c, m.pick || m.name, {}); } catch (e) { }
      b.appendChild(c); b.insertAdjacentHTML('beforeend', '<div class="hp"><i></i></div>'); b.onpointerdown = e => { e.preventDefault(); pressMon(S, i); }; team.appendChild(b); });
    p.querySelector('.duo-z').onpointerdown = e => { e.preventDefault(); pressZ(S); };
    p.querySelector('.duo-name').textContent = (S === 'A' ? 'PLAYER 1' : 'PLAYER 2') + (typeof TRSEL !== 'undefined' && typeof trainerTitle === 'function' ? ' · ' + trainerTitle(TRSEL[S]).toUpperCase() : ''); }
  function buildMoves(S) { const p = pads[S], m = act(S), box = p.querySelector('.duo-moves'), key = (m.pick || m.name) + '|' + m.moves.join(','); if (box.dataset.k === key) return; box.dataset.k = key; box.innerHTML = '';
    m.moves.forEach((n, i) => { const mv = MOVES[n], col = (typeof TYPE_COLOR !== 'undefined' && TYPE_COLOR[mv.type]) || '#556'; const b = document.createElement('button'); b.type = 'button'; b.className = 'duo-move'; b.style.background = `linear-gradient(180deg,${col},${col}cc)`;
      b.innerHTML = `${n}<small>${mv.type}${mv.pow ? ' · ' + mv.pow : ''}</small><div class="cd"></div>`; b.onpointerdown = e => { e.preventDefault(); pressMove(S, i); }; box.appendChild(b); }); }
  function update() {
    const on = duoActive(); document.documentElement.classList.toggle('duo', on); if (!on) return;
    for (const S of ['A', 'B']) { const p = pads[S], sd = side(S), m = act(S); build(S); if (m) buildMoves(S);
      p.querySelectorAll('.duo-mon').forEach((b, i) => { const t = sd.team[i]; b.classList.toggle('act', i === sd.active && t.hp > 0); b.classList.toggle('ko', t.hp <= 0); b.classList.toggle('pickme', G.phase === 'pick' && sd.state === 'wait' && t.hp > 0); b.querySelector('.hp i').style.width = Math.max(0, t.hp / t.max * 100) + '%'; });
      if (m) p.querySelectorAll('.duo-move').forEach((b, i) => { const cd = m.cd[i] || 0, full = cooldownOf(MOVES[m.moves[i]]) || 1; b.querySelector('.cd').style.width = Math.min(100, cd / full * 100) + '%'; b.classList.toggle('queued', sd.queued === i); });
      const z = p.querySelector('.duo-z'); z.style.setProperty('--z', Math.round(sd.zCharge || 0) + '%'); let ok = false; try { ok = canZ(S); } catch (e) { } z.disabled = !ok;
      p.querySelector('.duo-msg').textContent = G.phase === 'pick' && sd.state === 'wait' ? 'Choose your next Pokémon' : ''; }
  }
  setInterval(update, 100);
  // the one-sided pick screen is replaced by each player's own row
  if (typeof onNeedPick === 'function') { const _onNeedPick = onNeedPick; onNeedPick = function () { const r = _onNeedPick.apply(this, arguments); if (duoActive()) try { showOverlay('ovSwitch', false); } catch (e) { } return r; }; }
  // player 2's HUMAN button follows the mode (Local only)
  if (typeof syncOnlineUi === 'function') { const _sync = syncOnlineUi; syncOnlineUi = function () { const r = _sync.apply(this, arguments); try { renderStartTrainers(); } catch (e) { } return r; }; }
  try { renderStartTrainers(); } catch (e) { }
  window.DUO = { duoActive, pressMove, pressMon, pressZ, applyLayout, openEditor, closeEditor, layout: () => layout };
})();
