
/* (v71) 대화 중 이동 시도 시 짧은 안내 — 대사창이 떠 있어 못 움직인다는 걸 즉시 알려준다 */
(function(){
  'use strict';
  var last = 0, el = null;
  function ensure(){
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bd-move-hint';
    el.style.cssText = 'position:fixed;left:50%;bottom:26%;transform:translateX(-50%);z-index:1700;'
      + 'padding:9px 16px;border-radius:999px;background:rgba(20,24,36,.92);color:#ffe9a8;'
      + 'font-size:14px;font-weight:700;letter-spacing:.2px;box-shadow:0 6px 18px rgba(0,0,0,.45);'
      + 'pointer-events:none;opacity:0;transition:opacity .18s ease;';
    el.textContent = '💬 대화 중에는 움직일 수 없어요 — Space로 넘겨 주세요';
    document.body.appendChild(el);
    return el;
  }
  // (v71a) 이동 키 입력 단계에서 감지 — 대화 중에는 tryMove까지 도달하지 않는 구조
  document.addEventListener('keydown', function(e){
    try{
      var k = String(e.key||'').toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k) < 0) return;
      if (window.HSR && window.HSR.active) return;
      var ov = document.getElementById('dialogue-overlay');
      var box = document.getElementById('dialogue-box');
      if (ov && ov.offsetHeight && box && box.offsetHeight) window.BD_moveBlockedHint();
    }catch(err){}
  }, true);

  window.BD_moveBlockedHint = function(){
    var now = Date.now();
    if (now - last < 2200) return;
    last = now;
    var e = ensure();
    e.style.opacity = '1';
    setTimeout(function(){ try{ e.style.opacity = '0'; }catch(x){} }, 1500);
  };
})();
