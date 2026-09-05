
/* (v316) 라운드 10 편의 기능
   · BD_rescue — 끼임·잠금 탈출: 잔여 오버레이 정리 + 현재 지역 시작 지점으로 복귀 (일시정지 메뉴)
   · 터치 모드 상단 \uD83D\uDDFA 버튼 — 안전지도가 핵심 목표인데 터치 레이아웃에서 진입이 숨어 있었다
   · PC 커서 호버 시 시설 이름 미니 툴팁 */
(function(){
  'use strict';

  /* ── 구조 요청 ── */
  var SPAWN = { 101:[0.700,0.240], 212:[0.216,0.336], 213:[0.850,0.111], 211:[0.693,0.893], 210:[0.775,0.529] };
  window.BD_rescue = function(){
    try{
      if (window.HSR && HSR.active){ try{ bdToast('전투 중에는 쓸 수 없어요 — \uD83C\uDFC3 물러나기(ESC)를 이용해요'); }catch(e1){} return; }
      try{ if (typeof closePause === 'function') closePause(); }catch(e2){}
      try{ var m = document.getElementById('bd-pause-modal'); if (m) m.classList.remove('show'); }catch(e3){}
      /* 잔여 상태 청소 — 엔진 대화 모드(dialogueOpen)까지 공식 함수로 닫는다 */
      try{ if (typeof closeDialogue === 'function') closeDialogue(); }catch(eD){}
      try{ window.__bdSceneActive = false; }catch(e4){}
      try{ var ov = document.getElementById('dialogue-overlay'); if (ov) ov.style.display = 'none'; }catch(e5){}
      try{ if (window.BD_choiceClose) BD_choiceClose(); }catch(e6){}
      try{ var fm = document.getElementById('bd-district-facility-modal'); if (fm) fm.classList.remove('open'); }catch(e7){}
      try{ window.__bdBusModalOpen = false; var bm = document.getElementById('bd-bus-modal'); if (bm) bm.classList.remove('show'); }catch(e8){}
      try{ document.querySelectorAll('.bd-modal.show').forEach(function(x){ if (x.id !== 'bd-pause-modal') x.classList.remove('show'); }); }catch(e9){}
      var p = SPAWN[Number(currentStage)] || [0.5, 0.5];
      heroX = p[0]; heroY = p[1]; camX = heroX; camY = heroY;
      try{ moveKeys = { w:false, a:false, s:false, d:false }; }catch(e10){}
      try{ bdToast('\u26D1\uFE0F 시작 지점으로 이동했어요'); }catch(e11){}
    }catch(e){}
  };

  /* ── 터치 모드 안전지도 버튼 ── */
  function ensureMapBtn(){
    try{
      if (!document.documentElement.classList.contains('bd-touch-mode')) return;
      var gs = document.getElementById('game-screen');
      if (!gs || gs.style.display !== 'block') return;
      var b = document.getElementById('bd-touch-mapbtn');
      if (!b){
        b = document.createElement('button');
        b.id = 'bd-touch-mapbtn';
        b.type = 'button';
        b.textContent = '\uD83D\uDDFA';
        b.style.cssText = 'position:fixed;top:14px;right:134px;z-index:1200;width:46px;height:46px;'
          + 'border-radius:12px;font-size:22px;background:rgba(16,24,44,.88);'
          + 'border:2px solid rgba(255,216,107,.6);color:#ffd86b;touch-action:manipulation;';
        b.addEventListener('pointerdown', function(ev){
          ev.preventDefault();
          try{ if (window.BD_openSafetyMap) BD_openSafetyMap(); }catch(e1){}
        });
        document.body.appendChild(b);
      }
      var inBattle = !!(window.HSR && HSR.active);
      b.style.display = inBattle ? 'none' : 'block';
    }catch(e){}
  }
  setInterval(ensureMapBtn, 700);

  /* ── PC 호버 시설명 툴팁 ── */
  var tipEl = null, lastMove = 0;
  function tip(){
    if (!tipEl){
      tipEl = document.createElement('div');
      tipEl.id = 'bd-hover-tip';
      tipEl.style.cssText = 'position:fixed;display:none;pointer-events:none;z-index:820;'
        + 'padding:3px 10px;border-radius:8px;font-size:12px;font-weight:800;'
        + 'background:rgba(16,24,44,.92);color:#ffe9a8;border:1px solid rgba(255,216,107,.6);'
        + 'box-shadow:0 4px 12px rgba(0,0,0,.4);white-space:nowrap;';
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  document.addEventListener('mousemove', function(ev){
    try{
      if (document.documentElement.classList.contains('bd-touch-mode')) return;
      var now = Date.now(); if (now - lastMove < 80) return; lastMove = now;
      var t = tip();
      if (window.HSR && HSR.active){ t.style.display = 'none'; return; }
      if (window.__bdSceneActive){ t.style.display = 'none'; return; }
      var gs = document.getElementById('game-screen');
      if (!gs || gs.style.display !== 'block'){ t.style.display = 'none'; return; }
      if (!window.BD_screenRectOfWorld || typeof STAGES === 'undefined'){ t.style.display = 'none'; return; }
      var st = STAGES[Number(currentStage)];
      if (!st || !Array.isArray(st.__v24Landmarks)){ t.style.display = 'none'; return; }
      var hit = null;
      for (var i = 0; i < st.__v24Landmarks.length; i++){
        var l = st.__v24Landmarks[i];
        if (!l || l.hidden || !l.label) continue;
        var r = BD_screenRectOfWorld(Number(l.rx || 0), Number(l.ry || 0), Number(l.rw || 0), Number(l.rh || 0));
        if (!r) continue;
        if (ev.clientX >= r.left && ev.clientX <= r.left + r.width &&
            ev.clientY >= r.top && ev.clientY <= r.top + r.height){ hit = l; break; }
      }
      if (!hit){ t.style.display = 'none'; return; }
      t.textContent = '\uD83C\uDFE0 ' + hit.label;
      var __z = 1; try{ __z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(__z > 0)) __z = 1; }catch(eZ){}   /* (v372) UI 배율 보정 */
      t.style.left = ((ev.clientX + 14) / __z) + 'px';
      t.style.top = ((ev.clientY + 16) / __z) + 'px';
      t.style.display = 'block';
    }catch(e){}
  }, true);
})();
