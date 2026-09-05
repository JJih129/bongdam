// 상점 구매 → 가방에서 실제 사용까지
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1');
    try { BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; playerGold = 900; BD.items = {}; } catch (e) { }
    if (typeof fadeToStage === 'function') fadeToStage(212);
  });
  await h.wait(5000); await A.advance(); await A.P.install();

  const shop = await h.page.evaluate(() => { const o = (STAGES[212].objects || []).find(x => x && /와우약국/.test(x.label || '')); return { rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh }; });
  await A.P.walk(shop.rx + shop.rw / 2, shop.ry + shop.rh + 0.02, L);
  await h.page.keyboard.press('f'); await h.wait(1600);
  await h.shot('sh_01_shop');
  // 「가게 이용법」 안내 카드부터 닫는다
  for (let i = 0; i < 6; i++) {
    const up = await h.page.evaluate(() => {
      const c = [...document.querySelectorAll('div')].find(d => /가게 이용법|화면을 클릭하면 계속/.test(d.textContent || '') && d.getBoundingClientRect().height > 80 && d.getBoundingClientRect().height < 500);
      if (!c) return false;
      (c.closest('[style*="position: fixed"]') || c).click();
      document.body.click();
      return true;
    });
    if (!up) break;
    await h.wait(700);
  }
  await h.wait(600);
  await h.shot('sh_01b_shop_ready');
  const before = await h.page.evaluate(() => ({ gold: playerGold, items: JSON.parse(JSON.stringify((window.BD && BD.items) || {})) }));
  say('구매 전: ' + JSON.stringify(before));
  const buy = await h.page.evaluate(() => {
    const on = e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && r.height > 10; };
    // 회복 아이템 행을 찾아 그 행의 구매 버튼을 누른다
    const rows = [...document.querySelectorAll('.shop-item')].filter(on);
    const row = rows.find(r => /삼각김밥|샌드위치|간식|초코/.test(r.textContent || '')) || rows[0];
    if (!row) return 'no-row';
    const b = [...row.querySelectorAll('button')].filter(on)[0];
    if (!b) return 'no-btn';
    b.click();
    return (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  });
  await h.wait(1600);
  const after = await h.page.evaluate(() => ({ gold: playerGold, items: JSON.parse(JSON.stringify((window.BD && BD.items) || {})), inv: Object.keys((window.playerInventory) || {}) }));
  say('구매(' + buy + ') 후: ' + JSON.stringify(after));
  await h.shot('sh_02_bought');
  await h.page.keyboard.press('Escape'); await h.wait(1200);

  // 가방(E)에서 사용
  await h.page.keyboard.press('e'); await h.wait(1400);
  await h.shot('sh_03_bag');
  const bagList = await h.page.evaluate(() => {
    const box = document.getElementById('bd-bag-use');
    return box ? (box.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : 'no-box';
  });
  say('가방 «바로 사용하기»: ' + bagList);
  const hp0 = await h.page.evaluate(() => { heroHP = 40; if (window.BD_syncHP) BD_syncHP(40, false); return heroHP; });
  const used = await h.page.evaluate(() => {
    const b = document.querySelector('[data-bd-use]');
    if (!b) return 'no-use-btn'; b.click(); return b.getAttribute('data-bd-use');
  });
  await h.wait(1400);
  const hp1 = await h.page.evaluate(() => heroHP);
  say('가방에서 사용(' + used + '): HP ' + hp0 + ' → ' + hp1 + (hp1 > hp0 ? ' ✅' : ' ❌'));
  await h.page.keyboard.press('Escape'); await h.wait(900);
  const mv0 = await h.page.evaluate(() => [heroX, heroY]);
  await h.hold('s', 400); await h.hold('a', 400); await h.hold('w', 400);
  const mv1 = await h.page.evaluate(() => [heroX, heroY]);
  say('상점·가방 닫은 뒤 이동 복구=' + (Math.abs(mv1[0] - mv0[0]) + Math.abs(mv1[1] - mv0[1]) > 0.002));
};
