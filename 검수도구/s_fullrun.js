// 완주 검증 — 타이틀→엔딩 무인 완주 + 1초 단위 타임라인 관측 (0단계/완주검증 겸용)
const fs = require('fs');
const path = require('path');
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  const T0 = Date.now();

  // 1초 단위 타임라인 레코더 — 시작하기가 페이지를 리로드할 수 있어 시작 후 설치
  const installTL = async () => await h.page.evaluate(() => {
    window.__bdTL = [];
    window.__bdTL0 = Date.now();
    setInterval(() => {
      try {
        window.__bdTL.push({
          t: Math.round((Date.now() - window.__bdTL0) / 1000),
          stg: (typeof currentStage !== 'undefined') ? Number(currentStage) : null,
          blk: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
          scn: !!window.__bdSceneActive,
          hsr: !!(window.HSR && HSR.active),
          dlg: (() => { const e = document.getElementById('dialogue-overlay'); return e ? getComputedStyle(e).display : '-'; })(),
          q: (() => { try { const q = (window.QUESTS || [])[BD.questIdx]; return q ? q.id : null; } catch (e) { return null; } })(),
        });
        if (window.__bdTL.length > 4200) window.__bdTL.shift();
      } catch (e) { }
    }, 1000);
  });

  say('▶ 시작하기');
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) {
    const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); });
    if (v) break; await h.wait(200);
  }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000);
  await installTL();

  const dumpTL = async () => {
    try {
      const tl = await h.page.evaluate(() => window.__bdTL || []);
      fs.writeFileSync(path.join(h.SHOTS, '_timeline.json'), JSON.stringify(tl), 'utf8');
    } catch (e) { }
  };

  let cleared = false, lastResult = null, loopFails = 0;
  const MAX_MIN = 55;
  for (let chunk = 0; chunk < 30; chunk++) {
    if ((Date.now() - T0) / 60000 > MAX_MIN) { say('⏱ 전체 시간 초과'); break; }
    lastResult = await A.run(40);
    await dumpTL();
    fs.writeFileSync(path.join(h.SHOTS, '_script.txt'), A.script.map(x => `(${x.stage}) ${x.t}`).join('\n'), 'utf8');
    cleared = await h.page.evaluate(() => !!(window.BD && BD.gameCleared));
    const p = await A.probe();
    say(`◇ 청크${chunk} 종료: ok=${lastResult.ok} reason=${lastResult.reason} cleared=${cleared} stg=${p.stage} 정화=${p.purified.length} 경과=${((Date.now() - T0) / 60000).toFixed(1)}분`);
    await h.shot(`chunk${String(chunk).padStart(2, '0')}_stg${p.stage}`);
    if (cleared) break;
    if (!lastResult.ok) {
      // (v331) 컷신·인트로 재생 등 일시 정체는 재시도 — 연속 3회 실패 시에만 종료
      loopFails++;
      if (/^loop:|^no-guide/.test(lastResult.reason || '') && loopFails <= 3) { say('↻ 정체 재시도 ' + loopFails + '/3'); continue; }
      say('⛔ 완주 실패 지점: ' + lastResult.reason);
      break;
    } else loopFails = 0;
  }

  await dumpTL();
  const fin = await A.probe();
  const endingShown = await h.page.evaluate(() => { const m = document.getElementById('bd-ending-modal'); return !!(m && m.classList.contains('show')); });
  say('FINAL: ' + JSON.stringify({
    cleared, endingShown, stage: fin.stage, quest: fin.quest, purified: fin.purified.length,
    minutes: +((Date.now() - T0) / 60000).toFixed(1), lastReason: lastResult && lastResult.reason,
  }));
  await h.shot('99_final');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
