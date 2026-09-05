
/* (v81) 위험요소 크기·비율 직접 조절 — 에디터에서 선택하면 폭/높이 슬라이더가 뜬다
   (건물처럼 자유롭게 크기를 맞출 수 있게. 콜라이더도 함께 따라간다) */
(function(){
  'use strict';
  var panel = null;
  function sel(){
    try{
      var s = window.__bdLastSel; if (!s) return null;
      var st = STAGES[Number(currentStage)]; if (!st) return null;
      var o = st.objects[s.index];
      return (o && o.interactable === 'hazard') ? o : null;
    }catch(e){ return null; }
  }
  function editorOn(){
    // (v106) 에디터 버튼은 항상 DOM에 있어 [id^="bge-"] 만으로는 늘 true가 된다 →
    //  타이틀·캐릭터 선택 화면에서도 패널이 뜨던 문제. 실제 에디터 창이 열렸을 때만 true.
    try{
      // (v106b) 에디터가 열리면 bge- 도구 버튼이 화면에 나타난다 — 이것만으로 판정한다.
      //  (game-screen 표시 여부는 검수·에디터 모드에서 다르게 잡혀 오판을 만들었다)
      var els = document.querySelectorAll('#bge-tool-select, #bge-zoom-in, #bge-tab-hierarchy, #bge-overview');
      for (var i = 0; i < els.length; i++){ if (els[i].offsetParent !== null) return true; }
      return false;
    }catch(e){ return false; }
  }
  function ensure(){
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'bd-hz-resize';
    panel.style.cssText = 'position:fixed;left:16px;bottom:120px;z-index:100000;display:none;'
      + 'width:250px;padding:12px 14px;border-radius:12px;background:rgba(18,22,34,.96);'
      + 'border:1px solid rgba(255,216,107,.45);color:#fff;font-size:12px;'
      + 'box-shadow:0 10px 26px rgba(0,0,0,.5);';
    panel.innerHTML =
      '<div style="font-weight:800;color:#ffd86b;margin-bottom:8px;">🧩 위험요소 크기</div>'
      + '<div id="bd-hz-name" style="margin-bottom:8px;color:#c9d2e6;"></div>'
      + '<label style="display:block;margin:6px 0 2px;">전체 크기 <span id="bd-hz-sv">100%</span></label>'
      + '<input id="bd-hz-scale" type="range" min="30" max="300" value="100" style="width:100%">'
      + '<label style="display:block;margin:8px 0 2px;">가로 비율 <span id="bd-hz-wv">100%</span></label>'
      + '<input id="bd-hz-w" type="range" min="50" max="200" value="100" style="width:100%">'
      + '<label style="display:block;margin:8px 0 2px;">세로 비율 <span id="bd-hz-hv">100%</span></label>'
      + '<input id="bd-hz-h" type="range" min="50" max="200" value="100" style="width:100%">'
      + '<button id="bd-hz-reset" style="margin-top:10px;width:100%;padding:7px;border-radius:8px;'
      + 'border:1px solid rgba(255,255,255,.2);background:#2b3550;color:#fff;cursor:pointer;">원래 크기로</button>';
    document.body.appendChild(panel);

    function apply(){
      var o = sel(); if (!o) return;
      if (!o.__bdBase) o.__bdBase = { rw:o.rw, rh:o.rh, cw:o.cw, ch:o.ch };
      var s = Number(document.getElementById('bd-hz-scale').value)/100;
      var w = Number(document.getElementById('bd-hz-w').value)/100;
      var hh = Number(document.getElementById('bd-hz-h').value)/100;
      document.getElementById('bd-hz-sv').textContent = Math.round(s*100)+'%';
      document.getElementById('bd-hz-wv').textContent = Math.round(w*100)+'%';
      document.getElementById('bd-hz-hv').textContent = Math.round(hh*100)+'%';
      var cx = o.rx + (o.rw||0)/2, cy = o.ry + (o.rh||0)/2;   // 중심 유지
      o.rw = o.__bdBase.rw * s * w;
      o.rh = o.__bdBase.rh * s * hh;
      o.rx = cx - o.rw/2; o.ry = cy - o.rh/2;
      if (o.cw != null){ o.cw = (o.__bdBase.cw||o.rw) * s * w; o.ch = (o.__bdBase.ch||o.rh) * s * hh;
                         o.cx = o.rx; o.cy = o.ry; }
    }
    ['bd-hz-scale','bd-hz-w','bd-hz-h'].forEach(function(id){
      panel.querySelector('#'+id).addEventListener('input', apply);
    });
    panel.querySelector('#bd-hz-reset').onclick = function(){
      var o = sel(); if (!o || !o.__bdBase) return;
      document.getElementById('bd-hz-scale').value = 100;
      document.getElementById('bd-hz-w').value = 100;
      document.getElementById('bd-hz-h').value = 100;
      apply();
    };
    return panel;
  }
  setInterval(function(){
    try{
      var p = ensure();
      var o = sel();
      if (!o || !editorOn()){ p.style.display = 'none'; return; }
      p.style.display = 'block';
      document.getElementById('bd-hz-name').textContent = (o.label||'위험요소')
        + '  (' + (o.rw||0).toFixed(3) + ' × ' + (o.rh||0).toFixed(3) + ')';
    }catch(e){}
  }, 400);
})();
