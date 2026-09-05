
/* (v376) 브라우저·기기 호환 레이어
   ① 모바일 노치(safe-area)·주소창(dvh) 대응 CSS 주입
   ② 더블탭 확대 방지(touch-action) — iOS 10+ 는 viewport user-scalable=no 를 무시한다
   ③ file:// + 사파리 조합에서 저장(localStorage) 미보존 가능성 경고 1회
   ④ localStorage 자체가 막힌 환경(프라이빗 모드 등) 경고 */
(function(){
  'use strict';
  /* ── ① CSS 주입 ── */
  var css = ''
    /* 더블탭 확대·스크롤 바운스 방지 — 게임 캔버스·버튼 연타가 확대 제스처로 오인되던 문제 */
    + 'html,body{touch-action:manipulation;overscroll-behavior:none;}'
    + '#game-canvas{touch-action:none;}'
    /* 모바일 주소창 변동 — 100vh 가 주소창 포함 높이로 잡혀 하단 UI 가 잘리던 문제 */
    + '@supports (height:100dvh){ #game-screen, #bd-title-screen { min-height:100dvh; } }'
    /* 노치·홈바(safe-area) — 터치 컨트롤·키 안내바·담이 HUD 가 파인 영역과 겹치지 않게 */
    + '@supports (padding:env(safe-area-inset-left)){'
    +   '#bd-touch-controls{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);padding-bottom:env(safe-area-inset-bottom);}'
    +   '#bd-keybar{margin-bottom:env(safe-area-inset-bottom);}'
    +   '#bd-dami-hud{margin-left:env(safe-area-inset-left);margin-bottom:env(safe-area-inset-bottom);}'
    +   '#bd-menu-btns{margin-right:env(safe-area-inset-right);}'
    + '}';
  var st = document.createElement('style'); st.id = 'bd-compat-v376'; st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  /* ── ②~④ 저장·환경 경고 ── */
  function warnOnce(key, msg){
    try{ if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); }catch(e){}
    var iv = setInterval(function(){
      try{
        if (typeof bdToast !== 'function') return;
        clearInterval(iv);
        bdToast(msg, 6000);
      }catch(e){}
    }, 1200);
  }
  try{
    var ua = navigator.userAgent || '';
    var isSafari = /Safari\//.test(ua) && !/Chrom|Edg|OPR|CriOS|FxiOS|Android/.test(ua);
    var storageOK = false;
    try{ localStorage.setItem('__bd_probe', '1'); storageOK = localStorage.getItem('__bd_probe') === '1'; localStorage.removeItem('__bd_probe'); }catch(eS){}
    if (!storageOK)
      warnOnce('bd_warn_storage', '⚠️ 이 브라우저 설정에서는 진행 저장이 되지 않아요 (프라이빗 모드 해제 또는 다른 브라우저 권장)');
    else if (isSafari && location.protocol === 'file:')
      warnOnce('bd_warn_safari_file', '⚠️ 사파리에서 파일로 직접 열면 저장이 유지되지 않을 수 있어요 — 웹 주소로 접속해 플레이하는 걸 권장해요');
  }catch(e){}
})();

/* (v382) 전체화면 첫 입력/리로드 복원은 0015의 단일 컨트롤러가 담당한다.
   구버전 복원 표식만 정리해 중복 requestFullscreen() 호출을 막는다. */
(function(){ try{ sessionStorage.removeItem('bd_refs'); }catch(e){} })();
