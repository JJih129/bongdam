const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const VW=innerWidth, VH=innerHeight;
    const box = e => { const q=e.getBoundingClientRect();
      return {id:e.id||'.'+String(e.className).split(' ')[0], 글:(e.textContent||'').trim().slice(0,12),
        L:Math.round(q.left),T:Math.round(q.top),R:Math.round(q.right),B:Math.round(q.bottom),
        w:Math.round(q.width),h:Math.round(q.height)}; };
    const vis = e => { const s=getComputedStyle(e); if(s.display==='none'||s.visibility==='hidden')return false;
      const q=e.getBoundingClientRect(); return q.width>3&&q.height>3; };
    /* 타이틀 아트 */
    let art=null;
    document.querySelectorAll('img,div').forEach(e=>{ if(!vis(e))return;
      const s=getComputedStyle(e); const bg=s.backgroundImage||'';
      if(e.tagName==='IMG'||bg.indexOf('url')>=0){ const q=e.getBoundingClientRect();
        if(q.width>300&&q.height>150&&(!art||q.width*q.height>art.w*art.h)) art=box(e); } });
    /* 타이틀 버튼과 라벨 */
    const hits=[...document.querySelectorAll('.bd-title-hit')].filter(vis).map(box);
    const labels=[...document.querySelectorAll('*')].filter(e=>!e.children.length&&vis(e)
      && /저장|시작|이어|설정|종료|Ver\./.test((e.textContent||'').trim())).map(box);
    const over=[];
    const all=hits.concat(labels);
    for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
      const a=all[i],c=all[j];
      const ow=Math.min(a.R,c.R)-Math.max(a.L,c.L), oh=Math.min(a.B,c.B)-Math.max(a.T,c.T);
      if(ow>4&&oh>4) over.push(a.id+'['+a.글+'] ↔ '+c.id+'['+c.글+'] '+ow+'x'+oh); }
    return { 뷰포트:VW+'x'+VH, 타이틀아트:art,
      레터박스: art? {좌:art.L, 우:VW-art.R, '낭비%':+(((art.L+(VW-art.R))/VW)*100).toFixed(0)} : null,
      버튼:hits, 라벨:labels.slice(0,8), 겹침:over };
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
