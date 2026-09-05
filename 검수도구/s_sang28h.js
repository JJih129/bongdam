// bottle에서 F 1회 — v362 체크 재현 + interact 호출 카운터 + 확정 후 미진입 추적(알레이)
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[선택|\[v3|SPY/.test(t)) say('  콘솔: ' + t.slice(0, 130)); });
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
    const pr = (window.BD_hzQuestMap ? BD_hzQuestMap(213) : []) || [];
    const s = JSON.parse(localStorage.getItem('bd_hzquest_v57') || '{}');
    pr.forEach(p => { s[p.id] = 'a'; });
    localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
    fadeToStage(213, 0.5, 0.5);
  });
  await h.wait(2000);
  for (let t = 0; t < 45; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || !!(window.__bdChoiceState && __bdChoiceState.open);
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  // interact 호출 카운터 + bottle 위치
  await h.page.evaluate(() => {
    const o0 = window.BD_hazardInteract;
    window.__hiCount = 0;
    window.BD_hazardInteract = function () { window.__hiCount++; console.log('SPY interact#' + window.__hiCount + ' ' + (arguments[0] && arguments[0].hazardId)); return o0.apply(this, arguments); };
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    heroX = o.rx + (o.rw || 0.02) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(1200); // 쿨다운 여유
  const pre = await h.page.evaluate(() => {
    // v362 체크 재현
    const st = STAGES[Number(currentStage)];
    const o = (st.objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    let gate = null, gateErr = null;
    try { gate = BD_hzQuestGate(o); } catch (e) { gateErr = String(e).slice(0, 120); }
    const L = (o.rx || 0) - 0.05, R = (o.rx || 0) + (o.rw || 0.04) + 0.05;
    const dy = heroY - ((o.ry || 0) + (o.rh || 0.05));
    return {
      stage: Number(currentStage), inX: heroX >= L && heroX <= R, dy: +dy.toFixed(3),
      gate, gateErr, pur: !!(BD.purified || {})['ow213_bottle_1'],
      hidden: !!o.hidden, gone: !!o.__bdGone,
      scrRect: (() => { try { const r = BD_screenRectOfWorld(o.rx, o.ry, o.rw || 0.02, o.rh || 0.05); return r ? [Math.round(r.width), Math.round(r.height)] : null; } catch (e) { return 'err'; } })(),
    };
  });
  say('사전 체크: ' + JSON.stringify(pre));
  await h.page.keyboard.press('f');
  await h.wait(1600); // v362 750ms + interact 여유
  const post = await h.page.evaluate(() => ({
    hi: window.__hiCount,
    choice: !!(window.__bdChoiceState && __bdChoiceState.open),
    dlg: (() => { const d = document.getElementById('dialogue-box'); return (d && d.getBoundingClientRect().height > 0) ? (d.textContent || '').replace(/\s+/g, ' ').slice(0, 30) : null; })(),
    retryT: !!window.__bdFRetryT,
  }));
  say('F 후: ' + JSON.stringify(post));
  await h.shot('h_bottle');
  // 선택창 열렸으면 확정 추적
  if (post.choice) {
    await h.wait(450); await h.page.keyboard.press('Enter');
    for (let k = 0; k < 12; k++) {
      await h.wait(420);
      const st = await h.page.evaluate(() => ({
        b: !!(window.HSR && HSR.active),
        d: (() => { const x = document.getElementById('dialogue-box'); return (x && x.getBoundingClientRect().height > 0) ? (x.textContent || '').replace(/\s+/g, ' ').slice(0, 26) : null; })(),
      }));
      say('  t' + k + ': ' + JSON.stringify(st));
      if (st.b) break;
      if (st.d) await h.page.keyboard.press(' ');
    }
  }
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
