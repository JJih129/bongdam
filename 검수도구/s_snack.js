// 라운드 11 검증 — 간식 거부·증강 스포트·전투 중 문자 보류 (실제 첫 전투 튜토 흐름)
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
  await h.wait(3000);
  // 실제 프롤로그
  for (let i = 0; i < 4; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await h.wait(400);
  for (let t = 0; t < 10; t++) {
    await h.page.keyboard.press('f'); await h.wait(600);
    if (await h.page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); })) break;
    await h.page.keyboard.press(' '); await h.wait(300);
  }
  for (let i = 0; i < 16; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await h.wait(1500); await h.page.keyboard.press(' '); await h.wait(3000);
  await h.page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await h.wait(3000);
  for (let i = 0; i < 12; i++) { await h.page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov && getComputedStyle(ov).display !== 'none') ov.click(); }); await h.wait(400); }
  // 필드 튜토 hazard 단계까지 대기 → 쓰레기로 이동 → 전투 (튜토 유지!)
  let seen = false;
  for (let t = 0; t < 45; t++) {
    const st = await h.page.evaluate(() => ({ r: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), s: window.__bdTutStepId || '' }));
    if (st.r) seen = true;
    if (seen && st.s === 'hazard') break;
    await h.wait(1000);
  }
  await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1'); heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; });
  await h.wait(600);
  await h.page.keyboard.press('f'); await h.wait(700);
  await h.page.keyboard.press('f'); await h.wait(900);
  for (let k = 0; k < 14; k++) {
    await h.wait(600);
    await h.page.evaluate(() => { try { if (window.__bdChoiceState && __bdChoiceState.open) BD_choiceConfirm(); } catch (e) { } });
    if (await h.page.evaluate(() => !!(window.HSR && HSR.active))) break;
    await h.page.keyboard.press(' '); await h.wait(250); await h.page.keyboard.press(' '); await h.wait(250);
  }
  say('전투: ' + await h.page.evaluate(() => !!(window.HSR && HSR.active)));

  // ③ 전투 중 문자 보류
  await h.page.evaluate(() => { BD_Message.show({ from: '검수', text: '전투 중 문자 보류 테스트' }); });
  await h.wait(1500);
  const msgInBattle = await h.page.evaluate(() => { const e = document.getElementById('bd-msg'); return !!(e && e.classList.contains('show')); });
  say('③ 전투 중 문자 표시(false 기대): ' + msgInBattle);

  // 튜토 스텝을 따라가며 item 단계까지: 각 단계 안내에 따라 클릭
  let reached = false;
  for (let t = 0; t < 60; t++) {
    const st = await h.page.evaluate(() => ({ s: window.__bdTutStepId || '', run: !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()), menu: (() => { const m = document.getElementById('hsr-item-menu'); return !!(m && m.offsetHeight); })() }));
    if (!st.run) break;
    if (st.s === 'item_use' && st.menu) { reached = true; break; }
    // 안내 스텝 진행: 클릭 타깃이 있으면 클릭 (스포트 손가락 위치)
    await h.page.evaluate(() => {
      const hole = document.getElementById('bd-spot-hole');
      if (hole && hole.offsetHeight) {
        const r = hole.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (el && (el.tagName === 'BUTTON' || el.closest('button'))) (el.closest('button') || el).click();
      }
    });
    await h.wait(900);
    await h.page.keyboard.press(' ');
    await h.wait(300);
  }
  say('간식(item_use) 도달: ' + reached);
  if (reached) {
    // ① 안 먹고 닫기 — I 키 또는 닫기
    await h.page.keyboard.press('i'); await h.wait(400);
    await h.page.keyboard.press('Escape'); await h.wait(400);
    await h.page.evaluate(() => { const m = document.getElementById('hsr-item-menu'); if (m && m.offsetHeight) { const c = [...m.querySelectorAll('button')].find(b => /닫기|✕/.test(b.textContent || '')); if (c) c.click(); } });
    const t0 = Date.now();
    let advanced = false;
    for (let t = 0; t < 12; t++) {
      await h.wait(500);
      const s = await h.page.evaluate(() => window.__bdTutStepId || '');
      if (s !== 'item_use') { advanced = true; break; }
    }
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    say(`① 닫기 후 진행: ${advanced} (${dt}s)` + (advanced && Number(dt) < 6 ? ' ✅' : ' ❌'));
    const nyam = await h.page.evaluate(() => { const e = document.getElementById('bd-dami-hud'); return e ? (e.textContent || '').includes('냠') : false; });
    say('①-b «냠» 미출력(false 기대): ' + nyam);
  }
  // 전투 마무리 → 증강에서 스포트 확인
  const A = require('./auto')(h, require('./lib')(h));
  // doBattle는 증강 클릭까지 하므로, 증강 감지 시점을 따로 폴링
  const battleEnd = (async () => { await A.doBattle(120); })();
  let augSeen = false, spotDuringAug = null;
  for (let t = 0; t < 120; t++) {
    await h.wait(500);
    const st = await h.page.evaluate(() => ({
      aug: (() => { const a = document.getElementById('bd-aug-overlay'); return !!(a && a.offsetHeight); })(),
      spot: (() => { const w = document.getElementById('bd-spot'); return w ? getComputedStyle(w).display : 'no-el'; })(),
      hsr: !!(window.HSR && HSR.active),
    }));
    if (st.aug) { augSeen = true; spotDuringAug = st.spot; await h.shot('snack_aug'); break; }
    if (!st.hsr) break;
  }
  await battleEnd;
  say('② 증강 표시: ' + augSeen + ' · 그때 스포트 display(none 기대): ' + spotDuringAug);
  // ③-b 전투 종료 후 보류 문자 재개
  await h.wait(3500);
  const msgAfter = await h.page.evaluate(() => { const e = document.getElementById('bd-msg'); return !!(e && e.classList.contains('show')); });
  say('③-b 전투 후 문자 재개(true 기대): ' + msgAfter);
  await h.shot('snack_final');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
