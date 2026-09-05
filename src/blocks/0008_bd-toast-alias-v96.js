
/* (v96) 토스트 별칭 — 이 빌드의 정식 함수는 BD_toast인데 여러 안내가 bdToast를 부르고 있어
   부탁 수락·구매 완료·보상 지급 같은 알림이 조용히 사라지고 있었다. 별칭으로 전부 살린다. */
(function(){
  'use strict';
  function fallbackBanner(text, ms){
    try{
      var el = document.getElementById('bd-generic-toast');
      if (!el){
        el = document.createElement('div');
        el.id = 'bd-generic-toast';
        el.style.cssText = 'position:fixed;left:50%;bottom:16%;transform:translateX(-50%);z-index:1640;'
          + 'max-width:min(640px,92vw);padding:11px 18px;border-radius:12px;'
          + 'background:rgba(20,24,36,.94);border:1px solid rgba(255,255,255,.18);color:#fff;'
          + 'font-size:14px;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.4);'
          + 'opacity:0;transition:opacity .2s ease;pointer-events:none;';
        document.body.appendChild(el);
      }
      el.textContent = text;
      el.style.opacity = '1';
      clearTimeout(el.__t);
      el.__t = setTimeout(function(){ try{ el.style.opacity='0'; }catch(e){} }, ms || 3200);
    }catch(e){}
  }
  // (v96a) BD_toast는 이 화면에서 실제로 보이지 않는 경우가 있어(조건부 렌더),
  //  안내가 사라지지 않도록 항상 자체 배너로도 함께 띄운다.
  window.bdToast = function(text, ms){
    // (v107) 같은 안내가 두 곳에 겹쳐 뜨던 문제 — BD_toast가 화면에 실제로 표시되면
    //  자체 배너는 띄우지 않는다. 표시되지 않을 때만 배너로 보완한다.
    var shown = false;
    try{
      if (typeof window.BD_toast === 'function'){
        window.BD_toast(text, ms);
        var probe = String(text).slice(0, 12);
        /* (v306) offsetParent는 fixed 요소에서 항상 null — #bd-toast 표시 여부를 직접 본다 */
        var el0 = document.getElementById('bd-toast');
        shown = !!(el0 && el0.classList.contains('show')
          && getComputedStyle(el0).display !== 'none'
          && (el0.textContent || '').indexOf(probe) >= 0);
      }
    }catch(e){}
    if (!shown) fallbackBanner(text, ms);
  };
})();
