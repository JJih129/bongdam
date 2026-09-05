// 211 진입 후 이동 잠금 원인 덤프
module.exports = async (h) => {
  const { say } = h;
  // (v326) 강화 부팅 — «시작하기» 클릭은 purge+reload를 유발하므로(전파 차단),
  // 리로드 후 자동클릭·캐릭터 선택까지 «타이틀 버튼이 사라질 때까지» 기다린다.
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));   // 리로드 중이면 재시도
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
    BD.questIdx = 3; fadeToStage(211, 0.45, 0.75);
  });
  await h.wait(2000);
  for (let k = 0; k < 14; k++) {
    const st = await h.page.evaluate(() => ({
      blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
      dlg: (() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); })(),
      damiBusy: !!window.__bdDamiOpeningBusy,
      introBusy: !!window.__bdDamiIntroBusy,
      tut: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()),
      choice: !!(window.__bdChoiceState && __bdChoiceState.open),
      hsr: !!(window.HSR && HSR.active),
      scene: !!(window.__bdSceneBusy || window.__bdCutsceneBusy),
      hx: +heroX.toFixed(3),
    }));
    say(k + 's: ' + JSON.stringify(st));
    if (!st.blocked && !st.dlg && !st.damiBusy && !st.tut) break;
    await h.page.keyboard.press(' ');
    await h.wait(1000);
  }
  let moved = false;
  for (let a = 0; a < 12 && !moved; a++) {
    const st = await h.page.evaluate(() => ({
      blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
      dlg: (() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); })(),
      damiBusy: !!window.__bdDamiOpeningBusy, tut: !!(window.BD_TUTOR && BD_TUTOR.isRunning()),
    }));
    const x0 = await h.page.evaluate(() => heroX);
    await h.hold('d', 900);
    const x1 = await h.page.evaluate(() => heroX);
    moved = Math.abs(x1 - x0) > 0.002;
    say('시도' + a + ' ' + JSON.stringify(st) + ' Δ=' + (x1 - x0).toFixed(4));
    if (!moved) { await h.page.keyboard.press(' '); await h.wait(1400); }
  }
  say('이동 성공: ' + moved);
  if (!moved) {
    // 키 이벤트가 게임 keys 맵에 도달하나?
    const keyProbe = await h.page.evaluate(async () => {
      const log = {};
      try { log.keysVar = typeof keys !== 'undefined' ? JSON.stringify(keys).slice(0, 80) : 'undef'; } catch (e) { log.keysVar = 'err'; }
      try { log.blocked = BD_isInputBlocked(); } catch (e) { }
      try { log.paused = !!(window.gamePaused || window.__bdPaused); } catch (e) { }
      try { log.active = document.activeElement && (document.activeElement.id || document.activeElement.tagName); } catch (e) { }
      return log;
    });
    say('키 프로브: ' + JSON.stringify(keyProbe));
    await h.page.keyboard.down('d'); await h.wait(300);
    const during = await h.page.evaluate(() => { try { return JSON.stringify(keys).slice(0, 100); } catch (e) { return 'err'; } });
    await h.page.keyboard.up('d');
    say('d 누름 중 keys: ' + during);
  }
  await h.shot('move211');
};
