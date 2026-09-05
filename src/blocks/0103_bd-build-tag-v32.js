
/* (v32) 빌드 태그 — 어떤 빌드가 실행 중인지 즉시 식별 (에디터 ON일 때 우하단 배지 + 부팅 콘솔) */
(function(){
  'use strict';
  window.BD_BUILD_TAG = 'v32';
  try { console.info('%c[봉담지킴이] build v32 — 오브젝트 편집 완전 자유화(스냅·비율 강제 제거) 적용 빌드',
    'color:#ffd86b;font-weight:bold'); } catch(e){}
  var el = null;
  function ensure(){
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bd-build-badge';
    el.textContent = 'build v32 · 편집 자유화';
    el.style.cssText = 'position:fixed;right:10px;bottom:8px;z-index:99999;font:bold 11px/1.6 sans-serif;'
      + 'color:#ffd86b;background:rgba(10,14,26,.82);border:1px solid rgba(255,216,107,.45);'
      + 'border-radius:8px;padding:2px 9px;pointer-events:none;display:none;letter-spacing:.3px;';
    document.body.appendChild(el);
    return el;
  }
  setInterval(function(){
    try{
      var on = !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled);
      ensure().style.display = on ? '' : 'none';
    }catch(e){}
  }, 500);
})();
