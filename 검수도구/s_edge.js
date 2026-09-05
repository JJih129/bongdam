// 비정상 플레이 엣지 스위트 — 이벤트 겹침·연타·꼬임 시나리오
module.exports = async (h) => {
  const { say } = h;
  const results = [];
  const check = async (name, fn) => {
    try { const r = await fn(); results.push([name, r]); say(`${r ? '✅' : '❌'} ${name}`); }
    catch (e) { results.push([name, false]); say(`❌ ${name} — ${String(e).slice(0, 80)}`); }
  };
  const free = async () => {
    for (let t = 0; t < 8; t++) {
      const b = await h.page.evaluate(() => !!(window.BD_isInputBlocked && BD_isInputBlocked()));
      if (!b) return true;
      await h.page.keyboard.press(' '); await h.wait(400);
      await h.page.keyboard.press('Escape'); await h.wait(300);
    }
    return false;
  };
  const canMove = async () => {
    const p0 = await h.page.evaluate(() => [heroX, heroY]);
    await h.hold('d', 400); await h.hold('a', 250);
    const p1 = await h.page.evaluate(() => [heroX, heroY]);
    return Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.001;
  };

  // 준비
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  // ① 주민 대화 중 ESC 연타 → 잠금 해제 + 이동
  await check('① 대화 중 ESC 연타', async () => {
    await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.resident && /은지/.test(x.label || '')); heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; });
    await h.wait(400);
    await h.key('f', 2, 500); await h.wait(700);
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press('Escape'); await h.wait(150); }
    await h.wait(800);
    await h.page.keyboard.press('Escape'); await h.wait(400);   // 혹시 열린 일시정지 닫기
    return (await free()) && (await canMove());
  });

  // ② 시설 카드 열자마자 ESC+이동 연타
  await check('② 시설 카드 즉시 탈출', async () => {
    await h.page.evaluate(() => { const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy'); heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.005; camX = heroX; camY = heroY; });
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(250);
    for (let i = 0; i < 5; i++) { await h.page.keyboard.press('Escape'); await h.page.keyboard.press('d'); await h.wait(120); }
    await h.wait(700);
    return (await free()) && (await canMove());
  });

  // ③ 버스 모달 열고 ESC 직후 F 연타
  await check('③ 버스 모달 ESC 후 F 연타', async () => {
    await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.interactable === 'bus_stop'); if (o) { heroX = o.rx + (o.rw || 0) / 2; heroY = o.ry + (o.rh || 0) + 0.01; camX = heroX; camY = heroY; } });
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(900);
    await h.page.keyboard.press('Escape'); await h.wait(200);
    for (let i = 0; i < 4; i++) { await h.page.keyboard.press('f'); await h.wait(120); }
    await h.wait(900);
    // 열려 있으면 닫는다
    await h.page.keyboard.press('Escape'); await h.wait(400);
    return (await free()) && (await canMove());
  });

  // ④ 전투 중 패널 열기 시도(M/J/E) → 전투 종료 후 정상
  await check('④ 전투 중 패널 연타', async () => {
    // 담이 오프닝(조사 잠금 구간)이 끝날 때까지 대기 — 잠금 자체는 의도된 동작(v315)
    for (let t = 0; t < 30; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
    await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1'); heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; });
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(900);
    for (let i = 0; i < 8; i++) {
      await h.page.keyboard.press(' '); await h.wait(300);
      if (await h.page.evaluate(() => !!document.getElementById('bd-ch-investigate') && __bdChoiceState.open)) break;
    }
    await h.page.evaluate(() => { try { BD_choiceConfirm(); } catch (e) { } });
    await h.wait(3000);
    const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
    if (!inB) return false;
    // 전투 중 패널 시도
    for (const k of ['m', 'j', 'e']) { await h.page.keyboard.press(k); await h.wait(300); }
    const leaked = await h.page.evaluate(() => {
      const ids = ['bd-map-v283'];
      return ids.some(id => { const e = document.getElementById(id); return e && e.style.display !== 'none' && e.getBoundingClientRect().height > 100; });
    });
    // ESC 물러나기로 전투 종료
    await h.page.keyboard.press('Escape'); await h.wait(1500);
    for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
    const out = await h.page.evaluate(() => !(window.HSR && HSR.active));
    return !leaked && out && (await free()) && (await canMove());
  });

  // ⑤ 전투 중 구조 요청 차단
  await check('⑤ 전투 중 구조 차단', async () => {
    const r = await h.page.evaluate(() => { window.HSR = window.HSR || {}; const was = HSR.active; HSR.active = true; let ok = false; try { const hx = heroX; BD_rescue(); ok = (heroX === hx); } finally { HSR.active = was; } return ok; });
    return r;
  });

  // ⑥ 일시정지 중 F/E/M 겹침
  await check('⑥ 일시정지 중 키 겹침', async () => {
    await h.page.keyboard.press('Escape'); await h.wait(600);
    const open = await h.page.evaluate(() => { const m = document.getElementById('bd-pause-modal'); return !!(m && m.classList.contains('show')); });
    if (!open) return false;
    for (const k of ['f', 'e', 'm', 'j']) { await h.page.keyboard.press(k); await h.wait(200); }
    const leaked = await h.page.evaluate(() => {
      const map = document.getElementById('bd-map-v283');
      const inv = document.getElementById('inv-panel');
      const q = document.getElementById('quest-overlay');
      return (map && map.style.display !== 'none') || (inv && inv.offsetHeight > 0) || (q && q.offsetHeight > 100);
    });
    await h.page.keyboard.press('Escape'); await h.wait(500);
    return !leaked && (await canMove());
  });

  // ⑦ 지역 게이트 연타 (미완성 상태에서 상리 방향 도로 끝 진입 반복)
  await check('⑦ 미완성 게이트 연타', async () => {
    await h.page.evaluate(() => { heroX = 0.480; heroY = 0.940; camX = heroX; camY = heroY; });
    for (let i = 0; i < 3; i++) {
      await h.hold('s', 900); await h.wait(1200);
      for (let k = 0; k < 5; k++) { await h.page.keyboard.press(' '); await h.wait(300); }
    }
    const stg = await h.page.evaluate(() => Number(currentStage));
    return stg === 212 && (await free()) && (await canMove());
  });

  const pass = results.filter(r => r[1]).length;
  say(`결과: ${pass}/${results.length} 통과`);
  say('콘솔 오류: ' + h.consoleErrors.length);
  await h.shot('edge_final');
};
