"""Refresh the server's copy of the game logic from the app's source (../web).
Run this after updating the game, then rebuild the container:  docker compose up -d --build
"""
import pathlib, re, shutil, sys
here = pathlib.Path(__file__).resolve().parent
web = here.parent / 'web'
game = here / 'game'
if not web.exists(): sys.exit(f'Could not find {web}. Run this from the server folder inside the Arena151_Android project.')
for f in ('data.js', 'sim.js'): shutil.copy(web / f, game / f); print('copied', f)
render = (web / 'render.js').read_text(encoding='utf-8')
i = render.index('const MOVE_FX = {'); depth = 0
for k in range(i, len(render)):
    if render[k] == '{': depth += 1
    elif render[k] == '}':
        depth -= 1
        if depth == 0: block = render[i:k + 1] + ';'; break
mega = next(l for l in (web / 'sprites.js').read_text(encoding='utf-8').splitlines() if l.startswith('const MEGA_ABLE'))
(game / 'fxdata.js').write_text('/* Per-type effect colours and Mega-capable Pokémon (copied from the game by sync_game.py). */\n' + block + '\n' + mega + '\n', encoding='utf-8')
ver = re.search(r"APP_VERSION = '([^']+)'", (web / 'buildinfo.js').read_text(encoding='utf-8')).group(1)
(game / 'VERSION').write_text(ver + '\n', encoding='utf-8')
print('server game logic now matches app version', ver)
