/* (v370) 토스트 정리 — 담이·대화·임무 HUD가 이미 알려주는 «안내성·중복» 토스트는 표시하지 않는다.
   유지: 구매·보상·저장/불러오기·해금·지역 개방·회복·레벨업·스킬·오류 등 «결과 피드백».
   가장 바깥 래퍼로 설치(기존 v96 별칭·v287 보류 래퍼 위에). */
(function(){
  'use strict';
  var DROP = [
    /주민이 곤란해 보인다/, /가까이에서 F 키를 눌러 조사/, /「추적 중인 임무」를 참고/, /담이의 이야기를 잠깐 들어봐요/,
    /지도 가장자리로 가면 다음 동네/, /버스정류장이에요\. F 키로/, /그림자마다 약한 속성이 있어요/,
    /^📋 부탁 수락:/, /^📋 『.*의 부탁』 수락/, /^📜 새 임무:/, /^🔹 .+ \(\d+\/\d+\)$/, /^✨ 그림자가 흩어졌다/,
    /^👑 /, /^🧭 문화의집을 자유롭게/, /^🗺️ 봉담 안전도 \d+%/, /^이어서 진행합니다$/, /^전투에 들어가면 담이가 다시 안내해요$/,
    /^📌 임무를 추적합니다$/, /^추적 해제$/
  ];
  function install(){
    if (typeof window.bdToast !== 'function' || window.bdToast.__v370drop) return false;
    var inner = window.bdToast;
    window.bdToast = function(msg){
      try{ var s = String(msg == null ? '' : msg); for (var i = 0; i < DROP.length; i++){ if (DROP[i].test(s)) return; } }catch(e){}
      return inner.apply(this, arguments);
    };
    window.bdToast.__v370drop = true;
    return true;
  }
  var t = setInterval(function(){ try{ if (install()) clearInterval(t); }catch(e){} }, 300);
})();
