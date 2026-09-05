// 라운드 4 검증 — F 대상 하이라이트·미방문 시설 유도·반경 축소·아이템 사용
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
  // 프롤로그 완주 (반경 축소 후에도 선생님 F 정상?)
  for (let i = 0; i < 4; i++) { await page.keyboard.press(' '); await wait(450); }
  await page.keyboard.down('a'); await wait(1500); await page.keyboard.up('a'); await wait(1300);
  await page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await wait(600);
  await shot('r4_00_teacher_highlight');   // 선생님 하이라이트 확인용
  const hi1 = await page.evaluate(() => {
    const d = document.getElementById('bd-f-target');
    return d && d.style.display === 'block' ? document.getElementById('bd-f-target-tag').textContent : null;
  });
  say('선생님 하이라이트:', JSON.stringify(hi1));
  let talking = false;
  for (let t = 0; t < 10 && !talking; t++) {
    await page.keyboard.press('f'); await wait(700);
    talking = await page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); });
    if (!talking) { await page.keyboard.press(' '); await wait(400); }
  }
  say('선생님 대화(반경 축소 후):', talking);
  for (let i = 0; i < 16; i++) { await page.keyboard.press(' '); await wait(500); }
  await wait(1800); await page.keyboard.press(' '); await wait(4000);
  for (let i = 0; i < 10; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(400); }

  // 밖으로 (엘리베이터 존)
  await page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await wait(3000);
  for (let i = 0; i < 16; i++) { await page.evaluate(() => { const ov = document.getElementementById && null; const o2 = document.getElementById('dialogue-overlay'); if (o2) o2.click(); }); await wait(400); }
  const outside = await page.evaluate(() => Number(currentStage));
  say('야외 진출:', outside);

  // ── 은지 옆 하이라이트 + ❔ 마커 + 유도 화살표 ──
  await page.evaluate(() => { heroX = 0.41; heroY = 0.47; camX = heroX; camY = heroY; });
  await wait(1200);
  const hi2 = await page.evaluate(() => {
    const d = document.getElementById('bd-f-target');
    return { shown: d && d.style.display === 'block', tag: d ? document.getElementById('bd-f-target-tag').textContent : null };
  });
  say('은지 하이라이트:', JSON.stringify(hi2));
  await shot('r4_01_resident_highlight');

  // 약국 앞 하이라이트
  await page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l && l.facilityId === 'wawoo_pharmacy');
    heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.004; camX = heroX; camY = heroY;
  });
  await wait(1000);
  const hi3 = await page.evaluate(() => {
    const d = document.getElementById('bd-f-target');
    return { shown: d && d.style.display === 'block', tag: d ? document.getElementById('bd-f-target-tag').textContent : null };
  });
  say('약국 하이라이트:', JSON.stringify(hi3));
  await shot('r4_02_facility_highlight');

  // 유도: 안내 없는 상태에서 __bdNavOverride가 미방문 시설로
  await wait(2500);
  const nav = await page.evaluate(() => window.__bdNavOverride ? { label: window.__bdNavOverride.label, mapNav: !!window.__bdNavOverride.__mapNav } : null);
  say('시설 유도 화살표:', JSON.stringify(nav));
  await shot('r4_03_nav_and_marks');

  // 멀리서 하이라이트 꺼지는지 (반경 축소 체감)
  await page.evaluate(() => { heroX = 0.5; heroY = 0.6; camX = heroX; camY = heroY; });
  await wait(600);
  const hi4 = await page.evaluate(() => { const d = document.getElementById('bd-f-target'); return d ? d.style.display : null; });
  say('빈 곳 하이라이트 없음:', hi4 === 'none' ? '✅' : '❌ ' + hi4);

  // 아이템: 편의점 소모품 + 운동화 사용 버튼
  const itemChk = await page.evaluate(() => {
    // 삼각김밥·운동화 강제 지급
    const rice = ITEM_POOL.find(i => i.id === 'rice_ball');
    const boots = ITEM_POOL.find(i => i.id === 'boots');
    addToInventory(rice, 2); addToInventory(boots, 1);
    BD.items.snack = 1;
    return new Promise(res => setTimeout(() => {
      openInventory();
      const out = { entries: Object.keys(playerInventory) };
      // 운동화 상세 → 사용 버튼 노출?
      selectedInvItemId = 'boots';
      try { showInvDetail(playerInventory.boots.item); } catch (e) { out.err = String(e); }
      out.bootsUseBtn = (document.getElementById('inv-use-btn') || {}).style ? document.getElementById('inv-use-btn').style.display : null;
      // 삼각김밥 사용
      heroHP = 60; selectedInvItemId = 'rice_ball';
      try { useSelectedItem(); } catch (e) { out.useErr = String(e); }
      out.hpAfterRice = heroHP;
      res(out);
    }, 1500));
  });
  say('아이템 확인:', JSON.stringify(itemChk));
  await shot('r4_04_inventory');
  say('콘솔 오류:', consoleErrors.length);
};
