/* 모바일 이식 관점 레이아웃 실측 — «느낌»이 아니라 «화면의 몇 %»로 본다. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await (await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true })).newPage();
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1') && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
    .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(4000);

  const r = await p.evaluate(() => {
    const VW = innerWidth, VH = innerHeight, A = VW * VH;
    const pct = el => { if (!el) return null; const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return '숨김';
      const q = el.getBoundingClientRect();
      if (q.width < 4 || q.height < 4) return '숨김';
      const w = Math.min(q.right, VW) - Math.max(q.left, 0), h = Math.min(q.bottom, VH) - Math.max(q.top, 0);
      return { 크기: Math.round(q.width) + 'x' + Math.round(q.height),
        '화면대비_면적%': +((Math.max(0,w) * Math.max(0,h)) / A * 100).toFixed(1),
        '화면대비_높이%': +(q.height / VH * 100).toFixed(1),
        '화면대비_너비%': +(q.width / VW * 100).toFixed(1) }; };
    const one = sel => pct(document.querySelector(sel));

    /* 카메라 — 논리 해상도 대비 실제로 보이는 월드 영역 */
    const gs = document.getElementById('game-screen');
    const cam = gs ? { 논리: gs.offsetWidth + 'x' + gs.offsetHeight,
      화면: Math.round(gs.getBoundingClientRect().width) + 'x' + Math.round(gs.getBoundingClientRect().height),
      논리비율: +(gs.offsetWidth / gs.offsetHeight).toFixed(2),
      화면비율: +(VW / VH).toFixed(2),
      zoom: +(parseFloat(getComputedStyle(document.body).zoom) || 1).toFixed(3) } : null;

    return {
      뷰포트: VW + 'x' + VH + ' (비율 ' + (VW / VH).toFixed(2) + ')',
      카메라: cam,
      대사창: one('#dialogue-box'),
      대사오버레이: one('#dialogue-overlay'),
      담이말풍선: one('#bd-dami-hud'),
      VN초상화: one('#dialogue-portrait, .vn-portrait, #bd-vn-portrait'),
      HP패널: one('#bd-hp-dom'),
      미니맵: one('#bd-district-minimap'),
      퀘스트HUD: one('#bd-district-hud, #bd-quest-hud'),
      메뉴줄: one('#bd-menu-btns')
    };
  });
  console.log(JSON.stringify(r, null, 1));

  /* 대사창을 실제로 띄운 상태도 재 본다 */
  await p.evaluate(() => { try { if (window.BD_DAMI) BD_DAMI.show('테스트용 긴 대사입니다. 화면을 얼마나 차지하는지 재기 위한 문장이에요. 두 줄 이상 나오게 충분히 길게 씁니다.', { face:'normal', channel:'story' }); } catch(e){} });
  await p.waitForTimeout(2000);
  const r2 = await p.evaluate(() => {
    const VW = innerWidth, VH = innerHeight, A = VW * VH;
    const pct = el => { if (!el) return '없음'; const s = getComputedStyle(el);
      if (s.display === 'none') return '숨김';
      const q = el.getBoundingClientRect();
      if (q.width < 4) return '숨김';
      return { 크기: Math.round(q.width) + 'x' + Math.round(q.height),
        '면적%': +((q.width * q.height) / A * 100).toFixed(1), '높이%': +(q.height / VH * 100).toFixed(1) }; };
    return { 담이말풍선: pct(document.getElementById('bd-dami-hud')),
             대사창: pct(document.getElementById('dialogue-box')) };
  });
  console.log('대사 표시 중: ' + JSON.stringify(r2));
  await p.screenshot({ path: '검수도구/_layout.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
