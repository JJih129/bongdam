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
  /* (v398d) 1.55 로는 #bd-hp-dom 의 «0/100»(맨몸 6.8px)이 상한에 걸려 10.5px 에 멈췄다.
     최소치에 닿게 1.75 까지 허용한다 — 대신 아래 UI_SEL 은 좁은 화면에서 서로 겹치지
     않는지 실측(_port.cjs 겹침 0건)으로 확인한 목록만 둔다. */
  var MAX_BOOST = 1.75;   /* 너무 키우면 좁은 화면을 잡아먹는다 */
  var UI_SEL = ['.bd-modal-box', '#dialogue-overlay', '#bd-hp-dom', '#bd-keybar',
                '#bd-district-hud', '#bd-district-minimap', '#bd-startsetup-modal',
                '#bd-fullscreen-return',
                /* (v398b) 실제 대사 표시 검증에서 추가로 발견 — 담이 말풍선과 토스트가
                   화면상 9.1px 로 나오고 있었다. 안내의 핵심 통로라 반드시 포함한다. */
                '#bd-dami-hud', '#bd-toast',
                /* (v398d) 전수 조사에서 남은 것들 — 지도 라벨 10.1px, 설정 아이콘 8.4px.
                   둘 다 커지면 우상단 줄이 넓어지므로 겹침을 따로 확인했다. */
                '#bd-mb-map', '#bd-settings-btn'];

  /* (v398d) 한 컨테이너 안에서 «실제로 가장 작게 그려지는 글자»를 찾는다.
     화면에 보이는 크기 = 선언 font-size x (조상들의 zoom 을 모두 곱한 값).
     getBoundingClientRect / offsetHeight 비로 재려 했으나 인라인 요소에서 어긋나
     zoom 을 직접 거슬러 올라가며 곱한다. */
  function screenPx(el) {
    try {
      var fs = parseFloat(getComputedStyle(el).fontSize);
      if (!(fs > 0)) return 0;
      var k = 1;
      for (var a = el; a && a.nodeType === 1; a = a.parentElement) {
        var z = parseFloat(getComputedStyle(a).zoom);
        if (z > 0 && z !== 1) k *= z;
      }
      return fs * k;
    } catch (e) { return 0; }
  }

  function smallestText(root) {
    var min = Infinity;
    try {
      var list = root.querySelectorAll('*');
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (e.children.length) continue;                  /* 잎 노드만 */
        if (!(e.textContent || '').trim()) continue;
        var s = getComputedStyle(e);
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        var px = screenPx(e);
        if (px > 0 && px < min) min = px;
      }
      if (min === Infinity) {                             /* 자식이 없으면 자기 자신 */
        var own = screenPx(root);
        if (own > 0 && (root.textContent || '').trim()) min = own;
      }
    } catch (e) {}
    return min;
  }

  /* 처음에는 «BASE_PX(13) 가 대표 크기» 라고 가정하고 한 배율을 모든 컨테이너에 똑같이
     먹였다. 그런데 실측해 보니 #bd-hp-dom 안의 «0/100» 은 선언 10.4px 라, 보정을 하고도
     화면 9.2px 에 머물렀다 — 가정이 틀린 것이다.
     컨테이너마다 «가장 작은 글자»를 재서 그 글자가 최소치에 닿을 만큼만 키운다.
     컨테이너 zoom 이므로 안쪽 상대 비율은 그대로 유지된다. */
  function boost() {
    try {
      if (!document.body || window.__bdZoomOK === false) return;
      var z = parseFloat(getComputedStyle(document.body).zoom) || 1;
      if (z >= 0.995) { UI_SEL.forEach(clearBoost); return; }   /* 축소가 없으면 보정 불필요 */
      UI_SEL.forEach(function (s) {
        var list = document.querySelectorAll(s);
        for (var i = 0; i < list.length; i++) {
          var el = list[i];
          var cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          /* 이미 걸어 둔 보정을 뺀 «맨몸» 크기로 환산해야 계산이 누적되지 않는다 */
          var cur = parseFloat(el.style.zoom) || 1;
          var min = smallestText(el);
          if (!isFinite(min) || min <= 0) continue;
          var bare = min / cur;
          var b = Math.max(1, Math.min(MAX_BOOST, MIN_PX / bare));
          var v = (b <= 1.01) ? '' : b.toFixed(3);
          if ((el.style.zoom || '') !== v) el.style.zoom = v;
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

  /* ── 조이스틱: 손을 뗐을 때는 숨긴다 ──
     0249(v387)는 «터치 시작점에 조이스틱을 띄우는» 플로팅 방식이고, 대기 중 숨김 규칙도
     이미 갖고 있다. 다만 그 규칙이 전부 `html.bd-touch-mode` 를 전제로 한다.
     그 클래스는 0136 이 붙이는데, 0136 과 0249 는 조건이 미묘하게 달라 0249 는 살아 있는데
     클래스가 없는 상태가 생길 수 있다. 그러면 0018 의 기본값 opacity:.6 이 그대로 남아
     좌하단에 원이 «고정 패드»처럼 계속 보인다(실기기에서 보고된 증상).

     그래서 0249 가 실제로 동작할 때는 클래스를 확실히 붙이고, 보조로 숨김 규칙도 넣는다.
     0249 가 없으면(구형 브라우저) 고정 패드가 유일한 조작 수단이므로 절대 건드리지 않는다. */
  var JOY_ID = 'bd-joy-style-v398';
  function joystick() {
    try {
      if (!window.__bdFloatingTouchV387) return;          /* 플로팅 방식이 아닐 때는 그대로 */
      var de = document.documentElement;
      if (!de.classList.contains('bd-touch-mode')) de.classList.add('bd-touch-mode');
      if (document.getElementById(JOY_ID)) return;
      var st = document.createElement('style');
      st.id = JOY_ID;
      st.textContent =
        '#tc-joy-base{opacity:0!important;transition:opacity .12s;}' +
        '#tc-joystick.active #tc-joy-base{opacity:.92!important;}' +
        '#tc-joy-knob{opacity:0!important;transition:opacity .12s;}' +
        '#tc-joystick.active #tc-joy-knob{opacity:1!important;}';
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  /* (v398e) boost() 는 더 이상 부르지 않는다 — 0267 이 대신한다.
     컨테이너에 zoom 을 거는 방식이라 «글자만»이 아니라 패널 전체가 커졌다.
     실기기에서 체력바가 1.24배로 부풀어 인벤토리 제목을 덮었고, 더 나쁘게는
     패널마다 배율이 달라져(0.65 / 0.78 / 0.822 / 0.885 / 1.095) 원래 맞아 있던
     크기감이 흩어졌다. 작은 글씨를 고치려다 «크기감이 제각각»을 만든 셈이다.
     0267 은 zoom 대신 화면 기준 font-size 를 직접 지정한다 — 레이아웃은 그대로 두고
     글자만 맞춘다. 아래 boost/clearBoost/smallestText/screenPx 는 남은 zoom 을 걷어내기
     위해 clearBoost 만 한 번 쓰고 나머지는 참고용으로 둔다. */
  var boostCleared = false;
  function run() {
    css(); clamp();
    if (!boostCleared) { try { UI_SEL.forEach(clearBoost); boostCleared = true; } catch (e) {} }
    joystick();
  }

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
