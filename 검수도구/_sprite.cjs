/* 선생님 스프라이트가 실제로 로드·렌더되는가 — 지연 로딩(0257 web_lazyimg) 회귀 확인용. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await (await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
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
  await p.waitForTimeout(5000);

  const r = await p.evaluate(() => {
    const out = { stage: (typeof currentStage !== 'undefined') ? currentStage : '?' };
    /* 0017 의 NPC 스프라이트 전역들 */
    for (const n of ['_qnpcSpriteImg', '_npcSpriteImg']) {
      try {
        const im = eval(n);
        out[n] = im ? { complete: im.complete, natural: im.naturalWidth + 'x' + im.naturalHeight,
          보류중: im.__bdPend || null, src: String(im.src || '').slice(-42) } : '없음';
      } catch (e) { out[n] = 'ERR ' + e.message; }
    }
    out.지연로딩 = window.__BD_LAZY ? { ...window.__BD_LAZY.stats, 보류: window.__BD_LAZY.pending() } : '없음';
    /* 화면에 선생님이 그려지는가 — 캔버스 픽셀로는 판정이 어려우니
       drawImage 호출에서 해당 이미지가 쓰이는지 센다 */
    return out;
  });
  console.log(JSON.stringify(r, null, 1));

  /* drawImage 로 실제로 그려지는지 5초 관찰 */
  const drawn = await p.evaluate(async () => {
    const C = CanvasRenderingContext2D.prototype, o = C.drawImage;
    let qn = 0, np = 0, total = 0, pending = 0;
    C.drawImage = function (im) {
      total++;
      if (im && im.__bdPend != null) pending++;
      try { if (im === eval('_qnpcSpriteImg')) qn++; } catch (e) {}
      try { if (im === eval('_npcSpriteImg')) np++; } catch (e) {}
      return o.apply(this, arguments);
    };
    await new Promise(r => setTimeout(r, 5000));
    C.drawImage = o;
    return { 전체drawImage: total, 선생님스프라이트: qn, 허수아비: np, 보류중인채로그리기시도: pending };
  });
  console.log(JSON.stringify(drawn, null, 1));
  console.log('콘솔에러 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  await p.screenshot({ path: '검수도구/_sprite.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
