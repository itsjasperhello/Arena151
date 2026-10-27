/* =====================================================================
   Section 26: slashes, wind, leaves, powders, sky attacks, waves, quakes
   and Dig as cinematic set pieces (v2). Built on fxkit.js.
   ===================================================================== */
(function fxParticles4() {
  const P = window.PFX, K = window.FXK, P3 = window.PFX3; if (!P || !K || !P3) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P;
  const { body, foe, dim, flash, shake, scar, speedLines, shock, star, ribbon, linePath, arcPath, pillar, orb, debris, sparks, puff, glowAt, ghost, EX, later, fx, ease, rnd, N, T } = K;
  const { AURA, hit, ghostEvery, hitPt } = P3;
  const at = p => { const i = bx(p.x), j = by(p.y), ang = Math.atan2(p.vy, p.vx); return { i, j, ang, ca: Math.cos(ang), sa: Math.sin(ang) }; };
  const dustTex = () => P.tex('dust', [[0, 'rgba(200,180,150,.6)'], [.5, 'rgba(180,160,130,.3)'], [1, 'rgba(160,140,110,0)']]);
  const leafShape = (c, x, y, s, rot, col, vein, glowCol) => { c.save(); c.translate(x, y); c.rotate(rot); if (glowCol) { c.shadowColor = glowCol; c.shadowBlur = 6; } c.fillStyle = col; c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * .6, s, 0); c.quadraticCurveTo(0, s * .6, -s, 0); c.fill(); c.shadowBlur = 0; c.strokeStyle = vein; c.lineWidth = .8; c.beginPath(); c.moveTo(-s * .85, 0); c.lineTo(s * .85, 0); c.stroke(); c.restore(); };

  /* ---------- slashes ---------- */
  // one blade: a wide gradient crescent across the target, then the bright cut line, sparks along it and a split flash
  function blade(h, dx0, dy0, dx1, dy1, bend, o) { const { core = '#ffffff', edge = 'rgba(200,225,255,.95)', glow = 'rgba(150,200,255,A)', w = 12, cut = '255,255,255', sc = '#ffffff', ms = 380 } = o, k = h.b.k;
    const x0 = h.x + dx0 * k, y0 = h.y + dy0 * k, x1 = h.x + dx1 * k, y1 = h.y + dy1 * k;
    ribbon(linePath(x0, y0, x1, y1, bend * k), { w: w * k, ms, core, edge, glow, grow: .22, head: .4 });
    later(ms * .22, () => { // the cut line extends past the blade, then the target "splits" with a flash
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ex = dx / l * 26 * k, ey = dy / l * 26 * k;
      fx({ add: true, layer: 1, max: .22, draw: (c, q) => { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${cut},${1 - q})`; c.lineWidth = 1.6 * (1 - q) + .4; c.beginPath(); c.moveTo(x0 - ex, y0 - ey); c.lineTo(x1 + ex, y1 + ey); c.stroke(); } });
      for (let s = 0; s < N(10); s++) { const t = Math.random(), x = x0 + dx * t, y = y0 + dy * t, an = Math.atan2(dy, dx) + (Math.random() < .5 ? 1 : -1) * Math.PI / 2 + rnd(-.5, .5);
        spawn({ x, y, vx: Math.cos(an) * rnd(80, 200), vy: Math.sin(an) * rnd(80, 200), drag: .88, ay: 120, max: rnd(.2, .35), r: 1, len: rnd(7, 14), lw: 1.4, kind: 'streak', col: sc, a: 1, add: true }); } }); }
  function slashSet(S, strokes, o = {}) { const h = hitPt(S), { gap = 70, heavy = 0, starCol = null } = o;
    strokes.forEach((st, i) => later(i * gap, () => blade(h, ...st, o)));
    later(strokes.length * gap * .6 + 60, () => { glowAt(h.x, h.y, 34 * h.b.k * (1 + heavy * .4), o.bloom || '220,235,255', 220); if (starCol) star(h.x, h.y, { size: 18 * h.b.k * (1 + heavy * .3), col: starCol }); if (heavy) { shake(3 + heavy * 3, 160); shock(h.x, h.y, { r1: 60 * h.b.k * (1 + heavy * .3), col: o.bloom || '220,235,255', w: 4 }); } });
    return h; }
  const CLAWS = [[-26, -26, 16, 26, 7], [-16, -32, 26, 20, 7], [-6, -38, 36, 14, 7]];
  const XCUT = [[-30, -30, 30, 30, 6], [30, -30, -30, 30, -6]];

  /* ---------- projectiles: wind, leaves, powders ---------- */
  const shotWrap = f => p => { const c = bctx, i = bx(p.x), j = by(p.y), Kk = 1.3; c.save(); c.translate(i, j); c.scale(Kk, Kk); c.translate(-i, -j); try { f(p); } finally { c.restore(); } };
  const SH = {
    airSlash: p => { const s = at(p), c = bctx; for (let n = due(p, 120); n > 0; n--) spawn({ x: s.i + rnd(-8, 8), y: s.j + rnd(-10, 10), vx: -s.ca * rnd(100, 200), vy: -s.sa * rnd(100, 200), drag: .9, max: .22, r: 1, len: 16, lw: 1.3, kind: 'streak', col: '#e8f6ff', a: .8, add: true });
      c.save(); c.translate(s.i, s.j); c.rotate(s.ang); c.globalCompositeOperation = 'lighter'; const wob = Math.sin(clock.t / 40) * .12;
      for (const [r, a, lw, col] of [[15, .25, 9, '160,210,255'], [15, .55, 4.5, '200,235,255'], [14, 1, 1.8, '255,255,255']]) { c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, r, -1.15 + wob, 1.15 + wob); c.stroke(); }
      c.restore(); },
    hurricane: p => { const s = at(p), c = bctx, t = clock.t / 45;
      for (let n = due(p, 160); n > 0; n--) { const a = rnd(0, T), hh = rnd(-40, 12); spawn({ x: s.i + Math.cos(a) * (12 + (12 - hh) * .4), y: s.j + hh, vx: -Math.sin(a) * 160 - s.ca * 40, vy: rnd(-50, 10), drag: .9, max: rnd(.25, .45), r: 1, len: 12, lw: 1.3, kind: 'streak', col: Math.random() < .25 ? '#c8b48a' : '#eef8ff', a: .9, add: Math.random() < .75 }); }
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 12; k++) { const f = k / 11, y = s.j + 16 - f * 60, rx = 6 + f * 26, off = Math.sin(t + k * .7) * 5; c.strokeStyle = `rgba(225,242,255,${.3 + .45 * (1 - f * .4)})`; c.lineWidth = 2.6 - f * 1.2; c.beginPath(); c.ellipse(s.i + off, y, rx, rx * .3, 0, t * 2 + k, t * 2 + k + 4.6); c.stroke(); }
      c.restore(); for (let k = 0; k < 4; k++) { const a = t * 2.2 + k * T / 4, r = 18 + k * 4; c.save(); c.translate(s.i + Math.cos(a) * r, s.j - 20 - k * 6 + Math.sin(a) * r * .3); c.rotate(t * 3 + k); c.fillStyle = k % 2 ? '#8a7650' : '#6a8a3a'; c.fillRect(-2, -1.5, 4, 3); c.restore(); } },
    fairyWind: p => { const s = at(p), t = clock.t / 110;
      for (let n = due(p, 200); n > 0; n--) { const a = t * 3 + rnd(0, T), r = rnd(4, 20); spawn({ x: s.i + Math.cos(a) * r, y: s.j + Math.sin(a) * r * .7, vx: -Math.sin(a) * 70 - s.ca * 40, vy: Math.cos(a) * 50 - s.sa * 40, drag: .93, max: rnd(.35, .6), r: rnd(2, 4.5), grow: .2, kind: Math.random() < .5 ? 'shard' : undefined, img: hueTex(rnd(310, 345) | 0, 90, 76), col: Math.random() < .5 ? '#ffffff' : '#ffb0e0', rot: rnd(0, T), vr: rnd(-6, 6), a: 1, add: true }); }
      if (Math.random() < .5) for (const sg of [-1, 1]) ribbon(tt => { const a = tt * 5 + t * 3 * sg; return [s.i - s.ca * tt * 40 + Math.cos(a) * 10, s.j - s.sa * tt * 40 + Math.sin(a) * 8]; }, { w: 4, ms: 180, core: '#ffffff', edge: 'rgba(255,170,220,.8)', glow: 'rgba(255,140,210,A)', grow: .15 });
      fx({ add: true, max: .02, draw: c => orb(c, s.i, s.j, 8, { core: '255,255,255', mid: '255,160,220', rim: '255,220,240', arcs: 2 }) }); },
    razorLeaf: (p, storm) => { const s = at(p), c = bctx, n = storm ? 14 : 4, R = storm ? 24 : 6;
      for (let k = 0; k < n; k++) { const a = clock.t / (storm ? 90 : 60) + k * T / n, rr = R * (storm ? (.5 + (k % 3) * .25) : .7), x = s.i + Math.cos(a) * rr, y = s.j + Math.sin(a) * rr * .6 - (storm ? (k % 4) * 3 : 0); leafShape(c, x, y, storm ? 6.5 : 7, clock.t / 35 + k, k % 2 ? '#86e05e' : '#3fb04a', '#e0ffc0', 'rgba(150,255,120,.9)'); }
      for (let m = due(p, storm ? 160 : 50); m > 0; m--) spawn({ x: s.i + rnd(-R, R), y: s.j + rnd(-R, R) * .6, vx: rnd(-30, 30) - s.ca * 30, vy: rnd(-30, 30), drag: .93, max: rnd(.3, .5), r: rnd(2, 4), grow: .3, img: hueTex(rnd(95, 125) | 0, 80, 60), a: .8, add: true });
      if (storm) fx({ add: true, max: .02, draw: cc => orb(cc, s.i, s.j, 10, { core: '255,255,230', mid: '140,230,90', rim: '210,255,170', arcs: 3 }) }); },
    powder: (p, hue, sparkle) => { const s = at(p);
      for (let n = due(p, 220); n > 0; n--) spawn({ x: s.i + rnd(-12, 12), y: s.j + rnd(-12, 12), vx: rnd(-25, 25) - s.ca * 20, vy: rnd(-25, 15), drag: .96, ay: 10, max: rnd(.6, 1.1), r: rnd(3, 6.5), grow: .7, img: hueTex(((((hue + rnd(-15, 15)) | 0) % 360) + 360) % 360, 80, 70), a: .9, add: true });
      if (Math.random() < .7) spawn({ x: s.i + rnd(-14, 14), y: s.j + rnd(-14, 14), vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .9, max: .4, r: rnd(2, 3.5), grow: .2, kind: 'shard', col: sparkle, rot: rnd(0, T), vr: 6, a: 1, add: true }); }
  };

  /* ---------- sky attacks ---------- */
  const rockPts = [[-1, -.4], [-.4, -1], [.6, -.9], [1, -.1], [.7, .8], [-.2, 1], [-1, .5]];
  const drawRock = (c, x, y, s, rot) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = '#7a6848'; c.beginPath(); rockPts.forEach(([a, b], k) => k ? c.lineTo(a * s, b * s) : c.moveTo(a * s, b * s)); c.closePath(); c.fill(); c.fillStyle = '#b8a078'; c.beginPath(); c.moveTo(-.6 * s, -.4 * s); c.lineTo(-.2 * s, -.85 * s); c.lineTo(.45 * s, -.7 * s); c.lineTo(.05 * s, -.1 * s); c.closePath(); c.fill(); c.strokeStyle = '#4a3a28'; c.lineWidth = 1; c.beginPath(); c.moveTo(.1 * s, .1 * s); c.lineTo(.5 * s, .5 * s); c.stroke(); c.restore(); };
  const SKY = {
    blizzard: (mk, q) => { const x = bx(mk.x), y = by(mk.y), r = mk.r / 2;
      if (!mk._d) { mk._d = 1; dim(.35, 1500, '0,20,50'); fx({ layer: 1, add: true, max: 1.4, draw: (c, qq) => { const a = qq < .15 ? qq / .15 : qq > .8 ? (1 - qq) / .2 : 1; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const W = c.canvas.width, H = c.canvas.height; c.strokeStyle = `rgba(255,255,255,${.7 * a})`; c.lineWidth = 1.5;
        for (let i = 0; i < 90; i++) { const sx = ((i * 137 + clock.t * .9) % (W + 200)) - 100, sy = ((i * 241 + clock.t * .6) % (H + 100)) - 50; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 14, sy - 9); c.stroke(); } c.restore(); } }); }
      glowAt(x, y - 10, r * 1.6, '200,240,255', 60, .25 + q * .3);
      for (let n = due(mk, 300); n > 0; n--) { const a = rnd(0, T), rr = rnd(.3, 1.4) * r; spawn({ x: x + Math.cos(a) * rr, y: y - 20 + Math.sin(a) * rr * .5, vx: -Math.sin(a) * 160, vy: Math.cos(a) * 60 + 20, drag: .97, max: rnd(.4, .7), r: rnd(1.4, 2.6), grow: 0, kind: 'drop', col: '#ffffff', a: .95, add: true }); }
      if (Math.random() < .6 * QMUL()) spawn({ x: x + rnd(-r, r), y: y + rnd(-r, r) * .5, vx: rnd(-40, 40), vy: rnd(-10, 10), drag: .97, max: rnd(.6, 1), r: rnd(10, 18), grow: 1.2, img: steamTex(), a: .6, add: false });
      if (q > .86 && !mk._done) { mk._done = 1; EX.ice(x, y - 14, 1.5); flash('#e8f8ff', .3); shake(6, 240); } },
    rockSlide: (mk, q) => { const x = bx(mk.x), y = by(mk.y), r = mk.r / 2, c = bctx;
      const rocks = mk._rocks || (mk._rocks = Array.from({ length: 7 }, (_, i) => ({ dx: rnd(-r * .9, r * .9), dy: rnd(-r * .3, r * .3), s: rnd(9, 17), d: i * .045, rot: rnd(0, T), vr: rnd(-6, 6) })));
      for (const k of rocks) { const f = Math.max(0, Math.min(1, (q - .3 - k.d) / .42)), gx = x + k.dx, gy = y + k.dy;
        c.save(); c.globalAlpha = .15 + f * .4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(gx, gy, k.s * (.4 + f * .8), k.s * .32 * (.4 + f * .8), 0, 0, T); c.fill(); c.restore();   // shadow grows as the rock nears
        if (f <= 0) continue;
        if (f >= 1) { if (!k.hit) { k.hit = 1; debris(gx, gy - 4, 8, { floor: gy + 6, size: [2, 4.5] }); puff(gx, gy, 6, { tex: dustTex, r: [8, 14], v: [40, 100], up: 15 }); shock(gx, gy, { r1: 34, col: '220,200,160', w: 4, squash: .35, ms: 300 }); shake(4, 120); if (Math.random() < .5) scar('crack', mk.x + k.dx * 2, mk.y + k.dy * 2); } continue; }
        const ry = gy - (1 - ease.in(f)) * 260; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,240,210,.25)'; c.lineWidth = k.s; c.lineCap = 'round'; c.beginPath(); c.moveTo(gx, ry - 30); c.lineTo(gx, ry - 4); c.stroke(); c.restore();
        drawRock(c, gx, ry, k.s, k.rot + f * k.vr); } },
    stoneEdge: (mk, q) => { const x = bx(mk.x), y = by(mk.y), r = mk.r / 2, c = bctx;
      if (q < .7) { const g = q / .7; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,190,120,${.25 + g * .6})`; c.lineWidth = 2; for (let k = 0; k < 7; k++) { const a = k * T / 7 + .3; c.beginPath(); c.moveTo(x, y); let px = x, py = y; for (let s = 1; s <= 4; s++) { px = x + Math.cos(a + Math.sin(s * 3 + k) * .25) * r * 1.3 * g * s / 4; py = y + Math.sin(a + Math.sin(s * 3 + k) * .25) * r * .5 * g * s / 4; c.lineTo(px, py); } c.stroke(); } c.restore(); glowAt(x, y, r, '255,180,110', 40, .2 + g * .3); return; }
      const f = Math.min(1, (q - .7) / .16), spikes = mk._sp || (mk._sp = Array.from({ length: 11 }, () => ({ dx: rnd(-r * 1.2, r * 1.2), dy: rnd(-r * .45, r * .45), h: rnd(48, 84), w: rnd(11, 17), lean: rnd(-.25, .25) })).sort((a, b) => a.dy - b.dy));
      c.save(); for (const s of spikes) { const hh = s.h * ease.back(f), bxx = x + s.dx, byy = y + s.dy, tx = bxx + s.lean * hh;
        c.fillStyle = '#6a5a46'; c.beginPath(); c.moveTo(bxx - s.w, byy); c.lineTo(tx, byy - hh); c.lineTo(bxx + s.w, byy); c.closePath(); c.fill();
        c.fillStyle = '#a8987a'; c.beginPath(); c.moveTo(bxx - s.w * .65, byy); c.lineTo(tx, byy - hh); c.lineTo(bxx - s.w * .05, byy); c.closePath(); c.fill();
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,220,170,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bxx - s.w * .65, byy); c.lineTo(tx, byy - hh); c.stroke(); c.globalCompositeOperation = 'source-over'; }
      c.restore(); if (!mk._done && f > .4) { mk._done = 1; debris(x, y - 10, 26, { floor: y + 10, v: [100, 260] }); puff(x, y, 14, { tex: dustTex, r: [10, 18], v: [60, 140], up: 10 }); shake(8, 260); flash('#fff0d8', .15); scar('crack', mk.x, mk.y); } }
  };

  /* ---------- waves and quakes ---------- */
  const WAVE = {
    surf: w => { const i = bx(w.x), j = by(w.y), R = w.r / 2, c = bctx, q = Math.min(1, w.r / w.maxR), fade = q > .82 ? (1 - q) / .18 : 1;
      if (!w._d) { w._d = 1; dim(.22, 1100, '0,20,50'); }
      c.save(); c.globalAlpha = fade * .55; c.strokeStyle = '#1e64b8'; c.lineWidth = 12; c.beginPath(); c.ellipse(i, j, R, R * .5, 0, 0, T); c.stroke();
      const H = 46 * (1 - q * .35);
      for (let k = 0; k <= 14; k++) { const f = k / 14; c.globalAlpha = fade * (f > .85 ? 1 : .8); c.strokeStyle = f > .85 ? '#eaf8ff' : `rgb(${30 + f * 120 | 0},${110 + f * 120 | 0},${210 + f * 40 | 0})`; c.lineWidth = 4.2; c.beginPath(); c.ellipse(i, j - f * H, R + f * 4, (R + f * 4) * .5, 0, .1, Math.PI - .1); c.stroke(); }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade; c.strokeStyle = '#ffffff'; c.lineWidth = 2.4; c.setLineDash([7, 6]); c.lineDashOffset = -clock.t / 25; c.beginPath(); c.ellipse(i, j - H, R + 4, (R + 4) * .5, 0, .1, Math.PI - .1); c.stroke(); c.restore();
      for (let n = due(w, 320); n > 0; n--) { const a = rnd(.15, Math.PI - .15), x = i + Math.cos(a) * (R + 4), y = j - H + Math.sin(a) * (R + 4) * .5; spawn({ x, y, vx: Math.cos(a) * rnd(30, 90), vy: -rnd(60, 150), drag: .97, ay: 380, max: rnd(.4, .7), r: rnd(1.4, 2.6), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#ffffff' : '#bfe8ff', a: fade, add: true }); } },
    buzz: w => { const i = bx(w.x), j = by(w.y) - 22, R = w.r / 2, c = bctx, q = Math.min(1, w.r / w.maxR), fade = q > .75 ? (1 - q) / .25 : 1;
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const rr = R - k * 13; if (rr < 4) continue; const jit = Math.sin(clock.t / 16 + k) * 2;
        for (const [lw, a] of [[7, .2], [2.6, .85]]) { c.strokeStyle = `rgba(${k % 2 ? 210 : 170},255,${k % 2 ? 120 : 80},${(1 - k * .17) * a * fade})`; c.lineWidth = lw; c.beginPath(); for (let s = 0; s <= 48; s++) { const an = s / 48 * T, wob = Math.sin(an * 12 + clock.t / 20) * 2.2; const px = i + Math.cos(an) * (rr + jit + wob), py = j + Math.sin(an) * (rr + jit + wob) * .55; s ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } } c.restore();
      if (Math.random() < .8 * QMUL()) { const a = rnd(0, T); spawn({ x: i + Math.cos(a) * R, y: j + Math.sin(a) * R * .55, vx: Math.cos(a) * 70, vy: Math.sin(a) * 35, drag: .9, max: .35, r: rnd(2.5, 4.5), grow: .3, img: hueTex(80, 85, 62), a: fade, add: true }); } },
    quake: (w, magma) => { const i = bx(w.x), j = by(w.y), R = w.r / 2, c = bctx, q = Math.min(1, w.r / w.maxR), fade = q > .8 ? (1 - q) / .2 : 1;
      if (!w._d) { w._d = 1; dim(.25, 1200, magma ? '40,10,0' : '30,20,0'); shake(9, 1000); for (let k = 0; k < 6; k++) later(k * 120, () => { const a = rnd(0, T), d = rnd(40, 140); scar('crack', w.x + Math.cos(a) * d, w.y + Math.sin(a) * d * .5); }); }
      c.save(); for (let k = 0; k < 3; k++) { const rr = R - k * 16; if (rr < 3) continue; c.strokeStyle = k ? 'rgba(160,130,90,.55)' : 'rgba(110,80,50,.85)'; c.globalAlpha = fade; c.lineWidth = 4 - k; c.beginPath(); c.ellipse(i, j, rr, rr * .45, 0, 0, T); c.stroke(); } c.restore();
      if (!w._cracks) w._cracks = Array.from({ length: 10 }, (_, k) => ({ a: k * T / 10 + rnd(-.2, .2), j: Array.from({ length: 7 }, () => rnd(-.2, .2)) }));
      c.save(); c.globalAlpha = fade; for (const pass of [0, 1]) { c.strokeStyle = pass ? (magma ? 'rgba(255,150,60,.9)' : 'rgba(30,20,10,.9)') : (magma ? 'rgba(255,90,20,.35)' : 'rgba(60,40,20,.4)'); c.lineWidth = pass ? 1.4 : 4; if (magma && pass) c.globalCompositeOperation = 'lighter';
        for (const k of w._cracks) { c.beginPath(); c.moveTo(i, j); k.j.forEach((d, s) => { const rr = R * (s + 1) / 7, a = k.a + d; c.lineTo(i + Math.cos(a) * rr, j + Math.sin(a) * rr * .45); }); c.stroke(); } c.globalCompositeOperation = 'source-over'; } c.restore();
      for (let n = due(w, 200); n > 0; n--) { const a = rnd(0, T), x = i + Math.cos(a) * R, y = j + Math.sin(a) * R * .45;
        if (Math.random() < .45) spawn({ x, y: y - 2, vx: Math.cos(a) * rnd(10, 50), vy: -rnd(120, 240), drag: .98, ay: 560, floor: y + 4, max: rnd(.5, .9), r: rnd(1.8, 4), grow: 0, kind: 'chunk', pts: rockPts, col: '#7a6040', hi: '#b89a6a', rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: false });
        else spawn({ x, y, vx: Math.cos(a) * 40, vy: -rnd(10, 40), drag: .96, max: rnd(.6, 1), r: rnd(8, 14), grow: 1.4, img: dustTex(), a: .55 * fade, add: false }); }
      if (magma) for (let n = due(w._g || (w._g = {}), 110); n > 0; n--) { const a = rnd(0, T), x = i + Math.cos(a) * R * rnd(.3, 1), y = j + Math.sin(a) * R * .45 * rnd(.3, 1);
        spawn({ x, y, vx: rnd(-12, 12), vy: -rnd(160, 300), drag: .95, ay: -10, max: rnd(.35, .6), r: rnd(5, 10), grow: .8, img: fireTex(rnd(14, 38) | 0), a: 1, add: true }); } }
  };

  /* ---------- Dig ---------- */
  function burrow(S) { const b = body(S); debris(b.i, b.feet - 4, 18, { floor: b.feet + 6, v: [60, 180] }); puff(b.i, b.feet, 12, { tex: dustTex, r: [8, 14], v: [40, 120], up: 10 }); shock(b.i, b.feet, { r1: 50 * b.k, col: '200,170,120', w: 4, squash: .35 }); scar('crack', b.wx, b.wy);
    const tB = body(foe(S)); for (let k = 1; k <= 9; k++) later(k * 52, () => { const f = k / 9, x = b.i + (tB.i - b.i) * f, y = b.feet + (tB.feet - b.feet) * f;
      puff(x, y, 2, { tex: dustTex, r: [7, 12], v: [10, 30], up: 8 }); fx({ max: .6, draw: (c, q) => { c.globalAlpha = .45 * (1 - q); c.fillStyle = '#5a4630'; c.beginPath(); c.ellipse(x, y, 12 * (1 - q * .3), 4, 0, 0, T); c.fill(); } }); }); }
  function erupt(S) { const h = hitPt(S), b = h.b; EX.rock(b.i, b.feet - 6, b.k * 1.5, b.feet + 8); pillar(b.i, b.feet, { w: 30 * b.k, h: 120, col: '200,170,120', ms: 500 }); shake(8, 240); scar('crack', b.wx, b.wy); star(b.i, b.j, { size: 22 * b.k, col: '#e8c890' }); }

  /* ---------- register ---------- */
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.shot) o.shot = shotWrap(r.shot);
    for (const kk of ['markDraw', 'wave', 'dash']) if (r[kk]) o[kk] = (...a) => { try { r[kk](...a); } catch (e) { console.error(e); } };
    for (const kk of ['impact', 'exec']) if (r[kk]) { const prev = old[kk]; o[kk] = (...a) => { if (prev) try { prev(...a); } catch (e) { console.error(e); } try { r[kk](...a); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  const silver = { core: '#ffffff', edge: 'rgba(205,225,250,.95)', glow: 'rgba(160,205,255,A)', cut: '255,255,255', sc: '#ffffff' };
  // slashes
  reg('Slash', { dash: S => { AURA.speed(S); ghostEvery(S, 70, '#ffffff', 200, .3); }, impact: S => slashSet(S, [[-34, -22, 34, 20, 12], [-18, 18, 26, -6, -6]], { ...silver, w: 13, starCol: '#ffffff', heavy: .5 }) });
  reg('Karate Chop', { dash: S => AURA.speed(S, '#ffd8a0'), impact: S => { slashSet(S, [[-14, -44, 10, 34, 5]], { core: '#ffffff', edge: 'rgba(255,170,90,.95)', glow: 'rgba(255,130,50,A)', cut: '255,220,170', sc: '#ffd8a0', w: 15, bloom: '255,190,120', starCol: '#ffb050', heavy: 1 }); } });
  reg('Cross Chop', { exec: S => dim(.28, 900), dash: S => { AURA.hue(S, 25, 140, .8); ghostEvery(S, 60, '#ffb070', 220, .4); },
    impact: S => { const h = slashSet(S, XCUT, { core: '#ffffff', edge: 'rgba(255,160,70,.95)', glow: 'rgba(255,120,40,A)', cut: '255,220,170', sc: '#ffd8a0', w: 17, gap: 90, bloom: '255,180,100', starCol: '#ff9a30', heavy: 2 }); later(260, () => { speedLines(h.x, h.y, '#ffd8a0', 320); flash('#ffd8a0', .2); }); } });
  reg('Aerial Ace', { exec: S => dim(.22, 700), dash: S => { AURA.speed(S, '#d8f0ff', 160); ghostEvery(S, 35, '#bfe0ff', 240, .5); },
    impact: S => { const h = hitPt(S), k = h.b.k; fx({ add: true, layer: 1, max: .4, draw: (c, q) => { const g = Math.min(1, q / .2), a = q > .4 ? 1 - (q - .4) / .6 : 1; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(220,240,255,${a})`; c.lineWidth = 2.2 * a + .4; c.beginPath(); c.moveTo(h.x - 420 * g, h.y + 120 * g); c.lineTo(h.x + 420 * g, h.y - 120 * g); c.stroke(); c.strokeStyle = `rgba(140,200,255,${a * .35})`; c.lineWidth = 9; c.stroke(); c.restore(); } });
      later(140, () => { slashSet(S, [[-38, 12, 38, -12, -4]], { ...silver, w: 9, starCol: '#e8f6ff', heavy: 1 }); flash('#e8f6ff', .15); }); } });
  reg('X-Scissor', { dash: S => { AURA.speed(S, '#d8f080'); ghostEvery(S, 60, '#c8f070', 220, .35); },
    impact: S => { const h = hitPt(S), k = h.b.k; for (const sg of [-1, 1]) fx({ add: true, max: .3, draw: (c, q) => { const a = sg * (.9 - ease.out(Math.min(1, q / .5)) * .9) + (sg > 0 ? Math.PI / 4 : -Math.PI / 4), L = 40 * k, fade = q > .6 ? (1 - q) / .4 : 1; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(210,255,140,${fade})`; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(h.x - Math.cos(a) * L, h.y - Math.sin(a) * L); c.lineTo(h.x + Math.cos(a) * L, h.y + Math.sin(a) * L); c.stroke(); c.restore(); } });
      later(130, () => slashSet(S, XCUT, { core: '#ffffff', edge: 'rgba(170,230,80,.95)', glow: 'rgba(140,220,60,A)', cut: '230,255,180', sc: '#d8f080', w: 14, gap: 0, bloom: '200,255,140', starCol: '#c8f070', heavy: 1.5 })); } });
  reg('Shadow Claw', { exec: S => dim(.3, 900, '20,0,40'), dash: S => { AURA.smoke(S); ghostEvery(S, 60, '#6a4a9a', 240, .45); },
    impact: S => { const h = slashSet(S, CLAWS, { core: '#f4ecff', edge: 'rgba(120,70,220,.95)', glow: 'rgba(110,60,220,A)', cut: '210,180,255', sc: '#b9a4ff', w: 13, gap: 55, bloom: '170,120,255', starCol: '#8a5ae0', heavy: 1 }); later(200, () => EX.ghost(h.x, h.y, h.b.k)); } });
  reg('Dragon Claw', { exec: S => dim(.25, 900, '10,0,40'), dash: S => { AURA.hue(S, 250, 160, .9, 85); ghostEvery(S, 60, '#8a78ff', 240, .45); },
    impact: S => { const h = slashSet(S, CLAWS, { core: '#ffffff', edge: 'rgba(120,100,255,.95)', glow: 'rgba(100,80,255,A)', cut: '210,200,255', sc: '#c8c0ff', w: 14, gap: 55, bloom: '160,140,255', starCol: '#8a78ff', heavy: 1.5 }); later(200, () => EX.dragon(h.x, h.y, h.b.k)); } });
  reg('Metal Claw', { dash: S => { AURA.speed(S, '#e8f0ff'); ghostEvery(S, 60, '#dfe8f4', 220, .35); },
    impact: S => { const h = slashSet(S, CLAWS, { ...silver, w: 12, gap: 55, starCol: '#ffffff', heavy: 1 }); later(200, () => EX.steel(h.x, h.y, h.b.k)); } });
  reg('Wing Attack', { dash: S => { AURA.speed(S, '#eaf6ff', 100); ghostEvery(S, 60, '#eaf6ff', 220, .35); },
    impact: S => { const h = slashSet(S, [[-40, -6, 26, -30, 16], [-40, 14, 28, 32, -16]], { core: '#ffffff', edge: 'rgba(225,240,255,.95)', glow: 'rgba(180,215,255,A)', cut: '255,255,255', sc: '#eaf6ff', w: 18, gap: 60, starCol: '#ffffff', heavy: .6 }); later(140, () => P3.featherBurst(h.x, h.y, 16, ['#ffffff', '#e4eef8'])); } });
  reg('Vine Whip', { dash: S => AURA.speed(S, '#c8f58a', 50),
    impact: S => { const h = hitPt(S), a = body(foe(S)), k = h.b.k;
      for (const sg of [-1, 1]) { const x0 = a.i + a.face * a.w * .3, y0 = a.j + 4; ribbon(t => { const x = x0 + (h.x + sg * 10 * k - x0) * t, y = y0 + (h.y - y0) * t - Math.sin(t * Math.PI) * 34 * sg * k + Math.sin(t * 9 + clock.t / 40) * 3; return [x, y]; }, { w: 6 * k, ms: 480, core: '#d8f5a8', edge: 'rgba(60,150,50,.95)', glow: 'rgba(90,200,70,A)', grow: .35, head: .5 }); }
      later(170, () => { const hh = hit(S, { col: '200,255,150', sc: '#9ae060', shk: 4 }); for (let i = 0; i < N(12); i++) spawn({ x: hh.x, y: hh.y, vx: rnd(-160, 160), vy: rnd(-180, 40), drag: .95, ay: 120, max: rnd(.6, 1), r: 1, kind: 'fn', a: 1, draw: (c, q, p, op) => { c.globalAlpha = op; leafShape(c, p.x, p.y, 5, q * 8 + p.vx, '#6ad04a', '#d8ffc0'); } }); }); } });
  reg('Crabhammer', { exec: S => dim(.2, 800, '0,20,50'), dash: S => AURA.water(S, 200),
    impact: S => { const h = hitPt(S), k = h.b.k; for (const sg of [-1, 1]) ribbon(t => { const a = sg * (1.3 - t * 1.1); return [h.x - h.b.face * 20 * k + Math.cos(a) * 40 * k * (1 - t * .3), h.y + Math.sin(a) * 36 * k * (1 - t * .3) * sg * sg]; }, { w: 16 * k, ms: 320, core: '#ffffff', edge: 'rgba(90,170,255,.95)', glow: 'rgba(70,150,255,A)', grow: .3 });
      later(150, () => { hit(S, { col: '170,225,255', sc: '#9fd8ff', size: 1.4, shk: 7, lines: true }); EX.water(h.x, h.y, k * 1.6); pillar(h.x, h.b.feet, { w: 30 * k, h: 160, col: '120,200,255', ms: 500 }); scar('splat', h.b.wx, h.b.wy); }); } });
  // wind, leaves, powders
  reg('Air Slash', { shot: SH.airSlash, impact: S => slashSet(S, [[-30, 18, 30, -18, -10], [-26, -10, 28, 16, 8]], { ...silver, edge: 'rgba(190,225,255,.9)', w: 10, gap: 60, starCol: '#e8f6ff', heavy: .5 }) });
  reg('Hurricane', { exec: S => dim(.3, 1500, '10,20,40'), shot: SH.hurricane,
    impact: S => { const h = hitPt(S), b = h.b; shake(7, 700); fx({ add: true, max: 1, draw: (c, q) => { const t = clock.t / 40, a = q < .1 ? q / .1 : q > .75 ? (1 - q) / .25 : 1; c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 16; k++) { const f = k / 15, y = b.feet - f * 150, rx = (12 + f * 46) * b.k; c.strokeStyle = `rgba(225,242,255,${(.3 + .45 * (1 - f * .4)) * a})`; c.lineWidth = 3 - f * 1.4; c.beginPath(); c.ellipse(b.i + Math.sin(t + k * .6) * 6, y, rx, rx * .3, 0, t * 2 + k, t * 2 + k + 4.8); c.stroke(); } c.restore(); } });
      for (let i = 0; i < N(26); i++) later(rnd(0, 700), () => { const a = rnd(0, T); spawn({ x: b.i + Math.cos(a) * 30, y: b.feet - rnd(0, 20), vx: -Math.sin(a) * 140, vy: -rnd(120, 260), drag: .96, ay: 80, max: rnd(.6, 1), r: rnd(2, 4), grow: 0, kind: 'chunk', pts: rockPts, col: Math.random() < .5 ? '#8a7650' : '#6a8a3a', hi: '#c8b080', rot: rnd(0, T), vr: rnd(-12, 12), a: 1, add: false }); }); } });
  reg('Fairy Wind', { shot: SH.fairyWind, impact: S => { const h = hitPt(S); glowAt(h.x, h.y, 44 * h.b.k, '255,170,220', 320); shock(h.x, h.y, { r1: 64 * h.b.k, col: '255,180,225', w: 5 }); for (let i = 0; i < N(30); i++) { const a = rnd(0, T); spawn({ x: h.x, y: h.y, vx: Math.cos(a) * rnd(60, 200), vy: Math.sin(a) * rnd(60, 200), drag: .92, max: rnd(.5, .9), r: rnd(2.5, 5), grow: .1, kind: 'shard', col: i % 2 ? '#ffffff' : '#ffb0e0', rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: true }); } } });
  reg('Razor Leaf', { shot: p => SH.razorLeaf(p, false), impact: S => { slashSet(S, [[-24, -14, 22, 14, 6], [-20, 16, 24, -10, -6]], { core: '#f0ffe0', edge: 'rgba(90,200,70,.9)', glow: 'rgba(80,200,60,A)', cut: '220,255,190', sc: '#c8f58a', w: 8, gap: 50, starCol: '#9ae060' }); } });
  reg('Leaf Storm', { exec: S => dim(.32, 1600, '0,30,10'), shot: p => SH.razorLeaf(p, true),
    impact: S => { const h = hitPt(S), b = h.b; shake(6, 600); glowAt(h.x, h.y, 60 * b.k, '150,240,110', 400); shock(h.x, h.y, { r1: 90 * b.k, col: '170,240,120', w: 6 });
      fx({ max: 1.1, draw: (c, q) => { const a = q > .7 ? (1 - q) / .3 : 1; for (let k = 0; k < 22; k++) { const an = q * 12 + k * T / 22, r = (14 + (k % 4) * 9) * b.k * (1 + q * .4), y = b.feet - (k % 6) * 14 * b.k - q * 30; c.globalAlpha = a; leafShape(c, b.i + Math.cos(an) * r, y + Math.sin(an) * r * .3, 6, an * 2, k % 2 ? '#86e05e' : '#3fb04a', '#e0ffc0'); } } }); } });
  reg('Sleep Powder', { shot: p => SH.powder(p, 165, '#e0fff8'), impact: S => { const h = hitPt(S), b = h.b; for (let i = 0; i < N(36); i++) later(rnd(0, 500), () => spawn({ x: b.i + rnd(-.7, .7) * b.w, y: b.j + rnd(-.6, .6) * b.h, vx: rnd(-20, 20), vy: rnd(-20, 5), drag: .97, max: rnd(.9, 1.4), r: rnd(5, 9) * b.k, grow: .6, img: hueTex(rnd(150, 185) | 0, 75, 72), a: .9, add: true }));
      for (let i = 0; i < 3; i++) later(250 + i * 220, () => fx({ max: 1, draw: (c, q) => { const bb = body(S); c.globalAlpha = q < .15 ? q / .15 : 1 - q; c.fillStyle = '#e0fff8'; c.strokeStyle = '#1a6a5a'; c.lineWidth = 2; c.font = `900 ${12 + i * 3}px sans-serif`; const x = bb.i + 14 + q * 14 + i * 5, y = bb.j - bb.h * .5 - q * 24 - i * 6; c.strokeText('Z', x, y); c.fillText('Z', x, y); } })); } });
  reg('Stun Spore', { shot: p => SH.powder(p, 48, '#fff6a0'), impact: S => { const h = hitPt(S), b = h.b; for (let i = 0; i < N(36); i++) later(rnd(0, 500), () => spawn({ x: b.i + rnd(-.7, .7) * b.w, y: b.j + rnd(-.6, .6) * b.h, vx: rnd(-20, 20), vy: rnd(-20, 5), drag: .97, max: rnd(.9, 1.4), r: rnd(5, 9) * b.k, grow: .6, img: hueTex(rnd(40, 58) | 0, 90, 66), a: .9, add: true }));
      for (let i = 0; i < 5; i++) later(200 + i * 120, () => EX.electric(b.i + rnd(-.4, .4) * b.w, b.j + rnd(-.4, .4) * b.h, .45)); } });
  // sky attacks
  reg('Blizzard', { markDraw: SKY.blizzard, impact: S => { const h = hitPt(S); EX.ice(h.x, h.y, h.b.k); } });
  reg('Rock Slide', { markDraw: SKY.rockSlide, impact: S => { const h = hitPt(S); star(h.x, h.y, { size: 18 * h.b.k, col: '#e8c890' }); } });
  reg('Stone Edge', { markDraw: SKY.stoneEdge, impact: S => { const h = hitPt(S); star(h.x, h.y, { size: 22 * h.b.k, col: '#e8c890' }); sparks(h.x, h.y, 16, { cols: ['#ffffff', '#e8c890'] }); } });
  // waves and quakes
  reg('Surf', { wave: WAVE.surf, impact: S => { const h = hitPt(S); EX.water(h.x, h.y, h.b.k * 1.3); scar('splat', h.b.wx, h.b.wy); } });
  reg('Bug Buzz', { wave: WAVE.buzz, impact: S => { const h = hitPt(S); glowAt(h.x, h.y, 40 * h.b.k, '200,255,120', 260); for (let i = 0; i < 3; i++) later(i * 60, () => shock(h.x, h.y, { r1: (36 + i * 16) * h.b.k, col: '200,255,120', w: 3 })); sparks(h.x, h.y, 18, { cols: ['#e8ffb0', '#b8f04a'] }); } });
  reg('Earthquake', { wave: w => WAVE.quake(w, false), impact: S => { const h = hitPt(S); EX.rock(h.x, h.b.feet - 8, h.b.k, h.b.feet + 8); } });
  reg('Earth Power', { wave: w => WAVE.quake(w, true), impact: S => { const h = hitPt(S), b = h.b; pillar(b.i, b.feet, { w: 26 * b.k, h: 180, col: '255,140,50', ms: 600 }); EX.fire(b.i, b.feet - 20, b.k * 1.2); debris(b.i, b.feet - 6, 14, { floor: b.feet + 8 }); flash('#ffb070', .15); } });
  // Dig
  reg('Dig', { exec: S => burrow(S), impact: S => erupt(S) });
  window.PFX4 = { slashSet, blade, SH, SKY, WAVE };
})();
