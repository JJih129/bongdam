const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const ctx = await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{const x=document.getElementById('bd-title-start'); if(x)x.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(700);
    if(await p.evaluate(()=>!!document.getElementById('char-card-1')&&document.getElementById('char-card-1').getBoundingClientRect().width>2)) break; }
  await p.waitForTimeout(2500);
  const r = await p.evaluate(()=>{
    const sc = el=>{let k=1;for(let a=el;a&&a.nodeType===1;a=a.parentElement){const v=parseFloat(getComputedStyle(a).zoom);if(v>0&&v!==1)k*=v;}return k;};
    const mn = document.getElementById('modal-new');
    const out = { 'modal-new 있나': !!mn,
      'modal-new display': mn?getComputedStyle(mn).display:'-',
      '0267 살아있나': !!window.BD_UI_SCALE, 'tier': window.BD_UI_TIER || '?' };
    /* 9.6px 짜리들이 어디 소속이고 잎 노드인가 */
    const small=[];
    document.querySelectorAll('*').forEach(e=>{
      const t=(e.textContent||'').trim(); if(!t) return;
      const s=getComputedStyle(e); if(s.display==='none'||s.visibility==='hidden')return;
      const q=e.getBoundingClientRect(); if(q.width<3||q.height<3)return;
      const px=parseFloat(s.fontSize)*sc(e);
      if(px>=11) return;
      if(e.children.length) return;
      let owner=''; for(let a=e;a;a=a.parentElement){ if(a.id){owner='#'+a.id;break;} }
      let inModalNew=false; for(let a=e;a;a=a.parentElement){ if(a.id==='modal-new'){inModalNew=true;break;} }
      small.push({글:t.slice(0,12), px:+px.toFixed(1), 소속:owner||'?',
        'modal-new 안': inModalNew, 인라인: e.style.fontSize||'없음'});
    });
    out.작은것 = small.slice(0,10);
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
