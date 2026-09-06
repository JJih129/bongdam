/* (v398) 좁은 가로 화면의 VN 레이아웃 — 대사창과 초상화가 게임 화면을 먹는 것을 줄인다.
 *
 * ── 실측 (아이폰 17 프로 가로 874x300, body zoom 0.65) ────────────
 *   #dialogue-box      874x119  = 화면 높이의 39.8%
 *       내역: padding 42px(위) + 44px(아래) = 86px  ← 상자 135px 의 64%
 *             min-height:26%  (오버레이 339px 기준 88px)
 *             텍스트는 두 줄 41px 뿐인데 상자가 화면의 40% 를 먹는다
 *   #dialogue-portrait 157x258 = 화면 높이의 86%
 *
 *   패딩 42/44 는 대화창 프레임 아트(배경 이미지)의 장식 테두리 안쪽에 글자를 넣으려고
 *   PC 상자 높이(234px)를 기준으로 정한 «고정 px» 이다. 그런데 배경은
 *   background-size:100% 100% 로 «늘어나므로» 상자가 작아지면 테두리도 같이 얇아진다.
 *   즉 패딩도 같이 줄어야 하는데 고정이라 안 줄어든 것 — 그래서 좁은 화면에서
 *   내용보다 여백이 더 큰 상자가 된다.
 *
 * ── 방침 ──────────────────────────────────────────────────────────
 *   화면 높이에 비례해 패딩·글자·초상화를 줄인다. 넓은 화면(PC·태블릿)은 건드리지 않는다.
 *   #dialogue-name 은 bottom:calc(100% - 34px) 라 상자 높이를 따라가므로 손대지 않아도 된다.
 *   상자를 줄이면 게임 화면이 그만큼 살아나고, 0264 의 카메라 줌과 합쳐져
 *   «캐릭터는 크고 UI 는 작은» 모바일 비율이 된다.
 */
(function () {
  'use strict';

  var ID = 'bd-mobile-vn-v398-style';

  /* 이 아래로는 «좁다»고 본다 — 아이폰/안드로이드 가로가 대부분 300~420 CSS px */
  var NARROW_H = 520;

  function narrow() {
    try {
      if (!(navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches)) return false;
      return window.innerHeight <= NARROW_H;
    } catch (e) { return false; }
  }

  /* «선언한 px» 과 «화면에 보이는 px» 의 비율.
     body 의 zoom 을 읽으면 틀린다 — 처음에 그렇게 했다가 초상화가 86%→84% 로
     거의 안 줄었다. body zoom 은 0.65 인데 대사 오버레이의 실제 유효 배율은 0.885 였다.
     중간에 다른 zoom 이 걸려 곱해지기 때문이다(0.65 × 1.36 ≈ 0.885).
     그래서 대상 요소에서 «직접» 잰다. offsetHeight 는 zoom 을 무시하고
     getBoundingClientRect().height 는 포함하므로, 둘의 비가 곧 유효 배율이다. */
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

    /* 오버레이 자신의 배율로 잰다. 아직 없으면(대사 전) 다음 주기에 다시 온다. */
    var ov = document.getElementById('dialogue-overlay') || document.getElementById('dialogue-box');
    var z = scaleOf(ov);
    if (!z) { if (st) st.remove(); return; }
    var logical = window.innerHeight / z;     /* 선언 px 기준 화면 높이 */

    /* 대사창: 화면의 25% 를 목표로. 텍스트 두 줄 + 최소 여백이 들어갈 만큼은 남긴다. */
    var boxH = Math.max(58, Math.round(logical * 0.25));
    /* 패딩은 상자 높이에 비례 — 프레임 아트가 같이 얇아지므로 비율을 맞춘다.
       PC 기준 86/234 ≈ 37% 였다. 좁은 화면에서는 글자 자리를 우선해 28% 로 낮춘다. */
    var padV = Math.max(9, Math.round(boxH * 0.14));
    var padH = Math.max(18, Math.round(boxH * 0.42));
    var fs = Math.max(13, Math.min(17, Math.round(logical * 0.052)));
    var lh = Math.round(fs * 1.42);

    /* 초상화: 86% → 62%. bottom:0 에 붙어 있으므로 줄이면 «아래에서 올라온 상반신»이 된다. */
    var portraitH = Math.round(logical * 0.62);

    var css =
      '#dialogue-box{min-height:0!important;height:auto!important;' +
        'padding:' + padV + 'px ' + padH + 'px ' + (padV + 2) + 'px!important;}' +
      '#dialogue-text{font-size:' + fs + 'px!important;line-height:' + lh + 'px!important;' +
        'min-height:0!important;}' +
      '#dialogue-name{font-size:' + Math.max(12, fs - 2) + 'px!important;padding:3px 12px!important;}' +
      '#dialogue-next{font-size:' + Math.max(11, fs - 4) + 'px!important;}' +
      '#dialogue-portrait{max-height:' + portraitH + 'px!important;height:auto!important;' +
        'object-fit:contain!important;object-position:bottom left!important;}';

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
    /* 0258 이 zoom 을 나중에 조정하므로 값이 바뀌면 다시 계산해야 한다 */
    setInterval(apply, 900);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  window.BD_MOBILE_VN = { apply: apply, narrow: narrow };
})();
