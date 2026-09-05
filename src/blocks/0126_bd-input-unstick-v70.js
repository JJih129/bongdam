
/* (v70) 조작 불가 자가 복구 —
   게임 진행 중인데 타이틀/전환 오버레이가 남아 입력을 삼키는 상태를 감지해 자동으로 풀어준다.
   증상: "가끔 움직여지지 않는다", "도서관에서 나온 뒤 이동 불가", "정화 후 아무 조작도 안 된다" */
(function(){
  'use strict';
  var transStart = 0;
  function playing(){
    try{
      if (typeof currentStage === 'undefined' || currentStage === null) return false;
      if (window.HSR && HSR.active) return false;
      var d = document.getElementById('dialogue-overlay');
      if (d && d.offsetHeight) return false;
      var boss = document.getElementById('bd-boss-dlg');
      if (boss && boss.classList.contains('on')) return false;
      var badge = document.getElementById('bd-badge-ov');
      if (badge && badge.offsetHeight) return false;
      return true;
    }catch(e){ return false; }
  }
  setInterval(function(){
    try{
      if (!playing()) { transStart = 0; return; }
      // (v70a) 타이틀 강제 해제는 제외 — 초기화 경로를 건드려 구맵으로 튀는 부작용 확인됨
      // ② 맵 전환 오버레이가 3초 넘게 남아 있으면 강제 종료 (전환 중단으로 조작 불가)
      var ov = document.getElementById('map-transition-overlay');
      if (ov && ov.offsetParent !== null && getComputedStyle(ov).opacity !== '0'){
        if (!transStart) transStart = Date.now();
        else if (Date.now() - transStart > 3000){
          ov.style.opacity = '0';
          try{ if (typeof transitioning !== 'undefined') transitioning = false; }catch(e2){}
          transStart = 0;
        }
      } else transStart = 0;
      // ③ 전투가 끝났는데 전투 화면이 남아 있으면 정리
      var hb = document.getElementById('hsr-battle');
      if (hb && hb.classList.contains('hsr-show') && !(window.HSR && HSR.active)){
        hb.classList.remove('hsr-show');
      }
    }catch(e){}
  }, 400);
})();
