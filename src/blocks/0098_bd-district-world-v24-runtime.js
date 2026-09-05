
(function () {
  'use strict';

  const VERSION = 'v2.4';
  const CONFIG = window.__BD_DISTRICT_WORLD_V24_CONFIG;
  const MAP_SOURCES = window.__BD_DISTRICT_WORLD_V24_MAPS || {};
  const EDITABLE_ASSETS = window.__BD_DISTRICT_WORLD_V24_ASSETS || {};

  if (!CONFIG || !Array.isArray(CONFIG.stages)) {
    console.error('[봉담 4개 리 월드] 설정 데이터가 없습니다.');
    return;
  }

  const STAGE_IDS = CONFIG.stages.map(function (stage) { return Number(stage.id); });
  const STAGE_BY_ID = {};
  CONFIG.stages.forEach(function (stage) { STAGE_BY_ID[Number(stage.id)] = stage; });
  const DISTRICT_ORDER = ['수영리', '동화리', '와우리', '상리'];
  const SHARED_OPTIONS = {
    wawoo_complex: [
      {
        id: 'wawoo_library',
        label: '화성시립 봉담와우도서관 (1·2층)',
        category: '공공 도서관',
        summary: '와우리 215 복합건물의 1·2층 도서관입니다.',
        activity: '열람실과 디지털자료실, 도서관 프로그램을 이용합니다.'
      },
      {
        id: 'wawoo_youth_house',
        label: '화성시 봉담청소년문화의집 (3층)',
        category: '청소년 문화시설',
        summary: '같은 복합건물 3층에 있는 청소년문화의집입니다.',
        activity: '동아리실·연습실·청소년 휴게공간을 이용합니다.'
      }
    ],
    citizen_campus: [
      {
        id: 'citizen_campus_main',
        label: '화성시민캠퍼스',
        category: '공공 교육·문화시설',
        summary: '동화리 11-13의 시민 학습·전시 거점입니다.',
        activity: '야외공원·운동장·전시공간을 이용합니다.'
      },
      {
        id: 'living_culture_workshop',
        label: '화성시 생활문화창작소',
        category: '공공 생활문화시설',
        summary: '시민캠퍼스와 같은 부지에서 운영되는 생활문화창작소입니다.',
        activity: '생활문화 제작·창작 프로그램을 이용합니다.'
      },
      {
        id: 'citizen_campus_book_cafe',
        label: '화성시민캠퍼스 북카페',
        category: '공공 북카페',
        summary: '화성시민캠퍼스 안의 자유이용 북카페입니다.',
        activity: '독서와 휴식을 즐깁니다.'
      }
    ],
    bongdam_library: [
      {
        id: 'bongdam_library_main',
        label: '화성시립 봉담도서관',
        category: '공공 도서관',
        summary: '샘마을1길 8-4의 봉담 메인 도서관입니다.',
        activity: '어린이자료실·종합자료실·열람실을 이용합니다.'
      },
      {
        id: 'hope_cafe',
        label: '희망카페 (봉담도서관점)',
        category: '사회적 카페',
        summary: '봉담도서관 안에서 시니어클럽이 운영하는 카페입니다.',
        activity: '도서관 이용 중 음료와 휴식을 즐깁니다.'
      }
    ]
  };

  const facilityRegistry = {};
  const landmarkRegistry = {};
  const siteRegistry = {};
  const decorationRegistry = {};
  let initialized = false;
  let rendererInstalled = false;
  let gateTransitioning = false;
  let activeModalLandmark = null;
  let linkedMovementEnabled = true;
  let linkedSelectionState = null;
  let linkedMovementDirty = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function normalizeBounds(bounds) {
    return Array.isArray(bounds) && bounds.length === 4
      ? bounds.map(function (value) { return Number(value) || 0; })
      : [0, 0, 0, 0];
  }

  function isDistrictStage(stageId) {
    return STAGE_IDS.indexOf(Number(stageId)) >= 0;
  }

  function stageConfig(stageId) {
    return STAGE_BY_ID[Number(stageId)] || null;
  }

  function stageData(stageId) {
    try { return typeof STAGES !== 'undefined' ? STAGES[Number(stageId)] : null; }
    catch (error) { return null; }
  }

  function makeSite(item) {
    const bounds = normalizeBounds(item.bounds);
    return {
      _editorId: 'bdv24_site_' + item.site_for,
      id: 'bdv24_site_' + item.site_for,
      // 기존 렌더러는 decoration 그룹을 building 뒤에 다시 그린다. 부지는 충돌값 없는
      // building 레이어로 두어 같은 배열 안에서 항상 실제 건물보다 먼저 렌더링한다.
      type: 'building',
      key: 'asset:' + item.asset_id,
      assetId: item.asset_id,
      kidAssetId: item.asset_id,
      customImage: true,
      label: item.label,
      facilityId: item.site_for,
      stageId: Number(item.stage_id),
      rx: bounds[0],
      ry: bounds[1],
      rw: bounds[2],
      rh: bounds[3],
      interactable: '',
      siteGroupId: item.site_group_id,
      siteFor: item.site_for,
      siteStyle: item.style || 'civic',
      facilityDistrict: item.district || '',
      actualDistrict: item.actual_district || item.district || '',
      editableSiteObject: true,
      districtWorldSiteLayer: true,
      districtWorldObject: true,
      passable: true,
      visible: true,
      hidden: false,
      locked: false,
      note: '독립 편집 부지 · 건물과 이동 연결 가능'
    };
  }

  function makeLandmark(item) {
    const bounds = normalizeBounds(item.bounds);
    const collider = Array.isArray(item.collider_bounds) ? item.collider_bounds.map(Number) : null;
    const interaction = Array.isArray(item.interaction)
      ? item.interaction.map(Number)
      : [bounds[0] + bounds[2] / 2, bounds[1] + bounds[3] * 1.06];
    const labelPoint = Array.isArray(item.label_point) ? item.label_point.map(Number) : interaction;
    const object = {
      _editorId: 'bdv24_facility_' + item.id,
      id: 'bdv24_facility_' + item.id,
      type: item.asset_kind === 'park' ? 'decoration' : 'building',
      key: 'asset:' + item.asset_id,
      assetId: item.asset_id,
      kidAssetId: item.asset_id,
      customImage: true,
      label: item.label,
      facilityId: item.id,
      stageId: Number(item.stage_id),
      rx: bounds[0],
      ry: bounds[1],
      rw: bounds[2],
      rh: bounds[3],
      facilityBounds: { rx: bounds[0], ry: bounds[1], rw: bounds[2], rh: bounds[3] },
      interactionX: interaction[0],
      interactionY: interaction[1],
      labelX: labelPoint[0],
      labelY: labelPoint[1],
      interactionAnchorX: bounds[2] ? (interaction[0] - bounds[0]) / bounds[2] : 0.5,
      interactionAnchorY: bounds[3] ? (interaction[1] - bounds[1]) / bounds[3] : 1.06,
      labelAnchorX: bounds[2] ? (labelPoint[0] - bounds[0]) / bounds[2] : 0.5,
      labelAnchorY: bounds[3] ? (labelPoint[1] - bounds[1]) / bounds[3] : -0.06,
      interactable: '',
      facilityCategory: item.category || '시설',
      facilityDistrict: item.district || '',
      actualDistrict: item.actual_district || item.district || '',
      facilityAddress: item.address || '',
      facilityModule: item.module || '',
      facilityLot: item.lot || '',
      assetKind: item.asset_kind || 'building',
      facilitySummary: item.summary || '',
      facilityActivity: item.activity || '',
      infoLines: [item.address || '', item.summary || '', item.activity || ''].filter(Boolean),
      conceptFacility: false,
      conceptLandmark: true,
      collectible: false,
      majorFacility: !!item.major,
      visualOnly: !!item.visual_only,
      sharedEntryGroup: item.shared_group || null,
      interiorOptions: Array.isArray(item.interior_options) ? item.interior_options.slice() : [],
      siteGroupId: item.site_group_id,
      districtWorldLandmark: true,
      editableFacilityObject: true,
      visible: true,
      hidden: false,
      locked: false,
      _colliderFollowsResize: true,
      aspectLocked: false,   // (v31) 픽셀 배율 스냅 제거 — 자유 편집
      nativePixelWidth: Array.isArray(item.native_pixel_size) ? Number(item.native_pixel_size[0]) : 0,
      nativePixelHeight: Array.isArray(item.native_pixel_size) ? Number(item.native_pixel_size[1]) : 0,
      nativeAspect: Number(item.native_aspect) || (bounds[3] ? bounds[2] / bounds[3] : 1),
      pixelScale: Number(item.integer_scale) || 1,
      allowedPixelScales: Array.isArray(item.allowed_pixel_scales) ? item.allowed_pixel_scales.slice() : [0.5, 1, 2, 3],
      note: (item.major ? '주요 상호작용 시설' : '우리 동네 풍경') + ' · ' + (item.address || '')
    };
    if (collider) {
      object.cx = collider[0];
      object.cy = collider[1];
      object.cw = collider[2];
      object.ch = collider[3];
      object.precisionCollider = true;
      object.collisionKind = item.asset_kind === 'apartment' ? 'apartment' : 'building';
      object.colliderAnchorX = bounds[2] ? (collider[0] - bounds[0]) / bounds[2] : 0;
      object.colliderAnchorY = bounds[3] ? (collider[1] - bounds[1]) / bounds[3] : 0;
      object.colliderAnchorW = bounds[2] ? collider[2] / bounds[2] : 1;
      object.colliderAnchorH = bounds[3] ? collider[3] / bounds[3] : 1;
    }
    return object;
  }


  function makeDecoration(item) {
    const bounds = normalizeBounds(item.bounds);
    const collider = Array.isArray(item.collider_bounds) ? item.collider_bounds.map(Number) : null;
    const object = {
      _editorId: 'bdv24_decor_' + item.id,
      id: 'bdv24_decor_' + item.id,
      type: 'decoration',
      key: 'asset:' + item.asset_id,
      assetId: item.asset_id,
      kidAssetId: item.asset_id,
      customImage: true,
      label: item.label,
      decorationId: item.id,
      decorationFor: item.decoration_for,
      stageId: Number(item.stage_id),
      rx: bounds[0],
      ry: bounds[1],
      rw: bounds[2],
      rh: bounds[3],
      interactable: '',
      facilityDistrict: item.district || '',
      facilityModule: item.module || '',
      assetKind: 'building_decoration',
      editableBuildingDecoration: true,
      districtWorldDecoration: true,
      fixedPixelSize: true,
      followsBuildingTranslation: true,
      followsBuildingResize: false,
      passable: item.passable !== false,
      visible: true,
      hidden: false,
      locked: false,
      aspectLocked: false,   // (v31) 자유 편집
      nativePixelWidth: Array.isArray(item.native_pixel_size) ? Number(item.native_pixel_size[0]) : 0,
      nativePixelHeight: Array.isArray(item.native_pixel_size) ? Number(item.native_pixel_size[1]) : 0,
      nativeAspect: bounds[3] ? bounds[2] / bounds[3] : 1,
      pixelScale: 1,
      allowedPixelScales: [1],
      note: '건물 전용 고정 픽셀 장식 · 바닥 타일 없음 · 개별 편집 가능'
    };
    if (collider) {
      object.cx = collider[0];
      object.cy = collider[1];
      object.cw = collider[2];
      object.ch = collider[3];
      object.precisionCollider = true;
      object.collisionKind = 'building-decoration';
    }
    return object;
  }

  function makeBoundary(stageId, definition, index) {
    const bounds = normalizeBounds(definition.bounds);
    const siteRelativeBounds = definition.site_relative_bounds
      ? normalizeBounds(definition.site_relative_bounds)
      : null;
    return {
      _editorId: 'bdv24_boundary_' + stageId + '_' + (definition.id || index),
      id: 'bdv24_boundary_' + stageId + '_' + (definition.id || index),
      type: 'wall',
      label: definition.label || definition.id || '비통행 경계',
      rx: bounds[0],
      ry: bounds[1],
      rw: bounds[2],
      rh: bounds[3],
      stageId: Number(stageId),
      siteGroupId: definition.site_group_id || null,
      siteFor: definition.site_for || null,
      siteRelativeBounds: siteRelativeBounds,
      linkedToSite: !!definition.linked_to_site,
      editableSiteBoundaryCollider: !!definition.linked_to_site,
      precisionCollider: true,
      collisionKind: definition.kind || 'boundary',
      colliderVersion: VERSION,
      districtWorldBoundary: true,
      boundaryCollider: true,
      hidden: false,
      locked: false
    };
  }

  function syncLandmarkAnchors(object) {
    if (!object) return object;
    const x = Number(object.rx) || 0;
    const y = Number(object.ry) || 0;
    const width = Number(object.rw) || 0;
    const height = Number(object.rh) || 0;
    object.facilityBounds = { rx: x, ry: y, rw: width, rh: height };
    object.interactionX = x + width * Number(object.interactionAnchorX == null ? 0.5 : object.interactionAnchorX);
    object.interactionY = y + height * Number(object.interactionAnchorY == null ? 1.06 : object.interactionAnchorY);
    object.labelX = x + width * Number(object.labelAnchorX == null ? 0.5 : object.labelAnchorX);
    object.labelY = y + height * Number(object.labelAnchorY == null ? -0.06 : object.labelAnchorY);
    if (object._colliderFollowsResize && object.colliderAnchorX != null) {
      /* (v147) 이 동기화는 900ms마다(rebuildRegistries) «앵커 비율 × 본체 사각형»으로
         콜라이더를 다시 쓴다. 그래서 에디터에서 콜라이더를 옮기거나 크기를 바꿔도
         1초 안에 원위치로 되돌아갔다 — «콜라이더가 안 움직인다»의 진짜 원인.
         → 에디터가 열려 있을 때 콜라이더가 앵커 예상값과 다르면
           «사용자가 손으로 만진 것»이므로, 콜라이더를 진실로 삼아 앵커를 역산한다.
           (본체를 옮기거나 리사이즈하면 에디터가 콜라이더도 함께 옮기므로
            비율이 유지돼 이 분기에 걸리지 않는다 — 기존 «따라가기»는 그대로 동작) */
      const _ecx = x + width * Number(object.colliderAnchorX);
      const _ecy = y + height * Number(object.colliderAnchorY);
      const _ecw = width * Number(object.colliderAnchorW);
      const _ech = height * Number(object.colliderAnchorH);
      let _editing = false;
      try { _editing = !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled); } catch (e) {}
      const _touched = object.cx !== undefined &&
        (Math.abs(Number(object.cx) - _ecx) > 0.0004 || Math.abs(Number(object.cy) - _ecy) > 0.0004 ||
         Math.abs(Number(object.cw) - _ecw) > 0.0004 || Math.abs(Number(object.ch) - _ech) > 0.0004);
      if (_editing && _touched && width > 0 && height > 0) {
        object.colliderAnchorX = (Number(object.cx) - x) / width;
        object.colliderAnchorY = (Number(object.cy) - y) / height;
        object.colliderAnchorW = Number(object.cw) / width;
        object.colliderAnchorH = Number(object.ch) / height;
        object.userColliderV147 = 1;   // 자동교정(투명벽 복구)이 건드리지 않게 표시
      } else {
        object.cx = _ecx;
        object.cy = _ecy;
        object.cw = _ecw;
        object.ch = _ech;
      }
    }
    return object;
  }

  function registerVirtualFacility(landmark, option) {
    const virtual = Object.assign({}, landmark, {
      _editorId: 'bdv24_virtual_' + option.id,
      id: 'bdv24_virtual_' + option.id,
      facilityId: option.id,
      label: option.label,
      facilityCategory: option.category,
      facilitySummary: option.summary,
      facilityActivity: option.activity,
      infoLines: [landmark.facilityAddress, option.summary, option.activity].filter(Boolean),
      conceptFacility: true,
      conceptLandmark: false,
      collectible: true,
      majorFacility: true,
      virtualSharedEntry: true,
      sourceLandmarkId: landmark.facilityId,
      sharedEntryGroup: landmark.sharedEntryGroup
    });
    facilityRegistry[option.id] = virtual;
    return virtual;
  }

  function rebuildRegistries() {
    Object.keys(facilityRegistry).forEach(function (key) { delete facilityRegistry[key]; });
    Object.keys(landmarkRegistry).forEach(function (key) { delete landmarkRegistry[key]; });
    Object.keys(siteRegistry).forEach(function (key) { delete siteRegistry[key]; });
    Object.keys(decorationRegistry).forEach(function (key) { delete decorationRegistry[key]; });

    STAGE_IDS.forEach(function (stageId) {
      const stage = stageData(stageId);
      if (!stage || !Array.isArray(stage.objects)) return;
      const landmarks = stage.objects.filter(function (object) { return object && object.editableFacilityObject; });
      const sites = stage.objects.filter(function (object) { return object && object.editableSiteObject; });
      const decorations = stage.objects.filter(function (object) { return object && object.editableBuildingDecoration; });
      stage.__v24Landmarks = landmarks;
      stage.__v24Sites = sites;
      stage.__v24Decorations = decorations;
      stage.landmarkIds = [];
      stage.facilityIds = [];
      landmarks.forEach(function (landmark) {
        syncLandmarkAnchors(landmark);
        landmarkRegistry[landmark.facilityId] = landmark;
        stage.landmarkIds.push(landmark.facilityId);
        if (!landmark.majorFacility) return;
        if (landmark.sharedEntryGroup && SHARED_OPTIONS[landmark.sharedEntryGroup]) {
          SHARED_OPTIONS[landmark.sharedEntryGroup].forEach(function (option) {
            registerVirtualFacility(landmark, option);
            stage.facilityIds.push(option.id);
          });
        } else {
          landmark.conceptFacility = true;
          // (v281) 보조 시설(minorFacility)은 상호작용은 되지만 수집·스탬프 대상은 아니다 —
          //  collectible을 끄고 stage.facilityIds(수집률 분모)에도 넣지 않는다.
          landmark.collectible = !landmark.minorFacility;
          facilityRegistry[landmark.facilityId] = landmark;
          if (!landmark.minorFacility) stage.facilityIds.push(landmark.facilityId);
        }
      });
      sites.forEach(function (site) {
        siteRegistry[site.siteFor || site.facilityId] = site;
      });
      decorations.forEach(function (decoration) {
        decorationRegistry[decoration.decorationId] = decoration;
      });
    });
  }

  function makeStage(config) {
    const siteObjects = (config.sites || []).map(makeSite);
    const landmarkObjects = (config.landmarks || []).map(makeLandmark);
    const decorationObjects = (config.buildingDecorations || []).map(makeDecoration);
    const boundaryObjects = (config.colliders || []).map(function (definition, index) {
      return makeBoundary(config.id, definition, index);
    });
    const precisionObjects = landmarkObjects.concat(decorationObjects).filter(function (object) {
      return object && object.cx !== undefined && object.cy !== undefined;
    }).concat(boundaryObjects);
    return {
      name: config.name,
      __conceptMap: true,
      __conceptMapVersion: VERSION,
      __districtWorldV24: true,
      __editableDistrictWorldV24: true,
      collision: true,
      bgKey: config.bgKey,
      bgW: Number(config.canvas[0]),
      bgH: Number(config.canvas[1]),
      spawnX: Number(config.spawn[0]),
      spawnY: Number(config.spawn[1]),
      walk: { x0: 0.004, y0: 0.004, x1: 0.996, y1: 0.996 },
      exits: {},
      objects: siteObjects.concat(landmarkObjects, decorationObjects, boundaryObjects),
      __precisionColliders: precisionObjects,
      precisionColliderCount: precisionObjects.length,
      precisionColliderSourceCount: precisionObjects.length,
      precisionColliderVersion: VERSION,
      district: config.district,
      districtStageId: Number(config.id),
      districtGates: (config.gates || []).map(function (gate) { return Object.assign({}, gate); }),
      moduleGrid: Array.isArray(config.moduleGrid) ? config.moduleGrid.slice() : [],
      moduleLayout: Array.isArray(config.moduleLayout) ? config.moduleLayout.map(function (row) { return row.slice(); }) : [],
      facilityIds: [],
      landmarkIds: landmarkObjects.map(function (item) { return item.facilityId; }),
      __v24Landmarks: landmarkObjects,
      __v24Sites: siteObjects,
      __v24Decorations: decorationObjects
    };
  }

  function applyStages(force) {
    STAGE_IDS.forEach(function (stageId) {
      const config = stageConfig(stageId);
      if (!config) return;
      const existing = stageData(stageId);
      if (force || !existing || !existing.__districtWorldV24 || !Array.isArray(existing.objects)) {
        STAGES[stageId] = makeStage(config);
      } else {
        existing.name = config.name;
        existing.bgKey = config.bgKey;
        existing.bgW = Number(config.canvas[0]);
        existing.bgH = Number(config.canvas[1]);
        existing.__conceptMap = true;
        existing.__conceptMapVersion = VERSION;
        existing.__districtWorldV24 = true;
        existing.__editableDistrictWorldV24 = true;
        existing.district = config.district;
        existing.districtGates = (config.gates || []).map(function (gate) { return Object.assign({}, gate); });
        existing.exits = {};
        const precisionObjects = existing.objects.filter(function (object) {
          return object && (((object.editableFacilityObject || object.editableBuildingDecoration) && object.cx !== undefined) || object.districtWorldBoundary);
        });
        existing.__precisionColliders = precisionObjects;
        existing.precisionColliderCount = precisionObjects.length;
        existing.precisionColliderSourceCount = precisionObjects.length;
        existing.precisionColliderVersion = VERSION;
      }
      window.BD_VIEW_SCALE = window.BD_VIEW_SCALE || {};
      window.BD_CHAR_STAGE_SCALE = window.BD_CHAR_STAGE_SCALE || {};
      window.BD_VIEW_SCALE[stageId] = 1.0;
      window.BD_CHAR_STAGE_SCALE[stageId] = 1.0;
    });
    rebuildRegistries();
    mergeRegistries();
  }

  function mergeRegistries() {
    window.BD_CONCEPT_FACILITY_REGISTRY = window.BD_CONCEPT_FACILITY_REGISTRY || {};
    window.BD_CONCEPT_LANDMARK_REGISTRY = window.BD_CONCEPT_LANDMARK_REGISTRY || {};
    Object.keys(facilityRegistry).forEach(function (key) {
      window.BD_CONCEPT_FACILITY_REGISTRY[key] = facilityRegistry[key];
    });
    Object.keys(landmarkRegistry).forEach(function (key) {
      window.BD_CONCEPT_LANDMARK_REGISTRY[key] = landmarkRegistry[key];
    });
    const ids = Array.isArray(window.BD_CONCEPT_STAGE_IDS) ? window.BD_CONCEPT_STAGE_IDS.slice() : [];
    STAGE_IDS.forEach(function (stageId) { if (ids.indexOf(stageId) < 0) ids.push(stageId); });
    window.BD_CONCEPT_STAGE_IDS = ids;
    window.BD_DISTRICT_WORLD_V24_FACILITY_REGISTRY = facilityRegistry;
    window.BD_DISTRICT_WORLD_V24_LANDMARK_REGISTRY = landmarkRegistry;
    window.BD_DISTRICT_WORLD_V24_SITE_REGISTRY = siteRegistry;
    window.BD_DISTRICT_WORLD_V24_DECORATION_REGISTRY = decorationRegistry;
  }

  function installImages() {
    Object.keys(MAP_SOURCES).forEach(function (key) {
      const image = new Image();
      image.decoding = 'async';
      image.src = MAP_SOURCES[key];
      LOADED_IMGS[key] = image;
    });
  }

  function installEditableAssets() {
    window.BD_BUILTIN_ASSETS = window.BD_BUILTIN_ASSETS || {};
    Object.keys(EDITABLE_ASSETS).forEach(function (assetId) {
      window.BD_BUILTIN_ASSETS[assetId] = EDITABLE_ASSETS[assetId];
    });
    window.BD_DISTRICT_WORLD_V24_ASSET_LIBRARY = EDITABLE_ASSETS;

    if (typeof window.BD_getAssetImage !== 'function' || window.BD_getAssetImage.__bdDistrictV24Wrapped) return;
    const previous = window.BD_getAssetImage;
    const cache = {};
    const wrapped = function (assetId) {
      const definition = EDITABLE_ASSETS[String(assetId || '')];
      if (definition && definition.dataUrl) {
        if (!cache[assetId]) {
          const image = new Image();
          image.decoding = 'async';
          image.src = definition.dataUrl;
          cache[assetId] = image;
        }
        return cache[assetId];
      }
      return previous.apply(this, arguments);
    };
    wrapped.__bdDistrictV24Wrapped = true;
    wrapped.__bdDistrictV24Previous = previous;
    window.BD_getAssetImage = wrapped;
  }

  function installPixelIntegrity() {
    const prototype = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
    if (prototype && typeof prototype.drawImage === 'function' && !prototype.drawImage.__bdDistrictV24Wrapped) {
      const previousDrawImage = prototype.drawImage;
      const wrappedDrawImage = function () {
        let callArguments = arguments;
        try {
          if (typeof currentStage !== 'undefined' && isDistrictStage(currentStage)) {
            this.imageSmoothingEnabled = false;
            // 배경·부지·건물·캐릭터의 목적 사각형을 모두 정수 격자에 놓습니다.
            // 9인자 호출의 소스 크롭 값은 유지하고 목적 좌표(5~8)만 반올림합니다.
            const values = Array.prototype.slice.call(arguments);
            const firstDestination = values.length === 9 ? 5 : 1;
            const lastDestination = values.length === 3 ? 2 : (values.length === 5 ? 4 : (values.length === 9 ? 8 : -1));
            if (lastDestination >= firstDestination) {
              for (let index = firstDestination; index <= lastDestination; index += 1) {
                if (Number.isFinite(Number(values[index]))) values[index] = Math.round(Number(values[index]));
              }
              callArguments = values;
            }
          }
        } catch (error) {}
        return previousDrawImage.apply(this, callArguments);
      };
      wrappedDrawImage.__bdDistrictV24Wrapped = true;
      wrappedDrawImage.__bdDistrictV24Previous = previousDrawImage;
      prototype.drawImage = wrappedDrawImage;
    }
    try {
      if (typeof renderMap === 'function' && !renderMap.__bdDistrictV24Wrapped) {
        const previousRenderMap = renderMap;
        const wrappedRenderMap = function (canvas) {
          const context = canvas && canvas.getContext ? canvas.getContext('2d') : null;
          if (context && isDistrictStage(typeof currentStage !== 'undefined' ? currentStage : -1)) {
            context.imageSmoothingEnabled = false;
          }
          try {
            return previousRenderMap.apply(this, arguments);
          } finally {
            if (context && isDistrictStage(typeof currentStage !== 'undefined' ? currentStage : -1)) {
              context.imageSmoothingEnabled = false;
            }
          }
        };
        wrappedRenderMap.__bdDistrictV24Wrapped = true;
        wrappedRenderMap.__bdDistrictV24Previous = previousRenderMap;
        renderMap = wrappedRenderMap;
      }
    } catch (error) {}
    const canvas = document.getElementById('game-canvas');
    const context = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    if (context) context.imageSmoothingEnabled = false;
  }

  const HERO_SOURCE_HEIGHT = 150;
  const HERO_SOURCE_WIDTH = { 1: 74, 2: 64 };
  // (v281e) 버킷 세분화 — 스테이지별 NPC 키 맞춤(0.040~0.076)이 가능하도록 중간 단계 추가.
  //  (기존 75→100→150은 간격이 33~50%라 목표 크기에서 크게 어긋났다)
  const HERO_TARGET_HEIGHTS = [50, 60, 75, 90, 100, 120, 150, 175, 200, 250, 300];

  function applyDistrictHeroPixelBucket(canvas) {
    if (!isDistrictStage(typeof currentStage !== 'undefined' ? currentStage : -1)) return false;
    let scale = 1;
    let baseHeight = 105.6;
    try {
      scale = Math.max(0.01, Number(currentScale) || 1);
      baseHeight = Math.max(1, Number(HERO_BASE_H) || 105.6);
    } catch (error) {}
    const priorSpriteScale = Math.max(0.01, Number(window.BD_SPR) || 1);
    const requestedHeight = baseHeight * scale * priorSpriteScale;
    const rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    const cssHeight = rect && rect.height > 0 ? rect.height : (canvas ? canvas.height : 800);
    const canvasToCssRatio = rect && rect.height > 0 && canvas
      ? Math.max(0.5, Number(canvas.height) / Number(rect.height))
      : Math.max(1, Number(window.devicePixelRatio) || 1);
    // (v281d) 화면 고정(96 CSS px) → '맵 스케일 비례'로 변경 —
    //  기존에는 창 크기·브라우저 줌으로 맵이 커지고 작아져도 캐릭터만 항상 96px로 고정돼
    //  캐릭터가 맵/카메라 배율과 안 맞는 문제가 있었다. 이제 캐릭터 키를 맵 높이 비율로
    //  정의해, 맵의 world→screen 배율을 그대로 따라간다.
    // (v281e) 스테이지별 보정 — 실배치된 주민 NPC 키(rh, 에디터 박스 실측)에 맞춤:
    //   210 수영리: 어른(은지 어머니 0.0425 · 약사 0.049) → 학생인 주인공은 약간 작게 0.044
    //   211 동화리: 하늘 0.0593 · 재현 0.0616 → 0.056
    //   212 와우리: 학생(은지 0.0323 · 세아 0.0415) → 또래 눈높이 0.040
    //   213 상리:   학생(서연 0.0759 · 재이 0.0766), 어른(도현 0.093) → 또래 0.076
    //  조정: window.BD_DISTRICT_HERO_WORLD_BY_STAGE = {212:0.045,...} (스테이지별)
    //        window.BD_DISTRICT_HERO_WORLD_H = 0.07 (전 스테이지 강제)
    const HERO_WORLD_BY_STAGE = { 210: 0.044, 211: 0.056, 212: 0.040, 213: 0.076 };
    const __ovrByStage = window.BD_DISTRICT_HERO_WORLD_BY_STAGE || {};
    const HERO_WORLD_H = Number(window.BD_DISTRICT_HERO_WORLD_H)
      || Number(__ovrByStage[Number(currentStage)])
      || HERO_WORLD_BY_STAGE[Number(currentStage)]
      || 0.062;
    const viewportH = (typeof VIEWPORT_H !== 'undefined' && VIEWPORT_H > 0) ? VIEWPORT_H : 0.4545;
    const mapPxPerWorldH = (600 * scale) / viewportH;   // BASE_H × currentScale / VIEWPORT_H
    let desiredPhysicalHeight = HERO_WORLD_H * mapPxPerWorldH;
    if (!Number.isFinite(desiredPhysicalHeight) || desiredPhysicalHeight <= 0) {
      desiredPhysicalHeight = 96 * canvasToCssRatio;   // 폴백: 기존 화면 고정 방식
    }
    const cssTargetHeight = desiredPhysicalHeight / Math.max(0.5, canvasToCssRatio);
    let targetHeight = HERO_TARGET_HEIGHTS[0];
    let distance = Math.abs(desiredPhysicalHeight - targetHeight);
    HERO_TARGET_HEIGHTS.forEach(function (candidate) {
      const candidateDistance = Math.abs(desiredPhysicalHeight - candidate);
      if (candidateDistance < distance) {
        targetHeight = candidate;
        distance = candidateDistance;
      }
    });
    window.BD_SPR = targetHeight / (baseHeight * scale);
    let character = 1;
    try { character = Number(selectedCharacter) === 2 ? 2 : 1; }
    catch (error) {}
    const sourceWidth = HERO_SOURCE_WIDTH[character];
    const targetWidth = Math.round(targetHeight * sourceWidth / HERO_SOURCE_HEIGHT);
    const state = {
      stageId: Number(currentStage),
      sourceSize: [sourceWidth, HERO_SOURCE_HEIGHT],
      requestedHeight: Number(requestedHeight.toFixed(3)),
      cssTargetHeight: Number(cssTargetHeight.toFixed(3)),
      desiredPhysicalHeight: Number(desiredPhysicalHeight.toFixed(3)),
      canvasToCssRatio: Number(canvasToCssRatio.toFixed(4)),
      targetSize: [targetWidth, targetHeight],
      scaleRatio: Number((targetHeight / HERO_SOURCE_HEIGHT).toFixed(6)),
      destinationInteger: true,
      smoothing: false,
      canvasSize: canvas ? [Number(canvas.width), Number(canvas.height)] : null,
      canvasCssSize: rect ? [Number(rect.width.toFixed(2)), Number(rect.height.toFixed(2))] : null
    };
    window.BD_DISTRICT_WORLD_V24_PIXEL_AUDIT = state;
    document.documentElement.dataset.bdDistrictHeroTarget = targetWidth + 'x' + targetHeight;
    document.documentElement.dataset.bdDistrictHeroScale = String(state.scaleRatio);
    return true;
  }

  function installConceptPixelScaleHook() {
    const previous = typeof window.BD_applyConceptPixelPerfectScale === 'function'
      ? window.BD_applyConceptPixelPerfectScale
      : function () { return false; };
    if (previous.__bdDistrictV24Wrapped) return;
    const wrapped = function (canvas, stage) {
      const result = previous.apply(this, arguments);
      try {
        if (stage && stage.__districtWorldV24) applyDistrictHeroPixelBucket(canvas);
      } catch (error) {}
      return result;
    };
    wrapped.__bdDistrictV24Wrapped = true;
    wrapped.__bdDistrictV24Previous = previous;
    window.BD_applyConceptPixelPerfectScale = wrapped;
  }

  function installSiteLayerOrder() {
    const prototype = Array.prototype;
    if (typeof prototype.sort !== 'function' || prototype.sort.__bdDistrictV24Wrapped) return;
    const previousSort = prototype.sort;
    const wrappedSort = function (compareFunction) {
      let isDistrictDrawList = false;
      try {
        isDistrictDrawList = isDistrictStage(typeof currentStage !== 'undefined' ? currentStage : -1)
          && this.some(function (item) { return item && item.districtWorldSiteLayer; })
          && this.some(function (item) { return item && item._hero; });
      } catch (error) {}
      if (!isDistrictDrawList || typeof compareFunction !== 'function') {
        return previousSort.call(this, compareFunction);
      }
      return previousSort.call(this, function (left, right) {
        const leftIsSite = !!(left && left.districtWorldSiteLayer);
        const rightIsSite = !!(right && right.districtWorldSiteLayer);
        if (leftIsSite !== rightIsSite) return leftIsSite ? -1 : 1;
        return compareFunction(left, right);
      });
    };
    wrappedSort.__bdDistrictV24Wrapped = true;
    wrappedSort.__bdDistrictV24Previous = previousSort;
    prototype.sort = wrappedSort;
  }

  function installErrorAudit() {
    if (window.__bdDistrictV24ErrorAuditInstalled) return;
    window.BD_DISTRICT_WORLD_V24_ERRORS = [];
    function record(kind, message) {
      window.BD_DISTRICT_WORLD_V24_ERRORS.push({
        kind: kind,
        message: String(message || 'unknown'),
        at: Date.now()
      });
      document.documentElement.dataset.bdDistrictWorldErrorCount = String(window.BD_DISTRICT_WORLD_V24_ERRORS.length);
    }
    window.addEventListener('error', function (event) {
      record('error', event && (event.message || event.error));
    });
    window.addEventListener('unhandledrejection', function (event) {
      record('unhandledrejection', event && event.reason);
    });
    document.documentElement.dataset.bdDistrictWorldErrorCount = '0';
    window.__bdDistrictV24ErrorAuditInstalled = true;
  }

  function facilityState() {
    const state = window.BD_CONCEPT_FACILITY_STATE || {
      version: 1,
      visitedFacilityIds: [],
      visitCounts: {},
      lastFacilityId: null
    };
    if (!Array.isArray(state.visitedFacilityIds)) state.visitedFacilityIds = [];
    if (!state.visitCounts || typeof state.visitCounts !== 'object') state.visitCounts = {};
    window.BD_CONCEPT_FACILITY_STATE = state;
    return state;
  }

  function persistVisit(facility) {
    const state = facilityState();
    const firstVisit = state.visitedFacilityIds.indexOf(facility.facilityId) < 0;
    if (firstVisit) state.visitedFacilityIds.push(facility.facilityId);
    state.visitCounts[facility.facilityId] = Number(state.visitCounts[facility.facilityId] || 0) + 1;
    state.lastFacilityId = facility.facilityId;
    try { localStorage.setItem('bd_concept_facility_visits_v1', JSON.stringify(state)); }
    catch (error) {}
    try {
      window.dispatchEvent(new CustomEvent('bd-concept-facility-interacted', {
        detail: {
          facilityId: facility.facilityId,
          stageId: Number(facility.stageId),
          label: facility.label,
          category: facility.facilityCategory,
          firstVisit: firstVisit,
          count: state.visitCounts[facility.facilityId]
        }
      }));
    } catch (error) {}
    return firstVisit;
  }

  function createModal() {
    if (document.getElementById('bd-district-facility-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'bd-district-facility-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    document.body.appendChild(modal);
  }

  function closeModal() {
    const modal = document.getElementById('bd-district-facility-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.innerHTML = '';
    activeModalLandmark = null;
  }

  function buildModalShell(landmark, title, description) {
    createModal();
    activeModalLandmark = landmark;
    const modal = document.getElementById('bd-district-facility-modal');
    modal.innerHTML = '';
    const card = document.createElement('section');
    card.className = 'bd-district-card';
    const head = document.createElement('div');
    head.className = 'bd-district-head';
    const kicker = document.createElement('div');
    kicker.className = 'bd-district-kicker';
    kicker.textContent = (landmark.facilityDistrict || '봉담읍') + ' · ' + (landmark.facilityCategory || '시설');
    const heading = document.createElement('h2');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = description || landmark.facilitySummary || '시설 정보를 확인합니다.';
    const address = document.createElement('div');
    address.className = 'bd-district-address';
    address.textContent = landmark.facilityAddress || '';
    head.appendChild(kicker);
    head.appendChild(heading);
    head.appendChild(paragraph);
    head.appendChild(address);
    card.appendChild(head);
    const options = document.createElement('div');
    options.className = 'bd-district-options';
    card.appendChild(options);
    modal.appendChild(card);
    modal.classList.add('open');
    return options;
  }

  function appendClose(options) {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'bd-district-close';
    close.textContent = '닫기 (Esc)';
    close.addEventListener('click', closeModal);
    options.appendChild(close);
  }

  function openSharedEntry(landmark) {
    try { persistVisit(facilityRegistry[landmark.facilityId] || landmark); } catch (ePv) { }
    const entries = SHARED_OPTIONS[landmark.sharedEntryGroup] || [];
    const options = buildModalShell(
      landmark,
      landmark.label,
      '같은 외관과 공용 현관을 사용하는 복합건물입니다. 이용할 시설을 선택하세요.'
    );
    entries.forEach(function (entry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.label + ' · ' + entry.activity;
      button.addEventListener('click', function () {
        const facility = facilityRegistry[entry.id];
        if (facility) persistVisit(facility);
        closeModal();
        updateHud();
      });
      options.appendChild(button);
    });
    /* (v310) 복합 입구에도 휴식 / (v332) 대형 문화·공공시설만 — canRest 게이트 */
    if (!window.BD_canRestAt || BD_canRestAt(landmark)) {
      const rest2 = document.createElement('button');
      rest2.type = 'button';
      rest2.textContent = '\uD83D\uDC97 잠시 쉬어 가기 (체력 회복)';
      rest2.addEventListener('click', function () {
        closeModal();
        if (window.BD_minorRest) BD_minorRest(landmark);
      });
      options.appendChild(rest2);
    }
    appendClose(options);
    window.setTimeout(function () {
      const first = options.querySelector('button');
      if (first) first.focus();
    }, 0);
  }

  function openFacility(landmark) {
    try { persistVisit(facilityRegistry[landmark.facilityId] || landmark); } catch (ePv2) { }
    const facility = facilityRegistry[landmark.facilityId] || landmark;
    const options = buildModalShell(
      landmark,
      landmark.label,
      landmark.facilitySummary || landmark.facilityActivity
    );
    // (v281) 보조 시설(minorFacility): 위험요소 조사처럼 선택 버튼을 띄운다 —
    //  💗 휴식하기 / (약국·마트·문구는) 🏪 상점 / 📖 시설 설명. 방문 스탬프는 남기지 않는다.
    if (landmark.minorFacility) {
      const act = (window.BD_MINOR_FACILITY_ACTION || {})[landmark.facilityId] || 'rest';
      let firstBtn = null;
      if (act === 'fit') {
        // (v281b) 공원: 회복 대신 운동 — 공원마다 다른 활동, 첫 1회 영구 스탯
        const fit = (window.BD_MINOR_FIT || {})[landmark.facilityId];
        const done = !!(window.BD && BD._fitDone && BD._fitDone[landmark.facilityId]);
        const ex = document.createElement('button');
        ex.type = 'button';
        const reward = fit ? (fit.stat === 'hp' ? '최대 HP +' + fit.amt : '공격력 +' + fit.amt) : '';
        ex.textContent = (fit ? fit.btn : '🏃 운동하기')
          + (done ? ' · 단련 완료' : (reward ? ' (' + reward + ')' : ''));
        ex.addEventListener('click', function () {
          closeModal();
          if (window.BD_minorFit) window.BD_minorFit(landmark);
        });
        options.appendChild(ex);
        firstBtn = ex;
      } else if (!window.BD_canRestAt || BD_canRestAt(landmark)) {
        /* (v332) 편의점·약국·상점 등 소규모 시설의 휴식 제거 — 대형 문화·공공시설만 */
        const rest = document.createElement('button');
        rest.type = 'button';
        rest.textContent = '💗 잠시 쉬어 가기 (체력 회복)';
        rest.addEventListener('click', function () {
          closeModal();
          if (window.BD_minorRest) window.BD_minorRest(landmark);
        });
        options.appendChild(rest);
        firstBtn = rest;
      }
      if (act === 'shop') {
        const buy = document.createElement('button');
        buy.type = 'button';
        buy.textContent = '🏪 물건 구경하기 (상점)';
        buy.addEventListener('click', function () {
          closeModal();
          try { if (window.BD_openShop) window.BD_openShop(); } catch (e) { }
        });
        options.appendChild(buy);
      }
      const info = document.createElement('button');
      info.type = 'button';
      info.textContent = '📖 시설 설명 보기';
      info.addEventListener('click', function () {
        // 모달 본문을 설명 카드로 교체 — 카테고리·소개·이용 안내를 한 화면에
        const opts2 = buildModalShell(landmark, landmark.label, null);
        const card = document.createElement('div');
        card.style.cssText = 'text-align:left;font-size:13.5px;line-height:1.65;color:#dbe9f7;'
          + 'background:rgba(255,255,255,.05);border:1px solid rgba(150,190,255,.25);'
          + 'border-radius:10px;padding:12px 14px;margin:2px 0 10px;';
        card.innerHTML =
          '<div style="color:#9ec9ff;font-weight:800;font-size:12px;margin-bottom:6px;">'
          + (landmark.facilityDistrict || '봉담읍') + ' · ' + (landmark.facilityCategory || '시설') + '</div>'
          + '<div style="margin-bottom:8px;">' + (landmark.facilitySummary || '우리 동네의 소중한 생활 공간이에요.') + '</div>'
          + '<div style="color:#ffe9a8;">🙌 이런 걸 할 수 있어요</div>'
          + '<div>' + (landmark.facilityActivity || '자유롭게 둘러보며 쉬어 갈 수 있어요.') + '</div>'
          + (landmark.facilityAddress ? '<div style="margin-top:8px;color:#9fb3d1;font-size:12px;">📍 ' + landmark.facilityAddress + '</div>' : '');
        opts2.appendChild(card);
        const back = document.createElement('button');
        back.type = 'button';
        back.textContent = '← 뒤로';
        back.addEventListener('click', function () { openFacility(landmark); });
        opts2.appendChild(back);
        appendClose(opts2);
      });
      options.appendChild(info);
      appendClose(options);
      window.setTimeout(function () { if (firstBtn) firstBtn.focus(); }, 0);
      return;
    }
    const visit = document.createElement('button');
    visit.type = 'button';
    visit.textContent = '시설 이용 정보 확인 · ' + (landmark.facilityActivity || '방문 기록');
    visit.addEventListener('click', function () {
      persistVisit(facility);
      closeModal();
      updateHud();
    });
    options.appendChild(visit);
    /* (v368) 일반 대형 시설에도 휴식 — 회복 안내(v78)는 BD_canRestAt(라벨: 문화회관·도서관 등) 기준으로 이 시설을 «쉴 곳»으로
       가리키는데, 이 경로의 모달에는 휴식 버튼이 없어 «F를 눌러도 쉴 수 없는» 모순이 있었다(역말문화회관 완주 런 루프). */
    if (window.BD_canRestAt && BD_canRestAt(landmark)) {
      const rest3 = document.createElement('button');
      rest3.type = 'button';
      rest3.textContent = '💗 잠시 쉬어 가기 (체력 회복)';
      rest3.addEventListener('click', function () {
        closeModal();
        if (window.BD_minorRest) BD_minorRest(landmark);
      });
      options.appendChild(rest3);
    }
    appendClose(options);
    window.setTimeout(function () { visit.focus(); }, 0);
  }

  function nearestInteractiveFacility() {
    const stage = stageData(typeof currentStage !== 'undefined' ? currentStage : -1);
    if (!stage || !stage.__districtWorldV24 || !Array.isArray(stage.__v24Landmarks)) return null;
    let best = null;
    /* (v311) 방문 완료 시설은 뒤로 미룬다 — 방문한 약국 위에 서 있어도 옆의 미방문 시설이 이긴다 */
    let __seen = [];
    try { __seen = facilityState().visitedFacilityIds || []; } catch (eS) { }
    stage.__v24Landmarks.forEach(function (landmark) {
      if (!landmark || !landmark.majorFacility || landmark.hidden) return;
      syncLandmarkAnchors(landmark);
      /* (v295) 점 거리 → 사각형 가장자리 거리: 건물이 커도 앞에 서면 F가 통한다 */
      const bw = Number(stage.bgW || 1448), bh = Number(stage.bgH || 1086);
      const px = Number(heroX) * bw, py = Number(heroY) * bh;
      const rl = Number(landmark.rx || 0) * bw, rt = Number(landmark.ry || 0) * bh;
      const rr = rl + Number(landmark.rw || 0) * bw, rb = rt + Number(landmark.rh || 0) * bh;
      const dx = Math.max(rl - px, 0, px - rr);
      const dy = Math.max(rt - py, 0, py - rb);
      let distance = Math.sqrt(dx * dx + dy * dy);
      /* (v308) 지정 상호작용 지점 거리도 인정 — 부지 전체가 충돌체인 시설(놀이숲)은
         사각형이 담장 안이라 옆 시설에 항상 밀렸다 */
      /* (v323) 시설별 상호작용 반경 — 에디터에서 지정 가능 (기본 110px) */
      const lim = Number(landmark.interactionRadius) > 0 ? Number(landmark.interactionRadius) : 110;
      let nearDesigned = false;   /* (v368) 지정 상호작용 지점이 반경 안에 있는가 (스테이지 px 기준) */
      try {
        const adx = (Number(heroX) - Number(landmark.interactionX)) * bw;
        const ady = (Number(heroY) - Number(landmark.interactionY)) * bh;
        const araw = Math.sqrt(adx * adx + ady * ady);
        nearDesigned = isFinite(araw) && araw <= lim;
        /* (v309) 지정 지점은 0.8 가중 — 설계된 상호작용 지점 앞에서는 그 시설이 이긴다 */
        distance = Math.min(distance, araw * 0.8);
      } catch (eA) { }
      /* (v311) 방문 완료 시설은 뒤로 미룬다.
         (v368) 단, 그 시설의 «지정 상호작용 지점» 바로 앞에 서 있으면 페널티를 주지 않는다 —
         와우도서관(방문 완료) 문 앞에서 F를 눌러도 옆 드림문구(미방문)가 항상 이겨 회복 안내대로 쉴 수 없던 문제 */
      /* (v368) 지정 지점 앞이면 소폭 우대(-25px) — 옆 시설의 사각형 가장자리와 1~2px 차로 뒤집히지 않게 */
      const rank = distance - (nearDesigned ? 25 : 0) + ((__seen.indexOf(landmark.facilityId) >= 0 && !nearDesigned) ? 500 : 0);
      if (distance <= lim && (!best || rank < best.rank)) {
        best = { item: landmark, distance: distance, rank: rank };
      }
    });
    return best ? best.item : null;
  }
  // (v281) 다른 스크립트(휴식 핸들러 등)가 'F를 시설 모달에 양보할지' 판단할 수 있게 노출
  window.BD_v24NearestFacility = nearestInteractiveFacility;

  function installInteraction() {
    if (window.__bdDistrictV24InteractionInstalled) return;
    document.addEventListener('keydown', function (event) {
      if (!event) return;
      const modal = document.getElementById('bd-district-facility-modal');
      if (event.key === 'Escape' && modal && modal.classList.contains('open')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeModal();
        return;
      }
      if (event.repeat || String(event.key || '').toLowerCase() !== 'f') return;
      if (typeof currentStage === 'undefined' || !isDistrictStage(currentStage)) return;
      /* (v297) 위험요소·주민이 이기는 경우에만 양보 — 주민 핸들러(032)와 같은 비교식이라
         정확히 한 핸들러만 반응한다 (서로 미루는 교착·서로 뺏는 선점 둘 다 방지) */
      try {
        const stg0 = (typeof STAGES !== 'undefined') && STAGES[currentStage];
        if (stg0) {
          const bw0 = Number(stg0.bgW || 1448), bh0 = Number(stg0.bgH || 1086);
          let objD = Infinity;
          (stg0.objects || []).forEach(function (o) {
            if (!o || o.hidden) return;
            const isHz = o.hazardId && !o.__bdGone && !o._purified
              && !(typeof window.BD_isPurified === 'function' && BD_isPurified(o.hazardId || o.id || o.label))
              /* (v396) 잠긴 보스는 F 경쟁에서 제외 — 위험요소 핸들러는 잠긴 보스를 무시하므로 여기서 세면 서로 미루는 교착(복합건물 F 무반응) */
              && !(typeof window.BD_hazardLocked === 'function' && BD_hazardLocked(o));
            if (!isHz && !o.resident) return;
            const x0 = Number(o.rx || 0), y0 = Number(o.ry || 0);
            const x1 = x0 + Number(o.rw || 0.05), y1 = y0 + Number(o.rh || 0.075);
            const dxp = Math.max(x0 - heroX, 0, heroX - x1) * bw0;
            const dyp = Math.max(y0 - heroY, 0, heroY - y1) * bh0;
            const d = Math.sqrt(dxp * dxp + dyp * dyp);
            if (d < objD) objD = d;
          });
          let facD = Infinity;
          (stg0.__v24Landmarks || []).forEach(function (lm) {
            if (!lm || !lm.majorFacility || lm.hidden) return;
            const fdx = (Number(heroX) - Number(lm.interactionX)) * bw0;
            const fdy = (Number(heroY) - Number(lm.interactionY)) * bh0;
            const fd = Math.sqrt(fdx * fdx + fdy * fdy);
            if (fd < facD) facD = fd;
          });
          if (objD <= 120 && objD < facD) return;
        }
      } catch (e) { }
      const facility = nearestInteractiveFacility();
      if (!facility) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (facility.sharedEntryGroup) openSharedEntry(facility);
      else openFacility(facility);
    }, true);
    window.__bdDistrictV24InteractionInstalled = true;
  }

  function drawLabels(ctx, canvasElement, stage) {
    if (!stage || !stage.__districtWorldV24 || !Array.isArray(stage.__v24Landmarks)) return;
    if (typeof toScreenX !== 'function' || typeof toScreenY !== 'function') return;
    const state = facilityState();
    const editorEnabled = !!(window.BongdamEditor && window.BongdamEditor.state && window.BongdamEditor.state.enabled);
    const scale = clamp(Number(currentScale) || 1, 0.85, 1.55);
    stage.__v24Landmarks.forEach(function (landmark) {
      if (!landmark || landmark.hidden) return;
      syncLandmarkAnchors(landmark);
      const dx = (Number(heroX) - Number(landmark.interactionX)) * Number(stage.bgW || 1448);
      const dy = (Number(heroY) - Number(landmark.interactionY)) * Number(stage.bgH || 1086);
      const nearby = Math.sqrt(dx * dx + dy * dy) < 220;
      // (v281) 보조 시설(minor)은 배경 랜드마크처럼 근접시에만 라벨 표시 — 화면 클러터 방지
      if ((!landmark.majorFacility || landmark.minorFacility)
          && !nearby && !editorEnabled && !window.BD_DISTRICT_SHOW_ALL_LABELS) return;
      const x = toScreenX(Number(landmark.labelX), canvasElement);
      const y = toScreenY(Number(landmark.labelY), canvasElement);
      if (x < -220 || x > canvasElement.width + 220 || y < -80 || y > canvasElement.height + 80) return;
      const sharedEntries = landmark.sharedEntryGroup ? SHARED_OPTIONS[landmark.sharedEntryGroup] : null;
      const virtualIds = sharedEntries
        ? sharedEntries.map(function (entry) { return entry.id; })
        : [landmark.facilityId];
      const visited = virtualIds.some(function (id) { return state.visitedFacilityIds.indexOf(id) >= 0; });
      // (v281) minor는 ◇ — 상호작용은 가능하지만 스탬프 시설(◆/✓)과 구분되는 표시
      const prefix = landmark.minorFacility ? '◇ '
        : landmark.majorFacility ? (visited ? '✓ ' : '◆ ') : '· ';
      const text = prefix + landmark.label;
      ctx.save();
      ctx.font = '900 ' + Math.max(11, Math.round(12 * scale)) + 'px "Noto Sans KR", sans-serif';
      const width = Math.min(390, ctx.measureText(text).width + 18 * scale);
      const height = 22 * scale;
      ctx.fillStyle = landmark.majorFacility ? 'rgba(10,26,40,.92)' : 'rgba(21,32,31,.82)';
      ctx.strokeStyle = landmark.majorFacility
        ? (visited ? '#a7ed9e' : '#75ddff')
        : 'rgba(225,239,218,.72)';
      ctx.lineWidth = Math.max(1, Math.round(scale));
      ctx.fillRect(Math.round(x - width / 2), Math.round(y - height / 2), Math.round(width), Math.round(height));
      ctx.strokeRect(Math.round(x - width / 2), Math.round(y - height / 2), Math.round(width), Math.round(height));
      ctx.fillStyle = landmark.majorFacility ? '#eefbff' : '#eef5e8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, Math.round(x), Math.round(y + scale), Math.max(20, width - 10));
      ctx.restore();
    });
  }

  function installRenderer() {
    if (rendererInstalled || typeof window.BD_drawConceptRoadControls !== 'function') return false;
    const previous = window.BD_drawConceptRoadControls;
    window.BD_drawConceptRoadControls = function (ctx, canvasElement, stage) {
      previous(ctx, canvasElement, stage);
      try { drawLabels(ctx, canvasElement, stage); }
      catch (error) {}
    };
    rendererInstalled = true;
    return true;
  }

  function normalizeGateEntry(gate) {
    const entry = Array.isArray(gate.entry) ? gate.entry.map(Number) : [0.5, 0.5];
    if (entry[0] <= 0.025) entry[0] = 0.045;
    if (entry[0] >= 0.975) entry[0] = 0.955;
    if (entry[1] <= 0.025) entry[1] = 0.045;
    if (entry[1] >= 0.975) entry[1] = 0.955;
    return entry;
  }

  function gateDistance(gate) {
    const at = Number(gate.at) || 0.5;
    if (gate.side === 'top' || gate.side === 'bottom') return Math.abs(Number(heroX) - at);
    return Math.abs(Number(heroY) - at);
  }

  function heroAtGateEdge(gate) {
    const edge = 0.028;
    if (gate.side === 'top' && Number(heroY) >= edge) return false;
    if (gate.side === 'bottom' && Number(heroY) <= 1 - edge) return false;
    if (gate.side === 'left' && Number(heroX) >= edge) return false;
    if (gate.side === 'right' && Number(heroX) <= 1 - edge) return false;
    return gateDistance(gate) <= 0.035;
  }

  function transitionThroughGate(gate) {
    if (gateTransitioning || !gate || !stageData(gate.nextStage)) return false;
    gateTransitioning = true;
    window.__bdExitLockUntil = Date.now() + 1450;
    try {
      if (typeof moveKeys !== 'undefined') moveKeys = { w: false, a: false, s: false, d: false };
      if (typeof isDashing !== 'undefined') isDashing = false;
    } catch (error) {}
    const overlay = document.getElementById('map-transition-overlay');
    if (overlay) overlay.classList.add('fade');
    window.setTimeout(function () {
      const entry = normalizeGateEntry(gate);
      currentStage = Number(gate.nextStage);
      heroX = entry[0];
      heroY = entry[1];
      camX = heroX;
      camY = heroY;
      try { if (typeof _spawnMobsForStage === 'function') _spawnMobsForStage(currentStage); }
      catch (error) {}
      const location = document.getElementById('gs-loc');
      if (location && STAGES[currentStage]) location.textContent = STAGES[currentStage].name;
      const stageSelect = document.getElementById('bge-stage-select');
      if (stageSelect) stageSelect.value = String(currentStage);
      if (overlay) overlay.classList.remove('fade');
      updateHud();
      try { if (typeof autoSave === 'function') autoSave('4개 리 도로 이동'); }
      catch (error) {}
      window.setTimeout(function () { gateTransitioning = false; }, 900);
    }, 320);
    return true;
  }

  function gatePoll() {
    if (gateTransitioning || typeof currentStage === 'undefined' || !isDistrictStage(currentStage)) return;
    if (window.__bdExitLockUntil && Date.now() < window.__bdExitLockUntil) return;
    const editor = window.BongdamEditor;
    if (editor && editor.state && editor.state.enabled) return;
    const modal = document.getElementById('bd-district-facility-modal');
    if (modal && modal.classList.contains('open')) return;
    // 기존 게임의 포괄 입력 차단 함수는 HUD·안내 패널까지 차단 상태로 취급한다.
    // 지역 도로 이동은 편집기와 시설 모달만 직접 확인하고, 전투 중일 때만 추가 차단한다.
    try { if (window.HSR && HSR.active) return; }
    catch (error) {}
    const stage = stageData(currentStage);
    const gates = stage && Array.isArray(stage.districtGates) ? stage.districtGates : [];
    let chosen = null;
    gates.forEach(function (gate) {
      if (!heroAtGateEdge(gate)) return;
      if (!chosen || gateDistance(gate) < gateDistance(chosen)) chosen = gate;
    });
    if (!chosen) return;
    /* (v287) 안전지도를 다 채우기 전에는 다음(미개방) 리로 도보 이동 금지 */
    try {
      var __rid = { 212:'wawoo', 213:'sang', 211:'donghwa', 210:'suyeong' }[Number(chosen.nextStage)];
      var __un = (window.BD_PROGRESS && BD_PROGRESS.story.unlockedRegionIds) || ['wawoo'];
      if (__rid && __un.indexOf(__rid) < 0) {
        /* (v290) 반복 밀어내기 대신: 한 번 확실히 되돌리고, 조작이 잠기는 독백 대화창으로 안내 */
        try {
          if (chosen.side === 'top') heroY = Math.max(heroY, 0.085);
          else if (chosen.side === 'bottom') heroY = Math.min(heroY, 0.915);
          else if (chosen.side === 'left') heroX = Math.max(heroX, 0.085);
          else if (chosen.side === 'right') heroX = Math.min(heroX, 0.915);
          camX = heroX; camY = heroY;
        } catch (eP) { }
        if (!window.__bdGateDenyAt || Date.now() - window.__bdGateDenyAt > 4000) {
          window.__bdGateDenyAt = Date.now();
          var __hereNm = ({ 212:'와우리', 213:'상리', 211:'동화리', 210:'수영리' })[Number(currentStage)] || '이 동네';
          try {
            if (typeof showDialog === 'function') showDialog('나', [
              '(잠깐… 아직 ' + __hereNm + '에서 할 일이 남은 것 같아.)',
              '(안전지도(M)를 다 채우면 다음 동네로 넘어갈 수 있어!)'
            ]);
            else if (window.BD_DAMI) BD_DAMI.show('아직 ' + __hereNm + ' 지도가 다 안 채워졌어요!', { face: 'worry' });
          } catch (eD) { }
        }
        return;
      }
    } catch (eG) { }
    transitionThroughGate(chosen);
  }

  function resolveLandmark(facilityId) {
    const candidate = facilityRegistry[facilityId] || landmarkRegistry[facilityId];
    if (!candidate) return null;
    if (candidate.sourceLandmarkId) return landmarkRegistry[candidate.sourceLandmarkId] || null;
    return candidate;
  }

  function jumpToDistrictStage(stageId, spawn) {
    const numericStageId = Number(stageId);
    if (!isDistrictStage(numericStageId)) return false;
    if (typeof window.BD_jumpToStage === 'function') window.BD_jumpToStage(numericStageId);
    else return false;
    // 기존 편집기는 자체 선택값을 따로 보관하므로, 게임 스테이지와 드롭다운을 즉시 동기화한다.
    const editorStageSelect = document.getElementById('bge-stage-select');
    if (editorStageSelect) editorStageSelect.value = String(numericStageId);
    window.setTimeout(function () {
      const stage = stageData(numericStageId);
      const point = Array.isArray(spawn) ? spawn : [stage.spawnX || 0.5, stage.spawnY || 0.5];
      heroX = clamp(point[0], 0.01, 0.99);
      heroY = clamp(point[1], 0.01, 0.99);
      camX = heroX;
      camY = heroY;
      const delayedStageSelect = document.getElementById('bge-stage-select');
      if (delayedStageSelect) delayedStageSelect.value = String(numericStageId);
      window.__bdExitLockUntil = Date.now() + 900;
      updateHud();
    }, 50);
    return true;
  }

  function jumpEditorToDistrictStage(stageId) {
    const numericStageId = Number(stageId);
    if (!jumpToDistrictStage(numericStageId)) return false;
    window.setTimeout(function () {
      const editor = window.BongdamEditor;
      const stageSelect = document.getElementById('bge-stage-select');
      if (stageSelect) stageSelect.value = String(numericStageId);
      if (editor && editor.state && editor.state.enabled) {
        editor.state.selectedIndex = -1;
        editor.state.selectedPart = 'object';
        linkedSelectionState = null;
        if (typeof editor.refresh === 'function') editor.refresh();
      }
      updateEditorNav();
    }, 90);
    return true;
  }

  function focusFacility(facilityId) {
    const landmark = resolveLandmark(facilityId);
    if (!landmark) return false;
    syncLandmarkAnchors(landmark);
    const point = [
      clamp(Number(landmark.interactionX), 0.02, 0.98),
      clamp(Number(landmark.interactionY) + 0.018, 0.02, 0.98)
    ];
    return jumpToDistrictStage(Number(landmark.stageId), point);
  }

  function editorObjectFor(facilityId, role) {
    const landmark = resolveLandmark(facilityId);
    if (!landmark) return null;
    const stage = stageData(landmark.stageId);
    if (!stage || !Array.isArray(stage.objects)) return null;
    if (role === 'site') {
      return stage.objects.find(function (object) {
        return object && object.editableSiteObject && object.siteGroupId === landmark.siteGroupId;
      }) || null;
    }
    return stage.objects.find(function (object) {
      return object && object.editableFacilityObject && object.facilityId === landmark.facilityId;
    }) || null;
  }

  function editDistrictObject(facilityId, role, requestedStageId) {
    const landmark = resolveLandmark(facilityId);
    if (!landmark) return false;
    const requested = Number(requestedStageId);
    const stageId = isDistrictStage(requested) ? requested : Number(landmark.stageId);
    document.documentElement.dataset.bdDistrictEditorRequest = String(facilityId) + ':' + String(role) + ':' + String(stageId);
    jumpToDistrictStage(stageId);
    window.setTimeout(function () {
      const stage = stageData(stageId);
      const editor = window.BongdamEditor;
      const targetFacilityId = String(landmark.facilityId || facilityId);
      const object = stage && Array.isArray(stage.objects)
        ? stage.objects.find(function (candidate) {
          if (!candidate) return false;
          if (role === 'site') {
            return candidate.editableSiteObject
              && (candidate.siteGroupId === landmark.siteGroupId
                || candidate.siteFor === targetFacilityId
                || candidate.siteFor === facilityId);
          }
          return candidate.editableFacilityObject
            && (candidate.facilityId === targetFacilityId || candidate.facilityId === facilityId);
        })
        : null;
      if (!stage || !object || !editor || !editor.state) {
        document.documentElement.dataset.bdDistrictEditorResult = 'missing:'
          + [!!stage, !!object, !!editor, !!(editor && editor.state)].join(',');
        return;
      }
      const index = stage.objects.indexOf(object);
      if (index < 0) return;
      // 에디터 활성화 과정에서 마지막 편집 스테이지가 복원될 수 있으므로 먼저 연 뒤 목표 스테이지를 확정한다.
      editor.enable();
      const stageSelect = document.getElementById('bge-stage-select');
      if (stageSelect) {
        stageSelect.value = String(stageId);
        stageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      currentStage = stageId;
      editor.state.selectedIndex = index;
      editor.state.selectedPart = 'object';
      editor.state.tool = 'select';
      editor.state.editorViewMode = 'runtime';
      editor.state.editorZoom = typeof window.BD_getRuntimeEditorZoomV26 === 'function' ? window.BD_getRuntimeEditorZoomV26() : Math.max(4, Number(editor.state.editorZoom) || 1);
      editor.state.editorCamX = clamp(Number(object.rx) + Number(object.rw) / 2, 0.04, 0.96);
      editor.state.editorCamY = clamp(Number(object.ry) + Number(object.rh) / 2, 0.04, 0.96);
      camX = editor.state.editorCamX;
      camY = editor.state.editorCamY;
      linkedSelectionState = null;
      if (typeof editor.refresh === 'function') editor.refresh();
      document.documentElement.dataset.bdDistrictEditorResult = 'selected:' + String(currentStage) + ':' + String(index);
      const list = document.getElementById('bge-object-list');
      const row = list && list.children ? list.children[index * 2] : null;
      if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
    }, 120);
    return true;
  }


  function editDistrictDecoration(decorationId, requestedStageId) {
    const decoration = decorationRegistry[decorationId];
    if (!decoration) return false;
    const requested = Number(requestedStageId);
    const stageId = isDistrictStage(requested) ? requested : Number(decoration.stageId);
    document.documentElement.dataset.bdDistrictEditorRequest = String(decorationId) + ':decoration:' + String(stageId);
    jumpToDistrictStage(stageId);
    window.setTimeout(function () {
      const stage = stageData(stageId);
      const editor = window.BongdamEditor;
      const object = stage && Array.isArray(stage.objects)
        ? stage.objects.find(function (candidate) {
          return candidate && candidate.editableBuildingDecoration && candidate.decorationId === decorationId;
        })
        : null;
      if (!stage || !object || !editor || !editor.state) {
        document.documentElement.dataset.bdDistrictEditorResult = 'missing-decoration:'
          + [!!stage, !!object, !!editor, !!(editor && editor.state)].join(',');
        return;
      }
      const index = stage.objects.indexOf(object);
      if (index < 0) return;
      editor.enable();
      const stageSelect = document.getElementById('bge-stage-select');
      if (stageSelect) {
        stageSelect.value = String(stageId);
        stageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      currentStage = stageId;
      editor.state.selectedIndex = index;
      editor.state.selectedPart = 'object';
      editor.state.tool = 'select';
      editor.state.editorViewMode = 'runtime';
      editor.state.editorZoom = typeof window.BD_getRuntimeEditorZoomV26 === 'function' ? window.BD_getRuntimeEditorZoomV26() : Math.max(4, Number(editor.state.editorZoom) || 1);
      editor.state.editorCamX = clamp(Number(object.rx) + Number(object.rw) / 2, 0.04, 0.96);
      editor.state.editorCamY = clamp(Number(object.ry) + Number(object.rh) / 2, 0.04, 0.96);
      camX = editor.state.editorCamX;
      camY = editor.state.editorCamY;
      linkedSelectionState = null;
      if (typeof editor.refresh === 'function') editor.refresh();
      document.documentElement.dataset.bdDistrictEditorResult = 'selected-decoration:' + String(currentStage) + ':' + String(index);
    }, 120);
    return true;
  }

  function selectedEditorObject() {
    const editor = window.BongdamEditor;
    if (!editor || !editor.state || !editor.state.enabled) return null;
    const stage = stageData(typeof currentStage !== 'undefined' ? currentStage : -1);
    if (!stage || !Array.isArray(stage.objects)) return null;
    const index = Number(editor.state.selectedIndex);
    if (!Number.isInteger(index) || index < 0 || index >= stage.objects.length) return null;
    return stage.objects[index] || null;
  }

  function linkedPeer(object) {
    if (!object || !object.siteGroupId) return null;
    const stage = stageData(object.stageId || currentStage);
    if (!stage || !Array.isArray(stage.objects)) return null;
    return stage.objects.find(function (candidate) {
      if (!candidate || candidate === object || candidate.siteGroupId !== object.siteGroupId) return false;
      if (object.editableSiteObject) return !!candidate.editableFacilityObject;
      if (object.editableFacilityObject) return !!candidate.editableSiteObject;
      return false;
    }) || null;
  }

  function linkedGroupPeers(object) {
    if (!object || !object.siteGroupId) return [];
    const stage = stageData(object.stageId || currentStage);
    if (!stage || !Array.isArray(stage.objects)) return [];
    return stage.objects.filter(function (candidate) {
      return candidate && candidate !== object && candidate.siteGroupId === object.siteGroupId;
    });
  }

  function syncSiteBoundaryColliders(site) {
    if (!site || !site.editableSiteObject || !site.siteGroupId) return 0;
    const stage = stageData(site.stageId || currentStage);
    if (!stage || !Array.isArray(stage.objects)) return 0;
    let count = 0;
    stage.objects.forEach(function (candidate) {
      if (!candidate || !candidate.linkedToSite || candidate.siteGroupId !== site.siteGroupId) return;
      const relative = Array.isArray(candidate.siteRelativeBounds)
        ? candidate.siteRelativeBounds
        : null;
      if (!relative) return;
      candidate.rx = Number(site.rx) + Number(site.rw) * Number(relative[0]);
      candidate.ry = Number(site.ry) + Number(site.rh) * Number(relative[1]);
      candidate.rw = Number(site.rw) * Number(relative[2]);
      candidate.rh = Number(site.rh) * Number(relative[3]);
      count += 1;
    });
    return count;
  }

  function moveObjectBy(object, dx, dy) {
    if (!object || (!dx && !dy)) return;
    object.rx = clamp(Number(object.rx) + dx, 0, Math.max(0, 1 - Number(object.rw || 0)));
    object.ry = clamp(Number(object.ry) + dy, 0, Math.max(0, 1 - Number(object.rh || 0)));
    if (object.cx !== undefined && object.cy !== undefined) {
      object.cx = clamp(Number(object.cx) + dx, 0, 1);
      object.cy = clamp(Number(object.cy) + dy, 0, 1);
    }
    if (object.editableFacilityObject) syncLandmarkAnchors(object);
  }

  function enforceLandmarkPixelScale(object, previous) {
    if (!object || !object.aspectLocked) return false;
    const stage = stageConfig(object.stageId || currentStage);
    const canvas = stage && Array.isArray(stage.canvas) ? stage.canvas : [1, 1];
    const canvasWidth = Math.max(1, Number(canvas[0]) || 1);
    const canvasHeight = Math.max(1, Number(canvas[1]) || 1);
    const nativeWidth = Math.max(1, Number(object.nativePixelWidth) || 1);
    const nativeHeight = Math.max(1, Number(object.nativePixelHeight) || 1);
    const scales = Array.isArray(object.allowedPixelScales) && object.allowedPixelScales.length
      ? object.allowedPixelScales.map(Number).filter(function (value) { return value > 0; })
      : [0.5, 1, 2, 3];
    const widthDelta = Math.abs((Number(object.rw) - Number(previous.width)) * canvasWidth);
    const heightDelta = Math.abs((Number(object.rh) - Number(previous.height)) * canvasHeight);
    const requestedScale = widthDelta >= heightDelta
      ? Number(object.rw) * canvasWidth / nativeWidth
      : Number(object.rh) * canvasHeight / nativeHeight;
    let snappedScale = scales[0] || 1;
    scales.forEach(function (candidate) {
      if (Math.abs(candidate - requestedScale) < Math.abs(snappedScale - requestedScale)) snappedScale = candidate;
    });
    const centerX = Number(object.rx) + Number(object.rw) / 2;
    const bottomY = Number(object.ry) + Number(object.rh);
    const snappedWidth = Math.max(1, Math.round(nativeWidth * snappedScale)) / canvasWidth;
    const snappedHeight = Math.max(1, Math.round(nativeHeight * snappedScale)) / canvasHeight;
    object.rw = clamp(snappedWidth, 1 / canvasWidth, 1);
    object.rh = clamp(snappedHeight, 1 / canvasHeight, 1);
    object.rx = clamp(centerX - object.rw / 2, 0, Math.max(0, 1 - object.rw));
    object.ry = clamp(bottomY - object.rh, 0, Math.max(0, 1 - object.rh));
    object.pixelScale = snappedScale;
    return true;
  }


  function buildingDecorationPeers(object) {
    if (!object || !object.editableFacilityObject || !object.facilityId) return [];
    const stage = stageData(object.stageId || currentStage);
    if (!stage || !Array.isArray(stage.objects)) return [];
    return stage.objects.filter(function (candidate) {
      return candidate && candidate.editableBuildingDecoration && candidate.decorationFor === object.facilityId;
    });
  }

  function linkedMovementPoll() {
    if (!linkedMovementEnabled) {
      linkedSelectionState = null;
      return;
    }
    const object = selectedEditorObject();
    if (!object || (!object.editableFacilityObject && !object.editableSiteObject)) {
      linkedSelectionState = null;
      return;
    }
    const identity = String(currentStage) + ':' + String(object._editorId || object.id || '');
    const current = {
      identity: identity,
      x: Number(object.rx) || 0,
      y: Number(object.ry) || 0,
      width: Number(object.rw) || 0,
      height: Number(object.rh) || 0
    };
    if (!linkedSelectionState || linkedSelectionState.identity !== identity) {
      linkedSelectionState = current;
      return;
    }
    const dx = current.x - linkedSelectionState.x;
    const dy = current.y - linkedSelectionState.y;
    if (Math.abs(dx) > 0.0000001 || Math.abs(dy) > 0.0000001) {
      linkedGroupPeers(object).forEach(function (peer) { moveObjectBy(peer, dx, dy); });
      buildingDecorationPeers(object).forEach(function (peer) { moveObjectBy(peer, dx, dy); });
      linkedMovementDirty = true;
      if (object.editableFacilityObject) syncLandmarkAnchors(object);
    }
    const resized = Math.abs(current.width - linkedSelectionState.width) > 0.0000001
      || Math.abs(current.height - linkedSelectionState.height) > 0.0000001;
    // (v31) 원본 픽셀 배율 스냅(enforceLandmarkPixelScale) 호출 제거 — 꼭지점 리사이즈가
    //  70ms 폴링에 의해 원본 해상도 ×{0.5,1,2,3} 격자 크기로 되돌아가던 원인.
    //  크기·비율은 완전 자유. 앵커(상호작용점·라벨·콜라이더)만 새 박스에 추종시킨다.
    if (resized && object.editableFacilityObject) {
      syncLandmarkAnchors(object);
      linkedMovementDirty = true;
    }
    if (resized && object.editableSiteObject) {
      syncSiteBoundaryColliders(object);
      linkedMovementDirty = true;
    }
    linkedSelectionState = current;
  }

  function fitSiteToBuilding(facilityId) {
    const landmark = resolveLandmark(facilityId) || selectedEditorObject();
    const facility = landmark && landmark.editableFacilityObject
      ? landmark
      : (landmark && landmark.siteGroupId ? linkedPeer(landmark) : null);
    if (!facility || !facility.editableFacilityObject) return false;
    const site = linkedPeer(facility);
    if (!site || !site.editableSiteObject) return false;
    const padX = Math.max(0.006, Math.min(0.022, Number(facility.rw) * 0.12));
    const padTop = Math.max(0.008, Math.min(0.028, Number(facility.rh) * 0.18));
    const padBottom = Math.max(0.014, Math.min(0.04, Number(facility.rh) * 0.26));
    const x = clamp(Number(facility.rx) - padX, 0, 1);
    const y = clamp(Number(facility.ry) - padTop, 0, 1);
    site.rx = x;
    site.ry = y;
    site.rw = clamp(Number(facility.rw) + padX * 2, 0.02, 1 - x);
    site.rh = clamp(Number(facility.rh) + padTop + padBottom, 0.02, 1 - y);
    syncSiteBoundaryColliders(site);
    linkedSelectionState = null;
    const editor = window.BongdamEditor;
    if (editor && typeof editor.refresh === 'function') editor.refresh();
    if (editor && typeof editor.save === 'function') editor.save(false);
    return true;
  }

  function saveLinkedMovement() {
    if (!linkedMovementDirty) return;
    linkedMovementDirty = false;
    const editor = window.BongdamEditor;
    if (editor && typeof editor.save === 'function') editor.save(false);
  }

  function addEditorOptions() {
    const select = document.getElementById('bge-stage-select');
    if (!select) return;
    STAGE_IDS.forEach(function (stageId) {
      let option = Array.from(select.options).find(function (item) { return Number(item.value) === stageId; });
      if (!option) {
        option = document.createElement('option');
        option.value = String(stageId);
        select.insertBefore(option, select.firstChild);
      }
      const stage = stageConfig(stageId);
      option.textContent = stageId + ' · ' + stage.district + ' 대형 월드';
    });
    const legacy = Array.from(select.options).find(function (item) { return Number(item.value) === 209; });
    if (legacy) legacy.textContent = '209 · 기존 통합 배치 백업 (편집용)';
  }

  function updateEditorNav() {
    const nav = document.getElementById('bd-district-editor-nav');
    if (!nav) return;
    const status = nav.querySelector('.bd-district-editor-status');
    if (status) {
      status.textContent = '건물 ' + Object.keys(landmarkRegistry).length
        + ' · 장식 ' + Object.keys(decorationRegistry).length
        + ' · 공원부지 ' + Object.keys(siteRegistry).length
        + ' · 주요시설 ' + Object.keys(facilityRegistry).length;
    }
    nav.querySelectorAll('[data-district-stage]').forEach(function (button) {
      button.classList.toggle('active', Number(button.dataset.districtStage) === Number(currentStage));
    });
  }

  function installEditorNav() {
    const existingNav = document.getElementById('bd-district-editor-nav');
    if (existingNav) {
      if (existingNav.dataset.bdDistrictWorldUiVersion === VERSION) return false;
      existingNav.remove();
    }
    const anchor = document.getElementById('bd-openworld-editor-nav')
      || document.getElementById('bd-concept-editor-stagebar')
      || document.getElementById('bge-stage-select');
    if (!anchor) return false;

    const nav = document.createElement('section');
    nav.id = 'bd-district-editor-nav';
    nav.dataset.bdDistrictWorldUiVersion = VERSION;
    nav.setAttribute('aria-label', '봉담 4개 리 대형 월드 편집 이동');
    const title = document.createElement('div');
    title.className = 'bd-district-editor-title';
    const titleText = document.createElement('span');
    titleText.textContent = '🗺 봉담 4개 리 대형 월드 편집';
    const status = document.createElement('span');
    status.className = 'bd-district-editor-status';
    title.appendChild(titleText);
    title.appendChild(status);
    nav.appendChild(title);

    const stageGrid = document.createElement('div');
    stageGrid.className = 'bd-district-stage-grid';
    CONFIG.stages.forEach(function (stage) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.districtStage = String(stage.id);
      button.textContent = stage.id + ' ' + stage.district;
      button.addEventListener('click', function () { jumpEditorToDistrictStage(stage.id); });
      stageGrid.appendChild(button);
    });
    nav.appendChild(stageGrid);

    const facilityGrid = document.createElement('div');
    facilityGrid.className = 'bd-district-facility-grid';
    Object.keys(facilityRegistry).forEach(function (facilityId) {
      const facility = facilityRegistry[facilityId];
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '◆ ' + facility.label;
      button.addEventListener('click', function () { editDistrictObject(facilityId, 'facility', facility.stageId); });
      facilityGrid.appendChild(button);
    });
    nav.appendChild(facilityGrid);

    const picker = document.createElement('div');
    picker.className = 'bd-district-object-picker';
    const objectSelect = document.createElement('select');
    objectSelect.id = 'bd-district-object-select';
    objectSelect.setAttribute('aria-label', '편집할 독립 건물·공원 오브젝트');
    DISTRICT_ORDER.forEach(function (district) {
      const group = document.createElement('optgroup');
      group.label = district;
      CONFIG.stages.filter(function (stage) { return stage.district === district; }).forEach(function (stage) {
        (stage.landmarks || []).forEach(function (item) {
          const option = document.createElement('option');
          option.value = item.id;
          option.dataset.stageId = String(stage.id);
          option.dataset.hasSite = item.asset_kind === 'park' ? '1' : '0';
          option.textContent = '[' + item.module + '] ' + item.label;
          group.appendChild(option);
        });
      });
      objectSelect.appendChild(group);
    });
    const editBuilding = document.createElement('button');
    editBuilding.type = 'button';
    editBuilding.textContent = '건물 편집';
    editBuilding.addEventListener('click', function () {
      const option = objectSelect.selectedOptions && objectSelect.selectedOptions[0];
      editDistrictObject(objectSelect.value, 'facility', option && option.dataset.stageId);
    });
    const editSite = document.createElement('button');
    editSite.type = 'button';
    editSite.textContent = '공원 부지 편집';
    editSite.addEventListener('click', function () {
      const option = objectSelect.selectedOptions && objectSelect.selectedOptions[0];
      if (!option || option.dataset.hasSite !== '1') return;
      editDistrictObject(objectSelect.value, 'site', option.dataset.stageId);
    });
    function syncSiteEditState() {
      const option = objectSelect.selectedOptions && objectSelect.selectedOptions[0];
      const hasParkSite = !!(option && option.dataset.hasSite === '1');
      editSite.disabled = !hasParkSite;
      editSite.title = hasParkSite
        ? '선택한 공원 지형 부지를 편집합니다.'
        : '건물·상가·아파트는 기본 맵 바닥을 사용하며 별도 부지가 없습니다.';
      if (typeof fitButton !== 'undefined') fitButton.disabled = !hasParkSite;
      if (typeof toggle !== 'undefined') {
        toggle.disabled = false;
        toggle.title = hasParkSite ? '공원과 공원 부지를 함께 이동합니다.' : '건물을 이동하면 고정 크기 장식만 함께 이동합니다.';
      }
    }
    objectSelect.addEventListener('change', syncSiteEditState);
    picker.appendChild(objectSelect);
    picker.appendChild(editBuilding);
    picker.appendChild(editSite);
    nav.appendChild(picker);

    const decorationPicker = document.createElement('div');
    decorationPicker.className = 'bd-district-object-picker';
    const decorationSelect = document.createElement('select');
    decorationSelect.id = 'bd-district-decoration-select';
    decorationSelect.setAttribute('aria-label', '편집할 건물 장식 오브젝트');
    DISTRICT_ORDER.forEach(function (district) {
      const group = document.createElement('optgroup');
      group.label = district + ' 건물 장식';
      CONFIG.stages.filter(function (stage) { return stage.district === district; }).forEach(function (stage) {
        (stage.buildingDecorations || []).forEach(function (item) {
          const option = document.createElement('option');
          option.value = item.id;
          option.dataset.stageId = String(stage.id);
          option.textContent = '[' + item.module + '] ' + item.building_label + ' · ' + item.label;
          group.appendChild(option);
        });
      });
      decorationSelect.appendChild(group);
    });
    const editDecoration = document.createElement('button');
    editDecoration.type = 'button';
    editDecoration.textContent = '건물 장식 편집';
    editDecoration.addEventListener('click', function () {
      const option = decorationSelect.selectedOptions && decorationSelect.selectedOptions[0];
      if (!option) return;
      editDistrictDecoration(decorationSelect.value, option.dataset.stageId);
    });
    decorationPicker.appendChild(decorationSelect);
    decorationPicker.appendChild(editDecoration);
    nav.appendChild(decorationPicker);

    const linkTools = document.createElement('div');
    linkTools.className = 'bd-district-link-tools';
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'bd-district-link-toggle';
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = linkedMovementEnabled;
    toggle.addEventListener('change', function () {
      linkedMovementEnabled = toggle.checked;
      linkedSelectionState = null;
    });
    toggleLabel.appendChild(toggle);
    toggleLabel.appendChild(document.createTextNode(' 건물↔장식 / 공원↔부지 함께 이동 (장식 크기 고정)'));
    const fitButton = document.createElement('button');
    fitButton.type = 'button';
    fitButton.textContent = '공원 부지를 스프라이트에 맞춤';
    fitButton.addEventListener('click', function () {
      const selected = selectedEditorObject();
      const targetId = selected && selected.facilityId ? selected.facilityId : objectSelect.value;
      fitSiteToBuilding(targetId);
    });
    linkTools.appendChild(toggleLabel);
    linkTools.appendChild(fitButton);
    nav.appendChild(linkTools);
    syncSiteEditState();

    anchor.parentNode.insertBefore(nav, anchor);
    updateEditorNav();
    return true;
  }

  function installMapPicker() {
    const panel = document.getElementById('bd-concept-map-panel');
    if (!panel) return false;
    const existingCard = document.getElementById('bd-district-picker-card');
    if (existingCard) {
      if (existingCard.dataset.bdDistrictWorldUiVersion === VERSION) return false;
      existingCard.remove();
    }
    const card = document.createElement('section');
    card.id = 'bd-district-picker-card';
    card.dataset.bdDistrictWorldUiVersion = VERSION;
    const title = document.createElement('h4');
    title.textContent = '봉담 4개 리 비정사각형 대형 월드';
    const desc = document.createElement('p');
    desc.textContent = '수영리 1열 · 동화리 2열 · 와우리 1열 / 하단 상리 4열 · 도로 게이트 연속 이동 · 독립 편집 건물·부지 62쌍';
    const grid = document.createElement('div');
    grid.className = 'bd-district-picker-grid';
    CONFIG.stages.forEach(function (stage) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = stage.id + ' · ' + stage.district;
      button.addEventListener('click', function () { jumpToDistrictStage(stage.id); });
      grid.appendChild(button);
    });
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(grid);
    const firstSection = panel.querySelector('.bd-concept-section-title');
    panel.insertBefore(card, firstSection || null);
    return true;
  }

  function enterDistrictGame(stageId) {
    try {
      const boot = document.getElementById('bd-boot');
      if (boot) boot.style.display = 'none';
      if (typeof window.BD_hideTitle === 'function') window.BD_hideTitle();
      const title = document.getElementById('bd-title-screen');
      if (title) title.classList.remove('show');
      if (typeof enterGameScreen === 'function') enterGameScreen('봉담지킴이', true);
      else if (typeof window.enterGameScreen === 'function') window.enterGameScreen('봉담지킴이', true);
      jumpToDistrictStage(Number(stageId) || Number(CONFIG.worldAtlas.startStage) || 211);
      return true;
    } catch (error) {
      console.error('[봉담 4개 리 월드] 게임 진입 실패', error);
      return false;
    }
  }

  /* (v380) 개발용 «봉담 4개 리 대형 월드 바로 시작» 타이틀 버튼 제거 — QA 요청. 잔존 버튼도 제거한다. */
  function installTitleLaunch() {
    const existingButton = document.getElementById('bd-district-title-launch');
    if (existingButton) existingButton.remove();
    return false;
  }

  function installHud() {
    const host = document.getElementById('game-screen');
    if (!host) return;
    if (!document.getElementById('bd-district-hud')) {
      const hud = document.createElement('div');
      hud.id = 'bd-district-hud';
      host.appendChild(hud);
    }
    if (!document.getElementById('bd-district-minimap')) {
      const minimap = document.createElement('section');
      minimap.id = 'bd-district-minimap';
      minimap.setAttribute('aria-label', '봉담 4개 리 미니맵');
      const title = document.createElement('div');
      title.className = 'bd-district-mini-title';
      const label = document.createElement('span');
      label.textContent = '봉담 4개 리';
      const progress = document.createElement('span');
      progress.className = 'bd-district-mini-progress';
      title.appendChild(label);
      title.appendChild(progress);
      const grid = document.createElement('div');
      grid.className = 'bd-district-mini-grid';
      CONFIG.stages.forEach(function (stage) {
        const cell = document.createElement('div');
        cell.className = 'bd-district-mini-cell';
        cell.dataset.stage = String(stage.id);
        cell.textContent = stage.district;
        grid.appendChild(cell);
      });
      const hint = document.createElement('div');
      hint.className = 'bd-district-mini-hint';
      minimap.appendChild(title);
      minimap.appendChild(grid);
      minimap.appendChild(hint);
      host.appendChild(minimap);
    }
  }

  function gateSummary(stage) {
    if (!stage || !Array.isArray(stage.districtGates)) return '';
    const labels = [];
    stage.districtGates.forEach(function (gate) {
      const direction = { top: '북', bottom: '남', left: '서', right: '동' }[gate.side] || '';
      const target = stageConfig(gate.nextStage);
      const text = direction + '→' + (target ? target.district : gate.label || gate.nextStage);
      if (labels.indexOf(text) < 0) labels.push(text);
    });
    return labels.join(' · ');
  }

  function updateHud() {
    const hud = document.getElementById('bd-district-hud');
    const minimap = document.getElementById('bd-district-minimap');
    const active = typeof currentStage !== 'undefined' && isDistrictStage(currentStage);
    if (hud) hud.classList.toggle('show', active);
    if (minimap) minimap.classList.toggle('show', active);
    if (!active) return;
    const stage = stageData(currentStage);
    const nearby = nearestInteractiveFacility();
    const state = facilityState();
    const facilityIds = Object.keys(facilityRegistry);
    const visitedCount = facilityIds.filter(function (id) {
      return state.visitedFacilityIds.indexOf(id) >= 0;
    }).length;
    if (hud) {
      hud.innerHTML = '<strong>' + (stage.district || '봉담읍') + '</strong>'
        + (nearby ? ' · ' + nearby.label + ' 앞 · F 상호작용' : ' · 도로 끝에서 인접 리로 자연 이동')
        + ' · 주요시설 ' + visitedCount + '/' + facilityIds.length;
    }
    if (minimap) {
      minimap.querySelectorAll('.bd-district-mini-cell').forEach(function (cell) {
        cell.classList.toggle('active', Number(cell.dataset.stage) === Number(currentStage));
      });
      const progress = minimap.querySelector('.bd-district-mini-progress');
      if (progress) progress.textContent = visitedCount + '/' + facilityIds.length;
      const hint = minimap.querySelector('.bd-district-mini-hint');
      if (hint) hint.textContent = gateSummary(stage);
    }
  }

  function exposeAuditState() {
    const landmarkCount = Object.keys(landmarkRegistry).length;
    const siteCount = Object.keys(siteRegistry).length;
    const decorationCount = Object.keys(decorationRegistry).length;
    document.documentElement.dataset.bdDistrictWorldVersion = VERSION;
    document.documentElement.dataset.bdDistrictWorldStages = STAGE_IDS.join(',');
    document.documentElement.dataset.bdDistrictWorldLandmarkCount = String(landmarkCount);
    document.documentElement.dataset.bdDistrictWorldSiteCount = String(siteCount);
    document.documentElement.dataset.bdDistrictWorldDecorationCount = String(decorationCount);
    document.documentElement.dataset.bdDistrictWorldFacilityCount = String(Object.keys(facilityRegistry).length);
    document.documentElement.dataset.bdDistrictWorldGateCount = String(Number(CONFIG.counts.gates || 0));
    document.documentElement.dataset.bdDistrictWorldColliderCount = String(
      Number(CONFIG.counts.objectColliders || 0) + Number(CONFIG.counts.boundaryColliders || 0)
    );
    document.documentElement.dataset.bdDistrictWorldSiteBoundaryColliderCount = String(
      Number(CONFIG.counts.siteBoundaryColliders || 0)
    );
    document.documentElement.dataset.bdDistrictWorldEmbeddedAssetCount = String(Object.keys(EDITABLE_ASSETS).length);
    document.documentElement.dataset.bdDistrictWorldHagaPlayableStage = 'false';
    window.BD_DISTRICT_WORLD_V24_AUDIT = {
      version: VERSION,
      stages: STAGE_IDS.slice(),
      landmarks: landmarkCount,
      sites: siteCount,
      majorFacilityEntries: Object.keys(facilityRegistry).length,
      gates: Number(CONFIG.counts.gates || 0),
      colliders: Number(CONFIG.counts.objectColliders || 0) + Number(CONFIG.counts.boundaryColliders || 0),
      siteBoundaryColliders: Number(CONFIG.counts.siteBoundaryColliders || 0),
      deletedObjectsKeptDeleted: (CONFIG.intent && CONFIG.intent.deletedObjectsKeptDeleted || []).slice(),
      duplicatedApartment: CONFIG.intent && CONFIG.intent.duplicatedApartment,
      restoredSharedBuildings: (CONFIG.intent && CONFIG.intent.restoredSharedBuildings || []).slice()
    };
  }

  function autoLaunch() {
    let params;
    try { params = new URLSearchParams(window.location.search); }
    catch (error) { return; }
    const requestedStage = Number(params.get('bdAutoStage'));
    if (!isDistrictStage(requestedStage)) return;
    const config = stageConfig(requestedStage);
    const image = config ? LOADED_IMGS[config.bgKey] : null;
    if (!image || !image.complete || !image.naturalWidth) {
      window.setTimeout(autoLaunch, 120);
      return;
    }
    if (params.get('bdScreenshot') === '1') document.body.classList.add('bd-concept-screenshot');
    if (params.get('bdShowAllLabels') === '1') window.BD_DISTRICT_SHOW_ALL_LABELS = true;
    if (params.get('bdColliderDebug') === '1') window.BD_CONCEPT_COLLIDER_DEBUG = true;
    if (params.get('bdColliderLabels') === '1') window.BD_CONCEPT_COLLIDER_LABELS = true;
    if (!enterDistrictGame(requestedStage)) return;
    const facilityId = params.get('bdAutoFacility');
    if (facilityId) window.setTimeout(function () { focusFacility(facilityId); }, 180);
    window.setTimeout(function () {
      window.__BD_DISTRICT_WORLD_V24_READY = true;
      document.documentElement.dataset.bdDistrictWorldReady = String(requestedStage);
      updateHud();
      updateEditorNav();
      exposeAuditState();
    }, 900);
  }

  function maintainIntegration() {
    let missing = false;
    STAGE_IDS.forEach(function (stageId) {
      const stage = stageData(stageId);
      if (!stage || !stage.__districtWorldV24) missing = true;
    });
    if (missing) applyStages(false);
    else {
      rebuildRegistries();
      mergeRegistries();
    }
    addEditorOptions();
    installEditorNav();
    installMapPicker();
    installTitleLaunch();
    installConceptPixelScaleHook();
    installRenderer();
    updateHud();
    updateEditorNav();
    exposeAuditState();
  }

  function initialize() {
    if (initialized) return;
    if (
      typeof STAGES === 'undefined'
      || typeof LOADED_IMGS === 'undefined'
      || typeof window.BD_jumpToStage !== 'function'
      || !document.getElementById('game-canvas')
    ) {
      window.setTimeout(initialize, 150);
      return;
    }
    initialized = true;
    installErrorAudit();
    installEditableAssets();
    installPixelIntegrity();
    installConceptPixelScaleHook();
    installSiteLayerOrder();
    installImages();
    applyStages(false);
    createModal();
    installInteraction();
    installHud();
    installRenderer();
    addEditorOptions();
    installEditorNav();
    installMapPicker();
    installTitleLaunch();
    exposeAuditState();

    window.setInterval(maintainIntegration, 900);
    window.setInterval(gatePoll, 45);
    window.setInterval(linkedMovementPoll, 70);
    window.setInterval(updateHud, 240);
    window.addEventListener('mouseup', saveLinkedMovement, true);
    window.addEventListener('touchend', saveLinkedMovement, true);

    window.BD_jumpToDistrictStage = jumpToDistrictStage;
    window.BD_focusDistrictFacility = focusFacility;
    window.BD_editDistrictObject = editDistrictObject;
    window.BD_fitDistrictSiteToBuilding = fitSiteToBuilding;
    window.BD_enterDistrictWorld = enterDistrictGame;
    window.BD_setDistrictSiteLinkedMovement = function (enabled) {
      linkedMovementEnabled = enabled !== false;
      linkedSelectionState = null;
      const toggle = document.querySelector('#bd-district-editor-nav .bd-district-link-toggle input');
      if (toggle) toggle.checked = linkedMovementEnabled;
      return linkedMovementEnabled;
    };
    autoLaunch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

