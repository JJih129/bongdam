// 각 장 체크포인트에서 «이어하기» 후 완주까지 — 진행 막힘(loop/unreachable/input-blocked) 전용 테스트
// 사용: node tools/resume_runs.js [ch2_start ch3_start ch4_start ...]
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const QA = path.resolve(__dirname, '..');
const env = { ...process.env, BDD_PORT: process.env.BDD_PORT || '47817', SHOTS_DIR: 'shots_resume' };
const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: (r.stdout || '') + (r.stderr || '') }; } };
const snaps = process.argv.slice(2).length ? process.argv.slice(2) : ['ch2_start', 'ch3_start', 'ch4_start'];
const results = [];
for (const s of snaps) {
  const t0 = Date.now();
  bd('quit');
  const l = bd('load', 'name=' + s);
  if (!l.ok) { results.push({ s, ok: false, why: 'load 실패 ' + JSON.stringify(l).slice(0, 120) }); continue; }
  bd('adv', 'ms=7000');   // 부팅 후 화해(장 완료 개방) 대기
  let met = false, stuck = null, chunks = 0, last = null;
  while (chunks < 60) {
    const r = bd('until', 'js=!!(window.BD&&BD.gameCleared)', 'chunks=5', 'steps=4');
    chunks += 5;
    const o = r.out || {};
    last = o.probe && { stage: o.probe.stage, q: o.probe.quest && o.probe.quest.id, cur: o.probe.quest && o.probe.quest.cur, pur: (o.probe.purified || []).length, hero: o.probe.hero };
    if (o.met) { met = true; break; }
    if (o.stuck) { stuck = o.stuck; break; }
    if (Date.now() - t0 > 40 * 60000) { stuck = 'timeout-40m'; break; }
    console.log(`  … ${s} chunk${chunks} ${JSON.stringify(last)}`);
  }
  const min = ((Date.now() - t0) / 60000).toFixed(1);
  const err = bd('errors').out || {};
  console.log(`■ ${s}: ${met ? '✅ 완주' : '❌ ' + (stuck || 'chunks-exhausted')} ${min}분 last=${JSON.stringify(last)} 콘솔오류=${err.count}`);
  if (!met) { bd('shot', 'name=resume_fail_' + s); bd('save', 'name=stuck_' + s); }
  results.push({ s, ok: met, why: stuck, min, last });
}
bd('quit');
console.log('\n=== 요약 ===');
results.forEach(r => console.log(`${r.ok ? '✅' : '❌'} ${r.s} ${r.min || ''}분 ${r.why || ''}`));
process.exit(results.every(r => r.ok) ? 0 : 1);
