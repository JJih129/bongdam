/* (v398) 「시작하기」 후 전체화면 복원 — 풀린 채로 방치되지 않게 한다.
 *
 * 왜 풀리는가 (계측으로 확정):
 *   0154 의 시작 훅이 배치·세이브를 purge 한 뒤 location.reload() 한다.
 *   정리가 «배치를 읽기 전»에 끝나야 하는 구조라 리로드 자체는 없앨 수 없다.
 *   그리고 브라우저는 리로드를 넘어 전체화면을 유지하지 않는다 — 규격이다.
 *
 *   실측(852x340, Playwright):
 *     전체화면 진입 → true
 *     「시작하기」 클릭 → false      ← 여기서 풀린다
 *     그 뒤 아무 탭   → true        ← 0015 의 firstActivation 이 복원
 *
 *   즉 «복원은 되지만, 사용자가 아무 데나 누를 때까지 풀린 채로 있다».
 *   그 사이 주소창이 다시 나타나 화면이 좁아지고, 사용자는 고장으로 느낀다.
 *
 * 무엇을 하는가:
 *   리로드 «전»에 전체화면이었는지 기록해 두고, 리로드 «후»에 안내 판을 띄운다.
 *   그 판을 한 번 누르면 그 입력이 곧 사용자 제스처가 되어 전체화면이 복원된다.
 *   자동 복원은 불가능하다(제스처 필수). 대신 «한 번의 의도된 탭»으로 만든다.
 *
 * 표식 키에 주의: 0243 이 매 로드마다 sessionStorage 의 'bd_refs' 를 지운다.
 *   (0154 가 v379 에서 넣은 복원 표식이 그래서 무력화돼 있다.)
 *   따라서 겹치지 않는 키를 쓴다.
 */
(function () {
  'use strict';

  var KEY = 'bd_fs_restore_v398';

  function inFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  /* ── 리로드 전: 시작 버튼을 누를 때 «전체화면이었다»를 남긴다 ──
     0154 는 버튼에 캡처 리스너를 달아 stopImmediatePropagation() 한다.
     document 캡처는 대상 요소보다 먼저 실행되므로 여기서는 확실히 잡힌다.
     가로채지 않고 관찰만 한다. */
  document.addEventListener('click', function (e) {
    try {
      var t = e.target;
      if (!t || !t.closest) return;
      if (!t.closest('#bd-title-start')) return;
      if (inFs()) sessionStorage.setItem(KEY, '1');
    } catch (err) {}
  }, true);

  /* ── 리로드 후: 표식이 있으면 한 번 눌러 복원하게 한다 ── */
  function veil() {
    try {
      if (sessionStorage.getItem(KEY) !== '1') return;
      sessionStorage.removeItem(KEY);
      if (inFs()) return;                       /* 이미 복원됐으면 필요 없다 */
      if (document.getElementById('bd-fsr-v398')) return;

      var d = document.createElement('div');
      d.id = 'bd-fsr-v398';
      d.style.cssText =
        'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;' +
        'justify-content:center;background:rgba(9,13,28,.82);cursor:pointer;' +
        '-webkit-tap-highlight-color:transparent;';
      d.innerHTML =
        '<div style="text-align:center;color:#ffd86b;font-size:16px;line-height:1.7;padding:22px 26px;' +
        'border:1px solid rgba(255,216,107,.45);border-radius:16px;background:rgba(13,19,36,.96);max-width:86vw">' +
        '<div style="font-size:30px;margin-bottom:8px">⛶</div>' +
        '<b>화면을 탭하면 전체화면으로 이어집니다</b>' +
        '<div style="color:#cfd8ef;font-size:13px;margin-top:8px">' +
        '새로 시작하면서 화면이 잠시 초기화됐어요</div></div>';

      function go() {
        try { d.remove(); } catch (e) {}
        /* 이 핸들러 자체가 사용자 제스처다 — 여기서 요청해야 허용된다 */
        try {
          if (typeof window.BD_requestFullscreen === 'function') window.BD_requestFullscreen();
          else {
            var el = document.documentElement;
            var fn = el.requestFullscreen || el.webkitRequestFullscreen;
            if (fn) fn.call(el);
          }
        } catch (e) {}
      }
      d.addEventListener('click', go, { once: true });
      d.addEventListener('touchend', go, { once: true });

      (document.body || document.documentElement).appendChild(d);
      /* 사용자가 무시하고 다른 곳을 눌렀다면 0015 의 firstActivation 이 이미 복원한다.
         그 경우 판만 걷어낸다. */
      var iv = setInterval(function () {
        if (inFs() || !d.parentNode) { clearInterval(iv); try { d.remove(); } catch (e) {} }
      }, 500);
      setTimeout(function () { clearInterval(iv); try { d.remove(); } catch (e) {} }, 20000);
    } catch (err) {}
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', function () { setTimeout(veil, 600); });
  else setTimeout(veil, 600);
  addEventListener('load', function () { setTimeout(veil, 900); });

  window.BD_FSR = { key: KEY, pending: function () { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } } };
})();
