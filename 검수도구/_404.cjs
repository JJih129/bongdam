const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true })).newPage();
  const bad = [];
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('/').slice(-2).join('/')); });
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(4000);
  console.log('실패 응답 ' + bad.length + '건');
  [...new Set(bad)].slice(0,10).forEach(x=>console.log('   '+x));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
