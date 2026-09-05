
/* (v362) F 무반응 전천후 자가치유 — 상세는 패치 주석 */
(function(){
  'use strict';
  function uiBusy(){
    try{
      if (window.HSR && HSR.active) return true;
      var d = document.getElementById('dialogue-box');
      if (d && d.getBoundingClientRect().height > 0) return true;
      if (window.__bdChoiceState && __bdChoiceState.open) return true;
      if (document.querySelector('.bd-modal.show')) return true;
      var so = document.getElementById('shop-overlay');
      if (so && getComputedStyle(so).display !== 'none') return true;
      if (window.__bdArcadeOpen || window.__bdGalagaOpen) return true;
      var mv = document.getElementById('bd-map-v342');
      if (mv && mv.classList.contains('show')) return true;
    }catch(e){}
    return false;
  }
  function nearHazard(){
    try{
      var st = STAGES[Number(currentStage)];
      if (!st) return null;
      var best = null;
      (st.objects || []).forEach(function(o){
        if (!o || o.interactable !== 'hazard' || !o.hazardId || o.isBoss) return;
        if (o.hidden || o.__bdGone) return;
        if (window.BD && BD.purified && BD.purified[o.hazardId]) return;
        try{ if (window.BD_hzQuestGate && BD_hzQuestGate(o)) return; }catch(eG){ return; }
        var L = (o.rx || 0) - 0.05, R = (o.rx || 0) + (o.rw || 0.04) + 0.05;
        var dy = heroY - ((o.ry || 0) + (o.rh || 0.05));
        if (heroX >= L && heroX <= R && dy >= -0.06 && dy < 0.22){
          var d2 = Math.abs(dy);
          if (!best || d2 < best.d){ best = { o: o, d: d2 }; }
        }
      });
      return best ? best.o : null;
    }catch(e){ return null; }
  }
  var pending = null;
  window.addEventListener('keydown', function(e){
    try{
      if ((e.key || '').toLowerCase() !== 'f') return;
      if (e.__bd362) return;                     /* 자가치유 재전송은 관찰 제외 */
      if (uiBusy()) return;
      if (pending) return;
      var hz = nearHazard();
      if (!hz) return;
      var hid = hz.hazardId;
      var attempt362 = function(n){
        pending = null;
        try{
          if (window.BD && BD.purified && BD.purified[hid]) return;
          try{ if (window.BD_hzQuestGate && BD_hzQuestGate(hz)) return; }catch(eG2){}
          if (uiBusy()){
            /* 일시적 잔여 UI(도주 나레이션 등) — 최대 3회까지 지연 재시도 */
            if (n < 3){ pending = setTimeout(function(){ attempt362(n + 1); }, 800); }
            return;
          }
          window.__bdDamiOpeningBusy = false;
          try{ console.info('[v362] F 무반응 감지 — 위험요소 직접 상호작용(' + hid + ')'); }catch(eL){}
          if (typeof window.BD_hazardInteract === 'function') BD_hazardInteract(hz);
        }catch(eT){}
      };
      pending = setTimeout(function(){ attempt362(0); }, 750);
    }catch(eW){}
  }, true);
})();
