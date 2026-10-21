/* =====================================================================
   Section 0: desktop app mode
   When this page is served by the Arena 151 web server (Docker, port
   8253), it provides the same native interface the Android app does —
   listing the bundled sprites, trainers, music and cries, saving a file
   and vibration — so the desktop game runs exactly like the Android app.
   Opened any other way (a plain file, another web server), nothing changes.
   ===================================================================== */
(function desktopApp() {
  if (window.AndroidApp || !/^https?:$/.test(location.protocol)) return;
  // The Arena 151 web server answers folder requests with a JSON file list; any other server does not.
  const list = dir => {
    try {
      const x = new XMLHttpRequest(); x.open('GET', dir + '/', false); x.send();
      if (x.status !== 200) return null;
      const j = JSON.parse(x.responseText); if (!Array.isArray(j)) return null;
      return j.filter(e => e && e.type === 'file' && typeof e.name === 'string').map(e => e.name).sort();
    } catch (e) { return null; }
  };
  const sprites = list('sprites'); if (!sprites) return;
  const lists = { sprites, music: list('music') || [], cry: list('cry') || [] };
  window.DesktopApp = true;
  window.AndroidApp = {
    listSprites: () => JSON.stringify(lists.sprites),
    listAssets: dir => JSON.stringify(lists[String(dir)] || []),
    vibrate: ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { } },
    saveFile: (name, text) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return 'your Downloads folder';
    },
    isApp: () => true
  };
})();
