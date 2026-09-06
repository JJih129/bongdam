/* 마을 스테이지에서 지역 HUD·미니맵이 실제로 뜨는지, 그 안의 글씨가 몇 px 인지. */
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
  await p.evaluate(() => { try { fadeToStage(3, 0.5, 0.5); } catch (e) {} });
  await p.waitForTimeout(4500);

  const r = await p.evaluate(() => {
    const box = e => { const s = getComputedStyle(e), q = e.getBoundingClientRect();
      return (s.display === 'none' ? '[숨김] ' : '') + Math.round(q.width) + 'x' + Math.round(q.height)
        + ' L' + Math.round(q.left) + ' T' + Math.round(q.top); };
    const o = { stage: currentStage };
    ['bd-district-hud', 'bd-district-minimap', 'bd-quest-hud', 'bd-hp-dom', 'bd-keybar'].forEach(i => {
      const e = document.getElementById(i); o[i] = e ? box(e) : '없음'; });
    /* 우상단 큰 패널 후보 */
    o.우상단패널 = [...document.querySelectorAll('div')].filter(e => {
      const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden') return false;
      const q = e.getBoundingClientRect();
      return q.width > 70 && q.height > 40 && q.right > innerWidth * 0.62 && q.top < innerHeight * 0.75;
    }).slice(0, 8).map(e => (e.id || '.' + String(e.className).split(' ')[0]) + ' ' + box(e));
    return o;
  });
  console.log(JSON.stringify(r, null, 1));
  await p.screenshot({ path: '검수도구/_district.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
