// 라운드 10 검증 — 구조 요청·터치 지도 버튼·호버 툴팁 + 잠금 상태 탈출
module.exports = async (h) => {
  const { say } = h;
  const touch = process.env.TOUCH === '1';
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
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  if (touch) {
    // 터치 지도 버튼
    let btn = null;
    for (let t = 0; t < 8 && !btn; t++) { await h.wait(700); btn = await h.page.evaluate(() => { const b = document.getElementById('bd-touch-mapbtn'); if (!b || b.style.display === 'none') return null; const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }); }
    say('터치 지도 버튼: ' + JSON.stringify(btn));
    if (btn) {
      const top = await h.page.evaluate((b) => (document.elementFromPoint(b.x, b.y) || {}).id || 'other', { x: btn.x + btn.w / 2, y: btn.y + btn.h / 2 });
      say('탭 지점 최상위: ' + top);
      await h.page.touchscreen.tap(btn.x + btn.w / 2, btn.y + btn.h / 2);
      await h.wait(1200);
      let open = await h.page.evaluate(() => { const e = document.getElementById('bd-map-v283'); return !!(e && e.style.display !== 'none' && e.getBoundingClientRect().height > 100); });
      say('안전지도 열림(탭): ' + open);
      if (!open) {
        await h.page.evaluate(() => { BD_openSafetyMap(); });
        await h.wait(900);
        open = await h.page.evaluate(() => { const e = document.getElementById('bd-map-v283'); return !!(e && e.style.display !== 'none' && e.getBoundingClientRect().height > 100); });
        say('안전지도 열림(직접): ' + open);
      }
      await h.shot('r10_touch_map');
    }
    return;
  }

  // PC — 호버 툴팁: 와우약국 앞으로 이동해 그 사각형 중앙에 마우스
  const pt = await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l && l.facilityId === 'wawoo_pharmacy');
    if (!lm) return null;
    heroX = Number(lm.rx) + Number(lm.rw) / 2; heroY = Number(lm.ry) + Number(lm.rh) + 0.03;
    camX = heroX; camY = heroY;
    return { label: lm.label };
  });
  await h.wait(600);
  const pos = await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l && l.facilityId === 'wawoo_pharmacy');
    const r = BD_screenRectOfWorld(Number(lm.rx), Number(lm.ry), Number(lm.rw), Number(lm.rh));
    return r ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null;
  });
  if (pos) { pt.x = pos.x; pt.y = pos.y; }
  say('호버 대상: ' + JSON.stringify(pt));
  if (pt) {
    await h.page.mouse.move(pt.x, pt.y); await h.wait(300);
    await h.page.mouse.move(pt.x + 2, pt.y + 2); await h.wait(400);
    const tip = await h.page.evaluate(() => { const e = document.getElementById('bd-hover-tip'); return e && e.style.display !== 'none' ? e.textContent : null; });
    say('툴팁: ' + JSON.stringify(tip));
    await h.shot('r10_hover');
  }

  // 잠금 상태 시뮬레이션 → ESC → 구조 요청
  await h.page.evaluate(() => {
    window.__bdSceneActive = true;
    const ov = document.getElementById('dialogue-overlay'); if (ov) ov.style.display = 'flex';
    heroX = 0.9; heroY = 0.9;
  });
  await h.wait(400);
  await h.page.keyboard.press('Escape'); await h.wait(800);
  const pauseOpen = await h.page.evaluate(() => { const m = document.getElementById('bd-pause-modal'); return !!(m && m.classList.contains('show')); });
  say('일시정지 열림: ' + pauseOpen);
  await h.shot('r10_pause');
  const hasRescue = await h.page.evaluate(() => !![...document.querySelectorAll('#bd-pause-modal button')].find(b => /구조 요청/.test(b.textContent || '')));
  say('구조 버튼 존재: ' + hasRescue);
  await h.page.evaluate(() => { const b = [...document.querySelectorAll('#bd-pause-modal button')].find(x => /구조 요청/.test(x.textContent || '')); if (b) b.click(); });
  await h.wait(1000);
  const after = await h.page.evaluate(() => ({
    hero: [+Number(heroX).toFixed(3), +Number(heroY).toFixed(3)],
    scene: !!window.__bdSceneActive,
    ovl: (() => { const e = document.getElementById('dialogue-overlay'); return e ? getComputedStyle(e).display : '-'; })(),
    blocked: !!(window.BD_isInputBlocked && BD_isInputBlocked()),
  }));
  say('구조 후: ' + JSON.stringify(after));
  const flags = await h.page.evaluate(() => ({
    paused: typeof _bdPaused !== 'undefined' ? _bdPaused : 'n/a',
    dlgOpen: typeof dialogueOpen !== 'undefined' ? dialogueOpen : 'n/a',
    trans: typeof transitioning !== 'undefined' ? transitioning : 'n/a',
    pauseShow: (() => { const m = document.getElementById('bd-pause-modal'); return !!(m && m.classList.contains('show')); })(),
  }));
  say('엔진 플래그: ' + JSON.stringify(flags));
  const p0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.hold('d', 500);
  const p1 = await h.page.evaluate(() => [heroX, heroY]);
  say('이동 가능(키): ' + (Math.abs(p1[0] - p0[0]) > 0.001));
  // 물리 격리: moveKeys 직접 설정
  await h.page.evaluate(() => { moveKeys.d = true; });
  await h.wait(500);
  await h.page.evaluate(() => { moveKeys.d = false; });
  const p2 = await h.page.evaluate(() => [heroX, heroY]);
  say('이동 가능(직접): ' + (Math.abs(p2[0] - p1[0]) > 0.001));
  await h.shot('r10_rescued');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
