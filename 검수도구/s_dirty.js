// 5단계 — localStorage 오염 상태에서도 «시작하기»가 정상 초기화되는지
module.exports = async (h) => {
  const { say } = h;
  // 게임 로드 전에 오염시킬 수 없으므로(파일 URL 단일 페이지), 로드 후 오염 → 리로드로 재현
  await h.page.evaluate(() => {
    try {
      localStorage.setItem('bongdam_rpg_editor_data_v5_2_quest', '{broken json!!');
      localStorage.setItem('bd_dami_awake', 'weird');
      localStorage.setItem('bd_save_v1', '{"hp":-999,"stage":9999}');
      localStorage.setItem('bd_concept_facility_visits_v1', 'null');
      localStorage.setItem('bd_tut2_done', '???');
      for (let i = 0; i < 5; i++) localStorage.setItem('junk_' + i, 'x'.repeat(5000));
    } catch (e) { }
  });
  await h.page.reload({ waitUntil: 'load', timeout: 180000 });
  await h.wait(3000);
  const title = await h.page.evaluate(() => { const b = document.getElementById('bd-title-start'); return !!(b && b.offsetWidth > 0); });
  say('오염 후 타이틀 표시: ' + title);
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
  const st = await h.page.evaluate(() => ({
    stg: (typeof currentStage !== 'undefined') ? Number(currentStage) : null,
    baked: (() => { try { const d = JSON.parse(localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest')); return !!(d && d.stages); } catch (e) { return false; } })(),
  }));
  say('시작 후 상태: ' + JSON.stringify(st));
  await h.shot('dirty_start');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 4).forEach(e => say(' ! ' + e.slice(0, 120)));
  say(title && st.stg === 101 && st.baked ? '✅ 오염 시작 검증 통과' : '❌ 확인 필요');
};
