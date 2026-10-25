/* =====================================================================
   Section 23: hand-animated pixel-art moves
   Modelled on the look of the Pokémon Battlegrounds fights: crisp pixel art with dark outlines,
   a few flat colours per effect, animation on "twos" (a new drawing about every 80 ms),
   smear and impact frames, hit-stop and screen shake. Each move below is drawn by its own code
   and shares nothing with the others except the four tiny pixel-plotting helpers.
   Everything is drawn on whole art pixels, so it stays sharp at any zoom.
   ===================================================================== */
(function pixelMoves() {
  const R = Math.round, T = Math.PI * 2, F = ms => Math.floor(clock.t / ms), rnd = (a, b) => a + Math.random() * (b - a), hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // the only shared tools: plot a rectangle, a disc, a line and an outlined disc on whole pixels
  let AL = 1;   // opacity used by the plotting helpers (smoke and fades set it, then put it back)
  const px = (i, j, w, h, c) => { bctx.globalAlpha = AL; bctx.fillStyle = c; bctx.fillRect(R(i), R(j), w, h); };
  const disc = (i, j, r, c) => { i = R(i); j = R(j); bctx.globalAlpha = AL; bctx.fillStyle = c; for (let y = -r; y <= r; y++) { const w = R(Math.sqrt(Math.max(0, r * r - y * y + .3))); bctx.fillRect(i - w, j + y, w * 2 + 1, 1); } };
  const line = (i0, j0, i1, j1, c, w = 1) => { const n = Math.max(1, R(Math.hypot(i1 - i0, j1 - j0))); bctx.globalAlpha = AL; bctx.fillStyle = c; for (let k = 0; k <= n; k++) bctx.fillRect(R(i0 + (i1 - i0) * k / n), R(j0 + (j1 - j0) * k / n), w, w); };
  const ball = (i, j, r, out, fill) => { disc(i, j, r + 1, out); disc(i, j, r, fill); };
  const tg = S => { const h = headOf(S); return { x: h.x, y: h.y + 10, i: bx(h.x), j: by(h.y + 10) }; };
  const blen = (b, max) => Math.min(b.cl ? Math.max(1, b.clip) / 2 : max, 450 * Math.min(1, (b.t / b.life) / .18));
  const fadeOf = b => { const q = b.t / b.life; return q > .72 ? Math.max(.15, (1 - q) / .28) : 1; };
  const pixelBurst = (x, y, n, c0, c1, v, g, life) => { const seeds = Array.from({ length: n }, (_, k) => ({ a: hash(k + x) * T, v: v * (.5 + hash(k * 3 + y)), s: 1 + (k % 3 === 0 ? 1 : 0), c: k % 2 ? c0 : c1 })); return ent(life, q => { const t = q * life / 1000; for (const p of seeds) px(bx(x) + Math.cos(p.a) * p.v * t * .5, by(y) + Math.sin(p.a) * p.v * t * .5 + g * t * t * .25, p.s, p.s, p.c); }); };
  const setFx = (names, r) => { for (const n of names.split('|')) MFX[n] = Object.assign({}, MFX[n] || {}, r); };

  /* ---------- FIRE ---------- */
  // Flamethrower: a stream of outlined flame blobs that swell as they travel, flicker every frame, and end in licks and smoke
  setFx('Flamethrower', {
    beam(b) {
      const len = blen(b, 250), fd = fadeOf(b), fr = F(80), ca = Math.cos(b.ang), sa = Math.sin(b.ang), i0 = bx(b.x), j0 = by(b.y);
      for (let pass = 0; pass < 4; pass++) for (let d = len; d >= 0; d -= 3) {
        const f = d / Math.max(1, len), w = (3 + d * .075) * fd, wob = Math.sin(d * .11 - fr * 1.9) * (1 + d * .02), x = i0 + ca * d - sa * wob, y = j0 + sa * d + ca * wob;
        const cols = ['#6a0e08', '#d8341a', '#ff8a1e', '#ffd83a'], rad = [w + 1.5, w, w * .68 + (fr % 2), w * .36];
        if (pass === 3 && f > .5) continue; disc(x, y, Math.max(1, R(rad[pass])), pass === 3 && f < .12 ? '#fff6c8' : cols[pass]);
      }
      for (let k = 0; k < 5; k++) { const d = len - k * 4 - (fr % 2) * 3, x = i0 + ca * d + (k - 2) * -sa * 5, y = j0 + sa * d + (k - 2) * ca * 5; line(x, y, x + ca * 9 + (k % 2 ? 2 : -2), y + sa * 9 - 4, '#ff8a1e', 2); }
      for (let k = 0; k < 4; k++) px(i0 + ca * (len + 6 + k * 5) + (k * 3 - 4), j0 + sa * (len + 6 + k * 5) - (k * 5 + fr % 4) , 4, 4, k < 2 ? '#7a7a86' : '#4a4a56');
    },
    impact: S => { const h = tg(S), s = hash(F(1)); pixelBurst(h.x, h.y + 8, 14, '#ffd83a', '#ff5a14', 160, 120, 650); ent(700, q => { const fr = Math.min(3, Math.floor(q * 4.5)); for (let k = 0; k < 5; k++) { const x = h.i + (k - 2) * 6, hh = R((10 + (k % 2) * 6) * (fr < 3 ? (fr + 1) / 3 : 1 - (q - .66) * 3)); if (hh > 0) { px(x - 3, h.j + 12 - hh, 6, hh, '#6a0e08'); px(x - 2, h.j + 12 - hh + 1, 4, hh - 1, '#ff8a1e'); px(x - 1, h.j + 12 - hh + 3, 2, Math.max(0, hh - 4), '#ffd83a'); } } }); }
  });
  // Ember: three little fireballs that tumble around each other with a spark trail
  setFx('Ember', {
    shot(p) { const i = bx(p.x), j = by(p.y), fr = F(70), a = Math.atan2(p.vy, p.vx);
      for (let k = 0; k < 3; k++) { const ph = fr * .9 + k * 2.09, ox = Math.cos(ph) * 5, oy = Math.sin(ph) * 5; for (let t = 5; t >= 1; t--) px(i + ox - Math.cos(a) * t * 3 - 1, j + oy - Math.sin(a) * t * 3 - 1, 3 - (t > 3 ? 1 : 0), 3 - (t > 3 ? 1 : 0), t > 3 ? '#a8260e' : '#ff5a14'); ball(i + ox, j + oy, 3, '#8a1a0a', '#ff8a1e'); disc(i + ox, j + oy, 1, '#fff2a0'); px(i + ox - 1, j + oy - 6 - (fr + k) % 2, 2, 3, '#ffd83a'); } },
    impact: S => { const h = tg(S); ent(420, q => { const r = 3 + R(q * 14); for (let k = 0; k < 8; k++) { const a = k * .785 + .4, d = r + (k % 2) * 4; px(h.i + Math.cos(a) * d, h.j + Math.sin(a) * d * .8, 3, 3, k % 2 ? '#ffd83a' : '#ff5a14'); } if (q < .3) disc(h.i, h.j, R(7 * (1 - q * 3)), '#fff2a0'); }); }
  });
  // Fire Blast: a big fireball with five flame spikes; it bursts into the burning 大 character
  setFx('Fire Blast', {
    shot(p) { const i = bx(p.x), j = by(p.y), fr = F(60), a = fr * .4; for (let k = 0; k < 5; k++) { const an = a + k * T / 5, ex = i + Math.cos(an) * 16, ey = j + Math.sin(an) * 16; line(i, j, ex, ey, '#6a0e08', 5); line(i, j, ex, ey, '#ff5a14', 3); line(i, j, i + (ex - i) * .6, j + (ey - j) * .6, '#ffd83a', 1); }
      ball(i, j, 9, '#6a0e08', '#d8341a'); disc(i, j, 7, '#ff8a1e'); disc(i - 1, j - 1, 4, '#ffd83a'); disc(i - 2, j - 2, 2, '#fff6c8'); },
    impact: S => { const h = tg(S); hitstop(120); VFX.shake(12, 380);
      ent(1100, q => { const st = Math.min(1, q * 5), fade = q > .72 ? 1 - (q - .72) / .28 : 1, strokes = [[-26, 0, 26, 0], [0, -26, 0, 0], [0, 0, -20, 24], [0, 0, 20, 24]];
        if (q < .12) { disc(h.i, h.j, 18, '#fff6c8'); return; }
        for (const [x0, y0, x1, y1] of strokes) { const xe = x0 + (x1 - x0) * st, ye = y0 + (y1 - y0) * st; bctx.globalAlpha = fade; line(h.i + x0, h.j + y0, h.i + xe, h.j + ye, '#6a0e08', 9); line(h.i + x0, h.j + y0, h.i + xe, h.j + ye, '#d8341a', 7); line(h.i + x0, h.j + y0, h.i + xe, h.j + ye, '#ff8a1e', 5); line(h.i + x0, h.j + y0, h.i + xe, h.j + ye, '#ffd83a', 2); }
        bctx.globalAlpha = fade; for (let k = 0; k < 7; k++) { const sx = h.i + (hash(k * 5 + F(90)) - .5) * 52, sy = h.j + (hash(k * 9 + F(90)) - .5) * 40; px(sx, sy - (F(90) + k) % 4 * 2, 3, 5, k % 2 ? '#ff8a1e' : '#ffd83a'); } bctx.globalAlpha = 1; }); }
  });

  /* ---------- ELECTRIC ---------- */
  // Thunderbolt: a thick jagged bolt that is redrawn with a new shape every frame, with a spark crown on the ground
  const boltPts = (x, top, y, seed, n = 9, amp = 11) => { const pts = [[x, top]]; for (let k = 1; k < n; k++) pts.push([x + (hash(seed + k * 7.3) - .5) * 2 * amp * (k < n - 1 ? 1 : .2), top + (y - top) * k / n]); pts.push([x, y]); return pts; };
  const drawBolt = (pts, wOut, cOut, wMid, cMid, wIn, cIn) => { for (const [w, c] of [[wOut, cOut], [wMid, cMid], [wIn, cIn]]) for (let k = 1; k < pts.length; k++) line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], c, w); };
  setFx('Thunderbolt', {
    impact: S => { const h = tg(S); hitstop(90); screenFlash('#fffbd0', .5);
      ent(480, (q, age) => { const sd = F(60) * 13, pts = boltPts(h.i, h.j - 150, h.j + 12, sd, 9, 12), fade = q > .7 ? 1 - (q - .7) / .3 : 1; bctx.globalAlpha = fade; drawBolt(pts, 7, '#5a3a00', 5, '#ffd52a', 2, '#ffffff');
        for (let b = 0; b < 3; b++) { const p = pts[2 + b * 2], dir = b % 2 ? 1 : -1; line(p[0], p[1], p[0] + dir * 14, p[1] + 9, '#5a3a00', 4); line(p[0], p[1], p[0] + dir * 14, p[1] + 9, '#ffe84a', 2); }
        for (let k = 0; k < 8; k++) { const a = k * .785 + (F(70) % 2) * .39; line(h.i + Math.cos(a) * 8, h.j + 12 + Math.sin(a) * 4, h.i + Math.cos(a) * (16 + (k % 2) * 8), h.j + 12 + Math.sin(a) * (8 + (k % 2) * 4), '#fff07a', 2); } bctx.globalAlpha = 1; }); }
  });
  // Thunder: a pixel storm cloud gathers over the target and a huge bolt hits with a white-out frame
  setFx('Thunder', {
    markDraw(mk, q) { const i = bx(mk.x), j = by(mk.y), top = j - 120, cl = (cx, cy, r, c) => disc(cx, cy, r, c);
      if (q < .78) { dim(.28 * Math.min(1, q * 3), 300, '10,10,30'); const gr = Math.min(1, q * 2.6); for (let k = 0; k < 7; k++) { const ox = (k - 3) * 11 * gr, oy = (k % 2) * 5, r = R((8 + (k % 3) * 3) * gr); cl(i + ox, top + oy + 2, r + 1, '#1a1a2a'); } for (let k = 0; k < 7; k++) { const ox = (k - 3) * 11 * gr, oy = (k % 2) * 5, r = R((8 + (k % 3) * 3) * gr); cl(i + ox, top + oy, r, k % 2 ? '#4a4a60' : '#5a5a72'); } if (F(100) % 3 === 0) line(i - 12, top + 8, i - 6, top + 16, '#ffe84a', 1);
        for (let k = 0; k < 12; k++) { const a = k / 12 * T; px(i + Math.cos(a) * mk.r / 2, j + Math.sin(a) * mk.r / 3, 2, 2, F(120) % 2 ? '#ffe84a' : '#ffffff'); } }
      else { const f = (q - .78) / .22; if (f < .18) { px(0, 0, 4000, 4000, '#ffffff'); return; } const pts = boltPts(i, top + 6, j + 6, F(55) * 17, 11, 14), fd = 1 - f * .8; bctx.globalAlpha = fd; drawBolt(pts, 13, '#5a3a00', 9, '#ffd52a', 4, '#ffffff'); for (let b = 0; b < 4; b++) { const p = pts[2 + b * 2], d = b % 2 ? 1 : -1; line(p[0], p[1], p[0] + d * 26, p[1] + 18, '#5a3a00', 6); line(p[0], p[1], p[0] + d * 26, p[1] + 18, '#ffe84a', 3); } for (let k = 0; k < 10; k++) { const a = k / 10 * T; line(i + Math.cos(a) * 10, j + Math.sin(a) * 5, i + Math.cos(a) * 36, j + Math.sin(a) * 18, '#fff07a', 3); } bctx.globalAlpha = 1; } },
    mark: mk => setTimeoutGame(Math.max(0, mk.delay * .78), () => { screenFlash('#ffffff', .8); VFX.shake(16, 480); hitstop(100); }),
    impact: S => { const h = tg(S); ent(450, q => { const r = 6 + R(q * 46); for (let k = 0; k < 30; k++) { const a = k / 30 * T; px(h.i + Math.cos(a) * r, h.j + 10 + Math.sin(a) * r * .5, 3, 3, k % 2 ? '#fff07a' : '#ffb300'); } }); }
  });

  /* ---------- WATER ---------- */
  // Water Gun: a chunky droplet bolt with a white glint and a chain of small drops behind it
  setFx('Water Gun', {
    shot(p) { const i = bx(p.x), j = by(p.y), a = Math.atan2(p.vy, p.vx), fr = F(70);
      for (let k = 4; k >= 1; k--) { const o = (fr + k) % 2 ? 1 : -1; ball(i - Math.cos(a) * k * 6, j - Math.sin(a) * k * 6 + o, Math.max(1, 3 - k % 3), '#1a3f9a', '#4aa4ff'); }
      ball(i, j, 5, '#1a3f9a', '#2f7ae8'); disc(i + 1, j + 1, 3, '#4aa4ff'); px(i - 3, j - 3, 2, 2, '#ffffff'); px(i - 1, j - 4, 1, 1, '#ffffff'); },
    impact: S => { const h = tg(S); hitstop(60); ent(520, q => { const t = q * .52; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k - 4.5) * .34, v = 70 + (k % 3) * 25; ball(h.i + Math.cos(a) * v * t * .6, h.j + 6 + Math.sin(a) * v * t * .6 + 220 * t * t * .35, 2 - (q > .6 ? 1 : 0), '#1a3f9a', '#7fc8ff'); } for (let k = 0; k < 2; k++) { const r = 4 + R((q + k * .3) % 1 * 22); for (let n = 0; n < 16; n++) { const a = n / 16 * T; px(h.i + Math.cos(a) * r, h.j + 12 + Math.sin(a) * r * .4, 2, 1, '#d8f6ff'); } } }); }
  });
  // Hydro Pump: a thick pressurised column with moving highlight bands and foam on the edges
  setFx('Hydro Pump', {
    beam(b) { const len = blen(b, 260), fd = fadeOf(b), fr = F(60), ca = Math.cos(b.ang), sa = Math.sin(b.ang), i0 = bx(b.x), j0 = by(b.y), w = R(8 * fd + 1);
      for (let d = 0; d <= len; d += 2) { const x = i0 + ca * d, y = j0 + sa * d; disc(x, y, w + 1, '#14327a'); } for (let d = 0; d <= len; d += 2) { const x = i0 + ca * d, y = j0 + sa * d, band = ((d - fr * 9) % 26 + 26) % 26; disc(x, y, w, band < 8 ? '#4aa4ff' : '#2468d8'); if (band < 4) disc(x, y, Math.max(1, w - 3), '#9fdcff'); }
      for (let d = 4; d < len; d += 5) { const sd = hash(d * 3 + fr * 1.7), off = (sd > .5 ? 1 : -1) * (w + 1), x = i0 + ca * d - sa * off, y = j0 + sa * d + ca * off; if (sd > .25) px(x - 1, y - 1, 3, 3, '#ffffff'); }
      const ex = i0 + ca * len, ey = j0 + sa * len; for (let k = 0; k < 8; k++) { const a = b.ang + (hash(k + fr) - .5) * 2.2, d2 = 6 + hash(k * 2 + fr) * 14; px(ex + Math.cos(a) * d2, ey + Math.sin(a) * d2 + d2 * .3, 3, 3, k % 2 ? '#ffffff' : '#9fdcff'); } },
    impact: S => { const h = tg(S); hitstop(100); VFX.shake(8, 300); ent(700, q => { const fr = Math.min(4, Math.floor(q * 6)); for (let k = -5; k <= 5; k++) { const hh = R((20 - Math.abs(k) * 3) * Math.sin(Math.min(1, q * 1.6) * Math.PI)); if (hh > 0) { px(h.i + k * 5 - 3, h.j + 14 - hh, 6, hh, '#14327a'); px(h.i + k * 5 - 2, h.j + 14 - hh + 1, 4, hh - 1, '#4aa4ff'); px(h.i + k * 5 - 2, h.j + 14 - hh + 1, 2, 2, '#ffffff'); } } }); }
  });

  /* ---------- ICE ---------- */
  // Ice Beam: a pale ray; crystals sprout outward from it one after another
  setFx('Ice Beam', {
    beam(b) { const len = blen(b, 260), fd = fadeOf(b), fr = F(80), ca = Math.cos(b.ang), sa = Math.sin(b.ang), i0 = bx(b.x), j0 = by(b.y), q = b.t / b.life, w = R(4 * fd + 1);
      for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, w + 2, '#2a78b8'); for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, w + 1, '#8fe4ff'); for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, Math.max(1, w - 1), '#ffffff');
      for (let k = 1; k <= 9; k++) { const d = k * len / 10, grow = Math.min(1, Math.max(0, (q * 6 - k * .45))); if (grow <= 0) continue; for (const sg of [-1, 1]) { const l = R((7 + (k % 3) * 4) * grow), x = i0 + ca * d, y = j0 + sa * d, ox = x - sa * sg * (w + 1), oy = y + ca * sg * (w + 1), ex = ox - sa * sg * l, ey = oy + ca * sg * l; line(ox, oy, ex, ey, '#2a78b8', 5); line(ox, oy, ex, ey, '#aef0ff', 3); line(ox, oy, ox + (ex - ox) * .7, oy + (ey - oy) * .7, '#ffffff', 1); disc(ex, ey, 1, '#ffffff'); } }
      for (let k = 0; k < 4; k++) { const d = ((fr * 11 + k * len / 4) % len), x = i0 + ca * d, y = j0 + sa * d; px(x - 3, y, 7, 1, '#ffffff'); px(x, y - 3, 1, 7, '#ffffff'); } },
    impact: S => { const h = tg(S); hitstop(100); ent(900, q => { const e = Math.min(1, q * 3); for (let k = 0; k < 7; k++) { const a = k / 7 * T + .3, d = 4 + e * (14 + (k % 3) * 6), x = h.i + Math.cos(a) * d, y = h.j + Math.sin(a) * d * .8 + q * q * 20, l = 4 + (k % 2) * 3; line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, '#2a78b8', 4); line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, '#e4fbff', 2); } if (q < .5) for (let n = 0; n < 24; n++) { const a = n / 24 * T, r = 6 + e * 26; px(h.i + Math.cos(a) * r, h.j + 10 + Math.sin(a) * r * .45, 2, 2, '#ffffff'); } }); }
  });

  /* ---------- NORMAL ---------- */
  // Hyper Beam: a huge orange beam with dark scrolling bands, an eight-point star at the muzzle and heavy shake
  setFx('Hyper Beam', {
    beam(b) { const len = blen(b, 280), fd = fadeOf(b), fr = F(40), ca = Math.cos(b.ang), sa = Math.sin(b.ang), i0 = bx(b.x), j0 = by(b.y), w = R(11 * fd + 1);
      for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, w + 2, '#7a2a00'); for (let d = 0; d <= len; d += 2) { const band = ((d - fr * 24) % 40 + 40) % 40; disc(i0 + ca * d, j0 + sa * d, w, band < 6 ? '#c85a00' : '#ff9a1a'); } for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, R(w * .62), '#ffd23f'); for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, R(w * .3), '#ffffff');
      const rot = (fr % 2) * .39; for (let k = 0; k < 8; k++) { const a = k * .785 + rot, l = w * 2.6 * (k % 2 ? .6 : 1); line(i0, j0, i0 + Math.cos(a) * l, j0 + Math.sin(a) * l, '#ffd23f', 3); line(i0, j0, i0 + Math.cos(a) * l * .7, j0 + Math.sin(a) * l * .7, '#ffffff', 1); } disc(i0, j0, R(w * .9), '#ffffff'); },
    impact: S => { const h = tg(S); hitstop(160); VFX.shake(18, 520); ent(640, q => { if (q < .15) { px(0, 0, 4000, 4000, '#ffffff'); return; } for (let k = 0; k < 2; k++) { const t = Math.min(1, q * 1.7 - k * .18); if (t <= 0) continue; const r = 8 + R(t * 60); for (let n = 0; n < 40; n++) { const a = n / 40 * T; px(h.i + Math.cos(a) * r, h.j + Math.sin(a) * r * .6, 4, 4, k ? '#ffd23f' : '#ff9a1a'); } } for (let k = 0; k < 14; k++) { const a = k / 14 * T; line(h.i + Math.cos(a) * 6, h.j + Math.sin(a) * 6, h.i + Math.cos(a) * (14 + q * 40), h.j + Math.sin(a) * (14 + q * 40), '#ffffff', 2); } }); }
  });
  // Slash: three white claw strokes ripped across the target one after another, each held for a frame
  setFx('Slash', {
    impact: S => { const h = tg(S); hitstop(90); VFX.shake(6, 240); ent(420, q => { const n = Math.min(3, 1 + Math.floor(q * 5)); for (let k = 0; k < n; k++) { const ox = (k - 1) * 9, t = k === n - 1 ? Math.min(1, (q * 5 - k) * 1.3) : 1; const x0 = h.i - 14 + ox, y0 = h.j - 20, x1 = x0 + 22 * t, y1 = y0 + 40 * t; line(x0, y0, x1, y1, '#2a2a40', 7); line(x0, y0, x1, y1, '#ffffff', 4); line(x0, y0, x0 + (x1 - x0) * .85, y0 + (y1 - y0) * .85, '#bfe8ff', 2); } if (q < .3) disc(h.i, h.j, 5, '#ffffff'); }); }
  });

  /* ---------- GHOST / FIGHTING / PSYCHIC / DRAGON / POISON / GRASS / GROUND ---------- */
  // Shadow Ball: a black-violet sphere that wobbles, with ghost after-images and orbiting wisps
  setFx('Shadow Ball', {
    shot(p) { const i = bx(p.x), j = by(p.y), fr = F(80), a = Math.atan2(p.vy, p.vx);
      for (let k = 3; k >= 1; k--) { bctx.globalAlpha = .22 / k * 2; ball(i - Math.cos(a) * k * 9, j - Math.sin(a) * k * 9, 8 - k, '#2d2068', '#6a4ad8'); } bctx.globalAlpha = 1;
      const wob = (fr % 2) ? 1 : 0; ball(i, j, 9 + wob, '#0c0620', '#3a2a8a'); disc(i + 1, j + 1, 7, '#2d2068'); for (let y = -5; y <= -2; y++) px(i - 6 + Math.abs(y + 3), j + y, 3, 1, '#8c6bff'); px(i - 5, j - 4, 2, 2, '#e6dcff');
      for (let k = 0; k < 4; k++) { const an = fr * .6 + k * 1.57; px(i + Math.cos(an) * 15, j + Math.sin(an) * 12, 3, 3, k % 2 ? '#b9a4ff' : '#5a3ac8'); } },
    impact: S => { const h = tg(S); hitstop(90); ent(700, q => { const rr = R(26 * (1 - q)); if (q < .45) for (let n = 0; n < 28; n++) { const a = n / 28 * T; px(h.i + Math.cos(a) * rr, h.j + Math.sin(a) * rr * .85, 3, 3, n % 2 ? '#8c6bff' : '#2d2068'); } if (q > .35) { const t = (q - .35) / .65; for (let k = 0; k < 8; k++) { const a = k * .785; ball(h.i + Math.cos(a) * 8 * t * 3, h.j - t * 24 + Math.sin(a) * 4, Math.max(1, 3 - R(t * 3)), '#2d2068', '#b9a4ff'); } } }); }
  });
  // Aura Sphere: a bright blue orb inside three spinning rings, leaving a streak of light
  setFx('Aura Sphere', {
    shot(p) { const i = bx(p.x), j = by(p.y), a = Math.atan2(p.vy, p.vx), fr = F(70);
      for (let k = 1; k <= 5; k++) px(i - Math.cos(a) * k * 5 - 2, j - Math.sin(a) * k * 5 - 2, 5 - k % 3, 5 - k % 3, k % 2 ? '#3f8cff' : '#9fd8ff');
      ball(i, j, 7, '#142a8a', '#3f8cff'); disc(i, j, 5, '#7fc0ff'); disc(i - 1, j - 1, 3, '#ffffff');
      for (let r = 0; r < 3; r++) for (let n = 0; n < 14; n++) { const an = n / 14 * T + fr * (r % 2 ? -.5 : .5) + r, x = Math.cos(an) * 13, y = Math.sin(an) * 13, c = Math.cos(r * 1.05), s = Math.sin(r * 1.05); if (n % 3) px(i + x * c - y * s * .4, j + x * s * .4 + y * c * .6, 2, 2, '#e8f6ff'); } },
    impact: S => { const h = tg(S); hitstop(130); VFX.shake(10, 340); ent(640, q => { for (let k = 0; k < 3; k++) { const t = Math.min(1, q * 1.9 - k * .2); if (t <= 0) continue; const r = 4 + R(t * 40); for (let n = 0; n < 32; n++) { const a = n / 32 * T; px(h.i + Math.cos(a) * r, h.j + Math.sin(a) * r * .7, 3, 3, k % 2 ? '#9fd8ff' : '#3f8cff'); } } if (q < .3) { for (let k = 0; k < 8; k++) { const a = k * .785; line(h.i, h.j, h.i + Math.cos(a) * 28, h.j + Math.sin(a) * 28, '#ffffff', 3); } } }); }
  });
  // Psychic: pulsing rings of pink and violet squeeze the target while stars drift upward
  setFx('Psychic', {
    impact: S => { const h = tg(S); hitstop(110); ent(1000, (q, age) => { const fr = F(90); for (let k = 0; k < 4; k++) { const t = ((q * 1.3 + k * .25) % 1), r = 36 - R(t * 30), c = (k + fr) % 2 ? '#ff7ac8' : '#a05ae0'; for (let n = 0; n < 30; n++) { const a = n / 30 * T + k; if ((n + fr) % 3) px(h.i + Math.cos(a) * r, h.j + Math.sin(a) * r * .8, 3, 3, c); } }
      for (let k = 0; k < 6; k++) { const x = h.i + (k - 2.5) * 9, y = h.j + 14 - ((age / 12 + k * 17) % 50); px(x - 1, y, 3, 1, '#ffe0f6'); px(x, y - 1, 1, 3, '#ffe0f6'); } if (q < .2) disc(h.i, h.j, 12 - R(q * 40), '#ffe0f6'); }); }
  });
  // Dragon Pulse: a violet orb pushed along by four curved blades, trailing blue embers
  setFx('Dragon Pulse', {
    shot(p) { const i = bx(p.x), j = by(p.y), a = Math.atan2(p.vy, p.vx), fr = F(60);
      for (let k = 0; k < 4; k++) { const an = fr * .5 + k * 1.57; for (let n = 0; n < 7; n++) { const aa = an + n * .12, r = 13 + n * .6; px(i + Math.cos(aa) * r - 1, j + Math.sin(aa) * r - 1, 3, 3, n > 4 ? '#ffffff' : n > 1 ? '#8a78ff' : '#2a1c9a'); } }
      for (let k = 1; k <= 4; k++) px(i - Math.cos(a) * k * 6 - 2, j - Math.sin(a) * k * 6 - 2 + (fr + k) % 2 * 2, 4, 4, k % 2 ? '#4a3ad0' : '#8a78ff'); ball(i, j, 8, '#1c1470', '#4a3ad0'); disc(i, j, 5, '#8a78ff'); disc(i - 1, j - 1, 2, '#ffffff'); },
    impact: S => { const h = tg(S); hitstop(120); VFX.shake(10, 340); ent(700, q => { for (let k = 0; k < 6; k++) { const a = k * 1.047 + q * 1.5, r = 6 + q * 34; ball(h.i + Math.cos(a) * r, h.j + Math.sin(a) * r * .7, 3, '#1c1470', k % 2 ? '#8a78ff' : '#4a3ad0'); } if (q < .25) disc(h.i, h.j, 14, '#d8d0ff'); }); }
  });
  // Sludge Bomb: a wobbling purple blob with drips; it lands as a splat that bubbles
  setFx('Sludge Bomb', {
    shot(p) { const i = bx(p.x), j = by(p.y), fr = F(80), rw = 9 + (fr % 3) - 1; ball(i, j, rw, '#2a1040', '#6a2aa8'); disc(i + 1, j + 1, rw - 3, '#8a3ac8'); px(i - 4, j - 5, 3, 2, '#d8a0ff'); px(i + 2, j - 2, 2, 2, '#a050e0');
      for (let k = 0; k < 3; k++) { const d = ((fr * 3 + k * 5) % 12); px(i - 5 + k * 5, j + 8 + d, 2, 3, '#6a2aa8'); } },
    impact: S => { const h = tg(S); hitstop(90); ent(1000, q => { const e = Math.min(1, q * 5), r = R(6 + e * 16); for (let k = 0; k < 7; k++) { const a = k * .9, d = r * (.7 + (k % 3) * .3); ball(h.i + Math.cos(a) * d, h.j + 8 + Math.sin(a) * d * .5, 3 + k % 2, '#2a1040', '#6a2aa8'); } ball(h.i, h.j + 8, R(r * .9), '#2a1040', '#8a3ac8'); for (let k = 0; k < 4; k++) { const t = (q * 3 + k * .25) % 1; if (q > .3) { px(h.i + (k - 2) * 7, h.j + 4 - t * 14, 3, 3, '#d8a0ff'); } } }); }
  });
  // Razor Leaf: three outlined leaves that spin end over end, one drawing per frame
  setFx('Razor Leaf', {
    shot(p) { const i = bx(p.x), j = by(p.y), fr = F(55); for (let k = 0; k < 3; k++) { const ph = fr * .9 + k * 2.09, ox = Math.cos(ph * .7) * 6, oy = Math.sin(ph * .9 + k) * 5, ca = Math.cos(ph), sa = Math.sin(ph); for (let t = -5; t <= 5; t++) { const wd = Math.round(2.2 * (1 - Math.abs(t) / 6)) + (Math.abs(t) < 4 ? 1 : 0); disc(i + ox + ca * t, j + oy + sa * t, wd, '#16401e'); } for (let t = -5; t <= 5; t++) { const wd = Math.round(2.2 * (1 - Math.abs(t) / 6)); disc(i + ox + ca * t, j + oy + sa * t, wd, '#5ac84a'); } line(i + ox - ca * 4, j + oy - sa * 4, i + ox + ca * 5, j + oy + sa * 5, '#c8f58a', 1); } },
    impact: S => { const h = tg(S); hitstop(70); ent(600, q => { for (let k = 0; k < 8; k++) { const a = k * .785 + .2, r = 4 + q * 28, x = h.i + Math.cos(a) * r, y = h.j + Math.sin(a) * r * .8 + q * q * 12; line(x, y, x + 5, y + 2 * (k % 2 ? 1 : -1), '#16401e', 4); line(x, y, x + 5, y + 2 * (k % 2 ? 1 : -1), '#7fe05a', 2); } if (q < .25) for (let k = 0; k < 3; k++) line(h.i - 12 + k * 9, h.j - 14, h.i + 6 + k * 9, h.j + 16, '#ffffff', 2); }); }
  });
  // Earthquake: cracks race across the floor, boulders hop and dust rolls outward
  setFx('Earthquake', {
    wave(w) { const r = w.r / 2, i = bx(w.x), j = by(w.y), fr = F(80); if (r < 3) return; for (let k = 0; k < 11; k++) { const a = k / 11 * T + hash(k) * .4; let x = i, y = j, aa = a; for (let s = 0; s < r; s += 3) { aa += (hash(k * 31 + s + fr % 2) - .5) * .5; x += Math.cos(aa) * 3; y += Math.sin(aa) * 3 * .55; px(x, y + 1, 3, 2, '#1a1410'); px(x, y, 3, 2, s % 9 ? '#3a2c20' : '#c9a46a'); } }
      for (let n = 0; n < 40; n++) { const a = n / 40 * T; px(i + Math.cos(a) * r, j + Math.sin(a) * r * .55, 3, 2, n % 2 ? '#d8c08a' : '#8a6a40'); }
      for (let k = 0; k < 6; k++) { const a = hash(k * 7) * T, d = r * .8, hop = Math.abs(Math.sin((clock.t + k * 90) / 130)) * 10; ball(i + Math.cos(a) * d, j + Math.sin(a) * d * .55 - hop, 2 + k % 2, '#3a2c20', '#9a8460'); } },
    impact: S => { const h = tg(S); hitstop(100); VFX.shake(14, 460); ent(700, q => { for (let k = 0; k < 6; k++) { const t = Math.min(1, q * 2 - k * .06); if (t > 0) disc(h.i + (k - 2.5) * 8, h.j + 12 - t * 14, R(4 + t * 4), q < .6 ? '#c9a46a' : '#8a7a5a'); } }); }
  });

  /* ---------- extra pixel-art pieces: smoke clouds, recoil, sweeping waves, claws, charges ---------- */
  // a grey smoke cloud that lingers where a beam landed (several seconds, puffs rise and swell)
  const smokeCloud = (x, y, big = 1, life = 2600) => { const puffs = Array.from({ length: 9 }, (_, k) => ({ ox: (hash(k * 3 + x) - .5) * 30 * big, d: hash(k * 5 + y) * .35, r: 5 + hash(k * 9) * 5 })); ent(life, (q, age) => { for (const p of puffs) { const t = Math.max(0, q - p.d) / (1 - p.d); if (t <= 0) continue; AL = (1 - t) * .75; const r = R((p.r + t * 8) * big), i = bx(x) + p.ox, j = by(y) - t * 20 * big; disc(i, j + 1, r + 1, '#4a4a56'); disc(i, j, r, '#8a8a96'); disc(i - 1, j - 1, Math.max(1, r - 3), '#b4b4c0'); } AL = 1; }, { under: true }); };
  const glowAlong = (i0, j0, ca, sa, len, w, col, a) => { const c = bctx; c.save(); c.globalCompositeOperation = 'lighter'; for (let d = 0; d <= len; d += 14) hiSoft(i0 + ca * d, j0 + sa * d, w * 2.4, col, a, .3); c.restore(); };
  // Flamethrower again: a cone of pixel fire particles (jagged edge), solid hot core and an additive glow behind it
  setFx('Flamethrower', {
    beam(b) {
      const len = blen(b, 250), fd = fadeOf(b), fr = F(70), ca = Math.cos(b.ang), sa = Math.sin(b.ang), i0 = bx(b.x), j0 = by(b.y);
      glowAlong(i0, j0, ca, sa, len, 8 + len * .05, '#ff6a14', .32 * fd);
      for (let k = 0; k < 120; k++) { const d = hash(k * 3.1 + fr * .37) * len, f = d / Math.max(1, len), sp = 3 + d * .17, off = (hash(k * 7.7 + fr * .61) - .5) * 2 * sp, x = i0 + ca * d - sa * off, y = j0 + sa * d + ca * off, z = 3 + R(hash(k * 2.3) * 3) * (1 - f * .4); px(x - z / 2 - 1, y - z / 2 - 1, z + 2, z + 2, f < .55 ? '#7a1208' : '#4a3a3a'); }
      for (let k = 0; k < 120; k++) { const d = hash(k * 3.1 + fr * .37) * len, f = d / Math.max(1, len), sp = 3 + d * .17, off = (hash(k * 7.7 + fr * .61) - .5) * 2 * sp, x = i0 + ca * d - sa * off, y = j0 + sa * d + ca * off, z = 3 + R(hash(k * 2.3) * 3) * (1 - f * .4); px(x - z / 2, y - z / 2, z, z, f < .2 ? '#fff0a0' : f < .45 ? '#ffc42a' : f < .75 ? '#ff7a1e' : '#d8341a'); }
      for (let d = len; d >= 0; d -= 3) { const f = d / Math.max(1, len), w = (2 + d * .05) * fd, wob = Math.sin(d * .13 - fr * 2) * (1 + d * .015), x = i0 + ca * d - sa * wob, y = j0 + sa * d + ca * wob; if (f < .7) disc(x, y, Math.max(1, R(w)), f < .25 ? '#ffffff' : '#ffe56a'); }
      if (b.t < 40 && !b._rc) { b._rc = 1; smokeCloud(b.x + ca * 8, b.y + sa * 8, .6, 1400); }
      if (b.t / b.life > .55 && !b._sc) { b._sc = 1; const e = beamEnd(b, len * 2); smokeCloud(e.x, e.y, 1, 2400); }
    }
  });
  // Hydro Pump again: a deep blue column with a lit upper edge, white streaks racing down it, jagged foam
  setFx('Hydro Pump', {
    beam(b) {
      const len = blen(b, 260), fd = fadeOf(b), fr = F(60), ca = Math.cos(b.ang), sa = Math.sin(b.ang), i0 = bx(b.x), j0 = by(b.y), w = R(9 * fd + 1);
      glowAlong(i0, j0, ca, sa, len, w, '#3a8aff', .3 * fd);
      for (let d = 0; d <= len; d += 2) { const j = (hash(d * .7 + fr) > .8) ? 1 : 0; disc(i0 + ca * d, j0 + sa * d, w + 1 + j, '#0f2a6a'); }
      for (let d = 0; d <= len; d += 2) disc(i0 + ca * d, j0 + sa * d, w, '#2468d8');
      for (let d = 0; d <= len; d += 2) disc(i0 + ca * d - sa * w * .3, j0 + sa * d + ca * w * .3 - 1, R(w * .55), '#4aa4ff');
      for (let k = 0; k < 7; k++) { const d0 = ((k * len / 7 + fr * 16) % len), x = i0 + ca * d0, y = j0 + sa * d0; line(x - sa * w * .35 - ca * 6, y + ca * w * .35 - sa * 6, x - sa * w * .35 + ca * 6, y + ca * w * .35 + sa * 6, '#e8fbff', 2); }
      for (let d = 2; d < len; d += 3) { const sd = hash(d * 3 + fr * 1.3); if (sd > .45) { const off = (sd > .72 ? 1 : -1) * (w + 2 + (sd > .9 ? 2 : 0)); px(i0 + ca * d - sa * off - 1, j0 + sa * d + ca * off - 1, 3, 3, '#ffffff'); } }
      if (b.t / b.life > .5 && !b._sc) { b._sc = 1; const e = beamEnd(b, len * 2); smokeCloud(e.x, e.y, 1.2, 2400); }
    }
  });
  // Hyper Beam: Snorlax-style startup (white motes pulled into the mouth), a huge recoil kick and smoke at the mouth, a lingering cloud where it lands
  setFx('Hyper Beam', {
    charge: S => ent(380, q => { const sd = side(S), i = bx(sd.x + sd.face * 18), j = by(sd.y - 32); for (let k = 0; k < 16; k++) { const a = k / 16 * T + q * 3, r = 34 * (1 - q) + (k % 3) * 3; px(i + Math.cos(a) * r - 1, j + Math.sin(a) * r - 1, 3, 3, k % 2 ? '#ffffff' : '#ffd23f'); } disc(i, j, R(3 + q * 5), '#ffffff'); }),
    exec: S => { const sd = side(S); sd.hop = 0; },
    beam: (() => { const old = MFX['Hyper Beam'].beam; return b => { old(b); if (b.t < 40 && !b._rc) { b._rc = 1; smokeCloud(b.x, b.y, .9, 1800); VFX.shake(16, 520); } if (b.t / b.life > .45 && !b._sc) { b._sc = 1; const len = blen(b, 280), e = beamEnd(b, len * 2); smokeCloud(e.x, e.y, 1.6, 3000); } }; })()
  });
  // Surf: a screen-wide wall of translucent water sweeps across the stage with a white foam crest
  setFx('Surf', {
    wave(w) {
      const f = side(w.owner).face || 1, i0 = bx(w.x), j = by(w.y), fr = F(70), front = i0 + f * (w.r / 2) * 2.7, span = 92, fm = f > 0 ? -1 : 1;
      for (let yy = -span; yy <= span; yy += 2) { const crest = Math.sin(yy * .16 + fr * 1.3) * 3 + Math.sin(yy * .05) * 4, x = front + crest; AL = .55; for (let k = 0; k < 4; k++) px(Math.min(x, x + fm * f * (44 - k * 10)), j + yy, Math.abs(44 - k * 10), 2, ['#14327a', '#2468d8', '#4aa4ff', '#8fd4ff'][k]); AL = 1; px(x - (f > 0 ? 5 : 0), j + yy, 5, 2, '#ffffff'); if ((yy / 2 + fr) % 3 === 0) px(x + f * 3, j + yy - 2, 3, 3, '#ffffff'); }
      for (let k = 0; k < 10; k++) { const t = (clock.t / 420 + k * .1) % 1, y = j + (hash(k * 5) - .5) * span * 2 - t * 18, x = front + f * (4 + hash(k * 3) * 10); px(x, y, 2, 2, '#e8fbff'); }
    }
  });
  // Dragon Claw: a neon green crescent that sweeps across and stays in the air for a few frames
  setFx('Dragon Claw', {
    impact: S => { const h = tg(S), f = -side(S).face; hitstop(120); VFX.shake(8, 300);
      ent(560, q => { const sweep = Math.min(1, q * 7), hold = q > .55 ? 1 - (q - .55) / .45 : 1; AL = hold; for (let c = 0; c < 3; c++) { const r = 26 + c * 5, a0 = -1.0 + c * .08, a1 = a0 + 1.9 * sweep; for (let n = 0; n <= 28; n++) { const a = a0 + (a1 - a0) * n / 28, th = Math.sin(n / 28 * Math.PI) * (6 - c) , x = h.i + Math.cos(a) * r * f - f * 4, y = h.j + Math.sin(a) * r - 4; if (th < 1) continue; disc(x, y, R(th * .5 + 1), '#0e3a24'); } }
        for (let c = 0; c < 3; c++) { const r = 26 + c * 5, a0 = -1.0 + c * .08, a1 = a0 + 1.9 * sweep; for (let n = 0; n <= 28; n++) { const a = a0 + (a1 - a0) * n / 28, th = Math.sin(n / 28 * Math.PI) * (6 - c), x = h.i + Math.cos(a) * r * f - f * 4, y = h.j + Math.sin(a) * r - 4; if (th < 1) continue; disc(x, y, R(th * .38), '#39ff88'); if (th > 3) disc(x, y, R(th * .15), '#e8fff0'); } } AL = 1; }); }
  });
  // Volt Tackle: a yellow lightning sphere wraps the Pokémon while it dashes; contact sets off a jagged starburst with a long freeze-frame
  setFx('Volt Tackle', {
    dash: S => ent(70, () => { const sd = side(S), i = bx(sd.x), j = by(sd.y - 18), fr = F(55); for (let n = 0; n < 34; n++) { const a = n / 34 * T; if ((n + fr) % 4) px(i + Math.cos(a) * 24 - 1, j + Math.sin(a) * 22 - 1, 3, 3, n % 2 ? '#ffe84a' : '#ffffff'); }
      for (let k = 0; k < 4; k++) { const a = hash(k + fr * 3.1) * T, a2 = a + (hash(k * 9 + fr) - .5) * 1.4; line(i + Math.cos(a) * 6, j + Math.sin(a) * 6, i + Math.cos(a2) * 22, j + Math.sin(a2) * 20, '#5a3a00', 3); line(i + Math.cos(a) * 6, j + Math.sin(a) * 6, i + Math.cos(a2) * 22, j + Math.sin(a2) * 20, '#fff07a', 1); }
      for (let k = 1; k <= 5; k++) { AL = .5 - k * .08; px(i - sd.face * k * 9 - 4, j - 6, 8, 14, '#ffe84a'); AL = 1; } }),
    impact: S => { const h = tg(S); hitstop(190); VFX.shake(16, 480); screenFlash('#fffbd0', .6);
      ent(560, q => { const r = 8 + R(Math.min(1, q * 3) * 30), n = 14; for (let k = 0; k < n; k++) { const a = k / n * T, l = r * (k % 2 ? .55 : 1), x = h.i + Math.cos(a) * l, y = h.j + Math.sin(a) * l * .85; line(h.i, h.j, x, y, '#5a3a00', 6); } for (let k = 0; k < n; k++) { const a = k / n * T, l = r * (k % 2 ? .55 : 1); line(h.i, h.j, h.i + Math.cos(a) * l, h.j + Math.sin(a) * l * .85, '#ffe84a', 3); } disc(h.i, h.j, R(Math.max(2, 10 - q * 20)), '#ffffff'); }); }
  });
})();
