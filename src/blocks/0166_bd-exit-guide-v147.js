
/* (v147) 실내(문화의집 3층)에 들어오면 길안내가 완전히 사라져
   «어디로 가야 할지 모르는» 상태가 되던 문제.
   — BD_currentGuide 는 실내 스테이지에서 항상 null 을 돌려주고,
     엘리베이터 안내는 프롤로그 단계에서만 켜지도록 되어 있었다.
   실내에서는 «밖으로 나가는 길»을 계속 가리켜 준다. */
(function(){
  'use strict';

  function exitTarget(st){
    try{
      var o = (st.objects||[]).find(function(x){
        return x && /엘리베이터|승강기/.test(String(x.label||'')); });
      if (o) return { rx:(o.rx||0), ry:(o.ry||0), rw:(o.rw||0.05), rh:(o.rh||0.05) };
    }catch(e){}
    return { rx:0.688, ry:0.080, rw:0.024, rh:0.020 };   // 문화의집 3층 기본값
  }

  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined' || typeof STAGES === 'undefined') return;
      var st = STAGES[Number(currentStage)];
      var cur = window.__bdNavOverride;
      var inside = !!(st && st.interior);

      if (!inside){
        if (cur && cur.__exit) window.__bdNavOverride = null;   // 밖으로 나오면 해제
        return;
      }
      if (window.HSR && window.HSR.active) return;
      /* 프롤로그(선생님 → 배지 → 엘리베이터)는 기존 안내가 담당한다.
         여기서 먼저 «나가기»를 띄우면 선생님을 건너뛰게 된다. */
      try{ if (localStorage.getItem('bd_tut2_done') !== '1') return; }catch(ePro){ return; }
      if (cur && cur.__ele) return;      // 프롤로그 전용 안내가 우선
      if (cur && cur.__exit) return;     // 이미 안내 중
      /* 실내에서는 «밖으로 나가는 길»이 늘 유효한 목표다.
         다른 맵을 가리키던 회복·이동 안내가 남아 있으면 그것을 대신한다. */
      if (cur && !cur.__guide && !cur.__rest && !cur.__travel) return;
      if (cur && cur.__rest){
        // 이 맵 안의 회복 지점을 가리키는 중이면 존중한다
        try{
          var st2 = STAGES[Number(currentStage)];
          var here = (st2 && st2.objects || []).some(function(o){
            return o && Math.abs((o.rx||0) - cur.rx) < 0.004 && Math.abs((o.ry||0) - cur.ry) < 0.004; });
          if (here) return;
        }catch(eR){}
      }

      var t = exitTarget(st);
      window.__bdNavOverride = { rx:t.rx, ry:t.ry, rw:t.rw, rh:t.rh,
        label:'밖으로 나가기', _guideLabel:'밖으로 나가기 (엘리베이터)', __exit:true };
    }catch(e){}
  }, 600);
})();
