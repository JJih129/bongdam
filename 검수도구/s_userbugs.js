// 사용자 보고 버그 재현 — ①도서관 나온 뒤 위험요소 사라짐/이동불가 ②엘리베이터 ③정화 중 먹통
module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h);
  const st = async (tag) => {
    const s = await h.page.evaluate(() => ({
      stg: Number(currentStage),
      blk: !!(window.BD_isInputBlocked && BD_isInputBlocked()),
      hz: (STAGES[212].objects || []).filter(o => o && o.hazardId && !o.hidden && !o.__bdGone).length,
      hero: [Number(heroX).toFixed(3), Number(heroY).toFixed(3)],
    }));
    say(`[${tag}] ` + JSON.stringify(s));
    return s;
  };
  const move = async (tag) => {
    const p0 = await h.page.evaluate(() => [heroX, heroY]);
    await h.hold('d', 450); await h.hold('a', 250);
    const p1 = await h.page.evaluate(() => [heroX, heroY]);
    const ok = Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.001;
    say(`[${tag}] 이동: ${ok}`);
    return ok;
  };

  // ── 준비: 실제 프롤로그 경로로 엘리베이터까지 (엘리베이터 재현 겸용) ──
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
  for (let i = 0; i < 4; i++) { await h.page.keyboard.press(' '); await h.wait(450); }
  // 선생님 대화 → 배지 수여까지
  await h.page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await h.wait(500);
  for (let t = 0; t < 10; t++) {
    await h.page.keyboard.press('f'); await h.wait(700);
    const talking = await h.page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); });
    if (talking) break;
    await h.page.keyboard.press(' '); await h.wait(400);
  }
  for (let i = 0; i < 16; i++) { await h.page.keyboard.press(' '); await h.wait(500); }
  await h.wait(1800); await h.page.keyboard.press(' '); await h.wait(3500);

  // ── ② 엘리베이터: 존으로 «걸어서» 진입 (텔레포트 금지 — 실제 경로) ──
  say('◇ 엘리베이터 재현 (걸어서 접근)');
  // 엘리베이터 존은 우상단 (0.655~0.745, 0.065~0.24) — 아래에서 위로 걷는다
  await h.page.evaluate(() => { heroX = 0.70; heroY = 0.30; camX = heroX; camY = heroY; });
  await h.wait(400);
  let arrived = false;
  for (let t = 0; t < 14; t++) {
    await h.hold('w', 500);
    const s = await h.page.evaluate(() => ({ stg: Number(currentStage), y: Number(heroY) }));
    if (s.stg === 212) { arrived = true; break; }
    if (t === 7) { await h.hold('a', 250); }
  }
  say('엘리베이터 → 212 진입: ' + arrived);
  await h.shot('ub_elevator');
  if (!arrived) { say('⛔ 엘리베이터 진입 실패'); }
  await h.wait(3000);
  for (let i = 0; i < 10; i++) { await h.page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov && getComputedStyle(ov).display !== 'none') ov.click(); }); await h.wait(400); }
  await h.page.evaluate(() => { localStorage.setItem('bd_dami_tutorial_done', '1'); });

  // ── ① 도서관 입·퇴장 반복 ──
  say('◇ 도서관 재현');
  await st('입장 전');
  await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => /도서관/.test(l.label || ''));
    if (lm) { heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.01; camX = heroX; camY = heroY; }
  });
  await h.wait(500);
  for (let round = 1; round <= 2; round++) {
    await h.key('f', 1, 300); await h.wait(1300);
    await h.shot(`ub_lib_card_${round}`);
    // 카드에서 «잠시 쉬어 가기» 또는 첫 버튼
    await h.page.evaluate(() => {
      const m = document.getElementById('bd-district-facility-modal');
      if (m) { const b = [...m.querySelectorAll('button')].find(x => /쉬어|입장|들어가/.test(x.textContent || '')) || m.querySelector('button'); if (b) b.click(); }
    });
    await h.wait(2500);
    // 안내·대화 소진
    for (let i = 0; i < 8; i++) {
      const done = await h.page.evaluate(() => {
        const ov = document.getElementById('dialogue-overlay'); if (ov && getComputedStyle(ov).display !== 'none') { ov.click(); return false; }
        const m = [...document.querySelectorAll('.bd-modal.show')][0];
        if (m) { const b = [...m.querySelectorAll('button')].find(x => /닫기|확인|나가기/.test(x.textContent || '')); if (b) { b.click(); return false; } }
        return true;
      });
      await h.wait(500);
      if (done) break;
    }
    await st(`도서관 ${round}회차 후`);
    const mv = await move(`도서관 ${round}회차 후`);
    if (!mv) { say('⛔ 이동 불가 재현!'); await h.shot('ub_lib_stuck_' + round); }
  }
  const hz = await st('최종');
  say(hz.hz > 0 ? '위험요소 표시 유지 ✔' : '⛔ 위험요소 소실!');
  await h.shot('ub_final');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
