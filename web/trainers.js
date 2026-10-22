/* =====================================================================
   Section 24: ROUTE TRAINERS (optional story battles) and MAP ZOOM
   - 12 trainers on the Kanto map, smaller than the gym leaders. Each one
     unlocks once you have travelled its route and are heading for the gym
     it leads up to. Tap an unlocked trainer: your avatar walks there and
     the trainer card opens. Trips to and from trainers never trigger
     catch encounters (those belong to the first gym-to-gym arrival of a run).
   - The story map zooms and pans: wheel / +−, drag; pinch and drag on
     phones; double-click or double-tap resets.
   Sprites: <Name>_trainer.png in the sprites folder; names are matched
   loosely (Bug_Catcher, BugCatcher, Cooltrainer_M, Ace_Trainer_Female …).
   ===================================================================== */
const MINORS = [
  { id: 'bug', name: 'Bug Catcher', keys: ['bugcatcher'], where: 'Viridian Forest', at: [505, 455], unlock: 0, ai: 1, arena: 'ruins',
    team: [['Caterpie', 9], ['Weedle', 9], ['Metapod', 10], ['Kakuna', 10]], hello: 'I caught all these in the forest! Wanna see how tough bugs are?', lose: 'My bugs! You squashed them\u2026', win: 'Bugs rule! Told ya!' },
  { id: 'youngster', name: 'Youngster', keys: ['youngster'], where: 'Route 3', at: [655, 300], unlock: 1, ai: 2, arena: 'plaza',
    team: [['Rattata', 11], ['Ekans', 12], ['Zubat', 12], ['Sandshrew', 14]], hello: 'Hey! You looked at me, so we have to battle!', lose: 'Aww, my Rattata is in the top percentage of Rattata too\u2026', win: 'Shorts are comfy AND winning!' },
  { id: 'lass', name: 'Lass', keys: ['lass'], where: 'Mt. Moon', at: [790, 175], unlock: 1, ai: 2, arena: 'grotto',
    team: [['Clefairy', 12], ['Nidoran♀', 13], ['Oddish', 14], ['Jigglypuff', 15]], hello: 'Mt. Moon is full of cute Pok\u00E9mon. Mine are the cutest!', lose: 'Cute isn\u2019t enough, huh\u2026', win: 'Cuteness wins again!' },
  { id: 'gentleman', name: 'Gentleman', keys: ['gentleman'], where: 'S.S. Anne', at: [1236, 880], unlock: 2, ai: 3, arena: 'cerulean',
    team: [['Growlithe', 22], ['Nidoran♂', 23], ['Voltorb', 23], ['Ponyta', 24]], hello: 'A battle aboard the S.S. Anne? How very civilised.', lose: 'Splendid form, young trainer.', win: 'Breeding tells, my dear.' },
  { id: 'engineer', name: 'Engineer', keys: ['engineer'], where: 'Route 11', at: [1440, 760], unlock: 3, ai: 3, arena: 'cyber',
    team: [['Magnemite', 21], ['Voltorb', 21], ['Magnemite', 22], ['Magneton', 23]], hello: 'My magnets are tuned to perfection. Let\u2019s test the circuit!', lose: 'Short-circuited\u2026', win: 'Fully charged victory!' },
  { id: 'hiker', name: 'Hiker', keys: ['hiker'], where: 'Rock Tunnel', at: [1610, 330], unlock: 3, ai: 4, arena: 'grotto',
    team: [['Geodude', 20], ['Machop', 21], ['Onix', 22], ['Graveler', 23]], hello: 'Hahaha! Rock Tunnel is dark, but my Pok\u00E9mon are rock solid!', lose: 'Whoa! You\u2019re a mountain of strength!', win: 'Rock beats everything, kid!' },
  { id: 'biker', name: 'Biker', keys: ['biker'], where: 'Route 17 \u00B7 Cycling Road', at: [683, 760], unlock: 4, ai: 5, arena: 'plaza',
    team: [['Koffing', 28], ['Grimer', 28], ['Weezing', 29], ['Muk', 30], ['Voltorb', 31]], hello: 'Get off my road! Unless you want to eat my smoke!', lose: 'Aw man, you rode right over me.', win: 'Eat my exhaust!' },
  { id: 'beauty', name: 'Beauty', keys: ['beauty'], where: 'Route 15', at: [1250, 1030], unlock: 5, ai: 5, arena: 'ruins',
    team: [['Pidgeotto', 28], ['Bellsprout', 28], ['Clefairy', 29], ['Wigglytuff', 29], ['Oddish', 30]], hello: 'Do you think my Pok\u00E9mon are as beautiful as I am?', lose: 'How rude! You beat my precious team!', win: 'Beauty and brains, darling.' },
  { id: 'psychic', name: 'Psychic', keys: ['psychic'], where: 'Silph Co.', at: [1312, 420], unlock: 5, ai: 6, arena: 'skyfort',
    team: [['Slowpoke', 34], ['Kadabra', 35], ['Drowzee', 36], ['Hypno', 37], ['Alakazam', 38]], hello: 'I foresaw your arrival. I also foresee your defeat.', lose: 'My vision\u2026 clouded.', win: 'As I predicted.' },
  { id: 'swimmer', name: 'Swimmer', keys: ['swimmer'], where: 'Sea Route 20', at: [800, 1268], unlock: 6, ai: 6, arena: 'glacier',
    team: [['Tentacool', 31], ['Shellder', 32], ['Horsea', 32], ['Seadra', 33], ['Starmie', 34]], hello: 'The sea is my home turf! Let\u2019s make some waves!', lose: 'Wiped out\u2026', win: 'Catch you on the next wave!' },
  { id: 'coolm', name: 'Cooltrainer', keys: ['cooltrainermale', 'cooltrainerm', 'cooltrainerboy', 'acetrainermale', 'acetrainerm'], where: 'Pok\u00E9mon Mansion', at: [380, 1205], unlock: 6, ai: 7, arena: 'oasis',
    team: [['Nidorino', 39], ['Muk', 40], ['Marowak', 40], ['Arcanine', 41], ['Exeggutor', 42]], hello: 'This mansion hides some strong Pok\u00E9mon. So do I.', lose: 'Not bad. You\u2019re the real deal.', win: 'Come back when you\u2019re cooler.' },
  { id: 'coolf', name: 'Cooltrainer', keys: ['cooltrainerfemale', 'cooltrainerf', 'cooltrainergirl', 'acetrainerfemale', 'acetrainerf'], where: 'Victory Road', at: [238, 470], unlock: 8, ai: 8, arena: 'silver',
    team: [['Persian', 43], ['Ninetales', 43], ['Vileplume', 44], ['Rapidash', 45], ['Dewgong', 45], ['Cloyster', 46]], hello: 'Only the strongest reach the Pok\u00E9mon League. Prove you belong!', lose: 'You\u2019re ready for the Elite Four.', win: 'Victory Road isn\u2019t for everyone.' }
];
const minorFile = m => ALL_TRAINERS.find(n => m.keys.includes(trainerKey(n))) || null;
const minorUnlocked = (m, sv) => !!sv && sv.badges >= m.unlock;
const minorBeaten = (m, sv) => !!(sv && sv.minors && sv.minors[m.id]);
(function trainersModule() {
  const st = document.createElement('style');
  st.textContent = `
#storyOv .minor{cursor:pointer}
#storyOv .minor.locked{cursor:default}
#storyOv .minor.locked .face{filter:grayscale(1) brightness(.55)}
#storyOv .minor .pulse{animation:syPulse 1.8s ease-out infinite;transform-box:fill-box;transform-origin:center}
#storyOv .sy-zoom{position:absolute;right:10px;bottom:10px;z-index:2;display:flex;flex-direction:column;gap:6px}
#storyOv .sy-zoom button{width:38px;height:38px;border:0;border-radius:10px;background:rgba(8,12,34,.8);color:#fff;font:900 20px var(--ui);cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.4)}
#storyOv .sy-zoom button:hover{background:rgba(40,52,110,.9)}
#syMap{touch-action:none;cursor:grab}
#syMap.dragging{cursor:grabbing}
@media (max-height:560px){#storyOv .sy-zoom button{width:30px;height:30px;font-size:16px}}`;
  document.head.appendChild(st);

  /* ---------- the trainers on the map ---------- */
  function minorNodes() {
    const sv = STORY.save; if (!sv || !STORY.kanto) return '';
    return MINORS.map(m => {
      const open = minorUnlocked(m, sv), done = minorBeaten(m, sv), file = minorFile(m), r = 22, [x, y] = m.at, ring = done ? '#2bd46b' : open ? '#ffd84a' : '#8a90a6';
      return `<g class="minor ${open ? '' : 'locked'}" data-m="${m.id}" transform="translate(${x},${y})" tabindex="0" role="button" aria-label="${m.name}, ${m.where}${done ? ', beaten' : open ? ', optional battle' : ', locked'}">
        ${open && !done ? `<circle class="pulse" r="${r + 6}" fill="none" stroke="#ffd84a" stroke-width="4"/>` : ''}
        <defs><clipPath id="mclip-${m.id}"><circle r="${r - 3}"/></clipPath></defs>
        <circle r="${r}" fill="#20253f" stroke="${ring}" stroke-width="5"/>
        <g class="face">${file ? `<image href="${portraitUrl(file)}" x="${-r}" y="${-r + 1}" width="${r * 2}" height="${r * 2.8}" preserveAspectRatio="xMidYMin slice" clip-path="url(#mclip-${m.id})" style="image-rendering:pixelated"/>` : `<text y="7" text-anchor="middle" font-size="20" font-weight="900" fill="#fff">${m.name[0]}</text>`}</g>
        ${done ? `<g transform="translate(${r * .72},${r * .72})"><circle r="9" fill="#2bd46b" stroke="#0b1230" stroke-width="2.5"/><path d="M-4,0 l3,3 l5,-6" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>` : !open ? `<g transform="translate(${r * .72},${r * .72})"><circle r="9" fill="#0b1230"/><rect x="-4" y="-1" width="8" height="6" rx="1" fill="#c8ccd8"/><path d="M-2.5,-1 v-2.5 a2.5,2.5 0 0 1 5,0 v2.5" stroke="#c8ccd8" stroke-width="1.6" fill="none"/></g>` : ''}
        <text class="lbl" y="${r + 17}" text-anchor="middle" font-size="14" fill="#fff" style="stroke-width:4px">${m.name}</text></g>`;
    }).join('');
  }
  const minorAt = id => MINORS.find(m => m.id === id);
  function placeAtMinor(m) { const a = $('syAvatar'); if (!a || !m) return; a.innerHTML = avatarSvg(); a.setAttribute('transform', `translate(${m.at[0] - AVATAR_OFF()},${m.at[1] + 6})`); }
  const avatarPos = () => { const a = $('syAvatar'), t = a && a.getAttribute('transform'), mm = t && t.match(/translate\(([-\d.]+),([-\d.]+)\)/); return mm ? { x: +mm[1], y: +mm[2] } : null; };
  // A straight walk on the map (to a trainer, or back to the gym you are heading for).
  function walkTo(x1, y1) {
    return new Promise(res => {
      const a = $('syAvatar'), p0 = avatarPos(); if (!a || !p0) return res();
      const tx = x1 - AVATAR_OFF(), ty = y1 + 6, L = Math.hypot(tx - p0.x, ty - p0.y), dur = Math.min(2200, 400 + L * 2.2), t0 = performance.now(); STORY.walking = true;
      const step = now => { const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, hop = Math.abs(Math.sin(now / 90)) * 5;
        a.setAttribute('transform', `translate(${p0.x + (tx - p0.x) * e},${p0.y + (ty - p0.y) * e - hop * (k < 1 ? 1 : 0)})`);
        if (k < 1) requestAnimationFrame(step); else { STORY.walking = false; res(); } };
      requestAnimationFrame(step);
    });
  }
  async function goMinor(m) {
    const sv = STORY.save; if (!sv || STORY.walking) return;
    if (!minorUnlocked(m, sv)) { toastMsg(`${m.name} (${m.where}) unlocks on the way to ${GYMS[Math.min(m.unlock, GYMS.length - 1)].leader}.`); return; }
    if (STORY.at !== m.id) { closeModal(); await walkTo(m.at[0], m.at[1]); STORY.at = m.id; }
    openMinorCard(m);
  }
  function openMinorCard(m) {
    const sv = STORY.save, file = minorFile(m), done = minorBeaten(m, sv), mo = $('syModal');
    const lvl = Array.from({ length: 10 }, (_, k) => `<i class="${k < m.ai ? 'on' : ''}"></i>`).join('');
    mo.innerHTML = `<div class="sy-gc" style="--oc:#ffd84a;--tc:#3a4a8a">
      <div class="pf">${file ? `<img src="${portraitUrl(file)}" alt="${m.name}">` : `<div class="em">${m.name[0]}</div>`}</div>
      <div><div style="font:800 12px var(--ui);letter-spacing:.16em;color:#ffd84a">TRAINER BATTLE \u00B7 ${m.where.toUpperCase()} \u00B7 OPTIONAL</div>
        <h3>${m.name}</h3>
        <div class="meta"><span class="chip">Leads up to ${GYMS[Math.min(m.unlock, GYMS.length - 1)].leader}</span><span class="chip">${done ? '\u2714 Beaten' : 'Not yet beaten'}</span></div>
        <div class="lv">DIFFICULTY ${lvl} <span style="margin-left:6px">AI level ${m.ai}</span></div>
        <div class="quote" id="syQuote"></div>
        <div class="foes">${m.team.map(([n, lv]) => `<div class="m"><div class="p" data-mon="${escapeHtml(n)}"></div>${escapeHtml(n)} <span style="color:#ffd84a">Lv${lv}</span></div>`).join('')}</div>
        <div class="acts"><button class="sy-btn go" type="button" id="syMinorFight">${done ? 'Battle again' : 'Battle!'}</button><button class="sy-btn" type="button" id="syBack">Back to map</button>${isDexSave(sv) ? `<button class="sy-btn" type="button" onclick="openDex()">Party (${sv.team.length}/6)</button>` : ''}</div>
      </div></div>`;
    for (const el of mo.querySelectorAll('[data-mon]')) { try { el.appendChild(monPic(el.dataset.mon)); } catch (e) { } }
    mo.classList.add('show'); typeOut($('syQuote'), `\u201C${m.hello}\u201D`);
    $('syBack').onclick = closeModal; $('syMinorFight').onclick = () => startMinorBattle(m); $('syMinorFight').focus();
  }
  function startMinorBattle(m) {
    const sv = STORY.save, file = minorFile(m); closeModal();
    STORY.battle = { minor: m.id, level: m.ai };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = sv.trainer; TRSEL.B = file || m.name.replace(/\s+/g, '_'); loadTrainer(sv.trainer); if (file) loadTrainer(file);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('stageSel').value = m.arena; $('timeLimit').value = '0';
    $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(sv.team.slice(), m.team.map(t => t[0]), m.arena);
    STORY.battle.G = G;
  }
  // The result of an optional battle: experience (Pokédex runs), the trainer marked beaten, back at the trainer's spot.
  const _minorStoryResult = storyResult;
  storyResult = function (won) {
    const b = STORY.battle; if (!b || !b.minor) return _minorStoryResult.apply(this, arguments);
    const sv = STORY.save, m = minorAt(b.minor); STORY.battle = null;
    const gains = isDexSave(sv) ? awardExp() : [];
    if (won) { sv.wins++; sv.minors = sv.minors || {}; sv.minors[m.id] = true; } else sv.losses++;
    saveStory(); showOverlay('ovResults', false); openStoryScreen();
    const mo = $('syModal'), file = minorFile(m);
    mo.innerHTML = `<div class="sy-cer">${file ? `<img class="medal" src="${portraitUrl(file)}" alt="" style="object-fit:contain;image-rendering:pixelated;${won ? 'filter:grayscale(.5)' : ''}">` : ''}
      <h2 style="${won ? '' : 'color:#ff8a8a'}">${won ? `${m.name} defeated!` : `${m.name} wins\u2026`}</h2><p>${m.name}: \u201C${won ? m.lose : m.win}\u201D</p>${expSummaryHtml(gains)}
      <div style="display:flex;gap:8px;justify-content:center">${won ? '' : '<button class="sy-btn go" type="button" id="syMinorRetry">Rematch</button>'}<button class="sy-btn ${won ? 'go' : ''}" type="button" id="syMinorBack">Back to map</button></div></div>`;
    mo.classList.add('show'); if (won) confetti('#ffd84a');
    $('syMinorBack').onclick = closeModal; if ($('syMinorRetry')) $('syMinorRetry').onclick = () => startMinorBattle(m);
    $('syMinorBack').focus();
  };
  // Back to the gym from a trainer: walk back first; no catch encounter is triggered by these trips.
  const _minorOpenGymCard = openGymCard;
  openGymCard = function (i) {
    if (STORY.at && !STORY.walking) {
      const sv = STORY.save, home = nodeAt(sv.ash ? 11 : sv.badges); closeModal();
      walkTo(home.x, home.y).then(() => { STORY.at = null; _minorOpenGymCard(i); });
      return;
    }
    return _minorOpenGymCard.apply(this, arguments);
  };
  const _minorWalkLeg = walkLeg;
  walkLeg = function () { STORY.at = null; return _minorWalkLeg.apply(this, arguments); };

  /* ---------- draw them on every map render; keep the avatar where it is; keep the zoom ---------- */
  const _minorRenderStory = renderStory;
  renderStory = function () {
    const r = _minorRenderStory.apply(this, arguments);
    if (STORY.at && !minorUnlocked(minorAt(STORY.at) || { unlock: 99 }, STORY.save)) STORY.at = null;   // e.g. after a new run
    const svg = $('syMap') && $('syMap').querySelector('svg'), av = $('syAvatar');
    if (svg && av && STORY.kanto) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'syMinors'; g.innerHTML = minorNodes(); svg.insertBefore(g, av);
      for (const el of g.querySelectorAll('.minor')) { const go = () => goMinor(minorAt(el.dataset.m)); el.addEventListener('click', go); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); }
      if (STORY.at) placeAtMinor(minorAt(STORY.at));
    }
    applyView(); ensureZoomUi();
    return r;
  };

  /* ---------- map zoom and pan (mouse, wheel, touch) ---------- */
  const VIEW = { v: null };
  const svgEl = () => $('syMap') && $('syMap').querySelector('svg');
  const base = () => { const s = svgEl(); return s ? (s.dataset.base ? JSON.parse(s.dataset.base) : (s.dataset.base = JSON.stringify(s.getAttribute('viewBox').split(/\s+/).map(Number)), JSON.parse(s.dataset.base))) : null; };
  function applyView() { const s = svgEl(); if (!s) return; const b = base(); if (!VIEW.v || !b) { if (b) s.setAttribute('viewBox', b.join(' ')); return; } clampView(); s.setAttribute('viewBox', VIEW.v.join(' ')); }
  function clampView() { const b = base(), v = VIEW.v; v[2] = Math.min(b[2], Math.max(b[2] / 6, v[2])); v[3] = v[2] * b[3] / b[2]; v[0] = Math.min(b[0] + b[2] - v[2], Math.max(b[0], v[0])); v[1] = Math.min(b[1] + b[3] - v[3], Math.max(b[1], v[1])); }
  function zoomAt(cx, cy, f) {                                          // f > 1 zooms in, around the client point (cx, cy)
    const s = svgEl(), b = base(); if (!s || !b) return; const v = VIEW.v || b.slice(), pt = s.createSVGPoint(); pt.x = cx; pt.y = cy;
    const p = pt.matrixTransform(s.getScreenCTM().inverse()), nw = Math.min(b[2], Math.max(b[2] / 6, v[2] / f)), k = nw / v[2];
    VIEW.v = [p.x - (p.x - v[0]) * k, p.y - (p.y - v[1]) * k, nw, nw * b[3] / b[2]]; if (nw >= b[2] - .5) VIEW.v = null; applyView();
  }
  function panBy(dxPx, dyPx) { const s = svgEl(), b = base(); if (!s || !VIEW.v) return; const r = s.getBoundingClientRect(), u = Math.max(VIEW.v[2] / r.width, VIEW.v[3] / r.height); VIEW.v[0] -= dxPx * u; VIEW.v[1] -= dyPx * u; applyView(); }
  const resetView = () => { VIEW.v = null; applyView(); };
  function ensureZoomUi() {
    const map = document.querySelector('#storyOv .sy-map'); if (!map || map.querySelector('.sy-zoom')) return;
    const z = document.createElement('div'); z.className = 'sy-zoom';
    z.innerHTML = '<button type="button" aria-label="Zoom in" data-z="in">+</button><button type="button" aria-label="Zoom out" data-z="out">\u2212</button><button type="button" aria-label="Reset the map view" data-z="reset">\u21BA</button>';
    map.appendChild(z);
    z.onclick = e => { const b = e.target.closest('button'); if (!b) return; const r = $('syMap').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (b.dataset.z === 'in') zoomAt(cx, cy, 1.4); else if (b.dataset.z === 'out') zoomAt(cx, cy, 1 / 1.4); else resetView(); };
  }
  (function zoomInput() {
    const host = $('syMap'); if (!host) return;
    host.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.18 : 1 / 1.18); }, { passive: false });
    const pts = new Map(); let moved = false, lastPinch = 0, lastTap = 0;
    host.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false; if (pts.size === 2) { const [a, b] = [...pts.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); } });
    host.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) { const dx = e.clientX - p.x, dy = e.clientY - p.y; if (!moved && Math.hypot(dx, dy) < 6) return; moved = true; host.classList.add('dragging'); try { host.setPointerCapture(e.pointerId); } catch (x) { } panBy(dx, dy); }
      else if (pts.size === 2) { moved = true; const [a, b] = [...pts.values()], cur = { x: e.clientX, y: e.clientY }, other = a === p ? b : a, d = Math.hypot(cur.x - other.x, cur.y - other.y);
        if (lastPinch) zoomAt((cur.x + other.x) / 2, (cur.y + other.y) / 2, d / lastPinch); lastPinch = d; }
      p.x = e.clientX; p.y = e.clientY;
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) lastPinch = 0; if (!pts.size) setTimeout(() => host.classList.remove('dragging'), 0);
      if (!moved && e.pointerType === 'touch') { const now = performance.now(); if (now - lastTap < 300) resetView(); lastTap = now; } };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    host.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);   // a drag is not a click on a gym or trainer
    host.addEventListener('dblclick', e => { e.preventDefault(); resetView(); });
  })();
  window.goMinor = id => goMinor(minorAt(id)); window.MINORS = MINORS; window.mapZoomAt = zoomAt; window.mapView = () => VIEW.v;
})();
