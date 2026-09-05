
/* (v350) 담이 오프닝 busy 고착 감시견 — 상세는 패치 주석 */
(function(){
  'use strict';
  var quiet = 0;
  setInterval(function(){
    try{
      if (!window.__bdDamiOpeningBusy){ quiet = 0; return; }
      var bb = document.getElementById('bd-dami-bubble');
      var talking = !!(bb && bb.classList.contains('on'));
      var d = document.getElementById('dialogue-box');
      var dlg = !!(d && d.getBoundingClientRect().height > 0);
      if (talking || dlg){ quiet = 0; return; }
      quiet++;
      if (quiet >= 4){
        window.__bdDamiOpeningBusy = false;
        quiet = 0;
        try{ console.info('[v350] 담이 오프닝 busy 고착 감지 — 강제 해제'); }catch(e2){}
      }
    }catch(e){}
  }, 2000);
})();
