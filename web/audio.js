/* =====================================================================
   Section 14: sound effects and stage music
   Every move has its own synthesized sound (no audio files needed): a
   launch cue when it fires and an impact cue when it lands. Each recipe
   is a few layers of tone or filtered noise with sweeps, wobble, repeats
   and delays, tuned to that move.
   Music: put  <Stage_Name>.mp3  (spaces as underscores) in the "music"
   folder; Opening.mp3 (optional) plays on the start screen.
   ===================================================================== */
let AC = null, SFX_OUT = null, NOISE = null, VOICES = 0;
function audioCtx() {
  if (AC) return AC;
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
  AC = new C(); SFX_OUT = AC.createGain(); SFX_OUT.connect(AC.destination); setSfxVolume();
  const len = AC.sampleRate * 2, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; NOISE = buf;
  return AC;
}
const setSfxVolume = () => { if (SFX_OUT) SFX_OUT.gain.value = 0.9 * ((window.SETTINGS && SETTINGS.sfxVol != null) ? SETTINGS.sfxVol : .7); };
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { const c = audioCtx(); if (c && c.state === 'suspended') c.resume(); }, { passive: true }));

// Layer builders. T: tone (wave, start Hz, end Hz, seconds, gain). N: filtered noise (filter start Hz, end Hz, seconds, gain).
// Options: at delay · a attack · r repeats · ri repeat gap · j random pitch spread · v [wobble rate, depth Hz] · ft filter type · fq tone filter Hz · q filter Q
const T = (o, f0, f1, d, g, x = {}) => ({ o, f: [f0, f1], d, g, ...x });
const N = (f0, f1, d, g, x = {}) => ({ o: 'noise', f: [f0, f1], d, g, ...x });
function playLayer(L, t0, vol, pan) {
  const c = AC, reps = L.r || 1;
  for (let k = 0; k < reps; k++) {
    if (VOICES > 56) return;
    const start = t0 + (L.at || 0) + k * (L.ri || 0), end = start + L.d, jit = 1 + (L.j ? (Math.random() * 2 - 1) * L.j : 0);
    const f0 = Math.max(20, L.f[0] * jit), f1 = Math.max(20, L.f[1] * jit), g = c.createGain(), att = Math.min(L.a != null ? L.a : .008, L.d * .5);
    g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(Math.max(.0002, L.g * vol), start + att); g.gain.exponentialRampToValueAtTime(0.0001, end);
    let src, tail = g, mod = null;
    if (L.o === 'noise') {
      src = c.createBufferSource(); src.buffer = NOISE; src.loop = true;
      const fl = c.createBiquadFilter(); fl.type = L.ft || 'bandpass'; fl.Q.value = L.q != null ? L.q : (fl.type === 'bandpass' ? 1.2 : .7);
      fl.frequency.setValueAtTime(f0, start); fl.frequency.exponentialRampToValueAtTime(f1, end); src.connect(fl); fl.connect(g); mod = fl.frequency;
      src.start(start, Math.random() * 1.5);
    } else {
      src = c.createOscillator(); src.type = L.o; src.frequency.setValueAtTime(f0, start); src.frequency.exponentialRampToValueAtTime(f1, end); mod = src.frequency;
      if (L.fq) { const fl = c.createBiquadFilter(); fl.type = L.ft || 'lowpass'; fl.frequency.value = L.fq; fl.Q.value = L.q || .8; src.connect(fl); fl.connect(g); } else src.connect(g);
      src.start(start);
    }
    if (L.v) { const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = L.v[0]; lg.gain.value = L.v[1]; lfo.connect(lg); lg.connect(mod); lfo.start(start); lfo.stop(end + .05); }
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; tail.connect(p); p.connect(SFX_OUT); } else tail.connect(SFX_OUT);
    src.stop(end + .05); VOICES++; src.onended = () => { VOICES--; };
  }
}
function playSfx(layers, x, vol = 1) {
  if (!layers || !layers.length || (window.SETTINGS && SETTINGS.sfxVol === 0)) return;
  const c = audioCtx(); if (!c || c.state !== 'running') return;
  const pan = Math.max(-.8, Math.min(.8, ((x == null ? 500 : x) - 500) / 650)), t0 = c.currentTime + .01;
  for (const L of layers) playLayer(L, t0, vol, pan);
}

/* ---------- one recipe per move: c = launch, h = impact ---------- */
const MOVE_SFX = {
  // Normal
  'Tackle': { c: [N(800, 300, .12, .25, { ft: 'lowpass' })], h: [T('sine', 160, 60, .18, .6), N(2000, 500, .06, .3)] },
  'Quick Attack': { c: [N(3000, 6000, .15, .25, { ft: 'highpass' }), T('triangle', 900, 1800, .08, .15)], h: [T('square', 1200, 600, .05, .2), N(4000, 2000, .05, .2)] },
  'Extreme Speed': { c: [T('sawtooth', 400, 3200, .25, .2, { fq: 4000 }), N(6000, 9000, .3, .2, { ft: 'highpass' })], h: [T('square', 1500, 900, .04, .18, { r: 5, ri: .07 })] },
  'Body Slam': { c: [T('sine', 90, 180, .3, .25)], h: [T('sine', 120, 40, .4, .8), N(500, 120, .35, .5, { ft: 'lowpass' })] },
  'Headbutt': { c: [N(600, 1200, .1, .15)], h: [T('triangle', 300, 100, .15, .5), T('sine', 1500, 1500, .3, .12, { at: .05, v: [14, 40] })] },
  'Slash': { c: [N(2500, 4000, .08, .2, { ft: 'highpass' })], h: [N(6000, 2500, .12, .35, { q: 3, r: 3, ri: .055 })] },
  'Double-Edge': { c: [N(400, 900, .35, .25, { ft: 'lowpass' })], h: [T('sine', 100, 35, .5, .8), N(1200, 200, .4, .45, { ft: 'lowpass' }), T('square', 220, 110, .2, .15, { at: .12 })] },
  'Swift': { c: [T('sine', 1600, 2400, .07, .18, { r: 4, ri: .06 }), T('triangle', 2400, 3200, .3, .1, { v: [20, 60] })], h: [T('sine', 3000, 4200, .12, .15, { r: 3, ri: .05 })] },
  'Hyper Beam': { c: [T('sawtooth', 80, 400, 1, .25, { fq: 1200 }), T('square', 55, 55, 1.2, .18, { at: .6, v: [8, 6] }), N(800, 2000, 1, .25, { at: .6 })], h: [T('sine', 90, 25, .9, .9), N(1500, 80, 1, .6, { ft: 'lowpass' })] },
  'Swords Dance': { c: [T('triangle', 800, 1600, .12, .18, { r: 6, ri: .12 }), N(7000, 9000, .1, .12, { ft: 'highpass', r: 6, ri: .12 })] },
  'Harden': { c: [T('square', 300, 300, .06, .2, { r: 3, ri: .16 }), T('sine', 1800, 1800, .4, .08, { at: .35 })] },
  'Recover': { c: [T('sine', 523, 523, .25, .15), T('sine', 659, 659, .25, .14, { at: .12 }), T('sine', 784, 784, .25, .13, { at: .24 }), T('sine', 1046, 1046, .5, .12, { at: .36 }), N(5000, 8000, .8, .06, { ft: 'highpass' })] },
  'Splash': { c: [N(1200, 600, .15, .3, { r: 3, ri: .26 }), T('sine', 600, 300, .08, .15, { r: 3, ri: .26 })] },
  // Fire
  'Ember': { c: [N(1500, 3000, .25, .2), T('sawtooth', 200, 400, .1, .08)], h: [N(2500, 800, .2, .25, { q: 2 })] },
  'Flamethrower': { c: [N(900, 1400, 1, .35, { ft: 'lowpass', v: [12, 300] }), T('sawtooth', 70, 90, 1, .08, { fq: 300 })], h: [N(1800, 500, .4, .3)] },
  'Fire Blast': { c: [N(600, 1500, .35, .3, { ft: 'lowpass' }), T('sawtooth', 100, 300, .35, .1)], h: [T('sine', 80, 30, .7, .8), N(2500, 150, .8, .6, { ft: 'lowpass' }), N(3000, 3000, .6, .15, { at: .1, ft: 'highpass' })] },
  'Fire Punch': { c: [N(2000, 3500, .2, .18, { ft: 'highpass' })], h: [T('sine', 150, 60, .2, .6), N(1600, 400, .35, .35)] },
  'Flare Blitz': { c: [N(500, 2500, .45, .35, { ft: 'lowpass' }), T('sawtooth', 90, 250, .45, .12)], h: [T('sine', 70, 25, .8, .9), N(3000, 200, .9, .6, { ft: 'lowpass' }), T('square', 300, 80, .3, .15)] },
  'Will-O-Wisp': { c: [T('sine', 300, 600, .8, .15, { v: [5, 80] }), T('triangle', 900, 700, .8, .06, { v: [7, 30] })], h: [N(700, 1800, .4, .18, { q: 4 })] },
  // Water
  'Water Gun': { c: [N(2500, 1500, .3, .22, { q: 2 })], h: [N(1200, 500, .2, .3), T('sine', 800, 300, .06, .15)] },
  'Bubble Beam': { c: [T('sine', 400, 1200, .05, .18, { r: 7, ri: .05, j: .4 })], h: [T('sine', 1500, 600, .04, .15, { r: 5, ri: .05, j: .3 })] },
  'Surf': { c: [N(300, 900, 1.2, .35, { ft: 'lowpass', v: [.8, 250] }), N(3000, 5000, 1, .1, { ft: 'highpass', at: .2 })], h: [N(1000, 300, .6, .4, { ft: 'lowpass' })] },
  'Hydro Pump': { c: [N(1200, 2200, 1, .4, { q: 1.5, v: [18, 400] }), T('sine', 60, 70, 1, .12)], h: [N(900, 250, .6, .45, { ft: 'lowpass' }), T('sine', 500, 180, .15, .2)] },
  'Scald': { c: [N(3000, 4500, .9, .25, { ft: 'highpass' }), N(1000, 1500, .9, .2, { q: 2 })], h: [N(5000, 3000, .6, .25, { ft: 'highpass' })] },
  'Aqua Jet': { c: [N(1500, 4000, .3, .3, { q: 2 })], h: [N(800, 300, .25, .35), T('sine', 400, 150, .1, .25)] },
  'Waterfall': { c: [N(400, 1200, .4, .3, { ft: 'lowpass' })], h: [N(200, 800, .7, .5, { ft: 'lowpass' }), T('sine', 100, 50, .4, .5)] },
  'Crabhammer': { c: [T('square', 200, 250, .1, .12)], h: [T('sine', 140, 45, .4, .8), N(900, 300, .5, .45), T('square', 600, 300, .05, .2, { r: 2, ri: .07 })] },
  // Grass
  'Vine Whip': { c: [N(3000, 6000, .15, .25, { ft: 'highpass', r: 2, ri: .12 })], h: [N(4500, 2000, .05, .45, { q: 2, r: 2, ri: .12 })] },
  'Razor Leaf': { c: [T('triangle', 2000, 1400, .08, .12, { r: 4, ri: .06, j: .2 }), N(5000, 7000, .3, .12, { ft: 'highpass' })], h: [N(6000, 3000, .06, .2, { q: 3, r: 2, ri: .05 })] },
  'Seed Bomb': { c: [T('sine', 600, 300, .2, .2)], h: [T('sine', 200, 60, .25, .6), N(1500, 400, .3, .35), T('triangle', 1200, 900, .05, .1, { r: 3, ri: .04, at: .1 })] },
  'Giga Drain': { c: [T('sine', 300, 900, .4, .15, { v: [9, 40] })], h: [T('sine', 1200, 400, .6, .18, { v: [12, 60] }), T('triangle', 800, 1600, .5, .1, { at: .2 })] },
  'Energy Ball': { c: [T('sine', 200, 500, .3, .2, { v: [15, 30] }), T('triangle', 600, 600, .3, .08)], h: [T('sine', 300, 80, .35, .5), T('triangle', 900, 1800, .25, .12)] },
  'Leaf Storm': { c: [N(2000, 4000, 1, .3, { q: 1.5, v: [3, 1200] }), T('triangle', 1500, 2200, .08, .06, { r: 8, ri: .1, j: .3 })], h: [N(4000, 1500, .6, .3, { q: 2 })] },
  'Sleep Powder': { c: [N(6000, 4000, .9, .08, { ft: 'highpass' }), T('sine', 880, 660, .9, .12, { v: [4, 15] }), T('sine', 660, 523, .6, .08, { at: .4 })] },
  'Stun Spore': { c: [N(5000, 6000, .7, .1, { ft: 'highpass' }), T('square', 3000, 3000, .03, .06, { r: 6, ri: .1, j: .5 })] },
  // Electric
  'Thunder Shock': { c: [T('square', 800, 1600, .15, .12, { v: [60, 300] })], h: [N(4000, 2000, .2, .3, { q: 3 }), T('square', 1200, 400, .12, .15, { v: [80, 200] })] },
  'Thunderbolt': { c: [T('sawtooth', 300, 1200, .5, .12, { v: [45, 200] })], h: [N(3000, 600, .6, .6, { ft: 'lowpass' }), T('square', 2000, 200, .3, .2, { v: [90, 500] }), T('sine', 60, 30, .6, .5)] },
  'Thunder': { c: [T('sine', 45, 40, 1.2, .25), N(200, 300, 1.2, .2, { ft: 'lowpass' })], h: [N(5000, 200, 1.2, .8, { ft: 'lowpass' }), T('sine', 55, 25, 1.3, .8), T('square', 1800, 300, .25, .25, { v: [120, 800] })] },
  'Thunder Punch': { c: [T('square', 1500, 2500, .2, .08, { v: [70, 300] })], h: [T('sine', 150, 60, .2, .6), N(3500, 1500, .25, .35, { q: 3 }), T('square', 2500, 800, .15, .12, { v: [100, 600] })] },
  'Volt Tackle': { c: [T('sawtooth', 200, 900, .6, .15, { v: [40, 250] }), N(3000, 6000, .6, .15, { ft: 'highpass' })], h: [T('sine', 90, 30, .6, .8), N(4000, 400, .7, .55, { ft: 'lowpass' }), T('square', 3000, 300, .3, .2, { v: [120, 700] })] },
  'Thunder Wave': { c: [T('sine', 2000, 2000, .7, .12, { v: [30, 800] }), T('square', 220, 230, .7, .06)] },
  // Ice
  'Ice Shard': { c: [T('triangle', 3000, 4500, .12, .15)], h: [T('sine', 5000, 2500, .15, .2, { r: 3, ri: .04, j: .3 }), N(8000, 6000, .15, .15, { ft: 'highpass' })] },
  'Ice Punch': { c: [T('sine', 2600, 3200, .15, .08)], h: [T('sine', 150, 60, .2, .55), T('triangle', 3500, 2000, .3, .15, { r: 2, ri: .06 }), N(7000, 5000, .3, .15, { ft: 'highpass' })] },
  'Aurora Beam': { c: [T('sine', 600, 900, 1, .12, { v: [6, 40] }), T('sine', 900, 1350, 1, .08, { v: [5, 50] }), T('sine', 1200, 1800, 1, .06, { v: [7, 60] })], h: [T('triangle', 2000, 3000, .4, .12, { r: 3, ri: .08 })] },
  'Ice Beam': { c: [T('sine', 1800, 2400, 1, .12, { v: [25, 80] }), N(7000, 9000, 1, .12, { ft: 'highpass' })], h: [T('triangle', 4000, 1800, .4, .2, { r: 4, ri: .05, j: .2 }), N(6000, 3000, .5, .2, { q: 2 })] },
  'Blizzard': { c: [N(600, 2500, 1.4, .35, { q: .8, v: [1.5, 900] }), N(6000, 8000, 1.4, .12, { ft: 'highpass' })], h: [N(3000, 1000, .6, .3), T('triangle', 3000, 2000, .2, .1, { r: 3, ri: .07 })] },
  // Fighting
  'Mach Punch': { c: [N(3000, 7000, .1, .25, { ft: 'highpass' })], h: [T('sine', 200, 80, .12, .6), N(2500, 1200, .1, .35)] },
  'Karate Chop': { c: [N(4000, 2000, .1, .22, { ft: 'highpass' })], h: [T('square', 400, 150, .08, .3), T('sine', 180, 70, .18, .55)] },
  'Brick Break': { c: [N(1500, 2500, .15, .2)], h: [T('sine', 160, 60, .2, .6), N(2500, 800, .4, .45, { q: 1 }), T('triangle', 800, 500, .05, .15, { r: 4, ri: .06, j: .4, at: .08 })] },
  'Cross Chop': { c: [N(3000, 5000, .15, .22, { ft: 'highpass', r: 2, ri: .08 })], h: [T('sine', 140, 50, .3, .7), N(2000, 600, .3, .4), T('square', 300, 120, .1, .2, { at: .05 })] },
  'Close Combat': { c: [N(800, 1600, .2, .2)], h: [T('sine', 180, 70, .08, .55, { r: 7, ri: .075, j: .2 }), N(2500, 1000, .06, .3, { r: 7, ri: .075 }), T('sine', 100, 35, .4, .7, { at: .56 })] },
  'Aura Sphere': { c: [T('sine', 250, 500, .5, .18, { v: [10, 60] }), T('triangle', 750, 1500, .5, .08)], h: [T('sine', 120, 40, .5, .7), T('sine', 600, 300, .35, .2, { v: [20, 50] })] },
  'Bulk Up': { c: [T('sawtooth', 90, 140, .5, .15, { fq: 600 }), T('sine', 70, 110, .5, .2, { r: 2, ri: .25 })] },
  // Poison
  'Poison Sting': { c: [N(6000, 8000, .08, .2, { ft: 'highpass' })], h: [T('square', 1800, 900, .05, .15), T('sine', 400, 300, .15, .08, { at: .04, v: [20, 40] })] },
  'Poison Jab': { c: [T('sawtooth', 300, 600, .12, .1)], h: [T('sine', 200, 80, .15, .5), T('sine', 300, 180, .3, .15, { v: [15, 60], at: .05 })] },
  'Sludge Bomb': { c: [T('sine', 150, 90, .3, .25, { v: [8, 25] })], h: [N(600, 200, .4, .45, { ft: 'lowpass' }), T('sine', 220, 120, .08, .18, { r: 4, ri: .09, j: .4, at: .15 })] },
  'Gunk Shot': { c: [T('sine', 120, 70, .4, .3, { v: [6, 20] }), N(400, 700, .4, .15, { ft: 'lowpass' })], h: [N(500, 100, .7, .6, { ft: 'lowpass' }), T('sine', 90, 30, .5, .6), T('sine', 300, 160, .07, .15, { r: 6, ri: .1, j: .5, at: .3 })] },
  'Toxic': { c: [T('sine', 260, 200, .8, .15, { v: [6, 40] }), T('sine', 180, 150, .8, .12, { v: [4, 30] }), T('sine', 400, 250, .06, .12, { r: 5, ri: .14, j: .4, at: .2 })] },
  'Acid Armor': { c: [T('sine', 200, 90, .9, .2, { v: [3, 40] }), N(500, 300, .9, .15, { ft: 'lowpass' })] },
  // Ground
  'Mud Shot': { c: [N(500, 900, .2, .25, { ft: 'lowpass' })], h: [N(700, 200, .3, .45, { ft: 'lowpass' }), T('sine', 150, 70, .12, .25)] },
  'Dig': { c: [N(300, 600, .4, .35, { ft: 'lowpass', r: 2, ri: .2 })], h: [T('sine', 70, 30, .6, .85), N(700, 100, .7, .6, { ft: 'lowpass' })] },
  'Drill Run': { c: [T('sawtooth', 300, 900, .5, .12, { v: [40, 80], fq: 2000 }), N(1500, 2500, .5, .15)], h: [T('sawtooth', 900, 400, .3, .15, { v: [60, 120] }), N(2000, 700, .3, .35)] },
  'Earth Power': { c: [T('sine', 40, 50, .8, .35)], h: [T('sine', 60, 25, .8, .8), N(900, 150, .9, .55, { ft: 'lowpass' }), T('sawtooth', 80, 40, .5, .15, { fq: 300 })] },
  'Earthquake': { c: [T('sine', 35, 30, 1.4, .6, { v: [9, 6] }), N(200, 120, 1.4, .5, { ft: 'lowpass', v: [7, 60] })], h: [T('sine', 60, 30, .4, .5)] },
  // Flying
  'Peck': { c: [N(5000, 6000, .05, .1)], h: [T('square', 2200, 1600, .03, .2, { r: 3, ri: .07 })] },
  'Wing Attack': { c: [N(900, 1600, .18, .25, { q: 1.5, r: 2, ri: .14 })], h: [T('sine', 260, 110, .12, .4), N(2500, 1200, .12, .3)] },
  'Aerial Ace': { c: [N(5000, 9000, .12, .25, { ft: 'highpass' })], h: [N(7000, 3000, .1, .35, { q: 4 }), T('sine', 3500, 3500, .35, .08, { at: .05 })] },
  'Air Slash': { c: [N(2500, 5000, .25, .3, { q: 3, v: [25, 800] })], h: [N(4500, 2000, .1, .3, { q: 3, r: 2, ri: .06 })] },
  'Drill Peck': { c: [T('square', 1200, 2000, .3, .1, { v: [45, 150] })], h: [T('square', 2500, 1500, .25, .15, { v: [70, 300] }), T('sine', 220, 90, .12, .4)] },
  'Brave Bird': { c: [N(1200, 3500, .4, .3, { q: 1 }), T('sawtooth', 400, 900, .4, .1, { v: [10, 60] })], h: [T('sine', 110, 35, .6, .8), N(3000, 300, .6, .55, { ft: 'lowpass' })] },
  'Hurricane': { c: [N(300, 1800, 1.4, .4, { q: .7, v: [2, 900] }), N(2000, 3000, 1.4, .12, { q: 3, v: [5, 1500] })], h: [N(1500, 500, .5, .3)] },
  // Psychic
  'Confusion': { c: [T('triangle', 900, 1300, .2, .08)], h: [T('sine', 500, 700, .6, .15, { v: [11, 120] }), T('sine', 750, 500, .6, .1, { v: [9, 90] })] },
  'Psybeam': { c: [T('sine', 400, 800, .9, .12, { v: [17, 200] }), T('square', 800, 820, .9, .04, { fq: 1500 })], h: [T('sine', 1600, 600, .3, .15, { v: [25, 300] })] },
  'Psychic': { c: [T('sine', 220, 330, .6, .15, { v: [6, 20] })], h: [T('sine', 300, 900, .5, .2, { v: [30, 150] }), T('sine', 150, 60, .4, .5, { at: .3 })] },
  'Zen Headbutt': { c: [T('sine', 440, 880, .3, .14), T('sine', 660, 1320, .3, .08)], h: [T('sine', 150, 50, .25, .6), T('sine', 1760, 1760, .6, .1, { at: .05, v: [6, 10] })] },
  'Calm Mind': { c: [T('sine', 392, 392, 1.2, .12), T('sine', 588, 588, 1.2, .08, { at: .15 }), T('sine', 784, 784, 1, .06, { at: .3 })] },
  'Agility': { c: [N(5000, 9000, .12, .22, { ft: 'highpass', r: 5, ri: .09 }), T('triangle', 1200, 2400, .5, .06)] },
  'Amnesia': { c: [T('sine', 600, 300, .4, .15, { v: [3, 30] }), T('triangle', 300, 600, .4, .08, { at: .45 })] },
  'Hypnosis': { c: [T('sine', 330, 330, 1, .12, { v: [3, 25] }), T('sine', 415, 415, 1, .1, { v: [3.5, 25] }), T('sine', 494, 494, 1, .07, { v: [4, 25] })] },
  'Rest': { c: [T('sine', 392, 262, .8, .15), T('sine', 196, 131, .9, .12, { at: .3 }), N(500, 300, 1.2, .06, { ft: 'lowpass', at: .6, v: [.8, 200] })] },
  // Bug
  'Bug Bite': { c: [T('square', 300, 320, .15, .06, { v: [40, 30] })], h: [T('square', 900, 500, .04, .2, { r: 2, ri: .07 }), T('sine', 220, 100, .1, .4)] },
  'X-Scissor': { c: [T('triangle', 1800, 2200, .1, .12)], h: [N(5000, 2500, .08, .35, { q: 3 }), N(5500, 2800, .08, .35, { q: 3, at: .11 }), T('triangle', 3200, 3200, .3, .08, { at: .16 })] },
  'Leech Life': { c: [T('square', 500, 700, .2, .08, { v: [30, 40] })], h: [T('sine', 800, 300, .6, .15, { v: [14, 50] })] },
  'Pin Missile': { c: [T('triangle', 1500, 2600, .05, .1, { r: 3, ri: .06 })], h: [T('square', 2600, 1800, .03, .15), N(6000, 4000, .04, .12, { ft: 'highpass' })] },
  'Signal Beam': { c: [T('square', 800, 800, .06, .1, { r: 8, ri: .1 }), T('square', 1200, 1200, .06, .08, { r: 8, ri: .1, at: .05 })], h: [T('square', 1600, 900, .2, .12, { v: [20, 200] })] },
  'Bug Buzz': { c: [T('sawtooth', 180, 220, 1, .18, { v: [35, 25], ft: 'bandpass', fq: 900 }), T('square', 360, 380, 1, .08, { v: [33, 20] })], h: [N(2000, 900, .3, .2)] },
  'String Shot': { c: [N(3000, 5000, .4, .15, { q: 5 }), T('triangle', 1400, 900, .4, .06)] },
  // Ghost
  'Lick': { c: [T('sine', 250, 350, .2, .08)], h: [N(1200, 500, .25, .35, { q: 2 }), T('sine', 300, 200, .25, .15, { v: [10, 40] })] },
  'Shadow Claw': { c: [T('sine', 180, 120, .25, .15, { v: [8, 30] })], h: [N(3500, 1500, .1, .35, { q: 3, r: 3, ri: .05 }), T('sine', 120, 60, .3, .3)] },
  'Shadow Ball': { c: [T('sine', 90, 160, .5, .25, { v: [7, 30] }), T('sawtooth', 180, 320, .5, .06, { fq: 700 })], h: [T('sine', 300, 60, .5, .6), N(800, 200, .5, .35, { ft: 'lowpass' })] },
  'Night Shade': { c: [T('sine', 110, 100, 1, .2, { v: [2, 8] }), T('sine', 165, 150, 1, .12, { v: [2.5, 8] })], h: [T('sawtooth', 220, 110, .6, .12, { fq: 900, v: [6, 20] })] },
  'Confuse Ray': { c: [T('sine', 700, 700, .8, .12, { v: [8, 300] }), T('triangle', 1050, 1050, .8, .05, { v: [10, 200] })] },
  // Dragon
  'Dragon Breath': { c: [N(500, 900, .9, .3, { ft: 'lowpass', v: [10, 200] }), T('sawtooth', 110, 140, .9, .12, { v: [5, 20] })], h: [N(1500, 600, .4, .3), T('square', 900, 600, .2, .06, { v: [50, 200] })] },
  'Dragon Claw': { c: [T('sawtooth', 100, 160, .25, .12)], h: [N(3000, 1200, .12, .4, { q: 2, r: 3, ri: .05 }), T('sine', 120, 50, .3, .5)] },
  'Dragon Pulse': { c: [T('sine', 140, 280, 1, .22, { v: [4, 30] }), T('sawtooth', 70, 140, 1, .08, { fq: 600 })], h: [T('sine', 100, 30, .6, .7), T('sine', 400, 200, .3, .15, { v: [12, 40] })] },
  'Outrage': { c: [T('sawtooth', 80, 120, .7, .2, { v: [9, 20], fq: 800 }), N(400, 800, .7, .2, { ft: 'lowpass' })], h: [T('sine', 110, 35, .3, .7, { r: 3, ri: .16 }), N(1500, 300, .3, .4, { r: 3, ri: .16 })] },
  'Dragon Dance': { c: [T('sawtooth', 150, 300, .4, .1, { r: 2, ri: .4, fq: 1000 }), N(1000, 2500, .8, .15, { q: 2 }), T('sine', 300, 600, .6, .08, { at: .2 })] },
  // Steel
  'Metal Claw': { c: [T('square', 600, 700, .06, .08)], h: [T('triangle', 2400, 1800, .35, .2, { r: 3, ri: .04 }), N(5000, 2500, .08, .3, { q: 3 })] },
  'Flash Cannon': { c: [T('sine', 1000, 3000, .4, .15), T('square', 150, 150, 1, .1, { at: .4, fq: 900 }), N(5000, 6000, .9, .15, { ft: 'highpass', at: .4 })], h: [T('triangle', 3000, 1500, .4, .2, { r: 2, ri: .06 }), T('sine', 150, 50, .4, .5)] },
  'Iron Tail': { c: [N(2000, 3500, .2, .2, { ft: 'highpass' })], h: [T('triangle', 1900, 1400, .7, .3, { v: [5, 8] }), T('sine', 140, 60, .25, .6), T('triangle', 2850, 2100, .5, .12)] },
  'Iron Defense': { c: [T('triangle', 1400, 1400, .6, .15, { r: 3, ri: .12 }), T('square', 200, 200, .05, .2, { r: 3, ri: .12 })] },
  // Rock
  'Rock Throw': { c: [N(500, 800, .15, .2, { ft: 'lowpass' })], h: [T('sine', 180, 70, .18, .6), N(1500, 400, .3, .4), T('triangle', 900, 600, .05, .12, { r: 3, ri: .05, j: .4, at: .06 })] },
  'Rock Slide': { c: [N(150, 300, 1, .4, { ft: 'lowpass', v: [6, 80] }), T('sine', 140, 90, .08, .25, { r: 5, ri: .15, j: .4, at: .3 })], h: [T('sine', 100, 35, .5, .7), N(800, 150, .6, .5, { ft: 'lowpass' })] },
  'Stone Edge': { c: [T('sine', 50, 45, .8, .3)], h: [N(2500, 400, .5, .5, { q: 1 }), T('sine', 90, 40, .5, .7), T('triangle', 1600, 900, .05, .15, { r: 5, ri: .03, j: .3 })] },
  'Rock Polish': { c: [N(3000, 5000, .12, .18, { q: 3, r: 4, ri: .1 }), T('sine', 3200, 3200, .5, .1, { at: .45 })] },
  // Fairy
  'Fairy Wind': { c: [N(2000, 4000, .6, .15, { q: 2, v: [4, 800] }), T('sine', 1760, 2640, .08, .08, { r: 5, ri: .1, j: .2 })], h: [T('sine', 2640, 1760, .3, .1)] },
  'Dazzling Gleam': { c: [T('sine', 1046, 1046, .5, .1), T('sine', 1318, 1318, .5, .08, { at: .08 }), T('sine', 1568, 1568, .5, .08, { at: .16 })], h: [T('sine', 2093, 1046, .8, .25, { v: [10, 40] }), N(8000, 6000, .7, .18, { ft: 'highpass' }), T('sine', 120, 50, .5, .5)] },
  'Moonblast': { c: [T('sine', 523, 784, .8, .15, { v: [5, 15] }), T('sine', 262, 392, .8, .12)], h: [T('sine', 1046, 523, .6, .2, { v: [8, 30] }), T('sine', 110, 40, .6, .6)] },
  'Play Rough': { c: [N(1000, 2000, .2, .2)], h: [T('sine', 200, 90, .08, .4, { r: 6, ri: .1, j: .4 }), N(2000, 800, .07, .25, { r: 6, ri: .1 }), T('square', 900, 1200, .06, .1, { r: 3, ri: .18, at: .05 })] },
  'Charm': { c: [T('sine', 880, 1175, .15, .15), T('sine', 1175, 1568, .25, .12, { at: .15 }), T('sine', 1568, 1760, .4, .08, { at: .3, v: [6, 15] })] },
  // Dark
  'Bite': { c: [N(1500, 2500, .1, .15)], h: [T('square', 700, 300, .05, .3, { r: 2, ri: .06 }), T('sine', 160, 70, .15, .5)] },
  'Crunch': { c: [T('sawtooth', 90, 110, .3, .12, { fq: 500 })], h: [N(2000, 500, .15, .5, { q: 1.5 }), T('sine', 140, 45, .35, .7), T('square', 500, 200, .06, .25, { at: .1 })] }
};
function hookMoveSfx() {
  if (hookMoveSfx.done || typeof VFX === 'undefined') return; hookMoveSfx.done = true;
  const exec = VFX.exec, hit = VFX.hit;
  VFX.exec = function (S, mv) { try { const r = MOVE_SFX[mv && mv.name]; if (r) playSfx(r.c, side(S).x); } catch (e) { } return exec.apply(this, arguments); };
  VFX.hit = function (S, mv, dmg, eff, crit) {   // S is the Pokémon that was hit
    try { const r = MOVE_SFX[mv && mv.name]; if (r && r.h) playSfx(r.h, side(S).x, (crit ? 1.25 : 1) * (eff > 1 ? 1.15 : eff < 1 ? .8 : 1)); } catch (e) { }
    return hit.apply(this, arguments);
  };
}
setTimeout(hookMoveSfx, 0);

/* ---------- stage music: music/<Stage_Name>.mp3, optional music/Opening.mp3 on the start screen ---------- */
const MUSIC = { el: null, file: null, missing: new Set(), vol: 0 };
const musicFileFor = () => {
  if ((typeof START !== 'undefined' && START.open) || typeof G === 'undefined' || !G || G.phase === 'title') return 'Opening.mp3';
  if (STAGE.music) { const own = STAGE.music + '.mp3'; return MUSIC.missing.has(own) ? STAGE.musicFallback + '.mp3' : own; }   // story stages: own track, else a borrowed one
  return STAGE.name.replace(/\s+/g, '_') + '.mp3';
};
/* A looping track played through Web Audio, with the same small interface as an <audio> element.
   <audio> on Android takes exclusive audio focus and pauses other apps (a YouTube picture-in-picture,
   a podcast); Web Audio mixes with them. Falls back to <audio> where tracks can't be fetched (file:// pages). */
const AUDIO_BUFS = new Map();
function loadBuffer(url) {
  if (!AUDIO_BUFS.has(url)) AUDIO_BUFS.set(url, fetch(url).then(r => { if (!r.ok) throw new Error('missing'); return r.arrayBuffer(); }).then(b => new Promise((res, rej) => audioCtx().decodeAudioData(b, res, rej))));
  return AUDIO_BUFS.get(url);
}
function makeTrack(url) {
  if (location.protocol === 'file:' || !audioCtx()) return new Audio(url);
  const ctx = audioCtx(), gain = ctx.createGain(), errs = []; gain.gain.value = 0; gain.connect(ctx.destination);
  let buf = null, src = null, startedAt = 0, offset = 0, dead = false, vol = 0;
  const start = () => { if (!buf || src || dead) return; src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(gain); src.start(0, offset % buf.duration); startedAt = ctx.currentTime - offset; };
  const stop = () => { if (!src) return; offset = (ctx.currentTime - startedAt) % (buf ? buf.duration : 1); try { src.stop(); } catch (e) { } src.disconnect(); src = null; };
  const t = { loop: true, preload: 'auto', paused: false,
    get volume() { return vol; }, set volume(v) { vol = v; gain.gain.value = v; },
    play() { t.paused = false; if (ctx.state === 'suspended') ctx.resume(); start(); return Promise.resolve(); },
    pause() { t.paused = true; stop(); },
    set src(v) { if (v === '') { dead = true; stop(); gain.disconnect(); } }, get src() { return url; },
    addEventListener(ev, fn) { if (ev === 'error') errs.push(fn); } };
  loadBuffer(url).then(b => { buf = b; if (!t.paused) start(); }).catch(() => { dead = true; errs.forEach(f => f()); });
  return t;
}
const musicTargetVol = () => .7 * ((window.SETTINGS && SETTINGS.musicVol != null) ? SETTINGS.musicVol : .5);
// Browsers only allow audio after a tap or key press; the phone apps allow it straight away.
let AUDIO_GESTURE = !!(window.AndroidApp && !window.DesktopApp) || !!window.IOSApp;
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { AUDIO_GESTURE = true; }, { passive: true, capture: true }));
function musicTick() {
  if (!AUDIO_GESTURE && !MUSIC.el) return;
  const want = musicFileFor(), quiet = document.hidden || (typeof clock !== 'undefined' && clock.paused && G && G.phase === 'battle');
  if (want !== MUSIC.file) {                                  // fade the old track out, then start the new one
    if (MUSIC.el && MUSIC.vol > .01) { MUSIC.vol = Math.max(0, MUSIC.vol - .06); MUSIC.el.volume = MUSIC.vol; return; }
    if (MUSIC.el) { MUSIC.el.pause(); MUSIC.el.src = ''; MUSIC.el = null; }
    MUSIC.file = want; MUSIC.vol = 0;
    if (MUSIC.missing.has(want)) return;
    const el = makeTrack('music/' + encodeURIComponent(want)); el.loop = true; el.volume = 0; el.preload = 'auto';
    el.addEventListener('error', () => { MUSIC.missing.add(want); if (MUSIC.el === el) MUSIC.el = null; });
    MUSIC.el = el; el.play().catch(() => { });
    return;
  }
  const el = MUSIC.el; if (!el) return;
  const target = quiet ? 0 : musicTargetVol();
  MUSIC.vol += Math.sign(target - MUSIC.vol) * Math.min(.04, Math.abs(target - MUSIC.vol)); el.volume = Math.max(0, Math.min(1, MUSIC.vol));
  if (target > 0 && el.paused) el.play().catch(() => { }); else if (target === 0 && MUSIC.vol <= .001 && !el.paused) el.pause();
}
setInterval(musicTick, 60);
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { if (MUSIC.el && MUSIC.el.paused && musicTargetVol() > 0) MUSIC.el.play().catch(() => { }); }, { passive: true }));

/* ---------- settings: volume sliders ---------- */
(function audioSettings() {
  const card = document.querySelector('#setOv .qol-card'); if (!card) return; const btns = card.querySelector('.qbtns');
  for (const [key, label, hint, def] of [['sfxVol', 'Sound effects volume', 'Move sounds', .7], ['musicVol', 'Music volume', 'Stage music from the music folder', .5]]) {
    const row = document.createElement('label'); row.className = 'qrow';
    row.innerHTML = `<span>${label}<small>${hint}</small></span><input type="range" min="0" max="100" step="5" id="set_${key}" style="width:140px">`;
    card.insertBefore(row, btns || null);
    const el = $('set_' + key); el.value = Math.round(100 * (SETTINGS[key] != null ? SETTINGS[key] : def));
    el.oninput = () => { SETTINGS[key] = +el.value / 100; saveSettings(); if (key === 'sfxVol') { setSfxVolume(); playSfx(MOVE_SFX['Swift'].h, 500, .8); } };
  }
})();
(function audioHelp() {
  const grid = document.querySelector('#helpOv .qgrid'); if (!grid) return;
  grid.insertAdjacentHTML('beforeend', '<p>Music: put <b>Stage_Name.mp3</b> files (for example <b>Metro_Plaza.mp3</b>) in the <b>music</b> folder; <b>Opening.mp3</b> plays on the start screen</p>');
})();
