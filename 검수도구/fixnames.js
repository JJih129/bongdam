const fs = require('fs');
const F = 'D:/봉담/봉담지킴이_v147.html';
let lines = fs.readFileSync(F, 'utf8').split('\n');

const SUJIN = '\\uC218\\uC9C4';                       // 수진
const MUNHWA = '\\uBB38\\uD654\\uC758\\uC9D1';        // 문화의집
const SEON = '\\uC120\\uC0DD';                        // 선생
const DESK = '\\uC548\\uB0B4\\uB370\\uC2A4\\uD06C';   // 안내데스크
const UI = '\\uC758';                                 // 의

let changed = 0;
function fix(idx, from, to, label) {
  const i = idx - 1;
  if (!lines[i] || lines[i].indexOf(from) < 0) {
    console.log('❌ ' + label + ' (line ' + idx + ') 불일치');
    console.log('   실제: ' + (lines[i] || '').trim().slice(0, 140));
    return;
  }
  lines[i] = lines[i].split(from).join(to);
  changed++;
  console.log('✅ ' + label);
}

fix(26570, SUJIN + ' ' + SEON, MUNHWA + ' ' + SEON, 'v147-36 프롤로그 안내 카드 인물명');
fix(27946, SUJIN + ' ' + SEON, MUNHWA + ' ' + SEON, 'v147-37 구 레이어에 남아 있던 토스트');
fix(26558, DESK + UI + ' ' + MUNHWA + ' ' + SEON, DESK + ' ' + SEON, 'v147-38 «안내데스크의 문화의집 선생님» 겹말 정리');

if (changed) {
  fs.writeFileSync(F, lines.join('\n'), 'utf8');
  console.log('💾 저장 ' + changed + '건');
} else {
  console.log('⛔ 변경 없음');
}
