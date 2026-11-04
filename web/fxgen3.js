/* =====================================================================
   Section 37: Hoenn (Gen 3) move effects — the same cinematic standard,
   built on the shared toolkit (FXK) and particle engine (PFX).
   ===================================================================== */
(function hoennMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt, skyBolts } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const o = Object.assign({}, MFX[n] || {});
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; } MFX[n] = o; } };
  const slash = (S, strokes, o) => { try { PFX4.slashSet(S, strokes, o); } catch (e) { } };

  // ---- Blaze Kick: a flaming spinning-kick arc ----
  reg('Blaze Kick', { exec: S => windup(S, '255,150,60', 25, 24), dash: S => { AURA.flame(S); ghostEvery(S, 55, '#ff8a3a', 220, .45); },
    impact: S => { const h = hit(S, { size: 1.3, shk: 7, col: '255,180,90', star: '#ffb040', lines: true }); ribbon(arcPath(h.x, h.y, 30, -2.6, .2, .6), { w: 10, ms: 320, core: '#fff2c0', edge: '#ff7a2a', glow: 'rgba(255,120,40,A)', head: .7 });
      EX.fire(h.x, h.y, 1.1); sparks(h.x, h.y, 24, { cols: ['#ffe080', '#ff8a3a', '#ff4a2a'], v: [140, 320], grav: -30 }); } });
  // ---- Leaf Blade: arm-blade slashes with green crescents and leaves ----
  reg('Leaf Blade', { dash: S => { AURA.speed(S, '#8ae05a'); ghostEvery(S, 55, '#7ad04a', 220, .45); },
    impact: S => { const h = hitPt(S); slash(S, [[-36, -26, 32, 20, 14], [34, -24, -30, 18, -12]], { core: '#f4ffe0', edge: 'rgba(110,210,70,.95)', glow: 'rgba(90,190,60,A)', w: 15, starCol: '#c8ff7a', heavy: .6 });
      for (let n = 0; n < N(18); n++) { const a = rnd(0, T); spawn({ kind: 'fn', x: h.x, y: h.y, max: .8, draw: (c, q) => { const r = 10 + q * 46, x = h.x + Math.cos(a + q * 3) * r, y = h.y + Math.sin(a + q * 3) * r * .5;
        c.save(); c.globalAlpha = 1 - q; c.translate(x, y); c.rotate(a + q * 6); c.fillStyle = '#6cc040'; c.beginPath(); c.ellipse(0, 0, 4, 1.8, 0, 0, T); c.fill(); c.restore(); } }); } } });
  // ---- Muddy Water: a brown surging wave with mud droplets ----
  reg('Muddy Water', { exec: S => { const a = body(S), t = body(other(S)); dim(.25, 900, '30,20,0');
      for (let k = 0; k < 3; k++) later(k * 110, () => ribbon(linePath(a.i, a.feet - 6 - k * 8, t.i, t.feet - 6 - k * 8, -18 - k * 6), { w: 16 - k * 4, ms: 520, core: '#d8c49a', edge: '#7a5a30', glow: 'rgba(140,100,50,A)', head: .4 }));
      for (let n = 0; n < N(30); n++) later(rnd(0, 400), () => { const f = rnd(0, 1); spawn({ kind: 'drop', x: a.i + (t.i - a.i) * f, y: a.feet + (t.feet - a.feet) * f - 10, vx: rnd(-40, 40), vy: rnd(-140, -60), ay: 420, drag: .98, max: .6, r: rnd(1.5, 3), a: .95, col: rnd(0, 1) < .6 ? '#6a4a24' : '#9a7a4a' }); }); },
    impact: S => { const h = hitPt(S); EX.water(h.x, h.y, .9); shock(h.x, h.b.feet, { r1: 84, col: '150,110,60', w: 6, squash: .4, ms: 460 }); } });
  // ---- Psycho Boost: a pink-violet spiral charge, then psychic rings ----
  reg('Psycho Boost', { exec: S => { const b = body(S); dim(.45, 1200, '20,0,30'); magicCircle(S, '230,120,255', 1100, 1.3); windup(S, '230,140,255', 290, 36);
      for (let k = 0; k < 4; k++) later(k * 80, () => ribbon(arcPath(b.i, b.j, 20 * b.k + k * 7, k * 1.5, k * 1.5 + T * .9, .5), { w: 6, ms: 460, core: '#ffffff', edge: '#e070ff', glow: 'rgba(220,100,255,A)' })); },
    impact: S => { const h = hitPt(S); flash('240,180,255', .55); shake(9, 460); EX.psychic(h.x, h.y, 1.5);
      for (let k = 0; k < 5; k++) later(k * 70, () => shock(h.x, h.y, { r1: 60 + k * 30, col: k % 2 ? '255,120,220' : '200,120,255', w: 6 - k * .8, ms: 520 })); } });
  // ---- Doom Desire: starlight falls from above, then a steel-gold blast ----
  reg('Doom Desire', { exec: S => { magicCircle(S, '255,235,150', 1100, 1.1); dim(.4, 1300, '0,0,20'); const b = body(S); glowAt(b.i, b.j - b.h * .9, 20 * b.k, '255,240,170', 900, .8); },
    impact: S => { const h = hitPt(S); pillar(h.x, h.b.feet, { w: 52 * h.b.k, h: 260, ms: 900, col: '255,240,180' }); flash('255,250,220', .55); shake(10, 520);
      later(120, () => { EX.psychic(h.x, h.y, 1.2); shock(h.x, h.b.feet, { r1: 140, col: '255,230,140', w: 9, squash: .4, ms: 560 }); sparks(h.x, h.y, 40, { cols: ['#ffffff', '#fff2a0', '#c8d8ff'], v: [180, 420], grav: 80 }); }); } });
  // ---- Water Spout: a geyser erupts under the target ----
  reg('Water Spout', { exec: S => { const b = body(S); windup(S, '120,190,255', 210, 30); pillar(b.i, b.feet, { w: 26 * b.k, h: 140, ms: 600, col: '150,210,255' }); },
    impact: S => { const h = hitPt(S), b = h.b; shake(8, 520); pillar(b.i, b.feet, { w: 50 * b.k, h: 240, ms: 900, col: '140,200,255' }); EX.water(h.x, h.y, 1.4);
      for (let n = 0; n < N(50); n++) later(rnd(0, 500), () => spawn({ kind: 'drop', x: b.i + rnd(-20, 20) * b.k, y: b.feet, vx: rnd(-90, 90), vy: rnd(-420, -260), ay: 600, drag: .99, max: 1.1, r: rnd(1.5, 3), a: .9, col: rnd(0, 1) < .6 ? '#bfe2ff' : '#5aa8ff' }));
      shock(h.x, b.feet, { r1: 130, col: '140,200,255', w: 8, squash: .4, ms: 600 }); } });
  // ---- Eruption: the ground cracks into a volcanic blast ----
  reg('Eruption', { exec: S => { windup(S, '255,110,40', 15, 34); dim(.4, 1100, '40,5,0'); const b = body(S); glowAt(b.i, b.feet, 50 * b.k, '255,120,40', 700, .7); },
    impact: S => { const h = hitPt(S), b = h.b; flash('255,170,90', .5); shake(11, 600); EX.fire(h.x, h.y, 1.6);
      for (let k = 0; k < 5; k++) later(k * 90, () => pillar(b.i + rnd(-50, 50) * b.k, b.feet + rnd(-6, 6), { w: 22 * b.k, h: 160, ms: 600, col: k % 2 ? '255,170,60' : '255,90,30' }));
      debris(h.x, b.feet, 20, { cols: [['#3a2a24', '#7a3a1a'], ['#2a1a14', '#a04a1a']] }); shock(h.x, b.feet, { r1: 150, col: '255,120,40', w: 10, squash: .4, ms: 620 }); } });
  // ---- Mist Ball: a glowing orb of mist ----
  reg('Mist Ball', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); orb(c, x, y, 11, { core: '255,240,255', mid: '255,170,220', rim: '255,220,240', arcs: 0, pulse: .12 });
      if (Math.random() < .7) spawn({ x, y, vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .96, max: .5, r: rnd(5, 9), grow: .8, a: .35, img: PFX.steamTex() }); },
    impact: S => { const h = hitPt(S); puff(h.x, h.y, 12, { r: [14, 26] }); EX.psychic(h.x, h.y, .8); glowAt(h.x, h.y, 44, '255,180,230', 420, .6); } });
  // ---- Luster Purge: a radiant white-blue burst ----
  reg('Luster Purge', { exec: S => { windup(S, '170,200,255', 220, 28); const b = body(S); glowAt(b.i, b.j, 36 * b.k, '190,215,255', 600, .7); },
    impact: S => { const h = hitPt(S); flash('220,235,255', .45); shake(6, 360); star(h.x, h.y, { size: 36, col: '#dfeaff' }); EX.psychic(h.x, h.y, 1);
      for (let k = 0; k < 3; k++) later(k * 80, () => shock(h.x, h.y, { r1: 70 + k * 30, col: '170,200,255', w: 6, ms: 480 })); } });
  // ---- Sky Uppercut: a rising strike with an upward shockwave ----
  reg('Sky Uppercut', { exec: S => windup(S, '255,200,140', 30, 20), dash: S => { AURA.speed(S, '#ffd0a0'); ghostEvery(S, 55, '#ffc090', 200, .4); },
    impact: S => { const h = hit(S, { size: 1.4, shk: 8, col: '255,220,170', star: '#ffd080', lines: true }); ribbon(linePath(h.x, h.b.feet, h.x + 8, h.y - 70, 6), { w: 13, ms: 320, core: '#ffffff', edge: '#ffb070', glow: 'rgba(255,170,90,A)', head: .8 });
      shock(h.x, h.y - 30, { r1: 70, col: '255,210,150', w: 6, squash: .6, ms: 420 }); speedLines(h.x, h.y, '#ffe0b0', 300, 16); } });
  // ---- Meteor Mash: a comet-like steel fist with a star trail ----
  reg('Meteor Mash', { exec: S => windup(S, '200,220,255', 220, 26),
    dash: S => { AURA.speed(S, '#dfe8ff'); ghostEvery(S, 50, '#c8d8ff', 260, .5); const b = body(S); spawn({ x: b.i, y: b.j, vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .95, max: .4, r: rnd(3, 5), a: .9, img: PFX.whiteTex(), add: true }); },
    impact: S => { const h = hit(S, { size: 1.6, shk: 9, col: '220,230,255', star: '#ffffff', lines: true, fl: .35, flc: '#e8f0ff' }); later(60, () => shock(h.x, h.y, { r1: 120, col: '200,220,255', w: 8, ms: 500 }));
      for (let n = 0; n < N(16); n++) spawn({ kind: 'fn', x: h.x, y: h.y, max: .7, draw: (c, q) => { const a = n * 1.3, r = q * 60; c.save(); c.globalAlpha = 1 - q; c.fillStyle = '#fff6c8'; c.translate(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r); c.rotate(q * 6);
        c.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 1.6 : 4; c.lineTo(Math.cos(k * T / 10) * rr, Math.sin(k * T / 10) * rr); } c.fill(); c.restore(); } }); } });
  // ---- Shadow Punch: a ghostly fist strikes from the shadows ----
  reg('Shadow Punch', { exec: S => { ghost(S, '#5a3a8a', 380, .6); dim(.35, 700, '10,0,25'); }, dash: S => { ghostEvery(S, 45, '#4a2a7a', 300, .55); AURA.smoke(S); },
    impact: S => { const h = hit(S, { size: 1.2, shk: 5, col: '170,120,255', star: '#b08cff' }); EX.ghost(h.x, h.y, .9); shock(h.x, h.y, { r1: 70, col: '120,70,200', w: 6, ms: 420 }); } });
  // ---- Hyper Voice: expanding sound rings ----
  reg('Hyper Voice', { exec: S => { const b = body(S), t = body(other(S)), dir = Math.sign(t.i - b.i) || 1; shake(4, 500);
      for (let k = 0; k < 6; k++) later(k * 70, () => { spawn({ kind: 'fn', x: b.i, y: b.j, max: .55, draw: (c, q) => { const x = b.i + dir * q * Math.abs(t.i - b.i), r = 10 + q * 26; c.save(); c.globalAlpha = (1 - q) * .9; c.strokeStyle = '#fff2c8'; c.lineWidth = 3;
        c.beginPath(); c.ellipse(x, b.j - 4, r * .45, r, 0, dir > 0 ? -1.2 : Math.PI - 1.2, dir > 0 ? 1.2 : Math.PI + 1.2); c.stroke(); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); for (let k = 0; k < 3; k++) later(k * 60, () => shock(h.x, h.y, { r1: 60 + k * 26, col: '255,240,190', w: 5, ms: 380 })); shake(5, 300); } });
  // ---- Overheat: a fire overload, then smoke ----
  reg('Overheat', { exec: S => { const b = body(S); dim(.35, 1100, '40,8,0'); windup(S, '255,120,40', 20, 36); glowAt(b.i, b.j, 50 * b.k, '255,140,60', 700, .8);
      later(500, () => puff(b.i, b.j - b.h * .5, 10, { r: [12, 22] })); },
    impact: S => { const h = hitPt(S); flash('255,190,120', .55); shake(9, 480); EX.fire(h.x, h.y, 1.5); shock(h.x, h.y, { r1: 140, col: '255,150,60', w: 10, ms: 560 });
      sparks(h.x, h.y, 40, { cols: ['#ffffff', '#ffd060', '#ff6a2a'], v: [200, 460], grav: -40 }); } });
  // ---- Shock Wave: an unavoidable zigzag bolt ----
  reg('Shock Wave', { exec: S => { const a = body(S), t = body(other(S)); spawn({ kind: 'fn', x: a.i, y: a.j, max: .35, draw: (c, q) => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,245,150,${1 - q})`; c.lineWidth = 3; c.beginPath(); c.moveTo(a.i, a.j);
      for (let k = 1; k <= 8; k++) { const f = k / 8; c.lineTo(a.i + (t.i - a.i) * f + (k < 8 ? rnd(-12, 12) : 0), a.j + (t.j - a.j) * f + (k < 8 ? rnd(-12, 12) : 0)); } c.stroke(); c.restore(); } }); },
    impact: S => { const h = hitPt(S); EX.electric(h.x, h.y, .9); sparks(h.x, h.y, 22, { cols: ['#ffffff', '#fff27a'], v: [160, 320], grav: 120 }); } });
  // ======== milestone 3: ten more Hoenn moves ========
  // ---- Bullet Seed: a rapid volley of glowing seeds ----
  reg('Bullet Seed', { exec: S => { const a = body(S), t = body(other(S)); for (let k = 0; k < 6; k++) later(k * 70, () => { const y0 = a.j + rnd(-6, 6); spawn({ kind: 'fn', x: a.i, y: y0, max: .32, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = y0 + (t.j - y0) * q; c.save(); c.fillStyle = '#9ad84a'; c.strokeStyle = '#4a7a1a'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 3.6, 2.6, Math.atan2(t.j - y0, t.i - a.i), 0, T); c.fill(); c.stroke(); c.restore(); } }); later(320, () => sparks(t.i + rnd(-8, 8), t.j + rnd(-8, 8), 5, { cols: ['#c8ff8a', '#7ad04a'], v: [80, 180], grav: 200 })); }); },
    impact: S => { const h = hitPt(S); shake(4, 400); } });
  // ---- Magical Leaf: shimmering leaves that home in ----
  reg('Magical Leaf', { exec: S => { const a = body(S), t = body(other(S)); for (let n = 0; n < N(10); n++) later(n * 50, () => { const a0 = rnd(0, T); spawn({ kind: 'fn', x: a.i, y: a.j, max: .7, draw: (c, q) => { const e = q * q, x = a.i + (t.i - a.i) * e + Math.cos(a0 + q * 8) * 18 * (1 - q), y = a.j + (t.j - a.j) * e + Math.sin(a0 + q * 8) * 18 * (1 - q);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `hsla(${(n * 36 + q * 200) % 360},90%,70%,.9)`; c.translate(x, y); c.rotate(q * 9); c.beginPath(); c.ellipse(0, 0, 4.5, 2, 0, 0, T); c.fill(); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); sparks(h.x, h.y, 16, { cols: ['#ffffff', '#c8ff8a', '#ff9ad0'], v: [100, 240], grav: 40 }); glowAt(h.x, h.y, 36, '200,255,160', 360, .5); } });
  // ---- Rock Tomb: boulders slam down around the target ----
  reg('Rock Tomb', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.translate(x, y); c.rotate(clock.t / 140); c.fillStyle = '#8a7a5a'; c.strokeStyle = '#4a3a24'; c.lineWidth = 1.3; c.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * T, r = 8 + (k % 2) * 2.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.restore(); },
    impact: S => { const h = hitPt(S), b = h.b; for (let k = 0; k < 4; k++) later(k * 80, () => { const x = b.i + [-26, 24, -10, 14][k] * b.k; debris(x, b.feet, 6); shock(x, b.feet, { r1: 30, col: '170,150,110', w: 4, squash: .4, ms: 300 }); shake(3 + k, 160); }); } });
  // ---- Water Pulse: a pulsing ring of water ----
  reg('Water Pulse', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y), q = (clock.t % 300) / 300; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(140,210,255,.9)'; c.lineWidth = 2.5; for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(x, y, 6 + ((q + k / 2) % 1) * 9, 0, T); c.stroke(); } c.fillStyle = 'rgba(200,235,255,.9)'; c.beginPath(); c.arc(x, y, 4, 0, T); c.fill(); c.restore(); },
    impact: S => { const h = hitPt(S); EX.water(h.x, h.y, .8); for (let k = 0; k < 3; k++) later(k * 70, () => shock(h.x, h.y, { r1: 40 + k * 20, col: '140,210,255', w: 4, ms: 360 })); } });
  // ---- Heat Wave: a rolling wall of shimmering heat ----
  reg('Heat Wave', { exec: S => { const a = body(S), t = body(other(S)); dim(.25, 900, '40,10,0');
      for (let k = 0; k < 4; k++) later(k * 90, () => ribbon(linePath(a.i, a.j - 14 + k * 9, t.i, t.j - 14 + k * 9, (k - 1.5) * 16), { w: 12, ms: 520, core: '#fff0c0', edge: '#ff7a2a', glow: 'rgba(255,120,40,A)', head: .4 }));
      for (let n = 0; n < N(24); n++) later(rnd(0, 400), () => { const f = rnd(0, 1); spawn({ x: a.i + (t.i - a.i) * f, y: a.j + (t.j - a.j) * f + rnd(-20, 20), vx: rnd(-10, 10), vy: rnd(-50, -20), drag: 1, max: .7, r: rnd(3, 6), grow: .5, a: .7, img: PFX.hueTex(rnd(15, 40), 100, 60), add: true }); }); },
    impact: S => { const h = hitPt(S); EX.fire(h.x, h.y, .9); shock(h.x, h.y, { r1: 80, col: '255,150,60', w: 6, ms: 420 }); } });
  // ---- Air Cutter: two whirling blades of air ----
  reg('Air Cutter', { exec: S => { const a = body(S), t = body(other(S)); for (let k = 0; k < 2; k++) later(k * 120, () => spawn({ kind: 'fn', x: a.i, y: a.j, max: .45, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = a.j - 8 + k * 16 + (t.j - a.j) * q; c.save(); c.translate(x, y); c.rotate(clock.t / 40); c.strokeStyle = 'rgba(225,240,255,.95)'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(0, 0, 10, 0, 2.2); c.stroke(); c.beginPath(); c.arc(0, 0, 10, Math.PI, Math.PI + 2.2); c.stroke(); c.restore(); } })); },
    impact: S => { const h = hitPt(S); slash(S, [[-26, -16, 24, 12, 8], [24, -18, -22, 14, -8]], { core: '#ffffff', edge: 'rgba(200,225,255,.95)', glow: 'rgba(180,210,255,A)', w: 10, starCol: '#ffffff' }); } });
  // ---- Poison Fang: venom-dripping fangs ----
  reg('Poison Fang', { dash: S => { AURA.speed(S, '#c080ff'); ghostEvery(S, 60, '#a060e0', 200, .4); },
    impact: S => { const h = hitPt(S); try { PFX3.jaws(S, { col: '#e8c8ff', glow: 'rgba(170,90,230,A)' }); } catch (e) { star(h.x, h.y, { size: 22, col: '#c080ff' }); } try { EX.poison(h.x, h.y, .8); } catch (e) { }
      for (let n = 0; n < N(16); n++) spawn({ kind: 'drop', x: h.x + rnd(-10, 10), y: h.y, vx: rnd(-40, 40), vy: rnd(-60, 20), ay: 380, drag: .98, max: .6, r: rnd(1.4, 2.4), a: .95, col: '#a050e0' }); } });
  // ---- Needle Arm: a spiked fist ----
  reg('Needle Arm', { dash: S => { AURA.speed(S, '#9ad84a'); ghostEvery(S, 55, '#7ac040', 220, .4); },
    impact: S => { const h = hit(S, { size: 1.2, shk: 5, col: '200,255,150', star: '#b8f070' }); for (let k = 0; k < 10; k++) { const a = k / 10 * T; spawn({ kind: 'streak', x: h.x, y: h.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, drag: .9, max: .25, r: 1, a: .95, col: 'rgba(170,230,110,.95)', len: 9, lw: 2, layer: 1 }); } } });
  // ---- Arm Thrust: a flurry of open-palm strikes ----
  reg('Arm Thrust', { dash: S => { AURA.speed(S, '#ffd0a0'); ghostEvery(S, 55, '#ffc090', 200, .4); },
    impact: S => { const h0 = hitPt(S); for (let k = 0; k < 4; k++) later(k * 90, () => { const x = h0.x + rnd(-14, 14), y = h0.y + rnd(-12, 8); star(x, y, { size: 14 + k * 3, col: '#ffd090' }); shock(x, y, { r1: 30, col: '255,210,150', w: 3, ms: 240 }); shake(2 + k, 120); }); } });
  // ---- Weather Ball: a ball that takes the colour of the sky ----
  reg('Weather Ball', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y), w = G && G.rules && G.rules.weather, col = w === 'sun' ? '255,170,60' : w === 'rain' ? '110,180,255' : w === 'hail' ? '200,235,255' : w === 'sand' ? '210,180,120' : '240,240,255';
      orb(c, x, y, 11, { core: '255,255,255', mid: col, rim: col, arcs: 0, pulse: .15 }); },
    impact: S => { const h = hitPt(S), w = G && G.rules && G.rules.weather; (w === 'sun' ? EX.fire : w === 'rain' ? EX.water : w === 'hail' ? EX.ice : EX.psychic)(h.x, h.y, 1); shock(h.x, h.y, { r1: 70, col: '230,230,255', w: 5, ms: 380 }); } });
  // ---- Silver Wind: shimmering silver scales on the wind ----
  reg('Silver Wind', { exec: S => { const a = body(S), t = body(other(S));
      for (let k = 0; k < 3; k++) later(k * 90, () => ribbon(linePath(a.i, a.j - 8 + k * 8, t.i, t.j - 8 + k * 8, (k - 1) * 24), { w: 6, ms: 500, core: '#ffffff', edge: '#cfd8e8', glow: 'rgba(210,220,240,A)', head: .5 }));
      for (let n = 0; n < N(34); n++) later(rnd(0, 400), () => { const f = rnd(0, 1); spawn({ kind: 'shard', x: a.i + (t.i - a.i) * f, y: a.j + (t.j - a.j) * f + rnd(-18, 18), vx: (t.i - a.i) * .6, vy: rnd(-30, 30), drag: .97, max: .6, r: rnd(1.2, 2), a: .95, col: rnd(0, 1) < .5 ? '#ffffff' : '#c8d4e8', rot: rnd(0, T), vr: rnd(-10, 10) }); }); },
    impact: S => { const h = hitPt(S); sparks(h.x, h.y, 18, { cols: ['#ffffff', '#dfe6f4'], v: [120, 280], grav: 60 }); shock(h.x, h.y, { r1: 60, col: '220,228,240', w: 4, ms: 380 }); } });
})();
