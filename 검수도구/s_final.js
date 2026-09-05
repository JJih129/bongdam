// 최종장(보스 → 엔딩 → 결과 리포트) 집중 검증
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;

  say('▶ 시작하기');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);
  await A.advance();

  // 최종장 상태로 강제 진행
  const setup = await h.page.evaluate(() => {
    const out = {};
    try {
      const Q = window.QUESTS || window.BD_QUESTS;
      const fi = Q.findIndex(q => q.id === 'final');
      // 1~4장 목표 채우기
      for (let i = 0; i < fi; i++) { Q[i].objectives[0].cur = Q[i].objectives[0].need; }
      BD.questIdx = fi;
      BD.trackedQuest = 'final';
      // 보스 제외 모든 위험요소 정화 처리
      BD.purified = BD.purified || {};
      [210, 211, 212, 213].forEach(sid => {
        (STAGES[sid].objects || []).forEach(o => {
          if (o && o.interactable === 'hazard' && o.hazardId && o.hazardId.indexOf('final_boss') !== 0) BD.purified[o.hazardId] = true;
        });
      });
      // 부탁 상태도 완료로
      const s = {}; [210, 211, 212, 213].forEach(sid => { (window.BD_hzQuestMap ? BD_hzQuestMap(sid) : []).forEach(m => s[m.id] = 'a'); });
      localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
      localStorage.setItem('bd_tut2_done', '1');
      // 최종장 개방 조건 (스탬프·조각) 충족
      try {
        const P = window.BD_PROGRESS;
        if (P) {
          P.facility.facilityStampIds = ['a', 'b', 'c', 'd', 'e', 'f'];
          P.safety.collectedSafetyFragmentIds = ['1', '2', '3', '4'];
        }
      } catch (e) { out.progErr = String(e); }
      if (typeof bdSave === 'function') bdSave();
      if (typeof fadeToStage === 'function') fadeToStage(212); else currentStage = 212;
      out.questIdx = BD.questIdx;
    } catch (e) { out.err = String(e); }
    return out;
  });
  say('SETUP: ' + JSON.stringify(setup));
  await h.wait(5000);
  await A.advance();
  await h.wait(1000);

  const st = await A.probe();
  say('상태: stage=' + st.stage + ' quest=' + JSON.stringify(st.quest) + ' 목표=' + JSON.stringify(st.tgt));
  const bossInfo = await h.page.evaluate(() => {
    const b = (STAGES[212].objects || []).find(o => o && o.hazardId === 'final_boss_1');
    return b ? { rx: b.rx, ry: b.ry, rw: b.rw, rh: b.rh, hidden: !!b.hidden, gone: !!b.__bdGone, locked: window.BD_hazardLocked(b), variant: b.hazardVariant } : null;
  });
  say('BOSS: ' + JSON.stringify(bossInfo));
  await h.shot('f_01_final_start');

  /* 엔딩 «흐름»을 검증하는 것이 목적이므로, 전투가 길어지지 않도록
     전투가 시작되면 적 체력을 낮춰 승리 경로를 태운다 (승리 처리 자체는 게임 코드가 담당). */
  await h.page.evaluate(() => {
    window.__bdTestWeaken = setInterval(() => {
      try {
        if (window.HSR && HSR.active && HSR.enemy && HSR.enemy.hp > 12) HSR.enemy.hp = 12;
        if (window.HSR && HSR.active && HSR.hero && HSR.hero.hp < 60) HSR.hero.hp = 100;
      } catch (e) { }
    }, 400);
  });

  const res = await A.run(70);
  say('RESULT: ' + JSON.stringify({ ok: res.ok, reason: res.reason, step: res.step }));
  await h.shot('f_90_after');

  const end = await h.page.evaluate(() => ({
    purifiedBoss: !!(window.BD && BD.purified && BD.purified['final_boss_1']),
    report: (() => { const e = document.getElementById('bd-report'); return e ? getComputedStyle(e).display + '/' + e.getBoundingClientRect().height : '-'; })(),
    ending: (() => { const e = document.getElementById('bd-ending-modal'); return e ? (e.className + '/' + e.getBoundingClientRect().height) : '-'; })(),
  }));
  say('END: ' + JSON.stringify(end));
  await h.shot('f_91_end');
};
