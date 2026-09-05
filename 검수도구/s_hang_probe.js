/* 행(무한 루프) 위치 추적 — 부팅 후 212 텔레포트 → Space 로 독백 넘김 → 응답 없으면 Debugger.pause 로 콜스택 덤프 */
module.exports = async (h) => {
  const say = h.say, page = h.page;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Debugger.enable');
  let paused = null;
  cdp.on('Debugger.paused', (ev) => { paused = ev; });
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) {
    await page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} });
    await h.wait(600);
    if (await page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break;
  }
  for (let t = 0; t < 60; t++) { const s = await page.evaluate(() => Number(currentStage)); if (s >= 100) break; await h.wait(300); }
  await page.evaluate(() => fadeToStage(212, 0.5, 0.5));
  await h.wait(1500);
  for (let i = 0; i < 6; i++) {
    const t0 = Date.now();
    const r = await Promise.race([
      page.evaluate(() => ({ stage: Number(currentStage), dlg: ((document.getElementById('dialogue-box') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 40), scene: !!window.__bdSceneActive })),
      new Promise(res => setTimeout(() => res('TIMEOUT'), 4000)),
    ]);
    say('t' + i + ' ' + (Date.now() - t0) + 'ms ' + JSON.stringify(r));
    if (r === 'TIMEOUT') {
      await cdp.send('Debugger.pause');
      await new Promise(res => setTimeout(res, 1500));
      if (paused) {
        say('--- 콜스택 ---');
        paused.callFrames.slice(0, 12).forEach(f => say('  ' + f.functionName + ' @' + (f.url || '').slice(-30) + ':' + f.location.lineNumber + ':' + f.location.columnNumber));
        // 해당 위치 소스 일부
        try {
          const top = paused.callFrames[0];
          const src = await cdp.send('Debugger.getScriptSource', { scriptId: top.location.scriptId });
          const lines = src.scriptSource.split('\n');
          const L = top.location.lineNumber;
          for (let k = Math.max(0, L - 6); k <= Math.min(lines.length - 1, L + 3); k++) say((k === L ? '>> ' : '   ') + lines[k].slice(0, 160));
        } catch (e) { say('src err ' + e.message); }
      } else say('pause 응답 없음');
      return;
    }
    await page.keyboard.press(' ');
    await h.wait(1200);
  }
  say('행 없음');
};
