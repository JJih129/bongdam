// 상리(213)에서 위험요소 F → 조사 선택창이 «화면에» 보이는지 타임라인 기록
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  const SID = Number(process.env.CH_SID || 213);
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate((sid) => {
    localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_battle_tutorial_seen', '1');
    const Q = window.QUESTS || window.BD_QUESTS;
    const map = { 212: 'ch1', 213: 'ch2', 211: 'ch3', 210: 'ch4' };
    const qi = Q.findIndex(q => q.id === map[sid]);
    for (let k = 0; k < qi; k++) Q[k].objectives[0].cur = Q[k].objectives[0].need;
    BD.questIdx = qi;
    BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true;
    // 이 리의 부탁을 수락 상태로 (조사 가능하게)
    const s = {}; (window.BD_hzQuestMap ? BD_hzQuestMap(sid) : []).forEach(m => s[m.id] = 'a');
    localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
    if (typeof fadeToStage === 'function') fadeToStage(sid);
  }, SID);
  await h.wait(5000); await A.advance(); await A.P.install();

  const hz = await h.page.evaluate((sid) => (STAGES[sid].objects || [])
    .filter(o => o && o.interactable === 'hazard' && o.hazardId && !o.isBoss && !(window.BD && BD.purified && BD.purified[o.hazardId]))
    .map(o => ({ id: o.hazardId, l: o.label, rx: o.rx, ry: o.ry, rw: o.rw || 0.05, rh: o.rh || 0.04 })), SID);
  say(`[${SID}] 미정화 위험요소: ` + JSON.stringify(hz.map(x => x.id)));
  if (!hz.length) return;
  const t = hz[0];
  await A.P.walk(t.rx + t.rw / 2, t.ry + t.rh + 0.015, L);
  await h.wait(600);

  // 타임라인 감시 설치
  await h.page.evaluate(() => {
    window.__cl = [];
    const rec = () => {
      const c = document.getElementById('bd-choice');
      const d = document.getElementById('dialogue-box');
      const entry = {
        t: Math.round(performance.now()),
        choice: c ? { cls: c.className, disp: getComputedStyle(c).display, op: getComputedStyle(c).opacity, h: Math.round(c.getBoundingClientRect().height), top: Math.round(c.getBoundingClientRect().top) } : null,
        dlg: d && d.getBoundingClientRect().height > 2 ? (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) : null,
        hsr: !!(window.HSR && HSR.active),
      };
      const last = window.__cl[window.__cl.length - 1];
      if (!last || JSON.stringify(last.choice) !== JSON.stringify(entry.choice) || last.dlg !== entry.dlg || last.hsr !== entry.hsr) window.__cl.push(entry);
    };
    window.__clIv = setInterval(rec, 120);
  });
  const pre = await h.page.evaluate(() => {
    const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none') return false; return e.getBoundingClientRect().height > 2; };
    const nh = (typeof getNearHazard === 'function') ? getNearHazard() : 'no-fn';
    let gate = null; try { gate = nh && nh.hazardId ? window.BD_hzQuestGate(nh) : 'n/a'; } catch (e) { gate = 'err:' + e; }
    let nr = null; try { nr = window.BD_nearResident && window.BD_nearResident(); } catch (e) { }
    return {
      hero: [heroX.toFixed(3), heroY.toFixed(3)],
      nearHazard: nh && nh.hazardId ? nh.hazardId : String(nh && nh.label || nh),
      gate,
      nearResident: nr ? (nr.npcName || nr.label) : null,
      placeCard: on(document.getElementById('bd-place-card')),
      blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
      busFlag: !!window.__bdBusModalOpen,
      dlgWasUp: window.__bdDlgWasUp ? (Date.now() - window.__bdDlgWasUp) : null,
      facModal: on(document.getElementById('bd-district-facility-modal')),
    };
  });
  say('사전 상태: ' + JSON.stringify(pre));
  say('▶ F (조사)');
  await h.page.keyboard.press('f');
  await h.wait(1500);
  await h.shot('ch_' + SID + '_01_afterF');
  // 대사 넘기기 (Space 2번)
  await h.page.keyboard.press('Space'); await h.wait(700);
  await h.shot('ch_' + SID + '_02');
  await h.page.keyboard.press('Space'); await h.wait(700);
  await h.page.keyboard.press('Space'); await h.wait(1200);
  await h.shot('ch_' + SID + '_03');
  const tl = await h.page.evaluate(() => { clearInterval(window.__clIv); return window.__cl; });
  tl.forEach(e => say('  ' + JSON.stringify(e)));
};
