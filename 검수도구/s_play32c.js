// 오토파일럿 청크 플레이스루 — 비트 전환마다 촬영 + 안전수칙/전투튜토 관측 훅
module.exports = async (h) => {
  const { say } = h;
  const A = require('./auto')(h, require('./lib')(h));
  const shot = async (n) => { await h.shot(n); say('📸 ' + n); };
  await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 20; t++) {
    const st = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    });
    if (!st && t > 2) break;
    await h.wait(600);
  }
  await h.wait(2000);
  // 관측 훅: 안전수칙 카드·전투튜토 스포트라이트·선택창 텍스트 기록
  await h.page.evaluate(() => {
    window.__obs = { safetip: null, battleSpot: null, choiceSeen: null };
    setInterval(() => {
      try {
        const t = document.querySelector('#bd-result-modal .bd-safetip');
        if (t && !window.__obs.safetip) window.__obs.safetip = (t.textContent || '').replace(/\s+/g, ' ').slice(0, 60);
        const s = document.getElementById('bd-spot');
        if (s && s.style.display !== 'none' && window.HSR && HSR.active && !window.__obs.battleSpot) {
          const r = s.getBoundingClientRect();
          const e = document.querySelector('.hsr-enemy .hsr-sprite');
          const er = e ? e.getBoundingClientRect() : null;
          window.__obs.battleSpot = { spot: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], enemy: er ? [Math.round(er.left), Math.round(er.top), Math.round(er.width), Math.round(er.height)] : null };
        }
        const c = document.getElementById('bd-choice');
        if (c && window.__bdChoiceState && __bdChoiceState.open && !window.__obs.choiceSeen) window.__obs.choiceSeen = (c.textContent || '').replace(/\s+/g, ' ').slice(0, 50);
      } catch (e) { }
    }, 250);
  });
  let lastSid = 0, battleShot = false, chunks = 0;
  while (chunks++ < 16) {
    await A.run(4);
    const st = await h.page.evaluate(() => ({
      sid: Number(currentStage), q: (window.BD && BD.questIdx) || 0,
      pur: Object.keys((window.BD && BD.purified) || {}).filter(k => BD.purified[k]).length,
      hsr: !!(window.HSR && HSR.active),
      obs: window.__obs,
    }));
    say(`◇ 청크${chunks}: stage=${st.sid} q=${st.q} 정화=${st.pur} hsr=${st.hsr}`);
    if (st.sid !== lastSid) { lastSid = st.sid; await shot('r_stage' + st.sid + '_' + chunks); }
    if (st.hsr && !battleShot) { battleShot = true; await shot('r_battle_' + chunks); }
    if (st.pur >= 2 && st.obs.safetip) break;
  }
  const fin = await h.page.evaluate(() => window.__obs);
  say('관측: ' + JSON.stringify(fin));
  await shot('r_final');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 150)));
};
