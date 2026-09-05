
/* (v85) 새 장소 발견 카드가 오래 떠 있어 조작·조사를 막던 문제
   — 표시 후 일정 시간이 지나면 자동으로 닫고, 여러 장이 밀려 있으면 순차 처리 */
(function(){
  'use strict';
  var since = 0;
  setInterval(function(){
    try{
      var c = document.getElementById('bd-place-card');
      if (!c || !c.offsetHeight){ since = 0; return; }
      if (!since){ since = Date.now(); return; }
      // (v109) 원본 의도는 "읽고 직접 닫는 안내 모달"이다.
      //  자동 닫기는 방치로 조작이 막히는 것을 막는 안전장치이므로 넉넉히 15초로 둔다.
      if (Date.now() - since < 15000) return;
      var btn = Array.from(c.querySelectorAll('button')).find(function(b){
        return /확인|닫기/.test(b.textContent||'');
      });
      if (btn) btn.click(); else c.style.display = 'none';
      since = 0;
    }catch(e){}
  }, 1000);
})();
