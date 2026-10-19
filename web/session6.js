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

/* ---------- custom trainer sprites (your own files, like the Pokémon sprite pack) ----------
   sprites/trainer-red.gif   and sprites/trainer-gold.gif   (or .png). They face LEFT by default
   (Settings → Trainer art faces); the game mirrors whichever side needs it.
   Optional poses: trainer-red-throw, trainer-red-command, trainer-red-win, trainer-red-lose
   (same for gold). Missing poses fall back to the base file; no files = the built-in trainers. */
const TRAINER_SPR = { A: {}, B: {} };
const TRAINER_FILE = { A: 'trainer-red', B: 'trainer-gold' };
const TR_POSE_FILE = { throw: '-throw', point: '-command', cheer: '-win', slump: '-lose' };
(function loadTrainerSprites() {
  for (const S of ['A', 'B']) for (const suffix of ['', '-throw', '-command', '-win', '-lose'])
    loadAnim(TRAINER_FILE[S] + suffix).then(a => { if (!a) return; TRAINER_SPR[S][suffix || 'base'] = a; for (const k in TRAINER_CACHE) if (k.endsWith('card')) delete TRAINER_CACHE[k]; try { drawMinis(); } catch (e) { } });
})();
const customTrainer = S => TRAINER_SPR[S].base ? ensureAnim(TRAINER_SPR[S].base) : null;
function trainerAnimFor(S) { const pose = trainerPose(S), suf = TR_POSE_FILE[pose], a = suf && TRAINER_SPR[S][suf]; return ensureAnim(a || TRAINER_SPR[S].base); }

const _drawTrainerBuiltIn = drawTrainer;
drawTrainer = function (S) {
  if (!customTrainer(S)) return _drawTrainerBuiltIn(S);
  hookTrainerFx(); const t = TRAINER_POS[S], off = trainerWalk[S] * (S === 'A' ? -140 : 140);
  aEllFill(bx(t.x + off), by(t.y), 10, 3, '#0b0f1a', .35);      // the sprite itself is drawn crisply on the screen layer
};
// Which way the custom trainer art faces. Your files face left, so Red (who stands on the left) is mirrored.
const trainerArtFacesLeft = () => !window.SETTINGS || SETTINGS.trainerFacing !== 'right';
const mirrorTrainer = S => trainerArtFacesLeft() ? S === 'A' : S === 'B';
// Screen layer: drawn at the same pixel scale as the Pokémon sprites, feet on the trainer spot.
// One animation per trainer is enough: poses add motion (lean and hop to throw or command, bounce to cheer, sink when beaten).
function drawCustomTrainers(c) {
  for (const S of ['A', 'B']) {
    if (!customTrainer(S)) continue; const a = trainerAnimFor(S); if (!a || !a.frames) continue;
    const pose = trainerPose(S), hasPoseFile = !!(TR_POSE_FILE[pose] && TRAINER_SPR[S][TR_POSE_FILE[pose]]), dir = S === 'A' ? 1 : -1;
    const t = TRAINER_POS[S], off = trainerWalk[S] * (S === 'A' ? -140 : 140); let dx = 0, dy = 0, dim = 0;
    if (!hasPoseFile) {
      if (pose === 'throw' || pose === 'point') { dx = 3 * dir; dy = -Math.round(Math.abs(Math.sin(clock.t / 90)) * 2); }
      else if (pose === 'cheer') dy = -Math.round(Math.abs(Math.sin(clock.t / 140)) * 5);
      else if (pose === 'slump') { dy = 2; dim = .35; }
      else if (pose === 'walk') dy = -(Math.floor(clock.t / 130) % 2);
    }
    const x = toScreenX(t.x + off + dx * 2), y = toScreenY(t.y + dy * 2), src = a.frames[animFrameIndex(a, clock.t + (S === 'B' ? 333 : 0))];
    const tall = a.h - a.foot, unit = Math.max(1, Math.round(cam.pz / 2)), sc = tall > 160 ? 75 / tall * unit : unit;   // oversized files are scaled to a normal trainer height
    c.save(); c.imageSmoothingEnabled = tall > 160; c.translate(Math.round(x), Math.round(y)); if (mirrorTrainer(S)) c.scale(-1, 1);
    const X0 = Math.round(-a.cx * sc), Y0 = Math.round(-tall * sc), W = Math.round(a.w * sc), H = Math.round(a.h * sc);
    c.drawImage(src, X0, Y0, W, H);
    if (dim) { c.globalAlpha = dim; c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#0b1020'; c.fillRect(X0, Y0, W, H); }
    c.restore();
  }
}
// VS screen and HUD icons use the custom art too when it is present.
const _trainerCanvasBuiltIn = trainerCanvas;
trainerCanvas = function (S) {
  const a = customTrainer(S); if (!a) return _trainerCanvasBuiltIn(S);
  const key = S + 'card'; if (TRAINER_CACHE[key]) return TRAINER_CACHE[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 96; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const f = a.frames[0], sc = Math.min(64 / a.w, 96 / a.h); if (trainerArtFacesLeft()) { x.translate(64, 0); x.scale(-1, 1); } x.drawImage(f, (64 - a.w * sc) / 2, 96 - a.h * sc, a.w * sc, a.h * sc);
  return TRAINER_CACHE[key] = c;
};
const _drawMinisBuiltIn = drawMinis;
drawMinis = function () {
  _drawMinisBuiltIn();
  for (const S of ['A', 'B']) { const a = customTrainer(S); if (!a) continue; const c = $('mini' + S), x = c.getContext('2d'), f = a.frames[0], side_ = Math.min(a.w, a.h * .55);
    x.imageSmoothingEnabled = false; x.clearRect(0, 0, 16, 16); x.drawImage(f, a.cx - side_ / 2, Math.max(0, a.h - a.foot - a.h * .95), side_, side_, 0, 0, 16, 16); }
};
(function helpRows() {
  const grid = document.querySelector('#helpOv .qgrid'); if (!grid) return;
  grid.insertAdjacentHTML('beforeend', '<p>Custom trainers: put <b>trainer-red.gif</b> / <b>trainer-gold.gif</b> in the sprites folder (set which way they face in Settings)</p>');
})();

/* ---------- setting: which way custom trainer art faces ---------- */
(function trainerFacingSetting() {
  const card = document.querySelector('#setOv .qol-card'); if (!card) return; const btns = card.querySelector('.qbtns');
  const row = document.createElement('label'); row.className = 'qrow';
  row.innerHTML = `<span>Custom trainer art faces<small>Which way your trainer-red / trainer-gold files face; the game mirrors the side that needs it</small></span><select id="setTrFacing"><option value="left">Left</option><option value="right">Right</option></select>`;
  card.insertBefore(row, btns || null);
  const sel = $('setTrFacing'); sel.value = SETTINGS.trainerFacing === 'right' ? 'right' : 'left';
  sel.onchange = () => { SETTINGS.trainerFacing = sel.value; saveSettings(); for (const k in TRAINER_CACHE) if (k.endsWith('card')) delete TRAINER_CACHE[k]; try { drawMinis(); } catch (e) { } };
})();
