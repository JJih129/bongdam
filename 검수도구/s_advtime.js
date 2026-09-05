// advanceTime(ms) 가 실제로 프레임을 진행시키는지 (스킬 규격 결정성 훅)
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance(); await h.wait(600);

  const run = async (label) => {
    await h.page.evaluate(() => { heroX = 0.70; heroY = 0.30; camX = heroX; camY = heroY; });
    await h.wait(400);
    const before = await h.page.evaluate(() => [heroX, heroY]);
    await h.page.keyboard.down('a');
    const steps = await h.page.evaluate(() => window.advanceTime(500));   // 30프레임
    await h.page.keyboard.up('a');
    const after = await h.page.evaluate(() => [heroX, heroY]);
    const moved = Math.abs(after[0] - before[0]) + Math.abs(after[1] - before[1]);
    say(`${label}: steps=${steps} before=${before.map(n => n.toFixed(4))} after=${after.map(n => n.toFixed(4))} 이동량=${moved.toFixed(5)}`);
    return moved;
  };
  const m1 = await run('1회차');
  const m2 = await run('2회차');
  const m3 = await run('3회차');
  const same = Math.abs(m1 - m2) < 1e-6 && Math.abs(m2 - m3) < 1e-6;
  say((m1 > 0 ? '✅ advanceTime 이 실제로 프레임을 진행시킵니다' : '❌ advanceTime 이 아무것도 진행시키지 않습니다')
    + ' / ' + (same ? '✅ 3회 모두 동일 (결정적)' : '⚠ 회차별 편차 있음'));
  // 게임이 계속 돌아가는지 (체인이 끊기지 않았는지)
  const p0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.page.keyboard.down('d'); await h.wait(600); await h.page.keyboard.up('d');
  const p1 = await h.page.evaluate(() => [heroX, heroY]);
  say('advanceTime 이후 실시간 이동 정상=' + (Math.abs(p1[0] - p0[0]) > 0.001));
};
