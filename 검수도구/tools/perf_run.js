// 장면별 성능 계측: 데몬(:47814)을 띄워 title/필드/이동/전투/지도 를 perf 로 잰다.  BDD_HEADED=1 로 실브라우저 비교.
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const QA = path.resolve(__dirname, '..');
const env = { ...process.env, BDD_PORT: process.env.BDD_PORT || '47814', SHOTS_DIR: 'shots_perf' };
const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: (r.stdout || '') + (r.stderr || '') }; } };
const fmt = (tag, p) => p && p.frameMs ? console.log(`${tag.padEnd(14)} fps ${String(p.fps).padStart(5)}  p50 ${String(p.frameMs.p50).padStart(5)}ms  p95 ${String(p.frameMs.p95).padStart(6)}ms  max ${String(p.frameMs.max).padStart(6)}ms  >33ms ${p.over33ms}/${p.frames}  longtask ${p.longTasks.n}(${p.longTasks.totalMs}ms, max ${p.longTasks.max})  heap ${p.mem ? p.mem.usedMB + 'MB' : '-'}  dom ${p.dom} cv ${p.canvases}`) : console.log(tag, JSON.stringify(p).slice(0, 200));
const P = (a) => { const r = bd('perf', 'sec=' + (a || 5)); return r.out || r; };
(async () => {
  bd('quit');
  console.log('mode:', process.env.BDD_HEADED ? 'HEADED' : 'headless', 'viewport', env.VW || 1280, 'x', env.VH || 800);
  const st = bd('status'); if (!st.ok) { console.log(st); process.exit(1); }
  fmt('title', P(4));
  bd('boot', 'drain=0');
  fmt('prologue 101', P(5));
  bd('press', 'key=w', 'n=1'); // no-op
  bd('tp', 'stage=212', 'x=0.5', 'y=0.5'); bd('advance', 'max=20');
  fmt('field 212 idle', P(5));
  // 이동 중 계측: 키를 누른 채로 잰다 (hold 는 명령이 끝나야 하므로 별도 프로세스 없이 keydown 지속 → eval 로 keydown 이벤트 발사)
  bd('eval', 'js=' + 'window.__perfKD=setInterval(()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"a",code:"KeyA",bubbles:true})),50);1');
  fmt('field 212 move', P(5));
  bd('eval', 'js=' + 'clearInterval(window.__perfKD);document.dispatchEvent(new KeyboardEvent("keyup",{key:"a",code:"KeyA",bubbles:true}));1');
  bd('press', 'key=m'); bd('adv', 'ms=800');
  fmt('map open', P(4));
  bd('press', 'key=Escape'); bd('adv', 'ms=500');
  const hz = bd('hazard', 'q=쓰레기', 'walk=0', 'confirm=1');
  if (hz.out && hz.out.after === 'battle') { bd('adv', 'ms=1500'); fmt('battle', P(5)); bd('battle'); }
  else console.log('battle: 진입 실패', JSON.stringify(hz.out && { gate: hz.out.gate, after: hz.out.after }));
  fmt('field after', P(4));
  bd('quit');
})();
