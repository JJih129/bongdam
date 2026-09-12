
/* (v366) 대사 우선순위 — 상호작용 시작 시 오프닝 시퀀스 폐기 */
(function(){
  'use strict';
  function interacting(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.__bdChoiceState && __bdChoiceState.open) return true;
      var d = document.getElementById('dialogue-box');
      if (d && d.getBoundingClientRect().height > 0) return true;
    }catch(e){}
    return false;
  }
  setInterval(function(){
    try{
      if (window.__bdDamiOpeningBusy && interacting()){
        window.__bdDamiCancelLines = true;
        try{ console.info('[v366] 상호작용 시작 — 오프닝 잔여 대사 폐기'); }catch(eL){}
      }
    }catch(e){}
  }, 300);
  /* 위험요소 상호작용은 즉시 폐기 — (v399) 0271 체인으로 이관 */
})();
