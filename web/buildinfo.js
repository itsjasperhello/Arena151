/* =====================================================================
   Section 17: build info, diagnostics and audio start-up
   ===================================================================== */
const APP_VERSION = '14.1';
// Unlock audio on the very first touch or key, in the capture phase so no other handler can swallow it,
// and wake it again whenever the app comes back to the foreground.
const unlockAudio = () => { try { const c = audioCtx(); if (c && c.state !== 'running') c.resume(); } catch (e) { } };
['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) unlockAudio(); });
(function versionBadge() {
  const foot = document.querySelector('#startOv .st-foot'); if (!foot) return;
  const v = document.createElement('div'); v.id = 'stVersion'; v.textContent = 'v' + APP_VERSION;
  v.style.cssText = 'position:absolute;right:14px;bottom:8px;font:600 11px var(--ui);color:#8f9bd0;letter-spacing:.06em;pointer-events:none';
  document.querySelector('#startOv .st-wrap').appendChild(v);
})();
// Settings → About this build: version, audio state, and how many cry / music / sprite files the app can see.
function listFolder(dir) { try { if (window.AndroidApp && AndroidApp.listAssets) return JSON.parse(AndroidApp.listAssets(dir)); } catch (e) { } return null; }
function diagnostics() {
  const cries = listFolder('cry'), music = listFolder('music'), sprites = listFolder('sprites');
  const n = (list, re) => list === null ? 'not checked (desktop)' : String(list.filter(f => re.test(f)).length);
  return [['Version', 'v' + APP_VERSION], ['Sound', AC ? AC.state : 'waiting for first tap'],
    ['Cry files found', n(cries, /\.mp3$/i)], ['Music files found', music === null ? 'not checked (desktop)' : (music.filter(f => /\.mp3$/i.test(f)).join(', ') || 'none')],
    ['Pokémon sprites found', n(sprites, /\.gif$/i)], ['Trainers found', String(TRAINERS.length)]];
}
(function aboutRow() {
  const card = document.querySelector('#setOv .qol-card'); if (!card) return; const btns = card.querySelector('.qbtns');
  const box = document.createElement('div'); box.className = 'qrow'; box.style.display = 'block';
  box.innerHTML = '<span>About this build<small id="aboutInfo" style="white-space:pre-line;line-height:1.5"></small></span>';
  card.insertBefore(box, btns || null);
  const fill = () => { $('aboutInfo').textContent = diagnostics().map(([k, v]) => `${k}: ${v}`).join('\n'); };
  const ov = $('setOv'); new MutationObserver(() => { if (ov.classList.contains('show')) fill(); }).observe(ov, { attributes: true, attributeFilter: ['class'] });
  fill();
})();
