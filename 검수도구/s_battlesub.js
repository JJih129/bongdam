// 전투 서브시스템: 배지 스킬(E) / 아이템(I) / 물러나기(ESC)
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1'); localStorage.setItem('bd_battle_tutorial_seen', '1');
    try { BD.items = BD.items || {}; BD.items.snack = 3; BD.items.drink = 2; BD.items.potion = 1; } catch (e) { }
    if (typeof fadeToStage === 'function') fadeToStage(212);
  });
  await h.wait(5000); await A.advance(); await A.P.install();

  const startBattle = async () => {
    for (let i = 0; i < 14; i++) {
      const p = await A.probe();
      if (p.hsr) return true;
      if (p.tgt) { await A.P.walk(p.tgt.rx + p.tgt.rw / 2, p.tgt.ry + p.tgt.rh + 0.015, L); await L.press('f', 2, 450); }
      await A.advance(); await h.wait(350);
    }
    return await h.page.evaluate(() => !!(window.HSR && HSR.active));
  };
  const bi = async () => await h.page.evaluate(() => {
    if (!(window.HSR && HSR.active)) return null;
    const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none') return false; const r = e.getBoundingClientRect(); return r.height > 2; };
    return {
      state: HSR.state, ehp: HSR.enemy && HSR.enemy.hp, hhp: HSR.hero && HSR.hero.hp,
      acts: [...document.querySelectorAll('.hsr-act')].filter(on).map(b => (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 14)),
      panel: ['hsr-skill-panel', 'hsr-item-panel', 'bd-aug-overlay'].filter(id => on(document.getElementById(id))),
      anyPanel: [...document.querySelectorAll('[id^="hsr-"]')].filter(on).map(e => e.id).slice(0, 8),
    };
  });

  say('▶ 전투 진입');
  if (!await startBattle()) { say('❌ 전투 진입 실패'); return; }
  say('  진입: ' + JSON.stringify(await bi()));

  // ① 배지 스킬 (E)
  await h.page.keyboard.press('e'); await h.wait(1200);
  const s1 = await bi();
  say('① 배지 스킬 [E] → ' + JSON.stringify(s1 && s1.anyPanel));
  await h.shot('bs_01_skill');
  // 카드 클릭
  const cardClicked = await h.page.evaluate(() => {
    const on = e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && r.height > 20; };
    const c = [...document.querySelectorAll('.hsr-card, .hsr-skill-card, [class*="skill"][class*="card"]')].filter(on)[0];
    if (c) { c.click(); return (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); } return null;
  });
  say('   카드 선택: ' + cardClicked);
  await h.wait(1500);
  const s1b = await bi();
  say('   후: ehp=' + (s1b && s1b.ehp) + ' state=' + (s1b && s1b.state));

  // ② 아이템 (I)
  for (let i = 0; i < 12; i++) { const b = await bi(); if (b && b.state === 'player') break; if (b && b.acts.length) { } await h.page.keyboard.press('Space'); await h.wait(500); }
  const hp0 = (await bi() || {}).hhp;
  await h.page.keyboard.press('i'); await h.wait(1200);
  await h.shot('bs_02_item');
  const itemClicked = await h.page.evaluate(() => {
    const on = e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && r.height > 20; };
    const c = [...document.querySelectorAll('[data-bd-item], .hsr-item, [class*="item"][class*="btn"], .hsr-card')].filter(on)[0];
    if (c) { c.click(); return (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24); } return null;
  });
  await h.wait(1500);
  const hp1 = (await bi() || {}).hhp;
  say('② 아이템 [I] → 선택=' + itemClicked + ' HP ' + hp0 + '→' + hp1);

  // ③ 물러나기 (ESC)
  for (let i = 0; i < 12; i++) { const b = await bi(); if (!b || b.state === 'player') break; await h.page.keyboard.press('Space'); await h.wait(450); }
  await h.page.keyboard.press('Escape'); await h.wait(2500);
  const after = await h.page.evaluate(() => ({ hsr: !!(window.HSR && HSR.active), blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()) }));
  say('③ 물러나기 [ESC] → 전투종료=' + !after.hsr + ' blocked=' + after.blocked);
  for (let k = 0; k < 20; k++) { const b = await L.blocked(); if (!b.b) break; await h.page.keyboard.press('Space'); await h.wait(250); }
  const p0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.hold('s', 400); await h.hold('d', 400); await h.hold('w', 400);
  const p1 = await h.page.evaluate(() => [heroX, heroY]);
  say('   도망 후 이동 복구=' + (Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.002));
  await h.shot('bs_03_after_flee');
};
