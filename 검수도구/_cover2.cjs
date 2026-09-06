const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true })).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(()=>{
    const out={};
    out.함수있나 = typeof positionTitleButtons;
    try { positionTitleButtons(); out.호출='ok'; } catch(e){ out.호출='ERR '+e.message; }
    const m=document.getElementById('bd-title-screen');
    out.가리개 = !!(m&&m.querySelector('.bd-title-artcover'));
    /* wideShort 조건을 직접 계산 */
    if(m){ const vw=m.clientWidth, vh=m.clientHeight;
      let z=1; const rr=m.getBoundingClientRect();
      if(m.offsetHeight&&rr.height){const s=rr.height/m.offsetHeight; if(s>0.05&&s<20)z=s;}
      out.측정 = {vw,vh,z:+z.toFixed(3),scrW:Math.round(vw*z),scrH:Math.round(vh*z),
        wideShort:(vw*z)/(vh*z)>1.6 && vh*z<520};
    }
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  console.log('에러 '+errs.length+(errs.length?': '+errs[0].slice(0,120):''));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
