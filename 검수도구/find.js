// 92MB 파일에서 base64 줄을 제외하고 검색 (\uXXXX 이스케이프도 해독해 매칭)
const fs = require('fs');
const pat = new RegExp(process.argv[2], process.argv[4] || '');
const ctx = Number(process.argv[3] || 0);
const FILE = process.env.BD_FILE || 'D:/봉담/봉담지킴이_v147.html';
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
const dec = s => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
let hits = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].length > 4000) continue;
  const d = dec(lines[i]);
  if (pat.test(lines[i]) || pat.test(d)) {
    hits++;
    if (hits > 150) { console.log('... (150+ hits, truncated)'); break; }
    for (let j = Math.max(0, i - ctx); j <= Math.min(lines.length - 1, i + ctx); j++) {
      console.log((j + 1) + (j === i ? ':> ' : ':  ') + dec(lines[j]).slice(0, 400));
    }
    if (ctx) console.log('---');
  }
}
console.log('총 ' + hits + '건');
