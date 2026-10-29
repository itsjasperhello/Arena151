/* =====================================================================
   Section 30: double battles (2v2) on the client
   - Trainers stand behind where their Pokémon first appear: the midpoint of
     the team's entry spots (one spot in singles, two in doubles), set back
     95 units toward their own edge and kept inside the field.
   - Doubles: a name and HP bar floats above each Pokémon (the top HUD shows
     the leads); your partner is marked ALLY.
   The engine side (slots A/C vs B/D, nearest-opponent targeting) is in
   data.js and sim.js.
   ===================================================================== */
function placeTrainers() {
  if (typeof G === 'undefined' || !G || typeof TRAINER_POS === 'undefined') return;
  for (const T of ['A', 'B']) {
    const slots = G.doubles ? [T, partnerOf(T)].filter(S => G.sides[S] && G.sides[S].state !== 'empty') : [T];
    const pts = slots.map(S => entryOf(S)), mx = pts.reduce((a, p) => a + p.x, 0) / pts.length, my = pts.reduce((a, p) => a + p.y, 0) / pts.length, dir = T === 'A' ? -1 : 1;
    TRAINER_POS[T].x = Math.max(40, Math.min(WW - 40, mx + dir * 95)); TRAINER_POS[T].y = Math.max(150, Math.min(WH - 20, my + 4));
  }
}
(function doublesClient() {
  // floating name + HP bars over every Pokémon in a double battle
  const _dwf = drawWorldFx;
  drawWorldFx = function () {
    const r = _dwf.apply(this, arguments);
    try { if (G && G.doubles && ['battle', 'intro', 'pick'].includes(G.phase)) {
      const c = bctx; c.save();
      for (const S of SLOTS()) { const sd = side(S); if (!sd || sd.state === 'empty' || sd.state === 'out' || sd.state === 'wait') continue; const m = act(S); if (!m) continue;
        const h = headOf(S), x = bx(h.x), y = by(h.y) - 18, w = 34, frac = Math.max(0, m.hp / m.max), mine = slotTeam(S) === 'A';
        c.globalAlpha = .92; c.fillStyle = 'rgba(8,12,30,.78)'; c.fillRect(x - w / 2 - 2, y - 9, w + 4, 13);
        c.fillStyle = '#2a3050'; c.fillRect(x - w / 2, y, w, 3); c.fillStyle = frac > .5 ? '#5ce07a' : frac > .2 ? '#ffd84a' : '#ff5a5a'; c.fillRect(x - w / 2, y, w * frac, 3);
        c.font = '700 6px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = mine ? '#9fd0ff' : '#ffb0a8';
        c.fillText((S === 'C' && !(G.human && G.human.C) ? 'ALLY · ' : '') + m.name.toUpperCase(), x, y - 2); }
      c.restore(); } } catch (e) { console.error(e); }
    return r;
  };
})();
