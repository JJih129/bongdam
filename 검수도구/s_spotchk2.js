// 211 y0.25 이동 0 원인 — 상태 덤프
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 3; fadeToStage(211, 0.45, 0.75);
  });
  await h.wait(2200);
  for (let t = 0; t < 30; t++) {
    const b = await h.page.evaluate(() => {
      const db = document.getElementById('dialogue-box');
      return !!(db && db.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!b) break;
    await h.page.keyboard.press(' '); await h.wait(450);
  }
  await h.page.evaluate(() => { heroX = 0.12; heroY = 0.25; camX = heroX; camY = heroY; });
  await h.wait(600);
  const pre = await h.page.evaluate(() => ({
    blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
    dlg: (() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); })(),
    choice: !!(window.__bdChoiceState && __bdChoiceState.open),
    tut: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()),
    damiBusy: !!window.__bdDamiOpeningBusy,
    colE: (() => { try { return _collidesAt(heroX + 0.01, heroY); } catch (e) { return 'err'; } })(),
  }));
  say('사전: ' + JSON.stringify(pre));
  const x0 = await h.page.evaluate(() => heroX);
  await h.hold('d', 900);
  const x1 = await h.page.evaluate(() => heroX);
  say('Δ=' + (x1 - x0).toFixed(4));
  await h.shot('spot211');
};
