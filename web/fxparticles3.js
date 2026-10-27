/* =====================================================================
   Section 25: contact and dash moves as cinematic set pieces (v2)
   Every move has phases: a wind-up (energy drawn into the attacker), the
   charge-in (a body-sized aura, afterimages for fast moves), the hit
   (impact star, shockwave, speed lines, shake/flash scaled to power, an
   elemental explosion) and an aftermath (debris, smoke, ground scars).
   Built on the toolkit in fxkit.js.
   ===================================================================== */
(function fxParticles3() {
  const P = window.PFX, K = window.FXK; if (!P || !K) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P;
  const { body, foe, dim, flash, shake, scar, speedLines, shock, star, ribbon, linePath, arcPath, pillar, orb, debris, sparks, puff, glowAt, ghost, EX, later, fx, ease, rnd, N, T } = K;
  const RATE = {}, tick = (S, key, perSec) => due(RATE[S + key] || (RATE[S + key] = {}), perSec);
  const GH = {}; const ghostEvery = (S, ms, col, life = 260, a = .55) => { const now = clock.t; if (!GH[S] || now - GH[S] >= ms) { GH[S] = now; ghost(S, col, life, a); } };
  const around = (b, sx = .6, sy = .6) => { const a = rnd(0, T), r = Math.sqrt(Math.random()); return { x: b.i + Math.cos(a) * b.w * sx * r, y: b.j + Math.sin(a) * b.h * sy * r }; };
  const hitPt = S => { const b = body(S); return { x: b.i, y: b.j, b }; };
  const dustTex = () => P.tex('dust', [[0, 'rgba(200,180,150,.6)'], [.5, 'rgba(180,160,130,.3)'], [1, 'rgba(160,140,110,0)']]);
  function starShape(c, x, y, sz, col) { c.fillStyle = col; c.beginPath(); for (let s = 0; s < 10; s++) { const r = s % 2 ? sz * .45 : sz, an = -Math.PI / 2 + s * Math.PI / 5; s ? c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r) : c.moveTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } c.closePath(); c.fill(); }
  function heartShape(c, x, y, sz, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + sz * .9); c.bezierCurveTo(x - sz * 1.4, y - sz * .2, x - sz * .6, y - sz * 1.2, x, y - sz * .4); c.bezierCurveTo(x + sz * .6, y - sz * 1.2, x + sz * 1.4, y - sz * .2, x, y + sz * .9); c.fill(); }

  /* ---------- the charge-in: auras and trails (every sim tick while dashing) ---------- */
  const AURA = {
    dust: S => { const b = body(S); for (let n = tick(S, 'd', 45); n > 0; n--) spawn({ x: b.i - b.face * rnd(4, 16), y: b.feet + rnd(-2, 2), vx: -b.face * rnd(30, 80), vy: -rnd(10, 40), drag: .95, max: rnd(.4, .8), r: rnd(5, 10) * b.k, grow: 1.4, img: dustTex(), a: .5, add: false }); },
    speed: (S, col = '#ffffff', n = 80) => { const b = body(S); for (let k = tick(S, 's' + col, n); k > 0; k--) spawn({ x: b.i - b.face * rnd(0, 10), y: b.j + rnd(-b.h * .5, b.h * .5), vx: -b.face * rnd(260, 420), vy: 0, drag: .9, max: rnd(.12, .22), r: 1, len: rnd(18, 36) * b.k, lw: rnd(1, 2.2), kind: 'streak', col, a: .9, add: true }); },
    flame: (S, hueLo = 10, span = 32, rate = 300, scale = 1, texF = fireTex) => { const b = body(S); for (let n = tick(S, 'f' + hueLo + rate, rate); n > 0; n--) { const p = around(b, .7 * scale, .7 * scale);
      spawn({ x: p.x, y: p.y, vx: -b.face * rnd(40, 120), vy: -rnd(40, 110), drag: .93, ay: -70, max: rnd(.3, .55), r: rnd(6, 13) * b.k * scale, grow: .6, img: texF(Math.round(hueLo + Math.random() * span)), a: 1, add: true }); } },
    hue: (S, hue, rate = 160, scale = 1, sat = 92) => AURA.flame(S, hue - 12, 24, rate, scale, h => hueTex(((h % 360) + 360) % 360, sat, 64)),
    elec: (S, rate = 70, scale = 1) => { const b = body(S); for (let n = tick(S, 'e', rate); n > 0; n--) { const p = around(b, .7 * scale, .7 * scale);
      spawn({ x: p.x, y: p.y, vx: rnd(-90, 90), vy: rnd(-90, 90), drag: .86, max: rnd(.12, .25), r: rnd(2, 4), grow: .2, img: colTex(Math.random() < .35 ? '#ffffff' : '#ffe84a', 1), a: 1, add: true });
      if (Math.random() < .5) { const x0 = p.x, y0 = p.y, an = rnd(0, T), L = rnd(10, 24) * b.k; fx({ add: true, max: .08, draw: c => { c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#fff6a0'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x0, y0); for (let s = 1; s <= 4; s++) c.lineTo(x0 + Math.cos(an) * L * s / 4 + rnd(-3, 3), y0 + Math.sin(an) * L * s / 4 + rnd(-3, 3)); c.stroke(); } }); } } },
    water: (S, rate = 160) => { const b = body(S); for (let n = tick(S, 'w', rate); n > 0; n--) { const p = around(b, .7, .8);
      spawn({ x: p.x, y: p.y, vx: -b.face * rnd(20, 70) + rnd(-25, 25), vy: rnd(-60, 20), drag: .97, ay: 300, max: rnd(.35, .6), r: rnd(1.4, 2.6), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#cfeeff' : '#7fd0ff', a: 1, add: true }); } },
    frost: S => { const b = body(S); for (let n = tick(S, 'i', 90); n > 0; n--) { const p = around(b, .7, .7); spawn({ x: p.x, y: p.y, vx: -b.face * rnd(30, 80), vy: rnd(-20, 20), drag: .93, max: rnd(.35, .6), r: rnd(2, 4.5), grow: .2, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#aef0ff', rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: true }); } },
    smoke: S => { const b = body(S); for (let n = tick(S, 'k', 70); n > 0; n--) { const p = around(b, .7, .7); spawn({ x: p.x, y: p.y, vx: -b.face * rnd(30, 70), vy: -rnd(10, 40), drag: .96, max: rnd(.5, .8), r: rnd(6, 11) * b.k, grow: 1.2, img: smokeTex(), a: .7, add: false }); } }
  };
  // wind-up: energy drawn into the attacker, with a contracting ring
  function windup(S, col = '255,255,255', hue = null, n = 22) { const b = body(S);
    for (let k = 0; k < N(n); k++) { const a = rnd(0, T), r = rnd(40, 70) * b.k; spawn({ x: b.i + Math.cos(a) * r, y: b.j + Math.sin(a) * r * .7, vx: -Math.cos(a) * r * 3.2, vy: -Math.sin(a) * r * .7 * 3.2, drag: .9, max: .3, r: rnd(2.5, 4.5), grow: -.3, img: hue != null ? hueTex(hue, 90, 68) : colTex('#ffffff', 1), a: 1, add: true }); }
    fx({ add: true, max: .3, draw: (c, q) => { const bb = body(S), r = (1 - ease.out(q)) * 54 * bb.k + 4; c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${col},${.9 * (1 - q * .5)})`; c.lineWidth = 2.2; c.beginPath(); c.ellipse(bb.i, bb.j, r, r * .7, 0, 0, T); c.stroke(); } }); }

  /* ---------- hits ---------- */
  // the core of a physical hit: bloom, comic star, shockwave, sparks; speed lines, shake and flash for the big ones
  function hit(S, o = {}) { const { col = '255,255,255', star: sc = '#ffe24a', size = 1, lines = false, shk = 0, fl = 0, flc = '#ffffff' } = o, h = hitPt(S), k = h.b.k * size;
    glowAt(h.x, h.y, 40 * k, col, 220); star(h.x, h.y, { size: 24 * k, col: sc }); shock(h.x, h.y, { r1: 62 * k, col, w: 5 * k, ms: 360 });
    sparks(h.x, h.y, 14 * k, { cols: ['#ffffff', sc] });
    if (lines) speedLines(h.x, h.y, '#ffffff', 360); if (shk) shake(shk, 160 + shk * 15); if (fl) flash(flc, fl); return h; }
  // fangs that snap shut; Crunch adds a darkening and a violet glint
  function jaws(S, o = {}) { const { col = '#ffffff', size = 1, dark = false, gl = '#ffffff' } = o, h = hitPt(S), k = h.b.k * size;
    fx({ max: .55, draw: (c, q) => { const close = ease.in(Math.min(1, q / .28)), gap = (1 - close) * 30 * k + 2, fade = q > .6 ? 1 - (q - .6) / .4 : 1, w = 36 * k, x = h.x, y = h.y;
      if (dark) { c.globalAlpha = .55 * fade; const g = c.createRadialGradient(x, y, 0, x, y, w * 1.4); g.addColorStop(0, 'rgba(20,0,30,.9)'); g.addColorStop(1, 'rgba(20,0,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, w * 1.4, 0, T); c.fill(); }
      for (const dir of [-1, 1]) { const y0 = y + dir * gap; c.globalAlpha = fade;
        c.fillStyle = dark ? '#2a1438' : '#3a3a4a'; c.beginPath(); c.moveTo(x - w * 1.1, y0 + dir * 10 * k); c.quadraticCurveTo(x, y0 + dir * 22 * k, x + w * 1.1, y0 + dir * 10 * k); c.lineTo(x + w * 1.1, y0); c.lineTo(x - w * 1.1, y0); c.closePath(); c.fill();
        c.fillStyle = col; c.strokeStyle = dark ? '#5a2a7a' : '#7a7a8a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w, y0);
        for (let i = 0; i < 7; i++) { const fx0 = x - w + i * (w * 2 / 7), tip = (i === 1 || i === 5 ? 1.5 : 1) * 12 * k; c.lineTo(fx0 + w / 7, y0 - dir * tip); c.lineTo(fx0 + w * 2 / 7, y0); } c.closePath(); c.fill(); c.stroke(); }
      if (close >= 1 && q < .45) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - (q - .28) / .17; c.fillStyle = gl; c.beginPath(); c.arc(x, y, 10 * k, 0, T); c.fill(); } } });
    later(160, () => { shock(h.x, h.y, { r1: 52 * k, col: dark ? '190,150,255' : '255,255,255', w: 4 * k }); sparks(h.x, h.y, 14 * k, { cols: [dark ? '#c8a0ff' : '#ffffff'] }); shake(dark ? 5 : 3, 140); }); }
  // a flurry of blows around the target
  function flurry(S, n, o = {}) { const { col = '255,220,170', sc = '#ffb050', gap = 70, k0 = 1 } = o;
    for (let i = 0; i < n; i++) later(i * gap, () => { const h = hitPt(S), k = h.b.k * k0, x = h.x + rnd(-.45, .45) * h.b.w, y = h.y + rnd(-.4, .4) * h.b.h;
      star(x, y, { size: 16 * k, col: sc, ms: 200 }); shock(x, y, { r1: 34 * k, col, w: 3.5 * k, ms: 240 }); sparks(x, y, 8 * k, { cols: ['#ffffff', sc], v: [140, 300] });
      const a = rnd(0, T), L = 34 * k; ribbon(linePath(x - Math.cos(a) * L, y - Math.sin(a) * L, x + Math.cos(a) * L * .3, y + Math.sin(a) * L * .3, rnd(-6, 6)), { w: 5 * k, ms: 220, edge: `rgba(${col},.8)`, glow: `rgba(${col},A)` });
      shake(2.5, 70); }); }
  const recoil = (S, f) => later(120, () => { const b = body(S); f(b.i, b.j, b.k); });
  const featherBurst = (x, y, n, cols = ['#eaf6ff', '#9fd8ff']) => { for (let i = 0; i < N(n); i++) { const a = rnd(0, T), v = rnd(80, 240); spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, drag: .93, ay: 50, max: rnd(.8, 1.3), r: rnd(3.5, 6), grow: .1, kind: 'shard', col: cols[i % cols.length], rot: rnd(0, T), vr: rnd(-4, 4), a: 1, add: false }); } };
  // lightning bolts from the sky onto a point
  function skyBolts(x, y, n = 3, gap = 70) { for (let i = 0; i < n; i++) later(i * gap, () => { const x0 = x + rnd(-24, 24);
    fx({ add: true, max: .18, draw: (c, q) => { c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; const pts = [[x0, y - 240]]; let px = x0, py = y - 240; while (py < y) { py = Math.min(y, py + rnd(14, 26)); px += rnd(-12, 12); pts.push([px, py]); }
      for (const [lw, col, a] of [[6, '255,230,90', .3], [2.4, '255,245,160', .85], [1, '255,255,255', 1]]) { c.strokeStyle = `rgba(${col},${a * (1 - q)})`; c.lineWidth = lw; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); } }); }); }

  /* ---------- register ---------- */
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.dash) o.dash = (S, mv) => { try { r.dash(S, mv); } catch (e) { console.error(e); } };
    for (const kk of ['impact', 'exec']) if (r[kk]) { const prev = old[kk]; o[kk] = (...a) => { if (prev) try { prev(...a); } catch (e) { console.error(e); } try { r[kk](...a); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  const fastTrail = (S, col = '#ffffff', ms = 70, a = .35) => { AURA.dust(S); AURA.speed(S, col); ghostEvery(S, ms, col, 220, a); };

  // ---- Normal ----
  reg('Tackle', { exec: S => windup(S), dash: S => fastTrail(S), impact: S => { const h = hit(S, { shk: 3 }); puff(h.x, h.y + 10, 6, { tex: dustTex, r: [6, 10] }); } });
  reg('Headbutt', { exec: S => windup(S), dash: S => fastTrail(S), impact: S => { const h = hit(S, { shk: 4, size: 1.1 });
    later(150, () => fx({ max: .9, draw: (c, q) => { for (let i = 0; i < 3; i++) { const a = q * 9 + i * T / 3; c.globalAlpha = 1 - q; starShape(c, h.x + Math.cos(a) * 18 * h.b.k, h.y - h.b.h * .45 + Math.sin(a) * 5, 5, '#ffe24a'); } } })); } });
  reg('Body Slam', { exec: S => windup(S, '255,240,200'), dash: S => fastTrail(S, '#ffffff', 60, .4),
    impact: S => { dim(.2, 500); const h = hit(S, { size: 1.5, lines: true, shk: 9, fl: .25 }); shock(h.x, h.b.feet, { r1: 120 * h.b.k, col: '230,210,170', w: 8, squash: .32, ms: 520 });
      debris(h.x, h.b.feet - 6, 14 * h.b.k, { floor: h.b.feet + 8 }); puff(h.x, h.b.feet, 18, { tex: dustTex, r: [10, 18], v: [60, 140], up: 10, a: .6 }); scar('crack', h.b.wx, h.b.wy); } });
  reg('Double-Edge', { exec: S => windup(S, '255,210,150'), dash: S => { AURA.speed(S, '#ffd8a0', 110); AURA.hue(S, 30, 140, .8); ghostEvery(S, 55, '#ffc070', 260, .5); },
    impact: S => { hit(S, { col: '255,200,130', sc: '#ffb040', size: 1.5, lines: true, shk: 8, fl: .2, flc: '#ffd8a0' }); recoil(foe(S), (x, y, k) => { sparks(x, y, 20 * k, { cols: ['#ffb050', '#ffffff'] }); star(x, y, { size: 14 * k, col: '#ffb040', ms: 200 }); }); } });

  // ---- punches ----
  reg('Fire Punch', { exec: S => windup(S, '255,170,80', 25), dash: S => { AURA.flame(S, 12, 30, 160, .55); AURA.speed(S, '#ffd8a0', 50); },
    impact: S => { const h = hit(S, { col: '255,180,90', sc: '#ffb040', shk: 4 }); EX.fire(h.x, h.y, h.b.k * .9); scar('scorch', h.b.wx, h.b.wy); } });
  reg('Thunder Punch', { exec: S => windup(S, '255,240,120', 52), dash: S => { AURA.elec(S, 70, .6); AURA.speed(S, '#fff6a0', 50); },
    impact: S => { const h = hit(S, { col: '255,240,140', sc: '#ffe84a', shk: 4, fl: .15, flc: '#fff6a0' }); EX.electric(h.x, h.y, h.b.k * .9); } });
  reg('Ice Punch', { exec: S => windup(S, '200,240,255', 195), dash: S => { AURA.frost(S); AURA.speed(S, '#e4fbff', 50); },
    impact: S => { const h = hit(S, { col: '200,240,255', sc: '#aef0ff', shk: 4 }); EX.ice(h.x, h.y, h.b.k * .9); } });
  reg('Mach Punch', { exec: S => windup(S, '255,220,170', 30, 14), dash: S => { AURA.speed(S, '#ffd8a0', 140); ghostEvery(S, 40, '#ffd8a0', 220, .5); },
    impact: S => hit(S, { col: '255,220,170', sc: '#ffb050', lines: true, shk: 4 }) });
  reg('Brick Break', { exec: S => windup(S, '255,200,140', 22), dash: S => { AURA.hue(S, 25, 120, .7); AURA.speed(S, '#ffd8a0', 60); },
    impact: S => { const h = hitPt(S), k = h.b.k; ribbon(linePath(h.x - 30 * k, h.y - 40 * k, h.x + 22 * k, h.y + 30 * k, 6), { w: 10 * k, ms: 300, core: '#ffffff', edge: 'rgba(255,170,90,.9)', glow: 'rgba(255,140,60,A)', grow: .2 });
      later(80, () => { hit(S, { col: '255,200,140', sc: '#ffb050', size: 1.2, shk: 6 }); debris(h.x, h.y, 14 * k, { cols: [['#b0562e', '#e08a5a'], ['#8a4a2a', '#c87a4a']], floor: h.b.feet + 8 }); }); } });
  reg('Close Combat', { exec: S => { windup(S, '255,190,120', 22, 30); dim(.35, 1500); }, dash: S => { AURA.hue(S, 22, 220, 1); AURA.speed(S, '#ffd8a0', 90); ghostEvery(S, 55, '#ffb070', 240, .45); },
    impact: S => { flurry(S, 8, { gap: 65 }); later(560, () => { const h = hit(S, { col: '255,200,130', sc: '#ff9a30', size: 1.9, lines: true, shk: 10, fl: .3, flc: '#ffd8a0' }); sparks(h.x, h.y, 30, { cols: ['#ffffff', '#ffb050'], v: [200, 420] }); scar('crack', h.b.wx, h.b.wy); }); } });

  // ---- full-body charges ----
  reg('Flare Blitz', { exec: S => { windup(S, '255,160,60', 20, 34); dim(.38, 1400, '40,10,0'); }, dash: S => { AURA.flame(S, 8, 36, 520, 1.25); AURA.speed(S, '#ffd090', 80); ghostEvery(S, 45, '#ff9a40', 300, .55); },
    impact: S => { const h = hit(S, { col: '255,170,70', sc: '#ff8a20', size: 1.8, lines: true, shk: 11, fl: .4, flc: '#ffb060' }); EX.fire(h.x, h.y, h.b.k * 1.7); later(120, () => EX.fire(h.x + rnd(-20, 20), h.y - 10, h.b.k)); scar('scorch', h.b.wx, h.b.wy);
      pillar(h.x, h.b.feet, { w: 26 * h.b.k, h: 150, col: '255,160,60', ms: 700 }); recoil(foe(S), (x, y, k) => EX.fire(x, y, k * .5)); } });
  reg('Volt Tackle', { exec: S => { windup(S, '255,240,120', 52, 34); dim(.4, 1400, '10,10,30'); },
    dash: S => { AURA.elec(S, 180, 1.1); AURA.speed(S, '#fff6a0', 90); ghostEvery(S, 45, '#fff080', 280, .55); const b = body(S); if (Math.random() < .5) fx({ add: true, max: .05, draw: c => orb(c, b.i, b.j, b.h * .62, { core: '255,255,255', mid: '255,230,90', rim: '255,255,200', arcs: 4, pulse: .12 }) }); },
    impact: S => { const h = hit(S, { col: '255,240,140', sc: '#ffe84a', size: 1.8, lines: true, shk: 11, fl: .45, flc: '#fff6a0' }); EX.electric(h.x, h.y, h.b.k * 1.7); skyBolts(h.x, h.y, 3);
      recoil(foe(S), (x, y, k) => sparks(x, y, 22 * k, { cols: ['#fff080', '#ffffff'] })); } });
  reg('Brave Bird', { exec: S => { windup(S, '170,220,255', 205, 34); dim(.38, 1400, '0,10,40'); },
    dash: S => { const b = body(S); AURA.hue(S, 205, 360, 1.2, 95); AURA.speed(S, '#d8f0ff', 90); ghostEvery(S, 45, '#9fd8ff', 300, .55);
      if (Math.random() < .35) for (const s of [-1, 1]) ribbon(t => [b.i - b.face * t * 60 * b.k, b.j + s * (t * 34 * b.k) - Math.sin(t * Math.PI) * 10 * s], { w: 10 * b.k, ms: 220, core: '#ffffff', edge: 'rgba(120,200,255,.85)', glow: 'rgba(90,170,255,A)', grow: .15 }); },
    impact: S => { const h = hit(S, { col: '170,220,255', sc: '#9fd8ff', size: 1.8, lines: true, shk: 11, fl: .4, flc: '#cfeaff' }); featherBurst(h.x, h.y, 26);
      glowAt(h.x, h.y, 70 * h.b.k, '140,200,255', 420); shock(h.x, h.y, { r1: 110 * h.b.k, col: '160,215,255', w: 8, ms: 520 }); recoil(foe(S), (x, y, k) => sparks(x, y, 16 * k, { cols: ['#9fd8ff', '#ffffff'] })); } });
  reg('Outrage', { exec: S => { windup(S, '255,90,70', 8, 34); dim(.42, 1700, '60,0,0'); }, dash: S => { AURA.flame(S, 0, 18, 360, 1.2); AURA.smoke(S); ghostEvery(S, 55, '#ff5a40', 280, .5); },
    impact: S => { for (let i = 0; i < 3; i++) later(i * 170, () => { const h = hit(S, { col: '255,110,90', sc: '#ff4a30', size: 1.3 + i * .2, lines: i === 2, shk: 6 + i * 3, fl: i === 2 ? .3 : 0, flc: '#ff8a70' }); EX.dragon(h.x, h.y, h.b.k * (1 + i * .25)); }); } });
  reg('Waterfall', { exec: S => windup(S, '160,220,255', 205, 26), dash: S => { AURA.water(S, 260); const b = body(S); if (Math.random() < .3) pillar(b.i, b.feet, { w: 18 * b.k, h: 110, col: '120,200,255', ms: 240 }); },
    impact: S => { const h = hit(S, { col: '170,225,255', sc: '#9fd8ff', size: 1.3, shk: 6 }); EX.water(h.x, h.y, h.b.k * 1.5); pillar(h.x, h.b.feet, { w: 34 * h.b.k, h: 200, col: '120,200,255', ms: 600 }); scar('splat', h.b.wx, h.b.wy); } });
  reg('Drill Run', { exec: S => windup(S, '220,190,140'), dash: S => { const b = body(S); AURA.dust(S);
      for (let n = tick(S, 'r', 80); n > 0; n--) { const a = clock.t / 40 + rnd(0, 1); spawn({ x: b.i + Math.cos(a) * b.w * .6, y: b.j + Math.sin(a) * b.h * .3, vx: -b.face * rnd(60, 120), vy: -rnd(40, 120), drag: .97, ay: 420, max: rnd(.4, .7), r: rnd(1.8, 3.4), grow: 0, kind: 'chunk', pts: [[-1, -.5], [.3, -1], [1, .1], [-.2, 1]], col: '#8a6a40', hi: '#c8a878', rot: rnd(0, T), vr: 10, floor: b.feet + 6, a: 1, add: false }); }
      if (Math.random() < .5) shock(b.i + b.face * b.w * .5, b.j, { r1: 18 * b.k, col: '230,210,170', w: 2.5, squash: 1.8, ms: 200 }); },
    impact: S => { const h = hit(S, { col: '230,210,170', sc: '#d8b878', size: 1.2, shk: 6 }); EX.rock(h.x, h.y, h.b.k, h.b.feet + 8); scar('crack', h.b.wx, h.b.wy); } });

  // ---- other contact ----
  reg('Peck', { dash: S => { AURA.speed(S); ghostEvery(S, 80, '#ffffff', 180, .3); }, impact: S => { const h = hit(S, { size: .8 }); featherBurst(h.x, h.y, 6, ['#f4f0e8']); } });
  reg('Drill Peck', { exec: S => windup(S), dash: S => { const b = body(S); AURA.speed(S, '#ffffff', 100); if (Math.random() < .6) shock(b.i + b.face * b.w * .55, b.j, { r1: 16 * b.k, col: '255,255,255', w: 2.4, squash: 2.2, ms: 220 }); ghostEvery(S, 60, '#ffffff', 220, .4); },
    impact: S => { const h = hit(S, { size: 1.2, lines: true, shk: 5 }); for (let i = 0; i < 3; i++) later(i * 60, () => shock(h.x, h.y, { r1: (30 + i * 14) * h.b.k, col: '255,255,255', w: 3, ms: 300 })); } });
  reg('Zen Headbutt', { exec: S => windup(S, '255,150,220', 300, 28), dash: S => { AURA.hue(S, 305, 220, 1, 85); ghostEvery(S, 60, '#ff9ae0', 240, .45); },
    impact: S => { const h = hit(S, { col: '255,160,230', sc: '#ff8ad0', size: 1.3, shk: 6, fl: .15, flc: '#ffd0f0' }); EX.psychic(h.x, h.y, h.b.k * 1.3); } });
  reg('Poison Jab', { exec: S => windup(S, '200,120,255', 280), dash: S => AURA.hue(S, 280, 160, .7),
    impact: S => { const h = hitPt(S), k = h.b.k; ribbon(linePath(h.x - h.b.face * 60 * k, h.y + 4, h.x + 6, h.y), { w: 7 * k, ms: 260, core: '#ffffff', edge: 'rgba(190,100,255,.9)', glow: 'rgba(170,80,255,A)', grow: .2 }); later(70, () => { hit(S, { col: '200,130,255', sc: '#c070ff', shk: 4 }); EX.poison(h.x, h.y, k); }); } });
  reg('Bug Bite', { dash: S => AURA.speed(S, '#d8f080', 80), impact: S => { jaws(S, { col: '#eaffb8', size: .8, gl: '#d8f080' }); const h = hitPt(S); later(160, () => { for (let i = 0; i < N(12); i++) { const a = rnd(0, T); spawn({ x: h.x, y: h.y, vx: Math.cos(a) * rnd(80, 180), vy: Math.sin(a) * rnd(80, 180), drag: .92, ay: 200, max: .6, r: rnd(2.5, 4), grow: 0, kind: 'shard', col: i % 2 ? '#b8e04a' : '#6a8a2a', rot: rnd(0, T), vr: 8, a: 1, add: false }); } }); } });
  reg('Lick', { dash: S => AURA.hue(S, 275, 120, .8, 70),
    impact: S => { const h = hitPt(S), a = body(foe(S)), k = h.b.k; ribbon(linePath(a.i + a.face * a.w * .3, a.j, h.x, h.y, -26 * k), { w: 9 * k, ms: 420, core: '#ffd0e8', edge: 'rgba(240,120,170,.95)', glow: 'rgba(200,90,255,A)', grow: .3, head: .45 }); later(140, () => EX.ghost(h.x, h.y, k)); } });
  reg('Iron Tail', { exec: S => windup(S, '230,240,255'), dash: S => { AURA.speed(S, '#e8f0ff', 80); ghostEvery(S, 60, '#dfe8f4', 220, .45); },
    impact: S => { const h = hitPt(S), k = h.b.k; ribbon(arcPath(h.x, h.y, 42 * k, -2.6, .4, .7), { w: 12 * k, ms: 340, core: '#ffffff', edge: 'rgba(200,215,235,.95)', glow: 'rgba(200,220,255,A)', grow: .25 });
      later(90, () => { hit(S, { col: '230,240,255', sc: '#dfe8f4', size: 1.3, shk: 7, lines: true }); EX.steel(h.x, h.y, k * 1.2); }); } });
  reg('Play Rough', { exec: S => windup(S, '255,170,220', 330), dash: S => AURA.hue(S, 330, 160, .8, 85),
    impact: S => { const h = hitPt(S), k = h.b.k;
      fx({ max: .9, draw: (c, q) => { const a = q < .1 ? q / .1 : q > .75 ? (1 - q) / .25 : 1; for (let i = 0; i < 9; i++) { const an = i * T / 9 + q * 3, r = (20 + Math.sin(q * 20 + i) * 4) * k; c.globalAlpha = .85 * a; c.fillStyle = '#ece4dc'; c.beginPath(); c.arc(h.x + Math.cos(an) * r, h.y + Math.sin(an) * r * .7, (13 + (i % 3) * 3) * k, 0, T); c.fill(); } } });
      for (let i = 0; i < 6; i++) later(i * 110, () => { const x = h.x + rnd(-30, 30) * k, y = h.y + rnd(-22, 22) * k; star(x, y, { size: 12 * k, col: i % 2 ? '#ff8ad0' : '#ffe24a', ms: 200 }); sparks(x, y, 6, { cols: ['#ffffff', '#ff8ad0'] }); });
      for (let i = 0; i < N(10); i++) later(rnd(100, 700), () => { const heart = Math.random() < .5, sz = rnd(4, 6) * k;
        spawn({ x: h.x + rnd(-20, 20) * k, y: h.y - 10, vx: rnd(-120, 120), vy: -rnd(60, 160), drag: .95, ay: 160, max: .9, r: 1, kind: 'fn', a: 1, draw: (c, q, p, op) => { c.globalAlpha = op; (heart ? heartShape : starShape)(c, p.x, p.y, sz, heart ? '#ff6ac0' : '#ffe24a'); } }); });
      shake(4, 500); } });
  reg('Bite', { dash: S => { AURA.speed(S); ghostEvery(S, 70, '#ffffff', 200, .3); }, impact: S => jaws(S) });
  reg('Crunch', { exec: S => windup(S, '170,120,255', 270), dash: S => { AURA.smoke(S); ghostEvery(S, 65, '#6a4a9a', 240, .45); },
    impact: S => { dim(.25, 600, '20,0,30'); jaws(S, { col: '#f4ecff', size: 1.35, dark: true, gl: '#c8a0ff' }); const h = hitPt(S); later(170, () => { EX.ghost(h.x, h.y, h.b.k); speedLines(h.x, h.y, '#c8a0ff', 300); }); } });

  // ---- dashes ----
  reg('Quick Attack', { dash: S => { AURA.speed(S, '#ffffff', 130); AURA.dust(S); ghostEvery(S, 40, '#ffffff', 220, .45); }, impact: S => hit(S, { lines: true, shk: 3 }) });
  reg('Extreme Speed', { exec: S => { windup(S, '255,240,160', 48, 30); dim(.3, 900); }, dash: S => { AURA.speed(S, '#fff0a0', 200); AURA.speed(S, '#ffffff', 120); ghostEvery(S, 32, '#ffe68a', 300, .6); },
    impact: S => { const h = hit(S, { col: '255,240,170', sc: '#ffe24a', size: 1.6, lines: true, shk: 8, fl: .35, flc: '#fff4c0' }); shock(h.x, h.y, { r1: 110 * h.b.k, col: '255,236,150', w: 7, ms: 480 }); sparks(h.x, h.y, 30, { cols: ['#ffffff', '#ffe24a'], v: [200, 420] }); } });
  reg('Aqua Jet', { exec: S => windup(S, '160,220,255', 205), dash: S => { const b = body(S); AURA.water(S, 240); AURA.speed(S, '#cfeeff', 80); ghostEvery(S, 50, '#7fd0ff', 240, .45);
      if (Math.random() < .4) for (const s of [-1, 1]) ribbon(t => { const a = t * 6 + clock.t / 60 * s; return [b.i - b.face * t * 50 * b.k, b.j + Math.sin(a) * b.h * .4]; }, { w: 5 * b.k, ms: 200, core: '#ffffff', edge: 'rgba(110,190,255,.85)', glow: 'rgba(90,170,255,A)', grow: .15 }); },
    impact: S => { const h = hit(S, { col: '170,225,255', sc: '#9fd8ff', shk: 4 }); EX.water(h.x, h.y, h.b.k); } });

  window.PFX3 = { AURA, hit, jaws, flurry, windup, ghostEvery, hitPt, skyBolts, featherBurst, starShape, heartShape, TRAIL: AURA, fist: (S, col, size) => hit(S, { size: size || 1 }) };
})();
