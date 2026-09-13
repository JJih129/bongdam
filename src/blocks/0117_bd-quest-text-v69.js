
/* (v69) 퀘스트 텍스트·목록 정합
   ① 메인 목표 문구가 "위험 요소 정화"로만 돼 있어, 부탁을 받아야 정화할 수 있는 현재 흐름과 어긋남
      → "주민들의 부탁 해결"로 표기 (진행 카운트 방식은 그대로)
   ② (v399e 삭제) 구 서브퀘 숨김 — 원본 데이터를 지워 불필요
   ③ 구 안내 문구 정리: '동네 슈퍼' → 실제 가게 이름, '일일 퀘스트는 사서 도현에게' 문구 제거 */
(function(){
  'use strict';
  /* (v399e) 구 서브퀘 숨김(hideLegacySubs) 제거 — NPC_QUESTS 의 구 7건이 소스에서 삭제돼 대상이 없다 */

  function fixMain(){
    try{
      var QUESTS = window.BD_QUESTS || (typeof window.QUESTS !== 'undefined' ? window.QUESTS : null);
      if (!Array.isArray(QUESTS)) return;
      QUESTS.forEach(function(q){
        if (!q || !q.objectives || !q.objectives[0]) return;
        var o = q.objectives[0];
        if (o.t === '위험 요소 정화'){
          o.t = '주민들의 부탁 해결';
          if (q.desc) q.desc = q.desc.replace(/위험 요소를 정화/g, '주민의 부탁을 받아 위험 요소를 정화');
        }
      });
    }catch(e){}
  }
  function fixInfoLines(){
    try{
      if (typeof STAGES === 'undefined') return;
      Object.keys(STAGES).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o){
          if (!o || !Array.isArray(o.infoLines) || o.__bdInfoV69) return;
          var changed = false;
          o.infoLines = o.infoLines.map(function(t){
            var s = String(t);
            if (/일일 퀘스트/.test(s)){ changed = true; return '조용히 책을 읽거나 공부하기 좋은 곳이야.'; }
            if (/동네 슈퍼/.test(s)){ changed = true; return s.replace(/동네 슈퍼/g, '가까운 가게'); }
            return s;
          });
          if (changed) o.__bdInfoV69 = true;
        });
      });
    }catch(e){}
  }
  setTimeout(function(){ fixMain(); fixInfoLines(); }, 1800);
  setInterval(function(){ fixInfoLines(); }, 3000);
})();
