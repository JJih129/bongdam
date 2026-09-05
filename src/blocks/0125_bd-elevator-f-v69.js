
/* (v69) 엘리베이터 탑승 이중화 — 존에 정확히 들어가야만 작동하던 것을
   문 앞에서 F를 눌러도 탑승되도록 보강 (존 진입이 빗나가 '작동 안 함/벽에 낌'으로 느껴지던 문제) */
(function(){
  'use strict';
  function canRide(){
    try{
      var st = window.BD_PROGRESS && BD_PROGRESS.story;
      if (st && ((st.tutorialFlags && st.tutorialFlags.badgeGiven) || st.badgeAwakened)) return true;
      if (localStorage.getItem('bd_tut2_done') === '1') return true;
      var step = (typeof window.__bdTut2Step === 'number') ? window.__bdTut2Step : 99;
      return step >= 3;
    }catch(e){ return true; }
  }
  function nearDoor(){
    try{
      return Number(currentStage) === 101 &&
             heroX > 0.650 && heroX < 0.752 && heroY > 0.060 && heroY < 0.300;
    }catch(e){ return false; }
  }
  document.addEventListener('keydown', function(e){
    if (e.key !== 'f' && e.key !== 'F') return;
    try{
      if (window.HSR && HSR.active) return;
      var d = document.getElementById('dialogue-overlay');
      if (d && d.offsetHeight) return;
      if (typeof transitioning !== 'undefined' && transitioning) return;
      if (!nearDoor()) return;
      if (!canRide()){
        try{ bdToast('아직 문화의집 선생님과 이야기가 끝나지 않았어요!'); }catch(e2){}
        return;
      }
      e.preventDefault(); e.stopPropagation();
      try{ bdToast('🛗 엘리베이터를 타고 내려갑니다…'); }catch(e3){}
      if (STAGES[212]) fadeToStage(212, 0.216, 0.336, 700);   // (v69) 신맵이 있으면 항상 와우리로
      else { /* (v395) 구 광장(stage 1) 폴백 제거 — 웹판은 에셋 로딩이 느려 신맵 준비 전에 이 분기를 밟았다. 212가 준비될 때까지 기다렸다 이동한다. */
      var __w95=setInterval(function(){ try{ if(STAGES[212]&&STAGES[212].__districtWorldV24){ clearInterval(__w95); fadeToStage(212,0.216,0.336,700);} }catch(e){} },300);
      setTimeout(function(){ try{ clearInterval(__w95); }catch(e){} },20000); }
    }catch(err){}
  }, true);
})();
