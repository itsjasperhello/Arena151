/* =====================================================================
   Section 16: send-out sounds, battle cries and the start countdown
   Every time a Pokémon comes out: a ball-opening sound, then its cry
   from cry/<name>.mp3 (same names as the sprites, e.g. pikachu.mp3,
   mr-mime.mp3). Sounds never overlap: they play one after another,
   and when both sides send out at once Red goes first.
   A battle starts only after both opening cries, then 3 · 2 · 1 · GO!
   ===================================================================== */
const SENDOUT_SFX = [T('square', 1200, 600, .04, .22), N(1500, 5200, .28, .26), T('sine', 1500, 2400, .16, .14, { at: .08 }), T('triangle', 2400, 3300, .22, .09, { at: .16 }), T('sine', 3300, 3300, .25, .05, { at: .3, v: [18, 80] })];
const CD_SFX = { tick: [T('square', 660, 660, .14, .2), T('sine', 1320, 1320, .14, .06)], go: [T('square', 990, 990, .4, .2), T('square', 1320, 1320, .4, .14, { at: .02 }), N(4000, 8000, .35, .1, { ft: 'highpass' })] };
const CRY_MISSING = new Set();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function pausableSleep(ms) { let left = ms, last = performance.now(); while (left > 0) { await sleep(Math.min(30, left)); const now = performance.now(); if (!clock.paused) left -= now - last; last = now; } }   // real elapsed time, frozen while paused

// Plays one Pokémon's cry and resolves when it has finished (or straight away if there is no file).
function playCry(name) {
  name = pickBase(name);
  const file = spriteSlug(name) + '.mp3', vol = (window.SETTINGS && SETTINGS.sfxVol != null) ? SETTINGS.sfxVol : .7;
  if (CRY_MISSING.has(file) || vol === 0) return Promise.resolve(false);
  if (location.protocol !== 'file:' && typeof loadBuffer === 'function' && audioCtx()) {             // Web Audio: mixes with other apps
    const ctx = audioCtx(); if (ctx.state === 'suspended') ctx.resume();
    return loadBuffer('cry/' + encodeURIComponent(file)).then(buf => new Promise(res => {
      const src = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = Math.min(1, vol * 1.1); src.buffer = buf; src.connect(g); g.connect(ctx.destination);
      let done = false; const end = () => { if (done) return; done = true; clearTimeout(cap); try { src.stop(); } catch (e) { } res(true); };
      const cap = setTimeout(end, 4500); src.onended = end; src.start();
    })).catch(() => { CRY_MISSING.add(file); return false; });
  }
  return new Promise(res => {
    const a = new Audio('cry/' + encodeURIComponent(file)); a.volume = Math.min(1, vol * 1.1);
    let done = false; const end = ok => { if (done) return; done = true; clearTimeout(cap); a.pause(); res(ok); };
    const cap = setTimeout(() => end(true), 4500);                                  // very long files are cut off
    a.addEventListener('ended', () => end(true)); a.addEventListener('error', () => { CRY_MISSING.add(file); end(false); });
    a.play().catch(() => end(false));
  });
}
// One send-out: the ball sound, a beat, then the cry (or a short pause if there is no cry file).
async function announce(S, name) {
  playSfx(SENDOUT_SFX, side(S) ? side(S).x : 500);
  await sleep(420);
  const had = await playCry(name);
  await sleep(had ? 120 : 380);
}
// Serial queue: send-outs in the same moment are sorted so Red's plays first.
let SOUNDQ = Promise.resolve(), PENDING = [], FLUSH = null; const SENDOUT_DONE = { A: Promise.resolve(), B: Promise.resolve() };
function queueSendOut(S, name) {
  let resolve; const p = new Promise(r => (resolve = r)); SENDOUT_DONE[S] = p;
  PENDING.push({ S, name, resolve });
  if (!FLUSH) FLUSH = setTimeout(() => {
    const batch = PENDING.sort((a, b) => a.S.localeCompare(b.S)); PENDING = []; FLUSH = null;
    for (const item of batch) SOUNDQ = SOUNDQ.then(() => announce(item.S, item.name)).catch(() => { }).then(item.resolve);
  }, 0);
}
const sendOutDone = async S => { await sleep(5); return SENDOUT_DONE[S]; };
function hookSendOut() {
  if (hookSendOut.done || typeof VFX === 'undefined') return; hookSendOut.done = true;
  const base = VFX.sendOut;
  VFX.sendOut = function (S) { try { const m = act(S); if (m) queueSendOut(S, m.name); } catch (e) { } return base.apply(this, arguments); };
}
setTimeout(hookSendOut, 0);

/* ---------- countdown: 3 · 2 · 1 · GO! ---------- */
(function countdownUi() {
  const st = document.createElement('style');
  st.textContent = `#countdown{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:8}
#countdown span{font-family:var(--display);font-size:clamp(90px,16vw,190px);line-height:1;color:#fff;-webkit-text-stroke:4px #1a1440;
  text-shadow:0 8px 0 #1a1440,0 0 40px rgba(120,160,255,.7);animation:cdPop .7s ease-out both}
#countdown span.go{color:#ffd84a;-webkit-text-stroke:4px #4a1a0c;text-shadow:0 8px 0 #4a1a0c,0 0 50px rgba(255,190,60,.9);animation:cdPop .45s ease-out both,cdFlash .16s steps(2) .2s 5}
@keyframes cdPop{0%{transform:scale(2.2);opacity:0}25%{transform:scale(.92);opacity:1}40%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
@keyframes cdFlash{50%{color:#fff;-webkit-text-stroke-color:#b3471b}}
@media (prefers-reduced-motion:reduce){#countdown span,#countdown span.go{animation:none}}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'countdown'; el.setAttribute('aria-live', 'assertive'); scene.parentElement.appendChild(el);
})();
async function battleCountdown(my) {
  const el = $('countdown'), pr = el.parentElement.getBoundingClientRect(), sr = scene.getBoundingClientRect();   // centre on the arena itself
  Object.assign(el.style, { inset: 'auto', left: (sr.left - pr.left) + 'px', top: (sr.top - pr.top) + 'px', width: sr.width + 'px', height: sr.height + 'px' });
  for (const n of ['3', '2', '1']) { if (my !== epoch) { el.innerHTML = ''; return; } el.innerHTML = `<span>${n}</span>`; playSfx(CD_SFX.tick, 500); await pausableSleep(700); }
  if (my !== epoch) { el.innerHTML = ''; return; }
  el.innerHTML = '<span class="go">GO!</span>'; playSfx(CD_SFX.go, 500);
  setTimeout(() => { if (el.firstChild && el.firstChild.classList.contains('go')) el.innerHTML = ''; }, 1250);
}
