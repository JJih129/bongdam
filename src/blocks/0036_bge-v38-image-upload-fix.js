
(function(){
'use strict';
if (window.BongdamEditorV38ImageFix) return;
window.BongdamEditorV38ImageFix = true;

const ASSET_KEY = 'bongdam_rpg_editor_assets_v38';
const LEGACY_KEYS = [
  'bongdam_rpg_editor_assets_v37',
  'bongdam_rpg_editor_assets_v3',
  'bongdam_rpg_editor_assets_v35'
];
const $ = (id) => document.getElementById(id);
const state = {
  assets: [],
  cache: new Map(),
  renderPatched: false,
  placeMode: false,
  lastSelectedIndex: -999
};

function toast(message) {
  const el = $('bge-toast');
  if (!el) { console.log('[BGE v3.8]', message); return; }
  el.textContent = message;
  el.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.style.display = 'none'; }, 1800);
}
function editor() { return window.BongdamEditor || null; }
function editorState() { return editor() ? editor().state : null; }
function canvas() { return $('game-canvas'); }
function currentStageData() {
  try { return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; }
  catch (_) { return null; }
}
function currentObjects() {
  const st = currentStageData();
  return st && Array.isArray(st.objects) ? st.objects : [];
}
function selectedObject() {
  const st = editorState();
  const list = currentObjects();
  if (!st || !Number.isInteger(st.selectedIndex)) return null;
  return st.selectedIndex >= 0 && st.selectedIndex < list.length ? list[st.selectedIndex] : null;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function clamp(value, min, max) {
  value = Number(value);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
}
function clamp01(value) { return clamp(value, 0, 1); }

function normalizeAsset(raw) {
  if (!raw) return null;
  const dataUrl = raw.dataUrl || raw.data || '';
  const url = raw.url || raw.path || '';
  if (!dataUrl && !url) return null;
  return {
    id: raw.id || ('asset_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
    name: raw.name || raw.fileName || raw.id || '이미지',
    dataUrl,
    url
  };
}
function loadAssets() {
  state.assets = [];
  const keys = [ASSET_KEY, ...LEGACY_KEYS];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.assets) ? parsed.assets : []);
      const normalized = arr.map(normalizeAsset).filter(Boolean);
      if (normalized.length) { state.assets = normalized; break; }
    } catch (e) { console.warn('에셋 로드 실패:', key, e); }
  }
}
function saveAssets() {
  try {
    localStorage.setItem(ASSET_KEY, JSON.stringify(state.assets));
    // 이전 패치와도 호환되도록 v37 키에도 같이 저장
    localStorage.setItem('bongdam_rpg_editor_assets_v37', JSON.stringify(state.assets));
  } catch (e) {
    alert('이미지 저장 실패: 이미지 용량이 너무 큽니다. 512~1024px 이하 PNG/JPG로 줄여서 다시 넣어주세요.');
  }
}
function getAsset(id) { return state.assets.find(a => a.id === id) || null; }
function assetSource(asset) { return asset ? (asset.dataUrl || asset.url || '') : ''; }
function getObjectAssetId(obj) {
  if (!obj) return '';
  if (obj.assetId) return obj.assetId;
  const key = String(obj.key || '');
  if (key.startsWith('asset:')) return key.slice(6);
  return '';
}
function setObjectAsset(obj, id) {
  if (!obj) return;
  if (id) {
    obj.assetId = id;
    obj.key = 'asset:' + id;
    obj.customImage = true;
  } else {
    delete obj.assetId;
    delete obj.customImage;
    if (String(obj.key || '').startsWith('asset:')) obj.key = '';
  }
}

function refreshDropdowns() {
  const ids = ['bge-v37-asset', 'bge-v37-place-asset'];
  for (const id of ids) {
    const select = $(id);
    if (!select) continue;
    const prev = select.value;
    select.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = state.assets.length ? '이미지 선택' : '등록된 이미지 없음';
    select.appendChild(empty);
    for (const asset of state.assets) {
      const option = document.createElement('option');
      option.value = asset.id;
      option.textContent = asset.name || asset.id;
      select.appendChild(option);
    }
    if (prev && getAsset(prev)) select.value = prev;
  }
  refreshCurrentPanel();
}
function refreshCurrentPanel() {
  const current = $('bge-v37-current');
  const select = $('bge-v37-asset');
  if (!current) return;
  const obj = selectedObject();
  if (!obj) {
    current.textContent = state.assets.length
      ? '오브젝트를 선택한 뒤 아래 드롭다운에서 이미지를 고르세요.'
      : '이미지를 업로드하면 아래 드롭다운에 표시됩니다.';
    if (select) select.value = '';
    return;
  }
  const id = getObjectAssetId(obj);
  const asset = getAsset(id);
  if (select && id && asset) select.value = id;
  if (asset) {
    current.innerHTML = '<img src="' + escapeHtml(assetSource(asset)) + '"><div><b>' + escapeHtml(asset.name) + '</b><br>현재 선택 오브젝트에 적용됨<br>Key: ' + escapeHtml(obj.key || '') + '</div>';
  } else {
    current.innerHTML = '<div><b>선택 오브젝트:</b> ' + escapeHtml(obj.label || obj.name || '이름 없음') + '<br><b>현재 Key:</b> ' + escapeHtml(obj.key || '없음') + '<br>드롭다운에서 이미지를 고르면 즉시 적용됩니다.</div>';
  }
}

function importImageFiles(files) {
  const list = Array.from(files || []).filter(file => file && file.type && file.type.startsWith('image/'));
  if (!list.length) { alert('PNG/JPG 같은 이미지 파일을 선택하세요.'); return; }
  let done = 0;
  let failed = 0;
  for (const file of list) {
    const reader = new FileReader();
    reader.onload = () => {
      state.assets.push({
        id: 'asset_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
        name: file.name.replace(/\.[^.]+$/, ''),
        dataUrl: String(reader.result || ''),
        url: ''
      });
      finish();
    };
    reader.onerror = () => { failed++; finish(); };
    reader.readAsDataURL(file);
  }
  function finish() {
    done++;
    if (done !== list.length) return;
    saveAssets();
    refreshDropdowns();
    forceRender();
    toast((list.length - failed) + '개 이미지 등록 완료');
  }
}

function saveEditorData() {
  try {
    if (editor()) { editor().save(false); editor().refresh(); }
  } catch (e) { console.warn('에디터 저장 실패:', e); }
}
function forceRender() {
  try {
    if (editor()) editor().refresh();
    if (typeof gameLoop === 'function') gameLoop();
  } catch (_) {}
}
function applySelectedImage(id) {
  const obj = selectedObject();
  if (!obj) { alert('먼저 맵 또는 배치 목록에서 오브젝트를 선택하세요.'); return; }
  if (!id || !getAsset(id)) { alert('적용할 이미지를 선택하세요.'); return; }
  setObjectAsset(obj, id);
  const keyInput = $('bge-obj-key');
  if (keyInput) keyInput.value = 'asset:' + id;
  saveEditorData();
  refreshCurrentPanel();
  forceRender();
  toast('선택 오브젝트에 이미지 적용 완료');
}
function clearSelectedImage() {
  const obj = selectedObject();
  if (!obj) { alert('먼저 오브젝트를 선택하세요.'); return; }
  setObjectAsset(obj, '');
  const keyInput = $('bge-obj-key');
  if (keyInput) keyInput.value = obj.key || '';
  saveEditorData();
  refreshCurrentPanel();
  forceRender();
  toast('이미지 적용 해제 완료');
}
function deleteSelectedAsset() {
  const select = $('bge-v37-asset');
  const id = select ? select.value : '';
  const asset = getAsset(id);
  if (!asset) return;
  if (!confirm('선택한 이미지 에셋을 삭제할까요?\n' + asset.name)) return;
  state.assets = state.assets.filter(a => a.id !== id);
  state.cache.clear();
  saveAssets();
  refreshDropdowns();
  forceRender();
}
function exportAssetPack() {
  const blob = new Blob([JSON.stringify({ version: 'bongdam_asset_pack_v38', savedAt: new Date().toISOString(), assets: state.assets }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bongdam_asset_pack_v38.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function importAssetPack(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      const arr = Array.isArray(parsed.assets) ? parsed.assets : (Array.isArray(parsed) ? parsed : []);
      if (!arr.length) throw new Error('assets 배열이 없습니다.');
      const ids = new Set(state.assets.map(a => a.id));
      for (const raw of arr) {
        const asset = normalizeAsset(raw);
        if (!asset) continue;
        if (ids.has(asset.id)) asset.id += '_' + Math.random().toString(36).slice(2, 5);
        ids.add(asset.id);
        state.assets.push(asset);
      }
      saveAssets();
      refreshDropdowns();
      forceRender();
      toast('에셋팩 가져오기 완료');
    } catch (e) { alert('에셋팩 가져오기 실패: ' + e.message); }
  };
  reader.readAsText(file, 'utf-8');
}

function viewportW() {
  const fixed = window.BD_getEditorViewportV26 && window.BD_getEditorViewportV26();
  const st = editorState();
  return fixed ? fixed.w : (st && st.enabled && st.editorZoom ? 1 / st.editorZoom : (typeof VIEWPORT_W !== 'undefined' ? VIEWPORT_W : 1));
}
function viewportH() {
  const fixed = window.BD_getEditorViewportV26 && window.BD_getEditorViewportV26();
  const st = editorState();
  return fixed ? fixed.h : (st && st.enabled && st.editorZoom ? 1 / st.editorZoom : (typeof VIEWPORT_H !== 'undefined' ? VIEWPORT_H : 1));
}
function mapToCanvas(mx, my) {
  const c = canvas();
  if (!c) return { x: 0, y: 0 };
  const bw = (typeof BASE_W !== 'undefined' ? BASE_W : 1920);
  const bh = (typeof BASE_H !== 'undefined' ? BASE_H : 1080);
  const scale = (typeof currentScale !== 'undefined' ? currentScale : 1);
  const cx = (typeof camX !== 'undefined' ? camX : 0.5);
  const cy = (typeof camY !== 'undefined' ? camY : 0.5);
  const baseX = ((mx - cx) / viewportW() + 0.5) * bw;
  const baseY = ((my - cy) / viewportH() + 0.5) * bh;
  return { x: (baseX - bw / 2) * scale + c.width / 2, y: (baseY - bh / 2) * scale + c.height / 2 };
}
function canvasToMap(clientX, clientY) {
  const c = canvas();
  if (!c) return { x: 0.5, y: 0.5 };
  const rect = c.getBoundingClientRect();
  const sx = (clientX - rect.left) * (c.width / rect.width);
  const sy = (clientY - rect.top) * (c.height / rect.height);
  const bw = (typeof BASE_W !== 'undefined' ? BASE_W : 1920);
  const bh = (typeof BASE_H !== 'undefined' ? BASE_H : 1080);
  const scale = (typeof currentScale !== 'undefined' ? currentScale : 1);
  const baseX = (sx - c.width / 2) / scale + bw / 2;
  const baseY = (sy - c.height / 2) / scale + bh / 2;
  const cx = (typeof camX !== 'undefined' ? camX : 0.5);
  const cy = (typeof camY !== 'undefined' ? camY : 0.5);
  return { x: clamp01((baseX / bw - 0.5) * viewportW() + cx), y: clamp01((baseY / bh - 0.5) * viewportH() + cy) };
}
function objectRect(obj) {
  return { x: Number(obj.rx || 0), y: Number(obj.ry || 0), w: Number(obj.rw || 0.08), h: Number(obj.rh || 0.08) };
}
function getImage(id) {
  const asset = getAsset(id);
  const src = assetSource(asset);
  if (!src) return null;
  const key = id + '|' + src;
  if (state.cache.has(key)) return state.cache.get(key);
  const img = new Image();
  img.onload = forceRender;
  img.onerror = () => console.warn('이미지 로드 실패:', src);
  img.src = src;
  state.cache.set(key, img);
  return img;
}
function drawAssetOverlay(ctx) {
  if (!ctx) return;
  for (const obj of currentObjects()) {
    if (!obj || obj.hidden) continue;
    const id = getObjectAssetId(obj);
    if (!id) continue;
    const img = getImage(id);
    if (!img || !img.complete || img.naturalWidth <= 0) continue;
    const r = objectRect(obj);
    const p1 = mapToCanvas(r.x, r.y);
    const p2 = mapToCanvas(r.x + r.w, r.y + r.h);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    ctx.restore();
  }
}
function patchRender() {
  if (state.renderPatched || typeof renderMap !== 'function') return;
  const prev = renderMap;
  renderMap = function patchedRenderMapV38(c) {
    prev(c);
    /* (v254) 이중 렌더 제거 — 배치 이미지는 본체 renderMap이 전담 (박스 크기 일치 렌더) */
  };
  state.renderPatched = true;
}
function createSpriteAt(mx, my) {
  const select = $('bge-v37-place-asset');
  const id = select ? select.value : '';
  const asset = getAsset(id);
  const st = currentStageData();
  if (!st || !asset) { alert('새로 배치할 이미지를 먼저 선택하세요.'); return; }
  if (!Array.isArray(st.objects)) st.objects = [];
  const obj = {
    _editorId: 'asset_obj_' + Date.now().toString(36),
    type: 'prop',
    label: asset.name || '스프라이트',
    key: 'asset:' + id,
    assetId: id,
    customImage: true,
    rx: clamp01(mx - 0.05),
    ry: clamp01(my - 0.05),
    rw: 0.10,
    rh: 0.10,
    cx: clamp01(mx - 0.04),
    cy: clamp01(my + 0.02),
    cw: 0.08,
    ch: 0.035,
    interactable: '',
    note: ''
  };
  st.objects.push(obj);
  const stt = editorState();
  if (stt) { stt.selectedIndex = st.objects.length - 1; stt.selectedPart = 'object'; stt.tool = 'select'; }
  state.placeMode = false;
  updatePlaceButton();
  saveEditorData();
  refreshCurrentPanel();
  toast('이미지를 씬에 배치했습니다.');
}
function updatePlaceButton() {
  const button = $('bge-v37-place');
  if (!button) return;
  button.textContent = state.placeMode ? '배치 모드 끄기' : '이미지 씬에 배치';
  button.style.outline = state.placeMode ? '2px solid #74d9ff' : '';
}

function bindPanel() {
  const fileInput = $('bge-v37-files');
  if (fileInput && !fileInput._v38Bound) {
    fileInput._v38Bound = true;
    fileInput.addEventListener('change', function () {
      importImageFiles(this.files);
      this.value = '';
    });
  }
  const select = $('bge-v37-asset');
  if (select && !select._v38Bound) {
    select._v38Bound = true;
    select.addEventListener('change', function () {
      refreshCurrentPanel();
      if (this.value && selectedObject()) applySelectedImage(this.value);
    });
  }
  const applyButton = $('bge-v37-apply');
  if (applyButton && !applyButton._v38Bound) {
    applyButton._v38Bound = true;
    applyButton.addEventListener('click', () => applySelectedImage(($('bge-v37-asset') || {}).value || ''));
  }
  const clearButton = $('bge-v37-clear');
  if (clearButton && !clearButton._v38Bound) {
    clearButton._v38Bound = true;
    clearButton.addEventListener('click', clearSelectedImage);
  }
  const deleteButton = $('bge-v37-delete');
  if (deleteButton && !deleteButton._v38Bound) {
    deleteButton._v38Bound = true;
    deleteButton.addEventListener('click', deleteSelectedAsset);
  }
  const exportButton = $('bge-v37-export');
  if (exportButton && !exportButton._v38Bound) {
    exportButton._v38Bound = true;
    exportButton.addEventListener('click', exportAssetPack);
  }
  const importButton = $('bge-v37-import-btn');
  const importInput = $('bge-v37-import');
  if (importButton && importInput && !importButton._v38Bound) {
    importButton._v38Bound = true;
    importButton.addEventListener('click', () => importInput.click());
  }
  if (importInput && !importInput._v38Bound) {
    importInput._v38Bound = true;
    importInput.addEventListener('change', function () {
      const file = this.files && this.files[0];
      if (file) importAssetPack(file);
      this.value = '';
    });
  }
  const placeButton = $('bge-v37-place');
  if (placeButton && !placeButton._v38Bound) {
    placeButton._v38Bound = true;
    placeButton.addEventListener('click', () => {
      state.placeMode = !state.placeMode;
      updatePlaceButton();
      toast(state.placeMode ? '맵을 클릭하면 이미지가 배치됩니다.' : '이미지 배치 모드 종료');
    });
  }
}
function bindCanvas() {
  const c = canvas();
  if (!c || c._v38AssetPlaceBound) return;
  c._v38AssetPlaceBound = true;
  c.addEventListener('mousedown', (e) => {
    const st = editorState();
    if (!st || !st.enabled || !state.placeMode || e.button !== 0) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const p = canvasToMap(e.clientX, e.clientY);
    createSpriteAt(p.x, p.y);
  }, true);
}
function ensurePanelTitle() {
  const title = document.querySelector('#bge-v37-asset-panel h4');
  if (title) title.textContent = '이미지 / 스프라이트 적용 v3.8';
}
function loop() {
  const st = editorState();
  const panel = $('bge-v37-asset-panel');
  if (panel && st) panel.style.display = st.enabled ? 'block' : 'none';
  const idx = st ? st.selectedIndex : -1;
  if (idx !== state.lastSelectedIndex) {
    state.lastSelectedIndex = idx;
    refreshCurrentPanel();
  }
  /* (v368) 편집기 OFF 상태에선 250ms 폴링 (게시 모드 매 프레임 낭비 제거) */
  if (st && st.enabled) requestAnimationFrame(loop); else setTimeout(loop, 250);
}
function init() {
  if (!editor() || !canvas() || typeof STAGES === 'undefined') return setTimeout(init, 100);
  ensurePanelTitle();
  loadAssets();
  bindPanel();
  bindCanvas();
  refreshDropdowns();
  patchRender();
  updatePlaceButton();
  loop();
  window.BongdamEditorV38Assets = {
    get assets() { return state.assets; },
    refresh() { loadAssets(); refreshDropdowns(); forceRender(); }
  };
  toast('v3.8 이미지 업로드 패치 로드 완료');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
