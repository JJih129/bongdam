// 밴드부 4명에게 실제로 말을 걸 수 있는가 (PC존 책상이 F를 가로채는지)
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); });
  await h.wait(500);

  const band = await h.page.evaluate(() => (STAGES[101].objects || [])
    .filter(o => o && o.resident && /밴드부/.test(o.label || ''))
    .map(o => ({ n: o.npcName || o.label, rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh, lines: (o.npcLines || []).length })));
  say('밴드부: ' + JSON.stringify(band));

  for (const b of band) {
    const spots = [
      ['아래', b.rx + b.rw / 2, b.ry + b.rh + 0.015],
      ['왼쪽', b.rx - 0.015, b.ry + b.rh / 2],
      ['오른쪽', b.rx + b.rw + 0.015, b.ry + b.rh / 2],
    ];
    let ok = false, detail = [];
    for (const [nm, x, y] of spots) {
      await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [x, y]);
      await h.wait(700);
      await h.page.keyboard.press('f');
      await h.wait(1200);
      const st = await h.page.evaluate(() => ({
        dlg: (() => { const e = document.getElementById('dialogue-box'); return e && e.getBoundingClientRect().height > 2 ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 45) : null; })(),
        name: (() => { const e = document.getElementById('dialogue-name'); return e && e.getBoundingClientRect().height > 2 ? e.textContent.trim() : null; })(),
        sel: !!window.__bdSelectOpen,
        blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()),
      }));
      detail.push(`${nm}:${st.name || (st.sel ? '아케이드선택창' : '무반응')}`);
      if (st.name && st.name.indexOf(b.n.replace('밴드부 ', '').split(' ')[1] || b.n) >= 0) ok = true;
      if (st.name) ok = true;
      // 정리
      if (st.sel) { await h.page.keyboard.press('Escape'); await h.wait(600); }
      for (let k = 0; k < 15; k++) { const bl = await L.blocked(); if (!bl.b) break; await h.page.keyboard.press('Space'); await h.wait(250); }
    }
    say(`${ok ? '✅' : '❌'} ${b.n} — ${detail.join(' / ')}`);
  }
};
