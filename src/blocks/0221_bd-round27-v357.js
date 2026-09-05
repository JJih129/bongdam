
/* (v357) 유령 입력잠금 감시견 + 이어하기 위치 복원 보정 — 상세는 패치 주석 */
(function(){
  'use strict';

  /* ── 이어하기(슬롯 로드) 후 위치·해금 보정 ──
     봉담 슬롯 페이로드에 stage/heroX가 없으면 기본 스테이지(1)로 떨어지던 문제:
     레거시 자동저장(fantasyRPG_save)의 스냅샷으로 맵·좌표·해금 스토리를 재적용 */
  var wireLoad = setInterval(function(){
    if (typeof window.BD_loadFromSlot !== 'function' || window.BD_loadFromSlot.__v357) return;
    clearInterval(wireLoad);
    var oL = window.BD_loadFromSlot;
    window.BD_loadFromSlot = function(i){
      var r = oL.apply(this, arguments);
      setTimeout(function(){
        try{
          var s = JSON.parse(localStorage.getItem('fantasyRPG_save') || '{}');
          var d = s && (s.auto || s['1'] || s['2'] || s['3']);
          if (!d) return;
          try{
            if (d.story && window.BD_PROGRESS && BD_PROGRESS.story){
              BD_PROGRESS.story = Object.assign(BD_PROGRESS.story, JSON.parse(JSON.stringify(d.story)));
            }
          }catch(eS){}
          var tgt = Number(d.stage);
          if (tgt && typeof STAGES !== 'undefined' && STAGES[tgt] && Number(currentStage) !== tgt){
            try{ console.info('[v357] 이어하기 위치 보정 → 스테이지 ' + tgt); }catch(eI){}
            fadeToStage(tgt, (typeof d.heroX === 'number' ? d.heroX : 0.5), (typeof d.heroY === 'number' ? d.heroY : 0.6));
          }
        }catch(e){}
      }, 700);
      return r;
    };
    window.BD_loadFromSlot.__v357 = true;
  }, 300);
  /* 자동 저장 행은 BD_slotAction('load', i)를 직접 부른다 — 같은 보정을 적용 */
  var wireAct = setInterval(function(){
    if (typeof window.BD_slotAction !== 'function' || window.BD_slotAction.__v357) return;
    clearInterval(wireAct);
    var oA = window.BD_slotAction;
    window.BD_slotAction = function(action, i){
      var r = oA.apply(this, arguments);
      if (action === 'load'){
        setTimeout(function(){
          try{
            var s = JSON.parse(localStorage.getItem('fantasyRPG_save') || '{}');
            var d = s && (s.auto || s['1'] || s['2'] || s['3']);
            if (!d) return;
            try{
              if (d.story && window.BD_PROGRESS && BD_PROGRESS.story){
                BD_PROGRESS.story = Object.assign(BD_PROGRESS.story, JSON.parse(JSON.stringify(d.story)));
              }
            }catch(eS){}
            var tgt = Number(d.stage);
            if (tgt && typeof STAGES !== 'undefined' && STAGES[tgt] && Number(currentStage) !== tgt){
              try{ console.info('[v357] 이어하기 위치 보정 → 스테이지 ' + tgt); }catch(eI){}
              fadeToStage(tgt, (typeof d.heroX === 'number' ? d.heroX : 0.5), (typeof d.heroY === 'number' ? d.heroY : 0.6));
            }
          }catch(e){}
        }, 900);
      }
      return r;
    };
    window.BD_slotAction.__v357 = true;
  }, 300);
  var quiet = 0;
  setInterval(function(){
    try{
      var blocked = false;
      try{ blocked = !!(window.BD_isInputBlocked && BD_isInputBlocked()); }catch(e0){}
      if (!blocked){ quiet = 0; return; }
      /* 눈에 보이는 정당한 차단 요소가 있으면 개입하지 않는다 */
      if (window.HSR && HSR.active){ quiet = 0; return; }
      var d = document.getElementById('dialogue-box');
      if (d && d.getBoundingClientRect().height > 0){ quiet = 0; return; }
      if (document.querySelector('.bd-modal.show')){ quiet = 0; return; }
      if (window.__bdChoiceState && __bdChoiceState.open){ quiet = 0; return; }
      if (window.__bdArcadeOpen || window.__bdGalagaOpen){ quiet = 0; return; }
      var ov = document.getElementById('dialogue-overlay');
      if (ov && ov.classList.contains('show') && getComputedStyle(ov).display !== 'none'){
        /* VN 오버레이가 떠 있으면 정상 씬 — 단, 내용 없는 유령 상태만 카운트 */
        var db2 = document.getElementById('dialogue-box');
        if (db2 && db2.getBoundingClientRect().height > 0){ quiet = 0; return; }
      }
      var mg = document.getElementById('bd-mg-light');
      if (mg){ quiet = 0; return; }
      quiet++;
      /* v363 */
      if (quiet >= 2){
        quiet = 0;
        try{ if (window.__bdDlgOpenGet && __bdDlgOpenGet()) __bdDlgOpenSet(false); }catch(e1){}
        try{ window.__bdDamiOpeningBusy = false; }catch(e2){}
        try{
          var bc = document.getElementById('bd-choice');
          if (bc && !(window.__bdChoiceState && __bdChoiceState.open) && getComputedStyle(bc).display !== 'none'){
            bc.style.display = 'none';
          }
        }catch(e2b){}
        try{ var o2 = document.getElementById('dialogue-overlay'); if (o2) o2.classList.remove('show'); }catch(e3){}
        try{ console.info('[v357] 유령 입력잠금 감지 — 강제 해제'); }catch(e4){}
      }
    }catch(e){}
  }, 1000);
})();
