/* (v397) 프롤로그 선생님 유도 — 배지를 받기 전(101층)에는 임무 HUD도 화살표도 없어서,
   대사를 빨리 넘긴 아이는 «선생님과 이야기가 끝나지 않았어요» 차단 문구만 받고 헤맸다.
   최종장 정류장 유도(0253)와 같은 문법: 선생님 위에 금색 펄스 링(비차단) — 배지를 받으면 사라진다. */
(function(){
  'use strict';

  function needGuide(){
    try{
      if (Number(currentStage) !== 101) return false;
      var P = window.BD_PROGRESS && BD_PROGRESS.story;
      if (!P || !P.tutorialFlags || P.tutorialFlags.badgeGiven) return false;
      var g = document.getElementById('game-screen');
      if (!g || g.style.display !== 'block') return false;
      var vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) return false;              /* 대화 중엔 숨김 */
      if (window.BD_isInputBlocked && BD_isInputBlocked()) return false;
      return true;
    }catch(e){ return false; }
  }
  function teacher(){
    try{
      var st = STAGES[101];
      return (st.objects||[]).find(function(o){
        return o && !o.hidden && /선생/.test(String(o.label||o.npcName||''));
      }) || null;
    }catch(e){ return null; }
  }

  var ring = null;
  function ensureRing(){
    if (ring && ring.isConnected) return ring;
    ring = document.createElement('div');
    ring.id = 'bd-prologue-guide-ring-v397';
    ring.style.cssText = 'position:fixed;z-index:840;pointer-events:none;display:none;'
      + 'border:3px solid rgba(255,216,107,.95);border-radius:14px;'
      + 'box-shadow:0 0 18px rgba(255,216,107,.55), inset 0 0 14px rgba(255,216,107,.25);'
      + 'animation:bdBusGuideV392 1.2s ease-in-out infinite;';   /* 0253의 키프레임 재사용 */
    var tag = document.createElement('div');
    tag.style.cssText = 'position:absolute;left:50%;top:-26px;transform:translateX(-50%);'
      + 'white-space:nowrap;background:rgba(13,19,36,.94);color:#ffd86b;font:700 12px/1 sans-serif;'
      + 'padding:5px 10px;border-radius:999px;border:1px solid rgba(255,216,107,.6);';
    tag.textContent = '💬 선생님과 이야기해요';
    ring.appendChild(tag);
    document.body.appendChild(ring);
    return ring;
  }
  function hide(){ if (ring) ring.style.display = 'none'; }

  function tick(){
    try{
      if (!needGuide()){ hide(); return; }
      var o = teacher();
      if (!o){ hide(); return; }
      var r = window.BD_screenRectOfWorld && BD_screenRectOfWorld(Number(o.rx)||0, Number(o.ry)||0, Number(o.rw)||0.05, Number(o.rh)||0.075);
      if (!r || !(r.width > 0)){ hide(); return; }
      var el = ensureRing();
      var pad = 8;
      el.style.left = (r.left - pad) + 'px';
      el.style.top = (r.top - pad) + 'px';
      el.style.width = (r.width + pad*2) + 'px';
      el.style.height = (r.height + pad*2) + 'px';
      el.style.display = 'block';
    }catch(e){ hide(); }
  }
  if (window.BD_addTick) BD_addTick(tick, 300); else setInterval(tick, 300);
})();
