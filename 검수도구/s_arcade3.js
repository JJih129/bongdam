// 주민 우선 규칙 적용 후에도 PC존·노래방이 «주민이 없을 때는» 정상 동작하는지
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); });
  await h.wait(500);
  const check = async (nm, x, y) => {
    await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [x, y]);
    await h.wait(700);
    await h.page.keyboard.press('f'); await h.wait(1200);
    const st = await h.page.evaluate(() => ({ sel: !!window.__bdSelectOpen, song: !!window.__bdSongSelOpen, name: (() => { const e = document.getElementById('dialogue-name'); return e && e.getBoundingClientRect().height > 2 ? e.textContent.trim() : null; })() }));
    say(`${nm} (${x},${y}) → 게임선택=${st.sel} 노래선택=${st.song} 대화=${st.name}`);
    await h.page.keyboard.press('Escape'); await h.wait(600);
    for (let k = 0; k < 12; k++) { const b = await L.blocked(); if (!b.b) break; await h.page.keyboard.press('Space'); await h.wait(250); }
    return st;
  };
  // 주민이 없는 PC존 자리 (밴드부에서 떨어진 곳)
  const a = await check('PC존(주민 없음)', 0.515, 0.660);
  const b = await check('노래방(주민 없음)', 0.680, 0.845);
  say((a.sel ? '✅' : '❌') + ' PC존 정상 / ' + (b.song ? '✅' : '❌') + ' 노래방 정상');
};
