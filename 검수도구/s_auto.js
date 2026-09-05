const fs = require('fs');
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;

  say('▶ 시작하기');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) {
    const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); });
    if (v) break; await h.wait(200);
  }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);

  const res = await A.run(Number(process.env.STEPS || 150));
  say('RESULT: ' + JSON.stringify({ ok: res.ok, step: res.step, reason: res.reason }));
  await h.shot('99_final');
  const p = await A.probe();
  say('FINAL: ' + JSON.stringify({ stage: p.stage, name: p.stageName, quest: p.quest, purified: p.purified, hp: p.hp }));
  fs.writeFileSync(require('path').join(h.SHOTS, '_script.txt'), A.script.map(x => `(${x.stage}) ${x.t}`).join('\n'), 'utf8');
};
