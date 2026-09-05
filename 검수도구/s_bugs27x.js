// ④⑤ 독립 검증 — 유령잠금 감시견 · 전투 HP 패널 위치
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[v357|\[v356/.test(t)) say('  콘솔: ' + t.slice(0, 100)); });
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
  await h.wait(2000);
  for (let t = 0; t < 40; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || !!(window.__bdChoiceState && __bdChoiceState.open);
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(450);
  }

  // ⑤ 전투 HP 패널
  await h.page.evaluate(() => {
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; window.__t5 = t.hazardId; }
    else window.__t5 = null;
  });
  const t5 = await h.page.evaluate(() => window.__t5);
  say('⑤ 대상: ' + t5);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
  for (let k = 0; k < 18; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(330);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(330); }
  }
  await h.wait(1200);
  const hp = await h.page.evaluate(() => {
    if (!(window.HSR && HSR.active)) return { battle: false };
    const u = document.getElementById('hsr-u-hero');
    const info = u && u.querySelector('.hsr-info');
    const spr = document.getElementById('hsr-hero-sprite');
    if (!info || !spr) return { battle: true, els: false };
    const ri = info.getBoundingClientRect(), rs = spr.getBoundingClientRect();
    return { battle: true, infoBottom: Math.round(ri.bottom), sprTop: Math.round(rs.top), above: ri.bottom <= rs.top + 30 };
  });
  say(((hp.battle && hp.above) ? '✅' : '❌') + ' ⑤ HP 패널 히어로 위 ' + JSON.stringify(hp));
  await h.shot('x_hp');
  await h.page.keyboard.press('Escape'); await h.wait(900);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }

  // ④ 유령잠금 — 대화·모달 완전 부재 확인 후 주입
  for (let t = 0; t < 20; t++) {
    const clean = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      const dlgVis = !!(b && b.getBoundingClientRect().height > 0);
      return !dlgVis && !document.querySelector('.bd-modal.show') && !(window.__bdChoiceState && __bdChoiceState.open) && !(window.HSR && HSR.active);
    });
    if (clean) break;
    await h.page.keyboard.press(' '); await h.wait(400);
    await h.page.keyboard.press('Escape'); await h.wait(300);
  }
  await h.page.evaluate(() => { __bdDlgOpenSet(true); });
  const b0 = await h.page.evaluate(() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } });
  say('④ 주입 blocked=' + b0);
  await h.wait(9000);
  const g2 = await h.page.evaluate(() => ({ dlgOpen: __bdDlgOpenGet(), blocked: BD_isInputBlocked() }));
  await h.page.keyboard.press('e'); await h.wait(900);
  const g3 = await h.page.evaluate(() => { const o = document.getElementById('inv-overlay'); return !!(o && o.classList.contains('open')); });
  say(((g2.dlgOpen === false && g2.blocked === false && g3) ? '✅' : '❌') + ` ④ 유령잠금 자동해제+E 인벤 (${JSON.stringify(g2)}, inv=${g3})`);
  say('콘솔 오류: ' + h.consoleErrors.length);
};
