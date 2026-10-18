/* =====================================================================
   Section 8e: signature move animations, part A
   Normal, Fire, Water, Grass, Electric, Ice, Fighting.
   Every move is choreographed on its own; only drawing tools are shared.
   ===================================================================== */
const quadPt = (x0, y0, mx, my, x1, y1, t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1];
const lob = (p, height) => { if (!p._T) { const t = side(other(p.owner)); p._T = Math.max(250, Math.hypot(t.x - p.x, t.y - p.y) / p.speed * 1000); } return Math.sin(Math.min(1, p.t / p._T) * Math.PI) * height; };

/* -------------------------------- NORMAL -------------------------------- */
sig('Tackle', {
  dash: S => { const sd = side(S); if (Math.random() < .5) P(sd.x - sd.face * 8, sd.y, { vx: -sd.face * rnd2(30, 70), vy: -15, drag: 2, life: 300, ramp: 'dust', shape: 'disc', size: 1, size2: 3 }); },
  impact: S => { const sd = side(S), h = headOf(S); VFX.shake(6, 200);
    ent(300, q => { const i = bx(sd.x), j = by(sd.y - 30); aRing(i, j, 6 + q * 18, (6 + q * 18) * 1.1, '#ffffff', 1 - q, 2); aRing(i, j, 3 + q * 10, (3 + q * 10) * 1.1, '#f2eccd', 1 - q); PX(i, j, '#ffffff', 1 - q); });
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) P(sd.x + s * 10, sd.y - 2, { vx: s * rnd2(60, 120), vy: -rnd2(10, 40), drag: 3, life: 420, ramp: 'dust', shape: 'disc', size: 1, size2: 3 }); }
});
sig('Headbutt', {
  charge: S => { const sd = side(S); ent(250, q => { const h = headOf(S); glow(bx(h.x + sd.face * 6), by(h.y), 4 + q * 4, '#ffffff', .6); }); },
  dash: S => { const sd = side(S), h = headOf(S); P(h.x, h.y, { vx: -sd.vx * .4, vy: -sd.vy * .4, life: 180, color: '#ffffff', size: 1 }); },
  impact: S => { const h = headOf(S); VFX.shake(8, 250); hitstop(45);
    ent(260, q => { const i = bx(h.x), j = by(h.y); aDisc(i, j, 10 * (1 - q), '#ffffff', 1 - q); for (let k = 0; k < 8; k++) { const a = k * .785; aLine(i + Math.cos(a) * 12, j + Math.sin(a) * 12, i + Math.cos(a) * (12 + q * 14), j + Math.sin(a) * (12 + q * 14), '#ffffff', 1 - q, 1); } });
    ent(1200, (q, age) => { const i = bx(h.x), j = by(h.y - 14); for (let k = 0; k < 3; k++) { const a = age / 150 + k * 2.09, x = i + Math.cos(a) * 12, y = j + Math.sin(a) * 4; aRect(x - 2, y, 5, 1, '#fff07a', 1 - q); aRect(x, y - 2, 1, 5, '#fff07a', 1 - q); } }); }
});
sig('Slash', {
  impact: S => { const h = headOf(S), a = angTo(other(S)) + .9;
    for (let k = 0; k < 3; k++) ent(260, q => { const i = bx(h.x) + (k - 1) * 7, j = by(h.y + 6) + (k - 1) * 2, L = 26, d = Math.min(1, q * 4), ca = Math.cos(a), sa = Math.sin(a);
      aLine(i - ca * L, j - sa * L, i - ca * L + ca * L * 2 * d, j - sa * L + sa * L * 2 * d, '#ffffff', 1 - q, 1); if (d >= 1) PX(i + ca * L, j + sa * L, '#fffbe8', 1 - q); }, { delay: k * 55 });
    setTimeoutGame(120, () => { VFX.shake(6, 160); emit(h.x, h.y + 6, 6, { speed: [80, 200], life: 220, color: '#ffffff' }); }); }
});
sig('Double-Edge', {
  charge: S => { dim(.35, 900, '8,8,8'); glowActor(S, '#ffffff', 800, .55); },
  dash: S => { const sd = side(S); ghostOf(S, '#e8e0c8', 200, .45); if (Math.random() < .4) addScar('trail', sd.x, sd.y + 2); },
  impact: (S, mv, crit) => { hitstop(crit ? 120 : 90); VFX.shake(14, 400); screenFlash('#ffffff', .4); const h = headOf(S), U = other(S);
    ent(560, q => { const i = bx(h.x), j = by(h.y + 6); for (const d of [0, .18]) { const t = Math.max(0, q - d), r = easeOut(t) * 54; shockPx(i, j, r, .8, '#d8d0b0', '#ffffff', 1 - t, 2); } powStar(i, j, 22, '#ffffff', q); });
    setTimeoutGame(120, () => { glowActor(U, '#ff4a4a', 320, .6); const u = headOf(U); emit(u.x, u.y + 6, 10, { speed: [60, 140], life: 300, color: '#ffb0b0', size: 1 }); }); }
});
sig('Swift', {
  shot: p => { const i = bx(p.x), j = by(p.y), rot = p.t / 70, pts = [];
    for (let k = 0; k < 10; k++) { const a = rot + k * Math.PI / 5, r = k % 2 ? 2.5 : 6; pts.push([i + Math.cos(a) * r, j + Math.sin(a) * r]); }
    glow(i, j, 7, '#fff07a', .5); for (let k = 0; k < 10; k++) aLine(pts[k][0], pts[k][1], pts[(k + 1) % 10][0], pts[(k + 1) % 10][1], '#ffd23f', 1, 1); aDisc(i, j, 2, '#fff6b0'); PX(i, j, '#ffffff');
    if (Math.random() < .8) P(p.x, p.y, { vx: rnd2(-30, 30), vy: rnd2(-30, 30), life: 300, color: Math.random() < .5 ? '#ffffff' : '#fff07a', shape: 'star', size: 1 }); },
  hitAt: (x, y) => { emit(x, y, 10, { speed: [80, 180], life: 420, ramp: ['#ffffff', '#fff07a', '#ffd23f', '#ff9cf0', '#7ff7ff'], shape: 'star', size: 1, g: 120 }); }
});
sig('Harden', {
  exec: S => { const sd = side(S);
    for (let k = 0; k < 3; k++) setTimeoutGame(k * 160, () => glowActor(S, '#e8e8f0', 120, .85));
    ent(700, q => { const i = bx(sd.x), j = by(sd.y - 30); for (let k = 0; k < 5; k++) { const a = k * 1.256 + .3, L = 22 * Math.min(1, q * 3); aLine(i + Math.cos(a) * 4, j + Math.sin(a) * 6, i + Math.cos(a) * L, j + Math.sin(a) * L * 1.2, '#f0f0f8', .9 * (1 - q), 1); } if (q > .5) { const s = (1 - q) * 14; aRect(i + 12 - s, j - 20, s * 2 + 1, 1, '#ffffff'); aRect(i + 12, j - 20 - s, 1, s * 2 + 1, '#ffffff'); } }); }
});
sig('Splash', {
  exec: S => { const sd = side(S); for (let k = 0; k < 3; k++) setTimeoutGame(k * 260, () => { bigHop(S, 2.5, 250); for (let m = 0; m < 8; m++) P(sd.x + rnd2(-14, 14), sd.y - 4, { vx: rnd2(-60, 60), vy: rnd2(-160, -80), g: 600, life: 500, ramp: 'water', shape: 'drop', size: 1 }); });
    ent(800, q => aRing(bx(sd.x), by(sd.y), 6 + (q * 3 % 1) * 16, (6 + (q * 3 % 1) * 16) * .35, '#8fd4ff', .8 * (1 - (q * 3 % 1)), 1)); }
});

/* -------------------------------- FIRE -------------------------------- */
sig('Ember', {
  shot: p => { flamePx(bx(p.x), by(p.y) + 4, 9, 3, clock.t + p.t, RAMP.fire, 1); if (Math.random() < .7) P(p.x, p.y, { vx: rnd2(-20, 20), vy: rnd2(-50, -10), life: 320, ramp: 'fire', size: 1, add: true }); },
  hitAt: (x, y) => { emit(x, y, 10, { speed: [40, 120], vy: -40, life: 400, ramp: 'fire', size: 1, add: true }); },
  impact: S => { const sd = side(S); ent(500, (q, age) => flamePx(bx(sd.x), by(sd.y), 12 * (1 - q), 3, age, RAMP.fire, 1 - q)); addScar('scorch', sd.x, sd.y); }
});
sig('Fire Blast', {
  charge: S => { glowActor(S, '#ff9a1f', 700, .6); const sd = side(S); ent(WINDUP(MOVES['Fire Blast']), q => { const i = bx(sd.x + sd.face * 16), j = by(sd.y - 30); orbPx(i, j, 2 + q * 5, 'fire', clock.t); }); },
  shot: p => { const i = bx(p.x), j = by(p.y); glow(i, j, 14, '#ff9a1f', .6); orbPx(i, j, 6, 'fire', clock.t); if (Math.random() < .9) P(p.x, p.y, { vx: rnd2(-30, 30), vy: rnd2(-60, 0), life: 400, ramp: 'fire', shape: 'disc', size: 2, size2: 0, add: true }); },
  explode: (x, y) => { hitstop(110); screenFlash('#ffb347', .6); VFX.shake(16, 500); punch(x, y, 900, 1); addScar('scorch', x, y + 30); addScar('scorch', x - 16, y + 34);
    // the five-armed blast: flame arms up, out to both sides and down to both sides
    const arms = [-Math.PI / 2, -Math.PI / 2 + 1.26, -Math.PI / 2 - 1.26, Math.PI / 2 - .6, Math.PI / 2 + .6];
    ent(900, (q, age) => { const i = bx(x), j = by(y), g = easeOut(Math.min(1, q * 3)), f = q > .65 ? (1 - q) / .35 : 1;
      for (const a of arms) for (let k = 0; k < 7; k++) { const d = k * 6 * g, r = 4.5 - k * .35 + Math.sin(age / 40 + k) * .8; aDisc(i + Math.cos(a) * d, j + Math.sin(a) * d * .9, r, RAMP.fire[Math.min(5, 1 + (k >> 1))], f); aDisc(i + Math.cos(a) * d, j + Math.sin(a) * d * .9, r * .45, RAMP.fire[0], f); }
      glow(i, j, 26 * f, '#ffd23f', .7 * f); });
    emit(x, y, 40, { speed: [100, 340], life: [400, 900], ramp: 'fire', size: 1, add: true, g: 100 }); }
});
sig('Fire Punch', {
  charge: S => { const sd = side(S); ent(260, (q, age) => flamePx(bx(sd.x + sd.face * 16), by(sd.y - 22), 8 + q * 6, 3, age, RAMP.fire, 1)); },
  dash: S => { const sd = side(S); P(sd.x + sd.face * 14, sd.y - 24, { vx: -sd.vx * .3, vy: -40, life: 260, ramp: 'fire', size: 1, add: true }); },
  impact: S => { const h = headOf(S), sd = side(S); hitstop(60); VFX.shake(10, 300);
    ent(420, (q, age) => { const i = bx(h.x), j = by(h.y + 8); fistPx(i - side(other(S)).face * 4, j, 2, '#ff9a1f', -sd.face); for (let k = 0; k < 4; k++) flamePx(i + (k - 1.5) * 8, j - 6, 16 * (1 - q), 3, age + k * 80, RAMP.fire, 1 - q); aRing(i, j, 8 + q * 30, (8 + q * 30) * .7, '#ff9a1f', 1 - q, 2); });
    emit(h.x, h.y + 8, 18, { speed: [80, 220], vy: -60, life: 500, ramp: 'fire', size: 1, add: true }); }
});

/* -------------------------------- WATER -------------------------------- */
sig('Water Gun', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), i = bx(p.x), j = by(p.y), ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < 14; k++) { const w = Math.max(1, 3 - k / 5); aRect(i - ca * k - w / 2, j - sa * k - w / 2 + Math.sin(k + clock.t / 40), w, w, k < 2 ? '#d8f4ff' : '#4aa6ff', 1 - k / 16); }
    if (Math.random() < .5) P(p.x, p.y, { vx: rnd2(-40, 40), vy: -40, g: 500, life: 300, ramp: 'water', shape: 'drop', size: 1 }); },
  hitAt: (x, y) => { emit(x, y, 12, { speed: [60, 160], ang: -Math.PI / 2, spread: 2.6, g: 600, life: 420, ramp: 'water', shape: 'drop', size: 1 }); ent(240, q => aRing(bx(x), by(y), 3 + q * 12, (3 + q * 12) * .6, '#d8f4ff', 1 - q)); }
});
sig('Bubble Beam', {
  shot: p => { for (let k = 0; k < 6; k++) { const a = k * 1.7 + p.t / 300, r = 3 + (k % 3) * 4, s = 2 + (k % 3), x = p.x + Math.cos(a) * r * 2 - p.vx * k * .012, y = p.y + Math.sin(a) * r + Math.sin(p.t / 120 + k) * 3;
      aRing(bx(x), by(y), s, s, '#8fd4ff', .9); PX(bx(x) - 1, by(y) - 1, '#ffffff'); } },
  hitAt: (x, y) => { for (let k = 0; k < 7; k++) setTimeoutGame(k * 50, () => { const ox = rnd2(-14, 14), oy = rnd2(-12, 12); ent(160, q => { aRing(bx(x + ox), by(y + oy), 2 + q * 5, 2 + q * 5, '#d8f4ff', 1 - q); for (let m = 0; m < 4; m++) PX(bx(x + ox) + Math.cos(m * 1.57) * (3 + q * 6), by(y + oy) + Math.sin(m * 1.57) * (3 + q * 6), '#ffffff', 1 - q); }); }); }
});
sig('Scald', {
  charge: S => { const sd = side(S); ent(WINDUP(MOVES['Scald']) + 360, () => { if (Math.random() < .5) P(sd.x + sd.face * 16 + rnd2(-6, 6), sd.y - 30, { vy: -50, life: 600, ramp: 'smoke', shape: 'disc', size: 1, size2: 4 }); }); },
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    for (let k = 0; k < len; k++) { const x = i0 + ca * k, y = j0 + sa * k, w = Math.sin(k / 8 - clock.t / 30) * 2; aRect(x - sa * 4 - 1, y + ca * 4 - 1, 2, 2, '#ff7a4a', .6 * fade); aRect(x + sa * 4 - 1, y - ca * 4 - 1, 2, 2, '#ff9a6a', .5 * fade);
      aRect(x - sa * w - 2, y + ca * w - 2, 4, 4, '#4aa6ff', fade); aRect(x - sa * w - 1, y + ca * w - 1, 2, 2, '#ffffff', fade); }
    if (Math.random() < .7) { const d = rnd2(40, len) * 2; P(b.x + ca * d, b.y + sa * d - 6, { vy: -60, vx: rnd2(-20, 20), life: 700, ramp: 'smoke', shape: 'disc', size: 1, size2: 4 }); } },
  impact: S => { const h = headOf(S); glowActor(S, '#ff7a4a', 400, .5); emit(h.x, h.y + 6, 12, { speed: [20, 70], vy: -70, life: 900, ramp: 'smoke', shape: 'disc', size: 2, size2: 6 }); emit(h.x, h.y + 10, 14, { speed: [80, 200], g: 600, life: 500, ramp: 'water', shape: 'drop', size: 1 }); }
});
sig('Aqua Jet', {
  charge: S => { const sd = side(S); ent(150, q => { for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28 + q * 6; aRect(bx(sd.x) + Math.cos(a) * 18, by(sd.y - 26) + Math.sin(a) * 22, 2, 2, '#4aa6ff', .8); } }); },
  dash: S => { const sd = side(S), a = Math.atan2(sd.vy + .001, sd.vx + .001);
    for (let k = 0; k < 3; k++) P(sd.x - Math.cos(a) * 20 + rnd2(-6, 6), sd.y - 26 + rnd2(-10, 10), { vx: -Math.cos(a) * rnd2(150, 300) + rnd2(-40, 40), vy: -Math.sin(a) * rnd2(150, 300) + rnd2(-40, 40), g: 300, life: 300, ramp: 'water', shape: 'drop', size: 1 });
    const X = sd.x, Y = sd.y - 26; ent(140, q => { aLine(bx(X - Math.cos(a) * 40), by(Y - Math.sin(a) * 40), bx(X), by(Y), '#4aa6ff', .7 * (1 - q), 4); aLine(bx(X - Math.cos(a) * 40), by(Y - Math.sin(a) * 40), bx(X), by(Y), '#d8f4ff', 1 - q, 1); }); },
  impact: S => { const h = headOf(S), a = angTo(other(S)); VFX.shake(7, 220); emit(h.x, h.y + 6, 20, { speed: [120, 280], ang: a, spread: 1.4, g: 500, life: 450, ramp: 'water', shape: 'drop', size: 1 }); ent(260, q => aRing(bx(h.x), by(h.y + 6), 4 + q * 20, (4 + q * 20) * .8, '#d8f4ff', 1 - q, 2)); }
});
sig('Crabhammer', {
  impact: S => { const sd = side(S); hitstop(80); VFX.shake(13, 380);
    ent(460, q => { const i = bx(sd.x), j = by(sd.y - 30), drop = Math.min(1, q * 3.5), y = lerp(j - 60, j, easeOut(drop)), f = q > .6 ? (1 - q) / .4 : 1;
      for (const s of [-1, 1]) for (let k = 0; k < 16; k++) { const a = -Math.PI / 2 + s * (.2 + k / 16 * 1.6), r = 16; aRect(i + Math.cos(a) * r * s * s - 2, y + Math.sin(a) * r * .9 - 2, 4, 4, k % 4 ? '#e85a3a' : '#ffb08a', f); }
      aRect(i - 3, y - 10, 6, 14, '#c83a2a', f); if (drop >= 1) aRing(i, by(sd.y), 10 + (q - .28) * 60, (10 + (q - .28) * 60) * .35, '#d8f4ff', 1 - q, 2); });
    setTimeoutGame(130, () => emit(sd.x, sd.y - 6, 24, { speed: [100, 260], ang: -Math.PI / 2, spread: 2.8, g: 700, life: 500, ramp: 'water', shape: 'drop', size: 1 })); }
});

/* -------------------------------- GRASS -------------------------------- */
sig('Vine Whip', {
  impact: S => { const U = other(S), T = S; VFX.shake(7, 220);
    for (let v = 0; v < 2; v++) ent(380, q => { const u = side(U), t = headOf(T); vinePx(bx(u.x + u.face * 10), by(u.y - 24 + v * 8), bx(t.x), by(t.y + 4 + v * 8), Math.min(1, q * 1.4) + v * .05, v ? '#26803a' : '#3fb04a'); }, { delay: v * 70 });
    setTimeoutGame(200, () => { const h = headOf(T); ent(160, q => { const s = 9 * (1 - q); aRect(bx(h.x) - s, by(h.y + 4), s * 2 + 1, 1, '#f4ffd8', 1 - q); aRect(bx(h.x), by(h.y + 4) - s, 1, s * 2 + 1, '#f4ffd8', 1 - q); }); emit(h.x, h.y + 6, 8, { speed: [60, 160], life: 500, color: '#7fe05a', shape: 'leaf', size: 1, spin: 8, g: 100 }); }); }
});
sig('Razor Leaf', {
  shot: p => { const i = bx(p.x), j = by(p.y), a = p.t / 30, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = -5; k <= 5; k++) { const w = Math.round(2.4 * (1 - Math.abs(k) / 6)); for (let m = -w; m <= w; m++) PX(i + ca * k - sa * m * .6, j + sa * k + ca * m * .6, m === 0 ? '#c8f58a' : Math.abs(k) > 3 ? '#26803a' : '#3fb04a'); }
    PX(i + ca * 5, j + sa * 5, '#ffffff'); if (Math.random() < .5) P(p.x, p.y, { life: 220, color: '#7fe05a', size: 1 }); },
  hitAt: (x, y) => { const a = Math.random() * 3; ent(200, q => { aLine(bx(x) - Math.cos(a) * 12, by(y) - Math.sin(a) * 12, bx(x) + Math.cos(a) * 12 * q, by(y) + Math.sin(a) * 12 * q, '#f4ffd8', 1 - q, 1); }); }
});
sig('Seed Bomb', {
  shot: p => { const lift = lob(p, 30), i = bx(p.x), j = by(p.y - lift); aEllFill(bx(p.x), by(p.y) + 12, 3, 1, '#0b0f1a', .3); glow(i, j, 6, '#7fe05a', .4); aEllFill(i, j, 3, 4, '#6a4a24', 1); aRect(i - 1, j - 3, 1, 2, '#c99a4d'); PX(i, j - 5, '#7fe05a'); PX(i + 1, j - 6, '#3fb04a'); },
  impact: S => { const sd = side(S), h = headOf(S); VFX.shake(10, 300); hitstop(50);
    ent(380, q => { const i = bx(h.x), j = by(h.y + 8), r = easeOut(q) * 34; aRing(i, j, r, r * .8, '#7fe05a', 1 - q, 2); glow(i, j, 14 * (1 - q), '#c8f58a', .6); });
    emit(h.x, h.y + 8, 16, { speed: [100, 240], life: 600, color: '#3fb04a', shape: 'leaf', size: 1, spin: 8, g: 200 }); emit(h.x, h.y + 8, 12, { speed: [80, 200], g: 500, life: 500, ramp: 'ground', size: 1 });
    ent(900, q => { const i = bx(sd.x + 14), j = by(sd.y), g = Math.min(1, q * 3), f = q > .7 ? (1 - q) / .3 : 1; aRect(i, j - 6 * g, 1, 6 * g, '#3fb04a', f); PX(i - 1, j - 6 * g, '#7fe05a', f); PX(i + 1, j - 5 * g, '#7fe05a', f); }); }
});
sig('Energy Ball', {
  shot: p => { const i = bx(p.x), j = by(p.y), t = clock.t / 120; glow(i, j, 12, '#7fe05a', .5); aDisc(i, j, 6, '#26803a'); aDisc(i, j, 5, '#7fe05a'); aDisc(i - 1, j - 1, 3, '#c8f58a');
    for (let k = 0; k < 3; k++) { const a = t + k * 2.09; aLine(i, j, i + Math.cos(a) * 4, j + Math.sin(a) * 4, '#26803a', 1); } PX(i - 2, j - 3, '#ffffff'); },
  impact: S => { const h = headOf(S); VFX.shake(9, 280); screenFlash('#e2ffc4', .25);
    ent(560, q => { const i = bx(h.x), j = by(h.y + 6), r = 6 + easeOut(q) * 30; for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28 + q, x = i + Math.cos(a) * r, y = j + Math.sin(a) * r * .8; aEllFill(x, y, 3, 2, k % 2 ? '#7fe05a' : '#c8f58a', 1 - q); } glow(i, j, 16 * (1 - q), '#c8f58a', .7); }); }
});
sig('Leaf Storm', {
  charge: S => { const sd = side(S); ent(WINDUP(MOVES['Leaf Storm']) + 200, (q, age) => { for (let k = 0; k < 14; k++) { const t = k / 14, a = age / 90 + t * 12, r = 10 + t * 26, y = by(sd.y) - t * 60; shapeAt(sd.x + Math.cos(a) * r, sd.y - t * 120, { shape: 'leaf', color: k % 2 ? '#3fb04a' : '#7fe05a', size: 1, rot: a }); } }); },
  shot: p => { for (let k = 0; k < 9; k++) { const a = p.t / 60 + k * .7, r = 4 + (k % 4) * 5; shapeAt(p.x + Math.cos(a) * r * 2, p.y + Math.sin(a) * r * 1.4, { shape: 'leaf', color: k % 3 ? '#3fb04a' : '#c8f58a', size: 1, rot: a * 2 }); } },
  impact: S => { const sd = side(S); VFX.shake(10, 400);
    ent(700, (q, age) => { for (let k = 0; k < 18; k++) { const t = k / 18, a = age / 70 + t * 14, r = 26 * (1 - t * .4); shapeAt(sd.x + Math.cos(a) * r * 1.6, sd.y - 30 + Math.sin(a) * r * .6 - t * 30, { shape: 'leaf', color: k % 2 ? '#26803a' : '#7fe05a', size: 1, rot: a }); } }); }
});
sig('Stun Spore', {
  shot: p => { for (let k = 0; k < 10; k++) { const a = k * 2.4 + p.t / 250, r = 3 + (k % 3) * 4; PX(bx(p.x + Math.cos(a) * r * 2), by(p.y + Math.sin(a) * r * 1.3), k % 2 ? '#ffd23f' : '#ffe9a0'); } if (Math.random() < .2) P(p.x + rnd2(-10, 10), p.y + rnd2(-8, 8), { life: 140, ramp: 'elec', shape: 'zap', size: 1 }); },
  hitAt: (x, y) => { ent(900, (q, age) => { for (let k = 0; k < 14; k++) { const a = k * 2.4 + age / 400, r = 8 + (k % 4) * 5; PX(bx(x + Math.cos(a) * r * 2), by(y + Math.sin(a) * r) + q * 12, '#ffd23f', 1 - q); } if (Math.random() < .3) zig(bx(x) + rnd2(-10, 10), by(y) - 8, bx(x) + rnd2(-10, 10), by(y) + 10, '#fff07a', 1, 3); }); }
});

/* -------------------------------- ELECTRIC -------------------------------- */
sig('Thunder', {
  charge: S => { dim(.5, 1300, '2,2,10'); const T = side(other(S));
    ent(900, (q, age) => { const i = bx(T.x), j = by(T.y - 170); for (let k = 0; k < 9; k++) { const x = i + (k - 4) * 9 + Math.sin(age / 400 + k) * 2, r = 7 + (k % 3) * 2; aEllFill(x, j + Math.abs(k - 4), r, r * .55, k % 2 ? '#2a2a3a' : '#3a3a4e', .9 * Math.min(1, q * 3)); }
      if (Math.random() < .12) zig(i + rnd2(-30, 30), j, i + rnd2(-30, 30), j + 10, '#fff07a', 1, 3); }); },
  mark: mk => { hitstop(110); screenFlash('#ffffff', .9); VFX.shake(16, 500); punch(mk.x, mk.y - 30, 900, 1);
    ent(560, q => { const i = bx(mk.x), j = by(mk.y - 30), top = by(mk.y - 340), f = 1 - q;
      for (let k = -1; k <= 1; k++) zig(i + k * 8, top, i + k * 3, j, '#fff07a', k ? 2 : 6, 10, '#ffffff');
      if (q < .5) for (let k = 0; k < 4; k++) zig(i, top + 60 + k * 40, i + (k % 2 ? 40 : -40), top + 90 + k * 40, '#ffe04a', 1, 6);
      glow(i, j, 40 * f, '#fff07a', .9 * f); shockPx(i, j + 16, easeOut(q) * 70, .4, '#ffd52a', '#ffffff', f, 2); });
    emit(mk.x, mk.y - 30, 50, { speed: [140, 420], life: [300, 700], ramp: 'elec', shape: 'zap', g: 200 }); for (let k = 0; k < 3; k++) addScar('scorch', mk.x + rnd2(-20, 20), mk.y + rnd2(-6, 6)); crackBurst(mk.x, mk.y, 5, 50); }
});
sig('Thunder Punch', {
  charge: S => { const sd = side(S); ent(260, () => { const i = bx(sd.x + sd.face * 16), j = by(sd.y - 22); zig(i, j, i + rnd2(-8, 8), j + rnd2(-8, 8), '#fff07a', 1, 2, '#ffffff'); }); },
  dash: S => { const sd = side(S); if (Math.random() < .6) P(sd.x + sd.face * 16, sd.y - 22, { life: 160, ramp: 'elec', shape: 'zap', size: 1 }); },
  impact: S => { const h = headOf(S), sd = side(S); hitstop(60); VFX.shake(10, 280); screenFlash('#fffbd0', .3);
    ent(420, q => { const i = bx(h.x), j = by(h.y + 8); fistPx(i, j, 2, '#ffd52a', -sd.face); for (let k = 0; k < 6; k++) { const a = k * 1.047 + q * 4; zig(i, j, i + Math.cos(a) * (14 + q * 20), j + Math.sin(a) * (14 + q * 20), '#fff07a', 1, 3); } aRing(i, j, 16, 14, '#ffe04a', 1 - q, 1); }); }
});
sig('Thunder Wave', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), i = bx(p.x), j = by(p.y);
    for (let k = 0; k < 3; k++) { const back = k * 7, r = 8 + k * 2; for (let m = -6; m <= 6; m++) { const t = a + m * .14, x = i - Math.cos(a) * back + Math.cos(t) * r, y = j - Math.sin(a) * back + Math.sin(t) * r; PX(x + ((m + Math.floor(clock.t / 40)) % 2), y, k ? '#ffe04a' : '#fffbd0', 1 - k * .3); } } },
  hitAt: (x, y) => { const T = { x, y }; ent(900, q => { const i = bx(T.x), j = by(T.y), w = 16, h = 22, f = 1 - q;
    zig(i - w, j - h, i + w, j - h, '#fff07a', 1, 2); zig(i + w, j - h, i + w, j + h, '#fff07a', 1, 2); zig(i + w, j + h, i - w, j + h, '#fff07a', 1, 2); zig(i - w, j + h, i - w, j - h, '#fff07a', 1, 2); glow(i, j, 10 * f, '#fff07a', .4 * f); }); }
});

/* -------------------------------- ICE -------------------------------- */
sig('Ice Shard', {
  shot: p => { const a = Math.atan2(p.vy, p.vx), i = bx(p.x), j = by(p.y), ca = Math.cos(a), sa = Math.sin(a);
    for (let k = -6; k <= 6; k++) { const w = Math.round(2.5 * (1 - Math.abs(k) / 7)); for (let m = -w; m <= w; m++) PX(i + ca * k - sa * m, j + sa * k + ca * m, m < 0 ? '#ffffff' : m === 0 ? '#bff4ff' : '#4aa8d0'); }
    if (Math.floor(clock.t / 80) % 3 === 0) { PX(i + ca * 6, j + sa * 6 - 2, '#ffffff'); PX(i + ca * 6, j + sa * 6 + 2, '#ffffff'); } },
  hitAt: (x, y) => { emit(x, y, 12, { speed: [80, 220], life: 380, ramp: 'ice', shape: 'shard', size: 1, spin: 10, g: 300 }); ent(200, q => { const s = 8 * (1 - q); aRect(bx(x) - s, by(y), s * 2 + 1, 1, '#ffffff', 1 - q); aRect(bx(x), by(y) - s, 1, s * 2 + 1, '#ffffff', 1 - q); }); }
});
sig('Ice Punch', {
  charge: S => { const sd = side(S); ent(260, q => { const i = bx(sd.x + sd.face * 16), j = by(sd.y - 22); glow(i, j, 5, '#bff4ff', .6); if (Math.random() < .5) P(sd.x + sd.face * 16, sd.y - 22, { vy: 20, life: 300, color: '#ffffff', shape: 'star', size: 1 }); }); },
  impact: S => { const h = headOf(S), sd = side(S); hitstop(55); VFX.shake(9, 260); glowActor(S, '#bff4ff', 500, .5);
    ent(500, q => { const i = bx(h.x), j = by(h.y + 8); fistPx(i, j, 2, '#7fdcf0', -sd.face); for (let k = 0; k < 6; k++) { const a = k * 1.047, L = 10 + easeOut(q) * 14; spikePx(i + Math.cos(a) * L, j + Math.sin(a) * L * .7, 6 * (1 - q), 1, RAMP.ice); } });
    setTimeoutGame(300, () => emit(h.x, h.y + 8, 14, { speed: [60, 180], life: 400, ramp: 'ice', shape: 'shard', size: 1, spin: 10, g: 300 })); }
});
sig('Aurora Beam', {
  beam: b => { const q = b.t / b.life, grow = Math.min(1, q / .25), fade = q > .7 ? (1 - q) / .3 : 1, i0 = bx(b.x), j0 = by(b.y), len = 450 * grow, ca = Math.cos(b.ang), sa = Math.sin(b.ang), cols = ['#7fffb0', '#7ff7ff', '#a8c0ff', '#ff9cf0', '#fff07a'];
    for (let band = 0; band < 5; band++) for (let k = 0; k < len; k += 1) { const off = (band - 2) * 2 + Math.sin(k / 10 + band - clock.t / 60) * 2; aRect(i0 + ca * k - sa * off, j0 + sa * k + ca * off, 1, 2, cols[(band + Math.floor(clock.t / 90)) % 5], .8 * fade); }
    if (Math.random() < .6) { const d = rnd2(30, len) * 2; P(b.x + ca * d, b.y + sa * d, { life: 400, color: cols[Math.floor(Math.random() * 5)], shape: 'star', size: 1 }); } },
  impact: S => { const h = headOf(S); emit(h.x, h.y + 6, 24, { speed: [80, 220], life: 600, ramp: ['#ffffff', '#7fffb0', '#7ff7ff', '#a8c0ff', '#ff9cf0'], shape: 'star', size: 1 }); }
});
sig('Blizzard', {
  charge: S => { dim(.4, 1400, '20,30,40'); screenFlash('#f0fdff', .2); },
  markDraw: (mk, q) => { const i = bx(mk.x), j = by(mk.y), r = mk.r / 2;
    aEllFill(i, j, r, r * .6, '#bff4ff', .12 + q * .12);
    for (let k = 0; k < 40; k++) { const a = k * 2.4 + clock.t / 260 + q * 3, d = (k * 13 % 100) / 100 * r * 1.2, x = i + Math.cos(a) * d * 1.2, y = j - 30 + Math.sin(a) * d * .5 - (k % 5) * 6; PX(x, y, k % 3 ? '#ffffff' : '#bff4ff'); }
    for (let k = 0; k < 4; k++) { const y = j - 50 + k * 12, x = i - r + ((clock.t / 2 + k * 40) % (r * 2)); aLine(x, y, x + 10, y + 2, '#ffffff', .5); } },
  mark: mk => { hitstop(60); VFX.shake(10, 400); screenFlash('#ffffff', .4); emit(mk.x, mk.y - 20, 40, { speed: [100, 300], life: [400, 800], ramp: 'ice', shape: 'star', size: 1 }); addScar('splat', mk.x, mk.y, { color: '#f2fbff' }); addScar('splat', mk.x + 18, mk.y + 4, { color: '#f2fbff' }); },
  impact: S => glowActor(S, '#bff4ff', 700, .65)
});

/* -------------------------------- FIGHTING -------------------------------- */
sig('Mach Punch', {
  dash: S => { const sd = side(S), a = Math.atan2(sd.vy + .001, sd.vx + .001); for (let k = 0; k < 3; k++) { const o = rnd2(-14, 14); P(sd.x - Math.sin(a) * o, sd.y - 24 + Math.cos(a) * o, { vx: -Math.cos(a) * 600, vy: -Math.sin(a) * 600, life: 90, color: '#a8d8ff', size: 1 }); } },
  impact: S => { const h = headOf(S), sd = side(S); VFX.shake(6, 160);
    ent(220, q => { const i = bx(h.x), j = by(h.y + 8); fistPx(i - sd.face * (1 - q) * 6, j, 1, '#ffe0c8', -sd.face); aRing(i, j, 4 + q * 14, (4 + q * 14) * .8, '#a8d8ff', 1 - q, 1); }); }
});
sig('Karate Chop', {
  impact: S => { const h = headOf(S); hitstop(50); VFX.shake(9, 240);
    ent(340, q => { const i = bx(h.x), j = by(h.y + 6), d = Math.min(1, q * 4); aRect(i - 2, j - 30, 4, 60 * d, '#ff8a5b', 1 - q); aRect(i - 1, j - 30, 2, 60 * d, '#ffffff', 1 - q);
      if (d >= 1) { const s = (q - .25) * 40; aLine(i - 2 - s, j - 10, i - 2 - s * 1.6, j + 10, '#fff0d8', 1 - q, 1); aLine(i + 2 + s, j - 10, i + 2 + s * 1.6, j + 10, '#fff0d8', 1 - q, 1); } }); }
});
sig('Brick Break', {
  impact: S => { const h = headOf(S); hitstop(70); VFX.shake(11, 320);
    const bricks = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) bricks.push({ c: c - 1.5 + (r % 2) * .5, r, vx: rnd2(-80, 80), vy: rnd2(-200, -60) });
    ent(800, (q, age) => { const i = bx(h.x), j = by(h.y - 6), t = age / 1000;
      for (const b of bricks) { const broken = age > 140, x = i + b.c * 9 + (broken ? b.vx * t : 0), y = j + b.r * 6 + (broken ? b.vy * t + 500 * t * t : 0), f = q > .7 ? (1 - q) / .3 : 1;
        aRect(x - 4, y, 8, 5, '#b8503a', f); aRect(x - 4, y, 8, 1, '#e8806a', f); aRect(x + 3, y, 1, 5, '#7a2a1a', f); }
      if (age > 120 && age < 260) { aLine(i - 14, j + 2, i + 14, j + 20, '#ffffff', 1, 2); aLine(i + 10, j, i - 6, j + 24, '#ffffff', 1, 1); } }); }
});
sig('Cross Chop', {
  impact: S => { const h = headOf(S); hitstop(80); VFX.shake(13, 360); screenFlash('#ffc08a', .3);
    ent(460, q => { const i = bx(h.x), j = by(h.y + 6), d = easeOut(Math.min(1, q * 3)), L = 30;
      for (const s of [-1, 1]) { const x0 = i + s * L, y0 = j - L, x1 = lerp(x0, i - s * L * .3, d), y1 = lerp(y0, j + L * .3, d); aLine(x0, y0, x1, y1, '#d84a2a', 1 - q * .7, 6); aLine(x0, y0, x1, y1, '#ffc08a', 1 - q * .7, 3); }
      if (q > .3) { const r = (q - .3) * 70; aLine(i - r, j, i + r, j, '#ffffff', 1 - q, 1); aLine(i, j - r * .7, i, j + r * .7, '#ffffff', 1 - q, 1); } }); }
});
sig('Aura Sphere', {
  charge: S => { const sd = side(S); ent(WINDUP(MOVES['Aura Sphere']), (q, age) => { const i = bx(sd.x + sd.face * 14), j = by(sd.y - 28); for (let k = 0; k < 6; k++) { const a = age / 90 + k * 1.047, r = 18 * (1 - q) + 4; flamePx(i + Math.cos(a) * r, j + Math.sin(a) * r * .8 + 3, 5, 1, age + k * 50, RAMP.water, .8); } aDisc(i, j, 2 + q * 4, '#d8f4ff'); }); },
  shot: p => { const i = bx(p.x), j = by(p.y); glow(i, j, 12, '#3f8cff', .55); aDisc(i, j, 6, '#2a6fc0'); aDisc(i, j, 4.5, '#4aa6ff'); aDisc(i - 1, j - 1, 2.5, '#d8f4ff');
    for (let k = 0; k < 4; k++) { const a = clock.t / 70 + k * 1.57; flamePx(i + Math.cos(a) * 7, j + Math.sin(a) * 7 + 2, 4, 1, clock.t + k * 60, RAMP.blueFire, .8); }
    if (Math.random() < .8) P(p.x, p.y, { life: 300, ramp: 'blueFire', shape: 'disc', size: 2, size2: 0, add: true }); },
  impact: S => { const h = headOf(S); hitstop(60); VFX.shake(10, 300);
    ent(520, q => { const i = bx(h.x), j = by(h.y + 6); for (let k = 0; k < 3; k++) { const t = Math.max(0, q - k * .12), r = easeOut(t) * (30 + k * 10); aRing(i, j, r, r * .85, k ? '#4aa6ff' : '#d8f4ff', 1 - t, 2); } glow(i, j, 20 * (1 - q), '#7fd6ff', .8); }); }
});
sig('Bulk Up', {
  exec: S => { const sd = side(S); glowActor(S, '#ff6a4a', 1000, .5); VFX.shake(5, 400);
    ent(1000, (q, age) => { const i = bx(sd.x), j = by(sd.y); for (let k = 0; k < 5; k++) flamePx(i + (k - 2) * 9, j + 2, (22 + Math.sin(age / 60 + k) * 5) * Math.min(1, q * 3) * (1 - q * .6), 4, age + k * 70, RAMP.fight, .6);
      for (let k = 0; k < 4; k++) { const x = i + (k - 1.5) * 12, y = j - 20 - ((age / 4 + k * 20) % 50); aRect(x, y, 1, 6, '#ffc08a', .7); } }); }
});
