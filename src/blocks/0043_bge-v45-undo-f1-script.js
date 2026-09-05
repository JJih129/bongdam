
(function(){
  'use strict';
  if (window.BongdamV45UndoF1) return;
  window.BongdamV45UndoF1 = true;

  const STORAGE_UI_KEY = 'bongdam_rpg_editor_ui_hidden_v45';
  const ASSET_KEY = 'bongdam_rpg_assets_v42';
  const SETTINGS_KEY = 'bongdam_rpg_image_settings_v5_2_quest';
  const PROJECT_KEY = 'bongdam_rpg_editor_project_v5_2_quest';
  const MAX_HISTORY = 50;
  const $ = id => document.getElementById(id);
  const history = { undo: [], redo: [], applying: false, lastPushAt: 0, lastText: '' };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function editor(){ return window.BongdamEditor || null; }
  function editorState(){ return editor() ? editor().state : null; }
  function isEditorEnabled(){ const s = editorState(); return !!(s && s.enabled); }
  function toast(msg){
    const t = $('bge-toast');
    if (t) {
      t.textContent = msg;
      t.style.display = 'block';
      clearTimeout(toast._t);
      toast._t = setTimeout(()=>{ t.style.display='none'; }, 1800);
    }
    const m = $('bge-v45-history-status');
    if (m) m.textContent = msg;
    console.log('[봉담 v4.5]', msg);
  }
  function currentAssetMap(){
    try {
      if (window.BongdamV43ImageManagement && typeof window.BongdamV43ImageManagement.getAssets === 'function') {
        return window.BongdamV43ImageManagement.getAssets();
      }
    } catch(e){}
    try {
      const raw = localStorage.getItem(ASSET_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed.assets || parsed || {};
    } catch(e){ return {}; }
  }
  function currentImageSettings(){
    try {
      if (window.BongdamV43ImageManagement && typeof window.BongdamV43ImageManagement.getSettings === 'function') {
        return window.BongdamV43ImageManagement.getSettings();
      }
    } catch(e){}
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function makeSnapshot(label){
    if (typeof STAGES === 'undefined') return null;
    // (v268) 안전화 — 전체 맵이 아니라 '지금 보고 있는 스테이지'만 기록/복원한다.
    var sid = String(typeof currentStage !== 'undefined' ? currentStage : 1);
    return {
      label: label || '작업',
      time: Date.now(),
      stageId: sid,
      stage: clone(STAGES[sid] || null)
    };
  }
  function snapshotText(snap){
    // 이미지 dataUrl까지 포함하면 문자열이 커질 수 있으므로, 중복 비교는 스테이지/설정 위주로 한다.
    return JSON.stringify({stages:snap.stages,currentStage:snap.currentStage,settings:snap.imageSettings,assets:Object.keys(snap.assets||{}).sort()});
  }
  function pushHistory(label){
    if (history.applying || !isEditorEnabled()) return;
    const now = Date.now();
    const snap = makeSnapshot(label);
    if (!snap) return;
    const text = snapshotText(snap);
    if (text === history.lastText && now - history.lastPushAt < 350) return;
    history.undo.push(snap);
    if (history.undo.length > MAX_HISTORY) history.undo.shift();
    history.redo.length = 0;
    history.lastText = text;
    history.lastPushAt = now;
    updatePanel();
  }
  function applySnapshot(snap){
    if (!snap || typeof STAGES === 'undefined') return;
    history.applying = true;
    try {
      // (v268) 해당 스테이지만 복원 — 전역(히어로·카메라·에셋)은 건드리지 않는다.
      if (snap.stageId && snap.stage) {
        STAGES[snap.stageId] = clone(snap.stage);
      } else if (snap.stages) {
        var sid = String(typeof currentStage !== 'undefined' ? currentStage : 1);
        if (snap.stages[sid]) STAGES[sid] = clone(snap.stages[sid]);
      }
      if (typeof window.BongdamEditor !== 'undefined' && window.BongdamEditor.refresh) window.BongdamEditor.refresh();
    } catch(e) { console.warn('스냅샷 복원 실패', e); }
    history.applying = false;
  }
  function undo(){
    if (!history.undo.length) { toast('되돌릴 작업이 없습니다.'); return; }
    const current = makeSnapshot('되돌리기 전 상태');
    if (current) history.redo.push(current);
    const prev = history.undo.pop();
    applySnapshot(prev);
    toast('이전 작업으로 되돌렸습니다: ' + (prev.label || '작업'));
  }
  function redo(){
    if (!history.redo.length) { toast('다시 실행할 작업이 없습니다.'); return; }
    const current = makeSnapshot('다시 실행 전 상태');
    if (current) history.undo.push(current);
    const next = history.redo.pop();
    applySnapshot(next);
    toast('되돌린 작업을 다시 실행했습니다.');
  }
  function setUiHidden(hidden){
    document.body.classList.toggle('bge-ui-hidden', !!hidden);
    localStorage.setItem(STORAGE_UI_KEY, hidden ? '1' : '0');
    const btn = $('bge-toggle');
    if (btn) btn.textContent = hidden ? '🛠 UI 숨김(F1)' : (isEditorEnabled() ? '🛠 에디터 ON' : '🛠 에디터');
    updatePanel();
  }
  function toggleUiHidden(){
    const next = !document.body.classList.contains('bge-ui-hidden');
    setUiHidden(next);
    toast(next ? '제작 UI를 숨겼습니다. F1을 누르면 다시 표시됩니다.' : '제작 UI를 다시 표시했습니다.');
  }
  function ensureBadge(){
    if (!$('bge-v45-badge')) {
      const b = document.createElement('div');
      b.id = 'bge-v45-badge';
      b.textContent = '제작 UI 숨김 상태 · F1: 다시 표시';
      document.body.appendChild(b);
    }
  }
  function ensurePanel(){
    if ($('bge-v45-history-panel')) return;
    const host = $('bge-panel');
    if (!host) return;
    const panel = document.createElement('div');
    panel.id = 'bge-v45-history-panel';
    panel.innerHTML = '<b>작업 되돌리기 / UI 숨김</b><br>'+
      '<button id="bge-v45-undo" type="button">되돌리기 Ctrl+Z</button>'+
      '<button id="bge-v45-redo" type="button">다시 실행 Ctrl+Y</button>'+
      '<button id="bge-v45-hide-ui" type="button">제작 UI 숨김 F1</button>'+
      '<div class="bge-v45-small">F1: 제작 UI 표시/숨김 · Ctrl+Z: 이전 작업 · Ctrl+Y 또는 Ctrl+Shift+Z: 다시 실행</div>'+
      '<div id="bge-v45-history-status" class="bge-v45-small">작업 기록 준비 중</div>';
    host.insertBefore(panel, host.firstChild);
    $('bge-v45-undo').addEventListener('click', undo);
    $('bge-v45-redo').addEventListener('click', redo);
    $('bge-v45-hide-ui').addEventListener('click', toggleUiHidden);
    updatePanel();
  }
  function updatePanel(){
    const s = $('bge-v45-history-status');
    if (s) s.textContent = '되돌리기 ' + history.undo.length + '단계 / 다시 실행 ' + history.redo.length + '단계' + (document.body.classList.contains('bge-ui-hidden') ? ' / 제작 UI 숨김' : '');
    const h = $('bge-v45-hide-ui');
    if (h) h.textContent = document.body.classList.contains('bge-ui-hidden') ? '제작 UI 다시 표시 F1' : '제작 UI 숨김 F1';
  }
  function isEditorTarget(t){
    return !!(t && (t.closest && (t.closest('#bge-panel') || t.closest('#bge-hierarchy') || t.closest('#bge-toolbar') || t.closest('#bge-toggle'))));
  }
  function bindHistoryTriggers(){
    const canvas = $('game-canvas');
    if (canvas && !canvas.__v45UndoBound) {
      canvas.addEventListener('mousedown', function(e){ if (isEditorEnabled() && e.button === 0) pushHistory('장면 화면 작업 전'); }, true);
      canvas.__v45UndoBound = true;
    }
    if (!document.__v45UndoBound) {
      document.addEventListener('mousedown', function(e){ if (isEditorEnabled() && isEditorTarget(e.target)) pushHistory('UI 작업 전'); }, true);
      document.addEventListener('change', function(e){ if (isEditorEnabled() && isEditorTarget(e.target)) pushHistory('값 변경 전'); }, true);
      document.addEventListener('beforeinput', function(e){ if (isEditorEnabled() && isEditorTarget(e.target)) pushHistory('입력 전'); }, true);
      document.__v45UndoBound = true;
    }
  }
  function bindKeys(){
    if (document.__v45KeyBound) return;
    document.__v45KeyBound = true;
    document.addEventListener('keydown', function(e){
      const key = String(e.key || '').toLowerCase();
      if (e.key === 'F1') {
        e.preventDefault();
        if (isEditorEnabled()) toggleUiHidden();
        else toast('F1은 제작 모드에서 제작 UI를 숨기거나 다시 표시합니다.');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (isEditorEnabled() && (e.key === 'Delete' || ((e.ctrlKey || e.metaKey) && key === 'd'))) {
        pushHistory(e.key === 'Delete' ? '삭제 전' : '복제 전');
      }
    }, true);
  }
  function init(){
    if (typeof STAGES === 'undefined' || !editor()) return setTimeout(init, 120);
    ensureBadge(); ensurePanel(); bindHistoryTriggers(); bindKeys();
    setUiHidden(localStorage.getItem(STORAGE_UI_KEY) === '1');
    setInterval(function(){ ensureBadge(); ensurePanel(); bindHistoryTriggers(); updatePanel(); }, 1200);
    toast('v4.5 되돌리기와 F1 제작 UI 숨김 기능 준비 완료');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
