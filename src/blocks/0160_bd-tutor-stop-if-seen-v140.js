
/* (v140b) 이미 본 전투 튜토가 다른 경로로 시작되면 즉시 정리한다.
   run() 훅만으로는 잡히지 않는 경로가 있어, 전투 중 상태를 직접 감시한다. */
(function(){
  'use strict';
  setInterval(function(){
    try{
      var seen = localStorage.getItem('bd_battle_tutorial_seen') === '1';
      if (!seen) return;
      if (!(window.HSR && HSR.active)) return;
      if (!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning())) return;
      // 이미 본 튜토가 전투 중 다시 돌고 있다 → 조용히 종료
      try{ if (BD_TUTOR.done) BD_TUTOR.done(); }catch(e){}
      // 강조 오버레이 잔상 제거
      ['bd-spot-hole','bd-spot-mask','bd-tutorial'].forEach(function(id){
        var e = document.getElementById(id);
        if (e) { e.style.display = 'none'; }
      });
      try{ console.info('[v140b] 이미 본 전투 튜토 — 자동 종료'); }catch(e){}
    }catch(e){}
  }, 500);
})();
