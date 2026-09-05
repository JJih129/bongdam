
(function () {
  'use strict';

  const STORAGE_KEY = 'bongdam_rpg_editor_data_v5_2_quest';
  const OLD_STORAGE_KEY = 'bongdam_rpg_editor_data_v5_2_quest_legacy_unused';
  const $ = (id) => document.getElementById(id);
  const OBJECT_TYPES = ['building','npc','info','quest_item','hazard','monster_spawn','wall','stair','shelf','desk','platform','seats','piano','prop','decoration','portal'];

  const state = {
    enabled: false,
    selectedIndex: -1,
    selectedPart: 'object',
    tool: 'select',
    pickSpawn: false,
    pickEntry: false,
    entryReturnStage: null,
    dragging: false,
    dragMode: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    panStartX: 0,
    panStartY: 0,
    panCamX: 0.5,
    panCamY: 0.5,
    editorCamX: 0.5,
    editorCamY: 0.5,
    editorZoom: 1.0,
    defaultData: null,
    original: {},
    // ── 개선: 히스토리(undo/redo) ──
    _history: [],
    _future: [],
    _histLimit: 60,
    _dragSnapshotTaken: false,
    // ── 개선: 그리드 스냅 ──
    gridSnap: false,
    gridSize: 0.05,   // 스냅 격자 간격 (맵 비율)
    // ── 개선: 클립보드 ──
    _clipboard: null
  };

  function cloneData(value) { return window.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  function clamp(v, a, b) { v = Number(v); if (!Number.isFinite(v)) return a; return Math.max(a, Math.min(b, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function num(id, fallback) { const v = Number($(id).value); return Number.isFinite(v) ? v : fallback; }
  function stageIds() { return Object.keys(STAGES).sort(function (a,b) { return Number(a) - Number(b); }); }
  const EDITOR_ZOOM_MIN_V26 = 0.25;
  const EDITOR_ZOOM_MAX_V26 = 12;

  // v26: 인게임과 에디터가 같은 좌표·화면비 변환을 사용한다.
  // 4개 리 통합 맵은 세로/가로 길이가 서로 달라 기존의 1/zoom 정사각 뷰포트를 쓰면
  // 에디터에서만 오브젝트가 찌그러지고 드래그 좌표도 달라졌다.
  function isUnifiedPixelStageV26(stage) {
    return !!(stage && stage.__districtWorldV24 && Number(stage.bgW) > 0 && Number(stage.bgH) > 0);
  }
  function editorStageMetricsV26(stage) {
    const canvas = $('game-canvas');
    const stageW = Math.max(1, Number(stage && stage.bgW) || 1);
    const stageH = Math.max(1, Number(stage && stage.bgH) || 1);
    const canvasW = Math.max(1, Number(canvas && canvas.width) || BASE_W);
    const canvasH = Math.max(1, Number(canvas && canvas.height) || BASE_H);
    const scale = (typeof currentScale !== 'undefined' && Number(currentScale) > 0)
      ? Number(currentScale)
      : Math.min(canvasW / BASE_W, canvasH / BASE_H);
    const fitScale = Math.max(0.000001, Math.min(canvasW / stageW, canvasH / stageH));
    return { stageW:stageW, stageH:stageH, scale:scale, fitScale:fitScale };
  }
  function runtimeEditorZoomV26(stage) {
    if (!isUnifiedPixelStageV26(stage)) return 1;
    return clamp(1 / editorStageMetricsV26(stage).fitScale, EDITOR_ZOOM_MIN_V26, EDITOR_ZOOM_MAX_V26);
  }
  function editorViewportV26(zoom, mode) {
    const stage = currentStageData();
    const z = clamp(Number(zoom) || 1, EDITOR_ZOOM_MIN_V26, EDITOR_ZOOM_MAX_V26);
    if (!isUnifiedPixelStageV26(stage)) return { w:1 / z, h:1 / z, mode:'legacy', zoom:z };
    const metrics = editorStageMetricsV26(stage);
    const runtimeW = (BASE_W * metrics.scale) / metrics.stageW;
    const runtimeH = (BASE_H * metrics.scale) / metrics.stageH;
    if (mode === 'runtime') {
      return { w:runtimeW, h:runtimeH, mode:'runtime', zoom:runtimeEditorZoomV26(stage), fitScale:metrics.fitScale };
    }
    return {
      w:runtimeW / (metrics.fitScale * z),
      h:runtimeH / (metrics.fitScale * z),
      mode:mode === 'overview' ? 'overview' : 'custom',
      zoom:z,
      fitScale:metrics.fitScale
    };
  }
  function activeEditorViewportV26(zoomOverride, modeOverride) {
    if (!state.enabled && zoomOverride === undefined) return { w:VIEWPORT_W, h:VIEWPORT_H, mode:'game' };
    return editorViewportV26(
      zoomOverride === undefined ? state.editorZoom : zoomOverride,
      modeOverride === undefined ? (state.editorViewMode || 'custom') : modeOverride
    );
  }
  function viewportW() { return activeEditorViewportV26().w; }
  function viewportH() { return activeEditorViewportV26().h; }
  function clampCameraAxisV26(value, span) {
    if (!Number.isFinite(span) || span >= 1) return 0.5;
    return clamp(value, span / 2, 1 - span / 2);
  }
  function clampCamera() {
    const view = activeEditorViewportV26();
    state.editorCamX = clampCameraAxisV26(state.editorCamX, view.w);
    state.editorCamY = clampCameraAxisV26(state.editorCamY, view.h);
  }
  function setRuntimeEditorViewV26(focusX, focusY, refresh) {
    const stage = currentStageData();
    state.editorViewMode = isUnifiedPixelStageV26(stage) ? 'runtime' : 'custom';
    state.editorZoom = runtimeEditorZoomV26(stage);
    if (Number.isFinite(Number(focusX))) state.editorCamX = Number(focusX);
    if (Number.isFinite(Number(focusY))) state.editorCamY = Number(focusY);
    clampCamera(); camX = state.editorCamX; camY = state.editorCamY;
    if (refresh !== false && typeof refreshAll === 'function') refreshAll();
    return activeEditorViewportV26();
  }
  window.BD_getEditorViewportV26 = function (zoom, mode) { return activeEditorViewportV26(zoom, mode); };
  window.BD_getRuntimeEditorZoomV26 = function () { return runtimeEditorZoomV26(currentStageData()); };
  window.BD_setEditorRuntimeViewV26 = function (focusX, focusY) { return setRuntimeEditorViewV26(focusX, focusY, true); };

  function normalizeStage(stage) {
    if (!stage.objects) stage.objects = [];
    if (!stage.exits) stage.exits = {};
    ['top','bottom','left','right'].forEach(function (dir) {
      if (!stage.exits[dir]) stage.exits[dir] = { active:false, nextStage:1, entryX:0.5, entryY:0.5 };
      if (stage.exits[dir].entryX === undefined) stage.exits[dir].entryX = 0.5;
      if (stage.exits[dir].entryY === undefined) stage.exits[dir].entryY = 0.5;
    });
    if (stage.spawnX === undefined) stage.spawnX = 0.5;
    if (stage.spawnY === undefined) stage.spawnY = 0.8;
    stage.objects.forEach(function (o, i) {
      if (!o._editorId) o._editorId = 'obj_' + Date.now().toString(36) + '_' + i.toString(36);
      // _purified는 플레이 중에만 쓰는 임시 표시다. 에디터 저장 데이터에 남아 있으면
      // 새 게임/진행 초기화 후에도 위험요소가 정화된 것으로 보이는 문제가 생긴다.
      if (Object.prototype.hasOwnProperty.call(o, '_purified')) delete o._purified;
    });
  }

  function applyStageData(stages) {
    // (v249) 자가 복구 — 과거 버그로 저장된 음수/NaN 크기를 로드 시 정상화
    var __sanitize = function (stagesObj) {
      try {
        Object.keys(stagesObj || {}).forEach(function (sid) {
          var st = stagesObj[sid]; if (!st || !st.objects) return;
          st.objects.forEach(function (o) {
            if (!o) return;
            ['rw','rh','cw','ch'].forEach(function (k) {
              if (o[k] === undefined) return;
              var v = Number(o[k]);
              if (isNaN(v)) { o[k] = (k==='rw'||k==='cw') ? 0.08 : 0.08; return; }
              if (v < 0) v = Math.abs(v);
              if ((k==='rw'||k==='rh') && v < 0.005) v = 0.005;
              o[k] = Math.min(1, v);
            });
            ['rx','ry','cx','cy'].forEach(function (k) {
              if (o[k] === undefined) return;
              var v = Number(o[k]);
              if (isNaN(v)) { o[k] = 0.5; return; }
              o[k] = Math.min(1, Math.max(0, v));
            });
          });
        });
      } catch (e) { }
    };
    __sanitize(arguments[0]);
    Object.keys(STAGES).forEach(function (key) { delete STAGES[key]; });
    Object.keys(stages).forEach(function (key) { STAGES[key] = stages[key]; normalizeStage(STAGES[key]); });
  }

  function exportableData() {
    const d = { version: 2, savedAt: new Date().toISOString(), stages: cloneData(STAGES) };
    // 플레이 중 붙은 정화 임시 플래그를 맵 편집 데이터에 영구 저장하지 않는다.
    Object.keys(d.stages).forEach(function (key) {
      const st = d.stages[key];
      if (!st || !Array.isArray(st.objects)) return;
      st.objects.forEach(function (o) {
        if (o && Object.prototype.hasOwnProperty.call(o, '_purified')) delete o._purified;
      });
    });
    // NPC 위치 저장 (에디터로 옮긴 NPC 좌표 유지)
    try {
      d.npcPos = {};
      if (typeof NPC_X !== 'undefined') { d.npcPos.hyunji = { x:NPC_X, y:NPC_Y }; }
      if (typeof QNPC_X !== 'undefined') { d.npcPos.dohyun = { x:QNPC_X, y:QNPC_Y }; }
      // (v266) 시작맵(문화의집) 프롤로그 안내 NPC 위치도 저장 — 코드가 매 시작마다
      //  하드코딩 좌표(0.545/0.100)로 재생성해 '옮겨도 원위치'였던 문제의 해결.
      try {
        var __st101 = STAGES[101] || STAGES['101'];
        var __tt = (__st101 && __st101.objects) ? __st101.objects.find(function (o) { return o && o._tut2npc; }) : null;
        if (__tt) { d.npcPos.tutor = { x: __tt.rx, y: __tt.ry }; window.__bdTutorPos = d.npcPos.tutor; }
        else if (window.__bdTutorPos) { d.npcPos.tutor = window.__bdTutorPos; }
      } catch (eT) { }
    } catch(e){}
    return d;
  }
  window.__bdExportableData = exportableData;   // (v262) 게시용 내보내기가 '화면 그대로'를 굽도록 노출
  function saveData(show) {
    // (v245) 다중 창/탭 충돌 가드 — 다른 창에서 더 새로 저장된 데이터가 있으면 덮어쓰기 전에 확인.
    try {
      var _cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      var _curAt = _cur ? (Date.parse(_cur.savedAt) || 0) : 0;
      var _known = window.__bdKnownSavedAt || 0;
      if (_curAt > _known + 1500) {
        var okOver = confirm('다른 창(탭)에서 더 최근에 저장된 맵 데이터가 있습니다.\n지금 이 창의 내용으로 덮어쓸까요?\n\n(취소하면 저장하지 않습니다 — 다른 창에서 계속 작업하세요)');
        if (!okOver) { if (show !== false) toast('저장 취소됨 (다른 창의 최신 데이터 유지)'); return; }
      }
    } catch (e) { }
    // (v28) 쿼터 폴백 — 공간 부족이면 레거시·백업 키를 비우고 재시도, 그래도 안 되면 명확히 알린다
    (function(){
      var payload = JSON.stringify(exportableData());
      try { localStorage.setItem(STORAGE_KEY, payload); return; }
      catch(eQ1) {}
      try {
        ['bongdam_rpg_editor_assets_v3','bongdam_rpg_editor_assets_v35','bongdam_rpg_editor_assets_v37',
         'bongdam_rpg_editor_assets_v3_7','bongdam_rpg_editor_assets_v3_9',
         STORAGE_KEY + '_prev'].forEach(function(k){ try{ localStorage.removeItem(k); }catch(e2){} });
        localStorage.setItem(STORAGE_KEY, payload); 
        try{ toast('저장 공간을 정리하고 저장했습니다'); }catch(e3){}
        return;
      } catch(eQ2) {}
      try{ toast('⚠ 저장 실패: 브라우저 저장 공간 부족 — 내보내기(JSON)로 백업하세요'); }catch(e4){}
      try{ console.error('[에디터] 저장 실패(쿼터 부족)'); }catch(e5){}
    })();
    try { window.__bdKnownSavedAt = Date.parse(JSON.parse(localStorage.getItem(STORAGE_KEY)).savedAt) || Date.now(); } catch (e) { window.__bdKnownSavedAt = Date.now(); }
    if (show !== false) {
      var _hh = new Date(); var _p2 = function(n){return (n<10?'0':'')+n;};
      toast('저장 완료 · ' + _p2(_hh.getHours()) + ':' + _p2(_hh.getMinutes()) + ':' + _p2(_hh.getSeconds())
        + ' — 재시작 후 파일 바 시각이 이와 같아야 정상');
    }
  }

  // =====================================================================
  // 개선: Undo/Redo 히스토리 시스템
  //  - 편집(추가/삭제/복제/이동완료 등) '직전'에 pushHistory()로 현재 STAGES 스냅샷 저장
  //  - Ctrl+Z: undo, Ctrl+Y / Ctrl+Shift+Z: redo
  // =====================================================================
  function _snapshotStages() {
    // (v268) 안전화 — 현재 스테이지만 스냅샷 (전체 맵 통째 롤백 방지)
    const sid = String(typeof currentStage !== 'undefined' ? currentStage : 1);
    return JSON.stringify({ __oneStage: sid, st: STAGES[sid] || null });
  }
  function _restoreStages(json) {
    try {
      const data = JSON.parse(json);
      if (data && data.__oneStage && data.st) {
        STAGES[data.__oneStage] = data.st;
        normalizeStage(STAGES[data.__oneStage]);
      } else if (data && typeof data === 'object') {
        const sid = String(typeof currentStage !== 'undefined' ? currentStage : 1);
        if (data[sid]) { STAGES[sid] = data[sid]; normalizeStage(STAGES[sid]); }
      }
    } catch (e) {}
  }
  function pushHistory() {
    try {
      state._history.push(_snapshotStages());
      if (state._history.length > state._histLimit) state._history.shift();
      state._future.length = 0; // 새 편집이 일어나면 redo 스택 비움
      _updateHistBtns();
    } catch (e) {}
  }
  function doUndo() {
    if (!state._history.length) { toast('되돌릴 작업이 없어요'); return; }
    state._future.push(_snapshotStages());
    _restoreStages(state._history.pop());
    // 선택 인덱스 안전화
    const list = currentObjects();
    if (state.selectedIndex >= list.length) state.selectedIndex = -1;
    refreshAll(); saveData(false); _updateHistBtns(); toast('↩ 되돌리기');
  }
  function doRedo() {
    if (!state._future.length) { toast('다시 실행할 작업이 없어요'); return; }
    state._history.push(_snapshotStages());
    _restoreStages(state._future.pop());
    const list = currentObjects();
    if (state.selectedIndex >= list.length) state.selectedIndex = -1;
    refreshAll(); saveData(false); _updateHistBtns(); toast('↪ 다시 실행');
  }
  function _updateHistBtns() {
    const u = $('bge-undo'), r = $('bge-redo');
    if (u) u.disabled = state._history.length === 0;
    if (r) r.disabled = state._future.length === 0;
  }

  // 개선: 그리드 스냅 헬퍼
  function snapVal(v) {
    if (!state.gridSnap) return v;
    const g = state.gridSize || 0.05;
    return Math.round(v / g) * g;
  }
  function toggleGrid() {
    state.gridSnap = !state.gridSnap;
    const b = $('bge-grid-toggle');
    if (b) { b.textContent = state.gridSnap ? '⊞ 격자 ON' : '⊞ 격자 OFF'; b.classList.toggle('bge-on', state.gridSnap); }
    toast(state.gridSnap ? '격자 맞춤 켜짐' : '격자 맞춤 꺼짐');
    refreshAll();
  }

  // 개선: 복사 / 붙여넣기
  function copySelected() {
    const obj = selectedObject();
    if (!obj) { toast('복사할 오브젝트를 먼저 선택하세요'); return; }
    state._clipboard = cloneData(obj);
    toast('📋 복사됨: ' + (obj.label || '오브젝트'));
  }
  function pasteClipboard() {
    if (!state._clipboard) { toast('붙여넣을 것이 없어요 (먼저 Ctrl+C)'); return; }
    const st = currentStageData(); if (!st) return;
    pushHistory();
    const obj = cloneData(state._clipboard);
    obj.rx = clamp01((obj.rx || 0.5) + 0.03);
    obj.ry = clamp01((obj.ry || 0.5) + 0.03);
    if (typeof obj.cx === 'number') obj.cx = clamp01(obj.cx + 0.03);
    if (typeof obj.cy === 'number') obj.cy = clamp01(obj.cy + 0.03);
    if (obj.label) obj.label = obj.label + ' 복사';
    st.objects.push(obj);
    state.selectedIndex = st.objects.length - 1; state.selectedPart = 'object';
    refreshAll(); saveData(false); toast('📎 붙여넣기: ' + (obj.label || '오브젝트'));
  }

  // =====================================================================
  // 개선: 통합 탭 (배치목록 / 속성·이미지 / 대화) - 한 번에 하나만 표시
  // =====================================================================
  state.activeTab = 'hierarchy';
  function switchTab(tab) {
    state.activeTab = tab;
    const H = $('bge-hierarchy'), P = $('bge-panel'), V = $('bge-v3-panel');
    // (v240k) 유니티식 도킹: 배치 목록(좌 하이어라키)·속성(우 인스펙터)은 항상 열어 둔다.
    //  탭은 대화/이미지 패널 토글과 강조 표시용으로만 쓴다.
    if (H) H.classList.add('bge-open');
    if (P) P.classList.add('bge-open');
    if (V) V.classList.toggle('bge-open', tab === 'dialog');
    [['bge-tab-hierarchy','hierarchy'],['bge-tab-props','props'],['bge-tab-dialog','dialog']].forEach(([id,t])=>{
      const b = $(id); if (b) b.classList.toggle('bge-tab-on', tab === t);
    });
  }
  // (v239) 이름표 중복 경고 — 같은 id가 둘이면 코드가 엉뚱한 걸 집는다
  function refreshNameIdWarn() {
    const box = $('bge-name-id-warn'); if (!box) return;
    const el = $('bge-obj-name-id'); if (!el) { box.style.display = 'none'; return; }
    const v = String(el.value || '').trim();
    if (!v) { box.style.display = 'none'; return; }
    let hits = 0;
    try {
      Object.keys(STAGES).forEach(function (sid) {
        const st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function (o) { if (o && o.nameId === v) hits++; });
      });
    } catch (e) { }
    if (hits > 1) { box.textContent = '⚠ 같은 이름표가 ' + hits + '개 있습니다 — 하나만 남기세요'; box.style.display = 'block'; }
    else { box.style.display = 'none'; }
  }

  function toggleSimpleMode() {
    const on = !document.body.classList.contains('bge-simple');
    document.body.classList.toggle('bge-simple', on);
    const b = $('bge-tab-simple'); if (b) b.classList.toggle('bge-tab-on', on);
    toast(on ? '🌱 쉬운 모드: 어려운 항목을 숨겼어요' : '🔬 전문가 모드: 모든 항목 표시');
  }

  // =====================================================================
  // 개선: 프리팹 — 자주 쓰는 오브젝트를 저장해 재사용
  // =====================================================================
  const PREFAB_KEY = 'bongdam_rpg_editor_prefabs_v1';
  function loadPrefabs() {
    try { return JSON.parse(localStorage.getItem(PREFAB_KEY) || '[]'); } catch (e) { return []; }
  }
  function savePrefabs(arr) {
    try { localStorage.setItem(PREFAB_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function savePrefabFromSelection() {
    const obj = selectedObject();
    if (!obj) { toast('먼저 저장할 오브젝트를 선택하세요'); return; }
    const arr = loadPrefabs();
    const clean = cloneData(obj);
    // 위치 정보는 프리팹에 불필요 (배치할 때 새로 지정)
    delete clean.cx; delete clean.cy;
    const name = (clean.label || clean.type || '오브젝트');
    arr.push({ name: name, data: clean });
    savePrefabs(arr);
    renderPrefabs();
    toast('⭐ 프리팹 저장: ' + name);
  }
  function placePrefab(idx) {
    const arr = loadPrefabs();
    const pf = arr[idx]; if (!pf) return;
    const st = currentStageData(); if (!st) return;
    pushHistory();
    const obj = cloneData(pf.data);
    // 화면 중앙 근처에 배치
    obj.rx = clamp01((typeof camX !== 'undefined' ? camX : 0.5));
    obj.ry = clamp01((typeof camY !== 'undefined' ? camY : 0.5));
    st.objects.push(obj);
    state.selectedIndex = st.objects.length - 1; state.selectedPart = 'object';
    refreshAll(); saveData(false); toast('📍 배치: ' + (pf.name || '프리팹'));
  }
  function deletePrefab(idx) {
    const arr = loadPrefabs();
    if (idx < 0 || idx >= arr.length) return;
    const nm = arr[idx].name;
    arr.splice(idx, 1); savePrefabs(arr); renderPrefabs();
    toast('프리팹 삭제: ' + nm);
  }
  function renderPrefabs() {
    const box = $('bge-prefab-list'); if (!box) return;
    const arr = loadPrefabs();
    if (!arr.length) { box.innerHTML = '<div class="bge-muted" style="padding:6px 2px;font-size:11px">아직 저장한 프리팹이 없어요.</div>'; return; }
    box.innerHTML = arr.map((pf, i) =>
      '<div class="bge-prefab-item">'
      + '<button class="bge-prefab-place" data-pf="' + i + '" title="맵에 놓기">📍 ' + (pf.name || '프리팹') + '</button>'
      + '<button class="bge-prefab-del" data-pfdel="' + i + '" title="삭제">✕</button>'
      + '</div>'
    ).join('');
    box.querySelectorAll('[data-pf]').forEach(b => b.addEventListener('click', () => placePrefab(Number(b.getAttribute('data-pf')))));
    box.querySelectorAll('[data-pfdel]').forEach(b => b.addEventListener('click', () => deletePrefab(Number(b.getAttribute('data-pfdel')))));
  }

  // =====================================================================
  // 개선: 미니맵 — 전체 맵의 오브젝트 위치를 한눈에, 클릭 시 그 위치로 이동
  // =====================================================================
  function renderMinimap() {
    const cvs = $('bge-mm-canvas'); if (!cvs) return;
    const ctx = cvs.getContext('2d'); if (!ctx) return;
    const W = cvs.width, H = cvs.height;
    ctx.clearRect(0, 0, W, H);
    // 배경 격자
    ctx.strokeStyle = 'rgba(240,184,48,0.12)'; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(W*i/4, 0); ctx.lineTo(W*i/4, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, H*i/4); ctx.lineTo(W, H*i/4); ctx.stroke(); }
    // 오브젝트 점
    const list = currentObjects();
    list.forEach((o, i) => {
      const x = (o.rx || 0) * W, y = (o.ry || 0) * H;
      const isSel = i === state.selectedIndex;
      ctx.fillStyle = isSel ? '#ffd84d' : (o.interactable ? '#7ad0ff' : '#c8902a');
      ctx.beginPath(); ctx.arc(x, y, isSel ? 4.5 : 3, 0, Math.PI*2); ctx.fill();
      if (isSel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
    });
    // 스폰 위치 (별)
    const st = currentStageData();
    if (st && typeof st.spawnX === 'number') {
      ctx.fillStyle = '#8effa0';
      ctx.beginPath(); ctx.arc(st.spawnX*W, st.spawnY*H, 3.5, 0, Math.PI*2); ctx.fill();
    }
    // 현재 카메라 뷰 사각형
    if (state.enabled && typeof camX !== 'undefined') {
      const vw = viewportW() * W, vh = viewportH() * H;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(camX*W - vw/2, camY*H - vh/2, vw, vh);
    }
  }
  function bindMinimap() {
    const cvs = $('bge-mm-canvas'); if (!cvs || cvs._bound) return; cvs._bound = true;
    cvs.addEventListener('click', function (e) {
      const rect = cvs.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width, my = (e.clientY - rect.top) / rect.height;
      // 클릭한 위치로 카메라 이동
      camX = clamp01(mx); camY = clamp01(my);
      state.editorCamX = camX; state.editorCamY = camY;
      if (typeof clampCamera === 'function') clampCamera();
      refreshAll();
    });
  }

  // =====================================================================
  // 개선: 패널을 드래그해서 자유롭게 옮기기 (겹침 해소)
  //  - 각 패널의 헤더를 손잡이로, 마우스/터치 모두 지원
  //  - 위치는 localStorage에 저장되어 다음에도 유지
  //  - 화면 밖으로 나가지 않게 제한
  // =====================================================================
  const PANEL_POS_KEY = 'bongdam_rpg_editor_panel_pos_v1';
  function loadPanelPos() { try { return JSON.parse(localStorage.getItem(PANEL_POS_KEY) || '{}'); } catch (e) { return {}; } }
  function savePanelPos(obj) { try { localStorage.setItem(PANEL_POS_KEY, JSON.stringify(obj)); } catch (e) {} }
  function applyPanelPos(panelId) {
    const pos = loadPanelPos()[panelId];
    const el = $(panelId); if (!el || !pos) return;
    el.style.left = pos.left + 'px';
    el.style.top = pos.top + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
  }
  function makeDraggable(panelId, handle) {
    const el = $(panelId); if (!el || !handle || handle._dragBound) return;
    handle._dragBound = true;
    handle.classList.add('bge-draghead');
    let sx = 0, sy = 0, startLeft = 0, startTop = 0, active = false;

    function pointerXY(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    function onDown(e) {
      // 버튼/입력 요소를 눌렀을 땐 드래그 안 함
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      if (['button','input','select','textarea','a'].includes(tag)) return;
      active = true;
      const p = pointerXY(e);
      const rect = el.getBoundingClientRect();
      startLeft = rect.left; startTop = rect.top;
      sx = p.x; sy = p.y;
      el.classList.add('bge-dragging');
      e.preventDefault(); e.stopPropagation();
      document.addEventListener('mousemove', onMove, true);
      document.addEventListener('mouseup', onUp, true);
      document.addEventListener('touchmove', onMove, { passive: false, capture: true });
      document.addEventListener('touchend', onUp, true);
    }
    function onMove(e) {
      if (!active) return;
      const p = pointerXY(e);
      let nl = startLeft + (p.x - sx);
      let nt = startTop + (p.y - sy);
      // 화면 밖으로 완전히 사라지지 않게 제한 (최소 40px는 보이게)
      const w = el.offsetWidth, h = el.offsetHeight;
      const maxL = window.innerWidth - 40, maxT = window.innerHeight - 40;
      nl = Math.max(-(w - 60), Math.min(nl, maxL));
      nt = Math.max(0, Math.min(nt, maxT));
      el.style.left = nl + 'px'; el.style.top = nt + 'px';
      el.style.right = 'auto'; el.style.bottom = 'auto';
      e.preventDefault();
    }
    function onUp() {
      if (!active) return;
      active = false;
      el.classList.remove('bge-dragging');
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      document.removeEventListener('touchmove', onMove, { capture: true });
      document.removeEventListener('touchend', onUp, true);
      // 위치 저장
      const rect = el.getBoundingClientRect();
      const all = loadPanelPos();
      all[panelId] = { left: Math.round(rect.left), top: Math.round(rect.top) };
      savePanelPos(all);
    }
    handle.addEventListener('mousedown', onDown, true);
    handle.addEventListener('touchstart', onDown, { passive: false, capture: true });
  }
  function setupPanelDragging() {
    // 각 패널의 헤더(h3) 또는 지정 손잡이를 드래그 핸들로
    const H = $('bge-hierarchy'); if (H) { const h = H.querySelector('h3'); if (h) makeDraggable('bge-hierarchy', h); applyPanelPos('bge-hierarchy'); }
    const P = $('bge-panel'); if (P) { const h = P.querySelector('h3'); if (h) makeDraggable('bge-panel', h); applyPanelPos('bge-panel'); }
    const V = $('bge-v3-panel'); if (V) { const h = V.querySelector('h3'); if (h) makeDraggable('bge-v3-panel', h); applyPanelPos('bge-v3-panel'); }
    const M = $('bge-minimap'); if (M) { const h = M.querySelector('.bge-mm-title'); if (h) makeDraggable('bge-minimap', h); applyPanelPos('bge-minimap'); }
    // v49 강제 목록 패널도 드래그 가능하게 (화면 왼쪽을 덮는 큰 패널)
    const D = $('bge-v49-dock'); if (D) { const h = D.querySelector('h3'); if (h) makeDraggable('bge-v49-dock', h); applyPanelPos('bge-v49-dock'); }
  }
  function resetPanelPos() {
    try { localStorage.removeItem(PANEL_POS_KEY); } catch (e) {}
    ['bge-hierarchy','bge-panel','bge-v3-panel','bge-minimap','bge-v49-dock'].forEach(id => {
      const el = $(id); if (!el) return;
      el.style.left = ''; el.style.top = ''; el.style.right = ''; el.style.bottom = '';
    });
    toast('📐 패널 위치를 기본값으로 되돌렸어요');
  }

  function loadSavedData() {
    // (v260) 게시본 고정 — 게시용 파일은 저장소와 무관하게 항상 구운 JSON만 표시
    if (window.__BD_FORCE_BAKED && window.__BD_BAKED_STAGE_RAW) {
      try {
        var __fb = JSON.parse(window.__BD_BAKED_STAGE_RAW);
        if (__fb && __fb.stages) {
          applyStageData(__fb.stages);
          try { if (__fb.npcPos) {
            if (__fb.npcPos.hyunji && typeof NPC_X !== 'undefined') { NPC_X = __fb.npcPos.hyunji.x; NPC_Y = __fb.npcPos.hyunji.y; }
            if (__fb.npcPos.dohyun && typeof QNPC_X !== 'undefined') { QNPC_X = __fb.npcPos.dohyun.x; QNPC_Y = __fb.npcPos.dohyun.y; }
            if (__fb.npcPos.tutor) { window.__bdTutorPos = __fb.npcPos.tutor; }
          } } catch (eN) { }
          return;
        }
      } catch (eF) { }
    }
    // (v246) 미리보기 폴백 — localStorage가 없거나 비어 있으면 구운 RAW를 직접 사용
    var __lsRaw = null;
    try { __lsRaw = localStorage.getItem(STORAGE_KEY); } catch (e) { }
    if (!__lsRaw && window.__BD_BAKED_STAGE_RAW) {
      try {
        var __bd = JSON.parse(window.__BD_BAKED_STAGE_RAW);
        if (__bd && __bd.stages) { applyStageData(__bd.stages); if (__bd.npcPos) window.__bdNpcPos = __bd.npcPos; }
        console.warn('[BGE] localStorage 불가/비어있음 — 구운 데이터로 표시 중 (이 환경에선 저장이 유지되지 않을 수 있습니다)');
        return;
      } catch (e) { }
    }
    try { var __d0 = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); window.__bdKnownSavedAt = __d0 ? (Date.parse(__d0.savedAt) || 0) : 0; } catch (e) { window.__bdKnownSavedAt = 0; }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);   // (v269) 고대 키 폴백 제거 — 옛 데이터 부활 경로 차단
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.stages) { applyStageData(parsed.stages); toast('저장된 에디터 데이터 불러옴'); }
      // ── 퀘스트 필수 위험요소 복구 ──
      // 옛 버전에서 저장된 에디터 데이터에는 이후 추가된 위험요소가 없어서
      // 게임 진행(정화 목표)이 불가능해진다. 기본 스냅샷에서 빠진 hazard를 다시 주입.
      try {
        const snap = window.__BD_DEFAULT_HAZARDS || {};
        let injected = 0;
        Object.keys(snap).forEach(function(sid){
          if (!STAGES[sid]) return;               // 스테이지 자체가 삭제됐으면 건드리지 않음
          if (!STAGES[sid].objects) STAGES[sid].objects = [];
          const have = {};
          STAGES[sid].objects.forEach(function(o){ if(o && o.hazardId) have[o.hazardId] = true; });
          const tomb = Array.isArray(STAGES[sid].deletedHazardIds) ? STAGES[sid].deletedHazardIds : [];
          snap[sid].forEach(function(h){
            if (tomb.indexOf(h.hazardId) >= 0) return;   // (v269) 사용자가 에디터로 지운 위험요소는 되살리지 않음
            if (!have[h.hazardId]) { STAGES[sid].objects.push(JSON.parse(JSON.stringify(h))); injected++; }
          });
        });
        if (injected > 0) toast('🧩 퀘스트 위험요소 ' + injected + '개 복구됨');
      } catch(e){ console.warn('위험요소 복구 실패:', e); }
      // NPC 위치 복원
      if (parsed && parsed.npcPos) {
        try {
          if (parsed.npcPos.hyunji && typeof NPC_X !== 'undefined') { NPC_X = parsed.npcPos.hyunji.x; NPC_Y = parsed.npcPos.hyunji.y; }
          if (parsed.npcPos.dohyun && typeof QNPC_X !== 'undefined') { QNPC_X = parsed.npcPos.dohyun.x; QNPC_Y = parsed.npcPos.dohyun.y; }
          if (parsed.npcPos.tutor) { window.__bdTutorPos = parsed.npcPos.tutor; }   // (v266)
        } catch(e){}
      }
    } catch (err) { console.warn('에디터 저장 데이터 로드 실패:', err); }
  }

  function currentStageData() { const cs = (typeof currentStage !== 'undefined') ? currentStage : stageIds()[0]; const st = STAGES[cs] || STAGES[stageIds()[0]]; if (st) normalizeStage(st); return st; }
  function currentObjects() { const st = currentStageData(); return st ? st.objects : []; }
  function selectedObject() { const list = currentObjects(); return state.selectedIndex >= 0 && state.selectedIndex < list.length ? list[state.selectedIndex] : null; }
  function hasCollider(o) { return o && o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined; }
  function getRect(o, part) { if (part === 'collider' && hasCollider(o)) return { x:o.cx, y:o.cy, w:o.cw, h:o.ch }; return { x:o.rx || 0, y:o.ry || 0, w:o.rw || 0.01, h:o.rh || 0.01 }; }

  function screenToMap(clientX, clientY) {
    const canvas = $('game-canvas'); const rect = canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) * (canvas.width / rect.width);
    const sy = (clientY - rect.top) * (canvas.height / rect.height);
    const baseX = (sx - canvas.width / 2) / currentScale + BASE_W / 2;
    const baseY = (sy - canvas.height / 2) / currentScale + BASE_H / 2;
    return { x: clamp01((baseX / BASE_W - 0.5) * viewportW() + camX), y: clamp01((baseY / BASE_H - 0.5) * viewportH() + camY) };
  }

  function collectHits(mapX, mapY) {
    // (v43) 클릭 지점에 겹친 모든 후보를 위→아래 순서로 수집 (기존 hitTest 규칙 유지)
    const list = currentObjects();
    const hits = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i];
      // (v45) 순환 후보 수집 — 본체를 먼저, 콜라이더를 그다음에 넣어
      //  '클릭1=본체 → 클릭2=콜라이더 → 클릭3=아래 오브젝트' 순서가 되게 한다.
      const r = getRect(o, 'object');
      let bodyHit = false;
      if (o.resident) {   // (v186) 주민은 판정 영역 확장
        const padW = Math.max(0, (0.06 - (r.w || 0)) / 2);
        const hx = r.x - padW, hw = (r.w || 0) + padW * 2;
        const hy = r.y - 0.02, hh = (r.h || 0) + 0.04;
        bodyHit = (mapX >= hx && mapX <= hx + hw && mapY >= hy && mapY <= hy + hh);
      }
      if (!bodyHit) bodyHit = (mapX >= r.x && mapX <= r.x + r.w && mapY >= r.y && mapY <= r.y + r.h);
      if (bodyHit) hits.push({ index:i, part:'object' });
      if (hasCollider(o)) {
        const c = getRect(o, 'collider');
        const inCol = (mapX >= c.x && mapX <= c.x + c.w && mapY >= c.y && mapY <= c.y + c.h);
        // (v45) 콜라이더가 본체 안에 완전히 겹쳐 있어도 반복 클릭 순환으로 도달할 수 있어야 한다.
        //  (v252가 막으려던 '첫 클릭에 콜라이더가 가로채는 문제'는 본체가 앞 순서라 자연 해결)
        if (inCol) hits.push({ index:i, part:'collider' });
      }
    }
    return hits;
  }
  function hitTest(mapX, mapY) {
    // (v48) 순환은 mousedown 쪽(파트 인식)에서 일원화 — 여기는 최상위 후보만 반환
    const hits = collectHits(mapX, mapY);
    return hits.length ? hits[0] : { index:-1, part:'object' };
  }

  // 개선: 캐릭터/시작위치/허수아비 등 '가상 오브젝트'도 맵에서 클릭·드래그 가능
  //  objects 배열에 없는 특수 대상들을 클릭 판정에 포함
  function virtualTargets() {
    const st = currentStageData(); if (!st) return [];
    const arr = [];
    // 플레이어 캐릭터 (heroX/heroY)
    if (typeof heroX !== 'undefined' && typeof heroY !== 'undefined') {
      arr.push({ vid:'player', label:'플레이어 캐릭터', getX:()=>heroX, getY:()=>heroY, setX:(v)=>{heroX=v;}, setY:(v)=>{heroY=v;}, w:0.06, h:0.09 });
    }
    // 시작 위치 (spawnX/spawnY)
    arr.push({ vid:'spawn', label:'시작 위치', getX:()=>st.spawnX||0.5, getY:()=>st.spawnY||0.8, setX:(v)=>{st.spawnX=v;}, setY:(v)=>{st.spawnY=v;}, w:0.05, h:0.05 });
    // 허수아비 (해당 스테이지에서만)
    if (typeof SCARECROW_SPAWN_X !== 'undefined' && typeof SCARECROW_SPAWN_STAGE !== 'undefined' && (typeof currentStage === 'undefined' || currentStage === SCARECROW_SPAWN_STAGE)) {
      arr.push({ vid:'scarecrow', label:'허수아비', getX:()=>SCARECROW_SPAWN_X, getY:()=>SCARECROW_SPAWN_Y, setX:(v)=>{ if(typeof SCARECROW_SPAWN_X!=='undefined') window.SCARECROW_SPAWN_X=v; }, setY:(v)=>{ if(typeof SCARECROW_SPAWN_Y!=='undefined') window.SCARECROW_SPAWN_Y=v; }, w:0.06, h:0.09 });
    }
    // NPC 임현지 (에디터에서 이동 가능 — NPC_X/Y가 같은 스코프의 let)
    if (typeof NPC_X !== 'undefined' && typeof NPC_Y !== 'undefined') {
      arr.push({ vid:'npc_hyunji', label:'NPC 임현지', getX:()=>NPC_X, getY:()=>NPC_Y, setX:(v)=>{ NPC_X=v; }, setY:(v)=>{ NPC_Y=v; }, w:0.06, h:0.10 });
    }
    // 퀘스트 NPC 사서 도현 (해당 스테이지에서만, 이동 가능)
    if (typeof QNPC_X !== 'undefined' && typeof QNPC_Y !== 'undefined' && (typeof QNPC_STAGE === 'undefined' || typeof currentStage === 'undefined' || currentStage === QNPC_STAGE)) {
      arr.push({ vid:'npc_dohyun', label:'NPC 사서 도현', getX:()=>QNPC_X, getY:()=>QNPC_Y, setX:(v)=>{ QNPC_X=v; }, setY:(v)=>{ QNPC_Y=v; }, w:0.06, h:0.10 });
    }
    return arr;
  }
  function hitVirtual(mapX, mapY) {
    const vts = virtualTargets();
    for (let i = vts.length - 1; i >= 0; i--) {
      const v = vts[i];
      const cx = v.getX(), cy = v.getY();
      // 중심 기준 사각형으로 판정
      if (mapX >= cx - v.w/2 && mapX <= cx + v.w/2 && mapY >= cy - v.h/2 && mapY <= cy + v.h/2) return v;
    }
    return null;
  }

  function setEditorEnabled(on) {
    const previousCamX = Number(camX), previousCamY = Number(camY);
    state.enabled = !!on;
    state.pickSpawn = false; state.pickEntry = false; state.dragging = false; state.tool = 'select';
    if (typeof moveKeys !== 'undefined') moveKeys = { w:false, a:false, s:false, d:false };
    if (state.enabled) {
      const stage = currentStageData();
      state.editorViewMode = isUnifiedPixelStageV26(stage) ? 'runtime' : 'overview';
      state.editorZoom = isUnifiedPixelStageV26(stage) ? runtimeEditorZoomV26(stage) : 1.0;
      state.editorCamX = Number.isFinite(previousCamX) ? previousCamX : Number(heroX) || 0.5;
      state.editorCamY = Number.isFinite(previousCamY) ? previousCamY : Number(heroY) || 0.5;
      clampCamera(); camX = state.editorCamX; camY = state.editorCamY;
    }
    else { camX = heroX; camY = heroY; state.entryReturnStage = null; }
    $('bge-toggle').classList.toggle('bge-on', state.enabled);
    $('bge-toggle').textContent = state.enabled ? '🛠 에디터 ON' : '🛠 에디터';
    $('bge-toolbar').classList.toggle('bge-open', state.enabled);
    var _tb = $('bge-tabbar'); if (_tb) _tb.classList.toggle('bge-open', state.enabled);
    var _mm = $('bge-minimap'); if (_mm) _mm.classList.toggle('bge-open', state.enabled);
    if (state.enabled) { bindMinimap(); setupPanelDragging(); setTimeout(setupPanelDragging, 300); setTimeout(setupPanelDragging, 900); }
    if (state.enabled) {
      // 기본은 쉬운 모드 + 배치목록 탭
      // (v268) 쉬운 모드 제거 — 항상 전체 편집 모드로 시작
      switchTab(state.activeTab || 'hierarchy');
    } else {
      $('bge-panel').classList.remove('bge-open');
      $('bge-hierarchy').classList.remove('bge-open');
      var _v3 = $('bge-v3-panel'); if (_v3) _v3.classList.remove('bge-open');
    }
    refreshAll(); toast(state.enabled ? '에디터 모드: 전체 맵 보기' : '플레이 모드');
    // 에디터 켜면 봉담 타이틀 숨김, 끄면 게임 안 하는 중이면 타이틀 표시
    try {
      if (state.enabled) {
        if (typeof window.BD_hideTitle === 'function') window.BD_hideTitle();
      } else {
        var gs = document.getElementById('game-screen');
        var inGame = gs && getComputedStyle(gs).display !== 'none';
        if (!inGame && typeof window.BD_showTitle === 'function') {
          window.__bdTitleShown = false;
          window.BD_showTitle({ onStart:function(){}, onContinue:function(){} });
        }
      }
    } catch(e){}
  }

  function toast(message) { const el = $('bge-toast'); el.textContent = message; el.style.display = 'block'; clearTimeout(toast._t); toast._t = setTimeout(function () { el.style.display = 'none'; }, 1600); }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, function (c) { return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[c]; }); }

  function collectKeys() {
    const set = new Set(['small','shop','books','library','school','park','house','tree','wall','sign','custom']);
    Object.values(STAGES).forEach(function (st) { (st.objects || []).forEach(function (o) { if (o.key) set.add(o.key); }); });
    if (typeof objImgMap !== 'undefined') Object.keys(objImgMap).forEach(function (k) { set.add(k); });
    return Array.from(set).sort();
  }

  function refreshTypeSelects() {
    ['bge-obj-type','bge-palette-type'].forEach(function (id) {
      const el = $(id); const prev = el.value; el.innerHTML = '';
      OBJECT_TYPES.forEach(function (t) { const opt = document.createElement('option'); opt.value = t; opt.textContent = t; el.appendChild(opt); });
      if (prev) el.value = prev;
    });
    const keySel = $('bge-palette-key'); const prev = keySel.value; keySel.innerHTML = '';
    collectKeys().forEach(function (k) { const opt = document.createElement('option'); opt.value = k; opt.textContent = k; keySel.appendChild(opt); });
    if (prev) keySel.value = prev;
  }

  function refreshStageSelect() {
    const sel = $('bge-stage-select'); const prev = String((typeof currentStage !== 'undefined') ? currentStage : (stageIds()[0] || '')); sel.innerHTML = '';
    stageIds().forEach(function (id) { const opt = document.createElement('option'); opt.value = id; opt.textContent = id + ' · ' + (STAGES[id].name || '이름 없음'); sel.appendChild(opt); });
    sel.value = prev;
  }

  function refreshStageForm() {
    const st = currentStageData(); if (!st) return;
    $('bge-stage-name').value = st.name || '';
    $('bge-spawn-x').value = Number(st.spawnX || 0).toFixed(3);
    $('bge-spawn-y').value = Number(st.spawnY || 0).toFixed(3);
    const _w = st.walk || {};
    if ($('bge-walk-x0')) $('bge-walk-x0').value = Number(_w.x0 === undefined ? 0.01 : _w.x0).toFixed(3);
    if ($('bge-walk-y0')) $('bge-walk-y0').value = Number(_w.y0 === undefined ? 0.01 : _w.y0).toFixed(3);
    if ($('bge-walk-x1')) $('bge-walk-x1').value = Number(_w.x1 === undefined ? 0.99 : _w.x1).toFixed(3);
    if ($('bge-walk-y1')) $('bge-walk-y1').value = Number(_w.y1 === undefined ? 0.99 : _w.y1).toFixed(3);
    if ($('gs-loc')) $('gs-loc').textContent = st.name || '';
  }

  function refreshCameraForm() {
    if (state.editorViewMode === 'runtime') state.editorZoom = runtimeEditorZoomV26(currentStageData());
    clampCamera(); camX = state.editorCamX; camY = state.editorCamY;
    $('bge-zoom').value = state.editorZoom.toFixed(2);
    $('bge-zoom-label').textContent = state.editorZoom.toFixed(2) + 'x' + (state.editorViewMode === 'runtime' ? ' · 인게임 1:1' : state.editorViewMode === 'overview' ? ' · 전체보기' : '');
    const runtimeButton = $('bge-runtime-view');
    if (runtimeButton) runtimeButton.classList.toggle('bge-on', state.editorViewMode === 'runtime');
    $('bge-cam-x').value = state.editorCamX.toFixed(3);
    $('bge-cam-y').value = state.editorCamY.toFixed(3);
  }

  function refreshObjectList() {
    const box = $('bge-object-list'); const list = currentObjects(); const q = ($('bge-search').value || '').toLowerCase(); box.innerHTML = '';
    if (!list.length) { const empty = document.createElement('div'); empty.className = 'bge-muted'; empty.style.padding = '8px'; empty.textContent = '오브젝트가 없습니다.'; box.appendChild(empty); return; }
    list.forEach(function (obj, index) {
      const name = obj.label || obj.name || obj.type || 'object';
      const hay = (name + ' ' + (obj.type || '') + ' ' + (obj.key || '')).toLowerCase();
      if (q && !hay.includes(q)) return;
      const item = document.createElement('div');
      item.className = 'bge-object-item' + (index === state.selectedIndex && state.selectedPart === 'object' ? ' active' : '');
      item.innerHTML = '<span><span class="bge-eye">' + (obj.hidden ? '🙈' : '👁') + '</span>' + (index + 1) + '. ' + escapeHtml(name) + '</span><span class="bge-muted">' + escapeHtml(obj.type || '-') + '</span>';
      item.addEventListener('click', function () { state.selectedIndex = index; state.selectedPart = 'object'; refreshAll(); });
      box.appendChild(item);
      const child = document.createElement('div');
      child.className = 'bge-object-item bge-child' + (index === state.selectedIndex && state.selectedPart === 'collider' ? ' active' : '');
      // (v241) '없음'이 "충돌이 없다"로 오해되던 표기 수정 — 이 게임은 본체 크기가 곧 충돌 영역이고,
      //  커스텀 콜라이더는 충돌 범위를 그림과 다르게 잡고 싶을 때만 쓰는 선택 사항이다.
      child.innerHTML = '<span>↳ 충돌 영역</span><span class="bge-muted">' + (hasCollider(obj) ? '커스텀' : '본체 크기') + '</span>';
      child.addEventListener('click', function () { state.selectedIndex = index; state.selectedPart = 'collider'; if (!hasCollider(obj)) createCollider(false); refreshAll(); });
      box.appendChild(child);
    });
  }

  function refreshSelectedForm() {
    const obj = selectedObject();
    $('bge-selected-empty').style.display = obj ? 'none' : 'block';
    $('bge-selected-form').style.display = obj ? 'block' : 'none';
    $('bge-collider-form').style.display = obj && hasCollider(obj) ? 'block' : 'none';
    if (!obj) return;
    $('bge-obj-label').value = obj.label || obj.name || '';
    var _nid = $('bge-obj-name-id'); if (_nid) _nid.value = obj.nameId || '';
    if (typeof refreshNameIdWarn === 'function') refreshNameIdWarn();
    $('bge-obj-type').value = obj.type || 'building';
    $('bge-obj-key').value = obj.key || '';
    $('bge-obj-rx').value = Number(obj.rx || 0).toFixed(3);
    $('bge-obj-ry').value = Number(obj.ry || 0).toFixed(3);
    $('bge-obj-rw').value = Number(obj.rw || 0.08).toFixed(3);
    $('bge-obj-rh').value = Number(obj.rh || 0.08).toFixed(3);
    // 개선: % 배지 업데이트 (아이들이 좌표를 % 로 직관 이해)
    (function(){ const pc=v=>'('+Math.round((v||0)*100)+'%)';
      const bx=$('bge-pct-x'),by=$('bge-pct-y'),bw=$('bge-pct-w'),bh=$('bge-pct-h');
      if(bx)bx.textContent=pc(obj.rx); if(by)by.textContent=pc(obj.ry);
      if(bw)bw.textContent=pc(obj.rw); if(bh)bh.textContent=pc(obj.rh); })();
    $('bge-obj-interactable').value = obj.interactable || '';
    $('bge-obj-note').value = obj.note || obj.dialogue || '';
    // 위험 오브젝트 필드
    var _hf = $('bge-obj-hazard-family'); if (_hf) _hf.value = obj.hazardFamily || '';
    var _hi = $('bge-obj-hazard-id'); if (_hi) _hi.value = obj.hazardId || '';
    var _hv = $('bge-obj-hazard-variant'); if (_hv) _hv.value = obj.hazardVariant || '';
    var _hc = $('bge-obj-hazard-count'); if (_hc) _hc.value = String(obj.hazardCount || 1);
    var _ib = $('bge-obj-is-boss'); if (_ib) _ib.checked = !!obj.isBoss;
    var _qt = $('bge-obj-quest-target'); if (_qt) _qt.checked = !!obj.questTarget;
    var _hfield = $('bge-hazard-fields'); if (_hfield) _hfield.style.display = (obj.interactable === 'hazard') ? 'block' : 'none';
    var _nr = $('bge-obj-npc-role'); if (_nr) _nr.value = obj.npcRole || '';
    var _nfield = $('bge-npc-fields'); if (_nfield) _nfield.style.display = (obj.type === 'npc') ? 'block' : 'none';
    if (hasCollider(obj)) {
      $('bge-obj-cx').value = Number(obj.cx).toFixed(3); $('bge-obj-cy').value = Number(obj.cy).toFixed(3); $('bge-obj-cw').value = Number(obj.cw).toFixed(3); $('bge-obj-ch').value = Number(obj.ch).toFixed(3);
    }
  }

  function refreshExitForm() {
    const st = currentStageData(); if (!st) return;
    const dir = $('bge-exit-dir').value || 'top'; const ex = st.exits[dir] || { active:false, nextStage:1, entryX:0.5, entryY:0.5 };
    $('bge-exit-active').checked = !!ex.active; $('bge-exit-next').value = ex.nextStage || 1;
    $('bge-exit-entry-x').value = Number(ex.entryX === undefined ? 0.5 : ex.entryX).toFixed(3);
    $('bge-exit-entry-y').value = Number(ex.entryY === undefined ? 0.5 : ex.entryY).toFixed(3);
    if ($('bge-exit-band-min')) $('bge-exit-band-min').value = Number(ex.bandMin === undefined ? 0.3 : ex.bandMin).toFixed(3);
    if ($('bge-exit-band-max')) $('bge-exit-band-max').value = Number(ex.bandMax === undefined ? 0.7 : ex.bandMax).toFixed(3);
  }

  function refreshAll() { if (typeof STAGES === 'undefined') return; refreshTypeSelects(); refreshStageSelect(); refreshStageForm(); refreshCameraForm(); refreshObjectList(); refreshSelectedForm(); refreshExitForm(); refreshToolButtons(); renderMinimap(); }
  function refreshToolButtons() { ['select','pan','place'].forEach(function (t) { const id = t === 'select' ? 'bge-tool-select' : t === 'pan' ? 'bge-tool-pan' : 'bge-tool-place'; $(id).classList.toggle('bge-on', state.tool === t); $(id).classList.toggle('secondary', state.tool !== t); }); $('bge-place-on').textContent = state.tool === 'place' ? '배치 모드 OFF' : '배치 모드 ON'; }

  function applyStageForm() {
    const st = currentStageData(); if (!st) return;
    // (v242) 롤백 버그 수정 — 예전엔 저장할 때마다 폼의 '화면에 남아 있던 옛 값'으로
    //  이름·시작 위치를 무조건 덮어써서, 찍기·코드로 바꾼 스폰이 저장 순간 되돌아갔다.
    //  이제 사용자가 해당 입력칸을 직접 수정한 경우(dirty)에만 폼 값을 반영한다.
    const nameEl = $('bge-stage-name'), sxEl = $('bge-spawn-x'), syEl = $('bge-spawn-y');
    if (nameEl && nameEl.dataset.bgeDirty === '1') { st.name = nameEl.value.trim() || st.name || '이름 없음'; nameEl.dataset.bgeDirty = ''; }
    if (sxEl && sxEl.dataset.bgeDirty === '1') { st.spawnX = clamp01(sxEl.value); sxEl.dataset.bgeDirty = ''; }
    if (syEl && syEl.dataset.bgeDirty === '1') { st.spawnY = clamp01(syEl.value); syEl.dataset.bgeDirty = ''; }
    ['x0','y0','x1','y1'].forEach(function (k) {
      const el = $('bge-walk-' + k);
      if (el && el.dataset.bgeDirty === '1') {
        if (!st.walk) st.walk = {};
        st.walk[k] = clamp01(el.value);
        el.dataset.bgeDirty = '';
      }
    });
    if ($('gs-loc')) $('gs-loc').textContent = st.name;
    refreshStageSelect();
  }
  // dirty 플래그: 스테이지 폼을 사용자가 직접 입력했을 때만 표시
  ['bge-stage-name','bge-spawn-x','bge-spawn-y'].forEach(function (id) {
    const el = $(id);
    if (el && !el.dataset.bgeDirtyBound) {
      el.dataset.bgeDirtyBound = '1';
      el.addEventListener('input', function () { el.dataset.bgeDirty = '1'; });
      el.addEventListener('change', function () { el.dataset.bgeDirty = '1'; });
    }
  });
  function applyCameraForm(event) { if (event && event.target && event.target.id === 'bge-zoom') state.editorViewMode = 'custom'; state.editorZoom = clamp($('bge-zoom').value, EDITOR_ZOOM_MIN_V26, EDITOR_ZOOM_MAX_V26); state.editorCamX = clamp01($('bge-cam-x').value); state.editorCamY = clamp01($('bge-cam-y').value); clampCamera(); camX = state.editorCamX; camY = state.editorCamY; refreshCameraForm(); }

  // (v243) 롤백·오염 버그 전면 수정 — 예전엔 [저장]마다 폼의 스테일/빈 값으로
  //  선택 오브젝트의 모든 속성(위치·크기·라벨·콜라이더 cx/cy/cw/ch)을 무조건 덮어썼다.
  //  특히 쉬운 모드에선 콜라이더 폼이 숨겨져 빈 값('')이 그대로 들어가
  //  만들어 둔 콜라이더가 저장 순간 파괴되었다. 이제 '사용자가 직접 수정한 필드만' 반영한다.
  function _bgeDirty(id) { const el = $(id); return !!(el && el.dataset.bgeDirty === '1'); }
  function _bgeClr(id) { const el = $(id); if (el) el.dataset.bgeDirty = ''; }
  function _numOr(v, fb) { const n = Number(v); return (v === '' || v === null || isNaN(n)) ? fb : n; }
  function applySelectedForm() {
    const obj = selectedObject(); if (!obj) return;
    const oldRx = obj.rx || 0, oldRy = obj.ry || 0;
    if (_bgeDirty('bge-obj-label')) { obj.label = $('bge-obj-label').value; _bgeClr('bge-obj-label'); }
    if (_bgeDirty('bge-obj-type'))  { obj.type = $('bge-obj-type').value; _bgeClr('bge-obj-type'); }
    if (_bgeDirty('bge-obj-key'))   { obj.key = $('bge-obj-key').value || obj.key; _bgeClr('bge-obj-key'); }
    // (v239) 이름표 id — 코드가 좌표 대신 이 값을 참조한다
    var _nidEl = $('bge-obj-name-id');
    if (_nidEl && _bgeDirty('bge-obj-name-id')) {
      var _nv = String(_nidEl.value || '').trim().replace(/[^A-Za-z0-9_]/g, '_');
      if (_nv) obj.nameId = _nv; else delete obj.nameId;
      _bgeClr('bge-obj-name-id');
    }
    if (typeof refreshNameIdWarn === 'function') refreshNameIdWarn();
    if (_bgeDirty('bge-obj-rx')) { obj.rx = clamp01(_numOr($('bge-obj-rx').value, oldRx)); _bgeClr('bge-obj-rx'); }
    if (_bgeDirty('bge-obj-ry')) { obj.ry = clamp01(_numOr($('bge-obj-ry').value, oldRy)); _bgeClr('bge-obj-ry'); }
    if (_bgeDirty('bge-obj-rw')) { obj.rw = clamp(_numOr($('bge-obj-rw').value, obj.rw || 0.08), 0.005, 1); _bgeClr('bge-obj-rw'); }
    if (_bgeDirty('bge-obj-rh')) { obj.rh = clamp(_numOr($('bge-obj-rh').value, obj.rh || 0.08), 0.005, 1); _bgeClr('bge-obj-rh'); }
    if (_bgeDirty('bge-obj-interactable')) { obj.interactable = $('bge-obj-interactable').value || undefined; _bgeClr('bge-obj-interactable'); }
    if (_bgeDirty('bge-obj-note')) { obj.note = $('bge-obj-note').value || undefined; _bgeClr('bge-obj-note'); }
    // 위험 오브젝트 속성 저장
    var _hf = $('bge-obj-hazard-family'); if (_hf && _bgeDirty('bge-obj-hazard-family')) { obj.hazardFamily = _hf.value || undefined; _bgeClr('bge-obj-hazard-family'); }
    var _hi = $('bge-obj-hazard-id'); if (_hi && _bgeDirty('bge-obj-hazard-id')) { obj.hazardId = _hi.value || undefined; _bgeClr('bge-obj-hazard-id'); }
    var _hv = $('bge-obj-hazard-variant'); if (_hv && _bgeDirty('bge-obj-hazard-variant')) { obj.hazardVariant = _hv.value || undefined; _bgeClr('bge-obj-hazard-variant'); }
    var _hc = $('bge-obj-hazard-count'); if (_hc && _bgeDirty('bge-obj-hazard-count')) { obj.hazardCount = (Number(_hc.value) >= 2) ? 2 : undefined; _bgeClr('bge-obj-hazard-count'); }
    var _ib = $('bge-obj-is-boss'); if (_ib && _bgeDirty('bge-obj-is-boss')) { obj.isBoss = _ib.checked ? true : undefined; _bgeClr('bge-obj-is-boss'); }
    var _qt = $('bge-obj-quest-target'); if (_qt && _bgeDirty('bge-obj-quest-target')) { obj.questTarget = _qt.checked ? true : undefined; _bgeClr('bge-obj-quest-target'); }
    var _hfield = $('bge-hazard-fields'); if (_hfield) _hfield.style.display = (obj.interactable === 'hazard') ? 'block' : 'none';
    var _nr = $('bge-obj-npc-role'); if (_nr && _bgeDirty('bge-obj-npc-role')) { obj.npcRole = _nr.value || undefined; _bgeClr('bge-obj-npc-role'); }
    var _nfield = $('bge-npc-fields'); if (_nfield) _nfield.style.display = (obj.type === 'npc') ? 'block' : 'none';
    // 본체를 폼으로 이동시킨 경우 콜라이더 동반 이동(델타) — 폼 미수정 시 델타 0이라 무해
    if (hasCollider(obj) && state.selectedPart !== 'collider') { obj.cx = clamp01(obj.cx + ((obj.rx || 0) - oldRx)); obj.cy = clamp01(obj.cy + ((obj.ry || 0) - oldRy)); }
    // 콜라이더 좌표: 직접 수정한 칸만, 유효한 숫자일 때만 반영 (빈 값이 콜라이더를 파괴하지 않게)
    if (hasCollider(obj)) {
      if (_bgeDirty('bge-obj-cx')) { obj.cx = clamp01(_numOr($('bge-obj-cx').value, obj.cx)); _bgeClr('bge-obj-cx'); }
      if (_bgeDirty('bge-obj-cy')) { obj.cy = clamp01(_numOr($('bge-obj-cy').value, obj.cy)); _bgeClr('bge-obj-cy'); }
      if (_bgeDirty('bge-obj-cw')) { obj.cw = clamp(_numOr($('bge-obj-cw').value, obj.cw), 0.005, 1); _bgeClr('bge-obj-cw'); }
      if (_bgeDirty('bge-obj-ch')) { obj.ch = clamp(_numOr($('bge-obj-ch').value, obj.ch), 0.005, 1); _bgeClr('bge-obj-ch'); }
    }
    refreshObjectList();
  }
  // 오브젝트 폼 dirty 위임 리스너 — bge-obj-* 입력을 사용자가 직접 만졌을 때만 dirty
  if (!document.__bgeObjDirtyBound) {
    document.__bgeObjDirtyBound = true;
    ['input','change'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        var el = e.target;
        if (el && el.id && (el.id.indexOf('bge-obj-') === 0 || el.id.indexOf('bge-exit-') === 0)) el.dataset.bgeDirty = '1';
      }, true);
    });
  }

  function applyExitForm() {
    // (v245) 스테일 폼 롤백 방지 — 사용자가 직접 수정한 출입구 항목만 반영
    const st = currentStageData(); if (!st) return;
    const dir = $('bge-exit-dir').value; if (!st.exits[dir]) st.exits[dir] = {};
    if (_bgeDirty('bge-exit-active')) { st.exits[dir].active = $('bge-exit-active').checked; _bgeClr('bge-exit-active'); }
    if (_bgeDirty('bge-exit-next')) { st.exits[dir].nextStage = Number($('bge-exit-next').value) || 1; _bgeClr('bge-exit-next'); }
    if (_bgeDirty('bge-exit-entry-x')) { st.exits[dir].entryX = clamp01(_numOr($('bge-exit-entry-x').value, st.exits[dir].entryX)); _bgeClr('bge-exit-entry-x'); }
    if (_bgeDirty('bge-exit-entry-y')) { st.exits[dir].entryY = clamp01(_numOr($('bge-exit-entry-y').value, st.exits[dir].entryY)); _bgeClr('bge-exit-entry-y'); }
    if (_bgeDirty('bge-exit-band-min')) { st.exits[dir].bandMin = clamp01(_numOr($('bge-exit-band-min').value, 0.3)); _bgeClr('bge-exit-band-min'); }
    if (_bgeDirty('bge-exit-band-max')) { st.exits[dir].bandMax = clamp01(_numOr($('bge-exit-band-max').value, 0.7)); _bgeClr('bge-exit-band-max'); }
  }

  function presetLabel(type) { return { building:'새 건물', npc:'새 NPC', info:'안내판', quest_item:'퀘스트 오브젝트', hazard:'위험 요소', monster_spawn:'몬스터 스폰', wall:'벽', prop:'소품', decoration:'장식', portal:'포탈' }[type] || '새 오브젝트'; }
  function buildObjectFromPalette(x, y, typeOverride) {
    const type = typeOverride || $('bge-palette-type').value || 'building';
    const w = clamp(num('bge-palette-w', type === 'building' ? 0.12 : 0.055), 0.005, 1);
    const h = clamp(num('bge-palette-h', type === 'building' ? 0.14 : 0.055), 0.005, 1);
    const obj = { _editorId:'obj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7), type:type, key:$('bge-palette-key').value || (type === 'building' ? 'small' : ''), rx:clamp01(x - w / 2), ry:clamp01(y - h / 2), rw:w, rh:h, label:$('bge-palette-label').value || presetLabel(type) };
    if (['building','wall','shelf','desk','platform','seats','piano'].includes(type)) { obj.cx = obj.rx; obj.cy = obj.ry; obj.cw = clamp(num('bge-palette-cw', w), 0, 1) || w; obj.ch = clamp(num('bge-palette-ch', h), 0, 1) || h; }
    if (type === 'info') obj.interactable = 'info'; if (type === 'quest_item') obj.interactable = 'quest'; if (type === 'hazard') obj.interactable = 'hazard'; if (type === 'portal') obj.interactable = 'portal';
    return obj;
  }

  function addObject(type) { const st = currentStageData(); if (!st) return; pushHistory(); const obj = buildObjectFromPalette(heroX || 0.5, heroY || 0.5, type); st.objects.push(obj); state.selectedIndex = st.objects.length - 1; state.selectedPart = 'object'; refreshAll(); saveData(false); toast('오브젝트 추가: ' + obj.label); }
  function placeObjectAt(x, y) { const st = currentStageData(); if (!st) return; pushHistory(); const obj = buildObjectFromPalette(x, y); st.objects.push(obj); state.selectedIndex = st.objects.length - 1; state.selectedPart = 'object'; state.tool = 'select'; refreshAll(); saveData(false); toast('맵에 배치 완료: ' + obj.label); }
  function createCollider(show) { const obj = selectedObject(); if (!obj) return; pushHistory(); obj.cx = obj.rx || 0; obj.cy = obj.ry || 0; obj.cw = obj.rw || 0.05; obj.ch = obj.rh || 0.05; state.selectedPart = 'collider'; refreshAll(); saveData(false); if (show !== false) toast('콜라이더 생성 완료'); }
  function deleteCollider() { const obj = selectedObject(); if (!obj || !hasCollider(obj)) return; pushHistory(); delete obj.cx; delete obj.cy; delete obj.cw; delete obj.ch; state.selectedPart = 'object'; refreshAll(); saveData(false); toast('콜라이더 삭제 완료'); }
  function copyColliderFromRect() { const obj = selectedObject(); if (!obj) return; obj.cx = obj.rx || 0; obj.cy = obj.ry || 0; obj.cw = obj.rw || 0.05; obj.ch = obj.rh || 0.05; state.selectedPart = 'collider'; refreshAll(); saveData(false); toast('콜라이더를 오브젝트 크기에 맞춤'); }
  // (v43) 현재 맵의 콜라이더 없는 건물·장식에 하단부 기준 콜라이더 일괄 생성
  function createCollidersForAll() {
    const list = currentObjects(); if (!list || !list.length) return;
    const targets = list.filter(o => o && !hasCollider(o) && !o.resident && !o.hazardId
      && (o.type === 'building' || o.type === 'decoration')
      && !o.districtWorldBoundary && !o.boundaryCollider && !o.hidden
      && (o.rw || 0) > 0.005 && (o.rh || 0) > 0.005);
    if (!targets.length) { toast('콜라이더가 없는 건물·장식이 없습니다'); return; }
    pushHistory('콜라이더 일괄 생성');
    targets.forEach(o => {
      o.cx = (o.rx || 0) + (o.rw || 0) * 0.05;
      o.cy = (o.ry || 0) + (o.rh || 0) * 0.55;
      o.cw = (o.rw || 0) * 0.9;
      o.ch = (o.rh || 0) * 0.45;
    });
    refreshAll(); saveData(false);
    toast('콜라이더 일괄 생성: ' + targets.length + '개 (건물 하단부 기준 — 각각 이동·크기 조절 가능)');
  }
  // (v47) 이 맵에서 삭제한 시스템 오브젝트 되살리기
  function restoreSystemObjects() {
    const st = currentStageData(); if (!st) return;
    const n = (Array.isArray(st.deletedSysIds) ? st.deletedSysIds.length : 0) +
              (Array.isArray(st.deletedBusStopIds) ? st.deletedBusStopIds.length : 0);
    if (!n) { toast('이 맵에서 삭제된 시스템 오브젝트가 없습니다'); return; }
    pushHistory('시스템 오브젝트 복원');
    st.deletedSysIds = []; st.deletedBusStopIds = [];
    refreshAll(); saveData(false);
    toast('시스템 오브젝트 복원 — 잠시 후 기본 위치에 다시 생성됩니다');
  }
  function deleteSelected() { const list = currentObjects(); if (state.selectedIndex < 0 || state.selectedIndex >= list.length) return; const obj = list[state.selectedIndex]; if (!confirm('선택한 오브젝트를 삭제할까요?\n' + (obj.label || obj.type || 'object'))) return; pushHistory();
    // (v269) 삭제 기록(툼스톤) — 자동 복구 장치가 사용자가 지운 위험요소·주민을 되살리지 못하게 한다.
    try {
      const stDel = currentStageData();
      if (obj.hazardId) { if (!Array.isArray(stDel.deletedHazardIds)) stDel.deletedHazardIds = []; if (stDel.deletedHazardIds.indexOf(obj.hazardId) < 0) stDel.deletedHazardIds.push(obj.hazardId); }
      if (obj.residentId) { if (!Array.isArray(stDel.deletedResidentIds)) stDel.deletedResidentIds = []; if (stDel.deletedResidentIds.indexOf(obj.residentId) < 0) stDel.deletedResidentIds.push(obj.residentId); }
      // (v280) 시딩 계열도 삭제 존중 — 시설 배치·버스정류장을 지우면 되살아나지 않는다
      if (obj.placementId) { if (!Array.isArray(stDel.deletedPlacementIds)) stDel.deletedPlacementIds = []; if (stDel.deletedPlacementIds.indexOf(obj.placementId) < 0) stDel.deletedPlacementIds.push(obj.placementId); }
      if (obj.busStopId) { if (!Array.isArray(stDel.deletedBusStopIds)) stDel.deletedBusStopIds = []; if (stDel.deletedBusStopIds.indexOf(obj.busStopId) < 0) stDel.deletedBusStopIds.push(obj.busStopId); }
      // (v47) 시스템 주입 오브젝트(bdlink_*: 정류장·동네 슈퍼·주민) 범용 툼스톤 — 지우면 되살아나지 않는다
      if (obj._editorId && /^(bdlink_|bdnpc_)/.test(String(obj._editorId))) {   // (v50) v33 신규 NPC(bdnpc_*)도 포함
        if (!Array.isArray(stDel.deletedSysIds)) stDel.deletedSysIds = [];
        if (stDel.deletedSysIds.indexOf(obj._editorId) < 0) stDel.deletedSysIds.push(obj._editorId);
        setTimeout(function(){ try{ toast('시스템 오브젝트 삭제 — 자동 재생성하지 않습니다. 되돌리려면 [시스템 복원] 버튼'); }catch(eT){} }, 1700);
      }
    } catch (eTs) { }
    list.splice(state.selectedIndex, 1); state.selectedIndex = -1; state.selectedPart = 'object'; refreshAll(); saveData(false); toast('오브젝트 삭제 완료'); }
  function duplicateSelected() { const list = currentObjects(); const obj = selectedObject(); if (!obj) return; const copy = cloneData(obj); copy._editorId = 'obj_' + Date.now().toString(36); copy.rx = clamp01((copy.rx || 0) + 0.02); copy.ry = clamp01((copy.ry || 0) + 0.02); if (hasCollider(copy)) { copy.cx = clamp01(copy.cx + 0.02); copy.cy = clamp01(copy.cy + 0.02); } list.splice(state.selectedIndex + 1, 0, copy); state.selectedIndex += 1; refreshAll(); saveData(false); toast('복제 완료'); }
  function reorderSelected(delta) { const list = currentObjects(); const i = state.selectedIndex; const j = i + delta; if (i < 0 || j < 0 || j >= list.length) return; const tmp = list[i]; list[i] = list[j]; list[j] = tmp; state.selectedIndex = j; refreshAll(); saveData(false); }

  // (v267) 이동 가능 구역(초록 점선)·출구 통과 구간(노란 밴드) 시각화 — 제작 모드 전용
  function drawWalkAndBands(ctx, canvas) {
    const st = currentStageData(); if (!st) return;
    const M = function (mx, my) { return mapToCanvas(mx, my); };
    // 이동 가능 구역
    const w = st.walk || {};
    const x0 = (w.x0 === undefined ? 0.01 : w.x0), y0 = (w.y0 === undefined ? 0.01 : w.y0);
    const x1 = (w.x1 === undefined ? 0.99 : w.x1), y1 = (w.y1 === undefined ? 0.99 : w.y1);
    const p0 = M(x0, y0), p1 = M(x1, y1);
    ctx.save();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = 'rgba(120,230,150,0.85)'; ctx.lineWidth = 2;
    ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    ctx.setLineDash([]);
    // 출구 통과 밴드
    ctx.fillStyle = 'rgba(250,210,70,0.30)';
    ['top', 'bottom', 'left', 'right'].forEach(function (d) {
      const ex = st.exits && st.exits[d]; if (!ex || !ex.active) return;
      const b0 = (ex.bandMin === undefined ? 0.3 : ex.bandMin), b1 = (ex.bandMax === undefined ? 0.7 : ex.bandMax);
      const TH = 0.022;
      let r0, r1;
      if (d === 'top')    { r0 = M(b0, 0);      r1 = M(b1, TH); }
      if (d === 'bottom') { r0 = M(b0, 1 - TH); r1 = M(b1, 1); }
      if (d === 'left')   { r0 = M(0, b0);      r1 = M(TH, b1); }
      if (d === 'right')  { r0 = M(1 - TH, b0); r1 = M(1, b1); }
      ctx.fillRect(r0.x, r0.y, r1.x - r0.x, r1.y - r0.y);
    });
    ctx.restore();
  }
  function drawCustomObject(ctx, canvas, obj) {
    if (obj.hidden) return;
    // (v267) 위험요소·보스·몬스터 스폰은 게임 렌더의 스프라이트가 곧 표식 —
    //  제작 모드의 큰 빨간 타원 배지를 그리지 않는다 (선택 박스는 drawEditorOverlay가 담당).
    if (obj.hazardId || obj.interactable === 'hazard' || obj.isBoss || obj.type === 'hazard' || obj.type === 'monster_spawn') return;
    /* (v386) prop/decoration의 P·D 원형 표식도 제작용 의미밖에 없다.
       이미지 로딩 전 첫 프레임에 선생님 위로 회색 P가 번쩍이던 문제를 막고,
       실제 편집 선택 표시는 drawEditorOverlay의 선택 박스만 사용한다. */
    if (obj.type === 'building' || obj.type === 'wall' || obj.type === 'shelf' || obj.type === 'desk' || obj.type === 'stair' || obj.type === 'platform' || obj.type === 'seats' || obj.type === 'piano' || obj.type === 'park' || obj.type === 'library' || obj.type === 'prop' || obj.type === 'decoration') return;
    // (v187) 실제 이미지가 렌더되는 오브젝트(주민 NPC·에디터 배치 이미지)는 P/NPC 배지를 그리지 않는다.
    //  배지가 캐릭터 스프라이트를 흰 타원으로 덮어버리는 문제 수정.
    if (obj.assetId || String(obj.key || '').startsWith('asset:') || obj.resident) {
      const _aid = obj.assetId || (String(obj.key || '').startsWith('asset:') ? String(obj.key).slice(6) : null);
      const _im = (_aid && typeof window.BD_getAssetImage === 'function') ? window.BD_getAssetImage(_aid) : null;
      if (_im) return;   // 이미지가 있으면 배지 생략 (스프라이트 그대로 노출)
    }
    const sx = toScreenX(obj.rx, canvas), sy = toScreenY(obj.ry, canvas), sw = toScreenW(obj.rw || 0.05, canvas), sh = toScreenH(obj.rh || 0.05, canvas);
    const cx = sx + sw / 2, cy = sy + sh / 2, sc = currentScale || 1;
    const table = { npc:['#6ec7ff','NPC'], info:['#f0c040','i'], quest_item:['#8cff9a','!'], hazard:['#ff6655','위험'], monster_spawn:['#c66cff','몹'], prop:['#dddddd','P'], decoration:['#ffcc99','D'], portal:['#80ffe0','↔'] };
    const meta = table[obj.type] || ['#ffffff', obj.type || '?'];
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 8 * sc; ctx.fillStyle = meta[0]; ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(8 * sc, sw / 2), Math.max(8 * sc, sh / 2), 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(30,18,6,0.88)'; ctx.lineWidth = 2 * sc; ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = '#201206'; ctx.font = 'bold ' + Math.round(11 * sc) + "px 'Noto Serif KR', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(meta[1], cx, cy); ctx.restore();
  }

  function drawEditorOverlay(canvas) {
    if (!state.enabled) return;
    const ctx = canvas.getContext('2d'); const st = currentStageData(); if (!ctx || !st) return; const sc = currentScale || 1; ctx.save();
    const spx = toScreenX(st.spawnX || 0.5, canvas), spy = toScreenY(st.spawnY || 0.8, canvas);
    ctx.fillStyle = 'rgba(255,220,70,0.95)'; ctx.strokeStyle = 'rgba(20,12,4,0.95)'; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.arc(spx, spy, 8 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = 'bold ' + Math.round(11 * sc) + "px 'Noto Serif KR', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#fff1a8'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3 * sc; ctx.strokeText('SPAWN', spx, spy - 10 * sc); ctx.fillText('SPAWN', spx, spy - 10 * sc);
    st.objects.forEach(function (obj, i) {
      const r = getRect(obj, 'object'); const sx = toScreenX(r.x, canvas), sy = toScreenY(r.y, canvas), sw = toScreenW(r.w, canvas), sh = toScreenH(r.h, canvas); const selectedObj = i === state.selectedIndex && state.selectedPart === 'object';
      ctx.lineWidth = (selectedObj ? 3 : 1.5) * sc; ctx.strokeStyle = selectedObj ? 'rgba(255,240,120,0.98)' : 'rgba(80,220,255,0.65)'; ctx.setLineDash(selectedObj ? [] : [6 * sc, 4 * sc]); ctx.strokeRect(sx, sy, sw, sh); ctx.setLineDash([]);
      if (hasCollider(obj)) { const c = getRect(obj, 'collider'); const csx = toScreenX(c.x, canvas), csy = toScreenY(c.y, canvas), csw = toScreenW(c.w, canvas), csh = toScreenH(c.h, canvas); const selectedCol = i === state.selectedIndex && state.selectedPart === 'collider'; ctx.strokeStyle = selectedCol ? 'rgba(255,60,50,0.98)' : 'rgba(255,80,70,0.60)'; ctx.lineWidth = (selectedCol ? 3 : 1.5) * sc; ctx.strokeRect(csx, csy, csw, csh); }
      const name = obj.label || obj.name || obj.type || 'object'; ctx.font = 'bold ' + Math.round(10 * sc) + "px 'Noto Serif KR', sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillStyle = selectedObj ? '#fff1a8' : '#bdefff'; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = 3 * sc; ctx.strokeText((i + 1) + ' ' + name, sx, sy - 3 * sc); ctx.fillText((i + 1) + ' ' + name, sx, sy - 3 * sc);
    });
    const exits = st.exits || {}; ctx.font = 'bold ' + Math.round(12 * sc) + "px 'Noto Serif KR', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const edge = [['top',canvas.width/2,22*sc],['bottom',canvas.width/2,canvas.height-22*sc],['left',28*sc,canvas.height/2],['right',canvas.width-28*sc,canvas.height/2]];
    edge.forEach(function (it) { const ex = exits[it[0]]; if (!ex || !ex.active) return; ctx.fillStyle = 'rgba(60,190,255,0.22)'; ctx.strokeStyle = 'rgba(80,220,255,0.8)'; ctx.lineWidth = 2 * sc; ctx.beginPath(); ctx.arc(it[1], it[2], 16 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#bdefff'; ctx.fillText(it[0] + '→' + ex.nextStage, it[1], it[2]); });
    if (state.pickSpawn || state.pickEntry || state.tool === 'place' || state.tool === 'pan') { ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, canvas.width, 34 * sc); ctx.fillStyle = '#fff1a8'; ctx.font = 'bold ' + Math.round(14 * sc) + "px 'Noto Serif KR', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const msg = state.pickSpawn ? '스폰 위치 찍기: 맵을 클릭하세요.' : state.pickEntry ? '이동 후 캐릭터가 나올 위치 찍기: 대상 맵에서 클릭하세요.' : state.tool === 'place' ? '배치 모드: 맵을 클릭하면 팔레트 오브젝트가 생성됩니다.' : '화면 이동 모드: 드래그로 카메라를 이동합니다. 휠로 줌 조절.'; ctx.fillText(msg, canvas.width / 2, 17 * sc); }
    ctx.restore();
  }

  function patchEngine() {
    if (!state.original.toScreenX) {
      state.original.toScreenX = toScreenX; state.original.toScreenY = toScreenY; state.original.toScreenW = toScreenW; state.original.toScreenH = toScreenH; state.original.updateCamera = updateCamera;
      toScreenX = function (mapRatioX, canvas) { const baseScreenX = ((mapRatioX - camX) / viewportW() + 0.5) * BASE_W; return (baseScreenX - BASE_W / 2) * currentScale + canvas.width / 2; };
      toScreenY = function (mapRatioY, canvas) { const baseScreenY = ((mapRatioY - camY) / viewportH() + 0.5) * BASE_H; return (baseScreenY - BASE_H / 2) * currentScale + canvas.height / 2; };
      toScreenW = function (rw, canvas) { return (rw / viewportW()) * BASE_W * currentScale; };
      toScreenH = function (rh, canvas) { return (rh / viewportH()) * BASE_H * currentScale; };
      updateCamera = function () { if (state.enabled) { clampCamera(); camX = state.editorCamX; camY = state.editorCamY; return; } state.original.updateCamera(); };
    }
    if (typeof renderMap === 'function' && !renderMap._bgePatchedV2) {
      const originalRender = renderMap;
      renderMap = function (canvas) { originalRender(canvas); try { const ctx = canvas.getContext('2d'); const st = currentStageData(); if (ctx && st) st.objects.forEach(function (obj) { drawCustomObject(ctx, canvas, obj); }); drawEditorOverlay(canvas);
      try { drawWalkAndBands(ctx, canvas); } catch (eWB) { } } catch (err) { console.warn('에디터 오버레이 렌더링 실패:', err); } };
      renderMap._bgePatchedV2 = true;
    }
  }

  function bindEvents() {
    $('bge-toggle').addEventListener('click', function () { if(window.BD_DEV_MODE===false) return; setEditorEnabled(!state.enabled); });
    document.addEventListener('keydown', function (e) { const tag = (e.target && e.target.tagName || '').toLowerCase(); const editingInput = ['input','select','textarea'].includes(tag); if (e.ctrlKey && e.key.toLowerCase() === 'e') { if(window.BD_DEV_MODE===false) return; e.preventDefault(); e.stopPropagation(); setEditorEnabled(!state.enabled); return; } if (state.enabled && !editingInput) {
      // ── 개선: Undo / Redo ──
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); doUndo(); return; }
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); e.stopPropagation(); doRedo(); return; }
      // ── 개선: 복사 / 붙여넣기 ──
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); e.stopPropagation(); copySelected(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); e.stopPropagation(); pasteClipboard(); return; }
      // ── 개선: 방향키 미세 이동 (Shift=큰 이동) ──
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        const obj = selectedObject();
        if (obj) {
          e.preventDefault(); e.stopPropagation();
          const step = e.shiftKey ? (state.gridSize || 0.05) : 0.005;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowLeft') dx = -step; else if (e.key === 'ArrowRight') dx = step;
          else if (e.key === 'ArrowUp') dy = -step; else dy = step;
          pushHistory();
          if (state.selectedPart === 'collider' && hasCollider(obj)) { obj.cx = clamp01((obj.cx||0)+dx); obj.cy = clamp01((obj.cy||0)+dy); }
          else { obj.rx = clamp01((obj.rx||0)+dx); obj.ry = clamp01((obj.ry||0)+dy); if (hasCollider(obj)) { obj.cx = clamp01((obj.cx||0)+dx); obj.cy = clamp01((obj.cy||0)+dy); } }
          refreshSelectedForm(); refreshObjectList(); saveData(false); return;
        }
      }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEditorEnabled(false); return; } if (e.key === 'Delete') { e.preventDefault(); deleteSelected(); return; } if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) { state.tool = 'select'; refreshAll(); } if (e.key.toLowerCase() === 'h') { state.tool = 'pan'; refreshAll(); } if (e.key.toLowerCase() === 'b') { state.tool = 'place'; refreshAll(); } } }, true);
    ['bge-tool-select','bge-tool-pan','bge-tool-place'].forEach(function (id) { $(id).addEventListener('click', function () { state.tool = id === 'bge-tool-select' ? 'select' : id === 'bge-tool-pan' ? 'pan' : 'place'; refreshAll(); }); });
    $('bge-overview').addEventListener('click', function () { state.editorViewMode = 'overview'; state.editorZoom = 1; state.editorCamX = 0.5; state.editorCamY = 0.5; refreshAll(); });
    var _runtimeView = $('bge-runtime-view'); if (_runtimeView) _runtimeView.addEventListener('click', function () { setRuntimeEditorViewV26(state.editorCamX, state.editorCamY, true); });
    $('bge-zoom-in').addEventListener('click', function () { state.editorViewMode = 'custom'; state.editorZoom = clamp(state.editorZoom + 0.25, EDITOR_ZOOM_MIN_V26, EDITOR_ZOOM_MAX_V26); refreshAll(); });
    $('bge-zoom-out').addEventListener('click', function () { state.editorViewMode = 'custom'; state.editorZoom = clamp(state.editorZoom - 0.25, EDITOR_ZOOM_MIN_V26, EDITOR_ZOOM_MAX_V26); refreshAll(); });
    // ── 개선: 새 툴바 버튼 ──
    var _u=$('bge-undo'); if(_u) _u.addEventListener('click', doUndo);
    var _r=$('bge-redo'); if(_r) _r.addEventListener('click', doRedo);
    var _g=$('bge-grid-toggle'); if(_g) _g.addEventListener('click', toggleGrid);
    var _c=$('bge-copy'); if(_c) _c.addEventListener('click', copySelected);
    var _p=$('bge-paste'); if(_p) _p.addEventListener('click', pasteClipboard);
    // ── 개선: 탭 전환 + 쉬운 모드 ──
    var _th=$('bge-tab-hierarchy'); if(_th) _th.addEventListener('click', function(){ switchTab('hierarchy'); });
    var _tp=$('bge-tab-props'); if(_tp) _tp.addEventListener('click', function(){ switchTab('props'); });
    var _td=$('bge-tab-dialog'); if(_td) _td.addEventListener('click', function(){ switchTab('dialog'); });
    var _ts=$('bge-tab-simple'); if(_ts) _ts.addEventListener('click', toggleSimpleMode);
    // ── 개선: 프리팹 ──
    var _pfs=$('bge-prefab-save'); if(_pfs) _pfs.addEventListener('click', savePrefabFromSelection);
    var _rp=$('bge-tab-resetpos'); if(_rp) _rp.addEventListener('click', resetPanelPos);
    renderPrefabs();
    ['bge-zoom','bge-cam-x','bge-cam-y'].forEach(function (id) { $(id).addEventListener('input', applyCameraForm); });
    $('bge-stage-select').addEventListener('change', function () { currentStage = Number(this.value); const st = currentStageData(); heroX = st.spawnX || 0.5; heroY = st.spawnY || 0.8; const runtimeMode = state.editorViewMode === 'runtime' && isUnifiedPixelStageV26(st); state.editorZoom = runtimeMode ? runtimeEditorZoomV26(st) : state.editorViewMode === 'overview' ? 1 : state.editorZoom; state.editorCamX = runtimeMode ? heroX : 0.5; state.editorCamY = runtimeMode ? heroY : 0.5; clampCamera(); camX = state.editorCamX; camY = state.editorCamY; state.selectedIndex = -1; state.selectedPart = 'object'; if ($('gs-loc')) $('gs-loc').textContent = st.name || ''; if (typeof _spawnMobsForStage === 'function') _spawnMobsForStage(currentStage); refreshAll(); });
    ['bge-stage-name','bge-spawn-x','bge-spawn-y'].forEach(function (id) { $(id).addEventListener('input', function () { applyStageForm(); saveData(false); }); });
    $('bge-search').addEventListener('input', refreshObjectList);
    document.querySelectorAll('[data-bge-add]').forEach(function (btn) { btn.addEventListener('click', function () { addObject(btn.getAttribute('data-bge-add')); }); });
    $('bge-place-on').addEventListener('click', function () { state.tool = state.tool === 'place' ? 'select' : 'place'; refreshAll(); });
    ['bge-obj-label','bge-obj-name-id','bge-obj-type','bge-obj-key','bge-obj-rx','bge-obj-ry','bge-obj-rw','bge-obj-rh','bge-obj-interactable','bge-obj-hazard-family','bge-obj-hazard-id','bge-obj-hazard-variant','bge-obj-hazard-count','bge-obj-is-boss','bge-obj-quest-target','bge-obj-npc-role','bge-obj-note','bge-obj-cx','bge-obj-cy','bge-obj-cw','bge-obj-ch'].forEach(function (id) { $(id).addEventListener('input', function () { applySelectedForm(); saveData(false); }); $(id).addEventListener('change', function () { applySelectedForm(); saveData(false); }); });
    $('bge-create-collider').addEventListener('click', createCollider);
  $('bge-create-collider-all').addEventListener('click', createCollidersForAll);
  $('bge-restore-sys').addEventListener('click', restoreSystemObjects); $('bge-copy-collider').addEventListener('click', copyColliderFromRect); $('bge-delete-collider').addEventListener('click', deleteCollider); $('bge-delete-obj').addEventListener('click', deleteSelected); $('bge-duplicate-obj').addEventListener('click', duplicateSelected); $('bge-move-up').addEventListener('click', function () { reorderSelected(-1); }); $('bge-move-down').addEventListener('click', function () { reorderSelected(1); });
    $('bge-save').addEventListener('click', function () { applyStageForm(); applySelectedForm(); applyExitForm(); saveData(true); });
    $('bge-pick-spawn').addEventListener('click', function () { state.pickSpawn = !state.pickSpawn; state.pickEntry = false; state.tool = 'select'; this.textContent = state.pickSpawn ? '스폰 취소' : '스폰 찍기'; toast(state.pickSpawn ? '맵에서 스폰 위치를 클릭하세요.' : '스폰 찍기 취소'); refreshAll(); });
    ['bge-exit-dir','bge-exit-active','bge-exit-next','bge-exit-entry-x','bge-exit-entry-y'].forEach(function (id) { $(id).addEventListener('input', function () { applyExitForm(); saveData(false); if (id !== 'bge-exit-dir') refreshExitForm(); }); $(id).addEventListener('change', function () { if (id === 'bge-exit-dir') refreshExitForm(); else { applyExitForm(); saveData(false); } }); });
    $('bge-preview-entry').addEventListener('click', function () { applyExitForm(); const ex = currentStageData().exits[$('bge-exit-dir').value]; if (!ex || !STAGES[ex.nextStage]) { alert('다음 스테이지가 올바르지 않습니다.'); return; } currentStage = Number(ex.nextStage); state.editorCamX = 0.5; state.editorCamY = 0.5; camX = 0.5; camY = 0.5; state.selectedIndex = -1; if ($('gs-loc')) $('gs-loc').textContent = STAGES[currentStage].name || ''; refreshAll(); toast('대상 맵 보기: 진입 위치를 확인하세요.'); });
    $('bge-pick-entry').addEventListener('click', function () { applyExitForm(); const fromStage = currentStage; const dir = $('bge-exit-dir').value; const ex = currentStageData().exits[dir]; if (!ex || !STAGES[ex.nextStage]) { alert('다음 스테이지를 먼저 올바르게 설정하세요.'); return; } state.pickEntry = true; state.pickSpawn = false; state.entryReturnStage = fromStage; currentStage = Number(ex.nextStage); state.editorCamX = 0.5; state.editorCamY = 0.5; camX = 0.5; camY = 0.5; refreshAll(); toast('대상 맵에서 이동 후 캐릭터가 나올 위치를 찍으세요.'); });
    $('bge-export').addEventListener('click', function () { const blob = new Blob([JSON.stringify(exportableData(), null, 2)], { type:'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bongdam_rpg_editor_data_v5_2_quest.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('JSON 내보내기 완료'); });
    $('bge-import-btn').addEventListener('click', function () { $('bge-import-file').click(); });
    $('bge-import-file').addEventListener('change', function () { const file = this.files && this.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function () { try { const parsed = JSON.parse(String(reader.result)); const stages = parsed.stages || parsed; if (!stages || typeof stages !== 'object') throw new Error('stages 데이터가 없습니다.'); applyStageData(stages);
          // (v252) JSON 복원 시 특수 NPC(현지·도현) 위치도 복원 — 기존엔 stages만 적용돼 누락
          try {
            if (parsed.npcPos) {
              if (parsed.npcPos.hyunji && typeof NPC_X !== 'undefined') { NPC_X = parsed.npcPos.hyunji.x; NPC_Y = parsed.npcPos.hyunji.y; }
              if (parsed.npcPos.dohyun && typeof QNPC_X !== 'undefined') { QNPC_X = parsed.npcPos.dohyun.x; QNPC_Y = parsed.npcPos.dohyun.y; }
              if (parsed.npcPos.tutor) { window.__bdTutorPos = parsed.npcPos.tutor; }   // (v266)
            }
          } catch (eNp) { } if (!STAGES[currentStage]) currentStage = Number(stageIds()[0] || 1); state.selectedIndex = -1; saveData(false); refreshAll(); toast('JSON 가져오기 완료'); } catch (err) { alert('JSON 가져오기 실패: ' + err.message); } finally { $('bge-import-file').value = ''; } }; reader.readAsText(file, 'utf-8'); });
    $('bge-reset').addEventListener('click', function () { if (!confirm('에디터 저장 데이터를 초기화하고 기본 맵으로 되돌릴까요?')) return; localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(OLD_STORAGE_KEY); applyStageData(cloneData(state.defaultData.stages)); state.selectedIndex = -1; state.selectedPart = 'object'; refreshAll(); toast('기본 데이터로 초기화 완료'); });

    const canvas = $('game-canvas');
    canvas.addEventListener('wheel', function (e) { if (!state.enabled) return; e.preventDefault(); const old = state.editorZoom; state.editorViewMode = 'custom'; state.editorZoom = clamp(state.editorZoom + (e.deltaY < 0 ? 0.18 : -0.18), EDITOR_ZOOM_MIN_V26, EDITOR_ZOOM_MAX_V26); if (old !== state.editorZoom) refreshAll(); }, { passive:false });
    // (v240k-3) document 버블로 승격 — 에디터 오버레이(라벨 등)가 이벤트 타깃이라
    //  canvas 리스너가 못 받아 '오브젝트 잡기 드래그'가 죽어 있던 문제.
    //  v3의 핸들·중간버튼(document 캡처)이 먼저 처리하므로 우선순위는 그대로다.
    function __overCv(e) {
      const c = $('game-canvas'); if (!c) return false;
      const r = c.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return false;
      let n = e.target;
      while (n && n !== document.body && n.nodeType === 1) {
        const id = n.id || '', cls = String(n.className || '');
        if (id.indexOf('bge') === 0 || cls.indexOf('bge') >= 0) return false;
        n = n.parentNode;
      }
      return true;
    }
    document.addEventListener('mousedown', function (e) {
      if (!state.enabled || e.button !== 0) return; if (!__overCv(e)) return;
      // (v240l) 클릭점이 '선택 오브젝트의 리사이즈 핸들' 위면 v34 리사이즈 모듈에 양보.
      //  예전엔 코너 클릭이 여기서 빈 곳으로 판정돼 선택이 풀려(selectedIndex=-1)
      //  핸들이 '잡혔다 안 잡혔다' 하던 문제의 원인.
      try { if (window.__bgeV34HandleAt && window.__bgeV34HandleAt(e.clientX, e.clientY)) return; } catch (err) { }
      e.preventDefault(); e.stopPropagation(); const p = screenToMap(e.clientX, e.clientY); const st = currentStageData(); if (!st) return;
      if (state.pickSpawn) { st.spawnX = p.x; st.spawnY = p.y; state.pickSpawn = false; $('bge-pick-spawn').textContent = '스폰 찍기'; refreshStageForm(); saveData(false); toast('스폰 위치 변경 완료'); return; }
      if (state.pickEntry) { const returnStage = Number(state.entryReturnStage); if (STAGES[returnStage]) { const dir = $('bge-exit-dir').value; STAGES[returnStage].exits[dir].entryX = p.x; STAGES[returnStage].exits[dir].entryY = p.y; currentStage = returnStage; state.pickEntry = false; state.entryReturnStage = null; refreshAll(); saveData(false); toast('이동 후 캐릭터 위치 설정 완료'); } return; }
      if (state.tool === 'place') { placeObjectAt(p.x, p.y); return; }
      // 개선: 실제 오브젝트가 안 잡히면 캐릭터/스폰/허수아비(가상) 검사
      const hit = state.tool === 'pan' ? { index:-1 } : hitTest(p.x, p.y);
      if (hit.index < 0 && state.tool !== 'pan') {
        const v = hitVirtual(p.x, p.y);
        if (v) {
          state.selectedIndex = -1; state.selectedPart = 'object';
          state._virtual = v; state.dragging = true; state.dragMode = 'virtual';
          state._fixedNotice = false;
          state.dragOffsetX = p.x - v.getX(); state.dragOffsetY = p.y - v.getY();
          refreshAll(); toast('선택: ' + v.label + (v.fixed ? ' (고정 위치)' : ' (드래그로 이동)'));
          return;
        }
      }
      if (hit.index >= 0) {
        // (v48) 파트 인식 겹침 순환 — 본체→콜라이더→아래 오브젝트 순으로 돌고,
        //  '현재 잡고 있는 것'(본체든 콜라이더든)을 다시 누르면 순환하지 않고 그대로 잡아 드래그한다.
        //  같은 자리를 이동 없이 다시 '클릭'했을 때만 다음 후보로 넘어간다 (드래그 후 재클릭은 v246 앵커 해제로 유지).
        try {
          const lc = state._cycleClick;
          const near = lc && Math.abs(e.clientX - lc.x) < 6 && Math.abs(e.clientY - lc.y) < 6;
          const list = currentObjects();
          const cands = collectHits(p.x, p.y).filter(function(c){ const o = list[c.index]; return o && !o.hidden; });
          if (cands.length) {
            const curPos = cands.findIndex(function(c){ return c.index === state.selectedIndex && c.part === state.selectedPart; });
            // (v48) mousedown에서는 절대 순환하지 않는다 — 현재 잡고 있는 것(본체/콜라이더)을 그대로 잡아
            //  드래그·리사이즈가 항상 가능하게. 순환은 '이동 없이 뗀 클릭'일 때 mouseup에서 수행.
            const pick = (curPos >= 0) ? cands[curPos] : cands[0];
            hit.index = pick.index; hit.part = pick.part;
            state._pendCycle = (curPos >= 0 && cands.length > 1)
              ? { cands: cands, curPos: curPos, x: e.clientX, y: e.clientY } : null;
          } else {
            state._pendCycle = null;
          }
          state._cycleClick = { x: e.clientX, y: e.clientY };
        } catch (err) { }
        pushHistory(); state._virtual = null; state.selectedIndex = hit.index; state.selectedPart = hit.part;
        try { window.__bdLastSel = { index: hit.index, part: hit.part }; } catch (eDbg) { }   // (v48) 진단용
        const obj = selectedObject(); const r = getRect(obj, state.selectedPart); state.dragging = true; state.dragMode = state.selectedPart; state.dragOffsetX = p.x - r.x; state.dragOffsetY = p.y - r.y; refreshAll(); }
      else { state.selectedIndex = -1; state.selectedPart = 'object'; state._virtual = null; state.dragging = true; state.dragMode = 'pan'; state.panStartX = e.clientX; state.panStartY = e.clientY; state.panCamX = state.editorCamX; state.panCamY = state.editorCamY; refreshAll(); }
    }, true);
    window.addEventListener('mousemove', function (e) { if (!state.enabled || !state.dragging) return; if (state.dragMode === 'pan') { const canvas = $('game-canvas'); const rect = canvas.getBoundingClientRect(); state.editorCamX = state.panCamX - (e.clientX - state.panStartX) / rect.width * viewportW(); state.editorCamY = state.panCamY - (e.clientY - state.panStartY) / rect.height * viewportH(); clampCamera(); camX = state.editorCamX; camY = state.editorCamY; refreshCameraForm(); return; } if (state.dragMode === 'virtual' && state._virtual) { if (state._virtual.fixed) { if (!state._fixedNotice) { state._fixedNotice = true; toast(state._virtual.label + '은(는) 고정 위치예요 (코드 상수라 이동 불가)'); } return; } const p = screenToMap(e.clientX, e.clientY); let nx = clamp01(snapVal(clamp01(p.x - state.dragOffsetX))), ny = clamp01(snapVal(clamp01(p.y - state.dragOffsetY))); state._virtual.setX(nx); state._virtual.setY(ny); if (typeof refreshAll === 'function') refreshAll(); return; } const obj = selectedObject(); if (!obj) return; const p = screenToMap(e.clientX, e.clientY); let nx = clamp01(p.x - state.dragOffsetX), ny = clamp01(p.y - state.dragOffsetY); nx = clamp01(snapVal(nx)); ny = clamp01(snapVal(ny)); if (state.dragMode === 'collider') { if (!hasCollider(obj)) createCollider(false); obj.cx = nx; obj.cy = ny; } else { const oldRx = obj.rx || 0, oldRy = obj.ry || 0; const dx = nx - oldRx, dy = ny - oldRy; obj.rx = nx; obj.ry = ny; if (hasCollider(obj)) { obj.cx = clamp01(obj.cx + dx); obj.cy = clamp01(obj.cy + dy); } } refreshSelectedForm(); }, true);
    window.addEventListener('mouseup', function (e) {
      // (v246) 드래그로 끝난 클릭은 겹침 순환 앵커 해제 — 코너 조정 후 재클릭이
      //  '같은 자리 재클릭'으로 오인돼 선택이 다른 오브젝트로 튀던 문제 방지
      try { const lc = state._cycleClick;
        if (lc && e && (Math.abs(e.clientX - lc.x) > 4 || Math.abs(e.clientY - lc.y) > 4)) state._cycleClick = null;
      } catch (err) { }
      // (v48) 이동 없이 뗀 '제자리 클릭'이면 이제 겹침 순환 — 본체→콜라이더→아래 오브젝트 순.
      //  (드래그였다면 위에서 앵커가 풀리고 여기서도 이동량 조건에 걸려 순환하지 않는다 = 잡기 우선)
      try {
        const pc = state._pendCycle;
        if (pc && e && Math.abs(e.clientX - pc.x) <= 4 && Math.abs(e.clientY - pc.y) <= 4) {
          const list = currentObjects();
          const nx = pc.cands[(pc.curPos + 1) % pc.cands.length];
          if (nx && list[nx.index]) {
            state.selectedIndex = nx.index; state.selectedPart = nx.part;
            try { window.__bdLastSel = { index: nx.index, part: nx.part }; } catch (eDbg) { }
            const lb = (list[nx.index] || {}).label || '오브젝트';
            toast('🔁 겹침 선택 ' + (((pc.curPos + 1) % pc.cands.length) + 1) + '/' + pc.cands.length + ': ' + lb + (nx.part === 'collider' ? ' · 충돌 영역' : ''));
            refreshAll();
          }
        }
        state._pendCycle = null;
      } catch (err2) { }
      if (state.dragging) { const wasVirtual = state.dragMode === 'virtual'; state.dragging = false; state.dragMode = null; saveData(false); refreshObjectList(); if (wasVirtual) { state._virtual = null; } } }, true);

    // =====================================================================
    // 개선: 터치(태블릿) 드래그 지원 — 터치를 마우스 동작으로 변환
    //  아이들이 태블릿에서도 손가락으로 오브젝트를 옮길 수 있게 함
    // =====================================================================
    (function () {
      function mapTouch(e) {
        const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
        return t ? { clientX: t.clientX, clientY: t.clientY } : null;
      }
      // 터치 시작 → mousedown 로직 재현
      canvas.addEventListener('touchstart', function (e) {
        if (!state.enabled) return;
        const t = mapTouch(e); if (!t) return;
        e.preventDefault();
        const p = screenToMap(t.clientX, t.clientY); const st = currentStageData(); if (!st) return;
        if (state.pickSpawn) { st.spawnX = p.x; st.spawnY = p.y; state.pickSpawn = false; $('bge-pick-spawn').textContent = '스폰 찍기'; refreshStageForm(); saveData(false); toast('스폰 위치 변경 완료'); return; }
        if (state.pickEntry) { const returnStage = Number(state.entryReturnStage); if (STAGES[returnStage]) { const dir = $('bge-exit-dir').value; STAGES[returnStage].exits[dir].entryX = p.x; STAGES[returnStage].exits[dir].entryY = p.y; currentStage = returnStage; state.pickEntry = false; state.entryReturnStage = null; refreshAll(); saveData(false); toast('이동 후 위치 설정 완료'); } return; }
        if (state.tool === 'place') { placeObjectAt(p.x, p.y); return; }
        const hit = state.tool === 'pan' ? { index:-1 } : hitTest(p.x, p.y);
        if (hit.index >= 0) { pushHistory(); state.selectedIndex = hit.index; state.selectedPart = hit.part; const obj = selectedObject(); const r = getRect(obj, state.selectedPart); state.dragging = true; state.dragMode = state.selectedPart; state.dragOffsetX = p.x - r.x; state.dragOffsetY = p.y - r.y; refreshAll(); }
        else { state.selectedIndex = -1; state.selectedPart = 'object'; state.dragging = true; state.dragMode = 'pan'; state.panStartX = t.clientX; state.panStartY = t.clientY; state.panCamX = state.editorCamX; state.panCamY = state.editorCamY; refreshAll(); }
      }, { passive:false });
      // 터치 이동 → mousemove 로직 재현
      canvas.addEventListener('touchmove', function (e) {
        if (!state.enabled || !state.dragging) return;
        const t = mapTouch(e); if (!t) return;
        e.preventDefault();
        if (state.dragMode === 'pan') { const rect = canvas.getBoundingClientRect(); state.editorCamX = state.panCamX - (t.clientX - state.panStartX) / rect.width * viewportW(); state.editorCamY = state.panCamY - (t.clientY - state.panStartY) / rect.height * viewportH(); clampCamera(); camX = state.editorCamX; camY = state.editorCamY; refreshCameraForm(); return; }
        const obj = selectedObject(); if (!obj) return;
        const p = screenToMap(t.clientX, t.clientY);
        let nx = clamp01(snapVal(clamp01(p.x - state.dragOffsetX))), ny = clamp01(snapVal(clamp01(p.y - state.dragOffsetY)));
        if (state.dragMode === 'collider') { if (!hasCollider(obj)) createCollider(false); obj.cx = nx; obj.cy = ny; }
        else { const oldRx = obj.rx || 0, oldRy = obj.ry || 0; const dx = nx - oldRx, dy = ny - oldRy; obj.rx = nx; obj.ry = ny; if (hasCollider(obj)) { obj.cx = clamp01(obj.cx + dx); obj.cy = clamp01(obj.cy + dy); } }
        refreshSelectedForm();
      }, { passive:false });
      // 터치 끝 → mouseup 로직 재현
      canvas.addEventListener('touchend', function () { if (state.dragging) { state.dragging = false; state.dragMode = null; saveData(false); refreshObjectList(); } }, { passive:true });
      canvas.addEventListener('touchcancel', function () { if (state.dragging) { state.dragging = false; state.dragMode = null; } }, { passive:true });
    })();
  }

  function init() {
    if (typeof STAGES === 'undefined') return;
    Object.keys(STAGES).forEach(function (key) { normalizeStage(STAGES[key]); });
    state.defaultData = { stages: cloneData(STAGES) };
    loadSavedData(); patchEngine(); bindEvents(); refreshAll();
    window.BongdamEditor = { state:state, save:saveData, refresh:refreshAll, enable:function(){setEditorEnabled(true);}, disable:function(){setEditorEnabled(false);},
      /* (v240k-3) 디버그·테스트용 좌표 변환 노출 — 씬뷰 정합 검증에 사용 */
      s2m:screenToMap, vpw:viewportW, vph:viewportH, runtimeView:function(x,y){return setRuntimeEditorViewV26(x,y,true);}, viewport:function(){return activeEditorViewportV26();} };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
