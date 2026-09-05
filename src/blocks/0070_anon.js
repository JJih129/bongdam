
/* (v212) 첫 전투 가이드 — 생애 첫 전투의 플레이어 턴에 [정화 공격] 버튼 하이라이트+말풍선.
   버튼을 누르면 종료(1회성). 약점 속성 안내 토스트 1회 동반. */
(function(){
  'use strict';
  var KEY = 'bd_battle_guide_done';
  var weakToastShown = false;
  function done(){ try{ return localStorage.getItem(KEY) === '1'; }catch(e){ return false; } }
  function markDone(){ try{ localStorage.setItem(KEY, '1'); }catch(e){} }
  function tip(){ var d = document.getElementById('bd-guide-tip');
    if(!d){ d = document.createElement('div'); d.id = 'bd-guide-tip'; document.body.appendChild(d); } return d; }
  function clear(){
    var d = document.getElementById('bd-guide-tip'); if (d) d.style.display = 'none';
    document.querySelectorAll('.bd-guide-pulse').forEach(function(b){ b.classList.remove('bd-guide-pulse'); });
  }
  window.BD_addTick(function(){
    if (done()) return;
    if (!(window.HSR && HSR.active)){ clear(); return; }
    if (HSR.state !== 'player'){ clear(); return; }
    var btn = document.querySelector('.hsr-act.hsr-basic');
    if (!btn || !btn.offsetParent){ clear(); return; }
    // (v79) 담이 튜토리얼이 같은 버튼을 안내 중이면 구 가이드는 뜨지 않는다 (중복 강조 방지)
    try{ if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()){ clear(); return; } }catch(eT){}
    btn.classList.add('bd-guide-pulse');
    var r = btn.getBoundingClientRect();
    var d = tip();
    d.textContent = '✨ [정화 스티커 Q] 를 눌러 위험 요소를 정화해요!';   /* (v79) 실제 버튼명·콘셉트에 맞춤 (구: 정화 공격/몬스터) */
    d.style.display = 'block';
    d.style.left = Math.round(r.left + r.width/2) + 'px';
    /* (v147) -46px 은 «당신의 턴! 아래 버튼으로 행동을 선택하세요» 줄과 같은 높이라
       두 글자가 겹쳐 읽기 어려웠다. 한 줄 위로 올린다. */
    d.style.top  = Math.round(r.top - 82) + 'px';
    d.style.transform = 'translateX(-50%)';
    if (!weakToastShown){
      weakToastShown = true;
      try{ if (typeof bdToast === 'function')
        bdToast('💡 그림자마다 약한 속성이 있어요 — 약점을 치면 피해 1.5배!'); }catch(e){}
    }
    if (!btn.__bdGuideBound){
      btn.__bdGuideBound = true;
      btn.addEventListener('click', function(){ markDone(); clear(); }, { once: true });
    }
  }, 400);
})();
