// 주요 화면 시각 점검 — 스크린샷으로 UI 겹침·깨짐 확인
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  const SH = 'v_';

  await h.shot(SH + '01_title');
  say('▶ 시작하기');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.wait(500); await h.shot(SH + '02_charselect');
  await h.page.evaluate(() => { try { window.BD_pickStartChar(2); } catch (e) { } });
  await h.wait(300); await h.shot(SH + '03_char_male');
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(2500);
  await h.shot(SH + '04_prologue_dialog');

  // 프롤로그 진행
  await A.advance();
  await h.wait(600);
  await h.shot(SH + '05_field_101');

  // UI 패널들
  const panels = [['e', '06_bag'], ['j', '07_quest'], ['i', '08_inven']];
  for (const [k, n] of panels) {
    await h.page.keyboard.press(k); await h.wait(900);
    await h.shot(SH + n);
    await h.page.keyboard.press('Escape'); await h.wait(600);
  }
  // 버튼 패널
  for (const [sel, n] of [['#bd-codex-btn', '09_codex'], ['#bd-mb-equip', '10_equip'], ['#bd-mb-card', '11_placecard'], ['#bd-mb-map', '12_safetymap']]) {
    try {
      await h.page.click(sel, { timeout: 2500 }); await h.wait(1100);
      await h.shot(SH + n);
      const closed = await h.page.evaluate(() => {
        const m = [...document.querySelectorAll('.bd-modal.show')].pop();
        if (!m) return 'none';
        const b = [...m.querySelectorAll('button')].find(x => /닫기|확인|✕/.test(x.textContent || ''));
        if (b) { b.click(); return 'btn'; } m.classList.remove('show'); return 'forced';
      });
      say('  ' + n + ' 닫기=' + closed);
      await h.wait(600);
    } catch (e) { say('  ' + n + ' 실패: ' + String(e).slice(0, 60)); }
  }
  // 설정 / 일시정지
  try { await h.page.keyboard.press('Escape'); await h.wait(900); await h.shot(SH + '13_pause'); await h.page.keyboard.press('Escape'); await h.wait(500); } catch (e) { }

  // 전투 진입 — 튜토 쓰레기
  say('▶ 전투 화면 확인');
  await A.P.install();
  for (let i = 0; i < 25; i++) {
    const p = await A.probe();
    if (p.hsr) break;
    if (p.stage === 101) { await A.advance(); const t = await A.probe(); if (t.tgt) await A.P.walk(t.tgt.rx + t.tgt.rw / 2, t.tgt.ry + t.tgt.rh + 0.015, L); await L.press('f', 2, 400); continue; }
    if (p.tgt) { await A.P.walk(p.tgt.rx + p.tgt.rw / 2, p.tgt.ry + p.tgt.rh + 0.015, L); await L.press('f', 2, 450); }
    else await A.advance();
    await h.wait(400);
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('battle=' + inB);
  if (inB) {
    await h.wait(1500); await h.shot(SH + '14_battle');
    for (let i = 0; i < 8; i++) {
      const b = await A.battleInfo();
      if (!b) break;
      if (b.mg.length) { await h.shot(SH + '15_minigame'); break; }
      if (b.state === 'player') await h.page.evaluate(() => { const x = [...document.querySelectorAll('.hsr-act')].find(e => getComputedStyle(e).display !== 'none'); if (x) x.click(); });
      await h.wait(700);
    }
    await h.shot(SH + '16_battle_mid');
  }
  say('done');
};
