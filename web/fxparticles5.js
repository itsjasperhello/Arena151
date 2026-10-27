/* =====================================================================
   Section 27: stat, status, psychic, healing and draining moves and
   Splash as cinematic set pieces (v2). Built on fxkit.js.
   Self moves: a rune circle on the ground, a pillar of light, rising
   energy and the move's own signature. Status moves: a wind-up, a rich
   projectile and a lingering effect on the target.
   ===================================================================== */
(function fxParticles5() {
  const P = window.PFX, K = window.FXK, P3 = window.PFX3; if (!P || !K || !P3) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P;
  const { body, foe, dim, flash, shake, scar, speedLines, shock, star, ribbon, linePath, arcPath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, ghost, EX, later, fx, ease, rnd, N, T } = K;
  const { hitPt, starShape, heartShape } = P3;
  const at = p => { const i = bx(p.x), j = by(p.y), ang = Math.atan2(p.vy, p.vx); return { i, j, ang, ca: Math.cos(ang), sa: Math.sin(ang) }; };
  // energy rising around the user for a while (positions re-read so it follows the Pokémon)
  function rise(S, hue, ms = 700, rate = 60, sat = 90) { const steps = Math.round(ms / 50); for (let s = 0; s < steps; s++) later(s * 50, () => { const b = body(S); for (let k = 0; k < N(rate / 20); k++) { const a = rnd(0, T), r = rnd(.2, .7) * b.w; spawn({ x: b.i + Math.cos(a) * r, y: b.feet - rnd(0, 6), vx: 0, vy: -rnd(70, 150), drag: .97, max: rnd(.5, .9), r: rnd(3, 6) * b.k, grow: .4, img: hueTex(((((hue + rnd(-10, 10)) | 0) % 360) + 360) % 360, sat, 66), a: 1, add: true }); } }); }
  // the shared frame for every self move: rune circle, light pillar, rising energy, and a closing "stat up" sparkle
  function selfFrame(S, col, hue, o = {}) { const { ms = 1100, pil = true, dimA = 0 } = o, b = body(S);
    magicCircle(S, col, ms); if (pil) pillar(b.i, b.feet, { w: Math.max(30, b.w * 1.25), h: 120 + b.h, col, ms: ms * .8 }); rise(S, hue, ms * .7); if (dimA) dim(dimA, ms);
    later(ms * .75, () => { const bb = body(S); shock(bb.i, bb.j, { r1: 50 * bb.k, col, w: 3, ms: 360 }); for (let k = 0; k < N(10); k++) spawn({ x: bb.i + rnd(-.5, .5) * bb.w, y: bb.j + rnd(-.5, .5) * bb.h, vx: 0, vy: -rnd(20, 50), drag: .95, max: rnd(.4, .7), r: rnd(3, 5), grow: .1, kind: 'shard', col: '#ffffff', rot: 0, vr: 5, a: 1, add: true }); }); }
  const text = (S, ch, col, edge, size, dx, rise0, ms = 1000) => fx({ max: ms / 1000, draw: (c, q) => { const b = body(S); c.globalAlpha = q < .15 ? q / .15 : 1 - q; c.fillStyle = col; c.strokeStyle = edge; c.lineWidth = 2.5; c.font = `900 ${size}px sans-serif`; c.textAlign = 'center'; const x = b.i + dx + q * 10, y = b.j - b.h * .5 - rise0 - q * 26; c.strokeText(ch, x, y); c.fillText(ch, x, y); } });

  /* ---------- stat moves ---------- */
  const SELF = {
    swordsDance: S => { selfFrame(S, '255,150,140', 0, { dimA: .25 });
      fx({ max: 1.25, draw: (c, q) => { const b = body(S), n = 6, conv = q < .65 ? 0 : ease.in((q - .65) / .35), R = 46 * b.k * (1 - conv * .85), fade = q > .9 ? (1 - q) / .1 : Math.min(1, q * 6);
        for (let k = 0; k < n; k++) { const a = q * 11 + k * T / n, x = b.i + Math.cos(a) * R, y = b.j + Math.sin(a) * R * .5, sz = 1.25 * b.k;
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35 * fade; c.strokeStyle = '#ff9090'; c.lineWidth = 5; c.beginPath(); c.ellipse(b.i, b.j, R, R * .5, 0, a - .5, a); c.stroke(); c.restore();
          c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2 + Math.PI); c.scale(sz, sz); c.globalAlpha = fade; c.shadowColor = '#ff6a6a'; c.shadowBlur = 8;
          c.fillStyle = '#f2f6ff'; c.beginPath(); c.moveTo(0, -17); c.lineTo(2.8, 6); c.lineTo(-2.8, 6); c.closePath(); c.fill(); c.shadowBlur = 0; c.fillStyle = '#c8d0e0'; c.fillRect(-.6, -14, 1.2, 19); c.fillStyle = '#d84040'; c.fillRect(-5.5, 6, 11, 2.4); c.fillStyle = '#7a4a22'; c.fillRect(-1.3, 8.4, 2.6, 6); c.restore(); } } });
      later(1000, () => { const b = body(S); star(b.i, b.j, { size: 26 * b.k, col: '#ff8a8a' }); flash('#ffd0d0', .2); shock(b.i, b.j, { r1: 80 * b.k, col: '255,150,150', w: 5 }); }); },
    harden: S => { selfFrame(S, '235,240,255', 220, { pil: false });
      fx({ max: .9, draw: (c, q) => { const b = body(S), y = b.feet - q * (b.h * 1.4), fade = q > .8 ? (1 - q) / .2 : 1; c.save(); c.beginPath(); c.ellipse(b.i, b.j, b.w * .6, b.h * .62, 0, 0, T); c.clip(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y - 12, 0, y + 12); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.9 * fade})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(b.i - b.w, y - 12, b.w * 2, 24); c.restore(); } });
      later(450, () => ghost(S, '#ffffff', 400, .7)); later(500, () => { const b = body(S); for (let k = 0; k < N(14); k++) spawn({ x: b.i + rnd(-.5, .5) * b.w, y: b.j + rnd(-.5, .5) * b.h, vx: 0, vy: 0, drag: 1, max: rnd(.3, .5), r: rnd(3, 6), grow: .2, kind: 'shard', col: '#ffffff', rot: 0, vr: 4, a: 1, add: true }); shock(b.i, b.j, { r1: 46 * b.k, col: '255,255,255', w: 4 }); }); },
    bulkUp: S => { selfFrame(S, '255,170,80', 25, { dimA: .2 }); for (let i = 0; i < 4; i++) later(120 + i * 160, () => { const b = body(S); shock(b.i, b.j, { r1: (40 + i * 10) * b.k, col: '255,170,80', w: 5 }); AURAburst(S, 25, 18); shake(2 + i, 100); }); later(760, () => { const b = body(S); star(b.i, b.j, { size: 22 * b.k, col: '#ffb050' }); }); },
    acidArmor: S => { selfFrame(S, '200,120,255', 280, { pil: false });
      fx({ max: 1.2, draw: (c, q) => { const b = body(S), fade = q > .8 ? (1 - q) / .2 : Math.min(1, q * 4), melt = Math.sin(q * Math.PI) * 6; c.save(); c.globalAlpha = .55 * fade; const g = c.createLinearGradient(0, b.j - b.h * .6, 0, b.feet); g.addColorStop(0, 'rgba(220,150,255,.25)'); g.addColorStop(1, 'rgba(120,40,200,.9)'); c.fillStyle = g; c.beginPath(); c.ellipse(b.i, b.j + melt, b.w * .62 + melt, b.h * .58 - melt * .5, 0, 0, T); c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .7 * fade; c.strokeStyle = '#f0d8ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(b.i - b.w * .15, b.j - b.h * .2, b.w * .25, b.h * .2, -.5, 3.6, 5); c.stroke(); c.restore(); } });
      for (let k = 0; k < N(30); k++) later(rnd(0, 900), () => { const b = body(S); spawn({ x: b.i + rnd(-.5, .5) * b.w, y: b.j + rnd(-.3, .4) * b.h, vx: rnd(-6, 6), vy: rnd(10, 40), drag: .99, ay: 160, floor: b.feet + 4, max: rnd(.6, .9), r: rnd(1.8, 3.2), grow: 0, kind: 'drop', col: '#b060f0', a: 1, add: false }); if (Math.random() < .4) spawn({ x: b.i + rnd(-.5, .5) * b.w, y: b.feet - 4, vx: 0, vy: -rnd(10, 30), drag: .98, max: rnd(.4, .7), r: rnd(2, 5), grow: .6, kind: 'ring', col: '#d8a0ff', lw: 1, a: .9, add: true }); }); },
    calmMind: S => { selfFrame(S, '150,200,255', 210, { dimA: .2, ms: 1300 }); for (let i = 0; i < 5; i++) later(i * 220, () => { const b = body(S); shock(b.i, b.j - b.h * .2, { r1: 70 * b.k, col: '160,210,255', w: 2.5, ms: 700 }); });
      later(500, () => { const b = body(S); glowAt(b.i, b.j - b.h * .25, 20 * b.k, '180,220,255', 600); }); },
    agility: S => { selfFrame(S, '170,215,255', 205, { pil: false, ms: 900 });
      for (let i = 0; i < 6; i++) later(i * 110, () => { const b = body(S), a0 = rnd(0, T); ribbon(t => { const a = a0 + t * 4; return [b.i + Math.cos(a) * b.w * .8, b.j + Math.sin(a) * b.h * .35]; }, { w: 5 * b.k, ms: 260, core: '#ffffff', edge: 'rgba(170,215,255,.85)', glow: 'rgba(140,195,255,A)', grow: .3 }); ghost(S, '#bfe0ff', 300, .45); });
      for (let k = 0; k < N(30); k++) later(rnd(0, 700), () => { const b = body(S), a = rnd(0, T); spawn({ x: b.i + Math.cos(a) * b.w * .8, y: b.j + Math.sin(a) * b.h * .4, vx: -Math.sin(a) * 280, vy: Math.cos(a) * 140, drag: .9, max: .2, r: 1, len: 16, lw: 1.6, kind: 'streak', col: '#ffffff', a: 1, add: true }); }); },
    amnesia: S => { selfFrame(S, '255,160,220', 320, { pil: false }); for (let i = 0; i < 3; i++) later(i * 200, () => text(S, '?', '#ffb0e0', '#7a1a68', 20 + i * 4, (i - 1) * 16, 6, 1100));
      fx({ add: true, max: 1.1, draw: (c, q) => { const b = body(S); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,150,220,${(1 - q) * .9})`; c.lineWidth = 2.2; c.beginPath(); for (let t = 0; t < 26; t += .25) { const r = t * 1.4 * b.k, a = t + q * 9; c.lineTo(b.i + Math.cos(a) * r, b.j - b.h * .55 + Math.sin(a) * r * .5); } c.stroke(); c.restore(); } }); },
    dragonDance: S => { selfFrame(S, '170,140,255', 255, { dimA: .3, ms: 1300 });
      for (let i = 0; i < 2; i++) { const red = i === 0; fx({ add: true, max: 1.1, draw: (c, q) => { const b = body(S), turns = 3.2, n = 40, fade = q > .8 ? (1 - q) / .2 : 1; c.save(); c.globalCompositeOperation = 'lighter';
          for (let s = 0; s < n * Math.min(1, q * 1.6); s++) { const f = s / n, a = f * T * turns + q * 6 + (red ? 0 : Math.PI), r = b.w * (.75 - f * .25), x = b.i + Math.cos(a) * r, y = b.feet - f * (b.h + 50) + Math.sin(a) * r * .3;
            const g = c.createRadialGradient(x, y, 0, x, y, 8 * b.k); g.addColorStop(0, red ? `rgba(255,200,120,${.9 * fade})` : `rgba(180,220,255,${.9 * fade})`); g.addColorStop(1, red ? 'rgba(255,60,20,0)' : 'rgba(60,90,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 8 * b.k, 0, T); c.fill(); } c.restore(); } }); }
      later(900, () => { const b = body(S); EX.dragon(b.i, b.j, b.k); shake(4, 200); }); },
    ironDefense: S => { selfFrame(S, '215,228,245', 215, { pil: false });
      fx({ max: 1.15, draw: (c, q) => { const b = body(S), g = Math.min(1, q / .3), grow = ease.back(g), fade = q > .82 ? (1 - q) / .18 : 1, sweep = (q * 2.5) % 1;
        for (let ring = -2; ring <= 2; ring++) for (let k = 0; k < 8; k++) { const a = k * T / 8 + ring * .4 + q * .8, rr = b.w * .75 * grow * Math.cos(ring * .38), x = b.i + Math.cos(a) * rr, y = b.j + ring * b.h * .2 * grow + Math.sin(a) * 6, front = Math.sin(a) > -.15, sz = 7 * b.k;
          c.save(); c.globalAlpha = fade * (front ? .9 : .3); c.fillStyle = front ? '#d8e2ee' : '#7a8898'; c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); for (let s = 0; s < 6; s++) { const bb = s * T / 6; s ? c.lineTo(x + Math.cos(bb) * sz, y + Math.sin(bb) * sz) : c.moveTo(x + Math.cos(bb) * sz, y + Math.sin(bb) * sz); } c.closePath(); c.fill(); c.stroke();
          if (front && Math.abs(((Math.cos(a) + 1) / 2) - sweep) < .12) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.8)'; c.fill(); } c.restore(); } } });
      later(380, () => { const b = body(S); shock(b.i, b.j, { r1: 60 * b.k, col: '230,240,255', w: 5 }); sparks(b.i, b.j, 14, { cols: ['#ffffff'] }); }); },
    rockPolish: S => { selfFrame(S, '255,240,200', 40, { pil: false, ms: 900 }); SELF.agility(S);
      for (let k = 0; k < N(24); k++) later(rnd(0, 700), () => { const b = body(S); spawn({ x: b.i + rnd(-.6, .6) * b.w, y: b.j + rnd(-.6, .6) * b.h, vx: 0, vy: 0, drag: 1, max: rnd(.3, .5), r: rnd(3, 6), grow: .1, kind: 'shard', col: '#fffbe0', rot: rnd(0, T), vr: 6, a: 1, add: true }); }); },
    recover: S => { selfFrame(S, '150,255,180', 135, { ms: 1300 });
      fx({ add: true, max: 1.2, draw: (c, q) => { const b = body(S); c.save(); c.globalCompositeOperation = 'lighter'; for (let s = 0; s < 3; s++) { for (let k = 0; k < 18; k++) { const f = k / 18, a = f * T * 1.5 + q * 8 + s * T / 3, r = b.w * .6, x = b.i + Math.cos(a) * r, y = b.feet - ((f + q) % 1) * (b.h + 30) + Math.sin(a) * r * .3; c.fillStyle = `rgba(170,255,190,${.8 * (1 - f)})`; c.beginPath(); c.arc(x, y, 2.4 * b.k, 0, T); c.fill(); } } c.restore(); } });
      for (let k = 0; k < N(12); k++) later(rnd(100, 900), () => { const b = body(S), x0 = b.i + rnd(-.5, .5) * b.w, y0 = b.j + rnd(-.2, .4) * b.h; fx({ max: .8, draw: (c, q) => { c.globalAlpha = 1 - q; c.fillStyle = '#9dffb4'; c.strokeStyle = '#1a6a3a'; c.lineWidth = 1; const y = y0 - q * 40, s = 5 * b.k; c.fillRect(x0 - s * .3, y - s, s * .6, s * 2); c.fillRect(x0 - s, y - s * .3, s * 2, s * .6); } }); });
      later(300, () => { const b = body(S); glowAt(b.i, b.j, 50 * b.k, '170,255,190', 800, .6); }); },
    rest: S => { dim(.35, 1700, '0,0,40'); SELF.recover(S);
      fx({ add: true, max: 1.6, draw: (c, q) => { const b = body(S), a = Math.sin(q * Math.PI); c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(b.i, b.j, 0, b.i, b.j, b.h * 1.2); g.addColorStop(0, `rgba(150,170,255,${.4 * a})`); g.addColorStop(1, 'rgba(80,90,200,0)'); c.fillStyle = g; c.beginPath(); c.arc(b.i, b.j, b.h * 1.2, 0, T); c.fill(); c.restore(); } });
      for (let i = 0; i < 4; i++) later(i * 280, () => text(S, 'Z', '#e8f0ff', '#2a3a8a', 12 + i * 4, 14 + i * 6, 4 + i * 6, 1200)); },
    splash: S => { for (let i = 0; i < 3; i++) later(i * 200, () => { const b = body(S); EX.water(b.i, b.feet - 4, .7 * b.k); shock(b.i, b.feet, { r1: 50 * b.k, col: '180,225,255', w: 3, squash: .35 }); }); later(650, () => { const b = body(S); text(S, '...', '#ffffff', '#3a3a5a', 18, 0, 6, 900); }); }
  };
  function AURAburst(S, hue, n) { const b = body(S); for (let k = 0; k < N(n); k++) { const a = rnd(0, T); spawn({ x: b.i + Math.cos(a) * b.w * .4, y: b.j + Math.sin(a) * b.h * .4, vx: Math.cos(a) * rnd(60, 160), vy: Math.sin(a) * rnd(60, 160) - 40, drag: .92, ay: -60, max: rnd(.35, .6), r: rnd(5, 10) * b.k, grow: .6, img: fireTex(rnd(14, 40) | 0), a: 1, add: true }); } }

  /* ---------- status projectiles and their lingering effects ---------- */
  const SH = {
    wisp: p => { const s = at(p); for (let n = due(p, 220); n > 0; n--) spawn({ x: s.i + rnd(-4, 4), y: s.j + rnd(-4, 4), vx: -s.ca * rnd(20, 60) + rnd(-15, 15), vy: -rnd(30, 70), drag: .95, ay: -50, max: rnd(.35, .6), r: rnd(4, 9), grow: .6, img: hueTex(rnd(220, 268) | 0, 95, 62), a: 1, add: true });
      fx({ add: true, max: .02, draw: c => orb(c, s.i, s.j + Math.sin(clock.t / 90) * 3, 8, { core: '255,255,255', mid: '150,170,255', rim: '200,215,255', arcs: 2 }) }); },
    twave: p => { const s = at(p), c = bctx; c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const rr = 7 + k * 5; c.strokeStyle = `rgba(255,232,74,${.9 - k * .18})`; c.lineWidth = 1.8 - k * .3; c.beginPath(); for (let a = 0; a <= T + .01; a += T / 18) { const r = rr + Math.random() * 3; a ? c.lineTo(s.i + Math.cos(a) * r, s.j + Math.sin(a) * r * .8) : c.moveTo(s.i + r, s.j); } c.stroke(); } c.restore();
      for (let n = due(p, 90); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-100, 100), vy: rnd(-100, 100), drag: .86, max: .22, r: rnd(1.5, 3), grow: .2, img: colTex('#fff080', 1), a: 1, add: true }); },
    toxic: p => { const s = at(p); for (let n = due(p, 80); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-12, 12), vy: rnd(10, 40), drag: .98, ay: 220, max: rnd(.4, .7), r: rnd(1.6, 2.8), grow: 0, kind: 'drop', col: '#7a2ab0', a: 1, add: false });
      for (let n = due(p._f || (p._f = {}), 40); n > 0; n--) spawn({ x: s.i, y: s.j, vx: -s.ca * 30, vy: -rnd(10, 30), drag: .97, max: .6, r: rnd(5, 9), grow: 1, img: hueTex(285, 60, 38), a: .5, add: false });
      const c = bctx, g = c.createRadialGradient(s.i - 3, s.j - 3, 1, s.i, s.j, 10); g.addColorStop(0, '#f0c8ff'); g.addColorStop(.45, '#7a1ab0'); g.addColorStop(1, '#3a0a60'); c.save(); c.fillStyle = g; c.beginPath(); c.arc(s.i, s.j, 10, 0, T); c.fill(); c.restore(); glowAt(s.i, s.j, 18, '180,90,255', 30, .5); },
    hypno: p => { const s = at(p), c = bctx; c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const r = ((clock.t / 35 + k * 5) % 25) + 2; c.strokeStyle = `rgba(255,${150 + k * 15},230,${1 - r / 27})`; c.lineWidth = 2; c.beginPath(); c.ellipse(s.i, s.j, r, r * .8, 0, 0, T); c.stroke(); } c.restore(); glowAt(s.i, s.j, 14, '255,160,230', 30, .6); },
    string: p => { const s = at(p), c = bctx, o = p._o || (p._o = { x: bx(side(p.owner).x + side(p.owner).face * 16), y: by(side(p.owner).y - 30) }); c.save(); for (let k = -2; k <= 2; k++) { c.strokeStyle = `rgba(255,255,255,${.9 - Math.abs(k) * .15})`; c.lineWidth = 1.2; c.beginPath(); c.moveTo(o.x, o.y); c.quadraticCurveTo((o.x + s.i) / 2, (o.y + s.j) / 2 + k * 10 + Math.sin(clock.t / 60 + k) * 4, s.i + k * 3, s.j + k * 2); c.stroke(); } c.restore(); glowAt(s.i, s.j, 9, '255,255,255', 30, .6); },
    confuse: p => { const s = at(p), f = .6 + .4 * Math.sin(clock.t / 30), hue = (clock.t / 3) % 360; fx({ add: true, max: .02, draw: c => orb(c, s.i, s.j, 9 * f + 3, { core: '255,255,255', mid: `${Math.round(200 + 55 * Math.sin(hue / 57))},220,120`, rim: '255,255,200', arcs: 3 }) });
      for (let n = due(p, 90); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-40, 40), vy: rnd(-40, 40), drag: .92, max: .4, r: rnd(2, 4), grow: .2, img: hueTex(rnd(0, 360) | 0, 90, 70), a: 1, add: true }); },
    charm: p => { const s = at(p); for (let n = due(p, 40); n > 0; n--) { const sz = rnd(3, 5); spawn({ x: s.i, y: s.j, vx: rnd(-25, 25), vy: -rnd(10, 40), drag: .96, max: .7, r: 1, kind: 'fn', a: 1, draw: (c, q, pp, op) => { c.globalAlpha = op; heartShape(c, pp.x, pp.y, sz, '#ff6ac0'); } }); }
      const c = bctx; c.save(); c.shadowColor = '#ff4aa0'; c.shadowBlur = 10; heartShape(c, s.i, s.j, 10, '#ff6ac0'); c.restore(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(s.i - 4, s.j - 3, 2.4, 0, T); c.fill(); },
    gigaDrain: p => { const s = at(p); for (let n = due(p, 160); n > 0; n--) spawn({ x: s.i + rnd(-5, 5), y: s.j + rnd(-5, 5), vx: -s.ca * rnd(20, 50), vy: -s.sa * rnd(20, 50), drag: .95, max: rnd(.3, .5), r: rnd(3, 6), grow: .5, img: hueTex(rnd(95, 130) | 0, 85, 60), a: .9, add: true });
      fx({ add: true, max: .02, draw: c => orb(c, s.i, s.j, 9, { core: '255,255,230', mid: '140,240,90', rim: '210,255,170', arcs: 3 }) }); },
    leech: p => { const s = at(p); glowAt(s.i, s.j, 12, '255,110,120', 30, .9); for (let n = due(p, 70); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-25, 25), vy: rnd(-25, 25), drag: .93, max: .32, r: rnd(2, 3.5), grow: .3, img: hueTex(355, 85, 60), a: .9, add: true }); }
  };
  const ON = {
    wisp: S => { dim(.25, 900, '10,0,40'); const h = hitPt(S); glowAt(h.x, h.y, 50 * h.b.k, '140,150,255', 500); for (let s = 0; s < 18; s++) later(s * 45, () => { const b = body(S); for (let k = 0; k < N(10); k++) { const a = rnd(0, T), r = Math.sqrt(Math.random()); spawn({ x: b.i + Math.cos(a) * b.w * .6 * r, y: b.j + Math.sin(a) * b.h * .55 * r, vx: rnd(-15, 15), vy: -rnd(50, 110), drag: .94, ay: -50, max: rnd(.35, .6), r: rnd(5, 10) * b.k, grow: .6, img: hueTex(rnd(220, 268) | 0, 95, 62), a: 1, add: true }); } }); },
    cage: S => { const h = hitPt(S); flash('#fff6a0', .15); EX.electric(h.x, h.y, h.b.k * .8);
      fx({ add: true, max: 1, draw: (c, q) => { const b = body(S), a = q > .7 ? (1 - q) / .3 : 1; c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 8; k++) { const an = k * T / 8 + q * 1.5, x = b.i + Math.cos(an) * b.w * .65, front = Math.sin(an) > 0; c.strokeStyle = `rgba(255,236,90,${a * (front ? 1 : .4)})`; c.lineWidth = front ? 2 : 1; c.beginPath(); let y = b.j - b.h * .65; c.moveTo(x, y); while (y < b.feet) { y += rnd(6, 11); c.lineTo(x + rnd(-3, 3), Math.min(y, b.feet)); } c.stroke(); }
        for (const yy of [b.j - b.h * .65, b.feet]) { c.strokeStyle = `rgba(255,240,140,${a * .8})`; c.lineWidth = 1.6; c.beginPath(); c.ellipse(b.i, yy, b.w * .65, b.w * .2, 0, 0, T); c.stroke(); } c.restore(); } }); },
    toxic: S => { const h = hitPt(S); EX.poison(h.x, h.y, h.b.k * 1.2); for (let s = 0; s < 16; s++) later(s * 60, () => { const b = body(S); spawn({ x: b.i + rnd(-.6, .6) * b.w, y: b.feet - rnd(0, 10), vx: rnd(-10, 10), vy: -rnd(15, 40), drag: .98, max: rnd(1, 1.5), r: rnd(9, 15) * b.k, grow: 1.2, img: hueTex(285, 55, 36), a: .5, add: false }); spawn({ x: b.i + rnd(-.5, .5) * b.w, y: b.feet - 4, vx: 0, vy: -rnd(20, 50), drag: .98, max: rnd(.5, .8), r: rnd(2, 5), grow: .6, kind: 'ring', col: '#d8a0ff', lw: 1.2, a: 1, add: true }); }); },
    spiral: S => { const h = hitPt(S); glowAt(h.x, h.y, 50 * h.b.k, '255,150,230', 600, .5); fx({ add: true, max: 1.2, draw: (c, q) => { const b = body(S), a = q > .75 ? (1 - q) / .25 : Math.min(1, q * 5); c.save(); c.globalCompositeOperation = 'lighter';
        for (let arm = 0; arm < 2; arm++) { c.strokeStyle = arm ? `rgba(200,140,255,${a})` : `rgba(255,150,230,${a})`; c.lineWidth = 3; c.beginPath(); for (let t = 0; t < 30; t += .25) { const r = t * 1.6 * b.k, an = t - q * 16 + arm * Math.PI; c.lineTo(b.i + Math.cos(an) * r, b.j - 6 + Math.sin(an) * r * .55); } c.stroke(); } c.restore(); } });
      for (let i = 0; i < 3; i++) later(400 + i * 220, () => text(S, 'Z', '#ffe0f8', '#7a1a68', 13 + i * 3, 12 + i * 5, 4 + i * 5, 1000)); },
    web: S => { const h = hitPt(S), u = body(foe(S)); fx({ max: 1.6, draw: (c, q) => { const b = body(S), grow = ease.out(Math.min(1, q / .25)), fade = q > .72 ? (1 - q) / .28 : 1, R = b.w * .95 * grow; c.save(); c.globalAlpha = fade; c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.shadowColor = '#ffffff'; c.shadowBlur = 3;
        for (let k = 0; k < 10; k++) { const a = k * T / 10; c.beginPath(); c.moveTo(b.i, b.j); c.lineTo(b.i + Math.cos(a) * R, b.j + Math.sin(a) * R * .85); c.stroke(); }
        for (let r = 1; r <= 4; r++) { c.beginPath(); for (let k = 0; k <= 10; k++) { const a = k * T / 10, rr = R * r / 4, sag = k % 2 ? .92 : 1; k ? c.lineTo(b.i + Math.cos(a) * rr * sag, b.j + Math.sin(a) * rr * .85 * sag) : c.moveTo(b.i + rr, b.j); } c.stroke(); }
        c.globalAlpha = fade * .6; c.lineWidth = .8; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(u.i, u.j); c.quadraticCurveTo((u.i + b.i) / 2, (u.j + b.j) / 2 + 14 + k * 6, b.i + k * 4, b.j); c.stroke(); } c.restore(); } }); },
    dizzy: S => { const h = hitPt(S); glowAt(h.x, h.y, 40 * h.b.k, '255,230,140', 400); fx({ max: 1.6, draw: (c, q) => { const b = body(S), fade = q > .75 ? (1 - q) / .25 : 1;
        for (let k = 0; k < 5; k++) { const a = q * 12 + k * T / 5, x = b.i + Math.cos(a) * b.w * .55, y = b.j - b.h * .55 + Math.sin(a) * 6; c.globalAlpha = fade * (Math.sin(a) > 0 ? 1 : .5); starShape(c, x, y, 5 * b.k, k % 2 ? '#ffe24a' : '#ffffff'); } } }); },
    hearts: S => { const h = hitPt(S); glowAt(h.x, h.y, 46 * h.b.k, '255,140,210', 400); later(80, () => fx({ max: .7, draw: (c, q) => { c.globalAlpha = q > .5 ? (1 - q) / .5 : 1; c.save(); c.shadowColor = '#ff4aa0'; c.shadowBlur = 12; heartShape(c, h.x, h.y - q * 20, (14 + ease.back(Math.min(1, q / .3)) * 10) * h.b.k, '#ff6ac0'); c.restore(); } }));
      for (let k = 0; k < N(16); k++) { const a = rnd(0, T), v = rnd(60, 160), sz = rnd(4, 7); spawn({ x: h.x, y: h.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, drag: .94, ay: 60, max: rnd(.7, 1.1), r: 1, kind: 'fn', a: 1, draw: (c, q, pp, op) => { c.globalAlpha = op; heartShape(c, pp.x, pp.y, sz, k % 3 ? '#ff6ac0' : '#ffb0e0'); } }); } },
    // draining: glowing motes and ribbons stream from the target back to the user, who glows as it heals
    drain: (S, hue, n = 30) => { const user = foe(S);
      for (let k = 0; k < N(n); k++) later(k * 22, () => { const h0 = body(S), off = { x: rnd(-.5, .5) * h0.w, y: rnd(-.5, .5) * h0.h }, bend = rnd(-50, 50);
        fx({ add: true, max: .6, draw: (c, q) => { const t0 = body(S), u = body(user), x0 = t0.i + off.x, y0 = t0.j + off.y, mx = (x0 + u.i) / 2, my = (y0 + u.j) / 2 + bend, e = ease.inOut(q), u1 = 1 - e, x = u1 * u1 * x0 + 2 * u1 * e * mx + e * e * u.i, y = u1 * u1 * y0 + 2 * u1 * e * my + e * e * u.j;
          const g = c.createRadialGradient(x, y, 0, x, y, 7); g.addColorStop(0, `hsla(${hue},100%,85%,1)`); g.addColorStop(1, `hsla(${hue},90%,55%,0)`); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, 7, 0, T); c.fill(); } }); });
      later(150, () => { const t0 = body(S); glowAt(t0.i, t0.j, 40 * t0.k, `${hue === 355 ? '255,110,120' : '150,240,110'}`, 600, .5); });
      later(700, () => { const u = body(user); pillar(u.i, u.feet, { w: Math.max(28, u.w * 1.2), h: 120, col: hue === 355 ? '255,130,140' : '150,255,150', ms: 600 }); glowAt(u.i, u.j, 46 * u.k, hue === 355 ? '255,130,140' : '160,255,160', 500, .6); }); }
  };

  /* ---------- psychic marks ---------- */
  const MARK = {
    confusion: (mk, q) => { const x = bx(mk.x), y = by(mk.y) - 22, c = bctx; glowAt(x, y, 36 * (.6 + q * .4), '255,130,215', 30, .3 + q * .25);
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const r = ((q * 2 + k / 4) % 1) * 46; c.strokeStyle = `rgba(255,140,215,${1 - r / 46})`; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r, r * .6, 0, 0, T); c.stroke(); } c.restore();
      if (Math.random() < .45 * QMUL()) spawn({ x: x + rnd(-26, 26), y: y + rnd(-16, 16), vx: 0, vy: -rnd(20, 45), drag: .96, max: .45, r: rnd(2, 4), grow: .3, img: hueTex(rnd(295, 325) | 0, 90, 70), a: 1, add: true }); },
    psychic: (mk, q) => { const x = bx(mk.x), y = by(mk.y) - 22, c = bctx; if (!mk._d) { mk._d = 1; dim(.35, 1000, '30,0,40'); }
      glowAt(x, y, 60 * (.6 + q * .5), '255,120,210', 30, .35 + q * .3);
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 7; k++) { const r = ((q * 2.5 + k / 7) % 1) * 70, wob = Math.sin(clock.t / 35 + k) * 4; c.strokeStyle = `rgba(${k % 2 ? 200 : 255},${k % 2 ? 140 : 160},255,${(1 - r / 70) * .95})`; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r + wob, (r + wob) * .62, 0, 0, T); c.stroke(); }
      for (let k = 0; k < 6; k++) { const a = clock.t / 300 + k * T / 6, r0 = 70 * (1 - q * .5); c.strokeStyle = `rgba(255,190,240,${.5 * q})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .6); c.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 9); c.stroke(); } c.restore();
      if (Math.random() < .6 * QMUL()) spawn({ x: x + rnd(-36, 36), y: y + rnd(-24, 24), vx: 0, vy: -rnd(20, 50), drag: .96, max: .5, r: rnd(2.5, 5), grow: .3, img: hueTex(rnd(290, 325) | 0, 90, 68), a: 1, add: true });
      if (q > .88 && !mk._b) { mk._b = 1; EX.psychic(x, y, 1.6); flash('#ffc8f0', .25); shake(6, 220); } },
    nightShade: (mk, q) => { const x = bx(mk.x), y = by(mk.y), c = bctx; if (!mk._d) { mk._d = 1; dim(.45, 1100, '10,0,20'); }
      c.save(); c.globalAlpha = .4 + q * .4; const g = c.createRadialGradient(x, y - 26, 2, x, y - 26, 54); g.addColorStop(0, 'rgba(10,0,20,.95)'); g.addColorStop(1, 'rgba(30,10,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 26, 54, 0, T); c.fill(); c.restore();
      if (!mk._t) mk._t = Array.from({ length: 6 }, (_, k) => ({ a: k * T / 6 + rnd(-.3, .3), bend: rnd(-30, 30) }));
      for (const t of mk._t) { const r0 = 110, x0 = x + Math.cos(t.a) * r0, y0 = y - 26 + Math.sin(t.a) * r0 * .6, f = Math.min(1, q * 1.3);
        c.save(); c.lineCap = 'round'; for (const [lw, col] of [[7, 'rgba(20,0,40,.75)'], [2, 'rgba(170,110,255,.8)']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let s = 0; s <= 16 * f; s++) { const u = s / 16, px = x0 + (x - x0) * u + Math.sin(u * 7 + clock.t / 80) * t.bend * (1 - u) * .3, py = y0 + (y - 26 - y0) * u + Math.cos(u * 5) * t.bend * .2 * (1 - u); s ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } c.restore(); }
      if (q > .86 && !mk._b) { mk._b = 1; EX.ghost(x, y - 26, 1.6); flash('#3a1a5a', .3); shake(6, 220); } }
  };

  /* ---------- register ---------- */
  const shotWrap = f => p => { const c = bctx, i = bx(p.x), j = by(p.y), Kk = 1.35; c.save(); c.translate(i, j); c.scale(Kk, Kk); c.translate(-i, -j); try { f(p); } finally { c.restore(); } };
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.shot) o.shot = shotWrap(r.shot);
    if (r.markDraw) o.markDraw = (...a) => { try { r.markDraw(...a); } catch (e) { console.error(e); } };
    for (const kk of ['impact', 'exec']) if (r[kk]) { const prev = old[kk]; o[kk] = (...a) => { if (prev) try { prev(...a); } catch (e) { console.error(e); } try { r[kk](...a); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  const castGlow = (rgb, hue) => S => { const b = body(S); P3.windup(S, rgb, hue, 18); glowAt(b.i + b.face * b.w * .4, b.j, 22 * b.k, rgb, 300); };
  reg('Swords Dance', { exec: SELF.swordsDance }); reg('Harden', { exec: SELF.harden }); reg('Bulk Up', { exec: SELF.bulkUp }); reg('Acid Armor', { exec: SELF.acidArmor });
  reg('Calm Mind', { exec: SELF.calmMind }); reg('Agility', { exec: SELF.agility }); reg('Amnesia', { exec: SELF.amnesia }); reg('Dragon Dance', { exec: SELF.dragonDance });
  reg('Iron Defense', { exec: SELF.ironDefense }); reg('Rock Polish', { exec: SELF.rockPolish }); reg('Recover', { exec: SELF.recover }); reg('Rest', { exec: SELF.rest }); reg('Splash', { exec: SELF.splash });
  reg('Will-O-Wisp', { exec: S => { castGlow('150,170,255', 240)(S); fx({ add: true, max: .5, draw: (c, q) => { const b = body(S); for (let k = 0; k < 3; k++) { const a = q * 10 + k * T / 3; c.save(); const x = b.i + Math.cos(a) * b.w * .7, y = b.j + Math.sin(a) * b.h * .3; c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(140,160,255,.8)'); g.addColorStop(1, 'rgba(90,90,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 9, 0, T); c.fill(); c.restore(); } } }); }, shot: SH.wisp, impact: ON.wisp });
  reg('Thunder Wave', { exec: castGlow('255,240,120', 52), shot: SH.twave, impact: ON.cage });
  reg('Toxic', { exec: castGlow('190,110,255', 285), shot: SH.toxic, impact: ON.toxic });
  reg('Hypnosis', { exec: castGlow('255,160,230', 315), shot: SH.hypno, impact: ON.spiral });
  reg('String Shot', { shot: SH.string, impact: ON.web });
  reg('Confuse Ray', { exec: castGlow('255,230,140', 50), shot: SH.confuse, impact: ON.dizzy });
  reg('Charm', { exec: castGlow('255,140,210', 330), shot: SH.charm, impact: ON.hearts });
  reg('Confusion', { markDraw: MARK.confusion, impact: S => { const h = hitPt(S); EX.psychic(h.x, h.y, h.b.k * .8); } });
  reg('Psychic', { markDraw: MARK.psychic, impact: S => { const h = hitPt(S); star(h.x, h.y, { size: 20 * h.b.k, col: '#ff9ae0' }); } });
  reg('Night Shade', { markDraw: MARK.nightShade, impact: S => { const h = hitPt(S); star(h.x, h.y, { size: 18 * h.b.k, col: '#8a5ae0' }); } });
  reg('Giga Drain', { exec: castGlow('160,240,110', 110), shot: SH.gigaDrain, impact: S => { const h = hitPt(S); EX.psychic && glowAt(h.x, h.y, 40 * h.b.k, '150,240,110', 300); sparks(h.x, h.y, 16, { cols: ['#d8ffb0', '#a8f070'] }); ON.drain(S, 110, 34); } });
  reg('Leech Life', { shot: SH.leech, impact: S => { P3.jaws(S, { col: '#ffd0d0', size: .7, gl: '#ff8a8a' }); ON.drain(S, 355, 22); } });
  window.PFX5 = { SELF, SH, ON, MARK };
})();
