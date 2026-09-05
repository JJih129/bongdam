
/* (v375) 조사 선택창 ↔ 전투 이중 진입 차단
   제보: 위험요소 앞에서 F를 빠르게 연타하면 «조사한다» 독백이 끝나고 전투가 뜨기 직전(≈260ms) F가 한 번 더 들어가
         선택창이 다시 열리고, 그 창이 전투 화면(z 100030) 위에 남아 한 번 더 확정하면 전투가 이중으로 시작됐다.
   수정: ① 「조사한다」를 고른 뒤 전투가 시작될 때까지(최대 6초)·전투 중에는 BD_hazardInteract 를 무시
        ② 전투가 시작되면 열려 있는 선택창을 즉시 닫는다 (200ms 감시) */
(function(){
  'use strict';
  function wrap(){
    var f = window.BD_hazardInteract;
    if (typeof f !== 'function' || f.__v375) return false;
    var orig = f;
    window.BD_hazardInteract = function(obj){
      try{
        if (window.HSR && HSR.active) return true;                                        /* 전투 중 — 무시 */
        var t = Number(window.__bdInvestAt || 0);
        if (t && Date.now() - t < 6000 && !(window.HSR && HSR.active)){
          /* 조사 확정 뒤 전투 대기 중 — 독백(VN)이 떠 있으면 키는 대사 넘김으로 쓰이므로 여기까지 오지 않고,
             독백이 끝난 직후의 틈에서만 도달한다 → 무시 */
          return true;
        }
      }catch(e){}
      return orig.apply(this, arguments);
    };
    window.BD_hazardInteract.__v375 = true;
    return true;
  }
  wrap();
  var iv = setInterval(function(){ if (wrap()) clearInterval(iv); }, 300);

  /* 전투 시작 시 선택창 정리 + 전투가 실제로 시작되면 투자 타임스탬프 해제 */
  var wasBattle = false;
  setInterval(function(){
    try{
      var inb = !!(window.HSR && HSR.active);
      if (inb && !wasBattle){
        try{ if (window.__bdChoiceState && __bdChoiceState.open && typeof window.BD_choiceClose === 'function') BD_choiceClose(); }catch(e1){}
        try{ var c = document.getElementById('bd-choice'); if (c) c.classList.remove('show'); }catch(e2){}
        try{ window.__bdInvestAt = 0; }catch(e3){}
      }
      wasBattle = inb;
    }catch(e){}
  }, 200);
})();

/* (v375) 엔딩 보증 — 최종장 완료 후 엔딩 화면(showEnding)이 호출되지 않거나 끊기면 4초 조용할 때 1회 직접 연다.
   엔딩이 표시된 뒤에야 «안전 지도 기록» 리포트(0154)가 뜬다. */
(function(){
  'use strict';
  function wrapEnding(){
    if (typeof window.BD_showEnding !== 'function' || window.BD_showEnding.__v375) return;
    var o = window.BD_showEnding;
    window.BD_showEnding = function(){ window.__bdEndingShown = true; return o.apply(this, arguments); };
    window.BD_showEnding.__v375 = true;
  }
  var quiet = 0;
  setInterval(function(){
    try{
      wrapEnding();
      if (!(window.BD && BD.gameCleared) || window.__bdEndingShown) return;
      var em = document.getElementById('bd-ending-modal');
      if (em && em.classList.contains('show')){ window.__bdEndingShown = true; return; }
      if (window.__bdSceneActive || (window.HSR && HSR.active)){ quiet = 0; return; }
      var b = document.getElementById('dialogue-box');
      if (b && b.getBoundingClientRect().height > 0){ quiet = 0; return; }
      if (document.querySelector('.bd-modal.show')){ quiet = 0; return; }
      if (!quiet){ quiet = Date.now(); return; }
      if (Date.now() - quiet < 4000) return;
      quiet = 0;
      try{ console.info('[v375] 엔딩 화면 보증 호출'); }catch(e){}
      if (typeof window.BD_showEnding === 'function') window.BD_showEnding();
    }catch(e){}
  }, 500);
})();

/* (v375) 클리어 후 길안내 종료 — 엔딩 뒤에도 «이야기 듣기»(주민) 화살표가 남던 문제. 지도에서 직접 고른 추적만 허용 */
(function(){
  'use strict';
  function wrapGuide(){
    if (typeof window.BD_currentGuide !== 'function' || window.BD_currentGuide.__v375) return;
    var o = window.BD_currentGuide;
    window.BD_currentGuide = function(){ try{ if (window.BD && BD.gameCleared) return null; }catch(e){} return o.apply(this, arguments); };
    window.BD_currentGuide.__v375 = true;
  }
  setInterval(function(){
    try{
      wrapGuide();
      if (!(window.BD && BD.gameCleared)) return;
      var cur = window.__bdNavOverride;
      if (cur && !cur.__mapTrack && !cur.__rest) window.__bdNavOverride = null;
      window.__bdStoryTargetNpc = null;
    }catch(e){}
  }, 700);
})();
