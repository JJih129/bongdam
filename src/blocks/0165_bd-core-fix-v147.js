
/* ══════════════════════════════════════════════════════════════
   (v147) 진행 막힘 일괄 수정
   ① 콜라이더가 본체에서 떨어져 나가 «투명벽»이 된 오브젝트 자동 교정
   ② 컷신 플래그·대사 오버레이가 남아 조작이 잠기는 현상 자가 복구
   ③ 대사창이 «비어 있는데» 떠 있어 입력만 삼키는 유령 상태 정리
   ══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  function onScreen(e){
    try{
      if (!e) return false;
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false;
      var r = e.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    }catch(err){ return false; }
  }
  window.BD_onScreen = window.BD_onScreen || onScreen;

  /* ───────── ① 투명벽 교정 ─────────
     에디터에서 본체만 옮기고 콜라이더를 그대로 둔 오브젝트가 있으면
     아무것도 없는 자리에 보이지 않는 벽이 생긴다.
     (실측: 와우리 «쌓여있던 위험들» 콜라이더가 본체에서 x로 0.46,
            상리 «어두운 산책로» 콜라이더가 y로 0.14 떨어져 있었다)
     콜라이더를 «일부러 꺼 둔» 경우(cw/ch 가 0)는 건드리지 않는다. */
  var fixedOnce = {};
  function repairColliders(){
    try{
      if (typeof STAGES === 'undefined') return;
      /* (v147-55) 에디터가 열려 있는 동안엔 교정하지 않는다 —
         콜라이더를 본체 밖으로 일부러 옮기는 편집을 되돌려 버리면 안 된다 */
      try{ if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return; }catch(eEd){}
      Object.keys(STAGES).forEach(function(sid){
        var st = STAGES[sid];
        if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o, i){
          if (!o) return;
          var hasC = o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined;
          if (!hasC) return;
          if (o.userColliderV147) return;                // (v147-56) 에디터에서 손으로 만진 콜라이더는 존중
          if (!(o.cw > 0) || !(o.ch > 0)) return;        // 의도적으로 꺼 둔 콜라이더는 존중
          var rx = o.rx || 0, ry = o.ry || 0, rw = o.rw || 0, rh = o.rh || 0;
          // 콜라이더가 본체 사각형과 «전혀 겹치지 않으면» 떨어져 나간 것으로 본다
          var overlap = (o.cx < rx + rw) && (o.cx + o.cw > rx) &&
                        (o.cy < ry + rh) && (o.cy + o.ch > ry);
          if (overlap) return;
          var key = sid + ':' + i + ':' + (o.label || '');
          if (fixedOnce[key]) return;
          fixedOnce[key] = true;
          var ow = Math.min(o.cw, rw || o.cw), oh = Math.min(o.ch, rh || o.ch);
          o.cx = rx + (rw - ow) / 2;                     // 본체 가운데에 맞춰 되돌린다
          o.cy = ry + (rh - oh);                         // 아래쪽(발밑) 기준
          o.cw = ow; o.ch = oh;
          try{ console.info('[v147] 투명벽 교정: ' + (o.label||'오브젝트') +
                            ' (스테이지 ' + sid + ') 콜라이더를 본체 위치로 되돌렸습니다.'); }catch(e){}
        });
      });
    }catch(e){}
  }
  repairColliders();
  setTimeout(repairColliders, 1500);
  setTimeout(repairColliders, 4000);
  setInterval(repairColliders, 5000);
  window.BD_repairColliders = repairColliders;

  /* ───────── ②③ 조작 잠김 자가 복구 ─────────
     인수인계 §2 — 다음 상태가 남으면 이동·상호작용이 전부 막힌다.
       · window.__bdSceneActive 가 참인데 실제 컷신 UI가 화면에 없음
       · #dialogue-overlay 가 떠 있는데 대사 내용이 비어 있음
     v145 가 «유령 모달»을 잡은 방식(보이는지 실제로 확인)을 그대로 확장한다. */
  var sceneSince = 0, ovSince = 0;

  function cutsceneUiUp(){
    var ids = ['dialogue-overlay','bd-boss-dlg','bd-badge-ov','bd-cine-ov','bd-ending-ov','bd-place-card'];
    for (var i = 0; i < ids.length; i++){
      var e = document.getElementById(ids[i]);
      if (!e) continue;
      if (ids[i] === 'bd-boss-dlg'){ if (e.classList.contains('on')) return true; continue; }
      if (onScreen(e)) return true;
    }
    // 전투·미니게임도 컷신 플래그를 쓸 수 있으므로 살아 있는 것으로 본다
    try{ if (window.HSR && HSR.active) return true; }catch(e){}
    return false;
  }

  function dialogueEmpty(){
    try{
      var ov = document.getElementById('dialogue-overlay');
      if (!ov || !onScreen(ov)) return false;
      var bx = document.getElementById('dialogue-box');
      var tx = document.getElementById('dialogue-text');
      var body = ((tx || bx || {}).textContent || '').replace(/[\s▼\[\]]/g,'')
                  .replace(/클릭|Space|F/g,'').trim();
      if (body.length) return false;
      // 내용이 비었고, 상자도 실제로 그려지지 않았다면 «유령»
      return !onScreen(bx);
    }catch(e){ return false; }
  }

  setInterval(function(){
    try{
      /* ② 컷신 플래그만 남은 경우 */
      if (window.__bdSceneActive && !cutsceneUiUp()){
        if (!sceneSince) sceneSince = Date.now();
        else if (Date.now() - sceneSince > 1600){
          window.__bdSceneActive = false;
          sceneSince = 0;
          try{ console.info('[v147] 남아 있던 컷신 상태를 해제해 조작을 복구했습니다.'); }catch(e){}
          try{ if (window.BD_toast) BD_toast('▶ 다시 움직일 수 있어요'); }catch(e){}
        }
      } else sceneSince = 0;

      /* ③ 내용 없는 대사 오버레이만 남은 경우 */
      if (dialogueEmpty()){
        if (!ovSince) ovSince = Date.now();
        else if (Date.now() - ovSince > 1600){
          var ov = document.getElementById('dialogue-overlay');
          if (ov){ ov.style.display = 'none'; ov.classList.remove('show','on'); }
          try{ if (typeof window.dialogueOpen !== 'undefined') window.dialogueOpen = false; }catch(e){}
          ovSince = 0;
          try{ console.info('[v147] 비어 있는 대사창을 정리해 조작을 복구했습니다.'); }catch(e){}
        }
      } else ovSince = 0;
    }catch(e){}
  }, 400);

  /* ───────── ②-b 전용 컷신 중에는 조작을 막는다 ─────────
     최종 보스 대사창(#bd-boss-dlg)은 화면 전체를 덮는 연출인데
     BD_isInputBlocked() 가 이를 보지 않아, 연출 중에도 캐릭터가 걸어 다녔다. */
  try{
    var _prevBlocked = window.BD_isInputBlocked;
    window.BD_isInputBlocked = function(){
      try{
        var bo = document.getElementById('bd-boss-dlg');
        if (bo && bo.classList.contains('on')) return true;
      }catch(e){}
      /* (v147) 상점·가방·아케이드 선택창이 떠 있으면 «움직일 수 없는 상태»인데
         BD_isInputBlocked() 는 이를 보지 않아 false 를 돌려줬다.
         그 결과 다른 레이어들이 «조작 가능»으로 오판했고,
         자동 검수도 «열린 창»을 놓쳐 그대로 갇혔다. */
      try{
        var PANELS = ['shop-overlay','inv-overlay','quest-overlay','notebook-overlay',
                      'place-overlay','safety-map-overlay','equip-overlay','bag-overlay',
                      'bd-gamesel','bd-songsel','bd-district-facility-modal','bd-bus-modal',
                      'bd-report','bd-ending-modal'];   /* (v312) 리포트·엔딩 위 상호작용 차단 */
        for (var pi = 0; pi < PANELS.length; pi++){
          var pe = document.getElementById(PANELS[pi]);
          if (!pe) continue;
          var pcs = getComputedStyle(pe);
          if (pcs.display === 'none' || pcs.visibility === 'hidden' || +pcs.opacity < 0.05) continue;
          var pr = pe.getBoundingClientRect();
          if (pr.width > 100 && pr.height > 100) return true;
        }
      }catch(e){}
      try{ if (window.__bdSelectOpen || window.__bdSongSelOpen || window.__bdArcadeOpen) return true; }catch(e){}
      try{ return _prevBlocked ? !!_prevBlocked.apply(this, arguments) : false; }
      catch(e){ return false; }
    };
  }catch(e){}

  /* ───────── ②-b2 버스 목적지 창은 ESC 로도 닫힌다 ─────────
     이 창만 «클릭»으로만 닫을 수 있었다. 게임의 다른 모든 창은 ESC 로 닫히고,
     조작 안내도 키보드 기준이라, 키보드로만 하던 플레이어는
     정류장 창을 띄운 채 대화도 이동 상호작용도 못 하는 상태가 됐다. */
  window.addEventListener('keydown', function(e){
    try{
      if (e.key !== 'Escape') return;
      var w = document.getElementById('bd-bus-modal');
      if (!w || !onScreen(w)) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      var btn = w.querySelector('[data-close="1"]');
      if (btn) btn.click();
      else { try{ w.remove(); }catch(e2){} }
      try{ window.__bdBusModalOpen = false; }catch(e3){}
      window.__bdBusEscAt = Date.now();
    }catch(err){}
  }, true);
  /* 혹시 다른 레이어가 ESC 를 먼저 삼켜도 반드시 닫히도록 하는 안전망 */
  (function(){
    var escAt = 0;
    window.addEventListener('keyup', function(e){ if (e.key === 'Escape') escAt = Date.now(); }, true);
    setInterval(function(){
      try{
        if (!escAt || Date.now() - escAt > 1500) return;
        var w = document.getElementById('bd-bus-modal');
        if (!w || !onScreen(w)) { escAt = 0; return; }
        escAt = 0;
        var btn = w.querySelector('[data-close="1"]');
        if (btn) btn.click(); else { try{ w.remove(); }catch(e2){} }
        try{ window.__bdBusModalOpen = false; }catch(e3){}
      }catch(err){}
    }, 200);
  })();

  /* ───────── ②-c 캐릭터 선택을 취소하면 타이틀로 돌아온다 ─────────
     「시작하기」를 누르면 타이틀이 먼저 사라지고 캐릭터 선택 창이 뜬다.
     이 창을 ESC 로 닫으면 타이틀도 게임 화면도 없는 «빈 배경»에 갇혀
     새로고침 말고는 빠져나올 방법이 없었다. (실측 확인)
     → 확정하지 않고 닫혔으면 타이틀을 다시 띄운다. */
  var setupWasOpen = false, setupClosedAt = 0;
  setInterval(function(){
    try{
      var m = document.getElementById('bd-startsetup-modal');
      var open = !!(m && m.classList.contains('show') && onScreen(m));
      if (open){ setupWasOpen = true; setupClosedAt = 0; return; }
      if (!setupWasOpen) return;
      if (!setupClosedAt){ setupClosedAt = Date.now(); return; }
      if (Date.now() - setupClosedAt < 1200) return;   // 「모험 시작」으로 닫힌 경우를 기다린다
      setupWasOpen = false; setupClosedAt = 0;

      var gs = document.getElementById('game-screen');
      if (gs && getComputedStyle(gs).display === 'block') return;   // 정상적으로 게임이 시작됨
      var t = document.getElementById('bd-title-screen');
      if (t && !t.classList.contains('show')){
        t.classList.add('show');
        try{ window.__bdTitleShown = false; }catch(e){}
        try{ if (window.BD_toast) BD_toast('타이틀 화면으로 돌아왔어요'); }catch(e){}
        try{ console.info('[v147] 캐릭터 선택 취소 — 타이틀로 복귀했습니다.'); }catch(e){}
      }
    }catch(e){}
  }, 300);

  /* ───────── ③-1 회복 안내는 건물 «앞»을 가리킨다 ─────────
     회복 안내는 건물 사각형(rx,ry,rw,rh)을 그대로 목표로 삼았다.
     큰 건물은 사각형 한가운데가 «벽 속»이라 화살표가 들어갈 수 없는 곳을 가리켰다.
     → 세로로 큰 건물이면 아래쪽(길 쪽) 가장자리 바로 앞을 가리키도록 옮긴다. */
  setInterval(function(){
    try{
      var cur = window.__bdNavOverride;
      if (!cur || !cur.__rest || cur.__bdFronted) return;
      if (!(cur.rw > 0.12 || cur.rh > 0.06)) { cur.__bdFronted = true; return; }
      cur.ry = Math.min(0.96, cur.ry + cur.rh);
      cur.rh = 0.022;
      cur.rx = cur.rx + Math.max(0, (cur.rw - 0.06)) / 2;
      cur.rw = Math.min(cur.rw, 0.06);
      cur.__bdFronted = true;
    }catch(e){}
  }, 400);

  /* ───────── ③-2 맵이 바뀌면 이전 목표는 버린다 ─────────
     길안내 목표는 «그 맵 안의 좌표»다. 회복 안내·지역 이동 안내가 남은 채
     다른 맵으로 들어가면, 그 맵에 없는 자리를 계속 가리켜 길을 잃는다.
     (실측: 상리에서 문화의집으로 들어갔더니 상리의 카페를 계속 가리켰다) */
  var lastNavStage = null;
  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined') return;
      var sid = Number(currentStage);
      if (lastNavStage === null){ lastNavStage = sid; return; }
      if (sid === lastNavStage) return;
      lastNavStage = sid;
      var cur = window.__bdNavOverride;
      if (cur && (cur.__rest || cur.__travel || cur.__exit)) window.__bdNavOverride = null;
    }catch(e){}
  }, 300);

  /* ───────── ④ 최후의 안전망 ─────────
     이동키를 3초 넘게 누르고 있는데 좌표가 전혀 변하지 않고
     화면에 아무 UI도 없다면, 잠금 후보를 모두 풀어 준다. */
  var pressing = false, lastPos = null, stuckSince = 0;
  document.addEventListener('keydown', function(e){
    var k = (e.key||'').toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k) >= 0) pressing = true;
  }, true);
  document.addEventListener('keyup', function(){ pressing = false; }, true);

  setInterval(function(){
    try{
      if (!pressing) { stuckSince = 0; return; }
      if (typeof heroX === 'undefined') return;
      try{ if (window.HSR && HSR.active) { stuckSince = 0; return; } }catch(e){}
      var pos = heroX.toFixed(4) + ',' + heroY.toFixed(4);
      if (pos !== lastPos){ lastPos = pos; stuckSince = 0; return; }
      if (!stuckSince){ stuckSince = Date.now(); return; }
      if (Date.now() - stuckSince < 3000) return;
      stuckSince = 0;
      // 화면에 진짜로 무언가 떠 있으면 정상 상태 — 건드리지 않는다
      if (cutsceneUiUp()) return;
      if ([].slice.call(document.querySelectorAll('.bd-modal.show')).some(onScreen)) return;
      var ch = document.getElementById('bd-choice'); if (onScreen(ch)) return;
      window.__bdSceneActive = false;
      try{ window.dialogueOpen = false; }catch(e){}
      var ov = document.getElementById('dialogue-overlay');
      if (ov && !onScreen(document.getElementById('dialogue-box'))) ov.style.display = 'none';
      var bdd = document.getElementById('bd-dialog');
      if (bdd && !onScreen(bdd)) { bdd.style.display = 'none'; bdd.classList.remove('show'); }
      try{ console.info('[v147] 조작 잠김을 감지해 강제로 복구했습니다.'); }catch(e){}
    }catch(e){}
  }, 500);
})();
