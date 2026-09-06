/* 지도판 라벨에 0267 의 인라인 크기가 왜 안 붙는가 — 추측하지 말고 물어본다. */
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
  await p.waitForTimeout(2500);

  const r = await p.evaluate(() => {
    const q = s => document.querySelectorAll(s).length;
    const one = document.querySelector('#bd-map-v342-board .m42-rname');
    return {
      '셀렉터 매칭 수': {
        '#bd-map-v342-board': q('#bd-map-v342-board'),
        '.m42-rname': q('.m42-rname'),
        '#bd-map-v342-board .m42-rname': q('#bd-map-v342-board .m42-rname'),
        '#bd-map-v342-board div': q('#bd-map-v342-board div')
      },
      라벨: one ? { 글: one.textContent.trim(), 인라인: one.getAttribute('style') || '(없음)',
        태그: one.tagName, 부모: one.parentElement ? (one.parentElement.className || one.parentElement.tagName) : '?',
        fontSize: getComputedStyle(one).fontSize } : '못 찾음',
      '0267 살아있나': !!window.BD_UI_SCALE,
      '0267 narrow': window.BD_UI_SCALE ? window.BD_UI_SCALE.narrow() : '?'
    };
  });
  console.log(JSON.stringify(r, null, 1));

  /* 재렌더가 인라인을 지우는지 — 3초간 감시 */
  const watch = await p.evaluate(async () => {
    const board = document.getElementById('bd-map-v342-board');
    let renders = 0;
    const mo = new MutationObserver(ms => ms.forEach(m => { if (m.type === 'childList' && m.addedNodes.length > 3) renders++; }));
    if (board) mo.observe(board, { childList: true });
    const samples = [];
    for (let i = 0; i < 12; i++) {
      const e = document.querySelector('#bd-map-v342-board .m42-rname');
      samples.push(e ? (e.style.fontSize || '없음') : '-');
      await new Promise(r => setTimeout(r, 300));
    }
    mo.disconnect();
    return { 판재렌더횟수: renders, '0.3초마다_인라인fontSize': samples };
  });
  console.log(JSON.stringify(watch));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
