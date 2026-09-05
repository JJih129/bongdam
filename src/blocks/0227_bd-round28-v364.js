
/* (v364) 물러나기 수복 — 상세는 패치 주석 */
(function(){
  'use strict';
  function canFlee(){
    return !!(window.HSR && HSR.active && (HSR.state === 'player' || HSR.state === 'gauge'));
  }
  window.addEventListener('keydown', function(e){
    try{
      if ((e.key || '') !== 'Escape') return;
      if (!canFlee()) return;
      /* 미니게임·메뉴가 떠 있으면 기존 ESC 처리에 양보 */
      if (document.getElementById('bd-mg-light')) return;
      if (document.getElementById('hsr-skill-menu')) return;
      var d = document.getElementById('dialogue-box');
      if (d && d.getBoundingClientRect().height > 0) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (window.BD_onFlee) BD_onFlee();
    }catch(err){}
  }, true);
  /* bd364delegate — 버튼 재생성 레이스 없는 위임 클릭 */
  document.addEventListener('click', function(e){
    try{
      var b = e.target && e.target.closest && e.target.closest('.hsr-act.hsr-flee');
      if (!b) return;
      try{ console.info('[v364] flee 클릭 감지 state=' + (window.HSR ? HSR.state : '?')); }catch(eL){}
      if (canFlee() && window.BD_onFlee){ BD_onFlee(); return; }
      /* fleeQueued364 — 전투 개시 직후(idle 등) 클릭은 행동 가능 시점에 자동 실행 */
      if (window.HSR && HSR.active && !window.__bdFleeQ){
        window.__bdFleeQ = setInterval(function(){
          try{
            if (!(window.HSR && HSR.active)){ clearInterval(window.__bdFleeQ); window.__bdFleeQ = null; return; }
            if (canFlee()){ clearInterval(window.__bdFleeQ); window.__bdFleeQ = null; if (window.BD_onFlee) BD_onFlee(); }
          }catch(e2){ clearInterval(window.__bdFleeQ); window.__bdFleeQ = null; }
        }, 300);
      }
    }catch(err){}
  }, true);
  setInterval(function(){
    try{
      if (!(window.HSR && HSR.active)) return;
      var b = document.querySelector('.hsr-act.hsr-flee');
      if (b && !b.__bd364){
        b.__bd364 = true;
        b.addEventListener('click', function(){
          try{ if (canFlee() && window.BD_onFlee) BD_onFlee(); }catch(e){}
        });
      }
    }catch(e){}
  }, 800);
})();
