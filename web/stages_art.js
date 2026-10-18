/* =====================================================================
   Section 7c: the six arenas, redrawn
   ===================================================================== */
const PROPS = {
  summit: { braziers: [[80, 60], [920, 60], [80, 545], [920, 545]] },
  hall: { lamps: [[90, 60], [910, 60], [90, 520], [910, 520], [280, 545], [720, 545]], windows: [150, 330, 670, 850] },
  grand: { chand: [[300, 170], [700, 170], [300, 420], [700, 420]], windows: [80, 260, 740, 920] },
  meteor: { puddles: [], crater: [500, 290], drips: [] },
  cavern: { crystals: [] },
  castle: { turrets: [[-90, 40], [1090, 40], [-90, 560], [1090, 560]] }
};
const roundIn = (x0, y0, x1, y1, rad) => (i, j) => { if (i < x0 || i > x1 || j < y0 || j > y1) return false; const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad); return Math.hypot(i - cx, j - cy) <= rad; };

/* =========================== 1. STORM SUMMIT =========================== */
function drawSummit(B, r, F) {
  const n1 = vnoise(11), n2 = vnoise(23), n3 = vnoise(37), n4 = vnoise(41);
  const rock = ['#121722', '#181e2c', '#202838', '#2a3446', '#344056', '#404e66'];
  B.noise(0, 0, ART_W, ART_H, rock, (i, j) => .25 + n1(i / 26, j / 26) * .45 + n2(i / 7, j / 7) * .25 + (1 - j / ART_H) * .1);
  // snow on the surrounding mountainside, lit from the top-left
  for (let j = 1; j < ART_H - 1; j++) for (let i = 1; i < ART_W - 1; i++) { const s = n3(i / 13, j / 10) * .7 + n4(i / 4, j / 4) * .3; if (s > .7) B.set(i, j, s > .78 ? '#e9f0f6' : s > .74 ? '#cfdbe6' : '#9fb0c4'); else if (n3(i / 13, (j - 2) / 10) * .7 + n4(i / 4, (j - 2) / 4) * .3 > .7) B.set(i, j, '#0e121c'); }
  const px0 = AX(40), py0 = AY(30), px1 = AX(960), py1 = AY(555), inPlat = roundIn(px0, py0, px1, py1, 12), inInner = roundIn(px0 + 5, py0 + 5, px1 - 5, py1 - 5, 8);
  // cliff face under the platform (it stands on the summit)
  for (let i = px0; i <= px1; i++) { let top = -1; for (let j = py1; j > py1 - 20; j--) if (inPlat(i, j)) { top = j; break; } if (top < 0) continue; for (let k = 1; k < 9; k++) B.set(i, top + k, k < 3 ? '#2a303c' : (i + k) % 5 ? '#1c212b' : '#252b37'); }
  slabs(B, px0 + 5, py0 + 5, px1 - 4, py1 - 4, inInner, { pal: ['#2c323e', '#4c5664', '#56606e', '#606b79', '#6b7684', '#76818f'], hi: '#98a3b0', cell: 13, seed: 5, cracks: 40, sy: 1.25 });
  rimBlocks(B, (i, j) => inPlat(i, j) && !inInner(i, j), ['#232833', '#454e5c', '#5a6474', '#8a96a6'], 9);
  // drifts of snow on the stones, with blue shadows on their lower edges
  const isSnow = (i, j) => inInner(i, j) && (n2(i / 20, j / 14) * .45 + n3(i / 7, j / 7) * .25 + (1 - Math.min(1, Math.min(i - px0, px1 - i, j - py0, py1 - j) / 40)) * .45) > .7;
  for (let j = py0; j < py1; j++) for (let i = px0; i < px1; i++) { if (!isSnow(i, j)) continue; B.set(i, j, !isSnow(i, j - 1) ? '#ffffff' : !isSnow(i - 1, j) ? '#f2f6fa' : (i * 3 + j) % 11 === 0 ? '#d8e2ec' : '#e6edf3'); if (!isSnow(i, j + 1)) { B.set(i, j + 1, '#8fa2b8'); B.set(i, j + 2, '#a8b8ca'); } }
  // carved rune circle in the centre, with glowing grooves
  const cx = AX(500), cy = AY(290);
  for (const [rr, w] of [[60, 2], [52, 1], [18, 1]]) B.ring(cx, cy, rr, w, '#262c38', 1, .62);
  for (const rr of [60, 52, 18]) for (let a = 0; a < 6.28; a += .01) B.set(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .62 + 1, '#5a6b84');
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28, x = cx + Math.cos(a) * 56, y = cy + Math.sin(a) * 56 * .62, g = mulberry(k + 9); for (let m = 0; m < 6; m++) B.set(x - 1 + (g() * 3 | 0), y - 2 + (g() * 4 | 0), '#2a3446'); }
  B.line(cx - 18, cy, cx + 18, cy, '#262c38'); B.line(cx, cy - 11, cx, cy + 11, '#262c38');
  for (const sx of [-1, 1]) { const x0 = cx + sx * 165, w = 75; for (let k = 0; k < w; k++) { B.set(x0 - w / 2 + k, cy - 70, '#38404e'); B.set(x0 - w / 2 + k, cy + 70, '#38404e'); } for (let k = -70; k <= 70; k++) { B.set(x0 - w / 2, cy + k, '#38404e'); B.set(x0 + w / 2, cy + k, '#38404e'); } }
  // ice crystals and stone braziers in the corners
  const ICE = ['#2a6a90', '#7fdcf0', '#d8faff', '#ffffff'];
  for (const [x, y] of [[48, 40], [950, 42], [52, 548], [946, 550]]) crystal(B, AX(x), AY(y), 14, ICE, r);
  for (const [x, y] of PROPS.summit.braziers) bowlProp(B, AX(x), AY(y), ['#20242e', '#3a414e', '#5a6474', '#8a96a6']);
  bakeAO(B, (i, j) => inInner(i, j), 8, .45);
  bakeLight(B, [...PROPS.summit.braziers.map(([x, y]) => ({ i: AX(x), j: AY(y), r: 46, col: '#3f8cff', s: .55, sq: .7 })), { i: cx, j: cy, r: 70, col: '#7fd6ff', s: .18, sq: .62 }]);
  bakeVignette(B, .45);
  // front layer: jagged peaks and icicles framing the arena
  const fr = mulberry(77);
  for (let i = 0; i < ART_W; i++) { const top = 18 + Math.round(Math.abs(Math.sin(i / 23)) * 18 + vnoise(5)(i / 9, 1) * 12), bot = ART_H - 14 - Math.round(Math.abs(Math.sin(i / 31 + 1)) * 14 + vnoise(6)(i / 9, 1) * 10);
    for (let j = 0; j < top; j++) F.set(i, j, j > top - 3 ? '#cfdbe6' : j > top - 6 ? '#3a465c' : '#0b0f18');
    for (let j = bot; j < ART_H; j++) F.set(i, j, j < bot + 2 ? '#e9f0f6' : j < bot + 4 ? '#8fa2b8' : '#0b0f18');
    if (fr() < .12) { const L = 3 + fr() * 9; for (let k = 0; k < L; k++) F.set(i, top + k, k > L - 2 ? '#ffffff' : '#bfefff'); } }
}

/* =========================== 2. CRYSTAL CAVERN =========================== */
function drawCavern(B, r, F) {
  const n1 = vnoise(101), n2 = vnoise(131), cellF = W2(77);
  // layered cave rock: cells lit from the top-left
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { const [d1, d2] = cellF(i, j, 15), e = d2 - d1, lit = n1(i / 30, j / 30);
    const pal = ['#120e22', '#191430', '#211a3e', '#2a224e', '#352c60', '#433873']; let k = clamp(Math.floor(1 + lit * 3 + (e > .3 ? 1 : 0) + (dith(i, j) - .5)), 0, 5); if (e < .06) k = 0; B.set(i, j, pal[k]); }
  const ledgeY = AY(60), lowY = AY(560);
  for (let j = 0; j < ledgeY; j++) for (let i = 0; i < ART_W; i++) { const [d1, d2] = cellF(i * 1.3, j * 1.6, 11), e = d2 - d1; const pal = ['#2a2150', '#3b3170', '#4a3f88', '#5b4fa0', '#6f62b8', '#8576cc']; B.set(i, j, e < .07 ? pal[0] : pal[clamp(Math.floor(2 + n2(i / 18, j / 18) * 2.5 - (ledgeY - j) / ledgeY * 1.5 + dith(i, j) - .5), 1, 5)]); }
  for (let i = 0; i < ART_W; i++) { const jag = Math.round(Math.sin(i * .37) * 1.5 + n2(i / 6, 3) * 3); B.set(i, ledgeY + jag, '#b4a8f0'); B.set(i, ledgeY + jag + 1, '#6a5cb0'); for (let k = 2; k < 7; k++) B.set(i, ledgeY + jag + k, k < 4 ? '#2a2150' : '#160f2c'); if (i % 14 === 0) for (let k = -14; k < 0; k++) B.set(i, ledgeY + jag + k, k > -2 ? '#c8bcff' : '#3b3170'); }
  for (let j = lowY; j < ART_H; j++) for (let i = 0; i < ART_W; i++) B.set(i, j, ['#231c44', '#2e2656', '#3a3168'][clamp(Math.floor(n2(i / 10, j / 10) * 3 + dith(i, j) - .5), 0, 2)]);
  for (let i = 0; i < ART_W; i++) { B.set(i, lowY, '#9a8ee0'); B.set(i, lowY + 1, '#4a3f88'); }
  // arena slab with rim, crystal veins and the glowing moat
  const x0 = AX(95), y0 = AY(75), x1 = AX(905), y1 = AY(520), rad = 14, inSlab = roundIn(x0, y0, x1, y1, rad);
  const moatD = (i, j) => { const cx = clamp(i, x0 + rad, x1 - rad), cy = clamp(j, y0 + rad, y1 - rad); return Math.hypot(i - cx, j - cy) - rad; };
  for (let j = y0 - 14; j < y1 + 14; j++) for (let i = x0 - 14; i < x1 + 14; i++) { const d = moatD(i, j); if (d > 0 && d <= 11) { const pal = ['#0a2440', '#0d3658', '#124c78', '#18649a', '#2a86bc', '#58b4e0', '#a0e8ff']; B.set(i, j, pal[clamp(Math.floor((1 - d / 11) * 5.4 + n1(i / 4, j / 4) * 1.2 + dith(i, j) - .5), 0, 6)]); } }
  slabs(B, x0, y0, x1 + 1, y1 + 1, inSlab, { pal: ['#1c1a2a', '#34324a', '#3a3852', '#413f5a', '#484662', '#504e6c'], hi: '#6a6888', cell: 16, seed: 21, cracks: 70, sy: 1.15, seamW: .07 });
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (inSlab(i, j) && !(inSlab(i - 1, j) && inSlab(i + 1, j) && inSlab(i, j - 1) && inSlab(i, j + 1))) { B.set(i, j, '#c8f6ff'); B.set(i, j - 1, '#7fd8ff'); }
  for (let k = 0; k < 9; k++) { let i = x0 + 20 + r() * (x1 - x0 - 40), j = y0 + 20 + r() * (y1 - y0 - 40), a = r() * 6.28; for (let s = 0; s < 30; s++) { i += Math.cos(a); j += Math.sin(a) * .7; a += (r() - .5) * .5; if (!inSlab(i | 0, j | 0)) break; B.set(i, j, s % 5 ? '#4fc6f0' : '#c8f6ff'); B.set(i, j + 1, '#1d5f8a'); PROPS.cavern.crystals.push([i, j]); } }
  const CY = ['#1d5f8a', '#4fc6f0', '#9eeaff', '#ffffff'], VI = ['#4a2c86', '#9a6ae0', '#d3b6ff', '#ffffff'], glows = [];
  for (let k = 0; k < 22; k++) { const top = k < 14, i = top ? 12 + r() * (ART_W - 24) : r() < .5 ? 8 + r() * (x0 - 26) : x1 + 18 + r() * (ART_W - x1 - 26), j = top ? ledgeY - 6 - r() * 22 : y0 + 10 + r() * (y1 - y0 - 20), pal = r() < .55 ? CY : VI;
    crystal(B, Math.round(i), Math.round(j), 12 + r() * 16, pal, r); glows.push({ i, j: j - 8, r: 34, col: pal[1], s: .5, sq: .8 }); }
  for (let k = 0; k < 10; k++) crystal(B, Math.round(10 + r() * (ART_W - 20)), lowY + 10 + Math.round(r() * 12), 8 + r() * 8, r() < .5 ? CY : VI, r);
  // spectator railing on the ledge
  for (let i = 30; i < ART_W - 30; i++) { B.set(i, ledgeY - 18, '#8576cc'); if (i % 16 === 0) for (let k = 0; k < 6; k++) B.set(i, ledgeY - 18 + k, '#5b4fa0'); }
  bakeAO(B, (i, j) => inSlab(i, j), 9, .5);
  bakeLight(B, [...glows, { i: (x0 + x1) / 2, j: y0 - 8, r: 300, col: '#2a86bc', s: .12, sq: .3 }]);
  bakeVignette(B, .5);
  // front layer: stalactites with glowing crystal tips; rocky lip at the bottom
  for (let i = 0; i < ART_W; i++) { const base = 10 + Math.round(vnoise(8)(i / 7, 2) * 8); for (let j = 0; j < base; j++) F.set(i, j, j > base - 2 ? '#3b3170' : '#0c0918'); }
  for (let k = 0; k < 26; k++) { const i = Math.round(10 + r() * (ART_W - 20)), L = 14 + r() * 26, w = 3 + r() * 3; for (let j = 0; j < L; j++) { const ww = Math.max(0, Math.round(w * (1 - j / L))); for (let x = -ww; x <= ww; x++) F.set(i + x, 10 + j, x < 0 ? '#2a2150' : '#120e22'); } F.set(i, 10 + Math.round(L), r() < .5 ? '#9eeaff' : '#d3b6ff'); F.set(i, 11 + Math.round(L), '#ffffff'); }
  for (let i = 0; i < ART_W; i++) { const h = 6 + Math.round(vnoise(9)(i / 8, 3) * 8); for (let j = ART_H - h; j < ART_H; j++) F.set(i, j, j === ART_H - h ? '#4a3f88' : '#0c0918'); }
}

/* =========================== 3. CHAMPION HALL =========================== */
function drawHall(B, r, F) {
  const n1 = vnoise(201), n2 = vnoise(211);
  // back wall: dark blue panelling with gold trim and tall arched windows
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) B.set(i, j, ['#0e1428', '#121a32', '#16203c'][clamp(Math.floor(n1(i / 20, j / 20) * 3 + dith(i, j) - .5), 0, 2)]);
  const wallB = AY(32);
  for (let i = 0; i < ART_W; i++) { for (let j = 0; j < wallB; j++) B.set(i, j, (i % 24 === 0) ? '#0a0f20' : j < 4 ? '#24325a' : '#1a2648'); B.set(i, wallB, '#d6a33a'); B.set(i, wallB + 1, '#7a5418'); B.set(i, wallB + 2, '#0a0f20'); }
  for (const x of PROPS.hall.windows) { const i = AX(x), w = 16; for (let j = 6; j < wallB - 4; j++) for (let k = -w / 2; k <= w / 2; k++) { const arch = j < 14 && Math.hypot(k, (14 - j) * 1.1) > w / 2; if (arch) continue; B.set(i + k, j, k === 0 || j === 24 ? '#2a3a6a' : (k + j) % 7 === 0 ? '#b8d8ff' : '#7aa8e6'); } }
  // marble floor: two-tone polished tiles with veins, gold inlay grid and mirror reflections
  const fx0 = AX(40), fy0 = AY(40), fx1 = AX(960), fy1 = AY(540), cut = 14;
  const inFloor = (i, j) => i >= fx0 && i <= fx1 && j >= fy0 && j <= fy1 && (i - fx0) + (j - fy0) >= cut && (fx1 - i) + (j - fy0) >= cut && (i - fx0) + (fy1 - j) >= cut && (fx1 - i) + (fy1 - j) >= cut;
  const T = 14, A = ['#d8e6ea', '#c8dadf', '#b8ccd2', '#a6bcc4'], Bm = ['#9fc8c6', '#8fbcba', '#7eaeac', '#6c9e9c'];
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) { if (!inFloor(i, j)) continue;
    const ti = Math.floor((i - fx0) / T), tj = Math.floor((j - fy0) / T), lx = (i - fx0) % T, ly = (j - fy0) % T, pal = (ti + tj) % 2 ? A : Bm;
    const vein = Math.abs(n2((i + ti * 31) / 9, (j + tj * 17) / 3) - .5) < .025;
    let col = pal[clamp(Math.floor(n1(i / 11 + ti, j / 11) * 2.2 + dith(i, j) * .8), 0, 3)];
    if (vein) col = pal[3]; if (lx === 0 || ly === 0) col = (ti % 3 === 0 && lx === 0) || (tj % 3 === 0 && ly === 0) ? '#d6a33a' : '#6a8a90'; else if (lx === 1 || ly === 1) col = mix(col, '#ffffff', .35);
    B.set(i, j, col); }
  for (let j = fy0; j <= fy1; j++) for (let i = fx0; i <= fx1; i++) if (inFloor(i, j) && (!inFloor(i - 1, j) || !inFloor(i + 1, j) || !inFloor(i, j - 1) || !inFloor(i, j + 1))) { B.set(i, j, '#f1cf6a'); B.set(i, j + 1, '#9a6c1c'); }
  // red carpet with gold borders and a diamond pattern
  const cl = AX(468), cr = AX(532);
  for (let j = 0; j < AY(225); j++) for (let i = cl; i <= cr; i++) { const e = i - cl, f = cr - i; let col = '#9a1c2a'; if (e < 2 || f < 2) col = '#e8b84a'; else if (e < 3 || f < 3) col = '#6a1018'; else if ((Math.abs((i - (cl + cr) / 2)) + (j % 14)) % 14 === 7) col = '#d6a33a'; else if ((i + j) % 2 && j % 14 < 2) col = '#b3263a'; B.set(i, j, col); }
  // centre emblem: gold sunburst ring with a blue gem
  const cx = AX(500), cy = AY(290), G = ['#6a4710', '#9a6c1c', '#c8962e', '#e8c45a', '#fff0b0'];
  for (let k = 0; k < 24; k++) { const a = k / 24 * 6.28, L = k % 2 ? 46 : 38; for (let s = 30; s < L; s++) { B.set(cx + Math.cos(a) * s, cy + Math.sin(a) * s * .62, G[k % 2 ? 3 : 2]); } }
  for (let j = cy - 28; j <= cy + 28; j++) for (let i = cx - 30; i <= cx + 30; i++) { const dx = i + .5 - cx, dy = (j + .5 - cy) / .62, d = Math.hypot(dx, dy); if (d > 28) continue; const lit = clamp(.55 - (dx + dy) / 60 + (d < 20 ? .12 : 0), 0, .999); let col = G[Math.floor(lit * 5)]; if (Math.abs(d - 20.5) < 1.2 || Math.abs(d - 27) < .9) col = G[0]; B.set(i, j, col); }
  gemPx(B, cx, cy, 7, ['#0a3a6a', '#1a6ac0', '#4aa6ff', '#bfe6ff']);
  // reflections of the pillars and windows in the polish
  for (const [x, y] of PROPS.hall.lamps) for (let k = 4; k < 26; k++) { if (k % 3 === 0) continue; for (let w = -3; w <= 3; w++) pxTint(B, AX(x) + w, AY(y) + k, [240, 248, 255], .18 * (1 - k / 26)); }
  for (const x of PROPS.hall.windows) for (let j = fy0; j < fy0 + 70; j++) for (let w = -5; w <= 5; w++) { const i = AX(x) + w + Math.round((j - fy0) * .35); if (inFloor(i, j) && (i + j) % 2) pxTint(B, i, j, [210, 230, 255], .22 * (1 - (j - fy0) / 70)); }
  for (const [x, y] of PROPS.hall.lamps) hallPillar(B, AX(x), AY(y));
  // gold door and blue railings at the front
  B.rect(AX(475), fy1 + 3, AX(525) - AX(475), ART_H - fy1, '#c99a2a'); B.rect(AX(477), fy1 + 5, AX(523) - AX(477), ART_H - fy1, '#f1cf6a'); B.rect(AX(499), fy1 + 5, 2, ART_H - fy1, '#9a6c1c');
  for (const sx of [-1, 1]) { const x0 = AX(500 + sx * 150) - 50; B.rect(x0, fy1 + 6, 100, 4, '#2d5aa8'); B.rect(x0, fy1 + 6, 100, 1, '#8ab4f0'); for (let k = 0; k < 100; k += 10) B.rect(x0 + k, fy1 + 6, 1, 8, '#1a3a78'); }
  bakeAO(B, inFloor, 8, .4);
  bakeLight(B, [...PROPS.hall.lamps.map(([x, y]) => ({ i: AX(x), j: AY(y) - 4, r: 44, col: '#ffd890', s: .45, sq: .7 })), { i: cx, j: cy, r: 80, col: '#fff0b0', s: .12, sq: .62 }]);
  bakeVignette(B, .35);
  // front layer: pillar capitals and hanging banner rods (the cloth waves at runtime)
  for (const [x, y] of PROPS.hall.lamps) { const i = AX(x), j = AY(y); for (let k = -7; k <= 7; k++) { F.set(i + k, j - 30, '#fff0b0'); F.set(i + k, j - 29, '#d6a33a'); F.set(i + k, j - 28, '#9a6c1c'); } }
  for (const x of PROPS.hall.windows) for (let k = -9; k <= 9; k++) F.set(AX(x) + k, 4, '#e8b84a');
}
function hallPillar(B, i, j) {
  B.ell(i, j + 3, 10, 3, '#05070d', .5);
  B.rect(i - 8, j - 3, 17, 6, '#1b2440'); B.rect(i - 8, j - 3, 17, 1, '#e8b84a'); B.rect(i - 8, j + 2, 17, 1, '#7a5418');
  for (let y = 0; y < 24; y++) for (let x = -6; x <= 6; x++) B.set(i + x, j - 4 - y, x === -6 || x === 6 ? '#1a2440' : x % 3 === 0 ? '#3a4a78' : x < -2 ? '#9aa8d0' : x < 2 ? '#6e7eaa' : '#4a5a88');
  B.rect(i - 7, j - 30, 15, 3, '#d6a33a'); B.rect(i - 7, j - 30, 15, 1, '#fff0b0');
  B.ell(i, j - 33, 3, 3, '#fff6d0'); B.set(i - 1, j - 34, '#ffffff');
}

/* =========================== 4. SKY CASTLE =========================== */
function drawCastle(B, r, F) {
  const n1 = vnoise(301), fl = STAGES.castle.walk.map(([a, b, c, d]) => [AX(a) - 4, AY(b) - 4, AX(c) + 4, AY(d) + 4]);
  const inF = (i, j) => fl.some(q => i >= q[0] && i <= q[2] && j >= q[1] && j <= q[3]);
  // floating stone islands with turrets in the corners
  for (const [x, y] of PROPS.castle.turrets) islandPx(B, AX(x), AY(y), r);
  // the floor's thickness: a stone face below every exposed lower edge, so the arena floats
  for (let i = 0; i < ART_W; i++) for (let j = ART_H - 2; j > 0; j--) if (inF(i, j) && !inF(i, j + 1)) { for (let k = 1; k <= 12; k++) { if (inF(i, j + k)) break; B.set(i, j + k, k < 2 ? '#3a3326' : k < 7 ? ((i + k) % 6 ? '#5a5040' : '#4a4234') : ((i * 7 + k) % 5 ? '#3a3326' : '#2a251c')); } for (let k = 13; k < 16; k++) if (!inF(i, j + k)) B.set(i, j + k, '#2a251c', .5); }
  // weathered tiles with moss, cracks and a gold-riveted trim
  const T = 11;
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { if (!inF(i, j)) continue; const ti = Math.floor(i / T), tj = Math.floor(j / T), lx = i % T, ly = j % T, tone = hash2(ti, tj, 5);
    let col = ['#c9bfa8', '#d4cab4', '#ddd4c0', '#e6dfcd'][clamp(Math.floor(tone * 3 + n1(i / 9, j / 9) * 1.4 + dith(i, j) * .6), 0, 3)];
    if (lx === 0 || ly === 0) col = '#a89c84'; else if (lx === 1 || ly === 1) col = '#f2ecdc';
    if (n1(i / 14 + 3, j / 14) > .8 && (i + j) % 2) col = (i * j) % 3 ? '#7a9a5a' : '#5a7a44';
    B.set(i, j, col); }
  for (let k = 0; k < 60; k++) { let i = r() * ART_W, j = r() * ART_H, a = r() * 6.28; for (let s = 0; s < 8 + r() * 10; s++) { i += Math.cos(a); j += Math.sin(a) * .7; a += (r() - .5) * .8; if (!inF(i | 0, j | 0)) break; B.set(i, j, '#8a7e68'); } }
  for (let j = 1; j < ART_H - 1; j++) for (let i = 1; i < ART_W - 1; i++) { if (!inF(i, j)) continue; const edge = !inF(i - 1, j) || !inF(i + 1, j) || !inF(i, j - 1) || !inF(i, j + 1), edge2 = !inF(i - 2, j) || !inF(i + 2, j) || !inF(i, j - 2) || !inF(i, j + 2);
    if (edge) B.set(i, j, (i + j) % 9 === 0 ? '#fff6c8' : '#d9ab34'); else if (edge2) B.set(i, j, '#8a6818'); }
  for (const q of fl) for (const [i, j] of [[q[0], q[1]], [q[2], q[1]], [q[0], q[3]], [q[2], q[3]]]) { B.rect(i - 3, j - 3, 7, 7, '#f2d36b'); B.rect(i - 2, j - 2, 5, 5, '#b8901f'); B.set(i - 1, j - 1, '#fff6c8'); }
  // centre seal
  const cx = AX(500), cy = AY(300); for (const [rr, c] of [[24, '#a89c84'], [22, '#d9ab34'], [14, '#a89c84']]) B.ring(cx, cy, rr, 1, c, 1, .62); for (let k = 0; k < 8; k++) { const a = k * .785; B.line(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14 * .62, cx + Math.cos(a) * 22, cy + Math.sin(a) * 22 * .62, '#d9ab34'); }
  // bridges
  for (const [x0, x1] of [[-200, 70], [930, 1200]]) { const a = AX(x0), b = AX(x1), t = AY(258), bo = AY(342); for (let j = t; j <= bo; j++) for (let i = a; i < b; i++) B.set(i, j, j === t || j === bo ? '#8ab4f0' : (i % 8 === 0) ? '#1a3a78' : (j - t) % 6 === 0 ? '#24489a' : '#2d5aa8'); for (let i = a; i < b; i++) for (let k = 1; k < 8; k++) B.set(i, bo + k, k < 3 ? '#1a2a50' : '#121c38'); }
  bakeAO(B, inF, 6, .35);
  bakeLight(B, [{ i: AX(150), j: AY(60), r: 420, col: '#fff0c8', s: .15, sq: .7 }]);
}
function islandPx(B, i, j, r) {
  for (let y = -10; y <= 26; y++) for (let x = -22; x <= 22; x++) { const top = y < 0, w = top ? 22 - Math.abs(y) * .4 : 22 * (1 - y / 26) + Math.sin(y * 1.3) * 2; if (Math.abs(x) > w) continue;
    B.set(i + x, j + y, top ? (y < -8 ? '#9ac06a' : '#7aa04a') : (x < -w * .3 ? '#7a6a52' : x < w * .3 ? '#5a4c3a' : '#3a3024')); }
  for (let y = -34; y < -8; y++) for (let x = -6; x <= 6; x++) B.set(i + x, j + y, x < -3 ? '#e6dfcd' : x < 3 ? '#c9bfa8' : '#a89c84');
  for (let x = -8; x <= 8; x += 4) B.rect(i + x - 1, j - 38, 3, 4, '#c9bfa8'); B.rect(i - 8, j - 35, 17, 1, '#a89c84'); B.rect(i - 1, j - 50, 1, 14, '#5a4c3a');
}

/* =========================== 5. GRAND HALL =========================== */
function drawGrand(B, r, F) {
  const n1 = vnoise(401);
  // obsidian checker floor with glossy highlights
  const T = 14;
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { const ti = Math.floor(i / T), tj = Math.floor(j / T), lx = i % T, ly = j % T, dark = (ti + tj) % 2;
    const pal = dark ? ['#1a1c24', '#20232c', '#262a34', '#2e323e'] : ['#3a3e4a', '#424654', '#4a4f5e', '#535868'];
    let col = pal[clamp(Math.floor(n1(i / 16, j / 16) * 2 + dith(i, j) * 1.2), 0, 3)];
    if (lx === 0 || ly === 0) col = '#121318'; else if ((lx === 1 || ly === 1) && !dark) col = '#6a7080'; else if ((lx + ly) === 6 && lx > 1 && ly > 1 && !dark) col = '#7a8090';
    B.set(i, j, col); }
  // circuit inlays leading into the great ring
  const cx = AX(500), cy = AY(290), R = 112;
  for (let k = 0; k < 8; k++) { const a = k * .785 + .39; let x = cx + Math.cos(a) * (R + 4), y = cy + Math.sin(a) * (R + 4) * .62; for (let s = 0; s < 60; s++) { if (s % 15 === 14) { if (k % 2) x += 0; } x += Math.cos(a) * 1.4; y += Math.sin(a) * .9; B.set(x, y, '#0e7d77'); } B.ell(x, y, 2, 2, '#25d6ca'); }
  // walls: tall moonlit windows along the top, dark side walls with doors
  const top = AY(25);
  for (let j = 0; j < top; j++) for (let i = 0; i < ART_W; i++) B.set(i, j, j < 3 ? '#4a4e5a' : (i % 22 === 0) ? '#1e2028' : '#2c2f38');
  for (const x of PROPS.grand.windows) { const i = AX(x); for (let j = 4; j < top - 3; j++) for (let k = -9; k <= 9; k++) { if (j < 10 && Math.hypot(k, (10 - j) * 1.2) > 9) continue; B.set(i + k, j, k === 0 || (j - 4) % 10 === 0 ? '#3a4a6a' : (k + j * 2) % 9 === 0 ? '#d8e8ff' : '#8aa8d8'); } }
  B.rect(0, top, ART_W, 2, '#0e0f14'); B.rect(0, top + 2, ART_W, 1, '#5a5e6c');
  for (const x of [AX(-60), AX(1060)]) { B.rect(x - 12, 0, 24, ART_H, '#24262e'); B.rect(x - 12, 0, 2, ART_H, '#4a4e5a'); B.rect(x + 10, 0, 2, ART_H, '#14151a'); }
  B.rect(AX(1030), AY(215), 10, 34, '#2d5aa8'); B.rect(AX(1030), AY(215), 10, 1, '#8ab4f0'); B.rect(AX(1030) + 7, AY(232), 1, 2, '#f1cf6a');
  // the great ring and the golden orb
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { const d = Math.hypot(i + .5 - cx, (j + .5 - cy) / .62), e = Math.abs(d - R), v = Math.abs(i + .5 - cx);
    if (e < 4.5) B.set(i, j, e < 1.2 ? '#bffffa' : e < 2.6 ? '#25d6ca' : e < 3.6 ? '#0e7d77' : '#073e3b');
    else if (v < 2.5 && j > top + 3) B.set(i, j, v < 1 ? '#7ff7ef' : '#0e7d77');
    else if (e < 10) pxTint(B, i, j, [37, 214, 202], .12 * (1 - e / 10)); }
  const OR = 25, Y = ['#4a3408', '#7a5812', '#a07a1c', '#cfa632', '#f0d35a', '#fff09a', '#fffbe6'];
  for (let j = cy - OR - 6; j <= cy + OR + 6; j++) for (let i = cx - OR - 6; i <= cx + OR + 6; i++) { const d = Math.hypot(i + .5 - cx, j + .5 - cy); if (d > OR + 5 && d < OR + 6) B.set(i, j, '#25d6ca'); else if (d > OR && d <= OR + 4) B.set(i, j, d < OR + 1.5 ? '#073e3b' : '#0e7d77'); }
  for (let j = cy - OR; j <= cy + OR; j++) for (let i = cx - OR; i <= cx + OR; i++) { const dx = (i + .5 - cx) / OR, dy = (j + .5 - cy) / OR, rr = dx * dx + dy * dy; if (rr > 1) continue; const nz = Math.sqrt(1 - rr), lit = clamp(-dx * .45 - dy * .6 + nz * .6, 0, 1) + (dith(i, j) - .5) * .12; B.set(i, j, Y[clamp(Math.floor(lit * 7), 0, 6)]); }
  // piano on a rug
  const pi = AX(965), pj = AY(110);
  for (let y = -16; y <= 24; y++) for (let x = -24; x <= 18; x++) B.set(pi + x, pj + y, (x + y) % 6 === 0 ? '#8a2a3a' : Math.abs(x) > 20 || Math.abs(y) > 22 ? '#d6a33a' : '#6a1a2a');
  B.rect(pi - 18, pj - 6, 30, 22, '#0c0c12'); B.rect(pi - 18, pj - 6, 30, 1, '#4a4a5a'); B.rect(pi - 16, pj - 4, 26, 2, '#22222c'); for (let k = 0; k < 13; k++) { B.rect(pi - 15 + k * 2, pj + 12, 1, 6, '#f2f2f2'); if (k % 7 !== 2 && k % 7 !== 6) B.rect(pi - 14 + k * 2, pj + 12, 1, 3, '#0c0c12'); } B.rect(pi - 12, pj + 20, 10, 3, '#3a2a1a');
  bakeLight(B, [...PROPS.grand.chand.map(([x, y]) => ({ i: AX(x), j: AY(y), r: 60, col: '#ffcf8a', s: .3, sq: .65 })), { i: cx, j: cy, r: 60, col: '#fff09a', s: .4, sq: .9 }, { i: cx, j: cy, r: 150, col: '#25d6ca', s: .12, sq: .62 },
    ...PROPS.grand.windows.map(x => ({ i: AX(x) + 30, j: top + 50, r: 70, col: '#8aa8d8', s: .2, sq: .5 }))]);
  bakeVignette(B, .5);
  // front layer: chandeliers
  for (const [x, y] of PROPS.grand.chand) { const i = AX(x), j = AY(y) - 60; for (let k = 0; k < 10; k++) F.set(i, j - 10 + k, '#3a3226'); F.ring(i, j, 9, 1, '#9a7a3a', 1, .5); F.ring(i, j, 5, 1, '#c8a24a', 1, .5); for (let k = 0; k < 6; k++) { const a = k * 1.047; F.rect(i + Math.cos(a) * 9, j + Math.sin(a) * 4.5 - 3, 1, 3, '#f2ecdc'); } }
}

/* =========================== 6. METEOR CAVE =========================== */
function drawMeteor(B, r, F) {
  const n1 = vnoise(501), n2 = vnoise(519), S = 10;
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) {
    const row = Math.floor(j / (S / 2)), off = row % 2 ? S / 2 : 0, cx = Math.floor((i + off) / S) * S - off + S / 2, cyy = row * (S / 2) + S * .55, dx = i + .5 - cx, dy = j + .5 - cyy, d = Math.hypot(dx, dy * 1.15) / (S * .62), tone = hash2(Math.floor((i + off) / S), row, 3);
    let col; if (d > .86 && d < 1.02 && dy < S * .2) col = '#8f82a0'; else if (d > .7 && d <= .86 && dy < 0) col = '#e4dcea'; else col = ['#b6abc2', '#c0b6cb', '#cac0d4', '#d2cadb'][clamp(Math.floor(tone * 2.5 + (.5 - dy / S * .6) * 1.4 + n1(i / 50, j / 50) * .6), 0, 3)];
    if (n2(i / 16, j / 16) > .82 && d < .7) col = (i + j) % 3 ? '#7a9a6a' : '#5a7a4a';
    B.set(i, j, col); }
  // rocky walls with depth
  for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) { const x = fromArtX(i), y = fromArtY(j), e = Math.max(70 - x, x - 930, 55 - y, y - 540) + (n2(i / 7, j / 7) - .5) * 26; if (e <= 0) continue;
    const cellv = n1(i / 5, j / 5); B.set(i, j, e > 70 ? (cellv > .6 ? '#30283e' : '#241e30') : e > 40 ? (cellv > .55 ? '#463c58' : '#3a3248') : e > 12 ? (cellv > .5 ? '#5e5272' : '#504562') : e > 4 ? '#7a6e8e' : '#9a8eae'); }
  // the meteor crater: scorched centre, radial cracks, glowing fragments
  const [mx, my] = PROPS.meteor.crater, ci = AX(mx), cj = AY(my);
  for (let j = cj - 30; j <= cj + 30; j++) for (let i = ci - 46; i <= ci + 46; i++) { const d = Math.hypot((i - ci) / 46, (j - cj) / 28); if (d > 1) continue;
    if (d < .45) B.set(i, j, ['#2a2236', '#3a304a', '#4a3e5c'][clamp(Math.floor(d * 6 + dith(i, j) - .5), 0, 2)]); else if (d < .55) B.set(i, j, '#e4dcea'); else if (d < .62) B.set(i, j, '#6a5e7e'); else pxMul(B, i, j, .9 + d * .1); }
  for (let k = 0; k < 14; k++) { let a = k / 14 * 6.28 + r() * .3, i = ci + Math.cos(a) * 26, j = cj + Math.sin(a) * 16; for (let s = 0; s < 18 + r() * 20; s++) { i += Math.cos(a); j += Math.sin(a) * .62; a += (r() - .5) * .4; B.set(i, j, '#4a3e5c'); } }
  for (let k = 0; k < 7; k++) gemPx(B, ci + Math.round((r() - .5) * 30), cj + Math.round((r() - .5) * 16), 2 + (k % 2), ['#5a1a6a', '#b04ae0', '#f0a8ff', '#ffffff']);
  // puddles with reflections
  for (let k = 0; k < 8; k++) { const x = AX(140 + r() * 720), y = AY(110 + r() * 380); if (Math.hypot(x - ci, y - cj) < 60) continue; const w = 9 + r() * 8, h = 3 + r() * 2; PROPS.meteor.puddles.push([x, y, w, h]);
    B.ell(x, y, w + 1, h + 1, '#8b80a0'); B.ell(x, y, w, h, '#5a5694'); B.ell(x - 2, y - 1, w * .7, h * .5, '#7a76b8'); B.rect(x - w * .4, y - h * .4, w * .3, 1, '#d8d4ff'); }
  const P1 = ['#3b2f66', '#7b68c8', '#c4b5ff', '#ffffff'], gl = [];
  for (let k = 0; k < 18; k++) { const topk = k % 2, i = 10 + r() * (ART_W - 20), j = topk ? AY(30 + r() * 20) : AY(565 + r() * 30); crystal(B, Math.round(i), Math.round(j), 6 + r() * 10, P1, r); gl.push({ i, j: j - 6, r: 28, col: '#9a7cff', s: .45, sq: .8 }); }
  bakeAO(B, (i, j) => { const x = fromArtX(i), y = fromArtY(j); return Math.max(70 - x, x - 930, 55 - y, y - 540) + (n2(i / 7, j / 7) - .5) * 26 <= 0; }, 9, .5);
  bakeLight(B, [...gl, { i: ci, j: cj, r: 70, col: '#c060ff', s: .45, sq: .62 }]); bakeVignette(B, .45);
  for (let k = 0; k < 22; k++) { const i = Math.round(10 + r() * (ART_W - 20)), L = 10 + r() * 22, w = 2 + r() * 3; PROPS.meteor.drips.push([i, 8 + L]); for (let j = 0; j < L; j++) { const ww = Math.max(0, Math.round(w * (1 - j / L))); for (let x = -ww; x <= ww; x++) F.set(i + x, 6 + j, x < 0 ? '#3a3248' : '#1a1622'); } }
  for (let i = 0; i < ART_W; i++) { const h = 8 + Math.round(vnoise(7)(i / 8, 1) * 6); for (let j = 0; j < h; j++) F.set(i, j, j === h - 1 ? '#504562' : '#120e18'); }
}

/* =========================== runtime animation =========================== */
function animateStage(c, ox, oy, t) {
  const id = STAGE_ID, X = i => Math.round(i - ox), Y = j => Math.round(j - oy);
  if (id === 'summit') {
    for (const [x, y] of PROPS.summit.braziers) { const i = X(AX(x)), j = Y(AY(y)) - 5; glow(i, j - 4, 9 + Math.sin(t / 90 + x) * 1.5, '#3f8cff', .35); flamePx(i, j, 11 + Math.sin(t / 70 + x) * 2, 3, t + x * 7, ['#ffffff', '#d8f4ff', '#7fd6ff', '#3f8cff', '#2a5ad0', '#1a2a70'], .95); }
    const cx = X(AX(500)), cy = Y(AY(290)); for (const rr of [60, 52]) for (let k = 0; k < 48; k++) { const a = k / 48 * 6.28, p = (Math.sin(a * 3 - t / 400) + 1) / 2; if (p > .75) aRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .62, 1, 1, '#9feaff', (p - .75) * 3); }
  } else if (id === 'cavern') {
    const x0 = AX(95), y0 = AY(75), x1 = AX(905), y1 = AY(520);
    for (let k = 0; k < 90; k++) { const q = (k * 97.13 + t / 1100) % 1, sd = k % 4, d = 2 + (k * 7) % 8; let i, j; if (sd === 0) { i = x0 + q * (x1 - x0); j = y0 - d; } else if (sd === 1) { i = x0 + q * (x1 - x0); j = y1 + d; } else if (sd === 2) { i = x0 - d; j = y0 + q * (y1 - y0); } else { i = x1 + d; j = y0 + q * (y1 - y0); } if ((Math.floor(t / 160) + k) % 3) aRect(X(i), Y(j), 2, 1, k % 5 ? '#bff6ff' : '#ffffff', .8); }
    for (let k = 0; k < PROPS.cavern.crystals.length; k += 6) { const [i, j] = PROPS.cavern.crystals[k], p = (Math.sin(t / 300 + k) + 1) / 2; if (p > .6) aRect(X(i), Y(j), 1, 1, '#ffffff', p); }
  } else if (id === 'hall') {
    for (const [x, y] of PROPS.hall.lamps) glow(X(AX(x)), Y(AY(y)) - 33, 6 + Math.sin(t / 220 + x) * 1, '#fff0b0', .4);
    const cx = X(AX(500)), cy = Y(AY(290)), a = t / 900; for (let k = 0; k < 3; k++) { const b = a + k * 2.09; aRect(cx + Math.cos(b) * 24, cy + Math.sin(b) * 24 * .62, 1, 1, '#ffffff', .9); }
  } else if (id === 'grand') {
    const cx = X(AX(500)), cy = Y(AY(290)); for (let k = 0; k < 3; k++) { const a = t / 700 + k * 2.09; for (let s = 0; s < 14; s++) aRect(cx + Math.cos(a - s * .02) * 112, cy + Math.sin(a - s * .02) * 112 * .62, 2, 1, '#ffffff', 1 - s / 14); }
    const sh = (t / 18) % 80 - 40; for (let y = -20; y < 20; y++) { const w = Math.sqrt(Math.max(0, 625 - y * y)); if (Math.abs(sh - y * .5) < w) aRect(cx + sh - y * .5, cy + y, 2, 1, '#ffffff', .35); }
  } else if (id === 'meteor') {
    const [mx, my] = PROPS.meteor.crater, p = (Math.sin(t / 260) + 1) / 2; glow(X(AX(mx)), Y(AY(my)), 10 + p * 6, '#c060ff', .3 + p * .2);
    for (const [x, y, w, h] of PROPS.meteor.puddles) { const q = ((t + x * 37) % 2400) / 2400; if (q < .5) aRing(X(x), Y(y), 1 + q * w * 1.4, (1 + q * w * 1.4) * h / w, '#d8d4ff', 1 - q * 2); }
  }
}
function animateFront(b, ox, oy, t) {
  const id = STAGE_ID, X = i => Math.round(i - ox), Y = j => Math.round(j - oy);
  if (id === 'summit' || id === 'cavern') {   // drifting fog banks
    const col = id === 'summit' ? '#c8d8ea' : '#7a6ac8';
    for (let band = 0; band < 3; band++) { const y = 120 + band * 90 + Math.sin(t / 4000 + band) * 20; for (let i = 0; i < ART_W; i += 2) { const d = Math.sin(i / 40 + t / 3000 + band * 2) * 8; for (let k = 0; k < 10; k++) if ((i / 2 + k + band) % 4 === 0) aRect(X(i), Y(y + d + k), 2, 1, col, .05); } }
  }
  if (id === 'hall') {
    for (const x of PROPS.hall.windows) { const i = X(AX(x)); for (let k = 0; k < 26; k++) { const sway = Math.sin(t / 500 + k / 6 + x) * (k / 26) * 2.5; for (let w = -8; w <= 8; w++) aRect(i + w + sway, Y(5 + k), 1, 1, Math.abs(w) > 6 ? '#e8b84a' : (k > 18 && Math.abs(w) < 3 && Math.abs(k - 22) < 3) ? '#f1cf6a' : w < -3 ? '#c02a3a' : '#9a1c2a', 1); } for (let w = -8; w <= 8; w++) if ((w + 9) % 4 < 2) aRect(i + w + Math.sin(t / 500 + 1 + x) * 2.5, Y(31), 1, 2, '#9a1c2a', 1); }
    b.globalCompositeOperation = 'lighter'; for (const x of PROPS.hall.windows) { const i0 = X(AX(x)); for (let j = 0; j < 150; j += 2) { const w = 7 + j * .1, sh = Math.sin(t / 1500 + x) * 3; aRect(i0 + j * .45 - w + sh, Y(AY(25) + j), w * 2, 2, '#ffe8b0', .035 * (1 - j / 150)); } } b.globalCompositeOperation = 'source-over';
  }
  if (id === 'grand') {
    b.globalCompositeOperation = 'lighter'; for (const x of PROPS.grand.windows) { const i0 = X(AX(x)); for (let j = 0; j < 180; j += 2) { const w = 8 + j * .12; aRect(i0 + j * .5 - w, Y(AY(25) + j), w * 2, 2, '#9ab8ff', .04 * (1 - j / 180)); } } b.globalCompositeOperation = 'source-over';
    for (const [x, y] of PROPS.grand.chand) { const i = X(AX(x)), j = Y(AY(y) - 60); for (let k = 0; k < 6; k++) { const a = k * 1.047; aRect(i + Math.cos(a) * 9, j + Math.sin(a) * 4.5 - 4, 1, 1, Math.sin(t / 80 + k * 3) > -.3 ? '#ffd27a' : '#ff9a3a', 1); } glow(i, j, 10, '#ffcf8a', .18); }
  }
  if (id === 'castle') {
    for (const [x, y] of PROPS.castle.turrets) { const i = X(AX(x)), j = Y(AY(y) - 50); for (let k = 0; k < 12; k++) for (let h = 0; h < 7 - Math.floor(k / 3); h++) aRect(i + 1 + k, j + h + Math.sin(t / 160 - k / 2) * 1.5, 1, 1, h < 2 ? '#ff6a7a' : '#d02a3a', 1); }
  }
  if (id === 'meteor' || id === 'cavern') {
    const list = id === 'meteor' ? PROPS.meteor.drips : [[120, 30], [300, 34], [520, 28], [610, 32]];
    for (let k = 0; k < list.length; k += 2) { const [i, j0] = list[k], q = ((t + k * 917) % 3000) / 3000; if (q < .3) aRect(X(i), Y(j0 + q / .3 * 200), 1, 2, '#c8d0ff', .8); }
  }
}
// Behind see-through floors (Sky Castle): a pixel sky with drifting clouds.
let SKY = null;
function drawStageBackdrop(b, ox, oy, t) {
  if (STAGE_ID !== 'castle') return;
  if (!SKY) { const B = PixBuf(ART_W, ART_H), pal = ['#3a6ac8', '#4a7ad4', '#5a8ade', '#6c9ae6', '#80aaee', '#94bcf4', '#aacef8']; for (let j = 0; j < ART_H; j++) for (let i = 0; i < ART_W; i++) B.set(i, j, pal[clamp(Math.floor(j / ART_H * 6.5 + dith(i, j) - .5), 0, 6)]); SKY = B.toCanvas(); }
  b.drawImage(SKY, -ox * .3 - (ART_W - (ART_W)) * 0, -oy * .3);
  const layer = (seed, speed, y0, col, shade, scale) => { const rr = mulberry(seed); for (let k = 0; k < 9; k++) { const w = (40 + rr() * 50) * scale, base = rr() * (ART_W + 200), x = ((base + t * speed) % (ART_W + 200)) - 100 - ox * .5 * scale, y = y0 + rr() * 300 - oy * .5 * scale;
    for (let m = 0; m < 5; m++) { const cx = x + (m - 2) * w * .22, cy = y - Math.sin(m / 4 * Math.PI) * w * .18, r = w * (.22 + Math.sin(m / 4 * Math.PI) * .12); aEllFill(cx, cy + 2, r, r * .55, shade, 1); aEllFill(cx, cy, r, r * .55, col, 1); } } };
  layer(11, .004, 20, '#c8dcf4', '#9ab8e0', .8); layer(23, .009, 60, '#f4f8fc', '#c8d8ec', 1.2);
}
