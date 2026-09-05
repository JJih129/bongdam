
/* (v344) 최종보스 LD 에셋 교체 — 상세는 패치 주석 */
(function(){
  'use strict';
  var URL = "data:image/webp;base64,@@B64:8c3c8d8b_URL.webp@@";
  /* ① 전투 슬롯 + 필드 스프라이트 등록 (BD_ASSETS 준비 대기) */
  var wire = setInterval(function(){
    try{
      if (!window.BD_ASSETS || typeof BD_ASSETS.set !== 'function') return;
      BD_ASSETS.set('enemy.final_boss', URL);
      BD_ASSETS.set('field.hazard.final_boss', URL);
      clearInterval(wire);
    }catch(e){}
  }, 400);
  /* ② 직접 호출 경로 대체 */
  window.makeBossSprite = function(){ return URL; };
  /* ③ 보스전 중 구 그림으로 되돌아가는 폐쇄영역 갱신 경로 방어 */
  setInterval(function(){
    try{
      if (!window.HSR || !HSR.active || !HSR._isBoss) return;
      var sp = document.getElementById('hsr-enemy-sprite');
      if (!sp) return;
      var img = sp.querySelector('img');
      var want = (window.__bdBossPhase === 1 && window.__BD_BOSS_P1) ? window.__BD_BOSS_P1 : URL;
      if (img && img.src !== want) img.src = want;
    }catch(e){}
  }, 600);
})();
