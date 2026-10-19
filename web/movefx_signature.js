/* =====================================================================
   Section 8d: signature move animations
   Each move below is choreographed from scratch for that move only:
   its own shapes, colours, timing, camera and screen effects. They use
   the basic drawing tools (particles, glows, lines, discs) but never
   a shared ready-made animation.
   ===================================================================== */
const sig = (name, r) => { MFX[name] = r; };
const hitstop = ms => { if (!REDUCED) HITSTOP.until = Math.max(HITSTOP.until, performance.now() + ms); };
const glowActor = (S, col, ms, a = .55) => { ACTOR_GLOW[S] = { col, a, until: clock.t + ms }; };
const bigHop = (S, k, ms = 600) => { const sd = side(S); sd.hopK = k; sd.hop = 1; setTimeoutGame(ms, () => { sd.hopK = 1; }); };
const angTo = S => { const a = side(S), b = side(other(S)); return Math.atan2(b.y - a.y, b.x - a.x); };
const easeOut = q => 1 - (1 - q) * (1 - q);

const GHOST_CACHE = new WeakMap();
// Afterimage: a coloured silhouette of the Pokémon's current frame, left on the ground layer to fade.
function ghostOf(S, col, life = 260, a0 = .5, dx = 0, dy = 0) {
  const sd = side(S), m = act(S); if (!m || sd.state !== 'idle' && sd.state !== 'mega') return;
  const sp = spriteOf(m.name, m.mega); let src, w, h, cx, foot, flip, k;
  if (sp.custom) { const back = sd.view === 'back' && sp.back, an = ensureAnim(back ? sp.back : sp.front); src = an.frames[animFrameIndex(an, clock.t)]; w = an.w; h = an.h; cx = an.cx; foot = an.foot; flip = back ? sd.face < 0 : sd.face > 0; k = .5; }
  else { src = sp.frames[0]; w = sp.w; h = sp.h; cx = w / 2; foot = sp.foot; flip = sd.face < 0; k = 1; }
  let per = GHOST_CACHE.get(src); if (!per) { per = {}; GHOST_CACHE.set(src, per); }      // one silhouette per frame and colour, reused
  let c = per[col]; if (!c) { c = per[col] = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, w, h); }
  const X = sd.x + dx, Y = sd.y + dy;
  ent(life, q => { const b = bctx; b.save(); b.globalAlpha = a0 * (1 - q); b.globalCompositeOperation = 'lighter'; b.translate(bx(X), by(Y)); b.scale(flip ? -k : k, k); b.drawImage(c, -cx, -(h - foot)); b.restore(); }, { under: true });
}
// Pixel flame tongue: hot white-yellow core, orange body, red tips, flickering.
function flamePx(i, j, h, w, t, ramp = RAMP.fire, a = 1) {
  for (let y = 0; y < h; y++) {
    const f = y / h, ww = Math.max(0, w * Math.pow(Math.sin(Math.PI * Math.min(1, (1 - f) * .85 + .15)), .7)), off = Math.sin(y * .45 + t / 55) * 1.6 * f;
    const cw = Math.round(ww), core = Math.round(ww * .45);
    if (cw > 0) aRect(i - cw + off, j - y, cw * 2 + 1, 1, ramp[Math.min(ramp.length - 1, 2 + Math.floor(f * 3.2))], a);
    if (core > 0 && f < .7) aRect(i - core + off, j - y, core * 2 + 1, 1, ramp[f < .3 ? 0 : 1], a);
  }
}
// Thick ring with a bright leading edge and a soft trailing edge.
function shockPx(i, j, r, flat, col, edge = '#ffffff', a = 1, th = 2) { aRing(i, j, r + 1, (r + 1) * flat, col, a * .5, th + 1); aRing(i, j, r, r * flat, edge, a, th); }

/* -------------------------------- ELECTRIC -------------------------------- */
sig('Thunderbolt', {
  charge: S => { glowActor(S, '#ffe04a', 700, .45); const sd = side(S);
    ent(650, (q, age) => { const h = headOf(S), i = bx(h.x), j = by(h.y + 6); glow(i, j, 6 + q * 10, '#fff07a', .5);
      for (let k = 0; k < 3; k++) { const a = Math.random() * 6.28, r = 14 + Math.random() * 8; zig(i + Math.cos(a) * 4, j + Math.sin(a) * 4, i + Math.cos(a) * r, j + Math.sin(a) * r * .8, '#ffe04a', 1, 3, '#ffffff'); }
      if (Math.random() < .5) P(sd.x + rnd2(-26, 26), sd.y - rnd2(10, 70), { vy: -40, life: 260, ramp: 'elec', shape: 'zap' }); }); },
  exec: S => { dim(.45, 900, '4,4,12'); const h = headOf(S); ent(260, q => zig(bx(h.x), by(h.y), bx(h.x + (Math.random() - .5) * 20), by(h.y - 260), '#fff07a', 2, 5, '#ffffff')); },
  mark: mk => { hitstop(70); screenFlash('#fffbd0', .7); VFX.shake(12, 340); punch(mk.x, mk.y - 30, 700, 1);
    ent(460, q => { const i = bx(mk.x), j = by(mk.y - 34), top = by(mk.y - 320), fade = 1 - q;
      zig(i + 6, top, i, j, '#ffd52a', 4, 9, '#ffffff'); if (q < .6) { zig(i, (top + j) / 2, i - 30, j + 12, '#fff07a', 2, 6, '#ffffff'); zig(i, (top + j) / 2 + 20, i + 34, j + 10, '#fff07a', 2, 6); }
      glow(i, j, 30 * fade, '#fff07a', .8 * fade);
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + q * 2; zig(i, j + 16, i + Math.cos(a) * (18 + q * 30), j + 16 + Math.sin(a) * (10 + q * 16), '#ffe04a', 1, 3); } });
    emit(mk.x, mk.y - 30, 34, { speed: [120, 340], life: [220, 520], ramp: 'elec', shape: 'zap', g: 300 });
    addScar('scorch', mk.x, mk.y); addScar('scorch', mk.x + 14, mk.y + 4); crackBurst(mk.x, mk.y, 3, 30); },
  impact: S => { glowActor(S, '#fff07a', 600, .7); const h = headOf(S);
    ent(800, () => { if (Math.random() < .6) { const a = Math.random() * 6.28; zig(bx(h.x), by(h.y + 8), bx(h.x + Math.cos(a) * 24), by(h.y + 8 + Math.sin(a) * 22), '#fff07a', 1, 2, '#ffffff'); } }); }
});
sig('Volt Tackle', {
  charge: S => { glowActor(S, '#ffe04a', 1100, .75); const sd = side(S);
    ent(420, q => { const i = bx(sd.x), j = by(sd.y - 26), r = 26 - q * 4; aRing(i, j, r, r * .9, '#ffe04a', .7, 1);
      for (let k = 0; k < 5; k++) { const a = Math.random() * 6.28, b = a + rnd2(.4, 1); zig(i + Math.cos(a) * r, j + Math.sin(a) * r * .9, i + Math.cos(b) * r, j + Math.sin(b) * r * .9, '#fff6b0', 1, 3, '#ffffff'); } }); },
  dash: S => { const sd = side(S), a = Math.atan2(sd.vy + .001, sd.vx + .001); if (Math.random() < .55) ghostOf(S, '#ffe04a', 200, .55);
    const x0 = sd.x, y0 = sd.y - 26; ent(130, () => zig(bx(x0 - Math.cos(a) * 30), by(y0), bx(x0), by(y0), '#ffe04a', 2, 4, '#ffffff'));
    P(sd.x + rnd2(-10, 10), sd.y - rnd2(8, 50), { vx: rnd2(-60, 60), vy: rnd2(-60, 20), life: 240, ramp: 'elec', shape: 'zap' }); },
  impact: (S, mv, crit) => { hitstop(crit ? 130 : 90); screenFlash('#fff6b0', .6); VFX.shake(13, 380); const h = headOf(S);
    ent(520, q => { const i = bx(h.x), j = by(h.y + 8), r = easeOut(q) * 52;
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + .3; zig(i, j, i + Math.cos(a) * r, j + Math.sin(a) * r * .8, '#ffd52a', 2, 4, '#ffffff'); }
      shockPx(i, j, r * .9, .7, '#ffd52a', '#ffffff', 1 - q, 2); glow(i, j, 20 * (1 - q), '#fff07a', .9); });
    emit(h.x, h.y + 8, 40, { speed: [160, 420], life: [250, 600], ramp: 'elec', shape: 'zap', g: 200 });
    const u = headOf(other(S)); emit(u.x, u.y + 10, 12, { speed: [60, 160], life: 300, ramp: 'elec', shape: 'zap' }); }
});
sig('Thunder Shock', {
  charge: S => { const h = headOf(S); ent(250, () => { if (Math.random() < .7) P(h.x + rnd2(-14, 14), h.y + rnd2(-6, 14), { life: 140, ramp: 'elec', shape: 'zap' }); }); },
  mark: mk => { screenFlash('#fffbd0', .25); ent(220, q => { const i = bx(mk.x), j = by(mk.y - 34); zig(i - 4, by(mk.y - 160), i, j, '#ffe04a', 2, 5, '#ffffff'); glow(i, j, 10 * (1 - q), '#fff07a', .6); });
    emit(mk.x, mk.y - 30, 12, { speed: [80, 200], life: 260, ramp: 'elec', shape: 'zap' }); }
});

/* -------------------------------- NORMAL -------------------------------- */
sig('Quick Attack', {
  charge: S => { const sd = side(S); ent(120, q => { const i = bx(sd.x), j = by(sd.y); aRect(i - 8 + q * 4, j, 16 - q * 8, 1, '#ffffff', 1 - q); PX(i, j - 1, '#ffffff'); }); },
  dash: S => { const sd = side(S); ghostOf(S, '#ffffff', 150, .45); const a = Math.atan2(sd.vy + .001, sd.vx + .001);
    for (let k = 0; k < 2; k++) { const o = rnd2(-24, 24); P(sd.x - Math.sin(a) * o, sd.y - 26 + Math.cos(a) * o, { vx: -Math.cos(a) * 520, vy: -Math.sin(a) * 520, life: 120, color: '#ffffff', size: 1 }); } },
  impact: S => { const h = headOf(S), a = angTo(other(S));
    ent(240, q => { const i = bx(h.x), j = by(h.y + 6), s = 12 * (1 - q * .5); aRect(i - s, j, s * 2 + 1, 1, '#ffffff', 1 - q); aRect(i, j - s, 1, s * 2 + 1, '#ffffff', 1 - q); aRing(i, j, 4 + q * 14, (4 + q * 14) * .7, '#ffffff', 1 - q);
      for (let k = -1; k <= 1; k++) aLine(i - Math.cos(a) * 26, j - Math.sin(a) * 26 + k * 4, i + Math.cos(a) * 26 * q, j + Math.sin(a) * 26 * q + k * 4, '#ffffff', .8 * (1 - q)); }); }
});
sig('Extreme Speed', {
  charge: S => { glowActor(S, '#ffffff', 300, .8); const sd = side(S); ent(110, q => aRing(bx(sd.x), by(sd.y), 20 * (1 - q), 6 * (1 - q), '#ffe9a0', 1, 1)); sd._es = { x: sd.x, y: sd.y }; },
  exec: S => { screenFlash('#ffffff', .25); dim(.35, 700, '10,8,0'); },
  dash: S => { const sd = side(S); ghostOf(S, '#ffe9a0', 230, .6); const st = sd._es || { x: sd.x, y: sd.y }, X = sd.x, Y = sd.y;
    ent(200, q => { aLine(bx(st.x), by(st.y - 26), bx(X), by(Y - 26), '#ffe9a0', .8 * (1 - q), 3); aLine(bx(st.x), by(st.y - 26), bx(X), by(Y - 26), '#ffffff', 1 - q, 1); }); },
  impact: S => { hitstop(70); const h = headOf(S);
    for (let k = 0; k < 5; k++) setTimeoutGame(k * 70, () => { const a = k * 1.25 + .4; screenFlash('#ffffff', .12); ent(200, q => { const i = bx(h.x), j = by(h.y + 6); aLine(i - Math.cos(a) * 34, j - Math.sin(a) * 34, i + Math.cos(a) * 34, j + Math.sin(a) * 34, '#ffe9a0', 1 - q, 2); aLine(i - Math.cos(a) * 34, j - Math.sin(a) * 34, i + Math.cos(a) * 34, j + Math.sin(a) * 34, '#ffffff', 1 - q, 1); });
      emit(h.x, h.y + 6, 6, { speed: [120, 260], life: 220, color: '#ffe9a0' }); VFX.shake(5, 90); }); }
});
sig('Body Slam', {
  charge: S => { bigHop(S, 4.5, 650); const sd = side(S); ent(300, q => aEllFill(bx(sd.x), by(sd.y), 10 + q * 10, 3 + q * 2, '#0b0f1a', .35)); },
  dash: S => { const sd = side(S); if (Math.random() < .5) P(sd.x, sd.y, { vx: rnd2(-40, 40), vy: -20, life: 360, ramp: 'dust', shape: 'disc', size: 2, size2: 4 }); },
  impact: (S, mv, crit) => { hitstop(crit ? 120 : 85); VFX.shake(15, 420); const sd = side(S);
    ent(560, q => { const i = bx(sd.x), j = by(sd.y), r = easeOut(q) * 60; aRing(i, j, r, r * .35, '#c9b08a', 1 - q, 2); aRing(i, j, r * .7, r * .25, '#f4ece0', 1 - q, 1); powStar(i, by(sd.y - 36), 26, '#ffffff', Math.min(1, q * 1.4)); }, { under: false });
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28; P(sd.x + Math.cos(a) * 18, sd.y + Math.sin(a) * 6, { vx: Math.cos(a) * rnd2(80, 160), vy: Math.sin(a) * 40 - 20, drag: 2, life: 700, ramp: 'dust', shape: 'disc', size: 2, size2: 5 }); }
    crackBurst(sd.x, sd.y, 6, 44); }
});
sig('Hyper Beam', {
  charge: S => { dim(.6, 1700, '12,6,0'); glowActor(S, '#ffb347', 900, .6); const sd = side(S), total = WINDUP(MOVES['Hyper Beam']) + 360;
    ent(total, q => { const i = bx(sd.x + sd.face * 18), j = by(sd.y - 32); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + q * 3; aLine(i, j, i + Math.cos(a) * (30 + q * 30), j + Math.sin(a) * (30 + q * 30), '#ffd27a', .25 + q * .3, 1); }
      orbPx(i, j, 3 + q * 7, 'fire', clock.t); if (Math.random() < .8) { const a = Math.random() * 6.28, r = rnd2(50, 90); P(sd.x + sd.face * 18 + Math.cos(a) * r * 2, sd.y - 32 + Math.sin(a) * r * 2, { vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, life: 420, ramp: 'fire', shape: 'sq', size: 1, add: true }); } VFX.shake(2 + q * 4, 60); }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .15), fade = q > .75 ? (1 - q) / .25 : 1, i0 = bx(b.x), j0 = by(b.y), len = 460 * grow, w = 10 * (1 + Math.sin(clock.t / 20) * .1);
    if (!b._scar) { b._scar = 1; for (let k = 60; k < 900; k += 40) addScar('scorch', b.x + Math.cos(b.ang) * k, b.y + 30 + Math.sin(b.ang) * k); }
    beamPx(i0, j0, b.ang, len, w * 1.6, ['#ffffff', '#fff6b0', '#ffd23f', '#ff9a1f', '#c8501c'], fade, 1.5);
    for (let k = 1; k < 8; k++) { const d = ((k * 60 + clock.t * .35) % len), cx = i0 + Math.cos(b.ang) * d, cy = j0 + Math.sin(b.ang) * d; aRing(cx, cy, 5, 12, '#fff6b0', .6 * fade, 1); }
    if (q < .6) emit(b.x + Math.cos(b.ang) * rnd2(40, 700), b.y + Math.sin(b.ang) * rnd2(40, 700), 2, { speed: [40, 140], life: 300, ramp: 'fire', size: 1 }); },
  impact: S => { hitstop(130); screenFlash('#fff6b0', .8); VFX.shake(18, 600); const h = headOf(S);
    ent(800, q => { const i = bx(h.x), j = by(h.y + 10); for (let k = 0; k < 3; k++) { const r = easeOut(Math.max(0, q - k * .1)) * (50 + k * 18); shockPx(i, j, r, .65, '#ff9a1f', '#fff6b0', 1 - q, 2); } glow(i, j, 26 * (1 - q), '#ffd23f', .9); });
    emit(h.x, h.y + 10, 50, { speed: [120, 420], life: [300, 800], ramp: 'fire', shape: 'disc', size: [1, 3], g: 160 }); emit(h.x, h.y, 16, { speed: [20, 70], vy: -60, life: [700, 1200], ramp: 'smoke', shape: 'disc', size: 3, size2: 7 }); }
});

/* -------------------------------- STEEL -------------------------------- */
sig('Iron Tail', {
  charge: S => { glowActor(S, '#e8f0ff', 650, .65); const sd = side(S); ent(320, q => { const i = bx(sd.x - sd.face * 20), j = by(sd.y - 20), s = Math.sin(q * Math.PI) * 6; aRect(i - s, j, s * 2 + 1, 1, '#ffffff'); aRect(i, j - s, 1, s * 2 + 1, '#ffffff'); }); },
  dash: S => { const sd = side(S); if (Math.random() < .4) P(sd.x - sd.face * 18, sd.y - 16, { vx: -sd.face * 80, vy: -30, g: 300, life: 260, color: '#ffffff', size: 1 }); },
  impact: S => { VFX.shake(10, 300); hitstop(60); const h = headOf(S), a = angTo(other(S));
    ent(380, q => { const i = bx(h.x), j = by(h.y + 6); for (let k = 0; k < Math.round(28 * Math.min(1, q * 3)); k++) { const t = a - 1.3 + k / 28 * 2.6, r = 24; aRect(i + Math.cos(t) * r - 2, j + Math.sin(t) * r * .7 - 2, 4, 4, '#9aaabb', 1 - q); aRect(i + Math.cos(t) * (r - 2) - 1, j + Math.sin(t) * (r - 2) * .7 - 1, 2, 2, '#ffffff', 1 - q); }
      aRing(i, j, 6 + q * 22, (6 + q * 22) * .6, '#ffffff', 1 - q); });
    emit(h.x, h.y + 6, 22, { speed: [160, 380], life: [200, 420], ramp: ['#ffffff', '#fff0b0', '#ffb24a', '#c86a1a'], shape: 'sq', g: 500 });
    for (let k = 0; k < 4; k++) P(h.x + rnd2(-20, 20), h.y + rnd2(-14, 14), { life: 420, color: '#ffffff', shape: 'star', size: 2 }); }
});
sig('Flash Cannon', {
  charge: S => { const sd = side(S), total = WINDUP(MOVES['Flash Cannon']) + 360;
    ent(total, q => { const i = bx(sd.x + sd.face * 18), j = by(sd.y - 32), r = 2 + q * 6; glow(i, j, r * 2.5, '#cad8e6', .6); aDisc(i, j, r, '#ffffff');
      aRect(i - 30 * q, j, 60 * q + 1, 1, '#ffffff', .8); aRect(i, j - 14 * q, 1, 28 * q + 1, '#ffffff', .6);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + clock.t / 200; PX(i + Math.cos(a) * (r + 6), j + Math.sin(a) * (r + 6), '#cad8e6'); } }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .18), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < len; k++) { const x = i0 + ca * k, y = j0 + sa * k; aRect(x - sa * 4 - 1, y + ca * 4 - 1, 2, 2, '#7ff7ff', .55 * fade); aRect(x + sa * 4 - 1, y - ca * 4 - 1, 2, 2, '#ff9cf0', .55 * fade); aRect(x - 3, y - 3, 6, 6, '#e6eef6', fade); aRect(x - 1, y - 1, 2, 2, '#ffffff', fade); }
    for (let k = 0; k < 4; k++) { const d = (k * 110 + clock.t * .6) % len; glow(i0 + ca * d, j0 + sa * d, 6, '#ffffff', .6 * fade); } },
  impact: S => { screenFlash('#ffffff', .5); hitstop(50); const h = headOf(S);
    ent(500, q => { const i = bx(h.x), j = by(h.y + 6), L = 70 * (1 - q * .4); aRect(i - L, j, L * 2, 1, '#ffffff', 1 - q); aRect(i, j - L * .5, 1, L, '#ffffff', 1 - q); aRect(i - L * .5, j - 1, L, 3, '#cad8e6', .5 * (1 - q)); glow(i, j, 16 * (1 - q), '#ffffff', .8);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28, r = 10 + q * 26; aRing(i + Math.cos(a) * r, j + Math.sin(a) * r * .7, 3, 3, '#cad8e6', 1 - q); } }); }
});
sig('Iron Defense', {
  exec: S => { glowActor(S, '#cad8e6', 1000, .55); const sd = side(S); VFX.shake(3, 200);
    ent(1000, q => { const i = bx(sd.x), j = by(sd.y - 28), R = 34 - easeOut(Math.min(1, q * 2)) * 10;
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + q * .6, hx = i + Math.cos(a) * R, hy = j + Math.sin(a) * R * .85;
        for (let s = 0; s < 6; s++) { const b1 = s / 6 * 6.28, b2 = (s + 1) / 6 * 6.28; aLine(hx + Math.cos(b1) * 6, hy + Math.sin(b1) * 6, hx + Math.cos(b2) * 6, hy + Math.sin(b2) * 6, s < 3 ? '#ffffff' : '#9aaabb', 1 - q * .7); } }
      const band = (q * 120) - 40; for (let y = -30; y < 6; y++) aRect(i + band + y * .6, j + y, 3, 1, '#ffffff', .5 * (1 - q)); });
    for (let k = 0; k < 6; k++) setTimeoutGame(k * 120, () => P(sd.x + rnd2(-26, 26), sd.y - rnd2(6, 60), { life: 360, color: '#ffffff', shape: 'star', size: 2 })); }
});

/* -------------------------------- WATER -------------------------------- */
sig('Hydro Pump', {
  charge: S => { const sd = side(S), total = WINDUP(MOVES['Hydro Pump']) + 360;
    ent(total, q => { const i = bx(sd.x), j = by(sd.y - 28); for (let s = 0; s < 2; s++) for (let k = 0; k < 18; k++) { const a = k / 18 * 6.28 * (s ? -1 : 1) + clock.t / (s ? 140 : 110); aRect(i + Math.cos(a) * (26 - s * 6), j + Math.sin(a) * (20 - s * 5), 2, 2, s ? '#d8f4ff' : '#4aa6ff', .7); }
      if (Math.random() < .7) { const a = Math.random() * 6.28; P(sd.x + Math.cos(a) * 70, sd.y - 28 + Math.sin(a) * 50, { vx: -Math.cos(a) * 200, vy: -Math.sin(a) * 140, life: 330, ramp: 'water', shape: 'drop', size: 1 }); } }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < len; k++) { const x = i0 + ca * k, y = j0 + sa * k, w1 = Math.sin(k / 7 - clock.t / 30) * 5, w2 = Math.sin(k / 7 - clock.t / 30 + Math.PI) * 5;
      aRect(x - 2, y - 2, 4, 4, '#2a6fc0', .45 * fade);
      aRect(x - sa * w1 - 2, y + ca * w1 - 2, 4, 3, '#4aa6ff', fade); aRect(x - sa * w1 - 1, y + ca * w1 - 2, 2, 1, '#d8f4ff', fade);
      aRect(x - sa * w2 - 2, y + ca * w2 - 2, 4, 3, '#8fd4ff', fade); }
    if (Math.random() < .9) { const d = rnd2(20, len) * 2; P(b.x + ca * d, b.y + sa * d, { vx: rnd2(-60, 60), vy: rnd2(-90, -20), g: 500, life: 380, ramp: 'water', shape: 'drop', size: 1 }); } },
  impact: S => { const h = headOf(S); VFX.shake(10, 320); screenFlash('#d8f4ff', .25);
    ent(520, q => { const i = bx(h.x), j = by(h.y + 30); aRing(i, j, 6 + q * 34, (6 + q * 34) * .35, '#d8f4ff', 1 - q, 2); aRing(i, j, q * 22, q * 8, '#4aa6ff', 1 - q, 1); });
    for (let k = 0; k < 30; k++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4; P(h.x, h.y + 10, { vx: Math.cos(a) * rnd2(80, 260), vy: Math.sin(a) * rnd2(120, 320), g: 700, life: [500, 800], ramp: 'water', shape: 'drop', size: 1 }); }
    addScar('splat', h.x, h.y + 44, { color: '#6d8fb0' }); addScar('splat', h.x + 12, h.y + 40, { color: '#8fb4d0' }); }
});
sig('Surf', {
  exec: S => { dim(.28, 1300, '0,8,22'); screenFlash('#8fd4ff', .2); },
  wave: w => { const i = bx(w.x), j = by(w.y), r = w.r / 2, fl = .62;
    aEllFill(i, j, r, r * fl, '#2a6fc0', .18);
    for (let k = 0; k < 160; k++) { const a = k / 160 * 6.28, wob = Math.sin(a * 9 + clock.t / 80) * 2, x = i + Math.cos(a) * (r + wob), y = j + Math.sin(a) * (r + wob) * fl;
      aRect(x - 1, y - 4, 3, 4, '#4aa6ff'); aRect(x - 1, y - 6, 3, 2, '#8fd4ff'); if ((k + Math.floor(clock.t / 60)) % 3 === 0) aRect(x - 1, y - 7, 2, 1, '#ffffff'); aRect(x - 1, y - 1, 3, 1, '#1a4080', .6); }
    if (Math.random() < .95) { const a = Math.random() * 6.28; P(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * fl - 10, { vx: Math.cos(a) * 60, vy: rnd2(-160, -60), g: 600, life: 420, ramp: 'water', shape: 'drop', size: 1 }); } },
  impact: S => { const h = headOf(S); bigHop(S, 2, 400); emit(h.x, h.y + 20, 26, { speed: [100, 280], ang: -Math.PI / 2, spread: 2.4, g: 600, life: [400, 700], ramp: 'water', shape: 'drop', size: 1 }); addScar('splat', h.x, h.y + 44, { color: '#6d8fb0' }); }
});
sig('Waterfall', {
  charge: S => { const sd = side(S); ent(320, q => { for (let k = 0; k < 7; k++) { const x = bx(sd.x + (k - 3) * 9), top = by(sd.y - 20 - q * 90); for (let y = top; y < by(sd.y); y += 2) aRect(x, y, 2, 2, (y + k + Math.floor(clock.t / 40)) % 6 < 2 ? '#d8f4ff' : '#4aa6ff', .75); } }); },
  dash: S => { const sd = side(S); P(sd.x + rnd2(-12, 12), sd.y - rnd2(10, 40), { vx: rnd2(-50, 50), vy: -60, g: 500, life: 360, ramp: 'water', shape: 'drop', size: 1 }); },
  impact: S => { VFX.shake(12, 380); hitstop(60); const h = headOf(S), sd = side(S);
    ent(560, q => { const x0 = bx(sd.x), top = by(sd.y - 320), bot = by(sd.y), fall = Math.min(1, q * 2.4);
      for (let k = -8; k <= 8; k++) for (let y = top; y < lerp(top, bot, fall); y += 2) if ((y + k * 3 + Math.floor(clock.t / 25)) % 7 < 5) aRect(x0 + k * 2, y, 2, 2, Math.abs(k) > 6 ? '#8fd4ff' : (y + k) % 5 ? '#4aa6ff' : '#ffffff', q > .7 ? (1 - q) / .3 : 1);
      if (fall >= 1) aRing(x0, bot, 10 + (q - .42) * 60, (10 + (q - .42) * 60) * .35, '#d8f4ff', 1 - q, 2); });
    setTimeoutGame(220, () => { for (let k = 0; k < 28; k++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.8; P(sd.x, sd.y - 4, { vx: Math.cos(a) * rnd2(80, 240), vy: Math.sin(a) * rnd2(100, 300), g: 700, life: 600, ramp: 'water', shape: 'drop', size: 1 }); } addScar('splat', sd.x, sd.y, { color: '#6d8fb0' }); }); }
});

/* -------------------------------- ICE -------------------------------- */
sig('Ice Beam', {
  charge: S => { glowActor(S, '#bff4ff', 700, .5); const sd = side(S), total = WINDUP(MOVES['Ice Beam']) + 360;
    ent(total, q => { const i = bx(sd.x + sd.face * 16), j = by(sd.y - 32); glow(i, j, 4 + q * 8, '#bff4ff', .6); if (Math.random() < .7) { const a = Math.random() * 6.28; P(sd.x + sd.face * 16 + Math.cos(a) * 60, sd.y - 32 + Math.sin(a) * 50, { vx: -Math.cos(a) * 160, vy: -Math.sin(a) * 130, life: 360, color: '#ffffff', shape: 'star', size: 1 }); } }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < len; k++) { const x = i0 + ca * k, y = j0 + sa * k; aRect(x - 2, y - 2, 4, 4, '#7fdcf0', .6 * fade); aRect(x - 1, y - 1, 2, 2, '#ffffff', fade); }
    for (let k = 14; k < len; k += 14) { const side_ = (k / 14) % 2 ? 1 : -1, x = i0 + ca * k, y = j0 + sa * k, L = 6 + ((k * 7) % 5);
      for (let s = 0; s < L; s++) { const ww = Math.max(0, 2 - s / 3); aRect(x - sa * s * side_ - ww, y + ca * s * side_ - ww, ww * 2 + 1, ww * 2 + 1, s > L - 2 ? '#ffffff' : '#bff4ff', fade); } }
    if (Math.random() < .8) { const d = rnd2(20, len) * 2; P(b.x + ca * d, b.y + sa * d, { vx: rnd2(-30, 30), vy: rnd2(-30, 30), life: 400, color: '#ffffff', shape: 'star', size: 1 }); } },
  impact: S => { glowActor(S, '#bff4ff', 700, .6); hitstop(50); const sd = side(S);
    ent(900, q => { const i = bx(sd.x), j = by(sd.y), g = easeOut(Math.min(1, q * 3)), a = q > .75 ? (1 - q) / .25 : 1;
      for (let k = 0; k < 7; k++) spikePx(i + (k - 3) * 7, j + Math.abs(k - 3), (14 + (k % 3) * 7) * g, 3, RAMP.ice, a); });
    setTimeoutGame(680, () => emit(sd.x, sd.y - 20, 22, { speed: [80, 220], life: [300, 600], ramp: 'ice', shape: 'shard', size: 1, spin: 8, g: 300 })); addScar('splat', sd.x, sd.y, { color: '#e9fbff' }); }
});

/* -------------------------------- GRASS -------------------------------- */
sig('Giga Drain', {
  shot: p => { const i = bx(p.x), j = by(p.y), pulse = 4 + Math.sin(clock.t / 60) * 1.2; glow(i, j, 10, '#7fe05a', .5); aDisc(i, j, pulse, '#3fb04a'); aDisc(i - 1, j - 1, pulse * .6, '#c8f58a'); PX(i - 2, j - 2, '#ffffff');
    for (let k = 0; k < 3; k++) { const a = clock.t / 90 + k * 2.1; shapeAt(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 12, { shape: 'leaf', color: '#7fe05a', size: 1, rot: a }); }
    if (Math.random() < .7) P(p.x, p.y, { life: 260, color: '#c8f58a', size: 1, add: true }); },
  hitAt: (x, y) => { ent(260, q => aRing(bx(x), by(y), 4 + q * 16, (4 + q * 16) * .8, '#c8f58a', 1 - q)); },
  impact: S => { const h = headOf(S), U = other(S);
    for (let k = 0; k < 14; k++) setTimeoutGame(k * 45, () => { const sx = h.x + rnd2(-14, 14), sy = h.y + rnd2(-8, 16), bend = rnd2(-60, 60);
      ent(520, q => { const u = headOf(U), t = easeOut(q), mx = (sx + u.x) / 2, my = Math.min(sy, u.y) - 50 + bend * .3, x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * u.x, y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * u.y;
        glow(bx(x), by(y), 3, '#7fe05a', .7); aRect(bx(x) - 1, by(y) - 1, 2, 2, '#f4ffd8'); }); });
    setTimeoutGame(560, () => glowActor(U, '#7fe05a', 500, .5)); emit(h.x, h.y + 8, 10, { speed: [60, 160], life: 500, color: '#7fe05a', shape: 'leaf', size: 1, spin: 6 }); }
});
sig('Sleep Powder', {
  shot: p => { for (let k = 0; k < 12; k++) { const a = k * 2.399 + p.t / 300, r = 4 + (k % 4) * 3 + Math.sin(p.t / 200 + k) * 2; glow(bx(p.x + Math.cos(a) * r * 2), by(p.y + Math.sin(a) * r * 1.4), 2, k % 3 ? '#9fe0c8' : '#a8c0ff', .5); PX(bx(p.x + Math.cos(a) * r * 2), by(p.y + Math.sin(a) * r * 1.4), '#eafff6'); } },
  hitAt: (x, y) => { const pos = { x, y };
    ent(1300, (q, age) => { const i = bx(pos.x), j = by(pos.y); aEllFill(i, j + 6, 20, 10, '#2a3a8a', .22 * (1 - q));
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28 + age / 260, r = 18 * (1 - q * .6) + Math.sin(age / 150 + k) * 3; PX(i + Math.cos(a) * r, j + Math.sin(a) * r * .6 - q * 14, k % 2 ? '#9fe0c8' : '#d8f0ff', 1 - q); } });
    for (let k = 0; k < 3; k++) setTimeoutGame(200 + k * 280, () => P(x + 10, y - 8, { vy: -36, vx: 14, life: 900, color: '#d8f0ff', shape: 'z', size: 1 })); }
});

/* -------------------------------- POISON -------------------------------- */
sig('Sludge Bomb', {
  shot: p => { if (!p._T) { const t = side(other(p.owner)); p._T = Math.max(300, Math.hypot(t.x - p.x, t.y - p.y) / p.speed * 1000); }
    const f = Math.min(1, p.t / p._T), lift = Math.sin(f * Math.PI) * 36, i = bx(p.x), j = by(p.y - lift), sq = 1 + Math.sin(clock.t / 50) * .18;
    aEllFill(bx(p.x), by(p.y) + 14, 5, 2, '#0b0f1a', .25); aEllFill(i, j, 6 * sq, 6 / sq, '#5a2088', 1); aEllFill(i - 1, j - 1, 5 * sq, 4.5 / sq, '#8a3ac8', 1); aDisc(i - 2, j - 3, 1.5, '#d8a0ff'); PX(i - 3, j - 4, '#ffffff');
    if (Math.random() < .5) P(p.x, p.y - lift * 2 + 8, { vy: 60, g: 400, life: 300, ramp: 'poison', shape: 'drop', size: 1 }); },
  impact: S => { const sd = side(S), h = headOf(S); VFX.shake(8, 260);
    for (let k = 0; k < 16; k++) { const a = -Math.PI / 2 + (Math.random() - .5) * 3; P(h.x, h.y + 6, { vx: Math.cos(a) * rnd2(80, 220), vy: Math.sin(a) * rnd2(100, 260), g: 600, life: [500, 800], ramp: 'poison', shape: 'disc', size: [1, 2] }); }
    for (let k = 0; k < 3; k++) addScar('splat', sd.x + rnd2(-16, 16), sd.y + rnd2(-4, 6), { color: '#5d2d78' });
    ent(1100, () => { if (Math.random() < .35) P(sd.x + rnd2(-18, 18), sd.y - 2, { vy: -50, life: 600, color: '#b65cff', shape: 'bubble', size: 2 }); });
    emit(h.x, h.y + 4, 6, { speed: [20, 60], vy: -40, life: 900, ramp: ['#8a3ac8', '#6a2a98', '#4a2068', '#2a1040'], shape: 'disc', size: 3, size2: 6 }); }
});
sig('Poison Jab', {
  charge: S => { glowActor(S, '#b65cff', 600, .5); const sd = side(S); ent(260, q => { const i = bx(sd.x + sd.face * (16 + q * 10)), j = by(sd.y - 28); aLine(i, j, i + sd.face * 10 * q, j, '#d8a0ff', 1, 2); PX(i + sd.face * 10 * q, j, '#ffffff'); }); },
  dash: S => { const sd = side(S); if (Math.random() < .4) P(sd.x, sd.y - 24, { life: 200, ramp: 'poison', size: 1 }); },
  impact: S => { hitstop(55); VFX.shake(8, 240); const h = headOf(S), a = angTo(other(S));
    ent(320, q => { const i = bx(h.x), j = by(h.y + 6), L = 46 * easeOut(Math.min(1, q * 3)); aLine(i - Math.cos(a) * L, j - Math.sin(a) * L, i + Math.cos(a) * L * .4, j + Math.sin(a) * L * .4, '#8a3ac8', 1 - q, 4); aLine(i - Math.cos(a) * L, j - Math.sin(a) * L, i + Math.cos(a) * L * .4, j + Math.sin(a) * L * .4, '#f6e6ff', 1 - q, 1);
      for (let k = 0; k < 6; k++) { const b = a + Math.PI + (k - 2.5) * .45; aLine(i, j, i + Math.cos(b) * L * .4, j + Math.sin(b) * L * .3, '#d8a0ff', 1 - q, 1); } });
    emit(h.x, h.y + 6, 14, { speed: [80, 200], ang: angTo(other(S)), spread: 1.4, g: 400, life: 500, ramp: 'poison', shape: 'drop', size: 1 }); }
});

/* -------------------------------- GROUND -------------------------------- */
sig('Earth Power', {
  exec: S => { dim(.35, 1000, '24,10,0'); },
  wave: w => { const i = bx(w.x), j = by(w.y), r = w.r / 2, fl = .62;
    for (let k = 0; k < 64; k++) { if ((k + (w.r | 0) / 20) % 4 < 1) continue; const a = k / 64 * 6.28; aRect(i + Math.cos(a) * r - 1, j + Math.sin(a) * r * fl - 1, 3, 2, k % 3 ? '#ff9a1f' : '#ffd23f', .85); }
    w._n = w._n || 0; while (w._n * 34 < w.r) { w._n++; const a = Math.random() * 6.28, x = w.x + Math.cos(a) * w.r, y = w.y + Math.sin(a) * w.r * fl, hgt = rnd2(10, 20);
      ent(520, q => { const g = q < .3 ? q / .3 : 1, f = q > .6 ? (1 - q) / .4 : 1; glow(bx(x), by(y) - 4, 6, '#ff9a1f', .4 * f); spikePx(bx(x), by(y), hgt * g, 3, RAMP.ground, f); }); addScar('crack', x, y); } },
  impact: S => { const sd = side(S); hitstop(70); VFX.shake(14, 420); bigHop(S, 2.5, 400);
    ent(700, q => { const i = bx(sd.x), j = by(sd.y), g = easeOut(Math.min(1, q * 4)), f = q > .6 ? (1 - q) / .4 : 1; glow(i, j - 8, 22 * f, '#ff9a1f', .6 * f);
      for (let k = 0; k < 5; k++) spikePx(i + (k - 2) * 9, j + Math.abs(k - 2) * 2, (30 - Math.abs(k - 2) * 7) * g, 4, RAMP.ground, f); });
    for (let k = 0; k < 10; k++) { const s = Math.floor(Math.random() * 1e6), x0 = sd.x, y0 = sd.y - 10, vx = rnd2(-160, 160), vy = rnd2(-360, -200);
      ent(800, (q, age) => { const t = age / 1000; rockPx(bx(x0 + vx * t), by(y0 + vy * t + 900 * t * t), 2, s, RAMP.rock); }); } }
});
sig('Earthquake', {
  exec: S => { bigHop(S, 3.5, 500); dim(.4, 1000, '20,12,4'); VFX.shake(16, 900); hitstop(40); },
  wave: w => { const i = bx(w.x), j = by(w.y), r = w.r / 2, fl = .62;
    for (let k = 0; k < 3; k++) { const rr = Math.max(0, r - k * 7); aRing(i, j, rr, rr * fl, k ? '#9a7038' : '#e7c27a', 1 - k * .3, k ? 1 : 3); }
    if (Math.random() < .95) for (let n = 0; n < 2; n++) { const a = Math.random() * 6.28; P(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * fl, { vx: Math.cos(a) * 30, vy: rnd2(-260, -140), g: 900, life: 520, ramp: 'rock', shape: 'disc', size: [1, 2] }); }
    if (Math.random() < .6) { const a = Math.random() * 6.28; P(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * fl, { vy: -20, drag: 1, life: 600, ramp: 'dust', shape: 'disc', size: 2, size2: 5 }); }
    w._c = w._c || 0; if (w.r - w._c > 40) { w._c = w.r; const a = Math.random() * 6.28; addScar('crack', w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * fl); } },
  impact: S => { bigHop(S, 3, 450); hitstop(60); const sd = side(S); emit(sd.x, sd.y - 4, 18, { speed: [60, 180], vy: -60, drag: 2, life: 700, ramp: 'dust', shape: 'disc', size: 2, size2: 5 }); }
});

/* -------------------------------- DARK -------------------------------- */
sig('Crunch', {
  charge: S => { dim(.35, 800, '10,6,14'); const sd = side(S); ent(300, () => { P(sd.x + rnd2(-20, 20), sd.y - rnd2(0, 50), { vy: -70, life: 400, ramp: 'dark', shape: 'disc', size: 1, size2: 3 }); }); },
  dash: S => { if (Math.random() < .6) ghostOf(S, '#5a3a78', 200, .55); },
  impact: S => { const h = headOf(S); hitstop(70); VFX.shake(11, 340);
    ent(460, q => { const i = bx(h.x), j = by(h.y + 6); glow(i, j, 22, '#8a3ac8', .5 * (1 - q)); jawsPx(i - 1, j + 1, q, '#1e1628', 36); jawsPx(i, j, q, '#ffffff', 34);
      if (q > .45) for (let k = 0; k < 5; k++) { const a = k * 1.26 + .5, r = 6 + (q - .45) * 50; aLine(i, j, i + Math.cos(a) * r, j + Math.sin(a) * r, '#d9cde8', 1 - q, 1); } });
    setTimeoutGame(200, () => { emit(h.x, h.y + 6, 18, { speed: [120, 280], life: 420, ramp: 'dark', shape: 'shard', size: 1, spin: 10, g: 200 }); crackBurst(side(S).x, side(S).y, 3, 24); }); }
});
sig('Bite', {
  impact: S => { const h = headOf(S); VFX.shake(6, 200);
    ent(300, q => { const i = bx(h.x), j = by(h.y + 6), gap = Math.round(lerp(16, 1, Math.min(1, q * 2.2)));
      for (let k = 0; k < 3; k++) { for (let s = 0; s < 6; s++) { aRect(i - gap - 6 + s, j - 8 + k * 6 + s / 2, 6 - s, 1, '#ffffff', 1 - q * .6); aRect(i + gap + s, j - 8 + k * 6 + s / 2, 6 - s, 1, '#ffffff', 1 - q * .6); } }
      if (q > .45) aRing(i, j, (q - .45) * 30, (q - .45) * 20, '#5a4a6a', 1 - q); });
    setTimeoutGame(130, () => emit(h.x, h.y + 6, 8, { speed: [60, 140], life: 260, ramp: 'dark', size: 1 })); }
});

/* -------------------------------- PSYCHIC -------------------------------- */
sig('Rest', {
  exec: S => { const sd = side(S); glowActor(S, '#a8c0ff', 1600, .35);
    ent(1700, (q, age) => { const i = bx(sd.x), j = by(sd.y - 30), pulse = 30 + Math.sin(age / 200) * 2; aRing(i, j, pulse, pulse * .9, '#a8c0ff', .5 * (1 - q)); moonPx(i + 22, j - 30 - q * 10, 6, Math.min(1, q * 4) * (1 - q));
      if (Math.random() < .2) P(sd.x + rnd2(-30, 30), sd.y - rnd2(20, 70), { life: 500, color: '#ffffff', shape: 'star', size: 1 }); });
    for (let k = 0; k < 4; k++) setTimeoutGame(k * 350, () => P(sd.x + 14, sd.y - 54, { vx: 16, vy: -30, life: 1100, color: '#d8e4ff', shape: 'z', size: 1 })); }
});
sig('Psychic', {
  mark: mk => { screenFlash('#ffa8de', .3); dim(.3, 800, '20,4,16'); const T = other(mk.owner); bigHop(T, 2.5, 600); punch(mk.x, mk.y - 30, 700, 1);
    ent(800, (q, age) => { const i = bx(mk.x), j = by(mk.y - 32);
      for (let k = 0; k < 4; k++) { const qq = (q * 2 + k / 4) % 1, r = 6 + qq * 34; aRing(i, j, r, r * .6, k % 2 ? '#ff6fc8' : '#ffa8de', (1 - qq) * (1 - q * .5)); }
      for (let k = 0; k < 5; k++) { const a = age / 300 + k * 1.256, x = i + Math.cos(a) * 26, y = j + Math.sin(a) * 14; aRect(x - 1, y - 2, 3, 1, '#ffe2f4'); aRect(x, y - 1, 1, 3, '#ffe2f4'); PX(x + 1, y + 1, '#ff6fc8'); } });
    setTimeoutGame(560, () => { emit(mk.x, mk.y - 32, 24, { speed: [80, 220], life: 500, ramp: 'psychic', shape: 'star', size: 1 }); VFX.shake(8, 220); }); },
  impact: S => { glowActor(S, '#ff6fc8', 500, .5); }
});
sig('Calm Mind', {
  exec: S => { const sd = side(S); glowActor(S, '#b9a4ff', 1300, .35);
    ent(1400, (q, age) => { const i = bx(sd.x), j = by(sd.y - 30);
      for (let k = 0; k < 3; k++) { const qq = (q * 1.5 + k / 3) % 1, r = 10 + qq * 40; aRing(i, j + 26, r, r * .35, '#b9a4ff', (1 - qq) * .7); }
      const ey = j - 34, a = Math.min(1, q * 3) * (1 - q); for (let s = 0; s < 5; s++) { aRect(i - s, ey - 4 + s, s * 2 + 1, 1, '#d8ccff', a); aRect(i - s, ey + 4 - s, s * 2 + 1, 1, '#d8ccff', a); } aDisc(i, ey, 1.5, '#ffffff', a);
      for (let k = 0; k < 3; k++) { const b = age / 500 + k * 2.09, x = i + Math.cos(b) * 30, y = j + Math.sin(b) * 12; aLine(x - 3, y + 2, x, y - 3, '#b9a4ff', .8); aLine(x, y - 3, x + 3, y + 2, '#b9a4ff', .8); aLine(x - 3, y + 2, x + 3, y + 2, '#b9a4ff', .8); } }); }
});
sig('Agility', {
  exec: S => { const sd = side(S); glowActor(S, '#a8d8ff', 900, .4);
    for (let k = 0; k < 6; k++) setTimeoutGame(k * 90, () => { const o = (k % 2 ? 1 : -1) * (18 + k * 6); ghostOf(S, '#7fc8ff', 300, .5, o, 0); });
    ent(700, () => { if (Math.random() < .8) { const y = sd.y - rnd2(5, 60); P(sd.x - 50, y, { vx: 520, life: 160, color: '#ffffff', size: 1 }); } }); }
});
sig('Recover', {
  exec: S => { const sd = side(S); glowActor(S, '#c8ffd8', 1200, .45);
    ent(1300, q => { const i = bx(sd.x), top = by(sd.y - 300), bot = by(sd.y), a = Math.sin(q * Math.PI);
      for (let x = -9; x <= 9; x++) aRect(i + x, top, 1, bot - top, Math.abs(x) < 3 ? '#ffffff' : '#c8ffd8', a * (Math.abs(x) < 3 ? .5 : .18));
      aRing(i, bot, 16 + Math.sin(q * 12) * 2, 5, '#7dff9a', a); });
    for (let k = 0; k < 10; k++) setTimeoutGame(k * 100, () => P(sd.x + rnd2(-18, 18), sd.y - rnd2(0, 20), { vy: -70, life: 800, color: '#7dff9a', shape: 'plus', size: 1 })); }
});

/* -------------------------------- FIRE -------------------------------- */
sig('Flamethrower', {
  charge: S => { glowActor(S, '#ff9a1f', 700, .4); const sd = side(S), total = WINDUP(MOVES['Flamethrower']) + 360;
    ent(total, q => { const i = bx(sd.x + sd.face * 18), j = by(sd.y - 32); glow(i, j, 4 + q * 6, '#ff9a1f', .6); if (Math.random() < .7) { const a = Math.random() * 6.28; P(sd.x + sd.face * 18 + Math.cos(a) * 50, sd.y - 32 + Math.sin(a) * 40, { vx: -Math.cos(a) * 140, vy: -Math.sin(a) * 110, life: 340, ramp: 'fire', size: 1, add: true }); } }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .25), fade = q > .75 ? (1 - q) / .25 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < len; k += 5) { const f = k / 450, x = i0 + ca * k, y = j0 + sa * k, wob = Math.sin(k / 9 - clock.t / 35) * (2 + f * 4), r = 2 + f * 9 + Math.sin(k + clock.t / 40) * 1.2;
      aDisc(x - sa * wob, y + ca * wob, r, RAMP.fire[Math.min(5, 2 + Math.floor(f * 4))], fade); aDisc(x - sa * wob, y + ca * wob, r * .55, RAMP.fire[f < .3 ? 0 : 1], fade); }
    if (Math.random() < .9) { const d = rnd2(20, len) * 2; P(b.x + ca * d, b.y + sa * d, { vx: rnd2(-40, 40), vy: rnd2(-80, -20), life: 500, ramp: 'fire', size: 1, add: true }); }
    if (Math.random() < .3) { const d = rnd2(60, len) * 2; P(b.x + ca * d, b.y + sa * d - 10, { vy: -40, life: 800, ramp: 'smoke', shape: 'disc', size: 2, size2: 5 }); } },
  impact: S => { const sd = side(S); VFX.shake(9, 300);
    ent(700, (q, age) => { const i = bx(sd.x), j = by(sd.y), f = q > .6 ? (1 - q) / .4 : 1; for (let k = 0; k < 5; k++) flamePx(i + (k - 2) * 8, j + Math.abs(k - 2), (22 - Math.abs(k - 2) * 5) * Math.min(1, q * 4), 4, age + k * 90, RAMP.fire, f); });
    emit(sd.x, sd.y - 20, 18, { speed: [60, 160], vy: -80, life: [400, 700], ramp: 'fire', size: 1, add: true }); addScar('scorch', sd.x, sd.y); }
});
sig('Flare Blitz', {
  charge: S => { glowActor(S, '#ff7a1a', 1100, .8); const sd = side(S);
    ent(380, (q, age) => { const i = bx(sd.x), j = by(sd.y); for (let k = 0; k < 6; k++) flamePx(i + (k - 2.5) * 9, j + 2, 26 + Math.sin(age / 60 + k) * 6, 4, age + k * 70, RAMP.fire, .9); }); },
  dash: S => { const sd = side(S); if (Math.random() < .6) ghostOf(S, '#ff7a1a', 220, .6);
    for (let k = 0; k < 2; k++) P(sd.x + rnd2(-14, 14), sd.y - rnd2(0, 40), { vx: -sd.vx * .3 + rnd2(-30, 30), vy: rnd2(-90, -30), life: 420, ramp: 'fire', shape: 'disc', size: 2, size2: 0, add: true });
    if (Math.random() < .3) addScar('scorch', sd.x, sd.y + 2); },
  impact: (S, mv, crit) => { hitstop(crit ? 140 : 100); screenFlash('#ffb347', .6); VFX.shake(16, 480); const sd = side(S); punch(sd.x, sd.y - 30, 900, 1);
    ent(800, (q, age) => { const i = bx(sd.x), j = by(sd.y), f = q > .55 ? (1 - q) / .45 : 1, g = easeOut(Math.min(1, q * 3));
      for (let k = 0; k < 7; k++) flamePx(i + (k - 3) * 8, j + Math.abs(k - 3), (46 - Math.abs(k - 3) * 9) * g, 5, age + k * 50, RAMP.fire, f);
      const r = easeOut(q) * 64; shockPx(i, j - 4, r, .35, '#ff9a1f', '#ffe36b', 1 - q, 2); });
    for (let k = 0; k < 26; k++) P(sd.x + rnd2(-30, 30), sd.y - rnd2(40, 100), { vx: rnd2(-80, 80), vy: rnd2(-120, 20), g: 260, life: [600, 1000], ramp: 'fire', size: 1, add: true });
    emit(sd.x, sd.y - 30, 10, { speed: [20, 60], vy: -60, life: 1000, ramp: 'smoke', shape: 'disc', size: 3, size2: 8 }); addScar('scorch', sd.x, sd.y); addScar('scorch', sd.x + 10, sd.y + 6); }
});
sig('Will-O-Wisp', {
  shot: p => { for (let k = 0; k < 3; k++) { const a = p.t / 160 + k * 2.094, x = p.x + Math.cos(a) * 16, y = p.y + Math.sin(a) * 10 + Math.sin(p.t / 90 + k) * 3; flamePx(bx(x), by(y) + 3, 8, 2, clock.t + k * 100, RAMP.wisp, .95); glow(bx(x), by(y), 4, '#9f8bff', .4); }
    if (Math.random() < .5) P(p.x, p.y, { vy: -20, life: 400, ramp: 'wisp', size: 1, add: true }); },
  hitAt: (x, y) => { const T = { x, y };
    ent(900, (q, age) => { for (let k = 0; k < 3; k++) { const a = age / 120 + k * 2.094, r = 26 * (1 - q), px = T.x + Math.cos(a) * r * 2, py = T.y + Math.sin(a) * r; flamePx(bx(px), by(py) + 3, 8, 2, age + k * 100, RAMP.wisp, 1 - q * .3); } if (q > .85) glow(bx(T.x), by(T.y), 14, '#7fd6ff', .7); }); }
});

/* -------------------------------- FLYING -------------------------------- */
sig('Air Slash', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), spin = p.t / 25, i = bx(p.x), j = by(p.y);
    for (let g = 2; g >= 0; g--) { const back = g * 3; for (let k = -8; k <= 8; k++) { const t = spin + k * .17, r = 10 - Math.abs(k) * .35; PX(i - Math.cos(a) * back + Math.cos(t) * r, j - Math.sin(a) * back + Math.sin(t) * r * .55, g ? '#a8c0f0' : (Math.abs(k) < 3 ? '#ffffff' : '#d7e6ff'), g ? .35 : 1); } }
    if (Math.random() < .6) P(p.x, p.y, { vx: -p.vx * .2, vy: -p.vy * .2, life: 200, color: '#ffffff', size: 1 }); },
  hitAt: (x, y) => { ent(240, q => { const i = bx(x), j = by(y); aLine(i - 14, j - 10, i + 14, j + 10, '#ffffff', 1 - q, 1); aLine(i - 14, j + 10, i + 14, j - 10, '#d7e6ff', 1 - q, 1); }); },
  impact: S => { const h = headOf(S); emit(h.x, h.y + 8, 8, { speed: [40, 120], life: 600, color: '#ffffff', shape: 'feather', size: 1, spin: 4, g: 40 }); }
});
sig('Brave Bird', {
  charge: S => { glowActor(S, '#8fd4ff', 1100, .7); const sd = side(S);
    ent(380, q => { const i = bx(sd.x), j = by(sd.y - 30), open = easeOut(Math.min(1, q * 2));
      for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + s * (.5 + k * .22) * open, L = 18 + k * 3; aLine(i, j, i + Math.cos(a) * L * s * s, j + Math.sin(a) * L * .8, k % 2 ? '#7fd6ff' : '#d8f4ff', .85, 2); } }); },
  dash: S => { const sd = side(S); ghostOf(S, '#7fd6ff', 220, .55); for (let k = 0; k < 2; k++) P(sd.x + rnd2(-12, 12), sd.y - rnd2(10, 50), { vx: -sd.vx * .3, vy: rnd2(-40, 10), life: 420, ramp: 'blueFire', shape: 'disc', size: 2, size2: 0, add: true }); },
  impact: (S, mv, crit) => { hitstop(crit ? 130 : 95); screenFlash('#d8f4ff', .55); VFX.shake(14, 420); const h = headOf(S);
    ent(600, q => { const i = bx(h.x), j = by(h.y + 8), r = easeOut(q) * 56; shockPx(i, j, r, .7, '#3f8cff', '#d8f4ff', 1 - q, 3); glow(i, j, 24 * (1 - q), '#7fd6ff', .8); });
    emit(h.x, h.y + 8, 30, { speed: [140, 360], life: [300, 600], ramp: 'blueFire', shape: 'disc', size: [1, 2], add: true });
    emit(h.x, h.y + 8, 12, { speed: [40, 140], life: [800, 1200], color: '#f0f6ff', shape: 'feather', size: 1, spin: 4, g: 30, drag: 1 }); }
});

/* -------------------------------- DRAGON -------------------------------- */
sig('Dragon Pulse', {
  charge: S => { glowActor(S, '#7d6bff', 800, .5); const sd = side(S), total = WINDUP(MOVES['Dragon Pulse']) + 360;
    ent(total, (q, age) => { const i = bx(sd.x), j = by(sd.y - 30); for (let k = 0; k < 8; k++) { const a = age / 250 + k * .785, x = i + Math.cos(a) * 30, y = j + Math.sin(a) * 22; aRect(x - 1, y - 1, 3, 3, k % 2 ? '#a99bff' : '#e5e0ff', .9); aLine(x, y, i + Math.cos(a + .785) * 30, j + Math.sin(a + .785) * 22, '#4a3ad0', .5); } }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < len; k++) { const x = i0 + ca * k, y = j0 + sa * k, s = Math.sin(k / 6 - clock.t / 25) * 4; aRect(x - 3, y - 3, 6, 6, '#24187a', .8 * fade); aRect(x - sa * s - 1, y + ca * s - 1, 2, 2, '#a99bff', fade); aRect(x + sa * s - 1, y - ca * s - 1, 2, 2, '#e5e0ff', fade); }
    for (let k = 0; k < 6; k++) { const d = (k * 75 + clock.t * .5) % len, rr = 4 + (d / len) * 8; aRing(i0 + ca * d, j0 + sa * d, rr * .6, rr, '#7d6bff', .8 * fade, 1); } },
  impact: S => { hitstop(70); dim(.3, 500, '10,4,30'); const h = headOf(S); VFX.shake(11, 360);
    ent(560, q => { const i = bx(h.x), j = by(h.y + 6), r = easeOut(q) * 50; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28, rr = r * (k % 2 ? .75 : 1.05); aLine(i + Math.cos(a) * r * .5, j + Math.sin(a) * r * .35, i + Math.cos(a) * rr, j + Math.sin(a) * rr * .7, '#7d6bff', 1 - q, 2); } glow(i, j, 18 * (1 - q), '#a99bff', .8); });
    emit(h.x, h.y + 6, 20, { speed: [120, 300], life: 500, ramp: 'dragon', shape: 'shard', size: 1, spin: 8 }); }
});
sig('Dragon Dance', {
  exec: S => { const sd = side(S); glowActor(S, '#a99bff', 1300, .45); bigHop(S, 2, 500);
    ent(1300, (q, age) => { const i = bx(sd.x), j = by(sd.y);
      for (let s = 0; s < 2; s++) for (let k = 0; k < 20; k++) { const t = k / 20, a = age / 140 + t * 9 + s * Math.PI, y = j - t * 70 * Math.min(1, q * 2.5), x = i + Math.cos(a) * 18 * (1 - t * .3); aRect(x - 1, y - 1, 2, 2, s ? RAMP.fire[1 + (k % 3)] : RAMP.dragon[1 + (k % 3)], (1 - t) * (q > .8 ? (1 - q) / .2 : 1)); }
      aRing(i, j, 22, 7, '#7d6bff', .6 * (1 - q), 1); }); }
});

/* -------------------------------- BUG -------------------------------- */
sig('X-Scissor', {
  charge: S => { const sd = side(S); ent(260, q => { const i = bx(sd.x + sd.face * 14), j = by(sd.y - 30), L = 8 + q * 8; aLine(i - L, j - L, i + L, j + L, '#b6d636', 1, 2); aLine(i - L, j + L, i + L, j - L, '#e0f58a', 1, 2); PX(i, j, '#ffffff'); }); },
  impact: S => { const h = headOf(S); VFX.shake(10, 320); hitstop(60);
    const cut = (dir, delay) => ent(320, q => { const i = bx(h.x), j = by(h.y + 6), L = 34, d = Math.min(1, q * 3.5), x0 = i - L * dir, y0 = j - L, x1 = lerp(x0, i + L * dir, d), y1 = lerp(y0, j + L, d); aLine(x0, y0, x1, y1, '#86a82a', 1 - q, 5); aLine(x0, y0, x1, y1, '#e0f58a', 1 - q, 3); aLine(x0, y0, x1, y1, '#ffffff', 1 - q, 1); }, { delay });
    cut(1, 0); cut(-1, 110); setTimeoutGame(160, () => { ent(300, q => { const i = bx(h.x), j = by(h.y + 6), s = 10 * (1 - q); aRect(i - s, j, s * 2 + 1, 1, '#ffffff', 1 - q); aRect(i, j - s, 1, s * 2 + 1, '#ffffff', 1 - q); }); emit(h.x, h.y + 6, 14, { speed: [100, 240], life: 360, ramp: 'bug', size: 1 }); }); }
});
sig('Pin Missile', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), i = bx(p.x), j = by(p.y), ca = Math.cos(a), sa = Math.sin(a);
    for (let g = 0; g < 3; g++) for (let k = 0; k < 7; k++) PX(i - ca * (k + g * 5), j - sa * (k + g * 5), k === 0 ? '#ffffff' : '#b6d636', g ? .25 : 1);
    PX(i - sa, j + ca, '#e0f58a'); if (Math.floor(clock.t / 60) % 2) PX(i, j - 1, '#ffffff'); },
  hitAt: (x, y) => { ent(220, q => { const i = bx(x), j = by(y); for (let k = 0; k < 4; k++) { const a = k * 1.57 + .78; aLine(i, j, i + Math.cos(a) * 6 * (1 - q), j + Math.sin(a) * 6 * (1 - q), '#e0f58a', 1 - q, 1); } }); },
  impact: S => { const h = headOf(S); P(h.x + rnd2(-10, 10), h.y + rnd2(-4, 14), { life: 260, color: '#ffffff', shape: 'star', size: 1 }); }
});

/* -------------------------------- FIGHTING -------------------------------- */
sig('Close Combat', {
  charge: S => { glowActor(S, '#ff8a5b', 800, .6); const sd = side(S); ent(300, (q, age) => { for (let k = 0; k < 4; k++) flamePx(bx(sd.x) + (k - 1.5) * 10, by(sd.y) + 2, 18 + Math.sin(age / 50 + k) * 4, 3, age + k * 60, RAMP.fight, .7); }); },
  impact: (S, mv, crit) => { const h = headOf(S);
    for (let k = 0; k < 7; k++) setTimeoutGame(k * 75, () => { const ox = rnd2(-18, 18), oy = rnd2(-14, 18), dir = Math.random() < .5 ? 1 : -1; VFX.shake(5, 80);
      ent(200, q => { const i = bx(h.x + ox), j = by(h.y + oy); fistPx(i, j, 2, '#ffc08a', dir); powStar(i, j, 12, '#fff0d8', q); }); });
    setTimeoutGame(560, () => { hitstop(crit ? 120 : 90); screenFlash('#ffc08a', .4); VFX.shake(13, 320);
      ent(420, q => { const i = bx(h.x), j = by(h.y + 6); powStar(i, j, 30, '#ffffff', q); shockPx(i, j, easeOut(q) * 48, .7, '#ff8a5b', '#fff0d8', 1 - q, 2); });
      emit(h.x, h.y + 6, 20, { speed: [140, 320], life: 400, ramp: 'fight', size: 1 }); }); }
});

/* -------------------------------- ROCK -------------------------------- */
sig('Stone Edge', {
  charge: S => { dim(.3, 1100, '20,14,6'); },
  mark: mk => { hitstop(60); VFX.shake(13, 420); punch(mk.x, mk.y - 20, 800, 1);
    const spires = Array.from({ length: 7 }, (_, k) => ({ dx: (k - 3) * 9 + rnd2(-3, 3), dy: rnd2(-6, 6), h: rnd2(18, 40), delay: k * 25 }));
    ent(1100, (q, age) => { for (const s of spires) { const t = Math.max(0, age - s.delay), g = Math.min(1, t / 120), f = q > .75 ? (1 - q) / .25 : 1; spikePx(bx(mk.x + s.dx * 2), by(mk.y + s.dy), s.h * easeOut(g), 4, RAMP.rock, f); if (g > 0 && g < 1) PX(bx(mk.x + s.dx * 2), by(mk.y + s.dy) - s.h * g, '#fff2cf'); } });
    for (let k = 0; k < 8; k++) { const sd = Math.floor(Math.random() * 1e6), vx = rnd2(-180, 180), vy = rnd2(-380, -200); ent(900, (q, age) => { const t = age / 1000; rockPx(bx(mk.x + vx * t), by(mk.y - 10 + vy * t + 900 * t * t), 2, sd); }); }
    emit(mk.x, mk.y, 18, { speed: [40, 140], vy: -40, drag: 2, life: 700, ramp: 'dust', shape: 'disc', size: 2, size2: 5 }); crackBurst(mk.x, mk.y, 5, 40); },
  impact: S => { const h = headOf(S); emit(h.x, h.y + 10, 8, { speed: [80, 200], life: 400, ramp: 'rock', size: 1, g: 500 }); }
});

/* -------------------------------- NORMAL (status) -------------------------------- */
sig('Swords Dance', {
  exec: S => { const sd = side(S); glowActor(S, '#ff8a72', 1300, .4);
    ent(1300, (q, age) => { const i = bx(sd.x), j = by(sd.y - 30), spin = age / 180, rise = q > .65 ? (q - .65) / .35 : 0, R = 30 * (1 - rise * .8);
      for (let k = 0; k < 6; k++) { const a = spin + k * 1.047, x = i + Math.cos(a) * R, y = j + Math.sin(a) * R * .5 - rise * 40; swordPx(x, y, rise ? -Math.PI / 2 : a + Math.PI / 2); }
      if (q > .9) { glow(i, j - 40, 14, '#ffffff', .8); } });
    setTimeoutGame(1180, () => { screenFlash('#fff0e0', .3); emit(sd.x, sd.y - 110, 14, { speed: [60, 160], life: 500, color: '#ffffff', shape: 'star', size: 1 }); }); }
});

/* -------------------------------- GHOST -------------------------------- */
sig('Confuse Ray', {
  shot: p => { const i = bx(p.x), j = by(p.y + Math.sin(p.t / 70) * 6), r = 4 + Math.sin(p.t / 50) * 1.5; glow(i, j, 10, p.t % 400 < 200 ? '#fff07a' : '#b9a4ff', .6); aDisc(i, j, r, '#fff6b0'); aDisc(i, j, r * .5, '#ffffff'); aRing(i, j, r + 4, r + 4, '#b9a4ff', .6); },
  hitAt: (x, y) => { const T = { x, y };
    ent(1100, (q, age) => { const i = bx(T.x), j = by(T.y) - 10; for (let k = 0; k < 24; k++) { const t = k / 24, a = age / 150 + t * 12, r = 3 + t * 16; PX(i + Math.cos(a) * r, j + Math.sin(a) * r * .5, k % 2 ? '#fff07a' : '#b9a4ff', 1 - q); }
      for (let k = 0; k < 3; k++) { const a = age / 220 + k * 2.09, x2 = i + Math.cos(a) * 22, y2 = j - 8 + Math.sin(a) * 6; aRect(x2 - 2, y2, 5, 1, '#fff07a', 1 - q); aRect(x2, y2 - 2, 1, 5, '#fff07a', 1 - q); } }); }
});
sig('Shadow Ball', {
  charge: S => { dim(.35, 900, '10,4,20'); const sd = side(S); ent(WINDUP(MOVES['Shadow Ball']), q => { const i = bx(sd.x + sd.face * 16), j = by(sd.y - 30); aDisc(i, j, 1 + q * 5, '#1e1628'); aRing(i, j, 10 * (1 - q) + 5, 10 * (1 - q) + 5, '#8c6bff', .7);
    if (Math.random() < .8) { const a = Math.random() * 6.28; P(sd.x + sd.face * 16 + Math.cos(a) * 50, sd.y - 30 + Math.sin(a) * 40, { vx: -Math.cos(a) * 140, vy: -Math.sin(a) * 110, life: 340, ramp: 'ghost', size: 1 }); } }); },
  shot: p => { const i = bx(p.x), j = by(p.y), r = 6 + Math.sin(clock.t / 60);
    glow(i, j, 14, '#5a3ac8', .55); aDisc(i, j, r, '#2d2068'); aDisc(i, j, r * .6, '#0e0a14'); aRing(i, j, r + 3 + Math.sin(clock.t / 40) * 1.5, r + 3, '#8c6bff', .7);
    for (let k = 0; k < 3; k++) { const a = clock.t / 80 + k * 2.09; for (let s = 0; s < 6; s++) PX(i + Math.cos(a + s * .2) * (r + 1 + s * .6), j + Math.sin(a + s * .2) * (r + 1 + s * .6), '#b9a4ff', 1 - s / 6); }
    if (Math.random() < .7) P(p.x, p.y, { life: 400, ramp: 'ghost', shape: 'disc', size: 2, size2: 0 }); },
  impact: S => { const h = headOf(S); VFX.shake(10, 320);
    ent(560, q => { const i = bx(h.x), j = by(h.y + 6); if (q < .35) { const r = 30 * (1 - q / .35); aRing(i, j, r, r * .8, '#8c6bff', 1, 2); aDisc(i, j, 6 * (q / .35), '#0e0a14'); }
      else { const t = (q - .35) / .65, r = easeOut(t) * 50; shockPx(i, j, r, .75, '#5a3ac8', '#b9a4ff', 1 - t, 2); glow(i, j, 18 * (1 - t), '#8c6bff', .7); } });
    setTimeoutGame(200, () => { hitstop(60); emit(h.x, h.y + 6, 22, { speed: [100, 260], life: 600, ramp: 'ghost', shape: 'disc', size: [1, 2] }); }); }
});
