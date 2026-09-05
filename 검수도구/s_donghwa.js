// 동화리 위험요소 조사 검증 — 부탁 수락 → 낙서 '지나간다' → 재조사 → 전투, 3종 전수
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  // (v326 부팅) 리로드+자동클릭 흐름 — 타이틀 버튼이 사라질 때까지 대기
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });   // 퍼지 훅 우회 직접 시작
    await h.wait(700);
  }
  // 전환 프레임(타이틀 숨김→모달 표시 사이) 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    // 동화리 개방 상태 시뮬: ch3 진입 (지역 잠금 해제)
    BD.questIdx = 3;
    if (window.fadeToStage) fadeToStage(211, 0.23, 0.6);
  });
  await h.wait(2500);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  for (let t = 0; t < 25; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }

  const tryHazard = async (hid, label) => {
    // 부탁 게이트 상태 확인
    const gate = await h.page.evaluate((id) => {
      const o = (STAGES[211].objects || []).find(x => x && x.hazardId === id);
      if (!o) return { err: '없음' };
      let g = null; try { g = window.BD_hzQuestGate ? BD_hzQuestGate(o) : null; } catch (e) { g = 'ERR'; }
      return { gate: g, locked: (typeof window.BD_hazardLocked === 'function') ? BD_hazardLocked(o) : null };
    }, hid);
    say(`[${label}] 게이트: ` + JSON.stringify(gate));
    await h.page.evaluate((id) => {
      const o = (STAGES[211].objects || []).find(x => x && x.hazardId === id);
      heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY;
    }, hid);
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(600);
    await h.page.keyboard.press('f'); await h.wait(900);
    let opened = await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open));
    if (!opened) {
      // 독백(주민 먼저 등)일 수 있음 — 내용 확인
      const dlg = await h.page.evaluate(() => { const b = document.getElementById('dialogue-box'); return b && b.getBoundingClientRect().height > 0 ? (b.textContent || '').trim().slice(0, 50) : null; });
      say(`[${label}] 선택창 없음 · 대사: ` + JSON.stringify(dlg));
      for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
      return { opened: false };
    }
    return { opened: true };
  };
  const investigate = async (label) => {
    for (let k = 0; k < 12; k++) {
      await h.wait(600);
      await h.page.evaluate(() => { try { if (window.__bdChoiceState && __bdChoiceState.open) BD_choiceConfirm(); } catch (e) { } });
      if (await h.page.evaluate(() => !!(window.HSR && HSR.active))) return true;
      await h.page.keyboard.press(' '); await h.wait(250); await h.page.keyboard.press(' '); await h.wait(250);
    }
    return false;
  };
  const leaveChoice = async () => {
    await h.page.evaluate(() => { try { const S = window.__bdChoiceState; if (S && S.open) { S.idx = 1; BD_choiceConfirm(); } } catch (e) { } });
    await h.wait(800);
  };

  // 주민(하늘·재현) 부탁 먼저 수락
  for (const npc of ['하늘', '재현']) {
    await h.page.evaluate((nm) => {
      const o = (STAGES[211].objects || []).find(x => x && x.resident && (x.label || '').includes(nm));
      if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.06) + 0.01; camX = heroX; camY = heroY; }
    }, npc);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
    for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
    say(`부탁 시도: ${npc}`);
  }

  // ① 낙서: '지나간다' → 재조사 → 전투
  const g1 = await tryHazard('ow211_graffiti_1', '낙서');
  if (g1.opened) {
    await leaveChoice();
    say('[낙서] 지나간다 선택 완료 → 재조사');
    await h.wait(1000);
    await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(900);
    const re = await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open));
    say('[낙서] 재조사 선택창: ' + re + (re ? ' ✅' : ' ❌'));
    if (re) { const b = await investigate('낙서'); say('[낙서] 전투 진입: ' + b + (b ? ' ✅' : ' ❌')); }
    // 전투 이탈
    await h.page.keyboard.press('Escape'); await h.wait(1500);
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  }
  // ② 소음·쓰레기(OPT)
  for (const [hid, label] of [['ow211_noise_1', '소음'], ['ow211_trash_1', '쓰레기OPT']]) {
    const g = await tryHazard(hid, label);
    if (g.opened) {
      const b = await investigate(label);
      say(`[${label}] 전투 진입: ` + b + (b ? ' ✅' : ' ❌'));
      await h.page.keyboard.press('Escape'); await h.wait(1500);
      for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
    }
  }
  await h.shot('donghwa_final');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
