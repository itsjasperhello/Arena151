/* =====================================================================
   Section 47: Galar (Gen 8) move effects — signature moves get full
   cinematics; built on the shared toolkit (FXK) and particles (PFX).
   ===================================================================== */
(function galarMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const o = Object.assign({}, MFX[n] || {});
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; } MFX[n] = o; } };
  const slash = (S, strokes, o) => { try { PFX4.slashSet(S, strokes, o); } catch (e) { } };
  reg('Behemoth Blade', { exec: S => { windup(S, '120,200,255', 15, 34); dim(.45, 1100, '0,10,30'); }, dash: S => { AURA.speed(S, '#9ad8ff'); ghostEvery(S, 45, '#7ac0ff', 280, .55); },
    impact: S => { const h = hitPt(S); flash('220,240,255', .45); shake(11, 600); slash(S, [[-80, -60, 70, 50, 0]], { core: '#ffffff', edge: 'rgba(120,200,255,.95)', glow: 'rgba(90,180,255,A)', w: 30, starCol: '#e0f4ff', heavy: 1.2 });
      later(150, () => { for (let k = 0; k < 3; k++) later(k * 80, () => shock(h.x, h.y, { r1: 110 + k * 40, col: '150,210,255', w: 9, ms: 560 })); }); } });
  reg('Behemoth Bash', { exec: S => { windup(S, '255,120,140', 15, 34); dim(.45, 1100, '30,0,10'); }, dash: S => { AURA.speed(S, '#ff9ab0'); ghostEvery(S, 45, '#ff7a9a', 280, .55); },
    impact: S => { const h = hit(S, { size: 2, shk: 12, col: '255,180,200', star: '#ffd0e0', lines: true, fl: .4, flc: '#ffe8f0' }); for (let k = 0; k < 3; k++) later(k * 80, () => shock(h.x, h.y, { r1: 120 + k * 40, col: '255,140,170', w: 10, ms: 580 })); debris(h.x, h.b.feet, 14); } });
  reg('Dynamax Cannon', { exec: S => { const a = body(S), t = body(other(S)); dim(.6, 1400, '40,0,10'); windup(S, '255,60,90', 290, 40);
      later(250, () => { for (let k = 0; k < 3; k++) later(k * 60, () => ribbon(linePath(a.i, a.j - 8 + k * 8, t.i, t.j - 8 + k * 8, 0), { w: 26 - k * 6, ms: 760, core: '#ffd0d8', edge: '#e0103a', glow: 'rgba(220,20,60,A)', head: .4 })); }); },
    impact: S => { const h = hitPt(S); flash('255,180,190', .6); shake(13, 800); EX.fire(h.x, h.y, 1.4); for (let k = 0; k < 4; k++) later(k * 80, () => shock(h.x, h.y, { r1: 110 + k * 45, col: '230,40,80', w: 10, ms: 620 })); } });
  reg('Drum Beating', { impact: S => { const h = hitPt(S), b = h.b; for (let k = 0; k < 3; k++) later(k * 120, () => shock(body(S).i, body(S).feet, { r1: 60 + k * 20, col: '150,220,110', w: 5, squash: .4, ms: 360 }));
      for (let k = 0; k < 5; k++) later(200 + k * 70, () => { const x = b.i + rnd(-40, 40) * b.k; ribbon(linePath(x, b.feet + 10, x + rnd(-8, 8), b.feet - 60 * b.k, rnd(-10, 10)), { w: 7, ms: 420, core: '#c8f0a0', edge: '#4a8a2a', glow: 'rgba(90,160,60,A)', head: .8 }); debris(x, b.feet, 4); }); shake(7, 600); } });
  reg('Pyro Ball', { exec: S => windup(S, '255,140,60', 15, 26), shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); orb(c, x, y, 13, { core: '255,250,210', mid: '255,140,50', rim: '255,80,30', arcs: 2, pulse: .16 }); if (Math.random() < .8) spawn({ x, y, vx: rnd(-30, 30), vy: rnd(-40, 10), drag: .95, max: .4, r: rnd(3, 6), a: .9, img: PFX.hueTex(25, 100, 60), add: true }); },
    impact: S => { const h = hitPt(S); flash('255,200,120', .4); shake(9, 500); EX.fire(h.x, h.y, 1.4); shock(h.x, h.y, { r1: 110, col: '255,140,60', w: 8, ms: 520 }); } });
  reg('Snipe Shot', { exec: S => { const a = body(S), t = body(other(S)); spawn({ kind: 'fn', x: a.i, y: a.j, max: .5, draw: (c, q) => { c.save(); c.strokeStyle = `rgba(120,220,255,${1 - q})`; c.lineWidth = 1.5; c.beginPath(); c.arc(t.i, t.j, 18, 0, T); c.moveTo(t.i - 26, t.j); c.lineTo(t.i + 26, t.j); c.moveTo(t.i, t.j - 26); c.lineTo(t.i, t.j + 26); c.stroke(); c.restore(); } }); },
    shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.fillStyle = '#bfe8ff'; c.beginPath(); c.ellipse(x, y, 8, 3, 0, 0, T); c.fill(); c.restore(); },
    impact: S => { const h = hitPt(S); EX.water(h.x, h.y, .9); star(h.x, h.y, { size: 22, col: '#dff4ff' }); } });
  reg('Bolt Beak', { dash: S => { AURA.speed(S, '#fff27a'); ghostEvery(S, 45, '#ffe060', 220, .5); }, impact: S => { const h = hit(S, { size: 1.5, shk: 9, col: '255,245,150', star: '#fff27a', lines: true }); EX.electric(h.x, h.y, 1.2); } });
  reg('Fishious Rend', { dash: S => AURA.speed(S, '#9ad8ff'), impact: S => { const h = hitPt(S); try { PFX3.jaws(S, { col: '#dff4ff', glow: 'rgba(90,170,255,A)' }); } catch (e) { star(h.x, h.y, { size: 24, col: '#bfe8ff' }); } later(120, () => EX.water(h.x, h.y, 1.2)); shake(8, 400); } });
  reg('Dragon Darts', { exec: S => { const a = body(S), t = body(other(S)); for (let k = 0; k < 2; k++) later(k * 160, () => { const y0 = a.j - 8 + k * 16; spawn({ kind: 'fn', x: a.i, y: y0, max: .3, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = y0 + (t.j - y0) * q; c.save(); c.translate(x, y); c.rotate(Math.atan2(t.j - y0, t.i - a.i));
      c.fillStyle = '#7ad0ff'; c.beginPath(); c.moveTo(10, 0); c.lineTo(-8, -5); c.lineTo(-4, 0); c.lineTo(-8, 5); c.closePath(); c.fill(); c.restore(); } }); later(300, () => { star(t.i + rnd(-10, 10), t.j + rnd(-10, 10), { size: 20, col: '#b0e4ff' }); shake(4, 140); }); }); } });
  reg('Wicked Blow', { dash: S => { ghostEvery(S, 45, '#2a1a2a', 240, .55); AURA.smoke(S); }, impact: S => { const h = hit(S, { size: 1.7, shk: 11, col: '200,120,180', star: '#ff9ad0', lines: true }); dim(.3, 500, '20,0,15'); shock(h.x, h.y, { r1: 110, col: '120,40,100', w: 9, ms: 500 }); } });
  reg('Astral Barrage', { exec: S => { const a = body(S), t = body(other(S)); dim(.5, 1200, '5,0,20'); for (let n = 0; n < N(16); n++) later(n * 50, () => { const y0 = a.j + rnd(-30, 30); spawn({ kind: 'fn', x: a.i, y: y0, max: .45, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = y0 + (t.j - y0) * q + Math.sin(q * 8 + n) * 10;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(170,120,255,${1 - q * .4})`; c.beginPath(); c.arc(x, y, 5, 0, T); c.fill(); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); EX.ghost(h.x, h.y, 1.5); flash('210,190,255', .4); shake(9, 500); } });
  reg('Glacial Lance', { exec: S => { const b = body(S); windup(S, '170,225,255', 270, 28); glowAt(b.i, b.j - b.h, 30 * b.k, '200,240,255', 600, .7); },
    shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.translate(x, y); c.rotate(Math.atan2(p.vy || 0, p.vx || 1)); c.fillStyle = '#dff4ff'; c.strokeStyle = '#7ac8ff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(24, 0); c.lineTo(-14, -7); c.lineTo(-10, 0); c.lineTo(-14, 7); c.closePath(); c.fill(); c.stroke(); c.restore(); },
    impact: S => { const h = hitPt(S); flash('230,248,255', .45); shake(10, 600); EX.ice(h.x, h.y, 1.6); for (let n = 0; n < 16; n++) spawn({ kind: 'shard', x: h.x, y: h.y, vx: rnd(-240, 240), vy: rnd(-260, 40), ay: 380, drag: .97, max: .7, r: rnd(1.8, 3), a: 1, col: n % 2 ? '#ffffff' : '#9adcff', rot: rnd(0, T), vr: rnd(-10, 10) }); } });
  reg('Thunder Cage', { impact: S => { const h = hitPt(S), b = h.b; spawn({ kind: 'fn', x: b.i, y: b.j, max: .9, draw: (c, q) => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,240,120,${1 - q * .7})`; c.lineWidth = 2.5;
      for (let k = 0; k < 6; k++) { const x = b.i + (k - 2.5) * 12 * b.k; c.beginPath(); c.moveTo(x, b.j - 40 * b.k); for (let s = 1; s <= 5; s++) c.lineTo(x + rnd(-4, 4), b.j - 40 * b.k + s * 16 * b.k); c.stroke(); } c.restore(); } }); later(200, () => EX.electric(h.x, h.y, 1.1)); } });
  reg('Dragon Energy', { exec: S => { const a = body(S), t = body(other(S)); dim(.55, 1400, '10,30,10'); windup(S, '150,255,140', 290, 40);
      later(250, () => { for (let k = 0; k < 3; k++) later(k * 60, () => ribbon(linePath(a.i, a.j - 10 + k * 10, t.i, t.j - 10 + k * 10, 0), { w: 28 - k * 7, ms: 760, core: '#ffffff', edge: '#3ad06a', glow: 'rgba(60,210,110,A)', head: .4 })); }); },
    impact: S => { const h = hitPt(S); flash('220,255,220', .55); shake(12, 750); for (let k = 0; k < 4; k++) later(k * 80, () => shock(h.x, h.y, { r1: 110 + k * 40, col: '90,230,130', w: 10, ms: 620 })); } });
  reg('Spirit Break', { dash: S => AURA.speed(S, '#ff9ad0'), impact: S => { const h = hit(S, { size: 1.4, shk: 8, col: '255,190,230', star: '#ffb0e0', lines: true }); sparks(h.x, h.y, 16, { cols: ['#ffffff', '#ff9ad0'], v: [120, 260], grav: 60 }); } });
  reg('Overdrive', { exec: S => { const b = body(S); shake(7, 600); for (let k = 0; k < 5; k++) later(k * 80, () => { shock(b.i, b.j, { r1: 90 + k * 36, col: k % 2 ? '255,240,120' : '200,120,255', w: 6, ms: 520 }); }); EX.electric(b.i, b.j, .7); },
    impact: S => { const h = hitPt(S); EX.electric(h.x, h.y, 1); } });
})();
