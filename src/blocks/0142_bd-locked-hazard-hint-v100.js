
/* (v100) 잠긴 위험요소가 왜 상호작용되지 않는지 알 수 없던 문제
   · 가까이 가야만 대사로 알 수 있어, 플레이어는 "버그"로 느낀다.
   · 근처에 서면 위험요소 위에 상태 배지를 띄워 이유를 즉시 알려준다.
     🔒 다른 동네  /  🧹 튜토리얼 먼저  /  ❗ 주민 부탁 필요 */
(function(){
  'use strict';
  var el = null;
  function badge(){
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bd-locked-hint';
    el.style.cssText = 'position:fixed;z-index:1500;padding:6px 12px;border-radius:999px;'
      + 'background:rgba(20,24,36,.94);border:1px solid rgba(255,216,107,.55);color:#ffe9a8;'
      + 'font-size:12px;font-weight:700;white-space:nowrap;pointer-events:none;'
      + 'transform:translate(-50%,-100%);opacity:0;transition:opacity .18s ease;'
      + 'box-shadow:0 6px 16px rgba(0,0,0,.45);';
    document.body.appendChild(el);
    return el;
  }
  function nearestLockedHazard(){
    try{
      var st = STAGES[Number(currentStage)]; if (!st) return null;
      var R = (typeof HERO_WR !== 'undefined' ? HERO_WR : 0.022) * 2 * 3.0;   // 조금 넉넉히
      var best = null, bd = 1e9;
      (st.objects||[]).forEach(function(o){
        if (!o || o.hidden || o.interactable !== 'hazard' || !o.hazardId) return;
        if (window.BD && BD.purified && BD.purified[o.hazardId]) return;
        var cx = (o.rx||0)+(o.rw||0)/2, cy = (o.ry||0)+(o.rh||0);
        var d = Math.hypot(heroX-cx, heroY-cy);
        if (d <= R && d < bd){ bd = d; best = o; }
      });
      return best;
    }catch(e){ return null; }
  }
  function reason(o){
    try{
      if (typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(o)) return '🔒 아직 열리지 않은 상대';
      var g = window.BD_hzQuestGate ? BD_hzQuestGate(o) : false;
      if (g === 'region') return '🔒 지금은 다른 동네 차례예요';
      if (g === 'tuto')   return '🧹 먼저 쓰레기부터 정화해요';
      if (g === true)     return '❗ 주민에게 부탁을 먼저 받아요';
      return null;   // 잠기지 않음
    }catch(e){ return null; }
  }
  setInterval(function(){
    try{
      var b = badge();
      if ((window.HSR && HSR.active) || document.getElementById('dialogue-overlay')?.offsetHeight){
        b.style.opacity = '0'; return;
      }
      var o = nearestLockedHazard();
      if (!o){ b.style.opacity = '0'; return; }
      var r = reason(o);
      if (!r){ b.style.opacity = '0'; return; }
      var cv = document.getElementById('game-canvas'); if (!cv){ b.style.opacity='0'; return; }
      /* (v372) toScreenX/Y 는 캔버스 «백버퍼 px»(DPR·배율 반영 안 됨)라 배지가 오른쪽·아래로 밀렸다
         → BD_screenRectOfWorld(CSS px) + body zoom 보정 */
      var wr = (typeof window.BD_screenRectOfWorld === 'function')
        ? BD_screenRectOfWorld(Number(o.rx||0), Number(o.ry||0), Math.max(Number(o.rw||0), 0.01), Math.max(Number(o.rh||0), 0.01)) : null;
      if (!wr){ b.style.opacity='0'; return; }
      var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}
      b.textContent = r;
      b.style.left = ((wr.left + wr.width / 2) / z) + 'px';
      b.style.top  = ((wr.top - 8) / z) + 'px';
      b.style.opacity = '1';
    }catch(e){}
  }, 250);
})();
