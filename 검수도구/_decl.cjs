/* 통일 기준을 만들기 전에 «지금 뭐라고 선언돼 있는지» 본다. */
const { chromium } = require('playwright');
const SEL = ['#bd-hp-dom', '#bd-hp-dom *', '#inv-panel', '#inv-tabs', '.inv-tab',
  '#inv-detail', '#inv-detail-name', '#inv-detail-desc', '#inv-footer', '#inv-title',
  '#bd-toast', '#bd-quest-hud', '#bd-mb-map', '#bd-bag-top', '#bd-menu-btns'];
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
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
    .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  await p.waitForTimeout(1500);

  const r = await p.evaluate(sels => {
    const scaleOf = el => { let k = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const v = parseFloat(getComputedStyle(a).zoom); if (v > 0 && v !== 1) k *= v; } return k; };
    const out = [];
    sels.forEach(sel => {
      let list; try { list = document.querySelectorAll(sel); } catch (e) { return; }
      for (let i = 0; i < Math.min(list.length, 3); i++) {
        const e = list[i], s = getComputedStyle(e), q = e.getBoundingClientRect();
        if (s.display === 'none') { out.push({ sel, i, 상태: '숨김' }); continue; }
        out.push({ sel: sel + (list.length > 1 ? '[' + i + ']' : ''),
          글: (e.textContent || '').trim().slice(0, 10),
          화면: Math.round(q.width) + 'x' + Math.round(q.height),
          선언font: s.fontSize, 화면font: +(parseFloat(s.fontSize) * scaleOf(e)).toFixed(1),
          padding: s.padding, gap: s.gap, flex: s.flex, whiteSpace: s.whiteSpace,
          width: s.width, minWidth: s.minWidth, zoom: +scaleOf(e).toFixed(3) });
      }
    });
    return out;
  }, SEL);
  r.forEach(x => console.log(JSON.stringify(x)));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
