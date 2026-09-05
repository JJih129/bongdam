// v359 담이 말풍선 크기 검증 — 화면 점유율 측정 + 육안
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2200);
  for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => {
    try { BD_DAMI.show('제 지도는 M 키나, 저를 누르면 언제든 볼 수 있어요. 위험을 정화하고 시설을 방문할수록 칸이 채워져요. 오늘도 같이 다녀요!', { face: 'idle' }); } catch (e) { }
  });
  await h.wait(1200);
  const d = await h.page.evaluate(() => {
    const hud = document.getElementById('bd-dami-hud');
    const bb = document.getElementById('bd-dami-bubble');
    if (!hud || !bb) return null;
    const rh = hud.getBoundingClientRect(), rb = bb.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    return {
      scale: getComputedStyle(hud).transform.slice(0, 24),
      bubble: [Math.round(rb.width), Math.round(rb.height)],
      pctW: +(rb.width / vw * 100).toFixed(1), pctH: +(rb.height / vh * 100).toFixed(1),
      area: +((rb.width * rb.height) / (vw * vh) * 100).toFixed(1),
    };
  });
  say('말풍선: ' + JSON.stringify(d));
  const ok = d && d.pctW <= 42 && d.area <= 8;
  say((ok ? '✅' : '❌') + ' 화면 점유 완화 (폭≤42%·면적≤8%)');
  await h.shot('dami_small');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
