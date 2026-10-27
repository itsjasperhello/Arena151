/* =====================================================================
   Section 25: rebuilt contact and dash moves (milestone 3)
   Same particle engine (fxparticles.js). Each move gets a trail or aura
   around the attacker while it charges in (the 'dash' hook, every tick),
   a launch flare ('exec'), and a themed impact layered on the existing hit.
   ===================================================================== */
(function fxParticles3() {
  const P = window.PFX, P2 = window.PFX2; if (!P || !P2) return;
  const { spawn, due, fireTex, hueTex, colTex, smokeTex, steamTex, QMUL } = P, HIT = P2.HIT;
  const T = Math.PI * 2, rnd = (a, b) => a + Math.random() * (b - a);
  const me = S => { const sd = side(S); return { i: bx(sd.x), j: by(sd.y - 22), feet: by(sd.y), face: sd.face || 1 }; };
  const hitAt = S => { const h = headOf(S); return { i: bx(h.x), j: by(h.y + 10) }; };
  const foeOf = S => (S === 'A' ? 'B' : 'A');
  const N = n => Math.max(1, Math.round(n * QMUL()));
  const RATE = {}; const tick = (S, perSec) => due(RATE[S] || (RATE[S] = {}), perSec);
  const around = (m, rx = 14, ry = 18) => { const a = rnd(0, T); return { x: m.i + Math.cos(a) * rx * rnd(.3, 1), y: m.j + Math.sin(a) * ry * rnd(.3, 1) }; };

  /* ---------- trails and auras while charging in ---------- */
  const TRAIL = {
    dust: S => { const m = me(S); for (let n = tick(S, 40); n > 0; n--) spawn({ x: m.i - m.face * rnd(4, 14), y: m.feet + rnd(-2, 2), vx: -m.face * rnd(20, 60), vy: -rnd(10, 30), drag: .96, max: rnd(.4, .7), r: rnd(4, 8), grow: 1.3, img: smokeTex(), a: .45, add: false }); },
    speed: (S, col = '#ffffff') => { const m = me(S); for (let n = tick(S, 70); n > 0; n--) { const y = m.j + rnd(-18, 18); spawn({ x: m.i - m.face * rnd(0, 10), y, vx: -m.face * rnd(220, 380), vy: 0, drag: .9, max: rnd(.12, .22), r: 1, len: rnd(16, 30), lw: rnd(1, 2), kind: 'streak', col, a: .9, add: true }); } },
    fire: (S, big) => { const m = me(S); for (let n = tick(S, big ? 400 : 90); n > 0; n--) { const p = big ? around(m, 22, 28) : { x: m.i + m.face * 10 + rnd(-5, 5), y: m.j + rnd(-5, 5) };
      spawn({ x: p.x, y: p.y, vx: -m.face * rnd(30, 90), vy: -rnd(30, 90), drag: .94, ay: -60, max: rnd(.35, .6), r: rnd(big ? 8 : 4, big ? 16 : 7), grow: .6, img: fireTex(rnd(12, 42) | 0), a: 1, add: true }); } },
    elec: (S, big) => { const m = me(S); for (let n = tick(S, big ? 200 : 50); n > 0; n--) { const p = big ? around(m, 22, 28) : { x: m.i + m.face * 10, y: m.j };
      spawn({ x: p.x, y: p.y, vx: rnd(-80, 80), vy: rnd(-80, 80), drag: .88, max: rnd(.15, .3), r: rnd(2, 4), grow: .2, img: colTex(Math.random() < .3 ? '#ffffff' : '#ffe84a', 1), a: 1, add: true });
      if (Math.random() < (big ? .6 : .15)) { const x0 = p.x, y0 = p.y, ang = rnd(0, T), L = rnd(8, 18); spawn({ x: x0, y: y0, vx: 0, vy: 0, drag: 1, max: .09, r: 1, kind: 'fn', a: 1, draw: (c) => { c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#fff6a0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, y0); for (let k = 1; k <= 4; k++) c.lineTo(x0 + Math.cos(ang) * L * k / 4 + rnd(-3, 3), y0 + Math.sin(ang) * L * k / 4 + rnd(-3, 3)); c.stroke(); } }); } } },
    water: (S, big) => { const m = me(S); for (let n = tick(S, big ? 160 : 90); n > 0; n--) { const p = around(m, 16, 22);
      spawn({ x: p.x, y: big ? m.feet - rnd(0, 6) : p.y, vx: -m.face * rnd(10, 50) + rnd(-20, 20), vy: big ? -rnd(90, 180) : rnd(-40, 20), drag: .97, ay: 300, max: rnd(.35, .7), r: rnd(1.3, 2.4), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#cfeeff' : '#7fd0ff', a: 1, add: true });
      if (Math.random() < .3) spawn({ x: p.x, y: p.y, vx: -m.face * 30, vy: -10, drag: .97, max: rnd(.4, .7), r: rnd(5, 9), grow: 1, img: steamTex(), a: .5, add: false }); } },
    ice: S => { const m = me(S); for (let n = tick(S, 60); n > 0; n--) spawn({ x: m.i + m.face * 10 + rnd(-6, 6), y: m.j + rnd(-6, 6), vx: -m.face * rnd(20, 60), vy: rnd(-20, 20), drag: .94, max: rnd(.35, .6), r: rnd(2, 4), grow: .2, kind: 'shard', col: Math.random() < .5 ? '#ffffff' : '#aef0ff', rot: rnd(0, T), vr: rnd(-6, 6), a: 1, add: true }); },
    aura: (S, hue, sat = 95, big = false) => { const m = me(S); for (let n = tick(S, big ? 300 : 110); n > 0; n--) { const p = around(m, big ? 24 : 16, big ? 30 : 22);
      spawn({ x: p.x, y: p.y, vx: -m.face * rnd(30, 80), vy: -rnd(20, 70), drag: .94, ay: -40, max: rnd(.3, .55), r: rnd(4, big ? 10 : 7), grow: .6, img: hueTex((hue + rnd(-12, 12)) | 0, sat, 62), a: 1, add: true }); } },
    smoke: (S, col = 'dark') => { const m = me(S); for (let n = tick(S, 60); n > 0; n--) { const p = around(m, 16, 20); spawn({ x: p.x, y: p.y, vx: -m.face * rnd(20, 60), vy: -rnd(10, 40), drag: .96, max: rnd(.5, .8), r: rnd(5, 9), grow: 1.2, img: smokeTex(), a: .7, add: false }); } },
    rock: S => { const m = me(S); for (let n = tick(S, 70); n > 0; n--) { const a = clock.t / 60 + rnd(0, 1); spawn({ x: m.i + Math.cos(a) * 16, y: m.j + Math.sin(a) * 10, vx: -m.face * rnd(40, 90), vy: -rnd(10, 60), drag: .96, ay: 200, max: rnd(.4, .7), r: rnd(1.6, 3), grow: 0, kind: 'drop', col: Math.random() < .5 ? '#8a6a40' : '#b89a6a', a: 1, add: false }); }
      TRAIL.dust(S); }
  };

  /* ---------- impacts ---------- */
  function fist(S, col = '#ffffff', size = 1) { const h = hitAt(S); spawn({ x: h.i, y: h.j, vx: 0, vy: 0, drag: 1, max: .22, r: 1, kind: 'fn', a: 1, draw: (c, q) => { const g = c.createRadialGradient(h.i, h.j, 0, h.i, h.j, 26 * size * (.6 + q)); g.addColorStop(0, `rgba(255,255,255,${1 - q})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(h.i, h.j, 26 * size * (.6 + q), 0, T); c.fill(); } });
    for (let k = 0; k < N(14 * size); k++) { const a = rnd(0, T), v = rnd(180, 360) * size; spawn({ x: h.i + Math.cos(a) * 6, y: h.j + Math.sin(a) * 6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: .86, max: rnd(.15, .28), r: 1, len: rnd(10, 22) * size, lw: rnd(1.2, 2.4), kind: 'streak', col, a: 1, add: true }); }
    HIT.ring(S, col, 2); }
  function dustCloud(S, n = 14, big = 1) { const h = hitAt(S); for (let k = 0; k < N(n); k++) { const a = rnd(0, T); spawn({ x: h.i + Math.cos(a) * 8, y: h.j + 14 + Math.sin(a) * 4, vx: Math.cos(a) * rnd(30, 90) * big, vy: Math.sin(a) * rnd(10, 30) - 15, drag: .95, max: rnd(.5, .9), r: rnd(6, 11) * big, grow: 1.3, img: tex2('dust'), a: .55, add: false }); } }
  const tex2 = k => P.tex('dust', [[0, 'rgba(200,180,150,.6)'], [.5, 'rgba(180,160,130,.3)'], [1, 'rgba(160,140,110,0)']]);
  function groundRing(S, col = '#e8d8b8') { const h = hitAt(S); spawn({ x: h.i, y: h.j + 18, vx: 0, vy: 0, drag: 1, max: .45, r: 8, grow: 7, kind: 'ring', col, lw: 2.4, squash: .35, a: .9, add: false }); }
  // jaws snapping shut on the target (Bite, Crunch, Bug Bite)
  function jaws(S, col = '#ffffff', size = 1, dark = false) { const h = hitAt(S); spawn({ x: h.i, y: h.j, vx: 0, vy: 0, drag: 1, max: .5, r: 1, kind: 'fn', a: 1, draw: (c, q) => {
    const close = Math.min(1, q / .3), gap = (1 - close) * 22 * size + 2, fade = q > .6 ? 1 - (q - .6) / .4 : 1, w = 30 * size;
    if (dark) { c.globalAlpha = .45 * fade; c.fillStyle = '#1a0a24'; c.beginPath(); c.ellipse(h.i, h.j, w * 1.1, 18 * size, 0, 0, T); c.fill(); }
    c.globalAlpha = fade; c.fillStyle = col; c.strokeStyle = dark ? '#3a1a4a' : '#5a5a6a'; c.lineWidth = 1;
    for (const dir of [-1, 1]) { c.beginPath(); const y0 = h.j + dir * gap; c.moveTo(h.i - w, y0 + dir * 4); for (let k = 0; k <= 6; k++) { const x = h.i - w + k * (w * 2 / 6), tipY = y0 - dir * 10 * size * (k % 6 === 0 ? .5 : 1); c.lineTo(x - w / 6 * .5, y0); c.lineTo(x, tipY); } c.lineTo(h.i + w, y0 + dir * 4); c.closePath(); c.fill(); c.stroke(); }
    if (close >= 1 && q < .4) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - (q - .3) / .1; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(h.i, h.j, 8 * size, 0, T); c.fill(); } } });
    setTimeoutGame(150, () => { HIT.ring(S, dark ? '#a070ff' : '#ffffff', 2); for (let k = 0; k < N(10); k++) { const a = rnd(0, T); spawn({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(100, 220), vy: Math.sin(a) * rnd(100, 220), drag: .88, max: .2, r: 1, len: 12, lw: 1.6, kind: 'streak', col: dark ? '#c8a0ff' : '#ffffff', a: 1, add: true }); } }); }
  // shapes for Play Rough
  function heartOrStar(S) { const h = hitAt(S); for (let k = 0; k < N(10); k++) { const a = rnd(0, T), v = rnd(60, 140), heart = k % 2 === 0, x0 = h.i, y0 = h.j, vx = Math.cos(a) * v, vy = Math.sin(a) * v - 40, sz = rnd(4, 6);
    spawn({ x: x0, y: y0, vx, vy, drag: .94, ay: 120, max: rnd(.6, .9), r: 1, kind: 'fn', a: 1, draw: (c, q, p, op) => { c.globalAlpha = op; c.translate(p.x, p.y); c.fillStyle = heart ? '#ff6ac0' : '#ffe24a'; c.beginPath();
      if (heart) { c.moveTo(0, sz * .9); c.bezierCurveTo(-sz * 1.4, -sz * .2, -sz * .6, -sz * 1.2, 0, -sz * .4); c.bezierCurveTo(sz * .6, -sz * 1.2, sz * 1.4, -sz * .2, 0, sz * .9); }
      else for (let s = 0; s < 10; s++) { const r = s % 2 ? sz * .45 : sz, an = -Math.PI / 2 + s * Math.PI / 5; s ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(Math.cos(an) * r, Math.sin(an) * r); }
      c.closePath(); c.fill(); } }); } }
  function feathers(S, col = '#e8f4ff', n = 14) { const h = hitAt(S); for (let k = 0; k < N(n); k++) { const a = rnd(0, T), v = rnd(60, 160); spawn({ x: h.i, y: h.j, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, drag: .93, ay: 40, max: rnd(.7, 1.1), r: rnd(3, 5), grow: .1, kind: 'shard', col, rot: rnd(0, T), vr: rnd(-3, 3), a: 1, add: false }); } }
  function auraBurst(S, hue, n = 40, sat = 95) { const h = hitAt(S); for (let k = 0; k < N(n); k++) { const a = rnd(0, T); spawn({ x: h.i, y: h.j, vx: Math.cos(a) * rnd(60, 200), vy: Math.sin(a) * rnd(60, 200), drag: .92, max: rnd(.3, .6), r: rnd(4, 9), grow: .6, img: hueTex((hue + rnd(-15, 15)) | 0, sat, 62), a: 1, add: true }); } }
  // Close Combat: a flurry of blows around the target
  function flurry(S, n = 6) { const h0 = hitAt(S); for (let k = 0; k < n; k++) setTimeoutGame(k * 80, () => { const h = { i: h0.i + rnd(-14, 14), j: h0.j + rnd(-12, 12) }; const fake = { i: h.i, j: h.j };
    spawn({ x: fake.i, y: fake.j, vx: 0, vy: 0, drag: 1, max: .16, r: 1, kind: 'fn', a: 1, draw: (c, q) => { const r = 16 * (.5 + q); const g = c.createRadialGradient(fake.i, fake.j, 0, fake.i, fake.j, r); g.addColorStop(0, `rgba(255,240,200,${1 - q})`); g.addColorStop(1, 'rgba(255,160,60,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(fake.i, fake.j, r, 0, T); c.fill(); } });
    for (let s = 0; s < N(6); s++) { const a = rnd(0, T); spawn({ x: fake.i, y: fake.j, vx: Math.cos(a) * rnd(160, 300), vy: Math.sin(a) * rnd(160, 300), drag: .86, max: .16, r: 1, len: 12, lw: 1.8, kind: 'streak', col: '#ffd0a0', a: 1, add: true }); }
    if (typeof VFX !== 'undefined' && VFX.shake) VFX.shake(3, 80); }); }

  /* ---------- register ---------- */
  const reg = (names, r) => { for (const n of names.split('|')) { const old = MFX[n] || {}, o = Object.assign({}, old);
    if (r.dash) o.dash = (S, mv) => { try { r.dash(S, mv); } catch (e) { console.error(e); } };
    if (r.exec) { const prev = old.exec; o.exec = (S, mv) => { if (prev) try { prev(S, mv); } catch (e) { console.error(e); } try { r.exec(S, mv); } catch (e) { console.error(e); } }; }
    if (r.impact) { const prev = old.impact; o.impact = (S, mv, crit, eff) => { if (prev) try { prev(S, mv, crit, eff); } catch (e) { console.error(e); } try { r.impact(S, mv, crit, eff); } catch (e) { console.error(e); } }; }
    MFX[n] = o; } };
  const flare = (hue, sat = 95) => S => { const m = me(S); for (let k = 0; k < N(16); k++) { const a = rnd(0, T); spawn({ x: m.i, y: m.j, vx: Math.cos(a) * rnd(40, 120), vy: Math.sin(a) * rnd(40, 120), drag: .9, max: rnd(.25, .4), r: rnd(3, 6), grow: .5, img: hueTex(hue, sat, 66), a: 1, add: true }); } };

  reg('Tackle|Headbutt', { dash: S => { TRAIL.dust(S); TRAIL.speed(S); }, impact: S => { fist(S); dustCloud(S, 8); } });
  reg('Body Slam', { dash: S => { TRAIL.dust(S); TRAIL.speed(S); }, impact: S => { fist(S, '#ffffff', 1.4); groundRing(S); dustCloud(S, 18, 1.3); VFX.shake && VFX.shake(6, 180); } });
  reg('Double-Edge', { dash: S => { TRAIL.dust(S); TRAIL.speed(S, '#ffd8a0'); }, impact: S => { fist(S, '#ffd8a0', 1.3); HIT.spark(S, '#ffb050', 24); HIT.spark(foeOf(S), '#ffb050', 10); } });
  reg('Fire Punch', { dash: S => TRAIL.fire(S), exec: flare(25), impact: S => { fist(S, '#ffd080'); HIT.fire(S, 44); HIT.smoke(S, 8); } });
  reg('Flare Blitz', { dash: S => TRAIL.fire(S, true), exec: flare(20), impact: S => { fist(S, '#ffd080', 1.4); HIT.fire(S, 80); HIT.smoke(S, 16); HIT.ring(S, '#ffb040', 3); VFX.shake && VFX.shake(8, 220); } });
  reg('Waterfall', { dash: S => TRAIL.water(S, true), exec: flare(205), impact: S => { fist(S, '#cfeeff', 1.2); HIT.water(S, 46); HIT.ring(S, '#bfe8ff', 3); } });
  reg('Thunder Punch', { dash: S => TRAIL.elec(S), exec: flare(52), impact: S => { fist(S, '#fff6a0'); HIT.spark(S, '#ffe84a', 36); } });
  reg('Volt Tackle', { dash: S => { TRAIL.elec(S, true); TRAIL.speed(S, '#fff6a0'); }, exec: flare(52), impact: S => { fist(S, '#fff6a0', 1.4); HIT.spark(S, '#ffe84a', 60); HIT.ring(S, '#fff4a0', 3); VFX.shake && VFX.shake(7, 200); } });
  reg('Ice Punch', { dash: S => TRAIL.ice(S), exec: flare(195, 80), impact: S => { fist(S, '#e4fbff'); HIT.shards(S, ['#ffffff', '#aef0ff', '#5ccfee'], 26); } });
  reg('Brick Break', { dash: S => TRAIL.aura(S, 22, 90), exec: flare(22), impact: S => { fist(S, '#ffe0b0', 1.2); HIT.shards(S, ['#c86a3a', '#e8a070', '#8a4a2a'], 18); dustCloud(S, 8); } });
  reg('Close Combat', { dash: S => TRAIL.aura(S, 22, 90, true), exec: flare(22), impact: S => { flurry(S, 6); setTimeoutGame(520, () => fist(S, '#ffe0b0', 1.5)); } });
  reg('Mach Punch', { dash: S => TRAIL.speed(S, '#ffd8a0'), exec: flare(30), impact: S => fist(S, '#ffe0b0', 1.1) });
  reg('Poison Jab', { dash: S => TRAIL.aura(S, 280), exec: flare(280), impact: S => { fist(S, '#e0b0ff'); HIT.goo(S, '#a050e0', 18); } });
  reg('Drill Run', { dash: S => TRAIL.rock(S), impact: S => { fist(S, '#e8d8b8'); HIT.shards(S, ['#8a6a40', '#b89a6a', '#5a4a30'], 20); dustCloud(S, 12); } });
  reg('Peck', { dash: S => TRAIL.speed(S), impact: S => fist(S, '#ffffff', .8) });
  reg('Drill Peck', { dash: S => { TRAIL.speed(S); const m = me(S); if (Math.random() < .4) spawn({ x: m.i + m.face * 12, y: m.j, vx: 0, vy: 0, drag: 1, max: .2, r: 4, grow: 2, kind: 'ring', col: '#ffffff', lw: 1.4, squash: 2.4, rot: Math.PI / 2, a: .9, add: true }); }, impact: S => { fist(S, '#ffffff', 1.1); HIT.ring(S, '#ffffff', 3); } });
  reg('Brave Bird', { dash: S => { TRAIL.aura(S, 205, 90, true); TRAIL.speed(S, '#d8f0ff'); }, exec: flare(205), impact: S => { fist(S, '#d8f0ff', 1.5); feathers(S, '#eaf6ff', 18); auraBurst(S, 205, 50); VFX.shake && VFX.shake(8, 220); } });
  reg('Zen Headbutt', { dash: S => TRAIL.aura(S, 300, 85), exec: flare(300), impact: S => { fist(S, '#ffd0f0'); HIT.ring(S, '#ff9ae0', 3); auraBurst(S, 300, 30); } });
  reg('Bug Bite', { dash: S => TRAIL.speed(S, '#d8f080'), impact: S => { jaws(S, '#e8ffb0', .75); HIT.shards(S, ['#d0f04a', '#86a82a'], 10); } });
  reg('Lick', { dash: S => TRAIL.aura(S, 270, 70), impact: S => { auraBurst(S, 270, 26, 70); HIT.smoke(S, 10); } });
  reg('Outrage', { dash: S => { TRAIL.aura(S, 8, 95, true); TRAIL.smoke(S); }, exec: flare(5), impact: S => { for (let k = 0; k < 3; k++) setTimeoutGame(k * 140, () => { fist(S, '#ffb0a0', 1.2); auraBurst(S, 8, 30); }); VFX.shake && VFX.shake(8, 400); } });
  reg('Iron Tail', { dash: S => { TRAIL.speed(S, '#e8f0ff'); const m = me(S); if (Math.random() < .5) spawn({ x: m.i + rnd(-10, 10), y: m.j + rnd(-12, 12), vx: rnd(-20, 20), vy: rnd(-20, 20), drag: .9, max: .3, r: rnd(2, 4), grow: .2, kind: 'shard', col: '#ffffff', rot: rnd(0, T), vr: 8, a: 1, add: true }); }, impact: S => { fist(S, '#e8f0ff', 1.2); HIT.shards(S, ['#ffffff', '#c6d2de', '#8896a8'], 20); } });
  reg('Play Rough', { dash: S => TRAIL.aura(S, 325, 85), impact: S => { dustCloud(S, 16, 1.2); heartOrStar(S); fist(S, '#ffd0f0'); } });
  reg('Bite', { dash: S => TRAIL.speed(S), impact: S => jaws(S, '#ffffff', 1, false) });
  reg('Crunch', { dash: S => TRAIL.smoke(S), impact: S => { jaws(S, '#f0e8ff', 1.25, true); HIT.smoke(S, 10); } });
  // dashes
  reg('Quick Attack', { dash: S => { TRAIL.speed(S); TRAIL.dust(S); }, impact: S => fist(S, '#ffffff', .9) });
  reg('Extreme Speed', { dash: S => { TRAIL.speed(S, '#fff0a0'); TRAIL.speed(S, '#ffffff'); }, exec: flare(48), impact: S => { fist(S, '#fff0a0', 1.4); HIT.ring(S, '#fff0a0', 3); auraBurst(S, 48, 30); } });
  reg('Aqua Jet', { dash: S => { TRAIL.water(S); TRAIL.speed(S, '#cfeeff'); }, impact: S => { fist(S, '#cfeeff'); HIT.water(S, 30); } });
  window.PFX3 = { TRAIL, fist, jaws, flurry };
})();
