
/* (v210) 로딩 화면 제거 — 문서 파싱·초기화 완료 후 페이드아웃 */
(function(){
  function hide(){
    var b = document.getElementById('bd-boot');
    if (!b) return;
    b.style.opacity = '0';
    setTimeout(function(){ try{ b.remove(); }catch(e){} }, 600);
  }
  if (document.readyState === 'complete') setTimeout(hide, 200);
  else window.addEventListener('load', function(){ setTimeout(hide, 200); });
  setTimeout(hide, 12000);   // 안전 폴백
})();
