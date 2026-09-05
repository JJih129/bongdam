// 라운드 15 에디터 확장 검증 — 플레이어 배율·감지 반경·휴식 가능 + __charScales 영속
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
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
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2000);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // 개발자 핫키로 에디터 (Shift+Z+X+C → ?dev=1 리로드 토글) — 검증 속도를 위해 직접 상태 부여가 안 되므로 핫키 사용
  await h.page.keyboard.down('Shift'); await h.page.keyboard.down('z'); await h.page.keyboard.down('x'); await h.page.keyboard.press('c');
  await h.page.keyboard.up('x'); await h.page.keyboard.up('z'); await h.page.keyboard.up('Shift');
  await h.wait(6000);   // 리로드 대기
  // 리로드 후 게임 재진입
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
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
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
  const ed = await h.page.evaluate(() => ({
    dev: location.search.includes('dev=1'),
    editor: !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled),
  }));
  say('에디터 상태: ' + JSON.stringify(ed));
  if (!ed.editor) {
    // 에디터 활성 토글 탐색 — 상태 덤프 + 토글 버튼 클릭
    const dump = await h.page.evaluate(() => ({
      stateKeys: window.BongdamEditor ? Object.keys(BongdamEditor.state || {}).slice(0, 20) : null,
      enabled: window.BongdamEditor && BongdamEditor.state ? BongdamEditor.state.enabled : null,
      toggleBtns: [...document.querySelectorAll('button')].filter(b => /에디터|편집/.test(b.textContent || '')).map(b => b.id || b.textContent.slice(0, 12)).slice(0, 8),
    }));
    say('덤프: ' + JSON.stringify(dump));
    await h.page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /에디터|편집 모드/.test(x.textContent || ''));
      if (b) b.click();
      else if (window.BongdamEditor && BongdamEditor.state) BongdamEditor.state.enabled = true;
    });
    await h.wait(1500);
    const ed2 = await h.page.evaluate(() => !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled));
    say('토글 후 에디터: ' + ed2);
    if (!ed2) { say('❌ 에디터 활성 실패'); return; }
  }
  await h.wait(2500);
  const ui = await h.page.evaluate(() => ({
    scaleBox: !!document.getElementById('bd-charscale-box'),
    r15Box: !!document.getElementById('bd-r15-box'),
    radiusBox: !!document.getElementById('bd-radius-box'),
  }));
  say('에디터 UI: ' + JSON.stringify(ui));
  // 배율 변경 → 즉시 반영 + 저장 영속
  const scale = await h.page.evaluate(async () => {
    const inp = document.getElementById('bd-charscale-input');
    if (!inp) return { err: 'no input' };
    const before = window.BD_SPR;
    inp.value = '0.7';
    inp.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 700));
    const after = window.BD_SPR;
    await new Promise(r => setTimeout(r, 2000));   // 저장 디바운스 대기
    const K = 'bongdam_rpg_editor_data_v5_2_quest';
    let saved = null, savedAt = null, saveFn = typeof (window.BongdamEditor && BongdamEditor.save);
    try { const j = JSON.parse(localStorage.getItem(K) || '{}'); saved = j.__charScales || {}; savedAt = j.savedAt; } catch (e) { }
    // (v333) 전용 키 확인
    if (!Object.keys(saved).length) {
      try { saved = JSON.parse(localStorage.getItem('bd_char_scales_v332') || '{}'); savedAt = 'dedicated'; } catch (e) { }
    }
    // 원복
    inp.value = '';
    inp.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 500));
    return { before, after, saved, savedAt, saveFn };
  });
  say('배율 변경: ' + JSON.stringify(scale));
  const ok = ui.scaleBox && ui.r15Box && scale.after < scale.before && scale.saved && Number(scale.saved[Number(await h.page.evaluate(() => currentStage))]) === 0.7;
  say((ok ? '✅' : '❌') + ' 에디터 배율 입력·즉시 반영·저장 영속');
  await h.shot('r15_editor');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
