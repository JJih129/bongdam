// QA-2 ①: 상리(213)·동화리(211) 위험요소 «조사한다» → 전투 진입 실경로 검증
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

  const testRegion = async (sid, questIdx, hazardSel, label) => {
    await h.page.evaluate((p) => {
      localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_dami_tutorial_done', '1');
      localStorage.setItem('bd_battle_tutorial_done', '1'); localStorage.setItem('bd_shop_tutorial_done_v75', '1');
      BD.questIdx = p.questIdx;
      BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
      fadeToStage(p.sid, 0.5, 0.5);
    }, { sid, questIdx });
    await h.wait(2200);
    await drain(35);

    // 주민 부탁 수락 (❗ 주민 전원 순회)
    const residents = await h.page.evaluate((p) => {
      return (STAGES[p.sid].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06, name: (o.npcName || o.label || '').slice(0, 8) }));
    }, { sid });
    for (const r of residents) {
      await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
      await h.wait(400);
      await h.page.keyboard.press('f'); await h.wait(450); await h.page.keyboard.press('f'); await h.wait(500);
      await drain(15);
    }
    const gateInfo = await h.page.evaluate((p) => {
      const o = (STAGES[p.sid].objects || []).find(x => x && x.hazardId === p.hz);
      return { found: !!o, gate: o ? BD_hzQuestGate(o) : 'noObj' };
    }, { sid, hz: hazardSel });
    say(label + ' 게이트: ' + JSON.stringify(gateInfo));

    // 위험요소로 이동 → F → 선택창 «조사한다» → 전투
    await h.page.evaluate((p) => {
      const o = (STAGES[p.sid].objects || []).find(x => x && x.hazardId === p.hz);
      if (o) { heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY; }
    }, { sid, hz: hazardSel });
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(550); await h.page.keyboard.press('f'); await h.wait(700);
    let battle = false, sawChoice = false;
    for (let k = 0; k < 22 && !battle; k++) {
      const st = await h.page.evaluate(() => ({
        choice: !!(window.__bdChoiceState && __bdChoiceState.open),
        battle: !!(window.HSR && HSR.active),
      }));
      battle = st.battle;
      // BD_choiceConfirm 은 전역이 아니다(클로저) — 실유저 경로인 키 확정 사용
      if (st.choice) { sawChoice = true; await h.wait(450); await h.page.keyboard.press('Enter'); await h.wait(600); continue; }
      await h.page.keyboard.press(' '); await h.wait(450);
    }
    say(label + ' 선택창=' + sawChoice + ' 전투=' + battle + (battle ? ' ✅' : ' ❌'));
    await h.shot('invest_' + sid);
    if (battle) {
      // 전투 이탈 (ESC 구조)
      await h.page.keyboard.press('Escape'); await h.wait(1500);
      await drain(15);
    }
    return battle;
  };

  const r213 = await testRegion(213, 2, 'ow213_bottle_1', '[상리 술병]');
  const r211 = await testRegion(211, 3, 'ow211_graffiti_1', '[동화리 낙서]');
  say('결과: 상리=' + r213 + ' 동화리=' + r211);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
