/* (v385) 에디터 모드 전용 지역별 테스트 시작기
   - ?dev=1 에서만 타이틀 하단에 표시한다.
   - 기존 진행 저장을 세션에 격리 백업하고, 선택 지역 이전 단계만 완료한 테스트 상태를 만든다.
   - 타이틀 복귀·새로고침·탭 종료 시 원본 진행을 복원한다. 에디터 배치/에셋 키는 건드리지 않는다. */
(function(){
  'use strict';
  if (!/[?&]dev=1(?:&|$)/.test(location.search)) return;

  var ACTIVE_KEY = 'bd_dev_test_active_v385';
  var SNAPSHOT_KEY = 'bd_dev_test_snapshot_v385';
  var restoring = false;
  var PRESETS = [
    { id:'wawoo',   label:'와우리', stageId:212, questIndex:1, regionIndex:0, prior:0 },
    { id:'sang',    label:'상리',   stageId:213, questIndex:2, regionIndex:1, prior:1 },
    { id:'donghwa', label:'동화리', stageId:211, questIndex:3, regionIndex:2, prior:2 },
    { id:'suyeong', label:'수영리', stageId:210, questIndex:4, regionIndex:3, prior:3 },
    { id:'finale',  label:'최종장', stageId:212, questIndex:5, regionIndex:4, prior:4 }
  ];
  var REGIONS = [
    { id:'wawoo', stageId:212, bus:'bus_wawoo_main', fragment:'fragment_wawoo', legacy:'wawoo', skill:'fan', card:'봉담와우도서관' },
    { id:'sang', stageId:213, bus:'bus_sang_main', fragment:'fragment_sang', legacy:'sang', skill:'wash', card:'봉담도서관' },
    { id:'donghwa', stageId:211, bus:'bus_donghwa_main', fragment:'fragment_donghwa', legacy:'dongh', skill:'cheer', card:'어린이문화센터' },
    { id:'suyeong', stageId:210, bus:'bus_suyeong_main', fragment:'fragment_suyeong', legacy:'suyeong', skill:'light', card:'안전지킴이집' }
  ];

  function gameStorageKey(key){
    return key === 'fantasyRPG_save' || /^bongdam_guardian/.test(key)
      || (/^bd_/.test(key) && !/^(bd_bake_stamp|bd_editor|bd_sound|bd_settings|bd_char_scales)/.test(key));
  }
  function clearGameStorage(){
    var remove = [];
    for (var i=0; i<localStorage.length; i++){
      var key = localStorage.key(i);
      if (key && gameStorageKey(key)) remove.push(key);
    }
    remove.forEach(function(key){ try{ localStorage.removeItem(key); }catch(e){} });
  }
  function captureStorage(){
    var data = {};
    for (var i=0; i<localStorage.length; i++){
      var key = localStorage.key(i);
      if (key && gameStorageKey(key)) data[key] = localStorage.getItem(key);
    }
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data));
    sessionStorage.setItem(ACTIVE_KEY, '1');
  }
  function restoreStorage(){
    if (restoring) return;
    restoring = true;
    var data = {};
    try{ data = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || '{}') || {}; }catch(e){}
    clearGameStorage();
    Object.keys(data).forEach(function(key){ try{ localStorage.setItem(key, data[key]); }catch(e){} });
    sessionStorage.removeItem(ACTIVE_KEY);
    sessionStorage.removeItem(SNAPSHOT_KEY);
  }
  function restoreAndReload(){
    restoreStorage();
    location.reload();
  }
  function testActive(){ return sessionStorage.getItem(ACTIVE_KEY) === '1'; }

  /* 테스트 도중 새로고침/비정상 이탈 뒤 다시 들어온 경우, 합성 세이브를 로드하기 전에 원본으로 회귀한다. */
  if (testActive()){
    restoreStorage();
    location.reload();
    return;
  }
  window.addEventListener('beforeunload', function(){ if (testActive()) restoreStorage(); });

  function pushUnique(list, value){ if (value != null && list.indexOf(value) < 0) list.push(value); }
  function resetProgressObjects(){
    try{ if (typeof window.BD_resetProgress === 'function') window.BD_resetProgress(false); }
    catch(e){}
    if (!window.BD_PROGRESS) return;
    BD_PROGRESS.facility = {
      visitedFacilityIds:[], readFacilityGuideIds:[], completedActivityIds:[],
      facilityStampIds:[], registeredSafetyHubIds:[]
    };
    BD_PROGRESS.safety = { purifiedHazardIds:[], collectedSafetyFragmentIds:[], knownHazardIds:[] };
    BD_PROGRESS.story = {
      storyPhase:'outside_awakened', badgeAwakened:true,
      unlockedRegionIds:['wawoo'], busUnlockedStopIds:['bus_wawoo_main'],
      tutorialFlags:{ badgeGiven:true, prologueDone:true, movementDone:true, battleDone:true, mapDone:true }
    };
  }
  function baseTutorial(concept){
    var fp = BD_PROGRESS.facility;
    ['facility_youth_house'].forEach(function(fid){ pushUnique(fp.visitedFacilityIds, fid); pushUnique(fp.readFacilityGuideIds, fid); });
    pushUnique(fp.facilityStampIds, 'stamp_youth_house');
    pushUnique(concept.visitedFacilityIds, 'wawoo_youth_house');
    concept.visitCounts.wawoo_youth_house = 1;
    ['bd_dami_tutorial_done','bd_tut2_done','bd_dami_awake','bd_battle_tutorial_done',
     'bd_shop_tutorial_done','bd_shop_tutorial_done_v75','bd_map_tuto_done'].forEach(function(key){
      try{ localStorage.setItem(key, '1'); }catch(e){}
    });
    /* 상황별 안내 카드도 튜토리얼의 일부다. 지역 점프 직후 과거 안내가 입력을
       잠그지 않도록 이미 본 상태로 만든다(대상 지역의 주민 부탁/본문 대사는 유지). */
    try{
      var tips = {};
      ['tutorial_wrapup','map_intro_v287','first_travel','sub_quests_intro','first_skill',
       'battle_elem','first_crystal','hp_low','hp_crit','sp_low'].forEach(function(id){ tips[id] = 1; });
      localStorage.setItem('bongdam_guardian_tips_v1', JSON.stringify(tips));
    }catch(e){}
    if (window.BD){
      BD._houseVisited = true;
      BD._libVisited = true;
      BD._damiSeen = ['dami_intro','dami_opening','dami_awake','move','guide','hazard','map_intro_v287'];
      BD.cards = ['문화의집'];
    }
  }
  function completeRegion(region, chapterNumber, concept, requestState){
    var st = (typeof STAGES !== 'undefined') ? STAGES[region.stageId] : null;
    if (!st) return;
    (st.__v24Landmarks || []).forEach(function(landmark){
      if (!landmark || landmark.hidden || !landmark.facilityId) return;
      pushUnique(concept.visitedFacilityIds, landmark.facilityId);
      concept.visitCounts[landmark.facilityId] = Math.max(1, Number(concept.visitCounts[landmark.facilityId]) || 0);
    });
    (st.objects || []).forEach(function(obj){
      if (!obj) return;
      if (obj.interactable === 'hazard' && obj.hazardId && !obj.isBoss && String(obj.hazardId).indexOf('final_boss') !== 0){
        BD.purified[obj.hazardId] = true;
        pushUnique(BD_PROGRESS.safety.purifiedHazardIds, String(region.stageId)+'::'+String(obj.hazardId));
        pushUnique(BD_PROGRESS.safety.knownHazardIds, obj.hazardId);
      }
      if (obj.resident && !obj.hidden){
        var residentId = obj.residentId || obj._editorId || obj.npcName;
        if (residentId) pushUnique(BD.greetedResidents, residentId);
      }
    });
    try{
      var pairs = window.BD_hzQuestMap ? BD_hzQuestMap(region.stageId) : [];
      pairs.forEach(function(pair){ if (pair && pair.id) requestState[pair.id] = 'r'; });
    }catch(e){}
    try{
      var defs = BD_REGISTRY.FACILITY_DEFINITIONS;
      Object.keys(defs).forEach(function(fid){
        var def = defs[fid]; if (!def || def.regionId !== region.id) return;
        pushUnique(BD_PROGRESS.facility.visitedFacilityIds, fid);
        pushUnique(BD_PROGRESS.facility.readFacilityGuideIds, fid);
        if (def.stampId) pushUnique(BD_PROGRESS.facility.facilityStampIds, def.stampId);
      });
    }catch(e){}
    pushUnique(BD_PROGRESS.safety.collectedSafetyFragmentIds, region.fragment);
    pushUnique(BD_PROGRESS.story.unlockedRegionIds, region.id);
    pushUnique(BD_PROGRESS.story.busUnlockedStopIds, region.bus);
    BD.regionCleared[region.legacy] = true;
    pushUnique(BD.unlockedSkills, region.skill);
    pushUnique(BD.cards, region.card);
    pushUnique(BD._damiSeen, 'hzok_ch'+chapterNumber);
    pushUnique(BD._damiSeen, 'ch'+chapterNumber+'_done');
  }

  function applyPreset(preset){
    captureStorage();
    clearGameStorage();
    resetProgressObjects();
    if (!window.BD || !window.BD_PROGRESS || typeof STAGES === 'undefined'){
      restoreStorage();
      alert('게임 데이터가 아직 준비되지 않았습니다. 잠시 뒤 다시 시도해 주세요.');
      return;
    }
    var concept = { version:1, visitedFacilityIds:[], visitCounts:{}, lastFacilityId:null };
    var requestState = {};
    baseTutorial(concept);

    BD.questIdx = preset.questIndex;
    BD.regionIdx = preset.regionIndex;
    BD.regionCleared = {};
    BD.purified = {};
    BD.greetedResidents = [];
    BD.gameCleared = false;
    BD.trackedQuest = (window.BD_QUESTS && BD_QUESTS[preset.questIndex]) ? BD_QUESTS[preset.questIndex].id : null;
    BD.lv = Math.max(1, Math.min(5, preset.questIndex));
    BD.crystal = Math.max(0, preset.prior * 2);
    for (var i=0; i<preset.prior; i++) completeRegion(REGIONS[i], i+1, concept, requestState);
    for (var r=0; r<=Math.min(preset.regionIndex, 3); r++){
      pushUnique(BD_PROGRESS.story.unlockedRegionIds, REGIONS[r].id);
      pushUnique(BD_PROGRESS.story.busUnlockedStopIds, REGIONS[r].bus);
    }
    if (preset.id === 'finale') BD_PROGRESS.story.storyPhase = 'finale_ready';

    try{
      if (window.BD_QUESTS) BD_QUESTS.forEach(function(q, index){
        if (!q || !q.objectives || !q.objectives[0]) return;
        q.objectives[0].cur = index < preset.questIndex ? q.objectives[0].need : 0;
      });
      if (typeof quest_state !== 'undefined') quest_state = 'done';
    }catch(e){}
    try{
      /* 개념 지도 런타임은 메모리 상태를 주기적으로 localStorage에 되쓴다.
         둘을 함께 바꾸지 않으면 1초 뒤 테스트 방문 기록이 옛 값으로 되돌아간다. */
      var liveConcept = window.BD_CONCEPT_FACILITY_STATE;
      if (liveConcept && typeof liveConcept === 'object'){
        liveConcept.version = 1;
        liveConcept.visitedFacilityIds = concept.visitedFacilityIds.slice();
        liveConcept.visitCounts = Object.assign({}, concept.visitCounts);
        liveConcept.lastFacilityId = null;
        window.BD_CONCEPT_FACILITY_STATE = liveConcept;
      }else{
        window.BD_CONCEPT_FACILITY_STATE = JSON.parse(JSON.stringify(concept));
      }
      localStorage.setItem('bd_concept_facility_visits_v1', JSON.stringify(concept));
    }catch(e){}
    try{ localStorage.setItem('bd_hzquest_v57', JSON.stringify(requestState)); }catch(e){}

    try{
      if (typeof recalcStats === 'function') recalcStats();
      BD.hp = BD.maxHp; BD.mp = BD.maxMp;
      if (typeof heroHP !== 'undefined') heroHP = BD.maxHp;
      if (typeof window.BD_syncHP === 'function') BD_syncHP(BD.maxHp, false);
    }catch(e){}
    var stage = STAGES[preset.stageId];
    currentStage = preset.stageId;
    heroX = stage.spawnX != null ? stage.spawnX : 0.5;
    heroY = stage.spawnY != null ? stage.spawnY : 0.72;
    try{ if (typeof camX !== 'undefined') camX = heroX; if (typeof camY !== 'undefined') camY = heroY; }catch(e){}
    try{ if (window.BD_resetHazardRuntimeState) BD_resetHazardRuntimeState(); }catch(e){}
    try{ if (window.__bdChoiceState) __bdChoiceState.open = false; window.__bdDamiOpeningBusy = false; }catch(e){}
    try{ if (typeof closeDialogue === 'function') closeDialogue(); }catch(e){}
    try{ if (typeof window.BD_save === 'function') BD_save(); }catch(e){}
    try{ if (typeof window.BD_hideTitle === 'function') BD_hideTitle(); }catch(e){}
    try{ enterGameScreen('개발 테스트', true); }
    catch(e){ restoreStorage(); alert('테스트 지역 진입에 실패했습니다: '+e.message); return; }
    showExitButton(preset.label);
    setTimeout(function(){ try{ if (typeof autoSave === 'function') autoSave('개발 테스트 — '+preset.label); }catch(e){} }, 400);
  }

  function showExitButton(label){
    var button = document.getElementById('bd-dev-test-exit-v385');
    if (!button){
      button = document.createElement('button');
      button.id = 'bd-dev-test-exit-v385';
      button.type = 'button';
      button.addEventListener('click', restoreAndReload);
      document.body.appendChild(button);
    }
    button.textContent = '🧪 '+label+' 테스트 종료 · 원본 복원';
    button.classList.add('show');
  }

  function showCredits(){
    if (typeof window.BD_showCredits !== 'function') return;
    BD_showCredits({ source:'dev' });
    setTimeout(function(){
      var mapButton = document.querySelector('#bd-ending-credits [data-action="map"]');
      if (mapButton){ mapButton.setAttribute('data-action','title'); mapButton.textContent = '타이틀로 돌아가기'; }
    }, 80);
  }

  function ensureStyle(){
    if (document.getElementById('bd-dev-test-style-v385')) return;
    var style = document.createElement('style');
    style.id = 'bd-dev-test-style-v385';
    style.textContent = [
      '#bd-dev-launcher-v385{position:fixed;z-index:10050;left:50%;bottom:max(46px,calc(env(safe-area-inset-bottom) + 22px));transform:translateX(-50%);width:min(92vw,760px);padding:10px 12px;border:1px solid rgba(125,211,252,.38);border-radius:14px;background:rgba(5,10,20,.84);box-shadow:0 12px 34px rgba(0,0,0,.42);backdrop-filter:blur(10px);color:#eaf5ff;font-family:inherit;text-align:center}',
      '#bd-dev-launcher-v385 .bd-dev-label{font-size:11px;font-weight:800;letter-spacing:.06em;color:#8ddcff;margin-bottom:7px}',
      '#bd-dev-launcher-v385 .bd-dev-row{display:flex;justify-content:center;gap:7px;flex-wrap:wrap}',
      '#bd-dev-launcher-v385 button{min-height:36px;padding:7px 12px;border:1px solid rgba(255,255,255,.22);border-radius:9px;background:rgba(255,255,255,.08);color:#fff;font:800 12px/1 inherit;cursor:pointer}',
      '#bd-dev-launcher-v385 button:hover,#bd-dev-launcher-v385 button:focus-visible{background:rgba(125,211,252,.2);border-color:#7dd3fc;outline:none}',
      '#bd-dev-launcher-v385 .bd-dev-credit{border-color:rgba(255,216,107,.42);color:#ffe69a}',
      '#bd-dev-test-exit-v385{display:none;position:fixed;z-index:100500;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);padding:8px 14px;border:1px solid rgba(255,216,107,.55);border-radius:999px;background:rgba(7,12,22,.9);color:#ffe69a;font:800 12px/1.2 inherit;box-shadow:0 5px 20px rgba(0,0,0,.45);cursor:pointer}',
      '#bd-dev-test-exit-v385.show{display:block}',
      '@media(max-width:600px),(max-height:640px){#bd-dev-launcher-v385{bottom:max(8px,env(safe-area-inset-bottom));padding:7px 8px}#bd-dev-launcher-v385 .bd-dev-label{margin-bottom:5px}#bd-dev-launcher-v385 button{min-height:32px;padding:5px 8px;font-size:11px}}'
    ].join('');
    document.head.appendChild(style);
  }
  function ensurePanel(){
    ensureStyle();
    var title = document.getElementById('bd-title-screen');
    if (!title || !title.classList.contains('show')) return;
    if (document.getElementById('bd-dev-launcher-v385')) return;
    var panel = document.createElement('div');
    panel.id = 'bd-dev-launcher-v385';
    panel.setAttribute('role','group');
    panel.setAttribute('aria-label','개발 테스트 시작');
    panel.innerHTML = '<div class="bd-dev-label">EDITOR TEST · 종료 시 원본 진행 자동 복원</div><div class="bd-dev-row">'
      + PRESETS.map(function(p){ return '<button type="button" data-dev-preset="'+p.id+'">'+p.label+'</button>'; }).join('')
      + '<button type="button" class="bd-dev-credit" data-dev-credit="1">🎬 크레딧</button></div>';
    panel.addEventListener('click', function(event){
      var button = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!button) return;
      if (button.hasAttribute('data-dev-credit')){ showCredits(); return; }
      var id = button.getAttribute('data-dev-preset');
      var preset = PRESETS.find(function(p){ return p.id === id; });
      if (preset) applyPreset(preset);
    });
    title.appendChild(panel);
  }

  /* 테스트 중 게임 종료 경로가 타이틀을 그리기 전에 원본을 복원한다. */
  (function wrapTitle(){
    var original = window.BD_showTitle;
    if (typeof original !== 'function' || original.__bdDevTestV385) return;
    window.BD_showTitle = function(){
      if (testActive()){ restoreAndReload(); return; }
      var result = original.apply(this, arguments);
      setTimeout(ensurePanel, 0);
      return result;
    };
    window.BD_showTitle.__bdDevTestV385 = true;
  })();
  ensurePanel();
  if (window.BD_addTick) BD_addTick(ensurePanel, 500); else setInterval(ensurePanel, 500);
  window.BD_DEV_TEST = { start:applyPreset, restore:restoreAndReload, presets:PRESETS.slice() };
})();
