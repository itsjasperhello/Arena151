/* =====================================================================
   Section 28: Z-Moves rebuilt (HD cinematic + unique per-Pokémon finales)
   Replaces the pixel-canvas cinematic and recipe finale with the particle
   engine and toolkit, pushed further. Timing is unchanged (the battle code
   lands the hit 3.7 s in, via VFX.zImpact), so online play is unaffected.
   - Cinematic (0–1.6 s): full-resolution cut-in banner over a type-tinted
     darkness with speed lines, the Pokémon's sprite on a glowing aura,
     a spinning Z crystal, the move name; it shatters into a flash.
   - Finale (1.5–4.3 s): power-up (near-black arena, rune circle, light
     pillar, a giant spectral avatar of the Pokémon's own animated sprite),
     then a main attack archetype plus a second archetype layered on top
     (hand-picked main per Pokémon; the second is chosen so no two Pokémon
     share a combination), then a giant typed climax and lingering aftermath.
   ===================================================================== */
(function zfx2() {
  const P = window.PFX, K = window.FXK, P3 = window.PFX3; if (!P || !K || !P3) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P;
  const { body, dim, flash, shake, scar, speedLines, shock, star, ribbon, linePath, pillar, orb, debris, sparks, puff, glowAt, magicCircle, EX, fx, ease, rnd, N, T: TAU, tinted, actorFrame } = K;
  const hex2rgb = h => { h = (h || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].join(','); };
  const typeRGB = t => hex2rgb((typeof TYPE_COLOR !== 'undefined' && TYPE_COLOR[t]) || '#ffd84a');
  const mixRGB = (a, b, t) => { const A = a.split(',').map(Number), B = b.split(',').map(Number); return A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(','); };
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const seeded = seed => () => ((seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0) % 100000) / 100000;
  const dustTex = () => P.tex('dust', [[0, 'rgba(200,180,150,.6)'], [.5, 'rgba(180,160,130,.3)'], [1, 'rgba(160,140,110,0)']]);

  /* ---------- the element of a Z-Move: its colours, particles, explosion and ground scar ---------- */
  function element(type) {
    const rgb = typeRGB(type), light = mixRGB(rgb, '255,255,255', .55);
    const base = { rgb, light, scar: null, ex: (x, y, k) => powerEx(x, y, k, rgb), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .95, max: rnd(.35, .6), r: rnd(3, 6) * s, grow: .5, img: colTex('#' + rgb.split(',').map(v => (+v).toString(16).padStart(2, '0')).join(''), .95), a: 1, add: true }) };
    const E = {
      Fire: { ex: (x, y, k) => EX.fire(x, y, k), scar: 'scorch', part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .94, ay: -60, max: rnd(.35, .6), r: rnd(6, 12) * s, grow: .6, img: fireTex(rnd(10, 42) | 0), a: 1, add: true }) },
      Water: { ex: (x, y, k) => EX.water(x, y, k), scar: 'splat', part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .97, ay: 260, max: rnd(.4, .7), r: rnd(1.6, 3) * s, grow: 0, kind: 'drop', col: Math.random() < .5 ? '#cfeeff' : '#7fd0ff', a: 1, add: true }) },
      Electric: { ex: (x, y, k) => EX.electric(x, y, k), scar: 'scorch', part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .88, max: rnd(.15, .3), r: rnd(2, 4) * s, grow: .2, img: colTex(Math.random() < .4 ? '#ffffff' : '#ffe84a', 1), a: 1, add: true }) },
      Ice: { ex: (x, y, k) => EX.ice(x, y, k), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .93, max: rnd(.4, .7), r: rnd(3, 6) * s, grow: .1, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#aef0ff', rot: rnd(0, TAU), vr: rnd(-8, 8), a: 1, add: true }) },
      Grass: { ex: (x, y, k) => grassEx(x, y, k), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .95, max: rnd(.5, .9), r: 1, kind: 'fn', a: 1, draw: (c, q, p, op) => { c.globalAlpha = op; c.save(); c.translate(p.x, p.y); c.rotate(q * 9 + vx); const z = 5 * s; c.fillStyle = '#6ad04a'; c.beginPath(); c.moveTo(-z, 0); c.quadraticCurveTo(0, -z * .6, z, 0); c.quadraticCurveTo(0, z * .6, -z, 0); c.fill(); c.restore(); } }) },
      Psychic: { ex: (x, y, k) => EX.psychic(x, y, k), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .95, max: rnd(.4, .7), r: rnd(3, 6) * s, grow: .4, img: hueTex(rnd(290, 330) | 0, 90, 68), a: 1, add: true }) },
      Fairy: { ex: (x, y, k) => { EX.psychic(x, y, k); sparks(x, y, 30 * k, { cols: ['#ffffff', '#ffb0e0'] }); }, part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .93, max: rnd(.4, .7), r: rnd(3, 5) * s, grow: .1, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#ffb0e0', rot: rnd(0, TAU), vr: 6, a: 1, add: true }) },
      Ghost: { ex: (x, y, k) => EX.ghost(x, y, k), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .95, max: rnd(.5, .8), r: rnd(6, 11) * s, grow: 1, img: Math.random() < .5 ? smokeTex() : hueTex(275, 85, 58), a: .9, add: Math.random() < .5 }) },
      Dark: { ex: (x, y, k) => { EX.ghost(x, y, k); powerEx(x, y, k * .6, '200,60,60'); }, part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .95, max: rnd(.5, .8), r: rnd(6, 11) * s, grow: 1, img: smokeTex(), a: .9, add: false }) },
      Dragon: { ex: (x, y, k) => EX.dragon(x, y, k), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .94, max: rnd(.35, .6), r: rnd(5, 9) * s, grow: .5, img: hueTex(rnd(235, 265) | 0, 90, 62), a: 1, add: true }) },
      Steel: { ex: (x, y, k) => EX.steel(x, y, k), part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .92, max: rnd(.4, .7), r: rnd(3, 6) * s, grow: 0, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#c6d2de', rot: rnd(0, TAU), vr: 10, a: 1, add: true }) },
      Poison: { ex: (x, y, k) => EX.poison(x, y, k), scar: 'splat', part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .95, max: rnd(.4, .7), r: rnd(4, 8) * s, grow: .6, img: hueTex(rnd(270, 295) | 0, 80, 55), a: 1, add: true }) },
      Rock: { ex: (x, y, k) => EX.rock(x, y, k), scar: 'crack', part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .98, ay: 400, max: rnd(.5, .8), r: rnd(2.5, 5) * s, grow: 0, kind: 'chunk', pts: [[-1, -.4], [-.4, -1], [.6, -.9], [1, -.1], [.7, .8], [-.2, 1], [-1, .5]], col: '#7a6848', hi: '#b8a078', rot: rnd(0, TAU), vr: rnd(-8, 8), a: 1, add: false }) },
      Ground: { ex: (x, y, k) => EX.rock(x, y, k), scar: 'crack', part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .96, max: rnd(.5, .9), r: rnd(7, 12) * s, grow: 1.3, img: dustTex(), a: .6, add: false }) },
      Bug: { ex: (x, y, k) => { powerEx(x, y, k, '170,210,60'); sparks(x, y, 20 * k, { cols: ['#e8ffb0', '#b8e04a'] }); }, part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .94, max: rnd(.35, .6), r: rnd(3, 6) * s, grow: .4, img: hueTex(rnd(70, 95) | 0, 80, 58), a: 1, add: true }) },
      Flying: { ex: (x, y, k) => { powerEx(x, y, k, '190,215,255'); P3.featherBurst(x, y, 30 * k); }, part: (x, y, vx, vy, s) => spawn({ x, y, vx, vy, drag: .9, max: .25, r: 1, len: 16 * s, lw: 1.6, kind: 'streak', col: '#eaf6ff', a: 1, add: true }) },
      Fighting: { ex: (x, y, k) => { powerEx(x, y, k, '255,160,90'); P3.flurry && 0; }, part: base.part },
      Normal: { ex: (x, y, k) => powerEx(x, y, k, '255,240,200'), part: base.part }
    };
    return Object.assign({}, base, E[type] || {});
  }
  function powerEx(x, y, k, rgb) { glowAt(x, y, 60 * k, rgb, 400); star(x, y, { size: 34 * k, col: `rgb(${rgb})` }); for (let i = 0; i < 3; i++) shock(x, y, { r1: (70 + i * 26) * k, col: rgb, w: 6 * k, ms: 460 + i * 80 }); sparks(x, y, 34 * k, { cols: ['#ffffff', `rgb(${rgb})`], v: [180, 460] }); }
  function grassEx(x, y, k) { glowAt(x, y, 56 * k, '150,240,110', 400); shock(x, y, { r1: 80 * k, col: '160,240,120', w: 6 * k }); const E = element('Grass'); for (let i = 0; i < N(40 * k); i++) { const a = rnd(0, TAU), v = rnd(80, 260) * k; E.part(x, y, Math.cos(a) * v, Math.sin(a) * v - 40, 1.2); } }

  /* ---------- the giant spectral avatar of the attacker's own animated sprite ---------- */
  function drawAvatar(z, c, x, y, scale, alpha, rot = 0) {
    const f = actorFrame(z.S); if (!f) return; const img = tinted(f.src, z.hexLight), u = f.unit * scale, an = f.an;
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, y); c.rotate(rot); c.scale(f.flip ? -1 : 1, 1); c.imageSmoothingEnabled = false;
    c.globalAlpha = alpha * .5; c.drawImage(img, -an.cx * u - 3, -(an.h - an.foot) * u, an.w * u, an.h * u); c.drawImage(img, -an.cx * u + 3, -(an.h - an.foot) * u, an.w * u, an.h * u);
    c.globalAlpha = alpha; c.drawImage(img, -an.cx * u, -(an.h - an.foot) * u, an.w * u, an.h * u); c.restore(); }

  /* ---------- the 16 attack archetypes (drawn every frame; T = ms into the finale, the hit lands at 2200) ---------- */
  const HIT = 2200;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ARCH = {
    // meteors rain onto the target; the last and largest lands on the hit
    met(z, T, c, A, F, I) { const n = z.cnt(6, 10); for (let i = 0; i < n; i++) { const last = i === n - 1, t0 = last ? 1750 : 500 + i * (1150 / n), dur = last ? 450 : 520, f = (T - t0) / dur; if (f < 0 || f > 1) { if (f > 1 && !z.once('met' + i + I.tag)) { const p = z.pt(i); z.E.ex(p.x, p.y, (last ? 1.4 : .55) * I.k); shake(last ? 0 : 4, 120); } continue; }
      const p = z.pt(i, last), sx = p.x + 260, sy = p.y - 340, e = ease.in(f), x = lerp(sx, p.x, e), y = lerp(sy, p.y, e), r = (last ? 18 : 9) * I.k * F.k;
      for (let k = 0; k < (last ? 6 : 3); k++) z.E.part(x + rnd(-r, r) * .5, y + rnd(-r, r) * .5, (sx - p.x) * .3 + rnd(-30, 30), (sy - p.y) * .3 + rnd(-30, 30), last ? 1.4 : .9);
      orb(c, x, y, r, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 2 }); } },
    // a colossal beam: charge at the attacker, then a beam that grows into the target
    beam(z, T, c, A, F, I) { const k = I.k, x0 = A.i + A.face * A.w * .5, y0 = A.j;
      if (T > 300 && T < 1500) { const g = (T - 300) / 1200; orb(c, x0, y0, (6 + g * 20) * k * A.k, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 4, pulse: .15 }); if (Math.random() < .8) { const a = rnd(0, TAU), r = 70 * k; spawn({ x: x0 + Math.cos(a) * r, y: y0 + Math.sin(a) * r * .7, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 2.1, drag: .9, max: .3, r: 3, grow: -.3, img: colTex('#ffffff', 1), a: 1, add: true }); } }
      if (T >= 1500) { const g = Math.min(1, (T - 1500) / 300), fade = T > HIT + 200 ? Math.max(0, 1 - (T - HIT - 200) / 300) : 1, x1 = lerp(x0, F.i, g), y1 = lerp(y0, F.j, g), w = 26 * k * A.k * (1 + Math.sin(T / 40) * .08);
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (const [m, col, a] of [[3.2, z.rgb, .25], [2, z.rgb, .55], [1.2, z.light, .85], [.55, '255,255,255', 1]]) { c.strokeStyle = `rgba(${col},${a * fade})`; c.lineWidth = w * m; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        c.restore(); orb(c, x0, y0, 18 * k * A.k * fade + 1, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 3 });
        for (let n = due(z.r('beam' + I.tag), 400 * k); n > 0; n--) { const t = Math.random(); z.E.part(lerp(x0, x1, t) + rnd(-w, w) * .5, lerp(y0, y1, t) + rnd(-w, w) * .5, (x1 - x0) * .8, (y1 - y0) * .8, 1); } } },
    // energy serpents spiral from the attacker into the target
    spi(z, T, c, A, F, I) { if (T < 600) return; const g = Math.min(1, (T - 600) / (HIT - 600)), n = 3, fade = T > HIT ? Math.max(0, 1 - (T - HIT) / 250) : 1;
      for (let s = 0; s < n; s++) { const pts = []; for (let k = 0; k <= 30; k++) { const t = (k / 30) * g, a = t * 14 + s * 2.1 + T / 180 * z.spin, R = Math.sin(t * Math.PI) * 50 * I.k; pts.push([lerp(A.i, F.i, t) + Math.cos(a) * R * .4, lerp(A.j, F.j, t) + Math.sin(a) * R - Math.sin(t * Math.PI) * 40 * I.k]); }
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const [lw, col, a] of [[16, z.rgb, .22], [8, z.rgb, .6], [3, '255,255,255', .95]]) { c.strokeStyle = `rgba(${col},${a * fade})`; c.lineWidth = lw * I.k; c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore();
        const h = pts[pts.length - 1]; orb(c, h[0], h[1], 9 * I.k * fade + 1, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 2 }); if (Math.random() < .7) z.E.part(h[0], h[1], rnd(-60, 60), rnd(-60, 60), .9); } },
    // a huge orb gathers above the attacker, then is hurled at the target
    nova(z, T, c, A, F, I) { const hx = A.i, hy = A.j - 110 * I.k, k = I.k;
      if (T < 1600) { const g = Math.max(0, (T - 300) / 1300), r = 6 + ease.out(g) * 34 * k; if (T > 300) { orb(c, hx, hy, r, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 5, pulse: .1 }); for (let n = due(z.r('nova' + I.tag), 260 * k); n > 0; n--) { const a = rnd(0, TAU), rr = rnd(90, 160) * k; spawn({ x: hx + Math.cos(a) * rr, y: hy + Math.sin(a) * rr * .7, vx: -Math.cos(a) * rr * 2.4, vy: -Math.sin(a) * rr * 1.7, drag: .9, max: .4, r: rnd(2, 4), grow: -.3, img: colTex('#ffffff', 1), a: 1, add: true }); } } return; }
      const g = Math.min(1, (T - 1600) / (HIT - 1600)), e = ease.in(g), x = lerp(hx, F.i, e), y = lerp(hy, F.j, e) - Math.sin(g * Math.PI) * 60 * k; if (T <= HIT) { orb(c, x, y, 40 * k * (1 + g * .3), { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 5 }); for (let n = 0; n < 4; n++) z.E.part(x + rnd(-20, 20), y + rnd(-20, 20), (hx - F.i) * .5, (hy - F.j) * .5, 1.2); } },
    // pillars erupt in a ring around the target, then a giant one through it
    pil(z, T, c, A, F, I) { const n = z.cnt(5, 8); for (let i = 0; i < n; i++) { const t0 = 600 + i * (1400 / n); if (T >= t0 && !z.once('pil' + i + I.tag)) { const a = i * TAU / n + z.seed % 7, R = 70 * I.k * F.k, x = F.i + Math.cos(a) * R, y = F.feet + Math.sin(a) * R * .35; pillar(x, y, { w: 22 * I.k, h: 200, col: z.light, ms: 700 }); z.E.ex(x, y - 20, .45 * I.k); shake(3, 100); } }
      if (T >= HIT - 120 && !z.once('pilC' + I.tag)) pillar(F.i, F.feet, { w: 60 * I.k * F.k, h: 360, col: z.light, ms: 900 }); },
    // a dark storm cloud over the target fires typed strikes, then a huge one
    storm(z, T, c, A, F, I) { if (T < 300) return; const cy = F.j - 170, a = Math.min(1, (T - 300) / 400) * (T > HIT + 300 ? Math.max(0, 1 - (T - HIT - 300) / 300) : 1);
      for (let n = due(z.r('cloud' + I.tag), 50); n > 0; n--) spawn({ x: F.i + rnd(-110, 110), y: cy + rnd(-20, 20), vx: rnd(-20, 20), vy: rnd(-6, 6), drag: .99, max: rnd(.8, 1.2), r: rnd(18, 30), grow: .5, img: smokeTex(), a: .8 * a, add: false });
      const strike = (x, big) => { const w = big ? 1 : .55; fx({ add: true, max: big ? .3 : .18, draw: (cc, q) => { cc.save(); cc.globalCompositeOperation = 'lighter'; cc.lineJoin = 'round'; const pts = [[x, cy]]; let px = x, py = cy; while (py < F.feet) { py = Math.min(F.feet, py + rnd(14, 26)); px += rnd(-12, 12); pts.push([px, py]); }
        for (const [lw, col, al] of [[10 * w, z.rgb, .3], [4 * w, z.light, .85], [1.6 * w, '255,255,255', 1]]) { cc.strokeStyle = `rgba(${col},${al * (1 - q)})`; cc.lineWidth = lw; cc.beginPath(); pts.forEach((p, k) => k ? cc.lineTo(p[0], p[1]) : cc.moveTo(p[0], p[1])); cc.stroke(); } cc.restore(); } }); z.E.ex(x, F.feet - 6, big ? 1.2 * I.k : .35); };
      if (T > 600 && T < HIT - 150 && Math.random() < .09 * I.k) strike(F.i + rnd(-90, 90), false);
      if (T >= HIT - 60 && !z.once('stormC' + I.tag)) strike(F.i, true); },
    // a vortex forms on the target, pulling everything in
    tor(z, T, c, A, F, I) { if (T < 500) return; const g = Math.min(1, (T - 500) / 1200), a = T > HIT + 200 ? Math.max(0, 1 - (T - HIT - 200) / 300) : 1, t = T / 40;
      c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 16; k++) { const f = k / 15, y = F.feet - f * 200 * g * I.k, rx = (14 + f * 60) * g * I.k; c.strokeStyle = `rgba(${f > .6 ? z.light : z.rgb},${(.35 + .45 * (1 - f * .4)) * a})`; c.lineWidth = 3.2 - f * 1.4; c.beginPath(); c.ellipse(F.i + Math.sin(t + k * .6) * 6, y, rx, rx * .3, 0, t * 2 * z.spin + k, t * 2 * z.spin + k + 4.8); c.stroke(); } c.restore();
      for (let n = due(z.r('tor' + I.tag), 180 * I.k); n > 0; n--) { const an = rnd(0, TAU), r = rnd(80, 150); z.E.part(F.i + Math.cos(an) * r, F.feet - rnd(0, 160), -Math.cos(an) * r * 1.6 - Math.sin(an) * 120, -rnd(40, 120), 1); } },
    // giant blades rain across the target, ending in an X
    bla(z, T, c, A, F, I) { const n = z.cnt(5, 8); for (let i = 0; i < n; i++) { const t0 = 500 + i * (1500 / n); if (T >= t0 && !z.once('bla' + i + I.tag)) { const a = z.rng() * TAU, L = 90 * I.k * F.k; ribbon(linePath(F.i - Math.cos(a) * L, F.j - Math.sin(a) * L, F.i + Math.cos(a) * L, F.j + Math.sin(a) * L, rnd(-20, 20)), { w: 22 * I.k, ms: 420, core: '#ffffff', edge: `rgba(${z.rgb},.95)`, glow: `rgba(${z.rgb},A)`, grow: .2, layer: 1 }); sparks(F.i, F.j, 12, { cols: ['#ffffff', `rgb(${z.light})`] }); shake(3, 90); } }
      if (T >= HIT - 80 && !z.once('blaX' + I.tag)) for (const sg of [-1, 1]) { const L = 130 * I.k * F.k; ribbon(linePath(F.i - L, F.j - L * sg * .8, F.i + L, F.j + L * sg * .8, 10 * sg), { w: 32 * I.k, ms: 500, core: '#ffffff', edge: `rgba(${z.rgb},.95)`, glow: `rgba(${z.rgb},A)`, grow: .15, layer: 1 }); } },
    // a colossal wave rolls from the attacker over the target
    wave(z, T, c, A, F, I) { if (T < 800) return; const g = Math.min(1.1, (T - 800) / (HIT - 800)), x = lerp(A.i - A.face * 40, F.i + A.face * 40, g), H = 120 * I.k, a = T > HIT + 150 ? Math.max(0, 1 - (T - HIT - 150) / 300) : 1;
      c.save(); for (let k = 0; k <= 18; k++) { const f = k / 18; c.globalAlpha = a * (f > .85 ? 1 : .7); c.strokeStyle = f > .85 ? `rgb(${z.light})` : `rgb(${mixRGB(z.rgb, '0,0,0', .4 * (1 - f))})`; c.lineWidth = 7; c.beginPath(); c.ellipse(x, F.feet, 26 * I.k + f * 8, 90 * I.k, 0, -Math.PI / 2 - .6 + f * .2, Math.PI / 2); c.stroke(); c.beginPath(); c.moveTo(x - A.face * 30, F.feet - f * H); c.quadraticCurveTo(x, F.feet - f * H - 20, x + A.face * 20, F.feet - f * H + 10); c.stroke(); } c.restore();
      for (let n = due(z.r('wave' + I.tag), 260 * I.k); n > 0; n--) z.E.part(x + rnd(-20, 20), F.feet - rnd(H * .6, H * 1.1), A.face * rnd(40, 140), -rnd(40, 140), 1.1); },
    // a bullet-hell stream of shots
    bar(z, T, c, A, F, I) { if (T < 500) return; if (T < HIT - 100) for (let n = due(z.r('bar' + I.tag), 22 * I.k); n > 0; n--) { const x0 = A.i + A.face * A.w * .4, y0 = A.j, tx = F.i + rnd(-.6, .6) * F.w, ty = F.j + rnd(-.6, .6) * F.h, d = Math.hypot(tx - x0, ty - y0), sp = 900;
        spawn({ x: x0, y: y0, vx: (tx - x0) / d * sp, vy: (ty - y0) / d * sp, drag: 1, max: d / sp, r: 1, kind: 'fn', a: 1, draw: (cc, q, p) => { orb(cc, p.x, p.y, 5 * I.k, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 1 }); if (q > .97 && !p.boom) { p.boom = 1; z.E.part(p.x, p.y, rnd(-80, 80), rnd(-80, 80), 1); sparks(p.x, p.y, 3, { cols: ['#ffffff', `rgb(${z.light})`] }); } } }); } },
    // a singularity at the target pulls everything in, then detonates
    imp(z, T, c, A, F, I) { if (T < 500 || T > HIT) return; const g = Math.min(1, (T - 500) / 1200), r = (8 + g * 34) * I.k, x = F.i, y = F.j;
      c.save(); const gr = c.createRadialGradient(x, y, 0, x, y, r * 2.2); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.42, 'rgba(0,0,0,.95)'); gr.addColorStop(.55, `rgba(${z.rgb},.9)`); gr.addColorStop(1, `rgba(${z.rgb},0)`); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r * 2.2, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(${k ? z.light : '255,255,255'},.8)`; c.lineWidth = 2.4 - k * .5; c.beginPath(); c.ellipse(x, y, r * (1.5 + k * .35), r * (.45 + k * .1), .3, T / 150 * z.spin + k, T / 150 * z.spin + k + 4.5); c.stroke(); } c.restore();
      for (let n = due(z.r('imp' + I.tag), 220 * I.k); n > 0; n--) { const a = rnd(0, TAU), R = rnd(160, 260); spawn({ x: x + Math.cos(a) * R, y: y + Math.sin(a) * R * .6, vx: -Math.cos(a) * R * 2.6 - Math.sin(a) * 120, vy: -Math.sin(a) * R * 1.6 + Math.cos(a) * 80, drag: .97, max: .42, r: rnd(2, 4), grow: -.4, img: Math.random() < .5 ? colTex('#ffffff', 1) : hueTex(rnd(0, 360) | 0, 30, 70), a: 1, add: true }); } },
    // a zig-zag chain of afterimage strikes
    rush(z, T, c, A, F, I) { const n = z.cnt(5, 8); for (let i = 0; i < n; i++) { const t0 = 500 + i * (1550 / n); if (T >= t0 && !z.once('rush' + i + I.tag)) { const a = (i % 2 ? 1 : -1) * rnd(.6, 1.2) + (A.face > 0 ? Math.PI : 0), d = rnd(60, 110) * I.k, x = F.i + Math.cos(a) * d, y = F.j + Math.sin(a) * d * .5;
        const f = actorFrame(z.S); if (f) { const img = tinted(f.src, z.hexLight), u = f.unit * 1.15, an = f.an; fx({ add: true, max: .35, draw: (cc, q) => { cc.save(); cc.globalCompositeOperation = 'lighter'; cc.globalAlpha = .8 * (1 - q); cc.translate(x, y + 18); cc.scale(Math.cos(a) > 0 ? -1 : 1, 1); cc.imageSmoothingEnabled = false; cc.drawImage(img, -an.cx * u, -(an.h - an.foot) * u, an.w * u, an.h * u); cc.restore(); } }); }
        ribbon(linePath(x, y, F.i, F.j, rnd(-14, 14)), { w: 10 * I.k, ms: 260, core: '#ffffff', edge: `rgba(${z.rgb},.9)`, glow: `rgba(${z.rgb},A)`, grow: .2 }); star(F.i + rnd(-14, 14), F.j + rnd(-14, 14), { size: 20 * I.k, col: `rgb(${z.light})`, ms: 200 }); shake(4, 80); } } },
    // eruptions race along the ground from the attacker to the target
    quake(z, T, c, A, F, I) { const n = 9; for (let i = 0; i < n; i++) { const t0 = 500 + i * 160; if (T >= t0 && !z.once('qk' + i + I.tag)) { const f = (i + 1) / (n + 1), x = lerp(A.i, F.i, f), y = lerp(A.feet, F.feet, f);
        pillar(x, y, { w: 18 * I.k, h: 90 + i * 12, col: z.light, ms: 500 }); debris(x, y - 4, 6, { floor: y + 6 }); z.E.ex(x, y - 10, .35 * I.k); scar('crack', lerp(side(z.S).x, side(z.F).x, f), lerp(side(z.S).y, side(z.F).y, f)); shake(4, 100); } }
      if (T >= HIT - 80 && !z.once('qkC' + I.tag)) { pillar(F.i, F.feet, { w: 50 * I.k * F.k, h: 300, col: z.light, ms: 800 }); debris(F.i, F.feet - 6, 26, { floor: F.feet + 8, v: [120, 300], up: [200, 420] }); } },
    // a shower of the element's items over the target, swirling, then bursting
    rain(z, T, c, A, F, I) { if (T < 400 || T > HIT) return; for (let n = due(z.r('rain' + I.tag), 260 * I.k); n > 0; n--) { const x = F.i + rnd(-150, 150), y = F.j - rnd(150, 260); z.E.part(x, y, (F.i - x) * .6 + rnd(-30, 30), rnd(160, 320), 1.1); }
      glowAt(F.i, F.j, 70 * I.k, z.rgb, 40, .2 + (T / HIT) * .3); },
    // the giant avatar itself dives onto the target
    giant(z, T, c, A, F, I) { if (T < 1500) return; const g = Math.min(1, (T - 1500) / (HIT - 1500)), e = ease.in(g), x = lerp(A.i, F.i, e), y = lerp(A.feet - 60, F.feet, e) - Math.sin(g * Math.PI) * 120 * I.k;
      const big = z.mon === 'Snorlax' ? 1.35 : 1; if (T <= HIT + 60) { if (z.mon === 'Pikachu') orb(c, x, y - 40 * A.k, 60 * A.k, { core: '255,255,230', mid: '255,220,60', rim: '255,255,200', arcs: 5, pulse: .14 });
        if (z.mon === 'Snorlax') { c.save(); c.globalAlpha = .45 * g; c.fillStyle = '#000'; c.beginPath(); c.ellipse(F.i, F.feet, 80 * g * F.k, 22 * g * F.k, 0, 0, TAU); c.fill(); c.restore(); }
        drawAvatar(z, c, x, y, 3.2 * I.k * big * (1 - g * .2), .9, (1 - g) * .2 * A.face); for (let n = 0; n < 3; n++) z.E.part(x + rnd(-30, 30), y - rnd(0, 80), (A.i - F.i) * .6, -rnd(20, 80), 1.2); } },
    // rings of orbs orbit the target, closing in, then converge
    orb(z, T, c, A, F, I) { if (T < 500 || T > HIT) return; const g = Math.min(1, (T - 500) / (HIT - 500)), rings = 3;
      for (let rr = 0; rr < rings; rr++) { const n = 7 + rr * 2, R = (120 - rr * 24) * I.k * (1 - ease.in(g) * .95); for (let k = 0; k < n; k++) { const a = T / (300 - rr * 60) * z.spin * (rr % 2 ? -1 : 1) + k * TAU / n, x = F.i + Math.cos(a) * R, y = F.j + Math.sin(a) * R * .45; orb(c, x, y, (4 + rr) * I.k, { core: '255,255,255', mid: z.rgb, rim: z.light, arcs: 0 }); if (Math.random() < .05) z.E.part(x, y, 0, 0, .7); } } }
  };

  /* ---------- which archetype each Pokémon leads with (Pokédex order) ---------- */
  const MAIN = ('rain bar beam bar bla met bar spi beam orb giant rain bar giant rush tor rush tor rush giant ' +
    'rush giant spi giant storm storm quake bla bar pil quake rush rush quake met nova orb spi wave giant ' +
    'wave imp rain rain pil orb giant orb rain quake quake rush bla wave wave rush rush bar met bar ' +
    'spi rush nova orb imp rush rush giant bar rain pil spi wave met met quake rush met imp beam ' +
    'storm beam bla rush bar wave storm imp imp bar bla imp imp imp quake orb orb bla giant storm ' +
    'nova orb pil met giant rush bar spi imp imp rush quake nova spi giant bar tor wave spi orb ' +
    'beam wave bla storm storm met bla rush wave beam storm orb rush wave storm met bar spi tor bla ' +
    'bla met giant storm storm met spi tor met imp nova').split(' ');
  const KEYS = Object.keys(ARCH);
  const COMBO = {}; (function assign() { const used = new Set(); DEX.forEach((d, i) => { const main = MAIN[i] || KEYS[i % KEYS.length], h = hashStr(d.name); let sec = null;
    for (let s = 0; s < KEYS.length; s++) { const cand = KEYS[(h + s * 7) % KEYS.length]; if (cand === main) continue; const key = main + '+' + cand + '+' + d.types.join('/'); if (!used.has(key)) { used.add(key); sec = cand; break; } }
    COMBO[d.name] = [main, sec || KEYS[(h + 3) % KEYS.length]]; }); })();

  // exclusive Z-Moves follow their signature from the games
  const EXCL = { Pikachu: ['giant', 'storm'], Raichu: ['wave', 'rush'], Eevee: ['evo', 'beam'], Snorlax: ['giant', 'quake'], Mew: ['nova', 'imp'] };
  for (const [mon, combo] of Object.entries(EXCL)) COMBO[mon] = combo;
  // Extreme Evoboost: eight orbs in the colours of Eevee's evolutions beam power into it, then a rainbow beam
  const EVO_COL = ['80,150,255', '255,225,60', '255,120,40', '230,140,230', '60,50,90', '120,210,90', '140,230,255', '255,150,200'];
  ARCH.evo = (z, T, c, A, F, I) => { if (T < 250 || T > 1650) return; const g = Math.min(1, (T - 250) / 400), fade = T > 1450 ? (1 - (T - 1450) / 200) : 1;
    EVO_COL.forEach((col, k) => { const a = k * TAU / 8 + T / 900, R = 90 * A.k * (1.3 - g * .3), x = A.i + Math.cos(a) * R, y = A.j + Math.sin(a) * R * .55 - 10;
      orb(c, x, y, 10 * A.k * g * fade + .5, { core: '255,255,255', mid: col, rim: mixRGB(col, '255,255,255', .5), arcs: 2 });
      if (T > 650) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const [lw, a2] of [[7, .3], [2.5, .9]]) { c.strokeStyle = `rgba(${col},${a2 * fade})`; c.lineWidth = lw; c.beginPath(); c.moveTo(x, y); c.lineTo(A.i, A.j); c.stroke(); } c.restore(); } });
    if (T > 650) glowAt(A.i, A.j, 60 * A.k, '255,255,255', 40, .5 * fade); };
  const rainbowBeam = (z, T, c, A, F) => { if (T < 1650 || T > HIT + 450) return; const g = Math.min(1, (T - 1650) / 250), fade = T > HIT + 150 ? Math.max(0, 1 - (T - HIT - 150) / 300) : 1, x0 = A.i + A.face * A.w * .4, x1 = lerp(x0, F.i, g), y1 = lerp(A.j, F.j, g), w = 34 * A.k;
    // eight colour bands side by side (normal blending keeps them distinct), a soft glow around them and a white core
    const dx = x1 - x0, dy = y1 - A.j, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, bw = w * .2;
    c.save(); c.lineCap = 'butt'; c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,240,255,${.25 * fade})`; c.lineWidth = w * 2.2; c.beginPath(); c.moveTo(x0, A.j); c.lineTo(x1, y1); c.stroke();
    c.globalCompositeOperation = 'source-over'; EVO_COL.forEach((col, k) => { const off = (k - 3.5) * bw, wob = Math.sin(T / 60 + k) * 1.5; c.strokeStyle = `rgba(${col},${.95 * fade})`; c.lineWidth = bw + .6; c.beginPath(); c.moveTo(x0 + nx * (off + wob), A.j + ny * (off + wob)); c.lineTo(x1 + nx * (off + wob), y1 + ny * (off + wob)); c.stroke(); });
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,255,255,${.9 * fade})`; c.lineWidth = bw * .8; c.beginPath(); c.moveTo(x0, A.j); c.lineTo(x1, y1); c.stroke(); c.restore();
    orb(c, x0, A.j, 16 * A.k * fade + 1, { core: '255,255,255', mid: EVO_COL[(T / 80 | 0) % 8], rim: '255,255,255', arcs: 3 }); };
  // Genesis Supernova leaves the arena glowing with psychic terrain
  function psychicTerrain() { fx({ layer: -1, add: true, max: 2.6, draw: (c, q) => { const a = q < .1 ? q / .1 : 1 - q; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const W = c.canvas.width, H = c.canvas.height, g = c.createLinearGradient(0, H * .35, 0, H); g.addColorStop(0, 'rgba(255,120,220,0)'); g.addColorStop(1, `rgba(255,120,220,${.32 * a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = `rgba(255,170,240,${.35 * a})`; c.lineWidth = 2; for (let i = 0; i < 14; i++) { const y = H * .45 + ((i * 47 + clock.t * .05) % (H * .6)); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.restore(); } }); }

  /* ---------- the running finales ---------- */
  const ZN = [];
  const FIN = 1500;                                         // the finale starts 1.5 s into the Z-Move (the cinematic covers the start)
  function start(S, mon, type) {
    const seed = hashStr(mon), rng = seeded(seed), rgb = typeRGB(type), m = act(S), acc = (() => { try { const c = document.createElement('canvas'); c.width = c.height = 64; drawSpriteTo(c, m.pick || mon, {}); const d = c.getContext('2d').getImageData(0, 0, 64, 64).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] > 120 && d[i] + d[i + 1] + d[i + 2] < 700) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return n ? [r / n, g / n, b / n].map(Math.round).join(',') : null; } catch (e) { return null; } })();
    const light = mixRGB(rgb, acc || '255,255,255', acc ? .45 : .55), z = { S, F: other(S), mon, type, t0: clock.t, seed, rng, spin: seed & 1 ? 1 : -1, rgb, light, hexLight: '#' + light.split(',').map(v => (+v).toString(16).padStart(2, '0')).join(''),
      E: element(type), combo: COMBO[mon] || ['beam', 'met'], flags: {}, rates: {}, pts: {} };
    z.once = key => { if (z.flags[key]) return true; z.flags[key] = 1; return false; };
    z.r = key => z.rates[key] || (z.rates[key] = {});
    z.cnt = (a, b) => a + (seed % (b - a + 1));
    z.pt = (i, centre) => { if (!z.pts[i]) { const F = body(z.F); z.pts[i] = centre ? { x: F.i, y: F.j } : { x: F.i + (rng() - .5) * 140, y: F.feet - rng() * 40 }; } return z.pts[i]; };
    ZN.push(z);
  }
  function climax(z) { if (z.flags.climax) return; z.flags.climax = 1; const F = body(z.F), k = F.k; if (z.mon === 'Mew') psychicTerrain();
    z.E.ex(F.i, F.j, 2.6 * k); later(110, () => z.E.ex(F.i + rnd(-30, 30), F.j - 16, 1.4 * k)); later(220, () => z.E.ex(F.i + rnd(-40, 40), F.j + 10, 1.1 * k));
    powerEx(F.i, F.j, 2 * k, z.light); pillar(F.i, F.feet, { w: Math.max(60, F.w * 2), h: 420, col: z.light, ms: 1000 });
    for (let i = 0; i < 4; i++) later(i * 90, () => shock(F.i, F.feet, { r1: (160 + i * 60) * k, col: i % 2 ? z.rgb : '255,255,255', w: 10 - i * 2, squash: .34, ms: 700 }));
    speedLines(F.i, F.j, '#ffffff', 500, 40); flash('#ffffff', .65); later(120, () => flash(`rgb(${z.light})`, .35));
    debris(F.i, F.feet - 8, 30, { floor: F.feet + 10, v: [140, 360], up: [200, 460] });
    const sc = z.E.scar || 'crack'; for (let i = 0; i < 4; i++) later(i * 60, () => scar(sc, side(z.F).x + rnd(-40, 40), side(z.F).y + rnd(-20, 20)));
    for (let i = 0; i < 14; i++) later(300 + i * 60, () => { const b = body(z.F); z.E.part(b.i + rnd(-80, 80), b.feet - rnd(0, 30), rnd(-20, 20), -rnd(40, 120), 1); }); }
  const later = (ms, f) => setTimeoutGame(ms, () => { try { f(); } catch (e) { console.error(e); } });
  function drawFinales() {
    if (!G || !ZN.length) return; const c = bctx;
    for (let i = ZN.length - 1; i >= 0; i--) { const z = ZN[i], T = clock.t - z.t0 - FIN; if (T > 3200) { ZN.splice(i, 1); continue; }   // the finale runs to the end of the Z-Move (and a little past it for the aftermath) if (T < 0) continue;
      const A = body(z.S), F = body(z.F);
      // act 1: power-up
      if (!z.flags.pow) { z.flags.pow = 1; dim(.62, 3000, mixRGB(z.rgb, '0,0,0', .82)); magicCircle(z.S, z.light, 2300, 2.2); pillar(A.i, A.feet, { w: Math.max(40, A.w * 1.4), h: 360, col: z.light, ms: 1500 }); shock(A.i, A.feet, { r1: 140 * A.k, col: z.light, w: 8, squash: .34, ms: 700 }); }
      if (T < 2000) { const a = T < 300 ? T / 300 : T > 1500 ? Math.max(0, 1 - (T - 1500) / 500) : 1, rise = ease.out(Math.min(1, T / 700)); if (z.combo[0] !== 'giant' || T < 1500) drawAvatar(z, c, A.i - A.face * 20, A.feet + 20 - rise * 60, 3.1 * Math.max(.8, A.k), .55 * a); }
      if (T < 1400) for (let n = due(z.r('aura'), 160); n > 0; n--) { const an = rnd(0, Math.PI * 2), r = rnd(.3, .9) * A.w; z.E.part(A.i + Math.cos(an) * r, A.feet - rnd(0, A.h), rnd(-20, 20), -rnd(80, 180), 1); }
      // act 2: the main archetype plus the second, layered (the second a little smaller)
      try { ARCH[z.combo[0]](z, T, c, A, F, { k: 1, tag: 'a' }); } catch (e) { console.error(e); }
      try { if (z.combo[1] && z.combo[1] !== 'giant' && !(z.mon === 'Eevee' && z.combo[1] === 'beam')) ARCH[z.combo[1]](z, T, c, A, F, { k: .62, tag: 'b' }); } catch (e) { console.error(e); }
      if (z.mon === 'Eevee') try { rainbowBeam(z, T, c, A, F); } catch (e) { console.error(e); }
      // target lock: a reticle tightening on the target
      if (T > 400 && T < HIT) { const g = (T - 400) / (HIT - 400), R = (70 - g * 34) * F.k; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(${z.light},${.35 + g * .5})`; c.lineWidth = 2; c.beginPath(); c.ellipse(F.i, F.j, R, R * .62, 0, 0, TAU); c.stroke();
        for (let k = 0; k < 4; k++) { const an = k * Math.PI / 2 + T / 400 * z.spin; c.beginPath(); c.moveTo(F.i + Math.cos(an) * R * 1.25, F.j + Math.sin(an) * R * .78); c.lineTo(F.i + Math.cos(an) * R * .75, F.j + Math.sin(an) * R * .47); c.stroke(); } c.restore(); }
      if (T >= HIT) climax(z); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  const _dwf = drawWorldFx; drawWorldFx = function () { const r = _dwf.apply(this, arguments); try { drawFinales(); } catch (e) { console.error(e); } return r; };

  /* ---------- the HD cinematic cut-in (full resolution, replaces the 320×180 pixel canvas) ---------- */
  const CV = document.createElement('canvas'); CV.id = 'zfxHD'; CV.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60;display:none'; document.body.appendChild(CV);
  const X = CV.getContext('2d'); let RUN = null;
  function cinematic(S, mon, name, type) {
    const m = act(S), img = document.createElement('canvas'); img.width = img.height = 96; try { drawSpriteTo(img, (m && m.pick) || mon, {}); } catch (e) { }
    const dpr = Math.min(1.5, window.devicePixelRatio || 1); CV.width = Math.round(innerWidth * dpr); CV.height = Math.round(innerHeight * dpr); CV.style.display = 'block';
    const rgb = typeRGB(type); RUN = { t0: performance.now(), mon, name, type, rgb, light: mixRGB(rgb, '255,255,255', .5), dark: mixRGB(rgb, '0,0,0', .7), img, lines: Array.from({ length: 70 }, () => ({ a: rnd(0, Math.PI * 2), w: rnd(1, 4), l: rnd(.3, .7), s: rnd(.6, 1.4) })), shards: Array.from({ length: 26 }, () => ({ x: rnd(0, 1), y: rnd(-.2, .2), vx: rnd(-1, 1), vy: rnd(-1.2, .4), r: rnd(-6, 6), s: rnd(.04, .12) })) };
    requestAnimationFrame(frame);
  }
  function frame(now) {
    const r = RUN; if (!r) { CV.style.display = 'none'; return; } const t = Math.max(0, now - r.t0), W = CV.width, H = CV.height, c = X, U = Math.min(W, H) / 540;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    if (t > 1600) { RUN = null; CV.style.display = 'none'; return; }
    const fadeIn = Math.min(1, t / 220), fadeOut = t > 1380 ? Math.max(0, 1 - (t - 1380) / 220) : 1;
    // darkness tinted to the type, with a bright core
    let g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, `rgba(${mixRGB(r.rgb, '0,0,0', .55)},${.92 * fadeIn * fadeOut})`); g.addColorStop(1, `rgba(3,3,10,${.96 * fadeIn * fadeOut})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // speed lines rushing to the centre
    c.save(); c.globalCompositeOperation = 'lighter'; for (const l of r.lines) { const k = ((t / 700 * l.s) + l.l) % 1, R0 = Math.max(W, H) * (1 - k) * .9, R1 = R0 + Math.max(W, H) * .18; c.strokeStyle = `rgba(${r.light},${.5 * k * fadeOut})`; c.lineWidth = l.w * U; c.beginPath(); c.moveTo(W / 2 + Math.cos(l.a) * R0, H / 2 + Math.sin(l.a) * R0); c.lineTo(W / 2 + Math.cos(l.a) * R1, H / 2 + Math.sin(l.a) * R1); c.stroke(); } c.restore();
    // the banner slashes in, holds, then shatters
    const inK = ease.out(Math.min(1, t / 300)), out = t > 1050 ? ease.in(Math.min(1, (t - 1050) / 300)) : 0, bx = (-1 + inK) * W, by0 = H * .32, bh = H * .36;
    if (out < 1) { c.save(); c.translate(bx, 0); c.globalAlpha = 1 - out;
      c.shadowColor = `rgb(${r.rgb})`; c.shadowBlur = 40 * U; g = c.createLinearGradient(0, by0, 0, by0 + bh); g.addColorStop(0, `rgb(${r.light})`); g.addColorStop(.5, `rgb(${r.rgb})`); g.addColorStop(1, `rgb(${r.dark})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(0, by0 + bh * .1); c.lineTo(W, by0 - bh * .08); c.lineTo(W, by0 + bh * .9); c.lineTo(0, by0 + bh * 1.06); c.closePath(); c.fill(); c.shadowBlur = 0;
      const gl = c.createLinearGradient(0, by0, W, by0 + bh); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(((t / 900) % 1), 'rgba(255,255,255,.35)'); gl.addColorStop(Math.min(1, ((t / 900) % 1) + .05), 'rgba(255,255,255,0)'); c.fillStyle = gl; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3 * U; c.beginPath(); c.moveTo(0, by0 + bh * .1); c.lineTo(W, by0 - bh * .08); c.stroke(); c.beginPath(); c.moveTo(0, by0 + bh * 1.06); c.lineTo(W, by0 + bh * .9); c.stroke();
      // the Pokémon on a glowing aura
      const sx = W * .2, sy = by0 + bh * .55, ss = bh * 1.25; const ag = c.createRadialGradient(sx, sy, 0, sx, sy, ss * .6); ag.addColorStop(0, 'rgba(255,255,255,.9)'); ag.addColorStop(.35, `rgba(${r.light},.6)`); ag.addColorStop(1, `rgba(${r.rgb},0)`); c.fillStyle = ag; c.beginPath(); c.arc(sx, sy, ss * .6, 0, Math.PI * 2); c.fill();
      c.imageSmoothingEnabled = false; c.drawImage(r.img, sx - ss / 2, sy - ss / 2 + Math.sin(t / 120) * 4 * U, ss, ss);
      // the words
      c.textBaseline = 'middle'; c.textAlign = 'left'; const tx = W * .38;
      c.font = `900 ${Math.round(22 * U)}px "Lilita One", Impact, sans-serif`; c.lineWidth = 5 * U; c.strokeStyle = 'rgba(5,6,15,.9)'; c.strokeText('Z-MOVE', tx, by0 + bh * .2); c.fillStyle = '#ffffff'; c.fillText('Z-MOVE', tx, by0 + bh * .2);
      let fs = Math.round(56 * U); const label = r.name.toUpperCase(); c.font = `900 ${fs}px "Lilita One", Impact, sans-serif`; while (fs > 18 && c.measureText(label).width > W * .55) { fs -= 2; c.font = `900 ${fs}px "Lilita One", Impact, sans-serif`; }
      const pulse = 1 + Math.sin(t / 70) * .015; c.save(); c.translate(tx, by0 + bh * .5); c.scale(pulse, pulse); c.lineWidth = 9 * U; c.strokeStyle = 'rgba(5,6,15,.95)'; c.strokeText(label, 0, 0); c.shadowColor = '#fff36b'; c.shadowBlur = 24 * U; c.fillStyle = '#fff36b'; c.fillText(label, 0, 0); c.restore();
      c.font = `800 ${Math.round(16 * U)}px Rubik, sans-serif`; c.fillStyle = 'rgba(5,6,15,.85)'; c.fillText(`${r.mon.toUpperCase()}\u2019S FULL-FORCE ATTACK`, tx, by0 + bh * .8);
      // the spinning Z crystal
      const zx = W * .9, zy = by0 + bh * .35, zr = 34 * U * (1 + Math.sin(t / 60) * .05), sp = Math.cos(t / 110); c.save(); c.shadowColor = '#ffffff'; c.shadowBlur = 30 * U; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(zx, zy - zr); c.lineTo(zx + zr * .7 * sp, zy); c.lineTo(zx, zy + zr); c.lineTo(zx - zr * .7 * sp, zy); c.closePath(); c.fill(); c.restore();
      c.fillStyle = `rgb(${r.rgb})`; c.font = `900 ${Math.round(30 * U)}px "Lilita One", sans-serif`; c.textAlign = 'center'; c.fillText('Z', zx, zy + 2 * U); c.restore();
      // energy streaming across the banner
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const k = ((t / 500) + i / 40) % 1, x = k * W, y = by0 + bh * ((i * 37) % 100) / 100; c.fillStyle = `rgba(${r.light},${.6 * (1 - out)})`; c.fillRect(x, y, 40 * U * k, 2 * U); } c.restore(); }
    // the banner shatters into shards
    if (out > 0) { c.save(); for (const s of r.shards) { const k = out, x = s.x * W + s.vx * k * W * .4, y = H * .5 + s.y * H + s.vy * k * H * .5, w = s.s * W; c.translate(x, y); c.rotate(s.r * k); c.globalAlpha = 1 - k; c.fillStyle = `rgb(${s.vx > 0 ? r.light : r.rgb})`; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(0, -w / 3); c.lineTo(w / 2, w / 6); c.closePath(); c.fill(); c.setTransform(1, 0, 0, 1, 0, 0); } c.restore(); }
    // the closing flash
    if (t > 1300 && t < 1600) { const k = 1 - Math.abs(t - 1420) / 180; if (k > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(.85, k) * (SETTINGS.flashes === false ? .25 : 1)})`; c.fillRect(0, 0, W, H); } }
    requestAnimationFrame(frame);
  }

  /* ---------- take over the Z-Move hooks (the battle code's timing is unchanged) ---------- */
  VFX.zStart = (S, monName, zName, zType) => { cinematic(S, monName, zName, zType); try { VFX.shake(3, 600); } catch (e) { } try { if (typeof sfx === 'function') sfx('mega'); } catch (e) { } start(S, monName, zType); };
  const _zImpact = VFX.zImpact; VFX.zImpact = (S, zType) => { try { VFX.shake(22, 900); } catch (e) { } const z = ZN.find(q => q.S === S); if (z) climax(z); };
  window.ZFX2 = { COMBO, ARCH, start, climax, ZN };
})();
