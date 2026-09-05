// 실유저 페이스 플레이스루 — 비트마다 스크린샷 (신규 시작, 스킵 플래그 없음)
module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const shot = async (n) => { await h.shot(n); say('📸 ' + n); };
  const tapUntilIdle = async (max = 30, label = '') => {
    for (let t = 0; t < max; t++) {
      const st = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        return { d: !!(b && b.getBoundingClientRect().height > 0), c };
      });
      if (!st.d && !st.c) return;
      if (st.c) { await h.wait(430); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(600);
    }
  };
  const walkTo = async (tx, ty, ms = 9000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const p = await h.page.evaluate(() => [heroX, heroY]);
      const dx = tx - p[0], dy = ty - p[1];
      if (Math.hypot(dx, dy) < 0.035) return true;
      const key = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w');
      await h.page.keyboard.down(key); await h.wait(320); await h.page.keyboard.up(key);
      const b = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
      if (b) await h.page.keyboard.press(' ');
    }
    // 도보 실패 → 순간이동 (하네스 절충, 기록)
    say('  ⚠ 도보 실패 → 텔레포트 (' + tx + ',' + ty + ')');
    await h.page.evaluate((q) => { heroX = q[0]; heroY = q[1]; camX = heroX; camY = heroY; }, [tx, ty]);
    return false;
  };

  // ── B1 타이틀 ──
  await h.wait(2500);
  await shot('p01_title');
  await h.click('#bd-title-start'); await h.wait(1500);
  // ── B2 캐릭터 선택 ──
  const cs = await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); });
  if (cs) await shot('p02_charselect');
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
  // ── B3 프롤로그: 선생님까지 대사 + 스포트라이트 포착 ──
  let spotShot = false;
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => ({
      d: (() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); })(),
      spot: (() => { const s = document.getElementById('bd-spot2') || document.getElementById('bd-spot'); return !!(s && s.style.display !== 'none' && s.getBoundingClientRect().width > 6); })(),
      step: window.__bdTut2Step,
    }));
    if (st.spot && !spotShot) { spotShot = true; await shot('p03_prologue_spotlight'); }
    if (st.d) { await h.page.keyboard.press(' '); await h.wait(650); continue; }
    if (st.step === 1) {
      // 선생님에게 걸어가 F
      await walkTo(0.518, 0.24, 7000);
      await h.page.keyboard.press('f'); await h.wait(800);
      continue;
    }
    if (st.step === 3) break; // 엘리베이터 단계
    await h.wait(500);
    if (t % 6 === 5) await h.page.keyboard.press(' ');
  }
  await shot('p04_badge_daymi');
  await tapUntilIdle(40);
  // 엘리베이터 강조
  await shot('p05_elevator_hint');
  await walkTo(0.688, 0.10, 10000);
  await h.page.keyboard.press('f'); await h.wait(1200);
  await tapUntilIdle(30);
  // ── B6 212 도착 ──
  for (let t = 0; t < 20; t++) {
    const sid = await h.page.evaluate(() => Number(currentStage));
    if (sid === 212) break;
    await tapUntilIdle(6);
    await h.wait(600);
  }
  await h.wait(1200);
  await shot('p06_wawoo_arrival');
  await tapUntilIdle(50);
  // ── B7 첫 쓰레기 조사 ──
  await walkTo(0.375, 0.345, 12000);
  await h.page.keyboard.press('f'); await h.wait(900);
  const ch = await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open));
  if (!ch) { await h.page.keyboard.press('f'); await h.wait(1200); }
  await shot('p07_choice');
  // 조사한다 확정
  await h.wait(450); await h.page.keyboard.press('Enter');
  await tapUntilIdle(12);
  await h.wait(1500);
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투 진입: ' + inB);
  await shot('p08_battle_tutorial');
  if (inB) {
    await A.doBattle();
    await h.wait(1500);
  }
  await shot('p09_result_safetip');
  await tapUntilIdle(20);
  // ── B10 주민 부탁 (은지 0.373,0.432) ──
  await walkTo(0.383, 0.47, 9000);
  await h.page.keyboard.press('f'); await h.wait(900);
  await shot('p10_resident');
  await tapUntilIdle(25);
  // ── B11 지도 ──
  await h.page.keyboard.press('m'); await h.wait(1000);
  await shot('p11_map');
  await h.page.keyboard.press('Escape'); await h.wait(500);
  // ── B12 상점 (해피24 0.824,0.441) ──
  await walkTo(0.82, 0.5, 12000);
  await h.page.keyboard.press('f'); await h.wait(900);
  await shot('p12_facility_modal');
  await h.page.evaluate(() => {
    const m = document.querySelector('.bd-modal.show');
    if (m) { const b = [...m.querySelectorAll('button')].find(x => /구경|상점/.test(x.textContent || '')); if (b) b.click(); }
  });
  await h.wait(1100);
  await shot('p13_shop');
  await h.page.evaluate(() => { const m = document.getElementById('bd-shop-modal'); if (m) m.classList.remove('show'); });
  await h.page.keyboard.press('Escape'); await h.wait(500);
  // ── B13 게이트 → 경계 칩 → 211 ──
  await h.page.evaluate(() => { heroY = 0.5; camX = heroX; camY = heroY; });
  await walkTo(0.06, 0.5, 12000);
  await h.wait(800);
  await shot('p14_gate_chip');
  await h.page.keyboard.down('a'); await h.wait(2000); await h.page.keyboard.up('a');
  await h.wait(1500);
  const sidNow = await h.page.evaluate(() => Number(currentStage));
  say('게이트 후 스테이지: ' + sidNow);
  await tapUntilIdle(20);
  await shot('p15_next_district');
  // ── B14 파출소 (212 0.813,0.099) — ISSUE-04 확인 ──
  await h.page.evaluate(() => { if (Number(currentStage) !== 212) fadeToStage(212, 0.82, 0.2); });
  await h.wait(1500); await tapUntilIdle(15);
  await h.page.evaluate(() => { heroX = 0.813; heroY = 0.16; camX = heroX; camY = heroY; });
  await h.wait(900);
  await shot('p16_police_marker');
  say('플레이스루 종료 · 콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 8).forEach(e => say('  ! ' + e.slice(0, 160)));
};
