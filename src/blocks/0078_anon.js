/* ══ (v234) 모바일 UX 2차 ══
   ③ 화면 아무 데나 탭 = 대화 진행 (버튼·조이스틱 영역 제외)
   ※ (v390) ① 상단 메뉴 ☰ 접기 · ② 개발용 버튼 숨김은 0254 메뉴줄 단일 관리자로 이관 */
(function(){
  'use strict';
  var IS_TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (!IS_TOUCH) return;

  function el(id){ return document.getElementById(id); }

  /* ── ③ 화면 탭 = 대화 진행 ── */
  document.addEventListener('touchstart', function(e){
    try{
      // 대화 중일 때만
      var vn = el('dialogue-box');
      var talking = vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05;
      if (!talking) return;
      // 조작 UI 위 탭은 각자 처리에 맡긴다
      var t = e.target;
      if (t && t.closest && t.closest('#touch-controls, #bd-menu-btns, .bd-modal, #bd-choice, #inv-overlay, #bd-guide-ov, .hsr-act, #hsr-result'))
        return;
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    }catch(err){}
  }, { capture: true, passive: false });
})();
