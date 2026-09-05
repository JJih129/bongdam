// 사용자 상황 정밀 재현: 상리 2/3, 세 번째(부탁 미수락) 위험요소 앞에서 F
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_battle_tutorial_seen', '1');
    const Q = window.QUESTS || window.BD_QUESTS;
    const qi = Q.findIndex(q => q.id === 'ch2');
    for (let k = 0; k < qi; k++) Q[k].objectives[0].cur = Q[k].objectives[0].need;
    BD.questIdx = qi; Q[qi].objectives[0].cur = 2;
    BD.purified = { ow212_trash_1: true, ow212_kickboard_1: true, ow212_bicycle_1: true, ow213_bottle_1: true, ow213_glass_1: true };
    localStorage.setItem('bd_hzquest_v57', JSON.stringify({ ow212_kickboard_1: 'a', ow212_bicycle_1: 'a', ow213_bottle_1: 'a', ow213_glass_1: 'a' }));
    heroHP = 45; if (window.BD_syncHP) BD_syncHP(45, false);
    if (typeof fadeToStage === 'function') fadeToStage(213);
  });
  await h.wait(5000); await A.advance();

  // 어두운 산책로(부탁 미수락) 옆으로 순간이동
  const t = await h.page.evaluate(() => { const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_alley_1'); return { rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh }; });
  await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [t.rx + t.rw / 2, t.ry + t.rh + 0.02]);
  await h.wait(900);
  const pre = await h.page.evaluate(() => {
    const nh = getNearHazard();
    return { hero: [heroX.toFixed(3), heroY.toFixed(3)], near: nh && nh.hazardId, gate: nh ? window.BD_hzQuestGate(nh) : null, blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()) };
  });
  say('사전: ' + JSON.stringify(pre));
  await h.shot('u2_00_before');
  await h.page.evaluate(() => {
    window.__cl = [];
    window.__clIv = setInterval(() => {
      const g = id => { const e = document.getElementById(id); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && r.height > 2 ? Math.round(r.height) : 0; };
      const d = document.getElementById('dialogue-box');
      const e2 = { t: Math.round(performance.now()), ch: g('bd-choice'), dlg: d && d.getBoundingClientRect().height > 2 ? (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 45) : null, dami: g('bd-dami-hud') };
      const last = window.__cl[window.__cl.length - 1];
      if (!last || JSON.stringify(last) !== JSON.stringify({ ...e2, t: last.t })) window.__cl.push(e2);
    }, 130);
  });
  say('▶ F ×3');
  for (let i = 0; i < 3; i++) { await h.page.keyboard.press('f'); await h.wait(900); await h.shot('u2_0' + (i + 1) + '_F'); }
  const tl = await h.page.evaluate(() => { clearInterval(window.__clIv); return window.__cl; });
  tl.forEach(e => say('  ' + JSON.stringify(e)));
};
