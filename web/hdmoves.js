/* =====================================================================
   Section 22: cinematic move animations (full-resolution)
   Bigger, smoother and more distinct than the old pixel versions. Each one is built around what
   the move is in the games and the anime:
     Flamethrower  a roaring cone of flame that cools from white-hot to smoke
     Fire Blast    a fireball that bursts into the five-pointed "大" (dai) blaze
     Hydro Pump    a thick twisting jet with foam and mist
     Ice Beam      a freezing beam that grows ice crystals along its path
     Hyper Beam    a wide golden-white beam with pulsing energy rings
     Thunder       the sky darkens and a huge forked bolt strikes the ground
     Shadow Ball   a black sphere trailing shadow tendrils
     Aura Sphere   a blue sphere of focused aura with orbiting rings
     Psychic       rippling psychic force with the target lifted in a glow
     Earthquake    the ground heaves in rolling shock rings with flying rubble
     …and many more (see the table at the bottom). Moves that are not listed keep their old
     animation, now drawn smoothly, and get a bigger glowing orb and a type-coloured hit flash.
   ===================================================================== */
(function hdMoves() {
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a), lp = (a, b, t) => a + (b - a) * t;
  const PAL = {   // [white-hot, bright, mid, dark, deep]
    fire: ['#ffffff', '#fff3a0', '#ffb02a', '#ff5a14', '#9a1e0a'], blue: ['#ffffff', '#d8f2ff', '#7fc8ff', '#3a86ff', '#1a3a9a'], water: ['#ffffff', '#d8f6ff', '#7fd4ff', '#2f96f0', '#1a56b0'],
    ice: ['#ffffff', '#e4fbff', '#aef0ff', '#5ccfee', '#2a8ab8'], elec: ['#ffffff', '#fffbc0', '#ffe84a', '#ffb300', '#a86a00'], psy: ['#ffffff', '#ffe0f6', '#ff9ae0', '#e050b8', '#7a1a68'],
    ghost: ['#e8dcff', '#b9a4ff', '#7a5ae0', '#3a2a8a', '#140e30'], dragon: ['#ffffff', '#d8d0ff', '#8a78ff', '#4a3ad0', '#1c1470'], grass: ['#f4ffe0', '#c8f58a', '#7fe05a', '#3fb04a', '#1a5a26'],
    poison: ['#f6e6ff', '#d8a0ff', '#a050e0', '#6a2aa8', '#2a1040'], aura: ['#ffffff', '#e8f6ff', '#9fd8ff', '#3f8cff', '#1a2a9a'], fairy: ['#ffffff', '#ffe8f6', '#ffb0e0', '#ff6ac0', '#a02a80'],
    steel: ['#ffffff', '#eef4fa', '#c6d2de', '#8896a8', '#4a566a'], gold: ['#ffffff', '#fffbe0', '#fff07a', '#ffb347', '#d8701a'], rock: ['#f0e4cc', '#c8b48a', '#9a8460', '#6a5840', '#3a3024'],
    bug: ['#ffffff', '#f4ffc0', '#d0f04a', '#86a82a', '#3a5a10']
  };
  const C = () => bctx, S2 = x => Math.sin(x);
  function both(a, b) { return (S, mv, crit, eff) => { try { a(S, mv, crit, eff); } catch (e) { console.error(e); } try { b(S, mv, crit, eff); } catch (e) { console.error(e); } }; }
  const withAdd = fn => { const c = bctx; c.save(); c.globalCompositeOperation = 'lighter'; try { fn(c); } finally { c.restore(); } };
  // round body with a lit upper-left, a rim and a hot core
  function sphere(i, j, r, P, a = 1) {
    const c = C(); if (!(r > 0)) return;
    const g = c.createRadialGradient(i - r * .35, j - r * .35, r * .08, i, j, r); g.addColorStop(0, P[0]); g.addColorStop(.28, P[1]); g.addColorStop(.62, P[2]); g.addColorStop(.9, P[3]); g.addColorStop(1, P[4]);
    c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, T); c.fill(); c.globalAlpha = 1;
  }
  function tongue(i, j, ang, len, w, P, a, t = 0) {   // one flame tongue: wide at the root, curling to a point
    const c = C(), ca = Math.cos(ang), sa = Math.sin(ang), sway = S2(t) * w * .8, tx = i + ca * len - sa * sway, ty = j + sa * len + ca * sway;
    const g = c.createLinearGradient(i, j, tx, ty); g.addColorStop(0, P[0]); g.addColorStop(.25, P[1]); g.addColorStop(.6, P[2]); g.addColorStop(1, P[3] + '00');
    c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.moveTo(i - sa * w, j + ca * w); c.quadraticCurveTo(i + ca * len * .55 - sa * (w * .9 + sway * .5), j + sa * len * .55 + ca * (w * .9 + sway * .5), tx, ty);
    c.quadraticCurveTo(i + ca * len * .55 + sa * (w * .9 - sway * .5), j + sa * len * .55 - ca * (w * .9 - sway * .5), i + sa * w, j - ca * w); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  function star4(i, j, L, col, a, rot = 0) {
    const c = C(), W = L * .16; c.save(); c.translate(i, j); c.rotate(rot); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.moveTo(-L, 0); c.quadraticCurveTo(-W, -W, 0, -L); c.quadraticCurveTo(W, -W, L, 0); c.quadraticCurveTo(W, W, 0, L); c.quadraticCurveTo(-W, W, -L, 0); c.fill(); c.restore(); c.globalAlpha = 1;
  }
  function crescent(i, j, ang, r, th, col, a, sweep = 1.5) {   // curved blade: two arcs
    const c = C(); c.save(); c.translate(i, j); c.rotate(ang); c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, -sweep / 2, sweep / 2); c.arc(-th * .8, 0, r * .98, sweep / 2, -sweep / 2, true); c.closePath(); c.fill(); c.restore(); c.globalAlpha = 1;
  }
  function streaks(i, j, n, r0, r1, col, a, w, seed = 0) {
    const c = C(); c.strokeStyle = col; c.lineWidth = w; c.globalAlpha = a;
    for (let k = 0; k < n; k++) { const an = k / n * T + seed + (k % 2) * .13, l0 = r0 * (1 + (k % 3) * .12), l1 = r1 * (.65 + (k * 7 % 5) / 8); c.beginPath(); c.moveTo(i + Math.cos(an) * l0, j + Math.sin(an) * l0 * .85); c.lineTo(i + Math.cos(an) * l1, j + Math.sin(an) * l1 * .85); c.stroke(); } c.globalAlpha = 1;
  }
  const shock = (i, j, r, col, a, w) => hiRing(i, j, r, r * .62, col, a, w);
  const HK = 1.5;   // effects are drawn bigger than the old pixel versions so they read at the default zoom
  // an entity drawn at the target, scaled up around the target's centre
  const entAt = (h, ms, fn) => ent(ms, (q, a) => { const c = C(); c.save(); c.translate(h.i, h.j); c.scale(HK, HK); c.translate(-h.i, -h.j); try { fn(q, a); } finally { c.restore(); } });
  const bigShot = fn => p => { const c = C(), i = bx(p.x), j = by(p.y); c.save(); c.translate(i, j); c.scale(HK, HK); c.translate(-i, -j); try { fn(p); } finally { c.restore(); } };
  const tgt = (S) => { const h = headOf(S); return { x: h.x, y: h.y + 10, i: bx(h.x), j: by(h.y + 10) }; };
  const src = (b) => ({ i: bx(b.x), j: by(b.y) });
  const L = (b, max = 260) => Math.min(b.cl ? Math.max(1, b.clip) / 2 : max, 450 * Math.min(1, (b.t / b.life) / .18));   // visible beam length in art px

  /* ---------- beams ---------- */
  const BEAMS = {
    // a roaring cone of fire: soft white-hot core, orange body, red-black licks, smoke at the tip
    flame(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 250), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t / 60, P = PAL.fire;
      for (let k = 25; k >= 0; k--) { const f = k / 25, d = f * len, w = 5 + f * 21 * (b.w / 18 * .9 + .2), off = S2(d * .09 - t * 1.4 + k) * (1.5 + f * 5), x = s.i + ca * d - sa * off, y = s.j + sa * d + ca * off;
        hiSoft(x, y, w * 1.5, f > .7 ? P[4] : P[3], (.62 - f * .2) * fade, .45); hiSoft(x, y, w * 1.0, f > .5 ? P[3] : P[2], (.7 - f * .25) * fade, .4); if (f < .6) hiSoft(x, y, w * .6, P[1], (.75 - f * .5) * fade, .4); }
      withAdd(c => { for (let k = 0; k < 10; k++) { const f = k / 9, d = f * len * .55, off = S2(d * .09 - t * 1.4 + k) * (1 + f * 3); hiSoft(s.i + ca * d - sa * off, s.j + sa * d + ca * off, 3 + f * 5, P[0], .5 * (1 - f) * fade, .3); } });
      for (let k = 0; k < 14; k++) { const f = k / 13, d = len * (.08 + f * .9), off = S2(t * 1.7 + k * 1.9) * (3 + f * 7), x = s.i + ca * d - sa * off, y = s.j + sa * d + ca * off; tongue(x, y, b.ang + S2(t + k) * .35, 7 + f * 13, 2 + f * 5, P, (.85 - f * .4) * fade, t + k); }
      hiGlow(s.i, s.j, 10, P[1], .8 * fade); hiDot(s.i, s.j, 3, '#ffffff', .95 * fade);
      if (q < .8) { const e = beamEnd(b, len * 2); emit(e.x, e.y, 2, { speed: [40, 150], ang: b.ang, spread: 1.4, life: [300, 600], ramp: 'fire', size: [1, 2], size2: 0, add: true, vy: -30 }); if (Math.random() < .35) emit(e.x, e.y, 1, { speed: [10, 40], life: [700, 1200], ramp: 'smoke', shape: 'disc', size: 2, size2: 6, vy: -40 }); }
    },
    // a thick twisting jet with foam
    jet(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 260), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t / 55, w = b.w / 2 * 1.05, c = C();
      const path = (o, amp, ph) => { c.beginPath(); for (let k = 0; k <= 36; k++) { const d = k / 36 * len, off = o + S2(d * .12 - t + ph) * amp; const x = s.i + ca * d - sa * off, y = s.j + sa * d + ca * off; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
      c.lineCap = 'round'; withAdd(() => { c.strokeStyle = PAL.water[3]; c.globalAlpha = .16 * fade; c.lineWidth = w * 3.4; path(0, 0, 0); });
      c.globalAlpha = fade; c.strokeStyle = PAL.water[4]; c.lineWidth = w * 1.5; path(0, 1, 0); c.strokeStyle = PAL.water[3]; c.lineWidth = w * 1.2; path(0, 1.2, 0); c.strokeStyle = PAL.water[2]; c.lineWidth = w * .8; path(0, 1.5, 0);
      c.strokeStyle = PAL.water[1]; c.lineWidth = w * .35; c.globalAlpha = .85 * fade; for (const ph of [0, 3.14]) path(0, w * .55, ph); c.strokeStyle = '#ffffff'; c.lineWidth = w * .18; c.globalAlpha = fade; path(0, 0, 0); c.globalAlpha = 1;
      for (let k = 0; k < 9; k++) { const d = ((t * 9 + k * len / 9) % len), off = S2(d * .12 - t + k) * w * .9; hiDot(s.i + ca * d - sa * off, s.j + sa * d + ca * off, .8 + (k % 3) * .35, '#ffffff', .7 * fade); }
      if (q < .85) { const e = beamEnd(b, len * 2); emit(e.x, e.y, 3, { speed: [60, 200], ang: b.ang, spread: 2.4, g: 380, life: [300, 600], ramp: 'water', shape: 'drop', size: [1, 2] }); if (Math.random() < .5) emit(e.x, e.y, 1, { speed: [10, 40], life: [500, 900], ramp: 'water', shape: 'disc', size: 2, size2: 5, add: true }); }
    },
    // a freezing beam that grows crystals along its length
    crystal(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 260), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t, w = b.w / 2, P = PAL.ice, c = C();
      c.lineCap = 'round'; const line = (wd, col, al) => { c.strokeStyle = col; c.lineWidth = wd; c.globalAlpha = al * fade; c.beginPath(); c.moveTo(s.i, s.j); c.lineTo(s.i + ca * len, s.j + sa * len); c.stroke(); };
      withAdd(() => { line(w * 3.6, P[3], .14); line(w * 2.2, P[2], .22); }); line(w * 1.2, P[3], .9); line(w * .85, P[2], 1); line(w * .45, P[1], 1); line(w * .16, '#ffffff', 1); c.globalAlpha = 1;
      for (let k = 1; k < 12; k++) { const d = k / 12 * len, grow = Math.min(1, (len - d) < 0 ? 0 : (q * 1.8 - d / 450 * 2) * 3); if (grow <= 0) continue; for (const sg of [-1, 1]) { const ang = b.ang + sg * (1.0 + (k % 3) * .22), l = (6 + (k * 5 % 7)) * grow, x = s.i + ca * d, y = s.j + sa * d; c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = .95 * fade; c.fillStyle = P[1]; c.beginPath(); c.moveTo(l, 0); c.lineTo(0, 1.5); c.lineTo(-l * .15, 0); c.lineTo(0, -1.5); c.closePath(); c.fill(); c.fillStyle = P[3]; c.globalAlpha = .6 * fade; c.beginPath(); c.moveTo(l, 0); c.lineTo(0, 1.5); c.lineTo(-l * .15, 0); c.closePath(); c.fill(); c.restore(); } }
      for (let k = 0; k < 5; k++) { const d = ((t / 6 + k * len / 5) % len); star4(s.i + ca * d, s.j + sa * d + S2(t / 90 + k) * 2, 2.6, '#ffffff', .85 * fade, t / 400); }
      hiGlow(s.i, s.j, 9, P[2], .8 * fade); star4(s.i, s.j, 7, '#ffffff', .9 * fade, t / 300);
      if (q < .85) { const e = beamEnd(b, len * 2); emit(e.x, e.y, 2, { speed: [40, 150], life: [400, 800], ramp: 'ice', shape: 'shard', size: [1, 2], spin: 8, g: 160 }); emit(e.x, e.y, 1, { speed: [20, 80], life: [500, 900], ramp: 'ice', shape: 'star', size: 1, add: true }); }
    },
    // wide golden-white beam with pulsing rings
    solar(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 280), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t, w = b.w / 2 * 1.35, P = PAL.gold, c = C();
      c.lineCap = 'round'; const line = (wd, col, al) => { c.strokeStyle = col; c.lineWidth = wd * (1 + S2(t / 28) * .06); c.globalAlpha = al * fade; c.beginPath(); c.moveTo(s.i, s.j); c.lineTo(s.i + ca * len, s.j + sa * len); c.stroke(); };
      withAdd(() => { line(w * 5, P[4], .13); line(w * 3.2, P[3], .22); }); line(w * 1.9, P[3], .9); line(w * 1.45, P[2], 1); line(w * .95, P[1], 1); line(w * .45, '#ffffff', 1); c.globalAlpha = 1;
      for (let k = 0; k < 7; k++) { const d = ((t / 3 + k * len / 7) % len), x = s.i + ca * d, y = s.j + sa * d; c.save(); c.translate(x, y); c.rotate(b.ang); c.strokeStyle = '#ffffff'; c.globalAlpha = .75 * fade * (1 - d / len * .4); c.lineWidth = .9; c.beginPath(); c.ellipse(0, 0, w * .5, w * 1.7, 0, 0, T); c.stroke(); c.restore(); }
      withAdd(() => { hiSoft(s.i, s.j, w * 4.2, P[2], .8 * fade, .25); }); star4(s.i, s.j, w * 1.9, '#ffffff', .85 * fade, t / 200); star4(s.i, s.j, w * 1.3, P[1], .7 * fade, -t / 260);
      for (let k = 0; k < 10; k++) { const d = rnd(0, len), off = rnd(-w * 1.4, w * 1.4); hiDot(s.i + ca * d - sa * off, s.j + sa * d + ca * off, .6, '#ffffff', .6 * fade); }
      if (q < .85) { const e = beamEnd(b, len * 2); emit(e.x, e.y, 4, { speed: [80, 300], life: [300, 600], ramp: 'gold', size: [1, 3], size2: 0, add: true }); }
    },
    // two interleaved waves, pink and blue, with ripples
    wave(b, cols = [PAL.psy, PAL.aura]) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 260), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t / 70, w = b.w / 2, c = C();
      c.lineCap = 'round'; const path = (ph, amp) => { c.beginPath(); for (let k = 0; k <= 40; k++) { const d = k / 40 * len, off = S2(d * .1 - t + ph) * amp * (.35 + .65 * Math.min(1, d / 40)); const x = s.i + ca * d - sa * off, y = s.j + sa * d + ca * off; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
      withAdd(() => { c.strokeStyle = cols[0][3]; c.globalAlpha = .13 * fade; c.lineWidth = w * 4.5; path(0, 0); });
      cols.forEach((P, n) => { withAdd(() => { c.strokeStyle = P[3]; c.globalAlpha = .3 * fade; c.lineWidth = w * 1.9; path(n * 3.14, w * 1.3); }); c.strokeStyle = P[2]; c.globalAlpha = fade; c.lineWidth = w * 1.0; path(n * 3.14, w * 1.3); c.strokeStyle = P[0]; c.lineWidth = w * .35; path(n * 3.14, w * 1.3); });
      c.globalAlpha = 1; for (let k = 0; k < 5; k++) { const d = ((t * 22 + k * len / 5) % len); shock(s.i + ca * d, s.j + sa * d, 3 + S2(k) * 1.5, '#ffffff', .5 * fade, .6); }
      hiGlow(s.i, s.j, 9, cols[0][2], .8 * fade); hiDot(s.i, s.j, 2.8, '#ffffff', .95 * fade);
    },
    // flickering coloured pulses
    pulses(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 260), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t, w = b.w / 2, cs = ['#ffe84a', '#ff7a3a', '#7ae05a', '#b07aff'], c = C();
      c.lineCap = 'round'; withAdd(() => { c.strokeStyle = '#ffffff'; c.globalAlpha = .1 * fade; c.lineWidth = w * 3.6; c.beginPath(); c.moveTo(s.i, s.j); c.lineTo(s.i + ca * len, s.j + sa * len); c.stroke(); });
      for (let k = 0; k < 14; k++) { const d0 = ((t / 2.4 + k * 22) % (len + 20)) - 10, l2 = 11; if (d0 < 0 || d0 > len) continue; const x = s.i + ca * d0, y = s.j + sa * d0, zz = S2(k * 2.3 + t / 60) * w * .9; c.strokeStyle = cs[k % 4]; c.globalAlpha = fade; c.lineWidth = w * 1.1; c.beginPath(); c.moveTo(x - ca * l2 - sa * zz, y - sa * l2 + ca * zz); c.lineTo(x + ca * l2 + sa * zz, y + sa * l2 - ca * zz); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = w * .4; c.stroke(); }
      c.globalAlpha = 1; hiGlow(s.i, s.j, 8, '#ffe84a', .8 * fade); hiDot(s.i, s.j, 2.6, '#ffffff', .95 * fade);
    },
    // silver beam, mirror-bright, with lens glints
    silver(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 270), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t, w = b.w / 2 * 1.1, P = PAL.steel, c = C();
      c.lineCap = 'round'; const line = (wd, col, al) => { c.strokeStyle = col; c.lineWidth = wd; c.globalAlpha = al * fade; c.beginPath(); c.moveTo(s.i, s.j); c.lineTo(s.i + ca * len, s.j + sa * len); c.stroke(); };
      withAdd(() => { line(w * 3.6, '#bcd8ff', .14); line(w * 2.2, '#dce8ff', .25); }); line(w * 1.4, P[3], 1); line(w * 1.1, P[2], 1); line(w * .7, P[1], 1); line(w * .3, '#ffffff', 1); c.globalAlpha = 1;
      for (let k = 0; k < 6; k++) { const d = ((t / 3.4 + k * len / 6) % len); star4(s.i + ca * d, s.j + sa * d, 3 + (k % 2) * 2, '#ffffff', .8 * fade, k); }
      withAdd(() => hiSoft(s.i, s.j, w * 3.8, '#dce8ff', .8 * fade, .25)); star4(s.i, s.j, w * 3.6, '#ffffff', .95 * fade, 0); star4(s.i, s.j, w * 2.4, '#ffffff', .8 * fade, .785);
    },
    // swirling green-violet breath
    dragon(b) {
      const q = b.t / b.life, fade = q > .7 ? (1 - q) / .3 : 1, len = L(b, 250), s = src(b), ca = Math.cos(b.ang), sa = Math.sin(b.ang), t = clock.t / 55, P = PAL.dragon;
      withAdd(() => { for (let k = 0; k < 24; k++) { const f = k / 23, d = f * len, w = 3 + f * 10, off = S2(d * .1 - t * 1.3 + k) * (1 + f * 4), x = s.i + ca * d - sa * off, y = s.j + sa * d + ca * off; hiSoft(x, y, w * 1.3, f < .2 ? P[1] : f < .55 ? P[2] : P[3], (.45 - f * .2) * fade, .25); } });
      for (const ph of [0, 3.14]) { const c = C(); c.strokeStyle = '#d8ffe8'; c.globalAlpha = .75 * fade; c.lineWidth = .8; c.beginPath(); for (let k = 0; k <= 30; k++) { const d = k / 30 * len, off = S2(d * .16 - t * 1.6 + ph) * (2 + d * .035); const x = s.i + ca * d - sa * off, y = s.j + sa * d + ca * off; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.globalAlpha = 1; }
      hiGlow(s.i, s.j, 9, P[2], .8 * fade); hiDot(s.i, s.j, 2.8, '#ffffff', .95 * fade);
      if (q < .85) { const e = beamEnd(b, len * 2); emit(e.x, e.y, 3, { speed: [40, 170], ang: b.ang, spread: 1.6, life: [300, 600], ramp: 'dragon', size: [1, 2], size2: 0, add: true }); }
    }
  };

  /* ---------- projectiles ---------- */
  const trail = (p, ramp, n = 2, shape = 'sq', size = [1, 2]) => emit(p.x, p.y, n, { r: 3, speed: [10, 50], vx: -p.vx * .12, vy: -p.vy * .12, life: [220, 460], ramp, shape, size, size2: 0, add: true });
  const SHOTS = {
    fireball: (r = 8) => p => {
      const i = bx(p.x), j = by(p.y), a = Math.atan2(p.vy, p.vx), t = clock.t / 45, P = PAL.fire;
      withAdd(() => hiSoft(i, j, r * 3.2, P[3], .55, .2));
      for (let k = 0; k < 5; k++) tongue(i, j, a + Math.PI + (k - 2) * .38 + S2(t + k * 2) * .2, r * (1.9 + (k % 2) * .8), r * .62, P, .9, t + k);
      sphere(i, j, r, P); hiDot(i - r * .25, j - r * .3, r * .32, '#ffffff', .9); trail(p, 'fire', 3, 'sq', [1, 3]);
      if (Math.random() < .3) emit(p.x, p.y, 1, { speed: [10, 30], life: [600, 1000], ramp: 'smoke', shape: 'disc', size: 2, size2: 5, vy: -20 });
    },
    // a black sphere with curling shadow tendrils
    shadow: (r = 8) => p => {
      const i = bx(p.x), j = by(p.y), t = clock.t / 140, P = PAL.ghost, c = C();
      withAdd(() => hiSoft(i, j, r * 3.4, P[2], .45, .2)); c.lineCap = 'round';
      for (let k = 0; k < 6; k++) { const a0 = t + k * T / 6, pts = []; for (let q = 0; q <= 8; q++) { const f = q / 8, a = a0 + f * 1.6, rr = r * (.9 + f * 1.6); pts.push([i + Math.cos(a) * rr, j + Math.sin(a) * rr]); } c.strokeStyle = P[k % 2 ? 2 : 1]; c.globalAlpha = .75; c.lineWidth = 1.5; c.beginPath(); pts.forEach((q, n) => n ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); } c.globalAlpha = 1;
      const g = c.createRadialGradient(i - r * .3, j - r * .3, r * .1, i, j, r); g.addColorStop(0, '#6a4ad8'); g.addColorStop(.45, '#2d2068'); g.addColorStop(1, '#0a0618'); c.fillStyle = g; c.beginPath(); c.arc(i, j, r, 0, T); c.fill();
      c.strokeStyle = P[1]; c.globalAlpha = .6; c.lineWidth = .7; c.beginPath(); c.arc(i, j, r * .96, 3.4, 5.2); c.stroke(); c.globalAlpha = 1;
      emit(p.x, p.y, 2, { r: 5, speed: [10, 50], vy: -30, life: [300, 600], ramp: 'ghost', shape: 'disc', size: 2, size2: 4, add: true });
    },
    // focused aura: bright blue-white sphere, orbiting rings, a trailing glow
    aura: (r = 8) => p => {
      const i = bx(p.x), j = by(p.y), t = clock.t / 90, P = PAL.aura, c = C(), a = Math.atan2(p.vy, p.vx);
      withAdd(() => { hiSoft(i, j, r * 3.6, P[3], .5, .2); hiSoft(i - Math.cos(a) * r * 1.4, j - Math.sin(a) * r * 1.4, r * 2.2, P[2], .35, .2); });
      sphere(i, j, r, P); for (let k = 0; k < 3; k++) { c.save(); c.translate(i, j); c.rotate(t * (k % 2 ? -1 : 1) + k); c.strokeStyle = P[1]; c.globalAlpha = .8; c.lineWidth = .7; c.beginPath(); c.ellipse(0, 0, r * 1.5, r * .5, 0, 0, T); c.stroke(); c.restore(); }
      c.globalAlpha = 1; hiDot(i - r * .25, j - r * .3, r * .28, '#ffffff', .95); trail(p, 'water', 2, 'star', [1, 1]);
    },
    energy: (r = 7) => p => {
      const i = bx(p.x), j = by(p.y), t = clock.t / 80, P = PAL.grass, c = C();
      withAdd(() => hiSoft(i, j, r * 3.2, P[2], .45, .2)); sphere(i, j, r, P);
      c.strokeStyle = P[0]; c.globalAlpha = .75; c.lineWidth = .8; c.beginPath(); for (let k = 0; k < 24; k++) { const f = k / 23, a = t + f * 9, rr = r * f * .95; k ? c.lineTo(i + Math.cos(a) * rr, j + Math.sin(a) * rr) : c.moveTo(i, j); } c.stroke(); c.globalAlpha = 1;
      emit(p.x, p.y, 1, { r: 5, speed: [20, 60], life: [400, 700], ramp: 'grass', shape: 'leaf', size: 1, spin: 6, vx: -p.vx * .1 });
    },
    sludge: (r = 8) => p => {
      const i = bx(p.x), j = by(p.y), t = clock.t / 100, P = PAL.poison, c = C(); withAdd(() => hiSoft(i, j, r * 2.8, P[2], .35, .2));
      c.fillStyle = P[3]; c.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * T, rr = r * (1 + S2(a * 3 + t) * .12 + S2(a * 5 - t * 1.3) * .07); k ? c.lineTo(i + Math.cos(a) * rr, j + Math.sin(a) * rr) : c.moveTo(i + rr, j); } c.closePath(); c.fill();
      sphere(i - r * .05, j - r * .05, r * .82, [P[0], P[1], P[2], P[3], P[4]], .85); for (let k = 0; k < 3; k++) { const a = t * 1.3 + k * 2.1, rr = r * .45; c.strokeStyle = P[0]; c.globalAlpha = .7; c.lineWidth = .5; c.beginPath(); c.arc(i + Math.cos(a) * rr, j + Math.sin(a) * rr, 1 + k * .4, 0, T); c.stroke(); } c.globalAlpha = 1;
      if (Math.random() < .7) emit(p.x, p.y + r * .6, 1, { speed: [5, 25], vy: 40, g: 400, life: [300, 500], ramp: 'poison', shape: 'drop', size: 1 });
    },
    dragonPulse: (r = 8) => p => {
      const i = bx(p.x), j = by(p.y), t = clock.t / 100, P = PAL.dragon, a = Math.atan2(p.vy, p.vx); withAdd(() => hiSoft(i, j, r * 3.4, P[3], .5, .2));
      for (let k = 0; k < 3; k++) crescent(i, j, a + t * (k % 2 ? -1 : 1) + k * 2.1, r * (1.1 + k * .28), r * .55, k ? P[2] : P[1], .85, 2.2);
      sphere(i, j, r * .72, P); hiDot(i, j, r * .26, '#ffffff', .95); trail(p, 'dragon', 2, 'star', [1, 2]);
    },
    moon: (r = 9) => p => {
      const i = bx(p.x), j = by(p.y), P = PAL.fairy, t = clock.t / 150; withAdd(() => hiSoft(i, j, r * 3.4, P[2], .5, .2));
      const c = C(); c.fillStyle = P[1]; c.beginPath(); c.arc(i, j, r, 0, T); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(i + r * .45, j - r * .12, r * .88, 0, T); c.fill(); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = '#ffffff'; c.globalAlpha = .8; c.lineWidth = .7; c.beginPath(); c.arc(i, j, r * .96, 1.9, 4.4); c.stroke(); c.globalAlpha = 1;
      for (let k = 0; k < 3; k++) star4(i + Math.cos(t + k * 2.1) * r * 1.5, j + Math.sin(t * 1.2 + k * 2.1) * r * 1.1, 2.4, '#ffffff', .85, t); trail(p, 'fairy', 2, 'star', [1, 2]);
    },
    iceShard: () => p => {
      const i = bx(p.x), j = by(p.y), a = Math.atan2(p.vy, p.vx), P = PAL.ice, c = C(); withAdd(() => hiSoft(i, j, 14, P[2], .4, .2));
      c.save(); c.translate(i, j); c.rotate(a); c.fillStyle = P[1]; c.beginPath(); c.moveTo(11, 0); c.lineTo(-2, 3.4); c.lineTo(-6, 0); c.lineTo(-2, -3.4); c.closePath(); c.fill(); c.fillStyle = P[3]; c.beginPath(); c.moveTo(11, 0); c.lineTo(-2, 3.4); c.lineTo(-6, 0); c.closePath(); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .6; c.beginPath(); c.moveTo(10, 0); c.lineTo(-4, 0); c.stroke(); c.restore(); trail(p, 'ice', 1, 'star', [1, 1]);
    },
    razor: () => p => {
      const i = bx(p.x), j = by(p.y), t = clock.t / 55, P = PAL.grass, c = C(); withAdd(() => hiSoft(i, j, 11, P[2], .3, .2));
      for (let k = 0; k < 3; k++) { const a = t + k * 2.09, ox = Math.cos(t * .7 + k) * 4, oy = Math.sin(t * .9 + k * 2) * 3; c.save(); c.translate(i + ox, j + oy); c.rotate(a); c.fillStyle = P[2]; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(0, -3.4, 6, 0); c.quadraticCurveTo(0, 3.4, -6, 0); c.fill(); c.fillStyle = P[0]; c.globalAlpha = .75; c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(0, -1.4, 5.4, -.2); c.lineTo(5, .6); c.quadraticCurveTo(0, 0, -5, 0); c.fill(); c.restore(); }
      c.globalAlpha = 1; trail(p, 'grass', 1, 'leaf', [1, 1]);
    },
    water: (r = 4.5) => p => {
      const i = bx(p.x), j = by(p.y), a = Math.atan2(p.vy, p.vx), P = PAL.water, c = C(); withAdd(() => hiSoft(i, j, r * 3, P[3], .4, .2));
      c.save(); c.translate(i, j); c.rotate(a); c.fillStyle = P[2]; c.beginPath(); c.ellipse(0, 0, r * 2.2, r * .9, 0, 0, T); c.fill(); c.fillStyle = P[1]; c.beginPath(); c.ellipse(r * .3, -r * .15, r * 1.3, r * .4, 0, 0, T); c.fill(); c.restore(); trail(p, 'water', 2, 'drop', [1, 1]);
    },
    swiftStar: () => p => { const i = bx(p.x), j = by(p.y), t = clock.t / 120, P = PAL.gold; withAdd(() => hiSoft(i, j, 13, P[2], .55, .2)); star4(i, j, 7, P[1], .95, t); star4(i, j, 5, '#ffffff', .95, -t); trail(p, 'gold', 2, 'star', [1, 1]); },
    rock: (r = 6) => p => { const i = bx(p.x), j = by(p.y), t = clock.t / 120, c = C(), P = PAL.rock; c.save(); c.translate(i, j); c.rotate(t * 3); const pts = []; for (let k = 0; k < 7; k++) { const a = k / 7 * T, m = .78 + ((k * 37) % 5) / 10; pts.push([Math.cos(a) * r * m, Math.sin(a) * r * m]); } c.fillStyle = P[3]; c.beginPath(); pts.forEach((q, n) => n ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); c.fillStyle = P[1]; c.globalAlpha = .8; c.beginPath(); c.moveTo(pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.lineTo(pts[5][0], pts[5][1]); c.lineTo(pts[6][0], pts[6][1]); c.lineTo(0, 0); c.closePath(); c.fill(); c.restore(); c.globalAlpha = 1; trail(p, 'rock', 1, 'sq', [1, 2]); }
  };

  /* ---------- hits ---------- */
  // the common hit flash: a white-hot core, a coloured disc, a shock ring and radial streaks
  function flashAt(S, P, big = 1, seed = 0) {
    const h = tgt(S); entAt(h, 420, q => { const e = 1 - Math.pow(1 - q, 2.2), c = C(); withAdd(() => { hiSoft(h.i, h.j, (6 + 22 * e) * big, P[2], .85 * (1 - q), .2); hiSoft(h.i, h.j, (3 + 9 * e) * big, '#ffffff', .9 * (1 - q), .2); }); streaks(h.i, h.j, 12, 4 * big, (10 + 26 * e) * big, P[1], .85 * (1 - q), 1.1, seed); shock(h.i, h.j, (4 + 26 * e) * big, P[1], .8 * (1 - q), 1); c.globalAlpha = 1; });
  }
  const HITS = {
    fire(S) { const h = tgt(S); flashAt(S, PAL.fire, 1.1); entAt(h, 800, q => { for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .36, l = (10 + (k % 3) * 6) * (1 - q * .6) * Math.min(1, q * 8); tongue(h.i + (k - 3) * 2.4, h.j + 6, a, l, 3.2, PAL.fire, (1 - q) * .95, clock.t / 60 + k); } }); emit(h.x, h.y + 12, 14, { ang: -Math.PI / 2, spread: 2.2, speed: [40, 190], life: [400, 900], ramp: 'fire', size: [1, 2], size2: 0, g: -30, add: true }); emit(h.x, h.y, 5, { speed: [10, 50], life: [800, 1400], ramp: 'smoke', shape: 'disc', size: 2, size2: 7, vy: -40 }); },
    water(S) { const h = tgt(S); flashAt(S, PAL.water, .9); entAt(h, 600, q => { const c = C(); for (let k = 0; k < 9; k++) { const a = (k / 8 - .5) * 2.6 - Math.PI / 2, v = 30 + (k % 3) * 14, t = q * .6; const x = h.i + Math.cos(a) * v * t * 2.2, y = h.j + Math.sin(a) * v * t * 2.2 + 80 * t * t; hiDot(x, y, 1.1 * (1 - q), PAL.water[1], .9 * (1 - q)); } shock(h.i, h.j + 8, 4 + q * 24, PAL.water[1], (1 - q) * .7, .8); }); emit(h.x, h.y + 10, 20, { ang: -Math.PI / 2, spread: 2.6, speed: [80, 260], g: 520, life: [400, 800], ramp: 'water', shape: 'drop', size: [1, 2] }); },
    elec(S) { const h = tgt(S); flashAt(S, PAL.elec, 1); entAt(h, 380, () => { for (let k = 0; k < 5; k++) { const a = rnd(0, T); zig(h.i, h.j, h.i + Math.cos(a) * rnd(14, 30), h.j + Math.sin(a) * rnd(10, 22), PAL.elec[2], 1.1, 3, '#ffffff'); } }); },
    ice(S) { const h = tgt(S); flashAt(S, PAL.ice, 1); entAt(h, 900, q => { const e = Math.min(1, q * 5), c = C(); for (let k = 0; k < 8; k++) { const a = k / 8 * T, l = (6 + (k % 2) * 7) * e; c.save(); c.translate(h.i + Math.cos(a) * 3, h.j + 4 + Math.sin(a) * 2); c.rotate(a); c.globalAlpha = (1 - q) * .95; c.fillStyle = PAL.ice[1]; c.beginPath(); c.moveTo(l, 0); c.lineTo(0, 1.8); c.lineTo(-1, 0); c.lineTo(0, -1.8); c.closePath(); c.fill(); c.restore(); } c.globalAlpha = 1; }); emit(h.x, h.y + 4, 14, { speed: [60, 200], g: 380, life: [400, 800], ramp: 'ice', shape: 'shard', size: [1, 2], spin: 12 }); },
    ghost(S) { const h = tgt(S); entAt(h, 700, q => { const e = q < .3 ? 1 - q / .3 : 0, c = C(); if (q < .3) { shock(h.i, h.j, 4 + e * 26, PAL.ghost[2], .8 * e, 1.2); } withAdd(() => hiSoft(h.i, h.j, 10 + q * 24, PAL.ghost[2], .55 * (1 - q), .2)); streaks(h.i, h.j, 8, 3, 8 + q * 22, PAL.ghost[1], .6 * (1 - q), 1, q * 3); c.globalAlpha = 1; }); emit(h.x, h.y + 6, 12, { speed: [10, 70], life: [500, 1000], ramp: 'ghost', shape: 'disc', size: 2, size2: 4, vy: -50, add: true }); },
    psy(S) { const h = tgt(S); flashAt(S, PAL.psy, .9); entAt(h, 800, q => { for (let k = 0; k < 3; k++) { const t = (q + k / 3) % 1; shock(h.i, h.j, 3 + t * 30, PAL.psy[1 + k % 2], (1 - t) * (1 - q) * .8, 1); } }); },
    grass(S) { const h = tgt(S); flashAt(S, PAL.grass, .9); emit(h.x, h.y + 4, 16, { speed: [60, 210], life: [500, 900], ramp: 'grass', shape: 'leaf', size: [1, 2], spin: 8, drag: 1.5, g: 60 }); },
    poison(S) { const h = tgt(S); flashAt(S, PAL.poison, .9); entAt(h, 600, q => { const c = C(); for (let k = 0; k < 9; k++) { const a = k / 9 * T, d = 5 + q * 24 * (.6 + (k % 3) * .25); hiDot(h.i + Math.cos(a) * d, h.j + 4 + Math.sin(a) * d * .6 + q * q * 8, 1.4 * (1 - q * .6), PAL.poison[2], (1 - q) * .9); } }); emit(h.x, h.y + 6, 12, { speed: [30, 140], life: [500, 900], ramp: 'poison', shape: 'bubble', size: [1, 3], vy: -30 }); },
    dragon(S) { const h = tgt(S); flashAt(S, PAL.dragon, 1.1); entAt(h, 700, q => { for (let k = 0; k < 2; k++) { const t = Math.min(1, q * 2 - k * .25); if (t > 0) shock(h.i, h.j, 4 + t * 34, PAL.dragon[1 + k], (1 - t) * .85, 1.4); } }); },
    aura(S) { const h = tgt(S); flashAt(S, PAL.aura, 1.2); entAt(h, 700, q => { for (let k = 0; k < 3; k++) { const t = Math.min(1, q * 1.8 - k * .15); if (t > 0) shock(h.i, h.j, 3 + t * 36, PAL.aura[1 + k % 2], (1 - t) * .85, 1.2); } }); },
    fairy(S) { const h = tgt(S); flashAt(S, PAL.fairy, 1); emit(h.x, h.y + 6, 18, { r: 12, speed: [20, 100], life: [500, 1000], ramp: 'fairy', shape: 'star', size: [1, 2], add: true, vy: -30 }); },
    steel(S) { const h = tgt(S); flashAt(S, PAL.steel, 1); emit(h.x, h.y + 6, 14, { speed: [120, 320], g: 300, life: [240, 520], ramp: 'steel', size: [1, 2], size2: 0, add: true }); },
    rock(S) { const h = tgt(S); flashAt(S, PAL.rock, .9); emit(h.x, h.y + 10, 12, { ang: -Math.PI / 2, spread: 2.4, speed: [80, 230], g: 520, life: [500, 900], ramp: 'rock', size: [2, 3] }); },
    gold(S) { const h = tgt(S); flashAt(S, PAL.gold, 1.4); entAt(h, 500, q => { star4(h.i, h.j, 18 * (1 - q * .4), '#ffffff', 1 - q, q * 2); }); },
    bug(S) { const h = tgt(S); flashAt(S, PAL.bug, .9); }
  };
  const TYPE_HIT = { Fire: 'fire', Water: 'water', Electric: 'elec', Ice: 'ice', Ghost: 'ghost', Dark: 'ghost', Psychic: 'psy', Grass: 'grass', Poison: 'poison', Dragon: 'dragon', Fighting: 'aura', Fairy: 'fairy', Steel: 'steel', Rock: 'rock', Ground: 'rock', Normal: 'gold', Flying: 'gold', Bug: 'bug' };

  /* ---------- move table ---------- */
  const hit = k => S => HITS[k](S);
  const defs = {
    'Flamethrower': { beam: BEAMS.flame, impact: S => { HITS.fire(S); } },
    'Hydro Pump': { beam: BEAMS.jet, impact: hit('water') }, 'Water Gun': { shot: SHOTS.water(4.5), impact: hit('water') },
    'Ice Beam': { beam: BEAMS.crystal, impact: hit('ice') }, 'Hyper Beam': { beam: BEAMS.solar, impact: both(hit('gold'), S => { const h = tgt(S); entAt(h, 700, q => { shock(h.i, h.j, 8 + q * 60, '#fff3a0', (1 - q) * .9, 2); }); }) },
    'Psybeam': { beam: b => BEAMS.wave(b, [PAL.psy, PAL.aura]), impact: hit('psy') }, 'Aurora Beam': { beam: b => BEAMS.wave(b, [PAL.aura, PAL.grass]), impact: hit('ice') },
    'Signal Beam': { beam: BEAMS.pulses, impact: hit('bug') }, 'Flash Cannon': { beam: BEAMS.silver, impact: hit('steel') }, 'Dragon Breath': { beam: BEAMS.dragon, impact: hit('dragon') },
    'Ember': { shot: SHOTS.fireball(6), impact: hit('fire') }, 'Fire Blast': { shot: SHOTS.fireball(10), impact: S => { HITS.fire(S); daimonji(S); } },
    'Shadow Ball': { shot: SHOTS.shadow(9), impact: hit('ghost') }, 'Night Shade': { impact: hit('ghost') }, 'Aura Sphere': { shot: SHOTS.aura(9), impact: hit('aura') },
    'Energy Ball': { shot: SHOTS.energy(8), impact: hit('grass') }, 'Razor Leaf': { shot: SHOTS.razor(), impact: hit('grass') }, 'Sludge Bomb': { shot: SHOTS.sludge(9), impact: hit('poison') }, 'Gunk Shot': { shot: SHOTS.sludge(10), impact: hit('poison') },
    'Dragon Pulse': { shot: SHOTS.dragonPulse(9), impact: hit('dragon') }, 'Moonblast': { shot: SHOTS.moon(10), impact: hit('fairy') }, 'Ice Shard': { shot: SHOTS.iceShard(), impact: hit('ice') },
    'Swift': { shot: SHOTS.swiftStar(), impact: hit('gold') }, 'Rock Throw': { shot: SHOTS.rock(6), impact: hit('rock') }, 'Seed Bomb': { impact: hit('grass') }
  };
  // Fire Blast: the fireball bursts into the five-pointed 大 (dai) blaze, as in the anime
  function daimonji(S) {
    const h = tgt(S), P = PAL.fire, s = 1;   // 大: a long bar, one stroke down-left, one down-right
    const strokes = [[-22, -2, 22, -2], [0, -22, 0, -2], [0, -2, -17, 20], [0, -2, 17, 20]];
    entAt(h, 1100, q => { const grow = Math.min(1, q * 4), a = q < .6 ? 1 : 1 - (q - .6) / .4, c = C(); c.lineCap = 'round';
      withAdd(() => { for (const [x0, y0, x1, y1] of strokes) { const xe = lp(x0, x1, grow), ye = lp(y0, y1, grow); c.strokeStyle = P[3]; c.globalAlpha = .28 * a; c.lineWidth = 9; c.beginPath(); c.moveTo(h.i + x0 * s, h.j + y0 * s); c.lineTo(h.i + xe * s, h.j + ye * s); c.stroke(); c.strokeStyle = P[2]; c.globalAlpha = .6 * a; c.lineWidth = 5; c.stroke(); } });
      for (const [x0, y0, x1, y1] of strokes) { const xe = lp(x0, x1, grow), ye = lp(y0, y1, grow); c.strokeStyle = P[1]; c.globalAlpha = a; c.lineWidth = 2.6; c.beginPath(); c.moveTo(h.i + x0 * s, h.j + y0 * s); c.lineTo(h.i + xe * s, h.j + ye * s); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke(); }
      c.globalAlpha = 1; for (let k = 0; k < 4; k++) { const [x0, y0, x1, y1] = strokes[k], t = (clock.t / 90 + k) % 1; if (grow > .5) tongue(h.i + lp(x0, x1, t) * s, h.j + lp(y0, y1, t) * s, -Math.PI / 2, 8, 2.2, P, .8 * a, clock.t / 50 + k); } });
    VFX.shake(10, 420);
  }
  // Thunder: the sky darkens, a huge forked bolt comes down
  function bolt(x, y, big) {
    const top = by(y - 360), i0 = bx(x) + rnd(-10, 10), jx = by(y), pts = [[i0, top]], n = 14; for (let k = 1; k <= n; k++) { const f = k / n; pts.push([lp(i0, bx(x), f) + (k < n ? rnd(-9, 9) : 0), lp(top, jx, f)]); }
    const c = C(), draw = (w, col, a) => { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
    c.lineCap = 'round'; c.lineJoin = 'round'; withAdd(() => { draw(big * 9, PAL.elec[3], .22); draw(big * 4.5, PAL.elec[2], .5); }); draw(big * 2.2, PAL.elec[1], 1); draw(big * .9, '#ffffff', 1);
    for (let k = 3; k < n; k += 3) { const [px, py] = pts[k], d = k % 2 ? 1 : -1, ex = px + d * rnd(14, 28), ey = py + rnd(10, 22); c.strokeStyle = PAL.elec[2]; c.lineWidth = big * 1.1; c.globalAlpha = .9; c.beginPath(); c.moveTo(px, py); c.lineTo(lp(px, ex, .5) + rnd(-3, 3), lp(py, ey, .5)); c.lineTo(ex, ey); c.stroke(); } c.globalAlpha = 1;
  }
  def('Thunder', { markDraw: (mk, q) => {
    const x = bx(mk.x), y = by(mk.y), r = mk.r / 2;
    if (q < .78) { dim(.3 * Math.min(1, q * 3), 300, '8,10,24'); aEllFill(x, y, r, r * .6, PAL.elec[2], .08 + q * .1); shock(x, y, r * (1 - q * .3), PAL.elec[2], .85, 1); shock(x, y, r * .55 * (1 - q * .3), PAL.elec[1], .6, .8); for (let k = 0; k < 6; k++) { const a = k / 6 * T + clock.t / 300; hiDot(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .5, 1, PAL.elec[1], .9); } }
    else { const f = (q - .78) / .22; if (f < .5 || Math.random() < .5) bolt(mk.x, mk.y, (1.7 - f * .6) * 2.3); hiGlow(x, y, 30 * (1 - f * .5), '#ffffff', .8 * (1 - f)); }
  }, mark: mk => setTimeoutGame(Math.max(0, mk.delay * .78), () => { screenFlash('#fffbe0', .55); VFX.shake(14, 420); }), impact: both(hit('elec'), S => { const h = tgt(S); entAt(h, 500, q => shock(h.i, h.j + 8, 6 + q * 70, '#fff07a', (1 - q) * .8, 1.6)); }) });
  def('Thunderbolt', { impact: both(hit('elec'), S => { const h = tgt(S); entAt(h, 260, () => bolt(h.x, h.y + 12, 2.2)); screenFlash('#fffbe0', .25); }) });
  def('Thunder Shock|Thunder Punch|Volt Tackle', { impact: hit('elec') });
  def('Psychic', { impact: both(hit('psy'), S => { const h = tgt(S); entAt(h, 900, q => { const c = C(); for (let k = 0; k < 4; k++) { const t = (q * 1.4 + k / 4) % 1; shock(h.i, h.j, 4 + t * 38, PAL.psy[1 + k % 2], (1 - t) * (1 - q) * .8, 1.2); } hiGlow(h.i, h.j, 22, PAL.psy[2], .45 * Math.sin(q * Math.PI)); }); }) });
  def('Earthquake', { wave: w => { const r = w.r / 2, i = bx(w.x), j = by(w.y), c = C(); for (let k = 0; k < 3; k++) { const rr = r * (1 - k * .16); if (rr <= 2) continue; c.strokeStyle = k ? '#c9a46a' : '#5a4630'; c.globalAlpha = .85 - k * .22; c.lineWidth = 2.6 - k * .7; c.beginPath(); c.ellipse(i, j, rr, rr * .62, 0, 0, T); c.stroke(); } c.globalAlpha = 1; if (Math.random() < .8) { const a = rnd(0, T); emit(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * .62, 1, { ang: -Math.PI / 2, spread: .8, speed: [60, 150], g: 520, life: [400, 800], ramp: 'rock', size: [1, 3] }); if (Math.random() < .4) emit(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * .62, 1, { speed: [10, 40], life: [600, 1100], ramp: 'dust', shape: 'disc', size: 2, size2: 6, vy: -20 }); } } });

  for (const [names, r] of Object.entries(defs)) { if (r.shot) r.shot = bigShot(r.shot); def(names, r); }
  // every other damaging move: a type-coloured glow around its hit flash, so no move lands flat
  const done = new Set(Object.keys(defs).concat(['Thunder', 'Thunderbolt', 'Thunder Shock', 'Thunder Punch', 'Volt Tackle', 'Psychic', 'Earthquake']));
  for (const mv of Object.values(MOVES)) {
    if (done.has(mv.name) || !mv.pow) continue; const k = TYPE_HIT[mv.type]; if (!k) continue; const R = MFX[mv.name] || (MFX[mv.name] = {}), old = R.impact;
    R.impact = (S, m, crit, eff) => { if (old) try { old(S, m, crit, eff); } catch (e) { console.error(e); } flashAt(S, PAL[k === 'elec' ? 'elec' : k === 'gold' ? 'gold' : k], .8); };
  }
  window.HD = { PAL, BEAMS, SHOTS, HITS };
})();
