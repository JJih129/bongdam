// 이동 불가 원인 + 도현 부탁 매칭 확인 (v280 원본과 비교용)
module.exports = async function ({ page, say, wait, shot }) {
  await wait(3000);
  await page.click('#bd-title-start', { timeout: 5000 });
  let inGame = false;
  for (let t = 0; t < 25 && !inGame; t++) {
    await wait(800);
    inGame = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
  }
  await page.evaluate(() => { fadeToStage(213, 0.370, 0.646, 100); });
  await wait(1600);

  const d1 = await page.evaluate(() => ({
    pos: [heroX.toFixed(3), heroY.toFixed(3)],
    collideHere: (typeof _collidesAt === 'function') ? !!_collidesAt(heroX, heroY) : null,
    inputBlocked: (typeof window.BD_isInputBlocked === 'function') ? window.BD_isInputBlocked() : null,
    pairs213: (window.BD_hzQuestMap ? BD_hzQuestMap(213) : []),
    alley: (() => { const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_alley_1'); return o ? { rx: +o.rx.toFixed(3), ry: +o.ry.toFixed(3), opt: !!o.bdOptional } : null; })(),
  }));
  say('상태:', JSON.stringify(d1));

  // 빈 칸으로 순간이동 후 이동 재시도
  await page.evaluate(() => { heroX = 0.37; heroY = 0.55; camX = heroX; camY = heroY; });
  await wait(300);
  await page.keyboard.down('w'); await wait(1500); await page.keyboard.up('w');
  const d2 = await page.evaluate(() => [heroX.toFixed(3), heroY.toFixed(3)]);
  say('텔레포트(0.37,0.55) 후 W:', JSON.stringify(d2));
  await page.keyboard.down('s'); await wait(1000); await page.keyboard.up('s');
  const d3 = await page.evaluate(() => [heroX.toFixed(3), heroY.toFixed(3)]);
  say('S 후:', JSON.stringify(d3));
  await shot('probe4');
};
