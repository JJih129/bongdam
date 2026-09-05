module.exports = [
  {
    name: 'v147-60 ESC 패널 닫기가 일시정지 모달을 오인해 숨기던 문제',
    from: `    // 클래스 기반 오버레이도 탐색
    var cand = document.querySelectorAll('.overlay.open, .modal.show, .bd-modal.show');
    for (var j=0;j<cand.length;j++){ if (onScreen(cand[j])) return cand[j]; }
    return null;
  }`,
    to: `    // 클래스 기반 오버레이도 탐색
    var cand = document.querySelectorAll('.overlay.open, .modal.show, .bd-modal.show');
    for (var j=0;j<cand.length;j++){
      /* (v147) 일시정지 모달은 여기서 다루지 않는다 — 같은 ESC 이벤트에서
         앞선 핸들러가 방금 연 일시정지를 «열린 패널»로 오인해 즉시 숨겼고,
         게임 루프는 멈춘 채 모달만 사라져 잠깐 조작 불능이 됐다.
         (일시정지 열고 닫기는 전용 토글이 담당한다) */
      if (cand[j].id === 'bd-pause-modal') continue;
      if (onScreen(cand[j])) return cand[j];
    }
    return null;
  }`,
  },
];
