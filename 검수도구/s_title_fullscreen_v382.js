// v382 회귀 검증: 저장된 담이/저체력 상태가 타이틀로 새지 않고 전체화면 복귀 UX가 준비되는지 확인
module.exports = async (h) => {
  const { page, say } = h;

  await page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1');
    localStorage.setItem('bd_tut2_done', '1');
  });
  await page.reload({ waitUntil: 'load', timeout: 180000 });
  await h.wait(3200);

  const directShow = await page.evaluate(() => {
    try { if (window.BD_syncHP) window.BD_syncHP(10, false); } catch (e) { }
    try {
      if (!window.BD_DAMI) return 'no-dami';
      BD_DAMI.mount();
      BD_DAMI.setVisible(true);
      return BD_DAMI.show('체력이 절반 아래로 떨어졌어요!', { face: 'worry', forceAwake: true });
    } catch (e) { return 'error:' + e.message; }
  });
  await h.wait(1600); // 저체력 안내의 900ms 주기도 함께 통과

  const titleState = await page.evaluate(() => {
    const title = document.getElementById('bd-title-screen');
    const hud = document.getElementById('bd-dami-hud');
    const bubble = document.getElementById('bd-dami-bubble');
    const toast = document.getElementById('bd-toast');
    const offer = document.getElementById('bd-fullscreen-return');
    return {
      titleVisible: !!(title && getComputedStyle(title).display !== 'none' && title.offsetHeight > 0),
      gameplayVisible: !!(window.BD_DAMI && BD_DAMI.isGameplayVisible && BD_DAMI.isGameplayVisible()),
      hudVisible: !!(hud && getComputedStyle(hud).display !== 'none' && getComputedStyle(hud).visibility !== 'hidden' && hud.offsetHeight > 0),
      bubbleVisible: !!(bubble && bubble.classList.contains('on') && getComputedStyle(bubble).visibility !== 'hidden'),
      lowHpToastVisible: !!(toast && toast.classList.contains('show') && /체력|쉬어/.test(toast.textContent || '')),
      restOverride: !!(window.__bdNavOverride && window.__bdNavOverride.__rest),
      fullscreenApi: typeof window.BD_requestFullscreen === 'function' && typeof window.BD_toggleFullscreen === 'function',
      fullscreenOfferVisible: !!(offer && getComputedStyle(offer).display !== 'none'),
    };
  });
  say('타이틀 상태: ' + JSON.stringify({ directShow, ...titleState }));

  let fullscreen = { supported: false, entered: false, escapedInHeadless: false, restoreVisible: false };
  fullscreen.supported = await page.evaluate(() => !!document.documentElement.requestFullscreen);
  if (fullscreen.supported && titleState.fullscreenOfferVisible) {
    await page.click('#bd-fullscreen-return');
    await h.wait(500);
    fullscreen.entered = await page.evaluate(() => !!document.fullscreenElement);
    if (fullscreen.entered) {
      await page.keyboard.press('Escape');
      await h.wait(500);
      fullscreen.escapedInHeadless = await page.evaluate(() => !document.fullscreenElement);
      // Chromium headless는 실제 브라우저와 달리 Escape로 Fullscreen API를 해제하지 않을 수 있다.
      // 이 경우 API 이탈로 같은 fullscreenchange 복귀 경로를 검증한다.
      if (!fullscreen.escapedInHeadless) {
        await page.evaluate(() => document.fullscreenElement && document.exitFullscreen());
        await h.wait(500);
      }
      fullscreen.restoreVisible = await page.evaluate(() => {
        const b = document.getElementById('bd-fullscreen-return');
        return !!(b && getComputedStyle(b).display !== 'none' && /돌아가기/.test(b.textContent || ''));
      });
    }
  }
  say('전체화면 상태: ' + JSON.stringify(fullscreen));

  const gameplayShow = await page.evaluate(() => {
    try {
      if (window.BD_syncHP) window.BD_syncHP(100, false);
      if (window.BD_hideTitle) window.BD_hideTitle();
      const game = document.getElementById('game-screen');
      if (game) game.style.display = 'block';
      if (window.BD_DAMI && BD_DAMI.wake) BD_DAMI.wake();
      if (window.BD_DAMI) BD_DAMI.setVisible(true);
      return !!(window.BD_DAMI && BD_DAMI.show('게임 화면 담이 표시 검증', { face: 'base', forceAwake: true, instant: true }));
    } catch (e) { return false; }
  });
  await h.wait(350);
  const gameplayState = await page.evaluate(() => {
    const hud = document.getElementById('bd-dami-hud');
    const bubble = document.getElementById('bd-dami-bubble');
    return {
      gameplayVisible: !!(window.BD_DAMI && BD_DAMI.isGameplayVisible && BD_DAMI.isGameplayVisible()),
      hudVisible: !!(hud && getComputedStyle(hud).display !== 'none' && getComputedStyle(hud).visibility !== 'hidden' && hud.offsetHeight > 0),
      bubbleVisible: !!(bubble && bubble.classList.contains('on') && getComputedStyle(bubble).visibility !== 'hidden'),
    };
  });
  say('게임 화면 상태: ' + JSON.stringify({ gameplayShow, ...gameplayState }));

  // 새 게임 초반의 forceAwake 스토리 대사는 게임 화면에서 계속 보여야 한다.
  await page.evaluate(() => {
    localStorage.removeItem('bd_dami_awake');
    localStorage.removeItem('bd_tut2_done');
  });
  await page.reload({ waitUntil: 'load', timeout: 180000 });
  await h.wait(2600);
  const forceAwakeShow = await page.evaluate(() => {
    try {
      if (window.BD_hideTitle) window.BD_hideTitle();
      const game = document.getElementById('game-screen');
      if (game) game.style.display = 'block';
      return !!(window.BD_DAMI && BD_DAMI.show('새 게임 스토리 담이 표시 검증', {
        face: 'base', forceAwake: true, channel: 'story', instant: true
      }));
    } catch (e) { return false; }
  });
  await h.wait(400);
  const forceAwakeVisible = await page.evaluate(() => {
    const hud = document.getElementById('bd-dami-hud');
    const bubble = document.getElementById('bd-dami-bubble');
    return !!(hud && bubble && getComputedStyle(hud).display !== 'none' && hud.offsetHeight > 0
      && bubble.classList.contains('on') && getComputedStyle(bubble).visibility !== 'hidden');
  });
  say('새 게임 스토리 상태: ' + JSON.stringify({ forceAwakeShow, forceAwakeVisible }));

  const titlePass = titleState.titleVisible && !titleState.gameplayVisible && directShow === false
    && !titleState.hudVisible && !titleState.bubbleVisible && !titleState.lowHpToastVisible && !titleState.restOverride;
  const fullscreenPass = titleState.fullscreenApi && titleState.fullscreenOfferVisible
    && (!fullscreen.supported || (fullscreen.entered && fullscreen.restoreVisible));
  const gameplayPass = gameplayShow && gameplayState.gameplayVisible && gameplayState.hudVisible && gameplayState.bubbleVisible;
  const forceAwakePass = forceAwakeShow && forceAwakeVisible;
  say(titlePass && fullscreenPass && gameplayPass && forceAwakePass ? '✅ v382 회귀 검증 통과' : '❌ v382 회귀 확인 필요');
};
