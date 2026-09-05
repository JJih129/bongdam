// v367b 검증: 프롤로그 일시정지에 구조요청 숨김, questIdx>0에서는 표시
module.exports = async (h) => {
  const { say } = h;
  await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) {
    const st = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    });
    if (!st && t > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  const check = () => h.page.evaluate(() => {
    const m = document.getElementById('bd-pause-modal');
    if (!m || !m.classList.contains('show')) return 'closed';
    const b = [...m.querySelectorAll('button')].find(x => /구조 요청/.test(x.textContent || ''));
    return b && b.style.display !== 'none' ? 'visible' : 'hidden';
  });
  await h.page.keyboard.press('Escape'); await h.wait(400);
  say('프롤로그(q=0) 구조요청: ' + await check());   // 기대: hidden
  await h.shot('pause_prologue');
  await h.page.keyboard.press('Escape'); await h.wait(400);
  await h.page.evaluate(() => { BD.questIdx = 1; });
  await h.page.keyboard.press('Escape'); await h.wait(400);
  say('월드(q=1) 구조요청: ' + await check());       // 기대: visible
  say('콘솔 오류: ' + h.consoleErrors.length);
};
