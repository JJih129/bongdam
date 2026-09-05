const fs = require('fs');
const F = 'D:/봉담/봉담지킴이_v147.html';
let lines = fs.readFileSync(F, 'utf8').split('\n');

// '안내데스크 수진' → '문화의집 선생님'
const FROM = "'\\uC548\\uB0B4\\uB370\\uC2A4\\uD06C \\uC218\\uC9C4'";
const TO = "'\\uBB38\\uD654\\uC758\\uC9D1 \\uC120\\uC0DD\\uB2D8'";

const i = 26591 - 1;
if (lines[i].indexOf(FROM) < 0) {
  console.log('❌ 불일치: ' + lines[i].trim().slice(0, 120));
  process.exit(1);
}
lines[i] = lines[i].split(FROM).join(TO);
fs.writeFileSync(F, lines.join('\n'), 'utf8');
console.log('✅ v147-39 프롤로그 배웅 대사 화자 통일 (안내데스크 수진 → 문화의집 선생님)');
