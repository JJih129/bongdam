
/* (v289) 상호작용 가이드
   · 현재 F 대상 하이라이트 — 범위에 들어온 대상에 금색 점선 테두리 + [F] 배지
   · 유휴 시설 유도 — 다른 안내가 없을 때 발 앞 화살표가 미방문 시설을 가리킴
   · 미방문 시설 ❔ 마커 — 지도를 채울 대상을 필드에서 바로 인지 */
(function(){
  'use strict';
  /* (v290) 지도에서 고른 시설을 추적하는 동안 다른 안내가 화살표를 덮지 않게 */
  (function(){
    var _v = window.__bdNavOverride;
    try{
      Object.defineProperty(window, '__bdNavOverride', {
        configurable: true,
        get: function(){ return _v; },
        set: function(nv){
          if (window.__bdMapTrackFid && nv && !nv.__mapNav && !nv.__rest) return;   /* 추적 우선 · 휴식 안내는 예외 */
          _v = nv;
        }
      });
    }catch(e){}
  })();
  function el(id){ return document.getElementById(id); }
  function busyUI(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.__bdSceneActive) return true;
      var vn = el('dialogue-box'); if (vn && vn.offsetHeight > 0) return true;
      var dlg = el('bd-dialog'); if (dlg && dlg.classList.contains('show')) return true;
      var fm = el('bd-district-facility-modal'); if (fm && fm.classList.contains('open')) return true;
      if (window.__bdBusModalOpen) return true;
      if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return true;
      var gs = el('game-screen'); if (!gs || gs.style.display !== 'block') return true;
    }catch(e){}
    return false;
  }
  function visits(){
    try{ return (JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1')||'{}').visitedFacilityIds)||[]; }
    catch(e){ return []; }
  }
  function toScreenCss(mx, my){
    try{
      var cv = el('game-canvas'); if (!cv) return null;
      var rect = cv.getBoundingClientRect();
      var px = ((((mx - camX) / VIEWPORT_W + 0.5) * BASE_W) - BASE_W / 2) * currentScale + cv.width / 2;
      var py = ((((my - camY) / VIEWPORT_H + 0.5) * BASE_H) - BASE_H / 2) * currentScale + cv.height / 2;
      return { x: rect.left + px / (cv.width / rect.width), y: rect.top + py / (cv.height / rect.height) };
    }catch(e){ return null; }
  }

  /* ── ① F 대상 하이라이트 ── */
  function hiBox(){
    var d = el('bd-f-target');
    if (!d){
      d = document.createElement('div');
      d.id = 'bd-f-target';
      d.style.cssText = 'position:fixed;z-index:880;display:none;pointer-events:none;'
        + 'border:2px dashed rgba(255,216,107,.95);border-radius:10px;'
        + 'box-shadow:0 0 10px rgba(255,216,107,.35);transition:left .1s,top .1s,width .1s,height .1s;';
      var tag = document.createElement('div');
      tag.id = 'bd-f-target-tag';
      tag.style.cssText = 'position:absolute;top:-22px;left:50%;transform:translateX(-50%);'
        + 'background:rgba(20,26,44,.92);color:#ffd86b;border:1px solid rgba(255,216,107,.7);'
        + 'border-radius:7px;padding:1px 8px;font-size:11px;font-weight:800;white-space:nowrap;';
      tag.textContent = 'F';
      d.appendChild(tag);
      document.body.appendChild(d);
    }
    return d;
  }
  function pickTarget(){
    try{
      var st = STAGES[currentStage]; if (!st) return null;
      var bw = Number(st.bgW || 1448), bh = Number(st.bgH || 1086);
      /* 시설 */
      var fac = null, facD = Infinity;
      try{
        var lm = window.BD_v24NearestFacility && BD_v24NearestFacility();
        if (lm){
          facD = Math.hypot((heroX - Number(lm.interactionX)) * bw, (heroY - Number(lm.interactionY)) * bh);
          fac = lm;
        }
      }catch(eF){}
      /* 주민 */
      var res = null, resD = Infinity;
      (st.objects || []).forEach(function(o){
        if (!o || !o.resident || o.hidden || o._hyunji) return;
        var x0 = o.rx, y0 = o.ry, x1 = x0 + (o.rw || 0.05), y1 = y0 + (o.rh || 0.075);
        var dx = Math.max(x0 - heroX, 0, heroX - x1), dy = Math.max(y0 - heroY, 0, heroY - y1);
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 0.04 && d * bw < resD){ resD = d * bw; res = o; }
      });
      /* 위험요소 */
      var hz = null, hzD = Infinity;
      (st.objects || []).forEach(function(o){
        if (!o || o.interactable !== 'hazard' || !o.hazardId || o.hidden || o.__bdGone) return;
        try{ if (window.BD_hazardLocked && BD_hazardLocked(o)) return; }catch(eL){}
        try{ if (window.BD_isPurified && BD_isPurified(o.hazardId || o.id || o.label)) return; }catch(eP){}
        var cx = o.rx + (o.rw || 0)/2, cy = o.ry + (o.rh || 0)/2;
        var d = Math.hypot(heroX - cx, heroY - cy);
        if (d <= 0.05 && d < hzD){ hzD = d; hz = o; }
      });
      /* 버스 */
      var bus = null, busD = Infinity;
      (st.objects || []).forEach(function(o){
        if (!o || o.interactable !== 'bus_stop' || !o.busStopId) return;
        var cx = o.rx + (o.rw || 0)/2, cy = o.ry + (o.rh || 0);
        var d = Math.hypot(heroX - cx, heroY - cy);
        if (d <= 0.05 && d < busD){ busD = d; bus = o; }
      });
      /* 우선순위 — 라우팅 규칙과 동일: 주민(더 가까우면) > 시설 > 위험요소 > 버스 */
      if (res && (facD === Infinity || (resD <= 65 && resD < facD))) return { o: res, kind: '대화' };
      if (fac && facD <= 85){
        if (bus){
          var bcx = bus.rx + (bus.rw||0)/2, bcy = bus.ry + (bus.rh||0);
          var busPx = Math.hypot((heroX - bcx) * bw, (heroY - bcy) * bh);
          if (busPx < facD) return { o: bus, kind: '버스' };
        }
        return { o: fac, kind: '이용' };
      }
      if (hz) return { o: hz, kind: '조사' };
      if (bus) return { o: bus, kind: '버스' };
      return null;
    }catch(e){ return null; }
  }
  function tickHi(){
    var d = hiBox();
    try{
      if (busyUI()){ d.style.display = 'none'; return; }
      var t = pickTarget();
      if (!t){ d.style.display = 'none'; return; }
      var o = t.o;
      var rx = Number(o.rx || 0), ry = Number(o.ry || 0);
      var rw = Number(o.rw || 0.05), rh = Number(o.rh || 0.075);
      var p1 = toScreenCss(rx, ry), p2 = toScreenCss(rx + rw, ry + rh);
      if (!p1 || !p2){ d.style.display = 'none'; return; }
      var w = p2.x - p1.x, h = p2.y - p1.y;
      /* 큰 건물은 상호작용 지점 주변 소형 박스로 */
      if (w > 260 || h > 260){
        var ix = Number(o.interactionX || (rx + rw / 2)), iy = Number(o.interactionY || (ry + rh / 2));
        var c = toScreenCss(ix, iy); if (!c){ d.style.display = 'none'; return; }
        p1 = { x: c.x - 55, y: c.y - 55 }; w = 110; h = 110;
      }
      /* (v372) body zoom(UI 배율) 보정 — 배율≠100% 에서 점선 상자가 대상에서 밀려나던 문제 */
      var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}
      d.style.left = ((p1.x - 6) / z) + 'px';
      d.style.top = ((p1.y - 6) / z) + 'px';
      d.style.width = ((w + 12) / z) + 'px';
      d.style.height = ((h + 12) / z) + 'px';
      /* (v393) 터치 기기는 F 키 대신 «탭» 으로 안내 — 아이들이 바로 이해하는 문법 */
      el('bd-f-target-tag').textContent = (document.documentElement.classList.contains('bd-touch-mode')
        ? String.fromCodePoint(0x1F446) + ' 탭 · ' : 'F · ') + t.kind;
      d.style.display = 'block';
    }catch(e){ d.style.display = 'none'; }
  }

  /* ── ② 유휴 시설 유도 — 다른 안내가 없으면 미방문 시설로 화살표 ── */
  function tickNav(){
    try{
      if (busyUI()) return;
      if (!(window.BD_PROGRESS && BD_PROGRESS.story.badgeAwakened)) return;
      var cur = null;
      try{ cur = window.BD_currentGuide && BD_currentGuide(); }catch(eG){}
      /* (v290) 지도에서 직접 고른 시설은 다른 안내보다 우선 */
      if (cur && !window.__bdMapTrackFid){ if (window.__bdNavOverride && window.__bdNavOverride.__mapNav) window.__bdNavOverride = null; return; }
      if (window.__bdNavOverride && !window.__bdNavOverride.__mapNav && !window.__bdMapTrackFid) return;   /* (v290) 지도 선택은 우선 */
      var RID = { 212:'wawoo', 213:'sang', 211:'donghwa', 210:'suyeong' }[Number(currentStage)];
      if (!RID){ if (window.__bdNavOverride && window.__bdNavOverride.__mapNav) window.__bdNavOverride = null; return; }
      var mp = window.BD_MapProgress ? BD_MapProgress.region(RID) : null;
      if (!mp || mp.pct >= 100){ if (window.__bdNavOverride && window.__bdNavOverride.__mapNav) window.__bdNavOverride = null; return; }
      var st = STAGES[currentStage]; if (!st) return;
      var vis = visits();
      var best = null, bd = Infinity;
      (st.__v24Landmarks || []).forEach(function(l){
        if (!l || !l.facilityId || !l.majorFacility || l.hidden) return;
        if (vis.indexOf(l.facilityId) >= 0){
          if (window.__bdMapTrackFid === l.facilityId) window.__bdMapTrackFid = null;   /* 방문 완료 → 추적 해제 */
          return;
        }
        if (window.__bdMapTrackFid && l.facilityId === window.__bdMapTrackFid){ best = l; bd = -1; return; }
        if (bd >= 0){
          var d = Math.hypot(heroX - Number(l.interactionX), heroY - Number(l.interactionY));
          if (d < bd){ bd = d; best = l; }
        }
      });
      if (!best){
        /* (v302) 미방문 시설이 없으면 → 정화 가능한 잔여 위험요소로 안내
           (선택 위험요소는 % 에 포함되지만 부탁 대상이 아니라 안내가 끊겼다) */
        var hzBest = null, hzD = Infinity;
        try{
          (st.objects || []).forEach(function(o){
            if (!o || o.hidden || o.interactable !== 'hazard' || !o.hazardId) return;
            if (o.isBoss || String(o.hazardId).indexOf('final_boss') === 0) return;
            if (window.BD && BD.purified && BD.purified[o.hazardId]) return;
            try{ if (typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(o)) return; }catch(eL){}
            try{ if (window.BD_hzQuestGate && BD_hzQuestGate(o)) return; }catch(eG){}
            var cx = (o.rx || 0) + (o.rw || 0) / 2, cy = (o.ry || 0) + (o.rh || 0) / 2;
            var d = Math.hypot(heroX - cx, heroY - cy);
            if (d < hzD){ hzD = d; hzBest = o; }
          });
        }catch(eHz){}
        if (hzBest){
          window.__bdNavOverride = { rx: hzBest.rx, ry: hzBest.ry,
            rw: hzBest.rw || 0.05, rh: hzBest.rh || 0.06,
            label: '\uD83D\uDCCD ' + (hzBest.label || '위험요소') + ' 정화',
            _guideLabel: '가까이 가서 F로 조사!', __mapNav: true };
          return;
        }
        if (window.__bdNavOverride && window.__bdNavOverride.__mapNav) window.__bdNavOverride = null; return; }
      var ix = Number(best.interactionX), iy = Number(best.interactionY);
      window.__bdNavOverride = { rx: ix - 0.02, ry: iy - 0.03, rw: 0.04, rh: 0.05,
        label: '📍 ' + (best.label || '시설'), _guideLabel: '가까이 가서 F로 확인!', __mapNav: true };
    }catch(e){}
  }

  /* ── ③ 미방문 시설 ❔ 마커 (필드 캔버스) ── */
  function wrapMarks(){
    try{
      if (!window.BD_drawNpcQuestMarks || window.BD_drawNpcQuestMarks.__v289) return;
      var orig = window.BD_drawNpcQuestMarks;
      window.BD_drawNpcQuestMarks = function(ctx, canvas, stage){
        orig.apply(this, arguments);
        try{
          if (!stage || stage.interior) return;
          if (window.HSR && HSR.active) return;
          if (!(window.BD_PROGRESS && BD_PROGRESS.story.badgeAwakened)) return;
          var vis = visits();
          var n = 0;
          (stage.__v24Landmarks || []).forEach(function(l){
            if (n >= 10 || !l || !l.facilityId || !l.majorFacility || l.hidden) return;
            if (vis.indexOf(l.facilityId) >= 0) return;
            var x = toScreenX(Number(l.interactionX), canvas);
            var y = toScreenY(Number(l.interactionY), canvas) - 26 * currentScale
                    - 2 * currentScale * Math.abs(Math.sin(Date.now() / 420));
            if (x < -30 || y < -30 || x > canvas.width + 30 || y > canvas.height + 30) return;
            n++;
            ctx.save();
            ctx.font = 'bold ' + Math.round(17 * currentScale) + 'px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0,0,0,.75)'; ctx.shadowBlur = 5 * currentScale;
            ctx.fillStyle = 'rgba(140,210,255,.95)';
            ctx.fillText('\u2754', x, y);
            ctx.restore();
          });
        }catch(e2){}
      };
      window.BD_drawNpcQuestMarks.__v289 = true;
      /* (v336) 이전 래퍼 체인의 마커(__v293top 등) 보존 — 마커 유실 → 상호 재설치 폭풍 → 중복 드로우 방지 */
      try{ for (var mk9 in orig){ if (mk9.indexOf('__') === 0 && !(mk9 in window.BD_drawNpcQuestMarks)) window.BD_drawNpcQuestMarks[mk9] = orig[mk9]; } }catch(eMk9){}
    }catch(e){}
  }

  setInterval(tickHi, 120);
  if (window.BD_addTick){ BD_addTick(tickNav, 1200); BD_addTick(wrapMarks, 1500); }
  else { setInterval(tickNav, 1200); setInterval(wrapMarks, 1500); }
})();
