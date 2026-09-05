// 배지 스킬 [E] 카드 메뉴 실동작 + 라이트 시전→미니게임 닫힘 실전 검증
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
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2200);
  for (let t = 0; t < 45; t++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || !!(window.__bdChoiceState && __bdChoiceState.open);
    });
    if (!busy && t > 2) break;
    await h.page.keyboard.press(' '); await h.wait(600);
  }
  await h.page.evaluate(() => {
    BD.unlockedSkills = BD.unlockedSkills || [];
    if (BD.unlockedSkills.indexOf('light') < 0) BD.unlockedSkills.push('light');
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
  for (let k = 0; k < 18; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(330);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(330); }
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('전투 진입: ' + inB);
  if (!inB) return;
  for (let i = 0; i < 10; i++) {
    const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
    if (!d) break;
    await h.page.keyboard.press(' '); await h.wait(400);
  }
  // 플레이어 턴 대기
  for (let i = 0; i < 15; i++) {
    const st = await h.page.evaluate(() => HSR.state);
    if (st === 'player') break;
    await h.wait(500);
  }
  const stNow = await h.page.evaluate(() => HSR.state);
  say('턴 상태: ' + stNow);
  // 배지 스킬 버튼 클릭
  const btn = await h.page.evaluate(() => {
    const cands = [...document.querySelectorAll('button,div')]
      .filter(x => /배지 스킬/.test(x.textContent || '') && !/정화 스티커|아이템/.test(x.textContent || ''))
      .filter(x => { const r = x.getBoundingClientRect(); return r.height > 30 && r.height < 220 && r.width < 260; });
    const b = cands.sort((a, b2) => (a.textContent || '').length - (b2.textContent || '').length)[0];
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  say('버튼: ' + JSON.stringify(btn));
  if (!btn) return;
  await h.page.mouse.click(btn.x, btn.y);
  await h.wait(900);
  const menu = await h.page.evaluate(() => {
    const m = document.getElementById('hsr-skill-menu');
    if (!m) return { exists: false };
    const r = m.getBoundingClientRect();
    return { exists: true, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], txt: (m.innerText || '').replace(/\s+/g, ' ').slice(0, 80) };
  });
  say('메뉴: ' + JSON.stringify(menu));
  await h.shot('skill_menu');
  if (menu.exists && /라이트/.test(menu.txt)) {
    // 라이트 카드 클릭
    const card = await h.page.evaluate(() => {
      const m = document.getElementById('hsr-skill-menu');
      const c = [...m.querySelectorAll('button,div')].find(x => /라이트/.test(x.textContent || '') && x.getBoundingClientRect().height > 20 && (x.onclick || x.getAttribute('onclick')));
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    say('카드: ' + JSON.stringify(card));
    if (card) {
      await h.page.mouse.click(card.x, card.y);
      await h.wait(1500);
      const mg1 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
      say('미니게임 표시: ' + mg1);
      await h.shot('skill_light_mg');
      if (mg1) {
        await h.wait(6800);
        const mg2 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
        await h.wait(4200);
        const mg3 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
        say(((!mg3) ? '✅' : '❌') + ` 라이트 종료 후 UI 닫힘 (직후=${mg2 ? '잔존' : '제거'} 최종=${mg3 ? '잔존' : '제거'})`);
        await h.shot('skill_light_after');
      }
    }
  } else if (menu.exists) {
    say('⚠ 메뉴는 열렸으나 라이트 카드 없음 — 보유 스킬 확인 필요');
  } else {
    say('❌ 배지 스킬 카드 메뉴 미오픈 — 실버그 가능성');
  }
  await h.page.keyboard.press('Escape'); await h.wait(500);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
