
const IMG_MAP1 = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_MAP2 = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_CAFE = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_STORE24 = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_BOOKS = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_CORNER = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_SHOP = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_TALL = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_HALL = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_SMALL = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_TREE1 = "data:image/png;base64,@@B64:fee8c657_IMG_TREE1.png@@";
const IMG_TREE2 = "data:image/png;base64,@@B64:5419a4eb_IMG_TREE2.png@@";
const IMG_TREE3 = "data:image/png;base64,@@B64:b29ff77f_IMG_TREE3.png@@";
const IMG_TREE4 = "data:image/png;base64,@@B64:01c99310_IMG_TREE4.png@@";
const IMG_BENCH = "data:image/png;base64,@@B64:a808d11b_IMG_BENCH.png@@";


/* ── 스테이지 정의 ── */
const STAGES = {
  1: {
    name: "봉담 광장 - 북쪽",
    spawnX: 0.50, spawnY: 0.80,
    bgImg: null,   // will be set after load
    bgKey: "MAP_CULTURE",
    bgW: 1448, bgH: 1086,
    // 다음 맵으로 이어지는 도로 끝 방향 (화면 기준)
    exits: {
      top:    { active: true,  nextStage: 2, entryX: 0.5, entryY: 0.96 },
      bottom: { active: true,  nextStage: 3, entryX: 0.5, entryY: 0.1 },
      left:   { active: true,  nextStage: 4, entryX: 0.93, entryY: 0.49 },
      right:  { active: true,  nextStage: 5, entryX: 0.04, entryY: 0.49 },
    },
    // cx/cy/cw/ch = 실제 건물이 보이는 영역만 딱 감싸는 충돌 박스
    // 투명 여백을 제외하고 안쪽으로 줄임
    objects: [
      // 카페
      { type:"building", key:"cafe",  rx:0.1375, ry:0.08, rw:0.18, rh:0.26, label:"봉담 카페",
        cx:0.143, cy:0.096, cw:0.102, ch:0.215, interactable:"shop" },
      { type:"wall", rx:0.1425, ry:0.15, rw:0.01, rh:0.205 },
      // 서점 (아파트)
      { type:"building", key:"books", rx:0.35, ry:0.08, rw:0.18, rh:0.26, label:"봉담 서점",
        cx:0.385, cy:0.188, cw:0.100, ch:0.115, interactable:"shop" },
      { type:"wall", rx:0.513, ry:0.15, rw:0.01, rh:0.205 },
      // 시청
      { type:"building", key:"hall",  rx:0.30, ry:0.42, rw:0.32, rh:0.30, label:"봉담 와우 도서관",
        cx:0.306, cy:0.438, cw:0.307, ch:0.250, interactable:"quest" },
      { type:"wall", rx:0.306, ry:0.438, rw:0.01, rh:0.250 },
      { type:"wall", rx:0.603, ry:0.438, rw:0.01, rh:0.250 },
      // 상점
      { type:"building", key:"shop",  rx:0.6425, ry:0.08, rw:0.19, rh:0.26, label:"봉담 상점",
        cx:0.669, cy:0.175, cw:0.130, ch:0.155, interactable:"shop" },
      { type:"wall", rx:0.6455, ry:0.15, rw:0.01, rh:0.205 },
      { type:"wall", rx:0.8185, ry:0.15, rw:0.01, rh:0.205 },
      // 소상점
      { type:"building", key:"small", rx:0.6225, ry:0.3475, rw:0.18, rh:0.27, label:"봉담 소상점",
        cx:0.648, cy:0.415, cw:0.122, ch:0.168, interactable:"shop" },
      { type:"wall", rx:0.6255, ry:0.3975, rw:0.01, rh:0.215 },
      { type:"wall", rx:0.7885, ry:0.3975, rw:0.01, rh:0.215 },
      // ── 튜토리얼/프롤로그용 첫 위험 요소: 문화의집 앞 버려진 쓰레기 ──
      // 건물과 안 겹치는 빈 도로 + 플레이어(0.5,0.8) 바로 아래(0.5,0.9).
      // 화면 정규화 (0.5,0.75) — 화면 중앙 가로, 세로 약간 아래로 확실히 보임.
      { type:"hazard", rx:0.46, ry:0.78, rw:0.08, rh:0.08, label:"버려진 쓰레기 더미",
        cx:0.46, cy:0.88, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"trash", hazardFamily:"pollute", hazardId:"tutorial_trash_1" },
      // ── 최종장 보스: 4장 완료 전까지 잠김 (BD_hazardLocked) ──
      { type:"hazard", rx:0.60, ry:0.78, rw:0.10, rh:0.10, label:"쌓여있던 위험들",
        cx:0.60, cy:0.88, cw:0.10, ch:0.10, interactable:"hazard", isBoss:true,
        hazardFamily:"dark", hazardId:"final_boss_1" },
      // ── 작은 공원 (v144): HP 무료 회복 시설 — 다른 건물·위험요소와 안 겹치는 왼쪽 빈 공간 ──
      { type:"park", key:"park", rx:0.10, ry:0.80, rw:0.14, rh:0.14, label:"작은 공원",
        cx:0.10, cy:0.80, cw:0.14, ch:0.14, interactable:"facility", facilityType:"park" },
      // ── 작은 도서관 (v149): MP 무료 회복 시설 — 오른쪽 아래 빈 공간 ──
      { type:"library", key:"library", rx:0.84, ry:0.80, rw:0.14, rh:0.14, label:"작은 도서관",
        cx:0.84, cy:0.80, cw:0.14, ch:0.14, interactable:"facility", facilityType:"library" },
    ]
  },
  2: {
    name: "와우리 - 북쪽 길",
    spawnX: 0.50, spawnY: 0.75,
    bgKey: "MAP2",
    bgW: 1448, bgH: 1086,
    exits: {
      bottom: { active: true, nextStage: 1, entryX: 0.5, entryY: 0.05 },
      top:    { active: false },
      left:   { active: false },
      right:  { active: false },
    },
    objects: [
      { type:"building", key:"store24", rx:0.13, ry:0.10, rw:0.17, rh:0.28,
        cx:0.155, cy:0.130, cw:0.112, ch:0.215, label:"봉담 편의점 (북)", interactable:"shop" },
      { type:"building", key:"corner",  rx:0.60, ry:0.10, rw:0.18, rh:0.28,
        cx:0.614, cy:0.175, cw:0.148, ch:0.170, label:"북문 코너샵", interactable:"shop" },
      // ── 1장(와우리) 위험 요소: 건물 아래 빈 도로 ──
      { type:"hazard", rx:0.28, ry:0.60, rw:0.08, rh:0.08, label:"떠도는 담배 연기",
        cx:0.28, cy:0.60, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"cigarette", hazardFamily:"smoke", hazardId:"ch1_cigarette_1" },
      { type:"hazard", rx:0.64, ry:0.66, rw:0.08, rh:0.08, label:"길을 막은 킥보드",
        cx:0.64, cy:0.66, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"kickboard", hazardFamily:"pollute", hazardId:"ch1_kickboard_1" },
      // ── (v193) 와우리 추가 위험요소 (선택: 메인 퀘스트 카운트 미포함) ──
      { type:"hazard", rx:0.15, ry:0.80, rw:0.08, rh:0.08, label:"방치된 쓰레기 더미",
        cx:0.15, cy:0.80, cw:0.08, ch:0.08, interactable:"hazard", bdOptional:true,
        hazardVariant:"trash", hazardFamily:"pollute", hazardId:"ch1_trash_2" },
    ]
  },
  3: {
    name: "상리 - 남쪽 길",
    spawnX: 0.50, spawnY: 0.70,
    bgKey: "MAP_SANG",
    bgW: 1448, bgH: 1086,
    exits: {
      top:   { active: true, nextStage: 1, entryX: 0.5, entryY: 0.9 },
      bottom: { active: false },
      left:   { active: false },
      right:  { active: false },
    },
    objects: [
      { type:"building", key:"store24", rx:0.12, ry:0.08, rw:0.17, rh:0.26,
        cx:0.147, cy:0.127, cw:0.112, ch:0.203, label:"봉담 편의점 (남)", interactable:"shop" },
      { type:"building", key:"shop",    rx:0.6175, ry:0.08, rw:0.19, rh:0.26,
        cx:0.632, cy:0.172, cw:0.158, ch:0.158, label:"남문 상점", interactable:"shop" },
      // ── 2장(상리) 위험 요소 ──
      { type:"hazard", rx:0.28, ry:0.56, rw:0.08, rh:0.08, label:"버려진 술병",
        cx:0.28, cy:0.56, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"bottle", hazardFamily:"pollute", hazardId:"ch2_bottle_1" },
      { type:"hazard", rx:0.64, ry:0.62, rw:0.08, rh:0.08, label:"깨진 유리 조각",
        cx:0.64, cy:0.62, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"glass", hazardFamily:"pollute", hazardId:"ch2_glass_1" },
      // ── (v193) 상리 추가 위험요소 (선택) ──
      { type:"hazard", rx:0.45, ry:0.35, rw:0.08, rh:0.08, label:"어두운 산책로",
        cx:0.45, cy:0.35, cw:0.08, ch:0.08, interactable:"hazard", bdOptional:true,
        hazardVariant:"dark_alley", hazardFamily:"dark", hazardId:"ch2_alley_1" },
    ]
  },
  4: {
    name: "동화리 - 서쪽 길",
    spawnX: 0.30, spawnY: 0.60,
    bgKey: "MAP_DONG",
    bgW: 1448, bgH: 1086,
    exits: {
      right:  { active: true, nextStage: 1, entryX: 0.07, entryY: 0.5 },
      left:   { active: false },
      top:    { active: false },
      bottom: { active: false },
    },
    objects: [
      { type:"building", key:"books", rx:0.60, ry:0.08, rw:0.18, rh:0.26,
        cx:0.622, cy:0.185, cw:0.124, ch:0.118, label:"서문 서점", interactable:"shop" },
      { type:"building", key:"small", rx:0.60, ry:0.365, rw:0.18, rh:0.27,
        cx:0.614, cy:0.385, cw:0.148, ch:0.168, label:"서문 소상점", interactable:"shop" },
      // ── 3장(동화리) 위험 요소: 건물이 오른쪽이라 왼쪽 도로에 배치 ──
      { type:"hazard", rx:0.22, ry:0.38, rw:0.08, rh:0.08, label:"벽을 더럽힌 낙서",
        cx:0.22, cy:0.38, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"graffiti", hazardFamily:"pollute", hazardId:"ch3_graffiti_1" },
      { type:"hazard", rx:0.28, ry:0.72, rw:0.08, rh:0.08, label:"먼지 회오리",
        cx:0.28, cy:0.72, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"noise_bat", hazardFamily:"smoke", hazardId:"ch3_noise_1" },
      // ── (v193) 동화리 추가 위험요소 (선택) ──
      { type:"hazard", rx:0.45, ry:0.55, rw:0.08, rh:0.08, label:"길을 막은 자전거",
        cx:0.45, cy:0.55, cw:0.08, ch:0.08, interactable:"hazard", bdOptional:true,
        hazardVariant:"bicycle", hazardFamily:"pollute", hazardId:"ch3_bicycle_1" },
    ]
  },
  5: {
    name: "수영리 - 동쪽 길",
    spawnX: 0.70, spawnY: 0.60,
    bgKey: "MAP_SU",
    bgW: 1448, bgH: 1086,
    exits: {
      left:   { active: true, nextStage: 1, entryX: 0.96, entryY: 0.48 },
      right:  { active: false },
      top:    { active: false },
      bottom: { active: false },
    },
    objects: [
      { type:"building", key:"cafe", rx:0.14, ry:0.08, rw:0.18, rh:0.26,
        cx:0.155, cy:0.192, cw:0.148, ch:0.225, label:"동문 카페", interactable:"shop" },
      { type:"building", key:"hall", rx:0.1575, ry:0.42, rw:0.32, rh:0.27,
        cx:0.172, cy:0.442, cw:0.268, ch:0.170, label:"동문 시청", interactable:"shop" },
      // ── 4장(수영리) 위험 요소: 건물이 왼쪽이라 오른쪽 도로에 배치 ──
      { type:"hazard", rx:0.62, ry:0.28, rw:0.08, rh:0.08, label:"고장난 가로등",
        cx:0.62, cy:0.28, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"streetlight", hazardFamily:"dark", hazardId:"ch4_streetlight_1" },
      { type:"hazard", rx:0.66, ry:0.62, rw:0.08, rh:0.08, label:"부서진 도로 균열",
        cx:0.66, cy:0.62, cw:0.08, ch:0.08, interactable:"hazard",
        hazardVariant:"road_crack", hazardFamily:"dark", hazardId:"ch4_crack_1" },
      // ── (v193) 수영리 추가 위험요소 (선택) ──
      { type:"hazard", rx:0.80, ry:0.45, rw:0.08, rh:0.08, label:"위험 표지판",
        cx:0.80, cy:0.45, cw:0.08, ch:0.08, interactable:"hazard", bdOptional:true,
        hazardVariant:"sign_ghost", hazardFamily:"dark", hazardId:"ch4_sign_1" },
    ]
  },
  // (v228) 구버전 도서관 1층(스테이지 100) 삭제 — 건물 입장은 3층 문화의집으로 직행
  // ── 봉담 와우 도서관 3층 - 문화의 집 ──
  101: {
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
    ]
  },
};

// ── 퀘스트 필수 위험요소 스냅샷 ──
// 에디터가 localStorage의 옛 맵 데이터로 STAGES를 덮어써도(loadSavedData → applyStageData),
// 여기 저장된 기본 위험요소는 hazardId 기준으로 다시 주입되어 게임 진행이 끊기지 않게 한다.
window.__BD_DEFAULT_HAZARDS = (function(){
  const snap = {};
  try {
    Object.keys(STAGES).forEach(function(sid){
      const st = STAGES[sid];
      if(!st || !st.objects) return;
      const list = st.objects.filter(function(o){ return o && o.interactable === 'hazard' && o.hazardId; })
        .map(function(o){ return JSON.parse(JSON.stringify(o)); });
      if(list.length) snap[sid] = list;
    });
  } catch(e){}
  return snap;
})();

// ── 퀘스트 필수 위험요소 보증 (v125) ──
// 어떤 로더(에디터 데이터·프로젝트 자동저장·JSON 가져오기·undo 복원)가 STAGES를 덮어써도
// 스냅샷의 위험요소를 hazardId 기준으로 다시 주입한다. 렌더 루프에서 매 프레임 호출됨.
window.BD_ensureQuestHazards = function(){
  let injected = 0;
  try {
    const snap = window.__BD_DEFAULT_HAZARDS || {};
    Object.keys(snap).forEach(function(sid){
      const st = STAGES[sid];
      if (!st) return;
      if (!st.objects) st.objects = [];
      snap[sid].forEach(function(h){
        // (v52) 복구 가드 3종 — 구버전 스냅샷 좌표로 '임의 위치 부활'하던 문제의 원천 차단
        // ① 어느 스테이지에든 이미 있으면(에디터로 옮긴 경우 포함) 복구하지 않음
        let found = false;
        Object.keys(STAGES).forEach(function(sid2){
          const s2 = STAGES[sid2];
          if (!found && s2 && Array.isArray(s2.objects) &&
              s2.objects.some(function(o){ return o && o.hazardId === h.hazardId; })) found = true;
        });
        // ② 이미 정화된 위험요소는 복구하지 않음 (정화 직후 미정화 사본이 생겨 재전투되던 문제)
        if (!found) {
          try{
            if ((window.BD && BD.purified && BD.purified[h.hazardId]) ||
                (typeof window.BD_isPurified === 'function' && window.BD_isPurified(h.hazardId))) found = true;
          }catch(eP){}
        }
        // ③ 에디터에서 삭제(툼스톤)한 위험요소는 복구하지 않음 (어느 스테이지의 기록이든 존중)
        if (!found) {
          Object.keys(STAGES).forEach(function(sid3){
            const s3 = STAGES[sid3];
            if (!found && s3 && Array.isArray(s3.deletedHazardIds) &&
                s3.deletedHazardIds.indexOf(h.hazardId) >= 0) found = true;
          });
        }
        if (!found) { st.objects.push(JSON.parse(JSON.stringify(h))); injected++; }
      });
    });
    if (injected > 0 && !window.__bdHazardRestoreToasted) {
      window.__bdHazardRestoreToasted = true;
      try { if (typeof window.BD_toast === 'function') window.BD_toast('🧩 퀘스트 위험요소 ' + injected + '개 복구됨'); } catch(e){}
    }
  } catch(e){}
  return injected;
};

// 실내 스테이지 ID
const LIBRARY_STAGE = 100;
const CULTURE_STAGE = 101;

/* ── 이미지 로드 ── */
const LOADED_IMGS = {};
// (v162) 지역별 전용 맵 배경 (4:3 2048x1536 고해상 통일)
const IMG_MAP_CULT3F = "data:image/webp;base64,@@B64:c79cc96c_IMG_MAP_CULT3F.webp@@";
const IMG_MAP_CULTURE = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_MAP_SANG = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_MAP_DONG = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const IMG_MAP_SU = null /* (v382) 구 광장 배경·건물 — 레거시 맵 제거로 미사용 */;
const ALL_IMGS = {
  MAP1: IMG_MAP1, MAP2: IMG_MAP2,
  MAP_CULTURE: IMG_MAP_CULTURE, MAP_CULT3F: IMG_MAP_CULT3F, MAP_SANG: IMG_MAP_SANG, MAP_DONG: IMG_MAP_DONG, MAP_SU: IMG_MAP_SU,
  CAFE: IMG_CAFE, STORE24: IMG_STORE24, BOOKS: IMG_BOOKS,
  CORNER: IMG_CORNER, SHOP: IMG_SHOP, TALL: IMG_TALL,
  HALL: IMG_HALL, SMALL: IMG_SMALL,
  TREE1: IMG_TREE1, TREE2: IMG_TREE2, TREE3: IMG_TREE3, TREE4: IMG_TREE4,
  BENCH: IMG_BENCH,
};

function loadAllImages(cb) {
  let remaining = Object.keys(ALL_IMGS).length;
  for (const [k, src] of Object.entries(ALL_IMGS)) {
    if (!src) { remaining--; if (!remaining) cb(); continue; }   /* (v382) 제거된 레거시 이미지(null) — 404 로드 시도 방지 */
    const img = new Image();
    img.onload = () => { LOADED_IMGS[k] = img; remaining--; if (!remaining) cb(); };
    img.onerror = () => { remaining--; if (!remaining) cb(); };
    img.src = src;
  }
}

/* ── NPC (임현지) + 비주얼 노벨 대화 시스템 ── */
const NPC_STAGE  = 1;       // 봉담 광장 - 북쪽 (도서관 앞)
let NPC_X      = 0.42;    // 봉담 와우 도서관 앞 (에디터에서 이동 가능)
let NPC_Y      = 0.78;
const NPC_NEAR_R = 0.07;    // 상호작용 감지 반경

// 대화창 좌측 대형 초상화 (오리지널 SVG — 사용자 이미지 PNG/URL로 교체 가능)
const _NPC_PORTRAIT_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 640'>
<defs><linearGradient id='jk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3a4576'/><stop offset='1' stop-color='#232c4d'/></linearGradient></defs>
<path d='M230 66 C118 66 66 176 70 300 C73 402 58 470 52 576 L408 576 C402 470 388 402 390 300 C394 176 342 66 230 66 Z' fill='#6f4a2c'/>
<path d='M120 300 C112 400 96 470 88 576 L372 576 C364 470 350 400 340 300 Z' fill='#5c3c22' opacity='0.5'/>
<path d='M96 470 C128 432 168 416 230 416 C292 416 332 432 364 470 C392 508 402 566 408 640 L52 640 C58 566 68 508 96 470 Z' fill='url(#jk)'/>
<path d='M186 430 L230 470 L274 430 C300 440 316 468 322 500 L322 640 L138 640 L138 500 C144 468 160 440 186 430 Z' fill='#e9edf7'/>
<rect x='226' y='452' width='8' height='188' rx='3' fill='#c3cce2'/>
<path d='M198 356 Q200 402 230 414 Q260 402 262 356 Z' fill='#f3c6a3'/>
<path d='M230 138 C166 138 138 196 138 254 C138 326 178 384 230 384 C282 384 322 326 322 254 C322 196 294 138 230 138 Z' fill='#ffe1c8'/>
<ellipse cx='140' cy='262' rx='12' ry='18' fill='#ffe1c8'/><ellipse cx='320' cy='262' rx='12' ry='18' fill='#ffe1c8'/>
<ellipse cx='168' cy='312' rx='26' ry='14' fill='#ff9d9d' opacity='0.5'/><ellipse cx='292' cy='312' rx='26' ry='14' fill='#ff9d9d' opacity='0.5'/>
<path d='M158 228 Q186 216 210 226' stroke='#7c5030' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M250 226 Q274 216 302 228' stroke='#7c5030' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M156 258 Q186 236 216 258 L216 288 Q186 300 156 288 Z' fill='#ffffff'/>
<circle cx='186' cy='272' r='23' fill='#8a5a2e'/><circle cx='186' cy='272' r='23' fill='none' stroke='#5c3a1c' stroke-width='4'/>
<circle cx='186' cy='274' r='11' fill='#241611'/><circle cx='178' cy='262' r='7' fill='#ffffff'/><circle cx='193' cy='284' r='3.5' fill='#ffffff' opacity='0.85'/>
<path d='M154 256 Q186 232 218 256' stroke='#3a2a20' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M244 258 Q274 236 304 258 L304 288 Q274 300 244 288 Z' fill='#ffffff'/>
<circle cx='274' cy='272' r='23' fill='#8a5a2e'/><circle cx='274' cy='272' r='23' fill='none' stroke='#5c3a1c' stroke-width='4'/>
<circle cx='274' cy='274' r='11' fill='#241611'/><circle cx='266' cy='262' r='7' fill='#ffffff'/><circle cx='281' cy='284' r='3.5' fill='#ffffff' opacity='0.85'/>
<path d='M242 256 Q274 232 306 256' stroke='#3a2a20' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M228 296 q6 8 -3 12' stroke='#e6a684' stroke-width='3' fill='none' stroke-linecap='round'/>
<path d='M200 330 Q230 338 260 330 Q252 366 230 368 Q208 366 200 330 Z' fill='#b34a4a'/>
<path d='M206 332 Q230 338 254 332 L251 342 Q230 347 209 342 Z' fill='#ffffff'/>
<path d='M214 352 Q230 366 246 352 Q230 360 214 352 Z' fill='#ff8f8f'/>
<path d='M138 258 C120 168 150 96 230 96 C310 96 340 168 322 258 C312 214 300 182 276 172 C284 214 268 238 248 244 C255 208 240 180 230 180 C220 180 205 208 212 244 C192 238 176 214 184 172 C160 182 148 214 138 258 Z' fill='#a4703f'/>
<path d='M230 100 C300 100 330 165 320 236 C318 200 306 176 286 168 C292 150 280 120 230 118 Z' fill='#b8865a' opacity='0.6'/>
<path d='M138 258 C126 320 128 380 150 430 C140 360 146 300 150 260 Z' fill='#8a5a34'/>
<path d='M322 258 C334 320 332 380 310 430 C320 360 314 300 310 260 Z' fill='#8a5a34'/>
<path d='M224 100 C214 66 232 48 254 44 C240 58 246 74 262 74 C246 92 232 96 224 100 Z' fill='#a4703f'/>
<line x1='120' y1='398' x2='158' y2='470' stroke='#efefef' stroke-width='9' stroke-linecap='round'/>
<circle cx='104' cy='372' r='36' fill='#ffd0e6'/>
<g fill='none' stroke='#ff5fa2' stroke-width='8' stroke-linecap='round'><circle cx='104' cy='372' r='30'/><circle cx='104' cy='372' r='19'/><circle cx='104' cy='372' r='8'/></g>
<circle cx='104' cy='372' r='36' fill='none' stroke='#e23f86' stroke-width='3'/>
<path d='M140 452 Q170 442 186 462 Q194 486 172 494 Q142 500 134 476 Q130 458 140 452 Z' fill='#ffe1c8'/>
<path d='M150 458 L150 486 M162 456 L164 488 M174 460 L178 486' stroke='#f0b892' stroke-width='2.5' stroke-linecap='round'/>
</svg>`;
// (v154) 임현지 대화창 초상화 — 사용자 픽셀아트 PNG로 교체
const _NPC_PORTRAIT_PNG = 'data:image/webp;base64,@@B64:c54dab0f__NPC_PORTRAIT_PNG.webp@@';
const NPC_PORTRAIT_SRC = _NPC_PORTRAIT_PNG;

// 임현지 대화 데이터 (name = 화자, text = 대사)
const NPC_DATA = {
  name: '임현지',
  portrait: NPC_PORTRAIT_SRC,
  lines: [
    { name:'임현지', text:'어, 안녕. 문화의집 다니는 애 맞지? 도서관 앞에서 몇 번 본 것 같아.' },
    { name:'임현지', text:'요즘 동네에 이상한 배지 차고 다니면서 여기저기 치우고 다니는 사람 있다는 얘기 들었어. 너야?' },
    { name:'임현지', text:'와우리 쪽 길 진짜 지저분했었는데 요새 좀 나아진 것 같더라. 덕분인가 보네.' },
    { name:'임현지', text:'아무튼 나 이제 가봐야 돼. 도서관 안에 오늘 할 일 붙어 있으니까 심심하면 들러 봐.' },
  ]
};

// 대화 상태
let dialogueOpen  = false;
// (v357) 유령 잠금 감시견용 외부 접근 훅 — 플래그 누수 시 복구 수단
window.__bdDlgOpenGet = function(){ return dialogueOpen; };
window.__bdDlgOpenSet = function(v){ dialogueOpen = !!v; };
let _dlgIndex     = 0;
let _dlgNpc       = null;
let _dlgTyping    = false;
let _dlgFull      = '';
let _dlgShown     = '';
let _dlgTimer     = null;

function getNearNPC() {
  if (currentStage !== NPC_STAGE) return null;
  const dx = heroX - NPC_X, dy = heroY - NPC_Y;
  if (dx*dx + dy*dy <= NPC_NEAR_R*NPC_NEAR_R) return NPC_DATA;
  return null;
}

function openDialogue(npc) {
  if (!npc || dialogueOpen) return;
  dialogueOpen = true;
  _dlgNpc = npc;
  _dlgIndex = 0;
  moveKeys = { w:false, a:false, s:false, d:false };
  const ov  = document.getElementById('dialogue-overlay');
  const por = document.getElementById('dialogue-portrait');
  if (por) por.src = npc.portrait;
  if (ov)  ov.style.display = 'block';
  _startLine();
}

function _startLine() {
  const line = _dlgNpc.lines[_dlgIndex];
  const nameEl = document.getElementById('dialogue-name');
  const txtEl  = document.getElementById('dialogue-text');
  const nextEl = document.getElementById('dialogue-next');
  if (nameEl) nameEl.textContent = line.name || _dlgNpc.name;
  _dlgFull = line.text;
  _dlgShown = '';
  _dlgTyping = true;
  if (nextEl) nextEl.style.opacity = '0';
  if (txtEl) txtEl.textContent = '';
  if (_dlgTimer) clearInterval(_dlgTimer);
  let i = 0;
  _dlgTimer = setInterval(function() {
    i++;
    _dlgShown = _dlgFull.slice(0, i);
    if (txtEl) txtEl.textContent = _dlgShown;
    if (i >= _dlgFull.length) {
      clearInterval(_dlgTimer); _dlgTimer = null; _dlgTyping = false;
      if (nextEl) nextEl.style.opacity = '1';
    }
  }, (typeof window.BD_dlgInterval==='function' ? window.BD_dlgInterval() : 28));
}

function advanceDialogue() {
  if (!dialogueOpen) return;
  // 타이핑 중이면 즉시 완성
  if (_dlgTyping) {
    if (_dlgTimer) { clearInterval(_dlgTimer); _dlgTimer = null; }
    _dlgTyping = false;
    _dlgShown = _dlgFull;
    const txtEl  = document.getElementById('dialogue-text');
    const nextEl = document.getElementById('dialogue-next');
    if (txtEl) txtEl.textContent = _dlgFull;
    if (nextEl) nextEl.style.opacity = '1';
    return;
  }
  // 다음 줄 또는 종료
  _dlgIndex++;
  if (_dlgIndex >= _dlgNpc.lines.length) {
    if (_dlgNpc && _dlgNpc.isQuestNpc && typeof _onQuestDialogueComplete === 'function') _onQuestDialogueComplete();
    closeDialogue();
    return;
  }
  _startLine();
}

function closeDialogue() {
  dialogueOpen = false;
  if (_dlgTimer) { clearInterval(_dlgTimer); _dlgTimer = null; }
  _dlgTyping = false;
  const ov = document.getElementById('dialogue-overlay');
  if (ov) ov.style.display = 'none';
}

/* ══════════════════════════════════════════════════════════════
   퀘스트 NPC (사서 도현) + 전용 퀘스트 시스템
   - 도서관 앞 오른쪽에 배치 (임현지와 구분되는 남성 사서)
   - 대화로 퀘스트 수락 → 목표 진행 → 완료 시 보상 지급
   ══════════════════════════════════════════════════════════════ */
const QNPC_STAGE  = 1;        // 봉담 광장 - 북쪽 (도서관 앞)
let QNPC_X      = 0.58;     // 도서관 문 앞 오른쪽 (에디터에서 이동 가능)
let QNPC_Y      = 0.80;
const QNPC_NEAR_R = 0.062;

// 퀘스트 상태: 'offer'(수락 전) → 'active'(진행 중) → 'reward'(완료 대기) → 'done'(완료)
let quest_state = 'done';   // (v240g) 데모 퀘스트 비활성 — 사서는 일반 안내 NPC

const QUEST_DEF = {
  id: 'librarian_survey',
  title: '도서관 심부름 (연습)',
  reward: { gold: 300, xp: 60 },
  rewardItem: { id:'gold_bookmark', tab:'misc', icon:'🎫', name:'도서관 문화상품권',
                desc:'정도현이 감사 인사로 챙겨준 문화상품권. 편의점이나 문화의집에서 쓸 수 있다.', price: 200 },
  objectives: [
    { id:'talk_hyunji',     label:'광장의 임현지와 대화하기',        target: 1, cur: 0 },
    { id:'train_scarecrow', label:'위험 요소 정화 전투에서 승리하기', target: 3, cur: 0 },   // (v236) 허수아비 제거 반영
  ],
};

function _questAllDone() {
  return QUEST_DEF.objectives.every(o => o.cur >= o.target);
}

// 목표 진행 (외부 훅에서 호출) — 'active' 상태에서만 카운트
function surveyQuestProgress(objId, n) {
  if (quest_state !== 'active') return;
  const o = QUEST_DEF.objectives.find(x => x.id === objId);
  if (!o || o.cur >= o.target) return;
  o.cur = Math.min(o.target, o.cur + (n || 1));
  if (typeof showShopToast === 'function') {
    showShopToast(`📜 ${o.label} (${o.cur}/${o.target})`);
  }
  if (_questAllDone()) {
    quest_state = 'reward';
    if (typeof showShopToast === 'function') showShopToast('📜 목표 완료! 사서 도현에게 돌아가세요.');
  }
}

// 대화창 좌측 대형 초상화 (남성 사서 — 오리지널 SVG)
const _QNPC_PORTRAIT_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 460 640'>
<defs><linearGradient id='qvest' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5a6b52'/><stop offset='1' stop-color='#39472f'/></linearGradient></defs>
<path d='M96 470 C128 432 168 416 230 416 C292 416 332 432 364 470 C392 508 402 566 408 640 L52 640 C58 566 68 508 96 470 Z' fill='#3a3f4d'/>
<path d='M150 430 L230 470 L310 430 C338 442 356 470 362 502 L362 640 L98 640 L98 502 C104 470 122 442 150 430 Z' fill='#e9edf2'/>
<path d='M176 424 L230 470 L284 424 C300 448 306 500 300 560 L160 560 C154 500 160 448 176 424 Z' fill='url(#qvest)'/>
<path d='M226 470 L234 470 L232 640 L228 640 Z' fill='#2c3446'/>
<path d='M212 462 L230 500 L248 462 L240 452 L220 452 Z' fill='#8c2f36'/>
<path d='M198 356 Q200 402 230 414 Q260 402 262 356 Z' fill='#e6b48c'/>
<path d='M230 150 C168 150 142 206 142 262 C142 330 180 386 230 386 C280 386 318 330 318 262 C318 206 292 150 230 150 Z' fill='#f2cfa8'/>
<ellipse cx='144' cy='270' rx='11' ry='17' fill='#f2cfa8'/><ellipse cx='316' cy='270' rx='11' ry='17' fill='#f2cfa8'/>
<ellipse cx='172' cy='316' rx='24' ry='12' fill='#e78d7a' opacity='0.4'/><ellipse cx='288' cy='316' rx='24' ry='12' fill='#e78d7a' opacity='0.4'/>
<path d='M150 236 Q182 224 210 236' stroke='#2f2a26' stroke-width='7' fill='none' stroke-linecap='round'/>
<path d='M250 236 Q278 224 310 236' stroke='#2f2a26' stroke-width='7' fill='none' stroke-linecap='round'/>
<g fill='none' stroke='#2b2b33' stroke-width='6'>
<rect x='150' y='256' width='60' height='46' rx='14'/>
<rect x='250' y='256' width='60' height='46' rx='14'/>
<path d='M210 274 Q230 266 250 274'/>
<path d='M150 272 L128 264'/><path d='M310 272 L332 264'/>
</g>
<circle cx='180' cy='279' r='9' fill='#3a2a20'/><circle cx='280' cy='279' r='9' fill='#3a2a20'/>
<circle cx='177' cy='275' r='3' fill='#fff' opacity='0.85'/><circle cx='277' cy='275' r='3' fill='#fff' opacity='0.85'/>
<path d='M214 330 Q230 340 246 330' stroke='#a85a44' stroke-width='4' fill='none' stroke-linecap='round'/>
<path d='M142 258 C128 176 158 108 230 108 C302 108 332 176 318 258 C312 214 300 186 280 178 C286 158 276 132 230 130 C184 132 174 158 180 178 C160 186 148 214 142 258 Z' fill='#2f2a26'/>
<path d='M180 178 C176 158 196 138 230 138 C264 138 284 158 280 178 C262 166 198 166 180 178 Z' fill='#3d352f'/>
<path d='M142 258 C134 214 150 180 168 172 C160 200 158 232 162 260 Z' fill='#241f1c'/>
<path d='M318 258 C326 214 310 180 292 172 C300 200 302 232 298 260 Z' fill='#241f1c'/>
<rect x='300' y='470' width='96' height='128' rx='6' fill='#7c4a2e'/>
<rect x='300' y='470' width='96' height='128' rx='6' fill='none' stroke='#5c341e' stroke-width='4'/>
<rect x='312' y='470' width='10' height='128' fill='#5c341e'/>
<line x1='334' y1='494' x2='384' y2='494' stroke='#e9ddc4' stroke-width='4'/>
<line x1='334' y1='512' x2='384' y2='512' stroke='#e9ddc4' stroke-width='4'/>
<line x1='334' y1='530' x2='384' y2='530' stroke='#e9ddc4' stroke-width='4'/>
<path d='M300 520 Q262 512 236 520 L236 548 Q272 556 300 548 Z' fill='#f2cfa8'/>
</svg>`;
// (v156) 정도현 대화창 초상화 — 사용자 픽셀아트 PNG로 교체
const _QNPC_PORTRAIT_PNG = 'data:image/webp;base64,@@B64:7e3673e0__QNPC_PORTRAIT_PNG.webp@@';
const QNPC_PORTRAIT_SRC = _QNPC_PORTRAIT_PNG;

// 상태별 대화 데이터 동적 생성
function getQuestNpcData() {
  const name = '사서 도현';
  let lines;
  if (quest_state === 'offer') {
    lines = [
      { name, text:'실례합니다… 아, 안녕하세요! 저는 이 봉담 와우 도서관 신입 사서 도현이라고 합니다.' },
      { name, text:'부탁이 하나 있는데요, 제가 아직 이 동네 지리랑 사람들을 잘 몰라서요…' },
      { name, text:'광장에 있는 임현지 학생과 인사 좀 나눠 주시고, 동네 위험 요소도 하나 정화해 주시겠어요?' },
      { name, text:'도와주시면 사례는 확실히 하겠습니다. 부탁드려도 될까요? …감사합니다! 잘 부탁드려요.' },
    ];
  } else if (quest_state === 'active') {
    const prog = QUEST_DEF.objectives.map(o => {
      const mark = o.cur >= o.target ? '✔' : '▫';
      return `${mark} ${o.label} (${o.cur}/${o.target})`;
    }).join('  /  ');
    lines = [
      { name, text:'아직 부탁드린 일이 남아 있네요. 천천히 하셔도 괜찮습니다!' },
      { name, text:`현재 진행 상황이에요.  ${prog}` },
      { name, text:'광장의 임현지 학생은 도서관 바로 앞에 있고, 위험 요소는 배지를 비추면 정화할 수 있답니다.' },
    ];
  } else if (quest_state === 'reward') {
    lines = [
      { name, text:'오! 벌써 다 해주셨군요. 임현지 학생도 만나고, 훈련장 점검까지…' },
      { name, text:'정말 큰 도움이 됐습니다. 약속대로 사례를 드릴게요.' },
      { name, text:`여기, 사례로 ${QUEST_DEF.reward.gold}G랑 문화상품권 하나 챙겨드릴게요. 앞으로도 종종 들러 주세요!` },
    ];
  } else { // done — (v240g) 퀘스트 없이 동네 안내만
    lines = [
      { name, text:'안녕하세요! 봉담 와우 도서관 사서 도현입니다.' },
      { name, text:'도서관엔 재미있는 책이 정말 많아요. 산책하다 더우면 잠깐 들러서 쉬다 가세요~' },
    ];
  }
  return { name, portrait: QNPC_PORTRAIT_SRC, lines, isQuestNpc: true };
}

function openQuestDialogue() {
  if (dialogueOpen) return;
  _qnpcOpenState = quest_state;   // 대화 시작 시점의 상태 저장
  openDialogue(getQuestNpcData());
}

let _qnpcOpenState = 'offer';

// 퀘스트 NPC 대화를 끝까지 읽었을 때 호출 (ESC로 닫으면 호출 안 됨)
function _onQuestDialogueComplete() {
  if (_qnpcOpenState === 'offer' && quest_state === 'offer') {
    quest_state = 'active';
    // 원본 데모 퀘스트 수락 토스트는 봉담 게임에서 억제 (봉담 NPC 퀘스트로 대체됨)
  } else if (_qnpcOpenState === 'reward' && quest_state === 'reward') {
    // 보상 지급
    if (typeof playerGold !== 'undefined') playerGold += QUEST_DEF.reward.gold;
    if (typeof addSafetyXP === 'function') addSafetyXP(QUEST_DEF.reward.xp);
    if (typeof addToInventory === 'function') addToInventory(QUEST_DEF.rewardItem, 1);
    if (typeof achieveTrack === 'function') { try { achieveTrack('quest_done', 1); } catch(e){} }
    quest_state = 'done';
    if (typeof showShopToast === 'function') {
      showShopToast(`🏛️ 퀘스트 완료! +${QUEST_DEF.reward.gold}G +${QUEST_DEF.reward.xp}XP  🎫 문화상품권 획득`);
    }
  }
}

function getNearQuestNpc() {
  if (currentStage !== QNPC_STAGE) return false;
  const dx = heroX - QNPC_X, dy = heroY - QNPC_Y;
  return (dx*dx + dy*dy) <= QNPC_NEAR_R*QNPC_NEAR_R;
}

// 퀘스트 NPC 렌더링 (남성 사서 치비 스프라이트)
// (v156) 정도현 맵 스프라이트 — 사용자 픽셀아트 PNG
const _QNPC_SPRITE_PNG = 'data:image/png;base64,@@B64:f646f1eb__QNPC_SPRITE_PNG.png@@';
const _qnpcSpriteImg = new Image();
_qnpcSpriteImg.src = _QNPC_SPRITE_PNG;
setTimeout(function(){ try{ var u = window.BD_ASSETS && BD_ASSETS.get('field.npc.dohyun'); if(u) _qnpcSpriteImg.src = u; }catch(e){} }, 1500);   // (v239) 에셋 슬롯

function drawQuestNpc(ctx, canvas) {
  if (currentStage !== QNPC_STAGE) return;
  const bx = toScreenX(QNPC_X, canvas);
  const byFoot = toScreenY(QNPC_Y, canvas);
  const sc = currentScale * (window.BD_SPR || 1);   // (v206) 캐릭터 공통 배율
  const w = 46 * 1.2 * sc, h = 80 * 1.2 * sc;
  const hr = w * 0.42;
  const headY = byFoot - h * 0.64;

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(bx, byFoot, w*0.34, w*0.14, 0, 0, Math.PI*2); ctx.fill();

  // ── (v156) 정도현 스프라이트 이미지 렌더링 ──
  // 이미지가 아직 로드되지 않았으면 간단한 실루엣으로 폴백
  if (_qnpcSpriteImg && _qnpcSpriteImg.complete && _qnpcSpriteImg.naturalWidth > 0) {
    // 발 밑(byFoot)을 기준으로, 원본 비율을 유지하며 배치 (임현지와 동일한 세로 크기)
    const spH = h * 0.90;
    const spW = spH * (_qnpcSpriteImg.naturalWidth / _qnpcSpriteImg.naturalHeight);
    const spX = bx - spW / 2;
    const spY = byFoot - spH;
    ctx.imageSmoothingEnabled = false;                     // 픽셀아트 선명하게
    try { ctx.drawImage(_qnpcSpriteImg, spX, spY, spW, spH); } catch(e) {}
    ctx.imageSmoothingEnabled = true;
  } else {
    // 폴백(로딩 중): 단순 실루엣
    ctx.fillStyle = '#4c5b40';
    ctx.fillRect(bx - w*0.22, byFoot - h*0.60, w*0.44, h*0.56);
    ctx.fillStyle = '#f2cfa8';
    ctx.beginPath(); ctx.arc(bx, headY, hr, 0, Math.PI*2); ctx.fill();
  }

  // 이름 태그
  const nfs = Math.round(11 * sc);
  ctx.font = `bold ${nfs}px 'Noto Serif KR', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nameW = ctx.measureText(QUEST_DEF && '사서 도현').width + 12;
  const tagY = byFoot - h*0.90 - 4*sc;   // (v156) 스프라이트 머리 위
  ctx.fillStyle = 'rgba(60,72,52,0.9)';
  ctx.fillRect(bx - nameW/2, tagY - nfs, nameW, nfs + 6);
  ctx.fillStyle = '#e8f0d8';
  ctx.fillText('사서 도현', bx, tagY - nfs/2 + 3);

  // 퀘스트 상태 아이콘 (머리 위)
  let qicon = '';
  if (quest_state === 'offer')       qicon = '❗';
  else if (quest_state === 'active') qicon = '…';
  else if (quest_state === 'reward') qicon = '❓';
  if (qicon && !dialogueOpen) {
    const bob = Math.sin(Date.now() / 300) * 2 * sc;
    const ifs = Math.round(18 * sc);
    ctx.font = `bold ${ifs}px 'Noto Serif KR', sans-serif`;
    ctx.fillStyle = quest_state === 'reward' ? '#ffe14d' : (quest_state === 'offer' ? '#ffd24d' : '#cfd8e8');
    ctx.fillText(qicon, bx, tagY - nfs - ifs*0.7 + bob);
  }

  // [F] 대화 마커 (근접 시)
  if (!dialogueOpen && getNearQuestNpc()) {
    const markerY = byFoot + 8*sc;
    const fs = Math.round(12*sc);
    ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
    const txt = '[F] 대화';
    const tw = ctx.measureText(txt).width + 12;
    ctx.fillStyle = 'rgba(76,91,64,0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx - tw/2, markerY, tw, fs+8, 5); else ctx.rect(bx - tw/2, markerY, tw, fs+8);
    ctx.fill();
    ctx.fillStyle = '#eaf3d8';
    ctx.fillText(txt, bx, markerY + (fs+8)/2 + 1);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

/* ── 허수아비 시스템 ── */
const SCARECROW_MAX_HP = 100;
const SCARECROW_SPAWN_STAGE = -1;      // (v236) 허수아비 제거 — 동화리 서쪽 길의 '길을 막은 자전거'와 겹치는 더미였음.
//  -1 = 어떤 스테이지에도 스폰하지 않음. 되살리려면 4로 되돌리면 된다.
//  주의: _drawScarecrowShape 은 전투 몹 스프라이트 폴백(makeScarecrowSprite)에서 쓰이므로 삭제 금지.
const SCARECROW_RESPAWN_DELAY = 1000;
const SCARECROW_DAMAGE_PER_HIT = 5;

// 허수아비 위치 — 서문 맵 정중앙
let SCARECROW_SPAWN_X = 0.50;
let SCARECROW_SPAWN_Y = 0.50;

let _scarecrow = {
  hp: SCARECROW_MAX_HP,
  alive: false,
  deathTime: 0,
  flashTimer: 0,
  // ── 마법사 속성 상태이상 ──
  burnUntil: 0,       // 불 화상 DoT 종료 시각(ms)
  burnNextTick: 0,    // 다음 화상 데미지 틱 시각
  slowUntil: 0,       // 물 둔화 종료 시각
  stunUntil: 0,       // 전기 스턴 전체 종료 시각
  stunNextPulse: 0,   // 다음 스턴 펄스 시각
  stunActiveUntil: 0, // 현재 펄스의 멈춤 표시 종료 시각
};

// ── 직업별 평타 데미지 ──
const CLASS_ATK = {
  warrior:    10,  // 부채꼴
  rogue_stab:  5,  // 찌르기
  rogue_fan:   5,  // 작은 부채꼴(추가)
  archer:     10,  // 화살 명중
  paladin:     8,  // 대시 후 부채꼴
};

// ── 궁수 화살 투사체 ──
const ARROW_SPEED      = 0.012;  // 프레임당 이동(맵 비율)
const ARROW_MAX_LIFE   = 90;     // 최대 수명(프레임)
const ARROW_HIT_RADIUS = 0.05;   // 명중 반경
let _arrows = [];

// ── 성기사 공격 대시(런지) ──
const PAL_LUNGE_DURATION = 7;
const PAL_LUNGE_SPEED    = 0.0065;
let _palLungeTimer = 0, _palLungeDirX = 0, _palLungeDirY = 0;

/** 허수아비에 데미지 적용 (양만큼) */
function _damageScarecrow(amount) {
  if (currentStage !== SCARECROW_SPAWN_STAGE || !_scarecrow.alive) return false;
  // ── 붕괴 스타레일식 턴제 전투 개시 ──
  // 전투가 열려 있으면 필드 평타는 무시 (전투는 별도 전투 UI에서 진행)
  if (typeof HSR !== 'undefined') {
    if (HSR.active) return true;
    if (!HSR.cleared) { HSR.start(); return true; }
  }
  _scarecrow.flashTimer = 10;
  _scarecrow.hp -= amount;
  if (typeof questProgress === 'function') surveyQuestProgress('train_scarecrow', 1);
  if (_scarecrow.hp <= 0) {
    _scarecrow.hp = 0;
    _scarecrow.alive = false;
    _scarecrow.deathTime = Date.now();
    showShopToast('💀 허수아비가 쓰러졌다! 1초 후 부활...');
  }
  return true;
}

/** 허수아비가 (영웅이 바라보는 방향 기준) 부채꼴 안에 있는지 */
function _scarecrowInCone(range, halfAngle) {
  if (currentStage !== SCARECROW_SPAWN_STAGE || !_scarecrow.alive) return false;
  // 영웅 → 허수아비 방향 벡터 (바라보는 방향과 일치하도록 정방향 계산)
  const vx = SCARECROW_SPAWN_X - heroX;
  const vy = SCARECROW_SPAWN_Y - heroY;
  const dist = Math.sqrt(vx*vx + vy*vy);
  if (dist > range) return false;
  const dirAngles = { front: Math.PI/2, back: -Math.PI/2, left: Math.PI, right: 0 };
  const base  = dirAngles[lastDir] ?? Math.PI/2;
  const angle = Math.atan2(vy, vx);
  let diff = angle - base;
  while (diff >  Math.PI) diff -= 2*Math.PI;
  while (diff < -Math.PI) diff += 2*Math.PI;
  return Math.abs(diff) <= halfAngle;
}

/** 궁수: 바라보는 방향으로 화살 1발 발사 */
function spawnArrow() {
  let dx = 0, dy = 0;
  if (lastDir === 'back')       dy = -1;
  else if (lastDir === 'front') dy = 1;
  else if (lastDir === 'left')  dx = -1;
  else if (lastDir === 'right') dx = 1;
  else dy = 1;
  _arrows.push({ x: heroX, y: heroY, dx, dy, life: ARROW_MAX_LIFE });
}

/** 화살 이동 + 명중 판정 (매 프레임) */
function updateArrows() {
  for (let i = _arrows.length - 1; i >= 0; i--) {
    const a = _arrows[i];
    a.x += a.dx * ARROW_SPEED;
    a.y += a.dy * ARROW_SPEED;
    a.life--;
    // 허수아비 명중 (서문 훈련장)
    if (currentStage === SCARECROW_SPAWN_STAGE && _scarecrow.alive) {
      const ddx = SCARECROW_SPAWN_X - a.x;
      const ddy = SCARECROW_SPAWN_Y - a.y;
      if (ddx*ddx + ddy*ddy <= ARROW_HIT_RADIUS*ARROW_HIT_RADIUS) {
        _damageScarecrow(CLASS_ATK.archer);
        _arrows.splice(i, 1);
        continue;
      }
    }
    // 필드 몹 명중
    if (_hitMobAt(a.x, a.y, ARROW_HIT_RADIUS, CLASS_ATK.archer)) {
      _arrows.splice(i, 1);
      continue;
    }
    if (a.life <= 0 || a.x < -0.1 || a.x > 1.1 || a.y < -0.1 || a.y > 1.1) {
      _arrows.splice(i, 1);
    }
  }
}

/** 날아가는 화살 그리기 */
function drawArrows(ctx, canvas) {
  if (!_arrows.length) return;
  const sc = currentScale;
  for (const a of _arrows) {
    const ax = toScreenX(a.x, canvas);
    const ay = toScreenY(a.y, canvas);
    const ang = Math.atan2(a.dy, a.dx);
    const len = 22 * sc;
    const ex = ax + Math.cos(ang) * len;
    const ey = ay + Math.sin(ang) * len;
    ctx.save();
    ctx.strokeStyle = 'rgba(210,170,70,0.95)';
    ctx.lineWidth = 3 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    const tipL = 8 * sc, perp = ang + Math.PI/2;
    ctx.fillStyle = 'rgba(255,225,110,1.0)';
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(ang)*tipL,  ey + Math.sin(ang)*tipL);
    ctx.lineTo(ex + Math.cos(perp)*4*sc, ey + Math.sin(perp)*4*sc);
    ctx.lineTo(ex - Math.cos(perp)*4*sc, ey - Math.sin(perp)*4*sc);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** 성기사 공격 대시 시작 (바라보는 방향으로 짧게) */
function startPaladinLunge() {
  if (isDashing) return;
  let dx = 0, dy = 0;
  if (lastDir === 'back')       dy = -1;
  else if (lastDir === 'front') dy = 1;
  else if (lastDir === 'left')  dx = -1;
  else if (lastDir === 'right') dx = 1;
  else dy = 1;
  _palLungeDirX = dx; _palLungeDirY = dy;
  _palLungeTimer = PAL_LUNGE_DURATION;
}

/** 성기사 공격 대시 진행 (매 프레임) */
function updatePaladinLunge() {
  if (_palLungeTimer <= 0) return;
  if (typeof tryMove === 'function') {
    tryMove(_palLungeDirX * PAL_LUNGE_SPEED, _palLungeDirY * PAL_LUNGE_SPEED);
  }
  _palLungeTimer--;
}

// ═══════════════════════════════════════════════════════════
//  마법사 속성 시스템 (안전도 '마법사' 스탯 해금 시 R키로 전환)
// ═══════════════════════════════════════════════════════════
const MAGE_ELEMENTS = ['fire', 'water', 'grass', 'electric'];
const MAGE_ELEMENT_INFO = {
  fire:     { name:'불',   icon:'🔥' },
  water:    { name:'물',   icon:'💧' },
  grass:    { name:'풀',   icon:'🌿' },
  electric: { name:'전기', icon:'⚡' },
};
let mageElementIdx   = 0;   // 현재 속성 인덱스 (불부터 시작)
let _grassHealReadyAt = 0;  // 풀 속성 회복 가능 시각(ms)

/** '마법사' 스탯이 해금되어 속성을 쓸 수 있는지 */
function mageElementUnlocked() {
  return heroClass === 'mage' && (safetySkillLevels['mage_element'] || 0) > 0;
}
function currentMageElement() { return MAGE_ELEMENTS[mageElementIdx]; }

/** R키: 속성 순환 (불 → 물 → 풀 → 전기) */
function cycleMageElement() {
  if (!mageElementUnlocked()) return;
  mageElementIdx = (mageElementIdx + 1) % MAGE_ELEMENTS.length;
  const el = MAGE_ELEMENT_INFO[currentMageElement()];
  showShopToast(`${el.icon} 속성 전환 → ${el.name}`);
}

/** 마법 공격이 허수아비에 적중했을 때 속성 효과 적용 */
function applyMageElementOnHit() {
  if (!mageElementUnlocked()) return;
  if (currentStage !== SCARECROW_SPAWN_STAGE || !_scarecrow.alive) return;
  const now = Date.now();
  const el = currentMageElement();

  if (el === 'fire') {
    // 불: 3초 동안 1초마다 2 데미지 (재적중 시 갱신)
    _scarecrow.burnUntil    = now + 3000;
    _scarecrow.burnNextTick = now + 1000;
  } else if (el === 'water') {
    // 물: 5초 둔화 (중첩 없이 지속시간만 갱신)
    _scarecrow.slowUntil = now + 5000;
  } else if (el === 'grass') {
    // 풀: 적중 시 30초당 1회 HP 10 회복
    if (now >= _grassHealReadyAt) {
      _grassHealReadyAt = now + 30000;
      if (typeof healHP === 'function') healHP(10);
      else syncSharedHP(heroHP + 10, false);
      showShopToast('🌿 풀의 기운 — HP +10 회복!');
    }
  } else if (el === 'electric') {
    // 전기: 5초 동안 2초마다 한 번 멈춤(스턴 펄스)
    _scarecrow.stunUntil     = now + 5000;
    _scarecrow.stunNextPulse = now;   // 즉시 첫 펄스
  }
}

/** 허수아비 상태이상 업데이트 (매 프레임) */
function updateScarecrowStatus() { return; /* (v381) 허수아비 제거 */ }

/** 허수아비 상태이상 초기화 (부활/리셋 시) */
function _resetScarecrowStatus() {
  _scarecrow.burnUntil = 0;
  _scarecrow.burnNextTick = 0;
  _scarecrow.slowUntil = 0;
  _scarecrow.stunUntil = 0;
  _scarecrow.stunNextPulse = 0;
  _scarecrow.stunActiveUntil = 0;
}

// ── 평타(기본 공격) 시스템 ──
const BASIC_ATK_COOLDOWN = 400;    // ms
const BASIC_ATK_RANGE    = 0.10;   // 월드 좌표 거리
const BASIC_ATK_ANIM_FRAMES = 10;  // 이펙트 지속 프레임

let _basicAtk = {
  lastTime: 0,
  animTimer: 0,   // 이펙트 남은 프레임
  dir: 'front',   // 공격 방향
  mouseX: 0,      // 클릭한 화면 X
  mouseY: 0,      // 클릭한 화면 Y
};

// 마법사 차징 상태
let _mageCharge = {
  charging: false,   // 차징 중 여부
  startTime: 0,      // 차징 시작 시각
  mouseX: 0,
  mouseY: 0,
  duration: 1000,    // 차징 시간 (ms)
};

/** 마법사 차징 업데이트 (gameLoop에서 매 프레임 호출) */
function updateMageCharge() {
  if (!_mageCharge.charging) return;
  const elapsed = Date.now() - _mageCharge.startTime;
  if (elapsed >= _mageCharge.duration) {
    _mageCharge.charging = false;
    // 차징 완료 → 실제 발사 (차징 시작 때 저장한 맵 좌표 그대로 사용)
    _fireMageAttack(_mageCharge.mapX, _mageCharge.mapY);
  }
}

/** 마법사 실제 발사 — mapX/Y는 맵 좌표 */
function _fireMageAttack(mapX, mapY) {
  const now = Date.now();
  _basicAtk.lastTime = now;
  _basicAtk.animTimer = BASIC_ATK_ANIM_FRAMES;
  _basicAtk.dir = lastDir;
  // 맵 좌표 그대로 저장 (이펙트 고정용)
  _basicAtk.mapX = mapX;
  _basicAtk.mapY = mapY;

  // 허수아비 피격 판정
  if (currentStage === SCARECROW_SPAWN_STAGE && _scarecrow.alive) {
    const mdx = SCARECROW_SPAWN_X - mapX;
    const mdy = SCARECROW_SPAWN_Y - mapY;
    if (Math.sqrt(mdx*mdx + mdy*mdy) <= 0.10) {
      applyMageElementOnHit();              // 속성 효과(상태이상/회복)
      _damageScarecrow(SCARECROW_DAMAGE_PER_HIT);  // 기본 마법 데미지
    }
  }
  // 필드 몹 피격 판정
  _hitMobAt(mapX, mapY, 0.11, SCARECROW_DAMAGE_PER_HIT + 3);
}

/** 평타 실행 — mousedown(좌클릭) 에서 호출 */
// (v239) 미사용 — 필드 좌클릭 평타를 제거하면서 호출 지점이 사라졌다.
//  성기사 대시·마법사 차징도 이 경로에서만 쓰여 함께 사문화됨(heroClass 는 항상 warrior).
function doBasicAttack(screenX, screenY) {
  const now = Date.now();
  if (shopOpen || invOpen || questPanelOpen || dialogueOpen) return;
  if (document.getElementById('game-screen').style.display !== 'block') return;

  // 마법사: 차징 시작 (쿨타임 중이거나 이미 차징 중이면 무시)
  if (heroClass === 'mage') {
    if (_mageCharge.charging) return;
    if (now - _basicAtk.lastTime < 700) return;
    _mageCharge.charging = true;
    _mageCharge.startTime = now;
    _mageCharge.mouseX = screenX;
    _mageCharge.mouseY = screenY;
    // 클릭 위치를 맵 좌표로 변환해서 고정
    const _canvas = document.getElementById('game-canvas');
    if (_canvas) {
      const _rect = _canvas.getBoundingClientRect();
      const _cx = screenX - _rect.left;
      const _cy = screenY - _rect.top;
      const _bx = (_cx - _canvas.width/2)  / currentScale + BASE_W/2;
      const _by = (_cy - _canvas.height/2) / currentScale + BASE_H/2;
      _mageCharge.mapX = (_bx/BASE_W - 0.5)*VIEWPORT_W + camX;
      _mageCharge.mapY = (_by/BASE_H - 0.5)*VIEWPORT_H + camY;
    }
    return;
  }

  // 직업별 쿨타임
  const cooldowns = { warrior:450, archer:500, rogue:280, paladin:600 };
  const cd = cooldowns[heroClass] || 400;
  if (now - _basicAtk.lastTime < cd) return;

  _basicAtk.lastTime = now;
  _basicAtk.animTimer = BASIC_ATK_ANIM_FRAMES;
  _basicAtk.dir = lastDir;
  _basicAtk.mouseX = screenX;
  _basicAtk.mouseY = screenY;

  // ── 직업별 동작 / 피격 판정 ──
  if (heroClass === 'archer') {
    // 궁수: 바라보는 방향으로 화살 발사 → 투사체가 명중하면 10 데미지
    spawnArrow();

  } else if (heroClass === 'rogue') {
    // 도적: ① 정면 찌르기 5  → ② 전사보다 작은 부채꼴 5 (둘 다 맞으면 10)
    let dmg = 0;
    if (_scarecrowInCone(0.13, Math.PI * 0.13)) dmg += CLASS_ATK.rogue_stab; // 좁고 길게 찌르기
    if (_scarecrowInCone(0.10, Math.PI * 0.24)) dmg += CLASS_ATK.rogue_fan;  // 작은 부채꼴
    if (dmg > 0) _damageScarecrow(dmg);
    _hitMobsCone(0.13, Math.PI * 0.24, CLASS_ATK.rogue_stab + CLASS_ATK.rogue_fan);

  } else if (heroClass === 'paladin') {
    // 성기사: 바로 앞으로 짧게 대시하면서 부채꼴 8 데미지
    startPaladinLunge();
    // 대시로 좁혀지는 거리를 감안해 사거리를 넉넉히 잡음
    if (_scarecrowInCone(0.15, Math.PI * 0.30)) _damageScarecrow(CLASS_ATK.paladin);
    _hitMobsCone(0.15, Math.PI * 0.30, CLASS_ATK.paladin);

  } else if (heroClass === 'warrior') {
    // 전사: 넓은 부채꼴 10 데미지
    if (_scarecrowInCone(0.14, Math.PI * 0.36)) _damageScarecrow(CLASS_ATK.warrior);
    _hitMobsCone(0.14, Math.PI * 0.36, CLASS_ATK.warrior);
  }
}

/** 허수아비 부활 체크 (gameLoop에서 매 프레임 호출) */
function updateScarecrow() { return; /* (v381) 허수아비 제거 */ }

/** 마법사 차징 중 이펙트 */
function drawMageChargeEffect(ctx, canvas) {
  if (!_mageCharge.charging) return;
  const elapsed = Date.now() - _mageCharge.startTime;
  const progress = Math.min(elapsed / _mageCharge.duration, 1.0);

  // 맵 좌표 → 스크린 좌표 (카메라가 움직여도 위치 고정)
  const cx = toScreenX(_mageCharge.mapX, canvas);
  const cy = toScreenY(_mageCharge.mapY, canvas);
  const sc = currentScale;

  ctx.save();

  // 수축하는 외곽 링 (시작 크게 → 점점 작아짐)
  const outerR = 70 * sc * (1 - progress * 0.5);
  ctx.globalAlpha = 0.35 + progress * 0.25;
  ctx.strokeStyle = 'rgba(180,100,255,0.7)';
  ctx.lineWidth = 2 * sc;
  ctx.setLineDash([6*sc, 4*sc]);
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 채워지는 핵심 원
  const innerR = 8 * sc + progress * 30 * sc;
  ctx.globalAlpha = progress * 0.85;
  const grad = ctx.createRadialGradient(cx, cy, 2*sc, cx, cy, innerR);
  grad.addColorStop(0,   'rgba(255,220,255,1.0)');
  grad.addColorStop(0.5, 'rgba(180,80,255,0.8)');
  grad.addColorStop(1,   'rgba(100,0,200,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI*2);
  ctx.fill();

  // 차징 완료 직전 강조 펄스
  if (progress > 0.8) {
    const pulse = (progress - 0.8) / 0.2;
    ctx.globalAlpha = pulse * 0.6;
    ctx.strokeStyle = 'rgba(255,180,255,1.0)';
    ctx.lineWidth = 3 * sc;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 1.2, 0, Math.PI*2);
    ctx.stroke();
  }

  ctx.restore();
}

/** 직업별 평타 이펙트 그리기 */
function drawBasicAtkEffect(ctx, canvas) {
  if (_basicAtk.animTimer <= 0) return;
  const t  = _basicAtk.animTimer / BASIC_ATK_ANIM_FRAMES; // 1→0
  const hx = toScreenX(heroX, canvas);
  const hy = toScreenY(heroY, canvas);
  const sc = currentScale;
  const dirAngles = { front: Math.PI/2, back: -Math.PI/2, left: Math.PI, right: 0 };
  const base = dirAngles[_basicAtk.dir] ?? Math.PI/2;

  ctx.save();

  if (heroClass === 'warrior') {
    // ── 전사: 넓은 부채꼴 휘두르기 ──
    const spread = Math.PI * 0.70;
    const radius = 60 * sc;
    ctx.globalAlpha = t * 0.80;
    const grad = ctx.createRadialGradient(hx, hy, 4*sc, hx, hy, radius);
    grad.addColorStop(0,   'rgba(255,220,80,0.95)');
    grad.addColorStop(0.6, 'rgba(255,140,20,0.6)');
    grad.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.arc(hx, hy, radius, base - spread/2, base + spread/2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,50,0.9)';
    ctx.lineWidth = 2.5 * sc;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.arc(hx, hy, radius, base - spread/2, base + spread/2);
    ctx.closePath();
    ctx.stroke();

  } else if (heroClass === 'mage') {
    // ── 마법사: 발사 위치(맵 좌표 고정)에 원형 폭발 ──
    const cx = toScreenX(_basicAtk.mapX, canvas);
    const cy = toScreenY(_basicAtk.mapY, canvas);
    const radius = 38 * sc;
    ctx.globalAlpha = t * 0.85;
    const grad = ctx.createRadialGradient(cx, cy, 2*sc, cx, cy, radius);
    grad.addColorStop(0,   'rgba(180,100,255,1.0)');
    grad.addColorStop(0.4, 'rgba(100,40,220,0.7)');
    grad.addColorStop(1,   'rgba(60,0,180,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.fill();
    // 외곽 링
    ctx.globalAlpha = t * 0.9;
    ctx.strokeStyle = 'rgba(220,160,255,0.95)';
    ctx.lineWidth = 2 * sc;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1.1 - t*0.1), 0, Math.PI*2);
    ctx.stroke();
    // 마법진 별 장식
    ctx.globalAlpha = t * 0.6;
    ctx.strokeStyle = 'rgba(255,220,255,0.8)';
    ctx.lineWidth = 1.2 * sc;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI*2/6)*i - Math.PI/2;
      const r1 = radius * 0.3, r2 = radius * 0.85;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*r1, cy + Math.sin(a)*r1);
      ctx.lineTo(cx + Math.cos(a)*r2, cy + Math.sin(a)*r2);
      ctx.stroke();
    }

  } else if (heroClass === 'archer') {
    // ── 궁수: 바라보는 방향으로 짧은 발사 섬광 (실제 화살은 투사체로 날아감) ──
    const len  = 34 * sc * (0.5 + t*0.5); // 짧은 발사 streak
    const ex   = hx + Math.cos(base) * len;
    const ey   = hy + Math.sin(base) * len;
    ctx.globalAlpha = t * 0.9;
    // 화살대
    ctx.strokeStyle = 'rgba(200,160,60,0.95)';
    ctx.lineWidth = 3 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // 화살촉
    ctx.fillStyle = 'rgba(255,220,100,1.0)';
    const tipL = 10 * sc;
    const perp = base + Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(base)*tipL, ey + Math.sin(base)*tipL);
    ctx.lineTo(ex + Math.cos(perp)*4*sc,  ey + Math.sin(perp)*4*sc);
    ctx.lineTo(ex - Math.cos(perp)*4*sc,  ey - Math.sin(perp)*4*sc);
    ctx.closePath();
    ctx.fill();
    // 잔광
    ctx.globalAlpha = t * 0.25;
    ctx.strokeStyle = 'rgba(255,240,120,0.6)';
    ctx.lineWidth = 8 * sc;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

  } else if (heroClass === 'rogue') {
    // ── 도적: 매우 짧은 두 번 찌르기+빗겨 베기 ──
    const slash1 = base - Math.PI*0.30;
    const slash2 = base + Math.PI*0.15;
    const len1 = 34 * sc;
    const len2 = 28 * sc;
    // 첫 번째 찌르기 선
    ctx.globalAlpha = t * 0.85;
    ctx.strokeStyle = 'rgba(180,220,255,0.95)';
    ctx.lineWidth = 2.5 * sc;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(slash1)*len1, hy + Math.sin(slash1)*len1);
    ctx.stroke();
    // 두 번째 베기 (t < 0.6 일 때 등장)
    if (t < 0.65) {
      ctx.globalAlpha = (0.65 - t) / 0.65 * 0.9;
      ctx.strokeStyle = 'rgba(150,255,200,0.9)';
      ctx.lineWidth = 2 * sc;
      ctx.beginPath();
      ctx.moveTo(hx + Math.cos(slash2)*4*sc, hy + Math.sin(slash2)*4*sc);
      ctx.lineTo(hx + Math.cos(slash2)*len2, hy + Math.sin(slash2)*len2);
      ctx.stroke();
    }
    // 날카로운 반짝임
    ctx.globalAlpha = t * 0.7;
    ctx.fillStyle = 'rgba(220,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(hx + Math.cos(slash1)*len1*0.8, hy + Math.sin(slash1)*len1*0.8, 3*sc, 0, Math.PI*2);
    ctx.fill();

  } else if (heroClass === 'paladin') {
    // ── 성기사: 짧고 묵직한 찌르기 + 신성한 빛 ──
    const stab = base;
    const len  = 44 * sc;
    // 신성 빛 후광
    ctx.globalAlpha = t * 0.35;
    const glow = ctx.createRadialGradient(hx, hy, 2*sc, hx, hy, 36*sc);
    glow.addColorStop(0,   'rgba(255,240,160,0.7)');
    glow.addColorStop(1,   'rgba(255,200,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, 36*sc, 0, Math.PI*2);
    ctx.fill();
    // 십자 베기
    const cross = base + Math.PI/2;
    ctx.globalAlpha = t * 0.80;
    ctx.strokeStyle = 'rgba(255,230,100,0.95)';
    ctx.lineWidth = 3.5 * sc;
    ctx.lineCap = 'round';
    // 세로(찌르기)
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + Math.cos(stab)*len, hy + Math.sin(stab)*len);
    ctx.stroke();
    // 가로(베기)
    if (t < 0.70) {
      ctx.globalAlpha = (0.70 - t)/0.70 * 0.75;
      ctx.lineWidth = 2.5 * sc;
      const mid = 0.55;
      const mx = hx + Math.cos(stab)*len*mid;
      const my = hy + Math.sin(stab)*len*mid;
      const cw = 18 * sc;
      ctx.beginPath();
      ctx.moveTo(mx - Math.cos(cross)*cw, my - Math.sin(cross)*cw);
      ctx.lineTo(mx + Math.cos(cross)*cw, my + Math.sin(cross)*cw);
      ctx.stroke();
    }
    // 끝 반짝임
    ctx.globalAlpha = t * 0.9;
    ctx.fillStyle = 'rgba(255,255,200,1.0)';
    ctx.beginPath();
    ctx.arc(hx + Math.cos(stab)*len, hy + Math.sin(stab)*len, 4*sc, 0, Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}

/** 허수아비 그리기 */
// (v154) 임현지 맵 스프라이트 — 사용자 픽셀아트 PNG
const _NPC_SPRITE_PNG = 'data:image/png;base64,@@B64:8624ab61__NPC_SPRITE_PNG.png@@';
const _npcSpriteImg = new Image();
_npcSpriteImg.src = _NPC_SPRITE_PNG;
setTimeout(function(){ try{ var u = window.BD_ASSETS && BD_ASSETS.get('field.npc.hyunji'); if(u) _npcSpriteImg.src = u; }catch(e){} }, 1500);   // (v239) 에셋 슬롯

function drawNPC(ctx, canvas) {
  if (currentStage !== NPC_STAGE) return;
  const bx = toScreenX(NPC_X, canvas);
  const byFoot = toScreenY(NPC_Y, canvas);
  const sc = currentScale * (window.BD_SPR || 1);   // (v206) 캐릭터 공통 배율
  const w = 46 * 1.2 * sc, h = 80 * 1.2 * sc;
  const hr = w * 0.42;
  const headY = byFoot - h * 0.64;

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(bx, byFoot, w*0.34, w*0.14, 0, 0, Math.PI*2); ctx.fill();

  // ── (v154) 임현지 스프라이트 이미지 렌더링 ──
  // 이미지가 아직 로드되지 않았으면 간단한 실루엣으로 폴백
  if (_npcSpriteImg && _npcSpriteImg.complete && _npcSpriteImg.naturalWidth > 0) {
    // 발 밑(byFoot)을 기준으로, 원본 비율을 유지하며 배치
    const spH = h * 0.90;                                   // 기존 도형 캐릭터 세로 크기에 맞춤 (정비례 축소)
    const spW = spH * (_npcSpriteImg.naturalWidth / _npcSpriteImg.naturalHeight);
    const spX = bx - spW / 2;
    const spY = byFoot - spH;
    ctx.imageSmoothingEnabled = false;                     // 픽셀아트 선명하게
    try { ctx.drawImage(_npcSpriteImg, spX, spY, spW, spH); } catch(e) {}
    ctx.imageSmoothingEnabled = true;
  } else {
    // 폴백(로딩 중): 단순 실루엣
    ctx.fillStyle = '#2c3557';
    ctx.fillRect(bx - w*0.22, byFoot - h*0.60, w*0.44, h*0.56);
    ctx.fillStyle = '#ffe1c8';
    ctx.beginPath(); ctx.arc(bx, headY, hr, 0, Math.PI*2); ctx.fill();
  }

  // 이름 태그
  const nfs = Math.round(11 * sc);
  ctx.font = `bold ${nfs}px 'Noto Serif KR', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const nameW = ctx.measureText(NPC_DATA.name).width + 12;
  const tagY = byFoot - h*0.90 - 4*sc;   // (v154) 스프라이트 머리 위
  ctx.fillStyle = 'rgba(40,52,95,0.85)';
  ctx.fillRect(bx - nameW/2, tagY - nfs, nameW, nfs + 6);
  ctx.fillStyle = '#ffd7e6';
  ctx.fillText(NPC_DATA.name, bx, tagY - nfs/2 + 3);

  // [F] 대화 마커 (근접 시)
  if (!dialogueOpen && getNearNPC()) {
    const markerY = byFoot + 8*sc;
    const fs = Math.round(12*sc);
    ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
    const txt = '[F] 대화';
    const tw = ctx.measureText(txt).width + 12;
    ctx.fillStyle = 'rgba(210,90,140,0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx - tw/2, markerY, tw, fs+8, 5); else ctx.rect(bx - tw/2, markerY, tw, fs+8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, bx, markerY + (fs+8)/2 + 1);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

function drawScarecrow(ctx, canvas) { return; /* (v381) 허수아비 제거 */ }

/** 상태이상 오라 글로우 (translate된 좌표계 기준) */
function _statusGlow(ctx, color, sc) {
  ctx.save();
  const cyG = -40 * sc;
  const g = ctx.createRadialGradient(0, cyG, 4*sc, 0, cyG, 55*sc);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, cyG, 55*sc, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function _drawScarecrowShape(ctx, cx, cy, sc) {
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2*sc, 18*sc, 6*sc, 0, 0, Math.PI*2);
  ctx.fill();

  // ── 기둥 (세로) ──
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(cx - 3*sc, cy - 80*sc, 6*sc, 80*sc);

  // ── 가로막대 ──
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(cx - 28*sc, cy - 62*sc, 56*sc, 5*sc);

  // ── 짚 몸통 (삼각형+사각형) ──
  ctx.fillStyle = '#C8A850';
  // 몸통 사각형
  ctx.fillRect(cx - 14*sc, cy - 60*sc, 28*sc, 35*sc);
  // 짚 아래 삼각 (치맛자락)
  ctx.beginPath();
  ctx.moveTo(cx - 18*sc, cy - 25*sc);
  ctx.lineTo(cx + 18*sc, cy - 25*sc);
  ctx.lineTo(cx, cy - 5*sc);
  ctx.closePath();
  ctx.fill();

  // ── 짚 텍스처 선 ──
  ctx.strokeStyle = '#A07030';
  ctx.lineWidth = 1.5*sc;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i*5*sc, cy - 60*sc);
    ctx.lineTo(cx + i*5*sc, cy - 26*sc);
    ctx.stroke();
  }

  // ── 팔 (왼쪽) ──
  ctx.fillStyle = '#C8A850';
  ctx.fillRect(cx - 28*sc, cy - 60*sc, 14*sc, 6*sc);
  // 손 (왼)
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath();
  ctx.arc(cx - 28*sc, cy - 57*sc, 5*sc, 0, Math.PI*2);
  ctx.fill();

  // ── 팔 (오른쪽) ──
  ctx.fillStyle = '#C8A850';
  ctx.fillRect(cx + 14*sc, cy - 60*sc, 14*sc, 6*sc);
  // 손 (오른)
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath();
  ctx.arc(cx + 28*sc, cy - 57*sc, 5*sc, 0, Math.PI*2);
  ctx.fill();

  // ── 머리 (원) ──
  ctx.fillStyle = '#F5D08C';
  ctx.beginPath();
  ctx.arc(cx, cy - 76*sc, 16*sc, 0, Math.PI*2);
  ctx.fill();
  // 머리 테두리
  ctx.strokeStyle = '#C8A030';
  ctx.lineWidth = 1.5*sc;
  ctx.stroke();

  // ── 모자 ──
  ctx.fillStyle = '#5C3A1E';
  // 챙
  ctx.fillRect(cx - 20*sc, cy - 89*sc, 40*sc, 5*sc);
  // 모자 몸통
  ctx.fillRect(cx - 12*sc, cy - 104*sc, 24*sc, 16*sc);

  // ── 얼굴 ──
  // 눈 (X모양)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2*sc;
  [-5, 5].forEach(ox => {
    ctx.beginPath();
    ctx.moveTo(cx + ox*sc - 3*sc, cy - 79*sc);
    ctx.lineTo(cx + ox*sc + 3*sc, cy - 73*sc);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + ox*sc + 3*sc, cy - 79*sc);
    ctx.lineTo(cx + ox*sc - 3*sc, cy - 73*sc);
    ctx.stroke();
  });
  // 입 (ㅡ 모양)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5*sc;
  ctx.beginPath();
  ctx.moveTo(cx - 5*sc, cy - 69*sc);
  ctx.lineTo(cx + 5*sc, cy - 69*sc);
  ctx.stroke();

  // ── 볼 패치 (짚 색깔) ──
  ctx.fillStyle = 'rgba(200,160,80,0.3)';
  ctx.beginPath();
  ctx.arc(cx - 9*sc, cy - 74*sc, 4*sc, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 9*sc, cy - 74*sc, 4*sc, 0, Math.PI*2);
  ctx.fill();
}
let heroX = 0.5, heroY = 0.8;   // 월드 좌표 (0~1 비율)
let heroName = '영웅';
let heroClass = 'warrior'; // 직업: warrior / mage / archer / rogue / paladin
let selectedCharacter = 1;  // 1=여자(애니메이션), 2=남자(단일이미지)
let moveKeys = {w:false,a:false,s:false,d:false};

// ── 레벨 디자인: 퀘스트 가이드 (미니맵 몹 표시 / 목표 지점 / 화면 화살표) ──
let QUEST_GUIDE_ON = true;   // ON/OFF 토글
// 현재 목표 오브젝트 찾기: 에디터에서 questTarget=true 지정 우선, 없으면 가장 가까운 미정화 hazard
function getGuideTarget() {
  const stage = STAGES[currentStage];
  if (!stage || !stage.objects) return null;
  const locked = (o) => (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(o));
  // (v58) 주민 부탁 퀘스트 추적 — 정화 전엔 위험요소로, 정화 후엔 보상 주민에게로 안내
  try {
    if (window.BD && BD.trackedQuest && String(BD.trackedQuest).indexOf('hzq_') === 0 && window.BD_hzQuestGuide) {
      const t = BD_hzQuestGuide(BD.trackedQuest);
      if (t) {
        if (Number(currentStage) === Number(t.sid)) return t.rect;
        const cross = _guideTargetToStage(t.sid);
        if (cross) return cross;
      }
    }
  } catch(eHq){}
  // (v148 버그 수정) NPC 퀘스트("임현지의 부탁"/"정도현의 부탁")를 추적 중이면
  // 이전에는 이 상태가 완전히 무시되고 그냥 가장 가까운 위험요소로 안내되고 있었음.
  // 이제 추적 중인 NPC 위치로 실제로 안내한다.
  try {
    if (window.BD && BD.trackedQuest && (BD.trackedQuest === 'npc_hyunji' || BD.trackedQuest === 'npc_dohyun')) {
      const alreadyDone = (typeof window.BD_isSubQuestDone === 'function') && window.BD_isSubQuestDone(BD.trackedQuest);
      if (!alreadyDone) {
        const isHyunji = (BD.trackedQuest === 'npc_hyunji');
        const npcStage = isHyunji ? NPC_STAGE : QNPC_STAGE;
        const npcX = isHyunji ? NPC_X : QNPC_X;
        const npcY = isHyunji ? NPC_Y : QNPC_Y;
        if (currentStage === npcStage) {
          return { rx:npcX, ry:npcY, rw:0.06, rh:0.06, _guideLabel:'여기서 F로 대화하기!' };
        }
        const toNpc = _guideTargetToStage(npcStage);
        if (toNpc) return toNpc;
      }
    }
  } catch(e){}
  // 1) 에디터에서 명시적으로 지정한 목표
  const marked = stage.objects.filter(o => o.questTarget && !_objPurified(o) && !locked(o));
  if (marked.length) {
    let best = null, bestD = Infinity;
    for (const o of marked) {
      const d = Math.hypot((o.rx||0) - heroX, (o.ry||0) - heroY);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }
  // 2) 폴백: 가장 가까운 미정화 위험요소 (잠긴 보스 제외)
  const hazards = stage.objects.filter(o => o.interactable === 'hazard' && !_objPurified(o) && !locked(o));
  if (hazards.length) {
    let best = null, bestD = Infinity;
    for (const o of hazards) {
      const d = Math.hypot((o.rx||0) - heroX, (o.ry||0) - heroY);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }
  // 3) 현재 스테이지에 목표가 없으면: 출구를 따라 BFS로 위험요소가 있는 스테이지를 찾아
  //    그 방향의 출구를 안내 대상으로 반환 (다른 지역으로 이동 유도)
  return _guideTargetAcrossStages();
}

// 출구 그래프 BFS — 위험요소가 남아 있는 스테이지로 가는 첫 출구를 안내
// 추적 중인 장(章)의 지정 지역을 우선하고, 없으면 가장 가까운 위험요소 지역으로.
function _guideTargetAcrossStages() {
  try {
    const locked = (o) => (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(o));
    const hasTarget = (sid) => {
      const st = STAGES[sid];
      if (!st || !st.objects || st.interior) return false;
      return st.objects.some(o => o.interactable === 'hazard' && !_objPurified(o) && !locked(o));
    };
    // 추적 중인 장의 지정 지역 (프롤로그/최종장=광장, 1~4장=각 방향 지역)
    const CH_STAGE = { prologue:1, ch1:2, ch2:3, ch3:4, ch4:5, final:1 };
    const prefSid = (window.BD && BD.trackedQuest && CH_STAGE[BD.trackedQuest] != null)
      ? CH_STAGE[BD.trackedQuest] : null;
    const preferOk = (prefSid != null && prefSid !== currentStage && hasTarget(prefSid));

    const visited = {}; visited[currentStage] = true;
    let queue = [];
    const st0 = STAGES[currentStage];
    if (!st0 || !st0.exits) return null;
    ['top','bottom','left','right'].forEach(dir => {
      const ex = st0.exits[dir];
      if (ex && ex.active && ex.nextStage != null && !visited[ex.nextStage]) {
        visited[ex.nextStage] = true;
        queue.push({ sid: ex.nextStage, firstDir: dir });
      }
    });
    let fallback = null; // 지정 지역이 아니어도 위험요소가 있는 가장 가까운 지역
    while (queue.length) {
      const cur = queue.shift();
      const pos = { top:{rx:0.47,ry:0.02}, bottom:{rx:0.47,ry:0.92}, left:{rx:0.02,ry:0.47}, right:{rx:0.92,ry:0.47} }[cur.firstDir];
      const mk = () => ({ rx:pos.rx, ry:pos.ry, rw:0.06, rh:0.06, _guideLabel:'이쪽으로 이동!' });
      if (preferOk && cur.sid === prefSid) return mk();       // 지정 지역 우선
      if (!fallback && hasTarget(cur.sid)) {
        if (!preferOk) return mk();                            // 지정 지역이 없으면 최근접 반환
        fallback = mk();                                       // 지정 지역 탐색 중엔 보류
      }
      const st = STAGES[cur.sid];
      if (st && st.exits && !st.interior) {
        ['top','bottom','left','right'].forEach(dir => {
          const ex = st.exits[dir];
          if (ex && ex.active && ex.nextStage != null && !visited[ex.nextStage]) {
            visited[ex.nextStage] = true;
            queue.push({ sid: ex.nextStage, firstDir: cur.firstDir });
          }
        });
      }
    }
    return fallback;
  } catch(e){}
  return null;
}
// (v148) 특정 스테이지로 향하는 출구를 BFS로 찾아 안내 — NPC 퀘스트 추적처럼
// "위험요소 유무"와 상관없이 특정 지역 자체로 유도해야 할 때 사용
function _guideTargetToStage(targetSid) {
  try {
    if (targetSid == null || targetSid === currentStage) return null;
    const visited = {}; visited[currentStage] = true;
    let queue = [];
    const st0 = STAGES[currentStage];
    if (!st0 || !st0.exits) return null;
    ['top','bottom','left','right'].forEach(dir => {
      const ex = st0.exits[dir];
      if (ex && ex.active && ex.nextStage != null && !visited[ex.nextStage]) {
        visited[ex.nextStage] = true;
        queue.push({ sid: ex.nextStage, firstDir: dir });
      }
    });
    while (queue.length) {
      const cur = queue.shift();
      if (cur.sid === targetSid) {
        const pos = { top:{rx:0.47,ry:0.02}, bottom:{rx:0.47,ry:0.92}, left:{rx:0.02,ry:0.47}, right:{rx:0.92,ry:0.47} }[cur.firstDir];
        return { rx:pos.rx, ry:pos.ry, rw:0.06, rh:0.06, _guideLabel:'이쪽으로 이동!' };
      }
      const st = STAGES[cur.sid];
      if (st && st.exits && !st.interior) {
        ['top','bottom','left','right'].forEach(dir => {
          const ex = st.exits[dir];
          if (ex && ex.active && ex.nextStage != null && !visited[ex.nextStage]) {
            visited[ex.nextStage] = true;
            queue.push({ sid: ex.nextStage, firstDir: cur.firstDir });
          }
        });
      }
    }
  } catch(e){}
  return null;
}
function _objPurified(o) {
  if (!o) return false;
  if (o._purified) return true;
  if (typeof window.BD_isPurified === 'function') return window.BD_isPurified(o.hazardId || o.id || o.label);
  return false;
}
window.BD_toggleQuestGuide = function(){ QUEST_GUIDE_ON = !QUEST_GUIDE_ON; if(typeof BD_toast==='function') BD_toast(QUEST_GUIDE_ON?'🧭 길안내 켜짐':'길안내 꺼짐'); return QUEST_GUIDE_ON; };
window.BD_setQuestGuide = function(on){ QUEST_GUIDE_ON = !!on; };
let lastDir = 'front';
let gameRaf;
window.__gameLoopToken = 0;   // (v178) gameLoop 중복 RAF 체인 방지용 토큰
let transitioning = false;

// ── 체력 시스템 ──
const HERO_MAX_HP = 100;
let heroHP = HERO_MAX_HP;

// (v233) 필드(heroHP)·성장/저장(BD.hp)·전투(HSR.hero.hp)의 HP를 한 값으로 동기화한다.
// 예전 코드는 세 값을 따로 갱신해 전투 진입/종료 시 체력이 달라지는 경우가 있었다.
function syncSharedHP(value, syncBattle) {
  const maxHp = (typeof getMaxHP === 'function') ? getMaxHP() : HERO_MAX_HP;
  const nextHp = Math.max(0, Math.min(maxHp, Number.isFinite(Number(value)) ? Number(value) : 0));
  heroHP = nextHp;
  try {
    if (window.BD) {
      const bdMax = Number.isFinite(Number(window.BD.maxHp)) ? Number(window.BD.maxHp) : maxHp;
      window.BD.hp = Math.max(0, Math.min(bdMax, nextHp));
    }
    if (syncBattle !== false && window.HSR && window.HSR.active && window.HSR.hero) {
      const battleMax = Number(window.HSR.hero.maxhp) || maxHp;
      window.HSR.hero.hp = Math.max(0, Math.min(battleMax, nextHp));
    }
  } catch(e){}
  return heroHP;
}
window.BD_syncHP = syncSharedHP;

// HP 피격 플래시 애니메이션
let _hpFlashTimer = 0;
const HP_FLASH_DURATION = 18; // frames

// ── 자동 회복 시스템 ──
// 피해 없이 10초 대기 → 이후 2초마다 5씩 회복 → 피해 시 즉시 중단
const REGEN_WAIT_MS  = 10000; // 피해 후 회복 시작까지 대기 시간 (10초)
const REGEN_TICK_MS  = 1000;  // 회복 간격 (1초마다)
const REGEN_AMOUNT   = 5;     // 회복량
let _lastDamageTime  = 0;     // 마지막 피해 시각 (Date.now()), 0=피해 없음
let _lastRegenTick   = 0;     // 마지막 회복 틱 시각

/** 피해를 받으면 체력을 깎는다. amount: 양수 */
function takeDamage(amount) {
  if (heroHP <= 0) return;
  // last_stand: HP 10% 이하 시 피해 감소
  if (heroHP / getMaxHP() <= 0.10) {
    amount = Math.round(amount * (1 - getLastStandReduction()));
  }
  syncSharedHP(heroHP - amount, false);
  _hpFlashTimer = HP_FLASH_DURATION;
  _lastDamageTime = Date.now();
  _lastRegenTick  = 0;
  // (v126) 첫 체력 저하 시 회복 방법 안내
  try { if (window.BD_tipHpCheck) window.BD_tipHpCheck(heroHP, getMaxHP()); } catch(e){}
  achieveTrack('damage', 1);
  if (heroHP <= 0) {
    setTimeout(showGameOver, 420);
  }
}
/** 체력을 회복한다. amount: 양수 */
function healHP(amount) {
  if (heroHP >= getMaxHP()) return;
  syncSharedHP(heroHP + amount, false);
  questProgress('regen', 1);
  achieveTrack('regen', 1);
}

// ────────────────────────────────────────────────────────
//  헬퍼: 둥근 사각형 패스
// ────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ────────────────────────────────────────────────────────
//  헬퍼: 심장 아이콘 패스
// ────────────────────────────────────────────────────────
function heartPath(ctx, cx, cy, size) {
  const s = size * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.3);
  ctx.bezierCurveTo(cx, cy - s * 0.5, cx - s, cy - s * 0.5, cx - s, cy);
  ctx.bezierCurveTo(cx - s, cy + s * 0.55, cx, cy + s * 0.9, cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx, cy + s * 0.9, cx + s, cy + s * 0.55, cx + s, cy);
  ctx.bezierCurveTo(cx + s, cy - s * 0.5, cx, cy - s * 0.5, cx, cy + s * 0.3);
  ctx.closePath();
}

// ────────────────────────────────────────────────────────
//  왼쪽 상단 판타지 체력 HUD
// ────────────────────────────────────────────────────────
function renderHP(ctx, canvas) {
  const sc = currentScale;
  ctx.save();

  // 피격 플래시 카운터 감소
  if (_hpFlashTimer > 0) _hpFlashTimer--;

  // ── 레이아웃 상수 ──────────────────────────────────
  const PAD     = 14 * sc;
  const ICON_R  = 10 * sc;   // 심장 반지름
  const BAR_W   = 158 * sc;
  const BAR_H   = 14 * sc;
  const CORNER  = 7  * sc;
  const GAP     = 3  * sc;   // 아이콘↔바 간격

  const panelX  = PAD;
  const panelY  = PAD;
  const panelW  = ICON_R * 2 + GAP + BAR_W + 16 * sc;
  const panelH  = Math.max(ICON_R * 2, BAR_H + 14 * sc) + 10 * sc;

  const iconCX  = panelX + 8 * sc + ICON_R;
  const iconCY  = panelY + panelH / 2;
  const barX    = iconCX + ICON_R + GAP + 4 * sc;
  const barY    = iconCY - BAR_H / 2;

  // ── 패널 배경 (다층 글라스모피즘 효과) ─────────────
  // 그림자 레이어
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur  = 18 * sc;
  ctx.shadowOffsetX = 2 * sc;
  ctx.shadowOffsetY = 3 * sc;

  // 패널 본체: 어두운 반투명 + 약간의 세피아 톤
  const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  panelGrad.addColorStop(0,   'rgba(18, 10, 3, 0.82)');
  panelGrad.addColorStop(1,   'rgba(10, 5, 1,  0.90)');
  ctx.fillStyle = panelGrad;
  roundRect(ctx, panelX, panelY, panelW, panelH, CORNER);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  // 내부 하이라이트 선 (상단)
  ctx.strokeStyle = 'rgba(255,220,120,0.12)';
  ctx.lineWidth = 1 * sc;
  roundRect(ctx, panelX + 1 * sc, panelY + 1 * sc, panelW - 2 * sc, panelH - 2 * sc, CORNER - 1 * sc);
  ctx.stroke();

  // 골드 외곽 테두리 (두 겹)
  const ratio = heroHP / getMaxHP();
  const flash = _hpFlashTimer > 0 ? (_hpFlashTimer / HP_FLASH_DURATION) : 0;
  const borderAlpha = 0.65 + flash * 0.35;
  const borderColor = flash > 0
    ? `rgba(255,80,80,${borderAlpha})`
    : `rgba(200,144,42,${borderAlpha})`;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = 1.5 * sc;
  roundRect(ctx, panelX, panelY, panelW, panelH, CORNER);
  ctx.stroke();

  // 피격 시 내부 빨간 글로우
  if (flash > 0) {
    ctx.shadowColor = `rgba(255,60,60,${flash * 0.6})`;
    ctx.shadowBlur  = 20 * sc;
    roundRect(ctx, panelX, panelY, panelW, panelH, CORNER);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── 심장 아이콘 ──────────────────────────────────────
  // 외곽 글로우
  const heartGlowColor = ratio > 0.5 ? 'rgba(220,60,80,0.45)'
                       : ratio > 0.25 ? 'rgba(255,160,30,0.5)'
                       : 'rgba(255,30,30,0.6)';
  ctx.shadowColor = heartGlowColor;
  ctx.shadowBlur  = (8 + flash * 14) * sc;
  const heartFill = ctx.createRadialGradient(iconCX, iconCY - ICON_R * 0.2, 0, iconCX, iconCY, ICON_R);
  if (ratio > 0.5) {
    heartFill.addColorStop(0, '#ff8fa0');
    heartFill.addColorStop(1, '#c8304a');
  } else if (ratio > 0.25) {
    heartFill.addColorStop(0, '#ffcc60');
    heartFill.addColorStop(1, '#c87020');
  } else {
    heartFill.addColorStop(0, '#ff6060');
    heartFill.addColorStop(1, '#990000');
  }
  ctx.fillStyle = heartFill;
  heartPath(ctx, iconCX, iconCY, ICON_R * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 심장 하이라이트
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  heartPath(ctx, iconCX - ICON_R * 0.15, iconCY - ICON_R * 0.2, ICON_R * 0.85);
  ctx.fill();

  // ── HP 수치 (심장 위에 작게) ──────────────────────────
  const numFontSz = Math.max(8, Math.round(9.5 * sc));
  ctx.font         = `700 ${numFontSz}px 'Noto Serif KR', serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#ffffff';
  ctx.shadowColor  = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur   = 3 * sc;
  ctx.fillText(`${heroHP}`, iconCX, iconCY);
  ctx.shadowBlur   = 0;

  // ── HP 바 영역 ────────────────────────────────────────
  // 라벨 (HP / 최대)
  const labelFontSz = Math.max(8, Math.round(8.5 * sc));
  ctx.font          = `700 ${labelFontSz}px 'Noto Serif KR', serif`;
  ctx.textAlign     = 'left';
  ctx.textBaseline  = 'top';
  ctx.fillStyle     = 'rgba(240,184,48,0.85)';
  ctx.fillText('❤ 체  력', barX, panelY + 5 * sc);

  ctx.textAlign    = 'right';
  ctx.fillStyle    = 'rgba(200,160,80,0.70)';
  ctx.fillText(`${heroHP} / ${getMaxHP()}`, barX + BAR_W, panelY + 5 * sc);

  // 트랙 배경
  const trackY = barY + 4 * sc;
  const trackH = BAR_H + 2 * sc;
  ctx.fillStyle = 'rgba(10,5,2,0.75)';
  roundRect(ctx, barX - 1 * sc, trackY - 1 * sc, BAR_W + 2 * sc, trackH + 2 * sc, 5 * sc);
  ctx.fill();

  // 내부 어두운 홈
  ctx.fillStyle = 'rgba(5,2,0,0.9)';
  roundRect(ctx, barX, trackY, BAR_W, trackH, 4 * sc);
  ctx.fill();

  // ── 연속 바 채우기 ───────────────────────────────────
  const fillW = Math.max(0, BAR_W * ratio);

  if (fillW > 0) {
    // HP 비율에 따라 색상 결정
    let c0, c1, glowColor;
    if (ratio > 0.6) {
      c0 = 'rgba(100,235,115,0.97)';
      c1 = 'rgba(18,155,55,0.97)';
      glowColor = 'rgba(60,220,80,0.55)';
    } else if (ratio > 0.35) {
      c0 = 'rgba(255,215,55,0.97)';
      c1 = 'rgba(200,125,15,0.97)';
      glowColor = 'rgba(255,200,30,0.55)';
    } else {
      c0 = 'rgba(255,85,65,0.97)';
      c1 = 'rgba(175,18,18,0.97)';
      glowColor = 'rgba(255,55,35,0.65)';
    }

    // 채우기 그라데이션 (상→하)
    const fg = ctx.createLinearGradient(barX, trackY, barX, trackY + trackH);
    fg.addColorStop(0,   c0);
    fg.addColorStop(0.5, c1);
    fg.addColorStop(1,   c1);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 9 * sc;
    ctx.fillStyle   = fg;
    roundRect(ctx, barX, trackY, fillW, trackH, 4 * sc);
    ctx.fill();
    ctx.shadowBlur  = 0;

    // 상단 하이라이트 (유리/광택)
    const hlGrad = ctx.createLinearGradient(barX, trackY, barX, trackY + trackH * 0.5);
    hlGrad.addColorStop(0, 'rgba(255,255,255,0.28)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = hlGrad;
    roundRect(ctx, barX, trackY, fillW, trackH * 0.48, 4 * sc);
    ctx.fill();

    // 수평 광택
    if (fillW > 8 * sc) {
      const shineGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
      shineGrad.addColorStop(0,    'rgba(255,255,255,0.00)');
      shineGrad.addColorStop(0.55, 'rgba(255,255,255,0.10)');
      shineGrad.addColorStop(0.85, 'rgba(255,255,255,0.04)');
      shineGrad.addColorStop(1,    'rgba(255,255,255,0.00)');
      ctx.fillStyle = shineGrad;
      roundRect(ctx, barX, trackY, fillW, trackH, 4 * sc);
      ctx.fill();
    }
  }

  // 트랙 외곽선
  ctx.strokeStyle = 'rgba(200,144,42,0.35)';
  ctx.lineWidth   = 1 * sc;
  roundRect(ctx, barX, trackY, BAR_W, trackH, 4 * sc);
  ctx.stroke();

  // ── HP 위험 경고 펄스 (25% 미만 → 체력바 패널 테두리) ──
  if (ratio < 0.25) {
    const pulse = 0.45 + 0.55 * Math.abs(Math.sin(Date.now() / 220));
    ctx.strokeStyle = `rgba(255,30,30,${pulse * 0.85})`;
    ctx.lineWidth   = 2.5 * sc;
    roundRect(ctx, panelX, panelY, panelW, panelH, CORNER);
    ctx.stroke();
  }

  // ── 안전도 EXP 바 (HP 패널 바로 아래) ──────────────────
  const EXP_GAP   = 5  * sc;   // HP 패널과의 간격
  const EXP_H     = 18 * sc;   // EXP 패널 높이
  const expPanelX = panelX;
  const expPanelY = panelY + panelH + EXP_GAP;
  const expPanelW = panelW;
  const expCorner = 5 * sc;
  // 추적 HUD가 EXP 바 아래에 오도록 하단 y좌표를 전역에 저장
  window.__bdExpBarBottom = expPanelY + EXP_H;
  window.__bdExpBarLeft = expPanelX;

  // EXP 패널 배경
  ctx.shadowColor   = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur    = 10 * sc;
  ctx.shadowOffsetY = 2 * sc;
  const expBg = ctx.createLinearGradient(expPanelX, expPanelY, expPanelX, expPanelY + EXP_H);
  expBg.addColorStop(0, 'rgba(8,16,36,0.88)');
  expBg.addColorStop(1, 'rgba(4,8,20,0.92)');
  ctx.fillStyle = expBg;
  roundRect(ctx, expPanelX, expPanelY, expPanelW, EXP_H, expCorner);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // 외곽선 (파란 골드 혼합)
  ctx.strokeStyle = 'rgba(80,140,255,0.40)';
  ctx.lineWidth   = 1 * sc;
  roundRect(ctx, expPanelX, expPanelY, expPanelW, EXP_H, expCorner);
  ctx.stroke();

  // 내부 여백
  const EP   = 3.5 * sc;                     // 내부 패딩
  const lblW = 42  * sc;                     // 왼쪽 레벨 텍스트 영역
  const barAreaX = expPanelX + EP + lblW;
  const barAreaW = expPanelW - EP * 2 - lblW - 38 * sc; // 오른쪽 XP 숫자 공간 확보
  const barAreaH = 6 * sc;
  const barAreaY = expPanelY + (EXP_H - barAreaH) / 2;

  // 레벨 텍스트
  const lvFontSz = Math.max(8, Math.round(8.5 * sc));
  ctx.font         = `700 ${lvFontSz}px 'Noto Serif KR', serif`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(100,160,255,0.85)';
  ctx.fillText(`🛡 Lv.${safetyLevel}`, expPanelX + EP, expPanelY + EXP_H / 2);

  // EXP 트랙 배경
  ctx.fillStyle = 'rgba(5,10,30,0.80)';
  roundRect(ctx, barAreaX, barAreaY, barAreaW, barAreaH, 3 * sc);
  ctx.fill();

  // EXP 채우기
  const xpRatio  = typeof safetyXP !== 'undefined' ? Math.min(1, safetyXP / safetyXP_MAX) : 0;
  const xpFillW  = barAreaW * xpRatio;
  if (xpFillW > 0) {
    const xpGrad = ctx.createLinearGradient(barAreaX, barAreaY, barAreaX, barAreaY + barAreaH);
    xpGrad.addColorStop(0, 'rgba(120,190,255,0.95)');
    xpGrad.addColorStop(1, 'rgba(40,100,220,0.95)');
    ctx.shadowColor = 'rgba(80,160,255,0.5)';
    ctx.shadowBlur  = 6 * sc;
    ctx.fillStyle   = xpGrad;
    roundRect(ctx, barAreaX, barAreaY, xpFillW, barAreaH, 3 * sc);
    ctx.fill();
    ctx.shadowBlur  = 0;
    // 상단 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(ctx, barAreaX, barAreaY, xpFillW, barAreaH * 0.5, 3 * sc);
    ctx.fill();
  }

  // 트랙 외곽선
  ctx.strokeStyle = 'rgba(80,140,255,0.28)';
  ctx.lineWidth   = 1 * sc;
  roundRect(ctx, barAreaX, barAreaY, barAreaW, barAreaH, 3 * sc);
  ctx.stroke();

  // EXP 텍스트 (현재/최대)
  const xpFontSz = Math.max(7, Math.round(7.5 * sc));
  ctx.font         = `700 ${xpFontSz}px 'Noto Serif KR', serif`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(100,160,255,0.70)';
  ctx.fillText(`${typeof safetyXP !== 'undefined' ? safetyXP : 0}/${safetyXP_MAX}`, expPanelX + expPanelW - EP, expPanelY + EXP_H / 2);

  // ── 메인 퀘스트 HUD (EXP 바 바로 아래) ──────────────────
  // 사서 도현의 퀘스트를 수락한 뒤(active/reward)부터 완료 대기까지 상시 표시
  // 단, 봉담 게임에서는 봉담 추적 HUD를 쓰므로 원본 데모 HUD는 그리지 않음 (겹침 방지)
  if (typeof quest_state !== 'undefined' &&
      typeof QUEST_DEF !== 'undefined' &&
      !(window.BD) &&
      (quest_state === 'active' || quest_state === 'reward')) {

    const objs      = QUEST_DEF.objectives || [];
    const MQ_GAP    = 6 * sc;                       // EXP 바와의 간격
    const MQ_PAD    = 6 * sc;                       // 내부 패딩
    const titleFsz  = Math.max(9,  Math.round(9.5 * sc));
    const objFsz    = Math.max(8,  Math.round(8.5 * sc));
    const lineH     = objFsz + 6 * sc;              // 목표 한 줄 높이
    const headH     = titleFsz + 8 * sc;            // "메인 퀘스트" 헤더 높이

    const mqX = expPanelX;
    const mqY = expPanelY + EXP_H + MQ_GAP;
    const mqW = expPanelW;
    const mqH = MQ_PAD + headH + objs.length * lineH + MQ_PAD * 0.5;
    const mqCorner = expCorner;

    // 배경 (금색 톤 — 메인 퀘스트 강조)
    ctx.shadowColor   = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur    = 10 * sc;
    ctx.shadowOffsetY = 2 * sc;
    const mqBg = ctx.createLinearGradient(mqX, mqY, mqX, mqY + mqH);
    mqBg.addColorStop(0, 'rgba(30,22,6,0.90)');
    mqBg.addColorStop(1, 'rgba(16,11,3,0.93)');
    ctx.fillStyle = mqBg;
    roundRect(ctx, mqX, mqY, mqW, mqH, mqCorner);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // 외곽선 (금색)
    ctx.strokeStyle = 'rgba(212,175,85,0.55)';
    ctx.lineWidth   = 1 * sc;
    roundRect(ctx, mqX, mqY, mqW, mqH, mqCorner);
    ctx.stroke();

    // 왼쪽 강조 바
    ctx.fillStyle = quest_state === 'reward' ? 'rgba(255,225,77,0.95)' : 'rgba(212,175,85,0.85)';
    roundRect(ctx, mqX, mqY + 3 * sc, 3 * sc, mqH - 6 * sc, 1.5 * sc);
    ctx.fill();

    let curY = mqY + MQ_PAD;

    // 헤더: 📜 메인 퀘스트 · 제목
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.font         = `800 ${titleFsz}px 'Noto Serif KR', serif`;
    ctx.fillStyle    = 'rgba(255,214,102,0.95)';
    const mqTx = mqX + MQ_PAD + 4 * sc;
    ctx.fillText(`📜 메인 퀘스트`, mqTx, curY);
    // 제목 (같은 줄 오른쪽 정렬 — 완료 대기 시 강조)
    ctx.textAlign = 'right';
    ctx.font      = `700 ${objFsz}px 'Noto Serif KR', serif`;
    ctx.fillStyle = quest_state === 'reward' ? 'rgba(255,235,150,0.95)' : 'rgba(224,196,140,0.85)';
    ctx.fillText(QUEST_DEF.title || '', mqX + mqW - MQ_PAD, curY + (titleFsz - objFsz) / 2);
    curY += headH;

    // 각 목표 줄
    ctx.textAlign    = 'left';
    ctx.font         = `600 ${objFsz}px 'Noto Serif KR', serif`;
    for (let i = 0; i < objs.length; i++) {
      const o    = objs[i];
      const done = o.cur >= o.target;
      // 체크 아이콘
      ctx.fillStyle = done ? 'rgba(120,220,120,0.95)' : 'rgba(212,175,85,0.85)';
      ctx.fillText(done ? '☑' : '▸', mqTx, curY);
      // 라벨
      ctx.fillStyle = done ? 'rgba(150,200,150,0.75)' : 'rgba(230,222,205,0.90)';
      ctx.fillText(o.label || '', mqTx + objFsz + 4 * sc, curY);
      // 진행도 (오른쪽)
      ctx.textAlign = 'right';
      ctx.fillStyle = done ? 'rgba(120,220,120,0.95)' : 'rgba(255,214,102,0.90)';
      ctx.fillText(`${o.cur}/${o.target}`, mqX + mqW - MQ_PAD, curY);
      ctx.textAlign = 'left';
      curY += lineH;
    }
  }

  ctx.restore();
}

// ── 화면 전체 위험 비네트 (25% 미만) ──────────────────────────────
function renderDangerVignette(ctx, canvas) {
  if (heroHP / getMaxHP() >= 0.25) return;

  const W = canvas.width, H = canvas.height;
  const pulse = 0.30 + 0.70 * Math.abs(Math.sin(Date.now() / 350));

  // 외곽 빨간 비네트 그라데이션
  const grad = ctx.createRadialGradient(W/2, H/2, H*0.28, W/2, H/2, H*0.85);
  grad.addColorStop(0,   'rgba(180,0,0,0.00)');
  grad.addColorStop(0.6, 'rgba(180,0,0,0.00)');
  grad.addColorStop(1,   `rgba(200,0,0,${pulse * 0.62})`);

  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 화면 모서리 강조
  const edge = 18 + pulse * 10;
  ctx.strokeStyle = `rgba(255,20,20,${pulse * 0.90})`;
  ctx.lineWidth   = edge;
  ctx.shadowColor = `rgba(255,0,0,${pulse * 0.7})`;
  ctx.shadowBlur  = 30;
  ctx.strokeRect(0, 0, W, H);
  ctx.shadowBlur  = 0;

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
// 전체 스케일 시스템:
//   맵/건물/캐릭터 모두 화면 크기에 비례해서 함께 커짐
//   기준 해상도 800×600 → 이 크기에서 캐릭터/맵이 딱 맞는 크기
//   화면이 1600×1200이면 모든 것이 2배로 커짐
// ─────────────────────────────────────────────────────────────────

// 기준 해상도 (이 크기에서 scale = 1.0)
const BASE_W = 800;
const BASE_H = 600;

// 기준 해상도에서의 캐릭터 픽셀 크기
// (v68) 플레이어 체격을 주민 NPC 기준으로 정합 — 계측: 플레이어 170px vs NPC 평균 266px(0.64배)로
//  주인공이 어린이 NPC보다도 작아 보이던 문제. 학생 NPC와 같은 눈높이가 되도록 1.45 → 2.20
const HERO_BASE_W = 52 * 2.20;
const HERO_BASE_H = 88 * 2.20;

// 충돌 계산용 히어로 월드 반경 (0~1 비율, 화면 크기와 무관)
const HERO_WR = 0.022;   // 원래 값 복원
const HERO_HR = 0.075;   // 원래 값 복원
const HERO_SPEED = 0.00150;  // (v43) 추가 하향 0.00190 -> 0.00150 (-21%) — 신맵 인도 스케일 기준
//  기준값 0.00115 대비 2.2배였던 것을 1.65배로. 더 느리게: 0.00165(1.44배) / 0.00145(1.26배)
//  되돌리려면 0.00253. 아래 WALK_FRAME_INTERVAL 도 함께 맞춰야 발걸음이 안 어긋난다.

// ── (v236-버그픽스 브랜치) 세로 이동 속도 보정 ──  (v237 병합에서 통합)
//  월드 좌표(heroX/heroY)는 가로·세로 모두 0~1 비율이지만,
//  화면으로 옮길 때의 환산 배율이 축마다 다르다.
//    가로 1.0 → BASE_W / VIEWPORT_W 픽셀   (800 / 0.348 ≈ 2300)
//    세로 1.0 → BASE_H / VIEWPORT_H 픽셀   (600 / 0.348 ≈ 1725)
//  그래서 같은 속도로 움직여도 가로가 800/600 = 약 1.33배 빨라 보였다.
//  세로 이동량에 아래 계수를 곱하면 화면상 체감 속도가 같아진다.
//  (원래 동작으로 되돌리려면 BD_MATCH_VERT_SPEED 를 false 로)
window.BD_MATCH_VERT_SPEED = (window.BD_MATCH_VERT_SPEED !== false);
function getVertSpeedK() {
  if (!window.BD_MATCH_VERT_SPEED) return 1;
  try {
    const kx = BASE_W / VIEWPORT_W;   // 가로 1.0당 화면 픽셀
    const ky = BASE_H / VIEWPORT_H;   // 세로 1.0당 화면 픽셀
    if (!isFinite(kx) || !isFinite(ky) || ky <= 0) return 1;
    return kx / ky;
  } catch (e) { return 1; }
}
// 세로 방향 실제 이동 속도
function getMoveSpeedY() { return getMoveSpeed() * getVertSpeedK(); }

// (v237.1) 순 이동 방향 — 반대 방향키(a+d, w+s)를 동시에 누르면 상쇄되어 0.
//          이동·애니메이션 판정 모두 이 값을 써서, 상쇄 시 걷기 대신 아이들 모션이 나온다.
function getNetMoveX() { return (moveKeys.d ? 1 : 0) - (moveKeys.a ? 1 : 0); }
function getNetMoveY() { return (moveKeys.s ? 1 : 0) - (moveKeys.w ? 1 : 0); }

// ── 대시 시스템 ──
// (개선) 이동속도를 낮추면서 대시만 그대로 두면 상대적으로 훨씬 튀어 보여서(원래 약 3.6배였는데 방치 시 약 7배가 됨),
// 원래 의도했던 "일반 속도의 약 3.6배" 비율을 새 이동속도 기준으로 다시 맞춤.
const DASH_SPEED    = 0.00683;   // (v236) 이동 속도 -25%에 맞춰 동일 비율 하향 (일반 이동의 약 3.6배 유지)
const DASH_DURATION = 10;      // 대시 지속 프레임 수
const DASH_COOLDOWN = 240;     // 쿨다운 프레임 (~4초 @60fps)
let isDashing       = false;
let dashTimer       = 0;
let dashCooldownTimer = 0;
let dashDirX        = 0;
let dashDirY        = 0;
// 도적 전용: 쿨타임 1회당 2번 사용 가능한 충전 시스템
let dashCharges     = 0;       // 현재 남은 충전 횟수 (도적 전용)

// 잔상(고스트) 트레일: [{x, y, dir, alpha}]
const DASH_GHOSTS     = [];
const DASH_GHOST_MAX  = 5;     // 최대 잔상 수
const DASH_GHOST_FADE = 0.18;  // 프레임당 알파 감소량

// 카메라 위치 (맵 비율 기준, 화면 중심이 가리키는 맵 좌표)
let camX = 0.5, camY = 0.8;

// 현재 화면 스케일 배율 (renderMap에서 매 프레임 갱신)
let currentScale = 1.0;

// 화면에 보이는 맵 비율 범위 (기준 해상도 기준으로 고정)
// (v203) 스테이지별 시야 배율 — 맵 아트마다 그려진 확대율이 달라 같은 카메라 값이면
//  인도·도로 폭이 맵마다 다르게 보인다. 배율↑ = 더 넓게 보임(줌아웃) = 인도가 작게 보임.
//  실시간 조정: Ctrl+Shift+] (넓게) / Ctrl+Shift+[ (좁게)
// (v207) 전역 줌: 카메라를 15% 가깝게 (모든 요소 1.15배)
const BD_GLOBAL_ZOOM = 0.88;   // (v74) 카메라를 더 멀리 — 맵이 넓게 보이도록 (1.15 → 0.88)
const VIEWPORT_BASE_W = 0.4000 / BD_GLOBAL_ZOOM;
const VIEWPORT_BASE_H = 0.4000 / BD_GLOBAL_ZOOM;
let VIEWPORT_W = VIEWPORT_BASE_W;
let VIEWPORT_H = VIEWPORT_BASE_H;
// (v204) 실측 보정값 — 각 맵 아트의 '도로 위 횡단보도 줄무늬 두께'를 픽셀 분석해
//  수영리(5)를 기준(1.00)으로 정규화한 값. 값↑ = 더 넓게 보임(줌아웃).
//   광장(1) 17px → 1.89 (유일하게 크게 어긋남)   와우리(2) 9px → 1.00
//   상리(3) 10px → 1.11   동화리(4) 10px → 1.11   수영리(5) 9px → 1.00 (기준)
//  실시간 조정: Ctrl+Shift+] 넓게 / Ctrl+Shift+[ 좁게
window.BD_VIEW_SCALE = { 1: 1.89, 2: 1.00, 3: 1.11, 4: 1.11, 5: 1.00 };
function BD_applyViewScale(){
  const s = (window.BD_VIEW_SCALE && window.BD_VIEW_SCALE[currentStage]) || 1;
  VIEWPORT_W = VIEWPORT_BASE_W * s;
  VIEWPORT_H = VIEWPORT_BASE_H * s;
  // (v206) 전 맵 캐릭터를 '광장 룩'으로 통일 — 카메라가 멀리 있는 느낌.
  //  BD_CHAR_ZOOM: 화면상 캐릭터 크기 공통 배율 (광장 기준 1/1.89 ≈ 0.53)
  //  BD_SPR: 고정 픽셀 스프라이트(히어로·임현지·정도현·몹·허수아비)용 — 모든 맵 동일
  //  BD_RES: 월드 단위 스프라이트(주민 등)용 — 시야 배율을 곱해 화면 크기를 동일하게
  // (v216) 실내 맵은 아트의 미터당 픽셀이 커서(문 폭 ≈ 이미지 75px) 캐릭터가 왜소해 보인다.
  //  실내 스테이지에만 캐릭터 확대 배율을 곱해 가구·문과 비율을 맞춘다.
  const cs = (window.BD_CHAR_STAGE_SCALE && window.BD_CHAR_STAGE_SCALE[currentStage]) || 1;
  window.BD_SPR = window.BD_CHAR_ZOOM * cs;
  // 주민(월드 단위)은 뷰포트 축소로 이미 전역 줌이 반영되므로 CHAR_ZOOM에서 전역 줌을 제외
  window.BD_RES = s * (window.BD_CHAR_ZOOM / BD_GLOBAL_ZOOM) * cs;
}
// 실내(도서관 1층·문화의집 3층) 캐릭터 확대 — 3층 맵 이미지의 문·가구 크기 실측 기반
window.BD_CHAR_STAGE_SCALE = { 101: 1.50 };   // (v229) 새 맵 문폭 실측 기준
// 고정픽셀 캐릭터는 뷰포트 축소의 영향을 받지 않으므로 전역 줌을 직접 곱한다
window.BD_CHAR_ZOOM = (1 / 1.89) * 1.15;
window.BD_SPR = window.BD_CHAR_ZOOM;
window.BD_RES = window.BD_CHAR_ZOOM / 1.15;

/* ── 스케일 계산: 화면 크기에 비례 ── */
// (v281d) 브라우저 확대/축소(Ctrl +/-) 추종 —
//  기존에는 캔버스 백버퍼가 devicePixelRatio 로 줌을 자동 상쇄해서, 페이지를 확대해도
//  대화창·HUD(DOM)만 커지고 게임 세계(맵·캐릭터)는 물리 크기가 고정돼 어색했다.
//  로드 시점의 DPR을 기준으로 잡고 이후 변화 비율을 스케일에 곱해,
//  확대하면 캐릭터·맵이 함께 커지고 축소하면 작아지며 맵이 넓게 보이게 한다.
let __BD_DPR_REF = null;
function computeScale(canvas) {
  // 화면 크기 / 기준 크기 → 두 축 중 작은 쪽으로 통일 (비율 유지)
  const sx = canvas.width  / BASE_W;
  const sy = canvas.height / BASE_H;
  let s = Math.min(sx, sy);
  try {
    const dpr = window.devicePixelRatio || 1;
    if (__BD_DPR_REF == null) __BD_DPR_REF = dpr;
    // 0.5~3배로 제한 — 극단적인 줌에서 게임이 깨져 보이지 않게
    s *= Math.max(0.5, Math.min(3, dpr / __BD_DPR_REF));
  } catch (e) { }
  return s;
}

/* ── 카메라 → 스크린 좌표 변환 ── */
// 스케일이 적용된 좌표계: 기준 해상도 기준으로 계산 후 scale 곱하기
function toScreenX(mapRatioX, canvas) {
  // 기준 해상도에서의 스크린 X
  const baseScreenX = ((mapRatioX - camX) / VIEWPORT_W + 0.5) * BASE_W;
  // 실제 화면 좌표: 스케일 적용 (화면 중심 기준)
  return (baseScreenX - BASE_W / 2) * currentScale + canvas.width  / 2;
}
function toScreenY(mapRatioY, canvas) {
  const baseScreenY = ((mapRatioY - camY) / VIEWPORT_H + 0.5) * BASE_H;
  return (baseScreenY - BASE_H / 2) * currentScale + canvas.height / 2;
}
// 맵 비율 크기 → 스크린 픽셀 크기 (스케일 적용)
function toScreenW(rw, canvas) { return (rw / VIEWPORT_W) * BASE_W * currentScale; }
function toScreenH(rh, canvas) { return (rh / VIEWPORT_H) * BASE_H * currentScale; }

/* ── 충돌 (월드 비율 AABB) ── */
function _collidesAt(nx, ny) {
  const stage = STAGES[currentStage];
  const fw = HERO_WR * 0.4;
  const fh = HERO_HR * 0.12;
  const hL = nx - fw, hR = nx + fw;
  const hT = ny - fh, hB = ny + fh * 0.2;
  // (v202) 맵 오브젝트 충돌 전면 해제 — 새 맵 에셋에 맞춰 콜라이더를 다시 잡을 예정.
  //  다시 켜려면: window.BD_MAP_COLLISION = true  (또는 Ctrl+Shift+B 토글)
  //  콜라이더 데이터(cx/cy/cw/ch)는 그대로 보존되므로 플래그만 켜면 즉시 복구된다.
  if (window.BD_MAP_COLLISION || (stage && stage.collision)) for (const obj of stage.objects) {
    if (!obj || obj.hidden || obj._purified) continue;
    // (v66) 최종 보스는 개방 전까지 완전 비활성 — 안 보이는데 길만 막던 문제 (스프라이트·근접은 기존 잠금 처리)
    if (obj.isBoss && typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(obj)) continue;
    // (v51) 규칙 통일 — 커스텀 콜라이더(cx/cy/cw/ch)가 있으면 '어떤 타입이든'(위험요소·장식 포함) 충돌하고,
    //  콜라이더가 없으면 기존 화이트리스트 타입만 본체 사각형으로 충돌한다.
    //  (기존: hazard·decoration은 콜라이더를 만들어도 검사 대상에서 빠져 통과되던 문제 / building만 콜라이더 사용)
    const hasC = obj.cx !== undefined && obj.cy !== undefined && obj.cw !== undefined && obj.ch !== undefined;
    const typed = obj.type === 'building' || obj.type === 'wall' || obj.type === 'shelf' || obj.type === 'desk' || obj.type === 'platform' || obj.type === 'seats' || obj.type === 'piano' || obj.type === 'room';
    if (!hasC && !typed) continue;
    const oL = hasC ? obj.cx : obj.rx;
    const oT = hasC ? obj.cy : obj.ry;
    const oW = hasC ? obj.cw : obj.rw;
    const oH = hasC ? obj.ch : obj.rh;
    if (hR > oL && hL < oL + oW && hB > oT && hT < oT + oH) return true;
  }
  // NPC (임현지) 솔리드 충돌
  if (window.BD_MAP_COLLISION && currentStage === NPC_STAGE) {
    const r = 0.018;
    if (hR > NPC_X - r && hL < NPC_X + r && hB > NPC_Y - r && hT < NPC_Y + r) return true;
  }
  // 퀘스트 NPC (사서 도현) 솔리드 충돌
  if (window.BD_MAP_COLLISION && currentStage === QNPC_STAGE) {
    const r = 0.018;
    if (hR > QNPC_X - r && hL < QNPC_X + r && hB > QNPC_Y - r && hT < QNPC_Y + r) return true;
  }
  return false;
}

function tryMove(dx, dy) {
  // (v53) 대화창이 떠 있는 동안에는 이동 금지 — 대사 진행 중 캐릭터가 움직이는 문제
  try{
    var __db = document.getElementById('dialogue-box');
    if (__db && __db.offsetHeight && getComputedStyle(document.getElementById('dialogue-overlay')).display !== 'none'){
      // (v71) 왜 안 움직이는지 알 수 있게 안내 — "이동이 안 된다"는 혼란의 상당수가 이 상태였다
      try{ if (window.BD_moveBlockedHint) BD_moveBlockedHint(); }catch(eH){}
      return;
    }
  }catch(eDlg){}
  // X축, Y축을 분리해서 충돌 검사 → 벽 끝에서도 다른 축 이동 가능
  // (v267) 스테이지별 이동 가능 구역(walk: {x0,y0,x1,y1}) — 에디터에서 조절, 기본 0.01~0.99
  const _wk = (STAGES[currentStage] && STAGES[currentStage].walk) || null;
  const _wx0 = _wk && isFinite(_wk.x0) ? _wk.x0 : 0.01;
  const _wy0 = _wk && isFinite(_wk.y0) ? _wk.y0 : 0.01;
  const _wx1 = _wk && isFinite(_wk.x1) ? _wk.x1 : 0.99;
  const _wy1 = _wk && isFinite(_wk.y1) ? _wk.y1 : 0.99;
  const nx = Math.max(_wx0, Math.min(_wx1, heroX + dx));
  const ny = Math.max(_wy0, Math.min(_wy1, heroY + dy));

  const canX = !_collidesAt(nx, heroY);
  const canY = !_collidesAt(heroX, ny);

  if (canX) heroX = nx;
  if (canY) heroY = ny;
  // 퀘스트 걸음수 카운팅
  _countStep(dx, dy);
  // 업적 걸음수 카운팅
  achieveTrack('walk', Math.sqrt(dx*dx+dy*dy) * 10000 | 0 || 1);
}

/* ── 카메라 업데이트 (부드럽게 추적) ── */
// (v205) 캔버스에 실제로 보이는 월드 반폭 — 클램프를 이 값으로 해야 맵 밖(검은 영역)이 안 보인다
function BD_visibleHalf(){
  const cv = document.getElementById('game-canvas');
  if (!cv || !currentScale) return { hw: VIEWPORT_W / 2, hh: VIEWPORT_H / 2 };
  return {
    hw: VIEWPORT_W * cv.width  / (2 * currentScale * BASE_W),
    hh: VIEWPORT_H * cv.height / (2 * currentScale * BASE_H),
  };
}
function updateCamera() {
  // 맵 경계 안에서 카메라 제한 (v205: 실제 가시 반폭 기준, 시야가 맵보다 넓으면 중앙 고정)
  const v = BD_visibleHalf();
  const minCX = Math.min(0.5, v.hw), maxCX = Math.max(0.5, 1 - v.hw);
  const minCY = Math.min(0.5, v.hh), maxCY = Math.max(0.5, 1 - v.hh);

  /* (v290) __bdCamPan 설정 시 잠깐 카메라 팬 — 만료 후 lerp로 자연 복귀 */
  var __pan = window.__bdCamPan, __px = heroX, __py = heroY;
  if (__pan){
    if (Date.now() < __pan.until){ __px = __pan.x; __py = __pan.y; }
    else window.__bdCamPan = null;
  }
  const targetX = Math.max(minCX, Math.min(maxCX, __px));
  const targetY = Math.max(minCY, Math.min(maxCY, __py));

  // 부드러운 lerp
  camX += (targetX - camX) * 0.15;
  camY += (targetY - camY) * 0.15;
  // lerp 중에도 경계 밖이 노출되지 않게 하드 클램프
  camX = Math.max(minCX, Math.min(maxCX, camX));
  camY = Math.max(minCY, Math.min(maxCY, camY));
  // 정수 확대된 신규 맵에서는 카메라도 논리 픽셀 격자에 맞춰 이동 중 흔들림을 막는다.
  if (STAGES[currentStage] && STAGES[currentStage].__conceptMap && typeof window.BD_snapConceptPixelCamera === 'function') {
    window.BD_snapConceptPixelCamera();
  }
}

/* ── 맵 전환 체크 ── */
function checkExits() {
  if (transitioning) return;
  // (v220) 전투 종료 직후 잠깐 출구 잠금 — 출구 근처 위험요소를 정화하자마자
  //  의도치 않게 옆 지역으로 빨려 들어가는 것을 방지
  if (window.__bdExitLockUntil && Date.now() < window.__bdExitLockUntil) return;
  // 전투 중·대화/선택창 표시 중에는 출구 판정 금지 (출구 위에서 조사·전투해도 안 끌려감)
  if (window.HSR && HSR.active) return;
  try { if (typeof BD_isInputBlocked === 'function' && BD_isInputBlocked()) return; } catch(e){}
  const stage = STAGES[currentStage];
  const margin = 0.03;

  let nextStage = null, entryX = 0.5, entryY = 0.5;

  // (v267) 통과 밴드(이동 가능 구간)를 4방향 모두 에디터에서 조절 가능 (기본 0.3~0.7)
  const _band = function (ex) {
    return [
      (ex.bandMin !== undefined) ? ex.bandMin : 0.3,
      (ex.bandMax !== undefined) ? ex.bandMax : 0.7
    ];
  };
  if (heroY < margin && stage.exits.top && stage.exits.top.active) {
    const tb = _band(stage.exits.top);
    if (heroX > tb[0] && heroX < tb[1]) {
      nextStage = stage.exits.top.nextStage;
      entryX = stage.exits.top.entryX; entryY = stage.exits.top.entryY;
    }
  } else if (heroY > 1 - margin && stage.exits.bottom && stage.exits.bottom.active) {
    const bb = _band(stage.exits.bottom);
    if (heroX > bb[0] && heroX < bb[1]) {
      nextStage = stage.exits.bottom.nextStage;
      entryX = stage.exits.bottom.entryX; entryY = stage.exits.bottom.entryY;
    }
  } else if (heroX < margin && stage.exits.left && stage.exits.left.active) {
    const lb = _band(stage.exits.left);
    if (heroY > lb[0] && heroY < lb[1]) {
      nextStage = stage.exits.left.nextStage;
      entryX = stage.exits.left.entryX; entryY = stage.exits.left.entryY;
    }
  } else if (heroX > 1 - margin && stage.exits.right && stage.exits.right.active) {
    // (v209) 출구 통과 밴드를 커스텀 가능 (기본 0.3~0.7) — 문화의집 3층 계단은 상단에 있음
    const rb0 = (stage.exits.right.bandMin !== undefined) ? stage.exits.right.bandMin : 0.3;
    const rb1 = (stage.exits.right.bandMax !== undefined) ? stage.exits.right.bandMax : 0.7;
    if (heroY > rb0 && heroY < rb1) {
      nextStage = stage.exits.right.nextStage;
      entryX = stage.exits.right.entryX; entryY = stage.exits.right.entryY;
    }
  }

  if (nextStage && STAGES[nextStage]) {
    // (v272) 기획서 §8·§9.4 — 잠긴 권역으로 도보 우회 진입 차단 (담이 안내)
    try {
      if (window.BD_REGISTRY && window.BD_Bus) {
        var __R = BD_REGISTRY.REGION_DEFINITIONS, __tr = null, __k;
        for (__k in __R) { if (__R[__k].stageIds.some(function (s) { return String(s) === String(nextStage); })) { __tr = __R[__k]; break; } }
        if (__tr && !BD_Bus.isUnlocked(__tr.id)) {
          if (!window.__bdLockExitMsgAt || Date.now() - window.__bdLockExitMsgAt > 4000) {
            window.__bdLockExitMsgAt = Date.now();
            try { if (window.BD_DAMI) BD_DAMI.show(__tr.displayName + '에 가려면 먼저 현재 지역 목표를 완료하고 버스를 타야 해요.', { face: 'worry' }); } catch (eD) { }
          }
          return;
        }
      }
    } catch (eLk) { }
    transitioning = true;
    moveKeys = {w:false, a:false, s:false, d:false};
    isDashing = false; dashTimer = 0; dashCooldownTimer = 0; dashCharges = 0; DASH_GHOSTS.length = 0;
    // 맵 전환 시 상점이 열려 있으면 닫기
    if (shopOpen) closeShop();

    const overlay = document.getElementById('map-transition-overlay');
    overlay.classList.add('fade');
    setTimeout(() => {
      currentStage = nextStage;
      heroX = entryX;
      heroY = entryY;
      camX = entryX; camY = entryY;
      _spawnMobsForStage(currentStage);
      { var _gsl = document.getElementById('gs-loc'); if (_gsl) _gsl.textContent = STAGES[currentStage].name; } // (v390) gs-* 스팬 제거 대응
      overlay.classList.remove('fade');
      if (typeof autoSave === 'function') autoSave('이동');
      // 새 맵에서 exit 재트리거 방지: 충분히 늦게 해제
      setTimeout(() => { transitioning = false; }, 800);
    }, 400);
  }
}

/* ── 도서관 실내 배경/가구 그리기 ── */
function drawLibraryInterior(ctx, stage, x, y, w, h) {
  const culture = stage && stage.floorTheme === 'culture';
  // 바닥
  const fg = ctx.createLinearGradient(x, y, x, y + h);
  if (culture) { fg.addColorStop(0, '#9a7a4c'); fg.addColorStop(1, '#7c5e36'); }
  else         { fg.addColorStop(0, '#7a5a38'); fg.addColorStop(1, '#5e4329'); }
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, w, h);
  // 바닥 널판 무늬 (가로줄)
  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.lineWidth = Math.max(1, h / 220);
  const planks = 14;
  for (let i = 1; i < planks; i++) {
    const py = y + (h / planks) * i;
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py); ctx.stroke();
  }
  // 벽 (위/좌/우 가장자리)
  const wallT = h * 0.06;
  ctx.fillStyle = culture ? '#43321f' : '#3a2a1a';
  ctx.fillRect(x, y, w, wallT);
  ctx.fillRect(x, y, wallT * 0.5, h);
  ctx.fillRect(x + w - wallT * 0.5, y, wallT * 0.5, h);
  // 카펫(중앙 통로)
  ctx.fillStyle = culture ? 'rgba(60, 60, 120, 0.30)' : 'rgba(140, 40, 40, 0.35)';
  ctx.fillRect(x + w * 0.45, y + h * 0.08, w * 0.10, h * 0.78);

  if (culture) {
    // 위쪽 벽 현판
    ctx.fillStyle = '#caa15a';
    const sgw = w * 0.36, sgh = h * 0.035;
    ctx.fillRect(x + w/2 - sgw/2, y + h*0.012, sgw, sgh);
    ctx.fillStyle = '#3a230f';
    ctx.font = `bold ${Math.round(sgh*0.8)}px 'Noto Serif KR', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('문화의 집', x + w/2, y + h*0.012 + sgh/2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  } else {
    // 1층: 아래쪽 출입문 (광장으로)
    const doorW = w * 0.16, doorH = h * 0.05;
    const doorX = x + w * 0.46 - doorW / 2;
    const doorY = y + h - doorH;
    ctx.fillStyle = '#caa15a';
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.strokeStyle = '#5a3d18';
    ctx.lineWidth = Math.max(1.5, h / 240);
    ctx.strokeRect(doorX, doorY, doorW, doorH);
    ctx.fillStyle = '#8a6428';
    ctx.fillRect(doorX + doorW / 2 - 1, doorY, 2, doorH);
  }
}

/* ── 계단 ── */
function drawStair(ctx, x, y, w, h, dir, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 2, y + h - 3, w, 5);
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const shade = 90 + i * 22;
    ctx.fillStyle = `rgb(${shade},${shade-30},${shade-60})`;
    const stepH = h / steps;
    const sy = (dir === 'down') ? (y + h - (i + 1) * stepH) : (y + i * stepH);
    // 위로 올라갈수록 좁아지는 원근감
    const inset = (dir === 'down' ? (steps - 1 - i) : i) * (w * 0.06);
    ctx.fillRect(x + inset, sy, w - inset * 2, stepH - 1);
  }
  ctx.strokeStyle = '#2e2012';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  // 방향 화살표
  ctx.fillStyle = '#ffe08a';
  const ax = x + w / 2, ay = y + h / 2, as = Math.min(w, h) * 0.18;
  ctx.beginPath();
  if (dir === 'down') {
    ctx.moveTo(ax, ay + as); ctx.lineTo(ax - as, ay - as); ctx.lineTo(ax + as, ay - as);
  } else {
    ctx.moveTo(ax, ay - as); ctx.lineTo(ax - as, ay + as); ctx.lineTo(ax + as, ay + as);
  }
  ctx.closePath(); ctx.fill();
  // 라벨
  if (label) {
    const fs = Math.max(9, h * 0.16);
    ctx.font = `bold ${Math.round(fs)}px 'Noto Serif KR', sans-serif`;
    const tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = 'rgba(20,12,4,0.85)';
    ctx.fillRect(ax - tw/2, y - fs - 6, tw, fs + 5);
    ctx.fillStyle = '#ffe08a';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, ax, y - fs/2 - 3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}

/* ── 무대 ── */
function drawPlatform(ctx, x, y, w, h, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 3, y + h - 4, w, 7);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#8a5e30'); g.addColorStop(1, '#6b4622');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // 마룻결
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) { const lx = x + (w/8)*i; ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y+h); ctx.stroke(); }
  ctx.strokeStyle = '#3a230f'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  // 뒤쪽 커튼
  ctx.fillStyle = 'rgba(150,30,40,0.55)';
  ctx.fillRect(x, y, w, h * 0.14);
  if (label) {
    ctx.fillStyle = '#fdf3df';
    ctx.font = `bold ${Math.round(h*0.12)}px 'Noto Serif KR', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w/2, y + h*0.55);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}

/* ── 관객석 (의자 줄) ── */
function drawSeats(ctx, x, y, w, h) {
  const cols = Math.max(5, Math.floor(w / 22));
  const rows = 2;
  const cw = w / cols, ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sx = x + c * cw + cw * 0.12;
      const sy = y + r * ch + ch * 0.12;
      const sw = cw * 0.76, sh = ch * 0.76;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(sx + 1, sy + sh - 2, sw, 3);
      ctx.fillStyle = '#3b5e8c';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = '#2c486b';
      ctx.fillRect(sx, sy, sw, sh * 0.3); // 등받이
    }
  }
}

/* ── 피아노 ── */
function drawPiano(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(x + 2, y + h - 3, w, 5);
  ctx.fillStyle = '#15151a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
  // 건반
  const keyY = y + h * 0.62, keyH = h * 0.3;
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(x + w*0.06, keyY, w*0.88, keyH);
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
  const keys = 12;
  for (let i = 1; i < keys; i++) { const kx = x + w*0.06 + (w*0.88/keys)*i; ctx.beginPath(); ctx.moveTo(kx, keyY); ctx.lineTo(kx, keyY+keyH); ctx.stroke(); }
}

/* ── (v199) 실내 '방' 블록: 문화의집 3층 도면용 — 채움+테두리+라벨(줄바꿈 지원) ── */
function drawRoomBlock(ctx, x, y, w, h, label){
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + 3, y + h - 4, w, 6);
  ctx.fillStyle = '#efe6d4';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(180,150,95,0.22)';
  ctx.fillRect(x, y, w, Math.min(h, 10));
  ctx.strokeStyle = '#7a6a4f'; ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  if (label){
    const fs = Math.max(10, Math.min(15, w * 0.085));
    ctx.font = '700 ' + fs + "px 'Noto Serif KR', serif";
    ctx.fillStyle = '#3d3020';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const parts = String(label).split('\n');
    const lh = fs * 1.25;
    const cy0 = y + h/2 - (parts.length - 1) * lh / 2;
    parts.forEach(function(p, i){ ctx.fillText(p, x + w/2, cy0 + i * lh, w - 8); });
  }
  ctx.restore();
}

/* ── 실내 계단 근처 여부 ── */
function getNearStair() {
  const stage = STAGES[currentStage];
  if (!stage || !stage.interior) return null;
  for (const o of stage.objects) {
    if (o.type !== 'stair') continue;
    const cx = o.rx + o.rw / 2;
    if (Math.abs(heroX - cx) < o.rw * 0.6 + 0.05 && heroY > o.ry - 0.04 && heroY < o.ry + o.rh + 0.12) return o;
  }
  return null;
}

/* ── 도서관 1층 출입문 근처 여부 (광장 문) ── */
function isNearLibraryDoor() {
  if (currentStage !== LIBRARY_STAGE) return false;
  return heroX > 0.32 && heroX < 0.60 && heroY > 0.74;
}

/* ── 페이드 전환 (범용) ── */
function fadeToStage(toStage, ex, ey, settle) {
  var __fromStage = (typeof currentStage !== 'undefined') ? currentStage : null;   // (v271) 각성 훅용

  if (transitioning) return;
  transitioning = true;
  moveKeys = {w:false, a:false, s:false, d:false};
  isDashing = false; dashTimer = 0; dashCooldownTimer = 0; dashCharges = 0; DASH_GHOSTS.length = 0;
  if (typeof shopOpen !== 'undefined' && shopOpen) closeShop();
  const overlay = document.getElementById('map-transition-overlay');
  overlay.classList.add('fade');
  setTimeout(() => {
    currentStage = toStage;
    heroX = ex; heroY = ey; camX = ex; camY = ey;
    _spawnMobsForStage(currentStage);
    { var _gsl2 = document.getElementById('gs-loc'); if (_gsl2) _gsl2.textContent = STAGES[toStage].name; } // (v390)
    // (v126) 첫 지역 이동 시 길찾기 안내 (실내 제외)
    try {
      if (STAGES[toStage] && !STAGES[toStage].interior && window.BD_tip) {
        window.BD_tip('first_travel', { toast:true, text:'🧭 새 동네 도착! 미니맵의 붉은 점이 위험요소예요. 자유롭게 돌아다니며 F 키로 조사해 보세요' });
      }
    } catch(e){}
    overlay.classList.remove('fade');
    // (v271) 기획서 §7.5 — 건물 밖 첫 이동 완료 0.8초 뒤 담이 첫 각성 (1회)
    try {
      if (String(__fromStage) === '101' && String(currentStage) !== '101' &&
          window.BD_PROGRESS && !BD_PROGRESS.story.badgeAwakened) {
        BD_PROGRESS.story.badgeAwakened = true;
        BD_PROGRESS.story.storyPhase = 'outside_awakened';
        setTimeout(function () {
          try { if (typeof window.BD_damiOpening === 'function') window.BD_damiOpening(true); } catch (e) { }
        }, 800);
        try { if (typeof autoSave === 'function') autoSave('담이 각성'); } catch (e) { }
      }
    } catch (eAw) { }
    if (typeof autoSave === 'function') autoSave('이동');
    setTimeout(() => { transitioning = false; }, settle || 600);
  }, 400);
}

/* ── (v228) 문화의집 입장 (광장 → 3층 엘리베이터 앞) ──
   구버전 1층 실내 맵은 삭제됨 — 건물에 들어가면 바로 3층 문화의집,
   프롤로그와 동일하게 엘리베이터 앞에서 시작한다. */
function enterLibrary() {
  // (v271) 기획서 §3.2·§7.6 — 복합 건물: 도서관 안내 / 3층 문화의집 입장 선택
  try {
    var old = document.getElementById('bd-complex-entrance'); if (old) old.remove();
    var wrap = document.createElement('div');
    wrap.id = 'bd-complex-entrance';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;background:rgba(10,8,4,0.55);';
    wrap.innerHTML =
      '<div style="max-width:360px;width:86%;background:#1d1408;border:2px solid #b8862f;border-radius:14px;padding:18px 20px;color:#f3e6c8;box-shadow:0 10px 40px rgba(0,0,0,.6);">' +
      '<div style="font-size:17px;font-weight:800;margin-bottom:4px;">봉담와우도서관 · 봉담청소년문화의집</div>' +
      '<div style="font-size:12px;color:#caa96a;margin-bottom:12px;">1~2층은 도서관, 3층은 청소년문화의집이에요.</div>' +
      '<button data-act="lib" style="display:block;width:100%;margin:6px 0;background:#3a2c12;color:#f3e6c8;border:1px solid #b8862f;border-radius:9px;padding:10px;font-size:14px;cursor:pointer;">📚 봉담와우도서관 안내 보기</button>' +
      '<button data-act="youth" style="display:block;width:100%;margin:6px 0;background:#b8862f;color:#1d1408;border:0;border-radius:9px;padding:10px;font-weight:800;font-size:14px;cursor:pointer;">🏢 3층 청소년문화의집 입장</button>' +
      '<button data-act="close" style="display:block;width:100%;margin:6px 0 0;background:transparent;color:#9b8657;border:0;padding:6px;font-size:12px;cursor:pointer;">닫기</button>' +
      '</div>';
    document.body.appendChild(wrap);
    var close = function () { try { wrap.remove(); } catch (e) { } };
    wrap.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (e.target === wrap || act === 'close') { close(); return; }
      if (act === 'lib') { close(); try { window.BD_showPlaceCard && BD_showPlaceCard('facility_wawoo_library', { firstDiscover: true }); } catch (e2) { } return; }
      if (act === 'youth') { close(); const st = STAGES[101]; fadeToStage(101, st.spawnX, st.spawnY, 600); return; }
    });
    return;
  } catch (e) { }
  const st = STAGES[101];
  fadeToStage(101, st.spawnX, st.spawnY, 600);
}

/* ── 도서관 퇴장 (1층 → 광장) ── */
function exitLibrary() {
  // (v236) 스테이지 100(구버전 도서관 1층)은 v228에서 삭제됨.
  //  STAGES[100] 이 없으면 참조 시 예외가 나므로 광장 문화의집 앞으로 폴백한다.
  const st = STAGES[LIBRARY_STAGE];
  const ex = st && st.exits && st.exits.bottom;
  if (ex) fadeToStage(ex.nextStage, ex.entryX, ex.entryY, 800);
  else    { /* (v395) 구 광장(stage 1) 폴백 제거 — 212 준비 대기 후 이동 */
      var __w95=setInterval(function(){ try{ if(STAGES[212]&&STAGES[212].__districtWorldV24){ clearInterval(__w95); fadeToStage(212,0.216,0.336,700);} }catch(e){} },300);
      setTimeout(function(){ try{ clearInterval(__w95); }catch(e){} },20000); }
}

/* ── 책장 한 칸 ── */
function drawBookshelf(ctx, x, y, w, h) {
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 2, y + h - 3, w, 5);
  // 나무 프레임
  ctx.fillStyle = '#5b3a1c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a230f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  // 선반 2단 + 책
  const rows = 2;
  const cols = Math.max(6, Math.floor(w / 14));
  const palette = ['#b94b4b','#c9913b','#3e8e6b','#3b6bb9','#8a4bb9','#bb7f3a','#4f9bb0'];
  for (let r = 0; r < rows; r++) {
    const rowY = y + h * (0.12 + r * 0.46);
    const rowH = h * 0.34;
    for (let c = 0; c < cols; c++) {
      const bw = w / cols;
      const bx = x + c * bw + 1;
      const bh = rowH * (0.7 + (Math.sin((c + r * 3) * 1.7) + 1) * 0.15);
      ctx.fillStyle = palette[(c + r) % palette.length];
      ctx.fillRect(bx, rowY + (rowH - bh), Math.max(2, bw - 2), bh);
    }
    // 선반 판자
    ctx.fillStyle = '#3a230f';
    ctx.fillRect(x, rowY + rowH, w, Math.max(2, h * 0.04));
  }
}

/* ── 안내 데스크 ── */
function drawDesk(ctx, x, y, w, h, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x + 2, y + h - 3, w, 5);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#8a5a2c');
  g.addColorStop(1, '#6b4420');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a230f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#caa15a';
  ctx.fillRect(x + 3, y + 3, w - 6, h * 0.25);
  if (label) {
    ctx.fillStyle = '#fdf3df';
    ctx.font = `bold ${Math.round(h * 0.4)}px 'Noto Serif KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h * 0.62);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

/* ── 도서관 실내 출입문 근처 여부 ── */
/* (계단/문/전환 함수는 위쪽에 통합 정의됨) */

/* ── 렌더링 ── */
function renderMap(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const stage = STAGES[currentStage];

  // 먼저 스케일 계산 (toScreenX/Y/W/H에서 사용됨)
  BD_applyViewScale();          // (v203) 스테이지별 시야 배율
  currentScale = computeScale(canvas);
  // 신규 맵은 2배 정수 확대 원본이므로 논리 픽셀이 화면의 정수 픽셀에 맞도록 시야를 보정한다.
  if (stage && stage.__conceptMap && typeof window.BD_applyConceptPixelPerfectScale === 'function') {
    window.BD_applyConceptPixelPerfectScale(canvas, stage);
  }

  ctx.clearRect(0, 0, W, H);

  // ── 배경 ──
  const bgImg = LOADED_IMGS[stage.bgKey];
  // 맵 전체를 카메라 변환으로 그리기
  const bgX = toScreenX(0, canvas);
  const bgY = toScreenY(0, canvas);
  const bgW = toScreenW(1, canvas);
  const bgH = toScreenH(1, canvas);
  // (v205) 시야가 맵보다 넓어 월드 밖이 화면에 들어오면, 검은 배경 대신
  //  같은 맵 이미지를 화면 전체에 깔고 어둡게 눌러 자연스러운 여백을 만든다.
  try {
    const _v = BD_visibleHalf();
    const _out = (camX - _v.hw < -0.002) || (camX + _v.hw > 1.002) ||
                 (camY - _v.hh < -0.002) || (camY + _v.hh > 1.002);
    if (_out && bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(8, 12, 20, 0.62)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } catch(e) {}
  if (stage.interior && !(bgImg && bgImg.complete && bgImg.naturalWidth > 0)) {
    // (v201) 실내도 bgKey 이미지가 등록되면 그 전체 맵 에셋을 우선 사용,
    //  없을 때만 코드 드로잉 폴백 (문화의집 3층 전체 맵 에셋 교체 대비)
    drawLibraryInterior(ctx, stage, bgX, bgY, bgW, bgH);
  } else if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
    // (v161) cover 방식: 원본 비율 유지, 화면(맵 영역)을 가득 채우고 넘치는 부분은 크롭
    //  → 캔버스 비율이 배경(16:10)과 달라도 벽돌·도로가 늘어나 깨지지 않음
    try {
      const iw = bgImg.naturalWidth, ih = bgImg.naturalHeight;
      const scale = Math.max(bgW / iw, bgH / ih);
      const cw = bgW / scale, chh = bgH / scale;             // 소스에서 사용할 영역
      const sx0 = (iw - cw) / 2, sy0 = (ih - chh) / 2;       // 중앙 크롭
      const _ps = ctx.imageSmoothingEnabled, _pq = ctx.imageSmoothingQuality;
      // 신규 시안 맵은 2px 픽셀 그리드를 보존하고, 기존 맵의 고품질 보간은 그대로 유지한다.
      ctx.imageSmoothingEnabled = stage.__conceptMap ? false : true;
      ctx.imageSmoothingQuality = stage.__conceptMap ? 'low' : 'high';
      ctx.drawImage(bgImg, sx0, sy0, cw, chh, bgX, bgY, bgW, bgH);
      ctx.imageSmoothingEnabled = _ps; ctx.imageSmoothingQuality = _pq;
    } catch(e) {}
  } else {
    ctx.fillStyle = '#5a7a3a';
    ctx.fillRect(bgX, bgY, bgW, bgH);
  }

  // ── 오브젝트 (y순 정렬 → 아래 오브젝트가 위에 그려짐) ──
  const objImgMap = {
    cafe:'CAFE', store24:'STORE24', books:'TALL', corner:'HALL',
    shop:'STORE24', tall:'TALL', hall:'HALL', small:'CAFE',
  };

  // 히어로 y 포함해서 정렬 대상 만들기
  const _mobItems = (!stage.interior && MOB_SPAWNS[currentStage])
    ? _mobs.filter(m => m.alive).map(m => ({ _mob: true, ref: m, sortY: m.y }))
    : [];
  const drawList = [...stage.objects, ..._mobItems, { _hero: true, sortY: heroY }, { _scarecrow: true, sortY: SCARECROW_SPAWN_Y }, { _npc: true, sortY: NPC_Y }, { _qnpc: true, sortY: QNPC_Y }];
  /* (v369) 오브젝트 깊이선 = 충돌체 하단(cy+ch, 있으면). 그림 사각형(ry+rh)은 건물 밑단보다 아래로 여백을 갖는 경우가 있어
     (예: 화성그린환경센터 pad 0.031≈100px) 문 앞에 선 히어로가 뒤로 그려졌다. 플레이어는 충돌체 안에 설 수 없으므로
     발이 충돌체 하단보다 아래면 항상 «앞». 충돌체가 그림보다 아래로 나가는 경우엔 그림 하단을 쓴다(min). */
  const __bdObjDepth = (o) => {
    const rb = (o.ry || 0) + (o.rh || 0);
    if (o && !o.resident && o.type !== 'wall' && typeof o.cy === 'number' && typeof o.ch === 'number' && o.ch > 0) return Math.min(rb, o.cy + o.ch);
    return rb;
  };
  drawList.sort((a, b) => {
    // wall은 항상 배경 위, 건물보다 뒤에(Y 낮음) 그리기 위해 sortY=0
    const ay = a._hero ? a.sortY : (a._scarecrow ? a.sortY : (a._npc ? a.sortY : (a._qnpc ? a.sortY : (a._mob ? a.sortY : (a.type === 'wall' ? -1 : __bdObjDepth(a))))));
    const by2 = b._hero ? b.sortY : (b._scarecrow ? b.sortY : (b._npc ? b.sortY : (b._qnpc ? b.sortY : (b._mob ? b.sortY : (b.type === 'wall' ? -1 : __bdObjDepth(b))))));
    return ay - by2;
  });

  for (const item of drawList) {
    if (item._mob) {
      drawMob(ctx, canvas, item.ref);
    } else if (item._scarecrow) {
      // ── 허수아비 ──
      drawScarecrow(ctx, canvas);
    } else if (item._npc) {
      // ── NPC (임현지) ──
      drawNPC(ctx, canvas);
    } else if (item._qnpc) {
      // ── 퀘스트 NPC (사서 도현) ──
      drawQuestNpc(ctx, canvas);
    } else if (item._hero) {
      // ── 히어로 ──
      const hScrX = toScreenX(heroX, canvas);
      const hScrY = toScreenY(heroY, canvas);
      // 화면 스케일에 비례한 크기 (화면이 클수록 캐릭터도 커짐)
      // (v98) 에디터에서 조절한 플레이어 배율 반영 (스테이지별)
  const __hs = (typeof window.BD_heroScale === 'function') ? window.BD_heroScale() : { scale:100, w:100 };
  const __hsS = (__hs.scale || 100) / 100, __hsW = (__hs.w || 100) / 100;
  const hScrW = HERO_BASE_W * currentScale * (window.BD_SPR || 1) * __hsS * __hsW;   // (v205) 맵 비례
      const hScrH = HERO_BASE_H * currentScale * (window.BD_SPR || 1) * __hsS;
      const hDrawX = hScrX - hScrW / 2;
      const hDrawY = hScrY - hScrH;

      // ── 대시 잔상(고스트) 렌더링 ──
      for (const ghost of DASH_GHOSTS) {
        const gx = toScreenX(ghost.x, canvas);
        const gy = toScreenY(ghost.y, canvas);
        const gdx = gx - hScrW / 2;
        const gdy = gy - hScrH;
        const gFrames = (selectedCharacter === 2)
          ? (_maleImgs[ghost.dir] || _maleImgs['front'])
          : (_sprImgs[ghost.dir] || _sprImgs['front']);
        const gSp = gFrames ? gFrames[0] : null;
        ctx.save();
        ctx.globalAlpha = ghost.alpha * 0.7;
        // 색조 틴트 (시안 계열)
        ctx.filter = 'hue-rotate(160deg) brightness(1.6) saturate(2)';
        if (gSp && gSp.complete && gSp.naturalWidth > 0) {
          try { ctx.drawImage(gSp, gdx, gdy, hScrW, hScrH); } catch(e) {}
        }
        ctx.restore();
      }

      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(hScrX, hScrY + 2, hScrW * 0.4, hScrW * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 스프라이트 (애니메이션)
      // (v237.1) 반대키 동시 입력(a+d, w+s)은 상쇄 — 제자리면 걷기 대신 아이들 모션
      const isMoving = getNetMoveX() !== 0 || getNetMoveY() !== 0 || isDashing;
      tickWalkAnim(isMoving);
      if (typeof tickIdleAnim === 'function') tickIdleAnim(isMoving);   // (v163+) 남자 아이들링
      const sp = getCurrentSprite(isMoving);
      /* (v336) 건물 가림 판정 — 발선(ry+rh)이 히어로보다 아래(앞)인 시각 오브젝트가
         히어로 스프라이트 사각형을 덮으면 «가려짐». 가려진 경우에만 여기(깊이 정렬 위치)서
         원본을 그리고 최상위 훅은 실루엣만 덧그린다. 평소에는 최상위 훅에서 단 한 번만
         그려 v293의 이중 드로우를 없앤다. */
      let __heroOcc = false;
      const __occList = [];   /* (v339) 가린 구조물 목록 — 실루엣을 «가린 만큼만» 마스킹 */
      try {
        const __inX = hScrW * 0.12;                        // 스프라이트 좌우 투명 여백 보정
        const __hx0 = hDrawX + __inX, __hx1 = hDrawX + hScrW - __inX;
        for (const __o of stage.objects) {
          const __t = __o.type;
          if (__t === 'wall' || __t === 'park' || __t === 'library' || __t === 'stair' || __t === 'platform') continue;
          if (__o.resident) continue;                      // 주민(캐릭터)은 구조물이 아니므로 제외
          if (!(__bdObjDepth(__o) > heroY)) continue;      // (v369) 깊이선(충돌체 하단)이 히어로 발보다 위면 가릴 수 없음
          const __ox = toScreenX(__o.rx, canvas), __oy = toScreenY(__o.ry, canvas);
          const __ow = toScreenW(__o.rw, canvas), __oh = toScreenH(__o.rh, canvas);
          // 오브젝트 상단이 히어로 상반신보다 위에 있어야 «키 큰 구조물» — 벤치 등 낮은 소품 제외
          if (__oy >= hDrawY + hScrH * 0.5) continue;
          if (!(__ox < __hx1 && __ox + __ow > __hx0 && __oy < hDrawY + hScrH && __oy + __oh > hDrawY)) continue;
          // (v336) 픽셀 알파 프로브 — 신월드 «단지» 합성 에셋은 사각형이 거대해(투명 여백 포함)
          //  사각형 겹침만으론 과판정. Y정렬이 실제로 덮는 것과 동일하게, 히어로 머리·몸통
          //  지점의 에셋 픽셀이 불투명할 때만 «가려짐»으로 본다. (이미지 없는 절차 드로우
          //  오브젝트는 통짜 박스이므로 사각형 판정 유지)
          let __img = null;
          if (__o.assetId || String(__o.key || '').indexOf('asset:') === 0) {
            const __aid = __o.assetId || String(__o.key).slice(6);
            __img = (typeof window.BD_getAssetImage === 'function') ? window.BD_getAssetImage(__aid) : null;
          } else if (__o.type === 'building') {
            __img = LOADED_IMGS[objImgMap[__o.key] || String(__o.key || __o.label || '?').toUpperCase()];
          }
          if (__img && __img.complete && __img.naturalWidth > 0) {
            if (!window.__bdOccSampCtx) {
              const __cv = document.createElement('canvas'); __cv.width = 1; __cv.height = 1;
              window.__bdOccSampCtx = __cv.getContext('2d', { willReadFrequently: true });
            }
            const __sc = window.__bdOccSampCtx;
            const __alpha = (px, py) => {
              const __u = Math.floor((px - __ox) / __ow * __img.naturalWidth);
              const __v = Math.floor((py - __oy) / __oh * __img.naturalHeight);
              if (__u < 0 || __v < 0 || __u >= __img.naturalWidth || __v >= __img.naturalHeight) return 0;
              __sc.clearRect(0, 0, 1, 1);
              try { __sc.drawImage(__img, __u, __v, 1, 1, 0, 0, 1, 1); return __sc.getImageData(0, 0, 1, 1).data[3]; }
              catch (eSm) { return 255; }   // 오염 등 실패 시 안전하게 «가림» 취급
            };
            /* (v339) 중앙 1열만 보면 좌우 부분 겹침을 놓쳐 «지붕 밟기»가 생겼다 — 3×3 지점 검사 */
            let __hit = false;
            const __cols = [hDrawX + hScrW * 0.25, hDrawX + hScrW * 0.5, hDrawX + hScrW * 0.75];
            const __rows = [hDrawY + hScrH * 0.18, hDrawY + hScrH * 0.5, hDrawY + hScrH * 0.82];
            for (let __ci = 0; __ci < 3 && !__hit; __ci++)
              for (let __ri = 0; __ri < 3 && !__hit; __ri++)
                if (__alpha(__cols[__ci], __rows[__ri]) > 40) __hit = true;
            if (!__hit) continue;
          }
          __heroOcc = true;
          if (__occList.length < 4) __occList.push({ x: __ox, y: __oy, w: __ow, h: __oh, img: (__img && __img.complete && __img.naturalWidth > 0) ? __img : null });
        }
      } catch (eOcc) {}
      const __spOk = !!(sp && sp.complete && sp.naturalWidth > 0);
      const __topOk = !!(window.BD_drawNpcQuestMarks && window.BD_drawNpcQuestMarks.__v293top);
      /* (v293→v336) 최상위 훅 전달 파라미터 — occ(가려짐)·dash(발광)·cs(스케일) 추가 */
      try{ window.__bdHeroDraw = { sp: sp, x: hDrawX, y: hDrawY, w: hScrW, h: hScrH,
        keep: ((selectedCharacter === 2 && _maleDirImgs[lastDir]) || (selectedCharacter === 1 && _femaleDirImgs[lastDir])),
        pix: !!stage.__conceptMap, occ: __heroOcc, dash: isDashing, cs: currentScale,
          occRects: __occList.length ? __occList : null }; }catch(eHT){}
      if (__heroOcc || !__topOk || !__spOk) {
        // 대시 중 발광
        if (isDashing) {
          ctx.save();
          ctx.shadowColor = 'rgba(100, 200, 255, 0.9)';
          ctx.shadowBlur = 16 * currentScale;
        }
        // 신규 시안 맵에서는 캐릭터도 nearest-neighbor로 그려 픽셀 경계를 보존한다.
        const _heroSmoothing = ctx.imageSmoothingEnabled;
        if (stage.__conceptMap) ctx.imageSmoothingEnabled = false;
        if (__spOk) {
          // (v170) 남녀 캐릭터 모두 프레임/방향마다 폭이 달라 흔들리므로, 높이 기준 비율 유지 + 가로 중앙 정렬
          const keepRatio = (selectedCharacter === 2 && _maleDirImgs[lastDir]) || (selectedCharacter === 1 && _femaleDirImgs[lastDir]);
          if (keepRatio) {
            const dh = hScrH;
            const dw = dh * (sp.naturalWidth / sp.naturalHeight);
            const dx = hDrawX + (hScrW - dw) / 2;
            try { ctx.drawImage(sp, dx, hDrawY, dw, dh); } catch(e) { drawHeroFallback(ctx, hDrawX, hDrawY, hScrW, hScrH); }
          } else {
            try { ctx.drawImage(sp, hDrawX, hDrawY, hScrW, hScrH); } catch(e) { drawHeroFallback(ctx, hDrawX, hDrawY, hScrW, hScrH); }
          }
        } else {
          drawHeroFallback(ctx, hDrawX, hDrawY, hScrW, hScrH);
        }
        ctx.imageSmoothingEnabled = _heroSmoothing;
        if (isDashing) ctx.restore();
      }

      // ── 평타 이펙트 ──
      drawBasicAtkEffect(ctx, canvas);
      drawArrows(ctx, canvas);
      drawMageChargeEffect(ctx, canvas);

      // 이름 태그 (스케일 비례 크기)
      // (v157) 정렬 상태를 명시적으로 초기화 — 다른 그리기에서 center/middle이 누수되어도 안전
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const fontSize = Math.round(11 * currentScale);
      ctx.font = `bold ${fontSize}px 'Noto Serif KR', sans-serif`;
      const nameW = ctx.measureText(heroName).width + 6;
      const tagX = hScrX - nameW / 2;
      const tagY = hDrawY - 3;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(tagX, tagY - fontSize - 1, nameW, fontSize + 3);
      ctx.fillStyle = '#fff';
      ctx.fillText(heroName, tagX + 3, tagY - 1);

      // ── 마법사 현재 속성 배지 (이름표 옆) ──
      if (mageElementUnlocked()) {
        const _el = MAGE_ELEMENT_INFO[currentMageElement()];
        const eText = `${_el.icon}${_el.name}`;
        const eW = ctx.measureText(eText).width + 8 * currentScale;
        const eX = tagX + nameW + 4 * currentScale;
        const elColors = {
          fire:'rgba(200,60,20,0.85)', water:'rgba(30,90,200,0.85)',
          grass:'rgba(40,150,50,0.85)', electric:'rgba(180,150,20,0.85)'
        };
        ctx.fillStyle = elColors[currentMageElement()] || 'rgba(80,40,120,0.85)';
        ctx.fillRect(eX, tagY - fontSize - 1, eW, fontSize + 3);
        ctx.fillStyle = '#fff';
        ctx.fillText(eText, eX + 4 * currentScale, tagY - 1);
      }

      // ── F키 상호작용 말풍선 (편의점 근처일 때만) ──
      // (v369) 신월드(4개 리)에서는 067 라벨(«[F] 대화·조사»)과 중복되어 표시하지 않는다 (UX U-04)
      const __legacyStoreBubble = !(stage && stage.__districtWorldV24);
      if (__legacyStoreBubble && !shopOpen && isNearStore24()) {
        const bfs  = Math.round(11 * currentScale);
        const bText = '  [F] 상호작용  ';
        ctx.font = `bold ${bfs}px 'Noto Serif KR', sans-serif`;
        const bTextW = ctx.measureText(bText).width;
        const bPadX = 8 * currentScale;
        const bPadY = 5 * currentScale;
        const bW = bTextW + bPadX * 2;
        const bH = bfs + bPadY * 2;
        const bRadius = 6 * currentScale;

        // 말풍선 위치: 이름 태그 위
        const bX = hScrX - bW / 2;
        const bY = tagY - fontSize - 6 - bH;

        // 꼬리 삼각형 (말풍선 아래 중앙)
        const tailSize = 5 * currentScale;

        // 배경 (둥근 사각형)
        ctx.save();
        ctx.fillStyle = 'rgba(20, 12, 4, 0.88)';
        ctx.strokeStyle = 'rgba(200, 144, 42, 0.9)';
        ctx.lineWidth = 1.5 * currentScale;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bX, bY, bW, bH, bRadius);
        } else {
          ctx.rect(bX, bY, bW, bH);
        }
        ctx.fill();
        ctx.stroke();

        // 꼬리
        ctx.fillStyle = 'rgba(20, 12, 4, 0.88)';
        ctx.beginPath();
        ctx.moveTo(hScrX - tailSize, bY + bH);
        ctx.lineTo(hScrX + tailSize, bY + bH);
        ctx.lineTo(hScrX, bY + bH + tailSize * 1.4);
        ctx.closePath();
        ctx.fill();

        // 꼬리 테두리 (양 사이드만)
        ctx.strokeStyle = 'rgba(200, 144, 42, 0.9)';
        ctx.lineWidth = 1.5 * currentScale;
        ctx.beginPath();
        ctx.moveTo(hScrX - tailSize, bY + bH);
        ctx.lineTo(hScrX, bY + bH + tailSize * 1.4);
        ctx.lineTo(hScrX + tailSize, bY + bH);
        ctx.stroke();

        // [F] 키 표시 (금색)
        const keyLabel = '[F]';
        ctx.font = `bold ${bfs}px 'Noto Serif KR', sans-serif`;
        const keyW = ctx.measureText(keyLabel).width;
        const innerX = bX + bPadX;
        const textY  = bY + bPadY + bfs * 0.82;
        ctx.fillStyle = '#f0c040';
        ctx.fillText(keyLabel, innerX, textY);

        // '상호작용' 텍스트 (흰색)
        ctx.fillStyle = '#f0e8d0';
        ctx.fillText(' 상호작용', innerX + keyW, textY);

        ctx.restore();
      }

    } else {
      const obj = item;
      const sx = toScreenX(obj.rx, canvas);
      const sy = toScreenY(obj.ry, canvas);
      const sw = toScreenW(obj.rw, canvas);
      const sh = toScreenH(obj.rh, canvas);

      if (obj.type === 'park' || obj.type === 'library') {
        // (v186) 임시 P/park/library 시설 마커는 시각적으로 표시하지 않음.
        //  회복·서브퀘스트용 상호작용(useFacility)은 오브젝트가 STAGES에 남아있어 그대로 동작.
      } else if (obj.type === 'wall') {
        // 사이드 월: 투명 (시각적으로 보이지 않음, 충돌만)
        // 개발 디버그용: ctx.strokeStyle='rgba(255,0,0,0.3)'; ctx.strokeRect(sx,sy,sw,sh);
      } else if (obj.type === 'shelf') {
        drawBookshelf(ctx, sx, sy, sw, sh);
      } else if (obj.type === 'desk') {
        drawDesk(ctx, sx, sy, sw, sh, obj.label);
      } else if (obj.type === 'stair') {
        drawStair(ctx, sx, sy, sw, sh, obj.dir, obj.label);
      } else if (obj.type === 'platform') {
        drawPlatform(ctx, sx, sy, sw, sh, obj.label);
      } else if (obj.type === 'seats') {
        drawSeats(ctx, sx, sy, sw, sh);
      } else if (obj.type === 'piano') {
        drawPiano(ctx, sx, sy, sw, sh);
      } else if (obj.type === 'room') {
        // (v200) 방 오브젝트: assetId가 지정되면 해당 이미지로 렌더(추후 실제 인테리어 도트로 교체),
        //  없으면 도면용 블록으로 렌더
        const rAid = obj.assetId || (String(obj.key||'').indexOf('asset:') === 0 ? String(obj.key).slice(6) : null);
        const rImg = (rAid && typeof window.BD_getAssetImage === 'function') ? window.BD_getAssetImage(rAid) : null;
        if (rImg && rImg.complete && rImg.naturalWidth > 0) {
          const prevSm2 = ctx.imageSmoothingEnabled;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(rImg, sx, sy, sw, sh);
          ctx.imageSmoothingEnabled = prevSm2;
        } else {
          drawRoomBlock(ctx, sx, sy, sw, sh, obj.label);
        }
      } else if (obj.assetId || String(obj.key||'').startsWith('asset:')) {
        // (v161) 에디터 배치 이미지 오브젝트 / 동네 주민 — 실플레이 필드에 렌더
        const aid = obj.assetId || String(obj.key).slice(6);
        const aImg = (typeof window.BD_getAssetImage==='function') ? window.BD_getAssetImage(aid) : null;
        if (aImg && aImg.complete && aImg.naturalWidth > 0) {
          // (v30) 주민·건물 전부 에디터 박스(rw×rh)에 1:1로 그린다 — 비율·배율 보정 완전 제거(WYSIWYG).
          //  선택 테두리 = 실제 그림. 크기·비율 모두 에디터에서 자유롭게.
          const dh = sh;
          const dw = sw;
          const dx = sx + (sw - dw) / 2;
          const _dyOff = sh - dh;                                      // 발밑 고정
          const prevSm = ctx.imageSmoothingEnabled;
          ctx.imageSmoothingEnabled = false;
          // (v198) 상호작용 가능한 건물에 근접하면 은은한 골드 글로우
          let _glow = false;
          if (obj.type === 'building' && obj.interactable) {
            const _dyG = heroY - (obj.ry + (obj.rh||0));
            _glow = heroX >= obj.rx - 0.05 && heroX <= obj.rx + (obj.rw||0) + 0.05 && _dyG >= -0.02 && _dyG < 0.20;
          }
          if (_glow) { ctx.save(); ctx.shadowColor = 'rgba(255,214,110,0.85)'; ctx.shadowBlur = 14 * currentScale; }
          try { ctx.drawImage(aImg, dx, sy + _dyOff, dw, dh); } catch(e) {}
          if (_glow) ctx.restore();
          ctx.imageSmoothingEnabled = prevSm;
          // 주민 이름표 + 근접 시 F 안내
          if (obj.resident) {
            ctx.save();
            ctx.font = `bold ${Math.max(10, Math.round(11*currentScale))}px 'Noto Serif KR', sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            const nm = obj.npcName || obj.label || '';
            const tw = ctx.measureText(nm).width;
            ctx.fillRect(dx + dw/2 - tw/2 - 5, sy - 18, tw + 10, 15);
            ctx.fillStyle = '#fff';
            ctx.fillText(nm, dx + dw/2, sy - 6);
            try {
              if (typeof window.BD_nearResident==='function' && window.BD_nearResident() === obj) {
                ctx.fillStyle = '#ffd54a';
                ctx.fillText('[F] 대화', dx + dw/2, sy - 22);
              }
            } catch(e) {}
            ctx.restore();
          }
        }
        // (v198) asset 이미지 건물에도 [F] 마커 표시 (builtin 분기와 동일 규칙)
        if (obj.type === 'building' && obj.interactable) {
          const _left2 = obj.rx - 0.05, _right2 = obj.rx + obj.rw + 0.05;
          const _dy2 = heroY - (obj.ry + obj.rh);
          const _near2 = heroX >= _left2 && heroX <= _right2 && _dy2 >= -0.02 && _dy2 < 0.20;
          const _okShop  = obj.interactable === 'shop'  && !shopOpen;
          const _okQuest = obj.interactable === 'quest' && !questPanelOpen && !getNearNPC() && !getNearQuestNpc();
          const _okInfo  = obj.interactable === 'info'  && obj.infoLines;
          if (_near2 && (_okShop || _okQuest || _okInfo)) {
            const markerX = sx + sw / 2;
            const markerY = sy + sh + 4 * currentScale;
            const fs = Math.round(12 * currentScale);
            ctx.save();
            ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
            const txt = _okShop ? '[F]' : (_okQuest ? '[F] 입장' : '[F] 안내');
            const tw = ctx.measureText(txt).width + 10;
            ctx.fillStyle = _okShop ? 'rgba(200,144,42,0.85)' : (_okQuest ? 'rgba(30,100,180,0.88)' : 'rgba(46,125,80,0.88)');
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(markerX - tw/2, markerY - fs - 2, tw, fs + 6, 4);
            else ctx.rect(markerX - tw/2, markerY - fs - 2, tw, fs + 6);
            ctx.fill();
            ctx.fillStyle = _okShop ? '#fff' : (_okQuest ? '#88ccff' : '#b6f2c8');
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, markerX, markerY - fs/2 + 1);
            ctx.restore();
          }
        }
      } else if (obj.type === 'building') {
        const key = objImgMap[obj.key] || String(obj.key || obj.label || '?').toUpperCase();   // (v222) key 없는 오브젝트 방어
        const bImg = LOADED_IMGS[key];
        if (bImg && bImg.complete && bImg.naturalWidth > 0) {
          try { ctx.drawImage(bImg, sx, sy, sw, sh); } catch(e) {}
        } else {
          ctx.fillStyle = '#aaa';
          ctx.fillRect(sx, sy, sw, sh);
          if (obj.label) {
            ctx.fillStyle = '#333';
            ctx.font = `bold 12px 'Noto Serif KR', sans-serif`;
            ctx.fillText(obj.label, sx + 4, sy + sh / 2);
          }
        }

        // 해당 건물 앞에 있을 때만 [F] 마커 표시
        if (obj.interactable === 'shop' && !shopOpen) {
          const _left   = obj.rx - 0.05;
          const _right  = obj.rx + obj.rw + 0.05;
          const _bottom = obj.ry + obj.rh;
          const _dy = heroY - _bottom;
          const _near = heroX >= _left && heroX <= _right && _dy >= -0.02 && _dy < 0.20;
          if (_near) {
            const markerX = sx + sw / 2;
            const markerY = sy + sh + 4 * currentScale;
            const fs = Math.round(12 * currentScale);
            ctx.save();
            ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
            const txt = '[F]';
            const tw = ctx.measureText(txt).width + 8;
            ctx.fillStyle = 'rgba(200,144,42,0.85)';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(markerX - tw/2, markerY - fs - 2, tw, fs + 6, 4);
            } else {
              ctx.rect(markerX - tw/2, markerY - fs - 2, tw, fs + 6);
            }
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, markerX, markerY - fs/2 + 1);
            ctx.restore();
          }
        }

        // (v198) 안내 건물 앞 [F] 안내 마커 (초록색)
        if (obj.interactable === 'info' && obj.infoLines) {
          const _left   = obj.rx - 0.05;
          const _right  = obj.rx + obj.rw + 0.05;
          const _bottom = obj.ry + obj.rh;
          const _dy = heroY - _bottom;
          const _near = heroX >= _left && heroX <= _right && _dy >= -0.02 && _dy < 0.20;
          if (_near) {
            const markerX = sx + sw / 2;
            const markerY = sy + sh + 4 * currentScale;
            const fs = Math.round(12 * currentScale);
            ctx.save();
            ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
            const txt = '[F] 안내';
            const tw = ctx.measureText(txt).width + 10;
            ctx.fillStyle = 'rgba(46,125,80,0.88)';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(markerX - tw/2, markerY - fs - 2, tw, fs + 6, 4);
            } else {
              ctx.rect(markerX - tw/2, markerY - fs - 2, tw, fs + 6);
            }
            ctx.fill();
            ctx.fillStyle = '#b6f2c8';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, markerX, markerY - fs/2 + 1);
            ctx.restore();
          }
        }

        // 퀘스트 건물(봉담 와우 도서관) 앞에 있을 때 [F] 마커 (파란색)
        if (obj.interactable === 'quest' && !questPanelOpen) {
          const _left   = obj.rx - 0.05;
          const _right  = obj.rx + obj.rw + 0.05;
          const _bottom = obj.ry + obj.rh;
          const _dy = heroY - _bottom;
          const _near = heroX >= _left && heroX <= _right && _dy >= -0.02 && _dy < 0.20 && !getNearNPC() && !getNearQuestNpc();
          if (_near) {
            const markerX = sx + sw / 2;
            const markerY = sy + sh + 4 * currentScale;
            const fs = Math.round(12 * currentScale);
            ctx.save();
            ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
            const txt = '[F] 입장';
            const tw = ctx.measureText(txt).width + 10;
            ctx.fillStyle = 'rgba(30,100,180,0.88)';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(markerX - tw/2, markerY - fs - 2, tw, fs + 6, 4);
            } else {
              ctx.rect(markerX - tw/2, markerY - fs - 2, tw, fs + 6);
            }
            ctx.fill();
            ctx.fillStyle = '#88ccff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, markerX, markerY - fs/2 + 1);
            ctx.restore();
          }
        }
      }
    }
  }

  // 신규 시안 맵의 도로 끝은 실제 이동 출구 또는 공사 차단물로 명확히 구분한다.
  try {
    if (typeof window.BD_drawConceptRoadControls === 'function') {
      window.BD_drawConceptRoadControls(ctx, canvas, stage);
    }
  } catch (error) {}

  // 정밀 콜라이더 검수 모드: 배경 원화의 건물·수목·가구·수면별 충돌 범위를 종류별 색으로 표시한다.
  try {
    if (typeof window.BD_drawConceptPrecisionColliders === 'function') {
      window.BD_drawConceptPrecisionColliders(ctx, canvas, stage);
    }
  } catch (error) {}

  // ── 충돌 벽 시각화 (푸른색 반투명) ── (v202) 충돌이 꺼져 있으면 표시도 안 함
  // _collidesAt 과 동일한 판정 영역을 그린다.
  if (window.BD_MAP_COLLISION) for (const obj of stage.objects) {
    if (obj.type === 'building' || obj.type === 'wall' || obj.type === 'shelf' ||
        obj.type === 'desk' || obj.type === 'platform' || obj.type === 'seats' || obj.type === 'piano') {
      const oL = (obj.type === 'building' && obj.cx !== undefined) ? obj.cx : obj.rx;
      const oT = (obj.type === 'building' && obj.cy !== undefined) ? obj.cy : obj.ry;
      const oW = (obj.type === 'building' && obj.cw !== undefined) ? obj.cw : obj.rw;
      const oH = (obj.type === 'building' && obj.ch !== undefined) ? obj.ch : obj.rh;
      const cScrX = toScreenX(oL, canvas);
      const cScrY = toScreenY(oT, canvas);
      const cScrW = toScreenW(oW, canvas);
      const cScrH = toScreenH(oH, canvas);
      ctx.fillStyle   = 'rgba(30,120,255,0.30)';
      ctx.fillRect(cScrX, cScrY, cScrW, cScrH);
      ctx.strokeStyle = 'rgba(30,120,255,0.75)';
      ctx.lineWidth   = 1 * currentScale;
      ctx.strokeRect(cScrX, cScrY, cScrW, cScrH);
    }
  }

  // ── 핵심 루프: 위험 오브젝트의 정화 상태 표시 ──
  //  정화 전: 눈에 띄는 붉은 오라 + 아이콘 + [F] 유도, 정화 후: 반투명 + ✨ 표시
  // (v125) 다른 로더가 STAGES를 덮어써도 매 프레임 퀘스트 위험요소를 재보증
  try { if (typeof window.BD_ensureQuestHazards === 'function') window.BD_ensureQuestHazards(); } catch(e){}
  for (const obj of stage.objects) {
    if (obj.interactable !== 'hazard') continue;
    if (obj.hidden || obj.__bdGone) continue;   // (v52/75) 소멸 처리된 위험요소는 그리지 않음
    if (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(obj)) continue; // 잠긴 보스는 숨김
    const cx = toScreenX((obj.rx||0) + (obj.rw||0)/2, canvas);
    const cy = toScreenY((obj.ry||0) + (obj.rh||0)/2, canvas);
    const rad = Math.max(1, Math.abs(Math.max(toScreenW(obj.rw, canvas), toScreenH(obj.rh, canvas)) / 2));   // (v160) 음수 반지름 방어
    const purified = obj._purified || (typeof window.BD_isPurified === 'function' && window.BD_isPurified(obj.hazardId || obj.id || obj.label));
    ctx.save();
    if (purified) {
      // (v240) 정화 후 그림이 등록돼 있으면 그림으로, 아니면 기존 초록 원 + ✨
      let _imC = null;
      try{ if(window.BD_ASSETS && obj.hazardVariant) _imC = BD_ASSETS.image('field.hazard_clean.' + obj.hazardVariant); }catch(e){}
      if(_imC){
        const _s = rad * 2.1;
        if (obj.hzRectV147){
          /* (v147) 렉트 그대로 그리기 — 에디터에서 바꾼 크기·비율이 그대로 보인다 */
          const _dx = toScreenX(obj.rx, canvas), _dy = toScreenY(obj.ry, canvas);
          const _dw = toScreenW(obj.rw, canvas), _dh = toScreenH(obj.rh, canvas);
          try{ ctx.drawImage(_imC, _dx, _dy, _dw, _dh); }catch(e){ _imC = null; }
        } else {
          try{ ctx.drawImage(_imC, cx - _s/2, cy - _s/2, _s, _s); }catch(e){ _imC = null; }
        }
        // (v277) 초록 테두리 제거 — 깨끗해진 그림 자체가 정화의 표시 (사용자 피드백)
      }
      // (v277) 정화 후 초록 원·✨·'정화됨' 라벨 전부 제거 — 정화 스프라이트가 없으면 아무것도 그리지 않는다(치워진 것).
    } else {
      // 위험: 눈에 잘 띄는 붉은 원 (맥동) + 아이콘 + 라벨 / 보스는 보라 오라 + 👑
      const isBossObj = !!obj.isBoss;
      // (v240b) 스프라이트 데칼이 등록된 위험요소는 그림 자체가 표식 — 빨간 마크를 겹치지 않는다
      var _hzIm = null;
      try{ if(window.BD_ASSETS && obj.hazardVariant) _hzIm = BD_ASSETS.image('field.hazard.' + obj.hazardVariant); }catch(e){}
      const _spriteOnly = true;   // (v267) 빨간 마커 UI 전면 제거(보스 포함) — 스프라이트가 곧 표식 (폴백: ⚠️/👑)
      const pulse = 1 + 0.08 * Math.sin(Date.now() / 300);
      const cMain = isBossObj ? '150,60,255' : '255,80,60';
      const cFill1 = isBossObj ? 'rgba(160,80,255,0.55)' : 'rgba(255,90,70,0.55)';
      const cFill2 = isBossObj ? 'rgba(90,30,180,0.40)' : 'rgba(200,40,30,0.35)';
      const cEdge = isBossObj ? 'rgba(200,140,255,0.95)' : 'rgba(255,120,90,0.95)';
      if(!_spriteOnly){
        // 외곽 맥동 링
        ctx.strokeStyle = `rgba(${cMain},${(0.5 + 0.25*Math.sin(Date.now()/300)).toFixed(2)})`;
        ctx.lineWidth = (isBossObj ? 4 : 3) * currentScale;
        ctx.beginPath(); ctx.arc(cx, cy, rad * (isBossObj?1.25:1.15) * pulse, 0, Math.PI*2); ctx.stroke();
        // 채워진 반투명 원
        const grad = ctx.createRadialGradient(cx, cy, rad*0.2, cx, cy, rad);
        grad.addColorStop(0, cFill1);
        grad.addColorStop(1, cFill2);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = cEdge; ctx.lineWidth = 2.5 * currentScale;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI*2); ctx.stroke();
      }
      // 경고/보스 아이콘
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.font = `bold ${Math.round((isBossObj?34:30)*currentScale)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // (v239) 에셋 슬롯: field.hazard.<variant> 등록 시 그림, 아니면 ⚠️ 폴백
      (function(){
        var _im = _hzIm;
        if(_im && obj.hzRectV147){
          /* (v147) 예전에는 max(rw,rh) 기준 «정사각형»으로만 그려
             에디터에서 가로·세로를 따로 바꿔도 화면이 그대로였다.
             hzRectV147 마이그레이션(부팅 시 1회, 기존 화면 크기를 렉트로 굽기) 후에는
             렉트를 그대로 그린다 — 이제 크기·비율 조절이 눈에 보인다. */
          const _dx = toScreenX(obj.rx, canvas), _dy = toScreenY(obj.ry, canvas);
          const _dw = toScreenW(obj.rw, canvas), _dh = toScreenH(obj.rh, canvas);
          try{ ctx.drawImage(_im, _dx, _dy, _dw, _dh); }catch(e){ _im = null; }
        } else if(_im){
          var _s = rad * 2.1;   // (v240) 데칼형 스프라이트 — 바닥까지 그려져 있어 여유 있게
          try{ ctx.drawImage(_im, cx - _s/2, cy - _s/2, _s, _s); }catch(e){ _im = null; }
        }
        if(!_im) ctx.fillText(isBossObj ? '👑' : '⚠️', cx, cy - rad*0.05);
      })();
      if(!_spriteOnly){
        // "위험" 라벨 (원 위) — 스프라이트가 있으면 그림이 곧 표식이라 생략
        ctx.font = `bold ${Math.round(14*currentScale)}px 'Noto Serif KR', sans-serif`;
        ctx.fillStyle = isBossObj ? 'rgba(200,140,255,1)' : 'rgba(255,80,60,1)';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3 * currentScale;
        ctx.strokeText(obj.label || '위험 요소', cx, cy - rad - 12*currentScale);
        ctx.fillText(obj.label || '위험 요소', cx, cy - rad - 12*currentScale);
      }
      // 근처(상호작용 범위)에 있으면 [F] 조사 안내
      const _hdx = heroX - (obj.rx + (obj.rw||0)/2);
      const _hdy = heroY - (obj.ry + (obj.rh||0)/2);
      if (Math.sqrt(_hdx*_hdx + _hdy*_hdy) <= 0.11) {
        const fy = cy + rad + 18*currentScale;
        ctx.font = `bold ${Math.round(15*currentScale)}px sans-serif`;
        ctx.fillStyle = 'rgba(167,139,250,1)';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 4 * currentScale;
        ctx.strokeText('[F] 조사', cx, fy);
        ctx.fillText('[F] 조사', cx, fy);
      }
    }
    ctx.restore();
  }

  // ── 폴백: 추적 임무가 없으면 세션당 1회 현재 메인 임무를 자동 추적 ──
  // (반드시 세이브 로드(__bdLoaded) 이후에만 — 로드 전 bdSave로 세이브를 덮어쓰는 레이스 방지)
  // (v240c) 자유 탐험: 자동 추적을 걸지 않는다 — 포켓몬처럼 플레이어가 원하는 대로 돌아다니고,
  //  노란 안내선·화살표는 J 임무창에서 직접 추적을 켰을 때만 표시된다.
  //  (기존: 로드 직후 메인 임무를 자동 추적해 항상 안내선이 떠서 동선을 강제했음)

  // ── 자가수복+진단: 세이브 로드 후, 게임 렌더가 실제로 시작된 뒤 세션당 1회 ──
  try {
    if (window.__bdLoaded && window.BD && !window.__bdRepairDone && typeof window.BD_repairAndDiagnose === 'function') {
      window.__bdRepairDone = true;
      setTimeout(function(){ try { window.BD_repairAndDiagnose(); } catch(e){} }, 900);
    }
  } catch(e){}

  // ── 화면 길안내: 추적 중인 임무가 있을 때만 표시 (목표 위 화살표 + 바닥 점선) ──
  const _guideOn = false;   // (v240b) 노란 길안내 제거 — 진행 유도는 퀘스트 HUD·정화 마크 등 UI로
  try { if (window.BD_drawNavArrow) window.BD_drawNavArrow(ctx, canvas, stage); } catch(e){}   // (v26) 발 앞 네비 화살표
  try { if (window.BD_drawNpcQuestMarks) window.BD_drawNpcQuestMarks(ctx, canvas, stage); } catch(e){}   // (v34) 주민 부탁 마커
  if (_guideOn && !stage.interior) {
    const gt = getGuideTarget();
    if (gt) {
      const tCx = (gt.rx||0) + (gt.rw||0)/2;   // 목표 중심(맵좌표)
      const tCy = (gt.ry||0) + (gt.rh||0)/2;
      const tsx = toScreenX(tCx, canvas), tsy = toScreenY(tCy, canvas);
      const cw = canvas.width, ch = canvas.height;
      const onScreen = tsx >= 0 && tsx <= cw && tsy >= 0 && tsy <= ch;
      const bob = Math.sin(Date.now()/300) * 4 * currentScale;

      // ── 바닥 길 선: 플레이어 발밑 → 목표까지 흐르는 점선 안내 ──
      {
        const psx = toScreenX(heroX, canvas);
        const psy = toScreenY(heroY, canvas) + 8 * currentScale; // 발밑
        const dx = tsx - psx, dy = tsy - psy;
        const dist = Math.hypot(dx, dy);
        if (dist > 24 * currentScale) {
          ctx.save();
          // 흐르는 점선 (dashOffset 애니메이션)
          const dash = 12 * currentScale, gap = 10 * currentScale;
          ctx.setLineDash([dash, gap]);
          ctx.lineDashOffset = -(Date.now()/40) % (dash + gap);
          ctx.strokeStyle = 'rgba(255,216,77,0.85)';
          ctx.lineWidth = 5 * currentScale;
          ctx.lineCap = 'round';
          ctx.shadowColor = 'rgba(255,216,77,0.5)';
          ctx.shadowBlur = 8 * currentScale;
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(tsx, tsy + 6 * currentScale);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (onScreen) {
        // 목표가 보이면: 목표 위에 통통 튀는 노란 화살표 ▼ + 바닥 강조 링
        ctx.save();
        // 바닥 강조 링 (맥동)
        const ringPulse = 1 + 0.18 * Math.sin(Date.now()/280);
        ctx.strokeStyle = 'rgba(255,216,77,0.85)';
        ctx.lineWidth = 3 * currentScale;
        ctx.beginPath();
        ctx.ellipse(tsx, tsy, 26*currentScale*ringPulse, 12*currentScale*ringPulse, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,216,77,0.35)';
        ctx.lineWidth = 2 * currentScale;
        ctx.beginPath();
        ctx.ellipse(tsx, tsy, 34*currentScale*ringPulse, 16*currentScale*ringPulse, 0, 0, Math.PI*2);
        ctx.stroke();
        // 큰 화살표 ▼
        ctx.fillStyle = 'rgba(255,216,77,0.98)';
        ctx.font = `bold ${Math.round(38*currentScale)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6*currentScale;
        ctx.fillText('▼', tsx, tsy - 30*currentScale + bob);
        // "여기!" 라벨 (교차 스테이지 안내면 이동 문구)
        ctx.font = `bold ${Math.round(13*currentScale)}px sans-serif`;
        ctx.fillStyle = 'rgba(255,240,180,1)';
        ctx.textBaseline = 'bottom';
        ctx.fillText(gt._guideLabel || '여기 정화!', tsx, tsy - 64*currentScale + bob);
        ctx.restore();
      } else {
        // 목표가 화면 밖이면: 플레이어 주변에 방향 화살표
        const hsx = toScreenX(heroX, canvas), hsy = toScreenY(heroY, canvas);
        const ang = Math.atan2(tsy - hsy, tsx - hsx);
        const rad = 46 * currentScale;
        const ax = hsx + Math.cos(ang) * rad;
        const ay = hsy + Math.sin(ang) * rad;
        ctx.save();
        ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(255,216,77,0.95)';
        ctx.strokeStyle = 'rgba(80,50,0,0.6)'; ctx.lineWidth = 1.5*currentScale;
        const s = 9 * currentScale;
        ctx.beginPath();
        ctx.moveTo(s, 0); ctx.lineTo(-s*0.7, -s*0.7); ctx.lineTo(-s*0.3, 0); ctx.lineTo(-s*0.7, s*0.7);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ── 도서관 실내: 계단/문 [F] 안내 ──
  if (stage.interior) {
    let hintTxt = null;
    const _stair = getNearStair();
    if (_stair) {
      hintTxt = (_stair.dir === 'up') ? '[F] 3층 올라가기' : '[F] 1층 내려가기';
    } else if (isNearLibraryDoor()) {
      hintTxt = '[F] 나가기';
    }
    if (hintTxt) {
      const sc = currentScale;
      const fs = Math.round(13 * sc);
      ctx.save();
      ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
      const tw = ctx.measureText(hintTxt).width + 16 * sc;
      const th = fs + 12 * sc;
      const bx = canvas.width / 2 - tw / 2;
      const by = canvas.height - th - 24 * sc;
      ctx.fillStyle = 'rgba(20,12,4,0.88)';
      ctx.strokeStyle = 'rgba(200,144,42,0.9)';
      ctx.lineWidth = 1.5 * sc;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, by, tw, th, 6 * sc); ctx.fill(); ctx.stroke(); }
      else { ctx.fillRect(bx, by, tw, th); ctx.strokeRect(bx, by, tw, th); }
      ctx.fillStyle = '#f0c040';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(hintTxt, canvas.width / 2, by + th / 2 + 1);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }
  }

  // ── 출구 표시 ──
  renderExitIndicators(ctx, canvas, stage);

  // ── 화면 위험 비네트 (HP 25% 미만) ── renderHP보다 먼저 그려야 HP바가 위에 표시됨
  renderDangerVignette(ctx, canvas);

  // ── 체력바 (HUD) ──
  renderHP(ctx, canvas);

  // ── 미니맵 (왼쪽 위) ──
  // 퀘스트 상태와 목적지 정보를 공유하는 신규 내비게이션 미니맵을 우선 사용한다.
  // 런타임 주입에 실패해도 기존 미니맵으로 안전하게 폴백한다.
  if (typeof window.BD_renderNavigationMinimap === 'function') {
    window.BD_renderNavigationMinimap(ctx, canvas);
  } else {
    renderMinimap(ctx, canvas);
  }

  // ── 빌드 버전 배지 (우하단) — (v147) 개발용이라 에디터가 열려 있을 때만 그린다 ──
  try { if (document.body.classList.contains('bd-editor-open')) {
    ctx.save();
    ctx.font = `bold ${Math.round(12*currentScale)}px monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255,220,120,0.85)';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3 * currentScale;
    const _vtxt = 'BUILD ' + ((document.title.match(/v\d+/) || ['v?'])[0]);   // (v249) 실버전 동기
    ctx.strokeText(_vtxt, canvas.width - 10, canvas.height - 8);
    ctx.fillText(_vtxt, canvas.width - 10, canvas.height - 8);
    ctx.restore();
  } } catch(e){}

  // ── 추적 HUD 위치를 EXP 바 아래로 매 프레임 맞춤 (전체화면/큰 화면 겹침 방지) ──
  try {
    const _hud = document.getElementById('bd-quest-hud');
    if(_hud && _hud.style.display === 'block' && window.__bdExpBarBottom){
      const _rect = canvas.getBoundingClientRect();
      const _scaleY = _rect.height / canvas.height;
      const _scaleX = _rect.width / canvas.width;
      const _cssY = _rect.top + window.__bdExpBarBottom * _scaleY;
      _hud.style.top = Math.round(_cssY + 10) + 'px';
      // 왼쪽도 EXP 바와 같은 위치에 맞춤 (체력바처럼 화면에서 약간 떨어지게)
      if(window.__bdExpBarLeft != null){
        const _cssX = _rect.left + window.__bdExpBarLeft * _scaleX;
        _hud.style.left = Math.round(_cssX + 4) + 'px';
      }
    }
  } catch(e){}
}

/* ── 미니맵 ──────────────────────────────────────────
   왼쪽 위에 표시. 현재 스테이지의 건물/출구/플레이어 위치와
   5개 구역(중앙+북/남/서/동문)의 월드 배치를 함께 보여준다. */
function renderMinimap(ctx, canvas) {
  const sc = currentScale;
  const stage = STAGES[currentStage];
  if (!stage) return;

  ctx.save();

  // ── 레이아웃 상수 ──
  const PAD       = 14 * sc;        // 화면 가장자리 여백 (HP바와 동일)
  const HP_OFFSET = 48 * sc;        // HP 패널 아래로 내리기 위한 간격
  const MAP_SIDE  = 116 * sc;       // 로컬 맵 정사각형 한 변
  const INNER_PAD = 8 * sc;         // 패널 내부 여백
  const WORLD_H   = 40 * sc;        // 월드 오버뷰 영역 높이
  const GAP       = 6 * sc;         // 로컬맵 ↔ 월드 간격
  const CORNER    = 8 * sc;

  const W = canvas.width;
  const panelW = MAP_SIDE + INNER_PAD * 2;
  const panelX = W - PAD - panelW;
  const panelY = PAD;
  const panelH = MAP_SIDE + GAP + WORLD_H + INNER_PAD * 2;

  // ── 패널 배경 (HP바와 동일한 글라스모피즘 톤) ──
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur  = 16 * sc;
  ctx.shadowOffsetX = 2 * sc;
  ctx.shadowOffsetY = 3 * sc;
  const pg = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
  pg.addColorStop(0, 'rgba(18, 10, 3, 0.82)');
  pg.addColorStop(1, 'rgba(10, 5, 1,  0.90)');
  ctx.fillStyle = pg;
  roundRect(ctx, panelX, panelY, panelW, panelH, CORNER);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  // 금색 테두리
  ctx.strokeStyle = 'rgba(200, 144, 42, 0.85)';
  ctx.lineWidth = 1.5 * sc;
  roundRect(ctx, panelX, panelY, panelW, panelH, CORNER);
  ctx.stroke();

  // ── 로컬 맵 영역 ──
  const mapX = panelX + INNER_PAD;
  const mapY = panelY + INNER_PAD;
  const mmx = r => mapX + r * MAP_SIDE;
  const mmy = r => mapY + r * MAP_SIDE;

  // 로컬 맵 바닥
  ctx.fillStyle = 'rgba(70, 92, 52, 0.55)';   // 잔디 톤
  roundRect(ctx, mapX, mapY, MAP_SIDE, MAP_SIDE, 4 * sc);
  ctx.fill();
  // 클리핑하여 맵 밖으로 안 나가게
  ctx.save();
  roundRect(ctx, mapX, mapY, MAP_SIDE, MAP_SIDE, 4 * sc);
  ctx.clip();

  // 건물 그리기 (벽 제외)
  for (const obj of stage.objects) {
    if (obj.type !== 'building') continue;
    let fill = 'rgba(150, 120, 80, 0.9)';   // 기본
    if (obj.interactable === 'shop')  fill = 'rgba(225, 170, 70, 0.92)';
    if (obj.interactable === 'quest') fill = 'rgba(120, 175, 230, 0.92)';
    // (v278) 버스 중심 이동과 정합 — 정류장은 하늘색, 안내 시설은 금색으로 한눈에
    if (obj.interactable === 'facility' || obj.placementId) fill = 'rgba(246, 200, 84, 0.95)';
    if (obj.busStopId) fill = 'rgba(96, 188, 255, 0.95)';
    ctx.fillStyle = fill;
    const bx = mmx(obj.rx), by = mmy(obj.ry);
    const bw = obj.rw * MAP_SIDE, bh = obj.rh * MAP_SIDE;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(40, 26, 8, 0.8)';
    ctx.lineWidth = 1 * sc;
    ctx.strokeRect(bx, by, bw, bh);
  }
  ctx.restore(); // 클립 해제

  // 로컬 맵 테두리
  ctx.strokeStyle = 'rgba(200, 144, 42, 0.6)';
  ctx.lineWidth = 1 * sc;
  roundRect(ctx, mapX, mapY, MAP_SIDE, MAP_SIDE, 4 * sc);
  ctx.stroke();

  // 활성 출구 표시 (가장자리 화살표)
  ctx.fillStyle = 'rgba(240, 184, 48, 0.95)';
  const ar = 5 * sc;  // 화살표 크기
  const cxm = mapX + MAP_SIDE / 2, cym = mapY + MAP_SIDE / 2;
  const drawArrow = (dir) => {
    ctx.beginPath();
    if (dir === 'top') {
      ctx.moveTo(cxm, mapY + 1*sc);
      ctx.lineTo(cxm - ar, mapY + ar + 1*sc);
      ctx.lineTo(cxm + ar, mapY + ar + 1*sc);
    } else if (dir === 'bottom') {
      ctx.moveTo(cxm, mapY + MAP_SIDE - 1*sc);
      ctx.lineTo(cxm - ar, mapY + MAP_SIDE - ar - 1*sc);
      ctx.lineTo(cxm + ar, mapY + MAP_SIDE - ar - 1*sc);
    } else if (dir === 'left') {
      ctx.moveTo(mapX + 1*sc, cym);
      ctx.lineTo(mapX + ar + 1*sc, cym - ar);
      ctx.lineTo(mapX + ar + 1*sc, cym + ar);
    } else if (dir === 'right') {
      ctx.moveTo(mapX + MAP_SIDE - 1*sc, cym);
      ctx.lineTo(mapX + MAP_SIDE - ar - 1*sc, cym - ar);
      ctx.lineTo(mapX + MAP_SIDE - ar - 1*sc, cym + ar);
    }
    ctx.closePath();
    ctx.fill();
  };
  ['top','bottom','left','right'].forEach(d => {
    if (stage.exits && stage.exits[d] && stage.exits[d].active) drawArrow(d);
  });

  // ── 위험요소는 항상 미니맵에 표시 (플레이어 마커처럼) ──
  // 미정화=빨강⚠(맥동), 정화=초록
  for (const obj of stage.objects) {
    if (obj.interactable !== 'hazard') continue;
    if (obj.hidden || obj.__bdGone) continue;   /* (v287) 숨김·소멸 위험요소 미니맵 제외 */
    if (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(obj)) continue; // 잠긴 보스는 숨김
    const ox = mmx(Math.max(0.02, Math.min(0.98, (obj.rx||0) + (obj.rw||0)/2)));
    const oy = mmy(Math.max(0.02, Math.min(0.98, (obj.ry||0) + (obj.rh||0)/2)));
    let purified = false;
    try { purified = _objPurified(obj); } catch(e){}
    // 미정화는 맥동 링 먼저 (점 뒤에)
    if (!purified) {
      const pulse = 4 + 2 * Math.sin(Date.now()/300);
      ctx.strokeStyle = 'rgba(255,60,50,0.7)';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.arc(ox, oy, pulse * sc, 0, Math.PI * 2);
      ctx.stroke();
    }
    // 점 (플레이어 마커처럼, 크고 선명하게)
    ctx.fillStyle = purified ? 'rgba(120,230,150,1)' : 'rgba(255,60,50,1)';
    ctx.beginPath();
    ctx.arc(ox, oy, 4 * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.5 * sc;
    ctx.beginPath();
    ctx.arc(ox, oy, 4 * sc, 0, Math.PI * 2);
    ctx.stroke();
  }
  // ── NPC 위치 표시 (v136) — 임현지·정도현이 있는 스테이지에서만 ──
  try {
    if (currentStage === NPC_STAGE && typeof NPC_X !== 'undefined') {
      const nx = mmx(Math.max(0.02, Math.min(0.98, NPC_X)));
      const ny = mmy(Math.max(0.02, Math.min(0.98, NPC_Y)));
      ctx.fillStyle = 'rgba(167,139,250,1)';   // 보라색 — 위험요소(빨강)와 구분
      ctx.beginPath(); ctx.arc(nx, ny, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1 * sc;
      ctx.beginPath(); ctx.arc(nx, ny, 3.5 * sc, 0, Math.PI * 2); ctx.stroke();
    }
    if (currentStage === QNPC_STAGE && typeof QNPC_X !== 'undefined') {
      const qx = mmx(Math.max(0.02, Math.min(0.98, QNPC_X)));
      const qy = mmy(Math.max(0.02, Math.min(0.98, QNPC_Y)));
      ctx.fillStyle = 'rgba(167,139,250,1)';
      ctx.beginPath(); ctx.arc(qx, qy, 3.5 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1 * sc;
      ctx.beginPath(); ctx.arc(qx, qy, 3.5 * sc, 0, Math.PI * 2); ctx.stroke();
    }
  } catch(e){}

  // ── 목표 지점 별은 추적 임무가 있을 때만 (여기로 가세요) ──
  if (window.BD && window.BD.trackedQuest) {
    const guideTarget = getGuideTarget();
    if (guideTarget) {
      const tx = mmx(Math.max(0, Math.min(1, (guideTarget.rx||0) + (guideTarget.rw||0)/2)));
      const ty = mmy(Math.max(0, Math.min(1, (guideTarget.ry||0) + (guideTarget.rh||0)/2)));
      const pulse = 4 + 2 * Math.sin(Date.now()/250);
      ctx.strokeStyle = 'rgba(255,216,77,0.9)';
      ctx.lineWidth = 1.5 * sc;
      ctx.beginPath();
      ctx.arc(tx, ty, pulse * sc, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,216,77,1)';
      ctx.font = `bold ${Math.round(9*sc)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('★', tx, ty);
    }
  }

  // 플레이어 위치 (빛나는 점)
  const hx = mmx(Math.max(0, Math.min(1, heroX)));
  const hy = mmy(Math.max(0, Math.min(1, heroY)));
  ctx.shadowColor = 'rgba(120, 204, 255, 0.95)';
  ctx.shadowBlur  = 6 * sc;
  ctx.fillStyle   = '#7fd0ff';
  ctx.beginPath();
  ctx.arc(hx, hy, 3.2 * sc, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1 * sc;
  ctx.beginPath();
  ctx.arc(hx, hy, 3.2 * sc, 0, Math.PI * 2);
  ctx.stroke();

  // ── 월드 오버뷰 (5개 구역 십자 배치) ──
  const woY = mapY + MAP_SIDE + GAP;
  const woX = mapX;
  const woW = MAP_SIDE;
  // 구분선
  ctx.strokeStyle = 'rgba(200, 144, 42, 0.35)';
  ctx.lineWidth = 1 * sc;
  ctx.beginPath();
  ctx.moveTo(woX, woY - GAP/2);
  ctx.lineTo(woX + woW, woY - GAP/2);
  ctx.stroke();

  // 십자 격자: 3x3 칸 중 5칸 사용
  //  . 2 .
  //  4 1 5
  //  . 3 .
  const cellGrid = {
    1: [1, 1], 2: [1, 0], 3: [1, 2], 4: [0, 1], 5: [2, 1],
  };
  const node = 7 * sc;                    // 노드 한 변
  const colGap = (woW - node * 3) / 2;     // 가로 간격
  const rowGap = (WORLD_H - node * 3) / 2; // 세로 간격
  const cellCenter = (gx, gy) => [
    woX + gx * (node + colGap) + node / 2,
    woY + gy * (node + rowGap) + node / 2,
  ];

  // 연결선 (중앙 1번에서 각 문으로)
  const [c1x, c1y] = cellCenter(...cellGrid[1]);
  ctx.strokeStyle = 'rgba(200, 144, 42, 0.45)';
  ctx.lineWidth = 1.2 * sc;
  [2, 3, 4, 5].forEach(id => {
    const [nx, ny] = cellCenter(...cellGrid[id]);
    ctx.beginPath();
    ctx.moveTo(c1x, c1y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  });

  // 노드
  for (const id in cellGrid) {
    const sid = Number(id);
    const [nx, ny] = cellCenter(...cellGrid[sid]);
    const isCur = (sid === currentStage);
    if (isCur) {
      ctx.shadowColor = 'rgba(240,184,48,0.9)';
      ctx.shadowBlur = 7 * sc;
      ctx.fillStyle = '#f0b830';
    } else {
      ctx.fillStyle = 'rgba(150, 120, 80, 0.85)';
    }
    roundRect(ctx, nx - node/2, ny - node/2, node, node, 2 * sc);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isCur ? 'rgba(255,240,200,0.95)' : 'rgba(40,26,8,0.7)';
    ctx.lineWidth = 1 * sc;
    roundRect(ctx, nx - node/2, ny - node/2, node, node, 2 * sc);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHeroFallback(ctx, x, y, w, h) {
  ctx.fillStyle = '#e55';
  ctx.fillRect(x + w*0.2, y + h*0.1, w*0.6, h*0.7);
  ctx.fillStyle = '#fdb';
  ctx.fillRect(x + w*0.25, y, w*0.5, h*0.35);
}

function renderExitIndicators(ctx, canvas, stage) {
  const W = canvas.width, H = canvas.height;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,80,0.55)';
  ctx.strokeStyle = 'rgba(255,220,0,0.9)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6,4]);

  // 출구는 맵 가장자리에 표시 - 카메라 뷰에 보일 때만
  const markW = 0.12, markH = 0.015;
  const dirs = [
    { key:'top',    mx:0.5-markW/2, my:0,         mw:markW, mh:markH },
    { key:'bottom', mx:0.5-markW/2, my:1-markH,   mw:markW, mh:markH },
    { key:'left',   mx:0,           my:0.5-markW/2, mw:markH, mh:markW },
    { key:'right',  mx:1-markH,     my:0.5-markW/2, mw:markH, mh:markW },
  ];
  for (const d of dirs) {
    if (stage.exits[d.key] && stage.exits[d.key].active) {
      const sx = toScreenX(d.mx, canvas);
      const sy = toScreenY(d.my, canvas);
      const sw = toScreenW(d.mw, canvas);
      const sh = toScreenH(d.mh, canvas);
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);
    }
  }
  ctx.restore();

  // ── 대시 쿨다운 HUD ── (v199) 대시 기능 제거로 비표시
  if (false) {
    const hudSize = 28 * currentScale;
    const hudX = 14 * currentScale;
    const hudY = canvas.height - 14 * currentScale - hudSize;
    const cx = hudX + hudSize / 2;
    const cy = hudY + hudSize / 2;
    const r = Math.max(1, hudSize / 2 - 2);   // (v160) 음수 반지름 방어 (초소형 화면)

    // 배경 원
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fill();

    // 쿨다운 비율
    const coolRatio = dashCooldownTimer > 0 ? dashCooldownTimer / getDashCooldown() : 0;
    const ready = (dashCooldownTimer <= 0 || (heroClass === 'rogue' && dashCharges > 0)) && !isDashing;

    if (coolRatio > 0) {
      // 쿨다운 진행 호 (회색)
      ctx.fillStyle = 'rgba(80,80,80,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (1 - coolRatio) * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // 준비 완료: 밝은 원
      ctx.fillStyle = isDashing ? 'rgba(100,200,255,0.6)' : 'rgba(100,200,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 테두리
    ctx.strokeStyle = ready ? 'rgba(100,200,255,0.9)' : 'rgba(150,150,150,0.5)';
    ctx.lineWidth = 1.5 * currentScale;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Shift 글자
    const qSize = Math.round(11 * currentScale);
    ctx.font = `bold ${qSize}px 'Noto Serif KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ready ? '#fff' : 'rgba(200,200,200,0.5)';
    ctx.fillText('⇧', cx, cy + 1);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';

    // 도적 전용: 남은 충전 횟수 점 표시
    if (heroClass === 'rogue') {
      const maxC = 2, dotR = 3 * currentScale, dotGap = 8 * currentScale;
      const dotY = hudY + hudSize + 5 * currentScale;
      const dotStartX = cx - ((maxC - 1) * dotGap) / 2;
      for (let i = 0; i < maxC; i++) {
        const filled = (dashCharges > 0 && dashCooldownTimer > 0)
          ? i < dashCharges      // 충전 중: 남은 충전만 밝게
          : (dashCooldownTimer <= 0 ? i === 0 : false); // 쿨완료: 첫 점 표시
        ctx.fillStyle = filled ? 'rgba(100,220,255,0.95)' : 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(dotStartX + i * dotGap, dotY, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Z키 (고장난 하드웨어) HUD ──
  if (hasBrokenHW) {
    const hudSize = 28 * currentScale;
    const gap     = 6 * currentScale;
    const hudX    = 14 * currentScale + hudSize + gap;
    const hudY    = canvas.height - 14 * currentScale - hudSize;
    const cx = hudX + hudSize / 2;
    const cy = hudY + hudSize / 2;
    const r  = hudSize / 2 - 2;

    const zReady    = !hwSkillActive && hwSkillCooldown <= 0;
    const zActive   = hwSkillActive;
    const cdRatio   = hwSkillCooldown > 0 ? hwSkillCooldown / HW_SKILL_CD_MS : 0;
    const actRatio  = hwSkillActive   ? hwSkillTimer    / HW_SKILL_DURATION  : 0;

    // 배경 원
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fill();

    if (cdRatio > 0) {
      // 쿨다운 중 (회색 오버레이)
      ctx.fillStyle = 'rgba(80,80,80,0.7)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (1 - cdRatio) * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    } else if (zActive) {
      // 발동 중: 보라색 활성 오버레이
      ctx.fillStyle = 'rgba(153,102,204,0.55)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (1 - actRatio) * Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // 준비 완료
      ctx.fillStyle = 'rgba(153,102,204,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 테두리
    ctx.strokeStyle = zReady ? 'rgba(200,150,255,0.9)' : zActive ? 'rgba(200,150,255,0.6)' : 'rgba(150,150,150,0.4)';
    ctx.lineWidth = 1.5 * currentScale;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Z 글자
    const zSize = Math.round(13 * currentScale);
    ctx.font = `bold ${zSize}px 'Noto Serif KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = zReady ? '#cc88ff' : zActive ? '#fff' : 'rgba(200,200,200,0.4)';
    ctx.fillText('Z', cx, cy + 1);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
}

/* ── 대시 시작 ── */
/* (v379) §8 대시 기능 완전 제거 — 트리거(입력)는 v199 에서 이미 제거됐고, 여기서 실행부를 삭제한다.
   isDashing 은 항상 false 로 유지되어 이동은 일반 경로(tryMove)만 사용한다. */
function startDash() { return; }
function __bdRemovedDash() {
  // 도적: 충전이 남아있으면 쿨다운 무시하고 바로 사용
  const rogueCharged = heroClass === 'rogue' && dashCharges > 0;
  if (isDashing || (!rogueCharged && dashCooldownTimer > 0) || shopOpen || transitioning) return;
  let dx = 0, dy = 0;
  // 현재 누르고 있는 방향키로 대시 방향 결정
  if (moveKeys.w) dy -= 1;
  if (moveKeys.s) dy += 1;
  if (moveKeys.a) dx -= 1;
  if (moveKeys.d) dx += 1;
  // 아무 키도 안 누르고 있으면 마지막 바라보는 방향으로
  if (dx === 0 && dy === 0) {
    if (lastDir === 'back')  dy = -1;
    else if (lastDir === 'front') dy = 1;
    else if (lastDir === 'left')  dx = -1;
    else if (lastDir === 'right') dx = 1;
    else dy = 1; // fallback
  }
  // 대각선 정규화
  const len = Math.sqrt(dx * dx + dy * dy);
  dashDirX = dx / len;
  dashDirY = dy / len;
  // 방향 업데이트 (대각선은 수평 우선)
  if (Math.abs(dx) >= Math.abs(dy)) {
    lastDir = dx > 0 ? 'right' : 'left';
  } else {
    lastDir = dy > 0 ? 'front' : 'back';
  }
  isDashing = true;
  dashTimer = DASH_DURATION;

  if (heroClass === 'rogue') {
    if (rogueCharged) {
      // 충전 소비 (쿨다운은 이미 돌고 있으므로 그대로)
      dashCharges--;
    } else {
      // 충전 없음 → 쿨다운 시작 + 나머지 1충전 지급
      dashCooldownTimer = getDashCooldown();
      dashCharges = 1; // 이번 쿨타임에 1번 더 쓸 수 있음
    }
  } else {
    dashCooldownTimer = getDashCooldown();
  }

  DASH_GHOSTS.length = 0;
  questProgress('dash', 1);
  achieveTrack('dash', 1);

  // 고장난 하드웨어 스킬 중 대시 → HP 2 감소
  if (hwSkillActive) {
    syncSharedHP(Math.max(1, heroHP - 2), false);
    _hpFlashTimer = HP_FLASH_DURATION;
  }

  // 사이버 싸이코 저주: 7번 대시마다 HP 10 감소
  if (achieveDone['h_cyber_psycho']) {
    _cyberDashCount = (_cyberDashCount || 0) + 1;
    if (_cyberDashCount >= 7) {
      _cyberDashCount = 0;
      syncSharedHP(Math.max(1, heroHP - 5), false);
      _hpFlashTimer = HP_FLASH_DURATION;
      showShopToast('🤖 사이버 싸이코 저주 -5 HP');
    }
  }
}

/* ── 게임 루프 ── */
/* ════════════════════════════════════════════════════════
   필드 몹 시스템 — 배회하다 일정 범위 안에 들어오면
   플레이어를 추적하고 공격하는 위협체(들개)
   ════════════════════════════════════════════════════════ */
const MOB_MAX_HP        = 30;
const MOB_AGGRO_RANGE   = 0.22;   // 이 거리 안에 들어오면 추적 시작
const MOB_DEAGGRO_RANGE = 0.34;   // 이 거리 밖으로 멀어지면 추적 해제
const MOB_ATTACK_RANGE  = 0.055;  // 공격 사거리
const MOB_ATTACK_CD     = 900;    // 공격 쿨타임(ms)
const MOB_DAMAGE        = 8;       // 플레이어가 받는 피해
const MOB_WANDER_SPEED  = 0.0005;
const MOB_CHASE_SPEED   = 0.0014;
const MOB_RESPAWN_MS    = 5000;
const MOB_FLASH_FRAMES  = 8;

// 스테이지별 몹 스폰 위치 (실내/허수아비 훈련장 제외)
const MOB_SPAWNS = {};

let _mobs = [];

function _makeMob(hx, hy) {
  return {
    x: hx, y: hy, homeX: hx, homeY: hy,
    hp: MOB_MAX_HP, alive: true, deathTime: 0,
    state: 'wander', dir: 'front',
    wanderTX: hx, wanderTY: hy, wanderTimer: 0,
    lastAttack: 0, flashTimer: 0, lungeTimer: 0,
  };
}

function _spawnMobsForStage(stageId) {
  _mobs = [];
  if (typeof _arrows !== 'undefined') _arrows.length = 0;
  const defs = MOB_SPAWNS[stageId];
  if (!defs) return;
  /* (v381) 필드 몹 제거 */
}

function _mobTryMove(m, dx, dy) {
  const nx = Math.max(0.02, Math.min(0.98, m.x + dx));
  const ny = Math.max(0.02, Math.min(0.98, m.y + dy));
  if (!_collidesAt(nx, m.y)) m.x = nx;
  if (!_collidesAt(m.x, ny)) m.y = ny;
}

function _faceDir(dx, dy) {
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'back' : 'front');
}

/** 매 프레임 몹 갱신 */
function updateMobs() {
  const stage = STAGES[currentStage];
  if (!stage || stage.interior || !MOB_SPAWNS[currentStage]) return;
  // 패널이 열려 있으면 몹 정지(공격/이동 멈춤)
  const paused = (typeof shopOpen !== 'undefined' && shopOpen) ||
                 (typeof invOpen !== 'undefined' && invOpen) ||
                 (typeof questPanelOpen !== 'undefined' && questPanelOpen);
  const now = Date.now();

  for (const m of _mobs) {
    if (m.flashTimer > 0) m.flashTimer--;
    if (m.lungeTimer > 0) m.lungeTimer--;

    if (!m.alive) {
      if (now - m.deathTime >= MOB_RESPAWN_MS) {
        m.x = m.homeX; m.y = m.homeY; m.hp = MOB_MAX_HP;
        m.alive = true; m.state = 'wander'; m.wanderTimer = 0;
      }
      continue;
    }
    if (paused) continue;

    const dx = heroX - m.x, dy = heroY - m.y;
    const dist = Math.hypot(dx, dy);

    if (m.state === 'wander' && dist <= MOB_AGGRO_RANGE) m.state = 'chase';
    else if (m.state === 'chase' && dist > MOB_DEAGGRO_RANGE) m.state = 'wander';

    if (m.state === 'chase') {
      if (dist <= MOB_ATTACK_RANGE) {
        if (now - m.lastAttack >= MOB_ATTACK_CD) {
          m.lastAttack = now;
          m.lungeTimer = 8;
          if (heroHP > 0) takeDamage(MOB_DAMAGE);
        }
      } else {
        const inv = 1 / (dist || 1);
        _mobTryMove(m, dx * inv * MOB_CHASE_SPEED, dy * inv * MOB_CHASE_SPEED);
      }
      m.dir = _faceDir(dx, dy);
    } else {
      m.wanderTimer--;
      if (m.wanderTimer <= 0) {
        const r = 0.10;
        m.wanderTX = Math.max(0.05, Math.min(0.95, m.homeX + (Math.random() * 2 - 1) * r));
        m.wanderTY = Math.max(0.05, Math.min(0.95, m.homeY + (Math.random() * 2 - 1) * r));
        m.wanderTimer = 90 + (Math.random() * 120 | 0);
      }
      const wdx = m.wanderTX - m.x, wdy = m.wanderTY - m.y;
      const wd = Math.hypot(wdx, wdy);
      if (wd > 0.012) {
        const inv = 1 / wd;
        _mobTryMove(m, wdx * inv * MOB_WANDER_SPEED, wdy * inv * MOB_WANDER_SPEED);
        m.dir = _faceDir(wdx, wdy);
      }
    }
  }
}

/** 몹에 데미지 */
function _damageMob(m, dmg) {
  m.flashTimer = MOB_FLASH_FRAMES;
  m.hp -= dmg;
  if (m.hp <= 0) {
    m.hp = 0; m.alive = false; m.deathTime = Date.now();
    if (typeof playerGold !== 'undefined') playerGold += 5;
    if (typeof addSafetyXP === 'function') addSafetyXP(5);
    if (typeof achieveTrack === 'function') { try { achieveTrack('kill', 1); } catch(e){} }
    if (typeof showShopToast === 'function') showShopToast('💀 들개를 물리쳤다!  +5G');
  }
}

/** 부채꼴 범위 안 몹 타격 (근접 직업) */
function _hitMobsCone(range, halfAngle, dmg) {
  if (!MOB_SPAWNS[currentStage]) return;
  const dirAngles = { front: Math.PI/2, back: -Math.PI/2, left: Math.PI, right: 0 };
  const base = dirAngles[lastDir] ?? Math.PI/2;
  for (const m of _mobs) {
    if (!m.alive) continue;
    const vx = m.x - heroX, vy = m.y - heroY;
    const d = Math.hypot(vx, vy);
    if (d > range) continue;
    let diff = Math.atan2(vy, vx) - base;
    while (diff >  Math.PI) diff -= 2*Math.PI;
    while (diff < -Math.PI) diff += 2*Math.PI;
    if (Math.abs(diff) <= halfAngle) _damageMob(m, dmg);
  }
}

/** 특정 지점 반경 안 몹 타격 (화살/마법) — 1마리 명중 시 true */
function _hitMobAt(x, y, radius, dmg) {
  if (!MOB_SPAWNS[currentStage]) return false;
  for (const m of _mobs) {
    if (!m.alive) continue;
    const dx = m.x - x, dy = m.y - y;
    if (dx*dx + dy*dy <= radius*radius) { _damageMob(m, dmg); return true; }
  }
  return false;
}

/** 위협체(들개) 그리기 */
function drawMob(ctx, canvas, m) {
  if (!m.alive) return;
  const sc = currentScale * (window.BD_SPR || 1);   // (v205) 맵 비례
  const sx = toScreenX(m.x, canvas);
  const sy = toScreenY(m.y, canvas);
  const w = 36 * sc, h = 30 * sc;

  // 돌진 오프셋
  let ox = 0, oy = 0;
  if (m.lungeTimer > 0) {
    const dx = heroX - m.x, dy = heroY - m.y; const d = Math.hypot(dx, dy) || 1;
    const k = (m.lungeTimer / 8) * 7 * sc;
    ox = dx / d * k; oy = dy / d * k;
  }
  const cx = sx + ox, by = sy + oy;

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(sx, sy + 2, w * 0.4, w * 0.15, 0, 0, Math.PI*2); ctx.fill();

  const flash = m.flashTimer > 0;
  const bodyColor = flash ? '#ff6a5a' : '#2b2030';

  // 다리
  ctx.fillStyle = '#150f1c';
  ctx.fillRect(cx - w*0.26, by - h*0.16, w*0.11, h*0.18);
  ctx.fillRect(cx + w*0.15, by - h*0.16, w*0.11, h*0.18);

  // 몸통
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(cx, by - h*0.42, w*0.42, h*0.30, 0, 0, Math.PI*2); ctx.fill();
  // 등 가시
  ctx.fillStyle = '#150f1c';
  for (let i = -1; i <= 1; i++) {
    const gx = cx + i * w*0.18;
    ctx.beginPath();
    ctx.moveTo(gx - 3*sc, by - h*0.66);
    ctx.lineTo(gx, by - h*0.86);
    ctx.lineTo(gx + 3*sc, by - h*0.66);
    ctx.closePath(); ctx.fill();
  }

  // 머리
  const sideways = (m.dir === 'left' ? -1 : (m.dir === 'right' ? 1 : 0));
  const hx = cx + sideways * w*0.34;
  const hy = by - h*0.58;
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(hx, hy, w*0.24, h*0.22, 0, 0, Math.PI*2); ctx.fill();
  // 귀(뿔)
  ctx.fillStyle = '#150f1c';
  ctx.beginPath(); ctx.moveTo(hx - w*0.16, hy - h*0.10); ctx.lineTo(hx - w*0.06, hy - h*0.34); ctx.lineTo(hx,            hy - h*0.10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx,            hy - h*0.10); ctx.lineTo(hx + w*0.06, hy - h*0.34); ctx.lineTo(hx + w*0.16, hy - h*0.10); ctx.closePath(); ctx.fill();
  // 눈(붉은 발광)
  ctx.fillStyle = (m.state === 'chase') ? '#ff2a18' : '#ff9070';
  ctx.shadowColor = 'rgba(255,40,20,0.9)';
  ctx.shadowBlur = (m.state === 'chase' ? 7 : 3) * sc;
  ctx.beginPath(); ctx.arc(hx - w*0.08, hy + h*0.02, 2.3*sc, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + w*0.08, hy + h*0.02, 2.3*sc, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;

  // HP 바
  const barW = w*0.9, barH = 4*sc;
  const barX = cx - barW/2, barY = by - h*0.95 - 9*sc;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#e0463a'; ctx.fillRect(barX, barY, barW * (m.hp / MOB_MAX_HP), barH);
  ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);

  // 이름 / 추적 표시
  const fs = Math.round(10 * sc);
  ctx.font = `bold ${fs}px 'Noto Serif KR', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = (m.state === 'chase') ? '#ff7a6a' : '#c9bcc9';
  ctx.fillText((m.state === 'chase') ? '들개 ❗' : '들개', cx, barY - 3*sc);
  ctx.textAlign = 'left';
}

function gameLoop(_fromRAF) {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  // (v178) 이동 속도가 실행 상황(처음 시작 / 타이틀 복귀)마다 달라지던 버그 수정.
  // 원인: gameLoop/forceRender가 여러 경로에서 호출되며 requestAnimationFrame 체인이 여러 개
  // 겹쳐 돌아, 한 프레임에 이동 로직(tryMove)이 2~3회 실행돼 속도가 배가됐다.
  // 해결: RAF 구동 체인은 항상 하나만 유지한다. RAF가 아닌 직접 호출(forceRender 등)은
  // 이동/타이머 등 게임 상태를 진행시키지 않고 화면만 다시 그린다.
  if (_fromRAF !== true) {
    // 외부 직접 호출: 진행 중인 RAF 체인이 없을 때만 새로 시작. 있으면 이번엔 그냥 반환(중복 예약 금지).
    if (window.__gameLoopChainAlive) { return; }
  }

  // 캔버스 해상도 동기화 — (v163+) devicePixelRatio 반영으로 고해상도 화면에서 선명하게
  {
    let dpr = Math.min((navigator.maxTouchPoints > 0 ? 1.5 : 2), Math.max(1, window.devicePixelRatio || 1));   // 상한 2, 터치 기기 1.5 (v377 — 태블릿 메모리·GPU 보호)
    /* (v398) 픽셀 예산 — 터치 기기에서 채우기 비용이 프레임 예산(16.7ms)을 아슬아슬하게
       넘겨 60fps 와 30fps 를 오간다(체감상 «툭툭»).
       852x340·DPR3 이동 중 실측(헤드리스 데스크탑, 예산만 바꾼 스윕):
         1.60Mpx → 42.9fps  p95 33ms  jank 77
         1.30Mpx → 51.2fps  p95 33ms  jank 39
         1.05Mpx → 58.4fps  p95 17ms  jank  7
         0.85Mpx → 60.0fps  p95 17ms  jank  0   ← 무릎. 아래로는 이득 없이 선명도만 손해
         0.70Mpx → 59.9fps  p95 17ms  jank  0
       선명도보다 부드러움을 우선한다. 화면 크기가 아니라 «면적»으로 상한을 두므로
       작은 폰부터 큰 태블릿까지 같은 규칙이 적용된다.
       주의: 위 수치는 데스크탑 기준이다. 중급 폰은 여유가 더 필요할 수 있으므로
       실기기 ?perf=1 결과를 보고 window.BD_PX_BUDGET 으로 조정한다. */
    if (navigator.maxTouchPoints > 0) {
      const budget = Number(window.BD_PX_BUDGET) || 0.85e6;
      const area = canvas.offsetWidth * canvas.offsetHeight * dpr * dpr;
      if (area > budget) dpr *= Math.sqrt(budget / area);
    }
    // (봉담 신규 맵) 짝수 백버퍼로 중앙 원점의 0.5px 어긋남을 방지한다.
    const wantW = Math.max(2, Math.round((canvas.offsetWidth  * dpr) / 2) * 2);
    const wantH = Math.max(2, Math.round((canvas.offsetHeight * dpr) / 2) * 2);
    if (canvas.width !== wantW || canvas.height !== wantH) {
      canvas.width  = wantW;
      canvas.height = wantH;
    }
  }

  if (!transitioning) {
    // ── 자동 회복 비활성화 ──
    // (요청에 따라 피격당하지 않을 때의 시간 경과 자동 회복을 제거함.
    //  HP는 이제 아이템·풀 속성·정화 보상 등 명시적 회복으로만 오른다.)
    // 타이머는 초기화 상태로 유지 (다른 로직 참조 대비)
    _lastDamageTime = 0;
    _lastRegenTick  = 0;


    // 고장난 하드웨어 스킬 타이머
    updateHWSkill(1000 / 60);

    // ── 허수아비 업데이트 ──
    updateScarecrow();

    // ── 필드 몹 업데이트 ──
    updateMobs();

    if (dialogueOpen) { moveKeys = { w:false, a:false, s:false, d:false }; }
    // (v139) 컷신·대화창·모달 중엔 매 프레임 이동 강제 정지 (모바일 조이스틱 등 다른 입력 경로 대비 안전장치)
    if (window.BD_isInputBlocked && window.BD_isInputBlocked()) { moveKeys = { w:false, a:false, s:false, d:false }; }
    {
      // ── 일반 이동 ── (v379: 대시 분기 제거)
      // (v237 병합) 세로는 화면 환산 배율이 작아 느려 보이므로 보정 계수를 곱한다.
      // (v237.1) 반대키 동시 입력은 순 방향이 0 — 이동/방향 전환 없음 (한쪽만 벽에 막혀 미끄러지는 것도 방지)
      const _nmx = getNetMoveX(), _nmy = getNetMoveY();
      if (_nmy < 0) { tryMove(0, -getMoveSpeedY()); lastDir = 'back'; }
      if (_nmy > 0) { tryMove(0,  getMoveSpeedY()); lastDir = 'front'; }
      if (_nmx < 0) { tryMove(-getMoveSpeed(), 0); lastDir = 'left'; }
      if (_nmx > 0) { tryMove( getMoveSpeed(), 0); lastDir = 'right'; }
    }
    updateCamera();
    checkExits();
    updateShopHint();
  }

  renderMap(canvas);
  // (v178) 다음 프레임 예약은 RAF 체인에서 온 호출일 때만. 체인을 항상 하나로 유지한다.
  if (_fromRAF === true) {
    window.__gameLoopChainAlive = true;
    __bdScheduleGameFrame();
  } else if (!window.__gameLoopChainAlive) {
    // 체인이 아직 없던 상태에서의 첫 시작(enterGameScreen 등): 체인을 개시한다.
    window.__gameLoopChainAlive = true;
    __bdScheduleGameFrame();
  }
}
/* (v368) 게임 루프 60fps 상한 — 누적기(accumulator) 방식.
   문제: gameLoop 는 프레임 기반(대시 쿨다운--, 잔상 페이드, updateHWSkill(1000/60), 이동 dt보정 하한 0.5)이라
        120/144Hz 기기에서 로직이 2~2.4배 빨리 돌았고, CPU/GPU도 그만큼 더 썼다(계측: 144Hz 모니터에서 144fps).
   해법: RAF 는 계속 받되 16.667ms 누적마다 한 번만 gameLoop 를 실행 → 어떤 주사율에서도 평균 60 로직 프레임/초.
        60Hz 이하에서는 매 프레임 그대로 실행(허용 오차 1ms). 렌더도 로직과 함께 60으로 제한된다(픽셀 RPG에 충분). */
var __bdFrameAcc = 0, __bdFrameLastT = 0, __bdLogicLastT = 0;
function __bdScheduleGameFrame(){
  gameRaf = requestAnimationFrame(function(t){
    var STEP = 1000 / 60;
    var dt = __bdFrameLastT ? (t - __bdFrameLastT) : STEP;
    __bdFrameLastT = t;
    __bdFrameAcc += Math.min(dt, 100);
    if (__bdFrameAcc < STEP - 1) { __bdScheduleGameFrame(); return; }   // 아직 1/60초 안 참 — 이번 RAF 는 건너뜀
    __bdFrameAcc -= STEP; if (__bdFrameAcc > STEP) __bdFrameAcc = STEP;
    // 로직 프레임 간격(ms) 노출 — v332 이동 dt 보정은 RAF 간격이 아니라 이 값을 써야 한다
    window.__bdLogicDt = __bdLogicLastT ? (t - __bdLogicLastT) : STEP; __bdLogicLastT = t;
    gameLoop(true);
  });
}
window.__bdScheduleGameFrame = __bdScheduleGameFrame;

/* ── 진입/종료 ── */
function enterGameScreen(name, isLoad) {
  window._gameSaved = isLoad ? true : false;
  heroName = name;
  { var _gsh = document.getElementById('gs-hero'); if (_gsh) _gsh.textContent = name; } // (v390)
  _hpFlashTimer = 0;
  _lastDamageTime = 0; _lastRegenTick = 0;
  if (!isLoad) {
    // (v240i) 새 게임 완전 초기화 — 같은 세션에서 재시작하면 이전 판의
    // 소지품·골드·전투 아이템이 남아 배지·간식이 중복되던 문제
    playerInventory = {};
    playerGold = 500;
    selectedInvItemId = null;
    try { if (window.BD) BD.items = {}; } catch (e) { }
    // 진행 중이던 대화가 남아 있으면 닫는다 — 잔류 dialogueOpen 이 새 프롤로그
    // 인트로 재생을 막아 수여식(배지·간식 지급)까지 밀리던 문제
    try { if (typeof closeDialogue === 'function') closeDialogue(); } catch (e) { }
    syncSharedHP(getMaxHP(), false);
    // (v199) 심부름 튜토리얼: 새 게임은 도서관 1층에서 시작 (완료 이력 있으면 광장)
    currentStage = (typeof window.BD_TUT2_START === 'function') ? window.BD_TUT2_START() : 1;
    var st0 = STAGES[currentStage];
    heroX = st0.spawnX !== undefined ? st0.spawnX : 0.5;
    heroY = st0.spawnY !== undefined ? st0.spawnY : 0.8;
  } else if (window.BD && typeof window.BD.hp === 'number') {
    // 슬롯에서 불러온 BD 체력을 필드 HUD에도 즉시 반영한다.
    syncSharedHP(window.BD.hp, false);
  }
  var st = STAGES[currentStage] || STAGES[1];
  camX = heroX; camY = heroY;

  // 허수아비 리셋
  _scarecrow.hp = SCARECROW_MAX_HP;
  _scarecrow.alive = true;
  _scarecrow.deathTime = 0;
  _scarecrow.lastHitTime = 0;
  _scarecrow.flashTimer = 0;
  // 필드 몹 스폰 (현재 스테이지 기준)
  _spawnMobsForStage(currentStage);
  lastDir = 'front';
  moveKeys = {w:false,a:false,s:false,d:false};
  isDashing = false; dashTimer = 0; dashCooldownTimer = 0; dashCharges = 0; DASH_GHOSTS.length = 0;
  transitioning = false;
  { var _gsl3 = document.getElementById('gs-loc'); if (_gsl3) _gsl3.textContent = st.name; } // (v390)
  document.getElementById('game-screen').style.display = 'block';

  const canvas = document.getElementById('game-canvas');
  {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width  = Math.round(canvas.offsetWidth  * dpr);
    canvas.height = Math.round(canvas.offsetHeight * dpr);
  }

  cancelAnimationFrame(gameRaf); window.__gameLoopChainAlive = false;
  loadAllImages(() => { gameLoop(); });
}
window.enterGameScreen = enterGameScreen;  // BD 타이틀에서 게임 진입에 사용

function exitGame() {
  document.getElementById('game-screen').style.display = 'none';
  cancelAnimationFrame(gameRaf); window.__gameLoopChainAlive = false;
  moveKeys = {w:false,a:false,s:false,d:false};
  // 게임오버 화면도 숨기기
  document.getElementById('gameover-screen').classList.remove('show');
  // 봉담 타이틀 화면 다시 표시 (원본 판타지 메뉴 대신)
  try {
    window.__bdTitleShown = false;
    if(typeof window.BD_showTitle === 'function'){
      window.BD_showTitle({ onStart:function(){}, onContinue:function(){} });
    }
  } catch(e){}
}

/* ── 게임 오버: 검은 화면 + 선택지 표시 ── */
/* ── (v212) 패배 완화 ──
   HP가 0이 되어도 게임오버·진행 초기화 대신, 문화의집(3층)으로 복귀해
   전액 회복하고 이어서 플레이한다. 퀘스트·레벨·아이템은 그대로 유지.
   (기존 게임오버 화면은 showGameOverLegacy로 보존 — 폴백 전용) */
function showGameOver() {
  try {
    moveKeys = {w:false,a:false,s:false,d:false};
    shopOpen = false;
    transitioning = false;
    syncSharedHP(getMaxHP(), false);
    try { if (typeof window.BD_save === 'function') window.BD_save(); } catch(e){}
    try { if (typeof heroMp !== 'undefined' && typeof maxMp !== 'undefined') heroMp = maxMp; } catch(e){}
    fadeToStage(101, 0.756, 0.30);   // 문화의집 3층 엘리베이터 앞
    setTimeout(function(){
      try {
        showDialog('나', ['(눈앞이 캄캄해졌다…)',
          '(정신을 차려 보니 문화의집이었다. 몸이 한결 가볍다.)',
          '(괜찮아, 다시 가서 정화해 보자!)']);
      } catch(e){}
    }, 1100);
    try { if (typeof bdToast === 'function')
      bdToast('💚 문화의집에서 회복했어요 — 진행은 그대로예요!'); } catch(e){}
    return;
  } catch(err) {
    try { showGameOverLegacy(); } catch(e2){}
  }
}
function showGameOverLegacy() {
  cancelAnimationFrame(gameRaf); window.__gameLoopChainAlive = false;
  moveKeys = {w:false,a:false,s:false,d:false};
  shopOpen = false;
  transitioning = false;
  // 게임오버 레이어 표시 (animation 재시작을 위해 remove 후 add)
  const el = document.getElementById('gameover-screen');
  el.classList.remove('show');
  void el.offsetWidth; // reflow
  el.classList.add('show');
  // 아이콘/콘텐츠 애니메이션 재시작
  const content = document.getElementById('gameover-content');
  content.style.animation = 'none';
  void content.offsetWidth;
  content.style.animation = '';
}

/* ── (v146) 죽었을 때: 새로운 시작 — 진행 초기화 후 바로 새 게임 ── */
function restartAsNewGame() {
  document.getElementById('gameover-screen').classList.remove('show');
  document.getElementById('game-screen').style.display = 'none';
  cancelAnimationFrame(gameRaf); window.__gameLoopChainAlive = false;
  moveKeys = {w:false,a:false,s:false,d:false};
  try { if (typeof window.BD_startNewGame === 'function') window.BD_startNewGame(); } catch(e){}
}

/* ── (v146) 죽었을 때: 자동저장에서 이어하기 — 봉담 자체 저장 슬롯 UI ── */
function continueFromAutosave() {
  document.getElementById('gameover-screen').classList.remove('show');
  document.getElementById('game-screen').style.display = 'none';
  cancelAnimationFrame(gameRaf); window.__gameLoopChainAlive = false;
  moveKeys = {w:false,a:false,s:false,d:false};
  window.__bdTitleShown = false;
  try {
    if (typeof window.BD_continueGame === 'function') window.BD_continueGame();
    else if (typeof window.BD_showTitle === 'function') window.BD_showTitle({ onStart:function(){}, onContinue:function(){} });
  } catch(e){}
}

/* ── 메인 화면으로 ── */
function goToMainMenu() {
  document.getElementById('gameover-screen').classList.remove('show');
  exitGame();
}

const SPR_FRONT_0 = "data:image/png;base64,@@B64:00d6d770_SPR_FRONT_0.png@@";
const SPR_FRONT_1 = "data:image/png;base64,@@B64:5b03bd9d_SPR_FRONT_1.png@@";
const SPR_FRONT_2 = "data:image/png;base64,@@B64:4ee9d9a4_SPR_FRONT_2.png@@";
const SPR_FRONT_3 = "data:image/png;base64,@@B64:0c974907_SPR_FRONT_3.png@@";
const SPR_BACK_0 = "data:image/png;base64,@@B64:c6ebfb55_SPR_BACK_0.png@@";
const SPR_BACK_1 = "data:image/png;base64,@@B64:457f2be1_SPR_BACK_1.png@@";
const SPR_BACK_2 = "data:image/png;base64,@@B64:5580ad7b_SPR_BACK_2.png@@";
const SPR_BACK_3 = "data:image/png;base64,@@B64:f63d38e7_SPR_BACK_3.png@@";
const SPR_LEFT_0 = "data:image/png;base64,@@B64:612b9a7a_SPR_LEFT_0.png@@";
const SPR_LEFT_1 = "data:image/png;base64,@@B64:c7c51d52_SPR_LEFT_1.png@@";
const SPR_LEFT_2 = "data:image/png;base64,@@B64:00bcfaea_SPR_LEFT_2.png@@";
const SPR_LEFT_3 = "data:image/png;base64,@@B64:966eba56_SPR_LEFT_3.png@@";
const SPR_RIGHT_0 = "data:image/png;base64,@@B64:2276d162_SPR_RIGHT_0.png@@";
const SPR_RIGHT_1 = "data:image/png;base64,@@B64:7ed4a9a4_SPR_RIGHT_1.png@@";
const SPR_RIGHT_2 = "data:image/png;base64,@@B64:63393632_SPR_RIGHT_2.png@@";
const SPR_RIGHT_3 = "data:image/png;base64,@@B64:c340e23d_SPR_RIGHT_3.png@@";

// 스프라이트 애니메이션 상태
let _walkFrame = 0;
let _walkTick  = 0;
const WALK_FRAME_INTERVAL = 24;   // (v43) HERO_SPEED 0.0015에 맞춰 19 -> 24 (발 미끄러짐 방지 동조) // 기준 이동속도에서 프레임당 게임틱 수 (클수록 느림) — HERO_SPEED와 짝을 맞춘 기준값

// 방향별 4프레임 배열
const MALE_SPR_FRONT_0 = "data:image/png;base64,@@B64:5f230a29_MALE_SPR_FRONT_0.png@@";
const MALE_SPR_FRONT_1 = "data:image/png;base64,@@B64:35f272e0_MALE_SPR_FRONT_1.png@@";
const MALE_SPR_FRONT_2 = "data:image/png;base64,@@B64:0d494c6f_MALE_SPR_FRONT_2.png@@";
const MALE_SPR_FRONT_3 = "data:image/png;base64,@@B64:aab177ef_MALE_SPR_FRONT_3.png@@";
const MALE_SPR_BACK_0 = "data:image/png;base64,@@B64:4b651e19_MALE_SPR_BACK_0.png@@";
const MALE_SPR_BACK_1 = "data:image/png;base64,@@B64:871d12b7_MALE_SPR_BACK_1.png@@";
const MALE_SPR_BACK_2 = "data:image/png;base64,@@B64:91e911fb_MALE_SPR_BACK_2.png@@";
const MALE_SPR_BACK_3 = "data:image/png;base64,@@B64:bde39252_MALE_SPR_BACK_3.png@@";
const MALE_SPR_LEFT_0 = "data:image/png;base64,@@B64:ca0a3052_MALE_SPR_LEFT_0.png@@";
const MALE_SPR_LEFT_1 = "data:image/png;base64,@@B64:8b78d4f2_MALE_SPR_LEFT_1.png@@";
const MALE_SPR_LEFT_2 = "data:image/png;base64,@@B64:e7837abe_MALE_SPR_LEFT_2.png@@";
const MALE_SPR_LEFT_3 = "data:image/png;base64,@@B64:04e3828f_MALE_SPR_LEFT_3.png@@";
const MALE_SPR_RIGHT_0 = "data:image/png;base64,@@B64:e85c51e0_MALE_SPR_RIGHT_0.png@@";
const MALE_SPR_RIGHT_1 = "data:image/png;base64,@@B64:9a2f0fbd_MALE_SPR_RIGHT_1.png@@";
const MALE_SPR_RIGHT_2 = "data:image/png;base64,@@B64:d60f7e73_MALE_SPR_RIGHT_2.png@@";
const MALE_SPR_RIGHT_3 = "data:image/png;base64,@@B64:a960a661_MALE_SPR_RIGHT_3.png@@";

// (v163+) 남자 주인공 — 새 정면 정지 이미지 + 12프레임 아이들링 애니메이션
const MALE_FRONT_STILL = "data:image/png;base64,@@B64:3a15c235_MALE_FRONT_STILL.png@@";
const MALE_IDLE_0 = "data:image/png;base64,@@B64:46443970_MALE_IDLE_0.png@@";
const MALE_IDLE_1 = "data:image/png;base64,@@B64:d4a88254_MALE_IDLE_1.png@@";
const MALE_IDLE_2 = "data:image/webp;base64,@@B64:7521a544_MALE_IDLE_2.webp@@";
const MALE_IDLE_3 = "data:image/png;base64,@@B64:12d10688_MALE_IDLE_3.png@@";
const MALE_IDLE_4 = "data:image/png;base64,@@B64:1b411be4_MALE_IDLE_4.png@@";
const MALE_IDLE_5 = "data:image/png;base64,@@B64:06eea616_MALE_IDLE_5.png@@";
const MALE_IDLE_6 = "data:image/png;base64,@@B64:dbfce4ba_MALE_IDLE_6.png@@";
const MALE_IDLE_7 = "data:image/webp;base64,@@B64:b554335e_MALE_IDLE_7.webp@@";
const MALE_IDLE_8 = "data:image/webp;base64,@@B64:306755ee_MALE_IDLE_8.webp@@";
const MALE_IDLE_9 = "data:image/webp;base64,@@B64:8b86602e_MALE_IDLE_9.webp@@";
const MALE_IDLE_10 = "data:image/png;base64,@@B64:850ebe88_MALE_IDLE_10.png@@";
const MALE_IDLE_11 = "data:image/png;base64,@@B64:89170f87_MALE_IDLE_11.png@@";
const MALE_IDLE_FRAMES = [MALE_IDLE_0, MALE_IDLE_1, MALE_IDLE_2, MALE_IDLE_3, MALE_IDLE_4, MALE_IDLE_5, MALE_IDLE_6, MALE_IDLE_7, MALE_IDLE_8, MALE_IDLE_9, MALE_IDLE_10, MALE_IDLE_11];
// (v165) 남자 주인공 4방향 걷기+아이들 애니메이션 (업로드 GIF 기반)
// (v170) 여자 주인공 4방향 걷기+아이들 애니메이션 (업로드 GIF 기반)
const FEMALE_DIR_ANIM = {
  front: { walk:["data:image/png;base64,@@B64:9a556070_asset.png@@","data:image/png;base64,@@B64:d7d870df_asset.png@@","data:image/png;base64,@@B64:3631b25a_asset.png@@","data:image/png;base64,@@B64:abe317d9_asset.png@@"], idle:["data:image/png;base64,@@B64:f96298c7_asset.png@@","data:image/png;base64,@@B64:a12472a4_PM6ewAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:dbd03fea_asset.png@@","data:image/png;base64,@@B64:3dcabaac_asset.png@@","data:image/png;base64,@@B64:b7c58676_asset.png@@","data:image/png;base64,@@B64:5cc371d1_asset.png@@"] },
  back: { walk:["data:image/png;base64,@@B64:fc4e9ba8_asset.png@@","data:image/png;base64,@@B64:0ea61360_asset.png@@","data:image/png;base64,@@B64:cc93ba94_asset.png@@","data:image/png;base64,@@B64:970d3d5f_asset.png@@"], idle:["data:image/png;base64,@@B64:af7d87e4_asset.png@@","data:image/png;base64,@@B64:c0befa18_asset.png@@","data:image/png;base64,@@B64:a72fcc6f_kKLgaoTEV7r9P1YR8hd9fRkfAAAAAElF.png@@","data:image/png;base64,@@B64:1ee343f6_asset.png@@","data:image/png;base64,@@B64:c7bad919_AUbmAG8dS3XjAAAAAElFTkSuQmCC.png@@"] },
  left: { walk:["data:image/png;base64,@@B64:5facd1de_asset.png@@","data:image/png;base64,@@B64:ab4ede3d_asset.png@@","data:image/png;base64,@@B64:094d06fd_asset.png@@","data:image/png;base64,@@B64:1e6ced35_asset.png@@"], idle:["data:image/png;base64,@@B64:6bd4bcfc_asset.png@@","data:image/png;base64,@@B64:53adbbfa_HyS0gE8eTu2EAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:d551008b_asset.png@@","data:image/png;base64,@@B64:5d3b0d30_asset.png@@"] },
  right: { walk:["data:image/png;base64,@@B64:c77ad31e_asset.png@@","data:image/png;base64,@@B64:373f283c_asset.png@@","data:image/png;base64,@@B64:3a838cca_XodaAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:281e7e23_asset.png@@","data:image/png;base64,@@B64:b6ee2f22_asset.png@@","data:image/png;base64,@@B64:a94dfe95_asset.png@@"], idle:["data:image/png;base64,@@B64:89d38ab3_asset.png@@","data:image/png;base64,@@B64:98fe1b00_PR8hz3tQsbAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:b9ce2903_asset.png@@","data:image/png;base64,@@B64:71f6a52d_asset.png@@"] },
};
const FEMALE_FRONT_STILL = "data:image/png;base64,@@B64:f96298c7_asset.png@@";
// (v171) 남자 4방향 애니메이션 — 회색/녹색 외곽 테두리 정리판
const MALE_DIR_ANIM = {
  front: { walk:["data:image/png;base64,@@B64:1650d860_asset.png@@","data:image/png;base64,@@B64:272247aa_SHFvuc0M16L9P1fW8fz5vjWOAAAAAElF.png@@","data:image/png;base64,@@B64:3b992181_asset.png@@","data:image/png;base64,@@B64:6036c04c_asset.png@@"], idle:["data:image/png;base64,@@B64:8efeb536_asset.png@@","data:image/png;base64,@@B64:28697c0a_UuuAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:739bcdb2_asset.png@@","data:image/png;base64,@@B64:1dbab5c0_Hxu21qW4RJCAAAAAAElFTkSuQmCC.png@@"] },
  back: { walk:["data:image/png;base64,@@B64:36132006_asset.png@@","data:image/png;base64,@@B64:6a979d67_asset.png@@","data:image/png;base64,@@B64:71dfef76_AOHlx6K5vT7yAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:084ea1c7_ByxEvbr5vh66AAAAAElFTkSuQmCC.png@@"], idle:["data:image/png;base64,@@B64:801ce037_asset.png@@","data:image/png;base64,@@B64:eed8e9cf_asset.png@@","data:image/png;base64,@@B64:315f3118_asset.png@@","data:image/png;base64,@@B64:080b8723_asset.png@@"] },
  left: { walk:["data:image/png;base64,@@B64:ec211872_asset.png@@","data:image/png;base64,@@B64:520456e4_asset.png@@","data:image/png;base64,@@B64:2ea0abf3_asset.png@@","data:image/png;base64,@@B64:efad435f_asset.png@@"], idle:["data:image/png;base64,@@B64:a84ee35c_asset.png@@","data:image/png;base64,@@B64:2379b7ab_asset.png@@","data:image/png;base64,@@B64:e517ce4a_asset.png@@","data:image/png;base64,@@B64:606a1d46_asset.png@@"] },
  right: { walk:["data:image/png;base64,@@B64:15585b93_asset.png@@","data:image/png;base64,@@B64:0b4d2a0f_asset.png@@","data:image/png;base64,@@B64:9b1079a8_asset.png@@","data:image/png;base64,@@B64:de91bcfc_jNAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:ae793a5a_H4IffgFxJQpGAAAAAElFTkSuQmCC.png@@","data:image/png;base64,@@B64:2dc77ab5_AAAAAElFTkSuQmCC.png@@"], idle:["data:image/png;base64,@@B64:03df7313_asset.png@@","data:image/png;base64,@@B64:64516892_asset.png@@","data:image/png;base64,@@B64:89c2999b_asset.png@@","data:image/png;base64,@@B64:f6ae69dc_jFAAAAAElFTkSuQmCC.png@@"] },
};
const MALE_SPRITE_FRAMES = {
  front: [MALE_SPR_FRONT_0, MALE_SPR_FRONT_1, MALE_SPR_FRONT_2, MALE_SPR_FRONT_3],
  back:  [MALE_SPR_BACK_0,  MALE_SPR_BACK_1,  MALE_SPR_BACK_2,  MALE_SPR_BACK_3],
  left:  [MALE_SPR_LEFT_0,  MALE_SPR_LEFT_1,  MALE_SPR_LEFT_2,  MALE_SPR_LEFT_3],
  right: [MALE_SPR_RIGHT_0, MALE_SPR_RIGHT_1, MALE_SPR_RIGHT_2, MALE_SPR_RIGHT_3],
};

const SPRITE_FRAMES = {
  front: [SPR_FRONT_0, SPR_FRONT_1, SPR_FRONT_2, SPR_FRONT_3],
  back:  [SPR_BACK_0,  SPR_BACK_1,  SPR_BACK_2,  SPR_BACK_3],
  left:  [SPR_LEFT_0,  SPR_LEFT_1,  SPR_LEFT_2,  SPR_LEFT_3],
  right: [SPR_RIGHT_0, SPR_RIGHT_1, SPR_RIGHT_2, SPR_RIGHT_3],
};

// ── 캐릭터 선택 이미지 (남자 단일, 여자는 SPR_* 애니메이션) ──
const CHAR_IMG_2 = "data:image/png;base64,@@B64:078acc29_CHAR_IMG_2.png@@";
const _charImgs = {};
(function _preloadCharImgs() {
  const img = new Image();
  img.src = CHAR_IMG_2;
  _charImgs[2] = img;
})();

// 로드된 Image 객체 캐시
const _sprImgs = {};
function _preloadSprites() {
  for (const [dir, frames] of Object.entries(SPRITE_FRAMES)) {
    _sprImgs[dir] = frames.map((src, i) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }
}
_preloadSprites();

// 남자 캐릭터 스프라이트 캐시
const _maleImgs = {};
function _preloadMaleSprites() {
  for (const [dir, frames] of Object.entries(MALE_SPRITE_FRAMES)) {
    _maleImgs[dir] = frames.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }
}
_preloadMaleSprites();

// (v163+) 남자 아이들링 애니메이션 자원 프리로드
const _maleIdleImgs = MALE_IDLE_FRAMES.map(function(src){ var im = new Image(); im.src = src; return im; });
const _maleFrontStillImg = (function(){ var im = new Image(); im.src = MALE_FRONT_STILL; return im; })();
let _idleFrame = 0, _idleTick = 0;

// (v165) 남자 4방향 걷기+아이들 애니메이션 프리로드
const _maleDirImgs = {};   // { front:{walk:[Image...], idle:[Image...]}, ... }
(function _preloadMaleDirAnim(){
  try {
    for (const dir of Object.keys(MALE_DIR_ANIM)) {
      _maleDirImgs[dir] = {
        walk: MALE_DIR_ANIM[dir].walk.map(function(src){ var im = new Image(); im.src = src; return im; }),
        idle: MALE_DIR_ANIM[dir].idle.map(function(src){ var im = new Image(); im.src = src; return im; }),
      };
    }
  } catch(e){}
})();
// 방향별 애니메이션 프레임 카운터 (걷기/아이들 공용 순환)
let _maleDirFrame = 0, _maleDirTick = 0;
const MALE_DIR_WALK_INTERVAL = 11;   // (v181) 걷기 프레임 재생 추가 1.7배 (18→11)
const MALE_DIR_IDLE_INTERVAL = 15;   // (v181) 아이들 프레임 재생 추가 1.7배 (26→15)

// (v170) 여자 4방향 걷기+아이들 애니메이션 프리로드 (남자와 동일 방식·속도)
const _femaleDirImgs = {};
(function _preloadFemaleDirAnim(){
  try {
    for (const dir of Object.keys(FEMALE_DIR_ANIM)) {
      _femaleDirImgs[dir] = {
        walk: FEMALE_DIR_ANIM[dir].walk.map(function(src){ var im = new Image(); im.src = src; return im; }),
        idle: FEMALE_DIR_ANIM[dir].idle.map(function(src){ var im = new Image(); im.src = src; return im; }),
      };
    }
  } catch(e){}
})();
let _femaleDirFrame = 0, _femaleDirTick = 0;
const FEMALE_DIR_WALK_INTERVAL = 11;   // (v181) 걷기 프레임 재생 추가 1.7배 (남자와 동일)
const FEMALE_DIR_IDLE_INTERVAL = 15;

// 12프레임 GIF가 원본 100ms/프레임 → 렌더 루프(약 60fps) 기준 프레임당 약 6틱
const IDLE_FRAME_INTERVAL = 6;
function tickIdleAnim(isMoving){
  // (v165) 남자 4방향 애니메이션 프레임 진행 — 걷기/아이들 모두 여기서 순환
  if (selectedCharacter === 2 && _maleDirImgs[lastDir]) {
    const set = isMoving ? _maleDirImgs[lastDir].walk : _maleDirImgs[lastDir].idle;
    let interval = isMoving ? MALE_DIR_WALK_INTERVAL : MALE_DIR_IDLE_INTERVAL;
    // (v182) 좌우(left/right) 걷기 재생 1.2배 빠르게
    if (isMoving && (lastDir === 'left' || lastDir === 'right')) interval = Math.max(1, Math.round(interval / 1.2));
    // (v183) 남자 왼쪽 이동만 추가로 느리게 (v184: 0.8→0.64로 더 느리게)
    if (isMoving && lastDir === 'left') interval = Math.max(1, Math.round(interval / 0.64));
    _maleDirTick++;
    if (_maleDirTick >= interval) {
      _maleDirTick = 0;
      _maleDirFrame = (set && set.length) ? (_maleDirFrame + 1) % set.length : 0;
    }
    return;
  }
  // (v170) 여자 4방향 애니메이션 프레임 진행
  if (selectedCharacter === 1 && _femaleDirImgs[lastDir]) {
    const set = isMoving ? _femaleDirImgs[lastDir].walk : _femaleDirImgs[lastDir].idle;
    let interval = isMoving ? FEMALE_DIR_WALK_INTERVAL : FEMALE_DIR_IDLE_INTERVAL;
    // (v182) 좌우(left/right) 걷기만 재생 1.2배 빠르게
    if (isMoving && (lastDir === 'left' || lastDir === 'right')) interval = Math.max(1, Math.round(interval / 1.2));
    _femaleDirTick++;
    if (_femaleDirTick >= interval) {
      _femaleDirTick = 0;
      _femaleDirFrame = (set && set.length) ? (_femaleDirFrame + 1) % set.length : 0;
    }
    return;
  }
  // (레거시) 정면 전용 아이들
  if(isMoving){ _idleFrame = 0; _idleTick = 0; return; }
  _idleTick++;
  if(_idleTick >= IDLE_FRAME_INTERVAL){
    _idleTick = 0;
    _idleFrame = (_idleFrame + 1) % _maleIdleImgs.length;
  }
}

function getCurrentSprite(isMoving) {
  // (v165) 남자 캐릭터: 방향별 걷기/아이들 애니메이션 우선 사용
  if (selectedCharacter === 2 && _maleDirImgs[lastDir]) {
    const set = isMoving ? _maleDirImgs[lastDir].walk : _maleDirImgs[lastDir].idle;
    if (set && set.length) {
      const idx = _maleDirFrame % set.length;
      const im = set[idx];
      if (im && im.complete && im.naturalWidth > 0) return im;
      // 로드 전 폴백: 같은 방향 첫 프레임
      if (set[0] && set[0].complete && set[0].naturalWidth > 0) return set[0];
    }
  }
  // (레거시 폴백) 정면 아이들
  if (selectedCharacter === 2 && !isMoving && (lastDir === 'front' || !lastDir)) {
    const idle = _maleIdleImgs[_idleFrame];
    if (idle && idle.complete && idle.naturalWidth > 0) return idle;
    if (_maleFrontStillImg && _maleFrontStillImg.complete && _maleFrontStillImg.naturalWidth > 0) return _maleFrontStillImg;
  }
  if (selectedCharacter === 2) {
    // 남자 캐릭터: 방향별 워킹 애니메이션 (구 스프라이트 폴백)
    const frames = _maleImgs[lastDir] || _maleImgs['front'];
    if (!frames) {
      // 폴백: 여자 스프라이트
      const fb = _sprImgs[lastDir] || _sprImgs['front'];
      return (!isMoving) ? fb[0] : fb[_walkFrame];
    }
    if (!isMoving) return frames[0];
    return frames[_walkFrame];
  }
  // (v170) 여자 캐릭터: 방향별 걷기/아이들 애니메이션 우선 사용
  if (selectedCharacter === 1 && _femaleDirImgs[lastDir]) {
    const set = isMoving ? _femaleDirImgs[lastDir].walk : _femaleDirImgs[lastDir].idle;
    if (set && set.length) {
      const idx = _femaleDirFrame % set.length;
      const im = set[idx];
      if (im && im.complete && im.naturalWidth > 0) return im;
      if (set[0] && set[0].complete && set[0].naturalWidth > 0) return set[0];
    }
  }
  // 여자 캐릭터(1): 방향별 워킹 애니메이션 (구 스프라이트 폴백)
  const frames = _sprImgs[lastDir] || _sprImgs['front'];
  if (!isMoving) return frames[0];
  return frames[_walkFrame];
}

function tickWalkAnim(isMoving) {
  if (!isMoving) {
    _walkFrame = 0;
    _walkTick  = 0;
    return;
  }
  // (개선) 걷기 애니메이션 속도를 실제 이동속도에 비례시켜 항상 동기화.
  // 이동속도 스킬로 빨라져도 발걸음 애니메이션이 실제 이동 거리와 맞아떨어진다.
  let speedRatio = (typeof getMoveSpeed === 'function') ? (getMoveSpeed() / HERO_SPEED) : 1;
  // (v237 병합) 세로 이동은 보정 계수만큼 실제로 더 멀리 가므로 발걸음도 그만큼 빠르게 —
  //  안 그러면 위아래로 걸을 때 발이 미끄러지듯 보인다.
  try {
    if (typeof moveKeys !== 'undefined' && typeof getVertSpeedK === 'function') {
      const vertOnly = getNetMoveY() !== 0 && getNetMoveX() === 0;   // (v237.1) 순 방향 기준
      if (vertOnly) speedRatio *= getVertSpeedK();
    }
  } catch (e) {}
  const interval = Math.max(3, Math.round(WALK_FRAME_INTERVAL / Math.max(0.1, speedRatio)));
  _walkTick++;
  if (_walkTick >= interval) {
    _walkTick = 0;
    _walkFrame = (_walkFrame + 1) % 4;
  }
}


/* ══════════════════════════════════════════════
   편의점 상점 시스템
══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
//  랜덤 상점 인벤토리 시스템
//  - 각 상점은 stageId:buildingKey 로 독립 관리
//  - 전체 아이템 풀에서 2~4개 랜덤 선택
//  - 현실 시간 기준 30분마다 자동 리셋
//    (매시 정각 :00 과 :30 에 전 상점 동시 교체)
//  - 같은 30분 구간이면 새로고침해도 동일한 상점 유지
//    (시간대 + 상점키로 시드를 만들어 결정론적으로 생성)
// ══════════════════════════════════════════════

// 전체 아이템 풀 (탭 구분 포함)
const ITEM_POOL = [
  { id:'guardian_badge', tab:'misc', icon:'🛡️', name:'지킴이 배지',
    desc:'문화의집에서 자원봉사를 성실히 한 청소년에게 주어지는 배지. 위험 속에 쌓인 \'불안의 그림자\'를 볼 수 있게 해 준다. 배지는 그림자를 만들지 않는다 — 이미 있던 것을 드러내고, 정화로 되돌릴 뿐이다.',
    price: 0, hidden:true, featured:true },
  { id:'gold_bookmark', tab:'misc', icon:'🎫', name:'도서관 문화상품권', desc:'정도현이 감사 인사로 챙겨준 문화상품권. 편의점이나 문화의집에서 쓸 수 있다.', price: 200, hidden:true },
  // (v240g) 학생 콘셉트 리뉴얼 — 회복은 실효과, 용품은 정직한 소품 설명 (RPG 잔재 제거)
  { id:'rice_ball',   tab:'consumable', icon:'🍙', name:'삼각김밥',        desc:'HP를 20 회복합니다.',                    price: 15  },
  { id:'hp_potion',   tab:'consumable', icon:'🥪', name:'든든 샌드위치',   desc:'HP를 50 회복합니다.',                    price: 30  },
  { id:'bandage',     tab:'consumable', icon:'🩹', name:'반창고',          desc:'HP를 5 회복합니다.',                     price: 8   },
  { id:'elixir',      tab:'consumable', icon:'🧋', name:'엄마표 홍삼 스틱', desc:'HP를 완전 회복합니다. 역시 엄마 최고.',   price: 150 },
  { id:'coffee',      tab:'consumable', icon:'🧃', name:'에너지 음료',     desc:'이동속도 +20% (60초)',                   price: 20  },
  { id:'boots',       tab:'equip',      icon:'👟', name:'새 운동화',       desc:'발걸음이 가볍다! 이동속도 +10% (10분)',   price: 120 },
  { id:'squishy',     tab:'misc',       icon:'🧸', name:'말랑이',          desc:'조물조물… 아무 효과도 없지만 마음이 말랑해진다.', price: 12 },
  { id:'yoyo_toy',    tab:'misc',       icon:'🪀', name:'요요',            desc:'휙— 하고 돌아온다! 그게 전부지만 그게 좋다.',   price: 15 },
  { id:'capsule_toy', tab:'misc',       icon:'🎁', name:'뽑기 캡슐',       desc:'달칵. 안에서 작은 장난감이 나왔다. 딱 그만큼 행복.', price: 10 },
  { id:'map_scroll',  tab:'misc',       icon:'🗺️', name:'봉담 산책 지도',  desc:'동네 명소와 산책 코스가 그려져 있다.',   price: 20  },
  { id:'rope',        tab:'misc',       icon:'🪢', name:'줄넘기',          desc:'운동 부족 해결! 광장에서 함께 넘어 보자.', price: 15  },
  { id:'iron_sword',  tab:'misc',       icon:'✏️', name:'샤프·노트 세트',  desc:'필기 준비 완료. 왠지 공부가 잘될 것 같다.', price: 18 },
  { id:'broken_hw',  tab:'misc',       icon:'💾', name:'고장난 하드웨어', desc:'???  어딘가 부서진 것 같다.', price: 999, hidden:true },
];


let playerGold = 500;
let shopOpen = false;
// (v375) currentShopTab 제거 — 구 상점 탭

// ── 가장 가까운 상점 반환 (없으면 null) ──
function getNearStore() {
  const stage = STAGES[currentStage];
  if (!stage) return null;
  const stores = stage.objects.filter(o => o.interactable === 'shop');
  for (const store of stores) {
    const left   = store.rx - 0.05;
    const right  = store.rx + store.rw + 0.05;
    const bottom = store.ry + store.rh;
    const dy = heroY - bottom;
    if (heroX >= left && heroX <= right && dy >= -0.02 && dy < 0.20) {
      return store;
    }
  }
  return null;
}

// ── 편의점 근접 체크 ──
function isNearStore24() {
  return getNearStore() !== null;
}

// ── 힌트 업데이트 (캔버스에서 직접 그리므로 여기선 아무것도 안 함) ──
function updateShopHint() { /* 캔버스 renderMap에서 직접 처리 */ }

// ── 상점 열기/닫기 ──
/* (v375) 구 상점 UI 제거 — 랜덤 재고·#shop-overlay·구 openShop/buyItem 삭제. 상점은 bd-shop-modal(0052·0242) 한 경로.
   openShop/closeShop 는 호환 스텁으로만 남긴다 (F 핸들러·ESC 정리 코드의 참조 보존). */
function openShop() { try { if (typeof window.BD_openShop === 'function') window.BD_openShop(); } catch (e) {} }
function closeShop() { shopOpen = false; }

// ═══════════════════════════════════════════════════════════
//  안전도(스킬 트리) 시스템
//  - 레벨당 안전도 포인트 2 획득
//  - 포인트를 소비해 스킬 강화
// ═══════════════════════════════════════════════════════════

let safetyLevel  = 1;     // 현재 레벨 (기본 1)
let safetyXP     = 0;     // 현재 경험치
let safetyXP_MAX = 100;   // 레벨업에 필요한 XP (레벨마다 증가)
let safetyPoints = 2;     // 보유 안전도 포인트 (레벨 1 시작 → 2포인트)

// 안전도 스킬 정의
const SAFETY_SKILLS = [
  // ── 생존 ──
  { id:'max_hp',    group:'생존',   icon:'❤️',  name:'체력 강화',     desc:'최대 HP +10 per Lv.',    maxLv:5, costPerLv:2 },
  { id:'regen_spd', group:'생존',   icon:'💚',  name:'정화의 보람',   desc:'위험 요소 정화 시 HP +6 회복 per Lv.',  maxLv:5, costPerLv:2 },
  { id:'last_stand',group:'생존',   icon:'🛡️',  name:'최후의 저항',   desc:'HP 10% 이하 시 피해 -20%', maxLv:3, costPerLv:3 },
  // ── 이동 ──
  { id:'move_spd',  group:'이동',   icon:'👟',  name:'발걸음',        desc:'이동속도 +5% per Lv.',    maxLv:5, costPerLv:2 },
  { id:'dash_cd',   group:'이동',   icon:'💨',  name:'대시 숙련',     desc:'대시 쿨다운 -10% per Lv.',maxLv:7, costPerLv:3 },
  // ── 상황 판단 ──
  { id:'gold_find', group:'상황 판단', icon:'💰', name:'재화 감각',   desc:'아이템 가격 -5% per Lv.', maxLv:4, costPerLv:2 },
  { id:'awareness', group:'상황 판단', icon:'👁️', name:'경계심',      desc:'위험 감지 범위 +15% per Lv.', maxLv:3, costPerLv:3 },
  // (v163+) 마법사 스킬 제거 — 직업 시스템이 폐지되어(heroClass 항상 warrior) 절대 발동 불가능한 사문이었음
];

// 각 스킬의 현재 레벨
const safetySkillLevels = {};
SAFETY_SKILLS.forEach(s => { safetySkillLevels[s.id] = 0; });

// 레벨업 (XP 추가)
function addSafetyXP(amount) {
  safetyXP += amount;
  while (safetyXP >= safetyXP_MAX) {
    safetyXP -= safetyXP_MAX;
    safetyLevel++;
    safetyPoints += 2;
    safetyXP_MAX = safetyXP_MAX + 10;
    showShopToast(`🆙 안전도 Lv.${safetyLevel} 달성! (+2 포인트)`);
    achieveTrack('safety_lv', safetyLevel);
  }
  if (document.getElementById('inv-safety-panel').style.display !== 'none') {
    renderSafetyPanel();
  }
}
window.BD_addSafetyXP = addSafetyXP;  // (v137) 봉담 정화 루프에서 호출할 수 있도록 노출

// 스킬 업그레이드
function upgradeSafetySkill(skillId) {
  const skill = SAFETY_SKILLS.find(s => s.id === skillId);
  if (!skill) return;
  const curLv = safetySkillLevels[skillId];
  if (curLv >= skill.maxLv) return;
  if (safetyPoints < skill.costPerLv) return;
  // 체력 강화 전 최대 HP 기록 (강화 후 늘어난 만큼 현재 HP 회복용)
  const maxHpBefore = (typeof getMaxHP === 'function') ? getMaxHP() : 0;
  safetyPoints -= skill.costPerLv;
  safetySkillLevels[skillId]++;
  applySafetySkillEffect(skillId);
  // 체력 강화(max_hp)면: 늘어난 최대 HP만큼 현재 HP도 회복
  if (skillId === 'max_hp') {
    // BD.maxHp도 먼저 재계산해 getMaxHP()와 같은 최대 체력을 보게 한다.
    try { if (window.BD && typeof window.BD_recalcStats === 'function') window.BD_recalcStats(); } catch(e){}
    const maxHpAfter = getMaxHP();
    const gained = maxHpAfter - maxHpBefore;
    if (gained > 0) {
      if (typeof heroHP !== 'undefined') syncSharedHP(heroHP + gained, false);
      // 봉담 BD 상태에도 반영
      try {
        if (window.BD) {
          window.BD.maxHp = maxHpAfter;
          window.BD.hp = Math.min(maxHpAfter, (window.BD.hp || 0) + gained);
          if (typeof window.BD_save === 'function') window.BD_save();
        }
      } catch(e){}
    }
  }
  renderSafetyPanel();
  showShopToast(`${skill.icon} ${skill.name} Lv.${safetySkillLevels[skillId]} 강화!`);
  achieveTrack('skill_up', 1);
  checkCyberPsycho();
}

// 스킬 효과 적용
function applySafetySkillEffect(skillId) {
  // 모든 효과는 getSafetyBonus()를 통해 각 시스템에서 실시간 참조
  // (별도 적용 불필요 — 게임 루프 / 구매 로직에서 직접 읽음)
}

// ── 스킬 보너스 계산 헬퍼 ──
function getSafetyBonus(skillId) {
  return safetySkillLevels[skillId] || 0;
}
window.BD_getSafetyBonus = getSafetyBonus;  // (v137) 다른 스크립트 블록(봉담 정화 로직)에서 참조 가능하도록 노출

// 실제 최대 HP (base + 스킬 보너스 - 사이버 싸이코 패널티)
let _cyberPsychoMaxHPPenalty = 0;
let _cyberDashCount = 0;
function getMaxHP() {
  // 봉담 성장/장비 스탯이 준비된 뒤에는 그 값을 필드와 전투가 함께 사용한다.
  if (window.BD && Number.isFinite(Number(window.BD.maxHp))) {
    return Math.max(1, Number(window.BD.maxHp) - _cyberPsychoMaxHPPenalty);
  }
  const baseHP = { warrior:100, paladin:120, rogue:90, mage:95, archer:100 };
  const base = baseHP[heroClass] ?? 100;
  return base + getSafetyBonus('max_hp') * 10 - _cyberPsychoMaxHPPenalty;
}

// 실제 회복 대기 시간 ms (base 10000 - 스킬당 1000ms 감소)
function getRegenWaitMs() {
  return Math.max(2000, REGEN_WAIT_MS - getSafetyBonus('regen_spd') * 1000);
}

// 실제 이동속도 (base * (1 + 스킬당 5%))
// (v207) 시야 배율(s)을 곱는다 — 맵마다 아트 확대율이 달라 월드 단위 속도가 같으면
//  화면상 이동 속도가 s배 느려진다(광장에서 1.89배 느림). s를 곱하면 전 맵 체감 속도 동일.
function getMoveSpeed() {
  const _configuredViewScale = (window.BD_VIEW_SCALE && window.BD_VIEW_SCALE[currentStage]) || 1;
  const _pixelViewState = window.BD_CONCEPT_PIXEL_PERFECT_STATE;
  const s = STAGES[currentStage] && STAGES[currentStage].__conceptMap && _pixelViewState && _pixelViewState.stageId === Number(currentStage)
    ? _pixelViewState.effectiveViewScale
    : _configuredViewScale;
  // (v240g) 소모품 이동속도 버프 (에너지 음료 +20%/60초, 새 운동화 +10%/10분 — 중첩 가능)
  let buff = 1;
  if (Date.now() < (window.__bdSpeedBuffUntil || 0)) buff *= 1.20;
  if (Date.now() < (window.__bdShoesUntil || 0)) buff *= 1.10;
  return HERO_SPEED * s * (1 + getSafetyBonus('move_spd') * 0.05) * buff;
}

// 실제 대시 쿨다운 프레임 (base * (1 - 스킬당 10%))
let _cyberPsychoBonus = 0;
function getDashCooldown() {
  if (hwSkillActive) return 0;
  return Math.max(0, Math.round(DASH_COOLDOWN * (1 - getSafetyBonus('dash_cd') * 0.10)) - _cyberPsychoBonus);
}

// 실제 아이템 가격 (base * (1 - 스킬당 5%))
function getItemPrice(basePrice) {
  return Math.max(1, Math.round(basePrice * (1 - getSafetyBonus('gold_find') * 0.05)));
}
window.BD_getItemPrice = getItemPrice;  // (v152) 봉담 상점에서 재화 감각 할인을 적용할 수 있도록 노출

// last_stand: HP 10% 이하 시 피해 감소율 (스킬당 20%)
function getLastStandReduction() {
  return getSafetyBonus('last_stand') * 0.20;
}
window.BD_getLastStandReduction = getLastStandReduction;  // (v151) HSR 전투 모듈에서 참조 가능하도록 노출

// 안전도 패널 렌더링
function renderSafetyPanel() {
  const panel = document.getElementById('inv-safety-panel');
  panel.innerHTML = '';

  // ── 포인트 헤더 ──
  const xpPct = Math.min(100, Math.round((safetyXP / safetyXP_MAX) * 100));
  panel.innerHTML = `
    <div id="safety-header">
      <div id="safety-header-left">
        <div id="safety-level-text">🛡️ 안전도 Lv.${safetyLevel}</div>
        <div id="safety-point-text">${safetyXP} / ${safetyXP_MAX} XP</div>
        <div style="margin-top:6px;">
          <div id="safety-xp-bar-wrap">
            <div id="safety-xp-bar-fill" style="width:${xpPct}%"></div>
          </div>
        </div>
      </div>
      <div id="safety-point-badge">⚡ ${safetyPoints} P</div>
    </div>
  `;

  // ── 스킬 그룹별 렌더링 ──
  const visibleSkills = SAFETY_SKILLS.filter(s => !s.mageOnly || heroClass === 'mage');
  const groups = [...new Set(visibleSkills.map(s => s.group))];
  groups.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.innerHTML = `<div class="safety-group-title">${group}</div>`;

    visibleSkills.filter(s => s.group === group).forEach(skill => {
      const curLv  = safetySkillLevels[skill.id];
      const isMax  = curLv >= skill.maxLv;
      const canBuy = !isMax && safetyPoints >= skill.costPerLv;

      // 현재 실제 스탯 값 계산
      let statLine = '';
      if (skill.id === 'max_hp') {
        const cur = getMaxHP();
        statLine = `현재 최대 HP: <b style="color:#ff8888">${cur}</b>`;
      } else if (skill.id === 'regen_spd') {
        const sec = Math.round(getRegenWaitMs() / 1000);
        statLine = `현재 회복 대기: <b style="color:#88ff88">${sec}초</b>`;
      } else if (skill.id === 'last_stand') {
        const pct = Math.round(getLastStandReduction() * 100);
        statLine = pct > 0 ? `현재 피해 감소: <b style="color:#ffaa44">${pct}%</b>` : `미적용`;
      } else if (skill.id === 'move_spd') {
        const pct = Math.round((getMoveSpeed() / HERO_SPEED - 1) * 100);
        statLine = `현재 이동속도: <b style="color:#88ccff">+${pct}%</b>`;
      } else if (skill.id === 'dash_cd') {
        const sec = (getDashCooldown() / 60).toFixed(1);
        statLine = `현재 대시 쿨다운: <b style="color:#cc88ff">${sec}초</b>`;
      } else if (skill.id === 'gold_find') {
        const pct = Math.round(getSafetyBonus('gold_find') * 5);
        statLine = pct > 0 ? `현재 가격 할인: <b style="color:#ffd700">${pct}%</b>` : `미적용`;
      } else if (skill.id === 'awareness') {
        const pct = Math.round(getSafetyBonus('awareness') * 15);
        statLine = pct > 0 ? `현재 감지 범위: <b style="color:#aaffaa">+${pct}%</b>` : `미적용`;
      } else if (skill.id === 'mage_element') {
        const el = MAGE_ELEMENT_INFO[currentMageElement()];
        statLine = `현재 속성: <b style="color:#cc99ff">${el.icon} ${el.name}</b> <span style="opacity:.7">(R키 전환)</span>`;
      }

      const card = document.createElement('div');
      card.className = 'safety-skill' + (curLv > 0 ? (isMax ? ' max-level' : ' unlocked') : '');

      // 레벨 점 표시
      let dots = '';
      for (let i = 0; i < skill.maxLv; i++) {
        const cls = i < curLv ? (isMax ? 'safety-dot gold' : 'safety-dot filled') : 'safety-dot';
        dots += `<div class="${cls}"></div>`;
      }

      const btnHtml = isMax
        ? `<button class="safety-upgrade-btn maxed" disabled>MAX</button>`
        : `<button class="safety-upgrade-btn" ${canBuy ? '' : 'disabled'} onclick="upgradeSafetySkill('${skill.id}')">강화</button>`;

      card.innerHTML = `
        <div class="safety-skill-icon">${skill.icon}</div>
        <div class="safety-skill-info">
          <div class="safety-skill-name">${skill.name}</div>
          <div class="safety-skill-desc">${skill.desc}</div>
          ${curLv > 0 ? `<div class="safety-skill-stat">${statLine}</div>` : ''}
          <div class="safety-skill-level">${dots}</div>
        </div>
        <div class="safety-skill-right">
          <div class="safety-cost">${isMax ? '완료' : skill.costPerLv + 'P'}</div>
          ${btnHtml}
        </div>
      `;
      groupEl.appendChild(card);
    });
    panel.appendChild(groupEl);
  });
}

// ═══════════════════════════════════════════════════════════
//  인벤토리 시스템
// ═══════════════════════════════════════════════════════════

// 플레이어 인벤토리: { itemId: { item: {...}, count: N } }
let playerInventory = {};
let invOpen = false;
let currentInvTab = 'all';
let selectedInvItemId = null;

// 아이템 추가
window.addToInventory = addToInventory;   // (v278c) 전역 노출 — 프롤로그 후속 지급이 다른 블록에서 호출
function addToInventory(item, count = 1) {
  if (playerInventory[item.id]) {
    playerInventory[item.id].count += count;
  } else {
    playerInventory[item.id] = { item, count };
  }
}

// 인벤토리 열기
function openInventory() {
  if (shopOpen) return;
  invOpen = true;
  moveKeys = {w:false,a:false,s:false,d:false};
  document.getElementById('inv-gold-amount').textContent = playerGold;
  selectedInvItemId = null;
  currentInvTab = 'all';
  // 탭 초기화
  document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
  document.querySelector('.inv-tab').classList.add('active');
  // 패널 상태 초기화 (아이템 탭이 기본)
  document.getElementById('inv-body').style.display   = '';
  document.getElementById('inv-detail').style.display = '';
  document.getElementById('inv-safety-panel').style.display = 'none';
  renderInventory();
  document.getElementById('inv-overlay').classList.add('open');
}

// 인벤토리 닫기
function closeInventory() {
  invOpen = false;
  document.getElementById('inv-overlay').classList.remove('open');
  selectedInvItemId = null;
}

// 탭 전환
function switchInvTab(tab, btn) {
  currentInvTab = tab;
  document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  selectedInvItemId = null;

  const isSafety  = (tab === 'safety');
  const isAchieve = (tab === 'achieve');
  const isSkill   = (tab === 'skill');
  const body    = document.getElementById('inv-body');
  const detail  = document.getElementById('inv-detail');
  const safety  = document.getElementById('inv-safety-panel');
  const achieve = document.getElementById('inv-achieve-panel');
  const skill   = document.getElementById('inv-skill-panel');

  const isSpecial = isSafety || isAchieve || isSkill;
  body.style.display    = !isSpecial ? '' : 'none';
  detail.style.display  = !isSpecial ? '' : 'none';
  safety.style.display  = isSafety  ? 'flex' : 'none';
  achieve.style.display = isAchieve ? 'flex' : 'none';
  if (skill) skill.style.display = isSkill ? 'flex' : 'none';

  if (isSafety)  renderSafetyPanel();
  if (isAchieve) renderAchievePanel();
  if (isSkill && typeof window.BD_renderSkillPanel === 'function') window.BD_renderSkillPanel();
  if (!isSpecial) renderInventory();
}

// 인벤토리 렌더링
function renderInventory() {
  const grid = document.getElementById('inv-grid');
  grid.innerHTML = '';

  // 탭 필터링
  const entries = Object.values(playerInventory).filter(e => {
    if (currentInvTab === 'all') return true;
    return e.item.tab === currentInvTab;
  });
  // (v219) 지킴이 배지는 항상 맨 앞에 — 획득 직후 바로 보이도록
  entries.sort((a, b) => (b.item.featured ? 1 : 0) - (a.item.featured ? 1 : 0));

  if (entries.length === 0) {
    grid.innerHTML = '<div class="inv-empty" style="grid-column:1/-1">보유한 아이템이 없어요.</div>';
    resetInvDetail();
    return;
  }

  entries.forEach(({ item, count }) => {
    const slot = document.createElement('div');
    slot.className = 'inv-slot' + (selectedInvItemId === item.id ? ' selected' : '')
      + (item.featured ? ' inv-cell-featured' : '');   // (v219) 배지 금테 강조
    slot.title = item.name;
    slot.innerHTML = `
      <div class="inv-slot-icon">${item.icon}</div>
      ${count > 1 ? `<div class="inv-slot-count">×${count}</div>` : ''}
    `;
    slot.onclick = () => selectInvItem(item.id);
    grid.appendChild(slot);
  });

  // 선택된 아이템 상세 갱신
  if (selectedInvItemId && playerInventory[selectedInvItemId]) {
    const { item } = playerInventory[selectedInvItemId];
    showInvDetail(item);
  } else {
    resetInvDetail();
  }
}

// 아이템 선택
function selectInvItem(itemId) {
  selectedInvItemId = itemId;
  renderInventory();
}

// 상세 패널 표시
function showInvDetail(item) {
  document.getElementById('inv-detail-icon').textContent = item.icon;
  document.getElementById('inv-detail-name').textContent = item.name;
  document.getElementById('inv-detail-desc').textContent = item.desc;
  const useBtn = document.getElementById('inv-use-btn');
  if (item.tab === 'consumable' || item.id === 'boots') {   /* (v289) 운동화도 사용 가능 */
    useBtn.style.display = 'block';
  } else {
    useBtn.style.display = 'none';
  }
}

// 상세 패널 초기화
function resetInvDetail() {
  document.getElementById('inv-detail-icon').textContent = '🎒';
  document.getElementById('inv-detail-name').textContent = '아이템을 선택하세요';
  document.getElementById('inv-detail-desc').textContent = '인벤토리에서 아이템을 클릭하면 상세 정보를 확인하고 사용할 수 있습니다.';
  document.getElementById('inv-use-btn').style.display = 'none';
  selectedInvItemId = null;
}

// 현재 MP/SP 상태를 필드와 전투에서 공통으로 다룬다.
function getCurrentMPValue() {
  if (window.HSR && HSR.active && typeof HSR.sp === 'number') return HSR.sp;
  if (window.BD && typeof BD.mp === 'number') return BD.mp;
  return 0;
}
function getCurrentMaxMPValue() {
  if (window.HSR && HSR.active && Number.isFinite(Number(HSR.spMax)) && Number(HSR.spMax) > 0) return Number(HSR.spMax);
  if (window.BD && Number.isFinite(Number(BD.maxMp)) && Number(BD.maxMp) > 0) return Number(BD.maxMp);
  // 저장 데이터가 초기화되는 짧은 순간에도 0/0을 "MP 최대"로 오판하지 않도록 기본 최대치를 사용한다.
  return 20;
}
function restoreMP(amount) {
  const maxMp = getCurrentMaxMPValue();
  const before = getCurrentMPValue();
  const hasBattleMP = !!(window.HSR && HSR.active && typeof HSR.sp === 'number');
  const hasFieldMP = !!(window.BD && typeof BD.mp === 'number');
  if ((!hasBattleMP && !hasFieldMP) || maxMp <= 0 || before >= maxMp) return false;
  const restored = Math.min(maxMp, before + Math.max(0, Number(amount) || 0));
  if (hasBattleMP) HSR.sp = restored;
  if (hasFieldMP) BD.mp = restored;
  if (typeof window.BD_refreshSp === 'function') window.BD_refreshSp();
  if (typeof window.BD_updateMp === 'function') window.BD_updateMp();
  return restored > before;
}

// 회복 아이템은 실제 HP가 오른 경우에만 성공으로 처리한다.
function restoreItemHP(amount) {
  const battleHero = (window.HSR && HSR.active && HSR.hero) ? HSR.hero : null;
  const before = battleHero && typeof battleHero.hp === 'number' ? battleHero.hp : heroHP;
  const maxHp = battleHero && Number(battleHero.maxhp) > 0 ? Number(battleHero.maxhp) : getMaxHP();
  if (before >= maxHp) return false;
  const restored = Math.min(maxHp, before + Math.max(0, Number(amount) || 0));
  if (battleHero) battleHero.hp = restored;
  syncSharedHP(restored, false);
  questProgress('regen', 1);
  achieveTrack('regen', 1);
  try { if (typeof bdRefreshParty === 'function') bdRefreshParty(); } catch(e){}
  return restored > before;
}

// 아이템 사용
function useSelectedItem() {
  if (!selectedInvItemId) return;
  const entry = playerInventory[selectedInvItemId];
  if (!entry) return;
  const { item } = entry;

  // 회복할 자원이 이미 최대라면 아이템을 소비하지 않는다.
  const hpRecoveryItems = ['hp_potion', 'rice_ball', 'bandage', 'snack', 'drink', 'potion'];
  const mpRecoveryItems = ['mp_potion'];
  const dualRecoveryItems = ['ether', 'elixir'];
  const battleHero = (window.HSR && HSR.active && HSR.hero) ? HSR.hero : null;
  const currentHp = battleHero && typeof battleHero.hp === 'number' ? battleHero.hp : heroHP;
  const currentMaxHp = battleHero && Number(battleHero.maxhp) > 0 ? Number(battleHero.maxhp) : getMaxHP();
  const maxMp = getCurrentMaxMPValue();
  const hpFull = currentHp >= currentMaxHp;
  const mpFull = maxMp > 0 && getCurrentMPValue() >= maxMp;
  if (hpRecoveryItems.includes(item.id) && hpFull) {
    showShopToast('❤ 체력이 이미 가득해요.');
    return;
  }
  if (mpRecoveryItems.includes(item.id) && mpFull) {
    showShopToast('💙 배지 에너지가 가득해요.');
    return;
  }
  if (dualRecoveryItems.includes(item.id) && hpFull && mpFull) {
    showShopToast('✨ 체력도 배지 에너지도 가득해요');
    return;
  }

  // 아이템별 효과
  const effects = {
    snack:  () => { restoreItemHP(40); try{ if(window.BD&&BD.items&&BD.items.snack >0) BD.items.snack--;  }catch(e){} },
    drink:  () => { restoreItemHP(25); try{ if(window.BD&&BD.items&&BD.items.drink >0) BD.items.drink--;  }catch(e){} },
    potion: () => { restoreItemHP(60); try{ if(window.BD&&BD.items&&BD.items.potion>0) BD.items.potion--; }catch(e){} },
    'hp_potion':   () => restoreItemHP(50),
    'ether':       () => {
      const hpRestored = restoreItemHP(30);
      const mpRestored = restoreMP(30);
      return hpRestored || mpRestored;
    },
    'elixir':      () => {
      const hpRestored = restoreItemHP(currentMaxHp);
      const mpRestored = restoreMP(maxMp);
      return hpRestored || mpRestored;
    },
    'rice_ball':   () => restoreItemHP(20),
    'antidote':    () => {},
    'mp_potion':   () => restoreMP(40),
    'coffee':      () => {
      window.__bdSpeedBuffUntil = Date.now() + 60000;
      showShopToast('🧃 에너지 충전! 이동속도 +20% (60초)');
    },
    'boots':       () => {
      window.__bdShoesUntil = Date.now() + 600000;
      showShopToast('👟 발걸음이 가볍다! 이동속도 +10% (10분)');
    },
    'bandage':     () => restoreItemHP(5),
    'broken_hw':   () => { showShopToast('💾 Z키로 스킬을 사용하세요!'); return 'no_consume'; },
  };

  if (effects[item.id]) {
    const result = effects[item.id]();
    if (result === 'no_consume') { renderInventory(); return; }
    // 회복 효과가 실제로 하나도 적용되지 않았다면 아이템을 소비하지 않는다.
    if ((hpRecoveryItems.includes(item.id) || mpRecoveryItems.includes(item.id) || dualRecoveryItems.includes(item.id)) && result === false) {
      showShopToast('✨ 체력도 배지 에너지도 가득해요');
      renderInventory();
      return;
    }
    showShopToast(`${item.icon} ${item.name} 사용!`);
  }

  // 수량 감소
  entry.count--;
  if (entry.count <= 0) {
    delete playerInventory[selectedInvItemId];
    selectedInvItemId = null;
  }

  // 골드 표시 갱신
  document.getElementById('inv-gold-amount').textContent = playerGold;
  renderInventory();
  try { if (typeof window.BD_save === 'function') window.BD_save(); } catch(e){}
  try { if (typeof autoSave === 'function') autoSave('아이템 사용'); } catch(e){}
}

// ── (v375) 알림은 공용 토스트로 (구 상점 토스트 DOM 제거) ──
function showShopToast(msg) { try { if (typeof bdToast === 'function') bdToast(msg); } catch (e) {} }


// ── 고장난 하드웨어 시스템 ──
let hasBrokenHW      = false;
let hwSkillActive    = false;
let hwSkillTimer     = 0;
let hwSkillCooldown  = 0;           // 쿨타임 남은 ms
const HW_SKILL_DURATION = 5000;
const HW_SKILL_CD_MS    = 15000;    // 15초 쿨타임

function updateHWSkill(dt) {
  // 쿨타임 감소
  if (hwSkillCooldown > 0) hwSkillCooldown = Math.max(0, hwSkillCooldown - dt);
  if (!hwSkillActive) return;
  hwSkillTimer -= dt;
  if (hwSkillTimer <= 0) {
    hwSkillActive    = false;
    hwSkillTimer     = 0;
    hwSkillCooldown  = HW_SKILL_CD_MS;
    showShopToast('💾 하드웨어 과부하 종료');
  }
}

function activateHWSkill() {
  if (!hasBrokenHW) return;
  if (hwSkillActive) return;
  if (hwSkillCooldown > 0) return;
  hwSkillActive   = true;
  hwSkillTimer    = HW_SKILL_DURATION;
  hwSkillCooldown = 0;
  showShopToast('💾 하드웨어 과부하! 5초간 대시 쿨타임 없음');
}

function syncBrokenHW() {
  hasBrokenHW = !!playerInventory['broken_hw'];
  checkCyberPsycho();
}

function checkCyberPsycho() {
  if (achieveDone['h_cyber_psycho']) return;
  if (!hasBrokenHW) return;
  if (safetySkillLevels['dash_cd'] < 7) return;
  achieveTrack('cyber_psycho', 1);
}

// ── 키 이벤트 ──

// ═══════════════════════════════════════════════════════════
//  업적 시스템
// ═══════════════════════════════════════════════════════════

const ACHIEVEMENTS = [
  // ── 탐험 ──
  { id:'first_step',  group:'탐험', icon:'👣', name:'첫 발걸음',     desc:'맵에서 처음으로 이동하기',              type:'walk',     target:1,     reward:'첫 발자국' },
  { id:'walk_10k',    group:'탐험', icon:'🥾', name:'만 보 걷기',     desc:'총 10,000보 걷기',                      type:'walk',     target:10000, reward:'워킹마스터' },
  { id:'walk_100k',   group:'탐험', icon:'🗺️',  name:'대장정',        desc:'총 100,000보 걷기',                     type:'walk',     target:100000,reward:'탐험가' },
  { id:'dash_first',  group:'탐험', icon:'💨', name:'첫 대시',        desc:'처음으로 대시 사용하기',                type:'dash',     target:1,     reward:'순발력' },
  { id:'dash_100',    group:'탐험', icon:'⚡', name:'번개처럼',       desc:'대시 100번 사용하기',                   type:'dash',     target:100,   reward:'대시 고수' },
  // ── 상업 ──
  { id:'first_buy',   group:'상업', icon:'🛒', name:'첫 구매',        desc:'처음으로 아이템 구매하기',              type:'buy',      target:1,     reward:'쇼핑 입문' },
  { id:'buy_50',      group:'상업', icon:'💸', name:'큰손',           desc:'아이템 총 50개 구매하기',               type:'buy',      target:50,    reward:'VIP 고객' },
  { id:'shop_visit3', group:'상업', icon:'🏪', name:'동네 탐방',      desc:'서로 다른 상점 3곳 방문하기',           type:'visit_shop', target:3,  reward:'동네 주민' },
  // ── 생존 ──
  { id:'regen_first', group:'생존', icon:'💊', name:'회복의 기쁨',    desc:'처음으로 HP 회복하기',                  type:'regen',    target:1,     reward:'생존 본능' },
  { id:'regen_50',    group:'생존', icon:'💉', name:'불사신',         desc:'HP 총 50회 회복하기',                   type:'regen',    target:50,    reward:'회복 전문가' },
  { id:'survive_dmg', group:'생존', icon:'🩹', name:'상처 입은 전사', desc:'피해를 처음으로 받기',                  type:'damage',   target:1,     reward:'용감한 자' },
  // ── 성장 ──
  { id:'safety_lv3',  group:'성장', icon:'🛡️', name:'안전 수호자',    desc:'안전도 레벨 3 달성하기',                type:'safety_lv',target:3,    reward:'수호의 방패' },
  { id:'safety_lv5',  group:'성장', icon:'⚔️', name:'철벽 방어',      desc:'안전도 레벨 5 달성하기',                type:'safety_lv',target:5,    reward:'철벽의 수호자' },
  { id:'skill_first', group:'성장', icon:'✨', name:'각성',           desc:'안전도 스킬 처음으로 강화하기',         type:'skill_up', target:1,     reward:'각성자' },
  // ── 퀘스트 ──
  { id:'quest_first', group:'퀘스트', icon:'📋', name:'첫 임무',      desc:'일일 퀘스트 처음으로 완료하기',         type:'quest_done', target:1,  reward:'공무원 단골' },
  { id:'quest_10',    group:'퀘스트', icon:'📜', name:'성실한 시민',   desc:'일일 퀘스트 총 10회 완료하기',          type:'quest_done', target:10, reward:'모범 시민' },
  // ── 봉담 이야기 (v132) ──
  { id:'story_badge', group:'봉담 이야기', icon:'🛡️', name:'지킴이 배지', desc:'지킴이 배지를 받고 첫 위험 요소를 정화하기', type:'story_prologue', target:1, reward:'초보 지킴이' },
  { id:'story_clear', group:'봉담 이야기', icon:'🏅', name:'봉담의 진짜 지킴이', desc:'모든 지역을 정화하고 최종 보스까지 물리치기', type:'story_final', target:1, reward:'봉담 지킴이' },
];

// ── 히든 업적 ──
const HIDDEN_ACHIEVEMENTS = [
  { id:'h_dash_500',   icon:'🌪️', name:'폭풍의 질주',    desc:'대시를 500번 사용하기',             type:'dash',      target:500   },
  { id:'h_buy_100',    icon:'👑', name:'소비의 황제',     desc:'아이템을 100개 구매하기',           type:'buy',       target:100   },
  { id:'h_walk_1m',    icon:'🌍', name:'지구 일주',       desc:'총 1,000,000보 걷기',               type:'walk',      target:1000000 },
  { id:'h_regen_100',  icon:'🔋', name:'영원불멸',        desc:'HP를 100회 회복하기',               type:'regen',     target:100   },
  { id:'h_safety_lv10',icon:'💎', name:'전설의 수호자',   desc:'안전도 레벨 10 달성하기',           type:'safety_lv', target:10   },
  { id:'h_quest_30',   icon:'🎖️', name:'퀘스트 마스터',  desc:'일일 퀘스트 30회 완료하기',         type:'quest_done',target:30    },
  { id:'h_shop_all',   icon:'🗝️', name:'모든 문을 열다',  desc:'서로 다른 상점 10곳 방문하기',      type:'visit_shop',target:10    },
  { id:'h_cyber_psycho', icon:'🤖', name:'사이버 싸이코?', desc:'고장난 하드웨어를 보유한 채로 대시 숙련을 최대로 하기', type:'cyber_psycho', target:1 },
];

// 업적 진행도 저장
const achieveProgress = {};
const achieveDone     = {};
ACHIEVEMENTS.forEach(a => { achieveProgress[a.id] = 0; achieveDone[a.id] = false; });
HIDDEN_ACHIEVEMENTS.forEach(a => { achieveProgress[a.id] = 0; achieveDone[a.id] = false; });

// 업적 진행도 업데이트
function achieveTrack(type, amount) {
  amount = amount || 1;
  const allAchieves = [...ACHIEVEMENTS, ...HIDDEN_ACHIEVEMENTS];
  allAchieves.forEach(a => {
    if (a.type !== type) return;
    if (achieveDone[a.id]) return;
    if (type === 'safety_lv') {
      achieveProgress[a.id] = amount;
    } else {
      achieveProgress[a.id] = Math.min((achieveProgress[a.id] || 0) + amount, a.target);
    }
    if (achieveProgress[a.id] >= a.target && !achieveDone[a.id]) {
      achieveDone[a.id] = true;
      const isHidden = HIDDEN_ACHIEVEMENTS.some(h => h.id === a.id);
      (typeof bdToast==='function'?bdToast:function(){})(`${isHidden ? '🔮 히든 업적' : '🏆 업적'} 달성: ${a.icon} ${a.name}! (+${isHidden ? 150 : 50}G)`);
      playerGold += isHidden ? 150 : 50;
      // 사이버 싸이코 특수 보상/패널티
      if (a.id === 'h_cyber_psycho') {
        _cyberPsychoBonus = 12;          // 대시 쿨타임 -0.2초
        _cyberPsychoMaxHPPenalty = 20;   // 최대 HP -20
        syncSharedHP(heroHP, false); // 현재 HP 초과 방지 + 공용 HP 반영
        (typeof bdToast==='function'?bdToast:function(){})('🤖 대시 쿨타임 -0.2초 / 최대 HP -20 적용!');
      }
      if (document.getElementById('inv-achieve-panel').style.display !== 'none') renderAchievePanel();
    }
  });
}

// 업적 패널 렌더링
function renderAchievePanel(targetId) {
  const panel = document.getElementById(targetId || 'inv-achieve-panel');
  if (!panel) return;
  panel.innerHTML = '';

  const total      = ACHIEVEMENTS.length + HIDDEN_ACHIEVEMENTS.length;
  const done       = [...ACHIEVEMENTS, ...HIDDEN_ACHIEVEMENTS].filter(a => achieveDone[a.id]).length;
  const hiddenDone = HIDDEN_ACHIEVEMENTS.filter(a => achieveDone[a.id]).length;

  // 요약
  const summary = document.createElement('div');
  summary.className = 'achieve-summary';
  summary.textContent = `🏆 달성: ${done} / ${total}  (히든: ${hiddenDone} / ${HIDDEN_ACHIEVEMENTS.length})`;
  panel.appendChild(summary);

  // 일반 업적 그룹별
  const groups = [...new Set(ACHIEVEMENTS.map(a => a.group))];
  groups.forEach(group => {
    const groupWrap = document.createElement('div');

    const groupTitle = document.createElement('div');
    groupTitle.style.cssText = 'font-size:0.75rem;color:#c8902a;font-weight:700;margin:6px 0 4px;padding-left:2px;letter-spacing:0.05em;';
    groupTitle.textContent = `— ${group} —`;
    groupWrap.appendChild(groupTitle);

    ACHIEVEMENTS.filter(a => a.group === group).forEach(a => {
      const prog = achieveProgress[a.id] || 0;
      const pct  = Math.min(100, Math.round(prog / a.target * 100));
      const done = achieveDone[a.id];

      const card = document.createElement('div');
      card.className = 'achieve-card' + (done ? ' done' : '');
      card.innerHTML = `
        <div class="achieve-icon">${a.icon}</div>
        <div class="achieve-info">
          <div class="achieve-name">${a.name}</div>
          <div class="achieve-desc">${a.desc}</div>
          <div class="achieve-prog-wrap">
            <div class="achieve-prog-bar" style="width:${pct}%"></div>
          </div>
          <div class="achieve-prog-text">${prog.toLocaleString()} / ${a.target.toLocaleString()}</div>
        </div>
        <div class="achieve-badge">${done ? '✅' : ''}</div>
      `;
      groupWrap.appendChild(card);
    });
    panel.appendChild(groupWrap);
  });

  // ── 히든 업적 섹션 ──
  const hiddenWrap = document.createElement('div');

  const hiddenTitle = document.createElement('div');
  hiddenTitle.style.cssText = 'font-size:0.75rem;color:#9966cc;font-weight:700;margin:10px 0 4px;padding-left:2px;letter-spacing:0.05em;';
  hiddenTitle.textContent = '— 히든 —';
  hiddenWrap.appendChild(hiddenTitle);

  HIDDEN_ACHIEVEMENTS.forEach(a => {
    const prog = achieveProgress[a.id] || 0;
    const done = achieveDone[a.id];
    const pct  = Math.min(100, Math.round(prog / a.target * 100));

    const card = document.createElement('div');
    card.className = 'achieve-card hidden-achieve' + (done ? ' done hidden-done' : '');

    if (done) {
      card.innerHTML = `
        <div class="achieve-icon">${a.icon}</div>
        <div class="achieve-info">
          <div class="achieve-name" style="color:#cc88ff">${a.name}</div>
          <div class="achieve-desc">${a.desc}</div>
          <div class="achieve-prog-wrap">
            <div class="achieve-prog-bar" style="width:100%;background:linear-gradient(90deg,#9933cc,#cc66ff)"></div>
          </div>
          <div class="achieve-prog-text">${prog.toLocaleString()} / ${a.target.toLocaleString()}</div>
        </div>
        <div class="achieve-badge">✅</div>
      `;
    } else {
      card.innerHTML = `
        <div class="achieve-icon" style="filter:grayscale(1) opacity(0.3)">🔮</div>
        <div class="achieve-info">
          <div class="achieve-name" style="color:#666">???</div>
          <div class="achieve-desc" style="color:#444">달성하면 공개됩니다</div>
        </div>
        <div class="achieve-badge" style="color:#554466">🔒</div>
      `;
    }
    hiddenWrap.appendChild(card);
  });
  panel.appendChild(hiddenWrap);
}
window.BD_renderAchievePanel = renderAchievePanel;

let questPanelOpen = false;

// ── 퀘스트 정의 ──
const DAILY_QUEST_DEFS = [
  {
    id: 'walk_1000',
    icon: '🚶',
    name: '아침 산책',
    desc: '맵 안에서 1,000보 걷기',
    type: 'walk',
    target: 1000,
    reward: { gold: 80, xp: 30 },
  },
  {
    id: 'buy_3items',
    icon: '🛒',
    name: '쇼핑객',
    desc: '상점에서 아이템 3개 구매하기',
    type: 'buy',
    target: 3,
    reward: { gold: 120, xp: 40 },
  },
  {
    id: 'visit_shop_5',
    icon: '🏪',
    name: '단골손님',
    desc: '서로 다른 상점 5곳 방문하기',
    type: 'visit_shop',
    target: 5,
    reward: { gold: 100, xp: 35 },
  },
  {
    id: 'regen_10',
    icon: '💚',
    name: '휴식의 미덕',
    desc: 'HP를 10회 회복하기',
    type: 'regen',
    target: 10,
    reward: { gold: 60, xp: 20 },
  },
  {
    id: 'dash_20',
    icon: '💨',
    name: '질풍',
    desc: '대시를 20번 사용하기',
    type: 'dash',
    target: 20,
    reward: { gold: 90, xp: 25 },
  },
];

// ── 퀘스트 상태 저장 구조 ──
// key = todayKey(), value = { progress:{}, claimed:{} }
const _questStore = {};

function _todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function _getTodayQuests() {
  const key = _todayKey();
  if (!_questStore[key]) {
    // 매일 퀘스트 3~4개 무작위 선택
    const shuffled = [...DAILY_QUEST_DEFS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    _questStore[key] = {
      quests: selected,
      progress: {},
      claimed: {},
    };
    selected.forEach(q => { _questStore[key].progress[q.id] = 0; });
  }
  return _questStore[key];
}

// ── 퀘스트 진행도 업데이트 (다른 시스템에서 호출) ──
function questProgress(type, amount) {
  amount = amount || 1;
  const data = _getTodayQuests();
  data.quests.forEach(q => {
    if (q.type !== type) return;
    if (data.claimed[q.id]) return;
    data.progress[q.id] = Math.min((data.progress[q.id] || 0) + amount, q.target);
  });
  // 패널이 열려있으면 즉시 갱신
  if (questPanelOpen) renderQuestList();
}

// ── 보상 수령 ──
function claimQuest(qid) {
  const data = _getTodayQuests();
  const q = data.quests.find(x => x.id === qid);
  if (!q) return;
  if (data.claimed[qid]) return;
  if ((data.progress[qid] || 0) < q.target) return;

  data.claimed[qid] = true;
  playerGold += q.reward.gold;
  addSafetyXP(q.reward.xp);
  showShopToast(`🏛️ 퀘스트 완료! +${q.reward.gold}G +${q.reward.xp}XP`);
  achieveTrack('quest_done', 1);
  renderQuestList();
  document.getElementById('quest-gold-amount').textContent = playerGold;
}

// ── 퀘스트 패널 열기 ──
function openQuestPanel() {
  const hall = getNearQuest();
  if (!hall) return;

  questPanelOpen = true;
  moveKeys = {w:false,a:false,s:false,d:false};
  document.getElementById('quest-overlay').classList.add('open');
  document.getElementById('quest-gold-amount').textContent = playerGold;
  renderQuestList();
}

// ── 퀘스트 패널 닫기 ──
function closeQuestPanel() {
  questPanelOpen = false;
  document.getElementById('quest-overlay').classList.remove('open');
}

// ── 퀘스트 건물 근접 여부 ──
function getNearQuest() {
  const stage = STAGES[currentStage];
  if (!stage) return null;
  const halls = stage.objects.filter(o => o.interactable === 'quest');
  for (const h of halls) {
    const left   = h.rx - 0.05;
    const right  = h.rx + h.rw + 0.05;
    const bottom = h.ry + h.rh;
    const dy = heroY - bottom;
    if (heroX >= left && heroX <= right && dy >= -0.02 && dy < 0.20) return h;
  }
  return null;
}

// 위험 오브젝트 근처 판정 (interactable === 'hazard')
function getNearHazard() {
  const stage = STAGES[currentStage];
  if (!stage) return null;
  const hazards = stage.objects.filter(o => o.interactable === 'hazard' && !o.hidden && !o.__bdGone && !(typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(o)));   // (v52/75) 소멸된 위험요소 제외
  for (const h of hazards) {
    // (v101) 콜라이더에 막혀 멈춘 위치가 판정 밖이 되어 '보이는데 조사 불가'가 되던 문제 —
    //  캐릭터 반경 + 콜라이더 크기를 고려해 여유를 다시 확보한다.
    const __pad = Math.max(0.055, (typeof HERO_WR !== 'undefined' ? HERO_WR : 0.022) * 2.2);
    const __cw = (h.cw != null ? h.cw : 0), __ch = (h.ch != null ? h.ch : 0);
    const __padX = __pad + Math.max(0, (__cw - (h.rw||0)) / 2);
    const __padY = __pad + Math.max(0, (__ch - (h.rh||0)) / 2);
    const left   = h.rx - __padX;
    const right  = h.rx + h.rw + __padX;
    const top    = h.ry - __padY;
    const bottom = h.ry + h.rh + __padY;
    if (heroX >= left && heroX <= right && heroY >= top && heroY <= bottom) {
      try { if(window.BD_isTutorialActive && window.BD_isTutorialActive()) window.BD_tutorialAdvance('find'); } catch(e){}
      return h;
    }
  }
  return null;
}

// ── 퀘스트 리스트 렌더링 ──
function renderQuestList() {
  const data = _getTodayQuests();
  const list = document.getElementById('quest-list');
  if (!list) return;
  list.innerHTML = '';

  data.quests.forEach(q => {
    const prog = data.progress[q.id] || 0;
    const pct  = Math.min(Math.round(prog / q.target * 100), 100);
    const done = prog >= q.target;
    const claimed = !!data.claimed[q.id];

    const card = document.createElement('div');
    card.className = 'quest-card' + (done ? ' done' : '') + (claimed ? ' claimed' : '');

    let claimBtnHtml = '';
    if (claimed) {
      claimBtnHtml = `<div class="quest-claimed-label">✅ 수령 완료</div>`;
    } else {
      claimBtnHtml = `<button class="quest-claim-btn" ${done ? '' : 'disabled'} onclick="claimQuest('${q.id}')">보상 수령</button>`;
    }

    card.innerHTML = `
      <div class="quest-card-top">
        <div class="quest-icon">${q.icon}</div>
        <div class="quest-info">
          <div class="quest-name">${q.name}</div>
          <div class="quest-desc">${q.desc}</div>
        </div>
        <div class="quest-reward-tag">+${q.reward.gold}G / +${q.reward.xp}XP</div>
      </div>
      <div class="quest-progress-row">
        <div class="quest-progress-bar-wrap">
          <div class="quest-progress-bar ${done ? 'done-bar' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="quest-progress-text">${prog} / ${q.target}</div>
      </div>
      ${claimBtnHtml}
    `;
    list.appendChild(card);
  });
}

// ── 걸음수 카운터 (이동 루프에서 호출) ──
let _questStepAcc = 0;
function _countStep(dx, dy) {
  // 실제로 움직인 거리를 픽셀 단위로 환산 후 누적
  const dist = Math.sqrt(dx*dx + dy*dy);
  _questStepAcc += dist * 10000; // 스케일 보정 (맵 단위는 0~1)
  if (_questStepAcc >= 1) {
    const steps = Math.floor(_questStepAcc);
    _questStepAcc -= steps;
    questProgress('walk', steps);
  }
}

// ── 방문 상점 추적 ──
const _visitedShopKeys = new Set();
function _trackShopVisit(storeKey) {
  if (_visitedShopKeys.has(storeKey)) return;
  _visitedShopKeys.add(storeKey);
  questProgress('visit_shop', 1);
  achieveTrack('visit_shop', 1);
}

document.addEventListener('keydown', function(e) {
  // 옵션 키배치 리스닝 중이면 게임 키는 무시 (옵션 리스너가 처리)
  if (listeningId) return;
  if (document.getElementById('game-screen').style.display !== 'block') return;
  const k = e.key.toLowerCase();

  // Space 키: 브라우저 기본 스크롤 방지 (게임 화면 활성 시 항상)
  if (k === ' ') e.preventDefault();

  // 퀘스트 패널이 열려 있을 때: F 또는 ESC로 닫기, 이동 차단
  if (questPanelOpen) {
    if (k === 'f' || k === 'escape') { e.preventDefault(); closeQuestPanel(); }
    return;
  }

  // 상점이 열려 있을 때: F 또는 ESC로 닫기, 이동 차단
  if (shopOpen) {
    if (k === 'f' || k === 'escape') { e.preventDefault(); closeShop(); }
    return;
  }

  // 인벤토리가 열려 있을 때: E 또는 ESC로 닫기, 이동 차단
  if (invOpen) {
    /* (v341) 외부 경로로 창만 닫히고 플래그가 남으면 «다음 E가 헛닫기»가 되어
       번갈아 한 번씩 안 열리던 문제 — DOM과 어긋난 플래그는 즉시 동기화하고 통과 */
    var __ovE = document.getElementById('inv-overlay');
    if (!(__ovE && __ovE.classList.contains('open'))) { invOpen = false; }
    else { if (k === 'e' || k === 'escape') { e.preventDefault(); closeInventory(); } return; }
  }

  // 대화창이 열려 있을 때: F/Space/Enter로 진행, ESC로 닫기, 이동 차단
  if (dialogueOpen) {
    // (v228) 표시-플래그 동기화: 대화창이 화면에서 이미 닫혔는데 플래그만 남아
    //  이동·상호작용이 영구 차단되던 잔존 상태를 자가 복구한다.
    const _vn = document.getElementById('dialogue-box');
    const _vis = _vn && _vn.offsetHeight > 0 && parseFloat(getComputedStyle(_vn).opacity) > 0.05;
    if (!_vis) {
      dialogueOpen = false;   // 유령 플래그 해제 후 아래 정상 처리로 진행
    } else {
      if (k === 'f' || k === ' ' || k === 'enter') { e.preventDefault(); advanceDialogue(); }
      else if (k === 'escape') { e.preventDefault(); closeDialogue(); }
      return;
    }
  }

  // (v139) 봉담 컷신·간이 대화창·모달·전투 중엔 이동/상호작용 키를 전부 차단
  // (프롤로그 등 컷신 재생 중 WASD로 돌아다니다가 진행이 꼬이는 문제 방지)
  if (window.BD_isInputBlocked && window.BD_isInputBlocked()) { return; }

  if (k === 'w' || k === 'arrowup')    moveKeys.w = true;
  if (k === 's' || k === 'arrowdown')  moveKeys.s = true;
  if (k === 'a' || k === 'arrowleft')  moveKeys.a = true;
  if (k === 'd' || k === 'arrowright') moveKeys.d = true;
  // Shift키: 대시
  // (v199) 대시 기능 제거 — Shift 바인딩 삭제
  // R키: 마법사 속성 전환
  /* (v381) 직업 제거 — R(마법사 속성 전환) 바인딩 삭제 */
  // Z키: 고장난 하드웨어 스킬
  if (k === 'z') { activateHWSkill(); return; }
  // E키: 인벤토리 열기
  if (k === 'e') { openInventory(); return; }
  // ESC: 게임 종료 (상점 닫기와 분리됨)
  if (k === 'escape') { exitGame(); return; }
  // F키: 편의점=상점, 도서관 앞=입장, 실내=계단(층 이동)/문(나가기)
  if (k === 'f') {
    const st = STAGES[currentStage];
    // ── 가장 가까운 상호작용 대상을 선택 (우선순위 대신 거리 기준) ──
    // 후보 목록: {type, dist, obj} 로 모아서 가장 가까운 것 실행
    const cand = [];
    // (버그 수정 v152) "경계심" 안전 스킬(위험 감지 범위 +15%/Lv)이 실제로는
    // 아무 데도 연결 안 돼 있던 순수 장식용 스탯이었음 — 상호작용 거리에 실제로 반영
    let R = 0.055;  // (v289) 상호작용 가능 최대 거리 — 절반 축소
    try { if (typeof getSafetyBonus === 'function') R *= (1 + getSafetyBonus('awareness') * 0.15); } catch(e){}
    const pushIf = (ok, cx, cy, type, obj) => {
      if (!ok) return;
      /* (v305) 큰 위험요소는 사각형까지의 거리로 판정 — 중심점 반경으론
         골목의 소음(세로 0.094)·어두운 산책로(0.237) 앞에 서도 F가 닿지 않았다 */
      let d;
      if (obj && obj.interactable === 'hazard' && obj.rx != null && obj.rw != null) {
        const dx2 = Math.max(obj.rx - heroX, 0, heroX - (obj.rx + obj.rw));
        const dy2 = Math.max(obj.ry - heroY, 0, heroY - (obj.ry + (obj.rh || 0)));
        d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      } else {
        const dx = heroX - cx, dy = heroY - cy;
        d = Math.sqrt(dx * dx + dy * dy);
      }
      if (d <= R) cand.push({ type, dist:d, obj });
    };

    // 위험 오브젝트: 모든 hazard 중 가장 가까운 것
    if (st && st.objects) {
      for (const o of st.objects) {
        if (o.interactable !== 'hazard') continue;
        if (o.hidden || o.__bdGone) continue;   // (v52/75) 소멸된 위험요소는 상호작용 불가
        // 잠긴 보스는 상호작용 불가
        if (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(o)) continue;
        // 정화된 것은 상호작용 대상에서 제외
        const purified = o._purified || (typeof window.BD_isPurified === 'function' && window.BD_isPurified(o.hazardId || o.id || o.label));
        if (purified) continue;
        pushIf(true, o.rx + (o.rw||0)/2, o.ry + (o.rh||0)/2, 'hazard', o);
      }
    }
    // NPC
    if (currentStage === NPC_STAGE) pushIf(true, NPC_X, NPC_Y, 'npc', null);
    // 퀘스트 NPC
    if (currentStage === QNPC_STAGE) pushIf(true, QNPC_X, QNPC_Y, 'qnpc', null);
    // (v144) 회복 시설 (공원 등) — useFacility()가 정의만 되고 실제로 연결된 곳이 없던 걸 수정
    if (st && st.objects) {
      for (const o of st.objects) {
        if (o.interactable !== 'facility') continue;
        if (o.hidden) continue;   // (v61) 숨김 오브젝트는 상호작용 후보 제외
        pushIf(true, o.rx + (o.rw||0)/2, o.ry + (o.rh||0)/2, 'facility', o);
      }
    }
    // (v198) 안내 건물(랜드마크·정류장): 건물 앞 보도 밴드에서 F로 소개 대사
    if (st && st.objects) {
      for (const o of st.objects) {
        if (o.interactable !== 'info' || !o.infoLines) continue;
        if (o.hidden) continue;   // (v61) 숨김 오브젝트는 상호작용 후보 제외
        const inX = heroX >= o.rx - 0.05 && heroX <= o.rx + (o.rw||0) + 0.05;
        const dy = heroY - (o.ry + (o.rh||0));
        if (inX && dy >= -0.02 && dy < 0.20) {
          cand.push({ type:'info', dist: Math.max(0, dy), obj:o });
        }
      }
    }

    // (v198) 상점·도서관 정문도 거리 후보로 승격 — 정문 앞 위험요소보다 문이 가까우면 문이 우선
    if (st && !st.interior && st.objects) {
      const _doorDist = (o) => {
        const inX = heroX >= o.rx - 0.05 && heroX <= o.rx + (o.rw||0) + 0.05;
        const dyd = heroY - (o.ry + (o.rh||0));
        return (inX && dyd >= -0.02 && dyd < 0.20) ? Math.max(0, dyd) : null;
      };
      for (const o of st.objects) {
        if (o.hidden) continue;   // (v61) 숨김 오브젝트는 상호작용 후보 제외
        if (o.interactable === 'shop') { const dd = _doorDist(o); if (dd !== null) cand.push({ type:'shop', dist:dd, obj:o }); }
        else if (o.interactable === 'quest') { const dd = _doorDist(o); if (dd !== null) cand.push({ type:'questdoor', dist:dd, obj:o }); }
      }
    }

    // 실내: 계단/문은 기존 우선 처리 (거리 개념이 다름)
    if (st && st.interior) {
      const stair = getNearStair();
      if (stair) { fadeToStage(stair.to, stair.entryX, stair.entryY, 600); return; }
      if (isNearLibraryDoor()) { exitLibrary(); return; }
    }

    // 후보 중 가장 가까운 것 선택
    if (cand.length) {
      cand.sort((a,b) => a.dist - b.dist);
      // (v222) 위험요소 우선: 건물·NPC와 붙어 있어도 정화 대상이 먼저 잡히게
      const hz = cand.filter(c => c.type === 'hazard');
      const best = hz.length ? hz[0] : cand[0];
      if (best.type === 'hazard' && typeof window.BD_hazardInteract === 'function') {
        // 위험요소 조사 시 튜토리얼 진행
        try { if(window.BD_isTutorialActive && window.BD_isTutorialActive()) window.BD_tutorialAdvance('find'); } catch(e){}
        window.BD_hazardInteract(best.obj);
        return;
      }
      if (best.type === 'qnpc') {
        openQuestDialogue();
        // 정도현과 대화: 봉담 NPC 퀘스트("정도현의 부탁")를 받고 대화 목표 완료
        try {
          if(typeof window.BD_acceptQuest==='function') window.BD_acceptQuest('npc_dohyun');
          if(typeof window.BD_subQuestProgress==='function') window.BD_subQuestProgress('npc_dohyun');
        } catch(e){}
        return;
      }
      if (best.type === 'npc') {
        openDialogue(getNearNPC());
        surveyQuestProgress('talk_hyunji', 1);
        // 임현지와 대화: NPC 퀘스트를 받고("임현지의 부탁") 대화 목표 완료 처리
        try {
          if(typeof window.BD_acceptQuest==='function') window.BD_acceptQuest('npc_hyunji');
          if(typeof window.BD_subQuestProgress==='function') window.BD_subQuestProgress('npc_hyunji');
        } catch(e){}
        return;
      }
      if (best.type === 'facility') {
        try { if (typeof window.BD_useFacility === 'function') window.BD_useFacility(best.obj.facilityType); } catch(e){}
        return;
      }
      if (best.type === 'info') {
        try { showDialog(best.obj.label || '안내', best.obj.infoLines); } catch(e){}
        return;
      }
      if (best.type === 'shop') { openShop(); return; }
      if (best.type === 'questdoor') { enterLibrary(); return; }
    }

    // 후보가 없을 때: 편의점/도서관 입구 등 넓은 영역 상호작용 (폴백)
    if (!st.interior) {
      if (isNearStore24()) { openShop(); return; }
      if (getNearQuest()) { enterLibrary(); return; }
    }
  }
});
document.addEventListener('keyup', function(e) {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup')    moveKeys.w = false;
  if (k === 's' || k === 'arrowdown')  moveKeys.s = false;
  if (k === 'a' || k === 'arrowleft')  moveKeys.a = false;
  if (k === 'd' || k === 'arrowright') moveKeys.d = false;
});

// ── 좌클릭: 평타 공격 ──
document.addEventListener('mousedown', function(e) {
  if (e.button !== 0) return;
  // ── 위험요소 배치 모드: 클릭한 위치에 위험요소를 놓는다 ──
  if (window.__bdHazardPlaceMode) {
    const cv = document.getElementById('game-canvas');
    // (v126 수정) 클릭 관통 방지 3중 가드:
    //  1) 클릭 대상이 게임 캔버스 자체일 때만 배치 (버튼·HUD·미니맵·패널 클릭은 무시)
    //  2) 버튼/입력류 위 클릭은 어떤 경우에도 배치 금지
    //  3) 모드 토글 직후 300ms는 무장 대기 (버튼 클릭 관통 레이스 차단)
    const onUi = e.target && e.target.closest && e.target.closest('button, input, select, a, label, .bd-modal, #bge-panel, [id^="bd-"], [id^="bge-"], [id^="tc-"]');
    const armed = !window.__bdHazardPlaceArmedAt || (Date.now() - window.__bdHazardPlaceArmedAt) > 300;
    if (cv && e.target === cv && !onUi && armed) {
      const rect = cv.getBoundingClientRect();
      // 화면 클릭 좌표 → 캔버스 픽셀 좌표
      const px = (e.clientX - rect.left) * (cv.width / rect.width);
      const py = (e.clientY - rect.top) * (cv.height / rect.height);
      // 캔버스 픽셀 → 맵 좌표 (toScreenX/Y의 정확한 역변환)
      const mapX = camX + VIEWPORT_W * (((px - cv.width/2) / currentScale + BASE_W/2) / BASE_W - 0.5);
      const mapY = camY + VIEWPORT_H * (((py - cv.height/2) / currentScale + BASE_H/2) / BASE_H - 0.5);
      const rx = Math.max(0.02, Math.min(0.96, mapX));
      const ry = Math.max(0.02, Math.min(0.96, mapY));
      if (typeof window.BD_placeHazardAt === 'function') {
        window.BD_placeHazardAt(rx, ry);
      }
      e.preventDefault(); e.stopPropagation();
      return;
    }
    // 배치 모드 중 캔버스 외 클릭(버튼·HUD 등)은 배치도, 평타 공격도 하지 않음
    // (버튼의 onclick은 click 이벤트라 정상 동작함)
    return;
  }
  if (dialogueOpen) { advanceDialogue(); return; }
  // (v239) 필드 좌클릭 평타 제거 — 전투는 위험요소 조사(F) → 턴제 전투로만 일어난다.
  //  레거시 판타지 RPG 시절의 잔재로, 지킴이 컨셉과 맞지 않고 오조작만 유발했다.
});

// (v139) 이동·상호작용 공통 차단 판정 — 컷신·대화창·모달·전투 중엔 이동/상호작용을 전부 막아
// 진행이 꼬이지 않게 한다. 마우스 공격·키보드 이동·모바일 조이스틱이 전부 이 함수를 공유한다.
window.BD_isInputBlocked = function(){
  try {
    if (dialogueOpen) return true;                                       // 임현지 등 간이 대화창
    if (window.__bdSceneActive) return true;                             // 봉담 비주얼 노벨 컷신
    if (window.HSR && window.HSR.active) return true;                    // 전투 중
    const bdDlg = document.getElementById('bd-dialog');
    if (bdDlg && getComputedStyle(bdDlg).display !== 'none') return true; // 봉담 간이 대화창
    const dlgOverlay = document.getElementById('dialogue-overlay');
    if (dlgOverlay && getComputedStyle(dlgOverlay).display !== 'none') return true; // 비주얼 노벨 대화창
    if (document.querySelector('.bd-modal.show')) return true;           // 봉담 모달(설정/슬롯/일시정지 등)
    const choice = document.getElementById('bd-choice');
    if (choice && getComputedStyle(choice).display !== 'none') return true; // 조사 선택창
  } catch(err) {}
  return false;
};

// 창 포커스 잃을 때도 키 상태 초기화 (Alt+Tab 등)
window.addEventListener('blur', function() {
  moveKeys = {w:false, a:false, s:false, d:false};
});
