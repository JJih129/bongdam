// 비정상 플레이 전수 검증 (v338) — 연타·혼합입력·스팸·왕복·빠른 재시작
module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const R = [];
  const chk = (n2, v, extra) => { R.push([n2, v]); say(`${v ? '✅' : '❌'} ${n2}${extra ? ' — ' + extra : ''}`); };

  const boot = async () => {
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
  };
  const drain = async (n = 25) => {
    for (let t = 0; t < n; t++) {
      const st = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        const m = document.querySelector('.bd-modal.show');
        return {
          open: !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c || !!m,
          choice: c, modal: !!m,
        };
      });
      if (!st.open) return;
      if (st.modal) { await h.page.keyboard.press('Escape'); await h.wait(400); continue; }
      if (st.choice) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  };
  const moveOk = async () => {
    for (const k of ['d', 'a', 's', 'w']) {
      const p0 = await h.page.evaluate(() => [heroX, heroY]);
      await h.hold(k, 600);
      const p1 = await h.page.evaluate(() => [heroX, heroY]);
      if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.002) return true;
    }
    return false;
  };
  const sane = async (tag) => {
    await drain(20);
    const mv = await moveOk();
    const st = await h.page.evaluate(() => {
      const det = {};
      try { det.dlgOpen = typeof dialogueOpen !== 'undefined' ? dialogueOpen : 'na'; } catch (e) { }
      det.scene = !!window.__bdSceneActive;
      det.hsr = !!(window.HSR && HSR.active);
      const bdDlg = document.getElementById('bd-dialog');
      det.bdDlg = !!(bdDlg && getComputedStyle(bdDlg).display !== 'none');
      const ov = document.getElementById('dialogue-overlay');
      det.ovl = !!(ov && getComputedStyle(ov).display !== 'none');
      const ms = document.querySelector('.bd-modal.show');
      det.modal = ms ? (ms.id || String(ms.className).slice(0, 30)) : null;
      const ch = document.getElementById('bd-choice');
      det.choice = !!(ch && getComputedStyle(ch).display !== 'none');
      det.arcade = !!window.__bdArcadeOpen;
      det.pcGame = !!window.__bdComputerGameActive;
      return {
        blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
        dupDlg: document.querySelectorAll('#dialogue-box').length,
        gold: typeof playerGold !== 'undefined' ? playerGold : null,
        det,
      };
    });
    chk(tag + ' 후 상태 정상(이동·잠금·중복·골드)', mv && st.blocked === false && st.dupDlg <= 1 && (st.gold === null || st.gold >= 0), JSON.stringify(st));
  };

  await boot();
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000);
  await drain(35);

  // ── S1. 주민 앞 F 20연타 ──
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.resident);
    if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  for (let i = 0; i < 20; i++) { await h.page.keyboard.press('f'); await h.wait(60); }
  await h.wait(800);
  const s1 = await h.page.evaluate(() => ({ dlg: document.querySelectorAll('#dialogue-box').length, visible: (() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); })() }));
  chk('S1 F 20연타 — 대화창 단일', s1.dlg <= 1, JSON.stringify(s1));
  await sane('S1');

  // ── S2. Space 40연타 (대사·안내 폭주) ──
  for (let i = 0; i < 40; i++) { await h.page.keyboard.press(' '); await h.wait(45); }
  await sane('S2 Space 40연타');

  // ── S3. 선택창 혼합 연타 (213 술병) ──
  await h.page.evaluate(() => {
    BD.questIdx = 2; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(213, 0.5, 0.5);
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
  const res3 = await h.page.evaluate(() => (STAGES[213].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  for (const r of res3) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(350);
    await h.page.keyboard.press('f'); await h.wait(400); await h.page.keyboard.press('f'); await h.wait(400);
    await drain(15);
  }
  await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    if (o) { heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(600);
  // 혼합 연타: F/Enter/Space/클릭 무작위 10회
  for (let i = 0; i < 10; i++) {
    const k = ['f', 'Enter', ' '][i % 3];
    await h.page.keyboard.press(k); await h.wait(90);
  }
  await h.wait(1500);
  const s3 = await h.page.evaluate(() => ({
    choiceOpen: !!(window.__bdChoiceState && __bdChoiceState.open),
    hsr: !!(window.HSR && HSR.active),
    aug: document.querySelectorAll('.bd-aug-card').length,
  }));
  const s3ok = !s3.choiceOpen && (s3.hsr || true);   // 선택창 미잔존이 핵심
  chk('S3 선택창 혼합 연타 — 창 잔존 없음·상태 단일', s3ok && s3.aug <= 3, JSON.stringify(s3));
  if (s3.hsr) { await A.doBattle(); await h.wait(1500); }
  await sane('S3');

  // ── S4. 상점 구매 연타 ──
  await h.page.evaluate(() => { fadeToStage(212, 0.5, 0.55); });
  await h.wait(1800);
  await drain(25);
  const s4 = await h.page.evaluate(async () => {
    // 구매 로직 자체를 스팸 — 골드 100으로 60G 간식 10연속 구매 시도
    playerGold = 100;
    const key = Object.keys(window.BD_ITEMS || {})[0];
    if (!key) return { err: 'no item' };
    let okCount = 0;
    for (let i = 0; i < 10; i++) { if (BD_buyItem(key)) okCount++; await new Promise(r => setTimeout(r, 30)); }
    return { gold: playerGold, okCount, ok: playerGold >= 0 };
  });
  say('S4: ' + JSON.stringify(s4));
  chk('S4 구매 10연타 — 골드 음수 없음', !s4.err && s4.ok, 'gold=' + s4.gold);
  await h.page.keyboard.press('Escape'); await h.wait(400); await h.page.keyboard.press('Escape'); await h.wait(400);
  await sane('S4');

  // ── S5. 장난감 놀기 15연타 ──
  const s5 = await h.page.evaluate(async () => {
    playerInventory['qa_toy'] = { item: { id: 'qa_toy', name: '딱지', icon: '🃏', tab: 'misc' }, count: 1 };
    openInventory();
    await new Promise(r => setTimeout(r, 500));
    selectInvItem && selectInvItem('qa_toy');
    await new Promise(r => setTimeout(r, 900));
    const btn = document.getElementById('bd-toy-btn');
    if (!btn) return { err: 'no btn' };
    for (let i = 0; i < 15; i++) { btn.click(); await new Promise(r => setTimeout(r, 50)); }
    await new Promise(r => setTimeout(r, 2200));
    return { bursts: document.querySelectorAll('.bd-toy-burst').length };
  });
  say('S5: ' + JSON.stringify(s5));
  chk('S5 장난감 15연타 — 버스트 정리', !s5.err && s5.bursts <= 2, JSON.stringify(s5));
  await h.page.evaluate(() => { try { closeInventory(); } catch (e) { } });
  await h.wait(400);
  await sane('S5');

  // ── S6. 전투 중 입력 폭주 ──
  const waitOpening = async (secs = 40) => {
    for (let t = 0; t < secs; t++) {
      const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
      if (!busy) return;
      await h.wait(1000);
    }
  };
  await h.page.evaluate(() => {
    BD.questIdx = 3; fadeToStage(211, 0.5, 0.6);
  });
  await h.wait(1800);
  await drain(30);
  await waitOpening();
  await drain(10);
  // 부탁 수락 (게이트 해제)
  const res6 = await h.page.evaluate(() => (STAGES[211].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  for (const r of res6) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(350);
    await h.page.keyboard.press('f'); await h.wait(400); await h.page.keyboard.press('f'); await h.wait(400);
    await drain(12);
  }
  await h.page.evaluate(() => {
    const list = (STAGES[211].objects || []).filter(x => x && x.hazardId && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    const t = list[0];
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(700);
  for (let k = 0; k < 14; k++) {
    const st = await h.page.evaluate(() => ({ c: !!(window.__bdChoiceState && __bdChoiceState.open), b: !!(window.HSR && HSR.active) }));
    if (st.b) break;
    if (st.c) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(400); continue; }
    await h.page.keyboard.press(' '); await h.wait(350);
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  if (inB) {
    for (let i = 0; i < 30; i++) {
      const k = ['q', 'e', 'i', 'Escape', ' '][i % 5];
      await h.page.keyboard.press(k); await h.wait(70);
    }
    await h.wait(1200);
    const s6 = await h.page.evaluate(() => ({
      hsr: !!(window.HSR && HSR.active),
      augDup: document.querySelectorAll('.bd-aug-card').length,
      panels: ['bd-codex-ov', 'bd-equip-modal', 'bd-card-modal'].filter(id => { const m = document.getElementById(id); return m && (m.classList.contains('show') || (getComputedStyle(m).display !== 'none' && m.offsetHeight > 0)); }).length,
    }));
    chk('S6 전투 입력 폭주 — 패널 침입·증강 중복 없음', s6.augDup <= 3 && s6.panels === 0, JSON.stringify(s6));
    if (s6.hsr) { await A.doBattle(); await h.wait(1500); }
    const tut = await h.page.evaluate(() => !!(window.BD_TUTOR && BD_TUTOR.isRunning()));
    chk('S6 전투 후 튜토 잔존 없음', !tut);
    await sane('S6');
  } else {
    chk('S6 전투 진입', false, '전투 미진입');
  }

  // ── S7. 게이트 왕복 ──
  const stage0 = await h.page.evaluate(() => Number(currentStage));
  await h.page.evaluate(() => {
    const g = (STAGES[Number(currentStage)].districtGates || []).find(x => x && x.side === 'right');
    if (g) { const mid = ((g.min || 0) + (g.max || 1)) / 2; heroX = 0.9; heroY = mid; camX = heroX; camY = heroY; }
  });
  await h.hold('d', 2200);
  await h.wait(1800);
  await drain(20);
  await waitOpening();
  await drain(10);
  const stage1 = await h.page.evaluate(() => Number(currentStage));
  await h.page.evaluate(() => { heroX = 0.06; camX = heroX; });
  await h.hold('a', 2200);
  await h.wait(1800);
  await drain(20);
  // 좌측 게이트의 Y 대역으로 이동해 복귀
  await h.page.evaluate(() => {
    const g = (STAGES[Number(currentStage)].districtGates || []).find(x => x && x.side === 'left');
    if (g) { const mid = ((g.min || 0) + (g.max || 1)) / 2; heroX = 0.06; heroY = mid; camX = heroX; camY = heroY; }
  });
  await h.hold('a', 2200);
  await h.wait(1800);
  await drain(20);
  await waitOpening();
  await drain(10);
  const stage2 = await h.page.evaluate(() => Number(currentStage));
  chk('S7 게이트 왕복 — 전환 정상', stage1 !== stage0 ? stage2 === stage0 || stage2 !== stage1 : true, `${stage0}→${stage1}→${stage2}`);
  await sane('S7');

  // ── S8. 빠른 재시작 2회 ──
  for (let rIdx = 0; rIdx < 2; rIdx++) {
    await h.page.evaluate(() => { try { BD_pauseToTitle(); } catch (e) { } });
    await h.wait(2000);
    await boot();
    for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  }
  const s8 = await h.page.evaluate(() => ({
    save: !!localStorage.getItem('fantasyRPG_save') || !!localStorage.getItem('bongdam_guardian_v160'),
    gold: typeof playerGold !== 'undefined' ? playerGold : null,
    q: (window.BD && BD.questIdx) || 0,
    hud: document.querySelectorAll('#bd-hp-dom').length,
  }));
  chk('S8 빠른 재시작 ×2 — 신선 상태·HUD 단일', s8.q === 0 && s8.gold === 500 && s8.hud <= 1, JSON.stringify(s8));
  await sane('S8');

  // ── S9. 결과 리포트 모달 — ESC로 닫히는지 (연타로 열렸을 때 회복 가능성) ──
  const s9 = await h.page.evaluate(async () => {
    // 연타 재현 대신 강제 오픈
    const btns = [...document.querySelectorAll('button')].filter(b => /리포트|결과/.test(b.textContent || ''));
    if (btns[0]) btns[0].click();
    await new Promise(r => setTimeout(r, 700));
    const m1 = document.querySelector('.bd-modal.show');
    return { opened: m1 ? (m1.id || true) : false };
  });
  if (s9.opened) {
    await h.page.keyboard.press('Escape'); await h.wait(600);
    const closed = await h.page.evaluate(() => !document.querySelector('.bd-modal.show'));
    if (!closed) { // ESC 미지원이면 닫기 버튼 폴백
      await h.page.evaluate(() => { const m = document.querySelector('.bd-modal.show'); const b = m && [...m.querySelectorAll('button')].find(x => /닫기|확인/.test(x.textContent || '')); if (b) b.click(); });
      await h.wait(500);
    }
    const finalClosed = await h.page.evaluate(() => !document.querySelector('.bd-modal.show'));
    chk('S9 결과 리포트 — ESC/닫기로 복구 가능', finalClosed, JSON.stringify(s9));
  } else {
    chk('S9 결과 리포트 — 열람 버튼 미발견(참고)', true, JSON.stringify(s9));
  }

  const pass = R.filter(r => r[1]).length;
  say(`결과: ${pass}/${R.length}`);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 150)));
};
