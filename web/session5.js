/* =====================================================================
   Section 11: camera modes, zoom and quality-of-life
   ===================================================================== */
const SETTINGS_KEY = 'arena151.settings';
const SETTINGS_DEFAULT = { cam: 'arena', intro: true, speed: 1, shake: true, flashes: true, hitstop: true, numbers: true, quality: 'high' };
window.SETTINGS = Object.assign({}, SETTINGS_DEFAULT, (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } })());
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) { } }

/* ---------- camera ---------- */
var CAM_MODES = ['arena', 'wide', 'close', 'action', 'free'];
var CAM_INFO = {
  arena: ['Arena', 'The battle floor and the stands around it'],
  wide: ['Wide', 'The whole arena and its surroundings'],
  close: ['Close', 'Tight on the two Pokémon'],
  action: ['Action', 'Follows the fight and punches in on big hits'],
  free: ['Free', 'Zoom with the wheel, +/- or a pinch; drag to look around']
};
var freeCam = { z: 1.8, x: null, y: null };   // var: read by resizeScene, which the game calls before this section runs
function maxPz() { return Math.max(pzWideFor(STAGE_ID) * 1.01, DW / 300, DH / 190); }   // closest zoom: about 300 art pixels across
function pzWideFor(id) { const e = EXT(id); return Math.max(DW / e.W, DH / e.H); }
function modePz(mode) {
  const wide = pzWideFor(STAGE_ID);
  if (mode === 'wide') return wide;
  if (mode === 'close') return Math.max(wide, Math.min(DW / 560, DH / 340));
  if (mode === 'free') return clamp(wide * (freeCam ? freeCam.z : 1.8), wide, maxPz());
  return Math.max(wide, Math.min(DW / 900, DH / 560));            // arena / action
}
function resizeScene() {
  const r = scene.getBoundingClientRect(); DPR = window.devicePixelRatio || 1;
  DW = Math.max(1, Math.round(r.width * DPR)); DH = Math.max(1, Math.round(r.height * DPR));
  scene.width = DW; scene.height = DH;
  // the buffer must hold the widest view any arena allows
  let pzMin = Infinity; for (const id of STAGE_ORDER) pzMin = Math.min(pzMin, pzWideFor(id)); if (!isFinite(pzMin)) pzMin = 1;
  PZ0 = modePz('arena');
  buf = document.createElement('canvas'); buf.width = Math.ceil(DW / pzMin) + 4; buf.height = Math.ceil(DH / pzMin) + 4;
  gctx = bctx = buf.getContext('2d'); bctx.imageSmoothingEnabled = false;
  fbuf = document.createElement('canvas'); fbuf.width = buf.width; fbuf.height = buf.height; fctx = fbuf.getContext('2d'); fctx.imageSmoothingEnabled = false;
  makeHiLayers();
  cam.pz = modePz((window.SETTINGS && SETTINGS.cam) || 'arena');
  if (!snow.length) for (let i = 0; i < 170; i++) snow.push({ x: Math.random() * ART_W, y: Math.random() * ART_H, z: .35 + Math.random() * .9, p: Math.random() * 6 });
  if (!scarCanvas) buildScars();
}
function activeCamMode() { const S = window.SETTINGS || { cam: 'arena' }; return G && G.phase === 'intro' && S.intro && S.cam !== 'free' ? 'wide' : S.cam; }
function updateCamera(dt) {
  const mode = activeCamMode(), e = EXT(STAGE_ID);
  let tx = toArtX(500), ty = toArtY(290), level = 0;
  if (G && ['battle', 'pick', 'intro', 'over'].includes(G.phase)) {
    const a = side('A'), b = side('B'), va = !['out', 'wait'].includes(a.state), vb = !['out', 'wait'].includes(b.state);
    if (va && vb) { tx = toArtX((a.x + b.x) / 2); ty = toArtY((a.y + b.y) / 2 - 25); }
    else if (va) { tx = toArtX(a.x); ty = toArtY(a.y - 25); } else if (vb) { tx = toArtX(b.x); ty = toArtY(b.y - 25); }
    if (G.phase === 'over' && G.winner && G.winner !== 'draw') { const w = side(G.winner); tx = toArtX(w.x); ty = toArtY(w.y - 30); level = 1; }
  }
  if (clock.t < cam.punchT && cam.fx && mode !== 'wide' && mode !== 'free') { tx = toArtX(cam.fx.x); ty = toArtY(cam.fx.y); level = Math.max(level, cam.fx.lv); }
  if (REDUCED || (window.SETTINGS && !SETTINGS.shake)) level = Math.min(level, mode === 'action' ? 1 : 0);
  const zoom = mode === 'action' ? 1 + level * .32 : mode === 'close' ? 1 + level * .1 : mode === 'arena' ? 1 + level * .12 : 1;
  if (mode === 'wide') { tx = lerp(tx, e.W / 2 - e.l, .8); ty = lerp(ty, e.H / 2 - e.t, .8); }
  else if (mode === 'arena') { tx = lerp(tx, toArtX(500), level ? .2 : .5); ty = lerp(ty, toArtY(290), level ? .2 : .5); }
  else if (mode === 'free') { if (freeCam.x == null) { freeCam.x = cam.x; freeCam.y = cam.y; } tx = freeCam.x; ty = freeCam.y; }
  const targetPz = modePz(mode) * zoom, ez = 1 - Math.exp(-dt / (mode === 'free' ? 90 : 300));
  cam.pz += (targetPz - cam.pz) * ez; if (Math.abs(targetPz - cam.pz) < .004) cam.pz = targetPz;
  const ec = 1 - Math.exp(-dt / (mode === 'free' ? 70 : mode === 'close' || mode === 'action' ? 180 : 240)); cam.x += (tx - cam.x) * ec; cam.y += (ty - cam.y) * ec;
  const vw = DW / cam.pz, vh = DH / cam.pz, x0 = -e.l, y0 = -e.t;
  cam.left = Math.round(vw >= e.W ? x0 + (e.W - vw) / 2 : clamp(cam.x - vw / 2, x0, x0 + e.W - vw));
  cam.top = Math.round(vh >= e.H ? y0 + (e.H - vh) / 2 : clamp(cam.y - vh / 2, y0, y0 + e.H - vh));
  if (mode === 'free') { freeCam.x = clamp(freeCam.x, x0 + Math.min(vw, e.W) / 2, x0 + e.W - Math.min(vw, e.W) / 2); freeCam.y = clamp(freeCam.y, y0 + Math.min(vh, e.H) / 2, y0 + e.H - Math.min(vh, e.H) / 2); }
}
function setCamMode(mode, quiet) {
  if (!CAM_MODES.includes(mode)) mode = 'arena';
  if (mode === 'free' && SETTINGS.cam !== 'free') { freeCam.z = clamp(cam.pz / pzWideFor(STAGE_ID), 1, maxPz() / pzWideFor(STAGE_ID)); freeCam.x = cam.left + DW / cam.pz / 2; freeCam.y = cam.top + DH / cam.pz / 2; }
  SETTINGS.cam = mode; saveSettings(); refreshCamUi(); if (!quiet) camToast(`Camera: ${CAM_INFO[mode][0]}`, CAM_INFO[mode][1]);
}
function cycleCam(dir = 1) { const i = CAM_MODES.indexOf(SETTINGS.cam); setCamMode(CAM_MODES[(i + dir + CAM_MODES.length) % CAM_MODES.length]); }
function toggleCam() { cycleCam(1); }
// zoom by a factor, keeping the art point under (sx, sy) in place (screen pixels; centre if omitted)
function zoomBy(f, sx, sy) {
  if (SETTINGS.cam !== 'free') setCamMode('free', true);
  const wide = pzWideFor(STAGE_ID), zMax = maxPz() / wide, oldPz = clamp(wide * freeCam.z, wide, wide * zMax), newZ = clamp(freeCam.z * f, 1, zMax), newPz = wide * newZ;
  const px = sx == null ? DW / 2 : sx, py = sy == null ? DH / 2 : sy, ax_ = freeCam.x - DW / oldPz / 2 + px / oldPz, ay_ = freeCam.y - DH / oldPz / 2 + py / oldPz;
  freeCam.z = newZ; freeCam.x = ax_ - px / newPz + DW / newPz / 2; freeCam.y = ay_ - py / newPz + DH / newPz / 2; refreshCamUi();
}
function panBy(dxScreen, dyScreen) { if (SETTINGS.cam !== 'free') setCamMode('free', true); freeCam.x -= dxScreen / cam.pz; freeCam.y -= dyScreen / cam.pz; }

/* ---------- on-screen camera bar ---------- */
const camBar = document.createElement('div'); camBar.id = 'camBar'; camBar.setAttribute('role', 'toolbar'); camBar.setAttribute('aria-label', 'Camera');
camBar.innerHTML = `<button id="camOut" aria-label="Zoom out" title="Zoom out (−)">−</button><button id="camMode" title="Change camera (Z)"></button><button id="camIn" aria-label="Zoom in" title="Zoom in (+)">+</button><button id="camGear" aria-label="Settings" title="Settings (O)">⚙</button>`;
scene.parentElement.appendChild(camBar);
function refreshCamUi() {
  $('camMode').textContent = CAM_INFO[SETTINGS.cam][0] + (SETTINGS.cam === 'free' ? ` ${Math.round(freeCam.z * 100) / 100}×` : '');
  const b = $('bCam'); if (b) b.textContent = `Camera: ${CAM_INFO[SETTINGS.cam][0]}`;
  const sel = $('setCam'); if (sel) sel.value = SETTINGS.cam;
}
$('camMode').onclick = () => cycleCam(1); $('camIn').onclick = () => zoomBy(1.25); $('camOut').onclick = () => zoomBy(1 / 1.25); $('camGear').onclick = () => openSettings();
$('bCam').onclick = () => cycleCam(1);

/* ---------- mouse wheel, drag and pinch ---------- */
scene.addEventListener('wheel', e => { e.preventDefault(); const r = scene.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, (e.clientX - r.left) * DPR, (e.clientY - r.top) * DPR); }, { passive: false });
const ptrs = new Map(); let pinch = null, dragMoved = 0;
scene.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && document.body.classList.contains('appmode') && ptrs.size === 0 && e.clientX < scene.getBoundingClientRect().left + scene.clientWidth * .4) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; } });
window.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = scene.getBoundingClientRect();
    if (pinch.d > 10) zoomBy(d / pinch.d, (mx - r.left) * DPR, (my - r.top) * DPR); panBy((mx - pinch.mx) * DPR, (my - pinch.my) * DPR); pinch = { d, mx, my }; }
  else if (ptrs.size === 1 && e.pointerType === 'mouse' && (e.buttons & 1)) { dragMoved += Math.abs(dx) + Math.abs(dy); if (dragMoved > 4) panBy(dx * DPR, dy * DPR); }
});
const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
window.addEventListener('pointerup', endPtr); window.addEventListener('pointercancel', endPtr);
scene.addEventListener('dblclick', () => setCamMode('arena'));

/* ---------- battle speed ---------- */
const SPEEDS = [1, 1.5, 2, 3, .5];
function toggleSpeed() { const i = SPEEDS.indexOf(clock.speed); setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); }
function setSpeed(v) { clock.speed = v; SETTINGS.speed = v; saveSettings(); const b = $('bSpeed'); if (b) b.textContent = `Speed ${v}×`; const s = $('setSpeed'); if (s) s.value = String(v); }

/* ---------- effects settings ---------- */
function screenFlash(color, a) { if (!SETTINGS.flashes) return; if (REDUCED) a *= .3; flash = { a, color }; }
(function wrapVfx() {
  const sh = VFX.shake; VFX.shake = function (a, d) { if (!SETTINGS.shake) return; return sh.apply(this, arguments); };
  const hit = VFX.hit; VFX.hit = function () { const n = fx.length, r = hit.apply(this, arguments); if (!SETTINGS.numbers) for (let i = fx.length - 1; i >= n; i--) if (fx[i].kind === 'text' && /^\d+$/.test(fx[i].text)) fx.splice(i, 1); return r; };
})();
const QUALITY_CAPS = { high: [1600, 280], medium: [800, 160], low: [350, 90] };
setInterval(() => { const [pc, ec] = QUALITY_CAPS[SETTINGS.quality] || QUALITY_CAPS.high; if (parts.length > pc) parts.splice(0, parts.length - pc); if (ENTS.length > ec) ENTS.splice(0, ENTS.length - ec); }, 250);

/* ---------- toast ---------- */
const camToastEl = document.createElement('div'); camToastEl.id = 'camToast'; camToastEl.setAttribute('role', 'status'); scene.parentElement.appendChild(camToastEl);
let camToastT = 0;
function camToast(title, sub) { camToastEl.innerHTML = `<b>${title}</b>${sub ? `<span>${sub}</span>` : ''}`; camToastEl.classList.add('show'); clearTimeout(camToastT); camToastT = setTimeout(() => camToastEl.classList.remove('show'), 1600); }

/* ---------- settings panel ---------- */
const setOv = document.createElement('div'); setOv.id = 'setOv'; setOv.className = 'qol-ov'; setOv.setAttribute('role', 'dialog'); setOv.setAttribute('aria-modal', 'true'); setOv.setAttribute('aria-label', 'Settings');
const tog = (id, label, hint) => `<label class="qrow"><span>${label}${hint ? `<small>${hint}</small>` : ''}</span><input type="checkbox" id="${id}"></label>`;
setOv.innerHTML = `<div class="qol-card"><div class="qol-head"><b>Settings</b><button class="qx" data-close aria-label="Close">✕</button></div>
  <h4>Camera</h4>
  <label class="qrow"><span>Camera mode<small>Z cycles · wheel, +/- or pinch to zoom · drag to pan · double-click resets</small></span><select id="setCam">${CAM_MODES.map(m => `<option value="${m}">${CAM_INFO[m][0]}</option>`).join('')}</select></label>
  ${tog('setIntro', 'Arena flyover at battle start', 'Shows the whole arena during the intro')}
  <h4>Battle</h4>
  <label class="qrow"><span>Battle speed<small>F cycles</small></span><select id="setSpeed">${SPEEDS.slice().sort((a, b) => a - b).map(v => `<option value="${v}">${v}×</option>`).join('')}</select></label>
  ${tog('setNumbers', 'Damage numbers')}
  <h4>Effects</h4>
  ${tog('setShake', 'Screen shake and camera punches')}${tog('setFlashes', 'Screen flashes', 'Turn off if flashing lights bother you')}${tog('setHitstop', 'Hit-stop', 'Brief freeze on big hits')}
  <label class="qrow"><span>Effects quality<small>Lower it if your phone gets warm or choppy</small></span><select id="setQuality"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
  <div class="qbtns"><button class="btn" id="setHelp">Controls</button><button class="btn" id="setShot">Save screenshot</button><button class="btn ghost" id="setReset">Reset settings</button></div></div>`;
document.body.appendChild(setOv);
function syncSettingsUi() {
  $('setCam').value = SETTINGS.cam; $('setSpeed').value = String(SETTINGS.speed); $('setQuality').value = SETTINGS.quality;
  for (const [id, k] of [['setIntro', 'intro'], ['setNumbers', 'numbers'], ['setShake', 'shake'], ['setFlashes', 'flashes'], ['setHitstop', 'hitstop']]) $(id).checked = !!SETTINGS[k];
}
let ovPaused = false;   // opening a panel mid-battle pauses; closing it resumes
function pauseForPanel() { if (G && G.phase === 'battle' && !clock.paused) { togglePause(); ovPaused = true; } }
function openSettings() { pauseForPanel(); syncSettingsUi(); setOv.classList.add('show'); $('setCam').focus(); }
function closeOv(el) { el.classList.remove('show'); if (ovPaused && !document.querySelector('.qol-ov.show')) { ovPaused = false; if (clock.paused) togglePause(); } }
$('setCam').onchange = e => setCamMode(e.target.value);
$('setSpeed').onchange = e => setSpeed(Number(e.target.value));
$('setQuality').onchange = e => { SETTINGS.quality = e.target.value; saveSettings(); };
for (const [id, k] of [['setIntro', 'intro'], ['setNumbers', 'numbers'], ['setShake', 'shake'], ['setFlashes', 'flashes'], ['setHitstop', 'hitstop']]) $(id).onchange = e => { SETTINGS[k] = e.target.checked; saveSettings(); };
$('setReset').onclick = () => { Object.assign(SETTINGS, SETTINGS_DEFAULT); saveSettings(); setSpeed(SETTINGS.speed); setCamMode(SETTINGS.cam, true); syncSettingsUi(); camToast('Settings reset'); };
$('setHelp').onclick = () => { setOv.classList.remove('show'); openHelp(); };
$('setShot').onclick = () => { closeOv(setOv); setTimeout(screenshot, 120); };

/* ---------- controls help ---------- */
const helpOv = document.createElement('div'); helpOv.id = 'helpOv'; helpOv.className = 'qol-ov'; helpOv.setAttribute('role', 'dialog'); helpOv.setAttribute('aria-modal', 'true'); helpOv.setAttribute('aria-label', 'Controls');
helpOv.innerHTML = `<div class="qol-card"><div class="qol-head"><b>Controls</b><button class="qx" data-close aria-label="Close">✕</button></div>
  <div class="qgrid"><div><h4>Battle</h4><p><kbd>1</kbd>–<kbd>4</kbd> use a move</p><p><kbd>WASD</kbd> / arrows steer</p><p><kbd>Shift</kbd>+<kbd>1</kbd>–<kbd>6</kbd> switch Pokémon</p><p><kbd>M</kbd> Mega Evolve</p><p><kbd>P</kbd> pause · <kbd>F</kbd> speed · <kbd>T</kbd> watch mode</p><p><kbd>R</kbd> rematch after a battle</p></div>
  <div><h4>Camera</h4><p><kbd>Z</kbd> next camera mode</p><p><kbd>+</kbd> / <kbd>−</kbd> or mouse wheel to zoom</p><p>Drag the arena to look around</p><p><kbd>0</kbd> or double-click: back to Arena view</p><h4>Other</h4><p><kbd>O</kbd> settings · <kbd>H</kbd> this help</p><p><kbd>K</kbd> save a screenshot</p></div>
  <div><h4>Touch</h4><p>Left stick steers, buttons attack</p><p>Pinch with two fingers to zoom and pan</p><p>Tap the camera name to change mode</p><p>The game pauses when you leave the app</p></div></div></div>`;
document.body.appendChild(helpOv);
function openHelp() { pauseForPanel(); helpOv.classList.add('show'); }
for (const ov of [setOv, helpOv]) ov.addEventListener('click', e => { if (e.target === ov || e.target.hasAttribute('data-close')) closeOv(ov); });

/* ---------- screenshot ---------- */
function screenshot() {
  if (window.AndroidApp) { camToast('Screenshots', 'Use your phone’s screenshot buttons in the app'); return; }
  try { const a = document.createElement('a'); a.download = `arena151-${STAGE_ID}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`; a.href = scene.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); camToast('Screenshot saved'); }
  catch (e) { camToast('Screenshot failed', 'Your browser blocked it'); }
}

/* ---------- keys, buttons, auto-pause ---------- */
document.addEventListener('keydown', e => {
  const open = document.querySelector('.qol-ov.show');
  if (e.key === 'Escape' && open) { closeOv(open); return; }          // works even while a dropdown has focus
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (open) return;
  const k = e.key.toLowerCase();
  if (k === 'z') cycleCam(e.shiftKey ? -1 : 1);
  else if (k === '+' || k === '=') zoomBy(1.2);
  else if (k === '-' || k === '_') zoomBy(1 / 1.2);
  else if (k === '0') setCamMode('arena');
  else if (k === 'o') openSettings();
  else if (k === 'h' || k === '?') openHelp();
  else if (k === 'k') screenshot();
});
(function addButtons() {
  const ctr = document.querySelector('.ctrls'); if (!ctr) return;
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'bSettings'; b.textContent = 'Settings'; b.onclick = openSettings; ctr.appendChild(b);
  const h = document.createElement('button'); h.className = 'btn ghost'; h.id = 'bHelp'; h.textContent = 'Controls'; h.onclick = openHelp; ctr.appendChild(h);
})();
document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.phase === 'battle' && !clock.paused) togglePause(); });

/* ---------- styles ---------- */
(function qolStyles() {
  const st = document.createElement('style');
  st.textContent = `#camBar{position:absolute;right:10px;bottom:10px;z-index:6;display:flex;gap:4px;padding:4px;border-radius:10px;background:rgba(10,14,28,.72);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(4px)}
#camBar button{font:600 13px/1 Rubik,system-ui,sans-serif;color:#fff;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:7px;min-width:30px;height:30px;padding:0 9px;cursor:pointer}
#camBar button:hover{background:rgba(255,255,255,.18)}#camBar #camMode{min-width:92px}
.appmode #camBar{top:8px;bottom:auto;right:8px;background:rgba(10,14,28,.55)}.appmode #camBar button{height:32px;min-width:34px}.appmode #camBar #camMode{min-width:74px}
#camToast{position:absolute;left:50%;top:18%;transform:translate(-50%,-6px);z-index:7;pointer-events:none;opacity:0;transition:opacity .2s,transform .2s;text-align:center;background:rgba(10,14,28,.82);color:#fff;border-radius:10px;padding:8px 14px;border:1px solid rgba(255,255,255,.16);font:500 13px Rubik,system-ui,sans-serif}
#camToast.show{opacity:1;transform:translate(-50%,0)}#camToast b{display:block;font:400 18px 'Lilita One',Rubik,sans-serif;letter-spacing:.3px}#camToast span{opacity:.8}
.qol-ov{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(3,5,12,.6);padding:16px}.qol-ov.show{display:flex}
.qol-card{background:#121a30;color:#e8eefc;border:1px solid #2a3a66;border-radius:14px;padding:16px 18px;width:min(560px,100%);max-height:88vh;overflow:auto;font:14px Rubik,system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}
#helpOv .qol-card{width:min(820px,100%)}.qol-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.qol-head b{font:400 22px 'Lilita One',Rubik,sans-serif}
.qx{background:none;border:0;color:#cfd8f0;font-size:18px;cursor:pointer}.qol-card h4{margin:14px 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8fa4d8}
.qrow{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}.qrow small{display:block;color:#93a2c8;font-size:12px;margin-top:2px}
.qrow select{background:#0b1222;color:#fff;border:1px solid #2a3a66;border-radius:8px;padding:6px 8px;font:inherit}.qrow input[type=checkbox]{width:20px;height:20px;accent-color:#ffcb3d}
.qbtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.qgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 18px}.qgrid p{margin:5px 0;color:#d7def2}
kbd{display:inline-block;min-width:18px;padding:1px 6px;border-radius:5px;background:#24304f;border:1px solid #3a4a78;border-bottom-width:2px;font:600 12px Rubik,monospace;text-align:center;color:#fff}`;
  document.head.appendChild(st);
})();

/* ---------- start-up ---------- */
setSpeed(SPEEDS.includes(SETTINGS.speed) ? SETTINGS.speed : 1);
camLock = false; refreshCamUi(); resizeScene();
