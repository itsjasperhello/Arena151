/* =====================================================================
   Section 41: Unova (Gen 5) move effects — legendary signatures get
   full cinematics; built on the shared toolkit (FXK) and particles (PFX).
   ===================================================================== */
(function unovaMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const o = Object.assign({}, MFX[n] || {});
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; } MFX[n] = o; } };
  const slash = (S, strokes, o) => { try { PFX4.slashSet(S, strokes, o); } catch (e) { } };
  // ---- Blue Flare: a white-blue inferno ----
  reg('Blue Flare', { exec: S => { const a = body(S), t = body(other(S)); dim(.5, 1300, '0,10,30'); windup(S, '150,200,255', 15, 34);
      for (let k = 0; k < 3; k++) later(k * 90, () => ribbon(linePath(a.i, a.j - 10 + k * 10, t.i, t.j - 10 + k * 10, (k - 1) * 14), { w: 18 - k * 4, ms: 600, core: '#ffffff', edge: '#5ab4ff', glow: 'rgba(90,170,255,A)', head: .5 })); },
    impact: S => { const h = hitPt(S); flash('200,230,255', .55); shake(11, 650); EX.fire(h.x, h.y, 1.5); pillar(h.x, h.b.feet, { w: 60 * h.b.k, h: 220, ms: 800, col: '140,200,255' });
      for (let k = 0; k < 3; k++) later(k * 90, () => shock(h.x, h.y, { r1: 90 + k * 40, col: '130,190,255', w: 9, ms: 580 })); } });
  // ---- Bolt Strike: a charge wrapped in black lightning ----
  reg('Bolt Strike', { exec: S => { windup(S, '255,240,120', 270, 30); dim(.45, 1000, '5,5,20'); },
    dash: S => { ghostEvery(S, 40, '#2a2a3a', 300, .6); const b = body(S); for (let k = 0; k < 2; k++) spawn({ kind: 'fn', x: b.i, y: b.j, max: .15, draw: (c, q) => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(120,200,255,${1 - q})`; c.lineWidth = 2.5; c.beginPath(); c.moveTo(b.i + rnd(-20, 20), b.j - 30);
      for (let s = 0; s < 5; s++) c.lineTo(b.i + rnd(-24, 24), b.j - 30 + s * 14); c.stroke(); c.restore(); } }); },
    impact: S => { const h = hit(S, { size: 1.8, shk: 12, col: '255,250,180', star: '#fff6a0', lines: true, fl: .4, flc: '#fffbe0' }); EX.electric(h.x, h.y, 1.6); for (let k = 0; k < 3; k++) later(k * 80, () => shock(h.x, h.y, { r1: 100 + k * 30, col: '255,240,120', w: 8, ms: 520 })); } });
  // ---- Glaciate: a freezing wind with ice shards ----
  reg('Glaciate', { exec: S => { const a = body(S), t = body(other(S)); dim(.4, 1100, '0,20,40');
      for (let n = 0; n < N(40); n++) later(rnd(0, 500), () => { const f = rnd(0, 1); spawn({ kind: 'shard', x: a.i + (t.i - a.i) * f, y: a.j + (t.j - a.j) * f + rnd(-30, 30), vx: (t.i - a.i) * .8, vy: rnd(-20, 20), drag: .97, max: .6, r: rnd(1.6, 3), a: 1, col: n % 2 ? '#ffffff' : '#9adcff', rot: rnd(0, T), vr: rnd(-10, 10) }); }); },
    impact: S => { const h = hitPt(S); EX.ice(h.x, h.y, 1.4); flash('220,245,255', .4); shock(h.x, h.b.feet, { r1: 120, col: '170,225,255', w: 8, squash: .4, ms: 560 }); } });
  // ---- V-create: a blazing V-shaped fire mark ----
  reg('V-create', { exec: S => { windup(S, '255,120,40', 15, 34); const b = body(S); glowAt(b.i, b.j - b.h * .5, 40 * b.k, '255,150,60', 600, .8); },
    dash: S => { AURA.flame(S); ghostEvery(S, 45, '#ff7a2a', 280, .55); },
    impact: S => { const h = hitPt(S); flash('255,200,120', .5); shake(12, 650);
      ribbon(linePath(h.x - 50, h.y - 60, h.x, h.y + 20, 0), { w: 18, ms: 520, core: '#fff6c8', edge: '#ff6a1a', glow: 'rgba(255,110,30,A)', head: .8 });
      ribbon(linePath(h.x + 50, h.y - 60, h.x, h.y + 20, 0), { w: 18, ms: 520, core: '#fff6c8', edge: '#ff6a1a', glow: 'rgba(255,110,30,A)', head: .8 });
      later(160, () => { EX.fire(h.x, h.y, 1.6); shock(h.x, h.y, { r1: 140, col: '255,140,50', w: 10, ms: 600 }); }); } });
  // ---- Secret Sword / Sacred Sword: a horn-blade, a gleaming blade ----
  reg('Secret Sword', { exec: S => windup(S, '120,200,255', 200, 24), impact: S => { const h = hitPt(S); slash(S, [[-50, -34, 46, 30, 0], [46, -36, -44, 32, 0]], { core: '#ffffff', edge: 'rgba(110,200,255,.95)', glow: 'rgba(90,180,255,A)', w: 18, starCol: '#c8ecff', heavy: .9 }); shock(h.x, h.y, { r1: 90, col: '140,210,255', w: 6, ms: 460 }); } });
  reg('Sacred Sword', { dash: S => { AURA.speed(S, '#fff6c8'); ghostEvery(S, 55, '#ffe8a0', 220, .45); },
    impact: S => { const h = hitPt(S); slash(S, [[-46, -38, 42, 30, 10]], { core: '#ffffff', edge: 'rgba(255,230,140,.95)', glow: 'rgba(255,215,110,A)', w: 18, starCol: '#fff2b0', heavy: .8 }); sparks(h.x, h.y, 18, { cols: ['#ffffff', '#ffe890'], v: [140, 300], grav: 80 }); } });
  // ---- Relic Song: musical notes and a melody ring ----
  reg('Relic Song', { exec: S => { const a = body(S), t = body(other(S));
      for (let n = 0; n < N(12); n++) later(n * 60, () => { const y0 = a.j - 10 + rnd(-14, 14); spawn({ kind: 'fn', x: a.i, y: y0, max: .7, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = y0 + (t.j - y0) * q + Math.sin(q * 12 + n) * 10;
        c.save(); c.globalAlpha = 1 - q * .6; c.fillStyle = n % 2 ? '#7ae0c0' : '#ffd0f0'; c.font = 'bold 16px serif'; c.textAlign = 'center'; c.fillText(n % 3 ? '♪' : '♫', x, y); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); for (let k = 0; k < 3; k++) later(k * 90, () => shock(h.x, h.y, { r1: 50 + k * 26, col: '150,230,200', w: 4, ms: 420 })); glowAt(h.x, h.y, 40, '180,240,220', 420, .5); } });
  // ---- Techno Blast: a mechanical beam ----
  reg('Techno Blast', { exec: S => { const a = body(S), t = body(other(S)); windup(S, '230,120,255', 260, 26);
      ribbon(linePath(a.i, a.j, t.i, t.j, 0), { w: 16, ms: 520, core: '#ffffff', edge: '#c070ff', glow: 'rgba(200,110,255,A)', head: .4 });
      for (let k = 0; k < 6; k++) later(k * 50, () => { const f = k / 6; spawn({ kind: 'fn', x: a.i, y: a.j, max: .3, draw: (c, q) => { const x = a.i + (t.i - a.i) * f, y = a.j + (t.j - a.j) * f; c.save(); c.strokeStyle = `rgba(255,255,255,${1 - q})`; c.lineWidth = 2; c.strokeRect(x - 6, y - 6, 12, 12); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); flash('240,210,255', .35); shake(8, 420); EX.psychic(h.x, h.y, 1.1); shock(h.x, h.y, { r1: 100, col: '210,140,255', w: 7, ms: 480 }); } });
  // ---- Wild Charge: a crackling electric tackle ----
  reg('Wild Charge', { dash: S => { AURA.speed(S, '#fff27a'); ghostEvery(S, 45, '#ffe060', 220, .5); const b = body(S); glowAt(b.i, b.j, 30 * b.k, '255,240,120', 120, .6); },
    impact: S => { const h = hit(S, { size: 1.5, shk: 9, col: '255,245,150', star: '#fff27a', lines: true }); EX.electric(h.x, h.y, 1.1); } });
  // ---- Fiery Dance: a spiral of flame petals ----
  reg('Fiery Dance', { exec: S => { const b = body(S); for (let n = 0; n < N(26); n++) later(n * 25, () => { const a0 = n * .5; spawn({ kind: 'fn', x: b.i, y: b.j, max: .9, draw: (c, q) => { const a = a0 + q * 7, r = (12 + q * 40) * b.k, x = b.i + Math.cos(a) * r, y = b.j - q * 30 + Math.sin(a) * r * .4;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,${140 + q * 80 | 0},50,${1 - q})`; c.translate(x, y); c.rotate(a); c.beginPath(); c.ellipse(0, 0, 5, 2.2, 0, 0, T); c.fill(); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); EX.fire(h.x, h.y, 1.1); shock(h.x, h.y, { r1: 80, col: '255,150,60', w: 6, ms: 440 }); } });
  // ---- Quiver Dance: a glittering butterfly aura ----
  reg('Quiver Dance', { exec: S => { const b = body(S); magicCircle(S, '255,200,120', 900, 1); glowAt(b.i, b.j, 44 * b.k, '255,210,140', 700, .5);
      for (let n = 0; n < N(24); n++) later(rnd(0, 600), () => spawn({ kind: 'shard', x: b.i + rnd(-30, 30) * b.k, y: b.j + rnd(-20, 20), vx: rnd(-30, 30), vy: rnd(-90, -40), drag: .97, max: .8, r: rnd(1.2, 2.2), a: 1, col: ['#ffe080', '#ff9ad0', '#ffffff'][n % 3], rot: rnd(0, T), vr: rnd(-12, 12) })); } });
  // ---- Night Daze: a dark crimson shockwave ----
  reg('Night Daze', { exec: S => { const b = body(S); dim(.55, 1000, '20,0,10'); glowAt(b.i, b.j, 50 * b.k, '170,30,60', 600, .7);
      for (let k = 0; k < 4; k++) later(k * 90, () => shock(b.i, b.j, { r1: 80 + k * 50, col: k % 2 ? '120,20,50' : '200,40,80', w: 8, ms: 560 })); },
    impact: S => { const h = hitPt(S); shake(8, 450); EX.ghost(h.x, h.y, 1.1); } });
  // ---- Razor Shell: a shell-blade slash ----
  reg('Razor Shell', { dash: S => { AURA.speed(S, '#9ad8ff'); ghostEvery(S, 55, '#7ac0ff', 200, .4); },
    impact: S => { const h = hitPt(S); slash(S, [[-40, -30, 36, 26, 12], [36, -30, -32, 24, -12]], { core: '#ffffff', edge: 'rgba(90,180,255,.95)', glow: 'rgba(70,160,255,A)', w: 15, starCol: '#c8ecff' }); EX.water(h.x, h.y, .7); } });
  // ---- Hex: a cursed ghost orb ----
  reg('Hex', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); orb(c, x, y, 10, { core: '230,210,255', mid: '140,80,220', rim: '90,40,160', arcs: 1, pulse: .18 }); },
    impact: S => { const h = hitPt(S); EX.ghost(h.x, h.y, .9); for (let k = 0; k < 2; k++) later(k * 90, () => shock(h.x, h.y, { r1: 50 + k * 26, col: '140,80,220', w: 5, ms: 400 })); } });
  // ======== milestone 3: ten more Unova moves ========
  // ---- Leaf Tornado: a whirling column of leaves ----
  reg('Leaf Tornado', { impact: S => { const h = hitPt(S), b = h.b; shake(5, 600);
      for (let n = 0; n < N(36); n++) later(rnd(0, 500), () => { const a0 = rnd(0, T); spawn({ kind: 'fn', x: b.i, y: b.feet, max: .8, draw: (c, q) => { const a = a0 + q * 10, r = (16 + q * 14) * b.k, x = b.i + Math.cos(a) * r, y = b.feet - q * b.h * 1.5 + Math.sin(a) * r * .3;
        c.save(); c.globalAlpha = 1 - q; c.translate(x, y); c.rotate(a); c.fillStyle = n % 3 ? '#6cc040' : '#b8f070'; c.beginPath(); c.ellipse(0, 0, 4.5, 2, 0, 0, T); c.fill(); c.restore(); } }); }); } });
  // ---- Flame Charge: a dash wrapped in fire ----
  reg('Flame Charge', { dash: S => { AURA.flame(S); ghostEvery(S, 50, '#ff8a3a', 220, .45); }, impact: S => { const h = hit(S, { size: 1.2, shk: 5, col: '255,180,90', star: '#ffb040' }); EX.fire(h.x, h.y, .7); } });
  // ---- Icicle Crash: icicles crash down from above ----
  reg('Icicle Crash', { impact: S => { const h = hitPt(S), b = h.b; shake(7, 600);
      for (let k = 0; k < 5; k++) later(k * 80, () => { const tx = b.i + rnd(-40, 40) * b.k, ty = b.feet + rnd(-8, 8), sy = ty - 220;
        spawn({ kind: 'fn', x: tx, y: sy, max: .22, draw: (c, q) => { const y = sy + (ty - sy) * q; c.save(); c.fillStyle = '#dff4ff'; c.strokeStyle = '#7ac8ff'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tx - 6, y - 26); c.lineTo(tx + 6, y - 26); c.lineTo(tx, y); c.closePath(); c.fill(); c.stroke(); c.restore(); } });
        later(220, () => { EX.ice(tx, ty, .6); for (let n = 0; n < 6; n++) spawn({ kind: 'shard', x: tx, y: ty, vx: rnd(-120, 120), vy: rnd(-160, -40), ay: 420, drag: .97, max: .5, r: rnd(1.2, 2.2), a: 1, col: '#ffffff', rot: rnd(0, T), vr: rnd(-10, 10) }); }); }); } });
  // ---- Gear Grind: two spinning steel gears ----
  reg('Gear Grind', { impact: S => { const h = hitPt(S); for (let k = 0; k < 2; k++) later(k * 160, () => { const ox = k ? 18 : -18;
      spawn({ kind: 'fn', x: h.x, y: h.y, max: .5, draw: (c, q) => { c.save(); c.globalAlpha = 1 - q * .6; c.translate(h.x + ox, h.y); c.rotate((k ? -1 : 1) * q * 12); c.fillStyle = '#c8d0dc'; c.strokeStyle = '#6a7484'; c.lineWidth = 1.5;
        c.beginPath(); for (let t = 0; t < 16; t++) { const a = t / 16 * T, r = t % 2 ? 14 : 18; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#6a7484'; c.beginPath(); c.arc(0, 0, 5, 0, T); c.fill(); c.restore(); } });
      later(250, () => { sparks(h.x + ox, h.y, 14, { cols: ['#ffffff', '#ffe8a0'], v: [140, 300], grav: 240 }); shake(5, 160); }); }); } });
  // ---- Searing Shot: a burst of scorching fireballs ----
  reg('Searing Shot', { exec: S => { const b = body(S); windup(S, '255,150,60', 15, 28); for (let n = 0; n < N(14); n++) { const a = n / 14 * T; spawn({ kind: 'fn', x: b.i, y: b.j, max: .5, draw: (c, q) => { const r = q * 90, x = b.i + Math.cos(a) * r, y = b.j + Math.sin(a) * r * .6;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,${150 + q * 80 | 0},60,${1 - q})`; c.beginPath(); c.arc(x, y, 6 - q * 3, 0, T); c.fill(); c.restore(); } }); } },
    impact: S => { const h = hitPt(S); EX.fire(h.x, h.y, 1.2); shock(h.x, h.y, { r1: 90, col: '255,150,60', w: 7, ms: 460 }); } });
  // ---- Psyshock: psychic shards ----
  reg('Psyshock', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.translate(x, y); c.rotate(clock.t / 90); c.fillStyle = 'rgba(255,140,230,.9)'; c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 0); c.lineTo(0, 9); c.lineTo(-6, 0); c.closePath(); c.fill(); c.restore(); },
    impact: S => { const h = hitPt(S); EX.psychic(h.x, h.y, .9); for (let n = 0; n < N(12); n++) spawn({ kind: 'shard', x: h.x, y: h.y, vx: rnd(-180, 180), vy: rnd(-180, 120), drag: .95, max: .5, r: rnd(1.6, 2.6), a: 1, col: '#ff9ae8', rot: rnd(0, T), vr: rnd(-12, 12) }); } });
  // ---- Dual Chop: two quick dragon chops ----
  reg('Dual Chop', { dash: S => { AURA.speed(S, '#b090ff'); ghostEvery(S, 50, '#9a70ff', 200, .45); },
    impact: S => { slash(S, [[-34, -28, 30, 24, 10]], { core: '#ffffff', edge: 'rgba(170,120,255,.95)', glow: 'rgba(150,100,255,A)', w: 14, starCol: '#d8c0ff' });
      later(130, () => slash(S, [[32, -28, -28, 24, -10]], { core: '#ffffff', edge: 'rgba(170,120,255,.95)', glow: 'rgba(150,100,255,A)', w: 14, starCol: '#d8c0ff' })); } });
  // ---- Sludge Wave: a toxic tidal wave ----
  reg('Sludge Wave', { exec: S => { const a = body(S), t = body(other(S)); dim(.3, 900, '20,0,30');
      for (let k = 0; k < 3; k++) later(k * 100, () => ribbon(linePath(a.i, a.feet - 6 - k * 9, t.i, t.feet - 6 - k * 9, -20 - k * 6), { w: 16 - k * 4, ms: 520, core: '#e0b0ff', edge: '#7a2aa0', glow: 'rgba(140,60,180,A)', head: .4 })); },
    impact: S => { const h = hitPt(S); try { EX.poison(h.x, h.y, 1.1); } catch (e) { } for (let n = 0; n < N(20); n++) spawn({ kind: 'drop', x: h.x, y: h.y, vx: rnd(-160, 160), vy: rnd(-200, -40), ay: 480, drag: .98, max: .7, r: rnd(1.6, 3), a: .95, col: n % 2 ? '#8a3ab0' : '#c070e0' }); } });
  // ---- Shell Smash: the shell bursts apart in a power-up aura ----
  reg('Shell Smash', { exec: S => { const b = body(S); flash('255,240,200', .25); shake(5, 300); glowAt(b.i, b.j, 46 * b.k, '255,200,120', 700, .7);
      for (let n = 0; n < N(16); n++) spawn({ kind: 'shard', x: b.i, y: b.j, vx: rnd(-200, 200), vy: rnd(-220, -40), ay: 420, drag: .97, max: .7, r: rnd(2, 3.2), a: 1, col: n % 2 ? '#c8a070' : '#8a6a4a', rot: rnd(0, T), vr: rnd(-12, 12) });
      for (let k = 0; k < 3; k++) later(k * 90, () => shock(b.i, b.j, { r1: 50 + k * 22, col: '255,210,140', w: 4, ms: 380 })); } });
  // ---- Storm Throw: a spinning throw ----
  reg('Storm Throw', { dash: S => { AURA.speed(S, '#ffffff'); ghostEvery(S, 55, '#e0e0e0', 220, .45); },
    impact: S => { const h = hitPt(S); ribbon(arcPath(h.x, h.y, 40, 0, T * .9, .7), { w: 10, ms: 420, core: '#ffffff', edge: '#a0c8ff', glow: 'rgba(160,200,255,A)', head: .7 }); later(260, () => { star(h.x, h.b.feet - 10, { size: 26, col: '#ffffff' }); shake(7, 260); debris(h.x, h.b.feet, 8); }); } });
  // ---- Head Charge: a stampeding headbutt ----
  reg('Head Charge', { exec: S => windup(S, '220,180,120', 30, 22), dash: S => { AURA.dust(S); ghostEvery(S, 50, '#c8a070', 240, .45); },
    impact: S => { const h = hit(S, { size: 1.7, shk: 11, col: '240,210,160', star: '#ffe0a0', lines: true }); debris(h.x, h.b.feet, 16); shock(h.x, h.b.feet, { r1: 110, col: '220,180,120', w: 9, squash: .4, ms: 520 }); } });
})();
