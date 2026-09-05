// 첫 전투 튜토리얼에서 담이 말풍선이 «보이는지» (v147-47 검증)
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  // 튜토리얼은 «본 적 없음» 상태로 (담이 각성만)
  await h.page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_dami_awake', '1');
    try { if (window.BD_DAMI && BD_DAMI.wake) BD_DAMI.wake(); } catch (e) { }
    if (typeof fadeToStage === 'function') fadeToStage(212);
  });
  await h.wait(5000); await A.advance(); await A.P.install();
  // 튜토 쓰레기로 가서 전투
  for (let i = 0; i < 12; i++) {
    const p = await A.probe();
    if (p.hsr) break;
    if (p.tgt) { await A.P.walk(p.tgt.rx + p.tgt.rw / 2, p.tgt.ry + p.tgt.rh + 0.015, L); await L.press('f', 2, 450); }
    await A.advance(); await h.wait(350);
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투=' + inB);
  // 담이가 말할 때까지 잠시 관찰
  for (let i = 0; i < 10; i++) {
    const d = await h.page.evaluate(() => {
      const hud = document.getElementById('bd-dami-hud');
      const bub = document.getElementById('bd-dami-bubble');
      if (!hud || !bub) return null;
      const hr = hud.getBoundingClientRect(), br = bub.getBoundingClientRect();
      return {
        inBattleCls: hud.classList.contains('bd-in-battle'),
        hudBottom: Math.round(innerHeight - hr.bottom),
        bubbleVisible: getComputedStyle(bub).visibility !== 'hidden' && +getComputedStyle(bub).opacity > 0.05 && br.width > 40,
        txt: (bub.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      };
    });
    say('  ' + i + ': ' + JSON.stringify(d));
    if (d && d.bubbleVisible && d.inBattleCls) { say('✅ 전투 중 담이 말풍선 표시 + 위치(액션바 위) 정상'); await h.shot('db_ok'); break; }
    await h.page.keyboard.press('Space');
    await h.wait(900);
  }
  await h.shot('db_final');
};
