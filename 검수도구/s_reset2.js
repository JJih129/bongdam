// 재시작 클릭의 실제 동작 계측 — 리로드 여부·퍼지 여부·freeze 동작
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
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // 오염
  await h.page.evaluate(() => {
    try { BD_markPurified('ow212_trash_1'); } catch (e) { }
    try { playerGold = 777; bdSave(); } catch (e) { }
    try { localStorage.setItem('bd_map_skill_v283', JSON.stringify({ wawoo: 1 })); } catch (e) { }
  });
  await h.wait(800);
  const pre = await h.page.evaluate(() => ({
    freshAt: sessionStorage.getItem('bd_fresh_at'), now: Date.now(),
    hookOnBtn: (() => { const b = document.getElementById('bd-title-start'); return b ? !!b.__bdFresh : null; })(),
    save40: String(localStorage.getItem('fantasyRPG_save') || '').slice(0, 60),
  }));
  say('오염 후: ' + JSON.stringify(pre));

  // 타이틀 복귀
  await h.page.evaluate(() => { try { BD_pauseToTitle(); } catch (e) { } });
  await h.wait(2500);
  const t1 = await h.page.evaluate(() => {
    window.__pageMark = 'ALIVE';
    const b = document.getElementById('bd-title-start');
    return { title: !!(b && b.offsetWidth > 0), hook: b ? !!b.__bdFresh : null, freshAge: Date.now() - Number(sessionStorage.getItem('bd_fresh_at') || 0) };
  });
  say('타이틀 상태: ' + JSON.stringify(t1));

  // 재시작 클릭
  await h.page.click('#bd-title-start', { timeout: 8000 });
  await h.wait(1200);
  for (let k = 0; k < 10; k++) {
    const st = await h.page.evaluate(() => ({
      mark: window.__pageMark || null,   // null이면 리로드됨
      save: String(localStorage.getItem('fantasyRPG_save') || '(없음)').slice(0, 60),
      mapSkill: localStorage.getItem('bd_map_skill_v283') || '(없음)',
      freeze: !!window.__bdFreezeStore,
      title: (() => { const b = document.getElementById('bd-title-start'); return !!(b && b.offsetWidth > 0); })(),
      modal: (() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); })(),
    })).catch(() => 'navigating');
    say(k + 's: ' + JSON.stringify(st));
    await h.wait(1000);
  }
};
