// 물러나기 직후 상태 원샷 진단 — HSR.active 잔존 여부
module.exports = async (h) => {
  const { say } = h;
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
  // bottle 전투 진입 → ESC 물러나기
  await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    heroX = o.rx + (o.rw || 0.02) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(1000);
  await h.page.keyboard.press('f');
  for (let k = 0; k < 12; k++) {
    await h.wait(420);
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open), d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
    if (st.b) break;
    if (st.c) { await h.wait(430); await h.page.keyboard.press('Enter'); continue; }
    if (st.d) await h.page.keyboard.press(' ');
  }
  say('전투: ' + await h.page.evaluate(() => !!(window.HSR && HSR.active)));
  await h.page.keyboard.press('Escape');
  // 이탈 후 12초간 1초 간격 상태 덤프
  for (let t = 0; t < 12; t++) {
    await h.wait(1000);
    const st = await h.page.evaluate(() => ({
      hsr: !!(window.HSR && HSR.active), state: window.HSR ? HSR.state : null,
      blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
      dlg: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })(),
      ov: (() => { const o = document.getElementById('dialogue-overlay'); return o ? (o.classList.contains('show') ? getComputedStyle(o).display : '-') : null; })(),
      choiceDisp: (() => { const c = document.getElementById('bd-choice'); return c ? getComputedStyle(c).display : null; })(),
      battleOn: document.body.classList.contains('bd-battle-on'),
    }));
    say('t+' + (t + 1) + 's: ' + JSON.stringify(st));
    if (st.dlg) await h.page.keyboard.press(' ');
    if (!st.blocked && !st.hsr) break;
  }
};
