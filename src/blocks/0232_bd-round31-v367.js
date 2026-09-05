
/* (v367) 프롤로그 중 일시정지 «구조 요청» 숨김 — 생성 시점 차단(v367b)이 원천 해결, 이 감시자는 보조 안전장치이다 */
(function(){
  'use strict';
  /* (v369) 전투 중 스포트라이트 z 복원은 css(body.bd-battle-on — 전투 엔진 0050 이 토글)로 처리 */
  setInterval(function(){
    try{
      if (!(window.BD && (BD.questIdx || 0) === 0)) return;
      var m = document.querySelector('.bd-modal.show');
      if (!m) return;
      var b = [...m.querySelectorAll('button')].find(function(x){ return /구조 요청/.test(x.textContent || ''); });
      if (b && b.style.display !== 'none') b.style.display = 'none';
    }catch(e){}
  }, 700);
})();
