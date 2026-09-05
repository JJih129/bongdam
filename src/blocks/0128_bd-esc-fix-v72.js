
/* (v72) ESC 중첩 버그 — 가방·상점 등 오버레이를 ESC로 닫을 때
   일시정지 메뉴까지 함께 열려 화면이 잠기던 문제.
   ESC는 "가장 위에 열려 있는 UI 하나"만 닫는다. */
(function(){
  'use strict';
  var PANELS = ['inv-overlay','shop-overlay','quest-overlay','notebook-overlay','place-overlay',
                'safety-map-overlay','bd-safety-modal','bd-district-facility-modal',
                'equip-overlay','bag-overlay','bd-inventory'];
  /* (v147) offsetParent 는 fixed 요소에서 늘 null 이라 열린 패널을 한 번도 찾지 못했다.
     → 실제로 화면을 차지하는지로 판정한다. */
  function onScreen(e){
    try{
      if (!e) return false;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      var r = e.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    }catch(err){ return false; }
  }
  function openPanel(){
    for (var i=0;i<PANELS.length;i++){
      var e = document.getElementById(PANELS[i]);
      if (onScreen(e) &&
          (e.classList.contains('open') || e.classList.contains('show') ||
           getComputedStyle(e).display !== 'none')) return e;
    }
    // 클래스 기반 오버레이도 탐색
    var cand = document.querySelectorAll('.overlay.open, .modal.show, .bd-modal.show');
    for (var j=0;j<cand.length;j++){
      /* (v147) 일시정지 모달은 여기서 다루지 않는다 — 같은 ESC 이벤트에서
         앞선 핸들러가 방금 연 일시정지를 «열린 패널»로 오인해 즉시 숨겼고,
         게임 루프는 멈춘 채 모달만 사라져 잠깐 조작 불능이 됐다.
         (일시정지 열고 닫기는 전용 토글이 담당한다) */
      if (cand[j].id === 'bd-pause-modal') continue;
      if (onScreen(cand[j])) return cand[j];
    }
    return null;
  }
  function pauseEl(){ return document.getElementById('bd-pause-modal') || document.getElementById('pause-modal'); }

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    try{
      if (window.HSR && HSR.active) return;
      var panel = openPanel();
      if (!panel) return;                    // 열린 패널이 없으면 평소대로(일시정지 열기)
      // 패널이 열려 있으면 그 패널만 닫고, 일시정지 메뉴는 열리지 않게 막는다
      e.stopImmediatePropagation();
      /* (v147) 클래스만 벗기면 게임 내부 상태(shopOpen·invOpen 등)가 열린 채로 남아
         «화면은 닫혔는데 움직일 수 없고, 잠시 뒤 창이 다시 열리는» 상태가 됐다.
         정식 닫기 함수가 있으면 그것을 먼저 부른다. */
      var __closed = false;
      try{
        var __id = panel.id || '';
        if (__id === 'shop-overlay' && typeof window.closeShop === 'function'){ window.closeShop(); __closed = true; }
        else if (__id === 'inv-overlay' && typeof window.closeInventory === 'function'){ window.closeInventory(); __closed = true; }
        else if (__id === 'quest-overlay' && typeof window.closeQuestPanel === 'function'){ window.closeQuestPanel(); __closed = true; }
        else if (__id === 'bd-district-facility-modal' && typeof window.BD_closeDistrictFacility === 'function'){ window.BD_closeDistrictFacility(); __closed = true; }
      }catch(eC){}
      if (!__closed){
        panel.classList.remove('open','show');
        try{ if (getComputedStyle(panel).display !== 'none' && !panel.classList.length) panel.style.display='none'; }catch(e2){}
      }
      /* 어떤 경로로 닫혔든 내부 «열림» 플래그는 확실히 내린다 */
      try{ if (typeof window.shopOpen !== 'undefined' && !document.getElementById('shop-overlay').classList.contains('open')) window.shopOpen = false; }catch(e3){}
      try{ if (typeof window.invOpen !== 'undefined' && !document.getElementById('inv-overlay').classList.contains('open')) window.invOpen = false; }catch(e4){}
      setTimeout(function(){
        var p = pauseEl();
        if (p && (p.classList.contains('show') || p.classList.contains('open'))) p.classList.remove('show','open');
      }, 30);
    }catch(err){}
  }, true);

  /* 안전망: 패널이 하나도 없는데 일시정지가 떠 있고 전투/대화도 아니면 30초 이상 방치 시 자동 해제하지 않고,
     대신 '계속하기'를 누를 수 있도록 pointer-events를 보장한다. */
  setInterval(function(){
    try{
      var p = pauseEl();
      if (p && (p.classList.contains('show') || p.classList.contains('open'))){
        p.style.pointerEvents = 'auto';
        var btn = Array.from(p.querySelectorAll('button')).find(function(b){ return /계속하기/.test(b.textContent||''); });
        if (btn) btn.style.pointerEvents = 'auto';
      }
    }catch(e){}
  }, 900);
})();
