
/* (v147) 한 리를 다 끝내면 «다음 리로 가는 길»을 아무도 알려 주지 않던 문제.
   ────────────────────────────────────────────────────────────
   실측: 와우리 부탁을 모두 해결해 2장(상리)이 시작되면
         · BD_currentGuide() 는 이 리에 남은 목표가 없어 null
         · 화살표(__bdNavOverride)도 사라진다
   → 「도로 끝으로 걸어가면 옆 리로 넘어간다」는 규칙을 알 수 없어 그대로 멈춘다.
   진행 중인 장의 리가 다른 맵이면, 그 리로 이어지는 도로 끝을 계속 가리킨다. */
(function(){
  'use strict';
  var IDS   = [210, 211, 212, 213];
  var NAMES = { 212:'와우리', 213:'상리', 211:'동화리', 210:'수영리' };

  /* 관문(도로 끝) 한 곳의 목표 사각형 */
  function gateRect(g){
    var at = Number(g.at) || 0.5;
    if (g.side === 'top')    return { rx: at - 0.02, ry: 0.004, rw: 0.04, rh: 0.022 };
    if (g.side === 'bottom') return { rx: at - 0.02, ry: 0.974, rw: 0.04, rh: 0.022 };
    if (g.side === 'left')   return { rx: 0.004, ry: at - 0.02, rw: 0.022, rh: 0.04 };
    return { rx: 0.974, ry: at - 0.02, rw: 0.022, rh: 0.04 };
  }

  /* 목표 리까지 가려면 «지금 맵에서» 어느 리로 먼저 넘어가야 하는가 */
  function nextHop(from, to){
    try{
      if (from === to) return null;
      var seen = {}, q = [[from, null]];
      seen[from] = true;
      while (q.length){
        var cur = q.shift(), sid = cur[0], first = cur[1];
        var st = STAGES[sid]; if (!st) continue;
        var gates = st.districtGates || [];
        for (var i = 0; i < gates.length; i++){
          var nx = Number(gates[i].nextStage);
          var f  = (first == null) ? nx : first;
          if (nx === to) return f;
          if (!seen[nx]){ seen[nx] = true; q.push([nx, f]); }
        }
      }
    }catch(e){}
    return null;
  }

  /* 그 방향 관문 중 지금 위치에서 가장 가까운 곳 */
  function bestGate(st, nextSid){
    var best = null, bestD = Infinity;
    (st.districtGates || []).forEach(function(g){
      if (Number(g.nextStage) !== Number(nextSid)) return;
      var r = gateRect(g);
      var cx = r.rx + r.rw / 2, cy = r.ry + r.rh / 2;
      var d = Math.hypot(cx - heroX, cy - heroY);
      if (d < bestD){ bestD = d; best = r; }
    });
    return best;
  }

  var announced = null;

  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined' || typeof STAGES === 'undefined') return;
      var sid = Number(currentStage);
      var cur = window.__bdNavOverride;

      if (IDS.indexOf(sid) < 0){
        if (cur && cur.__travel) window.__bdNavOverride = null;
        return;
      }
      var want = null;
      try{ want = window.BD_allowedStage ? BD_allowedStage() : null; }catch(e){}
      if (!want || Number(want) === sid){
        if (cur && cur.__travel) window.__bdNavOverride = null;
        announced = null;
        return;
      }
      if (window.HSR && window.HSR.active) return;

      /* 이 리에 아직 할 일(부탁·정화·보고)이 남아 있으면 그쪽이 우선 */
      var g = null;
      try{ g = window.BD_currentGuide && BD_currentGuide(); }catch(e){}
      if (g){
        if (cur && cur.__travel) window.__bdNavOverride = null;
        return;
      }
      /* 휴식 안내 등 다른 안내가 떠 있으면 존중한다 */
      if (cur && !cur.__travel && !cur.__guide) return;

      var hop = nextHop(sid, Number(want));
      if (!hop) return;
      var st = STAGES[sid];
      var r  = bestGate(st, hop);
      if (!r) return;

      var nm = NAMES[Number(want)] || '다음 지역';
      window.__bdNavOverride = {
        rx: r.rx, ry: r.ry, rw: r.rw, rh: r.rh,
        label: nm + '로 가기',
        _guideLabel: nm + ' 방향 도로 끝으로',
        __travel: true
      };

      /* 장이 바뀐 직후 한 번만 안내한다 */
      if (announced !== nm){
        announced = nm;
        try{ if (window.BD_toast) BD_toast('🚶 ' + nm + ' 방향 도로 끝까지 걸어가면 넘어갈 수 있어요', 4200); }catch(e){}
        try{ setTimeout(function(){
          if (window.BD_DAMI && BD_DAMI.show)
            BD_DAMI.show('이제 ' + nm + ' 차례예요! 화살표를 따라 도로 끝까지 가면 넘어갈 수 있어요.', { face:'base' });
        }, 1400); }catch(e){}
      }
    }catch(e){}
  }, 700);
})();
