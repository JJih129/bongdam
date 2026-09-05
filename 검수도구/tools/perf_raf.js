// 프레임/타이머 콜백 인벤토리: 무엇이 매 프레임·매 초 돌고 CPU를 얼마나 쓰는가 (5초 창)
'use strict';
const path = require('path'), { spawnSync } = require('child_process');
const QA = path.resolve(__dirname, '..');
const env = { ...process.env, BDD_PORT: process.env.BDD_PORT || '47814', SHOTS_DIR: 'shots_perf' };
const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: (r.stdout || '') + (r.stderr || '') }; } };
const SEC = Number(process.env.SEC || 5);
const show = (title, rows, sec) => { console.log(`== ${title} (${sec}s) ==`); rows.forEach(r => console.log(String(r.n).padStart(6) + 'x ' + String(r.ms).padStart(8) + 'ms  ' + r.k)); };
(async () => {
  bd('quit');
  bd('initjs', 'file=' + path.join(__dirname, 'spy_init.js'));
  const scene = async (tag, prep) => {
    prep && prep();
    bd('eval', 'js=' + '__rafSpy.reset();__rafSpy.on=true;1');
    bd('adv', 'ms=' + SEC * 1000);
    const r = bd('eval', 'js=' + '__rafSpy.on=false;__rafSpy.report(14)');
    const o = r.out || {}; console.log(`\n##### ${tag}  총 CPU: RAF ${o.total && o.total.raf}ms · interval ${o.total && o.total.iv}ms · timeout ${o.total && o.total.to}ms  (창 ${SEC}s = ${SEC * 1000}ms)`);
    show('RAF', o.raf || [], SEC); show('setInterval', o.iv || [], SEC); show('setTimeout', (o.to || []).slice(0, 6), SEC);
  };
  await scene('title');
  bd('boot', 'skip=1', 'to=212', 'x=0.5', 'y=0.5'); bd('advance', 'max=20');
  await scene('field 212 idle');
  bd('throttle', 'rate=6');
  await scene('field 212 idle @CPU x6');
  bd('throttle', 'rate=1');
  bd('quit');
})();
