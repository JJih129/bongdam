// 선택창 상태 정밀 덤프 — 확정 무시 원인
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const drain = async (n = 25) => {
    for (let t = 0; t < n; t++) {
      const open = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
      });
      if (!open) return;
      await h.page.keyboard.press(' '); await h.wait(420);
    }
  };
  await h.page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_dami_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_done', '1'); localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 2; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(213, 0.5, 0.5);
  });
  await h.wait(2200);
  await drain(35);
  const res = await h.page.evaluate(() => (STAGES[213].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  for (const r of res) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(450); await h.page.keyboard.press('f'); await h.wait(500);
    await drain(15);
  }
  await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(550); await h.page.keyboard.press('f'); await h.wait(900);
  const d1 = await h.page.evaluate(() => {
    const S = window.__bdChoiceState || {};
    return { open: S.open, idx: S.idx, items: (S.items || []).map(i => i.id), tOpen: S.tOpen && (Date.now() - S.tOpen), fArmed: S.fArmed, hasPick: typeof S.onPick };
  });
  say('열림 직후 상태: ' + JSON.stringify(d1));
  const d2 = await h.page.evaluate(() => {
    let err = null;
    try { BD_choiceConfirm(); } catch (e) { err = String(e).slice(0, 140); }
    const S = window.__bdChoiceState || {};
    return { err, openAfter: S.open, idx: S.idx };
  });
  say('confirm 직후: ' + JSON.stringify(d2));
  await h.wait(1500);
  const d3 = await h.page.evaluate(() => {
    const S = window.__bdChoiceState || {};
    const b = document.getElementById('dialogue-box');
    return { open: S.open, hsr: !!(window.HSR && HSR.active), dlg: (b && b.getBoundingClientRect().height > 0) ? (b.textContent || '').replace(/\s+/g, ' ').slice(0, 50) : null };
  });
  say('1.5초 후: ' + JSON.stringify(d3));
  // 대사 진행시켜 전투까지
  for (let k = 0; k < 15; k++) {
    const st = await h.page.evaluate(() => ({ hsr: !!(window.HSR && HSR.active), }));
    if (st.hsr) { say('✅ 전투 진입 (k=' + k + ')'); break; }
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  const fin = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('최종 전투: ' + fin);
  await h.shot('invest3');
};
