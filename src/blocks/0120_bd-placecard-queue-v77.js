
/* (v77) 장소 발견 카드 큐잉 — 대사창·컷신·전투가 진행 중일 때는 카드를 띄우지 않고
   끝난 뒤 순서대로 보여 준다. (대사 위에 카드가 겹쳐 뜨고 F 입력까지 가로채던 문제) */
(function(){
  'use strict';
  var Q = [];
  function busy(){
    try{
      var db = document.getElementById('dialogue-box');
      if (db && db.offsetHeight && parseFloat(getComputedStyle(db).opacity) > 0.05) return true;
      if (window.__bdSceneActive) return true;
      if (window.HSR && HSR.active) return true;
      var bo = document.getElementById('bd-badge-ov');
      if (bo && bo.offsetHeight && bo.style.display !== 'none') return true;
      if (document.getElementById('bd-place-card')) return true;   // 이미 카드가 떠 있으면 대기
      if (window.__bdDamiOpeningBusy || window.__bdDamiIntroBusy) return true;
    }catch(e){}
    return false;
  }
  var tries = 0;
  var boot = setInterval(function(){
    tries++;
    if (typeof window.BD_showPlaceCard === 'function' && !window.BD_showPlaceCard.__v77){
      var orig = window.BD_showPlaceCard;
      var wrapped = function(facilityId, opt){
        if (busy()){
          if (!Q.some(function(q){ return q.id === facilityId; })) Q.push({ id: facilityId, opt: opt });
          return true;
        }
        return orig.call(window, facilityId, opt);
      };
      wrapped.__v77 = true;
      wrapped.__orig = orig;
      window.BD_showPlaceCard = wrapped;
      clearInterval(boot);
    }
    if (tries > 400) clearInterval(boot);
  }, 250);
  setInterval(function(){
    if (!Q.length || busy()) return;
    var item = Q.shift();
    try{
      var fn = window.BD_showPlaceCard && window.BD_showPlaceCard.__orig;
      if (fn) fn.call(window, item.id, item.opt);
    }catch(e){}
  }, 600);
  window.BD_placeCardQueue = Q;
})();
