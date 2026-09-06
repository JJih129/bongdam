const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1') && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.evaluate(() => { const q = document.getElementById('char-card-1'); if (q) q.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2).find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900); const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const ids = ['inv-overlay','inv-panel','bd-toast','bd-fullscreen-return','dialogue-overlay','dialogue-box','bd-quest-hud','bd-district-hud','bd-hp-dom','bd-menu-btns','bd-settings-btn','bd-map-v342'];
    const o = {};
    ids.forEach(i => { const e = document.getElementById(i); if (!e) { o[i] = '없음'; return; }
      const s = getComputedStyle(e);
      o[i] = { z: s.zIndex, pos: s.position, disp: s.display,
        클래스: String(e.className).slice(0, 30) }; });
    /* 화면 정중앙 위쪽(모달 제목 자리)에서 실제로 무엇이 잡히나 */
    o['제목자리에서_잡히는것'] = (() => { const el = document.elementFromPoint(innerWidth*0.5, 50);
      return el ? (el.id || el.className || el.tagName) : '?'; })();
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
