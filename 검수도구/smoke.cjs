/* (v400) 스모크 스위트 — 핵심 검증 스크립트를 순서대로 돌리고 한 줄 요약
 *   node 검수도구/smoke.cjs [--url=http://localhost:8788/new/] [--only=a,b] [--skip=a,b]
 *   종료 코드 = 실패 스위트 수. 각 스위트의 마지막 줄(«전부 통과»/«실패 n건»)과 소요 시간을 모은다. */
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const only = opt('only', '').split(',').filter(Boolean), skip = opt('skip', '').split(',').filter(Boolean);
const SUITES = [
  { id: 'qa',        cmd: ['qa.cjs', 'all'],                        pass: /전부 통과/ },
  { id: 'story',     cmd: ['s_story_s_v399.cjs', '--url=' + URL],   pass: /전부 통과/ },
  { id: 'placement', cmd: ['s_placement_v400.cjs', '--url=' + URL], pass: /전부 통과/ },
  { id: 'wp5',       cmd: ['s_wp5_v399.cjs', '--url=' + URL],       pass: /전부 통과/ },
  { id: 'reviewfix', cmd: ['s_reviewfix_v399.cjs', '--url=' + URL], pass: /전부 통과/ },
  { id: 'batch6',    cmd: ['s_batch6_v399.cjs', '--url=' + URL],    pass: /전부 통과/ },
  { id: 'pcfix',     cmd: ['s_pcfix_v399.cjs'],                     pass: /전부 통과/ },
];
let fails = 0; const rows = []; const t0 = Date.now();
for (const s of SUITES) {
  if (only.length && !only.includes(s.id)) continue;
  if (skip.includes(s.id)) continue;
  const t = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, s.cmd[0]), ...s.cmd.slice(1)], { cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 15 * 60 * 1000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.trim().split('\n');
  const last = lines[lines.length - 1] || '';
  const failed = !s.pass.test(out) || r.status !== 0;
  const bad = lines.filter(l => /❌/.test(l)).map(l => l.trim().slice(0, 90));
  if (failed) fails++;
  const sec = ((Date.now() - t) / 1000).toFixed(0);
  rows.push((failed ? '❌' : '✅') + ' ' + s.id.padEnd(10) + ' ' + sec.padStart(4) + 's  ' + last.slice(0, 60) + (bad.length ? '\n     ' + bad.join('\n     ') : ''));
}
console.log(rows.join('\n'));
console.log((fails ? '스모크 실패 ' + fails + '개 스위트' : '스모크 전부 통과') + ' · ' + ((Date.now() - t0) / 60000).toFixed(1) + '분');
process.exit(fails);
