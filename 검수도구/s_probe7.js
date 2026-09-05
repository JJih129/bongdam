// 버스 모달 뒤 유령 프레임 정체 확인
module.exports = async function ({ page, say, wait }) {
  await wait(3500);
  await page.click('#bd-title-start', { timeout: 5000 });
  for (let t = 0; t < 20; t++) {
    await wait(700);
    const ok = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
    if (ok) break;
  }
  await page.evaluate(() => { window.BD_Bus && BD_Bus.open('bus_wawoo_main'); });
  await wait(900);
  const r = await page.evaluate(() => {
    // 유령 프레임 위치(약 x=390,y=258 좌상단 꺾쇠)와 파란 행(x=430,y=333)
    const pts = [[392, 258], [430, 333], [880, 545]];
    return pts.map(p => {
      const els = document.elementsFromPoint(p[0], p[1]).slice(0, 5).map(e => ({
        id: e.id || null, cls: (e.className || '').toString().slice(0, 40), tag: e.tagName,
        op: getComputedStyle(e).opacity, vis: getComputedStyle(e).visibility,
      }));
      return { pt: p, els };
    });
  });
  say(JSON.stringify(r, null, 1));
};
