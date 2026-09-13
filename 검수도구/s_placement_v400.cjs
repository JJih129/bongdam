/* (v400) 에디터 배치 → 웹판 자동 반영 검증 — 0071 배치 데이터가 0099(주민·위험요소·보스)·0104(친구 3인)에 적용되는가
 *   node 검수도구/s_placement_v400.cjs [--url=http://localhost:8788/new/] */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
let fails = 0;
const ok = (c, l, d) => { console.log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };
const B64 = s => Buffer.from(s, 'utf8').toString('base64');
async function ev(p, js) { return await p.evaluate(b => eval(new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)))), B64(js)).catch(e => 'ERR ' + e.message); }
/* 기대값은 생성기와 같은 규칙으로 저장본에서 직접 계산 — 빌드 산출물과 독립적으로 비교 */
const J = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'bongdam_rpg_editor_data_v5_2_quest.json'), 'utf8'));
function expect(sid, eid) { const o = (J.stages[sid].objects || []).find(x => x && x._editorId === eid); if (!o) return null; return { x: o.rx + (o.rw || 0.05) / 2, yc: o.ry + (o.rh || 0.075) / 2, yf: o.ry + (o.rh || 0.075), hz: o.hzTarget || null }; }
function expectHz(sid, hid) { const o = (J.stages[sid].objects || []).find(x => x && x.hazardId === hid); if (!o) return null; return { x: o.cx != null ? o.cx : o.rx + (o.rw || 0) / 2, y: o.cy != null ? o.cy : o.ry + (o.rh || 0) / 2 }; }

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2500);
  const pl = await ev(p, `(function(){var P=window.__BD_PLACEMENT;return P?JSON.stringify({savedAt:P.savedAt,stages:Object.keys(P.stages)}):'none';})()`);
  ok(/savedAt/.test(pl) && /210/.test(pl), '웹판에 배치 데이터(0071) 존재', pl);
  await ev(p, `document.getElementById('bd-title-start').click()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (await ev(p, `(function(){var m=document.getElementById('bd-startsetup-modal');return !!(m&&m.classList.contains('show'));})()`) === true) break; }
  await ev(p, `(function(){try{BD_pickStartChar(1);BD_confirmStartSetup();}catch(e){}})()`);
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await ev(p, `(function(){try{return currentStage;}catch(e){return null;}})()`); if (s && s !== 1) break; }
  await p.waitForTimeout(1500);
  await ev(p, `(function(){['bd_dami_awake','bd_tut2_done','bd_dami_tutorial_done','bd_battle_tutorial_done','bd_shop_tutorial_done_v75','bd_map_tuto_done'].forEach(function(k){localStorage.setItem(k,'1')});fadeToStage(212,0.5,0.55,200);})()`); await p.waitForTimeout(2500);
  for (const sid of [213, 211, 210]) { await ev(p, `fadeToStage(${sid},0.5,0.5,200)`); await p.waitForTimeout(2200); }
  await ev(p, `fadeToStage(212,0.5,0.55,200)`); await p.waitForTimeout(2200);
  const rt = await ev(p, `(function(){var out={};[210,211,212,213].forEach(function(sid){var st=STAGES[sid];out[sid]={npc:{},hz:{}};(st.objects||[]).forEach(function(o){if(!o)return;if(o.resident&&o._editorId){out[sid].npc[o._editorId]={x:o.rx+(o.rw||0.05)/2,yc:o.ry+(o.rh||0.075)/2,yf:o.ry+(o.rh||0.075),hz:o.hzTarget||null};}if(o.hazardId&&!o.isBoss){out[sid].hz[o.hazardId]={x:o.rx+(o.rw||0)/2,y:o.ry+(o.rh||0)/2};}});});return JSON.stringify(out);})()`);
  const R = JSON.parse(rt);
  const near = (a, b, t) => Math.abs(a - b) <= t;
  /* 0099 주민(중심 x·y) */
  for (const [sid, eid] of [['211', 'bdlink_ow_npc_haneul'], ['210', 'bdlink_ow_npc_eunji_mother'], ['210', 'bdlink_ow_npc_doyun'], ['212', 'bdlink_ow_npc_parkguard'], ['213', 'bdlink_ow_npc_sunim'], ['213', 'bdlink_ow_npc_seoyeon']]) {
    const e = expect(sid, eid), r = R[sid] && R[sid].npc[eid];
    ok(!!(e && r) && near(e.x, r.x, 0.006) && near(e.yc, r.yc, 0.03), '주민 위치 = 에디터 ' + eid, r ? `runtime ${r.x.toFixed(3)},${r.yc.toFixed(3)} vs json ${e.x.toFixed(3)},${e.yc.toFixed(3)}` : 'missing');
  }
  /* 0104 친구 3인(중심 x·발끝 y·스테이지) */
  for (const [sid, eid] of [['212', 'bdnpc_seah'], ['213', 'bdnpc_jaei'], ['211', 'bdnpc_jaehyun']]) {
    const e = expect(sid, eid), r = R[sid] && R[sid].npc[eid];
    ok(!!(e && r) && near(e.x, r.x, 0.006) && near(e.yf, r.yf, 0.006), '친구 위치 = 에디터 ' + eid, r ? `runtime ${r.x.toFixed(3)},${r.yf.toFixed(3)} vs json ${e.x.toFixed(3)},${e.yf.toFixed(3)}` : 'missing');
  }
  /* hzTarget 짝 유지 */
  const pairs = await ev(p, `(function(){var o={};[212,213,211,210].forEach(function(s){o[s]=BD_hzQuestMap(s).map(function(m){return m.npc+'→'+m.id});});return JSON.stringify(o);})()`);
  ok(/서연→ow213_bottle_1/.test(pairs) && /재현→ow211_graffiti_1/.test(pairs) && /은지 어머니→ow210_streetlight_1/.test(pairs) && /박 반장→ow212_smoke_1/.test(pairs), '부탁 짝(hzTarget) 유지', pairs.slice(0, 200));
  /* 위험요소 중심 = 저장본 cx,cy */
  for (const [sid, hid] of [['212', 'ow212_kickboard_1'], ['213', 'ow213_bottle_1'], ['213', 'ow213_glass_1'], ['211', 'ow211_noise_1'], ['210', 'ow210_crack_1']]) {
    const e = expectHz(sid, hid), r = R[sid] && R[sid].hz[hid];
    ok(!!(e && r) && near(e.x, r.x, 0.006) && near(e.y, r.y, 0.006), '위험요소 위치 = 에디터 ' + hid, r ? `runtime ${r.x.toFixed(3)},${r.y.toFixed(3)} vs json ${e.x.toFixed(3)},${e.y.toFixed(3)}` : 'missing');
  }
  /* (v400 1c) 상리 깨진 유리 — 왼쪽 벽에서 0.05 안쪽으로 옮긴 뒤 0174 클램프에 안 걸리고 발밑이 통행 가능한가 */
  await ev(p, `fadeToStage(213,0.5,0.5,200)`); await p.waitForTimeout(2600);
  const glass = await ev(p, `(function(){var o=(STAGES[213].objects||[]).find(function(x){return x&&x.hazardId==='ow213_glass_1'});if(!o)return 'none';var cx=o.rx+o.rw/2,fy=o.ry+o.rh;return JSON.stringify({cx:+cx.toFixed(3),rx:+o.rx.toFixed(3),sq:!!o.hzRectV147,foot:!!_collidesAt(cx,fy+0.01),side:!!_collidesAt(cx+0.04,fy+0.01)});})()`);
  ok(/"sq":true/.test(glass) && /"foot":false/.test(glass) && /"side":false/.test(glass) && Number((glass.match(/"rx":([0-9.]+)/)||[])[1]) > 0.02, '상리 깨진 유리 — 벽에서 떨어져 통행 가능(클램프 없음)', glass);
  await ev(p, `fadeToStage(212,0.5,0.55,200)`); await p.waitForTimeout(2200);
  /* 보스 위치 (최종장 시뮬레이션) */
  await ev(p, `(function(){var Q=window.QUESTS||window.BD_QUESTS;BD.questIdx=Q.findIndex(function(q){return q.id==='final'});try{BD_ensureQuestHazards();}catch(e){}})()`); await p.waitForTimeout(1500);
  const boss = await ev(p, `(function(){var b=(STAGES[212].objects||[]).find(function(o){return o&&o.isBoss});return b?JSON.stringify({x:b.rx+b.rw/2,y:b.ry+b.rh/2}):'none';})()`);
  const eb = expectHz('212', 'final_boss_1');
  ok(boss !== 'none' && eb && near(JSON.parse(boss).x, eb.x, 0.01) && near(JSON.parse(boss).y, eb.y, 0.01), '최종 보스 위치 = 에디터', boss + ' vs ' + JSON.stringify(eb));
  /* 대사는 코드 정본 유지 */
  const line = await ev(p, `(function(){var o=(STAGES[213].objects||[]).find(function(x){return x&&x.npcName==='사서 도현'});return o&&o.npcLines?o.npcLines[0]:'';})()`);
  ok(/지도를 채우러/.test(line), '대사는 코드 정본(사서 도현 지도 담당자 대사 유지)', line.slice(0, 40));
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.stack); process.exit(2); });
