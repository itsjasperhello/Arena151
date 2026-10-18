/* =====================================================================
   Section 8f: signature move animations, part B
   Poison, Ground, Flying, Psychic, Bug, Ghost, Dragon, Steel, Rock, Fairy.
   ===================================================================== */

/* -------------------------------- POISON -------------------------------- */
sig('Poison Sting', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), i = bx(p.x), j = by(p.y), ca = Math.cos(a), sa = Math.sin(a); for (let k = 0; k < 6; k++) PX(i - ca * k, j - sa * k, k === 0 ? '#ffffff' : k < 3 ? '#d8a0ff' : '#8a3ac8'); PX(i - ca * 4 - sa, j - sa * 4 + ca, '#5a2088'); PX(i - ca * 4 + sa, j - sa * 4 - ca, '#5a2088'); },
  hitAt: (x, y) => { ent(260, q => { aRing(bx(x), by(y), 2 + q * 8, 2 + q * 8, '#b65cff', 1 - q); PX(bx(x), by(y), '#ffffff', 1 - q); }); P(x, y, { vy: -30, life: 500, color: '#b65cff', shape: 'bubble', size: 1 }); }
});
sig('Gunk Shot', {
  shot: p => { const lift = lob(p, 44), i = bx(p.x), j = by(p.y - lift), wob = Math.sin(clock.t / 45);
    aEllFill(bx(p.x), by(p.y) + 16, 7, 2, '#0b0f1a', .3); aEllFill(i, j, 9 + wob, 8 - wob, '#2a1040', 1); aEllFill(i - 1, j - 1, 8 + wob, 7 - wob, '#5a2088', 1); aEllFill(i - 2, j - 2, 5, 4, '#8a3ac8', 1);
    aRect(i + 3, j - 5, 3, 2, '#6a6a78'); aRect(i - 6, j + 2, 2, 3, '#86a82a'); PX(i - 4, j - 5, '#ffffff');
    if (Math.random() < .7) P(p.x + rnd2(-8, 8), p.y - lift * 2 + 12, { vy: 80, g: 500, life: 360, ramp: 'poison', shape: 'drop', size: 1 }); },
  impact: S => { const sd = side(S), h = headOf(S); hitstop(90); VFX.shake(15, 450); screenFlash('#b65cff', .25);
    ent(700, q => { const i = bx(sd.x), j = by(sd.y), r = easeOut(q) * 70; aRing(i, j, r, r * .35, '#8a3ac8', 1 - q, 3); aEllFill(i, j, r * .7, r * .25, '#5a2088', .4 * (1 - q)); });
    emit(h.x, h.y + 10, 30, { speed: [100, 300], ang: -Math.PI / 2, spread: 3, g: 700, life: [500, 900], ramp: 'poison', shape: 'disc', size: [1, 3] });
    for (let k = 0; k < 5; k++) addScar('splat', sd.x + rnd2(-26, 26), sd.y + rnd2(-6, 8), { color: k % 2 ? '#5d2d78' : '#3a2048' });
    ent(1600, () => { if (Math.random() < .3) P(sd.x + rnd2(-26, 26), sd.y - 2, { vy: -40, life: 900, ramp: ['#8a3ac8', '#6a2a98', '#4a2068', '#2a1040'], shape: 'disc', size: 2, size2: 5 }); }); }
});
sig('Toxic', {
  shot: p => { for (let k = 0; k < 5; k++) { const i = bx(p.x - p.vx * k * .01), j = by(p.y - p.vy * k * .01 + Math.sin(p.t / 60 + k) * 2); aDisc(i, j, 3 - k * .4, k ? '#5a2088' : '#8a3ac8'); } PX(bx(p.x) - 1, by(p.y) - 2, '#f6e6ff'); },
  hitAt: (x, y) => { const T = { x, y };
    ent(1300, (q, age) => { const i = bx(T.x), j = by(T.y + 28), rise = Math.min(1, q * 2.5) * (q > .75 ? (1 - q) / .25 : 1);
      for (let k = -10; k <= 10; k++) { const hgt = (14 + Math.sin(k * .9 + age / 120) * 5) * rise; aRect(i + k * 1.5, j - hgt, 2, hgt, k % 3 ? '#5a2088' : '#8a3ac8', .85); }
      if (Math.random() < .5) P(T.x + rnd2(-16, 16), T.y + rnd2(0, 20), { vy: -50, life: 500, color: '#d8a0ff', shape: 'bubble', size: 1 }); }); }
});
sig('Acid Armor', {
  exec: S => { const sd = side(S); glowActor(S, '#8a3ac8', 1200, .6);
    ent(1200, (q, age) => { const i = bx(sd.x), j = by(sd.y), melt = Math.sin(q * Math.PI);
      aEllFill(i, j, 18 + melt * 10, 4 + melt * 3, '#5a2088', .7 * melt); aEllFill(i - 3, j - 1, 10 + melt * 6, 2 + melt * 2, '#b65cff', .5 * melt);
      for (let k = 0; k < 6; k++) { const x = i + (k - 2.5) * 6, y = j - 40 + ((age / 6 + k * 13) % 40) * melt; aRect(x, y, 1, 3, '#b65cff', .8 * melt); } });
    for (let k = 0; k < 8; k++) setTimeoutGame(k * 120, () => P(sd.x + rnd2(-18, 18), sd.y - 4, { vy: -40, life: 600, color: '#d8a0ff', shape: 'bubble', size: 2 })); }
});

/* -------------------------------- GROUND -------------------------------- */
sig('Mud Shot', {
  shot: p => { const i = bx(p.x), j = by(p.y), wob = Math.sin(clock.t / 40); aEllFill(i, j, 5 + wob, 4 - wob, '#5a3a20', 1); aEllFill(i - 1, j - 1, 3, 2, '#9a7038', 1); PX(i - 2, j - 2, '#e7c27a');
    if (Math.random() < .7) P(p.x, p.y, { vx: rnd2(-30, 30), vy: rnd2(-20, 40), g: 400, life: 300, color: '#6a4a24', size: 1 }); },
  impact: S => { const sd = side(S), h = headOf(S); VFX.shake(7, 220);
    emit(h.x, h.y + 8, 16, { speed: [60, 200], g: 600, life: 500, ramp: 'ground', shape: 'disc', size: [1, 2] });
    ent(1000, q => { const i = bx(h.x), j = by(h.y + 6); for (let k = 0; k < 4; k++) aRect(i - 8 + k * 5, j + q * 18 + (k % 2) * 3, 2, 4, '#5a3a20', 1 - q); });
    addScar('splat', sd.x, sd.y, { color: '#6a4a24' }); addScar('splat', sd.x - 10, sd.y + 4, { color: '#5a3a20' }); }
});
sig('Dig', {
  charge: S => { const sd = side(S); ent(260, () => P(sd.x + rnd2(-12, 12), sd.y - 2, { vx: rnd2(-90, 90), vy: rnd2(-200, -100), g: 700, life: 500, ramp: 'ground', shape: 'disc', size: [1, 2] })); },
  exec: S => { const sd = side(S), T = side(other(S)), x0 = sd.x, y0 = sd.y; addScar('crack', x0, y0); emit(x0, y0, 20, { speed: [80, 220], ang: -Math.PI / 2, spread: 2.4, g: 700, life: 600, ramp: 'ground', shape: 'disc', size: [1, 2] });
    ent(520, q => { const x = lerp(x0, T.x, easeOut(q)), y = lerp(y0, T.y, easeOut(q)); aEllFill(bx(x), by(y), 7, 3, '#9a7038', .9); aEllFill(bx(x), by(y) - 1, 4, 2, '#c99a4d', .9); if (Math.random() < .6) P(x, y - 2, { vx: rnd2(-40, 40), vy: -80, g: 500, life: 300, ramp: 'ground', size: 1 }); if (Math.random() < .2) addScar('trail', x, y); }); },
  impact: S => { const sd = side(S); hitstop(70); VFX.shake(13, 380);
    ent(600, q => { const i = bx(sd.x), j = by(sd.y), g = easeOut(Math.min(1, q * 4)), f = q > .5 ? (1 - q) / .5 : 1; for (let k = -3; k <= 3; k++) spikePx(i + k * 5, j + Math.abs(k), (24 - Math.abs(k) * 5) * g, 2, RAMP.ground, f); });
    emit(sd.x, sd.y - 10, 30, { speed: [100, 320], ang: -Math.PI / 2, spread: 1.6, g: 800, life: [500, 900], ramp: 'ground', shape: 'disc', size: [1, 3] }); crackBurst(sd.x, sd.y, 4, 30); }
});
sig('Drill Run', {
  charge: S => { const sd = side(S); ent(260, (q, age) => { const i = bx(sd.x), j = by(sd.y - 26); for (let k = 0; k < 16; k++) { const t = k / 16, a = age / 30 + t * 12, r = 22 * (1 - t); PX(i + Math.cos(a) * r, j - 18 + t * 40 + Math.sin(a) * 3, '#c99a4d'); } }); },
  dash: S => { const sd = side(S), a = Math.atan2(sd.vy + .001, sd.vx + .001), X = sd.x, Y = sd.y - 26;
    ent(160, (q, age) => { for (let k = 0; k < 12; k++) { const d = k * 4, s = Math.sin(k * 1.4 + age / 20) * (6 - k * .3); PX(bx(X - Math.cos(a) * d - Math.sin(a) * s), by(Y - Math.sin(a) * d + Math.cos(a) * s), '#e7c27a', 1 - q); } });
    P(sd.x, sd.y, { vx: rnd2(-80, 80), vy: -100, g: 600, life: 360, ramp: 'ground', size: 1 }); },
  impact: S => { const h = headOf(S), a = angTo(other(S)); hitstop(60); VFX.shake(10, 340);
    ent(420, (q, age) => { const i = bx(h.x), j = by(h.y + 6); for (let k = 0; k < 24; k++) { const t = k / 24, b = age / 15 + t * 14, r = 4 + t * 20 * (1 - q * .5); PX(i + Math.cos(b) * r, j + Math.sin(b) * r * .6, t < .5 ? '#fff0c9' : '#c99a4d', 1 - q); } });
    emit(h.x, h.y + 6, 18, { speed: [140, 320], ang: a, spread: 1.6, life: 300, ramp: ['#ffffff', '#fff0b0', '#ffb24a', '#c86a1a'], size: 1, g: 300 }); }
});

/* -------------------------------- FLYING -------------------------------- */
sig('Peck', {
  impact: S => { const h = headOf(S); for (let k = 0; k < 3; k++) setTimeoutGame(k * 70, () => { const ox = rnd2(-10, 10), oy = rnd2(-8, 10); VFX.shake(3, 60);
    ent(160, q => { const i = bx(h.x + ox), j = by(h.y + oy); for (let m = 0; m < 4; m++) aRect(i - m, j - 4 + m * 2, m * 2 + 1, 1, '#ffd23f', 1 - q); PX(i, j, '#ffffff', 1 - q); }); }); }
});
sig('Wing Attack', {
  impact: S => { const h = headOf(S), a = angTo(other(S)); VFX.shake(8, 240);
    ent(380, q => { const i = bx(h.x), j = by(h.y + 6), d = Math.min(1, q * 2.5);
      for (let f = 0; f < 6; f++) { const t = -1.2 + f * .32, r = 24 - f * 1.5, sweep = a + Math.PI + t * d; aLine(i + Math.cos(sweep) * 4, j + Math.sin(sweep) * 3, i + Math.cos(sweep) * r, j + Math.sin(sweep) * r * .7, f % 2 ? '#d7e6ff' : '#ffffff', 1 - q, 2); } });
    emit(h.x, h.y + 6, 8, { speed: [40, 140], life: 900, color: '#f0f6ff', shape: 'feather', size: 1, spin: 4, g: 30, drag: 1 }); }
});
sig('Aerial Ace', {
  charge: S => { glowActor(S, '#ffffff', 250, .8); },
  dash: S => { const sd = side(S), X = sd.x, Y = sd.y - 26, a = Math.atan2(sd.vy + .001, sd.vx + .001); ent(120, q => aLine(bx(X - Math.cos(a) * 30), by(Y - Math.sin(a) * 30), bx(X), by(Y), '#ffffff', .8 * (1 - q), 1)); },
  impact: S => { const h = headOf(S), a = angTo(other(S)) - .35; hitstop(55); VFX.shake(8, 240);
    ent(420, q => { const i = bx(h.x), j = by(h.y + 6), L = 160 * Math.min(1, q * 5); aLine(i - Math.cos(a) * L, j - Math.sin(a) * L, i + Math.cos(a) * L, j + Math.sin(a) * L, '#ffffff', 1 - q, 1); aLine(i - Math.cos(a) * L * .6, j - Math.sin(a) * L * .6 + 1, i + Math.cos(a) * L * .6, j + Math.sin(a) * L * .6 + 1, '#a8c0f0', .7 * (1 - q), 1);
      const s = 10 * (1 - q); aRect(i - s, j, s * 2 + 1, 1, '#ffffff'); aRect(i, j - s, 1, s * 2 + 1, '#ffffff'); }); }
});
sig('Drill Peck', {
  charge: S => { const sd = side(S); ent(260, (q, age) => { const i = bx(sd.x + sd.face * 14), j = by(sd.y - 28); for (let k = 0; k < 10; k++) { const a = age / 25 + k * .63; PX(i + Math.cos(a) * (8 - k * .5), j + Math.sin(a) * (8 - k * .5) * .5, '#ffd23f'); } }); },
  dash: S => { const sd = side(S), a = Math.atan2(sd.vy + .001, sd.vx + .001), X = sd.x + Math.cos(a) * 14, Y = sd.y - 28;
    ent(140, (q, age) => { for (let k = 0; k < 10; k++) { const d = k * 3, s = Math.sin(k + age / 15) * (5 - k * .4); PX(bx(X - Math.cos(a) * d - Math.sin(a) * s), by(Y - Math.sin(a) * d + Math.cos(a) * s), k < 3 ? '#ffffff' : '#ffd23f', 1 - q); } }); },
  impact: S => { const h = headOf(S); hitstop(55); VFX.shake(9, 280);
    ent(360, (q, age) => { const i = bx(h.x), j = by(h.y + 6); for (let k = 0; k < 16; k++) { const a = age / 20 + k * .39, r = 4 + q * 22; aLine(i + Math.cos(a) * r * .4, j + Math.sin(a) * r * .3, i + Math.cos(a) * r, j + Math.sin(a) * r * .7, '#ffd23f', 1 - q, 1); } });
    emit(h.x, h.y + 6, 8, { speed: [60, 160], life: 700, color: '#f0f6ff', shape: 'feather', size: 1, spin: 5, g: 40 }); }
});
sig('Hurricane', {
  charge: S => { dim(.3, 1000, '10,14,24'); },
  shot: p => { const i = bx(p.x), j = by(p.y) + 14;
    for (let k = 0; k < 12; k++) { const t = k / 12, r = 4 + t * 14, y = j - t * 40; for (let m = 0; m < 10; m++) { const a = clock.t / 40 + m * .63 + k * .5; PX(i + Math.cos(a) * r, y + Math.sin(a) * r * .25, m % 3 ? '#d7e6ff' : '#ffffff', .85); } }
    if (Math.random() < .6) P(p.x + rnd2(-20, 20), p.y + rnd2(-30, 20), { vx: rnd2(-80, 80), vy: -40, life: 400, color: '#f0f6ff', shape: 'feather', size: 1, spin: 6 }); },
  hitAt: (x, y) => { const pos = { x, y };
    ent(900, (q, age) => { const i = bx(pos.x), j = by(pos.y) + 20; for (let k = 0; k < 14; k++) { const t = k / 14, r = 6 + t * 18 * (1 - q * .5), yy = j - t * 60; for (let m = 0; m < 8; m++) { const a = age / 30 + m * .785 + k * .6; PX(i + Math.cos(a) * r, yy + Math.sin(a) * r * .25, '#ffffff', (1 - q) * .8); } } });
    VFX.shake(8, 500); }
});

/* -------------------------------- PSYCHIC -------------------------------- */
sig('Confusion', {
  mark: mk => { ent(600, (q, age) => { const i = bx(mk.x), j = by(mk.y - 32); for (let k = 0; k < 3; k++) { const r = 8 + k * 9 + q * 8; for (let m = 0; m < 30; m++) { const a = m / 30 * 6.28, w = Math.sin(a * 5 + age / 50 + k) * 2.5; PX(i + Math.cos(a) * (r + w), j + Math.sin(a) * (r + w) * .6, k % 2 ? '#ffa8de' : '#ff6fc8', 1 - q); } } }); VFX.shake(4, 300); },
  impact: S => { const sd = side(S); ent(400, (q, age) => { sd.kbx += Math.sin(age / 30) * 6; }); }
});
sig('Psybeam', {
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang), cols = ['#ff6fc8', '#ffa8de', '#b9a4ff', '#7ff7ff', '#fff07a'];
    for (let k = 0; k < len; k += 9) { const x = i0 + ca * k, y = j0 + sa * k, r = 3 + Math.sin(k / 12 - clock.t / 40) * 2; aRing(x, y, r * .7, r, cols[(Math.floor(k / 9) + Math.floor(clock.t / 60)) % 5], fade, 1); }
    for (let k = 0; k < len; k++) PX(i0 + ca * k, j0 + sa * k, '#ffffff', .6 * fade); },
  impact: S => { const h = headOf(S); ent(500, q => { const i = bx(h.x), j = by(h.y + 6), cols = ['#ff6fc8', '#b9a4ff', '#7ff7ff', '#fff07a']; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28 + q * 3, r = easeOut(q) * 30; aDisc(i + Math.cos(a) * r, j + Math.sin(a) * r * .7, 2, cols[k % 4], 1 - q); } }); }
});
sig('Zen Headbutt', {
  charge: S => { const sd = side(S); glowActor(S, '#b9a4ff', 600, .5); ent(260, q => { const h = headOf(S), i = bx(h.x), j = by(h.y - 8); for (let s = 0; s < 4; s++) { aRect(i - s, j - 3 + s, s * 2 + 1, 1, '#d8ccff', q); aRect(i - s, j + 3 - s, s * 2 + 1, 1, '#d8ccff', q); } }); },
  impact: S => { const h = headOf(S); hitstop(65); VFX.shake(10, 300); screenFlash('#e6dcff', .3);
    ent(560, q => { const i = bx(h.x), j = by(h.y + 6), open = easeOut(Math.min(1, q * 2)); for (let k = 0; k < 8; k++) { const a = k * .785, L = 8 + open * 18; for (let m = 0; m < L; m++) { const w = Math.sin(m / L * Math.PI) * 3; aRect(i + Math.cos(a) * m - w / 2, j + Math.sin(a) * m * .7 - w / 2, Math.max(1, w), Math.max(1, w), m > L - 3 ? '#ffffff' : '#b9a4ff', 1 - q); } } }); }
});
sig('Amnesia', {
  exec: S => { const sd = side(S);
    ent(1300, (q, age) => { const i = bx(sd.x), j = by(sd.y - 70), fog = q < .6 ? Math.min(1, q * 3) : (1 - q) / .4;
      for (let k = 0; k < 7; k++) { const a = age / 400 + k * .9; aDisc(i + Math.cos(a) * 12, j + Math.sin(a) * 4, 5, k % 2 ? '#c8c8d0' : '#9898a4', .7 * fog); }
      if (q < .6) { aRect(i - 2, j - 6, 5, 1, '#ffffff', fog); aRect(i + 2, j - 5, 1, 2, '#ffffff', fog); aRect(i, j - 3, 2, 1, '#ffffff', fog); aRect(i, j - 2, 1, 2, '#ffffff', fog); PX(i, j + 1, '#ffffff', fog); } });
    setTimeoutGame(800, () => { emit(sd.x, sd.y - 70, 12, { speed: [40, 120], life: 500, color: '#ffffff', shape: 'star', size: 1 }); glowActor(S, '#e6dcff', 400, .5); }); }
});
sig('Hypnosis', {
  shot: p => { const i = bx(p.x), j = by(p.y); for (let k = 0; k < 4; k++) { const r = ((p.t / 20 + k * 5) % 20); aRing(i, j, r, r * .7, k % 2 ? '#ff6fc8' : '#b9a4ff', 1 - r / 20, 1); } aDisc(i, j, 2, '#ffffff'); },
  hitAt: (x, y) => { const T = { x, y };
    ent(1200, (q, age) => { const i = bx(T.x), j = by(T.y) - 8; for (let k = 0; k < 40; k++) { const t = k / 40, a = -age / 90 + t * 18, r = t * 14; PX(i + Math.cos(a) * r, j + Math.sin(a) * r * .6, k % 2 ? '#ff6fc8' : '#ffffff', 1 - q); } }); }
});

/* -------------------------------- BUG -------------------------------- */
sig('Bug Bite', {
  impact: S => { const h = headOf(S); VFX.shake(6, 180);
    ent(300, q => { const i = bx(h.x), j = by(h.y + 6), close = Math.min(1, q * 2.5), gap = lerp(14, 2, close);
      for (const s of [-1, 1]) for (let k = 0; k < 10; k++) { const t = k / 10, a = s * (Math.PI / 2 - t * 1.6), x = i + s * gap - Math.cos(a) * 8 * s * t, y = j - 8 + t * 16; aRect(x - 1, y, 2, 2, t > .8 ? '#ffffff' : '#86a82a', 1 - q * .5); } });
    setTimeoutGame(120, () => emit(h.x, h.y + 6, 8, { speed: [60, 140], life: 300, ramp: 'bug', size: 1 })); }
});
sig('Leech Life', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), i = bx(p.x), j = by(p.y); glow(i, j, 5, '#ff5a6a', .5); aDisc(i, j, 3, '#b6d636'); for (let k = 1; k < 7; k++) PX(i - Math.cos(a) * k, j - Math.sin(a) * k, k < 4 ? '#ff5a6a' : '#86a82a', 1 - k / 8); PX(i + Math.cos(a) * 3, j + Math.sin(a) * 3, '#ffffff'); },
  impact: S => { const h = headOf(S), U = other(S);
    ent(700, (q, age) => { const u = headOf(U), n = 8; for (let k = 0; k < n; k++) { const t = ((age / 500) + k / n) % 1, x = lerp(h.x, u.x, t), y = lerp(h.y, u.y, t) - Math.sin(t * Math.PI) * 14; aDisc(bx(x), by(y), 1.5, '#ff5a6a', (1 - q) * Math.sin(t * Math.PI)); } });
    setTimeoutGame(500, () => glowActor(U, '#ff8a9a', 400, .45)); }
});
sig('Signal Beam', {
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang), cols = ['#b6d636', '#fff07a', '#ff6fc8'];
    for (let k = 0; k < len; k++) { const seg = Math.floor((k + clock.t / 4) / 18), on = Math.floor(clock.t / 70 + seg) % 3 !== 0; if (on) aRect(i0 + ca * k - 2, j0 + sa * k - 2, 4, 4, cols[seg % 3], fade); PX(i0 + ca * k, j0 + sa * k, '#ffffff', .8 * fade); } },
  impact: S => { for (let k = 0; k < 4; k++) setTimeoutGame(k * 70, () => screenFlash(['#b6d636', '#fff07a', '#ff6fc8', '#ffffff'][k], .15)); }
});
sig('Bug Buzz', {
  exec: S => { dim(.2, 800, '10,14,0'); },
  wave: w => { const i = bx(w.x), j = by(w.y), r = w.r / 2;
    for (let band = 0; band < 3; band++) { const rr = Math.max(2, r - band * 8); for (let k = 0; k < 90; k++) { const a = k / 90 * 6.28, z = ((k + band) % 2 ? 1 : -1) * (2 + Math.sin(clock.t / 30 + k) * 1.5); PX(i + Math.cos(a) * (rr + z), j + Math.sin(a) * (rr + z) * .62, band ? '#86a82a' : '#e0f58a', 1 - band * .3); } }
    if (Math.random() < .3) VFX.shake(2, 60); },
  impact: S => { const h = headOf(S); emit(h.x, h.y + 6, 12, { speed: [80, 200], life: 300, ramp: 'bug', shape: 'zap', size: 1 }); }
});
sig('String Shot', {
  shot: p => { const u = side(p.owner), i = bx(p.x), j = by(p.y); aLine(bx(u.x + u.face * 14), by(u.y - 26), i, j, '#f4f4f8', .8, 1); aDisc(i, j, 3, '#ffffff'); aRing(i, j, 3, 3, '#c8c8d0', 1); },
  hitAt: (x, y) => { const T = { x, y }; ent(1100, q => { const i = bx(T.x), j = by(T.y), f = q > .7 ? (1 - q) / .3 : 1;
    for (let k = 0; k < 6; k++) { const a = k * .52; aLine(i - Math.cos(a) * 20, j - Math.sin(a) * 18, i + Math.cos(a) * 20, j + Math.sin(a) * 18, '#f4f4f8', .8 * f, 1); }
    for (let r = 6; r < 22; r += 6) aRing(i, j, r, r * .9, '#e0e0e8', .6 * f); }); }
});

/* -------------------------------- GHOST -------------------------------- */
sig('Lick', {
  impact: S => { const h = headOf(S), U = side(other(S)), dir = Math.sign(U.face) || 1; VFX.shake(5, 200);
    ent(420, q => { const i = bx(h.x), j = by(h.y + 6), sweep = Math.min(1, q * 2.2);
      for (let k = 0; k < 22 * sweep; k++) { const t = k / 22, a = -Math.PI * .8 + t * Math.PI * 1.1, x = i - dir * 6 + Math.cos(a) * 16 * -dir, y = j + Math.sin(a) * 14, w = 5 - Math.abs(t - .5) * 4; aRect(x - w / 2, y - w / 2, w, w, '#ff7ab0', 1 - q * .7); PX(x, y - 1, '#ffc0d8', 1 - q); } });
    setTimeoutGame(200, () => emit(h.x, h.y + 10, 8, { speed: [40, 120], g: 400, life: 500, color: '#c0e0ff', shape: 'drop', size: 1 })); }
});
sig('Shadow Claw', {
  impact: S => { const sd = side(S); hitstop(55); VFX.shake(9, 280);
    ent(560, q => { const i = bx(sd.x), j = by(sd.y), rise = easeOut(Math.min(1, q * 2.5)), f = q > .6 ? (1 - q) / .4 : 1;
      aEllFill(i, j, 18, 5, '#140e30', .8 * f);
      for (let c = 0; c < 3; c++) { const x0 = i + (c - 1) * 9; for (let k = 0; k < 26 * rise; k++) { const t = k / 26, x = x0 + Math.sin(t * 2.4) * 8, y = j - t * 44, w = Math.max(1, 3 - t * 2.6); aRect(x - w / 2, y, w, 1, t > .85 ? '#e6dcff' : '#5a3ac8', f); } } });
    emit(sd.x, sd.y - 20, 12, { speed: [60, 160], life: 500, ramp: 'ghost', shape: 'disc', size: [1, 2] }); }
});
sig('Night Shade', {
  mark: mk => { dim(.75, 1000, '0,0,0'); const pos = { x: mk.x, y: mk.y };
    ent(900, (q, age) => { const i = bx(pos.x), j = by(pos.y - 120), open = Math.min(1, q * 4), f = q > .75 ? (1 - q) / .25 : 1;
      for (const s of [-1, 1]) { const ex = i + s * 14; aEllFill(ex, j, 7 * open, 3 * open, '#ff2a3a', f); aEllFill(ex, j, 2, 2 * open, '#ffe0e0', f); glow(ex, j, 8, '#ff2a3a', .5 * f); }
      if (q > .35) for (const s of [-1, 1]) { const ex = i + s * 14; aLine(ex, j, i + s * 4, by(pos.y - 34), '#8c6bff', .8 * f, 2); aLine(ex, j, i + s * 4, by(pos.y - 34), '#e6dcff', f, 1); } });
    setTimeoutGame(400, () => { VFX.shake(8, 300); emit(mk.x, mk.y - 30, 16, { speed: [60, 160], life: 500, ramp: 'ghost', size: 1 }); }); }
});

/* -------------------------------- DRAGON -------------------------------- */
sig('Dragon Breath', {
  charge: S => { const sd = side(S); ent(WINDUP(MOVES['Dragon Breath']) + 360, () => { if (Math.random() < .6) P(sd.x + sd.face * 16, sd.y - 30, { vx: sd.face * 30, vy: -20, life: 300, ramp: ['#e5e0ff', '#7fffd0', '#3fd0a0', '#7d6bff', '#24187a'], size: 1, add: true }); }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .25), fade = q > .75 ? (1 - q) / .25 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang), R = ['#ffffff', '#c8fff0', '#7fffd0', '#3fd0a0', '#7d6bff', '#4a3ad0'];
    for (let k = 0; k < len; k += 4) { const f = k / 450, wob = Math.sin(k / 7 - clock.t / 30) * (1 + f * 5), r = 2 + f * 7; aDisc(i0 + ca * k - sa * wob, j0 + sa * k + ca * wob, r, R[Math.min(5, 2 + Math.floor(f * 4))], fade); aDisc(i0 + ca * k - sa * wob, j0 + sa * k + ca * wob, r * .4, R[f < .4 ? 0 : 1], fade); }
    if (Math.random() < .6) { const d = rnd2(40, len) * 2; P(b.x + ca * d, b.y + sa * d, { life: 260, ramp: 'elec', shape: 'zap', size: 1 }); } },
  impact: S => { const sd = side(S); ent(500, (q, age) => { for (let k = 0; k < 3; k++) flamePx(bx(sd.x) + (k - 1) * 9, by(sd.y), 18 * (1 - q), 3, age + k * 80, ['#ffffff', '#c8fff0', '#7fffd0', '#3fd0a0', '#7d6bff', '#4a3ad0'], 1 - q); }); }
});
sig('Dragon Claw', {
  charge: S => glowActor(S, '#7d6bff', 500, .5),
  impact: S => { const h = headOf(S), a = angTo(other(S)) + 1.1; hitstop(65); VFX.shake(10, 300);
    ent(560, q => { const i = bx(h.x), j = by(h.y + 6), d = Math.min(1, q * 3.5), f = q > .4 ? (1 - q) / .6 : 1;
      for (let c = 0; c < 3; c++) { const off = (c - 1) * 9, ca = Math.cos(a), sa = Math.sin(a), x0 = i - ca * 30 - sa * off, y0 = j - sa * 30 + ca * off, x1 = lerp(x0, x0 + ca * 60, d), y1 = lerp(y0, y0 + sa * 60, d);
        aLine(x0, y0, x1, y1, '#4a3ad0', f, 5); aLine(x0, y0, x1, y1, '#7fffd0', f, 3); aLine(x0, y0, x1, y1, '#ffffff', f, 1); } glow(i, j, 14 * f, '#7d6bff', .5); }); }
});
sig('Outrage', {
  charge: S => { glowActor(S, '#ff3a3a', 1400, .7); dim(.4, 1400, '40,0,0'); VFX.shake(6, 600); },
  dash: S => { const sd = side(S); ghostOf(S, '#ff3a3a', 220, .6); P(sd.x + rnd2(-12, 12), sd.y - rnd2(0, 40), { vy: -80, life: 360, ramp: ['#ffffff', '#ff9a9a', '#ff3a3a', '#a01a2a', '#4a0a14'], shape: 'disc', size: 2, size2: 0, add: true }); },
  impact: (S, mv, crit) => { const h = headOf(S);
    for (let k = 0; k < 3; k++) setTimeoutGame(k * 160, () => { hitstop(k === 2 ? 120 : 60); VFX.shake(10 + k * 4, 260); screenFlash('#ff6a6a', .2 + k * .1); const ox = rnd2(-10, 10), oy = rnd2(-8, 8);
      ent(400, q => { const i = bx(h.x + ox), j = by(h.y + 6 + oy), r = easeOut(q) * (30 + k * 12); shockPx(i, j, r, .7, '#a01a2a', '#ff9a9a', 1 - q, 2); powStar(i, j, 16 + k * 6, '#ffdada', q); });
      emit(h.x + ox, h.y + 6 + oy, 16, { speed: [120, 300], life: 400, ramp: ['#ffffff', '#ff9a9a', '#ff3a3a', '#a01a2a'], size: 1 }); }); }
});

/* -------------------------------- STEEL -------------------------------- */
sig('Metal Claw', {
  impact: S => { const h = headOf(S), a = angTo(other(S)) - 1.1; VFX.shake(8, 240);
    ent(420, q => { const i = bx(h.x), j = by(h.y + 6), d = Math.min(1, q * 4), f = 1 - q;
      for (let c = 0; c < 3; c++) { const off = (c - 1) * 6, ca = Math.cos(a), sa = Math.sin(a), x0 = i - ca * 22 - sa * off, y0 = j - sa * 22 + ca * off; for (let k = 0; k < 44 * d; k++) { const t = k / 44, bend = Math.sin(t * Math.PI) * 4; aRect(x0 + ca * k - sa * bend - 1, y0 + sa * k + ca * bend - 1, 2, 2, t > .9 ? '#ffffff' : '#cad8e6', f); } }
      if (q > .2 && q < .5) { const s = 7; aRect(i + 8 - s, j - 8, s * 2 + 1, 1, '#ffffff'); aRect(i + 8, j - 8 - s, 1, s * 2 + 1, '#ffffff'); } });
    emit(h.x, h.y + 6, 10, { speed: [120, 260], life: 260, ramp: ['#ffffff', '#fff0b0', '#ffb24a', '#c86a1a'], size: 1, g: 400 }); }
});

/* -------------------------------- ROCK -------------------------------- */
sig('Rock Throw', {
  shot: p => { const lift = lob(p, 34), seed = (p.group || 1) * 7919; aEllFill(bx(p.x), by(p.y) + 14, 5, 2, '#0b0f1a', .3); const b = bctx; b.save(); b.translate(bx(p.x), by(p.y - lift)); b.rotate(p.t / 120); rockPx(0, 0, 5, seed); b.restore(); },
  impact: S => { const sd = side(S), h = headOf(S); VFX.shake(9, 280); emit(h.x, h.y + 8, 14, { speed: [80, 220], g: 700, life: 600, ramp: 'rock', shape: 'disc', size: [1, 2] }); emit(sd.x, sd.y, 8, { speed: [20, 80], vy: -30, drag: 2, life: 600, ramp: 'dust', shape: 'disc', size: 2, size2: 4 }); }
});
sig('Rock Slide', {
  charge: S => { const T = side(other(S)); ent(700, () => { if (Math.random() < .4) P(T.x + rnd2(-60, 60), T.y - 300, { vy: 300, life: 400, ramp: 'rock', size: 1 }); }); },
  markDraw: (mk, q) => { const i = bx(mk.x), j = by(mk.y), r = mk.r / 2;
    aEllFill(i, j, r, r * .6, '#3a3020', .15 + q * .15); aRing(i, j, r, r * .6, '#b89f6a', .8);
    for (let k = 0; k < 5; k++) { const fall = Math.max(0, Math.min(1, (q - k * .08) / .55)), x = i + (k - 2) * 12 + (k % 2) * 4, y = lerp(j - 160, j - 6, fall * fall); if (fall > 0) { aEllFill(x, j, 5 * fall, 2 * fall, '#0b0f1a', .3); const b = bctx; b.save(); b.translate(x, y); b.rotate(q * 6 + k); rockPx(0, 0, 4 + (k % 2) * 2, k * 991 + 7); b.restore(); } } },
  mark: mk => { hitstop(60); VFX.shake(14, 450); emit(mk.x, mk.y - 6, 26, { speed: [60, 220], g: 700, life: [500, 900], ramp: 'rock', shape: 'disc', size: [1, 3] }); emit(mk.x, mk.y, 14, { speed: [30, 100], vy: -30, drag: 2, life: 800, ramp: 'dust', shape: 'disc', size: 2, size2: 6 }); crackBurst(mk.x, mk.y, 5, 50); }
});
sig('Rock Polish', {
  exec: S => { const sd = side(S); glowActor(S, '#fff2cf', 900, .5);
    for (let k = 0; k < 10; k++) setTimeoutGame(k * 60, () => P(sd.x + rnd2(-18, 18), sd.y - rnd2(10, 50), { vx: rnd2(-90, 90), vy: rnd2(-120, -40), g: 600, life: 500, ramp: 'rock', size: 1 }));
    ent(900, q => { const i = bx(sd.x), j = by(sd.y - 30), band = q * 80 - 40; for (let y = -26; y < 24; y++) aRect(i + band + y * .5, j + y, 2, 1, '#ffffff', .6 * Math.sin(q * Math.PI)); if (q > .6) { const s = (1 - q) * 16; aRect(i - 10 - s, j - 16, s * 2 + 1, 1, '#ffffff'); aRect(i - 10, j - 16 - s, 1, s * 2 + 1, '#ffffff'); } }); }
});

/* -------------------------------- FAIRY -------------------------------- */
sig('Fairy Wind', {
  shot: p => { for (let k = 0; k < 8; k++) { const a = p.t / 80 + k * .785, r = 6 + Math.sin(p.t / 100 + k) * 3; PX(bx(p.x + Math.cos(a) * r * 2), by(p.y + Math.sin(a) * r), k % 2 ? '#ffd0ef' : '#ffffff'); }
    if (Math.random() < .6) P(p.x + rnd2(-8, 8), p.y + rnd2(-6, 6), { vx: -p.vx * .2, vy: -20, life: 500, ramp: 'fairy', shape: 'star', size: 1 }); },
  hitAt: (x, y) => { ent(500, (q, age) => { for (let k = 0; k < 10; k++) { const a = age / 90 + k * .63, r = 8 + q * 16; PX(bx(x + Math.cos(a) * r * 1.6), by(y + Math.sin(a) * r * .8), k % 2 ? '#ffa8de' : '#ffffff', 1 - q); } }); }
});
sig('Dazzling Gleam', {
  charge: S => { dim(.45, 1000, '10,4,14'); const sd = side(S); ent(WINDUP(MOVES['Dazzling Gleam']), q => { const i = bx(sd.x), j = by(sd.y - 34); glow(i, j, 6 + q * 10, '#ffd0ef', .6); for (let k = 0; k < 8; k++) { const a = k * .785 + q * 2; aLine(i, j, i + Math.cos(a) * 18 * q, j + Math.sin(a) * 18 * q, '#ffffff', .6, 1); } }); },
  shot: p => { const i = bx(p.x), j = by(p.y); glow(i, j, 10, '#ffd0ef', .7); aDisc(i, j, 3, '#ffffff'); P(p.x, p.y, { life: 300, ramp: 'fairy', shape: 'star', size: 1 }); },
  explode: (x, y) => { hitstop(80); screenFlash('#fff0fa', .75); VFX.shake(10, 340); punch(x, y, 700, 1);
    ent(700, q => { const i = bx(x), j = by(y), f = 1 - q; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28 + q * .5, L = 20 + easeOut(q) * 50 * (k % 2 ? .6 : 1); aLine(i, j, i + Math.cos(a) * L, j + Math.sin(a) * L * .8, k % 3 ? '#ffd0ef' : '#ffffff', f, k % 2 ? 1 : 2); } glow(i, j, 24 * f, '#ffffff', .8 * f);
      const cols = ['#ff9cf0', '#7ff7ff', '#fff07a']; for (let k = 0; k < 3; k++) aRing(i, j, easeOut(q) * (30 + k * 8), easeOut(q) * (24 + k * 6), cols[k], f, 1); });
    emit(x, y, 30, { speed: [80, 260], life: [400, 800], ramp: 'fairy', shape: 'star', size: 1 }); }
});
sig('Moonblast', {
  charge: S => { dim(.6, 1500, '6,4,20'); const sd = side(S); ent(WINDUP(MOVES['Moonblast']) + 300, (q, age) => { const i = bx(sd.x), j = by(sd.y - 140); glow(i, j, 22, '#ffd0ef', .5 * Math.min(1, q * 3)); moonPx(i, j, 9, Math.min(1, q * 3));
    for (let k = 0; k < 3; k++) { const t = ((age / 400) + k / 3) % 1; PX(i + (k - 1) * 6, lerp(j + 12, by(sd.y - 40), t), '#ffd0ef', 1 - t); } }); },
  shot: p => { const i = bx(p.x), j = by(p.y); glow(i, j, 12, '#ffa8de', .6); aDisc(i, j, 6, '#ff7ac8'); aDisc(i, j, 4, '#ffd0ef'); moonPx(i, j, 3, 1); if (Math.random() < .7) P(p.x, p.y, { life: 400, ramp: 'fairy', shape: 'star', size: 1 }); },
  impact: S => { const h = headOf(S); hitstop(80); screenFlash('#fff0fa', .5); VFX.shake(12, 380);
    ent(700, q => { const i = bx(h.x), j = by(h.y + 6); for (let k = 0; k < 4; k++) { const a = k * 1.57 + q * 2, r = 10 + easeOut(q) * 26; moonPx(i + Math.cos(a) * r, j + Math.sin(a) * r * .7, 4, 1 - q); } shockPx(i, j, easeOut(q) * 40, .75, '#ff7ac8', '#ffffff', 1 - q, 2); });
    emit(h.x, h.y + 6, 24, { speed: [80, 240], life: 600, ramp: 'fairy', shape: 'star', size: 1 }); }
});
sig('Play Rough', {
  impact: S => { const sd = side(S); VFX.shake(9, 700);
    ent(900, (q, age) => { const i = bx(sd.x), j = by(sd.y - 26), f = q > .8 ? (1 - q) / .2 : 1;
      for (let k = 0; k < 9; k++) { const a = k * .7 + age / 200, r = 14 + Math.sin(age / 60 + k) * 3; aDisc(i + Math.cos(a) * r, j + Math.sin(a) * r * .6, 7, k % 2 ? '#f4ece0' : '#d8ccb8', f); }
      if (Math.floor(age / 110) % 2 === 0) { const k = Math.floor(age / 110), a = k * 2.3; fistPx(i + Math.cos(a) * 22, j + Math.sin(a) * 14, 1, '#ffd0ef', Math.cos(a) > 0 ? 1 : -1); }
      for (let k = 0; k < 3; k++) { const a = age / 100 + k * 2.1; shapeAt(sd.x + Math.cos(a) * 50, sd.y - 52 + Math.sin(a) * 16, { shape: k % 2 ? 'heart' : 'star', color: k % 2 ? '#ff7ac8' : '#fff07a', size: 1 }); } }); }
});
sig('Charm', {
  shot: p => { const i = bx(p.x), j = by(p.y + Math.sin(p.t / 90) * 4), beat = 1 + (Math.floor(p.t / 200) % 2) * .3; shapeAt(p.x, p.y + Math.sin(p.t / 90) * 4, { shape: 'heart', color: '#ff7ac8', size: 1 }); glow(i, j, 6 * beat, '#ffa8de', .4); },
  hitAt: (x, y) => { ent(1000, (q, age) => { for (let k = 0; k < 5; k++) { const a = age / 200 + k * 1.256; shapeAt(x + Math.cos(a) * 40, y - 10 + Math.sin(a) * 14 - q * 14, { shape: 'heart', color: k % 2 ? '#ff7ac8' : '#ffa8de', size: 1 }); } }); }
});
