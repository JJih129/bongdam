// 소스 트리 → 빌드 HTML 재조립 (unbundle.js 의 역연산). 사용: node tools/bundle.js <srcdir> <out.html> [--check=<orig.html>]
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const [, , SRC, OUT] = process.argv;
const chk = (process.argv.find(a => a.startsWith('--check=')) || '').slice(8);
if (!SRC || !OUT) { console.error('usage: node bundle.js <srcdir> <out.html> [--check=orig.html]'); process.exit(1); }
const rd = rel => fs.readFileSync(path.join(SRC, rel)).toString('latin1');
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const b64cache = new Map();
function inlineAssets(text) {
  return text.replace(/@@B64:([^@]+)@@/g, (_, name) => {
    let v = b64cache.get(name);
    if (v == null) {
      const bin = fs.readFileSync(path.join(SRC, 'assets', name));
      v = name.endsWith('.b64') ? bin.toString('latin1') : bin.toString('base64');
      b64cache.set(name, v);
    }
    return v;
  });
}
let html = inlineAssets(rd('shell.html'));
// 블록 해석: blocks/NNNN_*.js|css 파일명 우선(새 레이어는 파일 추가 + shell.html 토큰만으로 충분), manifest는 기록용
const files = fs.readdirSync(path.join(SRC, 'blocks'));
const byIdx = new Map();
for (const f of files) { const m = f.match(/^(\d{4})_/); if (m) { if (byIdx.has(m[1])) throw new Error('블록 번호 중복: ' + m[1]); byIdx.set(m[1], f); } }
html = html.replace(/@@BLOCK:(\d{4})@@/g, (_, idx) => {
  const f = byIdx.get(idx); if (!f) throw new Error('blocks/ 에 없는 블록 ' + idx);
  return inlineAssets(rd('blocks/' + f));
});
const out = Buffer.from(html, 'latin1');
// 임시파일에 쓴 뒤 교체 + 재시도 — 브라우저 등이 산출물을 읽는 순간의 EBUSY/EPERM 방어
{
  const tmpOut = OUT + '.tmp';
  fs.writeFileSync(tmpOut, out);
  let ok = false, lastErr = null;
  for (let t = 0; t < 8 && !ok; t++) {
    try { fs.renameSync(tmpOut, OUT); ok = true; }
    catch (e) { lastErr = e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400); }
  }
  if (!ok) { try { fs.copyFileSync(tmpOut, OUT); fs.unlinkSync(tmpOut); ok = true; } catch (e) { lastErr = e; } }
  if (!ok) throw lastErr;
}
const sha = crypto.createHash('sha1').update(out).digest('hex');
console.log(`bundle → ${OUT} ${(out.length / 1048576).toFixed(2)}MB sha1 ${sha}`);
if (chk) {
  const o = fs.readFileSync(chk); const os = crypto.createHash('sha1').update(o).digest('hex');
  if (os === sha) console.log('✔ 원본과 바이트 동일'); else { console.log('✖ 원본과 다름 (' + o.length + ' vs ' + out.length + ')'); process.exit(2); }
}
