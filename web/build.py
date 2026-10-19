# Rebuilds ../index.html from these source files: python build.py
import pathlib
src = pathlib.Path(__file__).resolve().parent
head = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0c1120">
<title>Arena 151 — Milestone 11: Trainer roster</title>
<style>
'''
out = head + (src/'fonts.css').read_text(encoding='utf-8') + (src/'style.css').read_text(encoding='utf-8') + '</style>\n</head>\n<body>\n' + (src/'body.html').read_text(encoding='utf-8') + '<script>\n'
for f in ['data.js', 'gif.js', 'apng.js', 'sprites.js', 'stages.js', 'stages_core.js', 'stage_images.js', 'stages_img.js', 'sim.js', 'render.js', 'movefx_core.js', 'movefx_moves.js', 'movefx_signature.js', 'movefx_signature2.js', 'movefx_signature3.js', 'game.js', 'session4.js', 'session5.js', 'session5b.js', 'session6.js', 'audio.js', 'stage_thumbs.js', 'startscreen.js']:
    out += (src/f).read_text(encoding='utf-8') + '\n'
out += '</script>\n</body>\n</html>\n'
import sys
target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else (src.parent/'app'/'src'/'main'/'assets'/'index.html' if (src.parent/'app').exists() else src.parent/'index.html')
target.write_text(out, encoding='utf-8')
print('wrote', target)
print(len(out.splitlines()), 'lines', len(out), 'bytes')
