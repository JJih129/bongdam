
/* (v75) 지역 순차 개방 + 메인 퀘스트 목표를 '그 리의 모든 주민 의뢰'로
   · 진행 중인 장의 리에서만 부탁 수락·정화 가능 (와우리 → 상리 → 동화리 → 수영리)
   · 각 장의 목표 수를 그 리에 실제 배치된 위험요소 수에 맞춰 자동 설정 */
(function(){
  'use strict';
  var CH_STAGE = { prologue:212, ch1:212, ch2:213, ch3:211, ch4:210, final:212 };
  var NAMES = { 212:'와우리', 213:'상리', 211:'동화리', 210:'수영리' };

  function quests(){ return window.QUESTS || window.BD_QUESTS || null; }
  function curQuestId(){
    try{ var Q = quests(); if (!Q) return null; var q = Q[BD.questIdx]; return q && q.id; }catch(e){ return null; }
  }
  window.BD_allowedStage = function(){
    var id = curQuestId();
    if (!id) return null;
    return CH_STAGE[id] || null;
  };
  /* 진행 중인 리인지 — 그 외 리의 부탁·정화는 잠근다 */
  window.BD_regionLocked = function(sid){
    try{
      var allow = BD_allowedStage();
      if (allow == null) return false;
      var id = curQuestId();
      if (id === 'final') return false;         // 최종장은 전 지역 자유
      if (Number(sid) === Number(allow)) return false;   // 현재 장의 리 — 열림

      // (v116) 이미 지나온 리는 계속 열어 둔다.
      //  다음 장으로 넘어갔다고 이전 동네에 남은 위험요소까지 잠기면
      //  "아직 할 게 남았는데 손댈 수 없는" 상태가 된다. 앞으로 갈 리만 잠근다.
      try{
        var ORDER = ['prologue','ch1','ch2','ch3','ch4','final'];
        var cur = ORDER.indexOf(id);
        // (v118) 같은 맵을 여러 장이 쓴다(212 = prologue·ch1·final).
        //  '지나온 리'인지 보려면 그 맵이 처음 등장한 장(가장 이른 것)을 기준으로 해야 한다.
        //  뒤쪽(final) 기준으로 잡으면 와우리가 끝까지 잠겨 남은 위험요소를 못 푼다.
        var here = 99;
        Object.keys(CH_STAGE).forEach(function(q){
          if (q === 'final') return;            // 최종장은 기준에서 제외
          if (Number(CH_STAGE[q]) === Number(sid)){
            var k = ORDER.indexOf(q);
            if (k >= 0 && k < here) here = k;   // 가장 이른 장 기준
          }
        });
        if (here === 99) here = -1;
        if (cur >= 0 && here >= 0 && here < cur) return false;   // 지나온 리 → 열림
      }catch(eP){}
      return true;
    }catch(e){ return false; }
  };
  window.BD_regionName = function(sid){ return NAMES[Number(sid)] || '이 지역'; };

  /* 각 장의 목표 수 = 그 리의 (보스 제외) 위험요소 수 */
  function syncNeeds(){
    try{
      var Q = quests(); if (!Q || typeof STAGES === 'undefined') return;
      Object.keys(CH_STAGE).forEach(function(qid){
        if (qid === 'prologue' || qid === 'final') return;
        var sid = CH_STAGE[qid];
        var st = STAGES[sid]; if (!st) return;
        // (v87) 실제로 '부탁으로 배정된' 위험요소만 목표로 센다 —
        //  주민 수보다 위험요소가 많으면 배정 못 받은 것이 남아 장이 영원히 안 끝나던 문제
        // (v105b) 목표 수는 '부탁으로 배정된 수'로만 잡는다.
        //  하즈 총수로 폴백하면 주민이 줄어든 뒤에도 옛 숫자가 남아 목표가 3↔2로 흔들렸다.
        /* (v287) 장 목표 = 그 리 안전지도 채우기 (정화 + 시설 방문, %) */
        var q = Q.find(function(x){ return x && x.id === qid; });
        if (q && q.objectives && q.objectives[0]){
          if (q.objectives[0].need !== 100) q.objectives[0].need = 100;
          var want = NAMES[sid] + ' 안전지도 채우기 (M 지도)';
          if (q.objectives[0].t !== want) q.objectives[0].t = want;
          try{
            var __RID = { 212:'wawoo', 213:'sang', 211:'donghwa', 210:'suyeong' }[sid];
            var __mp = window.BD_MapProgress ? BD_MapProgress.region(__RID) : null;
            if (__mp && q.objectives[0].cur < 100){
              var __cur = Math.min(__mp.pct, 99);
              if (q.objectives[0].cur !== __cur) q.objectives[0].cur = __cur;
            }
          }catch(eMP2){}
        }
      });
    }catch(e){}
  }
  window.BD_syncQuestNeeds = syncNeeds;   // (v282) 로드 직후 즉시 동기화용
  setInterval(syncNeeds, 1500);
  setTimeout(syncNeeds, 2500);
})();
