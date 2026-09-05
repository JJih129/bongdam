
(function(){
'use strict';
const $ = id => document.getElementById(id);
const PATCH_NAME = 'BongdamEditorV33';
if (window[PATCH_NAME]) return;

function ed(){ return window.BongdamEditor || null; }
function state(){ return ed() ? ed().state : null; }
function stage(){ return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; }
function objects(){ const s = stage(); return s && Array.isArray(s.objects) ? s.objects : []; }
function selected(){ const s = state(), list = objects(); return s && s.selectedIndex >= 0 && s.selectedIndex < list.length ? list[s.selectedIndex] : null; }
function toast(msg){ const t=$('bge-toast'); if(t){ t.textContent=msg; t.style.display='block'; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.display='none',1700); } else console.log(msg); }
function saveRefresh(msg){ if(ed()){ ed().save(false); ed().refresh(); } if(msg) toast(msg); }
function clamp(v,a,b){ v=Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a; }
function viewportW(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=state(); return fixed ? fixed.w : (s && s.enabled ? 1 / s.editorZoom : (typeof VIEWPORT_W !== 'undefined' ? VIEWPORT_W : 1)); }
function viewportH(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=state(); return fixed ? fixed.h : (s && s.enabled ? 1 / s.editorZoom : (typeof VIEWPORT_H !== 'undefined' ? VIEWPORT_H : 1)); }
function screenToMap(clientX, clientY){
  const c=$('game-canvas'); if(!c) return {x:0,y:0};
  const r=c.getBoundingClientRect();
  const sx=(clientX-r.left)*(c.width/r.width), sy=(clientY-r.top)*(c.height/r.height);
  const bx=(sx-c.width/2)/(typeof currentScale !== 'undefined' ? currentScale : 1)+(typeof BASE_W !== 'undefined' ? BASE_W : c.width)/2;
  const by=(sy-c.height/2)/(typeof currentScale !== 'undefined' ? currentScale : 1)+(typeof BASE_H !== 'undefined' ? BASE_H : c.height)/2;
  const bw=(typeof BASE_W !== 'undefined' ? BASE_W : c.width), bh=(typeof BASE_H !== 'undefined' ? BASE_H : c.height);
  return { x: clamp((bx/bw-.5)*viewportW()+camX,0,1), y: clamp((by/bh-.5)*viewportH()+camY,0,1) };
}
function contains(o,x,y){
  if(!o) return false;
  const rx=Number(o.rx||0), ry=Number(o.ry||0), rw=Number(o.rw||0.08), rh=Number(o.rh||0.08);
  return x>=rx && x<=rx+rw && y>=ry && y<=ry+rh;
}
function topObjectAt(x,y){
  const list=objects();
  for(let i=list.length-1;i>=0;i--) if(contains(list[i],x,y)) return {obj:list[i], index:i};
  return null;
}
function objectIndexFromItem(item){
  const span = item && item.querySelector('span');
  const text = span ? span.textContent : (item ? item.textContent : '');
  const m = String(text||'').match(/(\d+)\s*\./);
  return m ? Number(m[1]) - 1 : -1;
}
function isCollisionType(obj){
  return obj && ['building','wall','shelf','desk','platform','seats','piano'].includes(obj.type);
}

function toggleHidden(index){
  const obj = objects()[index]; if(!obj) return;
  obj.hidden = !obj.hidden;
  saveRefresh(obj.hidden ? '오브젝트 비주얼 OFF / 충돌·상호작용 제외' : '오브젝트 비주얼 ON');
}
function toggleLocked(index){
  const obj = objects()[index]; if(!obj) return;
  obj.locked = !obj.locked;
  saveRefresh(obj.locked ? '오브젝트 잠금 ON: 씬에서 이동/크기 변경 방지' : '오브젝트 잠금 OFF');
}

function decorateHierarchy(){
  const box = $('bge-object-list'); if(!box) return;
  box.querySelectorAll('.bge-object-item:not(.bge-child)').forEach(item=>{
    const idx = objectIndexFromItem(item); const obj = objects()[idx]; if(!obj) return;
    item.classList.toggle('bge-hidden-object', !!obj.hidden);
    item.classList.toggle('bge-locked-object', !!obj.locked);
    const first = item.querySelector('span'); if(!first) return;
    let eye = first.querySelector('.bge-eye');
    if(eye){ eye.textContent = obj.hidden ? '🙈' : '👁'; eye.title = obj.hidden ? '현재 숨김: 클릭하면 보이기' : '현재 보임: 클릭하면 숨기기'; }
    let lock = first.querySelector('.bge-lock');
    if(!lock){ lock = document.createElement('span'); lock.className = 'bge-lock'; const ref = first.querySelector('.bge-eye'); if(ref && ref.nextSibling) first.insertBefore(lock, ref.nextSibling); else first.insertBefore(lock, first.firstChild); }
    lock.textContent = obj.locked ? '🔒' : '🔓';
    lock.title = obj.locked ? '현재 잠금: 클릭하면 잠금 해제' : '현재 잠금 해제: 클릭하면 잠금';
  });
}

function installHierarchyEvents(){
  const box = $('bge-object-list'); if(!box || box._v33Events) return;
  box._v33Events = true;
  box.addEventListener('click', e=>{
    const eye = e.target.closest && e.target.closest('.bge-eye');
    const lock = e.target.closest && e.target.closest('.bge-lock');
    if(!eye && !lock) return;
    e.preventDefault(); e.stopPropagation();
    const item = e.target.closest('.bge-object-item');
    const idx = objectIndexFromItem(item);
    if(idx < 0) return;
    if(eye) toggleHidden(idx);
    if(lock) toggleLocked(idx);
  }, true);
}

function installSelectedTools(){
  const form = $('bge-selected-form'); if(!form || $('bge-v33-selected-tools')) return;
  const box = document.createElement('div');
  box.id = 'bge-v33-selected-tools';
  box.innerHTML = '<b>선택 오브젝트 빠른 상태</b><br><button id="bge-v33-toggle-visible" type="button">👁 표시/숨김</button><button id="bge-v33-toggle-lock" type="button">🔓 잠금/해제</button><div id="bge-v33-state-text"></div>';
  form.insertBefore(box, form.firstChild);
  $('bge-v33-toggle-visible').addEventListener('click', ()=>{ const s=state(); if(!s||s.selectedIndex<0) return alert('오브젝트를 먼저 선택하세요.'); toggleHidden(s.selectedIndex); });
  $('bge-v33-toggle-lock').addEventListener('click', ()=>{ const s=state(); if(!s||s.selectedIndex<0) return alert('오브젝트를 먼저 선택하세요.'); toggleLocked(s.selectedIndex); });
}
function refreshSelectedTools(){
  const obj=selected(), txt=$('bge-v33-state-text'), b1=$('bge-v33-toggle-visible'), b2=$('bge-v33-toggle-lock');
  if(!txt||!b1||!b2) return;
  if(!obj){ txt.textContent='선택된 오브젝트가 없습니다.'; b1.classList.remove('active'); b2.classList.remove('active'); return; }
  b1.textContent = obj.hidden ? '🙈 다시 보이기' : '👁 비주얼 끄기';
  b2.textContent = obj.locked ? '🔒 잠금 해제' : '🔓 이동 잠금';
  b1.classList.toggle('active', !!obj.hidden); b2.classList.toggle('active', !!obj.locked);
  txt.textContent = '현재 상태: ' + (obj.hidden ? '숨김' : '표시') + ' / ' + (obj.locked ? '잠김' : '편집 가능');
}

function patchRefresh(){
  const E=ed(); if(!E || E._v33RefreshPatched) return;
  const old = E.refresh;
  E.refresh = function(){ const r=old.apply(this, arguments); installHierarchyEvents(); installSelectedTools(); decorateHierarchy(); refreshSelectedTools(); return r; };
  E._v33RefreshPatched = true;
}

function patchRender(){
  if(window._bgeV33RenderPatched || typeof renderMap !== 'function') return;
  const prev = renderMap;
  renderMap = function(canvas){
    const st = stage();
    if(!st || !Array.isArray(st.objects)) return prev(canvas);
    const original = st.objects;
    st.objects = original.filter(o=>!o.hidden);
    try { return prev(canvas); }
    finally { st.objects = original; }
  };
  window._bgeV33RenderPatched = true;
}

function patchCollisionAndInteract(){
  if(!window._bgeV33CollisionPatched && typeof _collidesAt === 'function'){
    const old = _collidesAt;
    _collidesAt = function(nx,ny){
      const st=stage(); if(!st || !Array.isArray(st.objects)) return old(nx,ny);
      const original=st.objects; st.objects=original.filter(o=>!o.hidden);
      try { return old(nx,ny); } finally { st.objects=original; }
    };
    window._bgeV33CollisionPatched = true;
  }
  if(!window._bgeV33NearStorePatched && typeof getNearStore === 'function'){
    getNearStore = function(){
      const st=stage(); if(!st) return null;
      const stores=(st.objects||[]).filter(o=>!o.hidden && o.interactable==='shop');
      for(const store of stores){ const left=store.rx-.05,right=store.rx+store.rw+.05,bottom=store.ry+store.rh,dy=heroY-bottom; if(heroX>=left&&heroX<=right&&dy>=-.02&&dy<.20) return store; }
      return null;
    };
    window._bgeV33NearStorePatched = true;
  }
  if(!window._bgeV33NearQuestPatched && typeof getNearQuest === 'function'){
    getNearQuest = function(){
      const st=stage(); if(!st) return null;
      const halls=(st.objects||[]).filter(o=>!o.hidden && o.interactable==='quest');
      for(const h of halls){ const left=h.rx-.05,right=h.rx+h.rw+.05,bottom=h.ry+h.rh,dy=heroY-bottom; if(heroX>=left&&heroX<=right&&dy>=-.02&&dy<.20) return h; }
      return null;
    };
    window._bgeV33NearQuestPatched = true;
  }
  if(!window._bgeV33NearStairPatched && typeof getNearStair === 'function'){
    getNearStair = function(){
      const st=stage(); if(!st || !st.interior) return null;
      for(const o of (st.objects||[])){ if(o.hidden || o.type!=='stair') continue; const cx=o.rx+o.rw/2; if(Math.abs(heroX-cx)<o.rw*.6+.05&&heroY>o.ry-.04&&heroY<o.ry+o.rh+.12) return o; }
      return null;
    };
    window._bgeV33NearStairPatched = true;
  }
}

function installCanvasGuard(){
  const c=$('game-canvas'); if(!c || c._v33Guard) return; c._v33Guard=true;
  document.addEventListener('mousedown', e=>{
    const s=state(); if(!s || !s.enabled || e.target!==c) return;
    // (v240l) 선택 오브젝트의 리사이즈 핸들 클릭이면 잠금 가드를 건너뛴다 —
    //  커진 사각형의 코너가 잠긴 벽 위에 겹치면 이 가드가 리사이즈까지 차단하던 문제.
    try { if (window.__bgeV34HandleAt && window.__bgeV34HandleAt(e.clientX, e.clientY)) return; } catch (err) { }
    const p=screenToMap(e.clientX,e.clientY);
    const top=topObjectAt(p.x,p.y);
    const sel=selected();
    if((top && (top.obj.hidden || top.obj.locked)) || (sel && sel.locked && contains(sel,p.x,p.y))){
      e.preventDefault(); e.stopImmediatePropagation();
      if(top && top.obj.locked) toast('잠긴 오브젝트입니다. 배치 목록의 🔒를 눌러 해제하세요.');
      if(top && top.obj.hidden) toast('숨김 오브젝트입니다. 배치 목록의 🙈를 눌러 다시 보이게 하세요.');
    }
  }, true);
}

function ensureDefaults(){
  Object.values(STAGES||{}).forEach(st=>{
    (st.objects||[]).forEach(o=>{
      if(o.hidden === undefined) o.hidden = false;
      if(o.locked === undefined) o.locked = false;
    });
  });
}

/* (v368) 편집기가 꺼진 게시 모드에서는 매 프레임(RAF) 대신 250ms 폴링 — 계측상 매 프레임 DOM 조회가 순수 낭비였다 */
function poll(){ decorateHierarchy(); refreshSelectedTools(); var on = !!(ed() && ed().state && ed().state.enabled); if (on) requestAnimationFrame(poll); else setTimeout(poll, 250); }
function init(){
  if(!ed() || typeof STAGES === 'undefined' || !$('game-canvas')) return setTimeout(init,150);
  ensureDefaults(); patchRefresh(); patchRender(); patchCollisionAndInteract(); installHierarchyEvents(); installSelectedTools(); installCanvasGuard();
  if(ed()) ed().refresh();
  poll();
  window[PATCH_NAME] = { version:'3.3', refresh:()=>{ ensureDefaults(); if(ed()) ed().refresh(); } };
  toast('v3.3 디버그 패치 로드: 눈/잠금 기능 활성화');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
