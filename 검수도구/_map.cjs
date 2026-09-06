/* 안전지도 패널 구조 실측 — 무엇이 크기를 정하는지 런타임에서 직접 묻는다. */
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
  await p.evaluate(() => { try { BD_openSafetyMap(); } catch (e) {} });
  await p.waitForTimeout(1600);

  const r = await p.evaluate(() => {
    const info = sel => { const e = document.querySelector(sel); if (!e) return '없음';
      const s = getComputedStyle(e), q = e.getBoundingClientRect();
      return { 화면px: Math.round(q.width) + 'x' + Math.round(q.height),
        선언px: e.offsetWidth + 'x' + e.offsetHeight,
        위치: 'L' + Math.round(q.left) + ' T' + Math.round(q.top),
        '화면대비': (q.width / innerWidth * 100).toFixed(0) + '% x ' + (q.height / innerHeight * 100).toFixed(0) + '%',
        width: s.width, height: s.height, maxWidth: s.maxWidth, maxHeight: s.maxHeight,
        aspectRatio: s.aspectRatio, padding: s.padding, margin: s.margin,
        display: s.display, flexDirection: s.flexDirection, overflow: s.overflowY,
        스크롤: e.scrollHeight + '/' + e.clientHeight,
        background: (s.backgroundImage || '').slice(0, 26) };
    };
    const board = document.querySelector('.m42-board');
    return { 뷰포트: innerWidth + 'x' + innerHeight,
      모달: info('#bd-map-v342'), 패널: info('.m42-panel'),
      머리: info('.m42-head'), 보드: info('.m42-board'), 발: info('.m42-foot'),
      보드부모: board && board.parentElement ? board.parentElement.className : '?',
      지역라벨: [...document.querySelectorAll('.m42-board [class*=name],.m42-board b,.m42-rname')]
        .slice(0, 8).map(e => { const q = e.getBoundingClientRect();
          return (e.textContent || '').trim().slice(0, 6) + ' ' + Math.round(q.width) + 'x' + Math.round(q.height)
            + ' ' + getComputedStyle(e).fontSize; }) };
  });
  console.log(JSON.stringify(r, null, 1));
  await p.screenshot({ path: '검수도구/_map.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
