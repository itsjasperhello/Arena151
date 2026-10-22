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
  for (const [sp, lo, hi, w] of R.mons) { x -= w; if (x <= 0) return { sp, lv: rIn(lo, hi) }; }
  const m = R.mons[0]; return { sp: m[0], lv: m[1] };
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
#safariOv .sf-head{position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(8,12,34,.75);color:#fff;border-radius:10px;padding:6px 14px;font:800 13px var(--ui);letter-spacing:.06em;white-space:nowrap}
#safariOv{background:#0b0f24}
#safariOv .sf-tag{position:absolute;top:13%;left:max(12px,calc(50% - 30vw));background:#f8f8f0;border:4px solid #283048;border-radius:8px;padding:6px 12px;font:900 clamp(13px,1.7vw,19px) var(--ui);min-width:150px}
#safariOv .sf-tag small{display:block;font:800 .75em var(--ui);color:#5a6078}
@media (max-height:560px){#safariOv .sf-box{min-height:84px;bottom:6px}#safariOv .sf-msg{padding:8px 12px}#safariOv .sf-menu{min-width:220px;padding:6px}#safariOv .sf-menu button{padding:5px 8px 5px 22px}}`;
  document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'safariOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Wild Pokémon encounter');
  ov.innerHTML = '<canvas id="sfCv" width="320" height="180"></canvas><div class="sf-head" id="sfHead"></div><div class="sf-tag" id="sfTag"></div><div class="sf-box"><div class="sf-msg" id="sfMsg" aria-live="polite"></div><div class="sf-menu" id="sfMenu" hidden></div></div>';
  document.body.appendChild(ov);
  // The scene covers the screen; on short screens it shifts up (trimming sky) so the trainer and platforms stay above the text box.
  const fit = () => { const c = $('sfCv'), box = ov.querySelector('.sf-box'), boxH = (box && box.offsetHeight) || 120, availH = innerHeight - boxH * .45;
    let W = Math.round(Math.max(innerWidth, innerHeight * 16 / 9)), H = Math.round(W * 9 / 16);
    if (H > availH * 1.08) { H = Math.round(availH); W = Math.round(H * 16 / 9); }          // short, wide screens: the whole scene fits above the text box
    c.style.width = W + 'px'; c.style.height = H + 'px'; c.style.top = '0px'; };
  addEventListener('resize', fit); window.__sfFit = fit;
})();

/* ---------- pixel helpers for the scenes (320×180) ---------- */
const SX = { c: null };
const P = (x, y, w, h, col) => { SX.c.fillStyle = col; SX.c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
const Dk = (x, y, r, col) => { const c = SX.c; c.fillStyle = col; r = Math.max(1, Math.round(r)); for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); } };
const El = (x, y, rx, ry, col) => { const c = SX.c; c.fillStyle = col; for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry)))); c.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); } };
const Grad = (y0, y1, a, b) => { const c = SX.c, g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, y0, 320, y1 - y0); };
const Hills = (y, amp, freq, col, seed = 0) => { for (let x = 0; x < 320; x += 2) { const h = Math.sin(x * freq + seed) * amp + Math.sin(x * freq * 2.3 + seed * 2) * amp * .4; P(x, y - h, 2, 180, col); } };
const Tri = (x, y, w, h, col) => { for (let i = 0; i < h; i++) { const ww = w * i / h; P(x - ww / 2, y - h + i, ww, 1, col); } };
const rng = s => () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) >>> 0) % 10000) / 10000;

/* ---------- the eight route scenes ---------- */
const SCENES = {
  forest(t) {                                           // Route 1 · Viridian Forest
    Grad(0, 80, '#9fe0ff', '#d8f5d0'); for (let i = 0; i < 4; i++) { SX.c.globalAlpha = .12; Tri(40 + i * 80 + Math.sin(t / 2000 + i) * 6, 90, 40, 90, '#fffbd0'); } SX.c.globalAlpha = 1;
    Hills(64, 6, .05, '#2f6e3a', 1); Hills(72, 5, .07, '#3c8a44', 3);
    const r = rng(7); for (let i = 0; i < 9; i++) { const x = r() * 330 - 5, h = 24 + r() * 14; P(x - 2, 76 - h * .4, 4, h * .45, '#5a3b1f'); Dk(x, 76 - h * .55, 10 + r() * 6, '#2a6a32'); Dk(x - 4, 76 - h * .6, 7, '#3d8f42'); }
    Grad(78, 180, '#6cc65a', '#3f9a3e'); for (let i = 0; i < 60; i++) { const x = (i * 37) % 320, y = 84 + (i * 53) % 90, s = Math.sin(t / 300 + i) * 1.5; P(x + s, y, 1, 4, '#2f7a32'); P(x + 2 + s, y + 1, 1, 3, '#57b04a'); }
    for (let i = 0; i < 10; i++) { const a = Math.sin(t / 400 + i * 1.7); if (a > .3) P(40 + (i * 29) % 260 + Math.sin(t / 900 + i) * 8, 60 + (i * 17) % 50 + Math.cos(t / 700 + i) * 5, 1, 1, '#fffba0'); }
    for (let i = 0; i < 5; i++) { const y = ((t / 30 + i * 41) % 200) - 10, x = (i * 71 + Math.sin(t / 500 + i) * 14) % 320; P(x, y, 2, 1, '#e0a030'); }
  },
  cave(t) {                                             // Mt. Moon
    Grad(0, 180, '#1a1424', '#3a2f3e'); for (let i = 0; i < 16; i++) { const x = i * 21 + 6, h = 10 + (i * 7) % 18; Tri(x, h + 2, 10, h, '#2b2234'); Tri(x, h, 6, h - 3, '#3a2f48'); }
    Hills(70, 8, .04, '#2e2538', 2); Hills(82, 5, .09, '#3c3048', 5);
    for (let i = 0; i < 6; i++) { const x = 20 + i * 52, y = 60 + (i % 3) * 8, g = .5 + .5 * Math.sin(t / 500 + i); SX.c.globalAlpha = .25 * g; Dk(x, y, 8, '#b8a0ff'); SX.c.globalAlpha = 1; Tri(x, y + 4, 6, 9, '#a088ff'); P(x - 1, y - 2, 2, 2, '#ffffff'); }
    Grad(84, 180, '#4a3c50', '#2a2230'); for (let i = 0; i < 18; i++) { const x = (i * 41) % 320, y = 92 + (i * 29) % 80; El(x, y, 4 + (i % 3), 2, '#3a2e40'); P(x - 2, y - 2, 3, 1, '#5a4a62'); }
    for (let i = 0; i < 4; i++) { const y = (t / 4 + i * 60) % 120; P(30 + i * 80, y, 1, 3, '#8fc8ff'); }
    for (let i = 0; i < 2; i++) { const x = (t / 12 + i * 160) % 360 - 20, y = 30 + Math.sin(t / 200 + i) * 8, f = Math.sin(t / 60) > 0; P(x - 4, y, 3, f ? 1 : 2, '#1a1028'); P(x + 2, y, 3, f ? 1 : 2, '#1a1028'); P(x - 1, y, 3, 2, '#6a4a8a'); }
  },
  meadow(t) {                                           // Route 5 · Route 6
    Grad(0, 80, '#6cc3ff', '#d6f0ff'); for (let i = 0; i < 4; i++) { const x = ((t / 90 + i * 95) % 400) - 40; El(x, 18 + i * 9, 18, 5, '#ffffff'); El(x + 10, 15 + i * 9, 12, 5, '#ffffff'); }
    for (let i = 0; i < 6; i++) P(250 + i * 9, 54 - (i % 3) * 7, 7, 20 + (i % 3) * 7, '#9aa8c8');
    Hills(70, 7, .03, '#7fcf6a', 1); Hills(80, 5, .05, '#69bd58', 4); Grad(82, 180, '#7ed46a', '#58b04e');
    const cols = ['#ff7aa8', '#ffe066', '#ffffff', '#b78cff', '#ff9a4a']; for (let i = 0; i < 70; i++) { const x = (i * 43) % 320, y = 90 + (i * 31) % 85; P(x, y, 2, 2, cols[i % 5]); P(x, y + 2, 1, 2, '#3f8f3c'); }
    for (let i = 0; i < 18; i++) P(i * 18, 86, 2, 8, '#a87848'); P(0, 88, 320, 1, '#c89868');
    for (let i = 0; i < 3; i++) { const x = 60 + i * 90 + Math.sin(t / 700 + i) * 24, y = 70 + Math.cos(t / 500 + i * 2) * 12, f = Math.sin(t / 80 + i) > 0; P(x - (f ? 3 : 2), y, f ? 3 : 2, 2, ['#ffffff', '#ffe066', '#7ad7ff'][i]); P(x + 1, y, f ? 3 : 2, 2, ['#ffffff', '#ffe066', '#7ad7ff'][i]); }
  },
  city(t) {                                             // Route 6 · Route 7 outskirts at dusk
    Grad(0, 80, '#3a2f6e', '#ff9a6a'); Dk(250, 52, 14, '#ffd27a');
    const r = rng(11); for (let i = 0; i < 16; i++) { const x = i * 21, w = 16 + r() * 8, h = 22 + r() * 34; P(x, 78 - h, w, h, '#2a2440'); for (let wy = 0; wy < h - 6; wy += 6) for (let wx = 3; wx < w - 3; wx += 5) if (r() > .4) P(x + wx, 78 - h + 4 + wy, 2, 3, Math.sin(t / 800 + wx + wy + i) > -.6 ? '#ffd86a' : '#5a5070'); }
    Grad(78, 180, '#4c4a5a', '#2e2c38'); P(0, 96, 320, 14, '#3a3846'); for (let x = (t / 8) % 30; x < 320; x += 30) P(x, 102, 14, 2, '#e8e0a0');
    for (let i = 0; i < 5; i++) { const x = 30 + i * 64; P(x, 70, 2, 26, '#202030'); SX.c.globalAlpha = .3 + .1 * Math.sin(t / 300 + i); Dk(x + 1, 70, 7, '#ffe8a0'); SX.c.globalAlpha = 1; P(x - 1, 68, 4, 3, '#fff4c0'); }
    const cx = (t / 5) % 420 - 50; P(cx, 98, 18, 6, '#d84040'); P(cx + 3, 95, 11, 4, '#f06060'); P(cx + 16, 99, 2, 2, '#ffe880');
    for (let i = 0; i < 20; i++) Dk(i * 17 + 5, 112, 7, '#2f6a3a');
  },
  safari(t) {                                           // Safari Zone
    Grad(0, 85, '#ffb46a', '#fff0b0'); Dk(60, 40, 16, '#fff6d0');
    Hills(66, 8, .025, '#c8925a', 2); Hills(76, 4, .06, '#b88850', 5);
    for (const [x, s] of [[40, 1], [150, .8], [270, 1.1]]) { P(x - 1, 76 - 22 * s, 3, 22 * s, '#5a3a1f'); El(x, 76 - 24 * s, 22 * s, 5 * s, '#4a7a2a'); El(x - 6, 76 - 27 * s, 12 * s, 4 * s, '#5c9234'); }
    Grad(78, 180, '#e0c070', '#b89048'); for (let i = 0; i < 90; i++) { const x = (i * 23) % 320, y = 86 + (i * 37) % 90, s = Math.sin(t / 350 + i * .5) * 2; P(x + s, y - 6, 1, 7, '#c8a048'); P(x + 2 + s * .7, y - 4, 1, 5, '#f0d080'); }
    for (const [x, y] of [[20, 110], [290, 120], [200, 150]]) { El(x, y, 9, 5, '#8a8070'); El(x - 2, y - 2, 5, 3, '#a8a090'); }
    for (let i = 0; i < 12; i++) P(i * 28, 84, 3, 10, '#7a5030'); P(0, 86, 320, 2, '#9a6a40'); P(0, 90, 320, 1, '#9a6a40');
  },
  tower(t) {                                            // Lavender Town · Pokémon Tower
    Grad(0, 85, '#140c2a', '#4a3070'); for (let i = 0; i < 30; i++) if (Math.sin(t / 600 + i * 3) > -.3) P((i * 61) % 320, (i * 23) % 60, 1, 1, '#e8e0ff');
    Dk(70, 30, 12, '#fff8e0'); Dk(66, 27, 3, '#e8e0c0');
    P(205, 18, 38, 62, '#1c1430'); Tri(224, 20, 46, 16, '#2a1e46'); for (let y = 26; y < 76; y += 10) { P(212, y, 6, 5, Math.sin(t / 700 + y) > 0 ? '#c08cff' : '#4a3a70'); P(230, y, 6, 5, '#4a3a70'); }
    Hills(80, 3, .05, '#2a2040', 3); Grad(82, 180, '#3a3050', '#1c1828');
    for (let i = 0; i < 8; i++) { const x = 20 + i * 38, y = 96 + (i % 2) * 16; P(x, y, 10, 13, '#7a7490'); Dk(x + 5, y, 5, '#7a7490'); P(x + 4, y + 3, 2, 6, '#5a5470'); P(x + 2, y + 5, 6, 2, '#5a5470'); }
    for (let i = 0; i < 3; i++) { SX.c.globalAlpha = .18; El(((t / 40 + i * 120) % 440) - 60, 92 + i * 14, 70, 6, '#c8c0e8'); } SX.c.globalAlpha = 1;
    for (let i = 0; i < 3; i++) { const x = 40 + i * 110 + Math.sin(t / 800 + i) * 18, y = 60 + Math.sin(t / 400 + i * 2) * 10; SX.c.globalAlpha = .5 + .3 * Math.sin(t / 250 + i); Dk(x, y, 3, '#a8f0ff'); P(x - 1, y + 3, 2, 3, '#a8f0ff'); SX.c.globalAlpha = 1; }
  },
  sea(t) {                                              // Sea Routes 19–20 · Seafoam Islands
    Grad(0, 70, '#7cc8ff', '#e0f4ff'); for (let i = 0; i < 3; i++) { const x = ((t / 120 + i * 120) % 420) - 50; El(x, 16 + i * 10, 16, 4, '#ffffff'); }
    for (const [x, w] of [[60, 50], [250, 40]]) { Tri(x, 70, w, 16, '#b8e4f0'); Tri(x + 4, 70, w * .5, 12, '#ffffff'); }
    Grad(70, 180, '#3a9ae0', '#1a5aa8');
    for (let y = 74; y < 180; y += 7) for (let x = ((t / 20 + y * 3) % 24) - 24; x < 320; x += 24) P(x, y + Math.sin(t / 300 + x * .1) * 1.5, 10, 1, y % 2 ? '#7cc8ff' : '#5ab0f0');
    for (let i = 0; i < 12; i++) if (Math.sin(t / 200 + i * 5) > .6) P((i * 53) % 320, 80 + (i * 29) % 90, 2, 1, '#ffffff');
    for (let i = 0; i < 2; i++) { const x = ((t / 15 + i * 170) % 380) - 30, y = 34 + i * 10 + Math.sin(t / 300 + i) * 3, f = Math.sin(t / 120 + i) > 0; P(x - 4, y - (f ? 1 : 0), 4, 1, '#ffffff'); P(x, y, 1, 1, '#ffffff'); P(x + 1, y - (f ? 1 : 0), 4, 1, '#ffffff'); }
  },
  mountain(t) {                                         // Route 21 · Route 22 · Victory Road
    Grad(0, 90, '#8ab8ff', '#ffe0c0');
    for (const [x, w, h, c] of [[60, 140, 70, '#7a7a9a'], [180, 160, 84, '#6a6a8c'], [290, 120, 64, '#7a7a9a']]) { Tri(x, 92, w, h, c); Tri(x, 92 - h + 22, w * 22 / h, 22, '#f4f8ff'); }
    P(150, 40, 20, 10, '#d8d0b0'); Tri(160, 40, 24, 8, '#c84040');
    Grad(86, 180, '#9a8a70', '#6a5a48'); for (let i = 0; i < 10; i++) { const x = (i * 37) % 320, y = 96 + (i * 41) % 80; El(x, y, 8 + (i % 3) * 3, 5, '#7a6a58'); El(x - 2, y - 2, 4 + (i % 3), 2, '#a89880'); }
    for (let i = 0; i < 9; i++) { const y = 20 + i * 15, x = (t / 3 + i * 50) % 380 - 40; SX.c.globalAlpha = .45; P(x, y, 26, 1, '#ffffff'); SX.c.globalAlpha = 1; }
  }
};
// Battle platforms: grass, rock or sand depending on the scene.
function platform(x, y, rx, ry, scene) {
  const pal = { forest: ['#3f8a3a', '#7fd06a'], meadow: ['#4a9a40', '#9ae07a'], safari: ['#9a7840', '#e8c880'], cave: ['#3a2e44', '#6a5a78'], city: ['#4a4a58', '#8a8aa0'],
    tower: ['#2a2440', '#5a5078'], sea: ['#c8b080', '#f0e0b0'], mountain: ['#6a5a48', '#b8a888'] }[scene] || ['#3f8a3a', '#7fd06a'];
  El(x, y + 2, rx + 2, ry + 2, 'rgba(0,0,0,.25)'); El(x, y, rx, ry, pal[0]); El(x, y - 1, rx - 3, ry - 3, pal[1]);
}

/* ---------- the encounter ---------- */
function safariEncounter(leg) {
  return new Promise(resolve => {
    const sv = STORY.save, R = ROUTES[leg], w = pickWild(leg), ov = $('safariOv'), cv = $('sfCv'), msgEl = $('sfMsg'), menu = $('sfMenu');
    SX.c = cv.getContext('2d'); SX.c.imageSmoothingEnabled = false;
    const mon = document.createElement('canvas'); mon.width = mon.height = 96; try { drawSpriteTo(mon, w.sp, {}); } catch (e) { }
    const tr = new Image(); tr.src = portraitUrl(sv.trainer);
    const S = { t0: performance.now(), phase: 'intro', mon: { x: 0, a: 1, white: 0, scale: 1, bob: 0, gone: false }, ball: null, bait: null, stars: 0, balls: 1, baits: 1, eat: 0,
      rate: CATCH_RATE[w.sp] || 45, hp: wildHP(w.sp, w.lv), spd: wildSpeed(w.sp, w.lv), done: false };
    $('sfHead').textContent = `${R.name.toUpperCase()} \u00B7 ROUTE ENCOUNTER`;
    $('sfTag').innerHTML = `${w.sp.toUpperCase()}<small>:L${w.lv}${dexEntry(sv, w.sp) ? ' \u00B7 \u25CF in Pok\u00E9dex' : ''}</small>`;
    ov.classList.add('show'); menu.hidden = true; requestAnimationFrame(() => window.__sfFit && window.__sfFit());
    let typer = null;
    const say = (text, ms = 22) => new Promise(r => { clearInterval(typer); let k = 0; msgEl.textContent = ''; typer = setInterval(() => { msgEl.textContent = text.slice(0, ++k); if (k >= text.length) { clearInterval(typer); setTimeout(r, 650); } }, ms); });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const anim = (key, ms) => new Promise(r => { S[key] = { t0: performance.now(), ms }; setTimeout(r, ms); });
    // drawing
    const frame = now => {
      if (!ov.classList.contains('show')) return;
      const t = now - S.t0, c = SX.c; c.clearRect(0, 0, 320, 180);
      (SCENES[R.scene] || SCENES.forest)(t);
      const slide = Math.min(1, t / 700), farX = 232 + (1 - slide) * -260, nearX = 74 + (1 - slide) * 260;
      platform(farX, 92, 50, 11, R.scene); platform(nearX, 168, 76, 15, R.scene);
      // the wild Pokémon on the far platform
      if (!S.mon.gone) {
        const h = 54 * S.mon.scale, bob = S.mon.bob ? Math.abs(Math.sin(t / 120)) * 3 : 0, mx = farX + S.mon.x;
        c.save(); c.globalAlpha = S.mon.a; c.drawImage(mon, Math.round(mx - h / 2), Math.round(92 - h + 4 - bob), Math.round(h), Math.round(h));
        if (S.mon.white > 0) { c.globalCompositeOperation = 'source-atop'; c.globalAlpha = S.mon.white * S.mon.a; } c.restore();
        if (S.mon.white > 0) { c.save(); c.globalAlpha = S.mon.white; const tc = document.createElement('canvas'); tc.width = tc.height = 96; const tx = tc.getContext('2d'); tx.drawImage(mon, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#ffffff'; tx.fillRect(0, 0, 96, 96); c.drawImage(tc, Math.round(mx - h / 2), Math.round(92 - h + 4), Math.round(h), Math.round(h)); c.restore(); }
        if (S.eat > 0 && S.mon.bob) { const k = (t / 400) % 1; P(mx + 18, 92 - 46 - k * 10, 2, 2, '#ff7aa8'); P(mx + 20, 92 - 48 - k * 10, 2, 2, '#ff7aa8'); }
      }
      // your trainer, up close
      if (tr.complete && tr.naturalWidth) { const h = 110, wv = h * tr.naturalWidth / tr.naturalHeight; c.drawImage(tr, Math.round(nearX - wv / 2), Math.round(168 - h + 8), Math.round(wv), Math.round(h)); }
      // thrown bait
      if (S.baitA) { const k = Math.min(1, (now - S.baitA.t0) / S.baitA.ms), x = nearX + 20 + (farX - 18 - nearX - 20) * k, y = 110 - Math.sin(k * Math.PI) * 60 + (92 - 110) * k; Dk(x, y, 3, '#a8703a'); P(x - 1, y - 1, 1, 1, '#e0b070'); }
      if (S.baitDown) { Dk(farX - 18, 94, 3, '#a8703a'); }
      // the Safari Ball: arc, drop, wobble, click
      if (S.ballA) { const k = Math.min(1, (now - S.ballA.t0) / S.ballA.ms), x = nearX + 24 + (farX - nearX - 24) * k, y = 104 - Math.sin(k * Math.PI) * 70 + (66 - 104) * k; drawBall(x, y, k * 12); }
      if (S.ballAt) { const b = S.ballAt, wob = S.wobA ? Math.sin(Math.min(1, (now - S.wobA.t0) / S.wobA.ms) * Math.PI * 2) * .5 : 0, dropK = S.dropA ? Math.min(1, (now - S.dropA.t0) / S.dropA.ms) : 1; drawBall(farX, 66 + (88 - 66) * dropK - Math.abs(Math.sin(dropK * Math.PI * 2)) * 6 * (1 - dropK), wob); }
      if (S.burstA) { const k = Math.min(1, (now - S.burstA.t0) / S.burstA.ms); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = k * 26; P(farX + Math.cos(a) * d, 76 + Math.sin(a) * d * .6, 2, 2, i % 2 ? '#ffffff' : '#ffe066'); } }
      if (S.starsA) { const k = Math.min(1, (now - S.starsA.t0) / S.starsA.ms); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * .7, d = 8 + k * 16; const sx = farX + Math.cos(a) * d, sy = 84 + Math.sin(a) * d; P(sx - 2, sy, 5, 1, '#ffe066'); P(sx, sy - 2, 1, 5, '#ffe066'); } }
      requestAnimationFrame(frame);
    };
    function drawBall(x, y, rot) {
      const c = SX.c; c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(rot);
      c.fillStyle = '#283048'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6aa84a'; c.beginPath(); c.arc(0, 0, 5, Math.PI, 0); c.fill();                 // Safari Ball: green top
      c.fillStyle = '#f0f0e8'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI); c.fill();
      c.fillStyle = '#283048'; c.fillRect(-5, -1, 10, 2); c.fillStyle = '#ffffff'; c.fillRect(-1, -1, 2, 2); c.fillStyle = '#4a8a2a'; c.fillRect(-3, -4, 2, 2); c.fillRect(1, -4, 2, 2); c.restore();
    }
    requestAnimationFrame(frame);
    try { if (typeof playCry === 'function') setTimeout(() => playCry(w.sp), 650); } catch (e) { }
    // turn logic (Gen 1 Safari)
    const fleeCheck = () => { let X = S.spd * 2; if (S.eat > 0) { X = Math.floor(X / 4); S.eat--; if (S.eat <= 0) S.mon.bob = false; } return X > 255 || r256() < X; };
    const finish = async (caught, text) => {
      menu.hidden = true; sv.encountered = sv.encountered || {}; sv.encountered[leg] = { sp: w.sp, lv: w.lv, caught };
      if (caught) {
        const isNew = !dexEntry(sv, w.sp); dexAdd(sv, w.sp, w.lv); saveStory();
        await say(`All right! ${w.sp.toUpperCase()} was caught!`); await say(isNew ? `New POKéDEX data will be added for ${w.sp.toUpperCase()}!` : `${w.sp.toUpperCase()}'s POKéDEX entry was updated.`);
        const inParty = sv.team.includes(w.sp);
        msgEl.textContent = `${w.sp.toUpperCase()} (Lv ${dexEntry(sv, w.sp).level}) is in your POKéDEX.` + (inParty ? '' : sv.team.length >= 6 ? '\nYour party is full \u2014 change it from the POKéDEX.' : '\nAdd it to your party?');
        menu.innerHTML = (inParty || sv.team.length >= 6 ? '' : '<button type="button" data-a="add">ADD TO PARTY</button>') + '<button type="button" data-a="ok">CONTINUE</button>'; menu.hidden = false;
        await new Promise(r => { for (const b of menu.querySelectorAll('button')) b.onclick = () => { if (b.dataset.a === 'add') { sv.team.push(w.sp); saveStory(); toastMsg(`${w.sp} joined your party!`); } r(); }; menu.querySelector('button').focus(); });
      } else { saveStory(); await say(text); await wait(300); }
      ov.classList.remove('show'); clearInterval(typer); resolve({ caught, sp: w.sp, lv: w.lv });
    };
    const showMenu = () => {
      menu.innerHTML = `<button type="button" data-a="ball" ${S.balls ? '' : 'disabled'}>BALL<small>\u00D7${S.balls}</small></button><button type="button" data-a="bait" ${S.baits ? '' : 'disabled'}>BAIT<small>\u00D7${S.baits}</small></button><button type="button" data-a="run">RUN</button>`;
      menu.hidden = false; msgEl.textContent = `What will ${trainerTitle(sv.trainer).toUpperCase()} do?`;
      for (const b of menu.querySelectorAll('button')) b.onclick = () => act(b.dataset.a);
      const first = menu.querySelector('button:not(:disabled)'); if (first) first.focus();
    };
    const act = async a => {
      menu.hidden = true;
      if (a === 'run') return finish(false, 'Got away safely!');
      if (a === 'bait') {
        S.baits--; await say(`${trainerTitle(sv.trainer).toUpperCase()} threw some BAIT.`); await anim('baitA', 600); S.baitA = null; S.baitDown = true;
        S.rate = Math.max(1, Math.floor(S.rate / 2)); S.eat = rIn(1, 5); S.mon.bob = true;
        await say(`Wild ${w.sp.toUpperCase()} is eating!`);
        if (fleeCheck()) { S.mon.flee = true; await fleeAnim(); return finish(false, `Wild ${w.sp.toUpperCase()} ran away!`); }
        return showMenu();
      }
      if (a === 'ball') {
        S.balls--; await say(`${trainerTitle(sv.trainer).toUpperCase()} used SAFARI BALL!`, 18);
        await anim('ballA', 650); S.ballA = null;
        for (let k = 0; k <= 10; k++) { S.mon.white = Math.min(1, k / 4); S.mon.scale = 1 - k / 10; await wait(28); }
        S.mon.gone = true; S.ballAt = true; await anim('dropA', 450);
        const res = safariBall(S.rate, S.hp);
        for (let i = 0; i < res.shakes; i++) { await wait(260); await anim('wobA', 420); }
        if (res.caught) { await wait(200); await anim('starsA', 600); return finish(true); }
        await wait(220); S.ballAt = false; await anim('burstA', 300); S.burstA = null; S.mon.gone = false; S.mon.scale = 1;
        for (let k = 0; k <= 6; k++) { S.mon.white = 1 - k / 6; await wait(30); }
        await say(SHAKE_MSG[res.shakes]);
        await fleeAnim(); return finish(false, `Wild ${w.sp.toUpperCase()} ran away!`);
      }
    };
    const fleeAnim = async () => { for (let k = 0; k <= 16; k++) { S.mon.x = k * 9; S.mon.a = 1 - k / 16; await wait(26); } S.mon.gone = true; };
    (async () => { await wait(750); await say(`Wild ${w.sp.toUpperCase()} appeared!`); showMenu(); })();
  });
}

/* ---------- when it happens: on arrival at gyms 1–8, once per route per run ---------- */
const _sfOpenGymCard = openGymCard;
openGymCard = function (i) {
  const sv = STORY.save;
  if (isDexSave(sv) && i === sv.badges && i < ROUTES.length && !(sv.encountered || {})[i] && !SAFARI.busy) {
    SAFARI.busy = true; closeModal();
    safariEncounter(i).then(() => { SAFARI.busy = false; renderStory(); _sfOpenGymCard(i); });
    return;
  }
  return _sfOpenGymCard.apply(this, arguments);
};
window.safariBall = safariBall; window.pickWild = pickWild; window.safariEncounter = safariEncounter;

})();
