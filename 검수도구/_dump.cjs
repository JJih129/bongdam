const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(()=>{
    const m=document.getElementById('bd-title-screen');
    if(!m) return '타이틀 없음';
    const h=m.innerHTML;
    return { 길이:h.length, artcover포함: h.indexOf('bd-title-artcover')>=0,
      앞부분: h.slice(0,300).replace(/base64,[^)"']{40,}/,'base64,…'),
      자식들: [...m.children].map(c=>c.tagName+'.'+String(c.className).split(' ')[0]) };
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
