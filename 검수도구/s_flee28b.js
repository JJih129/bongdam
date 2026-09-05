// BD_onFlee 직접 호출 판별 (+ 클릭 차단막 탐지)
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
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2200);
  for (let t = 0; t < 45; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || !!(window.__bdChoiceState && __bdChoiceState.open);
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  await h.page.evaluate(() => {
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(900);
  await h.page.keyboard.press('f');
  for (let k = 0; k < 12; k++) {
    await h.wait(420);
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open), d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
    if (st.b) break;
    if (st.c) { await h.wait(430); await h.page.keyboard.press('Enter'); continue; }
    if (st.d) await h.page.keyboard.press(' ');
  }
  say('전투: ' + await h.page.evaluate(() => !!(window.HSR && HSR.active)));
  for (let i = 0; i < 8; i++) {
    const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
    if (!d) break;
    await h.page.keyboard.press(' '); await h.wait(400);
  }
  const pre = await h.page.evaluate(() => {
    const b = document.querySelector('.hsr-act.hsr-flee');
    const r = b ? b.getBoundingClientRect() : null;
    const topEl = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return {
      fleeType: typeof window.BD_onFlee,
      state: HSR.state,
      bound364: b ? !!b.__bd364 : null,
      topAtFlee: topEl ? (topEl.id || topEl.className || topEl.tagName).toString().slice(0, 40) : null,
      fleeIsTop: topEl === b || (b && b.contains(topEl)),
    };
  });
  say('사전: ' + JSON.stringify(pre));
  const call = await h.page.evaluate(() => { try { BD_onFlee(); return 'ok'; } catch (e) { return String(e).slice(0, 150); } });
  say('직접 호출: ' + call);
  for (let t = 0; t < 5; t++) {
    await h.wait(1000);
    const st = await h.page.evaluate(() => ({ hsr: !!(window.HSR && HSR.active), dlg: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
    say('t+' + (t + 1) + 's: ' + JSON.stringify(st));
    if (st.dlg) await h.page.keyboard.press(' ');
    if (!st.hsr) { say('✅ BD_onFlee 직접 호출로 전투 종료'); break; }
  }
};
