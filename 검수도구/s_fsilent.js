// 사일런트 F 재현 + 소비자 추적
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
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  for (let t = 0; t < 30; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY;
  });
  await h.wait(700);
  // 스파이 설치
  await h.page.evaluate(() => {
    window.__spy = { lastCapture: 0, hz: 0, fac: 0, shared: 0, keyF: 0 };
    document.addEventListener('keydown', function (e) { if ((e.key || '').toLowerCase() === 'f') window.__spy.keyF++; }, false); // 버블 최후
    const wrapN = (name, key) => { const o = window[name]; if (typeof o === 'function' && !o.__spy2) { window[name] = function () { window.__spy[key]++; return o.apply(this, arguments); }; window[name].__spy2 = true; } };
    wrapN('BD_hazardInteract', 'hz');
    // 067 내부 openFacility는 비공개 — 모달 관찰로 대체
  });
  const pre = await h.page.evaluate(() => ({
    fac: (window.BD_v24NearestFacility() || {}).label || null,
    opening: !!window.__bdDamiOpeningBusy,
    tut: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()),
    dlgWasUp: window.__bdDlgWasUp ? (Date.now() - window.__bdDlgWasUp) : null,
    choiceClosedAt: window.__bdChoiceClosedAt ? (Date.now() - window.__bdChoiceClosedAt) : null,
    nearKindProbe: (() => { try { const r = window.BD_nearResident && BD_nearResident(); return r ? r.label : null; } catch (e) { return 'ERR'; } })(),
  }));
  say('F 전: ' + JSON.stringify(pre));
  await h.page.keyboard.press('f');
  await h.wait(900);
  const post = await h.page.evaluate(() => ({
    spy: window.__spy,
    choice: !!(window.__bdChoiceState && __bdChoiceState.open),
    modal: (() => { const m = document.getElementById('bd-district-facility-modal'); return !!(m && m.classList.contains('open')); })(),
    dlgH: (() => { const b = document.getElementById('dialogue-box'); return b ? Math.round(b.getBoundingClientRect().height) : -1; })(),
  }));
  say('F 후: ' + JSON.stringify(post));
  // 2번째 F
  await h.wait(900);
  await h.page.keyboard.press('f');
  await h.wait(900);
  say('F2 후: ' + JSON.stringify(await h.page.evaluate(() => ({ spy: window.__spy, choice: !!(window.__bdChoiceState && __bdChoiceState.open) }))));
};
