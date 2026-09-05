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
  await h.page.click('#bge-toggle'); await h.wait(1500);

  // 계측 설치: 이벤트 여정 + 상태 스냅
  await h.page.evaluate(() => {
    window.__edLog = [];
    const S = () => { const s = BongdamEditor.state; const o = STAGES[currentStage].objects[3]; return `part=${s.selectedPart} idx=${s.selectedIndex} tool=${s.tool} drag=${s.dragging}/${s.dragMode} locked=${!!o.locked} cx=${(+o.cx).toFixed(4)} cw=${(+o.cw).toFixed(4)}`; };
    ['mousedown', 'mousemove', 'mouseup'].forEach(t => {
      // 캡처 최전방(윈도)과 버블 최후방(문서) 양쪽 기록
      window.addEventListener(t, e => { if (t !== 'mousemove' || e.buttons) window.__edLog.push(`W-${t} hh='${window.__bgeV34HandleAt ? window.__bgeV34HandleAt(e.clientX, e.clientY) : '?'}' @${Math.round(e.clientX)},${Math.round(e.clientY)} ${S()}`); }, true);
      document.addEventListener(t, e => { if (t !== 'mousemove' || e.buttons) window.__edLog.push(`D-${t}(bubble,defaultPrevented=${e.defaultPrevented}) ${S()}`); }, false);
    });
    const s = BongdamEditor.state;
    s.selectedIndex = 3; s.selectedPart = 'collider'; s.tool = 'select';
    const o = STAGES[currentStage].objects[3];
    s.editorViewMode = 'custom'; s.editorZoom = 2;
    s.editorCamX = o.rx + o.rw / 2; s.editorCamY = o.ry + o.rh / 2;
    BongdamEditor.refresh && BongdamEditor.refresh();
  });
  await h.wait(900);
  const hp = await h.page.evaluate(() => {
    const c = document.getElementById('game-canvas'); const r = c.getBoundingClientRect();
    for (let gy = 0; gy < 200; gy++) for (let gx = 0; gx < 200; gx++) {
      const x = r.left + (gx + 0.5) * r.width / 200, y = r.top + (gy + 0.5) * r.height / 200;
      if (window.__bgeV34HandleAt(x, y) === 'se') return { x, y };
    }
    return null;
  });
  say('se 핸들: ' + JSON.stringify(hp));
  const partNow = await h.page.evaluate(() => BongdamEditor.state.selectedPart);
  say('mousedown 직전 selectedPart=' + partNow);
  await h.page.mouse.move(hp.x, hp.y); await h.wait(120);
  await h.page.mouse.down(); await h.wait(150);
  await h.page.mouse.move(hp.x + 40, hp.y + 25, { steps: 4 }); await h.wait(200);
  await h.page.mouse.up(); await h.wait(400);
  const log = await h.page.evaluate(() => window.__edLog.slice(0, 40));
  log.forEach(l => say('  ' + l));
};
