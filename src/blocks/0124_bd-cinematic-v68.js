
(function(){
  'use strict';
  function on(){
    try{
      var ov = document.getElementById('bd-badge-ov');
      var boss = document.getElementById('bd-boss-dlg');
      var cine = (ov && ov.offsetHeight) || (boss && boss.classList.contains('on'));
      document.body.classList.toggle('bd-cinematic', !!cine);
    }catch(e){}
  }
  setInterval(on, 300);
})();
