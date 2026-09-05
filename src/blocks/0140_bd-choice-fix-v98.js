
/* (v98) 선택지 오작동 수리
   원인: 각 선택 행에 mouseenter가 걸려 있어, 마우스가 지나가기만 해도 선택 인덱스가 바뀐다.
        (키보드로 아래 항목을 고른 뒤 마우스가 위 항목을 스치면 다시 위로 바뀜)
        게다가 클릭 핸들러는 "현재 인덱스"를 확정하므로, 스친 항목이 실행되는 것처럼 보인다.
   해결: ① 클릭한 행 자신을 확정(인덱스에 의존하지 않음)
        ② 마우스가 실제로 움직였을 때만 hover 선택 반영(키보드 조작 중 잔상 방지) */
(function(){
  'use strict';
  var lastMouse = 0;
  document.addEventListener('mousemove', function(){ lastMouse = Date.now(); }, true);

  function rebind(){
    try{
      var box = document.getElementById('bd-choice');
      if (!box || !box.classList.contains('show')) return;
      var rows = box.querySelectorAll('.bd-choice-row');
      rows.forEach(function(row){
        if (row.__bdFixed) return;
        row.__bdFixed = true;
        // 캡처 단계에서 먼저 처리해 기존 핸들러의 인덱스 확정을 대체한다
        row.addEventListener('click', function(e){
          try{
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            var S = window.__bdChoiceState;
            if (!S || !S.open) return;
            S.idx = +row.dataset.i;              // 클릭한 행 자신으로 확정
            if (typeof window.BD_choiceRender === 'function') BD_choiceRender();
            if (typeof window.BD_choiceConfirm === 'function') BD_choiceConfirm();
          }catch(err){}
        }, true);
        // hover 선택은 '최근에 마우스를 실제로 움직였을 때'만
        row.addEventListener('mouseenter', function(e){
          try{
            if (Date.now() - lastMouse > 120){ e.stopImmediatePropagation(); }
          }catch(err){}
        }, true);
      });
    }catch(e){}
  }
  setInterval(rebind, 200);
})();
