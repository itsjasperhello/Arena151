/* =====================================================================
   Section 25: ACCOUNTS (web version)
   A sign-in page with email + password (or play as a guest), and cloud
   saves: every "arena151.*" save and setting is stored on the server
   (/api, see server/accounts.js) and synced automatically.
   The phone apps keep their saves on the device and skip all of this.
   ===================================================================== */
(function accountsModule() {
  const enabled = typeof isWebVersion === 'function' && isWebVersion() && /^https?:$/.test(location.protocol);
  if (!enabled) return;
  const AUTH = 'arena151.auth', GUEST = 'arena151.guest', CLOUD_AT = 'arena151.cloudAt';
  const local = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
  const auth = () => { try { return JSON.parse(local(AUTH)) || null; } catch (e) { return null; } };
  const excluded = k => /^arena151\.(auth|guest|cloud)/.test(k);
  const collect = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('arena151.') && !excluded(k)) o[k] = localStorage.getItem(k); } return o; };
  const hasProgress = d => Object.keys(d || {}).some(k => /^arena151\.(story\.\d|save)/.test(k));
  const same = (a, b) => { const ka = Object.keys(a || {}).sort(), kb = Object.keys(b || {}).sort(); return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]); };
  async function api(method, path, body, token) {
    const r = await fetch('/api' + path, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}), body: body ? JSON.stringify(body) : undefined, keepalive: method === 'PUT' });
    let j = {}; try { j = await r.json(); } catch (e) { }
    if (!r.ok) throw Object.assign(new Error(j.error || 'Could not reach the server.'), { status: r.status });
    return j;
  }
  const CLOUD = { status: 'idle', dirty: false, timer: null, applying: false };

  /* ---------- styles ---------- */
  const st = document.createElement('style');
  st.textContent = `
#signinOv{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;padding:14px;font-family:var(--ui);color:#fff;
  background:radial-gradient(1100px 700px at 30% -10%,#2a3d8f,#101538 55%,#070a1c)}
#signinOv.show{display:flex}
#signinOv .si{width:min(430px,100%);border-radius:22px;background:linear-gradient(160deg,#1d2766,#121838 65%);border:2px solid rgba(255,216,74,.55);box-shadow:0 24px 70px rgba(0,0,0,.6);padding:22px 22px 18px}
#signinOv h1{margin:0;text-align:center;font-family:var(--display);font-size:42px;color:#ffd84a;-webkit-text-stroke:1.5px #3a1608;text-shadow:0 4px 0 #b3471b;letter-spacing:1px}
#signinOv .sub{margin:4px 0 14px;text-align:center;font:700 13px var(--ui);color:#a9b6ff;letter-spacing:.06em}
#signinOv .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;background:rgba(0,0,0,.3);border-radius:12px;padding:4px;margin-bottom:14px}
#signinOv .tabs button{border:0;border-radius:9px;padding:9px;font:800 14px var(--ui);background:transparent;color:#c7cff0;cursor:pointer}
#signinOv .tabs button.on{background:#ffd84a;color:#2a1206}
#signinOv label{display:block;font:800 12px var(--ui);letter-spacing:.08em;color:#a9b6ff;margin:10px 0 5px}
#signinOv .fld{position:relative}
#signinOv input{width:100%;box-sizing:border-box;border:2px solid rgba(255,255,255,.18);border-radius:11px;background:rgba(8,12,32,.6);color:#fff;font:600 15px var(--ui);padding:11px 12px}
#signinOv input:focus{outline:none;border-color:#ffd84a}
#signinOv .eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#a9b6ff;font:800 12px var(--ui);cursor:pointer;padding:6px}
#signinOv .err{min-height:20px;margin:10px 0 0;font:700 13px var(--ui);color:#ff9a9a}
#signinOv .go{width:100%;margin-top:8px;border:0;border-radius:12px;padding:12px;font-family:var(--display);font-size:20px;letter-spacing:.5px;color:#2a1206;background:linear-gradient(#ffe066,#ffb627);box-shadow:0 4px 0 #b86a0d;cursor:pointer}
#signinOv .go:disabled{opacity:.6;cursor:default}
#signinOv .guest{display:block;margin:14px auto 0;border:0;background:transparent;color:#c7cff0;font:700 13px var(--ui);text-decoration:underline;cursor:pointer}
#signinOv .note{margin:12px 0 0;font:600 11.5px var(--ui);color:#8f9bd0;text-align:center;line-height:1.45}
#signinOv .choice{display:grid;gap:8px;margin-top:10px}
#signinOv .choice button{border:2px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(8,12,32,.6);color:#fff;font:700 13px var(--ui);padding:10px;text-align:left;cursor:pointer}
#signinOv .choice button b{display:block;font:900 14px var(--ui);color:#ffd84a}
#acctChip{position:fixed;top:8px;left:8px;z-index:61;display:none;align-items:center;gap:6px;border-radius:999px;background:rgba(8,12,34,.82);border:1px solid rgba(255,255,255,.18);padding:4px 6px 4px 10px;font:700 12px var(--ui);color:#e6ebff;max-width:min(60vw,420px)}
#acctChip.show{display:flex}
#acctChip .em{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#acctChip .stt{color:#7fe08a;white-space:nowrap}
#acctChip .stt.busy{color:#ffd84a}#acctChip .stt.bad{color:#ff9a9a}
#acctChip button{border:0;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font:800 11px var(--ui);padding:5px 9px;cursor:pointer;white-space:nowrap}
@media (max-height:560px){#signinOv .si{padding:12px 16px}#signinOv h1{font-size:28px}#signinOv .sub{margin:2px 0 8px}#signinOv label{margin:6px 0 3px}#signinOv input{padding:8px 10px}#signinOv .tabs{margin-bottom:8px}}`;
  document.head.appendChild(st);

  /* ---------- the sign-in page ---------- */
  const ov = document.createElement('div'); ov.id = 'signinOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Sign in');
  document.body.appendChild(ov);
  let mode = 'in';
  function renderForm(msg) {
    ov.innerHTML = `<form class="si" novalidate><h1>ARENA 151</h1><div class="sub">${mode === 'in' ? 'SIGN IN TO CONTINUE YOUR STORY' : 'CREATE AN ACCOUNT TO SAVE YOUR PROGRESS'}</div>
      <div class="tabs" role="tablist"><button type="button" role="tab" data-m="in" class="${mode === 'in' ? 'on' : ''}" aria-selected="${mode === 'in'}">Sign in</button><button type="button" role="tab" data-m="up" class="${mode === 'up' ? 'on' : ''}" aria-selected="${mode === 'up'}">Create account</button></div>
      <label for="siEmail">EMAIL</label><input id="siEmail" type="email" autocomplete="email" inputmode="email" required>
      <label for="siPass">PASSWORD</label><div class="fld"><input id="siPass" type="password" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" minlength="8" required><button type="button" class="eye" aria-label="Show password">SHOW</button></div>
      ${mode === 'up' ? '<label for="siPass2">CONFIRM PASSWORD</label><input id="siPass2" type="password" autocomplete="new-password" minlength="8" required>' : ''}
      <div class="err" id="siErr" role="alert">${msg || ''}</div>
      <button class="go" type="submit" id="siGo">${mode === 'in' ? 'Sign in' : 'Create account'}</button>
      <button class="guest" type="button" id="siGuest">Play as a guest (saves stay on this device)</button>
      <p class="note">${mode === 'up' ? 'Use at least 8 characters. Your password is stored only as a secure hash.' : 'Your story, Pok\u00E9dex and settings are saved to your account automatically.'}</p></form>`;
    for (const b of ov.querySelectorAll('.tabs button')) b.onclick = () => { mode = b.dataset.m; renderForm(); };
    ov.querySelector('.eye').onclick = e => { const p = $('siPass'), show = p.type === 'password'; p.type = show ? 'text' : 'password'; e.target.textContent = show ? 'HIDE' : 'SHOW'; };
    $('siGuest').onclick = () => { local(GUEST, '1'); hide(); renderChip(); };
    ov.querySelector('form').onsubmit = submit;
    setTimeout(() => $('siEmail').focus(), 30);
  }
  async function submit(e) {
    e.preventDefault();
    const email = $('siEmail').value.trim(), pass = $('siPass').value, err = $('siErr'), go = $('siGo');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter a valid email address.'; return; }
    if (pass.length < 8) { err.textContent = 'Passwords need at least 8 characters.'; return; }
    if (mode === 'up' && pass !== $('siPass2').value) { err.textContent = 'The passwords don\u2019t match.'; return; }
    go.disabled = true; err.textContent = '';
    try {
      const r = await api('POST', mode === 'in' ? '/login' : '/register', { email, password: pass });
      local(AUTH, JSON.stringify({ token: r.token, email: r.email })); local(GUEST, null);
      await afterSignIn(true);
    } catch (x) { err.textContent = x.message; go.disabled = false; }
  }
  const show = msg => { renderForm(msg); ov.classList.add('show'); };
  const hide = () => ov.classList.remove('show');

  /* ---------- sync ---------- */
  function applyCloud(data, savedAt) {
    CLOUD.applying = true;
    const keys = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('arena151.') && !excluded(k)) keys.push(k); }
    for (const k of keys) local(k, null);
    for (const [k, v] of Object.entries(data || {})) local(k, v);
    local(CLOUD_AT, String(savedAt || Date.now())); CLOUD.applying = false;
    location.reload();
  }
  async function upload(keepalive) {
    const a = auth(); if (!a) return;
    clearTimeout(CLOUD.timer); CLOUD.dirty = false; setStatus('busy', 'Saving\u2026');
    try { const r = await api('PUT', '/save', { data: collect(), version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '' }, a.token); local(CLOUD_AT, String(r.savedAt)); setStatus('ok', 'Saved \u2713'); }
    catch (x) { if (x.status === 401) return signedOut('Your session ended. Please sign in again.'); CLOUD.dirty = true; setStatus('bad', 'Offline \u2014 will retry'); CLOUD.timer = setTimeout(() => upload(), 15000); }
  }
  const schedule = () => { if (!auth() || CLOUD.applying) return; CLOUD.dirty = true; setStatus('busy', 'Saving\u2026'); clearTimeout(CLOUD.timer); CLOUD.timer = setTimeout(() => upload(), 2500); };
  // Any change to the game's saves or settings is uploaded a moment later.
  const _set = Storage.prototype.setItem, _rem = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) { const r = _set.call(this, k, v); if (this === localStorage && String(k).startsWith('arena151.') && !excluded(String(k))) schedule(); return r; };
  Storage.prototype.removeItem = function (k) { const r = _rem.call(this, k); if (this === localStorage && String(k).startsWith('arena151.') && !excluded(String(k))) schedule(); return r; };
  addEventListener('pagehide', () => { if (CLOUD.dirty) upload(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && CLOUD.dirty) upload(true); });

  // After signing in: bring the right progress into this browser.
  async function afterSignIn(fresh) {
    const a = auth(); if (!a) return show();
    let cloud;
    try { cloud = await api('GET', '/save', null, a.token); } catch (x) { if (x.status === 401) return signedOut('Your session ended. Please sign in again.'); hide(); renderChip(); setStatus('bad', 'Offline'); return; }
    const mine = collect(), theirs = cloud.data || {};
    if (!cloud.data || !Object.keys(theirs).length) { hide(); renderChip(); return upload(); }                       // new account: this device's progress goes up
    if (same(mine, theirs)) { local(CLOUD_AT, String(cloud.savedAt)); hide(); renderChip(); setStatus('ok', 'Saved \u2713'); return; }
    const lastSync = +local(CLOUD_AT) || 0;
    if (!fresh && cloud.savedAt <= lastSync) { hide(); renderChip(); return upload(); }                                   // only this device changed since
    if (!hasProgress(mine) || (!fresh && cloud.savedAt > lastSync && lastSync)) return applyCloud(theirs, cloud.savedAt); // the cloud is newer
    // Both have different progress: ask which to keep.
    ov.innerHTML = `<div class="si"><h1>ARENA 151</h1><div class="sub">WHICH PROGRESS DO YOU WANT TO KEEP?</div>
      <p class="note" style="text-align:left;margin:0 0 6px">Your account and this browser have different saves.</p>
      <div class="choice"><button type="button" id="siCloud"><b>Use my account\u2019s save</b>Saved ${new Date(cloud.savedAt).toLocaleString()}. Replaces the progress in this browser.</button>
      <button type="button" id="siLocal"><b>Keep this browser\u2019s progress</b>Uploads it to your account, replacing the save there.</button></div></div>`;
    ov.classList.add('show');
    $('siCloud').onclick = () => applyCloud(theirs, cloud.savedAt);
    $('siLocal').onclick = () => { hide(); renderChip(); upload(); };
  }
  function signedOut(msg) { local(AUTH, null); local(CLOUD_AT, null); renderChip(); show(msg); }
  async function signOut() {
    const a = auth(); if (CLOUD.dirty) await upload();
    if (a) { try { await api('POST', '/logout', null, a.token); } catch (e) { } }
    local(AUTH, null); local(CLOUD_AT, null); local(GUEST, null); renderChip(); mode = 'in'; show();
  }

  /* ---------- the account badge on the start screen ---------- */
  const chip = document.createElement('div'); chip.id = 'acctChip'; chip.setAttribute('aria-live', 'polite'); document.body.appendChild(chip);
  function renderChip() {
    const a = auth();
    chip.innerHTML = a ? `<span aria-hidden="true">\u2601</span><span class="em" title="${escapeHtml(a.email)}">${escapeHtml(a.email)}</span><span class="stt" id="acctStt">${CLOUD.status === 'idle' ? 'Saved \u2713' : ''}</span><button type="button" id="acctOut">Sign out</button>`
      : `<span>Playing as a guest</span><button type="button" id="acctIn">Sign in</button>`;
    if ($('acctOut')) $('acctOut').onclick = signOut; if ($('acctIn')) $('acctIn').onclick = () => { mode = 'in'; show(); };
    syncChip();
  }
  function setStatus(kind, text) { CLOUD.status = kind; const s = $('acctStt'); if (s) { s.textContent = text; s.className = 'stt' + (kind === 'busy' ? ' busy' : kind === 'bad' ? ' bad' : ''); } }
  function syncChip() { const so = $('startOv'); chip.classList.toggle('show', !!(so && getComputedStyle(so).display !== 'none') && !ov.classList.contains('show')); }
  setInterval(syncChip, 600);

  /* ---------- start ---------- */
  (async () => {
    renderChip();
    const a = auth();
    if (a) {
      try { await api('GET', '/me', null, a.token); afterSignIn(false); }
      catch (x) { if (x.status === 401) signedOut('Your session ended. Please sign in again.'); else setStatus('bad', 'Offline'); }
    } else if (!local(GUEST)) show();
  })();
  window.cloudSaveNow = () => upload();
})();
