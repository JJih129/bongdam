
(function(){
  'use strict';
  var IDS = ['inv-overlay','shop-overlay','quest-overlay','notebook-overlay','place-overlay',
             'safety-map-overlay','equip-overlay','bag-overlay','bd-inventory',
             'bd-map-v342','bd-codex','bd-report'];   /* (v379) 안전지도·안전수첩·리포트도 패널로 취급 */
  function onScreen(e){
    try{
      if (!e) return false;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      var r = e.getBoundingClientRect();
      return r.width > 200 && r.height > 200;
    }catch(err){ return false; }
  }
  setInterval(function(){
    try{
      var open = IDS.some(function(id){ return onScreen(document.getElementById(id)); })
              || !!document.querySelector('.bd-modal.show');
      document.body.classList.toggle('bd-panel-open', open);
    }catch(e){}
  }, 200);
})();
