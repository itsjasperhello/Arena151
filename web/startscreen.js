/* =====================================================================
   Section 15: start screen — set up a match
   Trainers (Human/AI), both teams, arena and time limit, then BATTLE!
   Opens at launch with Ash (Human) vs Gary (AI); music/Opening.mp3
   plays while it is up.
   ===================================================================== */
const START = { open: false, ctrl: { A: 'human', B: 'ai' }, arena: 'random', slot: null };

(function startStyles() {
  const st = document.createElement('style');
  st.textContent = `
#startOv{position:fixed;inset:0;z-index:60;display:none;overflow:auto;color:#fff;font-family:var(--ui);
  background:radial-gradient(1200px 700px at 50% -10%,#3a2f8f 0%,#171a44 45%,#0a0c1e 100%)}
#startOv.show{display:block}
#startOv .st-bg{position:fixed;inset:0;pointer-events:none;overflow:hidden}
#startOv .st-ball{position:absolute;border-radius:50%;opacity:.07;border:6px solid #fff;animation:stDrift linear infinite}
#startOv .st-ball::before{content:'';position:absolute;left:-6px;right:-6px;top:calc(50% - 4px);height:8px;background:#fff}
#startOv .st-ball::after{content:'';position:absolute;left:calc(50% - 16%);top:calc(50% - 16%);width:32%;height:32%;border-radius:50%;border:6px solid #fff;background:#171a44;box-sizing:border-box}
@keyframes stDrift{from{transform:translateY(0) rotate(0)}to{transform:translateY(-120vh) rotate(360deg)}}
#startOv .st-wrap{position:relative;max-width:1180px;margin:0 auto;padding:18px 18px 28px;display:flex;flex-direction:column;gap:14px;min-height:100%;box-sizing:border-box}
#startOv .st-head{text-align:center}
#startOv .st-logo{font-family:var(--display);font-size:clamp(40px,7vw,76px);line-height:.95;letter-spacing:1px;color:#ffd84a;
  text-shadow:0 4px 0 #b3471b,0 8px 0 #4a1a0c,0 0 30px rgba(255,170,60,.45);-webkit-text-stroke:2px #3a1608}
#startOv .st-logo b{color:#fff;-webkit-text-stroke:2px #1c2a6a;text-shadow:0 4px 0 #2d5aa8,0 8px 0 #10204a,0 0 30px rgba(120,170,255,.5)}
#startOv .st-sub{margin-top:8px;font:600 13px var(--ui);letter-spacing:.22em;text-transform:uppercase;color:#a9b6ff}
#startOv .st-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:stretch}
#startOv .st-side{position:relative;border-radius:22px;padding:14px 14px 12px;display:flex;flex-direction:column;gap:10px;
  background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.12);box-shadow:0 10px 40px rgba(0,0,0,.35)}
#startOv .st-side.red{box-shadow:inset 0 0 0 2px rgba(255,75,85,.35),0 10px 40px rgba(0,0,0,.35);background:linear-gradient(160deg,rgba(255,75,85,.22),rgba(255,75,85,.04) 55%,rgba(255,255,255,.02))}
#startOv .st-side.blue{box-shadow:inset 0 0 0 2px rgba(74,166,255,.35),0 10px 40px rgba(0,0,0,.35);background:linear-gradient(200deg,rgba(74,166,255,.22),rgba(74,166,255,.04) 55%,rgba(255,255,255,.02))}
#startOv .st-tag{font-family:var(--display);font-size:22px;letter-spacing:1px}
#startOv .red .st-tag{color:#ff6b73}#startOv .blue .st-tag{color:#6fb8ff;text-align:right}
#startOv .st-trainer{display:flex;align-items:center;justify-content:center;gap:8px}
#startOv .st-stage{position:relative;width:150px;height:150px;flex:none}
#startOv .st-stage::before{content:'';position:absolute;left:12%;right:12%;bottom:6px;height:22px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.45),transparent)}
#startOv .st-stage canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}
#startOv .st-arrow{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font:700 22px var(--ui);cursor:pointer;flex:none}
#startOv .st-arrow:hover{background:rgba(255,255,255,.22)}
#startOv .st-tname{text-align:center;font-family:var(--display);font-size:26px;letter-spacing:.5px}
#startOv .st-tsel{display:block;margin:-4px auto 0;background:rgba(10,14,34,.7);color:#dfe6ff;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:5px 10px;font:14px var(--ui)}
#startOv .st-ctrl{display:flex;justify-content:center;gap:0;margin:2px auto 0;border-radius:999px;background:rgba(0,0,0,.35);padding:3px;width:max-content}
#startOv .st-ctrl button{border:0;border-radius:999px;padding:6px 16px;font:700 13px var(--ui);color:#c7cff0;background:transparent;cursor:pointer;letter-spacing:.06em}
#startOv .st-ctrl button.on{background:#fff;color:#141a33}
#startOv .st-ctrl button:disabled{cursor:default;opacity:.55}
#startOv .st-note{text-align:center;font:12px var(--ui);color:#9aa6d6;min-height:15px}
#startOv .st-team{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#startOv .st-mon{position:relative;color:#fff;font-family:var(--ui);border-radius:14px;padding:6px 4px 5px;background:rgba(8,12,32,.55);border:1px solid rgba(255,255,255,.1);cursor:pointer;text-align:center;transition:transform .12s,border-color .12s}
#startOv .st-mon:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.35)}
#startOv .st-mon .pic{height:62px;display:flex;align-items:flex-end;justify-content:center}
#startOv .st-mon img,#startOv .st-mon canvas{max-height:62px;max-width:100%;image-rendering:pixelated}
#startOv .red .st-mon img,#startOv .red .st-mon canvas{transform:scaleX(-1)}
#startOv .st-mon .nm{font:700 12px var(--ui);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#startOv .st-mon .ty{display:flex;gap:3px;justify-content:center;margin-top:3px}
#startOv .st-mon .ty i{font-style:normal;font:700 9px var(--ui);padding:1px 5px;border-radius:999px;color:#111;text-transform:uppercase}
#startOv .st-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
#startOv .st-btn{border:0;border-radius:12px;padding:8px 14px;font:700 13px var(--ui);background:rgba(255,255,255,.12);color:#fff;cursor:pointer}
#startOv .st-btn:hover{background:rgba(255,255,255,.22)}
#startOv .st-vs{display:flex;align-items:center;justify-content:center}
#startOv .st-vsball{width:96px;height:96px;border-radius:50%;position:relative;border:5px solid #10131c;box-shadow:0 0 0 3px rgba(255,255,255,.15),0 0 40px rgba(255,90,90,.35);
  background:linear-gradient(to bottom,#ef3b3b 0 46%,#10131c 46% 54%,#f2f2f2 54%);animation:stPulse 2.4s ease-in-out infinite}
#startOv .st-vsball span{position:absolute;inset:0;margin:auto;width:46px;height:46px;border-radius:50%;background:#fff;border:5px solid #10131c;box-sizing:border-box;
  display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:17px;color:#10131c}
@keyframes stPulse{0%,100%{transform:scale(1) rotate(-6deg)}50%{transform:scale(1.06) rotate(6deg)}}
#startOv .st-sec{font:700 12px var(--ui);letter-spacing:.2em;text-transform:uppercase;color:#a9b6ff;margin:2px 4px -4px}
#startOv .st-arenas{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 8px;scroll-snap-type:x mandatory}
#startOv .st-arena{flex:none;width:168px;font-family:var(--ui);border-radius:14px;overflow:hidden;border:2px solid transparent;background:#0b1024;cursor:pointer;scroll-snap-align:start;position:relative;padding:0;color:#fff;text-align:left}
#startOv .st-arena img{display:block;width:100%;height:104px;object-fit:cover}
#startOv .st-arena .an{padding:6px 9px 8px;font:700 13px var(--ui)}
#startOv .st-arena.on{border-color:#ffd84a;box-shadow:0 0 0 3px rgba(255,216,74,.25),0 8px 24px rgba(0,0,0,.4)}
#startOv .st-arena.rand .pic{height:104px;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-size:44px;background:repeating-linear-gradient(45deg,#1d2350 0 14px,#232a5e 14px 28px);color:#ffd84a}
#startOv .st-foot{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
#startOv .st-foot label{font:600 13px var(--ui);color:#c7cff0;display:flex;gap:8px;align-items:center}
#startOv .st-foot select{background:rgba(10,14,34,.8);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:6px 8px;font:13px var(--ui)}
#startOv .st-go{border:0;border-radius:18px;padding:14px 46px;font-family:var(--display);font-size:30px;letter-spacing:1px;color:#2a1206;cursor:pointer;
  background:linear-gradient(#ffe066,#ffb627);box-shadow:0 6px 0 #b86a0d,0 12px 30px rgba(255,170,40,.45);transition:transform .08s}
#startOv .st-go:active{transform:translateY(4px);box-shadow:0 2px 0 #b86a0d,0 6px 18px rgba(255,170,40,.45)}
#stPick{position:fixed;inset:0;z-index:70;background:rgba(4,6,16,.78);display:none;align-items:center;justify-content:center;padding:16px}
#stPick.show{display:flex}
#stPick .pk{width:min(920px,100%);max-height:100%;display:flex;flex-direction:column;gap:10px;background:#121736;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
#stPick .pk-top{display:flex;gap:10px;align-items:center}
#stPick .st-btn{border:0;border-radius:12px;padding:10px 16px;font:700 14px var(--ui);background:rgba(255,255,255,.14);color:#fff;cursor:pointer}
#stPick input{flex:1;background:#0a0e24;border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:10px 12px;color:#fff;font:15px var(--ui)}
#stPick .pk-grid{overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;padding-right:4px}
#stPick .pk-grid button{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.04);color:#fff;padding:6px 4px;cursor:pointer;font:600 11px var(--ui)}
#stPick .pk-grid button:hover{border-color:rgba(255,216,74,.7);background:rgba(255,216,74,.08)}
#stPick .pk-grid .pic{height:52px;display:flex;align-items:flex-end;justify-content:center}
#stPick .pk-grid img,#stPick .pk-grid canvas{max-height:52px;max-width:100%;image-rendering:pixelated}
#stPick .pk-grid small{display:block;color:#8f9bd0;font-size:10px}
@media (max-height:560px){
  #startOv .st-wrap{padding:6px 10px 10px;gap:6px}
  #startOv .st-head{display:flex;align-items:baseline;justify-content:center;gap:12px} #startOv .st-logo{font-size:26px;-webkit-text-stroke:1px #3a1608;text-shadow:0 2px 0 #b3471b,0 4px 0 #4a1a0c}
  #startOv .st-logo b{-webkit-text-stroke:1px #1c2a6a;text-shadow:0 2px 0 #2d5aa8,0 4px 0 #10204a} #startOv .st-sub{margin:0;font-size:10px}
  #startOv .st-grid{gap:8px}
  #startOv .st-side{display:grid;gap:3px 8px;padding:7px 9px;border-radius:16px;grid-template-columns:auto 1fr;grid-template-areas:"tr name" "tr ctrl" "team team" "row row"}
  #startOv .st-side.blue{grid-template-columns:1fr auto;grid-template-areas:"name tr" "ctrl tr" "team team" "row row"}
  #startOv .st-tag{display:none} #startOv .st-tsel,#startOv .st-note{display:none}
  #startOv .st-trainer{grid-area:tr;gap:2px} #startOv .st-stage{width:70px;height:70px} #startOv .st-arrow{width:24px;height:24px;font-size:15px}
  #startOv .st-tname{grid-area:name;align-self:end;text-align:left;font-size:18px} #startOv .blue .st-tname{text-align:right}
  #startOv .st-ctrl{grid-area:ctrl;margin:0;align-self:start} #startOv .blue .st-ctrl{justify-self:end} #startOv .st-ctrl button{padding:4px 11px;font-size:11px}
  #startOv .st-team{grid-area:team;grid-template-columns:repeat(6,1fr);gap:4px} #startOv .st-mon{padding:3px 2px;border-radius:10px} #startOv .st-mon .pic{height:34px} #startOv .st-mon img,#startOv .st-mon canvas{max-height:34px}
  #startOv .st-mon .ty{display:none} #startOv .st-mon .nm{font-size:9px;margin-top:1px}
  #startOv .st-row{grid-area:row} #startOv .st-btn{padding:4px 10px;font-size:11px;border-radius:9px}
  #startOv .st-vsball{width:48px;height:48px;border-width:3px} #startOv .st-vsball span{width:24px;height:24px;font-size:9px;border-width:3px}
  #startOv .st-sec{display:none} #startOv .st-arenas{padding:2px 2px 4px;gap:6px}
  #startOv .st-arena{width:104px;border-radius:10px} #startOv .st-arena img,#startOv .st-arena.rand .pic{height:46px} #startOv .st-arena.rand .pic{font-size:26px} #startOv .st-arena .an{font-size:10px;padding:3px 6px 4px}
  #startOv .st-foot{gap:8px} #startOv .st-foot label{font-size:11px} #startOv .st-go{font-size:20px;padding:7px 26px;border-radius:14px}
}
@media (min-height:561px) and (max-height:1000px){
  #startOv .st-wrap{gap:9px;padding-top:12px} #startOv .st-logo{font-size:clamp(36px,5.4vw,58px)} #startOv .st-sub{margin-top:4px}
  #startOv .st-side{gap:7px;padding:10px 12px} #startOv .st-stage{width:118px;height:118px} #startOv .st-tname{font-size:22px}
  #startOv .st-mon .pic{height:46px} #startOv .st-mon img,#startOv .st-mon canvas{max-height:46px} #startOv .st-team{gap:6px}
  #startOv .st-arena{width:150px} #startOv .st-arena img,#startOv .st-arena.rand .pic{height:78px} #startOv .st-go{font-size:26px;padding:11px 40px}
}
@media (max-width:760px) and (min-height:561px){ #startOv .st-grid{grid-template-columns:1fr;} #startOv .st-vs{order:0} }   /* narrow AND tall only: landscape phones (incl. iPhone safe areas) keep side by side */
@media (max-height:380px){ #startOv .st-wrap{padding-top:4px;padding-bottom:2px} }   /* shortest iPhone landscape safe areas */
@media (prefers-reduced-motion:reduce){ #startOv .st-ball,#startOv .st-vsball{animation:none} }`;
  document.head.appendChild(st);
})();

/* ---------- markup ---------- */
(function startMarkup() {
  const ov = document.createElement('div'); ov.id = 'startOv'; ov.classList.add('show');   // the first thing on screen, even while loading ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Set up a battle');
  const balls = Array.from({ length: 9 }, (_, k) => { const s = 70 + (k * 37) % 120; return `<div class="st-ball" style="width:${s}px;height:${s}px;left:${(k * 13 + 4) % 96}%;top:${100 + (k * 23) % 60}%;animation-duration:${26 + (k * 7) % 22}s;animation-delay:-${(k * 5) % 20}s"></div>`; }).join('');
  const side = (S, cls, label) => `<section class="st-side ${cls}" aria-label="${label}">
      <div class="st-tag">${label}</div>
      <div class="st-trainer"><button class="st-arrow" data-tr="${S}" data-d="-1" aria-label="Previous trainer">‹</button><div class="st-stage"><canvas id="stTr${S}" width="160" height="160"></canvas></div><button class="st-arrow" data-tr="${S}" data-d="1" aria-label="Next trainer">›</button></div>
      <div class="st-tname" id="stName${S}"></div>
      <select class="st-tsel" id="stSel${S}" aria-label="${label} trainer"></select>
      <div class="st-ctrl" role="group" aria-label="${label} control"><button data-c="${S}" data-v="human">HUMAN</button><button data-c="${S}" data-v="ai">AI</button></div>
      <div class="st-note" id="stNote${S}"></div>
      <div class="st-team" id="stTeam${S}"></div>
      <div class="st-row"><button class="st-btn" data-rand="${S}">🎲 Random team</button><button class="st-btn" data-def="${S}">Starter team</button></div>
    </section>`;
  ov.innerHTML = `<div class="st-bg">${balls}</div><div class="st-wrap">
    <header class="st-head"><div class="st-logo">ARENA <b>151</b></div><div class="st-sub">Live 6v6 Pokémon battles · set up your match</div></header>
    <div class="st-grid">${side('A', 'red', 'Red')}<div class="st-vs"><div class="st-vsball"><span>VS</span></div></div>${side('B', 'blue', 'Blue')}</div>
    <div class="st-sec">Choose your arena</div><div class="st-arenas" id="stArenas"></div>
    <div class="st-foot"><label>Time limit <select id="stTime"><option value="0">None</option><option value="180">3:00</option><option value="300">5:00</option><option value="600">10:00</option></select></label>
      <button class="st-go" id="stGo">BATTLE!</button>
      <button class="st-btn" id="stContinue" type="button" hidden>Continue last battle</button>
      <button class="st-btn" id="stBack" hidden>Back to battle</button><button class="st-btn" id="stSettings">Settings</button><button class="st-btn" id="stHelp">Controls</button></div>
  </div>`;
  document.body.appendChild(ov);
  const pk = document.createElement('div'); pk.id = 'stPick'; pk.setAttribute('role', 'dialog'); pk.setAttribute('aria-label', 'Choose a Pokémon');
  pk.innerHTML = `<div class="pk"><div class="pk-top"><input id="stSearch" placeholder="Search by name, number or type…" autocomplete="off"><button class="st-btn" id="stPickClose">Close</button></div><div class="pk-grid" id="stGridPk"></div></div>`;
  document.body.appendChild(pk);
})();

/* ---------- Pokémon pictures: the animated GIF pack, falling back to the generated art ---------- */
function monPic(name) {
  const wrap = document.createElement('div'); wrap.className = 'pic';
  const fallback = () => { const c = document.createElement('canvas'); c.width = 56; c.height = 56; try { drawSpriteTo(c, name, {}); } catch (e) { } wrap.replaceChildren(c); };
  const img = new Image(); img.alt = name; img.loading = 'lazy'; img.decoding = 'async'; let tried = 0;
  img.onerror = () => { if (tried++ === 0) img.src = spriteUrl(spriteSlug(name) + '.png'); else fallback(); };
  img.src = spriteUrl(spriteSlug(name) + '.gif'); wrap.appendChild(img); return wrap;
}
const typeChips = name => (DEX_BY_NAME[name].types).map(t => `<i style="background:${TYPE_COLOR[t]}">${t}</i>`).join('');

/* ---------- rendering the panels ---------- */
function stTeam(S) { return readPickers(S); }
function renderStartTeams() {
  for (const S of ['A', 'B']) {
    const box = $('stTeam' + S); box.replaceChildren();
    stTeam(S).forEach((name, i) => {
      const b = document.createElement('button'); b.className = 'st-mon'; b.type = 'button'; b.setAttribute('aria-label', `${TEAM_NAME[S]} slot ${i + 1}: ${name}. Change`);
      b.appendChild(monPic(name)); b.insertAdjacentHTML('beforeend', `<div class="nm">${name}</div><div class="ty">${typeChips(name)}</div>`);
      b.onclick = () => openMonPicker(S, i); box.appendChild(b);
    });
  }
}
function renderStartTrainers() {
  for (const S of ['A', 'B']) {
    const sel = $('stSel' + S); if (!sel.options.length) sel.innerHTML = TRAINERS.map(n => `<option value="${n}">${trainerTitle(n)}</option>`).join('');
    sel.value = TRSEL[S]; $('stName' + S).textContent = trainerTitle(TRSEL[S]).toUpperCase(); loadTrainer(TRSEL[S]);
    for (const btn of document.querySelectorAll(`#startOv .st-ctrl button[data-c="${S}"]`)) { btn.classList.toggle('on', START.ctrl[S] === btn.dataset.v); btn.setAttribute('aria-pressed', String(START.ctrl[S] === btn.dataset.v)); }
  }
  document.querySelector('#startOv .st-ctrl button[data-c="B"][data-v="human"]').disabled = true;
  $('stNoteA').textContent = START.ctrl.A === 'human' ? 'You control Red' : 'AI vs AI — watch the battle';
  $('stNoteB').textContent = 'Blue is played by the AI';
}
function renderStartArenas() {
  const box = $('stArenas'); box.replaceChildren();
  const card = (id, name, inner) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'st-arena' + (id === 'random' ? ' rand' : '') + (START.arena === id ? ' on' : ''); b.innerHTML = inner + `<div class="an">${name}</div>`; b.setAttribute('aria-pressed', String(START.arena === id)); b.onclick = () => { START.arena = id; renderStartArenas(); }; box.appendChild(b); };
  card('random', 'Random arena', '<div class="pic">?</div>');
  for (const id of STAGE_ORDER) card(id, STAGES[id].name, `<img src="${STAGE_THUMB[id] || ''}" alt="">`);
}
// animated trainers, facing each other
(function stTrainerLoop() {
  const tick = () => {
    if (START.open) for (const S of ['A', 'B']) {
      const c = $('stTr' + S), a = TR_ANIM[TRSEL[S]], x = c.getContext('2d'); x.clearRect(0, 0, 160, 160); if (!a || !a.frames) continue;
      const f = a.frames[animFrameIndex(a, performance.now() + (S === 'B' ? 333 : 0))], sc = Math.floor(Math.min(150 / a.w, 150 / a.h) * 2) / 2 || 1;
      x.save(); x.imageSmoothingEnabled = false; if (mirrorTrainer(S)) { x.translate(160, 0); x.scale(-1, 1); }
      x.drawImage(f, (160 - a.w * sc) / 2, 156 - a.h * sc, a.w * sc, a.h * sc); x.restore();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ---------- Pokémon picker ---------- */
function openMonPicker(S, i) {
  START.slot = { S, i }; const grid = $('stGridPk');
  if (!grid.childElementCount) for (const d of DEX) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.q = `${d.name} ${String(d.id).padStart(3, '0')} ${d.types.join(' ')}`.toLowerCase();
    b.appendChild(monPic(d.name)); b.insertAdjacentHTML('beforeend', `${d.name}<small>#${String(d.id).padStart(3, '0')} · ${d.types.join('/')}</small>`);
    b.onclick = () => { const { S, i } = START.slot, team = readPickers(S); team[i] = d.name; setPickers(S === 'A' ? team : readPickers('A'), S === 'B' ? team : readPickers('B')); closeMonPicker(); renderStartTeams(); };
    grid.appendChild(b);
  }
  $('stSearch').value = ''; filterPicker(''); $('stPick').classList.add('show'); setTimeout(() => $('stSearch').focus(), 30);
}
function closeMonPicker() { $('stPick').classList.remove('show'); }
function filterPicker(q) { q = q.trim().toLowerCase(); for (const b of $('stGridPk').children) b.style.display = !q || b.dataset.q.includes(q) ? '' : 'none'; }
$('stSearch').oninput = e => filterPicker(e.target.value);
$('stPickClose').onclick = closeMonPicker;
$('stPick').onclick = e => { if (e.target.id === 'stPick') closeMonPicker(); };

/* ---------- controls ---------- */
for (const b of document.querySelectorAll('#startOv .st-arrow')) b.onclick = () => { const S = b.dataset.tr, k = TRAINERS.indexOf(TRSEL[S]); TRSEL[S] = TRAINERS[(k + +b.dataset.d + TRAINERS.length) % TRAINERS.length]; saveTrsel(); renderStartTrainers(); syncTrainerPickers(); };
for (const S of ['A', 'B']) $('stSel' + S).onchange = e => { TRSEL[S] = e.target.value; saveTrsel(); renderStartTrainers(); syncTrainerPickers(); };
for (const b of document.querySelectorAll('#startOv .st-ctrl button')) b.onclick = () => { if (b.disabled) return; START.ctrl[b.dataset.c] = b.dataset.v; renderStartTrainers(); };
for (const b of document.querySelectorAll('#startOv [data-rand]')) b.onclick = () => { const S = b.dataset.rand, t = randomTeam(); setPickers(S === 'A' ? t : readPickers('A'), S === 'B' ? t : readPickers('B')); renderStartTeams(); };
for (const b of document.querySelectorAll('#startOv [data-def]')) b.onclick = () => { const S = b.dataset.def; setPickers(S === 'A' ? DEFAULT_A : readPickers('A'), S === 'B' ? DEFAULT_B : readPickers('B')); renderStartTeams(); };
$('stSettings').onclick = () => { const b = $('bSettings'); if (b) b.click(); };
$('stBack').onclick = () => { hideStart(); clock.paused = false; };
$('stHelp').onclick = () => { const b = $('bHelp'); if (b) b.click(); };
function syncTrainerPickers() { for (const S of ['A', 'B']) { const s = $('trSel' + S); if (s) s.value = TRSEL[S]; } if (typeof refreshTrainerLabels === 'function') refreshTrainerLabels(); try { drawMinis(); } catch (e) { } }
$('stContinue').onclick = () => { hideStart(); loadKey('auto'); };
$('stGo').onclick = () => {
  $('stageSel').value = START.arena; $('timeLimit').value = $('stTime').value;
  watchMode = START.ctrl.A === 'ai'; syncWatchButton(); syncTrainerPickers();
  hideStart(); startBattle(readPickers('A'), readPickers('B'));
};

/* ---------- opening and closing ---------- */
function showStart() {
  START.open = true; START.arena = $('stageSel').value || 'random'; $('stTime').value = $('timeLimit').value || '0';
  if (G && G.phase !== 'title' && G.phase !== 'over') { clock.paused = true; }
  ['ovTitle', 'ovResults'].forEach(id => showOverlay(id, false));
  $('stBack').hidden = !(G && G.phase === 'battle');
  renderStartTrainers(); renderStartTeams(); renderStartArenas(); $('startOv').classList.add('show'); $('startOv').scrollTop = 0; setTimeout(() => $('stGo').focus({ preventScroll: true }), 50);
}
function hideStart() { START.open = false; $('startOv').classList.remove('show'); closeMonPicker(); }
// Launch: Ash (Human) vs Gary (AI) every time the app opens, then the start screen.
(function launchDefaults() {
  for (const [S, n] of [['A', 'Ash'], ['B', 'Gary']]) if (TRAINERS.includes(n)) TRSEL[S] = n;
  START.ctrl.A = 'human'; START.ctrl.B = 'ai'; saveTrsel();
  const iv = setInterval(() => { if (typeof G !== 'undefined' && G && G.phase === 'title' && $('pickA0')) { clearInterval(iv); watchMode = false; syncWatchButton(); showStart(); } }, 80);
})();
// From a finished battle or the menu, come back here.
(function wireReturns() {
  const res = $('rTeams'); if (res) { const b = document.createElement('button'); b.className = 'btn'; b.id = 'rMenu'; b.type = 'button'; b.textContent = 'Main menu'; b.onclick = showStart; res.insertAdjacentElement('beforebegin', b); }
  const nb = $('bNew'); if (nb) nb.onclick = () => { if (typeof closeMenu === 'function') try { closeMenu(); } catch (e) { } showStart(); };
})();
window.addEventListener('keydown', e => {
  if ($('stPick').classList.contains('show')) { if (e.key === 'Escape') closeMonPicker(); return; }
  if (START.open && e.key === 'Enter' && document.activeElement && document.activeElement.tagName !== 'SELECT' && document.activeElement.tagName !== 'BUTTON') $('stGo').click();
}, true);

/* ---------- always fit the window (like the app): scale the whole start screen down when the window is too small ---------- */
function fitStart() {
  const ov = $('startOv'), w = ov && ov.querySelector('.st-wrap'); if (!w || !ov.classList.contains('show')) return;
  w.style.transform = ''; w.style.minHeight = '0px';                        // measure the content's natural size
  const need = w.scrollHeight, needW = w.scrollWidth, H = ov.clientHeight, W = ov.clientWidth;
  const s = Math.min(1, H / need, W / Math.max(needW, 1));
  if (s < 0.995) { w.style.transformOrigin = 'top center'; w.style.transform = `scale(${s.toFixed(4)})`; ov.style.overflow = 'hidden'; }
  else { w.style.minHeight = ''; ov.style.overflow = ''; }
}
let fitQueued = false;
const queueFit = () => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fitStart(); }); };
window.addEventListener('resize', queueFit);
(function watchStart() {
  const w = document.querySelector('#startOv .st-wrap');
  if (w && window.ResizeObserver) new ResizeObserver(queueFit).observe(w);
  const ov = $('startOv'); if (ov) new MutationObserver(queueFit).observe(ov, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
  setTimeout(queueFit, 0);
})();
// Safety net: whenever the game is on its title state, the start screen is showing (it is the main menu).
setInterval(() => {
  if (typeof G === 'undefined' || !G || G.phase !== 'title' || START.open) return;
  if (typeof NET !== 'undefined' && (NET.active || NET.tour)) return;
  showStart();
}, 1500);
