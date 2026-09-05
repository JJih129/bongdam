module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); heroX = 0.52; heroY = 0.72; camX = heroX; camY = heroY; });
  await h.wait(800);

  const probe4 = async (tag) => {
    const r = {};
    for (const [k, n] of [['w', '위'], ['s', '아래'], ['a', '왼쪽'], ['d', '오른쪽']]) {
      const p0 = await h.page.evaluate(() => [heroX, heroY]);
      await h.hold(k, 350);
      const p1 = await h.page.evaluate(() => [heroX, heroY]);
      r[n] = (Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1])) > 0.002;
    }
    const st = await h.page.evaluate(() => ({
      blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
      arcade: !!window.__bdArcadeOpen, sel: !!window.__bdSelectOpen, pc: !!window.__bdComputerGameActive,
      keys: (typeof moveKeys !== 'undefined') ? JSON.stringify(moveKeys) : '-',
      hero: [heroX.toFixed(3), heroY.toFixed(3)],
    }));
    say(`${tag}: 이동 ${JSON.stringify(r)} / ${JSON.stringify(st)}`);
    return Object.values(r).some(Boolean);
  };

  await probe4('기준(게임 실행 전)');
  say('▶ 갤러그 실행');
  await h.page.evaluate(() => { try { window.BD_openGameSelect(); } catch (e) { } });
  await h.wait(700);
  await h.page.keyboard.press('1');
  await h.wait(3000);
  await h.shot('ar2_galaga');
  say('▶ ESC 로 종료');
  await h.page.keyboard.press('Escape'); await h.wait(1500);
  const ok1 = await probe4('갤러그 종료 후');
  if (!ok1) { say('❌ 갤러그 종료 후 사방 이동 불가'); await h.shot('ar2_BAD'); }

  say('▶ 노래방 확인');
  const kara = await h.page.evaluate(() => typeof window.BD_openSongSelect === 'function' ? 'BD_openSongSelect' : Object.keys(window).filter(k => /song|karaoke|노래/i.test(k)).join(','));
  say('  노래방 API: ' + kara);
  if (kara === 'BD_openSongSelect') {
    await h.page.evaluate(() => { try { window.BD_openSongSelect(); } catch (e) { } });
    await h.wait(1200);
    await h.shot('ar2_song');
    const s = await h.page.evaluate(() => ({ blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()) }));
    say('  노래 선택창: ' + JSON.stringify(s));
    await h.page.keyboard.press('Escape'); await h.wait(1000);
    const ok2 = await probe4('노래방 닫은 후');
    if (!ok2) { say('❌ 노래방 닫은 후 이동 불가'); await h.shot('ar2_BAD_song'); }
  }
};
