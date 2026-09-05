
/* (v117) HTML을 그냥 열면 브라우저에 남아 있던 옛 배치(localStorage)가
   파일에 구워진 배치를 덮어써서 위험요소가 안 보이던 문제.
   («이 파일 기준 초기화»를 눌러야만 정상이 되던 증상)

   → 이 빌드 번호를 처음 여는 경우에만, 에디터가 저장본을 읽기 전에(head·동기 실행)
     옛 저장을 백업하고 비운다. 리로드하지 않으므로 무한 새로고침 위험이 없다.
     같은 빌드를 다시 열면 아무 것도 하지 않아 에디터 작업은 그대로 유지된다. */
(function(){
  'use strict';
  var BUILD = 'bd-bake-4f6024a0-3145728';   /* (v319) 베이크 내용 해시 — 데이터가 바뀌면 자동으로 새 스탬프 */
  var STAMP = 'bd_bake_stamp';
  var K  = 'bongdam_rpg_editor_data_v5_2_quest';
  var LK = 'bongdam_rpg_editor_project_v5_2_quest';
  try{
    if (localStorage.getItem(STAMP) === BUILD) return;   // 같은 빌드 → 유지
    try{
      var old = localStorage.getItem(K);
      if (old) localStorage.setItem(K + '_prev', old);   // 되돌릴 수 있게 백업
      localStorage.removeItem(K);
      localStorage.removeItem(K + '_bakeGen');
    }catch(e1){}
    try{
      var lv = localStorage.getItem(LK);
      if (lv){ localStorage.setItem(LK + '_prev', lv); localStorage.removeItem(LK); }
    }catch(e2){}
    localStorage.setItem(STAMP, BUILD);
    try{ console.info('[v117] 새 빌드 — 이 파일에 구워진 배치로 시작합니다.'); }catch(e3){}
  }catch(e){}
})();
