// 필드 고정(fixed) HUD 전수 나열 — LD 대화 중 가릴 대상 식별
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const list = await h.page.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(el => {
      try {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') return;
        if (el.offsetWidth === 0 && el.offsetHeight === 0) return;
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width < 20 || r.height < 14) return;
        // 최상위 fixed만 (fixed 조상 있는 건 생략)
        let p = el.parentElement, nested = false;
        while (p && p !== document.body) { if (getComputedStyle(p).position === 'fixed') { nested = true; break; } p = p.parentElement; }
        if (nested) return;
        out.push({ id: el.id || ('.' + String(el.className).split(' ')[0]), z: cs.zIndex, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], txt: (el.textContent || '').replace(/\s+/g, ' ').slice(0, 24) });
      } catch (e) { }
    });
    return out;
  });
  list.forEach(x => say(JSON.stringify(x)));
  // VN 대화 열어 실제 겹침 확인 스크린샷
  await h.page.evaluate(() => {
    try { showDialog('사서 도현', ['LD 레이어 확인용 대사입니다. HUD가 이 위에 겹치는지 확인.']); } catch (e) { }
  });
  await h.wait(1200);
  await h.shot('hud_vn_overlap');
};
