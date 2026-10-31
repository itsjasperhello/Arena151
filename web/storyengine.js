/* =====================================================================
   Section 31: story engine (milestone 1)
   - JSON-driven cutscenes with portraits before story fights
   - Gary's rival arc: fights before gyms 3, 5 and 7; his team grows with
     yours; his lines shift from cocky to bitter with your record vs him
   - Boss twists: each gym leader adds a rule (permanent weather, banned
     move types for the challenger, or a handicap: bring only 3 or 4)
   - Stars per fight: win · no faints · under par time (best kept)
   - Difficulty: Story / Normal / Hard (AI skill and opponent stats)
   ===================================================================== */
(function storyEngine() {
  if (typeof STORY === 'undefined' || typeof GYMS === 'undefined') return;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- data ---------- */
  const RULES = {
    1: { weather: 'sand', title: 'Sandstorm', text: 'A permanent SANDSTORM chips every Pokémon that isn’t Rock, Ground or Steel.' },
    2: { weather: 'rain', title: 'Downpour', text: 'Permanent RAIN: Water moves hit 50% harder, Fire moves 50% weaker.' },
    3: { banA: ['Ground'], title: 'Insulated floor', text: 'Your GROUND moves are banned in Surge’s gym.' },
    4: { weather: 'sun', title: 'Greenhouse sun', text: 'Permanent HARSH SUN: Fire moves hit 50% harder, Water moves 50% weaker.' },
    5: { handicap: 3, title: 'Ninja ambush', text: 'Koga’s trap: you may bring only your first THREE Pokémon against his six.' },
    6: { banA: ['Bug', 'Ghost'], title: 'Mind barrier', text: 'Sabrina’s psychic barrier bans your BUG and GHOST moves.' },
    7: { weather: 'sun', banA: ['Water'], title: 'Volcano', text: 'HARSH SUN blazes, and your WATER moves evaporate — they’re banned.' },
    8: { weather: 'sand', handicap: 4, title: 'Earthquake', text: 'A SANDSTORM rages and Giovanni allows only your first FOUR Pokémon.' },
    9: { weather: 'hail', title: 'Dragon’s blizzard', text: 'Permanent HAIL chips every Pokémon that isn’t Ice.' }
  };
  const GARY = GYMS.find(g => g.n === 10) || { file: 'Gary', leader: 'Gary' };
  const RIVAL_AT = { 2: 0, 4: 1, 6: 2 };   // before gym index 2, 4 and 6 (Lt. Surge, Koga, Blaine): rival fights 1, 2, 3
  const RIVAL_BASE = [
    ['Pidgeotto', 'Abra', 'Rattata', '*1'],
    ['Pidgeotto', 'Kadabra', 'Rhyhorn', 'Exeggcute', '*2'],
    ['Pidgeot', 'Alakazam', 'Rhydon', 'Exeggutor', 'Gyarados', '*2']
  ];
  const PAR = n => 110 + n * 10;   // seconds for the speed star
  const DIFF = { story: { name: 'Story', ai: -2, scale: .92 }, normal: { name: 'Normal', ai: 0, scale: 1 }, hard: { name: 'Hard', ai: 2, scale: 1.08 } };
  // the scripts (who: 'me' = you, 'foe' = the opponent) — short scenes, two or three lines each
  const SCRIPT = {
    gym: {
      1: [['foe', 'So you’re the new challenger. Feel that wind? My gym’s sandstorm never stops.'], ['me', 'A little sand won’t slow us down.']],
      2: [['foe', 'It’s pouring in here, and that’s how I like it. My Water Pokémon love the rain!'], ['me', 'Then we’ll just have to make a splash.']],
      3: [['foe', 'Hah! You think your Ground tricks work here? My floor’s insulated, kid. No Ground moves!'], ['me', 'We don’t need tricks to beat you.']],
      4: [['foe', 'Feel the sunlight in my garden? My Grass Pokémon bloom brightest in it.'], ['me', 'We’ll be careful not to get burned.']],
      5: [['foe', 'Fwahaha! You walked into my trap. Only three of your Pokémon may follow you in.'], ['me', 'Three will be enough.']],
      6: [['foe', 'I foresaw your arrival… and your Bug and Ghost moves. They won’t pass my barrier.'], ['me', 'Then we’ll find another way through.']],
      7: [['foe', 'Hah! Welcome to my volcano, where Water boils away before it lands!'], ['me', 'Turn up the heat — we’re ready.']],
      8: [['foe', 'So you made it this far. In my gym the ground itself fights you. Bring four. No more.'], ['me', 'Four is all I need to stop you.']],
      9: [['foe', 'Feel that cold? Dragons fear nothing — not even the blizzard I fight in.'], ['me', 'Then let’s see who freezes first.']]
    },
    rival: {   // [encounter][mood] — before; after: win / lose
      before: [
        { cocky: [['foe', 'Hey! Smell ya later? Nah — smell ya NOW. Let’s see if you’ve learned anything.'], ['me', 'Gary… fine, let’s go.']],
          rattled: [['foe', 'You again. That last win was luck, and you know it.'], ['me', 'Want to find out?']],
          bitter: [['foe', 'You… always one step ahead. Not this time.'], ['me', 'Let’s battle, Gary.']] },
        { cocky: [['foe', 'Still collecting badges? Cute. I’ve got twice as many already.'], ['me', 'Badges don’t battle. Pokémon do.']],
          rattled: [['foe', 'I’ve been training non-stop since you beat me. My team’s evolved — have you?'], ['me', 'See for yourself.']],
          bitter: [['foe', 'Everyone keeps talking about YOU. The kid who beats Gary. I’m sick of it.'], ['me', 'Then let your Pokémon do the talking.']] },
        { cocky: [['foe', 'One more gym and you’ll finally see what a real trainer looks like. Me.'], ['me', 'Big talk. Let’s go.']],
          rattled: [['foe', 'Okay. No more games. This is my real team.'], ['me', 'Bring it, Gary.']],
          bitter: [['foe', 'I don’t get it. I train harder. I study harder. Why do YOU keep winning?'], ['me', 'Maybe you’re training for the wrong reasons.']] }
      ],
      win: { cocky: [['foe', 'What?! Huh… a fluke. Next time you won’t be so lucky.']], rattled: [['foe', 'Tch. Again? …Whatever. See ya.']], bitter: [['foe', '…Fine. Enjoy it while it lasts.']] },
      lose: { cocky: [['foe', 'Ha! Told you. Go home and cry to Gramps.']], rattled: [['foe', 'That’s more like it. Back where you belong — behind me.']], bitter: [['foe', 'Finally. FINALLY. Remember this feeling.']] }
    },
    champion: {
      cocky: [['foe', 'Took you long enough. I’m the Champion, and I’ve been waiting to prove I’m the best.'], ['me', 'Then let’s settle it.']],
      rattled: [['foe', 'So it comes down to us. Just like I always knew it would.'], ['me', 'One last battle, Gary.']],
      bitter: [['foe', 'You beat me every time it mattered. Not today. Not for the title.'], ['me', 'Then show me your best.']]
    }
  };

  /* ---------- save helpers ---------- */
  const sv = () => STORY.save;
  const rv = () => { const s = sv(); s.rival = s.rival || { w: 0, l: 0, done: {} }; s.rival.done = s.rival.done || {}; return s.rival; };
  const mood = () => { const r = rv(), d = r.w - r.l; return d >= 2 ? 'bitter' : d >= 1 ? 'rattled' : 'cocky'; };
  const diff = () => DIFF[(sv() && sv().difficulty) || 'normal'] || DIFF.normal;
  const starsOf = key => ((sv() && sv().stars) || {})[key] || 0;
  window.storyStars = () => Object.values((sv() && sv().stars) || {}).reduce((a, n) => a + n, 0);

  /* ---------- cutscenes ---------- */
  const css = document.createElement('style'); css.textContent = `
  #csOv{position:fixed;inset:0;z-index:3000;display:none;background:linear-gradient(180deg,rgba(5,8,22,.25),rgba(5,8,22,.75));font-family:var(--ui,Rubik,sans-serif)}
  #csOv.show{display:block}
  #csOv .por{position:absolute;bottom:150px;height:min(48vh,340px);filter:drop-shadow(0 10px 22px rgba(0,0,0,.6));transition:opacity .25s,transform .25s;image-rendering:pixelated}
  #csOv .por.l{left:6vw}#csOv .por.r{right:6vw;transform:scaleX(-1)}
  #csOv .por.dim{opacity:.4}
  #csOv .box{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);width:min(860px,92vw);min-height:104px;background:#0d1430;border:3px solid #ffd84a;border-radius:16px;padding:14px 20px 16px;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.6)}
  #csOv .who{position:absolute;top:-16px;left:18px;background:#ffd84a;color:#141c34;font:900 13px var(--ui,Rubik,sans-serif);padding:3px 12px;border-radius:9px;letter-spacing:.05em}
  #csOv .who.r{left:auto;right:18px}
  #csOv .txt{font:600 17px/1.45 var(--ui,Rubik,sans-serif);min-height:50px}
  #csOv .hint{position:absolute;right:16px;bottom:8px;font:700 11px var(--ui,Rubik,sans-serif);color:#9aa6d8}
  #csOv .skip{position:absolute;top:max(14px,env(safe-area-inset-top));right:16px;background:#2a3456;color:#fff;border:0;border-radius:10px;padding:7px 14px;font:800 12px var(--ui,Rubik,sans-serif);cursor:pointer}
  #csOv .twist{position:absolute;left:50%;top:max(16px,env(safe-area-inset-top));transform:translateX(-50%);background:#3a1830;border:2px solid #ff7aa8;color:#ffd6e6;border-radius:12px;padding:7px 14px;font:800 13px var(--ui,Rubik,sans-serif);max-width:80vw;text-align:center}
  #ruleToast{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:60;background:rgba(40,16,40,.92);border:2px solid #ff7aa8;color:#ffe2ee;border-radius:14px;padding:10px 18px;font:800 15px var(--ui,Rubik,sans-serif);text-align:center;pointer-events:none;opacity:0;transition:opacity .4s}
  #ruleToast.show{opacity:1}#ruleToast small{display:block;font-weight:600;font-size:12px;color:#ffc6da;margin-top:3px}
  .move.banned,.tmove.banned{filter:grayscale(1) brightness(.6)}
  /* the gym card's extra info: full width under the card, as tiles side by side that wrap to fit */
  .sy-gc>.sy-extra{grid-column:1/-1}
  #syModal .sy-gc{width:min(900px,100%)}            /* wider card: more tiles per row, so it is shorter */
  @media (max-height:520px){ #syModal .sy-extra .sy-tile.wide{grid-column:span 2}
    #syModal .sy-gc .foes{margin:4px 0;gap:4px} #syModal .sy-gc .foes .m{padding:2px} #syModal .sy-gc .foes .m .p{height:30px} #syModal .sy-gc .foes .m img,#syModal .sy-gc .foes .m canvas{max-height:28px}
    #syModal .sy-gc .quote{margin:2px 0 4px} #syModal .sy-gc .meta{margin:3px 0} #syModal .sy-gc .sy-btn{padding:5px 10px} #syModal .sy-gc{padding-top:8px;padding-bottom:8px} }
  @media (max-height:440px){ #syModal .sy-gc .quote{display:none} #syModal{padding:4px!important} }   /* landscape phones: the leader's line is in their cutscene */
  @media (max-height:520px){ #syModal .sy-gc .pf{min-height:118px} #syModal .sy-gc .pf img{height:112px} .sy-extra{gap:6px;margin-top:8px} .sy-tile{padding:6px 10px} .sy-tile h5{margin-bottom:2px} .sy-starwhy{font-size:11px} }
  .sy-extra{margin-top:10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:8px;font:600 13px/1.35 var(--ui,Rubik,sans-serif);color:#dfe4ff;text-align:left}
  .sy-tile{border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:8px 12px;min-width:0}
  .sy-tile h5{margin:0 0 4px;font:900 11px var(--ui,Rubik,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:#a9b6ff}
  .sy-tile.wide{grid-column:1/-1}
  .sy-tile.twist{background:rgba(90,24,60,.4);border-color:rgba(255,122,168,.55);color:#ffd6e6}.sy-tile.twist h5{color:#ff9cc0}
  .sy-tile.alert{background:rgba(80,60,10,.35);border-color:rgba(255,216,74,.5)}
  .sy-extra b{color:#ffd84a}
  .sy-diff{display:flex;gap:6px;flex-wrap:nowrap}.sy-diff button{flex:1;border:0;border-radius:9px;padding:6px 10px;font:800 12px var(--ui,Rubik,sans-serif);background:#2a3456;color:#fff;cursor:pointer;white-space:nowrap}
  .sy-diff button.on{background:#ffd84a;color:#141c34}
  .sy-stars{font:900 22px var(--ui,Rubik,sans-serif);letter-spacing:4px;color:#ffd84a;text-shadow:0 2px 8px rgba(0,0,0,.5)}.sy-stars i{color:#4a5378;font-style:normal}
  .sy-starwhy{font:600 12px var(--ui,Rubik,sans-serif);color:#c8cde8}`;
  document.head.appendChild(css);
  const ov = document.createElement('div'); ov.id = 'csOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Cutscene'); document.body.appendChild(ov);
  const toast = document.createElement('div'); toast.id = 'ruleToast'; document.body.appendChild(toast);
  const imgOf = file => (typeof TRAINERS !== 'undefined' && TRAINERS.includes(file) && typeof portraitUrl === 'function' ? portraitUrl(file) : '');
  function playScene(lines, foe, twist) {
    if (!lines || !lines.length) return Promise.resolve();
    return new Promise(done => {
      STORY.cutscene = true; let k = 0, typing = null, full = '';
      const me = sv().trainer, myImg = imgOf(me), foeImg = imgOf(foe.file);
      ov.innerHTML = `${myImg ? `<img class="por l" src="${myImg}" alt="">` : ''}${foeImg ? `<img class="por r" src="${foeImg}" alt="">` : ''}
        ${twist ? `<div class="twist">⚠ ${esc(twist.title)}: ${esc(twist.text)}</div>` : ''}<button class="skip" type="button">Skip ▸▸</button>
        <div class="box"><div class="who"></div><div class="txt" aria-live="polite"></div><div class="hint">tap / Space ▸</div></div>`;
      ov.classList.add('show');
      const L = ov.querySelector('.por.l'), R = ov.querySelector('.por.r'), who = ov.querySelector('.who'), txt = ov.querySelector('.txt');
      const finish = () => { clearInterval(typing); ov.classList.remove('show'); ov.innerHTML = ''; window.removeEventListener('keydown', key, true); STORY.cutscene = false; done(); };
      const show = () => { if (k >= lines.length) return finish(); const [w, t] = lines[k]; const mine = w === 'me';
        who.textContent = mine ? (typeof trainerTitle === 'function' ? trainerTitle(me) : 'You').toUpperCase() : (foe.leader || foe.file).toUpperCase(); who.classList.toggle('r', !mine);
        if (L) L.classList.toggle('dim', !mine); if (R) R.classList.toggle('dim', mine);
        full = t; let n = 0; txt.textContent = ''; clearInterval(typing); typing = setInterval(() => { n += 2; txt.textContent = full.slice(0, n); if (n >= full.length) clearInterval(typing); }, 18); };
      const next = () => { if (txt.textContent.length < full.length) { clearInterval(typing); txt.textContent = full; return; } k++; show(); };
      const key = e => { if (e.key !== ' ' && e.key !== 'Enter' && e.key !== 'Escape') return; e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation(); if (e.key === 'Escape') finish(); else next(); };   // the scene consumes its keys (Escape must not also leave the battle that starts next)
      ov.onclick = e => { if (e.target.closest('.skip')) finish(); else next(); };
      window.addEventListener('keydown', key, true); show();
    });
  }
  window.playScene = playScene;
  window.STORY_DATA = { RULES, SCRIPT, DIFF, PAR, diff, mood, rv, starsOf, imgOf };

  /* ---------- rules for the next story battle ---------- */
  STORY.nextRules = null;
  window.storyRules = () => (STORY.battle ? STORY.nextRules : null);
  const _cur = currentAiLevels;
  currentAiLevels = function () { const r = _cur.apply(this, arguments); if (STORY.battle && r && r.B) { const base = r.B; r.B = base >= 13 ? 13 : Math.max(1, Math.min(12, base + diff().ai)); } return r; };

  /* ---------- the rival ---------- */
  function rivalTeam(k) {
    const pick = garyPick(sv().team), line = GARY_TEAMS.find(G => G.counter === pick.counter) ? null : null;
    const counterLine = (GARY_TEAMS.map(G => G.line).find(l => l.includes(pick.counter))) || ['Charmander', 'Charmeleon', 'Charizard'];
    const list = RIVAL_BASE[k].map(n => n === '*1' ? counterLine[1] : n === '*2' ? counterLine[2] : n);
    const size = Math.max(2, Math.min(list.length, (sv().team || []).length));   // grows with yours
    return list.slice(list.length - size);                                        // keeps his starter, sheds the earliest picks
  }
  async function startRival(i) {
    const k = RIVAL_AT[i], m = mood();
    await playScene(SCRIPT.rival.before[k][m], GARY);
    const s = sv(), g = gymAt(i);
    STORY.battle = { gym: i, rival: k, level: Math.max(1, (g.ai || g.n) - 1), practice: false };
    STORY.nextRules = Object.assign({ foeScale: diff().scale }, typeof storyRuleExtras === 'function' ? storyRuleExtras({ rival: true }) : {});
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = GARY.file; loadTrainer(s.trainer); loadTrainer(GARY.file);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), rivalTeam(k), 'plaza');
    STORY.battle.G = G;
  }
  async function rivalResult(won, b) {
    const r = rv(), m = mood(); if (won) r.w++; else r.l++; r.done[b.gym] = true; saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene((won ? SCRIPT.rival.win : SCRIPT.rival.lose)[m], GARY);
    try { renderStory(); openGymCard(b.gym); } catch (e) { }
  }

  /* ---------- wrap the story flow ---------- */
  const _start = startGymBattle;
  startGymBattle = async function (i) {
    if (STORY.cutscene) return;
    const s = sv(), g = gymAt(i); if (!s) return _start.apply(this, arguments);
    const first = i === s.badges && !g.secret;
    if (first && RIVAL_AT[i] != null && !rv().done[i]) { closeModal(); return startRival(i); }
    const K = g.rulesKey || g.n;
    const rules = Object.assign({ foeScale: diff().scale }, g.secret ? {} : (RULES[K] || {}), typeof storyRuleExtras === 'function' ? storyRuleExtras(g) : {});
    // the leader's scene plays on arrival — right before the battle, after any route walk or wild encounter
    STORY.pendingScene = first ? { lines: g.n === 10 ? SCRIPT.champion[mood()] : SCRIPT.gym[K], who: g, twist: RULES[K] } : null;
    STORY.nextRules = rules;
    return _start.call(this, i);
  };
  const _result = storyResult;
  storyResult = function (won) {
    const b = STORY.battle, s = sv(), BG = b && b.G;
    let earned = 0, key = null;
    if (b && s && BG) {
      key = b.event ? 'e' + b.event : b.rival != null ? 'r' + b.rival : 'g' + (gymAt(b.gym).rulesKey || gymAt(b.gym).n);
      if (won) { earned = 1; if (!BG.sides.A.team.some(m => m.hp <= 0)) earned++; if (BG.elapsed / 1000 <= PAR(Math.min(10, b.gym + 1))) earned++; }
      s.stars = s.stars || {}; if (earned > (s.stars[key] || 0)) s.stars[key] = earned;
      saveStory();
    }
    STORY.nextRules = null;
    if (b && b.rival != null) { STORY.battle = null; return rivalResult(won, b); }
    const r = _result.apply(this, arguments);
    if (won && key) { const box = document.querySelector('#syModal .sy-cer'); if (box) { const d = document.createElement('div');
      d.innerHTML = `<div class="sy-stars" aria-label="${earned} of 3 stars">${'★'.repeat(earned)}<i>${'★'.repeat(3 - earned)}</i></div><div class="sy-starwhy">★ win · ★ no faints · ★ under ${PAR(Math.min(10, b.gym + 1))} s${starsOf(key) > earned ? ` · best: ${starsOf(key)}★` : ''}</div>`;
      const h = box.querySelector('h2'); if (h) h.after(d); else box.prepend(d); } }
    return r;
  };

  const _startBattle = startBattle;
  startBattle = async function () {
    const sc = STORY.pendingScene; STORY.pendingScene = null;
    if (sc && STORY.battle) { const b = STORY.battle; await playScene(sc.lines, sc.who, sc.twist); if (STORY.battle !== b) return; const p = _startBattle.apply(this, arguments); b.G = G; return p; }
    return _startBattle.apply(this, arguments);
  };
  /* ---------- battles: apply the rules, show the twist ---------- */
  let shownFor = null;
  setInterval(() => {
    if (typeof G === 'undefined' || !G || !G.rules) return;
    if (G.phase === 'battle' && shownFor !== G) { shownFor = G; const t = Object.values(RULES).find(x => x.weather === G.rules.weather && JSON.stringify(x.banA || null) === JSON.stringify(G.rules.banA || null) && (x.handicap || null) === (G.rules.handicap || null));
      if (t) { toast.innerHTML = `⚠ ${esc(t.title)}<small>${esc(t.text)}</small>`; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3800); } }
  }, 250);
  // weather on the field, for the whole battle. Dense layers (rain, grit, hail, flakes) are batched into one path per layer,
  // with positions computed from time — cheap enough for phones; splashes, impacts, motes and mist use the moves' particle engine.
  if (typeof drawWorldFx === 'function' && window.PFX) {
    const P = PFX, EM = {}, rnd = (a, b) => a + Math.random() * (b - a), T = Math.PI * 2;
    const hash = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const view = () => { const c = bctx, m = c.getTransform(), inv = m.inverse(), a = inv.transformPoint(new DOMPoint(0, 0)), b = inv.transformPoint(new DOMPoint(c.canvas.width, c.canvas.height)); return { x0: a.x, y0: a.y, x1: b.x, y1: b.y, w: b.x - a.x, h: b.y - a.y }; };
    const n = (key, perSec) => P.due(EM[key] || (EM[key] = {}), perSec);
    const mod = (a, m) => ((a % m) + m) % m;
    // ---- screen-space batched layers ----
    function rainLayers(c, W, H, t, s, q) {
      for (const [count, speed, len, lw, col] of [[Math.round(110 * q), 1.25, 18, 1.1, 'rgba(185,212,255,.42)'], [Math.round(70 * q), 1.9, 30, 1.9, 'rgba(215,235,255,.62)']]) {
        c.beginPath(); const L = len * s, dx = L * .22;
        for (let k = 0; k < count; k++) { const span = H + L, y = mod(hash(k + count) * span + t * speed * s, span) - L, x = mod(hash(k * 3.1 + speed) * (W + 80) - y * .22, W + 80) - 40; c.moveTo(x, y); c.lineTo(x - dx, y + L); }
        c.strokeStyle = col; c.lineWidth = lw * s; c.lineCap = 'round'; c.stroke(); }
    }
    function sandLayers(c, W, H, t, s, q) {
      const dust = P.colTex('#c9a468', .6);                                  // big billowing dust clouds rolling across
      for (let k = 0; k < Math.round(9 * q) + 3; k++) { const r = (90 + hash(k + 5) * 110) * s, span = W + r * 2, x = mod(hash(k) * span + t * (.09 + hash(k + 9) * .08) * s, span) - r, y = H * (.15 + hash(k + 2) * .85);
        c.globalAlpha = .32 + hash(k + 4) * .2; c.drawImage(dust, x - r, y - r * .6, r * 2, r * 1.2); }
      c.globalAlpha = 1;
      for (const [count, speed, len, lw, col] of [[Math.round(150 * q), .55, 12, 1, 'rgba(226,196,140,.55)'], [Math.round(60 * q), .95, 20, 1.7, 'rgba(242,214,160,.75)']]) {
        c.beginPath(); const L = len * s;
        for (let k = 0; k < count; k++) { const span = W + L, x = mod(hash(k * 1.7 + speed) * span + t * speed * s, span) - L, y = mod(hash(k + 31 + count) * H + Math.sin(t / 500 + k) * 6 * s + t * .04 * s, H); c.moveTo(x, y); c.lineTo(x + L, y + L * .12); }
        c.strokeStyle = col; c.lineWidth = lw * s; c.lineCap = 'round'; c.stroke(); }
    }
    function hailLayers(c, W, H, t, s, q) {
      c.beginPath();                                                          // tumbling ice shards (one fill)
      for (let k = 0; k < Math.round(60 * q); k++) { const sz = (2.2 + hash(k + 7) * 2.6) * s, span = H + 20 * s, y = mod(hash(k) * span + t * .62 * s, span) - 10 * s, x = mod(hash(k + 3) * (W + 60) - y * .12, W + 60) - 30, a = t / 300 + k;
        c.moveTo(x + Math.cos(a) * sz, y + Math.sin(a) * sz); c.lineTo(x + Math.cos(a + 2.2) * sz * .6, y + Math.sin(a + 2.2) * sz * .6); c.lineTo(x + Math.cos(a + 3.14) * sz, y + Math.sin(a + 3.14) * sz); c.lineTo(x + Math.cos(a + 4.1) * sz * .6, y + Math.sin(a + 4.1) * sz * .6); c.closePath(); }
      c.fillStyle = 'rgba(236,248,255,.92)'; c.fill(); c.strokeStyle = 'rgba(140,190,255,.7)'; c.lineWidth = .8 * s; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.75)';                                  // snow flakes drifting
      for (let k = 0; k < Math.round(70 * q); k++) { const span = H + 8, y = mod(hash(k + 77) * span + t * .07 * s, span) - 4, x = mod(hash(k + 91) * W + Math.sin(t / 900 + k) * 14 * s - t * .02 * s, W), r = (1 + hash(k) * 1.6) * s; c.fillRect(x - r / 2, y - r / 2, r, r); }
    }
    // ---- particle moments (art space) ----
    function rainMoments(v) {
      for (let k = n('splash', 55); k > 0; k--) { const x = rnd(v.x0, v.x1), y = rnd(v.y0 + v.h * .25, v.y1 - 4);
        P.spawn({ kind: 'ring', x, y, vx: 0, vy: 0, drag: 1, max: rnd(.3, .45), r: rnd(2, 3), grow: 3.5, a: .75, col: 'rgba(205,230,255,.95)', lw: 1, squash: .35 });
        for (let d = 0; d < 3; d++) P.spawn({ kind: 'drop', x, y, vx: rnd(-50, 50), vy: rnd(-110, -60), ay: 480, drag: .98, max: .3, r: 1, a: .9, col: '#dceeff' }); }
      for (let k = n('mist', 3); k > 0; k--) P.spawn({ x: rnd(v.x0 - 40, v.x1), y: rnd(v.y0 + v.h * .45, v.y1), vx: rnd(10, 25), vy: 0, drag: 1, max: rnd(4, 6), r: rnd(45, 75), grow: .4, a: .2, img: P.steamTex() });
    }
    function hailMoments(v) {
      for (let k = n('impact', 40); k > 0; k--) { const x = rnd(v.x0, v.x1), y = rnd(v.y0 + v.h * .25, v.y1 - 4);
        P.spawn({ x, y, vx: 0, vy: 0, drag: 1, max: .25, r: 5, grow: 1.1, a: .85, img: P.whiteTex(), add: true });
        P.spawn({ kind: 'ring', x, y, vx: 0, vy: 0, drag: 1, max: .32, r: 1.6, grow: 3.2, a: .7, col: 'rgba(220,240,255,.95)', lw: 1, squash: .4 });
        for (let d = 0; d < 2; d++) P.spawn({ kind: 'shard', x, y, vx: rnd(-60, 60), vy: rnd(-100, -50), ay: 500, drag: .97, max: .3, r: 1.3, a: .9, col: '#eaf7ff', rot: rnd(0, T), vr: rnd(-10, 10) }); }
    }
    function sunMoments(v) {
      for (let k = n('mote', 34); k > 0; k--) P.spawn({ x: rnd(v.x0, v.x1), y: rnd(v.y0 + v.h * .35, v.y1), vx: rnd(-8, 8), vy: rnd(-45, -22), drag: 1, max: rnd(1.6, 2.6), r: rnd(2, 3.6), grow: .2, a: rnd(.45, .7), img: P.hueTex(42, 100, 66), add: true });
    }
    function sandMoments(v) {
      for (let k = n('puff', 14); k > 0; k--) P.spawn({ x: rnd(v.x0, v.x1), y: rnd(v.y0 + v.h * .4, v.y1), vx: rnd(60, 120), vy: rnd(-12, -4), drag: .99, max: rnd(.9, 1.4), r: rnd(6, 11), grow: 1.4, a: .35, img: P.colTex('#d8b57a', .6) });
    }
    const _dwf = drawWorldFx; drawWorldFx = function () {
      const r = _dwf.apply(this, arguments);
      try { const w = G && G.rules && G.rules.weather; if (!w || !['battle', 'intro', 'pick', 'over'].includes(G.phase)) return r;
        if (!clock.paused && G.phase !== 'over') { const v = view(); if (w === 'rain') rainMoments(v); else if (w === 'hail') hailMoments(v); else if (w === 'sun') sunMoments(v); else if (w === 'sand') sandMoments(v); }
        const c = bctx, W = c.canvas.width, H = c.canvas.height, t = clock.t, s = H / 360, q = P.QMUL();
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        if (w === 'rain') { c.fillStyle = 'rgba(26,46,92,.22)'; c.fillRect(0, 0, W, H); rainLayers(c, W, H, t, s, q); }
        else if (w === 'sand') { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(184,140,74,.34)'); g.addColorStop(1, 'rgba(160,120,62,.2)'); c.fillStyle = g; c.fillRect(0, 0, W, H); sandLayers(c, W, H, t, s, q); }
        else if (w === 'hail') { c.fillStyle = 'rgba(160,198,255,.18)'; c.fillRect(0, 0, W, H); hailLayers(c, W, H, t, s, q); }
        else if (w === 'sun') {
          const sx = W * .9, sy = -H * .06, pulse = 1 + Math.sin(t / 700) * .06;
          c.fillStyle = 'rgba(255,165,60,.12)'; c.fillRect(0, 0, W, H);
          c.globalCompositeOperation = 'lighter';
          let g = c.createRadialGradient(sx, sy, 0, sx, sy, H * 1.05 * pulse); g.addColorStop(0, 'rgba(255,248,210,.8)'); g.addColorStop(.18, 'rgba(255,214,120,.42)'); g.addColorStop(.55, 'rgba(255,170,70,.12)'); g.addColorStop(1, 'rgba(255,150,50,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.translate(sx, sy); c.rotate(t / 9000);                                 // slowly turning god rays
          for (let k = 0; k < 14; k++) { c.rotate(T / 14); const len = H * (1.2 + (k % 3) * .25), rg = c.createLinearGradient(0, 0, len, 0); rg.addColorStop(0, 'rgba(255,236,170,.32)'); rg.addColorStop(1, 'rgba(255,236,170,0)'); c.fillStyle = rg;
            c.beginPath(); c.moveTo(0, 0); c.lineTo(len, -H * .07); c.lineTo(len, H * .07); c.closePath(); c.fill(); }
          c.setTransform(1, 0, 0, 1, 0, 0);
          for (const [f, rr, a] of [[.32, .06, .2], [.52, .035, .18], [.78, .09, .12]]) { const fx = sx + (W * .35 - sx) * f, fy = sy + (H * .78 - sy) * f, fg = c.createRadialGradient(fx, fy, 0, fx, fy, H * rr); fg.addColorStop(0, `rgba(255,230,160,${a})`); fg.addColorStop(.7, `rgba(255,200,120,${a * .4})`); fg.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = fg; c.beginPath(); c.arc(fx, fy, H * rr, 0, T); c.fill(); }   // lens flare
        }
        c.restore(); } catch (e) { console.error(e); }
      return r; };
  }

  /* ---------- the gym card: twist, stars, difficulty ---------- */
  const _card = openGymCard;
  openGymCard = function (i) {
    const r = _card.apply(this, arguments);
    try { const s = sv(), g = gymAt(i), card = document.querySelector('#syModal > div'); if (!s || !card || g.secret) return r;
      const rivalNext = i === s.badges && RIVAL_AT[i] != null && !rv().done[i], rule = RULES[g.rulesKey || g.n], key = 'g' + (g.rulesKey || g.n), n = starsOf(key);
      const d = document.createElement('div'); d.className = 'sy-extra';
      d.innerHTML = `${rivalNext ? `<div class="sy-tile wide alert"><h5>⚔ Rival</h5><b>Gary blocks the way!</b> Your rival challenges you before ${esc(g.leader)}.</div>` : ''}
        ${rule ? `<div class="sy-tile twist"><h5>⚠ Gym twist · ${esc(rule.title)}</h5>${esc(rule.text)}</div>` : ''}
        <div class="sy-tile"><h5>Stars</h5><span class="sy-stars" style="font-size:18px">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span><div class="sy-starwhy">★ win · ★ no faints · ★ under ${PAR(g.n)} s</div></div>
        <div class="sy-tile"><h5>Difficulty</h5><div class="sy-diff" role="group" aria-label="Difficulty">${Object.entries(DIFF).map(([k, v]) => `<button type="button" data-d="${k}" class="${((s.difficulty || 'normal') === k) ? 'on' : ''}" aria-pressed="${(s.difficulty || 'normal') === k}">${v.name}</button>`).join('')}</div></div>`;
      card.appendChild(d);
      d.querySelectorAll('.sy-diff button').forEach(b => b.onclick = () => { s.difficulty = b.dataset.d; saveStory(); d.querySelectorAll('.sy-diff button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); });
    } catch (e) { console.error(e); }
    return r;
  };
  /* ---------- the map: stars under each gym ---------- */
  const _render = renderStory;
  renderStory = function () {
    const r = _render.apply(this, arguments);
    try { const s = sv(); if (!s) return r;
      document.querySelectorAll('#syMap g.gym[data-g]').forEach(node => { const i = +node.dataset.g; if (i >= TOTAL) return; const n = starsOf('g' + GYMS[i].n); if (!n) return;
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text'); t.setAttribute('y', '58'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'gstars');
        t.setAttribute('style', 'font:900 15px Rubik,sans-serif;fill:#ffd84a;paint-order:stroke;stroke:#141c34;stroke-width:4px'); t.textContent = '★'.repeat(n) + '☆'.repeat(3 - n); node.appendChild(t); });
    } catch (e) { }
    return r;
  };
})();
