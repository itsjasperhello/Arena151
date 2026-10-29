/* =====================================================================
   Section 6: original pixel-art sprites, v2 (56×56, lit and shaded)
   Each creature is assembled from a body plan picked by its types,
   decorated with type features, then lit with a height-map so every
   part reads as a rounded volume. Five-tone hue-shifted ramps, colored
   selective outlines, inner contour lines between overlapping parts,
   cool rim light from the snow, and a two-frame idle cycle.
   ===================================================================== */
const SPR = 56;
const GIANT = new Set(['Onix', 'Gyarados', 'Snorlax', 'Lapras', 'Dragonite', 'Rhydon', 'Aerodactyl', 'Articuno', 'Zapdos', 'Moltres', 'Mewtwo', 'Arcanine', 'Golem', 'Kangaskhan', 'Exeggutor', 'Tentacruel', 'Charizard', 'Venusaur', 'Blastoise']);
// Species that can Mega Evolve in Arena 151 (one per team per battle)
const MEGA_ABLE = new Set(['Venusaur', 'Charizard', 'Blastoise', 'Beedrill', 'Pidgeot', 'Alakazam', 'Slowbro', 'Gengar', 'Kangaskhan', 'Pinsir', 'Gyarados', 'Aerodactyl', 'Mewtwo']);
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function toHsl(hex) {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  if (s === 0) return rgbToHex(l * 255, l * 255, l * 255);
  const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return rgbToHex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255);
}
function hueShift(hex, deg) { const [h, s, l] = toHsl(hex); return fromHsl(h + deg, s, l); }
// Hue-shifted ramp: shadows drift toward blue-violet, highlights toward warm yellow.
function rampOf(hex) {
  const [h, s, l] = toHsl(hex);
  const toward = (target, amt) => { let d = ((target - h + 540) % 360) - 180; return h + d * amt; };
  return [
    fromHsl(toward(255, .28), Math.min(1, s * 1.05 + .08), l * .38),
    fromHsl(toward(250, .16), Math.min(1, s * 1.02 + .04), l * .62),
    hex,
    fromHsl(toward(55, .10), s * .95, l + (1 - l) * .30),
    fromHsl(toward(55, .18), s * .8, l + (1 - l) * .62)
  ];
}
const ELEMENT = { Fire: ['#ff7a1a', '#ffd84a'], Electric: ['#ffd62a', '#fff6b0'], Ice: ['#9fe6ff', '#f2fdff'], Ghost: ['#a98bff', '#efe6ff'],
  Psychic: ['#ff6ccf', '#ffd7f2'], Water: ['#58b9ff', '#dff4ff'], Grass: ['#63d24a', '#e6ffbf'], Dragon: ['#8b7bff', '#e4dfff'],
  Poison: ['#c26cff', '#f3dcff'], Fairy: ['#ffa9e2', '#fff0fa'], Rock: ['#cdb47a', '#fff2cf'], Ground: ['#ddb46a', '#fff0cc'],
  Steel: ['#c9d8e6', '#ffffff'], Fighting: ['#ff8e5e', '#ffe2d1'], Bug: ['#c6e84a', '#f6ffd0'], Flying: ['#c8dbff', '#ffffff'], Normal: ['#efe1bf', '#ffffff'] };
const IRIS = { Fire: '#7a2a10', Water: '#14406e', Grass: '#2c5a12', Electric: '#5a3a08', Psychic: '#6a1a5a', Ice: '#1a4a6a', Fighting: '#5a1a10',
  Poison: '#4a1460', Ground: '#4a3010', Rock: '#3a3020', Bug: '#2a3a08', Ghost: '#d01a3a', Dragon: '#a01a2a', Fairy: '#7a2a6a', Steel: '#1a3a5a', Flying: '#2a3a6a', Normal: '#3a2a1a' };

function planFor(d, r) {
  const [t1, t2] = d.types;
  if (t2 === 'Flying' && ['Normal', 'Fire', 'Ice', 'Electric'].includes(t1) && r() < .85) return 'avian';
  const opts = {
    Normal: ['biped', 'quad', 'blob'], Fire: ['quad', 'biped'], Water: ['fish', 'quad', 'blob', 'serpent'], Grass: ['quad', 'biped', 'blob'],
    Electric: ['quad', 'biped', 'blob'], Psychic: ['biped', 'floater'], Ice: ['quad', 'serpent', 'blob'], Fighting: ['biped'],
    Poison: ['blob', 'serpent', 'quad'], Ground: ['quad', 'biped', 'golem'], Rock: ['golem', 'blob'], Bug: ['insect'],
    Ghost: ['floater'], Dragon: ['serpent', 'biped'], Fairy: ['biped', 'blob'], Steel: ['golem', 'blob'], Flying: ['avian']
  }[t1] || ['blob'];
  return pickBy(opts, r);
}

// Roles (palette slots). Flat roles are not lit.
const R = { base: 1, belly: 2, accent: 3, dark: 4, horn: 5, elem: 6, core: 7, membrane: 8, eyeW: 20, iris: 21, pupil: 22, shine: 23, mouth: 24, fang: 25 };
const FLAT = new Set([20, 21, 22, 23, 24, 25, 7]);

// MissingNo.'s glitch sprite: scrambled blocks in the backwards-L shape from Red/Blue. Frame 0 is the front, frame 1 the back (mirrored).
function glitchSprite(frame, grid) {
  const cv = document.createElement('canvas'); cv.width = cv.height = grid; const x = cv.getContext('2d'), u = Math.max(2, Math.round(grid / 28));
  let seed = 0x5eed1 + frame * 7; const r = () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0) % 1000) / 1000;
  const cols = ['#000000', '#404040', '#8a8a8a', '#d8d8d8', '#ffffff', '#202020'], cells = grid / u | 0;
  for (let cy = 2; cy < cells; cy++) for (let cx = 1; cx < cells - 1; cx++) {
    const right = cx >= cells * .55, bottom = cy >= cells * .62, inside = frame === 0 ? (right || bottom) : (cx < cells * .45 || bottom);   // the backwards L (front), a normal L (back)
    if (!inside || r() < .12) continue; x.fillStyle = cols[(r() * cols.length) | 0]; x.fillRect(cx * u, cy * u, u, u);
    if (r() < .25) { x.fillStyle = '#ffffff'; x.fillRect(cx * u, cy * u, Math.max(1, u >> 1), Math.max(1, u >> 1)); } }
  return { canvas: cv, crop: { x: 0, y: 0, s: grid }, plan: null };
}
function generateSprite(d, frame = 0, opts = {}) {
  if (d && d.name === 'MissingNo.') return glitchSprite(frame, opts.grid || 56);
  const SPR = opts.grid || 56, CX = SPR / 2, FEET = SPR - 3, mega = !!opts.mega;
  const seed = hashStr(d.name);
  const r = mulberry(seed * 31 + 7);              // shape decisions (identical for both frames)
  const rf = mulberry(seed * 13 + 101 + frame);   // flame / sparkle flicker per frame
  const N = SPR * SPR;
  const role = new Uint8Array(N), part = new Uint8Array(N);
  let pid = 0, curRole = 1;
  const P = () => ++pid;
  const set = (x, y, rl = curRole, p = pid) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < SPR && y < SPR) { role[y * SPR + x] = rl; part[y * SPR + x] = p; } };
  const get = (x, y) => (x < 0 || y < 0 || x >= SPR || y >= SPR) ? 0 : role[y * SPR + x];
  const ell = (cx, cy, rx, ry, rl = curRole, p = pid) => { if (rx <= 0 || ry <= 0) return; for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) set(x, y, rl, p); } };
  const ellIn = (cx, cy, rx, ry, rl) => { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1 && get(x, y)) role[y * SPR + x] = rl; } };
  const tri = (a, b, q, rl = curRole, p = pid) => {
    const minX = Math.floor(Math.min(a[0], b[0], q[0])), maxX = Math.ceil(Math.max(a[0], b[0], q[0])), minY = Math.floor(Math.min(a[1], b[1], q[1])), maxY = Math.ceil(Math.max(a[1], b[1], q[1]));
    const s = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) { const pt = [x + .5, y + .5], d1 = s(pt, a, b), d2 = s(pt, b, q), d3 = s(pt, q, a); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) set(x, y, rl, p); }
  };
  const mir = x => 2 * CX - x;
  const triM = (a, b, q, rl) => { tri(a, b, q, rl); tri([mir(a[0]), a[1]], [mir(b[0]), b[1]], [mir(q[0]), q[1]], rl); };
  const line = (x0, y0, x1, y1, th = 1, rl = curRole, p = pid) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1; for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (th <= 1) set(x, y, rl, p); else ell(x, y, th / 2, th / 2, rl, p); } };
  const tufts = (cx, cy, rx, ry, a0, a1, n, len) => { for (let i = 0; i < n; i++) { const a = lerp(a0, a1, n === 1 ? .5 : i / (n - 1)), bx = cx + Math.cos(a) * rx * .85, by = cy + Math.sin(a) * ry * .85, tx = cx + Math.cos(a) * (rx + len), ty = cy + Math.sin(a) * (ry + len), px = -Math.sin(a) * 2, py = Math.cos(a) * 2; tri([bx - px, by - py], [bx + px, by + py], [tx, ty]); } };

  const s = TIER_SIZE[d.tier] * (SPR / 56) * (mega ? 1.06 : 1), [t1, t2] = d.types, plan = planFor(d, r);
  const types = [t1, t2].filter(Boolean);
  const has = t => types.includes(t);
  const fierce = 'FLX'.includes(d.tier) || t1 === 'Fighting' || t1 === 'Dragon';
  const young = 'WbB'.includes(d.tier);
  const bob = frame ? 1 : 0;                       // frame 2: upper body settles 1px (breathing)
  const H = 42 * s;
  const bodyY = FEET - H * .4;
  let head = { x: CX, y: FEET - H + 7 * s + bob, rx: 8 * s, ry: 7.5 * s };
  const flame = (x, y, w, h) => {      // layered flame with per-frame flicker
    curRole = R.elem; P();
    const sway = (rf() - .5) * 2.4;
    tri([x - w, y], [x + w, y], [x + sway, y - h]); ell(x, y - h * .15, w * .9, h * .32);
    tri([x - w * .9, y - h * .1], [x - w * .2, y - h * .2], [x - w * .9 + sway, y - h * .7]);
    curRole = R.core; tri([x - w * .45, y - 1], [x + w * .45, y - 1], [x + sway * .6, y - h * .58]); ell(x, y - h * .12, w * .45, h * .18);
    curRole = R.base;
  };

  /* ---------- back layer ---------- */
  if (mega) {   // Mega form: a crest of energy fins behind the body and a second wing pair
    curRole = R.elem; P();
    for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * .42, bx = CX + Math.cos(a) * 8 * s, by = bodyY - 6 * s + Math.sin(a) * 6 * s; tri([bx - 3 * s, by + 2 * s], [bx + 3 * s, by + 2 * s], [CX + Math.cos(a) * 22 * s, bodyY - 6 * s + Math.sin(a) * 19 * s]); }
    curRole = R.core; P(); for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * .42; line(CX + Math.cos(a) * 10 * s, bodyY - 6 * s + Math.sin(a) * 8 * s, CX + Math.cos(a) * 18 * s, bodyY - 6 * s + Math.sin(a) * 15 * s, 1); }
  }
  const winged = has('Flying') || (has('Dragon') && r() < .7);
  const wingLift = frame ? -2 : 0;
  if (winged && plan !== 'avian' && plan !== 'insect') {
    curRole = R.accent; P();
    for (const sx of [-1, 1]) {
      const bx = CX + sx * 5 * s, by = bodyY - 6 * s;
      tri([bx, by], [CX + sx * 23 * s, by - 14 * s + wingLift], [CX + sx * 20 * s, by + 7 * s]);
      curRole = R.membrane; tri([bx + sx * 2, by + 2], [CX + sx * 20 * s, by - 10 * s + wingLift], [CX + sx * 17 * s, by + 5 * s]); curRole = R.accent;
      line(bx, by, CX + sx * 23 * s, by - 14 * s + wingLift, 2);
    }
  }
  if (has('Water') && plan === 'quad' && r() < .55) { curRole = R.accent; P(); ell(CX, bodyY - 2 * s, 14 * s, 10 * s); for (let k = -1; k <= 1; k++) ellIn(CX + k * 7 * s, bodyY - 4 * s, 3 * s, 3 * s, R.belly); }
  const leafCollar = has('Grass') && (plan === 'quad' || plan === 'blob' || plan === 'biped') && r() < .8;
  if ((has('Ice') || has('Rock') || (t1 === 'Ground' && r() < .5)) && plan !== 'serpent') {
    curRole = has('Ice') ? R.elem : R.horn; P();
    for (let k = -1; k <= 1; k++) tri([CX + k * 7 * s - 3.5 * s, bodyY - 4 * s], [CX + k * 7 * s + (k * 1.5), bodyY - 17 * s - (k === 0 ? 4 * s : 0)], [CX + k * 7 * s + 3.5 * s, bodyY - 4 * s]);
  }
  // Tail (asymmetric, so side B mirrors it)
  if (['quad', 'biped'].includes(plan) && r() < .85) {
    curRole = R.base; P();
    const tx0 = CX + 8 * s, ty0 = bodyY + 6 * s, tx1 = CX + 20 * s, ty1 = bodyY - 8 * s;
    line(tx0, ty0, (tx0 + tx1) / 2 + 2, (ty0 + ty1) / 2 + 3, Math.max(3, 5 * s)); line((tx0 + tx1) / 2 + 2, (ty0 + ty1) / 2 + 3, tx1, ty1, Math.max(2, 3.6 * s));
    if (has('Fire')) { curRole = R.elem; for (let k = 0; k < 3; k++) { const q = .35 + k * .25; set(lerp(tx0, tx1, q), lerp(ty0, ty1, q) - 2); set(lerp(tx0, tx1, q) + 1, lerp(ty0, ty1, q) - 2); } curRole = R.dark; P(); ell(tx1, ty1, 2.6 * s, 2.6 * s); }
    else if (has('Electric')) { curRole = R.dark; P(); for (let k = 0; k < 3; k++) ell(lerp(tx0, tx1, .4 + k * .25), lerp(ty0, ty1, .4 + k * .25), 2.2 * s, 2.2 * s); curRole = R.elem; P(); ell(tx1 + 1, ty1 - 3, 3.4 * s, 3.4 * s); curRole = R.core; ell(tx1, ty1 - 4, 1.4 * s, 1.4 * s); }
    else if (has('Water')) { curRole = R.accent; P(); tri([tx1 - 3, ty1 + 2], [tx1 + 8 * s, ty1 - 6 * s], [tx1 + 7 * s, ty1 + 5 * s]); }
    else if (has('Grass')) { curRole = R.accent; P(); ell(tx1 + 2, ty1 - 3, 3.5 * s, 2.2 * s); }
    else if (has('Poison') || has('Bug')) { curRole = R.horn; P(); tri([tx1 - 2, ty1], [tx1 + 2, ty1], [tx1 + 2 * s, ty1 - 6 * s]); }
    else { curRole = R.belly; P(); ell(tx1, ty1, 2.6 * s, 2.6 * s); }
  }

  /* ---------- body plans ---------- */
  const arms = (y, len, th, fist) => {
    const sw = frame ? 1 : 0;
    for (const sx of [-1, 1]) { curRole = R.base; P(); const x0 = CX + sx * 9 * s, x1 = CX + sx * (9 + len * .55) * s; line(x0, y, x1, y + len * s + sw, th * s); if (fist) ell(x1, y + len * s + sw + 1, th * .7 * s, th * .6 * s); else { curRole = R.horn; set(x1 - 1, y + len * s + sw + th * .4 * s); set(x1 + 1, y + len * s + sw + th * .4 * s); curRole = R.base; } }
  };
  if (plan === 'biped') {
    const bulky = has('Fighting') ? 1.18 : 1;
    curRole = R.base;
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 5.5 * s, FEET - 5 * s, 3.6 * s, 5 * s); ell(CX + sx * 6.5 * s, FEET - 1.5, 4 * s, 2.2 * s); curRole = R.horn; for (let k = -1; k <= 1; k++) set(CX + sx * 6.5 * s + k * 1.6 * s, FEET); curRole = R.base; }
    P(); ell(CX, bodyY + bob * .5, 10 * s * bulky, 11.5 * s);
    ellIn(CX, bodyY + 2 * s, 6.2 * s, 7.6 * s, R.belly);
    if (has('Fighting')) { for (let x = -10; x <= 10; x++) for (let y = 0; y < 2; y++) if (get(CX + x * s, bodyY + 5 * s + y)) role[Math.floor(bodyY + 5 * s + y) * SPR + Math.floor(CX + x * s)] = R.dark; }
    arms(bodyY - 4 * s + bob, 9, 3.6 * bulky, has('Fighting'));
    head = { x: CX, y: bodyY - 14 * s + bob, rx: 8.6 * s, ry: 8 * s };
  } else if (plan === 'quad') {
    curRole = R.base;
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 10 * s, FEET - 4 * s, 3.6 * s, 4.6 * s); }
    P(); ell(CX, bodyY + 3 * s + bob * .5, 15 * s, 9.5 * s);
    ellIn(CX, bodyY + 6 * s, 8 * s, 4.5 * s, R.belly);
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 5 * s, FEET - 3 * s, 3.4 * s, 4.4 * s); curRole = R.horn; for (let k = -1; k <= 1; k++) set(CX + sx * 5 * s + k * 1.5 * s, FEET); curRole = R.base; }
    head = { x: CX, y: bodyY - 9 * s + bob, rx: 9 * s, ry: 7.6 * s };
  } else if (plan === 'avian') {
    curRole = R.accent;
    for (const sx of [-1, 1]) {
      P();
      tri([CX + sx * 6 * s, bodyY - 5 * s], [CX + sx * 24 * s, bodyY - 4 * s + wingLift], [CX + sx * 8 * s, bodyY + 9 * s]);
      for (let k = 0; k < 4; k++) ell(CX + sx * (11 + k * 3.6) * s, bodyY + (2 + k * .6) * s + (k === 3 ? wingLift : 0), 2.4 * s, 4.6 * s);
      curRole = R.belly; for (let k = 0; k < 3; k++) line(CX + sx * (9 + k * 4) * s, bodyY - 2 * s, CX + sx * (10 + k * 4) * s, bodyY + 5 * s, 1, R.belly); curRole = R.accent;
    }
    curRole = R.base; P(); ell(CX, bodyY + 1 * s, 9.5 * s, 11.5 * s);
    ellIn(CX, bodyY + 4 * s, 6 * s, 7 * s, R.belly);
    curRole = R.accent; P(); tri([CX - 4 * s, FEET - 6 * s], [CX + 4 * s, FEET - 6 * s], [CX, FEET + 1]);
    curRole = R.horn; P(); for (const sx of [-1, 1]) { line(CX + sx * 3 * s, FEET - 4, CX + sx * 4 * s, FEET, 1); set(CX + sx * 5 * s, FEET); set(CX + sx * 3 * s, FEET); }
    head = { x: CX, y: bodyY - 12 * s + bob, rx: 7.4 * s, ry: 6.8 * s };
  } else if (plan === 'serpent') {
    const ph = r() * 6; curRole = R.base;
    const segs = 8; let last = null;
    for (let i = 0; i < segs; i++) {
      const x = CX + Math.sin(i * .85 + ph) * 7 * s, y = FEET - 4 - i * 4.3 * s + (i > 4 ? bob : 0), rr = (7.4 - i * .45) * s;
      P(); ell(x, y, rr, rr * .82); ellIn(x, y + rr * .35, rr * .6, rr * .38, R.belly);
      last = { x, y, rr };
    }
    head = { x: last.x * .6 + CX * .4, y: last.y - 6 * s, rx: 8 * s, ry: 6.6 * s };
    if (has('Water') || has('Dragon')) { curRole = R.accent; P(); triM([head.x - 6 * s, head.y], [head.x - 15 * s, head.y - 7 * s], [head.x - 6 * s, head.y - 5 * s]); }
  } else if (plan === 'blob') {
    curRole = R.base; P();
    ell(CX, bodyY + 2 * s + bob * .5, 15 * s, 13 * s);
    for (const sx of [-1, 1]) ell(CX + sx * 9 * s, FEET - 1.5, 4.5 * s, 2.6 * s);
    if (has('Poison') || has('Water')) for (let k = 0; k < 3; k++) ell(CX + (k - 1) * 9 * s, FEET - 2, 2.4 * s, 3.2 * s);
    ellIn(CX, bodyY + 5 * s, 9 * s, 7 * s, R.belly);
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 15 * s, bodyY + 3 * s + (frame ? sx : 0), 3.4 * s, 4.2 * s); }
    head = { x: CX, y: bodyY - 3 * s + bob, rx: 0, ry: 0 };
  } else if (plan === 'insect') {
    curRole = R.dark;
    for (let k = 0; k < 3; k++) for (const sx of [-1, 1]) { P(); const y0 = bodyY + k * 3.4 * s; line(CX + sx * 4 * s, y0, CX + sx * 13 * s, y0 + 2 * s, 2); line(CX + sx * 13 * s, y0 + 2 * s, CX + sx * 15 * s, y0 + 8 * s + (frame && k === 1 ? 1 : 0), 1.5); }
    if (has('Flying') || r() < .5) { curRole = R.membrane; for (const sx of [-1, 1]) { P(); ell(CX + sx * 13 * s, bodyY - 9 * s + wingLift, 10 * s, 6 * s); ell(CX + sx * 11 * s, bodyY - 1 * s, 7 * s, 4 * s); } }
    curRole = R.base; P(); ell(CX, bodyY + 8 * s, 8.5 * s, 9.5 * s);
    for (let k = 0; k < 4; k++) for (let x = -9; x <= 9; x++) { const yy = Math.floor(bodyY + 3 * s + k * 3.4 * s); if (get(CX + x * s, yy) === R.base) role[yy * SPR + Math.floor(CX + x * s)] = R.accent; }
    P(); ell(CX, bodyY - 2 * s + bob, 6.5 * s, 5.5 * s);
    head = { x: CX, y: bodyY - 10 * s + bob, rx: 7 * s, ry: 6.2 * s };
  } else if (plan === 'fish') {
    curRole = R.accent;
    P(); tri([CX, bodyY + 9 * s], [CX - 9 * s, FEET + 1], [CX + 9 * s, FEET + 1]);
    P(); triM([CX - 11 * s, bodyY], [CX - 21 * s, bodyY - 8 * s + wingLift], [CX - 17 * s, bodyY + 7 * s]);
    P(); tri([CX - 4 * s, bodyY - 11 * s], [CX + 1, bodyY - 22 * s], [CX + 5 * s, bodyY - 11 * s]);
    curRole = R.base; P(); ell(CX, bodyY + bob * .5, 13 * s, 12.5 * s);
    ellIn(CX, bodyY + 5 * s, 8 * s, 6 * s, R.belly);
    for (let y = -6; y <= 6; y += 3) for (let x = -8; x <= 8; x += 4) { const xx = CX + (x + (y % 6 ? 2 : 0)) * s, yy = bodyY + y * s; if (get(xx, yy) === R.base && get(xx + 1, yy) === R.base) { set(xx, yy, R.dark); } }
    head = { x: CX, y: bodyY - 4 * s + bob, rx: 0, ry: 0 };
  } else if (plan === 'golem') {
    curRole = R.base;
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 6.5 * s, FEET - 3 * s, 5 * s, 4 * s); }
    P(); ell(CX, bodyY + 1 * s, 14 * s, 12.5 * s);
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 14 * s, bodyY - 6 * s, 6 * s, 6 * s); }
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 17 * s, bodyY + 6 * s + (frame ? 1 : 0), 4.8 * s, 6.4 * s); }
    for (let k = 0; k < 7; k++) { const x = CX + (r() - .5) * 20 * s, y = bodyY + (r() - .4) * 16 * s; if (get(x, y)) { let px = x, py = y; for (let j = 0; j < 4; j++) { if (get(px, py)) role[Math.floor(py) * SPR + Math.floor(px)] = R.dark; px += r() < .5 ? 1 : -1; py += 1; } } }
    head = { x: CX, y: bodyY - 13 * s + bob, rx: 7 * s, ry: 5.8 * s };
  } else { // floater
    curRole = R.base; P();
    ell(CX, bodyY - 3 * s + bob, 13 * s, 13 * s);
    for (let i = -2; i <= 2; i++) tri([CX + i * 5.4 * s - 3.4 * s, bodyY + 6 * s], [CX + i * 5.4 * s + 3.4 * s, bodyY + 6 * s], [CX + i * 5.4 * s + (frame ? 1 : -1), bodyY + 16 * s + (i % 2 ? 0 : 3)]);
    for (const sx of [-1, 1]) { P(); ell(CX + sx * 19 * s, bodyY + 1 * s - bob, 3.6 * s, 3.6 * s); }
    head = { x: CX, y: bodyY - 4 * s + bob, rx: 0, ry: 0 };
  }

  /* ---------- head and head features ---------- */
  const hasHead = head.rx > 0;
  const furry = ['Normal', 'Fire', 'Electric', 'Ground', 'Fighting', 'Ice'].includes(t1) && plan !== 'golem';
  if (hasHead) {
    const earStyle = r();
    if (['Normal', 'Electric', 'Fire', 'Psychic', 'Fairy', 'Ground', 'Ice', 'Poison'].includes(t1) && !['avian', 'serpent', 'insect'].includes(plan)) {
      curRole = R.base; P();
      for (const sx of [-1, 1]) {
        if (t1 === 'Electric') { curRole = R.dark; line(head.x + sx * head.rx * .4, head.y - head.ry * .7, head.x + sx * head.rx * .9, head.y - head.ry * 1.8, 1.5); curRole = R.elem; P(); ell(head.x + sx * head.rx * .95, head.y - head.ry * 1.95, 2.4 * s, 2.4 * s); set(head.x + sx * head.rx * .95, head.y - head.ry * 2.05, R.core); curRole = R.base; P(); }
        else if (earStyle < .55) { tri([head.x + sx * head.rx * .95, head.y - head.ry * .1], [head.x + sx * head.rx * 1.05, head.y - head.ry * 1.95], [head.x + sx * head.rx * .2, head.y - head.ry * .75]); curRole = R.belly; tri([head.x + sx * head.rx * .8, head.y - head.ry * .45], [head.x + sx * head.rx * .95, head.y - head.ry * 1.5], [head.x + sx * head.rx * .45, head.y - head.ry * .8]); curRole = R.base; }
        else { ell(head.x + sx * head.rx * .8, head.y - head.ry * .9, 3 * s, 3.4 * s); ellIn(head.x + sx * head.rx * .8, head.y - head.ry * .85, 1.6 * s, 2 * s, R.belly); }
      }
    }
    if (has('Dragon') || (t1 === 'Rock' && r() < .5) || (t1 === 'Ground' && plan === 'biped')) { curRole = R.horn; P(); for (const sx of [-1, 1]) { tri([head.x + sx * head.rx * .65, head.y - head.ry * .55], [head.x + sx * head.rx * 1.25, head.y - head.ry * 2.0], [head.x + sx * head.rx * .2, head.y - head.ry * .85]); } }
    curRole = R.base; P(); ell(head.x, head.y, head.rx, head.ry);
    if (furry) tufts(head.x, head.y, head.rx, head.ry, -Math.PI * .85, -Math.PI * .15, 4, 2.6 * s);
    if (plan === 'avian') { curRole = R.horn; P(); tri([head.x - 3 * s, head.y + head.ry * .15], [head.x + 3 * s, head.y + head.ry * .15], [head.x, head.y + head.ry * .15 + 6 * s]); curRole = R.accent; tufts(head.x, head.y, head.rx, head.ry, -Math.PI * .7, -Math.PI * .3, 3, 4 * s); }
    else if (plan === 'quad' || plan === 'serpent') { ellIn(head.x, head.y + head.ry * .48, head.rx * .58, head.ry * .42, R.belly); }
    else if (plan === 'insect') { curRole = R.horn; P(); for (const sx of [-1, 1]) { line(head.x + sx * 2, head.y + head.ry * .7, head.x + sx * 5 * s, head.y + head.ry + 3 * s, 2); } curRole = R.dark; for (const sx of [-1, 1]) line(head.x + sx * 2, head.y - head.ry + 1, head.x + sx * 8 * s, head.y - head.ry - 8 * s, 1); }
    if (has('Fire') && r() < .8) { for (const k of [-1, 0, 1]) flame(head.x + k * head.rx * .55, head.y - head.ry * (k ? .55 : .75), 2.6 * s, (k ? 7 : 10) * s); }
    if (leafCollar) { curRole = R.accent; P(); for (let k = 0; k < 7; k++) { const a = Math.PI * (.1 + k * .8 / 6); ell(head.x + Math.cos(a) * head.rx * 1.05, head.y + head.ry * .55 + Math.sin(a) * 3 * s, 3.4 * s, 2 * s); } }
    if (has('Grass') && plan === 'biped') { curRole = R.accent; P(); ell(head.x + 3 * s, head.y - head.ry - 2.5 * s, 4 * s, 2.2 * s); line(head.x, head.y - head.ry + 1, head.x + 3 * s, head.y - head.ry - 2 * s, 1, R.dark); }
    if (has('Water') && (plan === 'biped' || plan === 'quad') && r() < .6) { curRole = R.accent; P(); triM([head.x - head.rx * .85, head.y], [head.x - head.rx * 1.75, head.y - head.ry * .9], [head.x - head.rx * .7, head.y - head.ry * .7]); }
    if (t1 === 'Psychic' || has('Fairy')) { curRole = has('Fairy') ? R.core : R.accent; P(); ell(head.x, head.y - head.ry * .5, 1.8 * s, 1.8 * s); }
  }
  // Body markings
  if (has('Poison')) for (let i = 0; i < 6; i++) { const px = CX + (r() - .5) * 18 * s, py = bodyY + (r() - .3) * 12 * s; if (get(px, py) === R.base) ellIn(px, py, 1.8 * s, 1.5 * s, R.accent); }
  if (has('Steel')) for (const sx of [-1, 1]) for (const yy of [-3, 3]) { const x = CX + sx * 6 * s, y = bodyY + yy * s; if (get(x, y)) { role[Math.floor(y) * SPR + Math.floor(x)] = R.horn; } }
  if (has('Electric') && plan !== 'quad') for (let k = 0; k < 2; k++) { const y = bodyY - 2 * s + k * 5 * s; for (let x = -6; x <= 6; x++) { const yy = Math.floor(y + Math.abs(x % 4) - 1); if (get(CX + x * s, yy) === R.base) role[yy * SPR + Math.floor(CX + x * s)] = R.dark; } }
  if (has('Ghost') && plan === 'floater') for (const sx of [-1, 1]) ellIn(CX + sx * 5 * s, bodyY + 4 * s, 2 * s, 1.6 * s, R.dark);

  /* ---------- face ---------- */
  const ey = hasHead ? head.y + head.ry * .02 : head.y, ex = hasHead ? head.rx * .42 : 5.6 * s;
  const ew = young ? 3 : 3, eh = young ? 4 : (fierce ? 2 : 3);
  for (const sx of [-1, 1]) {
    const x0 = Math.round(CX + sx * ex - (sx < 0 ? ew : 0)), y0 = Math.round(ey - eh / 2);
    for (let y = 0; y < eh; y++) for (let x = 0; x < ew; x++) set(x0 + x, y0 + y, t1 === 'Ghost' ? R.core : R.eyeW, 250);
    const ix = sx < 0 ? x0 + ew - 2 : x0;
    for (let y = Math.max(0, eh - 3); y < eh; y++) for (let x = 0; x < 2; x++) set(ix + x, y0 + y, R.iris, 250);
    set(ix + (sx < 0 ? 1 : 0), y0 + eh - 1, R.pupil, 250);
    if (eh >= 3) set(ix + (sx < 0 ? 1 : 0), y0 + eh - 2, R.pupil, 250);
    set(ix + (sx < 0 ? 0 : 1), y0 + Math.max(0, eh - 3), R.shine, 250);
    if (fierce) for (let x = -1; x <= ew; x++) set(x0 + x, y0 - 1 - ((sx < 0 ? x : ew - 1 - x) > 1 ? 1 : 0), R.mouth, 250);
  }
  const my = ey + (hasHead ? 4 * s : 5 * s);
  if (plan !== 'avian' && plan !== 'insect') {
    if (fierce) { for (let x = -2; x <= 2; x++) set(CX + x, my, R.mouth, 250); set(CX - 2, my + 1, R.fang, 250); set(CX + 2, my + 1, R.fang, 250); }
    else if (young) { set(CX - 1, my, R.mouth, 250); set(CX + 1, my, R.mouth, 250); set(CX, my + 1, R.mouth, 250); }
    else { for (let x = -1; x <= 1; x++) set(CX + x, my, R.mouth, 250); }
  }

  /* ---------- palette ---------- */
  const jitter = (r() - .5) * 26;
  const baseHex = mega ? mix(hueShift(TYPE_COLOR[t1], jitter - 28), '#1a1830', .28) : hueShift(TYPE_COLOR[t1], jitter);
  const accHex = t2 ? hueShift(TYPE_COLOR[t2], jitter * .5) : mix(hueShift(baseHex, 150), '#e8e2d0', .25);
  const el = ELEMENT[t1] || ELEMENT.Normal, el2 = ELEMENT[t2] || el;
  const ramps = {
    [R.base]: rampOf(baseHex), [R.belly]: rampOf(mix(baseHex, '#fff4d8', .62)), [R.accent]: rampOf(accHex),
    [R.dark]: rampOf(mix(baseHex, '#1b1530', .62)), [R.horn]: rampOf('#e9dcc0'),
    [R.elem]: rampOf(has('Fire') ? ELEMENT.Fire[0] : has('Electric') ? ELEMENT.Electric[0] : has('Ice') ? ELEMENT.Ice[0] : has('Grass') ? ELEMENT.Grass[0] : el[0]),
    [R.membrane]: rampOf(mix(accHex, '#ffffff', .45))
  };
  const flatCol = { [R.eyeW]: '#ffffff', [R.iris]: IRIS[t1] || '#2a2a3a', [R.pupil]: '#0d0b16', [R.shine]: '#ffffff', [R.mouth]: mix(baseHex, '#120d1c', .8), [R.fang]: '#ffffff',
    [R.core]: has('Fire') ? ELEMENT.Fire[1] : has('Electric') ? ELEMENT.Electric[1] : has('Fairy') ? ELEMENT.Fairy[1] : el2[1] };

  /* ---------- lighting ---------- */
  const filled = i => role[i] !== 0;
  const INF = 99;
  const dG = new Float32Array(N).fill(INF), dP = new Float32Array(N).fill(INF);
  for (let i = 0; i < N; i++) if (!filled(i)) { dG[i] = 0; dP[i] = 0; }
  const relax = (D, sameFn) => {
    for (let pass = 0; pass < 2; pass++) {
      const order = pass === 0 ? [0, 1] : [1, -1];
      for (let yy = 0; yy < SPR; yy++) {
        const y = pass === 0 ? yy : SPR - 1 - yy;
        for (let xx = 0; xx < SPR; xx++) {
          const x = pass === 0 ? xx : SPR - 1 - xx, i = y * SPR + x; if (D[i] === 0) continue;
          const dir = pass === 0 ? -1 : 1;
          const nb = [[x + dir, y, 1], [x, y + dir, 1], [x + dir, y + dir, 1.41], [x - dir, y + dir, 1.41]];
          for (const [nx, ny, w] of nb) {
            if (nx < 0 || ny < 0 || nx >= SPR || ny >= SPR) { D[i] = Math.min(D[i], w); continue; }
            const j = ny * SPR + nx;
            if (sameFn && !sameFn(i, j)) { D[i] = Math.min(D[i], w); continue; }
            D[i] = Math.min(D[i], D[j] + w);
          }
        }
      }
    }
  };
  relax(dG, null);
  relax(dP, (i, j) => part[i] === part[j] || FLAT.has(role[j]) || FLAT.has(role[i]));
  const dome = t => t >= 1 ? 1 : Math.sqrt(1 - (1 - t) * (1 - t));
  const Hm = new Float32Array(N);
  for (let i = 0; i < N; i++) if (filled(i)) Hm[i] = .55 * dome(dG[i] / (7 * s + 2)) + .45 * dome(dP[i] / (4.5 * s + 1.5));
  // per-part vertical extent for a soft ambient-occlusion falloff toward the ground
  const top = {}, bot = {};
  for (let i = 0; i < N; i++) if (filled(i)) { const p = part[i], y = (i / SPR) | 0; top[p] = Math.min(top[p] ?? 99, y); bot[p] = Math.max(bot[p] ?? 0, y); }
  const L = (() => { const v = [-.5, -.68, .55], m = Math.hypot(...v); return v.map(c => c / m); })();
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const idx = new Int8Array(N).fill(-1);
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    const i = y * SPR + x; if (!filled(i) || FLAT.has(role[i])) continue;
    const h = (xx, yy) => (xx < 0 || yy < 0 || xx >= SPR || yy >= SPR) ? 0 : Hm[yy * SPR + xx];
    let nx = (h(x - 1, y) - h(x + 1, y)) * 1.6, ny = (h(x, y - 1) - h(x, y + 1)) * 1.6, nz = .42;
    const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m;
    let I = .16 + .84 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const p = part[i], span = Math.max(1, bot[p] - top[p]);
    I -= .16 * Math.max(0, (y - top[p]) / span - .45);
    I += (BAYER[(y & 3) * 4 + (x & 3)] / 16 - .5) * .09;
    let k = I < .33 ? 0 : I < .52 ? 1 : I < .74 ? 2 : I < .9 ? 3 : 4;
    if (k === 0 && dG[i] > 2.5) k = 1;               // keep deep shadow to the edges
    idx[i] = k;
  }
  // inner contour: a part sitting behind a later-drawn part gets a dark line along that edge
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    const i = y * SPR + x; if (idx[i] < 0) continue;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= SPR || ny >= SPR) continue;
      const j = ny * SPR + nx;
      if (filled(j) && !FLAT.has(role[j]) && part[j] > part[i] && part[j] !== 250) { idx[i] = 0; break; }
    }
  }

  /* ---------- compose with colored selective outline + rim light ---------- */
  const cv = document.createElement('canvas'); cv.width = cv.height = SPR;
  const cx = cv.getContext('2d'), img = cx.createImageData(SPR, SPR);
  const put = (i, hex) => { const [a, b, c] = hexToRgb(hex); img.data[i * 4] = a; img.data[i * 4 + 1] = b; img.data[i * 4 + 2] = c; img.data[i * 4 + 3] = 255; };
  const RIM = mega ? '#ff9cf0' : '#cfe4ff';
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    const i = y * SPR + x;
    if (filled(i)) {
      const rl = role[i];
      if (FLAT.has(rl)) { put(i, flatCol[rl]); continue; }
      const ramp = ramps[rl] || ramps[R.base]; let col = ramp[idx[i]];
      const emptyR = x + 1 >= SPR || !filled(i + 1), emptyB = y + 1 >= SPR || !filled(i + SPR);
      if ((emptyR || emptyB) && idx[i] <= 1) col = mix(ramp[2], RIM, .38);
      put(i, col);
    } else {
      let nb = -1, dirTop = false;
      for (const [nx, ny, t] of [[x, y + 1, true], [x + 1, y, true], [x, y - 1, false], [x - 1, y, false]]) {
        if (nx < 0 || ny < 0 || nx >= SPR || ny >= SPR) continue;
        const j = ny * SPR + nx; if (filled(j)) { if (nb < 0 || t) { nb = j; dirTop = t; } }
      }
      if (nb < 0) continue;
      const rl = role[nb], ramp = ramps[rl] || ramps[R.base];
      put(i, dirTop ? mix(ramp[0], '#140f22', .45) : mix(ramp[0], '#07050d', .72));
    }
  }
  cx.putImageData(img, 0, 0);
  // portrait framing around the face
  const hr = hasHead ? Math.max(head.rx, head.ry) : 12 * s;
  const ps = Math.round(clamp(hr * 2.9, 16, SPR));
  void FEET;
  const crop = { x: clamp(Math.round(head.x - ps / 2), 0, SPR - ps), y: clamp(Math.round(head.y - ps * .55), 0, SPR - ps), s: ps };
  return { canvas: cv, crop, plan };
}

/* ---------- sprite cache, variants, and the custom sprite pack ---------- */
// Custom sprites live in ./sprites/ as animated GIFs named after the Pokémon:
//   front: "mew.gif"   (faces LEFT, toward the viewer)
//   back:  "mew (1).gif"   (faces RIGHT, away from the viewer)
// Special names: nidoran-f, nidoran-m, mr-mime, farfetchd. Optional Mega forms:
// "charizard-mega.gif" and "charizard-mega (1).gif". A PNG with the same name is used if no GIF exists.
const SPRITE_CACHE = {};
const CUSTOM = {}, CUSTOM_MEGA = {};          // name → { front: anim, back: anim | null }
const FILE_MODE = location.protocol === 'file:';   // file:// pages cannot read file bytes; the browser animates the GIF instead
/* Team picks may carry a variant: "Pikachu|shiny". Shiny art: <slug>_shiny.gif (front) and <slug>_shiny (1).gif (back),
   loaded the first time a shiny is needed; until then (or if there is none) the normal sprite is used. */
const pickBase = n => String(n).split('|')[0];
const pickShiny = n => String(n).split('|')[1] === 'shiny';
const pickLabel = n => pickBase(n) + (pickShiny(n) ? ' \u2728' : '');
const CUSTOM_SHINY = {}, SHINY_LOADS = {};
function loadShiny(name) {
  name = pickBase(name);
  if (!SHINY_LOADS[name]) SHINY_LOADS[name] = (async () => {
    const slug = spriteSlug(name), front = await loadAnim(slug + '_shiny'); if (!front) return false;
    CUSTOM_SHINY[name] = { front, back: await loadAnim(slug + '_shiny (1)') };
    delete SPRITE_CACHE[name + '#S']; if (typeof onSpritesChanged === 'function') onSpritesChanged(); return true;
  })();
  return SHINY_LOADS[name];
}
function spriteSlug(name) {
  name = pickBase(name);
  return name.toLowerCase().replace('♀', '-f').replace('♂', '-m').replace(/[’'.]/g, '').replace(/\s+/g, '-');
}
const spriteUrl = file => 'sprites/' + encodeURIComponent(file);
// Bounding box of the opaque pixels across a sample of frames (fails quietly on tainted images).
function measureFrames(frames, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1, f0 = null;
  try {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
    const step = Math.max(1, Math.floor(frames.length / 12));
    for (let k = 0; k < frames.length; k += step) {
      x.clearRect(0, 0, w, h); x.drawImage(frames[k], 0, 0); const d = x.getImageData(0, 0, w, h).data;
      let a = w, b = h, cc = -1, dd = -1;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 20) { if (i < a) a = i; if (j < b) b = j; if (i > cc) cc = i; if (j > dd) dd = j; }
      if (cc < 0) continue; if (!f0) f0 = [a, b, cc, dd];
      x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, cc); y1 = Math.max(y1, dd);
    }
  } catch (e) { /* tainted: fall through to defaults */ }
  if (x1 < 0) { x0 = Math.round(w * .12); x1 = Math.round(w * .88); y0 = Math.round(h * .2); y1 = h - 2; f0 = [x0, y0, x1, y1]; }
  return { x0, y0, x1, y1, f0 };
}
function finishAnim(a) {
  const { w, h } = a, m = measureFrames(a.frames, w, h);
  a.foot = h - 1 - m.y1; a.cx = Math.round((m.x0 + m.x1 + 1) / 2);
  const cw = m.x1 - m.x0 + 1, ch = m.y1 - m.y0 + 1, cs = Math.min(Math.max(cw, ch) + 4, Math.max(w, h));
  a.card = { x: Math.round((m.x0 + m.x1) / 2 - cs / 2), y: Math.round(m.y1 + 2 - cs), s: cs };
  const [fx0, fy0, fx1, fy1] = m.f0, ps = Math.max(12, Math.round(Math.min(fx1 - fx0 + 1, fy1 - fy0 + 1) * .72));
  a.crop = { x: fx0 + Math.round((fx1 - fx0) * .04), y: fy0 - 2, s: ps };        // the face sits upper-left on a left-facing sprite
  a.cum = []; let t = 0; for (const d of a.delays) { t += d; a.cum.push(t); } a.total = t || 1;
  return a;
}
// Decoded lazily: bytes are kept until the sprite is first drawn.
function ensureAnim(a) {
  if (!a || a.frames) return a;
  try { const g = decodeGif(a.buf); a.frames = g.frames; a.delays = g.delays; a.w = g.W; a.h = g.H; }
  catch (e) { a.frames = [a.fallbackImg || document.createElement('canvas')]; a.delays = [1e9]; a.w = a.frames[0].width || 1; a.h = a.frames[0].height || 1; }
  a.buf = null; return finishAnim(a);
}
function animFromImage(img, live) {   // PNG, or a GIF the browser animates by itself (file:// pages)
  if (live) liveHolder().appendChild(img);
  return finishAnim({ frames: [img], delays: [1e9], w: img.naturalWidth, h: img.naturalHeight, live });
}
function liveHolder() {
  let el = document.getElementById('spriteHolder');
  if (!el) { el = document.createElement('div'); el.id = 'spriteHolder'; el.setAttribute('aria-hidden', 'true'); el.style.cssText = 'position:fixed;left:0;top:0;opacity:.004;pointer-events:none;z-index:2147483647;display:flex;flex-wrap:wrap;width:1px'; document.body.appendChild(el); }
  return el;
}
function animFrameIndex(a, t) {
  if (a.frames.length < 2) return 0;
  const tt = ((t % a.total) + a.total) % a.total; let lo = 0, hi = a.cum.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (a.cum[mid] > tt) hi = mid; else lo = mid + 1; }
  return lo;
}
const loadImg = file => new Promise(res => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = spriteUrl(file); });
/* Clean up sprite art that has a painted-on "transparency" checkerboard (white and grey squares that are really pixels):
   detect the checker's square size and two colours from the corner, clear only pixels that match the expected checker colour
   at their position and connect to the edge (so the sprite's own white and grey blocks survive), crop to the sprite, and scale
   it to a standard sprite size (about 60 px of content in a 96 px frame, like the GIF sprites) with crisp pixel scaling. */
function cleanSpriteArt(img) {
  const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height; if (!W || !H) return img;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const id = x.getImageData(0, 0, W, H), d = id.data, at = (px, py) => (py * W + px) * 4;
  const lightK = k => d[k + 3] > 200 && Math.min(d[k], d[k + 1], d[k + 2]) > 140 && Math.max(d[k], d[k + 1], d[k + 2]) - Math.min(d[k], d[k + 1], d[k + 2]) < 30;
  const lum = k => (d[k] + d[k + 1] + d[k + 2]) / 3;
  if (lightK(at(0, 0))) {
    // the checker's two shades: the lightest and darkest common light shades along the edges
    const edge = []; for (let px = 0; px < W; px++) edge.push(at(px, 0), at(px, H - 1)); for (let py = 0; py < H; py++) edge.push(at(0, py), at(W - 1, py));
    const hist = new Map(); for (const k of edge) if (lightK(k)) { const v = Math.round(lum(k) / 4) * 4; hist.set(v, (hist.get(v) || 0) + 1); }
    const peaks = [...hist.entries()].sort((a, b) => b[1] - a[1]); const hi = peaks[0] ? peaks[0][0] : 255; let loL = hi; for (const [v, n] of peaks) if (Math.abs(v - hi) >= 16 && n > peaks[0][1] * .15) { loL = v; break; }
    const Lh = Math.max(hi, loL), Ll = Math.min(hi, loL), isChecker = Lh - Ll >= 16, mid = (Lh + Ll) / 2;
    // the square size (fractional, survives resizing) and offset, from where the shade flips along the top row and left column
    const flips = (len, get) => { const out = []; let prev = null; for (let t = 0; t < len; t++) { const k = get(t); if (!lightK(k)) { prev = null; continue; } const cls = lum(k) >= mid; if (prev !== null && cls !== prev) out.push(t - .5); prev = cls; } return out; };
    const fx = flips(W, t => at(t, 0)), fy = flips(H, t => at(0, t));
    const sizeOf = f => { if (f.length < 3) return 0; const gaps = []; for (let k = 1; k < f.length; k++) gaps.push(f[k] - f[k - 1]); gaps.sort((a, b) => a - b); const med = gaps[gaps.length >> 1]; const ok = gaps.filter(g => Math.abs(g - med) <= Math.max(1.5, med * .12)); return (f[f.length - 1] - f[0]) / Math.round((f[f.length - 1] - f[0]) / med) || med; };
    const S = sizeOf(fx) || sizeOf(fy) || 0, ox = fx.length ? fx[0] : 0, oy = fy.length ? fy[0] : 0;
    const darkFirst = !(lum(at(0, 0)) >= mid);   // the shade of the corner square
    const parity = (px, py) => (Math.floor((px - ox) / S) + Math.floor((py - oy) / S) + 4000) % 2, p0 = S ? parity(0, 0) : 0, cornerLight = !darkFirst;
    const expectLight = (px, py) => (parity(px, py) === p0 ? cornerLight : !cornerLight);   // squares with the corner's parity share its shade
    const nearEdge = (px, py) => { if (!S) return false; const ex = ((px - ox) % S + S) % S, ey = ((py - oy) % S + S) % S; return Math.min(ex, S - ex) < 1.6 || Math.min(ey, S - ey) < 1.6; };
    const matches = (px, py) => { const k = at(px, py); if (d[k + 3] < 16) return true; if (!lightK(k)) return false; const L = lum(k);
      if (!isChecker || !S) return Math.abs(L - Lh) < 14 || Math.abs(L - Ll) < 14;
      if (L < Ll - 14 || L > Lh + 14) return false;
      if (nearEdge(px, py)) {                     // near a square boundary: accept only a genuine blend, not a solid block crossing the line
        if (L > Ll + 6 && L < Lh - 6) return true;
        let sawHi = false, sawLo = false; for (let ay = Math.max(0, py - 2); ay <= Math.min(H - 1, py + 2); ay++) for (let ax = Math.max(0, px - 2); ax <= Math.min(W - 1, px + 2); ax++) { const kk = at(ax, ay); if (!lightK(kk)) continue; const LL = lum(kk); if (Math.abs(LL - Lh) < 10) sawHi = true; else if (Math.abs(LL - Ll) < 10) sawLo = true; }
        if (sawHi && sawLo) return true; }
      const wantLight = expectLight(px, py); return wantLight ? Math.abs(L - Lh) < 14 : Math.abs(L - Ll) < 14; };
    // first pass: clear the checker from the edges inward
    const gone = new Uint8Array(W * H), stack = [];
    for (let px = 0; px < W; px++) stack.push(px, 0, px, H - 1); for (let py = 0; py < H; py++) stack.push(0, py, W - 1, py);
    while (stack.length) { const py = stack.pop(), px = stack.pop(); if (px < 0 || py < 0 || px >= W || py >= H) continue; const n = py * W + px; if (gone[n]) continue; if (!matches(px, py)) continue;
      gone[n] = 1; stack.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1); }
    for (let n = 0; n < W * H; n++) if (gone[n]) d[n * 4 + 3] = 0;
    // second pass: holes inside the sprite where the checker shows through. Among the light pixels that match the predicted
    // pattern, group neighbours; a group holding both checker shades (in their alternating places) is real checkerboard and goes.
    // A sprite block is one solid shade, so a group made only from it stays.
    if (isChecker && S) { const mark = new Uint8Array(W * H);
      for (let n0 = 0; n0 < W * H; n0++) { if (mark[n0] || d[n0 * 4 + 3] < 16) continue; const px0 = n0 % W, py0 = n0 / W | 0; if (!matches(px0, py0)) continue;
        const list = [], q = [n0]; mark[n0] = 1; let nh = 0, nl = 0;
        while (q.length) { const n = q.pop(); list.push(n); const L = lum(n * 4); if (Math.abs(L - Lh) < 10) nh++; else if (Math.abs(L - Ll) < 10) nl++; const px = n % W, py = n / W | 0;
          for (const [ax, ay] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) { if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue; const m = ay * W + ax; if (!mark[m] && d[m * 4 + 3] >= 16 && matches(ax, ay)) { mark[m] = 1; q.push(m); } } }
        const tot = list.length; if (tot >= 24 && nh >= tot * .12 && nl >= tot * .12) for (const n of list) d[n * 4 + 3] = 0; } }
    { const comp = new Uint8Array(W * H);                // tiny leftover light specks
      for (let n0 = 0; n0 < W * H; n0++) { if (comp[n0] || d[n0 * 4 + 3] < 16 || !lightK(n0 * 4)) continue; const list = [], q = [n0]; comp[n0] = 1; let hit = 0;
        while (q.length) { const n = q.pop(); list.push(n); const px = n % W, py = n / W | 0; if (matches(px, py)) hit++;
          for (const [ax, ay] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) { if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue; const m = ay * W + ax; if (!comp[m] && d[m * 4 + 3] >= 16 && lightK(m * 4)) { comp[m] = 1; q.push(m); } } }
        if (list.length < W * H * .002 && hit >= list.length * .5) for (const n of list) d[n * 4 + 3] = 0; } }
    // last pass: peel up to two layers of in-between (blended) light pixels off the cleared area — the halo resizing leaves around the
    // sprite. A solid white or grey sprite pixel is one of the two pure shades, so it is not peeled.
    for (let it = 0; it < 2; it++) { const peel = [];
      for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) { const k = at(px, py); if (d[k + 3] < 16 || !lightK(k)) continue; const L = lum(k); if (!(L > Ll + 4 && L < Lh - 4) && !(L > Lh + 4)) continue;
        if ((px > 0 && d[k - 4 + 3] < 16) || (px < W - 1 && d[k + 4 + 3] < 16) || (py > 0 && d[k - W * 4 + 3] < 16) || (py < H - 1 && d[k + W * 4 + 3] < 16)) peel.push(k); }
      for (const k of peel) d[k + 3] = 0; }
    x.putImageData(id, 0, 0);
  }
  cleanSpriteArt.last = c;   // kept for checking the cleanup
  // crop to the sprite
  let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) if (d[at(px, py) + 3] > 16) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  if (x1 < 0) return img;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, k = 56 / Math.max(cw, ch), ow = Math.max(1, Math.round(cw * k)), oh = Math.max(1, Math.round(ch * k));
  const out = document.createElement('canvas'); out.width = out.height = 96; const o = out.getContext('2d'); o.imageSmoothingEnabled = k > 1 ? false : true; o.imageSmoothingQuality = 'high';
  o.drawImage(c, x0, y0, cw, ch, Math.round((96 - ow) / 2), 96 - 4 - oh, ow, oh);
  out.naturalWidth = 96; out.naturalHeight = 96; return out;
}
async function loadAnim(base) {
  if (/^missingno(_shiny)?( \(1\))?$/.test(base)) { const png = await loadImg(base + '.png'); if (png) return animFromImage(cleanSpriteArt(png), false); }   // MissingNo.'s front/back art is PNG (cleaned up)
  if (!FILE_MODE) {
    try { const r = await fetch(spriteUrl(base + '.gif')); if (r.ok) return { buf: await r.arrayBuffer() }; } catch (e) { }
  } else {
    const gif = await loadImg(base + '.gif'); if (gif) return animFromImage(gif, true);
  }
  const png = await loadImg(base + '.png'); return png ? animFromImage(png, false) : null;
}
function loadCustomPack() {
  const changed = name => { for (const k of [name, name + '#M']) delete SPRITE_CACHE[k]; if (typeof onSpritesChanged === 'function') onSpritesChanged(); };
  for (const d of DEX) {
    const slug = spriteSlug(d.name);
    loadAnim(slug).then(async front => {
      if (!front) return;
      const pack = CUSTOM[d.name] = { front, back: null }; changed(d.name);      // show the front as soon as it is ready
      const back = await loadAnim(slug + ' (1)'); if (back) { pack.back = back; changed(d.name); }
      if (MEGA_ABLE.has(d.name)) { const mf = await loadAnim(slug + '-mega'); if (mf) { CUSTOM_MEGA[d.name] = { front: mf, back: await loadAnim(slug + '-mega (1)') }; changed(d.name); } }
    });
  }
}
// Decode both views for a team ahead of time (one sprite per tick) so the first back-view never stutters.
function warmSprites(names) {
  const q = []; for (const n of names) for (const pack of [CUSTOM[n], CUSTOM_MEGA[n]]) if (pack) { q.push(pack.front); if (pack.back) q.push(pack.back); }
  const step = () => { const a = q.shift(); if (!a) return; ensureAnim(a); setTimeout(step, 16); }; setTimeout(step, 0);
}
function variant(src, kind, color) {
  const c = document.createElement('canvas'); c.width = src.width || src.naturalWidth; c.height = src.height || src.naturalHeight; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  if (kind === 'gray') { x.filter = 'grayscale(1) brightness(.7)'; x.drawImage(src, 0, 0); return c; }
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c;
}
// Scratch canvas for flashes and tints on animated frames (drawn immediately, never cached).
const _scr = document.createElement('canvas'), _sx = _scr.getContext('2d');
function frameFx(src, w, h, kind, color) {
  if (_scr.width !== w || _scr.height !== h) { _scr.width = w; _scr.height = h; } else _sx.clearRect(0, 0, w, h);
  _sx.imageSmoothingEnabled = false; _sx.globalCompositeOperation = 'source-over';
  if (kind === 'gray') { _sx.filter = 'grayscale(1) brightness(.7)'; _sx.drawImage(src, 0, 0); _sx.filter = 'none'; return _scr; }
  _sx.drawImage(src, 0, 0); _sx.globalCompositeOperation = 'source-in'; _sx.fillStyle = color; _sx.fillRect(0, 0, w, h); _sx.globalCompositeOperation = 'source-over'; return _scr;
}
function spriteOf(name, mega = false, shiny = false) {
  if (String(name).includes('|')) { shiny = shiny || pickShiny(name); name = pickBase(name); }
  if (shiny && !mega) { if (!CUSTOM_SHINY[name]) { loadShiny(name); return spriteOf(name, false, false); } }
  else shiny = false;
  const key = name + (mega ? '#M' : '') + (shiny ? '#S' : '');
  if (SPRITE_CACHE[key]) return SPRITE_CACHE[key];
  const d = DEX_BY_NAME[name], pack = shiny ? CUSTOM_SHINY[name] : mega ? (CUSTOM_MEGA[name] || CUSTOM[name]) : CUSTOM[name];
  let sp;
  if (pack) {
    const f = ensureAnim(pack.front), first = f.frames[0];
    sp = { custom: true, front: pack.front, back: pack.back, w: f.w, h: f.h, foot: f.foot, frames: [first, first], crop: f.crop, card: f.card, megaGlow: mega && !CUSTOM_MEGA[name], tints: {} };
    sp.white = [variant(first, 'tint', '#ffffff')]; sp.white[1] = sp.white[0]; sp.gray = variant(first, 'gray');
  } else {
    const grid = (GIANT.has(name) || mega) ? 80 : 56, a = generateSprite(d, 0, { grid, mega }), b = generateSprite(d, 1, { grid, mega });
    sp = { custom: false, w: grid, h: grid, foot: 2, frames: [a.canvas, b.canvas], crop: a.crop, card: { x: 0, y: 0, s: grid }, tints: {} };
    sp.white = [variant(a.canvas, 'tint', '#ffffff'), variant(b.canvas, 'tint', '#ffffff')]; sp.gray = variant(a.canvas, 'gray');
  }
  sp.size = sp.w; SPRITE_CACHE[key] = sp; return sp;
}
function tintOf(name, color, f = 0, mega = false, shiny = false) { const sp = spriteOf(name, mega, shiny), k = color + f; if (!sp.tints[k]) sp.tints[k] = variant(sp.frames[f], 'tint', color); return sp.tints[k]; }
// Draws a sprite into a small UI canvas (portraits, roster cards, VS screen, results) using the front view.
// Custom art is copied 1:1 and the canvas is resized to match, so CSS scales it crisply.
function drawSpriteTo(canvas, name, opts = {}) {
  const sp = spriteOf(name, opts.mega, opts.shiny), src = opts.gray ? sp.gray : sp.frames[0];
  const r = opts.portrait ? sp.crop : sp.card;
  if (sp.custom) { canvas.width = r.s; canvas.height = r.s; }
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
  if (opts.bg) { c.fillStyle = opts.bg; c.fillRect(0, 0, canvas.width, canvas.height); }
  c.save();
  if (sp.custom && opts.faceRight) { c.translate(canvas.width, 0); c.scale(-1, 1); }   // front art faces left; mirror for Red's side
  c.drawImage(src, r.x, r.y, r.s, r.s, 0, 0, canvas.width, canvas.height);
  c.restore();
}

/* ---------- Trainers: original 16×24 pixel designs ---------- */
const TRAINER_ART = {
  A: { pal: { o: '#151626', R: '#d8323e', r: '#9b1f2c', h: '#ff6f74', s: '#f2c39c', S: '#d09774', k: '#1c1d2e', g: '#5fd2ff', w: '#f4f4f6', p: '#3a4058', b: '#22242f', f: '#e9e4da' },
    rows: ['.....oooooo.....', '....oRRRRRRo....', '...oRhRRRRRRo...', '..oRhRRRRRRRRo..', '..oRoggoooggoo..', '..oRogwgogwgRo..', '..oRfssssssfRo..', '..oRfskssksfRo..', '..oRfssSSssfRo..', '...offffffffo...', '..oRRRRwwRRRRo..', '.oRhRRRwwRRRrRo.', '.oRhRRRwwRRRrRo.', 'okRRRRRwwRRRRrko', 'okkRRRRwwRRRRkko', '.ooRRRRRRRRRRoo.', '..oRRRRRRRRRRo..', '..offffffffffo..', '...oppppopppo...', '...oppppopppo...', '...oppppopppo...', '...obbboobbbo...', '..obbbbooobbbbo.', '..oooooo.oooooo.'] },
  B: { pal: { o: '#151626', Y: '#f2b524', y: '#b97d10', h: '#ffe07a', s: '#f0c29a', S: '#cc946f', k: '#24202b', t: '#1d9aa0', T: '#5fd7d0', w: '#f4f4f6', p: '#2e3b66', b: '#1f2230', c: '#e3463f' },
    rows: ['......oTTo......', '.....oTTTTo.....', '....oTTTTTTo....', '...otttttttto...', '...otTtTtTtTo...', '...okkkkkkkko...', '...okssssssko...', '...osskssksso...', '...osssSSssso...', '....osssssso....', '..occccccccco...', '.oYYYcccccYYYo..', 'oYhYYYooYYYYyYo.', 'oYhYYYwoYYYYyYo.', 'oYhYYYwoYYYYyYo.', 'okYYYYwoYYYYyko.', '.oYYYYooYYYYYo..', '..oyyyyyyyyyyo..', '...oppppopppo...', '...oppppopppo...', '...oppppopppo...', '...obbboobbbo...', '..obbbbooobbbbo.', '..oooooo.oooooo.'] }
};
const TRAINER_CANVAS = {};
function trainerCanvas(side) {
  if (TRAINER_CANVAS[side]) return TRAINER_CANVAS[side];
  const art = TRAINER_ART[side], c = document.createElement('canvas'); c.width = 16; c.height = 24;
  const x = c.getContext('2d');
  art.rows.forEach((row, y) => { for (let i = 0; i < 16; i++) { const ch = (row[i] || '.'); if (ch === '.' || ch === ' ') continue; x.fillStyle = art.pal[ch] || '#ff00ff'; x.fillRect(i, y, 1, 1); } });
  TRAINER_CANVAS[side] = c; return c;
}
