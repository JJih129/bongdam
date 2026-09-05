
(function () {
  'use strict';

  const ASSET_KEY = 'bongdam_rpg_editor_assets_v3';
  const V3_PROJECT_VERSION = 3;
  const HANDLE_SIZE = 9;
  const HANDLE_HIT = 15;
  const $ = (id) => document.getElementById(id);

  const v3 = {
    assets: [],
    pendingFileDataUrl: '',
    pendingFileName: '',
    assetPlaceMode: false,
    resizing: false,
    resizeHandle: '',
    resizeStart: null,
    scrub: null,
    middlePan: null,
    patchedRender: false
  };

  const KO_TYPE = {
    building:'건물', npc:'NPC', info:'안내판', quest_item:'퀘스트 오브젝트', hazard:'위험요소', monster_spawn:'몬스터 스폰', wall:'벽', stair:'계단', shelf:'선반', desk:'책상', platform:'플랫폼', seats:'의자', piano:'피아노', prop:'소품', decoration:'장식', portal:'이동 포탈'
  };

  function editor() { return window.BongdamEditor || null; }
  function state() { return editor() ? editor().state : null; }
  function clamp(v, a, b) { v = Number(v); if (!Number.isFinite(v)) return a; return Math.max(a, Math.min(b, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function clone(value) { return window.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  function currentStageObj() { return (typeof STAGES !== 'undefined') ? STAGES[currentStage] : null; }
  function objects() { const st = currentStageObj(); return st && st.objects ? st.objects : []; }
  function selectedObject() { const s = state(); const list = objects(); return s && s.selectedIndex >= 0 && s.selectedIndex < list.length ? list[s.selectedIndex] : null; }
  function hasCollider(o) { return o && o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined; }
  function rectOf(o) { return { x:Number(o.rx||0), y:Number(o.ry||0), w:Number(o.rw||0.08), h:Number(o.rh||0.08) }; }
  // 개선: 현재 편집 대상(오브젝트 or 콜라이더)의 사각형을 반환
  function activeRectOf(o) {
    const s = state();
    if (s && s.selectedPart === 'collider' && hasCollider(o)) {
      return { x:Number(o.cx||0), y:Number(o.cy||0), w:Number(o.cw||0.05), h:Number(o.ch||0.05), _collider:true };
    }
    return rectOf(o);
  }
  function canvas() { return $('game-canvas'); }

  function toast(msg) {
    const el = $('bge-toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 1800);
  }

  function loadAssets() {
    try {
      const raw = localStorage.getItem(ASSET_KEY);
      v3.assets = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(v3.assets)) v3.assets = [];
    } catch (_) { v3.assets = []; }
  }

  function saveAssets() {
    try { localStorage.setItem(ASSET_KEY, JSON.stringify(v3.assets)); }
    catch (err) { alert('이미지 저장 실패: 브라우저 저장 용량이 부족할 수 있습니다. 이미지 크기를 줄여서 다시 등록하세요.'); }
  }

  function assetById(id) { return v3.assets.find(function (a) { return a.id === id; }) || null; }

  const imageCache = new Map();
  function getImage(assetId) {
    const asset = assetById(assetId);
    if (!asset || !asset.dataUrl) return null;
    if (imageCache.has(assetId)) return imageCache.get(assetId);
    const img = new Image();
    img.src = asset.dataUrl;
    imageCache.set(assetId, img);
    return img;
  }

  function refreshAssetSelects() {
    ['bge-v3-asset-select','bge-v3-portrait'].forEach(function (id) {
      const sel = $(id); if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = '';
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = id === 'bge-v3-portrait' ? '초상화 없음' : '에셋 선택'; sel.appendChild(empty);
      v3.assets.forEach(function (asset) { const opt = document.createElement('option'); opt.value = asset.id; opt.textContent = asset.name || asset.id; sel.appendChild(opt); });
      if (prev) sel.value = prev;
    });
    refreshAssetPreview();
  }

  function refreshAssetPreview() {
    const box = $('bge-v3-asset-preview'); const sel = $('bge-v3-asset-select');
    if (!box || !sel) return;
    const asset = assetById(sel.value);
    if (!asset) { box.textContent = '등록된 에셋 없음'; return; }
    box.innerHTML = '<img class="bge-v3-asset-thumb" src="' + asset.dataUrl + '">' + escapeHtml(asset.name || asset.id);
  }

  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

  function viewportW() { const fixed = window.BD_getEditorViewportV26 && window.BD_getEditorViewportV26(); const s = state(); return fixed ? fixed.w : (s && s.enabled ? 1 / s.editorZoom : (typeof VIEWPORT_W !== 'undefined' ? VIEWPORT_W : 1)); }
  function viewportH() { const fixed = window.BD_getEditorViewportV26 && window.BD_getEditorViewportV26(); const s = state(); return fixed ? fixed.h : (s && s.enabled ? 1 / s.editorZoom : (typeof VIEWPORT_H !== 'undefined' ? VIEWPORT_H : 1)); }

  function mapToCanvas(mx, my) {
    const c = canvas();
    const vw = viewportW(), vh = viewportH();
    const baseX = ((mx - camX) / vw + 0.5) * BASE_W;
    const baseY = ((my - camY) / vh + 0.5) * BASE_H;
    return { x: (baseX - BASE_W / 2) * currentScale + c.width / 2, y: (baseY - BASE_H / 2) * currentScale + c.height / 2 };
  }

  function canvasToMap(clientX, clientY) {
    const c = canvas(); const r = c.getBoundingClientRect();
    const sx = (clientX - r.left) * (c.width / r.width);
    const sy = (clientY - r.top) * (c.height / r.height);
    const baseX = (sx - c.width / 2) / currentScale + BASE_W / 2;
    const baseY = (sy - c.height / 2) / currentScale + BASE_H / 2;
    return { x: clamp01((baseX / BASE_W - 0.5) * viewportW() + camX), y: clamp01((baseY / BASE_H - 0.5) * viewportH() + camY), sx:sx, sy:sy };
  }

  function drawAssetObjects(ctx) {
    const list = objects();
    list.forEach(function (obj) {
      if (!obj || obj.hidden || !obj.assetId) return;
      const img = getImage(obj.assetId);
      if (!img || !img.complete) return;
      const r = rectOf(obj);
      const p1 = mapToCanvas(r.x, r.y);
      const p2 = mapToCanvas(r.x + r.w, r.y + r.h);
      const w = p2.x - p1.x, h = p2.y - p1.y;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, p1.x, p1.y, w, h);
      ctx.restore();
    });
  }

  function handlePoints(r) {
    const x1 = r.x, y1 = r.y, x2 = r.x + r.w, y2 = r.y + r.h, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    return [
      ['nw', x1, y1], ['n', cx, y1], ['ne', x2, y1],
      ['e', x2, cy], ['se', x2, y2], ['s', cx, y2],
      ['sw', x1, y2], ['w', x1, cy]
    ];
  }

  function drawHandles(ctx) {
    const s = state(); const obj = selectedObject();
    if (!s || !s.enabled || !obj) return;
    const isCollider = (s.selectedPart === 'collider');
    if (isCollider && !hasCollider(obj)) return;
    const r = activeRectOf(obj); const p1 = mapToCanvas(r.x, r.y); const p2 = mapToCanvas(r.x+r.w, r.y+r.h);
    ctx.save();
    // 콜라이더는 초록, 오브젝트는 파랑으로 구분
    ctx.strokeStyle = isCollider ? '#5ef08a' : '#74d9ff'; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.setLineDash([]);
    handlePoints(r).forEach(function (h) {
      const p = mapToCanvas(h[1], h[2]);
      ctx.fillStyle = isCollider ? '#0d3320' : '#102c46'; ctx.strokeStyle = isCollider ? '#8effb0' : '#a8ddff'; ctx.lineWidth = 2;
      ctx.fillRect(p.x - HANDLE_SIZE/2, p.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeRect(p.x - HANDLE_SIZE/2, p.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
    });
    ctx.restore();
  }

  function drawV3Overlay(ctx) {
    drawAssetObjects(ctx);
    drawHandles(ctx);
    drawVirtualSelection(ctx);
  }
  // 개선: 가상 오브젝트(캐릭터/스폰/허수아비) 선택 시 표시
  function drawVirtualSelection(ctx) {
    const s = state();
    if (!s || !s.enabled || !s._virtual) return;
    const v = s._virtual;
    const cx = v.getX(), cy = v.getY();
    const p1 = mapToCanvas(cx - v.w/2, cy - v.h/2);
    const p2 = mapToCanvas(cx + v.w/2, cy + v.h/2);
    ctx.save();
    ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.5; ctx.setLineDash([5,3]);
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.setLineDash([]);
    // 라벨
    ctx.fillStyle = '#ffd84d'; ctx.font = 'bold 12px "Noto Serif KR", serif';
    ctx.fillText(v.label || '선택됨', p1.x, p1.y - 5);
    ctx.restore();
  }

  function patchRender() {
    if (v3.patchedRender || typeof renderMap !== 'function') return;
    const previous = renderMap;
    renderMap = function (c) {
      previous(c);
      /* (v261) 이중 렌더 제거 — 본체 renderMap 전담 */
    };
    v3.patchedRender = true;
  }

  function hitResizeHandle(clientX, clientY) {
    // (v240l) 리사이즈는 최신 세대(v34)가 전담 — 구세대 판정이 함께 발동하며
    //  서로 상태를 덮어써 '잡혔다 풀리는' 문제를 만들어 비활성화.
    return '';
    const obj = selectedObject(); const s = state();
    if (!s || !s.enabled || !obj) return '';
    if (s.selectedPart === 'collider' && !hasCollider(obj)) return '';
    const r = activeRectOf(obj); const p = canvasToMap(clientX, clientY);
    // (v240k-3) 씬 뷰 정합 — 판정을 '화면 픽셀' 기준으로.
    //  예전엔 backing 픽셀 거리로 판정해, 씬 뷰(캔버스 축소) 상태에서 반경이 맵 기준으로
    //  부풀어 오브젝트 '중앙'을 클릭해도 리사이즈 핸들로 오인 → startResize 가
    //  dragging 을 꺼버려 이동이 죽고 커서와 오브젝트가 어긋났다.
    const cvEl = canvas(); const rct = cvEl.getBoundingClientRect();
    const k = (rct.width && cvEl.width) ? (rct.width / cvEl.width) : 1;   // backing px → 화면 px
    // 본체 안쪽 깊숙한 클릭은 항상 '이동'이 우선 (유니티와 동일)
    const c1 = mapToCanvas(r.x, r.y), c2 = mapToCanvas(r.x + r.w, r.y + r.h);
    // 내부는 항상 '이동' (유니티식) — 리사이즈는 경계·모서리 근접에서만
    if (p.sx > c1.x + 2 && p.sx < c2.x - 2 && p.sy > c1.y + 2 && p.sy < c2.y - 2) return '';
    for (const h of handlePoints(r)) {
      const hp = mapToCanvas(h[1], h[2]);
      const dx = p.sx - hp.x, dy = p.sy - hp.y;
      if (Math.sqrt(dx*dx + dy*dy) * k <= HANDLE_HIT) return h[0];
    }
    return '';
  }

  function startResize(handle, clientX, clientY) {
    const obj = selectedObject(); const s = state(); if (!obj || !s) return;
    v3.resizing = true; v3.resizeHandle = handle;
    v3.resizeStart = { mouse: canvasToMap(clientX, clientY), rect: activeRectOf(obj), collider: (s.selectedPart === 'collider') };
    s.dragging = false; s.dragMode = null;
    canvas().style.cursor = cursorForHandle(handle);
  }

  function cursorForHandle(h) {
    if (h === 'n' || h === 's') return 'ns-resize';
    if (h === 'e' || h === 'w') return 'ew-resize';
    if (h === 'nw' || h === 'se') return 'nwse-resize';
    return 'nesw-resize';
  }

  function updateResize(clientX, clientY) {
    const obj = selectedObject(); if (!v3.resizing || !obj || !v3.resizeStart) return;
    const p = canvasToMap(clientX, clientY); const st = v3.resizeStart; const r = st.rect;
    const dx = p.x - st.mouse.x, dy = p.y - st.mouse.y;
    let x = r.x, y = r.y, w = r.w, h = r.h;
    const hd = v3.resizeHandle;
    if (hd.includes('e')) w = r.w + dx;
    if (hd.includes('s')) h = r.h + dy;
    if (hd.includes('w')) { x = r.x + dx; w = r.w - dx; }
    if (hd.includes('n')) { y = r.y + dy; h = r.h - dy; }
    const min = 0.01;
    if (w < min) { if (hd.includes('w')) x = r.x + r.w - min; w = min; }
    if (h < min) { if (hd.includes('n')) y = r.y + r.h - min; h = min; }
    if (st.collider) {
      // 콜라이더만 조절 (오브젝트 크기는 건드리지 않음)
      obj.cx = clamp01(x); obj.cy = clamp01(y); obj.cw = clamp(w, min, 1); obj.ch = clamp(h, min, 1);
    } else {
      obj.rx = clamp01(x); obj.ry = clamp01(y); obj.rw = clamp(w, min, 1); obj.rh = clamp(h, min, 1);
      if (hasCollider(obj) && (obj._colliderFollowsResize !== false)) {
        obj.cx = obj.rx; obj.cy = obj.ry + obj.rh * 0.55; obj.cw = obj.rw; obj.ch = obj.rh * 0.38;
      }
    }
    if (editor()) editor().refresh();
  }

  function endResize() {
    if (!v3.resizing) return;
    v3.resizing = false; v3.resizeHandle = ''; v3.resizeStart = null; canvas().style.cursor = '';
    if (editor()) { editor().save(false); editor().refresh(); }
    toast('크기 조정 저장 완료');
  }

  function setCameraFromWheel(e) {
    const s = state(); if (!s || !s.enabled) return;
    if (!overCanvas(e)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const currentView = window.BD_getEditorViewportV26 ? window.BD_getEditorViewportV26() : { w:1/s.editorZoom, h:1/s.editorZoom };
    if (e.shiftKey || e.ctrlKey || e.altKey) {
      const speed = e.altKey ? 0.025 : 0.075;
      if (e.shiftKey) s.editorCamX += Math.sign(e.deltaY) * currentView.w * speed;
      else s.editorCamY += Math.sign(e.deltaY) * currentView.h * speed;
    } else {
      const cvEl = canvas();
      const rect = cvEl ? cvEl.getBoundingClientRect() : null;
      const sx = rect ? (e.clientX - rect.left) * (cvEl.width / rect.width) : cvEl.width / 2;
      const sy = rect ? (e.clientY - rect.top) * (cvEl.height / rect.height) : cvEl.height / 2;
      const scale = Number(currentScale) || 1;
      const ux = (((sx - cvEl.width / 2) / scale + BASE_W / 2) / BASE_W) - 0.5;
      const uy = (((sy - cvEl.height / 2) / scale + BASE_H / 2) / BASE_H) - 0.5;
      s.editorViewMode = 'custom';
      s.editorZoom = clamp(s.editorZoom + (e.deltaY < 0 ? 0.18 : -0.18), 0.25, 12);
      const nextView = window.BD_getEditorViewportV26 ? window.BD_getEditorViewportV26() : { w:1/s.editorZoom, h:1/s.editorZoom };
      s.editorCamX += ux * (currentView.w - nextView.w);
      s.editorCamY += uy * (currentView.h - nextView.h);
    }
    const view = window.BD_getEditorViewportV26 ? window.BD_getEditorViewportV26() : { w:1/s.editorZoom, h:1/s.editorZoom };
    s.editorCamX = view.w >= 1 ? 0.5 : clamp(s.editorCamX, view.w/2, 1-view.w/2);
    s.editorCamY = view.h >= 1 ? 0.5 : clamp(s.editorCamY, view.h/2, 1-view.h/2);
    camX = s.editorCamX; camY = s.editorCamY;
    if (editor()) editor().refresh();
  }

  function applyAssetToSelected() {
    const obj = selectedObject(); const sel = $('bge-v3-asset-select');
    if (!obj) { alert('먼저 오브젝트를 선택하세요.'); return; }
    const asset = assetById(sel.value);
    if (!asset) { alert('적용할 이미지를 선택하세요.'); return; }
    obj.assetId = asset.id; obj.key = obj.key || 'custom_asset';
    if (editor()) { editor().save(false); editor().refresh(); }
    toast('선택 오브젝트에 이미지 적용 완료');
  }

  function createAssetObjectAt(mx, my) {
    const st = currentStageObj(); const asset = assetById($('bge-v3-asset-select').value);
    if (!st || !asset) { alert('배치할 이미지를 먼저 선택하세요.'); return; }
    if (!st.objects) st.objects = [];
    const obj = {
      _editorId: 'v3_asset_' + Date.now().toString(36),
      type: 'prop', label: asset.name || '새 이미지 오브젝트', key: 'custom_asset', assetId: asset.id,
      rx: clamp01(mx - 0.05), ry: clamp01(my - 0.05), rw: 0.10, rh: 0.10,
      cx: clamp01(mx - 0.05), cy: clamp01(my), cw: 0.10, ch: 0.04,
      interactable: '', note: ''
    };
    st.objects.push(obj);
    const s = state(); if (s) { s.selectedIndex = st.objects.length - 1; s.selectedPart = 'object'; s.tool = 'select'; }
    v3.assetPlaceMode = false;
    updatePlaceButton();
    if (editor()) { editor().save(false); editor().refresh(); }
    toast('이미지 오브젝트 배치 완료');
  }

  function updatePlaceButton() {
    const btn = $('bge-v3-place-asset'); if (!btn) return;
    btn.textContent = v3.assetPlaceMode ? '에셋 배치 중지' : '에셋 배치 모드';
    btn.classList.toggle('danger', v3.assetPlaceMode);
  }

  function refreshDialogueForm() {
    const obj = selectedObject();
    const speaker = $('bge-v3-speaker'), portrait = $('bge-v3-portrait'), text = $('bge-v3-dialogue'), style = $('bge-v3-dialogue-style'), key = $('bge-v3-action-key'), qid = $('bge-v3-quest-id');
    if (!speaker || !obj) { refreshDialoguePreview(null); return; }
    speaker.value = obj.dialogueSpeaker || obj.speaker || obj.label || '';
    portrait.value = obj.portraitAssetId || '';
    text.value = obj.dialogueText || obj.note || '';
    style.value = obj.dialogueStyle || 'vn_dark';
    key.value = obj.actionKey || 'Z';
    qid.value = obj.questId || '';
    refreshDialoguePreview(obj);
  }

  function applyDialogueForm() {
    const obj = selectedObject(); if (!obj) return;
    obj.dialogueSpeaker = $('bge-v3-speaker').value.trim();
    obj.portraitAssetId = $('bge-v3-portrait').value;
    obj.dialogueText = $('bge-v3-dialogue').value;
    obj.dialogueStyle = $('bge-v3-dialogue-style').value;
    obj.actionKey = $('bge-v3-action-key').value.trim() || 'Z';
    obj.questId = $('bge-v3-quest-id').value.trim();
    if (!obj.note && obj.dialogueText) obj.note = obj.dialogueText;
    refreshDialoguePreview(obj);
    if (editor()) editor().save(false);
  }

  function refreshDialoguePreview(obj) {
    const box = $('bge-v3-vn-preview'); if (!box) return;
    if (!obj) { box.innerHTML = '<div class="speaker">화자</div><div class="line">선택된 오브젝트에 대사를 입력하면 이곳에 미리보기로 표시됩니다.</div>'; return; }
    const asset = assetById(obj.portraitAssetId);
    const portrait = asset ? '<img class="portrait" src="' + asset.dataUrl + '">' : '<div class="portrait"></div>';
    box.innerHTML = portrait + '<div class="speaker">' + escapeHtml(obj.dialogueSpeaker || obj.label || 'NPC') + '</div><div class="line">' + escapeHtml(obj.dialogueText || obj.note || '대사를 입력하세요.') + '</div>';
  }

  function updateKoreanUi() {
    const map = {
      'bge-tool-select':'선택', 'bge-tool-pan':'화면 이동', 'bge-tool-place':'기본 배치', 'bge-overview':'맵 전체보기',
      'bge-place-on':'기본 배치 모드', 'bge-pick-entry':'이동 후 등장 위치 찍기', 'bge-preview-entry':'대상 맵 확인',
      'bge-copy-collider':'콜라이더를 오브젝트 크기에 맞춤'
    };
    Object.keys(map).forEach(function (id) { if ($(id)) $(id).textContent = map[id]; });
    ['bge-obj-type','bge-palette-type'].forEach(function (id) {
      const sel = $(id); if (!sel) return;
      Array.from(sel.options).forEach(function (opt) { opt.textContent = (KO_TYPE[opt.value] || opt.value) + ' (' + opt.value + ')'; });
    });
    document.querySelectorAll('input[type="number"]').forEach(function (input) {
      input.classList.add('bge-v3-scrub');
      input.title = '좌우 드래그: 값 조절 / 휠: 0.1 단위 조절 / Shift+휠: 0.01 단위';
      if (!input.dataset.v3StepPatched) {
        input.dataset.v3StepPatched = '1';
        input.addEventListener('wheel', function (e) {
          const s = state(); if (!s || !s.enabled) return;
          e.preventDefault();
          const step = e.shiftKey ? 0.01 : 0.1;
          const dir = e.deltaY < 0 ? 1 : -1;
          input.value = (Number(input.value || 0) + dir * step).toFixed(3);
          input.dispatchEvent(new Event('input', { bubbles:true }));
        }, { passive:false });
      }
    });
  }

  function startNumberScrub(e) {
    const s = state();
    if (!s || !s.enabled || e.button !== 0 || e.target.tagName !== 'INPUT' || e.target.type !== 'number') return;
    v3.scrub = { input:e.target, startX:e.clientX, startValue:Number(e.target.value || 0), active:false };
  }

  function updateNumberScrub(e) {
    if (!v3.scrub) return;
    const dx = e.clientX - v3.scrub.startX;
    if (!v3.scrub.active && Math.abs(dx) < 3) return;
    v3.scrub.active = true;
    e.preventDefault();
    const step = e.shiftKey ? 0.01 : 0.1;
    const value = v3.scrub.startValue + Math.round(dx / 8) * step;
    const input = v3.scrub.input;
    input.value = clamp(value, input.min === '' ? -999 : Number(input.min), input.max === '' ? 999 : Number(input.max)).toFixed(3);
    input.dispatchEvent(new Event('input', { bubbles:true }));
  }

  function endNumberScrub() {
    if (v3.scrub && v3.scrub.active && editor()) editor().save(false);
    v3.scrub = null;
  }

  function exportProject() {
    const data = { version: V3_PROJECT_VERSION, savedAt: new Date().toISOString(), stages: clone(STAGES), assets: clone(v3.assets) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'bongdam_rpg_project_v3.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('통합 프로젝트 내보내기 완료');
  }

  function importProjectFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.assets && Array.isArray(data.assets)) { v3.assets = data.assets; saveAssets(); }
        if (data.stages && typeof data.stages === 'object') {
          Object.keys(STAGES).forEach(function (k) { delete STAGES[k]; });
          Object.keys(data.stages).forEach(function (k) { STAGES[k] = data.stages[k]; });
          if (typeof currentStage !== 'undefined' && !STAGES[currentStage]) currentStage = Number(Object.keys(STAGES)[0] || 1);
        }
        refreshAssetSelects();
        if (editor()) { editor().save(false); editor().refresh(); }
        toast('통합 프로젝트 가져오기 완료');
      } catch (err) { alert('통합 가져오기 실패: ' + err.message); }
    };
    reader.readAsText(file, 'utf-8');
  }

  // (v240j) 캔버스 위 판정 — 에디터 오버레이(라벨·하이라이트)가 이벤트 타깃을 가로채
  //  canvas 리스너가 못 받던 문제. bge 패널 위(목록 스크롤 등)는 제외한다.
  function overCanvas(e) {
    const c = canvas(); if (!c) return false;
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

  function bind() {
    const c = canvas(); if (!c) return;

    document.addEventListener('wheel', setCameraFromWheel, { passive:false, capture:true });

    document.addEventListener('mousedown', function (e) {
      const s = state(); if (!s || !s.enabled) return;
      if (!overCanvas(e)) return;
      if (e.button === 1) {
        e.preventDefault(); e.stopImmediatePropagation();
        v3.middlePan = { x:e.clientX, y:e.clientY, camX:s.editorCamX, camY:s.editorCamY };
        return;
      }
      const handle = hitResizeHandle(e.clientX, e.clientY);
      if (handle && e.button === 0) {
        e.preventDefault(); e.stopImmediatePropagation();
        startResize(handle, e.clientX, e.clientY);
        return;
      }
      if (v3.assetPlaceMode && e.button === 0) {
        e.preventDefault(); e.stopImmediatePropagation();
        const p = canvasToMap(e.clientX, e.clientY);
        createAssetObjectAt(p.x, p.y);
      }
    }, true);

    document.addEventListener('mousemove', function (e) {
      const s = state(); if (!s || !s.enabled) return;
      if (v3.resizing) { e.preventDefault(); e.stopImmediatePropagation(); updateResize(e.clientX, e.clientY); return; }
      if (v3.middlePan) {
        e.preventDefault(); e.stopImmediatePropagation();
        const rect = c.getBoundingClientRect();
        s.editorCamX = v3.middlePan.camX - (e.clientX - v3.middlePan.x) / rect.width * viewportW();
        s.editorCamY = v3.middlePan.camY - (e.clientY - v3.middlePan.y) / rect.height * viewportH();
        const view = window.BD_getEditorViewportV26 ? window.BD_getEditorViewportV26() : {w:1/s.editorZoom,h:1/s.editorZoom};
        const vw = view.w, vh = view.h;
        s.editorCamX = vw >= 1 ? 0.5 : clamp(s.editorCamX, vw/2, 1-vw/2); s.editorCamY = vh >= 1 ? 0.5 : clamp(s.editorCamY, vh/2, 1-vh/2);
        camX = s.editorCamX; camY = s.editorCamY;
        if (editor()) editor().refresh();
        return;
      }
      const handle = hitResizeHandle(e.clientX, e.clientY);
      c.style.cursor = handle ? cursorForHandle(handle) : '';
    }, true);

    window.addEventListener('mousemove', updateNumberScrub, true);
    window.addEventListener('mouseup', function () { endResize(); v3.middlePan = null; endNumberScrub(); }, true);
    document.addEventListener('mousedown', startNumberScrub, true);

    $('bge-v3-asset-file').addEventListener('change', function () {
      const file = this.files && this.files[0]; if (!file) return;
      v3.pendingFileName = file.name.replace(/\.[^.]+$/, '');
      $('bge-v3-asset-name').value = $('bge-v3-asset-name').value || v3.pendingFileName;
      const reader = new FileReader();
      reader.onload = function () { v3.pendingFileDataUrl = String(reader.result || ''); toast('이미지 준비 완료: 이미지 등록을 누르세요.'); };
      reader.readAsDataURL(file);
    });

    $('bge-v3-upload-asset').addEventListener('click', function () {
      if (!v3.pendingFileDataUrl) { alert('먼저 이미지 파일을 선택하세요.'); return; }
      const name = $('bge-v3-asset-name').value.trim() || v3.pendingFileName || '새 이미지';
      const id = 'asset_' + Date.now().toString(36);
      v3.assets.push({ id:id, name:name, dataUrl:v3.pendingFileDataUrl });
      v3.pendingFileDataUrl = ''; $('bge-v3-asset-file').value = ''; $('bge-v3-asset-name').value = '';
      saveAssets(); refreshAssetSelects(); $('bge-v3-asset-select').value = id; refreshAssetPreview();
      toast('이미지 에셋 등록 완료');
    });
    $('bge-v3-asset-select').addEventListener('change', refreshAssetPreview);
    $('bge-v3-apply-asset').addEventListener('click', applyAssetToSelected);
    $('bge-v3-place-asset').addEventListener('click', function () { v3.assetPlaceMode = !v3.assetPlaceMode; const s = state(); if (s) s.tool = 'select'; updatePlaceButton(); toast(v3.assetPlaceMode ? '맵을 클릭해 선택 이미지를 배치하세요.' : '에셋 배치 모드 종료'); });
    $('bge-v3-delete-asset').addEventListener('click', function () {
      const id = $('bge-v3-asset-select').value; const asset = assetById(id); if (!asset) return;
      if (!confirm('선택한 이미지 에셋을 삭제할까요? 이미 배치된 오브젝트에서는 이미지가 사라질 수 있습니다.')) return;
      v3.assets = v3.assets.filter(function (a) { return a.id !== id; }); imageCache.delete(id); saveAssets(); refreshAssetSelects(); if (editor()) editor().refresh(); toast('이미지 에셋 삭제 완료');
    });

    // =====================================================================
    // 개선: 아이들용 "🎨 내 그림 추가" 패널 (검증된 v3 에셋 로직 재사용)
    //  - 같은 ASSET_KEY / v3.assets / setObjectAsset 를 써서 기존 렌더링과 100% 호환
    // =====================================================================
    let myartPending = '';
    function myartRenderList() {
      const box = $('bge-myart-list'); if (!box) return;
      if (!v3.assets.length) { box.innerHTML = '<div class="bge-muted" style="font-size:11px;padding:6px 2px">아직 저장한 그림이 없어요. 위에서 그림을 올려보세요.</div>'; return; }
      box.innerHTML = v3.assets.map(function (a) {
        const sel = (myart._sel === a.id) ? ' bge-myart-on' : '';
        return '<div class="bge-myart-item' + sel + '" data-myart="' + a.id + '">'
          + '<img src="' + a.dataUrl + '" alt="">'
          + '<span>' + escapeHtml(a.name || a.id) + '</span></div>';
      }).join('');
      box.querySelectorAll('[data-myart]').forEach(function (el) {
        el.addEventListener('click', function () { myart._sel = el.getAttribute('data-myart'); myartRenderList(); });
      });
    }
    const myart = { _sel: '' };
    // ① 파일 선택 → 미리보기
    var _mf = $('bge-myart-file');
    if (_mf) _mf.addEventListener('change', function () {
      const file = this.files && this.files[0]; if (!file) return;
      const base = file.name.replace(/\.[^.]+$/, '');
      if ($('bge-myart-name') && !$('bge-myart-name').value) $('bge-myart-name').value = base;
      const reader = new FileReader();
      reader.onload = function () {
        myartPending = String(reader.result || '');
        const pv = $('bge-myart-preview');
        if (pv) pv.innerHTML = '<img src="' + myartPending + '" alt="미리보기">';
      };
      reader.readAsDataURL(file);
    });
    // ② 저장 → v3.assets 에 추가 (기존 저장 로직과 동일)
    var _ms = $('bge-myart-save');
    if (_ms) _ms.addEventListener('click', function () {
      if (!myartPending) { alert('먼저 그림 파일을 고르세요.'); return; }
      const name = ($('bge-myart-name').value || '').trim() || '내 그림';
      const id = 'asset_' + Date.now().toString(36);
      v3.assets.push({ id: id, name: name, dataUrl: myartPending });
      saveAssets(); refreshAssetSelects();
      myartPending = ''; $('bge-myart-file').value = ''; $('bge-myart-name').value = '';
      const pv = $('bge-myart-preview'); if (pv) pv.innerHTML = '그림을 고르면 여기에 미리보기가 나와요.';
      myart._sel = id; myartRenderList();
      toast('🎨 내 그림 저장 완료: ' + name);
    });
    // ③ 선택 오브젝트에 입히기 (setObjectAsset 사용 → 게임 렌더와 호환)
    var _ma = $('bge-myart-apply');
    if (_ma) _ma.addEventListener('click', function () {
      const obj = selectedObject();
      if (!obj) { alert('먼저 맵에서 오브젝트를 선택하세요.'); return; }
      if (!myart._sel) { alert('입힐 그림을 목록에서 고르세요.'); return; }
      // setObjectAsset 과 동일한 필드 세팅 (게임 렌더 호환)
      obj.assetId = myart._sel; obj.key = 'asset:' + myart._sel; obj.customImage = true;
      if (editor()) { editor().save(false); editor().refresh(); }
      toast('✅ 그림을 입혔어요!');
    });
    // 새 오브젝트로 맵에 놓기
    var _mp = $('bge-myart-place');
    if (_mp) _mp.addEventListener('click', function () {
      if (!myart._sel) { alert('놓을 그림을 목록에서 고르세요.'); return; }
      const st = currentStageObj(); if (!st) return;
      const asset = assetById(myart._sel); if (!asset) return;
      const cx = (typeof camX !== 'undefined') ? camX : 0.5, cy = (typeof camY !== 'undefined') ? camY : 0.5;
      const obj = { label: asset.name || '내 그림', type: 'deco', rx: cx, ry: cy, rw: 0.12, rh: 0.12 };
      obj.assetId = myart._sel; obj.key = 'asset:' + myart._sel; obj.customImage = true;
      st.objects.push(obj);
      const s = state(); if (s) { s.selectedIndex = st.objects.length - 1; s.selectedPart = 'object'; }
      if (editor()) { editor().save(false); editor().refresh(); }
      toast('🖼 맵에 새 그림을 놓았어요!');
    });
    // 그림 벗기기
    var _mr = $('bge-myart-remove');
    if (_mr) _mr.addEventListener('click', function () {
      const obj = selectedObject();
      if (!obj) { alert('먼저 오브젝트를 선택하세요.'); return; }
      // 그림 벗기기: assetId 제거 + asset: key 초기화
      delete obj.assetId; delete obj.customImage;
      if (typeof obj.key === 'string' && obj.key.indexOf('asset:') === 0) obj.key = '';
      if (editor()) { editor().save(false); editor().refresh(); }
      toast('그림을 벗겼어요 (기본 모양으로 돌아감)');
    });
    // 초기 렌더
    myartRenderList();
    // v3 목록이 갱신될 때 내 그림 목록도 같이 갱신 (안전하게 폴링에서 동기화)
    myart._syncList = myartRenderList;

    ['bge-v3-speaker','bge-v3-portrait','bge-v3-dialogue','bge-v3-dialogue-style','bge-v3-action-key','bge-v3-quest-id'].forEach(function (id) {
      $(id).addEventListener('input', applyDialogueForm); $(id).addEventListener('change', applyDialogueForm);
    });
    $('bge-v3-export-project').addEventListener('click', exportProject);
    $('bge-v3-import-project-btn').addEventListener('click', function () { $('bge-v3-import-project-file').click(); });
    $('bge-v3-import-project-file').addEventListener('change', function () { const file = this.files && this.files[0]; if (file) importProjectFile(file); this.value = ''; });
  }

  function pollRefresh() {
    const s = state(); const panel = $('bge-v3-panel');
    if (panel && s) panel.classList.toggle('bge-open', !!s.enabled && s.activeTab === 'dialog');
    updateKoreanUi();
    const obj = selectedObject();
    if (pollRefresh._lastObj !== obj) { pollRefresh._lastObj = obj; refreshDialogueForm(); }
    requestAnimationFrame(pollRefresh);
  }

  function init() {
    if (!editor() || typeof STAGES === 'undefined' || !$('game-canvas')) { setTimeout(init, 150); return; }
    loadAssets(); refreshAssetSelects(); patchRender(); bind(); updatePlaceButton(); pollRefresh();
    const oldRefresh = editor().refresh;
    editor().refresh = function () { oldRefresh(); refreshAssetSelects(); refreshDialogueForm(); updateKoreanUi(); };
    window.BongdamEditorV3 = { assets:v3.assets, exportProject:exportProject, refresh:function(){ refreshAssetSelects(); refreshDialogueForm(); if (editor()) editor().refresh(); } };
    toast('v3 씬 에디터 확장 로드 완료');
  }

  /* (v268) 구세대 모듈 부트 차단 — v3 (v5.2 에디터로 일원화) */
})();
