/* 로딩 실측 — 무엇이 얼마나 걸리는지 «항목별»로. 느린 3G 흉내까지. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const ctx = await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  const reqs = [];
  p.on('response', async r => {
    try { const h = r.headers();
      reqs.push({ url: r.url().split('/').pop().slice(0,42), status: r.status(),
        type: (h['content-type']||'').split(';')[0],
        size: Number(h['content-length']||0), enc: h['content-encoding']||'-' });
    } catch(e){}
  });
  const t0 = Date.now();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:300000 });
  const tLoad = Date.now()-t0;
  await p.waitForTimeout(1500);
  const nav = await p.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] || {};
    const paint = {}; performance.getEntriesByType('paint').forEach(e => paint[e.name] = Math.round(e.startTime));
    const res = performance.getEntriesByType('resource').map(r => ({
      n: r.name.split('/').pop().slice(0,42), t: r.initiatorType,
      dur: Math.round(r.duration), size: r.transferSize||0, dec: r.decodedBodySize||0,
      stalled: Math.round((r.requestStart||0) - (r.startTime||0)),
      wait: Math.round((r.responseStart||0) - (r.requestStart||0)),
      dl: Math.round((r.responseEnd||0) - (r.responseStart||0))
    }));
    return { DOM중단: Math.round(n.domInteractive||0), DOM완료: Math.round(n.domContentLoadedEventEnd||0),
      load: Math.round(n.loadEventEnd||0), 전송: Math.round((n.transferSize||0)/1024),
      paint, 자원수: res.length,
      총전송KB: Math.round(res.reduce((s,r)=>s+r.size,0)/1024),
      총해제KB: Math.round(res.reduce((s,r)=>s+r.dec,0)/1024),
      느린것: res.sort((a,b)=>b.dur-a.dur).slice(0,10),
      큰것: res.sort((a,b)=>b.size-a.size).slice(0,10) };
  });
  console.log('■ 벽시계 load ' + tLoad + 'ms');
  console.log('■ ' + JSON.stringify({DOM중단:nav.DOM중단, DOM완료:nav.DOM완료, load:nav.load,
    FCP:nav.paint['first-contentful-paint'], 자원수:nav.자원수, 총전송KB:nav.총전송KB, 총해제KB:nav.총해제KB}));
  console.log('■ 오래 걸린 자원');
  nav.느린것.forEach(r=>console.log('   '+String(r.n).padEnd(44)+String(r.dur+'ms').padStart(7)
    +'  대기'+r.stalled+'/응답'+r.wait+'/받기'+r.dl+'  '+Math.round(r.size/1024)+'KB'));
  console.log('■ 큰 자원');
  nav.큰것.forEach(r=>console.log('   '+String(r.n).padEnd(44)+String(Math.round(r.size/1024)+'KB').padStart(8)
    +' (해제 '+Math.round(r.dec/1024)+'KB) '+r.t));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
