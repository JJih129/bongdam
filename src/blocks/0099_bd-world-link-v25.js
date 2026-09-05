
/* ══ (v25 통합) 봉담 4개 리 월드(210~213) ↔ 게임 진행 연결 레이어 ══════════════
   전달정보 v24 체크리스트 구현:
   ① 챕터↔맵 매핑(와우리212·상리213·동화리211·수영리210) ② 시설 방문→스탬프 브리지
   ③ 버스 4정류장 신맵 이전 + 정류장 오브젝트 ④ 위험요소 ow21X_* 신규 배치
   ⑤ NPC 6명 임시 배치(정화 전/후 대사 분기) ⑥ 최종 보스 212 광장 이관·구형 비활성
   ⑦ 수영약국 4장 수집 시설 승격 ⑧ 신맵 로드 좌표 보정
   원칙: 기존 함수 재정의 없음(비침습) · 멱등 주입 · 위험요소는 __BD_DEFAULT_HAZARDS
   스냅샷에 편승해 기존 매 프레임 복원 보증을 그대로 물려받는다. */
(function () {
  'use strict';
  var IDS = [210, 211, 212, 213];
  var STATE = window.__BD_WORLD_LINK_V25 = { ready: false, log: [] };
  function log(m) { try { STATE.log.push(m); } catch (e) { } }
  function addOnce(arr, v) { if (Array.isArray(arr) && arr.indexOf(v) < 0) arr.push(v); }

  /* ── 배치 데이터 — 콜라이더·시설 F캡처 반경(185px)·게이트·상호 간격을
        매니페스트 기준 정적 솔버로 전수 검증한 좌표만 사용 ── */
  var DIM = { 210: [1448, 3258], 211: [2896, 3258], 212: [1448, 3258], 213: [5792, 2172] };
  function box(sid, x, y, wpx, hpx) {
    var W = DIM[sid][0], H = DIM[sid][1], w = wpx / W, h = hpx / H;
    return { rx: +(x - w / 2).toFixed(4), ry: +(y - h / 2).toFixed(4), rw: +w.toFixed(4), rh: +h.toFixed(4) };
  }
  function hz(sid, id, variant, family, x, y, label, optional) {
    var b = box(sid, x, y, 124, 124);
    var o = { type: 'hazard', rx: b.rx, ry: b.ry, rw: b.rw, rh: b.rh, cx: b.rx, cy: b.ry, cw: b.rw, ch: b.rh,
      label: label, interactable: 'hazard', hazardVariant: variant, hazardFamily: family, hazardId: id,
      hidden: false, locked: false };
    if (optional) o.bdOptional = true;   // 선택 목표 — 메인 카운트 미포함 규칙 준수
    return o;
  }
  var HAZARDS = {
    '212': [hz(212, 'ow212_kickboard_1', 'kickboard', 'pollute', 0.266, 0.484, '길을 막은 킥보드'),
            hz(212, 'ow212_bicycle_1', 'bicycle', 'pollute', 0.618, 0.502, '길을 막은 자전거'),   // (v34) 프롤로그가 메인 1개를 소모해 1장이 완료 불가하던 문제 — 메인 1개 증원

            hz(212, 'ow212_trash_1', 'trash', 'pollute', 0.52, 0.44, '방치된 쓰레기 더미'),
            hz(212, 'ow212_smoke_1', 'cigarette', 'smoke', 0.34, 0.53, '떠도는 담배 연기', true)],
    '213': [hz(213, 'ow213_bottle_1', 'bottle', 'pollute', 0.232, 0.292, '버려진 술병'),
            hz(213, 'ow213_glass_1', 'glass', 'pollute', 0.408, 0.338, '깨진 유리 조각'),
            hz(213, 'ow213_alley_1', 'dark_alley', 'dark', 0.33, 0.45, '어두운 산책로', true)],
    '211': [hz(211, 'ow211_graffiti_1', 'graffiti', 'pollute', 0.16, 0.192, '지워지지 않은 낙서'),
            hz(211, 'ow211_noise_1', 'noise_bat', 'smoke', 0.25, 0.28, '골목의 소음'),
            hz(211, 'ow211_trash_1', 'trash', 'pollute', 0.32, 0.22, '방치된 쓰레기', true)],
    '210': [hz(210, 'ow210_streetlight_1', 'streetlight', 'dark', 0.62, 0.34, '고장 난 가로등'),
            hz(210, 'ow210_crack_1', 'road_crack', 'dark', 0.44, 0.56, '갈라진 길'),
            hz(210, 'ow210_alley_1', 'dark_alley', 'dark', 0.378, 0.288, '어두운 골목', true)]
  };
  var BOSS_POS = { x: 0.408, y: 0.312 };   // 212 와우리 복합문화건물 앞 광장

  var NPCS = [
    { sid: 212, id: 'ow_npc_eunji', name: '은지', asset: 'culture_npc_02', x: 0.392, y: 0.48, region: 'wawoo',
      before: ['안녕하세요, 지킴이! 저는 은지예요. 이 앞 아파트에 살아요.', '이 동네는 사람도 많고 길도 넓어서, 늘 조금씩 신경 쓰이는 게 생겨요.'],
      after: ['길이 훨씬 깨끗해졌어요! 고마워요, 지킴이님!', '이제 도서관 가는 길도 무섭지 않아요.'] },
    { sid: 213, id: 'ow_npc_dohyun', name: '사서 도현', asset: 'culture_npc_05', x: 0.33, y: 0.272, region: 'sang',
      before: ['봉담도서관 사서 도현이에요. 1·2층이 도서관, 3층이 청소년문화의집이에요.', '조용히 공부하거나 책 읽기 좋은 곳이니 언제든 들러요.'],
      after: ['공원길이 안전해졌네요. 이용객들도 마음 놓고 다니겠어요. 고마워요!'] },
    { sid: 213, id: 'ow_npc_seoyeon', name: '서연', asset: 'culture_npc_03', x: 0.044, y: 0.516, region: 'sang',
      before: ['안녕! 나 서연이야. 방과 후엔 거의 이 공원에서 놀아.', '지킴이가 자주 들러 주면 다들 좋아할 거야!'],
      after: ['공원이 다시 밝아진 것 같아! 고마워, 지킴이!'] },
    { sid: 211, id: 'ow_npc_haneul', name: '하늘', asset: 'culture_npc_06', x: 0.198, y: 0.25, region: 'donghwa',
      before: ['어린이문화센터에서 일하는 하늘이에요. 아이들 프로그램을 맡고 있어요.', '센터 앞은 아이들이 뛰어다니니까 늘 조심조심이에요.'],
      after: ['거리가 조용하고 깨끗해졌어요! 아이들이 안심하고 다녀요. 고마워요!'] },
    { sid: 210, id: 'ow_npc_eunji_mother', name: '은지 어머니', asset: 'culture_npc_04', x: 0.462, y: 0.612, region: 'suyeong',
      before: ['은지 엄마예요. 우리 은지랑 와우리에서 여기까지 자주 오간답니다.', '지킴이 활동 한다고 들었어요. 은지랑도 친하게 지내 줘요.'],
      after: ['덕분에 밤길이 한결 안심돼요. 은지가 지킴이님 칭찬을 얼마나 하던지!'] },
    { sid: 210, id: 'ow_npc_doyun', name: '약사 도윤', asset: 'culture_npc_07', x: 0.876, y: 0.34, region: 'suyeong',
      before: ['수영약국 약사 도윤입니다. 다치면 참지 말고 바로 들러요.', '여름엔 더위 조심, 겨울엔 빙판 조심하고요.'],
      after: ['요즘은 다쳐서 오는 분이 확 줄었어요. 지킴이님 덕분입니다!'] }
  ];

  var BUS = {
    bus_wawoo_main:   { stageId: 212, spawnX: 0.520, spawnY: 0.205, stop: { x: 0.56,  y: 0.185 } },
    bus_sang_main:    { stageId: 213, spawnX: 0.640, spawnY: 0.270, stop: { x: 0.66,  y: 0.25 } },
    bus_donghwa_main: { stageId: 211, spawnX: 0.512, spawnY: 0.365, stop: { x: 0.530, y: 0.345 } },   // (v40) 십자 도로 개편 — 중앙 보도 광장으로
    bus_suyeong_main: { stageId: 210, spawnX: 0.352, spawnY: 0.245, stop: { x: 0.365, y: 0.225 } }   // (v40) 정류장 재배치(좌측 보도)에 맞춤
  };

  var FMAP = { wawoo_youth_house: 'facility_youth_house', wawoo_library: 'facility_wawoo_library', wawoo_complex: 'facility_wawoo_library',
    bongdam_library_main: 'facility_bongdam_library', hope_cafe: 'facility_bongdam_library', bongdam_library: 'facility_bongdam_library',
    cotton_candy_youth: 'facility_youth_playground_bongdam',
    children_center: 'facility_children_culture', national_sports_center: 'facility_national_sports',
    citizen_campus: 'facility_citizen_campus', citizen_campus_main: 'facility_citizen_campus',
    living_culture_workshop: 'facility_citizen_campus', citizen_campus_book_cafe: 'facility_citizen_campus',
    green_environment_center: 'facility_green_center', suyeong_pharmacy: 'facility_suyeong_pharmacy' };

  /* ── 1) 챕터·지역·시설 정의 연결 ── */
  function linkRegistry() {
    var CH = window.BD_REGISTRY_CHAPTERS, R = window.BD_REGISTRY;
    if (!CH || !R) return false;
    addOnce(CH.wawoo.hazardStages, 212); addOnce(CH.sang.hazardStages, 213);
    addOnce(CH.donghwa.hazardStages, 211); addOnce(CH.suyeong.hazardStages, 210);
    addOnce(R.REGION_DEFINITIONS.wawoo.stageIds, 212);
    addOnce(R.REGION_DEFINITIONS.sang.stageIds, 213);
    addOnce(R.REGION_DEFINITIONS.donghwa.stageIds, 211);
    addOnce(R.REGION_DEFINITIONS.suyeong.stageIds, 210);
    if (!R.FACILITY_DEFINITIONS.facility_suyeong_pharmacy) {
      R.FACILITY_DEFINITIONS.facility_suyeong_pharmacy = {
        id: 'facility_suyeong_pharmacy', officialName: '수영약국', displayName: '수영약국', regionId: 'suyeong',
        category: 'safety_hub', tier: 'A', address: '화성시 봉담읍 수영리',
        summary: '수영리 생활권의 약국. 안전 상비약과 응급 안내를 받을 수 있는 4장 거점 시설',
        activities: ['안전 상비약 안내', '다친 곳 응급 처치 상담', '안전지킴이집 역할 안내'],
        repeatService: 'full_heal_save', stampId: 'stamp_suyeong_pharmacy',
        verificationStatus: 'PENDING_LOCAL', verifiedAt: '2026-08-05' };
    }
    addOnce(CH.suyeong.stampAnyOf, 'facility_suyeong_pharmacy');
    log('registry');
    return true;
  }

  /* ── 2) 버스 재배선 ── */
  function linkBus() {
    var S = window.BD_REGISTRY && BD_REGISTRY.BUS_STOPS; if (!S) return false;
    Object.keys(BUS).forEach(function (k) {
      var s = S[k]; if (!s) return;
      s.stageId = BUS[k].stageId;
      // (v53) 하차 지점 동적화 — 에디터로 옮긴 정류장 '발치'에 내리게 (하드코딩 상수는 폴백 전용)
      var st = (typeof STAGES !== 'undefined') && STAGES[BUS[k].stageId];
      /* (v392) 에디터에서 정류장을 다시 만들면 _editorId 가 바뀌어(예: 동화리 pal_*)
         동적 하차 지점 계산이 실패하고 구형 상수 위치에 내렸다 → bus_stop 실오브젝트로 검색 */
      var o = st && Array.isArray(st.objects)
        ? (st.objects.find(function(x){ return x && x.interactable === 'bus_stop' && x.busStopId === k && !x.hidden; })
           || st.objects.find(function(x){ return x && x._editorId === 'bdlink_busstop_' + BUS[k].stageId; })) : null;
      if (o) { s.spawnX = (o.rx || 0) + (o.rw || 0) / 2; s.spawnY = (o.ry || 0) + (o.rh || 0) + 0.035; }
      else { s.spawnX = BUS[k].spawnX; s.spawnY = BUS[k].spawnY; }
    });
    log('bus');
    return true;
  }
  function busObject(k) {
    var b = BUS[k], sid = b.stageId, sz = box(sid, b.stop.x, b.stop.y, 99, 154);
    return { _editorId: 'bdlink_busstop_' + sid, type: 'building', key: 'asset:bld_busstop', assetId: 'bld_busstop',
      customImage: true, rx: sz.rx, ry: sz.ry, rw: sz.rw, rh: sz.rh, label: '버스정류장',
      interactable: 'bus_stop', busStopId: k,
      cx: +(sz.rx + sz.rw * 0.05).toFixed(4), cy: +(sz.ry + sz.rh * 0.55).toFixed(4),
      cw: +(sz.rw * 0.9).toFixed(4), ch: +(sz.rh * 0.45).toFixed(4),
      infoLines: ['봉담 4개 리를 잇는 마을버스가 서는 곳이야.', '차도로 내려가지 말고 인도에서 기다리자!'],
      hidden: false, locked: false };
  }

  /* ── 3) NPC 오브젝트 (기존 주민과 100% 동일 구조 → F 대화 자동 연동) ── */
  function npcObject(n) {
    var sz = box(n.sid, n.x, n.y, 92, 146);
    return { _editorId: 'bdlink_' + n.id, type: 'prop', key: 'asset:' + n.asset, assetId: n.asset, customImage: true,
      rx: sz.rx, ry: sz.ry, rw: sz.rw, rh: sz.rh, label: '주민 · ' + n.name,
      resident: true, residentId: n.id, npcName: n.name, npcLines: n.before.slice(),
      bdLinkRegion: n.region, hidden: false, locked: false };
  }

  /* ── 4) 위험요소·보스 → __BD_DEFAULT_HAZARDS (매 프레임 복원 보증 편승) ── */
  function linkHazards() {
    var SNAP = window.__BD_DEFAULT_HAZARDS; if (!SNAP) return false;
    Object.keys(HAZARDS).forEach(function (sid) {
      var list = SNAP[sid] = SNAP[sid] || [];
      HAZARDS[sid].forEach(function (h) {
        if (!list.some(function (o) { return o && o.hazardId === h.hazardId; })) list.push(h);
      });
    });
    // 최종 보스 이관: 구형 1번 맵 → 212 광장 (전달정보 §1 추가 메모)
    try {
      var src = SNAP['1'] || SNAP[1] || [], boss = null;
      src.some(function (o) { if (o && o.hazardId === 'final_boss_1') { boss = o; return true; } return false; });
      var s212 = SNAP['212'];
      if (boss && !s212.some(function (o) { return o && o.hazardId === 'final_boss_1'; })) {
        var nb = JSON.parse(JSON.stringify(boss));
        var b = box(212, BOSS_POS.x, BOSS_POS.y, 210, 210);
        nb.rx = b.rx; nb.ry = b.ry; nb.rw = b.rw; nb.rh = b.rh;
        nb.cx = b.rx; nb.cy = b.ry; nb.cw = b.rw; nb.ch = b.rh;
        delete nb._editorId;
        s212.push(nb);
      }
      ['1', 1].forEach(function (k) {
        if (Array.isArray(SNAP[k])) SNAP[k] = SNAP[k].filter(function (o) { return !(o && o.hazardId === 'final_boss_1'); });
      });
    } catch (e) { }
    log('hazards');
    return true;
  }
  function stripLegacyBoss() {
    try {
      var st = window.STAGES && STAGES[1];
      if (st && Array.isArray(st.objects)) {
        var n0 = st.objects.length;
        st.objects = st.objects.filter(function (o) { return !(o && o.hazardId === 'final_boss_1'); });
        if (st.objects.length !== n0) log('legacy boss off');
      }
    } catch (e) { }
  }

  /* ── 5) 수영약국 승격 (전달정보 §4 권장 처리) ── */
  function promotePharmacy() {
    try {
      var cfg = window.__BD_DISTRICT_WORLD_V24_CONFIG;
      if (cfg && !STATE._pharmCfg) {
        cfg.stages.forEach(function (s) {
          (s.landmarks || []).forEach(function (lm) {
            if (lm.id === 'suyeong_pharmacy') {
              lm.major = true; lm.visual_only = false;
              if (!lm.activity || lm.activity.indexOf('비수집') >= 0) lm.activity = '안전 상비약 안내를 듣고 활동 스탬프를 받아요.';
            }
          });
        });
        STATE._pharmCfg = true;
      }
      var st = window.STAGES && STAGES[210];
      if (st && Array.isArray(st.objects)) st.objects.forEach(function (o) {
        if (o && o.facilityId === 'suyeong_pharmacy' && o.conceptLandmark) { o.majorFacility = true; o.visualOnly = false; }
      });
      if (st && Array.isArray(st.__v24Landmarks)) st.__v24Landmarks.forEach(function (o) {
        if (o && o.facilityId === 'suyeong_pharmacy') { o.majorFacility = true; o.visualOnly = false; }
      });
    } catch (e) { }
  }

  /* ── 6) 신맵 오브젝트 주입 틱 (멱등) + NPC 정화 전/후 대사 분기 ── */
  function injectTick() {
    try {
      if (typeof STAGES === 'undefined') return;
      Object.keys(BUS).forEach(function (k) {
        var sid = BUS[k].stageId, st = STAGES[sid];
        if (!st || !st.__districtWorldV24) return;
        if (!st.objects) st.objects = [];
        var eid = 'bdlink_busstop_' + sid;
        // (v47) 삭제 툼스톤 존중 — 에디터에서 지운 정류장은 다시 만들지 않는다
        if (Array.isArray(st.deletedSysIds) && st.deletedSysIds.indexOf(eid) >= 0) return;
        if (Array.isArray(st.deletedBusStopIds) && st.deletedBusStopIds.indexOf(k) >= 0) return;
        if (!st.objects.some(function (o) { return o && o._editorId === eid; })) st.objects.push(busObject(k));
      });
      NPCS.forEach(function (n) {
        var st = STAGES[n.sid]; if (!st || !st.__districtWorldV24) return;
        if (!st.objects) st.objects = [];
        var eid = 'bdlink_' + n.id, ex = null;
        st.objects.some(function (o) { if (o && o._editorId === eid) { ex = o; return true; } return false; });
        if (!ex) {
          // (v47) 삭제 툼스톤 존중
          if (Array.isArray(st.deletedSysIds) && st.deletedSysIds.indexOf(eid) >= 0) return;
          st.objects.push(npcObject(n)); return;
        }
        try {   // 장 완료 → 대사 교체 (오브젝트 복제 없이 상태 데이터만 교체 — NPC 공통 규칙)
          var CH = window.BD_REGISTRY_CHAPTERS, P = window.BD_PROGRESS;
          var done = CH && P && P.safety.collectedSafetyFragmentIds.indexOf(CH[n.region].fragmentId) >= 0;
          var want = done ? n.after : n.before;
          if (!ex.__bdHzQuestLines && !ex.__bdIdleV68 && (!ex.npcLines || ex.npcLines[0] !== want[0])) ex.npcLines = want.slice();   // (v57/v68) 부탁·정리된 기본 대사 우선
        } catch (e) { }
      });
      stripLegacyBoss();
      promotePharmacy();
      linkBus();   // (v53) 정류장을 옮기면 하차 지점도 따라가도록 주기 갱신
    } catch (e) { }
  }

  /* ── 7) 시설 방문 → 스탬프 브리지 ── */
  function installFacilityBridge() {
    if (STATE._bridge) return; STATE._bridge = true;
    window.addEventListener('bd-concept-facility-interacted', function (ev) {
      try {
        var d = (ev && ev.detail) || {};
        var fid = FMAP[d.facilityId];
        if (fid && window.BD_Facility) {
          BD_Facility.completeActivity(fid, 'district_visit');
          setTimeout(function () { try { window.BD_Chapter && BD_Chapter.check(); } catch (e) { } }, 700);
        }
        // 복합건물 3층 = 문화의집 실입장 (외관 1개 + 입구 선택 연결)
        if (d.facilityId === 'wawoo_youth_house' && Number(window.currentStage) === 212) {
          setTimeout(function () {
            try {
              var st = STAGES[101];
              if (st && typeof fadeToStage === 'function') {
                try { bdToast('🛗 3층 청소년문화의집으로 올라갑니다…'); } catch (e) { }
                fadeToStage(101, st.spawnX || 0.756, st.spawnY || 0.30, 600);
              }
            } catch (e) { }
          }, 400);
        }
      } catch (e) { }
    });
    log('bridge');
  }

  /* ── 8) 신맵 로드 좌표 보정 (전달정보 §3: 맵 밖이면 기본 스폰 보정) ── */
  function fixPositionTick() {
    try {
      if (typeof currentStage === 'undefined' || IDS.indexOf(Number(currentStage)) < 0) return;
      var bad = !isFinite(heroX) || !isFinite(heroY) ||
        heroX < 0.002 || heroX > 0.998 || heroY < 0.002 || heroY > 0.998;
      if (!bad) return;
      var cfg = window.__BD_DISTRICT_WORLD_V24_CONFIG, sp = null;
      if (cfg) cfg.stages.some(function (s) { if (Number(s.id) === Number(currentStage)) { sp = s.spawn; return true; } return false; });
      if (sp) { heroX = sp[0]; heroY = sp[1]; camX = sp[0]; camY = sp[1]; log('pos fix ' + currentStage); }
    } catch (e) { }
  }

  /* ── 부트: 필요한 전역이 모두 준비된 뒤 1회 연결 + 유지 틱 ── */
  var tries = 0;
  var boot = setInterval(function () {
    tries++;
    var ok = false;
    try {
      ok = (typeof STAGES !== 'undefined') && window.BD_REGISTRY && window.BD_REGISTRY_CHAPTERS &&
        window.__BD_DEFAULT_HAZARDS && window.BD_Facility && STAGES[212] && STAGES[212].__districtWorldV24;
    } catch (e) { ok = false; }
    if (!ok) { if (tries > 600) clearInterval(boot); return; }
    clearInterval(boot);
    linkRegistry(); linkBus(); linkHazards(); installFacilityBridge();
    injectTick();
    setInterval(injectTick, 1600);
    setInterval(fixPositionTick, 1200);
    STATE.ready = true;
    log('ready');
  }, 200);
})();
