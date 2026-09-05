
/* (v355) 모바일 HUD 자동 배율 — 상세는 패치 주석 */
(function(){
  'use strict';
  function factor(){
    var w = window.innerWidth || 1280;
    if (w <= 420) return 1.45;
    if (w <= 600) return 1.35;
    if (w <= 900) return 1.2;
    return 1;
  }
  function active(){
    try{
      if (!document.documentElement.classList.contains('bd-touch-mode')) return false;
      var v = localStorage.getItem('bd_ui_scale_v353') || 'auto';
      if (v !== 'auto') return false;   /* 수동 배율 선택 시엔 개입하지 않음 */
      return true;
    }catch(e){ return false; }
  }
  function apply(){
    var f = active() ? factor() : 1;
    var damiF = Math.min(f, 1.15);      /* 담이 HUD는 이미 2배 확대 상태 */
    /* (v390) bd-menu-btns 는 0254 메뉴줄 단일 관리자가 담당 */
    [['bd-quest-hud', f], ['bd-track-chip', f], ['bd-dami-hud', damiF]]
      .forEach(function(p){
        try{
          var el = document.getElementById(p[0]);
          if (!el) return;
          var z = (p[1] === 1) ? '' : String(p[1]);
          if (el.style.zoom !== z) el.style.zoom = z;
        }catch(e){}
      });
  }
  window.addEventListener('resize', apply);
  setInterval(apply, 2000);             /* 늦게 생성되는 요소 대비 */
  var boot = setInterval(function(){ if (document.body){ clearInterval(boot); apply(); } }, 300);
})();
