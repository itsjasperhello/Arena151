/* =====================================================================
   Section 33: story milestone 3 (client side of the server features)
   - Ranked queue (Online tab): unlocked by beating the story campaign.
     Signed-in web players are verified from their synced save; phones use
     a private device key kept on the phone.
   - Story → PvP bridge: a title earned in story mode (Champion, badges,
     stars, rating) is shown to online opponents, and "Use my story party"
     loads your story team for Local or Online play.
   - Ghost battles: a "Wandering trainer" on the story map brings a real
     team recorded on your server from online battles.
   ===================================================================== */
(function milestone3() {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };

  /* ---------- identity: a private key for this device (phones), or the signed-in account (web) ---------- */
  function deviceKey() { let k = get('arena151.rankedKey'); if (!k || k.length < 32) { const b = new Uint8Array(32); crypto.getRandomValues(b); k = btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); put('arena151.rankedKey', k); } return k; }
  const authToken = () => { try { const a = JSON.parse(get('arena151.auth') || 'null'); return a && a.token || null; } catch (e) { return null; } };
  function storySlots() { const out = []; for (let i = 1; i <= 9; i++) { const v = get('arena151.story.' + i); if (!v) continue; try { const s = JSON.parse(v); if (s) out.push(s); } catch (e) { } } return out; }
  const campaignBeaten = () => storySlots().some(s => s.finishedAt || s.badges >= 10);
  function storyTitle() {
    const slots = storySlots(); if (!slots.length) return '';
    const best = slots.slice().sort((a, b) => (b.badges || 0) - (a.badges || 0))[0], stars = Math.max(0, ...slots.map(s => Object.values(s.stars || {}).reduce((a, n) => a + n, 0)));
    const champ = slots.find(s => s.finishedAt || s.badges >= 10), rating = get('arena151.rating');
    return [champ ? (champ.branch === 'rocket' ? 'Rocket Champion' : 'Champion') : `${best.badges || 0} badges`, stars ? `★${stars}` : '', rating ? `Rating ${rating}` : ''].filter(Boolean).join(' · ');
  }
  if (typeof myInfo === 'function') { const _mi = myInfo; myInfo = function () { return Object.assign(_mi.apply(this, arguments), { title: storyTitle() }); }; }

  /* ---------- the server's web address (from the Online tab's server field) ---------- */
  function httpBase() {
    const v = ($('olServer') && $('olServer').value.trim()) || get('arena151.server') || '';
    if (!v) return /^https?:$/.test(location.protocol) ? location.origin : '';
    const c = (typeof serverCandidates === 'function' ? serverCandidates(v) : [])[0] || ''; return c.replace(/^ws/i, 'http').replace(/\/ws\/?$/i, '');
  }
  async function api(method, path, body) {
    const base = httpBase(); if (!base) throw new Error('Set your server address on the Online tab first.');
    const tok = authToken(), r = await fetch(base + '/api' + path, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'The server said no.'); return j;
  }

  /* ---------- the Ranked panel (Online tab) ---------- */
  const css = document.createElement('style'); css.textContent = `
  #rkBox{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,216,74,.07);border:1px solid rgba(255,216,74,.35);font:600 13px var(--ui,Rubik,sans-serif);color:#e4e8ff}
  #rkBox h4{margin:0 0 6px;font:900 13px var(--ui,Rubik,sans-serif);color:#ffd84a;letter-spacing:.06em}
  #rkBox .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  #rkBox .why{color:#ffb3cf;font-size:12px}
  #rkBox ol{margin:6px 0 0;padding-left:20px;max-height:120px;overflow:auto;font-size:12px}#rkBox ol b{color:#ffd84a}
  .st-btn.story-party{margin-left:4px}`;
  document.head.appendChild(css);
  function mountRanked() {
    if ($('rkBox') || !$('olJoin')) return;
    const box = document.createElement('div'); box.id = 'rkBox';
    box.innerHTML = `<h4>RANKED</h4><div class="row"><span id="rkMe">Rating: —</span><button class="st-btn" type="button" id="rkGo">Find ranked match</button><button class="st-btn" type="button" id="rkLeave" hidden>Leave queue</button><button class="st-btn" type="button" id="rkTop">Top 10</button></div><div class="why" id="rkWhy"></div><ol id="rkList" hidden></ol>`;
    const anchor = $('olJoin').closest('.row') || $('olJoin').parentNode; anchor.parentNode.insertBefore(box, anchor.nextSibling);
    $('rkGo').onclick = queue; $('rkLeave').onclick = () => { try { netSend({ t: 'rleave' }); } catch (e) { } };
    $('rkTop').onclick = showTop; refreshMe();
  }
  function syncEligibility() { const ok = campaignBeaten(); const go = $('rkGo'); if (!go) return; go.disabled = !ok; $('rkWhy').textContent = ok ? '' : 'Beat the story campaign to unlock ranked.'; }
  async function refreshMe() { syncEligibility(); try { const me = await api('POST', '/ranked/me', { deviceKey: deviceKey(), name: typeof trainerTitle === 'function' ? trainerTitle(TRSEL.A) : 'Trainer', finished: campaignBeaten() });
      put('arena151.rating', String(me.rating)); $('rkMe').textContent = `Rating: ${me.rating} · ${me.wins}W ${me.losses}L${me.draws ? ' ' + me.draws + 'D' : ''}${me.wins + me.losses + me.draws ? ' · #' + me.rank : ''}`;
      if (!me.eligible && me.account) $('rkWhy').textContent = 'Beat the story campaign (and let your save sync) to unlock ranked.'; } catch (e) { $('rkMe').textContent = 'Rating: — (connect to your server)'; } }
  async function showTop() { const l = $('rkList'); l.hidden = !l.hidden; if (l.hidden) return; l.innerHTML = '<li>Loading…</li>';
    try { const t = await api('GET', '/ranked/top'); l.innerHTML = t.top.length ? t.top.map(r => `<li><b>${r.rating}</b> ${esc(r.name)} · ${r.wins}W ${r.losses}L</li>`).join('') : '<li>No ranked matches yet.</li>'; } catch (e) { l.innerHTML = `<li>${esc(e.message)}</li>`; } }
  async function queue() {
    if (!campaignBeaten()) return syncEligibility();
    try { await netConnect(); } catch (e) { return; }
    netSend({ t: 'rqueue', ...myInfo(), token: authToken() || undefined, deviceKey: deviceKey(), finished: campaignBeaten() });
  }
  window.onNetExtra = m => {
    if (m.t === 'rqueued') { netStatus(`In the ranked queue (rating ${m.rating}) — looking for an opponent…`, 'ok'); $('rkGo').hidden = true; $('rkLeave').hidden = false; }
    else if (m.t === 'rleft') { netStatus('Left the ranked queue.', 'ok'); $('rkGo').hidden = false; $('rkLeave').hidden = true; }
    else if (m.t === 'rmatched') { netStatus(`Ranked match found: ${m.opp} (rating ${m.oppRating})`, 'ok'); $('rkGo').hidden = false; $('rkLeave').hidden = true; }
    else if (m.t === 'rated') { const d = m.after - m.before; put('arena151.rating', String(m.after)); if (typeof toast === 'function') toast(`Ranked: ${m.before} → ${m.after} (${d >= 0 ? '+' : ''}${d})`); setTimeout(refreshMe, 400); }
  };
  if (typeof beginOnline === 'function') { const _bo = beginOnline; beginOnline = function (m) { const r = _bo.apply(this, arguments); try { if (m && m.opp && m.opp.title && typeof toast === 'function') toast(`${m.opp.trainer} — ${m.opp.title}`); } catch (e) { } return r; }; }
  setInterval(() => { mountRanked(); syncEligibility(); }, 1500); mountRanked();

  /* ---------- "Use my story party" (start screen) ---------- */
  function mountStoryParty() {
    const row = document.querySelector('#startOv [data-def="A"]'); if (!row || document.querySelector('#startOv .story-party')) return;
    const b = document.createElement('button'); b.className = 'st-btn story-party'; b.type = 'button'; b.textContent = '📖 Story party';
    b.title = 'Use your story-mode team'; row.after(b);
    b.onclick = () => { const slot = get('arena151.storySlot') || '1'; let s = null; try { s = JSON.parse(get('arena151.story.' + slot) || 'null'); } catch (e) { }
      if (!s || !(s.team || []).length) { if (typeof toast === 'function') toast('No story party yet — start a journey in Story mode.'); return; }
      const t = s.team.slice(0, 6); while (t.length < 6) t.push(''); setParty('A', t); try { renderStartTeams(); } catch (e) { } };
  }
  setInterval(mountStoryParty, 1500); mountStoryParty();

  /* ---------- ghost battles: wandering trainers from real online teams ---------- */
  if (typeof STORY === 'undefined' || typeof GYMS === 'undefined') return;
  const STYLES = ['aggro', 'switcher', 'status', 'defensive'];
  async function wanderingTrainer() {
    const s = STORY.save; if (!s) return;
    let g; try { g = await api('GET', '/ghost'); } catch (e) { if (typeof toast === 'function') toast('Set your server address on the Online tab to meet wandering trainers.'); return; }
    const team = (g.team || []).filter(n => typeof DEX_BY_NAME !== 'undefined' && DEX_BY_NAME[String(n).split('|')[0]]);
    if (!team.length) { if (typeof toast === 'function') toast('No wandering trainers yet — they come from online battles on your server.'); return; }
    const file = g.trainer && typeof ALL_TRAINERS !== 'undefined' && ALL_TRAINERS.includes(g.trainer) ? g.trainer : 'Gary', who = { file, leader: 'Wandering ' + (typeof trainerTitle === 'function' ? trainerTitle(file) : file) };
    closeModal();
    await playScene([['foe', 'I’ve battled trainers all over — online, for real. This team has beaten people just like you.'], ['me', 'Then let’s see it.']], who, { title: 'Ghost battle', text: 'A real team recorded from an online battle on your server.' });
    const i = Math.min(s.badges, GYMS.length - 1), lvl = Math.max(1, (gymAt(i).ai || gymAt(i).n) - 1);
    STORY.battle = { gym: i, ghost: true, level: lvl, practice: true };
    STORY.nextRules = { foeScale: STORY_DATA.diff().scale, aiStyle: STYLES[Math.floor(Math.random() * STYLES.length)], bonus: typeof storyRuleExtras === 'function' ? storyRuleExtras({ rival: false, n: 0 }).bonus : null };
    if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
    TRSEL.A = s.trainer; TRSEL.B = file; loadTrainer(s.trainer); loadTrainer(file);
    try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
    watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
    $('timeLimit').value = '0'; $('storyOv').classList.remove('show'); STORY.open = false;
    startBattle(s.team.slice(), team.slice(0, 6), 'random'); STORY.battle.G = G; STORY.battle.who = who;
  }
  const _res = storyResult;
  storyResult = async function (won) {
    const b = STORY.battle; if (!b || !b.ghost) return _res.apply(this, arguments);
    STORY.battle = null; STORY.nextRules = null; const s = STORY.save; s.ghosts = s.ghosts || { w: 0, l: 0 }; if (won) s.ghosts.w++; else s.ghosts.l++; saveStory();
    showOverlay('ovResults', false); openStoryScreen();
    await playScene([['foe', won ? 'You beat a team that beat real players. Respect.' : 'Real players fear this team for a reason. See you around.']], b.who);
    try { renderStory(); } catch (e) { }
  };
  function mountGhostButton() {
    const s = STORY.save, host = [...document.querySelectorAll('#storyOv button')].find(x => /Pok[eé]dex/.test(x.textContent));
    if (!host || document.getElementById('syGhost')) return;
    const b = document.createElement('button'); b.id = 'syGhost'; b.type = 'button'; b.className = host.className; b.textContent = '👻 Wandering trainer';
    b.title = 'Battle a real team recorded from online battles on your server'; host.after(b); b.onclick = wanderingTrainer;
    b.hidden = !(s && s.badges >= 1);
  }
  const _render = renderStory;
  renderStory = function () { const r = _render.apply(this, arguments); try { mountGhostButton(); const g = $('syGhost'); if (g) g.hidden = !(STORY.save && STORY.save.badges >= 1); } catch (e) { } return r; };
  window.wanderingTrainer = wanderingTrainer;
})();
