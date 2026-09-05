/* (v389) 모바일 가방 버튼 우측상단 이동
   우측하단의 [가방] 버튼이 지역 경계 칩(#bd-gate-right, 우측 중앙)·짧은 가로 화면의
   하단 UI 를 가리는 제보 → 조작 버튼은 [조사] 하나만 남기고, 가방은 우측상단
   메뉴줄(☰ 왼쪽)로 옮긴다. 키보드 E 경로·데스크톱은 그대로다. */
(function(){
  'use strict';
  if(!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;

  /* 기존 우측하단 가방 줄은 숨긴다 (버튼 자체는 남겨 두어 다른 코드의 참조를 깨지 않는다) */
  var style=document.createElement('style');
  style.id='bd-bag-topright-style-v389';
  style.textContent='#tc-btn-e{display:none!important}';
  document.head.appendChild(style);

  var btn=null;
  function ensure(){
    if(btn && btn.isConnected) return btn;
    var bar=document.getElementById('bd-menu-btns');
    if(!bar) return null;
    btn=document.createElement('button');
    btn.id='bd-bag-top'; btn.type='button';
    btn.setAttribute('aria-label','가방');
    btn.textContent='🎒';
    /* (v390) 메뉴줄 안의 항시 노출 항목으로 배치 — flex 가 ☰ 확장·zoom·safe-area 를 알아서 처리한다.
       ☰ 토글(0254)보다 앞에 놓이며, 0254 의 접기 로직은 이 버튼을 건너뛴다. */
    btn.style.cssText='background:rgba(16,24,44,.94);border:1px solid rgba(255,210,80,.55);'
      +'color:#ffe08a;border-radius:12px;width:44px;height:44px;font-size:20px;cursor:pointer;display:none;'
      +'-webkit-tap-highlight-color:transparent;';
    btn.addEventListener('touchstart',function(e){
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'e',code:'KeyE',bubbles:true,cancelable:true}));
    },{passive:false});
    btn.addEventListener('click',function(e){ e.preventDefault(); });
    bar.insertBefore(btn, document.getElementById('bd-mb-toggle'));
    return btn;
  }

  function sync(){
    var b=ensure();
    if(!b) return;
    /* 표시 조건: 기존 터치 컨트롤(0019)이 보일 때만 — 대화·전투·오버레이 중엔 같이 숨는다 */
    var tc=document.getElementById('touch-controls');
    var on=!!(tc && tc.style.display!=='none' && tc.style.display!=='');
    b.style.display=on?'':'none';
    /* 인벤토리 열림 강조 */
    var iOpen=false; try{ iOpen=(typeof invOpen!=='undefined')&&invOpen; }catch(e){}
    b.style.boxShadow=iOpen?'0 0 14px rgba(255,210,80,.75)':'';
    /* (v391) 담이가 «가방을 열어보라»고 안내하는 동안 노란 테두리 펌스 —
       가방을 열면(또는 15초 후) 사라지고 다시 뜨지 않는다 */
    if(!sync.__bagPulseDone){
      var bubText='';
      try{
        var bub=document.getElementById('bd-dami-bubble');
        /* visibility:hidden 상태에서도 textContent 는 남으므로 반드시 .on(표시 중)일 때만 읽는다 */
        if(bub && bub.classList.contains('on')) bubText=bub.textContent||'';
      }catch(e){}
      /* (v396) 실제 안내 대사에 느낌표가 섞여 문장부호 제한 정규식이 매치 실패 — 가방+열기 동시 포함으로 완화 */
      var asking=/가방/.test(bubText) && /열|눌러/.test(bubText);
      window.__bdBagPulseState={done:!!sync.__bagPulseDone,at:sync.__bagPulseAt||0,asking:asking,txt:bubText.slice(0,40),inv:iOpen};
      if(iOpen){
        sync.__bagPulseDone=true; b.classList.remove('tc-pulse');
      }else if(asking){
        if(!sync.__bagPulseAt) sync.__bagPulseAt=Date.now();
        if(Date.now()-sync.__bagPulseAt>15000){ sync.__bagPulseDone=true; b.classList.remove('tc-pulse'); }
        else b.classList.add('tc-pulse');
      }else if(sync.__bagPulseAt){
        /* 안내 말풍선이 닫혔다 — 강조도 종료 */
        sync.__bagPulseDone=true; b.classList.remove('tc-pulse');
      }
    }
    /* ☰ 보다 앞 순서 유지 (토글이 나중에 생기면 뒤로 밀린다) */
    var t=document.getElementById('bd-mb-toggle');
    if(t && b.nextSibling!==t) b.parentNode.insertBefore(b,t);
  }
  if(window.BD_addTick) BD_addTick(sync,400); else setInterval(sync,400);
})();
