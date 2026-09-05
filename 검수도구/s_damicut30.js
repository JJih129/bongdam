// v366 검증 — 오프닝 중 조사 → 잔여 대사 폐기(busy 해제) · 전투 후 뒷북 대사 없음
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[v366|\[v356/.test(t)) say('  콘솔: ' + t.slice(0, 100)); });
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 4;
    const pr = (window.BD_hzQuestMap ? BD_hzQuestMap(212) : []) || [];
    const s = JSON.parse(localStorage.getItem('bd_hzquest_v57') || '{}');
    pr.forEach(p => { s[p.id] = 'a'; });
    localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(1800);
  // 프롤로그 VN만 소화 (오프닝 busy는 유지되도록 — dlg 없고 busy true 시점 포착)
  for (let t = 0; t < 30; t++) {
    const st = await h.page.evaluate(() => ({
      d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })(),
      busy: !!window.__bdDamiOpeningBusy,
    }));
    if (!st.d && st.busy) break;
    if (st.d) await h.page.keyboard.press(' ');
    await h.wait(400);
  }
  const b0 = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
  say('오프닝 busy=' + b0 + ' 상태에서 조사 개시');
  await h.page.evaluate(() => {
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(300);
  await h.page.keyboard.press('f');
  // 선택→확정→전투
  let entered = false;
  for (let k = 0; k < 14; k++) {
    await h.wait(420);
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open), d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
    if (st.b) { entered = true; break; }
    if (st.c) { await h.wait(430); await h.page.keyboard.press('Enter'); continue; }
    if (st.d) await h.page.keyboard.press(' ');
  }
  say('전투 진입: ' + entered);
  await h.wait(1500);
  const b1 = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
  say((b1 === false ? '✅' : '❌') + ' 상호작용 후 오프닝 시퀀스 폐기(busy 해제)');
  // 물러나기 → 8초간 뒷북 오프닝 말풍선 감시
  await h.page.evaluate(() => { const b = document.querySelector('.hsr-act.hsr-flee'); if (b) b.click(); });
  await h.wait(1200);
  for (let i = 0; i < 6; i++) {
    const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
    if (!d) break;
    await h.page.keyboard.press(' '); await h.wait(350);
  }
  let ghostLines = [];
  for (let t = 0; t < 8; t++) {
    await h.wait(1000);
    const bb = await h.page.evaluate(() => {
      const b = document.getElementById('bd-dami-bubble');
      return (b && b.classList.contains('on')) ? (b.textContent || '').replace(/\s+/g, ' ').slice(0, 40) : null;
    });
    if (bb && /지도|밖으로 나오니까|아끼는 마음|빈칸/.test(bb)) ghostLines.push(bb);
  }
  say((ghostLines.length === 0 ? '✅' : '❌') + ' 전투 후 뒷북 오프닝 대사 없음 ' + JSON.stringify(ghostLines));
  say('콘솔 오류: ' + h.consoleErrors.length);
};
