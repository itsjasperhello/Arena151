/* =====================================================================
   Section 7d: the five painted arenas
   The art comes from the reference images (stage_images.js). Everything
   painted in is brought to life at runtime: water and clouds flow, torches
   burn, banners and awnings wave, crowds bounce and cheer, crystals and
   lamps glow, energy lines pulse, and each arena has its own ambience.
   Region coordinates are in the original image's pixels.
   ===================================================================== */
const ARENAS = {
  plaza: { name: 'Metro Plaza', ambient: 'glint', amb2: ['leaves', 'birds'], walk: [[74, 38, 926, 540]],
    trainers: { A: { x: 18, y: 300 }, B: { x: 982, y: 300 } }, entry: { A: { x: 200, y: 300 }, B: { x: 800, y: 280 } }, grade: ['rgba(255,214,150,1)', .05, .25],
    trees: [[322, 345, 392, 415], [322, 505, 392, 575], [812, 350, 880, 420], [425, 622, 545, 700], [655, 622, 775, 700]],
    glows: [[440, 295, '#ffe9a0', 7], [760, 295, '#ffe9a0', 7], [530, 555, '#ffe9a0', 7], [668, 555, '#ffe9a0', 7]],
    crowd: [[850, 395, 915, 440], [858, 292, 915, 335], [455, 285, 520, 320], [760, 150, 1040, 205], [160, 20, 440, 85], [10, 365, 100, 400], [1040, 395, 1200, 440]],
    cloth: [[815, 530, 872, 600], [225, 505, 275, 540], [225, 540, 275, 575], [200, 600, 255, 635], [160, 695, 210, 730], [145, 600, 195, 640]],
    xtrees: [[95, 90, 160, 170], [455, 195, 515, 265], [690, 195, 750, 265], [1150, 350, 1200, 420]], scroll: [{ r: [285, 660, 355, 745], m: 'water', vx: 0, vy: -9 }],
    xglows: [[548, 770, '#ffe9a0', 7], [650, 770, '#ffe9a0', 7], [1083, 280, '#ffe9a0', 6]], flags: [[835, 228, 955, 282]] },
  skyfort: { name: 'Stratos Fortress', ambient: 'dust', amb2: ['wind'], walk: [[75, 152, 925, 430], [180, 58, 820, 524]],
    trainers: { A: { x: -36, y: 296 }, B: { x: 1030, y: 296 } }, entry: { A: { x: 200, y: 296 }, B: { x: 800, y: 296 } }, grade: ['rgba(170,210,255,1)', .05, .22],
    scroll: [{ r: [300, 330, 425, 620], m: 'sky', vx: 7 }, { r: [780, 330, 905, 620], m: 'sky', vx: 7 }, { r: [420, 558, 790, 612], m: 'sky', vx: 5 }],
    pulse: [[425, 365, 780, 560]],
    torches: [[552, 336], [648, 336], [552, 546], [648, 546], [540, 596], [660, 596], [522, 260], [676, 260]],
    crowd: [[345, 255, 490, 300], [715, 255, 860, 300], [370, 600, 520, 640], [680, 600, 840, 640]],
    flags: [[495, 262, 512, 290], [692, 262, 710, 290], [532, 625, 552, 665], [652, 625, 672, 665], [422, 235, 440, 258], [765, 235, 782, 258]],
    cloth: [[320, 630, 405, 672], [795, 628, 880, 672]], props: [[95, 250, 52], [1122, 632, 46]], xglows: [[300, 62, '#7ff7ff', 20]],
    xscroll: [{ r: [0, 120, 150, 896], m: 'sky', vx: 7 }, { r: [1050, 120, 1200, 896], m: 'sky', vx: 7 }, { r: [150, 700, 420, 896], m: 'sky', vx: 7 }, { r: [790, 700, 1050, 896], m: 'sky', vx: 7 }, { r: [0, 0, 210, 130], m: 'sky', vx: 5 }],
    xflags: [[212, 300, 258, 365], [946, 300, 995, 365]], xcrowd: [[230, 340, 300, 400], [905, 340, 990, 400], [905, 480, 990, 560], [230, 480, 300, 560], [230, 560, 330, 620]] },
  grotto: { name: 'Prism Grotto', ambient: 'motes', amb2: ['sparks'], walk: [[74, 73, 926, 510]],
    trainers: { A: { x: 40, y: 296 }, B: { x: 960, y: 296 } }, entry: { A: { x: 200, y: 296 }, B: { x: 800, y: 290 } }, grade: ['rgba(170,120,255,1)', .035, .3],
    scroll: [{ r: [370, 335, 840, 395], m: 'water', vx: 5, vy: 1 }, { r: [370, 545, 840, 605], m: 'water', vx: -5, vy: 1 }, { r: [350, 385, 460, 560], m: 'water', vx: 1, vy: 5 }, { r: [745, 385, 860, 560], m: 'water', vx: -1, vy: -5 }],
    glows: [[430, 408, '#ff8ad8', 9], [415, 505, '#7ff7ff', 10], [470, 375, '#7ff7ff', 8], [782, 402, '#7ff7ff', 10], [775, 515, '#ff8ad8', 9], [738, 372, '#ff8ad8', 8], [527, 372, '#d3b6ff', 7], [603, 465, '#7ff7ff', 26]],
    torches: [[540, 588, 'blue'], [660, 588, 'blue'], [232, 255, 'blue'], [970, 255, 'blue'], [548, 820, 'blue'], [655, 820, 'blue'], [550, 270, 'blue'], [650, 270, 'blue']], crowd: [],
    flags: [[512, 575, 530, 605], [678, 575, 696, 605], [422, 235, 440, 258], [767, 235, 785, 258], [497, 263, 513, 295], [692, 263, 708, 295], [532, 625, 552, 665], [652, 625, 672, 665]],
    cloth: [[240, 255, 330, 320], [345, 238, 415, 270], [790, 230, 860, 262], [880, 258, 960, 320], [235, 555, 330, 610], [805, 615, 890, 660], [330, 615, 410, 665]],
    xscroll: [{ r: [85, 240, 140, 395], m: 'water', vy: 42 }, { r: [1065, 240, 1115, 390], m: 'water', vy: 42 }, { r: [120, 380, 205, 780], m: 'water', vy: 9 }, { r: [1000, 380, 1085, 780], m: 'water', vy: 9 }, { r: [200, 730, 1000, 800], m: 'water', vx: 7 }],
    xglows: [[290, 100, '#7fd6ff', 30], [125, 110, '#ff8ad8', 14], [60, 820, '#c08aff', 22], [1150, 800, '#7ff7ff', 22], [600, 120, '#7ff7ff', 18], [1175, 320, '#ff8ad8', 12], [25, 300, '#d3b6ff', 14], [880, 170, '#ff9ad8', 12]] },
  oasis: { name: 'Mirage Oasis', ambient: 'dust', amb2: ['sand'], walk: [[75, 73, 927, 507]],
    trainers: { A: { x: 24, y: 276 }, B: { x: 967, y: 276 } }, entry: { A: { x: 200, y: 290 }, B: { x: 800, y: 290 } }, grade: ['rgba(255,200,120,1)', .06, .25],
    torches: [[530, 262], [550, 280], [652, 280], [675, 262], [540, 597], [660, 597]],
    flags: [[497, 263, 513, 295], [692, 263, 708, 295], [422, 233, 440, 258], [767, 233, 785, 258], [512, 568, 528, 600], [682, 568, 698, 600], [532, 625, 550, 665], [652, 625, 670, 665]],
    cloth: [[240, 255, 330, 320], [345, 238, 415, 270], [790, 230, 860, 262], [880, 258, 960, 320], [235, 555, 330, 610], [330, 615, 410, 665], [805, 615, 890, 660], [880, 555, 980, 600]],
    crowd: [[345, 260, 480, 300], [720, 260, 860, 300], [905, 345, 960, 400], [700, 605, 800, 640], [225, 340, 300, 400]],
    xtorches: [[232, 262], [972, 262], [548, 820], [655, 820]], xcloth: [[840, 20, 1160, 95], [205, 85, 240, 140], [365, 85, 400, 140]],
    xtrees: [[40, 90, 110, 160], [355, 40, 410, 90], [200, 10, 250, 60], [1010, 600, 1070, 670], [140, 610, 200, 670], [440, 720, 520, 790], [700, 720, 780, 790], [1140, 480, 1200, 560]],
    xscroll: [{ r: [85, 245, 130, 395], m: 'water', vy: 42 }, { r: [1075, 245, 1115, 395], m: 'water', vy: 42 }, { r: [125, 390, 205, 760], m: 'water', vy: 9 }, { r: [1000, 390, 1080, 760], m: 'water', vy: 9 }, { r: [200, 745, 1010, 810], m: 'water', vx: 7 }] },
  ruins: { name: 'Verdant Ruins', ambient: 'sparkle', amb2: ['leaves', 'fireflies'], walk: [[74, 79, 926, 501]],
    trainers: { A: { x: 36, y: 278 }, B: { x: 966, y: 278 } }, entry: { A: { x: 200, y: 290 }, B: { x: 800, y: 290 } }, grade: ['rgba(150,230,140,1)', .05, .3],
    torches: [[528, 268], [552, 285], [652, 285], [676, 268], [540, 598], [660, 598]],
    flags: [[497, 263, 513, 298], [692, 263, 708, 298], [422, 235, 440, 258], [767, 235, 785, 258], [505, 568, 530, 600], [675, 568, 700, 600], [532, 625, 552, 668], [652, 625, 672, 668], [215, 495, 240, 525], [965, 495, 990, 525]],
    crowd: [[345, 255, 490, 300], [715, 255, 860, 300], [905, 345, 960, 400], [905, 500, 960, 545], [690, 605, 800, 655], [245, 320, 300, 380], [245, 495, 300, 550]],
    xtorches: [[548, 820], [655, 820], [548, 190], [652, 190]], xtrees: [[0, 0, 240, 260], [960, 0, 1200, 260], [0, 560, 240, 896], [980, 560, 1200, 896]],
    xscroll: [{ r: [90, 250, 135, 390], m: 'water', vy: 42 }, { r: [1090, 250, 1135, 390], m: 'water', vy: 42 }, { r: [130, 390, 205, 720], m: 'water', vy: 9 }, { r: [1005, 390, 1080, 720], m: 'water', vy: 9 }, { r: [200, 705, 1010, 790], m: 'water', vx: 7 }] }
};
// merge the "x" (outer scenery) lists into the main ones
for (const a of Object.values(ARENAS)) for (const k of ['torches', 'glows', 'trees', 'scroll', 'flags', 'cloth', 'crowd']) { const x = a['x' + k]; if (x) a[k] = (a[k] || []).concat(x); }
// Replace the old arenas with the painted ones.
for (const k of Object.keys(STAGES)) delete STAGES[k];
STAGE_ORDER.length = 0;
for (const [id, a] of Object.entries(ARENAS)) { STAGES[id] = a; STAGE_ORDER.push(id); GRADE[id] = { col: a.grade[0], a: a.grade[1], vig: a.grade[2] }; }
const EXT = id => { const m = STAGE_MAP[id]; return m && m.W ? m : { l: 0, t: 0, W: ART_W, H: ART_H }; };
const imgToArt = (id, x, y) => { const m = STAGE_MAP[id]; return [(x - m.cx) * m.s + 350, (y - m.cy) * m.s + 220]; };
const imgToWorld = (id, x, y) => { const [i, j] = imgToArt(id, x, y); return [fromArtX(i), fromArtY(j)]; };
for (const [id, a] of Object.entries(ARENAS)) {
  a.painted = true; a.crowdBox = a.crowd.slice();
  a.crowd = a.crowd.flatMap(([x0, y0, x1, y1]) => { const n = Math.max(1, Math.round((x1 - x0) / 45)), pts = []; for (let k = 0; k < n; k++) pts.push(imgToWorld(id, x0 + (k + .5) * (x1 - x0) / n, y1 - 4).map(Math.round)); return pts; });
}
(function rebuildSelector() { const sel = document.getElementById('stageSel'); if (!sel) return; sel.innerHTML = '<option value="random">Random arena</option>' + STAGE_ORDER.map(id => `<option value="${id}">${STAGES[id].name}</option>`).join(''); })();

function setStage(id) {
  STAGE_ID = STAGES[id] ? id : STAGE_ORDER[0]; STAGE = STAGES[STAGE_ID];
  const w = STAGE.walk; BOUND.x0 = Math.min(...w.map(r => r[0])); BOUND.y0 = Math.min(...w.map(r => r[1])); BOUND.x1 = Math.max(...w.map(r => r[2])); BOUND.y1 = Math.max(...w.map(r => r[3]));
  Object.assign(ENTRY.A, STAGE.entry.A); Object.assign(ENTRY.B, STAGE.entry.B); Object.assign(TRAINER_POS.A, STAGE.trainers.A); Object.assign(TRAINER_POS.B, STAGE.trainers.B);
  stageCanvas = buildStage(STAGE_ID);
}

/* ---------- loading and preparing the art ---------- */
const STAGE_IMGS = {}, STAGE_ANIM = {};
for (const id of Object.keys(STAGE_IMG)) { const im = new Image(); im.src = STAGE_IMG[id]; STAGE_IMGS[id] = im; }
function buildStage(id) {
  if (STAGE_CACHE[id]) return STAGE_CACHE[id];
  const e = EXT(id), c = document.createElement('canvas'); c.width = e.W; c.height = e.H; STAGE_CACHE[id] = c;
  const paint = () => { c.getContext('2d').drawImage(STAGE_IMGS[id], 0, 0); prepAnim(id, c); };
  const im = STAGE_IMGS[id]; if (im.complete && im.naturalWidth) paint(); else im.addEventListener('load', paint, { once: true });
  return c;
}
const MASKS = {
  water: (r, g, b) => b > 120 && b > r + 40 && b > g - 20 && !(r > 170 && g > 220),
  sky: (r, g, b) => (b > 170 && b > r + 12) || (r > 200 && g > 208 && b > 214),
  cyan: (r, g, b) => g > 140 && b > 160 && r < 130
};
function regionArt(id, R) { const e = EXT(id), [a, b] = imgToArt(id, R[0], R[1]), [c, d] = imgToArt(id, R[2], R[3]); const x0 = clamp(Math.floor(a), -e.l, e.W - e.l - 1), y0 = clamp(Math.floor(b), -e.t, e.H - e.t - 1); return [x0, y0, Math.max(1, clamp(Math.ceil(c), x0 + 1, e.W - e.l) - x0), Math.max(1, clamp(Math.ceil(d), y0 + 1, e.H - e.t) - y0)]; }
function maskCanvases(src, rect, test, bright, e) {
  const [x, y, w, h] = rect, data = src.getContext('2d').getImageData(x + e.l, y + e.t, w, h), tex = new ImageData(w, h), msk = new ImageData(w, h), pts = [];
  for (let k = 0; k < w * h; k++) { const o = k * 4, r = data.data[o], g = data.data[o + 1], b = data.data[o + 2]; if (!test(r, g, b)) continue;
    tex.data[o] = Math.min(255, r * (bright || 1)); tex.data[o + 1] = Math.min(255, g * (bright || 1)); tex.data[o + 2] = Math.min(255, b * (bright || 1)); tex.data[o + 3] = 255; msk.data[o + 3] = 255; if (k % 7 === 0) pts.push([x + k % w, y + Math.floor(k / w)]); }
  const mk = d => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(d, 0, 0); return c; };
  return { tex: mk(tex), mask: mk(msk), pts };
}
function prepAnim(id, src) {
  const A = ARENAS[id], S = { scroll: [], pulse: [], sparkle: [] };
  try {
    for (const sc of A.scroll || []) { const rect = regionArt(id, sc.r), mc = maskCanvases(src, rect, MASKS[sc.m], 1, EXT(id)); S.scroll.push({ rect, ...mc, vx: sc.vx || 0, vy: sc.vy || 0, tmp: Object.assign(document.createElement('canvas'), { width: rect[2], height: rect[3] }) }); if (sc.m === 'water') S.sparkle.push(...mc.pts); }
    for (const R of A.pulse || []) { const rect = regionArt(id, R), mc = maskCanvases(src, rect, MASKS.cyan, 1.6, EXT(id)); S.pulse.push({ rect, ...mc }); }
  } catch (e) { console.error(e); }
  S.flags = (A.flags || []).map(R => regionArt(id, R)); S.cloth = (A.cloth || []).map(R => regionArt(id, R)); S.trees = (A.trees || []).map(R => regionArt(id, R));
  S.crowd = (A.crowdBox || []).map(R => regionArt(id, R)); S.props = (A.props || []).map(([x, y, r]) => [...imgToArt(id, x, y), r * STAGE_MAP[id].s]);
  S.torches = (A.torches || []).map(([x, y, kind]) => [...imgToArt(id, x, y), kind]); S.glows = (A.glows || []).map(([x, y, col, r]) => [...imgToArt(id, x, y), col, r * STAGE_MAP[id].s * .6]);
  STAGE_ANIM[id] = S;
}

/* ---------- per-frame animation on the floor layer ---------- */
let CROWD_HYPE = 0;
function hookCrowdHype() {   // attached on first use: VFX is defined by a later section
  if (hookCrowdHype.done || typeof VFX === 'undefined') return; hookCrowdHype.done = true;
  const base = VFX.crowd; VFX.crowd = function (level) { CROWD_HYPE = Math.max(CROWD_HYPE, clock.t + (level > 1 ? 2200 : 1200)); return base.apply(this, arguments); };
}
const FIRE_PAL = ['#ffffff', '#fff6b0', '#ffd23f', '#ff9a1f', '#e8541c', '#8a2a14'], BLUE_PAL = ['#ffffff', '#d8f4ff', '#7fd6ff', '#3f8cff', '#2a5ad0', '#1a2a70'];
function animateStage(c, ox, oy, t) {
  hookCrowdHype(); const S = STAGE_ANIM[STAGE_ID], src = stageCanvas; if (!S || !src) return; const e = EXT(STAGE_ID), L = e.l, T = e.t, lvl = (window.SETTINGS && SETTINGS.quality) || 'high';
  const X = i => Math.round(i - ox), Y = j => Math.round(j - oy);
  // flowing water and drifting clouds: the painted texture scrolls inside its own shape
  for (const sc of S.scroll) { const [x, y, w, h] = sc.rect, k = sc.tmp.getContext('2d'), dx = ((t / 1000 * sc.vx) % w + w) % w, dy = ((t / 1000 * sc.vy) % h + h) % h;
    k.globalCompositeOperation = 'copy'; k.drawImage(sc.tex, Math.round(dx), Math.round(dy)); k.globalCompositeOperation = 'source-over';
    for (const [ex, ey] of [[dx - w, dy], [dx, dy - h], [dx - w, dy - h]]) k.drawImage(sc.tex, Math.round(ex), Math.round(ey));
    k.globalCompositeOperation = 'destination-in'; k.drawImage(sc.mask, 0, 0); k.globalCompositeOperation = 'source-over'; c.drawImage(sc.tmp, X(x), Y(y)); }
  for (let k = 0; k < 18 && S.sparkle.length; k++) { const p = S.sparkle[(Math.floor(t / 140) * 37 + k * 131) % S.sparkle.length]; if ((Math.floor(t / 90) + k) % 3 === 0) aRect(X(p[0]), Y(p[1]), 2, 1, '#e8fbff', .9); }
  // energy lines pulse
  for (const p of S.pulse) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .18 + .22 * (Math.sin(t / 380) + 1) / 2; c.drawImage(p.tex, X(p.rect[0]), Y(p.rect[1])); c.restore();
    const band = ((t / 6) % (p.rect[2] + 60)) - 30; c.save(); c.beginPath(); c.rect(X(p.rect[0] + band), Y(p.rect[1]), 14, p.rect[3]); c.clip(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .7; c.drawImage(p.tex, X(p.rect[0]), Y(p.rect[1])); c.restore(); }
  // crowds bob in alternating groups; they jump higher and faster when the action heats up
  if (lvl === 'low') { for (const [i, j, kind] of S.torches) flamePx(X(i), Y(j), 6, 2, t + i * 9, kind === 'blue' ? BLUE_PAL : FIRE_PAL, .95); return; }
  const hype = clock.t < CROWD_HYPE, beat = hype ? 160 : 420, amp = hype ? 2 : 1;
  for (const [x, y, w, h] of S.crowd) for (let b = 0; b < w; b += 6) { const up = ((Math.floor(t / beat) + Math.floor(b / 6) + (hype ? 0 : Math.floor(b / 18))) % 2) * amp; if (up) c.drawImage(src, x + b + L, y + T, Math.min(6, w - b), h, X(x + b), Y(y) - up, Math.min(6, w - b), h); }
  // banners and awnings ripple; trees sway
  for (const [x, y, w, h] of S.flags) for (let k = 0; k < w; k++) { const d = Math.round(Math.sin(t / 220 + k * .45 + x) * 1.4 * (k + 1) / w); if (d) c.drawImage(src, x + k + L, y + T, 1, h, X(x + k), Y(y) + d, 1, h); }
  for (const [x, y, w, h] of S.cloth) for (let k = 0; k < w; k += 2) { const d = Math.round(Math.sin(t / 380 + k * .18 + y) * .9); if (d) c.drawImage(src, x + k + L, y + T, 2, h, X(x + k), Y(y) + d, 2, h); }
  if (lvl !== 'low') for (const [x, y, w, h] of S.trees) for (let r = 0; r < h * .7; r += 2) { const d = Math.round(Math.sin(t / 1100 + x * .1) * 1.3 * (1 - r / (h * .7))); if (d) c.drawImage(src, x + L, y + r + T, w, 2, X(x) + d, Y(y + r), w, 2); }
  for (const [i, j, r] of S.props) { const a = t / 28; glow(X(i), Y(j), r * .7, '#c8d0dc', .08); for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 2; aLine(X(i), Y(j), X(i + Math.cos(b) * r), Y(j + Math.sin(b) * r * .55), '#7a8494', .55, 3); } }
  // torches and glowing crystals / lamps
  for (const [i, j, kind] of S.torches) { const pal = kind === 'blue' ? BLUE_PAL : FIRE_PAL; glow(X(i), Y(j) - 3, 7 + Math.sin(t / 90 + i) * 1.2, pal[2], .3); flamePx(X(i), Y(j), 6 + Math.sin(t / 70 + i) * 1.5, 2, t + i * 9, pal, .95); if (Math.random() < .04) P(fromArtX(i), fromArtY(j) - 8, { vy: -40, vx: rnd2(-10, 10), life: 600, ramp: kind === 'blue' ? 'blueFire' : 'fire', size: 1, add: true }); }
  for (const [i, j, col, r] of S.glows) glow(X(i), Y(j), r * (.85 + .15 * Math.sin(t / 500 + i)), col, .22 + .12 * Math.sin(t / 700 + j));
}

/* ---------- ambience in front of everything ---------- */
const AMB = [];
function animateFront(b, ox, oy, t) {
  const A = STAGES[STAGE_ID]; if (!A || !A.amb2) return; const X = i => Math.round(i - ox), Y = j => Math.round(j - oy), types = A.amb2, dt = 16;
  if (AMB.length && AMB.stage !== STAGE_ID) AMB.length = 0; AMB.stage = STAGE_ID;
  const e = EXT(STAGE_ID), L = -e.l, T = -e.t, AW = e.W, AH = e.H, cap = (window.SETTINGS && SETTINGS.quality === 'low') ? 12 : 60;
  if (AMB.length < cap && !REDUCED) { const kind = types[Math.floor(Math.random() * types.length)], r = Math.random;
    if (kind === 'leaves' && r() < .06) AMB.push({ k: kind, x: L + r() * AW, y: T - 6, vx: 8 + r() * 10, vy: 14 + r() * 10, ph: r() * 6, col: r() < .5 ? '#6aa84a' : r() < .5 ? '#c9a046' : '#8ac860', life: 9e9 });
    if (kind === 'sand' && r() < .25) AMB.push({ k: kind, x: L - 10, y: T + r() * AH, vx: 70 + r() * 60, vy: rnd2(-4, 4), col: r() < .5 ? '#f2d9a0' : '#d8b878', life: 9e9 });
    if (kind === 'fireflies' && r() < .03) AMB.push({ k: kind, x: L + r() * AW, y: T + r() * AH, vx: 0, vy: 0, ph: r() * 6, life: 4000 + r() * 4000, t0: t });
    if (kind === 'sparks' && r() < .08) AMB.push({ k: kind, x: 120 + r() * 460, y: 80 + r() * 280, vx: 0, vy: -6, ph: r() * 6, col: r() < .5 ? '#7ff7ff' : '#ff8ad8', life: 1600, t0: t });
    if (kind === 'wind' && r() < .05) AMB.push({ k: kind, x: L - 30, y: T + r() * AH, vx: 160 + r() * 80, vy: 0, life: 9e9 });
    if (kind === 'birds' && r() < .004) AMB.push({ k: kind, x: L - 20, y: T + 20 + r() * 220, vx: 40 + r() * 20, vy: rnd2(-3, 3), ph: r() * 6, life: 9e9 }); }
  for (let n = AMB.length - 1; n >= 0; n--) { const p = AMB[n]; p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
    if (p.x > L + AW + 30 || p.y > T + AH + 10 || (p.t0 !== undefined && t - p.t0 > p.life)) { AMB.splice(n, 1); continue; }
    const i = X(p.x), j = Y(p.y);
    if (p.k === 'leaves') { p.x += Math.sin(t / 400 + p.ph) * .3; const f = Math.floor(t / 180 + p.ph) % 2; aRect(i, j, f ? 2 : 1, f ? 1 : 2, p.col, .9); }
    else if (p.k === 'sand') aRect(i, j, 3, 1, p.col, .5);
    else if (p.k === 'fireflies') { p.x += Math.sin(t / 900 + p.ph) * .25; p.y += Math.cos(t / 1100 + p.ph) * .2; const a = (Math.sin(t / 300 + p.ph) + 1) / 2; glow(i, j, 3, '#f8ff9a', .5 * a); aRect(i, j, 1, 1, '#ffffe0', a); }
    else if (p.k === 'sparks') { const a = Math.sin((t - p.t0) / p.life * Math.PI); aRect(i, j, 1, 1, p.col, a); if (a > .8) { aRect(i - 1, j, 3, 1, p.col, a * .5); aRect(i, j - 1, 1, 3, p.col, a * .5); } }
    else if (p.k === 'wind') { aRect(i, j, 14, 1, '#ffffff', .25); }
    else if (p.k === 'birds') { const f = Math.floor(t / 160 + p.ph) % 2; aRect(i - 2, j - f, 2, 1, '#2a2a34'); aRect(i + 1, j - f, 2, 1, '#2a2a34'); aRect(i, j, 1, 1, '#2a2a34'); }
  }
}
function drawStageForeground(b, ox, oy, t) { animateFront(b, ox, oy, t); }
function drawStageBackdrop() { }
