
// =====================================================================
// (v161) 동네 주민 NPC — 내장 스프라이트 + 필드 배치 + 근접 대화 + 에디터 연동
// =====================================================================
window.BD_BUILTIN_ASSETS = {
  culture_npc_02: { name:"주민 · 문화의집 직원 도현", w:63, h:140, dataUrl:"data:image/png;base64,@@B64:5a4e066c_dataUrl.png@@" },
  culture_teacher_v41: { name:"문화의집 선생님", w:56, h:140, dataUrl:"data:image/png;base64,@@B64:2283e163_dataUrl.png@@" },
  culture_npc_03: { name:"주민 · 안내데스크 수진", w:56, h:140, dataUrl:"data:image/png;base64,@@B64:2283e163_dataUrl.png@@" },
  culture_npc_04: { name:"주민 · 장보러 나온 영자씨", w:65, h:140, dataUrl:"data:image/png;base64,@@B64:7f75ae5c_dataUrl.png@@" },
  culture_npc_05: { name:"주민 · 신문 읽는 재현씨", w:64, h:140, dataUrl:"data:image/png;base64,@@B64:3d9a20e6_dataUrl.png@@" },
  culture_npc_06: { name:"주민 · 대학생 하늘", w:58, h:140, dataUrl:"data:image/png;base64,@@B64:6a6e4463_dataUrl.png@@" },
  culture_npc_07: { name:"주민 · 경로당 순임 할머니", w:57, h:140, dataUrl:"data:image/png;base64,@@B64:d6a4fe0c_dataUrl.png@@" },
};
(function(){
"use strict";
// ── 1) 통합 이미지 리졸버 (에디터 업로드 에셋 우선, 없으면 내장) ──
window.BD_V198_META = {"nb_park3": [1254, 1254], "nb_sang_library": [1562, 1007], "nb_park4": [1254, 1254], "nb_parking_bld": [1254, 1254], "nb_dong_center": [1536, 1024], "nb_park2": [1812, 868], "nb_park1": [1254, 1254], "nb_parking1": [1254, 1254], "nb_culture_bld": [4000, 3000], "bld_busstop": [157, 244], "bld_villa1": [342, 464], "bld_villa2": [315, 474], "bld_villa3": [330, 464], "bld_villa4": [342, 474], "bld_shop1": [352, 454], "bld_shop2": [331, 464], "bld_shop3": [357, 444], "bld_shop4": [357, 424], "bld_shop5": [333, 424], "bld_conv1": [349, 404], "bld_parking": [382, 474], "bld_library": [880, 508], "bld_childcenter": [880, 641], "bld_apt1": [760, 737], "bld_apt2": [760, 644], "bld_apt3": [760, 747], "bld_apt4": [760, 766], "bld_plaza": [640, 551], "bld_culture": [900, 544]};
Object.assign(window.BD_BUILTIN_ASSETS, {
  bld_busstop: { name:"버스정류장", w:157, h:244, dataUrl:"data:image/webp;base64,@@B64:a95d03f2_dataUrl.webp@@" },
  bld_villa4: { name:"빌라 D", w:342, h:474, dataUrl:"data:image/webp;base64,@@B64:a69f763a_dataUrl.webp@@" },
  bld_shop4: { name:"카페", w:357, h:424, dataUrl:"data:image/webp;base64,@@B64:b92c82bb_dataUrl.webp@@" },
  bld_shop5: { name:"세탁소", w:333, h:424, dataUrl:"data:image/webp;base64,@@B64:d3d35b3c_dataUrl.webp@@" },
  bld_parking: { name:"주차빌딩", w:382, h:474, dataUrl:"data:image/webp;base64,@@B64:bd076bec_dataUrl.webp@@" },
  bld_apt1: { name:"아파트단지 1", w:760, h:737, dataUrl:"data:image/webp;base64,@@B64:d671b831_dataUrl.webp@@" },
  bld_apt2: { name:"아파트단지 2", w:760, h:644, dataUrl:"data:image/webp;base64,@@B64:bfa3ec88_dataUrl.webp@@" },
  bld_plaza: { name:"분수 광장", w:640, h:551, dataUrl:"data:image/webp;base64,@@B64:e27f256f_dataUrl.webp@@" },
  bld_culture: { name:"봉담문화의집", w:900, h:544, dataUrl:"data:image/webp;base64,@@B64:52a39c7b_dataUrl.webp@@" },
});

// ══════ v198: 신규 건물 레벨디자인 패치 ══════
window.BD_ensureV198Level = function BD_V198_LEVEL(){
  const AR = 1086/1448;   // 맵 종횡비 보정 (rx·rw는 가로, ry·rh는 세로 비율)
  const M = window.BD_V198_META;
  // 이미 v198 건물이 주입된 스테이지는 건너뜀 (멱등 가드)
  //  → 옛 localStorage 에디터 데이터가 STAGES를 덮어써도 매 프레임 재주입되고,
  //    v198에서 사용자가 직접 편집·저장한 데이터(bld_ 포함)는 건드리지 않는다.
  function _hasV198(st){
    return st.objects && st.objects.some(o => o && o.assetId && String(o.assetId).indexOf('bld_') === 0);
  }
  function rwOf(id, rh){ const m = M[id]; return rh * (m[0]/m[1]) * AR; }
  function B(id, rx, ry, rh, label, inter, opt){
    opt = opt || {};
    const rw = rwOf(id, rh);
    const o = { type:'building', key:'asset:'+id, assetId:id, customImage:true,
      rx:rx, ry:ry, rw:rw, rh:rh, label:label, interactable:inter||'' };
    if (opt.full) { // 탑다운 단지: 거의 전체 충돌
      o.cx = rx + rw*0.02; o.cy = ry + rh*0.03; o.cw = rw*0.96; o.ch = rh*0.93;
    } else {        // 정면 건물: 하단부만 충돌 (위로는 지나다니게)
      o.cx = rx + rw*0.05; o.cy = ry + rh*0.45; o.cw = rw*0.90; o.ch = rh*0.52;
    }
    if (opt.info) o.infoLines = opt.info;
    return o;
  }
  function drop(st, labels){ st.objects = st.objects.filter(o => labels.indexOf(o.label) === -1); }
  function noWalls(st){ st.objects = st.objects.filter(o => o.type !== 'wall'); }

  // ── stage1 봉담 광장 (문화의집 앞) ──
  (function(){
    const st = STAGES[1]; if(!st) return;
    if (_hasV198(st)) return;
    st.bgKey = 'MAP_CULTURE';
    noWalls(st);
    drop(st, ['봉담 카페','봉담 서점','봉담 와우 도서관','봉담 상점','봉담 소상점','작은 도서관']);
    st.objects.forEach(o => {          // 작은 공원 → 분수 광장 이미지로
      if (o.label === '작은 공원') {
        o.type = 'prop';   // park 분기를 건너뛰고 asset 렌더로 (충돌 없음 유지)
        o.assetId='bld_plaza'; o.key='asset:bld_plaza';
        o.rx=0.05; o.ry=0.795; o.rh=0.17; o.rw=rwOf('bld_plaza', 0.17);
      }
    });
    st.objects.unshift(
      // (v236) 입구 교정 — 3층 청소년문화의집으로 이어지는 건물은 '봉담문화의집'이다.
      //  기존에는 'quest'(=입장 가능)가 도서관에 붙어 있어 도서관 문으로 들어가면 문화의집 3층이 나왔다.
      B('bld_culture', 0.50, 0.03, 0.34, '봉담문화의집', 'quest'),
      B('bld_library', 0.008, 0.10, 0.24, '봉담 와우 도서관', 'info',
        { info:['여기는 봉담 와우 도서관이야.','조용히 책을 읽거나 공부하기 좋은 곳이지.','일일 퀘스트는 문 앞의 사서 도현에게 물어보면 돼!'] }),
      B('bld_shop4', 0.47, 0.64, 0.22, '봉담 카페', 'shop'),
      B('bld_conv1', 0.02, 0.63, 0.17, '봉담 편의점', 'shop'),
      B('bld_busstop', 0.31, 0.635, 0.10, '버스정류장', 'info',
        { info:['봉담 곳곳으로 가는 마을버스가 서는 곳이야.','차도로 내려가지 말고 인도에서 기다리자!'] })
    );
  })();

  // ── stage2 와우리 (1장 무대: 빌라촌) ──
  (function(){
    const st = STAGES[2]; if(!st) return;
    if (_hasV198(st)) return;
    st.bgKey = 'MAP2';
    drop(st, ['봉담 편의점 (북)','북문 코너샵']);
    st.objects.unshift(
      B('bld_villa1', 0.07, 0.015, 0.22, '와우리 빌라'),
      B('bld_shop1', 0.40, 0.015, 0.22, '와우리 상가', 'shop'),
      B('bld_busstop', 0.70, 0.13, 0.10, '버스정류장', 'info',
        { info:['와우리 정류장이야.','정류장 근처에 쓰레기를 버리면 모두가 불편해져.'] }),
      B('bld_villa2', 0.065, 0.375, 0.28, '와우리 연립주택'),
      B('bld_shop5', 0.395, 0.385, 0.26, '와우 세탁소', 'info',
        { info:['동네 세탁소야. 늘 뽀송한 냄새가 나.','골목에 세워둔 킥보드 때문에 사장님이 곤란해하셨어.'] }),
      B('bld_villa3', 0.02, 0.795, 0.19, '와우리 다세대주택')
    );
  })();

  // ── stage3 상리 (2장 무대: 도서관 + 아파트) ──
  (function(){
    const st = STAGES[3]; if(!st) return;
    if (_hasV198(st)) return;
    st.bgKey = 'MAP_SANG';
    drop(st, ['봉담 편의점 (남)','남문 상점']);
    st.objects.unshift(
      B('bld_library', 0.01, 0.06, 0.26, '봉담도서관', 'info',
        { info:['상리의 자랑, 봉담도서관이야.','책등 모양 외벽이 멋지지? 밤에는 주변이 어두우니 밝은 길로 다니자.'] }),
      B('bld_apt1', 0.435, 0.045, 0.30, '상리 아파트단지', '', { full:true }),
      B('bld_shop3', 0.10, 0.50, 0.24, '상리 먹자골목', 'shop'),
      B('bld_apt2', 0.755, 0.52, 0.24, '상리 그린빌라단지', '', { full:true }),
      B('bld_busstop', 0.46, 0.50, 0.09, '버스정류장', 'info',
        { info:['상리 정류장이야.','깨진 유리 조각을 발견하면 만지지 말고 어른에게 알리자.'] })
    );
  })();

  // ── stage4 동화리 (3장 무대: 어린이문화센터) ──
  (function(){
    const st = STAGES[4]; if(!st) return;
    if (_hasV198(st)) return;
    st.bgKey = 'MAP_DONG';
    drop(st, ['서문 서점','서문 소상점']);
    st.objects.unshift(
      B('bld_villa4', 0.10, 0.005, 0.175, '동화리 빌라'),
      B('bld_parking', 0.55, 0.0, 0.18, '공영주차장', 'info',
        { info:['어린이문화센터 방문객을 위한 공영주차장이야.','주차장 출입구 근처에서는 차가 갑자기 나올 수 있으니 조심!'] }),
      B('bld_childcenter', 0.40, 0.295, 0.22, '화성시어린이문화센터', 'info',
        { info:['화성시어린이문화센터야! 옥상 정원이 진짜 근사해.','자전거는 꼭 거치대에 세워두자. 길을 막으면 위험해!'] }),
      B('bld_villa3', 0.83, 0.36, 0.22, '동화리 경로당', 'info',
        { info:['동네 어르신들이 모이는 경로당이야.','순임 할머니도 매일 이곳에 들르셔.'] }),
      B('bld_busstop', 0.44, 0.64, 0.09, '버스정류장', 'info',
        { info:['동화리 정류장. 어린이문화센터 앞이라 아이들이 많아.','버스가 완전히 멈춘 뒤에 타고 내리자!'] })
    );
  })();

  // ── stage5 수영리 (4장 무대: 생활권) ──
  (function(){
    const st = STAGES[5]; if(!st) return;
    if (_hasV198(st)) return;
    st.bgKey = 'MAP_SU';
    drop(st, ['동문 카페','동문 시청']);
    st.objects.unshift(
      B('bld_conv1', 0.055, 0.05, 0.21, '수영리 편의점 · 안전지킴이집', 'shop'),
      B('bld_shop2', 0.80, 0.03, 0.24, '봉담약국 · 수영상가', 'shop'),
      B('bld_apt4', 0.025, 0.375, 0.28, '수영리 아파트단지', '', { full:true }),
      B('bld_apt3', 0.39, 0.38, 0.24, '수영 센트럴빌', '', { full:true }),
      B('bld_villa4', 0.10, 0.80, 0.185, '수영리 빌라'),
      B('bld_busstop', 0.50, 0.83, 0.09, '버스정류장', 'info',
        { info:['수영리 정류장이야.','고장 난 가로등이나 부서진 도로를 보면 지킴이에게 알려줘!'] })
    );
  })();
};
// 최초 1회 적용 (내장 STAGES 기준)
window.BD_ensureV198Level();
// (v198 핫픽스) 에디터가 localStorage의 옛 맵 데이터로 STAGES를 덮어써도
// v198 건물·배경을 다시 주입한다.
// 주의: v33 에디터의 patchRender가 렌더 중 '현재 스테이지'의 objects를
// 임시 사본(hidden 필터)으로 바꿔치기하므로, 렌더 콜스택 안(BD_ensureQuestHazards)에서
// 한 주입은 finally에서 버려진다. 따라서 반드시 렌더 밖 인터벌로도 주입한다.
(function(){
  const _origEnsure = window.BD_ensureQuestHazards;
  window.BD_ensureQuestHazards = function(){
    try { window.BD_ensureV198Level(); } catch(e){}  // 비-현재 스테이지 즉시 복구용
    return _origEnsure ? _origEnsure.apply(this, arguments) : 0;
  };
  // (v200) 문화의집 3층 도면 레이아웃 스냅샷 — 옛 localStorage 에디터 데이터가
  //  STAGES[101]을 덮어써도 room 오브젝트가 하나도 없으면 아래 스펙으로 복원한다.
  //  (사용자가 에디터에서 room을 직접 수정·이동한 데이터는 room이 남아 있으므로 보존됨)
  window.__BD_V200_CULT = {
    name: "봉담청소년문화의집 (3층)",
    // (v229) 새 맵 에셋(화이트톤 1448x1086) 기준 콜라이더 재배치.
    //  배치도: 자율이용1·댄스·사무실·화장실·엘리베이터(출입)·안내데스크·테라스·복도·
    //  아래층 도서관(진입불가)·게임존·PC존·디딤플레이·노래방·위원회실·강의실1,2·편집실·녹음실
    interior: true, floorTheme: "culture",
    spawnX: 0.700, spawnY: 0.260,
    bgKey: "MAP_CULT3F", collision: true,
    bgW: 1448, bgH: 1086,
    exits: {
      // 출입은 엘리베이터(상단 중앙)로만 — 존 진입 시 광장으로 (BD_addTick 처리)
      top: { active:false }, bottom: { active:false }, left: { active:false }, right: { active:false },
    },
    objects: [
      { type:"wall", rx:0.000, ry:0.000, rw:1.000, rh:0.022, label:"외벽" },
      { type:"wall", rx:0.000, ry:0.978, rw:1.000, rh:0.022 },
      { type:"wall", rx:0.000, ry:0.000, rw:0.010, rh:1.000 },
      { type:"wall", rx:0.990, ry:0.000, rw:0.010, rh:1.000 },
      { type:"wall", rx:0.195, ry:0.022, rw:0.012, rh:0.278 },
      { type:"wall", rx:0.195, ry:0.365, rw:0.012, rh:0.045 },
      { type:"wall", rx:0.345, ry:0.022, rw:0.012, rh:0.223, label:"댄스연습실" },
      { type:"wall", rx:0.195, ry:0.245, rw:0.075, rh:0.014 },
      { type:"wall", rx:0.315, ry:0.245, rw:0.030, rh:0.014 },
      { type:"wall", rx:0.357, ry:0.245, rw:0.045, rh:0.014, label:"사무실" },
      { type:"wall", rx:0.440, ry:0.245, rw:0.075, rh:0.014 },
      { type:"wall", rx:0.508, ry:0.022, rw:0.012, rh:0.223 },
      { type:"wall", rx:0.520, ry:0.135, rw:0.020, rh:0.013 },
      { type:"wall", rx:0.565, ry:0.135, rw:0.055, rh:0.013 },
      { type:"wall", rx:0.645, ry:0.135, rw:0.032, rh:0.013 },
      { type:"wall", rx:0.585, ry:0.022, rw:0.010, rh:0.113 },
      { type:"wall", rx:0.663, ry:0.022, rw:0.012, rh:0.190 },
      { type:"wall", rx:0.725, ry:0.022, rw:0.012, rh:0.190 },
      { type:"wall", rx:0.663, ry:0.022, rw:0.074, rh:0.055, label:"엘리베이터 안쪽" },
      { type:"wall", rx:0.737, ry:0.022, rw:0.253, rh:0.190, label:"통행불가 구역" },
      { type:"wall", rx:0.825, ry:0.212, rw:0.012, rh:0.058 },
      { type:"wall", rx:0.825, ry:0.335, rw:0.012, rh:0.135 },
      { type:"wall", rx:0.825, ry:0.535, rw:0.012, rh:0.110 },
      { type:"wall", rx:0.825, ry:0.700, rw:0.012, rh:0.090 },
      { type:"wall", rx:0.825, ry:0.855, rw:0.012, rh:0.123 },
      { type:"wall", rx:0.837, ry:0.405, rw:0.153, rh:0.013, label:"강의실1" },
      { type:"wall", rx:0.837, ry:0.615, rw:0.153, rh:0.013, label:"강의실2" },
      { type:"wall", rx:0.837, ry:0.735, rw:0.153, rh:0.013, label:"편집실" },
      { type:"wall", rx:0.010, ry:0.410, rw:0.145, rh:0.013 },
      { type:"wall", rx:0.192, ry:0.410, rw:0.133, rh:0.013 },
      { type:"wall", rx:0.400, ry:0.395, rw:0.325, rh:0.245, label:"아래층 도서관 (진입 불가)" },
      { type:"wall", rx:0.313, ry:0.410, rw:0.012, rh:0.568, label:"야외 테라스" },
      { type:"wall", rx:0.245, ry:0.423, rw:0.068, rh:0.235, label:"계단 (통행 불가)" },
      { type:"wall", rx:0.395, ry:0.745, rw:0.030, rh:0.013 },
      { type:"wall", rx:0.465, ry:0.745, rw:0.165, rh:0.013, label:"노래방" },
      { type:"wall", rx:0.670, ry:0.745, rw:0.080, rh:0.013 },
      { type:"wall", rx:0.790, ry:0.745, rw:0.035, rh:0.013, label:"청소년운영위원회실" },
      { type:"wall", rx:0.395, ry:0.758, rw:0.010, rh:0.220 },
      { type:"wall", rx:0.585, ry:0.758, rw:0.010, rh:0.220 },
      { type:"wall", rx:0.720, ry:0.758, rw:0.010, rh:0.220 },
      { type:"wall", rx:0.515, ry:0.185, rw:0.100, rh:0.055, label:"안내데스크" },
      { type:"wall", rx:0.030, ry:0.300, rw:0.130, rh:0.075, label:"큰 책상" },
      { type:"wall", rx:0.115, ry:0.030, rw:0.075, rh:0.200, label:"소파" },
      { type:"wall", rx:0.375, ry:0.075, rw:0.120, rh:0.110, label:"사무실 책상" },
      { type:"wall", rx:0.845, ry:0.235, rw:0.115, rh:0.130, label:"강의실 책상" },
      { type:"wall", rx:0.845, ry:0.440, rw:0.115, rh:0.130, label:"강의실 책상" },
      { type:"wall", rx:0.862, ry:0.640, rw:0.045, rh:0.075, label:"편집실 책상" },
      { type:"wall", rx:0.895, ry:0.790, rw:0.080, rh:0.120, label:"드럼" },
      { type:"wall", rx:0.842, ry:0.755, rw:0.045, rh:0.060, label:"키보드" },
      { type:"wall", rx:0.600, ry:0.850, rw:0.100, rh:0.065, label:"노래방 부스" },
      { type:"wall", rx:0.735, ry:0.800, rw:0.065, rh:0.140, label:"회의 테이블" },
      { type:"wall", rx:0.055, ry:0.470, rw:0.090, rh:0.080, label:"테라스 테이블" },
      { type:"wall", rx:0.050, ry:0.620, rw:0.080, rh:0.070, label:"테라스 테이블" },
      { type:"wall", rx:0.325, ry:0.790, rw:0.028, rh:0.170, label:"게임존 TV" },
      { type:"wall", rx:0.440, ry:0.925, rw:0.100, rh:0.040, label:"디딤플레이 TV" },
      { type:"wall", rx:0.405, ry:0.655, rw:0.220, rh:0.048, label:"PC존 책상" },
    ]  };
  // (v215) 도서관 1층 스펙 스냅샷 — 옛 localStorage가 100을 덮어써도 복원
  window.__BD_V215_LIB = {
    name: "봉담 와우 도서관 1층",
    spawnX: 0.50, spawnY: 0.86,
    exits: {
      bottom: { active: true, nextStage: 1, entryX: 0.46, entryY: 0.755 },
      top: { active:false }, left: { active:false }, right: { active:false },
    },
    objects: [
      { type:"desk",  rx:0.10, ry:0.10, rw:0.24, rh:0.06, label:"안내 데스크" },
      { type:"stair", dir:"up", to:101, entryX:0.50, entryY:0.38,
        rx:0.435, ry:0.07, rw:0.13, rh:0.13, label:"3층 문화의 집" },
      { type:"shelf", rx:0.10, ry:0.26, rw:0.30, rh:0.07 },
      { type:"shelf", rx:0.60, ry:0.26, rw:0.30, rh:0.07 },
      { type:"shelf", rx:0.10, ry:0.42, rw:0.30, rh:0.07 },
      { type:"shelf", rx:0.60, ry:0.42, rw:0.30, rh:0.07 },
      { type:"shelf", rx:0.10, ry:0.58, rw:0.30, rh:0.07 },
      { type:"shelf", rx:0.60, ry:0.58, rw:0.30, rh:0.07 },
    ]
  };
  window.BD_ensureV215Library = function(){
    try{
      const st = STAGES[100]; if (!st) return;
      if (st.objects && st.objects.some(function(o){ return o && o.type === 'shelf'; })) return;
      const spec = window.__BD_V215_LIB;
      st.name = spec.name;
      st.interior = true; st.floorTheme = 'library'; st.hasPlazaDoor = true;
      st.spawnX = spec.spawnX; st.spawnY = spec.spawnY;
      st.exits = JSON.parse(JSON.stringify(spec.exits));
      st.objects = JSON.parse(JSON.stringify(spec.objects));
    }catch(e){}
  };
  window.BD_ensureV199Interior = function(){
    try{ window.BD_ensureV215Library(); }catch(e){}
    try{
      const st = STAGES[101]; if (!st) return;
      // 새 레이아웃 마커(안내데스크 라벨 벽)가 있으면 현행/사용자 편집으로 간주하고 유지
      if (st.bgKey === 'MAP_CULT3F' && st.objects && st.objects.some(function(o){
        return o && o.type === 'wall' && /안내데스크/.test(o.label || '');
      })) return;
      const spec = window.__BD_V200_CULT;
      st.name = spec.name;
      st.interior = true; st.floorTheme = 'culture';
      st.bgKey = spec.bgKey; st.collision = !!spec.collision;
      st.spawnX = spec.spawnX; st.spawnY = spec.spawnY;
      st.exits = JSON.parse(JSON.stringify(spec.exits));
      st.objects = JSON.parse(JSON.stringify(spec.objects));
    }catch(e){}
  };
  window.BD_addTick(function(){                            // 현재 스테이지 복구용 (렌더 밖)
    try { window.BD_ensureV198Level(); } catch(e){}
    try { window.BD_ensureV199Interior(); } catch(e){}
  }, 500);
})();

const _imgCache = new Map();
function _lsAssets(){
  try{
    const raw = localStorage.getItem('bongdam_rpg_editor_assets_v3');
    if(!raw) return {};
    const p = JSON.parse(raw);
    const src = p.assets || p;
    if(Array.isArray(src)){ const m={}; src.forEach(a=>{ if(a&&a.id) m[a.id]=a; }); return m; }
    return (typeof src==='object') ? src : {};
  }catch(e){ return {}; }
}
window.BD_getAssetImage = function(id){
  if(!id) return null;
  if(_imgCache.has(id)) return _imgCache.get(id);
  let url = null;
  const ls = _lsAssets();
  if(ls[id] && (ls[id].dataUrl || ls[id].src)) url = ls[id].dataUrl || ls[id].src;
  else if(window.__BD_BAKED_ASSETS && __BD_BAKED_ASSETS[id]) url = __BD_BAKED_ASSETS[id].dataUrl || __BD_BAKED_ASSETS[id].src || __BD_BAKED_ASSETS[id];   // (v208) 게시용으로 구운 에셋
  else if(window.BD_BUILTIN_ASSETS && BD_BUILTIN_ASSETS[id]) url = BD_BUILTIN_ASSETS[id].dataUrl;
  /* (v398) 슬롯 저장소(BD_ASSETS)도 본다.
     0092 가 위험요소 스프라이트 12종을 BD_ASSETS.setMany 로 등록하는데 이 함수가
     그 저장소를 보지 않아 늘 null 을 돌려줬다. 그러면 0017 의 그리기 코드가
     «에셋이 없다»고 판단해 ⚠️ 폴백을 그린다 — 위험요소가 전부 빨간 표시로만
     보이던 원인이다(파일도 등록도 멀쩡했고, 조회 경로 하나가 빠져 있었다).
     기존 세 곳을 먼저 보고 못 찾았을 때만 여기로 온다 — 기존 동작은 그대로. */
  else if(window.BD_ASSETS && typeof BD_ASSETS.get === 'function'){
    try{ const v = BD_ASSETS.get(id); if(typeof v === 'string' && v) url = v; }catch(e){}
  }
  if(!url) return null;
  const im = new Image();
  im.src = url;
  _imgCache.set(id, im);
  return im;
};

// ── 2) 내장 주민을 에디터 에셋 라이브러리에 자동 등록 (없을 때만) ──
function seedEditorAssets(){
  try{
    const KEY = 'bongdam_rpg_editor_assets_v3';
    let raw = localStorage.getItem(KEY);
    let data = raw ? JSON.parse(raw) : {};
    let map = data.assets || data;
    let isArr = Array.isArray(map);
    let byId = {};
    if(isArr){ map.forEach(a=>{ if(a&&a.id) byId[a.id]=a; }); } else { byId = map || {}; }
    let added = 0;
    Object.keys(BD_BUILTIN_ASSETS).forEach(id=>{
      if(!byId[id]){
        byId[id] = { id:id, name:BD_BUILTIN_ASSETS[id].name, dataUrl:BD_BUILTIN_ASSETS[id].dataUrl,
                     width:BD_BUILTIN_ASSETS[id].w, height:BD_BUILTIN_ASSETS[id].h, builtin:true };
        added++;
      }
    });
    if(added>0){ localStorage.setItem(KEY, JSON.stringify(byId)); }
  }catch(e){}
}
seedEditorAssets();

// ── 3) 주민 기본 배치 (각 지역 길가) — 에디터에서 이동/삭제 가능, 없을 때만 추가 ──
const RESIDENTS = [
  /* (v396) 구 스테이지(1~5) 전용 레거시 주민 10명 제거 —
     해당 스테이지는 도달 불가하고 _redistribute 소비 코드도 없음.
     현행 주민은 베이크(에디터 배치) 소속. culture_npc_* 아트 에셋은 별도 경로로 계속 사용된다. */
];
// ── (v193) 주민 상호작용 확장: 시간대·정화 진행도에 반응하는 대사 ──
//  주민과 대화할 때 기본 대사 뒤에 현재 시간대 인사와 동네 정화 진행도에 대한
//  반응이 순환 대사로 추가된다. (대화할 때마다 다른 대사가 나오는 기존 순환 구조 활용)
function bdResidentContextLines(){
  const out = [];
  try{
    const h = new Date().getHours();
    if(h >= 5 && h < 11)       out.push('좋은 아침이에요! 아침 공기가 참 맑네요.');
    else if(h >= 11 && h < 14) out.push('점심은 챙겨 먹었어요? 밥심으로 다니는 거예요.');
    else if(h >= 14 && h < 18) out.push('오후에도 부지런히 다니네요. 대단해요!');
    else if(h >= 18 && h < 21) out.push('벌써 저녁이네요. 어두워지기 전에 조심히 다녀요.');
    else                       out.push('이 시간까지 동네를 지켜줘서 고마워요. 밤길 조심해요!');
  }catch(e){}
  try{
    if(window.BD){
      const purified = Object.keys(BD.purified||{}).length;
      if(BD.gameCleared)      out.push('봉담이 완전히 안전해졌다면서요? 우리 동네의 영웅이에요!');
      else if(purified >= 7)  out.push('동네가 몰라보게 안전해졌어요. 지킴이님 소문이 자자해요!');
      else if(purified >= 3)  out.push('요즘 거리가 조금씩 깨끗해지는 게 느껴져요. 지킴이님 덕분이죠?');
      else if(purified >= 1)  out.push('누가 위험한 걸 치우고 다닌다던데… 혹시 지킴이님이에요?');
      else                    out.push('요즘 길에 위험한 게 많아서 걱정이에요. 조심히 다녀요.');
    }
  }catch(e){}
  return out;
}
window.BD_residentContextLines = bdResidentContextLines;
function seedResidents(){
  try{
    if(typeof STAGES==='undefined') return;
    // (v187) 이미 배치된 주민들의 크기를 플레이어 비율에 맞게 갱신 (구버전 rh=0.13 → 0.075)
    Object.values(STAGES).forEach(function(s){
      if(s && Array.isArray(s.objects)){
        // (v269) 주민 크기 강제 정규화 제거 — 에디터에서 조절한 크기를 그대로 존중한다.
        //  (예전엔 rh>0.1이면 무조건 0.05/0.075로 되돌려 'NPC 크기가 안 바뀌는' 원인이었다)
      }
    });
    // (v191) 이미 배치된 주민의 이름·대사를 RESIDENTS 최신 정의와 동기화 (이름/대사 보정 반영)
    RESIDENTS.forEach(function(r){
      Object.values(STAGES).forEach(function(s){
        if(s && Array.isArray(s.objects)){
          s.objects.forEach(function(o){
            if(o && o.residentId === r.id){
              o.npcName = r.name; o.npcLines = r.lines;
              o.label = '주민 · ' + r.name;
            }
          });
        }
      });
    });
    // (v192) RESIDENTS 정의에 없는 구버전 주민(도형 기반 resident_XX)은 맵에서 제거 — LD 주민 10명만 유지
    (function(){
      const validIds = {};
      RESIDENTS.forEach(function(r){ validIds[r.id] = true; });
      Object.values(STAGES).forEach(function(s){
        if(s && Array.isArray(s.objects)){
          for(let i = s.objects.length - 1; i >= 0; i--){
            const o = s.objects[i];
            // (v28) 월드링크 NPC(bdlink_*)는 정의 목록 밖이어도 유지 — 컬링되면
            //  주입 틱이 원본 크기로 재생성해 '에디터 수정이 원복'되던 원인
            if(o && o.resident && o.residentId && !validIds[o.residentId]
               && String(o._editorId||'').indexOf('bdlink_') !== 0){
              s.objects.splice(i, 1);
            }
          }
        }
      });
    })();
    // (v269) v188 '주민 강제 재배치' 제거 — 에디터로 다른 맵에 옮긴 주민을
    //  정의된 스테이지로 되끌어오던 코드. 이제 사용자가 놓은 위치·맵을 그대로 존중한다.
    RESIDENTS.forEach(function(r){
      const st = STAGES[r.stage];
      if(!st) return;
      if(!Array.isArray(st.objects)) st.objects = [];
      // 어느 스테이지에든 이미 있으면 스킵 (에디터로 옮겼을 수 있음)
      let exists = false;
      Object.values(STAGES).forEach(function(s){
        if(s && Array.isArray(s.objects) && s.objects.some(function(o){ return o && o.residentId===r.id; })) exists = true;
      });
      if(exists) return;
      // (v269) 사용자가 지운 주민은 되살리지 않음 (어느 스테이지의 툼스톤이든 존중)
      let removedByUser = false;
      Object.values(STAGES).forEach(function(s){
        if(s && Array.isArray(s.deletedResidentIds) && s.deletedResidentIds.indexOf(r.id) >= 0) removedByUser = true;
      });
      if(removedByUser) return;
      st.objects.push({
        _editorId: 'resident_'+r.id,
        type: 'prop', label: '주민 · '+r.name,
        key: 'asset:'+r.id, assetId: r.id, customImage: true,
        residentId: r.id, resident: true, npcName: r.name, npcLines: r.lines,
        rx: r.rx, ry: r.ry, rw: 0.05, rh: 0.075,
        interactable: '', note: '동네 주민 (F키 대화)',
      });
    });
  }catch(e){}
}
// STAGES 확정 직후 + 에디터 저장 로더가 덮어쓴 뒤에도 한 번 더
seedResidents();
setTimeout(seedResidents, 1200);
setTimeout(seedResidents, 3000);
window.BD_seedResidents = seedResidents;

// ── 4) F키 근접 대화 ──
function nearResident(){
  try{
    if(typeof STAGES==='undefined' || typeof currentStage==='undefined') return null;
    const st = STAGES[currentStage];
    if(!st || !Array.isArray(st.objects)) return null;
    /* (v147) 예전에는 «주민 발밑 한 점»까지의 거리로만 판정했다.
       그래서 스프라이트 바로 옆이나 위에 붙어 있어도 F가 먹지 않아
       «F 키로 말을 걸어요» 안내가 떠 있는데 아무 반응이 없는 일이 잦았다.
       → 주민이 실제로 차지하는 사각형까지의 거리로 판정한다. */
    let best=null, bestD=0.075;  /* (v367) 0.04가 너무 좁아 선생님 대화 진입이 어려웠다 — 원복+ */
    st.objects.forEach(function(o){
      if(!o || !o.resident) return;
      const x0 = (o.rx||0), y0 = (o.ry||0);
      const x1 = x0 + (o.rw||0.05), y1 = y0 + (o.rh||0.075);
      const dx = Math.max(x0 - heroX, 0, heroX - x1);
      const dy = Math.max(y0 - heroY, 0, heroY - y1);
      const d = Math.sqrt(dx*dx + dy*dy);
      if(d < bestD){ bestD = d; best = o; }
    });
    return best;
  }catch(e){ return null; }
}
window.BD_nearResident = nearResident;
document.addEventListener('keydown', function(e){
  if(e.key !== 'f' && e.key !== 'F') return;
  try{
    const gs = document.getElementById('game-screen');
    if(!gs || gs.style.display === 'none') return;
    if(window.__bdSceneActive) return;
    if(window.HSR && HSR.active) return;
    // (v54) 모달(버스 목적지·시설 안내)이 떠 있는 동안엔 새 상호작용 금지 — 모달 위로 주민 대화가 겹쳐 열리던 문제
    if(window.__bdBusModalOpen){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    try{ var __fm = document.getElementById('bd-district-facility-modal');
      if (__fm && __fm.classList.contains('open')){ e.preventDefault(); e.stopImmediatePropagation(); return; } }catch(eFm){}
    if(document.getElementById('bd-dialog') && document.getElementById('bd-dialog').classList.contains('show')) return;
    // (v27) VN 대화창이 떠 있는 동안엔 F를 무시 — 대화 중 연타로 두 번째 대화가 큐잉되던 문제
    try { var __vnB = document.getElementById('dialogue-box');
      if (__vnB && __vnB.offsetHeight > 0 && parseFloat(getComputedStyle(__vnB).opacity) > 0.05) { window.__bdDlgWasUp = Date.now(); return; }
      // (v34) 대화가 닫힌 직후 600ms 쿨다운 — 연타 F가 곧바로 재상호작용해 여러 번 수행되던 문제
      if (window.__bdDlgWasUp && Date.now() - window.__bdDlgWasUp < 600) {
        /* (v361) 삼키지 않고 쿨다운 직후 1회 자동 재실행 — 대화 직후 조사 무반응 해소 */
        if (!window.__bdFRetryT){
          var __left = 620 - (Date.now() - (window.__bdDlgWasUp || 0));
          if (__left < 60) __left = 60;
          window.__bdFRetryT = setTimeout(function(){
            window.__bdFRetryT = null;
            try{
              var ev = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true, cancelable: true });
              document.dispatchEvent(ev);
            }catch(eR){}
          }, __left);
        }
        return;
      } } catch(e){}
    // (v60) 최근접 단일 상호작용 라우팅 — 겹친 후보(상점·버스·시설·주민·위험요소) 중 가장 가까운 하나만 반응
    var __bdNearKind = (function(){
      try{
        var st = STAGES[currentStage]; if (!st || !Array.isArray(st.objects)) return null;
        var best = null;
        function cand(kind, cx, cy, lim){
          var d = Math.hypot(heroX - cx, heroY - cy);
          if (d <= lim && (!best || d < best.d)) best = { kind: kind, d: d };
        }
        /* (v147) 주민은 «사각형까지의 거리»로 겨룬다 — nearResident() 와 판정을 맞춘다.
           예전에는 주민만 «발밑 한 점»에서 0.053, 위험요소는 0.10 이라
           위험요소 옆에 선 주민이 늘 밀려났다. */
        function candRect(kind, o, lim){
          var x0 = (o.rx||0), y0 = (o.ry||0);
          var x1 = x0 + (o.rw||0.05), y1 = y0 + (o.rh||0.075);
          var dx = Math.max(x0 - heroX, 0, heroX - x1);
          var dy = Math.max(y0 - heroY, 0, heroY - y1);
          var d = Math.sqrt(dx*dx + dy*dy);
          if (d <= lim && (!best || d < best.d)) best = { kind: kind, d: d };
        }
        st.objects.forEach(function(o){
          if (!o || o.hidden) return;
          var cx = (o.rx||0) + (o.rw||0)/2, cy = (o.ry||0) + (o.rh||0);
          // (v74) 상호작용 원형 반경을 캐릭터 크기의 약 1.2배로 축소 — 범위가 넓어 겹침이 잦던 문제
          var R = (typeof HERO_WR !== 'undefined' ? HERO_WR : 0.022) * 2 * 0.6;   // (v289) ≈ 0.026 — 절반 축소
          if (o.interactable === 'shop') cand('shop', cx, cy, R * 1.15);
          else if (o.interactable === 'bus_stop' && o.busStopId) cand('bus', cx, cy, R);
          else if (o.interactable === 'facility' && o.facilityIds && o.facilityIds.length) cand('facility', cx, cy, R * 1.1);
          else if (o.resident && !o._hyunji) candRect('resident', o, 0.04);   /* (v289) 절반 축소 */
          else if (o.interactable === 'hazard' && o.hazardId &&
                   /* (v147) 이미 정화돼 «사라진» 위험요소가 F를 계속 가로채,
                      바로 옆에 선 주민에게 보고를 할 수 없어 장이 끝나지 않던 문제.
                      (동화리 낙서 ↔ 재현처럼, 부탁한 주민은 그 위험요소 옆에 서 있다) */
                   !o.__bdGone && !o._purified &&
                   !(typeof window.BD_isPurified === 'function' && window.BD_isPurified(o.hazardId || o.id || o.label)) &&
                   !(typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(o))){
            /* (v147-52) 아직 부탁을 못 받은(잠긴) 위험요소는 F를 눌러 봐야
               «주민 이야기를 먼저 들어보자» 독백만 나온다.
               그런데 부탁을 줄 주민이 바로 그 옆에 서 있어서(설계),
               잠긴 위험요소가 주민보다 가까우면 그 독백만 무한 반복됐다.
               → 잠긴 위험요소는 판정 거리를 뒤로 물려 옆 주민이 이기게 한다. */
            var __gated = false;
            try{ __gated = (window.BD_hzQuestGate && BD_hzQuestGate(o)) === true; }catch(eGt){}
            if (__gated){
              var __d2 = Math.hypot(heroX - cx, heroY - cy);
              if (__d2 <= 0.05 && (!best || __d2 + 0.03 < best.d)) best = { kind: 'hazard', d: __d2 + 0.03 };   /* (v289) 절반 축소 */
            } else {
              candRect('hazard', o, 0.05);   /* (v305) 큰 위험요소도 사각형 거리로 겨룬다 */
            }
          }
        });
        return best && best.kind;
      }catch(eN){ return null; }
    })();
    // (v37) 신맵 상점 — 문 앞 밴드면 상점 열기 (정류장 F 반경과 겹칠 때 상점 문 앞이 우선)
    try {
      if ((__bdNearKind === null || __bdNearKind === 'shop') &&
          typeof getNearStore === 'function' && typeof openShop === 'function'){
        const _ns = getNearStore();
        const _v24f = (function(){ try{ return window.BD_v24NearestFacility && BD_v24NearestFacility(); }catch(e2){ return null; } })();
        if (_ns && !_v24f){   /* (v288) 시설 모달이 잡는 자리면 모달에 양보 — 약국 앞 F가 구 잡화 상점을 띄우던 문제 */
          e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
          openShop();
          return;
        }
      }
    } catch (eShop) { }
    // (v272) §9.2 — 근접 버스정류장이면 목적지 선택창 (전투·대화·전환 중 제외)
    try {
      if ((__bdNearKind === null || __bdNearKind === 'bus') &&
          !window.__bdBusModalOpen && !(typeof transitioning !== 'undefined' && transitioning)) {
        const stB = STAGES[currentStage];
        if (stB && Array.isArray(stB.objects)) {
          let bBest = null, bD = 0.05;   /* (v289) 절반 축소 */
          stB.objects.forEach(function (o) {
            if (!o || o.interactable !== 'bus_stop' || !o.busStopId) return;
            const cx = (o.rx || 0) + (o.rw || 0) / 2, cy = (o.ry || 0) + (o.rh || 0);
            const d = Math.hypot(heroX - cx, heroY - cy);
            if (d < bD) { bD = d; bBest = o; }
          });
          if (bBest && window.BD_Bus) {
            /* (v288) 시설 상호작용 지점이 정류장보다 가까우면 시설 모달에 양보 */
            var __facWins = false;
            try{
              var __lm = window.BD_v24NearestFacility && BD_v24NearestFacility();
              if (__lm){
                var __stv = STAGES[currentStage];
                var __bw2 = Number(__stv.bgW || 1448), __bh2 = Number(__stv.bgH || 1086);
                var __fd2 = Math.hypot((heroX - Number(__lm.interactionX)) * __bw2, (heroY - Number(__lm.interactionY)) * __bh2);
                var __bcx = (bBest.rx || 0) + (bBest.rw || 0) / 2, __bcy = (bBest.ry || 0) + (bBest.rh || 0);
                var __bd2 = Math.hypot((heroX - __bcx) * __bw2, (heroY - __bcy) * __bh2);
                if (__fd2 < __bd2) __facWins = true;
              }
            }catch(eYB){}
            if (!__facWins){
              e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
              BD_Bus.open(bBest.busStopId);
              return;
            }
          }
        }
      }
    } catch (eBus) { }
    // (v273) 근접 시설(placement)이면 안내 카드 (+체험)
    try {
      const stF = STAGES[currentStage];
      if ((__bdNearKind === null || __bdNearKind === 'facility') &&
          stF && Array.isArray(stF.objects) && !document.getElementById('bd-place-card')) {
        let fBest = null, fD = 0.055;   /* (v289) 절반 축소 */
        stF.objects.forEach(function (o) {
          if (!o || o.interactable !== 'facility' || !o.facilityIds || !o.facilityIds.length) return;
          const cx = (o.rx || 0) + (o.rw || 0) / 2, cy = (o.ry || 0) + (o.rh || 0);
          const d = Math.hypot(heroX - cx, heroY - cy);
          if (d < fD) { fD = d; fBest = o; }
        });
        if (fBest && window.BD_showPlaceCard) {
          e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
          BD_showPlaceCard(fBest.facilityIds[0], { firstDiscover: true, allowActivity: true });
          return;
        }
      }
    } catch (eFac) { }
    // (v282) 시설 반경(170px)이 바로 옆 주민의 F까지 삼키던 문제 —
    //  주민이 시설 상호작용 지점보다 가까우면 주민 대화가 우선한다. (v39 무조건 양보를 거리 비교로 교체)
    try {
      const stV24 = STAGES[currentStage];
      if (stV24 && stV24.__districtWorldV24 && Array.isArray(stV24.__v24Landmarks)) {
        const bw = Number(stV24.bgW || 1448), bh = Number(stV24.bgH || 1086);
        let facD = Infinity;
        stV24.__v24Landmarks.forEach(function (lm) {
          if (!lm || !lm.majorFacility || lm.hidden) return;
          const fdx = (Number(heroX) - Number(lm.interactionX)) * bw;
          const fdy = (Number(heroY) - Number(lm.interactionY)) * bh;
          const fd = Math.sqrt(fdx * fdx + fdy * fdy);
          if (fd < facD) facD = fd;
        });
        if (facD <= 170) {
          let resD = Infinity;
          (stV24.objects || []).forEach(function (o) {
            if (!o || !o.resident || o.hidden || o._hyunji) return;
            const x0 = (o.rx || 0), y0 = (o.ry || 0);
            const x1 = x0 + (o.rw || 0.05), y1 = y0 + (o.rh || 0.075);
            const dxp = Math.max(x0 - heroX, 0, heroX - x1) * bw;
            const dyp = Math.max(y0 - heroY, 0, heroY - y1) * bh;
            const d = Math.sqrt(dxp * dxp + dyp * dyp);
            if (d < resD) resD = d;
          });
          if (!(resD <= 120 && resD < facD)) return;   /* (v297) 65→120 — 주민 옆 F 무반응 지대 제거 (시설 쪽도 같은 식으로 양보) */
        }
      }
    } catch (eV24) { }
    const r = nearResident();
    if(!r) return;
    if (__bdNearKind !== null && __bdNearKind !== 'resident') return;   // (v60) 더 가까운 다른 대상에게 양보
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if(typeof window.BD_showDialog === 'function' || typeof playSceneVN === 'function'){
      // (v163+) 방문마다 다른 대사부터 시작 — 반복 대화가 단조롭지 않게 순환
      // (v271) §7.2~7.4 — 선생님 첫 대화: 배지 지급 → 문화의집 안내 카드 → 자유 이용 안내
      try {
        if (r._tut2npc && window.BD_PROGRESS && !BD_PROGRESS.story.tutorialFlags.badgeGiven) {
          BD_PROGRESS.story.tutorialFlags.badgeGiven = true;
          BD_PROGRESS.story.storyPhase = 'prologue_free_inside';
          // (v25통합) 배지 수여식 연출 복원 — v278에서 '신규 프롤로그가 수여식 담당'으로
          //  이관됐지만 이관처가 토스트만 띄우고 badgeCeremony를 호출하지 않던 리그레션.
          //  선생님 대화(VN)가 닫힌 직후 수여식 → 배지 토스트 → 장소 카드 → 자유 이용 안내 순서.
          (function(){
            var t0 = Date.now(), seenDialog = false;
            var iv = setInterval(function(){
              try{
                var d1 = document.getElementById('dialogue-box');
                var up = !!(window.__bdSceneActive) || !!(d1 && d1.offsetHeight);
                if (up) { seenDialog = true; window.__bdTut2ClosedAt = 0; return; }
                if (!seenDialog) return;   /* (v287) 폴백 제거 — 대화가 뜨기 전 수여식 금지 */
                if (!window.__bdTut2ClosedAt){ window.__bdTut2ClosedAt = Date.now(); return; }
                if (Date.now() - window.__bdTut2ClosedAt < 700) return;   /* 전환 프레임 오검출 방지 */
                clearInterval(iv);
                var after = function(){
                  // (v27) 원설계(v240d) 복원 — 수여식 직후 담이 각성 연출 + 첫 만남 인사 (실내에서 이야기가 시작된다)
                  window.__bdCeremonyDone = true;   /* (v287) 이 시점부터 담이 각성·후속 연출 허용 */
                  try{ if (window.BD_DAMI && BD_DAMI.awaken) BD_DAMI.awaken(function(){ try{ if (typeof window.BD_damiIntro==='function') window.BD_damiIntro(); }catch(e){} }); }catch(e){}
                  // (v27) 수여식 이후 선생님 재대화는 배지 수여 대사를 반복하지 않고 안내 대사로
                  try{ r.npcLines = ['다시 왔네. 편하게 있다 가.','밖에 나가려면 위쪽 엘리베이터를 타면 돼.','PC존이랑 노래연습실도 열려 있어.']; r._talkIdx = -1; }catch(e){}
                  try{ if (typeof bdToast==='function') bdToast('🎖 「봉담 활동 배지」를 받았다!'); }catch(e){}
                  /* (v370) 장소 카드는 담이 각성·첫 인사가 끝난 뒤에 — 인사 도중 카드가 겹쳐 뜨고(터치에선 가방 ✕까지 가렸다) 한 번에 두 안내가 나오던 문제. 최대 40초 대기 */
                  setTimeout(function(){
                    var t0 = Date.now();
                    var ivC = setInterval(function(){
                      try{
                        var busy = !!(window.__bdDamiIntroBusy || window.__bdSceneActive) || (function(){ var d = document.getElementById('dialogue-box'); return !!(d && d.offsetHeight); })();
                        var introStarted = false; try{ introStarted = !!(window.BD_DAMI && BD_DAMI.seen && BD_DAMI.seen('dami_intro')); }catch(e3){}
                        if ((busy || !introStarted) && Date.now() - t0 < 40000) return;
                        clearInterval(ivC);
                        if (typeof window.BD_showPlaceCard==='function') BD_showPlaceCard('facility_youth_house', { subtitle:'봉담와우도서관 3층', firstDiscover:true });
                      }catch(e){ try{ clearInterval(ivC); }catch(e2){} }
                    }, 300);
                  }, 1700);
                  setTimeout(function(){ try{ if (typeof bdToast==='function') bdToast('🧭 문화의집을 자유롭게 둘러보거나, 엘리베이터를 타고 밖으로 나가세요'); }catch(e){} }, 8000);
                };
                if (typeof window.BD_badgeCeremony === 'function') window.BD_badgeCeremony(after);
                else after();
              }catch(e){ try{ clearInterval(iv); }catch(e2){} }
            }, 350);
          })();
          try { if (typeof autoSave === 'function') autoSave('배지 수령'); } catch(e){}
        }
      } catch (eTut) { }
      const lines = (r.npcLines && r.npcLines.length) ? r.npcLines.slice() : ['안녕하세요!'];
      // (v193) 시간대별 인사 + 정화 진행도 반응 대사를 순환 목록에 추가
      // (v27) 단, 안내데스크 선생님(_tut2npc)은 제외 — 수여 스크립트 뒤에 '좋은 아침이에요' 류가 붙어 흐름이 깨지던 문제
      try{
        if(!r._tut2npc && !r.__bdHzQuestLines){   // (v62) 부탁·감사 대사에는 시간대 인사를 섞지 않는다
          const _ctx = (typeof window.BD_residentContextLines==='function') ? window.BD_residentContextLines() : [];
          _ctx.forEach(function(t){ if(lines.indexOf(t)===-1) lines.push(t); });
        }
      }catch(e){}
      if (r.__bdHzQuestLines){ r._talkIdx = 0; }   // (v62) 부탁·감사 대사는 항상 처음부터 — 순환하면 맥락이 깨진다
      else r._talkIdx = (typeof r._talkIdx === 'number') ? (r._talkIdx + 1) % lines.length : 0;
      const rotated = lines.slice(r._talkIdx).concat(lines.slice(0, r._talkIdx));
      const _npcName = r.npcName || r.label || '주민';
      // (v189) 주민 대화창을 프롤로그/컷신과 동일한 비주얼 노벨 스타일로 통일
      const _vnFn = (typeof window.BD_playSceneVN === 'function') ? window.BD_playSceneVN : (typeof playSceneVN === 'function' ? playSceneVN : null);
      if(_vnFn){
        const scene = rotated.map(function(t){ return { n: _npcName, t: t }; });
        // 주민 초상화가 SPEAKER_PORTRAITS에 없으면 주민 스프라이트를 임시 등록
        try{
          if(window.BD_SPEAKER_PORTRAITS && !window.BD_SPEAKER_PORTRAITS[_npcName]){
            // (v190) 우선 고화질 LD 초상화 사용, 없으면 게임 스프라이트로 폴백
            if(window.BD_NPC_LD_PORTRAITS && window.BD_NPC_LD_PORTRAITS[_npcName]){
              window.BD_SPEAKER_PORTRAITS[_npcName] = window.BD_NPC_LD_PORTRAITS[_npcName];
            } else {
              const _aid = r.assetId || (String(r.key||'').startsWith('asset:') ? String(r.key).slice(6) : (r.residentId||null));
              const _im = (_aid && typeof window.BD_getAssetImage==='function') ? window.BD_getAssetImage(_aid) : null;
              if(_im && _im.src){ window.BD_SPEAKER_PORTRAITS[_npcName] = _im.src; }
            }
          }
        }catch(e){}
        _vnFn(scene, null);
      } else {
        window.BD_showDialog(_npcName, rotated, null);
      }
      // (v163+) 각 주민과 처음 대화하면 감사의 표시로 소액 소지금 (영속 1회성)
      try{
        if(window.BD){
          const rid = r.residentId || r.id || r.npcName;
          if(!Array.isArray(BD.greetedResidents)) BD.greetedResidents = [];
          if(rid && BD.greetedResidents.indexOf(rid) === -1){
            BD.greetedResidents.push(rid);
            try{ if(typeof window.BD_subQuestProgress==='function') window.BD_subQuestProgress('npc_sunim'); }catch(e){}  // (v193) 순임 할머니의 부탁

            if(typeof playerGold !== 'undefined'){
              playerGold += 5;
              if(typeof window.BD_save === 'function') window.BD_save();
              setTimeout(function(){ if(typeof window.BD_toast==='function') window.BD_toast('💰 ' + (function(n){ n=n||'주민'; return /님$/.test(n)? n+'이' : n+'님이'; })(r.npcName) + ' 고마움의 표시로 5G를 주셨어요!'); }, 1600);
            }
            // (v163+) 동네 주민 10명 전원과 대화 완료 → 히든 카드 "봉담청소년문화의집" 획득
            try{
              const totalResidents = (typeof RESIDENTS!=='undefined') ? RESIDENTS.length : 10;
              if(BD.greetedResidents.length >= totalResidents && Array.isArray(BD.cards) && !BD.cards.includes('봉담청소년문화의집')){
                BD.cards.push('봉담청소년문화의집');
                if(typeof window.BD_save === 'function') window.BD_save();
                setTimeout(function(){ if(typeof window.BD_toast==='function') window.BD_toast('🗂 동네 주민 모두와 인사했어요! 히든 카드 「봉담청소년문화의집」 획득!'); }, 3200);
                setTimeout(function(){ if(typeof window.BD_subQuestProgress==='function') window.BD_subQuestProgress('sub_cards'); }, 3400);  // (v193 수정) 전역 미노출로 미동작하던 훅
              }
            }catch(e){}
          }
        }
      }catch(e){}
    }
  }catch(err){}
}, true);
})();
