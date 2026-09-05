// 와우리 (0.90,0.71) 40FPS 핫스팟 — 주변 오브젝트·렌더 요소 실측
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.90, 0.71);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const info = await h.page.evaluate(() => {
    const st = STAGES[212];
    const near = (st.objects || []).filter(o => o && Math.abs((o.rx || 0) + (o.rw || 0) / 2 - 0.90) < 0.14 && Math.abs((o.ry || 0) + (o.rh || 0) / 2 - 0.71) < 0.14)
      .map(o => ({ t: o.type, l: (o.label || '').slice(0, 14), key: (o.key || '').slice(0, 28), anim: !!(o.animated || o.anim), w: +(o.rw || 0).toFixed(3) }));
    const lms = (st.__v24Landmarks || []).filter(l => l && Math.abs(Number(l.rx) + Number(l.rw) / 2 - 0.90) < 0.14 && Math.abs(Number(l.ry) + Number(l.rh) / 2 - 0.71) < 0.14).length;
    return { objN: near.length, lms, near: near.slice(0, 20) };
  });
  say('핫스팟 주변: ' + JSON.stringify(info, null, 1).slice(0, 1500));
  await h.shot('hotspot');
  // 대조: 빠른 지점 (0.5,0.5) 오브젝트 수
  const ref = await h.page.evaluate(() => (STAGES[212].objects || []).filter(o => o && Math.abs((o.rx || 0) + (o.rw || 0) / 2 - 0.5) < 0.14 && Math.abs((o.ry || 0) + (o.rh || 0) / 2 - 0.5) < 0.14).length);
  say('대조(0.5,0.5) 오브젝트 수: ' + ref);
};
