/* =====================================================================
   Section 27: rebuilt stat moves, status moves, psychic moves, healing,
   draining and Splash (milestone 5, the last). Same particle engine.
   Self moves use the 'exec' hook (played around the user); status and
   draining moves are projectiles; Confusion / Psychic / Night Shade are
   ground marks.
   ===================================================================== */
(function fxParticles5() {
  const P = window.PFX, P2 = window.PFX2, P3 = window.PFX3; if (!P || !P2 || !P3) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P, HIT = P2.HIT;
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), N = n => Math.max(1, Math.round(n * QMUL()));
  const C = () => bctx;
  const self = S => { const sd = side(S); return { i: bx(sd.x), j: by(sd.y - 24), feet: by(sd.y), sd }; };
  const live = S => { const m = self(S); return m; };   // positions are re-read each frame, so effects follow the Pokémon
  const hitAt = S => { const h = headOf(S); return { i: bx(h.x), j: by(h.y + 10) }; };
  const at = p => { const i = bx(p.x), j = by(p.y), ang = Math.atan2(p.vy, p.vx); return { i, j, ang, ca: Math.cos(ang), sa: Math.sin(ang) }; };
  const fn = (x, y, max, draw) => spawn({ x, y, vx: 0, vy: 0, drag: 1, max, r: 1, kind: 'fn', a: 1, draw });
  const glow = (c, x, y, r, inner, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, inner.replace('A', a)); g.addColorStop(1, inner.replace('A', 0)); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, T); c.fill(); c.globalCompositeOperation = 'source-over'; };
  // a column of rising light around the user (shared by all the self moves)
  function rise(S, hue, n = 40, sat = 90) { const m = self(S); for (let k = 0; k < N(n); k++) { const a = rnd(0, T), r = rnd(6, 22); setTimeoutGame(rnd(0, 500), () => { const q = live(S); spawn({ x: q.i + Math.cos(a) * r, y: q.feet - rnd(0, 6), vx: 0, vy: -rnd(60, 130), drag: .97, max: rnd(.5, .9), r: rnd(3, 6), grow: .4, img: hueTex((hue + rnd(-10, 10)) | 0, sat, 64), a: 1, add: true }); }); } }
  function pulse(S, col, n = 3, gap = 160, lw = 2) { for (let k = 0; k < n; k++) setTimeoutGame(k * gap, () => { const m = live(S); spawn({ x: m.i, y: m.j, vx: 0, vy: 0, drag: 1, max: .5, r: 6, grow: 5, kind: 'ring', col, lw, a: .9, add: true }); }); }

  /* ---------- stat moves (around the user) ---------- */
  const SELF = {
    swordsDance: S => { fn(0, 0, 1.2, (c, q) => { const m = live(S), n = 6, R = 30 * (q < .7 ? 1 : 1 - (q - .7) / .3 * .9), fade = q > .85 ? (1 - q) / .15 : Math.min(1, q * 5);
      for (let k = 0; k < n; k++) { const a = q * 9 + k * T / n, x = m.i + Math.cos(a) * R, y = m.j + Math.sin(a) * R * .55; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.globalAlpha = fade;
        c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,120,120,.35)'; c.fillRect(-4, -15, 8, 26); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#eef4ff'; c.beginPath(); c.moveTo(0, -14); c.lineTo(2.2, 6); c.lineTo(-2.2, 6); c.closePath(); c.fill(); c.fillStyle = '#d84040'; c.fillRect(-4.5, 6, 9, 2); c.fillStyle = '#8a5a2a'; c.fillRect(-1.2, 8, 2.4, 5); c.restore(); }
      if (q > .7) glow(c, m.i, m.j, 30 * (q - .7) / .3 + 6, 'rgba(255,200,200,A)', fade); }); rise(S, 0, 26); },
    harden: S => { fn(0, 0, .8, (c, q) => { const m = live(S), y = m.j + 28 - q * 70, fade = q > .8 ? (1 - q) / .2 : 1; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y - 8, 0, y + 8); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${.8 * fade})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(m.i, m.j, 26, 32, 0, 0, T); c.clip(); c.fillRect(m.i - 30, y - 8, 60, 16); c.restore(); });
      setTimeoutGame(500, () => { const m = live(S); for (let k = 0; k < N(10); k++) spawn({ x: m.i + rnd(-20, 20), y: m.j + rnd(-24, 24), vx: 0, vy: 0, drag: 1, max: rnd(.3, .5), r: rnd(3, 5), grow: .2, kind: 'shard', col: '#ffffff', rot: 0, vr: 4, a: 1, add: true }); }); },
    bulkUp: S => { rise(S, 25, 60, 95); pulse(S, '#ffb050', 4, 140, 3); setTimeoutGame(300, () => { if (typeof VFX !== 'undefined' && VFX.shake) VFX.shake(3, 200); }); },
    acidArmor: S => { fn(0, 0, 1.1, (c, q) => { const m = live(S), fade = q > .8 ? (1 - q) / .2 : Math.min(1, q * 4); c.save(); c.globalAlpha = .45 * fade; const g = c.createLinearGradient(0, m.j - 30, 0, m.feet); g.addColorStop(0, 'rgba(200,120,255,.2)'); g.addColorStop(1, 'rgba(120,40,200,.8)'); c.fillStyle = g; c.beginPath(); c.ellipse(m.i, m.j + 4 + q * 6, 24, 30 - q * 6, 0, 0, T); c.fill(); c.restore(); });
      for (let k = 0; k < N(24); k++) setTimeoutGame(rnd(0, 700), () => { const m = live(S); spawn({ x: m.i + rnd(-18, 18), y: m.j + rnd(-20, 10), vx: rnd(-6, 6), vy: rnd(20, 50), drag: .99, ay: 120, max: rnd(.5, .8), r: rnd(1.5, 2.8), grow: 0, kind: 'drop', col: '#b060f0', a: 1, add: false }); if (Math.random() < .4) spawn({ x: m.i + rnd(-16, 16), y: m.feet - 4, vx: 0, vy: -rnd(10, 30), drag: .98, max: rnd(.4, .7), r: rnd(2, 4), grow: .6, kind: 'ring', col: '#d8a0ff', lw: .9, a: .9, add: true }); }); },
    calmMind: S => { pulse(S, '#9fd8ff', 4, 220, 1.6); for (let k = 0; k < N(20); k++) setTimeoutGame(rnd(0, 800), () => { const m = live(S), a = rnd(0, T); spawn({ x: m.i + Math.cos(a) * 26, y: m.j + Math.sin(a) * 14, vx: -Math.cos(a) * 15, vy: -rnd(15, 35), drag: .98, max: rnd(.7, 1.1), r: rnd(2, 4), grow: .3, img: hueTex(210, 80, 72), a: .9, add: true }); }); },
    agility: S => { for (let k = 0; k < N(40); k++) setTimeoutGame(rnd(0, 700), () => { const m = live(S), a = rnd(0, T); spawn({ x: m.i + Math.cos(a) * 28, y: m.j + Math.sin(a) * 18, vx: -Math.sin(a) * 260, vy: Math.cos(a) * 160, drag: .9, max: .2, r: 1, len: 16, lw: 1.6, kind: 'streak', col: Math.random() < .5 ? '#ffffff' : '#bfe0ff', a: 1, add: true }); }); rise(S, 210, 14, 70); },
    amnesia: S => { for (let k = 0; k < 3; k++) setTimeoutGame(k * 220, () => { const m = live(S), dx = (k - 1) * 14; fn(0, 0, .9, (c, q) => { const mm = live(S); c.globalAlpha = q < .2 ? q * 5 : q > .7 ? (1 - q) / .3 : 1; c.fillStyle = '#ffb0e0'; c.strokeStyle = '#7a1a68'; c.lineWidth = 2; c.font = '900 20px sans-serif'; c.textAlign = 'center'; c.strokeText('?', mm.i + dx, mm.j - 30 - q * 22); c.fillText('?', mm.i + dx, mm.j - 30 - q * 22); }); }); fn(0, 0, 1, (c, q) => { const m = live(S); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,150,220,${(1 - q) * .8})`; c.lineWidth = 1.6; c.beginPath(); for (let t = 0; t < 22; t += .3) { const r = t * 1.3, a = t + q * 8; c.lineTo(m.i + Math.cos(a) * r, m.j - 34 + Math.sin(a) * r * .5); } c.stroke(); c.restore(); }); },
    dragonDance: S => { for (let k = 0; k < N(70); k++) setTimeoutGame(k * 12, () => { const m = live(S), a = k * .45, side2 = k % 2; spawn({ x: m.i + Math.cos(a) * 22 * (side2 ? 1 : -1), y: m.feet - k * .7, vx: -Math.sin(a) * 40, vy: -rnd(70, 110), drag: .96, ay: -30, max: rnd(.4, .6), r: rnd(4, 8), grow: .6, img: side2 ? fireTex(rnd(10, 30) | 0) : hueTex(rnd(205, 235) | 0, 95, 62), a: 1, add: true }); }); pulse(S, '#c8b8ff', 2, 300, 2); },
    ironDefense: S => { fn(0, 0, 1.1, (c, q) => { const m = live(S), grow = Math.min(1, q / .35), fade = q > .8 ? (1 - q) / .2 : 1; c.save(); for (let ring = -1; ring <= 1; ring++) for (let k = 0; k < 6; k++) { const a = k * T / 6 + ring * .5 + q, x = m.i + Math.cos(a) * 26 * grow, y = m.j + ring * 16 * grow + Math.sin(a) * 6, front = Math.sin(a) > -.2;
      c.globalAlpha = fade * (front ? .85 : .35); c.fillStyle = front ? '#d8e2ee' : '#8896a8'; c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); for (let s = 0; s < 6; s++) { const b = s * T / 6; s ? c.lineTo(x + Math.cos(b) * 6, y + Math.sin(b) * 6) : c.moveTo(x + Math.cos(b) * 6, y + Math.sin(b) * 6); } c.closePath(); c.fill(); c.stroke(); } c.restore(); });
      setTimeoutGame(450, () => { const m = live(S); HIT.ring && spawn({ x: m.i, y: m.j, vx: 0, vy: 0, drag: 1, max: .3, r: 10, grow: 3, kind: 'ring', col: '#ffffff', lw: 2, a: 1, add: true }); }); },
    rockPolish: S => { for (let k = 0; k < N(20); k++) setTimeoutGame(rnd(0, 700), () => { const m = live(S); spawn({ x: m.i + rnd(-20, 20), y: m.j + rnd(-24, 24), vx: 0, vy: 0, drag: 1, max: rnd(.3, .5), r: rnd(3, 6), grow: .1, kind: 'shard', col: '#fffbe0', rot: rnd(0, T), vr: 6, a: 1, add: true }); }); SELF.agility(S); },
    recover: S => { for (let k = 0; k < N(50); k++) setTimeoutGame(k * 14, () => { const m = live(S), a = k * .5; spawn({ x: m.i + Math.cos(a) * 20, y: m.feet - k * .6, vx: -Math.sin(a) * 30, vy: -rnd(50, 90), drag: .97, max: rnd(.5, .8), r: rnd(3, 6), grow: .4, img: hueTex(rnd(120, 150) | 0, 80, 70), a: 1, add: true }); });
      for (let k = 0; k < N(10); k++) setTimeoutGame(rnd(100, 600), () => { const m = live(S), x0 = m.i + rnd(-20, 20), y0 = m.j + rnd(-6, 16); fn(0, 0, .8, (c, q) => { c.globalAlpha = 1 - q; c.fillStyle = '#9dffb4'; const y = y0 - q * 34; c.fillRect(x0 - 1.5, y - 5, 3, 10); c.fillRect(x0 - 5, y - 1.5, 10, 3); }); });
      fn(0, 0, 1, (c, q) => { const m = live(S); glow(c, m.i, m.j, 34, 'rgba(160,255,190,A)', .5 * Math.sin(q * Math.PI)); }); },
    rest: S => { fn(0, 0, 1.6, (c, q) => { const m = live(S); glow(c, m.i, m.j, 36, 'rgba(140,170,255,A)', .45 * Math.sin(q * Math.PI)); });
      for (let k = 0; k < 3; k++) setTimeoutGame(k * 300, () => fn(0, 0, 1.1, (c, q) => { const m = live(S); c.globalAlpha = q < .15 ? q / .15 : 1 - q; c.fillStyle = '#e8f0ff'; c.strokeStyle = '#2a3a8a'; c.lineWidth = 2; c.font = `900 ${12 + k * 4}px sans-serif`; c.strokeText('Z', m.i + 14 + q * 16 + k * 6, m.j - 26 - q * 26 - k * 6); c.fillText('Z', m.i + 14 + q * 16 + k * 6, m.j - 26 - q * 26 - k * 6); }));
      SELF.recover(S); },
    splash: S => { for (let k = 0; k < 3; k++) setTimeoutGame(k * 180, () => { const m = live(S); for (let s = 0; s < N(14); s++) { const a = rnd(Math.PI * 1.1, Math.PI * 1.9); spawn({ x: m.i + rnd(-10, 10), y: m.feet, vx: Math.cos(a) * rnd(30, 100), vy: Math.sin(a) * rnd(100, 200), drag: .98, ay: 420, max: rnd(.5, .8), r: rnd(1.4, 2.6), grow: 0, kind: 'drop', col: s % 2 ? '#ffffff' : '#7fd0ff', a: 1, add: true }); }
      spawn({ x: m.i, y: m.feet, vx: 0, vy: 0, drag: 1, max: .5, r: 6, grow: 4, kind: 'ring', col: '#bfe8ff', lw: 1.6, squash: .35, a: .9, add: true }); }); }
  };

  /* ---------- status projectiles ---------- */
  const SH = {
    wisp: p => { const s = at(p); for (let n = due(p, 130); n > 0; n--) spawn({ x: s.i + rnd(-3, 3), y: s.j + rnd(-3, 3), vx: -s.ca * rnd(10, 40) + rnd(-10, 10), vy: -rnd(20, 50), drag: .95, ay: -40, max: rnd(.35, .6), r: rnd(3, 7), grow: .6, img: hueTex(rnd(225, 265) | 0, 95, 62), a: 1, add: true });
      const c = C(); glow(c, s.i, s.j + Math.sin(clock.t / 90) * 2, 12, 'rgba(170,190,255,A)', 1); },
    twave: p => { const s = at(p), c = C(); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(255,232,74,${.8 - k * .2})`; c.lineWidth = 1.4; c.beginPath(); for (let a = 0; a <= T + .01; a += T / 14) { const r = 6 + k * 4 + Math.random() * 2; a ? c.lineTo(s.i + Math.cos(a) * r, s.j + Math.sin(a) * r * .8) : c.moveTo(s.i + r, s.j); } c.stroke(); } c.restore();
      for (let n = due(p, 60); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-80, 80), vy: rnd(-80, 80), drag: .88, max: .2, r: rnd(1.5, 3), grow: .2, img: colTex('#fff080', 1), a: 1, add: true }); },
    toxic: p => { const s = at(p); for (let n = due(p, 60); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-10, 10), vy: rnd(10, 40), drag: .98, ay: 200, max: rnd(.4, .7), r: rnd(1.4, 2.4), grow: 0, kind: 'drop', col: '#7a2ab0', a: 1, add: false });
      const c = C(), g = c.createRadialGradient(s.i - 3, s.j - 3, 1, s.i, s.j, 9); g.addColorStop(0, '#e8b8ff'); g.addColorStop(.5, '#6a1aa0'); g.addColorStop(1, '#3a0a60'); c.save(); c.fillStyle = g; c.beginPath(); c.arc(s.i, s.j, 9, 0, T); c.fill(); c.restore(); glow(c, s.i, s.j, 14, 'rgba(180,90,255,A)', .5); },
    hypno: p => { const s = at(p), c = C(); c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const r = ((clock.t / 40 + k * 5) % 20) + 2; c.strokeStyle = `rgba(255,160,230,${1 - r / 22})`; c.lineWidth = 1.6; c.beginPath(); c.arc(s.i, s.j, r, 0, T); c.stroke(); } c.restore(); },
    string: p => { const s = at(p), c = C(), o = p._o || (p._o = { x: bx(side(p.owner).x + side(p.owner).face * 16), y: by(side(p.owner).y - 30) }); c.save(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(o.x, o.y); c.quadraticCurveTo((o.x + s.i) / 2, (o.y + s.j) / 2 + k * 8, s.i + k * 2, s.j + k * 2); c.stroke(); } c.restore(); },
    confuse: p => { const s = at(p), c = C(), f = .6 + .4 * Math.sin(clock.t / 30); glow(c, s.i, s.j, 14, `rgba(255,${200 + Math.sin(clock.t / 50) * 55 | 0},120,A)`, f);
      for (let n = due(p, 60); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-30, 30), vy: rnd(-30, 30), drag: .92, max: .35, r: rnd(2, 4), grow: .2, img: hueTex(rnd(0, 360) | 0, 90, 70), a: 1, add: true }); },
    charm: p => { const s = at(p); for (let n = due(p, 30); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-20, 20), vy: -rnd(10, 40), drag: .96, max: .6, r: 1, kind: 'fn', a: 1, draw: heartDraw(rnd(3, 5)) });
      heartDraw(8)(C(), 0, { x: s.i, y: s.j }, 1); },
    gigaDrain: p => { const s = at(p); for (let n = due(p, 120); n > 0; n--) spawn({ x: s.i + rnd(-4, 4), y: s.j + rnd(-4, 4), vx: -s.ca * rnd(10, 30), vy: -s.sa * rnd(10, 30), drag: .95, max: rnd(.3, .5), r: rnd(3, 5), grow: .5, img: hueTex(rnd(95, 130) | 0, 85, 60), a: .9, add: true });
      glow(C(), s.i, s.j, 14, 'rgba(170,255,120,A)', 1); },
    leech: p => { const s = at(p); glow(C(), s.i, s.j, 10, 'rgba(255,120,120,A)', .9); for (let n = due(p, 50); n > 0; n--) spawn({ x: s.i, y: s.j, vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .93, max: .3, r: rnd(2, 3), grow: .3, img: hueTex(355, 85, 60), a: .9, add: true }); }
  };
  function heartDraw(sz) { return (c, q, p, op = 1) => { c.globalAlpha = op; c.save(); c.translate(p.x, p.y); c.fillStyle = '#ff6ac0'; c.beginPath(); c.moveTo(0, sz * .9); c.bezierCurveTo(-sz * 1.4, -sz * .2, -sz * .6, -sz * 1.2, 0, -sz * .4); c.bezierCurveTo(sz * .6, -sz * 1.2, sz * 1.4, -sz * .2, 0, sz * .9); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(-sz * .45, -sz * .35, sz * .22, 0, T); c.fill(); c.restore(); }; }

  /* ---------- status impacts ---------- */
  const ON = {
    wisp: S => { for (let k = 0; k < N(40); k++) setTimeoutGame(rnd(0, 500), () => { const h = hitAt(S); spawn({ x: h.i + rnd(-16, 16), y: h.j + rnd(-6, 18), vx: rnd(-10, 10), vy: -rnd(40, 90), drag: .95, ay: -40, max: rnd(.4, .7), r: rnd(4, 8), grow: .6, img: hueTex(rnd(220, 270) | 0, 95, 62), a: 1, add: true }); }); },
    cage: S => fn(0, 0, .8, (c, q) => { const h = hitAt(S); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,232,74,${1 - q})`; c.lineWidth = 1.4; for (let k = 0; k < 6; k++) { const a = k * T / 6 + q * 2; c.beginPath(); c.moveTo(h.i + Math.cos(a) * 22, h.j - 26); for (let s = 1; s <= 5; s++) c.lineTo(h.i + Math.cos(a) * 22 + rnd(-3, 3), h.j - 26 + s * 11); c.stroke(); } c.restore(); }),
    bubbles: S => { for (let k = 0; k < N(22); k++) setTimeoutGame(rnd(0, 600), () => { const h = hitAt(S); spawn({ x: h.i + rnd(-16, 16), y: h.j + rnd(0, 18), vx: rnd(-6, 6), vy: -rnd(20, 50), drag: .98, max: rnd(.5, .9), r: rnd(2, 4.5), grow: .5, kind: 'ring', col: '#c070ff', lw: 1.1, a: 1, add: true }); }); },
    spiral: S => fn(0, 0, 1, (c, q) => { const h = hitAt(S); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,150,230,${(1 - q) * .9})`; c.lineWidth = 1.8; c.beginPath(); for (let t = 0; t < 26; t += .3) { const r = t * 1.2, a = t - q * 14; c.lineTo(h.i + Math.cos(a) * r, h.j - 6 + Math.sin(a) * r * .6); } c.stroke(); c.restore(); }),
    web: S => fn(0, 0, 1.4, (c, q) => { const h = hitAt(S), grow = Math.min(1, q / .25), fade = q > .7 ? (1 - q) / .3 : 1, R = 28 * grow; c.save(); c.globalAlpha = fade; c.strokeStyle = '#ffffff'; c.lineWidth = 1;
      for (let k = 0; k < 8; k++) { const a = k * T / 8; c.beginPath(); c.moveTo(h.i, h.j); c.lineTo(h.i + Math.cos(a) * R, h.j + Math.sin(a) * R * .8); c.stroke(); }
      for (let r = 1; r <= 3; r++) { c.beginPath(); for (let k = 0; k <= 8; k++) { const a = k * T / 8, rr = R * r / 3; k ? c.lineTo(h.i + Math.cos(a) * rr, h.j + Math.sin(a) * rr * .8) : c.moveTo(h.i + rr, h.j); } c.stroke(); } c.restore(); }),
    dizzy: S => fn(0, 0, 1.4, (c, q) => { const h = hitAt(S), fade = q > .75 ? (1 - q) / .25 : 1; for (let k = 0; k < 4; k++) { const a = q * 10 + k * T / 4, x = h.i + Math.cos(a) * 18, y = h.j - 30 + Math.sin(a) * 5; c.save(); c.globalAlpha = fade; c.translate(x, y); c.rotate(q * 6); c.fillStyle = '#ffe24a'; c.beginPath(); for (let s = 0; s < 10; s++) { const r = s % 2 ? 2 : 5, an = -Math.PI / 2 + s * Math.PI / 5; s ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(Math.cos(an) * r, Math.sin(an) * r); } c.closePath(); c.fill(); c.restore(); } }),
    hearts: S => { const h = hitAt(S); for (let k = 0; k < N(12); k++) { const a = rnd(0, T), v = rnd(50, 120); spawn({ x: h.i, y: h.j, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, drag: .94, ay: 60, max: rnd(.6, 1), r: 1, kind: 'fn', a: 1, draw: heartDraw(rnd(4, 6)) }); } },
    // draining: glowing motes stream from the target back to the user
    drain: (S, hue, n = 24) => { const tg = S, user = S === 'A' ? 'B' : 'A';
      for (let k = 0; k < N(n); k++) setTimeoutGame(k * 25, () => { const h0 = hitAt(tg), off = { x: rnd(-14, 14), y: rnd(-14, 14) }, bend = rnd(-40, 40);
        fn(0, 0, .6, (c, q) => { const u = self(user), x0 = h0.i + off.x, y0 = h0.j + off.y, mx = (x0 + u.i) / 2, my = (y0 + u.j) / 2 + bend, e = q * q, u1 = 1 - e;
          const x = u1 * u1 * x0 + 2 * u1 * e * mx + e * e * u.i, y = u1 * u1 * y0 + 2 * u1 * e * my + e * e * u.j; glow(c, x, y, 6, `hsla(${hue},90%,65%,A)`, 1 - q * .4); }); });
      setTimeoutGame(600, () => { const u = self(user); fn(0, 0, .5, (c, q) => glow(c, u.i, u.j, 30, `hsla(${hue},90%,70%,A)`, .5 * (1 - q))); }); }
  };

  /* ---------- psychic marks ---------- */
  const MARK = {
    confusion: (mk, q) => { const x = bx(mk.x), y = by(mk.y) - 20, c = C(); glow(c, x, y, 34 * (.6 + q * .4), 'rgba(255,130,215,A)', .3 + q * .25);
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const r = ((q * 2 + k / 4) % 1) * 42; c.strokeStyle = `rgba(255,140,215,${(1 - r / 42)})`; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, r, r * .6, 0, 0, T); c.stroke(); } c.restore();
      if (Math.random() < .35 * QMUL()) spawn({ x: x + rnd(-24, 24), y: y + rnd(-14, 14), vx: 0, vy: -rnd(20, 45), drag: .96, max: .45, r: rnd(2, 4), grow: .3, img: hueTex(rnd(295, 325) | 0, 90, 70), a: 1, add: true }); },
    psychic: (mk, q) => { const x = bx(mk.x), y = by(mk.y) - 20, c = C(); glow(c, x, y, 50 * (.6 + q * .4), 'rgba(255,120,210,A)', .35 + q * .3);
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const r = ((q * 2.5 + k / 6) % 1) * 56, wob = Math.sin(clock.t / 40 + k) * 3; c.strokeStyle = `rgba(${k % 2 ? 200 : 255},${k % 2 ? 140 : 160},255,${(1 - r / 56) * .9})`; c.lineWidth = 2.4; c.beginPath(); c.ellipse(x, y, r + wob, (r + wob) * .62, 0, 0, T); c.stroke(); } c.restore();
      if (Math.random() < .5 * QMUL()) spawn({ x: x + rnd(-30, 30), y: y + rnd(-20, 20), vx: 0, vy: -rnd(20, 50), drag: .96, max: .5, r: rnd(2.5, 4.5), grow: .3, img: hueTex(rnd(290, 325) | 0, 90, 68), a: 1, add: true }); },
    nightShade: (mk, q) => { const x = bx(mk.x), y = by(mk.y), c = C();
      c.save(); c.globalAlpha = .35 + q * .4; const g = c.createRadialGradient(x, y - 24, 2, x, y - 24, 44); g.addColorStop(0, 'rgba(10,0,20,.95)'); g.addColorStop(1, 'rgba(30,10,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 24, 44, 0, T); c.fill(); c.restore();
      for (let n = due(mk, 90); n > 0; n--) { const a = rnd(0, T); spawn({ x: x + Math.cos(a) * 50, y: y - 24 + Math.sin(a) * 30, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 60, drag: .95, max: .5, r: rnd(5, 9), grow: .2, img: smokeTex(), a: .8, add: false }); }
      if (q > .85 && !mk._b) { mk._b = 1; for (let k = 0; k < N(30); k++) { const a = rnd(0, T); spawn({ x, y: y - 24, vx: Math.cos(a) * rnd(60, 200), vy: Math.sin(a) * rnd(60, 200), drag: .92, max: rnd(.3, .6), r: rnd(4, 8), grow: .5, img: hueTex(rnd(260, 290) | 0, 80, 55), a: 1, add: true }); } } }
  };

  /* ---------- register ---------- */
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.shot) o.shot = p => { const c = bctx, i = bx(p.x), j = by(p.y), K = 1.4; c.save(); c.translate(i, j); c.scale(K, K); c.translate(-i, -j); try { r.shot(p); } finally { c.restore(); } };
    if (r.markDraw) o.markDraw = r.markDraw;
    for (const k of ['impact', 'exec']) if (r[k]) { const prev = old[k]; o[k] = (...a) => { if (prev) try { prev(...a); } catch (e) { console.error(e); } try { r[k](...a); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  reg('Swords Dance', { exec: SELF.swordsDance }); reg('Harden', { exec: SELF.harden }); reg('Bulk Up', { exec: SELF.bulkUp }); reg('Acid Armor', { exec: SELF.acidArmor });
  reg('Calm Mind', { exec: SELF.calmMind }); reg('Agility', { exec: SELF.agility }); reg('Amnesia', { exec: SELF.amnesia }); reg('Dragon Dance', { exec: SELF.dragonDance });
  reg('Iron Defense', { exec: SELF.ironDefense }); reg('Rock Polish', { exec: SELF.rockPolish }); reg('Recover', { exec: SELF.recover }); reg('Rest', { exec: SELF.rest }); reg('Splash', { exec: SELF.splash });
  reg('Will-O-Wisp', { shot: SH.wisp, impact: ON.wisp }); reg('Thunder Wave', { shot: SH.twave, impact: S => { ON.cage(S); HIT.spark(S, '#ffe84a', 18); } });
  reg('Toxic', { shot: SH.toxic, impact: S => { ON.bubbles(S); HIT.goo(S, '#7a2ab0', 14); } }); reg('Hypnosis', { shot: SH.hypno, impact: ON.spiral });
  reg('String Shot', { shot: SH.string, impact: ON.web }); reg('Confuse Ray', { shot: SH.confuse, impact: ON.dizzy }); reg('Charm', { shot: SH.charm, impact: ON.hearts });
  reg('Confusion', { markDraw: MARK.confusion, impact: S => { HIT.ring(S, '#ff9ae0', 3); } });
  reg('Psychic', { markDraw: MARK.psychic, impact: S => { HIT.ring(S, '#ff9ae0', 3); HIT.spark(S, '#ff9ae0', 24); } });
  reg('Night Shade', { markDraw: MARK.nightShade, impact: S => HIT.smoke(S, 14) });
  reg('Giga Drain', { shot: SH.gigaDrain, impact: S => { HIT.spark(S, '#a8f070', 20); ON.drain(S, 110, 26); } });
  reg('Leech Life', { shot: SH.leech, impact: S => { P3.jaws(S, '#ffd0d0', .6); ON.drain(S, 355, 16); } });
  window.PFX5 = { SELF, SH, ON, MARK };
})();
