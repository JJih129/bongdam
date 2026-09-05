// 211 상단 자유 지점 존재 여부 (신규 배치 후)
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(3000);
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); BD.questIdx = 3; fadeToStage(211, 0.45, 0.75); });
  await h.wait(2000);
  const grid = await h.page.evaluate(() => {
    const rows = {};
    for (const y of [0.20, 0.22, 0.25, 0.30, 0.35]) {
      let free = [];
      for (let x = 0.12; x <= 0.85; x += 0.05) {
        try { if (!_collidesAt(x, y) && !_collidesAt(x + 0.05, y)) free.push(+x.toFixed(2)); } catch (e) { }
      }
      rows[y] = free;
    }
    return rows;
  });
  Object.keys(grid).forEach(y => say('y=' + y + ' 자유 x: ' + JSON.stringify(grid[y])));
};
