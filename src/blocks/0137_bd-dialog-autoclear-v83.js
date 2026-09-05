
/* (v83) 대사창이 열린 채 방치되어 조작이 막히는 상황 방지
   · 짧은 안내성 대사(휴식·안내 독백)는 일정 시간이 지나면 자동으로 닫는다
   · 입력이 전혀 없는 상태로 오래 떠 있으면(플레이어가 대사창을 인지 못한 경우) 자동 해제 */
(function(){
  'use strict';
  var openedAt = 0, lastText = '', lastInput = Date.now();
  ['keydown','mousedown','touchstart','wheel'].forEach(function(ev){
    document.addEventListener(ev, function(){ lastInput = Date.now(); }, true);
  });
  function box(){ return document.getElementById('dialogue-box'); }
  function overlay(){ return document.getElementById('dialogue-overlay'); }
  function close(){
    try{
      var ov = overlay(); if (!ov) return;
      // 게임이 제공하는 정식 닫기 경로를 우선 사용
      if (typeof window.closeDialog === 'function'){ window.closeDialog(); return; }
      ov.click();                       // 대사 진행/닫기 처리기가 붙어 있음
      setTimeout(function(){
        try{ var o2 = overlay(); if (o2 && o2.offsetHeight) o2.style.display = 'none'; }catch(e){}
      }, 400);
    }catch(e){}
  }
  setInterval(function(){
    try{
      var ov = overlay(), b = box();
      if (!(ov && ov.offsetHeight && b)){ openedAt = 0; lastText = ''; return; }
      if (window.HSR && HSR.active) return;
      var t = (b.textContent||'').replace(/\s+/g,' ').trim();
      if (t !== lastText){ lastText = t; openedAt = Date.now(); return; }
      var idle = Date.now() - lastInput;
      var shown = Date.now() - openedAt;
      // 같은 대사가 12초 이상 그대로 + 최근 6초간 입력 없음 → 방치로 보고 정리
      if (shown > 12000 && idle > 6000) { close(); openedAt = Date.now(); }
    }catch(e){}
  }, 1000);
})();
