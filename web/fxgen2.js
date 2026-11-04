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
  // ======== milestone 3: nine more Johto moves ========
  const healFrame = (S, col, ms) => { const b = body(S); magicCircle(S, col, ms, 1); pillar(b.i, b.feet, { w: 28 * b.k, h: 120, ms: ms * .8, col }); glowAt(b.i, b.j, 40 * b.k, col, ms * .6, .55); return b; };
  // ---- Synthesis: sunbeams fall, leaves spiral up, a green-gold glow ----
  reg('Synthesis', { exec: S => { const b = healFrame(S, '190,240,120', 1200); dim(.25, 1100, '10,30,0');
    for (let n = 0; n < N(26); n++) later(rnd(0, 700), () => spawn({ kind: 'streak', x: b.i + rnd(-50, 50), y: b.j - b.h * 1.4, vx: -20, vy: 220, drag: 1, max: .5, r: 1, a: .7, col: 'rgba(255,240,160,.9)', len: 18, lw: 2, layer: 1 }));
    for (let n = 0; n < N(22); n++) later(rnd(0, 900), () => { const a0 = rnd(0, T); spawn({ kind: 'fn', x: b.i, y: b.feet, max: 1.1, draw: (c, q) => { const a = a0 + q * 7, r = (14 + q * 26) * b.k, x = b.i + Math.cos(a) * r, y = b.feet - q * b.h * 1.2 + Math.sin(a) * r * .3;
      c.save(); c.globalAlpha = 1 - q; c.translate(x, y); c.rotate(a); c.fillStyle = '#7ad04a'; c.beginPath(); c.ellipse(0, 0, 4, 2, 0, 0, T); c.fill(); c.restore(); } }); }); } });
  // ---- Morning Sun: a golden sun rises behind the user ----
  reg('Morning Sun', { exec: S => { const b = healFrame(S, '255,215,120', 1300); dim(.3, 1200, '30,15,0');
    fx({ max: 1.3, draw: (c, q) => { const k = q < .25 ? q / .25 : q > .75 ? (1 - q) / .25 : 1, sx = b.i, sy = b.j - b.h * (.4 + q * .7), r = 18 * b.k; c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(sx, sy, 0, sx, sy, r * 3.2); g.addColorStop(0, `rgba(255,250,210,${.95 * k})`); g.addColorStop(.3, `rgba(255,210,110,${.55 * k})`); g.addColorStop(1, 'rgba(255,160,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(sx, sy, r * 3.2, 0, T); c.fill();
      c.translate(sx, sy); c.rotate(clock.t / 1400); for (let i = 0; i < 10; i++) { c.rotate(T / 10); c.fillStyle = `rgba(255,230,150,${.35 * k})`; c.beginPath(); c.moveTo(r * 1.1, -2); c.lineTo(r * 2.6, 0); c.lineTo(r * 1.1, 2); c.fill(); } c.restore(); } }); } });
  // ---- Milk Drink: pink-white light, hearts and milky droplets ----
  reg('Milk Drink', { exec: S => { const b = healFrame(S, '255,200,225', 1100);
    for (let n = 0; n < N(14); n++) later(rnd(0, 700), () => { const x0 = b.i + rnd(-26, 26) * b.k; spawn({ kind: 'fn', x: x0, y: b.j, max: 1, draw: (c, q) => { c.save(); c.globalAlpha = 1 - q; starShape ? 0 : 0; const x = x0 + Math.sin(q * 6) * 5, y = b.j - q * 50; c.fillStyle = '#ff8ac0'; c.beginPath(); c.moveTo(x, y + 3); c.bezierCurveTo(x - 6, y - 2, x - 3, y - 7, x, y - 3); c.bezierCurveTo(x + 3, y - 7, x + 6, y - 2, x, y + 3); c.fill(); c.restore(); } }); });
    for (let n = 0; n < N(20); n++) later(rnd(0, 600), () => spawn({ kind: 'drop', x: b.i + rnd(-14, 14), y: b.j - b.h * .8, vx: rnd(-40, 40), vy: rnd(-80, -30), ay: 260, drag: .98, max: .7, r: 1.6, a: .95, col: '#fffaf0' })); } });
  // ---- Rollout: the user spins into a rolling disc with a dust trail ----
  reg('Rollout', { exec: S => windup(S, '210,180,120', 35, 18),
    dash: S => { AURA.dust(S); const b = body(S); spawn({ kind: 'fn', x: b.i, y: b.j, max: .12, draw: (c, q) => { const bb = body(S); c.save(); c.strokeStyle = 'rgba(230,200,140,.85)'; c.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const a = clock.t / 50 + i * 2.1; c.beginPath(); c.arc(bb.i, bb.j, 18 * bb.k, a, a + 1.2); c.stroke(); } c.restore(); } }); },
    impact: S => { const h = hit(S, { size: 1.3, shk: 8, col: '230,200,140', star: '#ffe0a0', lines: true }); debris(h.x, h.b.feet, 16); shock(h.x, h.b.feet, { r1: 90, col: '220,190,130', w: 7, squash: .4, ms: 460 }); } });
  // ---- Octazooka: an ink blob that splatters ----
  reg('Octazooka', { exec: S => windup(S, '60,40,90', 270, 16),
    shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.fillStyle = '#2a1e3a'; c.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * T, r = 9 + Math.sin(clock.t / 60 + k * 2) * 2.5; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); c.fillStyle = 'rgba(160,120,220,.6)'; c.beginPath(); c.arc(x - 3, y - 3, 3, 0, T); c.fill(); c.restore();
      if (Math.random() < .6) spawn({ kind: 'drop', x, y, vx: rnd(-30, 30), vy: rnd(-10, 40), ay: 300, drag: .97, max: .4, r: 1.6, a: .9, col: '#2a1e3a' }); },
    impact: S => { const h = hitPt(S); shake(4, 260); for (let n = 0; n < N(26); n++) spawn({ kind: 'drop', x: h.x, y: h.y, vx: rnd(-180, 180), vy: rnd(-200, 40), ay: 520, drag: .97, max: .7, r: rnd(1.5, 3), a: .95, col: rnd(0, 1) < .7 ? '#2a1e3a' : '#5a3a8a' });
      puff(h.x, h.y, 8, { r: [10, 18] }); shock(h.x, h.y, { r1: 60, col: '90,60,140', w: 5, ms: 380 }); } });
  // ---- Cotton Spore: fluffy cotton drifts over and engulfs the target ----
  reg('Cotton Spore', { exec: S => { const a = body(S), t = body(other(S));
    for (let n = 0; n < N(30); n++) later(rnd(0, 600), () => { const x0 = a.i + rnd(-10, 10), y0 = a.j + rnd(-10, 10), tx = t.i + rnd(-26, 26) * t.k, ty = t.j + rnd(-24, 16) * t.k;
      spawn({ kind: 'fn', x: x0, y: y0, max: rnd(1, 1.4), draw: (c, q) => { const e = Math.min(1, q * 1.6), x = x0 + (tx - x0) * e + Math.sin(q * 9) * 6, y = y0 + (ty - y0) * e - Math.sin(e * Math.PI) * 24, r = 3.5 + q * 2;
        c.save(); c.globalAlpha = q > .8 ? (1 - q) / .2 : .95; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(240,240,250,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, T); c.fill(); c.restore(); } }); }); } });
  // ---- Triple Kick: three quick hits ----
  reg('Triple Kick', { dash: S => { AURA.speed(S, '#ffb070'); ghostEvery(S, 55, '#ffa060', 200, .4); },
    impact: S => { const h0 = hitPt(S); for (let k = 0; k < 3; k++) later(k * 120, () => { const x = h0.x + [-14, 12, 0][k], y = h0.y + [-10, 6, -2][k]; star(x, y, { size: 16 + k * 6, col: k === 2 ? '#ffd060' : '#ffb070' }); shock(x, y, { r1: 34 + k * 14, col: '255,190,110', w: 4, ms: 300 }); sparks(x, y, 8, { cols: ['#ffffff', '#ffcf80'], v: [120, 240], grav: 200 }); shake(2 + k * 2, 140); }); } });
  // ---- Present: a wrapped gift box that bursts into confetti ----
  reg('Present', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y), r = 7; c.save(); c.translate(x, y); c.rotate(Math.sin(clock.t / 120) * .3);
      c.fillStyle = '#e8483a'; c.fillRect(-r, -r, r * 2, r * 2); c.fillStyle = '#ffe24a'; c.fillRect(-1.6, -r, 3.2, r * 2); c.fillRect(-r, -1.6, r * 2, 3.2);
      c.beginPath(); c.ellipse(-3, -r - 2, 3, 2, -.5, 0, T); c.ellipse(3, -r - 2, 3, 2, .5, 0, T); c.fill(); c.restore(); },
    impact: S => { const h = hitPt(S); flash('255,240,200', .25); for (let n = 0; n < N(36); n++) spawn({ kind: 'shard', x: h.x, y: h.y, vx: rnd(-200, 200), vy: rnd(-240, -40), ay: 380, drag: .97, max: rnd(.6, 1), r: rnd(1.6, 2.6), a: 1, col: ['#ff5a5a', '#ffd84a', '#5ad0ff', '#7ae07a', '#ff8ad0'][n % 5], rot: rnd(0, T), vr: rnd(-10, 10) });
      star(h.x, h.y, { size: 24, col: '#ffe080' }); shock(h.x, h.y, { r1: 64, col: '255,230,150', w: 5, ms: 380 }); } });
  // ---- Rapid Spin: a spinning shell vortex and a sparking strike ----
  reg('Rapid Spin', { exec: S => { const b = body(S); spawn({ kind: 'fn', x: b.i, y: b.j, max: .5, draw: (c, q) => { const bb = body(S); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const a = clock.t / 40 + i * T / 4; c.strokeStyle = `rgba(220,230,255,${.7 * (1 - q)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(bb.i, bb.j, 22 * bb.k, 8 * bb.k, 0, a, a + 1); c.stroke(); } c.restore(); } }); },
    dash: S => { AURA.speed(S, '#e0e8ff'); ghostEvery(S, 50, '#d0dcff', 200, .4); },
    impact: S => { const h = hit(S, { shk: 4, col: '220,230,255', star: '#ffffff' }); sparks(h.x, h.y, 18, { cols: ['#ffffff', '#cfd8ff'], v: [160, 320], grav: 220 }); } });

  // ---- Fury Cutter: three escalating green slashes ----
  reg('Fury Cutter', {
    dash: S => { AURA.speed(S, '#c8f080'); ghostEvery(S, 60, '#b8e070', 200, .35); },
    impact: S => { try { PFX4.slashSet(S, [[-26, -18, 24, 14, 8], [24, -20, -24, 16, -8], [-34, -4, 36, 0, 14]], { core: '#ffffff', edge: 'rgba(170,230,110,.95)', glow: 'rgba(150,220,90,A)', w: 12, starCol: '#d8ff7a', gap: 90, heavy: .5 }); } catch (e) { } }
  });
})();
