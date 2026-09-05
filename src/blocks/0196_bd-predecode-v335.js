
/* (v335) 스테이지 입장 프리디코드 — 밀집 구역 첫 진입 프레임 드랍(동기 디코드 스파이크) 제거 */
(function(){
  'use strict';
  var warmed = {};
  function warmStage(sid){
    if (!sid || warmed[sid]) return;
    warmed[sid] = true;
    try{
      var st = (typeof STAGES !== 'undefined') && STAGES[sid]; if (!st) return;
      var ids = [];
      (st.objects || []).forEach(function(o){
        if (!o || o.hidden) return;
        var aid = o.assetId || (String(o.key || '').indexOf('asset:') === 0 ? String(o.key).slice(6) : null);
        if (aid && ids.indexOf(aid) < 0) ids.push(aid);
      });
      ids.forEach(function(aid, i){
        setTimeout(function(){
          try{
            var im = (typeof window.BD_getAssetImage === 'function') ? BD_getAssetImage(aid) : null;
            if (im && im.decode) im.decode().catch(function(){});
          }catch(e){}
        }, 40 * i);   /* 한 프레임에 몰리지 않게 분산 */
      });
    }catch(e){}
  }
  var last = null;
  setInterval(function(){
    try{
      if (typeof currentStage === 'undefined') return;
      var sid = Number(currentStage);
      if (sid !== last){
        last = sid;
        warmStage(sid);
        /* 게이트로 이어지는 이웃 맵도 잠시 뒤 선워밍 — 지역 이동 직후 스파이크 방지 */
        var st = STAGES[sid];
        ((st && st.districtGates) || []).forEach(function(g){
          if (g && g.nextStage) setTimeout(function(){ warmStage(Number(g.nextStage)); }, 1500);
        });
      }
    }catch(e){}
  }, 400);
})();
