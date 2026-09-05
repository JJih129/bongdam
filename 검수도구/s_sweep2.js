// 라운드 3 — 전체 플레이 스크린샷 스윕 (시설 모달 전수 + 전투 + 지도 + 지역 전환)
const fs = require('fs');
const path = require('path');
module.exports = async function (h) {
  const { page, say, shot, wait, consoleErrors } = h;
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const texts = [];
  const noteTexts = async (tag) => {
    const t = await page.evaluate(() => {
      const out = [];
      const vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) out.push('VN: ' + (vn.textContent || '').replace(/\s+/g, ' ').slice(0, 100));
      const dm = document.getElementById('bd-dami-text');
      if (dm && dm.textContent) out.push('담이: ' + dm.textContent.slice(0, 80));
      const modal = document.querySelector('#bd-district-facility-modal.open');
      if (modal) out.push('시설모달: ' + (modal.textContent || '').replace(/\s+/g, ' ').slice(0, 220));
      return out;
    });
    t.forEach(x => texts.push('[' + tag + '] ' + x));
  };

  await wait(3000);
  await page.click('#bd-title-start', { timeout: 5000 });
  let inGame = false;
  for (let t = 0; t < 25 && !inGame; t++) {
    await wait(700);
    inGame = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
  }

  // 프롤로그 완주 (실제 경로)
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
  for (let i = 0; i < 16; i++) { await page.keyboard.press(' '); await wait(550); }
  await wait(1800); await page.keyboard.press(' '); await wait(4000);
  await shot('sw_01_badge_done'); await noteTexts('수여후');

  // 가방(E) — 배지 확인 단계
  await page.keyboard.press('e'); await wait(900); await shot('sw_02_bag'); await noteTexts('가방');
  await page.keyboard.press('Escape'); await wait(700);

  // 엘리베이터로 밖으로
  await page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await wait(2500);
  const outNow = await page.evaluate(() => Number(currentStage));
  say('밖 진출:', outNow);
  await wait(3500); await shot('sw_03_outside_opening'); await noteTexts('오프닝');
  // 오프닝 대사 소화
  for (let t = 0; t < 20; t++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(500); }

  // 지도 열기
  await page.keyboard.press('m'); await wait(900); await shot('sw_04_map_first'); await noteTexts('지도');
  await page.keyboard.press('Escape'); await wait(500);

  // 와우리 시설 전수 방문 (F 모달 + 스크린샷)
  const regions = [
    { sid: 212, name: 'wawoo' }, { sid: 213, name: 'sang' }, { sid: 211, name: 'donghwa' }, { sid: 210, name: 'suyeong' },
  ];
  for (const rg of regions) {
    // 지역 개방 (이전 지역 100% 시뮬)
    await page.evaluate((sid) => {
      if (Number(currentStage) !== sid) {
        const RID = { 212: 'wawoo', 213: 'sang', 211: 'donghwa', 210: 'suyeong' };
        const order = ['wawoo', 'sang', 'donghwa', 'suyeong'];
        const idx = order.indexOf(RID[sid]);
        for (let i = 0; i < idx; i++) {
          const psid = { wawoo: 212, sang: 213, donghwa: 211, suyeong: 210 }[order[i]];
          (STAGES[psid].objects || []).forEach(o => { if (o && o.interactable === 'hazard' && o.hazardId && !o.isBoss && String(o.hazardId).indexOf('final_boss') !== 0) BD.purified[o.hazardId] = true; });
          const facs = (STAGES[psid].__v24Landmarks || []).filter(l => l && l.facilityId && l.majorFacility && !l.hidden);
          const st = JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1') || '{"visitedFacilityIds":[],"visitCounts":{}}');
          facs.forEach(l => { if (st.visitedFacilityIds.indexOf(l.facilityId) < 0) st.visitedFacilityIds.push(l.facilityId); });
          localStorage.setItem('bd_concept_facility_visits_v1', JSON.stringify(st));
          if (BD_PROGRESS.story.unlockedRegionIds.indexOf(order[i + 1]) < 0) BD_PROGRESS.story.unlockedRegionIds.push(order[i + 1]);
        }
        fadeToStage(sid, STAGES[sid].spawnX || 0.5, STAGES[sid].spawnY || 0.5, 80);
      }
    }, rg.sid);
    await wait(2000);
    // 대화 소화
    for (let t = 0; t < 14; t++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); const dlg = document.getElementById('bd-dialog'); if (dlg && dlg.classList.contains('show')) { try { advanceDialog(); } catch (e) { } } }); await wait(450); }
    await shot('sw_10_' + rg.sid + '_arrive'); await noteTexts(rg.sid + '도착');

    const facs = await page.evaluate((sid) =>
      (STAGES[sid].__v24Landmarks || []).filter(l => l && l.facilityId && l.majorFacility && !l.hidden)
        .map(l => ({ id: l.facilityId, x: l.interactionX, y: l.interactionY })), rg.sid);
    for (const f of facs) {
      await page.evaluate((f2) => { heroX = Number(f2.x); heroY = Number(f2.y) + 0.005; camX = heroX; camY = heroY; }, f);
      await wait(400);
      await page.keyboard.press('f');
      await wait(800);
      const open = await page.evaluate(() => !!document.querySelector('#bd-district-facility-modal.open'));
      if (open) { await shot('sw_20_' + rg.sid + '_' + f.id); await noteTexts('시설 ' + f.id); await page.keyboard.press('Escape'); await wait(500); }
      else { texts.push('[시설 ' + f.id + '] ⚠ 모달 안 열림'); await shot('sw_20_' + rg.sid + '_' + f.id + '_FAIL'); }
    }
  }

  // 첫 전투 (와우리로 복귀해 쓰레기 정화 — 스포트라이트·스킬 튜토 확인용)
  await page.evaluate(() => {
    Object.keys(BD.purified).forEach(k => { if (k === 'ow212_trash_1') delete BD.purified[k]; });
    fadeToStage(212, 0.52, 0.47, 80);
  });
  await wait(1500);
  await page.keyboard.press('f'); await wait(1200); await shot('sw_30_investigate'); await noteTexts('조사');
  // 선택창 → 조사한다
  await page.keyboard.press('f'); await wait(1500); await shot('sw_31_safety_quiz'); await noteTexts('퀴즈');
  // 안전 퀴즈 정답 클릭 (정답 버튼 data-ok=1)
  await page.evaluate(() => { const b = document.querySelector('#bd-safety-choice button[data-ok="1"]'); if (b) b.click(); });
  await wait(2500); await shot('sw_32_battle_start'); await noteTexts('전투시작');
  await wait(2500); await shot('sw_33_battle_tutorial'); await noteTexts('전투튜토');
  const spotState = await page.evaluate(() => ({
    spot: !!document.getElementById('bd-spot'),
    hole: (() => { const e = document.getElementById('bd-spot-hole'); return e ? getComputedStyle(e).display : null; })(),
  }));
  say('전투 중 스포트라이트:', JSON.stringify(spotState));
  await shot('sw_34_battle_spot');

  fs.writeFileSync(path.join(h.SHOTS, '_texts.txt'), texts.join('\n'), 'utf8');
  say('수집 텍스트 ' + texts.length + '건 → _texts.txt');
  say('콘솔 오류:', consoleErrors.length);
};
