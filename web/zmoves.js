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
  const fadeOut = t > 2100 ? Math.max(0, 1 - (t - 2100) / 300) : 1;
  // backdrop: darkened screen tinted toward the type colour
  c.globalAlpha = Math.min(1, t / 250) * fadeOut; c.fillStyle = zMix('#05060f', r.col, .18); c.fillRect(0, 0, ZW, ZH);
  for (let y = 0; y < ZH; y += 4) { c.fillStyle = 'rgba(255,255,255,.025)'; c.fillRect(0, y, ZW, 1); }
  // act 1 (0–700 ms): Z crystal + diagonal cut-in banner
  if (t < 900) {
    const k = Math.min(1, t / 380), bx = -ZW + ease(k) * ZW;
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
  if (t >= 700 && t < 2200) {
    const k = Math.min(1, (t - 700) / 1050), a = Math.min(1, (t - 700) / 300) * fadeOut;
    drawSprite(c, r.img, CX, CY - 10, 150, .22 * a, r.col);
    drawSprite(c, r.img, CX + Math.sin(t / 40) * 1.5, CY - 10, 150, .14 * a);
    c.save(); c.globalAlpha = a; const f = ZCHOREO[r.type] || ZCHOREO.Normal; f(c, k, r.P, r.col, r.name); c.restore();
    r.P = r.P.filter(p => p.life > 0 && p.y < ZH + 40);
    c.globalAlpha = fadeOut; c.font = 'bold 13px "Lilita One", sans-serif'; c.fillStyle = '#05060f'; c.fillText(r.name.toUpperCase(), 9, ZH - 11); c.fillStyle = r.col; c.fillText(r.name.toUpperCase(), 8, ZH - 12);
  }
  // act 3 (1750 ms): impact flash, shockwave, embers
  if (t >= 1750) {
    const k = Math.min(1, (t - 1750) / 450);
    if (!r.shook) { r.shook = true; const gc = document.getElementById('game') || document.querySelector('canvas'); if (gc) { gc.classList.remove('zshake'); void gc.offsetWidth; gc.classList.add('zshake'); } }
    c.globalAlpha = Math.max(0, .9 - k * 1.4); c.fillStyle = '#ffffff'; c.fillRect(0, 0, ZW, ZH);
    c.globalAlpha = (1 - k) * fadeOut; pxRing(c, CX, CY, 8 + k * 170, '#ffffff', 3); pxRing(c, CX, CY, 4 + k * 120, r.col, 2);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; px(c, CX + Math.cos(a) * k * 140, CY + Math.sin(a) * k * 80, 3, i % 2 ? r.col : '#fff3a0'); }
  }
  c.globalAlpha = 1;
  if (t >= 2400) { ZFX.run = null; c.clearRect(0, 0, ZW, ZH); ZFX.cv.style.display = 'none'; return; }
  ZFX.loop = requestAnimationFrame(zFrame);
}

/* ---------- VFX hooks the simulation calls (also replayed in online battles) ---------- */
VFX.zStart = (S, monName, zName, zType) => { zStart(S, monName, zName, zType); VFX.shake(3, 600); };
VFX.zImpact = (S, zType) => { const fs = other(S), sd = side(fs); try { screenFlash('#ffffff', .5); VFX.shake(16, 600); burstAt(sd.x, sd.y - 30, zTypeCol(zType), 40, 420, 3); } catch (e) { } };
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
    const z = sd.zUsed ? 0 : Math.round(sd.zCharge || 0), ready = !G.auto && canMega('A'), tc = zTypeCol((zMoveOf(act('A')) || {}).type);
    for (const b of [bM, tM]) if (b) { b.style.setProperty('--z', z); b.style.setProperty('--zc', tc); b.classList.toggle('ready', ready); if (b === bM) b.textContent = sd.zUsed ? 'Z-MOVE USED' : ready ? 'Z-MOVE!' : `Z-MOVE ${z}%`; }
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

window.doDodge = doDodge;
})();
