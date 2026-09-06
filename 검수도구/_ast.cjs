const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:240000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(()=>{
    const A=window.BD_ASSETS;
    const out={타입:typeof A, 배열:Array.isArray(A)};
    if(A && typeof A==='object'){
      const ks=Object.keys(A);
      out.키개수=ks.length;
      out.키샘플=ks.slice(0,8);
      out.hazard키=ks.filter(k=>/hazard/i.test(k)).slice(0,16);
    }
    /* 실제 그리기에서 쓰는 조회 경로 찾기 */
    out.후보전역 = Object.keys(window).filter(k=>/^BD_.*(asset|Asset|ASSET)/.test(k)).slice(0,10);
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
