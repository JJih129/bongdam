'use strict';
module.exports = async (h) => {
  await h.page.evaluate(()=>{const b=document.getElementById('bd-title-start'); if(b) b.click();});
  for(let i=0;i<30;i++){ await h.wait(700);
    const ok=await h.page.evaluate(()=>!!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width>2); if(ok) break; }
  await h.page.evaluate(()=>{const c=document.getElementById('char-card-1'); if(c) c.click();});
  await h.wait(1200);
  await h.page.evaluate(()=>{const g=[...document.querySelectorAll('button,.modal-btn')]
    .filter(b=>b.getBoundingClientRect().width>2).find(b=>/모험|시작|확인/.test(b.textContent||'')); if(g) g.click();});
  for(let i=0;i<30;i++){ await h.wait(1000);
    const st=await h.page.evaluate(()=>{try{return typeof currentStage!=='undefined'?currentStage:null;}catch(e){return null;}});
    if(st&&st!==1) break; }
  await h.wait(4000);
  await h.shot('verify');
  const r = await h.page.evaluate(()=>{
    const z=parseFloat(getComputedStyle(document.body).zoom)||1;
    const base=document.getElementById('tc-joy-base');
    const wrap=document.getElementById('tc-joystick');
    // 프롤로그 가이드 링 vs 실제 선생님 위치
    const rings=[...document.querySelectorAll('div')].filter(d=>/이야기해요/.test(d.textContent||'')
      && d.getBoundingClientRect().width>10);
    const ring=rings[0]?rings[0].closest('div'):null;
    let teacher=null;
    try{ const st=STAGES[currentStage]; const o=(st.objects||[]).find(x=>/선생님/.test(String(x.label||'')));
      if(o&&window.BD_screenRectOfWorld) teacher=BD_screenRectOfWorld(+o.rx||0,+o.ry||0,+o.rw||0.05,+o.rh||0.075); }catch(e){}
    const rr = ring? ring.getBoundingClientRect() : null;
    return {
      zoom:z,
      조이스틱_대기중_opacity: base? getComputedStyle(base).opacity : '없음',
      조이스틱_active: wrap? wrap.classList.contains('active') : null,
      가이드링_화면좌표: rr? Math.round(rr.left)+','+Math.round(rr.top) : '표시안됨',
      선생님_화면좌표: teacher? Math.round(teacher.left)+','+Math.round(teacher.top) : '못찾음',
      좌표차이: (rr&&teacher)? Math.round(Math.hypot(rr.left-teacher.left, rr.top-teacher.top))+'px' : '-'
    };
  });
  h.say('▶ '+JSON.stringify(r,null,1));
  h.say('콘솔에러 '+h.consoleErrors.length);
};
