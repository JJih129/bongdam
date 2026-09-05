// 라운드 8 검증 — 프롤로그/필드/전투 스포트라이트 + 히어로 최상위 렌더
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
  // 프롤로그 step0 스포트라이트 (독백 소화 후)
  for (let i = 0; i < 4; i++) { await page.keyboard.press(' '); await wait(450); }
  await wait(1200);
  const sp0 = await page.evaluate(() => { const d = document.getElementById('bd-spot2'); return d ? d.style.display : null; });
  say('프롤로그 step0 스포트라이트:', sp0);
  await shot('r8_01_prologue_spot0');
  // 걷기 → step1 (선생님 강조)
  await page.keyboard.down('a'); await wait(1500); await page.keyboard.up('a'); await wait(1600);
  await page.keyboard.press(' '); await wait(800);
  const sp1 = await page.evaluate(() => { const d = document.getElementById('bd-spot2'); return { disp: d ? d.style.display : null, step: window.__bdTut2Step }; });
  say('step1 스포트라이트:', JSON.stringify(sp1));
  await shot('r8_02_prologue_spot1');
  // 프롤로그 완주
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
  await page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await wait(3000);
  for (let i = 0; i < 12; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(400); }
  // 필드 메인 튜토 — 오프닝 종료 → 튜토 시작 대기 → 스포트라이트 확인
  let running = false;
  for (let t = 0; t < 60 && !running; t++) {
    await wait(800);
    running = await page.evaluate(() => !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()));
  }
  say('메인 튜토 시작:', running);
  let fieldSpot = null;
  for (let t = 0; t < 20 && !fieldSpot; t++) {
    await wait(500);
    fieldSpot = await page.evaluate(() => {
      const h = document.getElementById('bd-spot-hole');
      if (h && getComputedStyle(h).display !== 'none') {
        const r = h.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      }
      return null;
    });
    if (fieldSpot) await shot('r8_03_field_spot');
  }
  say('필드 튜토 스포트라이트:', JSON.stringify(fieldSpot));
  if (!fieldSpot) await shot('r8_03_field_spot');
  // 히어로 최상위 — 건물 위에 겹쳐 세우기 (와우약국 지붕 아래쪽)
  const heroTop = await page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l && l.facilityId === 'wawoo_pharmacy');
    heroX = Number(lm.rx) + Number(lm.rw) / 2; heroY = Number(lm.ry) + Number(lm.rh) * 0.55;
    camX = heroX; camY = heroY;
    return { stash: !!window.__bdHeroDraw, wrapped: !!(window.BD_drawNpcQuestMarks && window.BD_drawNpcQuestMarks.__v293top) };
  });
  await wait(900);
  say('히어로 최상위:', JSON.stringify(heroTop));
  await shot('r8_04_hero_on_top');
  say('콘솔 오류:', consoleErrors.length);
  const pass = sp0 === 'block' && sp1.disp === 'block' && fieldSpot && heroTop.stash && heroTop.wrapped;
  say(pass ? '✅ 라운드 8 검증 통과' : '⚠ 항목 확인 필요');
};
