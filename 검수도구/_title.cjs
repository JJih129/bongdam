/* 첫 화면(타이틀 → 캐릭터 선택)이 각 환경에서 어떻게 보이나. */
const { chromium } = require('playwright');
const MODES = { phone:{이름:'폰 874x300',w:874,h:300,dpr:3,touch:true},
  tablet:{이름:'태블릿 1280x800',w:1280,h:800,dpr:2,touch:true},
  pc:{이름:'PC 1440x900',w:1440,h:900,dpr:1,touch:false} };
const M = MODES[process.env.BD_MODE||'phone'];
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await b.newContext({ viewport:{width:M.w,height:M.h}, deviceScaleFactor:M.dpr, hasTouch:M.touch, isMobile:M.touch });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(3500);
  const grab = (label) => p.evaluate(lb => {
    const VW=innerWidth, VH=innerHeight;
    const sc = el => { let k=1; for(let a=el;a&&a.nodeType===1;a=a.parentElement){const v=parseFloat(getComputedStyle(a).zoom); if(v>0&&v!==1)k*=v;} return k; };
    const on = el => { const s=getComputedStyle(el); if(s.display==='none'||s.visibility==='hidden')return false;
      const q=el.getBoundingClientRect(); return q.width>4&&q.height>4&&q.bottom>0&&q.top<VH; };
    let minPx=Infinity, tiny=[], small=[], clipped=[];
    document.querySelectorAll('*').forEach(e=>{
      if(!on(e))return;
      if(!e.children.length){ const t=(e.textContent||'').trim();
        if(t){ const px=parseFloat(getComputedStyle(e).fontSize)*sc(e);
          if(px>0){ if(px<minPx)minPx=px; if(px<11) tiny.push(t.slice(0,10)+'('+px.toFixed(1)+')'); } } }
      const q=e.getBoundingClientRect();
      if(/^(BUTTON|A)$/.test(e.tagName)||/btn|card/i.test(String(e.className))){
        const m=Math.min(q.width,q.height);
        if(m>4&&m<44) small.push((e.id||'.'+String(e.className).split(' ')[0])+' '+Math.round(q.width)+'x'+Math.round(q.height)); }
      if(q.width>80&&q.height>40&&(q.bottom>VH+4||q.top<-4)){
        const s=getComputedStyle(e);
        if(!/(auto|scroll)/.test(s.overflowY+' '+s.overflow)) clipped.push((e.id||'.'+String(e.className).split(' ')[0])); }
    });
    return { 단계:lb, 최소글자:minPx===Infinity?null:+minPx.toFixed(1),
      작은글씨:[...new Set(tiny)].slice(0,6), 작은글씨수:tiny.length,
      작은버튼:[...new Set(small)].slice(0,6), 잘림:[...new Set(clipped)].slice(0,5) };
  }, label);
  console.log('▶ ' + M.이름);
  console.log(JSON.stringify(await grab('타이틀')));
  await p.screenshot({ path: '검수도구/_title_' + (process.env.BD_MODE||'phone') + '.png' });
  await p.evaluate(() => { const x=document.getElementById('bd-title-start'); if(x)x.click(); });
  for (let i=0;i<25;i++){ await p.waitForTimeout(700);
    if (await p.evaluate(()=>!!document.getElementById('char-card-1')&&document.getElementById('char-card-1').getBoundingClientRect().width>2)) break; }
  await p.waitForTimeout(1200);
  console.log(JSON.stringify(await grab('캐릭터 선택')));
  await p.screenshot({ path: '검수도구/_charsel_' + (process.env.BD_MODE||'phone') + '.png' });
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
