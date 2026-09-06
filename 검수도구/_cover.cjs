const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(()=>{
    const m=document.getElementById('bd-title-screen');
    const c=m?m.querySelector('.bd-title-artcover'):null;
    const fr=m?m.querySelector('.bd-title-frame'):null;
    const img=m?m.querySelector('.bd-title-bg'):null;
    const box=e=>{if(!e)return '없음';const s=getComputedStyle(e),q=e.getBoundingClientRect();
      return {크기:Math.round(q.width)+'x'+Math.round(q.height),위치:'L'+Math.round(q.left)+' T'+Math.round(q.top),
        z:s.zIndex,pos:s.position,disp:s.display,over:s.overflow,bg:(s.background||'').slice(0,40)};};
    return { 타이틀화면: box(m), 프레임: box(fr), 아트: box(img), 가리개: box(c),
      폴백버튼수: m?m.querySelectorAll('.bd-title-hit-fallback').length:0 };
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
