/* =====================================================================
   Section 21: high-resolution effects layer
   Move effects used to be painted into a small "art pixel" buffer and enlarged, which made
   every spark and flame look chunky. The effect layers (the ground layer under the Pokémon and
   the layer above them) are now drawn at full screen resolution. The old drawing helpers
   (aRect, aDisc, aLine, aRing, glow, zig, PX, beamPx, particles…) keep their names and their
   art-pixel coordinates, but on these layers they draw smooth, anti-aliased vector shapes with
   soft glows, so every existing move effect gets sharper and softer at once.
   ===================================================================== */
let ubuf = null, uctx = null;
function makeHiLayers() {
  const mk = () => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.__hi = true; return [c, x]; };
  [fbuf, fctx] = mk(); [ubuf, uctx] = mk();
}
// clear a hi-res layer and set it up so that art-pixel coordinates map straight onto the screen
function hiBegin(x) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, x.canvas.width, x.canvas.height);
  x.setTransform(cam.pz, 0, 0, cam.pz, 0, 0); x.imageSmoothingEnabled = false; x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.lineCap = 'round'; x.lineJoin = 'round';
}
const _rgbCache = new Map();
function rgbOf(col) {
  let v = _rgbCache.get(col); if (v) return v;
  let m = /^#([0-9a-f]{6})$/i.exec(col); if (m) { const n = parseInt(m[1], 16); v = [n >> 16, n >> 8 & 255, n & 255]; }
  else if ((m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(col))) v = [parseInt(m[1] + m[1], 16), parseInt(m[2] + m[2], 16), parseInt(m[3] + m[3], 16)];
  else if ((m = /^rgba?\(([^)]+)\)/.exec(col))) { const q = m[1].split(',').map(Number); v = [q[0] | 0, q[1] | 0, q[2] | 0]; } else v = [255, 255, 255];
  _rgbCache.set(col, v); return v;
}
const rgbaStr = (col, a) => { const v = rgbOf(col); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
// soft round blob: opaque-ish centre fading to nothing at the edge
function hiSoft(i, j, r, col, a, hard = .35) {
  if (!(isFinite(i) && isFinite(j) && isFinite(r) && isFinite(a))) return;
  const c = bctx, g = c.createRadialGradient(i, j, 0, i, j, Math.max(.5, r)); g.addColorStop(0, rgbaStr(col, a)); g.addColorStop(hard, rgbaStr(col, a * .72)); g.addColorStop(1, rgbaStr(col, 0));
  c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(i, j, Math.max(.5, r), 0, 6.2832); c.fill();
}
function hiDot(i, j, r, col, a) { if (!(isFinite(i) && isFinite(j) && isFinite(r) && isFinite(a))) return; const c = bctx; c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(i, j, Math.max(.5, r), 0, 6.2832); c.fill(); c.globalAlpha = 1; }
function hiRect(i, j, w, h, col, a) {
  const c = bctx; if (!(isFinite(i + j + w + h))) return;
  if (w <= 1.6 && h <= 1.6) return hiDot(i + w / 2, j + h / 2, Math.max(w, h) * .62 + .08, col, a);
  c.globalAlpha = a; c.fillStyle = col; c.fillRect(i, j, w, h); c.globalAlpha = 1;
}
function hiDisc(i, j, r, col, a) { hiDot(i, j, Math.max(.6, r), col, a); }
function hiRing(i, j, rx, ry, col, a, th) { if (!(isFinite(i) && isFinite(j) && isFinite(rx) && isFinite(ry))) return; const c = bctx; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = Math.max(.7, th * .85); c.beginPath(); c.ellipse(i, j, Math.max(.5, rx), Math.max(.5, ry), 0, 0, 6.2832); c.stroke(); c.globalAlpha = 1; }
function hiEll(i, j, rx, ry, col, a) { if (!(isFinite(i) && isFinite(j) && isFinite(rx) && isFinite(ry))) return; const c = bctx; c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(i, j, Math.max(.5, rx), Math.max(.5, ry), 0, 0, 6.2832); c.fill(); c.globalAlpha = 1; }
function hiLine(i0, j0, i1, j1, col, a, w) { if (!(isFinite(i0 + j0 + i1 + j1))) return; const c = bctx; c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = Math.max(.7, w * .9); c.beginPath(); c.moveTo(i0, j0); c.lineTo(i1, j1); c.stroke(); c.globalAlpha = 1; }
function hiGlow(i, j, r, col, a) { const c = bctx, op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter'; hiSoft(i, j, r, col, a, .25); c.globalCompositeOperation = op === 'lighter' ? 'lighter' : 'source-over'; }
// lightning: a jagged bolt with a wide soft halo, a coloured body and a white-hot core
function hiZig(i0, j0, i1, j1, col, w, jit, core) {
  if (!(isFinite(i0 + j0 + i1 + j1))) return;
  const c = bctx, d = Math.hypot(i1 - i0, j1 - j0), n = Math.max(3, Math.round(d / 3.2)), pts = [[i0, j0]];
  for (let k = 1; k < n; k++) { const t = k / n, f = Math.sin(t * Math.PI) * .9 + .25; pts.push([i0 + (i1 - i0) * t + (Math.random() - .5) * jit * 1.6 * f, j0 + (j1 - j0) * t + (Math.random() - .5) * jit * 1.6 * f]); } pts.push([i1, j1]);
  const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); };
  const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter'; c.strokeStyle = col;
  c.globalAlpha = .16; c.lineWidth = w * 4.2 + 1.4; path(); c.stroke(); c.globalAlpha = .45; c.lineWidth = w * 1.9 + .4; path(); c.stroke();
  c.globalCompositeOperation = op; c.globalAlpha = 1; c.lineWidth = Math.max(.6, w * .75); path(); c.stroke();
  c.strokeStyle = core || '#ffffff'; c.globalAlpha = .95; c.lineWidth = Math.max(.4, w * .32); path(); c.stroke(); c.globalAlpha = 1;
}
// a straight or wobbling beam: soft halo, then body layers, then a white core
function hiBeam(i0, j0, ang, len, w, R, a, wob) {
  if (!(isFinite(i0 + j0 + ang + len + w))) return;
  const c = bctx, ca = Math.cos(ang), sa = Math.sin(ang), n = Math.max(2, Math.round(len / 5)), pts = [];
  for (let k = 0; k <= n; k++) { const d = k * len / n, o = wob ? Math.sin(d / 5 - clock.t / 40) * wob * (.5 + .5 * Math.min(1, d / 40)) : 0; pts.push([i0 + ca * d - sa * o, j0 + sa * d + ca * o]); }
  const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]); };
  const op = c.globalCompositeOperation; c.globalCompositeOperation = 'lighter'; c.strokeStyle = R[3]; c.globalAlpha = .11 * a; c.lineWidth = w * 3.6; path(); c.stroke(); c.globalAlpha = .2 * a; c.lineWidth = w * 2.3; path(); c.stroke();
  c.globalCompositeOperation = 'source-over';
  for (const [ww, ci, al] of [[1.25, 4, .75], [1.0, 3, 1], [.62, 1, 1], [.26, 0, 1]]) { c.strokeStyle = R[ci]; c.globalAlpha = a * al; c.lineWidth = Math.max(.7, w * ww); path(); c.stroke(); }
  c.globalAlpha = 1; c.globalCompositeOperation = op;
}
// every particle shape as a smooth vector drawing
function hiParticle(p, i, j, s, q) {
  const c = bctx, col = p.ramp ? rampAt(p.ramp, q) : p.color, a = p.ramp ? Math.min(1, 1.25 - q) : 1 - q;
  if (p.add) c.globalCompositeOperation = 'lighter';
  c.fillStyle = col; c.strokeStyle = col; c.globalAlpha = a;
  const rot = p.rot || 0, tf = (fn) => { c.save(); c.translate(i, j); c.rotate(rot); fn(); c.restore(); };
  switch (p.shape) {
    case 'disc': hiSoft(i, j, s * 1.25 + .4, col, a * .85, .2); break;
    case 'ring': c.lineWidth = .8; c.beginPath(); c.arc(i, j, Math.max(.8, s), 0, 6.2832); c.stroke(); break;
    case 'bubble': c.lineWidth = .7; c.globalAlpha = a * .15; c.beginPath(); c.arc(i, j, Math.max(1, s * .95), 0, 6.2832); c.fill(); c.globalAlpha = a; c.stroke(); hiDot(i - s * .35, j - s * .35, Math.max(.35, s * .22), '#ffffff', a); break;
    case 'leaf': tf(() => { c.beginPath(); c.moveTo(-s * 1.5, 0); c.quadraticCurveTo(0, -s * .95, s * 1.5, 0); c.quadraticCurveTo(0, s * .95, -s * 1.5, 0); c.fill(); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = .35; c.beginPath(); c.moveTo(-s * 1.3, 0); c.lineTo(s * 1.3, 0); c.stroke(); }); break;
    case 'shard': tf(() => { c.beginPath(); c.moveTo(s * 2.3, 0); c.lineTo(0, s * .75); c.lineTo(-s * 1.2, 0); c.lineTo(0, -s * .75); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(s * 2.1, 0); c.lineTo(0, -s * .75); c.lineTo(-s * .2, 0); c.closePath(); c.fill(); }); break;
    case 'star': { const L = s * 1.7 + .8, W = Math.max(.3, s * .3); c.beginPath(); c.moveTo(i - L, j); c.quadraticCurveTo(i - W, j - W, i, j - L); c.quadraticCurveTo(i + W, j - W, i + L, j); c.quadraticCurveTo(i + W, j + W, i, j + L); c.quadraticCurveTo(i - W, j + W, i - L, j); c.fill(); hiDot(i, j, Math.max(.45, s * .35), '#ffffff', a * .8); break; }
    case 'plus': c.lineWidth = .7; c.beginPath(); c.moveTo(i - 1.6, j); c.lineTo(i + 1.6, j); c.moveTo(i, j - 1.6); c.lineTo(i, j + 1.6); c.stroke(); break;
    case 'zap': c.lineWidth = .8; c.beginPath(); c.moveTo(i - 1, j - 2.4); c.lineTo(i + 1, j - .7); c.lineTo(i - 1, j + .5); c.lineTo(i + 1, j + 2.4); c.stroke(); break;
    case 'drop': tf(() => { c.rotate(-rot); c.beginPath(); c.moveTo(0, -s * 1.6); c.quadraticCurveTo(s * 1.0, s * .2, 0, s * 1.0); c.quadraticCurveTo(-s * 1.0, s * .2, 0, -s * 1.6); c.fill(); hiDot(-s * .3, s * .1, Math.max(.3, s * .22), '#ffffff', a * .7); }); break;
    case 'heart': { const k = 1.1; c.beginPath(); c.moveTo(i, j + 2.8 * k); c.bezierCurveTo(i - 4.2 * k, j - .6 * k, i - 2.4 * k, j - 3.6 * k, i, j - 1.4 * k); c.bezierCurveTo(i + 2.4 * k, j - 3.6 * k, i + 4.2 * k, j - .6 * k, i, j + 2.8 * k); c.fill(); break; }
    case 'note': c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♪', i, j); break;
    case 'z': c.font = 'italic bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Z', i, j); break;
    case 'q': c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', i, j); break;
    case 'feather': tf(() => { c.beginPath(); c.ellipse(0, 0, 3.2, 1.0, 0, 0, 6.2832); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .35; c.beginPath(); c.moveTo(-3.4, 0); c.lineTo(3.4, 0); c.stroke(); }); break;
    default: { const r = Math.max(.55, s * .6); if (p.add) hiSoft(i, j, r * 2.2, col, a * .55, .3); hiDot(i, j, r, col, a); }
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
