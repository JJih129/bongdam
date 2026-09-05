// (v373) 동화리 주민 위치 조정 — 쓰레기(ow211_trash_1) 주변이 재현·영자 대화 반경에 갇혀 F가 주민 대화로 새던 문제.
//  재현: (0.175,0.523) → (0.175,0.560)  도로 아래로 — 쓰레기 바로 아래(도로)에서 F 하면 쓰레기가 잡힌다
//  영자: (0.247,0.443) → (0.300,0.500)  도로 오른쪽 — 쓰레기 오른쪽 접근도 자유
// 배치 JSON + 베이크(0002) 동시 갱신 → restamp 필요. 에디터에서 다시 옮겨도 무방.
'use strict';
const fs = require('fs');
const JSON_P = 'D:/봉담/bongdam_rpg_editor_data_v5_2_quest.json';
const BLK = 'D:/봉담/src/blocks/0002_anon.js';
const MOVES = [
  { sid: '211', match: o => o && o.resident && /재현/.test(o.npcName || o.label || ''), rx: 0.175, ry: 0.560 },
  { sid: '211', match: o => o && o.resident && /영자/.test(o.npcName || o.label || ''), rx: 0.300, ry: 0.500 },
];
function apply(J){
  let n = 0;
  for (const mv of MOVES){
    const st = J.stages && J.stages[mv.sid]; if (!st) continue;
    (st.objects || []).forEach(o => { if (mv.match(o)) { o.rx = mv.rx; o.ry = mv.ry; n++; } });
  }
  return n;
}
const J = JSON.parse(fs.readFileSync(JSON_P, 'utf8'));
console.log('JSON 이동:', apply(J));
fs.writeFileSync(JSON_P, JSON.stringify(J));
let src = fs.readFileSync(BLK, 'utf8');
const m = src.match(/window\.__BD_BAKED_STAGE_RAW = ("(?:[^"\\]|\\.)*");/);
if (!m) throw new Error('bake literal not found');
const B = JSON.parse(JSON.parse(m[1]));
console.log('베이크 이동:', apply(B));
src = src.replace(m[0], 'window.__BD_BAKED_STAGE_RAW = ' + JSON.stringify(JSON.stringify(B)) + ';');
fs.writeFileSync(BLK, src);
console.log('→ restamp 필요');
