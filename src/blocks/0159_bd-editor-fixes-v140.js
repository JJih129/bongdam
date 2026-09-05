
/* (v140) 에디터 두 가지 문제
   ① 콜라이더·오브젝트의 좌우 비율을 따로 조절할 수 없던 문제
      (핸들을 끌어도 원본 비율이 유지되어 가로만 늘릴 수 없었다)
   ② 겹친 오브젝트에서 «테두리»를 클릭하면 선택되지 않고 다음 오브젝트로 넘어가던 문제
      (스프라이트 테두리는 괜찮은데 콜라이더 등 다른 테두리에서 발생) */
(function(){
  'use strict';

  /* ── ① 비율 고정 해제 ──
     리사이즈 중에는 종횡비를 강제하는 플래그를 꺼서 가로/세로를 각각 조절할 수 있게 한다. */
  function freeAspect(){
    try{
      // 전역 비율 잠금 플래그들을 해제 (있는 것만)
      ['aspectLock','ASPECT_LOCK','keepAspect','lockRatio'].forEach(function(k){
        if (typeof window[k] !== 'undefined' && window[k]) window[k] = false;
      });
      // 에디터 상태 객체 쪽
      var v = window.v3 || (window.BGE && BGE.v3);
      if (v){
        if (v.aspectLock) v.aspectLock = false;
        if (v.keepAspect) v.keepAspect = false;
      }
    }catch(e){}
  }
  freeAspect();
  setInterval(freeAspect, 500);

  /* Shift 를 누르면 «비율 유지», 평소에는 «자유 조절» — 일반적인 편집기 방식 */
  var shiftOn = false;
  document.addEventListener('keydown', function(e){ if (e.key === 'Shift') shiftOn = true; }, true);
  document.addEventListener('keyup',   function(e){ if (e.key === 'Shift') shiftOn = false; }, true);
  window.BD_aspectHeld = function(){ return shiftOn; };

  /* ── ② 테두리 클릭 시 선택 유지 ──
     겹친 오브젝트 순환은 «내부» 클릭에서만 일어나야 한다.
     테두리(리사이즈 핸들 근처)를 눌렀을 때는 지금 선택을 유지하고 크기 조절로 들어간다. */
  var lastEdgeAt = 0;
  document.addEventListener('mousedown', function(e){
    try{
      var cv = document.getElementById('game-canvas');
      if (!cv || e.target !== cv) return;
      // 에디터가 열려 있을 때만
      var on = document.querySelector('#bge-tool-select, #bge-zoom-in');
      if (!on || !on.offsetParent) return;

      var fn = window.hitHandle || (window.BGE && BGE.hitHandle);
      if (typeof fn !== 'function') return;
      var hd = '';
      try{ hd = fn(e.clientX, e.clientY) || ''; }catch(err){}
      if (hd){
        // 테두리·모서리를 잡았다 → 순환 선택이 끼어들지 못하게 표시
        lastEdgeAt = Date.now();
        window.__bdEdgeGrab = true;
        setTimeout(function(){ window.__bdEdgeGrab = false; }, 400);
      }
    }catch(err){}
  }, true);

  /* 순환 선택 함수를 감싸, 테두리를 잡은 직후에는 넘어가지 않게 한다 */
  var w = setInterval(function(){
    try{
      var name = null;
      ['cycleOverlap','pickNextOverlap','selectNextAt'].forEach(function(k){
        if (typeof window[k] === 'function' && !window[k].__bdEdge) name = k;
      });
      if (!name) return;
      clearInterval(w);
      var orig = window[name];
      window[name] = function(){
        try{
          if (window.__bdEdgeGrab || (Date.now() - lastEdgeAt) < 400) return;  // 테두리 조작 중 — 선택 유지
        }catch(e){}
        return orig.apply(this, arguments);
      };
      window[name].__bdEdge = true;
    }catch(e){}
  }, 300);
})();
