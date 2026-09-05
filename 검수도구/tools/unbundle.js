// 봉담지킴이 빌드 HTML → 소스 트리 기계적 분해 (bundle.js 로 바이트 동일 재조립)
// 사용: node tools/unbundle.js <build.html> <srcdir>
//  - <script>/<style> 블록 → src/blocks/NNNN_<id>.js|.css  (셸에는 @@BLOCK:NNNN@@ 토큰)
//  - base64 데이터 URI(≥1KB) → src/assets/<hash8>_<hint>.<ext>  (본문에는 @@B64:<name>@@ 토큰, 동일 내용은 공유)
//  - src/shell.html, src/manifest.json
// 원칙: 로직 재배치 없음. bundle 결과 sha1 == 원본 sha1 이어야 한다.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [, , IN, OUT] = process.argv;
if (!IN || !OUT) { console.error('usage: node unbundle.js <build.html> <srcdir>'); process.exit(1); }
const buf = fs.readFileSync(IN);
const h = buf.toString('latin1');                       // 1바이트=1문자 — 바이트 보존
const rmrf = p => { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); };
rmrf(OUT); fs.mkdirSync(path.join(OUT, 'blocks'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
const wr = (rel, s) => fs.writeFileSync(path.join(OUT, rel), Buffer.from(s, 'latin1'));

// ── 1. 에셋 추출기 (블록·셸 텍스트 공용) ─────────────────────────
const assets = new Map();   // hash → {name, ext, mime, bytes}
const EXT = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'font/woff2': 'woff2', 'font/woff': 'woff', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'application/octet-stream': 'bin' };
let rawKept = 0, assetHits = 0;
function extractAssets(text) {
  const re = /data:([a-z]+\/[a-z0-9.+-]+);base64,/g;
  let out = '', last = 0, m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length, j = i;
    while (j < text.length) { const c = text.charCodeAt(j); if ((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 43 || c === 47 || c === 61) j++; else break; }
    const b64 = text.slice(i, j);
    if (b64.length < 1024) { re.lastIndex = j; continue; }
    const bin = Buffer.from(b64, 'base64');
    const canonical = bin.toString('base64') === b64;     // 재인코딩이 원문과 같아야 바이너리로 저장 가능
    const hash = crypto.createHash('sha1').update(b64).digest('hex').slice(0, 8);
    let rec = assets.get(hash);
    if (!rec) {
      // 힌트: 앞쪽 120자에서 마지막 식별자/키 이름
      const ctx = text.slice(Math.max(0, m.index - 120), m.index);
      const hint = ((ctx.match(/([A-Za-z0-9_\-가-힣]{2,40})\s*["']?\s*[:=,(]\s*["'`]?\s*$/) || [])[1] || '').replace(/[^A-Za-z0-9_\-]/g, '').slice(0, 32) || 'asset';
      const ext = canonical ? (EXT[m[1]] || 'bin') : 'b64';
      const name = `${hash}_${hint}.${ext}`;
      rec = { name, mime: m[1], canonical, size: canonical ? bin.length : b64.length };
      fs.writeFileSync(path.join(OUT, 'assets', name), canonical ? bin : Buffer.from(b64, 'latin1'));
      if (!canonical) rawKept++;
      assets.set(hash, rec);
    }
    assetHits++;
    out += text.slice(last, i) + '@@B64:' + rec.name + '@@';
    last = j; re.lastIndex = j;
  }
  return out + text.slice(last);
}

// ── 2. 블록 분해 (브라우저와 같은 규칙: 여는 태그 뒤 첫 닫는 태그까지) ──
const blocks = []; let shell = ''; let pos = 0, n = 0;
const openRe = /<(script|style)\b([^>]*)>/gi;
let m;
while ((m = openRe.exec(h))) {
  const tag = m[1].toLowerCase(); const start = m.index + m[0].length;
  const closeTag = '</' + tag + '>'; const end = h.indexOf(closeTag, start);
  if (end < 0) break;
  const inner = h.slice(start, end);
  const id = ((m[2].match(/\bid\s*=\s*"([^"]+)"/i) || [])[1] || '').replace(/[^A-Za-z0-9_\-]/g, '_');
  const idx = String(n).padStart(4, '0');
  const fname = `${idx}_${id || 'anon'}.${tag === 'script' ? 'js' : 'css'}`;
  wr('blocks/' + fname, extractAssets(inner));
  blocks.push({ idx, file: fname, tag, id: id || null, bytes: inner.length });
  shell += h.slice(pos, start) + '@@BLOCK:' + idx + '@@';
  pos = end; n++;
  openRe.lastIndex = end;
}
shell += h.slice(pos);
wr('shell.html', extractAssets(shell));
const manifest = { source: path.basename(IN), sha1: crypto.createHash('sha1').update(buf).digest('hex'), bytes: buf.length, blocks, assets: [...assets.values()], assetHits, rawKept };
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`blocks ${blocks.length} · assets ${assets.size} (참조 ${assetHits}, 비정규 b64 ${rawKept}) · sha1 ${manifest.sha1}`);
