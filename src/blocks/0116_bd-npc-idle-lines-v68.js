
/* (v68) 주민 기본(대기) 대사 정리 — 새 '부탁' 체계와 중복 제거
   기존 원대사가 위험요소를 직접 언급하며 부탁하는 투라, 튜토리얼 전이나 부탁 완료 후에도
   "정리해 달라"는 말이 반복돼 진행 상태와 어긋나 보였다. → 자기소개·일상 대사로 교체하고
   실제 부탁은 ❗ 표시가 뜬 뒤 부탁 대사(v57 체계)로만 나오게 한다. */
(function(){
  'use strict';
  var IDLE = {
    '은지':        ['안녕하세요, 지킴이! 저는 은지예요. 이 앞 아파트에 살아요.',
                    '동네 소식은 저한테 물어보세요. 골목골목 다 알거든요!'],
    '사서 도현':   ['봉담도서관 사서 도현이에요. 도서관은 1·2층이고, 3층은 청소년문화의집이에요.',
                    '더울 땐 잠깐 들어와서 쉬다 가셔도 좋아요.'],
    '서연':        ['난 서연이야! 이 공원에서 자주 놀아.',
                    '지킴이 배지 진짜 멋있다… 나도 언젠가 받고 싶어!'],
    '하늘':        ['어린이문화센터의 하늘이에요. 아이들 프로그램을 맡고 있어요.',
                    '센터에도 한번 놀러 오세요. 아이들이 좋아할 거예요!'],
    '은지 어머니': ['은지 엄마예요. 우리 은지랑 친하게 지내 줘서 고마워요.',
                    '다니다 힘들면 언제든 들러서 쉬어 가요.'],
    '약사 도윤':   ['수영약국 약사 도윤입니다. 다친 데 있으면 언제든 오세요.',
                    '무리하지 말고, 물도 자주 마시고요.']
  };
  function apply(){
    try{
      if (typeof STAGES === 'undefined') return;
      [212, 213, 211, 210].forEach(function(sid){
        var st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o){
          if (!o || !o.npcName) return;
          var lines = IDLE[String(o.npcName).trim()];
          if (!lines) return;
          if (o.__bdHzQuestLines) return;            // 부탁·감사 대사가 우선
          if (o.__bdIdleV68) return;                 // 이미 교체됨
          o.npcLines = lines.slice();
          o.__bdOrigLines = lines.slice();           // 부탁 종료 후 복귀도 새 대사로
          o.__bdIdleV68 = true;
        });
      });
    }catch(e){}
  }
  setInterval(apply, 700);
  setTimeout(apply, 1500);
})();
