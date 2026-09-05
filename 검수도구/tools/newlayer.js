// 새 레이어(script/style) 추가: 다음 블록 번호를 배정하고 shell.html </body> 앞에 태그 삽입
// 사용: node tools/newlayer.js <srcdir> <id> <js|css> [contentFile]
//   예) node tools/newlayer.js D:\봉담\src bd-foo-v368 js  patch.js
'use strict';
const fs = require('fs'), path = require('path');
const [, , SRC, ID, KIND, CONTENT] = process.argv;
if (!SRC || !ID || !/^(js|css)$/.test(KIND || '')) { console.error('usage: node newlayer.js <srcdir> <id> <js|css> [contentFile]'); process.exit(1); }
const files = fs.readdirSync(path.join(SRC, 'blocks'));
const max = files.reduce((m, f) => { const x = f.match(/^(\d{4})_/); return x ? Math.max(m, Number(x[1])) : m; }, -1);
const idx = String(max + 1).padStart(4, '0');
const safe = ID.replace(/[^A-Za-z0-9_\-]/g, '_');
const fname = `${idx}_${safe}.${KIND}`;
const body = CONTENT ? fs.readFileSync(CONTENT) : Buffer.from(`/* ${ID} */\n`);
fs.writeFileSync(path.join(SRC, 'blocks', fname), body);
const shellP = path.join(SRC, 'shell.html');
let s = fs.readFileSync(shellP, 'latin1');
const tag = KIND === 'js' ? `<script id="${ID}">@@BLOCK:${idx}@@</script>` : `<style id="${ID}">@@BLOCK:${idx}@@</style>`;
const at = s.lastIndexOf('</body>'); if (at < 0) throw new Error('</body> 없음');
s = s.slice(0, at) + tag + '\n' + s.slice(at);
fs.writeFileSync(shellP, Buffer.from(s, 'latin1'));
console.log('added blocks/' + fname + ' + shell tag ' + tag);
