
/* (v229) 문화의집 3층 엘리베이터 출구 — 존에 들어서면 광장으로 내려간다 */
(function(){
  var cool = 0;
  window.BD_addTick(function(){
    try{
      if (typeof currentStage === 'undefined' || currentStage !== 101) return;
      if (typeof transitioning !== 'undefined' && transitioning) return;
      if (Date.now() < cool) return;
      // (v67) 엘리베이터 판정 범위 확대 — 문 앞에서 미세하게 빗나가 작동하지 않던 문제
      if (heroX > 0.662 && heroX < 0.740 && heroY > 0.070 && heroY < 0.235){
        // (v232) 프롤로그 진행 중(수여식·가방 안내 전)엔 내려갈 수 없다.
        //  완료 판정은 광장 도착 시점이므로 '단계'로 판단해야 데드락이 없다:
        //  3단계(엘리베이터 안내)부터 통과 허용.
        var tutDone = false;
        try{ tutDone = localStorage.getItem('bd_tut2_done') === '1'; }catch(e){}
        // (v67) 배지를 이미 받았으면(건너뛰기·비정상 진행 포함) 무조건 통과 —
        //  기존엔 단계값(__bdTut2Step)이 3 미만이면 영구히 막혀 엘리베이터가 작동하지 않았다
        try{
          var _st = window.BD_PROGRESS && BD_PROGRESS.story;
          if (_st && ((_st.tutorialFlags && _st.tutorialFlags.badgeGiven) || _st.badgeAwakened)) tutDone = true;
        }catch(eB){}
        var step = (typeof window.__bdTut2Step === 'number') ? window.__bdTut2Step : 99;
        if (!tutDone && step >= 0 && step < 3){
          cool = Date.now() + 2500;
          try{ bdToast('\uC544\uC9C1 \uBB38\uD654\uC758\uC9D1 \uC120\uC0DD\uB2D8\uACFC \uC774\uC57C\uAE30\uAC00 \uB05D\uB098\uC9C0 \uC54A\uC558\uC5B4\uC694!'); }catch(e){}
          heroY = 0.225;   // 존 밖으로 살짝 밀어내기
          return;
        }
        cool = Date.now() + 3000;
        try{ bdToast('\uD83D\uDED7 \uC5D8\uB9AC\uBCA0\uC774\uD130\uB97C \uD0C0\uACE0 \uB0B4\uB824\uAC11\uB2C8\uB2E4\u2026'); }catch(e){}
        if (STAGES[212] && STAGES[212].__districtWorldV24) fadeToStage(212, 0.216, 0.336, 700);   // (v25통합) 1장 와우리 복합문화권 — 복합건물 정면
        else { /* (v395) 구 광장(stage 1) 폴백 제거 — 웹판은 에셋 로딩이 느려 신맵 준비 전에 이 분기를 밟았다. 212가 준비될 때까지 기다렸다 이동한다. */
      var __w95=setInterval(function(){ try{ if(STAGES[212]&&STAGES[212].__districtWorldV24){ clearInterval(__w95); fadeToStage(212,0.216,0.336,700);} }catch(e){} },300);
      setTimeout(function(){ try{ clearInterval(__w95); }catch(e){} },20000); }
      }
    }catch(e){}
  }, 250);
})();
