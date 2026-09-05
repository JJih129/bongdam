// 위치별 FPS 그리드 — 어느 지점에서 느려지는지 실측 (212·211)
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(350); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });
  const fpsAt = async (sid, x, y) => {
    await h.page.evaluate((p) => { if (Number(currentStage) !== p.sid) fadeToStage(p.sid, p.x, p.y); else { heroX = p.x; heroY = p.y; camX = heroX; camY = heroY; } }, { sid, x, y });
    await h.wait(700);
    return await h.page.evaluate(() => new Promise(res => {
      let n = 0; const t0 = performance.now();
      (function tick() { n++; if (performance.now() - t0 < 1200) requestAnimationFrame(tick); else res(Math.round(n / 1.2)); })();
    }));
  };
  for (const sid of [212, 211, 213, 210]) {
    const rows = [];
    for (let gy = 0.15; gy <= 0.9; gy += 0.185) {
      const row = [];
      for (let gx = 0.12; gx <= 0.9; gx += 0.195) {
        row.push(await fpsAt(sid, +gx.toFixed(2), +gy.toFixed(2)));
      }
      rows.push('y=' + gy.toFixed(2) + '  ' + row.map(v => String(v).padStart(3)).join(' '));
      // 대사·연출 소거
      await h.page.keyboard.press(' ');
    }
    say(`── 스테이지 ${sid} FPS 그리드 (x: 0.12~0.90) ──`);
    rows.forEach(r => say('  ' + r));
  }
  say('콘솔 오류: ' + h.consoleErrors.length);
};
