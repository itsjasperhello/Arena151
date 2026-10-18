/* =====================================================================
   Section 7a: stages — six detailed pixel-art arenas
   Art space: 1 art pixel = 2 world units; the stage canvas covers world
   x −200…1200, y −150…710 so the camera can pan past the arena edges.
   Each arena is painted once into three layers:
     base  – floor, walls, props, with baked lighting and ambient occlusion
     fg    – foreground pieces drawn over the Pokémon (railings, lamp heads…)
   plus a per-frame atmosphere pass (flickering lights, mist, light shafts,
   dripping water) and a colour grade.
   ===================================================================== */
const ART_X0 = -200, ART_Y0 = -150, ART_W = 700, ART_H = 430;
const toArtX = x => (x - ART_X0) / 2, toArtY = y => (y - ART_Y0) / 2;
const fromArtX = i => i * 2 + ART_X0, fromArtY = j => j * 2 + ART_Y0;
const AX = x => Math.round(toArtX(x)), AY = y => Math.round(toArtY(y));
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dith = (i, j) => BAYER4[(j & 3) * 4 + (i & 3)] / 16 - .5;

/* ---------- pixel buffer ---------- */
function PixBuf(w, h) {
  const d = new Uint8ClampedArray(w * h * 4), cache = {};
  const rgb = hex => cache[hex] || (cache[hex] = hexToRgb(hex));
  const B = {
    w, h, d,
    set(i, j, hex, a = 1) {
      i |= 0; j |= 0; if (i < 0 || j < 0 || i >= w || j >= h) return; const o = (j * w + i) * 4, c = rgb(hex);
      if (a >= 1 || d[o + 3] === 0) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = a >= 1 ? 255 : Math.round(255 * a); }
      else { d[o] += (c[0] - d[o]) * a; d[o + 1] += (c[1] - d[o + 1]) * a; d[o + 2] += (c[2] - d[o + 2]) * a; d[o + 3] = Math.max(d[o + 3], Math.round(255 * a)); }
    },
    alpha(i, j) { i |= 0; j |= 0; return (i < 0 || j < 0 || i >= w || j >= h) ? 0 : d[(j * w + i) * 4 + 3]; },
    mul(i, j, f) { i |= 0; j |= 0; if (i < 0 || j < 0 || i >= w || j >= h) return; const o = (j * w + i) * 4; d[o] *= f; d[o + 1] *= f; d[o + 2] *= f; },
    add(i, j, r, g, b) { i |= 0; j |= 0; if (i < 0 || j < 0 || i >= w || j >= h) return; const o = (j * w + i) * 4; d[o] += r; d[o + 1] += g; d[o + 2] += b; },
    rect(x, y, rw, rh, hex, a) { for (let j = Math.round(y); j < Math.round(y + rh); j++) for (let i = Math.round(x); i < Math.round(x + rw); i++) B.set(i, j, hex, a); },
    ell(cx, cy, rx, ry, hex, a) { for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) { const u = (i + .5 - cx) / rx, v = (j + .5 - cy) / ry; if (u * u + v * v <= 1) B.set(i, j, hex, a); } },
    ring(cx, cy, r, th, hex, a, sq = 1) { for (let j = Math.floor(cy - r * sq - th); j <= cy + r * sq + th; j++) for (let i = Math.floor(cx - r - th); i <= cx + r + th; i++) { const dd = Math.hypot(i + .5 - cx, (j + .5 - cy) / sq); if (Math.abs(dd - r) <= th / 2) B.set(i, j, hex, a); } },
    line(x0, y0, x1, y1, hex, a) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; for (let k = 0; k <= n; k++) B.set(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), hex, a); },
    shadow(cx, cy, rx, ry, f = .6) { for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) { const u = (i + .5 - cx) / rx, v = (j + .5 - cy) / ry, q = u * u + v * v; if (q <= 1) B.mul(i, j, 1 - (1 - f) * (1 - q * .6) * (dith(i, j) + .5 > q * .9 ? 1 : .6)); } },
    toCanvas() { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const img = x.createImageData(w, h); img.data.set(d); x.putImageData(img, 0, 0); return c; }
  };
  return B;
}
function vnoise(seed) {
  const h = (x, y) => { let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); return lerp(lerp(h(xi, yi), h(xi + 1, yi), xf), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf); };
}
function worley(seed, cell) {      // [nearest, second nearest, cell id]
  const r = (x, y) => { let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ seed; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, px = (cx + r(cx, cy)) * cell, py = (cy + r(cy, cx + 7)) * cell, d = Math.hypot(x - px, y - py) / cell; if (d < d1) { d2 = d1; d1 = d; id = r(cx * 3 + 1, cy * 5 + 2); } else if (d < d2) d2 = d; }
    return [d1, d2, id]; };
}
// Chamfer distance (in pixels) from every pixel to the nearest pixel where mask is false.
function distField(w, h, mask) {
  const D = new Float32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) D[j * w + i] = mask(i, j) ? 1e6 : 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (!D[k]) continue; if (i) D[k] = Math.min(D[k], D[k - 1] + 1); if (j) D[k] = Math.min(D[k], D[k - w] + 1); if (i && j) D[k] = Math.min(D[k], D[k - w - 1] + 1.41); if (j && i < w - 1) D[k] = Math.min(D[k], D[k - w + 1] + 1.41); }
  for (let j = h - 1; j >= 0; j--) for (let i = w - 1; i >= 0; i--) { const k = j * w + i; if (!D[k]) continue; if (i < w - 1) D[k] = Math.min(D[k], D[k + 1] + 1); if (j < h - 1) D[k] = Math.min(D[k], D[k + w] + 1); if (i < w - 1 && j < h - 1) D[k] = Math.min(D[k], D[k + w + 1] + 1.41); if (j < h - 1 && i) D[k] = Math.min(D[k], D[k + w - 1] + 1.41); }
  return D;
}
// Darken pixels close to the edge of a region (soft contact shadow), banded and dithered.
function bakeAO(B, mask, radius, strength) {
  const D = distField(B.w, B.h, mask);
  for (let j = 0; j < B.h; j++) for (let i = 0; i < B.w; i++) { const dd = D[j * B.w + i]; if (dd === 0 || dd > radius) continue; const t = 1 - dd / radius, q = Math.round((t * t + dith(i, j) * .25) * 4) / 4; if (q > 0) B.mul(i, j, 1 - strength * q); }
}
// Additive coloured light with banded, dithered falloff (the pixel-art lighting look).
function bakeLights(B, lights, scale = 1) {
  for (const L of lights) {
    const [r, g, b] = hexToRgb(L.col), cx = AX(L.x), cy = AY(L.y), R = L.r;
    for (let j = Math.max(0, cy - R); j < Math.min(B.h, cy + R); j++) for (let i = Math.max(0, cx - R); i < Math.min(B.w, cx + R); i++) {
      const dd = Math.hypot(i - cx, (j - cy) * (L.flat ? 1.6 : 1)) / R; if (dd >= 1) continue;
      const f = Math.round(((1 - dd) * (1 - dd) + dith(i, j) * .18) * 5) / 5 * L.a * scale; if (f <= 0) continue;
      B.add(i, j, r * f, g * f, b * f);
    }
  }
}
function boulder(B, gx, gy, sw, sh, pal = ['#eef3f6', '#c9d2da', '#8a96a4', '#6b7684', '#4e5866', '#2e3540'], seed = 1) {
  const r = mulberry(seed); B.shadow(gx + sw * .55, gy + sh * .8, sw * .6, sh * .45, .55);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const u = (x - sw / 2) / (sw / 2), v = (y - sh / 2) / (sh / 2), e = u * u + v * v + (r() - .5) * .12; if (e > 1) continue;
    const lit = -u * .5 - v * .7 + (1 - e) * .5, k = lit > .55 ? 1 : lit > .2 ? 2 : lit > -.15 ? 3 : 4; B.set(gx + x, gy + y, y < sh * .3 && lit > -.2 ? pal[0] : pal[k]); }
}
function crystal(B, x, y, hgt, pal, r) {
  const n = 2 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const ox = x + (k - n / 2) * 3 + Math.round((r() - .5) * 2), hh = Math.round(hgt * (.55 + r() * .5)), w = 2 + Math.floor(r() * 2), lean = (r() - .5) * .5;
    for (let j = 0; j < hh; j++) { const t = j / hh, ww = Math.max(1, Math.round(w * (1 - t * .65))), cx = ox + lean * j;
      for (let i = -ww; i <= ww; i++) B.set(cx + i, y - j, i < 0 ? pal[2] : i === 0 ? pal[3] : pal[1]); }
    B.set(ox + lean * hh, y - hh, pal[3]); B.line(ox - w - 1, y + 1, ox + w + 1, y + 1, pal[0]);
  }
}
// small original spectator figures (top-down), palette-swapped
const CROWD_PALS = [
  { coat: '#2b2d3a', hat: '#1d1f29', skin: '#f0c6a0', trim: '#c23a3a' }, { coat: '#3d5a8a', hat: '#2a3e60', skin: '#e8b48e', trim: '#f1d36b' },
  { coat: '#6a4a8a', hat: '#4a3062', skin: '#f4cfae', trim: '#e9e4da' }, { coat: '#4f6b3a', hat: '#354a26', skin: '#d9a47e', trim: '#e3c46a' },
  { coat: '#8a3a3a', hat: '#5e2424', skin: '#f2c39c', trim: '#2d2d3a' }, { coat: '#3a6a6a', hat: '#244848', skin: '#c99272', trim: '#e9e4da' }
];
function drawSpectator(c, ax, ay, pal, facing = 1) {
  const px = (x, y, col, w = 1, hh = 1) => { c.fillStyle = col; c.fillRect(Math.round(ax + x), Math.round(ay + y), w, hh); };
  px(-5, 0, '#0005', 10, 1);
  px(-3, -4, '#20222c', 2, 4); px(1, -4, '#20222c', 2, 4); px(-3, -1, '#3a3d4a', 2, 1); px(1, -1, '#3a3d4a', 2, 1);
  px(-4, -10, pal.coat, 8, 6); px(-4, -10, mix(pal.coat, '#ffffff', .25), 1, 6); px(3, -10, mix(pal.coat, '#000000', .35), 1, 6); px(-4, -5, mix(pal.coat, '#000000', .3), 8, 1);
  px(-1, -10, pal.trim, 2, 5);
  px(-3, -15, pal.skin, 6, 5); px(2, -15, mix(pal.skin, '#000000', .2), 1, 5); px(-3, -16, pal.hat, 6, 2); px(-4, -15, pal.hat, 1, 2); px(3, -15, pal.hat, 1, 2); px(-2, -17, mix(pal.hat, '#ffffff', .2), 4, 1);
  px(facing > 0 ? 0 : -2, -13, '#1a1a22', 1, 1); px(facing > 0 ? 2 : -1, -13, '#1a1a22', 1, 1);
}

/* ---------- stage definitions (walkable floor, trainers, entry points, crowd, lights, grade) ---------- */
const STAGES = {
  summit: { name: 'Storm Summit', ambient: 'snow', walk: [[90, 70, 910, 520]], trainers: { A: { x: 46, y: 300 }, B: { x: 954, y: 280 } }, entry: { A: { x: 190, y: 300 }, B: { x: 810, y: 260 } }, crowd: [],
    grade: ['18,32,58', .10], vignette: .55 },
  cavern: { name: 'Crystal Cavern', ambient: 'motes', walk: [[110, 90, 890, 505]], trainers: { A: { x: 120, y: 300 }, B: { x: 880, y: 290 } }, entry: { A: { x: 230, y: 300 }, B: { x: 770, y: 280 } },
    crowd: [[200, 30], [330, 22], [520, 26], [690, 24], [820, 32], [180, 600], [420, 606], [640, 602], [860, 598]], grade: ['40,20,80', .12], vignette: .7 },
  hall: { name: 'Champion Hall', ambient: 'glint', walk: [[80, 80, 920, 500]], trainers: { A: { x: 70, y: 290 }, B: { x: 930, y: 290 } }, entry: { A: { x: 200, y: 290 }, B: { x: 800, y: 290 } },
    crowd: [[300, 8], [380, 4], [620, 4], [700, 8]], grade: ['60,40,10', .06], vignette: .5 },
  castle: { name: 'Sky Castle', ambient: 'dust', walk: [[70, 215, 930, 385], [390, 50, 610, 520], [150, 150, 300, 450], [700, 150, 850, 450]],
    trainers: { A: { x: 60, y: 300 }, B: { x: 950, y: 300 } }, entry: { A: { x: 220, y: 300 }, B: { x: 780, y: 300 } }, crowd: [], grade: ['10,40,36', .10], vignette: .6 },
  grand: { name: 'Grand Hall', ambient: 'notes', walk: [[90, 60, 900, 520]], trainers: { A: { x: 80, y: 300 }, B: { x: 920, y: 300 } }, entry: { A: { x: 220, y: 300 }, B: { x: 780, y: 300 } },
    crowd: [[960, 120], [985, 420]], grade: ['16,26,50', .08], vignette: .55 },
  meteor: { name: 'Meteor Cave', ambient: 'sparkle', walk: [[90, 70, 905, 520]], trainers: { A: { x: 60, y: 300 }, B: { x: 940, y: 290 } }, entry: { A: { x: 200, y: 300 }, B: { x: 800, y: 280 } }, crowd: [],
    grade: ['40,20,64', .12], vignette: .65 }
};
const STAGE_ORDER = ['summit', 'cavern', 'hall', 'castle', 'grand', 'meteor'];
let STAGE = STAGES.summit, stageCanvas = null, stageFg = null, STAGE_ID = 'summit';
const BOUND = { x0: 90, x1: 910, y0: 70, y1: 520 };
const ENTRY = { A: { x: 190, y: 300 }, B: { x: 810, y: 260 } };
const TRAINER_POS = { A: { x: 46, y: 300 }, B: { x: 954, y: 280 } };
const STAGE_LIGHTS = {};      // id → [{x, y, r (art px), col, a, flicker}]
const STAGE_CACHE = {};
function setStage(id) {
  STAGE_ID = STAGES[id] ? id : 'summit'; STAGE = STAGES[STAGE_ID];
  const w = STAGE.walk; BOUND.x0 = Math.min(...w.map(r => r[0])); BOUND.y0 = Math.min(...w.map(r => r[1])); BOUND.x1 = Math.max(...w.map(r => r[2])); BOUND.y1 = Math.max(...w.map(r => r[3]));
  Object.assign(ENTRY.A, STAGE.entry.A); Object.assign(ENTRY.B, STAGE.entry.B); Object.assign(TRAINER_POS.A, STAGE.trainers.A); Object.assign(TRAINER_POS.B, STAGE.trainers.B);
  const built = buildStage(STAGE_ID); stageCanvas = built.base; stageFg = built.fg;
}
function inWalk(x, y) { return STAGE.walk.some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]); }
function clampWalk(x, y) {
  if (inWalk(x, y)) return [x, y];
  let best = null, bd = Infinity;
  for (const r of STAGE.walk) { const cx = clamp(x, r[0], r[2]), cy = clamp(y, r[1], r[3]), d = (cx - x) ** 2 + (cy - y) ** 2; if (d < bd) { bd = d; best = [cx, cy]; } }
  return best;
}
function buildStage(id) {
  if (STAGE_CACHE[id]) return STAGE_CACHE[id];
  const B = PixBuf(ART_W, ART_H), F = PixBuf(ART_W, ART_H), r = mulberry(hashStr(id) + 5), lights = [];
  ({ summit: paintSummit, cavern: paintCavern, hall: paintHall, castle: paintCastle, grand: paintGrand, meteor: paintMeteor })[id](B, F, r, lights);
  bakeLights(B, lights, .65); STAGE_LIGHTS[id] = lights;
  const out = { base: B.toCanvas(), fg: F.toCanvas() }; STAGE_CACHE[id] = out; return out;
}

/* ===================== 1. STORM SUMMIT ===================== */
function paintSummit(B, F, r, L) {
  const n1 = vnoise(11), n2 = vnoise(23), n3 = vnoise(37), n4 = vnoise(51), n5 = vnoise(67);
  const snow = ['#4e5a6c', '#5e6b7c', '#6f7d8e', '#8391a1', '#97a4b3', '#abb7c4', '#bfc9d3', '#d1d9e1', '#e1e7ec', '#eef2f5', '#f8fafc'];
  // wind-sculpted snow: a height field stretched along the wind, lit from the upper left
  const H = new Float32Array(ART_W * ART_H);
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const x = fromArtX(i), y = fromArtY(j);
    let v = n1(i / 80, j / 26) * .5 + n2(i / 34, j / 11) * .28 + n3(i / 10, j / 6) * .1 + Math.sin(i * .09 + n4(i / 40, j / 40) * 7) * .05;
    const e = Math.max(0, 40 - x, x - 960, 30 - y, y - 560) / 90; v -= Math.min(.5, e * .6);
    H[j * ART_W + i] = v;
  }
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const k = j * ART_W + i, h = H[k], slope = (H[k] - (H[k + ART_W + 1] ?? H[k])) * 9, t = clamp(h * 1.3 + .02 + slope + dith(i, j) * .06, 0, .999);
    B.set(i, j, snow[Math.floor(t * snow.length)]);
  }
  // glassy ice patches with diagonal glints
  for (let k = 0; k < 7; k++) { const cx = AX(150 + r() * 700), cy = AY(100 + r() * 380), rx = 10 + r() * 16, ry = 4 + r() * 6;
    for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) { const q = (i / rx) ** 2 + (j / ry) ** 2 + (n5((cx + i) / 5, (cy + j) / 5) - .5) * .5; if (q > 1) continue; B.set(cx + i, cy + j, q > .8 ? '#a9c6d8' : (i + j * 2) % 9 === 0 ? '#ffffff' : (i - j) % 13 === 0 ? '#e6f4fb' : '#c3dcea'); } }
  // footprint trails
  for (let t = 0; t < 4; t++) { let x = AX(120 + r() * 760), y = AY(90 + r() * 400), a = r() * 6.28; for (let s = 0; s < 14; s++) { a += (r() - .5) * .5; x += Math.cos(a) * 6; y += Math.sin(a) * 4; const o = s % 2 ? 2 : -2; B.ell(x - Math.sin(a) * o, y + Math.cos(a) * o, 1.5, 1, '#8391a1'); B.set(x - Math.sin(a) * o, y + Math.cos(a) * o - 1, '#abb7c4'); } }
  // half-buried arena markings
  const seg = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) { const i = Math.round(lerp(x0, x1, k / n)), j = Math.round(lerp(y0, y1, k / n)); if (n2(i / 12, j / 12) > .62) continue; B.set(i, j, '#3c4452', .55); B.set(i, j + 1, '#ffffff', .35); } };
  const bx0 = AX(50), by0 = AY(40), bx1 = AX(950), by1 = AY(550); seg(bx0, by0, bx1, by0); seg(bx0, by1, bx1, by1); seg(bx0, by0, bx0, by1); seg(bx1, by0, bx1, by1); seg(AX(500), by0, AX(500), by1);
  for (let a = 0; a < 6.28; a += .01) { const i = Math.round(AX(500) + Math.cos(a) * 60), j = Math.round(AY(280) + Math.sin(a) * 55); if (n2(i / 10, j / 10) < .6) B.set(i, j, '#ffffff', .45); }
  // rocky rim with snow caps
  for (let k = 0; k < 34; k++) { const edge = k % 4, x = edge === 0 ? -180 + r() * 220 : edge === 1 ? 980 + r() * 200 : r() * 1000, y = edge === 2 ? -140 + r() * 160 : edge === 3 ? 572 + r() * 120 : r() * 560;
    boulder(edge === 3 && r() < .6 ? F : B, AX(x), AY(y), 8 + Math.floor(r() * 14), 6 + Math.floor(r() * 8), undefined, k * 31); }
  // stone cairn and flag posts (flags are animated in the overlay)
  const cx = AX(500), cy = AY(-70); for (let s = 0; s < 4; s++) boulder(B, cx - 8 + s, cy - s * 5, 16 - s * 3, 7, undefined, 400 + s);
  for (const [x, y] of [[60, 60], [940, 60], [60, 540], [940, 540]]) { const i = AX(x), j = AY(y); B.shadow(i + 3, j + 1, 4, 2, .6); B.rect(i - 1, j - 22, 2, 22, '#5a3a24'); B.rect(i - 1, j - 22, 1, 22, '#8a5a34'); B.rect(i - 2, j - 24, 4, 2, '#eef2f5'); }
}

/* ===================== 2. CRYSTAL CAVERN ===================== */
function paintCavern(B, F, r, L) {
  const n1 = vnoise(101), n2 = vnoise(131), W1 = worley(77, 16), W2 = worley(91, 9), W3 = worley(55, 14);
  const rock = ['#120e22', '#181230', '#1f183c', '#28204a', '#322858', '#3d3268'];
  // cave rock: lit boulder cells with strata
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { const [a, b] = W1(i, j), [a2] = W1(i - 1.5, j - 1.5), lit = (a - a2) * 3, edge = b - a < .08 ? -.25 : 0, strata = Math.sin(j * .35 + n1(i / 30, j / 30) * 5) * .06;
    B.set(i, j, rock[clamp(Math.floor((.45 + lit + edge + strata + n1(i / 20, j / 20) * .25 + dith(i, j) * .1) * rock.length), 0, rock.length - 1)]); }
  // upper gallery ledge
  const ledgeY = AY(60), lrock = ['#2e2656', '#3a3068', '#463b7c', '#544890', '#6456a6', '#7666ba', '#8a7ace'];
  for (let j = 0; j < ledgeY; j++) for (let i = 0; i < ART_W; i++) { const [a, b] = W2(i, j), [a2] = W2(i - 1, j - 1), lit = (a - a2) * 4, edge = b - a < .1 ? -.3 : 0;
    B.set(i, j, lrock[clamp(Math.floor((.5 + lit + edge + n2(i / 16, j / 16) * .3 - (ledgeY - j) / ledgeY * .25 + dith(i, j) * .1) * lrock.length), 0, lrock.length - 1)]); }
  for (let i = 0; i < ART_W; i++) { const jag = Math.round(Math.sin(i * .37) * 1.5 + n2(i / 6, 3) * 3); B.set(i, ledgeY + jag - 1, '#b8a8f0'); B.set(i, ledgeY + jag, '#9a8ae0'); for (let k = 1; k < 6; k++) B.mul(i, ledgeY + jag + k, .55 + k * .07); }
  // wooden railing along the gallery edge (foreground)
  for (let i = 0; i < ART_W; i++) { const j = ledgeY + 4; F.set(i, j, '#6a4428'); F.set(i, j + 1, '#3a2414'); if (i % 22 === 0) { F.rect(i - 1, j - 5, 2, 7, '#7a5030'); F.set(i - 1, j - 5, '#a8784a'); } }
  // lower ledge
  const lowY = AY(560);
  for (let j = lowY; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { const [a, b] = W2(i + 40, j), lit = (a - W2(i + 39, j - 1)[0]) * 4; B.set(i, j, lrock[clamp(Math.floor((.35 + lit + (b - a < .1 ? -.25 : 0) + dith(i, j) * .1) * 5), 0, 6)]); }
  for (let i = 0; i < ART_W; i++) { B.set(i, lowY, '#9a8ae0'); B.set(i, lowY + 1, '#6456a6'); }
  // the arena slab: big flagstones with bevels, mortar, moss and glowing fungus
  const x0 = AX(95), y0 = AY(75), x1 = AX(905), y1 = AY(520), rad = 14;
  const inSlab = (i, j) => { const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad); return Math.hypot(i - cx, j - cy) <= rad; };
  const moatD = (i, j) => { const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad); return Math.hypot(i - cx, j - cy) - rad; };
  const slate = ['#2a283c', '#323046', '#3a3850', '#43415a', '#4c4a65', '#565470', '#615f7c', '#6e6c8a'];
  for (let j = y0 - 14; j <= y1 + 14; j++) for (let i = x0 - 14; i <= x1 + 14; i++) {
    const md = moatD(i, j);
    if (md > 0 && md <= 10) { const water = ['#06202f', '#0a2e44', '#0f4466', '#145d88', '#1e7bb0', '#3aa6d8', '#7fdcf6']; B.set(i, j, water[clamp(Math.floor((1 - md / 11 + n1(i / 6, j / 6) * .3 - .15 + dith(i, j) * .15) * water.length), 0, 6)]); continue; }
    if (!inSlab(i, j)) continue;
    const [a, b, id] = W3(i, j), mortar = b - a < .09, bevelL = W3(i - 1, j - 1)[2] !== id, bevelD = W3(i + 1, j + 1)[2] !== id;
    let t = .3 + id * .35 + n2(i / 14, j / 14) * .2 + dith(i, j) * .08; if (bevelL) t += .25; if (bevelD) t -= .2;
    let col = slate[clamp(Math.floor(t * slate.length), 0, slate.length - 1)];
    if (mortar) col = n1(i / 3, j / 3) > .62 ? '#2f5a4a' : '#1c1a2a';
    B.set(i, j, col);
  }
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (inSlab(i, j) && (!inSlab(i - 1, j) || !inSlab(i + 1, j) || !inSlab(i, j - 1) || !inSlab(i, j + 1))) { B.set(i, j, '#c0f6ff'); B.set(i, j + 1, '#7fdcf6'); }
  bakeAO(B, (i, j) => inSlab(i, j), 7, .35);
  // cracks with lit lower lip
  for (let k = 0; k < 40; k++) { let i = x0 + 8 + r() * (x1 - x0 - 16), j = y0 + 8 + r() * (y1 - y0 - 16), a = r() * 6.28; const len = 8 + r() * 24; for (let q = 0; q < len; q++) { i += Math.cos(a); j += Math.sin(a) * .8; a += (r() - .5) * .7; if (!inSlab(i | 0, j | 0)) break; B.set(i, j, '#16141f'); B.set(i, j + 1, '#77759a', .6); } }
  // glowing fungus clusters on the slab edges
  for (let k = 0; k < 14; k++) { const side_ = k % 4, i = side_ < 2 ? x0 + 3 + r() * (x1 - x0 - 6) : side_ === 2 ? x0 + 3 + r() * 6 : x1 - 3 - r() * 6, j = side_ === 0 ? y0 + 3 + r() * 5 : side_ === 1 ? y1 - 3 - r() * 5 : y0 + 4 + r() * (y1 - y0 - 8);
    for (let m = 0; m < 5; m++) { const ox = Math.round((r() - .5) * 6), oy = Math.round((r() - .5) * 4); B.set(i + ox, j + oy, '#7fffd0'); B.set(i + ox, j + oy - 1, '#d8fff0'); }
    L.push({ x: fromArtX(i), y: fromArtY(j), r: 14, col: '#3fffb0', a: .35, flicker: .15 }); }
  // crystal clusters with their own light
  const CY = ['#1d5f8a', '#4fc6f0', '#9eeaff', '#ffffff'], VI = ['#4a2c86', '#9a6ae0', '#d3b6ff', '#ffffff'];
  for (let k = 0; k < 28; k++) { const top = k < 16, i = top ? 10 + r() * (ART_W - 20) : r() < .5 ? 6 + r() * (x0 - 24) : x1 + 18 + r() * (ART_W - x1 - 24), j = top ? ledgeY - 6 - r() * 20 : y0 + r() * (y1 - y0), pal = r() < .5 ? CY : VI, s = 10 + r() * 14;
    crystal(B, Math.round(i), Math.round(j), s, pal, r); L.push({ x: fromArtX(i), y: fromArtY(j - s * .4), r: 22 + s, col: pal === CY ? '#2fb0ff' : '#9a5aff', a: .5, flicker: .25 }); }
  for (let k = 0; k < 10; k++) { const i = 10 + r() * (ART_W - 20), j = lowY + 10 + r() * 16; crystal(B, Math.round(i), Math.round(j), 8 + r() * 8, r() < .5 ? CY : VI, r); }
  // torches on the gallery
  for (const x of [120, 400, 600, 880]) { const i = AX(x), j = AY(48); B.rect(i - 1, j - 8, 2, 8, '#4a3020'); F.rect(i - 2, j - 11, 4, 3, '#2a1a10'); L.push({ x, y: 48 - 16, r: 40, col: '#ff8a2a', a: .7, flicker: .5, torch: 1 }); }
  // moat rim light
  for (let k = 0; k < 24; k++) { const t = k / 24, x = lerp(110, 890, t); L.push({ x, y: 70, r: 18, col: '#2fd8ff', a: .25, flicker: .1 }); L.push({ x, y: 525, r: 18, col: '#2fd8ff', a: .25, flicker: .1 }); }
  // portal ring carved into the back wall
  B.ring(AX(500), AY(-60), 22, 3, '#1a1238', 1, .45); B.ring(AX(500), AY(-60), 22, 1, '#a99bff', .9, .45); B.ell(AX(500), AY(-60), 8, 3.5, '#6f5fc6', .8);
  L.push({ x: 500, y: -60, r: 36, col: '#7a5aff', a: .5, flicker: .3, flat: 1 });
}

/* ===================== 3. CHAMPION HALL ===================== */
function paintHall(B, F, r, L) {
  const n1 = vnoise(201), n2 = vnoise(223), n3 = vnoise(241);
  // walls: navy panelling with gold moulding
  B.rect(0, 0, ART_W, ART_H, '#0e1428');
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { if ((i + j * 3) % 37 === 0) B.set(i, j, '#141c36'); }
  const wallTop = AY(32);
  for (let i = 0; i < ART_W; i += 20) { B.rect(i + 1, 3, 18, wallTop - 6, '#1d2a52'); B.rect(i + 2, 4, 16, 1, '#3a4c86'); B.rect(i + 2, 5, 1, wallTop - 9, '#2c3c6c'); B.rect(i + 17, 5, 1, wallTop - 9, '#121a34'); B.rect(i + 1, wallTop - 4, 18, 1, '#0a0f20'); B.rect(i + 4, 9, 12, wallTop - 17, '#223060'); }
  B.rect(0, wallTop - 2, ART_W, 2, '#c9962a'); B.rect(0, wallTop - 2, ART_W, 1, '#f2d36b');
  // original banners: crimson with a gold diamond-and-wings crest
  for (const x of [220, 330, 670, 780]) { const i = AX(x), top = 2;
    for (let j = 0; j < 30; j++) for (let k = -7; k <= 7; k++) { if (j > 24 && Math.abs(k) < (j - 24) * 1.2) continue; B.set(i + k, top + j, k < -4 ? '#7a1424' : k > 4 ? '#5a0e1a' : '#9a1c2e'); }
    B.rect(i - 8, top, 16, 2, '#c9962a');
    for (let s = 0; s < 4; s++) { B.rect(i - s, top + 10 + s, s * 2 + 1, 1, '#f2d36b'); B.rect(i - s, top + 17 - s, s * 2 + 1, 1, '#d6a33a'); }
    B.line(i - 6, top + 12, i - 3, top + 14, '#f2d36b'); B.line(i + 6, top + 12, i + 3, top + 14, '#f2d36b'); }
  // floor: veined teal marble with gold inlay
  const fx0 = AX(40), fy0 = AY(40), fx1 = AX(960), fy1 = AY(540), cut = 14;
  const inFloor = (i, j) => i >= fx0 && i <= fx1 && j >= fy0 && j <= fy1 && (i - fx0) + (j - fy0) >= cut && (fx1 - i) + (j - fy0) >= cut && (i - fx0) + (fy1 - j) >= cut && (fx1 - i) + (fy1 - j) >= cut;
  const marble = ['#7fb2b1', '#8fc2c0', '#9ccfcd', '#a8d8d5', '#b4e0dd', '#c2e8e5', '#d4f1ee', '#e6f8f6'], T = 14;
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) {
    if (!inFloor(i, j)) continue;
    const ti = Math.floor((i - fx0) / T), tj = Math.floor((j - fy0) / T), lx = (i - fx0) % T, ly = (j - fy0) % T, tv = mulberry(ti * 977 + tj * 131)();
    const vein = Math.abs(n1(i / 9 + tv * 9, j / 9) - .5) < .025 || Math.abs(n2(i / 15, j / 6 + tv * 5) - .5) < .015;
    let t = .45 + tv * .25 + n3(i / 30, j / 30) * .15 + dith(i, j) * .07; if (lx === 1 || ly === 1) t += .2; if (lx === T - 1 || ly === T - 1) t -= .18;
    let col = marble[clamp(Math.floor(t * marble.length), 0, 7)]; if (vein) col = mix(col, '#5a8a8a', .45);
    if (lx === 0 || ly === 0) col = '#6a9c9b';
    if ((ti % 5 === 0 && lx === 0) || (tj % 5 === 0 && ly === 0)) col = ly === 0 ? '#d6a33a' : '#c9962a';
    B.set(i, j, col);
  }
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) if (inFloor(i, j) && (!inFloor(i - 1, j) || !inFloor(i + 1, j) || !inFloor(i, j - 1) || !inFloor(i, j + 1))) { B.set(i, j, '#f2d36b'); B.set(i, j + 1, '#c9962a'); B.set(i + 1, j + 1, '#8a6418'); }
  bakeAO(B, inFloor, 10, .35);
  // carpet up the dais steps to an original throne
  const cl = AX(468), cr = AX(532);
  for (let j = 0; j < fy0 + 3; j++) for (let i = cl; i < cr; i++) { const e = i - cl < 2 || cr - i <= 2; B.set(i, j, e ? '#d6a33a' : ((i + j) % 3 === 0 ? '#8a1424' : '#a01a2c')); }
  for (let s = 0; s < 3; s++) { B.rect(cl - 10 - s * 4, wallTop + 2 + s * 4, (cr - cl) + 20 + s * 8, 1, '#4a5a8a'); B.rect(cl - 10 - s * 4, wallTop + 3 + s * 4, (cr - cl) + 20 + s * 8, 3, '#2a3660'); }
  const tx = AX(500), ty = AY(2);
  B.shadow(tx + 3, ty + 10, 13, 4, .5); B.rect(tx - 10, ty - 14, 20, 24, '#5a0e1a'); B.rect(tx - 12, ty - 18, 24, 4, '#c9962a'); B.rect(tx - 12, ty - 18, 24, 1, '#f2d36b'); B.rect(tx - 8, ty - 12, 16, 16, '#9a1c2e'); B.rect(tx - 7, ty - 11, 1, 14, '#c43a4c');
  B.rect(tx - 13, ty - 4, 3, 14, '#c9962a'); B.rect(tx + 10, ty - 4, 3, 14, '#a07a1c'); B.ell(tx, ty - 20, 3, 3, '#7ff7ff'); L.push({ x: 500, y: 2 - 40, r: 26, col: '#3fd0ff', a: .5, flicker: .2 });
  // centre emblem: engraved gold disc with a glowing gem
  const cx = AX(500), cy = AY(290), GOLD = ['#5a3c0c', '#8a6418', '#b8862a', '#d6a33a', '#f2d36b', '#fff0b0'];
  B.shadow(cx + 3, cy + 4, 28, 26, .55);
  for (let j = cy - 30; j <= cy + 30; j++) for (let i = cx - 30; i <= cx + 30; i++) { const d = Math.hypot(i + .5 - cx, j + .5 - cy); if (d > 25) continue; const lit = clamp(.55 - ((i - cx) + (j - cy)) / 50 + (d < 17 ? .1 : 0) + dith(i, j) * .1, 0, .999); let col = GOLD[Math.floor(lit * 6)];
    if (Math.abs(d - 18) < 1) col = GOLD[0]; else if (Math.abs(d - 19) < .6) col = GOLD[5]; if (Math.abs(d - 24.3) < .7) col = GOLD[1]; if (d > 19 && d < 24 && Math.floor(Math.atan2(j - cy, i - cx) / 6.283 * 36) % 2 === 0) col = mix(col, GOLD[1], .3); B.set(i, j, col); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; for (let q = 27; q < 31; q++) B.set(cx + Math.cos(a) * q, cy + Math.sin(a) * q, k % 3 ? '#d6a33a' : '#fff0b0'); }
  for (let q = -12; q <= 12; q++) { const w = Math.max(0, 3 - Math.abs(q) / 4); for (let s = -w; s <= w; s++) { B.set(cx + q, cy + s, '#eafffd'); B.set(cx + s, cy + q, '#eafffd'); } }
  B.ell(cx, cy, 4, 4, '#2fb0ff'); B.ell(cx - 1, cy - 1, 2, 2, '#bff4ff'); L.push({ x: 500, y: 290, r: 34, col: '#2fd8ff', a: .45, flicker: .2 });
  // fluted pillars with lamps (lamp heads in the foreground layer)
  for (const [x, y] of [[90, 60], [910, 60], [90, 520], [910, 520], [280, 545], [720, 545]]) {
    const i = AX(x), j = AY(y); B.shadow(i + 5, j + 3, 11, 4, .45);
    B.rect(i - 8, j - 3, 16, 6, '#1b2440'); B.rect(i - 8, j - 3, 16, 1, '#d6a33a'); B.rect(i - 8, j + 2, 16, 1, '#8a6418');
    for (let jj = 0; jj < 24; jj++) for (let k = -5; k <= 5; k++) B.set(i + k, j - 4 - jj, k === -5 ? '#9aa8cc' : k % 2 === 0 ? (k < 0 ? '#7f8fb6' : '#4a5880') : (k < 0 ? '#6a7aa2' : '#39466c'));
    F.rect(i - 7, j - 31, 14, 4, '#c9962a'); F.rect(i - 7, j - 31, 14, 1, '#fff0b0'); F.rect(i - 7, j - 28, 14, 1, '#8a6418');
    F.ell(i, j - 34, 3, 3, '#fff6d0'); F.set(i - 1, j - 35, '#ffffff');
    L.push({ x, y: y - 68, r: 46, col: '#ffcf7a', a: .8, flicker: .25, lamp: 1 });
    for (let k = 1; k < 18; k++) { const yy = j + 4 + k * 2; if (inFloor(i, yy)) for (let s = -2; s <= 2; s++) B.add(i + s, yy, 18 - k, 16 - k, 10 - k * .5); }   // lamp reflection on polished floor
  }
  // wall sconces
  for (let i = 20; i < ART_W; i += 80) { B.rect(i - 2, wallTop - 14, 4, 6, '#c9962a'); L.push({ x: fromArtX(i), y: fromArtY(wallTop - 16), r: 26, col: '#ff9a3a', a: .55, flicker: .5, torch: 1 }); }
  // gold door and blue rails at the bottom
  B.rect(AX(475), fy1 + 3, AX(525) - AX(475), ART_H - fy1, '#a07a1c'); B.rect(AX(477), fy1 + 5, AX(523) - AX(477), ART_H - fy1, '#f1cf6a'); B.rect(AX(499), fy1 + 5, 1, ART_H - fy1, '#a07a1c');
  for (const sx of [-1, 1]) { const i0 = AX(500 + sx * 150) - 50; F.rect(i0, fy1 + 6, 100, 3, '#2d5aa8'); F.rect(i0, fy1 + 6, 100, 1, '#7aa4ee'); for (let k = 0; k <= 100; k += 10) F.rect(i0 + k, fy1 + 6, 2, 8, '#1a3a7a'); }
}
