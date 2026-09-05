// 213 어두운 산책로 ry=0.4 변조자 추적
module.exports = async (h) => {
  const { say } = h;
  await h.page.addInitScript(() => {
    window.__ryLog = [];
    const stk = () => String(new Error().stack).split('\n').slice(2, 6).map(s => s.trim().replace(/file:\/\/\/[^\s)]*html/, 'html')).join(' | ').slice(0, 320);
    const iv = setInterval(() => {
      try {
        if (typeof STAGES === 'undefined' || !STAGES[213]) return;
        const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_alley_1');
        if (!o) return;
        clearInterval(iv);
        window.__ryLog.push({ init: o.ry });
        let cur = o.ry;
        Object.defineProperty(o, 'ry', {
          get() { return cur; },
          set(v) { window.__ryLog.push({ set: v, stack: stk() }); cur = v; },
          configurable: true,
        });
      } catch (e) { }
    }, 100);
  });
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
  await h.wait(4000);
  const log = await h.page.evaluate(() => window.__ryLog || null).catch(() => 'nav');
  say('ry 로그: ' + JSON.stringify(log, null, 1).slice(0, 1600));
};
