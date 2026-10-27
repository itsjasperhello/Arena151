/* =====================================================================
   Section 23: particle engine + rebuilt beam moves (milestone 1)
   Modeled on the additive particle reference: hundreds of soft radial
   puffs blended with 'lighter', so where they overlap the colour stacks
   toward a white-hot core. Each puff has a cone of spread, drag, a little
   buoyancy, a hue range, and grows as it fades. Glow textures are drawn
   once and stamped (fast enough for phones); particles live in a shared
   pool, so flames and smoke keep drifting after a beam ends.
   Milestone 1 moves: Flamethrower, Hyper Beam, Hydro Pump, Scald,
   Ice Beam, Aurora Beam, Psybeam, Signal Beam, Dragon Breath,
   Dragon Pulse, Flash Cannon.
   ===================================================================== */
(function fxParticles() {
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), lp = (a, b, t) => a + (b - a) * t;
  const QMUL = () => ({ high: 1, medium: .6, med: .6, low: .35 }[(typeof SETTINGS !== 'undefined' && SETTINGS.quality) || 'high'] || 1);
  const CAP = () => Math.round(1600 * QMUL());

  /* ---------- glow textures (drawn once, stamped many times) ---------- */
  const TEX = new Map(), TS = 64;
  function tex(key, stops) {                     // stops: [[pos, 'rgba(...)'], ...]
    let c = TEX.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = TS; const x = c.getContext('2d'), g = x.createRadialGradient(TS / 2, TS / 2, 0, TS / 2, TS / 2, TS / 2);
    for (const [p, col] of stops) g.addColorStop(p, col); x.fillStyle = g; x.fillRect(0, 0, TS, TS); TEX.set(key, c); return c;
  }
  // the reference's fire puff: hsla(h,100%,65%,.8) → hsla(h-10,100%,45%,.4) → transparent
  const fireTex = h => tex('fire' + h, [[0, `hsla(${h},100%,65%,.8)`], [.4, `hsla(${h - 10},100%,45%,.4)`], [1, `hsla(${h - 20},100%,25%,0)`]]);
  const hueTex = (h, s = 100, l = 62) => tex(`h${h}|${s}|${l}`, [[0, `hsla(${h},${s}%,${l}%,.85)`], [.4, `hsla(${h},${s}%,${l - 15}%,.4)`], [1, `hsla(${h},${s}%,${l - 30}%,0)`]]);
  const colTex = (hex, a = .85) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    return tex(`c${hex}|${a}`, [[0, `rgba(${r},${g},${b},${a})`], [.4, `rgba(${r},${g},${b},${a * .45})`], [1, `rgba(${r},${g},${b},0)`]]); };
  const smokeTex = () => tex('smoke', [[0, 'rgba(60,56,66,.55)'], [.5, 'rgba(50,46,56,.28)'], [1, 'rgba(40,38,46,0)']]);
  const steamTex = () => tex('steam', [[0, 'rgba(255,255,255,.5)'], [.5, 'rgba(240,248,255,.22)'], [1, 'rgba(230,240,255,0)']]);
  const whiteTex = () => tex('white', [[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]);

  /* ---------- the shared particle pool ---------- */
  const POOL = [];
  // p: x y vx vy (art px, px/s), drag (fraction kept per 1/60 s), ay (px/s²), life max (s), r grow, img, a (peak alpha),
  //    add (additive), kind ('glow' | 'shard' | 'ring' | 'drop'), col (shard/ring/drop colour), rot vr
  function spawn(p) { if (POOL.length >= CAP()) POOL.shift(); p.life = 0; POOL.push(p); return p; }
  let lastT = null;
  function drawPool() {
    const c = bctx; if (!c) return;
    const now = clock.t, dt = lastT == null ? 0 : Math.max(0, Math.min(.05, (now - lastT) / 1000)); lastT = now;
    if (!POOL.length) return;
    c.save();
    for (let i = POOL.length - 1; i >= 0; i--) {
      const p = POOL[i]; p.life += dt; if (p.life >= p.max) { POOL.splice(i, 1); continue; }
      const k = Math.pow(p.drag, dt * 60); p.vx *= k; p.vy *= k; p.vy += (p.ay || 0) * dt; p.vx += (p.ax || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt;
      if (p.floor != null && p.y > p.floor && p.vy > 0) { p.y = p.floor; p.vy *= -.32; p.vx *= .6; p.vr = (p.vr || 0) * .5; if (Math.abs(p.vy) < 25) { p.vy = 0; p.ay = 0; p.vx *= .5; } }
    }
    // passes: under (scene dimming), normal (smoke, water bodies, chunks), additive glow, over (screen flashes, speed lines)
    for (const [layer, add] of [[-1, null], [0, false], [0, true], [1, null]]) {
      for (const p of POOL) {
        if ((p.layer || 0) !== layer) continue;
        if (add !== null && !!p.add !== add) continue;
        c.globalCompositeOperation = (add === null ? !!p.add : add) ? 'lighter' : 'source-over';
        const q = p.life / p.max, op = Math.max(0, 1 - Math.pow(q, 1.5)) * p.a; if (op <= .003) continue;
        const r = p.r * (.8 + q * (p.grow != null ? p.grow : .6));
        if (p.kind === 'shard') { c.globalAlpha = op; c.fillStyle = p.col; c.save(); c.translate(p.x, p.y); c.rotate(p.rot || 0); c.beginPath(); c.moveTo(0, -r); c.lineTo(r * .35, 0); c.lineTo(0, r); c.lineTo(-r * .35, 0); c.closePath(); c.fill(); c.restore(); }
        else if (p.kind === 'ring') { c.globalAlpha = op; c.strokeStyle = p.col; c.lineWidth = Math.max(.6, p.lw || 1.4); c.beginPath(); c.ellipse(p.x, p.y, r, r * (p.squash || 1), p.rot || 0, 0, T); c.stroke(); }
        else if (p.kind === 'streak') { const sp = Math.hypot(p.vx, p.vy) || 1, l = (p.len || 14) * (1 - q * .5); c.globalAlpha = op; c.strokeStyle = p.col; c.lineCap = 'round'; c.lineWidth = Math.max(.6, p.lw || 1.5); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx / sp * l, p.y - p.vy / sp * l); c.stroke(); }
        else if (p.kind === 'chunk') { c.globalAlpha = op; c.save(); c.translate(p.x, p.y); c.rotate(p.rot || 0); const pts = p.pts; c.fillStyle = p.col; c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(x * r, y * r) : c.moveTo(x * r, y * r)); c.closePath(); c.fill();
          if (p.hi) { c.fillStyle = p.hi; c.beginPath(); c.moveTo(pts[0][0] * r, pts[0][1] * r); c.lineTo(pts[1][0] * r, pts[1][1] * r); c.lineTo(0, 0); c.closePath(); c.fill(); } c.restore(); }
        else if (p.kind === 'fn') { c.save(); c.globalAlpha = 1; try { p.draw(c, q, p, op); } catch (e) { console.error(e); } c.restore(); }
        else if (p.kind === 'drop') { c.globalAlpha = op; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, Math.max(.5, r), 0, T); c.fill(); }
        else { c.globalAlpha = op; c.drawImage(p.img, p.x - r, p.y - r, r * 2, r * 2); }
      }
    }
    c.restore(); c.globalAlpha = 1;
  }
  // draw with the rest of the world effects (above the Pokémon, full resolution)
  const _dwf = drawWorldFx;
  drawWorldFx = function () { const r = _dwf.apply(this, arguments); try { drawPool(); } catch (e) { console.error(e); } return r; };

  /* ---------- beam geometry ---------- */
  // muzzle and aim in art pixels; the beam reaches a little past the target
  function geo(b) {
    const i = bx(b.x), j = by(b.y), tS = side(b.owner === 'A' ? 'B' : 'A'), ti = bx(tS.x), tj = by(tS.y - 30);
    const ang = b.ang, ca = Math.cos(ang), sa = Math.sin(ang), len = Math.max(90, Math.hypot(ti - i, tj - j) + 26);
    return { i, j, ang, ca, sa, nx: -sa, ny: ca, len, q: b.t / b.life };
  }
  // particles to emit this frame, from the beam's own clock (so the rate is the same at any frame rate)
  function due(b, perSec) { const now = clock.t, dt = b._lt == null ? 16 : Math.max(0, Math.min(50, now - b._lt)); b._lt = now; b._acc = (b._acc || 0) + perSec * QMUL() * dt / 1000; const n = Math.floor(b._acc); b._acc -= n; return n; }
  const fadeOf = q => q > .78 ? Math.max(0, (1 - q) / .22) : 1;
  function hub(i, j, r, inner, outer, a) { const c = bctx, g = c.createRadialGradient(i, j, r * .1, i, j, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.5, outer.replace('A', a * .85)); g.addColorStop(1, outer.replace('A', 0)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, T); c.fill(); c.restore(); }
  function coreLine(g, w, layers, fade) {   // layers: [[widthMul, 'rgba(...A)', alpha], ...] additive strokes along the beam
    const c = bctx; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [m, col, a] of layers) { c.strokeStyle = col.replace('A', a * fade); c.lineWidth = Math.max(.6, w * m); c.beginPath(); c.moveTo(g.i, g.j); c.lineTo(g.i + g.ca * g.len, g.j + g.sa * g.len); c.stroke(); }
    c.restore();
  }

  /* ---------- the beams ---------- */
  const NB = {};
  // Flamethrower: the reference fire stream
  NB.flame = (b, opts = {}) => {
    const g = geo(b), fade = fadeOf(g.q), emitting = g.q < .82, hueLo = opts.hue != null ? opts.hue : 12, hueSpan = opts.span || 28, spread = opts.spread || .55, sc = Math.min(1.35, Math.max(.75, g.len / 300)) * (opts.size || 1);
    const tf = opts.tex || fireTex;
    hub(g.i, g.j, 11 * sc, '#ffffff', opts.hubCol || 'rgba(255,140,0,A)', .95 * fade);
    if (emitting) {
      for (let n = due(b, (opts.rate || 520)); n > 0; n--) {
        const a = g.ang + (Math.random() - .5) * spread, v = g.len * 5 * (.75 + Math.random() * .5);   // rushes out, then drag settles it at the target
        spawn({ x: g.i + rnd(-2, 2), y: g.j + rnd(-2, 2), vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .92, ay: -40 * sc, max: rnd(.55, .9) * (opts.lifeMul || 1), r: rnd(8, 18) * sc,
          grow: .6, img: tf(Math.round(hueLo + Math.random() * hueSpan)), a: 1, add: true });
      }
      if (Math.random() < .6 * QMUL()) { const a = g.ang + (Math.random() - .5) * spread * 1.2, v = g.len * rnd(1.3, 2.1);    // embers
        spawn({ x: g.i, y: g.j, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .97, ay: -70, max: rnd(.6, 1.1), r: rnd(1.4, 2.6), grow: -.4, img: opts.ember ? opts.ember() : fireTex(45), a: 1, add: true }); }
      if (!opts.noSmoke && Math.random() < .5 * QMUL()) { const d = g.len * rnd(.65, 1);                                        // smoke curling up at the far end
        spawn({ x: g.i + g.ca * d + g.nx * rnd(-10, 10), y: g.j + g.sa * d + g.ny * rnd(-8, 8), vx: g.ca * 20 + rnd(-10, 10), vy: -rnd(25, 50), drag: .99, ay: -10, max: rnd(.9, 1.5), r: rnd(7, 12) * sc, grow: 1.2, img: smokeTex(), a: .55, add: false }); }
    }
  };
  // Hyper Beam: a thick white-gold core, a glowing sheath, rings racing along it, a muzzle flare
  NB.hyper = b => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .12), w = 12 * grow, L = g.len; const gg = { ...g, len: L * grow };
    coreLine(gg, w, [[3.2, 'rgba(255,170,40,A)', .22], [2, 'rgba(255,214,90,A)', .45], [1.15, 'rgba(255,246,200,A)', .85], [.5, 'rgba(255,255,255,A)', 1]], fade);
    const c = bctx; c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 8; k++) { const a = clock.t / 260 + k * T / 8, l = (k % 2 ? 26 : 16) * fade * (1 + .2 * Math.sin(clock.t / 60 + k)); c.strokeStyle = `rgba(255,236,150,${.7 * fade})`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(g.i, g.j); c.lineTo(g.i + Math.cos(a) * l, g.j + Math.sin(a) * l); c.stroke(); }
    c.restore(); hub(g.i, g.j, 18, '#fff', 'rgba(255,190,60,A)', fade);
    if (g.q < .85) {
      for (let n = due(b, 460); n > 0; n--) { const d = Math.random() * gg.len, off = rnd(-1, 1) * w * .9;
        spawn({ x: g.i + g.ca * d + g.nx * off, y: g.j + g.sa * d + g.ny * off, vx: g.ca * rnd(80, 220) + g.nx * off * 3, vy: g.sa * rnd(80, 220) + g.ny * off * 3, drag: .95, max: rnd(.25, .5), r: rnd(3, 7), grow: .8, img: hueTex(rnd(38, 52) | 0, 100, 70), a: .9, add: true }); }
      if ((b._ring = (b._ring || 0) + 1) % 4 === 0) spawn({ x: g.i + g.ca * 8, y: g.j + g.sa * 8, vx: g.ca * L * 3, vy: g.sa * L * 3, drag: .99, max: .32, r: w * 1.1, grow: .5, kind: 'ring', col: '#fff4c0', lw: 2, rot: g.ang, squash: 2.4, a: .9, add: true });
    }
  };
  // Hydro Pump / Scald: a dense twisting jet
  NB.jet = (b, hot) => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .1), t = clock.t / 55;
    hub(g.i, g.j, 12, '#fff', hot ? 'rgba(255,170,90,A)' : 'rgba(120,200,255,A)', fade);
    if (g.q < .84) {
      for (let n = due(b, 620); n > 0; n--) {
        const tw = Math.sin(t + Math.random() * 2) * .09, a = g.ang + tw + (Math.random() - .5) * .14, v = g.len * rnd(2.4, 3.2), body = Math.random() < .6;
        spawn({ x: g.i + g.nx * rnd(-3, 3), y: g.j + g.ny * rnd(-3, 3), vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .975, ay: 30, max: rnd(.32, .48) * grow, r: rnd(6.5, 12), grow: .9,
          img: body ? colTex(hot ? '#3aa0f0' : '#2f8fe8', .85) : colTex(hot ? '#ffd0a0' : '#dff6ff', .9), a: body ? .9 : 1, add: !body });
      }
      if (Math.random() < .7 * QMUL()) { const d = g.len * rnd(.2, 1); spawn({ x: g.i + g.ca * d + g.nx * rnd(-9, 9), y: g.j + g.sa * d + g.ny * rnd(-9, 9), vx: rnd(-20, 20), vy: hot ? -rnd(30, 60) : rnd(-15, 10), drag: .98, ay: hot ? -20 : 0, max: rnd(.6, 1.1), r: rnd(6, 11), grow: 1.4, img: steamTex(), a: hot ? .7 : .45, add: false }); }
      if (Math.random() < .9 * QMUL()) { const e = { x: g.i + g.ca * g.len * .95, y: g.j + g.sa * g.len * .95 };                 // the splash: droplets arc out and fall
        for (let k = 0; k < 2; k++) { const a = g.ang + Math.PI + rnd(-1.3, 1.3); spawn({ x: e.x, y: e.y, vx: Math.cos(a) * rnd(40, 120), vy: -rnd(60, 140), drag: .99, ay: 380, max: rnd(.45, .8), r: rnd(1.2, 2.2), grow: 0, kind: 'drop', col: hot ? '#ffe2c8' : '#cfeeff', a: 1, add: true }); } }
    }
  };
  // Ice Beam: a cyan core, frost mist, crystals that hang in the air along the path
  NB.ice = b => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .14); const gg = { ...g, len: g.len * grow };
    coreLine(gg, 6, [[3, 'rgba(90,200,255,A)', .25], [1.6, 'rgba(170,240,255,A)', .55], [.6, 'rgba(255,255,255,A)', 1]], fade);
    hub(g.i, g.j, 12, '#fff', 'rgba(140,225,255,A)', fade);
    if (g.q < .84) {
      for (let n = due(b, 300); n > 0; n--) { const d = Math.random() * gg.len, off = rnd(-6, 6);
        spawn({ x: g.i + g.ca * d + g.nx * off, y: g.j + g.sa * d + g.ny * off, vx: g.ca * rnd(30, 90), vy: g.sa * rnd(30, 90) + rnd(-10, 10), drag: .94, max: rnd(.3, .6), r: rnd(3, 6), grow: .8, img: colTex('#9fe8ff', .8), a: .9, add: true }); }
      if (Math.random() < .55 * QMUL()) { const d = Math.random() * gg.len;    // crystals
        spawn({ x: g.i + g.ca * d + g.nx * rnd(-8, 8), y: g.j + g.sa * d + g.ny * rnd(-8, 8), vx: rnd(-6, 6), vy: rnd(-6, 6), drag: .9, max: rnd(.9, 1.4), r: rnd(3, 6), grow: .15, kind: 'shard', col: Math.random() < .5 ? '#e8fbff' : '#9fe0ff', rot: rnd(0, T), vr: rnd(-4, 4), a: 1, add: true }); }
      if (Math.random() < .4 * QMUL()) { const d = g.len * rnd(.3, 1); spawn({ x: g.i + g.ca * d, y: g.j + g.sa * d + rnd(-6, 6), vx: rnd(-10, 10), vy: rnd(5, 18), drag: .99, max: rnd(.8, 1.3), r: rnd(7, 12), grow: 1.3, img: steamTex(), a: .5, add: false }); }
    }
  };
  // Aurora Beam: rainbow ribbons weaving around each other
  NB.aurora = b => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .15);
    hub(g.i, g.j, 12, '#fff', 'rgba(170,255,230,A)', fade);
    if (g.q < .84) for (let n = due(b, 520); n > 0; n--) {
      const rib = n % 3, f = Math.random() * grow, d = f * g.len, ph = clock.t / 140 + rib * T / 3, off = Math.sin(d / 22 - ph * 2) * 10;
      spawn({ x: g.i + g.ca * d + g.nx * off, y: g.j + g.sa * d + g.ny * off, vx: g.ca * 60, vy: g.sa * 60, drag: .95, max: rnd(.28, .5), r: rnd(3.5, 6), grow: .7, img: hueTex(((clock.t / 6 + d * 1.4 + rib * 120) % 360) | 0, 95, 66), a: .95, add: true });
    }
  };
  // Psybeam: a pink-purple wave with rings pulsing along it
  NB.psy = b => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .15);
    hub(g.i, g.j, 12, '#fff', 'rgba(255,140,220,A)', fade);
    if (g.q < .84) {
      for (let n = due(b, 420); n > 0; n--) { const d = Math.random() * grow * g.len, off = Math.sin(d / 16 - clock.t / 60) * 8;
        spawn({ x: g.i + g.ca * d + g.nx * off, y: g.j + g.sa * d + g.ny * off, vx: g.ca * 50, vy: g.sa * 50, drag: .95, max: rnd(.25, .45), r: rnd(3, 6), grow: .7, img: hueTex((rnd(285, 330)) | 0, 90, 66), a: .9, add: true }); }
      if ((b._ring = (b._ring || 0) + 1) % 3 === 0) spawn({ x: g.i + g.ca * 6, y: g.j + g.sa * 6, vx: g.ca * g.len * 2.6, vy: g.sa * g.len * 2.6, drag: .99, max: .42, r: 6, grow: 1.6, kind: 'ring', col: ['#ff9ae0', '#c8a0ff', '#ffe0f6'][b._ring % 3], lw: 1.8, rot: g.ang, squash: 2.2, a: .95, add: true });
    }
  };
  // Signal Beam: flashing multicoloured pulses
  NB.signal = b => {
    const g = geo(b), fade = fadeOf(g.q);
    hub(g.i, g.j, 10, '#fff', 'rgba(200,255,120,A)', fade);
    if (g.q < .84 && (b._p = (b._p || 0) + 1) % 2 === 0) { const col = ['#ff5a5a', '#5aff7a', '#ffe84a', '#5ab4ff'][(b._p / 2) % 4];
      for (let k = 0; k < 3; k++) spawn({ x: g.i, y: g.j, vx: g.ca * g.len * 2.4 * (1 - k * .06), vy: g.sa * g.len * 2.4 * (1 - k * .06), drag: .995, max: .45, r: 7 - k * 1.6, grow: .1, img: colTex(col, 1), a: 1, add: true }); }
  };
  // Dragon Pulse: a spiralling helix vortex
  NB.vortex = b => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .15);
    hub(g.i, g.j, 13, '#fff', 'rgba(140,120,255,A)', fade);
    if (g.q < .84) for (let n = due(b, 480); n > 0; n--) { const f = Math.random() * grow, d = f * g.len, s = n % 2 ? 1 : -1, off = Math.sin(d / 14 - clock.t / 45) * 11 * s;
      spawn({ x: g.i + g.ca * d + g.nx * off, y: g.j + g.sa * d + g.ny * off, vx: g.ca * 80, vy: g.sa * 80, drag: .95, max: rnd(.25, .45), r: rnd(3, 6.5), grow: .7, img: hueTex(s > 0 ? 250 : 200, 90, 64), a: .95, add: true }); }
  };
  // Flash Cannon: a chrome-white beam, lens flare, metallic glints
  NB.chrome = b => {
    const g = geo(b), fade = fadeOf(g.q), grow = Math.min(1, g.q / .12); const gg = { ...g, len: g.len * grow };
    coreLine(gg, 9, [[3, 'rgba(160,190,220,A)', .25], [1.7, 'rgba(220,235,250,A)', .55], [.7, 'rgba(255,255,255,A)', 1]], fade);
    const c = bctx; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,255,255,${.8 * fade})`; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(g.i - 34, g.j); c.lineTo(g.i + 34, g.j); c.moveTo(g.i, g.j - 18); c.lineTo(g.i, g.j + 18); c.stroke(); c.restore(); hub(g.i, g.j, 16, '#fff', 'rgba(200,220,255,A)', fade);
    if (g.q < .84) for (let n = due(b, 260); n > 0; n--) { const d = Math.random() * gg.len;
      spawn({ x: g.i + g.ca * d + g.nx * rnd(-10, 10), y: g.j + g.sa * d + g.ny * rnd(-10, 10), vx: rnd(-15, 15) + g.ca * 40, vy: rnd(-15, 15) + g.sa * 40, drag: .93, max: rnd(.3, .6), r: rnd(2.5, 4.5), grow: .2, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#c6d2de', rot: rnd(0, T), vr: rnd(-6, 6), a: 1, add: true }); }
  };

  /* ---------- register the rebuilt beams (impacts and charges stay as they were) ---------- */
  const reg = (name, beam) => { MFX[name] = Object.assign({}, MFX[name] || {}, { beam }); };
  reg('Flamethrower', b => NB.flame(b));
  reg('Dragon Breath', b => NB.flame(b, { tex: h => hueTex(h, 90, 62), hue: 230, span: 60, hubCol: 'rgba(150,120,255,A)', spread: .7, noSmoke: true, ember: () => hueTex(190, 100, 70), rate: 460 }));
  reg('Hyper Beam', NB.hyper);
  reg('Hydro Pump', b => NB.jet(b, false));
  reg('Scald', b => NB.jet(b, true));
  reg('Ice Beam', NB.ice);
  reg('Aurora Beam', NB.aurora);
  reg('Psybeam', NB.psy);
  reg('Signal Beam', NB.signal);
  reg('Dragon Pulse', NB.vortex);
  reg('Flash Cannon', NB.chrome);
  window.PFX = { spawn, POOL, NB, tex, fireTex, hueTex, colTex, smokeTex, steamTex, whiteTex, geo, due, hub, coreLine, QMUL };
})();
