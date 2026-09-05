// 엔딩 모달 내용 검증 (깨끗한 조건에서 강제 호출)
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
  await h.wait(3000);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  // 진행 상태를 조금 만들어 두고 엔딩 호출
  await h.page.evaluate(() => {
    try { BD.purified = { ow212_trash_1: 1, ow212_kickboard_1: 1 }; BD.gameCleared = true; } catch (e) { }
    try { window.BD_showEnding && BD_showEnding(); } catch (e) { }
  });
  await h.wait(1800);
  const info = await h.page.evaluate(() => {
    const m = document.getElementById('bd-ending-modal');
    if (!m) return { exists: false };
    return {
      exists: true, show: m.classList.contains('show'),
      textLen: (m.textContent || '').replace(/\s+/g, ' ').trim().length,
      text: (m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400),
      hasBtn: !!m.querySelector('button'),
    };
  });
  say('엔딩 모달: ' + JSON.stringify(info, null, 1));
  await h.shot('ending_clean');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
