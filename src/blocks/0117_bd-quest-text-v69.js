
/* (v69) 퀘스트 텍스트·목록 정합
   ① 메인 목표 문구가 "위험 요소 정화"로만 돼 있어, 부탁을 받아야 정화할 수 있는 현재 흐름과 어긋남
      → "주민들의 부탁 해결"로 표기 (진행 카운트 방식은 그대로)
   ② 구 서브퀘(임현지·정도현·서연·하늘·준호·영자·순임)가 임무창 목록에 남아 있던 문제 → 목록에서 제외
   ③ 구 안내 문구 정리: '동네 슈퍼' → 실제 가게 이름, '일일 퀘스트는 사서 도현에게' 문구 제거 */
(function(){
  'use strict';
  var LEGACY_SUB = ['npc_hyunji','npc_dohyun','npc_seoyeon','npc_haneul','npc_junho','npc_yeongja','npc_sunim'];

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
  var LEGACY_TITLES = ['임현지의 부탁','정도현의 부탁','서연의 부탁','하늘의 부탁','준호의 부탁','영자씨의 부탁','순임 할머니의 부탁'];
  function hideLegacySubs(){
    try{
      var S = window.BD_SUB_QUESTS;
      if (Array.isArray(S)) S.forEach(function(q){
        if (q && LEGACY_SUB.indexOf(q.id) >= 0){ q.__hidden = true; q.hidden = true; q.accepted = false; }
      });
    }catch(e){}
    // 임무창 UI에서도 제거 — 목록 렌더가 배열을 그대로 훑기 때문에 표시 단계에서 한 번 더 거른다
    try{
      document.querySelectorAll('#bd-quest-hud, #quest-modal, .bd-quest-list, body').forEach(function(root){
        if (!root) return;
        root.querySelectorAll('div,li').forEach(function(el){
          if (el.__bdLegacyChecked) return;
          var t = (el.textContent||'').trim();
          if (t.length > 40) return;
          for (var i=0;i<LEGACY_TITLES.length;i++){
            if (t.indexOf(LEGACY_TITLES[i]) === 0){
              var box = el.closest('li') || el.parentElement || el;
              box.style.display = 'none'; el.__bdLegacyChecked = true; break;
            }
          }
        });
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
            if (/사서 도현/.test(s)){ changed = true; return s.replace(/사서 도현/g, '사서 도현'); }
            return s;
          });
          if (changed) o.__bdInfoV69 = true;
        });
      });
    }catch(e){}
  }
  setTimeout(function(){ fixMain(); hideLegacySubs(); fixInfoLines(); }, 1800);
  setInterval(function(){ hideLegacySubs(); fixInfoLines(); }, 3000);
})();
