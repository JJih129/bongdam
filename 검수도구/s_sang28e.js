// 상리 glass — 고해상도 계측: showDialog·choice DOM·flags 100ms 추적
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[SPY|\[선택|\[v35/.test(t)) say('  콘솔: ' + t.slice(0, 130)); });
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
  await h.page.evaluate(() => {
    window.__SPYLOG = [];
    const L = (m) => { window.__SPYLOG.push(Date.now() % 100000 + ' ' + m); };
    if (window.showDialog && !showDialog.__spy) {
      const o = window.showDialog;
      window.showDialog = function (name, lines, cb) { L('showDialog ' + name + ' n=' + (Array.isArray(lines) ? lines.length : typeof lines)); return o.apply(this, arguments); };
      window.showDialog.__spy = true;
    }
    for (const fn of ['showInteractChoice', 'BD_showChoice', 'BD_openChoice']) {
      if (typeof window[fn] === 'function' && !window[fn].__spy) {
        const o2 = window[fn];
        window[fn] = function () { L(fn + ' called ' + String(arguments[0]).slice(0, 20)); return o2.apply(this, arguments); };
        window[fn].__spy = true;
      } else { L(fn + ' = ' + typeof window[fn]); }
    }
    L('interact wrapped v356=' + !!(window.BD_hazardInteract && BD_hazardInteract.__v356));
    // 위치 세팅
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_glass_1');
    heroX = o.rx + (o.rw || 0.02) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  // 직접 호출 + 100ms 스냅샷
  await h.page.evaluate(() => {
    const snap = [];
    window.__SNAPS = snap;
    let n = 0;
    const iv = setInterval(() => {
      const d = document.getElementById('dialogue-box');
      const ch = document.getElementById('bd-choice');
      snap.push({
        t: n * 100,
        dlg: d ? Math.round(d.getBoundingClientRect().height) : -1,
        chDisp: ch ? getComputedStyle(ch).display : 'no-el',
        chOpen: !!(window.__bdChoiceState && __bdChoiceState.open),
        dlgFlag: (() => { try { return __bdDlgOpenGet(); } catch (e) { return '?'; } })(),
      });
      if (++n > 25) clearInterval(iv);
    }, 100);
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_glass_1');
    try { BD_hazardInteract(o); window.__SPYLOG.push('CALL done'); } catch (e) { window.__SPYLOG.push('CALL err ' + String(e).slice(0, 120)); }
  });
  await h.wait(3200);
  const out = await h.page.evaluate(() => ({ log: window.__SPYLOG, snaps: window.__SNAPS.filter((s, i) => i < 4 || s.dlg > 0 || s.chOpen || s.chDisp !== window.__SNAPS[0].chDisp || s.dlgFlag !== window.__SNAPS[0].dlgFlag) }));
  say('SPY: ' + JSON.stringify(out.log));
  say('SNAPS: ' + JSON.stringify(out.snaps).slice(0, 700));
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
