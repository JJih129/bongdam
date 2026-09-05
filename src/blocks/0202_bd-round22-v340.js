
/* (v340) 치명 방어 — 본문 주석은 패치 설명 참조 */
(function(){
  'use strict';
  /* ── ① 조사한다 감시견 ── */
  var wireHz = setInterval(function(){
    if (typeof window.BD_hazardInteract !== 'function' || window.BD_hazardInteract.__v340) return;
    clearInterval(wireHz);
    var o = window.BD_hazardInteract;
    window.BD_hazardInteract = function(obj){
      try{ if (obj && obj.hazardId) window.__bdLastHz = obj; }catch(e){}
      return o.apply(this, arguments);
    };
    window.BD_hazardInteract.__v340 = true;
  }, 300);
  setInterval(function(){
    try{
      var at = window.__bdInvestAt;
      if (!at) return;
      var dt = Date.now() - at;
      if (dt < 1500) return;
      if (dt > 8000){ window.__bdInvestAt = null; return; }
      if (window.HSR && HSR.active){ window.__bdInvestAt = null; return; }
      var db = document.getElementById('dialogue-box');
      if (db && db.getBoundingClientRect().height > 0) return;            /* 독백 진행 중 — 정상 */
      if (window.__bdChoiceState && __bdChoiceState.open) return;
      var hz = window.__bdLastHz;
      if (!hz || !hz.hazardId) { window.__bdInvestAt = null; return; }
      if (window.BD && BD.purified && BD.purified[hz.hazardId]) { window.__bdInvestAt = null; return; }
      window.__bdInvestAt = null;
      if (typeof window.startHazardBattle === 'function'){
        try{
          startHazardBattle(hz, hz.hazardFamily || 'pollute', hz.hazardId);
          console.info('[v340] 조사 확정 후 무반응 감지 — 전투 강제 시작(' + hz.hazardId + ')');
        }catch(eS){}
      }
    }catch(e){}
  }, 500);

  /* ── ② 인벤 표시 정규화 ── */
  var wireInv = setInterval(function(){
    if (typeof window.openInventory !== 'function' || window.openInventory.__v340) return;
    clearInterval(wireInv);
    var o2 = window.openInventory;
    window.openInventory = function(){
      var r = o2.apply(this, arguments);
      try{
        var ov = document.getElementById('inv-overlay');
        if (ov){
          ov.style.removeProperty('opacity');
          ov.style.removeProperty('visibility');
          ov.style.removeProperty('transform');
          ov.classList.add('open');
          var p = ov.firstElementChild;
          if (p){ p.style.removeProperty('opacity'); p.style.removeProperty('visibility'); p.style.removeProperty('transform'); }
        }
      }catch(e){}
      return r;
    };
    window.openInventory.__v340 = true;
  }, 300);
})();
