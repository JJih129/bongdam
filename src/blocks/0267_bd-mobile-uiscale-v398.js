/* (v398) 좁은 가로 화면 UI 크기 통일 — «크기감이 제각각»을 없앤다.
 *
 * ── 무엇이 문제였나 (실측, 874x300) ───────────────────────────────
 *   화면에 실제로 보이는 글자 크기가 요소마다 달랐다.
 *     #bd-hp-dom      14.2px      #bd-menu-btns   12.5px
 *     #bd-toast       11.5px      #inv-title      11.1px
 *     #inv-detail-name 10.4px     .inv-tab         9.1px
 *     #inv-detail-desc  9.1px     #inv-footer      7.2px   ← 두 배 차이
 *
 *   원인이 둘이다.
 *   (1) 원래 각 패널이 서로 다른 선언 크기(11~17px)를 쓰고 있었다.
 *   (2) 그 위에 0258 이 «작은 글씨 보정»을 컨테이너 zoom 으로 걸었다. zoom 은 글자만이
 *       아니라 패널 전체를 키운다. 그래서 패널마다 배율이 0.65 / 0.78 / 0.822 / 0.885 /
 *       1.095 로 갈라졌고, 체력바는 1.24배로 부풀어 인벤토리 제목을 덮었다.
 *       작은 글씨를 고치려다 크기감을 더 흩뜨린 것이다. 그 방식은 0258 에서 껐다.
 *
 * ── 방침 ──────────────────────────────────────────────────────────
 *   zoom 을 건드리지 않는다. 레이아웃은 그대로 두고 «화면 기준 글자 크기»만 맞춘다.
 *   단계는 셋뿐이다 — 제목 / 본문 / 보조. 이 셋으로 모든 UI 를 덮는다.
 *
 *   화면 기준 px 을 선언 px 로 바꾸려면 배율을 알아야 하는데, body 의 zoom 을 읽으면
 *   틀린다(중간에 다른 zoom 이 곱해진다 — 0265 에서 겪었다). 그래서 대상 요소에서
 *   직접 잰다: offsetHeight 는 zoom 을 무시하고 rect 는 포함하므로 둘의 비가 곧 배율이다.
 *
 *   덤으로 «글자가 한 자씩 세로로 쪼개지는» 문제도 여기서 막는다. 지도 버튼에서 한 번,
 *   인벤토리 탭에서 또 한 번 났다 — 좁은 폭 + white-space:normal 이면 어디서든 난다.
 *   UI 버튼·탭·라벨에는 일괄로 nowrap 을 준다.
 */
(function () {
  'use strict';

  var ID = 'bd-mobile-uiscale-v398-style';
  var NARROW_H = 520;

  /* 화면 기준 목표 크기 — 이 셋이 전부다 (폰 기준) */
  var TITLE = 14.5;
  var BODY  = 12.5;
  var SMALL = 11.5;

  /* 태블릿은 폰보다 «멀리 두고» 본다. 화면도 넓어 여유가 있으므로 하한을 조금 올린다.
     실측(1280x800 터치)에서 글자가 10.0~10.9px 로, 잘림·쪼개짐은 없고 크기만 작았다.
     그래서 태블릿에는 레이아웃 규칙을 걸지 않고 «바닥»만 올린다. */
  var TABLET_FLOOR = 12;

  function tier() {
    try {
      if (window.BD_UI_TIER) return window.BD_UI_TIER;
      var de = document.documentElement;
      if (de.classList.contains('bd-ui-phone')) return 'phone';
      if (de.classList.contains('bd-ui-tablet')) return 'tablet';
      return 'pc';
    } catch (e) { return 'pc'; }
  }

  /* 각 단계에 어떤 요소가 들어가는지. 실측으로 뽑은 목록이다. */
  var TITLE_SEL = ['#inv-title', '.bd-modal-title', '#bd-map-v342 .m42-title'];
  var BODY_SEL  = ['#bd-hp-dom', '#bd-hp-dom *', '#bd-toast', '#bd-dami-hud',
                   '.inv-tab', '#inv-detail-name', '#bd-menu-btns button',
                   '#bd-keybar', '#bd-quest-hud', '#bd-district-hud',
                   /* (v398e) 0258 의 zoom 보정을 끄면서 다시 작아진 것들.
                      대사창 글자는 0265 가 만지고 있었는데 역할을 여기로 모았다. */
                   '#dialogue-text', '#dialogue-name',
                   '#bd-settings-btn', '#bd-fullscreen-return',
                   /* (v398e) 모달을 «열고» 재고 나서야 나온 것들. 안 연 화면은 검사한 게 아니다.
                      지도 버튼은 0266 이 선언 px 로 12px 을 줬는데 zoom 을 거쳐 7.8px 이 됐다. */
                   '#bd-map-v342 .m42-x', '#inv-gold-amount', '#inv-grid', '#inv-grid *',
                   '#bd-generic-toast', '#bd-generic-toast *'];
  var SMALL_SEL = ['#inv-detail-desc', '#inv-footer', '#bd-map-v342 .m42-foot',
                   '#bd-map-v342 .m42-foot *', '#bd-map-v342 .m42-tip',
                   '#bd-district-minimap', '#dialogue-next'];

  /* ── 다시 그려지는 요소는 인라인으로 안 된다 ──
     지도판(#bd-map-v342-board)은 0208 이 1.5초마다 innerHTML 을 통째로 갈아 끼운다.
     인라인 스타일을 걸어도 그때 같이 지워지고, 이 블록의 900ms 폴링이 다시 붙이기를
     반복한다 — 실측으로 «17.7px ↔ 없음»이 오가는 것을 확인했다(3.6초에 재렌더 3회).
     0263 의 지도 버튼 깜박임과 같은 폴링 싸움이다. 그때 배운 대로 규칙으로 건다:
     스타일시트는 innerHTML 교체와 무관하므로 새로 그려진 요소에도 즉시 적용된다.
     특이성만 신경 쓰면 된다 — id 두 개를 물려 원본 규칙을 확실히 이긴다. */
  var SHEET_SEL = ['#bd-map-v342 #bd-map-v342-board .m42-rname',
                   '#bd-map-v342 #bd-map-v342-board .m42-pct',
                   '#bd-map-v342 #bd-map-v342-board .m42-hz',
                   '#bd-map-v342 #bd-map-v342-board .m42-mk',
                   /* 튜토리얼 카드도 0060 이 매 프레임 innerHTML 을 다시 쓴다.
                      안쪽 보조 줄이 인라인 font-size:13px(화면 8.5px)라 인라인으로는
                      붙였다 지워졌다 한다 — 규칙으로 건다. */
                   'html #bd-tut-card div'];
  /* 글자가 세로로 쪼개지면 안 되는 것들 */
  var NOWRAP_SEL = ['.inv-tab', '#bd-menu-btns button', '#bd-mb-map', '#bd-bag-top',
                    '#bd-map-v342 .m42-x', '.bd-modal-close', '#inv-use-btn'];

  /* 판정은 0269 한 곳에서. 이 블록은 폰과 태블릿 «둘 다» 담당한다 —
     다만 폰은 3단계 크기까지 맞추고, 태블릿은 «바닥»만 올린다. */
  function narrow() { return tier() === 'phone'; }
  function touchTier() { return tier() !== 'pc'; }

  /* 이 요소에 걸린 «선언 px → 화면 px» 배율. 조상들의 zoom 을 모두 곱한 값이다.
     하나의 전역 배율로는 안 된다 — 실측에서 #inv-panel 은 0.65, #bd-menu-btns 는 0.78 이라
     같은 선언값을 줘도 화면에서 12.5px 과 15px 로 갈렸다. 요소마다 따로 재야 한다. */
  function scaleOf(el) {
    try {
      var k = 1;
      for (var a = el; a && a.nodeType === 1; a = a.parentElement) {
        var v = parseFloat(getComputedStyle(a).zoom);
        if (v > 0 && v !== 1) k *= v;
      }
      return (k > 0.05 && k < 20) ? k : 1;
    } catch (e) { return 1; }
  }

  /* 스타일시트 대신 인라인으로 건다.
     처음엔 <style> 로 넣었는데 절반만 먹었다 — 원본이 «#inv-tabs .inv-tab» 처럼 id 를 낀
     더 강한 셀렉터로 선언해 둔 곳이 있어서다. 클래스를 아무리 겹쳐도 id 하나를 못 이긴다.
     인라인 + important 는 그 싸움을 하지 않는다.
     (0263 에서는 반대로 «인라인으로는 못 이긴다»는 결론이었는데, 그건 다른 코드가 계속
      인라인을 덮어쓰는 상황이었다. 여기서는 글자 크기를 다투는 상대가 없다.) */
  function setPx(el, screenPx, extra) {
    try {
      var z = scaleOf(el);
      var px = Math.round(screenPx / z * 10) / 10;
      var cur = el.style.getPropertyValue('font-size');
      if (cur !== px + 'px') {
        el.style.setProperty('font-size', px + 'px', 'important');
        el.style.setProperty('line-height', '1.42', 'important');
      }
      if (extra) extra(el, z);
    } catch (e) {}
  }

  function each(sels, fn) {
    for (var i = 0; i < sels.length; i++) {
      var list;
      try { list = document.querySelectorAll(sels[i]); } catch (e) { continue; }
      for (var j = 0; j < list.length; j++) {
        var el = list[j];
        try {
          var s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
        } catch (e2) { continue; }
        fn(el);
      }
    }
  }

  function apply() {
    var st = document.getElementById(ID);
    if (!touchTier()) { if (st) st.remove(); return; }      /* PC 는 통째로 제외 */

    /* 태블릿 — 레이아웃과 3단계 크기는 건드리지 않고 바닥만 올린다.
       실측에서 태블릿은 잘림 0 · 쪼개짐 0 이고 글자만 10.0~10.9px 로 작았다.
       멀쩡한 배치를 폰 기준으로 뒤엎을 이유가 없다. */
    if (!narrow()) { floor(TABLET_FLOOR); return; }

    each(TITLE_SEL, function (el) { setPx(el, TITLE); });
    each(BODY_SEL, function (el) { setPx(el, BODY); });
    each(SMALL_SEL, function (el) { setPx(el, SMALL); });
    each(NOWRAP_SEL, function (el) { el.style.setProperty('white-space', 'nowrap', 'important'); });

    /* 체력바가 화면을 너무 먹지 않게 — 실측 252x67(화면 높이의 22%)까지 갔었다 */
    each(['#bd-hp-dom'], function (el) {
      var z = scaleOf(el);
      el.style.setProperty('max-width', Math.round(innerWidth * 0.30 / z) + 'px', 'important');
      el.style.setProperty('min-width', '0', 'important');
      el.style.setProperty('box-sizing', 'border-box', 'important');
    });

    /* 인벤토리 탭이 좁아 «전 체 / 소 모 품» 처럼 한 자씩 쪼개지던 자리 —
       줄바꿈을 막고 넘치면 가로로 민다. */
    each(['#inv-tabs'], function (el) {
      el.style.setProperty('flex-wrap', 'nowrap', 'important');
      el.style.setProperty('overflow-x', 'auto', 'important');
      el.style.setProperty('overflow-y', 'hidden', 'important');
    });
    each(['.inv-tab'], function (el) {
      var z = scaleOf(el);
      el.style.setProperty('flex', '0 0 auto', 'important');
      el.style.setProperty('padding', Math.round(6 / z) + 'px ' + Math.round(10 / z) + 'px', 'important');
    });

    floor(SMALL);
    sheet();
  }

  /* ── 최소 크기 바닥 ──
     위의 목록은 «내가 아는 요소»만 덮는다. 전수 조사에서 퀘스트·장비·업적·도장수첩·상점·
     설정 화면에 7.1~10.4px 짜리가 수십 개 더 있는 것이 나왔다. 화면을 하나씩 열거하는 건
     끝이 없고, 새 화면이 생기면 또 빠진다.
     그래서 «UI 영역 안에서 화면 기준 SMALL 보다 작게 그려지는 글자»를 찾아 바닥만 올린다.
     크기를 통일하는 게 아니라 하한만 두는 것이라 원래의 위계(제목이 크고 설명이 작은 것)는
     그대로 남는다. 장식용으로 일부러 큰 아이콘도 건드리지 않는다. */
  var FLOOR_ROOT = ['.bd-modal-box', '#inv-panel', '#bd-map-v342', '#quest-panel',
                    '.bd-qlog2-box', '#bd-hp-dom', '#bd-keybar', '#bd-dami-hud',
                    '#bd-toast', '#bd-generic-toast', '#dialogue-box',
                    '#bd-district-hud', '#bd-quest-hud', '#bd-tut-card',
                    /* 전수 조사에서 «모든 화면에 공통으로» 작게 나오던 것들의 소속.
                       화면마다 열어 보고서야 어디 것인지 알았다. */
                    '#bd-guide-ov', '#bd-gamesel', '#bd-place-book', '#bd-shop-modal'];

  function floor(minPx) {
    var LIM = (typeof minPx === 'number' && minPx > 0) ? minPx : SMALL;
    try {
      for (var i = 0; i < FLOOR_ROOT.length; i++) {
        var roots;
        try { roots = document.querySelectorAll(FLOOR_ROOT[i]); } catch (e) { continue; }
        for (var r = 0; r < roots.length; r++) {
          var root = roots[r];
          try { if (getComputedStyle(root).display === 'none') continue; } catch (e2) { continue; }
          var list = root.querySelectorAll('*');
          for (var j = 0; j < list.length; j++) {
            var el = list[j];
            if (el.children.length) continue;                 /* 잎 노드만 */
            if (!(el.textContent || '').trim()) continue;
            var cs;
            try { cs = getComputedStyle(el); } catch (e3) { continue; }
            if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            var z = scaleOf(el);
            var px = parseFloat(cs.fontSize) * z;
            if (!(px > 0) || px >= LIM - 0.05) continue;      /* 이미 충분하면 그대로 */
            var want = Math.round(LIM / z * 10) / 10;
            if (el.style.getPropertyValue('font-size') !== want + 'px') {
              el.style.setProperty('font-size', want + 'px', 'important');
            }
          }
        }
      }
    } catch (e) {}
  }

  /* 다시 그려지는 요소용 — 규칙으로 건다 */
  function sheet() {
    try {
      var board = document.querySelector('#bd-map-v342-board');
      var z = board ? scaleOf(board) : 0;
      if (!z) {
        /* 지도를 아직 연 적이 없으면 판이 없다. 근처 요소로 배율을 가늠해 미리 걸어 둔다. */
        var probe = document.querySelector('#dialogue-box') || document.body;
        z = probe ? scaleOf(probe) : 1;
      }
      var px = Math.round(SMALL / z * 10) / 10;
      var css = SHEET_SEL.join(',') + '{font-size:' + px + 'px!important;line-height:1.25!important;}';
      var st = document.getElementById(ID);
      if (!st) {
        st = document.createElement('style');
        st.id = ID;
        (document.head || document.documentElement).appendChild(st);
      }
      if (st.textContent !== css) st.textContent = css;
    } catch (e) {}
  }

  function boot() {
    apply();
    addEventListener('resize', function () { setTimeout(apply, 90); });
    addEventListener('orientationchange', function () { setTimeout(apply, 300); });
    /* 패널은 열 때 만들어지는 것이 많다 — 생긴 뒤 다시 맞춘다 */
    setInterval(apply, 900);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  /* scaleNear 를 참조하고 있었다 — 리팩터링에서 scaleOf 로 바꾸면서 여기만 남아
     스크립트 끝에서 ReferenceError 가 났다. 앞의 boot() 는 이미 돌아서 동작은 했지만
     이 export 가 통째로 날아가 window.BD_UI_SCALE 이 undefined 였다(진단 도구로 발견). */
  window.BD_UI_SCALE = { apply: apply, narrow: narrow, scale: scaleOf,
    목표: { 제목: TITLE, 본문: BODY, 보조: SMALL } };
})();
