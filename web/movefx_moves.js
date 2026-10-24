/* =====================================================================
   Section 8c: one animation recipe per move
   Hooks: charge (wind-up), exec (release), dash (each frame while
   charging in), shot (projectile drawing), beam, mark (ground strike),
   wave (shockwave drawing), impact (on hit). Missing hooks fall back to
   the generic effects.
   ===================================================================== */
const MFX = {};
const def = (names, r) => { for (const n of names.split('|')) MFX[n] = Object.assign({}, MFX[n] || {}, r); };
const shotAng = p => Math.atan2(p.vy, p.vx);

/* ---------- reusable building blocks ---------- */
const CH = {
  gather: (ramp, n = 16, r = 46, shape = 'sq') => S => { const h = headOf(S); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28; P(h.x + Math.cos(a) * r, h.y + 10 + Math.sin(a) * r * .8, { vx: -Math.cos(a) * r * 3.5, vy: -Math.sin(a) * r * 2.8, life: 280, ramp, shape, size: 1, add: true }); } },
  rise: (ramp, n = 14, shape = 'sq') => S => { const f = footOf(S); emit(f.x, f.y - 4, n, { r: 22, ang: -Math.PI / 2, spread: .5, speed: [60, 140], life: [300, 520], ramp, shape, size: [1, 2], add: true }); },
  orb: (ramp, r = 5, ms = 300) => S => ent(ms, q => { const h = headOf(S); orbPx(bx(h.x + side(S).face * 14), by(h.y - 4), r * Math.min(1, q * 1.5), ramp, clock.t); }),
  crackle: (col = '#ffe04a') => S => ent(320, () => { const h = headOf(S); for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28, r = 14 + Math.random() * 10; zig(bx(h.x + Math.cos(a) * r), by(h.y + 10 + Math.sin(a) * r), bx(h.x + Math.cos(a + .7) * (r + 8)), by(h.y + 10 + Math.sin(a + .7) * (r + 8)), col, 1, 2); } }),
  fist: (col, s = 1) => S => ent(260, q => { const h = headOf(S); fistPx(bx(h.x + side(S).face * (18 - q * 6)), by(h.y + 14), s, col, side(S).face); glow(bx(h.x + side(S).face * 16), by(h.y + 14), 8, col, .4 * (1 - q)); })
};
const DASH = {
  trail: (ramp, shape = 'sq', n = 3, size = [1, 2]) => S => { const sd = side(S); emit(sd.x, sd.y - 30, n, { r: 16, speed: [10, 50], life: [200, 380], ramp, shape, size, add: true }); },
  engulf: (ramp, n = 5) => S => { const sd = side(S); emit(sd.x, sd.y - 34, n, { r: 22, ang: -Math.PI / 2, spread: 1.2, speed: [40, 130], life: [220, 420], ramp, size: [1, 3], add: true }); },
  speed: col => S => { const sd = side(S); speedLines(sd.x, sd.y - 30, sd.face > 0 ? 0 : Math.PI, 3, 30, col); },
  dust: () => S => { VFX.dust(S); const sd = side(S); emit(sd.x, sd.y, 2, { r: 10, ang: -Math.PI / 2, spread: 2, speed: [20, 60], life: 400, ramp: 'dust', size: [2, 3] }); }
};
const IMP = {
  burst: (ramp, n = 20, sp = [80, 260], shape = 'sq', size = [1, 2]) => S => { const h = headOf(S); emit(h.x, h.y + 10, n, { speed: sp, life: [300, 600], ramp, shape, size, g: 160, drag: 1.5, add: true }); },
  pow: (col = '#ffffff', r = 16) => S => { const h = headOf(S), dx = (Math.random() - .5) * 14; ent(300, q => powStar(bx(h.x + dx), by(h.y + 6), r, col, q)); },
  ring: (col, r1 = 70, w = 2) => S => { const h = headOf(S); ent(380, q => aRing(bx(h.x), by(h.y + 12), (8 + r1 * Ease.outQ(q)) / 2, (8 + r1 * Ease.outQ(q)) / 3.2, col, 1 - q, w)); },
  explode: (ramp, r = 22) => S => { const h = headOf(S), R = RR(ramp); ent(520, q => { const rr = r * Ease.outQ(Math.min(1, q * 1.6)); glow(bx(h.x), by(h.y + 8), rr * 1.4, R[3], .6 * (1 - q)); aDisc(bx(h.x), by(h.y + 8), rr * (1 - q * .6), rampAt(R, q * .8), 1 - q); });
    emit(h.x, h.y + 8, 26, { speed: [60, 280], life: [400, 800], ramp, size: [2, 3], size2: 1, drag: 2, add: true }); emit(h.x, h.y + 8, 10, { speed: [20, 70], life: [600, 1000], ramp: 'smoke', size: [3, 4], vy: -30 }); },
  claws: (col, n = 3, len = 26, w = 2) => S => { const h = headOf(S), f = -side(S).face; ent(360, q => { for (let k = 0; k < n; k++) slashPx(bx(h.x - 10 + k * 8 * f), by(h.y + 8 + k * 2), Math.PI * .35 * f + Math.PI / 2, len, col, w, q); }); },
  xslash: (col, len = 34) => S => { const h = headOf(S); ent(420, q => { slashPx(bx(h.x), by(h.y + 8), Math.PI * .25, len, col, 3, q); slashPx(bx(h.x), by(h.y + 8), Math.PI * .75, len, col, 3, Math.max(0, q - .12)); }); },
  jaws: (col = '#ffffff', w = 22) => S => { const h = headOf(S); ent(380, q => { jawsPx(bx(h.x), by(h.y + 8), q, col, w); if (q > .55) powStar(bx(h.x), by(h.y + 8), 12, '#ffffff', (q - .55) / .45); }); },
  fist: (col, s = 2, extra) => S => { const h = headOf(S), f = side(other(S)).face; ent(320, q => { fistPx(bx(h.x - f * (14 - q * 10)), by(h.y + 8), s, col, f); if (q > .3) powStar(bx(h.x), by(h.y + 8), 16, '#ffffff', (q - .3) / .7); }); if (extra) extra(S); },
  splash: (n = 24) => S => { const h = headOf(S); emit(h.x, h.y + 6, n, { ang: -Math.PI / 2, spread: 2.4, speed: [80, 240], g: 520, life: [400, 700], ramp: 'water', shape: 'drop', size: [1, 2] }); },
  shatter: (n = 14) => S => { const h = headOf(S); emit(h.x, h.y + 6, n, { speed: [90, 260], g: 380, life: [400, 700], ramp: 'ice', shape: 'shard', size: [1, 2], spin: 12 }); },
  zap: (n = 4, col = '#ffe04a') => S => { const h = headOf(S); ent(300, () => { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28; zig(bx(h.x), by(h.y + 8), bx(h.x + Math.cos(a) * 36), by(h.y + 8 + Math.sin(a) * 26), col, 2, 3, '#ffffff'); } }); },
  leaves: (n = 16) => S => { const h = headOf(S); emit(h.x, h.y + 8, n, { speed: [60, 200], life: [500, 800], ramp: 'grass', shape: 'leaf', size: [1, 2], spin: 8, drag: 1.5, g: 60 }); },
  rocks: (n = 10) => S => { const h = headOf(S); emit(h.x, h.y + 12, n, { ang: -Math.PI / 2, spread: 2.2, speed: [80, 220], g: 520, life: [500, 800], ramp: 'rock', size: [2, 3] }); },
  toxic: () => S => { const h = headOf(S); emit(h.x, h.y + 8, 14, { speed: [30, 120], life: [500, 900], ramp: 'poison', shape: 'bubble', size: [1, 3], vy: -40, drag: 1 }); },
  sparkle: (ramp = 'fairy', n = 16) => S => { const h = headOf(S); emit(h.x, h.y + 6, n, { r: 20, speed: [20, 90], life: [400, 800], ramp, shape: 'star', size: [1, 2], add: true }); },
  dust: (n = 12) => S => { const f = footOf(S); emit(f.x, f.y - 4, n, { r: 14, ang: -Math.PI / 2, spread: 2.5, speed: [30, 110], life: [500, 900], ramp: 'dust', size: [2, 4], drag: 2 }); }
};
const both = (...fns) => (...a) => fns.forEach(f => f && f(...a));
const SHOT = {
  orb: (ramp, r = 4, trail = 'sq') => p => { const i = bx(p.x), j = by(p.y); orbPx(i, j, r, ramp, clock.t); if (Math.random() < .8) P(p.x, p.y, { vx: -p.vx * .1, vy: -p.vy * .1, life: 260, ramp, shape: trail, size: 2, size2: 1, add: true }); },
  fireball: (r = 4) => p => { const i = bx(p.x), j = by(p.y); glow(i, j, r * 2.4, '#ff8a1f', .5); aDisc(i, j, r + (Math.random() < .5 ? 1 : 0), '#f0561c'); aDisc(i - 1, j - 1, r * .7, '#ffd23f'); aDisc(i - 1, j - 1, r * .35, '#ffffff');
    emit(p.x, p.y, 3, { r: 3, speed: [10, 50], vx: -p.vx * .15, vy: -p.vy * .15 - 20, life: [200, 420], ramp: 'fire', size: [1, 3], size2: 1, add: true }); },
  bubbles: () => p => { const t = clock.t / 80; for (let k = 0; k < 3; k++) { const i = bx(p.x + Math.cos(t + k * 2) * 6), j = by(p.y + Math.sin(t * 1.3 + k * 2) * 5); aRing(i, j, 3 - k * .5, 3 - k * .5, '#8fd4ff', .95); PX(i - 1, j - 1, '#ffffff'); } if (Math.random() < .4) P(p.x, p.y, { vy: -30, life: 400, ramp: 'water', shape: 'bubble', size: 1 }); },
  sludge: (ramp = 'poison', r = 5) => p => { const i = bx(p.x), j = by(p.y), R = RR(ramp); aDisc(i, j, r, R[4]); aDisc(i - 1, j - 1, r - 1, R[3]); aDisc(i - 2, j - 2, 1, R[0]); for (let k = 0; k < 2; k++) PX(i + (Math.random() - .5) * r * 2, j + r, R[4]); if (Math.random() < .6) P(p.x, p.y + 4, { vy: 60, g: 300, life: 300, ramp, shape: 'drop', size: 1 }); },
  shadow: (r = 5) => p => { const i = bx(p.x), j = by(p.y); glow(i, j, r * 2, '#6a4ad8', .5); aDisc(i, j, r, '#140e30'); aDisc(i - 1, j - 1, r - 2, '#2d2068'); for (let k = 0; k < 4; k++) { const a = clock.t / 90 + k * 1.57; PX(i + Math.cos(a) * (r + 2), j + Math.sin(a) * (r + 2), '#b9a4ff'); } P(p.x, p.y, { vx: (Math.random() - .5) * 40, vy: -30, life: 380, ramp: 'ghost', shape: 'sq', size: 2, size2: 1 }); },
  aura: (r = 5) => p => { const i = bx(p.x), j = by(p.y); orbPx(i, j, r, ['#ffffff', '#d8f0ff', '#8fd0ff', '#3f8cff', '#2a4ab0', '#1a2470'], clock.t); aRing(i, j, r + 3 + Math.sin(clock.t / 50), (r + 3) * .5, '#bfe8ff', .9); emit(p.x, p.y, 2, { r: 4, speed: [10, 40], life: 240, color: '#9fd8ff', add: true }); },
  moon: () => p => { const i = bx(p.x), j = by(p.y); glow(i, j, 14, '#ffa8de', .55); moonPx(i, j, 6); emit(p.x, p.y, 2, { r: 6, speed: [10, 40], life: 400, ramp: 'fairy', shape: 'star', size: 1, add: true }); },
  rock: (r = 4, big) => p => { rockPx(bx(p.x), by(p.y), r, Math.floor(clock.t / 90) + 7); if (big || Math.random() < .3) P(p.x, p.y, { vy: 20, g: 200, life: 300, ramp: 'rock', size: 1 }); },
  needle: (col, head = '#ffffff', len = 6) => p => { const a = shotAng(p), i = bx(p.x), j = by(p.y); for (let k = 0; k < len; k++) PX(i - Math.cos(a) * k, j - Math.sin(a) * k, k < 2 ? head : col); bctx.globalAlpha = 1; },
  star: () => p => { const i = bx(p.x), j = by(p.y), s = 3 + (Math.floor(clock.t / 60) % 2); glow(i, j, 6, '#fff07a', .5); for (let k = -s; k <= s; k++) { PX(i + k, j, '#fff59a'); PX(i, j + k, '#fff59a'); } PX(i, j, '#ffffff'); PX(i - 1, j - 1, '#ffffff'); PX(i + 1, j + 1, '#ffffff'); bctx.globalAlpha = 1; P(p.x, p.y, { life: 300, ramp: 'gold', shape: 'star', size: 1, add: true }); },
  leaf: (big) => p => { const a = clock.t / 50, i = bx(p.x), j = by(p.y), s = big ? 4 : 3; for (let k = -s; k <= s; k++) { PX(i + Math.cos(a) * k, j + Math.sin(a) * k * .6, k ? '#3fb04a' : '#c8f58a'); PX(i + Math.cos(a) * k - Math.sin(a), j + Math.sin(a) * k * .6 + .6, '#7fe05a'); } bctx.globalAlpha = 1; },
  wind: (col = '#e8f2ff', w = 8) => p => { const a = shotAng(p), i = bx(p.x), j = by(p.y); for (let k = -w; k <= w; k++) { const t = k / w * 1.25; aRect(i + Math.cos(a + t) * w - Math.cos(a) * Math.abs(k) * .4, j + Math.sin(a + t) * w - Math.sin(a) * Math.abs(k) * .4, 2, 2, Math.abs(k) < 2 ? '#ffffff' : col, .95); } P(p.x, p.y, { life: 200, color: col, size: 1 }); },
  spore: (ramp) => p => { for (let k = 0; k < 7; k++) { const a = clock.t / 200 + k, r = 4 + (k % 3) * 2; PX(bx(p.x + Math.cos(a) * r), by(p.y + Math.sin(a * 1.3) * r * .7), rampAt(RR(ramp), (k % 4) / 5)); } bctx.globalAlpha = 1; if (Math.random() < .7) P(p.x + (Math.random() - .5) * 12, p.y, { vy: 25, life: 600, ramp, size: 1 }); },
  wisp: () => p => { const t = clock.t / 70; for (let k = 0; k < 3; k++) { const a = t + k * 2.09, x = p.x + Math.cos(a) * 9, y = p.y + Math.sin(a) * 6; glow(bx(x), by(y), 5, '#6a4ad8', .5); aDisc(bx(x), by(y), 2, '#9f8bff'); PX(bx(x), by(y) - 1, '#ffffff'); P(x, y, { vy: -40, life: 300, ramp: 'wisp', size: 1, add: true }); } bctx.globalAlpha = 1; },
  zapRing: () => p => { const i = bx(p.x), j = by(p.y); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + clock.t / 100, r = 7 + (k % 2) * 3; PX(i + Math.cos(a) * r, j + Math.sin(a) * r * .7, k % 2 ? '#fff07a' : '#ffd52a'); } PX(i, j, '#ffffff'); bctx.globalAlpha = 1; if (Math.random() < .4) P(p.x, p.y, { life: 200, color: '#ffe04a', shape: 'zap', size: 1 }); },
  heart: () => p => { shapeAt(p.x, p.y, { color: '#ff7ac8', shape: 'heart', size: 1 }); if (Math.random() < .5) P(p.x, p.y, { vy: -40, life: 500, ramp: 'fairy', shape: 'heart', size: 1 }); },
  string: () => p => { const sd = side(p.owner); aLine(bx(sd.x + sd.face * 10), by(sd.y - 36), bx(p.x), by(p.y), '#f4f4f4', .85, 1); aDisc(bx(p.x), by(p.y), 2, '#ffffff'); },
  psyRings: () => p => { const i = bx(p.x), j = by(p.y); for (let k = 0; k < 3; k++) { const q = ((clock.t / 400) + k / 3) % 1; aRing(i, j, 2 + q * 8, (2 + q * 8) * .6, '#ff8ad8', 1 - q); } },
  confuse: () => p => { const i = bx(p.x + Math.sin(clock.t / 60) * 4), j = by(p.y + Math.cos(clock.t / 45) * 3); glow(i, j, 8, '#ffe86b', .6); aDisc(i, j, 3, Math.floor(clock.t / 80) % 2 ? '#ffe86b' : '#c8a6ff'); PX(i - 1, j - 1, '#ffffff'); P(p.x, p.y, { life: 400, color: Math.random() < .5 ? '#ffe86b' : '#c8a6ff', shape: 'plus', size: 1 }); },
  ice: () => p => { shapeAt(p.x, p.y, { color: '#bff4ff', shape: 'shard', size: 2, rot: shotAng(p) }); glow(bx(p.x), by(p.y), 6, '#bff4ff', .4); P(p.x, p.y, { life: 260, ramp: 'ice', shape: 'star', size: 1, add: true }); },
  water: (r = 3) => p => { const i = bx(p.x), j = by(p.y); aDisc(i, j, r, '#4aa6ff'); aDisc(i - 1, j - 1, r - 1, '#8fd4ff'); PX(i - 1, j - 1, '#ffffff'); bctx.globalAlpha = 1; emit(p.x, p.y, 2, { speed: [20, 60], vx: -p.vx * .2, vy: -p.vy * .2, g: 300, life: 300, ramp: 'water', shape: 'drop', size: 1 }); },
  energy: () => p => { const i = bx(p.x), j = by(p.y); orbPx(i, j, 5, 'grass', clock.t); for (let k = 0; k < 2; k++) { const a = clock.t / 60 + k * 3.14; aRing(i, j, 7, 3, '#c8f58a', .7); PX(i + Math.cos(a) * 7, j + Math.sin(a) * 3, '#ffffff'); } bctx.globalAlpha = 1; },
  vial: () => p => { const i = bx(p.x), j = by(p.y), a = clock.t / 70; aDisc(i, j, 3, '#8a3ac8'); aRect(i - 1, j - 5, 2, 2, '#d8d8e0'); PX(i + Math.cos(a) * 4, j + Math.sin(a) * 4, '#f6e6ff'); bctx.globalAlpha = 1; P(p.x, p.y, { vy: -20, life: 400, ramp: 'poison', shape: 'bubble', size: 1 }); },
  mud: () => p => { const i = bx(p.x), j = by(p.y); aDisc(i, j, 4, '#6a4a24'); aDisc(i - 1, j - 1, 2, '#9a7038'); bctx.globalAlpha = 1; emit(p.x, p.y, 2, { speed: [10, 40], g: 400, life: 300, ramp: 'ground', size: [1, 2] }); },
  seed: () => p => { const i = bx(p.x), j = by(p.y); aDisc(i, j, 3, '#7a5a2a'); aDisc(i - 1, j - 1, 1, '#c8a060'); PX(i, j - 4, '#7fe05a'); PX(i + 1, j - 5, '#7fe05a'); bctx.globalAlpha = 1; },
  breeze: () => p => { for (let k = 0; k < 5; k++) { const a = clock.t / 90 + k * 1.25; PX(bx(p.x + Math.cos(a) * 7), by(p.y + Math.sin(a) * 5), k % 2 ? '#ffd0ef' : '#ffffff'); } bctx.globalAlpha = 1; P(p.x, p.y, { life: 400, ramp: 'fairy', shape: 'star', size: 1, add: true }); },
  drainOrb: (ramp = 'heal') => p => { orbPx(bx(p.x), by(p.y), 4, 'grass', clock.t); P(p.x, p.y, { life: 300, ramp, shape: 'plus', size: 1, add: true }); },
  multi: col => p => { const a = shotAng(p), i = bx(p.x), j = by(p.y); for (let k = 0; k < 7; k++) PX(i - Math.cos(a) * k, j - Math.sin(a) * k, k === 0 ? '#ffffff' : k < 3 ? '#f8ffd8' : col); bctx.globalAlpha = 1; P(p.x, p.y, { life: 160, color: col, size: 1 }); }
};
// Beam renderer: style ramp, width multiplier, wobble, extra per-frame spray
const BEAM = (ramp, wm = 1, wob = 0, spray) => b => {
  const q = b.t / b.life, grow = Math.min(1, q / .18), fade = q > .7 ? (1 - q) / .3 : 1, len = 450 * grow, w = Math.round(b.w / 2 * wm * (1 + Math.sin(clock.t / 25) * .12));
  beamPx(ax(b.x) - OX, ay(b.y) - OY, b.ang, len, w, ramp, fade, wob);
  if (spray && q < .8) spray(b, len * 2);
};
const bcap = b => (b.cl ? Math.max(1, b.clip) : 300);   // during a clash the beam only reaches the meeting point
const beamEnd = (b, wl) => ({ x: b.x + Math.cos(b.ang) * Math.min(wl, 300, bcap(b)), y: b.y + Math.sin(b.ang) * Math.min(wl, 300, bcap(b)) });

/* =====================================================================
   NORMAL
   ===================================================================== */
def('Tackle', { dash: DASH.trail('normal', 'sq', 1), impact: both(IMP.pow('#ffffff', 16), IMP.dust(6)) });
def('Quick Attack', { exec: S => { const sd = side(S); for (let k = 0; k < 10; k++) speedLines(sd.x, sd.y - 30, sd.face > 0 ? 0 : Math.PI, 1, 30, '#ffffff'); }, dash: DASH.speed('#ffffff'), impact: both(IMP.pow('#ffffff', 14), IMP.burst('normal', 10, [100, 220], 'star', 1)) });
def('Extreme Speed', { charge: CH.gather('gold', 18, 50, 'star'), dash: both(DASH.speed('#ffd23f'), DASH.trail('gold', 'star', 3, 1)), impact: S => { const h = headOf(S); for (let k = 0; k < 4; k++) setTimeoutGame(k * 70, () => { ent(220, q => powStar(bx(h.x + (Math.random() - .5) * 30), by(h.y + (Math.random() - .5) * 20), 14, '#ffd23f', q)); }); screenFlash('#fff3c0', .35); IMP.burst('gold', 24, [120, 320], 'star')(S); } });
def('Body Slam', { exec: S => { side(S).hop = 1; }, dash: DASH.trail('normal', 'sq', 2, [2, 3]), impact: S => { const f = footOf(S); ent(300, q => aEllFill(bx(f.x), by(f.y), 26 * (1 - q * .3), 7, '#0b0f1a', .35 * (1 - q)), { under: true }); IMP.ring('#ffffff', 110, 2)(S); IMP.dust(18)(S); IMP.pow('#ffffff', 22)(S); VFX.shake(10, 300); crackBurst(f.x, f.y, 3); } });
def('Headbutt', { dash: DASH.trail('normal'), impact: S => { const h = headOf(S); IMP.pow('#fff0b0', 18)(S); ent(900, q => { for (let k = 0; k < 4; k++) { const a = clock.t / 140 + k * 1.57; shapeAt(h.x + Math.cos(a) * 18, h.y - 18 + Math.sin(a) * 5, { color: '#ffe86b', shape: 'star', size: 1 }); } }); } });
def('Slash', { charge: S => ent(240, q => { const h = headOf(S); PX(bx(h.x + side(S).face * 16), by(h.y + 10 - q * 10), '#ffffff'); }), impact: both(IMP.claws('#ffffff', 3, 30, 2), IMP.burst('normal', 8, [80, 180])) });
def('Double-Edge', { charge: CH.rise(['#ffffff', '#ffd0d0', '#ff8a8a', '#e83a3a', '#8a1a1a'], 16), dash: both(DASH.engulf(['#ffffff', '#ffd0d0', '#ff8a8a', '#e83a3a', '#8a1a1a'], 4), DASH.speed('#ff8a8a')), impact: S => { IMP.pow('#ff8a8a', 26)(S); IMP.ring('#ff8a8a', 120, 3)(S); IMP.burst(['#ffffff', '#ff8a8a', '#e83a3a', '#8a1a1a'], 26, [120, 320])(S); VFX.shake(12, 380); screenFlash('#ffd0d0', .3); } });
def('Swift', { charge: CH.gather('gold', 12, 30, 'star'), shot: SHOT.star(), impact: IMP.burst('gold', 12, [60, 180], 'star', 1) });
def('Hyper Beam', { charge: S => { dim(.55, 1500); const h = headOf(S); ent(360, q => { const i = bx(h.x + side(S).face * 16), j = by(h.y + 6); glow(i, j, 6 + q * 14, '#ffb347', .7); aDisc(i, j, 2 + q * 6, '#fff6b0'); }); CH.gather(['#ffffff', '#fff6b0', '#ffd23f', '#ff9a1f', '#a8321c'], 26, 70)(S); },
  beam: BEAM(['#ffffff', '#fffbe0', '#fff07a', '#ffb347', '#ff7a1a', '#a83a10'], 1.6, 1.5, (b, wl) => { const e = beamEnd(b, wl); emit(e.x, e.y, 3, { speed: [60, 240], life: [200, 420], ramp: 'fire', size: [2, 3], size2: 1, add: true }); }),
  exec: S => { VFX.shake(14, 700); punch(side(S).x, side(S).y - 30, 1300, 1); }, impact: both(IMP.explode(['#ffffff', '#fffbe0', '#fff07a', '#ffb347', '#ff7a1a', '#a83a10', '#5a3a36'], 30), S => { screenFlash('#fff6d0', .7); crackBurst(footOf(S).x, footOf(S).y, 6); }) });
def('Swords Dance', { exec: S => { dim(.35, 900); ent(900, q => { const h = headOf(S); for (let k = 0; k < 4; k++) { const a = q * 9 + k * Math.PI / 2, r = 26 * (1 - Math.max(0, q - .7) * 3); swordPx(bx(h.x + Math.cos(a) * r), by(h.y + 6 + Math.sin(a) * r * .6), a + Math.PI / 2); } if (q > .75) powStar(bx(h.x), by(h.y), 20, '#e8f0ff', (q - .75) * 4); }); IMP.sparkle('steel', 10)(S); } });
def('Harden', { exec: S => ent(600, q => { const h = headOf(S); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; aLine(bx(h.x + Math.cos(a) * 20), by(h.y + 10 + Math.sin(a) * 16), bx(h.x + Math.cos(a + 1.05) * 20), by(h.y + 10 + Math.sin(a + 1.05) * 16), '#cad8e6', (1 - q) * .9, 1); } aRect(bx(h.x - 20 + q * 40), by(h.y - 10), 2, 40, '#ffffff', .6 * (1 - q)); }) });
def('Recover', { exec: S => { const f = footOf(S); ent(900, q => { const i = bx(f.x), j = by(f.y); for (let y = 0; y < 70; y += 2) aRect(i - 8 + Math.sin(y / 6 + clock.t / 80) * 2, j - y, 16, 2, y % 4 ? '#a8ffc0' : '#e8ffef', .35 * (1 - q) * (1 - y / 70)); }); emit(f.x, f.y - 10, 26, { r: 18, ang: -Math.PI / 2, spread: .4, speed: [40, 110], life: [600, 1000], ramp: 'heal', shape: 'plus', size: 1, add: true }); } });
def('Splash', { exec: S => { const f = footOf(S); for (let k = 0; k < 3; k++) setTimeoutGame(k * 280, () => emit(f.x, f.y - 6, 12, { ang: -Math.PI / 2, spread: 1.6, speed: [80, 180], g: 500, life: 600, ramp: 'water', shape: 'drop', size: 1 })); } });

/* =====================================================================
   FIRE
   ===================================================================== */
def('Ember', { charge: CH.rise('fire', 8), shot: SHOT.fireball(3), impact: S => { const h = headOf(S); emit(h.x, h.y + 10, 16, { speed: [40, 160], life: [300, 600], ramp: 'fire', size: [1, 2], g: 100, add: true }); addScar('scorch', footOf(S).x, footOf(S).y); } });
def('Flamethrower', { charge: CH.orb('fire', 5, 320), beam: BEAM('fire', 1.1, 3, (b, wl) => { for (let k = 0; k < 4; k++) { const d = Math.random() * Math.min(wl, 300, bcap(b)); P(b.x + Math.cos(b.ang) * d, b.y + Math.sin(b.ang) * d, { vx: Math.cos(b.ang) * 120 + (Math.random() - .5) * 80, vy: Math.sin(b.ang) * 120 - 40, life: [250, 500][k % 2], ramp: 'fire', size: 3, size2: 1, add: true }); } }),
  impact: S => { IMP.explode('fire', 16)(S); const h = headOf(S); ent(1000, q => { if (Math.random() < .5) P(h.x + (Math.random() - .5) * 30, h.y + 30, { vy: -80, life: 500, ramp: 'fire', size: 2, size2: 1, add: true }); }); addScar('scorch', footOf(S).x, footOf(S).y); } });
def('Fire Blast', { charge: S => { dim(.4, 1400); CH.orb('fire', 7, 300)(S); CH.rise('fire', 20)(S); },
  shot: SHOT.fireball(5),
  impact: S => { const h = headOf(S), i0 = h.x, j0 = h.y + 8; ent(900, q => { // the five-armed burst of flame
      const arms = [[0, -1], [-1, .35], [1, .35], [-.7, 1], [.7, 1]], L = 34 * Ease.outQ(Math.min(1, q * 2));
      for (const [dx, dy] of arms) for (let k = 0; k < L; k += 2) { const x = i0 + dx * k, y = j0 + dy * k; aDisc(bx(x), by(y), 4 * (1 - k / 50) * (1 - q * .5), rampAt(RAMP.fire, k / L * .6 + q * .4), 1 - q * .7); }
      glow(bx(i0), by(j0), 20 * (1 - q), '#ff9a1f', .6 * (1 - q)); });
    emit(i0, j0, 40, { speed: [80, 320], life: [500, 900], ramp: 'fire', size: [2, 4], size2: 1, drag: 1.5, add: true }); screenFlash('#ffb070', .5); VFX.shake(12, 450); punch(i0, j0, 1100, 1); for (let k = 0; k < 4; k++) addScar('scorch', footOf(S).x + (Math.random() - .5) * 40, footOf(S).y + (Math.random() - .5) * 20); } });
def('Fire Punch', { charge: both(CH.fist('#ff9a1f', 1), CH.rise('fire', 8)), dash: DASH.engulf('fire', 2), impact: IMP.fist('#ff7a2a', 2, S => { IMP.explode('fire', 14)(S); }) });
def('Flare Blitz', { charge: S => { CH.rise('blueFire', 24)(S); ent(400, q => { const sd = side(S); glow(bx(sd.x), by(sd.y - 30), 16 + q * 8, '#7fd6ff', .5); }); }, dash: both(DASH.engulf('blueFire', 6), DASH.engulf('fire', 3)),
  impact: S => { IMP.explode('blueFire', 26)(S); IMP.explode('fire', 18)(S); screenFlash('#d8f4ff', .45); VFX.shake(13, 420); punch(side(S).x, side(S).y - 30, 900, 1); } });
def('Will-O-Wisp', { charge: S => { const h = headOf(S); for (let k = 0; k < 3; k++) setTimeoutGame(k * 70, () => P(h.x + (k - 1) * 12, h.y - 10, { vy: -20, life: 400, ramp: 'wisp', shape: 'disc', size: 2, add: true })); }, shot: SHOT.wisp(),
  impact: S => { const h = headOf(S); ent(800, q => { for (let k = 0; k < 3; k++) { const a = clock.t / 120 + k * 2.09; glow(bx(h.x + Math.cos(a) * 18), by(h.y + 10 + Math.sin(a) * 8), 6, '#6a4ad8', .6 * (1 - q)); aDisc(bx(h.x + Math.cos(a) * 18), by(h.y + 10 + Math.sin(a) * 8), 2, '#c8b8ff', 1 - q); } }); } });

/* =====================================================================
   WATER
   ===================================================================== */
def('Water Gun', { charge: CH.gather('water', 10, 30), shot: SHOT.water(3), impact: IMP.splash(18) });
def('Bubble Beam', { charge: CH.gather('water', 12, 34, 'bubble'), shot: SHOT.bubbles(), exec: S => { const h = headOf(S), sd = side(S); for (let k = 0; k < 14; k++) setTimeoutGame(k * 25, () => P(h.x + sd.face * 16, h.y + 6, { vx: sd.face * rnd2(200, 380), vy: rnd2(-60, 60), life: 700, ramp: 'water', shape: 'bubble', size: rnd2(1, 3) | 0, drag: .6 })); },
  impact: S => { const h = headOf(S); emit(h.x, h.y + 8, 18, { speed: [40, 160], life: [300, 500], ramp: 'water', shape: 'ring', size: [1, 3] }); IMP.splash(10)(S); } });
def('Surf', { exec: S => { punch(side(S).x, side(S).y, 1200, 1); dim(.25, 900, '6,20,48'); },
  wave: w => { const r = w.r / 2, i = bx(w.x), j = by(w.y); for (let k = 0; k < 4; k++) aRing(i, j, r - k * 2, (r - k * 2) * .62, rampAt(RAMP.water, k / 5 + .2), .95, 2); for (let k = 0; k < 18; k++) { const a = Math.random() * 6.28; PX(i + Math.cos(a) * r, j + Math.sin(a) * r * .62 - 2, '#ffffff'); } if (Math.random() < .8) { const a = Math.random() * 6.28; P(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * .62, { vy: -140, g: 500, life: 500, ramp: 'water', shape: 'drop', size: 2 }); } },
  impact: both(IMP.splash(30), IMP.ring('#8fd4ff', 90, 2)) });
def('Hydro Pump', { charge: S => { CH.gather('water', 22, 60)(S); dim(.3, 1100, '6,20,48'); }, beam: BEAM('water', 1.6, 2, (b, wl) => { const e = beamEnd(b, wl); emit(e.x, e.y, 4, { speed: [100, 300], g: 500, life: [300, 600], ramp: 'water', shape: 'drop', size: [1, 2] }); for (let k = 0; k < 2; k++) { const d = Math.random() * wl * .8; P(b.x + Math.cos(b.ang) * d, b.y + Math.sin(b.ang) * d, { vx: (Math.random() - .5) * 120, vy: -80, g: 400, life: 400, ramp: 'water', shape: 'drop', size: 1 }); } }),
  exec: S => VFX.shake(8, 600), impact: both(IMP.splash(40), IMP.ring('#d8f4ff', 120, 3)) });
def('Scald', { charge: CH.rise(['#ffffff', '#f0f0f0', '#c8e8ff', '#8fd4ff'], 12), beam: BEAM(['#ffffff', '#fff4e8', '#ffd0b0', '#8fd4ff', '#4aa6ff', '#2a6fc0'], .9, 2, (b, wl) => { const d = Math.random() * wl; P(b.x + Math.cos(b.ang) * d, b.y + Math.sin(b.ang) * d, { vy: -50, life: 600, ramp: 'smoke', size: 3, size2: 1 }); }),
  impact: S => { IMP.splash(16)(S); const h = headOf(S); emit(h.x, h.y, 14, { r: 14, ang: -Math.PI / 2, spread: 1, speed: [30, 80], life: [600, 1000], ramp: 'smoke', size: [2, 4], size2: 1 }); } });
def('Aqua Jet', { exec: S => { const sd = side(S); emit(sd.x, sd.y - 30, 16, { r: 14, speed: [60, 160], life: 400, ramp: 'water', shape: 'drop', size: 1, g: 300 }); }, dash: S => { const sd = side(S), a = clock.t / 40; for (let k = 0; k < 2; k++) P(sd.x + Math.cos(a + k * 3.14) * 14, sd.y - 30 + Math.sin(a + k * 3.14) * 10, { life: 300, ramp: 'water', shape: 'drop', size: 1, vy: -20 }); DASH.speed('#bfe9ff')(S); }, impact: both(IMP.splash(22), IMP.pow('#bfe9ff', 16)) });
def('Waterfall', { dash: DASH.engulf('water', 4), impact: S => { const f = footOf(S); ent(700, q => { const i = bx(f.x), j = by(f.y), H = 70 * Math.min(1, q * 3); for (let y = 0; y < H; y += 1) { const w = 10 + Math.sin(y / 4 + clock.t / 50) * 2; aRect(i - w / 2, j - y, w, 1, rampAt(RAMP.water, (y / 70 + clock.t / 300) % 1 * .7), (1 - q) * .9); } }); IMP.splash(30)(S); VFX.shake(8, 300); } });
def('Crabhammer', { charge: CH.gather('water', 10, 30), dash: DASH.trail('water', 'drop', 2, 1), impact: S => { const h = headOf(S); ent(400, q => { const g = 18 * (1 - Math.min(1, q * 2.2)); for (const s of [-1, 1]) { const i = bx(h.x + s * (g + 6)), j = by(h.y + 8); aDisc(i, j, 7, '#e85a3a'); aDisc(i - 1, j - 1, 5, '#ff8a6a'); aRect(i - s * 6, j - 2, 6, 4, '#c83a2a'); } }); setTimeoutGame(160, () => { IMP.splash(26)(S); IMP.pow('#ffffff', 22)(S); VFX.shake(10, 300); }); } });

/* =====================================================================
   GRASS
   ===================================================================== */
def('Vine Whip', { exec: S => { const sd = side(S); ent(520, q => { const t = side(other(S)); vinePx(bx(sd.x), by(sd.y - 30), bx(t.x), by(t.y - 36), q); vinePx(bx(sd.x), by(sd.y - 26), bx(t.x + 8), by(t.y - 26), Math.max(0, q - .1), '#26803a'); }); }, impact: both(IMP.claws('#7fe05a', 2, 30, 2), IMP.leaves(8)) });
def('Razor Leaf', { charge: CH.gather('grass', 14, 40, 'leaf'), shot: SHOT.leaf(), impact: both(IMP.leaves(14), IMP.claws('#c8f58a', 2, 20, 1)) });
def('Seed Bomb', { shot: SHOT.seed(), impact: S => { IMP.explode(['#ffffff', '#e8ffc0', '#a8f07a', '#5ec84a', '#3a8a2a', '#5a4a2a'], 18)(S); IMP.leaves(10)(S); IMP.dust(8)(S); } });
def('Giga Drain', { charge: CH.gather('grass', 16, 46), shot: SHOT.drainOrb(), impact: S => { const h = headOf(S), a = side(other(S)); for (let k = 0; k < 12; k++) setTimeoutGame(k * 40, () => { const ox = (Math.random() - .5) * 30; P(h.x + ox, h.y + 10, { vx: (a.x - h.x) * 1.6, vy: (a.y - 44 - h.y) * 1.6 - 60, g: 60, life: 600, ramp: 'heal', shape: 'disc', size: 2, size2: 1, add: true }); }); ent(600, q => glow(bx(h.x), by(h.y + 10), 16, '#7fe05a', .5 * (1 - q))); } });
def('Energy Ball', { charge: CH.orb('grass', 6, 320), shot: SHOT.energy(), impact: both(IMP.explode('grass', 18), IMP.ring('#c8f58a', 80, 2)) });
def('Leaf Storm', { charge: S => { dim(.35, 1400, '6,26,10'); const h = headOf(S); ent(500, q => { for (let k = 0; k < 10; k++) { const a = q * 14 + k * .63, r = 12 + k * 2.5; shapeAt(h.x + Math.cos(a) * r, h.y + 10 + Math.sin(a) * r * .6, { ramp: 'grass', shape: 'leaf', size: 2, rot: a }); } }); }, shot: SHOT.leaf(true),
  exec: S => { const sd = side(S); for (let k = 0; k < 40; k++) setTimeoutGame(k * 12, () => P(sd.x, sd.y - 30, { vx: sd.face * rnd2(220, 420), vy: rnd2(-120, 120), life: 800, ramp: 'grass', shape: 'leaf', size: 2, spin: 10, drag: .4 })); }, impact: both(IMP.leaves(30), IMP.ring('#7fe05a', 100, 2)) });
def('Sleep Powder', { exec: S => { const sd = side(S); emit(sd.x, sd.y - 40, 16, { r: 14, speed: [20, 60], life: 700, ramp: ['#ffffff', '#d0f0ff', '#8fd4ff', '#5a8ac8'], size: 1 }); }, shot: SHOT.spore(['#ffffff', '#d0f0ff', '#8fd4ff', '#5a8ac8']),
  impact: S => { const h = headOf(S); emit(h.x, h.y - 20, 30, { r: 26, vy: 40, speed: [0, 20], life: [800, 1300], ramp: ['#ffffff', '#d0f0ff', '#8fd4ff', '#5a8ac8'], size: 1 }); for (let k = 0; k < 3; k++) setTimeoutGame(300 + k * 200, () => P(h.x + 14 + k * 6, h.y - 10, { vy: -30, vx: 20, life: 900, color: '#e6ecff', shape: 'z', size: 1 })); } });
def('Stun Spore', { exec: S => { const sd = side(S); emit(sd.x, sd.y - 40, 16, { r: 14, speed: [20, 60], life: 700, ramp: 'gold', size: 1 }); }, shot: SHOT.spore('gold'),
  impact: S => { const h = headOf(S); emit(h.x, h.y - 20, 30, { r: 26, vy: 40, speed: [0, 20], life: [800, 1300], ramp: 'gold', size: 1 }); IMP.zap(3, '#fff07a')(S); } });

/* =====================================================================
   ELECTRIC
   ===================================================================== */
def('Thunder Shock', { charge: CH.crackle(), mark: mk => { ent(260, () => zig(bx(mk.x), by(mk.y - 120), bx(mk.x), by(mk.y - 34), '#ffe04a', 2, 4, '#ffffff')); emit(mk.x, mk.y - 34, 10, { speed: [60, 180], life: 300, color: '#fff07a', shape: 'zap', size: 1 }); }, impact: IMP.zap(3) });
def('Thunderbolt', { charge: both(CH.crackle(), CH.gather('elec', 16, 40)), exec: S => dim(.35, 800),
  mark: mk => { screenFlash('#fffbd0', .55); ent(420, q => { for (let k = 0; k < 3; k++) zig(bx(mk.x + (k - 1) * 10), by(mk.y - 220), bx(mk.x + (Math.random() - .5) * 8), by(mk.y - 34), '#ffd52a', 3, 7, '#ffffff'); glow(bx(mk.x), by(mk.y - 34), 22 * (1 - q), '#fff07a', .7); });
    emit(mk.x, mk.y - 30, 26, { speed: [100, 300], life: [200, 450], ramp: 'elec', shape: 'zap', size: 1 }); addScar('scorch', mk.x, mk.y); VFX.shake(9, 300); },
  impact: S => { IMP.zap(6)(S); const h = headOf(S); ent(700, () => { if (Math.random() < .5) { const a = Math.random() * 6.28; zig(bx(h.x), by(h.y + 8), bx(h.x + Math.cos(a) * 26), by(h.y + 8 + Math.sin(a) * 20), '#fff07a', 1, 2); } }); } });
def('Thunder', { charge: S => { dim(.6, 1300, '4,6,20'); CH.crackle()(S); CH.gather('elec', 20, 60)(S); },
  mark: mk => { screenFlash('#ffffff', .85); VFX.shake(16, 600); punch(mk.x, mk.y - 30, 1100, 1); ent(560, q => { for (let k = 0; k < 2; k++) zig(bx(mk.x + (Math.random() - .5) * 6), by(mk.y - 300), bx(mk.x), by(mk.y - 30), '#ffe04a', 5, 10, '#ffffff'); for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28; zig(bx(mk.x), by(mk.y - 20), bx(mk.x + Math.cos(a) * 60), by(mk.y - 20 + Math.sin(a) * 30), '#fff07a', 1, 4); } glow(bx(mk.x), by(mk.y - 30), 34 * (1 - q), '#ffffff', .8); });
    emit(mk.x, mk.y - 20, 40, { speed: [120, 380], life: [300, 600], ramp: 'elec', shape: 'zap', size: 2, size2: 1 }); for (let k = 0; k < 5; k++) addScar('scorch', mk.x + (Math.random() - .5) * 50, mk.y + (Math.random() - .5) * 24); },
  impact: IMP.zap(8) });
def('Thunder Punch', { charge: both(CH.fist('#ffe04a', 1), CH.crackle()), dash: S => { const sd = side(S); if (Math.random() < .6) P(sd.x + (Math.random() - .5) * 30, sd.y - 34 + (Math.random() - .5) * 30, { life: 160, color: '#fff07a', shape: 'zap', size: 2 }); }, impact: IMP.fist('#ffd52a', 2, S => { IMP.zap(6)(S); screenFlash('#fffbd0', .3); }) });
def('Volt Tackle', { charge: S => { CH.crackle()(S); CH.gather('elec', 22, 50)(S); }, dash: S => { const sd = side(S); ent(60, () => { for (let k = 0; k < 2; k++) { const a = Math.random() * 6.28; zig(bx(sd.x), by(sd.y - 32), bx(sd.x + Math.cos(a) * 22), by(sd.y - 32 + Math.sin(a) * 22), '#ffe04a', 2, 3, '#ffffff'); } glow(bx(sd.x), by(sd.y - 32), 16, '#fff07a', .5); }); DASH.speed('#fff07a')(S); },
  impact: S => { IMP.zap(9)(S); IMP.explode('elec', 22)(S); screenFlash('#fffbd0', .5); VFX.shake(13, 420); } });
def('Thunder Wave', { charge: CH.crackle('#fff07a'), shot: SHOT.zapRing(), impact: S => { const h = headOf(S); ent(700, q => { for (let k = 0; k < 2; k++) { const r = (q * 40 + k * 14) % 40; for (let s = 0; s < 16; s++) { const a = s / 16 * 6.28; PX(bx(h.x + Math.cos(a) * r), by(h.y + 10 + Math.sin(a) * r * .6 + (s % 2 ? 1 : -1)), '#ffe04a', 1 - r / 40); } } }); } });

/* =====================================================================
   ICE
   ===================================================================== */
def('Ice Shard', { exec: S => { const h = headOf(S); emit(h.x + side(S).face * 14, h.y + 6, 8, { speed: [30, 90], life: 300, ramp: 'ice', shape: 'star', size: 1 }); }, shot: SHOT.ice(), impact: both(IMP.shatter(12), IMP.burst('ice', 8, [60, 160], 'star', 1)) });
def('Ice Punch', { charge: both(CH.fist('#bff4ff', 1), CH.gather('ice', 10, 30, 'star')), dash: DASH.trail('ice', 'star', 2, 1), impact: IMP.fist('#7fdcf0', 2, S => { IMP.shatter(18)(S); const f = footOf(S); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; ent(800, q => spikePx(bx(f.x + Math.cos(a) * 18), by(f.y + Math.sin(a) * 8), 10 * Math.min(1, q * 4), 2, RAMP.ice, 1 - Math.max(0, q - .7) * 3.3), { under: true }); } }) });
def('Aurora Beam', { charge: CH.gather('aurora', 18, 46, 'star'), beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .18), fade = q > .7 ? (1 - q) / .3 : 1, len = 450 * grow, i0 = ax(b.x) - OX, j0 = ay(b.y) - OY, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    const cols = ['#ff9ad8', '#c89aff', '#9ad0ff', '#9affd8', '#fff09a']; for (let k = 0; k < len; k++) for (let s = -4; s <= 4; s++) { const idx = ((((s + 4) >> 1) + Math.floor((k - clock.t / 20) / 6)) % 5 + 5) % 5, o = s + Math.sin(k / 8 - clock.t / 60) * 2; PX(i0 + ca * k - sa * o, j0 + sa * k + ca * o, cols[idx], fade * (s === 0 ? 1 : .8)); } bctx.globalAlpha = 1; },
  impact: both(IMP.sparkle('aurora', 22), IMP.shatter(8)) });
def('Ice Beam', { charge: CH.gather('ice', 18, 46, 'star'), beam: BEAM('ice', 1, 1, (b, wl) => { const d = Math.random() * Math.min(wl, 300, bcap(b)); const x = b.x + Math.cos(b.ang) * d, y = b.y + Math.sin(b.ang) * d; P(x, y, { life: 500, ramp: 'ice', shape: 'shard', size: 2, rot: Math.random() * 6.28 }); }),
  impact: S => { IMP.shatter(20)(S); const f = footOf(S); ent(1400, q => { const a = 1 - Math.max(0, q - .7) * 3.3; for (let k = 0; k < 7; k++) { const ang = k / 7 * 6.28; spikePx(bx(f.x + Math.cos(ang) * 16), by(f.y + Math.sin(ang) * 7), 6 + (k % 3) * 4, 2, RAMP.ice, a * Math.min(1, q * 6)); } }, { under: true }); } });
def('Blizzard', { charge: S => { dim(.45, 1600, '20,30,48'); CH.gather('ice', 24, 70, 'star')(S); },
  exec: S => { for (let k = 0; k < 60; k++) setTimeoutGame(k * 12, () => { const sd = side(S); P(sd.x + (Math.random() - .5) * 600, -40, { vx: rnd2(200, 400) * sd.face, vy: rnd2(200, 380), life: 1200, ramp: 'ice', shape: Math.random() < .5 ? 'star' : 'sq', size: rnd2(1, 3) | 0 }); }); },
  mark: mk => { ent(900, q => { for (let k = 0; k < 14; k++) { const a = q * 12 + k * .45, r = 6 + k * 3; aRect(bx(mk.x + Math.cos(a) * r), by(mk.y - 20 + Math.sin(a) * r * .5), 2, 2, k % 3 ? '#ffffff' : '#bff4ff', 1 - q); } }); emit(mk.x, mk.y - 20, 30, { speed: [80, 260], life: [400, 800], ramp: 'ice', shape: 'shard', size: [1, 2], spin: 10 }); screenFlash('#e8fbff', .4); },
  impact: IMP.shatter(16) });

/* =====================================================================
   FIGHTING
   ===================================================================== */
def('Mach Punch', { exec: DASH.speed('#ffc08a'), dash: DASH.speed('#ffc08a'), impact: S => { const h = headOf(S); for (let k = 0; k < 3; k++) setTimeoutGame(k * 55, () => { const dx = (Math.random() - .5) * 20, dy = (Math.random() - .5) * 14; ent(200, q => { fistPx(bx(h.x + dx), by(h.y + 8 + dy), 1, '#ff8a5b', side(other(S)).face); powStar(bx(h.x + dx), by(h.y + 8 + dy), 10, '#ffffff', q); }); }); } });
def('Karate Chop', { charge: S => ent(260, q => { const h = headOf(S); aRect(bx(h.x + side(S).face * 12), by(h.y - 6 - q * 6), 3, 10, '#f2c39c'); }), impact: S => { const h = headOf(S); ent(320, q => { const j = by(h.y - 16 + q * 30); aRect(bx(h.x) - 1, j - 12, 4, 12, '#f2c39c', 1 - q); slashPx(bx(h.x), by(h.y + 8), Math.PI / 2, 28, '#ffc08a', 3, q); }); IMP.pow('#ffc08a', 16)(S); } });
def('Brick Break', { charge: CH.fist('#ff8a5b', 1), impact: S => { const h = headOf(S); IMP.fist('#ff8a5b', 2)(S); emit(h.x, h.y + 10, 12, { ang: -Math.PI / 2, spread: 2.5, speed: [100, 240], g: 520, life: 700, ramp: ['#e8a080', '#c8604a', '#9a3a2a', '#5a2018'], shape: 'sq', size: [2, 3] }); VFX.shake(9, 260); } });
def('Cross Chop', { charge: CH.rise('fight', 12), impact: S => { IMP.xslash('#ffc08a', 40)(S); IMP.burst('fight', 18, [100, 260])(S); VFX.shake(10, 320); } });
def('Close Combat', { charge: S => { CH.rise('fight', 18)(S); dim(.3, 1000); }, dash: DASH.speed('#ffc08a'), impact: S => { const h = headOf(S); for (let k = 0; k < 7; k++) setTimeoutGame(k * 60, () => { const dx = (Math.random() - .5) * 34, dy = (Math.random() - .5) * 26; ent(220, q => { if (k % 2) fistPx(bx(h.x + dx), by(h.y + 8 + dy), 1, '#ff8a5b', side(other(S)).face); powStar(bx(h.x + dx), by(h.y + 8 + dy), 14, k % 3 ? '#ffffff' : '#ffc08a', q); }); VFX.shake(7, 120); }); setTimeoutGame(450, () => { IMP.burst('fight', 26, [140, 340])(S); punch(side(S).x, side(S).y - 30, 700, 1); }); } });
def('Aura Sphere', { charge: S => { CH.gather(['#ffffff', '#d8f0ff', '#8fd0ff', '#3f8cff', '#2a4ab0'], 22, 54)(S); CH.orb(['#ffffff', '#d8f0ff', '#8fd0ff', '#3f8cff', '#2a4ab0', '#1a2470'], 6, 320)(S); }, shot: SHOT.aura(6), impact: S => { IMP.explode(['#ffffff', '#d8f0ff', '#8fd0ff', '#3f8cff', '#2a4ab0', '#1a2470'], 22)(S); IMP.ring('#8fd0ff', 100, 2)(S); } });
def('Bulk Up', { exec: S => { const h = headOf(S); ent(700, q => { glow(bx(h.x), by(h.y + 14), 22, '#ff8a5b', .5 * (1 - q)); for (const s of [-1, 1]) { const i = bx(h.x + s * (18 + Math.sin(q * 20) * 2)), j = by(h.y + 14); aDisc(i, j, 4, '#ff8a5b', 1 - q); } }); CH.rise('fight', 22)(S); VFX.shake(4, 300); } });

/* =====================================================================
   POISON
   ===================================================================== */
def('Poison Sting', { shot: SHOT.needle('#b65cff', '#f6e6ff', 6), impact: IMP.toxic() });
def('Poison Jab', { charge: S => ent(260, q => { const h = headOf(S), f = side(S).face; for (let k = 0; k < 10; k++) PX(bx(h.x + f * (10 + k)), by(h.y + 10), k > 7 ? '#f6e6ff' : '#b65cff'); }), dash: DASH.trail('poison', 'bubble', 2, 1), impact: both(IMP.claws('#d8a0ff', 1, 30, 3), IMP.toxic(), IMP.burst('poison', 14, [80, 200], 'drop', 1)) });
def('Sludge Bomb', { charge: CH.orb('poison', 6, 300), shot: SHOT.sludge('poison', 6), impact: S => { IMP.explode('poison', 20)(S); const f = footOf(S); emit(f.x, f.y - 20, 18, { ang: -Math.PI / 2, spread: 2.4, speed: [80, 220], g: 500, life: 700, ramp: 'poison', shape: 'drop', size: [1, 2] }); ent(1500, q => aEllFill(bx(f.x), by(f.y + 2), 18, 5, '#8a3ac8', .5 * (1 - q)), { under: true }); } });
def('Gunk Shot', { charge: S => { CH.orb(['#f0e0ff', '#c8a060', '#8a6a3a', '#6a3a8a', '#3a1a48', '#1a0a20'], 7, 340)(S); dim(.3, 1000, '20,6,26'); }, shot: SHOT.sludge(['#f0e0ff', '#c8a060', '#8a6a3a', '#6a3a8a', '#3a1a48', '#1a0a20'], 7),
  impact: S => { IMP.explode(['#ffffff', '#d8a0ff', '#8a6a3a', '#6a3a8a', '#3a1a48', '#1a0a20'], 26)(S); IMP.toxic()(S); IMP.rocks(8)(S); VFX.shake(11, 380); } });
def('Toxic', { shot: SHOT.vial(), impact: S => { const h = headOf(S); IMP.toxic()(S); ent(900, q => { glow(bx(h.x), by(h.y + 10), 20, '#8a3ac8', .55 * (1 - q)); for (let k = 0; k < 6; k++) { const a = k + clock.t / 200; PX(bx(h.x + Math.cos(a) * 16), by(h.y + 10 + Math.sin(a * 1.4) * 14), '#d8a0ff', 1 - q); } }); } });
def('Acid Armor', { exec: S => { const sd = side(S); ent(900, q => { const i = bx(sd.x), j = by(sd.y); for (let k = 0; k < 12; k++) { const x = i - 14 + k * 2.5, y = j - 50 + ((k * 13 + q * 60) % 50); aRect(x, y, 1, 3, '#b65cff', .8 * (1 - q)); } aEllFill(i, j, 18, 4, '#8a3ac8', .5 * (1 - q)); }); IMP.sparkle('poison', 12)(S); } });

/* =====================================================================
   GROUND
   ===================================================================== */
def('Mud Shot', { shot: SHOT.mud(), impact: S => { const h = headOf(S); emit(h.x, h.y + 10, 18, { speed: [60, 200], g: 500, life: 600, ramp: 'ground', size: [1, 3] }); ent(1600, q => aEllFill(bx(footOf(S).x), by(footOf(S).y + 2), 16, 4, '#6a4a24', .55 * (1 - q)), { under: true }); } });
def('Dig', { exec: S => { const f = footOf(S); IMP.dust(20)(S); emit(f.x, f.y - 4, 16, { ang: -Math.PI / 2, spread: 2, speed: [80, 200], g: 500, life: 600, ramp: 'ground', size: [2, 3] }); }, impact: S => { IMP.rocks(14)(S); IMP.dust(16)(S); IMP.pow('#e7c27a', 22)(S); crackBurst(footOf(S).x, footOf(S).y, 4); } });
def('Drill Run', { dash: S => { const sd = side(S), a = clock.t / 25; for (let k = 0; k < 3; k++) P(sd.x + sd.face * 14 + Math.cos(a + k * 2.09) * 8, sd.y - 30 + Math.sin(a + k * 2.09) * 8, { life: 140, ramp: 'ground', size: 2, size2: 1 }); DASH.dust()(S); },
  impact: S => { const h = headOf(S); ent(380, q => { for (let k = 0; k < 14; k++) { const a = q * 30 + k, r = 4 + k; PX(bx(h.x + Math.cos(a) * r * .5), by(h.y + 8 + Math.sin(a) * r * .5), rampAt(RAMP.ground, k / 16)); } }); IMP.rocks(10)(S); IMP.pow('#e7c27a', 18)(S); } });
def('Earth Power', { mark: mk => { ent(700, q => { const i = bx(mk.x), j = by(mk.y); aEllFill(i, j, 30 * Math.min(1, q * 3), 10, '#ff8a1f', .6 * (1 - q)); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; aLine(i, j, i + Math.cos(a) * 30, j + Math.sin(a) * 10, '#ffd23f', 1 - q, 1); } }, { under: true });
    ent(560, q => { const i = bx(mk.x), j = by(mk.y), H = 90 * Ease.outQ(Math.min(1, q * 2.5)); for (let y = 0; y < H; y++) { const w = 12 * (1 - y / 100) + Math.sin(y / 3 + clock.t / 40) * 2; aRect(i - w / 2, j - y, w, 1, rampAt(RAMP.fire, y / 100 + q * .3), 1 - q); } });
    emit(mk.x, mk.y - 10, 30, { ang: -Math.PI / 2, spread: .9, speed: [120, 320], g: 300, life: [500, 900], ramp: 'fire', size: [1, 3], add: true }); emit(mk.x, mk.y - 10, 10, { ang: -Math.PI / 2, spread: 2.2, speed: [80, 220], g: 520, life: [500, 800], ramp: 'rock', size: [2, 3] }); VFX.shake(10, 400); crackBurst(mk.x, mk.y, 5); },
  impact: IMP.burst('ground', 12, [60, 200]) });
def('Earthquake', { charge: S => { const f = footOf(S); emit(f.x, f.y, 10, { r: 20, ang: -Math.PI / 2, spread: 2, speed: [30, 90], life: 500, ramp: 'dust', size: [2, 3] }); },
  exec: S => { dim(.3, 900, '30,20,10'); VFX.shake(18, 900); punch(side(S).x, side(S).y, 900, 1); const f = footOf(S); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; for (let d = 20; d < 260; d += 22) setTimeoutGame(d * 1.4, () => addScar('crack', f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * .6)); } },
  wave: w => { const r = w.r / 2, i = bx(w.x), j = by(w.y); aRing(i, j, r, r * .62, '#9a7038', .9, 2); aRing(i, j, r - 3, (r - 3) * .62, '#e7c27a', .6, 1); for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28; P(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * .62, { vy: -rnd2(100, 200), g: 500, life: 500, ramp: Math.random() < .5 ? 'rock' : 'dust', size: [2, 3][k % 2] }); } },
  impact: both(IMP.rocks(14), IMP.dust(14)) });

/* =====================================================================
   FLYING
   ===================================================================== */
def('Peck', { dash: DASH.trail('flying', 'feather', 1, 1), impact: S => { const h = headOf(S); for (let k = 0; k < 3; k++) setTimeoutGame(k * 60, () => ent(160, q => { const dx = (k - 1) * 8; for (let s = 0; s < 6; s++) aRect(bx(h.x + dx - 3 + s / 2), by(h.y + 4 + s), 6 - s, 1, '#ffd23f', 1 - q); })); IMP.burst('flying', 8, [60, 160], 'feather', 1)(S); } });
def('Wing Attack', { dash: S => { const sd = side(S); if (Math.random() < .5) P(sd.x, sd.y - 40, { vx: -sd.vx * .1, vy: 20, life: 600, color: '#ffffff', shape: 'feather', spin: 6, size: 1 }); }, impact: S => { IMP.claws('#d7e6ff', 2, 34, 3)(S); IMP.burst('flying', 12, [80, 200], 'feather', 1)(S); } });
def('Aerial Ace', { exec: S => DASH.speed('#ffffff')(S), dash: DASH.speed('#ffffff'), impact: S => { const h = headOf(S); ent(380, q => { const L = 60; for (let k = -L; k <= L; k++) { if (Math.abs(k) / L > q * 3) continue; aRect(bx(h.x + k), by(h.y + 8 - k * .35), 2, 2, Math.abs(k) < 6 ? '#ffffff' : '#d7e6ff', 1 - Math.max(0, q - .5) * 2); } }); screenFlash('#ffffff', .25); } });
def('Air Slash', { shot: SHOT.wind('#d7e6ff', 9), impact: both(IMP.claws('#ffffff', 2, 30, 2), IMP.burst('flying', 10, [80, 200])) });
def('Drill Peck', { dash: S => { const sd = side(S), a = clock.t / 20; for (let k = 0; k < 3; k++) P(sd.x + sd.face * 16 + Math.cos(a + k * 2.09) * 6, sd.y - 34 + Math.sin(a + k * 2.09) * 6, { life: 140, color: '#ffffff', size: 1 }); }, impact: S => { const h = headOf(S); ent(400, q => { for (let k = 0; k < 18; k++) { const a = q * 40 + k * .7, r = k * 1.2; PX(bx(h.x + Math.cos(a) * r), by(h.y + 8 + Math.sin(a) * r * .5), k % 3 ? '#d7e6ff' : '#ffd23f', 1 - q); } }); IMP.pow('#ffffff', 18)(S); } });
def('Brave Bird', { charge: S => { CH.rise('blueFire', 20)(S); dim(.3, 1000, '6,10,30'); }, dash: both(DASH.engulf('blueFire', 5), S => { const sd = side(S); ent(60, () => { const i = bx(sd.x), j = by(sd.y - 36), f = sd.face; for (const s of [-1, 1]) for (let k = 0; k < 16; k++) PX(i - f * k * .6, j + s * k * .9 - k * .2, rampAt(RAMP.blueFire, k / 18)); }); }),
  impact: S => { IMP.explode('blueFire', 26)(S); IMP.burst('flying', 16, [100, 280], 'feather', 1)(S); screenFlash('#d8f4ff', .45); VFX.shake(12, 400); } });
def('Hurricane', { charge: S => { dim(.35, 1200, '10,16,30'); CH.gather('flying', 20, 60)(S); }, shot: p => { const i = bx(p.x), j = by(p.y); for (let k = 0; k < 20; k++) { const a = clock.t / 40 + k * .5, r = 2 + k * .6; PX(i + Math.cos(a) * r, j - k * .8 + Math.sin(a) * r * .4, k % 4 ? '#d7e6ff' : '#ffffff'); } bctx.globalAlpha = 1; P(p.x, p.y, { vy: -40, life: 400, ramp: 'flying', size: 1 }); },
  impact: S => { const h = headOf(S); ent(900, q => { for (let k = 0; k < 30; k++) { const a = q * 20 + k * .5, r = 4 + k * .9; PX(bx(h.x + Math.cos(a) * r), by(h.y + 20 - k * 1.6 + Math.sin(a) * r * .3), k % 3 ? '#d7e6ff' : '#ffffff', 1 - q); } }); IMP.burst('flying', 16, [80, 220], 'feather', 1)(S); } });

/* =====================================================================
   PSYCHIC
   ===================================================================== */
def('Confusion', { charge: CH.gather('psychic', 10, 30), mark: mk => { ent(500, q => { for (let k = 0; k < 4; k++) { const qq = (q * 1.5 + k / 4) % 1; aRing(bx(mk.x), by(mk.y - 34), 4 + qq * 24, (4 + qq * 24) * .6, '#ff8ad8', 1 - qq); } }); }, impact: IMP.sparkle('psychic', 10) });
def('Psybeam', { charge: CH.gather('psychic', 14, 40), beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, len = 450 * grow, i0 = ax(b.x) - OX, j0 = ay(b.y) - OY, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 4; k < len; k += 9) { const r = 3 + Math.sin(k / 10 - clock.t / 60) * 1.5; for (let s = 0; s < 14; s++) { const a = s / 14 * 6.28; PX(i0 + ca * k - sa * Math.cos(a) * r * 1.6, j0 + sa * k + ca * Math.cos(a) * r * 1.6 + Math.sin(a) * r * .4, (k / 9 | 0) % 2 ? '#ff8ad8' : '#c89aff', fade); } } bctx.globalAlpha = 1; },
  impact: both(IMP.sparkle('psychic', 14), IMP.ring('#ff8ad8', 70, 1)) });
def('Psychic', { charge: S => { dim(.45, 1200, '30,8,30'); const h = headOf(S); ent(400, q => { for (let k = 0; k < 3; k++) aRing(bx(h.x), by(h.y - 6), 4 + q * 10 + k * 4, 2 + q * 4 + k * 2, '#ff8ad8', 1 - q); }); },
  mark: mk => { punch(mk.x, mk.y - 30, 900, 1); ent(800, q => { const i = bx(mk.x), j = by(mk.y - 34); for (let k = 0; k < 5; k++) { const qq = (q * 2 + k / 5) % 1; aRing(i, j, 6 + qq * 34, (6 + qq * 34) * .55, k % 2 ? '#ff8ad8' : '#c89aff', (1 - qq) * (1 - q * .5), 1); } glow(i, j, 22, '#ff6fc8', .5 * (1 - q)); }); },
  impact: S => { const sd = side(S); sd.hop = 1; IMP.sparkle('psychic', 22)(S); IMP.burst('psychic', 18, [100, 260])(S); } });
def('Zen Headbutt', { charge: S => { const h = headOf(S); ent(320, q => { glow(bx(h.x), by(h.y), 14, '#ff6fc8', .6); aRing(bx(h.x), by(h.y - 2), 10, 6, '#ffa8de', 1 - q); }); }, dash: DASH.engulf('psychic', 3), impact: both(IMP.pow('#ffa8de', 22), IMP.explode('psychic', 18)) });
def('Calm Mind', { exec: S => { dim(.3, 1000, '20,10,30'); const h = headOf(S); ent(1000, q => { for (let k = 0; k < 4; k++) { const qq = (q * 1.4 + k / 4) % 1; aRing(bx(h.x), by(h.y + 14), 6 + qq * 30, (6 + qq * 30) * .4, k % 2 ? '#9ad0ff' : '#ff8ad8', 1 - qq); } const i = bx(h.x), j = by(h.y - 8); aEllFill(i, j, 3, 2, '#ffffff', .9 * (1 - q)); PX(i, j, '#ff6fc8', 1 - q); }); } });
def('Agility', { exec: S => { const sd = side(S); ent(700, q => { for (let k = 0; k < 3; k++) { const o = (k + 1) * 10 * (1 - q); aRect(bx(sd.x - sd.face * o) - 6, by(sd.y - 50), 12, 40, k % 2 ? '#9ad0ff' : '#ff8ad8', .18 * (1 - q)); } }); for (let k = 0; k < 6; k++) setTimeoutGame(k * 80, () => speedLines(sd.x, sd.y - 30, sd.face > 0 ? 0 : Math.PI, 3, 30, '#ffa8de')); } });
def('Amnesia', { exec: S => { const h = headOf(S); for (let k = 0; k < 4; k++) setTimeoutGame(k * 140, () => P(h.x + (k - 1.5) * 10, h.y - 14, { vy: -40, life: 900, color: '#9ad0ff', shape: 'q', size: 1 })); ent(800, q => aRing(bx(h.x), by(h.y - 4), 12, 5, '#9ad0ff', 1 - q)); } });
def('Hypnosis', { charge: S => ent(300, q => { const h = headOf(S); aRing(bx(h.x), by(h.y), 4 + q * 10, 2 + q * 5, '#ff8ad8', 1 - q); }), shot: SHOT.psyRings(), impact: S => { const h = headOf(S); ent(900, q => { for (let k = 0; k < 3; k++) { const a = clock.t / 150 + k * 2.1; aRing(bx(h.x + Math.cos(a) * 4), by(h.y + 4), 6 + k * 4, 3 + k * 2, '#ff8ad8', 1 - q); } }); for (let k = 0; k < 3; k++) setTimeoutGame(200 + k * 180, () => P(h.x + 16, h.y - 6, { vy: -30, vx: 20, life: 900, color: '#e6ecff', shape: 'z', size: 1 })); } });
def('Rest', { exec: S => { const h = headOf(S); ent(1200, q => glow(bx(h.x), by(h.y + 14), 22, '#5a8ac8', .5 * (1 - q))); for (let k = 0; k < 4; k++) setTimeoutGame(k * 220, () => P(h.x + 14, h.y - 8, { vy: -30, vx: 18, life: 1100, color: '#e6ecff', shape: 'z', size: 1 })); IMP.sparkle('heal', 14)(S); } });

/* =====================================================================
   BUG
   ===================================================================== */
def('Bug Bite', { dash: DASH.trail('bug', 'sq', 1), impact: both(IMP.jaws('#d8f58a', 18), IMP.burst('bug', 8, [60, 160])) });
def('X-Scissor', { charge: S => ent(280, q => { const h = headOf(S), i = bx(h.x + side(S).face * 12), j = by(h.y + 6); aLine(i - 6, j - 6, i + 6, j + 6, '#d8f58a', 1, 2); aLine(i + 6, j - 6, i - 6, j + 6, '#d8f58a', 1, 2); }), impact: both(IMP.xslash('#c8f04a', 40), IMP.burst('bug', 14, [100, 240])) });
def('Leech Life', { shot: SHOT.drainOrb('bug'), impact: S => { const h = headOf(S), a = side(other(S)); IMP.jaws('#ff8a8a', 16)(S); for (let k = 0; k < 10; k++) setTimeoutGame(120 + k * 40, () => P(h.x, h.y + 10, { vx: (a.x - h.x) * 1.6, vy: (a.y - 44 - h.y) * 1.6 - 40, g: 40, life: 600, color: '#ff5a5a', shape: 'disc', size: 1, add: true })); } });
def('Pin Missile', { shot: SHOT.multi('#b6d636'), impact: S => { const h = headOf(S); ent(160, q => powStar(bx(h.x + (Math.random() - .5) * 16), by(h.y + 6 + (Math.random() - .5) * 12), 9, '#e0f58a', q)); } });
def('Signal Beam', { charge: CH.gather('bug', 14, 40), beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, len = 450 * grow; const alt = Math.floor(clock.t / 70) % 2; beamPx(ax(b.x) - OX, ay(b.y) - OY, b.ang, len, 5, alt ? 'bug' : ['#ffffff', '#ffe0f0', '#ff9ad8', '#e85aa8', '#a83a78', '#5a1a40'], fade, 1); },
  impact: S => { IMP.sparkle(['#ffffff', '#f8ffd8', '#ff9ad8', '#b6d636'], 18)(S); } });
def('Bug Buzz', { exec: S => dim(.25, 700), wave: w => { const r = w.r / 2, i = bx(w.x), j = by(w.y); for (let k = 0; k < 3; k++) { const rr = r - k * 6; if (rr < 2) continue; const n = Math.round(rr * 3); for (let s = 0; s < n; s++) { const a = s / n * 6.28, o = (s % 2 ? 1.5 : -1.5); PX(i + Math.cos(a) * (rr + o), j + Math.sin(a) * (rr + o) * .62, k ? '#b6d636' : '#f8ffd8', .9 - k * .25); } } bctx.globalAlpha = 1; }, impact: IMP.burst('bug', 14, [80, 200], 'plus', 1) });
def('String Shot', { shot: SHOT.string(), impact: S => { const h = headOf(S); ent(1200, q => { for (let k = 0; k < 6; k++) { const a = k / 6 * 3.14; aLine(bx(h.x - Math.cos(a) * 18), by(h.y + 10 - Math.sin(a) * 14), bx(h.x + Math.cos(a) * 18), by(h.y + 10 + Math.sin(a) * 14), '#f4f4f4', .8 * (1 - q), 1); } }); } });

/* =====================================================================
   GHOST
   ===================================================================== */
def('Lick', { dash: DASH.trail('ghost', 'sq', 1), impact: S => { const h = headOf(S); ent(420, q => { for (let k = 0; k < 18 * Math.min(1, q * 3); k++) aRect(bx(h.x - 10 + k), by(h.y + 18 - Math.sin(k / 5) * 8), 4, 3, k % 5 ? '#ff7a9a' : '#ffb0c0', 1 - Math.max(0, q - .6) * 2.5); }); ent(700, q => { const sd = side(S); if (Math.random() < .5) P(sd.x + (Math.random() - .5) * 30, sd.y - 40, { vy: -20, life: 400, color: '#c8a6ff', shape: 'zap', size: 1 }); }); } });
def('Shadow Claw', { charge: S => ent(300, q => { const h = headOf(S); glow(bx(h.x + side(S).face * 12), by(h.y + 8), 10, '#6a4ad8', .6); }), impact: S => { IMP.claws('#8c6bff', 3, 40, 3)(S); const h = headOf(S); ent(500, q => glow(bx(h.x), by(h.y + 10), 18, '#2d2068', .6 * (1 - q))); IMP.burst('ghost', 16, [80, 220])(S); } });
def('Shadow Ball', { charge: CH.orb(['#efe6ff', '#8c6bff', '#5a3ac8', '#2d2068', '#140e30', '#06040e'], 6, 320), shot: SHOT.shadow(6), impact: S => { IMP.explode('ghost', 24)(S); const h = headOf(S); emit(h.x, h.y + 10, 16, { speed: [40, 120], life: [600, 1000], ramp: 'ghost', size: [2, 4], size2: 1, vy: -40 }); } });
def('Night Shade', { charge: S => dim(.55, 1200, '4,2,10'), mark: mk => { ent(800, q => { const i = bx(mk.x), j = by(mk.y); for (let y = 0; y < 90; y++) { const w = 22 - y / 6 + Math.sin(y / 4 + clock.t / 50) * 3; aRect(i - w / 2, j - y, w, 1, y % 3 ? '#140e30' : '#2d2068', (1 - q) * .85); } for (const s of [-1, 1]) aRect(i + s * 5 - 1, j - 60, 3, 2, '#ff3a5a', 1 - q); }); VFX.shake(6, 400); }, impact: IMP.burst('ghost', 14, [60, 180]) });
def('Confuse Ray', { shot: SHOT.confuse(), impact: S => { const h = headOf(S); ent(1000, q => { for (let k = 0; k < 4; k++) { const a = clock.t / 120 + k * 1.57; PX(bx(h.x + Math.cos(a) * 16), by(h.y - 12 + Math.sin(a) * 4), k % 2 ? '#ffe86b' : '#c8a6ff', 1 - q); } }); } });

/* =====================================================================
   DRAGON
   ===================================================================== */
def('Dragon Breath', { charge: CH.orb('dragon', 5, 300), beam: BEAM(['#ffffff', '#e8fff0', '#a8ffd0', '#7d6bff', '#4a3ad0', '#24187a'], 1.2, 3, (b, wl) => { for (let k = 0; k < 3; k++) { const d = Math.random() * Math.min(wl, 300, bcap(b)); P(b.x + Math.cos(b.ang) * d, b.y + Math.sin(b.ang) * d, { vx: (Math.random() - .5) * 120, vy: -60, life: 400, ramp: k % 2 ? 'dragon' : ['#ffffff', '#c8ffe0', '#5ee08a', '#2a8a5a'], size: 2, size2: 1, add: true }); } }),
  impact: both(IMP.explode('dragon', 16), IMP.zap(3, '#a8ffd0')) });
def('Dragon Claw', { charge: S => ent(300, q => glow(bx(headOf(S).x + side(S).face * 12), by(headOf(S).y + 8), 12, '#7d6bff', .7)), dash: DASH.engulf('dragon', 2), impact: both(IMP.claws('#a99bff', 3, 44, 3), IMP.burst('dragon', 18, [100, 260])) });
def('Dragon Pulse', { charge: S => { CH.gather('dragon', 20, 54)(S); dim(.35, 1100, '10,6,30'); }, beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, len = 450 * grow, i0 = ax(b.x) - OX, j0 = ay(b.y) - OY, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    beamPx(i0, j0, b.ang, len, 4, 'dragon', fade, 0); for (let k = 0; k < len; k++) for (const s of [0, Math.PI]) { const o = Math.sin(k / 7 - clock.t / 35 + s) * 9; PX(i0 + ca * k - sa * o, j0 + sa * k + ca * o, s ? '#a99bff' : '#e5e0ff', fade); } bctx.globalAlpha = 1; },
  impact: both(IMP.explode('dragon', 24), IMP.ring('#a99bff', 110, 2)) });
def('Outrage', { charge: S => { dim(.45, 1400, '40,4,8'); CH.rise(['#ffffff', '#ffd0d0', '#ff5a5a', '#c81a2a', '#6a0a14'], 26)(S); }, dash: DASH.engulf(['#ffffff', '#ffd0d0', '#ff5a5a', '#c81a2a', '#6a0a14'], 6),
  impact: S => { const h = headOf(S); for (let k = 0; k < 5; k++) setTimeoutGame(k * 80, () => { ent(220, q => powStar(bx(h.x + (Math.random() - .5) * 34), by(h.y + 8 + (Math.random() - .5) * 26), 18, k % 2 ? '#ff5a5a' : '#a99bff', q)); VFX.shake(9, 140); }); screenFlash('#ff8080', .4); IMP.burst('dragon', 24, [120, 320])(S); } });
def('Dragon Dance', { exec: S => { const sd = side(S); ent(1000, q => { for (let k = 0; k < 2; k++) for (let s = 0; s < 24; s++) { const t = s / 24, a = t * 12 + q * 10 + k * Math.PI, r = 18 * (1 - t * .3); PX(bx(sd.x + Math.cos(a) * r), by(sd.y - t * 70 + Math.sin(a) * r * .35), k ? '#ff7a4a' : '#7d6bff', 1 - q); } }); CH.rise('dragon', 18)(S); } });

/* =====================================================================
   STEEL
   ===================================================================== */
def('Metal Claw', { charge: S => ent(260, q => { const h = headOf(S); PX(bx(h.x + side(S).face * 14), by(h.y + 4), '#ffffff'); glow(bx(h.x + side(S).face * 14), by(h.y + 4), 6, '#ffffff', .6 * (1 - q)); }), impact: both(IMP.claws('#e2ecf6', 3, 32, 2), IMP.sparkle('steel', 10)) });
def('Flash Cannon', { charge: S => { CH.orb('steel', 6, 320)(S); dim(.3, 1000); }, beam: BEAM('steel', 1.3, 0, (b, wl) => { const d = Math.random() * Math.min(wl, 300, bcap(b)); P(b.x + Math.cos(b.ang) * d, b.y + Math.sin(b.ang) * d, { life: 300, color: '#ffffff', shape: 'star', size: 2, add: true }); }),
  exec: S => screenFlash('#ffffff', .4), impact: both(IMP.explode('steel', 20), IMP.sparkle('steel', 16)) });
def('Iron Tail', { charge: S => ent(300, q => { const sd = side(S); glow(bx(sd.x - sd.face * 14), by(sd.y - 20), 10, '#ffffff', .6); }), impact: S => { const h = headOf(S); ent(380, q => { for (let k = 0; k < 40 * Math.min(1, q * 3); k++) { const a = Math.PI * (1.1 + k / 40 * .9), r = 26; aRect(bx(h.x + Math.cos(a) * r), by(h.y + 30 + Math.sin(a) * r), 3, 3, k > 34 ? '#ffffff' : '#cad8e6', 1 - Math.max(0, q - .6) * 2.5); } }); setTimeoutGame(140, () => { IMP.pow('#ffffff', 22)(S); IMP.sparkle('steel', 14)(S); VFX.shake(10, 300); }); } });
def('Iron Defense', { exec: S => { const sd = side(S); ent(900, q => { const i = bx(sd.x), j = by(sd.y - 30); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + q * 2; aLine(i + Math.cos(a) * 22, j + Math.sin(a) * 26, i + Math.cos(a + 1.05) * 22, j + Math.sin(a + 1.05) * 26, '#e2ecf6', 1 - q, 2); } aRect(i - 20 + q * 40, j - 30, 3, 60, '#ffffff', .7 * (1 - q)); }); IMP.sparkle('steel', 14)(S); } });

/* =====================================================================
   ROCK
   ===================================================================== */
def('Rock Throw', { charge: S => ent(260, q => rockPx(bx(headOf(S).x), by(headOf(S).y - 10 - q * 6), 4, 3)), shot: SHOT.rock(5), impact: both(IMP.rocks(10), IMP.dust(8), IMP.pow('#e3cb92', 16)) });
def('Rock Slide', { mark: mk => { for (let k = 0; k < 5; k++) setTimeoutGame(k * 50, () => { const x = mk.x + (Math.random() - .5) * 70, y = mk.y + (Math.random() - .5) * 26; ent(260, q => rockPx(bx(x), by(lerp(y - 260, y - 8, q * q)), 6, k + 11)); setTimeoutGame(260, () => { emit(x, y - 4, 10, { ang: -Math.PI / 2, spread: 2.4, speed: [60, 180], g: 500, life: 500, ramp: 'rock', size: [1, 3] }); addScar('crack', x, y); VFX.shake(6, 150); }); }); }, impact: IMP.dust(12) });
def('Stone Edge', { charge: S => dim(.3, 1100, '20,14,6'), mark: mk => { VFX.shake(12, 400); punch(mk.x, mk.y - 20, 800, 1); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, d = 6 + (k % 3) * 10, x = mk.x + Math.cos(a) * d * 1.6, y = mk.y + Math.sin(a) * d * .6, h = 26 + (k % 3) * 10; setTimeoutGame(k * 25, () => ent(900, q => spikePx(bx(x), by(y), h * Math.min(1, q * 6), 4, RAMP.rock, 1 - Math.max(0, q - .75) * 4))); } emit(mk.x, mk.y - 10, 24, { ang: -Math.PI / 2, spread: 2.4, speed: [100, 280], g: 500, life: 700, ramp: 'rock', size: [1, 3] }); crackBurst(mk.x, mk.y, 6); }, impact: IMP.rocks(10) });
def('Rock Polish', { exec: S => { const h = headOf(S); for (let k = 0; k < 8; k++) setTimeoutGame(k * 70, () => P(h.x + (Math.random() - .5) * 36, h.y + (Math.random() - .5) * 40, { life: 400, color: '#fff2cf', shape: 'star', size: 2, add: true })); ent(700, q => aRect(bx(h.x - 18 + q * 36), by(h.y - 20), 2, 50, '#ffffff', .6 * (1 - q))); } });

/* =====================================================================
   FAIRY
   ===================================================================== */
def('Fairy Wind', { shot: SHOT.breeze(), impact: IMP.sparkle('fairy', 18) });
def('Dazzling Gleam', { charge: S => { dim(.4, 900); CH.gather('fairy', 20, 50, 'star')(S); }, exec: S => { const h = headOf(S); screenFlash('#fff0fa', .7); ent(500, q => { for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; aLine(bx(h.x), by(h.y + 6), bx(h.x + Math.cos(a) * 160 * q), by(h.y + 6 + Math.sin(a) * 100 * q), k % 2 ? '#ffd0ef' : '#ffffff', 1 - q, 2); } }); },
  shot: p => { glow(bx(p.x), by(p.y), 8, '#ffd0ef', .7); aDisc(bx(p.x), by(p.y), 3, '#ffffff'); P(p.x, p.y, { life: 300, ramp: 'fairy', shape: 'star', size: 2, add: true }); }, impact: both(IMP.sparkle('fairy', 30), IMP.ring('#ffd0ef', 120, 2)) });
def('Moonblast', { charge: S => { dim(.6, 1500, '6,4,20'); const sd = side(S); ent(700, q => { const i = bx(sd.x), j = by(sd.y - 130); glow(i, j, 22, '#ffd0ef', .5 * Math.min(1, q * 3)); moonPx(i, j, 11, Math.min(1, q * 3)); }); },
  exec: S => { const sd = side(S); for (let k = 0; k < 20; k++) P(sd.x, sd.y - 130, { vy: 120, vx: (Math.random() - .5) * 60, life: 400, ramp: 'fairy', shape: 'star', size: 1, add: true }); }, shot: SHOT.moon(),
  impact: S => { IMP.explode('fairy', 26)(S); IMP.sparkle('fairy', 30)(S); screenFlash('#fff0fa', .5); punch(side(S).x, side(S).y - 30, 900, 1); } });
def('Play Rough', { dash: DASH.trail('fairy', 'heart', 1, 1), impact: S => { const h = headOf(S); ent(700, q => { for (let k = 0; k < 6; k++) { const a = clock.t / 60 + k, r = 12 + Math.sin(clock.t / 40 + k) * 4; aDisc(bx(h.x + Math.cos(a) * r), by(h.y + 10 + Math.sin(a) * r * .6), 6, '#f0e8f0', (1 - q) * .9); } }); for (let k = 0; k < 6; k++) setTimeoutGame(k * 90, () => { P(h.x + (Math.random() - .5) * 30, h.y + (Math.random() - .5) * 24, { vy: -60, life: 500, color: k % 2 ? '#ff7ac8' : '#ffe86b', shape: k % 2 ? 'heart' : 'star', size: 2 }); ent(160, q => powStar(bx(h.x + (Math.random() - .5) * 30), by(h.y + 8 + (Math.random() - .5) * 20), 10, '#ffffff', q)); }); } });
def('Charm', { exec: S => { const h = headOf(S); for (let k = 0; k < 4; k++) setTimeoutGame(k * 90, () => P(h.x + (k - 1.5) * 10, h.y - 8, { vy: -40, life: 700, color: '#ff7ac8', shape: 'heart', size: 1 })); }, shot: SHOT.heart(), impact: S => { const h = headOf(S); emit(h.x, h.y, 10, { speed: [30, 90], life: 700, color: '#ff7ac8', shape: 'heart', size: 1, vy: -30 }); } });

/* =====================================================================
   DARK
   ===================================================================== */
def('Bite', { dash: DASH.trail('dark', 'sq', 1), impact: both(IMP.jaws('#ffffff', 22), IMP.burst('dark', 8, [60, 160])) });
def('Crunch', { charge: S => dim(.3, 900, '10,6,14'), dash: DASH.engulf('dark', 2), impact: S => { IMP.jaws('#ffffff', 30)(S); setTimeoutGame(180, () => { IMP.burst('dark', 18, [100, 260])(S); crackBurst(footOf(S).x, footOf(S).y, 3); VFX.shake(10, 260); }); } });
