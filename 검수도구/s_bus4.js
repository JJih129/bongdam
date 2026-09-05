// 각 리의 버스정류장: 열기 → ESC 닫기 → 사방 이동 복구 확인
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); try { BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; } catch (e) { } });
  await h.wait(500);

  for (const sid of [212, 211, 210]) {
    await h.page.evaluate(s => { if (typeof fadeToStage === 'function') fadeToStage(s); }, sid);
    await h.wait(4000); await A.advance();
    const bs = await h.page.evaluate(s => { const o = (STAGES[s].objects || []).find(x => x && x.interactable === 'bus_stop'); return o ? { rx: o.rx, ry: o.ry, rw: o.rw || 0.05, rh: o.rh || 0.04 } : null; }, sid);
    if (!bs) { say(`[${sid}] 버스정류장 없음`); continue; }
    await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [bs.rx + bs.rw / 2, bs.ry + bs.rh + 0.03]);
    await h.wait(900);
    await A.advance();
    await h.page.keyboard.press('f'); await h.wait(1400);
    const open = await h.page.evaluate(() => ({ el: !!document.getElementById('bd-bus-modal'), flag: !!window.__bdBusModalOpen }));
    await h.page.keyboard.press('Escape'); await h.wait(1200);
    const closed = await h.page.evaluate(() => ({ el: !!document.getElementById('bd-bus-modal'), flag: !!window.__bdBusModalOpen, blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()) }));
    const dirs = {};
    for (const [k, n] of [['w', '위'], ['s', '아래'], ['a', '왼'], ['d', '우']]) {
      const p0 = await h.page.evaluate(() => [heroX, heroY]);
      await h.hold(k, 380);
      const p1 = await h.page.evaluate(() => [heroX, heroY]);
      dirs[n] = (Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1])) > 0.002;
    }
    const any = Object.values(dirs).some(Boolean);
    say(`[${sid}] 열림=${JSON.stringify(open)} → ESC 후=${JSON.stringify(closed)} 이동=${JSON.stringify(dirs)} ${any ? '✅' : '❌ 사방 막힘'}`);
    if (!any) await h.shot('bus4_BAD_' + sid);
  }
};
