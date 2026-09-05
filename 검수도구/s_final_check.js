// v288 최종 확인 — 약국류 F 모달 + 복합건물 라벨
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
  await wait(3500);
  await page.click('#bd-title-start', { timeout: 5000 });
  for (let t = 0; t < 20; t++) {
    await wait(700);
    const ok = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
    if (ok) break;
  }
  // 프롤로그 정상 완료 (독백·이동·대화·수여식) — 잔류 VN 오염 방지
  for (let i = 0; i < 4; i++) { await page.keyboard.press(' '); await wait(450); }
  await page.keyboard.down('a'); await wait(1500); await page.keyboard.up('a'); await wait(1300);
  await page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await wait(500);
  let talking = false;
  for (let t = 0; t < 10 && !talking; t++) {
    await page.keyboard.press('f'); await wait(700);
    talking = await page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); });
    if (!talking) { await page.keyboard.press(' '); await wait(400); }
  }
  for (let i = 0; i < 16; i++) { await page.keyboard.press(' '); await wait(500); }
  await wait(1800); await page.keyboard.press(' '); await wait(4000);
  for (let i = 0; i < 10; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(400); }

  const CASES = [
    { sid: 213, id: 'sangri_pharmacy' }, { sid: 213, id: 'bongdam_admin_pharmacy' },
    { sid: 211, id: 'donghwa_pharmacy' }, { sid: 210, id: 'tongtoon' },
    { sid: 210, id: 'uri_home_mart' }, { sid: 213, id: 'alpha_stationery' },
    { sid: 212, id: 'wawoo_complex' },
  ];
  let allOk = true;
  for (const c of CASES) {
    await page.evaluate((sid) => { if (Number(currentStage) !== sid) fadeToStage(sid, 0.5, 0.5, 50); }, c.sid);
    await wait(1300);
    // 잔여 모달·대화 정리
    await page.keyboard.press('Escape'); await wait(300);
    await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); });
    await wait(300);
    const r = await page.evaluate((cc) => {
      const st = STAGES[cc.sid];
      const lm = (st.__v24Landmarks || []).find(l => l && l.facilityId === cc.id);
      if (!lm) return { err: 'no-landmark' };
      heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.004; camX = heroX; camY = heroY;
      return { label: lm.label };
    }, c);
    await wait(400);
    await page.keyboard.press('f');
    await wait(900);
    const m = await page.evaluate(() => {
      const modal = document.querySelector('#bd-district-facility-modal.open');
      const shop = document.getElementById('shop-overlay');
      return {
        modal: modal ? (modal.textContent || '').replace(/\s+/g, ' ').slice(0, 60) : null,
        shopOpen: !!(shop && getComputedStyle(shop).display !== 'none' && shop.classList.contains('open')),
      };
    });
    const ok = !!m.modal;
    if (!ok) allOk = false;
    say((ok ? '✅' : '❌') + ' ' + c.id + ':', JSON.stringify(m).slice(0, 130));
    if (c.id === 'wawoo_complex') await shot('fc_complex');
    await page.keyboard.press('Escape'); await wait(400);
  }
  say('콘솔 오류:', consoleErrors.length);
  say(allOk ? '✅ 최종 확인 통과' : '❌ 실패 항목 있음');
};
