/* =====================================================================
   Section 13: Poké Ball HUD tokens and custom trainer sprites
   ===================================================================== */

/* ---------- HUD: each party slot is a little ball ---------- */
(function ballTokens() {
  const st = document.createElement('style');
  st.textContent = `.tok{width:14px;height:14px;transform:none;border-radius:50%;border:1.5px solid #10131c;position:relative;overflow:hidden;
  background:radial-gradient(circle at 50% 50%,#fff 0 1.6px,#10131c 1.6px 3.1px,transparent 3.1px),linear-gradient(to bottom,#ef3b3b 0 43%,#10131c 43% 57%,#f6f6f6 57%);
  box-shadow:inset -2px -2px 0 rgba(0,0,0,.18),inset 1px 1px 0 rgba(255,255,255,.35)}
.side.right .tok{background:radial-gradient(circle at 50% 50%,#fff 0 1.6px,#10131c 1.6px 3.1px,transparent 3.1px),linear-gradient(to bottom,#ef3b3b 0 43%,#10131c 43% 57%,#f6f6f6 57%)}
.tok.fnt{background:radial-gradient(circle at 50% 50%,#9aa0ae 0 1.6px,#10131c 1.6px 3.1px,transparent 3.1px),linear-gradient(to bottom,#555b6a 0 43%,#10131c 43% 57%,#7c8292 57%)!important;opacity:.55}
.tok.st{box-shadow:0 0 0 2px #b78bff,inset -2px -2px 0 rgba(0,0,0,.18)}
.tok.active{box-shadow:0 0 0 2px #fff,0 0 8px 2px #fff8,inset -2px -2px 0 rgba(0,0,0,.18)}
.appmode .tok{width:11px;height:11px}`;
  document.head.appendChild(st);
})();

/* ---------- trainers: chosen per side from the sprites folder ----------
   Every file named <Name>_trainer.png (animated PNG) in the sprites folder is a trainer option.
   The Android app lists the folder itself, so new files appear automatically; elsewhere the
   bundled roster below is used. Underscores in the name become spaces (Lt_Surge -> "Lt Surge"). */
const BUNDLED_TRAINERS = ['Ash', 'Blaine', 'Brawly', 'Brock', 'Emmet', 'Erika', 'Fantina', 'Flannery', 'Gary', 'Ghetsis', 'Giovanni', 'Lance', 'Lt_Surge', 'Misty', 'Roxanne', 'Sabrina', 'Steven', 'Wallace', 'Wattson', 'Winona'];
const FACES_RIGHT_BY_DEFAULT = new Set(['Brock']);          // most battle sprites face left
const trainerTitle = n => n.replace(/_/g, ' ');
function discoverTrainers() {
  let files = null;
  try { if (window.AndroidApp && AndroidApp.listSprites) files = JSON.parse(AndroidApp.listSprites()); } catch (e) { }
  const found = (files || []).map(f => (String(f).match(/^(.+)_trainer\.png$/i) || [])[1]).filter(Boolean);
  return [...new Set(found.length ? found : BUNDLED_TRAINERS)].sort((a, b) => a.localeCompare(b));
}
// Route trainers (story mode only) are kept out of the start screen's trainer list.
const ROUTE_TRAINER_KEYS = ['bugcatcher', 'youngster', 'lass', 'engineer', 'gentleman', 'hiker', 'beauty', 'biker', 'swimmer', 'psychic',
  'cooltrainermale', 'cooltrainerm', 'cooltrainerboy', 'acetrainermale', 'acetrainerm', 'cooltrainerfemale', 'cooltrainerf', 'cooltrainergirl', 'acetrainerfemale', 'acetrainerf'];
const trainerKey = n => String(n).toLowerCase().replace(/[^a-z]/g, '');
const ALL_TRAINERS = discoverTrainers();
const TRAINERS = ALL_TRAINERS.filter(n => !ROUTE_TRAINER_KEYS.includes(trainerKey(n)));
const TR_KEY = 'arena151.trainers';
const TRSEL = Object.assign({ A: 'Ash', B: 'Gary', flip: {} }, (() => { try { return JSON.parse(localStorage.getItem(TR_KEY)) || {}; } catch (e) { return {}; } })());
for (const [S, fallback] of [['A', 0], ['B', 1]]) if (!TRAINERS.includes(TRSEL[S])) TRSEL[S] = TRAINERS[fallback % TRAINERS.length];
const saveTrsel = () => { try { localStorage.setItem(TR_KEY, JSON.stringify(TRSEL)); } catch (e) { } };
function trainerLabel(S) { return trainerTitle(TRSEL[S] || TEAM_NAME[S]).toUpperCase(); }

// Loading: animated PNGs are decoded into frames; a page opened straight from disk can't read the bytes,
// so there the browser animates the image itself.
const TR_ANIM = {}, TR_LOADING = {};
function loadTrainer(name) {
  if (TR_ANIM[name] || TR_LOADING[name]) return TR_LOADING[name];
  const file = name + '_trainer.png';
  return TR_LOADING[name] = (async () => {
    try {
      if (!FILE_MODE) { const r = await fetch(spriteUrl(file)); if (r.ok) { const g = await decodeApng(await r.arrayBuffer()); TR_ANIM[name] = finishAnim({ frames: g.frames, delays: g.delays, w: g.W, h: g.H }); } }
      if (!TR_ANIM[name]) { const img = await loadImg(file); if (img) TR_ANIM[name] = animFromImage(img, true); }
    } catch (e) { console.error('trainer ' + name, e); }
    for (const k in TRAINER_CACHE) if (k.endsWith('card')) delete TRAINER_CACHE[k];
    try { drawMinis(); } catch (e) { }
    return TR_ANIM[name];
  })();
}
const customTrainer = S => TR_ANIM[TRSEL[S]] || null;
function trainerAnimFor(S) { return customTrainer(S); }
const trainerFacesRight = name => name in TRSEL.flip ? !!TRSEL.flip[name] : FACES_RIGHT_BY_DEFAULT.has(name);
const mirrorTrainer = S => trainerFacesRight(TRSEL[S]) ? S === 'B' : S === 'A';   // Red faces right, Blue faces left
loadTrainer(TRSEL.A); loadTrainer(TRSEL.B);

drawTrainer = function (S) {          // the sprite is drawn on the screen layer; the ground layer only gets its shadow
  hookTrainerFx(); if (!customTrainer(S)) return;
  const t = TRAINER_POS[S], off = trainerWalk[S] * (S === 'A' ? -140 : 140); aEllFill(bx(t.x + off), by(t.y), 10, 3, '#0b0f1a', .35);
};
// Same pixel scale as the Pokémon sprites, feet on the trainer spot. Poses add motion:
// lean and hop to throw or command, bounce to cheer, sink and dim when beaten.
function drawCustomTrainers(c) {
  for (const S of ['A', 'B']) {
    const a = customTrainer(S); if (!a || !a.frames) continue;
    const pose = trainerPose(S), dir = S === 'A' ? 1 : -1, t = TRAINER_POS[S], off = trainerWalk[S] * (S === 'A' ? -140 : 140); let dx = 0, dy = 0, dim = 0;
    if (pose === 'throw' || pose === 'point') { dx = 3 * dir; dy = -Math.round(Math.abs(Math.sin(clock.t / 90)) * 2); }
    else if (pose === 'cheer') dy = -Math.round(Math.abs(Math.sin(clock.t / 140)) * 5);
    else if (pose === 'slump') { dy = 2; dim = .35; }
    else if (pose === 'walk') dy = -(Math.floor(clock.t / 130) % 2);
    const x = toScreenX(t.x + off + dx * 2), y = toScreenY(t.y + dy * 2), src = a.frames[animFrameIndex(a, clock.t + (S === 'B' ? 333 : 0))];
    const tall = a.h - a.foot, unit = Math.max(1, Math.round(cam.pz / 2)), sc = tall > 160 ? 75 / tall * unit : unit;
    c.save(); c.imageSmoothingEnabled = tall > 160; c.translate(Math.round(x), Math.round(y)); if (mirrorTrainer(S)) c.scale(-1, 1);
    const X0 = Math.round(-a.cx * sc), Y0 = Math.round(-tall * sc), W = Math.round(a.w * sc), H = Math.round(a.h * sc);
    c.drawImage(src, X0, Y0, W, H);
    if (dim) { c.globalAlpha = dim; c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#0b1020'; c.fillRect(X0, Y0, W, H); }
    c.restore();
  }
}
// VS screen card: always right-facing (the VS screen flips Blue's side itself).
trainerCanvas = function (S) {
  const key = S + TRSEL[S] + 'card'; if (TRAINER_CACHE[key]) return TRAINER_CACHE[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 96; const a = customTrainer(S); if (!a) return c;
  const x = c.getContext('2d'), f = a.frames[0], sc = Math.min(64 / a.w, 96 / a.h); x.imageSmoothingEnabled = false;
  if (!trainerFacesRight(TRSEL[S])) { x.translate(64, 0); x.scale(-1, 1); }
  x.drawImage(f, (64 - a.w * sc) / 2, 96 - a.h * sc, a.w * sc, a.h * sc); return TRAINER_CACHE[key] = c;
};
drawMinis = function () {
  for (const S of ['A', 'B']) { const c = $('mini' + S); if (!c) continue; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 16, 16);
    const a = customTrainer(S); if (!a) continue; const f = a.frames[0], side_ = Math.min(a.w, (a.h - a.foot) * .42);
    x.save(); if (mirrorTrainer(S)) { x.translate(16, 0); x.scale(-1, 1); } x.drawImage(f, a.cx - side_ / 2, a.h - a.foot - (a.h - a.foot) * .98, side_, side_, 0, 0, 16, 16); x.restore(); }
};
function refreshTrainerLabels() {
  const na = document.querySelector('.vs-card.a .vs-name'), nb = document.querySelector('.vs-card.b .vs-name');
  if (na) na.textContent = trainerLabel('A'); if (nb) nb.textContent = trainerLabel('B');
  if (typeof hudKey !== 'undefined') { hudKey.A = hudKey.B = ''; }
}

/* ---------- trainer pickers above each side's Pokémon list ---------- */
(function trainerPickers() {
  const st = document.createElement('style');
  st.textContent = `.trainerPick{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}
.trainerPick canvas{width:56px;height:56px;image-rendering:pixelated;background:rgba(0,0,0,.25);border-radius:10px;flex:none}
.trainerPick .tpMain{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}
.trainerPick .tpLabel{font:600 11px Rubik,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8fa4d8}
.trainerPick select{width:100%;background:#0b1222;color:#fff;border:1px solid #2a3a66;border-radius:8px;padding:6px 8px;font:14px Rubik,system-ui,sans-serif}
.trainerPick .tpFlip{display:flex;align-items:center;gap:6px;font:12px Rubik,system-ui,sans-serif;color:#c8d4f0}`;
  document.head.appendChild(st);
  for (const S of ['A', 'B']) {
    const root = $('pick' + S); if (!root || $('trSel' + S)) continue;
    const box = document.createElement('div'); box.className = 'trainerPick';
    box.innerHTML = `<canvas id="trPrev${S}" width="80" height="80" aria-hidden="true"></canvas><div class="tpMain"><label class="tpLabel" for="trSel${S}">${TEAM_NAME[S]}'s trainer</label>
      <select id="trSel${S}">${TRAINERS.map(n => `<option value="${n}">${trainerTitle(n)}</option>`).join('')}</select>
      <label class="tpFlip"><input type="checkbox" id="trFlip${S}"> Sprite faces right</label></div>`;
    root.parentNode.insertBefore(box, root);
    const sel = $('trSel' + S), flip = $('trFlip' + S); sel.value = TRSEL[S]; flip.checked = trainerFacesRight(TRSEL[S]);
    sel.onchange = () => { TRSEL[S] = sel.value; saveTrsel(); flip.checked = trainerFacesRight(sel.value); loadTrainer(sel.value); refreshTrainerLabels(); };
    flip.onchange = () => { TRSEL.flip[TRSEL[S]] = flip.checked; saveTrsel(); for (const k in TRAINER_CACHE) if (k.endsWith('card')) delete TRAINER_CACHE[k]; drawMinis(); };
  }
  refreshTrainerLabels();
  const tick = () => {   // animated previews, facing the way they will in battle
    for (const S of ['A', 'B']) { const c = $('trPrev' + S); if (!c || !c.offsetParent) continue; const x = c.getContext('2d'), a = TR_ANIM[TRSEL[S]]; x.clearRect(0, 0, 80, 80); if (!a) continue;
      const f = a.frames[animFrameIndex(a, performance.now())], sc = Math.min(80 / a.w, 80 / a.h); x.save(); x.imageSmoothingEnabled = false;
      if (mirrorTrainer(S)) { x.translate(80, 0); x.scale(-1, 1); } x.drawImage(f, (80 - a.w * sc) / 2, 80 - a.h * sc, a.w * sc, a.h * sc); x.restore(); }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
})();
(function helpRows() {
  const grid = document.querySelector('#helpOv .qgrid'); if (!grid) return;
  grid.insertAdjacentHTML('beforeend', '<p>Trainers: pick one per side above the Pokémon lists. Add your own by putting <b>Name_trainer.png</b> (animated PNG) in the sprites folder</p>');
})();
