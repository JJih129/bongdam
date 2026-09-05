
(function () {
  'use strict';

  const ASSET_KEY = 'bongdam_rpg_editor_assets_v3';
  const HANDLE_SIZE = 14;
  const HANDLE_HIT = 22;
  const MIN_SIZE = 0.006;
  const $ = (id) => document.getElementById(id);

  const v31 = {
    assets: [],
    imageCache: new Map(),
    resizing: false,
    resizeHandle: '',
    resizeStart: null,
    patchedRender: false,
    selectedAssetId: '',
    placeMode: false
  };

  function editor() { return window.BongdamEditor || null; }
  function state() { return editor() ? editor().state : null; }
  function canvas() { return $('game-canvas'); }
  function clamp(v, a, b) { v = Number(v); if (!Number.isFinite(v)) return a; return Math.max(a, Math.min(b, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function clone(value) { return window.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
  function stage() { return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; }
  function objects() { const st = stage(); return st && Array.isArray(st.objects) ? st.objects : []; }
  function selectedObject() { const s = state(); const list = objects(); return s && s.selectedIndex >= 0 && s.selectedIndex < list.length ? list[s.selectedIndex] : null; }
  function hasCollider(o) { return o && o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined; }
  function rectOf(o) { return { x:Number(o.rx || 0), y:Number(o.ry || 0), w:Number(o.rw || 0.08), h:Number(o.rh || 0.08) }; }
  function setRect(o, r) { o.rx = clamp01(r.x); o.ry = clamp01(r.y); o.rw = clamp(r.w, MIN_SIZE, 1); o.rh = clamp(r.h, MIN_SIZE, 1); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

  function toast(msg) {
    const el = $('bge-toast');
    if (!el) { console.log(msg); return; }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.style.display = 'none'; }, 1800);
  }

  function loadAssets() {
    try {
      const raw = localStorage.getItem(ASSET_KEY);
      v31.assets = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(v31.assets)) v31.assets = [];
    } catch (_) { v31.assets = []; }
  }

  function saveAssets() {
    try { localStorage.setItem(ASSET_KEY, JSON.stringify(v31.assets)); }
    catch (err) { alert('에셋 저장 실패: 이미지가 너무 크거나 브라우저 저장공간이 부족합니다. 이미지를 줄이거나 에셋팩으로 따로 백업하세요.'); }
  }

  function assetById(id) { return v31.assets.find(a => a.id === id) || null; }
  function assetIdFromObject(obj) {
    if (!obj) return '';
    if (obj.assetId) return obj.assetId;
    if (typeof obj.key === 'string' && obj.key.startsWith('asset:')) return obj.key.slice(6);
    return '';
  }

  function setObjectAsset(obj, assetId) {
    if (!obj) return;
    if (assetId) {
      obj.assetId = assetId;
      obj.key = 'asset:' + assetId; // 기존 key 필드에서도 추적되도록 저장
      obj.customImage = true;
    } else {
      delete obj.assetId;
      if (typeof obj.key === 'string' && obj.key.startsWith('asset:')) obj.key = '';
      delete obj.customImage;
    }
  }

  function getImage(assetId) {
    const asset = assetById(assetId);
    if (!asset || !asset.dataUrl) return null;
    if (v31.imageCache.has(assetId)) return v31.imageCache.get(assetId);
    const img = new Image();
    img.onload = function () { if (editor()) editor().refresh(); };
    img.src = asset.dataUrl;
    v31.imageCache.set(assetId, img);
    return img;
  }

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

  function drawCustomAssets(ctx) {
    objects().forEach(function (obj) {
      const assetId = assetIdFromObject(obj);
      if (!assetId || obj.hidden) return;
      const img = getImage(assetId);
      if (!img || !img.complete || img.naturalWidth <= 0) return;
      const r = rectOf(obj);
      const p1 = mapToCanvas(r.x, r.y);
      const p2 = mapToCanvas(r.x + r.w, r.y + r.h);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
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

  function drawResizeHandles(ctx) {
    const s = state(); const obj = selectedObject();
    if (!s || !s.enabled || !obj || s.selectedPart === 'collider') return;
    const r = rectOf(obj); const p1 = mapToCanvas(r.x, r.y); const p2 = mapToCanvas(r.x + r.w, r.y + r.h);
    ctx.save();
    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 3; ctx.setLineDash([8,5]);
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.setLineDash([]);
    handlePoints(r).forEach(function (h) {
      const p = mapToCanvas(h[1], h[2]);
      ctx.fillStyle = '#fff7b3'; ctx.strokeStyle = '#102c46'; ctx.lineWidth = 2;
      ctx.fillRect(p.x - HANDLE_SIZE / 2, p.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
      ctx.strokeRect(p.x - HANDLE_SIZE / 2, p.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    });
    ctx.restore();
  }

  function patchRender() {
    if (v31.patchedRender || typeof renderMap !== 'function') return;
    const prev = renderMap;
    renderMap = function (c) {
      prev(c);
      /* (v261) 이중 렌더 제거 — 본체 renderMap 전담 (핸들은 v34 전담) */
    };
    v31.patchedRender = true;
  }

  function cursorForHandle(h) {
    if (h === 'n' || h === 's') return 'ns-resize';
    if (h === 'e' || h === 'w') return 'ew-resize';
    if (h === 'nw' || h === 'se') return 'nwse-resize';
    return 'nesw-resize';
  }

  function hitHandle(clientX, clientY) {
    return '';   // (v240l) v34 전담 — 구세대 비활성
    const obj = selectedObject(); const s = state();
    if (!s || !s.enabled || !obj || s.selectedPart === 'collider') return '';
    const r = rectOf(obj); const p = canvasToMap(clientX, clientY);
    // (v240k-3) 씬 뷰 정합: 화면 픽셀 기준 판정 + 본체 안쪽 깊숙한 클릭은 이동 우선
    const _cv = canvas(); const _rc = _cv.getBoundingClientRect();
    const _k = (_rc.width && _cv.width) ? (_rc.width / _cv.width) : 1;
    const _c1 = mapToCanvas(r.x, r.y), _c2 = mapToCanvas(r.x + r.w, r.y + r.h);
    if (p.sx > _c1.x + 2 && p.sx < _c2.x - 2 && p.sy > _c1.y + 2 && p.sy < _c2.y - 2) return '';
    for (const h of handlePoints(r)) {
      const hp = mapToCanvas(h[1], h[2]);
      const dx = p.sx - hp.x, dy = p.sy - hp.y;
      if (Math.sqrt(dx * dx + dy * dy) * _k <= HANDLE_HIT) return h[0];
    }
    return '';
  }

  function startResize(handle, e) {
    const obj = selectedObject(); const s = state();
    if (!obj || !s) return;
    const startMouse = canvasToMap(e.clientX, e.clientY);
    v31.resizing = true;
    v31.resizeHandle = handle;
    v31.resizeStart = { mouse:startMouse, rect:rectOf(obj), collider: hasCollider(obj) ? { cx:Number(obj.cx), cy:Number(obj.cy), cw:Number(obj.cw), ch:Number(obj.ch) } : null };
    s.dragging = false;
    s.dragMode = null;
    canvas().style.cursor = cursorForHandle(handle);
  }

  function updateResize(e) {
    if (!v31.resizing || !v31.resizeStart) return;
    const obj = selectedObject(); if (!obj) return;
    const p = canvasToMap(e.clientX, e.clientY);
    const st = v31.resizeStart; const r = st.rect;
    const dx = p.x - st.mouse.x; const dy = p.y - st.mouse.y;
    let x = r.x, y = r.y, w = r.w, h = r.h;
    const hd = v31.resizeHandle;
    if (hd.includes('e')) w = r.w + dx;
    if (hd.includes('s')) h = r.h + dy;
    if (hd.includes('w')) { x = r.x + dx; w = r.w - dx; }
    if (hd.includes('n')) { y = r.y + dy; h = r.h - dy; }
    if (w < MIN_SIZE) { if (hd.includes('w')) x = r.x + r.w - MIN_SIZE; w = MIN_SIZE; }
    if (h < MIN_SIZE) { if (hd.includes('n')) y = r.y + r.h - MIN_SIZE; h = MIN_SIZE; }
    x = clamp(x, 0, 1 - MIN_SIZE); y = clamp(y, 0, 1 - MIN_SIZE);
    w = Math.min(w, 1 - x); h = Math.min(h, 1 - y);
    setRect(obj, { x, y, w, h });

    // 콜라이더는 오브젝트 내부 비율을 유지해서 같이 스케일됨
    if (hasCollider(obj) && st.collider) {
      const relX = (st.collider.cx - r.x) / Math.max(r.w, MIN_SIZE);
      const relY = (st.collider.cy - r.y) / Math.max(r.h, MIN_SIZE);
      const relW = st.collider.cw / Math.max(r.w, MIN_SIZE);
      const relH = st.collider.ch / Math.max(r.h, MIN_SIZE);
      obj.cx = clamp01(obj.rx + obj.rw * relX);
      obj.cy = clamp01(obj.ry + obj.rh * relY);
      obj.cw = clamp(obj.rw * relW, MIN_SIZE, 1);
      obj.ch = clamp(obj.rh * relH, MIN_SIZE, 1);
    }

    syncNumericInspector(obj);
    if (editor()) editor().refresh();
  }

  function endResize() {
    if (!v31.resizing) return;
    v31.resizing = false;
    v31.resizeHandle = '';
    v31.resizeStart = null;
    canvas().style.cursor = '';
    if (editor()) { editor().save(false); editor().refresh(); }
    toast('오브젝트 크기 조정 저장 완료');
  }

  function syncNumericInspector(obj) {
    if (!obj) return;
    const ids = { 'bge-obj-rx':'rx', 'bge-obj-ry':'ry', 'bge-obj-rw':'rw', 'bge-obj-rh':'rh', 'bge-obj-cx':'cx', 'bge-obj-cy':'cy', 'bge-obj-cw':'cw', 'bge-obj-ch':'ch' };
    Object.keys(ids).forEach(id => { const el = $(id); const k = ids[id]; if (el && obj[k] !== undefined) el.value = Number(obj[k]).toFixed(3); });
  }

  function refreshAssetSelectOptions() {
    ['bge-v31-object-asset', 'bge-v31-place-asset'].forEach(function (id) {
      const sel = $(id); if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = '<option value="">이미지 없음 / 기본 렌더링</option>';
      v31.assets.forEach(function (asset) {
        const opt = document.createElement('option'); opt.value = asset.id; opt.textContent = asset.name || asset.id; sel.appendChild(opt);
      });
      if (prev && assetById(prev)) sel.value = prev;
    });
    refreshQuickInspector();
  }

  function refreshQuickInspector() {
    const obj = selectedObject();
    const sel = $('bge-v31-object-asset');
    const preview = $('bge-v31-preview');
    if (!sel || !preview) return;
    const id = assetIdFromObject(obj);
    sel.value = id || '';
    const asset = assetById(id);
    if (!obj) {
      preview.innerHTML = '오브젝트를 선택하면 적용된 이미지가 표시됩니다.';
    } else if (asset) {
      preview.innerHTML = '<img src="' + asset.dataUrl + '"><div><b>' + escapeHtml(asset.name || asset.id) + '</b><br>현재 선택 오브젝트에 적용됨</div>';
    } else {
      preview.innerHTML = '<div>현재 오브젝트는 기본 이미지 Key를 사용합니다.<br>아래 목록에서 새 이미지를 선택하고 적용하세요.</div>';
    }
  }

  function applyObjectAssetFromInspector() {
    const obj = selectedObject();
    if (!obj) { alert('먼저 씬 오브젝트를 선택하세요.'); return; }
    const assetId = $('bge-v31-object-asset').value;
    setObjectAsset(obj, assetId);
    const keyInput = $('bge-obj-key'); if (keyInput) keyInput.value = obj.key || '';
    if (editor()) { editor().save(false); editor().refresh(); }
    refreshQuickInspector();
    toast(assetId ? '속성 창 이미지 적용 완료' : '이미지 적용 해제 완료');
  }

  function createObjectFromAsset(mx, my) {
    const st = stage(); const assetId = $('bge-v31-place-asset').value;
    const asset = assetById(assetId);
    if (!st || !asset) { alert('배치할 에셋을 먼저 선택하세요.'); return; }
    if (!Array.isArray(st.objects)) st.objects = [];
    const obj = {
      _editorId: 'v31_asset_' + Date.now().toString(36),
      type: 'prop', label: asset.name || '새 이미지 오브젝트', key: 'asset:' + asset.id, assetId: asset.id, customImage: true,
      rx: clamp01(mx - 0.05), ry: clamp01(my - 0.05), rw: 0.1, rh: 0.1,
      cx: clamp01(mx - 0.05), cy: clamp01(my + 0.01), cw: 0.1, ch: 0.035,
      interactable: '', note: ''
    };
    st.objects.push(obj);
    const s = state(); if (s) { s.selectedIndex = st.objects.length - 1; s.selectedPart = 'object'; s.tool = 'select'; }
    v31.placeMode = false;
    updatePlaceModeButton();
    if (editor()) { editor().save(false); editor().refresh(); }
    refreshQuickInspector();
    toast('에셋을 씬에 배치했습니다. 꼭지점 핸들로 크기를 조절하세요.');
  }

  function updatePlaceModeButton() {
    const btn = $('bge-v31-place-mode'); if (!btn) return;
    btn.textContent = v31.placeMode ? '씬 배치 중지' : '선택 에셋 씬에 배치';
    btn.classList.toggle('danger', v31.placeMode);
  }

  function importImageFiles(files) {
    const list = Array.from(files || []).filter(f => f && f.type && f.type.startsWith('image/'));
    if (!list.length) { alert('이미지 파일을 선택하세요.'); return; }
    let done = 0;
    list.forEach(function (file) {
      const reader = new FileReader();
      reader.onload = function () {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const id = 'asset_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        v31.assets.push({ id, name: baseName, dataUrl: String(reader.result || '') });
        done++;
        if (done === list.length) {
          saveAssets(); refreshAssetSelectOptions();
          toast(list.length + '개 이미지 가져오기 완료');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function exportAssetPack() {
    const data = { version: 'bongdam_asset_pack_v1', savedAt: new Date().toISOString(), assets: clone(v31.assets) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'bongdam_asset_library_pack.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('에셋 라이브러리 팩 내보내기 완료');
  }

  function importAssetPack(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        const incoming = Array.isArray(data.assets) ? data.assets : [];
        if (!incoming.length) throw new Error('assets 배열이 없습니다.');
        const exists = new Set(v31.assets.map(a => a.id));
        incoming.forEach(function (asset) {
          if (!asset || !asset.dataUrl) return;
          let id = asset.id || ('asset_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));
          if (exists.has(id)) id = id + '_' + Math.random().toString(36).slice(2, 5);
          exists.add(id);
          v31.assets.push({ id, name: asset.name || id, dataUrl: asset.dataUrl });
        });
        saveAssets(); refreshAssetSelectOptions();
        if (editor()) editor().refresh();
        toast('에셋 라이브러리 팩 가져오기 완료');
      } catch (err) { alert('에셋팩 가져오기 실패: ' + err.message); }
    };
    reader.readAsText(file, 'utf-8');
  }

  function buildQuickInspector() {
    if ($('bge-v31-quick-inspector')) return;
    const host = $('bge-inspector') || $('bge-v3-panel') || document.body;
    const box = document.createElement('div');
    box.id = 'bge-v31-quick-inspector';
    box.innerHTML = `
      <h4>이미지 적용 / 에셋 라이브러리 v3.1</h4>
      <label>선택 오브젝트 이미지</label>
      <select id="bge-v31-object-asset"></select>
      <div id="bge-v31-preview">오브젝트를 선택하면 적용된 이미지가 표시됩니다.</div>
      <div class="btnrow">
        <button id="bge-v31-apply-asset" type="button">속성 창 이미지 적용</button>
        <button id="bge-v31-clear-asset" class="warn" type="button">이미지 해제</button>
      </div>
      <label>외부 PC/폴더에서 이미지 여러 개 가져오기</label>
      <input id="bge-v31-import-images" type="file" accept="image/*" multiple>
      <label>씬에 배치할 에셋</label>
      <select id="bge-v31-place-asset"></select>
      <div class="btnrow">
        <button id="bge-v31-place-mode" class="warn" type="button">선택 에셋 씬에 배치</button>
      </div>
      <div class="btnrow">
        <button id="bge-v31-export-pack" type="button">에셋팩 내보내기</button>
        <button id="bge-v31-import-pack-btn" type="button">에셋팩 가져오기</button>
      </div>
      <input id="bge-v31-import-pack" type="file" accept="application/json,.json" style="display:none">
      <div style="margin-top:8px; color:#bcd; font-size:11px; line-height:1.45;">권장 작업: 외부 PC에서 만든 PNG/JPG를 여러 개 선택해 가져온 뒤, 에셋팩 JSON으로 백업하세요. 다른 PC에서는 에셋팩 가져오기로 복원하면 됩니다.</div>
    `;
    host.appendChild(box);

    $('bge-v31-apply-asset').addEventListener('click', applyObjectAssetFromInspector);
    $('bge-v31-clear-asset').addEventListener('click', function () { $('bge-v31-object-asset').value = ''; applyObjectAssetFromInspector(); });
    $('bge-v31-object-asset').addEventListener('change', applyObjectAssetFromInspector);
    $('bge-v31-import-images').addEventListener('change', function () { importImageFiles(this.files); this.value = ''; });
    $('bge-v31-place-mode').addEventListener('click', function () {
      v31.placeMode = !v31.placeMode;
      const s = state(); if (s) s.tool = 'select';
      updatePlaceModeButton();
      toast(v31.placeMode ? '맵을 클릭하면 선택 에셋이 배치됩니다.' : '씬 배치 모드 종료');
    });
    $('bge-v31-export-pack').addEventListener('click', exportAssetPack);
    $('bge-v31-import-pack-btn').addEventListener('click', function () { $('bge-v31-import-pack').click(); });
    $('bge-v31-import-pack').addEventListener('change', function () { const file = this.files && this.files[0]; if (file) importAssetPack(file); this.value = ''; });
  }

  function bindCanvas() {
    const c = canvas(); if (!c || c.dataset.v31Bound) return;
    c.dataset.v31Bound = '1';
    c.addEventListener('mousedown', function (e) {
      const s = state(); if (!s || !s.enabled) return;
      const handle = hitHandle(e.clientX, e.clientY);
      if (handle && e.button === 0) {
        e.preventDefault(); e.stopImmediatePropagation();
        startResize(handle, e);
        return;
      }
      if (v31.placeMode && e.button === 0) {
        e.preventDefault(); e.stopImmediatePropagation();
        const p = canvasToMap(e.clientX, e.clientY);
        createObjectFromAsset(p.x, p.y);
      }
    }, true);
    c.addEventListener('mousemove', function (e) {
      const s = state(); if (!s || !s.enabled) return;
      if (v31.resizing) {
        e.preventDefault(); e.stopImmediatePropagation();
        updateResize(e);
        return;
      }
      const handle = hitHandle(e.clientX, e.clientY);
      if (handle) c.style.cursor = cursorForHandle(handle);
    }, true);
    window.addEventListener('mouseup', endResize, true);
  }

  function patchEditorRefresh() {
    const ed = editor();
    if (!ed || ed._v31RefreshPatched) return;
    const oldRefresh = ed.refresh;
    ed.refresh = function () {
      oldRefresh();
      refreshAssetSelectOptions();
    };
    ed._v31RefreshPatched = true;
  }

  function pollSelection() {
    const obj = selectedObject();
    if (pollSelection._last !== obj) {
      pollSelection._last = obj;
      refreshQuickInspector();
    }
    requestAnimationFrame(pollSelection);
  }

  function init() {
    if (!editor() || typeof STAGES === 'undefined' || !canvas()) { setTimeout(init, 150); return; }
    loadAssets();
    buildQuickInspector();
    refreshAssetSelectOptions();
    patchRender();
    patchEditorRefresh();
    bindCanvas();
    pollSelection();
    window.BongdamEditorV31 = {
      refresh: function () { loadAssets(); refreshAssetSelectOptions(); if (editor()) editor().refresh(); },
      exportAssetPack,
      importImageFiles
    };
    toast('v3.1 에셋/리사이즈 패치 로드 완료');
  }

  /* (v268) 구세대 모듈 부트 차단 — v3.1 (v5.2 에디터로 일원화) */
})();
