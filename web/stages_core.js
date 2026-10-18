/* =====================================================================
   Section 7b: arena engine v2
   Each arena is baked once into three layers:
     floor  — the ground, walls and props (lit, shaded, ambient-occluded)
     front  — overhangs drawn in front of the Pokémon (stalactites, banners,
              capitals), with a little parallax so the scene has depth
     (sky)  — an optional animated backdrop behind see-through floors
   Every frame adds animated props, light, atmosphere and a colour grade.
   ===================================================================== */
const STAGE_FG = {};
const W2 = seed => {   // cellular noise → [d1, d2, cellX, cellY]
  const h = (x, y) => { let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ seed; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y, cell) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let d1 = 9, d2 = 9, cx = 0, cy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const X = gx + i, Y = gy + j, px = (X + .15 + h(X, Y) * .7) * cell, py = (Y + .15 + h(Y, X + 7) * .7) * cell, d = Math.hypot(x - px, y - py) / cell; if (d < d1) { d2 = d1; d1 = d; cx = X; cy = Y; } else if (d < d2) d2 = d; }
    return [d1, d2, cx, cy]; };
};
const hash2 = (x, y, s = 0) => { let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ s; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const dith = (i, j) => BAYER4[(j & 3) * 4 + (i & 3)] / 16;

/* ---------- pixel ops on a PixBuf ---------- */
function pxMul(B, i, j, f) { i |= 0; j |= 0; if (i < 0 || j < 0 || i >= B.w || j >= B.h) return; const o = (j * B.w + i) * 4; if (!B.d[o + 3]) return; B.d[o] *= f; B.d[o + 1] *= f; B.d[o + 2] *= f; }
function pxAdd(B, i, j, rgb, a) { i |= 0; j |= 0; if (i < 0 || j < 0 || i >= B.w || j >= B.h) return; const o = (j * B.w + i) * 4; if (!B.d[o + 3]) return; B.d[o] = Math.min(255, B.d[o] + rgb[0] * a); B.d[o + 1] = Math.min(255, B.d[o + 1] + rgb[1] * a); B.d[o + 2] = Math.min(255, B.d[o + 2] + rgb[2] * a); }
function pxTint(B, i, j, rgb, a) { i |= 0; j |= 0; if (i < 0 || j < 0 || i >= B.w || j >= B.h) return; const o = (j * B.w + i) * 4; if (!B.d[o + 3]) return; for (let k = 0; k < 3; k++) B.d[o + k] = B.d[o + k] + (rgb[k] - B.d[o + k]) * a; }
const filled = (B, i, j) => i >= 0 && j >= 0 && i < B.w && j < B.h && B.d[((j | 0) * B.w + (i | 0)) * 4 + 3] > 0;

// Baked coloured light pools with ordered dithering (pixel-art banding, no blur).
function bakeLight(B, lights) {
  for (const L of lights) { const rgb = hexToRgb(L.col), sq = L.sq || 1;
    for (let j = Math.floor(L.j - L.r * sq); j <= L.j + L.r * sq; j++) for (let i = Math.floor(L.i - L.r); i <= L.i + L.r; i++) {
      const d = Math.hypot(i - L.i, (j - L.j) / sq) / L.r; if (d >= 1) continue;
      const f = Math.floor(((1 - d) * (1 - d) * L.s) * 6 + dith(i, j)) / 6; if (f > 0) pxAdd(B, i, j, rgb, f); } }
}
// Ambient occlusion: darken floor pixels near anything that is not floor.
function bakeAO(B, isFloor, rad = 7, s = .45) {
  const W = B.w, H = B.h, D = new Float32Array(W * H).fill(99);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!isFloor(i, j)) D[j * W + i] = 0;
  for (let pass = 0; pass < 2; pass++) for (let jj = 0; jj < H; jj++) for (let ii = 0; ii < W; ii++) {
    const i = pass ? W - 1 - ii : ii, j = pass ? H - 1 - jj : jj, k = j * W + i; if (!D[k]) continue; const s2 = pass ? 1 : -1;
    for (const [di, dj, w] of [[s2, 0, 1], [0, s2, 1], [s2, s2, 1.4], [-s2, s2, 1.4]]) { const x = i + di, y = j + dj; if (x < 0 || y < 0 || x >= W || y >= H) continue; D[k] = Math.min(D[k], D[y * W + x] + w); } }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const d = D[j * W + i]; if (d > 0 && d < rad) { const f = Math.floor(Math.pow(1 - d / rad, 1.6) * s * 5 + dith(i, j)) / 5; if (f > 0) pxMul(B, i, j, 1 - f); } }
}
function bakeVignette(B, s = .4) { const cx = B.w / 2, cy = B.h / 2; for (let j = 0; j < B.h; j++) for (let i = 0; i < B.w; i++) { const d = Math.hypot((i - cx) / cx, (j - cy) / cy); if (d > .7) { const f = Math.floor(Math.min(1, (d - .7) / .6) * s * 6 + dith(i, j)) / 6; if (f > 0) pxMul(B, i, j, 1 - f); } } }

// Flagstone / slab floor: irregular stones with seams, bevels, tone variation, wear and cracks.
function slabs(B, x0, y0, x1, y1, inside, o) {
  const pal = o.pal, cellF = W2(o.seed || 3), n = vnoise((o.seed || 3) + 11), cell = o.cell || 10, seam = new Uint8Array(B.w * B.h);
  for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { if (!inside(i, j)) continue;
    const [d1, d2, cx, cy] = cellF(i * (o.sx || 1), j * (o.sy || 1), cell), edge = d2 - d1;
    if (edge < (o.seamW || .09)) { B.set(i, j, pal[0]); seam[j * B.w + i] = 1; continue; }
    const tone = hash2(cx, cy, o.seed || 3), wear = n(i / 7, j / 7) * .35 + (edge < .2 ? -.15 : 0);
    let k = clamp(Math.floor(1.5 + tone * (pal.length - 3) + wear * 1.6 + (dith(i, j) - .5) * .9), 1, pal.length - 1);
    B.set(i, j, pal[k]); }
  for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { if (!inside(i, j) || seam[j * B.w + i]) continue;
    if (seam[(j - 1) * B.w + i] || seam[j * B.w + i - 1]) B.set(i, j, o.hi || pal[pal.length - 1]);
    else if (seam[(j + 1) * B.w + i] || seam[j * B.w + i + 1]) pxMul(B, i, j, .82); }
  const r = mulberry(o.seed || 3);
  for (let k = 0; k < (o.cracks || 0); k++) { let i = x0 + r() * (x1 - x0), j = y0 + r() * (y1 - y0), a = r() * 6.28; for (let s = 0; s < 6 + r() * 14; s++) { i += Math.cos(a); j += Math.sin(a) * .7; a += (r() - .5) * .9; if (!inside(i | 0, j | 0)) break; B.set(i, j, pal[0]); pxMul(B, i + 1, j + 1, .9); } }
}
// Stone block rim with bevel (raised edges around a platform).
function rimBlocks(B, isRim, pal, len = 7) {
  for (let j = 0; j < B.h; j++) for (let i = 0; i < B.w; i++) { if (!isRim(i, j)) continue; const b = (i + (j % 2) * 3) % len === 0;
    B.set(i, j, b ? pal[0] : !isRim(i, j - 1) ? pal[3] : !isRim(i, j + 1) ? pal[1] : pal[2]); }
}
// Generic decorative bits
function gemPx(B, i, j, r, pal) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { if (Math.abs(x) + Math.abs(y) > r) continue; B.set(i + x, j + y, x + y < -r / 2 ? pal[3] : x + y < 0 ? pal[2] : x + y < r / 2 ? pal[1] : pal[0]); } B.set(i - 1, j - 1, '#ffffff'); }
function bowlProp(B, i, j, pal) { B.ell(i, j + 2, 7, 2, '#0a0e18', .5); for (let y = 0; y < 5; y++) { const w = 6 - y * .6; B.rect(i - w, j - 5 + y, w * 2 + 1, 1, y === 0 ? pal[3] : y < 2 ? pal[2] : pal[1]); } B.rect(i - 2, j, 5, 3, pal[1]); B.rect(i - 4, j + 3, 9, 1, pal[0]); }

/* ---------- runtime layers ---------- */
function buildStage(id) {
  if (STAGE_CACHE[id]) return STAGE_CACHE[id];
  const B = PixBuf(ART_W, ART_H), F = PixBuf(ART_W, ART_H), r = mulberry(hashStr(id) + 5);
  ({ summit: drawSummit, cavern: drawCavern, hall: drawHall, castle: drawCastle, grand: drawGrand, meteor: drawMeteor })[id](B, r, F);
  const c = B.toCanvas(); STAGE_CACHE[id] = c; STAGE_FG[id] = F.toCanvas(); return c;
}
const GRADE = {
  summit: { col: 'rgba(120,160,230,1)', a: .10, vig: .35 }, cavern: { col: 'rgba(150,90,230,1)', a: .12, vig: .45 },
  hall: { col: 'rgba(255,200,120,1)', a: .08, vig: .3 }, castle: { col: 'rgba(255,230,180,1)', a: .06, vig: .2 },
  grand: { col: 'rgba(60,200,200,1)', a: .09, vig: .45 }, meteor: { col: 'rgba(180,120,230,1)', a: .1, vig: .4 }
};
function stageGrade(c) {
  const g = GRADE[STAGE_ID]; if (!g) return;
  c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = g.a * 3; c.fillStyle = g.col; c.fillRect(0, 0, DW, DH); c.restore();
  if (!stageGrade.v || stageGrade.v.w !== DW || stageGrade.v.h !== DH || stageGrade.v.id !== STAGE_ID) {
    const v = document.createElement('canvas'); v.width = DW; v.height = DH; const x = v.getContext('2d'), gr = x.createRadialGradient(DW / 2, DH / 2, Math.min(DW, DH) * .35, DW / 2, DH / 2, Math.max(DW, DH) * .72);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(4,6,14,${g.vig})`); x.fillStyle = gr; x.fillRect(0, 0, DW, DH); stageGrade.v = { w: DW, h: DH, id: STAGE_ID, c: v }; }
  c.drawImage(stageGrade.v.c, 0, 0);
}
// Front layer: parallax so overhangs drift slightly faster than the floor as the camera moves.
function drawStageForeground(b, ox, oy, t) {
  const F = STAGE_FG[STAGE_ID]; if (!F) return;
  const vw = Math.ceil(DW / cam.pz), vh = Math.ceil(DH / cam.pz), px = Math.round((ox - (ART_W - vw) / 2) * .12), py = Math.round((oy - (ART_H - vh) / 2) * .12);
  b.drawImage(F, -ox - px, -oy - py);
  if (typeof animateFront === 'function') animateFront(b, ox + px, oy + py, t);
}
