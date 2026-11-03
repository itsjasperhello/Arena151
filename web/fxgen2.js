/* =====================================================================
   Section 34: Johto (Gen 2) move effects — same cinematic standard as the
   rest: wind-ups, trails, typed explosions, shockwaves, debris and light,
   built on the shared toolkit (FXK) and particle engine (PFX).
   ===================================================================== */
(function johtoMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt, skyBolts, featherBurst, starShape } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  const rainbow = ['255,90,90', '255,170,60', '255,235,90', '110,230,120', '90,180,255', '190,120,255'];

  // ---- Sacred Fire (Ho-Oh): a rainbow-gold rite, then a sacred pillar of flame on the target ----
  reg('Sacred Fire', {
    exec: S => { const b = body(S); dim(.35, 1300, '30,10,0'); magicCircle(S, '255,210,110', 1200, 1.2); pillar(b.i, b.feet, { w: 34 * b.k, h: 150, ms: 900, col: '255,220,140' });
      for (let k = 0; k < 6; k++) later(k * 70, () => shock(b.i, b.feet - 4, { r0: 8, r1: 46 * b.k + k * 6, col: rainbow[k], w: 4, ms: 520, squash: .38 }));
      for (let n = 0; n < N(40); n++) later(rnd(0, 500), () => spawn({ x: b.i + rnd(-20, 20) * b.k, y: b.feet, vx: rnd(-14, 14), vy: rnd(-150, -80), drag: .97, max: rnd(.6, 1), r: rnd(5, 10), grow: .6, a: .9, img: PFX.hueTex(rnd(10, 45), 100, 60), add: true })); },
    impact: (S, mv, crit) => { const h = hitPt(S); flash('255,230,170', .45); shake(7, 380); pillar(h.x, h.b.feet, { w: 46 * h.b.k, h: 220, ms: 1000, col: '255,200,90' });
      EX.fire(h.x, h.y, 1.4); for (let k = 0; k < 6; k++) later(k * 60, () => shock(h.x, h.b.feet, { r0: 10, r1: 90 + k * 14, col: rainbow[k], w: 5, ms: 560, squash: .4 }));
      sparks(h.x, h.y, 34, { cols: ['#fff6c0', '#ffd060', '#ff8a3a'], v: [140, 360], grav: -40 }); star(h.x, h.y, { size: 34, col: '#ffe080' }); }
  });
  // ---- Aeroblast (Lugia): a silver-blue vortex wind-up and a spiralling air blast ----
  reg('Aeroblast', {
    exec: S => { const b = body(S); windup(S, '200,225,255', null, 30); speedLines(b.i, b.j, '#dfeeff', 520, 32); dim(.3, 1000, '0,10,30');
      for (let k = 0; k < 3; k++) later(k * 90, () => ribbon(arcPath(b.i, b.j, 26 * b.k + k * 8, k * 2, k * 2 + T * .9, .5), { w: 6, ms: 420, core: '#ffffff', edge: '#a8d2ff', glow: 'rgba(150,200,255,A)' })); },
    impact: S => { const h = hitPt(S); flash('220,235,255', .4); shake(6, 340);
      for (let k = 0; k < 4; k++) later(k * 55, () => ribbon(arcPath(h.x, h.y, 18 + k * 12, k * 1.6, k * 1.6 + T * .85, .55), { w: 7 - k, ms: 460, core: '#ffffff', edge: '#9cc8ff', glow: 'rgba(140,190,255,A)' }));
      shock(h.x, h.y, { r1: 92, col: '200,230,255', w: 7, ms: 460 }); try { featherBurst(h.x, h.y, 14); } catch (e) { } sparks(h.x, h.y, 22, { cols: ['#ffffff', '#cfe6ff'], v: [160, 360], grav: 60 }); }
  });
  // ---- Megahorn: a green charge, a horn-thrust streak, a huge impact ----
  reg('Megahorn', {
    exec: S => windup(S, '170,240,110', 95, 28),
    dash: S => { AURA.speed(S, '#c8f080'); AURA.hue(S, 95, 120, .8); ghostEvery(S, 55, '#b8f070', 240, .45); },
    impact: S => { const h = hit(S, { size: 1.45, shk: 8, col: '200,255,140', star: '#d8ff7a', lines: true, fl: .3, flc: '#eaffd0' });
      const a = side(other(S)), dir = Math.sign(side(S).x - a.x) || 1; ribbon(linePath(h.x - dir * 70, h.y - 6, h.x + dir * 16, h.y + 2, 0), { w: 14, ms: 300, core: '#ffffff', edge: '#a8ec60', glow: 'rgba(170,240,100,A)', head: .8 });
      later(80, () => shock(h.x, h.y, { r1: 110, col: '190,255,120', w: 9, ms: 480 })); debris(h.x, h.b.feet, 12, { cols: [['#6b8a3a', '#a8c870'], ['#556b2f', '#8aa860']] }); try { EX.bug && EX.bug(h.x, h.y, 1.2); } catch (e) { } }
  });
  // ---- Steel Wing: a metallic trail and two gleaming wing slashes ----
  reg('Steel Wing', {
    exec: S => windup(S, '220,230,245'),
    dash: S => { AURA.speed(S, '#e6eef8'); ghostEvery(S, 60, '#d8e4f4', 230, .45); },
    impact: S => { const h = hitPt(S); try { PFX4.slashSet(S, [[-38, -24, 34, 16, 14], [38, -24, -34, 16, -14]], { core: '#ffffff', edge: 'rgba(205,220,240,.95)', glow: 'rgba(190,210,240,A)', w: 15, starCol: '#ffffff', heavy: .6 }); } catch (e) { }
      sparks(h.x, h.y, 26, { cols: ['#ffffff', '#cfd8e8', '#ffe8a0'], v: [180, 380], grav: 260, len: 12 }); shock(h.x, h.y, { r1: 70, col: '220,230,245', w: 5, ms: 360 }); shake(4, 240); }
  });
  // ---- Dynamic Punch: an orange charge, a giant fist impact, confusion stars ----
  reg('Dynamic Punch', {
    exec: S => { windup(S, '255,170,80', 28, 30); const b = body(S); glowAt(b.i, b.j, 30 * b.k, '255,150,60', 500, .6); },
    dash: S => { AURA.speed(S, '#ffb060'); AURA.flame(S); ghostEvery(S, 55, '#ffa050', 240, .45); },
    impact: S => { const h = hit(S, { size: 1.7, shk: 10, col: '255,190,110', star: '#ffb040', lines: true, fl: .45, flc: '#fff0d0' });
      for (let k = 0; k < 2; k++) later(k * 110, () => shock(h.x, h.y, { r1: 100 + k * 40, col: k ? '255,140,60' : '255,220,150', w: 9 - k * 3, ms: 520 }));
      EX.fire(h.x, h.y, .8); debris(h.x, h.b.feet, 14);
      fx({ max: 1.6, draw: (c, q) => { for (let i = 0; i < 4; i++) { const a = q * 11 + i * T / 4, b = body(S); c.globalAlpha = q < .8 ? 1 : (1 - q) / .2; starShape(c, b.i + Math.cos(a) * 20 * b.k, b.j - b.h * .55 + Math.sin(a) * 6, 5, i % 2 ? '#ffe24a' : '#ff9ad0'); } c.globalAlpha = 1; } }); }
  });
  // ---- Zap Cannon: a crackling electric sphere, then a thunderous blast ----
  reg('Zap Cannon', {
    exec: S => { const b = body(S); windup(S, '255,240,120', 52, 30); dim(.32, 1000, '10,10,0'); glowAt(b.i, b.j, 34 * b.k, '255,240,120', 600, .7); },
    shot: p => { const c = bctx, x = bx(p.x), y = by(p.y);
      orb(c, x, y, 13, { core: '255,255,240', mid: '255,230,80', rim: '255,250,180', arcs: 5, pulse: .14 });
      if (Math.random() < .6) spawn({ kind: 'streak', x, y, vx: rnd(-120, 120), vy: rnd(-120, 120), drag: .9, max: .15, r: 1, a: .9, col: 'rgba(255,245,150,.95)', len: 9, lw: 1.4, layer: 1 }); },
    impact: S => { const h = hitPt(S); flash('255,250,190', .5); shake(8, 420); EX.electric(h.x, h.y, 1.4); try { skyBolts(h.x, h.y, 4, 60); } catch (e) { }
      shock(h.x, h.y, { r1: 120, col: '255,240,120', w: 8, ms: 500 }); sparks(h.x, h.y, 36, { cols: ['#ffffff', '#fff27a', '#ffd640'], v: [180, 420], grav: 120 }); }
  });
  // ---- Ancient Power: rocks rise in a golden aura and fly as a glowing boulder ----
  reg('Ancient Power', {
    exec: S => { const b = body(S); glowAt(b.i, b.j, 40 * b.k, '255,215,140', 700, .5); magicCircle(S, '230,190,110', 900, 1);
      for (let n = 0; n < N(10); n++) { const a = rnd(0, T), r = rnd(22, 40) * b.k; spawn({ kind: 'chunk', x: b.i + Math.cos(a) * r, y: b.feet - rnd(0, 6), vx: 0, vy: rnd(-90, -50), drag: .96, max: .8, r: rnd(3, 5), a: 1, col: rnd(0, 1) < .5 ? '#a8946a' : '#c8b080', rot: rnd(0, T), vr: rnd(-4, 4) }); } },
    shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, 18); g.addColorStop(0, 'rgba(255,230,160,.8)'); g.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 18, 0, T); c.fill(); c.restore();
      c.save(); c.translate(x, y); c.rotate(clock.t / 120); c.fillStyle = '#9a8458'; c.strokeStyle = '#ffe0a0'; c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * T, r = 7 + (k % 2) * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.restore();
      if (Math.random() < .5) spawn({ x, y, vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .95, max: .35, r: rnd(2, 4), a: .7, img: PFX.hueTex(40, 90, 70), add: true }); },
    impact: S => { const h = hitPt(S); shake(6, 340); try { EX.rock ? EX.rock(h.x, h.y, 1.2) : debris(h.x, h.b.feet, 16); } catch (e) { debris(h.x, h.b.feet, 16); }
      shock(h.x, h.y, { r1: 90, col: '255,215,140', w: 6, ms: 460 }); glowAt(h.x, h.y, 50, '255,215,140', 380, .6); debris(h.x, h.b.feet, 10); }
  });
  // ---- Faint Attack: the user melts into shadow and strikes from nowhere ----
  reg('Faint Attack', {
    exec: S => { const b = body(S); ghost(S, '#6a4a9a', 420, .7); dim(.4, 900, '10,0,20'); puff(b.i, b.j, 10, { r: [10, 18] }); },
    dash: S => { ghostEvery(S, 45, '#5a3a8a', 300, .55); AURA.smoke(S); },
    impact: S => { const h = hitPt(S); try { PFX4.slashSet(S, [[-30, -26, 30, 18, 10]], { core: '#f0e0ff', edge: 'rgba(120,70,180,.95)', glow: 'rgba(90,40,160,A)', w: 16, starCol: '#b48cff', heavy: .4 }); } catch (e) { }
      shock(h.x, h.y, { r1: 80, col: '120,70,200', w: 6, ms: 420 }); try { EX.ghost(h.x, h.y, .8); } catch (e) { } shake(5, 260); }
  });
  // ---- Pursuit: a fast dark dash and a claw ----
  reg('Pursuit', {
    dash: S => { const b = body(S); speedLines(b.i, b.j, '#8a6ac0', 300, 18); ghostEvery(S, 40, '#4a2a7a', 220, .5); AURA.speed(S, '#9a7ad0'); },
    impact: S => { const h = hitPt(S); try { PFX4.slashSet(S, [[-24, -20, 22, 14, 8], [-14, 4, 26, -12, -6]], { core: '#ffffff', edge: 'rgba(110,70,170,.95)', glow: 'rgba(90,50,150,A)', w: 11, starCol: '#a080ff' }); } catch (e) { } shake(3, 200); }
  });
  // ---- Icy Wind: frosty gust ribbons carrying snow, then a frost ring ----
  reg('Icy Wind', {
    exec: S => { const a = body(S), b = body(other(S)); for (let k = 0; k < 4; k++) later(k * 80, () => ribbon(linePath(a.i, a.j - 6 + k * 6, b.i, b.j - 6 + k * 6, (k - 1.5) * 22), { w: 7, ms: 520, core: '#ffffff', edge: '#bfe8ff', glow: 'rgba(170,220,255,A)', head: .5 }));
      for (let n = 0; n < N(36); n++) later(rnd(0, 360), () => { const f = rnd(0, 1); spawn({ x: a.i + (b.i - a.i) * f, y: a.j + (b.j - a.j) * f + rnd(-18, 18), vx: (b.i - a.i) * .8, vy: rnd(-20, 20), drag: .96, max: rnd(.35, .6), r: rnd(1.5, 3), a: .9, img: PFX.whiteTex(), add: true }); }); },
    impact: S => { const h = hitPt(S); EX.ice(h.x, h.y, .9); shock(h.x, h.b.feet, { r1: 80, col: '200,235,255', w: 5, squash: .4, ms: 520 }); sparks(h.x, h.y, 18, { cols: ['#ffffff', '#cfefff'], v: [100, 260], grav: 160 }); }
  });
  // ---- Spark: an electric charge and a crackling tackle ----
  reg('Spark', {
    exec: S => windup(S, '255,240,120', 52, 20),
    dash: S => { AURA.elec(S); ghostEvery(S, 60, '#fff07a', 220, .4); },
    impact: S => { const h = hit(S, { shk: 5, col: '255,245,170', star: '#fff27a' }); EX.electric(h.x, h.y, .7); sparks(h.x, h.y, 22, { cols: ['#ffffff', '#fff27a'], v: [160, 340], grav: 140 }); }
  });
  // ---- Twister: a spinning dragon tornado lifts the target ----
  reg('Twister', {
    exec: S => windup(S, '180,140,255', 265, 22),
    impact: S => { const h = hitPt(S), b = h.b; shake(5, 600);
      fx({ max: 1.1, add: true, draw: (c, q) => { const k = q < .2 ? q / .2 : q > .75 ? (1 - q) / .25 : 1; c.save(); c.globalCompositeOperation = 'lighter';
        for (let r = 0; r < 7; r++) { const y = b.feet - r * b.h * .2, rad = (10 + r * 6) * b.k, a0 = clock.t / 90 + r; c.strokeStyle = `rgba(${r % 2 ? '170,130,255' : '120,200,255'},${.65 * k})`; c.lineWidth = 3 - r * .25;
          c.beginPath(); c.ellipse(b.i, y, rad, rad * .3, 0, a0, a0 + T * .7); c.stroke(); } c.restore(); } });
      for (let n = 0; n < N(18); n++) later(rnd(0, 700), () => spawn({ x: b.i + rnd(-24, 24) * b.k, y: b.feet, vx: rnd(-40, 40), vy: rnd(-180, -100), drag: .97, max: rnd(.5, .8), r: rnd(2, 4), a: .9, img: PFX.hueTex(rnd(250, 280), 90, 70), add: true }));
      try { EX.dragon(h.x, h.y, .7); } catch (e) { } }
  });
  // ---- Moonlight: a glowing moon over the user, silver motes falling ----
  reg('Moonlight', {
    exec: S => { const b = body(S); dim(.45, 1400, '5,8,30'); magicCircle(S, '210,220,255', 1300, 1.1); pillar(b.i, b.feet, { w: 30 * b.k, h: 130, ms: 1100, col: '220,230,255' });
      fx({ max: 1.4, add: true, draw: (c, q) => { const k = q < .2 ? q / .2 : q > .75 ? (1 - q) / .25 : 1, mx = b.i, my = b.j - b.h * 1.1, r = 16 * b.k; c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(mx, my, 0, mx, my, r * 3); g.addColorStop(0, `rgba(240,245,255,${.9 * k})`); g.addColorStop(.35, `rgba(200,215,255,${.5 * k})`); g.addColorStop(1, 'rgba(160,180,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(mx, my, r * 3, 0, T); c.fill();
        c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(250,250,255,${k})`; c.beginPath(); c.arc(mx, my, r, 0, T); c.fill(); c.fillStyle = `rgba(20,24,60,${.85 * k})`; c.beginPath(); c.arc(mx + r * .45, my - r * .2, r * .85, 0, T); c.fill(); c.restore(); } });
      for (let n = 0; n < N(36); n++) later(rnd(0, 900), () => spawn({ x: b.i + rnd(-30, 30) * b.k, y: b.j - b.h, vx: rnd(-8, 8), vy: rnd(30, 60), drag: 1, max: rnd(.8, 1.2), r: rnd(1.5, 3), a: .9, img: PFX.whiteTex(), add: true })); }
  });
  // ---- Fury Cutter: three escalating green slashes ----
  reg('Fury Cutter', {
    dash: S => { AURA.speed(S, '#c8f080'); ghostEvery(S, 60, '#b8e070', 200, .35); },
    impact: S => { try { PFX4.slashSet(S, [[-26, -18, 24, 14, 8], [24, -20, -24, 16, -8], [-34, -4, 36, 0, 14]], { core: '#ffffff', edge: 'rgba(170,230,110,.95)', glow: 'rgba(150,220,90,A)', w: 12, starCol: '#d8ff7a', gap: 90, heavy: .5 }); } catch (e) { } }
  });
})();
