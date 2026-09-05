
/* (v137) 전투 튜토리얼이 두 번째 전투에서 또 나오던 문제
   ────────────────────────────────────────────────────────────
   첫 전투를 «필드 튜토»가 이어받아 소화하면, 전투 튜토 전용 완료 키
   (bd_battle_tutorial_done)가 마킹되지 않는다.
   → 다음 전투(킥보드 등)에서 전투 튜토가 처음인 줄 알고 다시 시작했다.

   해법: 전투 중에 튜토리얼이 실제로 진행됐다면, 그 전투가 끝날 때 완료로 기록한다. */
(function(){
  'use strict';
  var sawTutorInBattle = false;
  var wasBattle = false;

  setInterval(function(){
    try{
      var inb = !!(window.HSR && HSR.active);
      var running = !!(window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning());

      if (inb && running) sawTutorInBattle = true;

      // 전투가 끝나는 순간 — 튜토를 봤다면 완료로 기록
      if (wasBattle && !inb){
        if (sawTutorInBattle){
          try{
            // (v140a) 실제로 «본» 경우에만 기록 — 다음 전투부터 재등장하지 않는다
            localStorage.setItem('bd_battle_tutorial_seen', '1');
            localStorage.setItem('bd_battle_tutorial_done', '1');
            try{ console.info('[v137] 전투 튜토리얼 완료 — 다음 전투에서 재등장하지 않습니다.'); }catch(e){}
          }catch(e){}
        }
        sawTutorInBattle = false;
      }
      wasBattle = inb;
    }catch(e){}
  }, 400);
})();
