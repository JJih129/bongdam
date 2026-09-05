
// ── (v213) 공용 저빈도 틱 ──
//  신규 모듈들의 폴링(setInterval 난립)을 하나의 200ms 마스터 타이머로 통합한다.
//  사용: window.BD_addTick(fn, 주기ms) — setInterval과 같은 시그니처, 등록만 하고 해제 없음.
(function(){
  var jobs = [];
  window.BD_addTick = function(fn, ms){ jobs.push({ fn: fn, ms: ms || 500, last: 0 }); };
  // ── (v215) 세이브 버전 체계 ──
  //  모든 세이브에 sv(버전) 필드를 기록하고, 로드 시 이 함수를 통과시킨다.
  //  향후 저장 구조가 바뀌면 여기서 v(n)→v(n+1) 변환을 체인으로 추가한다.
  // (v231) 전투 결과창(정화 완료) 표시 중 판정 — 후속 연출들이 이걸 기다린다
  window.BD_resultOpen = function(){
    try{
      var r = document.getElementById('hsr-result');
      if (r && getComputedStyle(r).display !== 'none') return true;
      if (window.HSR && HSR.active) return true;
    }catch(e){}
    return false;
  };
  window.BD_GAME_VERSION = 'v270';   // (v270) 기획서 P0 — 파일 버전과 동기
  window.BD_SAVE_VERSION = 4;   // (v270) 기획서 §21 — 시설/안전/이동/스토리 진행 필드 추가

  // ═══════════════════════════════════════════════════════════════
  // (v270) 기획서 §9·§13·§16·§19 — 데이터 레지스트리 (하드코딩 금지 원칙)
  //  시설·지역·정류장·위험요소 데이터는 여기 한 곳에서만 관리한다.
  //  맵 위 실제 배치(FACILITY_PLACEMENTS 시딩 결과)는 STAGES에 살고
  //  에디터로 자유롭게 이동·수정·삭제할 수 있다.
  // ═══════════════════════════════════════════════════════════════
  window.BD_REGISTRY = {
    REGION_DEFINITIONS: {
      wawoo:   { id:'wawoo',   displayName:'와우리',              order:0, stageIds:[1,2,101] },
      sang:    { id:'sang',    displayName:'상리·봉담2지구',      order:1, stageIds:[3] },
      donghwa: { id:'donghwa', displayName:'동화리',              order:2, stageIds:[4] },
      suyeong: { id:'suyeong', displayName:'수영리·외곽 체험권역', order:3, stageIds:[5] }
    },
    BUS_STOPS: {
      bus_wawoo_main:   { id:'bus_wawoo_main',   regionId:'wawoo',   stageId:1, spawnX:0.54, spawnY:0.72, faceDirection:'up' },
      bus_sang_main:    { id:'bus_sang_main',    regionId:'sang',    stageId:3, spawnX:0.50, spawnY:0.78, faceDirection:'up' },
      bus_donghwa_main: { id:'bus_donghwa_main', regionId:'donghwa', stageId:4, spawnX:0.49, spawnY:0.78, faceDirection:'up' },
      bus_suyeong_main: { id:'bus_suyeong_main', regionId:'suyeong', stageId:5, spawnX:0.52, spawnY:0.76, faceDirection:'up' }
    },
    FACILITY_DEFINITIONS: {
      facility_youth_house: { id:'facility_youth_house', officialName:'봉담청소년문화의집', displayName:'봉담청소년문화의집', regionId:'wawoo', category:'public_youth', tier:'A',
        address:'화성시 봉담읍 와우로15번길 7, 3층', summary:'청소년이 게임, 노래, 댄스, 공부, 동아리 활동을 즐길 수 있는 공간',
        activities:['청소년 동아리·자치활동','노래·댄스·미디어 활동','PC·게임·휴식','공부와 자율 이용','봉사 및 청소년 프로그램 참여'],
        repeatService:'full_heal_save', stampId:'stamp_youth_house', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_wawoo_library: { id:'facility_wawoo_library', officialName:'봉담와우도서관', displayName:'봉담와우도서관', regionId:'wawoo', category:'public_library', tier:'A',
        address:'화성시 봉담읍 와우로15번길 7', summary:'모든 세대가 함께 책과 자료를 이용하고 쉬어 갈 수 있는 복합 독서문화 공간',
        activities:['장소수첩과 지역 정보 확인','집중력·HP 회복','책 찾기 미니게임','봉담청소년문화의집 3층으로 이동'],
        repeatService:'focus_heal', stampId:'stamp_wawoo_library', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_bongdam_library: { id:'facility_bongdam_library', officialName:'봉담도서관', displayName:'봉담도서관', regionId:'sang', category:'public_library', tier:'A',
        address:'화성시 봉담읍 샘마을1길 8-4', summary:'자료 열람과 독서문화 프로그램을 즐길 수 있는 지역 도서관',
        activities:['자료 분류·책 찾기','독서·문화 프로그램'], repeatService:'focus_heal', stampId:'stamp_bongdam_library', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_youth_playground_bongdam: { id:'facility_youth_playground_bongdam', officialName:'청소년놀터 봉담점(솜사탕)', displayName:'청소년놀터 봉담점', regionId:'sang', category:'public_youth', tier:'A',
        address:'화성시 봉담읍 매봉로 443, 예스프라자25 2층', summary:'게임존·PC존·쿠킹존·스터디존을 갖춘 청소년 자유 공간 (2026년 7월 봉담2지구 이전 개소)',
        activities:['PC·게임 체험','쿠킹·스터디 안내'], repeatService:'buff_activity', stampId:'stamp_youth_playground', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_children_culture: { id:'facility_children_culture', officialName:'화성시어린이문화센터', displayName:'화성시어린이문화센터', regionId:'donghwa', category:'public_culture', tier:'A',
        address:'화성시 봉담읍 동화길 146', summary:'직업·관찰 등 다양한 어린이 체험 프로그램을 운영하는 문화센터',
        activities:['직업·관찰 체험'], repeatService:'observe_boost', stampId:'stamp_children_culture', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_national_sports: { id:'facility_national_sports', officialName:'화성국민체육센터', displayName:'화성국민체육센터', regionId:'donghwa', category:'public_sports', tier:'A',
        address:'화성시 봉담읍 동화길 18', summary:'수영장과 다양한 체육시설을 이용할 수 있는 국민체육센터',
        activities:['운동 페이스 체험'], repeatService:'max_hp_boost', stampId:'stamp_national_sports', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_citizen_campus: { id:'facility_citizen_campus', officialName:'화성시민캠퍼스·화성시 생활문화창작소', displayName:'화성시민캠퍼스·생활문화창작소', regionId:'suyeong', category:'public_culture', tier:'A',
        address:'화성시 봉담읍 효행로 212', summary:'만들기·전시·생활문화를 체험할 수 있는 복합 평생학습 공간',
        activities:['만들기·전시·생활문화 체험'], repeatService:'craft_boost', stampId:'stamp_citizen_campus', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' },
      facility_green_center: { id:'facility_green_center', officialName:'화성그린환경센터 주민편익시설', displayName:'화성그린환경센터 주민편익시설', regionId:'suyeong', category:'public_sports', tier:'A',
        address:'화성시 봉담읍 하가등안길 100', summary:'암벽·수영·헬스 등 운동시설을 갖춘 주민편익시설',
        activities:['암벽·균형·운동 체험'], repeatService:'defense_boost', stampId:'stamp_green_center', verificationStatus:'VERIFIED_PUBLIC', verifiedAt:'2026-07-31' }
    },
    HAZARD_DEFINITIONS: {
      hazard_trash:      { id:'hazard_trash',      name:'쓰레기·오염',        safeAction:'위험물을 구분하고 담당자에게 알린다',                    shadow:'쓰레기 그림자',   reward:'기초 정화 기능' },
      hazard_smoke:      { id:'hazard_smoke',      name:'담배 연기',          safeAction:'거리를 두고 밝고 열린 공간으로 이동한다',                shadow:'연기 그림자',     reward:'바람 계열 기능' },
      hazard_kickboard:  { id:'hazard_kickboard',  name:'길막 킥보드·자전거', safeAction:'차도로 밀지 않고 관리 주체에 알린다',                    shadow:'통행 방해 그림자', reward:'이동 보조' },
      hazard_glass:      { id:'hazard_glass',      name:'깨진 유리·방치 병',  safeAction:'손대지 않고 주변 접근을 주의시키고 어른에게 알린다',      shadow:'유리·병 그림자',  reward:'방어 기능' },
      hazard_graffiti:   { id:'hazard_graffiti',   name:'낙서·소음',          safeAction:'직접 충돌하지 않고 담당자에게 알린다',                   shadow:'소음·낙서 그림자', reward:'집중·응원 기능' },
      hazard_streetlamp: { id:'hazard_streetlamp', name:'고장난 가로등',      safeAction:'어두운 길을 우회하고 위치를 알린다',                     shadow:'가로등 그림자',   reward:'빛의 안내' },
      hazard_crack:      { id:'hazard_crack',      name:'갈라진 길',          safeAction:'안전한 길로 우회하고 관리 주체에 알린다',                shadow:'도로 균열 그림자', reward:'회피 보조' },
      hazard_sign:       { id:'hazard_sign',       name:'위험 표지판·간판',   safeAction:'접근하지 않고 주변에 알린다',                            shadow:'표지판 그림자',   reward:'위험 감지' }
    },
    // 초기 배치(시딩) — placementId 기반으로 STAGES에 1회 주입, 이후엔 STAGES(에디터·저장)가 진실.
    //  주입된 오브젝트는 에디터에서 자유롭게 이동/삭제 가능하며, 삭제 시 다시 주입되지 않는다.
    FACILITY_PLACEMENTS: [
      // (v273) 와우리 복합건물은 기존 '봉담 와우 도서관' 건물(입구 선택 모달)이 담당 — 별도 배치 제거
      { placementId:'placement_wawoo_park', facilityIds:['facility_wawoo_library'], stageId:1,
        assetId:'fb_park_wawoo', rx:0.06, ry:0.62, rw:0.16, rh:0.20, label:'와우리문화공원', bTier:'B' },
      { placementId:'placement_bongdam_library', facilityIds:['facility_bongdam_library'], stageId:3,
        assetId:'fb_bongdam_library', rx:0.18, ry:0.20, rw:0.17, rh:0.20, label:'봉담도서관' },
      // (v274) 동화리 — §13.1 (공용 건물+텍스트 간판 원칙 §25)
      { placementId:'placement_children_culture', facilityIds:['facility_children_culture'], stageId:4,
        assetId:'nb_dong_center', rx:0.16, ry:0.16, rw:0.17, rh:0.20, label:'화성시어린이문화센터' },
      { placementId:'placement_national_sports', facilityIds:['facility_national_sports'], stageId:4,
        assetId:'nb_culture_bld', rx:0.70, ry:0.16, rw:0.16, rh:0.20, label:'화성국민체육센터' },
      // (v274) 수영리·외곽 — §13.1
      { placementId:'placement_citizen_campus', facilityIds:['facility_citizen_campus'], stageId:5,
        assetId:'nb_culture_bld', rx:0.16, ry:0.16, rw:0.17, rh:0.20, label:'화성시민캠퍼스·생활문화창작소' },
      { placementId:'placement_green_center', facilityIds:['facility_green_center'], stageId:5,
        assetId:'nb_park4', rx:0.70, ry:0.16, rw:0.17, rh:0.20, label:'화성그린환경센터 주민편익시설' },
      { placementId:'placement_youth_playground', facilityIds:['facility_youth_playground_bongdam'], stageId:3,
        assetId:'fb_playground', rx:0.66, ry:0.22, rw:0.16, rh:0.19, label:'청소년놀터 봉담점' },
      { placementId:'placement_children_culture', facilityIds:['facility_children_culture'], stageId:4,
        assetId:'fb_children_culture', rx:0.18, ry:0.20, rw:0.17, rh:0.20, label:'화성시어린이문화센터' },
      { placementId:'placement_national_sports', facilityIds:['facility_national_sports'], stageId:4,
        assetId:'fb_sports_center', rx:0.64, ry:0.22, rw:0.17, rh:0.20, label:'화성국민체육센터' },
      { placementId:'placement_citizen_campus', facilityIds:['facility_citizen_campus'], stageId:5,
        assetId:'fb_citizen_campus', rx:0.18, ry:0.22, rw:0.17, rh:0.20, label:'화성시민캠퍼스·생활문화창작소' },
      { placementId:'placement_green_center', facilityIds:['facility_green_center'], stageId:5,
        assetId:'fb_green_center', rx:0.64, ry:0.24, rw:0.17, rh:0.20, label:'화성그린환경센터' }
    ]
  };

  // (v270) 기획서 §19.3 — 런타임 진행 상태 (세이브 v4에 직렬화)
  window.BD_PROGRESS = {
    facility: { visitedFacilityIds:[], readFacilityGuideIds:[], completedActivityIds:[], facilityStampIds:[], registeredSafetyHubIds:[] },
    safety:   { purifiedHazardIds:[], collectedSafetyFragmentIds:[], knownHazardIds:[] },
    story:    { storyPhase:'prologue_inside', badgeAwakened:false, unlockedRegionIds:['wawoo'], busUnlockedStopIds:['bus_wawoo_main'], tutorialFlags:{} }
  };

  // (v270) 시딩 — STAGES 확정 후 호출. placementId 기반 멱등 + 삭제 툼스톤 존중.
  // ═══════════════════════════════════════════════════════════════
  // (v275) 기획서 §6.2 — '담이에게 물어보기': 현재 진행 상태 기반 추천 목표 안내
// (v275) 기획서 §27 — 배포 빌드: 에디터 진입·파일 도구·개발 로그 완전 은닉
  if (window.__BD_RELEASE_BUILD) {
    try {
      var relCss = document.createElement('style');
      relCss.textContent = '#bge-toggle, #bge-unity-dock, #bge-panel, #bge-minimap-wrap { display:none !important; }';
      (document.head || document.documentElement).appendChild(relCss);
    } catch (eR) { }
  }

  window.BD_askDami = function () {
    try {
      var st = BD_PROGRESS.story, fp = BD_PROGRESS.facility, sp = BD_PROGRESS.safety;
      var msg = null, face = 'base';
      if (!st.tutorialFlags.badgeGiven) msg = '안내데스크 선생님께 먼저 인사해 봐요!';
      else if (!st.badgeAwakened) msg = '문화의집을 자유롭게 즐기다가, 엘리베이터를 타고 밖으로 나가 봐요.';
      else if (st.storyPhase === 'cleared') msg = '봉담 활동지도가 완성됐어요! 이제 어디든 자유롭게 돌아다녀요.';
      else {
        var chs = Object.values(BD_REGISTRY_CHAPTERS);
        for (var i = 0; i < chs.length; i++) {
          var ch = chs[i];
          if (sp.collectedSafetyFragmentIds.indexOf(ch.fragmentId) >= 0) continue;
          if (i > 0 && st.unlockedRegionIds.indexOf(ch.regionId) < 0) { msg = null; break; }
          var hasStamp = ch.stampAnyOf.some(function (fid) {
            var f = BD_REGISTRY.FACILITY_DEFINITIONS[fid];
            return f && fp.facilityStampIds.indexOf(f.stampId) >= 0;
          });
          if (!hasStamp) {
            var names = ch.stampAnyOf.map(function (fid) { var f = BD_REGISTRY.FACILITY_DEFINITIONS[fid]; return f ? f.displayName : fid; });
            msg = ch.doneName + '의 핵심 시설을 체험해 봐요 — ' + names.join(' 또는 ') + '!';
          } else if (BD_Chapter._purifiedInStages(ch.hazardStages) < 1) {
            msg = ch.doneName + '에서 위험 신호를 하나 정화해 봐요. 근처 주민들 이야기도 들어 보고요!'; face = 'worry';
          } else { continue; }
          break;
        }
        if (!msg) {
          if (window.BD_canStartFinale && BD_canStartFinale()) { msg = '봉담 전체의 불안이 와우리 광장에 모여 있어요. 큰 그림자에 가 봐요!'; face = 'worry'; }
          else msg = '버스를 타고 다음 지역으로 가서 새로운 장소를 찾아봐요!';
        }
      }
      if (window.BD_DAMI) BD_DAMI.show(msg, { face: face });
      return msg;
    } catch (e) { return null; }
  };

  // (v273) 기획서 §11 — 지역 장 완료 조건·안전 조각·노선 해금 체인
  window.BD_REGISTRY_CHAPTERS = {
    wawoo:   { regionId:'wawoo',   stampAnyOf:['facility_youth_house','facility_wawoo_library'],           hazardStages:[1,2,212], fragmentId:'fragment_wawoo',   unlocksRegion:'sang',    doneName:'와우리' },
    sang:    { regionId:'sang',    stampAnyOf:['facility_bongdam_library','facility_youth_playground_bongdam'], hazardStages:[3,213], fragmentId:'fragment_sang',    unlocksRegion:'donghwa', doneName:'상리·봉담2지구' },
    donghwa: { regionId:'donghwa', stampAnyOf:['facility_children_culture','facility_national_sports'],    hazardStages:[4,211],   fragmentId:'fragment_donghwa', unlocksRegion:'suyeong', doneName:'동화리' },
    suyeong: { regionId:'suyeong', stampAnyOf:['facility_citizen_campus','facility_green_center'],         hazardStages:[5,210],   fragmentId:'fragment_suyeong', unlocksRegion:null,      doneName:'수영리·외곽' }
  };
  window.BD_Chapter = {
    _purifiedInStages: function (sids) {
      try {
        var ids = BD_PROGRESS.safety.purifiedHazardIds || [];
        return ids.filter(function (k) { return sids.indexOf(Number(String(k).split('::')[0])) >= 0; }).length;
      } catch (e) { return 0; }
    },
    check: function () {
      try {
        var fp = BD_PROGRESS.facility, sp = BD_PROGRESS.safety, st = BD_PROGRESS.story;
        Object.values(BD_REGISTRY_CHAPTERS).forEach(function (ch) {
          if (sp.collectedSafetyFragmentIds.indexOf(ch.fragmentId) >= 0) {   // 이미 완료
            /* (v368) 조각은 기록됐는데 다음 리 개방(1.6초 지연)이 저장 전에 끊긴 경우 복구 — 멱등 */
            try { if (ch.unlocksRegion && st.unlockedRegionIds.indexOf(ch.unlocksRegion) < 0 && window.BD_Bus) BD_Bus.unlockRegion(ch.unlocksRegion); } catch (eU) { }
            return;
          }
          /* (v287) 장 완료 = 그 지역 안전지도 100% (위험요소 전부 정화 + 시설 전부 방문) */
          var mp = null;
          try{ mp = window.BD_MapProgress && BD_MapProgress.region(ch.regionId); }catch(eMP){}
          if (!mp || mp.pct < 100) return;
          // 장 완료 → 안전 조각 + 노선 해금 (§11 보상)
          sp.collectedSafetyFragmentIds.push(ch.fragmentId);
          try { if (typeof bdToast === 'function') bdToast('🧩 ' + ch.doneName + ' 지역 안전 조각 획득! (' + sp.collectedSafetyFragmentIds.length + '/4)'); } catch (e2) { }
          if (ch.unlocksRegion) {
            setTimeout(function () { try { window.BD_Bus && BD_Bus.unlockRegion(ch.unlocksRegion); } catch (e3) { } }, 1600);
          } else {
            st.storyPhase = 'finale_ready';
            setTimeout(function () { try { if (window.BD_DAMI) BD_DAMI.show('네 지역의 안전 조각이 모두 모였어요…! 봉담 전체에서 강한 불안이 느껴져요. 와우리로 돌아가 봐요.', { face: 'worry' }); } catch (e4) { } }, 1800);
          }
          try { if (typeof autoSave === 'function') autoSave('장 완료'); } catch (e5) { }
        });
      } catch (e) { console.warn('장 체크 실패', e); }
    }
  };

  // (v273) 기획서 §16.1 — 전투 전 안전 행동 선택 (HAZARD_DEFINITIONS 데이터 기반)
  window.BD_VARIANT_TO_HAZDEF = {
    trash:'hazard_trash', cigarette:'hazard_smoke', kickboard:'hazard_kickboard', bicycle:'hazard_kickboard',
    glass:'hazard_glass', bottle:'hazard_glass', graffiti:'hazard_graffiti', noise_bat:'hazard_graffiti',
    streetlight:'hazard_streetlamp', dark_alley:'hazard_streetlamp', road_crack:'hazard_crack', sign_ghost:'hazard_sign'
  };
  window.BD_safetyChoice = function (obj, onCorrect) {
    try {
      var defId = BD_VARIANT_TO_HAZDEF[obj && obj.hazardVariant] || 'hazard_trash';
      var def = BD_REGISTRY.HAZARD_DEFINITIONS[defId] || BD_REGISTRY.HAZARD_DEFINITIONS.hazard_trash;
      var wrongs = [
        '직접 손으로 치우거나 옮겨서 바로 해결한다',
        '용기를 내서 정면으로 부딪쳐 본다'
      ];
      var opts = [{ txt: def.safeAction, ok: true }, { txt: wrongs[0], ok: false }, { txt: wrongs[1], ok: false }];
      // 섞기
      for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp; }
      var old = document.getElementById('bd-safety-choice'); if (old) old.remove();
      var wrap = document.createElement('div');
      wrap.id = 'bd-safety-choice';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(10,8,4,0.6);';
      wrap.innerHTML = '<div style="max-width:400px;width:88%;background:#1d1408;border:2px solid #b8862f;border-radius:14px;padding:18px 20px;color:#f3e6c8;box-shadow:0 10px 40px rgba(0,0,0,.6);">' +
        '<div style="font-size:12px;color:#d8b26a;letter-spacing:2px;margin-bottom:6px;">⚠ 안전 행동 선택</div>' +
        '<div style="font-size:15px;font-weight:800;margin-bottom:10px;">「' + def.name + '」 앞이에요. 어떻게 할까요?</div>' +
        opts.map(function (o, idx) {
          return '<button data-ok="' + (o.ok ? 1 : 0) + '" style="display:block;width:100%;margin:6px 0;background:#3a2c12;color:#f3e6c8;border:1px solid #6d5c3c;border-radius:9px;padding:10px 12px;font-size:13px;line-height:1.4;cursor:pointer;text-align:left;">' + o.txt + '</button>';
        }).join('') + '</div>';
      document.body.appendChild(wrap);
      wrap.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
        if (b.getAttribute('data-ok') === '1') {
          try { wrap.remove(); } catch (e2) { }
          try { if (window.BD_DAMI) BD_DAMI.show('좋아요, 그게 안전한 행동이에요! 이제 이 불안의 그림자는 제가 분리할게요.', { face: 'proud' }); } catch (e3) { }
          try {
            var hid = (obj && (obj.hazardId || obj.id || obj.label)) || '';   // (v273b) 게이트와 동일 계산식
            if (BD_PROGRESS.safety.knownHazardIds.indexOf(hid) < 0) BD_PROGRESS.safety.knownHazardIds.push(hid);
          } catch (e4) { }
          setTimeout(function () { try { onCorrect && onCorrect(); } catch (e5) { } }, 900);
        } else {
          b.style.borderColor = '#c0492f'; b.style.color = '#e08a75';
          try { if (window.BD_DAMI) BD_DAMI.show('음… 그건 위험할 수 있어요. ' + def.safeAction + ' — 이게 더 안전해요.', { face: 'worry' }); } catch (e6) { }
        }
      });
    } catch (e) { try { onCorrect && onCorrect(); } catch (e2) { } }
  };

  // (v273) 간이 체험 미니게임 — 연타 (기존 미니게임 미연결 시설의 대표 체험 대용, §15 '빠른 연타' 계열)
  window.BD_MiniTap = function (title, onComplete) {
    try {
      var need = 12, got = 0, ms = 5000, ended = false;
      var old = document.getElementById('bd-minitap'); if (old) old.remove();
      var wrap = document.createElement('div');
      wrap.id = 'bd-minitap';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:10060;display:flex;align-items:center;justify-content:center;background:rgba(10,8,4,0.6);';
      wrap.innerHTML = '<div style="max-width:340px;width:84%;background:#1d1408;border:2px solid #b8862f;border-radius:14px;padding:20px;color:#f3e6c8;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.6);">' +
        '<div style="font-size:14px;font-weight:800;margin-bottom:8px;">' + title + '</div>' +
        '<div style="font-size:12px;color:#caa96a;margin-bottom:12px;">버튼을 빠르게 눌러 활동을 완료하세요! (5초)</div>' +
        '<button id="bd-minitap-btn" style="width:120px;height:120px;border-radius:60px;background:#b8862f;color:#1d1408;border:0;font-size:30px;font-weight:900;cursor:pointer;">' + need + '</button>' +
        '<div id="bd-minitap-bar" style="height:8px;background:#3a2c12;border-radius:4px;margin-top:14px;overflow:hidden;"><div style="height:100%;width:0%;background:#f0d492;transition:width .1s;" id="bd-minitap-fill"></div></div></div>';
      document.body.appendChild(wrap);
      var btn = wrap.querySelector('#bd-minitap-btn'), fill = wrap.querySelector('#bd-minitap-fill');
      var finish = function (ok) {
        if (ended) return; ended = true;
        try { wrap.remove(); } catch (e) { }
        if (ok) { try { onComplete && onComplete(); } catch (e2) { } }
        else { try { if (typeof bdToast === 'function') bdToast('아쉬워요! 다시 도전해 보세요'); } catch (e3) { } }
      };
      btn.addEventListener('click', function () {
        got++; btn.textContent = Math.max(0, need - got);
        fill.style.width = Math.min(100, got / need * 100) + '%';
        if (got >= need) finish(true);
      });
      setTimeout(function () { finish(false); }, ms);
    } catch (e) { try { onComplete && onComplete(); } catch (e2) { } }
  };

  // (v272) 기획서 §9 — 버스정류장 이동 시스템 (BusTravelService)
  // ═══════════════════════════════════════════════════════════════
  window.BD_Bus = {
    _cooldownUntil: 0,
    stopForStage: function (sid) {
      var S = BD_REGISTRY.BUS_STOPS, k;
      for (k in S) if (String(S[k].stageId) === String(sid)) return S[k];
      return null;
    },
    isUnlocked: function (regionId) {
      try { return BD_PROGRESS.story.unlockedRegionIds.indexOf(regionId) >= 0; } catch (e) { return regionId === 'wawoo'; }
    },
    unlockRegion: function (regionId) {
      try {
        var st = BD_PROGRESS.story;
        // (v273) 순서 보정 — 이 권역보다 앞선 권역도 함께 열어 잠김 역전이 없게 한다
        try {
          var R = BD_REGISTRY.REGION_DEFINITIONS, tgt = R[regionId];
          if (tgt) Object.values(R).forEach(function (r) {
            if (r.order <= tgt.order && st.unlockedRegionIds.indexOf(r.id) < 0) st.unlockedRegionIds.push(r.id);
          });
        } catch (eC) { }
        if (st.unlockedRegionIds.indexOf(regionId) < 0) st.unlockedRegionIds.push(regionId);
        var S = BD_REGISTRY.BUS_STOPS, k;
        for (k in S) if (S[k].regionId === regionId && st.busUnlockedStopIds.indexOf(k) < 0) st.busUnlockedStopIds.push(k);
        var r = BD_REGISTRY.REGION_DEFINITIONS[regionId];
        try { if (typeof bdToast === 'function') bdToast('🚌 새 노선 해금! 이제 「' + (r ? r.displayName : regionId) + '」(으)로 갈 수 있어요'); } catch (e2) { }
        try { if (typeof autoSave === 'function') autoSave('노선 해금'); } catch (e3) { }
        return true;
      } catch (e) { return false; }
    },
    open: function (stopId) {
      try {
        if (Date.now() < this._cooldownUntil) return;
        if (typeof transitioning !== 'undefined' && transitioning) return;
        var here = BD_REGISTRY.BUS_STOPS[stopId]; if (!here) return;
        var old = document.getElementById('bd-bus-modal'); if (old) old.remove();
        var regions = Object.values(BD_REGISTRY.REGION_DEFINITIONS).sort(function (a, b) { return a.order - b.order; });
        var self = this;
        var rows = regions.map(function (r) {
          var stop = null, k;
          for (k in BD_REGISTRY.BUS_STOPS) if (BD_REGISTRY.BUS_STOPS[k].regionId === r.id) stop = BD_REGISTRY.BUS_STOPS[k];
          var cur = stop && stop.id === stopId;
          var un = self.isUnlocked(r.id);
          var state = cur ? '현재 위치' : (un ? '이동 가능' : '잠김');
          var color = cur ? '#7d6a45' : (un ? '#f3e6c8' : '#6d5c3c');
          return '<button data-region="' + r.id + '" data-stop="' + (stop ? stop.id : '') + '" data-state="' + state + '"' +
            ' style="display:flex;justify-content:space-between;align-items:center;width:100%;margin:5px 0;background:' + (cur ? '#241a0c' : (un ? '#3a2c12' : '#241c10')) + ';color:' + color + ';border:1px solid ' + (un && !cur ? '#b8862f' : '#4d3d20') + ';border-radius:9px;padding:10px 12px;font-size:14px;cursor:pointer;text-align:left;">' +
            '<span>' + r.displayName + '</span><span style="font-size:11px;color:#caa96a;">' + state + '</span></button>';
        }).join('');
        var wrap = document.createElement('div');
        wrap.id = 'bd-bus-modal';
        wrap.style.cssText = 'position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;background:rgba(10,8,4,0.55);';
        wrap.innerHTML = '<div style="max-width:360px;width:86%;background:#1d1408;border:2px solid #b8862f;border-radius:14px;padding:18px 20px;color:#f3e6c8;box-shadow:0 10px 40px rgba(0,0,0,.6);">' +
          '<div style="font-size:17px;font-weight:800;">🚌 ' + (BD_REGISTRY.REGION_DEFINITIONS[here.regionId] ? BD_REGISTRY.REGION_DEFINITIONS[here.regionId].displayName : '') + ' 정류장</div>' +
          '<div style="font-size:12px;color:#caa96a;margin:2px 0 10px;">어디로 갈까요?</div>' + rows +
          '<button data-close="1" style="display:block;width:100%;margin-top:8px;background:transparent;color:#9b8657;border:0;padding:6px;font-size:12px;cursor:pointer;">닫기</button></div>';
        document.body.appendChild(wrap);
        window.__bdBusModalOpen = true;
        var close = function () { try { wrap.remove(); } catch (e) { } window.__bdBusModalOpen = false; };
        wrap.addEventListener('click', function (e) {
          var b = e.target.closest ? e.target.closest('button') : null;
          if (e.target === wrap || (b && b.getAttribute('data-close'))) { close(); return; }
          if (!b) return;
          var state = b.getAttribute('data-state'), rid = b.getAttribute('data-region'), sid = b.getAttribute('data-stop');
          if (state === '현재 위치') return;
          if (state === '잠김') {
            // §9.3 — 잠긴 지역: 담이의 짧은 말풍선
            var regions2 = Object.values(BD_REGISTRY.REGION_DEFINITIONS).sort(function (a, b2) { return a.order - b2.order; });
            var target = BD_REGISTRY.REGION_DEFINITIONS[rid];
            var prev = regions2[Math.max(0, (target ? target.order : 1) - 1)];
            try { if (window.BD_DAMI) BD_DAMI.show((prev ? prev.displayName : '이전 지역') + '에서 아직 확인할 일이 남아 있어요. 현재 목표를 먼저 완료해 봐요.', { face: 'worry' }); } catch (e2) { }
            return;
          }
          close();
          self.travel(sid);
        });
      } catch (e) { console.warn('버스 모달 실패', e); }
    },
    travel: function (targetStopId) {
      try {
        var stop = BD_REGISTRY.BUS_STOPS[targetStopId]; if (!stop) return;
        if (typeof transitioning !== 'undefined' && transitioning) return;
        this._cooldownUntil = Date.now() + 2200;   // §9.2 도착 후 재상호작용 방지
        try { if (typeof bdToast === 'function') bdToast('🚌 버스를 타고 이동합니다…'); } catch (e2) { }
        fadeToStage(stop.stageId, stop.spawnX, stop.spawnY, 700);
        try { BD_PROGRESS.story.lastBusStopId = targetStopId; } catch (e3) { }
      } catch (e) { console.warn('버스 이동 실패', e); }
    }
  };

  // (v272) 정류장 근접 최초 1회 안내
  (function () {
    var told = false;
    if (window.BD_addTick) BD_addTick(function () {
      try {
        if (told || typeof STAGES === 'undefined' || typeof heroX === 'undefined') return;
        if (!window.BD_PROGRESS || !BD_PROGRESS.story.badgeAwakened) return;
        var st = STAGES[currentStage]; if (!st || !Array.isArray(st.objects)) return;
        var near = st.objects.some(function (o) {
          if (!o || o.interactable !== 'bus_stop') return false;
          var cx = (o.rx || 0) + (o.rw || 0) / 2, cy = (o.ry || 0) + (o.rh || 0);
          return Math.hypot(heroX - cx, heroY - cy) < 0.11;
        });
        if (near) { told = true; try { if (typeof bdToast === 'function') bdToast('🚌 버스정류장이에요. F 키로 목적지를 고를 수 있어요'); } catch (e) { } }
      } catch (e) { }
    }, 700);
  })();

  // (v272) 정류장 태깅·시딩 — 라벨/에셋이 정류장인 오브젝트에 busStopId 부여, 없으면 데이터로 생성 (멱등·툼스톤)
  window.BD_ensureBusStops = function () {
    try {
      if (typeof STAGES === 'undefined') return;
      var S = BD_REGISTRY.BUS_STOPS, k;
      for (k in S) {
        var stop = S[k];
        var st = STAGES[stop.stageId] || STAGES[String(stop.stageId)];
        if (!st) continue;
        if (!Array.isArray(st.objects)) st.objects = [];
        var tagged = st.objects.find(function (o) { return o && o.busStopId === stop.id; });
        if (!tagged) {
          var cand = st.objects.find(function (o) {
            return o && !o.busStopId && (String(o.assetId || '') === 'bld_busstop' || /정류장/.test(String(o.label || '')));
          });
          if (cand) { cand.busStopId = stop.id; tagged = cand; }
        }
        if (!tagged) {
          if (Array.isArray(st.deletedBusStopIds) && st.deletedBusStopIds.indexOf(stop.id) >= 0) continue;
          st.objects.push({
            _editorId: stop.id, busStopId: stop.id, type: 'building', label: '버스정류장',
            key: 'asset:bld_busstop', assetId: 'bld_busstop', customImage: true,
            rx: Math.max(0.02, stop.spawnX - 0.024), ry: Math.max(0.02, stop.spawnY - 0.15),
            rw: 0.048, rh: 0.135, interactable: 'bus_stop'
          });
        }
        if (tagged) tagged.interactable = 'bus_stop';
      }
    } catch (e) { console.warn('정류장 시딩 실패', e); }
  };

  // (v272) 기획서 §8.2 — 출구 정책 1회 적용: 장거리 이동은 버스 전담 (에디터로 재조정 가능, 재적용 없음)
  window.BD_applyExitPolicy = function () {
    try {
      if (typeof STAGES === 'undefined') return;
      [1, 3, 4, 5].forEach(function (sid) {
        var st = STAGES[sid] || STAGES[String(sid)];
        if (!st || st._exitPolicyV272 || !st.exits) return;
        Object.keys(st.exits).forEach(function (d) {
          var ex = st.exits[d]; if (!ex) return;
          var ns = Number(ex.nextStage);
          if (sid === 1) { if (ns === 3 || ns === 4 || ns === 5) ex.active = false; }
          else { ex.active = false; }   // 3·4·5: 지역 밖 도보 출구 봉인 (§8.2)
        });
        st._exitPolicyV272 = true;
      });
    } catch (e) { }
  };

  // (v272) 기획서 §17·§24.3 — 시설 스탬프 공통 시스템
  window.BD_Facility = {
    status: function (fid) {
      var fp = BD_PROGRESS.facility;
      return {
        visited: fp.visitedFacilityIds.indexOf(fid) >= 0,
        guided: fp.readFacilityGuideIds.indexOf(fid) >= 0,
        experienced: fp.completedActivityIds.some(function (a) { return a.indexOf(fid + '::') === 0; }),
        stamped: fp.facilityStampIds.indexOf((BD_REGISTRY.FACILITY_DEFINITIONS[fid] || {}).stampId) >= 0
      };
    },
    completeActivity: function (fid, activityId) {
      try {
        var fp = BD_PROGRESS.facility;
        var key = fid + '::' + (activityId || 'activity');
        if (fp.completedActivityIds.indexOf(key) < 0) fp.completedActivityIds.push(key);
        if (fp.visitedFacilityIds.indexOf(fid) < 0) fp.visitedFacilityIds.push(fid);
        return this.grantStamp(fid);
      } catch (e) { return false; }
    },
    grantStamp: function (fid) {
      try {
        var f = BD_REGISTRY.FACILITY_DEFINITIONS[fid]; if (!f || !f.stampId) return false;
        var fp = BD_PROGRESS.facility;
        if (fp.facilityStampIds.indexOf(f.stampId) >= 0) return false;   // 중복 방지 (§24.3)
        fp.facilityStampIds.push(f.stampId);
        try { if (typeof bdToast === 'function') bdToast('🏅 활동 스탬프 획득! — ' + f.displayName + ' (' + fp.facilityStampIds.length + '개)'); } catch (e2) { }
        try { if (typeof autoSave === 'function') autoSave('스탬프 획득'); } catch (e3) { }
        try { setTimeout(function () { window.BD_Chapter && BD_Chapter.check(); }, 900); } catch (e4) { }
        return true;
      } catch (e) { return false; }
    }
  };

  // (v272) 부트 훅 — 게임 루프 준비 후 1회(정책·시딩) + 저빈도 멱등 태깅
  (function bindBoot() {
    if (typeof window.BD_addTick !== 'function') { setTimeout(bindBoot, 900); return; }
    window.BD_addTick(function () {
      if (typeof STAGES === 'undefined') return;
      // (v272b) 세 함수 모두 멱등 — 로드/에디터 적용/가져오기로 STAGES가 재구성돼도
      //  마킹(_exitPolicyV272)·placementId·툼스톤 기반으로 정확히 1회씩만 반영된다.
      try { window.BD_applyExitPolicy(); } catch (e) { }
      // (v273) 구 복합건물 placement 정리 — 기존 도서관 건물과 중복이라 제거
      try {
        var __st1 = STAGES[1] || STAGES['1'];
        if (__st1 && Array.isArray(__st1.objects)) {
          __st1.objects = __st1.objects.filter(function (o) { return !(o && o.placementId === 'placement_wawoo_complex'); });
        }
      } catch (e) { }
      try { window.BD_seedFacilityPlacements(); } catch (e) { }
      try { window.BD_ensureBusStops(); } catch (e) { }
      // (v275) 담이 배지 클릭 → 물어보기 (멱등 바인딩)
      try {
        var fEl = document.getElementById('bd-dami-face');
        if (fEl && !fEl.__bdAskBound) {
          fEl.__bdAskBound = true;
          fEl.style.cursor = 'pointer';
          fEl.title = '담이에게 물어보기';
          fEl.addEventListener('click', function () { try { window.BD_askDami(); } catch (e2) { } });
        }
      } catch (eA) { }
    }, 1500);
  })();

  // (v271) §7.3·§7.6·§18 — 장소 안내 카드: FACILITY_DEFINITIONS 데이터로 렌더 (하드코딩 금지)
  window.BD_showPlaceCard = function (facilityId, opt) {
    try {
      opt = opt || {};
      var f = window.BD_REGISTRY && BD_REGISTRY.FACILITY_DEFINITIONS[facilityId];
      if (!f) return false;
      var old = document.getElementById('bd-place-card'); if (old) old.remove();
      var wrap = document.createElement('div');
      wrap.id = 'bd-place-card';
      wrap.style.cssText = 'position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;background:rgba(10,8,4,0.55);';
      var acts = (f.activities || []).map(function (a) { return '<li style="margin:3px 0;">' + a + '</li>'; }).join('');
      wrap.innerHTML =
        '<div style="max-width:420px;width:88%;background:#1d1408;border:2px solid #b8862f;border-radius:14px;padding:18px 20px;color:#f3e6c8;font-family:inherit;box-shadow:0 10px 40px rgba(0,0,0,.6);">' +
        '<div style="font-size:11px;letter-spacing:2px;color:#d8b26a;margin-bottom:6px;">' + (opt.firstDiscover ? '✦ 새 장소 발견' : '✦ 장소 안내') + '</div>' +
        '<div style="font-size:19px;font-weight:800;">' + f.displayName + '</div>' +
        '<div style="font-size:12px;color:#caa96a;margin:2px 0 10px;">' + (opt.subtitle || f.address) + '</div>' +
        '<div style="font-size:13px;line-height:1.55;">' + f.summary + '</div>' +
        (acts ? '<div style="margin-top:10px;font-size:12px;color:#e8d3a0;"><b>이곳에서 할 수 있는 활동</b><ul style="margin:6px 0 0 16px;padding:0;">' + acts + '</ul></div>' : '') +
        (function () { try {
          var s = window.BD_Facility ? BD_Facility.status(facilityId) : null;
          if (!s) return '';
          var chip = function (on, label) { return '<span style="display:inline-block;margin-right:6px;padding:2px 8px;border-radius:8px;font-size:10px;border:1px solid ' + (on ? '#b8862f' : '#4d3d20') + ';color:' + (on ? '#f0d492' : '#6d5c3c') + ';">' + (on ? '✔ ' : '') + label + '</span>'; };
          return '<div style="margin-top:10px;">' + chip(true, '발견') + chip(s.guided || true, '안내 확인') + chip(s.experienced, '체험') + chip(s.stamped, '스탬프') + '</div>';
        } catch (e) { return ''; } })() +
        '<div style="margin-top:12px;font-size:11px;color:#9b8657;">실제 이용 전 해당 시설의 최신 운영정보와 이용 조건을 확인해 주세요.</div>' +
        '<div style="text-align:center;margin-top:14px;">' +
        (function () { try {
          var s2 = window.BD_Facility ? BD_Facility.status(facilityId) : null;
          if (opt.allowActivity && s2 && !s2.stamped && (f.activities || []).length)
            return '<button id="bd-place-card-act" style="background:#3a2c12;color:#f0d492;border:1px solid #b8862f;border-radius:9px;padding:9px 18px;font-weight:800;font-size:14px;cursor:pointer;margin-right:8px;">🎯 체험하기</button>';
          return '';
        } catch (e) { return ''; } })() +
        '<button id="bd-place-card-ok" style="background:#b8862f;color:#1d1408;border:0;border-radius:9px;padding:9px 26px;font-weight:800;font-size:14px;cursor:pointer;">확인</button></div>' +
        '</div>';
      document.body.appendChild(wrap);
      var close = function () { try { wrap.remove(); } catch (e) { } };
      wrap.querySelector('#bd-place-card-ok').addEventListener('click', close);
      var actBtn = wrap.querySelector('#bd-place-card-act');
      if (actBtn) actBtn.addEventListener('click', function () {
        close();
        var actId = (f.activityIds && f.activityIds[0]) || 'activity_' + facilityId;
        window.BD_MiniTap('「' + f.displayName + '」 대표 활동 체험', function () {
          try { window.BD_Facility && BD_Facility.completeActivity(facilityId, actId); } catch (e2) { }
        });
      });
      wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
      // 장소수첩 기록
      try {
        if (window.BD_PROGRESS) {
          var fp = BD_PROGRESS.facility;
          if (fp.visitedFacilityIds.indexOf(facilityId) < 0) fp.visitedFacilityIds.push(facilityId);
          if (fp.readFacilityGuideIds.indexOf(facilityId) < 0) fp.readFacilityGuideIds.push(facilityId);
        }
      } catch (eR) { }
      return true;
    } catch (e) { console.warn('장소 카드 실패', e); return false; }
  };

  window.BD_seedFacilityPlacements = function () {
    try {
      if (typeof STAGES === 'undefined' || !window.BD_REGISTRY) return 0;
      var seeded = 0;
      window.BD_REGISTRY.FACILITY_PLACEMENTS.forEach(function (p) {
        var st = STAGES[p.stageId] || STAGES[String(p.stageId)];
        if (!st) return;
        if (!Array.isArray(st.objects)) st.objects = [];
        // 이미 존재하거나(에디터로 관리 중) 사용자가 지웠으면 skip
        var exist = st.objects.find(function (o) { return o && o.placementId === p.placementId; });
        if (exist) {
          // (v279) 정식 에셋 도착 — 공용 건물로 임시 배치됐던 오브젝트의 그림만 1회 교체 (위치·크기는 존중)
          if (!exist._assetV279 && p.assetId && exist.assetId !== p.assetId) {
            exist.assetId = p.assetId; exist.key = 'asset:' + p.assetId; exist.customImage = true;
          }
          exist._assetV279 = true;
          return;
        }
        if (Array.isArray(st.deletedPlacementIds) && st.deletedPlacementIds.indexOf(p.placementId) >= 0) return;
        st.objects.push({
          _editorId: p.placementId,
          placementId: p.placementId,
          facilityIds: (p.facilityIds || []).slice(),
          type: 'building',
          label: p.label || (p.facilityIds && p.facilityIds[0]) || '시설',
          key: p.assetId ? ('asset:' + p.assetId) : undefined,
          assetId: p.assetId, customImage: !!p.assetId,
          rx: p.rx, ry: p.ry, rw: p.rw, rh: p.rh,
          interactable: 'facility'
        });
        seeded++;
      });
      return seeded;
    } catch (e) { console.warn('시설 시딩 실패', e); return 0; }
  };
  window.BD_migrateSave = function(d){
    // (v270) v4 마이그레이션 — 신 진행 필드 기본값 주입 (기존 필드는 보존)
    try {
      if (d && (Number(d.sv) || 1) < 4) {
        if (!d.facility) d.facility = { visitedFacilityIds:[], readFacilityGuideIds:[], completedActivityIds:[], facilityStampIds:[], registeredSafetyHubIds:[] };
        if (!d.safety) d.safety = { purifiedHazardIds:[], collectedSafetyFragmentIds:[], knownHazardIds:[] };
        if (!d.travel) d.travel = { unlockedRegionIds:['wawoo'], busUnlockedStopIds:['bus_wawoo_main'] };
        if (!d.story) d.story = { storyPhase:'prologue_inside', badgeAwakened:false, activeQuestIds:[], completedQuestIds:[], tutorialFlags:{} };
        delete d.heroClass;   // 직업 제거
        d.sv = 4;
        try {
          if (!localStorage.getItem('bd_v4_migrate_notice')) {
            localStorage.setItem('bd_v4_migrate_notice', '1');
            setTimeout(function(){ try{ if (typeof bdToast === 'function') bdToast('게임 진행 구조가 개편되어 저장 데이터가 새 구조로 이전되었습니다.'); }catch(e){} }, 2500);
          }
        } catch (eN) { }
      }
    } catch (eM4) { }

    try {
      if (!d || typeof d !== 'object') return d;
      var v = d.sv || 0;
      if (v < 1) { d.sv = 1; }        // v0(버전 없음) → v1: 구조 동일, 표기만 부여
      if (v < 2) {                    // v1 → v2: 구버전 도서관 1층(100) 삭제 대응
        if (d.stage === 100) { d.stage = 101; d.heroX = 0.700; d.heroY = 0.260; }
        d.sv = 2;
      }
      if (v < 3) {                    // v2 → v3 (v239): 동료·SP 폐지에 따른 정리
        d.partyState = {};
        if (d.items) { delete d.items.drink; delete d.items.revive; }
        if (d.equipV2 && d.equipV2.memento === 'spd') d.equipV2.memento = null;
        d.sv = 3;
      }
    } catch(e){}
    return d;
  };
  setInterval(function(){
    var t = Date.now();
    for (var i = 0; i < jobs.length; i++){
      var j = jobs[i];
      if (t - j.last >= j.ms){ j.last = t; try { j.fn(); } catch(e){} }
    }
  }, 200);
})();
// (v210) 게시 모드에서 제작 도구 UI 전면 숨김 (CSS 선주입 — 이후 생성되는 요소에도 적용)
(function(){
  // (v230) 웹 게시 전까지 에디터 상시 활성 — 게시 준비 시 아래 줄을 원래 판정으로 되돌릴 것:
  //   var dev = (location.protocol === 'file:') || /[?&]dev=1/.test(location.search);
  var dev = /[?&]dev=1/.test(location.search);   /* (v295) 게시 모드 복원 — ?dev=1 일 때만 개발 UI */
  if (dev) return;
  // (v213) 게시 모드에선 개발용 console.log 침묵 (warn/error는 유지)
  try { var noop = function(){}; console.log = noop; console.debug = noop; } catch(e){}
  var st = document.createElement('style');
  st.id = 'bd-publish-hide';
  st.textContent = [
    '[id^="bge-"]',                          // 에디터 패널·토글·kid 도구 전부
    '#bd-hazard-place-btn', '#bd-hazard-place-hint',
    'button[onclick*="BD_undoHazard"]',
    'button[onclick*="DeleteMode"]',
    '#bd-building-pal-btn', '#bd-pal-panel',
  ].join(',') + '{ display:none !important; }';
  document.head.appendChild(st);
})();
