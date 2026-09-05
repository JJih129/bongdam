/* (v392) 최종장 복귀 유도 — 4개 리 안전 조각을 모두 모으면(최종장 개방)
   와우리 밖 지역에서 «근처 버스정류장으로 와우리에 돌아가라»고 안내한다.
   · 담이 한 줄 안내(지역 입장마다 1회) + 정류장 위 금색 펄스 링(비차단 오버레이)
   · 진행을 막지 않는다: 입력 잠금 없음, 전투·대화 중엔 링을 숨긴다
   · 와우리(212) 도착 또는 최종장 클리어 시 종료 */
(function(){
  'use strict';

  var OTHER = { 210:1, 211:1, 213:1 };   /* 와우리(212) 밖 3개 리 */
  var saidFor = 0;                        /* 담이 안내를 마지막으로 말한 스테이지 */

  function ready(){
    try{
      if (!(window.BD_canStartFinale && BD_canStartFinale())) return false;
      if (window.BD && BD.gameCleared) return false;
      return true;
    }catch(e){ return false; }
  }
  function playing(){
    try{
      var g = document.getElementById('game-screen');
      if (!g || g.style.display !== 'block') return false;
      if (window.HSR && HSR.active) return false;
      if (window.BD_isInputBlocked && BD_isInputBlocked()) return false;
      return true;
    }catch(e){ return false; }
  }
  function busStop(){
    try{
      var st = STAGES[currentStage];
      if (!st || !Array.isArray(st.objects)) return null;
      return st.objects.find(function(o){ return o && o.interactable === 'bus_stop' && !o.hidden; }) || null;
    }catch(e){ return null; }
  }

  var ring = null;
  function ensureRing(){
    if (ring && ring.isConnected) return ring;
    ring = document.createElement('div');
    ring.id = 'bd-busguide-ring-v392';
    ring.style.cssText = 'position:fixed;z-index:840;pointer-events:none;display:none;'
      + 'border:3px solid rgba(255,216,107,.95);border-radius:14px;'
      + 'box-shadow:0 0 18px rgba(255,216,107,.55), inset 0 0 14px rgba(255,216,107,.25);'
      + 'animation:bdBusGuideV392 1.2s ease-in-out infinite;';
    var st = document.createElement('style');
    st.id = 'bd-busguide-style-v392';
    st.textContent = '@keyframes bdBusGuideV392{0%,100%{opacity:.95;transform:scale(1)}50%{opacity:.45;transform:scale(1.05)}}'
      + '#bd-busguide-ring-v392::after{content:"🚌 와우리로";position:absolute;left:50%;top:-26px;transform:translateX(-50%);'
      + 'white-space:nowrap;background:rgba(13,19,36,.94);color:#ffd86b;font:700 12px/1 sans-serif;'
      + 'padding:5px 10px;border-radius:999px;border:1px solid rgba(255,216,107,.6);}';
    document.head.appendChild(st);
    document.body.appendChild(ring);
    return ring;
  }
  function hideRing(){ if (ring) ring.style.display = 'none'; }

  function tick(){
    try{
      var sid = Number(typeof currentStage !== 'undefined' ? currentStage : 0);
      if (!ready() || !OTHER[sid] || !playing()){ hideRing(); return; }
      var o = busStop();
      if (!o){ hideRing(); return; }
      /* 담이 안내 — 이 지역에서 아직 안 했으면 1회 */
      if (saidFor !== sid && window.BD_DAMI){
        saidFor = sid;
        BD_DAMI.show('네 동네의 안전 조각이 모두 모였어요! 근처 🚌 버스정류장에서 와우리로 돌아가면, 마지막 정리를 시작할 수 있어요!', { face:'proud', channel:'story' });
      }
      /* 정류장 위 펄스 링 */
      var r = window.BD_screenRectOfWorld && BD_screenRectOfWorld(Number(o.rx)||0, Number(o.ry)||0, Number(o.rw)||0.05, Number(o.rh)||0.05);
      if (!r || !(r.width > 0)){ hideRing(); return; }
      var el = ensureRing();
      var pad = 8;
      el.style.left = (r.left - pad) + 'px';
      el.style.top = (r.top - pad) + 'px';
      el.style.width = (r.width + pad*2) + 'px';
      el.style.height = (r.height + pad*2) + 'px';
      el.style.display = 'block';
    }catch(e){ hideRing(); }
  }
  if (window.BD_addTick) BD_addTick(tick, 300); else setInterval(tick, 300);
})();
