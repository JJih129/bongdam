module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); if (typeof fadeToStage === 'function') fadeToStage(212); });
  await h.wait(4500); await A.advance();

  // 함정 설치: __gameLoopChainAlive 와 state.enabled 의 쓰기 스택 기록
  await h.page.evaluate(() => {
    window.__trap = [];
    let chain = window.__gameLoopChainAlive;
    Object.defineProperty(window, '__gameLoopChainAlive', {
      get() { return chain; },
      set(v) {
        if (v !== chain) window.__trap.push('chain=' + v + ' @ ' + String(new Error().stack).split('\n').slice(1, 4).join(' | ').replace(/https?:\S+/g, m => m.slice(-26)));
        chain = v;
      },
      configurable: true,
    });
    const st = BongdamEditor.state;
    let en = st.enabled;
    Object.defineProperty(st, 'enabled', {
      get() { return en; },
      set(v) {
        if (v !== en) window.__trap.push('editor.enabled=' + v + ' @ ' + String(new Error().stack).split('\n').slice(1, 4).join(' | ').replace(/https?:\S+/g, m => m.slice(-26)));
        en = v;
      },
      configurable: true,
    });
  });

  say('▶ 에디터 열기');
  await h.page.evaluate(() => document.getElementById('bge-toggle').click());
  await h.wait(1500);
  say('▶ ESC');
  await h.page.keyboard.press('Escape');
  await h.wait(1500);
  const t = await h.page.evaluate(() => window.__trap);
  t.forEach(x => say('  ' + x));
  const fin = await h.page.evaluate(() => ({ edOn: BongdamEditor.state.enabled, raf: window.__gameLoopChainAlive }));
  say('최종: ' + JSON.stringify(fin));
};
