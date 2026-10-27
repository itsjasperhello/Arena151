/* =====================================================================
   Section 24: rebuilt projectiles, bursts and lightning (milestone 2)
   Same particle engine as the beams (fxparticles.js): every projectile
   gets a drawn body, a particle trail, and a particle burst on impact,
   layered on top of the existing hit effects.
   Moves: Ember, Water Gun, Bubble Beam, Seed Bomb, Energy Ball, Ice Shard,
   Aura Sphere, Poison Sting, Sludge Bomb, Gunk Shot, Mud Shot, Shadow Ball,
   Rock Throw, Moonblast, Fire Blast, Dazzling Gleam, Swift, Pin Missile,
   Thunder Shock, Thunderbolt, Thunder.
   ===================================================================== */
(function fxParticles2() {
  const P = window.PFX; if (!P) return;
  const { spawn, due, hub, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P;
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a);
  const C = () => bctx;
  // where a shot is, which way it flies (art pixels)
  const at = p => { const i = bx(p.x), j = by(p.y), ang = Math.atan2(p.vy, p.vx); return { i, j, ang, ca: Math.cos(ang), sa: Math.sin(ang) }; };
  // the side being hit, in art pixels (impact hooks receive that side)
  const hitAt = S => { const h = headOf(S); return { i: bx(h.x), j: by(h.y + 10) }; };
  function glowBall(i, j, r, stops) { const c = C(), g = c.createRadialGradient(i, j, 0, i, j, r); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, T); c.fill(); c.restore(); }
  function solidBall(i, j, r, body, hi) { const c = C(), g = c.createRadialGradient(i - r * .35, j - r * .35, r * .1, i, j, r); g.addColorStop(0, hi); g.addColorStop(.45, body); g.addColorStop(1, body); c.save(); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, T); c.fill(); c.restore(); }
  function burst(i, j, n, mk) { for (let k = 0; k < Math.round(n * QMUL()); k++) spawn(mk(k, rnd(0, T))); }
  const trail = (p, rate, mk) => { const s = at(p); for (let n = due(p, rate); n > 0; n--) spawn(mk(s)); return s; };

  /* ---------- projectiles ---------- */
  const SH = {
    ember: p => { const s = trail(p, 160, s => ({ x: s.i + rnd(-2, 2), y: s.j + rnd(-2, 2), vx: -s.ca * rnd(20, 60) + rnd(-15, 15), vy: -s.sa * rnd(20, 60) - rnd(10, 30), drag: .95, ay: -60, max: rnd(.3, .55), r: rnd(3, 6), grow: .5, img: fireTex(rnd(14, 42) | 0), a: 1, add: true }));
      glowBall(s.i, s.j, 9, [[0, 'rgba(255,255,230,1)'], [.35, 'rgba(255,190,60,.9)'], [1, 'rgba(255,80,10,0)']]); },
    fireBlast: p => { const s = trail(p, 420, s => { const a = s.ang + Math.PI + rnd(-.6, .6); return { x: s.i + rnd(-5, 5), y: s.j + rnd(-5, 5), vx: Math.cos(a) * rnd(40, 120), vy: Math.sin(a) * rnd(40, 120) - 20, drag: .94, ay: -70, max: rnd(.4, .75), r: rnd(6, 13), grow: .7, img: fireTex(rnd(12, 40) | 0), a: 1, add: true }; });
      glowBall(s.i, s.j, 20, [[0, 'rgba(255,255,240,1)'], [.3, 'rgba(255,220,120,.95)'], [.65, 'rgba(255,120,30,.6)'], [1, 'rgba(200,40,0,0)']]);
      if (Math.random() < .5) spawn({ x: s.i, y: s.j, vx: rnd(-30, 30), vy: -rnd(20, 60), drag: .99, ay: -10, max: rnd(.8, 1.3), r: rnd(6, 10), grow: 1.2, img: smokeTex(), a: .45, add: false }); },
    water: p => { const s = trail(p, 120, s => ({ x: s.i, y: s.j, vx: -s.ca * rnd(10, 40) + rnd(-25, 25), vy: -s.sa * rnd(10, 40) + rnd(-25, 25), drag: .98, ay: 260, max: rnd(.3, .6), r: rnd(1.2, 2.2), grow: 0, kind: 'drop', col: '#cfeeff', a: 1, add: true }));
      const w = Math.sin(clock.t / 40) * 1.2; solidBall(s.i, s.j, 7 + w * .4, '#3a9ef0', '#e8f8ff'); glowBall(s.i, s.j, 12, [[0, 'rgba(160,220,255,.5)'], [1, 'rgba(60,150,255,0)']]); },
    bubbles: p => { const s = at(p), c = C(); c.save();
      for (let k = 0; k < 5; k++) { const a = clock.t / 200 + k * 1.3, r = 3 + (k % 3) * 1.6, x = s.i + Math.cos(a) * 6, y = s.j + Math.sin(a * 1.3) * 5;
        c.globalAlpha = .9; c.strokeStyle = '#bfe8ff'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, T); c.stroke(); c.globalAlpha = .18; c.fillStyle = '#7fd0ff'; c.fill(); c.globalAlpha = .9; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x - r * .35, y - r * .35, r * .25, 0, T); c.fill(); }
      c.restore(); for (let n = due(p, 30); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-20, 20), vy: -rnd(10, 30), drag: .98, max: rnd(.5, .9), r: rnd(1.5, 3), grow: .3, kind: 'ring', col: '#bfe8ff', lw: .8, a: .9, add: true }); },
    seed: p => { const s = trail(p, 60, s => ({ x: s.i, y: s.j, vx: rnd(-25, 25), vy: rnd(-25, 25), drag: .95, max: rnd(.3, .5), r: rnd(2, 3.5), grow: .3, img: hueTex(105, 80, 55), a: .9, add: true }));
      glowBall(s.i, s.j, 11, [[0, 'rgba(200,255,140,.6)'], [1, 'rgba(80,200,60,0)']]); const c = C(); c.save(); c.translate(s.i, s.j); c.rotate(clock.t / 120); c.fillStyle = '#8a5a2a'; c.beginPath(); c.ellipse(0, 0, 6, 4.2, 0, 0, T); c.fill(); c.fillStyle = '#d8a860'; c.beginPath(); c.ellipse(-1.6, -1.2, 2.2, 1.4, 0, 0, T); c.fill(); c.restore(); },
    energy: p => { const s = trail(p, 160, s => ({ x: s.i + rnd(-4, 4), y: s.j + rnd(-4, 4), vx: -s.ca * rnd(10, 30), vy: -s.sa * rnd(10, 30), drag: .95, max: rnd(.35, .6), r: rnd(3, 6), grow: .6, img: hueTex(rnd(85, 120) | 0, 90, 60), a: .9, add: true }));
      glowBall(s.i, s.j, 16, [[0, 'rgba(240,255,220,1)'], [.35, 'rgba(160,240,110,.85)'], [.7, 'rgba(80,190,60,.4)'], [1, 'rgba(40,140,40,0)']]);
      const c = C(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(230,255,200,.8)'; c.lineWidth = 1.1; for (let k = 0; k < 3; k++) { const a = clock.t / 90 + k * T / 3; c.beginPath(); c.arc(s.i, s.j, 7, a, a + 1.6); c.stroke(); } c.restore(); },
    iceShard: p => { const s = trail(p, 90, s => ({ x: s.i, y: s.j, vx: rnd(-15, 15), vy: rnd(-15, 15), drag: .95, max: rnd(.4, .7), r: rnd(4, 7), grow: 1, img: steamTex(), a: .5, add: false }));
      const c = C(); c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) { c.save(); c.translate(s.i - s.ca * k * 7, s.j - s.sa * k * 7); c.rotate(s.ang + Math.PI / 2 + Math.sin(clock.t / 80 + k) * .3); const r = 7 - k * 1.5;
        c.fillStyle = k ? 'rgba(160,230,255,.85)' : 'rgba(240,252,255,1)'; c.beginPath(); c.moveTo(0, -r); c.lineTo(r * .45, 0); c.lineTo(0, r * .9); c.lineTo(-r * .45, 0); c.closePath(); c.fill(); c.restore(); }
      c.restore(); glowBall(s.i, s.j, 10, [[0, 'rgba(200,245,255,.6)'], [1, 'rgba(120,210,255,0)']]); },
    aura: p => { const s = trail(p, 200, s => ({ x: s.i + rnd(-4, 4), y: s.j + rnd(-4, 4), vx: -s.ca * rnd(30, 80), vy: -s.sa * rnd(30, 80) - 10, drag: .95, ay: -30, max: rnd(.3, .55), r: rnd(4, 8), grow: .6, img: hueTex(rnd(205, 225) | 0, 100, 62), a: 1, add: true }));
      glowBall(s.i, s.j, 17, [[0, 'rgba(255,255,255,1)'], [.3, 'rgba(160,215,255,.95)'], [.65, 'rgba(60,140,255,.55)'], [1, 'rgba(30,60,200,0)']]);
      const c = C(); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(200,235,255,.85)'; c.lineWidth = 1.2;
      for (let k = 0; k < 2; k++) { c.beginPath(); c.ellipse(s.i, s.j, 14, 5, clock.t / 150 + k * Math.PI / 2, 0, T); c.stroke(); } c.restore(); },
    sting: p => { const s = trail(p, 70, s => ({ x: s.i, y: s.j, vx: rnd(-10, 10), vy: rnd(10, 40), drag: .98, ay: 160, max: rnd(.4, .7), r: rnd(1.2, 2), grow: 0, kind: 'drop', col: '#c070ff', a: .9, add: true }));
      const c = C(); c.save(); c.lineCap = 'round'; c.strokeStyle = '#efe0ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(s.i - s.ca * 13, s.j - s.sa * 13); c.lineTo(s.i + s.ca * 4, s.j + s.sa * 4); c.stroke();
      c.strokeStyle = '#a050e0'; c.lineWidth = 1; c.stroke(); c.restore(); glowBall(s.i, s.j, 7, [[0, 'rgba(220,160,255,.8)'], [1, 'rgba(150,60,220,0)']]); },
    sludge: (p, big) => { const r = big ? 11 : 8, s = trail(p, big ? 70 : 45, s => ({ x: s.i + rnd(-r, r) * .5, y: s.j + rnd(-r, r) * .5, vx: -s.ca * rnd(10, 30), vy: rnd(10, 40), drag: .98, ay: 220, max: rnd(.4, .8), r: rnd(2, 4), grow: 0, kind: 'drop', col: big ? '#6a3a8a' : '#8c3fc0', a: 1, add: false }));
      solidBall(s.i, s.j, r + Math.sin(clock.t / 60) * .8, big ? '#5a2a7a' : '#7a32b0', big ? '#d8a8ff' : '#e3a6ff');
      const c = C(); c.save(); c.fillStyle = 'rgba(30,10,50,.55)'; for (let k = 0; k < 3; k++) { const a = clock.t / 200 + k * 2.1; c.beginPath(); c.arc(s.i + Math.cos(a) * r * .5, s.j + Math.sin(a) * r * .5, r * .22, 0, T); c.fill(); } c.restore(); },
    mud: p => { const s = trail(p, 60, s => ({ x: s.i, y: s.j, vx: rnd(-30, 30) - s.ca * 20, vy: -rnd(10, 40), drag: .98, ay: 300, max: rnd(.4, .7), r: rnd(1.6, 3), grow: 0, kind: 'drop', col: '#7a5a34', a: 1, add: false }));
      solidBall(s.i, s.j, 8, '#6a4a28', '#b08a58'); },
    shadow: p => { const s = trail(p, 200, s => ({ x: s.i + rnd(-5, 5), y: s.j + rnd(-5, 5), vx: -s.ca * rnd(20, 60) + rnd(-20, 20), vy: -s.sa * rnd(20, 60) + rnd(-20, 20), drag: .95, max: rnd(.4, .7), r: rnd(5, 9), grow: 1, img: smokeTex(), a: .9, add: false }));
      glowBall(s.i, s.j, 19, [[0, 'rgba(120,70,220,.0)'], [.55, 'rgba(150,90,255,.75)'], [.8, 'rgba(90,40,200,.45)'], [1, 'rgba(40,10,120,0)']]);
      const c = C(); c.save(); const g = c.createRadialGradient(s.i, s.j, 0, s.i, s.j, 11); g.addColorStop(0, 'rgba(10,0,20,1)'); g.addColorStop(.8, 'rgba(30,10,60,.95)'); g.addColorStop(1, 'rgba(60,20,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(s.i, s.j, 11, 0, T); c.fill(); c.restore();
      if (Math.random() < .5) spawn({ x: s.i, y: s.j, vx: rnd(-50, 50), vy: rnd(-50, 50), drag: .93, max: rnd(.3, .5), r: rnd(3, 5), grow: .5, img: hueTex(275, 90, 60), a: .9, add: true }); },
    rock: p => { const s = trail(p, 50, s => ({ x: s.i, y: s.j, vx: rnd(-20, 20), vy: -rnd(0, 20), drag: .97, ay: 40, max: rnd(.4, .7), r: rnd(4, 7), grow: 1.2, img: smokeTex(), a: .4, add: false }));
      const c = C(); c.save(); c.translate(s.i, s.j); c.rotate(clock.t / 90); c.fillStyle = '#8a7650'; c.beginPath(); [[-8, -3], [-3, -8], [5, -7], [9, -1], [6, 7], [-2, 8], [-8, 4]].forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
      c.fillStyle = '#c8b080'; c.beginPath(); c.moveTo(-5, -3); c.lineTo(-2, -6); c.lineTo(3, -5); c.lineTo(0, -1); c.closePath(); c.fill(); c.restore(); },
    moon: p => { const s = trail(p, 110, s => ({ x: s.i + rnd(-6, 6), y: s.j + rnd(-6, 6), vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .93, max: rnd(.4, .7), r: rnd(2.5, 4.5), grow: .2, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#ffb0e0', rot: rnd(0, T), vr: rnd(-5, 5), a: 1, add: true }));
      glowBall(s.i, s.j, 20, [[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,214,240,.9)'], [.7, 'rgba(255,140,210,.45)'], [1, 'rgba(220,80,180,0)']]);
      const c = C(); c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(s.i + 4, s.j - 3, 7, 0, T); c.fill(); c.restore(); },
    gleam: p => { const s = trail(p, 140, s => ({ x: s.i + rnd(-8, 8), y: s.j + rnd(-8, 8), vx: rnd(-30, 30), vy: rnd(-30, 30), drag: .92, max: rnd(.3, .5), r: rnd(2, 4), grow: .2, kind: 'shard', col: ['#ffffff', '#ffd0f0', '#fff0a0'][Math.random() * 3 | 0], rot: rnd(0, T), vr: rnd(-6, 6), a: 1, add: true }));
      glowBall(s.i, s.j, 22, [[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,230,250,.9)'], [1, 'rgba(255,150,220,0)']]);
      const c = C(); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const a = clock.t / 300 + k * T / 6, l = k % 2 ? 26 : 16; c.strokeStyle = 'rgba(255,240,255,.8)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(s.i, s.j); c.lineTo(s.i + Math.cos(a) * l, s.j + Math.sin(a) * l); c.stroke(); } c.restore(); },
    star: p => { const s = trail(p, 90, s => ({ x: s.i, y: s.j, vx: rnd(-25, 25), vy: rnd(-25, 25), drag: .93, max: rnd(.3, .5), r: rnd(2, 3.5), grow: .2, kind: 'shard', col: '#fff4a0', rot: rnd(0, T), vr: 6, a: 1, add: true }));
      const c = C(); c.save(); c.translate(s.i, s.j); c.rotate(clock.t / 70); c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 3.4 : 8.5, a = -Math.PI / 2 + k * Math.PI / 5; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
      c.fillStyle = '#ffe24a'; c.fill(); c.strokeStyle = '#fff8d0'; c.lineWidth = 1; c.stroke(); c.restore(); glowBall(s.i, s.j, 13, [[0, 'rgba(255,250,200,.6)'], [1, 'rgba(255,200,40,0)']]); },
    pin: p => { const s = trail(p, 90, s => ({ x: s.i - s.ca * 8, y: s.j - s.sa * 8, vx: -s.ca * rnd(10, 40), vy: -s.sa * rnd(10, 40), drag: .94, max: rnd(.2, .4), r: rnd(2, 4), grow: .5, img: hueTex(80, 90, 62), a: .9, add: true }));
      const c = C(); c.save(); c.lineCap = 'round'; c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(s.i - s.ca * 12, s.j - s.sa * 12); c.lineTo(s.i + s.ca * 5, s.j + s.sa * 5); c.stroke(); c.strokeStyle = '#b8e04a'; c.lineWidth = 1; c.stroke(); c.restore(); }
  };

  /* ---------- impact bursts (added on top of the existing hit effects) ---------- */
  const HIT = {
    fire: (S, n = 40) => { const h = hitAt(S); burst(h.i, h.j, n, (k, a) => ({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(40, 160), vy: Math.sin(a) * rnd(40, 160) - 30, drag: .93, ay: -60, max: rnd(.4, .8), r: rnd(5, 11), grow: .7, img: fireTex(rnd(12, 42) | 0), a: 1, add: true })); },
    water: (S, n = 30) => { const h = hitAt(S); burst(h.i, h.j, n, (k, a) => ({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(40, 140), vy: Math.sin(a) * rnd(40, 140) - 60, drag: .98, ay: 320, max: rnd(.5, .9), r: rnd(1.4, 2.6), grow: 0, kind: 'drop', col: '#cfeeff', a: 1, add: true })); },
    spark: (S, col, n = 30) => { const h = hitAt(S); burst(h.i, h.j, n, (k, a) => ({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(60, 220), vy: Math.sin(a) * rnd(60, 220), drag: .9, max: rnd(.25, .5), r: rnd(2.5, 5), grow: .3, img: colTex(col, 1), a: 1, add: true })); },
    shards: (S, cols, n = 18) => { const h = hitAt(S); burst(h.i, h.j, n, (k, a) => ({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(50, 170), vy: Math.sin(a) * rnd(50, 170), drag: .92, ay: 60, max: rnd(.4, .8), r: rnd(3, 6), grow: .1, kind: 'shard', col: cols[k % cols.length], rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: true })); },
    goo: (S, col, n = 22) => { const h = hitAt(S); burst(h.i, h.j, n, (k, a) => ({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(40, 130), vy: Math.sin(a) * rnd(40, 130) - 50, drag: .97, ay: 300, max: rnd(.5, .9), r: rnd(2, 4), grow: 0, kind: 'drop', col, a: 1, add: false })); },
    smoke: (S, n = 12) => { const h = hitAt(S); burst(h.i, h.j, n, (k, a) => ({ x: h.i + Math.cos(a) * 6, y: h.j + Math.sin(a) * 6, vx: Math.cos(a) * rnd(15, 50), vy: Math.sin(a) * rnd(15, 50) - 20, drag: .97, max: rnd(.6, 1.1), r: rnd(6, 10), grow: 1.2, img: smokeTex(), a: .6, add: false })); },
    ring: (S, col, n = 2) => { const h = hitAt(S); for (let k = 0; k < n; k++) spawn({ x: h.i, y: h.j, vx: 0, vy: 0, drag: 1, max: .35 + k * .12, r: 6, grow: 6 + k * 2, kind: 'ring', col, lw: 2, a: 1, add: true }); }
  };

  /* ---------- lightning (ground-target moves): crackle around the zone, then the strike ---------- */
  function arc(x0, y0, x1, y1, w, col, jag, branches) {
    const c = C(), pts = [[x0, y0]], n = 12; for (let k = 1; k < n; k++) { const f = k / n; pts.push([x0 + (x1 - x0) * f + rnd(-jag, jag), y0 + (y1 - y0) * f + rnd(-jag, jag) * .6]); } pts.push([x1, y1]);
    const stroke = (lw, cc, a) => { c.strokeStyle = cc; c.globalAlpha = a; c.lineWidth = lw; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter'; stroke(w * 4, col, .25); stroke(w * 2, col, .6); stroke(w * .8, '#ffffff', 1);
    if (branches) for (let k = 3; k < n - 1; k += 3) { const [px, py] = pts[k], d = Math.random() < .5 ? 1 : -1; c.lineWidth = w * .6; c.strokeStyle = col; c.globalAlpha = .8; c.beginPath(); c.moveTo(px, py); c.lineTo(px + d * rnd(10, 22), py + rnd(6, 18)); c.lineTo(px + d * rnd(16, 30), py + rnd(14, 28)); c.stroke(); }
    c.restore(); c.globalAlpha = 1;
  }
  function crackle(mk, q, big) {
    const x = bx(mk.x), y = by(mk.y), r = mk.r / 2;
    glowBall(x, y, r * (1 + q * .3), [[0, `rgba(255,250,200,${.15 + q * .25})`], [1, 'rgba(255,220,60,0)']]);
    if (Math.random() < .5 + q * .4) { const a = rnd(0, T), b = a + rnd(.8, 2.2); arc(x + Math.cos(a) * r, y + Math.sin(a) * r * .6, x + Math.cos(b) * r * .7, y + Math.sin(b) * r * .45, .9 * big, '#ffe84a', 5, false); }
    if (Math.random() < .5 * QMUL()) spawn({ x: x + rnd(-r, r), y: y + rnd(-r, r) * .6, vx: rnd(-40, 40), vy: -rnd(20, 80), drag: .92, max: rnd(.2, .4), r: rnd(1.5, 3), grow: .2, img: colTex('#fff080', 1), a: 1, add: true });
  }
  function strike(mk, f, big, fromAttacker) {
    const x = bx(mk.x), y = by(mk.y), top = y - 260;
    if (fromAttacker) { const a = side(mk.owner); arc(bx(a.x), by(a.y - 30), x, y - 10, 1.4 * big, '#ffe84a', 12, true); }
    else arc(x + rnd(-14, 14), top, x, y, 1.8 * big, '#ffe84a', 16, true);
    glowBall(x, y, 30 * big * (1 - f * .5), [[0, 'rgba(255,255,255,.9)'], [.4, 'rgba(255,240,140,.5)'], [1, 'rgba(255,200,40,0)']]);
    if (!mk._sparked) { mk._sparked = true; burst(x, y, 40 * big, (k, a) => ({ x, y, vx: Math.cos(a) * rnd(60, 260), vy: Math.sin(a) * rnd(60, 260) - 40, drag: .9, ay: 200, max: rnd(.3, .6), r: rnd(2, 4), grow: .2, img: colTex(k % 3 ? '#fff080' : '#ffffff', 1), a: 1, add: true })); }
  }

  /* ---------- register ---------- */
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.shot) o.shot = p => { const c = bctx, i = bx(p.x), j = by(p.y), K = 1.45; c.save(); c.translate(i, j); c.scale(K, K); c.translate(-i, -j); try { r.shot(p); } finally { c.restore(); } };   // bigger bodies, same centre if (r.markDraw) o.markDraw = r.markDraw;
    if (r.impact) { const prev = old.impact; o.impact = (S, mv, crit, eff) => { if (prev) try { prev(S, mv, crit, eff); } catch (e) { console.error(e); } try { r.impact(S, mv, crit, eff); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  reg('Ember', { shot: SH.ember, impact: S => HIT.fire(S, 26) });
  reg('Fire Blast', { shot: SH.fireBlast, impact: S => { HIT.fire(S, 70); HIT.smoke(S, 14); HIT.ring(S, '#ffb040', 3); } });
  reg('Water Gun', { shot: SH.water, impact: S => { HIT.water(S, 28); HIT.ring(S, '#bfe8ff'); } });
  reg('Bubble Beam', { shot: SH.bubbles, impact: S => { HIT.water(S, 22); HIT.ring(S, '#bfe8ff', 3); } });
  reg('Seed Bomb', { shot: SH.seed, impact: S => { HIT.shards(S, ['#7fe05a', '#c8f58a', '#3fb04a']); HIT.smoke(S, 6); } });
  reg('Energy Ball', { shot: SH.energy, impact: S => { HIT.spark(S, '#a8f070', 36); HIT.ring(S, '#c8ff90', 2); } });
  reg('Ice Shard', { shot: SH.iceShard, impact: S => HIT.shards(S, ['#ffffff', '#aef0ff', '#5ccfee'], 24) });
  reg('Aura Sphere', { shot: SH.aura, impact: S => { HIT.spark(S, '#80c0ff', 40); HIT.ring(S, '#c8e8ff', 3); } });
  reg('Poison Sting', { shot: SH.sting, impact: S => HIT.goo(S, '#a050e0', 14) });
  reg('Sludge Bomb', { shot: p => SH.sludge(p, false), impact: S => { HIT.goo(S, '#8c3fc0', 26); HIT.smoke(S, 6); } });
  reg('Gunk Shot', { shot: p => SH.sludge(p, true), impact: S => { HIT.goo(S, '#5a2a7a', 36); HIT.smoke(S, 10); } });
  reg('Mud Shot', { shot: SH.mud, impact: S => HIT.goo(S, '#7a5a34', 28) });
  reg('Shadow Ball', { shot: SH.shadow, impact: S => { HIT.smoke(S, 16); HIT.spark(S, '#a070ff', 26); HIT.ring(S, '#7a4adf', 2); } });
  reg('Rock Throw', { shot: SH.rock, impact: S => { HIT.shards(S, ['#a8946a', '#c8b48a', '#6a5840'], 18); HIT.smoke(S, 8); } });
  reg('Moonblast', { shot: SH.moon, impact: S => { HIT.shards(S, ['#ffffff', '#ffb0e0', '#ffe8f6'], 26); HIT.ring(S, '#ffb0e0', 3); } });
  reg('Dazzling Gleam', { shot: SH.gleam, impact: S => { HIT.shards(S, ['#ffffff', '#ffd0f0', '#fff0a0'], 30); HIT.ring(S, '#ffffff', 3); } });
  reg('Swift', { shot: SH.star, impact: S => HIT.shards(S, ['#ffe24a', '#fff8d0'], 12) });
  reg('Pin Missile', { shot: SH.pin, impact: S => HIT.spark(S, '#c8f04a', 14) });
  reg('Thunder Shock', { markDraw: (mk, q) => { if (q < .82) crackle(mk, q, .8); else strike(mk, (q - .82) / .18, .8, true); }, impact: S => HIT.spark(S, '#fff080', 22) });
  reg('Thunderbolt', { markDraw: (mk, q) => { if (q < .8) crackle(mk, q, 1.1); else { strike(mk, (q - .8) / .2, 1.2, true); strike(mk, (q - .8) / .2, 1.1, false); } }, impact: S => { HIT.spark(S, '#fff080', 36); HIT.ring(S, '#fff4a0', 2); } });
  // Thunder keeps its big sky-darkening animation; it gets the spark shower on top
  reg('Thunder', { impact: S => { HIT.spark(S, '#fff080', 50); HIT.ring(S, '#ffffff', 3); } });
  window.PFX2 = { SH, HIT };
})();
