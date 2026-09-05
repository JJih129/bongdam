// 라이트 스킬 실전 미니게임 — 배지 스킬 패널 버튼 경로
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 30; t++) {
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
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2200);
  for (let t = 0; t < 30; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      const c = !!(window.__bdChoiceState && __bdChoiceState.open);
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c;
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(380);
  }
  await h.page.evaluate(() => {
    BD.unlockedSkills = BD.unlockedSkills || [];
    if (BD.unlockedSkills.indexOf('light') < 0) BD.unlockedSkills.push('light');
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  // 담이 오프닝(≈30초) 종료 대기
  for (let t = 0; t < 40; t++) {
    const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
    if (!busy) break;
    await h.wait(1000);
  }
  say('오프닝 종료 대기 완료');
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
  for (let k = 0; k < 18; k++) {
    const st = await h.page.evaluate(() => ({
      b: !!(window.HSR && HSR.active),
      c: !!(window.__bdChoiceState && __bdChoiceState.open),
      busy: !!window.__bdDamiOpeningBusy,
      dlg: (() => { const d = document.getElementById('dialogue-box'); return (d && d.getBoundingClientRect().height > 0) ? (d.textContent || '').replace(/\s+/g, ' ').slice(0, 30) : null; })(),
      blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
      hero: [+heroX.toFixed(3), +heroY.toFixed(3)],
    }));
    if (k % 3 === 0) say('  k' + k + ': ' + JSON.stringify(st));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(330);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(330); }
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투 진입: ' + inB);
  if (!inB) return;
  for (let i = 0; i < 8; i++) {
    const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
    if (!d) break;
    await h.page.keyboard.press(' '); await h.wait(400);
  }
  // 배지 스킬 패널 버튼 클릭
  const btn = await h.page.evaluate(() => {
    const cands = [...document.querySelectorAll('button,div')]
      .filter(x => /배지 스킬/.test(x.textContent || '') && !/정화 스티커|아이템/.test(x.textContent || ''))
      .filter(x => { const r = x.getBoundingClientRect(); return r.height > 30 && r.height < 220 && r.width < 260; });
    const b = cands.sort((a, b2) => (a.textContent || '').length - (b2.textContent || '').length)[0];
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: (b.textContent || '').slice(0, 20) };
  });
  say('배지 스킬 버튼: ' + JSON.stringify(btn));
  if (btn) { await h.page.mouse.click(btn.x, btn.y); await h.wait(1000); }
  const menu = await h.page.evaluate(() => {
    const cs = [...document.querySelectorAll('div,button')].filter(x => /라이트|안전 점검/.test(x.textContent || ''));
    const vis = cs.filter(x => { const r = x.getBoundingClientRect(); return r.height > 10 && r.height < 300; });
    const c = vis.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
    if (!c) return { found: false, n: cs.length };
    const r = c.getBoundingClientRect();
    return { found: true, x: r.left + r.width / 2, y: r.top + r.height / 2, t: (c.textContent || '').slice(0, 24) };
  });
  say('카드 메뉴: ' + JSON.stringify(menu));
  await h.shot('light_menu');
  if (menu.found) {
    await h.page.mouse.click(menu.x, menu.y);
    await h.wait(1400);
    const mg1 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
    say('미니게임 표시: ' + mg1);
    await h.shot('light_mg');
    if (mg1) {
      await h.wait(6800);
      const mg2 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
      await h.wait(4200);
      const mg3 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
      say(((!mg3) ? '✅' : '❌') + ` 라이트 종료 후 UI 닫힘 (직후잔존=${mg2} 최종=${!mg3 ? '제거' : '잔존'})`);
      await h.shot('light_after');
    } else {
      say('⚠ 미니게임 미표시 — 카드 클릭 경로 확인 필요');
    }
  }
  await h.page.keyboard.press('Escape'); await h.wait(600);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
