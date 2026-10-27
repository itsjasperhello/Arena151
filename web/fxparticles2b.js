/* =====================================================================
   Section 24b: milestone-2 upgrade (projectiles, bursts, lightning)
   Brought up to the set-piece standard: a launch flare for every
   projectile, energy-sphere bodies for the energy moves, and full
   elemental explosions on impact scaled to the move's power.
   Layered on top of fxparticles2.js (its bodies and trails stay).
   ===================================================================== */
(function fxParticles2b() {
  const P = window.PFX, K = window.FXK, P3 = window.PFX3; if (!P || !K || !P3) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P;
  const { body, foe, dim, flash, shake, scar, speedLines, shock, star, ribbon, linePath, pillar, orb, debris, sparks, puff, glowAt, EX, later, fx, ease, rnd, N, T } = K;
  const { hitPt, skyBolts } = P3;
  const at = p => { const i = bx(p.x), j = by(p.y), ang = Math.atan2(p.vy, p.vx); return { i, j, ang, ca: Math.cos(ang), sa: Math.sin(ang) }; };

  // the launch: a muzzle bloom, a ring and recoil sparks in the move's colour
  const launch = (rgb, size = 1) => S => { const b = body(S), x = b.i + b.face * b.w * .45, y = b.j, k = b.k * size;
    glowAt(x, y, 30 * k, rgb, 260); shock(x, y, { r1: 34 * k, col: rgb, w: 3.5 * k, ms: 260 }); sparks(x, y, 10 * k, { cols: ['#ffffff', `rgb(${rgb})`], v: [80, 200], grav: 120 });
    if (size >= 1.4) speedLines(x, y, `rgb(${rgb})`, 260, 16); };
  // extra layers drawn on top of a projectile's existing body
  const sphere = (core, mid, rim, r, arcs = 3) => p => { const s = at(p); fx({ add: true, max: .02, draw: c => orb(c, s.i, s.j, r, { core, mid, rim, arcs }) }); };
  const swirl = (edge, glow, r = 10) => p => { if (Math.random() < .45) { const s = at(p), ph = clock.t / 50; for (const sg of [-1, 1]) ribbon(t => { const a = t * 7 + ph * sg; return [s.i - s.ca * t * 46 + Math.cos(a) * r * (1 - t * .5), s.j - s.sa * t * 46 + Math.sin(a) * r * (1 - t * .5)]; }, { w: 4, ms: 160, core: '#ffffff', edge, glow, grow: .12 }); } };

  const reg = (name, r) => { const old = MFX[name] || {}, o = Object.assign({}, old);
    if (r.body) { const prev = old.shot; o.shot = p => { if (prev) try { prev(p); } catch (e) { console.error(e); } try { r.body(p); } catch (e) { console.error(e); } }; }
    for (const kk of ['impact', 'exec']) if (r[kk]) { const prev = old[kk]; o[kk] = (...a) => { if (prev) try { prev(...a); } catch (e) { console.error(e); } try { r[kk](...a); } catch (e) { console.error(e); } }; }
    MFX[name] = o; };
  const at2 = S => { const h = hitPt(S); return [h.x, h.y, h.b]; };

  // ---- fire ----
  reg('Ember', { exec: launch('255,170,70'), impact: S => { const [x, y, b] = at2(S); EX.fire(x, y, b.k * .75); scar('scorch', b.wx, b.wy); } });
  reg('Fire Blast', { exec: S => { launch('255,160,60', 1.6)(S); dim(.35, 1500, '40,10,0'); },
    impact: S => { const [x, y, b] = at2(S); EX.fire(x, y, b.k * 1.8); later(120, () => EX.fire(x + rnd(-24, 24), y - 14, b.k)); pillar(x, b.feet, { w: Math.max(34, b.w * 1.3), h: 220, col: '255,150,50', ms: 800 });
      star(x, y, { size: 30 * b.k, col: '#ff9a30' }); flash('#ffb060', .35); shake(10, 360); scar('scorch', b.wx, b.wy); later(200, () => scar('scorch', b.wx + 30, b.wy + 10)); } });
  // ---- water ----
  reg('Water Gun', { exec: launch('140,210,255'), impact: S => { const [x, y, b] = at2(S); EX.water(x, y, b.k * .8); scar('splat', b.wx, b.wy); } });
  reg('Bubble Beam', { exec: launch('160,220,255'), impact: S => { const [x, y, b] = at2(S); EX.water(x, y, b.k * .9); for (let i = 0; i < N(14); i++) later(rnd(0, 400), () => { const bb = body(S); spawn({ x: bb.i + rnd(-.6, .6) * bb.w, y: bb.j + rnd(-.5, .5) * bb.h, vx: 0, vy: -rnd(10, 30), drag: .98, max: .5, r: rnd(3, 6), grow: .8, kind: 'ring', col: '#cfeeff', lw: 1.2, a: 1, add: true }); }); } });
  // ---- grass ----
  reg('Seed Bomb', { exec: launch('170,230,110'), impact: S => { const [x, y, b] = at2(S); glowAt(x, y, 40 * b.k, '200,240,120', 260); shock(x, y, { r1: 64 * b.k, col: '200,240,130', w: 5 }); debris(x, y, 14, { cols: [['#7a5a2a', '#c8a060'], ['#4a8a30', '#8ad060']], floor: b.feet + 8 }); puff(x, y, 10, { r: [8, 14], up: 20 }); star(x, y, { size: 20 * b.k, col: '#b8e060' }); shake(4, 160); } });
  reg('Energy Ball', { exec: launch('170,240,110'), body: sphere('255,255,230', '140,230,90', '210,255,170', 9),
    impact: S => { const [x, y, b] = at2(S); glowAt(x, y, 52 * b.k, '170,240,110', 360); for (let i = 0; i < 3; i++) later(i * 70, () => shock(x, y, { r1: (46 + i * 16) * b.k, col: '180,250,120', w: 4 })); sparks(x, y, 24, { cols: ['#ffffff', '#b8f070'] }); for (let i = 0; i < N(22); i++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(60, 200), vy: Math.sin(a) * rnd(60, 200), drag: .92, max: rnd(.4, .7), r: rnd(4, 8), grow: .5, img: hueTex(rnd(90, 125) | 0, 90, 62), a: 1, add: true }); } shake(4, 180); } });
  // ---- ice / rock / ground / poison ----
  reg('Ice Shard', { exec: launch('190,240,255'), impact: S => { const [x, y, b] = at2(S); EX.ice(x, y, b.k * .85); } });
  reg('Rock Throw', { exec: launch('220,200,160'), impact: S => { const [x, y, b] = at2(S); EX.rock(x, y, b.k, b.feet + 8); star(x, y, { size: 18 * b.k, col: '#e8c890' }); shake(5, 180); scar('crack', b.wx, b.wy); } });
  reg('Mud Shot', { exec: launch('190,150,100'), impact: S => { const [x, y, b] = at2(S); for (let i = 0; i < N(34); i++) { const a = rnd(Math.PI, T), v = rnd(80, 240); spawn({ x, y, vx: Math.cos(a) * v * .7, vy: Math.sin(a) * v, drag: .97, ay: 460, floor: b.feet + 6, max: rnd(.6, 1), r: rnd(2, 4), grow: 0, kind: 'drop', col: i % 2 ? '#7a5a34' : '#5a4024', a: 1, add: false }); }
    shock(x, y + 8, { r1: 54 * b.k, col: '180,140,90', w: 4, squash: .45 }); scar('splat', b.wx, b.wy); } });
  reg('Poison Sting', { exec: launch('200,120,255'), impact: S => { const [x, y, b] = at2(S); EX.poison(x, y, b.k * .6); } });
  reg('Sludge Bomb', { exec: launch('190,110,255', 1.2), impact: S => { const [x, y, b] = at2(S); EX.poison(x, y, b.k * 1.3); scar('splat', b.wx, b.wy); shake(5, 200); } });
  reg('Gunk Shot', { exec: S => { launch('150,80,200', 1.5)(S); dim(.25, 900, '20,0,30'); }, impact: S => { const [x, y, b] = at2(S); EX.poison(x, y, b.k * 1.8); debris(x, y, 10, { cols: [['#4a2a5a', '#7a4a8a'], ['#3a3a2a', '#6a6a4a']], floor: b.feet + 8 }); scar('splat', b.wx, b.wy); later(150, () => scar('splat', b.wx - 24, b.wy + 6)); shake(8, 260); } });
  // ---- energy spheres ----
  reg('Aura Sphere', { exec: launch('120,180,255', 1.3), body: p => { sphere('255,255,255', '90,160,255', '200,230,255', 11, 4)(p); swirl('rgba(110,170,255,.85)', 'rgba(80,140,255,A)', 12)(p); },
    impact: S => { const [x, y, b] = at2(S); glowAt(x, y, 70 * b.k, '120,180,255', 420); for (let i = 0; i < 4; i++) later(i * 60, () => shock(x, y, { r1: (52 + i * 18) * b.k, col: '150,200,255', w: 5 })); star(x, y, { size: 28 * b.k, col: '#9fd0ff' }); sparks(x, y, 34, { cols: ['#ffffff', '#9fd0ff'], v: [180, 420] }); speedLines(x, y, '#bfe0ff', 300); flash('#d8ecff', .2); shake(7, 240); } });
  reg('Shadow Ball', { exec: S => { launch('150,90,255', 1.3)(S); dim(.3, 1100, '15,0,30'); }, body: swirl('rgba(120,70,220,.85)', 'rgba(90,40,200,A)', 14),
    impact: S => { const [x, y, b] = at2(S); EX.ghost(x, y, b.k * 1.6); fx({ max: .5, draw: (c, q) => { const r = (20 + ease.out(q) * 60) * b.k; c.globalAlpha = .8 * (1 - q); const g = c.createRadialGradient(x, y, r * .3, x, y, r); g.addColorStop(0, 'rgba(10,0,20,.95)'); g.addColorStop(.7, 'rgba(60,20,120,.6)'); g.addColorStop(1, 'rgba(120,70,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, T); c.fill(); } });
      flash('#2a0a4a', .3); shake(7, 240); } });
  reg('Moonblast', { exec: S => { launch('255,180,230', 1.3)(S); dim(.35, 1200, '20,0,40'); }, body: sphere('255,255,255', '255,170,225', '255,230,245', 10),
    impact: S => { const [x, y, b] = at2(S); glowAt(x, y, 80 * b.k, '255,180,230', 500); for (let i = 0; i < 3; i++) later(i * 80, () => shock(x, y, { r1: (60 + i * 20) * b.k, col: '255,190,235', w: 5 }));
      fx({ add: true, max: .8, draw: (c, q) => { const r = 30 * b.k * ease.back(Math.min(1, q / .3)), a = q > .5 ? (1 - q) / .5 : 1; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; const g = c.createRadialGradient(x, y - 30 * b.k, 0, x, y - 30 * b.k, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, 'rgba(255,200,240,.9)'); g.addColorStop(1, 'rgba(255,150,220,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 30 * b.k, r, 0, T); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x + r * .4, y - 30 * b.k - r * .25, r * .8, 0, T); c.fill(); c.restore(); } });
      for (let i = 0; i < N(34); i++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(80, 240), vy: Math.sin(a) * rnd(80, 240), drag: .92, max: rnd(.5, .9), r: rnd(3, 6), grow: .1, kind: 'shard', col: i % 2 ? '#ffffff' : '#ffb0e0', rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: true }); } flash('#ffd8f0', .25); shake(6, 220); } });
  reg('Dazzling Gleam', { exec: S => { launch('255,230,250', 1.4)(S); flash('#ffffff', .2); }, body: sphere('255,255,255', '255,220,250', '255,255,255', 9),
    impact: S => { const [x, y, b] = at2(S); flash('#ffffff', .35); glowAt(x, y, 90 * b.k, '255,230,250', 420); fx({ add: true, max: .6, draw: (c, q) => { const a = 1 - q; c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 12; k++) { const an = k * T / 12 + q * .6, l = (k % 2 ? 60 : 110) * b.k * ease.out(Math.min(1, q / .25)); c.strokeStyle = `rgba(255,240,255,${a})`; c.lineWidth = k % 2 ? 1.5 : 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(an) * l, y + Math.sin(an) * l); c.stroke(); } c.restore(); } });
      for (let i = 0; i < N(40); i++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(80, 260), vy: Math.sin(a) * rnd(80, 260), drag: .92, max: rnd(.5, .9), r: rnd(3, 6), grow: .1, kind: 'shard', col: ['#ffffff', '#ffd0f0', '#fff0a0'][i % 3], rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: true }); } } });
  reg('Swift', { exec: launch('255,230,120'), impact: S => { const [x, y, b] = at2(S); star(x, y, { size: 18 * b.k, col: '#ffe24a' }); shock(x, y, { r1: 40 * b.k, col: '255,236,150', w: 3 }); sparks(x, y, 12, { cols: ['#ffffff', '#ffe24a'] }); } });
  reg('Pin Missile', { exec: launch('210,240,120', .8), impact: S => { const [x, y, b] = at2(S); star(x, y, { size: 14 * b.k, col: '#c8f04a', ms: 200 }); sparks(x, y, 10, { cols: ['#ffffff', '#c8f04a'] }); } });
  // ---- lightning ----
  reg('Thunder Shock', { impact: S => { const [x, y, b] = at2(S); EX.electric(x, y, b.k * .8); } });
  reg('Thunderbolt', { impact: S => { const [x, y, b] = at2(S); EX.electric(x, y, b.k * 1.4); skyBolts(x, y, 2, 60); flash('#fff6a0', .25); shake(6, 220); scar('scorch', b.wx, b.wy); } });
  reg('Thunder', { exec: S => dim(.35, 1500, '10,10,30'), impact: S => { const [x, y, b] = at2(S); EX.electric(x, y, b.k * 1.8); skyBolts(x, y, 4, 55); pillar(x, b.feet, { w: Math.max(30, b.w * 1.2), h: 260, col: '255,240,140', ms: 500 }); flash('#ffffff', .4); shake(10, 360); scar('scorch', b.wx, b.wy); } });
})();
