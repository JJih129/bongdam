
/* (v381) 레거시 스테이지 런타임 정리 — 베이크에서 제거된 구 광장(2~5)·구 시안(201~209)을
   런타임 생성 코드(0095 등)가 되살려도 부팅 후 일괄 삭제한다. 스테이지 1은 스텁(진입 불가). */
(function(){
  'use strict';
  /* 202~208 은 구 오픈월드 런타임(0097)이 600ms 마다 재등록 — 배경 이미지는 제거(null)돼 수 KB 스텁이며 진입 경로가 없어 용인.
     여기서는 확실히 죽는 베이크 전용 스테이지만 정리한다. */
  var DEAD = [2,3,4,5,201,209];
  function purge(){
    try{
      if (typeof STAGES === 'undefined') return 0;
      var n = 0;
      DEAD.forEach(function(id){ if (STAGES[id]){ delete STAGES[id]; n++; } if (STAGES[String(id)]){ delete STAGES[String(id)]; n++; } });
      return n;
    }catch(e){ return 0; }
  }
  /* 0097(구 오픈월드)이 수 초 뒤 지연 생성으로 202~208 을 되살린다 — 상시 감시(2초, 비용 미미) */
  setInterval(purge, 2000);
  purge();
})();
