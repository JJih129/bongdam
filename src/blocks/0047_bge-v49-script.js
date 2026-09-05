
(function(){
'use strict';

if (window.BongdamEditorV49Loaded) return;
window.BongdamEditorV49Loaded = true;

const $ = id => document.getElementById(id);
const S = { filter:'all', kind:'', id:'', index:-1, drag:null, renderPatched:false, canvasBound:false };

function editor(){ return window.BongdamEditor || null; }
function estate(){ return editor() ? editor().state : null; }
function editorOn(){
  const st = estate();
  const txt = (($('bge-toggle') || {}).textContent || '') + ' ' + (($('editor-toggle') || {}).textContent || '');
  return !!(st && st.enabled) || /ON|온|켜짐/i.test(txt);
}
function stage(){ try { return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; } catch(e){ return null; } }
function objects(){ const st = stage(); return st && Array.isArray(st.objects) ? st.objects : []; }
function clamp(v,a,b){ v = Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a; }
function clamp01(v){ return clamp(v,0,1); }
function fmt(v){ v = Number(v); return Number.isFinite(v) ? v.toFixed(3) : '0.000'; }
function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function say(msg){ try { if (typeof window.toast === 'function') window.toast(msg); else console.log(msg); } catch(e){ console.log(msg); } }
function save(){ try { if (editor()) editor().save(false); } catch(e){} }
function redraw(){ try { const c = $('game-canvas'); if (c && typeof renderMap === 'function') renderMap(c); } catch(e){} }
function refreshAll(){
  renderDock();
  if (typeof isEditingV49Input !== 'function' || !isEditingV49Input()) {
    renderInspector();
  }
  redraw();
}

function typeName(t){
  t = String(t || '').toLowerCase();
  if (t.includes('npc')) return 'NPC';
  if (t.includes('monster')) return '몬스터';
  if (t.includes('hazard')) return '위험 요소';
  if (t.includes('info')) return '안내판';
  if (t.includes('quest')) return '퀘스트';
  if (t.includes('portal') || t.includes('stair')) return '맵 이동';
  if (t.includes('building')) return '건물';
  if (t.includes('wall')) return '벽';
  if (t.includes('prop')) return '배치물';
  if (t.includes('decoration')) return '장식';
  return t || '배치물';
}
function icon(obj){
  const t = String((obj && obj.type) || '').toLowerCase();
  if (t.includes('npc')) return '🙂';
  if (t.includes('monster')) return '👾';
  if (t.includes('hazard')) return '⚠️';
  if (t.includes('info')) return 'ℹ️';
  if (t.includes('quest')) return '❗';
  if (t.includes('portal') || t.includes('stair')) return '🚪';
  if (t.includes('wall')) return '⬛';
  if (t.includes('prop') || t.includes('decoration')) return '🧱';
  return '🏠';
}
function objName(obj, i){ return obj.label || obj.name || obj.title || (typeName(obj.type) + ' ' + (i+1)); }
function exitName(dir){ return ({top:'위쪽 이동',bottom:'아래쪽 이동',left:'왼쪽 이동',right:'오른쪽 이동'})[dir] || dir; }

function virtualRows(){
  const st = stage();
  if (!st) return [];
  const rows = [
    {kind:'map', id:'map', icon:'🗺️', title:'맵 배경', sub:'배경 Key: ' + (st.bgKey || '(없음)')},
    {kind:'player', id:'player', icon:'🧍', title:'플레이어 캐릭터', sub:'X ' + fmt(typeof heroX !== 'undefined' ? heroX : .5) + ' / Y ' + fmt(typeof heroY !== 'undefined' ? heroY : .8)},
    {kind:'spawn', id:'spawn', icon:'⭐', title:'시작 위치', sub:'X ' + fmt(st.spawnX) + ' / Y ' + fmt(st.spawnY)}
  ];
  const exits = st.exits || {};
  ['top','bottom','left','right'].forEach(dir => {
    const ex = exits[dir];
    if (ex && ex.active) rows.push({kind:'exit', id:'exit:'+dir, dir, icon:'🚪', title:exitName(dir), sub:'다음 맵 ' + ex.nextStage + ' / 등장 X ' + fmt(ex.entryX) + ' / Y ' + fmt(ex.entryY)});
  });
  if (typeof SCARECROW_SPAWN_STAGE !== 'undefined' && Number(currentStage) === Number(SCARECROW_SPAWN_STAGE)) {
    rows.push({kind:'scarecrow', id:'scarecrow', icon:'🎯', title:'허수아비', sub:'X ' + fmt(typeof SCARECROW_SPAWN_X !== 'undefined' ? SCARECROW_SPAWN_X : .5) + ' / Y ' + fmt(typeof SCARECROW_SPAWN_Y !== 'undefined' ? SCARECROW_SPAWN_Y : .5)});
  }
  return rows;
}
function rows(){
  const out = [...virtualRows()];
  objects().forEach((o,i) => {
    out.push({
      kind:'object',
      id:'object:'+i,
      index:i,
      icon:icon(o),
      title:objName(o,i),
      sub:typeName(o.type) + ' / Key: ' + (o.key || '-') + ' / X ' + fmt(o.rx) + ' / Y ' + fmt(o.ry),
      hidden:o.hidden === true || o.visible === false,
      locked:o.locked === true,
      type:String(o.type || '').toLowerCase()
    });
  });
  return out;
}
function pass(row){
  if (S.filter === 'virtual') return row.kind !== 'object';
  if (S.filter === 'object') return row.kind === 'object';
  if (S.filter === 'npc') return row.kind === 'object' && (row.type.includes('npc') || row.type.includes('monster') || row.type.includes('hazard') || row.type.includes('info') || row.type.includes('quest'));
  return true;
}
function selected(row){
  if (row.kind === 'object') return S.kind === 'object' && S.index === row.index;
  return S.kind === row.kind && S.id === row.id;
}
function clearOld(){
  const st = estate();
  if (st) {
    st.selectedIndex = -1;
    st.selectedPart = 'object';
  }
}
function select(row){
  if (row.kind === 'object') {
    S.kind = 'object';
    S.id = row.id;
    S.index = row.index;
    const st = estate();
    if (st) {
      st.selectedIndex = row.index;
      st.selectedPart = 'object';
    }
  } else {
    S.kind = row.kind;
    S.id = row.id;
    S.index = -1;
    clearOld();
  }
  refreshAll();
}
function selectedObject(){
  return S.kind === 'object' ? objects()[S.index] : null;
}

function renderDock(){
  const dock = $('bge-v49-dock');
  const list = $('bge-v49-list');
  const debug = $('bge-v49-debug');
  if (!dock || !list) return;

  dock.style.display = editorOn() ? 'block' : 'none';
  if (!editorOn()) return;

  const visibleRows = rows().filter(pass);
  list.innerHTML = visibleRows.map(row => {
    const act = selected(row) ? ' active' : '';
    const dim = row.hidden ? ' dim' : '';
    const data = row.kind === 'object' ? 'data-index="'+row.index+'"' : 'data-id="'+esc(row.id)+'"';
    const actions = row.kind === 'object'
      ? '<div class="v49-actions"><button type="button" data-v49-action="eye" data-index="'+row.index+'">'+(row.hidden?'🙈':'👁')+'</button><button type="button" data-v49-action="lock" data-index="'+row.index+'">'+(row.locked?'🔒':'🔓')+'</button></div>'
      : '';
    return '<div class="v49-row'+act+dim+'" data-kind="'+row.kind+'" '+data+'>' +
      '<div class="v49-icon">'+row.icon+'</div>' +
      '<div class="v49-main"><div class="v49-title">'+esc(row.title)+'</div><div class="v49-sub">'+esc(row.sub)+'</div></div>' +
      actions +
    '</div>';
  }).join('') || '<div class="v49-row"><div class="v49-main"><div class="v49-sub">표시할 오브젝트가 없습니다.</div></div></div>';

  list.querySelectorAll('.v49-row[data-kind]').forEach(el => {
    if (el._v49) return;
    el._v49 = true;
    el.addEventListener('click', event => {
      if (event.target && event.target.dataset && event.target.dataset.v49Action) return;
      const kind = el.dataset.kind;
      if (kind === 'object') select({kind:'object', id:'object:'+Number(el.dataset.index), index:Number(el.dataset.index)});
      else select({kind, id:el.dataset.id});
    });
  });

  list.querySelectorAll('[data-v49-action]').forEach(btn => {
    if (btn._v49) return;
    btn._v49 = true;
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const obj = objects()[Number(btn.dataset.index)];
      if (!obj) return;
      if (btn.dataset.v49Action === 'eye') {
        const hidden = obj.hidden === true || obj.visible === false;
        obj.hidden = !hidden;
        obj.visible = hidden;
      }
      if (btn.dataset.v49Action === 'lock') obj.locked = !obj.locked;
      save();
      renderDock();
      redraw();
    });
  });

  if (debug) {
    debug.textContent = '현재 맵 오브젝트 ' + objects().length + '개 / 맵·캐릭터 항목 ' + virtualRows().length + '개';
  }
}

function bgOptions(selectedKey){
  const set = new Set(['']);
  try {
    Object.values(STAGES || {}).forEach(st => {
      if (st && st.bgKey != null) set.add(String(st.bgKey));
    });
  } catch(e) {}
  return Array.from(set).map(k => '<option value="'+esc(k)+'"'+(String(selectedKey||'')===String(k)?' selected':'')+'>'+(k || '(없음)')+'</option>').join('');
}
function posFields(lx,ly,x,y){
  return '<div class="v49-grid2"><div><label>'+esc(lx)+'</label><input id="bge-v49-x" type="number" min="0" max="1" step="0.001" value="'+fmt(x)+'"></div><div><label>'+esc(ly)+'</label><input id="bge-v49-y" type="number" min="0" max="1" step="0.001" value="'+fmt(y)+'"></div></div>';
}
function renderInspector(){
  const box = $('bge-v49-inspector');
  const fields = $('bge-v49-fields');
  const apply = $('bge-v49-apply');
  const extra = $('bge-v49-extra');
  const note = $('bge-v49-note');
  const st = stage();

  if (!box || !fields || !apply || !extra || !note || !st || !S.kind || !editorOn()) {
    if (box) box.style.display = 'none';
    return;
  }

  box.style.display = 'block';
  extra.innerHTML = '';
  note.textContent = '';

  if (S.kind === 'map') {
    fields.innerHTML = '<label>맵 이름</label><input id="bge-v49-map-name" type="text" value="'+esc(st.name||'')+'"><label>배경 이미지 Key</label><select id="bge-v49-bg">'+bgOptions(st.bgKey)+'</select>';
    apply.onclick = applyMap;
    note.textContent = '맵 배경은 배경 Key를 바꾸는 방식으로 수정합니다.';
    return;
  }
  if (S.kind === 'player') {
    fields.innerHTML = posFields('플레이어 X','플레이어 Y', heroX, heroY);
    apply.onclick = applyPos;
    extra.innerHTML = '<button type="button" id="bge-v49-copy-spawn">현재 위치를 시작 위치로 복사</button>';
    $('bge-v49-copy-spawn').onclick = () => { st.spawnX = clamp01(heroX); st.spawnY = clamp01(heroY); save(); refreshAll(); say('플레이어 위치를 시작 위치로 복사했습니다.'); };
    note.textContent = '맵 위의 🧍 마커를 드래그해도 됩니다.';
    return;
  }
  if (S.kind === 'spawn') {
    fields.innerHTML = posFields('시작 위치 X','시작 위치 Y', st.spawnX, st.spawnY);
    apply.onclick = applyPos;
    note.textContent = '맵 위의 ⭐ 마커를 드래그해도 됩니다.';
    return;
  }
  if (S.kind === 'scarecrow') {
    fields.innerHTML = posFields('허수아비 X','허수아비 Y', typeof SCARECROW_SPAWN_X !== 'undefined' ? SCARECROW_SPAWN_X : .5, typeof SCARECROW_SPAWN_Y !== 'undefined' ? SCARECROW_SPAWN_Y : .5);
    apply.onclick = applyPos;
    note.textContent = '맵 위의 🎯 마커를 드래그해도 됩니다.';
    return;
  }
  if (S.kind === 'exit') {
    const dir = (S.id || '').split(':')[1];
    const ex = (st.exits || {})[dir] || {};
    fields.innerHTML =
      '<label>이동 방향</label><input type="text" disabled value="'+esc(exitName(dir))+'">' +
      '<div class="v49-grid3"><div><label>사용 여부</label><select id="bge-v49-ex-active"><option value="1"'+(ex.active?' selected':'')+'>사용</option><option value="0"'+(!ex.active?' selected':'')+'>꺼짐</option></select></div><div><label>다음 맵</label><input id="bge-v49-ex-next" type="number" step="1" value="'+esc(ex.nextStage ?? '')+'"></div><div></div></div>' +
      posFields('등장 위치 X','등장 위치 Y', ex.entryX, ex.entryY);
    apply.onclick = applyExit;
    note.textContent = '맵 위의 🚪 마커를 드래그하면 이동 후 등장 위치가 바뀝니다.';
    return;
  }
  if (S.kind === 'object') {
    const obj = selectedObject();
    if (!obj) { box.style.display = 'none'; return; }
    fields.innerHTML =
      '<label>선택 배치물</label><input type="text" disabled value="'+esc(objName(obj,S.index))+'">' +
      '<div class="v49-grid2"><div><label>X</label><input id="bge-v49-obj-x" type="number" min="0" max="1" step="0.001" value="'+fmt(obj.rx)+'"></div><div><label>Y</label><input id="bge-v49-obj-y" type="number" min="0" max="1" step="0.001" value="'+fmt(obj.ry)+'"></div></div>' +
      '<div class="v49-grid2"><div><label>W</label><input id="bge-v49-obj-w" type="number" min="0.005" max="1" step="0.001" value="'+fmt(obj.rw||.1)+'"></div><div><label>H</label><input id="bge-v49-obj-h" type="number" min="0.005" max="1" step="0.001" value="'+fmt(obj.rh||.1)+'"></div></div>';
    apply.onclick = applyObject;
    note.textContent = '기존 인스펙터와 별개로 빠른 위치/크기 수정용입니다.';
  }
}
function applyMap(){
  const st = stage();
  if (!st) return;
  const name = $('bge-v49-map-name');
  const bg = $('bge-v49-bg');
  if (name) st.name = name.value;
  if (bg) st.bgKey = bg.value || null;
  if ($('bge-stage-name')) $('bge-stage-name').value = st.name || '';
  save();
  refreshAll();
  say('맵 설정 적용 완료');
}
function applyPos(){
  const st = stage();
  if (!st) return;
  const x = clamp01(($('bge-v49-x') || {}).value);
  const y = clamp01(($('bge-v49-y') || {}).value);
  if (S.kind === 'player') { heroX = x; heroY = y; }
  if (S.kind === 'spawn') { st.spawnX = x; st.spawnY = y; }
  if (S.kind === 'scarecrow' && typeof SCARECROW_SPAWN_X !== 'undefined') {
    SCARECROW_SPAWN_X = x;
    SCARECROW_SPAWN_Y = y;
    st.__v49ScarecrowX = x;
    st.__v49ScarecrowY = y;
  }
  if (S.kind === 'exit') {
    const dir = (S.id || '').split(':')[1];
    if (st.exits && st.exits[dir]) {
      st.exits[dir].entryX = x;
      st.exits[dir].entryY = y;
    }
  }
  save();
  refreshAll();
  say('위치 적용 완료');
}
function applyExit(){
  const st = stage();
  if (!st) return;
  const dir = (S.id || '').split(':')[1];
  if (!st.exits) st.exits = {};
  if (!st.exits[dir]) st.exits[dir] = {active:false,nextStage:currentStage,entryX:.5,entryY:.5};
  const ex = st.exits[dir];
  ex.active = (($('bge-v49-ex-active') || {}).value || '1') === '1';
  ex.nextStage = Number(($('bge-v49-ex-next') || {}).value || ex.nextStage || currentStage);
  ex.entryX = clamp01(($('bge-v49-x') || {}).value);
  ex.entryY = clamp01(($('bge-v49-y') || {}).value);
  save();
  refreshAll();
  say('이동 지점 적용 완료');
}
function applyObject(){
  const obj = selectedObject();
  if (!obj) return;
  if (obj.locked) { alert('잠긴 배치물입니다.'); return; }
  obj.rx = clamp01(($('bge-v49-obj-x') || {}).value);
  obj.ry = clamp01(($('bge-v49-obj-y') || {}).value);
  obj.rw = clamp(($('bge-v49-obj-w') || {}).value, .005, 1);
  obj.rh = clamp(($('bge-v49-obj-h') || {}).value, .005, 1);
  save();
  refreshAll();
  say('배치물 위치/크기 적용 완료');
}

function syncSpecial(){
  const st = stage();
  if (!st) return;
  if (typeof SCARECROW_SPAWN_STAGE !== 'undefined' &&
      Number(currentStage) === Number(SCARECROW_SPAWN_STAGE) &&
      typeof SCARECROW_SPAWN_X !== 'undefined') {
    if (Number.isFinite(Number(st.__v49ScarecrowX))) SCARECROW_SPAWN_X = Number(st.__v49ScarecrowX);
    if (Number.isFinite(Number(st.__v49ScarecrowY))) SCARECROW_SPAWN_Y = Number(st.__v49ScarecrowY);
  }
}
function markerRows(){
  const st = stage();
  if (!st) return [];
  const arr = [];
  if (typeof heroX !== 'undefined') arr.push({kind:'player',id:'player',x:Number(heroX||.5),y:Number(heroY||.8),label:'플레이어',icon:'🧍',color:'rgba(255,235,120,.96)'});
  arr.push({kind:'spawn',id:'spawn',x:Number(st.spawnX||.5),y:Number(st.spawnY||.8),label:'시작',icon:'⭐',color:'rgba(255,210,60,.96)'});
  if (typeof SCARECROW_SPAWN_STAGE !== 'undefined' && Number(currentStage) === Number(SCARECROW_SPAWN_STAGE) && typeof SCARECROW_SPAWN_X !== 'undefined') {
    arr.push({kind:'scarecrow',id:'scarecrow',x:Number(SCARECROW_SPAWN_X||.5),y:Number(SCARECROW_SPAWN_Y||.5),label:'허수아비',icon:'🎯',color:'rgba(255,120,110,.96)'});
  }
  const exits = st.exits || {};
  ['top','bottom','left','right'].forEach(dir => {
    const ex = exits[dir];
    if (ex && ex.active) arr.push({kind:'exit',id:'exit:'+dir,x:Number(ex.entryX||.5),y:Number(ex.entryY||.5),label:exitName(dir),icon:'🚪',color:'rgba(120,220,255,.96)'});
  });
  return arr;
}
function drawMarkers(ctx, canvas){
  if (!editorOn()) return;
  syncSpecial();
  const sc = typeof currentScale !== 'undefined' ? currentScale : 1;
  ctx.save();
  markerRows().forEach(m => {
    const x = toScreenX(m.x, canvas);
    const y = toScreenY(m.y, canvas);
    const selected = S.id === m.id;
    ctx.beginPath();
    ctx.fillStyle = m.color;
    ctx.strokeStyle = selected ? 'rgba(255,255,255,.98)' : 'rgba(0,0,0,.9)';
    ctx.lineWidth = (selected ? 3 : 2) * sc;
    ctx.arc(x, y, (selected ? 12 : 9) * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold ' + Math.round(12 * sc) + "px 'Noto Serif KR', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#fff5cd';
    ctx.strokeStyle = 'rgba(0,0,0,.9)';
    ctx.lineWidth = 3 * sc;
    const text = m.icon + ' ' + m.label;
    ctx.strokeText(text, x + 12 * sc, y - 10 * sc);
    ctx.fillText(text, x + 12 * sc, y - 10 * sc);
  });
  ctx.restore();
}
function patchRender(){
  if (S.renderPatched || typeof renderMap !== 'function') return;
  const prev = renderMap;
  renderMap = function(canvas){
    prev(canvas);
    try { drawMarkers(canvas.getContext('2d'), canvas); }
    catch(e){ console.warn('v5.2 marker error', e); }
  };
  S.renderPatched = true;
}
function screenToMapSafe(clientX, clientY){
  if (typeof screenToMap === 'function') return screenToMap(clientX, clientY);
  const c = $('game-canvas');
  const r = c.getBoundingClientRect();
  return {x:clamp01((clientX-r.left)/r.width), y:clamp01((clientY-r.top)/r.height)};
}
function hitMarker(clientX, clientY){
  const canvas = $('game-canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  for (const m of markerRows()) {
    const px = toScreenX(m.x, canvas);
    const py = toScreenY(m.y, canvas);
    const sx = rect.left + px / canvas.width * rect.width;
    const sy = rect.top + py / canvas.height * rect.height;
    const dx = clientX - sx;
    const dy = clientY - sy;
    if (Math.sqrt(dx*dx + dy*dy) <= 18) return m;
  }
  return null;
}
function bindCanvas(){
  const canvas = $('game-canvas');
  if (!canvas || S.canvasBound) return;
  S.canvasBound = true;
  canvas.addEventListener('mousedown', e => {
    if (!editorOn() || e.button !== 0) return;
    const hit = hitMarker(e.clientX, e.clientY);
    if (!hit) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    select({kind:hit.kind, id:hit.id});
    S.drag = {kind:hit.kind, id:hit.id};
  }, true);
  window.addEventListener('mousemove', e => {
    if (!S.drag || !editorOn()) return;
    const st = stage();
    if (!st) return;
    const p = screenToMapSafe(e.clientX, e.clientY);
    const x = clamp01(p.x);
    const y = clamp01(p.y);
    if (S.drag.kind === 'player') { heroX = x; heroY = y; }
    if (S.drag.kind === 'spawn') { st.spawnX = x; st.spawnY = y; }
    if (S.drag.kind === 'scarecrow' && typeof SCARECROW_SPAWN_X !== 'undefined') {
      SCARECROW_SPAWN_X = x;
      SCARECROW_SPAWN_Y = y;
      st.__v49ScarecrowX = x;
      st.__v49ScarecrowY = y;
    }
    if (S.drag.kind === 'exit') {
      const dir = (S.drag.id || '').split(':')[1];
      if (st.exits && st.exits[dir]) {
        st.exits[dir].entryX = x;
        st.exits[dir].entryY = y;
      }
    }
    renderInspector();
    renderDock();
    redraw();
  }, true);
  window.addEventListener('mouseup', () => {
    if (!S.drag) return;
    S.drag = null;
    save();
    refreshAll();
  }, true);
}
function bindUi(){
  document.querySelectorAll('[data-v49-filter]').forEach(btn => {
    if (btn._v49) return;
    btn._v49 = true;
    btn.addEventListener('click', () => {
      S.filter = btn.dataset.v49Filter || 'all';
      document.querySelectorAll('[data-v49-filter]').forEach(b => b.classList.toggle('active', b === btn));
      renderDock();
    });
  });
  const refreshBtn = $('bge-v49-refresh');
  if (refreshBtn && !refreshBtn._v49) {
    refreshBtn._v49 = true;
    refreshBtn.addEventListener('click', refreshAll);
  }
}
function isEditingV49Input(){
  const active = document.activeElement;
  if (!active) return false;
  const box = document.getElementById('bge-v49-inspector');
  if (!box || !box.contains(active)) return false;
  const tag = String(active.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea';
}
function tick(){
  bindUi();
  syncSpecial();
  renderDock();
  // 입력칸을 수정하는 중에는 자동 갱신으로 값을 덮어쓰지 않는다.
  if (!isEditingV49Input()) {
    renderInspector();
  }
  setTimeout(tick, 700);
}
function init(){
  if (typeof STAGES === 'undefined' || !$('game-canvas')) return setTimeout(init, 150);
  patchRender();
  bindCanvas();
  bindUi();
  tick();
  say('v5.2 퀘스트 버전 통합 에디터 준비 완료');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
