// ① 배지 스킬 메뉴 ② 임무창(J) 목록 맥락 검증
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_battle_tutorial_seen', '1'); try { BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; } catch (e) { } if (typeof fadeToStage === 'function') fadeToStage(212); });
  await h.wait(5000); await A.advance();

  // ② 임무창
  await h.page.keyboard.press('j'); await h.wait(1400);
  await h.shot('q_01_quest');
  const q = await h.page.evaluate(() => {
    const ov = document.getElementById('quest-overlay') || [...document.querySelectorAll('.bd-modal.show')][0];
    const txt = ov ? (ov.textContent || '').replace(/\s+/g, ' ').trim() : 'no-panel';
    const subs = (window.BD_SUB_QUESTS || []).filter(x => x && x.accepted && !x.hidden).map(x => x.title || x.id);
    const npcs = (window.BD_NPC_QUESTS || []).filter(x => x && x.accepted && !x.hidden).map(x => (x.giver || '') + '/' + (x.title || x.id));
    return { txt: txt.slice(0, 420), acceptedSub: subs, acceptedNpc: npcs, tracked: window.BD && BD.trackedQuest };
  });
  say('임무창: ' + q.txt);
  say('자동 수락된 서브: ' + JSON.stringify(q.acceptedSub) + ' / NPC: ' + JSON.stringify(q.acceptedNpc) + ' / 추적=' + q.tracked);
  await h.page.keyboard.press('Escape'); await h.wait(900);

  // ① 전투 → 배지 스킬 메뉴
  await A.P.install();
  for (let i = 0; i < 14; i++) {
    const p = await A.probe();
    if (p.hsr) break;
    if (p.tgt) { await A.P.walk(p.tgt.rx + p.tgt.rw / 2, p.tgt.ry + p.tgt.rh + 0.015, L); await L.press('f', 2, 450); }
    await A.advance(); await h.wait(350);
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  if (!inB) { say('전투 진입 실패'); return; }
  for (let i = 0; i < 12; i++) { const st = await h.page.evaluate(() => (window.HSR && HSR.state) || ''); if (st === 'player') break; await h.page.keyboard.press('Space'); await h.wait(450); }
  await h.page.keyboard.press('e'); await h.wait(1300);
  await h.shot('q_02_skillmenu');
  const sm = await h.page.evaluate(() => {
    const m = document.getElementById('hsr-skill-menu');
    if (!m) return 'no-menu';
    const r = m.getBoundingClientRect();
    return { visible: getComputedStyle(m).display !== 'none' && r.height > 10, txt: (m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) };
  });
  say('배지 스킬 메뉴: ' + JSON.stringify(sm));
  // 닫기
  await h.page.keyboard.press('e'); await h.wait(800);
  const closed = await h.page.evaluate(() => !document.getElementById('hsr-skill-menu'));
  say('  E 토글 닫기=' + closed);
  await h.page.keyboard.press('Escape'); await h.wait(2000);
  for (let k = 0; k < 20; k++) { const b = await L.blocked(); if (!b.b) break; await h.page.keyboard.press('Space'); await h.wait(250); }
};
