// 패배 → 문화의집 부활 → 다시 목적지까지 길안내가 이어지는지 검증
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;

  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();

  // 2장(상리) 상태로 만들고 상리로 이동
  await h.page.evaluate(() => {
    const Q = window.QUESTS || window.BD_QUESTS;
    const i = Q.findIndex(q => q.id === 'ch2');
    for (let k = 0; k < i; k++) Q[k].objectives[0].cur = Q[k].objectives[0].need;
    BD.questIdx = i;
    BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true;
    localStorage.setItem('bd_tut2_done', '1');
    if (typeof fadeToStage === 'function') fadeToStage(213); else currentStage = 213;
  });
  await h.wait(5000); await A.advance();
  let p = await A.probe();
  say('상리 진입: stage=' + p.stage + ' 목표=' + (p.tgt ? p.tgt.label + '@' + p.tgt.rx.toFixed(3) + ',' + p.tgt.ry.toFixed(3) : 'none'));
  await h.shot('d_01_sangri');

  // 패배 처리
  say('▶ 강제 패배 (HP 0)');
  await h.page.evaluate(() => { try { showGameOver(); } catch (e) { } });
  await h.wait(4000);
  await A.advance();
  await h.wait(2500);
  p = await A.probe();
  say('부활 후: stage=' + p.stage + ' (' + p.stageName + ') hp=' + p.hp + ' 목표=' + (p.tgt ? p.tgt.label + '@' + p.tgt.rx.toFixed(3) + ',' + p.tgt.ry.toFixed(3) : 'none'));
  await h.shot('d_02_revived');

  if (!p.tgt) { say('❌ 부활 직후 길안내 없음 — 진행 막힘'); }
  else say('✅ 부활 직후 길안내 있음: ' + p.tgt.label);

  // 실제로 밖으로 나가서 상리까지 갈 수 있는지
  const res = await A.run(40);
  say('RESULT: ' + JSON.stringify({ ok: res.ok, reason: res.reason, step: res.step }));
  p = await A.probe();
  say('최종: stage=' + p.stage + ' (' + p.stageName + ') 목표=' + (p.tgt ? p.tgt.label : 'none'));
  await h.shot('d_03_final');
};
