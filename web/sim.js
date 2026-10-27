/* =====================================================================
   Section 7: real-time battle simulation
   Both Pokémon act at the same time. Each move has its own cooldown;
   attacks are physical objects in the arena — dashes, projectiles,
   beams, ground markers and shockwaves — so positioning dodges them.
   ===================================================================== */
const WW = 1000, WH = 560;
const HP_MULT = 8, DMG_MULT = 2.0;           // ~5–10 hits to knock out a Pokémon
const PINCH = { Fire: 'Blaze', Water: 'Torrent', Grass: 'Overgrow', Bug: 'Swarm' };
const TOUCH = 52;                              // body radius for contact and collisions

/* ---------- Balance (16.2) ---------- */
const MEGA_NERF = new Set(['Venusaur', 'Charizard', 'Blastoise', 'Beedrill', 'Pidgeot', 'Alakazam', 'Slowbro', 'Gengar', 'Kangaskhan', 'Pinsir', 'Gyarados', 'Aerodactyl', 'Mewtwo']);
// Night Shade dealt 400 fixed damage (30–50% of most Pokémon) on the shortest cooldown in the game: now 144, cycling like a 75-power move
if (MOVES['Night Shade']) { MOVES['Night Shade'].e.fix = 18; MOVES['Night Shade'].pow = 75; }
const REST_SLEEP = 7000;                      // Rest's sleep (was 4200 ms)
function cooldownOf(mv) {
  if (mv.cat === 'X') return (mv.e.heal || mv.e.rest) ? 16000 : 6500;
  if (mv.pri > 0) return 1500;
  return Math.round(1300 + mv.pow * 22 + (mv.e.rch ? 1500 : 0));
}
// Shared recovery after any attack, so a Pokémon cannot chain all four moves back to back.
function recoveryOf(mv) { return mv.cat === 'X' ? 1000 : mv.pri > 0 ? 900 : 1100 + mv.pow * 6; }
function makeBattleMon(pick) {
  const name = String(pick).split('|')[0], m = makeMon(name); if (!m) return null;
  m.pick = String(pick); m.shiny = String(pick).split('|')[1] === 'shiny';   // shiny: a different look, the same Pokémon
  // Arena balance: pull extreme stats toward the middle so fragile Pokémon survive several hits
  // while strong ones still feel strong. Base stats keep their shape; the spread is 65% as wide.
  const AVG = { hp: 140, atk: 90, def: 90, spa: 90, spd: 90, spe: 90 };
  for (const k of Object.keys(AVG)) m.stats[k] = Math.round(m.stats[k] * .65 + AVG[k] * .35);
  // Balance (16.2): the Pokémon that have Mega Evolutions in the games were the strongest picks; trim them
  if (MEGA_NERF.has(m.name)) { for (const k of ['atk', 'def', 'spa', 'spd', 'spe']) m.stats[k] = Math.round(m.stats[k] * .88); m.stats.hp = Math.round(m.stats.hp * .94); }
  // Balance (16.2): a Pokémon with a healing move doesn't also hold Leftovers (no stacked damage prevention)
  if (m.item === 'Leftovers' && m.moves.some(n => MOVES[n] && (MOVES[n].e.heal || MOVES[n].e.rest))) m.item = '';
  m.max = m.stats.hp * HP_MULT; m.hp = m.max;
  m.cd = m.moves.map(() => 0); m.stT = 0; m.thawT = 0; m.dotT = 0; m.lefT = 0; m.conf = 0;
  m.ability = PINCH[m.types[0]] || ''; m.pinchShown = false;
  return m;
}
function newSide(key, picks) {
  return { key, team: picks.map(makeBattleMon), active: 0, x: ENTRY[key].x, y: ENTRY[key].y, vx: 0, vy: 0, face: key === 'A' ? 1 : -1,
    state: 'out', stateT: 0, cast: null, stun: 0, stunKind: '', gcd: 0, switchCd: 0, aiT: 500, strafe: 1, strafeT: 0,
    manual: { x: 0, y: 0 }, manualT: 0, queued: null, queuedT: 0, pendingSwitch: null, kbx: 0, kby: 0, hit: 0, hop: 0, dig: false,
    throwT: -9999, pillT: 0, pill: '', walk: 0, prefDist: 260, megaUsed: false, plotUsed: false, sinceIn: 0, dodgeT: 0, dodgeCd: 0, zCharge: 0, zUsed: false, zInfo: null, zHit: false };
}
function newBattle(picksA, picksB, opts = {}) {
  return {
    picks: { A: picksA.slice(), B: picksB.slice() }, sides: { A: newSide('A', picksA), B: newSide('B', picksB) },
    shots: [], marks: [], waves: [], beams: [], clash: null, time: 0, elapsed: 0, lastDmgT: 0, phase: 'intro', auto: !!opts.auto,
    timeLimit: opts.timeLimit || 0, winner: null, decision: '', log: [], hudDirty: true, nextShotGroup: 1,
    stats: { A: { dmg: 0, kos: 0, crits: 0, moves: 0 }, B: { dmg: 0, kos: 0, crits: 0, moves: 0 }, best: null }
  };
}
let G = null;
const side = s => G.sides[s];
const act = s => side(s).team[side(s).active];
const stageMult = s => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));
const accMult = s => (s >= 0 ? (3 + s) / 3 : 3 / (3 - s));
const effSpe = m => m.stats.spe * stageMult(m.stages.spe) * (m.status === 'par' ? .5 : 1);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const present = s => { const sd = side(s); return sd.state === 'idle' && !sd.dig && !(sd.dodgeT > 0) && act(s).hp > 0; };
const controlledByAI = s => G.auto || (G.human ? !G.human[s] : s === 'B');   // online battles mark both sides human
// AI difficulty 1–10 per side (G.aiLevel). Level 6 is the classic AI exactly; nothing set = classic.
// aiK(S, atLevel1, atLevel6, atLevel10) blends a setting between those three points.
const AI_CLASSIC = 6;
function aiLv(S) { const l = G && G.aiLevel && G.aiLevel[S]; return l >= 1 && l <= 13 ? l : AI_CLASSIC; }
// Levels 11–13 exist only for story secrets: they keep sharpening every setting past level 10.
function aiK(S, lo, base, hi) { const l = aiLv(S); if (l > 10) return hi + (hi - base) * (l - 10) / 8; return l <= AI_CLASSIC ? lo + (base - lo) * (l - 1) / (AI_CLASSIC - 1) : base + (hi - base) * (l - AI_CLASSIC) / (10 - AI_CLASSIC); }
function logLine(t, cls) { G.log.push(cls ? '§' + t : t); if (G.log.length > 150) G.log.shift(); if (typeof onLog === 'function') onLog(t, cls); }

function calcDamage(u, t, mv, crit, eff, roll = true) {
  const phys = mv.cat === 'P';
  let aS = phys ? u.stages.atk : u.stages.spa, dS = phys ? t.stages.def : t.stages.spd;
  if (crit) { aS = Math.max(0, aS); dS = Math.min(0, dS); }
  const A = (phys ? u.stats.atk : u.stats.spa) * stageMult(aS) * (u.item === 'Light Ball' ? 2 : 1);
  const D = (phys ? t.stats.def : t.stats.spd) * stageMult(dS);
  const base = Math.floor(Math.floor(22 * mv.pow * A / D) / 50) + 2;
  const stab = u.types.includes(mv.type) ? 1.5 : 1;
  const pinch = u.ability && u.hp < u.max / 3 && mv.type === u.types[0] ? 1.5 : 1;
  const burn = phys && u.status === 'brn' ? .5 : 1;
  const r = roll ? .85 + Math.random() * .15 : .925;
  const od = G && G.overtime ? G.overtime : 1;
  return Math.max(1, Math.floor(base * stab * eff * pinch * (crit ? 1.5 : 1) * r * burn * DMG_MULT * od));
}
function statusImmune(m, st) {
  if (st === 'brn') return m.types.includes('Fire');
  if (st === 'par') return m.types.includes('Electric');
  if (st === 'psn' || st === 'tox') return m.types.includes('Poison') || m.types.includes('Steel');
  if (st === 'frz') return m.types.includes('Ice');
  return false;
}

/* ---------- status and stat changes ---------- */
function inflict(S, st, announce) {
  const m = act(S); if (m.hp <= 0) return;
  if (m.status) { if (announce) VFX.text(S, 'FAILED', '#e6ecff'); return; }
  if (statusImmune(m, st)) { if (announce) VFX.text(S, 'NO EFFECT', '#c9d3ee'); return; }
  m.status = st; m.dotT = 0;
  if (st === 'slp') m.stT = 2500 + Math.random() * 2000;
  if (st === 'frz') { m.stT = 6000; m.thawT = 0; }
  if (st === 'tox') m.tox = 1;
  if (st === 'slp' || st === 'frz') cancelCast(S);
  logLine(st === 'slp' ? `${m.name} fell asleep!` : `${m.name} is ${STATUS_INFO[st].name}!`);
  VFX.status(S, st); G.hudDirty = true;
  VFX.banner(`${displayName(m)} ${st === 'slp' ? 'FELL ASLEEP' : st === 'frz' ? 'WAS FROZEN SOLID' : st === 'par' ? 'WAS PARALYZED' : st === 'brn' ? 'WAS BURNED' : 'WAS POISONED'}!`, STATUS_INFO[st].color);
}
function confuse(S, ms, announce) {
  const m = act(S); if (m.hp <= 0) return;
  if (m.conf > 0) { if (announce) VFX.text(S, 'FAILED', '#e6ecff'); return; }
  m.conf = ms || 4000 + Math.random() * 4000; logLine(`${m.name} became confused!`); VFX.text(S, 'CONFUSED!', '#ffe86b'); G.hudDirty = true;
}
function stageChange(S, changes) {
  const m = act(S);
  for (const [k, d] of Object.entries(changes)) {
    const cur = m.stages[k], nv = clamp(cur + d, -6, 6);
    if (nv === cur) { VFX.text(S, 'NO CHANGE', '#e6ecff'); continue; }
    m.stages[k] = nv; const real = nv - cur;
    const word = real >= 2 ? 'rose sharply' : real > 0 ? 'rose' : real <= -2 ? 'harshly fell' : 'fell';
    logLine(`${m.name}'s ${STAT_LABEL[k]} ${word}!`);
    VFX.stage(S, k, real); VFX.banner(`${displayName(m)}'S ${STAT_LABEL[k].toUpperCase()} ${word.toUpperCase()}!`, real > 0 ? '#ffb347' : '#8fb8ff');
  }
  G.hudDirty = true;
}
function stun(S, ms, kind) { const sd = side(S); sd.stun = Math.max(sd.stun, ms); sd.stunKind = kind; cancelCast(S); }
function cancelCast(S) { const sd = side(S); if (sd.cast) { sd.cast = null; sd.dig = false; } }

/* ---------- hits ---------- */
function applyHit(S, mv, u, opts = {}) {
  const fs = other(S); if (!present(fs)) return false;
  const t = act(fs), ts = side(fs);
  if (G.phase !== 'battle') return false;
  let eff = mv.e.fix ? (typeEff(mv.type, t.types) === 0 ? 0 : 1) : typeEff(mv.type, t.types);
  if (opts.z && eff === 0) eff = .5;                                   // a Z-Move always hits: immunity counts as a resisted hit
  if (eff === 0) { VFX.text(fs, 'NO EFFECT', '#c9d3ee'); logLine(`It doesn't affect ${t.name}...`); return true; }
  const crit = !mv.e.fix && Math.random() < (mv.e.hc ? 1 / 8 : 1 / 24);
  let dmg = mv.e.fix ? mv.e.fix * HP_MULT : calcDamage(u, t, mv, crit, eff);
  if (opts.scale) dmg = Math.max(1, Math.round(dmg * opts.scale));
  if (opts.floor) dmg = Math.max(dmg, Math.round(t.max * opts.floor * (eff < 1 ? .5 : 1)));
  if (opts.cap) dmg = Math.min(dmg, Math.round(t.max * opts.cap));
  if (dmg >= t.hp && t.hp > t.max * .25 && !ts.plotUsed && Math.random() < .12) { ts.plotUsed = true; dmg = t.hp - 1; VFX.plotArmor(fs); logLine(`${t.name} hung on with 1 HP!`, 't'); }
  dmg = Math.min(dmg, t.hp); t.hp -= dmg; u.dmgDealt = (u.dmgDealt || 0) + dmg;
  if (!opts.z) { const us = side(S); us.zCharge = Math.min(100, (us.zCharge || 0) + dmg / t.max * 85); ts.zCharge = Math.min(100, (ts.zCharge || 0) + dmg / t.max * 45); }
  if (opts.combo) VFX.combo(fs, opts.combo);
  if (crit || eff > 1 || t.hp <= 0) VFX.crowd(t.hp <= 0 ? 2 : 1);
  const st = G.stats[S]; st.dmg += dmg; u.dmg += dmg; if (crit) st.crits++;
  if (!G.stats.best || dmg > G.stats.best.amt) G.stats.best = { amt: dmg, mon: u.name, move: mv.name, side: S };
  G.lastDmgT = G.time; G.hudDirty = true;
  // knockback away from the attacker
  const a = side(S), ang = Math.atan2(ts.y - a.y, ts.x - a.x), kb = (crit ? 260 : 150) * (mv.cat === 'P' ? 1.2 : 1);
  ts.kbx += Math.cos(ang) * kb; ts.kby += Math.sin(ang) * kb; ts.hit = 330;
  VFX.hit(fs, mv, dmg, eff, crit);
  logLine(`${u.name}'s ${mv.name} hit ${t.name} for ${dmg}.${crit ? ' Critical hit!' : ''}${eff > 1 ? ' Super effective!' : eff < 1 ? ' Not very effective.' : ''}`);
  if (t.ability && !t.pinchShown && t.hp > 0 && t.hp < t.max / 3) { t.pinchShown = true; VFX.ability(fs, t.ability); logLine(`${t.name}'s ${t.ability} activated!`); }
  if (t.hp <= 0) { u.kos++; st.kos++; }
  else {
    const e = mv.e;
    if (e.st && Math.random() * 100 < e.st[1]) inflict(fs, e.st[0], false);
    if (e.fl && Math.random() * 100 < e.fl) { stun(fs, 600, 'flinch'); VFX.text(fs, 'FLINCHED', '#ffffff'); }
    if (e.cf && Math.random() * 100 < e.cf) confuse(fs);
    if (e.tg && Math.random() * 100 < (e.ch ?? 100)) stageChange(fs, e.tg);
    if (t.status === 'frz' && mv.type === 'Fire') { t.status = ''; VFX.text(fs, 'THAWED', '#bfffd0'); logLine(`${t.name} thawed out!`); }
  }
  if (u.hp > 0 && mv.e.dr) { const h = Math.min(u.max - u.hp, Math.max(1, Math.floor(dmg * mv.e.dr))); if (h > 0) { u.hp += h; VFX.heal(S, h); } }
  if (u.hp > 0 && mv.e.rc) { const rc = Math.min(u.hp, Math.max(1, Math.floor(dmg * mv.e.rc))); u.hp -= rc; VFX.recoil(S, rc); logLine(`${u.name} was hurt by recoil (${rc}).`); }
  if (u.hp > 0 && mv.e.self && Math.random() * 100 < (mv.e.sch ?? 100) && side(S).team[side(S).active] === u) stageChange(S, mv.e.self);
  if (u.hp > 0 && mv.e.ucf && side(S).team[side(S).active] === u && u.conf <= 0) confuse(S, 3500);
  return true;
}
function missAt(x, y, S) { VFX.missAt(x, y); logLine(`${act(S).name}'s attack missed!`); }

/* ---------- casting ---------- */
function tryCast(S, idx) {
  if (G.clash && inClash(S)) { if (!controlledByAI(S)) G.clash.mash[S] = (G.clash.mash[S] || 0) + 1; return !controlledByAI(S); }   // a button press during a beam lock pushes the beam
  const sd = side(S), m = act(S), mv = MOVES[m.moves[idx]];
  if (!mv || sd.state !== 'idle' || sd.cast || sd.stun > 0 || sd.gcd > 0 || m.cd[idx] > 0) return false;
  if (m.status === 'slp' || m.status === 'frz') return false;
  if (m.vol.recharge) return false;
  const fs = other(S);
  if (m.conf > 0 && Math.random() < .3) {
    const dmg = Math.min(m.hp, calcDamage(m, m, { pow: 40, cat: 'P', type: '???' }, false, 1)); m.hp -= dmg;
    VFX.selfHit(S, dmg); logLine(`${m.name} hurt itself in its confusion! (${dmg})`); stun(S, 650, 'conf'); m.cd[idx] = 900; G.hudDirty = true; return true;
  }
  if (m.status === 'par' && Math.random() < .2) { stun(S, 700, 'par'); VFX.text(S, 'FULLY PARALYZED', '#ffe04a'); logLine(`${m.name} is fully paralyzed!`); m.cd[idx] = 700; return true; }
  const t = side(fs);
  const accOk = mv.acc == null || Math.random() * 100 < mv.acc * accMult(m.stages.acc - (present(fs) ? act(fs).stages.eva : 0));
  sd.cast = { idx, mv, t: 0, phase: 'wind', accOk, landed: false, aim: { x: t.x, y: t.y }, spawn: 0, group: G.nextShotGroup++ };
  sd.pill = mv.name; sd.pillT = 1200; G.stats[S].moves++;
  logLine(`${m.name} used ${mv.name}!`);
  VFX.windup(S, mv);
  return true;
}
const WINDUP = mv => mv.cat === 'X' ? 260 : mv.pri > 0 ? 110 : 250;
function aimPoint(S, accOk, spread = 95) {
  const t = side(other(S));
  const ai = controlledByAI(S), lead = ai ? aiK(S, .04, .18, .26) : .18; let x = t.x + t.vx * lead, y = t.y + t.vy * lead;
  if (ai) { const e = aiK(S, 80, 0, 0); if (e > 0) { const a = Math.random() * Math.PI * 2, r = Math.random() * e; x += Math.cos(a) * r; y += Math.sin(a) * r; } }
  if (!accOk) { const a = Math.random() * Math.PI * 2; x += Math.cos(a) * spread; y += Math.sin(a) * spread; }
  return { x: clamp(x, BOUND.x0 - 40, BOUND.x1 + 40), y: clamp(y, BOUND.y0 - 40, BOUND.y1 + 40) };
}
function shoot(S, mv, opts) {
  const sd = side(S), from = { x: sd.x + sd.face * 20, y: sd.y - 30 };
  const to = opts.to || aimPoint(S, opts.accOk);
  const ang = Math.atan2(to.y + 30 - from.y - 30, to.x - from.x) + (opts.spread || 0);
  G.shots.push({ owner: S, mv, u: act(S), x: from.x, y: from.y, vx: Math.cos(ang) * opts.speed, vy: Math.sin(ang) * opts.speed, speed: opts.speed,
    ttl: opts.ttl || 1600, r: opts.r || 18, home: mv.acc == null && opts.accOk, shape: opts.shape || 'orb', group: opts.group, damage: opts.damage !== false,
    scale: opts.scale, burst: opts.burst, dest: opts.burst ? to : null, t: 0, combo: opts.combo || null });
}
function updateCast(S, dt) {
  const sd = side(S), c = sd.cast, mv = c.mv, m = act(S), fs = other(S), t = side(fs);
  c.t += dt;
  if (c.phase === 'wind') { if (c.t < WINDUP(mv)) return; c.phase = 'go'; c.t = 0; c.aim = aimPoint(S, c.accOk); startExec(S, c); return; }
  const end = (extra = 0) => {
    m.cd[c.idx] = cooldownOf(mv); sd.gcd = recoveryOf(mv) + extra; sd.cast = null; sd.dig = false;
    if (mv.e.rch && c.landed) { m.vol.recharge = true; stun(S, 2200, 'recharge'); VFX.big('MUST RECHARGE', '#ffffff'); logLine(`${m.name} must recharge!`); }
  };
  switch (mv.anim) {
    case 'contact': case 'dash': case 'slash': {
      if (c.phase === 'go') {
        const target = c.accOk && present(fs) ? { x: t.x, y: t.y } : c.aim;
        const sp = mv.anim === 'dash' ? 1150 : 820, d = dist(sd, target), reach = mv.anim === 'slash' ? TOUCH + 22 : TOUCH;
        if (d > reach && c.t < 700) { const k = Math.min(1, sp * dt / 1000 / d); [sd.x, sd.y] = clampWalk(sd.x + (target.x - sd.x) * k, sd.y + (target.y - sd.y) * k); VFX.dashFx(S, mv); return; }
        if (c.accOk && present(fs) && dist(sd, t) < reach + 30) { c.landed = applyHit(S, mv, m); if (mv.anim === 'slash') VFX.slash(fs, mv); }
        else missAt(sd.x, sd.y - 40, S);
        const ang = Math.atan2(sd.y - t.y, sd.x - t.x); sd.kbx += Math.cos(ang) * 260; sd.kby += Math.sin(ang) * 260;
        c.phase = 'back'; c.t = 0; return;
      }
      if (c.t > 200) end(); return;
    }
    case 'dig': {
      if (c.phase === 'go') { sd.dig = true; if (c.t < 520) return; const tgt = c.accOk && present(fs) ? { x: t.x, y: t.y } : c.aim; [sd.x, sd.y] = clampWalk(tgt.x - sd.face * 30, tgt.y + 6); sd.dig = false; VFX.erupt(sd.x, sd.y); if (c.accOk && present(fs) && dist(sd, t) < 90) c.landed = applyHit(S, mv, m); else missAt(sd.x, sd.y - 40, S); c.phase = 'back'; c.t = 0; return; }
      if (c.t > 260) end(); return;
    }
    case 'beam': {
      if (c.phase === 'go') { if (c.t < 360) return; // charge
        // Beam clash, part 1: if the rival is also charging a beam and will fire within a moment, hold fire so both beams leave together.
        if (!c.hold) c.hold = 0;
        if (beamRivalSoon(S, c, CLASH.sync - c.hold)) { if (c.hold === 0) VFX.beamHold(S, mv); c.hold += dt; return; }
        const from = { x: sd.x + sd.face * 18, y: sd.y - 32 }, ang = Math.atan2(c.aim.y - 32 - from.y, c.aim.x - from.x);
        const b = { owner: S, mv, u: m, x: from.x, y: from.y, ang, t: 0, life: 520, w: mv.pow >= 110 ? 26 : 18, pend: false, grace: CLASH.grace, cl: 0, clip: 0 };
        const px = t.x - from.x, py = (t.y - 32) - from.y, along = px * Math.cos(ang) + py * Math.sin(ang), perp = Math.abs(-px * Math.sin(ang) + py * Math.cos(ang));
        G.beams.push(b); c._beam = b;
        if (mv.e && mv.e.rch) { sd.kbx -= sd.face * 360; }   // the user is pushed back by the force of the beam (Hyper Beam style recoil)
        if (present(fs) && along > 0 && perp < 44) {
          b.pend = true;                           // damage lands after a short grace so a beam fired back can still meet it
          const rival = G.clash ? null : G.beams.find(o => o !== b && o.owner === fs && o.pend && !o.cl);
          if (rival) startClash(rival, b);
        } else missAt(t.x, t.y - 50, S);
        c.phase = 'fire'; c.t = 0; return; }
      if (c._beam && c._beam.cl) return;           // locked in a clash (or surging out of one): the cast stays alive until it is settled
      if (c.t > 380) end(); return;
    }
    case 'projectile': case 'drain': case 'hex': case 'powder': case 'burst': case 'stars': case 'leaves': case 'wind': case 'multi': {
      if (c.phase === 'go') {
        const spd = mv.anim === 'hex' || mv.anim === 'powder' ? 420 : mv.anim === 'multi' ? 760 : mv.anim === 'wind' ? 700 : 600;
        if (mv.anim === 'stars' || mv.anim === 'leaves' || mv.anim === 'wind') {
          const n = mv.anim === 'wind' ? 2 : mv.anim === 'stars' ? 3 : 4;
          for (let i = 0; i < n; i++) shoot(S, mv, { speed: spd, accOk: c.accOk, spread: (i - (n - 1) / 2) * .12, group: c.group, shape: mv.anim === 'stars' ? 'star' : mv.anim === 'leaves' ? 'leaf' : 'crescent', r: 20 });
        } else if (mv.anim === 'multi') {
          if (!c.hits) { const q = Math.random(); c.hits = q < .375 ? 2 : q < .75 ? 3 : q < .875 ? 4 : 5; }
          if (c.spawn < c.hits && c.t >= c.spawn * 110) { shoot(S, mv, { speed: spd, accOk: c.accOk || Math.random() < .5, group: G.nextShotGroup++, r: 14, shape: 'needle', combo: c.comboId || (c.comboId = { n: 0 }) }); c.spawn++; }
          if (c.spawn < c.hits) return;
        } else shoot(S, mv, { speed: spd, accOk: c.accOk, group: c.group, burst: mv.anim === 'burst', r: mv.anim === 'burst' ? 16 : 20, shape: mv.anim === 'hex' || mv.anim === 'powder' ? 'hex' : 'orb' });
        c.phase = 'after'; c.t = 0; return;
      }
      if (c.t > 220) end(); return;
    }
    case 'bolt': case 'sky': case 'psy': {
      if (c.phase === 'go') {
        const at = c.accOk ? aimPoint(S, true) : c.aim;
        G.marks.push({ owner: S, mv, u: m, x: at.x, y: at.y, r: mv.anim === 'sky' ? 80 : mv.anim === 'bolt' ? 62 : 66, delay: mv.anim === 'sky' ? 620 : mv.anim === 'bolt' ? 460 : 380, t: 0, kind: mv.anim });
        c.phase = 'after'; c.t = 0; return;
      }
      if (c.t > 240) end(); return;
    }
    case 'quake': case 'wave': {
      if (c.phase === 'go') {
        if (mv.anim === 'quake') { sd.hop = 1; VFX.shake(10, 500); }
        G.waves.push({ owner: S, mv, u: m, x: sd.x, y: sd.y, r: 10, maxR: mv.anim === 'quake' ? 360 : 320, speed: mv.anim === 'quake' ? 720 : 600, hit: false, kind: mv.anim });
        c.phase = 'after'; c.t = 0; return;
      }
      if (c.t > 300) end(); return;
    }
    default: { // self-targeted status moves
      if (c.phase === 'go') {
        const e = mv.e;
        if (e.none) { VFX.text(S, 'NOTHING HAPPENED', '#e6ecff'); logLine('But nothing happened!'); }
        else if (e.heal) { if (m.hp >= m.max) VFX.text(S, 'FAILED', '#e6ecff'); else { const h = Math.min(m.max - m.hp, Math.ceil(m.max * Math.min(e.heal, .25) * Math.pow(.7, m.healUses || 0))); m.healUses = (m.healUses || 0) + 1; m.hp += h; VFX.heal(S, h); logLine(`${m.name} restored ${h} HP.`); } }
        else if (e.rest) { if (m.hp >= m.max) VFX.text(S, 'FAILED', '#e6ecff'); else { const h = Math.min(m.max - m.hp, Math.ceil(m.max * .5 * Math.pow(.7, m.healUses || 0))); m.healUses = (m.healUses || 0) + 1; m.hp += h; m.status = 'slp'; m.stT = REST_SLEEP; VFX.heal(S, h); VFX.status(S, 'slp'); logLine(`${m.name} slept and became healthy!`); } }
        else if (e.self) { VFX.aura(S, MOVE_FX[mv.type].col); stageChange(S, e.self); }
        G.hudDirty = true; c.phase = 'after'; c.t = 0; return;
      }
      if (c.t > 380) end(); return;
    }
  }
}
function startExec(S, c) { VFX.exec(S, c.mv); }

/* ---------- projectiles, markers, waves, beams ---------- */
function updateWorld(dt) {
  const k = dt / 1000;
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const p = G.shots[i]; p.t += dt; p.ttl -= dt;
    const fs = other(p.owner), t = side(fs);
    if (p.home && present(fs)) { const ang = Math.atan2(t.y - 30 - p.y, t.x - p.x), cur = Math.atan2(p.vy, p.vx); let d = ((ang - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI; const turn = clamp(d, -4 * k, 4 * k); p.vx = Math.cos(cur + turn) * p.speed; p.vy = Math.sin(cur + turn) * p.speed; }
    p.x += p.vx * k; p.y += p.vy * k;
    if (p.burst && p.dest && Math.hypot(p.dest.x - p.x, p.dest.y - 30 - p.y) < 22) {
      VFX.explode(p.x, p.y, p.mv);
      if (present(fs) && Math.hypot(t.x - p.x, t.y - 30 - p.y) < 82) groupHit(p); else groupMiss(p);
      G.shots.splice(i, 1); continue;
    }
    if (present(fs) && Math.hypot(t.x - p.x, t.y - 32 - p.y) < p.r + 26) {
      if (p.damage) groupHit(p); VFX.impactAt(p.x, p.y, p.mv); G.shots.splice(i, 1); continue;
    }
    if (p.ttl <= 0 || p.x < -40 || p.x > WW + 40 || p.y < -60 || p.y > WH + 40) { groupMiss(p); G.shots.splice(i, 1); }
  }
  for (let i = G.marks.length - 1; i >= 0; i--) {
    const mk = G.marks[i]; mk.t += dt;
    if (mk.t >= mk.delay) {
      const fs = other(mk.owner), t = side(fs);
      VFX.markFire(mk);
      if (present(fs) && Math.hypot(t.x - mk.x, t.y - mk.y) < mk.r) { const sd = side(mk.owner); if (applyHit(mk.owner, mk.mv, mk.u)) { if (sd.cast && sd.cast.mv === mk.mv) sd.cast.landed = true; } }
      else missAt(mk.x, mk.y - 40, mk.owner);
      G.marks.splice(i, 1);
    }
  }
  for (let i = G.waves.length - 1; i >= 0; i--) {
    const w = G.waves[i]; w.r += w.speed * k;
    const fs = other(w.owner), t = side(fs);
    if (!w.hit && present(fs)) { const d = Math.hypot(t.x - w.x, (t.y - w.y) * 1.6); if (Math.abs(d - w.r) < 34 || d < w.r) { w.hit = true; applyHit(w.owner, w.mv, w.u); } }
    if (w.r >= w.maxR) { if (!w.hit) missAt(t.x, t.y - 40, w.owner); G.waves.splice(i, 1); }
  }
  updateClash(dt);
  for (let i = G.beams.length - 1; i >= 0; i--) {
    const b = G.beams[i];
    if (b.cl) continue;                                           // clash beams are driven by updateClash
    b.t += dt;
    if (b.pend) { b.grace -= dt; if (b.grace <= 0) landBeam(b); }
    if (b.t >= b.life) { if (b.pend) landBeam(b); G.beams.splice(i, 1); }
  }
}
/* =====================================================================
   Beam clashes (Priori Incantatem style)
   When both Pokémon fire beams at each other at about the same moment, the beams meet and lock.
   The meeting point surges back and forth: the stronger beam (and a player's button-mashing)
   pushes it toward the weaker Pokémon. If one side gets pushed back far enough its beam is
   overwhelmed and the winner's beam blasts through; if the struggle runs too long, or the
   beams are evenly matched, they cancel in a huge explosion that hurts both.
   Everything here is plain numbers on G.clash and on the two beams, so the server can stream it.
   ===================================================================== */
const CLASH = {
  grace: 140,        // ms a fired beam waits before its damage lands, so a beam fired back in that time can still meet it
  sync: 340,         // ms a charged beam will hold fire for a rival beam that is about to fire
  minMs: 1800,       // the lock lasts at least this long
  fullMs: 4300,      // energy reaches 100% here: the struggle can no longer be decided by pushing, it ends
  winAt: .1,         // the meeting point has to get this close to a Pokémon for it to lose (0 = at the Pokémon, .5 = middle)
  drawBand: .3,      // at full energy, a meeting point within .5 ± this band ends in the cancel explosion
  surgeScale: 1.2, powerScale: .9, mashPush: .09, damping: 2.2
};
const beamMight = b => {
  const m = b.u, mv = b.mv, atk = mv.cat === 'P' ? m.stats.atk * stageMult(m.stages.atk) : m.stats.spa * stageMult(m.stages.spa);
  return Math.max(1, mv.pow * (atk / 90) * (m.types.includes(mv.type) ? 1.25 : 1) * (.8 + .2 * m.hp / m.max));
};
const inClash = S => !!(G.clash && G.clash._b[S] && !G.clash.over);
// Is the rival about to fire a beam of its own (so this beam should wait for it)?
function beamRivalSoon(S, c, window) {
  if (window <= 0 || !c.accOk || G.clash) return false;
  const fs = other(S), oc = side(fs).cast;
  if (!oc || oc.mv.anim !== 'beam' || oc._beam || !oc.accOk || !present(fs) || (oc.phase !== 'wind' && oc.phase !== 'go')) return false;
  const left = (oc.phase === 'wind' ? WINDUP(oc.mv) - oc.t + 360 : 360 - oc.t);
  return left > 0 && left <= window;           // when the rival is ready too, nobody waits: both fire
}
function landBeam(b) {
  if (!b.pend) return; b.pend = false;
  const sd = side(b.owner), landed = applyHit(b.owner, b.mv, b.u);
  if (sd.cast && sd.cast._beam === b) sd.cast.landed = landed;
}
function startClash(b1, b2) {
  const bA = b1.owner === 'A' ? b1 : b2, bB = b1.owner === 'A' ? b2 : b1;
  const cl = { t: 0, p: .5, v: 0, e: 0, over: false, mash: { A: 0, B: 0 }, surgeT: 450, surge: 0, aiT: { A: 0, B: 0 }, nA: 0, nB: 0,
    mA: beamMight(bA), mB: beamMight(bB), x: 0, y: 0, k: 0, _b: { A: bA, B: bB } };
  for (const b of [bA, bB]) { b.pend = false; b.cl = 1; b.t = b.life * .45; }
  G.clash = cl; placeClash(cl); G.lastDmgT = G.time;
  VFX.clashStart(cl.x, cl.y, 'A', bA.mv, 'B', bB.mv);
  logLine(`${bA.u.name}'s ${bA.mv.name} and ${bB.u.name}'s ${bB.mv.name} collide! Beam struggle!`, 't');
}
// aim both beams at the meeting point
function placeClash(cl) {
  const bA = cl._b.A, bB = cl._b.B, sA = side('A'), sB = side('B');
  bA.x = sA.x + sA.face * 18; bA.y = sA.y - 32; bB.x = sB.x + sB.face * 18; bB.y = sB.y - 32;
  cl.x = bA.x + (bB.x - bA.x) * cl.p; cl.y = bA.y + (bB.y - bA.y) * cl.p;
  for (const b of [bA, bB]) { b.ang = Math.atan2(cl.y - b.y, cl.x - b.x); b.clip = Math.hypot(cl.x - b.x, cl.y - b.y); b.t = b.life * .45; }
}
function clashBroken(S) {
  const sd = side(S), m = act(S), c = sd.cast;
  return !c || c._beam !== G.clash._b[S] || sd.state !== 'idle' || sd.stun > 0 || m.hp <= 0 || m.status === 'slp' || m.status === 'frz';
}
function updateClash(dt) {
  for (const b of G.beams.slice()) if (b.cl >= 2) driveBeamAfterClash(b, dt);   // beams retracting or surging after a clash was settled
  const cl = G.clash; if (!cl) return;
  const k = dt / 1000;
  if (G.phase !== 'battle') { endClash('draw', null); return; }
  const brokeA = clashBroken('A'), brokeB = clashBroken('B');
  if (brokeA || brokeB) { endClash(brokeA && brokeB ? 'draw' : 'win', brokeA && brokeB ? null : brokeA ? 'B' : 'A'); return; }
  cl.t += dt; cl.e = Math.min(1, cl.t / CLASH.fullMs);
  // players push by pressing move buttons; the AI "mashes" at a rate set by its level
  for (const S of ['A', 'B']) if (controlledByAI(S)) { cl.aiT[S] -= dt; if (cl.aiT[S] <= 0) { cl.aiT[S] = 1000 / aiK(S, 2.2, 4.2, 7.5) * (.6 + Math.random() * .8); cl.mash[S]++; } }
  const push = cl.mash.A - cl.mash.B; cl.mash.A = cl.mash.B = 0;
  cl.surgeT -= dt; if (cl.surgeT <= 0) { cl.surgeT = 420 + Math.random() * 520; cl.surge = (Math.random() < .5 ? -1 : 1) * (.45 + Math.random() * .65) * (.7 + cl.e * .8); }
  cl.surge *= Math.pow(.18, k);
  const lead = (cl.mA - cl.mB) / (cl.mA + cl.mB);                                      // -1 … 1: who has the stronger beam
  const acc = lead * CLASH.powerScale + cl.surge * CLASH.surgeScale;
  cl.v += acc * k * 2.2 + push * CLASH.mashPush; cl.v *= Math.max(0, 1 - CLASH.damping * k); cl.v = clamp(cl.v, -1.4, 1.4);   // each button press is a small shove
  cl.p = clamp(cl.p + cl.v * k, 0, 1);
  placeClash(cl); G.lastDmgT = G.time;
  if (cl.t > CLASH.minMs) {
    if (cl.p >= 1 - CLASH.winAt) return endClash('win', 'A');
    if (cl.p <= CLASH.winAt) return endClash('win', 'B');
  }
  if (cl.e >= 1) {
    if (Math.abs(cl.p - .5) <= CLASH.drawBand) endClash('draw', null);
    else endClash('win', cl.p > .5 ? 'A' : 'B');
  }
}
function endClash(kind, win) {
  const cl = G.clash; if (!cl || cl.over) return; cl.over = true; G.clash = null;
  const bA = cl._b.A, bB = cl._b.B, x = cl.x, y = cl.y;
  if (kind === 'draw') {
    VFX.clashEnd(x, y, 'draw', '', '', bA.mv, bB.mv);
    logLine(`The beams cancel out in a huge explosion!`, 't');
    for (const b of [bA, bB]) { b.cl = 0; b.pend = false; b.t = b.life; const sd = side(b.owner); const a = Math.atan2(sd.y - y, sd.x - x); sd.kbx += Math.cos(a) * 520; sd.kby += Math.sin(a) * 520; sd.hit = 350; if (sd.cast && sd.cast._beam === b) { sd.cast.landed = false; sd.cast.t = 9999; sd.cast._beam = null; } }
    G.beams = G.beams.filter(b => b !== bA && b !== bB);
    if (G.phase === 'battle') for (const S of ['A', 'B']) { const b = S === 'A' ? bA : bB; applyHit(S, b.mv, b.u, { scale: .3 }); }   // the blast hurts both a little
    G.hudDirty = true; return;
  }
  const wb = cl._b[win], lb = cl._b[other(win)];
  VFX.clashEnd(x, y, 'win', win, other(win), wb.mv, lb.mv);
  logLine(`${wb.u.name}'s ${wb.mv.name} overpowers ${lb.u.name}'s ${lb.mv.name}!`, 't');
  lb.cl = 2; lb.pend = false; lb.from = Math.hypot(x - lb.x, y - lb.y);      // loser's beam is driven back into its owner
  wb.cl = 3; wb.pend = false;                                               // winner's beam surges through to the loser
  const lsd = side(lb.owner); if (lsd.cast && lsd.cast._beam === lb) { lsd.cast.landed = false; }
}
function driveBeamAfterClash(b, dt) {
  const k = dt / 1000, sd = side(b.owner), foe = side(other(b.owner));
  b.x = sd.x + sd.face * 18; b.y = sd.y - 32;
  if (b.cl === 2) {                                   // retreating
    b.clip -= 2600 * k; b.t = b.life * .45;
    if (b.clip <= 0) { b.cl = 0; b.t = b.life; }
  } else if (b.cl === 3) {                            // surging at the loser
    const tx = foe.x, ty = foe.y - 32, dd = Math.hypot(tx - b.x, ty - b.y);
    b.ang = Math.atan2(ty - b.y, tx - b.x); b.clip = Math.min(dd, b.clip + 2800 * k); b.t = b.life * .45;
    if (b.clip >= dd - 4) {
      b.cl = 0; b.t = b.life * .45; b.clip = 0;
      const landed = applyHit(b.owner, b.mv, b.u, { scale: 1.3 }); if (sd.cast && sd.cast._beam === b) sd.cast.landed = landed;   // an overpowered hit
      VFX.clashBreak(b.owner, b.mv);
    }
  }
}
const groupState = {};
function groupHit(p) {
  const g = groupState[p.group] || (groupState[p.group] = { hit: false, missed: 0 });
  if (g.hit && (p.shape === 'star' || p.shape === 'leaf' || p.shape === 'crescent')) return;
  g.hit = true;
  if (p.combo) p.combo.n++;
  if (p.mv.cat === 'X') applyStatusMove(p.owner, p.mv); else applyHit(p.owner, p.mv, p.u, { scale: p.scale, combo: p.combo && p.combo.n >= 2 ? p.combo.n : 0 });
}
function applyStatusMove(S, mv) {
  const fs = other(S); if (!present(fs) || G.phase !== 'battle') return false;
  const t = act(fs), e = mv.e;
  VFX.moveImpact(fs, mv);
  if ((e.tw && typeEff('Electric', t.types) === 0) || (e.powder && t.types.includes('Grass'))) { VFX.text(fs, 'NO EFFECT', '#c9d3ee'); logLine(`It doesn't affect ${t.name}...`); return true; }
  if (e.st) inflict(fs, e.st[0], true);
  if (e.cf) confuse(fs, 0, true);
  if (e.tg) stageChange(fs, e.tg);
  return true;
}
function groupMiss(p) {
  const g = groupState[p.group] || (groupState[p.group] = { hit: false, missed: 0 });
  g.missed++;
  if (!g.hit && !g.shownMiss) { g.shownMiss = true; missAt(p.x, p.y, p.owner); }
}

/* ---------- per-side update ---------- */
function updateSide(S, dt) {
  const sd = side(S), m = act(S), fs = other(S), foe = side(fs);
  sd.hit = Math.max(0, sd.hit - dt); sd.pillT = Math.max(0, sd.pillT - dt);
  sd.hop = Math.max(0, sd.hop - dt / 300);
  switch (sd.state) {
    case 'entering': sd.stateT += dt; if (sd.stateT >= 760) { sd.state = 'idle'; sd.stateT = 0; } return;
    case 'mega': sd.stateT += dt; if (sd.stateT >= 1500) { sd.state = 'idle'; sd.stateT = 0; } return;
    case 'zmove': zMoveTick(S, dt); return;
    case 'leaving': sd.stateT += dt; if (sd.stateT >= 360) completeSwitch(S); return;
    case 'fainting': sd.stateT += dt; if (sd.stateT >= 1100) { sd.state = 'out'; afterFaint(S); } return;
    case 'out': case 'wait': return;
  }
  if (G.phase !== 'battle') return;
  if (m.hp <= 0) { startFaint(S); return; }
  // timers
  const rate = clamp(.85 + effSpe(m) / 320, .85, 1.35);
  for (let i = 0; i < m.cd.length; i++) m.cd[i] = Math.max(0, m.cd[i] - dt * rate);
  sd.gcd -= dt; sd.switchCd -= dt; sd.sinceIn += dt;
  if (sd.dodgeT > 0) sd.dodgeT -= dt; if (sd.dodgeCd > 0) sd.dodgeCd -= dt;
  if (G.phase === 'battle' && !sd.zUsed) sd.zCharge = Math.min(100, (sd.zCharge || 0) + dt / 600);
  if (controlledByAI(S) && canMega(S) && act(other(S)).hp > act(other(S)).max * .3 && Math.random() < dt / aiK(S, 14000, 1500, 800)) { megaEvolve(S); return; }
  if (sd.stun > 0) { sd.stun -= dt; if (sd.stun <= 0 && sd.stunKind === 'recharge') m.vol.recharge = false; }
  statusTick(S, m, dt);
  if (m.hp <= 0) return;
  const blocked = sd.stun > 0 || m.status === 'slp' || m.status === 'frz';
  if (sd.cast && !blocked) updateCast(S, dt);
  else if (!blocked) {
    if (controlledByAI(S)) { sd.aiT -= dt; if (sd.aiT <= 0) { sd.aiT = aiK(S, 950, 180, 90) + Math.random() * aiK(S, 700, 300, 110); aiThink(S); } }
    else if (sd.queued != null) { if (tryCast(S, sd.queued) || (sd.queuedT -= dt) <= 0) sd.queued = null; }
  }
  move(S, dt, isRooted(S));
}
function statusTick(S, m, dt) {
  if (m.status === 'slp') { m.stT -= dt; if (m.stT <= 0) { m.status = ''; VFX.text(S, 'WOKE UP', '#bfffd0'); logLine(`${m.name} woke up!`); G.hudDirty = true; } }
  if (m.status === 'frz') { m.stT -= dt; m.thawT += dt; if (m.thawT >= 1000) { m.thawT = 0; if (Math.random() < .2) m.stT = 0; } if (m.stT <= 0) { m.status = ''; VFX.text(S, 'THAWED', '#bfffd0'); logLine(`${m.name} thawed out!`); G.hudDirty = true; } }
  if (m.status === 'brn' || m.status === 'psn' || m.status === 'tox') {
    m.dotT += dt;
    if (m.dotT >= 2000) {
      m.dotT -= 2000;
      const d = Math.min(m.hp, Math.max(1, Math.floor(m.max * (m.status === 'brn' ? 1 / 24 : m.status === 'psn' ? 1 / 16 : m.tox / 32))));
      if (m.status === 'tox') m.tox = Math.min(15, m.tox + 1);
      m.hp -= d; VFX.dot(S, m.status, d); G.hudDirty = true; G.lastDmgT = G.time;
    }
  }
  if (m.conf > 0) { m.conf -= dt; if (m.conf <= 0) { m.conf = 0; VFX.text(S, 'SNAPPED OUT', '#bfffd0'); logLine(`${m.name} snapped out of its confusion!`); G.hudDirty = true; } }
  if (m.item === 'Leftovers' && m.hp < m.max) { m.lefT += dt; if (m.lefT >= 3000) { m.lefT = 0; const h = Math.min(m.max - m.hp, Math.floor(m.max / 32)); m.hp += h; VFX.heal(S, h, true); G.hudDirty = true; } }
}
// Moves that can be used on the move; every other attack roots its user until it lands. Shared with online prediction.
const FREE_CAST_ANIMS = new Set(['projectile', 'drain', 'hex', 'powder', 'burst', 'stars', 'leaves', 'wind', 'multi', 'bolt', 'sky', 'psy']);
function isRooted(S) {
  const sd = side(S), m = act(S); if (!m) return true;
  return sd.stun > 0 || m.status === 'slp' || m.status === 'frz' || !!(sd.cast && sd.cast.phase !== 'after' && !FREE_CAST_ANIMS.has(sd.cast.mv.anim));
}
function move(S, dt, rooted) {
  const sd = side(S), m = act(S), foe = side(other(S)), k = dt / 1000;
  let dx = 0, dy = 0;
  if (!rooted) {
    if (!controlledByAI(S) && sd.manualT > 0) { dx = sd.manual.x; dy = sd.manual.y; sd.manualT -= dt; }
    else {
      // steer to a preferred range, strafe, avoid incoming fire and ground markers, stay off the walls
      const ax = foe.x - sd.x, ay = foe.y - sd.y, d = Math.hypot(ax, ay) || 1, ux = ax / d, uy = ay / d;
      const err = d - sd.prefDist;
      dx += ux * clamp(err / 120, -1, 1); dy += uy * clamp(err / 120, -1, 1);
      sd.strafeT -= dt; if (sd.strafeT <= 0) { sd.strafe = Math.random() < .5 ? -1 : 1; sd.strafeT = 900 + Math.random() * 1800; }
      dx += -uy * sd.strafe * .7; dy += ux * sd.strafe * .7;
      const react = (.45 + effSpe(m) / 400) * aiK(S, .1, 1, 1.6);
      for (const p of G.shots) if (p.owner !== S) { const rx = sd.x - p.x, ry = sd.y - 30 - p.y, dd = Math.hypot(rx, ry);
        if (controlledByAI(S) && dd < 120 && (p.vx * rx + p.vy * ry) > 0 && Math.random() < aiK(S, 0, .04, .3) && dodge(S, -p.vy, p.vx)) break;   /* stronger AIs dodge shots */
        if (dd < 190 && (p.vx * rx + p.vy * ry) > 0) { const s2 = (p.vx * ry - p.vy * rx) > 0 ? 1 : -1; dx += (-p.vy / p.speed) * s2 * 2.2 * react; dy += (p.vx / p.speed) * s2 * 2.2 * react; } }
      for (const mk of G.marks) if (mk.owner !== S) { const rx = sd.x - mk.x, ry = sd.y - mk.y, dd = Math.hypot(rx, ry); if (dd < mk.r + 30) { dx += rx / (dd || 1) * 2 * react; dy += ry / (dd || 1) * 2 * react; } }
      const cx = (BOUND.x0 + BOUND.x1) / 2, cy = (BOUND.y0 + BOUND.y1) / 2;
      for (const [ex, ey] of [[60, 0], [-60, 0], [0, 50], [0, -50]]) if (!inWalk(sd.x + ex, sd.y + ey)) { dx -= ex / 60 * .9; dy -= ey / 50 * .9; }
      if (!inWalk(sd.x + ux * 80, sd.y + uy * 80)) { dx += (cx - sd.x) / 300; dy += (cy - sd.y) / 200; }
      if (m.conf > 0) { dx += Math.sin(G.time / 170 + 1) * .8; dy += Math.cos(G.time / 230) * .8; }
    }
  }
  const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
  const speed = clamp(70 + effSpe(m) * .95, 60, 250);
  const blend = 1 - Math.exp(-dt / 110);
  sd.vx += (dx * speed - sd.vx) * blend; sd.vy += (dy * speed - sd.vy) * blend;
  sd.x += (sd.vx + sd.kbx) * k; sd.y += (sd.vy + sd.kby) * k;
  const damp = Math.exp(-dt / 120); sd.kbx *= damp; sd.kby *= damp;
  [sd.x, sd.y] = clampWalk(sd.x, sd.y);
  if (foe.state === 'idle') { const d = dist(sd, foe); if (d < TOUCH && d > 0) { const push = (TOUCH - d) / 2; sd.x += (sd.x - foe.x) / d * push; sd.y += (sd.y - foe.y) / d * push; } }
  [sd.x, sd.y] = clampWalk(sd.x, sd.y);
  const sp = Math.hypot(sd.vx, sd.vy); sd.walk += sp * k;
  if (!sd.cast || sd.cast.phase === 'after') sd.face = foe.x >= sd.x ? 1 : -1;
  else if (Math.abs(sd.vx) > 20) sd.face = sd.vx > 0 ? 1 : -1;
  if (sp > 150 && Math.random() < dt / 90) VFX.dust(S);
}

/* ---------- AI ---------- */
function scoreMove(u, t, name, d) {
  const mv = MOVES[name], e = mv.e;
  if (mv.cat === 'X') {
    if (e.none) return .01;
    if (e.heal) return u.hp / u.max < .45 ? .7 : 0;
    if (e.rest) return u.hp / u.max < .3 && !u.status ? .75 : 0;
    if (e.st) { if (t.status || statusImmune(t, e.st[0]) || (e.tw && typeEff('Electric', t.types) === 0) || (e.powder && t.types.includes('Grass'))) return 0; return .4 * (mv.acc || 100) / 100; }
    if (e.cf) return t.conf > 0 ? 0 : .3;
    if (e.tg) return .16;
    if (e.self) { const k = Object.keys(e.self)[0]; return u.stages[k] >= 2 || u.hp / u.max < .55 ? .03 : .45; }
    return .05;
  }
  const eff = typeEff(mv.type, t.types); if (eff === 0) return 0;
  const dmg = e.fix ? e.fix * HP_MULT : calcDamage(u, t, mv, false, eff, false) * (e.hits ? 3 : 1);
  let v = Math.min(1, dmg / Math.max(1, t.hp)) * ((mv.acc ?? 100) / 100) + dmg / t.max * .5;
  if (dmg >= t.hp) v += .6;
  if (['contact', 'dash', 'slash', 'dig'].includes(mv.anim)) v *= d < 160 ? 1.15 : .9;
  if (e.rch) v *= .75;
  if (e.rc) v *= .9;
  return v;
}
function aiThink(S) {
  const sd = side(S), u = act(S), fs = other(S);
  if (!present(fs)) return;
  const t = act(fs), d = dist(sd, side(fs));
  const all = u.moves.map((n, i) => ({ i, v: scoreMove(u, t, n, d) + Math.random() * aiK(S, 1.2, .08, 0) }));
  const best = all.slice().sort((a, b) => b.v - a.v)[0];
  sd.prefDist = (['contact', 'dash', 'slash', 'dig'].includes(MOVES[u.moves[best.i]].anim) ? 70 : 250 + (u.stats.spe > 90 ? 60 : 0)) + (Math.random() - .5) * aiK(S, 220, 0, 0);
  const ready = all.filter(x => u.cd[x.i] <= 0).sort((a, b) => b.v - a.v);
  // switch out of a hopeless matchup now and then
  if (S === 'B' || G.auto) {
    const weak = u.moves.every(n => MOVES[n].cat === 'X' || typeEff(MOVES[n].type, t.types) < 1);
    if (weak && sd.switchCd <= 0 && u.hp / u.max > .4 && Math.random() < aiK(S, 0, .06, .2)) { const alt = bestSwitchFor(S); if (alt != null) { requestSwitch(S, alt); return; } }
  }
  if (!ready.length || ready[0].v < .04) return;
  if (Math.random() < aiK(S, .45, 0, 0)) return;                     // weaker AIs hesitate
  const pick = (Math.random() < aiK(S, .35, .8, .98) || ready.length < 2) ? ready[0] : ready[1];
  tryCast(S, pick.i);
}
function bestSwitchFor(S) {
  const foe = act(other(S)); let best = null, bestV = -Infinity;
  side(S).team.forEach((m, i) => {
    if (m.hp <= 0 || i === side(S).active) return;
    const off = Math.max(0, ...m.moves.map(n => MOVES[n].cat === 'X' ? 0 : typeEff(MOVES[n].type, foe.types)));
    const def = Math.max(0, ...foe.moves.map(n => MOVES[n].cat === 'X' ? 0 : typeEff(MOVES[n].type, m.types)));
    const v = off * 2 - def + m.hp / m.max;
    if (v > bestV) { bestV = v; best = i; }
  });
  return best;
}

/* ---------- Mega Evolution (once per side per battle) ---------- */
const displayName = m => (m.mega ? 'MEGA ' : '') + m.name.toUpperCase();
/* ---------- Z-Moves: once per side per battle, when the Z gauge is full ----------
   Each Pokémon's Z-Move is the official one for the type of its strongest attacking move; the Gen 1 Pokémon with
   exclusive Z-Moves use theirs. The opponent is frozen for the cinematic, then takes 25–60% of its max HP
   (type matchups still apply). */
const Z_EXCLUSIVE = { Pikachu: ['Catastropika', 'Electric'], Raichu: ['Stoked Sparksurfer', 'Electric'], Eevee: ['Extreme Evoboost', 'Normal'], Snorlax: ['Pulverizing Pancake', 'Normal'], Mew: ['Genesis Supernova', 'Psychic'] };
const Z_BY_TYPE = { Normal: 'Breakneck Blitz', Fire: 'Inferno Overdrive', Water: 'Hydro Vortex', Grass: 'Bloom Doom', Electric: 'Gigavolt Havoc', Ice: 'Subzero Slammer', Fighting: 'All-Out Pummeling', Poison: 'Acid Downpour', Ground: 'Tectonic Rage', Flying: 'Supersonic Skystrike', Psychic: 'Shattered Psyche', Bug: 'Savage Spin-Out', Rock: 'Continental Crush', Ghost: 'Never-Ending Nightmare', Dragon: 'Devastating Drake', Dark: 'Black Hole Eclipse', Steel: 'Corkscrew Crash', Fairy: 'Twinkle Tackle' };
function zMoveOf(m) {
  if (Z_EXCLUSIVE[m.name]) { const [name, type] = Z_EXCLUSIVE[m.name]; return { name, type, exclusive: true }; }
  // its primary type if it knows an attack of that type; otherwise its strongest same-type attack; otherwise its strongest attack
  const atk = m.moves.map(n => MOVES[n]).filter(mv => mv && mv.cat !== 'X' && (mv.pow || 0) > 0).sort((x, y) => y.pow - x.pow);
  const pick = atk.find(mv => mv.type === m.types[0]) || atk.find(mv => m.types.includes(mv.type)) || atk[0];
  const type = pick && Z_BY_TYPE[pick.type] ? pick.type : m.types[0];
  return { name: Z_BY_TYPE[type] || 'Breakneck Blitz', type };
}
const Z_ANIM = 4300, Z_HIT = 3700;      // cinematic (≈1.6 s), then the in-arena final smash; the hit lands at its climax
function canZ(S) { const sd = side(S), m = act(S); return !!G && G.phase === 'battle' && !m.zUsed && sd.zCharge >= 100 && sd.state === 'idle' && !sd.cast && sd.stun <= 0 && m.hp > 0 && present(other(S)); }
function zMove(S) {
  if (!canZ(S)) return false;
  const sd = side(S), m = act(S), fs = other(S), z = zMoveOf(m);
  m.zUsed = true; sd.zCharge = 0; sd.zInfo = z; sd.zHit = false; sd.state = 'zmove'; sd.stateT = 0;   // each Pokémon gets one Z-Move per battle
  cancelCast(fs); side(fs).stun = Math.max(side(fs).stun, Z_ANIM); side(fs).vx = side(fs).vy = 0;
  logLine(`${m.name} unleashed its full-force Z-Move: ${z.name}!`, 't'); VFX.zStart(S, m.name, z.name, z.type); G.hudDirty = true; return true;
}
function zMoveTick(S, dt) {
  const sd = side(S); sd.stateT += dt; sd.vx = sd.vy = 0;
  if (!sd.zHit && sd.stateT >= Z_HIT) {
    sd.zHit = true; const u = act(S), z = sd.zInfo;
    const mv = { name: z.name, type: z.type, pow: 220, cat: u.stats.atk >= u.stats.spa ? 'P' : 'S', e: {}, anim: 'beam' };
    const fsd = side(other(S)); fsd.dodgeT = 0; fsd.dig = false;          // a Z-Move always hits
    sd.state = 'idle'; applyHit(S, mv, u, { z: true, floor: .25, cap: .5 }); if (sd.state === 'idle') sd.state = 'zmove';
    VFX.zImpact(S, z.type);
  }
  if (sd.stateT >= Z_ANIM) { sd.state = 'idle'; sd.stateT = 0; sd.zInfo = null; }
}
function canMega(S) { return canZ(S); }
function megaEvolve(S) { return zMove(S); }

/* ---------- Dodge: a quick dash in the direction you are moving, with a brief moment of invulnerability ---------- */
const DODGE_CD = 1400, DODGE_IFRAMES = 280;
function canDodge(S) { const sd = side(S), m = act(S); return !!G && G.phase === 'battle' && !(G.clash && inClash(S)) && sd.state === 'idle' && !(sd.dodgeCd > 0) && sd.stun <= 0 && m && m.hp > 0 && m.status !== 'slp' && m.status !== 'frz'; }
function dodge(S, dx, dy) {
  if (!canDodge(S)) return false;
  const sd = side(S); dx = +dx || 0; dy = +dy || 0; let l = Math.hypot(dx, dy);
  if (l < .05) { dx = sd.vx; dy = sd.vy; l = Math.hypot(dx, dy); }                          // moving: dodge that way
  if (l < 5) { const t = side(other(S)); dx = sd.x - t.x; dy = sd.y - t.y; l = Math.hypot(dx, dy) || 1; }   // standing still: hop away from the opponent
  if (sd.cast && sd.cast.phase === 'wind') cancelCast(S);
  sd.kbx += dx / l * 760; sd.kby += dy / l * 760; sd.dodgeT = DODGE_IFRAMES; sd.dodgeCd = DODGE_CD;
  VFX.dodge(S, dx / l, dy / l); return true;
}

/* ---------- switching, fainting, ending ---------- */
function requestSwitch(S, idx) {
  const sd = side(S);
  if (G.phase !== 'battle' || sd.state !== 'idle' || sd.cast || sd.switchCd > 0 || sd.stun > 0) return false;
  if (idx === sd.active || !sd.team[idx] || sd.team[idx].hp <= 0) return false;
  sd.state = 'leaving'; sd.stateT = 0; sd.pendingSwitch = idx; sd.switchCd = 5000;
  logLine(`${TEAM_NAME[S]} recalled ${act(S).name}!`);
  return true;
}
function resetOnLeave(m) { m.stages = zeroStages(); m.conf = 0; m.vol.recharge = false; if (m.status === 'tox') m.tox = 1; }
function completeSwitch(S) { const sd = side(S); resetOnLeave(act(S)); spawnIn(S, sd.pendingSwitch); sd.pendingSwitch = null; }
function spawnIn(S, idx) {
  const sd = side(S); sd.active = idx; sd.state = 'entering'; sd.stateT = 0; sd.cast = null; sd.stun = 0; sd.gcd = 600; sd.dig = false;
  sd.x = ENTRY[S].x; sd.y = ENTRY[S].y + (Math.random() - .5) * 80; sd.vx = sd.vy = sd.kbx = sd.kby = 0; sd.throwT = G.time; sd.aiT = 700;
  sd.face = S === 'A' ? 1 : -1;
  logLine(`${TEAM_NAME[S]} sent out ${act(S).name}!`); G.hudDirty = true; sd.sinceIn = 0;
  if (typeof VFX !== 'undefined') VFX.call(S, `Go, ${act(S).name}!`);
  if (typeof VFX !== 'undefined') VFX.sendOut(S);
}
function startFaint(S) {
  const sd = side(S), m = act(S);
  sd.state = 'fainting'; sd.stateT = 0; sd.cast = null; sd.dig = false; m.status = ''; m.conf = 0; m.vol.recharge = false;
  logLine(`${m.name} fainted!`); VFX.faint(S); G.hudDirty = true;
}
function teamAlive(S) { return side(S).team.some(m => m.hp > 0); }
function afterFaint(S) {
  if (!teamAlive(S)) { endBattle(teamAlive(other(S)) ? other(S) : 'draw'); return; }
  if (controlledByAI(S)) {
    const healthy = side(S).team.map((m, i) => (m.hp > 0 ? i : -1)).filter(i => i >= 0);
    const sloppy = healthy.length && Math.random() < aiK(S, .85, 0, 0);
    spawnIn(S, sloppy ? healthy[Math.floor(Math.random() * healthy.length)] : bestSwitchFor(S));
  }
  else { side(S).state = 'wait'; G.phase = 'pick'; if (typeof onNeedPick === 'function') onNeedPick(); }
}
function decideByHp(reason) {
  const pct = s => side(s).team.reduce((a, m) => a + m.hp / m.max, 0);
  const a = pct('A'), b = pct('B'); G.decision = reason;
  return Math.abs(a - b) < .001 ? 'draw' : a > b ? 'A' : 'B';
}
function endBattle(w, big) {
  if (G.clash) { G.clash.over = true; G.clash = null; } G.beams = G.beams.filter(b => !b.cl);   // a beam lock never outlives the battle
  if (G.phase === 'over') return;
  G.phase = 'over'; G.winner = w; G.shots.length = G.marks.length = G.waves.length = 0;
  logLine(w === 'draw' ? 'The battle ended in a draw!' : `${TEAM_NAME[w]} wins the battle!`, 't');
  if (typeof onBattleEnd === 'function') onBattleEnd(w, big);
}
function simStep(dt) {
  if (!G || G.phase === 'pick' || G.phase === 'over' || G.phase === 'title') return;
  G.time += dt; if (G.phase === 'battle') G.elapsed += dt;
  updateSide('A', dt); updateSide('B', dt);
  if (G.phase === 'battle') {
    updateWorld(dt);
    // Sudden Death: after 5:00, damage grows 25% every 30 seconds; at 10:00 the battle is decided on HP
    if (G.elapsed > 300000) { const od = 1 + Math.floor((G.elapsed - 300000) / 30000 + 1) * .25; if (od !== G.overtime) { if (!G.overtime) { VFX.big('SUDDEN DEATH!', '#ff6a5a'); logLine('Sudden Death! Damage keeps rising until someone falls.', 't'); } G.overtime = od; } }
    // No-damage rule: 30 s against the AI (online battles allow longer), with a warning 10 s before it ends the battle
    const staleMs = G.staleMs || 30000, quiet = G.time - G.lastDmgT;
    if (quiet < 1000) G.staleWarned = false;
    if (G.elapsed > 600000) endBattle(decideByHp('Ten-minute limit reached. Decided by remaining HP.'), 'TIME!');
    else if (quiet > staleMs) endBattle(decideByHp(`No damage for ${Math.round(staleMs / 1000)} seconds. Decided by remaining HP.`), 'STALEMATE');
    else if (G.timeLimit && G.elapsed / 1000 >= G.timeLimit) endBattle(decideByHp('Time limit reached. Decided by remaining HP.'), 'TIME!');
    else if (!G.staleWarned && quiet > staleMs - 10000) { G.staleWarned = true; VFX.big('ATTACK — 10 SECONDS!', '#ffd84a'); logLine('No damage for a while. The battle ends in 10 seconds unless someone lands a hit.', 't'); }
  }
}
