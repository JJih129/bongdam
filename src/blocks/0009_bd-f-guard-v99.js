
/* (v99) 대사 마지막 F가 다른 상호작용까지 실행하던 문제
   · 대사창이 떠 있을 때 눌린 F는 '대사 넘기기' 전용으로 소비하고,
     대사가 닫힌 직후 550ms 동안 들어오는 F는 무시한다(같은 누름의 잔상 차단).
   · 캡처 단계에서 처리해 조사·휴식·엘리베이터 등 모든 F 핸들러보다 먼저 막는다. */
(function(){
  'use strict';
  var closedAt = 0, wasUp = false;

  function dlgUp(){
    try{
      var ov = document.getElementById('dialogue-overlay');
      var bx = document.getElementById('dialogue-box');
      return !!(ov && ov.offsetHeight && bx && bx.offsetHeight);
    }catch(e){ return false; }
  }
  // 대사창이 닫히는 순간을 기록
  setInterval(function(){
    try{
      var up = dlgUp();
      if (wasUp && !up) closedAt = Date.now();
      wasUp = up;
    }catch(e){}
  }, 150);

  document.addEventListener('keydown', function(e){
    if (e.key !== 'f' && e.key !== 'F') return;
    try{
      if (window.HSR && HSR.active) return;                 // 전투 중은 관여하지 않음
      var choiceOpen = false;
      try{ choiceOpen = !!(window.BD_choiceOpen && BD_choiceOpen()); }catch(e2){}
      if (choiceOpen) return;                                // 선택창은 자체 처리
      if (dlgUp()){
        // (v99a) 대사창이 떠 있는 동안의 F는 '대사 넘기기' 전용 —
        //  여기서 직접 넘기고 이벤트를 소비해, 같은 누름이 조사·휴식까지 실행하는 것을 막는다
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        try{
          var ov = document.getElementById('dialogue-overlay');
          if (ov) ov.click();          // 대사 진행/닫기는 오버레이 클릭 처리기가 담당
        }catch(e3){}
        closedAt = Date.now();          // 닫히는 경우를 대비해 쿨다운 시작
        return;
      }
      if (closedAt && Date.now() - closedAt < 550){
        // 대사가 방금 닫혔다 → 같은 누름이 다음 상호작용까지 여는 것을 차단
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        /* (v361) 무반응 대신 쿨다운 직후 1회 자동 재실행 */
        if (!window.__bdFRetryT){
          var __left2 = 570 - (Date.now() - closedAt);
          if (__left2 < 60) __left2 = 60;
          window.__bdFRetryT = setTimeout(function(){
            window.__bdFRetryT = null;
            try{
              var ev2 = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true, cancelable: true });
              document.dispatchEvent(ev2);
            }catch(eR2){}
          }, __left2);
        }
      }
    }catch(err){}
  }, true);
})();
