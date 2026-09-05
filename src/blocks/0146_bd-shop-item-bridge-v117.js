
/* (v117) 상점에서 산 물건이 전투 아이템창에 안 보이던 문제
   · 기본 상점 품목(든든 샌드위치·에너지 음료·엄마표 홍삼 스틱 등)은 playerInventory 에 쌓이고,
     전투 아이템창은 BD.items(snack/potion/drink/revive)만 읽는다 → 목록이 서로 달랐다.
   · 두 저장소를 이어 준다: 회복 계열 인벤토리 수량을 전투용 항목으로 환산해 반영. */
(function(){
  'use strict';
  // 인벤토리 아이템 → 전투 항목 매핑 (효과 성격 기준)
  // (v281) 현재 판매 중인 회복품(삼각김밥·샌드위치·반창고·홍삼 스틱)은 전투 아이템창이
  //  가방(playerInventory)을 직접 읽도록 바뀌어 매핑에서 제거 — 남겨두면 같은 아이템이
  //  간식/회복약으로도 복제돼 이중 계산된다. 음료(drink)는 SP 시스템 폐지(v239)로 매핑 중단.
  var MAP = {
    '초코 간식':'snack', '견과 바':'snack', '즉석 도시락':'snack',
    '구급 회복약':'potion', '파스 세트':'potion', '종합 구급팩':'potion'
  };
  var lastSeen = {};

  function sync(){
    try{
      if (typeof playerInventory === 'undefined' || !window.BD) return;
      BD.items = BD.items || {};
      Object.keys(playerInventory).forEach(function(id){
        var it = playerInventory[id]; if (!it) return;
        var nm = it.name || id;
        var key = MAP[nm];
        if (!key) return;
        var cnt = Number(it.count || 0);
        // (v118) 최초에도 보유분을 반영한다 —
        //  기준만 잡고 넘기면 이미 갖고 있던 상점 물건이 전투 목록에 영영 안 뜬다.
        var prev = lastSeen[id];
        if (prev === undefined) prev = 0;
        if (cnt > prev){
          BD.items[key] = (BD.items[key] || 0) + (cnt - prev);
        }
        lastSeen[id] = cnt;
      });
    }catch(e){}
  }
  setTimeout(sync, 2000);
  setInterval(sync, 800);
})();
