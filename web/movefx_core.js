/* =====================================================================
   Section 8b: move effects toolkit
   Shaped, colour-ramped particles; timed effect "entities" drawn in the
   art buffer (above or below the Pokémon); and a library of pixel
   drawings (fists, jaws, swords, moons, rocks, spikes, lightning…).
   Everything is drawn on the art-pixel grid so it stays crisp.
   ===================================================================== */
const RAMP = {
  fire: ['#ffffff', '#fff6b0', '#ffd23f', '#ff9a1f', '#f0561c', '#a8321c', '#5a3a36', '#3a3a42'],
  blueFire: ['#ffffff', '#d8f4ff', '#7fd6ff', '#3f8cff', '#4a3ad0', '#2a2470', '#2a2a3a'],
  wisp: ['#ffffff', '#e6dcff', '#9f8bff', '#6a4ad8', '#3a2a8a', '#1a1440'],
  elec: ['#ffffff', '#fffbd0', '#fff07a', '#ffd52a', '#d8a800', '#8a6a00'],
  water: ['#ffffff', '#d8f4ff', '#8fd4ff', '#4aa6ff', '#2a6fc0', '#1a4080'],
  ice: ['#ffffff', '#f0fdff', '#bff4ff', '#7fdcf0', '#4aa8d0', '#2a6a90'],
  grass: ['#f4ffd8', '#c8f58a', '#7fe05a', '#3fb04a', '#26803a', '#1a4a26'],
  poison: ['#f6e6ff', '#d8a0ff', '#b65cff', '#8a3ac8', '#5a2088', '#2a1040'],
  psychic: ['#ffffff', '#ffe2f4', '#ffa8de', '#ff6fc8', '#c83a98', '#6a1a58'],
  ghost: ['#efe6ff', '#b9a4ff', '#8c6bff', '#5a3ac8', '#2d2068', '#140e30'],
  dragon: ['#ffffff', '#e5e0ff', '#a99bff', '#7d6bff', '#4a3ad0', '#24187a'],
  fairy: ['#ffffff', '#fff0fa', '#ffd0ef', '#ffa8de', '#ff7ac8', '#c84a98'],
  steel: ['#ffffff', '#eef4fa', '#cad8e6', '#9aaabb', '#6a7a8a', '#3a4450'],
  rock: ['#fff2cf', '#e3cb92', '#b89f6a', '#8a7448', '#5a4a30', '#3a3020'],
  ground: ['#fff0c9', '#e7c27a', '#c99a4d', '#9a7038', '#6a4a24', '#3a2a18'],
  dark: ['#d9cde8', '#8a7a9a', '#5a4a6a', '#3a2a48', '#1e1628', '#0e0a14'],
  smoke: ['#f0f0f0', '#c8c8d0', '#9898a4', '#6a6a78', '#44444e', '#2a2a32'],
  dust: ['#f4ece0', '#d8ccb8', '#b0a48e', '#867a66', '#5a5244'],
  fight: ['#ffffff', '#fff0d8', '#ffc08a', '#ff8a5b', '#d84a2a', '#7a2a1a'],
  normal: ['#ffffff', '#fffbe8', '#f2eccd', '#d8d0b0', '#a8a088', '#6a6458'],
  bug: ['#f8ffd8', '#e0f58a', '#b6d636', '#86a82a', '#56701a', '#2a3a0e'],
  flying: ['#ffffff', '#f0f6ff', '#d7e6ff', '#a8c0f0', '#7a90c8', '#4a5a8a'],
  gold: ['#ffffff', '#fffbe0', '#fff07a', '#ffd23f', '#e8a81a', '#a86a10'],
  heal: ['#ffffff', '#e8ffef', '#a8ffc0', '#5ee08a', '#2aa85a', '#1a6a3a'],
  aurora: ['#ffffff', '#ffd0f0', '#d0b0ff', '#a0d8ff', '#a0ffd8', '#fff0a0']
};
const TYPE_RAMP = { Fire: 'fire', Water: 'water', Grass: 'grass', Electric: 'elec', Ice: 'ice', Fighting: 'fight', Poison: 'poison', Ground: 'ground', Flying: 'flying',
  Psychic: 'psychic', Bug: 'bug', Rock: 'rock', Ghost: 'ghost', Dragon: 'dragon', Steel: 'steel', Fairy: 'fairy', Normal: 'normal', Dark: 'dark' };
const RR = r => typeof r === 'string' ? RAMP[r] : r;
const rampAt = (r, q) => r[Math.min(r.length - 1, Math.max(0, Math.floor(q * r.length)))];
const rnd2 = (a, b) => a + Math.random() * (b - a);

/* ---------- particles ---------- */
// P(x, y, {vx, vy, g, drag, life, size, size2, color | ramp, shape, spin, add})
function P(x, y, o = {}) {
  parts.push({ x, y, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag || 0, life: o.life || 500, t: 0,
    size: o.size ?? 1, size2: o.size2 ?? o.size ?? 1, color: o.color || '#ffffff', ramp: o.ramp ? (typeof o.ramp === 'string' ? RAMP[o.ramp] : o.ramp) : null,
    shape: o.shape || 'sq', rot: o.rot ?? Math.random() * 6.28, spin: o.spin || 0, add: !!o.add });
}
// emit n particles: speed [min,max]; ang + spread (radians) for a cone, otherwise all directions
function emit(x, y, n, o = {}) {
  const sp = o.speed || [60, 200];
  for (let k = 0; k < n; k++) {
    const a = o.ang != null ? o.ang + (Math.random() - .5) * (o.spread ?? .6) : Math.random() * 6.28, v = rnd2(sp[0], sp[1]);
    const rx = o.r ? (Math.random() - .5) * o.r * 2 : 0, ry = o.r ? (Math.random() - .5) * o.r * 2 * (o.flat ?? .6) : 0;
    P(x + rx, y + ry, { ...o, vx: Math.cos(a) * v + (o.vx || 0), vy: Math.sin(a) * v + (o.vy || 0), life: Array.isArray(o.life) ? rnd2(o.life[0], o.life[1]) : o.life,
      size: Array.isArray(o.size) ? Math.round(rnd2(o.size[0], o.size[1])) : o.size, spin: o.spin ? rnd2(-o.spin, o.spin) : 0 });
  }
}
function drawParticle(p) {
  const q = p.t / p.life; if (q >= 1) return false;
  const i = bx(p.x), j = by(p.y), s = Math.max(1, Math.round(lerp(p.size, p.size2, q)));
  const c = bctx; c.globalAlpha = p.ramp ? Math.min(1, 1.25 - q) : 1 - q; c.fillStyle = p.ramp ? rampAt(p.ramp, q) : p.color;
  if (p.add) c.globalCompositeOperation = 'lighter';
  const r = (dx, dy, w = 1, h = 1) => c.fillRect(i + dx, j + dy, w, h);
  switch (p.shape) {
    case 'disc': { for (let y = -s; y <= s; y++) { const w = Math.round(Math.sqrt(Math.max(0, s * s - y * y))); r(-w, y, w * 2 + 1, 1); } break; }
    case 'ring': { const n = Math.max(8, s * 6); for (let k = 0; k < n; k++) { const a = k / n * 6.28; r(Math.round(Math.cos(a) * s), Math.round(Math.sin(a) * s)); } break; }
    case 'bubble': { const n = Math.max(8, s * 6); for (let k = 0; k < n; k++) { const a = k / n * 6.28; r(Math.round(Math.cos(a) * s), Math.round(Math.sin(a) * s)); } c.fillStyle = '#ffffff'; r(-Math.ceil(s / 2), -Math.ceil(s / 2)); break; }
    case 'leaf': { const ca = Math.cos(p.rot), sa = Math.sin(p.rot); for (let k = -s - 1; k <= s + 1; k++) { r(Math.round(ca * k), Math.round(sa * k * .7)); if (Math.abs(k) < s) r(Math.round(ca * k - sa), Math.round(sa * k * .7 + ca * .7)); } break; }
    case 'shard': { const ca = Math.cos(p.rot), sa = Math.sin(p.rot); for (let k = -s * 2; k <= s * 2; k++) { const w = Math.max(0, s - Math.abs(k) / 2); for (let m = -w; m <= w; m++) r(Math.round(ca * k - sa * m), Math.round(sa * k + ca * m)); } break; }
    case 'star': { r(-s, 0, s * 2 + 1, 1); r(0, -s, 1, s * 2 + 1); if (s > 1) { r(-1, -1); r(1, 1); r(1, -1); r(-1, 1); } break; }
    case 'plus': r(-1, 0, 3, 1); r(0, -1, 1, 3); break;
    case 'zap': for (let k = 0; k < 3 + s; k++) r((k % 2) * 2 - 1, k - 2); break;
    case 'drop': r(0, -s, 1, s * 2); r(-1, 0, 3, s); break;
    case 'heart': { const H = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']; H.forEach((row, y) => { for (let x = 0; x < 7; x++) if (row[x] === '#') r(x - 3, y - 3); }); break; }
    case 'note': r(0, -4, 1, 5); r(-2, 0, 3, 2); r(1, -4, 2, 1); break;
    case 'z': r(-2, -2, 5, 1); r(1, -1); r(0, 0); r(-1, 1); r(-2, 2, 5, 1); break;
    case 'q': r(-1, -3, 3, 1); r(2, -2); r(1, -1); r(0, 0); r(0, 2); break;
    case 'feather': { const ca = Math.cos(p.rot), sa = Math.sin(p.rot); for (let k = -4; k <= 4; k++) { r(Math.round(ca * k), Math.round(sa * k)); if (k > -3 && k < 3) { r(Math.round(ca * k - sa), Math.round(sa * k + ca)); } } break; }
    default: r(-Math.floor(s / 2), -Math.floor(s / 2), s, s);
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; return true;
}

// draw one shape immediately (for things redrawn every frame, like a projectile's body)
function shapeAt(x, y, o = {}) { drawParticle({ x, y, t: 0, life: 1, size: o.size || 1, size2: o.size || 1, color: o.color || (o.ramp ? rampAt(RAMP[o.ramp] || o.ramp, .3) : '#ffffff'), ramp: null, shape: o.shape || 'sq', rot: o.rot || 0, add: !!o.add }); }

/* ---------- timed effect entities ---------- */
const ENTS = [];
// ent(life, draw(q, ageMs), {under}) — under=true draws on the ground layer beneath the Pokémon
function ent(life, draw, o = {}) { ENTS.push({ t0: clock.t + (o.delay || 0), life, draw, under: !!o.under }); }
function drawEnts(under) {
  for (let k = ENTS.length - 1; k >= 0; k--) {
    const e = ENTS[k]; if (e.under !== under) continue;
    const age = clock.t - e.t0; if (age < 0) continue; const q = age / e.life;
    if (q >= 1) { ENTS.splice(k, 1); continue; }
    try { e.draw(q, age); } catch (err) { console.error(err); ENTS.splice(k, 1); }
    bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'source-over';
  }
}
const timers = [];
function setTimeoutGame(ms, fn) { timers.push({ at: clock.t + ms, fn }); return true; }
function runTimers() { for (let k = timers.length - 1; k >= 0; k--) if (clock.t >= timers[k].at) { const f = timers[k].fn; timers.splice(k, 1); try { f(); } catch (e) { } } }

/* ---------- screen-level helpers ---------- */
const dimState = { a: 0, until: 0, col: '5,7,15' };
function dim(a, ms, col) { if (REDUCED) a *= .4; dimState.a = Math.max(dimState.a, a); dimState.until = clock.t + ms; if (col) dimState.col = col; }
function tintScreen(col, a) { screenFlash(col, a); }

/* ---------- pixel drawing helpers (art pixels, current camera) ---------- */
const PX = (i, j, col, a = 1) => { bctx.globalAlpha = a; bctx.fillStyle = col; bctx.fillRect(Math.round(i), Math.round(j), 1, 1); };
function glow(i, j, r, col, a = .5) { bctx.globalCompositeOperation = 'lighter'; for (let k = 3; k >= 1; k--) aDisc(i, j, r * k / 3, col, a / 3); bctx.globalCompositeOperation = 'source-over'; }
function orbPx(i, j, r, ramp, t = 0) {   // layered orb: dark rim → bright core, flickering
  const R = RAMP[ramp] || ramp; glow(i, j, r * 1.8, R[3], .45);
  aDisc(i, j, r, R[4]); aDisc(i - r * .15, j - r * .15, r * .78, R[3]); aDisc(i - r * .25, j - r * .25, r * .5, R[2]); aDisc(i - r * .35, j - r * .35, Math.max(1, r * .22), R[0]);
  if (t) for (let k = 0; k < 3; k++) { const a = t / 120 + k * 2.1; PX(i + Math.cos(a) * (r + 1), j + Math.sin(a) * (r + 1), R[1]); }
}
function zig(i0, j0, i1, j1, col, w = 1, jit = 4, core) {   // lightning segment (re-randomised every frame)
  const d = Math.hypot(i1 - i0, j1 - j0), n = Math.max(2, Math.round(d / 5)); let pi = i0, pj = j0;
  for (let k = 1; k <= n; k++) { const t = k / n, ni = lerp(i0, i1, t) + (k < n ? (Math.random() - .5) * jit * 2 : 0), nj = lerp(j0, j1, t) + (k < n ? (Math.random() - .5) * jit * 2 : 0); aLine(pi, pj, ni, nj, col, 1, w); if (core) aLine(pi, pj, ni, nj, core, 1, 1); pi = ni; pj = nj; }
}
function beamPx(i0, j0, ang, len, w, ramp, a = 1, wob = 0) {
  const R = RAMP[ramp] || ramp, ca = Math.cos(ang), sa = Math.sin(ang), n = Math.round(len);
  bctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < n; k += 2) aRect(i0 + ca * k - w, j0 + sa * k - w, w * 2, w * 2, R[3], .1 * a); bctx.globalCompositeOperation = 'source-over';
  for (const [ww, ci] of [[w, 4], [w * .75, 3], [w * .45, 1], [Math.max(1, w * .2), 0]]) {
    const s = Math.max(1, Math.round(ww)); for (let k = 0; k < n; k++) { const o = wob ? Math.sin(k / 5 - clock.t / 40) * wob : 0; aRect(i0 + ca * k - sa * o - s / 2, j0 + sa * k + ca * o - s / 2, s, s, R[ci], a); }
  }
}
function swordPx(i, j, ang, col = '#e8f0ff') {   // 12px blade + crossguard + grip
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k = 0; k < 12; k++) { PX(i + ca * k, j + sa * k, k > 9 ? '#ffffff' : col); PX(i + ca * k - sa, j + sa * k + ca, '#9aaabb'); }
  for (let k = -3; k <= 3; k++) PX(i - sa * k - ca, j + ca * k - sa, '#e8b84a');
  for (let k = 1; k <= 3; k++) PX(i - ca * (k + 1), j - sa * (k + 1), '#7a4a2a');
  bctx.globalAlpha = 1;
}
function fistPx(i, j, s, col, dir = 1) {   // chunky pixel fist, s = scale (1..3)
  const F = ['.####.', '######', '######', '#.#.##', '######', '.####.'];
  const dark = mix(col, '#1a1020', .5);
  F.forEach((row, y) => { for (let x = 0; x < 6; x++) { if (row[x] === '.') continue; aRect(i + (dir > 0 ? x : 5 - x) * s - 3 * s, j + y * s - 3 * s, s, s, row[x] === '#' ? (y < 2 ? mix(col, '#ffffff', .35) : col) : dark); } });
  for (let y = 0; y < 6; y++) { aRect(i + (dir > 0 ? -3 : 2) * s - (dir > 0 ? s : -s), j + y * s - 3 * s, s, s, dark, .9); }
}
function jawsPx(i, j, q, col = '#ffffff', w = 22) {   // top and bottom rows of fangs snapping shut
  const gap = Math.round(lerp(14, 0, Math.min(1, q * 1.6))), t = Math.floor(w / 5);
  for (let k = 0; k < t; k++) { const x = i - w / 2 + k * 5; for (let h = 0; h < 5; h++) { aRect(x + h / 2, j - gap - 5 + h, 5 - h, 1, col); aRect(x + h / 2, j + gap + 4 - h, 5 - h, 1, col); } }
  aRect(i - w / 2, j - gap - 6, w, 1, '#3a2a3a'); aRect(i - w / 2, j + gap + 5, w, 1, '#3a2a3a');
}
function moonPx(i, j, r, a = 1) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d1 = x * x + y * y, d2 = (x - r * .45) ** 2 + (y + r * .2) ** 2; if (d1 <= r * r && d2 > (r * .85) ** 2) PX(i + x, j + y, d1 > (r - 1.5) ** 2 ? '#fff6c8' : x < -r * .3 ? '#ffe6f6' : '#ffd0ef', a); }
  bctx.globalAlpha = 1;
}
function rockPx(i, j, r, seed = 1, pal = RAMP.rock) {
  const rr = mulberry(seed);
  const pts = Array.from({ length: 7 }, (_, k) => r * (.75 + rr() * .35));
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const a = Math.atan2(y, x), k = ((a + Math.PI) / (Math.PI * 2) * 7) | 0, d = Math.hypot(x, y); if (d > pts[k % 7]) continue;
    const lit = (-x - y) / (r * 2) + .5; PX(i + x, j + y, d > pts[k % 7] - 1 ? pal[5] : lit > .7 ? pal[1] : lit > .45 ? pal[2] : pal[3]);
  }
  bctx.globalAlpha = 1;
}
function spikePx(i, j, h, w, pal, a = 1) {   // ground spike pointing up, lit from the left
  for (let y = 0; y < h; y++) { const ww = Math.max(1, Math.round(w * (1 - y / h))); for (let x = -ww; x <= ww; x++) PX(i + x, j - y, x < 0 ? pal[1] : x === 0 ? pal[0] : pal[3], a); }
  aRect(i - w, j + 1, w * 2 + 1, 1, pal[5], a * .6);
}
function vinePx(i0, j0, i1, j1, q, col = '#3fb04a') {   // whipping vine: quadratic curve with leaves
  const mi = (i0 + i1) / 2 + (j1 - j0) * .4 * Math.sin(q * Math.PI), mj = (j0 + j1) / 2 - 18 * Math.sin(q * Math.PI);
  const n = 40; for (let k = 0; k <= n * Math.min(1, q * 1.8); k++) { const t = k / n, i = (1 - t) * (1 - t) * i0 + 2 * (1 - t) * t * mi + t * t * i1, j = (1 - t) * (1 - t) * j0 + 2 * (1 - t) * t * mj + t * t * j1; aRect(i, j, 2, 2, k % 7 === 3 ? '#7fe05a' : col); if (k % 9 === 4) { PX(i + 2, j - 1, '#a8f07a'); PX(i + 3, j - 2, '#a8f07a'); } }
}
function slashPx(i, j, ang, len, col, w = 2, q = 0) {   // curved slash arc that draws on then fades
  const n = Math.round(len), shown = Math.min(n, Math.round(n * Math.min(1, q * 3)));
  for (let k = 0; k < shown; k++) { const t = k / n - .5, a = ang + t * .5, r = len * .8, x = i + Math.cos(a) * r * t * 1.6, y = j + Math.sin(a) * r * t * 1.6 + Math.sin(t * Math.PI) * -4; const ww = Math.max(1, Math.round(w * Math.sin((t + .5) * Math.PI))); aRect(x - ww / 2, y - ww / 2, ww, ww, k > shown - 3 ? '#ffffff' : col, 1 - Math.max(0, q - .5) * 2); }
}
function powStar(i, j, r, col, q) {   // comic-book impact star
  const s = r * (q < .25 ? q / .25 : 1), a0 = q * 2;
  for (let k = 0; k < 8; k++) { const a = a0 + k * Math.PI / 4, rr = k % 2 ? s * .55 : s; aLine(i, j, i + Math.cos(a) * rr, j + Math.sin(a) * rr, col, 1 - q, 2); }
  aDisc(i, j, s * .35, '#ffffff', 1 - q);
}
function speedLines(x, y, ang, n, len, col) { for (let k = 0; k < n; k++) { const o = (Math.random() - .5) * 40, ca = Math.cos(ang), sa = Math.sin(ang); P(x - sa * o, y + ca * o, { vx: -ca * rnd2(200, 400), vy: -sa * rnd2(200, 400), life: 180, color: col, shape: 'sq', size: 1 }); } }
function crackBurst(x, y, n = 5, len = 26) { for (let k = 0; k < n; k++) addScar('crack', x + (Math.random() - .5) * len, y + (Math.random() - .5) * len * .5); }
const headOf = S => { const sd = side(S); return { x: sd.x, y: sd.y - 44 }; };
const footOf = S => { const sd = side(S); return { x: sd.x, y: sd.y }; };
