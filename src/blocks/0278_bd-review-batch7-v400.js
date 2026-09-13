/* (v400) 갤러리 검수 반영 묶음 7 — 수첩 배경 블러 · 가방 닫기 안내 대비 · 스킬 카드 메뉴 중 «내 차례» 문구 숨김 ·
 *   조작법 창이 열리면 설정 창 잠시 숨김 · 전투 시작 때 필드에서 하던 담이 말이 말풍선에 남는 것 정리
 *   (문자열 수정은 원본에서: 0053 임무 창 제목 «📋 임무»·보상 카드 🎴·장비 «🔧 장비», 0070 툴팁 띄어쓰기, 0273 «다시 보기», 0095 나침반 칸 문구) */
(function () {
  'use strict';
  var st = document.createElement('style');
  st.id = 'bd-review-batch7-v400';
  st.textContent =
    /* 안전 수첩만 뒤 배경이 또렷했다 → 다른 창(임무·리포트·장비)과 같은 블러 */
    '#bd-codex-ov{backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}'
    /* 가방 바닥 «E 또는 ESC 키로 닫기» — 11px 연회갈색이라 크림 배경에서 안 보였다 */
    + '#inv-footer{color:#6b5230!important;font-size:12px!important;font-weight:700}'
    /* 배지 스킬 카드 메뉴가 떠 있는 동안 그 아래 «내 차례! …» 문구 윗부분이 잘려 보였다 → 메뉴 중엔 숨김 */
    + 'body:has(#hsr-skill-menu) #hsr-turnmsg{opacity:0!important}'
    /* 설정 창에서 «조작법»을 열면 두 창이 겹쳐 닫기 버튼이 둘 보였다 → 조작법이 떠 있는 동안 설정 창 숨김(닫으면 다시 보임) */
    + 'body:has(#bd-pc-help) #bd-settings-modal{visibility:hidden!important}';
  document.head.appendChild(st);

  /* 전투 진입 직전 필드에서 하던 담이 말(«저기 쓰레기가 쌓여 있어요…»)이 전투 화면에 그대로 남았다.
     전투 안에서 새로 한 말(sayInBattle·스킬 튜토)은 건드리지 않고, 전투 전 마지막 문장이 그대로면 접는다. */
  var wasBattle = false, preText = null;
  setInterval(function () {
    try {
      var D = window.BD_DAMI; if (!D) return;
      var on = !!(window.HSR && HSR.active);
      if (!on) { preText = D._lastText; wasBattle = false; return; }
      if (wasBattle) return;
      wasBattle = true;
      if (D._active && preText != null && D._lastText === preText && !(window.BD_TUTOR && BD_TUTOR.isRunning())) D.hide();
    } catch (e) {}
  }, 300);
})();
