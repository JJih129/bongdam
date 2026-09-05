// 타이틀 — 일반 시작하기 클릭 가능 + 시연 칩과 비겹침 확인
module.exports = async (h) => {
  const { say } = h;
  await h.wait(1500);
  const geo = await h.page.evaluate(() => {
    const s = document.getElementById('bd-title-start');
    const d = document.getElementById('bd-title-demo');
    const r1 = s ? s.getBoundingClientRect() : null;
    const r2 = d ? d.getBoundingClientRect() : null;
    const overlap = r1 && r2 && !(r1.right < r2.left || r2.right < r1.left || r1.bottom < r2.top || r2.bottom < r1.top);
    return { start: r1 && [Math.round(r1.x), Math.round(r1.y), Math.round(r1.width), Math.round(r1.height)], demo: r2 && [Math.round(r2.x), Math.round(r2.y), Math.round(r2.width), Math.round(r2.height)], overlap };
  });
  say('기하: ' + JSON.stringify(geo));
  await h.click('#bd-title-start');
  let started = false;
  for (let t = 0; t < 20 && !started; t++) {
    await h.wait(400);
    started = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && c.offsetWidth > 40); });
  }
  say('일반 시작 진입: ' + started + ' · demo flag: ' + await h.page.evaluate(() => localStorage.getItem('bd_demo_mode')));
  say(!geo.overlap && started ? '✅ 타이틀 검증 통과' : '❌ 확인 필요');
};
