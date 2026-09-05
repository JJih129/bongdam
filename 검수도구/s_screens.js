// 화면 전수 점검 — 모든 UI 표면을 열어 스크린샷 (VW/VH 환경변수로 해상도 지정)
module.exports = async (h) => {
  const { say } = h;
  const shotN = async (n, name) => { await h.wait(600); await h.shot(`${String(n).padStart(2, '0')}_${name}`); };

  await shotN(1, 'title');
  await h.click('#bd-title-start');
  await h.wait(1500);
  await shotN(2, 'char_select');
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); } catch (e) { } });
  await h.wait(800);
  await shotN(3, 'start_setup');
  await h.page.evaluate(() => { try { window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);
  await shotN(4, 'prologue_field');

  // 프롤로그 독백 소진 (VN 오염 방지) 후 스킵 상태로 와우리 필드 진입
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(450); }
  await h.page.evaluate(() => {
    try {
      localStorage.setItem('bd_dami_awake', '1');
      localStorage.setItem('bd_tut2_done', '1');
      localStorage.setItem('bd_dami_tutorial_done', '1');
      localStorage.setItem('bd_battle_tutorial_done', '1');
      localStorage.setItem('bd_battle_tutorial_seen', '1');
      if (window.fadeToStage) fadeToStage(212, 0.5, 0.5); else { currentStage = 212; }
    } catch (e) { }
  });
  await h.wait(2500);
  for (let i = 0; i < 8; i++) {
    const vn = await h.page.evaluate(() => { const e = document.getElementById('dialogue-box'); return !!(e && e.getBoundingClientRect().height > 0); });
    if (!vn) break;
    await h.page.keyboard.press(' '); await h.wait(400);
  }
  await shotN(5, 'field_wawoo');

  // 상단 바 패널들 — 버튼 텍스트로 클릭
  const openByText = async (txt) => await h.page.evaluate((t) => {
    const b = [...document.querySelectorAll('button,div')].find(x => {
      const r = x.getBoundingClientRect();
      return r.top < 70 && r.height > 8 && r.height < 60 && (x.textContent || '').replace(/\s+/g, '').includes(t) && x.children.length <= 2;
    });
    if (b) { b.click(); return true; } return false;
  }, txt);
  const esc = async () => { await h.page.keyboard.press('Escape'); await h.wait(500); };

  const panels = [['안전수첩', 'notebook'], ['장비', 'equip'], ['장소수첩', 'placebook'], ['안전지도', 'safetymap'], ['건물', 'building']];
  let n = 6;
  for (const [txt, name] of panels) {
    const ok = await openByText(txt);
    say(`패널 ${txt}: ${ok}`);
    await shotN(n++, 'panel_' + name);
    await esc(); await esc();
  }
  await h.page.keyboard.press('j'); await shotN(n++, 'panel_quest_J'); await esc();
  await h.page.keyboard.press('e'); await shotN(n++, 'panel_bag_E'); await esc();
  await h.page.keyboard.press('m'); await shotN(n++, 'panel_map_M'); await esc();

  // 설정 (기어 버튼)
  await h.page.evaluate(() => {
    const b = [...document.querySelectorAll('button,div')].find(x => { const r = x.getBoundingClientRect(); return r.top < 70 && /⚙/.test(x.textContent || '') && r.height > 8; });
    if (b) b.click();
  });
  await shotN(n++, 'settings'); await esc();

  // 일시정지
  await esc(); await shotN(n++, 'pause_or_field'); await h.page.keyboard.press('Escape'); await h.wait(400);

  // 상점 — 편의점으로 이동해 F
  await h.page.evaluate(() => {
    try {
      const lm = (STAGES[212].__v24Landmarks || []).find(l => /편의점|스토어|마트/.test(l.label || ''));
      if (lm) { heroX = Number(lm.rx) + Number(lm.rw) / 2; heroY = Number(lm.ry) + Number(lm.rh) + 0.01; camX = heroX; camY = heroY; }
    } catch (e) { }
  });
  await h.wait(600);
  await h.page.keyboard.press('f'); await h.wait(900);
  await shotN(n++, 'shop_or_card');
  await h.page.keyboard.press(' '); await h.wait(400);
  await shotN(n++, 'shop_step2');
  await esc(); await esc();

  // 시설 안내 카드 — 약국으로 이동해 F
  await h.page.evaluate(() => {
    try {
      const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
      if (lm) { heroX = Number(lm.rx) + Number(lm.rw) / 2; heroY = Number(lm.ry) + Number(lm.rh) + 0.01; camX = heroX; camY = heroY; }
    } catch (e) { }
  });
  await h.wait(600);
  await h.page.keyboard.press('f'); await h.wait(1000);
  await shotN(n++, 'facility_card');
  await h.page.keyboard.press(' '); await h.wait(500);
  await shotN(n++, 'facility_card2');
  await esc(); await esc();

  // 미니게임 5종 — 직접 실행 (전투 밖에서도 오버레이 표시 가능)
  for (const mg of ['ring', 'mash', 'hold', 'track', 'rhythm']) {
    await h.page.evaluate((k) => { try { window.__bdMgDone = false; BD_MG.run(k, {}, () => { window.__bdMgDone = true; }); } catch (e) { } }, mg);
    await h.wait(1200);
    await shotN(n++, 'minigame_' + mg);
    // 정리: 실패로 끝나길 기다리거나 강제 제거
    await h.page.evaluate(() => { const m = document.getElementById('bd-mg'); if (m) m.remove(); window.__bdMgActive = false; });
    await h.wait(300);
  }

  // 전투 — 쓰레기 위험요소로 이동해 F → 선택 → 전투
  // (v315 대응) 담이 오프닝(조사 잠금) 종료 대기
  for (let t = 0; t < 30; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
  await h.page.evaluate(() => {
    try {
      const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
      if (o) { heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; }
    } catch (e) { }
  });
  await h.wait(600);
  await h.page.keyboard.press('f'); await h.wait(1000);
  await shotN(n++, 'hazard_dialog');
  for (let i = 0; i < 6; i++) {
    await h.page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); });
    await h.wait(500);
    if (await h.page.evaluate(() => !!document.querySelector('#bd-safety-choice'))) break;
  }
  await shotN(n++, 'safety_choice');
  await h.page.evaluate(() => { const b = document.querySelector('#bd-safety-choice button[data-ok="1"]'); if (b) b.click(); });
  await h.wait(3000);
  await shotN(n++, 'battle_enter');
  for (let t = 0; t < 15; t++) { if ((await h.page.evaluate(() => window.HSR && HSR.state)) === 'player') break; await h.wait(500); }
  await shotN(n++, 'battle_player_turn');
  // 승리까지 자동 진행
  const A = require('./auto')(h, require('./lib')(h));
  await A.doBattle(90);
  await shotN(n++, 'battle_after');

  // 엔딩·결과 리포트 (강제 호출)
  await h.page.evaluate(() => { try { window.BD_showEnding && BD_showEnding(); } catch (e) { } });
  await h.wait(1500);
  await shotN(n++, 'ending_report');

  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
