/* =====================================================================
   Section 26: rebuilt slashes, wind, leaves, powders, sky attacks,
   waves, quakes and Dig (milestone 4). Same particle engine.
   ===================================================================== */
(function fxParticles4() {
  const P = window.PFX, P2 = window.PFX2, P3 = window.PFX3; if (!P || !P2 || !P3) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P, HIT = P2.HIT, TRAIL = P3.TRAIL;
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), N = n => Math.max(1, Math.round(n * QMUL()));
  const C = () => bctx;
  const hitAt = S => { const h = headOf(S); return { i: bx(h.x), j: by(h.y + 10) }; };
  const at = p => { const i = bx(p.x), j = by(p.y), ang = Math.atan2(p.vy, p.vx); return { i, j, ang, ca: Math.cos(ang), sa: Math.sin(ang) }; };
  const dustTex = () => P.tex('dust', [[0, 'rgba(200,180,150,.6)'], [.5, 'rgba(180,160,130,.3)'], [1, 'rgba(160,140,110,0)']]);
  const fn = (x, y, max, draw) => spawn({ x, y, vx: 0, vy: 0, drag: 1, max, r: 1, kind: 'fn', a: 1, draw });

  /* ---------- slash strokes: tapered glowing blades that sweep across the target ---------- */
  // one stroke: from (x0,y0) to (x1,y1), bowed by 'bend'; it draws itself in over the first 30% and fades out
  function blade(c, x0, y0, x1, y1, bend, w, col, glow, q) {
    const grow = Math.min(1, q / .3), fade = q > .45 ? Math.max(0, 1 - (q - .45) / .55) : 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1;
    const cx = mx + nx / L * bend, cy = my + ny / L * bend, steps = 18, end = Math.max(1, Math.round(steps * grow));
    const pt = t => { const u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; };
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [m, a, cc] of [[3.2, .25, glow], [1.7, .55, glow], [.7, 1, col]]) { c.strokeStyle = cc; c.globalAlpha = a * fade;
      for (let k = 0; k < end; k++) { const [ax, ay] = pt(k / steps), [bx2, by2] = pt((k + 1) / steps), taper = Math.sin(Math.PI * (k + .5) / steps); c.lineWidth = Math.max(.5, w * m * taper); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx2, by2); c.stroke(); } }
    c.restore();
  }
  function slashes(S, strokes, col, glow, w = 3, life = .45, sparks = '#ffffff') {
    const h = hitAt(S);
    strokes.forEach(([dx0, dy0, dx1, dy1, bend, delay = 0], k) => setTimeoutGame(delay, () => {
      fn(h.i, h.j, life, (c, q) => blade(c, h.i + dx0, h.j + dy0, h.i + dx1, h.j + dy1, bend, w, col, glow, q));
      for (let s = 0; s < N(8); s++) { const t = Math.random(), x = h.i + dx0 + (dx1 - dx0) * t, y = h.j + dy0 + (dy1 - dy0) * t, a = Math.atan2(dy1 - dy0, dx1 - dx0) + (Math.random() < .5 ? 1 : -1) * Math.PI / 2 + rnd(-.5, .5);
        spawn({ x, y, vx: Math.cos(a) * rnd(60, 160), vy: Math.sin(a) * rnd(60, 160), drag: .88, max: rnd(.15, .3), r: 1, len: rnd(6, 12), lw: 1.3, kind: 'streak', col: sparks, a: 1, add: true }); }
    }));
  }
  const claws = (dy = 0) => [[-22, -24 + dy, 14, 22 + dy, 6], [-14, -28 + dy, 22, 18 + dy, 6, 40], [-6, -32 + dy, 30, 14 + dy, 6, 80]];
  const X = [[-24, -24, 24, 24, 5], [24, -24, -24, 24, -5, 90]];

  /* ---------- projectiles: wind, leaves, powders ---------- */
  function leafShape(c, x, y, s, rot, col, vein) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * .55, s, 0); c.quadraticCurveTo(0, s * .55, -s, 0); c.fill(); c.strokeStyle = vein; c.lineWidth = .7; c.beginPath(); c.moveTo(-s * .8, 0); c.lineTo(s * .8, 0); c.stroke(); c.restore(); }
  const SH = {
    airSlash: p => { const s = at(p), c = C(); for (let n = due(p, 80); n > 0; n--) spawn({ x: s.i + rnd(-6, 6), y: s.j + rnd(-8, 8), vx: -s.ca * rnd(80, 160), vy: -s.sa * rnd(80, 160), drag: .9, max: .2, r: 1, len: 14, lw: 1.2, kind: 'streak', col: '#e8f6ff', a: .8, add: true });
      c.save(); c.translate(s.i, s.j); c.rotate(s.ang); c.globalCompositeOperation = 'lighter'; const sp = clock.t / 40;
      for (const [r, a, lw] of [[13, .25, 6], [13, .6, 3], [12, 1, 1.4]]) { c.strokeStyle = `rgba(220,240,255,${a})`; c.lineWidth = lw; c.beginPath(); c.arc(0, 0, r, -1.1 + Math.sin(sp) * .15, 1.1 + Math.sin(sp) * .15); c.stroke(); }
      c.restore(); },
    hurricane: p => { const s = at(p), c = C(), t = clock.t / 50;
      for (let n = due(p, 120); n > 0; n--) { const a = rnd(0, T); spawn({ x: s.i + Math.cos(a) * 14, y: s.j + rnd(-24, 10), vx: -Math.sin(a) * 120 - s.ca * 40, vy: rnd(-40, 10), drag: .9, max: rnd(.25, .45), r: 1, len: 10, lw: 1.2, kind: 'streak', col: Math.random() < .3 ? '#c8b48a' : '#e8f6ff', a: .9, add: Math.random() < .7 }); }
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 9; k++) { const f = k / 8, y = s.j + 14 - f * 44, rx = 6 + f * 18, off = Math.sin(t + k * .8) * 4; c.strokeStyle = `rgba(220,240,255,${.25 + .45 * (1 - f * .5)})`; c.lineWidth = 2.2 - f; c.beginPath(); c.ellipse(s.i + off, y, rx, rx * .32, 0, t * 2 + k, t * 2 + k + 4.4); c.stroke(); }
      c.restore(); },
    fairyWind: p => { const s = at(p), t = clock.t / 120;
      for (let n = due(p, 160); n > 0; n--) { const a = t * 3 + rnd(0, T), r = rnd(4, 16); spawn({ x: s.i + Math.cos(a) * r, y: s.j + Math.sin(a) * r * .7, vx: -Math.sin(a) * 60 - s.ca * 30, vy: Math.cos(a) * 40 - s.sa * 30, drag: .93, max: rnd(.35, .6), r: rnd(2, 4), grow: .2, kind: Math.random() < .5 ? 'shard' : undefined, img: hueTex(rnd(310, 340) | 0, 90, 75), col: Math.random() < .5 ? '#ffffff' : '#ffb0e0', rot: rnd(0, T), vr: rnd(-6, 6), a: 1, add: true }); }
      P.hub(s.i, s.j, 12, '#fff', 'rgba(255,170,220,A)', .8); },
    razorLeaf: (p, storm) => { const s = at(p), c = C(), n = storm ? 9 : 3, R = storm ? 18 : 5;
      for (let k = 0; k < n; k++) { const a = clock.t / (storm ? 110 : 60) + k * T / n, x = s.i + Math.cos(a) * R * (storm ? 1 : .6), y = s.j + Math.sin(a) * R * .6; leafShape(c, x, y, storm ? 6 : 6.5, clock.t / 40 + k, k % 2 ? '#7fe05a' : '#3fb04a', '#c8f58a'); }
      for (let m = due(p, storm ? 120 : 40); m > 0; m--) spawn({ x: s.i + rnd(-R, R), y: s.j + rnd(-R, R) * .6, vx: rnd(-30, 30), vy: rnd(-30, 30), drag: .93, max: rnd(.3, .5), r: rnd(2, 4), grow: .3, img: hueTex(rnd(95, 125) | 0, 80, 58), a: .8, add: true });
      if (storm) P.hub(s.i, s.j, 14, '#fff', 'rgba(140,230,90,A)', .55); },
    powder: (p, hue, sparkle) => { const s = at(p);
      for (let n = due(p, 150); n > 0; n--) spawn({ x: s.i + rnd(-10, 10), y: s.j + rnd(-10, 10), vx: rnd(-25, 25) - s.ca * 20, vy: rnd(-25, 15), drag: .96, ay: 10, max: rnd(.6, 1.1), r: rnd(2.5, 5), grow: .6, img: hueTex((hue + rnd(-15, 15)) | 0, 80, 70), a: .9, add: true });
      if (Math.random() < .5) spawn({ x: s.i + rnd(-12, 12), y: s.j + rnd(-12, 12), vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .9, max: .35, r: rnd(1.5, 3), grow: .2, kind: 'shard', col: sparkle, rot: rnd(0, T), vr: 6, a: 1, add: true });
      P.hub(s.i, s.j, 11, '#fff', `hsla(${hue},80%,70%,A)`.replace('hsla(', 'hsla('), .35); }
  };

  /* ---------- sky attacks (ground-target marks) ---------- */
  function rockShape(c, x, y, s, rot, base, light) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = base; c.beginPath(); [[-1, -.4], [-.4, -1], [.6, -.9], [1, -.1], [.7, .8], [-.2, 1], [-1, .5]].forEach(([a, b], k) => k ? c.lineTo(a * s, b * s) : c.moveTo(a * s, b * s)); c.closePath(); c.fill(); c.fillStyle = light; c.beginPath(); c.moveTo(-.6 * s, -.4 * s); c.lineTo(-.2 * s, -.8 * s); c.lineTo(.4 * s, -.6 * s); c.lineTo(0, -.1 * s); c.closePath(); c.fill(); c.restore(); }
  const SKY = {
    blizzard: (mk, q) => { const x = bx(mk.x), y = by(mk.y), r = mk.r / 2;
      P.hub(x, y - 10, r * 1.4, '#fff', 'rgba(200,240,255,A)', .25 + q * .25);
      for (let n = due(mk, 260); n > 0; n--) spawn({ x: x + rnd(-r * 2, r), y: y - rnd(60, 140), vx: rnd(90, 180), vy: rnd(120, 220), drag: .99, max: rnd(.5, .8), r: rnd(1.4, 2.6), grow: 0, kind: 'drop', col: '#ffffff', a: .95, add: true });
      if (Math.random() < .5 * QMUL()) spawn({ x: x + rnd(-r, r), y: y + rnd(-r, r) * .5, vx: rnd(-40, 40), vy: rnd(-10, 10), drag: .97, max: rnd(.6, 1), r: rnd(8, 14), grow: 1.2, img: steamTex(), a: .6, add: false });
      if (q > .85 && !mk._done) { mk._done = 1; for (let k = 0; k < N(30); k++) { const a = rnd(0, T); spawn({ x, y: y - 6, vx: Math.cos(a) * rnd(60, 200), vy: Math.sin(a) * rnd(40, 140) - 40, drag: .92, ay: 120, max: rnd(.5, .9), r: rnd(3, 6), grow: .1, kind: 'shard', col: k % 2 ? '#ffffff' : '#aef0ff', rot: rnd(0, T), vr: rnd(-6, 6), a: 1, add: true }); } } },
    rockSlide: (mk, q, edge) => { const x = bx(mk.x), y = by(mk.y), r = mk.r / 2, c = C();
      c.save(); c.globalAlpha = .2 + q * .3; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y, r * (1 - q * .3), r * .35 * (1 - q * .3), 0, 0, T); c.fill(); c.restore();   // the shadow grows darker
      const rocks = mk._rocks || (mk._rocks = Array.from({ length: 6 }, () => ({ dx: rnd(-r * .8, r * .8), dy: rnd(-r * .3, r * .3), s: rnd(7, 13), d: rnd(0, .25), rot: rnd(0, T) })));
      for (const k of rocks) { const f = Math.max(0, Math.min(1, (q - .35 - k.d) / .45)); if (f <= 0 || f >= 1) { if (f >= 1 && !k.hit) { k.hit = 1; for (let s = 0; s < N(6); s++) { const a = rnd(Math.PI, T); spawn({ x: x + k.dx, y: y + k.dy, vx: Math.cos(a) * rnd(40, 120), vy: Math.sin(a) * rnd(40, 100), drag: .95, ay: 260, max: rnd(.4, .7), r: rnd(1.5, 3), grow: 0, kind: 'drop', col: '#8a7650', a: 1, add: false }); } spawn({ x: x + k.dx, y: y + k.dy, vx: 0, vy: -10, drag: .97, max: .8, r: 9, grow: 1.4, img: dustTex(), a: .6, add: false }); } continue; }
        rockShape(c, x + k.dx, y + k.dy - (1 - f) * 220, k.s, k.rot + f * 4, '#8a7650', '#c8b080'); } },
    stoneEdge: (mk, q) => { const x = bx(mk.x), y = by(mk.y), r = mk.r / 2, c = C();
      if (q < .7) { c.save(); c.strokeStyle = `rgba(80,60,40,${.3 + q * .5})`; c.lineWidth = 1.4; for (let k = 0; k < 6; k++) { const a = k * T / 6 + .3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * q * 1.2, y + Math.sin(a) * r * .45 * q * 1.2); c.stroke(); } c.restore(); return; }
      const f = Math.min(1, (q - .7) / .2), spikes = mk._sp || (mk._sp = Array.from({ length: 10 }, (_, k) => ({ dx: rnd(-r * 1.1, r * 1.1), dy: rnd(-r * .4, r * .4), h: rnd(42, 74), w: rnd(10, 16) }))).sort((a, b) => a.dy - b.dy);
      c.save(); for (const s of spikes) { const hh = s.h * f, bxx = x + s.dx, byy = y + s.dy; c.fillStyle = '#7a6a54'; c.beginPath(); c.moveTo(bxx - s.w, byy); c.lineTo(bxx, byy - hh); c.lineTo(bxx + s.w, byy); c.closePath(); c.fill(); c.fillStyle = '#b8a888'; c.beginPath(); c.moveTo(bxx - s.w * .6, byy); c.lineTo(bxx, byy - hh); c.lineTo(bxx - s.w * .1, byy); c.closePath(); c.fill(); }
      c.restore(); if (!mk._done && f > .5) { mk._done = 1; for (let k = 0; k < N(24); k++) { const a = rnd(Math.PI, T); spawn({ x: x + rnd(-r, r) * .6, y, vx: Math.cos(a) * rnd(60, 180), vy: Math.sin(a) * rnd(80, 200), drag: .95, ay: 320, max: rnd(.5, .8), r: rnd(1.6, 3.2), grow: 0, kind: 'drop', col: '#8a7650', a: 1, add: false }); } } }
  };

  /* ---------- waves (an expanding ring from the attacker) ---------- */
  const WAVE = {
    surf: w => { const i = bx(w.x), j = by(w.y), R = w.r / 2, c = C(), q = Math.min(1, w.r / w.maxR), fade = q > .8 ? (1 - q) / .2 : 1;
      c.save(); for (const [dr, col, a] of [[0, 'rgba(30,110,210,.55)', 1], [-6, 'rgba(60,160,240,.6)', 1], [-11, 'rgba(160,220,255,.7)', 1]]) { const rr = Math.max(2, R + dr); c.strokeStyle = col; c.globalAlpha = fade * a; c.lineWidth = 9 - dr * .3; c.beginPath(); c.ellipse(i, j, rr, rr * .5, 0, 0, T); c.stroke(); }
      const H = 26 * (1 - q * .4);                                                 // the wave wall: the front half rises
      for (let k = 0; k <= 8; k++) { const f = k / 8; c.strokeStyle = f > .8 ? 'rgba(220,245,255,.9)' : `rgba(${40 + f * 120 | 0},${130 + f * 100 | 0},${220 + f * 30 | 0},.7)`; c.globalAlpha = fade; c.lineWidth = 4; c.beginPath(); c.ellipse(i, j - f * H, R, R * .5, 0, .15, Math.PI - .15); c.stroke(); }
      c.globalAlpha = fade; c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.setLineDash([6, 5]); c.lineDashOffset = -clock.t / 30; c.beginPath(); c.ellipse(i, j - 4, R + 3, (R + 3) * .5, 0, 0, T); c.stroke(); c.restore();
      for (let n = due(w, 240); n > 0; n--) { const a = rnd(0, T), x = i + Math.cos(a) * R, y = j + Math.sin(a) * R * .5; spawn({ x, y: y - 4, vx: Math.cos(a) * rnd(20, 70), vy: -rnd(40, 110), drag: .97, ay: 300, max: rnd(.35, .6), r: rnd(1.3, 2.4), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#ffffff' : '#bfe8ff', a: fade, add: true }); } },
    buzz: w => { const i = bx(w.x), j = by(w.y), R = w.r / 2, c = C(), q = Math.min(1, w.r / w.maxR), fade = q > .75 ? (1 - q) / .25 : 1;
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const rr = R - k * 12; if (rr < 3) continue; const jit = Math.sin(clock.t / 20 + k) * 1.5; c.strokeStyle = `rgba(190,240,90,${(.8 - k * .17) * fade})`; c.lineWidth = 2.4 - k * .4; c.beginPath(); c.ellipse(i, j - 20, rr + jit, (rr + jit) * .55, 0, 0, T); c.stroke(); } c.restore();
      if (Math.random() < .6 * QMUL()) { const a = rnd(0, T); spawn({ x: i + Math.cos(a) * R, y: j - 20 + Math.sin(a) * R * .55, vx: Math.cos(a) * 60, vy: Math.sin(a) * 30, drag: .9, max: .3, r: rnd(2, 4), grow: .3, img: hueTex(80, 85, 60), a: fade, add: true }); } },
    quake: w => { const i = bx(w.x), j = by(w.y), R = w.r / 2, c = C(), q = Math.min(1, w.r / w.maxR), fade = q > .8 ? (1 - q) / .2 : 1;
      c.save(); for (let k = 0; k < 3; k++) { const rr = R - k * 16; if (rr < 3) continue; c.strokeStyle = k ? 'rgba(160,130,90,.5)' : 'rgba(110,80,50,.8)'; c.globalAlpha = fade; c.lineWidth = 3 - k * .7; c.beginPath(); c.ellipse(i, j, rr, rr * .45, 0, 0, T); c.stroke(); } c.restore();
      if (!w._cracks) w._cracks = Array.from({ length: 8 }, (_, k) => ({ a: k * T / 8 + rnd(-.2, .2), j: Array.from({ length: 6 }, () => rnd(-.18, .18)) }));
      c.save(); c.strokeStyle = 'rgba(50,34,20,.75)'; c.globalAlpha = fade; c.lineWidth = 1.6; for (const k of w._cracks) { c.beginPath(); c.moveTo(i, j); k.j.forEach((d, s) => { const rr = R * (s + 1) / 6, a = k.a + d; c.lineTo(i + Math.cos(a) * rr, j + Math.sin(a) * rr * .45); }); c.stroke(); } c.restore();
      for (let n = due(w, 160); n > 0; n--) { const a = rnd(0, T), x = i + Math.cos(a) * R, y = j + Math.sin(a) * R * .45;
        if (Math.random() < .5) spawn({ x, y, vx: Math.cos(a) * rnd(10, 40), vy: -rnd(80, 180), drag: .97, ay: 420, max: rnd(.4, .7), r: rnd(1.6, 3.4), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#8a6a40' : '#b89a6a', a: 1, add: false });
        else spawn({ x, y, vx: Math.cos(a) * 30, vy: -rnd(10, 30), drag: .96, max: rnd(.5, .9), r: rnd(6, 11), grow: 1.4, img: dustTex(), a: .5 * fade, add: false }); } },
    earthPower: w => { WAVE.quake(w); const i = bx(w.x), j = by(w.y), R = w.r / 2;
      for (let n = due(w._g || (w._g = {}), 80); n > 0; n--) { const a = rnd(0, T), x = i + Math.cos(a) * R * rnd(.4, 1), y = j + Math.sin(a) * R * .45 * rnd(.4, 1);
        spawn({ x, y, vx: rnd(-10, 10), vy: -rnd(120, 240), drag: .95, ay: -20, max: rnd(.35, .6), r: rnd(4, 8), grow: .8, img: fireTex(rnd(18, 36) | 0), a: .9, add: true }); } }
  };

  /* ---------- Dig: burrow, a dust tunnel underground, then an eruption ---------- */
  function burrow(S) { const sd = side(S), i = bx(sd.x), j = by(sd.y);
    for (let k = 0; k < N(22); k++) { const a = rnd(Math.PI, T); spawn({ x: i, y: j, vx: Math.cos(a) * rnd(40, 140), vy: Math.sin(a) * rnd(60, 180), drag: .95, ay: 360, max: rnd(.4, .7), r: rnd(1.6, 3.2), grow: 0, kind: 'drop', col: '#8a6a40', a: 1, add: false }); }
    for (let k = 0; k < N(8); k++) spawn({ x: i + rnd(-10, 10), y: j, vx: rnd(-30, 30), vy: -rnd(10, 30), drag: .96, max: rnd(.6, 1), r: rnd(7, 12), grow: 1.3, img: dustTex(), a: .6, add: false });
    const tS = side(S === 'A' ? 'B' : 'A'), ti = bx(tS.x), tj = by(tS.y);
    for (let k = 1; k <= 8; k++) setTimeoutGame(k * 55, () => { const f = k / 8, x = i + (ti - i) * f, y = j + (tj - j) * f; spawn({ x, y, vx: rnd(-15, 15), vy: -rnd(5, 20), drag: .96, max: rnd(.5, .8), r: rnd(6, 10), grow: 1.2, img: dustTex(), a: .55, add: false });
      spawn({ x, y, vx: 0, vy: 0, drag: 1, max: .5, r: 5, grow: 1.5, kind: 'ring', col: '#6a5030', lw: 1.4, squash: .4, a: .7, add: false }); });
  }
  function erupt(S) { const h = hitAt(S), sd = side(S), y = by(sd.y);
    for (let k = 0; k < N(30); k++) { const a = rnd(Math.PI * 1.1, Math.PI * 1.9); spawn({ x: h.i + rnd(-8, 8), y, vx: Math.cos(a) * rnd(40, 160), vy: Math.sin(a) * rnd(160, 320), drag: .96, ay: 480, max: rnd(.5, .9), r: rnd(1.8, 3.6), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#8a6a40' : '#b89a6a', a: 1, add: false }); }
    for (let k = 0; k < N(12); k++) spawn({ x: h.i + rnd(-12, 12), y: y - rnd(0, 10), vx: rnd(-50, 50), vy: -rnd(20, 70), drag: .96, max: rnd(.6, 1.1), r: rnd(8, 14), grow: 1.3, img: dustTex(), a: .6, add: false });
    spawn({ x: h.i, y, vx: 0, vy: 0, drag: 1, max: .45, r: 8, grow: 6, kind: 'ring', col: '#8a6a40', lw: 2.4, squash: .35, a: .9, add: false }); }

  /* ---------- register ---------- */
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.shot) o.shot = p => { const c = bctx, i = bx(p.x), j = by(p.y), K = 1.4; c.save(); c.translate(i, j); c.scale(K, K); c.translate(-i, -j); try { r.shot(p); } finally { c.restore(); } };
    for (const k of ['markDraw', 'wave', 'dash']) if (r[k]) o[k] = r[k];
    for (const k of ['impact', 'exec']) if (r[k]) { const prev = old[k]; o[k] = (...a) => { if (prev) try { prev(...a); } catch (e) { console.error(e); } try { r[k](...a); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  // slashes
  reg('Slash', { dash: S => TRAIL.speed(S), impact: S => slashes(S, [[-26, -20, 26, 18, 10]], '#ffffff', '#cfe4ff', 3.2) });
  reg('Karate Chop', { dash: S => TRAIL.speed(S, '#ffd8a0'), impact: S => { slashes(S, [[-18, -30, 14, 24, 4]], '#fff4e0', '#ff9a40', 3.6, .4, '#ffd8a0'); HIT.ring(S, '#ffb060', 2); } });
  reg('Cross Chop', { dash: S => TRAIL.aura(S, 25), impact: S => { slashes(S, X, '#fff4e0', '#ff9a40', 3.8, .45, '#ffd8a0'); setTimeoutGame(120, () => P3.fist(S, '#ffd8a0', 1.2)); } });
  reg('Aerial Ace', { dash: S => { TRAIL.speed(S, '#d8f0ff'); TRAIL.speed(S); }, impact: S => slashes(S, [[-34, 10, 34, -14, -6]], '#ffffff', '#8fd0ff', 2.6, .35, '#d8f0ff') });
  reg('X-Scissor', { dash: S => TRAIL.speed(S, '#d8f080'), impact: S => slashes(S, X, '#f4ffd0', '#9adf3a', 3.4, .45, '#d8f080') });
  reg('Shadow Claw', { dash: S => TRAIL.smoke(S), impact: S => { slashes(S, claws(), '#e8dcff', '#7a4adf', 3, .5, '#b9a4ff'); HIT.smoke(S, 10); } });
  reg('Dragon Claw', { dash: S => TRAIL.aura(S, 250, 85), impact: S => { slashes(S, claws(), '#ffffff', '#7a6aff', 3.2, .5, '#c8c0ff'); HIT.spark(S, '#8a78ff', 16); } });
  reg('Metal Claw', { dash: S => TRAIL.speed(S, '#e8f0ff'), impact: S => { slashes(S, claws(), '#ffffff', '#a8b8c8', 3, .45, '#ffffff'); HIT.shards(S, ['#ffffff', '#c6d2de'], 12); } });
  reg('Wing Attack', { dash: S => TRAIL.speed(S, '#eaf6ff'), impact: S => { slashes(S, [[-30, -6, 20, -26, 12], [-30, 10, 22, 26, -12, 60]], '#ffffff', '#bfe0ff', 3, .45, '#eaf6ff'); } });
  reg('Vine Whip', { dash: S => TRAIL.speed(S, '#c8f58a'), impact: S => { slashes(S, [[-40, -30, 22, 10, 22], [-40, 26, 24, -6, -22, 90]], '#c8f58a', '#3fb04a', 2.6, .5, '#7fe05a'); HIT.shards(S, ['#7fe05a', '#3fb04a'], 10); } });
  reg('Crabhammer', { dash: S => TRAIL.water(S), impact: S => { slashes(S, [[-26, -26, 4, 0, 12], [-26, 26, 4, 0, -12]], '#ffffff', '#5ab4ff', 4, .4, '#cfeeff'); HIT.water(S, 40); HIT.ring(S, '#bfe8ff', 3); } });
  // wind, leaves, powders
  reg('Air Slash', { shot: SH.airSlash, impact: S => slashes(S, [[-22, 14, 22, -14, -8]], '#ffffff', '#bfe0ff', 2.4, .35) });
  reg('Hurricane', { shot: SH.hurricane, impact: S => { HIT.ring(S, '#e8f6ff', 3); const h = hitAt(S); for (let k = 0; k < N(30); k++) { const a = rnd(0, T); spawn({ x: h.i + Math.cos(a) * 14, y: h.j + Math.sin(a) * 8, vx: -Math.sin(a) * 200, vy: Math.cos(a) * 80 - 60, drag: .9, max: .4, r: 1, len: 12, lw: 1.3, kind: 'streak', col: '#e8f6ff', a: 1, add: true }); } } });
  reg('Fairy Wind', { shot: SH.fairyWind, impact: S => { HIT.shards(S, ['#ffffff', '#ffb0e0', '#ffe8f6'], 22); } });
  reg('Razor Leaf', { shot: p => SH.razorLeaf(p, false), impact: S => { HIT.shards(S, ['#7fe05a', '#3fb04a', '#c8f58a'], 14); slashes(S, [[-16, -12, 16, 12, 4]], '#e8ffd0', '#3fb04a', 2, .3, '#c8f58a'); } });
  reg('Leaf Storm', { shot: p => SH.razorLeaf(p, true), impact: S => { HIT.shards(S, ['#7fe05a', '#3fb04a', '#c8f58a'], 40); HIT.ring(S, '#c8f58a', 3); } });
  reg('Sleep Powder', { shot: p => SH.powder(p, 170, '#e0fff8'), impact: S => { const h = hitAt(S); for (let k = 0; k < N(30); k++) spawn({ x: h.i + rnd(-16, 16), y: h.j + rnd(-16, 12), vx: rnd(-20, 20), vy: rnd(-25, 5), drag: .97, max: rnd(.8, 1.3), r: rnd(3, 6), grow: .6, img: hueTex(rnd(155, 190) | 0, 80, 70), a: .9, add: true }); } });
  reg('Stun Spore', { shot: p => SH.powder(p, 48, '#fff6a0'), impact: S => { const h = hitAt(S); for (let k = 0; k < N(30); k++) spawn({ x: h.i + rnd(-16, 16), y: h.j + rnd(-16, 12), vx: rnd(-20, 20), vy: rnd(-25, 5), drag: .97, max: rnd(.8, 1.3), r: rnd(3, 6), grow: .6, img: hueTex(rnd(38, 58) | 0, 90, 66), a: .9, add: true }); HIT.spark(S, '#ffe84a', 14); } });
  // sky attacks
  reg('Blizzard', { markDraw: SKY.blizzard, impact: S => HIT.shards(S, ['#ffffff', '#aef0ff', '#5ccfee'], 24) });
  reg('Rock Slide', { markDraw: SKY.rockSlide, impact: S => { HIT.shards(S, ['#8a7650', '#c8b080', '#5a4a30'], 16); HIT.smoke(S, 8); } });
  reg('Stone Edge', { markDraw: SKY.stoneEdge, impact: S => HIT.shards(S, ['#7a6a54', '#b8a888', '#ffffff'], 18) });
  // waves and quakes
  reg('Surf', { wave: WAVE.surf, impact: S => { HIT.water(S, 40); HIT.ring(S, '#bfe8ff', 2); } });
  reg('Bug Buzz', { wave: WAVE.buzz, impact: S => HIT.spark(S, '#b8f04a', 24) });
  reg('Earthquake', { wave: WAVE.quake, impact: S => { HIT.shards(S, ['#8a6a40', '#b89a6a'], 14); HIT.smoke(S, 8); } });
  reg('Earth Power', { wave: WAVE.earthPower, impact: S => { HIT.fire(S, 30); HIT.shards(S, ['#8a6a40', '#b89a6a'], 12); } });
  // Dig
  reg('Dig', { exec: S => burrow(S), impact: S => erupt(S) });
  window.PFX4 = { slashes, SH, SKY, WAVE };
})();
