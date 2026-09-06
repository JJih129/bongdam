/* (v398) 모바일 모드 스위치 + 모든 모달 공통 처리.
 *
 * ── 왜 필요한가 ───────────────────────────────────────────────────
 *   지금까지 0264~0268 이 각자 «좁은 화면인가»를 따로 판단했다. 판단 기준이 흩어져 있으면
 *   어떤 화면은 모바일 규칙을 받고 어떤 화면은 못 받는 상태가 생긴다 — 실제로 가방·지도만
 *   고쳐졌고 퀘스트·장비·업적·도장수첩·상점·설정은 그대로였다.
 *   여기서 «모바일이다»를 한 번만 정하고 <html> 에 클래스로 박는다.
 *   모든 모바일 규칙은 그 클래스 아래에만 쓴다 — PC 는 클래스가 없으니 규칙 자체가
 *   적용되지 않는다(«PC 는 손대지 않았다»가 증명 가능해진다).
 *
 * ── 전수 조사에서 나온 것 (874x300) ───────────────────────────────
 *   화면마다 열어 재 보니 대부분이 같은 컨테이너(.bd-modal-box)를 쓰는데
 *   모두 화면의 20~22% 밖에 안 썼다. 그 좁은 데 내용을 밀어 넣느라 글자는 7.1~10.4px 로
 *   내려가고, 카드 격자는 화면 밖으로 잘려 나갔다.
 *     퀘스트 로그 35% · 장비 22% · 업적 20% · 도장수첩 22% · 상점 21% · 설정 22%
 *   개별로 고칠 일이 아니다 — 공통 컨테이너를 한 번 고치면 전부 따라온다.
 */
(function () {
  'use strict';

  var CLS = 'bd-mobile-ui';
  var ID = 'bd-mobile-mode-v398-style';
  var NARROW_H = 520;

  /* «모바일이다»의 유일한 판단. 다른 블록은 이 함수(또는 <html> 클래스)를 본다. */
  function isMobile() {
    try {
      var touch = (navigator.maxTouchPoints || 0) > 0 || matchMedia('(pointer: coarse)').matches;
      if (!touch) return false;
      /* 터치 노트북·큰 태블릿까지 좁은 화면 규칙을 먹이면 오히려 어색하다.
         세로가 짧을 때만 «가로로 누운 폰» 취급한다. */
      return window.innerHeight <= NARROW_H;
    } catch (e) { return false; }
  }

  function scaleOf(el) {
    try {
      if (!el || !el.offsetHeight) return 0;
      var r = el.getBoundingClientRect();
      if (!r.height) return 0;
      var s = r.height / el.offsetHeight;
      return (s > 0.05 && s < 20) ? s : 0;
    } catch (e) { return 0; }
  }

  /* 배율을 잴 만한 요소를 찾는다 — 모달이 아직 없을 수도 있다 */
  function scale() {
    var probes = ['.bd-modal-box', '#inv-panel', '#dialogue-box', '#bd-hp-dom', 'body'];
    for (var i = 0; i < probes.length; i++) {
      var e = document.querySelector(probes[i]);
      var s = scaleOf(e);
      if (s) return s;
    }
    return 0;
  }

  function apply() {
    var de = document.documentElement;
    var on = isMobile();
    if (de.classList.contains(CLS) !== on) de.classList.toggle(CLS, on);

    var st = document.getElementById(ID);
    if (!on) { if (st) st.remove(); return; }

    var z = scale();
    if (!z) return;
    var H = Math.round(window.innerHeight * 0.90 / z);
    var W = Math.round(window.innerWidth * 0.94 / z);
    var pad = Math.round(12 / z);

    var css =
      /* ── 모든 모달의 공통 상자 ──
         작은 상자에 내용을 우겨넣는 대신, 화면을 쓰고 넘치면 «세로로 스크롤»하게 한다.
         잘려서 안 보이는 것보다 밀려서 보이는 편이 낫다(업적·도장수첩의 카드 격자가
         화면 밖으로 나가 있었다). */
      /* .bd-modal-box 규약을 안 따르는 패널도 같이 받는다 — 전수 조사에서
         퀘스트 로그(.bd-qlog2-box)와 도장수첩(#bd-place-book)이 규칙 밖에 있어
         혼자 화면의 35% 만 쓰면서 내용이 화면 밖으로 잘려 나갔다. */
      'html.' + CLS + ' .bd-modal-box,' +
      'html.' + CLS + ' .bd-qlog2-box,' +
      'html.' + CLS + ' #bd-place-book,' +
      'html.' + CLS + ' #bd-gamesel{' +
        'max-height:' + H + 'px!important;max-width:' + W + 'px!important;' +
        'width:' + W + 'px!important;box-sizing:border-box!important;' +
        'padding:' + pad + 'px ' + Math.round(16 / z) + 'px!important;' +
        'overflow-y:auto!important;-webkit-overflow-scrolling:touch;' +
        'display:flex!important;flex-direction:column!important;' +
        'gap:' + Math.round(8 / z) + 'px!important;}' +

      /* 안쪽 격자는 좁은 화면에서 칸을 줄이고, 가로로 넘치지 않게 */
      'html.' + CLS + ' .bd-modal-box .bd-card-grid,' +
      'html.' + CLS + ' .bd-modal-box .achieve-list,' +
      'html.' + CLS + ' .bd-modal-box .bd-safety-list{' +
        'display:grid!important;grid-template-columns:repeat(auto-fill,minmax(' +
        Math.round(150 / z) + 'px,1fr))!important;gap:' + Math.round(8 / z) + 'px!important;' +
        'min-height:0!important;}' +

      /* 카드 자체가 넓은 화면 기준 최소 높이를 들고 있어 세로를 잡아먹는다 */
      'html.' + CLS + ' .bd-modal-box .bd-card,' +
      'html.' + CLS + ' .bd-modal-box .achieve-card{' +
        'min-height:0!important;padding:' + Math.round(8 / z) + 'px ' + Math.round(10 / z) + 'px!important;}' +

      /* 버튼 줄은 아래에 붙이고, 글자가 세로로 쪼개지지 않게 */
      'html.' + CLS + ' .bd-modal-box button,' +
      'html.' + CLS + ' .bd-modal-box .modal-btn{white-space:nowrap!important;' +
        'min-height:' + Math.round(34 / z) + 'px!important;flex:0 0 auto!important;}' +

      /* 제목은 한 줄 */
      'html.' + CLS + ' .bd-modal-title{white-space:nowrap!important;flex:0 0 auto!important;}' +

      /* 모달이 게임 HUD 뒤로 가지 않게 — #inv-overlay 가 z-index 30 이라 파묻혀 있었다 */
      'html.' + CLS + ' .bd-modal.show,html.' + CLS + ' .bd-modal.open{z-index:5600!important;}';

    if (!st) {
      st = document.createElement('style');
      st.id = ID;
      (document.head || document.documentElement).appendChild(st);
    }
    if (st.textContent !== css) st.textContent = css;
  }

  function boot() {
    apply();
    addEventListener('resize', function () { setTimeout(apply, 90); });
    addEventListener('orientationchange', function () { setTimeout(apply, 300); });
    setInterval(apply, 900);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  window.BD_MOBILE_MODE = { isMobile: isMobile, apply: apply, cls: CLS, scale: scale };
})();
