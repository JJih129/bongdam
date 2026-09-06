/* 중급 폰 흉내 — CPU 4배 감속 + 느린 네트워크에서 어디에 시간이 가는가. */
const { chromium } = require('playwright');
(async () => {
  const rate = Number(process.env.BD_CPU || 4);
  const net = process.env.BD_NET === '1';
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const ctx = await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  if (net) { await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline:false, latency:150,
      downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8 }); }
  const t0 = Date.now();
  await p.goto(process.argv[2], { waitUntil:'domcontentloaded', timeout:300000 });
  const tDCL = Date.now()-t0;
  await p.waitForLoadState('load', { timeout:300000 });
  const tLoad = Date.now()-t0;
  /* 타이틀이 실제로 눌릴 수 있게 되는 시점 */
  let tReady = null;
  for (let i=0;i<200;i++){
    const ok = await p.evaluate(()=>{ const e=document.getElementById('bd-title-start');
      return !!e && e.getBoundingClientRect().width>2; });
    if (ok) { tReady = Date.now()-t0; break; }
    await p.waitForTimeout(100);
  }
  const m = await p.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]||{};
    const paint={}; performance.getEntriesByType('paint').forEach(e=>paint[e.name]=Math.round(e.startTime));
    return { 응답시작:Math.round(n.responseStart||0), 응답끝:Math.round(n.responseEnd||0),
      DOM중단:Math.round(n.domInteractive||0), DCL:Math.round(n.domContentLoadedEventEnd||0),
      load:Math.round(n.loadEventEnd||0), FCP:paint['first-contentful-paint']||null };
  });
  console.log('■ CPU ' + rate + 'x 감속' + (net?' + 1.6Mbps/150ms':''));
  console.log('  HTML 도착      ' + m.응답시작 + ' → ' + m.응답끝 + 'ms');
  console.log('  파싱·실행 끝    ' + m.DOM중단 + 'ms   (HTML 받은 뒤 ' + (m.DOM중단-m.응답끝) + 'ms)');
  console.log('  첫 그림(FCP)   ' + m.FCP + 'ms');
  console.log('  DCL            ' + m.DCL + 'ms');
  console.log('  load           ' + m.load + 'ms');
  console.log('  타이틀 누를 수 있음 ' + tReady + 'ms   ← 체감 로딩');
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
