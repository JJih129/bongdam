// 라운드 15 후반 — ⑥ CPU 스로틀 시 이동속도 유지 + ④ 전투 튜토 대사 반복 재현
module.exports = async (h) => {
  const { say } = h;
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(211, 0.45, 0.75);   // 동화리 — 전투 튜토 미완(bd_battle_tutorial_done 미설정)
  });
  await h.wait(2500);
  const drain = async (n = 25) => {
    for (let t = 0; t < n; t++) {
      const open = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
      });
      if (!open) return;
      await h.page.keyboard.press(' '); await h.wait(420);
    }
  };
  await drain(35);

  // ── ⑥ CPU 4배 스로틀 전/후 이동거리 비교 ──
  const speedRun = async () => {
    // 충돌 없는 지점 확보
    await h.page.evaluate(() => {
      for (let x = 0.2; x <= 0.8; x += 0.04) {
        try { if (!_collidesAt(x, 0.72) && !_collidesAt(x + 0.06, 0.72)) { heroX = x; heroY = 0.72; camX = heroX; camY = heroY; return; } } catch (e) { }
      }
    });
    await h.wait(400);
    const x0 = await h.page.evaluate(() => heroX);
    await h.hold('d', 1200);
    const x1 = await h.page.evaluate(() => heroX);
    return x1 - x0;
  };
  const dNormal = await speedRun();
  const cdp = await h.page.context().newCDPSession(h.page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await h.wait(500);
  const kThrottled = await h.page.evaluate(() => window.__bdFrameK);
  const dSlow = await speedRun();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const ratio = dSlow / Math.max(0.0001, dNormal);
  say(`⑥ 이동거리 정상=${dNormal.toFixed(4)} 스로틀4x=${dSlow.toFixed(4)} 비율=${ratio.toFixed(2)} (K=${kThrottled && kThrottled.toFixed ? kThrottled.toFixed(2) : kThrottled})`);
  say((ratio > 0.8 && ratio < 1.25 ? '✅' : '❌') + ' ⑥ FPS 무관 이동속도 (±20%)');

  // ── ④ 전투 튜토 대사 — 1회차 전투 → 이탈 → 2회차 전투에서 반복 여부 ──
  await h.page.evaluate(() => {
    if (!window.__damiLog) {
      window.__damiLog = [];
      const iv = setInterval(() => {
        if (!(window.BD_DAMI && BD_DAMI.show)) return;
        clearInterval(iv);
        const o = BD_DAMI.show;
        BD_DAMI.show = function (t, opts) { const r = o.apply(this, arguments); if (r !== false) window.__damiLog.push(String(t).slice(0, 30)); return r; };
      }, 100);
    }
    BD.questIdx = 3; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
  });
  await h.wait(500);
  const battleOnce = async (label) => {
    await h.page.evaluate(() => {
      const list = (STAGES[211].objects || []).filter(x => x && x.hazardId && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
      const t = list[0];
      if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
      window.__damiLog.length = 0;
    });
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(550); await h.page.keyboard.press('f'); await h.wait(700);
    let inBattle = false;
    // 전투 튜토 잠금 흐름 대응 — 튜토 스텝 소화(Space) + 주기적 F 재시도
    for (let k = 0; k < 34 && !inBattle; k++) {
      const st = await h.page.evaluate(() => ({ choice: !!(window.__bdChoiceState && __bdChoiceState.open), hsr: !!(window.HSR && HSR.active) }));
      inBattle = st.hsr;
      if (inBattle) break;
      if (st.choice) { await h.wait(450); await h.page.keyboard.press('Enter'); await h.wait(500); continue; }
      await h.page.keyboard.press(' '); await h.wait(350);
      if (k % 3 === 2) { await h.page.keyboard.press('f'); await h.wait(350); await h.page.keyboard.press('f'); await h.wait(350); }
    }
    await h.wait(2500);   // 전투 개시 직후 튜토 대사 관찰
    const lines = await h.page.evaluate(() => window.__damiLog.slice());
    say(label + ' 전투=' + inBattle + ' 담이 대사 ' + lines.length + '줄: ' + JSON.stringify(lines.slice(0, 8)));
    if (inBattle) { await A.doBattle(); await h.wait(1500); await drainInner(); }   // 실제 승리 종료
    return { inBattle, lines };
  };
  const drainInner = async () => { for (let i = 0; i < 10; i++) { const o = await h.page.evaluate(() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); }); if (!o) break; await h.page.keyboard.press(' '); await h.wait(400); } };
  h.page.on('console', m => { const t = m.text(); if (/v337/.test(t)) say('  콘솔: ' + t.slice(0, 90)); });
  const r1 = await battleOnce('④ 1회차');
  await h.wait(1500);
  const st1 = await h.page.evaluate(() => ({
    running: BD_TUTOR.isRunning(), step: window.__bdTutStepId || null, hsr: !!(window.HSR && HSR.active),
    done: localStorage.getItem('bd_battle_tutorial_done'),
  }));
  say('1회차 종료 후 상태: ' + JSON.stringify(st1));
  if (st1.running) {
    const manual = await h.page.evaluate(() => { try { BD_TUTOR.skip(); } catch (e) { return 'err:' + e; } return BD_TUTOR.isRunning(); });
    say('수동 skip 후 running: ' + manual);
  }
  // 2회차 전 run 스파이 — 누가 튜토를 다시 거는가
  await h.page.evaluate(() => {
    if (!BD_TUTOR.run.__spyR) {
      const o = BD_TUTOR.run;
      window.__runLog = [];
      BD_TUTOR.run = function (steps, startAt, tag) {
        try { window.__runLog.push({ tag, n: (steps || []).length, stack: String(new Error().stack).split('\n').slice(2, 5).map(s => s.trim().replace(/file:\/\/\/[^\s)]*html/, 'html')).join(' | ').slice(0, 260) }); } catch (e) { }
        return o.apply(this, arguments);
      };
      BD_TUTOR.run.__spyR = true;
    }
  });
  const r2 = await battleOnce('④ 2회차');
  say('run 스파이: ' + JSON.stringify(await h.page.evaluate(() => window.__runLog), null, 1).slice(0, 900));
  const tutoLines1 = (r1.lines || []).filter(t => /전투|스킬|카드|턴|공격/.test(t));
  const tutoLines2 = (r2.lines || []).filter(t => /전투|스킬|카드|턴|공격/.test(t));
  const repeat = tutoLines2.filter(t => tutoLines1.includes(t));
  say('④ 튜토성 대사 1회차 ' + tutoLines1.length + '줄 · 2회차 ' + tutoLines2.length + '줄 · 반복 ' + repeat.length + '줄 ' + JSON.stringify(repeat.slice(0, 5)));
  say((r1.inBattle && r2.inBattle ? (repeat.length === 0 ? '✅ ④ 반복 없음' : '❌ ④ 반복 재생: ' + repeat.length + '줄') : '⚠ 전투 진입 실패로 판정 불가'));
  say('콘솔 오류: ' + h.consoleErrors.length);
};
