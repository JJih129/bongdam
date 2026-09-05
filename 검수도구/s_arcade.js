// PC존 아케이드 선택창이 열리고 «확실히 닫히는가»
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); });
  await h.wait(600);

  const snap = async () => await h.page.evaluate(() => {
    const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none') return false; const r = e.getBoundingClientRect(); return r.width > 60 && r.height > 30; };
    return {
      sel: on(document.getElementById('bd-gamesel')),
      selOpen: !!window.__bdSelectOpen,
      arcade: !!window.__bdArcadeOpen,
      pcGame: !!window.__bdComputerGameActive,
      blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
      hero: [heroX, heroY],
    };
  });

  say('▶ 선택창 직접 열기');
  await h.page.evaluate(() => { try { window.BD_openGameSelect(); } catch (e) { } });
  await h.wait(900);
  say('  열린 뒤: ' + JSON.stringify(await snap()));
  await h.shot('ar_01_open');

  say('▶ ESC 로 닫기');
  await h.page.keyboard.press('Escape');
  await h.wait(900);
  const afterEsc = await snap();
  say('  ESC 후: ' + JSON.stringify(afterEsc));

  // 이동 복구 확인
  const p0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.hold('s', 400); await h.hold('d', 400);
  const p1 = await h.page.evaluate(() => [heroX, heroY]);
  say('  이동 복구=' + (Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.002));
  await h.shot('ar_02_after_esc');

  say('▶ 「그만두기」 버튼으로 닫기');
  await h.page.evaluate(() => { try { window.BD_openGameSelect(); } catch (e) { } });
  await h.wait(900);
  const clicked = await h.page.evaluate(() => {
    const ov = document.getElementById('bd-gamesel');
    if (!ov) return 'no-ov';
    const b = [...ov.querySelectorAll('button')].find(x => /그만두기/.test(x.textContent || ''));
    if (!b) return 'no-btn'; b.click(); return 'clicked';
  });
  await h.wait(900);
  say('  버튼(' + clicked + ') 후: ' + JSON.stringify(await snap()));
  const q0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.hold('a', 400); await h.hold('w', 400);
  const q1 = await h.page.evaluate(() => [heroX, heroY]);
  say('  이동 복구=' + (Math.abs(q1[0] - q0[0]) + Math.abs(q1[1] - q0[1]) > 0.002));

  say('▶ 갤러그 실행 → ESC 로 빠져나오기');
  await h.page.evaluate(() => { try { window.BD_openGameSelect(); } catch (e) { } });
  await h.wait(700);
  await h.page.keyboard.press('1');
  await h.wait(2500);
  say('  갤러그 실행 후: ' + JSON.stringify(await snap()));
  await h.shot('ar_03_galaga');
  for (let i = 0; i < 4; i++) { await h.page.keyboard.press('Escape'); await h.wait(700); }
  const afterGame = await snap();
  say('  ESC 후: ' + JSON.stringify(afterGame));
  const r0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.hold('s', 400); await h.hold('a', 400);
  const r1 = await h.page.evaluate(() => [heroX, heroY]);
  say('  이동 복구=' + (Math.abs(r1[0] - r0[0]) + Math.abs(r1[1] - r0[1]) > 0.002));
  await h.shot('ar_04_after_game');
};
