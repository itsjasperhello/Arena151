/* =====================================================================
   Section 23: ROUTE CATCH ENCOUNTERS (Pokédex Adventure)
   One catch opportunity per route per run, on arrival at gyms 1–8.
   Set up like a Gen 1 battle: the wild Pokémon on the far platform, your
   trainer up close, route scenery behind. Gen 1 Safari Zone rules:
   1 Safari Ball, 1 Bait, Run. Safari Ball: R1 = 0–150 must be ≤ the catch
   rate, then R2 = 0–255 ≤ F where F = ⌊HPmax·255/12⌋ / ⌊HP/4⌋. Bait halves
   the catch rate and quarters the flee chance while it eats (1–5 turns).
   Each turn the Pokémon may flee: chance = 2·Speed / 256 (Speed at its level).
   If the ball fails, it runs away.
   ===================================================================== */
(function safariModule() {
// Gen 1 base Speed (Red/Blue) for the flee check.
const SPEED1 = [45, 60, 80, 65, 80, 100, 43, 58, 78, 45, 30, 70, 50, 35, 75, 56, 71, 91, 72, 97, 70, 100, 55, 80, 90, 100, 40, 65, 41, 56, 76, 50, 65, 85, 35, 60, 65, 100, 20, 45, 55, 90, 30, 40, 50, 25, 30, 45, 90,
  95, 120, 90, 115, 55, 85, 70, 95, 60, 95, 90, 90, 70, 90, 105, 120, 35, 45, 55, 40, 55, 70, 70, 100, 20, 35, 45, 90, 105, 15, 30, 45, 70, 60, 75, 100, 45, 70, 25, 50, 40, 70, 80, 95, 110, 70, 42, 67, 50, 75,
  100, 140, 40, 55, 35, 45, 87, 76, 30, 35, 60, 25, 40, 50, 60, 90, 60, 85, 63, 68, 85, 115, 90, 105, 95, 105, 93, 85, 110, 80, 81, 60, 48, 55, 65, 130, 65, 40, 35, 55, 55, 80, 130, 30, 85, 100, 90, 50, 70, 80, 130, 100];
const SAFARI = { busy: false };
const r256 = () => Math.floor(Math.random() * 256), rIn = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function pickWild(leg) {
  const R = ROUTES[leg], tot = R.mons.reduce((s, m) => s + m[3], 0); let x = Math.random() * tot;
  for (const [sp, lo, hi, w] of R.mons) { x -= w; if (x <= 0) return { sp, lv: rIn(lo, hi), rare: w < 1 }; }
  const m = R.mons[0]; return { sp: m[0], lv: m[1], rare: m[3] < 1 };
}
const wildSpeed = (sp, lv) => Math.floor((SPEED1[DEX_BY_NAME[sp].id - 1] + 8) * 2 * lv / 100) + 5;
const wildHP = (sp, lv) => { const b = baseStats(DEX_BY_NAME[sp]).hp; return Math.floor((b + 8) * 2 * lv / 100) + lv + 10; };
// One Safari Ball throw (Gen 1). Returns { caught, shakes }.
function safariBall(rate, hp) {
  const r1 = Math.floor(Math.random() * 151), F = Math.min(255, Math.floor(Math.floor(hp * 255 / 12) / Math.max(1, Math.floor(hp / 4))));
  let W = Math.floor(Math.floor(rate * 100 / 150) * F / 255), shakes = W < 10 ? 0 : W < 30 ? 1 : W < 70 ? 2 : 3;
  if (r1 > rate) return { caught: false, shakes };
  return r256() <= F ? { caught: true, shakes: 3 } : { caught: false, shakes };
}
/* Catch odds used in route encounters: the Gen 1 Safari Ball odds at very low HP ((rate + 1) / 151),
   with at least 50% for ordinary Pokémon, 25% for rare ones (rare spawns or catch rate under 45),
   10% for legendaries; never above 95%. Wobbles follow the odds. */
function catchChance(rate, rare) { let p = Math.min(1, (rate + 1) / 151); p = rate <= 3 ? Math.max(p, .1) : rare ? Math.max(p, .25) : Math.max(p, .5); return Math.min(.95, p); }
function safariCatch(rate, rare) {
  const p = catchChance(rate, rare), caught = Math.random() < p;
  const shakes = caught ? 3 : Math.max(0, (p > .7 ? 3 : p > .4 ? 2 : p > .15 ? 1 : 0) - (Math.random() < .35 ? 1 : 0));
  return { caught, shakes, p };
}
const SHAKE_MSG = ['You missed the POKéMON!', 'Darn! The POKéMON broke free!', 'Aww! It appeared to be caught!', 'Shoot! It was so close too!'];

/* ---------- styles and the overlay ---------- */
(function safariSetup() {
  const st = document.createElement('style');
  st.textContent = `
#safariOv{position:fixed;inset:0;z-index:88;display:none;background:#000;font-family:'Press Start 2P',var(--ui);color:#111}
#safariOv.show{display:block}
#safariOv canvas{position:absolute;left:50%;top:0;transform:translateX(-50%);image-rendering:pixelated;image-rendering:crisp-edges}
#safariOv .sf-box{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;width:min(1100px,calc(100% - 24px));display:flex;gap:10px;min-height:118px}
#safariOv .sf-msg,#safariOv .sf-menu{background:#f8f8f0;border:5px solid #283048;border-radius:10px;box-shadow:inset 0 0 0 3px #a8b0c8,0 6px 0 rgba(0,0,0,.35)}
#safariOv .sf-msg{flex:1;padding:14px 18px;font:800 clamp(14px,2vw,22px)/1.45 var(--ui);letter-spacing:.02em;white-space:pre-line}
#safariOv .sf-menu{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;min-width:280px}
#safariOv .sf-menu[hidden]{display:none}
#safariOv .sf-menu button{border:0;background:transparent;font:900 clamp(14px,1.8vw,20px) var(--ui);text-align:left;padding:8px 10px 8px 26px;border-radius:8px;cursor:pointer;position:relative;color:#111}
#safariOv .sf-menu button:hover:not(:disabled),#safariOv .sf-menu button:focus-visible{background:#e2e6f0}
#safariOv .sf-menu button:hover:not(:disabled)::before,#safariOv .sf-menu button:focus-visible::before{content:'\\25B6';position:absolute;left:8px;font-size:.8em;top:50%;transform:translateY(-50%)}
#safariOv .sf-menu button:disabled{color:#a0a6b8;cursor:default}
#safariOv .sf-menu small{font:700 .7em var(--ui);color:#5a6078;margin-left:4px}
#safariOv .sf-run{position:absolute;top:10px;right:12px;z-index:2;border:3px solid #283048;border-radius:10px;background:#f8f8f0;font:900 14px var(--ui);padding:7px 12px;cursor:pointer;color:#111}
#safariOv .sf-run:hover{background:#e2e6f0}
#safariOv .sf-msg{cursor:pointer}
#safariOv .sf-head{position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(8,12,34,.75);color:#fff;border-radius:10px;padding:6px 14px;font:800 13px var(--ui);letter-spacing:.06em;white-space:nowrap}
#safariOv{background:#0b0f24}
#safariOv .sf-tag{position:absolute;top:13%;left:max(12px,calc(50% - 30vw));background:#f8f8f0;border:4px solid #283048;border-radius:8px;padding:6px 12px;font:900 clamp(13px,1.7vw,19px) var(--ui);min-width:150px}
#safariOv .sf-tag small{display:block;font:800 .75em var(--ui);color:#5a6078}
@media (max-height:560px){#safariOv .sf-box{min-height:84px;bottom:6px}#safariOv .sf-msg{padding:8px 12px}#safariOv .sf-menu{min-width:220px;padding:6px}#safariOv .sf-menu button{padding:5px 8px 5px 22px}}`;
  document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'safariOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Wild Pokémon encounter');
  ov.innerHTML = '<canvas id="sfCv" width="480" height="270"></canvas><div class="sf-head" id="sfHead"></div><button type="button" class="sf-run" id="sfRun" aria-label="Run from the encounter">RUN ✕</button><div class="sf-tag" id="sfTag"></div><div class="sf-box"><div class="sf-msg" id="sfMsg" aria-live="polite"></div><div class="sf-menu" id="sfMenu" hidden></div></div>';
  document.body.appendChild(ov);
  // The scene covers the screen; on short screens it shifts up (trimming sky) so the trainer and platforms stay above the text box.
  const fit = () => { const c = $('sfCv'), box = ov.querySelector('.sf-box'), boxH = (box && box.offsetHeight) || 120, availH = innerHeight - boxH * .45;
    let W = Math.round(Math.max(innerWidth, innerHeight * 16 / 9)), H = Math.round(W * 9 / 16);
    if (H > availH * 1.08) { H = Math.round(availH); W = Math.round(H * 16 / 9); }          // short, wide screens: the whole scene fits above the text box
    c.style.width = W + 'px'; c.style.height = H + 'px'; c.style.top = '0px'; };
  addEventListener('resize', fit); window.__sfFit = fit;
})();

/* ---------- the scene painter (480×270, layered with depth) ---------- */
const W = 480, H = 270, SX = { c: null, t: 0 };
const P = (x, y, w, h, col) => { SX.c.fillStyle = col; SX.c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
const Dk = (x, y, r, col) => { const c = SX.c; c.fillStyle = col; r = Math.max(1, Math.round(r)); for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); } };
const El = (x, y, rx, ry, col) => { const c = SX.c; c.fillStyle = col; rx = Math.max(1, rx); ry = Math.max(1, Math.round(ry)); for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); } };
const Grad = (y0, y1, stops) => { const c = SX.c, g = c.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); };
const Glow = (x, y, r, col, a) => { const c = SX.c, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); };
const Poly = (pts, col) => { const c = SX.c; c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fill(); };
const Alpha = (a, f) => { SX.c.save(); SX.c.globalAlpha = a; f(); SX.c.restore(); };
const rng = s => () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) >>> 0) % 10000) / 10000;
const ridge = (y, amp, f1, f2, seed, col, step = 2) => { for (let x = 0; x < W; x += step) { const h = Math.sin(x * f1 + seed) * amp + Math.sin(x * f2 + seed * 3) * amp * .45; P(x, y - h, step, H - y + h, col); } };
const depthScale = (y, hz) => .35 + Math.max(0, (y - hz) / (H - hz)) * 1.5;
// --- props ---
function tree(x, y, s, pal) {
  El(x + 3 * s, y, 12 * s, 3 * s, 'rgba(0,0,0,.22)');
  P(x - 2.5 * s, y - 20 * s, 5 * s, 20 * s, pal[0]); P(x - 2.5 * s, y - 20 * s, 2 * s, 20 * s, pal[1]);
  Dk(x, y - 30 * s, 15 * s, pal[2]); Dk(x - 9 * s, y - 24 * s, 10 * s, pal[2]); Dk(x + 9 * s, y - 25 * s, 10 * s, pal[2]);
  Dk(x - 3 * s, y - 34 * s, 11 * s, pal[3]); Dk(x - 10 * s, y - 27 * s, 6 * s, pal[3]); Dk(x + 6 * s, y - 31 * s, 8 * s, pal[3]);
  Dk(x - 6 * s, y - 38 * s, 5 * s, pal[4]); Dk(x + 2 * s, y - 40 * s, 3 * s, pal[4]); Dk(x - 12 * s, y - 30 * s, 2.5 * s, pal[4]);
}
function pine(x, y, s, pal, snow) {
  El(x + 2 * s, y, 9 * s, 2.5 * s, 'rgba(0,0,0,.22)'); P(x - 1.5 * s, y - 8 * s, 3 * s, 8 * s, '#4a2e18');
  for (let k = 0; k < 4; k++) { const by = y - 6 * s - k * 9 * s, w = (16 - k * 3.4) * s; Poly([[x - w, by], [x, by - 14 * s], [x + w, by]], pal[0]); Poly([[x, by], [x, by - 14 * s], [x + w, by]], pal[1]); if (snow) Poly([[x - w * .45, by - 8 * s], [x, by - 14 * s], [x + w * .4, by - 8.5 * s]], '#f4f8ff'); }
}
function rock(x, y, s, pal) { El(x + 2 * s, y + 1, 12 * s, 3 * s, 'rgba(0,0,0,.25)'); El(x, y - 5 * s, 11 * s, 7 * s, pal[0]); El(x - 2 * s, y - 7 * s, 8 * s, 5 * s, pal[1]); El(x - 4 * s, y - 9 * s, 4 * s, 2 * s, pal[2]); P(x + 2 * s, y - 8 * s, 1, 5 * s, pal[0]); }
function bush(x, y, s, pal) { El(x, y, 14 * s, 3 * s, 'rgba(0,0,0,.2)'); Dk(x - 7 * s, y - 6 * s, 7 * s, pal[0]); Dk(x + 6 * s, y - 6 * s, 7 * s, pal[0]); Dk(x, y - 9 * s, 8 * s, pal[1]); Dk(x - 3 * s, y - 12 * s, 3 * s, pal[2]); }
function flower(x, y, s, col) { const r = Math.max(1, s * 1.4); P(x - r, y, r, r, col); P(x + r, y, r, r, col); P(x, y - r, r, r, col); P(x, y + r, r, r, col); P(x, y, r, r, '#ffe066'); P(x, y + r * 2, 1, r * 2, '#3a7a32'); }
function tuft(x, y, s, c1, c2, t, sway = 1) { for (let k = -2; k <= 2; k++) { const h = (7 - Math.abs(k) * 1.4) * s, sw = Math.sin(t / 420 + x * .05) * 1.6 * s * sway; SX.c.strokeStyle = k % 2 ? c1 : c2; SX.c.lineWidth = Math.max(1, s * 1.2); SX.c.beginPath(); SX.c.moveTo(x + k * 1.6 * s, y); SX.c.quadraticCurveTo(x + k * 2 * s + sw * .5, y - h * .6, x + k * 2.6 * s + sw, y - h); SX.c.stroke(); } }
function cloud(x, y, s, shade) { El(x, y + 3 * s, 26 * s, 5 * s, shade); Dk(x - 12 * s, y, 9 * s, '#ffffff'); Dk(x + 2 * s, y - 5 * s, 12 * s, '#ffffff'); Dk(x + 15 * s, y, 8 * s, '#ffffff'); El(x, y + 3 * s, 25 * s, 4 * s, '#ffffff'); El(x + 2 * s, y + 6 * s, 22 * s, 2 * s, shade); }
function mountain(x, base, w, h, c1, c2, snow) { Poly([[x - w / 2, base], [x, base - h], [x + w / 2, base]], c1); Poly([[x, base - h], [x + w / 2, base], [x + w * .1, base]], c2); if (snow) Poly([[x - w * .16, base - h * .66], [x - w * .08, base - h * .72], [x, base - h], [x + w * .1, base - h * .7], [x + w * .03, base - h * .74], [x - w * .03, base - h * .64]], '#f4f8ff'); }
function building(x, base, w, h, wall, roof, t, lit) {
  P(x, base - h, w, h, wall); P(x, base - h, w, 3, roof); P(x + w - 3, base - h, 3, h, 'rgba(0,0,0,.18)');
  for (let wy = base - h + 7; wy < base - 6; wy += 8) for (let wx = x + 4; wx < x + w - 5; wx += 7) { const on = lit && Math.sin(t / 900 + wx * 3.1 + wy * 1.7) > -.4; P(wx, wy, 4, 5, on ? '#ffd86a' : 'rgba(20,20,40,.55)'); if (on) P(wx, wy, 4, 1, '#fff2b8'); }
}
function vignette(a = .45) { const c = SX.c, g = c.createRadialGradient(W / 2, H * .45, H * .35, W / 2, H * .5, H * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function rays(x, col, a, t) { for (let i = 0; i < 5; i++) { const off = Math.sin(t / 2600 + i) * 10; Alpha(a, () => Poly([[x + i * 46 - 18 + off, -10], [x + i * 46 + 8 + off, -10], [x + i * 46 + 70 + off, 200], [x + i * 46 + 26 + off, 200]], col)); } }

/* ---------- eight scenes: back layers, depth-sorted props, foreground framing, particles ---------- */
const HZ = { forest: 120, cave: 128, meadow: 124, city: 128, safari: 126, tower: 130, sea: 112, mountain: 132 };
const SCENES = {
  forest: {
    back(t) { Grad(0, 125, ['#7fd3ff', '#bdeeff', '#e4f7d8']); Glow(380, 30, 90, '#fff6c0', .7); rays(250, '#fffbe0', .12, t);
      for (let i = 0; i < 3; i++) cloud(((t / 140 + i * 180) % 600) - 60, 26 + i * 12, .8 - i * .12, '#d6ecff');
      ridge(104, 7, .02, .05, 1, '#8fbf9a'); for (let i = 0; i < 14; i++) pine(i * 36 + 10, 112, .55, ['#5f9a6a', '#78b080']);
      ridge(116, 5, .03, .07, 3, '#4f8f4a'); const r = rng(5); for (let i = 0; i < 10; i++) tree(r() * W, 122, .55 + r() * .15, ['#5a3b1f', '#7a5230', '#2f6a32', '#3f8a3e', '#62b04e']);
      Grad(120, H, ['#6fc85c', '#4fae46', '#3c9440']); for (let y = 126; y < H; y += 6) Alpha(.18, () => P(0, y, W, 1, '#2f7a32')); },
    props: [[60, 150, 'tree'], [430, 146, 'tree'], [170, 140, 'bush'], [300, 138, 'flowers'], [455, 200, 'bush'], [24, 214, 'flowers'], [250, 200, 'flowers'], [340, 230, 'tuft'], [200, 238, 'tuft']],
    front(t) { for (let i = 0; i < 9; i++) { const x = i * 18 - 10, y = -4 + Math.sin(t / 900 + i) * 2; Dk(x, y + (i % 3) * 7, 16 - (i % 3) * 3, i % 2 ? '#24582a' : '#2f6a32'); Dk(x + 4, y + 10 + (i % 3) * 7, 6, '#4f9a44'); }
      for (let i = 0; i < 7; i++) { const x = W - i * 17 + 6, y = Math.sin(t / 1000 + i) * 2; Dk(x, y + (i % 3) * 6, 15 - (i % 3) * 3, i % 2 ? '#24582a' : '#2f6a32'); }
      for (let i = 0; i < 26; i++) tuft(i * 19 + (i % 3) * 4, H + 2, 2.4, '#2f7a32', '#5cc04a', t, 1.4); },
    fx(t) { for (let i = 0; i < 14; i++) { const a = Math.sin(t / 380 + i * 1.7); if (a > .2) Alpha(a, () => P(30 + (i * 37) % 420 + Math.sin(t / 900 + i) * 10, 70 + (i * 23) % 90 + Math.cos(t / 700 + i) * 6, 2, 2, '#fffba0')); }
      for (let i = 0; i < 7; i++) { const y = ((t / 26 + i * 47) % 300) - 20, x = (i * 73 + Math.sin(t / 500 + i) * 20) % W; P(x, y, 3, 2, i % 2 ? '#e0a030' : '#c8d040'); } }
  },
  cave: {
    back(t) { Grad(0, H, ['#120d1e', '#241a30', '#3a2c40']); for (let i = 0; i < 22; i++) { const x = i * 23 + 4, h = 16 + (i * 13) % 26; Poly([[x - 7, 0], [x + 7, 0], [x, h]], '#21182c'); Poly([[x, 0], [x + 7, 0], [x, h]], '#2e2440'); }
      for (let i = 0; i < 7; i++) { const x = 30 + i * 70, y = 84 + (i % 3) * 14, g = .5 + .5 * Math.sin(t / 480 + i); Glow(x, y, 26, '#a890ff', .35 * g); Poly([[x - 5, y + 10], [x, y - 8], [x + 5, y + 10]], '#9a80f0'); Poly([[x, y - 8], [x + 5, y + 10], [x + 1, y + 10]], '#c8b8ff'); P(x - 1, y - 4, 2, 3, '#ffffff'); }
      ridge(118, 10, .03, .08, 2, '#2c2238'); ridge(128, 6, .05, .11, 6, '#3a2e48');
      Grad(128, H, ['#4a3c54', '#332a3c', '#241e2c']); const r = rng(9); for (let i = 0; i < 40; i++) { const y = 130 + r() * 140, s = depthScale(y, 128); El(r() * W, y, 4 * s, 1.6 * s, '#2a2234'); } },
    props: [[50, 146, 'rock'], [430, 150, 'rock'], [190, 136, 'stalag'], [300, 134, 'stalag'], [460, 220, 'rock'], [20, 236, 'rock']],
    front(t) { Poly([[0, 0], [70, 0], [40, 40], [16, 80], [0, 120]], '#0e0a16'); Poly([[W, 0], [W - 80, 0], [W - 46, 46], [W - 20, 96], [W, 140]], '#0e0a16');
      Poly([[0, H], [0, 210], [40, 228], [90, 252], [120, H]], '#1a1422'); Poly([[W, H], [W, 220], [W - 50, 240], [W - 100, H]], '#1a1422'); },
    fx(t) { for (let i = 0; i < 6; i++) { const y = (t / 3.5 + i * 70) % 170; P(40 + i * 80, y, 1, 4, '#8fc8ff'); if (y > 160) El(40 + i * 80, 168, 4, 1, '#8fc8ff'); }
      for (let i = 0; i < 3; i++) { const x = (t / 10 + i * 210) % 560 - 40, y = 40 + Math.sin(t / 220 + i) * 14, f = Math.sin(t / 55 + i) > 0; Poly([[x - 9, y - (f ? 4 : -2)], [x - 2, y], [x - 9, y + 1]], '#2a1a40'); Poly([[x + 9, y - (f ? 4 : -2)], [x + 2, y], [x + 9, y + 1]], '#2a1a40'); Dk(x, y, 3, '#5a3a8a'); P(x - 2, y - 1, 1, 1, '#ff5a7a'); P(x + 1, y - 1, 1, 1, '#ff5a7a'); } }
  },
  meadow: {
    back(t) { Grad(0, 128, ['#4aa8ff', '#9ad4ff', '#dff2ff']); Glow(90, 40, 80, '#fffbe0', .6);
      for (let i = 0; i < 5; i++) cloud(((t / 110 + i * 130) % 640) - 80, 22 + (i % 3) * 16, .95 - (i % 3) * .2, '#cfe6ff');
      for (let i = 0; i < 9; i++) building(330 + i * 16, 112, 14, 30 + (i % 3) * 16, '#8a98c0', '#6a78a0', t, false);
      ridge(116, 8, .018, .05, 1, '#93d47e'); ridge(124, 6, .03, .07, 4, '#7cc86a');
      Grad(124, H, ['#86d872', '#62bc56', '#4ea848']); for (let y = 130; y < H; y += 7) Alpha(.16, () => P(0, y, W, 1, '#3f9a3c'));
      for (let i = 0; i < 24; i++) { const x = i * 21; P(x, 128, 2, 11, '#a87848'); P(x - 1, 127, 4, 2, '#c89868'); } P(0, 131, W, 2, '#c89868'); P(0, 136, W, 1, '#a87848'); },
    props: [[90, 150, 'flowers'], [400, 152, 'flowers'], [230, 146, 'bush'], [40, 200, 'flowers'], [300, 220, 'flowers'], [450, 230, 'flowers'], [160, 250, 'tuft'], [360, 248, 'tuft'], [470, 180, 'bush']],
    front(t) { for (let i = 0; i < 24; i++) tuft(i * 21, H + 2, 2.6, '#3f8f3c', '#7ed46a', t, 1.2); for (let i = 0; i < 10; i++) flower(10 + i * 50 + (i % 2) * 12, H - 14 - (i % 3) * 5, 2.2, ['#ff7aa8', '#ffe066', '#ffffff', '#b78cff', '#ff9a4a'][i % 5]); },
    fx(t) { for (let i = 0; i < 4; i++) { const x = 70 + i * 110 + Math.sin(t / 700 + i) * 30, y = 110 + Math.cos(t / 480 + i * 2) * 18, f = Math.sin(t / 70 + i) > 0, col = ['#ffffff', '#ffe066', '#7ad7ff', '#ff9ad9'][i];
      P(x - (f ? 5 : 3), y - 1, f ? 4 : 3, 3, col); P(x + 1, y - 1, f ? 4 : 3, 3, col); P(x, y, 1, 2, '#333'); } }
  },
  city: {
    back(t) { Grad(0, 130, ['#241a52', '#5a3a7a', '#ff8a5a', '#ffc27a']); Glow(380, 92, 70, '#ffd27a', .8); Dk(380, 92, 18, '#ffe6a0');
      const r = rng(11); for (let i = 0; i < 26; i++) { const x = i * 19 - 4, w = 16 + r() * 10, h = 26 + r() * 60; building(x, 128, w, h, i % 2 ? '#2a2448' : '#332c54', '#1a1630', t, true); }
      Grad(128, H, ['#4c4a5c', '#3a3848', '#2a2836']); P(0, 150, W, 22, '#34323f'); for (let x = (t / 6) % 46; x < W; x += 46) P(x, 160, 22, 2, '#f0e6a0');
      P(0, 148, W, 2, '#6a6878'); P(0, 172, W, 2, '#6a6878'); },
    props: [[40, 146, 'lamp'], [170, 146, 'lamp'], [300, 146, 'lamp'], [430, 146, 'lamp'], [100, 200, 'hedge'], [380, 205, 'hedge'], [240, 230, 'hedge']],
    front(t) { P(0, H - 18, W, 18, '#2a2836'); for (let x = 0; x < W; x += 16) { P(x, H - 40, 3, 26, '#4a4858'); } P(0, H - 40, W, 3, '#6a6878'); P(0, H - 30, W, 2, '#5a5868'); },
    fx(t) { const cx = (t / 3.2) % 620 - 80; P(cx, 152, 34, 10, '#d84040'); P(cx + 6, 146, 20, 7, '#f06060'); P(cx + 8, 147, 7, 4, '#9ad4ff'); P(cx + 30, 154, 3, 3, '#ffe880'); Dk(cx + 7, 162, 3, '#202028'); Dk(cx + 26, 162, 3, '#202028');
      const cx2 = W + 60 - ((t / 4.5) % 640); P(cx2, 162, 30, 9, '#4080d8'); P(cx2 + 6, 157, 16, 6, '#60a0f0'); P(cx2, 164, 3, 3, '#ffe880'); Dk(cx2 + 6, 171, 3, '#202028'); Dk(cx2 + 23, 171, 3, '#202028'); }
  },
  safari: {
    back(t) { Grad(0, 130, ['#ff9a5a', '#ffc27a', '#fff0b8']); Glow(120, 64, 110, '#fff6d0', .9); Dk(120, 64, 22, '#fff8e0');
      ridge(108, 10, .015, .04, 2, '#d8a070'); ridge(118, 7, .025, .06, 5, '#c08a58'); ridge(126, 4, .05, .09, 7, '#a87a48');
      for (const [x, s] of [[60, .7], [210, .55], [350, .8], [450, .6]]) { P(x - 1.5, 126 - 26 * s, 3, 26 * s, '#4a2e18'); El(x, 126 - 28 * s, 28 * s, 6 * s, '#3f6a24'); El(x - 8 * s, 126 - 32 * s, 16 * s, 4 * s, '#557f30'); }
      Grad(126, H, ['#e8c878', '#d0aa58', '#b08a40']); for (let y = 132; y < H; y += 6) Alpha(.15, () => P(0, y, W, 1, '#8a6a30'));
      for (let i = 0; i < 18; i++) { P(i * 27, 130, 3, 14, '#6a4428'); } P(0, 133, W, 2, '#8a5a34'); P(0, 139, W, 2, '#8a5a34');
      P(400, 108, 2, 22, '#5a3a20'); P(386, 104, 30, 10, '#e8d0a0'); P(388, 106, 26, 6, '#b8463a'); },
    props: [[80, 156, 'grassG'], [300, 150, 'rockS'], [440, 160, 'grassG'], [30, 220, 'grassG'], [230, 236, 'grassG'], [460, 238, 'rockS'], [150, 196, 'grassG']],
    front(t) { for (let i = 0; i < 34; i++) { const x = i * 15, h = 26 + (i % 4) * 8, sw = Math.sin(t / 380 + i) * 4; SX.c.strokeStyle = i % 2 ? '#c8a048' : '#e8c060'; SX.c.lineWidth = 3; SX.c.beginPath(); SX.c.moveTo(x, H + 2); SX.c.quadraticCurveTo(x + sw * .5, H - h * .6, x + sw, H - h); SX.c.stroke(); P(x + sw - 1, H - h - 3, 3, 5, '#f4d888'); } },
    fx(t) { for (let i = 0; i < 3; i++) { const x = (t / 7 + i * 200) % 560 - 40, y = 40 + i * 12 + Math.sin(t / 300 + i) * 4, f = Math.sin(t / 120 + i) > 0; P(x - 6, y - (f ? 2 : 0), 6, 1, '#4a2a1a'); P(x, y, 2, 2, '#4a2a1a'); P(x + 2, y - (f ? 2 : 0), 6, 1, '#4a2a1a'); } }
  },
  tower: {
    back(t) { Grad(0, 132, ['#0a0620', '#1e1240', '#4a2e6e']); for (let i = 0; i < 46; i++) if (Math.sin(t / 520 + i * 3) > -.2) P((i * 61) % W, (i * 23) % 90, 1, 1, i % 5 ? '#e8e0ff' : '#ffd0ff');
      Glow(100, 46, 70, '#fff4d0', .55); Dk(100, 46, 18, '#fff8e0'); Dk(94, 41, 4, '#ece2c4'); Dk(106, 52, 3, '#ece2c4');
      ridge(118, 6, .02, .05, 3, '#2a1e44'); P(300, 26, 58, 96, '#1a1230'); Poly([[296, 28], [329, 4], [362, 28]], '#2a1e46');
      for (let y = 36; y < 116; y += 14) { P(312, y, 9, 8, Math.sin(t / 650 + y) > 0 ? '#c08cff' : '#3a2a60'); P(338, y, 9, 8, Math.sin(t / 800 + y * 2) > .3 ? '#c08cff' : '#3a2a60'); }
      Glow(329, 60, 60, '#a060ff', .18 + .08 * Math.sin(t / 400));
      Grad(124, H, ['#3a3052', '#2a2240', '#181428']); },
    props: [[50, 150, 'grave'], [130, 142, 'grave'], [210, 138, 'grave'], [420, 150, 'grave'], [460, 200, 'grave'], [20, 220, 'grave'], [250, 210, 'deadtree'], [380, 232, 'grave']],
    front(t) { for (let i = 0; i < 4; i++) Alpha(.22, () => El(((t / 30 + i * 170) % 680) - 100, H - 30 + i * 6, 130, 12, '#c8c0e8'));
      Poly([[0, H], [0, 170], [14, 160], [26, 176], [36, H]], '#120c20'); Poly([[W, H], [W, 180], [W - 16, 172], [W - 30, 190], [W - 40, H]], '#120c20'); },
    fx(t) { for (let i = 0; i < 5; i++) { const x = 40 + i * 95 + Math.sin(t / 900 + i) * 26, y = 90 + Math.sin(t / 420 + i * 2) * 16; Alpha(.45 + .35 * Math.sin(t / 260 + i), () => { Glow(x, y, 14, '#a8f0ff', .8); Dk(x, y, 3, '#d8faff'); P(x - 1, y + 3, 2, 5, '#a8f0ff'); }); }
      for (let i = 0; i < 3; i++) Alpha(.2, () => El(((t / 45 + i * 210) % 700) - 110, 150 + i * 8, 110, 7, '#d8d0f0')); }
  },
  sea: {
    back(t) { Grad(0, 112, ['#5ab4ff', '#9ad4ff', '#e6f6ff']); Glow(390, 30, 80, '#fffbe0', .7);
      for (let i = 0; i < 4; i++) cloud(((t / 130 + i * 160) % 640) - 80, 20 + (i % 2) * 18, .9 - (i % 2) * .25, '#cfe6ff');
      for (const [x, w, h] of [[80, 90, 30], [200, 50, 18], [400, 110, 38]]) { Poly([[x - w / 2, 112], [x - w * .1, 112 - h], [x + w * .15, 112 - h * .8], [x + w / 2, 112]], '#bfe6f4'); Poly([[x - w * .1, 112 - h], [x + w * .15, 112 - h * .8], [x + w * .05, 112 - h * .55]], '#ffffff'); }
      Grad(112, H, ['#3a9ae0', '#2878c8', '#1a52a0']);
      for (let y = 116; y < H; y += 5) { const s = depthScale(y, 112); for (let x = ((t / 16 + y * 3) % (26 * s)) - 26 * s; x < W; x += 26 * s) P(x, y + Math.sin(t / 300 + x * .1) * s, 11 * s, Math.max(1, s * .9), y % 2 ? '#7cc8ff' : '#5ab0f0'); }
      Alpha(.35, () => { for (let y = 116; y < 160; y += 3) P(370 + Math.sin(t / 200 + y) * 6, y, 40 - (y - 116) * .5, 1, '#fff8d0'); }); },
    props: [[60, 140, 'buoy'], [440, 150, 'rockW'], [240, 132, 'rockW']],
    front(t) { for (let i = 0; i < 6; i++) { const y = H - 24 + i * 4, s = 3; for (let x = ((t / 8 + i * 30) % 60) - 60; x < W; x += 60) Alpha(.9, () => { El(x + 20, y, 26, 3, '#ffffff'); El(x + 20, y + 2, 26, 2, '#9ad4ff'); }); }
      for (let i = 0; i < 5; i++) { const x = 12 + i * 8, h = 40 + (i % 2) * 14, sw = Math.sin(t / 500 + i) * 3; SX.c.strokeStyle = i % 2 ? '#4a7a3a' : '#6a9a4a'; SX.c.lineWidth = 3; SX.c.beginPath(); SX.c.moveTo(x, H); SX.c.quadraticCurveTo(x, H - h / 2, x + sw, H - h); SX.c.stroke(); } },
    fx(t) { for (let i = 0; i < 16; i++) if (Math.sin(t / 180 + i * 5) > .6) { const x = (i * 53) % W, y = 120 + (i * 29) % 140; P(x - 2, y, 5, 1, '#ffffff'); P(x, y - 2, 1, 5, '#ffffff'); }
      for (let i = 0; i < 3; i++) { const x = ((t / 12 + i * 190) % 560) - 40, y = 40 + i * 12 + Math.sin(t / 300 + i) * 5, f = Math.sin(t / 110 + i) > 0; P(x - 7, y - (f ? 2 : 0), 7, 1, '#ffffff'); P(x, y, 2, 1, '#ffffff'); P(x + 2, y - (f ? 2 : 0), 7, 1, '#ffffff'); } }
  },
  mountain: {
    back(t) { Grad(0, 134, ['#6a8ad8', '#a8bfff', '#ffd8b8']); Glow(240, 110, 120, '#ffe0b0', .5);
      mountain(80, 132, 220, 110, '#7a7aa0', '#5e5e88', true); mountain(250, 132, 260, 128, '#6a6a94', '#52527c', true); mountain(420, 132, 200, 96, '#7a7aa0', '#5e5e88', true);
      P(236, 44, 30, 14, '#e8dcc0'); Poly([[232, 44], [251, 34], [270, 44]], '#c84040'); P(248, 50, 6, 8, '#6a5030');
      Alpha(.35, () => P(0, 104, W, 30, '#e8e0f4'));
      ridge(132, 5, .03, .08, 3, '#8a7a64'); Grad(132, H, ['#a08a70', '#8a745c', '#6a5848']); },
    props: [[40, 156, 'boulder'], [180, 146, 'boulder'], [440, 150, 'pine'], [400, 146, 'pine'], [470, 210, 'boulder'], [250, 236, 'rockS'], [20, 230, 'pine']],
    front(t) { Poly([[0, H], [0, 196], [30, 186], [60, 204], [86, 230], [104, H]], '#5a4a3c'); Poly([[0, H], [0, 214], [40, 210], [70, 236], [80, H]], '#7a6a58'); Poly([[W, H], [W, 200], [W - 40, 196], [W - 70, 222], [W - 90, H]], '#5a4a3c'); },
    fx(t) { for (let i = 0; i < 12; i++) { const y = 20 + i * 18, x = (t / 2.2 + i * 70) % 600 - 60; Alpha(.5, () => P(x, y, 34, 1, '#ffffff')); }
      for (let i = 0; i < 10; i++) { const y = ((t / 18 + i * 40) % 290) - 10, x = (i * 53 + t / 30) % W; P(x, y, 2, 2, '#ffffff'); } }
  }
};
// Props drawn by depth (further = smaller); one painter per kind.
function prop(kind, x, y, hz, t) {
  const s = depthScale(y, hz);
  switch (kind) {
    case 'tree': return tree(x, y, s, ['#5a3b1f', '#7a5230', '#2a6a30', '#3c8a3c', '#6ac052']);
    case 'pine': return pine(x, y, s, ['#2a5a3a', '#3e7a4c'], true);
    case 'bush': return bush(x, y, s, ['#2f7a32', '#4f9e44', '#7ac860']);
    case 'flowers': { for (let i = 0; i < 7; i++) flower(x + (i - 3) * 6 * s, y - (i % 2) * 3 * s, s, ['#ff7aa8', '#ffe066', '#ffffff', '#b78cff', '#ff9a4a'][i % 5]); return; }
    case 'tuft': return tuft(x, y, s * 1.2, '#2f7a32', '#5cc04a', t);
    case 'rock': return rock(x, y, s, ['#3a2e44', '#5a4a66', '#8a7a98']);
    case 'rockS': return rock(x, y, s, ['#8a7a64', '#a8987e', '#d0c4a8']);
    case 'boulder': return rock(x, y, s * 1.4, ['#6a5a48', '#8a7a64', '#c0b098']);
    case 'rockW': { El(x, y + 2, 16 * s, 3 * s, '#9ad4ff'); return rock(x, y, s, ['#5a6a78', '#7a8a98', '#c0d0dc']); }
    case 'stalag': { Poly([[x - 6 * s, y], [x, y - 26 * s], [x + 6 * s, y]], '#4a3c58'); Poly([[x, y - 26 * s], [x + 6 * s, y], [x + 1 * s, y]], '#5e4e70'); return; }
    case 'lamp': { P(x - 1, y - 40 * s, 2.5 * s, 40 * s, '#202030'); P(x - 4 * s, y - 44 * s, 8 * s, 5 * s, '#fff4c0'); Glow(x, y - 42 * s, 26 * s, '#ffe8a0', .45 + .1 * Math.sin(t / 300 + x)); El(x, y + 1, 8 * s, 2 * s, 'rgba(255,232,160,.25)'); return; }
    case 'hedge': { for (let i = -2; i <= 2; i++) Dk(x + i * 9 * s, y - 6 * s, 8 * s, i % 2 ? '#2a6a34' : '#337a3c'); P(x - 20 * s, y - 4 * s, 40 * s, 4 * s, '#245c2e'); return; }
    case 'grassG': { for (let i = -3; i <= 3; i++) tuft(x + i * 5 * s, y, s * 1.3, '#b8903c', '#e8c060', t); return; }
    case 'grave': { El(x + 2, y, 10 * s, 2.5 * s, 'rgba(0,0,0,.3)'); P(x - 7 * s, y - 16 * s, 14 * s, 16 * s, '#7a7490'); Dk(x, y - 16 * s, 7 * s, '#7a7490'); P(x - 5 * s, y - 16 * s, 3 * s, 14 * s, '#9a94b0'); P(x - 1 * s, y - 13 * s, 2 * s, 8 * s, '#55506c'); P(x - 3.5 * s, y - 10 * s, 7 * s, 2 * s, '#55506c'); return; }
    case 'deadtree': { P(x - 2 * s, y - 34 * s, 4 * s, 34 * s, '#2a2238'); for (const [a, l] of [[-.9, 14], [.7, 12], [-.4, 10], [1.1, 9]]) { SX.c.strokeStyle = '#2a2238'; SX.c.lineWidth = 2 * s; SX.c.beginPath(); SX.c.moveTo(x, y - 24 * s - l * .3 * s); SX.c.lineTo(x + Math.sin(a) * l * s, y - 24 * s - l * s); SX.c.stroke(); } return; }
    case 'buoy': { const b = Math.sin(t / 400) * 2; El(x, y + 2, 9 * s, 2 * s, '#9ad4ff'); P(x - 4 * s, y - 10 * s + b, 8 * s, 10 * s, '#e84040'); P(x - 4 * s, y - 6 * s + b, 8 * s, 3 * s, '#ffffff'); return; }
  }
}
// Battle platforms with texture: grass rims, rock edges, sand.
function platform(x, y, rx, ry, scene, t) {
  const pal = { forest: ['#3a8436', '#6fcb5a', '#93e07a'], meadow: ['#47973e', '#86d66c', '#a8e88e'], safari: ['#9a7840', '#dcbc78', '#f0d898'], cave: ['#2e2438', '#5a4a6a', '#7a6a8c'], city: ['#44445a', '#8a8aa2', '#a8a8c0'],
    tower: ['#262038', '#4e4670', '#6a6290'], sea: ['#b8a070', '#ecd8a8', '#fff0c8'], mountain: ['#5e4e3e', '#a89878', '#c8b898'] }[scene] || ['#3a8436', '#6fcb5a', '#93e07a'];
  El(x + 4, y + 4, rx + 4, ry + 3, 'rgba(0,0,0,.28)'); El(x, y, rx, ry, pal[0]); El(x, y - 2, rx - 4, ry - 3, pal[1]); El(x - rx * .2, y - ry * .4, rx * .45, ry * .35, pal[2]);
  const grassy = scene === 'forest' || scene === 'meadow' || scene === 'safari';
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, px = x + Math.cos(a) * rx * .96, py = y + Math.sin(a) * ry * .9;
    if (grassy) { if (Math.sin(a) > -.3) tuft(px, py + 2, rx / 70, scene === 'safari' ? '#b8903c' : '#2f7a32', scene === 'safari' ? '#e8c060' : '#5cc04a', t); }
    else if (i % 2) El(px, py, rx * .07, ry * .22, pal[0]); }
}

/* ---------- the encounter ---------- */
function safariEncounter(leg) {
  return new Promise(resolve => {
    const sv = STORY.save, R = ROUTES[leg], w = pickWild(leg); w.shiny = Math.random() < .25; w.key = w.sp + (w.shiny ? '|shiny' : '');
    const ov = $('safariOv'), cv = $('sfCv'), msgEl = $('sfMsg'), menu = $('sfMenu'), hz = HZ[R.scene] || 124, scene = SCENES[R.scene] || SCENES.forest;
    SX.c = cv.getContext('2d'); SX.c.imageSmoothingEnabled = false;
    // The same animated front sprite as in battle: <name>.gif, or <name>_shiny.gif for a shiny (switches in as soon as it has loaded).
    if (w.shiny) loadShiny(w.sp);
    const monFrame = t => { const sp = spriteOf(w.sp, false, w.shiny), r = sp.card || { x: 0, y: 0, s: sp.w };
      if (sp.custom && sp.front) { const a = ensureAnim(sp.front); return { img: a.frames[animFrameIndex(a, t)], r }; }
      return { img: sp.frames[Math.floor(t / 350) % sp.frames.length], r }; };
    const flashC = document.createElement('canvas'), flashX = flashC.getContext('2d');
    const tr = new Image(); tr.src = portraitUrl(sv.trainer);
    const S = { t0: performance.now(), mon: { x: 0, a: 1, white: 0, scale: 1, bob: false, gone: false, hit: 0 }, balls: 3, baits: 2, rocks: 2, turns: 3, eat: 0, angry: 0, rate: CATCH_RATE[w.sp] || 45, rare: w.rare || (CATCH_RATE[w.sp] || 45) < 45, hp: wildHP(w.sp, w.lv), spd: wildSpeed(w.sp, w.lv) };
    $('sfHead').textContent = `${R.name.toUpperCase()} \u00B7 ROUTE ENCOUNTER`;
    $('sfTag').innerHTML = `${w.shiny ? '<span style="color:#d89a00">\u2605</span> ' : ''}${w.sp.toUpperCase()}<small>:L${w.lv}${w.shiny ? ' \u00B7 SHINY' : ''}${dexEntry(sv, w.key) ? ' \u00B7 \u25CF in Pok\u00E9dex' : ''}</small>`;
    ov.classList.add('show'); menu.hidden = true; requestAnimationFrame(() => window.__sfFit && window.__sfFit());
    let typer = null;
    // Text types quickly; tap the text box (or Enter / Space / Z) to finish a line, tap again to move on.
    let skipNow = null;
    const say = (text, ms = 11) => new Promise(r => {
      clearInterval(typer); let k = 0, done = false, hold = null; msgEl.textContent = '';
      const end = () => { if (done) return; done = true; clearInterval(typer); clearTimeout(hold); msgEl.textContent = text; skipNow = null; r(); };
      const full = () => { clearInterval(typer); msgEl.textContent = text; skipNow = end; hold = setTimeout(end, 380); };
      skipNow = full;
      typer = setInterval(() => { msgEl.textContent = text.slice(0, ++k); if (k >= text.length) full(); }, ms);
    });
    msgEl.onclick = () => skipNow && skipNow();
    let ran = false;
    const runAway = () => { if (ran || S.caught) return; ran = true; clearInterval(typer); skipNow = null; menu.hidden = true; ov.classList.remove('show'); document.removeEventListener('keydown', keys, true); resolve({ caught: false, sp: w.sp, lv: w.lv, ran: true }); };
    $('sfRun').onclick = runAway;
    const keys = e => { if (!ov.classList.contains('show')) return; if (e.key === 'Escape') { e.preventDefault(); runAway(); } else if ((e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') && skipNow) { e.preventDefault(); skipNow(); } };
    document.addEventListener('keydown', keys, true);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const anim = (key, ms) => new Promise(r => { S[key] = { t0: performance.now(), ms }; setTimeout(r, ms); });
    const FAR = { x: 352, y: 150, rx: 74, ry: 15 }, NEAR = { x: 112, y: 262, rx: 120, ry: 24 };
    const mk = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; const x = k.getContext('2d'); x.imageSmoothingEnabled = false; return [k, x]; };
    const [backC, backX] = mk(), [nearC, nearX2] = mk(), [vigC, vigX] = mk(), mainC = SX.c, propsSorted = scene.props.slice().sort((a, b) => a[1] - b[1]);
    SX.c = vigX; vignette(R.scene === 'tower' || R.scene === 'cave' ? .55 : .32); SX.c = mainC;

    let cacheT = -1e9;
    const refreshLayers = t => {
      SX.c = backX; backX.clearRect(0, 0, W, H); scene.back(t); for (const p of propsSorted) if (p[1] <= FAR.y) prop(p[2], p[0], p[1], hz, t);
      SX.c = nearX2; nearX2.clearRect(0, 0, W, H); for (const p of propsSorted) if (p[1] > FAR.y) prop(p[2], p[0], p[1], hz, t);
      SX.c = mainC; cacheT = t;
    };
    const frame = now => {
      if (!ov.classList.contains('show')) return;
      const t = now - S.t0, c = SX.c; c.clearRect(0, 0, W, H);
      if (t - cacheT > 120) refreshLayers(t);
      c.drawImage(backC, 0, 0);
      const slide = Math.min(1, t / 450), farX = FAR.x + (1 - slide) * -420, nearX = NEAR.x + (1 - slide) * 420;
      platform(farX, FAR.y, FAR.rx, FAR.ry, R.scene, t);
      if (!S.mon.gone) {
        const h = 82 * S.mon.scale, bob = S.mon.bob ? Math.abs(Math.sin(t / 120)) * 4 : 0, mx = farX + S.mon.x + (S.mon.hit > now ? Math.sin(now / 25) * 5 : 0);
        Alpha(S.mon.a * .35, () => El(mx, FAR.y + 2, h * .32, 4, '#000'));
        const fr = monFrame(t), dx = Math.round(mx - h / 2), dy = Math.round(FAR.y - h + 6 - bob);
        c.save(); c.globalAlpha = S.mon.a; c.drawImage(fr.img, fr.r.x, fr.r.y, fr.r.s, fr.r.s, dx, dy, Math.round(h), Math.round(h)); c.restore();
        if (S.mon.white > 0) { const s2 = fr.r.s; if (flashC.width !== s2) { flashC.width = flashC.height = s2; } flashX.globalCompositeOperation = 'source-over'; flashX.clearRect(0, 0, s2, s2); flashX.drawImage(fr.img, fr.r.x, fr.r.y, s2, s2, 0, 0, s2, s2);
          flashX.globalCompositeOperation = 'source-in'; flashX.fillStyle = '#ffffff'; flashX.fillRect(0, 0, s2, s2); Alpha(S.mon.white * S.mon.a, () => c.drawImage(flashC, dx, dy, Math.round(h), Math.round(h))); }
        if (S.eat > 0 && S.mon.bob) { const k = (t / 450) % 1; Alpha(1 - k, () => { P(mx + 26, FAR.y - 70 - k * 14, 3, 3, '#ff7aa8'); P(mx + 29, FAR.y - 73 - k * 14, 3, 3, '#ff7aa8'); P(mx + 32, FAR.y - 70 - k * 14, 3, 3, '#ff7aa8'); }); }
      }
      if (w.shiny && !S.mon.gone && t > 450 && t < 1500) { const k = (t - 450) / 1050; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + k * 3, d = 18 + k * 34, sx = farX + Math.cos(a) * d, sy = FAR.y - 40 + Math.sin(a) * d * .7; Alpha(1 - k, () => { P(sx - 4, sy, 9, 2, i % 2 ? '#ffe066' : '#ffffff'); P(sx, sy - 4, 2, 9, i % 2 ? '#ffe066' : '#ffffff'); }); } }
      if (S.mon.angry > 0 && !S.mon.gone) { const k = (t / 300) % 1; P(farX + 24, FAR.y - 78 - k * 6, 4, 2, '#e83a3a'); P(farX + 30, FAR.y - 82 - k * 6, 2, 4, '#e83a3a'); P(farX + 33, FAR.y - 78 - k * 6, 4, 2, '#e83a3a'); }
      if (S.baitDown) { Dk(farX - 28, FAR.y + 2, 4, '#a8703a'); P(farX - 30, FAR.y, 2, 2, '#e0b070'); }
      if (S.ballAt) { const wob = S.wobA ? Math.sin(Math.min(1, (now - S.wobA.t0) / S.wobA.ms) * Math.PI * 2) * .55 : 0, dk = S.dropA ? Math.min(1, (now - S.dropA.t0) / S.dropA.ms) : 1; drawBall(farX, 104 + (FAR.y - 6 - 104) * dk - Math.abs(Math.sin(dk * Math.PI * 2)) * 9 * (1 - dk), wob, 1.5); }
      if (S.burstA) { const k = Math.min(1, (now - S.burstA.t0) / S.burstA.ms); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, d = k * 40; P(farX + Math.cos(a) * d, FAR.y - 24 + Math.sin(a) * d * .6, 3, 3, i % 2 ? '#ffffff' : '#ffe066'); } }
      if (S.starsA) { const k = Math.min(1, (now - S.starsA.t0) / S.starsA.ms); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * .7, d = 12 + k * 24, sx = farX + Math.cos(a) * d, sy = FAR.y - 12 + Math.sin(a) * d; P(sx - 3, sy, 7, 2, '#ffe066'); P(sx, sy - 3, 2, 7, '#ffe066'); } }
      c.drawImage(nearC, 0, 0);
      platform(nearX, NEAR.y, NEAR.rx, NEAR.ry, R.scene, t);
      if (tr.complete && tr.naturalWidth) { const h = 170, wv = h * tr.naturalWidth / tr.naturalHeight; Alpha(.3, () => El(nearX + 6, NEAR.y + 2, wv * .45, 6, '#000')); c.drawImage(tr, Math.round(nearX - wv / 2), Math.round(NEAR.y - h + 10), Math.round(wv), Math.round(h)); }
      if (S.baitA) { const k = Math.min(1, (now - S.baitA.t0) / S.baitA.ms), x = nearX + 40 + (farX - 28 - nearX - 40) * k, y = 160 - Math.sin(k * Math.PI) * 90 + (FAR.y - 160) * k; Dk(x, y, 4, '#a8703a'); P(x - 1, y - 2, 2, 2, '#e0b070'); }
      if (S.rockA) { const k = Math.min(1, (now - S.rockA.t0) / S.rockA.ms), x = nearX + 40 + (farX - nearX - 40) * k, y = 150 - Math.sin(k * Math.PI) * 90 + (FAR.y - 50 - 150) * k; Dk(x, y, 5, '#6a6050'); Dk(x - 1, y - 1, 3, '#9a9080'); P(x - 2, y - 3, 2, 2, '#c8c0b0'); }
      if (S.ballA) { const k = Math.min(1, (now - S.ballA.t0) / S.ballA.ms), x = nearX + 40 + (farX - nearX - 40) * k, y = 150 - Math.sin(k * Math.PI) * 110 + (104 - 150) * k; drawBall(x, y, k * 14, 1.5); }
      scene.front(t); scene.fx(t); c.drawImage(vigC, 0, 0);
      requestAnimationFrame(frame);
    };
    function drawBall(x, y, rot, k = 1) {
      const c = SX.c; c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(rot); c.scale(k, k);
      c.fillStyle = '#283048'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6aa84a'; c.beginPath(); c.arc(0, 0, 5, Math.PI, 0); c.fill(); c.fillStyle = '#f0f0e8'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI); c.fill();
      c.fillStyle = '#283048'; c.fillRect(-5, -1, 10, 2); c.fillStyle = '#ffffff'; c.fillRect(-1, -1, 2, 2); c.fillStyle = '#4a8a2a'; c.fillRect(-3, -4, 2, 2); c.fillRect(1, -4, 2, 2); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-3, -3, 1, 1); c.restore();
    }
    requestAnimationFrame(frame);
    try { if (typeof playCry === 'function') setTimeout(() => playCry(w.sp), 700); } catch (e) { }
    const fleeCheck = () => { let X = S.spd * 2; if (S.angry > 0) { X = Math.min(255, X * 2); S.angry--; if (S.angry <= 0) S.mon.angry = 0; } if (S.eat > 0) { X = Math.floor(X / 4); S.eat--; if (S.eat <= 0) S.mon.bob = false; } return X > 255 || r256() < X; };
    // After each throw: one turn used; the Pokémon may flee; after the third turn it runs away for sure.
    const endTurn = async () => { S.turns--; if (S.turns <= 0 || fleeCheck()) { if (S.turns <= 0) await say(`Wild ${w.sp.toUpperCase()} won\u2019t stay any longer!`); await fleeAnim(); return finish(false, `Wild ${w.sp.toUpperCase()} ran away!`); } return showMenu(); };
    const finish = async (caught, text) => {
      menu.hidden = true;
      if (caught) {
        const isNew = !dexEntry(sv, w.key); dexAdd(sv, w.key, w.lv); saveStory();
        await say(`All right! ${w.sp.toUpperCase()} was caught!`); await say(isNew ? `New POKéDEX data will be added for ${w.shiny ? 'shiny ' : ''}${w.sp.toUpperCase()}!` : `${w.sp.toUpperCase()}'s POKéDEX entry was updated.`);
        const inParty = sv.team.includes(w.key);
        msgEl.textContent = `${w.shiny ? 'Shiny ' : ''}${w.sp.toUpperCase()} (Lv ${dexEntry(sv, w.key).level}) is in your POKéDEX.` + (inParty ? '' : sv.team.length >= 6 ? '\nYour party is full \u2014 change it from the POKéDEX.' : '\nAdd it to your party?');
        menu.innerHTML = (inParty || sv.team.length >= 6 ? '' : '<button type="button" data-a="add">ADD TO PARTY</button>') + '<button type="button" data-a="ok">CONTINUE</button>'; menu.hidden = false;
        await new Promise(r => { for (const b of menu.querySelectorAll('button')) b.onclick = () => { if (b.dataset.a === 'add') { sv.team.push(w.key); saveStory(); toastMsg(`${pickLabel(w.key)} joined your party!`); } r(); }; menu.querySelector('button').focus(); });
      } else { await say(text); }
      if (ran) return; ran = true; document.removeEventListener('keydown', keys, true); ov.classList.remove('show'); clearInterval(typer); resolve({ caught, sp: w.sp, lv: w.lv });
    };
    const showMenu = () => {
      menu.innerHTML = `<button type="button" data-a="ball" ${S.balls ? '' : 'disabled'}>BALL<small>\u00D7${S.balls}</small></button><button type="button" data-a="bait" ${S.baits ? '' : 'disabled'}>BAIT<small>\u00D7${S.baits}</small></button><button type="button" data-a="rock" ${S.rocks ? '' : 'disabled'}>ROCK<small>\u00D7${S.rocks}</small></button><button type="button" data-a="run">RUN</button>`;
      menu.hidden = false; msgEl.textContent = `What will ${trainerTitle(sv.trainer).toUpperCase()} do?\nTurn ${4 - S.turns} of 3`;
      for (const b of menu.querySelectorAll('button')) b.onclick = () => act(b.dataset.a);
      const first = menu.querySelector('button:not(:disabled)'); if (first) first.focus();
    };
    const fleeAnim = async () => { for (let k = 0; k <= 12; k++) { S.mon.x = k * 18; S.mon.a = 1 - k / 12; await wait(16); } S.mon.gone = true; };
    const act = async a => {
      if (ran) return; menu.hidden = true;
      if (a === 'run') return finish(false, 'Got away safely!');
      if (a === 'bait') {
        S.baits--; await say(`${trainerTitle(sv.trainer).toUpperCase()} threw some BAIT.`); await anim('baitA', 400); S.baitA = null; S.baitDown = true;
        S.rate = Math.max(1, Math.floor(S.rate / 2)); S.eat = rIn(1, 5); S.angry = 0; S.mon.angry = 0; S.mon.bob = true;
        await say(`Wild ${w.sp.toUpperCase()} is eating!`);
        return endTurn();
      }
      if (a === 'rock') {                                         // Gen 1: doubles the catch rate, but it gets angry (twice as likely to flee)
        S.rocks--; await say(`${trainerTitle(sv.trainer).toUpperCase()} threw a ROCK.`); await anim('rockA', 380); S.rockA = null; S.mon.hit = performance.now() + 300;
        S.rate = Math.min(255, S.rate * 2); S.angry = rIn(1, 5); S.eat = 0; S.mon.bob = false; S.mon.angry = 1;
        await say(`Wild ${w.sp.toUpperCase()} is angry!`);
        return endTurn();
      }
      S.balls--; await say(`${trainerTitle(sv.trainer).toUpperCase()} used SAFARI BALL!`);
      await anim('ballA', 430); S.ballA = null;
      for (let k = 0; k <= 10; k++) { S.mon.white = Math.min(1, k / 4); S.mon.scale = 1 - k / 10; await wait(16); }
      S.mon.gone = true; S.ballAt = true; await anim('dropA', 300);
      const res = safariCatch(S.rate, S.rare);
      for (let i = 0; i < res.shakes; i++) { await wait(140); await anim('wobA', 300); }
      if (res.caught) { S.caught = true; await wait(120); await anim('starsA', 420); return finish(true); }
      await wait(120); S.ballAt = false; await anim('burstA', 220); S.burstA = null; S.mon.gone = false; S.mon.scale = 1;
      for (let k = 0; k <= 6; k++) { S.mon.white = 1 - k / 6; await wait(18); }
      await say(SHAKE_MSG[res.shakes]);
      return endTurn();
    };
    (async () => { await wait(w.shiny ? 900 : 480); if (ran) return; await say(w.shiny ? `A shiny ${w.sp.toUpperCase()} appeared!` : `Wild ${w.sp.toUpperCase()} appeared!`); if (!ran) showMenu(); })();
  });
}

/* ---------- every gym challenge (Pokédex runs): walk the route to the leader, meet a wild Pokémon, then battle ----------
   Gyms 1–8 trigger an encounter on every challenge (rematches too). Lance and Gary: the walk only. Optional trainers: never. */
const _sfStartGymBattle = startGymBattle;
startGymBattle = function (i) {
  const sv = STORY.save;
  if (!isDexSave(sv) || SAFARI.busy || i > 9) return _sfStartGymBattle.apply(this, arguments);
  SAFARI.busy = true; closeModal(); STORY.at = null;
  (async () => {
    try { placeAvatar(nodeAt(i)); await walkLeg(i); if (i < ROUTES.length && !sv.encountersOff) await safariEncounter(i); }
    finally { SAFARI.busy = false; }
    _sfStartGymBattle(i);
  })();
};
// The battle arena is fully hidden behind the encounter and the story map: don't spend frames drawing it there.
const _sfDraw = draw;
draw = function () { const so = $('storyOv'), sf = $('safariOv'); if ((sf && sf.classList.contains('show')) || (so && so.classList.contains('show'))) return; return _sfDraw.apply(this, arguments); };
// The per-save switch on the story map (Pokédex runs).
(function encounterSwitch() {
  const top = document.querySelector('#storyOv .sy-top'); if (!top) return;
  const b = document.createElement('button'); b.className = 'sy-btn'; b.id = 'syEnc'; b.type = 'button'; b.style.display = 'none';
  b.onclick = () => { const sv = STORY.save; if (!isDexSave(sv)) return; sv.encountersOff = !sv.encountersOff; saveStory(); syncEnc(); toastMsg(sv.encountersOff ? 'Wild encounters off for this save' : 'Wild encounters on for this save'); };
  top.insertBefore(b, $('syMenu'));
})();
function syncEnc() { const b = $('syEnc'), sv = STORY.save; if (!b) return; b.style.display = isDexSave(sv) ? '' : 'none'; if (isDexSave(sv)) { b.textContent = sv.encountersOff ? 'Encounters: OFF' : 'Encounters: ON'; b.setAttribute('aria-pressed', String(!sv.encountersOff)); b.title = 'Wild Pok\u00E9mon encounters when you challenge a gym (this save only)'; } }
const _sfRenderStory = renderStory;
renderStory = function () { const r = _sfRenderStory.apply(this, arguments); syncEnc(); return r; };
/* Export / import the selected story slot (useful in a browser, to back up, or to move a save to another device). */
function exportStorySlot() {
  const n = STORY.slot, data = readSlot(n); if (!data) { toastMsg('This slot is empty'); return; }
  const text = JSON.stringify({ app: 'Arena 151', kind: 'story-save', version: APP_VERSION, slot: n, exportedAt: new Date().toISOString(), data }, null, 2), name = `arena151-story-slot${n}-${new Date().toISOString().slice(0, 10)}.json`;
  if (window.AndroidApp && AndroidApp.saveFile && !window.DesktopApp) { const where = AndroidApp.saveFile(name, text); toastMsg(where ? `Saved to ${where}` : 'Story save exported'); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toastMsg('Story save downloaded');
}
function importStorySlot() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { let o; try { o = JSON.parse(rd.result); } catch (e) { toastMsg('That file is not a story save'); return; }
      const data = o && o.kind === 'story-save' ? o.data : (o && o.badges != null && o.team ? o : null);
      if (!data || !Array.isArray(data.team) || typeof data.badges !== 'number') { toastMsg('That file is not a story save'); return; }
      if (readSlot(STORY.slot) && !confirm(`Replace the journey in slot ${STORY.slot} with the imported save?`)) return;
      try { localStorage.setItem(slotKey(STORY.slot), JSON.stringify(data)); } catch (e) { toastMsg('Could not store the save'); return; }
      loadStory(); renderStoryPanel(); toastMsg(`Imported into slot ${STORY.slot}`); };
    rd.readAsText(f); };
  inp.click();
}
const _sfPanel = renderStoryPanel;
renderStoryPanel = function () {
  const r = _sfPanel.apply(this, arguments), p = $('stStoryP'); if (!p || p.querySelector('.st-io')) return r;
  const io = document.createElement('div'); io.className = 'row st-io';
  io.innerHTML = `${STORY.save ? '<button class="big alt" type="button" id="stStoryExport" title="Download this slot as a file">Export save</button>' : ''}<button class="big alt" type="button" id="stStoryImport" title="Load a story save file into this slot">Import save</button>`;
  p.appendChild(io);
  if ($('stStoryExport')) $('stStoryExport').onclick = exportStorySlot; $('stStoryImport').onclick = importStorySlot;
  return r;
};
window.safariBall = safariBall; window.catchChance = catchChance; window.safariCatch = safariCatch; window.exportStorySlot = exportStorySlot; window.pickWild = pickWild; window.safariEncounter = safariEncounter;
})();
