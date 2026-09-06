/* 카메라 런타임 실제값 — 유도하지 말고 물어본다. */
const { chromium } = require('playwright');
const CASES = [
  { 이름: 'PC  1440x900', w: 1440, h: 900, dpr: 1, m: false },
  { 이름: '탭  1280x800', w: 1280, h: 800, dpr: 2, m: true },
  { 이름: '폰   874x300', w: 874, h: 300, dpr: 3, m: true }
];
const URL = process.argv[2];
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  for (const c of CASES) {
    const ctx = await b.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: c.dpr, hasTouch: c.m, isMobile: c.m });
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
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
    const r = await p.evaluate(() => {
      const g = n => { try { return eval(n); } catch (e) { return 'n/a'; } };
      const cv = document.getElementById('game-canvas');
      const f = window.BD_screenRectOfWorld;
      let vis = null;
      if (f) { const a = f(0, 0, 1, 1), c2 = f(1, 1, 1, 1);
        if (a && c2) vis = { 가로: +(innerWidth / (c2.left - a.left)).toFixed(3), 세로: +(innerHeight / (c2.top - a.top)).toFixed(3) }; }
      return { stage: g('currentStage'),
        VIEWPORT_W: +Number(g('VIEWPORT_W')).toFixed(4), VIEWPORT_H: +Number(g('VIEWPORT_H')).toFixed(4),
        VIEWPORT_BASE: +Number(g('VIEWPORT_BASE_W')).toFixed(4),
        currentScale: +Number(g('currentScale')).toFixed(4),
        BASE: g('BASE_W') + 'x' + g('BASE_H'),
        캔버스백버퍼: cv ? cv.width + 'x' + cv.height : '?',
        캔버스CSS: cv ? Math.round(cv.getBoundingClientRect().width) + 'x' + Math.round(cv.getBoundingClientRect().height) : '?',
        BD_SPR: +Number(window.BD_SPR).toFixed(4), BD_RES: +Number(window.BD_RES).toFixed(4),
        VIEW_SCALE_현재: (window.BD_VIEW_SCALE || {})[g('currentStage')] || 1,
        보이는월드: vis };
    });
    console.log('── ' + c.이름);
    console.log('   ' + JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
