// 라운드 2 종합 검증 — 수여식 후 시퀀스·지도 v2·게이트·인벤 통합·스포트라이트
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
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

  // ── A. 수여식 이후 시퀀스 (독백 → 걷기 검증 → 데스크 F → 대화 → 수여식 → 각성) ──
  for (let i = 0; i < 4; i++) { await page.keyboard.press(' '); await wait(450); }
  await page.keyboard.down('a'); await wait(1500); await page.keyboard.up('a');
  await wait(1300);
  await page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await wait(600);
  // F 재시도 루프 — 중간 VN(«좋아, 이제 데스크로…»)이 F를 삼키는 타이밍 회피
  let talking = false;
  for (let t = 0; t < 10 && !talking; t++) {
    await page.keyboard.press('f');
    await wait(700);
    talking = await page.evaluate(() => {
      const vn = document.getElementById('dialogue-box');
      return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || ''));
    });
    if (!talking) { await page.keyboard.press(' '); await wait(400); }
  }
  say('선생님 대화 개시:', talking);
  for (let i = 0; i < 16; i++) { await page.keyboard.press(' '); await wait(600); }
  await wait(1800); await page.keyboard.press(' ');   // 수여식 오버레이 닫기
  await wait(5000);
  await shot('r2_after_ceremony');
  const seq = await page.evaluate(() => ({
    awake: localStorage.getItem('bd_dami_awake'),
    ceremonyDone: !!window.__bdCeremonyDone,
    dami: (document.getElementById('bd-dami-text') || {}).textContent || null,
    hudShown: (document.getElementById('bd-quest-hud') || {}).style ? document.getElementById('bd-quest-hud').style.display : null,
  }));
  say('수여식 후:', JSON.stringify(seq));

  // ── B. 지도 v2 공식 (정화+방문 / 보스 제외) ──
  const mapB = await page.evaluate(() => {
    const r = BD_MapProgress.region('wawoo');
    return { pct: r.pct, pur: r.pur, visit: r.visit, core: r.core };
  });
  say('와우리 지도 v2:', JSON.stringify(mapB));

  // ── C. 도보 게이트 차단 (와우리 미완성 상태에서 상리행 시도) ──
  await page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); fadeToStage(212, 0.48, 0.95, 80); });
  await wait(1500);
  await page.keyboard.down('s'); await wait(2500); await page.keyboard.up('s');
  await wait(800);
  const gate = await page.evaluate(() => ({ stage: Number(currentStage), dami: (document.getElementById('bd-dami-text') || {}).textContent || '' }));
  say('게이트 차단:', JSON.stringify({ stage: gate.stage, blocked: gate.stage === 212, msg: gate.dami.slice(0, 40) }));
  await shot('r2_gate_block');

  // ── D. 시설 방문 → % 상승 → 100% 시뮬 → 스킬+장 완료 ──
  const simD = await page.evaluate(() => {
    // 위험요소 전부 정화 (보스 제외)
    (STAGES[212].objects || []).forEach(o => {
      if (o && o.interactable === 'hazard' && o.hazardId && !o.isBoss && String(o.hazardId).indexOf('final_boss') !== 0) BD.purified[o.hazardId] = true;
    });
    // 시설 전부 방문 처리
    const facs = (STAGES[212].__v24Landmarks || []).filter(l => l && l.facilityId && l.majorFacility && !l.hidden);
    const st = JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1') || '{"visitedFacilityIds":[],"visitCounts":{}}');
    facs.forEach(l => { if (st.visitedFacilityIds.indexOf(l.facilityId) < 0) st.visitedFacilityIds.push(l.facilityId); });
    localStorage.setItem('bd_concept_facility_visits_v1', JSON.stringify(st));
    BD.questIdx = 1;   // ch1 진행 중 상태
    return { facCount: facs.length, ids: facs.map(l => l.facilityId) };
  });
  say('와우리 시설 목록:', JSON.stringify(simD));
  await wait(4500);   // 감시자 틱 (지도 100% → 장 완료 + 스킬)

  // ── E. 장 완료 연출(전화·컷신) 완전 소화 — 8틱 연속 무대화까지
  let idle = 0;
  for (let t = 0; t < 60 && idle < 8; t++) {
    const busy = await page.evaluate(() => {
      const vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); return true; }
      const dlg = document.getElementById('bd-dialog');
      if (dlg && dlg.classList.contains('show')) { try { advanceDialog(); } catch (e) { dlg.click(); } return true; }
      return false;
    });
    idle = busy ? 0 : idle + 1;
    await wait(600);
  }
  const after100 = await page.evaluate(() => ({
    pct: BD_MapProgress.region('wawoo').pct,
    fan: BD.unlockedSkills.includes('fan'),
    questIdx: BD.questIdx,
    unlocked: BD_PROGRESS.story.unlockedRegionIds,
    frags: BD_PROGRESS.safety.collectedSafetyFragmentIds,
  }));
  say('100% 후:', JSON.stringify(after100));
  await shot('r2_map_100');
  await page.evaluate(() => { fadeToStage(212, 0.48, 0.95, 80); });
  await wait(1500);
  await page.keyboard.down('s'); await wait(2500); await page.keyboard.up('s');
  await wait(1200);
  const gate2 = await page.evaluate(() => ({
    stage: Number(currentStage), y: +heroY.toFixed(3),
    blocked: (typeof window.BD_isInputBlocked === 'function') ? window.BD_isInputBlocked() : null,
    vn: (() => { const v = document.getElementById('dialogue-box'); return v && v.offsetHeight > 0 ? (v.textContent || '').slice(0, 50) : null; })(),
    gates: (STAGES[212].districtGates || []).map(g => g.side + '→' + g.nextStage + '@' + g.at),
  }));
  say('개방 후 도보 이동:', gate2.stage === 213 ? '✅ 상리 진입' : '❌ ' + JSON.stringify(gate2));

  // ── F. 인벤 통합: 지역 아이템 구매 시뮬 → 가방 표시·사용 ──
  const inv = await page.evaluate(() => {
    BD.items.snack = 2; BD.items.potion = 1;
    return new Promise(res => setTimeout(() => {
      const out = {};
      out.bag = Object.keys(playerInventory).filter(k => ['snack', 'drink', 'potion'].includes(k))
        .map(k => k + '×' + playerInventory[k].count);
      out.noQuickBox = !document.getElementById('bd-bag-use');
      // 사용 시뮬
      heroHP = 50;
      selectedInvItemId = 'snack';
      try { useSelectedItem(); } catch (e) { out.useErr = String(e); }
      out.hpAfter = heroHP;
      out.snackAfter = BD.items.snack;
      res(out);
    }, 2200));
  });
  say('인벤 통합:', JSON.stringify(inv));

  // ── G. 스포트라이트 요소 상태 ──
  const spot = await page.evaluate(() => {
    // clearMask 후에도 재생성 가능한지 — 강제 스포트라이트 생성 테스트
    const hole = document.getElementById('bd-spot-hole');
    return { holePreexists: !!hole, spotWrap: !!document.getElementById('bd-spot') };
  });
  say('스포트라이트 초기 상태:', JSON.stringify(spot));

  say('콘솔 오류:', consoleErrors.length);
  const pass = seq.awake === '1' && seq.ceremonyDone
    && mapB.visit.max > 0
    && gate.stage === 212
    && after100.pct === 100 && after100.fan && after100.questIdx >= 2
    && after100.unlocked.includes('sang')
    && gate2 === 213
    && inv.bag.length >= 2 && inv.noQuickBox && inv.hpAfter === 90 && inv.snackAfter === 1;
  say(pass ? '✅ 라운드 2 종합 검증 통과' : '❌ 일부 실패 — 로그 확인');
};
