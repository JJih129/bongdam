
(function(){
'use strict';
if (window.BongdamKidEditorV39Loaded) return;
window.BongdamKidEditorV39Loaded = true;

const ASSET_KEY = 'bongdam_rpg_editor_assets_korean_v1';
const LEGACY_ASSET_KEYS = [
  'bongdam_rpg_editor_assets_korean_v1',
  'bongdam_rpg_editor_assets_v38',
  'bongdam_rpg_editor_assets_v37',
  'bongdam_rpg_editor_assets_v35',
  'bongdam_rpg_editor_assets_v3'
];
const PROJECT_EXPORT_VERSION = 'bongdam_rpg_single_html_project_v39';
const $ = id => document.getElementById(id);
const state = {
  assets: [],
  cache: new Map(),
  renderPatched: false,
  lastSelectedIndex: -999,
  placeMode: false,
  bound: false
};

function editor(){ return window.BongdamEditor || null; }
function editorState(){ return editor() ? editor().state : null; }
function canvas(){ return $('game-canvas') || document.querySelector('canvas'); }
function stage(){ try { return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; } catch(e){ return null; } }
function objects(){ const s = stage(); return s && Array.isArray(s.objects) ? s.objects : []; }
function selectedObject(){ const st = editorState(); const arr = objects(); if (!st) return null; const idx = Number(st.selectedIndex); return Number.isInteger(idx) && idx >= 0 && idx < arr.length ? arr[idx] : null; }
function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function clamp(v,a,b){ v=Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a; }
function clamp01(v){ return clamp(v,0,1); }
function nowName(){ const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; }
function setMessage(msg){ const el=$('bge-kid-status'); if(el) el.textContent = msg; const dbg=$('debugLastMessage'); if(dbg) dbg.textContent = msg; console.log('[봉담 제작도구 v3.9]', msg); }
function toast(msg){ const t=$('bge-toast'); if(t){ t.textContent=msg; t.style.display='block'; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.display='none',1800); } setMessage(msg); }

function generateId(prefix){ return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7); }
function normalizeAsset(raw){
  if (!raw) return null;
  const id = raw.id || raw.assetId || generateId('asset');
  const dataUrl = raw.dataUrl || raw.data || raw.src || '';
  const url = raw.url || raw.path || '';
  if (!dataUrl && !url) return null;
  return {
    id,
    name: raw.name || raw.fileName || raw.filename || id,
    type: 'image',
    sourceType: raw.sourceType || (dataUrl ? 'embedded' : 'path'),
    dataUrl,
    url,
    width: Number(raw.width || 0),
    height: Number(raw.height || 0),
    createdAt: raw.createdAt || Date.now()
  };
}
function loadAssets(){
  const byId = new Map();
  for (const key of LEGACY_ASSET_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.assets) ? parsed.assets : []);
      for (const item of arr) {
        const a = normalizeAsset(item);
        if (a && !byId.has(a.id)) byId.set(a.id, a);
      }
    } catch(e) { console.warn('그림 자료 불러오기 실패:', key, e); }
  }
  state.assets = Array.from(byId.values());
  updateDebugCounts();
}
function saveAssets(){
  try { localStorage.setItem(ASSET_KEY, JSON.stringify(state.assets)); }
  catch(e) {
    alert('브라우저 자동 저장 공간이 부족합니다. 이미지 크기를 줄이거나 “작업 파일 내보내기”로 백업하세요.');
    console.error(e);
  }
  updateDebugCounts();
}
function getAsset(id){ return state.assets.find(a => a.id === id) || null; }
function assetSource(asset){ return asset ? (asset.dataUrl || asset.url || '') : ''; }
function getAssetIdFromObject(obj){
  if (!obj) return '';
  if (obj.kidAssetId) return obj.kidAssetId;
  if (obj.assetId) return obj.assetId;
  const key = String(obj.key || '');
  if (key.startsWith('asset:')) return key.slice(6);
  return '';
}
function getImage(id){
  const asset = getAsset(id);
  const src = assetSource(asset);
  if (!src) return null;
  const cacheKey = id + '|' + src.length;
  if (state.cache.has(cacheKey)) return state.cache.get(cacheKey);
  const img = new Image();
  img.onload = () => { asset.width = img.naturalWidth; asset.height = img.naturalHeight; forceRender(); refreshCurrentPanel(); };
  img.onerror = () => setMessage('이미지 로드 실패: ' + (asset.name || id));
  img.src = src;
  state.cache.set(cacheKey, img);
  return img;
}

function selectedLabel(obj){ return obj ? (obj.label || obj.name || obj.id || '이름 없는 배치물') : '선택 없음'; }
function setObjectAsset(obj, assetId){
  if (!obj) return;
  if (assetId) {
    obj.assetId = assetId;
    obj.kidAssetId = assetId;
    obj.key = 'asset:' + assetId;
    obj.customImage = true;
  } else {
    delete obj.assetId;
    delete obj.kidAssetId;
    delete obj.customImage;
    if (String(obj.key || '').startsWith('asset:')) obj.key = '';
  }
}
function objectVisible(obj){ return !(obj && (obj.visible === false || obj.hidden === true)); }
function rectOf(obj){ return { x:Number(obj.rx || 0), y:Number(obj.ry || 0), w:Number(obj.rw || .1), h:Number(obj.rh || .1) }; }

function ensureEditorDom(){
  let panel = $('bge-panel');
  if (!panel) {
    panel = document.createElement('div'); panel.id = 'bge-panel'; document.body.appendChild(panel);
  }
  let kid = $('bge-kid-panel');
  if (!kid) {
    kid = document.createElement('div');
    kid.id = 'bge-kid-panel';
    kid.innerHTML = `
      <h4>그림 자료함 / 이미지 적용 v3.9</h4>
      <div class="kid-help">이미지를 고른 뒤 아래 선택 목록에 이름이 생기면 정상입니다. 배치물을 선택하고 “선택한 배치물에 이미지 적용”을 누르세요.</div>
      <label>이미지 업로드</label>
      <input id="bge-kid-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple>
      <div id="bge-kid-current" class="kid-current">배치물을 선택하면 현재 이미지 상태가 표시됩니다.</div>
      <div class="kid-row">
        <div><label>적용할 이미지</label><select id="bge-kid-apply-select"><option value="">이미지 선택</option></select></div>
        <div><label>새로 만들 이미지</label><select id="bge-kid-place-select"><option value="">이미지 선택</option></select></div>
      </div>
      <div class="kid-buttons">
        <button id="bge-kid-apply" type="button">선택한 배치물에 이미지 적용</button>
        <button id="bge-kid-place" type="button">이미지를 새 배치물로 만들기</button>
        <button id="bge-kid-clear" type="button" class="danger">이미지 해제</button>
        <button id="bge-kid-delete-asset" type="button" class="danger">선택한 이미지 삭제</button>
        <button id="bge-kid-export-project" type="button">작업 파일 내보내기</button>
        <button id="bge-kid-import-project-btn" type="button">작업 파일 가져오기</button>
        <input id="bge-kid-import-project" type="file" accept="application/json,.json" style="display:none">
        <button id="bge-kid-export-pack" type="button">그림 자료 묶음 내보내기</button>
        <button id="bge-kid-import-pack-btn" type="button">그림 자료 묶음 가져오기</button>
        <input id="bge-kid-import-pack" type="file" accept="application/json,.json" style="display:none">
      </div>
      <div id="bge-kid-status" class="kid-status">준비 완료<br>※ <b>배경 그림에 그려진 건물·소품은 옮길 수 없어요</b> — [🖼 배경 숨김]으로 실제 편집 오브젝트만 확인하세요.</div>`;
    const first = panel.firstChild;
    panel.insertBefore(kid, first);
  } else if (kid.parentElement !== panel) {
    panel.insertBefore(kid, panel.firstChild);
  }
  koreanizeStaticLabels();
}
function koreanizeStaticLabels(){
  const toggle = $('bge-toggle');
  if (toggle) toggle.textContent = toggle.classList.contains('bge-on') ? '🛠 제작 모드 ON' : '🛠 제작 모드 OFF';
  const h = $('bge-hierarchy');
  if (h) {
    const title = h.querySelector('h3'); if (title) title.textContent = '배치 목록';
    const help = h.querySelector('.bge-help'); if (help) help.textContent = '현재 맵에 놓인 배치물과 충돌 영역을 관리합니다. 눈은 숨기기, 자물쇠는 실수 방지용 잠금입니다.';
  }
  const p = $('bge-panel');
  if (p) { const title = p.querySelector('h3'); if (title) title.textContent = '속성 창'; }
  const labels = [
    ['bge-stage-select','현재 맵'], ['bge-stage-name','맵 이름'], ['bge-spawn-x','시작 위치 X'], ['bge-spawn-y','시작 위치 Y'],
    ['bge-object-list','배치물 목록']
  ];
  labels.forEach(([id,txt])=>{ const el=$(id); const lab=el && el.previousElementSibling && el.previousElementSibling.tagName==='LABEL' ? el.previousElementSibling : null; if(lab) lab.textContent=txt; });
  const map = { 'bge-pick-spawn':'시작 위치 찍기', 'bge-save':'저장', 'bge-tool-select':'선택', 'bge-tool-pan':'화면 이동', 'bge-tool-place':'배치', 'bge-overview':'전체보기' };
  Object.entries(map).forEach(([id,txt])=>{ const el=$(id); if(el) el.textContent=txt; });
}

function refreshAssetDropdowns(){
  const selects = [$('bge-kid-apply-select'), $('bge-kid-place-select')].filter(Boolean);
  selects.forEach(sel => {
    const prev = sel.value;
    sel.innerHTML = '<option value="">이미지 선택</option>';
    state.assets.forEach(a => {
      const option = document.createElement('option');
      option.value = a.id;
      const size = a.width && a.height ? ` (${a.width}x${a.height})` : '';
      option.textContent = (a.name || a.id) + size;
      sel.appendChild(option);
    });
    if (prev && getAsset(prev)) sel.value = prev;
  });
  const count = $('debugAssetCount'); if (count) count.textContent = String(state.assets.length);
  refreshCurrentPanel();
}
function refreshCurrentPanel(){
  const cur = $('bge-kid-current'); if (!cur) return;
  const obj = selectedObject();
  if (!obj) {
    cur.innerHTML = '배치물을 선택하면 현재 이미지 상태가 표시됩니다.';
    const sel = $('bge-kid-apply-select'); if (sel) sel.value = '';
    return;
  }
  const id = getAssetIdFromObject(obj);
  const asset = getAsset(id);
  const sel = $('bge-kid-apply-select'); if (sel) sel.value = id || '';
  if (asset) {
    cur.innerHTML = `<img src="${esc(assetSource(asset))}" alt=""><div><b>선택 배치물:</b> ${esc(selectedLabel(obj))}<br><b>현재 이미지:</b> ${esc(asset.name || asset.id)}<br><b>저장 키:</b> ${esc(obj.key || '')}<br>※ <b>배경 그림에 그려진 건물·소품은 옮길 수 없어요</b> — [🖼 배경 숨김]으로 실제 편집 오브젝트만 확인하세요.</div>`;
  } else {
    cur.innerHTML = `<div><b>선택 배치물:</b> ${esc(selectedLabel(obj))}<br><b>현재 이미지:</b> ${esc(obj.key || '기본 이미지 또는 없음')}<br>업로드한 이미지를 선택해 적용할 수 있습니다.</div>`;
  }
}
function updateDebugCounts(){
  const assetCount = $('debugAssetCount'); if(assetCount) assetCount.textContent = String(state.assets.length);
  const sel = $('debugSelectedObject'); if(sel) sel.textContent = selectedObject() ? selectedLabel(selectedObject()) : '선택 없음';
}

function importImageFiles(fileList){
  const files = Array.from(fileList || []).filter(file => file && file.type && file.type.startsWith('image/'));
  if (!files.length) { alert('PNG, JPG, WEBP 같은 이미지 파일을 선택하세요.'); return; }
  let completed = 0;
  let added = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const asset = {
          id: generateId('asset'),
          name: file.name,
          type: 'image',
          sourceType: 'embedded',
          dataUrl,
          width: img.naturalWidth || 0,
          height: img.naturalHeight || 0,
          createdAt: Date.now()
        };
        state.assets.push(asset);
        state.cache.set(asset.id + '|' + dataUrl.length, img);
        added++; completed++;
        if (completed === files.length) finishImageImport(added);
      };
      img.onerror = () => { completed++; if (completed === files.length) finishImageImport(added); };
      img.src = dataUrl;
    };
    reader.onerror = () => { completed++; if (completed === files.length) finishImageImport(added); };
    reader.readAsDataURL(file);
  });
}
function finishImageImport(count){
  saveAssets();
  refreshAssetDropdowns();
  forceRender();
  toast(`이미지 ${count}개 등록 완료`);
}
function applyAssetToSelected(){
  const obj = selectedObject();
  if (!obj) { alert('먼저 맵이나 배치 목록에서 배치물을 선택하세요.'); return; }
  if (obj.locked) { alert('잠긴 배치물은 수정할 수 없습니다. 자물쇠를 풀어주세요.'); return; }
  const id = $('bge-kid-apply-select') ? $('bge-kid-apply-select').value : '';
  if (!id || !getAsset(id)) { alert('적용할 이미지를 선택하세요.'); return; }
  setObjectAsset(obj, id);
  const keyInput = $('bge-obj-key'); if (keyInput) keyInput.value = obj.key;
  saveEditor(false);
  refreshCurrentPanel();
  forceRender();
  toast('선택한 배치물에 이미지 적용 완료');
}
function clearAssetFromSelected(){
  const obj = selectedObject();
  if (!obj) { alert('먼저 배치물을 선택하세요.'); return; }
  if (obj.locked) { alert('잠긴 배치물은 수정할 수 없습니다.'); return; }
  setObjectAsset(obj, '');
  const keyInput = $('bge-obj-key'); if (keyInput) keyInput.value = obj.key || '';
  saveEditor(false);
  refreshCurrentPanel();
  forceRender();
  toast('이미지 연결 해제 완료');
}
function deleteSelectedAsset(){
  const select = $('bge-kid-apply-select');
  const id = select ? select.value : '';
  const asset = getAsset(id);
  if (!asset) { alert('삭제할 이미지를 선택하세요.'); return; }
  if (!confirm(`선택한 이미지를 그림 자료함에서 삭제할까요?\n${asset.name}`)) return;
  state.assets = state.assets.filter(a => a.id !== id);
  objects().forEach(obj => { if (getAssetIdFromObject(obj) === id) setObjectAsset(obj, ''); });
  state.cache.clear();
  saveAssets(); saveEditor(false); refreshAssetDropdowns(); forceRender();
  toast('선택한 이미지 삭제 완료');
}
function createObjectFromSelectedAsset(mx, my){
  const select = $('bge-kid-place-select');
  const id = select ? select.value : '';
  const asset = getAsset(id);
  const st = stage();
  if (!st) { alert('현재 맵을 찾을 수 없습니다.'); return; }
  if (!asset) { alert('새 배치물로 만들 이미지를 선택하세요.'); return; }
  if (!Array.isArray(st.objects)) st.objects = [];
  const w = .12, h = .12;
  const obj = {
    _editorId: generateId('obj'),
    id: generateId('obj'),
    label: asset.name.replace(/\.[^.]+$/, ''),
    type: 'decoration',
    key: 'asset:' + id,
    assetId: id,
    kidAssetId: id,
    customImage: true,
    visible: true,
    locked: false,
    rx: clamp01((mx ?? .5) - w/2),
    ry: clamp01((my ?? .5) - h/2),
    rw: w,
    rh: h,
    cx: clamp01((mx ?? .5) - w/2),
    cy: clamp01((my ?? .5) + h*.35),
    cw: w,
    ch: h*.25,
    colliders: [],
    interactable: '',
    note: '',
    dialogue: { speaker:'', text:'', portraitAssetId:'', style:'visual_novel_bottom' },
    quest: { id:'', title:'', memo:'' }
  };
  st.objects.push(obj);
  const es = editorState(); if (es) { es.selectedIndex = st.objects.length - 1; es.selectedPart = 'object'; es.tool = 'select'; }
  saveEditor(false); refreshAssetDropdowns(); forceRender();
  toast('이미지를 새 배치물로 만들었습니다.');
}

function viewportW(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=editorState(); return fixed ? fixed.w : (s && s.enabled && s.editorZoom ? 1/s.editorZoom : (typeof VIEWPORT_W !== 'undefined' ? VIEWPORT_W : 1)); }
function viewportH(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=editorState(); return fixed ? fixed.h : (s && s.enabled && s.editorZoom ? 1/s.editorZoom : (typeof VIEWPORT_H !== 'undefined' ? VIEWPORT_H : 1)); }
function mapToCanvas(mx,my){
  const c=canvas(); if(!c) return {x:0,y:0};
  const bw=(typeof BASE_W !== 'undefined' ? BASE_W : 1920), bh=(typeof BASE_H !== 'undefined' ? BASE_H : 1080);
  const sc=(typeof currentScale !== 'undefined' ? currentScale : 1);
  const cx=(typeof camX !== 'undefined' ? camX : .5), cy=(typeof camY !== 'undefined' ? camY : .5);
  const bx=((mx-cx)/viewportW()+.5)*bw, by=((my-cy)/viewportH()+.5)*bh;
  return { x:(bx-bw/2)*sc+c.width/2, y:(by-bh/2)*sc+c.height/2 };
}
function canvasToMap(clientX,clientY){
  const c=canvas(); if(!c) return {x:.5,y:.5};
  const r=c.getBoundingClientRect();
  const sx=(clientX-r.left)*(c.width/r.width), sy=(clientY-r.top)*(c.height/r.height);
  const bw=(typeof BASE_W !== 'undefined' ? BASE_W : 1920), bh=(typeof BASE_H !== 'undefined' ? BASE_H : 1080);
  const sc=(typeof currentScale !== 'undefined' ? currentScale : 1);
  const bx=(sx-c.width/2)/sc+bw/2, by=(sy-c.height/2)/sc+bh/2;
  const cx=(typeof camX !== 'undefined' ? camX : .5), cy=(typeof camY !== 'undefined' ? camY : .5);
  return { x:clamp01((bx/bw-.5)*viewportW()+cx), y:clamp01((by/bh-.5)*viewportH()+cy) };
}
function drawAssetOverlay(ctx){
  if (!ctx) return;
  objects().forEach(obj => {
    if (!objectVisible(obj)) return;
    const id = getAssetIdFromObject(obj);
    if (!id) return;
    const img = getImage(id);
    if (!img || !img.complete || img.naturalWidth <= 0) return;
    const r = rectOf(obj);
    const p1 = mapToCanvas(r.x, r.y), p2 = mapToCanvas(r.x + r.w, r.y + r.h);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, p1.x, p1.y, p2.x-p1.x, p2.y-p1.y);
    ctx.restore();
  });
}
function patchRender(){
  if (state.renderPatched) return;
  if (typeof renderMap === 'function') {
    const previous = renderMap;
    renderMap = function(targetCanvas){
      previous.apply(this, arguments);
      /* (v261) 이중 렌더 제거 */
    };
    state.renderPatched = true;
  }
}
function forceRender(){ try { if (typeof gameLoop === 'function') gameLoop(); } catch(e){} }
function saveEditor(show){
  try { if (editor()) { editor().save(false); editor().refresh(); } }
  catch(e){ console.warn('제작 도구 저장 실패:', e); }
  if (show) toast('작업 저장 완료');
}

function exportProject(){
  const payload = {
    version: PROJECT_EXPORT_VERSION,
    savedAt: new Date().toISOString(),
    stages: (typeof STAGES !== 'undefined') ? STAGES : {},
    assets: state.assets,
    currentStage: (typeof currentStage !== 'undefined') ? currentStage : 1
  };
  downloadJson(payload, 'bongdam_rpg_project_' + nowName() + '.json');
  toast('작업 파일 내보내기 완료');
}
function importProject(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '{}'));
      if (!data.stages) throw new Error('stages 데이터가 없습니다.');
      if (typeof STAGES === 'undefined') throw new Error('기존 게임의 맵 데이터(STAGES)를 찾을 수 없습니다.');
      Object.keys(STAGES).forEach(k => delete STAGES[k]);
      Object.keys(data.stages).forEach(k => STAGES[k] = data.stages[k]);
      const importedAssets = Array.isArray(data.assets) ? data.assets.map(normalizeAsset).filter(Boolean) : [];
      const byId = new Map(state.assets.map(a => [a.id, a]));
      importedAssets.forEach(a => byId.set(a.id, a));
      state.assets = Array.from(byId.values());
      state.cache.clear();
      saveAssets();
      if (typeof currentStage !== 'undefined' && data.currentStage && STAGES[data.currentStage]) currentStage = data.currentStage;
      saveEditor(false); refreshAssetDropdowns(); forceRender();
      alert('작업 파일 가져오기 완료');
      toast('작업 파일 가져오기 완료');
    } catch(e) { alert('작업 파일 가져오기 실패: ' + e.message); console.error(e); }
  };
  reader.readAsText(file, 'utf-8');
}
function exportAssetPack(){ downloadJson({version:'bongdam_asset_pack_korean_v1', savedAt:new Date().toISOString(), assets:state.assets}, 'bongdam_image_pack_' + nowName() + '.json'); }
function importAssetPack(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || '{}'));
      const arr = Array.isArray(data) ? data : (Array.isArray(data.assets) ? data.assets : []);
      if (!arr.length) throw new Error('그림 자료가 없습니다.');
      const ids = new Set(state.assets.map(a => a.id));
      let added = 0;
      arr.forEach(raw => {
        const asset = normalizeAsset(raw);
        if (!asset) return;
        if (ids.has(asset.id)) asset.id = generateId('asset');
        ids.add(asset.id); state.assets.push(asset); added++;
      });
      saveAssets(); refreshAssetDropdowns(); forceRender(); toast(`그림 자료 ${added}개 가져오기 완료`);
    } catch(e) { alert('그림 자료 묶음 가져오기 실패: ' + e.message); }
  };
  reader.readAsText(file, 'utf-8');
}
function downloadJson(data, filename){
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function bindEvents(){
  ensureEditorDom();
  const upload = $('bge-kid-upload');
  if (upload && !upload._kidBound) { upload._kidBound = true; upload.addEventListener('change', function(){ importImageFiles(this.files); this.value=''; }); }
  const applySel = $('bge-kid-apply-select');
  if (applySel && !applySel._kidBound) { applySel._kidBound = true; applySel.addEventListener('change', function(){ refreshCurrentPanel(); if (selectedObject() && this.value) applyAssetToSelected(); }); }
  const apply = $('bge-kid-apply'); if (apply && !apply._kidBound) { apply._kidBound=true; apply.addEventListener('click', applyAssetToSelected); }
  const clear = $('bge-kid-clear'); if (clear && !clear._kidBound) { clear._kidBound=true; clear.addEventListener('click', clearAssetFromSelected); }
  const del = $('bge-kid-delete-asset'); if (del && !del._kidBound) { del._kidBound=true; del.addEventListener('click', deleteSelectedAsset); }
  const place = $('bge-kid-place'); if (place && !place._kidBound) { place._kidBound=true; place.addEventListener('click', () => { state.placeMode = !state.placeMode; place.textContent = state.placeMode ? '배치 모드 끄기' : '이미지를 새 배치물로 만들기'; toast(state.placeMode ? '장면 화면을 클릭하면 이미지가 새 배치물로 만들어집니다.' : '배치 모드 종료'); }); }
  const exp = $('bge-kid-export-project'); if (exp && !exp._kidBound) { exp._kidBound=true; exp.addEventListener('click', exportProject); }
  const impBtn = $('bge-kid-import-project-btn'), imp = $('bge-kid-import-project');
  if (impBtn && imp && !impBtn._kidBound) { impBtn._kidBound=true; impBtn.addEventListener('click', () => imp.click()); }
  if (imp && !imp._kidBound) { imp._kidBound=true; imp.addEventListener('change', function(){ const f=this.files&&this.files[0]; if(f) importProject(f); this.value=''; }); }
  const expPack = $('bge-kid-export-pack'); if (expPack && !expPack._kidBound) { expPack._kidBound=true; expPack.addEventListener('click', exportAssetPack); }
  const impPackBtn = $('bge-kid-import-pack-btn'), impPack = $('bge-kid-import-pack');
  if (impPackBtn && impPack && !impPackBtn._kidBound) { impPackBtn._kidBound=true; impPackBtn.addEventListener('click', () => impPack.click()); }
  if (impPack && !impPack._kidBound) { impPack._kidBound=true; impPack.addEventListener('change', function(){ const f=this.files&&this.files[0]; if(f) importAssetPack(f); this.value=''; }); }
  const c = canvas();
  if (c && !c._kidPlaceBound) {
    c._kidPlaceBound = true;
    c.addEventListener('mousedown', e => {
      const es = editorState();
      if (!es || !es.enabled || !state.placeMode || e.button !== 0) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const p = canvasToMap(e.clientX, e.clientY);
      createObjectFromSelectedAsset(p.x, p.y);
      state.placeMode = false;
      const pb=$('bge-kid-place'); if(pb) pb.textContent='이미지를 새 배치물로 만들기';
    }, true);
  }
}
function patchEditorRefresh(){
  const ed = editor();
  if (!ed || ed._kidV39Patched) return;
  const oldRefresh = ed.refresh;
  ed.refresh = function(){
    const result = oldRefresh.apply(this, arguments);
    setTimeout(() => { ensureEditorDom(); bindEvents(); refreshAssetDropdowns(); koreanizeStaticLabels(); updateDebugCounts(); }, 0);
    return result;
  };
  ed._kidV39Patched = true;
}
function loop(){
  const es = editorState();
  const panel = $('bge-kid-panel');
  if (panel && es) panel.style.display = es.enabled ? 'block' : 'none';
  const idx = es ? es.selectedIndex : -1;
  if (idx !== state.lastSelectedIndex) { state.lastSelectedIndex = idx; refreshCurrentPanel(); updateDebugCounts(); }
  if (!$('bge-kid-panel')) { ensureEditorDom(); bindEvents(); refreshAssetDropdowns(); }
  /* (v368) 편집기 OFF 상태에선 250ms 폴링 (게시 모드 매 프레임 낭비 제거) */
  if (es && es.enabled) requestAnimationFrame(loop); else setTimeout(loop, 250);
}
function init(){
  if (!editor() || !canvas() || typeof STAGES === 'undefined') { setTimeout(init, 100); return; }
  ensureEditorDom();
  loadAssets();
  bindEvents();
  refreshAssetDropdowns();
  patchRender();
  patchEditorRefresh();
  forceRender();
  window.BongdamKidEditorV39 = {
    get assets(){ return state.assets; },
    refresh(){ loadAssets(); refreshAssetDropdowns(); forceRender(); },
    exportProject,
    importImageFiles
  };
  toast('v3.9 한국어 제작 도구 패치 로드 완료');
  loop();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
