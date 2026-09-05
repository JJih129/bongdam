// 재플레이 검증 — 게임 중 타이틀로 → 시작하기 → 위험요소 가시성·상태
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
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
    await h.page.evaluate(() => {
      localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
      localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
      localStorage.setItem('bd_shop_tutorial_done_v75', '1');
      if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
    });
    await h.wait(2500);
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  };
  const hazState = async () => await h.page.evaluate(() => {
    const st = STAGES[212];
    return (st.objects || []).filter(o => o && o.hazardId && !String(o.hazardId).startsWith('final')).map(o => ({
      id: o.hazardId.replace('ow212_', ''), gone: !!o.__bdGone, pur: !!(BD.purified && BD.purified[o.hazardId]), hid: !!o.hidden,
    }));
  });

  await boot();
  // 쓰레기 정화(직접 파이프라인) — 상태 오염 만들기
  await h.page.evaluate(() => { BD_markPurified('ow212_trash_1'); });
  await h.wait(800);
  say('1회차(정화 후): ' + JSON.stringify(await hazState()));
  // 타이틀로 → 시작하기(새로 시작)
  await h.page.evaluate(() => { window.BD_pauseToTitle ? BD_pauseToTitle() : null; });
  await h.wait(2500);
  const atTitle = await h.page.evaluate(() => { const b = document.getElementById('bd-title-start'); return !!(b && b.offsetWidth > 0); });
  say('타이틀 복귀: ' + atTitle);
  await h.shot('replay_title');
  await boot();
  const st2 = await hazState();
  say('2회차(새로 시작 후): ' + JSON.stringify(st2));
  const bad = st2.filter(o => o.gone || o.pur || o.hid);
  say(bad.length ? '❌ 잔존 오염: ' + JSON.stringify(bad) : '✅ 재시작 시 위험요소 정상 리셋');
  await h.shot('replay_field');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
