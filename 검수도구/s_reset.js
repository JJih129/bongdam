// «시작하기» 완전 초기화 검증 — 진행 오염 → 타이틀 → 시작하기 → 잔존 diff
module.exports = async (h) => {
  const { say } = h;
  const snapshot = async () => await h.page.evaluate(() => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = String(localStorage.getItem(k)).slice(0, 40); }
    const rt = {
      questIdx: (window.BD && BD.questIdx) ?? null,
      purifiedN: window.BD && BD.purified ? Object.keys(BD.purified).length : 0,
      skills: (window.BD && BD.unlockedSkills || []).join(','),
      gold: typeof playerGold !== 'undefined' ? playerGold : null,
      level: typeof safetyLevel !== 'undefined' ? safetyLevel : null,
      hp: typeof heroHP !== 'undefined' ? heroHP : null,
      pct: (() => { try { return BD_MapProgress.region('wawoo').pct; } catch (e) { return 'ERR'; } })(),
      unlocked: (() => { try { return (BD_PROGRESS.story.unlockedRegionIds || []).join(','); } catch (e) { return 'ERR'; } })(),
      badgeGiven: (() => { try { return !!BD_PROGRESS.story.tutorialFlags.badgeGiven; } catch (e) { return 'ERR'; } })(),
    };
    return { ls, rt };
  });
  const start = async () => {
    await h.page.click('#bd-title-start', { timeout: 8000 });
    await h.wait(1500);
    // (v325) 시작하기가 정리 후 리로드할 수 있음 — 리로드+자동 재진입까지 대기
    for (let t = 0; t < 25; t++) {
      await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } });
      await h.wait(600);
      if (await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break;
    }
    await h.wait(2500);
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  };

  // ① 신선 1회차 → 기준선
  await start();
  const base = await snapshot();
  say('기준선 키 수: ' + Object.keys(base.ls).length + ' · rt=' + JSON.stringify(base.rt));

  // ② 진행 오염 (공식 저장 경로 위주)
  await h.page.evaluate(() => {
    try { BD_markPurified('ow212_trash_1'); BD_markPurified('ow212_kickboard_1'); } catch (e) { }
    try { localStorage.setItem('bd_concept_facility_visits_v1', JSON.stringify({ visitedFacilityIds: ['wawoo_pharmacy', 'bongdam_police'], visitCounts: { wawoo_pharmacy: 2 }, lastFacilityId: 'wawoo_pharmacy' })); } catch (e) { }
    try { const q = { ow212_trash_1: 'r', ow212_kickboard_1: 'a' }; localStorage.setItem('bd_hzquest_v57', JSON.stringify(q)); } catch (e) { }
    try { BD.unlockedSkills = ['sticker', 'fan']; BD.items = { snack: 3 }; } catch (e) { }
    try { playerGold = 777; } catch (e) { }
    try { safetyPoints = 55; } catch (e) { }
    try { localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1'); localStorage.setItem('bd_shop_tutorial_done_v75', '1'); } catch (e) { }
    try { BD_PROGRESS.story.unlockedRegionIds = ['wawoo', 'sang']; BD_PROGRESS.story.tutorialFlags.badgeGiven = true; if (window.BD_saveProgress) BD_saveProgress(); } catch (e) { }
    try { bdSave(); } catch (e) { }
    try { if (typeof saveToSlot === 'function') saveToSlot(1); } catch (e) { }
  });
  await h.wait(1200);
  const dirty = await snapshot();
  say('오염 후 키 수: ' + Object.keys(dirty.ls).length + ' · rt=' + JSON.stringify(dirty.rt));

  // ③ 타이틀로 → «시작하기» (실경로)
  await h.page.evaluate(() => { try { BD_pauseToTitle(); } catch (e) { } });
  await h.wait(2500);
  say('타이틀: ' + await h.page.evaluate(() => { const b = document.getElementById('bd-title-start'); return !!(b && b.offsetWidth > 0); }));
  await start();
  await h.wait(1500);
  const after = await snapshot();

  // ④ diff — 기준선 대비 잔존
  const leaks = [];
  const EXEMPT = ['bd_play_started'];   // 새 게임 시작 시각 — 값이 달라지는 게 정상
  for (const k of Object.keys(after.ls)) {
    if (EXEMPT.includes(k)) continue;
    const b = base.ls[k], a = after.ls[k];
    if (a !== b) leaks.push({ key: k, base: b === undefined ? '(없음)' : b, after: a });
  }
  say('── localStorage 잔존/변화 (기준선 대비) ──');
  leaks.forEach(l => say(`  · ${l.key}: ${l.base} → ${l.after}`));
  say('── 런타임 상태 ──');
  say('  기준선: ' + JSON.stringify(base.rt));
  say('  재시작후: ' + JSON.stringify(after.rt));
  const rtLeak = JSON.stringify(base.rt) !== JSON.stringify(after.rt);
  say((leaks.length || rtLeak) ? `❌ 잔존 ${leaks.length}건 + 런타임 ${rtLeak ? '불일치' : '일치'}` : '✅ 완전 초기화');
  await h.shot('reset_after');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
