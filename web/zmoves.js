/* =====================================================================
   Section 21: Z-MOVES and DODGE (client side)
   - Z-Move cinematic: drawn on a low-resolution canvas and scaled up with
     sharp pixels. Act 1: cut-in banner with the attacker and the Z-Move
     name. Act 2: a type-specific choreography with the attacker's own
     sprite looming behind it. Act 3: impact flash, shockwave, embers.
   - Dodge afterimages, buttons (desktop + phone), keys (Shift = dodge,
     Z or M = Z-Move) and the Z gauge on the buttons.
   ===================================================================== */
(function zMovesModule() {
const ZW = 320, ZH = 180;                        // pixel-art resolution of the cinematic
const ZFX = { run: null, cv: null, ctx: null };
(function zSetup() {
  const cv = document.createElement('canvas'); cv.id = 'zCine'; cv.width = ZW; cv.height = ZH;
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:46;pointer-events:none;image-rendering:pixelated;image-rendering:crisp-edges;display:none';
  document.body.appendChild(cv); ZFX.cv = cv; ZFX.ctx = cv.getContext('2d'); ZFX.ctx.imageSmoothingEnabled = false;
  const st = document.createElement('style');
  st.textContent = `
#bMega.zbtn,#tMega.zbtn{position:relative;overflow:hidden;background:linear-gradient(90deg,var(--zc,#ffd84a) calc(var(--z,0)*1%),rgba(60,66,110,.9) calc(var(--z,0)*1%));color:#fff;text-shadow:0 1px 2px #000;border:2px solid rgba(255,255,255,.35)}
#bMega.zbtn.ready,#tMega.zbtn.ready{background:linear-gradient(135deg,#ffe066,#ff7ad9,#7ab8ff,#ffe066);background-size:300% 300%;animation:zReady 1.2s linear infinite,megaPulse 1s infinite alternate;color:#2a1206;text-shadow:none;border-color:#fff}
@keyframes zReady{to{background-position:300% 0}}
#tMega.zbtn:disabled{display:inline-flex;opacity:.92}
#bMega.zbtn:disabled,#tMega.zbtn:disabled{cursor:default}
#bDodge,#tDodge{position:relative;overflow:hidden;background:linear-gradient(90deg,#7ad7ff calc(var(--d,100)*1%),rgba(60,66,110,.9) calc(var(--d,100)*1%));color:#08223a;font-weight:900;border:2px solid rgba(255,255,255,.4)}
#tDodge{padding:6px 14px;font-size:13px;letter-spacing:.5px;touch-action:none;-webkit-user-select:none;user-select:none}
.zd-row{display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:8px}
.zd-row #tMega{min-width:44px;padding:6px 12px;font-size:13px}
#bDodge.cool,#tDodge.cool{color:#fff;text-shadow:0 1px 2px #000}
.zshake{animation:zShake .45s linear}
@keyframes zShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-7px,4px)}40%{transform:translate(6px,-5px)}60%{transform:translate(-5px,-3px)}80%{transform:translate(4px,5px)}}`;
  document.head.appendChild(st);
})();

/* ---------- palette helpers ---------- */
const zHex = h => { h = (h || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const zMix = (a, b, t) => { const A = zHex(a), B = zHex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
const zTypeCol = t => (typeof TYPE_COLOR !== 'undefined' && TYPE_COLOR[t]) || '#ffd84a';
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const rnd = (a, b) => a + Math.random() * (b - a);
// pixel primitives (everything snaps to the low-res grid)
function px(c, x, y, s, col) { c.fillStyle = col; c.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.max(1, Math.round(s)), Math.max(1, Math.round(s))); }
function pxDisc(c, x, y, r, col) { c.fillStyle = col; r = Math.max(1, Math.round(r)); for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); } }
function pxRing(c, x, y, r, col, th = 2) { c.fillStyle = col; const n = Math.max(12, Math.round(r * 2.4)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; c.fillRect(Math.round(x + Math.cos(a) * r - th / 2), Math.round(y + Math.sin(a) * r - th / 2), th, th); } }
function pxLine(c, x0, y0, x1, y1, col, th = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); c.fillStyle = col; for (let i = 0; i <= n; i++) { const k = i / (n || 1); c.fillRect(Math.round(x0 + (x1 - x0) * k - th / 2), Math.round(y0 + (y1 - y0) * k - th / 2), th, th); } }
function bolt(c, x0, y0, x1, y1, col, jag = 10, th = 2) { let px0 = x0, py0 = y0; const seg = 7; for (let i = 1; i <= seg; i++) { const k = i / seg, nx = x0 + (x1 - x0) * k + (i < seg ? rnd(-jag, jag) : 0), ny = y0 + (y1 - y0) * k + (i < seg ? rnd(-jag / 2, jag / 2) : 0); pxLine(c, px0, py0, nx, ny, col, th); px0 = nx; py0 = ny; } }
function star(c, x, y, r, col) { for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; pxLine(c, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, col, 1); } px(c, x, y, 2, col); }

/* ---------- the attacker's sprite (for the cut-in and the looming aura) ---------- */
function zSprite(name) { try { const c = document.createElement('canvas'); c.width = 96; c.height = 96; drawSpriteTo(c, name, {}); return c; } catch (e) { return null; } }
function drawSprite(c, img, x, y, h, alpha = 1, tint) {
  if (!img) return; const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return;
  const w = h * iw / ih; c.save(); c.globalAlpha = alpha; c.imageSmoothingEnabled = false;
  if (tint) { const t = document.createElement('canvas'); t.width = Math.max(1, Math.round(w)); t.height = Math.max(1, Math.round(h)); const tc = t.getContext('2d'); tc.imageSmoothingEnabled = false; tc.drawImage(img, 0, 0, t.width, t.height); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = tint; tc.fillRect(0, 0, t.width, t.height); c.drawImage(t, Math.round(x - w / 2), Math.round(y - h / 2)); }
  else c.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
  c.restore();
}

/* ---------- type choreographies (act 2). k = 0..1 progress, P = particle store ---------- */
const CX = ZW / 2, CY = 100;
const ZCHOREO = {
  Fire(c, k, P, col) {                                                    // Inferno Overdrive: a fire sun, then a spiralling pillar of flame
    const r = 6 + ease(Math.min(1, k * 1.4)) * 34; pxDisc(c, CX, CY - 30 + k * 30, r, '#ff5a1f'); pxDisc(c, CX, CY - 30 + k * 30, r * .72, '#ffb02e'); pxDisc(c, CX, CY - 30 + k * 30, r * .4, '#fff3a0');
    for (let i = 0; i < 6; i++) P.push({ x: CX + rnd(-40, 40), y: ZH + 4, vx: 0, vy: rnd(-2.6, -1.4), a: rnd(0, 6.3), r: rnd(14, 46), s: rnd(2, 4), life: 1, col: ['#ff5a1f', '#ffb02e', '#fff3a0', '#d61f1f'][i % 4] });
    for (const p of P) { p.a += .14; p.y += p.vy; p.x = CX + Math.cos(p.a) * p.r * (p.y / ZH); p.life -= .012; px(c, p.x, p.y, p.s, p.col); }
  },
  Water(c, k, P, col) {                                                   // Hydro Vortex: a tightening whirlpool
    for (let i = 0; i < 5; i++) P.push({ a: rnd(0, 6.3), r: rnd(70, 130), s: rnd(2, 4), life: 1, col: ['#2f7dff', '#4aa6ff', '#d9f1ff', '#1b4fbf'][i % 4] });
    for (const p of P) { p.a += .09 + 6 / p.r; p.r *= .975; p.life -= .01; px(c, CX + Math.cos(p.a) * p.r * 1.3, CY + Math.sin(p.a) * p.r * .55, p.s, p.col); }
    for (let i = 0; i < 3; i++) pxRing(c, CX, CY, 10 + ((k * 90 + i * 30) % 90), 'rgba(217,241,255,.55)', 1);
  },
  Grass(c, k, P, col) {                                                   // Bloom Doom: a giant flower blooms, petals storm outward
    const b = ease(Math.min(1, k * 1.6)), pet = 8; for (let i = 0; i < pet; i++) { const a = i / pet * Math.PI * 2 + k; pxDisc(c, CX + Math.cos(a) * 22 * b, CY + Math.sin(a) * 22 * b, 11 * b, i % 2 ? '#ff7ad9' : '#ffb3ec'); }
    pxDisc(c, CX, CY, 10 * b, '#ffe066'); pxDisc(c, CX, CY, 5 * b, '#ff9f1a');
    if (k > .4) for (let i = 0; i < 6; i++) { const a = rnd(0, 6.3); P.push({ x: CX, y: CY, vx: Math.cos(a) * rnd(1.5, 4), vy: Math.sin(a) * rnd(1.5, 4), s: rnd(2, 3), life: 1, col: ['#58d65a', '#e2ffc4', '#ff7ad9'][i % 3] }); }
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.vx *= .99; p.life -= .015; px(c, p.x, p.y, p.s, p.col); }
  },
  Electric(c, k, P, col, z) {                                              // Gigavolt Havoc / Catastropika / Stoked Sparksurfer
    const r = 4 + ease(k) * 26; pxDisc(c, CX, CY, r + 4, 'rgba(255,224,74,.35)'); pxDisc(c, CX, CY, r, '#ffe04a'); pxDisc(c, CX, CY, r * .55, '#ffffff');
    const n = z === 'Catastropika' ? 1 : 3;
    for (let i = 0; i < n; i++) if (Math.random() < .55) bolt(c, CX + rnd(-120, 120), -4, CX + rnd(-6, 6), CY, Math.random() < .5 ? '#ffffff' : '#ffe04a', 14, 2);
    if (z === 'Catastropika') { const sx = CX - 140 + k * 140, sy = 10 + k * 90; for (let t = 0; t < 8; t++) pxLine(c, sx - t * 9, sy - t * 6, sx, sy, t % 2 ? '#ffe04a' : '#fff', 3); pxDisc(c, sx, sy, 7, '#fff'); }
    if (z === 'Stoked Sparksurfer') { const sx = (k * 400) % 340 - 10; for (let t = 0; t < 30; t++) px(c, sx - t * 3, CY + 30 + Math.sin(t * .6 + k * 20) * 6, 3, t % 3 ? '#4aa6ff' : '#ffe04a'); }
    for (let i = 0; i < 4; i++) P.push({ x: CX, y: CY, vx: rnd(-4, 4), vy: rnd(-4, 4), s: 2, life: 1, col: '#fff7b0' });
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.life -= .05; px(c, p.x, p.y, p.s, p.col); }
  },
  Ice(c, k, P, col) {                                                      // Subzero Slammer: shards converge, then a frozen star
    if (P.length < 60) for (let i = 0; i < 5; i++) { const a = rnd(0, 6.3); P.push({ a, r: rnd(90, 150), s: rnd(2, 4), life: 1, col: ['#a8efff', '#ffffff', '#5fc8ff'][i % 3] }); }
    for (const p of P) { p.r = Math.max(4, p.r - 2.4); const x = CX + Math.cos(p.a) * p.r, y = CY + Math.sin(p.a) * p.r * .7; pxLine(c, x, y, x + Math.cos(p.a) * 6, y + Math.sin(p.a) * 4, p.col, 2); }
    const s = ease(k) * 28; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; pxLine(c, CX, CY, CX + Math.cos(a) * s, CY + Math.sin(a) * s, '#ffffff', 2); pxLine(c, CX + Math.cos(a) * s * .6, CY + Math.sin(a) * s * .6, CX + Math.cos(a + .5) * s * .8, CY + Math.sin(a + .5) * s * .8, '#a8efff', 1); }
  },
  Fighting(c, k, P, col) {                                                 // All-Out Pummeling: a flurry of blows
    for (let i = 0; i < 2; i++) P.push({ x: CX + rnd(-50, 50), y: CY + rnd(-35, 35), r: 2, s: 0, life: 1, col: Math.random() < .5 ? '#ff8a5b' : '#fff1e6' });
    for (const p of P) { p.r += 2.2; p.life -= .07; pxRing(c, p.x, p.y, p.r, p.col, 2); star(c, p.x, p.y, 6, '#ffffff'); }
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + k * 3; pxLine(c, CX + Math.cos(a) * 70, CY + Math.sin(a) * 45, CX + Math.cos(a) * 110, CY + Math.sin(a) * 70, 'rgba(255,241,230,.6)', 1); }
  },
  Poison(c, k, P, col) {                                                   // Acid Downpour: toxic clouds, acid rain, bubbling pool
    for (let i = 0; i < 7; i++) pxDisc(c, 20 + i * 47, 18 + Math.sin(k * 8 + i) * 3, 20, i % 2 ? '#6a2d8f' : '#8c3fc0');
    for (let i = 0; i < 5; i++) P.push({ x: rnd(0, ZW), y: 30, vx: 0, vy: rnd(3, 5), s: 2, life: 1, col: '#c86bff' });
    for (const p of P) { p.y += p.vy; p.life -= .02; if (p.y < CY + 28) pxLine(c, p.x, p.y, p.x, p.y + 4, p.col, 1); else { px(c, p.x, CY + 28 - (1 - p.life) * 6, 3, '#e3a6ff'); p.life -= .05; } }
    pxDisc(c, CX, CY + 30, 50 * ease(k), 'rgba(140,63,192,.55)');
  },
  Ground(c, k, P, col) {                                                   // Tectonic Rage: fissures split the ground, rocks heave up
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .3; let x = CX, y = CY + 20; for (let s = 0; s < 6 * k; s++) { const nx = x + Math.cos(a) * 9 + rnd(-3, 3), ny = y + Math.sin(a) * 5; pxLine(c, x, y, nx, ny, '#3a2410', 2); x = nx; y = ny; } }
    if (Math.random() < .5) P.push({ x: CX + rnd(-80, 80), y: CY + 30, vx: rnd(-1, 1), vy: rnd(-5, -3), s: rnd(4, 8), life: 1, col: ['#a07a4a', '#7a5a30', '#c8a070'][Math.floor(rnd(0, 3))] });
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += .25; p.life -= .015; px(c, p.x, p.y, p.s, p.col); }
  },
  Flying(c, k, P, col) {                                                   // Supersonic Skystrike: a sonic dive from the sky
    const sx = ZW + 20 - k * (ZW / 2 + 20), sy = -10 + k * (CY + 10);
    for (let t = 0; t < 10; t++) pxLine(c, sx + t * 12, sy - t * 8, sx + t * 12 + 8, sy - t * 8 - 5, t % 2 ? '#ffffff' : '#a8c8ff', 2);
    for (let i = 0; i < 3; i++) pxRing(c, sx, sy, 6 + i * 6 + (k * 30) % 6, 'rgba(255,255,255,.6)', 1);
    if (Math.random() < .4) P.push({ x: sx, y: sy, vx: rnd(-1, 1), vy: rnd(-.5, .5), s: 3, life: 1, col: '#e6f0ff' });
    for (const p of P) { p.x += p.vx; p.y += p.vy + .3; p.life -= .02; px(c, p.x, p.y, p.s, p.col); }
  },
  Psychic(c, k, P, col, z) {                                               // Shattered Psyche / Genesis Supernova: kaleidoscope rings
    const rainbow = ['#ff5a8a', '#ffb02e', '#ffe04a', '#58d65a', '#4aa6ff', '#a066ff'];
    for (let i = 0; i < 6; i++) pxRing(c, CX, CY, ((k * 120 + i * 18) % 108) + 4, z === 'Genesis Supernova' ? rainbow[i] : (i % 2 ? '#ff7ad9' : '#c08cff'), 2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + k * 5; pxDisc(c, CX + Math.cos(a) * 40, CY + Math.sin(a) * 26, 4, rainbow[i]); }
    if (z === 'Genesis Supernova' && k > .6) pxDisc(c, CX, CY, (k - .6) * 120, 'rgba(255,240,255,.75)');
  },
  Bug(c, k, P, col) {                                                      // Savage Spin-Out: a swarm cocoons the target
    if (P.length < 120) for (let i = 0; i < 6; i++) P.push({ a: rnd(0, 6.3), r: rnd(40, 110), sp: rnd(.08, .16), s: 2, life: 1, col: ['#a8c83a', '#e6f07a', '#5a7a1a'][i % 3] });
    for (const p of P) { p.a += p.sp; p.r = Math.max(10, p.r - .7); p.life -= .004; px(c, CX + Math.cos(p.a) * p.r, CY + Math.sin(p.a) * p.r * .6, p.s, p.col); }
  },
  Rock(c, k, P, col) {                                                     // Continental Crush: boulders rain from the sky
    if (Math.random() < .35) P.push({ x: CX + rnd(-70, 70), y: -10, vy: rnd(3, 5), s: rnd(8, 14), life: 1, col: ['#a89060', '#7a6a4a', '#c8b080'][Math.floor(rnd(0, 3))] });
    for (const p of P) { p.y += p.vy; p.vy += .12; if (p.y > CY + 20) { p.life = 0; for (let i = 0; i < 4; i++) px(c, p.x + rnd(-10, 10), CY + 20 + rnd(-6, 2), 3, '#d8c8a0'); } else { pxDisc(c, p.x, p.y, p.s / 2, p.col); px(c, p.x - 2, p.y - 2, 2, '#e8dcc0'); } }
    if (k > .7) pxDisc(c, CX, -60 + (k - .7) / .3 * 150, 46, '#8a7650');
  },
  Ghost(c, k, P, col) {                                                    // Never-Ending Nightmare: shadow hands rise, eyes in the dark
    for (let i = 0; i < 8; i++) { const bx = CX - 105 + i * 30, h = ease(Math.min(1, k * 1.5)) * (50 + (i % 3) * 14); for (let y = 0; y < h; y += 3) px(c, bx + Math.sin(y * .15 + i + k * 6) * 5, ZH - y, 6, y > h - 8 ? '#b26bff' : '#3a1f5a'); }
    for (let i = 0; i < 5; i++) { const ex = 30 + i * 62, ey = 30 + (i % 2) * 18; if ((k * 10 + i) % 3 < 2) { px(c, ex - 4, ey, 3, '#ff3a6a'); px(c, ex + 4, ey, 3, '#ff3a6a'); } }
  },
  Dragon(c, k, P, col) {                                                   // Devastating Drake: a dragon of aura coils around the target
    for (let i = 0; i < 26; i++) { const t = k * 9 - i * .22, r = 70 - i * .8; pxDisc(c, CX + Math.cos(t) * r * 1.4, CY + Math.sin(t) * r * .5, 7 - i * .2, i === 0 ? '#ffffff' : (i % 2 ? '#7a5cff' : '#5a3fd8')); }
    const hx = CX + Math.cos(k * 9) * 98, hy = CY + Math.sin(k * 9) * 35; px(c, hx - 3, hy - 3, 2, '#ff3a3a'); pxLine(c, hx, hy, hx + 8, hy - 8, '#e0d0ff', 2);
  },
  Dark(c, k, P, col) {                                                     // Black Hole Eclipse: a black hole devours the light
    if (P.length < 90) for (let i = 0; i < 4; i++) P.push({ a: rnd(0, 6.3), r: rnd(80, 150), s: rnd(1, 3), life: 1, col: ['#ffffff', '#c8a0ff', '#6a4aaa'][i % 3] });
    for (const p of P) { p.a += 30 / p.r * .05; p.r *= .965; if (p.r < 12) p.life = 0; px(c, CX + Math.cos(p.a) * p.r, CY + Math.sin(p.a) * p.r * .45, p.s, p.col); }
    const r = 6 + ease(k) * 26; pxRing(c, CX, CY, r + 4, '#c8a0ff', 2); pxDisc(c, CX, CY, r, '#05030a');
  },
  Steel(c, k, P, col) {                                                    // Corkscrew Crash: a spinning drill of steel
    for (let i = 0; i < 40; i++) { const t = i / 40, a = k * 30 + t * 14; pxLine(c, CX - 120 + k * 120 + t * 60, CY + Math.sin(a) * (14 - t * 12), CX - 120 + k * 120 + t * 60 + 2, CY + Math.cos(a) * (14 - t * 12), i % 2 ? '#dfe6f0' : '#8a96aa', 2); }
    if (Math.random() < .7) P.push({ x: CX - 60 + k * 120, y: CY, vx: rnd(-3, 3), vy: rnd(-3, 1), s: 2, life: 1, col: '#ffd84a' });
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += .2; p.life -= .04; px(c, p.x, p.y, p.s, p.col); }
  },
  Fairy(c, k, P, col) {                                                    // Twinkle Tackle: a dazzling starry space
    for (let i = 0; i < 4; i++) P.push({ x: rnd(0, ZW), y: rnd(0, ZH), r: rnd(3, 8), life: 1, col: ['#ffb3ec', '#ffffff', '#ffe066', '#b3e5ff'][i % 4] });
    for (const p of P) { p.life -= .03; star(c, p.x, p.y, p.r * p.life, p.col); }
    pxDisc(c, CX, CY, 8 + ease(k) * 18, 'rgba(255,179,236,.6)'); pxDisc(c, CX, CY, 4 + ease(k) * 9, '#ffffff');
  },
  Normal(c, k, P, col, z) {                                                // Breakneck Blitz / Pulverizing Pancake / Extreme Evoboost
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pxLine(c, CX + Math.cos(a) * (40 + (k * 200 + i * 9) % 40), CY + Math.sin(a) * (24 + (k * 200 + i * 9) % 24), CX + Math.cos(a) * 160, CY + Math.sin(a) * 100, 'rgba(255,255,255,.45)', 1); }
    if (z === 'Pulverizing Pancake') { const sh = ease(k); pxDisc(c, CX, CY + 24, 20 + sh * 70, 'rgba(0,0,0,.55)'); }
    else if (z === 'Extreme Evoboost') { const cols = ['#ff7b2a', '#4aa6ff', '#ffe04a', '#ff7ad9', '#3a3a5a', '#58d65a', '#a8efff', '#ffb3ec']; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + k * 4, r = 80 * (1 - ease(k)) + 6; pxDisc(c, CX + Math.cos(a) * r, CY + Math.sin(a) * r * .6, 6, cols[i]); } }
    else { const sx = -20 + ease(k) * (CX + 20); for (let t = 0; t < 8; t++) pxLine(c, sx - t * 14, CY, sx - t * 14 - 10, CY, 'rgba(255,255,255,.8)', 3); pxDisc(c, sx, CY, 9, '#ffffff'); }
  }
};

/* ---------- running a cinematic ---------- */
function zStart(S, monName, zName, zType) {
  const tc = zTypeCol(zType), img = zSprite(monName);
  window.__zt0 = performance.now(); ZFX.run = { t0: window.__zt0, S, mon: monName, name: zName, type: zType, col: tc, img, P: [], shook: false };
  ZFX.cv.style.display = 'block'; if (!ZFX.loop) ZFX.loop = requestAnimationFrame(zFrame);
  try { if (typeof sfx === 'function') sfx('mega'); } catch (e) { }
}
function zFrame(now) {
  ZFX.loop = null; const r = ZFX.run; if (!r) { ZFX.cv.style.display = 'none'; return; }
  const t = now - r.t0, c = ZFX.ctx; c.clearRect(0, 0, ZW, ZH);
  const fadeOut = t > 1350 ? Math.max(0, 1 - (t - 1350) / 250) : 1;
  // backdrop: darkened screen tinted toward the type colour
  c.globalAlpha = Math.min(1, t / 250) * fadeOut; c.fillStyle = zMix('#05060f', r.col, .18); c.fillRect(0, 0, ZW, ZH);
  for (let y = 0; y < ZH; y += 4) { c.fillStyle = 'rgba(255,255,255,.025)'; c.fillRect(0, y, ZW, 1); }
  // act 1 (0–700 ms): Z crystal + diagonal cut-in banner
  if (t < 800) {
    const k = Math.min(1, t / 320), bx = -ZW + ease(k) * ZW;
    c.save(); c.translate(bx, 0); c.fillStyle = r.col; c.beginPath(); c.moveTo(0, 46); c.lineTo(ZW, 30); c.lineTo(ZW, 112); c.lineTo(0, 128); c.fill();
    c.fillStyle = zMix(r.col, '#000000', .45); c.fillRect(0, 118, ZW, 3); c.restore();
    drawSprite(c, r.img, bx + 74, 80, 80, 1);
    c.save(); c.globalAlpha = fadeOut; c.font = 'bold 15px "Lilita One", Impact, sans-serif'; c.textBaseline = 'middle';
    c.fillStyle = '#05060f'; c.fillText('Z-MOVE', bx + 151, 61); c.fillStyle = '#ffffff'; c.fillText('Z-MOVE', bx + 150, 60);
    const label = r.name.toUpperCase(); let fs = 19; c.font = `bold ${fs}px "Lilita One", Impact, sans-serif`; while (fs > 10 && c.measureText(label).width > ZW - 150) { fs--; c.font = `bold ${fs}px "Lilita One", Impact, sans-serif`; }
    c.fillStyle = '#05060f'; c.fillText(label, bx + 131, 86); c.fillStyle = '#fff36b'; c.fillText(label, bx + 130, 85);
    c.font = 'bold 9px Rubik, sans-serif'; c.fillStyle = '#05060f'; c.fillText(r.mon.toUpperCase() + '\u2019S FULL-FORCE ATTACK', bx + 130, 104); c.restore();
    // spinning Z crystal
    const zr = 10 + Math.sin(t / 60) * 1.5, zx = bx + 280, zy = 72, sp = Math.cos(t / 120);
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(zx, zy - zr); c.lineTo(zx + zr * sp, zy); c.lineTo(zx, zy + zr); c.lineTo(zx - zr * sp, zy); c.fill();
    c.fillStyle = r.col; c.font = 'bold 12px "Lilita One", sans-serif'; c.fillText('Z', zx - 4, zy + 1);
  }
  // act 2 (700–1750 ms): the attacker looms behind its type choreography
  if (t >= 600 && t < 1600) {
    const k = Math.min(1, (t - 600) / 900), a = Math.min(1, (t - 600) / 200) * fadeOut;
    drawSprite(c, r.img, CX, CY - 10, 150, .22 * a, r.col);
    drawSprite(c, r.img, CX + Math.sin(t / 40) * 1.5, CY - 10, 150, .14 * a);
    c.save(); c.globalAlpha = a; const f = ZCHOREO[r.type] || ZCHOREO.Normal; f(c, k, r.P, r.col, r.name); c.restore();
    r.P = r.P.filter(p => p.life > 0 && p.y < ZH + 40);
    c.globalAlpha = fadeOut; c.font = 'bold 13px "Lilita One", sans-serif'; c.fillStyle = '#05060f'; c.fillText(r.name.toUpperCase(), 9, ZH - 11); c.fillStyle = r.col; c.fillText(r.name.toUpperCase(), 8, ZH - 12);
  }
  // act 3 (1750 ms): impact flash, shockwave, embers
  if (false) {
    const k = Math.min(1, (t - 1750) / 450);
    if (!r.shook) { r.shook = true; const gc = document.getElementById('game') || document.querySelector('canvas'); if (gc) { gc.classList.remove('zshake'); void gc.offsetWidth; gc.classList.add('zshake'); } }
    c.globalAlpha = Math.max(0, .9 - k * 1.4); c.fillStyle = '#ffffff'; c.fillRect(0, 0, ZW, ZH);
    c.globalAlpha = (1 - k) * fadeOut; pxRing(c, CX, CY, 8 + k * 170, '#ffffff', 3); pxRing(c, CX, CY, 4 + k * 120, r.col, 2);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; px(c, CX + Math.cos(a) * k * 140, CY + Math.sin(a) * k * 80, 3, i % 2 ? r.col : '#fff3a0'); }
  }
  c.globalAlpha = 1;
  if (t >= 1600) { ZFX.run = null; c.clearRect(0, 0, ZW, ZH); ZFX.cv.style.display = 'none'; return; }
  ZFX.loop = requestAnimationFrame(zFrame);
}

/* ---------- VFX hooks the simulation calls (also replayed in online battles) ---------- */
VFX.zStart = (S, monName, zName, zType) => { zStart(S, monName, zName, zType); VFX.shake(3, 600); zSmashStart(S, monName, zType); };
VFX.zImpact = (S, zType) => { const fs = other(S), sd = side(fs); try { VFX.shake(22, 800); for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, v = 160 + Math.random() * 260; spark(sd.x, sd.y - 30, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 520, life: 700 + Math.random() * 400, color: Math.random() < .5 ? '#ffffff' : zTypeCol(zType) }); } burstAt(sd.x, sd.y - 30, zTypeCol(zType), 70, 620, 4); burstAt(sd.x, sd.y - 30, '#ffffff', 40, 420, 3); } catch (e) { } };
VFX.dodge = (S, dx, dy) => {
  const sd = side(S); try { for (let i = 1; i <= 4; i++) burstAt(sd.x - dx * i * 14, sd.y - 20 - dy * i * 8, 'rgba(160,220,255,.9)', 3, 80, 1); } catch (e) { }
  if (S === 'A' && typeof haptic === 'function') haptic(15);
};

/* ---------- buttons, gauge and keys ---------- */
(function zUi() {
  const bM = $('bMega'), tM = $('tMega');
  if (bM) { bM.textContent = 'Z-MOVE'; bM.classList.add('zbtn'); bM.title = 'Z-Move (Z or M) \u2014 fills as you battle; once per battle'; }
  if (tM) { tM.textContent = 'Z'; tM.classList.add('zbtn'); tM.title = 'Z-Move'; }
  // desktop: Dodge after the Z-Move button; phone: Dodge where Mega was, Z to its left
  const mk = (id, txt) => { const b = document.createElement('button'); b.className = 'btn'; b.id = id; b.type = 'button'; b.textContent = txt; return b; };
  if (bM) { const d = mk('bDodge', 'Dodge'); d.title = 'Dodge (Shift) \u2014 dash the way you are moving; attacks pass through you for a moment'; bM.after(d); d.onclick = () => doDodge(); }
  if (tM) { const d = mk('tDodge', 'DODGE'), row = document.createElement('div'); row.className = 'zd-row'; tM.before(row); row.append(tM, d); d.addEventListener('pointerdown', e => { e.preventDefault(); if (doDodge() && typeof haptic === 'function') haptic(25); }); }
  addEventListener('keydown', e => {
    if (!G || G.auto || e.repeat || /INPUT|SELECT|TEXTAREA/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'Shift') { doDodge(); e.preventDefault(); }
    else if (e.key === 'z' || e.key === 'Z') { megaEvolve('A'); }
  });
  const tick = () => {
    requestAnimationFrame(tick);
    if (!G || !G.sides) return; const sd = side('A'); if (!sd) return;
    const used = !!(act('A') && act('A').zUsed), z = used ? 0 : Math.round(sd.zCharge || 0), ready = !G.auto && canMega('A'), tc = zTypeCol((zMoveOf(act('A')) || {}).type);
    for (const b of [bM, tM]) if (b) { b.style.setProperty('--z', z); b.style.setProperty('--zc', tc); b.classList.toggle('ready', ready); if (b === bM) b.textContent = used ? 'Z-MOVE USED' : ready ? 'Z-MOVE!' : `Z-MOVE ${z}%`; }
    const cd = sd.dodgeCd > 0 ? 100 - Math.round(sd.dodgeCd / DODGE_CD * 100) : 100;
    for (const id of ['bDodge', 'tDodge']) { const b = $(id); if (b) { b.style.setProperty('--d', cd); b.classList.toggle('cool', cd < 100); b.disabled = !!G.auto; } }
  };
  requestAnimationFrame(tick);
})();
// Dodge the way the player is moving (online: the server does it)
function doDodge() {
  if (!G || G.auto) return false; const sd = side('A');
  if (typeof NET !== 'undefined' && NET.active) { if (!canDodge('A')) return false; const l = Math.hypot(sd.vx, sd.vy) || 1; netSend({ t: 'dodge', x: +(sd.vx / l).toFixed(3), y: +(sd.vy / l).toFixed(3) }); return true; }
  return dodge('A', sd.vx, sd.vy);
}

/* ---------- Z-Move attacks: real moves, launched from the attacker and landing on the target ----------
   Every Pokémon has its own recipe (in Pokédex order), written from what that Pokémon actually does:
     path head trail impact count size   [; a second phase]
   paths   line arc spiral zig wave fan rain ground orbit boom beam nova  ·  area attacks: meteor (from the sky) sweep (a wall across the arena) cage (closing in from all sides) field (eruptions across the ground)
   heads   orb bolt shard leaf flame bubble star fist blade rock feather note petal ghost crescent ring drill needle egg bone flake seed wing horn sludge sand heart eye
   trails  spark smoke ribbon after glitter ember drop dust
   impacts blast pillar vortex shatter bloom crater dome starburst quake geyser implode cross
   Drawn with the game's own pixel helpers, at 3–10× the size of regular moves. Nothing is laid over the stage. */
const Z_RECIPES = ["fan seed ribbon bloom 7 1", "wave leaf ribbon bloom 9 1.1", "orbit petal glitter bloom 14 1.3;beam leaf ribbon geyser 1 1.2", "arc flame ember blast 5 1", "spiral flame ember pillar 6 1.1", "orbit flame ember blast 8 1.1;beam flame ember pillar 1 1.3", "wave bubble drop geyser 8 1", "spiral bubble drop vortex 9 1.1", "fan orb drop geyser 2 1.4;sweep bubble drop vortex 8 1.1", "line needle ribbon cross 9 .8", "boom shard dust shatter 5 1", "orbit wing glitter implode 8 .9;sweep sand glitter implode 9 .9", "line needle spark cross 12 .8", "arc needle dust shatter 7 1", "zig needle after cross 10 1.1;line drill after pillar 2 1.3", "arc feather after vortex 8 1", "spiral feather after vortex 10 1.1", "sweep wing after vortex 7 1.1;line feather after starburst 10 .9", "zig fist after starburst 6 1", "line crescent after cross 6 1.2", "zig feather after cross 9 .9", "line drill after pillar 3 1.4", "wave sludge smoke dome 8 1", "spiral sludge smoke implode 10 1.2;rain sludge drop dome 12 1", "zig bolt spark pillar 6 1.1;meteor bolt spark pillar 5 1.2", "wave bolt spark starburst 10 1.3;orbit orb spark pillar 6 1.4", "ground sand dust crater 6 1", "fan blade dust cross 8 1.2;ground needle dust quake 10 1", "line horn sludge dome 6 1", "arc horn sludge dome 8 1.1", "field rock dust quake 7 1.1;meteor sludge drop dome 7 1", "zig horn sludge cross 6 1", "spiral horn sludge cross 8 1.1", "field horn dust quake 7 1.1;line drill sludge pillar 2 1.3", "meteor star glitter bloom 7 .9", "cage star glitter implode 10 1;nova heart glitter bloom 1 1.1", "fan flame ember blast 6 1", "cage flame ember vortex 9 1.1;fan flame ember pillar 7 1", "wave note glitter dome 9 1", "nova note glitter dome 1 1.4;spiral heart glitter bloom 8 1.1", "zig wing after cross 8 .9", "spiral wing smoke implode 10 1.1;line sludge smoke blast 3 1.3", "rain leaf ribbon bloom 9 .9", "arc sludge smoke bloom 8 1.1", "cage petal glitter bloom 12 1;nova petal smoke dome 1 1.1", "ground seed dust bloom 8 1", "fan seed smoke dome 10 1.1;ground leaf dust crater 8 1", "wave eye glitter implode 6 1", "orbit wing glitter dome 8 1;sweep sand glitter dome 10 .8", "field sand dust quake 5 .9", "field rock dust quake 9 1;line drill dust crater 3 1.1", "fan ring glitter starburst 10 .9", "zig blade after cross 6 1.2", "wave eye glitter vortex 6 1.1", "spiral bubble drop vortex 10 1.2;nova eye glitter implode 1 1.2", "zig fist after starburst 8 1", "fan fist after starburst 12 1.2;line fist after blast 3 1.5", "arc flame ember blast 6 1.1", "line flame after pillar 3 1.3;sweep flame ember blast 8 1.1", "wave bubble drop vortex 7 .9", "spiral ring drop vortex 9 1.1", "fan fist drop geyser 8 1.2;line fist drop starburst 2 1.6", "nova eye glitter implode 1 1", "orbit eye glitter implode 8 1.1", "cage eye glitter implode 10 1;beam ring glitter implode 1 1.1", "line fist dust starburst 6 1", "zig fist dust starburst 9 1.1", "fan fist dust starburst 16 1.2;line fist after crater 4 1.6", "wave leaf ribbon cross 6 1", "arc sludge drop dome 7 1.1", "spiral leaf ribbon vortex 12 1.2;arc sludge drop geyser 6 1.3", "wave needle drop geyser 8 1", "fan needle drop geyser 12 1.2;wave sludge drop vortex 8 1.2", "arc rock dust crater 6 1.1", "meteor rock dust crater 6 1.1", "arc rock dust crater 4 1.5;field rock dust quake 7 1.1", "line flame ember blast 5 1.1", "line horn after pillar 3 1.4;ground flame ember blast 10 1.1", "nova eye drop implode 1 1.1", "spiral eye drop implode 8 1.2;wave bubble drop geyser 8 1.1", "zig bolt spark starburst 7 1", "orbit bolt spark starburst 8 1.1;cage ring spark pillar 6 1", "boom blade after cross 4 1.3", "zig feather after starburst 8 1.1", "fan feather after starburst 12 1.1;line drill after cross 3 1.3", "wave flake drop shatter 8 1", "spiral flake drop shatter 10 1.1;sweep flake drop shatter 8 1", "ground sludge drop dome 7 1.2", "meteor sludge drop dome 8 1.1;nova sludge smoke dome 1 1.1", "line shard drop shatter 6 1", "fan shard drop shatter 16 1.1;spiral needle glitter shatter 10 1.1", "wave ghost smoke implode 6 1", "cage ghost smoke implode 7 1", "cage ghost smoke implode 10 1.1;nova orb smoke implode 1 1.2", "field rock dust quake 8 1.2;arc rock dust crater 4 1.2", "wave ring glitter implode 7 1.1", "cage ring glitter vortex 8 1.1;nova eye smoke implode 1 1.1", "fan bubble drop cross 8 1", "line crescent drop cross 3 1.6;fan bubble drop geyser 10 1.1", "arc orb spark blast 4 1.2", "nova orb spark blast 1 1.5;cage bolt spark starburst 8 1", "arc egg glitter bloom 6 1.1", "meteor egg glitter bloom 8 1.1;fan seed ribbon geyser 8 1", "boom bone dust crater 2 1.4", "boom bone dust crater 4 1.3;field rock dust quake 6 1", "arc fist after starburst 4 1.5;line fist after crater 2 1.6", "zig fist after starburst 14 1.1;line fist spark blast 2 1.5", "wave ring smoke dome 8 1.1", "arc sludge smoke dome 6 1.3", "nova sludge smoke blast 1 1.4;meteor sludge smoke dome 7 1", "line horn dust crater 3 1.4", "line drill dust crater 3 1.4;field rock dust quake 8 1.1", "arc egg glitter blast 6 1.2", "wave leaf ribbon vortex 12 1.1", "line fist dust crater 5 1.2;field rock dust quake 5 1", "spiral bubble drop geyser 7 1", "beam bubble drop vortex 1 1.3;spiral orb drop geyser 8 1.1", "line horn drop geyser 4 1.2", "spiral horn drop vortex 6 1.3", "boom star glitter starburst 4 1.2", "orbit star glitter starburst 8 1.1;cage ring glitter implode 8 1", "nova ring glitter dome 1 1.5;fan eye glitter implode 8 1.1", "zig blade after cross 10 1.2;fan blade after cross 8 1.3", "wave heart glitter shatter 7 1;sweep flake glitter shatter 9 1", "zig bolt spark pillar 10 1.2;line fist spark starburst 3 1.4", "spiral flame ember pillar 9 1.3;line fist ember blast 3 1.4", "line horn dust cross 2 1.7;zig blade after cross 6 1.2", "field horn dust quake 7 1.1;line horn after crater 3 1.3", "arc bubble drop geyser 3 .9", "sweep orb drop vortex 10 1.2;beam bubble drop geyser 1 1.3", "sweep bubble drop geyser 9 1.1;beam flake glitter shatter 1 1.2", "boom ring glitter blast 6 1.1", "orbit star glitter blast 8 1.1;fan orb glitter starburst 8 1.1", "sweep bubble drop vortex 10 1.1;cage bubble glitter geyser 8 1", "zig needle spark pillar 14 1.1;beam bolt spark starburst 1 1.3", "spiral flame ember blast 12 1.2;nova flame ember pillar 1 1.4", "zig ring spark cross 8 1.1;beam ring glitter starburst 1 1.2", "spiral shard drop shatter 7 1.1", "spiral drill drop shatter 6 1.3;rain rock drop crater 10 1.1", "line blade dust cross 5 1.1", "zig blade drop cross 10 1.3;fan crescent drop cross 6 1.3", "meteor rock dust crater 7 1.2;line wing after starburst 3 1.2", "arc orb dust crater 1 2;field rock dust quake 6 1", "sweep flake glitter shatter 9 1;cage shard glitter shatter 10 1", "meteor bolt spark pillar 9 1.2;cage bolt spark starburst 8 1", "meteor flame ember blast 8 1.2;sweep flame ember pillar 7 1", "wave ring after vortex 6 1", "spiral orb after vortex 10 1.2;wave bolt spark pillar 6 1.1", "meteor orb after vortex 8 1.1;line fist after crater 2 1.4", "cage eye glitter implode 14 1.1;beam orb glitter implode 1 1.4", "nova star glitter bloom 1 1.3;cage orb glitter starburst 10 1.1"];
const ZS = [];
const ZS_START = 1500, ZS_HIT = 2200, ZS_END = 2800;          // ms after the Z-Move begins: launch, impact, end
const hashStr = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const dexIndex = name => DEX.findIndex(d => d.name === name);
function zRecipe(name) {
  const r = Z_RECIPES[dexIndex(name)] || 'line orb spark blast 6 1';
  return r.split(';').map(ph => { const [path, head, trail, impact, n, size] = ph.trim().split(/\s+/); return { path, head, trail, impact, n: +n, size: +size }; });
}
function spriteAccent(img) {
  try { const x = img.getContext('2d').getImageData(0, 0, img.width, img.height).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < x.length; i += 16) if (x[i + 3] > 200 && x[i] + x[i + 1] + x[i + 2] > 120 && x[i] + x[i + 1] + x[i + 2] < 700) { r += x[i]; g += x[i + 1]; b += x[i + 2]; n++; }
    if (n) return '#' + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join(''); } catch (e) { }
  return null;
}
function zSmashStart(S, mon, type) {
  if (!G) return; const m = act(S), seed = hashStr(mon), col = zTypeCol(type), img = zSprite(mon);
  const second = m.types[1] && m.types[1] !== type ? zTypeCol(m.types[1]) : (zTypeCol(m.types[0]) !== col ? zTypeCol(m.types[0]) : null);
  const acc = (img && spriteAccent(img)) || second || zMix(col, '#ffffff', .3);
  ZS.push({ S, mon, t0: clock.t, phases: zRecipe(mon), seed, col, acc, light: zMix(col, '#ffffff', .55), dark: zMix(col, '#000000', .45), spin: seed & 1 ? 1 : -1, landed: {} });
}
let Wv = 1000;                                                     // visible width, set each frame
function zPath(z, ph, k, q, A, F, U, H) {
  const dx = F.x - A.x, dy = F.y - A.y, L = Math.hypot(dx, dy) || 1, px2 = -dy / L, py2 = dx / L, n = ph.n, c = (k - (n - 1) / 2), sv = ((z.seed >> (k % 16)) & 7) / 7;
  const lin = (o = 0) => ({ x: A.x + dx * q + px2 * o, y: A.y + dy * q + py2 * o });
  switch (ph.path) {
    case 'arc': { const p = lin(c * 6 * U); p.y -= Math.sin(q * Math.PI) * H * (.32 + sv * .18); return p; }
    case 'spiral': { const a = q * Math.PI * 6 * z.spin + k * 2 * Math.PI / n, R = (1 - q) * 46 * U; const p = lin(Math.sin(a) * R); p.y += Math.cos(a) * R * .5; return p; }
    case 'zig': { const seg = 5, f = q * seg, tri = (Math.abs((f % 2) - 1) * 2 - 1); return lin(tri * (1 - q * .7) * (40 + sv * 20) * U + c * 4 * U); }
    case 'wave': return lin(Math.sin(q * Math.PI * 4 + k * 1.3) * (34 + sv * 18) * U * (1 - q * .5));
    case 'fan': { const t = q, cx = A.x + dx * .45 + px2 * c * 34 * U * (1 + sv * .5), cy = A.y + dy * .45 + py2 * c * 34 * U - 20 * U * Math.abs(c); return { x: (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * cx + t * t * F.x, y: (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * cy + t * t * F.y }; }
    case 'rain': { const sx = F.x + c * 30 * U + (sv - .5) * 60 * U, sy = F.y - H * .95; return { x: sx + (F.x + c * 8 * U - sx) * q, y: sy + (F.y - sy) * q }; }
    case 'ground': { const p = lin(c * 10 * U); p.y += 22 * U - Math.abs(Math.sin(q * Math.PI * 5 + k)) * 14 * U; return p; }
    case 'orbit': { if (q < .45) { const a = q / .45 * Math.PI * 2 * z.spin + k * 2 * Math.PI / n, R = 52 * U; return { x: A.x + Math.cos(a) * R, y: A.y - 10 * U + Math.sin(a) * R * .55 }; }
      const a0 = Math.PI * 2 * z.spin + k * 2 * Math.PI / n, ox = A.x + Math.cos(a0) * 52 * U, oy = A.y - 10 * U + Math.sin(a0) * 52 * U * .55, t = (q - .45) / .55; return { x: ox + (F.x - ox) * t, y: oy + (F.y - oy) * t }; }
    case 'boom': { const t = q, side2 = (k % 2 ? 1 : -1) * z.spin, cx = A.x + dx * .5 + px2 * side2 * H * .7, cy = A.y + dy * .5 + py2 * side2 * H * .7; return { x: (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * cx + t * t * F.x, y: (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * cy + t * t * F.y }; }
    case 'meteor': { const fromL = (k + (z.seed & 1)) % 2 === 0, sx = fromL ? F.x - Wv * (.35 + sv * .2) : F.x + Wv * (.35 + sv * .2), sy = -H * (.15 + sv * .1), ex = F.x + c * 10 * U, ey = F.y + (sv - .5) * 16 * U; return { x: sx + (ex - sx) * q, y: sy + (ey - sy) * q }; }
    case 'sweep': { const fromL = A.x < F.x, sx = fromL ? -30 * U : Wv + 30 * U, yy = F.y + c * (H * .7 / Math.max(1, n)); return { x: sx + (F.x - sx) * q, y: yy + (F.y - yy) * q * q * .55 }; }
    case 'cage': { const b = k / n * Math.PI * 2 + z.spin * q * 2, R = (1 - q) * H * .5 + 2 * U; return { x: F.x + Math.cos(b) * R, y: F.y + Math.sin(b) * R * .6 }; }
    case 'field': { const f = n > 1 ? k / (n - 1) : 1; return { x: A.x + dx * f + px2 * (sv - .5) * 50 * U, y: A.y + dy * f + py2 * (sv - .5) * 30 * U + 20 * U }; }
    default: return lin(c * 9 * U);
  }
}
function zHead(z, h, x, y, r, a, t, al = 1) {
  const C = z.col, L = z.light, W = '#ffffff', D = z.dark, X = z.acc, ca = Math.cos(a), sa = Math.sin(a);
  if (h !== 'bolt' && h !== 'needle') { aDisc(x, y, r * 1.9, X, al * .12); aDisc(x, y, r * 1.18, '#0b0d18', al * .38); }   // soft halo + outline: easy to read on any stage
  switch (h) {
    case 'bolt': { let px3 = x - ca * r * 3, py3 = y - sa * r * 3; for (let s = 1; s <= 5; s++) { const nx = x - ca * r * 3 * (1 - s / 5) + (Math.random() - .5) * r, ny = y - sa * r * 3 * (1 - s / 5) + (Math.random() - .5) * r; aLine(px3, py3, nx, ny, C, al, Math.max(2, r * .5)); aLine(px3, py3, nx, ny, W, al, Math.max(1, r * .22)); px3 = nx; py3 = ny; } aDisc(x, y, r * .7, W, al); break; }
    case 'flame': for (let s = 0; s < 5; s++) { const f = s / 5, j = Math.sin(t * 30 + s) * r * .3; aDisc(x - ca * r * 1.6 * f + j * sa, y - sa * r * 1.6 * f - r * f * .6, r * (1 - f * .6), [W, '#ffe066', '#ffb02e', '#ff5a1f', X][s], al * (1 - f * .3)); } break;
    case 'bubble': aRing(x, y, r, r, L, al, Math.max(2, r * .18)); aDisc(x - r * .35, y - r * .35, r * .25, W, al); aDisc(x, y, r * .8, C, al * .25); break;
    case 'leaf': case 'petal': { const c2 = h === 'petal' ? X : C; for (let s = -2; s <= 2; s++) aDisc(x + ca * s * r * .35, y + sa * s * r * .35, r * (1 - Math.abs(s) * .3) * .7, c2, al); aLine(x - ca * r, y - sa * r, x + ca * r, y + sa * r, L, al, 2); break; }
    case 'seed': aDisc(x, y, r * .8, '#8a5a2a', al); aDisc(x - r * .2, y - r * .25, r * .3, '#e8c48a', al); aRing(x, y, r * 1.2, r * 1.2, C, al * .6, 2); break;
    case 'shard': case 'flake': { const n2 = h === 'flake' ? 6 : 4; for (let s = 0; s < n2; s++) { const b = a + s * Math.PI * 2 / n2 + t * (h === 'flake' ? 3 : 0); aLine(x, y, x + Math.cos(b) * r * 1.4, y + Math.sin(b) * r * 1.4, s % 2 ? L : W, al, Math.max(2, r * .35)); } aDisc(x, y, r * .45, C, al); break; }
    case 'star': for (let s = 0; s < 5; s++) { const b = -Math.PI / 2 + s * Math.PI * 2 / 5 + t * 4 * z.spin; aLine(x, y, x + Math.cos(b) * r * 1.5, y + Math.sin(b) * r * 1.5, s % 2 ? '#ffe066' : X, al, Math.max(2, r * .45)); } aDisc(x, y, r * .55, W, al); break;
    case 'fist': aDisc(x, y, r, X, al); for (let s = -1; s <= 1; s++) aDisc(x + ca * r * .7 - sa * s * r * .45, y + sa * r * .7 + ca * s * r * .45, r * .32, L, al); aRing(x, y, r * 1.5, r * 1.5, W, al * .7, 2); break;
    case 'blade': case 'crescent': { const span = h === 'crescent' ? 1.6 : 1.1; for (let s = -6; s <= 6; s++) { const b = a + Math.PI / 2 + s / 6 * span; aDisc(x + Math.cos(b) * r * 1.5, y + Math.sin(b) * r * 1.5, Math.max(1.5, r * .32 * (1 - Math.abs(s) / 8)), s % 2 ? W : L, al); } break; }
    case 'rock': aDisc(x, y, r, '#8a7650', al); aDisc(x - r * .3, y - r * .3, r * .45, '#c8b080', al); aDisc(x + r * .35, y + r * .2, r * .25, '#5a4a30', al); break;
    case 'feather': case 'wing': { const len = h === 'wing' ? 2.2 : 1.5; aLine(x - ca * r * len, y - sa * r * len, x + ca * r, y + sa * r, W, al, 2); for (let s = 0; s < 6; s++) { const f = s / 6, bx2 = x - ca * r * len * f, by2 = y - sa * r * len * f; aLine(bx2, by2, bx2 - Math.cos(a - .9) * r * .9, by2 - Math.sin(a - .9) * r * .9, X, al, 2); aLine(bx2, by2, bx2 - Math.cos(a + .9) * r * .9, by2 - Math.sin(a + .9) * r * .9, L, al, 2); } break; }
    case 'note': aDisc(x, y, r * .6, X, al); aLine(x + r * .5, y, x + r * .5, y - r * 1.6, X, al, Math.max(2, r * .2)); aLine(x + r * .5, y - r * 1.6, x + r * 1.1, y - r * 1.2, X, al, Math.max(2, r * .2)); break;
    case 'heart': aDisc(x - r * .35, y - r * .2, r * .45, '#ff7ad9', al); aDisc(x + r * .35, y - r * .2, r * .45, '#ff7ad9', al); aDisc(x, y + r * .25, r * .42, '#ff7ad9', al); aDisc(x - r * .3, y - r * .3, r * .15, W, al); break;
    case 'eye': aDisc(x, y, r, W, al * .9); aDisc(x, y, r * .55, C, al); aDisc(x, y, r * .25, D, al); aRing(x, y, r * 1.4, r * .8, L, al * .7, 2); break;
    case 'ghost': aDisc(x, y, r, '#5a2d8f', al * .9); for (let s = 0; s < 4; s++) aDisc(x - ca * r * (1 + s * .5), y - sa * r * (1 + s * .5) + Math.sin(t * 20 + s) * r * .3, r * (.7 - s * .14), '#3a1f5a', al * .7); aDisc(x - r * .3, y - r * .15, r * .18, '#ff3a6a', al); aDisc(x + r * .3, y - r * .15, r * .18, '#ff3a6a', al); break;
    case 'ring': aRing(x, y, r * 1.3, r * 1.3, C, al, Math.max(2, r * .25)); aRing(x, y, r * .8, r * .8, X, al, Math.max(2, r * .18)); break;
    case 'drill': for (let s = 0; s < 8; s++) { const f = s / 8, w2 = r * (1 - f), b = t * 40 + s; aLine(x - ca * r * 2 * (1 - f) + sa * Math.sin(b) * w2, y - sa * r * 2 * (1 - f) - ca * Math.sin(b) * w2, x - ca * r * 2 * (1 - f) - sa * Math.sin(b) * w2, y - sa * r * 2 * (1 - f) + ca * Math.sin(b) * w2, s % 2 ? L : '#dfe6f0', al, 2); } break;
    case 'horn': for (let s = 0; s < 6; s++) { const f = s / 6; aDisc(x - ca * r * 1.8 * f, y - sa * r * 1.8 * f, r * (.25 + f * .7), s % 2 ? X : W, al); } break;
    case 'needle': aLine(x - ca * r * 2.6, y - sa * r * 2.6, x + ca * r * .4, y + sa * r * .4, L, al, Math.max(2, r * .25)); aDisc(x + ca * r * .4, y + sa * r * .4, Math.max(1.5, r * .2), W, al); break;
    case 'bone': aLine(x - ca * r * 1.4, y - sa * r * 1.4, x + ca * r * 1.4, y + sa * r * 1.4, '#efe6d0', al, Math.max(3, r * .4)); for (const sg of [-1, 1]) { aDisc(x + ca * r * 1.4 * sg - sa * r * .35, y + sa * r * 1.4 * sg + ca * r * .35, r * .35, '#efe6d0', al); aDisc(x + ca * r * 1.4 * sg + sa * r * .35, y + sa * r * 1.4 * sg - ca * r * .35, r * .35, '#efe6d0', al); } break;
    case 'egg': aDisc(x, y, r, '#fff3d6', al); aDisc(x - r * .3, y - r * .2, r * .2, X, al); aDisc(x + r * .3, y + r * .3, r * .16, X, al); break;
    case 'sludge': aDisc(x, y, r, '#8c3fc0', al); aDisc(x - r * .3, y - r * .3, r * .3, '#e3a6ff', al); for (let s = 0; s < 3; s++) aDisc(x - ca * r * (1.2 + s * .5), y - sa * r * (1.2 + s * .5) + r * .2 * s, r * (.4 - s * .1), '#6a2d8f', al); break;
    case 'sand': for (let s = 0; s < 9; s++) { const b = s * 2.4 + t * 5; aRect(x + Math.cos(b) * r * (.4 + (s % 3) * .3), y + Math.sin(b) * r * (.4 + (s % 3) * .3), Math.max(2, r * .25), Math.max(2, r * .25), s % 2 ? '#e8c890' : X, al); } break;
    default: aDisc(x, y, r * 1.25, C, al * .55); aDisc(x, y, r, X, al); aDisc(x, y, r * .62, L, al); aDisc(x, y, r * .3, W, al);
  }
}
function zTrail(z, tr, x, y, r, f, al) {
  const a = al * (1 - f);
  switch (tr) {
    case 'spark': if (Math.random() < .7) aRect(x + (Math.random() - .5) * r * 2, y + (Math.random() - .5) * r * 2, 3, 3, Math.random() < .5 ? '#ffffff' : z.light, a); break;
    case 'smoke': aDisc(x, y - f * r, r * (.5 + f * .9), '#3a3550', a * .45); break;
    case 'ember': aRect(x + (Math.random() - .5) * r, y + (Math.random() - .5) * r - f * r, 3, 3, f < .4 ? '#ffe066' : '#ff5a1f', a); break;
    case 'drop': aDisc(x, y + f * r * .5, r * .22 * (1 - f) + 1, '#bfe6ff', a); break;
    case 'dust': aDisc(x, y + r * .4, r * (.4 + f * .6), '#a08a6a', a * .4); break;
    case 'glitter': if (Math.random() < .6) { const sx = x + (Math.random() - .5) * r * 2, sy = y + (Math.random() - .5) * r * 2; aLine(sx - 3, sy, sx + 3, sy, '#ffffff', a); aLine(sx, sy - 3, sx, sy + 3, z.acc, a); } break;
    case 'ribbon': aDisc(x, y, r * .35 * (1 - f) + 1, z.acc, a * .8); break;
    case 'after': aDisc(x, y, r * .8 * (1 - f * .5), z.col, a * .3); break;
  }
}
function zImpactFx(z, kind, x, y, q, U, H, scale) {
  const C = z.col, L = z.light, W = '#ffffff', X = z.acc, a = 1 - q, s = scale;
  switch (kind) {
    case 'pillar': { const w = 34 * U * s * (1 - q * .4), top = y - H * 1.1 * Math.min(1, q * 4); aRect(x - w, top, w * 2, y - top + 10 * U, C, a * .8); aRect(x - w * .5, top, w, y - top + 10 * U, L, a * .9); aRect(x - w * .2, top, w * .4, y - top + 10 * U, W, a); break; }
    case 'vortex': for (let r2 = 0; r2 < 6; r2++) { const R = (120 * (1 - q) + 20) * U * s * (1 - r2 * .12); aRing(x, y, R, R * .55, r2 % 2 ? C : X, a, Math.max(2, 4 * U)); } aDisc(x, y, 20 * U * s * (1 - q), W, a); break;
    case 'shatter': for (let k = 0; k < 18; k++) { const b = k / 18 * Math.PI * 2 + z.seed % 7, d = q * 200 * U * s; aLine(x + Math.cos(b) * d * .5, y + Math.sin(b) * d * .35, x + Math.cos(b) * d, y + Math.sin(b) * d * .6, k % 2 ? L : W, a, Math.max(2, 6 * U)); } aDisc(x, y, 40 * U * s * (1 - q), L, a); break;
    case 'bloom': for (let k = 0; k < 10; k++) { const b = k / 10 * Math.PI * 2 + q * 2, d = (20 + q * 150) * U * s; aDisc(x + Math.cos(b) * d, y + Math.sin(b) * d * .6, 22 * U * s * (1 - q * .5), k % 2 ? X : '#ff9ad9', a); } aDisc(x, y, 30 * U * s * (1 - q * .5), '#ffe066', a); break;
    case 'crater': aRing(x, y + 16 * U, (40 + q * 180) * U * s, (40 + q * 180) * U * s * .35, '#5a4a30', a, Math.max(3, 8 * U)); for (let k = 0; k < 14; k++) { const b = Math.PI + k / 13 * Math.PI, d = q * 160 * U * s; aDisc(x + Math.cos(b) * d, y + Math.sin(b) * d * .9 + q * q * 120 * U, 8 * U * s, '#a08a6a', a); } break;
    case 'dome': aDisc(x, y, (30 + q * 150) * U * s, C, a * .35); aRing(x, y, (30 + q * 150) * U * s, (30 + q * 150) * U * s * .8, L, a, Math.max(3, 5 * U)); break;
    case 'starburst': for (let k = 0; k < 16; k++) { const b = k / 16 * Math.PI * 2, d = (40 + q * 260) * U * s; aLine(x, y, x + Math.cos(b) * d, y + Math.sin(b) * d * .6, k % 2 ? C : W, a, Math.max(3, 7 * U * (1 - q))); } break;
    case 'quake': for (let k = 0; k < 8; k++) { let cx = x, cy = y + 16 * U; const b = k / 8 * Math.PI * 2; for (let sg = 0; sg < 14 * Math.min(1, q * 3); sg++) { const nx = cx + Math.cos(b) * 20 * U * s + (Math.random() - .5) * 8 * U, ny = cy + Math.sin(b) * 9 * U * s; aLine(cx, cy, nx, ny, '#2a1a0a', a, Math.max(3, 6 * U)); aLine(cx, cy, nx, ny, L, a * .6, 2); cx = nx; cy = ny; } } break;
    case 'geyser': for (let k = 0; k < 40; k++) { const f = k / 40, h = H * Math.min(1, q * 3) * f; aDisc(x + Math.sin(k * 1.7 + q * 20) * 26 * U * s * f, y - h, (16 - f * 8) * U * s, f > .8 ? W : (k % 2 ? L : C), a); } break;
    case 'implode': for (let r2 = 0; r2 < 5; r2++) { const R = (220 * (1 - q) + 10) * U * s * (1 - r2 * .15); aRing(x, y, R, R * .6, r2 % 2 ? C : X, a, Math.max(2, 5 * U)); } if (q > .6) aDisc(x, y, 60 * U * s * (q - .6) * 2.5, W, a); break;
    case 'cross': { const Lx = (60 + q * 180) * U * s; for (const sg of [1, -1]) { aLine(x - Lx, y - sg * Lx * .7, x + Lx, y + sg * Lx * .7, C, a, Math.max(4, 22 * U * (1 - q * .5))); aLine(x - Lx, y - sg * Lx * .7, x + Lx, y + sg * Lx * .7, W, a, Math.max(2, 8 * U)); } break; }
    default: aDisc(x, y, (80 * (1 - q) + 20) * U * s, L, a); aDisc(x, y, (40 * (1 - q) + 10) * U * s, W, a); for (let r2 = 0; r2 < 3; r2++) aRing(x, y, (40 + q * 240 + r2 * 26) * U * s, (40 + q * 240 + r2 * 26) * U * s * .6, r2 % 2 ? C : X, a, Math.max(3, 5 * U));
  }
}
function drawZSmash() {
  if (!G || !ZS.length) return;
  const H = Math.round(DH / cam.pz), U = H / 280; Wv = Math.round(DW / cam.pz);
  for (let i = ZS.length - 1; i >= 0; i--) {
    const z = ZS[i], T = clock.t - z.t0 - ZS_START;
    if (clock.t < z.t0 || T > ZS_END) { ZS.splice(i, 1); continue; }
    if (T < 0) continue;
    const As = side(z.S), Fs = side(other(z.S)), A = { x: bx(As.x), y: by(As.y - 26) }, F = { x: bx(Fs.x), y: by(Fs.y - 24) }, t = T / 1000;
    if (T < 700) { const k = T / 700; for (let r2 = 0; r2 < 3; r2++) { const R = (48 * (1 - k) + 12 + r2 * 7) * U; aRing(A.x, A.y, R, R * .6, r2 % 2 ? z.col : z.acc, .8, Math.max(2, 2 * U)); } aDisc(A.x, A.y, (5 + k * 12) * U, z.light, .6); aDisc(A.x, A.y, (2 + k * 5) * U, '#ffffff', .9); }
    if (T > 300 && T < ZS_HIT) {                                    // target lock: a spinning reticle shows where it will land
      const R = (34 - Math.min(1, (T - 300) / 1500) * 10) * U, sp = t * 3 * z.spin;
      for (let s2 = 0; s2 < 4; s2++) { const b = sp + s2 * Math.PI / 2; aLine(F.x + Math.cos(b) * R, F.y + Math.sin(b) * R * .6, F.x + Math.cos(b + .9) * R, F.y + Math.sin(b + .9) * R * .6, z.acc, .85, Math.max(2, 2 * U)); aLine(F.x + Math.cos(b) * R * 1.25, F.y + Math.sin(b) * R * .75, F.x + Math.cos(b) * R * .85, F.y + Math.sin(b) * R * .5, '#ffffff', .9, 2); } }
    if (T > ZS_HIT - 160 && T < ZS_HIT) { const k = (ZS_HIT - T) / 160; for (let s2 = 0; s2 < 10; s2++) { const b = s2 / 10 * Math.PI * 2, R = k * 80 * U; aLine(F.x + Math.cos(b) * R, F.y + Math.sin(b) * R * .6, F.x + Math.cos(b) * (R + 14 * U), F.y + Math.sin(b) * (R + 14 * U) * .6, s2 % 2 ? '#ffffff' : z.col, 1, 2); } }
    const np = z.phases.length;
    z.phases.forEach((ph, pi) => {
      const s0 = 400 + pi * (ZS_HIT - 400) / np * .7, s1 = s0 + (ZS_HIT - 400) * (np === 1 ? 1 : .62), pg = (T - s0) / (s1 - s0);
      if (pg < 0 || pg > 1.05) return;
      const r = 6.5 * U * ph.size;
      if (ph.path === 'beam') {
        const tip = Math.min(1, pg * 1.8), ex = A.x + (F.x - A.x) * tip, ey = A.y + (F.y - A.y) * tip, th = Math.min(r * 1.1, 18 * U) * (1 + Math.sin(t * 40) * .08), fade = pg > .85 ? Math.max(0, (1.05 - pg) / .2) : 1;
        aLine(A.x, A.y, ex, ey, z.col, .7 * fade, th * 2); aLine(A.x, A.y, ex, ey, z.light, .9 * fade, th * 1.1); aLine(A.x, A.y, ex, ey, '#ffffff', fade, th * .45);
        for (let k = 0; k < 7; k++) { const f = ((t * 2.4 + k / 7) % 1) * tip; zHead(z, ph.head, A.x + (F.x - A.x) * f, A.y + (F.y - A.y) * f, r * .8, Math.atan2(F.y - A.y, F.x - A.x), t, fade); }
        { const dxb = ex - A.x, dyb = ey - A.y, lb = Math.hypot(dxb, dyb) || 1, nx = -dyb / lb, ny = dxb / lb, steps = Math.max(6, Math.round(lb / (4 * U)));
          for (const ph2 of [0, Math.PI]) { let lx = A.x, ly = A.y; for (let st = 1; st <= steps; st++) { const f = st / steps, w = Math.sin(f * lb / (14 * U) - t * 18 + ph2) * th * 1.5, x2 = A.x + dxb * f + nx * w, y2 = A.y + dyb * f + ny * w; aLine(lx, ly, x2, y2, ph2 ? z.acc : '#ffffff', fade * .9, 2); lx = x2; ly = y2; } } }
        aDisc(A.x, A.y, th * .9, z.light, fade); aDisc(A.x, A.y, th * .45, '#ffffff', fade);
        for (let sf = 0; sf < 6; sf++) { const b = sf / 6 * Math.PI * 2 + t * 6; aLine(A.x, A.y, A.x + Math.cos(b) * th * 2.4, A.y + Math.sin(b) * th * 1.6, sf % 2 ? '#ffffff' : z.acc, fade * .85, 2); }
        return;
      }
      if (ph.path === 'nova') {
        const D = Math.hypot(F.x - A.x, F.y - A.y) + 40 * U, R = Math.min(1, pg * 1.2) * D, fade = pg > .85 ? Math.max(0, (1.05 - pg) / .2) : 1;
        aRing(A.x, A.y, R, R * .6, z.col, .8 * fade, Math.max(3, r * .45)); aRing(A.x, A.y, R * .9, R * .54, z.acc, .6 * fade, 2);
        for (let k = 0; k < 10; k++) { const b = k / 12 * Math.PI * 2 + t * z.spin; zHead(z, ph.head, A.x + Math.cos(b) * R, A.y + Math.sin(b) * R * .6, r * .7, b, t, fade); }
        return;
      }
      for (let k = 0; k < ph.n; k++) {
        const q = ph.path === 'sweep' ? Math.min(1.2, pg * 1.05) : (pg - k / Math.max(1, ph.n) * .55) / .45; if (q < 0) continue;
        if (ph.path === 'sweep' && k === 0 && q < 1) {                // the wall itself: a curtain of the move's colour with a bright crest
          const top = zPath(z, ph, 0, q, A, F, U, H), bot = zPath(z, ph, ph.n - 1, q, A, F, U, H), x0 = Math.min(top.x, bot.x), y0 = Math.min(top.y, bot.y), y1 = Math.max(top.y, bot.y), dirx = F.x > A.x ? 1 : -1;
          for (let w = 0; w < 5; w++) aRect(x0 - dirx * w * 7 * U - 6 * U, y0 - 12 * U, 12 * U, y1 - y0 + 24 * U, w ? z.col : z.light, .5 - w * .09);
          for (let yy = y0 - 12 * U; yy < y1 + 12 * U; yy += 6 * U) aRect(x0 + dirx * 5 * U + Math.sin(yy * .3 + t * 30) * 2 * U, yy, 3 * U, 3 * U, '#ffffff', .9);
        }
        if (ph.path === 'field') {                                   // eruptions march across the ground toward the target
          const p = zPath(z, ph, k, 1, A, F, U, H), e = Math.min(1, q * 1.4), h = Math.sin(Math.min(1, e) * Math.PI) * H * .26 * ph.size;
          if (q < 1.25) { aRing(p.x, p.y, (8 + e * 18) * U, (8 + e * 18) * U * .4, '#2a1a0a', .8 * (1 - e * .5), Math.max(2, 3 * U)); aRect(p.x - 5 * U, p.y - h, 10 * U, h, z.col, .85); aRect(p.x - 2 * U, p.y - h, 4 * U, h, z.light, .95); zHead(z, ph.head, p.x, p.y - h, r * .8, -Math.PI / 2, t, 1); }
          continue;
        }
        if (q >= 1) { const key = pi + ':' + k; if (!z.landed[key]) z.landed[key] = T; const lq = (T - z.landed[key]) / 220; if (lq < 1) { const lx = F.x + (k - ph.n / 2) * 4 * U, R = (6 + lq * 26) * U; aRing(lx, F.y, R, R * .6, k % 2 ? '#ffffff' : z.acc, 1 - lq, 2); } continue; }
        const p = zPath(z, ph, k, q, A, F, U, H), p2 = zPath(z, ph, k, Math.max(0, q - .02), A, F, U, H), ang = Math.atan2(p.y - p2.y, p.x - p2.x);
        for (let j = 4; j >= 1; j--) { const pj = zPath(z, ph, k, Math.max(0, q - j * .04), A, F, U, H); zTrail(z, ph.trail, pj.x, pj.y, r, j / 5, .7); }
        if (ph.path === 'meteor') { const s0p = zPath(z, ph, k, 0, A, F, U, H), dl = Math.hypot(p.x - s0p.x, p.y - s0p.y) || 1, ux = (p.x - s0p.x) / dl, uy = (p.y - s0p.y) / dl; aLine(p.x - ux * 70 * U, p.y - uy * 70 * U, p.x, p.y, z.col, .5, Math.max(3, r * .9)); aLine(p.x - ux * 46 * U, p.y - uy * 46 * U, p.x, p.y, z.light, .85, Math.max(2, r * .45)); aLine(p.x - ux * 20 * U, p.y - uy * 20 * U, p.x, p.y, '#ffffff', 1, 2); }
        if (q < .08) { const s0p = zPath(z, ph, k, 0, A, F, U, H); aRing(s0p.x, s0p.y, (4 + q * 120) * U, (4 + q * 120) * U * .6, '#ffffff', 1 - q / .08, 2); }   // launch flash
        zHead(z, ph.head, p.x, p.y, r, ang, t, 1);
      }
    });
    if (T >= ZS_HIT) { const q = (T - ZS_HIT) / (ZS_END - ZS_HIT), last = z.phases[z.phases.length - 1]; zImpactFx(z, last.impact, F.x, F.y, q, U, H, .8); if (z.phases.length > 1 && z.phases[0].impact !== last.impact) zImpactFx(z, z.phases[0].impact, F.x, F.y, Math.min(1, q * 1.3), U, H, .5); }
  }
  bctx.globalAlpha = 1;
}
window.zRecipe = zRecipe;
const _drawWorldFx = drawWorldFx;
drawWorldFx = function () { _drawWorldFx.apply(this, arguments); try { drawZSmash(); } catch (e) { if (!window.__zFxErr) window.__zFxErr = String(e && e.stack || e).slice(0, 300); } };
window.doDodge = doDodge;
})();
