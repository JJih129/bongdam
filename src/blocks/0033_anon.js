
(function(){
'use strict';
if (window.BongdamEditorV34) return;
const $ = id => document.getElementById(id);
const MIN_SIZE = 0.006;
const HANDLE_HIT = 30; // 기존보다 넓게 잡아 유니티처럼 핸들이 쉽게 잡히게 함
const PATCH_NAME = 'BongdamEditorV34';
const v34 = { resizing:false, handle:'', start:null, lastCursor:'' };

function ed(){ return window.BongdamEditor || null; }
function state(){ return ed() ? ed().state : null; }
function canvas(){ return $('game-canvas'); }
function stage(){ return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; }
function objects(){ const s=stage(); return s && Array.isArray(s.objects) ? s.objects : []; }
function selected(){ const s=state(), list=objects(); return s && s.selectedIndex>=0 && s.selectedIndex<list.length ? list[s.selectedIndex] : null; }
function clamp(v,a,b){ v=Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a; }
function clamp01(v){ return clamp(v,0,1); }
function hasCollider(o){ return o && o.cx!==undefined && o.cy!==undefined && o.cw!==undefined && o.ch!==undefined; }
function rectOf(o){ return { x:Number(o.rx||0), y:Number(o.ry||0), w:Number(o.rw||0.08), h:Number(o.rh||0.08) }; }
function viewportW(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=state(); return fixed ? fixed.w : (s && s.enabled ? 1 / s.editorZoom : (typeof VIEWPORT_W !== 'undefined' ? VIEWPORT_W : 1)); }
function viewportH(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=state(); return fixed ? fixed.h : (s && s.enabled ? 1 / s.editorZoom : (typeof VIEWPORT_H !== 'undefined' ? VIEWPORT_H : 1)); }
function toast(msg){ const t=$('bge-toast'); if(!t){ console.log(msg); return; } t.textContent=msg; t.style.display='block'; t.classList.add('bge-v34-toast'); clearTimeout(toast._t); toast._t=setTimeout(()=>{ t.style.display='none'; t.classList.remove('bge-v34-toast'); }, 1500); }

function mapToCanvas(mx,my){
  const c=canvas(); if(!c) return {x:0,y:0};
  const bw=(typeof BASE_W !== 'undefined' ? BASE_W : c.width);
  const bh=(typeof BASE_H !== 'undefined' ? BASE_H : c.height);
  const scale=(typeof currentScale !== 'undefined' ? currentScale : 1);
  const baseX=((mx-camX)/viewportW()+0.5)*bw;
  const baseY=((my-camY)/viewportH()+0.5)*bh;
  return { x:(baseX-bw/2)*scale+c.width/2, y:(baseY-bh/2)*scale+c.height/2 };
}
function canvasToMap(clientX,clientY){
  const c=canvas(); if(!c) return {x:0,y:0,sx:0,sy:0};
  const r=c.getBoundingClientRect();
  const sx=(clientX-r.left)*(c.width/r.width), sy=(clientY-r.top)*(c.height/r.height);
  const bw=(typeof BASE_W !== 'undefined' ? BASE_W : c.width);
  const bh=(typeof BASE_H !== 'undefined' ? BASE_H : c.height);
  const scale=(typeof currentScale !== 'undefined' ? currentScale : 1);
  const bx=(sx-c.width/2)/scale+bw/2;
  const by=(sy-c.height/2)/scale+bh/2;
  return { x:clamp01((bx/bw-0.5)*viewportW()+camX), y:clamp01((by/bh-0.5)*viewportH()+camY), sx, sy };
}
function handlePoints(r){
  const x1=r.x, y1=r.y, x2=r.x+r.w, y2=r.y+r.h, cx=r.x+r.w/2, cy=r.y+r.h/2;
  return [['nw',x1,y1],['n',cx,y1],['ne',x2,y1],['e',x2,cy],['se',x2,y2],['s',cx,y2],['sw',x1,y2],['w',x1,cy]];
}
function cursorForHandle(h){
  if(h==='n'||h==='s') return 'ns-resize';
  if(h==='e'||h==='w') return 'ew-resize';
  if(h==='nw'||h==='se') return 'nwse-resize';
  return 'nesw-resize';
}
function hitHandle(clientX,clientY){
  const s=state(), o=selected();
  if(!s || !s.enabled || !o || o.hidden || o.locked) return '';
  // (v240l) 콜라이더 선택 중이면 콜라이더 사각형의 핸들을 잡는다 (콜라이더 크기 조절 지원)
  const _useCol = (s.selectedPart==='collider' && hasCollider(o));
  const p=canvasToMap(clientX,clientY);
  const r=_useCol ? { x:Number(o.cx), y:Number(o.cy), w:Number(o.cw), h:Number(o.ch) } : rectOf(o);
  // (v246) 유니티식 적응형 핸들 — 예전 '본체 안쪽(+2px)=무조건 이동' 규칙은
  //  모서리를 1~2px 안쪽으로 찍어도 이동으로 새서 '잡았는데 풀리는' 원인이었다.
  //  핸들 유효 반경을 오브젝트 크기에 맞춰: 반경 안(안쪽 포함)=리사이즈, 중앙부=이동.
  const _cv=canvas(); const _rc=_cv.getBoundingClientRect();
  const _k=(_rc.width && _cv.width)? (_rc.width/_cv.width) : 1;
  const _c1=mapToCanvas(r.x,r.y), _c2=mapToCanvas(r.x+r.w,r.y+r.h);
  const _wpx=Math.abs(_c2.x-_c1.x)*_k, _hpx=Math.abs(_c2.y-_c1.y)*_k;
  const _rEff=Math.max(6, Math.min(HANDLE_HIT, Math.min(_wpx,_hpx)/2 - 4));
  let best='', bestDist=Infinity;
  for(const h of handlePoints(r)){
    const hp=mapToCanvas(h[1],h[2]);
    const d=Math.hypot(p.sx-hp.x, p.sy-hp.y)*_k;
    if(d<=_rEff && d<bestDist){ best=h[0]; bestDist=d; }
  }
  return best;
}
window.__bgeV34HandleAt = hitHandle;   // (v240l) v5.2가 핸들 클릭을 양보할 때 사용
function syncInspector(o){
  if(!o) return;
  ['rx','ry','rw','rh','cx','cy','cw','ch'].forEach(k=>{ const el=$('bge-obj-'+k); if(el && o[k]!==undefined) el.value=Number(o[k]).toFixed(3); });
}
function setRect(o,r){
  o.rx=clamp01(r.x); o.ry=clamp01(r.y);
  o.rw=clamp(r.w,MIN_SIZE,1); o.rh=clamp(r.h,MIN_SIZE,1);
}
function startResize(handle,e){
  const s=state(), o=selected();
  if(!s || !o) return;
  if(o.locked){ toast('잠긴 오브젝트입니다. 🔒를 눌러 해제하세요.'); return; }
  const m=canvasToMap(e.clientX,e.clientY);
  v34.resizing=true; v34.handle=handle;
  const _part=(s.selectedPart==='collider' && hasCollider(o)) ? 'collider' : 'object';
  v34.start={ mouse:m,
    rect:(_part==='collider') ? { x:+o.cx, y:+o.cy, w:+o.cw, h:+o.ch } : rectOf(o),
    part:_part,
    collider:hasCollider(o)?{cx:+o.cx,cy:+o.cy,cw:+o.cw,ch:+o.ch}:null, selectedIndex:s.selectedIndex };
  // 기존 v2/v31/v32 드래그 상태를 강제로 끊어서 선택 해제/이동이 끼어들지 않게 한다.
  s.dragging=false; s.dragMode=null; s.selectedPart='object';
  const c=canvas(); if(c) c.style.cursor=cursorForHandle(handle);
  toast('크기 조절 시작: 핸들을 드래그하세요.');
}
function updateResize(e){
  if(!v34.resizing || !v34.start) return;
  const s=state(); if(!s) return;
  // 리사이즈 중에는 선택 오브젝트가 바뀌면 안 되므로 시작 시점 index를 유지한다.
  s.selectedIndex=v34.start.selectedIndex;
  s.selectedPart=v34.start.part||'object';
  const o=selected(); if(!o || o.locked) return;
  const p=canvasToMap(e.clientX,e.clientY), st=v34.start, r=st.rect;
  const dx=p.x-st.mouse.x, dy=p.y-st.mouse.y;
  let x=r.x, y=r.y, w=r.w, h=r.h;
  const hd=v34.handle;
  if(hd.includes('e')) w=r.w+dx;
  if(hd.includes('s')) h=r.h+dy;
  if(hd.includes('w')){ x=r.x+dx; w=r.w-dx; }
  if(hd.includes('n')){ y=r.y+dy; h=r.h-dy; }
  if(w<MIN_SIZE){ if(hd.includes('w')) x=r.x+r.w-MIN_SIZE; w=MIN_SIZE; }
  if(h<MIN_SIZE){ if(hd.includes('n')) y=r.y+r.h-MIN_SIZE; h=MIN_SIZE; }
  x=clamp(x,0,1-MIN_SIZE); y=clamp(y,0,1-MIN_SIZE);
  w=Math.min(w,1-x); h=Math.min(h,1-y);
  if(st.part==='collider'){
    // 콜라이더만 조절 — 본체는 그대로
    o.cx=clamp01(x); o.cy=clamp01(y);
    o.cw=clamp(w,MIN_SIZE,1); o.ch=clamp(h,MIN_SIZE,1);
    syncInspector(o);
    if(ed()) ed().refresh();
    return;
  }
  setRect(o,{x,y,w,h});
  if(hasCollider(o) && st.collider){
    const relX=(st.collider.cx-r.x)/Math.max(r.w,MIN_SIZE);
    const relY=(st.collider.cy-r.y)/Math.max(r.h,MIN_SIZE);
    const relW=st.collider.cw/Math.max(r.w,MIN_SIZE);
    const relH=st.collider.ch/Math.max(r.h,MIN_SIZE);
    o.cx=clamp01(o.rx+o.rw*relX);
    o.cy=clamp01(o.ry+o.rh*relY);
    o.cw=clamp(o.rw*relW,MIN_SIZE,1);
    o.ch=clamp(o.rh*relH,MIN_SIZE,1);
  }
  syncInspector(o);
  if(ed()) ed().refresh();
}
function endResize(){
  if(!v34.resizing) return;
  v34.resizing=false; v34.handle=''; v34.start=null;
  const c=canvas(); if(c) c.style.cursor='';
  if(ed()){ ed().save(false); ed().refresh(); }
  toast('크기 조절 완료 / 자동 저장됨');
}
function hardStop(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
function bind(){
  if(document._bgeV34Bound) return; document._bgeV34Bound=true;
  // document capture: 기존 canvas capture보다 먼저 실행된다. 핸들 입력을 최우선으로 먹는다.
  document.addEventListener('mousedown', e=>{
    const c=canvas(), s=state();
    if(!c || !s || !s.enabled || e.target!==c || e.button!==0) return;
    const h=hitHandle(e.clientX,e.clientY);
    if(h){ hardStop(e); startResize(h,e); }
  }, true);
  document.addEventListener('mousemove', e=>{
    const c=canvas(), s=state();
    if(!c || !s || !s.enabled) return;
    if(v34.resizing){ hardStop(e); updateResize(e); return; }
    if(e.target===c){
      const h=hitHandle(e.clientX,e.clientY);
      const cur=h?cursorForHandle(h):'';
      if(v34.lastCursor!==cur){ c.style.cursor=cur; v34.lastCursor=cur; }
    }
  }, true);
  window.addEventListener('mouseup', e=>{ if(v34.resizing){ hardStop(e); endResize(); } }, true);
  window.addEventListener('blur', endResize, true);
}
function init(){
  if(!ed() || !canvas() || typeof STAGES==='undefined') return setTimeout(init,150);
  bind();
  window[PATCH_NAME]={version:'3.4', refresh:()=>{ if(ed()) ed().refresh(); }};
  toast('v3.4 리사이즈 입력 패치 로드: 핸들 클릭 우선 처리 활성화');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
