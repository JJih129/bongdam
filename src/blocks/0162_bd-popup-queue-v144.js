
/* (v144) 정화 직후 안내 창이 한꺼번에 겹쳐 떠 조작이 막히던 문제
   ────────────────────────────────────────────────────────────
   실제로 겹친 것: 「정화 완료!」 + 「장소 안내 카드」 + 「새로운 임무가 생겼어요」
   → 맨 위 창이 화면을 덮고, 아래 것들이 닫히지 않아 이동이 되지 않았다.

   해법: 안내 창을 한 번에 하나씩만 띄우고, 닫히면 다음 것을 보여 준다.
        그리고 어느 것도 오래 방치되면 자동으로 정리해 조작을 되돌려 준다. */
(function(){
  'use strict';

  var POPUPS = ['bd-quest-popup', 'bd-place-card', 'bd-purify-done', 'bd-newquest'];

  function visible(el){
    try{
      if (!el) return false;
      var cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' &&
             +cs.opacity > 0.05 && el.offsetHeight > 0;
    }catch(e){ return false; }
  }

  /** 화면을 덮는 안내 창들을 모은다 (id 가 다를 수 있어 특징으로도 찾는다) */
  function findPopups(){
    var out = [];
    try{
      POPUPS.forEach(function(id){
        var e = document.getElementById(id);
        if (visible(e)) out.push(e);
      });
      // 「새로운 임무가 생겼어요」처럼 id 없이 뜨는 안내도 잡는다
      document.querySelectorAll('div').forEach(function(e){
        if (out.indexOf(e) >= 0) return;
        if (!visible(e)) return;
        var r = e.getBoundingClientRect();
        if (r.width < 240 || r.height < 120) return;
        if (r.width > innerWidth * 0.95 && r.height > innerHeight * 0.9) return;
        var t = (e.textContent || '');
        if (/새로운 임무가 생겼어요|임무가 열렸어요|정화 완료/.test(t)) out.push(e);
      });
    }catch(e){}
    return out;
  }

  var since = 0;

  setInterval(function(){
    try{
      // 전투·컷신 중에는 관여하지 않는다
      if (window.HSR && HSR.active) { since = 0; return; }

      var ps = findPopups();
      if (ps.length <= 1){ since = 0; return; }

      // 두 개 이상 겹쳤다 — 맨 앞의 하나만 남기고 나머지는 잠시 접는다
      var top = ps[ps.length - 1];
      ps.forEach(function(e){
        if (e === top) return;
        try{
          if (!e.__bdHoldStyle) e.__bdHoldStyle = e.style.cssText;
          e.style.opacity = '0';
          e.style.pointerEvents = 'none';
        }catch(err){}
      });

      if (!since) since = Date.now();

      // 오래 방치되면(8초) 전부 정리해 조작을 되돌려 준다
      if (Date.now() - since > 8000){
        ps.forEach(function(e){
          try{
            var btn = Array.from(e.querySelectorAll('button')).find(function(b){
              return /확인|닫기|계속/.test(b.textContent || '');
            });
            if (btn) btn.click();
            else { e.style.display = 'none'; e.style.pointerEvents = 'none'; }
          }catch(err){}
        });
        try{ console.info('[v144] 겹친 안내 창 정리 — 조작을 복구했습니다.'); }catch(e){}
        since = 0;
      }
    }catch(e){}
  }, 600);

  /* 접어 둔 창은 앞의 것이 닫히면 되살린다 */
  setInterval(function(){
    try{
      if (findPopups().length > 1) return;
      document.querySelectorAll('div').forEach(function(e){
        if (e.__bdHoldStyle !== undefined && e.style.opacity === '0'){
          e.style.cssText = e.__bdHoldStyle;
          delete e.__bdHoldStyle;
        }
      });
    }catch(e){}
  }, 900);
})();
