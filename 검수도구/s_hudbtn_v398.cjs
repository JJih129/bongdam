/* 우상단 버튼 통합 검증 — 겹침이 사라졌는가 / 강조가 동작하는가. */
const { chromium } = require('playwright');

function overlap(a, b) {
  if (!a || !b || a === '없음' || b === '없음') return null;
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await (await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) {
    await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break;
  }
  await p.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
      .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click();
  });
  for (let i = 0; i < 25; i++) {
    await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } });
    if (s && s !== 1) break;
  }
  await p.waitForTimeout(3500);

  /* 프롤로그에서는 가방·지도가 아직 안 열려 display:none 이다.
     배치(겹침)만 보려면 강제로 보이게 해야 판정이 의미 있다. */
  await p.evaluate(() => {
    ['bd-bag-top','bd-mb-map'].forEach(id => {
      const e = document.getElementById(id);
      if (e) { e.style.display = 'block'; e.__bdForce = 1; }
    });
    if (window.BD_HUD) window.BD_HUD.consolidate();
  });
  await p.waitForTimeout(900);

  const r = await p.evaluate(() => window.BD_HUD ? window.BD_HUD.rects() : '없음');
  console.log('▶ 버튼 배치');
  Object.keys(r).forEach(k => console.log('   ' + k.padEnd(18) + JSON.stringify(r[k])));

  const pairs = [['bd-mb-map', 'bd-bag-top'], ['bd-mb-map', 'bd-mb-toggle'],
                 ['bd-bag-top', 'bd-mb-toggle'], ['bd-mb-toggle', 'bd-settings-btn']];
  console.log('▶ 겹침 면적(px²) — 0 이어야 정상');
  let bad = 0;
  pairs.forEach(([a, c]) => {
    const o = overlap(r[a], r[c]);
    if (o === null) { console.log('   ' + a + ' ↔ ' + c + ' : 판정불가'); return; }
    if (o > 0) bad++;
    console.log('   ' + (a + ' ↔ ' + c).padEnd(42) + o + (o > 0 ? '  ❌' : '  ✅'));
  });

  /* 강조 확인 */
  const hi = await p.evaluate(() => {
    window.BD_HUD.hilite('bag', 3000);
    window.BD_HUD.hilite('map', 3000);
    const bag = document.getElementById('bd-bag-top');
    const map = document.getElementById('bd-mb-map');        /* 레거시가 아니라 메뉴줄 항목 */
    const vis = e => { if (!e) return false; const s = getComputedStyle(e);
      const r = e.getBoundingClientRect(); return s.display !== 'none' && r.width > 2; };
    return {
      지도_보임: vis(map),
      지도강조: map ? map.classList.contains('bd-hud-hilite') : null,
      지도_애니메이션: map ? getComputedStyle(map).animationName : '-',
      가방_보임: vis(bag),
      '가방강조(숨김이면 false 가 정상)': bag ? bag.classList.contains('bd-hud-hilite') : null
    };
  });
  console.log('▶ 강조 ' + JSON.stringify(hi));

  console.log('▶ 겹침 ' + bad + '건 · 콘솔에러 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  await p.screenshot({ path: '검수도구/_hudbtn.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
