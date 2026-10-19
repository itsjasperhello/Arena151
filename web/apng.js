/* =====================================================================
   Section 6c: APNG decoder for animated trainer sprites
   Splits an animated PNG into standalone PNG frames, decodes them with
   the browser, and composites them with the APNG dispose/blend rules
   into full-size canvases with per-frame delays.
   ===================================================================== */
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function pngChunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length); for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i); out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length))); return out;
}
async function decodeApng(buffer) {
  const b = new Uint8Array(buffer), dv = new DataView(buffer);
  if (b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4E || b[3] !== 0x47) throw new Error('not a PNG');
  let p = 8, ihdr = null, W = 0, H = 0, animated = false; const shared = [], frames = []; let cur = null, seenData = false;
  while (p + 8 <= b.length) {
    const len = dv.getUint32(p), type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]), data = b.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (type === 'IHDR') { ihdr = data.slice(); W = dv.getUint32(p - 12 - len + 8); H = dv.getUint32(p - 12 - len + 12); }
    else if (type === 'acTL') animated = true;
    else if (type === 'fcTL') { const d = new DataView(data.buffer, data.byteOffset, data.byteLength);
      cur = { w: d.getUint32(4), h: d.getUint32(8), x: d.getUint32(12), y: d.getUint32(16), num: d.getUint16(20), den: d.getUint16(22) || 100, dispose: data[24], blend: data[25], parts: [] }; frames.push(cur); }
    else if (type === 'IDAT') { seenData = true; if (cur) cur.parts.push(data); else if (!animated) { if (!frames.length) frames.push({ w: W, h: H, x: 0, y: 0, num: 0, den: 100, dispose: 0, blend: 0, parts: [] }); frames[0].parts.push(data); } }
    else if (type === 'fdAT') { if (cur) cur.parts.push(data.subarray(4)); }
    else if (type === 'IEND') break;
    else if (!seenData && type !== 'acTL') shared.push(pngChunk(type, data));   // PLTE, tRNS, gAMA... needed by every frame
  }
  if (!ihdr || !frames.length) throw new Error('PNG has no frames');
  const sig = b.subarray(0, 8), iend = pngChunk('IEND', new Uint8Array(0)), comp = document.createElement('canvas'); comp.width = W; comp.height = H; const cx = comp.getContext('2d');
  const outFrames = [], delays = [], list = frames.filter(f => f.parts.length);
  // decode every frame's image in parallel, then composite them in order
  const bmps = await Promise.all(list.map(f => { const hd = ihdr.slice(), hv = new DataView(hd.buffer); hv.setUint32(0, f.w); hv.setUint32(4, f.h);
    return createImageBitmap(new Blob([sig, pngChunk('IHDR', hd), ...shared, ...f.parts.map(d => pngChunk('IDAT', d)), iend], { type: 'image/png' })); }));
  const prev = document.createElement('canvas'); prev.width = W; prev.height = H; const px = prev.getContext('2d');
  list.forEach((f, n) => {
    if (f.dispose === 2) { px.clearRect(0, 0, W, H); px.drawImage(comp, 0, 0); }          // keep a copy to restore afterwards
    if (f.blend === 0) cx.clearRect(f.x, f.y, f.w, f.h);
    cx.drawImage(bmps[n], f.x, f.y); bmps[n].close && bmps[n].close();
    const snap = document.createElement('canvas'); snap.width = W; snap.height = H; snap.getContext('2d').drawImage(comp, 0, 0);
    outFrames.push(snap); delays.push(Math.max(20, Math.round(f.num / f.den * 1000)) || 100);
    if (f.dispose === 1) cx.clearRect(f.x, f.y, f.w, f.h); else if (f.dispose === 2) { cx.clearRect(0, 0, W, H); cx.drawImage(prev, 0, 0); }
  });
  return { W, H, frames: outFrames, delays };
}
