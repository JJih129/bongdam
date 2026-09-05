// 4단계 — FPS 측정 (필드·전투)
module.exports = async (h) => {
  const { say } = h;
  const fps = async (tag, secs = 5) => {
    const r = await h.page.evaluate(async (s) => {
      return await new Promise(res => {
        let n = 0; const t0 = performance.now();
        function tick() { n++; if (performance.now() - t0 < s * 1000) requestAnimationFrame(tick); else res(Math.round(n / s)); }
        requestAnimationFrame(tick);
      });
    }, secs);
    say(`FPS[${tag}] = ${r}`);
    return r;
  };
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
  await fps('프롤로그 실내');
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  await fps('필드(와우리)');
  // 이동 중 FPS
  await h.page.keyboard.down('d');
  const moving = await fps('필드 이동 중', 4);
  await h.page.keyboard.up('d');
  // 전투 진입
  // (v315 대응) 담이 오프닝(조사 잠금) 종료 대기
  for (let t = 0; t < 30; t++) { if (!(await h.page.evaluate(() => !!window.__bdDamiOpeningBusy))) break; await h.wait(1000); }
  await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.hazardId === 'ow212_trash_1');
    if (o) { heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.01; camX = heroX; camY = heroY; }
  });
  await h.wait(600);
  await h.page.keyboard.press('f'); await h.wait(1000);
  for (let i = 0; i < 8; i++) {
    await h.page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov && getComputedStyle(ov).display !== 'none') ov.click(); });
    await h.wait(500);
    const ch = await h.page.evaluate(() => { const o = document.querySelector('[id^="bd-ch-"]'); if (o) { o.click(); return true; } return false; });
    if (ch) break;
  }
  await h.wait(3500);
  const inBattle = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투 진입: ' + inBattle);
  if (inBattle) await fps('전투');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
