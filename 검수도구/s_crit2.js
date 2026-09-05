// 치명 2건 변형 재현 — 마우스 조사한다 클릭 · 인벤 닫기 방식별
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
  const drain = async (n = 25) => {
    for (let t = 0; t < n; t++) {
      const st = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        return { open: !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c, choice: c };
      });
      if (!st.open) return;
      if (st.choice) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  };
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });

  // ══ ① 인벤 변형: X버튼 닫기 → 재오픈 / 탭 전환 후 X → 재오픈 / 장난감 후 → 재오픈 ══
  await h.page.evaluate(() => { fadeToStage(212, 0.5, 0.55); });
  await h.wait(1800); await drain(25);
  const invState = async () => await h.page.evaluate(() => {
    const ov = document.getElementById('inv-overlay');
    const cs = ov ? getComputedStyle(ov) : null;
    const panel = ov && ov.firstElementChild;
    const csP = panel ? getComputedStyle(panel) : null;
    // 실제 보이는지: 패널 중심점의 최상위 요소가 패널 계열인지
    let topAt = null;
    if (panel) { const r = panel.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); topAt = el ? (el.id || el.className || el.tagName).toString().slice(0, 30) : null; }
    return { cls: ov && String(ov.className), disp: cs && cs.display, op: cs && cs.opacity, pDisp: csP && csP.display, pOp: csP && csP.opacity, topAt };
  });
  // (a) X 버튼 닫기
  await h.page.keyboard.press('e'); await h.wait(800);
  await h.page.evaluate(() => { const x = document.querySelector('#inv-overlay button, #inv-overlay .inv-close, [onclick*="closeInventory"]'); if (x) x.click(); });
  await h.wait(600);
  await h.page.keyboard.press('e'); await h.wait(900);
  const a1 = await invState();
  say('①a X닫기→재오픈: ' + JSON.stringify(a1));
  await h.shot('c2_inv_a');
  await h.page.keyboard.press('Escape'); await h.wait(500);
  // (b) 탭 전환(장비) 후 ESC 닫기 → 재오픈
  await h.page.keyboard.press('e'); await h.wait(800);
  await h.page.evaluate(() => { const tb = [...document.querySelectorAll('.inv-tab')].find(b => /장비/.test(b.textContent || '')); if (tb) tb.click(); });
  await h.wait(600);
  await h.page.keyboard.press('Escape'); await h.wait(600);
  await h.page.keyboard.press('e'); await h.wait(900);
  const b1 = await invState();
  say('①b 장비탭+ESC→재오픈: ' + JSON.stringify(b1));
  await h.shot('c2_inv_b');
  await h.page.keyboard.press('Escape'); await h.wait(500);
  // (c) 장난감 사용 후 닫기 → 재오픈
  await h.page.evaluate(async () => {
    playerInventory['qa_toy'] = { item: { id: 'qa_toy', name: '딱지', icon: '🃏', tab: 'misc' }, count: 1 };
    openInventory();
  });
  await h.wait(700);
  await h.page.evaluate(() => { selectInvItem && selectInvItem('qa_toy'); });
  await h.wait(900);
  await h.page.evaluate(() => { const b = document.getElementById('bd-toy-btn'); if (b) b.click(); });
  await h.wait(800);
  await h.page.keyboard.press('e'); await h.wait(600);
  await h.page.keyboard.press('e'); await h.wait(900);
  const c1 = await invState();
  say('①c 장난감 사용→재오픈: ' + JSON.stringify(c1));
  await h.shot('c2_inv_c');
  await h.page.keyboard.press('Escape'); await h.wait(500);

  // ══ ② 동화리 — 마우스로 «조사한다» 클릭 → 마우스 클릭으로만 진행 ══
  await h.page.evaluate(() => {
    BD.questIdx = 3; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(211, 0.5, 0.6);
  });
  await h.wait(1800);
  for (let t = 0; t < 200; t++) {
    const b = await h.page.evaluate(() => {
      const db = document.getElementById('dialogue-box');
      return !!(db && db.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!b) break;
    await h.page.keyboard.press(' '); await h.wait(450);
  }
  const res = await h.page.evaluate(() => (STAGES[211].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  for (const r of res) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(350);
    await h.page.keyboard.press('f'); await h.wait(420); await h.page.keyboard.press('f'); await h.wait(420);
    await drain(15);
  }
  await h.page.evaluate(() => {
    const list = (STAGES[211].objects || []).filter(x => x && x.hazardId && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    const t = list[0];
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; window.__critHz = t.hazardId; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f');
  // 선택창 열림 대기
  let opened = false;
  for (let k = 0; k < 10 && !opened; k++) { await h.wait(500); opened = await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open)); if (!opened) { await h.page.keyboard.press(' '); } }
  say('② 선택창: ' + opened);
  if (opened) {
    await h.wait(600);
    const rect = await h.page.evaluate(() => {
      const rows = document.querySelectorAll('#bd-choice .bd-choice-row');
      const inv = [...rows].find(r => /조사한다/.test(r.textContent || ''));
      if (!inv) return null;
      const b = inv.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    });
    say('② 조사한다 rect: ' + JSON.stringify(rect));
    if (rect) {
      await h.page.mouse.click(rect.x, rect.y);
      // 이후 마우스 클릭만으로 진행 (화면 중앙 클릭 = 대사 넘기기)
      for (let k = 0; k < 14; k++) {
        await h.wait(600);
        const st = await h.page.evaluate(() => ({
          b: !!(window.HSR && HSR.active),
          dlg: (() => { const d = document.getElementById('dialogue-box'); return (d && d.getBoundingClientRect().height > 0) ? (d.textContent || '').replace(/\s+/g, ' ').slice(0, 34) : null; })(),
          c: !!(window.__bdChoiceState && __bdChoiceState.open),
        }));
        say('  m' + k + ': ' + JSON.stringify(st));
        if (st.b) break;
        await h.page.mouse.click(640, 500);
      }
      const fin = await h.page.evaluate(() => !!(window.HSR && HSR.active));
      say((fin ? '✅' : '❌') + ' ② 마우스 조사한다→전투');
      await h.shot('c2_invest');
    }
  }
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
