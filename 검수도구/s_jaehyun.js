module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => {
    const Q = window.QUESTS || window.BD_QUESTS;
    const i = Q.findIndex(q => q.id === 'ch3');
    for (let k = 0; k < i; k++) Q[k].objectives[0].cur = Q[k].objectives[0].need;
    BD.questIdx = i; localStorage.setItem('bd_tut2_done', '1');
    BD.purified = BD.purified || {};
    ['ow212_trash_1', 'ow212_kickboard_1', 'ow212_bicycle_1', 'ow213_bottle_1', 'ow213_glass_1', 'ow213_alley_1', 'ow211_graffiti_1'].forEach(k => BD.purified[k] = true);
    const s = JSON.parse(localStorage.getItem('bd_hzquest_v57') || '{}');
    s['ow211_graffiti_1'] = 'a';
    localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
    if (typeof fadeToStage === 'function') fadeToStage(211);
  });
  await h.wait(5000); await A.advance();

  const j = await h.page.evaluate(() => {
    const o = (STAGES[211].objects || []).find(x => x && x.npcName === '재현');
    return o ? { rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh, lines: o.__bdHzQuestLines, label: o.label } : null;
  });
  say('재현: ' + JSON.stringify(j));

  const spots = [['아래', j.rx + j.rw / 2, j.ry + j.rh + 0.02], ['아래가까이', j.rx + j.rw / 2, j.ry + j.rh + 0.005], ['왼쪽', j.rx - 0.02, j.ry + j.rh / 2], ['오른쪽', j.rx + j.rw + 0.02, j.ry + j.rh / 2], ['위', j.rx + j.rw / 2, j.ry - 0.02]];
  for (const [name, x, y] of spots) {
    await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [x, y]);
    await h.wait(800);
    const near = await h.page.evaluate(() => {
      const r = window.BD_nearResident ? window.BD_nearResident() : null;
      let kind = null; try { kind = window.__bdNearKind; } catch (e) { }
      return { near: r ? (r.npcName || r.label) : null, kind, coll: _collidesAt(heroX, heroY) };
    });
    await h.page.keyboard.press('f'); await h.wait(1300);
    const st = await h.page.evaluate(() => ({
      dlg: (() => { const e = document.getElementById('dialogue-box'); return e && e.getBoundingClientRect().height > 2 ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50) : null; })(),
      blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
    }));
    say(`${name} (${x.toFixed(3)},${y.toFixed(3)}) near=${near.near} kind=${near.kind} 충돌=${near.coll} → 대사="${st.dlg}" blocked=${st.blocked}`);
    for (let k = 0; k < 12; k++) { const b = await L.blocked(); if (!b.b) break; await h.page.keyboard.press('Space'); await h.wait(300); }
  }
};
