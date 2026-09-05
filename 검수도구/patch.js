// 봉담지킴이 정밀 패치 도구 (92MB 파일 대상)
// usage: node patch.js <patchDefFile.js>
const fs = require('fs');
const path = require('path');
const FILE = 'D:/봉담/봉담지킴이_v147.html';

const def = require(path.resolve(process.argv[2]));
let src = fs.readFileSync(FILE, 'utf8');
let okAll = true;

for (const p of def) {
  if (p.type === 'append_before_body_end') {
    const marker = '</body>';
    const i = src.lastIndexOf(marker);
    if (i < 0) { console.log('❌ ' + p.name + ': </body> not found'); okAll = false; continue; }
    if (src.includes('id="' + p.id + '"')) { console.log('⏭  ' + p.name + ': already present'); continue; }
    src = src.slice(0, i) + p.html + '\n' + src.slice(i);
    console.log('✅ ' + p.name + ' (layer appended)');
    continue;
  }
  const n = src.split(p.from).length - 1;
  if (n !== (p.count || 1)) {
    console.log(`❌ ${p.name}: expected ${p.count || 1} match(es), found ${n}`);
    okAll = false;
    continue;
  }
  src = src.split(p.from).join(p.to);
  console.log(`✅ ${p.name} (${n})`);
}

if (!okAll) { console.log('\n⛔ 일부 실패 — 파일을 저장하지 않았습니다.'); process.exit(1); }
fs.writeFileSync(FILE, src, 'utf8');
console.log('\n💾 저장 완료: ' + (fs.statSync(FILE).size / 1048576).toFixed(1) + 'MB');
