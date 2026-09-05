
/* ══════════════════════════════════════════════════════════════════
   (v240) BD_MAP_TWEAKS — 배치 감사 보정
   ------------------------------------------------------------------
   전 스테이지 경계상자 오버레이 + 겹침 검출로 찾은 오배치 6건 수정.
   · S1 쓰레기 더미: 카페 건물 내부 88% 겹침 → 광장 보도로
   · S1 최종 보스: 카페 모서리 접촉 → 우측으로 살짝
   · S1 사서 은경: 공원 울타리 36% 겹침 → 공원 밖으로
   · S3 주민 영자: 깨진 유리 위 64% 겹침 → 유리 왼쪽 보도로
   · S3 어두운 산책로: 아파트 벽면 접촉 → 산책로 위로
   · S4 낙서: 허공 → 문화센터 벽면에 붙임
   STAGES 원본과 __BD_DEFAULT_HAZARDS 스냅샷을 함께 고쳐
   재주입돼도 보정 좌표가 유지된다.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var TWEAKS = [
    { sid:'1', label:'버려진 쓰레기 더미',   set:{ rx:0.365 } },
    { sid:'1', label:'쌓여있던 위험들',     set:{ rx:0.615 } },
    { sid:'1', label:'사서 은경',          set:{ rx:0.212 } },
    { sid:'3', label:'장보러 나온 영자',    set:{ rx:0.545, ry:0.660 } },
    { sid:'3', label:'어두운 산책로',       set:{ ry:0.400 } },
    { sid:'4', label:'벽을 더럽힌 낙서',    set:{ rx:0.328, ry:0.390 } },
  ];
  function applyTo(list){
    var n = 0;
    if (!Array.isArray(list)) return 0;
    TWEAKS.forEach(function (tw) {
      list.forEach(function (o) {
        if (!o || !o.label || o.label.indexOf(tw.label) < 0) return;
        Object.keys(tw.set).forEach(function (k) { o[k] = tw.set[k]; });
        n++;
      });
    });
    return n;
  }
  function run(){
    try{
      if (typeof STAGES === 'undefined') { setTimeout(run, 400); return; }
      var n = 0;
      /* (v334) 자기 스테이지에만 적용 — 라벨이 같은 신월드(210~213) 오브젝트까지
         덮어 사용자 배치(새 베이크)를 되돌리던 문제 */
      TWEAKS.forEach(function (tw) {
        var st = STAGES[tw.sid];
        if (!st || !st.objects) return;
        st.objects.forEach(function (o) {
          if (!o || !o.label || o.label.indexOf(tw.label) < 0) return;
          Object.keys(tw.set).forEach(function (k) { o[k] = tw.set[k]; });
          n++;
        });
      });
      if (window.__BD_DEFAULT_HAZARDS) {
        TWEAKS.forEach(function (tw) {
          var arr = window.__BD_DEFAULT_HAZARDS[tw.sid];
          if (!Array.isArray(arr)) return;
          arr.forEach(function (o) {
            if (!o || !o.label || o.label.indexOf(tw.label) < 0) return;
            Object.keys(tw.set).forEach(function (k) { o[k] = tw.set[k]; });
          });
        });
      }
    }catch(e){}
  }
  run();
  setTimeout(run, 3000);   // 늦게 도는 로더가 STAGES 를 덮는 경우 대비
})();

