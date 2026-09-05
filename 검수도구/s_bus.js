// 버스정류장 모달이 닫힌 뒤에도 화면에 남는지 + 주민 대화가 정상인지
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); try { BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; } catch (e) { } if (typeof fadeToStage === 'function') fadeToStage(212); });
  await h.wait(5000); await A.advance();
  await A.P.install();

  const busInfo = async () => await h.page.evaluate(() => {
    const e = document.getElementById('bd-bus-modal');
    if (!e) return 'no-el';
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    return { disp: cs.display, op: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), cls: e.className, flag: !!window.__bdBusModalOpen };
  });
  say('시작 시 버스모달: ' + JSON.stringify(await busInfo()));

  // 버스정류장으로
  const bs = await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.interactable === 'bus_stop'); return o ? { rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh } : null; });
  await A.P.walk(bs.rx + bs.rw / 2, bs.ry + bs.rh + 0.015, L);
  await h.page.keyboard.press('f'); await h.wait(1500);
  say('F 후 버스모달: ' + JSON.stringify(await busInfo()));
  await h.shot('bus_01_open');
  await h.page.keyboard.press('Escape'); await h.wait(1200);
  say('ESC 후 버스모달: ' + JSON.stringify(await busInfo()));
  await h.shot('bus_02_closed');

  // 주민 은지에게 대화
  const nz = await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && x.npcName === '은지'); return o ? { rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh } : null; });
  await A.P.walk(nz.rx + nz.rw / 2, nz.ry + nz.rh + 0.012, L);
  await h.page.keyboard.press('f'); await h.wait(1300);
  const d = await h.page.evaluate(() => ({
    name: (() => { const e = document.getElementById('dialogue-name'); return e && e.getBoundingClientRect().height > 2 ? e.textContent.trim() : null; })(),
    txt: (() => { const e = document.getElementById('dialogue-box'); return e && e.getBoundingClientRect().height > 2 ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50) : null; })(),
  }));
  say('은지 대화: ' + JSON.stringify(d));
  await h.shot('bus_03_npc');
};
