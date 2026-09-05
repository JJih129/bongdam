
/* (v75) 이전 버전에서 '정화 소멸'을 hidden 으로 처리하면서 에디터의 숨김 속성이 켜진 채
   남아 있던 오브젝트들을 전부 해제한다. (소멸 여부는 이제 __bdGone 이 따로 관리) */
(function(){
  'use strict';
  function unhideAll(){
    try{
      if (typeof STAGES === 'undefined') return false;
      var n = 0;
      Object.keys(STAGES).forEach(function(sid){
        var st = STAGES[sid];
        if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o){ if (o && o.hidden){ o.hidden = false; n++; } });
      });
      if (n) { try{ console.info('[v75] 숨김 해제:', n, '개'); }catch(e){} }
      return true;
    }catch(e){ return false; }
  }
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    if (unhideAll() || tries > 80) clearInterval(t);
  }, 250);
  // (v106) 6초 시점 재실행 제거 — 그 사이 에디터에서 사용자가 직접 숨긴 오브젝트까지
  //  강제로 되살려 "숨겨도 다시 보인다"가 되던 문제. 최초 1회 정리로 충분하다.
  window.BD_unhideAll = unhideAll;
})();
