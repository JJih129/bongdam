
/* (v323) 에디터 확장 — 시설 오브젝트의 «상호작용 반경(px)» 직접 지정
   선택 오브젝트는 좌표 입력값(rx/ry/rw/rh)으로 역매칭한다 (에디터 내부는 클로저) */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function curStageObjects(){
    try{
      var sel = $('bge-stage-select') || $('bge-stage');
      var sid = sel ? Number(sel.value) : Number(currentStage);
      if (!sid || !STAGES[sid]) sid = Number(currentStage);
      return (STAGES[sid] && STAGES[sid].objects) || [];
    }catch(e){ return []; }
  }
  function matchSelected(){
    try{
      var rx = parseFloat(($('bge-obj-rx')||{}).value), ry = parseFloat(($('bge-obj-ry')||{}).value);
      var rw = parseFloat(($('bge-obj-rw')||{}).value), rh = parseFloat(($('bge-obj-rh')||{}).value);
      if (isNaN(rx) || isNaN(ry)) return null;
      var list = curStageObjects();
      for (var i = 0; i < list.length; i++){
        var o = list[i]; if (!o) continue;
        if (Math.abs(Number(o.rx)-rx) < 0.0015 && Math.abs(Number(o.ry)-ry) < 0.0015
          && Math.abs(Number(o.rw)-rw) < 0.0015 && Math.abs(Number(o.rh)-rh) < 0.0015) return o;
      }
      return null;
    }catch(e){ return null; }
  }
  function ensureUI(){
    try{
      if (!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled)) return;
      var rxIn = $('bge-obj-rx');
      if (!rxIn || !rxIn.offsetParent && rxIn.offsetHeight === 0) { /* 폼 숨김이면 스킵 */ }
      var host = rxIn ? rxIn.closest('div') : null;
      if (!host) return;
      var box = $('bd-radius-box');
      var obj = matchSelected();
      var isFac = obj && (obj.facilityId || obj.interactable === 'facility');
      if (!box){
        box = document.createElement('div');
        box.id = 'bd-radius-box';
        box.style.cssText = 'margin-top:6px;padding:6px;border:1px dashed rgba(255,216,107,.5);border-radius:6px;';
        box.innerHTML = '<label style="font-size:11px;">\uD83C\uDFAF 상호작용 반경(px) <small>비우면 기본 110</small></label>'
          + '<input id="bd-radius-input" type="number" min="20" max="400" step="5" style="width:90px;">';
        var form = rxIn.closest('#bge-obj-form') || host.parentElement;
        form.appendChild(box);
        $('bd-radius-input').addEventListener('change', function(){
          try{
            var o = matchSelected(); if (!o) return;
            var v = Number(this.value);
            if (v > 0) o.interactionRadius = v; else delete o.interactionRadius;
            /* 랜드마크 캐시에도 반영 */
            try{
              var lm = (STAGES[Number(currentStage)].__v24Landmarks || []).find(function(l){ return l && l.facilityId === o.facilityId; });
              if (lm){ if (v > 0) lm.interactionRadius = v; else delete lm.interactionRadius; }
            }catch(e2){}
            if (BongdamEditor.save) BongdamEditor.save();
            try{ if (typeof bdToast === 'function') bdToast('\uD83C\uDFAF 반경 저장: ' + (v > 0 ? v + 'px' : '기본')); }catch(e3){}
          }catch(e){}
        });
      }
      box.style.display = isFac ? 'block' : 'none';
      if (isFac){
        var inp = $('bd-radius-input');
        if (document.activeElement !== inp) inp.value = obj.interactionRadius || '';
      }
    }catch(e){}
  }
  setInterval(ensureUI, 600);
})();
