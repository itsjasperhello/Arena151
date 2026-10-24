/* =====================================================================
   Section 19: beam clash visuals
   The battle logic (sim.js, also run by the server) locks two beams together and moves the
   meeting point (G.clash). This file only draws it:
     · both beams, each in its own move animation, cut off at the meeting point
     · a two-tone energy ball with swirling arms, crackling arcs and a type flavour per side
     · a mix of both types where they matter (Fire + Water makes steam, and so on)
     · the tug-of-war meter, muzzle flares, screen shake and camera punch
     · the finales: an overpowering blast, or both beams cancelling in a huge explosion
   ===================================================================== */
const CLS = { id: 0, last: 0, lastX: 0, lastY: 0, ring: 0, shake: 0, dim: 0, punch: 0, pulse: 0, arcs: [] };
const clRamp = mv => RR(TYPE_RAMP[mv.type] || 'normal');
const clashBeamsNow = () => { const o = {}; if (G) for (const b of G.beams) if (b.cl === 1) o[b.owner] = b; return o; };
const clashActive = S => !!(G && G.clash && G.beams.some(b => b.cl === 1 && b.owner === S));

// Pokémon in a clash tremble with the effort
function clashJitter(S) {
  if (!clashActive(S)) return 0;
  const e = (G.clash.e || 0), k = REDUCED ? .3 : 1;
  return (Math.random() - .5) * 2 * (.6 + e * 2.2) * k * (cam.pz || 1) * .5;
}

/* ---------- type flavours: what each side throws into the struggle ---------- */
// (x, y) = meeting point in world units, e = struggle energy 0…1, f = frame scale (≈1 at 60 fps)
const CL_FLAVOR = {
  Fire: (x, y, r, e, f) => { if (Math.random() < .9 * f) emit(x, y, 2, { speed: [20, 110], ang: -Math.PI / 2, spread: 2.2, vy: -40, life: [380, 760], ramp: 'fire', size: [1, 2], size2: 1, add: true, r: 12 }); if (Math.random() < .12 * f) P(x, y, { life: 520, ramp: 'fire', shape: 'ring', size: 3, size2: 20 + e * 14, add: true }); },
  Water: (x, y, r, e, f) => { emit(x, y, 2, { speed: [60, 200], g: 380, life: [380, 700], ramp: 'water', shape: 'drop', size: [1, 2], size2: 1, vy: -90 }); if (Math.random() < .5 * f) emit(x, y, 1, { speed: [10, 50], life: [500, 900], ramp: 'water', shape: 'disc', size: 1, size2: 4, add: true, r: 14 }); },
  Ice: (x, y, r, e, f) => { if (Math.random() < .7 * f) emit(x, y, 1, { speed: [60, 190], life: [420, 800], ramp: 'ice', shape: 'shard', size: [1, 2], size2: 1, spin: 6, g: 60 }); if (Math.random() < .8 * f) emit(x, y, 1, { speed: [20, 80], life: [500, 900], ramp: 'ice', shape: 'star', size: 1, size2: 2, add: true, r: 16 }); },
  Psychic: (x, y, r, e, f) => { if (Math.random() < .22 * f) P(x, y, { life: 620, ramp: r, shape: 'ring', size: 3, size2: 22 + e * 20, add: true }); emit(x, y, 1, { speed: [30, 120], life: [400, 800], ramp: 'psychic', shape: 'plus', size: 1, add: true }); },
  Bug: (x, y, r, e, f) => { emit(x, y, 1, { speed: [50, 170], life: [320, 650], ramp: 'bug', shape: 'star', size: 1, size2: 2, add: true }); if (Math.random() < .4 * f) emit(x, y, 1, { speed: [40, 140], life: [200, 380], color: '#fff07a', shape: 'zap', size: 1, add: true }); },
  Dragon: (x, y, r, e, f) => { const a = clock.t / 90; for (const s of [0, Math.PI]) P(x + Math.cos(a + s) * (14 + e * 8), y + Math.sin(a + s) * (14 + e * 8) * .8, { life: 520, ramp: 'dragon', shape: 'star', size: 1, size2: 2, add: true, vx: Math.cos(a + s) * 40, vy: Math.sin(a + s) * 40 }); if (Math.random() < .5 * f) emit(x, y, 1, { speed: [60, 170], life: [380, 700], ramp: 'dragon', size: 2, size2: 1, add: true }); },
  Steel: (x, y, r, e, f) => { emit(x, y, 2, { speed: [120, 320], g: 240, life: [240, 520], ramp: 'steel', size: [1, 2], size2: 1, add: true }); if (Math.random() < .3 * f) P(x + (Math.random() - .5) * 20, y + (Math.random() - .5) * 14, { life: 220, color: '#ffffff', shape: 'star', size: 2, size2: 1, add: true }); },
  Normal: (x, y, r, e, f) => { emit(x, y, 1, { speed: [60, 220], life: [320, 640], ramp: 'gold', shape: 'star', size: 1, size2: 2, add: true }); if (Math.random() < .5 * f) emit(x, y, 1, { speed: [100, 260], life: [200, 420], color: '#ffffff', size: 1, add: true }); }
};
const clFlavorOf = (type, ramp, x, y, e, f) => { (CL_FLAVOR[type] || ((x, y, r, e, f) => emit(x, y, 2, { speed: [60, 200], life: [320, 640], ramp: r, size: [1, 2], size2: 1, add: true })))(x, y, ramp, e, f); };
// Mixed types: what happens where the two meet
function clComboFx(tA, tB, x, y, e, f) {
  const has = t => tA === t || tB === t, steam = has('Fire') && (has('Water') || has('Ice'));
  if (steam) {   // Fire meets Water or Ice: a billowing steam cloud
    if (Math.random() < (.55 + e * .5) * f) emit(x, y, 1, { speed: [10, 60], ang: -Math.PI / 2, spread: 2.6, life: [700, 1300], ramp: 'smoke', shape: 'disc', size: 2, size2: 6 + e * 3, r: 16 });
    if (Math.random() < .5 * f) emit(x, y, 1, { speed: [30, 90], ang: -Math.PI / 2, spread: 3, life: [500, 900], color: '#ffffff', shape: 'disc', size: 1, size2: 4, add: true, r: 12 });
  }
  if (has('Water') && has('Ice') && Math.random() < .5 * f) emit(x, y, 1, { speed: [30, 120], g: 200, life: [500, 900], color: '#e8fbff', shape: 'star', size: 1, size2: 2 });
  if (has('Psychic') && has('Dragon') && Math.random() < .4 * f) P(x, y, { life: 560, color: '#c8a0ff', shape: 'ring', size: 4, size2: 26, add: true });
  if (has('Steel') && (has('Fire') || has('Normal')) && Math.random() < .5 * f) emit(x, y, 2, { speed: [160, 340], g: 300, life: [240, 480], ramp: 'gold', size: 1, add: true });
}

/* ---------- per frame: the locked beams ---------- */
function drawClash() {
  const cl = G && G.clash; if (!cl) { CLS.id = 0; return; }
  const bs = clashBeamsNow(), bA = bs.A, bB = bs.B; if (!bA || !bB) return;
  const t = clock.t, dt = CLS.last ? clamp(t - CLS.last, 0, 60) : 16, f = dt / 16.7; CLS.last = t;
  if (CLS.id !== cl.id) { CLS.id = cl.id; CLS.lastX = cl.x; CLS.lastY = cl.y; CLS.ring = 0; CLS.shake = 0; CLS.dim = 0; CLS.punch = 0; CLS.pulse = 0; }
  const e = cl.e || 0, rA = clRamp(bA.mv), rB = clRamp(bB.mv), ci = bx(cl.x), cj = by(cl.y);
  const aA = Math.atan2(bA.y - cl.y, bA.x - cl.x), aB = Math.atan2(bB.y - cl.y, bB.x - cl.x);
  // surge detection: the ball is shoved along the line
  const sp = Math.hypot(cl.x - CLS.lastX, cl.y - CLS.lastY) / Math.max(1, dt) * 1000; CLS.lastX = cl.x; CLS.lastY = cl.y;
  CLS.pulse = Math.max(0, CLS.pulse - dt / 260); CLS.ring -= dt;
  if (sp > 90 && CLS.ring <= 0) { CLS.ring = 240; CLS.pulse = 1; const towardB = Math.cos(aB) * (cl.x - CLS.lastX) < 0; ringFx(cl.x, cl.y, (towardB ? rA : rB)[2], 8, 54 + e * 30, 340); P(cl.x, cl.y, { life: 260, color: '#ffffff', shape: 'star', size: 3, size2: 1, add: true }); }
  const R = 6 + e * 8 + CLS.pulse * 4 + Math.sin(t / 55) * 1.1;

  // muzzle flares and the glow on each Pokémon
  for (const [b, r] of [[bA, rA], [bB, rB]]) {
    const oi = bx(b.x), oj = by(b.y), pr = 7 + Math.sin(t / 45 + (b.owner === 'A' ? 0 : 2)) * 1.5 + e * 3;
    glow(oi, oj, pr * 1.8, r[3], .65); aDisc(oi, oj, pr * .6, r[2]); aDisc(oi, oj, pr * .3, '#ffffff');
    ACTOR_GLOW[b.owner] = { col: r[2], a: .22 + e * .3, until: t + 140 };
  }
  // energy streaks racing along each beam toward the ball, and a swelling where the beam feeds the ball
  bctx.globalCompositeOperation = 'lighter';
  for (const [b, r, a] of [[bA, rA, aA], [bB, rB, aB]]) {
    const len = Math.hypot(cl.x - b.x, cl.y - b.y) / 2, ca = Math.cos(a + Math.PI), sa = Math.sin(a + Math.PI), oi = bx(b.x), oj = by(b.y);
    for (let k = 0; k < 7; k++) { const d = ((t * .42 + k * len / 7) % Math.max(20, len)), i = oi + ca * d, j = oj + sa * d; aRect(i - 1, j - 1, 3, 3, r[1], .55); aRect(i - ca * 5 - 1, j - sa * 5 - 1, 2, 2, r[2], .35); }
    for (let k = 0; k < 16; k++) { const d = len - k * 2.2; if (d < 0) break; aDisc(oi + ca * d, oj + sa * d, Math.max(1.5, (R * .75) * (1 - k / 17)), r[3], .22); }
  }
  bctx.globalCompositeOperation = 'source-over';

  // the ball: two-tone body, one half per beam
  glow(ci, cj, R * 2.8, '#ffffff', .22 + e * .2); glow(ci, cj, R * 2.2, rA[3], .25); glow(ci, cj, R * 2.2, rB[3], .25);
  for (const [a, r] of [[aA, rA], [aB, rB]]) {
    bctx.save(); bctx.translate(ci, cj); bctx.rotate(a); bctx.beginPath(); bctx.rect(0, -R * 3, R * 3, R * 6); bctx.clip(); bctx.rotate(-a); bctx.translate(-ci, -cj);
    aDisc(ci, cj, R, r[4]); aDisc(ci, cj, R * .86, r[3]); aDisc(ci - Math.cos(a) * R * .12, cj - Math.sin(a) * R * .12, R * .62, r[2]); aDisc(ci - Math.cos(a) * R * .2, cj - Math.sin(a) * R * .2, R * .38, r[1]);
    bctx.restore();
  }
  aDisc(ci, cj, Math.max(2, R * .3), '#ffffff', .95 - Math.sin(t / 40) * .1);
  for (let arm = 0; arm < 4; arm++) {   // swirling arms: one pair per type, spinning opposite ways
    const r = arm % 2 ? rB : rA, dir = arm % 2 ? -1 : 1;
    for (let k = 0; k < 15; k++) { const rad = R * (.5 + k / 15 * 1.9), ang = dir * t / (95 - e * 30) + k * .33 + arm * Math.PI / 2; aRect(ci + Math.cos(ang) * rad, cj + Math.sin(ang) * rad * .85, k < 6 ? 2 : 1, k < 6 ? 2 : 1, r[k < 8 ? 1 : 2], 1 - k / 18); }
  }
  for (let k = 0; k < 6; k++) { const ang = t / 70 + k * 1.047; aRect(ci + Math.cos(ang) * (R + 4), cj + Math.sin(ang) * (R + 4) * .85, 2, 2, '#ffffff', .9); }

  // crackling arcs between the ball and the surroundings, more as the energy builds
  const arcs = (1 + Math.floor(e * 3)) * (f > .5 ? 1 : 0);
  for (let k = 0; k < arcs; k++) { const a = Math.random() * 6.28, L = R * 1.6 + Math.random() * (14 + e * 18), r = Math.random() < .5 ? rA : rB; zig(ci + Math.cos(a) * R * .6, cj + Math.sin(a) * R * .6, ci + Math.cos(a) * L, cj + Math.sin(a) * L * .85, r[2], 1, 3, '#ffffff'); }
  bctx.globalAlpha = 1;

  // particles: both flavours, a spray of sparks, and the combination effect
  const rate = f * (1.4 + e * 2.6);
  clFlavorOf(bA.mv.type, rA, cl.x + Math.cos(aA) * 6, cl.y + Math.sin(aA) * 6, e, f); clFlavorOf(bB.mv.type, rB, cl.x + Math.cos(aB) * 6, cl.y + Math.sin(aB) * 6, e, f);
  clComboFx(bA.mv.type, bB.mv.type, cl.x, cl.y, e, f);
  if (Math.random() < rate / 2) { const a = Math.random() * 6.28, r = Math.random() < .5 ? rA : rB; P(cl.x, cl.y, { vx: Math.cos(a) * rnd2(90, 320), vy: Math.sin(a) * rnd2(90, 320) - 30, g: 220, life: rnd2(260, 620), ramp: r, size: 1 + (Math.random() < .3 ? 1 : 0), size2: 1, add: true }); }
  if (e > .55 && Math.random() < .25 * f) P(cl.x, cl.y, { life: 360, color: '#ffffff', shape: 'ring', size: 2, size2: 30, add: true });

  // the whole screen feels it
  CLS.shake -= dt; if (CLS.shake <= 0) { CLS.shake = 90; VFX.shake(1.5 + e * 6, 140); }
  CLS.dim -= dt; if (CLS.dim <= 0) { CLS.dim = 260; dim(.18 + e * .22, 420, '8,6,18'); }
  CLS.punch -= dt; if (CLS.punch <= 0) { CLS.punch = 550; punch(cl.x, cl.y, 800, 1); }
  if (e > .7 && Math.random() < .03 * f) screenFlash('#ffffff', .18 + e * .2);
}

/* ---------- tug-of-war meter (drawn on the screen layer) ---------- */
function drawClashMeter(c, DW, DH, unit) {
  const cl = G && G.clash; if (!cl) return; const bs = clashBeamsNow(), bA = bs.A, bB = bs.B; if (!bA || !bB) return;
  const full = Math.hypot(bB.x - bA.x, bB.y - bA.y) || 1, p = clamp(Math.hypot(cl.x - bA.x, cl.y - bA.y) / full, 0, 1), rA = clRamp(bA.mv), rB = clRamp(bB.mv);
  const w = Math.round(Math.min(DW * .5, 300 * unit * 1.5)), h = Math.max(8, Math.round(11 * unit * 1.3)), x0 = Math.round(DW / 2 - w / 2), y0 = Math.round(DH * .115);
  c.save(); c.globalAlpha = .92; c.fillStyle = '#05070d'; c.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
  const sp = Math.round(w * p), jig = Math.sin(clock.t / 40) * 1.5;
  c.fillStyle = rA[3]; c.fillRect(x0, y0, sp, h); c.fillStyle = rA[1]; c.fillRect(x0, y0, sp, Math.max(2, h / 3));
  c.fillStyle = rB[3]; c.fillRect(x0 + sp, y0, w - sp, h); c.fillStyle = rB[1]; c.fillRect(x0 + sp, y0, w - sp, Math.max(2, h / 3));
  c.fillStyle = '#ffffff'; c.fillRect(x0 + sp - 2, y0 - 5, 4, h + 10);
  c.fillStyle = 'rgba(255,255,255,.55)'; for (const q of [.1, .9]) c.fillRect(x0 + Math.round(w * q) - 1, y0, 2, h);   // the lines where a beam gives way
  c.globalAlpha = 1;
  if (G && !G.auto && (cl.e || 0) < .92) textAt(c, 'MASH A MOVE BUTTON!', DW / 2, y0 + h + Math.round(15 * unit * 1.2), Math.round(13 * unit * 1.25 * (1 + Math.max(0, Math.sin(clock.t / 90)) * .1)), '#ffffff', '#1a1020', { italic: true });
  c.restore();
}

/* ---------- events ---------- */
// A charged beam waits a moment for a rival beam that is about to fire: both leave together.
VFX.beamHold = (S, mv) => {
  const rp = clRamp(mv), ms = CLASH.sync + 90;
  ent(ms, (q, age) => {
    const sd = side(S), i = bx(sd.x + sd.face * 18), j = by(sd.y - 32), r = 4 + Math.min(1, q * 1.4) * 9 + Math.sin(age / 40) * 1.5;
    glow(i, j, r * 1.9, rp[3], .7); aDisc(i, j, r, rp[3]); aDisc(i, j, r * .66, rp[1]); aDisc(i, j, r * .32, '#ffffff');
    for (let k = 0; k < 6; k++) { const a = age / 65 + k * 1.047, d = r + 4 + 14 * (1 - q) * (k % 2 ? 1 : .6); aRect(i + Math.cos(a) * d, j + Math.sin(a) * d * .8, 2, 2, rp[1]); }
    if (Math.random() < .5) { const a = Math.random() * 6.28; spark(sd.x + sd.face * 18 + Math.cos(a) * 30, sd.y - 32 + Math.sin(a) * 30, { color: rp[2], vx: -Math.cos(a) * 130, vy: -Math.sin(a) * 130, life: 240, add: true }); }
  });
  ringFx(side(S).x + side(S).face * 18, side(S).y - 32, rp[2], 30, 8, 340);
};
VFX.clashStart = (x, y, sa, mva, sb, mvb) => {
  const rA = clRamp(mva), rB = clRamp(mvb);
  screenFlash('#ffffff', .7); VFX.shake(12, 420); punch(x, y, 900, 1);
  ringFx(x, y, '#ffffff', 6, 90, 380); ringFx(x, y, rA[2], 4, 70, 460); ringFx(x, y, rB[2], 4, 120, 560);
  for (let k = 0; k < 22; k++) { const a = Math.random() * 6.28, v = rnd2(120, 380), r = k % 2 ? rA : rB; P(x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd2(300, 600), ramp: r, size: 2, size2: 1, add: true }); }
  ent(520, q => { const i = bx(x), j = by(y); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28 + q, L = 6 + Ease.outQ(q) * 46; aLine(i + Math.cos(a) * 4, j + Math.sin(a) * 4, i + Math.cos(a) * L, j + Math.sin(a) * L, k % 2 ? rA[1] : rB[1], 1 - q, k % 3 ? 1 : 2); } });
  VFX.big('BEAM CLASH!', '#ffffff'); VFX.crowd(2);
  if (G && !G.auto) VFX.banner('MASH A MOVE BUTTON TO PUSH BACK!', '#ffffff');
  CLS.id = 0;
};
// One side is overpowered: the winner's energy rockets down the loser's beam.
VFX.clashEnd = (x, y, kind, win, lose, mvW, mvL) => {
  if (kind === 'draw') return clashExplosion(x, y, mvW, mvL);
  const rW = clRamp(mvW), rL = clRamp(mvL), ls = side(lose), tx = ls.x, ty = ls.y - 32;
  screenFlash(rW[1], .75); VFX.shake(14, 520); VFX.big('OVERPOWERED!', rW[3]); punch(x, y, 900, 1);
  ringFx(x, y, '#ffffff', 8, 120, 420); ringFx(x, y, rW[2], 6, 170, 520); ringFx(x, y, rL[2], 6, 90, 420);
  const ang = Math.atan2(ty - y, tx - x);
  emit(x, y, 26, { ang, spread: .9, speed: [160, 420], life: [300, 650], ramp: rW, size: [1, 2], size2: 1, add: true });
  emit(x, y, 18, { ang: ang + Math.PI, spread: 1.2, speed: [80, 260], life: [300, 600], ramp: rL, size: [1, 2], size2: 1, add: true });
  ent(280, q => {
    const e = Ease.inQ(q), i = bx(lerp(x, tx, e)), j = by(lerp(y, ty, e));
    for (let k = 7; k >= 1; k--) { const ee = Math.max(0, e - k * .05); aDisc(bx(lerp(x, tx, ee)), by(lerp(y, ty, ee)), 8 - k, rW[3], .25); }
    glow(i, j, 18, rW[3], .7); aDisc(i, j, 8, rW[3]); aDisc(i, j, 6, rW[1]); aDisc(i, j, 3, '#ffffff');
  });
  crackBurst(x, y + 28, 2);
};
// The blast that follows an overpowering: the winner's beam arrives at the loser.
VFX.clashBreak = (owner, mv) => {
  const r = clRamp(mv), foe = side(other(owner)), x = foe.x, y = foe.y - 30;
  screenFlash('#ffffff', .65); VFX.shake(18, 560); punch(x, y, 1100, 2);
  ringFx(x, y, '#ffffff', 10, 190, 500); ringFx(x, y, r[2], 8, 150, 560); setTimeoutGame(110, () => ringFx(x, y, r[3], 8, 230, 640));
  burstAt(x, y, r[2], 34, 420, 2);
  ent(560, q => { const i = bx(x), j = by(y); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28 + k, L = 8 + Ease.outQ(q) * 70 * (k % 2 ? 1 : .6); aLine(i + Math.cos(a) * 6, j + Math.sin(a) * 6, i + Math.cos(a) * L, j + Math.sin(a) * L, k % 3 ? r[1] : '#ffffff', 1 - q, k % 2 ? 2 : 1); } aDisc(i, j, 4 + q * 20, r[2], (1 - q) * .6); });
  addScar('scorch', foe.x, foe.y); crackBurst(foe.x, foe.y, 4); VFX.crowd(2);
};
// The beams cancel: a huge explosion centred on the meeting point.
function clashExplosion(x, y, mvA, mvB) {
  const rA = clRamp(mvA), rB = clRamp(mvB), gy = (side('A').y + side('B').y) / 2;
  screenFlash('#ffffff', 1); VFX.shake(24, 900); punch(x, y, 1500, 2); dim(.5, 700, '10,6,16');
  VFX.big('BEAMS CANCELLED!', '#ffffff'); setTimeoutGame(520, () => VFX.big('HUGE EXPLOSION!', '#ffd23f'));
  // fireball: white-hot core, one lobe per type, fading through smoke
  ent(1000, q => {
    const i = bx(x), j = by(y), g = Ease.outQ(Math.min(1, q * 2.4)), r = (8 + g * 48) * (q < .55 ? 1 : 1 - (q - .55) * .7), a = 1 - Math.max(0, q - .45) / .55;
    glow(i, j, r * 1.6, rA[3], .5 * a); glow(i, j, r * 1.6, rB[3], .5 * a);
    aDisc(i - r * .22, j, r * .95, q < .35 ? rA[2] : rA[4], a * .9); aDisc(i + r * .22, j, r * .95, q < .35 ? rB[2] : rB[4], a * .9);
    aDisc(i, j - r * .1, r * .72, q < .25 ? '#ffffff' : rA[1], a); aDisc(i, j, r * .42, '#ffffff', a);
    if (q > .4) for (let k = 0; k < 8; k++) { const ang = k * .785 + q * 2; aDisc(i + Math.cos(ang) * r * .8, j + Math.sin(ang) * r * .6 - q * 14, r * .28, RAMP.smoke[3], (1 - q) * .55); }
  });
  // spokes of light
  ent(700, q => { const i = bx(x), j = by(y); for (let k = 0; k < 22; k++) { const a = k / 22 * 6.28 + k * .31, L = 10 + Ease.outQ(q) * 120 * (k % 2 ? 1 : .6), c0 = k % 3 === 0 ? '#ffffff' : k % 2 ? rA[1] : rB[1]; aLine(i + Math.cos(a) * 10 * (1 - q), j + Math.sin(a) * 10 * (1 - q), i + Math.cos(a) * L, j + Math.sin(a) * L, c0, 1 - q, k % 2 ? 3 : 1); } });
  // concentric shockwaves, a ground blast and debris
  ringFx(x, y, '#ffffff', 10, 240, 560); ringFx(x, y, rA[2], 6, 190, 640); setTimeoutGame(110, () => ringFx(x, y, rB[2], 6, 280, 760)); setTimeoutGame(260, () => ringFx(x, y, '#ffffff', 10, 360, 900)); setTimeoutGame(420, () => ringFx(x, gy, RAMP.smoke[2], 10, 420, 1000));
  burstAt(x, y, rA[2], 40, 520, 2); burstAt(x, y, rB[2], 40, 520, 2);
  for (let k = 0; k < 34; k++) { const a = Math.random() * 6.28, v = rnd2(120, 520); P(x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 520, life: rnd2(500, 1100), ramp: k % 2 ? rA : rB, size: 2, size2: 1, add: k % 3 === 0 }); }
  for (let k = 0; k < 6; k++) setTimeoutGame(60 + k * 90, () => emit(x + (Math.random() - .5) * 70, y + (Math.random() - .5) * 40, 5, { speed: [20, 110], ang: -Math.PI / 2, spread: 2.4, life: [800, 1500], ramp: 'smoke', shape: 'disc', size: 2, size2: 7, r: 14 }));
  addScar('scorch', x, gy); addScar('scorch', x - 24, gy + 6); addScar('scorch', x + 24, gy - 4); crackBurst(x, gy, 7, 60); VFX.crowd(2);
  for (const S of ['A', 'B']) { const sd = side(S); ACTOR_GLOW[S] = { col: '#ffffff', a: .8, until: clock.t + 380 }; sd.hit = 350; }
}
