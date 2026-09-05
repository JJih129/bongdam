/* (v387) 모바일 플로팅 조이스틱 + 화면 속 대상 직접 탭
   - 키보드 WASD/F 입력은 기존 경로를 그대로 유지한다.
   - 터치 시작점에 조이스틱을 띄우고 드래그 방향을 moveKeys로 전달한다.
   - 짧은 탭은 «상호작용 거리 안의 실제 대상»을 눌렀을 때만 F로 전달한다. */
(function(){
  'use strict';
  if(!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;
  window.__bdFloatingTouchV387 = true;

  var canvas=document.getElementById('game-canvas');
  var wrap=document.getElementById('tc-joystick');
  var base=document.getElementById('tc-joy-base');
  var knob=document.getElementById('tc-joy-knob');
  if(!canvas || !wrap || !base || !knob) return;

  var active=null;
  var MOVE_THRESHOLD=12;
  var TAP_LIMIT=650;
  var DEAD=0.24;
  var DIAG=0.34;

  function bodyZoom(){
    try{ var z=parseFloat(getComputedStyle(document.body).zoom)||1; return z>0?z:1; }
    catch(e){ return 1; }
  }
  function setMove(w,a,s,d){
    try{
      if(typeof moveKeys==='undefined') return;
      moveKeys.w=!!w; moveKeys.a=!!a; moveKeys.s=!!s; moveKeys.d=!!d;
    }catch(e){}
  }
  function playable(){
    try{
      var game=document.getElementById('game-screen');
      if(!game || game.style.display!=='block') return false;
      if(window.HSR&&HSR.active) return false;
      if(window.BongdamEditor&&BongdamEditor.state&&BongdamEditor.state.enabled) return false;
      if(window.__bdGuideOpen || window.__bdSceneActive) return false;
      if(window.BD_isInputBlocked&&BD_isInputBlocked()) return false;
      return true;
    }catch(e){ return false; }
  }
  function anchorAt(x,y){
    var z=bodyZoom();
    var size=112;
    var half=(size*z)/2;
    var cx=Math.max(half+8,Math.min(innerWidth-half-8,x));
    var cy=Math.max(half+8,Math.min(innerHeight-half-8,y));
    base.style.left=(cx/z-size/2)+'px';
    base.style.top=(cy/z-size/2)+'px';
    base.style.right='auto'; base.style.bottom='auto';
    knob.style.transform='translate(0px,0px)';
    wrap.classList.add('active');
    return {x:cx,y:cy};
  }
  function updateMove(x,y){
    if(!active) return;
    var z=bodyZoom();
    var dx=x-active.cx,dy=y-active.cy;
    var dist=Math.sqrt(dx*dx+dy*dy);
    var radius=Math.max(38,base.getBoundingClientRect().width/2);
    var clamped=Math.min(dist,radius);
    var nx=dist?dx/dist:0,ny=dist?dy/dist:0;
    knob.style.transform='translate('+(nx*clamped/z)+'px,'+(ny*clamped/z)+'px)';
    if(dist>=MOVE_THRESHOLD) active.dragged=true;
    if(clamped/radius<DEAD){ setMove(false,false,false,false); return; }
    setMove(ny<-DIAG,nx<-DIAG,ny>DIAG,nx>DIAG);
  }
  function reset(){
    active=null;
    wrap.classList.remove('active');
    knob.style.transform='translate(0px,0px)';
    setMove(false,false,false,false);
  }
  function inRect(x,y,r,pad){
    if(!r) return false;
    pad=pad||0;
    return x>=r.left-pad&&x<=r.left+r.width+pad&&y>=r.top-pad&&y<=r.top+r.height+pad;
  }
  function worldRect(rx,ry,rw,rh){
    try{ return window.BD_screenRectOfWorld&&BD_screenRectOfWorld(rx,ry,rw,rh); }
    catch(e){ return null; }
  }
  function objectNear(o){
    if(!o) return false;
    try{
      if(o.resident) return !!(window.BD_nearResident&&BD_nearResident()===o);
      if(o.conceptFacility) return !!(window.BD_getNearConceptFacility&&BD_getNearConceptFacility()===o);
      var x0=Number(o.rx)||0,y0=Number(o.ry)||0;
      var x1=x0+(Number(o.rw)||0),y1=y0+(Number(o.rh)||0);
      var dx=Math.max(x0-heroX,0,heroX-x1),dy=Math.max(y0-heroY,0,heroY-y1);
      var limit=o.interactable==='hazard'?0.075:0.12;
      return Math.sqrt(dx*dx+dy*dy)<=limit;
    }catch(e){ return false; }
  }
  function tappedObject(x,y){
    try{
      var st=STAGES[currentStage];
      if(!st||!Array.isArray(st.objects)) return null;
      /* (v393) 아이들 플레이 보정 — 거리 안 대상 중 가장 가까운 하나만
         터치 판정을 크게 넓히고(±48~56px), 나머지는 4px로 줄여 오탭 방지 */
      var cands=[];
      for(var i=st.objects.length-1;i>=0;i--){
        var o=st.objects[i];
        if(!o||o.hidden||o.__bdGone) continue;
        var usable=!!o.resident||!!o.conceptFacility||['hazard','facility','info','shop','quest','bus_stop'].indexOf(o.interactable)>=0;
        if(!usable||!objectNear(o)) continue;
        var ocx=(Number(o.rx)||0)+(Number(o.rw)||0)/2, ocy=(Number(o.ry)||0)+(Number(o.rh)||0)/2;
        cands.push({o:o, d:Math.hypot(heroX-ocx,heroY-ocy)});
      }
      cands.sort(function(a,b){ return a.d-b.d; });
      for(var j=0;j<cands.length;j++){
        var c=cands[j].o;
        var r=worldRect(Number(c.rx)||0,Number(c.ry)||0,Number(c.rw)||.05,Number(c.rh)||.075);
        var pad=(j===0)?(c.resident?56:48):4;
        if(inRect(x,y,r,pad)) return c;
      }
    }catch(e){}
    return null;
  }
  function tappedLegacyNpc(x,y){
    try{
      if(typeof getNearNPC==='function'&&getNearNPC()&&typeof NPC_X!=='undefined'&&typeof NPC_Y!=='undefined'){
        if(inRect(x,y,worldRect(NPC_X-.032,NPC_Y-.10,.064,.11),44)) return true;   /* (v393) */
      }
    }catch(e){}
    try{
      if(typeof getNearQuestNpc==='function'&&getNearQuestNpc()&&typeof QNPC_X!=='undefined'&&typeof QNPC_Y!=='undefined'){
        if(inRect(x,y,worldRect(QNPC_X-.032,QNPC_Y-.10,.064,.11),44)) return true;   /* (v393) */
      }
    }catch(e){}
    return false;
  }
  function tapInteract(x,y){
    if(!playable()) return false;
    if(!tappedObject(x,y)&&!tappedLegacyNpc(x,y)) return false;
    try{
      var pulse=document.createElement('div');
      pulse.className='bd-touch-target-pulse-v387';
      pulse.style.left=x+'px'; pulse.style.top=y+'px';
      document.body.appendChild(pulse);
      setTimeout(function(){ try{ pulse.remove(); }catch(e){} },420);
    }catch(e){}
    if(typeof window.BD_touchInteract==='function') BD_touchInteract();
    else document.dispatchEvent(new KeyboardEvent('keydown',{key:'f',code:'KeyF',bubbles:true,cancelable:true}));
    return true;
  }

  canvas.addEventListener('pointerdown',function(e){
    if(active||e.button!==0||!playable()) return;
    e.preventDefault();
    var c=anchorAt(e.clientX,e.clientY);
    active={id:e.pointerId,startX:e.clientX,startY:e.clientY,cx:c.x,cy:c.y,at:Date.now(),dragged:false};
    try{ canvas.setPointerCapture(e.pointerId); }catch(err){}
  },true);
  canvas.addEventListener('pointermove',function(e){
    if(!active||active.id!==e.pointerId) return;
    e.preventDefault(); updateMove(e.clientX,e.clientY);
  },true);
  function end(e,cancelled){
    if(!active||active.id!==e.pointerId) return;
    e.preventDefault();
    var a=active;
    var dist=Math.hypot(e.clientX-a.startX,e.clientY-a.startY);
    var tap=!cancelled&&!a.dragged&&dist<MOVE_THRESHOLD&&Date.now()-a.at<=TAP_LIMIT;
    reset();
    if(tap) tapInteract(e.clientX,e.clientY);
  }
  canvas.addEventListener('pointerup',function(e){ end(e,false); },true);
  canvas.addEventListener('pointercancel',function(e){ end(e,true); },true);
  window.addEventListener('blur',reset);

  /* 구형 고정 조이스틱의 터치 영역을 제거하고 시각 요소만 플로팅으로 사용한다. */
  var style=document.createElement('style');
  style.id='bd-floating-touch-style-v387';
  style.textContent=[
    'html.bd-touch-mode #tc-joystick{position:fixed!important;inset:0!important;width:auto!important;height:auto!important;max-height:none!important;pointer-events:none!important}',
    'html.bd-touch-mode #tc-joy-base{position:fixed!important;width:112px!important;height:112px!important;right:auto;bottom:auto;opacity:0!important;visibility:hidden;pointer-events:none!important;transition:none!important}',
    'html.bd-touch-mode #tc-joystick.active #tc-joy-base{opacity:.92!important;visibility:visible!important}',
    '.bd-touch-target-pulse-v387{position:fixed;z-index:100200;width:22px;height:22px;border:3px solid #ffe17b;border-radius:50%;pointer-events:none;animation:bdTouchTargetV387 .4s ease-out forwards}',
    '@keyframes bdTouchTargetV387{from{opacity:1;transform:translate(-50%,-50%) scale(.55)}to{opacity:0;transform:translate(-50%,-50%) scale(2.1)}}'
  ].join('');
  document.head.appendChild(style);

  /* (v393) 필드 하이라이트(0183) 터치 문법화 — [F] 배지 대신 «탭!», 테두리 강조 */
  style.textContent+=[
    'html.bd-touch-mode #bd-f-target{border-width:3px!important;border-style:solid!important}',
    'html.bd-touch-mode #bd-f-target-tag{font-size:14px!important;padding:4px 12px!important;top:-32px!important;border-radius:999px!important}'
  ].join('');
  /* 터치 안내도 실제 조작 방식에 맞춘다. */
  function refreshHint(){
    try{
      var bar=document.getElementById('bd-keybar');
      if(!bar) return;
      var want='👆 화면을 <b>누른 채 드래그</b>해 이동&nbsp;&nbsp;⌨️ <b>외장 키보드 이동</b>도 지원'
        +'&nbsp;&nbsp;💬 가까운 NPC를 <b>탭</b>하거나 <b>F</b>&nbsp;&nbsp;🎒 가방 버튼';
      if(bar.innerHTML!==want) bar.innerHTML=want;
    }catch(e){}
  }
  setInterval(refreshHint,500);
  refreshHint();

  window.BD_FLOATING_TOUCH={
    active:function(){ return active?{id:active.id,start:[active.startX,active.startY],center:[active.cx,active.cy],dragged:active.dragged}:null; },
    reset:reset,
    tapInteract:tapInteract
  };
})();
