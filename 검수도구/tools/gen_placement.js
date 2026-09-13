/* 에디터 저장본 → 웹판 배치 데이터 생성 (v400)
 *   node 검수도구/tools/gen_placement.js [<json>] [<out.js>]
 *   기본: bongdam_rpg_editor_data_v5_2_quest.json → src/blocks/0071_bd-placement-data.js
 *
 * 왜: 웹판(웹게시)은 에디터 블록(0023)이 빠져 저장본 JSON 을 읽지 않는다. 주민·위험요소 위치가 0099·0104 에
 *     손으로 적힌 값이라 «에디터에서 옮겨도 배포본은 그대로»였다. 이 스크립트가 빌드 때마다 저장본에서
 *     4개 리(210~213)의 주민(중심 좌표·hzTarget)·위험요소(cx,cy·변형·선택 여부)·보스 위치·삭제 툼스톤을 뽑아
 *     window.__BD_PLACEMENT 로 굽고, 0099·0104 가 이를 우선 적용한다.
 * 규칙: 좌표·짝(hzTarget)·삭제 여부만 에디터가 정본. 대사·에셋은 코드(0099·0104·0116)가 정본.
 *       버스 정류장은 코드 정본(에디터 삭제 툼스톤을 적용하지 않는다). */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const MAIN = require.main === module;   /* require 로 불릴 땐 호출자의 argv 를 쓰지 않는다 */
const IN = (MAIN && process.argv[2]) || path.join(ROOT, 'bongdam_rpg_editor_data_v5_2_quest.json');
const OUT = (MAIN && process.argv[3]) || path.join(ROOT, 'src', 'blocks', '0071_bd-placement-data.js');
const SIDS = ['210', '211', '212', '213'];
const r4 = v => Math.round(Number(v) * 10000) / 10000;

function build() {
  const J = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const out = { savedAt: J.savedAt || null, stages: {} };
  let nNpc = 0, nHz = 0;
  for (const sid of SIDS) {
    const st = J.stages && J.stages[sid]; if (!st) continue;
    const S = { npcs: {}, hazards: {}, boss: null, deletedSysIds: (st.deletedSysIds || []).slice(), deletedHazardIds: (st.deletedHazardIds || []).slice() };
    for (const o of (st.objects || [])) {
      if (!o || o.hidden) continue;
      if (o.resident && o._editorId && (/^bdlink_/.test(o._editorId) || /^bdnpc_/.test(o._editorId))) {
        const rw = Number(o.rw || 0.05), rh = Number(o.rh || 0.075);
        S.npcs[o._editorId] = {
          name: o.npcName || null,
          x: r4(Number(o.rx) + rw / 2),            /* 중심 x (0099 box · 0104 모두 중심 x) */
          yc: r4(Number(o.ry) + rh / 2),           /* 중심 y (0099 box 기준) */
          yf: r4(Number(o.ry) + rh),               /* 발끝 y (0104 기준) */
          asset: o.assetId || null,
          hzTarget: o.hzTarget || null,
        };
        nNpc++;
        continue;
      }
      if (o.interactable === 'hazard' && o.hazardId) {
        const cx = (o.cx != null) ? Number(o.cx) : Number(o.rx) + Number(o.rw || 0) / 2;
        const cy = (o.cy != null) ? Number(o.cy) : Number(o.ry) + Number(o.rh || 0) / 2;
        if (o.isBoss || /^final_boss/.test(o.hazardId)) { S.boss = { x: r4(cx), y: r4(cy) }; continue; }
        S.hazards[o.hazardId] = { x: r4(cx), y: r4(cy), variant: o.hazardVariant || null, family: o.hazardFamily || null, label: o.label || null, optional: !!o.bdOptional };
        nHz++;
      }
    }
    out.stages[sid] = S;
  }
  const js = '/* 자동 생성 — 편집 금지. 원본: ' + path.basename(IN) + ' (savedAt ' + (out.savedAt || '?') + ')\n'
    + '   생성기: 검수도구/tools/gen_placement.js — 빌드(build.js·bundle.js)마다 다시 만든다. */\n'
    + 'window.__BD_PLACEMENT = ' + JSON.stringify(out) + ';\n';
  const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
  if (prev !== js) fs.writeFileSync(OUT, js, 'utf8');
  return { changed: prev !== js, nNpc, nHz, out: OUT };
}
if (require.main === module) {
  const r = build();
  console.log('배치 데이터 → ' + path.relative(ROOT, r.out) + ' · 주민 ' + r.nNpc + ' · 위험요소 ' + r.nHz + (r.changed ? ' (갱신)' : ' (변화 없음)'));
}
module.exports = build;
