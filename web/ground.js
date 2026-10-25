/* =====================================================================
   Section 20: what a move leaves behind on the stage
   Every hit, strike and blast now stamps a mark chosen by the MOVE (not just its type):
     Flamethrower   a charred line with glowing cracks that cool, plus little flames and smoke
     Hydro Pump     a wet streak and puddles whose ripples spread
     Ice Beam       a frozen line of frost crystals that glint
     Thunder        a branching burn, fused glass and crackling arcs
     Earthquake     fissures; Earth Power's fissures glow like lava
     Rock Slide     boulders that stay where they fell
     Slash / claws  parallel gouges;  Bite  tooth marks;  String Shot  a web, and so on.
   Each mark has two parts: a permanent decal painted into the scar layer (cleared with the
   scene), and a lingering animated effect that plays on the ground for a few seconds, under the
   Pokémon, while the mark settles: embers cooling, ripples, frost glints, bubbles popping, dust
   settling, sparks, glitter, feathers drifting down.
   ===================================================================== */
const GCTX = { mv: null, mode: '' };          // which move is being drawn right now; mode 'central' = this file stamps, legacy calls are ignored
const GR = { live: 0 };
const gQual = () => { const S = window.SETTINGS; return (S && S.quality && S.quality !== 'high') ? .5 : 1; };
function ghash(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function gpx(g, i, j, c, a = 1) { g.globalAlpha = a; g.fillStyle = c; g.fillRect(Math.round(i), Math.round(j), 1, 1); }
// irregular blob with a blocky noisy edge (reads as pixel art), optional dithered rim
function gblob(g, cx, cy, rx, ry, c, a, seed, rough = .3, dith = false) {
  rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
  for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
    const d = (x / rx) ** 2 + (y / ry) ** 2, thr = 1 + (ghash(Math.floor((x + rx) / 3), Math.floor((y + ry) / 2), seed) - .5) * rough * 2;
    if (d > thr || (dith && d > thr * .7 && ((x + y) & 1))) continue; gpx(g, cx + x, cy + y, c, a);
  }
}
function gline(g, x0, y0, x1, y1, c, a = 1, w = 1) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let k = 0; k <= n; k++) { const t = k / n; for (let q = 0; q < w; q++) gpx(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + q, c, a); } }
function gchunk(g, i, j, sz, pal, seed) {   // little rock / debris chunk lit from the top left
  for (let y = 0; y < sz; y++) for (let x = 0; x < sz + (y % 2); x++) { const lit = (x + y) < sz * .8; gpx(g, i + x, j + y, y === sz - 1 ? pal[4] : lit ? pal[1] : pal[2]); }
  gpx(g, i, j, pal[0]);
}
const ELL = .55;                                   // the ground is seen at an angle: circles are flattened

/* ---------- permanent decal painters: (ctx, x, y, size, rng, options) → hot points for the lingering effect ---------- */
const GP = {
  // charred ground with soot streaks and cracks; pal can recolour it (dragon, steel, grass-green…)
  char(g, x, y, s, r, o) {
    const R = Math.round(8 * s), P = o.pal || ['#17141a', '#26211f', '#43362c', '#66503c'], pts = [], seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 3, (R + 3) * ELL, P[3], .22, seed, .4, true); gblob(g, x, y, R, R * ELL, P[2], .4, seed + 1, .32); gblob(g, x, y, R * .72, R * .72 * ELL, P[1], .68, seed + 2, .3); gblob(g, x, y, R * .4, R * .4 * ELL, P[0], .86, seed + 3, .25);
    for (let k = 0; k < 7 * s + 3; k++) { const a = r() * 6.28, L = R * (.9 + r() * .9); for (let q = R * .45; q < L; q++) gpx(g, x + Math.cos(a) * q, y + Math.sin(a) * q * ELL, P[1], .4 * (1 - q / L)); }
    for (let k = 0; k < 4 * s + 2; k++) { let i = x, j = y, a = r() * 6.28; for (let q = 0; q < R * .9; q++) { i += Math.cos(a); j += Math.sin(a) * ELL; a += (r() - .5) * .8; gpx(g, i, j, P[0], .9); if (q > 1 && r() < .35) pts.push([i, j]); } }
    for (let k = 0; k < 6 * s; k++) gpx(g, x + (r() - .5) * R * 2.6, y + (r() - .5) * R * 1.5, P[3], .35);
    return pts;
  },
  // puddle: dark wet ring, glossy body, highlights and flung droplets
  wet(g, x, y, s, r, o) {
    const R = Math.round(9 * s), c = o.col || ['#2c4258', '#4c7aa6', '#7fb6dc', '#e2f6ff'], seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 3, (R + 3) * ELL, c[0], .3, seed, .35, true); gblob(g, x, y, R, R * ELL, c[1], .5, seed + 1, .35); gblob(g, x, y, R * .65, R * .65 * ELL, c[2], .4, seed + 2, .3);
    for (let k = 0; k < 2 + s; k++) { const a = 3.4 + r() * 1.5, rr = R * (.2 + r() * .45); for (let q = 0; q < 4 + s * 2; q++) gpx(g, x + Math.cos(a + q * .09) * rr, y + Math.sin(a + q * .09) * rr * ELL - 1, c[3], .75); }
    for (let k = 0; k < 6 * s; k++) { const a = r() * 6.28, d = R * (1.1 + r() * .9); gpx(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL, c[2], .55); if (r() < .4) gpx(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL - 1, c[3], .6); }
    return [[x, y]];
  },
  // frost: a haze plus six-armed crystals
  frost(g, x, y, s, r, o) {
    const R = Math.round(9 * s), P = o.col || ['#2a6a90', '#7fdcf0', '#bff4ff', '#f0fdff'], seed = (r() * 1e4) | 0, pts = [];
    gblob(g, x, y, R + 2, (R + 2) * ELL, P[1], .2, seed, .45, true); gblob(g, x, y, R * .8, R * .8 * ELL, P[2], .25, seed + 1, .4, true);
    const arms = (k, cx, cy, L) => { for (let a = 0; a < 6; a++) { const ang = a * Math.PI / 3 + k, ex = cx + Math.cos(ang) * L, ey = cy + Math.sin(ang) * L * ELL; gline(g, cx, cy, ex, ey, P[2], .9); gpx(g, ex, ey, P[3]);
      for (const f of [.45, .75]) { const bx0 = cx + Math.cos(ang) * L * f, by0 = cy + Math.sin(ang) * L * f * ELL, bl = L * (1 - f) * .75; for (const sg of [-1, 1]) gline(g, bx0, by0, bx0 + Math.cos(ang + sg * .9) * bl, by0 + Math.sin(ang + sg * .9) * bl * ELL, P[1], .85); }
      pts.push([ex, ey]); } gpx(g, cx, cy, P[3]); };
    arms(r() * 1.0, x, y, R * .85); for (let k = 0; k < 2 + s; k++) arms(r() * 3, x + (r() - .5) * R * 1.6, y + (r() - .5) * R * .9, R * (.25 + r() * .3));
    for (let k = 0; k < 8 * s; k++) gpx(g, x + (r() - .5) * R * 2.4, y + (r() - .5) * R * 1.3, P[3], .8);
    return pts;
  },
  // electric burn: a scorched core and a branching Lichtenberg tree, fused glass specks
  volt(g, x, y, s, r, o) {
    const R = Math.round(7 * s), pts = [], seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 2, (R + 2) * ELL, '#4a4230', .25, seed, .4, true); gblob(g, x, y, R * .8, R * .8 * ELL, '#24211f', .6, seed + 1, .3); gblob(g, x, y, R * .4, R * .4 * ELL, '#121216', .85, seed + 2, .25);
    const branch = (i, j, a, L, d) => { for (let q = 0; q < L; q++) { i += Math.cos(a); j += Math.sin(a) * ELL; a += (r() - .5) * .7; gpx(g, i, j, '#17161c', .95); if (d < 2 && q % 4 === 0) gpx(g, i, j, '#7a6a28', .6); if (q === L - 1) pts.push([i, j]); if (d < 3 && q > 3 && r() < .16) branch(i, j, a + (r() < .5 ? -1 : 1) * (.6 + r() * .6), Math.round(L * .55), d + 1); } };
    for (let k = 0; k < 4 + s * 2; k++) branch(x, y, r() * 6.28, Math.round(R * (1.1 + r() * .9)), 0);
    for (let k = 0; k < 5 * s; k++) gpx(g, x + (r() - .5) * R * 2.5, y + (r() - .5) * R * 1.4, r() < .5 ? '#fff2a0' : '#ffe04a', .8);
    return pts;
  },
  // toxic pool
  sludge(g, x, y, s, r, o) {
    const R = Math.round(8 * s), c = o.col || ['#2a1040', '#5a2088', '#8a3ac8', '#d8a0ff'], seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 2, (R + 2) * ELL, c[0], .35, seed, .4, true); gblob(g, x, y, R, R * ELL, c[1], .62, seed + 1, .4); gblob(g, x, y, R * .6, R * .6 * ELL, c[2], .5, seed + 2, .3);
    for (let k = 0; k < 3 + s * 2; k++) { const a = r() * 6.28, d = r() * R * .7, bi = x + Math.cos(a) * d, bj = y + Math.sin(a) * d * ELL, br = 1 + (r() < .4 ? 1 : 0); for (let q = 0; q < 8; q++) gpx(g, bi + Math.cos(q * .785) * br, bj + Math.sin(q * .785) * br, c[3], .8); gpx(g, bi - 1, bj - 1, '#ffffff', .8); }
    for (let k = 0; k < 4 * s; k++) { const a = r() * 6.28, d = R * (1.1 + r() * .7); gpx(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL, c[1], .7); }
    return [[x, y]];
  },
  // grass: green stain, tufts, scattered leaves
  grass(g, x, y, s, r, o) {
    const R = Math.round(9 * s), G = o.col || ['#1a4a26', '#3fb04a', '#7fe05a', '#c8f58a'], seed = (r() * 1e4) | 0, pts = [];
    gblob(g, x, y, R, R * ELL, G[0], .28, seed, .4, true);
    for (let k = 0; k < 6 + 4 * s; k++) { const i = x + (r() - .5) * R * 2, j = y + (r() - .5) * R * ELL * 2, h = 2 + Math.round(r() * 3); for (let q = 0; q < h; q++) { gpx(g, i + (q > 1 ? (k % 2 ? 1 : -1) : 0), j - q, q < h - 1 ? G[1] : G[2], .9); } pts.push([i, j]); }
    if (o.leaves !== false) for (let k = 0; k < 4 + 3 * s; k++) { const i = x + (r() - .5) * R * 2.4, j = y + (r() - .5) * R * 1.3, a = r() * 3.14, ca = Math.cos(a), sa = Math.sin(a); for (let q = -2; q <= 2; q++) gpx(g, i + ca * q, j + sa * q * .6, q === 0 ? G[3] : G[2], .9); gpx(g, i + ca * 3, j + sa * 2, G[0], .8); }
    return pts;
  },
  // etched rune circle (psychic, fairy moon, dragon, aura)
  rune(g, x, y, s, r, o) {
    const R = Math.round(11 * s), c = o.col || ['#6a1a58', '#ff6fc8', '#ffe2f4'], pts = [], n = o.sides || 5;
    for (let k = 0; k < R * 6; k++) { const a = k / (R * 6) * 6.28; gpx(g, x + Math.cos(a) * R, y + Math.sin(a) * R * ELL, c[1], .45); gpx(g, x + Math.cos(a) * (R - 2), y + Math.sin(a) * (R - 2) * ELL, c[0], .35); }
    for (let k = 0; k < n; k++) { const a0 = k / n * 6.28 - 1.57, a1 = ((k + 2) % n) / n * 6.28 - 1.57; gline(g, x + Math.cos(a0) * (R - 3), y + Math.sin(a0) * (R - 3) * ELL, x + Math.cos(a1) * (R - 3), y + Math.sin(a1) * (R - 3) * ELL, c[1], .4); pts.push([x + Math.cos(a0) * R, y + Math.sin(a0) * R * ELL]); }
    gblob(g, x, y, 2, 1, c[2], .5, 1, .1); return pts;
  },
  // shadow stain with creeping edges
  shade(g, x, y, s, r, o) {
    const R = Math.round(9 * s), c = o.col || ['#140e30', '#2d2068', '#5a3ac8'], seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 3, (R + 3) * ELL, c[2], .16, seed, .5, true); gblob(g, x, y, R, R * ELL, c[1], .5, seed + 1, .4); gblob(g, x, y, R * .6, R * .6 * ELL, c[0], .8, seed + 2, .3);
    for (let k = 0; k < 5; k++) { const a = r() * 6.28; for (let q = R * .8; q < R * 1.7; q++) gpx(g, x + Math.cos(a + q * .02) * q, y + Math.sin(a + q * .02) * q * ELL, c[1], .5 * (1 - (q - R * .8) / (R * .9))); }
    return [[x, y]];
  },
  // crater with a lit rim, radial cracks, left-over rocks
  crater(g, x, y, s, r, o) {
    const R = Math.round(9 * s), pal = o.rock || RAMP.ground, seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 4, (R + 4) * ELL, '#e7c27a', .12, seed, .4, true);
    gblob(g, x, y + 1, R + 1, (R + 1) * ELL, pal[2], .5, seed + 1, .3); gblob(g, x, y + 1, R, R * ELL, pal[5] || pal[4], .75, seed + 2, .28); gblob(g, x + 1, y + 1, R * .72, R * .72 * ELL, '#2a2218', .8, seed + 3, .25);
    for (let k = 0; k < R * 3; k++) { const a = 2.4 + k / (R * 3) * 2.5; gpx(g, x + Math.cos(a) * (R + 1), y + Math.sin(a) * (R + 1) * ELL, pal[0], .85); }   // sunlit rim, upper left
    for (let k = 0; k < 4 + s * 2; k++) { let i = x, j = y, a = r() * 6.28; for (let q = 0; q < R * 1.5; q++) { i += Math.cos(a); j += Math.sin(a) * ELL; a += (r() - .5) * .7; if (q > R * .6) gpx(g, i, j, '#2a2e38', .8 * (1 - q / (R * 1.6))); } }
    if (o.rocks) for (let k = 0; k < (o.rocks | 0); k++) { const a = r() * 6.28, d = R * (.4 + r() * 1.3); gchunk(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL, 2 + Math.round(r() * 2 * s), o.rock || RAMP.rock, k); }
    else for (let k = 0; k < 3 * s; k++) gpx(g, x + (r() - .5) * R * 3, y + (r() - .5) * R * 1.6, pal[1], .8);
    return [[x, y]];
  },
  // claw gouges: parallel curved scratches
  gouge(g, x, y, s, r, o) {
    const n = o.n || 3, L = Math.round(11 * s), ang = o.ang ?? (-.6 + (r() - .5) * .5), c = o.col || ['#2a2218', '#8a7448', '#e3cb92'], pts = [];
    for (const A of (o.cross ? [ang, ang + 1.5] : [ang])) for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * 3.2; let i = x - Math.cos(A) * L / 2 - Math.sin(A) * off, j = y - Math.sin(A) * L / 2 * ELL + Math.cos(A) * off * ELL;
      for (let q = 0; q < L; q++) { const t = q / L, bow = Math.sin(t * Math.PI) * 1.4, w = t < .25 ? 1 : 2; gpx(g, i + Math.cos(A) * q - Math.sin(A) * bow, j + Math.sin(A) * q * ELL + Math.cos(A) * bow * ELL, c[0], .9); if (w > 1) gpx(g, i + Math.cos(A) * q - Math.sin(A) * bow, j + Math.sin(A) * q * ELL + Math.cos(A) * bow * ELL + 1, c[0], .6); gpx(g, i + Math.cos(A) * q - Math.sin(A) * bow, j + Math.sin(A) * q * ELL + Math.cos(A) * bow * ELL - 1, c[2], .55); } pts.push([i + Math.cos(A) * L, j]); }
    for (let k = 0; k < 8; k++) gpx(g, x + (r() - .5) * L * 1.6, y + (r() - .5) * 8, c[1], .6);
    return pts;
  },
  skid(g, x, y, s, r, o) {   // motion scuffs
    const c = o.col || ['#2a2e38', '#8a8a96', '#d8d4c8'], L = Math.round(8 * s), a = o.ang ?? 0;
    for (let k = 0; k < 3; k++) { const j = y + (k - 1) * 2; for (let q = 0; q < L; q++) gpx(g, x + q * Math.cos(a) - L / 2, j + q * Math.sin(a) * .5, q % 3 ? c[0] : c[1], .35 * (1 - q / L * .6)); }
    for (let k = 0; k < 5; k++) gpx(g, x + (r() - .5) * L * 1.4, y + (r() - .5) * 6, c[2], .45); return [];
  },
  fissure(g, x, y, s, r, o) {   // long jagged crack, lit edge; lava option glows in the lingering part
    const L = Math.round(16 * s), pts = [], a0 = o.ang ?? (r() * 6.28), edge = o.edge || '#c99a4d';
    for (let k = 0; k < 2; k++) { let i = x, j = y, a = a0 + k * Math.PI; for (let q = 0; q < L; q++) { i += Math.cos(a); j += Math.sin(a) * ELL; a += (r() - .5) * .8; gpx(g, i, j, '#17151a', .95); gpx(g, i, j + 1, '#17151a', .6); gpx(g, i - 1, j - 1, edge, .5); if (q % 5 === 2) pts.push([i, j]);
      if (q > 3 && r() < .12) { let bi = i, bj = j, ba = a + (r() < .5 ? -1.1 : 1.1); for (let z = 0; z < L * .35; z++) { bi += Math.cos(ba); bj += Math.sin(ba) * ELL; ba += (r() - .5) * .8; gpx(g, bi, bj, '#17151a', .85); } } } }
    return pts;
  },
  sparkle(g, x, y, s, r, o) {
    const c = o.col || ['#c84a98', '#ff7ac8', '#ffd0ef', '#ffffff'], R = Math.round(9 * s), pts = [];
    gblob(g, x, y, R, R * ELL, c[1], .1, 7, .5, true);
    for (let k = 0; k < 9 * s + 3; k++) { const i = x + (r() - .5) * R * 2.3, j = y + (r() - .5) * R * 1.3, big = r() < .3; gpx(g, i, j, c[3], .95); if (big) { gpx(g, i - 1, j, c[2], .8); gpx(g, i + 1, j, c[2], .8); gpx(g, i, j - 1, c[2], .8); gpx(g, i, j + 1, c[2], .8); } else gpx(g, i + 1, j, c[1], .6); pts.push([i, j]); }
    return pts;
  },
  web(g, x, y, s, r, o) {
    const R = Math.round(10 * s), spokes = 8, c = '#f4f4f4';
    for (let k = 0; k < spokes; k++) { const a = k / spokes * 6.28; gline(g, x, y, x + Math.cos(a) * R, y + Math.sin(a) * R * ELL, c, .75); }
    for (const rr of [.3, .55, .8, 1]) for (let k = 0; k < spokes; k++) { const a0 = k / spokes * 6.28, a1 = (k + 1) / spokes * 6.28, sag = rr * .12; gline(g, x + Math.cos(a0) * R * rr, y + Math.sin(a0) * R * rr * ELL, x + Math.cos(a1) * R * (rr - sag), y + Math.sin(a1) * R * (rr - sag) * ELL, c, .5); }
    for (let k = 0; k < 4; k++) gpx(g, x + (r() - .5) * R * 1.6, y + (r() - .5) * R, '#bfe8ff', .9); return [[x, y]];
  },
  feather(g, x, y, s, r, o) {   // wind scuff with feathers
    const c = o.col || ['#a8c0f0', '#d7e6ff', '#ffffff'], R = Math.round(10 * s);
    for (let k = 0; k < 5 + s * 2; k++) { const a = r() * 6.28, L = R * (.6 + r() * .8); for (let q = 2; q < L; q++) gpx(g, x + Math.cos(a) * q, y + Math.sin(a) * q * ELL, '#8a8a96', .3 * (1 - q / L)); }
    for (let k = 0; k < 2 + Math.round(s * 1.5); k++) { const i = x + (r() - .5) * R * 2, j = y + (r() - .5) * R, a = r() * 3.14, ca = Math.cos(a), sa = Math.sin(a); for (let q = -4; q <= 4; q++) { gpx(g, i + ca * q, j + sa * q * .6, c[2], .95); if (Math.abs(q) < 3) { gpx(g, i + ca * q - sa, j + sa * q * .6 + ca * .6, c[1], .8); gpx(g, i + ca * q + sa, j + sa * q * .6 - ca * .6, c[0], .7); } } }
    return [];
  },
  bite(g, x, y, s, r, o) {   // two rows of tooth dents
    const w = Math.round(9 * s), c = o.col || ['#17151a', '#6a5a4a'];
    for (const row of [-1, 1]) for (let k = -3; k <= 3; k++) { const i = x + k * w / 3.2, j = y + row * (w * .3) + Math.abs(k) * .6 * -row; for (let q = 0; q < 3; q++) gpx(g, i, j + q * row, c[0], .85 - q * .2); gpx(g, i + 1, j, c[1], .6); }
    for (let k = 0; k < 8; k++) gpx(g, x + (r() - .5) * w * 2.4, y + (r() - .5) * w, c[1], .45); return [];
  },
  pins(g, x, y, s, r, o) {   // needle holes with a few stuck needles
    const c = o.col || ['#17151a', '#d8e872'];
    for (let k = 0; k < 4 + s * 3; k++) { const i = x + (r() - .5) * 20 * s, j = y + (r() - .5) * 10 * s; gpx(g, i, j, c[0], .9); gpx(g, i + 1, j, c[0], .6); if (r() < .35) { gpx(g, i, j - 1, c[1], .95); gpx(g, i, j - 2, c[1], .8); gpx(g, i, j - 3, '#ffffff', .8); } }
    return [];
  },
  mud(g, x, y, s, r, o) {
    const R = Math.round(8 * s), c = ['#3a2a18', '#6a4a24', '#9a7038', '#c99a4d'], seed = (r() * 1e4) | 0;
    gblob(g, x, y, R + 2, (R + 2) * ELL, c[0], .3, seed, .5, true); gblob(g, x, y, R, R * ELL, c[1], .72, seed + 1, .45); gblob(g, x - 1, y - 1, R * .55, R * .55 * ELL, c[2], .6, seed + 2, .4);
    for (let k = 0; k < 8 * s; k++) { const a = r() * 6.28, d = R * (.9 + r() * 1.1); gpx(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL, c[r() < .5 ? 1 : 2], .85); }
    return [];
  },
  powder(g, x, y, s, r, o) {
    const R = Math.round(11 * s), c = o.col || ['#c8a0ff', '#e6d0ff', '#ffffff']; for (let k = 0; k < 60 * s; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * R; gpx(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL, r() < .6 ? c[0] : c[1], .3 + r() * .3); } return [];
  },
  sonic(g, x, y, s, r, o) {
    const c = o.col || ['#56701a', '#b6d636', '#e0f58a']; for (let k = 0; k < 3; k++) { const R = 5 * s + k * 5 * s; for (let q = 0; q < R * 6; q++) { if ((q >> 2) % 3 === 0) continue; const a = q / (R * 6) * 6.28; gpx(g, x + Math.cos(a) * R, y + Math.sin(a) * R * ELL, c[k % 2 ? 1 : 0], .45 - k * .1); } } return [];
  },
  // single-purpose: a line of boulders / ice chunks left behind
  debris(g, x, y, s, r, o) { const n = o.n || 3; for (let k = 0; k < n; k++) { const a = r() * 6.28, d = r() * 11 * s; gchunk(g, x + Math.cos(a) * d, y + Math.sin(a) * d * ELL, 3 + Math.round(r() * 3 * s), o.pal || RAMP.rock, k); } return [[x, y]]; },
  spiral(g, x, y, s, r, o) { const c = o.col || ['#2a2218', '#c99a4d']; for (let k = 0; k < 90 * s; k++) { const a = k * .28, rr = k * .09 * s; gpx(g, x + Math.cos(a) * rr, y + Math.sin(a) * rr * ELL, c[0], .8); gpx(g, x + Math.cos(a) * rr - 1, y + Math.sin(a) * rr * ELL - 1, c[1], .4); } return [[x, y]]; }
};

/* ---------- lingering effects: they play under the Pokémon for a few seconds ---------- */
const GL = {
  // glowing cracks cooling, little flames, smoke
  embers(x, y, s, pts, o) {
    const life = 2600 + 900 * s, ramp = RAMP[o.ramp || 'fire'], flames = Math.min(5, Math.round((1 + s * 1.5) * gQual())), spots = pts.slice(0, 40);
    const fl = Array.from({ length: flames }, () => ({ dx: (Math.random() - .5) * 14 * s, dy: (Math.random() - .5) * 6 * s, ph: Math.random() * 9, life: .35 + Math.random() * .45 }));
    ent(life, (q, age) => {
      const i = bx(x), j = by(y), cool = 1 - q;
      bctx.globalCompositeOperation = 'lighter'; for (const [pi, pj] of spots) { const pulse = .55 + .45 * Math.sin(age / 130 + pi * .7); aRect(pi - OX, pj - OY, 1, 1, ramp[q < .5 ? 2 : 3], .9 * cool * pulse); if (q < .35) aRect(pi - OX - 1, pj - OY, 3, 1, ramp[3], .2 * cool); } bctx.globalCompositeOperation = 'source-over';
      for (const f of fl) { if (q > f.life) continue; const h = Math.max(2, Math.round((6 + 5 * s) * (1 - q / f.life))); flamePx(i + f.dx / 2, j + f.dy / 2, h, 2 + (s > 1.3 ? 1 : 0), age + f.ph * 100, ramp, 1 - q / f.life); }
      if (q < .7 && Math.random() < .22 * gQual()) P(x + (Math.random() - .5) * 16 * s, y + (Math.random() - .5) * 6, { vy: -26 - Math.random() * 20, vx: (Math.random() - .5) * 14, life: 1100, ramp: 'smoke', shape: 'disc', size: 1, size2: 3 + s, drag: .3 });
      if (q < .4 && Math.random() < .12) P(x + (Math.random() - .5) * 14 * s, y, { vy: -90 - Math.random() * 50, vx: (Math.random() - .5) * 40, g: 120, life: 700, ramp, size: 1, add: true });
    }, { under: true });
  },
  ripples(x, y, s, pts, o) {
    const life = 3200 + 500 * s, col = o.col || ['#ffffff', '#d8f4ff', '#8fd4ff'];
    ent(life, (q, age) => { const i = bx(x), j = by(y); for (let k = 0; k < 3; k++) { const t = ((age / 1000) * .55 + k / 3) % 1; if (age / 1000 * .55 > k / 3 + 1.6) continue; const R = (3 + t * 12 * s), a = (1 - t) * (1 - q) * .7; aRing(i, j, R, R * ELL, col[t < .5 ? 1 : 2], a, 1); }
      if (Math.random() < .12) { const a = Math.random() * 6.28, d = Math.random() * 7 * s; aRect(i + Math.cos(a) * d, j + Math.sin(a) * d * ELL - 1, 1, 1, '#ffffff', .85 * (1 - q)); } }, { under: true });
    emit(x, y - 4, Math.round(6 * s * gQual()), { ang: -Math.PI / 2, spread: 1.6, speed: [60, 130], g: 520, life: [380, 620], ramp: 'water', shape: 'drop', size: 1 });
  },
  frostglint(x, y, s, pts, o) {
    const life = 3000 + 600 * s, spots = pts.slice(0, 16), ramp = RAMP[o.ramp || 'ice'];
    ent(life, (q, age) => { for (let k = 0; k < spots.length; k++) { const tw = Math.sin(age / 210 + k * 2.3); if (tw < .55) continue; const i = spots[k][0] - OX, j = spots[k][1] - OY; bctx.globalCompositeOperation = 'lighter'; aRect(i - 1, j, 3, 1, ramp[0], .9 * (1 - q)); aRect(i, j - 1, 1, 3, ramp[0], .9 * (1 - q)); bctx.globalCompositeOperation = 'source-over'; }
      if (q < .7 && Math.random() < .2 * gQual()) P(x + (Math.random() - .5) * 18 * s, y + (Math.random() - .5) * 6, { vy: -12, vx: (Math.random() - .5) * 10, life: 1200, ramp: 'ice', shape: 'disc', size: 1, size2: 3, drag: .2 }); }, { under: true });
    emit(x, y - 2, Math.round(7 * s * gQual()), { speed: [40, 120], ang: -Math.PI / 2, spread: 2.2, life: [500, 900], ramp: 'ice', shape: 'star', size: 1, add: true, g: 80 });
  },
  arcs(x, y, s, pts, o) {
    const life = 1500 + 300 * s, spots = pts.slice(0, 20);
    ent(life, (q, age) => { const i = bx(x), j = by(y); if (Math.random() < .55 * (1 - q)) { const p = spots.length ? spots[(Math.random() * spots.length) | 0] : [x / 2, y / 2]; const pi = spots.length ? p[0] - OX : i, pj = spots.length ? p[1] - OY : j; bctx.globalCompositeOperation = 'lighter'; zig(i, j, pi, pj, '#ffd52a', 1, 2, '#ffffff'); bctx.globalCompositeOperation = 'source-over'; }
      for (const p of spots) if (Math.random() < .05 * (1 - q)) aRect(p[0] - OX - 1, p[1] - OY - 1, 3, 3, '#fff07a', .8 * (1 - q)); }, { under: true });
  },
  bubbles(x, y, s, pts, o) {
    const life = 3500 + 400 * s, ramp = RAMP[o.ramp || 'poison'];
    ent(life, (q, age) => { if (q < .8 && Math.random() < .14 * gQual() * s) { const a = Math.random() * 6.28, d = Math.random() * 7 * s; P(x + Math.cos(a) * d * 2, y + Math.sin(a) * d * ELL * 2, { vy: -22, life: 700, ramp, shape: 'bubble', size: 1, size2: 3 }); }
      if (q < .6 && Math.random() < .05) P(x + (Math.random() - .5) * 14 * s, y - 2, { vy: -40, vx: (Math.random() - .5) * 10, life: 1300, ramp: 'smoke', shape: 'disc', size: 1, size2: 3, color: ramp[2], drag: .3 }); }, { under: true });
  },
  sprouts(x, y, s, pts, o) {   // blades pop up out of the ground, leaves drift down
    const life = 2200, G = o.col || ['#1a4a26', '#3fb04a', '#7fe05a', '#c8f58a'], spots = pts.slice(0, 14);
    ent(life, (q, age) => { const grow = Math.min(1, age / 500), a = q > .75 ? (1 - q) / .25 : 1; for (const [pi, pj] of spots) { const h = Math.round(5 * grow * (1 + Math.sin(age / 400 + pi) * .1)); for (let k = 0; k < h; k++) aRect(pi - OX + Math.sin(k * .5 + age / 500) * (k / 3), pj - OY - k, 1, 1, k > h - 2 ? G[3] : G[1], a); } }, { under: true });
    emit(x, y - 20, Math.round(8 * s * gQual()), { r: 18, speed: [10, 40], vy: 20, g: 40, life: [900, 1500], ramp: 'grass', shape: 'leaf', size: 1, spin: 4, drag: .6 });
  },
  runeglow(x, y, s, pts, o) {
    const life = 2400, c = o.col || ['#6a1a58', '#ff6fc8', '#ffe2f4'], R = 11 * s / 2;
    ent(life, (q, age) => { const i = bx(x), j = by(y), a = (q < .15 ? q / .15 : 1 - (q - .15) / .85) * .9; bctx.globalCompositeOperation = 'lighter'; aRing(i, j, R, R * ELL, c[1], a, 1); aRing(i, j, R - 1, (R - 1) * ELL, c[2], a * .6, 1);
      for (let k = 0; k < pts.length; k++) { const p = pts[k], t = age / 400 + k; aRect(p[0] - OX - 1, p[1] - OY - 1, 3, 3, c[1], a * (.4 + .4 * Math.sin(t))); } bctx.globalCompositeOperation = 'source-over';
      if (Math.random() < .3 * gQual()) P(x + (Math.random() - .5) * R * 4, y + (Math.random() - .5) * R, { vy: -30, life: 900, color: c[2], size: 1, add: true }); }, { under: true });
  },
  wisps(x, y, s, pts, o) {
    const life = 2600, ramp = RAMP[o.ramp || 'ghost'];
    ent(life, (q, age) => { if (q < .75 && Math.random() < .2 * gQual()) P(x + (Math.random() - .5) * 16 * s, y + (Math.random() - .5) * 5, { vy: -30 - Math.random() * 20, vx: Math.sin(age / 300) * 12, life: 1100, ramp, shape: 'disc', size: 1, size2: 3, add: Math.random() < .4 }); }, { under: true });
  },
  dust(x, y, s, pts, o) {   // dust billows then settles; pebbles hop
    const col = o.dust || 'dust';
    for (let k = 0; k < Math.round(7 * s * gQual()); k++) { const a = Math.random() * 6.28; P(x + Math.cos(a) * 6, y + Math.sin(a) * 3, { vx: Math.cos(a) * rnd2(20, 70) * s, vy: Math.sin(a) * rnd2(6, 20) - 14, life: rnd2(700, 1200), ramp: col, shape: 'disc', size: 2, size2: 5 + s * 2, drag: 1.4 }); }
    for (let k = 0; k < Math.round(5 * s * gQual()); k++) P(x, y - 4, { vx: rnd2(-90, 90), vy: rnd2(-200, -110), g: 760, life: 700, ramp: o.rockRamp || 'rock', size: [1, 2][k % 2], size2: 1 });
    ent(1500, q => { if (q < .6) { const i = bx(x), j = by(y); bctx.globalCompositeOperation = 'lighter'; aEllFill(i, j, 10 * s * (1 + q), 5 * s * (1 + q), '#e8dcc0', .09 * (1 - q / .6)); bctx.globalCompositeOperation = 'source-over'; } }, { under: true });
  },
  sparks(x, y, s, pts, o) {
    const ramp = o.ramp || 'steel';
    emit(x, y - 2, Math.round(10 * s * gQual()), { speed: [90, 260], ang: -Math.PI / 2, spread: 2.4, g: 520, life: [260, 560], ramp, size: [1, 2], size2: 1, add: true });
    ent(700, (q, age) => { for (const p of pts.slice(0, 8)) if (Math.random() < .25 * (1 - q)) { bctx.globalCompositeOperation = 'lighter'; aRect(p[0] - OX - 1, p[1] - OY, 3, 1, '#ffffff', .8); aRect(p[0] - OX, p[1] - OY - 1, 1, 3, '#ffffff', .8); bctx.globalCompositeOperation = 'source-over'; } }, { under: true });
  },
  glitter(x, y, s, pts, o) {
    const life = 3000, c = o.col || ['#c84a98', '#ff7ac8', '#ffd0ef', '#ffffff'], spots = pts.slice(0, 24);
    ent(life, (q, age) => { for (let k = 0; k < spots.length; k++) { const tw = Math.sin(age / 180 + k * 1.9); if (tw < .35) continue; const i = spots[k][0] - OX, j = spots[k][1] - OY - age / 400; bctx.globalCompositeOperation = 'lighter'; aRect(i - 1, j, 3, 1, c[2], .9 * (1 - q)); aRect(i, j - 1, 1, 3, c[3], .9 * (1 - q)); bctx.globalCompositeOperation = 'source-over'; } }, { under: true });
    emit(x, y - 6, Math.round(8 * s * gQual()), { r: 16, speed: [8, 30], ang: -Math.PI / 2, spread: 1, life: [900, 1600], ramp: 'fairy', shape: 'star', size: 1, add: true });
  },
  feathers(x, y, s, pts, o) { emit(x, y - 40, Math.round((3 + s * 2) * gQual()), { r: 22, speed: [4, 20], vy: 20, g: 14, drag: .8, life: [1800, 2800], ramp: 'flying', shape: 'feather', size: 1, spin: 2 }); },
  snow(x, y, s, pts, o) { GL.frostglint(x, y, s, pts, o); emit(x, y - 60, Math.round(10 * s * gQual()), { r: 40, speed: [4, 18], vy: 24, g: 6, drag: .9, life: [1600, 2600], color: '#ffffff', shape: 'star', size: 1 }); }
};

/* ---------- per-move choice: [decal, size, options, lingering effect] ---------- */
const GPAL = {
  fire: null, dragon: ['#14102a', '#241c46', '#3a2f6a', '#6a5ab0'], steel: ['#1c2026', '#363e48', '#66717e', '#a8b4c2'], green: ['#10201a', '#1f3a26', '#2f5a38', '#4a8048'], blue: ['#10182a', '#1c2a4a', '#2a4a8a', '#5a8ae0'],
  normal: ['#1c1a1a', '#34302c', '#5a5248', '#8a8070']
};
const GM = {
  // Normal
  'Tackle': ['crater', .55, { rocks: 0 }, 'dust'], 'Quick Attack': ['skid', 1.1, {}, 'dust'], 'Extreme Speed': ['skid', 1.4, { col: ['#6a4a10', '#c8a040', '#fff3b0'] }, 'glitter'], 'Body Slam': ['crater', 1.15, { rocks: 2 }, 'dust'], 'Headbutt': ['crater', .75, {}, 'dust'],
  'Slash': ['gouge', 1, {}, 'sparks'], 'Double-Edge': ['crater', 1.35, { rocks: 3 }, 'dust'], 'Swift': ['sparkle', .8, { col: ['#a8761a', '#ffd23f', '#fff3b0', '#ffffff'] }, 'glitter'], 'Hyper Beam': ['char', 1.9, { pal: GPAL.normal }, 'embers'],
  // Fire
  'Ember': ['char', .6, {}, 'embers'], 'Flamethrower': ['char', 1.0, {}, 'embers'], 'Fire Blast': ['char', 1.8, {}, 'embers'], 'Fire Punch': ['char', .85, {}, 'embers'], 'Flare Blitz': ['char', 1.5, {}, 'embers'], 'Will-O-Wisp': ['char', .6, { pal: GPAL.blue, ramp: 'blueFire' }, 'embers'],
  // Water
  'Water Gun': ['wet', .7, {}, 'ripples'], 'Bubble Beam': ['wet', .85, { col: ['#2c4258', '#6a9ac6', '#bfe8ff', '#ffffff'] }, 'ripples'], 'Surf': ['wet', 1.9, {}, 'ripples'], 'Hydro Pump': ['wet', 1.45, {}, 'ripples'],
  'Scald': ['wet', 1.1, { col: ['#3a4a5a', '#7aaed0', '#d8f4ff', '#ffffff'] }, 'ripples'], 'Aqua Jet': ['wet', .8, {}, 'ripples'], 'Waterfall': ['wet', 1.5, {}, 'ripples'], 'Crabhammer': ['crater', .9, { rocks: 2 }, 'ripples'],
  // Grass
  'Vine Whip': ['gouge', .9, { n: 2, col: ['#17301c', '#3fb04a', '#c8f58a'] }, 'sprouts'], 'Razor Leaf': ['grass', 1.1, {}, 'sprouts'], 'Seed Bomb': ['grass', .9, { leaves: false }, 'sprouts'], 'Giga Drain': ['grass', .9, { col: ['#1a4a26', '#5ee08a', '#a8ffc0', '#e8ffef'] }, 'sprouts'],
  'Energy Ball': ['char', 1.0, { pal: GPAL.green }, 'sprouts'], 'Leaf Storm': ['grass', 1.8, {}, 'sprouts'], 'Sleep Powder': ['powder', 1.2, { col: ['#e8a0ff', '#f6d8ff', '#ffffff'] }, 'wisps'], 'Stun Spore': ['powder', 1.2, { col: ['#e8d040', '#fff07a', '#ffffff'] }, 'wisps'],
  // Electric
  'Thunder Shock': ['volt', .65, {}, 'arcs'], 'Thunderbolt': ['volt', 1.1, {}, 'arcs'], 'Thunder': ['volt', 1.7, {}, 'arcs'], 'Thunder Punch': ['volt', .9, {}, 'arcs'], 'Volt Tackle': ['volt', 1.3, {}, 'arcs'], 'Thunder Wave': ['volt', .6, {}, 'arcs'],
  // Ice
  'Ice Shard': ['frost', .65, {}, 'frostglint'], 'Ice Punch': ['frost', .9, {}, 'frostglint'], 'Aurora Beam': ['frost', 1.0, { col: ['#6a5ab0', '#a0d8ff', '#d0b0ff', '#ffffff'] }, 'frostglint', { ramp: 'aurora' }], 'Ice Beam': ['frost', 1.1, {}, 'frostglint'], 'Blizzard': ['frost', 2.0, {}, 'snow'],
  // Fighting
  'Mach Punch': ['skid', 1.1, {}, 'dust'], 'Karate Chop': ['crater', .65, {}, 'dust'], 'Brick Break': ['crater', 1.1, { rocks: 4, rock: RAMP.dust }, 'dust'], 'Cross Chop': ['gouge', 1, { cross: true, n: 2 }, 'sparks'], 'Close Combat': ['crater', 1.5, { rocks: 3 }, 'dust'], 'Aura Sphere': ['rune', .8, { col: ['#1c3a6a', '#5aa6ff', '#d8f0ff'], sides: 6 }, 'runeglow'], 'Bulk Up': null,
  // Poison
  'Poison Sting': ['sludge', .5, {}, 'bubbles'], 'Poison Jab': ['sludge', .8, {}, 'bubbles'], 'Sludge Bomb': ['sludge', 1.4, {}, 'bubbles'], 'Gunk Shot': ['sludge', 1.9, {}, 'bubbles'], 'Toxic': ['sludge', .9, {}, 'bubbles'],
  // Ground
  'Mud Shot': ['mud', .9, {}, 'dust'], 'Dig': ['crater', 1.15, { rocks: 3 }, 'dust'], 'Drill Run': ['spiral', 1.0, {}, 'dust'], 'Earth Power': ['fissure', 1.6, { edge: '#ffb347', glow: true }, 'embers', { ramp: 'fire' }], 'Earthquake': ['fissure', 1.7, {}, 'dust'],
  // Flying
  'Peck': ['feather', .6, {}, 'feathers'], 'Wing Attack': ['feather', .9, {}, 'feathers'], 'Aerial Ace': ['feather', .8, {}, 'feathers'], 'Air Slash': ['gouge', 1.0, { n: 2, col: ['#4a5a8a', '#a8c0f0', '#ffffff'] }, 'feathers'], 'Drill Peck': ['spiral', .8, { col: ['#2a2e38', '#d7e6ff'] }, 'feathers'], 'Brave Bird': ['crater', 1.3, { rocks: 2 }, 'feathers'], 'Hurricane': ['feather', 1.9, {}, 'feathers'],
  // Psychic
  'Confusion': ['rune', .8, {}, 'runeglow'], 'Psybeam': ['rune', .9, {}, 'runeglow'], 'Psychic': ['rune', 1.5, { sides: 7 }, 'runeglow'], 'Zen Headbutt': ['rune', .85, { sides: 6 }, 'runeglow'], 'Hypnosis': ['rune', .8, { sides: 3 }, 'runeglow'],
  // Bug
  'Bug Bite': ['bite', .7, { col: ['#2a3a0e', '#b6d636'] }, 'bubbles', { ramp: 'bug' }], 'X-Scissor': ['gouge', 1.05, { cross: true, n: 2, col: ['#2a3a0e', '#86a82a', '#e0f58a'] }, 'sparks', { ramp: 'bug' }], 'Leech Life': ['grass', .6, { col: ['#2a3a0e', '#86a82a', '#b6d636', '#e0f58a'], leaves: false }, 'sprouts'],
  'Pin Missile': ['pins', 1, {}, 'dust'], 'Signal Beam': ['char', 1.0, { pal: ['#1a2a0e', '#2a3a1a', '#56701a', '#b6d636'] }, 'embers', { ramp: 'bug' }], 'Bug Buzz': ['sonic', 1.4, {}, 'dust'], 'String Shot': ['web', 1.1, {}, 'frostglint', { ramp: 'normal' }],
  // Ghost
  'Lick': ['sludge', .7, { col: ['#140e30', '#3a2a8a', '#8c6bff', '#e6dcff'] }, 'wisps'], 'Shadow Claw': ['gouge', 1.0, { col: ['#140e30', '#5a3ac8', '#b9a4ff'] }, 'wisps'], 'Shadow Ball': ['shade', 1.2, {}, 'wisps'], 'Night Shade': ['shade', 1.0, {}, 'wisps'], 'Confuse Ray': ['shade', .7, {}, 'wisps'],
  // Dragon
  'Dragon Breath': ['char', 1.0, { pal: GPAL.dragon, ramp: 'dragon' }, 'embers'], 'Dragon Claw': ['gouge', 1.1, { col: ['#14102a', '#4a3ad0', '#a99bff'] }, 'sparks', { ramp: 'dragon' }], 'Dragon Pulse': ['rune', 1.3, { col: ['#24187a', '#7d6bff', '#e5e0ff'], sides: 5 }, 'runeglow'], 'Outrage': ['char', 1.6, { pal: GPAL.dragon, ramp: 'dragon' }, 'embers'],
  // Steel
  'Metal Claw': ['gouge', 1, { col: ['#1c2026', '#9aaabb', '#ffffff'] }, 'sparks'], 'Flash Cannon': ['char', 1.3, { pal: GPAL.steel, ramp: 'steel' }, 'sparks'], 'Iron Tail': ['crater', 1.0, { rocks: 2, rock: RAMP.steel }, 'sparks'],
  // Rock
  'Rock Throw': ['crater', .8, { rocks: 4, rock: RAMP.rock }, 'dust'], 'Rock Slide': ['crater', 1.0, { rocks: 6, rock: RAMP.rock }, 'dust'], 'Stone Edge': ['debris', 1.2, { n: 5, pal: RAMP.rock }, 'dust'],
  // Fairy
  'Fairy Wind': ['sparkle', .9, {}, 'glitter'], 'Dazzling Gleam': ['sparkle', 1.6, {}, 'glitter'], 'Moonblast': ['rune', 1.2, { sides: 4 }, 'runeglow'], 'Play Rough': ['crater', .8, {}, 'glitter'],
  // Dark
  'Bite': ['bite', .9, {}, 'wisps', { ramp: 'dark' }], 'Crunch': ['bite', 1.25, {}, 'wisps', { ramp: 'dark' }]
};
const GTYPE = { Normal: ['crater', .8, {}, 'dust'], Fire: ['char', 1, {}, 'embers'], Water: ['wet', 1, {}, 'ripples'], Grass: ['grass', 1, {}, 'sprouts'], Electric: ['volt', 1, {}, 'arcs'], Ice: ['frost', 1, {}, 'frostglint'], Fighting: ['crater', .9, {}, 'dust'], Poison: ['sludge', 1, {}, 'bubbles'], Ground: ['crater', 1, { rocks: 3 }, 'dust'], Flying: ['feather', 1, {}, 'feathers'], Psychic: ['rune', 1, {}, 'runeglow'], Bug: ['pins', 1, {}, 'dust'], Ghost: ['shade', 1, {}, 'wisps'], Dragon: ['char', 1, { pal: GPAL.dragon, ramp: 'dragon' }, 'embers'], Steel: ['gouge', 1, { col: ['#1c2026', '#9aaabb', '#ffffff'] }, 'sparks'], Rock: ['crater', 1, { rocks: 4 }, 'dust'], Fairy: ['sparkle', 1, {}, 'glitter'], Dark: ['bite', 1, {}, 'wisps'] };
function groundStyleOf(mv) { return GM[mv.name] || GTYPE[mv.type] || GTYPE.Normal; }

/* ---------- stamping ---------- */
function groundStamp(style, size, wx, wy, extra = {}) {
  if (!scarCtx || !style) return;
  const [kind, sz, opts, linger, lopts] = style, o = Object.assign({}, opts, extra), g = scarCtx, r = mulberry((Math.random() * 1e9) | 0), gx = Math.round(ax(wx)), gy = Math.round(ay(wy));
  if (gx < 4 || gy < 4 || gx > ART_W - 4 || gy > ART_H - 4) return;
  const s = clamp(sz * size, .45, 2.4); let pts = [];
  try { pts = (GP[kind] || GP.crater)(g, gx, gy, s, r, o) || []; } catch (e) { console.error(e); }
  g.globalAlpha = 1;
  if (o.glow && !extra.noLinger) { /* lava-lit cracks are shown by the lingering embers */ }
  if (extra.noLinger || !linger || GR.live >= 22) return;
  GR.live++; const f = GL[linger]; if (!f) { GR.live--; return; }
  const lo = Object.assign({}, lopts || {}, o.ramp ? { ramp: o.ramp } : {}, o.col && linger !== 'embers' ? { col: o.col } : {});
  try { f(wx, wy, s, pts, lo); } catch (e) { console.error(e); }
  setTimeoutGame(900 + 1200 * s, () => { GR.live = Math.max(0, GR.live - 1); });
}
// a beam leaves a trail of the move's mark from the user to the target
function groundLine(style, size, x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.min(9, Math.round(d / 55)));
  for (let k = 1; k <= n; k++) { const t = k / n, last = k === n, jx = (Math.random() - .5) * 8, jy = (Math.random() - .5) * 4;
    groundStamp(style, size * (last ? 1 : .55 + .15 * (k % 2)), x0 + (x1 - x0) * t + jx, y0 + (y1 - y0) * t + jy, { noLinger: !last && k % 3 !== 0, ang: Math.atan2(y1 - y0, x1 - x0) }); }
}
// what a damaging hit leaves, chosen by the move and how it was delivered
function groundHit(S, mv, eff, crit) {
  const sd = side(S), src = side(other(S)), st = groundStyleOf(mv); if (!st) return;
  const size = clamp(.65 + (mv.pow || 50) / 160, .6, 1.5) * (crit ? 1.2 : 1) * (eff > 1 ? 1.1 : eff < 1 ? .85 : 1);
  if (mv.anim === 'beam') groundLine(st, size, src.x + src.face * 24, src.y + 2, sd.x, sd.y + 2);
  else if (mv.anim === 'wave' || mv.anim === 'quake') { const n = 4, ang = Math.atan2(sd.y - src.y, sd.x - src.x); for (let k = 1; k <= n; k++) { const t = k / n, a = ang + (Math.random() - .5) * .5; groundStamp(st, size * (.5 + t * .5), src.x + (sd.x - src.x) * t + (Math.random() - .5) * 20, src.y + (sd.y - src.y) * t + (Math.random() - .5) * 14, { ang: a, noLinger: k < n - 1 }); } }
  else if (['dash', 'contact'].includes(mv.anim) && (st[0] === 'skid')) { groundStamp(st, size, (src.x + sd.x) / 2, (src.y + sd.y) / 2, { ang: Math.atan2(sd.y - src.y, sd.x - src.x) }); groundStamp(['crater', .6, { rocks: 0 }, 'dust'], size, sd.x, sd.y + 2); }
  else groundStamp(st, size, sd.x + (Math.random() - .5) * 12, sd.y + 2 + (Math.random() - .5) * 4);
}
// ground strikes (Thunder, Rock Slide, Blizzard, Psychic…) mark where they land, hit or miss
function groundMark(mk) {
  const st = groundStyleOf(mk.mv), size = clamp(.7 + (mk.r || 60) / 110, .8, 1.7);
  if (mk.mv.name === 'Rock Slide') { for (let k = 0; k < 4; k++) groundStamp(st, .55, mk.x + (Math.random() - .5) * 60, mk.y + (Math.random() - .5) * 22, { noLinger: k > 0, rocks: 3 }); return; }
  if (mk.mv.name === 'Thunder') { groundStamp(st, size, mk.x, mk.y + 2); for (let k = 0; k < 2; k++) groundStamp(GM['Thunder Shock'], .8, mk.x + (Math.random() - .5) * 40, mk.y + (Math.random() - .5) * 14, { noLinger: true }); return; }
  groundStamp(st, size, mk.x, mk.y + 2);
}

/* ---------- hooks: replace the old single-kind scars ---------- */
function groundScar(kind, x, y, extra) {            // called by addScar() in render.js
  if (!scarCtx) return;
  if (GCTX.mode === 'central' && kind !== 'trail') return;   // the move's own mark is stamped separately
  const mv = GCTX.mv;
  if (kind === 'trail') {
    const st = mv ? groundStyleOf(mv) : null, k = st ? st[0] : 'skid';
    if (['char', 'volt', 'wet', 'frost', 'sludge', 'grass'].includes(k)) return groundStamp([k, .32, st[2], null], 1, x, y, { noLinger: true });
    return groundStamp(['skid', .55, {}, null], 1, x, y, { noLinger: true });
  }
  if (mv) { const st = groundStyleOf(mv); return groundStamp([st[0], st[1] * .6, st[2], null], 1, x, y, { noLinger: true }); }
  const c = (extra && extra.color) || '';
  if (kind === 'crack') return groundStamp(['fissure', .5, {}, null], 1, x, y, { noLinger: true });
  if (kind === 'splat') { const n = parseInt(c.slice(1), 16) || 0, R = n >> 16 & 255, G = n >> 8 & 255, B = n & 255; return groundStamp([B > R + 20 && B > G ? 'wet' : R > G + 20 && B > G ? 'sludge' : 'mud', .6, {}, null], 1, x, y, { noLinger: true }); }
  return groundStamp(['char', .6, {}, null], 1, x, y, { noLinger: true });
}
(function hookVFX() {
  const wrap = (name, mode, after) => { const orig = VFX[name]; if (typeof orig !== 'function') return; VFX[name] = function (...a) { const mv = name === 'hit' ? a[1] : name === 'markFire' ? a[0].mv : name === 'explode' || name === 'impactAt' ? a[2] : name === 'dashFx' ? a[1] : name === 'moveImpact' ? a[1] : null; const pm = GCTX.mv, pmode = GCTX.mode; GCTX.mv = mv || null; GCTX.mode = mode; try { return orig.apply(this, a); } finally { GCTX.mv = pm; GCTX.mode = pmode; if (after) try { after(...a); } catch (e) { console.error(e); } } }; };
  wrap('hit', 'central', (S, mv, dmg, eff, crit) => groundHit(S, mv, eff, crit));
  wrap('markFire', 'central', mk => groundMark(mk));
  wrap('explode', 'central', (x, y, mv) => groundStamp(groundStyleOf(mv), clamp(.8 + (mv.pow || 60) / 130, .9, 1.7), x, y + 30));
  wrap('impactAt', 'central', null);
  wrap('dashFx', 'styled', null); wrap('moveImpact', 'central', null);
  const er = VFX.erupt; VFX.erupt = function (x, y) { const r = er.apply(this, arguments); groundStamp(['crater', 1.0, { rocks: 4 }, 'dust'], 1, x, y + 2); return r; };
})();
