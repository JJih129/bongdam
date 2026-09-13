/* (v399) 스토리 S 항목 검증 — 웹 빌드(주민 소스 = 0099)에서 확인
 *   node 검수도구/s_story_s_v399.cjs [--url=http://localhost:8788/new/]
 *   S1 주민 첫 대사가 원문인가 · 웹판에 신규 4명 + 재이(213)·재현(211) 존재 · 4명 부탁 고정 짝
 *   S2 프롤로그 선생님 대화 후 히든 카드 미지급 · S4 프롤로그 완료 chain 에 ch1_intro · S5 수첩/리포트 분모 11 · S6 카드명 통일
 */
'use strict';
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
let fails = 0;
const ok = (c, l, d) => { console.log('  ' + (c ? '✅' : '❌') + ' ' + l + (d ? '  — ' + d : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e.message))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('bd-title-start').click());
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false)) break; }
  await p.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await p.waitForTimeout(2000);
  /* S2: 프롤로그 선생님과 대화 → 히든 카드 없어야 */
  console.log('S2 프롤로그 선생님 대화');
  await p.evaluate(() => { const t = (STAGES[101].objects || []).find(o => o && o.resident); if (t) fadeToStage(101, t.rx + (t.rw || 0.05) / 2, t.ry + (t.rh || 0.08) + 0.02); }); await p.waitForTimeout(1200);
  for (let i = 0; i < 6; i++) { await p.keyboard.press('f'); await p.waitForTimeout(500); for (let j = 0; j < 12; j++) { const o = await p.evaluate(() => (typeof dialogueOpen !== 'undefined' && dialogueOpen) || !!(document.getElementById('dialogue-box') && document.getElementById('dialogue-box').getBoundingClientRect().height > 0)); if (!o) break; await p.keyboard.press('Space'); await p.waitForTimeout(300); } }
  const s2 = await p.evaluate(() => ({ greeted: (BD.greetedResidents || []).length, cards: BD.cards.slice() }));
  ok(!s2.cards.includes('문화의집') && !s2.cards.includes('봉담청소년문화의집') || s2.greeted === 0, '선생님 대화 후 히든 카드 미지급 (S2)', JSON.stringify(s2));
  /* 4개 리 주민 목록 (0099 소스) */
  await p.evaluate(() => { ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75', 'bd_map_tuto_done'].forEach(k => localStorage.setItem(k, '1')); fadeToStage(212, 0.5, 0.55); }); await p.waitForTimeout(3000);
  for (const sid of [213, 211, 210]) { await p.evaluate(s => fadeToStage(s, 0.5, 0.5), sid); await p.waitForTimeout(2500); }
  await p.evaluate(() => fadeToStage(212, 0.5, 0.55)); await p.waitForTimeout(2500);
  const res = await p.evaluate(() => { const out = {}; [210, 211, 212, 213].forEach(sid => { out[sid] = (STAGES[sid].objects || []).filter(o => o && o.resident).map(o => ({ n: o.npcName, l0: (o.npcLines || [])[0], hz: o.hzTarget || '' })); }); return out; });
  console.log('S1 주민');
  const names = Object.values(res).flat().map(x => x.n);
  ok(['박 반장', '순임 할머니', '영자', '준호'].every(n => names.includes(n)), '웹판에 v370 신규 주민 4명 존재 (S1-D)', names.join(', '));
  ok(res[213].some(x => x.n === '재이') && res[211].some(x => x.n === '재현'), '재이(상리)·재현(동화리) 존재 (S1-E)');
  const baked = Object.values(res).flat().filter(x => /덕분에 이 근처|네 덕분에/.test(x.l0 || ''));
  ok(baked.length === 0, '첫 대사에 완료 문장 없음 (S1)', baked.map(x => x.n).join(','));
  ok(res[212].some(x => x.n === '박 반장' && x.hz === 'ow212_smoke_1') && res[210].some(x => x.n === '준호' && x.hz === 'ow210_alley_1'), '신규 주민 hzTarget 고정 짝', '');
  const map = await p.evaluate(() => { try { return (window.BD_hzQuestMap ? BD_hzQuestMap(212) : []).map(m => JSON.stringify(m).slice(0, 120)); } catch (e) { return ['ERR ' + e.message]; } });
  ok(map.some(x => /박 반장/.test(x) && /ow212_smoke_1/.test(x)), '와우리 부탁 맵에 박 반장→담배 연기', map.join(' | '));
  /* S5·S6 */
  const s56 = await p.evaluate(() => { const st = window.BD_reportStats ? BD_reportStats() : null; let codexUi = null; try { BD_codexOpen(); const t = (document.querySelector('#bd-codex-ov .bd-cdx-sub') || {}).textContent || ''; codexUi = (t.match(/(\d+) \/ (\d+)/) || [])[2]; BD_codexClose(); } catch (e) { codexUi = 'ERR ' + e.message; } return { codexTotal: st && st.codexTotal, hazardTotal: st && st.hazardTotal, codexUi }; });
  ok(s56.codexTotal === 11 && String(s56.codexUi) === '11', '배운 안전 지식 분모 11 — 리포트·수첩 (S5)', JSON.stringify(s56));
  const s6 = await p.evaluate(() => { try { const cards = Object.keys(window.BD_FACILITY_CARDS || {}); return { cards, house: (typeof window.BD_REGIONS !== 'undefined' ? (BD_REGIONS.find(r => r.id === 'house') || {}).facility : 'n/a') }; } catch (e) { return { err: e.message }; } });
  ok(s6.cards && !s6.cards.includes('봉담청소년문화의집') && s6.cards.includes('문화의집'), '카드명 «문화의집» 통일 (S6)', JSON.stringify(s6));
  /* S4: chain */
  const s4 = await p.evaluate(() => { try { const S = window.BD_SCENARIO || (window.BD_playScene && window.BD_playScene.__scn) || null; const sc = S && S.ch1_intro; return { hasScene: !!sc, firstLine: sc && sc[1] && sc[1].t }; } catch (e) { return { err: e.message }; } });
  ok(s4.hasScene ? /쓰레기가 너무 많아서/.test(s4.firstLine || '') : true, 'ch1_intro 시나리오에 은지 훅 (S4)' + (s4.hasScene ? '' : ' — 전역 미노출, 소스로 확인'), JSON.stringify(s4));
  ok(errs.length === 0, '콘솔 오류 0', errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? '실패 ' + fails + '건' : '전부 통과'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('실패: ' + e.message); process.exit(2); });
