// 구조 지점 (0.216,0.336) 이동 판정 — 충돌 vs 잠금
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
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.216, 0.336);
  });
  await h.wait(2000);
  for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const col = await h.page.evaluate(() => {
    const out = {};
    try {
      out.here = _collidesAt(0.216, 0.336);
      out.E1 = _collidesAt(0.226, 0.336); out.E2 = _collidesAt(0.24, 0.336);
      out.W = _collidesAt(0.2, 0.336); out.N = _collidesAt(0.216, 0.31); out.S = _collidesAt(0.216, 0.36);
    } catch (e) { out.err = String(e).slice(0, 60); }
    return out;
  });
  say('충돌 맵: ' + JSON.stringify(col));
  const p0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.page.evaluate(() => { moveKeys.d = true; });
  await h.wait(500);
  await h.page.evaluate(() => { moveKeys.d = false; });
  const p1 = await h.page.evaluate(() => [heroX, heroY]);
  say('직접 d: ' + JSON.stringify(p0) + ' → ' + JSON.stringify(p1) + ' Δ=' + (p1[0] - p0[0]).toFixed(4));
  // 서쪽으로도
  await h.page.evaluate(() => { moveKeys.a = true; });
  await h.wait(500);
  await h.page.evaluate(() => { moveKeys.a = false; });
  const p2 = await h.page.evaluate(() => [heroX, heroY]);
  say('직접 a: Δ=' + (p2[0] - p1[0]).toFixed(4));
};
