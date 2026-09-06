/* (v398) 모바일 카메라 줌 — «맵 밖까지 보느라 캐릭터가 작아지는» 것을 되돌린다.
 *
 * ── 왜 필요한가 (실측) ────────────────────────────────────────────
 *   currentScale = min(canvas.w/BASE_W, canvas.h/BASE_H) 라 «짧은 축»이 기준이 된다.
 *   가로로 긴 폰에서는 세로가 기준이 되고 가로는 남는 만큼 그대로 늘어난다.
 *
 *     PC   1440x900  보이는 월드 0.736 x 0.614
 *     탭   1280x800  보이는 월드 0.737 x 0.614
 *     폰    874x300  보이는 월드 1.341 x 0.614   ← 월드 폭은 1.0 뿐이다
 *
 *   즉 폰은 «맵 폭의 134%»를 보고 있었다. 맵 밖 여백을 34% 나 화면에 채우면서
 *   그만큼 모든 것이 작게 그려진다. 실측으로 문화의집 선생님 스프라이트가
 *     PC 139x139 px  →  폰 46x46 px  (정확히 1/3)
 *   화면 높이 대비 비율은 15.5% 로 «같다». 비율은 맞는데 물리 크기가 1/3 인 것이다.
 *   6.3인치 가로 화면에서 46px 은 유리 위 약 8mm — 사용자가 «선생님이 안 보인다»고
 *   한 것은 로딩 실패가 아니라 이것이었다(스프라이트는 complete:true, 보류 0 이었다).
 *
 * ── 어떻게 고치나 ────────────────────────────────────────────────
 *   가로로 버리고 있는 34% 를 줌으로 되돌린다. 맵 밖을 덜 보는 것뿐이라 «잃는 정보가 없다».
 *   고정 배율을 박지 않고 화면을 재서 정한다 — 기기마다 남는 양이 다르기 때문이다.
 *     목표 1: 가로로 맵 폭(1.0)보다 더 보지 않는다
 *     목표 2: 그 대가로 세로 시야가 MIN_VIS_H 아래로 내려가지 않는다 (위험요소를 놓치지 않게)
 *   두 목표가 충돌하면 세로를 지킨다. 어느 쪽도 필요 없으면 줌 1 — PC·태블릿은 그대로다.
 *
 *   VIEWPORT 를 줄이면 월드 단위 스프라이트는 자동으로 커지지만 고정픽셀 스프라이트는
 *   VIEWPORT 를 보지 않는다. 그래서 0017 의 BD_applyViewScale 에서 BD_SPR 에도 같은 배율을
 *   곱한다(그쪽에 주석을 달아 뒀다). 여기서는 «얼마나» 만 정한다.
 */
(function () {
  'use strict';

  var TARGET_VIS_W = 1.00;   /* 가로로 이보다 넓게 보지 않는다 (월드 폭 = 1.0) */
  var MIN_VIS_H    = 0.45;   /* 세로 시야 하한 — 이보다 좁아지면 줌을 포기한다 */
  var MAX_ZOOM     = 1.60;   /* 안전 상한 */
  var EPS          = 0.02;

  function touchLike() {
    try {
      if (navigator.maxTouchPoints > 0) return true;
      return matchMedia('(pointer: coarse)').matches;
    } catch (e) { return false; }
  }

  function num(name) {
    try { var v = eval(name); return (typeof v === 'number' && isFinite(v)) ? v : null; } catch (e) { return null; }
  }

  /* 지금 화면에 실제로 보이는 월드 크기.
     VIEWPORT_W 에는 이미 적용된 줌이 반영돼 있으므로, 여기서 나오는 값은 «현재» 시야다.
     그래서 보정은 self-correcting 하다 — 목표를 넘으면 그만큼만 더 줄인다. */
  function visible() {
    var cv = document.getElementById('game-canvas');
    var vw = num('VIEWPORT_W'), vh = num('VIEWPORT_H'), cs = num('currentScale');
    var bw = num('BASE_W'), bh = num('BASE_H');
    if (!cv || !vw || !vh || !cs || !bw || !bh) return null;
    if (!cv.width || !cv.height) return null;
    return { w: vw * cv.width / (cs * bw), h: vh * cv.height / (cs * bh) };
  }

  var applied = 1;

  function tune() {
    try {
      if (!touchLike()) return;
      if (typeof window.BD_applyViewScale !== 'function' && typeof BD_applyViewScale !== 'function') return;
      var v = visible();
      if (!v) return;

      /* 가로가 목표 안이면 손대지 않는다 (태블릿·PC 는 여기서 끝) */
      if (v.w <= TARGET_VIS_W * (1 + EPS) && applied <= 1 + EPS) return;

      var want = applied * (v.w / TARGET_VIS_W);       /* 가로를 목표에 맞추는 배율 */
      var hCap = applied * (v.h / MIN_VIS_H);          /* 세로 하한이 허용하는 최대 배율 */
      want = Math.min(want, hCap, MAX_ZOOM);
      if (!(want > 0) || !isFinite(want)) return;
      if (want < 1) want = 1;
      if (Math.abs(want - applied) < EPS) return;

      applied = want;
      window.BD_MOBILE_ZOOM = want;
      (window.BD_applyViewScale || BD_applyViewScale)();
    } catch (e) {}
  }

  function boot() {
    /* 스테이지 전환·회전 후에도 다시 맞춘다. BD_applyViewScale 이 스테이지마다 다시 불리는데
       window.BD_MOBILE_ZOOM 을 계속 들고 있으므로 값은 유지되고, 여기서는 목표에서
       벗어났을 때만 다시 계산한다(같으면 아무 일도 하지 않는다). */
    setInterval(tune, 700);
    addEventListener('resize', function () { setTimeout(tune, 120); });
    addEventListener('orientationchange', function () { setTimeout(tune, 320); });
    tune();
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  window.BD_MOBILE_CAM = {
    tune: tune,
    state: function () { return { 적용줌: applied, 보이는월드: visible() }; },
    set: function (z) {                          /* 실기기에서 손으로 비교해 볼 때 */
      applied = z; window.BD_MOBILE_ZOOM = z;
      try { (window.BD_applyViewScale || BD_applyViewScale)(); } catch (e) {}
      return this.state();
    }
  };
})();
