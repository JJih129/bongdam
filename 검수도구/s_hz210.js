// 210 갈라진 길 — 사람 경로(주민 부탁 전원 수락 → F) 검증
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
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 4; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(210, 0.5, 0.75);
  });
  await h.wait(2200);
  for (let t = 0; t < 200; t++) {
    const b = await h.page.evaluate(() => {
      const db = document.getElementById('dialogue-box');
      return !!(db && db.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!b) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  // 주민 전원 부탁 수락
  const res = await h.page.evaluate(() => (STAGES[210].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06, name: (o.npcName || o.label || '').slice(0, 8) })));
  say('주민 수: ' + res.length);
  for (const r of res) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(450); await h.page.keyboard.press('f'); await h.wait(500);
    for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(330); }
  }
  // 갈라진 길 게이트 + F
  const gate = await h.page.evaluate(() => {
    const o = (STAGES[210].objects || []).find(x => x && x.hazardId === 'ow210_crack_1');
    return { gate: o ? BD_hzQuestGate(o) : 'noObj', rx: o && +o.rx.toFixed(3), ry: o && +o.ry.toFixed(3) };
  });
  say('게이트: ' + JSON.stringify(gate));
  await h.page.evaluate(() => {
    const o = (STAGES[210].objects || []).find(x => x && x.hazardId === 'ow210_crack_1');
    heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.05) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(550); await h.page.keyboard.press('f'); await h.wait(700);
  let battle = false, sawChoice = false;
  for (let k = 0; k < 20 && !battle; k++) {
    const st = await h.page.evaluate(() => ({ choice: !!(window.__bdChoiceState && __bdChoiceState.open), hsr: !!(window.HSR && HSR.active) }));
    battle = st.hsr;
    if (st.choice) { sawChoice = true; await h.wait(450); await h.page.keyboard.press('Enter'); await h.wait(500); continue; }
    await h.page.keyboard.press(' '); await h.wait(350);
    if (k % 3 === 2) { await h.page.keyboard.press('f'); await h.wait(300); await h.page.keyboard.press('f'); await h.wait(300); }
  }
  say('선택창=' + sawChoice + ' 전투=' + battle + (battle ? ' ✅ 사람 경로 정상' : ' ❌ 추가 원인'));
  if (!battle) {
    const d = await h.page.evaluate(() => {
      const o = (STAGES[210].objects || []).find(x => x && x.hazardId === 'ow210_crack_1');
      let direct = null; try { direct = String(BD_hazardInteract(o)); } catch (e) { direct = 'err:' + String(e).slice(0, 60); }
      return { gate2: BD_hzQuestGate(o), direct };
    });
    say('진단: ' + JSON.stringify(d));
    await h.wait(1200);
    say('직접 후: ' + JSON.stringify(await h.page.evaluate(() => ({
      hsr: !!(window.HSR && HSR.active),
      dlg: (() => { const b = document.getElementById('dialogue-box'); return (b && b.getBoundingClientRect().height > 0) ? (b.textContent || '').replace(/\s+/g, ' ').slice(0, 50) : null; })(),
      toast: (() => { const t = document.getElementById('bd-toast'); return t ? (t.textContent || '').slice(0, 50) : null; })(),
    }))));
  }
  await h.shot('hz210');
};
