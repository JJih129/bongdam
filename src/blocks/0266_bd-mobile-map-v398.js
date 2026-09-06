/* (v398) 좁은 가로 화면의 안전지도 — 남는 가로를 지도 크기로 바꾼다.
 *
 * ── 실측 (874x300) ───────────────────────────────────────────────
 *   .m42-panel  선언 804 x client 285   (scrollHeight 325 → 40px 잘림)
 *   .m42-board  선언 228 x 228, aspect-ratio 1166/1168 (정사각),
 *               margin: 0 288px  ← 좌우로 288px 씩, 패널 폭의 72% 가 빈 공간
 *   화면 기준으로는 지도가 148x148 px, 화면 높이의 49% 밖에 안 된다.
 *
 *   즉 «가로는 72% 를 버리면서 세로는 잘리고 있다» — 정확히 반대로 하고 있다.
 *   원인은 세로 한 줄 배치다: 머리(34+10) · 보드 · 발(18+9) 이 위아래로 쌓이니
 *   보드가 쓸 수 있는 높이가 남지 않는다. 가로로 긴 화면에서는 머리·발을 옆으로
 *   보내면 그 높이가 전부 지도 몫이 된다.
 *
 * ── 방침 ──────────────────────────────────────────────────────────
 *   좁은 화면에서만 grid 2열로 바꾼다.
 *     [ 보드(세로 꽉) ][ 머리 ]
 *     [               ][ 발  ]
 *   보드는 height:100% + aspect-ratio 로 «높이가 정하고 너비가 따라오게» 한다.
 *   패널도 화면 높이를 더 쓰게 풀어 준다(원래 max-height 가 낮아 40px 이 잘렸다).
 *   넓은 화면에서는 규칙 자체를 제거하므로 PC·태블릿은 그대로다.
 */
(function () {
  'use strict';

  var ID = 'bd-mobile-map-v398-style';
  var NARROW_H = 520;

  function narrow() {
    try {
      if (!(navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches)) return false;
      return window.innerHeight <= NARROW_H;
    } catch (e) { return false; }
  }

  /* 패널이 zoom 안에 있어 vh 를 쓰면 안 된다.
     처음에 height:94vh 로 했더니 화면의 61% 밖에 안 됐다 — vh 는 레이아웃 뷰포트
     기준으로 «선언 px»을 만들고, 그 값이 다시 zoom(0.65)으로 축소되기 때문이다
     (94vh = 282px 선언 → 화면 183px). 그래서 요소에서 실제 배율을 재서 px 로 준다.
     offsetHeight 는 zoom 을 무시하고 rect 는 포함하므로 둘의 비가 곧 배율이다. */
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

    /* 패널은 지도를 처음 열 때 만들어진다. 없으면 vh 로 대충 두고, 생기면 정확히 맞춘다. */
    var panel = document.querySelector('#bd-map-v342 .m42-panel');
    var z = scaleOf(panel);
    var H = z ? Math.round(window.innerHeight * 0.94 / z) + 'px' : '94vh';
    var W = z ? Math.round(window.innerWidth * 0.97 / z) + 'px' : '97vw';

    var css =
      /* 패널: 화면 높이를 최대한 쓰고, 세로 스크롤 대신 격자로 담는다 */
      '#bd-map-v342 .m42-panel{' +
        'max-height:' + H + '!important;height:' + H + '!important;max-width:' + W + '!important;' +
        'display:grid!important;overflow:hidden!important;' +
        'grid-template-columns:auto minmax(0,1fr);' +
        'grid-template-rows:auto minmax(0,1fr);' +
        'grid-template-areas:"board head" "board foot";' +
        'column-gap:12px;row-gap:6px;padding:10px 12px!important;box-sizing:border-box;}' +

      /* 보드: 높이가 주인, 너비는 정사각 비율로 따라온다 */
      '#bd-map-v342 .m42-board{grid-area:board;align-self:stretch;justify-self:start;' +
        'height:100%!important;width:auto!important;aspect-ratio:1/1!important;' +
        'margin:0!important;max-width:none!important;}' +

      /* 머리는 flex 대신 grid 로 짠다.
         처음에 flex-wrap:wrap + tip{flex:1 1 100%} 로 했더니 안내 문구가 줄바꿈하지 않고
         버튼 오른쪽 좁은 칸에 눌려 «한 글자씩 세로로» 쪼개졌다. 줄바꿈 여부를 flex 에
         맡기지 말고 격자 칸을 직접 지정한다 — 문구는 아래 줄 전체를 쓴다. */
      '#bd-map-v342 .m42-head{grid-area:head;margin:0!important;align-self:start;' +
        'display:grid!important;grid-template-columns:1fr auto auto;' +
        'align-items:center;gap:6px 8px;}' +
      '#bd-map-v342 .m42-title{grid-column:1;grid-row:1;font-size:15px!important;' +
        'white-space:nowrap;}' +
      '#bd-map-v342 .m42-tip{grid-column:1/-1;grid-row:2;font-size:11px!important;' +
        'line-height:1.4;white-space:normal!important;}' +
      '#bd-map-v342 .m42-head .m42-x{min-height:34px;padding:0 10px!important;' +
        'font-size:12px!important;white-space:nowrap;grid-row:1;}' +
      '#bd-map-v342 .m42-head .m42-x:nth-of-type(1){grid-column:2;}' +
      '#bd-map-v342 .m42-head .m42-x:nth-of-type(2){grid-column:3;}' +

      '#bd-map-v342 .m42-foot{grid-area:foot;margin:0!important;align-self:start;' +
        'display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11px!important;line-height:1.4;}' +
      '#bd-map-v342 .m42-foot>span[style*="flex:1"]{display:none!important;}' +
      '#bd-map-v342 .m42-leg{flex:0 0 auto;}' +
      '#bd-map-v342 .m42-leg img{width:13px;height:13px;}';

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
    /* 패널은 지도를 처음 열 때 생기므로, 생긴 뒤 실제 배율로 다시 맞춘다. */
    setInterval(apply, 900);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();

  window.BD_MOBILE_MAP = { apply: apply, narrow: narrow };
})();
