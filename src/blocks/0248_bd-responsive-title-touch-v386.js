/* (v386) 직접 탭 상호작용
   런타임 저장 데이터는 건드리지 않고 Input 어댑터만 추가한다.
   (카메라 프레이밍·타이틀 메뉴 개편은 배치 비율이 깨져 롤백됨 — 검수도구/progress.md 참고) */
(function(){
  'use strict';

  /* ── 주변 상호작용 단일 조회 ── */
  function safeCall(name){
    try{ return typeof window[name] === 'function' ? window[name]() : null; }catch(e){ return null; }
  }
  function rectDistance(o){
    var left=Number(o.rx)||0, top=Number(o.ry)||0;
    var right=left+(Number(o.rw)||0), bottom=top+(Number(o.rh)||0);
    var dx=Math.max(left-heroX,0,heroX-right), dy=Math.max(top-heroY,0,heroY-bottom);
    return Math.sqrt(dx*dx+dy*dy);
  }
  function nearbyInteraction(){
    try{
      var game = document.getElementById('game-screen');
      if (!game || game.style.display !== 'block') return null;
      var vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05) return {icon:'▶',label:'다음'};
      if (window.HSR && HSR.active) return null;
      if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return null;
      if (window.BD_isInputBlocked && BD_isInputBlocked()) return null;
      var resident = safeCall('BD_nearResident');
      if (resident) return {icon:'💬',label:'대화'};
      if (safeCall('getNearNPC') || safeCall('getNearQuestNpc')) return {icon:'💬',label:'대화'};
      var facility = safeCall('BD_getNearConceptFacility');
      if (facility) return {icon:'🏛️',label:'이용'};
      var st = (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null;
      if (st && Array.isArray(st.objects)){
        var awareness = 0.055;
        try{ if(typeof getSafetyBonus === 'function') awareness *= 1 + getSafetyBonus('awareness') * 0.15; }catch(e){}
        for (var i=0;i<st.objects.length;i++){
          var o=st.objects[i]; if(!o || o.hidden || o.__bdGone) continue;
          if(o.interactable==='hazard'){
            var purified=!!o._purified;
            try{ purified=purified || !!(window.BD_isPurified && BD_isPurified(o.hazardId||o.id||o.label)); }catch(e){}
            var locked=false;
            try{ locked=!!(window.BD_hazardLocked && BD_hazardLocked(o)); }catch(e){}
            if(!purified && !locked && rectDistance(o)<=awareness) return {icon:'🔍',label:'조사'};
          }
          if(o.interactable==='facility'){
            var cx=(Number(o.rx)||0)+(Number(o.rw)||0)/2, cy=(Number(o.ry)||0)+(Number(o.rh)||0)/2;
            if(Math.hypot(heroX-cx,heroY-cy)<=awareness) return {icon:'✨',label:'이용'};
          }
          if(o.interactable==='info' || o.interactable==='shop' || o.interactable==='quest'){
            var inX=heroX>=(Number(o.rx)||0)-.05 && heroX<=(Number(o.rx)||0)+(Number(o.rw)||0)+.05;
            var doorY=(Number(o.ry)||0)+(Number(o.rh)||0), ddy=heroY-doorY;
            if(inX && ddy>=-.02 && ddy<.20) return {icon:o.interactable==='info'?'ℹ️':(o.interactable==='shop'?'🏪':'📋'),label:o.interactable==='info'?'안내':'입장'};
          }
        }
      }
      if (st && st.interior){
        if (safeCall('getNearStair')) return {icon:'🪜',label:'이동'};
        try{ if(typeof isNearLibraryDoor==='function' && isNearLibraryDoor()) return {icon:'🚪',label:'나가기'}; }catch(e){}
      }
      try{ if(typeof isNearStore24==='function' && isNearStore24()) return {icon:'🏪',label:'입장'}; }catch(e){}
      try{ if(typeof getNearQuest==='function' && getNearQuest()) return {icon:'📋',label:'입장'}; }catch(e){}
    }catch(e){}
    return null;
  }
  window.BD_hasNearbyInteraction = nearbyInteraction;

  function dispatchInteraction(){
    var vn=document.getElementById('dialogue-box');
    var talking=vn && vn.offsetHeight>0 && parseFloat(getComputedStyle(vn).opacity)>.05;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:talking?' ':'f',code:talking?'Space':'KeyF',bubbles:true,cancelable:true}));
  }
  window.BD_touchInteract = dispatchInteraction;

  /* 화면 탭도 F 버튼과 같은 단일 입력 경로를 사용한다. 드래그/조이스틱/메뉴는 제외한다. */
  var canvas=document.getElementById('game-canvas'), tap=null;
  if(canvas && window.PointerEvent){
    canvas.addEventListener('pointerdown',function(e){
      if(e.button!==0 || (window.BongdamEditor&&BongdamEditor.state&&BongdamEditor.state.enabled)) return;
      tap={id:e.pointerId,x:e.clientX,y:e.clientY,t:Date.now()};
    },true);
    canvas.addEventListener('pointerup',function(e){
      /* (v387) 플로팅 조이스틱/대상 직접 탭 레이어가 짧은 탭과 드래그를
         함께 판정한다. 구형 «근처면 화면 아무 곳 탭» 처리는 중복 실행하지 않는다. */
      if(window.__bdFloatingTouchV387){ tap=null; return; }
      if(!tap || tap.id!==e.pointerId) return;
      var t=tap; tap=null;
      if(Math.hypot(e.clientX-t.x,e.clientY-t.y)>14 || Date.now()-t.t>650) return;
      if(!nearbyInteraction()) return;
      e.preventDefault();
      dispatchInteraction();
    },true);
    canvas.addEventListener('pointercancel',function(){ tap=null; },true);
  }

  /* 기존 모바일 F 버튼도 위험요소·시설·계단까지 동일하게 활성화한다. */
  function refreshTouchButton(){
    var btn=document.getElementById('tc-btn-f'); if(!btn) return;
    var info=nearbyInteraction(), icon=document.getElementById('tc-f-icon'), label=document.getElementById('tc-f-label');
    btn.classList.toggle('tc-disabled',!info);
    btn.classList.toggle('tc-pulse',!!info);
    if(icon) icon.textContent=info?info.icon:'🔍';
    if(label) label.textContent=info?info.label:'조사';
  }
  if(window.BD_addTick) BD_addTick(refreshTouchButton,120); else setInterval(refreshTouchButton,120);

  var style=document.createElement('style');
  style.id='bd-responsive-title-touch-style-v386';
  style.textContent=[
    'body.bd-map-open.bd-map-tuto-speaking #bd-dami-hud{display:flex!important;opacity:1!important;visibility:visible!important;z-index:100050!important;left:max(10px,env(safe-area-inset-left))!important;bottom:max(12px,env(safe-area-inset-bottom))!important;transform:scale(.95)!important;transform-origin:left bottom!important;pointer-events:none!important}',
    'body.bd-map-open.bd-map-tuto-speaking #bd-dami-hud #bd-dami-bubble{opacity:1!important;visibility:visible!important;max-width:min(390px,48vw)!important;box-shadow:0 10px 34px rgba(0,0,0,.55)!important}',
    '@media(max-width:700px),(max-height:480px){body.bd-map-open.bd-map-tuto-speaking #bd-dami-hud{transform:scale(.78)!important}body.bd-map-open.bd-map-tuto-speaking #bd-dami-hud #bd-dami-bubble{max-width:min(330px,56vw)!important}}'
  ].join('');
  document.head.appendChild(style);
})();
