/* (v398) UI 환경 판정 — 폰 / 태블릿 / PC 세 갈래. 그리고 모달 공통 처리.
 *
 * ── 왜 한 곳에서 정하나 ───────────────────────────────────────────
 *   처음엔 0264~0268 이 각자 «좁은 화면인가»를 따로 판단했다. 기준이 흩어져 있으니
 *   가방·지도만 규칙을 받고 퀘스트·장비·업적·도장수첩·상점·설정은 그대로였다.
 *   판정은 여기서만 한다. 다른 블록은 <html> 에 붙는 클래스만 본다.
 *     html.bd-ui-phone   가로로 누운 폰
 *     html.bd-ui-tablet  태블릿
 *     (클래스 없음)       PC — 규칙이 아예 적용되지 않는다
 *   덕분에 «PC 는 손대지 않았다»가 주장이 아니라 측정 결과가 된다.
 *
 * ── 세 갈래가 필요한 이유 (실측) ──────────────────────────────────
 *   태블릿(1280x800 터치)은 폰도 PC 도 아니다.
 *     · 터치라 키보드 문구는 바꿔야 한다 (0259 는 터치만 보므로 이미 적용된다)
 *     · 화면이 넓어 폰의 «모달을 90% 로 키우고 지도를 2열로 재배치» 는 필요 없다.
 *       실제로 태블릿 전수 조사에서 잘림 0건 · 세로 쪼개짐 0건이었다.
 *     · 다만 글자가 10.0~10.9px 로 작다. 태블릿은 폰보다 멀리 두고 보므로
 *       오히려 조금 더 커야 한다.
 *   그래서 태블릿은 «터치 편의 + 글자 하한»만 받고 레이아웃은 건드리지 않는다.
 *
 * 클래스는 파싱 시점에 바로 붙인다 — 0264~0268 은 DOMContentLoaded 에서 처음 도는데,
 * 그때 클래스가 없으면 한 박자 늦게 적용된다.
 */
(function () {
  'use strict';

  var ID = 'bd-mobile-mode-v398-style';
  var PHONE_MAX_H = 520;      /* 이보다 세로가 짧으면 «가로로 누운 폰» */

  function detect() {
    try {
      var touch = (navigator.maxTouchPoints || 0) > 0 || matchMedia('(pointer: coarse)').matches;
      if (!touch) return 'pc';
      return (window.innerHeight <= PHONE_MAX_H) ? 'phone' : 'tablet';
    } catch (e) { return 'pc'; }
  }

  var tier = detect();

  function setClass() {
    try {
      var de = document.documentElement;
      de.classList.toggle('bd-ui-phone', tier === 'phone');
      de.classList.toggle('bd-ui-tablet', tier === 'tablet');
      /* 앞서 만든 규칙들이 쓰던 이름 — 폰에서만 유지한다 */
      de.classList.toggle('bd-mobile-ui', tier === 'phone');
      window.BD_UI_TIER = tier;
    } catch (e) {}
  }
  setClass();                                  /* 파싱 시점에 바로 */

  function scaleOf(el) {
    try {
      if (!el || !el.offsetHeight) return 0;
      var r = el.getBoundingClientRect();
      if (!r.height) return 0;
      var s = r.height / el.offsetHeight;
      return (s > 0.05 && s < 20) ? s : 0;
    } catch (e) { return 0; }
  }

  function scale() {
    var probes = ['.bd-modal-box', '#inv-panel', '#dialogue-box', '#bd-hp-dom', 'body'];
    for (var i = 0; i < probes.length; i++) {
      var s = scaleOf(document.querySelector(probes[i]));
      if (s) return s;
    }
    return 0;
  }

  /* 모달·패널 공통 셀렉터. .bd-modal-box 규약을 안 따르는 것들도 같이 받는다 —
     전수 조사에서 퀘스트 로그(.bd-qlog2-box)·도장수첩(#bd-place-book)·
     미니게임(#bd-gamesel)이 규칙 밖에 있어 혼자 화면의 35% 만 쓰면서 잘려 나갔다. */
  var BOX = ['.bd-modal-box', '.bd-qlog2-box', '#bd-place-book', '#bd-gamesel'];

  function boxSel(cls) {
    return BOX.map(function (s) { return 'html.' + cls + ' ' + s; }).join(',');
  }

  function apply() {
    var now = detect();
    if (now !== tier) { tier = now; setClass(); }

    var st = document.getElementById(ID);
    if (tier === 'pc') { if (st) st.remove(); return; }

    var z = scale();
    if (!z) return;
    var css;

    if (tier === 'phone') {
      /* 폰 — 작은 상자에 우겨넣는 대신 화면을 쓰고, 넘치면 세로로 스크롤한다.
         잘려서 안 보이는 것보다 밀려서 보이는 편이 낫다. */
      var H = Math.round(window.innerHeight * 0.90 / z);
      var W = Math.round(window.innerWidth * 0.94 / z);
      css =
        boxSel('bd-ui-phone') + '{' +
          'max-height:' + H + 'px!important;max-width:' + W + 'px!important;' +
          'width:' + W + 'px!important;box-sizing:border-box!important;' +
          'padding:' + Math.round(12 / z) + 'px ' + Math.round(16 / z) + 'px!important;' +
          'overflow-y:auto!important;-webkit-overflow-scrolling:touch;' +
          'display:flex!important;flex-direction:column!important;' +
          'gap:' + Math.round(8 / z) + 'px!important;}' +

        'html.bd-ui-phone .bd-modal-box .bd-card-grid,' +
        'html.bd-ui-phone .bd-modal-box .achieve-list,' +
        'html.bd-ui-phone .bd-modal-box .bd-safety-list{' +
          'display:grid!important;grid-template-columns:repeat(auto-fill,minmax(' +
          Math.round(150 / z) + 'px,1fr))!important;gap:' + Math.round(8 / z) + 'px!important;' +
          'min-height:0!important;}' +

        'html.bd-ui-phone .bd-modal-box .bd-card,' +
        'html.bd-ui-phone .bd-modal-box .achieve-card{' +
          'min-height:0!important;padding:' + Math.round(8 / z) + 'px ' + Math.round(10 / z) + 'px!important;}' +

        'html.bd-ui-phone .bd-modal-title{white-space:nowrap!important;flex:0 0 auto!important;}';
    } else {
      /* 태블릿 — 레이아웃은 건드리지 않는다. 실측에서 잘림도 쪼개짐도 없었다.
         다만 모달이 화면의 10~32% 라 터치로 쓰기에 여유가 적다. 상한만 넉넉히 풀어
         내용이 필요한 만큼 자라게 하고, 넘치면 스크롤한다. 크기를 «강제»하지는 않는다. */
      css =
        boxSel('bd-ui-tablet') + '{' +
          'max-height:' + Math.round(window.innerHeight * 0.90 / z) + 'px!important;' +
          'max-width:' + Math.round(window.innerWidth * 0.86 / z) + 'px!important;' +
          'overflow-y:auto!important;-webkit-overflow-scrolling:touch;box-sizing:border-box!important;}';
    }

    /* 터치 공통 — 버튼 글자가 세로로 쪼개지지 않게, 탭 타겟은 44px 이상.
       «전 체 / 소 모 품» 처럼 한 자씩 갈라지는 문제가 지도 버튼·인벤토리 탭에서
       두 번 났다. 좁은 폭 + white-space:normal 이면 어디서든 난다. */
    var cls = (tier === 'phone') ? 'bd-ui-phone' : 'bd-ui-tablet';
    css +=
      'html.' + cls + ' .bd-modal-box button,' +
      'html.' + cls + ' .bd-modal-box .modal-btn{white-space:nowrap!important;' +
        'min-height:' + Math.round(44 / z) + 'px!important;flex:0 0 auto!important;}' +
      /* 모달이 게임 HUD 뒤로 가지 않게 — #inv-overlay 가 z-index 30 이라 파묻혀 있었다 */
      'html.' + cls + ' .bd-modal.show,html.' + cls + ' .bd-modal.open{z-index:5600!important;}';

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

  window.BD_MOBILE_MODE = {
    tier: function () { return tier; },
    isPhone: function () { return tier === 'phone'; },
    isTablet: function () { return tier === 'tablet'; },
    isTouch: function () { return tier !== 'pc'; },
    apply: apply, scale: scale
  };
})();
