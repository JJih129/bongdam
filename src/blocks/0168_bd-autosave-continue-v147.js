
/* (v147) 자동 저장이 «이어하기»에 나타나지 않던 문제
   ────────────────────────────────────────────────────────────
   저장 계열이 둘로 갈라져 있었다.
     · autoSave()      → localStorage['fantasyRPG_save'].auto
     · 이어하기 슬롯 UI → localStorage['bongdam_guardian_slot_0..2']
   그래서 배지를 받고 한참 진행해도 타이틀의 「이어하기」에는
   «슬롯 1·2·3 — 비어 있음»만 떠서, 창을 닫으면 처음부터 다시 해야 했다.
   → 자동 저장을 슬롯 계열에도 함께 기록하고, 이어하기 목록 맨 위에 띄운다. */
(function(){
  'use strict';
  var AUTO = 'auto';

  function inGame(){
    try{
      var gs = document.getElementById('game-screen');
      return !!(gs && getComputedStyle(gs).display === 'block');
    }catch(e){ return false; }
  }

  /* ① 자동 저장이 일어날 때 슬롯 계열에도 같이 기록 */
  function mirror(){
    try{
      if (!inGame()) return;
      if (typeof window.BD_saveToSlot === 'function') window.BD_saveToSlot(AUTO);
    }catch(e){}
  }
  try{
    var _auto = window.autoSave;
    if (typeof _auto === 'function' && !_auto.__bdMirrored){
      window.autoSave = function(){
        var r;
        try{ r = _auto.apply(this, arguments); }catch(e){}
        mirror();
        return r;
      };
      window.autoSave.__bdMirrored = true;
    }
  }catch(e){}
  /* 이벤트 저장만으로는 구멍이 생긴다 — 플레이 중 30초마다도 남긴다 */
  setInterval(mirror, 30000);
  setTimeout(mirror, 6000);

  /* ② 이어하기 목록 맨 위에 «자동 저장» 줄 추가 */
  function fmtTime(ts){
    if (!ts) return '';
    var d = new Date(ts), p = function(n){ return String(n).padStart(2,'0'); };
    return d.getFullYear() + '.' + p(d.getMonth()+1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function injectAutoRow(mode){
    try{
      if (mode !== 'load') return;
      var modal = document.getElementById('bd-slot-modal');
      if (!modal) return;
      var list = modal.querySelector('.bd-slot-list');
      if (!list || list.querySelector('.bd-slot-auto')) return;
      var meta = (typeof window.BD_slotMeta === 'function') ? window.BD_slotMeta(AUTO) : null;
      if (!meta) return;
      var row = document.createElement('div');
      row.className = 'bd-slot bd-slot-click bd-slot-auto';
      row.innerHTML =
        '<div class="bd-slot-num">자동 저장</div>'
        + '<div class="bd-slot-info">'
        +   '<div class="bd-slot-line1">Lv.' + (meta.lv||1) + ' · ' + (meta.chapter || '진행 중') + '</div>'
        +   '<div class="bd-slot-line2">' + (meta.region || '') + ' · 카드 ' + (meta.cards||0) + '개 · ' + fmtTime(meta.savedAt) + '</div>'
        + '</div>';
      row.onclick = function(){
        try{
          if (window.BD_slotAction) window.BD_slotAction('load', AUTO);
        }catch(e){}
      };
      list.insertBefore(row, list.firstChild);
    }catch(e){}
  }
  try{
    var _open = window.BD_openSlotUI;
    if (typeof _open === 'function' && !_open.__bdAutoRow){
      window.BD_openSlotUI = function(mode){
        var r = _open.apply(this, arguments);
        setTimeout(function(){ injectAutoRow(mode); }, 0);
        return r;
      };
      window.BD_openSlotUI.__bdAutoRow = true;
      /* BD_continueGame 은 클로저 안의 openSlotUI 를 직접 부르므로 그쪽도 감싼다 */
      window.BD_continueGame = function(){
        try{ _open('load'); }catch(e){}
        setTimeout(function(){ injectAutoRow('load'); }, 0);
      };
    }
  }catch(e){}
})();
