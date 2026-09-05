
/* (v145) 전투가 끝났는데 조작이 막히던 진짜 원인
   ────────────────────────────────────────────────────────────
   조사 선택창(bd-choice)이 «조사한다»를 고른 뒤에도 display 가 남아,
   BD_isInputBlocked() 의 마지막 조건에 걸려 이동·상호작용이 전부 막혔다.
   (화면에는 안 보이지만 판정에는 살아 있는 상태 — 그래서 원인 찾기가 어려웠다)

   해법: 선택창은 «선택이 끝나면» 확실히 닫는다.
        전투 중·전투 직후에 남아 있으면 즉시 정리한다. */
(function(){
  'use strict';

  function el(){ return document.getElementById('bd-choice'); }

  function isOpenByStyle(){
    try{
      var c = el();
      if (!c) return false;
      return getComputedStyle(c).display !== 'none';
    }catch(e){ return false; }
  }
  function reallyVisible(){
    try{
      var c = el();
      if (!c) return false;
      var cs = getComputedStyle(c);
      return cs.display !== 'none' && +cs.opacity > 0.05 && c.offsetHeight > 4;
    }catch(e){ return false; }
  }
  function close(){
    try{
      var c = el();
      if (!c) return;
      /* (v373) 인라인 display:none·pointer-events:none 을 박아 두면 다음 선택창이 «보이지만 클릭이 안 되는» 상태가 됐다
         (첫 마우스 확정 이후 모든 조사 선택창이 마우스로는 확정 불가 — 키보드만 됨. 동화리 «조사한다 눌러도 무반응» 제보).
         숨김은 클래스(.show 제거)로만, 인라인 잔여값은 걷어낸다 */
      c.classList.remove('show');
      c.style.removeProperty('display');
      c.style.removeProperty('pointer-events');
    }catch(e){}
  }

  /* (v145a) 실측 결과 진짜 원인은 «.bd-modal.show» 였다.
     화면에 보이지 않는데 show 클래스가 남아 BD_isInputBlocked() 를 계속 참으로 만든다.
     선택창과 함께 이 유령 모달도 정리한다. */
  function ghostModals(){
    var out = [];
    try{
      document.querySelectorAll('.bd-modal.show').forEach(function(m){
        var cs = getComputedStyle(m);
        var rc = m.getBoundingClientRect();
        /* (v147) position:fixed 인 .bd-modal 은 offsetParent 가 «항상» null 이다.
           그래서 v145 의 이 판정은 화면에 멀쩡히 떠 있는 모달까지 전부 «유령»으로 몰아
           0.5초마다 강제로 닫아 버렸다 —
           캐릭터 선택·상점·장비·안전수첩·저장/불러오기·일시정지·엔딩·결과 리포트
           «모든 모달»이 열리자마자 사라지던 원인.
           → 화면 점유 여부는 계산된 스타일과 실제 사각형으로만 판정한다.
             내용 상자(.bd-modal-box)가 비어 판정만 살아 있는 경우가 진짜 «유령»이다. */
        var box   = m.querySelector('.bd-modal-box');
        var boxRc = box ? box.getBoundingClientRect() : null;
        var invisible = cs.display === 'none' || cs.visibility === 'hidden' ||
                        +cs.opacity < 0.05 || rc.height < 4 || rc.width < 4 ||
                        (boxRc && boxRc.height < 4);
        if (invisible) out.push(m);
      });
    }catch(e){}
    return out;
  }

  setInterval(function(){
    try{
      // 전투 중에는 선택창이 떠 있을 이유가 없다
      if (window.HSR && HSR.active){
        if (isOpenByStyle()) { close(); }
        return;
      }
      // 화면에는 안 보이는데 판정만 살아 있는 «유령 선택창» → 정리
      if (isOpenByStyle() && !reallyVisible()){
        close();
        try{ console.info('[v145] 남아 있던 조사 선택창 정리 — 조작을 복구했습니다.'); }catch(e){}
      }
      // 보이지 않는데 show 만 남은 모달 → 정리
      var gm = ghostModals();
      if (gm.length){
        gm.forEach(function(m){
          try{
            /* (v147) 일시정지 모달을 클래스만 벗겨 버리면 게임 루프가 멈춘 채 남는다.
               정식 재개 경로(BD_resumeGame)로 닫아야 루프까지 되살아난다. */
            if (m.id === 'bd-pause-modal' && typeof window.BD_resumeGame === 'function') window.BD_resumeGame();
            else m.classList.remove('show');
          }catch(e){}
        });
        try{ console.info('[v145] 유령 모달 ' + gm.length + '개 정리 — 조작을 복구했습니다.'); }catch(e){}
      }
    }catch(e){}
  }, 500);

  /* 선택을 확정하는 순간에도 확실히 닫는다 */
  document.addEventListener('click', function(e){
    try{
      var t = e.target && e.target.closest && e.target.closest('[id^="bd-ch-"]');
      if (!t) return;
      setTimeout(close, 120);
      setTimeout(close, 600);
    }catch(err){}
  }, true);
})();
