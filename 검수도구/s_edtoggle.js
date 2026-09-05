// 에디터 열기 → 닫기 → 게임 복귀가 되는지 (ESC / 토글 버튼 / Ctrl+E 세 경로)
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); if (typeof fadeToStage === 'function') fadeToStage(212); });
  await h.wait(4500); await A.advance();

  const snap = async (tag) => {
    const s = await h.page.evaluate(() => {
      const cv = document.getElementById('game-canvas');
      return {
        edOn: !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled),
        raf: !!window.__gameLoopChainAlive,
        blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
        gs: (() => { const e = document.getElementById('game-screen'); return e ? getComputedStyle(e).display : '-'; })(),
        hero: [heroX.toFixed(4), heroY.toFixed(4)],
        cam: [camX.toFixed(4), camY.toFixed(4)],
        scale: typeof currentScale !== 'undefined' ? +currentScale.toFixed(3) : null,
        vw: typeof VIEWPORT_W !== 'undefined' ? +VIEWPORT_W.toFixed(4) : null,
        transitioning: (() => { try { return transitioning; } catch (e) { return 'n/a'; } })(),
        canvasW: cv ? cv.width : 0,
        scene: !!window.__bdSceneActive,
        title: (() => { const e = document.getElementById('bd-title-screen'); return e ? e.classList.contains('show') : '-'; })(),
        bodyCls: document.body.className,
        toggleVis: (() => { const e = document.getElementById('bge-toggle'); if (!e) return '-'; const cs = getComputedStyle(e); return cs.display + '/' + cs.opacity; })(),
      };
    });
    say(`[${tag}] ${JSON.stringify(s)}`);
    return s;
  };
  const canMove = async () => {
    const p0 = await h.page.evaluate(() => [heroX, heroY]);
    await h.hold('d', 400); await h.hold('s', 300);
    const p1 = await h.page.evaluate(() => [heroX, heroY]);
    return Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.002;
  };

  await snap('기준');
  say('이동 가능=' + await canMove());

  // ── 경로 1: 토글 버튼으로 열고 → ESC로 닫기 ──
  say('\n▶ ① 버튼으로 열기');
  await h.page.evaluate(() => document.getElementById('bge-toggle').click()); await h.wait(1500);
  await snap('열림');
  await h.shot('et_01_open');
  say('▶ ESC로 닫기');
  await h.page.keyboard.press('Escape'); await h.wait(1500);
  const a = await snap('ESC닫기 후');
  const mv1 = await canMove();
  say('이동 가능=' + mv1 + (mv1 ? ' ✅' : ' ❌ 멈춤!'));
  await h.shot('et_02_after_esc');

  // ── 경로 2: 버튼으로 열고 → 버튼으로 닫기 ──
  say('\n▶ ② 버튼으로 열기');
  await h.page.evaluate(() => document.getElementById('bge-toggle').click()); await h.wait(1500);
  await snap('열림2');
  say('▶ 버튼으로 닫기');
  await h.page.evaluate(() => document.getElementById('bge-toggle').click()); await h.wait(1500);
  await snap('버튼닫기 후');
  const mv2 = await canMove();
  say('이동 가능=' + mv2 + (mv2 ? ' ✅' : ' ❌ 멈춤!'));
  await h.shot('et_03_after_btn');

  // ── 경로 3: Ctrl+E 열고 닫기 ──
  say('\n▶ ③ Ctrl+E 토글');
  await h.page.keyboard.press('Control+e'); await h.wait(1200);
  await snap('CtrlE 열림');
  await h.page.keyboard.press('Control+e'); await h.wait(1200);
  await snap('CtrlE 닫기 후');
  const mv3 = await canMove();
  say('이동 가능=' + mv3 + (mv3 ? ' ✅' : ' ❌ 멈춤!'));
  await h.shot('et_04_after_ctrle');
};
