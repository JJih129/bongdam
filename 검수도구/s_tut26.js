// 모바일 HUD 배율 상태에서 튜토리얼 스포트라이트 정합 실측 (TOUCH=1, 880x460)
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(3000);
  // 튜토리얼 흐름 그대로 진행하며 스포트라이트 포착 (최대 ~2분)
  const events = [];
  let shots = 0;
  for (let t = 0; t < 150; t++) {
    const st = await h.page.evaluate(() => {
      const sp = document.getElementById('bd-spot');
      const vis = sp && sp.style.display !== 'none' && sp.getBoundingClientRect().width > 4;
      const out = { spot: null, cands: {} };
      if (vis) {
        const r = sp.getBoundingClientRect();
        out.spot = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
        for (const id of ['bd-menu-btns', 'bd-quest-hud', 'bd-dami-hud', 'bd-track-chip', 'touch-controls', 'bd-touch-actions']) {
          const el = document.getElementById(id);
          if (!el) continue;
          const q = el.getBoundingClientRect();
          if (q.width > 4) out.cands[id] = [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)];
        }
        const zoomed = {};
        for (const id of ['bd-menu-btns', 'bd-quest-hud', 'bd-dami-hud']) {
          const el = document.getElementById(id);
          if (el) zoomed[id] = el.style.zoom || '';
        }
        out.zoom = zoomed;
      }
      // 진행: 대화 탭
      const b = document.getElementById('dialogue-box');
      if (b && b.getBoundingClientRect().height > 0) return { ...out, act: 'dlg' };
      const c = !!(window.__bdChoiceState && __bdChoiceState.open);
      if (c) return { ...out, act: 'choice' };
      return { ...out, act: 'idle' };
    });
    if (st.spot) {
      const key = st.spot.join(',');
      if (!events.some(e => e.key === key)) {
        // 정합: 스팟이 어떤 후보를 덮는가 (스팟이 후보 rect를 80% 이상 포함)
        let best = null;
        for (const [id, r] of Object.entries(st.cands)) {
          const ix = Math.max(0, Math.min(st.spot[0] + st.spot[2], r[0] + r[2]) - Math.max(st.spot[0], r[0]));
          const iy = Math.max(0, Math.min(st.spot[1] + st.spot[3], r[1] + r[3]) - Math.max(st.spot[1], r[1]));
          const cover = (ix * iy) / Math.max(1, r[2] * r[3]);
          if (!best || cover > best.cover) best = { id, cover: +cover.toFixed(2) };
        }
        events.push({ key, spot: st.spot, best, zoom: st.zoom });
        say(`스포트라이트 #${events.length}: ${JSON.stringify(st.spot)} → 최근접 ${JSON.stringify(best)} zoom=${JSON.stringify(st.zoom)}`);
        if (shots < 4) { await h.shot('tut26_' + events.length); shots++; }
      }
    }
    if (st.act === 'dlg') { await h.page.mouse.click(440, 230); await h.wait(320); continue; }
    if (st.act === 'choice') { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
    await h.wait(420);
    if (t % 6 === 5) { await h.page.mouse.click(440, 230); }
    if (events.length >= 4) break;
  }
  say('포착 이벤트: ' + events.length);
  const hudEvents = events.filter(e => e.best && /menu|quest|dami|track/.test(e.best.id));
  const ok = hudEvents.length === 0 || hudEvents.every(e => e.best.cover >= 0.7);
  say((events.length ? (ok ? '✅' : '❌') : '⚠') + ' HUD 대상 스포트라이트 정합(커버리지≥0.7) — HUD 이벤트 ' + hudEvents.length + '건');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
