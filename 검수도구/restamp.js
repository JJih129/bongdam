/* restamp.js — 베이크 내용 해시로 빌드 스탬프 갱신 (모든 데이터 패치 후 실행!)
   문제: bd-fresh-bake-boot-v117 의 스탬프가 'bd-build-v117' 고정이라
        v117+ 빌드를 한 번이라도 연 PC에서는 새 배치가 영영 적용되지 않았다.
   해법: 스탬프 = 베이크(__BD_BAKED_STAGE_RAW) 영역의 FNV-1a 해시 — 데이터가 바뀌면 자동 변경.
   사용: node restamp.js <IN.html> <OUT.html>   (IN==OUT 허용) */
'use strict';
const fs = require('fs');
const IN = process.argv[2];
const OUT = process.argv[3] || IN;
if (!IN) throw new Error('사용: node restamp.js <IN.html> [OUT.html]');
let html = fs.readFileSync(IN, 'utf8');

// 베이크 영역: __BD_BAKED_STAGE_RAW 첫 등장부터 3MB (배치 데이터 전체 포함)
const b0 = html.indexOf('__BD_BAKED_STAGE_RAW');
if (b0 < 0) throw new Error('베이크 마커 없음');
const region = html.slice(b0, b0 + 3 * 1024 * 1024);
let h = 0x811c9dc5;
for (let i = 0; i < region.length; i++) {
  h ^= region.charCodeAt(i);
  h = (h * 0x01000193) >>> 0;
}
const stamp = 'bd-bake-' + h.toString(16) + '-' + region.length;

// 현재 스탬프 리터럴 교체 (v117 원본 또는 이전 restamp 결과 모두 매치)
const re = /var BUILD = '[^']+';(\s*\/\/[^\n]*|\s*\/\*[^*]*\*\/)?/;
const m = html.match(re);
if (!m) throw new Error('BUILD 리터럴 없음');
html = html.replace(re, "var BUILD = '" + stamp + "';   /* (v319) 베이크 내용 해시 — 데이터가 바뀌면 자동으로 새 스탬프 */");
fs.writeFileSync(OUT, html, 'utf8');
console.log('스탬프:', stamp);
console.log('출력:', OUT, Math.round(html.length / 1024 / 1024) + 'MB');
