/* 대사창·초상화 내부 치수 — 무엇이 높이를 만드는지 본다. */
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
  await p.waitForTimeout(3500);

  const r = await p.evaluate(() => {
    const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    const one = id => { const e = document.getElementById(id); if (!e) return '없음';
      const s = getComputedStyle(e), q = e.getBoundingClientRect();
      return { 화면px: Math.round(q.width) + 'x' + Math.round(q.height),
        '화면높이%': +(q.height / innerHeight * 100).toFixed(1),
        위치: 'L' + Math.round(q.left) + ' T' + Math.round(q.top),
        padding: s.paddingTop + '/' + s.paddingRight + '/' + s.paddingBottom + '/' + s.paddingLeft,
        font: s.fontSize + ' lh ' + s.lineHeight, position: s.position,
        bottom: s.bottom, left: s.left, height: s.height, minHeight: s.minHeight, maxHeight: s.maxHeight,
        display: s.display, objectFit: s.objectFit, tag: e.tagName };
    };
    return { zoom: z, 뷰포트: innerWidth + 'x' + innerHeight,
      'dialogue-overlay': one('dialogue-overlay'), 'dialogue-box': one('dialogue-box'),
      'dialogue-name': one('dialogue-name'), 'dialogue-text': one('dialogue-text'),
      'dialogue-portrait': one('dialogue-portrait'),
      대사창자식: (() => { const d = document.getElementById('dialogue-box'); if (!d) return [];
        return [...d.children].map(c => { const q = c.getBoundingClientRect();
          return (c.id || c.className || c.tagName) + ' ' + Math.round(q.width) + 'x' + Math.round(q.height); }); })() };
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
