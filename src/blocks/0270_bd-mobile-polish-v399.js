/* bd-mobile-polish-v399 — 모바일 잔여 4건 (모바일UI_v398.md §4·§5·§6 의 «미적용·논의 필요» 항목)
 *
 * ① 세로 방향 안내 (0054 의 #bd-rotate-overlay 대체)
 *    · 예전 오버레이는 97% 불투명이라 게임이 «멈춘 것»처럼 보였다 → 반투명 + 블러. 게임은 계속 돈다.
 *    · 정적 문구 대신 «세로→가로로 눕는 폰» 애니메이션 — 글을 읽기 전에 무엇을 하라는지 보인다.
 *    · 5초가 지나도 세로면 «회전 잠금» 힌트: iOS 는 제어센터의 🔒, Android 는 빠른 설정의 자동 회전.
 *      실제로 가장 흔한 막힘 — 회전 잠금을 켜 둔 사용자는 아무리 돌려도 안 바뀌는데 원인을 모른다.
 *    · Android: «가로로 고정» 버튼 — 전체화면 진입 직후에만 허용되는 screen.orientation.lock 을
 *      «사용자 제스처 안에서» 부른다(0259 는 fullscreenchange 에서만 시도해, 이미 전체화면이면 기회가 없었다).
 *    · «그냥 계속하기» 탈출구 — 회전이 불가능한 상황(거치대·잠금)에서 게임을 막지 않는다.
 *
 * ② 시작 설정 모달(«모험 시작») 잘림 — 화면 높이 400px 이하에서 초상 96→64px, 여백·제목 축소.
 *    0269 가 폰에서 상자를 flex 세로 스크롤로 만들고 0258 이 버튼을 sticky 로 두지만,
 *    낮은 화면에서는 초상 두 장이 상자 높이를 다 먹어 버튼이 «스크롤해야 보이는» 상태였다.
 *
 * ③ 터치 버튼 라벨(«대화»·«조사») 8px → 12px, opacity .85 → 1.
 *    body zoom 0.65 가 곱해져 화면에 5.2px 로 찍히고 있었다(실측 라벨 상자 10×8px). 버튼(78px) 안에
 *    아이콘 26px + 라벨 12px 이 들어가므로 아이콘을 줄일 필요는 없다.
 *
 * ④ visualViewport 연동 — 키보드·주소창으로 «실제 보이는 높이»가 줄면 열린 모달을 그 높이에 맞춘다.
 *    innerHeight 는 iOS 에서 키보드가 떠도 그대로라, 이름 입력 중 확인 버튼이 키보드 밑에 숨었다.
 *    보이는 영역(visualViewport.height·offsetTop)에 모달 오버레이를 맞추고 입력칸을 가운데로 스크롤한다.
 *
 * 되돌리기: 이 블록 하나를 지우면 전부 이전 동작으로 돌아간다. 다른 블록은 손대지 않았다.
 */
(function () {
  'use strict';
  if (window.__bdMobilePolish399) return;
  window.__bdMobilePolish399 = 1;

  var UA = navigator.userAgent || '';
  var IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && (navigator.maxTouchPoints || 0) > 1);
  var ANDROID = /Android/i.test(UA);
  var TOUCH = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var MOBILE = TOUCH || /Android|iPhone|iPad|iPod/i.test(UA);

  /* ── 공통 스타일 (②·③ + ① 의 골격) ────────────────────────────────────── */
  var st = document.createElement('style');
  st.id = 'bd-mobile-polish-v399-css';
  st.textContent =
    /* ① 0054 오버레이는 끈다 — 아래 새 오버레이가 대신한다 */
    '#bd-rotate-overlay{display:none!important}' +
    '#bd-rotate-v399{position:fixed;inset:0;z-index:5000;display:none;flex-direction:column;align-items:center;' +
      'justify-content:center;text-align:center;padding:24px;color:#e7ecf5;' +
      'background:rgba(8,10,18,.66);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);' +
      'font-family:inherit;box-sizing:border-box}' +
    '#bd-rotate-v399.show{display:flex}' +
    '#bd-rotate-v399 .ph{width:34px;height:58px;border:3px solid #f4d78a;border-radius:7px;position:relative;' +
      'box-shadow:0 0 0 2px rgba(0,0,0,.35);animation:bdrot399 2.4s ease-in-out infinite;transform-origin:50% 50%}' +
    '#bd-rotate-v399 .ph:after{content:"";position:absolute;left:50%;bottom:4px;width:10px;height:3px;margin-left:-5px;' +
      'border-radius:2px;background:#f4d78a}' +
    '@keyframes bdrot399{0%,18%{transform:rotate(0)}48%,78%{transform:rotate(-90deg)}100%{transform:rotate(0)}}' +
    '#bd-rotate-v399 .t1{font-size:19px;font-weight:800;margin-top:18px;letter-spacing:.5px}' +
    '#bd-rotate-v399 .t2{font-size:13px;color:#b9c7dd;margin-top:6px;line-height:1.5}' +
    '#bd-rotate-v399 .hint{display:none;margin-top:14px;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.55;' +
      'background:rgba(244,215,138,.14);border:1px solid rgba(244,215,138,.45);color:#ffe9b0;max-width:340px}' +
    '#bd-rotate-v399.late .hint{display:block}' +
    '#bd-rotate-v399 .row{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;justify-content:center}' +
    '#bd-rotate-v399 button{min-height:44px;padding:10px 18px;border-radius:999px;border:0;font-size:14px;font-weight:700;' +
      'cursor:pointer;font-family:inherit}' +
    '#bd-rotate-v399 .lock{background:#f4d78a;color:#2a1e08}' +
    '#bd-rotate-v399 .skip{background:rgba(255,255,255,.12);color:#dfe7fb;border:1px solid rgba(255,255,255,.25)}' +

    /* ② 낮은 화면의 시작 설정 모달 — 초상·여백 축소로 버튼이 스크롤 없이 보이게 */
    '@media (max-height:400px){' +
      '#bd-startsetup-modal .bd-modal-box{padding:10px 14px!important;gap:4px!important}' +
      '#bd-startsetup-modal .bd-modal-title{font-size:16px!important;margin-bottom:2px!important}' +
      '#bd-startsetup-modal .bd-modal-box img{height:64px!important}' +
      '#bd-startsetup-modal #bd-char-1,#bd-startsetup-modal #bd-char-2{padding:6px 12px!important}' +
      '#bd-startsetup-modal .bd-modal-box>div[style*="margin-bottom:16px"]{margin-bottom:8px!important}' +
      '#bd-startsetup-modal .modal-btn{padding:9px 22px!important}' +
    '}' +

    /* ③ 터치 버튼 라벨 — 5px 로 찍히던 «대화/조사» */
    '.tc-btn-label{font-size:12px!important;opacity:1!important;letter-spacing:0!important;line-height:1.1!important}' +
    '.tc-btn-key{font-size:10px!important;color:rgba(200,222,255,.9)!important}' +

    /* ④ 키보드가 떠서 보이는 높이가 줄었을 때 — 값은 JS 가 --bd-vv-* 로 넣는다 */
    'html.bd-kbd .bd-modal.show{top:var(--bd-vv-top,0)!important;height:var(--bd-vv-h,100%)!important;bottom:auto!important;' +
      'align-items:flex-start!important;padding-top:6px!important;box-sizing:border-box}';
  (document.head || document.documentElement).appendChild(st);

  /* ── ① 세로 방향 안내 ─────────────────────────────────────────────────── */
  var ov = null, lateTimer = null, dismissed = false;
  try { dismissed = sessionStorage.getItem('bd_rotate_skip_v399') === '1'; } catch (e) {}

  function canLock() {
    return !!(screen.orientation && screen.orientation.lock) && !IOS;
  }
  function requestFs() {
    try {
      if (window.BD_requestFullscreen) { window.BD_requestFullscreen(); return true; }
      var el = document.documentElement;
      var fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) { var r = fn.call(el, { navigationUI: 'hide' }); if (r && r.catch) r.catch(function () {}); return true; }
    } catch (e) {}
    return false;
  }
  function lockLandscape() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        var p = screen.orientation.lock('landscape');
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
  }
  function build() {
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'bd-rotate-v399';
    var hint = IOS
      ? '돌려도 화면이 안 바뀌면 <b>제어센터</b>에서 🔒 <b>「화면 방향 잠금」</b>을 꺼 주세요.'
      : '돌려도 화면이 안 바뀌면 <b>빠른 설정</b>에서 🔄 <b>「자동 회전」</b>을 켜 주세요.';
    ov.innerHTML =
      '<div class="ph" aria-hidden="true"></div>' +
      '<div class="t1">기기를 가로로 돌려주세요</div>' +
      '<div class="t2">봉담 안전지도 대작전은 가로 화면에 맞춰져 있어요</div>' +
      '<div class="hint">' + hint + '</div>' +
      '<div class="row">' +
        (canLock() ? '<button type="button" class="lock">🔄 가로로 고정</button>' : '') +
        '<button type="button" class="skip">그냥 계속하기</button>' +
      '</div>';
    var lock = ov.querySelector('.lock');
    if (lock) lock.addEventListener('click', function () {
      /* 제스처 안에서 전체화면 → 잠금. 전체화면이 아직 아니면 fullscreenchange 뒤에 다시 시도 */
      var wasFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!wasFs) requestFs();
      lockLandscape();
      if (!wasFs) setTimeout(lockLandscape, 350);
    });
    ov.querySelector('.skip').addEventListener('click', function () {
      dismissed = true;
      try { sessionStorage.setItem('bd_rotate_skip_v399', '1'); } catch (e) {}
      hide();
    });
    document.body.appendChild(ov);
    return ov;
  }
  function show() {
    build();
    if (ov.classList.contains('show')) return;
    ov.classList.remove('late');
    ov.classList.add('show');
    clearTimeout(lateTimer);
    lateTimer = setTimeout(function () { if (ov && ov.classList.contains('show')) ov.classList.add('late'); }, 5000);
  }
  function hide() {
    clearTimeout(lateTimer);
    if (ov) ov.classList.remove('show', 'late');
  }
  function portrait() {
    try { if (window.matchMedia && matchMedia('(orientation: portrait)').matches) return true; } catch (e) {}
    return window.innerHeight > window.innerWidth;
  }
  function check() {
    if (!document.body) return;
    if (MOBILE && portrait() && !dismissed) show(); else hide();
  }
  function bindRotate() {
    window.addEventListener('resize', function () { setTimeout(check, 60); });
    window.addEventListener('orientationchange', function () { setTimeout(check, 250); });
    try {
      var mq = matchMedia('(orientation: portrait)');
      if (mq.addEventListener) mq.addEventListener('change', function () { setTimeout(check, 60); });
    } catch (e) {}
    check();
  }

  /* ── ④ visualViewport — 키보드·주소창 ─────────────────────────────────── */
  function vvApply() {
    var vv = window.visualViewport;
    var root = document.documentElement;
    if (!vv) return;
    var shrunk = (window.innerHeight - vv.height) > 80;   /* 주소창 몇 px 는 무시, 키보드만 잡는다 */
    if (shrunk) {
      root.style.setProperty('--bd-vv-top', Math.round(vv.offsetTop) + 'px');
      root.style.setProperty('--bd-vv-h', Math.round(vv.height) + 'px');
      root.classList.add('bd-kbd');
      var ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) {
        setTimeout(function () { try { ae.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {} }, 120);
      }
    } else {
      root.classList.remove('bd-kbd');
      root.style.removeProperty('--bd-vv-top');
      root.style.removeProperty('--bd-vv-h');
    }
  }
  function bindVV() {
    if (!window.visualViewport) return;
    visualViewport.addEventListener('resize', function () { setTimeout(vvApply, 40); });
    visualViewport.addEventListener('scroll', function () { setTimeout(vvApply, 40); });
    document.addEventListener('focusin', function () { setTimeout(vvApply, 300); });
    document.addEventListener('focusout', function () { setTimeout(vvApply, 300); });
  }

  function boot() { bindRotate(); bindVV(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* QA 용 */
  window.BD_POLISH399 = {
    rotate: { show: show, hide: hide, check: check, el: function () { return ov; } },
    vv: vvApply,
    env: { ios: IOS, android: ANDROID, touch: TOUCH, mobile: MOBILE, canLock: canLock() }
  };
})();
