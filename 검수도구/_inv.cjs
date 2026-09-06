/* 인벤토리 패널 구조 — 세로로 몇 단이 쌓여 있고 얼마나 넘치는가. */
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
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
    .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  await p.waitForTimeout(1800);

  const r = await p.evaluate(() => {
    const pn = document.getElementById('inv-panel');
    if (!pn) return '인벤토리 패널 없음';
    const ov = pn.parentElement;
    const s = getComputedStyle(pn), q = pn.getBoundingClientRect();
    const kids = [...pn.children].map(c => {
      const cs = getComputedStyle(c), cq = c.getBoundingClientRect();
      return { id: c.id || ('.' + String(c.className).split(' ')[0]),
        보임: cs.display !== 'none',
        선언: c.offsetWidth + 'x' + c.offsetHeight,
        화면: Math.round(cq.width) + 'x' + Math.round(cq.height),
        T: Math.round(cq.top), B: Math.round(cq.bottom),
        '화면밖': cq.bottom > innerHeight ? Math.round(cq.bottom - innerHeight) + 'px 아래로' : '-',
        display: cs.display, position: cs.position };
    });
    return {
      뷰포트: innerWidth + 'x' + innerHeight,
      오버레이: ov ? (ov.id || ov.className) + ' ' + Math.round(ov.getBoundingClientRect().height) : '?',
      패널: { 화면: Math.round(q.width) + 'x' + Math.round(q.height),
        선언: pn.offsetWidth + 'x' + pn.offsetHeight,
        스크롤: pn.scrollHeight + '/' + pn.clientHeight,
        넘침: pn.scrollHeight - pn.clientHeight,
        display: s.display, gridTemplate: s.gridTemplateAreas, flexDirection: s.flexDirection,
        overflow: s.overflow + '/' + s.overflowY, maxHeight: s.maxHeight, height: s.height,
        padding: s.padding, gap: s.gap },
      자식: kids
    };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
