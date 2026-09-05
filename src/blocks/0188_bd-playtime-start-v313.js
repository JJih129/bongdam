
/* (v313) 리포트 플레이 시간 — 새로 시작 시점에 기록 (리포트 열람 때 늦게 초기화되던 문제) */
(function(){
  'use strict';
  function stamp(){ try{ localStorage.setItem('bd_play_started', String(Date.now())); }catch(e){} }
  var tries = 0;
  var boot = setInterval(function(){
    tries++;
    try{
      if (typeof window.BD_confirmStartSetup === 'function' && !window.BD_confirmStartSetup.__v313){
        var orig = window.BD_confirmStartSetup;
        window.BD_confirmStartSetup = function(){ stamp(); return orig.apply(this, arguments); };
        window.BD_confirmStartSetup.__v313 = true;
        clearInterval(boot);
      }
    }catch(e){}
    if (tries > 200) clearInterval(boot);
  }, 300);
  /* 이어하기 세션 보강: 키가 없으면 게임 화면 진입 시점에 기록 */
  var fb = setInterval(function(){
    try{
      if (localStorage.getItem('bd_play_started')) { clearInterval(fb); return; }
      var gs = document.getElementById('game-screen');
      if (gs && gs.style.display === 'block'){ stamp(); clearInterval(fb); }
    }catch(e){}
  }, 1000);
})();
