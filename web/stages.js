/* =====================================================================
   Section 7a: stages — six original pixel-art arenas
   Art space: 1 art pixel = 2 world units. The stage canvas covers world
   x −120…1120, y −110…670 so the camera can pan past the arena edges.
   ===================================================================== */
const ART_X0 = -200, ART_Y0 = -150, ART_W = 700, ART_H = 430;
const toArtX = x => (x - ART_X0) / 2, toArtY = y => (y - ART_Y0) / 2;
const fromArtX = i => i * 2 + ART_X0, fromArtY = j => j * 2 + ART_Y0;
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/* ---------- pixel buffer with drawing helpers ---------- */
function PixBuf(w, h) {
  const d = new Uint8ClampedArray(w * h * 4), cache = {};
  const rgb = hex => cache[hex] || (cache[hex] = hexToRgb(hex));
  const B = {
    w, h, d,
    set(i, j, hex, a = 1) {
      i |= 0; j |= 0; if (i < 0 || j < 0 || i >= w || j >= h) return; const o = (j * w + i) * 4, c = rgb(hex);
      if (a >= 1) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
      else { d[o] = d[o] + (c[0] - d[o]) * a; d[o + 1] = d[o + 1] + (c[1] - d[o + 1]) * a; d[o + 2] = d[o + 2] + (c[2] - d[o + 2]) * a; d[o + 3] = 255; }
    },
    rect(x, y, rw, rh, hex, a) { for (let j = Math.round(y); j < Math.round(y + rh); j++) for (let i = Math.round(x); i < Math.round(x + rw); i++) B.set(i, j, hex, a); },
    ell(cx, cy, rx, ry, hex, a) { for (let j = Math.floor(cy - ry); j <= cy + ry; j++) for (let i = Math.floor(cx - rx); i <= cx + rx; i++) { const u = (i + .5 - cx) / rx, v = (j + .5 - cy) / ry; if (u * u + v * v <= 1) B.set(i, j, hex, a); } },
    ring(cx, cy, r, th, hex, a, sq = 1) { for (let j = Math.floor(cy - r * sq - th); j <= cy + r * sq + th; j++) for (let i = Math.floor(cx - r - th); i <= cx + r + th; i++) { const dd = Math.hypot(i + .5 - cx, (j + .5 - cy) / sq); if (Math.abs(dd - r) <= th / 2) B.set(i, j, hex, a); } },
    line(x0, y0, x1, y1, hex, a) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; for (let k = 0; k <= n; k++) B.set(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), hex, a); },
    // fill a region with dithered noise mapped onto a colour ramp
    noise(x0, y0, x1, y1, ramp, fn, inside) {
      for (let j = Math.max(0, y0); j < Math.min(h, y1); j++) for (let i = Math.max(0, x0); i < Math.min(w, x1); i++) {
        if (inside && !inside(i, j)) continue;
        const v = clamp(fn(i, j), 0, .999) * ramp.length + (BAYER4[(j & 3) * 4 + (i & 3)] / 16 - .5) * .85;
        B.set(i, j, ramp[clamp(Math.floor(v), 0, ramp.length - 1)]);
      }
    },
    toCanvas() { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const img = x.createImageData(w, h); img.data.set(d); x.putImageData(img, 0, 0); return c; }
  };
  return B;
}
function worley(seed, cell) {      // distance to nearest jittered point → cobble / rock cells
  const r = (x, y) => { let n = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ seed; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  return (x, y) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); let d1 = 9, d2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const px = (gx + i + r(gx + i, gy + j)) * cell, py = (gy + j + r(gy + j, gx + i + 7)) * cell, d = Math.hypot(x - px, y - py) / cell; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    return [d1, d2]; };
}
// crystals: faceted shard clusters with a lit face and a shadow face
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
function drawSpectator(c, ax, ay, pal, facing = 1) {   // c = 2D context in art pixels, (ax, ay) feet
  const px = (x, y, col, w = 1, hh = 1) => { c.fillStyle = col; c.fillRect(Math.round(ax + x), Math.round(ay + y), w, hh); };
  px(-4, 0, '#0004', 8, 1);
  px(-3, -4, '#20222c', 2, 4); px(1, -4, '#20222c', 2, 4);
  px(-4, -10, pal.coat, 8, 6); px(-4, -10, mix(pal.coat, '#ffffff', .2), 1, 6); px(3, -10, mix(pal.coat, '#000000', .3), 1, 6);
  px(-1, -10, pal.trim, 2, 6);
  px(-3, -15, pal.skin, 6, 5); px(-3, -16, pal.hat, 6, 2); px(-4, -15, pal.hat, 1, 2); px(3, -15, pal.hat, 1, 2);
  px(facing > 0 ? 0 : -2, -13, '#1a1a22', 1, 1); px(facing > 0 ? 2 : -1, -13, '#1a1a22', 1, 1);
}

/* ---------- stage definitions ---------- */
const STAGES = {
  summit: { name: 'Storm Summit', ambient: 'snow', walk: [[90, 70, 910, 520]], trainers: { A: { x: 46, y: 300 }, B: { x: 954, y: 280 } }, entry: { A: { x: 190, y: 300 }, B: { x: 810, y: 260 } }, crowd: [] },
  cavern: { name: 'Crystal Cavern', ambient: 'motes', walk: [[110, 90, 890, 505]], trainers: { A: { x: 120, y: 300 }, B: { x: 880, y: 290 } }, entry: { A: { x: 230, y: 300 }, B: { x: 770, y: 280 } },
    crowd: [[200, 30], [330, 22], [520, 26], [690, 24], [820, 32], [180, 600], [420, 606], [640, 602], [860, 598]] },
  hall: { name: 'Champion Hall', ambient: 'glint', walk: [[80, 80, 920, 500]], trainers: { A: { x: 70, y: 290 }, B: { x: 930, y: 290 } }, entry: { A: { x: 200, y: 290 }, B: { x: 800, y: 290 } },
    crowd: [[300, 8], [380, 4], [620, 4], [700, 8]] },
  castle: { name: 'Sky Castle', ambient: 'dust', walk: [[70, 215, 930, 385], [390, 50, 610, 520], [150, 150, 300, 450], [700, 150, 850, 450]],
    trainers: { A: { x: 60, y: 300 }, B: { x: 950, y: 300 } }, entry: { A: { x: 220, y: 300 }, B: { x: 780, y: 300 } }, crowd: [] },
  grand: { name: 'Grand Hall', ambient: 'notes', walk: [[90, 60, 900, 520]], trainers: { A: { x: 80, y: 300 }, B: { x: 920, y: 300 } }, entry: { A: { x: 220, y: 300 }, B: { x: 780, y: 300 } },
    crowd: [[960, 120], [985, 420]] },
  meteor: { name: 'Meteor Cave', ambient: 'sparkle', walk: [[90, 70, 905, 520]], trainers: { A: { x: 60, y: 300 }, B: { x: 940, y: 290 } }, entry: { A: { x: 200, y: 300 }, B: { x: 800, y: 280 } }, crowd: [] }
};
const STAGE_ORDER = ['summit', 'cavern', 'hall', 'castle', 'grand', 'meteor'];
let STAGE = STAGES.summit, stageCanvas = null, STAGE_ID = 'summit';
const BOUND = { x0: 90, x1: 910, y0: 70, y1: 520 };
const ENTRY = { A: { x: 190, y: 300 }, B: { x: 810, y: 260 } };
const TRAINER_POS = { A: { x: 46, y: 300 }, B: { x: 954, y: 280 } };
function setStage(id) {
  STAGE_ID = STAGES[id] ? id : 'summit'; STAGE = STAGES[STAGE_ID];
  const w = STAGE.walk; BOUND.x0 = Math.min(...w.map(r => r[0])); BOUND.y0 = Math.min(...w.map(r => r[1])); BOUND.x1 = Math.max(...w.map(r => r[2])); BOUND.y1 = Math.max(...w.map(r => r[3]));
  Object.assign(ENTRY.A, STAGE.entry.A); Object.assign(ENTRY.B, STAGE.entry.B); Object.assign(TRAINER_POS.A, STAGE.trainers.A); Object.assign(TRAINER_POS.B, STAGE.trainers.B);
  stageCanvas = buildStage(STAGE_ID);
}
function inWalk(x, y) { return STAGE.walk.some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]); }
function clampWalk(x, y) {
  if (inWalk(x, y)) return [x, y];
  let best = null, bd = Infinity;
  for (const r of STAGE.walk) { const cx = clamp(x, r[0], r[2]), cy = clamp(y, r[1], r[3]), d = (cx - x) ** 2 + (cy - y) ** 2; if (d < bd) { bd = d; best = [cx, cy]; } }
  return best;
}
const STAGE_CACHE = {};
function buildStage(id) {
  if (STAGE_CACHE[id]) return STAGE_CACHE[id];
  const B = PixBuf(ART_W, ART_H), r = mulberry(hashStr(id) + 5);
  ({ summit: drawSummit, cavern: drawCavern, hall: drawHall, castle: drawCastle, grand: drawGrand, meteor: drawMeteor })[id](B, r);
  const c = B.toCanvas(); STAGE_CACHE[id] = c; return c;
}
const AX = x => Math.round(toArtX(x)), AY = y => Math.round(toArtY(y));

/* ---------- 1. Storm Summit ---------- */
function drawSummit(B, r) {
  const n1 = vnoise(11), n2 = vnoise(23), n3 = vnoise(37), n4 = vnoise(51);
  const tones = ['#6f7b89', '#808c99', '#919daa', '#a2adb9', '#b2bdc7', '#c1cad3', '#cfd7de', '#dce3e9', '#e8eef2'];
  B.noise(0, 0, ART_W, ART_H, tones, (i, j) => {
    const x = fromArtX(i), y = fromArtY(j);
    let v = n1(x / 130, y / 130) * .55 + n2(x / 48, y / 48) * .3 + n3(x / 16, y / 16) * .15;
    const blot = n4(x / 60 + 7, y / 60 + 3); if (blot > .64) v -= (blot - .64) * 1.5;
    v -= Math.min(.5, (Math.max(0, 60 - x, x - 940) / 60 + Math.max(0, 40 - y, y - 550) / 50) * .35);
    return v * 1.25 + .05;
  });
  for (let k = 0; k < 420; k++) { const i = Math.floor(r() * ART_W), j = Math.floor(r() * ART_H), col = r() < .5 ? '#5d6875' : '#6f7b88'; for (let q = 0; q < 3; q++) if (r() < .8) B.rect(i + q * 2, j + (r() < .5 ? 0 : 1), 1, 2, col); }
  const box = (x0, y0, x1, y1, col, a) => { B.rect(AX(x0), AY(y0), AX(x1) - AX(x0), 1, col, a); B.rect(AX(x0), AY(y1), AX(x1) - AX(x0) + 1, 1, col, a); B.rect(AX(x0), AY(y0), 1, AY(y1) - AY(y0), col, a); B.rect(AX(x1), AY(y0), 1, AY(y1) - AY(y0), col, a); };
  box(50, 40, 950, 550, '#3c4452'); box(53, 43, 947, 547, '#c5ced6');
  box(120, 170, 290, 410, '#eef3f6', .55); box(710, 170, 880, 410, '#eef3f6', .55);
  B.ring(AX(500), AY(280), 60, 1, '#eef3f6', .7, .92);
  for (let j = AY(43); j < AY(547); j += 2) B.set(AX(500), j, '#eef3f6', .35);
  for (let k = 0; k < 18; k++) { const edge = k % 4, x = edge === 0 ? -180 + r() * 220 : edge === 1 ? 980 + r() * 200 : r() * 1000, y = edge === 2 ? -140 + r() * 160 : edge === 3 ? 570 + r() * 120 : r() * 560; boulder(B, AX(x), AY(y), 5 + Math.floor(r() * 8), 3 + Math.floor(r() * 4)); }
}
function boulder(B, gx, gy, sw, sh) {
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const e = ((x - sw / 2) / (sw / 2)) ** 2 + ((y - sh / 2) / (sh / 2)) ** 2; if (e > 1.05) continue; B.set(gx + x, gy + y, y === 0 ? '#eef3f6' : y === 1 ? '#c9d2da' : x < sw / 2 ? '#7a8592' : '#5c6673'); }
  B.rect(gx, gy + sh, sw, 1, '#2e3540');
}

/* ---------- 2. Crystal Cavern ---------- */
function drawCavern(B, r) {
  const n1 = vnoise(101), n2 = vnoise(131), W1 = worley(77, 14), W2 = worley(91, 7);
  // cave rock everywhere
  B.noise(0, 0, ART_W, ART_H, ['#17122a', '#1e1834', '#261f42', '#2f2750', '#3a315f'], (i, j) => { const [a, b] = W1(i, j); return .25 + n1(i / 30, j / 30) * .5 + (b - a) * .6; });
  // upper ledge (spectator gallery) with lighter violet stone
  const ledgeY = AY(60);
  B.noise(0, 0, ART_W, ledgeY, ['#3d3368', '#4a3f7c', '#584b90', '#6858a6', '#7a69bb'], (i, j) => { const [a, b] = W2(i, j); return .3 + n2(i / 20, j / 20) * .4 + (b - a) * .8 - (ledgeY - j) / ledgeY * .25; });
  for (let i = 0; i < ART_W; i++) { const jag = Math.round(Math.sin(i * .37) * 1.5 + n2(i / 6, 3) * 3); B.set(i, ledgeY + jag, '#a495e0'); B.set(i, ledgeY + jag + 1, '#2a2148'); B.set(i, ledgeY + jag + 2, '#1a1430'); }
  // lower ledge
  const lowY = AY(560);
  B.noise(0, lowY, ART_W, ART_H, ['#2d2552', '#382f63', '#433975', '#504486'], (i, j) => { const [a, b] = W2(i + 40, j); return .3 + (b - a) * .9; });
  for (let i = 0; i < ART_W; i++) B.set(i, lowY, '#7b6cc0');
  // arena slab: cracked slate with rounded corners
  const x0 = AX(95), y0 = AY(75), x1 = AX(905), y1 = AY(520), rad = 14;
  const insideSlab = (i, j) => { const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad); return Math.hypot(i - cx, j - cy) <= rad; };
  // glowing water moat around the slab
  const moat = (i, j) => { const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad), d = Math.hypot(i - cx, j - cy) - rad; return d > 0 && d <= 9; };
  B.noise(x0 - 12, y0 - 12, x1 + 12, y1 + 12, ['#0b2e4a', '#0f4466', '#145d88', '#1e7bb0', '#3aa6d8', '#7fdcf6'], (i, j) => { const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad), d = Math.hypot(i - cx, j - cy) - rad; return 1 - d / 10 + n1(i / 5, j / 5) * .25 - .1; }, moat);
  B.noise(x0, y0, x1 + 1, y1 + 1, ['#34324a', '#3c3a54', '#44425e', '#4d4b68', '#575573', '#62607e'], (i, j) => .35 + n1(i / 40, j / 40) * .35 + n2(i / 9, j / 9) * .2 + W1(i * 1.3, j * 1.3)[0] * .1, insideSlab);
  // slab rim highlight + glow line where stone meets water
  for (let j = y0 - 1; j <= y1 + 1; j++) for (let i = x0 - 1; i <= x1 + 1; i++) { if (insideSlab(i, j) && !(insideSlab(i - 1, j) && insideSlab(i + 1, j) && insideSlab(i, j - 1) && insideSlab(i, j + 1))) B.set(i, j, '#9ff1ff'); }
  // cracks
  for (let k = 0; k < 46; k++) { let i = x0 + 6 + r() * (x1 - x0 - 12), j = y0 + 6 + r() * (y1 - y0 - 12), a = r() * 6.28; const len = 8 + r() * 26; for (let q = 0; q < len; q++) { i += Math.cos(a); j += Math.sin(a) * .8; a += (r() - .5) * .7; if (!insideSlab(i | 0, j | 0)) break; B.set(i, j, '#22202f'); B.set(i, j + 1, '#6c6a88', .6); if (r() < .06) a += (r() < .5 ? 1 : -1) * 1.2; } }
  // crystal clusters on ledges and corners
  const CY = ['#1d5f8a', '#4fc6f0', '#9eeaff', '#ffffff'], VI = ['#4a2c86', '#9a6ae0', '#d3b6ff', '#ffffff'];
  for (let k = 0; k < 26; k++) { const top = k < 16, i = top ? 10 + r() * (ART_W - 20) : r() < .5 ? r() * (x0 - 14) : x1 + 14 + r() * (ART_W - x1 - 16), j = top ? ledgeY - 4 - r() * 18 : y0 + r() * (y1 - y0); crystal(B, Math.round(i), Math.round(j), 8 + r() * 12, r() < .5 ? CY : VI, r); }
  for (let k = 0; k < 10; k++) crystal(B, Math.round(10 + r() * (ART_W - 20)), lowY + 8 + Math.round(r() * 14), 6 + r() * 8, r() < .5 ? CY : VI, r);
  // portal ring carved into the back wall
  B.ring(AX(500), AY(-50), 20, 3, '#2b2150', 1, .45); B.ring(AX(500), AY(-50), 20, 1, '#8f7be0', .8, .45); B.ell(AX(500), AY(-50), 6, 3, '#6f5fc6', .7);
}

/* ---------- 3. Champion Hall ---------- */
function drawHall(B, r) {
  const n1 = vnoise(201);
  B.noise(0, 0, ART_W, ART_H, ['#121a32', '#172140', '#1c284c'], (i, j) => .3 + n1(i / 20, j / 20) * .5);
  // back wall panels
  for (let i = 0; i < ART_W; i += 18) { B.rect(i + 1, 4, 16, AY(30) - 6, '#25325a'); B.rect(i + 2, 5, 14, 1, '#3a4a7c'); B.rect(i + 1, AY(30) - 3, 16, 1, '#0d1326'); }
  const fx0 = AX(40), fy0 = AY(40), fx1 = AX(960), fy1 = AY(540), cut = 14;
  const inFloor = (i, j) => i >= fx0 && i <= fx1 && j >= fy0 && j <= fy1 && (i - fx0) + (j - fy0) >= cut && (fx1 - i) + (j - fy0) >= cut && (i - fx0) + (fy1 - j) >= cut && (fx1 - i) + (fy1 - j) >= cut;
  // glossy teal tiles
  const T = 12;
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) {
    if (!inFloor(i, j)) continue;
    const ti = Math.floor((i - fx0) / T), tj = Math.floor((j - fy0) / T), lx = (i - fx0) % T, ly = (j - fy0) % T, hv = mulberry(ti * 977 + tj * 131)();
    let col = ['#9ccfcd', '#a6d6d3', '#afdcd9', '#b8e1de'][Math.floor(hv * 4)];
    if (lx === 0 || ly === 0) col = '#7fb2b1'; else if (lx === 1 || ly === 1) col = '#d6f1ee'; else if (lx === T - 1 || ly === T - 1) col = '#8fc2c0';
    const refl = (i - j * .6) % 46; if (refl > 0 && refl < 3 && lx > 1 && ly > 1) col = mix(col, '#ffffff', .25);
    B.set(i, j, col);
  }
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) if (inFloor(i, j) && (!inFloor(i - 1, j) || !inFloor(i + 1, j) || !inFloor(i, j - 1) || !inFloor(i, j + 1))) { B.set(i, j, '#eef6f8'); B.set(i, j + 1, '#c9dde0'); }
  // red carpet into the top of the hall and a gold door at the bottom
  B.rect(AX(470), 0, AX(530) - AX(470), fy0 + 2, '#9a1c2a'); B.rect(AX(470), 0, 1, fy0 + 2, '#d8a33a'); B.rect(AX(530) - 1, 0, 1, fy0 + 2, '#d8a33a');
  for (let j = 0; j < fy0; j += 3) B.rect(AX(472), j, AX(528) - AX(472), 1, '#b3263a');
  B.rect(AX(475), fy1 + 3, AX(525) - AX(475), ART_H - fy1, '#c99a2a'); B.rect(AX(477), fy1 + 5, AX(523) - AX(477), ART_H - fy1, '#f1cf6a');
  for (const sx of [-1, 1]) { B.rect(AX(500 + sx * 150) - 50, fy1 + 6, 100, 4, '#2d5aa8'); B.rect(AX(500 + sx * 150) - 50, fy1 + 6, 100, 1, '#6c9ae6'); }
  // centre emblem: gold ring with tick marks and an original four-point star
  const cx = AX(500), cy = AY(290), GOLD = ['#6a4710', '#9a6c1c', '#c8962e', '#e8c45a', '#fff0b0'];
  for (let j = cy - 30; j <= cy + 30; j++) for (let i = cx - 30; i <= cx + 30; i++) { const d = Math.hypot(i + .5 - cx, j + .5 - cy); if (d > 24) continue; const lit = clamp(.55 - ((i - cx) + (j - cy)) / 50 + (d < 17 ? .1 : 0), 0, .999); let col = GOLD[Math.floor(lit * 5)]; if (Math.abs(d - 17.5) < 1) col = GOLD[0]; if (Math.abs(d - 23.5) < .7) col = GOLD[1]; B.set(i, j, col); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; for (let q = 27; q < 31; q++) B.set(cx + Math.cos(a) * q, cy + Math.sin(a) * q, k % 3 ? '#d6a33a' : '#fff0b0'); }
  for (let q = -11; q <= 11; q++) { const w = Math.max(0, 3 - Math.abs(q) / 4); for (let s = -w; s <= w; s++) { B.set(cx + q, cy + s, '#eafffd'); B.set(cx + s, cy + q, '#eafffd'); } }
  B.ell(cx, cy, 3, 3, '#5fe0ff');
  // pillars with lamps
  for (const [x, y] of [[90, 60], [910, 60], [90, 520], [910, 520], [280, 545], [720, 545]]) pillar(B, AX(x), AY(y));
}
function pillar(B, x, y) {
  B.ell(x, y + 3, 9, 3, '#0a1020', .5);
  B.rect(x - 7, y - 2, 14, 5, '#1b2440'); B.rect(x - 7, y - 2, 14, 1, '#d6a33a');
  for (let j = 0; j < 22; j++) for (let i = -5; i <= 5; i++) B.set(x + i, y - 3 - j, i < -2 ? '#7f8fb6' : i < 2 ? '#56648c' : '#39466c');
  B.rect(x - 6, y - 26, 12, 3, '#d6a33a'); B.rect(x - 6, y - 26, 12, 1, '#fff0b0');
  B.ell(x, y - 29, 3, 3, '#fff6d0');
}

/* ---------- 4. Sky Castle (cross-shaped floor) ---------- */
function drawCastle(B, r) {
  // dark teal brickwork
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const row = Math.floor(j / 5), off = row % 2 ? 4 : 0, bx = Math.floor((i + off) / 9), lx = (i + off) % 9, ly = j % 5, hv = mulberry(bx * 31 + row * 977)();
    let col = ['#103a3d', '#134446', '#174c4e', '#1b5557'][Math.floor(hv * 4)];
    if (lx === 0 || ly === 0) col = '#08201f'; else if (ly === 1) col = mix(col, '#3a7a76', .35);
    B.set(i, j, col);
  }
  // portholes on the walls
  for (let k = 0; k < 7; k++) for (const yy of [AY(-40), AY(610)]) { const x = AX(40 + k * 150); B.ell(x, yy, 7, 6, '#0a1c1c'); B.ring(x, yy, 6, 2, '#c9d2d2', 1, .85); B.ring(x, yy, 6, .8, '#ffffff', .8, .85); B.ell(x, yy, 3, 2.5, '#1a2a2a'); }
  const fl = STAGES.castle.walk.map(([a, b, c, d]) => [AX(a) - 4, AY(b) - 4, AX(c) + 4, AY(d) + 4]);
  const inF = (i, j) => fl.some(q => i >= q[0] && i <= q[2] && j >= q[1] && j <= q[3]);
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    if (!inF(i, j)) continue;
    const T = 10, lx = i % T, ly = j % T, hv = mulberry(Math.floor(i / T) * 131 + Math.floor(j / T) * 71)();
    let col = ['#d6cdbc', '#ddd5c5', '#e3dccd', '#e9e3d6'][Math.floor(hv * 4)];
    if (lx === 0 || ly === 0) col = '#bdb29e'; else if (lx === 1 || ly === 1) col = mix(col, '#ffffff', .3);
    B.set(i, j, col);
  }
  // gold trim with dark outer edge
  for (let j = 1; j < ART_H - 1; j++) for (let i = 1; i < ART_W - 1; i++) {
    if (!inF(i, j)) { if (inF(i - 1, j) || inF(i + 1, j) || inF(i, j - 1) || inF(i, j + 1)) B.set(i, j, '#120d04'); continue; }
    if (!inF(i - 1, j) || !inF(i + 1, j) || !inF(i, j - 1) || !inF(i, j + 1)) B.set(i, j, '#d9ab34');
    else if (!inF(i - 2, j) || !inF(i + 2, j) || !inF(i, j - 2) || !inF(i, j + 2)) B.set(i, j, '#9a7418');
  }
  for (const q of fl) for (const [i, j] of [[q[0], q[1]], [q[2], q[1]], [q[0], q[3]], [q[2], q[3]]]) { B.rect(i - 2, j - 2, 5, 5, '#f2d36b'); B.rect(i - 1, j - 1, 3, 3, '#b8901f'); }
  // bridges where the trainers stand
  for (const [x0, x1] of [[-200, 70], [930, 1200]]) { B.rect(AX(x0), AY(258), AX(x1) - AX(x0), AY(342) - AY(258), '#2a4f9e'); for (let i = AX(x0); i < AX(x1); i += 6) B.rect(i, AY(298), 3, 2, '#f2d36b'); B.rect(AX(x0), AY(258), AX(x1) - AX(x0), 1, '#7aa4ee'); B.rect(AX(x0), AY(342), AX(x1) - AX(x0), 1, '#0f2350'); }
  // scuffs
  for (let k = 0; k < 140; k++) { const i = r() * ART_W, j = r() * ART_H; if (inF(i | 0, j | 0)) B.set(i, j, '#a89c86', .5); }
}

/* ---------- 5. Grand Hall ---------- */
function drawGrand(B, r) {
  const T = 14;
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const lx = i % T, ly = j % T, hv = mulberry(Math.floor(i / T) * 53 + Math.floor(j / T) * 991)();
    let col = ['#5a5d66', '#61646d', '#686b74', '#6f727b'][Math.floor(hv * 4)];
    if (lx === 0 || ly === 0) col = '#45474e'; else if (lx === 1 || ly === 1) col = '#7d808a'; else if (lx === T - 1 || ly === T - 1) col = '#53565e';
    B.set(i, j, col);
  }
  // walls: top panel row, side walls with doors
  const top = AY(25);
  B.rect(0, 0, ART_W, top, '#3a3d46');
  for (let i = 4; i < ART_W; i += 22) { B.rect(i, 6, 16, top - 12, '#aab0ba'); B.rect(i, 6, 16, 1, '#dfe3ea'); B.rect(i, top - 7, 16, 1, '#6a6f78'); }
  B.rect(0, top, ART_W, 2, '#1d1f25');
  for (const x of [AX(-60), AX(1060)]) { B.rect(x - 10, 0, 20, ART_H, '#34363e'); B.rect(x - 10, 0, 1, ART_H, '#565964'); }
  B.rect(AX(1030), AY(220), 8, 26, '#2d5aa8'); B.rect(AX(1030), AY(220), 8, 1, '#7aa4ee'); B.rect(AX(-38), AY(240), 3, 30, '#1fb8b0');
  // giant teal ring and crossing line
  const cx = AX(500), cy = AY(290), R = 112;
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const d = Math.hypot(i + .5 - cx, j + .5 - cy), e = Math.abs(d - R), v = Math.abs(i + .5 - cx);
    if (e < 4) B.set(i, j, e < 1.2 ? '#9ffff6' : e < 2.6 ? '#25d6ca' : '#0e7d77');
    else if (v < 3 && j > top + 2) B.set(i, j, v < 1 ? '#7ff7ef' : '#16a39b');
    else if (e < 8) B.set(i, j, '#25d6ca', .12);
  }
  // golden orb
  const OR = 25, Y = ['#6a4c0c', '#a07a1c', '#cfa632', '#f0d35a', '#fff09a', '#fffbe6'];
  B.ring(cx, cy, OR + 4, 3, '#0e7d77', 1); B.ring(cx, cy, OR + 4, 1, '#7ff7ef', 1);
  for (let j = cy - OR; j <= cy + OR; j++) for (let i = cx - OR; i <= cx + OR; i++) {
    const dx = (i + .5 - cx) / OR, dy = (j + .5 - cy) / OR, rr = dx * dx + dy * dy; if (rr > 1) continue;
    const nz = Math.sqrt(1 - rr), lit = clamp(-dx * .45 - dy * .6 + nz * .6, 0, 1) + (BAYER4[(j & 3) * 4 + (i & 3)] / 16 - .5) * .12;
    B.set(i, j, Y[clamp(Math.floor(lit * 6), 0, 5)]);
  }
  B.ring(cx, cy, OR, 1, '#3a2a06');
  // piano on the right (original pixel prop)
  const px = AX(965), py = AY(110);
  B.rect(px - 18, py - 6, 30, 22, '#121218'); B.rect(px - 18, py - 6, 30, 1, '#3a3a48'); B.rect(px - 16, py - 4, 4, 18, '#2a2a34');
  for (let k = 0; k < 9; k++) { B.rect(px - 11 + k * 2, py + 12, 1, 6, '#f2f2f2'); if (k % 3 !== 2) B.rect(px - 10 + k * 2, py + 12, 1, 3, '#111'); }
  B.rect(px - 12, py - 3, 18, 2, '#7a6a3a');
}

/* ---------- 6. Meteor Cave ---------- */
function drawMeteor(B, r) {
  const n1 = vnoise(401), n2 = vnoise(419);
  // fish-scale cobbles: each scale has a lit upper lip, a soft body and a dark seam
  const S = 10;
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const row = Math.floor(j / (S / 2)), off = row % 2 ? S / 2 : 0, cx = Math.floor((i + off) / S) * S - off + S / 2, cyy = row * (S / 2) + S * .55;
    const dx = i + .5 - cx, dy = j + .5 - cyy, d = Math.hypot(dx, dy * 1.15) / (S * .62);
    const big = n1(i / 60, j / 60) * .08;
    let col;
    if (d > .86 && d < 1.02 && dy < S * .2) col = '#a497b0';
    else if (d > .7 && d <= .86 && dy < 0) col = '#ddd5e4';
    else col = ['#c3b9cc', '#c9c0d2', '#cfc6d7'][clamp(Math.floor((.5 - dy / S * .6 + big) * 3), 0, 2)];
    B.set(i, j, col);
  }
  // shadowed rock rim and dark pillars
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const x = fromArtX(i), y = fromArtY(j), e = Math.max(70 - x, x - 930, 55 - y, y - 540) + (n2(i / 7, j / 7) - .5) * 26;
    if (e > 0) { const v = n1(i / 6, j / 6); B.set(i, j, e > 60 ? (v > .55 ? '#3a3248' : '#2e283a') : e > 20 ? (v > .5 ? '#5a4f6a' : '#4b425a') : '#8a7f99', e > 60 ? 1 : .9); }
  }
  for (const x of [AX(30), AX(970)]) for (let k = 0; k < 4; k++) { const y = AY(90 + k * 130); B.rect(x - 5, y, 10, 36, '#3a3448'); B.rect(x - 5, y, 2, 36, '#5c5470'); B.rect(x - 5, y + 36, 10, 2, '#1d1926'); }
  // puddles
  for (let k = 0; k < 9; k++) { const x = AX(140 + r() * 720), y = AY(110 + r() * 380), w = 8 + r() * 8, h = 3 + r() * 2; B.ell(x, y, w + 1, h + 1, '#8b80a0'); B.ell(x, y, w, h, '#6e6aa4'); B.ell(x - 2, y - 1, w * .6, h * .5, '#8d8ac4'); B.set(x - w * .3, y - h * .4, '#e8e6ff'); }
  // crystals along the rim
  const P1 = ['#3b2f66', '#7b68c8', '#c4b5ff', '#ffffff'];
  for (let k = 0; k < 16; k++) { const top = k % 2, i = 10 + r() * (ART_W - 20), j = top ? AY(30 + r() * 20) : AY(560 + r() * 30); crystal(B, Math.round(i), Math.round(j), 5 + r() * 8, P1, r); }
}
function vnoise(seed) {
  const h = (x, y) => { let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi); return lerp(lerp(h(xi, yi), h(xi + 1, yi), xf), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf); };
}

/* ---------- per-frame stage animation (drawn into the art buffer) ---------- */
function animateStage(c, ox, oy, t) {
  const id = STAGE_ID;
  if (id === 'cavern') {      // shimmering moat
    const x0 = AX(95), y0 = AY(75), x1 = AX(905), y1 = AY(520);
    c.fillStyle = '#bff6ff';
    for (let k = 0; k < 70; k++) { const q = (k * 97.13 + t / 900) % 1, side = k % 4, d = 3 + (k * 7) % 6; let i, j; if (side === 0) { i = x0 + q * (x1 - x0); j = y0 - d; } else if (side === 1) { i = x0 + q * (x1 - x0); j = y1 + d; } else if (side === 2) { i = x0 - d; j = y0 + q * (y1 - y0); } else { i = x1 + d; j = y0 + q * (y1 - y0); } if ((Math.floor(t / 140) + k) % 3) c.fillRect(Math.round(i - ox), Math.round(j - oy), 2, 1); }
  } else if (id === 'hall') {  // lamp flicker
    c.fillStyle = '#fff6d0';
    for (const [x, y] of [[90, 60], [910, 60], [90, 520], [910, 520], [280, 545], [720, 545]]) { const a = .25 + .15 * Math.sin(t / 300 + x); c.globalAlpha = a; c.beginPath(); c.arc(AX(x) - ox, AY(y) - 29 - oy, 7, 0, 7); c.fill(); }
    c.globalAlpha = 1;
  } else if (id === 'grand') { // orb + ring pulse
    const a = .1 + .08 * Math.sin(t / 500); c.globalAlpha = a; c.fillStyle = '#fff3a0'; c.beginPath(); c.arc(AX(500) - ox, AY(290) - oy, 34, 0, 7); c.fill(); c.globalAlpha = 1;
  }
}
