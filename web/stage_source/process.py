# Converts the reference images into 700x430 arena art (1 art pixel = 2 world units).
# Each image is scaled so its battle floor matches the game's arena, cropped around it,
# sharpened and snapped to a clean palette so it renders as crisp pixel art.
from PIL import Image, ImageFilter, ImageEnhance
import json, base64, io, sys
ART_W, ART_H, CX_ART, CY_ART = 700, 430, 350, 220
STAGES = {   # image file index, battle floor in image pixels (x0, y0, x1, y1)
  'plaza':  (0, (405, 360, 795, 595)),
  'skyfort':(1, (420, 360, 785, 565)),
  'grotto': (2, (458, 392, 748, 545)),
  'oasis':  (3, (395, 352, 810, 570)),
  'ruins':  (4, (398, 355, 808, 565)),
}
meta = {}
out = {}
for sid, (k, (x0, y0, x1, y1)) in STAGES.items():
    src = Image.open(f'/tmp/ref/s{k}.png').convert('RGB')
    if sid == 'skyfort':   # remove the two trainers painted on the side pads; the game draws its own there
        import numpy as np, cv2
        a = np.array(src)[:, :, ::-1].copy(); m = np.zeros(a.shape[:2], np.uint8)
        for (px0, py0, px1, py1) in [(366, 424, 396, 474), (806, 424, 838, 474)]: m[py0:py1, px0:px1] = 255
        a = cv2.inpaint(a, m, 5, cv2.INPAINT_TELEA); src = Image.fromarray(a[:, :, ::-1])
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    s = 440 / (x1 - x0)                          # art pixels per image pixel
    box = (cx - CX_ART / s, cy - CY_ART / s, cx + (ART_W - CX_ART) / s, cy + (ART_H - CY_ART) / s)
    img = src.resize((ART_W, ART_H), Image.LANCZOS, box=box)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=2))
    img = ImageEnhance.Color(img).enhance(1.08)
    q = img.quantize(colors=160, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    q.save(f'/home/claude/stageimg/{sid}.png', optimize=True)
    buf = io.BytesIO(); q.save(buf, 'PNG', optimize=True)
    out[sid] = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
    meta[sid] = {'cx': cx, 'cy': cy, 's': s}
    print(sid, 'scale %.3f' % s, 'png KB', len(buf.getvalue()) // 1024)
js = '/* Arena art converted from the reference images by stageimg/process.py. */\nconst STAGE_IMG = ' + json.dumps(out) + ';\nconst STAGE_MAP = ' + json.dumps(meta) + ';\n'
open('/home/claude/m7/src/stage_images.js', 'w').write(js)
print('stage_images.js KB', len(js) // 1024)
