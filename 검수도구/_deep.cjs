/* 전투·미니게임처럼 «진입 조건이 있는» 화면을 직접 열어 검사한다.
   자동 스윕(_sweep.cjs)에 안 잡히던 영역. BD_MODE=phone|tablet|pc */
const { chromium } = require('playwright');
const MODES = { phone:{이름:'폰 874x300',w:874,h:300,dpr:3,touch:true},
  tablet:{이름:'태블릿 1280x800',w:1280,h:800,dpr:2,touch:true},
  pc:{이름:'PC 1440x900',w:1440,h:900,dpr:1,touch:false} };
const M = MODES[process.env.BD_MODE||'phone'];
const SCREENS = [
  { key:'battle', 이름:'전투',      open:'HSR.start()' },
  { key:'rhythm', 이름:'리듬게임',   open:'BD_openRhythm(0)' },
  { key:'snake',  이름:'스네이크',   open:'BD_openSnake()' },
  { key:'arcade', 이름:'아케이드',   open:'BD_openArcade()' },
  { key:'doom',   이름:'슈팅',      open:'BD_openDoom()' }
];
const MEASURE = `(() => {
  const VW=innerWidth, VH=innerHeight;
  const sc=el=>{let k=1;for(let a=el;a&&a.nodeType===1;a=a.parentElement){const v=parseFloat(getComputedStyle(a).zoom);if(v>0&&v!==1)k*=v;}return k;};
  const on=el=>{const s=getComputedStyle(el);
    if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)<0.1)return false;
    const q=el.getBoundingClientRect();
    return q.width>8&&q.height>8&&q.right>0&&q.left<VW&&q.bottom>0&&q.top<VH;};
  let minPx=Infinity, tiny=[], split=[], small=[], clipped=[];
  document.querySelectorAll('*').forEach(e=>{
    if(!on(e))return;
    const q=e.getBoundingClientRect();
    if(!e.children.length){ const t=(e.textContent||'').trim();
      if(t){ const px=parseFloat(getComputedStyle(e).fontSize)*sc(e);
        if(px>0){ if(px<minPx)minPx=px;
          if(px<11){ let o='';for(let a=e;a;a=a.parentElement){if(a.id){o='#'+a.id;break;}}
            tiny.push(t.slice(0,10)+'('+px.toFixed(1)+' @'+(o||'?')+')'); }
          if(t.length>1&&q.width<px*1.6&&q.height>px*1.9) split.push(t.slice(0,8)); } } }
    if(/^(BUTTON|A)$/.test(e.tagName)||/btn/i.test(String(e.className))){
      const m=Math.min(q.width,q.height);
      if(m>4&&m<44) small.push((e.id||'.'+String(e.className).split(' ')[0])+' '+Math.round(q.width)+'x'+Math.round(q.height)); }
    if(q.width>80&&q.height>40){
      const s=getComputedStyle(e);
      const scrollable=/(auto|scroll)/.test(s.overflowY+' '+s.overflow);
      let inScroll=false; for(let a=e.parentElement;a;a=a.parentElement){
        const as=getComputedStyle(a); if(/(auto|scroll)/.test(as.overflowY+' '+as.overflow)){inScroll=true;break;} }
      const hid=e.scrollHeight-e.clientHeight;
      if(hid>12&&!scrollable) clipped.push((e.id||'.'+String(e.className).split(' ')[0])+' 숨음'+hid);
      if(!inScroll&&(q.bottom>VH+4||q.top<-4)) clipped.push((e.id||'.'+String(e.className).split(' ')[0])+' 화면밖'); }
  });
  return { 최소글자:minPx===Infinity?null:+minPx.toFixed(1),
    작은글씨:[...new Set(tiny)].slice(0,6), 작은글씨수:tiny.length,
    쪼개짐:[...new Set(split)].slice(0,5), 쪼개짐수:split.length,
    작은버튼:[...new Set(small)].slice(0,5), 잘림:[...new Set(clipped)].slice(0,4) };
})()`;
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const ctx = await b.newContext({ viewport:{width:M.w,height:M.h}, deviceScaleFactor:M.dpr, hasTouch:M.touch, isMobile:M.touch });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,80)));
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
  await p.waitForTimeout(3500);
  console.log('▶ '+M.이름);
  for(const sc of SCREENS){
    const res = await p.evaluate(code=>{ try{ eval(code); return 'ok'; }catch(e){ return 'ERR '+e.message.slice(0,50); } }, sc.open);
    if(res!=='ok'){ console.log('── '+sc.이름.padEnd(9)+' 열지 못함: '+res); continue; }
    await p.waitForTimeout(2500);
    const r = await p.evaluate(MEASURE);
    const f=[];
    if(r.작은글씨수) f.push('작은글씨 '+r.작은글씨수+'개(최소 '+r.최소글자+'px)');
    if(r.쪼개짐수) f.push('세로쪼개짐 '+r.쪼개짐수+'개');
    if(r.잘림.length) f.push('잘림 '+r.잘림.length+'건');
    if(r.작은버튼.length) f.push('작은버튼 '+r.작은버튼.length+'개');
    console.log('── '+sc.이름.padEnd(9)+(f.length?'⚠ '+f.join(' · '):'✅ 이상 없음'));
    if(r.작은글씨수) console.log('     '+r.작은글씨.join(' '));
    if(r.쪼개짐수) console.log('     쪼개짐: '+r.쪼개짐.join(' '));
    if(r.잘림.length) console.log('     잘림: '+r.잘림.join(' · '));
    if(r.작은버튼.length) console.log('     버튼: '+r.작은버튼.join(' · '));
    await p.screenshot({ path:'검수도구/_deep_'+(process.env.BD_MODE||'phone')+'_'+sc.key+'.png' });
    /* 닫기 */
    await p.evaluate(()=>{ try{document.querySelectorAll('.bd-modal.show,.bd-modal.open').forEach(x=>x.classList.remove('show','open'));}catch(e){}
      try{ if(window.HSR&&HSR.active&&HSR.end)HSR.end(); }catch(e){}
      try{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',keyCode:27,bubbles:true})); }catch(e){} });
    await p.waitForTimeout(1200);
  }
  console.log('콘솔에러 '+errs.length+(errs.length?' — '+errs.slice(0,2).join(' | '):''));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
