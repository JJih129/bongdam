const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{const x=document.getElementById('bd-title-start'); if(x)x.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(700);
    if(await p.evaluate(()=>!!document.getElementById('char-card-1')&&document.getElementById('char-card-1').getBoundingClientRect().width>2)) break; }
  await p.evaluate(()=>{const q=document.getElementById('char-card-1'); if(q)q.click();});
  await p.waitForTimeout(900);
  await p.evaluate(()=>{const g=[...document.querySelectorAll('button,.modal-btn')].filter(x=>x.getBoundingClientRect().width>2).find(x=>/모험\s*시작/.test(x.textContent||'')); if(g)g.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(900);
    const s=await p.evaluate(()=>{try{return currentStage}catch(e){return null}}); if(s&&s!==1)break; }
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{ try{ HSR.start(); }catch(e){} });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(()=>{
    const out={};
    const acts=document.getElementById('hsr-actions');
    out.액션존재=!!acts;
    if(acts){
      /* [Q] 를 담은 텍스트 노드를 찾는다 */
      const w=document.createTreeWalker(acts, NodeFilter.SHOW_TEXT, null);
      const nodes=[]; let n;
      while((n=w.nextNode())){ const v=n.nodeValue; if(v&&/\[/.test(v)) nodes.push({값:v, 길이:v.length, 부모:n.parentElement.tagName+'.'+String(n.parentElement.className).split(' ')[0]}); }
      out.대괄호노드=nodes.slice(0,4);
    }
    /* 0259 의 convert 를 직접 흉내 낼 수 없으니, 강제 run 후 변화를 본다 */
    out.run전 = acts ? acts.textContent.replace(/\s+/g,' ').slice(0,60) : '';
    try{ BD_GUIDE.run(); }catch(e){ out.run오류=e.message; }
    out.run후 = acts ? acts.textContent.replace(/\s+/g,' ').slice(0,60) : '';
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
