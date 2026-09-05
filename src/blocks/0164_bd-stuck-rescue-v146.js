
/* (v146) 정화한 위험요소 콜라이더에 갇혀 움직일 수 없던 문제
   ────────────────────────────────────────────────────────────
   조사하려고 위험요소에 바짝 붙은 상태에서 전투가 시작되고,
   전투가 끝나 돌아오면 그 자리가 «콜라이더 안»이라 사방이 막힌다.
   (조작 차단은 풀렸는데 물리적으로 갇힌 상태 — 실측으로 확인)

   해법 ①: 정화된 위험요소는 콜라이더를 없앤다 (이미 치웠으니 막을 이유가 없다)
   해법 ②: 그래도 갇히면 가장 가까운 빈 자리로 살짝 밀어낸다 */
(function(){
  'use strict';

  function rectOf(o){
    var x = (o.cx != null ? o.cx : o.rx);
    var y = (o.cy != null ? o.cy : o.ry);
    var w = (o.cw != null ? o.cw : o.rw);
    var h = (o.ch != null ? o.ch : o.rh);
    return (w && h) ? { x:x, y:y, w:w, h:h } : null;
  }

  /* ① 정화된 위험요소의 콜라이더 해제 */
  function clearPurifiedColliders(){
    try{
      var pur = (window.BD && BD.purified) || {};
      Object.keys(STAGES || {}).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !st.objects) return;
        st.objects.forEach(function(o){
          if (!o || o.interactable !== 'hazard' || !o.hazardId) return;
          if (!pur[o.hazardId]) return;
          if (o.__bdColCleared) return;
          o.__bdColCleared = true;
          o.solid = false;
          o.cw = 0; o.ch = 0;      // 지나갈 수 있게
        });
      });
    }catch(e){}
  }

  /* ② 갇힘 감지 → 안전한 자리로 밀어내기 */
  var lastPos = null, sameSince = 0, pressing = false;
  document.addEventListener('keydown', function(e){
    var k = (e.key || '').toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].indexOf(k) >= 0) pressing = true;
  }, true);
  document.addEventListener('keyup', function(){ pressing = false; }, true);

  function insideAnyCollider(x, y){
    try{
      var st = STAGES[Number(currentStage)];
      if (!st || !st.objects) return null;
      for (var i = 0; i < st.objects.length; i++){
        var o = st.objects[i]; if (!o) continue;
        var r = rectOf(o); if (!r) continue;
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return { obj:o, rect:r };
      }
    }catch(e){}
    return null;
  }

  setInterval(function(){
    try{
      clearPurifiedColliders();

      if (window.HSR && HSR.active) { sameSince = 0; return; }
      if (typeof heroX === 'undefined') return;
      if (typeof window.BD_isInputBlocked === 'function' && BD_isInputBlocked()){ sameSince = 0; return; }

      var pos = heroX.toFixed(4) + ',' + heroY.toFixed(4);
      if (pos !== lastPos){ lastPos = pos; sameSince = 0; return; }

      // 키를 누르고 있는데 1.2초 넘게 제자리 → 갇힘 의심
      if (!pressing) { return; }
      if (!sameSince){ sameSince = Date.now(); return; }
      if (Date.now() - sameSince < 1200) return;

      var hit = insideAnyCollider(heroX, heroY);
      if (!hit){ sameSince = 0; return; }

      // 콜라이더 밖으로 가장 가까운 방향으로 밀어낸다
      var r = hit.rect, m = 0.012;
      var dLeft   = heroX - r.x;
      var dRight  = (r.x + r.w) - heroX;
      var dUp     = heroY - r.y;
      var dDown   = (r.y + r.h) - heroY;
      var min = Math.min(dLeft, dRight, dUp, dDown);
      if (min === dLeft)       heroX = r.x - m;
      else if (min === dRight) heroX = r.x + r.w + m;
      else if (min === dUp)    heroY = r.y - m;
      else                     heroY = r.y + r.h + m;
      try{ camX = heroX; camY = heroY; }catch(e){}
      try{ console.info('[v146] 콜라이더에 갇혀 안전한 자리로 이동했습니다 (' +
                        (hit.obj.label || '오브젝트') + ')'); }catch(e){}
      sameSince = 0;
    }catch(e){}
  }, 400);
})();
