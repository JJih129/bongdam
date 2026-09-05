
(function(){
  'use strict';

  /* 에디터 열림 상태를 body 클래스로 노출 (위 CSS 조건용) */
  setInterval(function(){
    try{
      var els = document.querySelectorAll('#bge-tool-select, #bge-zoom-in, #bge-tab-hierarchy');
      var on = false;
      for (var i = 0; i < els.length; i++){
        var r = els[i].getBoundingClientRect();
        if (r.width > 2 && r.height > 2){ on = true; break; }
      }
      document.body.classList.toggle('bd-editor-open', on);
    }catch(e){}
  }, 800);

  /* ── 카메라 줌아웃 ──
     4개 리 월드(210~213)와 문화의집(101)은 시야 배율이 정의돼 있지 않아 1.0(가장 가깝게)이었다.
     건물 하나가 화면을 넘어가 «어디가 어딘지» 가늠하기 어려웠다.
     값↑ = 더 넓게 보임. 이동 속도는 getMoveSpeed가 배율을 곱해 자동 보정된다. */
  /* district 런타임(v24)이 부팅 시 210~213을 «1.0(가장 가깝게)»으로 강제한다.
     1.0 그대로면 아직 우리 값이 안 들어간 것 — 계속 다시 적용한다.
     (개발자가 Ctrl+Shift+]/[ 로 다른 값을 잡으면 1.0이 아니므로 존중된다) */
  function applyZoom(){
    try{
      if (!window.BD_VIEW_SCALE) return;
      /* 4개 리(210~213)는 «정수 논리 픽셀 배율»(BD_DISTRICT_LOGICAL_PIXEL_SIZE)이
         VIEWPORT를 다시 계산해 BD_VIEW_SCALE 값을 무시한다.
         배율 2(가깝게) → 1(멀게)로 내려야 실제로 줌아웃된다.
         정수 배율이라 픽셀은 여전히 또렷하다. */
      window.BD_DISTRICT_LOGICAL_PIXEL_SIZE = Object.assign(
        {}, window.BD_DISTRICT_LOGICAL_PIXEL_SIZE || {},
        { 210: 1, 211: 1, 212: 1, 213: 1 });
      var WANT = { 210: 1.8, 211: 1.8, 212: 1.8, 213: 1.8, 101: 1.35 };
      Object.keys(WANT).forEach(function(sid){
        var v = window.BD_VIEW_SCALE[sid];
        if (v == null || v === 1 || v === 1.45) window.BD_VIEW_SCALE[sid] = WANT[sid];
      });
    }catch(e){}
  }
  applyZoom();
  setInterval(applyZoom, 1500);

  /* ── 조사 선택창 안전망 ──
     선택 상태(__bdChoiceState.open)는 살아 있는데 상자가 화면에서 사라진 채
     0.6초가 지나면 다시 표시한다. (보이지 않는 선택창은 입력만 잠근다) */
  var hiddenSince = 0;
  setInterval(function(){
    try{
      var S = window.__bdChoiceState;
      var box = document.getElementById('bd-choice');
      if (!S || !S.open || !box){ hiddenSince = 0; return; }
      var cs = getComputedStyle(box);
      var r = box.getBoundingClientRect();
      var visible = cs.display !== 'none' && +cs.opacity > 0.05 && r.height > 4;
      if (visible){ hiddenSince = 0; return; }
      if (!hiddenSince){ hiddenSince = Date.now(); return; }
      if (Date.now() - hiddenSince < 600) return;
      hiddenSince = 0;
      box.classList.add('show');
      box.style.display = '';
      box.style.removeProperty('pointer-events');   /* (v373) 잔여 pointer-events:none 정리 */
      try{ console.info('[v147] 열린 조사 선택창이 화면에서 사라져 다시 표시했습니다.'); }catch(e){}
    }catch(e){}
  }, 200);
})();
