/* =====================================================================
   Section 6b: GIF decoder for animated custom sprites
   Decodes every frame (LZW, local/global palettes, transparency,
   interlacing, all disposal methods) into full-size canvases with the
   per-frame delays, so the game controls playback, mirroring, flashes
   and tints itself.
   ===================================================================== */
function gifLzw(minCode, data, npix) {
  const out = new Uint8Array(npix), clear = 1 << minCode, eoi = clear + 1;
  let size = minCode + 1, mask = (1 << size) - 1, next = eoi + 1;
  const prefix = new Int16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) { prefix[i] = -1; suffix[i] = i; }
  let datum = 0, bits = 0, pi = 0, op = 0, old = -1, first = 0;
  while (op < npix) {
    while (bits < size) { if (pi >= data.length) return out; datum |= data[pi++] << bits; bits += 8; }
    let code = datum & mask; datum >>>= size; bits -= size;
    if (code === clear) { size = minCode + 1; mask = (1 << size) - 1; next = eoi + 1; old = -1; continue; }
    if (code === eoi) break;
    if (old === -1) { out[op++] = suffix[code]; old = code; first = code; continue; }
    const incoming = code; let sp = 0;
    if (code >= next) { stack[sp++] = first; code = old; }
    while (code >= clear) { stack[sp++] = suffix[code]; code = prefix[code]; }
    first = suffix[code]; stack[sp++] = first;
    if (next < 4096) { prefix[next] = old; suffix[next] = first; next++; if ((next & mask) === 0 && next < 4096) { size++; mask = (1 << size) - 1; } }
    old = incoming;
    while (sp > 0 && op < npix) out[op++] = stack[--sp];
  }
  return out;
}
function decodeGif(buffer) {
  const b = new Uint8Array(buffer); let p = 0;
  if (b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) throw new Error('not a GIF');
  p = 6;
  const u16 = () => { const v = b[p] | (b[p + 1] << 8); p += 2; return v; };
  const W = u16(), H = u16(), packed = b[p++]; p += 2;
  let gct = null;
  if (packed & 0x80) { const n = 1 << ((packed & 7) + 1); gct = b.subarray(p, p + n * 3); p += n * 3; }
  const frames = [], delays = [], comp = new Uint8ClampedArray(W * H * 4);
  let gce = { disposal: 0, delay: 0, trans: -1 };
  while (p < b.length) {
    const block = b[p++];
    if (block === 0x3B) break;                                   // trailer
    if (block === 0x21) {                                        // extension
      const label = b[p++];
      if (label === 0xF9) { const sz = b[p++], pk = b[p]; gce = { disposal: (pk >> 2) & 7, delay: b[p + 1] | (b[p + 2] << 8), trans: (pk & 1) ? b[p + 3] : -1 }; p += sz; p++; }
      else { let s; while ((s = b[p++]) !== 0) p += s; }
      continue;
    }
    if (block !== 0x2C) break;                                   // image descriptor
    const fx = u16(), fy = u16(), fw = u16(), fh = u16(), pk = b[p++];
    let ct = gct;
    if (pk & 0x80) { const n = 1 << ((pk & 7) + 1); ct = b.subarray(p, p + n * 3); p += n * 3; }
    const interlaced = !!(pk & 0x40), minCode = b[p++];
    const chunks = []; let total = 0, s;
    while ((s = b[p++]) !== 0) { chunks.push(b.subarray(p, p + s)); p += s; total += s; }
    const data = new Uint8Array(total); let o = 0; for (const c of chunks) { data.set(c, o); o += c.length; }
    const px = gifLzw(minCode, data, fw * fh);
    let rowMap = null;
    if (interlaced) { rowMap = new Uint16Array(fh); let r = 0; for (const [st, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let y = st; y < fh; y += step) rowMap[r++] = y; }
    const before = gce.disposal === 3 ? comp.slice() : null;
    if (ct) for (let i = 0; i < fw * fh; i++) {
      const ci = px[i]; if (ci === gce.trans) continue;
      const row = (i / fw) | 0, x = fx + (i - row * fw), y = fy + (rowMap ? rowMap[row] : row);
      if (x >= W || y >= H) continue;
      const q = (y * W + x) * 4; comp[q] = ct[ci * 3]; comp[q + 1] = ct[ci * 3 + 1]; comp[q + 2] = ct[ci * 3 + 2]; comp[q + 3] = 255;
    }
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    c.getContext('2d').putImageData(new ImageData(comp.slice(), W, H), 0, 0);
    frames.push(c); delays.push(gce.delay < 2 ? 100 : gce.delay * 10);   // browsers treat 0–10 ms as 100 ms
    if (gce.disposal === 2) { for (let y = fy; y < Math.min(H, fy + fh); y++) comp.fill(0, (y * W + fx) * 4, (y * W + Math.min(W, fx + fw)) * 4); }
    else if (gce.disposal === 3 && before) comp.set(before);
    gce = { disposal: 0, delay: 0, trans: -1 };
  }
  if (!frames.length) throw new Error('GIF has no frames');
  return { W, H, frames, delays };
}
