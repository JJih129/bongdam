// 60fps 상한 검증: gameLoop 호출/초 + 2초 보행 이동거리 (구/신 빌드 × 헤드리스60Hz/헤디드144Hz)
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const QA = path.resolve(__dirname, '..');
const run = (label, url, headed) => {
  const env = { ...process.env, BDD_PORT: '47815', BDD_URL: url, SHOTS_DIR: 'shots_perf' }; if (headed) env.BDD_HEADED = '1'; else delete env.BDD_HEADED;
  const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: (r.stdout || '') + (r.stderr || '') }; } };
  bd('quit');
  bd('initjs', 'file=' + path.join(__dirname, 'spy_init.js'));
  bd('boot', 'skip=1', 'to=212', 'x=0.30', 'y=0.50'); bd('advance', 'max=20');
  bd('eval', 'js=' + '__rafSpy.reset();__rafSpy.on=true;1');
  const p0 = bd('eval', 'js=' + '[heroX,heroY]').out;
  bd('eval', 'js=' + 'window.__kd=setInterval(()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"d",code:"KeyD",bubbles:true})),40);1');
  bd('adv', 'ms=2000');
  bd('eval', 'js=' + 'clearInterval(window.__kd);document.dispatchEvent(new KeyboardEvent("keyup",{key:"d",code:"KeyD",bubbles:true}));1');
  const p1 = bd('eval', 'js=' + '[heroX,heroY]').out;
  const rep = bd('eval', 'js=' + '__rafSpy.on=false;__rafSpy.report(6)').out || {};
  const gl = (rep.raf || []).find(r => /gameLoop/.test(r.k)) || {}; const anyRaf = (rep.raf || [])[0] || {};
  const perf = bd('perf', 'sec=2').out || {};
  console.log(`${label.padEnd(26)} rafFps ${String(perf.fps).padStart(5)}  gameLoop/2s ${String(gl.n).padStart(4)} (${gl.ms}ms)  topRAF ${anyRaf.n}x  이동dx ${(p1 && p0) ? (p1[0] - p0[0]).toFixed(4) : '?'}`);
  bd('quit');
};
const NEW = 'file:///D:/봉담/봉담지킴이_게시용_v338_final.html';
const OLD = 'file:///' + (process.env.TEMP || '').replace(/\\/g, '/') + '/bd_old.html';
run('OLD headless(60Hz)', OLD, false);
run('NEW headless(60Hz)', NEW, false);
run('OLD headed(144Hz)', OLD, true);
run('NEW headed(144Hz)', NEW, true);
