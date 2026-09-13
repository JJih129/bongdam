/* (v399e) 지도 채우기 안내 — 장 완료 = 그 리 안전지도 100%(위험요소 정화 + 시설 전부 방문, v287)인데
 *  위험요소를 다 치운 뒤에는 📍 화살표와 ❔ 마커만 남고 아무도 «왜 시설에 가야 하는지» 말해 주지 않았다.
 *  ① 현재 장의 리에서 위험요소·부탁이 모두 끝나고 시설이 남으면 담이가 한 번 설명한다(리마다 1회, 저장).
 *  ② 시설에 처음 들어갈 때마다 «와우리 시설 1/3» 배너로 남은 수를 보여 준다.
 *  기존 함수 재정의 없음. */
(function(){
  'use strict';
  var RID = { 212:'wawoo', 213:'sang', 211:'donghwa', 210:'suyeong' };
  var NM  = { 212:'와우리', 213:'상리', 211:'동화리', 210:'수영리' };
  var CHQ = { ch1:212, ch2:213, ch3:211, ch4:210 };
  function curChapterStage(){
    try{ var Q = window.QUESTS || window.BD_QUESTS; var q = Q && Q[BD.questIdx]; return q ? (CHQ[q.id] || null) : null; }catch(e){ return null; }
  }
  function busy(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.BD_isInputBlocked && BD_isInputBlocked()) return true;
      if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()) return true;
      var d = document.getElementById('dialogue-overlay'); if (d && d.offsetHeight) return true;
    }catch(e){}
    return false;
  }
  var lastVisit = {};
  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined' || !window.BD_MapProgress) return;
      var sid = Number(currentStage); var rid = RID[sid]; if (!rid) return;
      var mp = BD_MapProgress.region(rid); if (!mp || !mp.pur || !mp.req || !mp.visit) return;
      /* ② 방문 수 변화 배너 (같은 리에서 늘어났을 때만) */
      if (lastVisit[rid] != null && mp.visit.cur > lastVisit[rid] && mp.visit.max > 0){
        var left = mp.visit.max - mp.visit.cur;
        try{ bdToast('🗂 ' + NM[sid] + ' 시설 ' + mp.visit.cur + '/' + mp.visit.max + (left > 0 ? ' — 남은 곳 ' + left : ' — 다 들렀어요! 지도 ' + mp.pct + '%')); }catch(eT){}
      }
      lastVisit[rid] = mp.visit.cur;
      /* ① 위험요소·부탁 끝 + 시설 남음 → 담이 설명 1회 */
      if (curChapterStage() !== sid) return;
      if (mp.pur.cur < mp.pur.max || mp.req.cur < mp.req.max || mp.visit.cur >= mp.visit.max) return;
      var K = 'bd_mapfill_hint_' + rid;
      try{ if (localStorage.getItem(K) === '1') return; }catch(eK){}
      if (busy()) return;
      try{ localStorage.setItem(K, '1'); }catch(eS){}
      var left2 = mp.visit.max - mp.visit.cur;
      if (window.BD_DAMI && BD_DAMI.show) BD_DAMI.show('위험은 다 치웠어요! 이제 지도를 채울 차례예요 — 📍 화살표를 따라 시설에 들어가 보면 카드가 생겨요 (남은 곳 ' + left2 + ')', { face:'proud' });
    }catch(e){}
  }, 1200);
})();
