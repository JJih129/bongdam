
/* (v120) 안내·튜토리얼 건너뛰기 기능 제거
   버튼을 없애도 다른 경로(단축키·잔여 호출)로 건너뛰어질 수 있어 기능 자체를 막는다. */
(function(){
  'use strict';
  function block(){
    try{
      if (typeof window.BD_skipTutorial === 'function' && !window.BD_skipTutorial.__bdBlocked){
        window.BD_skipTutorial = function(){ /* 건너뛰기 사용 안 함 */ };
        window.BD_skipTutorial.__bdBlocked = true;
      }
      if (window.BD_TUTOR && typeof BD_TUTOR.skip === 'function' && !BD_TUTOR.skip.__bdBlocked){
        /* (v337) 유저 노출 스킵은 계속 차단하되, 전투 종료 정리(1회 재생 원칙)가 쓸 원본은 보존 */
        if (!BD_TUTOR.__skipReal) BD_TUTOR.__skipReal = BD_TUTOR.skip;
        BD_TUTOR.skip = function(){ /* 건너뛰기 사용 안 함 */ };
        BD_TUTOR.skip.__bdBlocked = true;
      }
      // 혹시 남아 있는 버튼도 숨긴다
      ['bd-dami-skip'].forEach(function(id){
        var e = document.getElementById(id); if (e) e.remove();
      });
      document.querySelectorAll('.bd-tut-skip').forEach(function(e){ e.remove(); });
    }catch(e){}
  }
  block();
  setInterval(block, 700);
})();
