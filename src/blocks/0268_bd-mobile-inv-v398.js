/* (v398) 좁은 가로 화면의 인벤토리 — 패널이 화면의 절반만 쓰면서 안쪽은 잘렸다.
 *
 * ── 실측 (874x300) ───────────────────────────────────────────────
 *   #inv-panel  화면 523x160 (화면 높이의 53%) · 선언 804x246 · max-height 246px
 *               display:grid · overflow:hidden
 *   #inv-tabs   화면 275x22   ← 여기가 문제
 *
 *   패널 높이가 246px 로 고정돼 있는데, 이 값은 넓은 화면 기준이다. 300px 짜리 가로
 *   화면에서도 그대로 160px 만 쓰고 나머지 47% 를 놀린다. 그 좁은 안에 제목·탭·목록·
 *   상세·바닥이 다 들어가야 하니 행마다 여유가 없다.
 *   0267 이 글자를 «읽을 수 있는 크기»(9.1 → 12.5px)로 올리자 탭 버튼이 행 높이(22px)를
 *   넘어섰고, overflow:hidden 이라 글자 아래쪽이 잘렸다.
 *   글자를 도로 줄이는 건 답이 아니다 — 놀고 있는 세로를 쓰면 된다.
 *
 * ── 방침 ──────────────────────────────────────────────────────────
 *   좁은 화면에서만 패널이 화면 높이의 88% 를 쓰게 풀고, 탭 줄은 내용만큼 자라게 둔다.
 *   목록 영역만 남은 공간을 먹고 필요하면 세로 스크롤한다.
 *   vh 는 쓰지 않는다 — zoom 안에서는 화면 비율이 되지 않는다(0266 에서 61% 로 나왔다).
 *   요소에서 배율을 재서 px 로 준다.
 */
(function () {
  'use strict';

  var ID = 'bd-mobile-inv-v398-style';
  var NARROW_H = 520;

  /* 판정은 0269 한 곳에서 — 여기서는 결과(<html> 클래스)만 본다. */
  function narrow() {
    try {
      var de = document.documentElement;
      if (de.classList.contains('bd-ui-phone')) return true;
      if (de.classList.contains('bd-ui-tablet')) return false;
      if (window.BD_UI_TIER) return window.BD_UI_TIER === 'phone';
      if (!(navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches)) return false;
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

  function apply() {
    var st = document.getElementById(ID);
    if (!narrow()) { if (st) st.remove(); return; }

    var pn = document.getElementById('inv-panel');
    var z = scaleOf(pn);
    if (!z) { return; }                       /* 아직 안 열렸다 — 다음 주기에 */

    var H = Math.round(window.innerHeight * 0.88 / z);
    var W = Math.round(window.innerWidth * 0.94 / z);

    var css =
      /* ── 쌓임 순서 ──
         #inv-overlay 의 z-index 가 30 이다. 주변은 이렇다:
           bd-hp-dom 900 · bd-menu-btns 901 · bd-toast 960 · bd-settings-btn 3500
           bd-district-hud 5200 · dialogue-overlay 5400
         즉 인벤토리가 UI 스택 맨 아래라 «열어도 전부 그 위에» 그려진다.
         실기기 스크린샷에서 체력바가 «인벤토리» 제목을 덮고, 여기서는 토스트 문구가
         제목과 소지금을 관통했다. 글자가 읽히게 되고 나서야 눈에 띈 오래된 문제다.
         대사 오버레이(5400)보다 위로 올려 «연 것이 맨 앞»이 되게 한다. */
      '#inv-overlay.open{z-index:5600!important;}' +

      '#inv-panel{max-height:' + H + 'px!important;height:' + H + 'px!important;' +
        'max-width:' + W + 'px!important;padding:' + Math.round(12 / z) + 'px ' +
        Math.round(16 / z) + 'px!important;' +
        'gap:' + Math.round(6 / z) + 'px ' + Math.round(12 / z) + 'px!important;' +
        'box-sizing:border-box;}' +

      /* 탭 줄은 내용만큼. 잘리지 않게 넘침을 열어 두고, 가로로만 민다. */
      '#inv-tabs{align-self:start!important;min-height:0!important;height:auto!important;' +
        'overflow-y:visible!important;align-items:center!important;}' +
      '.inv-tab{line-height:1.25!important;height:auto!important;}' +

      /* 목록은 남는 세로를 먹고 넘치면 스크롤 — 잘리는 대신 밀리게 */
      '#inv-body,#inv-grid,#inv-safety-panel,#inv-skill-panel,#inv-achieve-panel{' +
        'min-height:0!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;}' +

      /* 바닥 안내는 한 줄이면 충분하다 */
      '#inv-footer{padding:' + Math.round(4 / z) + 'px 0 0!important;}' +

      /* 상세 칸도 넘치면 스크롤 */
      '#inv-detail{min-height:0!important;overflow-y:auto!important;}';

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
    setInterval(apply, 900);       /* 패널은 열 때 생긴다 */
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  window.BD_MOBILE_INV = { apply: apply, narrow: narrow };
})();
