/* =====================================================================
   Section 32: story milestone 2
   - The Silph Co. branch (before Sabrina): stop Team Rocket (a three-fight
     survival gauntlet, no healing between) or join them (3v3 against
     Officer Jenny) — joining puts Professor Oak in the Viridian gym as an
     alternate 8th leader in place of Giovanni
   - Mixed formats: a 1v1 duel (before Misty) and a puzzle battle with a
     fixed team (before Erika)
   - AI personalities per trainer (aggressive, switch-heavy, status, defensive)
   - Badge passives: each badge adds a small, permanent bonus in story battles
   - Trainers with a back sprite (<Name>_back_trainer.png) turn around to throw
   ===================================================================== */
(function storyMilestone2() {
  if (typeof STORY === 'undefined' || !window.STORY_DATA) return;
  const $ = id => document.getElementById(id);
  const D = STORY_DATA, esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const sv = () => STORY.save;
  const fileFor = (keys, fallback) => (typeof ALL_TRAINERS !== 'undefined' && ALL_TRAINERS.find(n => keys.includes(trainerKey(n)))) || fallback;

  /* ---------- personalities and badge passives ---------- */
  const STYLE = { 1: 'defensive', 2: 'aggro', 3: 'aggro', 4: 'status', 5: 'status', 6: 'switcher', 7: 'aggro', 8: 'defensive', 9: 'aggro', 10: 'switcher', oak: 'switcher' };
  const STYLE_NAME = { aggro: 'Aggressive — all-out attacks, up close', switcher: 'Switch-heavy — swaps out of bad matchups', status: 'Status — poisons, puts to sleep, keeps away', defensive: 'Defensive — sets up and walls from range' };
  const BADGE_BONUS = [{ def: 1.03, t: '+3% Defense' }, { hp: 1.03, t: '+3% HP' }, { spe: 1.03, t: '+3% Speed' }, { spd: 1.03, t: '+3% Sp. Def' },
    { atk: 1.03, t: '+3% Attack' }, { spa: 1.03, t: '+3% Sp. Atk' }, { atk: 1.02, spa: 1.02, t: '+2% Attack & Sp. Atk' }, { hp: 1.02, atk: 1.02, def: 1.02, spa: 1.02, spd: 1.02, spe: 1.02, t: '+2% all stats' }];
  const bonusNow = () => { const n = Math.min(8, (sv() && sv().badges) || 0), out = {}; for (let k = 0; k < n; k++) for (const s in BADGE_BONUS[k]) if (s !== 't') out[s] = (out[s] || 1) * BADGE_BONUS[k][s]; return out; };
  window.storyRuleExtras = g => ({ aiStyle: g && g.rival ? 'switcher' : (g && (g.style || STYLE[g.rulesKey || g.n])) || null, bonus: bonusNow() });

  /* ---------- Professor Oak: the alternate 8th gym leader ---------- */
  const GIOVANNI = GYMS[7];
  const OAK = Object.assign({}, GIOVANNI, { leader: 'Professor Oak', file: 'Professor_Oak', rulesKey: 'oak', type: 'Normal',
    team: ['Tauros', 'Exeggutor', 'Arcanine', 'Gyarados', 'Lapras', 'Dragonite'],
    hello: 'I gave you your first Pokémon. I never imagined I’d have to take your badge case back.',
    win: 'Go home and think about what kind of trainer you want to be.', lose: '…You’ve grown strong, whatever side you’re on. Take the Earth Badge.' });
  D.RULES.oak = { handicap: 5, title: 'Final exam', text: 'Oak tests everything you know: you may bring only five Pokémon, and he switches to cover every weakness.' };
  D.SCRIPT.gym.oak = [['foe', 'So it’s true. You joined Team Rocket.'], ['foe', 'Giovanni wants my research? Then you’ll have to take it from me — in battle.'], ['me', 'I’m sorry, Professor. Let’s battle.']];
  const applyBranch = () => { const s = sv(); GYMS[7] = s && s.branch === 'rocket' ? OAK : GIOVANNI; };
  window.applyStoryBranch = applyBranch;

  /* ---------- events (before gyms 2, 4 and 6) ---------- */
  const EV = {
    1: { id: 'duel', title: 'Nugget Bridge duel', format: '1v1', name: 'Cooltrainer', keys: ['cooltrainermale', 'cooltrainerm', 'cooltrainerboy', 'acetrainermale', 'acetrainerm'], team: ['Nidorino'], style: 'aggro', arena: 'cerulean',
      text: 'A 1v1 duel: your lead Pokémon against his. No switching — whoever falls first loses.',
      before: [['foe', 'Five trainers guard this bridge, and I’m the last. One Pokémon each — no switching, no excuses!'], ['me', 'My lead is ready.']],
      win: [['foe', 'Clean win. You earned the crossing.']], lose: [['foe', 'Not good enough to cross. Train up and try again!']] },
    3: { id: 'puzzle', title: 'Cerulean Cape puzzle', format: 'puzzle', name: 'Swimmer', keys: ['swimmer', 'swimmermale', 'swimmerm'], team: ['Starmie'], fixedTeam: ['Golduck', 'Poliwhirl', 'Wartortle', 'Pikachu'], foeScale: 1.6, style: 'defensive', arena: 'cerulean',
      text: 'Puzzle battle: your team is fixed. Only one of these four can really beat his Starmie — find the winning line.',
      before: [['foe', 'My Starmie has never lost here. I’ll even lend you a team — let’s see if you can solve it.'], ['me', 'A puzzle? I’m in.']],
      win: [['foe', 'You found it! Electricity cuts right through water.']], lose: [['foe', 'Not quite. Think about what Starmie fears… and try again.']] },
    5: { id: 'silph', branch: true, title: 'Silph Co.', arena: 'skyfort' }
  };
  const GAUNTLET = [
    { name: 'Rocket Grunt', keys: ['rocketgrunt', 'teamrocketgrunt', 'grunt', 'rocketgruntmale', 'rocketgruntm'], team: ['Rattata', 'Zubat', 'Ekans'], style: 'aggro' },
    { name: 'Rocket Grunt', keys: ['rocketgruntfemale', 'rocketgruntf', 'rocketgrunt', 'teamrocketgrunt', 'grunt'], team: ['Koffing', 'Raticate', 'Golbat'], style: 'aggro' },
    { name: 'Rocket Admin', keys: ['rocketadmin', 'archer', 'admin', 'teamrocketadmin'], team: ['Arbok', 'Weezing', 'Persian'], style: 'status' }
  ];
  const JENNY = { name: 'Officer Jenny', keys: ['officerjenny', 'jenny', 'policeofficer'], team: ['Growlithe', 'Machoke', 'Arcanine'], style: 'defensive', format: '3v3' };
  const GIOVANNI_WHO = { file: 'Giovanni', leader: 'Giovanni' };
  const SC = {
    offer: [['foe', 'So you’re the trainer who keeps showing up where Team Rocket does business.'], ['foe', 'Silph Co. is mine. Join me, and you’ll have power those gym leaders can only dream of. Refuse, and my grunts will deal with you.']],
    hero: [['me', 'Never. I’m taking Silph Co. back.'], ['foe', 'Then you’ll have to get through my grunts — one after another, with no rest between.']],
    rocket: [['me', '…I’m in.'], ['foe', 'Wise. Prove it: Officer Jenny is downstairs. Make sure she doesn’t leave.']],
    next: [['foe', 'Don’t think you’re done! Next!']],
    heroWin: [['foe', 'Impossible… This isn’t the last you’ll see of Team Rocket.']],
    rocketWin: [['foe', 'Excellent. Now go to Viridian. Your final badge is waiting — and so is a familiar face.']],
    lose: [['foe', 'Pathetic. Come back when you’re worth my time.']]
  };
  const evs = () => { const s = sv(); s.events = s.events || {}; return s.events; };
  const whoOf = spec => ({ file: fileFor(spec.keys || [], (spec.name || 'Trainer').replace(/\s+/g, '_')), leader: spec.name });

  function choose(question, options) {
    return new Promise(done => {
      const ov = $('csOv'); STORY.cutscene = true;
      ov.innerHTML = `<div class="box" style="text-align:center"><div class="txt" style="margin-bottom:12px">${esc(question)}</div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">${options.map((o, k) => `<button class="sy-btn${k ? '' : ' go'}" type="button" data-k="${k}" style="min-width:200px">${esc(o.label)}<br><small style="font-weight:600;opacity:.8">${esc(o.sub)}</small></button>`).join('')}</div></div>`;
      ov.classList.add('show'); ov.onclick = e => { const b = e.target.closest('button[data-k]'); if (!b) return; ov.classList.remove('show'); ov.innerHTML = ''; ov.onclick = null; STORY.cutscene = false; done(options[+b.dataset.k].value); };
    });
  }

  function startEventBattle(i, spec, extra = {}) {
    const s = sv(), g = gymAt(i), who = whoOf(spec), fmt = extra.format || spec.format;
    STORY.battle = { gym: i, event: extra.id || EV[i].id, stage: extra.stage, level: Math.max(1, (g.ai || g.n) - 1), practice: false, spec };
    STORY.nextRules = { foeScale: D.diff().scale * (spec.foeScale || 1), aiStyle: spec.style, bonus: bonusNow(),
      handicap: fmt === '1v1' ? 1 : fmt === '3v3' ? 3 : null, fixedTeam: spec.fixedTeam || null, carry: extra.carry || null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = who.file; loadTrainer(s.trainer); loadTrainer(who.file);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), spec.team.slice(), EV[i].arena || g.arena);
    STORY.battle.G = G;
  }
  async function startEvent(i) {
    const ev = EV[i], s = sv();
    if (ev.branch) {
      if (!s.branch) {
        await playScene(SC.offer, GIOVANNI_WHO);
        s.branch = await choose('Giovanni is waiting for your answer.', [{ label: 'Stop Team Rocket', sub: 'Fight through three Rocket battles — no healing', value: 'hero' }, { label: 'Join Team Rocket', sub: 'Your 8th gym leader becomes Professor Oak', value: 'rocket' }]);
        saveStory(); applyBranch();
        await playScene(s.branch === 'hero' ? SC.hero : SC.rocket, GIOVANNI_WHO);
      }
      if (s.branch === 'hero') { STORY.gauntlet = { k: 0 }; return startEventBattle(i, GAUNTLET[0], { id: 'silph', stage: 0, format: 'gauntlet' }); }
      return startEventBattle(i, JENNY, { id: 'silph', format: '3v3' });
    }
    await playScene(ev.before, whoOf(ev), { title: ev.title, text: ev.text });
    return startEventBattle(i, ev);
  }
  async function eventResult(won, b) {
    const s = sv(), BG = b.G; STORY.battle = null; STORY.nextRules = null;
    showOverlay('ovResults', false);
    const ev = EV[b.gym], key = 'e' + b.event;
    // stars: win · no faints · under par (the gauntlet scores its final fight)
    let earned = 0; if (won && BG) { earned = 1; if (!BG.sides.A.team.some(m => m.hp <= 0)) earned++; if (BG.elapsed / 1000 <= D.PAR(Math.min(10, b.gym + 1))) earned++; }
    if (b.event === 'silph' && s.branch === 'hero' && won && b.stage < GAUNTLET.length - 1) {       // the gauntlet goes on, no healing
      const carry = BG.sides.A.team.map(m => Math.max(0, m.hp / m.max));
      await playScene(SC.next, whoOf(GAUNTLET[b.stage + 1]));
      return startEventBattle(b.gym, GAUNTLET[b.stage + 1], { id: 'silph', stage: b.stage + 1, format: 'gauntlet', carry });
    }
    if (won) { evs()[b.event] = true; s.stars = s.stars || {}; if (earned > (s.stars[key] || 0)) s.stars[key] = earned; }
    saveStory(); openStoryScreen();
    if (b.event === 'silph') await playScene(won ? (s.branch === 'hero' ? SC.heroWin : SC.rocketWin) : SC.lose, s.branch === 'hero' ? GIOVANNI_WHO : whoOf(JENNY));
    else await playScene(won ? ev.win : ev.lose, whoOf(ev));
    try { renderStory(); openGymCard(b.gym); } catch (e) { }
  }

  /* ---------- wrap the story flow ---------- */
  const _sg = startGymBattle;
  startGymBattle = async function (i) {
    applyBranch(); if (STORY.cutscene) return;
    const s = sv(), g = gymAt(i);
    if (s && i === s.badges && !g.secret && EV[i] && !evs()[EV[i].id]) { closeModal(); return startEvent(i); }
    return _sg.apply(this, arguments);
  };
  const _res = storyResult;
  storyResult = function (won) { const b = STORY.battle; if (b && b.event) return eventResult(won, b); return _res.apply(this, arguments); };
  const _render = renderStory;
  renderStory = function () { applyBranch(); return _render.apply(this, arguments); };
  const _card = openGymCard;
  openGymCard = function (i) {
    applyBranch(); const r = _card.apply(this, arguments);
    try { const s = sv(), g = gymAt(i), extra = document.querySelector('#syModal .sy-extra'); if (!s || !extra || g.secret) return r;
      const ev = EV[i], pending = i === s.badges && ev && !evs()[ev.id], st = STYLE[g.rulesKey || g.n], bon = BADGE_BONUS.slice(0, Math.min(8, s.badges)).map(x => x.t);
      const d = document.createElement('div');
      d.innerHTML = `${pending ? `<div><b>★ Event first: ${esc(ev.title)}</b> — ${esc(ev.branch ? (s.branch ? (s.branch === 'hero' ? 'Fight through three Rocket battles, no healing between.' : '3v3 against Officer Jenny.') : 'Giovanni has an offer for you… your answer changes the story.') : ev.text)} <button class="sy-btn" type="button" id="syEvSkip" style="padding:3px 10px;font-size:11px;margin-left:6px">Skip event</button></div>` : ''}
        ${s.branch ? `<div>Path: <b>${s.branch === 'hero' ? 'Stopping Team Rocket' : 'Team Rocket'}</b></div>` : ''}
        ${st ? `<div>${esc(g.leader)}’s style: <b>${esc(STYLE_NAME[st])}</b></div>` : ''}
        <div>Badge bonuses: ${bon.length ? bon.map(esc).join(' · ') : '<i>none yet — each badge adds one</i>'}</div>`;
      extra.appendChild(d);
      const skip = $('syEvSkip'); if (skip) skip.onclick = async () => { if (ev.branch && !s.branch) { closeModal(); await playScene(SC.offer, GIOVANNI_WHO); s.branch = await choose('Giovanni is waiting for your answer.', [{ label: 'Stop Team Rocket', sub: 'Giovanni stays the 8th gym leader', value: 'hero' }, { label: 'Join Team Rocket', sub: 'Your 8th gym leader becomes Professor Oak', value: 'rocket' }]); applyBranch(); }
        evs()[ev.id] = true; saveStory(); renderStory(); openGymCard(i); };
    } catch (e) { console.error(e); }
    return r;
  };

  /* ---------- back sprites: trainers turn around to throw ---------- */
  const throwUntil = {};
  if (typeof VFX !== 'undefined' && VFX.sendOut) { const _so = VFX.sendOut.bind(VFX); VFX.sendOut = function (S) { throwUntil[slotTeam(S)] = clock.t + 650; const n = TRSEL[slotTeam(S)]; if (n) loadTrainer(n + '_back'); return _so.apply(this, arguments); }; }
  window.trainerOverride = S => { const n = TRSEL[S]; return n && clock.t < (throwUntil[S] || 0) && TR_ANIM[n + '_back'] ? TR_ANIM[n + '_back'] : null; };
  applyBranch();
})();
