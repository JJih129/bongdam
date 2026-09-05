
/* (v293)
   · BD_screenRectOfObject — 059 스포트라이트의 'obj:라벨' 타깃 지원 (월드 → 화면 좌표)
   · 프롤로그(035) 단계별 스포트라이트 — 강조 외 반투명 배경
   · 플레이어 최상위 재드로우 — 모든 스프라이트 위에 표시 */
(function(){
  'use strict';
  function cvRect(){
    var cv = document.getElementById('game-canvas');
    if (!cv || !cv.width) return null;
    var r = cv.getBoundingClientRect();
    return { cv: cv, r: r, sx: r.width / cv.width, sy: r.height / cv.height };
  }
  function worldRect(rx, ry, rw, rh){
    try{
      var c = cvRect(); if (!c) return null;
      var x1 = toScreenX(rx, c.cv), y1 = toScreenY(ry, c.cv);
      var x2 = toScreenX(rx + rw, c.cv), y2 = toScreenY(ry + rh, c.cv);
      var out = { left: c.r.left + x1 * c.sx, top: c.r.top + y1 * c.sy,
                  width: (x2 - x1) * c.sx, height: (y2 - y1) * c.sy };
      if (out.width < 4 || out.height < 4) return null;
      return out;
    }catch(e){ return null; }
  }
  window.BD_screenRectOfWorld = worldRect;
  window.BD_screenRectOfObject = function(labelPrefix){
    try{
      var st = STAGES[currentStage]; if (!st) return null;
      var o = (st.objects || []).find(function(x){
        return x && String(x.label || '').indexOf(labelPrefix) === 0 && !x.hidden && !x.__bdGone; });
      if (!o) return null;
      return worldRect(Number(o.rx || 0), Number(o.ry || 0), Number(o.rw || 0.05), Number(o.rh || 0.06));
    }catch(e){ return null; }
  };

  /* ── 프롤로그 단계별 스포트라이트 (035 단계 머신 연동) ── */
  function hole(){
    var d = document.getElementById('bd-spot2');
    if (!d){
      d = document.createElement('div');
      d.id = 'bd-spot2';
      d.style.cssText = 'position:fixed;display:none;pointer-events:none;z-index:845;border-radius:12px;'
        + 'box-shadow:0 0 0 9999px rgba(0,0,0,.55);border:3px solid rgba(255,216,107,.9);'
        + 'transition:all .25s ease;';
      document.body.appendChild(d);
    }
    return d;
  }
  function prologueTarget(){
    try{
      if (localStorage.getItem('bd_tut2_done') === '1') return null;
      if (typeof currentStage === 'undefined' || Number(currentStage) !== 101) return null;
      var step = window.__bdTut2Step;
      if (typeof step !== 'number' || step < 0) return null;
      var vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) return null;
      if (window.__bdSceneActive || window.__bdDamiIntroBusy || window.__bdDamiOpeningBusy) return null;
      var gs = document.getElementById('game-screen');
      if (!gs || gs.style.display !== 'block') return null;
      if (step === 0 || step === 2){
        var kb = document.getElementById('bd-keybar');
        if (kb && kb.offsetHeight){ var r = kb.getBoundingClientRect(); return { left:r.left, top:r.top, width:r.width, height:r.height }; }
        return null;
      }
      if (step === 1) return window.BD_screenRectOfObject('문화의집 선생님');
      if (step === 3) return worldRect(0.655, 0.065, 0.09, 0.175);   /* 엘리베이터 존 */
      return null;
    }catch(e){ return null; }
  }
  setInterval(function(){
    var d = hole();
    try{
      /* 메인 튜토(059)가 자체 스포트라이트를 쓰는 중이면 양보 */
      if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()){ d.style.display = 'none'; return; }
      var t = prologueTarget();
      if (!t){ d.style.display = 'none'; return; }
      var pad = 8;
      var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}   /* (v369) UI 배율 보정 */
      d.style.left = ((t.left - pad) / z) + 'px';
      d.style.top = ((t.top - pad) / z) + 'px';
      d.style.width = ((t.width + pad * 2) / z) + 'px';
      d.style.height = ((t.height + pad * 2) / z) + 'px';
      d.style.display = 'block';
    }catch(e){ d.style.display = 'none'; }
  }, 200);

  /* ── 플레이어 최상위 드로우 — 필드 렌더 마지막 훅(BD_drawNpcQuestMarks)에 편승
     (v336) 이중 드로우 제거: 평소엔 여기가 «유일한» 풀 드로우(대시 발광 포함).
     건물에 가려지면(occ) Y정렬 패스가 원본을 그리고 여기선 단색 실루엣만 덧그려
     «건물 뒤에 있다»는 깊이감과 캐릭터 위치 가독성을 동시에 확보한다(디아블로/LoL 방식). ── */
  var _silCv = null, _silCtx = null;
  function wrapTop(){
    try{
      if (!window.BD_drawNpcQuestMarks || window.BD_drawNpcQuestMarks.__v293top) return;
      var prev = window.BD_drawNpcQuestMarks;
      window.BD_drawNpcQuestMarks = function(ctx, canvas, stage){
        try{ prev.apply(this, arguments); }catch(eP){}
        try{
          var h = window.__bdHeroDraw;
          if (!h || !h.sp || !h.sp.complete || !h.sp.naturalWidth) return;
          if (h.__topDone) return;                          // 프레임당 1회 — 래퍼가 겹겹이 쌓여도 중복 드로우 방지
          h.__topDone = true;
          var dw = h.w, dx = h.x;
          if (h.keep){ dw = h.h * (h.sp.naturalWidth / h.sp.naturalHeight); dx = h.x + (h.w - dw) / 2; }
          var s = ctx.imageSmoothingEnabled;
          if (h.occ){
            // 실루엣: 오프스크린 캔버스 1장 재사용 — 스프라이트 → source-in 단색 → 알파 45%
            var cw = Math.max(1, Math.ceil(dw)), chh = Math.max(1, Math.ceil(h.h));
            if (!_silCv){ _silCv = document.createElement('canvas'); _silCtx = _silCv.getContext('2d'); }
            if (_silCv.width < cw) _silCv.width = cw;
            if (_silCv.height < chh) _silCv.height = chh;
            _silCtx.clearRect(0, 0, _silCv.width, _silCv.height);
            _silCtx.imageSmoothingEnabled = false;
            _silCtx.drawImage(h.sp, 0, 0, cw, chh);
            _silCtx.globalCompositeOperation = 'source-in';
            _silCtx.fillStyle = '#bfe3ff';
            _silCtx.fillRect(0, 0, cw, chh);
            /* (v339) «가린 만큼만» — 가린 구조물 픽셀과의 교집합으로 마스킹 (destination-in) */
            try{
              if (h.occRects && h.occRects.length){
                _silCtx.globalCompositeOperation = 'destination-in';
                h.occRects.forEach(function(orc){
                  var lx = orc.x - dx, ly = orc.y - h.y;
                  if (orc.img) _silCtx.drawImage(orc.img, lx, ly, orc.w, orc.h);
                  else _silCtx.fillRect(lx, ly, orc.w, orc.h);
                });
              }
            }catch(eMk){}
            _silCtx.globalCompositeOperation = 'source-over';
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(_silCv, 0, 0, cw, chh, dx, h.y, cw, chh);
            ctx.restore();
          } else {
            if (h.dash){ ctx.save(); ctx.shadowColor = 'rgba(100, 200, 255, 0.9)'; ctx.shadowBlur = 16 * (h.cs || 1); }
            if (h.pix) ctx.imageSmoothingEnabled = false;
            ctx.drawImage(h.sp, dx, h.y, dw, h.h);
            if (h.dash) ctx.restore();
          }
          ctx.imageSmoothingEnabled = s;
        }catch(e2){}
      };
      window.BD_drawNpcQuestMarks.__v293top = true;
      /* (v336) 이전 래퍼 체인의 마커(__v289 등) 보존 — 마커 유실 → 상호 재설치 폭풍 → 중복 드로우 방지 */
      try{ for (var mkT in prev){ if (mkT.indexOf('__') === 0 && !(mkT in window.BD_drawNpcQuestMarks)) window.BD_drawNpcQuestMarks[mkT] = prev[mkT]; } }catch(eMkT){}
    }catch(e){}
  }
  if (window.BD_addTick) BD_addTick(wrapTop, 1200); else setInterval(wrapTop, 1200);
})();
