/* =====================================================================
   Section 8: clock, timeline, camera and the pixel renderer
   The world is drawn into a low-resolution "art buffer" (1 art pixel =
   2 world units) and blitted to the screen at a whole-number scale, so
   every pixel is the same size and perfectly sharp. The camera follows
   the fight and zooms in on big moments; the zoom eases between whole
   numbers and settles on one.
   ===================================================================== */
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = { t: 0, speed: 1, paused: false, last: performance.now() };
let tasks = [], epoch = 0;
class Cancelled extends Error {}
function anim(dur, fn) { const my = epoch; return new Promise((res, rej) => tasks.push({ start: clock.t, dur: Math.max(1, dur), fn, res, rej, my })); }
const wait = ms => anim(ms, null);
function guard(my) { if (my !== epoch) throw new Cancelled(); }
function cancelAll() { epoch++; const old = tasks; tasks = []; old.forEach(t => t.rej(new Cancelled())); fx.length = 0; parts.length = 0; screenFx.length = 0; if (typeof ENTS !== 'undefined') { ENTS.length = 0; timers.length = 0; dimState.a = 0; } }

const scene = $('scene'), sctx = scene.getContext('2d');
let DW = 0, DH = 0, DPR = 1, PZ0 = 2, buf = null, bctx = null, gctx = null, fbuf = null, fctx = null, scarCanvas = null, scarCtx = null;
const fx = [], parts = [], screenFx = [], snow = [], scarOps = [];
const cam = { x: toArtX(500), y: toArtY(290), pz: 2, punchT: -1, fx: null, left: 0, top: 0 };
const shakeState = { amp: 0, until: 0 };
let flash = { a: 0, color: '#fff' }, lightning = { next: 5000, a: 0 };
const bigText = { text: '', t: -9999, life: 0, color: '#ffd23f' };
const slide = { text: '', t: -9999 };
const banner = { text: '', t: -9999, color: '#ffb347' };
const trainerWalk = { A: 1, B: 1 };
const crowdState = [];
const ACTOR_GLOW = { A: null, B: null };          // per-Pokémon colour glow used by move animations
const HITSTOP = { until: 0 };                        // real-time ms; the game runs at 12% speed until then

function resizeScene() {
  const r = scene.getBoundingClientRect(); DPR = window.devicePixelRatio || 1;
  DW = Math.max(1, Math.round(r.width * DPR)); DH = Math.max(1, Math.round(r.height * DPR));
  scene.width = DW; scene.height = DH;
  PZ0 = Math.max(1, Math.ceil(DW / (ART_W - 10)), Math.ceil(DH / (ART_H - 10)));   // widest whole-number view that fits inside the stage art
  buf = document.createElement('canvas'); buf.width = Math.ceil(DW / PZ0) + 4; buf.height = Math.ceil(DH / PZ0) + 4;
  gctx = bctx = buf.getContext('2d'); bctx.imageSmoothingEnabled = false;
  fbuf = document.createElement('canvas'); fbuf.width = buf.width; fbuf.height = buf.height; fctx = fbuf.getContext('2d'); fctx.imageSmoothingEnabled = false;
  cam.pz = PZ0;
  if (!snow.length) for (let i = 0; i < 170; i++) snow.push({ x: Math.random() * ART_W, y: Math.random() * ART_H, z: .35 + Math.random() * .9, p: Math.random() * 6 });
  if (!scarCanvas) buildScars();
}
function buildScars() { scarCanvas = document.createElement('canvas'); scarCanvas.width = ART_W; scarCanvas.height = ART_H; scarCtx = scarCanvas.getContext('2d'); scarOps.length = 0; }
const ax = x => toArtX(x), ay = y => toArtY(y);

/* ---------- persistent ground scars (art space) ---------- */
function addScar(kind, x, y, extra = {}) {
  const g = scarCtx; if (!g) return; const r = mulberry(Math.floor(Math.random() * 1e6)), gx = Math.round(ax(x)), gy = Math.round(ay(y));
  const dot = (i, j, c, a) => { g.globalAlpha = a; g.fillStyle = c; g.fillRect(i, j, 1, 1); };
  if (kind === 'crack') { for (let k = 0; k < 4; k++) { let i = gx, j = gy, a = k * 1.6 + r(); for (let q = 0; q < 9; q++) { i += Math.round(Math.cos(a)); j += Math.round(Math.sin(a) * .7); a += (r() - .5) * .9; dot(i, j, '#2a2e38', .8); } } }
  else if (kind === 'scorch') { for (let k = 0; k < 46; k++) { const a = r() * 6.28, d = r() * 8; dot(gx + Math.round(Math.cos(a) * d), gy + Math.round(Math.sin(a) * d * .6), r() < .7 ? '#24262d' : '#4a4038', .5); } }
  else if (kind === 'splat') { for (let k = 0; k < 30; k++) { const a = r() * 6.28, d = r() * 6; dot(gx + Math.round(Math.cos(a) * d), gy + Math.round(Math.sin(a) * d * .6), extra.color || '#5d6b7a', .45); } }
  else if (kind === 'trail') { for (let k = 0; k < 3; k++) dot(gx + Math.round((r() - .5) * 3), gy + Math.round((r() - .5) * 2), '#383d48', .3); }
  g.globalAlpha = 1; scarOps.push(kind);
}

/* ---------- art-buffer primitives ---------- */
let OX = 0, OY = 0;   // camera offset in art pixels (top-left of the view)
const bx = x => Math.round(ax(x) - OX), by = y => Math.round(ay(y) - OY);
function aRect(i, j, w, h, col, a = 1) { bctx.globalAlpha = a; bctx.fillStyle = col; bctx.fillRect(Math.round(i), Math.round(j), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); bctx.globalAlpha = 1; }
function aDisc(i, j, r, col, a = 1) { bctx.globalAlpha = a; bctx.fillStyle = col; const ri = Math.max(1, Math.round(r)); for (let q = -ri; q <= ri; q++) { const w = Math.round(Math.sqrt(Math.max(0, ri * ri - q * q))); bctx.fillRect(Math.round(i) - w, Math.round(j) + q, w * 2 + 1, 1); } bctx.globalAlpha = 1; }
function aRing(i, j, rx, ry, col, a = 1, th = 1) { bctx.globalAlpha = a; bctx.fillStyle = col; const n = Math.max(24, Math.round((rx + ry) * 3)); let li = null, lj = null; for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2, x = Math.round(i + Math.cos(t) * rx), y = Math.round(j + Math.sin(t) * ry); if (x !== li || y !== lj) bctx.fillRect(x, y, th, th); li = x; lj = y; } bctx.globalAlpha = 1; }
function aEllFill(i, j, rx, ry, col, a) { bctx.globalAlpha = a; bctx.fillStyle = col; const rows = Math.max(1, Math.round(ry)); for (let q = -rows; q <= rows; q++) { const w = rx * Math.sqrt(Math.max(0, 1 - (q / rows) ** 2)); bctx.fillRect(Math.round(i - w), Math.round(j) + q, Math.max(1, Math.round(w * 2)), 1); } bctx.globalAlpha = 1; }
function aLine(i0, j0, i1, j1, col, a = 1, w = 1) { bctx.globalAlpha = a; bctx.fillStyle = col; const n = Math.ceil(Math.hypot(i1 - i0, j1 - j0)); for (let k = 0; k <= n; k++) { const t = n ? k / n : 0; bctx.fillRect(Math.round(lerp(i0, i1, t) - w / 2), Math.round(lerp(j0, j1, t) - w / 2), w, w); } bctx.globalAlpha = 1; }

/* ---------- effects API used by the simulation ---------- */
const MOVE_FX = {
  Fire: { col: '#ff7b2a', core: '#ffe36b', scar: 'scorch' }, Water: { col: '#4aa6ff', core: '#d9f1ff', scar: 'splat', sc: '#6d8fb0' },
  Grass: { col: '#58d65a', core: '#e2ffc4', scar: 'splat', sc: '#4f7a46' }, Electric: { col: '#ffe04a', core: '#ffffff', scar: 'scorch' },
  Ice: { col: '#a8efff', core: '#ffffff', scar: 'splat', sc: '#e9fbff' }, Fighting: { col: '#ff8a5b', core: '#fff1e6', scar: 'crack' },
  Poison: { col: '#b65cff', core: '#f2d9ff', scar: 'splat', sc: '#5d2d78' }, Ground: { col: '#c99a4d', core: '#fff0c9', scar: 'crack' },
  Flying: { col: '#d7e6ff', core: '#ffffff', scar: 'splat', sc: '#a8b8c8' }, Psychic: { col: '#ff6fc8', core: '#ffe2f4', scar: 'splat', sc: '#a86b95' },
  Bug: { col: '#b6d636', core: '#f4ffc8', scar: 'splat', sc: '#5b6b24' }, Rock: { col: '#b89f6a', core: '#f3e6c2', scar: 'crack' },
  Ghost: { col: '#8c6bff', core: '#e6dcff', scar: 'splat', sc: '#2d2348' }, Dragon: { col: '#7d6bff', core: '#e5e0ff', scar: 'crack' },
  Steel: { col: '#cad8e6', core: '#ffffff', scar: 'crack' }, Fairy: { col: '#ffb3e3', core: '#ffffff', scar: 'splat', sc: '#e7a7cf' },
  Normal: { col: '#ffffff', core: '#ffffff', scar: 'trail' }, Dark: { col: '#6a5a7a', core: '#d9cde8', scar: 'crack' }
};
const fxOf = mv => MOVE_FX[mv.type] || MOVE_FX.Normal;
const head = S => { const sd = side(S); return { x: sd.x, y: sd.y - 44 }; };
function spark(x, y, o = {}) { parts.push({ x, y, vx: o.vx ?? (Math.random() - .5) * 120, vy: o.vy ?? (Math.random() - .5) * 120, g: o.g ?? 0, life: o.life ?? 500, t: 0, color: o.color || '#fff', size: o.size || 1, shape: o.shape || 'sq', add: !!o.add }); }
function burstAt(x, y, color, n = 16, spd = 260, size = 1) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = spd * (.35 + Math.random() * .8); spark(x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 260, life: 320 + Math.random() * 320, color: Math.random() < .3 ? '#ffffff' : color, size: size + (Math.random() < .3 ? 1 : 0) }); } }
function floatText(x, y, text, o = {}) {
  for (let n = 0; n < 6; n++) { const clash = fx.some(f => f.kind === 'text' && clock.t - f.t0 < 450 && Math.abs(f.x - x) < 70 && Math.abs((f.y + f.vy * (clock.t - f.t0)) - y) < 20); if (!clash) break; y -= 22; }
  fx.push({ kind: 'text', x, y, text, t0: clock.t, life: o.life || 950, color: o.color || '#fff', size: o.size || 30, vy: o.vy ?? -.045, stroke: o.stroke || '#141a2c', italic: !!o.italic, id: o.id });
}
function ringFx(x, y, color, r0, r1, life) { fx.push({ kind: 'ring', x, y, color, r0, r1, t0: clock.t, life }); }
function punch(x, y, ms = 1200, lv = 2) { cam.punchT = clock.t + ms; cam.fx = { x, y, lv }; }
const VFX = {
  text(S, t, col) { const h = head(S); floatText(h.x, h.y - 26, t, { size: 18, color: col }); },
  hit(S, mv, dmg, eff, crit) {
    const f = fxOf(mv), h = head(S), sd = side(S), R = MFX[mv.name];
    if (R && R.impact) { try { R.impact(S, mv, crit, eff); } catch (e) { console.error(e); } if (crit) burstAt(h.x, h.y + 10, '#ffffff', 14, 300, 2); }
    else { burstAt(h.x, h.y + 10, f.col, crit ? 26 : 16, crit ? 340 : 250, crit ? 2 : 1); ringFx(h.x, h.y + 10, f.core, 8, crit ? 70 : 48, 300); }
    VFX.shake(crit ? 11 : eff > 1 ? 8 : 4, crit ? 360 : 220); if (crit) screenFlash('#ffffff', .3);
    if (Math.random() < .75) addScar(f.scar, sd.x + (Math.random() - .5) * 30, sd.y + (Math.random() - .5) * 12, { color: f.sc });
    floatText(h.x + (Math.random() - .5) * 18, h.y - 12, String(dmg), { size: crit ? 40 : 32, color: crit ? '#ffe24a' : '#ffffff', life: 1000 });
    if (crit) floatText(h.x, h.y - 46, 'CRITICAL HIT!', { size: 17, color: '#ffe24a', life: 1100, italic: true });
    if (eff > 1) floatText(h.x, h.y - (crit ? 66 : 46), 'SUPER EFFECTIVE!', { size: 17, color: '#ffe066', life: 1100, italic: true });
    else if (eff < 1) floatText(h.x, h.y - (crit ? 66 : 46), 'NOT VERY EFFECTIVE', { size: 15, color: '#e0e6f5', life: 1100, italic: true });
    if (crit || (eff > 1 && dmg > act(S).max * .25)) punch(sd.x, sd.y - 30, 900, 1);
    portraitShake(S);
  },
  impactAt(x, y, mv) { const R = MFX[mv.name]; if (R && R.hitAt) { try { R.hitAt(x, y, mv); } catch (e) { console.error(e); } return; } burstAt(x, y, fxOf(mv).col, 8, 160, 1); },
  explode(x, y, mv) { const R = MFX[mv.name]; if (R && R.explode) { try { R.explode(x, y, mv); } catch (e) { console.error(e); } return; } const f = fxOf(mv); ringFx(x, y, f.col, 10, 90, 420); ringFx(x, y, f.core, 6, 60, 320); burstAt(x, y, f.col, 26, 300, 2); VFX.shake(7, 260); addScar('scorch', x, y + 30); },
  status(S, st) { const h = head(S); ringFx(h.x, h.y + 10, STATUS_INFO[st].color, 10, 60, 420); },
  stage(S, k, d) { const h = head(S), up = d > 0; fx.push({ kind: 'arrows', x: h.x, y: h.y, color: up ? '#ff8a72' : '#76a7ff', up, t0: clock.t, life: 650 }); },
  heal(S, h, small) { const p = head(S); for (let i = 0; i < (small ? 5 : 14); i++) spark(p.x + (Math.random() - .5) * 50, p.y + 30, { color: '#7dff9a', vy: -80 - Math.random() * 60, vx: 0, life: 700, shape: 'plus' }); floatText(p.x, p.y - 20, '+' + h, { size: small ? 16 : 24, color: '#7dff9a' }); },
  recoil(S, rc) { const p = head(S); side(S).hit = 300; floatText(p.x, p.y - 44, 'HURT BY RECOIL!', { size: 15, color: '#ff9a9a', italic: true }); floatText(p.x, p.y - 20, String(rc), { size: 24, color: '#ffd0d0' }); },
  dot(S, st, d) { const p = head(S), col = STATUS_INFO[st].color; burstAt(p.x, p.y + 10, col, 10, 140, 1); side(S).hit = 200; floatText(p.x, p.y - 20, String(d), { size: 22, color: col }); },
  selfHit(S, d) { const p = head(S); side(S).hit = 300; floatText(p.x, p.y - 20, String(d), { size: 26 }); VFX.banner('IT HURT ITSELF IN ITS CONFUSION!', '#c8a6ff'); },
  ability(S, name) { const p = head(S); fx.push({ kind: 'text', x: p.x, y: p.y - 70, text: name.toUpperCase() + '!', t0: clock.t, life: 1500, color: '#ffb347', size: 38, vy: -.01, stroke: '#3a1606', italic: true }); punch(side(S).x, side(S).y - 30, 1100, 1); },
  missAt(x, y) { floatText(x, y, 'MISS', { size: 22, color: '#e6ecff' }); },
  windup(S, mv) { const R = MFX[mv.name]; if (R && R.charge) { try { R.charge(S, mv); } catch (e) { console.error(e); } } else fx.push({ kind: 'charge', S, color: fxOf(mv).col, t0: clock.t, life: WINDUP(mv) + 120 }); },
  exec(S, mv) { const R = MFX[mv.name]; if (R && R.exec) { try { R.exec(S, mv); } catch (e) { console.error(e); } } const sd = side(S); if (['contact', 'dash', 'slash'].includes(mv.anim)) for (let i = 0; i < 6; i++) spark(sd.x, sd.y - 10, { color: '#e9eef2', vx: -sd.face * (60 + Math.random() * 80), vy: -20 - Math.random() * 30, g: 200, life: 380 }); if (mv.anim === 'beam' && mv.pow >= 110) punch(sd.x, sd.y, 1300, 1); },
  dashFx(S, mv) { const R = MFX[mv.name]; if (R && R.dash) { try { R.dash(S, mv); } catch (e) { console.error(e); } if (Math.random() < .3) addScar('trail', side(S).x, side(S).y + 2); } else VFX.dust(S); },
  moveImpact(S, mv) { const R = MFX[mv.name]; if (R && R.impact) { try { R.impact(S, mv, false, 1); } catch (e) { console.error(e); } } },
  dust(S) { const sd = side(S); spark(sd.x + (Math.random() - .5) * 16, sd.y - 2, { color: '#e9eef2', vx: -sd.vx * .15, vy: -10 - Math.random() * 20, g: 60, life: 360 }); if (Math.random() < .35) addScar('trail', sd.x, sd.y + 2); },
  slash(S, mv) { const h = head(S); fx.push({ kind: 'slash', x: h.x, y: h.y, color: fxOf(mv).col, t0: clock.t, life: 300 }); },
  erupt(x, y) { burstAt(x, y, '#a08a66', 18, 260, 2); addScar('crack', x, y); VFX.shake(8, 260); },
  markFire(mk) {
    const f = fxOf(mk.mv), R = MFX[mk.mv.name];
    if (R && R.mark) { try { R.mark(mk); } catch (e) { console.error(e); } return; }
    if (mk.kind === 'bolt') { fx.push({ kind: 'bolt', x: mk.x, y: mk.y - 30, color: f.col, t0: clock.t, life: 300 }); screenFlash('#ffffff', mk.mv.pow >= 90 ? .55 : .25); addScar('scorch', mk.x, mk.y); }
    else if (mk.kind === 'sky') { ringFx(mk.x, mk.y - 10, f.col, 10, mk.r, 380); burstAt(mk.x, mk.y - 20, f.col, 24, 260, 2); addScar(mk.mv.type === 'Rock' ? 'crack' : 'splat', mk.x, mk.y, { color: '#f2fbff' }); VFX.shake(6, 250); }
    else fx.push({ kind: 'psy', x: mk.x, y: mk.y - 30, color: f.col, t0: clock.t, life: 520 });
  },
  shake(a, d) { if (REDUCED) a *= .2; shakeState.amp = Math.max(shakeState.amp, a); shakeState.until = Math.max(shakeState.until, clock.t + d); },
  big(t, col) { bigText.text = t; bigText.t = clock.t; bigText.life = 950; bigText.color = col || '#ffd23f'; },
  banner(t, col) { banner.text = t; banner.t = clock.t; banner.color = col || '#ffb347'; },
  aura(S, col) { const h = head(S); fx.push({ kind: 'aura', x: h.x, y: h.y + 10, color: col, t0: clock.t, life: 700 }); },
  sendOut(S) { fx.push({ kind: 'capsule', S, t0: clock.t, life: 320 }); },
  call(S, text) { const t = TRAINER_POS[S]; screenFx.push({ kind: 'call', x: t.x + (S === 'A' ? -6 : 6), y: t.y - 62, text, align: S === 'A' ? 'left' : 'right', t0: clock.t, life: 1600 }); },
  faint(S) { slide.text = `${displayName(act(S))} FAINTED!`; slide.t = clock.t; portraitShake(S); punch(side(S).x, side(S).y - 30, 1300, 2); },
  plotArmor(S) { bigText.text = 'ANIME PLOT ARMOR ACTIVATE!'; bigText.t = clock.t; bigText.life = 1700; bigText.color = '#ffb347'; punch(side(S).x, side(S).y - 30, 1600, 2); VFX.shake(10, 400); },
  combo(S, n) { const h = head(S), old = fx.find(f => f.id === 'combo' + S && clock.t - f.t0 < 900); if (old) { old.text = `${n} HIT COMBO!`; old.t0 = clock.t; return; } fx.push({ kind: 'text', x: h.x - 60, y: h.y - 80, text: `${n} HIT COMBO!`, t0: clock.t, life: 1100, color: '#ffe066', size: 40, vy: 0, stroke: '#3a2606', italic: true, id: 'combo' + S }); },
  crowd(level) { const n = crowdState.length; if (!n) return; for (let i = 0; i < Math.min(n, level > 1 ? 4 : 2); i++) { const c = crowdState[Math.floor(Math.random() * n)]; c.react = clock.t; c.mark = level > 1 && Math.random() < .5 ? '!!' : '!'; } },
  megaStart(S) { const sd = side(S); VFX.big('MEGA EVOLUTION!', '#ff9cf0'); punch(sd.x, sd.y - 30, 1700, 2); VFX.shake(6, 900); for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28; spark(sd.x + Math.cos(a) * 70, sd.y - 40 + Math.sin(a) * 60, { color: i % 2 ? '#ff9cf0' : '#9ff1ff', vx: -Math.cos(a) * 120, vy: -Math.sin(a) * 110, life: 600, add: true, size: 2 }); } },
  megaDone(S) { const sd = side(S), n = act(S).name.toUpperCase(); burstAt(sd.x, sd.y - 40, '#ff9cf0', 40, 360, 2); ringFx(sd.x, sd.y - 20, '#ffffff', 10, 120, 600); screenFlash('#ffe8fb', .5); VFX.banner(`${n} MEGA EVOLVED INTO MEGA ${n}!`, '#ff9cf0'); }
};
function screenFlash(color, a) { if (REDUCED) a *= .3; flash = { a, color }; }
function portraitShake(S) { const el = $('port' + S); if (!el) return; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }

/* ---------- camera ---------- */
function updateCamera(dt) {
  let tx = toArtX(500), ty = toArtY(290), level = 0;
  if (G && ['battle', 'pick', 'intro', 'over'].includes(G.phase)) {
    const a = side('A'), b = side('B'), va = !['out', 'wait'].includes(a.state), vb = !['out', 'wait'].includes(b.state);
    if (va && vb) { tx = toArtX((a.x + b.x) / 2); ty = toArtY((a.y + b.y) / 2 - 25); }
    else if (va) { tx = toArtX(a.x); ty = toArtY(a.y - 25); } else if (vb) { tx = toArtX(b.x); ty = toArtY(b.y - 25); }
    if (G.phase === 'over' && G.winner && G.winner !== 'draw') { const w = side(G.winner); tx = toArtX(w.x); ty = toArtY(w.y - 30); level = 1; }
  }
  if (clock.t < cam.punchT && cam.fx) { tx = toArtX(cam.fx.x); ty = toArtY(cam.fx.y); level = Math.max(level, cam.fx.lv); }
  if (REDUCED || camLock) level = 0;
  const fitsW = DW / (PZ0 + level) >= 470, fitsH = DH / (PZ0 + level) >= 270;   // can the view hold the whole arena on this axis?
  tx = lerp(tx, toArtX(500), level === 0 && fitsW ? .55 : .1); ty = lerp(ty, toArtY(290), level === 0 && fitsH ? .55 : .05);
  const targetPz = PZ0 + level, e = 1 - Math.exp(-dt / 260);
  cam.pz += (targetPz - cam.pz) * e; if (Math.abs(targetPz - cam.pz) < .02) cam.pz = targetPz;
  const ec = 1 - Math.exp(-dt / 220); cam.x += (tx - cam.x) * ec; cam.y += (ty - cam.y) * ec;
  const vw = DW / cam.pz, vh = DH / cam.pz;
  cam.left = Math.round(vw >= ART_W ? (ART_W - vw) / 2 : clamp(cam.x - vw / 2, 0, ART_W - vw));
  cam.top = Math.round(vh >= ART_H ? (ART_H - vh) / 2 : clamp(cam.y - vh / 2, 0, ART_H - vh));
}
let camLock = false;
const toScreenX = x => (ax(x) - OX) * cam.pz, toScreenY = y => (ay(y) - OY) * cam.pz;

/* ---------- drawing ---------- */
const DISPLAY_FONT = () => getComputedStyle(document.body).getPropertyValue('--display') || 'Arial Black';
function drawTrainer(S) {
  const img = trainerCanvas(S), t = TRAINER_POS[S], off = trainerWalk[S] * (S === 'A' ? -140 : 140);
  const sd = G ? side(S) : null, lift = sd && G.time >= sd.throwT && G.time - sd.throwT < 300 ? Math.round(Math.sin((G.time - sd.throwT) / 300 * Math.PI) * 2) : 0;
  const i = bx(t.x + off), j = by(t.y);
  aEllFill(i, j, 7, 2, '#0b0f1a', .3);
  bctx.save(); if (S === 'B') { bctx.translate(i + 8, j - 24 - lift); bctx.scale(-1, 1); bctx.drawImage(img, 0, 0); } else bctx.drawImage(img, i - 8, j - 24 - lift); bctx.restore();
}
function drawCrowd() {
  if (crowdState.length !== STAGE.crowd.length || crowdState.stage !== STAGE_ID) { crowdState.length = 0; crowdState.stage = STAGE_ID; STAGE.crowd.forEach(([x, y], k) => crowdState.push({ x, y, pal: CROWD_PALS[k % CROWD_PALS.length], react: -9999, mark: '!', ph: Math.random() * 6 })); }
  for (const c of crowdState) {
    const i = bx(c.x), j = by(c.y), since = clock.t - c.react, hop = since < 400 ? Math.round(Math.sin(since / 400 * Math.PI) * 3) : 0;
    drawSpectator(bctx, i, j - hop, c.pal, c.x < 500 ? 1 : -1);
    if (since < 1000) { const w = c.mark.length * 3 + 3, top = j - hop - 26; aRect(i - w / 2, top, w, 8, '#ffffff'); aRect(i - 1, top + 8, 2, 2, '#ffffff'); for (let q = 0; q < c.mark.length; q++) { aRect(i - w / 2 + 2 + q * 3, top + 1, 1, 4, '#d0202a'); aRect(i - w / 2 + 2 + q * 3, top + 6, 1, 1, '#d0202a'); } }
    else if (STAGE_ID === 'cavern' && Math.floor((clock.t + c.ph * 1000) / 2600) % 4 === 0) { const top = j - hop - 25; aRect(i - 4, top, 9, 6, '#ffffff'); for (let q = 0; q < 3; q++) aRect(i - 3 + q * 3, top + 3, 1, 1, '#5a5a6a'); aRect(i - 1, top + 6, 2, 1, '#ffffff'); }
  }
}
function actorLook(S) {
  const sd = side(S), m = act(S); if (!m || sd.state === 'out' || sd.state === 'wait') return null;
  const megaNow = m.mega || (sd.state === 'mega' && sd.stateT > 750), sp = spriteOf(m.name, megaNow);
  let scale = 1, alpha = 1, white = 0, gray = false, sink = 0;
  if (sd.state === 'entering') { const t = sd.stateT; if (t < 320) return null; const q = (t - 320) / 440; scale = Ease.outBack(clamp(q, 0, 1)); white = 1 - clamp(q * 1.4, 0, 1); }
  if (sd.state === 'leaving') { const q = sd.stateT / 360; scale = 1 - q; white = Math.min(1, q * 3); }
  if (sd.state === 'fainting') { const q = sd.stateT / 1100; gray = q > .25; if (q < .25) white = Math.floor(q * 24) % 2 ? .9 : 0; sink = q > .25 ? (q - .25) / .75 : 0; alpha = 1 - Math.max(0, (q - .4) / .6); }
  if (sd.state === 'mega') { const q = sd.stateT / 1500; white = q < .5 ? (Math.floor(q * 30) % 2 ? .9 : .2) : Math.max(0, 1 - (q - .5) * 3); }
  return { sd, m, sp, megaNow, scale, alpha, white, gray, sink };
}
// footprint size in art pixels: generated art is 1:1, custom art is 2 sprite pixels per art pixel
const bodyArt = sp => sp.custom ? sp.w / 2 * .62 : sp.size;
function drawActorGround(S) {
  if (!G) return; const L = actorLook(S); if (!L) return;
  const { sd, sp, scale, alpha } = L, i0 = bx(sd.x), j0 = by(sd.y), size = bodyArt(sp);
  if (sd.state === 'mega') { const q = sd.stateT / 1500; aRing(i0, j0 - size * .4, 20 + Math.sin(clock.t / 60) * 4, 18, '#ff9cf0', .8, 2); aRing(i0, j0 - size * .4, 28 - q * 10, 26 - q * 10, '#9ff1ff', .7, 1); }
  if (sd.dig) { aEllFill(i0, j0, 8, 3, '#6e5a44', .85); aEllFill(i0, j0 - 1, 5, 2, '#8d775c', .85); return; }
  const w = Math.max(6, Math.round(14 * size / 56 * scale));
  aEllFill(i0, j0, w, Math.max(2, Math.round(w / 3.5)), '#0b0f1a', .3 * alpha);
  if (sd.state === 'idle') aRing(i0, j0, Math.round(w * 1.5), Math.max(3, Math.round(w / 2.6)), '#ffffff', .7);
}
// The sprite itself is drawn on the screen canvas: generated art at 1 sprite pixel = 1 art pixel,
// custom art at 1 sprite pixel = half an art pixel, always a whole number of screen pixels.
function drawActorSprite(S) {
  if (!G) return; const L = actorLook(S); if (!L || L.sd.dig) return;
  const { sd, m, sp, megaNow, scale, alpha, white, gray, sink } = L, c = sctx;
  const st = m.status, frozen = st === 'frz', asleep = st === 'slp', moving = Math.hypot(sd.vx, sd.vy) > 40;
  const hopArt = (sd.hop > 0 ? Math.sin(sd.hop * Math.PI) * 6 * (sd.hopK || 1) : 0) + (moving && !sp.custom ? Math.floor(sd.walk / 16) % 2 : 0);
  const sx = (ax(sd.x) - OX) * cam.pz, sy = (ay(sd.y) - OY) * cam.pz;
  const flashOn = sd.hit > 0 && Math.floor(sd.hit / 55) % 2 === 0;
  if (sp.custom) {
    // Front or back view: show the back while heading up the screen (away from the camera).
    let lx, ly; if (moving) { lx = sd.vx; ly = sd.vy; } else { const f = side(other(S)); lx = f.x - sd.x; ly = f.y - sd.y; }
    const len = Math.hypot(lx, ly) || 1;
    if (sd.view === 'back') { if (ly > -.15 * len) sd.view = 'front'; } else if (ly < -.45 * len) sd.view = 'back';
    const useBack = sd.view === 'back' && sp.back, a = ensureAnim(useBack ? sp.back : sp.front);
    const fi = frozen ? 0 : animFrameIndex(a, clock.t * (asleep ? .35 : 1) + (S === 'B' ? 777 : 0)), src = a.frames[fi];
    // front art faces left and back art faces right; mirror so the Pokémon faces where it is going
    const flip = useBack ? sd.face < 0 : sd.face > 0;
    const unit = Math.max(1, Math.round(cam.pz / 2)) * scale, still = a.frames.length < 2 && !a.live;
    const bob = still && !frozen ? (moving ? Math.floor(sd.walk / 16) % 2 : Math.floor(clock.t / 430) % 2) * unit : 0;
    const dw = Math.max(1, Math.round(a.w * unit)), dh = Math.max(1, Math.round(a.h * unit));
    c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = alpha;
    c.translate(Math.round(sx), Math.round(sy - hopArt * cam.pz + sink * 9 * cam.pz - bob)); c.scale(flip ? -1 : 1, 1);
    const ox = -Math.round(a.cx * unit), oy = -Math.round((a.h - a.foot) * unit);
    const put = img => c.drawImage(img, ox, oy, dw, dh);
    put(gray ? frameFx(src, a.w, a.h, 'gray') : src);
    const tint = (col, k) => { c.globalAlpha = alpha * k; put(frameFx(src, a.w, a.h, 'tint', col)); };
    if (sp.megaGlow && megaNow) tint('#ff7ce8', .18 + .1 * Math.sin(clock.t / 180));
    if (frozen) tint('#9feaff', .5);
    if (st === 'par' && Math.floor(clock.t / 120) % 9 === 0) tint('#ffe04a', .6);
    if (st === 'psn' || st === 'tox') tint('#b25bff', .12 + .1 * Math.sin(clock.t / 200));
    const ag = ACTOR_GLOW[S]; if (ag && clock.t < ag.until) tint(ag.col, ag.a * (.65 + .35 * Math.sin(clock.t / 45)));
    if (white > 0 || flashOn) tint('#ffffff', Math.max(white, flashOn ? .9 : 0));
    c.restore();
  } else {
    const unit = cam.pz;
    const f = frozen ? 0 : moving ? Math.floor(sd.walk / 16) % 2 : Math.floor(clock.t / (asleep ? 900 : 430)) % 2;
    const dw = Math.max(1, Math.round(sp.w * unit * scale)), dh = Math.max(1, Math.round(sp.h * unit * scale));
    const dx = Math.round(sx - dw / 2), dy = Math.round(sy - (sp.h - sp.foot) * unit * scale - hopArt * cam.pz + sink * 9 * cam.pz);
    c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = alpha;
    if (sd.face < 0) { c.translate(dx + dw, dy); c.scale(-1, 1); } else c.translate(dx, dy);
    c.drawImage(gray ? sp.gray : sp.frames[f], 0, 0, dw, dh);
    if (frozen) { c.globalAlpha = alpha * .5; c.drawImage(tintOf(m.name, '#9feaff', f, megaNow), 0, 0, dw, dh); }
    if (st === 'par' && Math.floor(clock.t / 120) % 9 === 0) { c.globalAlpha = alpha * .6; c.drawImage(tintOf(m.name, '#ffe04a', f, megaNow), 0, 0, dw, dh); }
    if (st === 'psn' || st === 'tox') { c.globalAlpha = alpha * (.12 + .1 * Math.sin(clock.t / 200)); c.drawImage(tintOf(m.name, '#b25bff', f, megaNow), 0, 0, dw, dh); }
    const ag = ACTOR_GLOW[S]; if (ag && clock.t < ag.until) { c.globalAlpha = alpha * ag.a * (.65 + .35 * Math.sin(clock.t / 45)); c.drawImage(tintOf(m.name, ag.col, f, megaNow), 0, 0, dw, dh); }
    if (white > 0 || flashOn) { c.globalAlpha = alpha * Math.max(white, flashOn ? .9 : 0); c.drawImage(sp.white[f], 0, 0, dw, dh); }
    c.restore();
  }
  if (!clock.paused && sd.state === 'idle') {
    const hx = sd.x, hy = sd.y - 44, q = Math.random();
    if (m.mega && q < .12) spark(sd.x + (Math.random() - .5) * 50, sd.y - Math.random() * 60, { color: '#ff9cf0', vy: -50, vx: 0, life: 500, add: true });
    if (st === 'brn' && q < .08) spark(hx + (Math.random() - .5) * 40, hy + 30, { color: '#ff7a2b', vy: -60, vx: 0, life: 600 });
    if ((st === 'psn' || st === 'tox') && q < .06) spark(hx + (Math.random() - .5) * 40, hy + 26, { color: '#b25bff', vy: -40, vx: 0, life: 800, shape: 'ring' });
    if (st === 'par' && q < .05) spark(hx + (Math.random() - .5) * 50, hy + (Math.random() - .5) * 40, { color: '#ffe04a', life: 200, vx: 0, vy: 0, shape: 'zap' });
    if (asleep && q < .015) floatText(hx + 26, hy - 10, 'z', { size: 18, color: '#e6ecff', life: 1300, vy: -.03 });
    if (m.conf > 0 && q < .2) { const a = clock.t / 180; spark(hx + Math.cos(a) * 24, hy - 26 + Math.sin(a) * 6, { color: '#ffe86b', life: 260, vx: 0, vy: 0, shape: 'plus' }); }
  }
}
function drawShot(p) {
  const R = MFX[p.mv.name]; if (R && R.shot) { try { R.shot(p); } catch (e) { console.error(e); } bctx.globalAlpha = 1; return; }
  const f = fxOf(p.mv), i = bx(p.x), j = by(p.y);
  if (Math.random() < .6) spark(p.x, p.y, { color: f.col, vx: 0, vy: 0, life: 220, add: true });
  if (p.shape === 'star') { for (let q = -3; q <= 3; q++) { aRect(i + q, j, 1, 1, '#fff59a'); aRect(i, j + q, 1, 1, '#fff59a'); } aDisc(i, j, 1, '#ffffff'); return; }
  if (p.shape === 'leaf') { const a = clock.t / 60; for (let q = -3; q <= 3; q++) aRect(i + Math.cos(a) * q, j + Math.sin(a) * q * .5, 1, 2, q ? f.col : '#e2ffc4'); return; }
  if (p.shape === 'crescent') { const a = Math.atan2(p.vy, p.vx); for (let q = -5; q <= 5; q++) { const t = q / 5 * 1.2; aRect(i + Math.cos(a + t) * 6, j + Math.sin(a + t) * 6, 2, 2, q % 2 ? f.col : '#ffffff'); } return; }
  if (p.shape === 'needle') { const a = Math.atan2(p.vy, p.vx); for (let q = 0; q < 5; q++) aRect(i - Math.cos(a) * q, j - Math.sin(a) * q, 1, 1, q ? f.col : '#ffffff'); return; }
  const r = p.shape === 'hex' ? 3 : p.burst ? 4 : 5;
  bctx.globalCompositeOperation = 'lighter'; aDisc(i, j, r + 2, f.col, .35); bctx.globalCompositeOperation = 'source-over';
  aDisc(i, j, r, f.col); aDisc(i - 1, j - 1, Math.max(1, r - 2), f.core);
}
function drawBeam(b) {
  const R = MFX[b.mv.name]; if (R && R.beam) { try { R.beam(b); } catch (e) { console.error(e); } bctx.globalAlpha = 1; return; }
  const f = fxOf(b.mv), q = b.t / b.life, grow = Math.min(1, q / .2), fade = q > .7 ? (1 - q) / .3 : 1;
  const n = Math.round(450 * grow), i0 = ax(b.x) - OX, j0 = ay(b.y) - OY, di = Math.cos(b.ang), dj = Math.sin(b.ang), w = Math.round(b.w / 2 * (1 + Math.sin(clock.t / 25) * .12));
  bctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k += 2) aRect(i0 + di * k - w, j0 + dj * k - w, w * 2, w * 2, f.col, .12 * fade);
  bctx.globalCompositeOperation = 'source-over';
  const wb = Math.max(2, Math.round(w * .9)), wc = Math.max(1, Math.round(w * .4));
  for (let k = 0; k < n; k++) aRect(i0 + di * k - wb / 2, j0 + dj * k - wb / 2, wb, wb, f.col, fade);
  for (let k = 0; k < n; k++) aRect(i0 + di * k - wc / 2, j0 + dj * k - wc / 2, wc, wc, f.core, fade);
  const nx = -dj, ny = di;
  for (let k = 0; k < n; k++) { const s = Math.sin(k / 6 - clock.t / 40) * (w + 2); aRect(i0 + di * k + nx * s, j0 + dj * k + ny * s, 1, 1, '#ffffff', fade); }
}
function drawAimLines() {
  for (const S of ['A', 'B']) { const sd = side(S), c = sd.cast; if (!c || c.mv.anim !== 'beam' || c.phase !== 'go') continue; aLine(bx(sd.x + sd.face * 18), by(sd.y - 32), bx(c.aim.x), by(c.aim.y - 32), '#ff3b4b', .75 * Math.min(1, c.t / 200), 1); }
}
function drawWorldFx() {
  for (let k = fx.length - 1; k >= 0; k--) {
    const f = fx[k], q = (clock.t - f.t0) / f.life;
    if (q >= 1) { fx.splice(k, 1); continue; } if (q < 0 || f.kind === 'text') continue;
    if (f.kind === 'ring') { const r = lerp(f.r0, f.r1, Ease.outQ(q)) / 2; aRing(bx(f.x), by(f.y), r, r * .62, f.color, 1 - q); }
    else if (f.kind === 'charge') { if (!G) continue; const sd = side(f.S), r = 13 - q * 9; aRing(bx(sd.x), by(sd.y - 40), r, r, f.color, .9); if (Math.random() < .5) { const a = Math.random() * 6.28; spark(sd.x + Math.cos(a) * 34, sd.y - 40 + Math.sin(a) * 34, { color: f.color, vx: -Math.cos(a) * 110, vy: -Math.sin(a) * 110, life: 260, add: true }); } }
    else if (f.kind === 'bolt') { let i = bx(f.x), j = 0; const tj = by(f.y); while (j < tj) { const nj = Math.min(tj, j + 9 + Math.random() * 7), ni = i + (Math.random() - .5) * 14; aLine(i, j, ni, nj, f.color, 1 - q, 3); aLine(i, j, ni, nj, '#ffffff', 1 - q, 1); i = ni; j = nj; } if (q < .1) burstAt(f.x, f.y, f.color, 4, 200, 1); }
    else if (f.kind === 'slash') { for (let s = 0; s < 3; s++) { const n = Math.round(14 * Math.min(1, q * 4)); for (let t = 0; t < n; t++) aRect(bx(f.x - 24 + s * 12 + t * 1.5), by(f.y - 26 + t * 3.6), 2, 2, t % 3 ? f.color : '#ffffff', 1 - q); } }
    else if (f.kind === 'psy') { for (let s = 0; s < 3; s++) { const qq = (q + s / 3) % 1, r = (10 + qq * 55) / 2; aRing(bx(f.x), by(f.y), r, r * .6, f.color, (1 - qq) * .9); } }
    else if (f.kind === 'aura') { bctx.globalCompositeOperation = 'lighter'; for (let r = 30; r > 0; r -= 6) aDisc(bx(f.x), by(f.y), r * (1 - q * .3), f.color, .08 * (1 - q)); bctx.globalCompositeOperation = 'source-over'; }
    else if (f.kind === 'arrows') { for (let s = 0; s < 5; s++) { const ox = f.x - 36 + s * 18, oy = f.y + (f.up ? -1 : 1) * ((q * 60 + s * 13) % 60) - 6; for (let t = 0; t < 3; t++) aRect(bx(ox) - t, by(oy) + (f.up ? t : -t), t * 2 + 1, 1, f.color, 1 - q); } }
    else if (f.kind === 'capsule') { if (!G) continue; const S = f.S, from = TRAINER_POS[S], to = side(S), x = lerp(from.x, to.x, q), y = lerp(from.y - 30, to.y - 20, q) - Math.sin(q * Math.PI) * 70, col = S === 'A' ? '#ff4b55' : '#ffc72c', i = bx(x), j = by(y); aRect(i - 3, j - 3, 6, 6, '#141a2c'); aRect(i - 2, j - 2, 4, 4, col); aRect(i - 2, j - 2, 2, 2, '#ffffff'); if (q > .92) { burstAt(to.x, to.y - 20, '#ffffff', 20, 280, 1); ringFx(to.x, to.y - 10, col, 6, 70, 400); fx.splice(k, 1); } }
  }
  for (let k = parts.length - 1; k >= 0; k--) if (!drawParticle(parts[k])) parts.splice(k, 1);
  bctx.globalAlpha = 1;
}
function drawAmbient(dt) {
  const amb = STAGE.ambient;
  if (amb === 'snow') {
    const wind = Math.sin(clock.t / 3000) * 20 + 35;
    for (const f of snow) { f.y += dt / 1000 * (13 + 23 * f.z); f.x += dt / 1000 * (wind * f.z + Math.sin(clock.t / 700 + f.p) * 6); if (f.y > ART_H) { f.y = 0; f.x = Math.random() * ART_W; } if (f.x > ART_W) f.x = 0; aRect(f.x - OX, f.y - OY, f.z > .95 ? 2 : 1, f.z > .95 ? 2 : 1, '#ffffff', .5 + f.z * .45); }
  } else if (amb === 'motes' || amb === 'sparkle' || amb === 'dust') {
    const col = amb === 'motes' ? '#ffd86a' : amb === 'sparkle' ? '#e6dcff' : '#e9e1c8';
    for (const f of snow) { f.y -= dt / 1000 * 6 * f.z; f.x += Math.sin(clock.t / 1500 + f.p) * dt / 1000 * 4; if (f.y < 0) { f.y = ART_H; f.x = Math.random() * ART_W; } const tw = amb === 'sparkle' ? (Math.sin(clock.t / 300 + f.p * 10) > .6 ? 1 : .25) : .7; aRect(f.x - OX, f.y - OY, 1, 1, col, tw * f.z); }
  } else if (amb === 'notes') {
    const px = toArtX(965), py = toArtY(90);
    for (let k = 0; k < 3; k++) { const q = ((clock.t / 2400) + k / 3) % 1, i = Math.round(px + Math.sin(q * 6 + k) * 6 - OX), j = Math.round(py - q * 40 - OY); bctx.globalAlpha = 1 - q; bctx.fillStyle = '#ffffff'; bctx.fillRect(i, j, 2, 2); bctx.fillRect(i + 1, j - 5, 1, 5); bctx.fillRect(i + 2, j - 5, 2, 1); bctx.globalAlpha = 1; }
    for (const f of snow) { f.y -= dt / 1000 * 3 * f.z; if (f.y < 0) { f.y = ART_H; f.x = Math.random() * ART_W; } aRect(f.x - OX, f.y - OY, 1, 1, '#ffffff', .18 * f.z); }
  }
}
function textAt(c, text, x, y, size, color, stroke, opts = {}) {
  c.save(); c.font = `${opts.italic ? 'italic ' : ''}${size}px ${DISPLAY_FONT()}`; c.textAlign = opts.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = Math.max(3, size / 5); c.strokeStyle = stroke; c.strokeText(text, x, y); c.fillStyle = color; c.fillText(text, x, y); c.restore();
}
function draw(dt) {
  if (!DW || !buf || !stageCanvas) return;
  runTimers(); updateCamera(dt);
  const vw = Math.min(buf.width, Math.ceil(DW / cam.pz) + 1), vh = Math.min(buf.height, Math.ceil(DH / cam.pz) + 1);
  OX = cam.left; OY = cam.top;
  if (clock.t < shakeState.until) { OX += Math.round((Math.random() - .5) * shakeState.amp / 2); OY += Math.round((Math.random() - .5) * shakeState.amp / 2); } else shakeState.amp = 0;
  const b = bctx; b.setTransform(1, 0, 0, 1, 0, 0); b.imageSmoothingEnabled = false;
  b.fillStyle = '#05070d'; b.fillRect(0, 0, buf.width, buf.height);
  b.drawImage(stageCanvas, -OX, -OY);
  animateStage(b, OX, OY, clock.t);
  b.drawImage(scarCanvas, -OX, -OY);
  if (G) {
    for (const mk of G.marks) { const RM = MFX[mk.mv.name]; if (RM && RM.markDraw) { try { RM.markDraw(mk, mk.t / mk.delay); } catch (e) { console.error(e); } bctx.globalAlpha = 1; bctx.globalCompositeOperation = 'source-over'; continue; } const q = mk.t / mk.delay, col = fxOf(mk.mv).col, i = bx(mk.x), j = by(mk.y), r = mk.r / 2; aEllFill(i, j, r, r * .6, col, .12 + q * .14); aRing(i, j, r, r * .6, col, .9); aRing(i, j, r * q, r * q * .6, '#ffffff', .8);
      if (mk.kind === 'sky' && q > .45) { const fall = (q - .45) / .55; for (let s = 0; s < 4; s++) aDisc(bx(mk.x + (s - 1.5) * 22), by(lerp(mk.y - 300, mk.y - 10, fall) - s * 18), mk.mv.type === 'Rock' ? 3 : 2, s % 2 ? col : fxOf(mk.mv).core); } }
    for (const w of G.waves) { const RW = MFX[w.mv.name]; if (RW && RW.wave) { try { RW.wave(w); } catch (e) { console.error(e); } bctx.globalAlpha = 1; continue; } const col = fxOf(w.mv).col, r = w.r / 2; aRing(bx(w.x), by(w.y), r, r * .62, col, .95, 2); aRing(bx(w.x), by(w.y), r - 2, r * .62 - 1, '#ffffff', .6); if (w.kind === 'quake' && Math.random() < .5) { const a = Math.random() * 6.28; spark(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * .62, { color: '#a08a66', vy: -90, vx: 0, g: 300, life: 380 }); } }
  }
  drawCrowd();
  drawTrainer('A'); drawTrainer('B');
  const order = G ? ['A', 'B'].sort((p, q) => side(p).y - side(q).y) : [];
  if (G) { drawAimLines(); for (const S of order) drawActorGround(S); }
  drawEnts(true);
  const c = sctx; c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = '#05070d'; c.fillRect(0, 0, DW, DH);
  c.drawImage(buf, 0, 0, vw, vh, 0, 0, vw * cam.pz, vh * cam.pz);
  if (dimState.a > 0) { const over = clock.t - dimState.until, f = over > 0 ? 1 - over / 400 : 1; if (f <= 0) dimState.a = 0; else { c.fillStyle = `rgba(${dimState.col},${(dimState.a * f).toFixed(3)})`; c.fillRect(0, 0, DW, DH); } }
  for (const S of order) drawActorSprite(S);
  // effects layer above the sprites
  bctx = fctx; bctx.clearRect(0, 0, fbuf.width, fbuf.height);
  if (G) { for (const p of G.shots) drawShot(p); for (const bm of G.beams) drawBeam(bm); }
  drawEnts(false);
  drawWorldFx();
  drawAmbient(dt);
  bctx = gctx;
  c.drawImage(fbuf, 0, 0, vw, vh, 0, 0, vw * cam.pz, vh * cam.pz);
  if (STAGE.ambient === 'snow') { lightning.next -= dt; if (lightning.next <= 0) { lightning.a = REDUCED ? .1 : .3; lightning.next = 8000 + Math.random() * 9000; } }
  if (lightning.a > 0) { c.fillStyle = `rgba(230,240,255,${lightning.a})`; c.fillRect(0, 0, DW, DH); lightning.a = Math.max(0, lightning.a - dt / 600); }
  if (flash.a > 0) { c.globalAlpha = flash.a; c.fillStyle = flash.color; c.fillRect(0, 0, DW, DH); c.globalAlpha = 1; flash.a = Math.max(0, flash.a - dt / 300); }
  const zs = cam.pz / 2;
  for (const f of fx) {
    if (f.kind !== 'text') continue; const q = (clock.t - f.t0) / f.life; if (q < 0 || q >= 1) continue;
    const pop = q < .12 ? .6 + q / .12 * .55 : q < .2 ? 1.15 - (q - .12) / .08 * .15 : 1;
    c.save(); c.globalAlpha = q > .75 ? (1 - q) / .25 : 1; c.translate(Math.round(toScreenX(f.x)), Math.round(toScreenY(f.y + f.vy * (clock.t - f.t0)))); c.scale(pop, pop);
    textAt(c, f.text, 0, 0, Math.round(f.size * zs), f.color, f.stroke, { italic: f.italic }); c.restore();
  }
  for (let k = screenFx.length - 1; k >= 0; k--) {
    const f = screenFx[k], q = (clock.t - f.t0) / f.life; if (q >= 1) { screenFx.splice(k, 1); continue; }
    if (f.kind === 'call') { c.save(); c.globalAlpha = q > .8 ? (1 - q) / .2 : 1; textAt(c, f.text, toScreenX(f.x), toScreenY(f.y), Math.round(15 * zs), '#ff6b8a', '#2a0a14', { italic: true, align: f.align }); c.restore(); }
  }
  const unit = DH / 560;
  if (banner.text && clock.t - banner.t < 1500) { const q = (clock.t - banner.t) / 1500; c.save(); c.globalAlpha = q > .8 ? (1 - q) / .2 : 1; textAt(c, banner.text, DW / 2, DH * .3 - Math.min(1, q * 6) * 6 * unit, Math.round(19 * unit), banner.color, '#2a1206', { italic: true }); c.restore(); }
  if (bigText.text && clock.t - bigText.t < bigText.life) {
    const q = (clock.t - bigText.t) / bigText.life, sc = q < .15 ? Ease.outBack(q / .15) : 1, fs = Math.min(DW / (bigText.text.length > 14 ? 16 : 7), 76 * unit);
    c.save(); c.globalAlpha = q > .8 ? (1 - q) / .2 : 1; c.translate(DW / 2, DH * .42); c.rotate(-.05); c.scale(sc, sc); textAt(c, bigText.text, 0, 0, fs, bigText.color, '#2a1a0a', { italic: true }); c.restore();
  }
  if (slide.text && clock.t - slide.t < 1700) {
    const q = (clock.t - slide.t) / 1700, x = q < .2 ? lerp(DW * 1.3, DW / 2, Ease.outQ(q / .2)) : q > .8 ? lerp(DW / 2, -DW * .3, Ease.inQ((q - .8) / .2)) : DW / 2;
    textAt(c, slide.text, x, DH * .58, Math.round(40 * unit), '#ffe9b0', '#2a1a0a', { italic: true });
  }
}
function updateParts(dt) { const k = dt / 1000; for (const q of parts) { q.t += dt; if (q.drag) { const d = Math.max(0, 1 - q.drag * k); q.vx *= d; q.vy *= d; } q.x += q.vx * k; q.y += q.vy * k; q.vy += q.g * k; if (q.spin) q.rot += q.spin * k; } }
