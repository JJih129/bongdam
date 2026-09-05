
/* (v137) 전투 튜토리얼에서 담이 대사가 안 나오던 문제
   ────────────────────────────────────────────────────────────
   담이는 «배지 수여식» 전까지 잠들어 있고(AWAKE=false), 그 상태에서는
   BD_DAMI.show() 가 첫 줄에서 그냥 반환된다(설계 의도).
   그런데 전투 튜토리얼은 담이가 말해야 성립하므로,
   담이가 말을 해야 하는 시점에는 잠들어 있으면 깨워 준다.
   (배지를 아직 못 받은 진짜 초반에는 튜토 자체가 시작되지 않으므로 안전) */
(function(){
  'use strict';
  function wake(){
    try{
      /* 타이틀에서 show()가 거절된 경우에는 HUD를 깨우거나 잠깐 노출하지 않는다. */
      if (window.BD_DAMI && typeof BD_DAMI.isGameplayVisible === 'function' && !BD_DAMI.isGameplayVisible()) return;
      /* (v287) 수여식 연출이 끝나기 전에는 깨우지 않는다 — 프롤로그 순서 보증 */
      if (!window.__bdCeremonyDone && localStorage.getItem('bd_dami_awake') !== '1') return;
      localStorage.setItem('bd_dami_awake', '1');
      if (window.BD_DAMI && typeof BD_DAMI.awaken === 'function'){ BD_DAMI.awaken(); return; }
      var h = document.getElementById('bd-dami-hud');
      if (h) h.style.display = '';
    }catch(e){}
  }

  /* 튜토리얼이 돌기 시작하면 담이를 깨운다 */
  var n = 0;
  var iv = setInterval(function(){
    n++;
    try{
      if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()){
        if (localStorage.getItem('bd_dami_awake') !== '1') wake();
      }
      // 전투 중 담이가 말해야 하는데 잠들어 있으면 깨운다
      if (window.HSR && HSR.active && localStorage.getItem('bd_dami_awake') !== '1'){
        if (localStorage.getItem('bd_battle_tutorial_done') !== '1') wake();
      }
    }catch(e){}
    if (n > 4000) clearInterval(iv);
  }, 500);

  /* show() 가 잠듦 때문에 무시되면 깨우고 한 번 더 시도 */
  var w = setInterval(function(){
    if (!(window.BD_DAMI && BD_DAMI.show)) return;
    clearInterval(w);
    var orig = BD_DAMI.show.bind(BD_DAMI);
    BD_DAMI.show = function(text, opts){
      var r = orig(text, opts);
      try{
        var inGame = !(BD_DAMI.isGameplayVisible && !BD_DAMI.isGameplayVisible());
        if (r === false && inGame && !(opts && opts.once)){
          wake();
          return orig(text, opts);
        }
      }catch(e){}
      return r;
    };
  }, 200);
})();
