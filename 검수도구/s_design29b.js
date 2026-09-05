// 게이트 필드 덤프 + ②④ 재검
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    BD.questIdx = 3;
    fadeToStage(211, 0.5, 0.6);
  });
  await h.wait(2200);
  // 오프닝·프롤로그 대사 전부 소화
  for (let t = 0; t < 50; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || !!(window.__bdChoiceState && __bdChoiceState.open);
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(450);
  }
  const gates = await h.page.evaluate(() => JSON.stringify((STAGES[211].districtGates || []).slice(0, 4)));
  say('게이트 raw: ' + gates);
  // ② 미수락 위험요소 F → 주민 지목 + 추적
  await h.page.evaluate(() => {
    localStorage.removeItem('bd_hzquest_v57');   // 미수락 보장
    const t = (STAGES[211].objects || []).find(x => x && x.hazardId && !x.isBoss && !(BD.purified || {})[x.hazardId]);
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(900);
  await h.page.keyboard.press('f');
  let dlg = null;
  for (let k = 0; k < 10; k++) {
    await h.wait(420);
    dlg = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return (x && x.getBoundingClientRect().height > 0) ? (x.textContent || '').replace(/\s+/g, ' ').slice(0, 70) : null; });
    if (dlg) break;
  }
  const tr = await h.page.evaluate(() => window.__bdTrack ? __bdTrack.label : null);
  say(((dlg && /이야기를 들어보자/.test(dlg) && tr) ? '✅' : '❌') + ` ② 게이트 안내+추적 dlg="${dlg}" tr="${tr}"`);
  await h.shot('d29b_gate');
  await h.page.evaluate(() => { try { BD_mapTrackClear(); } catch (e) { } });
  for (let i = 0; i < 10; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  // ④ 경계 칩
  await h.page.evaluate(() => { heroX = 0.93; heroY = 0.5; camX = heroX; camY = heroY; });
  await h.wait(1000);
  const c1 = await h.page.evaluate(() => {
    const out = {};
    ['left', 'right', 'top', 'bottom'].forEach(s => { const d = document.getElementById('bd-gate-' + s); out[s] = d && d.style.display !== 'none' ? d.textContent : null; });
    return out;
  });
  say('④ 칩(우측 근접): ' + JSON.stringify(c1));
  await h.shot('d29b_chip');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
