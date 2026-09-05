// 빌드 HTML 구조 계량 — script/style 블록 수·크기, base64 에셋 수·크기
const fs = require('fs');
const P = process.argv[2] || 'D:/봉담/봉담지킴이_게시용_v338_final.html';
const h = fs.readFileSync(P, 'latin1'); // 바이트 보존용 (분석만)
console.log('bytes', h.length);
const scripts = [...h.matchAll(/<script\b([^>]*)>/g)];
let sTotal = 0, sBig = [];
for (const m of scripts) {
  const start = m.index + m[0].length; const end = h.indexOf('</script>', start);
  const len = end - start; sTotal += len;
  const id = (m[1].match(/id="([^"]+)"/) || [])[1] || '';
  if (len > 200000) sBig.push([id || '(anon)', len]);
}
console.log('scripts', scripts.length, 'total', sTotal, 'big:', sBig);
const styles = [...h.matchAll(/<style\b[^>]*>/g)];
console.log('styles', styles.length);
const dat = [...h.matchAll(/data:([a-z]+\/[a-z0-9.+-]+);base64,/g)];
let dTotal = 0; const byType = {};
for (const m of dat) {
  let i = m.index + m[0].length, j = i;
  while (j < h.length && /[A-Za-z0-9+\/=]/.test(h[j])) j++;
  const len = j - i; dTotal += len; byType[m[1]] = (byType[m[1]] || 0) + len;
}
console.log('data-uris', dat.length, 'base64 bytes', dTotal, byType);
console.log('non-asset bytes ≈', h.length - dTotal);
