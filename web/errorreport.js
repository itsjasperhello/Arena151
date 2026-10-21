/* =====================================================================
   Startup safety net (deliberately plain, old-style JavaScript so it runs in every browser)
   - If anything fails while the game starts, a panel at the bottom shows the error and the
     browser's details: a screenshot of it says exactly what to fix.
   - If the main menu (start screen) has not opened a few seconds after loading, a simple menu
     appears instead so the game can still be played.
   ===================================================================== */
(function () {
  var errors = [], loadedAt = Date.now();
  window.A151_ERRORS = errors;
  function clean(s) { return String(s).replace(/\s+/g, ' ').slice(0, 300); }
  function where(e) {
    var st = e && e.error && e.error.stack ? String(e.error.stack).split('\n') : [];
    for (var i = 0; i < st.length; i++) { var m = st[i].match(/([a-z0-9_]+\.js):(\d+)/i); if (m) return ' (' + m[1] + ':' + m[2] + ')'; }
    return e && e.filename ? ' (' + String(e.filename).split('/').pop().split('?')[0] + ':' + e.lineno + ')' : '';
  }
  function add(msg) {
    errors.push(clean(msg)); if (errors.length > 12) errors.shift();
    if (Date.now() - loadedAt < 20000) render();                       // only problems while starting up get the panel
  }
  window.addEventListener('error', function (e) { add((e.message || 'Script error') + where(e)); });
  window.addEventListener('unhandledrejection', function (e) { var r = e.reason; add('Promise: ' + (r && (r.message || r))); });

  function el(tag, css, text) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (text) d.textContent = text; return d; }
  function render() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', render); return; }
    var p = document.getElementById('a151Err');
    if (!p) {
      p = el('div', 'position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;background:#3a0d14;color:#fff;border:2px solid #ff7a7a;border-radius:10px;padding:10px 12px;font:13px/1.4 system-ui,Segoe UI,Arial,sans-serif;max-height:40vh;overflow:auto;box-shadow:0 6px 24px rgba(0,0,0,.5)');
      p.id = 'a151Err';
      document.body.appendChild(p);
    }
    p.innerHTML = '';
    p.appendChild(el('b', '', 'Arena 151 hit a problem while starting. Please send a screenshot of this box.'));
    var ul = el('div', 'margin:6px 0;font-family:Consolas,Menlo,monospace;font-size:12px;white-space:pre-wrap');
    ul.textContent = errors.join('\n'); p.appendChild(ul);
    p.appendChild(el('div', 'opacity:.8;font-size:12px', 'Browser: ' + navigator.userAgent + ' — page: ' + location.href + ' — version: ' + (window.APP_VERSION_TEXT || '?')));
    var row = el('div', 'margin-top:6px;display:flex;gap:8px');
    var copy = el('button', 'padding:4px 10px;border-radius:6px;border:0;cursor:pointer', 'Copy details');
    copy.onclick = function () { try { navigator.clipboard.writeText(errors.join('\n') + '\n' + navigator.userAgent + '\n' + location.href); copy.textContent = 'Copied'; } catch (x) { } };
    var hide = el('button', 'padding:4px 10px;border-radius:6px;border:0;cursor:pointer', 'Hide');
    hide.onclick = function () { p.style.display = 'none'; };
    row.appendChild(copy); row.appendChild(hide); p.appendChild(row);
  }

  // Fallback menu if the start screen never opened.
  function fallbackMenu() {
    try {
      var phaseTitle = typeof G !== 'undefined' && G && G.phase === 'title';
      var startOpen = typeof START !== 'undefined' && START && START.open;
      var ov = document.getElementById('startOv'), ovShown = ov && getComputedStyle(ov).display !== 'none';
      if (startOpen || !phaseTitle || document.getElementById('a151Menu')) return;
      if (typeof showStart === 'function') { try { showStart(); } catch (x) { add('showStart: ' + (x && x.message)); } }
      if (typeof START !== 'undefined' && START && START.open) return;
      var m = el('div', 'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(10,12,30,.92);font:16px system-ui,Segoe UI,Arial,sans-serif;color:#fff');
      m.id = 'a151Menu';
      var box = el('div', 'background:#1b2150;border:2px solid #6fb8ff;border-radius:16px;padding:22px 26px;text-align:center;max-width:460px');
      box.appendChild(el('div', 'font-size:28px;font-weight:800;color:#ffd84a;margin-bottom:8px', 'ARENA 151'));
      box.appendChild(el('div', 'opacity:.85;margin-bottom:14px', 'The main menu could not load in this browser. You can still play against the AI, or reload to try again.'));
      var b1 = el('button', 'margin:4px;padding:10px 18px;border-radius:10px;border:0;font-weight:800;background:#ffd84a;cursor:pointer', 'Battle vs AI');
      b1.onclick = function () { m.parentNode.removeChild(m); try { startBattle(readPickers('A'), readPickers('B')); } catch (x) { add('start battle: ' + (x && x.message)); } };
      var b2 = el('button', 'margin:4px;padding:10px 18px;border-radius:10px;border:0;font-weight:800;cursor:pointer', 'Reload');
      b2.onclick = function () { location.reload(); };
      box.appendChild(b1); box.appendChild(b2); m.appendChild(box); document.body.appendChild(m);
      add('The start screen did not open (fallback menu shown).');
    } catch (x) { add('fallback: ' + (x && x.message)); }
  }
  setTimeout(fallbackMenu, 5000);
  setTimeout(fallbackMenu, 9000);
})();
