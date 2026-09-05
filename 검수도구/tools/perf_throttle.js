// 저사양 에뮬레이션 + 누수 검사: CPU 스로틀 rate 별 필드/이동/전투 fps, 전투 3회 반복 후 DOM/힙 추이
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const QA = path.resolve(__dirname, '..');
const env = { ...process.env, BDD_PORT: process.env.BDD_PORT || '47814', SHOTS_DIR: 'shots_perf' };
const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: (r.stdout || '') + (r.stderr || '') }; } };
const P = (s) => { const r = bd('perf', 'sec=' + s); return r.out || r; };
const line = (tag, p) => console.log(`${tag.padEnd(22)} fps ${String(p.fps).padStart(5)}  p50 ${String(p.frameMs.p50).padStart(5)}  p95 ${String(p.frameMs.p95).padStart(6)}  max ${String(p.frameMs.max).padStart(6)}  >33ms ${p.over33ms}/${p.frames}  LT ${p.longTasks.n}/${p.longTasks.totalMs}ms  heap ${p.mem && p.mem.usedMB}MB dom ${p.dom}`);
(async () => {
  bd('quit');
  console.log('mode:', process.env.BDD_HEADED ? 'HEADED' : 'headless');
  bd('boot', 'skip=1', 'to=212', 'x=0.5', 'y=0.5');
  bd('advance', 'max=20');
  for (const rate of [1, 4, 6]) {
    bd('throttle', 'rate=' + rate);
    bd('adv', 'ms=500');
    line(`x${rate} field idle`, P(4));
    bd('eval', 'js=' + 'window.__perfKD=setInterval(()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"d",code:"KeyD",bubbles:true})),50);1');
    line(`x${rate} field move`, P(4));
    bd('eval', 'js=' + 'clearInterval(window.__perfKD);document.dispatchEvent(new KeyboardEvent("keyup",{key:"d",code:"KeyD",bubbles:true}));1');
    bd('press', 'key=m'); bd('adv', 'ms=600'); line(`x${rate} map`, P(3)); bd('press', 'key=Escape'); bd('adv', 'ms=400');
  }
  bd('throttle', 'rate=4');
  // 전투 반복 누수 검사 (x4 상태에서 전투 fps 도 함께)
  const objs = (bd('objects').out || []).filter(o => o.hz && !o.pur).slice(0, 3);
  console.log('hazards:', objs.map(o => o.l).join(' / '));
  const base = P(2); console.log(`before battles: heap ${base.mem && base.mem.usedMB}MB dom ${base.dom}`);
  for (const o of objs) {
    const hz = bd('hazard', 'q=' + o.hz, 'walk=0', 'confirm=1');
    if (hz.out && hz.out.after === 'battle') { bd('adv', 'ms=1200'); line(`x4 battle(${o.l.slice(0, 6)})`, P(3)); bd('battle'); bd('advance', 'max=20'); }
    else console.log('  battle skip:', o.l, hz.out && (hz.out.gate || hz.out.after));
    const p = P(2); console.log(`  after ${o.l}: heap ${p.mem && p.mem.usedMB}MB dom ${p.dom} fps ${p.fps}`);
  }
  bd('throttle', 'rate=1');
  const fin = bd('eval', 'js=' + '({timers:(function(){let n=0;const id=setTimeout(()=>{},0);clearTimeout(id);return id})(), rafs:(function(){const id=requestAnimationFrame(()=>{});cancelAnimationFrame(id);return id})(), imgs:document.images.length, listeners:(window.getEventListeners?1:0)})');
  console.log('ids (누적 setTimeout id / rAF id):', JSON.stringify(fin.out));
  bd('quit');
})();
