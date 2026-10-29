/* =====================================================================
   Section 10: trainers, HUD polish and performance guards
   ===================================================================== */

/* ---------- trainers: original designs, 32×40, shaded and outlined ---------- */
const TRAINER_LOOK = {
  A: { skin: ['#f2c39a', '#d89a72'], hair: ['#4a2c1c', '#2e1a10'], jacket: ['#5a8ae0', '#2f5fb8', '#1e3a78'], pants: ['#3a3f50', '#262a36'], shoe: ['#e8e8f0', '#d8283a'],
       scarf: ['#ff5a5a', '#c8202e'], hat: 'cap', hatC: ['#ff4a5a', '#d8283a', '#8a1420'], lens: '#7ff7ff', pack: ['#f4c84a', '#c8901c'] },
  B: { skin: ['#f6cfa8', '#dca47a'], hair: ['#f6d878', '#c8a040'], jacket: ['#f4b04a', '#e08a1e', '#9a5410'], pants: ['#2e3a5c', '#1e2a48'], shoe: ['#3a3a48', '#1e1e28'],
       scarf: ['#fff4dc', '#d8c8a0'], hat: 'beanie', hatC: ['#3fd0c4', '#1fa39a', '#0e6a64'], lens: null, pack: ['#9a6a3a', '#6a4422'] }
};
const TRAINER_CACHE = {};
function trainerArt(S, pose, frame) {
  const key = S + pose + frame; if (TRAINER_CACHE[key]) return TRAINER_CACHE[key];
  const L = TRAINER_LOOK[S], W = 32, H = 40, g = new Array(W * H).fill(null), X = 3;
  const put = (x, y, c) => { x = Math.round(x) + X; y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const limb = (x0, y0, x1, y1, w, c, c2) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; for (let a = 0; a < w; a++) put(x - Math.floor(w / 2) + a, y, a === 0 && c2 ? c2 : c); } };
  const slump = pose === 'slump', ub = (pose === 'idle' || pose === 'walk' ? frame : 0) + (slump ? 2 : 0), walk = pose === 'walk';
  // back arm, backpack, legs
  const backArm = pose === 'cheer' ? [9, 19 + ub, 6, 8] : slump ? [9, 20 + ub, 8, 30] : [9, 19 + ub, 7, 28 + ub];
  limb(...backArm, 3, L.jacket[2]); put(backArm[2], backArm[3] + 1, L.skin[1]);
  if (slotTeam(S) === 'A') { rect(4, 19 + ub, 5, 10, L.pack[1]); rect(4, 19 + ub, 4, 9, L.pack[0]); rect(5, 22 + ub, 3, 1, L.pack[1]); }
  else { rect(5, 26 + ub, 5, 5, L.pack[1]); rect(5, 26 + ub, 4, 4, L.pack[0]); }
  const lk = walk && frame ? 1 : 0;
  rect(10 - lk, 30, 3, 7, L.pants[1]); rect(13 + lk, 30, 3, 7, L.pants[0]); rect(15 + lk, 30, 1, 7, L.pants[1]);
  rect(9 - lk, 37, 4, 2, L.shoe[1]); rect(13 + lk, 37, 5, 2, L.shoe[1]); rect(13 + lk, 37, 4, 1, L.shoe[0]); rect(9 - lk, 37, 3, 1, L.shoe[0]);
  // jacket: lit from the left, darker on the right, with zip, pocket and hem
  for (let y = 18 + ub; y <= 30; y++) { const x0 = y === 18 + ub ? 9 : 8, x1 = y === 18 + ub ? 17 : 18; for (let x = x0; x <= x1; x++) put(x, y, x <= 10 ? L.jacket[0] : x >= 16 ? L.jacket[2] : L.jacket[1]); }
  rect(14, 19 + ub, 1, 11 - ub, L.jacket[0]); rect(10, 25 + ub, 3, 1, L.jacket[2]); rect(8, 30, 11, 1, L.jacket[2]);
  if (slotTeam(S) === 'B') limb(9, 19 + ub, 17, 28, 1, L.pack[1]);
  // scarf with a fluttering tail
  rect(9, 16 + ub, 9, 2, L.scarf[0]); rect(9, 18 + ub, 9, 1, L.scarf[1]); limb(9, 18 + ub, frame ? 6 : 7, 22 + ub + (frame ? 0 : 1), 2, L.scarf[0], L.scarf[1]);
  // head
  const hy = (slump ? 1 : 0) + ub;
  rect(10, 9 + hy, 8, 8, L.skin[0]); rect(10, 9 + hy, 1, 8, L.skin[1]); rect(11, 16 + hy, 6, 1, L.skin[1]); put(12, 12 + hy, L.skin[1]);
  rect(9, 7 + hy, 9, 3, L.hair[0]); rect(9, 10 + hy, 2, 5, L.hair[0]); rect(9, 13 + hy, 1, 2, L.hair[1]); put(17, 10 + hy, L.hair[0]);
  if (slump) { rect(14, 12 + hy, 2, 1, '#1a1a24'); rect(17, 12 + hy, 1, 1, '#1a1a24'); }
  else { rect(14, 11 + hy, 1, 2, '#1a1a24'); rect(17, 11 + hy, 1, 2, '#1a1a24'); put(14, 11 + hy, '#3a3a48'); }
  if (pose === 'cheer') { rect(15, 14 + hy, 2, 2, '#7a2a2a'); } else put(16, 14 + hy, L.skin[1]);
  if (L.hat === 'cap') { rect(9, 4 + hy, 9, 4, L.hatC[1]); rect(9, 4 + hy, 9, 1, L.hatC[0]); rect(9, 7 + hy, 9, 1, L.hatC[2]); rect(15, 8 + hy, 6, 1, L.hatC[2]); rect(16, 7 + hy, 5, 1, L.hatC[1]); rect(11, 5 + hy, 3, 2, '#ffffff'); rect(14, 5 + hy, 2, 2, L.lens); put(14, 5 + hy, '#ffffff'); }
  else { rect(9, 3 + hy, 9, 5, L.hatC[1]); rect(9, 3 + hy, 9, 1, L.hatC[0]); for (let x = 9; x < 18; x++) put(x, 8 + hy, x % 2 ? L.hatC[0] : L.hatC[2]); rect(12, 0 + hy, 3, 3, '#ffffff'); put(14, 2 + hy, '#d8d8e0'); }
  // front arm by pose
  const sleeve = (x0, y0, x1, y1) => { limb(x0, y0, x1, y1, 3, L.jacket[1], L.jacket[0]); };
  if (pose === 'throw') { sleeve(17, 19, 20, 11); rect(19, 8, 3, 3, L.skin[0]); put(21, 8, L.skin[1]); }
  else if (pose === 'point') { sleeve(17, 20, 24, 20); rect(25, 19, 2, 3, L.skin[0]); put(27, 20, L.skin[0]); }
  else if (pose === 'cheer') { sleeve(17, 19, 19, 9); rect(18, 6, 3, 3, L.skin[0]); }
  else if (slump) { sleeve(17, 21, 18, 30); rect(17, 31, 3, 2, L.skin[0]); }
  else { sleeve(17, 19 + ub, 18, 28 + ub); rect(17, 29 + ub, 3, 2, L.skin[0]); put(19, 30 + ub, L.skin[1]); }
  // crisp dark outline around the silhouette
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = g[j * W + i]; if (v) { x.fillStyle = v; x.fillRect(i, j, 1, 1); } else if ((i > 0 && g[j * W + i - 1]) || (i < W - 1 && g[j * W + i + 1]) || (j > 0 && g[(j - 1) * W + i]) || (j < H - 1 && g[(j + 1) * W + i])) { x.fillStyle = '#141824'; x.fillRect(i, j, 1, 1); } }
  return TRAINER_CACHE[key] = c;
}
// Used by the VS screen and HUD icons: same art, padded to the old 2:3 frame.
function trainerCanvas(S) {
  const key = S + 'card'; if (TRAINER_CACHE[key]) return TRAINER_CACHE[key];
  const c = document.createElement('canvas'); c.width = 32; c.height = 48; c.getContext('2d').drawImage(trainerArt(S, 'idle', 0), 0, 8); return TRAINER_CACHE[key] = c;
}
function drawMinis() { for (const S of ['A', 'B']) { const c = $('mini' + S), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, 16, 16); x.drawImage(trainerArt(S, 'idle', 0), 11, 1, 16, 16, 0, 0, 16, 16); } }
const TR_POSE = { A: null, B: null };
function hookTrainerFx() {
  if (hookTrainerFx.done || typeof VFX === 'undefined') return; hookTrainerFx.done = true;
  const w = VFX.windup, f = VFX.faint;
  VFX.windup = function (S, mv) { TR_POSE[S] = { pose: 'point', until: clock.t + 650 }; return w.apply(this, arguments); };
  VFX.faint = function (S) { TR_POSE[S] = { pose: 'slump', until: clock.t + 1500 }; TR_POSE[other(S)] = { pose: 'cheer', until: clock.t + 1000 }; return f.apply(this, arguments); };
}
function trainerPose(S) {
  if (trainerWalk[S] > .02) return 'walk';
  if (G && G.phase === 'over' && G.winner && G.winner !== 'draw') return G.winner === S ? 'cheer' : 'slump';
  const p = TR_POSE[S]; if (p && clock.t < p.until) return p.pose;
  if (G && G.sides && side(S) && G.time - side(S).throwT < 450 && G.time >= side(S).throwT) return 'throw';
  return 'idle';
}
function drawTrainer(S) {
  hookTrainerFx();
  const t = TRAINER_POS[S], off = trainerWalk[S] * (slotTeam(S) === 'A' ? -140 : 140), i = bx(t.x + off), j = by(t.y), pose = trainerPose(S);
  const frame = pose === 'walk' ? Math.floor(clock.t / 130) % 2 : pose === 'cheer' ? Math.floor(clock.t / 260) % 2 : Math.floor(clock.t / 560) % 2;
  const img = trainerArt(S, pose === 'cheer' && frame ? 'idle' : pose, pose === 'cheer' ? 0 : frame);
  aEllFill(i, j, 9, 3, '#0b0f1a', .35);
  bctx.save(); if (slotTeam(S) === 'B') { bctx.translate(i + 16, j - 40); bctx.scale(-1, 1); bctx.drawImage(img, 0, 0); } else bctx.drawImage(img, i - 16, j - 40); bctx.restore();
}

/* ---------- HUD: damage trail on the HP bars, pulse at low HP ---------- */
(function hudPolish() {
  const st = document.createElement('style');
  st.textContent = `.hpghost{position:absolute;top:0;bottom:0;left:0;width:100%;background:#fff1b8;transition:width .55s ease}
.side.right .hpghost{left:auto;right:0}.hpfill{z-index:1}.hpnum{z-index:2}
.hpfill.low{animation:hpLow .7s ease-in-out infinite alternate}@keyframes hpLow{from{filter:brightness(1)}to{filter:brightness(1.6)}}
.hpbar::after{content:'';position:absolute;left:0;right:0;top:2px;height:3px;background:rgba(255,255,255,.22);z-index:2;pointer-events:none}
@media (prefers-reduced-motion: reduce){.hpfill.low{animation:none}.hpghost{transition:none}}`;
  document.head.appendChild(st);
  for (const S of ['A', 'B']) { const bar = $('bar' + S); if (!bar || $('ghost' + S)) continue; const gh = document.createElement('div'); gh.className = 'hpghost'; gh.id = 'ghost' + S; bar.parentNode.insertBefore(gh, bar); gh._w = 100; }
  setInterval(() => { for (const S of ['A', 'B']) { const bar = $('bar' + S), gh = $('ghost' + S); if (!bar || !gh) continue;
    const w = parseFloat(bar.style.width) || 0; bar.classList.toggle('low', w > 0 && w < 25);
    if (w >= gh._w) { gh.style.width = w + '%'; gh._w = w; gh._pend = null; }
    else if (gh._pend !== w) { gh._pend = w; gh._at = performance.now() + 420; }
    else if (performance.now() > gh._at) { gh.style.width = w + '%'; gh._w = w; gh._pend = null; } } }, 90);
})();

/* ---------- performance guards: keep huge fights smooth ---------- */
setInterval(() => {
  if (parts.length > 1600) parts.splice(0, parts.length - 1600);
  if (ENTS.length > 280) ENTS.splice(0, ENTS.length - 280);
  if (typeof fx !== 'undefined' && fx.length > 300) fx.splice(0, fx.length - 300);
}, 500);
