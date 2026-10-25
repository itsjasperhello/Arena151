/* =====================================================================
   Section 20: what a move leaves behind on the stage
   Every hit, strike and blast stamps a mark chosen by the MOVE (not just its type):
     Flamethrower   a charred line with glowing cracks that cool, plus little flames and smoke
     Hydro Pump     a wet streak and puddles whose ripples spread
     Ice Beam       a frozen line of frost crystals that glint
     Thunder        a branching burn, fused glass and crackling arcs
     Earthquake     fissures; Earth Power's fissures glow like lava
     Rock Slide     boulders;  Slash / claws  gouges;  Bite  tooth marks;  String Shot  a web, and so on.
   Each mark is painted once as a smooth, soft, high-resolution picture (see hdfx.js), kept in a
   short list and drawn under the Pokémon with a gentle fade-in and fade-out, so the arena never
   fills up and the Pokémon stay easy to see. A lingering animated effect (embers cooling,
   ripples, frost glints, bubbles popping, dust settling, sparks, glitter, feathers) plays on top
   for a few seconds while the mark settles.
   ===================================================================== */
const GCTX = { mv: null, mode: '' };          // which move is being drawn right now; mode 'central' = this file stamps, legacy calls are ignored
const GR = { live: 0 };
const gQual = () => { const S = window.SETTINGS; return (S && S.quality && S.quality !== 'high') ? .5 : 1; };
const TAU = Math.PI * 2, GK = 3, GMAX = 20, GLIFE = 8200, GALPHA = .62;     // pixels per art pixel in a decal picture, most decals at once, how long one lasts (ms), overall opacity
const GDECALS = [];
const grgba = (c, a) => rgbaStr(c, a);
function gsoft(g, x, y, rx, ry, col, a, hard = .5, rot = 0) {   // soft ellipse: strongest in the middle, fading to nothing
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, grgba(col, a)); gr.addColorStop(hard, grgba(col, a * .8)); gr.addColorStop(1, grgba(col, 0));
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(Math.max(.3, rx), Math.max(.3, ry)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
}
function gblob(g, x, y, rx, ry, col, a, r, rough = .22) {         // irregular smooth shape with a solid colour
  const n = 13, pts = []; for (let k = 0; k < n; k++) { const t = k / n * TAU, m = 1 + (r() - .5) * rough * 2; pts.push([x + Math.cos(t) * rx * m, y + Math.sin(t) * ry * m]); }
  g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (let k = 0; k < n; k++) { const p = pts[k], q = pts[(k + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } g.fill(); g.globalAlpha = 1;
}
function gpath(g, pts, col, a, w) { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0], pts[k][1]); g.stroke(); g.globalAlpha = 1; }
function gwalk(x, y, a, len, r, wob = .5, step = 1.4) { const pts = [[x, y]]; for (let q = 0; q < len; q += step) { a += (r() - .5) * wob; x += Math.cos(a) * step; y += Math.sin(a) * step * ELL; pts.push([x, y]); } return pts; }
function gdot(g, x, y, rad, col, a) { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); g.globalAlpha = 1; }
function gchunk(g, x, y, sz, pal, r) {   // small rock lit from the top left
  const pts = []; for (let k = 0; k < 6; k++) { const t = k / 6 * TAU, m = .75 + r() * .45; pts.push([x + Math.cos(t) * sz * m, y + Math.sin(t) * sz * m * .8]); }
  g.fillStyle = pal[2]; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
  g.fillStyle = pal[0]; g.globalAlpha = .75; g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(pts[4][0], pts[4][1]); g.lineTo(pts[5][0], pts[5][1]); g.lineTo(pts[0][0], pts[0][1]); g.lineTo(x, y); g.closePath(); g.fill(); g.globalAlpha = 1;
}
const ELL = .55;                                   // the ground is seen at an angle: circles are flattened

/* ---------- decal painters: (ctx, size, rng, options) paint around (0, 0) and return hot points for the lingering effect ---------- */
const GP = {
  // charred ground with soot streaks and cracks; pal can recolour it (dragon, steel, grass-green…)
  char(g, s, r, o) {
    const R = 7 * s, P = o.pal || ['#17141a', '#26211f', '#43362c', '#66503c'], pts = [];
    gsoft(g, 0, 0, R * 1.7, R * 1.7 * ELL, P[3], .32, .4); gblob(g, 0, 0, R, R * ELL, P[2], .42, r, .3); gblob(g, 0, 0, R * .68, R * .68 * ELL, P[1], .62, r, .3); gblob(g, 0, 0, R * .36, R * .36 * ELL, P[0], .8, r, .25);
    for (let k = 0; k < 6 + 3 * s; k++) { const a = r() * TAU, L = R * (1.1 + r() * .8), c0 = R * .5; const gr = g.createLinearGradient(Math.cos(a) * c0, Math.sin(a) * c0 * ELL, Math.cos(a) * L, Math.sin(a) * L * ELL); gr.addColorStop(0, grgba(P[1], .5)); gr.addColorStop(1, grgba(P[1], 0)); g.strokeStyle = gr; g.lineWidth = .5 + r() * .5; g.beginPath(); g.moveTo(Math.cos(a) * c0, Math.sin(a) * c0 * ELL); g.lineTo(Math.cos(a) * L, Math.sin(a) * L * ELL); g.stroke(); }
    for (let k = 0; k < 3 + 2 * s; k++) { const w = gwalk(0, 0, r() * TAU, R * .95, r, .9); gpath(g, w, P[0], .85, .55); for (let q = 2; q < w.length; q += 3) pts.push(w[q]); }
    return pts;
  },
  // puddle: dark wet ring, glossy body, highlights and flung droplets
  wet(g, s, r, o) {
    const R = 8 * s, c = o.col || ['#2c4258', '#4c7aa6', '#7fb6dc', '#e2f6ff'];
    gsoft(g, 0, 0, R * 1.5, R * 1.5 * ELL, c[0], .34, .5); gblob(g, 0, 0, R, R * ELL, c[1], .52, r, .22); gsoft(g, -R * .15, -R * .1, R * .6, R * .6 * ELL, c[2], .5, .3);
    g.strokeStyle = c[3]; g.lineCap = 'round'; for (let k = 0; k < 2; k++) { g.globalAlpha = .65; g.lineWidth = .6; g.beginPath(); g.ellipse(0, 0, R * (.45 + k * .22), R * (.45 + k * .22) * ELL, 0, 3.5 + k * .3, 4.5 + k * .2); g.stroke(); } g.globalAlpha = 1;
    for (let k = 0; k < 4 + s * 3; k++) { const a = r() * TAU, d = R * (1.15 + r() * .8); gdot(g, Math.cos(a) * d, Math.sin(a) * d * ELL, .5 + r() * .6, c[2], .6); }
    return [[0, 0]];
  },
  // frost: a haze plus six-armed crystals
  frost(g, s, r, o) {
    const R = 8 * s, P = o.col || ['#2a6a90', '#7fdcf0', '#bff4ff', '#f0fdff'], pts = [];
    gsoft(g, 0, 0, R * 1.5, R * 1.5 * ELL, P[1], .28, .3); gsoft(g, 0, 0, R * .9, R * .9 * ELL, P[2], .3, .3);
    const arms = (cx, cy, L, k) => { for (let a = 0; a < 6; a++) { const ang = a * Math.PI / 3 + k, ex = cx + Math.cos(ang) * L, ey = cy + Math.sin(ang) * L * ELL; gpath(g, [[cx, cy], [ex, ey]], P[2], .9, .55); gdot(g, ex, ey, .55, P[3], .95);
      for (const f of [.45, .75]) { const bx0 = cx + Math.cos(ang) * L * f, by0 = cy + Math.sin(ang) * L * f * ELL, bl = L * (1 - f) * .7; for (const sg of [-1, 1]) gpath(g, [[bx0, by0], [bx0 + Math.cos(ang + sg * .9) * bl, by0 + Math.sin(ang + sg * .9) * bl * ELL]], P[1], .8, .4); } pts.push([ex, ey]); } gdot(g, cx, cy, .7, P[3], 1); };
    arms(0, 0, R * .85, r()); for (let k = 0; k < 2 + s; k++) arms((r() - .5) * R * 1.6, (r() - .5) * R * .9, R * (.25 + r() * .3), r() * 3);
    for (let k = 0; k < 8 * s; k++) gdot(g, (r() - .5) * R * 2.4, (r() - .5) * R * 1.3, .3 + r() * .3, P[3], .8);
    return pts;
  },
  // electric burn: a scorched core and a branching Lichtenberg tree, fused glass specks
  volt(g, s, r, o) {
    const R = 6 * s, pts = [];
    gsoft(g, 0, 0, R * 1.6, R * 1.6 * ELL, '#5a4a28', .3, .4); gblob(g, 0, 0, R * .8, R * .8 * ELL, '#24211f', .55, r, .3); gblob(g, 0, 0, R * .4, R * .4 * ELL, '#121216', .85, r, .25);
    const branch = (x, y, a, L, d) => { const w = gwalk(x, y, a, L, r, .7); gpath(g, w, '#17161c', .92, Math.max(.3, .65 - d * .15)); if (d < 2) gpath(g, w.filter((_, k) => k % 3 === 0), '#8a7a30', .45, .3); pts.push(w[w.length - 1]); if (d < 3) for (let q = 3; q < w.length; q += 3) if (r() < .3) branch(w[q][0], w[q][1], a + (r() < .5 ? -1 : 1) * (.6 + r() * .6), L * .5, d + 1); };
    for (let k = 0; k < 4 + s * 2; k++) branch(0, 0, r() * TAU, R * (1.2 + r() * .9), 0);
    for (let k = 0; k < 5 * s; k++) gdot(g, (r() - .5) * R * 2.6, (r() - .5) * R * 1.4, .35 + r() * .3, r() < .5 ? '#fff2a0' : '#ffe04a', .9);
    return pts;
  },
  // toxic pool
  sludge(g, s, r, o) {
    const R = 7 * s, c = o.col || ['#2a1040', '#5a2088', '#8a3ac8', '#d8a0ff'];
    gsoft(g, 0, 0, R * 1.5, R * 1.5 * ELL, c[0], .36, .5); gblob(g, 0, 0, R, R * ELL, c[1], .62, r, .28); gsoft(g, -R * .1, -R * .1, R * .6, R * .6 * ELL, c[2], .5, .3);
    for (let k = 0; k < 3 + s * 2; k++) { const a = r() * TAU, d = r() * R * .65, bi = Math.cos(a) * d, bj = Math.sin(a) * d * ELL, br = .8 + r() * .9; g.strokeStyle = c[3]; g.globalAlpha = .75; g.lineWidth = .4; g.beginPath(); g.arc(bi, bj, br, 0, TAU); g.stroke(); g.globalAlpha = 1; gdot(g, bi - br * .35, bj - br * .35, br * .3, '#ffffff', .8); }
    for (let k = 0; k < 4 * s; k++) { const a = r() * TAU, d = R * (1.1 + r() * .7); gdot(g, Math.cos(a) * d, Math.sin(a) * d * ELL, .5 + r() * .5, c[1], .7); }
    return [[0, 0]];
  },
  // grass: green stain, tufts, scattered leaves
  grass(g, s, r, o) {
    const R = 8 * s, G = o.col || ['#1a4a26', '#3fb04a', '#7fe05a', '#c8f58a'], pts = [];
    gsoft(g, 0, 0, R * 1.4, R * 1.4 * ELL, G[0], .3, .4);
    for (let k = 0; k < 6 + 4 * s; k++) { const x = (r() - .5) * R * 2, y = (r() - .5) * R * ELL * 2, h = 2 + r() * 3, lean = (r() - .5) * 1.4; gpath(g, [[x, y], [x + lean * .5, y - h * .6], [x + lean, y - h]], G[1], .9, .55); gdot(g, x + lean, y - h, .35, G[3], .9); pts.push([x, y]); }
    if (o.leaves !== false) for (let k = 0; k < 4 + 3 * s; k++) { const x = (r() - .5) * R * 2.4, y = (r() - .5) * R * 1.3, a = r() * 3.14; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = G[2]; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, 2.1, .9, 0, 0, TAU); g.fill(); g.strokeStyle = G[0]; g.globalAlpha = .6; g.lineWidth = .25; g.beginPath(); g.moveTo(-2, 0); g.lineTo(2, 0); g.stroke(); g.restore(); }
    g.globalAlpha = 1; return pts;
  },
  // etched rune circle (psychic, fairy moon, dragon, aura)
  rune(g, s, r, o) {
    const R = 10 * s, c = o.col || ['#6a1a58', '#ff6fc8', '#ffe2f4'], pts = [], n = o.sides || 5;
    g.strokeStyle = c[1]; g.globalAlpha = .5; g.lineWidth = .6; g.beginPath(); g.ellipse(0, 0, R, R * ELL, 0, 0, TAU); g.stroke(); g.globalAlpha = .3; g.lineWidth = .4; g.beginPath(); g.ellipse(0, 0, R - 2, (R - 2) * ELL, 0, 0, TAU); g.stroke();
    for (let k = 0; k < n; k++) { const a0 = k / n * TAU - 1.57, a1 = ((k + 2) % n) / n * TAU - 1.57; gpath(g, [[Math.cos(a0) * (R - 2.5), Math.sin(a0) * (R - 2.5) * ELL], [Math.cos(a1) * (R - 2.5), Math.sin(a1) * (R - 2.5) * ELL]], c[1], .42, .4); pts.push([Math.cos(a0) * R, Math.sin(a0) * R * ELL]); }
    gsoft(g, 0, 0, R * .5, R * .5 * ELL, c[2], .4, .3); g.globalAlpha = 1; return pts;
  },
  // shadow stain with creeping edges
  shade(g, s, r, o) {
    const R = 8 * s, c = o.col || ['#140e30', '#2d2068', '#5a3ac8'];
    gsoft(g, 0, 0, R * 1.7, R * 1.7 * ELL, c[2], .22, .3); gblob(g, 0, 0, R, R * ELL, c[1], .5, r, .3); gblob(g, 0, 0, R * .6, R * .6 * ELL, c[0], .78, r, .3);
    for (let k = 0; k < 5; k++) { const a = r() * TAU, w = []; for (let q = 0; q < 8; q++) { const t = q / 7, rr = R * (.8 + t * .9), aa = a + t * .5; w.push([Math.cos(aa) * rr, Math.sin(aa) * rr * ELL]); } gpath(g, w, c[1], .35, .6); }
    return [[0, 0]];
  },
  // crater with a lit rim, radial cracks, left-over rocks
  crater(g, s, r, o) {
    const R = 8 * s, pal = o.rock || RAMP.ground;
    gsoft(g, 0, 0, R * 1.8, R * 1.8 * ELL, '#e7c27a', .16, .4); gsoft(g, 0, 1, R * 1.15, R * 1.15 * ELL, pal[2], .5, .55); gblob(g, 0, 1, R * .95, R * .95 * ELL, pal[5] || pal[4], .72, r, .2); gsoft(g, 1, 1.2, R * .72, R * .72 * ELL, '#2a2218', .8, .5);
    g.strokeStyle = pal[0]; g.globalAlpha = .75; g.lineWidth = .7; g.beginPath(); g.ellipse(0, 1, R * 1.02, R * 1.02 * ELL, 0, 2.4, 4.9); g.stroke(); g.globalAlpha = 1;
    for (let k = 0; k < 3 + s * 2; k++) { const w = gwalk(0, 0, r() * TAU, R * 1.5, r, .7); gpath(g, w.slice(Math.floor(w.length * .4)), '#2a2e38', .6, .4); }
    if (o.rocks) for (let k = 0; k < (o.rocks | 0); k++) { const a = r() * TAU, d = R * (.5 + r() * 1.2); gchunk(g, Math.cos(a) * d, Math.sin(a) * d * ELL, 1.2 + r() * 1.4 * s, o.rock || RAMP.rock, r); }
    return [[0, 0]];
  },
  // claw gouges: parallel curved scratches
  gouge(g, s, r, o) {
    const n = o.n || 3, L = 10 * s, ang = o.ang ?? (-.6 + (r() - .5) * .5), c = o.col || ['#2a2218', '#8a7448', '#e3cb92'], pts = [];
    for (const A of (o.cross ? [ang, ang + 1.5] : [ang])) for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * 2.8, w = [], hi = [];
      for (let q = 0; q <= 14; q++) { const t = q / 14, bow = Math.sin(t * Math.PI) * 1.4, d = (t - .5) * L, x = Math.cos(A) * d - Math.sin(A) * (off + bow), y = (Math.sin(A) * d + Math.cos(A) * (off + bow)) * ELL; w.push([x, y]); hi.push([x, y - .7]); }
      gpath(g, w, c[0], .85, 1.1); gpath(g, hi, c[2], .45, .4); pts.push(w[w.length - 1]); }
    for (let k = 0; k < 8; k++) gdot(g, (r() - .5) * L * 1.5, (r() - .5) * 7, .3 + r() * .3, c[1], .6);
    return pts;
  },
  skid(g, s, r, o) {   // motion scuffs
    const c = o.col || ['#2a2e38', '#8a8a96', '#d8d4c8'], L = 8 * s, a = o.ang ?? 0;
    for (let k = 0; k < 3; k++) { const y = (k - 1) * 2, gr = g.createLinearGradient(-L / 2, 0, L / 2, 0); gr.addColorStop(0, grgba(c[0], .0)); gr.addColorStop(.3, grgba(c[0], .38)); gr.addColorStop(1, grgba(c[0], 0)); g.save(); g.rotate(a); g.strokeStyle = gr; g.lineWidth = .8; g.beginPath(); g.moveTo(-L / 2, y); g.lineTo(L / 2, y * .8); g.stroke(); g.restore(); }
    for (let k = 0; k < 5; k++) gdot(g, (r() - .5) * L * 1.4, (r() - .5) * 6, .4, c[2], .4); return [];
  },
  fissure(g, s, r, o) {   // long jagged crack, lit edge; lava option glows in the lingering part
    const L = 14 * s, pts = [], a0 = o.ang ?? (r() * TAU), edge = o.edge || '#c99a4d';
    for (let k = 0; k < 2; k++) { const w = gwalk(0, 0, a0 + k * Math.PI, L, r, .8); gpath(g, w.map(p => [p[0] - .4, p[1] - .6]), edge, .5, .5); gpath(g, w, '#17151a', .9, 1.0); for (let q = 4; q < w.length; q += 4) pts.push(w[q]);
      for (let q = 4; q < w.length; q++) if (r() < .12) gpath(g, gwalk(w[q][0], w[q][1], a0 + (r() < .5 ? -1.1 : 1.1), L * .35, r, .8), '#17151a', .8, .5); }
    return pts;
  },
  sparkle(g, s, r, o) {
    const c = o.col || ['#c84a98', '#ff7ac8', '#ffd0ef', '#ffffff'], R = 8 * s, pts = [];
    gsoft(g, 0, 0, R * 1.3, R * 1.3 * ELL, c[1], .14, .3);
    for (let k = 0; k < 8 * s + 3; k++) { const x = (r() - .5) * R * 2.3, y = (r() - .5) * R * 1.3, L = .8 + r() * (r() < .3 ? 2 : 1.2); g.fillStyle = c[3]; g.globalAlpha = .9; g.beginPath(); g.moveTo(x - L, y); g.quadraticCurveTo(x, y, x, y - L); g.quadraticCurveTo(x, y, x + L, y); g.quadraticCurveTo(x, y, x, y + L); g.quadraticCurveTo(x, y, x - L, y); g.fill(); g.globalAlpha = 1; pts.push([x, y]); }
    return pts;
  },
  web(g, s, r, o) {
    const R = 9 * s, spokes = 8, c = '#f4f4f4';
    for (let k = 0; k < spokes; k++) { const a = k / spokes * TAU; gpath(g, [[0, 0], [Math.cos(a) * R, Math.sin(a) * R * ELL]], c, .7, .35); }
    for (const rr of [.3, .55, .8, 1]) { const w = []; for (let k = 0; k <= spokes; k++) { const a = k / spokes * TAU, m = rr * (1 - .08 * Math.sin(k * 5.1)); w.push([Math.cos(a) * R * m, Math.sin(a) * R * m * ELL]); } gpath(g, w, c, .5, .3); }
    for (let k = 0; k < 4; k++) gdot(g, (r() - .5) * R * 1.6, (r() - .5) * R, .45, '#bfe8ff', .9); return [[0, 0]];
  },
  feather(g, s, r, o) {   // wind scuff with feathers
    const c = o.col || ['#a8c0f0', '#d7e6ff', '#ffffff'], R = 9 * s;
    for (let k = 0; k < 5 + s * 2; k++) { const a = r() * TAU, L = R * (.6 + r() * .8); const gr = g.createLinearGradient(Math.cos(a) * 2, Math.sin(a) * 2 * ELL, Math.cos(a) * L, Math.sin(a) * L * ELL); gr.addColorStop(0, 'rgba(120,120,140,.35)'); gr.addColorStop(1, 'rgba(120,120,140,0)'); g.strokeStyle = gr; g.lineWidth = .6; g.beginPath(); g.moveTo(Math.cos(a) * 2, Math.sin(a) * 2 * ELL); g.lineTo(Math.cos(a) * L, Math.sin(a) * L * ELL); g.stroke(); }
    for (let k = 0; k < 2 + Math.round(s * 1.5); k++) { g.save(); g.translate((r() - .5) * R * 2, (r() - .5) * R); g.rotate(r() * 3.14); g.fillStyle = c[1]; g.globalAlpha = .92; g.beginPath(); g.ellipse(0, 0, 3.4, 1, 0, 0, TAU); g.fill(); g.strokeStyle = c[0]; g.lineWidth = .3; g.beginPath(); g.moveTo(-3.6, 0); g.lineTo(3.6, 0); g.stroke(); g.restore(); }
    g.globalAlpha = 1; return [];
  },
  bite(g, s, r, o) {   // two rows of tooth dents
    const w = 8 * s, c = o.col || ['#17151a', '#6a5a4a'];
    for (const row of [-1, 1]) for (let k = -3; k <= 3; k++) { const x = k * w / 3.2, y = row * (w * .3) + Math.abs(k) * .5 * -row; g.fillStyle = c[0]; g.globalAlpha = .8; g.beginPath(); g.moveTo(x - 1, y); g.lineTo(x + 1, y); g.lineTo(x, y + row * 2.4); g.closePath(); g.fill(); gdot(g, x + .8, y, .3, c[1], .6); }
    g.globalAlpha = 1; return [];
  },
  pins(g, s, r, o) {   // needle holes with a few stuck needles
    const c = o.col || ['#17151a', '#d8e872'];
    for (let k = 0; k < 4 + s * 3; k++) { const x = (r() - .5) * 18 * s, y = (r() - .5) * 9 * s; gdot(g, x, y, .6, c[0], .85); if (r() < .35) { gpath(g, [[x, y], [x, y - 3]], c[1], .95, .4); gdot(g, x, y - 3, .35, '#fff', .9); } }
    return [];
  },
  mud(g, s, r, o) {
    const R = 7 * s, c = ['#3a2a18', '#6a4a24', '#9a7038', '#c99a4d'];
    gsoft(g, 0, 0, R * 1.5, R * 1.5 * ELL, c[0], .32, .4); gblob(g, 0, 0, R, R * ELL, c[1], .72, r, .3); gblob(g, -1, -1, R * .55, R * .55 * ELL, c[2], .6, r, .3);
    for (let k = 0; k < 8 * s; k++) { const a = r() * TAU, d = R * (.95 + r() * 1.1); gdot(g, Math.cos(a) * d, Math.sin(a) * d * ELL, .4 + r() * .7, c[r() < .5 ? 1 : 2], .8); }
    return [];
  },
  powder(g, s, r, o) {
    const R = 10 * s, c = o.col || ['#c8a0ff', '#e6d0ff', '#ffffff']; for (let k = 0; k < 70 * s; k++) { const a = r() * TAU, d = Math.sqrt(r()) * R; gdot(g, Math.cos(a) * d, Math.sin(a) * d * ELL, .3 + r() * .4, r() < .6 ? c[0] : c[1], .25 + r() * .3); } return [];
  },
  sonic(g, s, r, o) {
    const c = o.col || ['#56701a', '#b6d636', '#e0f58a']; g.setLineDash([2, 2]); for (let k = 0; k < 3; k++) { const R = 4 * s + k * 4.5 * s; g.strokeStyle = c[k % 2 ? 1 : 0]; g.globalAlpha = .45 - k * .1; g.lineWidth = .5; g.beginPath(); g.ellipse(0, 0, R, R * ELL, 0, 0, TAU); g.stroke(); } g.setLineDash([]); g.globalAlpha = 1; return [];
  },
  debris(g, s, r, o) { const n = o.n || 3; for (let k = 0; k < n; k++) { const a = r() * TAU, d = r() * 10 * s; gchunk(g, Math.cos(a) * d, Math.sin(a) * d * ELL, 1.6 + r() * 2 * s, o.pal || RAMP.rock, r); } return [[0, 0]]; },
  spiral(g, s, r, o) { const c = o.col || ['#2a2218', '#c99a4d']; const w = [], h = []; for (let k = 0; k < 70; k++) { const a = k * .3, rr = k * .1 * s; w.push([Math.cos(a) * rr, Math.sin(a) * rr * ELL]); h.push([Math.cos(a) * rr - .5, Math.sin(a) * rr * ELL - .6]); } gpath(g, h, c[1], .4, .4); gpath(g, w, c[0], .75, .8); return [[0, 0]]; }
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
  if (!style) return;
  const [kind, sz, opts, linger, lopts] = style, o = Object.assign({}, opts, extra), cx = ax(wx), cy = ay(wy);
  if (cx < 4 || cy < 4 || cx > ART_W - 4 || cy > ART_H - 4) return;
  const s = clamp(sz * size * .82, .4, 2.1), r = mulberry((Math.random() * 1e9) | 0);
  // one mark per spot: a new mark replaces an older one that is nearly in the same place
  for (const d of GDECALS) if (Math.hypot(d.cx - cx, d.cy - cy) < 7 * s + 4 && clock.t - d.born < 2500) { d.born = Math.min(d.born, clock.t - 600); }
  const H = Math.min(60, Math.ceil(24 * s) + 6), cv = document.createElement('canvas'); cv.width = cv.height = H * 2 * GK;
  const g = cv.getContext('2d'); g.translate(H * GK, H * GK); g.scale(GK, GK); g.lineCap = 'round'; g.lineJoin = 'round';
  let pts = []; try { pts = (GP[kind] || GP.crater)(g, s, r, o) || []; } catch (e) { console.error(e); }
  if (!o.noDecal) { GDECALS.push({ cv, H, cx, cy, born: clock.t, life: GLIFE * (.8 + s * .25) }); while (GDECALS.length > GMAX) GDECALS.shift(); }
  if (extra.noLinger || !linger || GR.live >= 16) return;
  GR.live++; const f = GL[linger]; if (!f) { GR.live--; return; }
  const abs = pts.map(p => [p[0] + cx, p[1] + cy]);
  const lo = Object.assign({}, lopts || {}, o.ramp ? { ramp: o.ramp } : {}, o.col && linger !== 'embers' ? { col: o.col } : {});
  try { f(wx, wy, s, abs, lo); } catch (e) { console.error(e); }
  setTimeoutGame(900 + 1200 * s, () => { GR.live = Math.max(0, GR.live - 1); });
}
// drawn every frame under the Pokémon: fade in quickly, hold, then fade away
function drawDecals() {
  const c = bctx; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  for (let k = GDECALS.length - 1; k >= 0; k--) {
    const d = GDECALS[k], age = clock.t - d.born; if (age > d.life) { GDECALS.splice(k, 1); continue; }
    const a = Math.min(1, age / 140) * Math.min(1, (d.life - age) / (d.life * .42)) * GALPHA, i = d.cx - OX - d.H, j = d.cy - OY - d.H;
    if (i + 2 * d.H < -4 || j + 2 * d.H < -4) continue;
    c.globalAlpha = a; c.drawImage(d.cv, i, j, d.H * 2, d.H * 2);
  }
  c.globalAlpha = 1; c.imageSmoothingEnabled = false;
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
{ const _bs = buildScars; buildScars = function () { _bs(); GDECALS.length = 0; GR.live = 0; }; }   // a new scene starts with a clean floor
