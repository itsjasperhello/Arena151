/* =====================================================================
   Section 39: Sinnoh (Gen 4) move effects — legendary signatures get
   full cinematics; built on the shared toolkit (FXK) and particles (PFX).
   ===================================================================== */
(function sinnohMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const o = Object.assign({}, MFX[n] || {});
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; } MFX[n] = o; } };
  const slash = (S, strokes, o) => { try { PFX4.slashSet(S, strokes, o); } catch (e) { } };
  const ring = (x, y, r, col, ms, w) => spawn({ kind: 'fn', x, y, max: ms / 1000, draw: (c, q) => { c.save(); c.strokeStyle = `rgba(${col},${1 - q})`; c.lineWidth = w || 3; c.beginPath(); c.arc(x, y, r * (.4 + q * .8), 0, T); c.stroke(); c.restore(); } });

  // ---- Roar of Time: time distorts, clock rings spin, a diamond-blue blast ----
  reg('Roar of Time', { exec: S => { const b = body(S); dim(.55, 1500, '0,10,40'); magicCircle(S, '120,170,255', 1400, 1.5); windup(S, '140,190,255', 220, 40); glowAt(b.i, b.j, 50 * b.k, '150,200,255', 900, .8); },
    impact: S => { const h = hitPt(S); flash('200,225,255', .6); shake(12, 700);
      for (let k = 0; k < 3; k++) spawn({ kind: 'fn', x: h.x, y: h.y, max: 1.1, draw: (c, q) => { const r = 40 + k * 26; c.save(); c.globalAlpha = 1 - q; c.strokeStyle = '#bfe0ff'; c.lineWidth = 3; c.beginPath(); c.arc(h.x, h.y, r, 0, T); c.stroke();
        for (let t = 0; t < 12; t++) { const a = t / 12 * T + (k % 2 ? -1 : 1) * q * 4; c.beginPath(); c.moveTo(h.x + Math.cos(a) * (r - 6), h.y + Math.sin(a) * (r - 6)); c.lineTo(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r); c.stroke(); } c.restore(); } });
      later(150, () => { EX.psychic(h.x, h.y, 1.6); for (let k = 0; k < 4; k++) later(k * 90, () => shock(h.x, h.y, { r1: 90 + k * 40, col: '130,180,255', w: 8, ms: 600 })); sparks(h.x, h.y, 40, { cols: ['#ffffff', '#bfe0ff', '#7ab0ff'], v: [200, 460], grav: 40 }); }); } });
  // ---- Spacial Rend: space is cut open ----
  reg('Spacial Rend', { exec: S => { dim(.5, 1100, '30,0,40'); windup(S, '230,150,255', 300, 30); },
    impact: S => { const h = hitPt(S); flash('255,220,255', .45); shake(9, 500);
      slash(S, [[-60, -40, 56, 36, 0], [56, -42, -52, 38, 0]], { core: '#ffffff', edge: 'rgba(230,140,255,.95)', glow: 'rgba(200,120,255,A)', w: 22, starCol: '#ffd0ff', heavy: 1 });
      later(180, () => { for (let k = 0; k < 3; k++) later(k * 80, () => shock(h.x, h.y, { r1: 80 + k * 40, col: k % 2 ? '255,200,240' : '220,160,255', w: 7, ms: 520 })); sparks(h.x, h.y, 30, { cols: ['#ffffff', '#ffc8f0', '#c890ff'], v: [180, 400], grav: 20 }); }); } });
  // ---- Shadow Force: vanish into shadow, strike from the dark ----
  reg('Shadow Force', { exec: S => { ghost(S, '#2a1a3a', 700, .8); dim(.6, 1200, '5,0,10'); AURA.smoke(S); },
    dash: S => { ghostEvery(S, 40, '#3a1a5a', 360, .6); AURA.smoke(S); },
    impact: S => { const h = hit(S, { size: 1.7, shk: 11, col: '160,100,255', star: '#9a6aff', lines: true, fl: .35, flc: '#2a1040' }); EX.ghost(h.x, h.y, 1.5);
      for (let k = 0; k < 3; k++) later(k * 90, () => shock(h.x, h.y, { r1: 80 + k * 30, col: '110,60,190', w: 8, ms: 540 })); } });
  // ---- Magma Storm: a swirling vortex of fire traps the target ----
  reg('Magma Storm', { exec: S => { windup(S, '255,110,40', 15, 30); dim(.35, 1200, '40,8,0'); },
    impact: S => { const h = hitPt(S), b = h.b; shake(8, 800);
      for (let n = 0; n < N(60); n++) later(rnd(0, 700), () => { const a0 = rnd(0, T), r0 = rnd(26, 46) * b.k; spawn({ kind: 'fn', x: b.i, y: b.j, max: .8, draw: (c, q) => { const a = a0 + q * 9, r = r0 * (1 - q * .4), x = b.i + Math.cos(a) * r, y = b.feet - q * b.h * 1.3 + Math.sin(a) * r * .35;
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,${120 + q * 100 | 0},40,${1 - q})`; c.beginPath(); c.arc(x, y, 4 - q * 2, 0, T); c.fill(); c.restore(); } }); });
      later(500, () => { EX.fire(h.x, h.y, 1.4); shock(h.x, b.feet, { r1: 110, col: '255,120,40', w: 9, squash: .4, ms: 560 }); }); } });
  // ---- Judgment: golden light-spears rain from above ----
  reg('Judgment', { exec: S => { const b = body(S); magicCircle(S, '255,230,140', 1300, 1.4); dim(.45, 1300, '20,15,0'); glowAt(b.i, b.j - b.h, 40 * b.k, '255,240,180', 800, .8); },
    impact: S => { const h = hitPt(S), b = h.b; shake(10, 700); flash('255,245,200', .5);
      for (let k = 0; k < 9; k++) later(k * 60, () => { const x = b.i + rnd(-60, 60) * b.k; pillar(x, b.feet + rnd(-10, 10), { w: 12 * b.k, h: 240, ms: 420, col: '255,235,150' }); sparks(x, b.feet, 6, { cols: ['#ffffff', '#ffe890'], v: [100, 240], grav: 200 }); });
      later(500, () => { star(h.x, h.y, { size: 44, col: '#fff2b0' }); shock(h.x, b.feet, { r1: 150, col: '255,230,140', w: 10, squash: .4, ms: 620 }); }); } });
  // ---- Seed Flare: a green-white shockwave blooms ----
  reg('Seed Flare', { exec: S => { const b = body(S); windup(S, '190,255,170', 100, 30); glowAt(b.i, b.j, 44 * b.k, '200,255,180', 700, .8); },
    impact: S => { const h = hitPt(S); flash('230,255,220', .5); shake(8, 520);
      for (let k = 0; k < 4; k++) later(k * 80, () => shock(h.x, h.y, { r1: 70 + k * 40, col: k % 2 ? '255,255,255' : '150,240,130', w: 8, ms: 560 }));
      for (let n = 0; n < N(30); n++) { const a = rnd(0, T); spawn({ kind: 'fn', x: h.x, y: h.y, max: .9, draw: (c, q) => { const r = q * 110; c.save(); c.globalAlpha = 1 - q; c.translate(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r * .6); c.rotate(a + q * 6); c.fillStyle = n % 3 ? '#9ae07a' : '#ffffff'; c.beginPath(); c.ellipse(0, 0, 4, 1.8, 0, 0, T); c.fill(); c.restore(); } }); } } });
  // ---- Crush Grip: giant gripping shockwaves ----
  reg('Crush Grip', { exec: S => windup(S, '230,230,230', 0, 28), dash: S => { AURA.speed(S, '#ffffff'); ghostEvery(S, 60, '#e0e0e0', 260, .5); },
    impact: S => { const h = hit(S, { size: 1.8, shk: 12, col: '240,240,240', star: '#ffffff', lines: true, fl: .3, flc: '#ffffff' });
      for (let k = 0; k < 2; k++) later(k * 140, () => { ring(h.x - 30, h.y, 46, '230,230,230', 400, 6); ring(h.x + 30, h.y, 46, '230,230,230', 400, 6); });
      later(280, () => { shock(h.x, h.y, { r1: 120, col: '255,255,255', w: 9, ms: 520 }); debris(h.x, h.b.feet, 14); }); } });
  // ---- Draco Meteor: meteors fall in a rain of dragon fire ----
  reg('Draco Meteor', { exec: S => { const b = body(S); windup(S, '200,140,255', 280, 30); pillar(b.i, b.feet, { w: 24 * b.k, h: 260, ms: 700, col: '200,150,255' }); dim(.45, 1400, '15,0,30'); },
    impact: S => { const h = hitPt(S), b = h.b; shake(11, 900);
      for (let k = 0; k < 6; k++) later(k * 110, () => { const tx = b.i + rnd(-70, 70) * b.k, ty = b.feet + rnd(-10, 10), sx = tx - 120, sy = ty - 300;
        spawn({ kind: 'fn', x: sx, y: sy, max: .3, draw: (c, q) => { const x = sx + (tx - sx) * q, y = sy + (ty - sy) * q; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, 'rgba(255,240,220,1)'); g.addColorStop(.4, 'rgba(255,140,90,.9)'); g.addColorStop(1, 'rgba(160,80,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 14, 0, T); c.fill();
          c.strokeStyle = 'rgba(220,150,255,.7)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x - (tx - sx) * .2, y - (ty - sy) * .2); c.stroke(); c.restore(); } });
        later(300, () => { EX.fire(tx, ty, .8); shock(tx, ty, { r1: 60, col: '220,140,255', w: 6, squash: .4, ms: 420 }); debris(tx, ty, 6); }); }); } });
  // ---- Head Smash: a crushing rock impact with recoil sparks ----
  reg('Head Smash', { exec: S => windup(S, '200,170,120', 30, 24), dash: S => { AURA.dust(S); ghostEvery(S, 55, '#c0a070', 240, .45); },
    impact: S => { const h = hit(S, { size: 1.8, shk: 12, col: '220,190,140', star: '#ffe0a0', lines: true }); debris(h.x, h.y, 20); shock(h.x, h.y, { r1: 110, col: '210,180,130', w: 9, ms: 520 });
      const a = body(S); sparks(a.i, a.j, 12, { cols: ['#ffffff', '#ffd080'], v: [100, 220], grav: 200 }); } });
  // ---- Wood Hammer: a heavy wooden strike with splinters ----
  reg('Wood Hammer', { exec: S => windup(S, '170,120,60', 30, 22), dash: S => { AURA.speed(S, '#a0d070'); ghostEvery(S, 60, '#8a6a3a', 220, .45); },
    impact: S => { const h = hit(S, { size: 1.6, shk: 10, col: '200,160,100', star: '#c8e08a', lines: true });
      for (let n = 0; n < N(22); n++) spawn({ kind: 'shard', x: h.x, y: h.y, vx: rnd(-240, 240), vy: rnd(-260, -40), ay: 520, drag: .97, max: .8, r: rnd(1.6, 2.8), a: 1, col: n % 3 ? '#8a5a2a' : '#7ac040', rot: rnd(0, T), vr: rnd(-12, 12) });
      shock(h.x, h.b.feet, { r1: 90, col: '170,130,80', w: 7, squash: .4, ms: 480 }); } });
  // ---- Bullet Punch: quick steel jabs ----
  reg('Bullet Punch', { dash: S => { AURA.speed(S, '#dfe8ff'); ghostEvery(S, 40, '#c8d8ff', 180, .4); },
    impact: S => { const h0 = hitPt(S); for (let k = 0; k < 3; k++) later(k * 70, () => { const x = h0.x + rnd(-10, 10), y = h0.y + rnd(-10, 6); star(x, y, { size: 14 + k * 4, col: '#e8f0ff' }); sparks(x, y, 8, { cols: ['#ffffff', '#c8d8ff'], v: [140, 260], grav: 160 }); shake(2 + k, 100); }); } });
  // ---- Power Gem: a prismatic gem beam ----
  reg('Power Gem', { exec: S => { const a = body(S), t = body(other(S)); windup(S, '255,220,140', 45, 20);
      ribbon(linePath(a.i, a.j, t.i, t.j, 0), { w: 12, ms: 420, core: '#ffffff', edge: '#ffd060', glow: 'rgba(255,200,90,A)', head: .5 });
      for (let n = 0; n < N(16); n++) later(rnd(0, 300), () => { const f = rnd(0, 1); spawn({ kind: 'shard', x: a.i + (t.i - a.i) * f, y: a.j + (t.j - a.j) * f, vx: rnd(-40, 40), vy: rnd(-40, 40), drag: .95, max: .5, r: rnd(1.6, 2.6), a: 1, col: `hsl(${rnd(0, 360)},90%,75%)`, rot: rnd(0, T), vr: rnd(-10, 10) }); }); },
    impact: S => { const h = hitPt(S); star(h.x, h.y, { size: 28, col: '#fff0b0' }); sparks(h.x, h.y, 20, { cols: ['#ffffff', '#ffe080', '#ff9ad0', '#9ad8ff'], v: [140, 300], grav: 60 }); } });
  // ---- Dark Pulse: dark rings ripple outward ----
  reg('Dark Pulse', { exec: S => { const b = body(S); dim(.3, 800, '10,0,20'); for (let k = 0; k < 4; k++) later(k * 90, () => ring(b.i, b.j, 50 * b.k, '120,60,170', 520, 5)); },
    impact: S => { const h = hitPt(S); EX.ghost(h.x, h.y, .9); for (let k = 0; k < 3; k++) later(k * 70, () => shock(h.x, h.y, { r1: 50 + k * 22, col: '100,50,150', w: 5, ms: 420 })); } });
  // ---- Shadow Sneak: a creeping shadow strike ----
  reg('Shadow Sneak', { dash: S => { ghostEvery(S, 40, '#2a1a3a', 240, .55); AURA.smoke(S); },
    impact: S => { const h = hit(S, { size: 1, shk: 4, col: '150,110,220', star: '#9a7aff' }); EX.ghost(h.x, h.y, .6); } });
  // ---- Vacuum Wave: an air-fist ripple ----
  reg('Vacuum Wave', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y), q = (clock.t % 240) / 240; c.save(); c.strokeStyle = 'rgba(230,240,255,.85)'; c.lineWidth = 2.5; for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(x, y, 5 + ((q + k / 2) % 1) * 10, 0, T); c.stroke(); } c.restore(); },
    impact: S => { const h = hitPt(S); shock(h.x, h.y, { r1: 60, col: '230,240,255', w: 5, ms: 360 }); star(h.x, h.y, { size: 18, col: '#ffffff' }); } });
  // ======== milestone 3: ten more Sinnoh moves ========
  const fangs = (S, col, glow, ex) => { const h = hitPt(S); try { PFX3.jaws(S, { col, glow }); } catch (e) { star(h.x, h.y, { size: 22, col }); } later(120, () => ex(h)); shake(4, 220); };
  // ---- Psycho Cut / Night Slash: a psychic blade, a dark crescent ----
  reg('Psycho Cut', { dash: S => { AURA.speed(S, '#ff9ae0'); ghostEvery(S, 55, '#e070d0', 200, .4); },
    impact: S => { const h = hitPt(S); slash(S, [[-40, -30, 36, 26, 16]], { core: '#ffffff', edge: 'rgba(255,120,220,.95)', glow: 'rgba(240,100,210,A)', w: 16, starCol: '#ffc8f0', heavy: .6 }); EX.psychic(h.x, h.y, .7); } });
  reg('Night Slash', { dash: S => { ghostEvery(S, 45, '#2a1a3a', 220, .5); AURA.smoke(S); },
    impact: S => { const h = hitPt(S); dim(.3, 400, '10,0,20'); slash(S, [[38, -32, -36, 28, -18]], { core: '#e8d8ff', edge: 'rgba(90,40,140,.95)', glow: 'rgba(70,30,120,A)', w: 18, starCol: '#b090ff', heavy: .7 }); } });
  // ---- Thunder / Ice / Fire Fang: jaws crackling with an element ----
  reg('Thunder Fang', { dash: S => AURA.speed(S, '#fff27a'), impact: S => fangs(S, '#fff6a0', 'rgba(255,230,80,A)', h => { EX.electric(h.x, h.y, .7); sparks(h.x, h.y, 14, { cols: ['#ffffff', '#fff27a'], v: [140, 280], grav: 120 }); }) });
  reg('Ice Fang', { dash: S => AURA.speed(S, '#bfeaff'), impact: S => fangs(S, '#e8f8ff', 'rgba(150,220,255,A)', h => { EX.ice(h.x, h.y, .7); for (let n = 0; n < N(12); n++) spawn({ kind: 'shard', x: h.x, y: h.y, vx: rnd(-160, 160), vy: rnd(-180, 20), ay: 300, drag: .97, max: .6, r: rnd(1.4, 2.4), a: 1, col: n % 2 ? '#ffffff' : '#9adcff', rot: rnd(0, T), vr: rnd(-10, 10) }); }) });
  reg('Fire Fang', { dash: S => AURA.flame(S), impact: S => fangs(S, '#ffe0b0', 'rgba(255,130,50,A)', h => { EX.fire(h.x, h.y, .7); sparks(h.x, h.y, 14, { cols: ['#ffe080', '#ff7a2a'], v: [120, 260], grav: -40 }); }) });
  // ---- Iron Head: a steel headbutt with sparks ----
  reg('Iron Head', { exec: S => windup(S, '210,220,235', 220, 20), dash: S => { AURA.speed(S, '#dfe6f0'); ghostEvery(S, 55, '#c8d0dc', 220, .45); },
    impact: S => { const h = hit(S, { size: 1.4, shk: 8, col: '220,228,240', star: '#ffffff', lines: true }); sparks(h.x, h.y, 26, { cols: ['#ffffff', '#ffe8a0', '#c8d0dc'], v: [180, 380], grav: 260 }); shock(h.x, h.y, { r1: 80, col: '210,220,235', w: 6, ms: 420 }); } });
  // ---- Aqua Tail: a swirling water tail ----
  reg('Aqua Tail', { dash: S => { const b = body(S); spawn({ kind: 'fn', x: b.i, y: b.j, max: .25, draw: (c, q) => { const bb = body(S); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(120,200,255,${.8 * (1 - q)})`; c.lineWidth = 4; c.beginPath(); c.arc(bb.i, bb.j, 22 * bb.k, clock.t / 60, clock.t / 60 + 4); c.stroke(); c.restore(); } }); },
    impact: S => { const h = hitPt(S); ribbon(arcPath(h.x, h.y, 34, -2.8, .3, .6), { w: 12, ms: 380, core: '#e8f6ff', edge: '#3a9aff', glow: 'rgba(80,170,255,A)', head: .7 }); EX.water(h.x, h.y, 1); shake(6, 320); } });
  // ---- Dragon Rush: a charge wrapped in violet dragon energy ----
  reg('Dragon Rush', { exec: S => { windup(S, '170,120,255', 265, 28); dim(.3, 800, '15,0,30'); },
    dash: S => { ghostEvery(S, 40, '#9a6aff', 320, .6); const b = body(S); glowAt(b.i, b.j, 34 * b.k, '170,120,255', 160, .7); speedLines(b.i, b.j, '#c8a8ff', 160, 8); },
    impact: S => { const h = hit(S, { size: 1.7, shk: 11, col: '190,150,255', star: '#d8c0ff', lines: true, fl: .3, flc: '#e8dcff' }); shock(h.x, h.y, { r1: 120, col: '170,120,255', w: 9, ms: 520 }); debris(h.x, h.b.feet, 12); } });
  // ---- Focus Blast: a glowing orange energy sphere ----
  reg('Focus Blast', { exec: S => windup(S, '255,170,80', 30, 26),
    shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); orb(c, x, y, 13, { core: '255,250,220', mid: '255,170,70', rim: '255,120,40', arcs: 2, pulse: .14 }); },
    impact: S => { const h = hitPt(S); flash('255,210,150', .35); shake(8, 420); EX.fire(h.x, h.y, .6); for (let k = 0; k < 3; k++) later(k * 70, () => shock(h.x, h.y, { r1: 60 + k * 30, col: '255,170,80', w: 6, ms: 440 })); } });
  // ---- Nasty Plot: dark thought-bubbles swirl around the user's head ----
  reg('Nasty Plot', { exec: S => { const b = body(S); dim(.25, 900, '15,0,25'); glowAt(b.i, b.j - b.h * .6, 30 * b.k, '150,80,200', 800, .6);
      for (let n = 0; n < N(10); n++) later(n * 70, () => { const a0 = n * .63; spawn({ kind: 'fn', x: b.i, y: b.j, max: .9, draw: (c, q) => { const bb = body(S), a = a0 + q * 5, x = bb.i + Math.cos(a) * 24 * bb.k, y = bb.j - bb.h * .7 + Math.sin(a) * 9 * bb.k;
        c.save(); c.globalAlpha = q < .8 ? .85 : (1 - q) / .2 * .85; c.fillStyle = '#5a2a7a'; c.strokeStyle = '#c890ff'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 4 + q * 2, 0, T); c.fill(); c.stroke(); c.restore(); } }); }); } });
  // ---- Discharge: an electric field bursts outward ----
  reg('Discharge', { exec: S => { const b = body(S); for (let k = 0; k < 10; k++) later(k * 40, () => { const a = rnd(0, T); spawn({ kind: 'fn', x: b.i, y: b.j, max: .2, draw: (c, q) => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,245,150,${1 - q})`; c.lineWidth = 2.5; c.beginPath(); c.moveTo(b.i, b.j);
      for (let s = 1; s <= 5; s++) c.lineTo(b.i + Math.cos(a) * s * 14 + rnd(-6, 6), b.j + Math.sin(a) * s * 10 + rnd(-6, 6)); c.stroke(); c.restore(); } }); }); glowAt(b.i, b.j, 50 * b.k, '255,240,120', 500, .6); },
    impact: S => { const h = hitPt(S); EX.electric(h.x, h.y, 1.1); shock(h.x, h.y, { r1: 90, col: '255,240,120', w: 6, ms: 420 }); } });
})();
