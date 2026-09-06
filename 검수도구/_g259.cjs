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
  await p.evaluate(()=>{ try{ BD_openSnake(); }catch(e){} });
  await p.waitForTimeout(2500);
  const a = await p.evaluate(()=>{ const el=[...document.querySelectorAll('*')].find(e=>!e.children.length&&/나가기/.test(e.textContent||''));
    return el?el.textContent.trim():'못 찾음'; });
  await p.evaluate(()=>{ try{ BD_GUIDE.run(); }catch(e){} });
  await p.waitForTimeout(800);
  const c = await p.evaluate(()=>{ const el=[...document.querySelectorAll('*')].find(e=>!e.children.length&&/나가기/.test(e.textContent||''));
    return el?el.textContent.trim():'못 찾음'; });
  console.log('0259 살아있나: '+await p.evaluate(()=>!!window.BD_GUIDE));
  console.log('자동 처리 후 : "'+a+'"');
  console.log('강제 실행 후 : "'+c+'"');
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
