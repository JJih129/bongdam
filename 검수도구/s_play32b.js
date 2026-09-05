// 프롤로그 정밀 통과(단계 상태 기반) → 이후 핵심 비트 재촬영
module.exports = async (h) => {
  const { say } = h;
  const A = require('./auto')(h, require('./lib')(h));
  const shot = async (n) => { await h.shot(n); say('📸 ' + n); };
  const step = () => h.page.evaluate(() => window.__bdTut2Step);
  const tapDlg = async (max = 40) => {
    for (let t = 0; t < max; t++) {
      const st = await h.page.evaluate(() => ({
        d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })(),
        cer: !!(document.getElementById('bd-badge-ov') && document.getElementById('bd-badge-ov').style.display === 'flex'),
      }));
      if (st.cer) { await shot('q04_ceremony'); await h.page.keyboard.press(' '); await h.wait(900); continue; }
      if (!st.d) return;
      await h.page.keyboard.press(' '); await h.wait(650);
    }
  };
  const holdMove = async (key, ms) => { await h.page.keyboard.down(key); await h.wait(ms); await h.page.keyboard.up(key); };

  await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 20; t++) {
    const st = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    });
    if (!st && t > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  await tapDlg();
  // step0: 연속 이동으로 확실히 채우기
  say('step=' + await step());
  for (let r = 0; r < 6; r++) {
    await holdMove('a', 900); await holdMove('d', 900);
    await tapDlg(4);
    const s = await step();
    say('  이동검증 r' + r + ' step=' + s);
    if (s >= 1) break;
  }
  await shot('q01_step0_done');
  // step1: 선생님에게 접근 + F
  for (let r = 0; r < 10; r++) {
    const s = await step();
    if (s >= 2) break;
    await h.page.evaluate(() => {
      // 선생님 발치로 걸어가는 대신 근접 지점까지 단계 접근 (실이동)
    });
    // 실이동: 선생님(0.575,0.235 rect h .095 → 발치 y≈0.345)까지
    const pos = await h.page.evaluate(() => [heroX, heroY]);
    const tx = 0.585, ty = 0.36;
    const dx = tx - pos[0], dy = ty - pos[1];
    if (Math.hypot(dx, dy) > 0.03) {
      const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
      await holdMove(key, 450);
    } else {
      await h.page.keyboard.press('f'); await h.wait(900);
      await tapDlg(45);
    }
    await tapDlg(3);
  }
  say('선생님 후 step=' + await step());
  await shot('q05_after_teacher');
  // step2: 가방 E 열고 닫기
  if ((await step()) === 2) {
    await h.page.keyboard.press('e'); await h.wait(1000);
    await shot('q06_bag');
    await h.page.keyboard.press('e'); await h.wait(800);
    await tapDlg(20);
  }
  say('가방 후 step=' + await step());
  // step3: 엘리베이터
  for (let r = 0; r < 14; r++) {
    const sid = await h.page.evaluate(() => Number(currentStage));
    if (sid === 212) break;
    const pos = await h.page.evaluate(() => [heroX, heroY]);
    const tx = 0.700, ty = 0.185;
    const dx = tx - pos[0], dy = ty - pos[1];
    if (Math.hypot(dx, dy) > 0.035) {
      const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
      await holdMove(key, 450);
    } else {
      await h.page.keyboard.press('f'); await h.wait(1200);
    }
    await tapDlg(4);
  }
  await h.wait(1500);
  const sidNow = await h.page.evaluate(() => Number(currentStage));
  say('스테이지: ' + sidNow);
  await shot('q07_world');
  if (sidNow !== 212) { say('❌ 월드 진출 실패 — 중단'); return; }
  await tapDlg(50);
  // 첫 쓰레기: 튜토 유도 지점 (0.341,0.316)
  const pos2 = await h.page.evaluate(() => [heroX, heroY]);
  say('위치: ' + JSON.stringify(pos2));
  for (let r = 0; r < 24; r++) {
    const pos = await h.page.evaluate(() => [heroX, heroY]);
    const tx = 0.381, ty = 0.365;
    const dx = tx - pos[0], dy = ty - pos[1];
    if (Math.hypot(dx, dy) < 0.03) break;
    const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
    await holdMove(key, 420);
    await tapDlg(3);
  }
  await h.page.keyboard.press('f'); await h.wait(900);
  await shot('q08_choice');
  // 확정 → 전투
  for (let k = 0; k < 16; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open), d: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
    if (st.b) break;
    if (st.c) { await h.wait(430); await h.page.keyboard.press('Enter'); await h.wait(400); continue; }
    if (st.d) { await h.page.keyboard.press(' '); await h.wait(400); continue; }
    await h.page.keyboard.press('f'); await h.wait(500);
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투 진입: ' + inB);
  await h.wait(1200);
  await shot('q09_battle_tuto');   // 전투 튜토 하이라이트 (ISSUE-03 관찰)
  if (inB) { await A.doBattle(); await h.wait(1500); }
  await shot('q10_result_safetip'); // 안전 수칙 카드 실전
  await tapDlg(25);
  say('완료 · 콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 150)));
};
