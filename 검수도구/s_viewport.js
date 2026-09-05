module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  const tag = process.env.VTAG || 'vp';
  await h.shot(tag + '_00_title');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.wait(400); await h.shot(tag + '_01_charsel');
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance(); await h.wait(600);
  await h.shot(tag + '_02_field');
  // 화면 밖으로 넘치는 요소 확인
  const over = await h.page.evaluate(() => {
    const W = innerWidth, H = innerHeight;
    return [...document.querySelectorAll('body *')].filter(e => {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      const r = e.getBoundingClientRect();
      if (r.width < 40 || r.height < 16) return false;
      return r.right > W + 4 || r.bottom > H + 4 || r.left < -4 || r.top < -4;
    }).map(e => { const r = e.getBoundingClientRect(); return { id: e.id || ('.' + String(e.className).split(' ')[0]), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }; }).slice(0, 12);
  });
  say('화면 밖으로 넘친 요소: ' + JSON.stringify(over));
  const p = await A.probe();
  say('상태: stage=' + p.stage + ' 목표=' + (p.tgt ? p.tgt.label : 'none') + ' blocked=' + p.blocked);
};
