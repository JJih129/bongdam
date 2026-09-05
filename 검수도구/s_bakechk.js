// 213 어두운 산책로 런타임 좌표 확인
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
  await h.wait(3500);
  const r = await h.page.evaluate(() => {
    const list = (STAGES[213].objects || []).filter(o => o && o.label === '어두운 산책로');
    return list.map(o => ({ rx: o.rx, ry: o.ry, hz: o.hazardId, variant: o.hazardVariant }));
  });
  say('런타임 어두운 산책로: ' + JSON.stringify(r));
};
