/* =====================================================================
   Section 23b: the effects toolkit
   Building blocks the move effects are composed from, so each move can be
   a multi-phase set piece (build-up, climax, aftermath) rather than a burst:
   body measurement (effects scale with the Pokémon), scene dimming, flashes,
   shake, ground scars, speed lines, shockwaves, comic impact stars, tapered
   ribbons, light pillars, energy orbs, tumbling debris, spark showers,
   afterimages, magic circles, and layered elemental explosions.
   All drawing is in art pixels on the full-resolution effects layer.
   ===================================================================== */
(function fxKit() {
  const P = window.PFX; if (!P) return;
  const { spawn, hueTex, colTex, fireTex, smokeTex, steamTex, QMUL } = P;
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), N = n => Math.max(1, Math.round(n * QMUL()));
  const ease = { out: q => 1 - Math.pow(1 - q, 3), in: q => q * q * q, inOut: q => q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2, back: q => 1 + 2.7 * Math.pow(q - 1, 3) + 1.7 * Math.pow(q - 1, 2) };
  const later = (ms, f) => (ms > 0 ? setTimeoutGame(ms, () => { try { f(); } catch (e) { console.error(e); } }) : (() => { try { f(); } catch (e) { console.error(e); } })());
  const fx = (o) => spawn(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, drag: 1, r: 1, kind: 'fn', a: 1 }, o));

  /* ---------- where things are ---------- */
  // a Pokémon's body in art pixels: centre, feet, height, width, facing, and a size factor (1 = a typical mid-size Pokémon)
  function body(S) {
    const sd = side(S); let h = 40;
    try { const L = actorLook(S); if (L && L.sp) { const a = L.sp.custom ? ensureAnim(L.sp.front) : null; h = a ? a.h * L.scale * .5 * .82 : (L.sp.size || 32) * L.scale; } } catch (e) { }
    h = Math.max(22, Math.min(90, h));
    return { i: bx(sd.x), j: by(sd.y) - h * .5, feet: by(sd.y), h, w: h * .8, face: sd.face || 1, k: Math.max(.75, Math.min(1.7, h / 40)), wx: sd.x, wy: sd.y };
  }
  const foe = S => other(S);

  /* ---------- the scene ---------- */
  // darken the arena (over the Pokémon and stage, under the effects) so the glow pops
  function dim(a = .35, ms = 900, col = '0,0,0') { fx({ layer: -1, max: ms / 1000, draw: (c, q) => { const k = q < .15 ? q / .15 : q > .7 ? (1 - q) / .3 : 1; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(${col},${a * k})`; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); } }); }
  const flash = (col = '#ffffff', a = .5) => { try { screenFlash(col, a); } catch (e) { } };
  const shake = (a = 4, ms = 160) => { try { VFX.shake(a, ms); } catch (e) { } };
  const scar = (kind, wx, wy) => { try { addScar(kind, wx, wy); } catch (e) { } };
  // anime speed lines converging on a point, over everything
  function speedLines(x, y, col = '#ffffff', ms = 380, n = 26) { const lines = Array.from({ length: N(n) }, () => ({ a: rnd(0, T), w: rnd(.8, 2.6), r0: rnd(70, 120), len: rnd(90, 200) }));
    fx({ layer: 1, add: true, max: ms / 1000, draw: (c, q) => { const k = q < .2 ? q / .2 : 1 - (q - .2) / .8; c.strokeStyle = col; c.lineCap = 'round';
      for (const l of lines) { const r0 = l.r0 * (1 - q * .4), r1 = r0 + l.len; c.globalAlpha = .55 * k; c.lineWidth = l.w; c.beginPath(); c.moveTo(x + Math.cos(l.a) * r0, y + Math.sin(l.a) * r0 * .7); c.lineTo(x + Math.cos(l.a) * r1, y + Math.sin(l.a) * r1 * .7); c.stroke(); } } }); }

  /* ---------- shapes ---------- */
  // a thick glowing shockwave ring
  function shock(x, y, o = {}) { const { r0 = 6, r1 = 60, ms = 420, col = '255,255,255', w = 6, squash = .62, glow = true, layer = 0 } = o;
    fx({ layer, add: true, max: ms / 1000, draw: (c, q) => { const e = ease.out(q), r = r0 + (r1 - r0) * e, lw = w * (1 - q * .8), a = 1 - q;
      c.save(); c.globalCompositeOperation = 'lighter';
      if (glow) { c.strokeStyle = `rgba(${col},${a * .25})`; c.lineWidth = lw * 3.2; c.beginPath(); c.ellipse(x, y, r, r * squash, 0, 0, T); c.stroke(); }
      c.strokeStyle = `rgba(${col},${a * .8})`; c.lineWidth = lw; c.beginPath(); c.ellipse(x, y, r, r * squash, 0, 0, T); c.stroke();
      c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = Math.max(.6, lw * .3); c.beginPath(); c.ellipse(x, y, r * .97, r * squash * .97, 0, 0, T); c.stroke(); c.restore(); } }); }
  // the jagged comic impact star of fighting games
  function star(x, y, o = {}) { const { size = 26, col = '#ffe24a', edge = '#ffffff', ms = 260, spikes = 12, rot = rnd(0, T) } = o; const jag = Array.from({ length: spikes * 2 }, (_, k) => k % 2 ? rnd(.38, .55) : rnd(.85, 1.15));
    fx({ add: false, max: ms / 1000, draw: (c, q) => { const s = size * (q < .25 ? ease.back(q / .25) : 1 + (q - .25) * .25), a = q > .55 ? 1 - (q - .55) / .45 : 1;
      const path = (m) => { c.beginPath(); jag.forEach((r, k) => { const an = rot + k * Math.PI / spikes; const px = x + Math.cos(an) * s * r * m, py = y + Math.sin(an) * s * r * m; k ? c.lineTo(px, py) : c.moveTo(px, py); }); c.closePath(); };
      c.globalAlpha = a; c.fillStyle = edge; path(1.12); c.fill(); c.fillStyle = col; path(1); c.fill(); c.fillStyle = 'rgba(255,255,255,.95)'; path(.5); c.fill(); } }); }
  // a tapered, gradient-filled ribbon that draws itself in along a path; path(t) -> [x, y] for t in 0..1
  function ribbon(path, o = {}) { const { w = 8, ms = 420, core = '#ffffff', edge = '#8fd0ff', glow = 'rgba(140,200,255,A)', grow = .35, head = .5, steps = 28, layer = 0 } = o;
    fx({ layer, add: true, max: ms / 1000, draw: (c, q) => { const g = Math.min(1, q / grow), fade = q > head ? Math.max(0, 1 - (q - head) / (1 - head)) : 1, n = Math.max(2, Math.round(steps * g));
      const pts = Array.from({ length: n + 1 }, (_, k) => path(k / steps)), L = [], R = [];
      for (let k = 0; k < pts.length; k++) { const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, t = k / steps, taper = Math.sin(Math.PI * Math.min(1, t / Math.max(.05, g))) * (1 - .3 * (1 - g)), ww = w * taper * .5;
        L.push([pts[k][0] - dy / l * ww, pts[k][1] + dx / l * ww]); R.push([pts[k][0] + dy / l * ww, pts[k][1] - dx / l * ww]); }
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = glow.replace('A', .35 * fade); c.lineWidth = w * 1.6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      c.globalAlpha = fade; c.fillStyle = edge; c.beginPath(); L.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let k = R.length - 1; k >= 0; k--) c.lineTo(R[k][0], R[k][1]); c.closePath(); c.fill();
      c.strokeStyle = core; c.lineWidth = Math.max(.8, w * .22); c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore(); } }); }
  const arcPath = (cx, cy, r, a0, a1, squash = 1) => t => { const a = a0 + (a1 - a0) * t; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * squash]; };
  const linePath = (x0, y0, x1, y1, bend = 0) => t => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, l = Math.hypot(x1 - x0, y1 - y0) || 1, cx = mx - (y1 - y0) / l * bend, cy = my + (x1 - x0) / l * bend, u = 1 - t; return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]; };
  // a vertical column of light
  function pillar(x, y, o = {}) { const { w = 30, h = 160, ms = 800, col = '255,240,180', layer = 0 } = o;
    fx({ layer, add: true, max: ms / 1000, draw: (c, q) => { const k = q < .2 ? ease.out(q / .2) : 1 - ease.in((q - .2) / .8), ww = w * (q < .2 ? .3 + .7 * k : 1 - (q - .2) * .5);
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(x - ww, 0, x + ww, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(.5, `rgba(${col},${.7 * k})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(x - ww, y - h, ww * 2, h); const g2 = c.createLinearGradient(x - ww * .3, 0, x + ww * .3, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, `rgba(255,255,255,${.8 * k})`); g2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g2; c.fillRect(x - ww * .3, y - h, ww * .6, h);
      c.fillStyle = `rgba(${col},${.5 * k})`; c.beginPath(); c.ellipse(x, y, ww * 1.4, ww * .45, 0, 0, T); c.fill(); c.restore(); } }); }
  // a sophisticated energy sphere: soft halo, bright core, rim light, swirling arcs
  function orb(c, x, y, r, o = {}) { const { core = '255,255,255', mid = '120,200,255', rim = '200,240,255', arcs = 3, t = clock.t, pulse = .08 } = o, rr = r * (1 + Math.sin(t / 70) * pulse);
    c.save(); c.globalCompositeOperation = 'lighter';
    let g = c.createRadialGradient(x, y, 0, x, y, rr * 2.2); g.addColorStop(0, `rgba(${mid},.45)`); g.addColorStop(1, `rgba(${mid},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr * 2.2, 0, T); c.fill();
    g = c.createRadialGradient(x - rr * .2, y - rr * .2, 0, x, y, rr); g.addColorStop(0, `rgba(${core},1)`); g.addColorStop(.45, `rgba(${mid},.95)`); g.addColorStop(.85, `rgba(${mid},.55)`); g.addColorStop(1, `rgba(${rim},.9)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, T); c.fill();
    c.strokeStyle = `rgba(${rim},.9)`; c.lineWidth = Math.max(.8, rr * .1); for (let k = 0; k < arcs; k++) { const a = t / (90 + k * 30) * (k % 2 ? -1 : 1) + k * 2.1; c.beginPath(); c.ellipse(x, y, rr * .75, rr * .3, a, 0, Math.PI * 1.2); c.stroke(); }
    c.restore(); }
  // tumbling debris that falls and bounces off the floor
  const SHAPES = [[[-1, -.4], [-.4, -1], [.6, -.9], [1, -.1], [.7, .8], [-.2, 1], [-1, .5]], [[-1, -.6], [.2, -1], [1, -.2], [.4, .9], [-.8, .7]], [[-.9, -.9], [.9, -.7], [.8, .8], [-.7, .9]]];
  function debris(x, y, n, o = {}) { const { cols = [['#8a7650', '#c8b080'], ['#6a5840', '#a8946a']], v = [80, 220], up = [120, 300], size = [2.5, 5.5], floor = y + 14, life = [.8, 1.3] } = o;
    for (let k = 0; k < N(n); k++) { const a = rnd(0, T), sp = rnd(v[0], v[1]), cc = cols[k % cols.length]; spawn({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: Math.cos(a) * sp, vy: -rnd(up[0], up[1]), drag: .99, ay: 620, floor: floor + rnd(-4, 6), max: rnd(life[0], life[1]), r: rnd(size[0], size[1]), grow: 0, kind: 'chunk', pts: SHAPES[k % 3], col: cc[0], hi: cc[1], rot: rnd(0, T), vr: rnd(-10, 10), a: 1, add: false }); } }
  // falling spark streaks
  function sparks(x, y, n, o = {}) { const { cols = ['#ffffff', '#ffe68a'], v = [120, 320], grav = 300, len = 10, w = 1.4, life = [.25, .55] } = o;
    for (let k = 0; k < N(n); k++) { const a = rnd(0, T), sp = rnd(v[0], v[1]); spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - sp * .25, drag: .93, ay: grav, max: rnd(life[0], life[1]), r: 1, len, lw: w, kind: 'streak', col: cols[k % cols.length], a: 1, add: true }); } }
  const puff = (x, y, n, o = {}) => { const { tex = smokeTex(), r = [6, 12], v = [20, 70], a = .55, up = 20, life = [.6, 1.1], add = false } = o; for (let k = 0; k < N(n); k++) { const an = rnd(0, T); spawn({ x: x + Math.cos(an) * 6, y: y + Math.sin(an) * 4, vx: Math.cos(an) * rnd(v[0], v[1]), vy: Math.sin(an) * rnd(v[0], v[1]) * .5 - up, drag: .95, max: rnd(life[0], life[1]), r: rnd(r[0], r[1]), grow: 1.3, img: typeof tex === 'function' ? tex() : tex, a, add }); } };
  const glowAt = (x, y, r, col, ms = 300, a = .9) => fx({ add: true, max: ms / 1000, draw: (c, q) => { const g = c.createRadialGradient(x, y, 0, x, y, r * (.6 + q * .6)); g.addColorStop(0, `rgba(255,255,255,${a * (1 - q)})`); g.addColorStop(.3, `rgba(${col},${a * .8 * (1 - q)})`); g.addColorStop(1, `rgba(${col},0)`); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r * (.6 + q * .6), 0, T); c.fill(); } });
  // a rotating rune circle on the ground under a Pokémon
  function magicCircle(S, col = '255,220,120', ms = 1100, rr = 1) { fx({ add: true, max: ms / 1000, draw: (c, q) => { const b = body(S), r = 30 * b.k * rr * (q < .2 ? ease.out(q / .2) : 1), a = q > .75 ? (1 - q) / .25 : 1, sp = q * 4;
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(b.i, b.feet); c.scale(1, .38); c.strokeStyle = `rgba(${col},${a})`;
    c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, T); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r * .78, 0, T); c.stroke();
    for (let k = 0; k < 12; k++) { const an = sp + k * T / 12; c.beginPath(); c.moveTo(Math.cos(an) * r * .8, Math.sin(an) * r * .8); c.lineTo(Math.cos(an) * r * .97, Math.sin(an) * r * .97); c.stroke(); }
    c.beginPath(); for (let k = 0; k <= 6; k++) { const an = -sp * .7 + k * T / 3 * 1; const px = Math.cos(an) * r * .75, py = Math.sin(an) * r * .75; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${col},${.25 * a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, T); c.fill(); c.restore(); } }); }

  /* ---------- afterimages: fading, tinted copies of the attacker's current frame ---------- */
  const TINT = new Map();
  function tinted(src, col) { let m = TINT.get(src); if (!m) { m = new Map(); TINT.set(src, m); } let t = m.get(col); if (t) return t;
    t = document.createElement('canvas'); t.width = src.width; t.height = src.height; const x = t.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.globalAlpha = .65; x.fillRect(0, 0, t.width, t.height); if (m.size > 24) m.clear(); m.set(col, t); return t; }
  function ghost(S, col = '#bfe0ff', ms = 260, a0 = .55) {
    try { const L = actorLook(S); if (!L || !L.sp || !L.sp.custom) return; const sd = L.sd, useBack = sd.view === 'back' && L.sp.back, an = ensureAnim(useBack ? L.sp.back : L.sp.front), src = an.frames[animFrameIndex(an, clock.t + (slotTeam(S) === 'B' ? 777 : 0))];
      const flip = (act(S) && act(S).name === 'MissingNo.') ? sd.face > 0 : useBack ? sd.face < 0 : sd.face > 0, unit = .5 * L.scale, img = tinted(src, col), x = bx(sd.x), y = by(sd.y);
      fx({ max: ms / 1000, draw: (c, q) => { c.save(); c.globalAlpha = a0 * (1 - q); c.translate(x, y); c.scale(flip ? -1 : 1, 1); c.imageSmoothingEnabled = false; c.drawImage(img, -an.cx * unit, -(an.h - an.foot) * unit, an.w * unit, an.h * unit); c.restore(); } });
    } catch (e) { }
  }

  /* ---------- elemental explosions (layered set pieces, scaled by k) ---------- */
  const EX = {
    fire(x, y, k = 1) { glowAt(x, y, 46 * k, '255,170,60', 320); shock(x, y, { r1: 70 * k, col: '255,180,80', w: 7 * k, ms: 420 });
      for (let n = 0; n < N(60 * k); n++) { const a = rnd(0, T), v = rnd(60, 220) * k; spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 - 40, drag: .9, ay: -80, max: rnd(.45, .9), r: rnd(7, 15) * k, grow: .7, img: fireTex(rnd(10, 42) | 0), a: 1, add: true }); }
      sparks(x, y, 18 * k, { cols: ['#fff2b0', '#ffb040'], grav: -60, v: [100, 260] }); puff(x, y - 10, 10 * k, { up: 40, r: [8, 14] }); },
    water(x, y, k = 1) { glowAt(x, y, 40 * k, '140,210,255', 260); shock(x, y + 10, { r1: 80 * k, col: '170,225,255', w: 6 * k, squash: .4 });
      for (let n = 0; n < N(50 * k); n++) { const a = rnd(Math.PI * 1.05, Math.PI * 1.95), v = rnd(120, 300) * k; spawn({ x: x + rnd(-6, 6), y: y + 6, vx: Math.cos(a) * v * .6, vy: Math.sin(a) * v, drag: .985, ay: 620, max: rnd(.6, 1), r: rnd(1.5, 3), grow: 0, kind: 'drop', col: n % 3 ? '#cfeeff' : '#ffffff', a: 1, add: true }); }
      puff(x, y, 10 * k, { tex: steamTex(), up: 10, r: [8, 14], a: .5 }); },
    electric(x, y, k = 1) { glowAt(x, y, 50 * k, '255,240,120', 260); shock(x, y, { r1: 70 * k, col: '255,240,140', w: 5 * k });
      const arcs = Array.from({ length: 7 }, () => ({ a: rnd(0, T), l: rnd(30, 60) * k }));
      fx({ add: true, max: .32, draw: (c, q) => { c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; for (const ar of arcs) { const pts = [[x, y]]; for (let s = 1; s <= 6; s++) { const f = s / 6; pts.push([x + Math.cos(ar.a) * ar.l * f + rnd(-6, 6), y + Math.sin(ar.a) * ar.l * f * .8 + rnd(-6, 6)]); }
        for (const [lw, col, al] of [[5, '255,230,90', .3], [2.2, '255,245,160', .8], [1, '255,255,255', 1]]) { c.strokeStyle = `rgba(${col},${al * (1 - q)})`; c.lineWidth = lw; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } } c.restore(); } });
      sparks(x, y, 30 * k, { cols: ['#ffffff', '#fff080'], v: [160, 380], grav: 260 }); },
    ice(x, y, k = 1) { glowAt(x, y, 44 * k, '180,240,255', 300); shock(x, y + 8, { r1: 70 * k, col: '200,245,255', w: 6 * k, squash: .45 });
      const spikes = Array.from({ length: 9 }, (_, i) => ({ a: Math.PI + (i / 8) * Math.PI, h: rnd(16, 30) * k, w: rnd(4, 7) * k, d: rnd(10, 22) * k }));
      fx({ max: .9, draw: (c, q) => { const g = Math.min(1, q / .15), a = q > .6 ? (1 - q) / .4 : 1; c.save(); c.globalAlpha = a; for (const s of spikes) { const bx2 = x + Math.cos(s.a) * s.d, by2 = y + 10 + Math.sin(s.a) * s.d * .35, hh = s.h * ease.back(g);
        c.fillStyle = 'rgba(150,220,250,.85)'; c.beginPath(); c.moveTo(bx2 - s.w, by2); c.lineTo(bx2 + Math.cos(s.a) * 4, by2 - hh); c.lineTo(bx2 + s.w, by2); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(bx2 - s.w * .5, by2); c.lineTo(bx2 + Math.cos(s.a) * 4, by2 - hh); c.lineTo(bx2, by2); c.closePath(); c.fill(); } c.restore(); } });
      for (let n = 0; n < N(26 * k); n++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(80, 220) * k, vy: Math.sin(a) * rnd(80, 220) * k - 30, drag: .92, ay: 160, max: rnd(.5, .9), r: rnd(3, 6) * k, grow: .1, kind: 'shard', col: n % 2 ? '#ffffff' : '#aef0ff', rot: rnd(0, T), vr: rnd(-8, 8), a: 1, add: true }); }
      puff(x, y, 8 * k, { tex: steamTex(), up: 0, r: [10, 16], a: .5 }); },
    psychic(x, y, k = 1) { glowAt(x, y, 46 * k, '255,140,220', 360); for (let i = 0; i < 4; i++) later(i * 70, () => shock(x, y, { r1: (50 + i * 14) * k, col: i % 2 ? '200,150,255' : '255,150,220', w: 4 * k, ms: 460 }));
      for (let n = 0; n < N(30 * k); n++) { const a = rnd(0, T); spawn({ x: x + Math.cos(a) * 30 * k, y: y + Math.sin(a) * 22 * k, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60 - 20, drag: .95, max: rnd(.4, .7), r: rnd(3, 6), grow: .3, img: hueTex(rnd(285, 330) | 0, 90, 70), a: 1, add: true }); } },
    ghost(x, y, k = 1) { for (let n = 0; n < N(26 * k); n++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(40, 140) * k, vy: Math.sin(a) * rnd(40, 140) * k - 30, drag: .94, max: rnd(.6, 1.1), r: rnd(7, 13) * k, grow: 1.1, img: smokeTex(), a: .85, add: false }); }
      for (let n = 0; n < N(26 * k); n++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(60, 200) * k, vy: Math.sin(a) * rnd(60, 200) * k, drag: .92, max: rnd(.35, .7), r: rnd(4, 8) * k, grow: .4, img: hueTex(rnd(260, 290) | 0, 85, 60), a: 1, add: true }); }
      shock(x, y, { r1: 60 * k, col: '170,120,255', w: 5 * k }); },
    dragon(x, y, k = 1) { glowAt(x, y, 50 * k, '150,120,255', 340); shock(x, y, { r1: 76 * k, col: '160,130,255', w: 6 * k });
      for (let s = 0; s < 3; s++) { const a0 = rnd(0, T); ribbon(t => { const a = a0 + t * 4.5, r = (10 + t * 46) * k; return [x + Math.cos(a) * r, y + Math.sin(a) * r * .6]; }, { w: 6 * k, ms: 520, core: '#ffffff', edge: 'rgba(140,110,255,.9)', glow: 'rgba(120,90,255,A)' }); }
      for (let n = 0; n < N(36 * k); n++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(80, 240) * k, vy: Math.sin(a) * rnd(80, 240) * k, drag: .91, max: rnd(.35, .6), r: rnd(4, 8) * k, grow: .5, img: hueTex(rnd(235, 265) | 0, 90, 62), a: 1, add: true }); } },
    steel(x, y, k = 1) { glowAt(x, y, 40 * k, '220,235,255', 240); shock(x, y, { r1: 64 * k, col: '220,230,245', w: 5 * k });
      for (let n = 0; n < N(26 * k); n++) { const a = rnd(0, T); spawn({ x, y, vx: Math.cos(a) * rnd(120, 300) * k, vy: Math.sin(a) * rnd(120, 300) * k - 40, drag: .92, ay: 300, max: rnd(.4, .8), r: rnd(3, 6) * k, grow: 0, kind: 'shard', col: n % 3 ? '#e4ecf6' : '#ffffff', rot: rnd(0, T), vr: rnd(-12, 12), a: 1, add: true }); }
      sparks(x, y, 22 * k, { cols: ['#ffffff', '#cfe0ff'] }); },
    poison(x, y, k = 1) { shock(x, y + 6, { r1: 64 * k, col: '190,110,255', w: 5 * k, squash: .5 });
      for (let n = 0; n < N(36 * k); n++) { const a = rnd(Math.PI, T), v = rnd(80, 220) * k; spawn({ x, y, vx: Math.cos(a) * v * .7, vy: Math.sin(a) * v, drag: .97, ay: 420, max: rnd(.5, .9), r: rnd(2, 4) * k, grow: 0, kind: 'drop', col: n % 2 ? '#a050e0' : '#7a2ab0', a: 1, add: false }); }
      for (let n = 0; n < N(14 * k); n++) spawn({ x: x + rnd(-20, 20) * k, y: y + rnd(-6, 14), vx: rnd(-10, 10), vy: -rnd(20, 50), drag: .98, max: rnd(.6, 1), r: rnd(3, 6), grow: .4, kind: 'ring', col: '#d8a0ff', lw: 1.2, a: 1, add: true });
      puff(x, y, 8 * k, { tex: () => hueTex(280, 60, 40), up: 20, a: .5 }); },
    rock(x, y, k = 1, floor) { shock(x, y + 10, { r1: 70 * k, col: '220,200,160', w: 6 * k, squash: .38 }); debris(x, y, 18 * k, { floor: floor != null ? floor : y + 18 }); puff(x, y + 6, 12 * k, { tex: () => P.tex('dust', [[0, 'rgba(200,180,150,.6)'], [.5, 'rgba(180,160,130,.3)'], [1, 'rgba(160,140,110,0)']]), up: 20, r: [9, 16], a: .6 }); }
  };

  // a Pokémon's current animation frame, for avatars: { an, src, unit, flip }
  function actorFrame(S) { try { const L = actorLook(S); if (!L || !L.sp || !L.sp.custom) return null; const sd = L.sd, useBack = sd.view === 'back' && L.sp.back, an = ensureAnim(useBack ? L.sp.back : L.sp.front);
    return { an, src: an.frames[animFrameIndex(an, clock.t + (slotTeam(S) === 'B' ? 777 : 0))], unit: .5 * L.scale, flip: (act(S) && act(S).name === 'MissingNo.') ? sd.face > 0 : useBack ? sd.face < 0 : sd.face > 0 }; } catch (e) { return null; } }
  window.FXK = { tinted, actorFrame, body, foe, dim, flash, shake, scar, speedLines, shock, star, ribbon, arcPath, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, ease, rnd, N, T };
})();
