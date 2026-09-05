module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h);
  say('▶ 시작하기 → 캐릭터 선택에서 ESC');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.wait(500);
  await h.page.keyboard.press('Escape');
  await h.wait(2500);
  const st = await h.page.evaluate(() => ({
    title: (() => { const e = document.getElementById('bd-title-screen'); return e ? (e.classList.contains('show') + '/' + getComputedStyle(e).display) : '-'; })(),
    gs: (() => { const e = document.getElementById('game-screen'); return e ? getComputedStyle(e).display : '-'; })(),
    setup: (() => { const e = document.getElementById('bd-startsetup-modal'); return e ? e.className : '-'; })(),
  }));
  say('ESC 후: ' + JSON.stringify(st));
  await h.shot('esc_01_after');
  // 다시 시작할 수 있는가
  const again = await h.page.evaluate(() => { const b = document.getElementById('bd-title-start'); if (!b) return 'no-btn'; b.click(); return 'clicked'; });
  await h.wait(2500);
  const vis = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); });
  say('다시 시작하기(' + again + ') → 캐릭터 선택 표시=' + vis);
  await h.shot('esc_02_restart');
};
