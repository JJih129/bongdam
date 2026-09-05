
(function () {
  'use strict';

  const MAP_DATA = {"BD_CONCEPT_201":null,"BD_CONCEPT_202":null,"BD_CONCEPT_203":null,"BD_CONCEPT_204":null,"BD_CONCEPT_205":null,"BD_CONCEPT_206":null};
  const PRECISION_COLLIDER_DATA = {"version":"v0.8","coordinateSpace":[724,543],"format":["id","label","kind","x","y","width","height"],"stages":{}};   /* (v396) 구 스테이지 201~206 전용 충돌 데이터 제거 — 해당 스테이지는 도달 불가 */
  const NEW_STAGE_IDS = [201, 202, 203, 204, 205, 206];
  const ORIGINAL_STAGE_IDS = [1, 2, 3, 4, 5, 101];
  // v0.7 맵은 단순 2×2 복제가 아닌 Scale2x 1px 세부 경계를 사용한다.
  const CONCEPT_SOURCE_PIXEL_GRID = 1;

  if (typeof window.BD_CONCEPT_PIXEL_PERFECT !== 'boolean') {
    window.BD_CONCEPT_PIXEL_PERFECT = true;
  }
  if (!Number.isFinite(Number(window.BD_NAV_MINIMAP_SCALE))) {
    window.BD_NAV_MINIMAP_SCALE = 0.86;
  }
  window.BD_setNavigationMinimapScale = function (value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return window.BD_NAV_MINIMAP_SCALE;
    window.BD_NAV_MINIMAP_SCALE = Math.max(0.72, Math.min(1.00, numeric));
    return window.BD_NAV_MINIMAP_SCALE;
  };

  // v21: 맵 폭과 무관하게 4개 리 모두 동일한 2x 논리 픽셀 밀도를 사용합니다.
  // 가로/세로 VIEWPORT를 같은 물리 픽셀 배율로 계산하므로 건물과 공원이 늘어나지 않습니다.
  window.BD_DISTRICT_LOGICAL_PIXEL_SIZE = Object.assign(
    {},
    window.BD_DISTRICT_LOGICAL_PIXEL_SIZE || {},
    { 210: 2, 211: 2, 212: 2, 213: 2 }
  );

  function applyConceptPixelPerfectScale(canvas, stage) {
    if (!window.BD_CONCEPT_PIXEL_PERFECT || !canvas || !stage || !stage.__conceptMap) return false;
    const sourceWidth = Number(stage.bgW || 0);
    const sourceHeight = Number(stage.bgH || 0);
    const logicalWidth = sourceWidth / CONCEPT_SOURCE_PIXEL_GRID;
    const logicalHeight = sourceHeight / CONCEPT_SOURCE_PIXEL_GRID;
    if (!Number.isFinite(logicalWidth) || !Number.isFinite(logicalHeight) || logicalWidth <= 0 || logicalHeight <= 0) return false;

    const rawLogicalPixelSize = (BASE_W * currentScale / VIEWPORT_W) / logicalWidth;
    if (!Number.isFinite(rawLogicalPixelSize) || rawLogicalPixelSize <= 0) return false;

    // 가장 가까운 정수 물리 픽셀 배율을 사용한다. Scale2x의 1px 경계를 1·2·3px로만
    // 표시하므로 브라우저 확대나 창 크기 변화에서도 선형 보간과 불균일 픽셀 폭이 없다.
    const configuredLogicalPixelSize = window.BD_DISTRICT_LOGICAL_PIXEL_SIZE
      ? Number(window.BD_DISTRICT_LOGICAL_PIXEL_SIZE[currentStage])
      : NaN;
    const logicalPixelSize = Number.isFinite(configuredLogicalPixelSize)
      ? Math.max(1, Math.round(configuredLogicalPixelSize))
      : Math.max(1, Math.round(rawLogicalPixelSize));

    VIEWPORT_W = (BASE_W * currentScale) / (logicalWidth * logicalPixelSize);
    VIEWPORT_H = (BASE_H * currentScale) / (logicalHeight * logicalPixelSize);
    const effectiveViewScale = VIEWPORT_W / VIEWPORT_BASE_W;
    window.BD_CONCEPT_PIXEL_PERFECT_STATE = {
      enabled: true,
      stageId: Number(currentStage),
      sourcePixelGrid: CONCEPT_SOURCE_PIXEL_GRID,
      upscaleMethod: 'scale2x-edge-aware',
      logicalWidth: logicalWidth,
      logicalHeight: logicalHeight,
      rawLogicalPixelSize: rawLogicalPixelSize,
      logicalPixelSize: logicalPixelSize,
      effectiveViewScale: effectiveViewScale,
      zoomRatio: logicalPixelSize / rawLogicalPixelSize,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height
    };
    document.documentElement.dataset.bdConceptPixelSize = String(logicalPixelSize);
    document.documentElement.dataset.bdConceptRawPixelSize = rawLogicalPixelSize.toFixed(4);
    document.documentElement.dataset.bdConceptEffectiveViewScale = effectiveViewScale.toFixed(4);
    return true;
  }

  function snapConceptPixelCamera() {
    if (!window.BD_CONCEPT_PIXEL_PERFECT) return false;
    const state = window.BD_CONCEPT_PIXEL_PERFECT_STATE;
    if (!state || state.stageId !== Number(currentStage)) return false;
    const visible = BD_visibleHalf();
    const minX = Math.min(0.5, visible.hw);
    const maxX = Math.max(0.5, 1 - visible.hw);
    const minY = Math.min(0.5, visible.hh);
    const maxY = Math.max(0.5, 1 - visible.hh);
    camX = Math.max(minX, Math.min(maxX, Math.round(camX * state.logicalWidth) / state.logicalWidth));
    camY = Math.max(minY, Math.min(maxY, Math.round(camY * state.logicalHeight) / state.logicalHeight));
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 퀘스트 내비게이션
  // 퀘스트 HUD, 미니맵, 테스트 훅이 모두 이 단일 상태를 읽도록 분리했다.
  // 기존 저장 필드는 읽기만 하며 새 필드를 BD 저장 데이터에 쓰지 않는다.
  // ─────────────────────────────────────────────────────────────
  /* (v147) 구맵(1~5) 기준이 그대로 남아 있어, 실제 플레이 무대인
     4개 리 월드(210~213)에서는 «지금 있는 맵이 임무 지역이 아니다»로 늘 오판했다.
     그 결과 길안내가 계속 «F8을 눌러 본편 맵을 선택하세요»만 띄웠다
     (F8은 개발용 맵 선택이라 플레이어에게는 아무 의미가 없는 안내였다). */
  const NAV_MAIN_STAGE = Object.freeze({
    prologue: 212,
    ch1: 212,
    ch2: 213,
    ch3: 211,
    ch4: 210,
    final: 212
  });
  const NAV_STAGE_SPAN_METERS = Object.freeze({
    1: 420, 2: 540, 3: 560, 4: 540, 5: 600, 101: 180,
    201: 180, 202: 520, 203: 520, 204: 600, 205: 560, 206: 620
  });
  const NAV_EXIT_LABEL = Object.freeze({
    top: '북쪽 출구',
    bottom: '남쪽 출구',
    left: '서쪽 출구',
    right: '동쪽 출구'
  });
  const NAV_DIRECTION_LABELS = Object.freeze(['동', '남동', '남', '남서', '서', '북서', '북', '북동']);
  let navigationStateCache = { at: 0, key: '', value: null };

  function navClamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function navFindQuestById(questId) {
    if (!questId) return null;
    const groups = [];
    /* (v147) QUESTS/SUB_QUESTS/NPC_QUESTS 는 다른 클로저 안의 const 라 여기서는 늘 undefined 였다.
       그래서 길안내 패널이 언제나 «현재 임무 없음»을 띄우고,
       «J 임무창에서 추적할 임무를 선택하세요»라는 안내만 반복하고 있었다.
       전역으로 노출된 window.BD_* 목록을 함께 본다. */
    try { if (typeof QUESTS !== 'undefined' && Array.isArray(QUESTS)) groups.push(QUESTS); } catch (error) {}
    try { if (Array.isArray(window.BD_QUESTS)) groups.push(window.BD_QUESTS); } catch (error) {}
    try { if (typeof SUB_QUESTS !== 'undefined' && Array.isArray(SUB_QUESTS)) groups.push(SUB_QUESTS); } catch (error) {}
    try { if (Array.isArray(window.BD_SUB_QUESTS)) groups.push(window.BD_SUB_QUESTS); } catch (error) {}
    try { if (typeof NPC_QUESTS !== 'undefined' && Array.isArray(NPC_QUESTS)) groups.push(NPC_QUESTS); } catch (error) {}
    try { if (Array.isArray(window.BD_NPC_QUESTS)) groups.push(window.BD_NPC_QUESTS); } catch (error) {}
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      for (let questIndex = 0; questIndex < group.length; questIndex += 1) {
        if (group[questIndex] && group[questIndex].id === questId) return group[questIndex];
      }
    }
    return null;
  }

  function navCurrentQuest() {
    if (typeof window.BD === 'undefined' || !window.BD) return { quest: null, tracked: false };
    const trackedId = BD.trackedQuest || null;
    if (trackedId) {
      const trackedQuest = navFindQuestById(trackedId);
      if (trackedQuest) return { quest: trackedQuest, tracked: true };
    }
    try {
      /* (v147) 같은 이유로 본편 임무도 못 찾고 있었다.
         별도로 추적을 지정하지 않았어도 «진행 중인 본편 임무»가 곧 지금의 목표다. */
      const MAIN = (typeof QUESTS !== 'undefined' && QUESTS.length) ? QUESTS
                 : (Array.isArray(window.BD_QUESTS) ? window.BD_QUESTS : null);
      if (MAIN && MAIN.length) {
        const index = typeof BD.questIdx === 'number' ? BD.questIdx : 0;
        return { quest: MAIN[index] || MAIN[0], tracked: true };
      }
    } catch (error) {}
    return { quest: null, tracked: false };
  }

  function navProgress(quest) {
    const objective = quest && Array.isArray(quest.objectives) ? quest.objectives[0] : null;
    const need = objective ? Math.max(1, Number(objective.need) || 1) : 1;
    const current = objective ? navClamp(objective.cur, 0, need) : 0;
    return {
      objective: objective ? String(objective.t || '목표 확인') : '목표 확인',
      current: current,
      need: need,
      ratio: navClamp(current / need, 0, 1),
      done: !!objective && current >= need
    };
  }

  function navObjectCenter(object) {
    return {
      x: navClamp((Number(object && object.rx) || 0) + (Number(object && object.rw) || 0) / 2, 0.02, 0.98),
      y: navClamp((Number(object && object.ry) || 0) + (Number(object && object.rh) || 0) / 2, 0.02, 0.98)
    };
  }

  function navTargetFromObject(object, label, action) {
    if (!object) return null;
    const center = navObjectCenter(object);
    return {
      x: center.x,
      y: center.y,
      kind: object.interactable === 'hazard' ? 'hazard' : (object.conceptFacility ? 'facility' : 'place'),
      label: label || object.label || object.name || '목적지',
      action: action || (object.interactable === 'hazard' ? '가까이 가서 F로 조사하세요' : '목적지에 도착하세요'),
      object: object,
      targetStageId: Number(currentStage),
      hops: 0
    };
  }

  function navNearestObject(stage, predicate) {
    if (!stage || !Array.isArray(stage.objects)) return null;
    let nearest = null;
    let nearestDistance = Infinity;
    for (let index = 0; index < stage.objects.length; index += 1) {
      const object = stage.objects[index];
      if (!object || !predicate(object)) continue;
      const center = navObjectCenter(object);
      const distance = Math.hypot(center.x - heroX, center.y - heroY);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = object;
      }
    }
    return nearest;
  }

  function navIsOpenHazard(object) {
    if (!object || object.interactable !== 'hazard') return false;
    try { if (typeof window.BD_hazardLocked === 'function' && window.BD_hazardLocked(object)) return false; } catch (error) {}
    try { if (typeof _objPurified === 'function' && _objPurified(object)) return false; } catch (error) {}
    return true;
  }

  function navIsPark(object) {
    const text = String((object && (object.label || object.name || object.facilityCategory)) || '');
    return /공원|산책|광장|녹지/.test(text);
  }

  function navIsShop(object) {
    const text = String((object && (object.label || object.name || object.facilityCategory)) || '');
    return !!object && (object.interactable === 'shop' || /상점|편의점|가게|생활편의/.test(text));
  }

  function navIsResident(object) {
    const text = String((object && (object.label || object.name)) || '');
    return !!object && (object.interactable === 'npc' || object.npcId || /주민|할머니|선생님|사서/.test(text));
  }

  function navExitPoint(direction, targetStageId, hops) {
    const stage = typeof STAGES !== 'undefined' ? STAGES[currentStage] : null;
    const exit = stage && stage.exits ? stage.exits[direction] : null;
    const bandMin = exit && Number.isFinite(Number(exit.bandMin)) ? Number(exit.bandMin) : 0.46;
    const bandMax = exit && Number.isFinite(Number(exit.bandMax)) ? Number(exit.bandMax) : 0.54;
    const center = navClamp((bandMin + bandMax) / 2, 0.08, 0.92);
    const points = {
      top: { x: center, y: 0.025 },
      bottom: { x: center, y: 0.975 },
      left: { x: 0.025, y: center },
      right: { x: 0.975, y: center }
    };
    const point = points[direction] || points.top;
    const targetStage = typeof STAGES !== 'undefined' ? STAGES[targetStageId] : null;
    return {
      x: point.x,
      y: point.y,
      kind: 'exit',
      exitDirection: direction,
      label: NAV_EXIT_LABEL[direction] || '연결 출구',
      action: (NAV_EXIT_LABEL[direction] || '출구') + '로 이동하세요',
      targetStageId: Number(targetStageId),
      targetStageName: targetStage ? String(targetStage.name || '').replace('[신규 시안] ', '').replace('[4개 리 월드] ', '') : String(targetStageId),
      hops: Number(hops) || 1
    };
  }

  function navRouteToStage(targetStageId) {
    const startStageId = Number(currentStage);
    const destination = Number(targetStageId);
    if (!Number.isFinite(destination) || startStageId === destination) return null;
    const startStage = typeof STAGES !== 'undefined' ? STAGES[startStageId] : null;
    if (!startStage || !startStage.exits) return null;
    const visited = new Set([startStageId]);
    const queue = [];
    const directions = ['top', 'bottom', 'left', 'right'];
    for (let index = 0; index < directions.length; index += 1) {
      const direction = directions[index];
      const exit = startStage.exits[direction];
      if (!exit || !exit.active || exit.nextStage == null) continue;
      const nextStageId = Number(exit.nextStage);
      if (visited.has(nextStageId)) continue;
      visited.add(nextStageId);
      queue.push({ stageId: nextStageId, firstDirection: direction, hops: 1 });
    }
    for (let head = 0; head < queue.length; head += 1) {
      const node = queue[head];
      if (node.stageId === destination) return navExitPoint(node.firstDirection, destination, node.hops);
      const stage = STAGES[node.stageId];
      if (!stage || !stage.exits) continue;
      for (let index = 0; index < directions.length; index += 1) {
        const exit = stage.exits[directions[index]];
        if (!exit || !exit.active || exit.nextStage == null) continue;
        const nextStageId = Number(exit.nextStage);
        if (visited.has(nextStageId)) continue;
        visited.add(nextStageId);
        queue.push({ stageId: nextStageId, firstDirection: node.firstDirection, hops: node.hops + 1 });
      }
    }
    return null;
  }

  function navFindAcrossStages(predicate, label, action) {
    const startStageId = Number(currentStage);
    const startStage = typeof STAGES !== 'undefined' ? STAGES[startStageId] : null;
    const localObject = navNearestObject(startStage, predicate);
    if (localObject) return navTargetFromObject(localObject, label || localObject.label, action);
    if (!startStage || !startStage.exits) return null;

    const visited = new Set([startStageId]);
    const queue = [];
    const directions = ['top', 'bottom', 'left', 'right'];
    for (let index = 0; index < directions.length; index += 1) {
      const direction = directions[index];
      const exit = startStage.exits[direction];
      if (!exit || !exit.active || exit.nextStage == null) continue;
      const nextStageId = Number(exit.nextStage);
      if (visited.has(nextStageId)) continue;
      visited.add(nextStageId);
      queue.push({ stageId: nextStageId, firstDirection: direction, hops: 1 });
    }
    for (let head = 0; head < queue.length; head += 1) {
      const node = queue[head];
      const stage = STAGES[node.stageId];
      if (stage && Array.isArray(stage.objects) && stage.objects.some(predicate)) {
        return navExitPoint(node.firstDirection, node.stageId, node.hops);
      }
      if (!stage || !stage.exits) continue;
      for (let index = 0; index < directions.length; index += 1) {
        const exit = stage.exits[directions[index]];
        if (!exit || !exit.active || exit.nextStage == null) continue;
        const nextStageId = Number(exit.nextStage);
        if (visited.has(nextStageId)) continue;
        visited.add(nextStageId);
        queue.push({ stageId: nextStageId, firstDirection: node.firstDirection, hops: node.hops + 1 });
      }
    }
    return null;
  }

  function navTargetAtStage(targetStageId, predicate, label, action, fallbackPoint) {
    const numericTargetStageId = Number(targetStageId);
    if (Number(currentStage) !== numericTargetStageId) return navRouteToStage(numericTargetStageId);
    const stage = STAGES[numericTargetStageId];
    const object = navNearestObject(stage, predicate);
    if (object) return navTargetFromObject(object, label || object.label, action);
    if (!fallbackPoint) return null;
    return {
      x: navClamp(fallbackPoint.x, 0.02, 0.98),
      y: navClamp(fallbackPoint.y, 0.02, 0.98),
      kind: fallbackPoint.kind || 'place',
      label: label || fallbackPoint.label || '목적지',
      action: action || fallbackPoint.action || '목적지에 도착하세요',
      targetStageId: numericTargetStageId,
      hops: 0
    };
  }

  function navNpcTarget(questId) {
    try {
      if (questId === 'npc_hyunji' && typeof NPC_STAGE !== 'undefined') {
        return navTargetAtStage(NPC_STAGE, function () { return false; }, '임현지', '가까이 가서 F로 대화하세요', { x: NPC_X, y: NPC_Y, kind: 'npc' });
      }
      if (questId === 'npc_dohyun' && typeof QNPC_STAGE !== 'undefined') {
        return navTargetAtStage(QNPC_STAGE, function () { return false; }, '사서 도현', '가까이 가서 F로 대화하세요', { x: QNPC_X, y: QNPC_Y, kind: 'npc' });
      }
    } catch (error) {}
    if (questId === 'npc_seoyeon') {
      return navTargetAtStage(3, navIsPark, '상리 공원', '공원 안전 지점을 확인하세요', { x: 0.50, y: 0.56, kind: 'place' });
    }
    if (questId === 'npc_junho') {
      return navTargetAtStage(3, navIsPark, '상리 공원', '공원에 들러 안전을 확인하세요', { x: 0.50, y: 0.56, kind: 'place' });
    }
    if (questId === 'npc_haneul' || questId === 'npc_yeongja') {
      return navFindAcrossStages(navIsShop, '가까운 상점', '상점에서 필요한 물건을 구매하세요');
    }
    if (questId === 'npc_sunim') {
      const resident = navFindAcrossStages(navIsResident, '가까운 주민', '가까이 가서 F로 인사하세요');
      if (resident) return resident;
      try {
        if (typeof NPC_STAGE !== 'undefined') {
          return navTargetAtStage(NPC_STAGE, function () { return false; }, '동네 주민', '가까이 가서 F로 인사하세요', { x: NPC_X, y: NPC_Y, kind: 'npc' });
        }
      } catch (error) {}
    }
    return null;
  }

  function navResolveQuestTarget(quest, progress) {
    if (!quest || progress.done) return null;

    // 향후 데이터 추가만으로 연결할 수 있는 선택적 퀘스트 필드.
    if (quest.targetFacilityId && window.BD_CONCEPT_LANDMARK_REGISTRY) {
      const facility = window.BD_CONCEPT_LANDMARK_REGISTRY[quest.targetFacilityId];
      if (facility) {
        if (Number(currentStage) === Number(facility.stageId)) {
          return {
            x: Number(facility.interactionX), y: Number(facility.interactionY), kind: 'facility',
            label: facility.label || '시설', action: quest.nextAction || '시설 앞에서 F로 조사하세요',
            targetStageId: Number(facility.stageId), hops: 0, object: facility
          };
        }
        return navRouteToStage(facility.stageId);
      }
    }
    if (quest.targetStageId != null) {
      const explicitTarget = navTargetAtStage(quest.targetStageId, function (object) {
        return !quest.targetObjectId || object.id === quest.targetObjectId || object._editorId === quest.targetObjectId;
      }, quest.targetLabel || quest.title, quest.nextAction || '목적지를 확인하세요', quest.targetPoint || null);
      if (explicitTarget) return explicitTarget;
    }

    if (Object.prototype.hasOwnProperty.call(NAV_MAIN_STAGE, quest.id)) {
      const stageId = NAV_MAIN_STAGE[quest.id];
      const predicate = quest.id === 'final'
        ? function (object) { return navIsOpenHazard(object) && !!object.isBoss; }
        : navIsOpenHazard;
      return navTargetAtStage(stageId, predicate, quest.id === 'final' ? '최종 위험요소' : '정화할 위험요소', '가까이 가서 F로 조사하세요', null);
    }
    if (quest.id === 'sub_clean3' || quest.id === 'sub_cards') {
      return navFindAcrossStages(navIsOpenHazard, '정화할 위험요소', quest.id === 'sub_cards' ? '위험요소를 정화해 시설 카드를 모으세요' : '가까이 가서 F로 조사하세요');
    }
    if (String(quest.id || '').indexOf('npc_') === 0) return navNpcTarget(quest.id);
    return null;
  }

  function navDirectionName(dx, dy) {
    if (Math.hypot(dx, dy) < 0.015) return '도착';
    const angle = Math.atan2(dy, dx);
    const index = Math.round(angle / (Math.PI / 4));
    return NAV_DIRECTION_LABELS[(index + 8) % 8];
  }

  function navStageLabel(stageId) {
    const stage = typeof STAGES !== 'undefined' ? STAGES[stageId] : null;
    return stage ? String(stage.name || ('스테이지 ' + stageId)).replace('[신규 시안] ', '').replace('[4개 리 월드] ', '') : ('스테이지 ' + stageId);
  }

  function navCacheKey(quest, progress, tracked) {
    let purifiedCount = 0;
    try { purifiedCount = window.BD && BD.purified ? Object.keys(BD.purified).length : 0; } catch (error) {}
    return [
      Number(currentStage), quest ? quest.id : 'none', tracked ? 1 : 0,
      progress.current, progress.need, purifiedCount,
      Math.round(Number(heroX) * 50), Math.round(Number(heroY) * 50)
    ].join('|');
  }

  function getQuestNavigationState(forceRefresh) {
    const now = Date.now();
    // 140ms 동안 같은 상태 객체를 재사용해 60fps 렌더 루프의 배열·문자열 할당을 줄인다.
    if (!forceRefresh && navigationStateCache.value && now - navigationStateCache.at < 140) {
      return navigationStateCache.value;
    }
    const questState = navCurrentQuest();
    const quest = questState.quest;
    const progress = navProgress(quest);
    const cacheKey = navCacheKey(quest, progress, questState.tracked);
    if (!forceRefresh && navigationStateCache.value && navigationStateCache.key === cacheKey && now - navigationStateCache.at < 140) {
      return navigationStateCache.value;
    }

    let target = null;
    let status = questState.tracked ? 'tracking' : 'untracked';
    let action = questState.tracked ? '목적지를 확인하세요' : 'J 임무창에서 추적할 임무를 선택하세요';
    // (v59) 프롤로그 중간 목표 — 배지 수령 후 문화의집에서는 '엘리베이터로 나가기'가 지금 할 일
    try{
      const stM = window.BD_PROGRESS && BD_PROGRESS.story;
      // (v76) 대화·컷신이 진행 중일 때는 다음 목표를 미리 띄우지 않는다 (배지 수여 대화 중 노출 문제)
      let __talking = false;
      try{
        const __db = document.getElementById('dialogue-box');
        __talking = !!(__db && __db.offsetHeight && parseFloat(getComputedStyle(__db).opacity) > 0.05)
          || !!window.__bdSceneActive
          || !!(document.getElementById('bd-badge-ov') && document.getElementById('bd-badge-ov').offsetHeight);
      }catch(eT){}
      if (!__talking && Number(currentStage) === 101 && stM && stM.tutorialFlags && stM.tutorialFlags.badgeGiven && !stM.badgeAwakened){
        action = '🛗 엘리베이터를 타고 밖으로 나가 보세요';
      }
    }catch(eMid){}
    if (progress.done) {
      status = 'done';
      action = 'J 임무창에서 완료 보상을 확인하세요';
    } else if (questState.tracked) {
      target = navResolveQuestTarget(quest, progress);
      if (target) {
        action = target.action || action;
      } else {
        const conceptStage = NEW_STAGE_IDS.indexOf(Number(currentStage)) >= 0;
        const mainDestination = quest && Object.prototype.hasOwnProperty.call(NAV_MAIN_STAGE, quest.id) ? NAV_MAIN_STAGE[quest.id] : null;
        if (conceptStage || (mainDestination != null && Number(currentStage) !== Number(mainDestination))) {
          status = 'unreachable';
          /* (v147) 개발용 단축키(F8) 안내 대신 «어디로 걸어가면 되는지»를 알려 준다 */
          action = (function(){
            try{
              var __st = STAGES[Number(currentStage)];
              if (__st && __st.interior) return '엘리베이터를 타고 밖으로 나가세요';
              var NM = { 212:'와우리', 213:'상리', 211:'동화리', 210:'수영리' };
              var want = (mainDestination != null) ? Number(mainDestination) : null;
              if (want && NM[want]) return NM[want] + ' 방향 도로 끝까지 걸어가세요';
            }catch(e){}
            return '화살표를 따라 다음 지역으로 이동하세요';
          })();
        } else {
          status = 'search';
          action = '현재 지역에서 다음 조사 지점을 찾아보세요';
        }
      }
    }

    let direction = '—';
    let distanceMeters = null;
    let distanceText = '목적지 미지정';
    let routeText = action;
    if (target) {
      const dx = target.x - Number(heroX);
      const dy = target.y - Number(heroY);
      direction = navDirectionName(dx, dy);
      const stageSpanMeters = NAV_STAGE_SPAN_METERS[Number(currentStage)] || 520;
      distanceMeters = Math.max(0, Math.round((Math.hypot(dx, dy) * stageSpanMeters) / 10) * 10);
      distanceText = (target.kind === 'exit' ? '출구까지 약 ' : '약 ') + distanceMeters + 'm';
      routeText = target.kind === 'exit'
        ? target.label + ' → ' + target.targetStageName + (target.hops > 1 ? ' · ' + target.hops + '구역' : '')
        : target.label;
      if (distanceMeters <= 20 && target.kind !== 'exit') action = target.action || '도착했어요. F로 상호작용하세요';
    }

    const value = {
      version: 1,
      stageId: Number(currentStage),
      stageName: navStageLabel(Number(currentStage)),
      questId: quest ? quest.id : null,
      questTitle: quest ? String(quest.title || '현재 임무') : '현재 임무 없음',
      chapter: quest ? String(quest.chapter || quest.giver || (quest.type === 'sub' ? '서브 임무' : '임무')) : '',
      objective: progress.objective,
      current: progress.current,
      need: progress.need,
      progressRatio: progress.ratio,
      done: progress.done,
      tracked: questState.tracked,
      status: status,
      target: target,
      direction: direction,
      distanceMeters: distanceMeters,
      distanceText: distanceText,
      routeText: routeText,
      action: action
    };
    navigationStateCache = { at: now, key: cacheKey, value: value };
    window.BD_NAVIGATION_STATE = value;
    return value;
  }

  function navRoundedPath(ctx, x, y, width, height, radius) {
    const r = Math.min(Math.max(0, radius), width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function navFitText(ctx, value, maxWidth) {
    const text = String(value || '');
    if (ctx.measureText(text).width <= maxWidth) return text;
    let left = 0;
    let right = text.length;
    while (left < right) {
      const middle = Math.ceil((left + right) / 2);
      if (ctx.measureText(text.slice(0, middle) + '…').width <= maxWidth) left = middle;
      else right = middle - 1;
    }
    return text.slice(0, left) + '…';
  }

  function navDrawExitMarker(ctx, mapX, mapY, mapWidth, mapHeight, direction, color, size, centerRatio) {
    const center = navClamp(centerRatio == null ? 0.5 : centerRatio, 0.04, 0.96);
    const x = direction === 'left' ? mapX + 2 : (direction === 'right' ? mapX + mapWidth - 2 : mapX + center * mapWidth);
    const y = direction === 'top' ? mapY + 2 : (direction === 'bottom' ? mapY + mapHeight - 2 : mapY + center * mapHeight);
    ctx.save();
    ctx.translate(x, y);
    const rotation = { top: -Math.PI / 2, right: 0, bottom: Math.PI / 2, left: Math.PI }[direction] || 0;
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.75, -size * 0.72);
    ctx.lineTo(-size * 0.42, 0);
    ctx.lineTo(-size * 0.75, size * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function navDrawRoadControlMarker(ctx, mapX, mapY, mapWidth, mapHeight, control, isRoute, unit) {
    if (!control) return;
    const direction = control.direction;
    const center = navClamp(control.center, 0.04, 0.96);
    if (control.active) {
      navDrawExitMarker(ctx, mapX, mapY, mapWidth, mapHeight, direction, isRoute ? '#ffe05d' : '#79ddff', unit(isRoute ? 6.2 : 4.2), center);
      return;
    }
    const x = direction === 'left' ? mapX + unit(2) : (direction === 'right' ? mapX + mapWidth - unit(2) : mapX + center * mapWidth);
    const y = direction === 'top' ? mapY + unit(2) : (direction === 'bottom' ? mapY + mapHeight - unit(2) : mapY + center * mapHeight);
    const horizontal = direction === 'top' || direction === 'bottom';
    ctx.save();
    ctx.translate(x, y);
    if (!horizontal) ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#ff9f24';
    ctx.strokeStyle = 'rgba(38,25,13,.95)';
    ctx.lineWidth = unit(0.8);
    ctx.fillRect(-unit(4.8), -unit(1.7), unit(9.6), unit(3.4));
    ctx.strokeRect(-unit(4.8), -unit(1.7), unit(9.6), unit(3.4));
    ctx.fillStyle = '#fff0d0';
    ctx.fillRect(-unit(2.8), -unit(1.2), unit(1.7), unit(2.4));
    ctx.fillRect(unit(1.1), -unit(1.2), unit(1.7), unit(2.4));
    ctx.restore();
  }

  function renderNavigationMinimap(ctx, canvas) {
    if (!ctx || !canvas || typeof STAGES === 'undefined' || typeof currentStage === 'undefined') return;
    const stage = STAGES[currentStage];
    if (!stage) return;
    const navigation = getQuestNavigationState(false);
    const compact = canvas.width < 1000 || canvas.height < 620;
    const baseUiScale = Math.max(0.86, Math.min(1.28, canvas.height / 720));
    const minimapScale = Math.max(0.72, Math.min(1.00, Number(window.BD_NAV_MINIMAP_SCALE) || 0.86));
    const uiScale = Math.max(0.78, Math.min(1.10, baseUiScale * minimapScale));
    const unit = function (value) { return value * uiScale; };
    const panelWidth = unit(compact ? 216 : 270);
    const panelPadding = unit(compact ? 8 : 10);
    const headerHeight = unit(compact ? 23 : 27);
    const mapWidth = unit(compact ? 124 : 166);
    const mapHeight = unit(compact ? 106 : 140);
    const columnGap = unit(compact ? 7 : 8);
    const sideWidth = panelWidth - panelPadding * 2 - mapWidth - columnGap;
    const footerGap = unit(7);
    const footerHeight = unit(compact ? 70 : 82);
    const panelHeight = panelPadding * 2 + headerHeight + mapHeight + footerGap + footerHeight;
    const panelX = Math.max(unit(8), canvas.width - unit(14) - panelWidth);
    const panelY = Math.max(unit(compact ? 78 : 88), unit(8));
    const mapX = panelX + panelPadding;
    const mapY = panelY + panelPadding + headerHeight;
    const sideX = mapX + mapWidth + columnGap;
    const footerY = mapY + mapHeight + footerGap;
    const mapPointX = function (ratio) { return mapX + navClamp(ratio, 0, 1) * mapWidth; };
    const mapPointY = function (ratio) { return mapY + navClamp(ratio, 0, 1) * mapHeight; };

    ctx.save();
    const oldSmoothing = ctx.imageSmoothingEnabled;
    const oldQuality = ctx.imageSmoothingQuality;
    ctx.shadowColor = 'rgba(0,0,0,.72)';
    ctx.shadowBlur = unit(18);
    ctx.shadowOffsetY = unit(4);
    const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    panelGradient.addColorStop(0, 'rgba(10,22,34,.95)');
    panelGradient.addColorStop(1, 'rgba(5,12,21,.97)');
    ctx.fillStyle = panelGradient;
    navRoundedPath(ctx, panelX, panelY, panelWidth, panelHeight, unit(10));
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = navigation.status === 'unreachable' ? 'rgba(104,218,255,.92)' : 'rgba(255,213,82,.9)';
    ctx.lineWidth = unit(1.5);
    navRoundedPath(ctx, panelX, panelY, panelWidth, panelHeight, unit(10));
    ctx.stroke();

    // 헤더: 현재 지역과 추적 상태를 분리해 한 줄에 표시한다.
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff4c3';
    ctx.font = '800 ' + Math.round(unit(compact ? 11 : 12)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(navFitText(ctx, '길안내 · ' + navigation.stageName, panelWidth - unit(98)), panelX + panelPadding, panelY + panelPadding + headerHeight * 0.45);
    const chipText = navigation.done ? '완료' : (navigation.status === 'unreachable' ? '맵 이동 필요' : (navigation.tracked ? '추적 중' : '자유 탐험'));
    ctx.font = '800 ' + Math.round(unit(compact ? 8 : 9)) + 'px "Noto Sans KR", sans-serif';
    const chipWidth = Math.max(unit(38), ctx.measureText(chipText).width + unit(13));
    const chipX = panelX + panelWidth - panelPadding - chipWidth;
    const chipY = panelY + panelPadding + unit(2);
    ctx.fillStyle = navigation.done ? 'rgba(38,142,87,.82)' : (navigation.status === 'unreachable' ? 'rgba(23,112,145,.82)' : 'rgba(115,83,19,.84)');
    navRoundedPath(ctx, chipX, chipY, chipWidth, unit(17), unit(8));
    ctx.fill();
    ctx.fillStyle = '#fff7d0';
    ctx.textAlign = 'center';
    ctx.fillText(chipText, chipX + chipWidth / 2, chipY + unit(8.5));

    // 실제 스테이지 배경을 축소해 길과 건물 배치를 그대로 보여준다.
    ctx.save();
    navRoundedPath(ctx, mapX, mapY, mapWidth, mapHeight, unit(5));
    ctx.clip();
    const backgroundImage = stage.bgKey && typeof LOADED_IMGS !== 'undefined' ? LOADED_IMGS[stage.bgKey] : null;
    if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(backgroundImage, mapX, mapY, mapWidth, mapHeight);
    } else {
      ctx.fillStyle = '#435c45';
      ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
      const objects = Array.isArray(stage.objects) ? stage.objects : [];
      ctx.fillStyle = 'rgba(171,143,101,.92)';
      for (let index = 0; index < objects.length; index += 1) {
        const object = objects[index];
        if (!object || object.type !== 'building' || object.type === 'wall') continue;
        ctx.fillRect(mapPointX(object.rx), mapPointY(object.ry), Math.max(unit(2), Number(object.rw) * mapWidth), Math.max(unit(2), Number(object.rh) * mapHeight));
      }
    }
    ctx.fillStyle = 'rgba(3,10,17,.30)';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);

    // 실제 도로 끝마다 이동 가능(하늘색 화살표) 또는 공사 중(주황 바리케이드)을 표시한다.
    const roadControls = Array.isArray(stage.__roadControls) ? stage.__roadControls : null;
    if (roadControls && roadControls.length) {
      for (let index = 0; index < roadControls.length; index += 1) {
        const control = roadControls[index];
        const isRoute = !!(control.active && navigation.target && navigation.target.kind === 'exit' && navigation.target.exitDirection === control.direction);
        navDrawRoadControlMarker(ctx, mapX, mapY, mapWidth, mapHeight, control, isRoute, unit);
      }
    } else {
      const exitDirections = ['top', 'bottom', 'left', 'right'];
      for (let index = 0; index < exitDirections.length; index += 1) {
        const direction = exitDirections[index];
        const exit = stage.exits && stage.exits[direction];
        if (!exit || !exit.active) continue;
        const isRoute = navigation.target && navigation.target.kind === 'exit' && navigation.target.exitDirection === direction;
        const center = ((Number(exit.bandMin) || 0.46) + (Number(exit.bandMax) || 0.54)) / 2;
        navDrawExitMarker(ctx, mapX, mapY, mapWidth, mapHeight, direction, isRoute ? '#ffe05d' : 'rgba(255,255,255,.72)', unit(isRoute ? 7 : 4), center);
      }
    }

    // 위험요소는 작은 상태점으로, 주요시설은 청록 사각형으로 표시한다.
    const stageObjects = Array.isArray(stage.objects) ? stage.objects : [];
    for (let index = 0; index < stageObjects.length; index += 1) {
      const object = stageObjects[index];
      if (!object) continue;
      if (object.interactable === 'hazard') {
        let purified = false;
        try { purified = typeof _objPurified === 'function' && _objPurified(object); } catch (error) {}
        if (purified) continue;
        const center = navObjectCenter(object);
        ctx.fillStyle = '#ff5a55';
        ctx.strokeStyle = 'rgba(255,255,255,.95)';
        ctx.lineWidth = unit(0.8);
        ctx.beginPath();
        ctx.arc(mapPointX(center.x), mapPointY(center.y), unit(compact ? 2.4 : 2.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (object.conceptFacility) {
        const center = navObjectCenter(object);
        let visited = false;
        try { visited = facilityVisitState.visitedFacilityIds.indexOf(object.facilityId) >= 0; } catch (error) {}
        ctx.fillStyle = visited ? '#69e69c' : '#69d7ff';
        ctx.fillRect(mapPointX(center.x) - unit(1.8), mapPointY(center.y) - unit(1.8), unit(3.6), unit(3.6));
      }
    }

    const playerX = mapPointX(heroX);
    const playerY = mapPointY(heroY);
    if (navigation.target) {
      const targetX = mapPointX(navigation.target.x);
      const targetY = mapPointY(navigation.target.y);
      ctx.strokeStyle = 'rgba(5,10,15,.88)';
      ctx.lineWidth = unit(4.2);
      ctx.setLineDash([unit(5), unit(4)]);
      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.strokeStyle = '#ffe05d';
      ctx.lineWidth = unit(2.0);
      ctx.beginPath();
      ctx.moveTo(playerX, playerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      ctx.setLineDash([]);

      const pulse = unit(7 + 1.7 * Math.sin(Date.now() / 220));
      ctx.strokeStyle = 'rgba(255,224,93,.95)';
      ctx.lineWidth = unit(1.6);
      ctx.beginPath();
      ctx.arc(targetX, targetY, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(targetX, targetY);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#ffe05d';
      ctx.fillRect(-unit(4.1), -unit(4.1), unit(8.2), unit(8.2));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = unit(1.2);
      ctx.strokeRect(-unit(4.1), -unit(4.1), unit(8.2), unit(8.2));
      ctx.restore();
    }

    // 플레이어는 바라보는 방향이 보이는 삼각형으로 표시한다.
    const facingRotation = { right: 0, front: Math.PI / 2, left: Math.PI, back: -Math.PI / 2 }[typeof lastDir !== 'undefined' ? lastDir : 'front'] || Math.PI / 2;
    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.rotate(facingRotation);
    ctx.shadowColor = '#66d8ff';
    ctx.shadowBlur = unit(7);
    ctx.fillStyle = '#63d8ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = unit(1.1);
    ctx.beginPath();
    ctx.moveTo(unit(5.6), 0);
    ctx.lineTo(-unit(4.1), -unit(3.8));
    ctx.lineTo(-unit(2.2), 0);
    ctx.lineTo(-unit(4.1), unit(3.8));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    ctx.strokeStyle = 'rgba(157,214,235,.72)';
    ctx.lineWidth = unit(1);
    navRoundedPath(ctx, mapX, mapY, mapWidth, mapHeight, unit(5));
    ctx.stroke();

    // 우측 나침반: 방향, 출구/장소, 거리를 큰 글자로 표시한다.
    ctx.fillStyle = 'rgba(15,35,49,.74)';
    navRoundedPath(ctx, sideX, mapY, sideWidth, mapHeight, unit(5));
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9de8ff';
    ctx.font = '800 ' + Math.round(unit(compact ? 8 : 9)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText('목적지', sideX + sideWidth / 2, mapY + unit(13));
    const compassCenterX = sideX + sideWidth / 2;
    const compassCenterY = mapY + unit(compact ? 37 : 47);
    const compassRadius = unit(compact ? 15 : 22);
    ctx.strokeStyle = 'rgba(158,225,248,.45)';
    ctx.lineWidth = unit(1);
    ctx.beginPath();
    ctx.arc(compassCenterX, compassCenterY, compassRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.font = '800 ' + Math.round(unit(7)) + 'px sans-serif';
    ctx.fillText('N', compassCenterX, compassCenterY - compassRadius + unit(6));
    if (navigation.target) {
      const angle = Math.atan2(navigation.target.y - heroY, navigation.target.x - heroX);
      ctx.save();
      ctx.translate(compassCenterX, compassCenterY);
      ctx.rotate(angle);
      ctx.fillStyle = '#ffe05d';
      ctx.beginPath();
      ctx.moveTo(compassRadius - unit(3), 0);
      ctx.lineTo(-unit(6), -unit(5));
      ctx.lineTo(-unit(2), 0);
      ctx.lineTo(-unit(6), unit(5));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.font = '800 ' + Math.round(unit(12)) + 'px sans-serif';
      ctx.fillText('—', compassCenterX, compassCenterY + unit(2));
    }
    ctx.fillStyle = navigation.status === 'unreachable' ? '#78dcff' : '#fff0a0';
    ctx.font = '900 ' + Math.round(unit(compact ? 12 : 15)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(navigation.direction, compassCenterX, mapY + unit(compact ? 62 : 82));
    ctx.fillStyle = '#d9edf5';
    ctx.font = '750 ' + Math.round(unit(compact ? 7.5 : 8.5)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(navFitText(ctx, navigation.distanceText, sideWidth - unit(7)), compassCenterX, mapY + unit(compact ? 76 : 100));
    ctx.fillStyle = '#9fb7c4';
    ctx.font = '650 ' + Math.round(unit(compact ? 6.7 : 7.5)) + 'px "Noto Sans KR", sans-serif';
    const routeLines = navigation.target && navigation.target.kind === 'exit'
      ? [navigation.target.label, navigation.target.targetStageName]
      : [navigation.routeText, navigation.tracked ? '◆ 목적지' : 'J 임무 추적'];
    ctx.fillText(navFitText(ctx, routeLines[0], sideWidth - unit(7)), compassCenterX, mapY + mapHeight - unit(compact ? 17 : 24));
    ctx.fillText(navFitText(ctx, routeLines[1], sideWidth - unit(7)), compassCenterX, mapY + mapHeight - unit(compact ? 7 : 11));

    // 하단 퀘스트 카드: 진행률과 다음 행동을 지도와 같은 상태로 표시한다.
    ctx.fillStyle = 'rgba(15,30,44,.86)';
    navRoundedPath(ctx, mapX, footerY, panelWidth - panelPadding * 2, footerHeight, unit(5));
    ctx.fill();
    const footerInnerX = mapX + unit(8);
    const footerInnerWidth = panelWidth - panelPadding * 2 - unit(16);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b9dcec';
    ctx.font = '750 ' + Math.round(unit(compact ? 7.8 : 8.8)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(navFitText(ctx, navigation.chapter || '현재 임무', footerInnerWidth), footerInnerX, footerY + unit(11));
    ctx.fillStyle = '#fff4c1';
    ctx.font = '850 ' + Math.round(unit(compact ? 10 : 11.5)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(navFitText(ctx, navigation.questTitle, footerInnerWidth - unit(44)), footerInnerX, footerY + unit(compact ? 25 : 27));
    ctx.textAlign = 'right';
    ctx.fillStyle = navigation.done ? '#82efa9' : '#ffe16a';
    ctx.font = '850 ' + Math.round(unit(compact ? 8 : 9)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(navigation.current + '/' + navigation.need, mapX + panelWidth - panelPadding * 2 - unit(8), footerY + unit(compact ? 25 : 27));
    const progressX = footerInnerX;
    const progressY = footerY + unit(compact ? 34 : 38);
    const progressWidth = footerInnerWidth;
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    navRoundedPath(ctx, progressX, progressY, progressWidth, unit(4), unit(2));
    ctx.fill();
    if (navigation.progressRatio > 0) {
      const progressGradient = ctx.createLinearGradient(progressX, 0, progressX + progressWidth, 0);
      progressGradient.addColorStop(0, navigation.done ? '#39d57f' : '#e5ad29');
      progressGradient.addColorStop(1, navigation.done ? '#a7ffca' : '#fff18a');
      ctx.fillStyle = progressGradient;
      navRoundedPath(ctx, progressX, progressY, Math.max(unit(4), progressWidth * navigation.progressRatio), unit(4), unit(2));
      ctx.fill();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = navigation.status === 'unreachable' ? '#9eeaff' : (navigation.done ? '#9affbe' : '#ffffff');
    ctx.font = '800 ' + Math.round(unit(compact ? 8.2 : 9.3)) + 'px "Noto Sans KR", sans-serif';
    const actionPrefix = navigation.status === 'unreachable' ? '지도 ' : (navigation.done ? '완료 ' : '다음 ');
    ctx.fillText(navFitText(ctx, actionPrefix + '› ' + navigation.action, footerInnerWidth), footerInnerX, footerY + unit(compact ? 51 : 58));
    ctx.fillStyle = '#83a8ba';
    ctx.font = '650 ' + Math.round(unit(compact ? 6.8 : 7.6)) + 'px "Noto Sans KR", sans-serif';
    ctx.fillText(compact ? '◆ 목적지 · ⇢ 이동 · ▬ 공사중' : 'J 임무  ·  ◆ 목적지  ·  ⇢ 지역 이동  ·  ▬ 공사중', footerInnerX, footerY + footerHeight - unit(9));

    ctx.imageSmoothingEnabled = oldSmoothing;
    ctx.imageSmoothingQuality = oldQuality;
    ctx.restore();
  }

  function installQuestNavigationHud() {
    if (window.__bdQuestNavigationHudInstalled) return;
    const update = function () {
      if (document.hidden) return;
      const hud = document.getElementById('bd-quest-hud');
      if (!hud) return;
      let guide = hud.querySelector('.bd-nav-guide');
      if (!guide) {
        guide = document.createElement('div');
        guide.className = 'bd-nav-guide';
        guide.innerHTML = '<div class="bd-nav-guide-main"><span class="bd-nav-guide-direction"></span><span class="bd-nav-guide-text"></span><span class="bd-nav-guide-distance"></span></div><div class="bd-nav-guide-progress"><i></i></div>';
        hud.appendChild(guide);
      }
      let navigation;
      try { navigation = getQuestNavigationState(false); } catch (error) { return; }
      guide.dataset.state = navigation.status;
      const direction = guide.querySelector('.bd-nav-guide-direction');
      const text = guide.querySelector('.bd-nav-guide-text');
      const distance = guide.querySelector('.bd-nav-guide-distance');
      const progress = guide.querySelector('.bd-nav-guide-progress > i');
      /* (v147) 개발용 단축키 이름(F8 지도)이 플레이어 안내에 그대로 노출되던 문제 */
      if (direction) direction.textContent = navigation.status === 'unreachable' ? '이동' : (navigation.done ? '완료' : navigation.direction);
      if (text) {
        text.textContent = navigation.status === 'tracking' && navigation.target
          ? navigation.routeText + ' · ' + navigation.action
          : navigation.action;
      }
      if (distance) distance.textContent = navigation.target ? navigation.distanceText : '';
      if (progress) progress.style.width = Math.round(navigation.progressRatio * 100) + '%';
    };
    window.BD_updateQuestNavigationHud = update;
    window.__bdQuestNavigationHudTimer = window.setInterval(update, 250);
    window.addEventListener('bd-concept-facility-interacted', function () {
      navigationStateCache.at = 0;
      update();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) update(); });
    window.setTimeout(update, 0);
    window.__bdQuestNavigationHudInstalled = true;
  }

  window.BD_getQuestNavigationState = getQuestNavigationState;
  window.BD_renderNavigationMinimap = renderNavigationMinimap;

  function wall(rx, ry, rw, rh, label) {
    return { type: 'wall', rx: rx, ry: ry, rw: rw, rh: rh, label: label || '' };
  }

  function edgeWalls() {
    return [
      wall(0.000, 0.000, 1.000, 0.014, '북쪽 경계'),
      wall(0.000, 0.986, 1.000, 0.014, '남쪽 경계'),
      wall(0.000, 0.000, 0.010, 1.000, '서쪽 경계'),
      wall(0.990, 0.000, 0.010, 1.000, '동쪽 경계')
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // v0.8 배경 원화 기반 정밀 콜라이더
  // 원화 제작 기준인 724×543 논리 픽셀 좌표를 런타임 비율 좌표로 변환한다.
  // 건물·가구·수목·수면을 개별 오브젝트로 유지해 에디터에서 각각 조정할 수 있다.
  // ─────────────────────────────────────────────────────────────
  const PRECISION_COLLIDER_KIND_COLORS = Object.freeze({
    building: ['rgba(255,82,82,.24)', '#ff6a6a'],
    wall: ['rgba(255,153,61,.24)', '#ffa33d'],
    furniture: ['rgba(184,108,255,.24)', '#c07aff'],
    fixture: ['rgba(255,210,72,.24)', '#ffd448'],
    planter: ['rgba(82,214,110,.24)', '#5cdb76'],
    tree: ['rgba(45,181,91,.28)', '#34c96d'],
    vegetation: ['rgba(63,161,74,.24)', '#50b95f'],
    water: ['rgba(42,166,255,.28)', '#42b6ff'],
    fence: ['rgba(207,210,218,.24)', '#d5dae6'],
    boundary: ['rgba(255,75,179,.24)', '#ff62bf']
  });
  const LEGACY_CONCEPT_COLLIDER_LABELS = new Set([
    '북쪽 경계', '남쪽 경계', '서쪽 경계', '동쪽 경계',
    '휴게 라운지', 'PC·스터디룸', '안내·설비 구역', '연습실', '회의실', '보드게임실',
    '북카페 테라스', '중앙 북 라운지', '영상실', '댄스룸', '강의실 A', '강의실 B', '음악실',
    '문화시설 본관', '안전 거점', '어린이공원 시설물', '버스 정류 광장 시설물',
    '생활문화 골목', '마을 쉼터', '청소년 놀터', '생활 편의 블록 A', '생활 편의 블록 B',
    '대중교통 거점', '생활 편의 블록 C', '체험 상점가 A', '체험 상점가 B',
    '봉담도서관', '봉담호수 수면', '여울림공원 녹지', '생태체육공원 시설',
    '화성시 어린이문화센터', '화성국민체육센터', '문화예술 건축군', '중앙 분수광장',
    '동화마을 생태공원', '하천 녹지 A', '하천 녹지 B',
    '화성시민캠퍼스', '환경·생태 체험권', '생활 안전 거점 A', '봉담파출소',
    '생활 안전 거점 B', '작은 공원', '버스 회차부 시설물', '외곽 체험시설'
  ]);

  function makePrecisionCollider(stageId, tuple) {
    const sourceWidth = Number(PRECISION_COLLIDER_DATA.coordinateSpace[0]) || 724;
    const sourceHeight = Number(PRECISION_COLLIDER_DATA.coordinateSpace[1]) || 543;
    const id = String(tuple[0] || 'unnamed');
    const kind = PRECISION_COLLIDER_KIND_COLORS[tuple[2]] ? tuple[2] : 'fixture';
    const sourceX = Number(tuple[3]);
    const sourceY = Number(tuple[4]);
    const sourceW = Number(tuple[5]);
    const sourceH = Number(tuple[6]);
    return {
      _editorId: 'concept_collider_' + stageId + '_' + id,
      id: 'concept_collider_' + stageId + '_' + id,
      type: 'wall',
      label: String(tuple[1] || id),
      collisionKind: kind,
      precisionCollider: true,
      colliderVersion: PRECISION_COLLIDER_DATA.version,
      rx: sourceX / sourceWidth,
      ry: sourceY / sourceHeight,
      rw: sourceW / sourceWidth,
      rh: sourceH / sourceHeight,
      sourcePixelBounds: { x:sourceX, y:sourceY, width:sourceW, height:sourceH },
      note: '배경 원화 오브젝트 기반 정밀 콜라이더 · ' + kind,
      hidden: false,
      locked: false
    };
  }

  function makeBoundaryCollider(stageId, direction, part, rx, ry, rw, rh) {
    const id = 'concept_collider_' + stageId + '_boundary_' + direction + '_' + part;
    return {
      _editorId: id,
      id: id,
      type: 'wall',
      label: direction + ' 맵 경계 ' + part,
      collisionKind: 'boundary',
      precisionCollider: true,
      boundaryCollider: true,
      colliderVersion: PRECISION_COLLIDER_DATA.version,
      rx: rx, ry: ry, rw: rw, rh: rh,
      note: '활성 출구 구간을 제외한 맵 외곽 경계',
      hidden: false,
      locked: false
    };
  }

  function createBoundaryColliders(stageId, stage) {
    const result = [];
    const thickness = .014;
    const directions = ['top', 'bottom', 'left', 'right'];
    directions.forEach(function (direction) {
      const exit = stage && stage.exits ? stage.exits[direction] : null;
      const hasOpening = !!(exit && exit.active && Number.isFinite(Number(exit.bandMin)) && Number.isFinite(Number(exit.bandMax)));
      if (!hasOpening) {
        if (direction === 'top') result.push(makeBoundaryCollider(stageId, direction, 'full', 0, 0, 1, thickness));
        else if (direction === 'bottom') result.push(makeBoundaryCollider(stageId, direction, 'full', 0, 1 - thickness, 1, thickness));
        else if (direction === 'left') result.push(makeBoundaryCollider(stageId, direction, 'full', 0, 0, thickness, 1));
        else result.push(makeBoundaryCollider(stageId, direction, 'full', 1 - thickness, 0, thickness, 1));
        return;
      }
      const bandMin = Math.max(.02, Math.min(.98, Number(exit.bandMin)));
      const bandMax = Math.max(bandMin, Math.min(.98, Number(exit.bandMax)));
      if (direction === 'top' || direction === 'bottom') {
        const y = direction === 'top' ? 0 : 1 - thickness;
        if (bandMin > 0) result.push(makeBoundaryCollider(stageId, direction, 'a', 0, y, bandMin, thickness));
        if (bandMax < 1) result.push(makeBoundaryCollider(stageId, direction, 'b', bandMax, y, 1 - bandMax, thickness));
      } else {
        const x = direction === 'left' ? 0 : 1 - thickness;
        if (bandMin > 0) result.push(makeBoundaryCollider(stageId, direction, 'a', x, 0, thickness, bandMin));
        if (bandMax < 1) result.push(makeBoundaryCollider(stageId, direction, 'b', x, bandMax, thickness, 1 - bandMax));
      }
    });
    return result;
  }

  function ensureConceptPrecisionColliders(stageId, stage) {
    if (!stage) return;
    const definitions = PRECISION_COLLIDER_DATA.stages[stageId] || [];
    const existingObjects = Array.isArray(stage.objects) ? stage.objects : [];
    stage.objects = existingObjects.filter(function (object) {
      if (!object) return false;
      if (object.precisionCollider || object.boundaryCollider) return false;
      if (object.type === 'wall' && !object.roadControl && LEGACY_CONCEPT_COLLIDER_LABELS.has(String(object.label || ''))) return false;
      return true;
    });
    const colliders = definitions.map(function (tuple) { return makePrecisionCollider(stageId, tuple); });
    const boundaries = createBoundaryColliders(stageId, stage);
    for (let index = 0; index < boundaries.length; index += 1) colliders.push(boundaries[index]);
    for (let index = 0; index < colliders.length; index += 1) stage.objects.push(colliders[index]);
    stage.__precisionColliders = colliders;
    stage.precisionColliderCount = colliders.length;
    stage.precisionColliderSourceCount = definitions.length;
    stage.precisionColliderVersion = PRECISION_COLLIDER_DATA.version;
    stage.collision = true;
  }

  function drawConceptPrecisionColliders(ctx, canvas, stage) {
    if (!window.BD_CONCEPT_COLLIDER_DEBUG || !ctx || !canvas || !stage || !Array.isArray(stage.__precisionColliders)) return;
    const drawLabels = !!window.BD_CONCEPT_COLLIDER_LABELS;
    const colliders = stage.__precisionColliders;
    ctx.save();
    for (let index = 0; index < colliders.length; index += 1) {
      const collider = colliders[index];
      const colors = PRECISION_COLLIDER_KIND_COLORS[collider.collisionKind] || PRECISION_COLLIDER_KIND_COLORS.fixture;
      const x = toScreenX(collider.rx, canvas);
      const y = toScreenY(collider.ry, canvas);
      const width = toScreenW(collider.rw, canvas);
      const height = toScreenH(collider.rh, canvas);
      if (x + width < 0 || y + height < 0 || x > canvas.width || y > canvas.height) continue;
      ctx.fillStyle = colors[0];
      ctx.strokeStyle = colors[1];
      ctx.lineWidth = Math.max(1, Number(currentScale) || 1);
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      if (drawLabels && width > 34 && height > 12) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,0,.90)';
        ctx.lineWidth = Math.max(2, (Number(currentScale) || 1) * 2);
        ctx.font = '800 ' + Math.max(8, Math.round(8 * (Number(currentScale) || 1))) + 'px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const label = collider.label || collider.id;
        ctx.strokeText(label, x + 2, y + 2, Math.max(10, width - 4));
        ctx.fillText(label, x + 2, y + 2, Math.max(10, width - 4));
      }
    }
    ctx.restore();
  }

  window.BD_CONCEPT_COLLIDER_REGISTRY = PRECISION_COLLIDER_DATA;
  window.BD_getConceptPrecisionColliders = function (stageId) {
    const stage = typeof STAGES !== 'undefined' ? STAGES[Number(stageId)] : null;
    return stage && Array.isArray(stage.__precisionColliders) ? stage.__precisionColliders.slice() : [];
  };
  window.BD_setConceptColliderDebug = function (enabled, labels) {
    window.BD_CONCEPT_COLLIDER_DEBUG = !!enabled;
    if (typeof labels !== 'undefined') window.BD_CONCEPT_COLLIDER_LABELS = !!labels;
    return { enabled:window.BD_CONCEPT_COLLIDER_DEBUG, labels:!!window.BD_CONCEPT_COLLIDER_LABELS };
  };
  window.BD_drawConceptPrecisionColliders = drawConceptPrecisionColliders;

  // 배경 원화에서 실제로 도로가 화면 끝에 닿는 지점을 모두 데이터화한다.
  // active=true는 스테이지 이동 출구, false는 공사 차단물과 충돌 벽을 함께 생성한다.
  const CONCEPT_ROAD_CONTROLS = Object.freeze({
    201: [],
    202: [
      { id:'202_top', direction:'top', center:.548, span:.095, active:false, label:'북쪽 도로 공사' },
      { id:'202_left', direction:'left', center:.500, span:.090, active:false, label:'서쪽 도로 공사' },
      { id:'202_right', direction:'right', center:.500, span:.090, active:true, targetStageId:203, targetLabel:'와우리 생활권' }
    ],
    203: [
      { id:'203_top_west', direction:'top', center:.320, span:.060, active:false, label:'북서 차로 공사' },
      { id:'203_top_east', direction:'top', center:.630, span:.060, active:true, targetStageId:204, targetLabel:'상리' },
      { id:'203_bottom_west', direction:'bottom', center:.320, span:.060, active:false, label:'남서 차로 공사' },
      { id:'203_bottom_east', direction:'bottom', center:.630, span:.060, active:true, targetStageId:206, targetLabel:'수영리' },
      { id:'203_left_north', direction:'left', center:.370, span:.065, active:true, targetStageId:202, targetLabel:'와우리 문화권' },
      { id:'203_left_south', direction:'left', center:.700, span:.065, active:false, label:'서남 차로 공사' },
      { id:'203_right_north', direction:'right', center:.370, span:.065, active:true, targetStageId:205, targetLabel:'동화리' },
      { id:'203_right_south', direction:'right', center:.700, span:.065, active:false, label:'동남 차로 공사' }
    ],
    204: [
      { id:'204_top', direction:'top', center:.500, span:.070, active:false, label:'북쪽 도로 공사' },
      { id:'204_bottom', direction:'bottom', center:.500, span:.070, active:true, targetStageId:203, targetLabel:'와우리 생활권' },
      { id:'204_left', direction:'left', center:.515, span:.070, active:false, label:'서쪽 도로 공사' },
      { id:'204_right', direction:'right', center:.515, span:.070, active:false, label:'동쪽 도로 공사' }
    ],
    205: [
      { id:'205_top', direction:'top', center:.500, span:.070, active:false, label:'북쪽 도로 공사' },
      { id:'205_left_north', direction:'left', center:.380, span:.070, active:true, targetStageId:203, targetLabel:'와우리 생활권' },
      { id:'205_right_north', direction:'right', center:.380, span:.070, active:false, label:'동북 차로 공사' },
      { id:'205_left_south', direction:'left', center:.775, span:.070, active:false, label:'서남 차로 공사' },
      { id:'205_right_south', direction:'right', center:.775, span:.070, active:false, label:'동남 차로 공사' }
    ],
    206: [
      { id:'206_top', direction:'top', center:.500, span:.080, active:true, targetStageId:203, targetLabel:'와우리 생활권' },
      { id:'206_left_north', direction:'left', center:.430, span:.065, active:false, label:'서북 차로 공사' },
      { id:'206_right_north', direction:'right', center:.430, span:.065, active:false, label:'동북 차로 공사' },
      { id:'206_left_south', direction:'left', center:.720, span:.065, active:false, label:'서남 차로 공사' },
      { id:'206_right_south', direction:'right', center:.720, span:.065, active:false, label:'동남 차로 공사' },
      { id:'206_bottom_left', direction:'bottom', center:.300, span:.060, active:false, label:'남서 차로 공사' },
      { id:'206_bottom_right', direction:'bottom', center:.720, span:.060, active:false, label:'남동 차로 공사' }
    ]
  });

  function roadControlCollisionBounds(control) {
    const span = Math.max(.035, Math.min(.16, Number(control.span) || .065));
    const center = Math.max(span / 2, Math.min(1 - span / 2, Number(control.center) || .5));
    if (control.direction === 'top') return [center - span / 2, .012, span, .048];
    if (control.direction === 'bottom') return [center - span / 2, .940, span, .048];
    if (control.direction === 'left') return [.012, center - span / 2, .048, span];
    return [.940, center - span / 2, .048, span];
  }

  function ensureConceptRoadControls(stageId, stage) {
    if (!stage) return;
    const templates = CONCEPT_ROAD_CONTROLS[stageId] || [];
    const controls = templates.map(function (template) { return Object.assign({}, template); });
    stage.__roadControls = controls;
    stage.roadControls = controls;
    const objects = Array.isArray(stage.objects) ? stage.objects : [];
    stage.objects = objects.filter(function (object) {
      return !(object && (object.roadControl || String(object._editorId || '').indexOf('concept_roadblock_') === 0));
    });
    controls.forEach(function (control) {
      if (control.active) return;
      const bounds = roadControlCollisionBounds(control);
      stage.objects.push({
        _editorId: 'concept_roadblock_' + control.id,
        id: 'concept_roadblock_' + control.id,
        type: 'wall',
        roadControl: true,
        roadControlId: control.id,
        direction: control.direction,
        rx: bounds[0], ry: bounds[1], rw: bounds[2], rh: bounds[3],
        label: '공사 중 · ' + (control.label || control.id),
        note: '배경 도로 끝과 일치하는 공사 차단 시설',
        hidden: false,
        locked: false
      });
    });
  }

  function roadControlScreenPoint(control, canvas) {
    const center = Math.max(.04, Math.min(.96, Number(control.center) || .5));
    const points = {
      top: { x:center, y:.042, outwardX:0, outwardY:-1, inwardX:0, inwardY:1 },
      bottom: { x:center, y:.958, outwardX:0, outwardY:1, inwardX:0, inwardY:-1 },
      left: { x:.042, y:center, outwardX:-1, outwardY:0, inwardX:1, inwardY:0 },
      right: { x:.958, y:center, outwardX:1, outwardY:0, inwardX:-1, inwardY:0 }
    };
    const point = points[control.direction] || points.top;
    return {
      x: toScreenX(point.x, canvas), y: toScreenY(point.y, canvas),
      outwardX: point.outwardX, outwardY: point.outwardY,
      inwardX: point.inwardX, inwardY: point.inwardY
    };
  }

  function drawRoadControlCone(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.fillStyle = '#ff861c';
    ctx.strokeStyle = '#4b2b11';
    ctx.lineWidth = Math.max(1, Math.round(scale));
    ctx.beginPath();
    ctx.moveTo(0, -6 * scale);
    ctx.lineTo(-4 * scale, 4 * scale);
    ctx.lineTo(4 * scale, 4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(-2.8 * scale, -0.8 * scale, 5.6 * scale, 2 * scale);
    ctx.fillStyle = '#5b3719';
    ctx.fillRect(-5 * scale, 4 * scale, 10 * scale, 2.5 * scale);
    ctx.restore();
  }

  function drawBlockedRoadControl(ctx, canvas, control) {
    const point = roadControlScreenPoint(control, canvas);
    const visualScale = Math.max(.82, Math.min(1.45, Number(currentScale) || 1));
    const rawSpan = (control.direction === 'top' || control.direction === 'bottom')
      ? Math.abs(toScreenW(control.span, canvas))
      : Math.abs(toScreenH(control.span, canvas));
    const barWidth = Math.max(34 * visualScale, Math.min(84 * visualScale, rawSpan));
    const barHeight = 8 * visualScale;
    const vertical = control.direction === 'left' || control.direction === 'right';
    ctx.save();
    ctx.translate(Math.round(point.x), Math.round(point.y));
    if (vertical) ctx.rotate(Math.PI / 2);
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 5 * visualScale;
    ctx.fillStyle = '#f28b1b';
    ctx.strokeStyle = '#4b2d12';
    ctx.lineWidth = Math.max(1, Math.round(visualScale));
    ctx.fillRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);
    ctx.strokeRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight);
    ctx.shadowBlur = 0;
    const stripeWidth = barWidth / 7;
    ctx.fillStyle = '#fff1cf';
    for (let stripe = -3; stripe <= 3; stripe += 2) {
      ctx.fillRect(stripe * stripeWidth - stripeWidth * .42, -barHeight / 2 + visualScale, stripeWidth * .84, barHeight - visualScale * 2);
    }
    ctx.fillStyle = '#5a381b';
    ctx.fillRect(-barWidth * .34, barHeight / 2, 3 * visualScale, 10 * visualScale);
    ctx.fillRect(barWidth * .34 - 3 * visualScale, barHeight / 2, 3 * visualScale, 10 * visualScale);
    ctx.restore();

    if (vertical) {
      drawRoadControlCone(ctx, point.x + 9 * visualScale, point.y - barWidth * .36, visualScale);
      drawRoadControlCone(ctx, point.x + 9 * visualScale, point.y + barWidth * .36, visualScale);
    } else {
      drawRoadControlCone(ctx, point.x - barWidth * .36, point.y + 10 * visualScale, visualScale);
      drawRoadControlCone(ctx, point.x + barWidth * .36, point.y + 10 * visualScale, visualScale);
    }

    const labelX = point.x + point.inwardX * 27 * visualScale;
    const labelY = point.y + point.inwardY * 25 * visualScale;
    const labelWidth = 50 * visualScale;
    const labelHeight = 15 * visualScale;
    ctx.save();
    ctx.fillStyle = 'rgba(33,29,24,.94)';
    ctx.strokeStyle = '#ffb14a';
    ctx.lineWidth = Math.max(1, visualScale);
    ctx.fillRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);
    ctx.strokeRect(labelX - labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight);
    ctx.fillStyle = '#fff4d6';
    ctx.font = '900 ' + Math.max(8, Math.round(8 * visualScale)) + 'px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('공사 중', labelX, labelY + visualScale * .5);
    ctx.restore();
  }

  function drawActiveRoadControl(ctx, canvas, control) {
    const point = roadControlScreenPoint(control, canvas);
    const visualScale = Math.max(.82, Math.min(1.35, Number(currentScale) || 1));
    const arrowX = point.x + point.inwardX * 11 * visualScale;
    const arrowY = point.y + point.inwardY * 11 * visualScale;
    const angle = Math.atan2(point.outwardY, point.outwardX);
    ctx.save();
    ctx.translate(Math.round(arrowX), Math.round(arrowY));
    ctx.rotate(angle);
    ctx.shadowColor = '#44d5ff';
    ctx.shadowBlur = 7 * visualScale;
    ctx.fillStyle = '#58d8ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, visualScale);
    ctx.beginPath();
    ctx.moveTo(10 * visualScale, 0);
    ctx.lineTo(-5 * visualScale, -7 * visualScale);
    ctx.lineTo(-2 * visualScale, 0);
    ctx.lineTo(-5 * visualScale, 7 * visualScale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const labelX = point.x + point.inwardX * 31 * visualScale;
    const labelY = point.y + point.inwardY * 27 * visualScale;
    const label = '지역 이동 · ' + (control.targetLabel || control.targetStageId || '다음 구역');
    ctx.save();
    ctx.font = '850 ' + Math.max(8, Math.round(8 * visualScale)) + 'px "Noto Sans KR", sans-serif';
    const width = Math.min(102 * visualScale, Math.max(50 * visualScale, ctx.measureText(label).width + 12 * visualScale));
    ctx.fillStyle = 'rgba(8,40,54,.90)';
    ctx.strokeStyle = '#62ddff';
    ctx.lineWidth = Math.max(1, visualScale);
    ctx.fillRect(labelX - width / 2, labelY - 8 * visualScale, width, 16 * visualScale);
    ctx.strokeRect(labelX - width / 2, labelY - 8 * visualScale, width, 16 * visualScale);
    ctx.fillStyle = '#d7f8ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, labelX, labelY + visualScale * .5, width - 8 * visualScale);
    ctx.restore();
  }

  function drawConceptRoadControls(ctx, canvas, stage) {
    if (!ctx || !canvas || !stage || !stage.__conceptMap || !Array.isArray(stage.__roadControls)) return;
    const controls = stage.__roadControls;
    for (let index = 0; index < controls.length; index += 1) {
      if (controls[index].active) drawActiveRoadControl(ctx, canvas, controls[index]);
      else drawBlockedRoadControl(ctx, canvas, controls[index]);
    }
  }

  window.BD_CONCEPT_ROAD_CONTROL_REGISTRY = CONCEPT_ROAD_CONTROLS;
  window.BD_getConceptRoadControls = function (stageId) {
    const stage = typeof STAGES !== 'undefined' ? STAGES[Number(stageId)] : null;
    return stage && Array.isArray(stage.__roadControls) ? stage.__roadControls.slice() : [];
  };
  window.BD_drawConceptRoadControls = drawConceptRoadControls;

  // 배경에 합쳐진 시설을 실제 게임 오브젝트로 다루기 위한 데이터 정의.
  // x/y는 플레이어가 F 상호작용을 하는 출입구 지점, bounds는 에디터에서 확인할 시설 외곽이다.
  const CONCEPT_FACILITIES = {
    201: [
      { id:'youth_lounge', label:'휴게 라운지', x:.130, y:.330, bounds:[.015,.015,.230,.285], category:'휴식', summary:'청소년이 쉬거나 친구를 기다리는 휴게 라운지야.', activity:'대화·휴식 이벤트를 연결할 수 있어.' },
      { id:'youth_pc_study', label:'PC·스터디룸', x:.378, y:.335, bounds:[.260,.015,.236,.290], category:'디지털·학습', summary:'PC 이용과 조용한 공부를 함께 할 수 있는 공간이야.', activity:'PC 체험·학습 미니게임 연결 지점이야.' },
      { id:'youth_info_lobby', label:'안내·로비', x:.547, y:.250, bounds:[.500,.015,.094,.215], category:'안내', summary:'문화의집 프로그램과 시설 이용을 안내하는 로비야.', activity:'시설 안내와 퀘스트 접수에 사용할 수 있어.' },
      { id:'youth_practice', label:'연습실', x:.687, y:.235, bounds:[.600,.015,.175,.195], category:'연습', summary:'동아리와 공연 준비를 위한 연습실이야.', activity:'리듬·동아리 활동을 연결할 수 있어.' },
      { id:'youth_meeting', label:'회의실', x:.885, y:.310, bounds:[.785,.015,.202,.270], category:'모임', summary:'청소년 운영회의와 소모임이 열리는 회의실이야.', activity:'회의·의뢰 퀘스트 연결 지점이야.' },
      { id:'youth_boardgame', label:'보드게임존', x:.125, y:.555, bounds:[.015,.310,.220,.225], category:'놀이', summary:'여러 보드게임을 함께 즐길 수 있는 공간이야.', activity:'보드게임 미니게임을 시작할 수 있어.' },
      { id:'youth_bookcafe', label:'북카페·테라스', x:.140, y:.535, bounds:[.015,.550,.250,.425], category:'독서·휴식', summary:'책을 읽으며 쉬는 북카페와 테라스야.', activity:'독서·휴식·대화 콘텐츠 연결 지점이야.' },
      { id:'youth_central_lounge', label:'중앙 북 라운지', x:.494, y:.745, bounds:[.355,.455,.278,.265], category:'독서·교류', summary:'문화의집 가운데에서 책과 이야기가 모이는 라운지야.', activity:'시설 중심 안내와 만남 이벤트에 사용할 수 있어.' },
      { id:'youth_video', label:'영상실', x:.430, y:.735, bounds:[.365,.742,.130,.240], category:'영상', summary:'영상 제작과 감상을 위한 작은 영상실이야.', activity:'영상 체험 미니게임 연결 지점이야.' },
      { id:'youth_dance', label:'댄스룸', x:.570, y:.735, bounds:[.505,.742,.135,.240], category:'댄스', summary:'거울과 음향 장비가 있는 댄스 연습 공간이야.', activity:'댄스·리듬 미니게임 연결 지점이야.' },
      { id:'youth_class_a', label:'강의실 A', x:.880, y:.530, bounds:[.778,.300,.208,.200], category:'학습', summary:'수업과 워크숍이 열리는 강의실이야.', activity:'강좌·체험 퀘스트를 연결할 수 있어.' },
      { id:'youth_class_b', label:'강의실 B', x:.880, y:.735, bounds:[.778,.515,.208,.190], category:'학습', summary:'소규모 체험 수업을 위한 강의실이야.', activity:'직업·문화 체험 콘텐츠 연결 지점이야.' },
      { id:'youth_music', label:'음악실', x:.880, y:.715, bounds:[.778,.720,.208,.255], category:'음악', summary:'악기 연주와 합주를 위한 음악실이야.', activity:'연주·노래 미니게임 연결 지점이야.' }
    ],
    202: [
      { id:'wawoo_library', label:'화성시립 봉담와우도서관', x:.150, y:.370, bounds:[.045,.050,.215,.290], category:'도서관', summary:'와우리 주민이 자유롭게 책과 디지털 자료를 이용하는 도서관이야.', activity:'도서 안내·독서 퀘스트 연결 지점이야.' },
      { id:'wawoo_youth_house', label:'봉담청소년문화의집', x:.365, y:.370, bounds:[.260,.050,.210,.290], category:'청소년문화', summary:'동아리실과 연습실을 갖춘 청소년 문화 거점이야.', activity:'청소년 활동·스탬프 콘텐츠 연결 지점이야.' },
      { id:'wawoo_culture_park', label:'와우리문화공원', x:.775, y:.430, bounds:[.600,.060,.350,.340], category:'공원', summary:'도서관 앞 광장과 어린이 물놀이 공간이 이어지는 공원이야.', activity:'휴식·안전 조사 콘텐츠 연결 지점이야.' },
      { id:'wawoo_safety_hub', label:'와우리 생활안전 거점', x:.185, y:.550, bounds:[.055,.570,.260,.300], category:'안전', summary:'생활 편의와 안전 도움을 받을 수 있는 지역 거점이야.', activity:'안전 안내·도움 요청 퀘스트 연결 지점이야.' },
      { id:'wawoo_bus_plaza', label:'와우리 버스광장', x:.785, y:.635, bounds:[.650,.655,.275,.180], category:'교통', summary:'버스정류장과 만남의 광장이 함께 있는 이동 거점이야.', activity:'지역 이동·교통안전 콘텐츠 연결 지점이야.' }
    ],
    203: [
      { id:'wawoo_bookcafe', label:'봉담커피앤북 작은도서관', x:.135, y:.360, bounds:[.012,.015,.245,.315], category:'독서·카페', summary:'작은도서관과 노노카페가 결합된 상리 지역 문화 거점이야.', activity:'독서·세대교류 콘텐츠 연결 지점이야.' },
      { id:'clear_spring_cafe', label:'카페 맑은샘', x:.430, y:.360, bounds:[.295,.015,.270,.315], category:'사회적카페', summary:'더불어숲 사회적협동조합이 운영하는 청소년 개방형 휴식 공간이야.', activity:'휴식·사회적경제 체험 연결 지점이야.' },
      { id:'cotton_candy_youth', label:"청소년 놀터 '솜사탕' 봉담점", x:.812, y:.360, bounds:[.655,.015,.315,.315], category:'청소년놀터', summary:'북카페와 게임·쿠킹·스터디 공간을 갖춘 청소년 놀터야.', activity:'청소년 자유이용·체험 콘텐츠 연결 지점이야.' },
      { id:'holic_boardgame', label:'더홀릭보드게임카페 봉담점', x:.150, y:.720, bounds:[.012,.405,.275,.280], category:'보드게임', summary:'여러 보드게임을 골라 함께 즐길 수 있는 체험 공간이야.', activity:'보드게임 미니게임 연결 지점이야.' },
      { id:'hope_cafe', label:'희망카페', x:.460, y:.720, bounds:[.335,.405,.250,.280], category:'사회적카페', summary:'지역 일자리와 편안한 휴식을 함께 만드는 카페야.', activity:'주민 대화·일자리 이야기 콘텐츠 연결 지점이야.' },
      { id:'wawoo_life_hub', label:'와우리 생활편의 거점', x:.795, y:.720, bounds:[.620,.405,.350,.280], category:'생활편의', summary:'약국과 생활 편의시설이 모여 있는 동네 거점이야.', activity:'생활안전 안내·심부름 퀘스트 연결 지점이야.' },
      { id:'wawoo_local_shops', label:'와우리 동네상점', x:.150, y:.745, bounds:[.012,.760,.285,.215], category:'상점', summary:'주민이 자주 찾는 작은 가게들이 모인 골목이야.', activity:'상점·주민 의뢰 콘텐츠 연결 지점이야.' },
      { id:'boardking_cafe', label:'보드킹 보드게임카페 봉담점', x:.480, y:.745, bounds:[.350,.760,.255,.215], category:'보드게임', summary:'보드게임을 배우고 팀으로 즐기는 체험 카페야.', activity:'협동 보드게임 콘텐츠 연결 지점이야.' },
      { id:'tongtoon_cafe', label:'통툰 화성봉담점', x:.810, y:.745, bounds:[.655,.760,.315,.215], category:'만화카페', summary:'만화와 휴식을 함께 즐기는 지역 문화 공간이야.', activity:'수집·독서 미니게임 연결 지점이야.' }
    ],
    204: [
      { id:'bongdam_library', label:'화성시립 봉담도서관', x:.235, y:.380, bounds:[.025,.030,.420,.315], category:'도서관', summary:'상리의 대표 공공 도서관이야.', activity:'자료 탐색·독서 퀘스트 연결 지점이야.' },
      { id:'bongdam_lake_park', label:'봉담호수공원', x:.787, y:.395, bounds:[.615,.065,.345,.300], category:'호수공원', summary:'호수 산책로와 계절 물놀이 공간이 있는 공원이야.', activity:'산책·생태 조사 콘텐츠 연결 지점이야.' },
      { id:'eoullim_park', label:'어울림공원', x:.230, y:.525, bounds:[.030,.540,.400,.420], category:'공원', summary:'주민과 청소년이 쉬고 산책하는 녹지 공원이야.', activity:'휴식·환경 정화 콘텐츠 연결 지점이야.' },
      { id:'bongdam2_eco_sports', label:'봉담2 생태체육공원', x:.790, y:.535, bounds:[.610,.550,.355,.385], category:'체육공원', summary:'운동장과 트랙·생활체육 시설이 모인 생태 체육공원이야.', activity:'체육·걷기 미니게임 연결 지점이야.' }
    ],
    205: [
      { id:'children_culture_center', label:'화성시 어린이문화센터', x:.225, y:.340, bounds:[.050,.020,.350,.290], category:'어린이체험', summary:'직업과 과학·예술을 체험하는 어린이 문화시설이야.', activity:'직업 체험·전시 퀘스트 연결 지점이야.' },
      { id:'national_sports_center', label:'화성국민체육센터', x:.795, y:.340, bounds:[.620,.020,.350,.290], category:'체육', summary:'수영장과 체육관을 갖춘 시민 생활체육 시설이야.', activity:'수영·체육 미니게임 연결 지점이야.' },
      { id:'eom_art_museum', label:'엄미술관', x:.080, y:.720, bounds:[.020,.395,.115,.290], category:'미술관', summary:'현대미술 전시와 예술교육을 운영하는 미술관이야.', activity:'작품 감상·예술 수집 콘텐츠 연결 지점이야.' },
      { id:'yeokmal_culture_hall', label:'역말문화회관', x:.205, y:.720, bounds:[.140,.395,.115,.290], category:'문화회관', summary:'지역 예술가 전시와 마을 축제가 열리는 문화회관이야.', activity:'축제·주민 공연 퀘스트 연결 지점이야.' },
      { id:'classe_art_hall', label:'클라쎄아트홀', x:.330, y:.720, bounds:[.270,.395,.120,.290], category:'공연장', summary:'음악 공연과 연극이 열리는 소규모 예술 공연장이야.', activity:'공연·리듬 콘텐츠 연결 지점이야.' },
      { id:'donghwa_fountain', label:'봉담1지구 분수광장', x:.502, y:.710, bounds:[.420,.440,.165,.235], category:'광장', summary:'주민이 만나고 쉬는 중심 분수광장이야.', activity:'만남·축제 이벤트 연결 지점이야.' },
      { id:'donghwa_eco_park', label:'동화마을 생태공원', x:.817, y:.760, bounds:[.665,.395,.305,.330], category:'생태공원', summary:'도심 속 생태 산책로와 휴식 공간이 있는 공원이야.', activity:'생태 관찰·산책 콘텐츠 연결 지점이야.' },
      { id:'donghwa_stream_west', label:'동화리 하천 산책로 서측', x:.200, y:.785, bounds:[.020,.800,.365,.175], category:'산책로', summary:'하천을 따라 이어지는 서쪽 녹지 산책로야.', activity:'걷기·환경 정화 콘텐츠 연결 지점이야.' },
      { id:'donghwa_stream_east', label:'동화리 하천 산책로 동측', x:.800, y:.785, bounds:[.625,.800,.345,.175], category:'산책로', summary:'공원과 문화거리를 잇는 동쪽 하천 산책로야.', activity:'걷기·안전 점검 콘텐츠 연결 지점이야.' }
    ],
    206: [
      { id:'hwaseong_citizen_campus', label:'화성시민캠퍼스', x:.227, y:.360, bounds:[.020,.015,.415,.310], category:'시민교육', summary:'시민 교육과 전시·야외활동이 열리는 공공 캠퍼스야.', activity:'시민 강좌·전시 퀘스트 연결 지점이야.' },
      { id:'green_environment_center', label:'화성그린환경센터', x:.765, y:.365, bounds:[.560,.015,.410,.315], category:'환경체험', summary:'환경 교육과 생태 체험을 운영하는 공공시설이야.', activity:'재활용·환경 체험 콘텐츠 연결 지점이야.' },
      { id:'suyeong_safety_hub', label:'수영리 생활안전 거점', x:.175, y:.680, bounds:[.025,.405,.300,.240], category:'생활안전', summary:'주민이 생활 안전 도움과 안내를 받을 수 있는 거점이야.', activity:'안전 상담·심부름 퀘스트 연결 지점이야.' },
      { id:'bongdam_police_box', label:'봉담파출소', x:.497, y:.695, bounds:[.405,.375,.185,.285], category:'치안', summary:'24시간 지역 치안을 지키는 봉담파출소야.', activity:'신고·안전 교육 콘텐츠 연결 지점이야.' },
      { id:'suyeong_life_center', label:'수영리 생활편의시설', x:.812, y:.680, bounds:[.655,.405,.315,.240], category:'생활편의', summary:'약국과 편의시설이 모여 있는 생활권 거점이야.', activity:'주민 의뢰·생활안전 콘텐츠 연결 지점이야.' },
      { id:'outdoor_safety_park', label:'야외 안전체험공원', x:.165, y:.715, bounds:[.020,.730,.290,.245], category:'안전체험', summary:'야외 활동 중 지켜야 할 안전수칙을 배우는 공원이야.', activity:'야외 안전 미니게임 연결 지점이야.' },
      { id:'bongdam_bus_turnaround', label:'봉담 버스 회차부', x:.510, y:.720, bounds:[.365,.735,.290,.240], category:'교통', summary:'봉담 외곽 노선이 쉬어 가는 버스 회차부야.', activity:'버스 이동·교통안전 콘텐츠 연결 지점이야.' },
      { id:'outer_experience_center', label:'외곽 안전체험시설', x:.840, y:.715, bounds:[.710,.730,.260,.245], category:'안전체험', summary:'외곽 지역의 생활·재난 안전을 체험하는 시설이야.', activity:'재난 대응·안전 훈련 콘텐츠 연결 지점이야.' }
    ]
  };

  // 수집·F 상호작용은 공공·문화·체육·치안 성격의 주요 건물만 허용한다.
  // 카페·상점·공원·광장 등은 에디터에서 독립 오브젝트로 유지하되 배경 랜드마크로만 사용한다.
  const MAJOR_FACILITY_IDS = new Set([
    'wawoo_library',
    'wawoo_youth_house',
    'cotton_candy_youth',
    'bongdam_library',
    'children_culture_center',
    'national_sports_center',
    'eom_art_museum',
    'yeokmal_culture_hall',
    'classe_art_hall',
    'hwaseong_citizen_campus',
    'green_environment_center',
    'bongdam_police_box'
  ]);

  function conceptFacilityObject(stageId, definition) {
    const hotspotWidth = 0.070;
    const hotspotHeight = 0.040;
    const collectible = MAJOR_FACILITY_IDS.has(definition.id);
    return {
      _editorId: 'concept_facility_' + definition.id,
      id: 'concept_facility_' + definition.id,
      type: 'building',
      key: 'BD_CONCEPT_HOTSPOT',
      label: definition.label,
      rx: Math.max(0, definition.x - hotspotWidth / 2),
      ry: Math.max(0, definition.y - hotspotHeight),
      rw: hotspotWidth,
      rh: hotspotHeight,
      // 투명 상호작용 마커는 기존 벽 콜라이더와 분리한다.
      cx: 2, cy: 2, cw: 0, ch: 0,
      interactable: collectible ? 'info' : null,
      infoLines: [definition.summary, definition.activity],
      conceptFacility: collectible,
      conceptLandmark: !collectible,
      collectible: collectible,
      facilityId: definition.id,
      facilityCategory: definition.category,
      facilitySummary: definition.summary,
      facilityActivity: definition.activity,
      facilityBounds: { rx:definition.bounds[0], ry:definition.bounds[1], rw:definition.bounds[2], rh:definition.bounds[3] },
      interactionX: definition.x,
      interactionY: definition.y,
      note: (collectible ? '주요 수집 시설' : '비상호작용 배경 랜드마크') + ' · ' + definition.category + ' · ID ' + definition.id,
      hidden: false,
      locked: false,
      stageId: Number(stageId)
    };
  }

  function ensureConceptFacilities(stageId, stage) {
    if (!stage) return;
    if (!Array.isArray(stage.objects)) stage.objects = [];
    const definitions = CONCEPT_FACILITIES[stageId] || [];
    const existingById = new Map(stage.objects.filter(function (object) { return object && object.facilityId; }).map(function (object) { return [object.facilityId, object]; }));
    definitions.forEach(function (definition) {
      const replacement = conceptFacilityObject(stageId, definition);
      const existing = existingById.get(definition.id);
      if (!existing) {
        stage.objects.push(replacement);
        return;
      }
      // (v28) 에디터에서 수정한 지오메트리는 보존 — 재등록 때 CONFIG 값으로 크기·위치·콜라이더가
      //  원복되던 문제. 메타데이터(라벨·시설 정보·활동 등)만 최신 정의로 갱신한다.
      var __geomKeys = ['rx','ry','rw','rh','cx','cy','cw','ch'];
      Object.keys(replacement).forEach(function (key) {
        if (__geomKeys.indexOf(key) >= 0 && existing[key] !== undefined) return;
        existing[key] = replacement[key];
      });
    });
    stage.facilityIds = definitions.filter(function (definition) { return MAJOR_FACILITY_IDS.has(definition.id); }).map(function (definition) { return definition.id; });
    stage.landmarkIds = definitions.map(function (definition) { return definition.id; });
    stage.__conceptMap = true;
    stage.__conceptMapVersion = 'v0.8';
  }

  const FACILITY_STORAGE_KEY = 'bd_concept_facility_visits_v1';
  const CONCEPT_EDITOR_LABELS = {
    201: '청소년문화의집',
    202: '와우리 문화권',
    203: '와우리 체험권',
    204: '상리 공원권',
    205: '동화리 문화권',
    206: '수영리 안전권'
  };

  function loadFacilityVisitState() {
    const fallback = { version: 1, visitedFacilityIds: [], visitCounts: {}, lastFacilityId: null };
    try {
      const parsed = JSON.parse(localStorage.getItem(FACILITY_STORAGE_KEY) || 'null');
      if (!parsed || typeof parsed !== 'object') return fallback;
      return {
        version: 1,
        visitedFacilityIds: Array.isArray(parsed.visitedFacilityIds) ? parsed.visitedFacilityIds.filter(function (id) { return typeof id === 'string'; }) : [],
        visitCounts: parsed.visitCounts && typeof parsed.visitCounts === 'object' ? parsed.visitCounts : {},
        lastFacilityId: typeof parsed.lastFacilityId === 'string' ? parsed.lastFacilityId : null
      };
    } catch (error) {
      return fallback;
    }
  }

  const facilityVisitState = loadFacilityVisitState();

  function saveFacilityVisitState() {
    try {
      localStorage.setItem(FACILITY_STORAGE_KEY, JSON.stringify(facilityVisitState));
      return true;
    } catch (error) {
      console.warn('[봉담지킴이] 시설 방문 기록 저장 실패', error);
      return false;
    }
  }

  function resolveConceptFacility(target) {
    if (target && target.conceptFacility) return target;
    if (typeof target !== 'string') return null;
    return window.BD_CONCEPT_FACILITY_REGISTRY && window.BD_CONCEPT_FACILITY_REGISTRY[target]
      ? window.BD_CONCEPT_FACILITY_REGISTRY[target]
      : null;
  }

  function getNearConceptFacility() {
    if (typeof currentStage === 'undefined' || NEW_STAGE_IDS.indexOf(Number(currentStage)) < 0) return null;
    const stage = typeof STAGES !== 'undefined' ? STAGES[currentStage] : null;
    if (!stage || !Array.isArray(stage.objects)) return null;
    let best = null;
    const maxDistance = 0.120;
    stage.objects.forEach(function (object) {
      if (!object || !object.conceptFacility || object.hidden || object.locked) return;
      const targetX = Number.isFinite(Number(object.interactionX)) ? Number(object.interactionX) : Number(object.rx) + Number(object.rw || 0) / 2;
      const targetY = Number.isFinite(Number(object.interactionY)) ? Number(object.interactionY) : Number(object.ry) + Number(object.rh || 0);
      const dx = Number(heroX) - targetX;
      const dy = Number(heroY) - targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= maxDistance && (!best || distance < best.distance)) best = { object: object, distance: distance };
    });
    return best ? best.object : null;
  }

  function interactConceptFacility(target) {
    const facility = resolveConceptFacility(target);
    if (!facility) return false;
    const facilityId = facility.facilityId;
    const firstVisit = facilityVisitState.visitedFacilityIds.indexOf(facilityId) < 0;
    if (firstVisit) facilityVisitState.visitedFacilityIds.push(facilityId);
    facilityVisitState.visitCounts[facilityId] = Number(facilityVisitState.visitCounts[facilityId] || 0) + 1;
    facilityVisitState.lastFacilityId = facilityId;
    saveFacilityVisitState();

    const stage = typeof STAGES !== 'undefined' ? STAGES[facility.stageId] : null;
    const stageFacilityIds = stage && Array.isArray(stage.facilityIds) ? stage.facilityIds : [];
    const stageVisited = stageFacilityIds.filter(function (id) { return facilityVisitState.visitedFacilityIds.indexOf(id) >= 0; }).length;
    const globalTotal = window.BD_CONCEPT_FACILITY_REGISTRY ? Object.keys(window.BD_CONCEPT_FACILITY_REGISTRY).length : 0;
    const lines = Array.isArray(facility.infoLines) ? facility.infoLines.slice() : [];
    lines.push(firstVisit ? '새 시설을 발견했어! 방문 기록에 등록했어.' : '이미 방문한 시설이야. 다시 둘러봤어.');
    lines.push('이 맵 방문 ' + stageVisited + '/' + stageFacilityIds.length + ' · 전체 ' + facilityVisitState.visitedFacilityIds.length + '/' + globalTotal);
    try {
      if (typeof showDialog === 'function') showDialog(facility.label || '시설 안내', lines);
      else if (window.BD_DAMI && typeof window.BD_DAMI.show === 'function') window.BD_DAMI.show(facility.label || '시설 안내', lines);
    } catch (error) {
      console.warn('[봉담지킴이] 시설 안내 표시 실패', error);
    }
    try {
      window.dispatchEvent(new CustomEvent('bd-concept-facility-interacted', {
        detail: {
          facilityId: facilityId,
          stageId: Number(facility.stageId),
          label: facility.label || '',
          category: facility.facilityCategory || '',
          firstVisit: firstVisit,
          visitCount: facilityVisitState.visitCounts[facilityId],
          activity: facility.facilityActivity || ''
        }
      }));
    } catch (error) {}
    updateEditorQuickStageButtons();
    return true;
  }

  function isFacilityInteractionBlocked(event) {
    const target = event && event.target;
    const tagName = target && target.tagName ? target.tagName.toLowerCase() : '';
    if (tagName === 'input' || tagName === 'select' || tagName === 'textarea' || (target && target.isContentEditable)) return true;
    try { if (typeof window.BD_isInputBlocked === 'function' && window.BD_isInputBlocked()) return true; } catch (error) {}
    const editorToggle = document.getElementById('bge-toggle');
    return !!(editorToggle && editorToggle.textContent && editorToggle.textContent.indexOf('ON') >= 0);
  }

  function installConceptFacilityInteraction() {
    if (window.__bdConceptFacilityInteractionInstalled) return;
    document.addEventListener('keydown', function (event) {
      if (!event || event.repeat || String(event.key || '').toLowerCase() !== 'f') return;
      if (typeof currentStage === 'undefined' || NEW_STAGE_IDS.indexOf(Number(currentStage)) < 0) return;
      if (isFacilityInteractionBlocked(event)) return;
      const facility = getNearConceptFacility();
      if (!facility) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      interactConceptFacility(facility);
    }, true);
    window.__bdConceptFacilityInteractionInstalled = true;
  }

  function installConceptSaveGuard() {
    if (window.__bdConceptSaveGuardInstalled) return;
    if (typeof window.autoSave !== 'function') {
      window.setTimeout(installConceptSaveGuard, 250);
      return;
    }
    const originalAutoSave = window.autoSave;
    const guardState = { installed: true, blockedCount: 0 };
    window.__bdConceptOriginalAutoSave = originalAutoSave;
    window.BD_CONCEPT_SAVE_GUARD = guardState;
    window.autoSave = function () {
      const stageId = typeof currentStage !== 'undefined' ? Number(currentStage) : NaN;
      if (NEW_STAGE_IDS.indexOf(stageId) >= 0) {
        guardState.blockedCount += 1;
        return false;
      }
      return originalAutoSave.apply(this, arguments);
    };
    window.__bdConceptSaveGuardInstalled = true;
  }

  function registerStageData() {
    if (typeof STAGES === 'undefined' || typeof LOADED_IMGS === 'undefined') {
      window.setTimeout(registerStageData, 250);
      return;
    }

    // 에디터에서 수정·저장한 신규 스테이지는 재등록 때 덮어쓰지 않고 보존한다.
    const preservedConceptStages = {};
    NEW_STAGE_IDS.forEach(function (stageId) {
      const existing = STAGES[stageId];
      if (existing && existing.__conceptMap) preservedConceptStages[stageId] = existing;
    });

    Object.keys(MAP_DATA).forEach(function (key) {
      const image = new Image();
      image.decoding = 'async';
      image.onload = function () { LOADED_IMGS[key] = image; };
      if (!MAP_DATA[key]) return;   /* (v381) 배경 제거(null) 가드 */
      image.src = MAP_DATA[key];
      LOADED_IMGS[key] = image;
    });
    if (!LOADED_IMGS.BD_CONCEPT_HOTSPOT) {
      const hotspotImage = new Image();
      hotspotImage.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      LOADED_IMGS.BD_CONCEPT_HOTSPOT = hotspotImage;
    }

    // 201: 신규 봉담청소년문화의집 3층 시안. 중앙 홀과 주요 방 사이의 벽·가구를 기준으로 충돌을 분리했다.
    STAGES[201] = {
      name: '[신규 시안] 봉담청소년문화의집 3층',
      __conceptMap: true,
      interior: true,
      floorTheme: 'culture',
      collision: true,
      bgKey: 'BD_CONCEPT_201', bgW: 1448, bgH: 1086,
      spawnX: 0.700, spawnY: 0.545,
      walk: { x0: 0.018, y0: 0.022, x1: 0.982, y1: 0.978 },
      exits: {
        top: { active: false }, bottom: { active: false },
        left: { active: false }, right: { active: false }
      },
      objects: []
    };

    // 202: 와우리 문화권. 중앙 교차로와 네 블록의 외곽 보행로를 중심 동선으로 사용한다.
    STAGES[202] = {
      name: '[신규 시안] 와우리 문화권',
      __conceptMap: true,
      collision: true,
      bgKey: 'BD_CONCEPT_202', bgW: 1448, bgH: 1086,
      spawnX: 0.515, spawnY: 0.835,
      walk: { x0: 0.018, y0: 0.018, x1: 0.982, y1: 0.982 },
      exits: {
        top: { active: false }, bottom: { active: false }, left: { active: false },
        right: { active: true, nextStage: 203, entryX: 0.055, entryY: 0.370, bandMin: 0.455, bandMax: 0.545 }
      },
      objects: []
    };

    // 203: 와우리 생활·청소년 체험권. 도로망은 전부 연결하고 각 건축 블록만 충돌 처리했다.
    STAGES[203] = {
      name: '[신규 시안] 와우리 생활·청소년 체험권',
      __conceptMap: true,
      collision: true,
      bgKey: 'BD_CONCEPT_203', bgW: 1448, bgH: 1086,
      spawnX: 0.630, spawnY: 0.875,
      walk: { x0: 0.018, y0: 0.018, x1: 0.982, y1: 0.982 },
      exits: {
        top: { active: true, nextStage: 204, entryX: 0.505, entryY: 0.945, bandMin: 0.61, bandMax: 0.65 },
        bottom: { active: true, nextStage: 206, entryX: 0.500, entryY: 0.055, bandMin: 0.61, bandMax: 0.65 },
        left: { active: true, nextStage: 202, entryX: 0.945, entryY: 0.500, bandMin: 0.335, bandMax: 0.405 },
        right: { active: true, nextStage: 205, entryX: 0.055, entryY: 0.380, bandMin: 0.335, bandMax: 0.405 }
      },
      objects: []
    };

    // 204: 상리 배움·휴식 녹지축. 도서관, 호수, 숲, 체육공원 사이의 십자 연결로가 주 동선이다.
    STAGES[204] = {
      name: '[신규 시안] 상리 배움·휴식 녹지축',
      __conceptMap: true,
      collision: true,
      bgKey: 'BD_CONCEPT_204', bgW: 1448, bgH: 1086,
      spawnX: 0.505, spawnY: 0.875,
      walk: { x0: 0.018, y0: 0.018, x1: 0.982, y1: 0.982 },
      exits: {
        bottom: { active: true, nextStage: 203, entryX: 0.630, entryY: 0.055, bandMin: 0.47, bandMax: 0.55 },
        top: { active: false }, left: { active: false }, right: { active: false }
      },
      objects: []
    };

    // 205: 동화리 문화·예술·체험거리. 중앙 광장과 가로축을 연결하고 건물·수경 공간을 막는다.
    STAGES[205] = {
      name: '[신규 시안] 동화리 문화·예술·체험거리',
      __conceptMap: true,
      collision: true,
      bgKey: 'BD_CONCEPT_205', bgW: 1448, bgH: 1086,
      spawnX: 0.505, spawnY: 0.870,
      walk: { x0: 0.018, y0: 0.018, x1: 0.982, y1: 0.982 },
      exits: {
        top: { active: false }, bottom: { active: false }, right: { active: false },
        left: { active: true, nextStage: 203, entryX: 0.945, entryY: 0.370, bandMin: 0.345, bandMax: 0.415 }
      },
      objects: []
    };

    // 206: 수영리·외곽 안전체험권. 공공시설과 버스 회차부 사이의 도로·광장을 이동 공간으로 둔다.
    STAGES[206] = {
      name: '[신규 시안] 수영리·외곽 안전체험권',
      __conceptMap: true,
      collision: true,
      bgKey: 'BD_CONCEPT_206', bgW: 1448, bgH: 1086,
      // 파출소 전면 동·서 화단 사이의 실제 보행 통로 중앙에서 시작한다.
      spawnX: 0.490, spawnY: 0.690,
      walk: { x0: 0.018, y0: 0.018, x1: 0.982, y1: 0.982 },
      exits: {
        top: { active: true, nextStage: 203, entryX: 0.630, entryY: 0.945, bandMin: 0.460, bandMax: 0.540 },
        bottom: { active: false }, left: { active: false }, right: { active: false }
      },
      objects: []
    };

    NEW_STAGE_IDS.forEach(function (stageId) {
      const defaultStage = STAGES[stageId];
      ensureConceptFacilities(stageId, defaultStage);
      ensureConceptPrecisionColliders(stageId, defaultStage);
      ensureConceptRoadControls(stageId, defaultStage);
      const preservedStage = preservedConceptStages[stageId];
      if (!preservedStage) return;
      preservedStage.exits = defaultStage.exits;
      ensureConceptFacilities(stageId, preservedStage);
      ensureConceptPrecisionColliders(stageId, preservedStage);
      ensureConceptRoadControls(stageId, preservedStage);
      preservedStage.bgKey = preservedStage.bgKey || defaultStage.bgKey;
      preservedStage.bgW = preservedStage.bgW || defaultStage.bgW;
      preservedStage.bgH = preservedStage.bgH || defaultStage.bgH;
      preservedStage.collision = preservedStage.collision !== false;
      if (!preservedStage.walk) preservedStage.walk = defaultStage.walk;
      STAGES[stageId] = preservedStage;
    });

    const facilityRegistry = {};
    const landmarkRegistry = {};
    NEW_STAGE_IDS.forEach(function (stageId) {
      const stage = STAGES[stageId];
      (stage && Array.isArray(stage.objects) ? stage.objects : []).forEach(function (object) {
        if (!object || !object.facilityId) return;
        landmarkRegistry[object.facilityId] = object;
        if (object.conceptFacility) facilityRegistry[object.facilityId] = object;
      });
    });
    window.BD_CONCEPT_FACILITY_REGISTRY = facilityRegistry;
    window.BD_CONCEPT_LANDMARK_REGISTRY = landmarkRegistry;
    /* (v368) 방문 기록 정리 필터 제거 — 이 등록부(구 컨셉 스테이지 201~204)에 없는 ID를 지우면
       신맵(210~213, v24 district) 시설 방문 기록이 «페이지를 다시 열 때마다» 통째로 사라졌다
       (실측: 이어하기 후 방문 33개 → 6개, 안전지도 % 폭락, 다음 리 개방 조건 재요구 — 유저 제보 «이어하기 후 그 지역만»의 원인).
       다른 시스템이 기록한 ID는 그대로 보존한다(무해). 자기 등록부 밖 ID는 이 런타임이 참조하지 않는다. */
    saveFacilityVisitState();

    window.BD_VIEW_SCALE = window.BD_VIEW_SCALE || {};
    window.BD_CHAR_STAGE_SCALE = window.BD_CHAR_STAGE_SCALE || {};
    window.BD_VIEW_SCALE[201] = 1.80;
    window.BD_VIEW_SCALE[202] = 2.10;
    window.BD_VIEW_SCALE[203] = 2.10;
    window.BD_VIEW_SCALE[204] = 2.10;
    window.BD_VIEW_SCALE[205] = 2.10;
    window.BD_VIEW_SCALE[206] = 2.10;
    window.BD_CHAR_STAGE_SCALE[201] = 1.22;

    window.BD_CONCEPT_STAGE_IDS = NEW_STAGE_IDS.slice();
    window.BD_CONCEPT_STAGE_VERSION = 'v0.8';
    window.BD_CONCEPT_COLLIDER_VERSION = PRECISION_COLLIDER_DATA.version;
    installConceptSaveGuard();
    updateConceptUi();
    autoLaunchIfRequested();
  }

  function setMapPickerOpen(open) {
    const panel = document.getElementById('bd-concept-map-panel');
    const button = document.getElementById('bd-concept-map-button');
    if (!panel || !button) return;
    panel.classList.toggle('open', !!open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    window.__bdConceptPanelOpen = !!open;
  }

  function jumpToStage(stageId) {
    const stage = typeof STAGES !== 'undefined' ? STAGES[stageId] : null;
    if (!stage) return;
    try {
      if (typeof moveKeys !== 'undefined') moveKeys = { w: false, a: false, s: false, d: false };
      if (typeof isDashing !== 'undefined') isDashing = false;
      if (typeof shopOpen !== 'undefined' && shopOpen && typeof closeShop === 'function') closeShop();

      currentStage = Number(stageId);
      heroX = stage.spawnX;
      heroY = stage.spawnY;
      camX = heroX;
      camY = heroY;
      transitioning = false;
      if (typeof _spawnMobsForStage === 'function') _spawnMobsForStage(currentStage);
      const location = document.getElementById('gs-loc');
      if (location) location.textContent = stage.name;
      setMapPickerOpen(false);
      updateConceptUi();
      window.__bdExitLockUntil = Date.now() + 900;
    } catch (error) {
      console.error('[봉담지킴이] 맵 시안 이동 실패', error);
    }
  }

  function selectConceptStageInEditor(stageId) {
    const numericStageId = Number(stageId);
    if (NEW_STAGE_IDS.indexOf(numericStageId) < 0 || typeof STAGES === 'undefined' || !STAGES[numericStageId]) return false;
    const select = document.getElementById('bge-stage-select');
    if (select) {
      if (!Array.from(select.options).some(function (option) { return Number(option.value) === numericStageId; })) {
        const option = document.createElement('option');
        option.value = String(numericStageId);
        option.textContent = numericStageId + ' · ' + STAGES[numericStageId].name;
        select.appendChild(option);
      }
      select.value = String(numericStageId);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (typeof currentStage === 'undefined' || Number(currentStage) !== numericStageId) jumpToStage(numericStageId);
    updateEditorQuickStageButtons();
    return true;
  }

  function updateEditorQuickStageButtons() {
    const bar = document.getElementById('bd-concept-editor-stagebar');
    if (!bar) return;
    bar.querySelectorAll('.bd-concept-editor-button').forEach(function (button) {
      button.classList.toggle('active', Number(button.dataset.stage) === Number(currentStage));
    });
    const status = bar.querySelector('.bd-concept-editor-status');
    if (!status) return;
    const stage = typeof STAGES !== 'undefined' ? STAGES[currentStage] : null;
    const facilityIds = stage && Array.isArray(stage.facilityIds) ? stage.facilityIds : [];
    const visited = facilityIds.filter(function (id) { return facilityVisitState.visitedFacilityIds.indexOf(id) >= 0; }).length;
    status.textContent = NEW_STAGE_IDS.indexOf(Number(currentStage)) >= 0
      ? '주요시설 ' + facilityIds.length + '개 · 방문 ' + visited + '개'
      : '버튼으로 신규 맵 바로 이동';
  }

  function syncEditorQuickStageButtons() {
    const select = document.getElementById('bge-stage-select');
    if (!select || typeof STAGES === 'undefined') return;
    if (document.getElementById('bd-concept-editor-stagebar')) {
      updateEditorQuickStageButtons();
      return;
    }
    const bar = document.createElement('section');
    bar.id = 'bd-concept-editor-stagebar';
    bar.setAttribute('aria-label', '신규 기획 맵 바로가기');

    const title = document.createElement('div');
    title.className = 'bd-concept-editor-title';
    const titleText = document.createElement('span');
    titleText.textContent = '🗺 신규 기획 맵 바로가기';
    const status = document.createElement('span');
    status.className = 'bd-concept-editor-status';
    title.appendChild(titleText);
    title.appendChild(status);
    bar.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'bd-concept-editor-grid';
    NEW_STAGE_IDS.forEach(function (stageId) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bd-concept-editor-button';
      button.dataset.stage = String(stageId);
      button.textContent = stageId + ' ' + CONCEPT_EDITOR_LABELS[stageId];
      button.title = STAGES[stageId] ? STAGES[stageId].name + ' 편집 화면으로 이동' : '신규 맵으로 이동';
      button.addEventListener('click', function () { selectConceptStageInEditor(stageId); });
      grid.appendChild(button);
    });
    bar.appendChild(grid);
    select.parentNode.insertBefore(bar, select.nextSibling);
    updateEditorQuickStageButtons();
  }

  function openConceptStageInEditor(stageId) {
    const toggle = document.getElementById('bge-toggle');
    if (toggle && toggle.textContent && toggle.textContent.indexOf('ON') < 0) toggle.click();
    window.setTimeout(function () { selectConceptStageInEditor(stageId); }, 60);
    return true;
  }

  function focusConceptFacility(facilityId) {
    const facility = resolveConceptFacility(facilityId);
    if (!facility) return false;
    if (typeof currentStage === 'undefined' || Number(currentStage) !== Number(facility.stageId)) jumpToStage(facility.stageId);
    try {
      heroX = Number(facility.interactionX);
      heroY = Math.min(0.970, Number(facility.interactionY) + 0.035);
      camX = heroX;
      camY = heroY;
      if (typeof moveKeys !== 'undefined') moveKeys = { w: false, a: false, s: false, d: false };
      window.__bdExitLockUntil = Date.now() + 900;
      return true;
    } catch (error) {
      return false;
    }
  }

  function updateConceptUi() {
    const badge = document.getElementById('bd-concept-map-badge');
    const isConcept = typeof currentStage !== 'undefined' && NEW_STAGE_IDS.indexOf(Number(currentStage)) >= 0;
    if (badge) {
      badge.classList.toggle('show', isConcept);
      badge.textContent = isConcept && STAGES[currentStage] ? STAGES[currentStage].name : '';
    }
    document.querySelectorAll('.bd-concept-stage-button').forEach(function (button) {
      const stageId = Number(button.dataset.stage);
      button.classList.toggle('active', stageId === Number(currentStage));
      if (typeof STAGES !== 'undefined' && STAGES[stageId]) {
        button.textContent = stageId + ' · ' + STAGES[stageId].name.replace('[신규 시안] ', '').replace('[4개 리 월드] ', '');
      }
    });
    syncEditorQuickStageButtons();
  }

  function makeStageButton(stageId) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bd-concept-stage-button';
    button.dataset.stage = String(stageId);
    const stage = STAGES[stageId];
    button.textContent = stageId + ' · ' + (stage ? stage.name.replace('[신규 시안] ', '').replace('[4개 리 월드] ', '') : '로딩 중');
    button.addEventListener('click', function () { jumpToStage(stageId); });
    return button;
  }

  function createMapPicker() {
    const host = document.getElementById('game-screen');
    if (!host || document.getElementById('bd-concept-map-button')) return;

    const button = document.createElement('button');
    button.id = 'bd-concept-map-button';
    button.type = 'button';
    button.textContent = '🗺 맵 시안';
    button.setAttribute('aria-controls', 'bd-concept-map-panel');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      const panel = document.getElementById('bd-concept-map-panel');
      setMapPickerOpen(!panel.classList.contains('open'));
    });

    const panel = document.createElement('section');
    panel.id = 'bd-concept-map-panel';
    panel.setAttribute('aria-label', '게임 맵 선택');
    panel.innerHTML = '<h3>봉담지킴이 맵 선택</h3>'
      + '<p>기존 맵은 보존되어 있습니다. 신규 시안 201–206은 검수용 별도 스테이지입니다.</p>';

    const originalTitle = document.createElement('div');
    originalTitle.className = 'bd-concept-section-title';
    originalTitle.textContent = '기존 게임 맵';
    panel.appendChild(originalTitle);
    const originalGrid = document.createElement('div');
    originalGrid.className = 'bd-concept-grid';
    ORIGINAL_STAGE_IDS.forEach(function (stageId) { originalGrid.appendChild(makeStageButton(stageId)); });
    panel.appendChild(originalGrid);

    const conceptTitle = document.createElement('div');
    conceptTitle.className = 'bd-concept-section-title';
    conceptTitle.textContent = '신규 기획 시안 맵';
    panel.appendChild(conceptTitle);
    const conceptGrid = document.createElement('div');
    conceptGrid.className = 'bd-concept-grid';
    NEW_STAGE_IDS.forEach(function (stageId) { conceptGrid.appendChild(makeStageButton(stageId)); });
    panel.appendChild(conceptGrid);

    const badge = document.createElement('div');
    badge.id = 'bd-concept-map-badge';

    host.appendChild(button);
    host.appendChild(panel);
    host.appendChild(badge);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'F8') {
        event.preventDefault();
        setMapPickerOpen(!panel.classList.contains('open'));
      }
      if (event.key === 'Escape' && panel.classList.contains('open')) {
        setMapPickerOpen(false);
      }
    });
  }

  function autoLaunchIfRequested() {
    let params;
    try { params = new URLSearchParams(window.location.search); } catch (error) { return; }
    if (params.get('bdColliderDebug') === '1') window.BD_CONCEPT_COLLIDER_DEBUG = true;
    if (params.get('bdColliderLabels') === '1') window.BD_CONCEPT_COLLIDER_LABELS = true;
    const requestedStage = Number(params.get('bdAutoStage'));
    const requestedFacility = params.get('bdAutoFacility');
    if (NEW_STAGE_IDS.indexOf(requestedStage) < 0) return;

    const imageKey = STAGES[requestedStage] && STAGES[requestedStage].bgKey;
    const image = imageKey ? LOADED_IMGS[imageKey] : null;
    if (!image || !image.complete || !image.naturalWidth) {
      window.setTimeout(autoLaunchIfRequested, 120);
      return;
    }

    try {
      if (params.get('bdScreenshot') === '1') {
        document.body.classList.add('bd-concept-screenshot');
      }
      const boot = document.getElementById('bd-boot');
      if (boot) boot.style.display = 'none';
      if (typeof window.BD_hideTitle === 'function') window.BD_hideTitle();
      const title = document.getElementById('bd-title-screen');
      if (title) title.classList.remove('show');
      if (typeof enterGameScreen === 'function') enterGameScreen('검수용 지킴이', true);
      else if (typeof window.enterGameScreen === 'function') window.enterGameScreen('검수용 지킴이', true);
      jumpToStage(requestedStage);
      if (requestedFacility) focusConceptFacility(requestedFacility);

      let settleCount = 0;
      const settleTimer = window.setInterval(function () {
        settleCount += 1;
        try {
          const bootAgain = document.getElementById('bd-boot');
          if (bootAgain) bootAgain.style.display = 'none';
          if (typeof window.BD_hideTitle === 'function') window.BD_hideTitle();
          const titleAgain = document.getElementById('bd-title-screen');
          if (titleAgain) titleAgain.classList.remove('show');
          const gameScreen = document.getElementById('game-screen');
          if (gameScreen) gameScreen.style.display = 'block';
          if (Number(currentStage) !== requestedStage) jumpToStage(requestedStage);
          if (requestedFacility) focusConceptFacility(requestedFacility);
        } catch (error) {}
        if (settleCount >= 16) window.clearInterval(settleTimer);
      }, 250);

      window.setTimeout(function () {
        jumpToStage(requestedStage);
        if (requestedFacility) focusConceptFacility(requestedFacility);
        try { if (typeof gameLoop === 'function') gameLoop(); } catch (error) {}
        window.__BD_CONCEPT_READY = true;
        document.documentElement.dataset.bdConceptReady = String(requestedStage);
      }, 1000);
    } catch (error) {
      console.error('[봉담지킴이] 자동 검수 모드 진입 실패', error);
    }
  }

  window.BD_jumpToStage = jumpToStage;
  window.BD_openConceptMapPicker = function () { setMapPickerOpen(true); };
  window.BD_applyConceptPixelPerfectScale = applyConceptPixelPerfectScale;
  window.BD_snapConceptPixelCamera = snapConceptPixelCamera;
  window.BD_CONCEPT_FACILITY_STATE = facilityVisitState;
  window.BD_getNearConceptFacility = getNearConceptFacility;
  window.BD_interactConceptFacility = interactConceptFacility;
  window.BD_focusConceptFacility = focusConceptFacility;
  window.BD_openConceptStageInEditor = openConceptStageInEditor;

  createMapPicker();
  installQuestNavigationHud();
  installConceptFacilityInteraction();
  installConceptSaveGuard();
  registerStageData();
  // 기존 에디터가 DOMContentLoaded 시 구운 맵 데이터로 STAGES를 재적용하므로,
  // 그 로더가 끝난 뒤 신규 시안 스테이지를 다시 합쳐 기존 맵과 함께 유지한다.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerStageData, { once: true });
  }
  window.setTimeout(registerStageData, 1200);
  window.setTimeout(registerStageData, 3600);
  window.setInterval(updateConceptUi, 500);
})();
