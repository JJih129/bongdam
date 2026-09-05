// Claude Code PostToolUse 훅: D:\봉담\src\** 편집 시 자동으로 bundle → 빌드 HTML 동기화
// stdin: {tool_name, tool_input:{file_path}} ; stdout: JSON systemMessage
'use strict';
const path = require('path'), { execFileSync } = require('child_process');
let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  if (process.env.BD_HOOK_DEBUG) { try { require('fs').appendFileSync(path.join(__dirname, '..', 'hook_debug.log'), new Date().toISOString() + ' ' + input.slice(0, 600) + '\n'); } catch (e) { } }
  let fp = '';
  try { const j = JSON.parse((input || '{}').replace(/^﻿/, '')); fp = (j.tool_input && j.tool_input.file_path) || (j.tool_response && j.tool_response.filePath) || ''; } catch (e) { }
  const logf = path.join(__dirname, '..', 'hook_debug.log');
  const dlog = s => { try { require('fs').appendFileSync(logf, new Date().toISOString() + ' ' + s + '\n'); } catch (e) { } };
  // 경로 인코딩(한글)에 무관하게 판정: <…>/src/(blocks|assets|shell.html|manifest.json)
  if (!/[\\/]src[\\/](blocks[\\/]|assets[\\/]|shell\.html$|manifest\.json$)/i.test(fp || '')) { dlog('skip ' + (fp || '(no path)')); return; }   // src 밖이면 무시
  dlog('run  ' + fp);
  const OUT = 'D:/봉담/봉담지킴이_게시용_v338_final.html';
  try {
    const t0 = Date.now();
    const r = execFileSync(process.execPath, [path.join(__dirname, 'bundle.js'), 'D:/봉담/src', OUT], { encoding: 'utf8', timeout: 60000 });
    const sha = (r.match(/sha1 ([0-9a-f]{8})/) || [])[1] || '';
    console.log(JSON.stringify({ systemMessage: `🔧 src 변경 → bundle 완료 (${Date.now() - t0}ms, sha1 ${sha}…). 배치 데이터를 바꿨다면 restamp, 데몬은 bd.js reload.` }));
  } catch (e) {
    try { require('fs').appendFileSync(path.join(__dirname, '..', 'hook_debug.log'), new Date().toISOString() + ' BUNDLE FAIL ' + String(e.message || e).slice(0, 400) + '\n'); } catch (e2) { }
    console.log(JSON.stringify({ systemMessage: '❌ bundle 실패: ' + String(e.message || e).slice(0, 300), decision: 'block', reason: 'bundle 실패 — src 편집이 빌드에 반영되지 않았습니다 (검수도구/hook_debug.log 참조)' }));
  }
});
