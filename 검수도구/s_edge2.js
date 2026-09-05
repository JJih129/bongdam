// 엣지 ④·⑥ 세부 분해
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
  await h.wait(4000);

  // ⑥ 먼저: 일시정지 → m
  await h.page.keyboard.press('Escape'); await h.wait(700);
  say('일시정지: ' + await h.page.evaluate(() => { const m = document.getElementById('bd-pause-modal'); return !!(m && m.classList.contains('show')); }));
  await h.page.keyboard.press('m'); await h.wait(500);
  const mLeak = await h.page.evaluate(() => { const e = document.getElementById('bd-map-v283'); return e ? e.style.display : 'no-el'; });
  say('일시정지 중 M → 지도: ' + mLeak);
  await h.page.keyboard.press('e'); await h.wait(400);
  const eLeak = await h.page.evaluate(() => { const e = document.getElementById('inv-panel'); return e ? e.offsetHeight : -1; });
  say('일시정지 중 E → 가방 높이: ' + eLeak);
  await h.shot('e6_state');
  // 정리
  await h.page.keyboard.press('Escape'); await h.wait(400);
  await h.page.keyboard.press('Escape'); await h.wait(400);
  await h.page.keyboard.press('Escape'); await h.wait(600);

  // ④: 쓰레기 F → 상태 추적
  await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1'); heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; });
  await h.wait(500);
  say('오프닝 busy: ' + await h.page.evaluate(() => !!window.__bdDamiOpeningBusy));
  await h.page.keyboard.press('f'); await h.wait(900);
  const st1 = await h.page.evaluate(() => ({
    choiceOpen: !!(window.__bdChoiceState && __bdChoiceState.open),
    dlgH: (() => { const b = document.getElementById('dialogue-box'); return b ? Math.round(b.getBoundingClientRect().height) : -1; })(),
    toast: (() => { const t = document.getElementById('bd-toast'); return t && t.classList.contains('show') ? t.textContent : null; })(),
  }));
  say('F 직후: ' + JSON.stringify(st1));
  for (let i = 0; i < 8; i++) {
    await h.page.keyboard.press(' '); await h.wait(300);
    if (await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open))) break;
  }
  say('선택 열림: ' + await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open)));
  await h.page.evaluate(() => { try { BD_choiceConfirm(); } catch (e) { } });
  await h.wait(3500);
  say('전투: ' + await h.page.evaluate(() => !!(window.HSR && HSR.active)));
  await h.shot('e4_state');
};
