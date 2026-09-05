// v355 모바일 HUD 자동 배율 검증 (TOUCH=1 + 좁은 뷰포트로 실행)
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
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
  await h.wait(3000);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  const d = await h.page.evaluate(() => ({
    touch: document.documentElement.classList.contains('bd-touch-mode'),
    w: window.innerWidth,
    menu: (document.getElementById('bd-menu-btns') || { style: {} }).style.zoom,
    quest: (document.getElementById('bd-quest-hud') || { style: {} }).style.zoom,
    dami: (document.getElementById('bd-dami-hud') || { style: {} }).style.zoom,
    setting: localStorage.getItem('bd_ui_scale_v353') || 'auto',
  }));
  say('상태: ' + JSON.stringify(d));
  const expect = d.w <= 420 ? '1.45' : d.w <= 600 ? '1.35' : d.w <= 900 ? '1.2' : '';
  const ok = d.touch && d.menu === expect && d.dami === (expect ? String(Math.min(parseFloat(expect), 1.15)) : '');
  say((ok ? '✅' : '❌') + ` 모바일 HUD 배율 (기대 ${expect || '1(무적용)'})`);
  await h.shot('mob_hud');
  // 수동 배율 선택 시 개입 중단
  await h.page.evaluate(() => { BD_setUiScale('100'); });
  await h.wait(2600);
  const d2 = await h.page.evaluate(() => (document.getElementById('bd-menu-btns') || { style: {} }).style.zoom);
  say((d2 === '' ? '✅' : '❌') + ' 수동 100% 선택 시 HUD 개입 해제 (zoom="' + d2 + '")');
  await h.page.evaluate(() => { BD_setUiScale('auto'); });
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
