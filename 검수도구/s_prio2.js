// P2: 담이 각성 여부 ↔ 조사 전투 진입 인과 확정 + P1: 시작 클릭 후 세이브 부활 쓰기 계측
module.exports = async (h) => {
  const { say } = h;
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

  const go213 = async () => {
    await h.page.evaluate(() => {
      localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_dami_tutorial_done', '1');
      localStorage.setItem('bd_battle_tutorial_done', '1'); localStorage.setItem('bd_shop_tutorial_done_v75', '1');
      BD.questIdx = 2; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
      fadeToStage(213, 0.1, 0.35);
    });
    await h.wait(2200);
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(280); }
    for (let t = 0; t < 15; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
  };
  const tryHazard = async () => {
    await h.page.evaluate(() => {
      const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
      heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY;
    });
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(900);
    for (let k = 0; k < 10; k++) {
      await h.wait(600);
      const st = await h.page.evaluate(() => ({ open: !!(window.__bdChoiceState && __bdChoiceState.open), battle: !!(window.HSR && HSR.active) }));
      if (st.battle) return { battle: true, k };
      if (st.open) await h.page.evaluate(() => { try { BD_choiceConfirm(); } catch (e) { } });
      await h.page.keyboard.press(' '); await h.wait(250); await h.page.keyboard.press(' '); await h.wait(250);
    }
    return { battle: await h.page.evaluate(() => !!(window.HSR && HSR.active)) };
  };

  // A. 각성 안 된 상태 (모듈 AWAKE=false)
  await go213();
  const awakeA = await h.page.evaluate(() => ({ ls: localStorage.getItem('bd_dami_awake'), show: (() => { try { return BD_DAMI.show('t', {}) } catch (e) { return 'err' } })() }));
  say('A 사전상태: ' + JSON.stringify(awakeA));
  const rA = await tryHazard();
  say('A(각성X) 전투 진입: ' + rA.battle + (rA.battle ? ' — 가설 기각' : ' ❌ (담이 침묵이 전투 차단)'));

  // B. 정식 각성 후 동일 시도
  await h.page.evaluate(() => { try { window.__bdCeremonyDone = true; BD_DAMI.wake ? BD_DAMI.wake() : BD_DAMI.awaken(); } catch (e) { } });
  await h.wait(800);
  const awakeB = await h.page.evaluate(() => { try { return BD_DAMI.show('각성 확인', {}); } catch (e) { return 'err'; } });
  say('B 각성 후 show(): ' + awakeB);
  await h.page.evaluate(() => { const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1'); if (o) { delete o.__bdGone; } });
  const rB = await tryHazard();
  say('B(각성O) 전투 진입: ' + rB.battle + (rB.battle ? ' ✅ — 인과 확정' : ' ❌ (다른 원인 병존)'));
  await h.shot('prio2_battle');
  if (rB.battle) { await h.page.keyboard.press('Escape'); await h.wait(1200); }

  // P1: 타이틀 복귀 → 시작하기 클릭 → 리로드 전 저장 부활 쓰기 감시
  await h.page.evaluate(() => {
    window.__bdWriteLog = [];
    const _s = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (window.__bdPurgeMark && (k === 'fantasyRPG_save' || /^bd_/.test(k))) window.__bdWriteLog.push(k);
      return _s.apply(this, arguments);
    };
  });
  // 타이틀로 (ESC 메뉴 → 타이틀 경로 대신 직접 노출 함수 탐색)
  const toTitle = await h.page.evaluate(() => {
    const fn = window.BD_backToTitle || window.backToTitle || window.BD_goTitle || null;
    if (fn) { fn(); return 'fn'; }
    const t = document.getElementById('bd-title'); if (t) { t.style.display = ''; return 'dom?'; }
    return 'none';
  });
  say('P1 타이틀 복귀 경로: ' + toTitle);
  await h.wait(1500);
  // purge 마크 걸고 시작하기 클릭 → 리로드 직전까지의 쓰기 수집
  await h.page.evaluate(() => { window.__bdPurgeMark = true; });
  let writes = null;
  try {
    await Promise.all([
      h.page.waitForNavigation({ timeout: 12000 }).catch(() => null),
      (async () => { await h.click('#bd-title-start'); })(),
    ]);
    writes = await h.page.evaluate(() => window.__bdWriteLog || null).catch(() => '리로드로 소실(정상)');
  } catch (e) { writes = 'err ' + String(e).slice(0, 80); }
  say('P1 클릭~리로드 사이 쓰기 로그(리로드 후면 null 정상): ' + JSON.stringify(writes));
  await h.wait(3000);
  const after = await h.page.evaluate(() => ({
    save: !!localStorage.getItem('fantasyRPG_save'),
    awake: localStorage.getItem('bd_dami_awake'),
    K: !!localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest'),
  }));
  say('P1 리로드 후 잔존: ' + JSON.stringify(after) + (after.save ? '  ⚠️ 세이브 부활!' : '  (세이브 없음 정상)'));
  say('콘솔 오류: ' + h.consoleErrors.length);
};
