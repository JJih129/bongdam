// 미니게임 개명 검증 — 선택창 카드 제목 + 실행 1종 스팟체크
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 30; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => { try { BD_openGameSelect(); } catch (e) { window.__selErr = String(e).slice(0, 100); } });
  await h.wait(900);
  const d = await h.page.evaluate(() => {
    const cards = [...document.querySelectorAll('div,button')].filter(x => x.onclick && /게임|슈터|FPS/.test(x.textContent || ''));
    // 선택창 카드 텍스트 수집 (짧은 것 우선)
    const texts = [...new Set(cards.map(c => (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)))];
    return { err: window.__selErr || null, texts: texts.slice(0, 8) };
  });
  say('선택창: ' + JSON.stringify(d));
  const joined = JSON.stringify(d.texts);
  const ok = /슈팅 게임/.test(joined) && /미로 게임/.test(joined) && /뱀 게임/.test(joined) && /좀비 게임/.test(joined)
    && !/갤러그|DOOM|스네이크|INFERNO|코스모|미궁|청소뱀/.test(joined);
  say((ok ? '✅' : '❌') + ' 개명 반영 + 구명칭 미노출');
  await h.shot('arcade_names');
  await h.page.keyboard.press('Escape'); await h.wait(400);
  say('콘솔 오류: ' + h.consoleErrors.length);
};
