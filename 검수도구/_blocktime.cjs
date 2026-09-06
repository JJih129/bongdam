const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const ctx = await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.BD_CPU||4) });
  await p.goto(process.argv[2], { waitUntil:'load', timeout:300000 });
  await p.waitForTimeout(1000);
  const r = await p.evaluate(() => {
    const bt = window.__BT || [];
    const start = {}, out = [];
    for (const [id,t] of bt) {
      if (id.endsWith('/')) { const k=id.slice(0,-1); if(start[k]!=null) out.push({id:k, ms:+(t-start[k]).toFixed(1), at:Math.round(start[k])}); }
      else start[id]=t;
    }
    const total = out.reduce((s,x)=>s+x.ms,0);
    out.sort((a,b)=>b.ms-a.ms);
    return { 블록수: out.length, 합계ms: Math.round(total), 상위: out.slice(0,15),
      마지막끝: Math.round(Math.max(...bt.map(x=>x[1]))) };
  });
  console.log('블록 ' + r.블록수 + '개 · 실행 합계 ' + r.합계ms + 'ms · 마지막 블록 끝 ' + r.마지막끝 + 'ms');
  console.log('■ 오래 걸린 블록');
  r.상위.forEach(x=>console.log('   '+x.id+'  '+String(x.ms+'ms').padStart(9)+'   (시작 '+x.at+'ms)'));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
