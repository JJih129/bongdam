const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })).newPage();
  const bad=[]; p.on('response',r=>{ if(r.status()>=400) bad.push(r.url().split('/').pop()); });
  await p.goto(process.argv[2], { waitUntil:'load', timeout:240000 });
  await p.waitForTimeout(3000);
  await p.evaluate(()=>{const x=document.getElementById('bd-title-start'); if(x)x.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(700);
    if(await p.evaluate(()=>!!document.getElementById('char-card-1')&&document.getElementById('char-card-1').getBoundingClientRect().width>2)) break; }
  await p.evaluate(()=>{const q=document.getElementById('char-card-1'); if(q)q.click();});
  await p.waitForTimeout(900);
  await p.evaluate(()=>{const g=[...document.querySelectorAll('button,.modal-btn')].filter(x=>x.getBoundingClientRect().width>2).find(x=>/모험\s*시작/.test(x.textContent||'')); if(g)g.click();});
  for(let i=0;i<25;i++){ await p.waitForTimeout(900);
    const s=await p.evaluate(()=>{try{return currentStage}catch(e){return null}}); if(s&&s!==1)break; }
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{ try{ fadeToStage(213,0.3,0.32); }catch(e){} });
  await p.waitForTimeout(5000);
  await p.waitForFunction(()=>{try{const V=['trash','bottle','glass','dark_alley'];return V.every(v=>{const im=BD_getAssetImage('field.hazard.'+v);return im&&im.complete&&im.naturalWidth>0;});}catch(e){return false;}},{timeout:30000}).catch(()=>{});
  await p.waitForTimeout(2500);
  const r = await p.evaluate(()=>{
    const V=['trash','bottle','glass','kickboard','cigarette','dark_alley','graffiti','bicycle'];
    const out={stage:(typeof currentStage!=='undefined')?currentStage:'?'};
    out.이미지={};
    for(const v of V){
      let im=null; try{ im=BD_getAssetImage('field.hazard.'+v); }catch(e){}
      out.이미지[v] = im ? (im.complete? im.naturalWidth+'x'+im.naturalHeight : '로딩중') : 'null';
    }
    /* 현재 스테이지의 hazard 목록 */
    try{ const objs=(STAGES[currentStage]&&STAGES[currentStage].objects)||[];
      out.위험요소 = objs.filter(o=>o.hazardId).map(o=>o.hazardVariant+'@'+(o.rx||0).toFixed(3)+','+(o.ry||0).toFixed(3)); }catch(e){ out.위험요소='ERR'; }
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  console.log('실패 응답: '+bad.length+(bad.length?' — '+[...new Set(bad)].slice(0,5).join(', '):''));
  await p.screenshot({ path:'검수도구/_hazard.png' });
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
