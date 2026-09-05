// 일반 플레이: ESC → 일시정지(루프 정지+모달) → 계속하기 → 재개 / ESC 토글 재개
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

  const snap = async (tag) => {
    const s = await h.page.evaluate(() => ({
      raf: !!window.__gameLoopChainAlive,
      pause: (() => { const m = document.getElementById('bd-pause-modal'); return m ? m.classList.contains('show') : false; })(),
    }));
    say(`[${tag}] raf=${s.raf} pauseModal=${s.pause}`);
    return s;
  };
  const canMove = async () => {
    const p0 = await h.page.evaluate(() => [heroX, heroY]);
    await h.hold('d', 350);
    const p1 = await h.page.evaluate(() => [heroX, heroY]);
    return Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.002;
  };

  await snap('기준');
  say('▶ ESC (일시정지 열기)');
  await h.page.keyboard.press('Escape'); await h.wait(900);
  const p1 = await snap('일시정지');
  await h.shot('pz_01_paused');
  const frozen = !(await canMove());
  say('일시정지 중 이동 차단=' + frozen + (frozen ? ' ✅' : ' ❌'));

  say('▶ 계속하기 클릭');
  await h.page.evaluate(() => { const b = [...document.querySelectorAll('#bd-pause-modal button')].find(x => /계속하기/.test(x.textContent || '')); if (b) b.click(); });
  await h.wait(900);
  const p2 = await snap('재개');
  say('재개 후 이동=' + await canMove());

  say('▶ ESC 두 번 (열고 → ESC로 닫기 토글)');
  await h.page.keyboard.press('Escape'); await h.wait(700);
  await snap('열림2');
  await h.page.keyboard.press('Escape'); await h.wait(900);
  const p3 = await snap('토글닫기');
  say('토글 닫기 후 이동=' + await canMove());
  const ok = p1.pause && !p1.raf && p2.raf && !p2.pause && p3.raf && !p3.pause;
  say(ok ? '✅ 일시정지 개폐·루프 재개 모두 정상' : '❌ 어긋남');
};
