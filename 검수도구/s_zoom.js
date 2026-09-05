module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSeup && 0; window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); });
  await h.wait(400);
  await h.shot('z_101');
  for (const sid of [212, 213]) {
    await h.page.evaluate(s => { if (typeof fadeToStage === 'function') fadeToStage(s); }, sid);
    await h.wait(4000); await A.advance();
    // 약국 앞으로 (건물 전체가 보이는지 확인)
    await h.page.evaluate((s) => { const o = (STAGES[s].objects || []).find(x => /약국/.test(x && x.label || '')); if (o) { heroX = o.rx + (o.rw || 0.1) / 2; heroY = o.ry + (o.rh || 0.05) + 0.03; camX = heroX; camY = heroY; } }, sid);
    await h.wait(1200);
    // 조작 방법 카드 등 닫기
    await h.page.keyboard.press('x'); await h.wait(500);
    await h.page.keyboard.press('Escape'); await h.wait(500);
    for (let k = 0; k < 10; k++) { const b = await L.blocked(); if (!b.b) break; await h.page.keyboard.press('Space'); await h.wait(250); }
    await h.wait(400);
    await h.shot('z_' + sid);
    const sc = await h.page.evaluate(() => ({ scale: window.BD_VIEW_SCALE && BD_VIEW_SCALE[currentStage], cur: typeof currentScale !== 'undefined' ? +currentScale.toFixed(3) : null }));
    say('[' + sid + '] ' + JSON.stringify(sc));
  }
  // 정리 확인
  const clean = await h.page.evaluate(() => {
    const vis = id => { const e = document.getElementById(id); if (!e) return 'no-el'; const r = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.height > 2 ? 'VISIBLE' : 'hidden'; };
    return { district: vis('bd-district-hud'), uitune: vis('bd-uitune-toggle') };
  });
  say('정리: ' + JSON.stringify(clean));
};
