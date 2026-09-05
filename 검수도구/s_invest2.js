// 상리 술병: 조사 확정 → 전투 체인 스파이 계측
module.exports = async (h) => {
  const { say } = h;
  h.page.on('console', m => { const t = m.text(); if (/\[선택\]|\[전투\]|hazard/i.test(t)) say('  콘솔: ' + t.slice(0, 110)); });
  await h.click('#bd-title-start'); await h.wait(1500);
  // (v326 부팅) 리로드+자동클릭 흐름 — 타이틀 버튼이 사라질 때까지 대기
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
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });   // 퍼지 훅 우회 직접 시작
    await h.wait(700);
  }
  // 전환 프레임(타이틀 숨김→모달 표시 사이) 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  const drain = async (n = 25) => {
    for (let t = 0; t < n; t++) {
      const open = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
      });
      if (!open) return;
      await h.page.keyboard.press(' '); await h.wait(420);
    }
  };

  await h.page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_dami_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_done', '1'); localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 2; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(213, 0.5, 0.5);
  });
  await h.wait(2200);
  await drain(35);

  // 스파이 설치
  await h.page.evaluate(() => {
    window.__spy = { showDialog: 0, startHZ: 0, startHZerr: null, lastDlgTitle: null };
    if (typeof window.showDialog === 'function' && !window.showDialog.__spy) {
      const o = window.showDialog;
      window.showDialog = function (t, lines) { window.__spy.showDialog++; window.__spy.lastDlgTitle = String(t).slice(0, 10); return o.apply(this, arguments); };
      window.showDialog.__spy = true;
    }
    if (typeof window.startHazardBattle === 'function' && !window.startHazardBattle.__spy) {
      const o = window.startHazardBattle;
      window.startHazardBattle = function () { window.__spy.startHZ++; try { return o.apply(this, arguments); } catch (e) { window.__spy.startHZerr = String(e).slice(0, 160); throw e; } };
      window.startHazardBattle.__spy = true;
    }
    window.__spyTypes = { showDialog: typeof window.showDialog, startHazardBattle: typeof window.startHazardBattle };
  });
  say('스파이: ' + JSON.stringify(await h.page.evaluate(() => window.__spyTypes)));

  // 부탁 수락
  const residents = await h.page.evaluate(() => (STAGES[213].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  for (const r of residents) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(450); await h.page.keyboard.press('f'); await h.wait(500);
    await drain(15);
  }

  // 술병 F → 선택창 → 확정 → 1초 간격 상태 덤프
  await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  await h.page.keyboard.press('f'); await h.wait(550); await h.page.keyboard.press('f'); await h.wait(700);
  for (let k = 0; k < 20; k++) {
    const st = await h.page.evaluate(() => ({
      spy: window.__spy,
      choice: !!(window.__bdChoiceState && __bdChoiceState.open),
      dlg: (() => { const b = document.getElementById('dialogue-box'); return (b && b.getBoundingClientRect().height > 0) ? (b.textContent || '').replace(/\s+/g, ' ').slice(0, 46) : null; })(),
      hsr: !!(window.HSR && HSR.active),
    }));
    say(k + ': ' + JSON.stringify(st));
    if (st.hsr) { say('✅ 전투 진입'); break; }
    if (st.choice) { await h.wait(400); await h.page.evaluate(() => { try { BD_choiceConfirm(); } catch (e) { } }); await h.wait(300); continue; }
    await h.page.keyboard.press(' '); await h.wait(600);
  }
  await h.shot('invest2');
};
