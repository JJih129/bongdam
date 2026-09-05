
/* (v70) 구맵 서사 '현지' 완전 비활성 (신맵 사용 시)
   현지는 현재 4개 리 맵에 존재하지 않는 인물인데, 장이 넘어갈 때 '현지의 문자' 안내가 뜨고
   구맵용 현지 오브젝트가 남아 있어 흐름과 어긋났다. 신맵에서는 문자·오브젝트 모두 차단한다. */
(function(){
  'use strict';
  function newMap(){ try{ return !!(window.STAGES && STAGES[212] && STAGES[213]); }catch(e){ return false; } }

  /* ① 문자·팁 차단 — 제목/본문에 '현지'가 들어간 안내는 띄우지 않는다 */
  var tries = 0;
  var boot = setInterval(function(){
    tries++;
    if (typeof window.BD_tip === 'function' && !window.BD_tip.__v70){
      var orig = window.BD_tip;
      window.BD_tip = function(id, opt){
        try{
          if (newMap()){
            var t = (opt && (opt.title || '')) + ' ' + (opt && (opt.text || ''));
            if (/현지/.test(t) || /^sms_ch/.test(String(id||''))) return;
          }
        }catch(e){}
        return orig.apply(this, arguments);
      };
      window.BD_tip.__v70 = true;
      clearInterval(boot);
    }
    if (tries > 400) clearInterval(boot);
  }, 200);

  /* ② 구맵 현지 오브젝트 제거
      (v132) 매 프레임 수준(1ms)으로 모든 스테이지를 훑던 것을 정리한다.
      한 번 제거하면 다시 생기지 않으므로, 초반에 몇 번만 확인하고 멈춘다. */
   (function(){
     var pass = 0;
     var iv = setInterval(function(){
    try{
      if (!newMap() || typeof STAGES === 'undefined') return;
      Object.keys(STAGES).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return;
        for (var i = st.objects.length - 1; i >= 0; i--){
          var o = st.objects[i];
          if (o && (o._hyunji || (o.npcName && String(o.npcName).indexOf('현지') === 0))) st.objects.splice(i, 1);
        }
      });
    }catch(e){}
  
       pass++;
       if (pass > 12) clearInterval(iv);   // 약 12초 뒤 종료
     }, 1000);
   })();
})();
