/* =====================================================================
   Section 43: Kalos (Gen 6) move effects — legendary signatures get
   full cinematics; built on the shared toolkit (FXK) and particles (PFX).
   ===================================================================== */
(function kalosMoveFx() {
  if (!window.FXK || !window.PFX || !window.PFX3 || typeof MFX === 'undefined') return;
  const { body, dim, flash, shake, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, rnd, N, T } = FXK;
  const { AURA, hit, windup, ghostEvery, hitPt } = PFX3;
  const spawn = PFX.spawn;
  const reg = (names, r) => { for (const n of names.split('|')) { const o = Object.assign({}, MFX[n] || {});
    for (const k of ['exec', 'impact', 'dash', 'shot']) if (r[k]) { const f = r[k]; o[k] = (...a) => { try { return f(...a); } catch (e) { console.error(e); } }; } MFX[n] = o; } };
  const slash = (S, strokes, o) => { try { PFX4.slashSet(S, strokes, o); } catch (e) { } };
  const drainBack = (S, col) => { const a = body(S), t = body(other(S)); for (let n = 0; n < N(12); n++) later(200 + n * 40, () => { const y0 = t.j + rnd(-14, 14); spawn({ kind: 'fn', x: t.i, y: y0, max: .5, draw: (c, q) => { const x = t.i + (a.i - t.i) * q, y = y0 + (a.j - y0) * q - Math.sin(q * Math.PI) * 30;
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${col},${1 - q * .5})`; c.beginPath(); c.arc(x, y, 3.5, 0, T); c.fill(); c.restore(); } }); }); later(700, () => glowAt(a.i, a.j, 36 * a.k, col, 400, .5)); };
  // ---- Geomancy: a rainbow aura blooms (Xerneas) ----
  reg('Geomancy', { exec: S => { const b = body(S); dim(.45, 1400, '0,10,30'); magicCircle(S, '180,220,255', 1300, 1.5);
      for (let n = 0; n < N(40); n++) later(rnd(0, 900), () => { const a0 = rnd(0, T); spawn({ kind: 'fn', x: b.i, y: b.j, max: 1, draw: (c, q) => { const a = a0 + q * 3, r = (20 + q * 50) * b.k, x = b.i + Math.cos(a) * r, y = b.j - q * 40 + Math.sin(a) * r * .5;
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `hsla(${(n * 30 + q * 120) % 360},90%,70%,${1 - q})`; c.beginPath(); c.arc(x, y, 3, 0, T); c.fill(); c.restore(); } }); });
      pillar(b.i, b.feet, { w: 40 * b.k, h: 220, ms: 1100, col: '200,230,255' }); } });
  // ---- Oblivion Wing: a crimson beam that drains life back (Yveltal) ----
  reg('Oblivion Wing', { exec: S => { const a = body(S), t = body(other(S)); dim(.5, 1100, '30,0,5'); windup(S, '220,40,60', 270, 30);
      ribbon(linePath(a.i, a.j, t.i, t.j, 0), { w: 18, ms: 560, core: '#ffd0d8', edge: '#c0102a', glow: 'rgba(200,20,40,A)', head: .4 }); },
    impact: S => { const h = hitPt(S); flash('255,160,170', .4); shake(9, 500); EX.ghost(h.x, h.y, 1.2); drainBack(S, '255,80,100'); } });
  // ---- Thousand Arrows: a rain of green arrows (Zygarde) ----
  reg('Thousand Arrows', { impact: S => { const h = hitPt(S), b = h.b; dim(.4, 1000, '0,20,10'); shake(9, 900);
      for (let k = 0; k < N(24); k++) later(rnd(0, 700), () => { const tx = b.i + rnd(-60, 60) * b.k, ty = b.feet + rnd(-10, 10), sy = ty - 260;
        spawn({ kind: 'fn', x: tx, y: sy, max: .2, draw: (c, q) => { const y = sy + (ty - sy) * q; c.save(); c.strokeStyle = '#7aff6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx, y - 22); c.lineTo(tx, y); c.stroke(); c.fillStyle = '#d8ffc8'; c.beginPath(); c.moveTo(tx - 4, y - 4); c.lineTo(tx + 4, y - 4); c.lineTo(tx, y + 4); c.fill(); c.restore(); } });
        later(200, () => { debris(tx, ty, 3); shock(tx, ty, { r1: 22, col: '120,255,110', w: 3, squash: .4, ms: 260 }); }); }); } });
  // ---- Diamond Storm: a storm of glittering diamonds (Diancie) ----
  reg('Diamond Storm', { impact: S => { const h = hitPt(S), b = h.b; flash('255,230,250', .35); shake(8, 600);
      for (let n = 0; n < N(40); n++) later(rnd(0, 500), () => { const a0 = rnd(0, T); spawn({ kind: 'fn', x: b.i, y: b.j, max: .8, draw: (c, q) => { const a = a0 + q * 6, r = (60 - q * 40) * b.k, x = b.i + Math.cos(a) * r, y = b.j + Math.sin(a) * r * .5;
        c.save(); c.globalAlpha = 1 - q * .5; c.translate(x, y); c.rotate(a); c.fillStyle = n % 2 ? '#ffd0ef' : '#ffffff'; c.strokeStyle = '#ff90d0'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -6); c.lineTo(4, 0); c.lineTo(0, 6); c.lineTo(-4, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); } }); });
      later(500, () => { star(h.x, h.y, { size: 36, col: '#ffe8f8' }); shock(h.x, h.y, { r1: 110, col: '255,190,230', w: 8, ms: 520 }); }); } });
  // ---- Hyperspace Hole: a portal opens beside the target (Hoopa) ----
  reg('Hyperspace Hole', { impact: S => { const h = hitPt(S), b = h.b; dim(.4, 1000, '20,0,30');
      spawn({ kind: 'fn', x: b.i, y: b.j, max: .9, draw: (c, q) => { const k = q < .2 ? q / .2 : q > .8 ? (1 - q) / .2 : 1, x = b.i - 34 * b.k, y = b.j; c.save(); c.globalAlpha = k; c.strokeStyle = '#ffd84a'; c.lineWidth = 5; c.beginPath(); c.ellipse(x, y, 16 * b.k, 30 * b.k, 0, 0, T); c.stroke();
        const g = c.createRadialGradient(x, y, 0, x, y, 28 * b.k); g.addColorStop(0, 'rgba(40,0,60,.95)'); g.addColorStop(1, 'rgba(160,60,220,.4)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 14 * b.k, 27 * b.k, 0, 0, T); c.fill(); c.restore(); } });
      later(350, () => { flash('230,200,255', .3); shake(8, 400); EX.psychic(h.x, h.y, 1.2); shock(h.x, h.y, { r1: 90, col: '200,120,255', w: 7, ms: 480 }); }); } });
  // ---- Steam Eruption: a scalding steam geyser (Volcanion) ----
  reg('Steam Eruption', { impact: S => { const h = hitPt(S), b = h.b; shake(10, 700); pillar(b.i, b.feet, { w: 54 * b.k, h: 240, ms: 900, col: '230,240,255' });
      for (let n = 0; n < N(30); n++) later(rnd(0, 600), () => spawn({ x: b.i + rnd(-24, 24) * b.k, y: b.feet - rnd(0, 40), vx: rnd(-30, 30), vy: rnd(-160, -60), drag: .97, max: 1, r: rnd(8, 14), grow: 1.2, a: .45, img: PFX.steamTex() }));
      EX.water(h.x, h.y, 1.1); later(200, () => EX.fire(h.x, h.y, .8)); } });
  // ---- Water Shuriken: spinning water stars ----
  reg('Water Shuriken', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.translate(x, y); c.rotate(clock.t / 40); c.fillStyle = 'rgba(120,200,255,.95)'; c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
      c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * T, r = k % 2 ? 3.5 : 10; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.restore(); },
    impact: S => { const h = hitPt(S); EX.water(h.x, h.y, .7); } });
  // ---- Mystical Fire: a ring of mystic flame ----
  reg('Mystical Fire', { shot: p => { const c = bctx, x = bx(p.x), y = by(p.y); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,140,200,.9)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 9 + Math.sin(clock.t / 60) * 2, 0, T); c.stroke(); c.fillStyle = 'rgba(255,180,90,.9)'; c.beginPath(); c.arc(x, y, 5, 0, T); c.fill(); c.restore(); },
    impact: S => { const h = hitPt(S); EX.fire(h.x, h.y, .9); EX.psychic(h.x, h.y, .6); } });
  // ---- Draining Kiss: hearts that drain HP ----
  reg('Draining Kiss', { impact: S => { const h = hitPt(S); for (let n = 0; n < N(6); n++) later(n * 60, () => { const x = h.x + rnd(-16, 16), y = h.y + rnd(-14, 6); spawn({ kind: 'fn', x, y, max: .6, draw: (c, q) => { c.save(); c.globalAlpha = 1 - q; c.fillStyle = '#ff7ac0'; const s = 1 + q; c.beginPath(); c.moveTo(x, y + 4 * s); c.bezierCurveTo(x - 7 * s, y - 2 * s, x - 3 * s, y - 8 * s, x, y - 3 * s); c.bezierCurveTo(x + 3 * s, y - 8 * s, x + 7 * s, y - 2 * s, x, y + 4 * s); c.fill(); c.restore(); } }); }); drainBack(S, '255,140,200'); } });
  // ---- Flying Press: a diving body slam ----
  reg('Flying Press', { exec: S => windup(S, '200,230,255', 270, 20), dash: S => { AURA.speed(S, '#dff0ff'); ghostEvery(S, 50, '#c8e0ff', 240, .45); },
    impact: S => { const h = hit(S, { size: 1.6, shk: 10, col: '230,240,255', star: '#ffffff', lines: true }); shock(h.x, h.b.feet, { r1: 100, col: '200,225,255', w: 8, squash: .4, ms: 480 }); debris(h.x, h.b.feet, 10); } });
  // ---- Phantom Force: the user vanishes, then strikes ----
  reg('Phantom Force', { exec: S => { ghost(S, '#2a1a3a', 600, .8); dim(.45, 1000, '5,0,15'); }, dash: S => { ghostEvery(S, 40, '#3a2a5a', 320, .6); AURA.smoke(S); },
    impact: S => { const h = hit(S, { size: 1.4, shk: 8, col: '170,120,255', star: '#a080ff' }); EX.ghost(h.x, h.y, 1.1); } });
  // ---- Boomburst: huge sound rings ----
  reg('Boomburst', { exec: S => { const b = body(S); shake(10, 700); flash('255,250,230', .3); for (let k = 0; k < 6; k++) later(k * 70, () => shock(b.i, b.j, { r1: 120 + k * 40, col: k % 2 ? '255,255,255' : '255,230,170', w: 8 - k, ms: 620 })); },
    impact: S => { const h = hitPt(S); star(h.x, h.y, { size: 30, col: '#fff2c8' }); } });
  // ---- Petal Blizzard: a whirl of petals ----
  reg('Petal Blizzard', { exec: S => { const b = body(S); for (let n = 0; n < N(40); n++) later(rnd(0, 500), () => { const a0 = rnd(0, T); spawn({ kind: 'fn', x: b.i, y: b.j, max: .9, draw: (c, q) => { const a = a0 + q * 6, r = (20 + q * 80) * b.k, x = b.i + Math.cos(a) * r, y = b.j + Math.sin(a) * r * .5;
      c.save(); c.globalAlpha = 1 - q; c.translate(x, y); c.rotate(a * 2); c.fillStyle = n % 3 ? '#ff9ad0' : '#ffd8ee'; c.beginPath(); c.ellipse(0, 0, 4.5, 2.4, 0, 0, T); c.fill(); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); sparks(h.x, h.y, 14, { cols: ['#ffd8ee', '#ff9ad0'], v: [100, 240], grav: 60 }); } });
  // ---- Parabolic Charge: electric draining arcs ----
  reg('Parabolic Charge', { exec: S => { const b = body(S); glowAt(b.i, b.j, 50 * b.k, '255,240,120', 500, .6); for (let k = 0; k < 3; k++) later(k * 80, () => shock(b.i, b.j, { r1: 70 + k * 30, col: '255,240,120', w: 5, ms: 420 })); },
    impact: S => { const h = hitPt(S); EX.electric(h.x, h.y, .9); drainBack(S, '255,240,120'); } });
  // ---- Power-Up Punch: a glowing fist ----
  reg('Power-Up Punch', { dash: S => { AURA.speed(S, '#ffb070'); ghostEvery(S, 55, '#ff9a5a', 200, .4); },
    impact: S => { const h = hit(S, { size: 1.1, shk: 5, col: '255,190,120', star: '#ffa060' }); const a = body(S); glowAt(a.i, a.j, 30 * a.k, '255,150,80', 400, .6); } });
  // ======== milestone 3: nine more Kalos moves ========
  reg('Freeze-Dry', { exec: S => { const a = body(S), t = body(other(S)); ribbon(linePath(a.i, a.j, t.i, t.j, 0), { w: 12, ms: 460, core: '#ffffff', edge: '#7ad0ff', glow: 'rgba(120,200,255,A)', head: .5 }); },
    impact: S => { const h = hitPt(S); EX.ice(h.x, h.y, 1); for (let n = 0; n < N(14); n++) spawn({ kind: 'shard', x: h.x, y: h.y, vx: rnd(-160, 160), vy: rnd(-180, 40), ay: 260, drag: .97, max: .6, r: rnd(1.4, 2.4), a: 1, col: n % 2 ? '#ffffff' : '#bfe8ff', rot: rnd(0, T), vr: rnd(-10, 10) }); } });
  reg('Nuzzle', { dash: S => AURA.speed(S, '#fff27a'), impact: S => { const h = hit(S, { size: .9, shk: 3, col: '255,245,150', star: '#fff27a' }); EX.electric(h.x, h.y, .6); sparks(h.x, h.y, 10, { cols: ['#ffffff', '#fff27a'], v: [100, 200], grav: 120 }); } });
  reg('Fell Stinger', { dash: S => { AURA.speed(S, '#c8f070'); ghostEvery(S, 55, '#a8d050', 200, .4); },
    impact: S => { const h = hitPt(S); ribbon(linePath(h.x - 40, h.y - 10, h.x + 6, h.y + 2, 0), { w: 6, ms: 260, core: '#ffffff', edge: '#9ad04a', glow: 'rgba(150,210,70,A)', head: .9 }); star(h.x, h.y, { size: 18, col: '#d8ff9a' }); shake(4, 200); } });
  reg('Light of Ruin', { exec: S => { const a = body(S), t = body(other(S)); dim(.5, 1300, '30,0,20'); windup(S, '255,160,220', 290, 34);
      later(250, () => { for (let k = 0; k < 3; k++) later(k * 70, () => ribbon(linePath(a.i, a.j - 8 + k * 8, t.i, t.j - 8 + k * 8, 0), { w: 22 - k * 6, ms: 700, core: '#ffffff', edge: '#ff6ac0', glow: 'rgba(255,90,190,A)', head: .4 })); }); },
    impact: S => { const h = hitPt(S); flash('255,220,240', .6); shake(12, 700); EX.psychic(h.x, h.y, 1.6); for (let k = 0; k < 4; k++) later(k * 80, () => shock(h.x, h.y, { r1: 90 + k * 40, col: '255,150,215', w: 9, ms: 600 })); } });
  reg('Thousand Waves', { exec: S => { const a = body(S), t = body(other(S)); shake(8, 800);
      for (let k = 0; k < 4; k++) later(k * 120, () => ribbon(linePath(a.i, a.feet - 4 - k * 6, t.i, t.feet - 4 - k * 6, -16), { w: 16 - k * 3, ms: 520, core: '#e8f8c8', edge: '#5aa04a', glow: 'rgba(110,190,80,A)', head: .4 })); },
    impact: S => { const h = hitPt(S); debris(h.x, h.b.feet, 18); shock(h.x, h.b.feet, { r1: 130, col: '130,200,90', w: 9, squash: .4, ms: 560 }); } });
  reg('Hyperspace Fury', { impact: S => { const h = hitPt(S), b = h.b; dim(.45, 1000, '20,0,30');
      for (let k = 0; k < 5; k++) later(k * 110, () => { const ox = rnd(-50, 50) * b.k, oy = rnd(-40, 20) * b.k; spawn({ kind: 'fn', x: b.i, y: b.j, max: .35, draw: (c, q) => { c.save(); c.strokeStyle = `rgba(255,216,74,${1 - q})`; c.lineWidth = 4; c.beginPath(); c.ellipse(b.i + ox, b.j + oy, 12, 12, 0, 0, T); c.stroke(); c.restore(); } });
        later(120, () => { star(b.i + ox * .4, b.j + oy * .4, { size: 20, col: '#c890ff' }); shake(4 + k, 150); }); }); later(650, () => EX.ghost(h.x, h.y, 1.2)); } });
  reg('Belch', { exec: S => { const b = body(S); for (let n = 0; n < N(20); n++) later(rnd(0, 300), () => spawn({ x: b.i, y: b.j - 6, vx: rnd(60, 220) * (body(other(S)).i > b.i ? 1 : -1), vy: rnd(-50, 30), drag: .95, max: .9, r: rnd(8, 14), grow: 1, a: .55, img: PFX.hueTex(285, 60, 45) })); },
    impact: S => { const h = hitPt(S); try { EX.poison(h.x, h.y, 1.1); } catch (e) { } puff(h.x, h.y, 10, { r: [12, 22] }); } });
  reg('Parting Shot', { exec: S => { const a = body(S), t = body(other(S)); dim(.25, 600, '15,0,20'); for (let k = 0; k < 3; k++) later(k * 90, () => shock(t.i, t.j, { r1: 40 + k * 16, col: '120,70,170', w: 4, ms: 360 })); glowAt(a.i, a.j, 30 * a.k, '110,60,160', 400, .5); } });
  reg('Venom Drench', { exec: S => { const t = body(other(S)); for (let n = 0; n < N(26); n++) later(rnd(0, 400), () => spawn({ kind: 'drop', x: t.i + rnd(-26, 26) * t.k, y: t.j - t.h * .9, vx: rnd(-20, 20), vy: rnd(40, 120), ay: 420, drag: .99, max: .6, r: rnd(1.6, 3), a: .95, col: n % 2 ? '#8a3ab0' : '#c070e0' })); glowAt(t.i, t.j, 40 * t.k, '160,70,200', 500, .5); } });
  // ---- Disarming Voice: pink sound hearts ----
  reg('Disarming Voice', { exec: S => { const a = body(S), t = body(other(S)); for (let k = 0; k < 5; k++) later(k * 70, () => { spawn({ kind: 'fn', x: a.i, y: a.j, max: .5, draw: (c, q) => { const x = a.i + (t.i - a.i) * q, y = a.j + (t.j - a.j) * q, s = 1.2;
      c.save(); c.globalAlpha = 1 - q * .5; c.fillStyle = '#ff9ad0'; c.beginPath(); c.moveTo(x, y + 4 * s); c.bezierCurveTo(x - 7 * s, y - 2 * s, x - 3 * s, y - 8 * s, x, y - 3 * s); c.bezierCurveTo(x + 3 * s, y - 8 * s, x + 7 * s, y - 2 * s, x, y + 4 * s); c.fill(); c.restore(); } }); }); },
    impact: S => { const h = hitPt(S); shock(h.x, h.y, { r1: 50, col: '255,160,210', w: 4, ms: 360 }); } });
})();
