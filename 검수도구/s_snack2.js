// 라운드 11 유닛 검증 — 스텝 술어·증강 스포트·문자 재개
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
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');   // 상점 튜토도 격리
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // ① 간식 스텝 술어 유닛
  const u1 = await h.page.evaluate(() => {
    const steps = window.BD_DAMI_STEPS();
    const use = steps.find(s => s.id === 'item_use');
    const watch = steps.find(s => s.id === 'item_watch');
    if (!use || !watch) return { err: '스텝 없음' };
    window.__bdTutSnack0 = 1;
    BD.items = BD.items || {}; BD.items.snack = 1;
    const out = {};
    out.closedAdvances = use.waitFor.predicate() === true;      // 메뉴 닫힘(없음) → 진행
    // 메뉴 열림 시뮬
    const m = document.createElement('div'); m.id = 'hsr-item-menu'; m.style.cssText = 'height:50px;'; document.body.appendChild(m);
    out.openWaits = use.waitFor.predicate() === false;          // 열려 있고 안 먹음 → 대기
    BD.items.snack = 0;
    out.eatAdvances = use.waitFor.predicate() === true;         // 먹음 → 진행
    BD.items.snack = 1;
    out.watchSkipsWhenNotEaten = !!(watch.skipIf && watch.skipIf() === true);   // 안 먹음 → «냠» 스킵
    BD.items.snack = 0;
    out.watchPlaysWhenEaten = !!(watch.skipIf && watch.skipIf() === false);
    m.remove(); BD.items.snack = 1; window.__bdTutSnack0 = 0;
    return out;
  });
  say('① 간식 술어: ' + JSON.stringify(u1));

  // 오프닝(담이 소개) 종료 대기 — sceneBusy로 튜토가 일시정지돼 판정이 오염되는 것 방지
  for (let t = 0; t < 30; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy || !!(window.BD_TUTOR_sceneBusy && BD_TUTOR_sceneBusy())))) break; await h.wait(1000); }
  // ② 증강 중 스포트라이트 숨김 — 스텁 증강 + 스텁 타깃 + 미니 튜토
  await h.page.evaluate(() => {
    const tgt = document.createElement('div'); tgt.id = 'qa-spot-target'; tgt.style.cssText = 'position:fixed;top:200px;left:200px;width:80px;height:40px;'; document.body.appendChild(tgt);
    const a = document.createElement('div'); a.id = 'bd-aug-overlay'; a.style.cssText = 'position:fixed;top:0;left:0;width:200px;height:120px;'; document.body.appendChild(a);
    BD_TUTOR.run([{ id: 'qa1', text: 'QA 스포트', target: '#qa-spot-target', block: false, waitFor: { delay: 7000 } }], null, 'qa_spot');
  });
  await h.wait(1500);
  const withAug = await h.page.evaluate(() => ({
    d: (() => { const w = document.getElementById('bd-spot'); return w ? getComputedStyle(w).display : 'no-el'; })(),
    run: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), step: window.__bdTutStepId,
  }));
  await h.page.evaluate(() => { document.getElementById('bd-aug-overlay').remove(); });
  await h.wait(1200);
  const withoutAug = await h.page.evaluate(() => ({
    d: (() => { const w = document.getElementById('bd-spot'); return w ? getComputedStyle(w).display : 'no-el'; })(),
    run: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), step: window.__bdTutStepId,
  }));
  await h.wait(4500);
  say(`② 스포트: 증강 중=${JSON.stringify(withAug)}(none 기대) · 제거 후=${JSON.stringify(withoutAug)}(block 기대)`);

  // ③ 지역 클리어 전화 씬: 전투 중 보류 → 종전 후 재생 (실제 유저 버그 경로)
  await h.page.evaluate(() => { window.HSR = window.HSR || {}; HSR.active = true; BD_regionClearScene('ch1'); });
  await h.wait(3500);
  const held = await h.page.evaluate(() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); });
  await h.page.evaluate(() => { HSR.active = false; });
  await h.wait(2000);
  const resumed = await h.page.evaluate(() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0) && /주민들의 부탁|해결/.test(b.textContent || ''); });
  say(`③ 전화 씬: 전투 중=${held}(false 기대) · 종전 후=${resumed}(true 기대)`);
  // 정리
  for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  say('콘솔 오류: ' + h.consoleErrors.length);
  const ok = u1.closedAdvances && u1.openWaits && u1.eatAdvances && u1.watchSkipsWhenNotEaten && u1.watchPlaysWhenEaten
    && withAug.d === 'none' && withoutAug.d !== 'none' && !held && resumed;
  say(ok ? '✅ 라운드 11 검증 통과' : '❌ 확인 필요');
};
