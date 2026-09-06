/* 캐릭터가 «화면에서 실제로 몇 px 로» 그려지는가.
   앞선 검증에서 스프라이트는 complete:true / 보류 0 으로 «정상»이었다.
   그런데 사용자는 «안 보인다»고 했다. 로딩이 아니라 크기가 원인인지 확인한다.
   drawImage 의 목적지 크기(dw,dh)를 캔버스 백버퍼 기준으로 받아 CSS px 로 환산한다. */
const { chromium } = require('playwright');
const CASES = [
  { 이름: 'PC  1440x900', w: 1440, h: 900, dpr: 1, m: false },
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
    await p.waitForTimeout(3500);

    const r = await p.evaluate(async () => {
      const C = CanvasRenderingContext2D.prototype, orig = C.drawImage;
      const hits = new Map();
      C.drawImage = function (im) {
        try {
          const a = arguments;
          let dw, dh;
          if (a.length === 9) { dw = a[7]; dh = a[8]; }
          else if (a.length === 5) { dw = a[3]; dh = a[4]; }
          else { dw = im.naturalWidth || im.width; dh = im.naturalHeight || im.height; }
          const cv = this.canvas;
          if (cv && cv.id === 'game-canvas' && dw > 0 && dh > 0) {
            /* 백버퍼 px → CSS px */
            const k = cv.getBoundingClientRect().width / cv.width;
            const key = String(im.src || im.id || 'canvas').split('/').pop().slice(-30);
            const w = dw * k, h = dh * k;
            const prev = hits.get(key);
            if (!prev || h > prev.h) hits.set(key, { w: w, h: h, n: (prev ? prev.n : 0) + 1 });
            else prev.n++;
          }
        } catch (e) {}
        return orig.apply(this, arguments);
      };
      await new Promise(r => setTimeout(r, 3000));
      C.drawImage = orig;
      const VH = innerHeight;
      const out = [];
      hits.forEach((v, k) => out.push({ 그림: k, 화면px: Math.round(v.w) + 'x' + Math.round(v.h),
        '화면높이대비%': +(v.h / VH * 100).toFixed(1), 횟수: v.n }));
      out.sort((a, b) => b['화면높이대비%'] - a['화면높이대비%']);
      return { 뷰포트높이: VH, 목록: out.filter(x => /npc|char|hero|teacher|sprite|\.png/i.test(x.그림)).slice(0, 12) };
    });
    console.log('── ' + c.이름 + '  (뷰포트 높이 ' + r.뷰포트높이 + 'px)');
    r.목록.forEach(x => console.log('   ' + x.그림.padEnd(32) + ' ' + x.화면px.padEnd(10) + ' 화면높이의 ' + x['화면높이대비%'] + '%  (' + x.횟수 + '회)'));
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
