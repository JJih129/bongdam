
/* (v113) "골목의 소음"이 noise_bat 변형에 연결돼 있는데,
   그 변형의 이름·교육 문구가 '먼지 회오리'로 되어 있어 전투 중 소음과 무관한 설명이 나왔다.
   (dust 변형과 이름·문구가 완전히 동일 = 중복 정의)
   → noise_bat 을 소음 위험요소에 맞는 이름·설명으로 바로잡는다. */
(function(){
  'use strict';
  function fix(){
    try{
      var V = window.HAZARD_VARIANTS || window.BD_HAZARD_VARIANTS;
      if (!V || !V.noise_bat) return false;
      if (V.noise_bat.__bdFixed) return true;
      // (v113a) noise_bat 과 dust 가 같은 객체를 공유하고 있어 한쪽만 고치면 둘 다 바뀐다.
      //  → noise_bat 에 별도 사본을 만들어 소음 전용으로 분리한다. (dust 는 원래 문구 유지)
      var src = V.noise_bat;
      var copy = {};
      Object.keys(src).forEach(function(k){ copy[k] = src[k]; });
      copy.name = '밤의 소음 그림자';
      copy.edu  = '늦은 밤 큰 소음은 이웃의 잠을 방해해요. 소리는 줄이고, 심하면 어른께 알려요.';
      if (copy.look != null) copy.look = '어디선가 울리는 소음이 골목을 맴돈다. 밤늦게까지 이러면 다들 힘들겠어.';
      copy.__bdFixed = true;
      V.noise_bat = copy;
      return true;
    }catch(e){ return false; }
  }
  var n = 0;
  var t = setInterval(function(){ n++; if (fix() || n > 60) clearInterval(t); }, 300);
  setTimeout(fix, 5000);
})();
