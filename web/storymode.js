/* =====================================================================
   Section 20: STORY MODE — the badge journey
   Pick a trainer and a team, then travel an animated region map from gym
   to gym and beat all 8 gym leaders. Each leader's AI difficulty equals
   their gym number (1–8). Gyms are marked with the leader's portrait and
   coloured by order, green (first) to red (last). Progress is saved.
   ===================================================================== */
const GYMS = [
  { n: 1, leader: 'Brock', file: 'Brock', city: 'Pewter City', type: 'Rock', badge: 'Boulder Badge', arena: 'grotto', x: 190, y: 175,
    team: ['Sandshrew', 'Diglett', 'Cubone', 'Omanyte', 'Geodude', 'Onix'],
    hello: 'My rock-hard resolve is as tough as my Pokémon. Show me what you\u2019ve got!',
    win: 'Solid as stone. Train harder and come back.', lose: 'Your strategy cracked my defense. The Boulder Badge is yours.' },
  { n: 2, leader: 'Misty', file: 'Misty', city: 'Cerulean City', type: 'Water', badge: 'Cascade Badge', arena: 'glacier', x: 505, y: 118,
    team: ['Goldeen', 'Poliwag', 'Shellder', 'Horsea', 'Staryu', 'Starmie'],
    hello: 'Water adapts to anything. Can your team keep up with the current?',
    win: 'Washed out! Come back when you can swim with the tide.', lose: 'Okay, okay \u2014 you win! Take the Cascade Badge.' },
  { n: 3, leader: 'Lt. Surge', file: 'Lt_Surge', city: 'Vermilion City', type: 'Electric', badge: 'Thunder Badge', arena: 'cyber', x: 690, y: 430,
    team: ['Pikachu', 'Magnemite', 'Electabuzz', 'Voltorb', 'Jolteon', 'Raichu'], levels: [18, 19, 20, 21, 22, 24],
    hello: 'Ten-hut! In my unit, speed and voltage win wars.',
    win: 'Grounded! Come back when you\u2019ve got some spark.', lose: 'You shocked me, soldier. The Thunder Badge is yours!' },
  { n: 4, leader: 'Erika', file: 'Erika', city: 'Celadon City', type: 'Grass', badge: 'Rainbow Badge', arena: 'ruins', x: 385, y: 305,
    team: ['Tangela', 'Oddish', 'Bellsprout', 'Exeggcute', 'Victreebel', 'Vileplume'], levels: [24, 25, 25, 26, 29, 29],
    hello: 'Welcome to my garden. Let us have a gentle \u2014 but serious \u2014 battle.',
    win: 'Your blossoms need more time to bloom.', lose: 'Splendid. You\u2019ve earned the Rainbow Badge.' },
  { n: 5, leader: 'Koga', file: 'Koga', city: 'Fuchsia City', type: 'Poison', badge: 'Soul Badge', arena: 'plaza', x: 500, y: 540,
    team: ['Grimer', 'Arbok', 'Koffing', 'Golbat', 'Muk', 'Weezing'],
    hello: 'A ninja strikes from the shadows. Poison rewards patience.',
    win: 'You walked right into my trap.', lose: 'Hmph. You saw through my tricks. The Soul Badge is yours.' },
  { n: 6, leader: 'Sabrina', file: 'Sabrina', city: 'Saffron City', type: 'Psychic', badge: 'Marsh Badge', arena: 'skyfort', x: 585, y: 290,
    team: ['Slowpoke', 'Mr. Mime', 'Hypno', 'Kadabra', 'Venomoth', 'Alakazam'],
    hello: 'I already know how this battle ends. Do you?',
    win: 'Exactly as I foresaw.', lose: 'I did not see this coming\u2026 Take the Marsh Badge.' },
  { n: 7, leader: 'Blaine', file: 'Blaine', city: 'Cinnabar Island', type: 'Fire', badge: 'Volcano Badge', arena: 'oasis', x: 112, y: 548,
    team: ['Vulpix', 'Ponyta', 'Magmar', 'Growlithe', 'Rapidash', 'Arcanine'],
    hello: 'Hah! Hope you packed Burn Heal, because my flames run hot!',
    win: 'Burned to a crisp! Cool off and try again.', lose: 'You\u2019ve put out my fire! The Volcano Badge is yours.' },
  { n: 8, leader: 'Giovanni', file: 'Giovanni', city: 'Viridian City', type: 'Ground', badge: 'Earth Badge', arena: 'grotto', x: 235, y: 365,
    team: ['Dugtrio', 'Sandslash', 'Nidoqueen', 'Rhyhorn', 'Nidoking', 'Rhydon'],
    hello: 'So, you\u2019ve come this far. Let me show you what real power looks like.',
    win: 'As expected. You are not ready.', lose: 'Impressive\u2026 The Earth Badge is yours. Go \u2014 become a legend.' }
];
const HOME = { city: 'Pallet Town', x: 230, y: 505 };
const orderColor = n => `hsl(${Math.round(120 - (n - 1) * 120 / 7)} 82% 52%)`;     // green (1st) → red (8th)
const typeCol = t => (typeof TYPE_COLOR !== 'undefined' && TYPE_COLOR[t]) || '#8890b0';
const hasPortrait = g => TRAINERS.includes(g.file);
const portraitUrl = file => spriteUrl(file + '_trainer.png');

const STORY_KEY = 'arena151.story';
const STORY = { save: null, battle: null, prevTrsel: null, walking: false, open: false };
function loadStory() { try { STORY.save = JSON.parse(localStorage.getItem(STORY_KEY)) || null; } catch (e) { STORY.save = null; } return STORY.save; }
function saveStory() { try { localStorage.setItem(STORY_KEY, JSON.stringify(STORY.save)); } catch (e) { } }
loadStory();

/* ---------- styles ---------- */
(function storyCss() {
  const st = document.createElement('style');
  st.textContent = `
#storyOv{position:fixed;inset:0;z-index:57;display:none;color:#fff;font-family:var(--ui);background:radial-gradient(1200px 700px at 30% -10%,#2a3d8f,#101538 55%,#070a1c);overflow:hidden}
#storyOv.show{display:block}
#storyOv .sy-wrap{position:absolute;inset:0;display:grid;grid-template-rows:auto 1fr;padding:10px 12px;gap:8px;box-sizing:border-box;padding-top:max(10px,env(safe-area-inset-top,0px))}
#storyOv .sy-top{display:flex;align-items:center;gap:12px}
#storyOv .sy-title{font-family:var(--display);font-size:clamp(20px,2.6vw,34px);color:#ffd84a;-webkit-text-stroke:1.2px #3a1608;text-shadow:0 3px 0 #b3471b;white-space:nowrap}
#storyOv .sy-sub{font:700 13px var(--ui);color:#a9b6ff;flex:1}
#storyOv .sy-btn{border:0;border-radius:12px;padding:9px 16px;font:800 14px var(--ui);cursor:pointer;background:rgba(255,255,255,.14);color:#fff}
#storyOv .sy-btn.go{font-family:var(--display);font-size:20px;letter-spacing:.5px;color:#2a1206;background:linear-gradient(#ffe066,#ffb627);box-shadow:0 4px 0 #b86a0d}
#storyOv .sy-btn:disabled{opacity:.45;cursor:default}
#storyOv .sy-main{display:grid;grid-template-columns:1fr 300px;gap:10px;min-height:0}
#storyOv .sy-map{position:relative;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.08);background:#0b3a66;min-height:0}
#storyOv .sy-map svg{position:absolute;inset:0;width:100%;height:100%}
#storyOv .sy-side{display:flex;flex-direction:column;gap:8px;min-height:0;overflow:auto}
#storyOv .sy-card{border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);padding:10px}
#storyOv .sy-card h4{margin:0 0 6px;font:800 11px var(--ui);letter-spacing:.18em;text-transform:uppercase;color:#a9b6ff}
#storyOv .sy-me{display:flex;gap:10px;align-items:center}
#storyOv .sy-me img{width:56px;height:70px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 3px 3px rgba(0,0,0,.5))}
#storyOv .sy-me b{display:block;font-family:var(--display);font-size:22px}
#storyOv .sy-me small{color:#c7cff0;font-weight:700}
#storyOv .sy-team{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:6px}
#storyOv .sy-team .m{height:42px;border-radius:10px;background:rgba(8,12,32,.55);display:flex;align-items:center;justify-content:center;overflow:hidden}
#storyOv .sy-team .m img,#storyOv .sy-team .m canvas{max-height:38px;max-width:100%;image-rendering:pixelated}
#storyOv .sy-case{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#storyOv .sy-case .slot{aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 12px var(--ui);color:#5f6895;border:2px dashed rgba(255,255,255,.18)}
#storyOv .sy-case .slot svg{width:100%;height:100%}
#storyOv .sy-next .city{font-family:var(--display);font-size:20px}
#storyOv .sy-next .who{color:#c7cff0;font-weight:700;font-size:13px;margin-bottom:8px}
#storyOv .sy-legend{display:flex;align-items:center;gap:8px;font:700 11px var(--ui);color:#c7cff0}
#storyOv .sy-legend i{flex:1;height:8px;border-radius:99px;background:linear-gradient(90deg,hsl(120 82% 52%),hsl(60 82% 52%),hsl(0 82% 52%))}
/* map pieces */
#storyOv .wave{animation:syWave 7s linear infinite}
@keyframes syWave{to{transform:translateX(-120px)}}
#storyOv .cloud{animation:syCloud 70s linear infinite}
@keyframes syCloud{from{transform:translateX(-260px)}to{transform:translateX(1260px)}}
#storyOv .leg-next{animation:syDash 1s linear infinite}
@keyframes syDash{to{stroke-dashoffset:-28}}
#storyOv .gym{cursor:pointer}
#storyOv .gym .ring{transition:transform .2s}
#storyOv .gym:hover .ring,#storyOv .gym:focus .ring{transform:scale(1.08)}
#storyOv .gym.locked .face{filter:grayscale(1) brightness(.6)}
#storyOv .gym .pulse{animation:syPulse 1.6s ease-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes syPulse{from{opacity:.85;transform:scale(1)}to{opacity:0;transform:scale(1.9)}}
#storyOv .gym.done .shine{animation:syShine 2.4s ease-in-out infinite alternate}
@keyframes syShine{from{opacity:.25}to{opacity:.85}}
#storyOv .avatar{transition:none}
#storyOv .lbl{paint-order:stroke;stroke:#0b1230;stroke-width:4px;stroke-linejoin:round;font-family:var(--ui);font-weight:800}
/* gym card / ceremony */
#storyOv .sy-modal{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(5,8,22,.72);backdrop-filter:blur(3px);z-index:3;padding:12px}
#storyOv .sy-modal.show{display:flex}
#storyOv .sy-gc{width:min(720px,100%);max-height:100%;overflow:auto;border-radius:22px;background:linear-gradient(160deg,#1d2766,#121838 60%);border:2px solid var(--oc,#ffd84a);box-shadow:0 0 0 4px rgba(0,0,0,.3),0 20px 60px rgba(0,0,0,.6);padding:16px 18px;display:grid;grid-template-columns:150px 1fr;gap:14px;animation:syPop .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes syPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
#storyOv .sy-gc .pf{border-radius:16px;background:radial-gradient(circle at 50% 35%,var(--tc,#888),#0b1230 75%);display:flex;align-items:flex-end;justify-content:center;min-height:180px;overflow:hidden;position:relative}
#storyOv .sy-gc .pf img{height:170px;image-rendering:pixelated;filter:drop-shadow(0 6px 6px rgba(0,0,0,.55))}
#storyOv .sy-gc .pf .em{font-family:var(--display);font-size:90px;color:#fff;opacity:.9;margin:auto}
#storyOv .sy-gc .num{position:absolute;top:8px;left:8px;width:34px;height:34px;border-radius:50%;background:var(--oc);color:#111;font:900 17px var(--ui);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.4)}
#storyOv .sy-gc h3{margin:0;font-family:var(--display);font-size:clamp(24px,3vw,34px);color:#fff}
#storyOv .sy-gc .meta{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
#storyOv .sy-gc .chip{border-radius:99px;padding:3px 10px;font:800 12px var(--ui);background:rgba(255,255,255,.12)}
#storyOv .sy-gc .quote{font:italic 600 15px var(--ui);color:#e6ebff;min-height:42px;margin:6px 0 8px}
#storyOv .sy-gc .lv{display:flex;align-items:center;gap:3px;font:800 12px var(--ui);color:#ffd84a}
#storyOv .sy-gc .lv i{width:12px;height:12px;border-radius:3px;background:rgba(255,255,255,.15)}
#storyOv .sy-gc .lv i.on{background:var(--oc)}
#storyOv .sy-gc .foes{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:8px 0}
#storyOv .sy-gc .foes .m{border-radius:10px;background:rgba(8,12,32,.55);padding:4px 2px;text-align:center;font:700 10px var(--ui);color:#c7cff0}
#storyOv .sy-gc .foes .m .p{height:44px;display:flex;align-items:center;justify-content:center}
#storyOv .sy-gc .foes .m img,#storyOv .sy-gc .foes .m canvas{max-height:42px;max-width:100%;image-rendering:pixelated}
#storyOv .sy-gc .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
#storyOv .sy-cer{text-align:center;max-width:620px;animation:syPop .4s cubic-bezier(.2,1.4,.4,1)}
#storyOv .sy-cer .medal{width:min(220px,40vh);height:min(220px,40vh);margin:0 auto;animation:sySpin 1.1s cubic-bezier(.2,1.2,.3,1)}
@keyframes sySpin{from{transform:rotateY(540deg) scale(.2)}to{transform:rotateY(0) scale(1)}}
#storyOv .sy-cer h2{margin:10px 0 4px;font-family:var(--display);font-size:clamp(26px,4vw,44px);color:#ffd84a;-webkit-text-stroke:1.2px #3a1608;text-shadow:0 3px 0 #b3471b}
#storyOv .sy-cer p{margin:4px 0 12px;font:600 15px var(--ui);color:#e6ebff}
#storyOv .confetti{position:absolute;inset:0;pointer-events:none;z-index:4}
#storyOv .sy-hof{position:absolute;inset:0;z-index:5;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:radial-gradient(circle at 50% 30%,#3b2a7a,#0c0f26 70%);text-align:center;padding:12px}
#storyOv .sy-hof.show{display:flex}
#storyOv .sy-hof h2{margin:0;font-family:var(--display);font-size:clamp(28px,5vw,58px);color:#ffd84a;-webkit-text-stroke:1.5px #3a1608;text-shadow:0 4px 0 #b3471b}
#storyOv .sy-hof .ring{position:relative;width:min(420px,60vh);height:min(420px,60vh)}
#storyOv .sy-hof .ring svg{position:absolute;inset:0;width:100%;height:100%}
@media (max-width:820px),(max-height:560px){
  #storyOv .sy-main{grid-template-columns:1fr 210px} #storyOv .sy-side{gap:6px} #storyOv .sy-card{padding:7px}
  #storyOv .sy-me img{width:40px;height:50px} #storyOv .sy-me b{font-size:16px} #storyOv .sy-team .m{height:30px}
  #storyOv .sy-team .m img,#storyOv .sy-team .m canvas{max-height:27px} #storyOv .sy-sub{display:none} #storyOv .sy-btn{padding:6px 10px;font-size:12px}
  #storyOv .sy-btn.go{font-size:16px} #storyOv .sy-gc{grid-template-columns:110px 1fr;padding:10px 12px;gap:10px} #storyOv .sy-gc .pf{min-height:130px} #storyOv .sy-gc .pf img{height:120px}
  #storyOv .sy-gc .quote{font-size:13px;min-height:0} #storyOv .sy-gc .foes .m .p{height:30px} #storyOv .sy-gc .foes .m img,#storyOv .sy-gc .foes .m canvas{max-height:28px}
  #storyOv .sy-next .city{font-size:15px} #storyOv .sy-case{gap:4px}
}
@media (prefers-reduced-motion:reduce){#storyOv .wave,#storyOv .cloud,#storyOv .leg-next,#storyOv .gym .pulse,#storyOv .gym.done .shine{animation:none}}
/* start-screen story panel */
#startOv .st-storyp{display:none;position:absolute;inset:0;border-radius:22px;padding:16px;flex-direction:column;gap:9px;justify-content:center;z-index:2;
  background:linear-gradient(200deg,#3b2a7a,#151c4a 60%,#121838);box-shadow:inset 0 0 0 2px rgba(255,216,74,.45)}
#startOv.story .st-storyp{display:flex}
#startOv.story #stArenas,#startOv.story .st-arenas-title,#startOv.story #stGo,#startOv.story .st-red-ctl,#startOv.story #stNoteA{display:none}
#startOv .st-storyp h3{margin:0;font-family:var(--display);font-size:26px;color:#ffd84a}
#startOv .st-storyp p{margin:0;font:13px var(--ui);color:#d9deff}
#startOv .st-storyp .badges{display:flex;gap:4px;flex-wrap:wrap}
#startOv .st-storyp .badges{gap:6px}
#startOv .st-storyp .badges span{width:38px;height:38px;border-radius:50%;border:3px solid var(--c);overflow:hidden;display:flex;align-items:flex-start;justify-content:center;background:#0b1230;filter:grayscale(.85) brightness(.75)}
#startOv .st-storyp .badges span img{width:120%;margin-top:-4%;image-rendering:pixelated}
#startOv .st-storyp .badges span b{font-family:var(--display);font-size:20px;margin:auto}
#startOv .st-storyp .badges span.on{filter:none;box-shadow:0 0 0 2px #ffd84a,0 0 12px #ffd84a88}
#startOv .st-storyp .row{display:flex;gap:8px;flex-wrap:wrap}
#startOv .st-storyp .big{border:0;border-radius:12px;padding:10px 16px;font:800 14px var(--ui);cursor:pointer;background:#ffd84a;color:#2a1206}
#startOv .st-storyp .big.alt{background:#fff;color:#141a33}
@media (max-height:560px){#startOv .st-storyp .badges span{width:26px;height:26px;border-width:2px}#startOv .st-storyp .badges span b{font-size:14px}#startOv .st-storyp{padding:8px 10px;gap:5px;border-radius:16px}#startOv .st-storyp h3{font-size:17px}#startOv .st-storyp p{font-size:11px}#startOv .st-storyp .big{padding:6px 10px;font-size:12px}}`;
  document.head.appendChild(st);
})();

/* ---------- the map (original region, drawn as SVG) ---------- */
// Catmull-Rom spline through points → smooth closed SVG path (coastlines).
function smoothClosed(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + 'Z';
}
const LAND = [[118, 95], [255, 58], [415, 72], [560, 48], [705, 84], [828, 62], [905, 138], [882, 242], [935, 335], [872, 432], [905, 522], [785, 585], [640, 600], [470, 592], [345, 598], [268, 568], [190, 560], [168, 470], [100, 392], [118, 268], [78, 172]];
const ISLAND = [[70, 528], [118, 506], [162, 530], [160, 578], [112, 600], [66, 582]];
// One curved leg per step of the journey: Pallet Town → gym 1 → … → gym 8.
function legPath(a, b, bend) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / L * bend, cy = my + dx / L * bend;
  return `M${a.x},${a.y} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x},${b.y}`;
}
const BENDS = [40, -50, 60, -45, 55, -60, 70, -40];
function medallionSvg(g, r, opts = {}) {
  const id = 'clip' + g.n + (opts.idSuffix || ''), oc = orderColor(g.n);
  const face = hasPortrait(g)
    ? `<image href="${portraitUrl(g.file)}" x="${-r * .92}" y="${-r * .92}" width="${r * 1.84}" height="${r * 2.6}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${id})" style="image-rendering:pixelated"/>`
    : `<text x="0" y="${r * .38}" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="${r * 1.15}" fill="#fff" opacity=".92">${g.leader[0]}</text>`;
  return `<defs><clipPath id="${id}"><circle r="${r * .92}"/></clipPath></defs>
    <circle class="shine" r="${r + 8}" fill="none" stroke="#ffd84a" stroke-width="5" opacity="${opts.done ? .6 : 0}"/>
    <g class="ring"><circle r="${r}" fill="${typeCol(g.type)}" stroke="${oc}" stroke-width="${r * .2}"/>
    <circle r="${r * .92}" fill="${typeCol(g.type)}"/><g class="face">${face}</g>
    <circle r="${r}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/></g>
    <g transform="translate(${r * .78},${-r * .78})"><circle r="${r * .38}" fill="${oc}" stroke="#0b1230" stroke-width="2.5"/><text y="${r * .14}" text-anchor="middle" font-family="Rubik,sans-serif" font-weight="900" font-size="${r * .42}" fill="#111">${g.n}</text></g>
    ${opts.done ? `<g transform="translate(${-r * .8},${r * .72})"><circle r="${r * .34}" fill="#2bd46b" stroke="#0b1230" stroke-width="2.5"/><path d="M${-r * .15},0 l${r * .1},${r * .12} l${r * .2},${-r * .24}" stroke="#fff" stroke-width="${r * .09}" fill="none" stroke-linecap="round"/></g>` : ''}`;
}
function drawMap() {
  const sv = STORY.save, beaten = sv ? sv.badges : 0, nodes = [HOME, ...GYMS];
  const waves = Array.from({ length: 16 }, (_, k) => `<path class="wave" d="M${-120 + (k % 4) * 30},${30 + k * 38} q30,-8 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0" stroke="rgba(255,255,255,.10)" stroke-width="2" fill="none" style="animation-delay:-${k * .7}s"/>`).join('');
  const mtn = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-30,18 L0,-26 L30,18Z" fill="#6f7a8c"/><path d="M0,-26 L30,18 L6,18Z" fill="#59637a"/><path d="M-9,-13 L0,-26 L10,-12 L4,-9 L0,-14 L-4,-9Z" fill="#f4f7ff"/></g>`;
  const tree = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><circle r="11" fill="#2f7d3c"/><circle cx="-7" cy="4" r="8" fill="#3c9a4b"/><circle cx="7" cy="5" r="8" fill="#2a6e35"/></g>`;
  const mountains = [[300, 120, 1], [338, 108, 1.2], [376, 126, .9], [690, 150, .9], [726, 140, 1.1], [760, 158, .85], [820, 360, .9], [846, 372, .75]].map(a => mtn(...a)).join('');
  const forest = [[140, 250, 1], [160, 280, .9], [120, 295, .8], [150, 318, 1], [430, 420, 1], [455, 438, .85], [410, 446, .9], [770, 520, .9], [800, 500, 1], [300, 470, .8], [320, 452, .9]].map(a => tree(...a)).join('');
  const town = (x, y) => `<g transform="translate(${x},${y})"><rect x="-9" y="-6" width="18" height="12" rx="2" fill="#f2e3c6"/><path d="M-11,-6 L0,-15 L11,-6Z" fill="#c8553d"/></g>`;
  const legs = GYMS.map((g, i) => {
    const a = nodes[i], b = nodes[i + 1], d = legPath(a, b, BENDS[i]), oc = orderColor(g.n), state = i < beaten ? 'done' : i === beaten ? 'next' : 'locked';
    const sea = i === 6 || i === 7;                                                   // the crossing to and from Cinnabar Island
    return `<path d="${d}" stroke="rgba(10,14,40,.55)" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path id="leg${i}" d="${d}" stroke="${state === 'locked' ? 'rgba(255,255,255,.35)' : oc}" stroke-width="${state === 'done' ? 6 : 5}" fill="none" stroke-linecap="round"
        stroke-dasharray="${state === 'done' ? (sea ? '2 10' : 'none') : '14 14'}" class="${state === 'next' ? 'leg-next' : ''}" opacity="${state === 'locked' ? .55 : 1}"/>`;
  }).join('');
  const gymNodes = GYMS.map((g, i) => {
    const state = i < beaten ? 'done' : i === beaten ? 'next' : 'locked', r = 27;
    return `<g class="gym ${state}" data-g="${i}" transform="translate(${g.x},${g.y})" tabindex="0" role="button" aria-label="Gym ${g.n}: ${g.leader}, ${g.city}${state === 'done' ? ', badge earned' : state === 'locked' ? ', locked' : ', next challenge'}">
      ${state === 'next' ? `<circle class="pulse" r="${r + 6}" fill="none" stroke="${orderColor(g.n)}" stroke-width="4"/>` : ''}
      ${medallionSvg(g, r, { done: state === 'done' })}
      <text class="lbl" y="${r + 21}" text-anchor="middle" font-size="15" fill="#fff">${g.city}</text>
      <text class="lbl" y="${r + 36}" text-anchor="middle" font-size="11.5" fill="${orderColor(g.n)}">${g.badge}</text></g>`;
  }).join('');
  const clouds = [[0, 90, 1], [300, 260, .8], [600, 60, 1.1], [150, 420, .7]].map(([x, y, s], k) => `<g class="cloud" style="animation-delay:-${k * 17}s"><g transform="translate(${x},${y}) scale(${s})" opacity=".55"><ellipse rx="60" ry="18" fill="#fff"/><ellipse cx="-25" cy="-12" rx="30" ry="16" fill="#fff"/><ellipse cx="22" cy="-14" rx="34" ry="18" fill="#fff"/></g></g>`).join('');
  return `<svg viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet" aria-label="Region map">
    <defs>
      <radialGradient id="sea" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#1f7fbf"/><stop offset="1" stop-color="#0a3561"/></radialGradient>
      <linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcf6a"/><stop offset=".6" stop-color="#67b152"/><stop offset="1" stop-color="#4c9442"/></linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#021a33" flood-opacity=".55"/></filter>
    </defs>
    <rect width="1000" height="640" fill="url(#sea)"/>
    <g>${waves}</g>
    <path d="${smoothClosed(LAND)}" fill="#e9d9a6" transform="translate(0,6)" opacity=".85"/>
    <path d="${smoothClosed(LAND)}" fill="url(#land)" stroke="#f3e6b8" stroke-width="5" filter="url(#shadow)"/>
    <path d="${smoothClosed(ISLAND)}" fill="url(#land)" stroke="#f3e6b8" stroke-width="5" filter="url(#shadow)"/>
    <path d="M70,555 l10,-22 l10,22Z M84,548 l7,-14 l7,14Z" fill="#7a4a3a"/><circle cx="80" cy="531" r="5" fill="#ff7a3a" opacity=".85"/>
    <ellipse cx="770" cy="270" rx="58" ry="32" fill="#3fa0d8" stroke="#bfe6ff" stroke-width="3"/>
    ${mountains}${forest}
    ${[HOME, ...GYMS].map(n => town(n.x + 24, n.y - 22)).join('')}
    ${legs}
    <g transform="translate(${HOME.x},${HOME.y})"><circle r="16" fill="#fff" stroke="#2bd46b" stroke-width="5"/><path d="M-8,4 v-7 l8,-7 l8,7 v7Z" fill="#c8553d"/><text class="lbl" y="34" text-anchor="middle" font-size="14" fill="#fff">${HOME.city}</text></g>
    ${gymNodes}
    <g id="syAvatar" class="avatar"></g>
    <g>${clouds}</g>
  </svg>`;
}

/* ---------- the story screen ---------- */
(function storyUi() {
  const ov = document.createElement('div'); ov.id = 'storyOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Story mode');
  ov.innerHTML = `<div class="sy-wrap">
    <div class="sy-top"><div class="sy-title">THE BADGE JOURNEY</div><div class="sy-sub" id="sySub"></div>
      <button class="sy-btn go" id="syGo" type="button">Next gym ▶</button><button class="sy-btn" id="syMenu" type="button">Menu</button></div>
    <div class="sy-main">
      <div class="sy-map" id="syMap"></div>
      <div class="sy-side">
        <div class="sy-card"><h4>Trainer</h4><div class="sy-me" id="syMe"></div><div class="sy-team" id="syTeam"></div></div>
        <div class="sy-card"><h4>Badge case <span id="syCount"></span></h4><div class="sy-case" id="syCase"></div></div>
        <div class="sy-card sy-next" id="syNext"></div>
        <div class="sy-legend"><span>1st</span><i></i><span>8th</span></div>
      </div>
    </div></div>
    <div class="sy-modal" id="syModal"></div>
    <canvas class="confetti" id="syConfetti"></canvas>
    <div class="sy-hof" id="syHof"></div>`;
  document.body.appendChild(ov);
  $('syMenu').onclick = () => closeStory(true);
  $('syGo').onclick = () => { const sv = STORY.save; if (sv && sv.badges < 8) openGymCard(sv.badges); };
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('syModal').classList.contains('show')) closeModal(); else closeStory(true); } });
})();
function gymPic(g, big) {
  return hasPortrait(g) ? `<img src="${portraitUrl(g.file)}" alt="${g.leader}" ${big ? '' : 'style="height:60px"'}>` : `<div class="em">${g.leader[0]}</div>`;
}
function renderStory() {
  const sv = STORY.save; if (!sv) return;
  $('syMap').innerHTML = drawMap();
  $('sySub').textContent = sv.badges >= 8 ? 'All 8 badges earned — you are a champion!' : `Next stop: ${GYMS[sv.badges].city} · Gym ${sv.badges + 1} of 8`;
  $('syGo').style.display = sv.badges >= 8 ? 'none' : '';
  $('syMe').innerHTML = `<img src="${portraitUrl(sv.trainer)}" alt=""><div><b>${escapeHtml(trainerTitle(sv.trainer))}</b><small>${sv.wins} wins · ${sv.losses} losses</small></div>`;
  const team = $('syTeam'); team.innerHTML = '';
  for (const n of sv.team) { const d = document.createElement('div'); d.className = 'm'; d.title = n; try { d.appendChild(monPic(n)); } catch (e) { d.textContent = n.slice(0, 3); } team.appendChild(d); }
  $('syCount').textContent = `${sv.badges}/8`;
  $('syCase').innerHTML = GYMS.map((g, i) => i < sv.badges
    ? `<div class="slot" style="border:0" title="${g.badge} — ${g.leader}"><svg viewBox="-34 -34 68 68">${medallionSvg(g, 26, { idSuffix: 'case' })}</svg></div>`
    : `<div class="slot" style="border-color:${orderColor(g.n)}66">${g.n}</div>`).join('');
  const nx = sv.badges < 8 ? GYMS[sv.badges] : null;
  $('syNext').innerHTML = nx ? `<h4>Next challenge</h4><div class="city" style="color:${orderColor(nx.n)}">${nx.city}</div><div class="who">${nx.leader} · ${nx.type} type · difficulty ${nx.n}/8</div><button class="sy-btn go" type="button" id="syNextGo" style="width:100%">Challenge ${nx.leader}</button>`
    : `<h4>Journey complete</h4><div class="city" style="color:#ffd84a">Champion!</div><div class="who">Every gym leader has fallen to your team.</div><button class="sy-btn go" type="button" id="syHofBtn" style="width:100%">Hall of Fame</button>`;
  if ($('syNextGo')) $('syNextGo').onclick = () => openGymCard(sv.badges);
  if ($('syHofBtn')) $('syHofBtn').onclick = showHallOfFame;
  for (const el of document.querySelectorAll('#storyOv .gym')) {
    const go = () => openGymCard(+el.dataset.g);
    el.addEventListener('click', go); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  }
  placeAvatar(sv.badges === 0 ? HOME : GYMS[sv.badges - 1]);
}
function avatarSvg() { const sv = STORY.save; return `<ellipse cy="2" rx="14" ry="5" fill="rgba(0,0,0,.35)"/><image href="${portraitUrl(sv.trainer)}" x="-18" y="-52" width="36" height="54" preserveAspectRatio="xMidYMax meet" style="image-rendering:pixelated"/>`; }
function placeAvatar(n) { const a = $('syAvatar'); if (!a) return; a.innerHTML = avatarSvg(); a.setAttribute('transform', `translate(${n.x - 30},${n.y + 6})`); }
// Walk the trainer along a leg of the route (the step after a badge is earned).
function walkLeg(i) {
  return new Promise(res => {
    const path = $('leg' + i), a = $('syAvatar'); if (!path || !a) return res();
    const L = path.getTotalLength(), dur = Math.min(3200, 900 + L * 4.5), t0 = performance.now(); STORY.walking = true;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, p = path.getPointAtLength(L * e), hop = Math.abs(Math.sin(now / 90)) * 3;
      a.setAttribute('transform', `translate(${p.x - (k > .9 ? 30 * (k - .9) * 10 : 0)},${p.y + 6 - hop})`);
      if (k < 1) requestAnimationFrame(step); else { STORY.walking = false; res(); }
    };
    requestAnimationFrame(step);
  });
}

/* ---------- gym card ---------- */
function openGymCard(i) {
  const sv = STORY.save, g = GYMS[i], state = i < sv.badges ? 'done' : i === sv.badges ? 'next' : 'locked', m = $('syModal');
  const lvl = Array.from({ length: 8 }, (_, k) => `<i class="${k < g.n ? 'on' : ''}"></i>`).join('');
  m.innerHTML = `<div class="sy-gc" style="--oc:${orderColor(g.n)};--tc:${typeCol(g.type)}">
    <div class="pf"><div class="num">${g.n}</div>${gymPic(g, true)}</div>
    <div><div style="font:800 12px var(--ui);letter-spacing:.16em;color:${orderColor(g.n)}">GYM ${g.n} OF 8 · ${g.city.toUpperCase()}</div>
      <h3>${g.leader}</h3>
      <div class="meta"><span class="chip" style="background:${typeCol(g.type)};color:#111">${g.type}</span><span class="chip">${g.badge}</span><span class="chip">${state === 'done' ? '✔ Badge earned' : state === 'locked' ? '🔒 Locked' : 'Next challenge'}</span></div>
      <div class="lv">DIFFICULTY ${lvl} <span style="margin-left:6px">AI level ${g.n}</span></div>
      <div class="quote" id="syQuote"></div>
      <div class="foes">${g.team.map((n, k) => `<div class="m"><div class="p" data-mon="${escapeHtml(n)}"></div>${escapeHtml(n)}${g.levels ? ` <span style="color:#ffd84a">Lv${g.levels[k]}</span>` : ''}</div>`).join('')}</div>
      <div class="acts">${state === 'locked' ? `<button class="sy-btn" type="button" disabled>Earn the ${GYMS[i - 1].badge} first</button>` : `<button class="sy-btn go" type="button" id="syFight">${state === 'done' ? 'Rematch for fun' : 'Challenge!'}</button>`}<button class="sy-btn" type="button" id="syBack">Back to map</button></div>
    </div></div>`;
  for (const el of m.querySelectorAll('[data-mon]')) { try { el.appendChild(monPic(el.dataset.mon)); } catch (e) { } }
  m.classList.add('show');
  typeOut($('syQuote'), `\u201C${g.hello}\u201D`);
  $('syBack').onclick = closeModal;
  if ($('syFight')) { $('syFight').onclick = () => startGymBattle(i); $('syFight').focus(); }
}
function closeModal() { $('syModal').classList.remove('show'); $('syModal').innerHTML = ''; }
function typeOut(el, text) { if (!el) return; let k = 0; el.textContent = ''; const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); el.textContent = text.slice(0, ++k); if (k >= text.length) clearInterval(iv); }, 22); }

/* ---------- battles ---------- */
function startGymBattle(i) {
  const sv = STORY.save, g = GYMS[i];
  closeModal();
  STORY.battle = { gym: i, level: g.n, practice: i < sv.badges };
  if (!STORY.prevTrsel) STORY.prevTrsel = { A: TRSEL.A, B: TRSEL.B };
  TRSEL.A = sv.trainer; TRSEL.B = g.file; loadTrainer(sv.trainer); if (hasPortrait(g)) loadTrainer(g.file);
  try { refreshTrainerLabels(); drawMinis(); } catch (e) { }
  watchMode = false; syncWatchButton(); START.ctrl.A = 'human';
  $('stageSel').value = g.arena; $('timeLimit').value = '0';
  $('storyOv').classList.remove('show'); STORY.open = false;
  startBattle(sv.team.slice(), g.team.slice(), g.arena);
  STORY.battle.G = G;
}
// After a gym battle: badge ceremony on a win, a rematch offer on a loss.
const _storyBattleEnd = onBattleEnd;
onBattleEnd = function (w, big) {
  const r = _storyBattleEnd.apply(this, arguments);
  const b = STORY.battle;
  if (b && b.G === G && !b.ending) {
    b.ending = true;
    setTimeout(() => { if (STORY.battle === b && G === b.G) storyResult(w === 'A'); }, 2600);
  }
  return r;
};
function storyResult(won) {
  const b = STORY.battle, sv = STORY.save, g = GYMS[b.gym]; STORY.battle = null;
  showOverlay('ovResults', false);
  if (won) sv.wins++; else sv.losses++;
  const firstTime = won && b.gym === sv.badges;
  if (firstTime) { sv.badges = b.gym + 1; if (sv.badges === 8) sv.finishedAt = Date.now(); }
  saveStory();
  openStoryScreen();
  const m = $('syModal');
  if (won) {
    m.innerHTML = `<div class="sy-cer" style="--oc:${orderColor(g.n)}">
      <svg class="medal" viewBox="-40 -40 80 80">${medallionSvg(g, 30, { done: true, idSuffix: 'cer' })}</svg>
      <h2>${firstTime ? `${g.badge} earned!` : 'Rematch won!'}</h2>
      <p>${g.leader}: \u201C${g.lose}\u201D</p>
      <button class="sy-btn go" type="button" id="syOn">${sv.badges >= 8 && firstTime ? 'Enter the Hall of Fame' : firstTime ? `On to ${GYMS[b.gym + 1].city} \u25B6` : 'Back to map'}</button></div>`;
    m.classList.add('show'); confetti(orderColor(g.n));
    $('syOn').focus();
    $('syOn').onclick = async () => {
      closeModal();
      if (firstTime && sv.badges >= 8) return showHallOfFame();
      if (firstTime) { renderStoryWithAvatarAt(b.gym); await walkLeg(b.gym + 1); renderStory(); openGymCard(sv.badges); }
    };
  } else {
    m.innerHTML = `<div class="sy-cer"><svg class="medal" viewBox="-40 -40 80 80" style="filter:grayscale(.6)">${medallionSvg(g, 30, { idSuffix: 'lose' })}</svg>
      <h2 style="color:#ff8a8a">${g.leader} wins this time</h2><p>\u201C${g.win}\u201D</p>
      <div style="display:flex;gap:8px;justify-content:center"><button class="sy-btn go" type="button" id="syRetry">Rematch</button><button class="sy-btn" type="button" id="syMap2">Back to map</button></div></div>`;
    m.classList.add('show');
    $('syRetry').onclick = () => startGymBattle(b.gym); $('syMap2').onclick = closeModal; $('syRetry').focus();
  }
}
// Draw the map with the trainer still standing at the gym just beaten (before the walk to the next one).
function renderStoryWithAvatarAt(i) { renderStory(); placeAvatar(GYMS[i]); }

/* ---------- confetti ---------- */
function confetti(color) {
  const c = $('syConfetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = [color, '#ffd84a', '#ffffff', '#6fb8ff', '#ff7a7a'];
  const bits = Array.from({ length: 160 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .45, vx: (Math.random() - .5) * 14, vy: -Math.random() * 16 - 4, r: Math.random() * 6 + 3, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  const f = now => {
    x.clearRect(0, 0, c.width, c.height);
    for (const b of bits) { b.vy += .45; b.x += b.vx; b.y += b.vy; b.a += b.va; x.save(); x.translate(b.x, b.y); x.rotate(b.a); x.fillStyle = b.c; x.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); x.restore(); }
    if (now - t0 < 3200) requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height);
  };
  requestAnimationFrame(f);
}

/* ---------- Hall of Fame ---------- */
function showHallOfFame() {
  const sv = STORY.save, h = $('syHof'), mins = sv.finishedAt && sv.startedAt ? Math.round((sv.finishedAt - sv.startedAt) / 60000) : null;
  const ring = GYMS.map((g, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 8, x = Math.cos(a) * 160, y = Math.sin(a) * 160; return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">${medallionSvg(g, 34, { done: true, idSuffix: 'hof' })}</g>`; }).join('');
  h.innerHTML = `<h2>HALL OF FAME</h2>
    <div class="ring"><svg viewBox="-210 -210 420 420">${ring}<image href="${portraitUrl(sv.trainer)}" x="-55" y="-95" width="110" height="160" preserveAspectRatio="xMidYMax meet" style="image-rendering:pixelated"/><text y="92" text-anchor="middle" class="lbl" font-size="24" fill="#ffd84a">${escapeHtml(trainerTitle(sv.trainer))}</text></svg></div>
    <div class="sy-team" id="syHofTeam" style="width:min(460px,90vw)"></div>
    <div style="font:700 14px var(--ui);color:#c7cff0">${sv.wins} wins · ${sv.losses} losses${mins != null ? ` · journey time ${mins} min` : ''}</div>
    <div style="display:flex;gap:8px"><button class="sy-btn" type="button" id="syHofMap">Back to map</button><button class="sy-btn go" type="button" id="syHofNew">New journey</button></div>`;
  const team = $('syHofTeam'); for (const n of sv.team) { const d = document.createElement('div'); d.className = 'm'; try { d.appendChild(monPic(n)); } catch (e) { } team.appendChild(d); }
  h.classList.add('show'); confetti('#ffd84a'); setTimeout(() => confetti('#6fb8ff'), 900);
  $('syHofMap').onclick = () => h.classList.remove('show');
  $('syHofNew').onclick = () => { h.classList.remove('show'); closeStory(true); };
}

/* ---------- opening / closing ---------- */
function openStoryScreen() {
  hideStart(); ['ovResults', 'ovSwitch'].forEach(id => showOverlay(id, false));
  $('storyOv').classList.add('show'); STORY.open = true; renderStory();
}
function beginJourney(fresh) {
  if (fresh || !STORY.save) {
    STORY.save = { trainer: TRSEL.A, team: readPickers('A'), badges: 0, wins: 0, losses: 0, startedAt: Date.now(), finishedAt: null };
    saveStory();
  }
  openStoryScreen();
  if (STORY.save.badges < 8) setTimeout(() => openGymCard(STORY.save.badges), fresh ? 700 : 250);
}
function closeStory(toMenu) {
  STORY.battle = null; closeModal(); $('storyOv').classList.remove('show'); STORY.open = false;
  if (STORY.prevTrsel) { TRSEL.A = STORY.prevTrsel.A; TRSEL.B = STORY.prevTrsel.B; STORY.prevTrsel = null; try { refreshTrainerLabels(); drawMinis(); } catch (e) { } }
  if (toMenu) { if (G && G.phase !== 'title' && G.phase !== 'over') { /* leave the battle */ } showStart(); renderStoryPanel(); }
}
// Leaving a story battle through the menu returns to the map.
const _storyShowStart = showStart;
showStart = function () {
  if (STORY.battle) { STORY.battle = null; showOverlay('ovResults', false); openStoryScreen(); return; }
  if (STORY.open) return;
  return _storyShowStart.apply(this, arguments);
};

/* ---------- start screen: STORY mode ---------- */
(function storyStartPanel() {
  const mode = document.querySelector('#startOv .st-mode'), blue = document.querySelector('#startOv .st-side.blue');
  if (!mode || !blue) return;
  const b = document.createElement('button'); b.type = 'button'; b.dataset.m = 'story'; b.textContent = 'STORY';
  mode.appendChild(b);
  b.onclick = () => { NET.mode = 'story'; if (NET.code) leaveOnline(); syncOnlineUi(); };
  const red = document.querySelector('#startOv .st-side.red .st-ctlrow'); if (red) red.classList.add('st-red-ctl');
  const arenaTitle = $('stArenas') && $('stArenas').previousElementSibling; if (arenaTitle) arenaTitle.classList.add('st-arenas-title');
  const p = document.createElement('div'); p.className = 'st-storyp'; p.id = 'stStoryP'; blue.appendChild(p);
  renderStoryPanel();
})();
function renderStoryPanel() {
  const p = $('stStoryP'); if (!p) return; const sv = loadStory();
  const dots = GYMS.map((g, i) => `<span style="--c:${orderColor(g.n)}" class="${sv && i < sv.badges ? 'on' : ''}" title="Gym ${g.n}: ${g.leader} — ${g.badge}">${hasPortrait(g) ? `<img src="${portraitUrl(g.file)}" alt="">` : `<b>${g.leader[0]}</b>`}</span>`).join('');
  p.innerHTML = `<h3>Story mode</h3><p>Choose your trainer and six Pokémon on the left, then travel the region and defeat all 8 gym leaders \u2014 each one tougher than the last.</p>
    <div class="badges">${dots}</div>
    <div class="row">${sv && sv.badges < 8 ? `<button class="big" type="button" id="stStoryCont">Continue journey (${sv.badges}/8)</button>` : ''}
      <button class="big ${sv ? 'alt' : ''}" type="button" id="stStoryNew">${sv ? 'New journey' : 'Begin journey'}</button>
      ${sv && sv.badges >= 8 ? `<button class="big" type="button" id="stStoryHof">Hall of Fame</button>` : ''}</div>`;
  if ($('stStoryCont')) $('stStoryCont').onclick = () => beginJourney(false);
  if ($('stStoryHof')) $('stStoryHof').onclick = () => { openStoryScreen(); showHallOfFame(); };
  $('stStoryNew').onclick = () => { if (sv && sv.badges > 0 && sv.badges < 8 && !confirm('Start a new journey? Your current badges will be reset.')) return; beginJourney(true); };
}
// the mode switch knows about STORY too
const _storySyncOnline = syncOnlineUi;
syncOnlineUi = function () {
  _storySyncOnline.apply(this, arguments);
  const ov = $('startOv'); if (!ov) return;
  ov.classList.toggle('story', NET.mode === 'story');
  for (const b of document.querySelectorAll('#startOv .st-mode button')) { b.classList.toggle('on', b.dataset.m === NET.mode); b.setAttribute('aria-pressed', String(b.dataset.m === NET.mode)); }
  if (NET.mode === 'story') renderStoryPanel();
};
syncOnlineUi();
