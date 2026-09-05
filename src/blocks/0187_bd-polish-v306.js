
/* (v306) 터치 «물러나기» 최소 44px · 보상 카드 아이콘 픽셀 보정 */
(function(){
  'use strict';
  var st = document.createElement('style');
  st.textContent = 'html.bd-touch-mode .hsr-act{min-height:44px;}'
    + '.bd-quest-reward img, #bd-quest-detail img{image-rendering:pixelated;border-radius:8px;}';
  document.head.appendChild(st);
})();
