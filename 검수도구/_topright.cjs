const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const ctx = await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{const x=document.getElementById('bd-title-start'); if(x)x.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(700);
    if(await p.evaluate(()=>!!document.getElementById('char-card-1')&&document.getElementById('char-card-1').getBoundingClientRect().width>2)) break; }
  await p.evaluate(()=>{const q=document.getElementById('char-card-1'); if(q)q.click();});
  await p.waitForTimeout(900);
  await p.evaluate(()=>{const g=[...document.querySelectorAll('button,.modal-btn')].filter(x=>x.getBoundingClientRect().width>2).find(x=>/모험\s*시작/.test(x.textContent||'')); if(g)g.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(900);
    const s=await p.evaluate(()=>{try{return currentStage}catch(e){return null}}); if(s&&s!==1)break; }
  await p.waitForTimeout(3500);
  const r = await p.evaluate(()=>{
    const sc = el=>{let k=1;for(let a=el;a&&a.nodeType===1;a=a.parentElement){const v=parseFloat(getComputedStyle(a).zoom);if(v>0&&v!==1)k*=v;}return k;};
    const o={};
    ['bd-menu-btns','bd-settings-btn','bd-mb-toggle','bd-mb-map','bd-bag-top'].forEach(id=>{
      const e=document.getElementById(id); if(!e){o[id]='없음';return;}
      const s=getComputedStyle(e), q=e.getBoundingClientRect();
      o[id]={화면:'L'+Math.round(q.left)+' R'+Math.round(q.right)+' '+Math.round(q.width)+'x'+Math.round(q.height),
        선언right:s.right, 선언top:s.top, position:s.position, zoom:+sc(e).toFixed(3),
        선언크기:e.offsetWidth+'x'+e.offsetHeight};
    });
    o.뷰포트=innerWidth+'x'+innerHeight;
    return o;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
