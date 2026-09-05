// 단계 5 검증 — 업적 탭 복구·달성 토스트
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
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
  say('게임 진입:', inGame);

  // 가방 열고 업적 탭
  const r = await page.evaluate(() => {
    const out = {};
    try {
      const tab = [...document.querySelectorAll('.inv-tab')].find(b => /업적/.test(b.textContent || ''));
      out.tabExists = !!tab;
      if (typeof openInventory === 'function') openInventory();
      else document.getElementById('bag-overlay') && (document.getElementById('bag-overlay').style.display = 'block');
      if (tab) tab.click();
      const panel = document.getElementById('inv-achieve-panel');
      out.panelVisible = !!(panel && panel.style.display !== 'none');
      out.panelText = panel ? (panel.textContent || '').slice(0, 80) : null;
      out.achieveCount = panel ? (panel.textContent.match(/걷기|대시|구매|회복/g) || []).length : 0;
    } catch (e) { out.err = String(e); }
    return out;
  });
  say('업적 탭:', JSON.stringify(r));
  await shot('s5_achieve');

  // 달성 토스트 — 첫 발걸음 업적 강제 발동
  const t2 = await page.evaluate(() => {
    return new Promise(res => {
      try {
        if (typeof achieveTrack === 'function') achieveTrack('walk', 1);
        setTimeout(() => {
          const toasts = [...document.querySelectorAll('div')].filter(d => /업적 달성/.test(d.textContent || '') && d.children.length === 0);
          res({ toast: toasts.length > 0, sample: toasts[0] ? toasts[0].textContent.slice(0, 60) : null });
        }, 1200);
      } catch (e) { res({ err: String(e) }); }
    });
  });
  say('달성 토스트:', JSON.stringify(t2));
  say('콘솔 오류:', consoleErrors.length);
  const pass = r.tabExists && r.panelVisible && t2.toast;
  say(pass ? '✅ 단계 5 검증 통과' : '⚠ 단계 5 부분 확인 (로그 참조)');
};
