/* =====================================================================
   Section 12: more quality-of-life
   Remembered teams and arena, team presets, swap sides, fullscreen,
   an FPS counter and an arena title card.
   ===================================================================== */
const QOL_KEY = 'arena151.qol';
const QOL = Object.assign({ last: null, presets: [null, null, null, null] }, (() => { try { return JSON.parse(localStorage.getItem(QOL_KEY)) || {}; } catch (e) { return {}; } })());
const saveQol = () => { try { localStorage.setItem(QOL_KEY, JSON.stringify(QOL)); } catch (e) { } };
const validTeam = t => Array.isArray(t) && t.length === 6 && t.every(n => DEX_BY_NAME[n]);

/* ---------- remember the last teams and arena ---------- */
const _startBattle = startBattle;
startBattle = function (a, b) {
  try { if (validTeam(a) && validTeam(b)) { QOL.last = { A: a, B: b, stage: $('stageSel').value }; saveQol(); } } catch (e) { }
  return _startBattle.apply(this, arguments);
};
// Applied once the title screen is up: the game's start-up sets default teams and an arena after fonts load.
(function waitForTitle() { const iv = setInterval(() => { if (typeof G !== 'undefined' && G && G.phase === 'title' && $('pickA0')) { clearInterval(iv); restoreLast(); } }, 100); setTimeout(() => clearInterval(iv), 15000); })();
function restoreLast() {
  const L = QOL.last; if (!L) return;
  if (validTeam(L.A) && validTeam(L.B)) setPickers(L.A, L.B);
  if (L.stage && (L.stage === 'random' || STAGES[L.stage])) { $('stageSel').value = L.stage; if (L.stage !== 'random') { setStage(L.stage); crowdState.length = 0; const t = $('titleStage'); if (t) t.textContent = STAGE.name; } }
}

/* ---------- swap sides ---------- */
function swapSides() { const a = readPickers('A'), b = readPickers('B'); setPickers(b, a); toastMsg('Teams swapped'); }
function toastMsg(text) { if (typeof camToast === 'function') camToast(text, ''); }

/* ---------- team presets (four slots) ---------- */
(function presetUi() {
  const anchor = $('bClear'); if (!anchor) return;
  const row = document.createElement('div'); row.className = 'presetRow';
  row.innerHTML = `<label for="presetSel">Team presets</label><select id="presetSel"></select>
    <button class="btn ghost" id="pSaveA" type="button">Save Red's team</button><button class="btn ghost" id="pSaveB" type="button">Save Gold's team</button>
    <button class="btn" id="pLoadA" type="button">Load to Red</button><button class="btn" id="pLoadB" type="button">Load to Gold</button>
    <button class="btn ghost" id="pSwap" type="button">Swap sides</button>`;
  anchor.parentNode.insertAdjacentElement('afterend', row);
  const sel = $('presetSel');
  const refresh = () => { const cur = sel.value || '0'; sel.innerHTML = QOL.presets.map((p, k) => `<option value="${k}">Preset ${k + 1}${p ? ': ' + p.slice(0, 3).join(', ') + '…' : ' (empty)'}</option>`).join(''); sel.value = cur; };
  const save = S => { QOL.presets[+sel.value] = readPickers(S); saveQol(); refresh(); toastMsg(`Saved to preset ${+sel.value + 1}`); };
  const load = S => { const p = QOL.presets[+sel.value]; if (!validTeam(p)) { toastMsg('That preset is empty'); return; } const a = readPickers('A'), b = readPickers('B'); setPickers(S === 'A' ? p : a, S === 'B' ? p : b); toastMsg(`Preset ${+sel.value + 1} loaded for ${S === 'A' ? 'Red' : 'Gold'}`); };
  $('pSaveA').onclick = () => save('A'); $('pSaveB').onclick = () => save('B'); $('pLoadA').onclick = () => load('A'); $('pLoadB').onclick = () => load('B'); $('pSwap').onclick = swapSides;
  refresh();
})();
(function resultsSwap() {
  const anchor = $('rTeams'); if (!anchor) return;
  const b = document.createElement('button'); b.className = anchor.className; b.id = 'rSwap'; b.type = 'button'; b.textContent = 'Swap sides & rematch';
  b.onclick = () => { const a = readPickers('A'), c = readPickers('B'); setPickers(c, a); startBattle(c, a); };
  anchor.insertAdjacentElement('afterend', b);
})();

/* ---------- fullscreen ---------- */
function toggleFullscreen() {
  const el = document.documentElement;
  try { if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen).call(el); else (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { }
}
(function fsButton() {
  if (window.AndroidApp || !(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) return;
  const ctr = document.querySelector('.ctrls'); if (!ctr) return;
  const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'bFull'; b.type = 'button'; b.textContent = 'Fullscreen'; b.onclick = toggleFullscreen; ctr.appendChild(b);
})();

/* ---------- FPS counter ---------- */
const fpsEl = document.createElement('div'); fpsEl.id = 'fpsMeter'; fpsEl.setAttribute('aria-hidden', 'true'); scene.parentElement.appendChild(fpsEl);
(function fpsLoop() { let n = 0, t0 = performance.now(); const tick = now => { n++; if (now - t0 >= 500) { if (SETTINGS.fps) fpsEl.textContent = Math.round(n * 1000 / (now - t0)) + ' fps'; n = 0; t0 = now; } fpsEl.style.display = SETTINGS.fps ? 'block' : 'none'; requestAnimationFrame(tick); }; requestAnimationFrame(tick); })();
(function fpsSetting() {
  const card = document.querySelector('#setOv .qol-card'), btns = card && card.querySelector('.qbtns'); if (!card) return;
  const row = document.createElement('label'); row.className = 'qrow';
  row.innerHTML = `<span>Show FPS counter<small>Frames per second in the corner of the arena</small></span><input type="checkbox" id="setFps">`;
  card.insertBefore(row, btns || null);
  const cb = $('setFps'); cb.checked = !!SETTINGS.fps; cb.onchange = () => { SETTINGS.fps = cb.checked; saveSettings(); };
})();

/* ---------- arena title card ---------- */
const ARENA_TAG = { plaza: 'City square showdown', skyfort: 'High above the clouds', grotto: 'Deep in the crystal caves', oasis: 'Under the desert sun', ruins: 'Among the jungle temples' };
let lastPhase = '';
setInterval(() => { if (!G) return; if (G.phase === 'battle' && lastPhase !== 'battle' && lastPhase !== '' && G.elapsed < 3000) toastMsg2(STAGE.name, ARENA_TAG[STAGE_ID] || ''); lastPhase = G.phase; }, 200);
function toastMsg2(a, b) { if (typeof camToast === 'function') camToast(a, b); }

/* ---------- keys and help ---------- */
document.addEventListener('keydown', e => {
  if (document.querySelector('.qol-ov.show') || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) toggleFullscreen();
});
(function helpRows() {
  const grid = document.querySelector('#helpOv .qgrid'); if (!grid) return;
  grid.insertAdjacentHTML('beforeend', '<p><kbd>F</kbd> Fullscreen</p><p>Team presets and Swap sides live in the team builder</p><p>Your last teams and arena are remembered</p>');
})();

/* ---------- styles ---------- */
(function qol2Styles() {
  const st = document.createElement('style');
  st.textContent = `.presetRow{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)}
.presetRow label{font:600 12px Rubik,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8fa4d8;margin-right:4px}
.presetRow select{background:#0b1222;color:#fff;border:1px solid #2a3a66;border-radius:8px;padding:6px 8px;font:13px Rubik,system-ui,sans-serif;max-width:260px}
#fpsMeter{position:absolute;left:10px;bottom:10px;z-index:6;display:none;font:600 12px Rubik,monospace;color:#d7ffd7;background:rgba(10,14,28,.7);padding:3px 7px;border-radius:6px;pointer-events:none}
.appmode #fpsMeter{bottom:auto;top:8px;left:8px}`;
  document.head.appendChild(st);
})();
