
/* (v35) 담이 첫 만남(각성~자기소개) 동안 화면을 어둡게 하고 담이 말풍선만 강조 */
(function(){
  'use strict';
  function el(){ var d = document.getElementById('bd-dami-dim');
    if(!d){ d = document.createElement('div'); d.id='bd-dami-dim'; document.body.appendChild(d); }
    return d; }
  var iv = setInterval(function(){
    try{
      var busy = !!window.__bdDamiIntroBusy;
      var hud = document.getElementById('bd-dami-hud');
      el().classList.toggle('show', busy);
      if (hud) hud.classList.toggle('bd-dami-glow', busy);
    }catch(e){}
  }, 200);
})();
