
/* (v39) 신맵 주요시설 승격 — 각 리의 장 조건(stampAnyOf) 시설이 majorFacility 마킹 누락으로
   랜드마크(구경 전용)로만 남아 F 상호작용·방문 스탬프가 불가능했다.
   수영약국 보정(v25)과 같은 패턴으로, FMAP 매핑 대상 시설을 상호작용 가능한 시설로 승격한다. */
(function(){
  'use strict';
  var TARGETS = {   // (v39b) 실제 배치 기준 — 시민캠퍼스는 동화리, 그린환경센터는 상리 맵에 있다
    212: ['wawoo_complex'],
    213: ['bongdam_library', 'cotton_candy_youth', 'green_environment_center'],
    211: ['children_center', 'national_sports_center', 'citizen_campus'],
    210: ['suyeong_pharmacy']
  };
  function promote(o){
    if (!o) return;
    o.majorFacility = true;
    o.conceptFacility = true;
    o.conceptLandmark = false;
    o.collectible = true;
    o.visualOnly = false;
    if (o.hidden) o.hidden = false;
    if (o.locked) o.locked = false;
  }
  /* (v40) 새 배치의 '봉담문화의집'(사용자 커스텀 건물)이 기존 도서관·문화의집 복합시설의
     역할(공용 현관 → 1·2층 도서관 / 3층 문화의집 선택 → 방문 스탬프)을 이어받는다.
     — 기존 wawoo_complex 랜드마크는 새 배치에서 제거되었다. */
  function adoptCultureHouse(){
    var st = STAGES[212]; if (!st || !Array.isArray(st.objects)) return;
    if ((st.__v24Landmarks || []).some(function(o){ return o && o.facilityId === 'wawoo_complex'; })) return;
    var o = st.objects.find(function(x){ return x && x._editorId === 'pal_msh2uz29'; });
    if (!o) return;
    o.facilityId = 'wawoo_complex';
    o.sharedEntryGroup = 'wawoo_complex';
    o.editableFacilityObject = true;
    o.facilityCategory = '공공 복합문화시설';
    o.facilityDistrict = '와우리';
    o.facilitySummary = '도서관과 청소년문화의집이 같은 외관을 공유하는 복합건물입니다.';
    o.facilityActivity = '공용 현관에서 1·2층 도서관 또는 3층 청소년문화의집을 선택합니다.';
    o.infoLines = [o.facilitySummary, o.facilityActivity];
    o.interactionAnchorX = 0.5; o.interactionAnchorY = 1.05;
    o.labelAnchorX = 0.5; o.labelAnchorY = -0.05;
    o.interactionX = o.rx + o.rw / 2; o.interactionY = o.ry + o.rh * 1.05;
    o.labelX = o.rx + o.rw / 2; o.labelY = o.ry - o.rh * 0.05;
    promote(o);
    if (!Array.isArray(st.__v24Landmarks)) st.__v24Landmarks = [];
    st.__v24Landmarks.push(o);
    if (Array.isArray(st.facilityIds)) {
      ['wawoo_library', 'wawoo_youth_house'].forEach(function(fid){
        if (st.facilityIds.indexOf(fid) < 0) st.facilityIds.push(fid);
      });
    }
  }
  function tick(){
    try{
      if (typeof STAGES === 'undefined') return;
      adoptCultureHouse();
      // (v40) 동화리 십자 도로 개편 — 저장된 정류장 위치가 차도에 걸려 중앙 보도 광장으로 보정
      try {
        var st211 = STAGES[211];
        var bs211 = st211 && (st211.objects || []).find(function(o){ return o && o._editorId === 'bdlink_busstop_211'; });
        // (v43) 구 도로 위치(차도 대역)에 남아 있을 때만 1회 이동 — 에디터로 옮긴 위치는 그대로 존중
        if (bs211 && bs211.ry > 0.40 && bs211.ry < 0.45) {
          bs211.rx = 0.490; bs211.ry = 0.315;
          bs211.cx = bs211.rx + bs211.rw * 0.05; bs211.cy = bs211.ry + bs211.rh * 0.55;
          bs211.cw = bs211.rw * 0.9; bs211.ch = bs211.rh * 0.45;
        }
      } catch (e211) { }
      Object.keys(TARGETS).forEach(function(sid){
        var st = STAGES[sid]; if (!st) return;
        var ids = TARGETS[sid];
        (st.objects || []).forEach(function(o){
          if (o && ids.indexOf(o.facilityId) >= 0) promote(o);
        });
        (st.__v24Landmarks || []).forEach(function(o){
          if (o && ids.indexOf(o.facilityId) >= 0) promote(o);
        });
      });
    }catch(e){}
  }
  tick();
  setInterval(tick, 600);
})();
