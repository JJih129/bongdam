
/* (v372) 가방(E) 열림 보증 + 진단
   · 제보: «인벤토리(장비창)가 아예 안 켜진다» — E 키 경로(0016 keydown → openInventory)가 중간 어딘가에서 삼켜지거나
     (shopOpen 잔존 플래그 / renderInventory 예외 / 다른 캡처 핸들러) 열리지 않은 채 끝나는 경우가 있다.
   · window 캡처 단계에서 E 를 보고 120ms 뒤에도 가방이 안 열려 있으면 «열 수 있는 상태»인지 확인한 뒤 직접 연다.
     열 수 없는 상태(대화·전투·모달)면 이유를 window.__bdInvWhy 에 남긴다 (검수용). */
(function(){
  'use strict';
  function invOpenNow(){ var o = document.getElementById('inv-overlay'); return !!(o && o.classList.contains('open')); }
  function why(){
    var r = [];
    try{
      if (window.HSR && HSR.active) r.push('battle');
      if (window.BD_isInputBlocked && BD_isInputBlocked()) r.push('inputBlocked');
      var db = document.getElementById('dialogue-box'); if (db && db.getBoundingClientRect().height > 0) r.push('dialogue');
      var m = document.querySelector('.bd-modal.show'); if (m) r.push('modal:' + (m.id || '?'));
      if (typeof shopOpen !== 'undefined' && shopOpen) r.push('shopOpenFlag');
      var gs = document.getElementById('game-screen'); if (!(gs && gs.offsetHeight > 0)) r.push('noGameScreen');
      if (window.__bdSceneActive) r.push('scene');
    }catch(e){ r.push('err:' + e.message); }
    return r;
  }
  window.BD_invWhy = why;
  function forceOpen(){
    try{
      /* 상점 DOM 이 실제로 안 보이면 잔존 플래그를 정리한다 (openInventory 는 shopOpen 이면 조용히 return) */
      if (typeof shopOpen !== 'undefined' && shopOpen){
        var so = document.getElementById('shop-overlay'), sm = document.getElementById('bd-shop-modal');
        var soUp = so && getComputedStyle(so).display !== 'none' && so.getBoundingClientRect().height > 0;
        var smUp = sm && sm.classList.contains('show');
        if (!soUp && !smUp){ try{ shopOpen = false; }catch(e0){} }
      }
      if (typeof openInventory === 'function') openInventory();
    }catch(e){
      try{ console.warn('[v372] openInventory 예외 → 최소 열기', e); }catch(e2){}
      try{ var o = document.getElementById('inv-overlay'); if (o){ o.classList.add('open'); if (typeof invOpen !== 'undefined') invOpen = true; } }catch(e3){}
    }
  }
  window.addEventListener('keydown', function(e){
    try{
      if (!e || e.repeat) return;
      if (String(e.key || '').toLowerCase() !== 'e' || e.ctrlKey || e.altKey || e.metaKey) return;
      var t = e.target, tag = (t && t.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
      var wasOpen = invOpenNow();
      setTimeout(function(){
        try{
          if (wasOpen) return;                        // 닫기 의도
          if (invOpenNow()) return;                   // 정상 경로로 열림
          var w = why();
          window.__bdInvWhy = { at: Date.now(), why: w };
          if (w.length && !(w.length === 1 && w[0] === 'shopOpenFlag')) return;   // 정당한 차단 — 진단만 남긴다
          forceOpen();
          try{ console.info('[v372] E 폴백으로 가방을 열었습니다', w); }catch(e4){}
        }catch(e5){}
      }, 120);
    }catch(e){}
  }, true);
})();
