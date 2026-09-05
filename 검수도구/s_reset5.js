// 재시작 후 bd_map_skill_v283 재출현 시점 추적
module.exports = async (h) => {
  const { say } = h;
  // 1차 시작
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
    await h.wait(700);
  }
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  // 오염 (스킬 fan + 저장)
  await h.page.evaluate(() => {
    try { BD.unlockedSkills = ['sticker', 'fan']; bdSave(); } catch (e) { }
    try { if (typeof saveToSlot === 'function') saveToSlot(1); } catch (e) { }
  });
  await h.wait(2500);   // watchCores 1300ms tick 대기
  say('오염 후 키: ' + await h.page.evaluate(() => localStorage.getItem('bd_map_skill_v283')));
  say('전체 저장 키: ' + await h.page.evaluate(() => { const a = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/save|slot/i.test(k)) a.push(k); } return a.join(','); }));
  // 타이틀 → 재시작
  await h.page.evaluate(() => { try { BD_pauseToTitle(); } catch (e) { } });
  await h.wait(2000);
  await h.page.click('#bd-title-start', { timeout: 8000 });
  // 페이지3 조기 샘플링
  for (let k = 0; k < 24; k++) {
    const st = await h.page.evaluate(() => ({
      key: localStorage.getItem('bd_map_skill_v283'),
      skills: (window.BD && BD.unlockedSkills || []).join(','),
      save: !!localStorage.getItem('fantasyRPG_save'),
      modal: (() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); })(),
    })).catch(() => 'nav');
    say((k * 0.5).toFixed(1) + 's: ' + JSON.stringify(st));
    if (st && st.modal) { await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }).catch(() => { }); }
    await h.wait(500);
  }
};
