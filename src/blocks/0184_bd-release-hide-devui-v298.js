
/* (v298) 게시 모드에선 「맵 시안」 개발용 버튼·패널을 숨긴다 (?dev=1 로만 노출).
   bd-concept-map-runtime 이 무조건 버튼을 만들기 때문에 CSS 로 가리고 주기 점검한다 */
(function(){
  'use strict';
  var dev = /[?&]dev=1/.test(location.search);
  if (dev) return;
  var st = document.createElement('style');
  st.textContent = '#bd-concept-map-button,#bd-concept-map-panel{display:none !important;}';
  document.head.appendChild(st);
})();
