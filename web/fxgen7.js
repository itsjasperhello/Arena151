/* =====================================================================
   Section 45: Alola (Gen 7) move effects — signature moves get full
   cinematics; built on the shared toolkit (FXK) and particles (PFX).
   ===================================================================== */
(function alolaMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const o = Object.assign({}, MFX[n] || {});
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; } MFX[n] = o; } };
  const slash = (S, strokes, o) => { try { PFX4.slashSet(S, strokes, o); } catch (e) { } };
  reg('Spirit Shackle', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.strokeStyle = '#c8a0ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 14, y); c.lineTo(x + 8, y); c.stroke(); c.fillStyle = '#e8dcff'; c.beginPath(); c.moveTo(x + 8, y - 5); c.lineTo(x + 16, y); c.lineTo(x + 8, y + 5); c.fill(); c.restore();
      if (Math.random() < .7) spawn({ x, y, vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .95, max: .4, r: rnd(3, 6), a: .5, img: PFX.hueTex(270, 60, 60), add: true }); },
    impact: S => { const h = hitPt(S); EX.ghost(h.x, h.y, 1); for (let k = 0; k < 3; k++) later(k * 70, () => shock(h.x, h.b.feet, { r1: 40 + k * 18, col: '170,120,255', w: 4, squash: .4, ms: 380 })); } });
  reg('Darkest Lariat', { dash: S => { const b = body(S); spawn({ kind: 'fn', x: b.i, y: b.j, max: .25, draw: (c, q) => { const bb = body(S); c.save(); c.strokeStyle = `rgba(150,40,60,${1 - q})`; c.lineWidth = 5; for (let i = 0; i < 2; i++) { const a = clock.t / 50 + i * Math.PI; c.beginPath(); c.arc(bb.i, bb.j, 26 * bb.k, a, a + 1.6); c.stroke(); } c.restore(); } }); AURA.flame(S); },
    impact: S => { const h = hit(S, { size: 1.6, shk: 10, col: '200,60,80', star: '#ff6a7a', lines: true }); EX.fire(h.x, h.y, .7); shock(h.x, h.y, { r1: 110, col: '150,30,60', w: 8, ms: 500 }); } });
  reg('Sparkling Aria', { exec: S => { const a = body(S), t = body(other(S)); for (let n = 0; n < N(18); n++) later(n * 40, () => { const y0 = a.j + rnd(-20, 20); spawn({ kind: 'fn', x: a.i, y: y0, max: .8, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = y0 + (t.j - y0) * q + Math.sin(q * 10 + n) * 12;
      c.save(); c.globalAlpha = 1 - q * .5; if (n % 3) { c.strokeStyle = '#bfe8ff'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 6, 0, T); c.stroke(); } else { c.fillStyle = '#7ad8ff'; c.font = 'bold 15px serif'; c.textAlign = 'center'; c.fillText('♪', x, y); } c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); EX.water(h.x, h.y, 1); sparks(h.x, h.y, 16, { cols: ['#ffffff', '#bfe8ff'], v: [100, 240], grav: 40 }); } });
  reg('Sunsteel Strike', { exec: S => { const b = body(S); windup(S, '255,220,120', 15, 34); dim(.4, 1100, '30,20,0'); glowAt(b.i, b.j, 60 * b.k, '255,230,140', 800, .9); },
    dash: S => { const b = body(S); glowAt(b.i, b.j, 40 * b.k, '255,230,140', 140, .8); ghostEvery(S, 40, '#ffe08a', 320, .6); speedLines(b.i, b.j, '#fff2c8', 160, 8); },
    impact: S => { const h = hit(S, { size: 1.9, shk: 12, col: '255,240,180', star: '#fff2b0', lines: true, fl: .5, flc: '#fffbe8' }); for (let k = 0; k < 4; k++) later(k * 80, () => shock(h.x, h.y, { r1: 100 + k * 40, col: '255,220,120', w: 9, ms: 560 })); } });
  reg('Moongeist Beam', { exec: S => { const a = body(S), t = body(other(S)); dim(.55, 1300, '10,0,30'); windup(S, '180,140,255', 270, 32);
      later(200, () => { for (let k = 0; k < 3; k++) later(k * 60, () => ribbon(linePath(a.i, a.j - 8 + k * 8, t.i, t.j - 8 + k * 8, 0), { w: 20 - k * 5, ms: 700, core: '#ffffff', edge: '#8a5aff', glow: 'rgba(130,90,255,A)', head: .4 })); }); },
    impact: S => { const h = hitPt(S); flash('220,200,255', .5); shake(10, 600); EX.ghost(h.x, h.y, 1.5); spawn({ kind: 'fn', x: h.x, y: h.y, max: .8, draw: (c, q) => { c.save(); c.globalAlpha = 1 - q; c.fillStyle = '#e8dcff'; c.beginPath(); c.arc(h.x, h.y - 40, 26, 0, T); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(h.x + 10, h.y - 46, 24, 0, T); c.fill(); c.restore(); } }); } });
  reg('Photon Geyser', { impact: S => { const h = hitPt(S), b = h.b; dim(.5, 1200, '10,10,20'); flash('255,255,255', .6); shake(11, 700);
      pillar(b.i, b.feet, { w: 70 * b.k, h: 320, ms: 1000, col: '255,250,220' }); for (let k = 0; k < 4; k++) later(k * 80, () => shock(h.x, b.feet, { r1: 110 + k * 30, col: '255,240,200', w: 9, squash: .4, ms: 600 }));
      sparks(h.x, h.y, 36, { cols: ['#ffffff', '#fff2c8', '#c8d8ff'], v: [200, 460], grav: -60 }); } });
  reg('Spectral Thief', { exec: S => { ghost(S, '#1a1a2a', 500, .8); dim(.45, 900, '5,5,10'); }, dash: S => { ghostEvery(S, 40, '#2a2a3a', 280, .6); AURA.smoke(S); },
    impact: S => { const h = hit(S, { size: 1.5, shk: 9, col: '120,220,140', star: '#7aff9a' }); EX.ghost(h.x, h.y, 1.1); const a = body(S); glowAt(a.i, a.j, 30 * a.k, '120,220,140', 400, .6); } });
  reg('Plasma Fists', { dash: S => { AURA.speed(S, '#7ad8ff'); ghostEvery(S, 45, '#5ab4ff', 220, .5); },
    impact: S => { const h0 = hitPt(S); for (let k = 0; k < 3; k++) later(k * 80, () => { const x = h0.x + rnd(-14, 14), y = h0.y + rnd(-12, 8); star(x, y, { size: 18 + k * 4, col: '#bfe8ff' }); EX.electric(x, y, .6); shake(3 + k, 140); }); } });
  reg('Fleur Cannon', { exec: S => { const a = body(S), t = body(other(S)); dim(.45, 1100, '30,0,20'); windup(S, '255,150,210', 270, 30);
      later(200, () => ribbon(linePath(a.i, a.j, t.i, t.j, 0), { w: 24, ms: 680, core: '#ffffff', edge: '#ff6ac0', glow: 'rgba(255,100,190,A)', head: .4 })); },
    impact: S => { const h = hitPt(S); flash('255,220,240', .5); shake(10, 600); EX.psychic(h.x, h.y, 1.4); for (let k = 0; k < 3; k++) later(k * 80, () => shock(h.x, h.y, { r1: 100 + k * 40, col: '255,150,210', w: 8, ms: 560 })); } });
  reg('Clanging Scales', { exec: S => { const b = body(S); shake(9, 700); for (let k = 0; k < 5; k++) later(k * 70, () => shock(b.i, b.j, { r1: 110 + k * 40, col: k % 2 ? '255,220,120' : '200,160,255', w: 8 - k, ms: 600 }));
      for (let n = 0; n < N(20); n++) spawn({ kind: 'shard', x: b.i, y: b.j, vx: rnd(-220, 220), vy: rnd(-200, 100), drag: .95, max: .6, r: rnd(1.8, 3), a: 1, col: n % 2 ? '#ffd870' : '#c8a8ff', rot: rnd(0, T), vr: rnd(-12, 12) }); } });
  reg('Multi-Attack', { dash: S => { const b = body(S); glowAt(b.i, b.j, 34 * b.k, `${rnd(150, 255) | 0},${rnd(150, 255) | 0},${rnd(150, 255) | 0}`, 140, .6); ghostEvery(S, 45, '#e0e0ff', 260, .5); },
    impact: S => { const h = hit(S, { size: 1.6, shk: 9, col: '240,240,255', star: '#ffffff', lines: true }); sparks(h.x, h.y, 30, { cols: ['#ff7a7a', '#ffd84a', '#7aff9a', '#7ad8ff', '#c890ff'], v: [160, 360], grav: 80 }); } });
  reg('Double Iron Bash', { dash: S => { AURA.speed(S, '#dfe6f0'); ghostEvery(S, 55, '#c8d0dc', 220, .45); },
    impact: S => { const h0 = hitPt(S); for (let k = 0; k < 2; k++) later(k * 160, () => { const x = h0.x + (k ? 14 : -14); spawn({ kind: 'fn', x, y: h0.y, max: .4, draw: (c, q) => { c.save(); c.globalAlpha = 1 - q; c.translate(x, h0.y); c.rotate(q * 3); c.fillStyle = '#c8d0dc'; c.strokeStyle = '#6a7484'; c.lineWidth = 1.5; c.beginPath(); for (let t = 0; t < 6; t++) c.lineTo(Math.cos(t / 6 * T) * 14, Math.sin(t / 6 * T) * 14); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#6a7484'; c.beginPath(); c.arc(0, 0, 5, 0, T); c.fill(); c.restore(); } });
      later(60, () => { sparks(x, h0.y, 14, { cols: ['#ffffff', '#ffe8a0'], v: [140, 300], grav: 240 }); shake(6 + k * 3, 200); }); }); } });
  reg('Mind Blown', { exec: S => { const b = body(S); windup(S, '255,150,60', 15, 30); glowAt(b.i, b.j - b.h * .6, 40 * b.k, '255,180,80', 500, .8); later(400, () => { EX.fire(b.i, b.j - b.h * .6, .9); shake(6, 300); }); },
    impact: S => { const h = hitPt(S); flash('255,210,150', .6); shake(12, 700); EX.fire(h.x, h.y, 1.7); for (let k = 0; k < 3; k++) later(k * 90, () => shock(h.x, h.y, { r1: 120 + k * 40, col: '255,150,60', w: 10, ms: 600 })); } });
  reg('Beak Blast', { exec: S => { const b = body(S); glowAt(b.i, b.j, 40 * b.k, '255,140,60', 700, .7); windup(S, '255,140,60', 15, 22); },
    dash: S => { AURA.flame(S); ghostEvery(S, 50, '#ff8a3a', 220, .45); }, impact: S => { const h = hit(S, { size: 1.5, shk: 9, col: '255,180,100', star: '#ffb040', lines: true }); EX.fire(h.x, h.y, .9); } });
  reg('Liquidation', { dash: S => { const b = body(S); spawn({ kind: 'fn', x: b.i, y: b.j, max: .2, draw: (c, q) => { const bb = body(S); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(120,200,255,${.8 * (1 - q)})`; c.lineWidth = 4; c.beginPath(); c.arc(bb.i, bb.j, 24 * bb.k, clock.t / 60, clock.t / 60 + 4); c.stroke(); c.restore(); } }); },
    impact: S => { const h = hit(S, { size: 1.4, shk: 8, col: '170,220,255', star: '#bfe8ff' }); EX.water(h.x, h.y, 1.2); } });
  reg('Accelerock', { dash: S => { AURA.dust(S); ghostEvery(S, 40, '#c0a070', 200, .5); speedLines(body(S).i, body(S).j, '#e0c8a0', 140, 8); },
    impact: S => { const h = hit(S, { size: 1.1, shk: 5, col: '220,190,140', star: '#ffe0a0' }); debris(h.x, h.y, 8); } });
})();
