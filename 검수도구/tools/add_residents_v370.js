// (v370) 신규 주민 4명(선택 위험요소 담당) — 배치 JSON + 베이크 리터럴(blocks/0002) 동시 갱신. 이후 restamp 필요.
'use strict';
const fs = require('fs');
const JSON_P = 'D:/봉담/bongdam_rpg_editor_data_v5_2_quest.json';
const BLK = 'D:/봉담/src/blocks/0002_anon.js';
const NEW = [
  { sid: '212', id: 'bdlink_ow_npc_parkguard', name: '박 반장', label: '주민 · 경비 박 반장', asset: 'npc_front_dohyun', rx: 0.7517, ry: 0.4954, hz: 'ow212_smoke_1', region: 'wawoo',
    lines: ['단지 경비실 박 반장이야. 애들 등하교 시간엔 꼭 앞에 나와 있지.', '요즘 골목에 담배 피우는 사람이 있어서 영 신경 쓰여.'] },
  { sid: '213', id: 'bdlink_ow_npc_sunim', name: '순임 할머니', label: '주민 · 순임 할머니', asset: 'npc_front_eunji_mother', rx: 0.342, ry: 0.4963, hz: 'ow213_alley_1', region: 'sang',
    lines: ['아이고, 배지 단 학생이구나. 이 공원은 내가 매일 걷는 데야.', '해만 안 지면 참 좋은 길인데… 저녁엔 무서워서 못 걷겠어.'] },
  { sid: '211', id: 'bdlink_ow_npc_yeongja', name: '영자', label: '주민 · 환경미화원 영자', asset: 'npc_front_haneul', rx: 0.2473, ry: 0.4428, hz: 'ow211_trash_1', region: 'donghwa',
    lines: ['환경미화 영자예요. 이 광장은 내 담당이지.', '아침에 치워도 저녁이면 또 쌓여요. 누가 자꾸 두고 가나 봐.'] },
  { sid: '210', id: 'bdlink_ow_npc_junho', name: '준호', label: '주민 · 중학생 준호', asset: 'npc_front_jaehyun', rx: 0.5664, ry: 0.6878, hz: 'ow210_alley_1', region: 'suyeong',
    lines: ['어, 지킴이다! 나 준호. 학원 끝나고 집 가는 길이야.', '저 골목이 지름길인데 엄마가 어두우니까 다니지 말래.'] },
];
function mk(n){
  return { _editorId: n.id, type: 'prop', key: 'asset:' + n.asset, assetId: n.asset, customImage: true,
    rx: n.rx, ry: n.ry, rw: 0.0356, rh: 0.0323, label: n.label, resident: true, residentId: n.id.replace('bdlink_', ''),
    npcName: n.name, npcLines: n.lines, hzTarget: n.hz, bdLinkRegion: n.region, hidden: false, locked: false, __npcArtV33: true, __v370: true };
}
function apply(J){
  let added = 0;
  for (const n of NEW){
    const st = J.stages && J.stages[n.sid]; if (!st) { console.log('no stage', n.sid); continue; }
    st.objects = st.objects || [];
    if (st.objects.some(o => o && o._editorId === n.id)) continue;
    // 툼스톤 존중
    if (Array.isArray(st.deletedSysIds) && st.deletedSysIds.includes(n.id)) continue;
    st.objects.push(mk(n)); added++;
  }
  return added;
}
// 1) JSON 파일
const J = JSON.parse(fs.readFileSync(JSON_P, 'utf8'));
const a1 = apply(J);
fs.writeFileSync(JSON_P, JSON.stringify(J));
console.log('JSON 파일 주민 추가:', a1);
// 2) 베이크 리터럴
let src = fs.readFileSync(BLK, 'utf8');
const m = src.match(/window\.__BD_BAKED_STAGE_RAW = ("(?:[^"\\]|\\.)*");/);
if (!m) throw new Error('bake literal not found');
const raw = JSON.parse(m[1]);            // 리터럴 → JSON 문자열
const B = JSON.parse(raw);               // → 객체
const a2 = apply(B);
const lit = JSON.stringify(JSON.stringify(B));
src = src.replace(m[0], 'window.__BD_BAKED_STAGE_RAW = ' + lit + ';');
fs.writeFileSync(BLK, src);
console.log('베이크 주민 추가:', a2, '→ restamp 필요');
