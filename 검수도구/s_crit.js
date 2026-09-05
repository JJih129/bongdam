// 치명 2건 — 동화리 조사→전투 미진입 · 인벤 재오픈 투명
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[선택\]|\[전투\]|error/i.test(t)) say('  콘솔: ' + t.slice(0, 120)); });
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
        const m = document.querySelector('.bd-modal.show');
        return { open: !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c || !!m, choice: c, modal: !!m };
      });
      if (!st.open) return;
      if (st.modal) { await h.page.keyboard.press('Escape'); await h.wait(400); continue; }
      if (st.choice) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  };

  // ══ ① 인벤 재오픈 (게임 초기에 바로) ══
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000);
  await drain(30);
  const invDump = async (tag) => {
    const d = await h.page.evaluate(() => {
      const ov = document.getElementById('inv-overlay');
      const panel = ov && ov.firstElementChild;
      const cs = ov ? getComputedStyle(ov) : null;
      const csP = panel ? getComputedStyle(panel) : null;
      return {
        cls: ov ? String(ov.className) : null,
        disp: cs && cs.display, op: cs && cs.opacity, vis: cs && cs.visibility, z: cs && cs.zIndex,
        panelDisp: csP && csP.display, panelOp: csP && csP.opacity, panelBg: csP && csP.backgroundColor,
        rect: ov ? (r => [Math.round(r.width), Math.round(r.height)])(ov.getBoundingClientRect()) : null,
        gridKids: (document.getElementById('inv-grid') || { children: [] }).children.length,
      };
    });
    say(tag + ': ' + JSON.stringify(d));
    return d;
  };
  await h.page.keyboard.press('e'); await h.wait(900);
  const o1 = await invDump('① 1차 오픈');
  await h.shot('crit_inv1');
  await h.page.keyboard.press('e'); await h.wait(700);   // 닫기
  await h.page.keyboard.press('e'); await h.wait(900);   // 재오픈
  const o2 = await invDump('① 2차 오픈');
  await h.shot('crit_inv2');
  say((o2.disp !== 'none' && Number(o2.op) > 0.5 && o2.panelOp !== '0' ? '✅' : '❌') + ' ① 인벤 재오픈 표시');
  await h.page.keyboard.press('Escape'); await h.wait(500);

  // ══ ② 동화리 조사→전투 ══
  await h.page.evaluate(() => {
    BD.questIdx = 3; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(211, 0.5, 0.6);
  });
  await h.wait(2000);
  for (let t = 0; t < 200; t++) {
    const b = await h.page.evaluate(() => {
      const db = document.getElementById('dialogue-box');
      return !!(db && db.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!b) break;
    await h.page.keyboard.press(' '); await h.wait(450);
  }
  // 주민 부탁 전원
  const res = await h.page.evaluate(() => (STAGES[211].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  say('② 주민 수: ' + res.length);
  for (const r of res) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(350);
    await h.page.keyboard.press('f'); await h.wait(420); await h.page.keyboard.press('f'); await h.wait(420);
    await drain(15);
  }
  // 스파이
  await h.page.evaluate(() => {
    window.__spy = { startHZ: 0, err: null, showDialog: 0 };
    if (typeof window.startHazardBattle === 'function' && !window.startHazardBattle.__spy) {
      const o = window.startHazardBattle;
      window.startHazardBattle = function () { window.__spy.startHZ++; try { return o.apply(this, arguments); } catch (e) { window.__spy.err = String(e).slice(0, 200); throw e; } };
      window.startHazardBattle.__spy = true;
    }
    if (typeof window.showDialog === 'function' && !window.showDialog.__spy) {
      const o2 = window.showDialog;
      window.showDialog = function () { window.__spy.showDialog++; return o2.apply(this, arguments); };
      window.showDialog.__spy = true;
    }
  });
  // 게이트 상태 + 각 위험요소 시도
  const hzList = await h.page.evaluate(() => (STAGES[211].objects || []).filter(x => x && x.hazardId && !x.__bdGone && !(BD.purified || {})[x.hazardId])
    .map(o => ({ id: o.hazardId, rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.05, gate: (() => { try { return BD_hzQuestGate(o); } catch (e) { return 'err'; } })() })));
  say('② 위험요소: ' + JSON.stringify(hzList.map(z => ({ id: z.id, gate: z.gate }))));
  let entered = false;
  for (const z of hzList) {
    await h.page.evaluate((p) => { heroX = p.rx + p.rw / 2; heroY = p.ry + p.rh + 0.012; camX = heroX; camY = heroY; }, z);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(650);
    // 선택창 대기 → Enter 확정 → 진행
    for (let k = 0; k < 16; k++) {
      const st = await h.page.evaluate(() => ({ c: !!(window.__bdChoiceState && __bdChoiceState.open), b: !!(window.HSR && HSR.active), spy: window.__spy }));
      if (st.b) { entered = true; break; }
      if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
      await h.page.keyboard.press(' '); await h.wait(330);
      if (k % 4 === 3) { await h.page.keyboard.press('f'); await h.wait(330); }
    }
    const spy = await h.page.evaluate(() => window.__spy);
    say('  ' + z.id + ' → 전투=' + entered + ' spy=' + JSON.stringify(spy));
    await h.shot('crit_' + z.id);
    if (entered) break;
  }
  say((entered ? '✅' : '❌') + ' ② 동화리 조사→전투');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
