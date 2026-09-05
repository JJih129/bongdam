// 전투 미니게임(타이밍 링) 판정 검증 — 실제로 피해가 들어가는가
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_battle_tutorial_seen', '1'); if (typeof fadeToStage === 'function') fadeToStage(212); });
  await h.wait(5000); await A.advance();
  await A.P.install();
  // 튜토 쓰레기로 이동 후 전투
  for (let i = 0; i < 12; i++) {
    const p = await A.probe();
    if (p.hsr) break;
    if (p.tgt) { await A.P.walk(p.tgt.rx + p.tgt.rw / 2, p.tgt.ry + p.tgt.rh + 0.015, L); await L.press('f', 2, 450); }
    await A.advance(); await h.wait(400);
  }
  const t0 = Date.now();
  const ok = await A.doBattle(150);
  say('전투 결과: ' + (ok ? '✅ 종료' : '❌ 교착/타임아웃') + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + 's)');
  const pur = await h.page.evaluate(() => Object.keys((window.BD && BD.purified) || {}));
  say('정화 목록: ' + JSON.stringify(pur));
  await h.shot('bt_final');
};
