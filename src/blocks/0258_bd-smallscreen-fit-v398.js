/* (v398) 작은 화면(주소창 있는 폰 가로) 대응 — 두 가지를 고친다.
 *
 * ── 문제 1: 게임 화면이 뷰포트를 넘는다 ─────────────────────────────
 *   0216 의 autoPct() 는 높이 기준 «고정 계단»이다.
 *     if (hgt < 480) return 65;
 *   높이가 479 든 320 이든 똑같이 65%. 65% 는 논리 1200x554 를 780x360 으로 만든다.
 *   주소창이 있는 아이폰 가로는 높이가 330~350 이라 세로가 모자란다.
 *   실측(852x340): 캐릭터 생성 모달이 57px 잘리고 «모험 시작» 버튼이 눌리지 않았다.
 *
 *   여기서는 «줄이기만» 한다. 계단값이 화면에 들어가면 그대로 두고, 넘칠 때만
 *   들어가는 배율로 낮춘다. 태블릿처럼 여유 있는 기기는 지금 동작 그대로다.
 *
 * ── 문제 2: 모달이 잘려 주 버튼을 못 누른다 ────────────────────────
 *   .bd-modal-box 는 max-height:86vh + overflow:auto 다. 모바일에서 vh 는
 *   «주소창이 없다고 가정한» 큰 뷰포트라, 실제 보이는 높이보다 커진다.
 *   즉 실기기에서는 에뮬레이션보다 더 심하게 잘린다. dvh 로 바로잡고,
 *   그래도 넘칠 때를 대비해 액션 버튼을 스크롤 영역 하단에 고정한다.
 */
(function () {
  'use strict';

  /* ── CSS ── */
  var CSS_ID = 'bd-fit-style-v398';   /* shell 의 <script id> 와 겹치지 않게 별도 이름 */
  function css() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement('style');
    st.id = CSS_ID;
    st.textContent =
      /* 실제로 보이는 높이 기준으로 잡는다 (vh → dvh) */
      '.bd-modal-box{max-height:86dvh;}' +
      /* 그래도 넘치면 주 버튼이 항상 보이도록 스크롤 하단에 고정.
         버튼이 .bd-modal-box 의 직계 자식이라 행 래퍼가 없어 버튼 자체를 고정한다. */
      /* 고정된 버튼 뒤로 본문이 흘러가 «겹쳐 보이는» 것을 막되, 버튼 자체를 덮지 않도록
         가짜 요소 대신 box-shadow 로 어두운 테두리를 두른다.
         (::before + z-index:-1 은 버튼의 배경 «위»에 그려져 버튼이 흐려진다) */
      '.bd-modal-box>.modal-btn{position:sticky;bottom:0;z-index:2;' +
      'box-shadow:0 0 0 7px rgba(13,19,36,.96), 0 -8px 14px 6px rgba(13,19,36,.85);}' +
      /* 하단 조작 힌트 바 — white-space:nowrap + 가운데 정렬이라 화면보다 길면
         «양쪽»으로 잘려 나간다(아이폰 가로 실기기에서 확인). 0011 에 짧은 화면용
         display:none 규칙이 있지만 게임 코드가 인라인 display:block 을 박아 무력화된다.
         그래서 여기서는 숨기는 대신 «어떤 폭에서도 들어가게» 만든다. */
      '#bd-keybar{max-width:min(94vw,720px)!important;white-space:normal!important;' +
      'text-align:center;line-height:1.5;word-break:keep-all;}' +
      /* 아주 낮은 화면에서는 세로 공간이 더 급하다 — 0011 의 원래 의도를 인라인보다 세게 */
      '@media (max-height:430px){#bd-keybar{display:none!important;}}';
    (document.head || document.documentElement).appendChild(st);
  }

  /* ── 논리 화면이 뷰포트에 들어가도록 zoom 을 «낮추기만» 한다 ── */
  var MIN_ZOOM = 0.45;

  function logicalSize() {
    var gs = document.getElementById('game-screen');
    /* 게임 화면이 숨겨져 있으면(타이틀 등) offset 이 0 이므로 설계값을 쓴다 */
    if (gs && gs.offsetWidth > 100 && gs.offsetHeight > 100) {
      return { w: gs.offsetWidth, h: gs.offsetHeight };
    }
    return { w: 1200, h: 554 };
  }

  function clamp() {
    try {
      if (!document.body || window.__bdZoomOK === false) return;
      var cur = parseFloat(getComputedStyle(document.body).zoom) || 1;
      var L = logicalSize();
      var fit = Math.min(innerWidth / L.w, innerHeight / L.h);
      if (!isFinite(fit) || fit <= 0) return;
      /* 들어가면 손대지 않는다 — 기존 계단값 유지 */
      if (cur <= fit + 0.005) return;
      var next = Math.max(MIN_ZOOM, Math.floor(fit * 1000) / 1000);
      document.body.style.zoom = String(next);
    } catch (e) {}
  }

  /* ── UI 가독성 보정 ──
     body zoom 은 «월드»를 화면에 맞추려고 거는 것인데, UI 텍스트까지 같이 줄어든다.
     874x300(아이폰 가로 + 주소창)에서 zoom 0.541 이면 13px 선언이 화면상 7px 이 되고,
     실측으로 12px 미만 텍스트가 21개 나왔다(모험 시작 8.1px · 대사 8.7px · HP 8.7px).
     유니티로 치면 월드 카메라와 UI 캔버스가 같이 축소된 상태다 — UI 만 되돌린다.

     대상은 «고정 UI 레이어»로 한정한다. 캔버스(월드)는 건드리지 않는다. */
  var MIN_PX = 11.5;      /* 확보하려는 화면상 최소 글자 크기 */
  var BASE_PX = 13;       /* HUD 의 대표 선언 크기 */
  var MAX_BOOST = 1.55;   /* 너무 키우면 좁은 화면을 잡아먹는다 */
  var UI_SEL = ['.bd-modal-box', '#dialogue-overlay', '#bd-hp-dom', '#bd-keybar',
                '#bd-district-hud', '#bd-district-minimap', '#bd-startsetup-modal',
                '#bd-fullscreen-return'];

  function boost() {
    try {
      if (!document.body || window.__bdZoomOK === false) return;
      var z = parseFloat(getComputedStyle(document.body).zoom) || 1;
      if (z >= 0.995) { UI_SEL.forEach(clearBoost); return; }   /* 축소가 없으면 보정 불필요 */
      var need = MIN_PX / (BASE_PX * z);
      var b = Math.max(1, Math.min(MAX_BOOST, need));
      if (b <= 1.01) { UI_SEL.forEach(clearBoost); return; }
      var v = b.toFixed(3);
      UI_SEL.forEach(function (s) {
        var list = document.querySelectorAll(s);
        for (var i = 0; i < list.length; i++) {
          if (list[i].style.zoom !== v) list[i].style.zoom = v;
        }
      });
    } catch (e) {}
  }
  function clearBoost(s) {
    try {
      var list = document.querySelectorAll(s);
      for (var i = 0; i < list.length; i++) if (list[i].style.zoom) list[i].style.zoom = '';
    } catch (e) {}
  }

  function run() { css(); clamp(); boost(); }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', run);
  else run();
  addEventListener('load', run);
  addEventListener('resize', function () { setTimeout(run, 60); });
  addEventListener('orientationchange', function () { setTimeout(run, 250); });
  if (window.visualViewport) visualViewport.addEventListener('resize', function () { setTimeout(run, 60); });

  /* 0216 이 resize 때 다시 계단값을 넣으므로, 그 뒤에 한 번 더 눌러 준다 */
  setInterval(run, 1500);

  window.BD_FIT = {
    clamp: clamp,
    state: function () {
      var L = logicalSize();
      return {
        viewport: innerWidth + 'x' + innerHeight,
        논리: L.w + 'x' + L.h,
        현재zoom: parseFloat(getComputedStyle(document.body).zoom) || 1,
        맞춤배율: +Math.min(innerWidth / L.w, innerHeight / L.h).toFixed(3)
      };
    }
  };
})();
