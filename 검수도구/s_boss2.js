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
    const fi = Q.findIndex(q => q.id === 'final');
    for (let k = 0; k < fi; k++) Q[k].objectives[0].cur = Q[k].objectives[0].need;
    BD.questIdx = fi; BD.trackedQuest = null;
    localStorage.setItem('bd_tut2_done', '1');
    BD.purified = BD.purified || {};
    [210, 211, 212, 213].forEach(sid => (STAGES[sid].objects || []).forEach(o => {
      if (o && o.interactable === 'hazard' && o.hazardId && o.hazardId.indexOf('final_boss') !== 0) BD.purified[o.hazardId] = true;
    }));
    if (typeof fadeToStage === 'function') fadeToStage(212);
  });
  await h.wait(5000); await A.advance();
  await h.page.evaluate(() => { heroX = 0.679; heroY = 0.366; camX = heroX; camY = heroY; });
  await h.wait(1000);

  say('▶ F 연타로 보스 대사 → 전투 진입 확인');
  for (let i = 0; i < 24; i++) {
    const st = await h.page.evaluate(() => ({
      hsr: !!(window.HSR && HSR.active),
      boss: (() => { const e = document.getElementById('bd-boss-dlg'); return e && e.classList.contains('on') ? (e.querySelector('.tx') || {}).textContent : null; })(),
      choice: (() => { const c = document.getElementById('bd-choice'); if (!c || getComputedStyle(c).display === 'none') return null; return [...c.querySelectorAll('[id^="bd-ch-"]')].map(x => x.textContent.trim()); })(),
      blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
      talked: (() => { const o = (STAGES[212].objects || []).find(x => x && x.isBoss); return !!(o && o.__bdBossTalked); })(),
    }));
    say(`  ${i}: hsr=${st.hsr} blocked=${st.blocked} talked=${st.talked} boss="${(st.boss || '').slice(0, 26)}" choice=${JSON.stringify(st.choice)}`);
    if (st.hsr) { say('  ✅ 전투 진입!'); await h.shot('b2_battle'); break; }
    if (st.choice && st.choice.length) {
      await h.page.evaluate(() => { const o = document.querySelector('[id^="bd-ch-"]'); if (o) o.click(); });
      await h.wait(900); continue;
    }
    await h.page.keyboard.press('f');
    await h.wait(700);
  }
  const fin = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('최종: 전투=' + fin);
  await h.shot('b2_end');
};
