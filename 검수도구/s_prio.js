// 긴급 3+2건 통합 계측 — 담이 말풍선·스포트라이트·상리 조사·장비 인벤·재시작 위험요소
module.exports = async (h) => {
  const { say } = h;
  const boot = async () => {
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
  };
  await boot();

  // ① 담이 시스템 상태 (프롤로그 직후 — 각성 전이라 침묵은 정상, 시스템 자체를 검사)
  const dami0 = await h.page.evaluate(() => {
    const el = document.getElementById('bd-dami-hud');
    const out = {
      el: !!el, disp: el ? getComputedStyle(el).display : null, h: el ? el.offsetHeight : null,
      wrapped: !!(window.BD_DAMI && BD_DAMI.show && BD_DAMI.show.__v322),
    };
    try { out.callRet = window.BD_DAMI ? BD_DAMI.show('프로브1', { face: 'base' }) : 'noDAMI'; out.callErr = null; }
    catch (e) { out.callErr = String(e).slice(0, 120); }
    return out;
  });
  say('① 담이(각성 전): ' + JSON.stringify(dami0));

  // 각성 이후 상태로 — 실프롤로그 대신 각성 플래그+212 (속도 우선)
  for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const dami1 = await h.page.evaluate(async () => {
    const el = document.getElementById('bd-dami-hud');
    let before = el ? el.offsetHeight : -1;
    let ret, err = null;
    try { ret = BD_DAMI.show('프로브2 — 보이나요?', { face: 'base' }); } catch (e) { err = String(e).slice(0, 120); }
    await new Promise(r => setTimeout(r, 900));
    const el2 = document.getElementById('bd-dami-hud');
    return { ret, err, disp: el2 ? getComputedStyle(el2).display : null, h: el2 ? el2.offsetHeight : null, txt: el2 ? (el2.textContent || '').slice(0, 30) : null };
  });
  say('① 담이(각성 후 직접 호출): ' + JSON.stringify(dami1));
  await h.shot('prio_dami');

  // ② 필드 튜토 스포트라이트 (미니 튜토 직접 구동)
  const spot = await h.page.evaluate(async () => {
    try {
      BD_TUTOR.run([{ id: 'qa', text: '스포트 프로브', target: '#bd-keybar', block: false, waitFor: { delay: 3000 } }], null, 'qa_prio');
      await new Promise(r => setTimeout(r, 1200));
      const w = document.getElementById('bd-spot');
      const hole = document.getElementById('bd-spot-hole');
      return {
        run: BD_TUTOR.isRunning(), wDisp: w ? getComputedStyle(w).display : 'no-el',
        holeDisp: hole ? getComputedStyle(hole).display : 'no-el',
        holeBorder: hole ? getComputedStyle(hole).borderColor : null,
        augEl: (() => { const a = document.getElementById('bd-aug-overlay'); return a ? { h: a.offsetHeight, disp: getComputedStyle(a).display } : null; })(),
      };
    } catch (e) { return { err: String(e).slice(0, 120) }; }
  });
  say('② 스포트라이트: ' + JSON.stringify(spot));
  await h.shot('prio_spot');
  await h.wait(2500);

  // ③ 상리 위험요소 조사→전투 (부탁 수락 후)
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    BD.questIdx = 2; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;   // tuto 게이트 통과 상태
    fadeToStage(213, 0.1, 0.35);
  });
  await h.wait(2200);
  for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  for (let t = 0; t < 20; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
  // 서연(주민) 부탁
  await h.page.evaluate(() => { const o = (STAGES[213].objects || []).find(x => x && x.resident); if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.06) + 0.01; camX = heroX; camY = heroY; } });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  // 술병 조사
  await h.page.evaluate(() => {
    if (!window.BD_hazardInteract.__spy3) { const o = window.BD_hazardInteract; window.BD_hazardInteract = function () { window.__hz3 = (window.__hz3 || 0) + 1; return o.apply(this, arguments); }; window.BD_hazardInteract.__spy3 = true; }
    window.__hz3 = 0;
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(900);
  const pre3 = await h.page.evaluate(() => ({
    hz: window.__hz3, choice: !!(window.__bdChoiceState && __bdChoiceState.open),
    tutRun: !!(BD_TUTOR.isRunning && BD_TUTOR.isRunning()), step: window.__bdTutStepId || null,
    opening: !!window.__bdDamiOpeningBusy,
  }));
  say('③ 술병 F 후: ' + JSON.stringify(pre3));
  for (let k = 0; k < 12; k++) {
    await h.wait(600);
    await h.page.evaluate(() => { try { if (window.__bdChoiceState && __bdChoiceState.open) BD_choiceConfirm(); } catch (e) { } });
    if (await h.page.evaluate(() => !!(window.HSR && HSR.active))) break;
    await h.page.keyboard.press(' '); await h.wait(250); await h.page.keyboard.press(' '); await h.wait(250);
  }
  const battle3 = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('③ 상리 전투 진입: ' + battle3 + (battle3 ? ' ✅' : ' ❌'));
  await h.shot('prio_sangri');
  if (battle3) { await h.page.keyboard.press('Escape'); await h.wait(1500); for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(300); } }

  // ④ 장비 구매 → 인벤 확인
  await h.page.evaluate(() => { fadeToStage(212, 0.5, 0.5); });
  await h.wait(2000);
  for (let i = 0; i < 4; i++) { await h.page.keyboard.press(' '); await h.wait(250); }
  const equip = await h.page.evaluate(async () => {
    try {
      playerGold = 999;
      const before = JSON.stringify((window.BD && BD.equipOwned) || (BD && BD.equips) || null);
      // 장비 구매 공식 경로 탐색
      const fn = window.BD_buyEquip || window.buyEquip || null;
      let bought = null, how = null;
      if (fn) { bought = fn('prot_W'); how = 'fn'; }
      else if (typeof window.BD_openShop === 'function') { how = 'no-fn(BD_buyEquip 미노출)'; }
      const after = JSON.stringify((window.BD && BD.equipOwned) || (BD && BD.equips) || null);
      // 인벤(가방) 장비 탭 존재 검사
      openInventory && openInventory();
      await new Promise(r => setTimeout(r, 800));
      const inv = document.getElementById('inv-panel') || document.getElementById('inv-overlay');
      const txt = inv ? (inv.textContent || '') : '';
      return { how, bought, before: String(before).slice(0, 60), after: String(after).slice(0, 60), invHas바람막이: /바람막이/.test(txt), invOpen: !!(inv && inv.offsetHeight > 0) };
    } catch (e) { return { err: String(e).slice(0, 140) }; }
  });
  say('④ 장비: ' + JSON.stringify(equip));
  await h.shot('prio_equip');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 160)));
};
