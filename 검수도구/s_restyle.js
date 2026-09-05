// 라운드 7 — UI 리스킨 스크린샷 배터리
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
  await wait(3500);
  await page.click('#bd-title-start', { timeout: 5000 });
  for (let t = 0; t < 20; t++) {
    await wait(700);
    const ok = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) return true;
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
    if (ok) break;
  }
  await shot('ui_01_charselect');
  await page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); const b = m && m.querySelector('button'); if (b) b.click(); });
  await wait(2500);
  await shot('ui_02_vn_dialog');
  // 프롤로그 속행
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
  await wait(1800); await page.keyboard.press(' '); await wait(3500);
  await page.keyboard.press('e'); await wait(900); await shot('ui_03_bag'); await page.keyboard.press('Escape'); await wait(500);
  await page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await wait(3000);
  for (let i = 0; i < 12; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(400); }
  await shot('ui_04_field_hud');
  await page.keyboard.press('m'); await wait(900); await shot('ui_05_map'); await page.keyboard.press('Escape'); await wait(400);
  // 버스 모달
  await page.evaluate(() => { window.BD_Bus && BD_Bus.open('bus_wawoo_main'); });
  await wait(800); await shot('ui_06_bus'); await page.keyboard.press('Escape'); await wait(400);
  // 시설 모달
  await page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l && l.facilityId === 'wawoo_pharmacy');
    heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.004; camX = heroX; camY = heroY;
  });
  await wait(600); await page.keyboard.press('f'); await wait(900); await shot('ui_07_facility'); await page.keyboard.press('Escape'); await wait(400);
  // 전투 (튜토 스킵)
  await page.evaluate(() => {
    localStorage.setItem('bd_dami_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY;
  });
  await wait(700);
  await page.keyboard.press('f'); await wait(1100);
  await page.keyboard.press('f'); await wait(1100);
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); });
    await wait(600);
    const quiz = await page.evaluate(() => !!document.querySelector('#bd-safety-choice'));
    if (quiz) break;
  }
  await shot('ui_08_quiz');
  await page.evaluate(() => { const b = document.querySelector('#bd-safety-choice button[data-ok="1"]'); if (b) b.click(); });
  await wait(3800);
  await shot('ui_09_battle');
  say('콘솔 오류:', consoleErrors.length);
};
