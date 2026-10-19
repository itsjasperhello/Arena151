/* =====================================================================
   Section 7d: scene arenas
   The five arenas are the provided scene paintings, scaled so the battle
   court is the playfield and the trainer pads are the trainer spots, and
   brought to life every frame: waterfalls flow, water glints, torches burn,
   flags and banners wave, trees sway, the crowds bob and cheer (harder on
   big hits), crystals pulse, clouds drift, propellers spin.
   ===================================================================== */
const STAGE_ALIAS = { summit: 'sky', cavern: 'crystal', hall: 'plaza', castle: 'sky', grand: 'plaza', meteor: 'crystal' };
const SCENE = {};            // id → { img, masks: {water, cloud, circuit}, water: [pixel list], loaded }
for (const [id, a] of Object.entries(STAGE_ASSETS)) {
  STAGES[id] = { name: a.name, ambient: a.ambient, walk: a.walk, trainers: a.trainers, entry: a.entry, crowd: a.crowd, scene: true, anim: a.anim };
  const sc = SCENE[id] = { img: new Image(), masks: {}, water: [], loaded: false };
  sc.img.onload = () => { sc.loaded = true; delete STAGE_CACHE[id]; if (STAGE_ID === id) stageCanvas = buildStage(id); };
  sc.img.src = a.img;
  for (const [k, src] of Object.entries(a.masks)) { if (!src) continue; const im = new Image();
    im.onload = () => { sc.masks[k] = im; if (k === 'water') { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4] > 128) sc.water.push(i, j); } };
    im.src = src; }
}
STAGE_ORDER.length = 0; STAGE_ORDER.push('plaza', 'sky', 'crystal', 'desert', 'jungle');
Object.assign(GRADE, { plaza: { col: 'rgba(255,220,170,1)', a: .04, vig: .3 }, sky: { col: 'rgba(200,225,255,1)', a: .04, vig: .25 }, crystal: { col: 'rgba(150,100,230,1)', a: .07, vig: .4 }, desert: { col: 'rgba(255,200,130,1)', a: .05, vig: .3 }, jungle: { col: 'rgba(170,230,150,1)', a: .04, vig: .35 } });

const _setStageBase = setStage;
setStage = id => _setStageBase(STAGES[id] && STAGES[id].scene ? id : (STAGE_ALIAS[id] || 'plaza'));
const _buildStageBase = buildStage;
buildStage = id => {
  if (!STAGES[id] || !STAGES[id].scene) return _buildStageBase(id);
  if (STAGE_CACHE[id]) return STAGE_CACHE[id];
  const c = document.createElement('canvas'); c.width = ART_W; c.height = ART_H; const x = c.getContext('2d');
  if (!SCENE[id].loaded) { x.fillStyle = '#0b0f1a'; x.fillRect(0, 0, ART_W, ART_H); return c; }   // decoding; swapped in by onload
  x.drawImage(SCENE[id].img, 0, 0); STAGE_CACHE[id] = c; STAGE_FG[id] = STAGE_FG[id] || document.createElement('canvas'); return c;
};

/* ---------- animation ---------- */
let CROWD_HYPE = 0;
const _cloudBuf = document.createElement('canvas'), _cloudX = _cloudBuf.getContext('2d');
function sceneSlice(c, sx, sy, w, h, dx, dy) { if (w > 0 && h > 0) c.drawImage(stageCanvas, sx, sy, w, h, dx, dy, w, h); }
animateStage = (c, ox, oy, t) => {
  if (!STAGE.scene || !SCENE[STAGE_ID].loaded) return;
  const A = STAGE.anim, sc = SCENE[STAGE_ID], X = i => Math.round(i - ox), Y = j => Math.round(j - oy);
  // drifting clouds (only over the open sky)
  if (sc.masks.cloud) { if (_cloudBuf.width !== ART_W) { _cloudBuf.width = ART_W; _cloudBuf.height = ART_H; }
    const dx = (t / 90) % ART_W; _cloudX.globalCompositeOperation = 'source-over'; _cloudX.clearRect(0, 0, ART_W, ART_H); _cloudX.globalAlpha = .55;
    _cloudX.drawImage(stageCanvas, dx, 0); _cloudX.drawImage(stageCanvas, dx - ART_W, 0); _cloudX.globalAlpha = 1;
    _cloudX.globalCompositeOperation = 'destination-in'; _cloudX.drawImage(sc.masks.cloud, 0, 0); c.drawImage(_cloudBuf, -ox, -oy); }
  // waterfalls: scroll the falling water downward
  for (const [x0, y0, x1, y1] of A.waterfalls) { const w = x1 - x0, h = y1 - y0, off = Math.floor(t / 28) % h;
    sceneSlice(c, x0, y0, w, h - off, X(x0), Y(y0 + off)); sceneSlice(c, x0, y1 - off, w, off, X(x0), Y(y0));
    for (let k = 0; k < 6; k++) { const fx = x0 + ((k * 37 + Math.floor(t / 90) * 13) % w); aRect(X(fx), Y(y1 - 2 - (k % 3)), 2, 1, '#ffffff', .85); } }
  // water glints racing across rivers, moats and pools
  if (sc.water.length) { const ph = Math.floor(t / 110); for (let k = 0; k < sc.water.length; k += 2) { const i = sc.water[k], j = sc.water[k + 1]; if ((i + j * 3 + ph) % 31 === 0) aRect(X(i), Y(j), (i + ph) % 3 ? 1 : 2, 1, '#d8f6ff', .75); } }
  // flags and banners: horizontal flags ripple by column, hanging banners sway by row
  for (const [x0, y0, x1, y1] of A.flags) { const w = x1 - x0, h = y1 - y0;
    if (w > h * 1.3) for (let i = 0; i < w; i++) sceneSlice(c, x0 + i, y0, 1, h, X(x0 + i), Y(y0) + Math.round(Math.sin(t / 170 + i / 4 + x0) * 1.6 * (i / w)));
    else for (let j = 0; j < h; j++) sceneSlice(c, x0, y0 + j, w, 1, X(x0) + Math.round(Math.sin(t / 260 + j / 6 + x0) * 1.5 * (j / h)), Y(y0 + j)); }
  // trees and palms: canopies sway gently, more at the top
  for (const [x0, y0, x1, y1] of A.trees) { const w = x1 - x0, h = y1 - y0; for (let j = 0; j < h; j++) { const off = Math.round(Math.sin(t / 1100 + x0 * .1 + j / 30) * 1.4 * Math.max(0, 1 - j / (h * .7))); if (off) sceneSlice(c, x0, y0 + j, w, 1, X(x0) + off, Y(y0 + j)); } }
  // crowds: each spectator column bobs on its own beat; big hits make them jump
  const hype = clock.t < CROWD_HYPE ? 1 : 0;
  for (const [x0, y0, x1, y1] of A.crowds) { const w = x1 - x0, h = y1 - y0; for (let i = 0; i < w; i += 5) { const k = Math.floor((x0 + i) / 5), amp = hype ? 3 : 1, up = Math.max(0, Math.round(Math.sin(t / (hype ? 90 : 240) + k * 1.9) * amp)); if (up) sceneSlice(c, x0 + i, y0, Math.min(5, w - i), h, X(x0 + i), Y(y0) - up); } }
  // props: bobbing balloons/airship and spinning propellers
  for (const p of A.props) {
    if (p[0] === 'bob') { const [, x0, y0, x1, y1] = p, off = Math.round(Math.sin(t / 700 + x0) * 2); if (off) sceneSlice(c, x0, y0, x1 - x0, y1 - y0, X(x0), Y(y0) + off); }
    else { const [, i, j, r, axis] = p, a = t / 45; aEll(X(i), Y(j), axis === 'h' ? r : r * .25, axis === 'h' ? r * .5 : r, '#ffffff', .12, 1);
      for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 2, ex = Math.cos(b) * r * (axis === 'h' ? 1 : .25), ey = Math.sin(b) * r * (axis === 'h' ? .5 : 1); aLine(X(i), Y(j), X(i + ex), Y(j + ey), '#c8ccd4', .55, 2); } } }
  // torches and braziers
  for (const [i, j, kind] of A.torches) { const pal = kind === 'b' ? ['#ffffff', '#d8f4ff', '#7fd6ff', '#3f8cff', '#2a5ad0', '#1a2a70'] : RAMP.fire;
    glow(X(i), Y(j) - 2, 6 + Math.sin(t / 90 + i) * 1.2, kind === 'b' ? '#4aa6ff' : '#ff9a1f', .35); flamePx(X(i), Y(j) + 1, 7 + Math.sin(t / 70 + j) * 1.5, 2.2, t + i * 13, pal, .9); }
  // glowing crystals and circuit lines
  for (const [i, j, n] of A.crystals) { const p = (Math.sin(t / 420 + i * .7 + j) + 1) / 2; if (p > .35) glow(X(i), Y(j), Math.min(12, 3 + Math.sqrt(n) * .8) * (.7 + p * .5), '#bfefff', (p - .35) * .55); }
  if (sc.masks.circuit) { const q = (t / 1600) % 1; c.save(); c.globalAlpha = .35 + .25 * Math.sin(t / 300); c.globalCompositeOperation = 'lighter'; c.drawImage(sc.masks.circuit, -ox, -oy); c.restore(); }
  if (A.fountain) { const [fi, fj] = A.fountain; for (let k = 0; k < 14; k++) { const q = ((t / 900) + k / 14) % 1, a = k * 2.399, r = q * 9, h = Math.sin(q * Math.PI) * 12; aRect(X(fi + Math.cos(a) * r), Y(fj - h + q * 3), 1, 1, '#d8f6ff', .9 * (1 - q * .5)); } }
};
animateFront = () => {};
drawStageBackdrop = () => {};
