
/* (v138) 완료 표시된 뒤에도 전투 튜토가 다시 뜨던 문제
   v137에서 «전투가 끝날 때» 완료로 기록하게 했지만,
   그와 별개로 튜토를 시작시키는 경로가 남아 있어 두 번째 전투에서 또 실행됐다.
   → 완료 키가 있으면 전투 구간 튜토(run) 자체를 막는다. 필드 튜토는 영향 없음. */
(function(){
  'use strict';
  var w = setInterval(function(){
    try{
      if (!(window.BD_TUTOR && BD_TUTOR.run) || BD_TUTOR.run.__bdGate) return;
      clearInterval(w);
      var orig = BD_TUTOR.run.bind(BD_TUTOR);
      BD_TUTOR.run = function(steps, startAt, tag){
        try{
          if (tag === 'skill_intro' || tag === 'shop_tuto') return orig.apply(BD_TUTOR, arguments);   /* (v375) 새 스킬 소개·가게 튜토는 전투 튜토 게이트 대상 아님 */
          var done = false;
          try{ done = localStorage.getItem('bd_battle_tutorial_done') === '1'; }catch(e){}
          var inBattle = !!(window.HSR && HSR.active);
          // 전투 중에 시작하려는 튜토인데 이미 완료했다면 실행하지 않는다
          // (v140a) «완료로 기록됨»만으로 막으면, 아직 한 번도 못 본 첫 전투까지 막혀 버린다.
          //  실제로 튜토를 끝까지 본 적이 있을 때(bd_battle_tutorial_seen)만 차단한다.
          var seen = false;
          try{ seen = localStorage.getItem('bd_battle_tutorial_seen') === '1'; }catch(e){}
          // (v140b) 전투 구간 튜토는 «bars 부터 시작하는 것»과 «전투 중 실행되는 것» 두 갈래다.
          //  이미 본 적이 있으면 어느 쪽이든 막는다. (필드 튜토는 startAt 이 없으므로 영향 없음)
          if (seen && (inBattle || startAt === 'bars' || startAt)){
            try{ console.info('[v138] 전투 튜토리얼 이미 봄 — 재실행하지 않습니다.'); }catch(e){}
            return;
          }
        }catch(e){}
        return orig.apply(BD_TUTOR, arguments);   /* (v374) 3번째 인자(tag) 보존 — 가게 튜토 태그가 유실돼 0199 가 전투 튜토로 오인해 종료시키던 문제 */
      };
      BD_TUTOR.run.__bdGate = true;
    }catch(e){}
  }, 200);
})();
