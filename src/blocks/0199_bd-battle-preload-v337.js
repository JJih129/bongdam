
/* (v337 최적화) 전투 진입 히치 제거 — 등록 에셋 슬롯(전투 일러스트·초상 등)을 유휴 시간에 분산 프리디코드 */
(function(){
  'use strict';
  var wired = false;
  var iv = setInterval(function(){
    if (wired || !(window.BD_ASSETS && BD_ASSETS.image)) return;
    wired = true; clearInterval(iv);
    setTimeout(function(){
      var keys = [];
      try{ keys = (BD_ASSETS.slots && BD_ASSETS.slots()) || []; }catch(e){}
      if (!keys.length) keys = ['hero.battle', 'enemy.boss', 'ui.badge'];
      keys.forEach(function(k, i){
        setTimeout(function(){
          try{
            var im = BD_ASSETS.image(k) || BD_ASSETS.image(k);   /* 1회차 호출로 생성, 2회차로 획득 */
            var u = BD_ASSETS.get && BD_ASSETS.get(k);
            if (!im && u){ im = new Image(); im.src = u; }
            if (im && im.decode) im.decode().catch(function(){});
          }catch(e){}
        }, i * 150);   /* 한 프레임에 몰리지 않게 분산 */
      });
    }, 3000);   /* 부팅 혼잡 회피 */
  }, 600);
})();
