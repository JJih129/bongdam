
/* (v139) 플레이를 막는 치명 버그 묶음 수정
   ① 엘리베이터를 타면 구맵(stage 1)으로 가거나 벽에 끼던 문제
   ② 최종 보스를 잡지 않아도 엔딩이 나오던 문제
   ③ 길안내 화살표가 이미 끝낸 목표를 가리키던 문제 */
(function(){
  'use strict';

  /* ── ① 구맵 진입 차단 — 신맵(212)이 있으면 언제나 그쪽으로 ── */
  var w1 = setInterval(function(){
    try{
      if (typeof window.fadeToStage !== 'function' || window.fadeToStage.__bdGuard) return;
      clearInterval(w1);
      var orig = window.fadeToStage;
      window.fadeToStage = function(sid, x, y, ms){
        try{
          // 구맵 1은 신맵 도입 전의 잔재 — 신맵이 있으면 와우리로 돌린다
          if (Number(sid) === 1 && window.STAGES && STAGES[212]){
            try{ console.info('[v139] 구맵(1) 진입 차단 → 와우리(212)로 이동'); }catch(e){}
            return orig(212, 0.216, 0.336, ms || 700);
          }
        }catch(e){}
        return orig(sid, x, y, ms);
      };
      window.fadeToStage.__bdGuard = true;
    }catch(e){}
  }, 200);

  /* ── ② 최종 보스를 잡아야만 엔딩 ── */
  function bossCleared(){
    try{
      var pur = (window.BD && BD.purified) || {};
      // 보스 오브젝트의 실제 hazardId 로 판정
      var ids = [];
      Object.keys(STAGES || {}).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !st.objects) return;
        st.objects.forEach(function(o){
          if (o && o.isBoss && o.hazardId) ids.push(o.hazardId);
        });
      });
      if (!ids.length) ids = ['final_boss_1'];
      return ids.some(function(id){ return !!pur[id]; });
    }catch(e){ return false; }
  }
  window.BD_bossCleared = bossCleared;

  setInterval(function(){
    try{
      if (!(window.BD && BD.gameCleared)) return;
      if (bossCleared()) return;
      // 보스를 잡지 않았는데 클리어로 잡혀 있으면 되돌린다
      BD.gameCleared = false;
      try{ console.info('[v139] 최종 보스 미정화 — 엔딩 조건 해제'); }catch(e){}
    }catch(e){}
  }, 700);

  /* ── ③ 이미 끝낸 목표는 가리키지 않는다 ── */
  var w3 = setInterval(function(){
    try{
      if (typeof window.BD_currentGuide !== 'function' || window.BD_currentGuide.__bdClean) return;
      clearInterval(w3);
      var orig = window.BD_currentGuide;
      window.BD_currentGuide = function(){
        var g = null;
        try{ g = orig.apply(this, arguments); }catch(e){ return null; }
        try{
          if (!g || !g.t) return g;
          var o = g.t;
          // 이미 정화된 위험요소를 가리키면 안내를 끈다
          var hid = o.hazardId || null;
          if (hid && window.BD && BD.purified && BD.purified[hid]) return null;
          // 숨겨졌거나 잠긴 대상도 제외
          if (o.hidden) return null;
          if (typeof window.BD_hazardLocked === 'function' && o.interactable === 'hazard'){
            if (BD_hazardLocked(o)) return null;
          }
        }catch(e){}
        return g;
      };
      window.BD_currentGuide.__bdClean = true;
    }catch(e){}
  }, 200);
})();
