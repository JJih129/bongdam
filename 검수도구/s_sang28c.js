// 상리 glass — BD_hazardInteract 직접 호출 격리 진단
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[선택\]|\[v35|error|Error/.test(t)) say('  콘솔: ' + t.slice(0, 120)); });
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
    BD.questIdx = 4; fadeToStage(213, 0.5, 0.5);
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
  const info = await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_glass_1');
    if (!o) return { err: '없음' };
    heroX = o.rx + (o.rw || 0.02) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY;
    return { keys: Object.keys(o).join(','), variant: o.hazardVariant, fam: o.hazardFamily, inter: o.interactable, opt: o.bdOptional, gone: o.__bdGone, wrapped: !!(window.BD_hazardInteract && BD_hazardInteract.__v356) };
  });
  say('obj: ' + JSON.stringify(info));
  await h.wait(500);
  const call = await h.page.evaluate(() => {
    try {
      const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_glass_1');
      const r = BD_hazardInteract(o);
      return { called: true, ret: String(r).slice(0, 40) };
    } catch (e) { return { err: String(e).slice(0, 200) }; }
  });
  say('직접 호출: ' + JSON.stringify(call));
  for (let k = 0; k < 10; k++) {
    await h.wait(420);
    const st = await h.page.evaluate(() => ({
      b: !!(window.HSR && HSR.active),
      c: !!(window.__bdChoiceState && __bdChoiceState.open),
      d: (() => { const x = document.getElementById('dialogue-box'); return (x && x.getBoundingClientRect().height > 0) ? (x.textContent || '').replace(/\s+/g, ' ').slice(0, 30) : null; })(),
    }));
    say('  t' + k + ': ' + JSON.stringify(st));
    if (st.c || st.b) break;
    if (st.d) await h.page.keyboard.press(' ');
  }
  await h.shot('sangc');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
