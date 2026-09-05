
/* v4.0 안정화 패치: 이미지 업로드/선택목록/적용을 기존 패치와 분리해서 강제 동작 */
(function(){
  if (window.BongdamKidEditorV40Loaded) return;
  window.BongdamKidEditorV40Loaded = true;
  'use strict';
  const KEY = 'bongdam_rpg_kid_assets_v40';
  const PROJECT_KEY = 'bongdam_rpg_editor_project_v5_2_quest';
  const $ = (id)=>document.getElementById(id);
  const esc = (s)=>String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isImgFile = (f)=> !!f && ((f.type||'').startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name||''));
  const msg = (t)=>{ const el=$('bge-v40-status'); if(el) el.textContent=t; console.log('[봉담 v4]',t); };
  const toast = (t)=>{ msg(t); try{ if(typeof window.toast==='function') window.toast(t); }catch(e){} };
  const uid = (p)=> p + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  const clamp01=(v)=>Math.max(0,Math.min(1,Number(v)||0));
  const dataUrlOf=(a)=>a && (a.dataUrl || a.data || a.url || '');
  const state={ assets:[], cache:new Map(), renderPatched:false, lastFileSig:'', placeMode:false, lastSelected:-999 };

  function editor(){ return window.BongdamEditor || null; }
  function edState(){ return editor() ? editor().state : null; }
  function canvas(){ return $('game-canvas') || document.querySelector('canvas'); }
  function stage(){ return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; }
  function objects(){ const s=stage(); return s && Array.isArray(s.objects) ? s.objects : []; }
  function selectedObject(){ const s=edState(), arr=objects(); const i=s ? Number(s.selectedIndex) : -1; return Number.isInteger(i) && i>=0 && i<arr.length ? arr[i] : null; }

  function loadAssets(){
    const map = new Map();
    function add(a){ if(!a) return; const id=a.id||uid('asset'); const src=dataUrlOf(a); if(!src) return; map.set(id,{ id, name:a.name||a.fileName||id, type:'image', sourceType:a.sourceType||'embedded', dataUrl:src, width:a.width||0, height:a.height||0, createdAt:a.createdAt||Date.now() }); }
    try{ JSON.parse(localStorage.getItem(KEY)||'[]').forEach(add); }catch(e){}
    try{ JSON.parse(localStorage.getItem('bongdam_rpg_editor_assets_v3_9')||'[]').forEach(add); }catch(e){}
    try{ JSON.parse(localStorage.getItem('bongdam_rpg_editor_assets_v3_7')||'[]').forEach(add); }catch(e){}
    try{ const api=window.BongdamKidEditorV39; if(api && Array.isArray(api.assets)) api.assets.forEach(add); }catch(e){}
    state.assets = Array.from(map.values());
  }
  function saveAssets(){
    try{ localStorage.setItem(KEY, JSON.stringify(state.assets)); }catch(e){ alert('브라우저 저장 공간이 부족합니다. 작업 파일 내보내기로 백업하세요.'); }
    try{ localStorage.setItem('bongdam_rpg_editor_assets_v3_9', JSON.stringify(state.assets)); }catch(e){}
    try{ const api=window.BongdamKidEditorV39; if(api && Array.isArray(api.assets)){ api.assets.length=0; state.assets.forEach(a=>api.assets.push(a)); } }catch(e){}
    updateDebug();
  }
  function getAsset(id){ return state.assets.find(a=>a.id===id) || null; }
  function getObjectAssetId(o){ if(!o) return ''; if(o.assetId) return o.assetId; if(o.kidAssetId) return o.kidAssetId; const k=String(o.key||''); return k.startsWith('asset:') ? k.slice(6) : ''; }
  function setObjectAsset(o,id){ if(!o) return; if(id){ o.assetId=id; o.kidAssetId=id; o.key='asset:'+id; o.customImage=true; } else { delete o.assetId; delete o.kidAssetId; delete o.customImage; if(String(o.key||'').startsWith('asset:')) o.key=''; } }
  function getImage(id){ const a=getAsset(id); const src=dataUrlOf(a); if(!src) return null; const ck=id+'|'+src.length; if(state.cache.has(ck)) return state.cache.get(ck); const im=new Image(); im.onload=()=>{ if(a){a.width=im.naturalWidth;a.height=im.naturalHeight;} refreshSelects(); forceRender(); }; im.onerror=()=>msg('이미지 로드 실패: '+(a&&a.name||id)); im.src=src; state.cache.set(ck,im); return im; }

  function ensurePanel(){
    let root=$('bge-panel');
    if(!root){ root=document.createElement('div'); root.id='bge-panel'; root.style.cssText='position:fixed;right:18px;top:92px;width:360px;max-height:82vh;overflow:auto;z-index:9999;background:rgba(18,10,2,.92);border:1px solid #c8902a;border-radius:12px;padding:12px;color:#f3d58b'; document.body.appendChild(root); }
    let panel=$('bge-v40-panel');
    if(!panel){
      panel=document.createElement('div'); panel.id='bge-v40-panel'; panel.style.cssText='border:2px solid #64d8ff;border-radius:12px;padding:12px;margin-bottom:14px;background:rgba(0,20,32,.92);color:#e9f8ff';
      panel.innerHTML=`
        <h4 style="margin:0 0 8px;color:#fff1a6">그림 자료함 / 이미지 적용 v4.0</h4>
        <div style="font-size:12px;line-height:1.45;background:rgba(255,255,255,.08);border-radius:8px;padding:8px;margin-bottom:8px">외부 폴더는 필요 없습니다. 이미지를 고르면 아래 목록에 바로 생깁니다. 목록에 생긴 이미지를 선택한 뒤 배치물에 적용하세요.</div>
        <label style="display:block;margin-top:8px;color:#d8f3ff">이미지 업로드</label>
        <input id="bge-v40-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif" multiple style="width:100%;padding:8px;border:1px solid #91dfff;border-radius:8px;background:#06131d;color:white">
        <div id="bge-v40-current" style="font-size:12px;background:rgba(0,0,0,.35);border-radius:8px;padding:8px;margin:8px 0">배치물을 선택하면 현재 이미지 상태가 표시됩니다.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label style="font-size:12px;color:#d8f3ff">적용할 이미지</label><select id="bge-v40-apply" style="width:100%;padding:8px;background:#06131d;color:white;border:1px solid #91dfff;border-radius:8px"><option value="">이미지 선택</option></select></div>
          <div><label style="font-size:12px;color:#d8f3ff">새로 만들 이미지</label><select id="bge-v40-place-select" style="width:100%;padding:8px;background:#06131d;color:white;border:1px solid #91dfff;border-radius:8px"><option value="">이미지 선택</option></select></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <button id="bge-v40-apply-btn" type="button">배치물에 적용</button><button id="bge-v40-place-btn" type="button">새 배치물 만들기</button>
          <button id="bge-v40-clear-btn" type="button">이미지 해제</button><button id="bge-v40-delete-btn" type="button">선택 이미지 삭제</button>
          <button id="bge-v40-export" type="button">작업 파일 내보내기</button><button id="bge-v40-import-btn" type="button">작업 파일 가져오기</button>
          <input id="bge-v40-import" type="file" accept="application/json,.json" style="display:none">
        </div>
        <div id="bge-v40-status" style="font-size:12px;color:#a7ffb7;margin-top:8px">준비 완료</div>`;
      root.insertBefore(panel, root.firstChild);
    }
    // 버튼 스타일 보정
    panel.querySelectorAll('button').forEach(b=>{ b.style.cssText='padding:8px;border:1px solid #c8902a;border-radius:8px;background:#2b1700;color:#ffe28a;font-weight:700;cursor:pointer'; });
    refreshPanelVisibility();
  }
  function refreshPanelVisibility(){ const p=$('bge-v40-panel'); const s=edState(); if(p) p.style.display = (!s || s.enabled) ? 'block' : 'none'; }

  function refreshSelects(){
    loadAssets();
    ['bge-v40-apply','bge-v40-place-select','bge-kid-apply-select','bge-kid-place-select','bge-v37-asset','bge-v37-place-asset'].forEach(id=>{
      const sel=$(id); if(!sel) return; const prev=sel.value; sel.innerHTML='<option value="">이미지 선택</option>';
      state.assets.forEach(a=>{ const op=document.createElement('option'); op.value=a.id; op.textContent=(a.name||a.id)+(a.width&&a.height?` (${a.width}x${a.height})`:''); sel.appendChild(op); });
      if(prev && getAsset(prev)) sel.value=prev;
    });
    refreshCurrent(); updateDebug();
  }
  function refreshCurrent(){
    const el=$('bge-v40-current'); if(!el) return; const o=selectedObject(); const sel=$('bge-v40-apply');
    if(!o){ el.innerHTML='배치물을 선택하면 현재 이미지 상태가 표시됩니다.'; if(sel) sel.value=''; return; }
    const id=getObjectAssetId(o), a=getAsset(id); if(sel) sel.value=id||'';
    if(a) el.innerHTML=`<div style="display:flex;gap:8px;align-items:center"><img src="${esc(dataUrlOf(a))}" style="width:54px;height:54px;object-fit:contain;border:1px solid #91dfff;border-radius:6px"><div><b>선택 배치물:</b> ${esc(o.label||o.name||o.id||'이름 없음')}<br><b>현재 이미지:</b> ${esc(a.name)}<br><b>저장 키:</b> ${esc(o.key||'')}</div></div>`;
    else el.innerHTML=`<b>선택 배치물:</b> ${esc(o.label||o.name||o.id||'이름 없음')}<br><b>현재 이미지:</b> ${esc(o.key||'기본 이미지 또는 없음')}<br>업로드한 이미지를 적용할 수 있습니다.`;
  }
  function updateDebug(){ const n=state.assets.length; ['debugAssetCount'].forEach(id=>{const e=$(id); if(e)e.textContent=String(n);}); }

  function importFiles(files){
    const list=Array.from(files||[]).filter(isImgFile);
    if(!list.length){ alert('PNG, JPG, WEBP 같은 이미지 파일을 선택하세요.'); return; }
    msg('이미지 읽는 중... '+list.length+'개');
    let done=0, added=0;
    list.forEach(file=>{
      const r=new FileReader();
      r.onload=()=>{
        const dataUrl=String(r.result||''); const im=new Image();
        im.onload=()=>{ const asset={id:uid('asset'),name:file.name||'이미지',type:'image',sourceType:'embedded',dataUrl,width:im.naturalWidth||0,height:im.naturalHeight||0,createdAt:Date.now()}; state.assets.push(asset); state.cache.set(asset.id+'|'+dataUrl.length,im); added++; finish(); };
        im.onerror=()=>{ const asset={id:uid('asset'),name:file.name||'이미지',type:'image',sourceType:'embedded',dataUrl,width:0,height:0,createdAt:Date.now()}; state.assets.push(asset); added++; finish(); };
        im.src=dataUrl;
      };
      r.onerror=()=>finish();
      r.readAsDataURL(file);
    });
    function finish(){ done++; if(done===list.length){ saveAssets(); refreshSelects(); forceRender(); toast('이미지 '+added+'개 등록 완료'); const up=$('bge-v40-upload'); if(up) up.value=''; const up2=$('bge-kid-upload'); if(up2) up2.value=''; } }
  }

  function saveEditor(){ try{ if(editor()){ editor().save(false); editor().refresh(); } }catch(e){ console.warn(e); } }
  function forceRender(){ try{ if(editor()) editor().refresh(); if(typeof gameLoop==='function') gameLoop(); }catch(e){} }
  function applyAsset(){ const o=selectedObject(); if(!o){ alert('먼저 맵이나 배치 목록에서 배치물을 선택하세요.'); return; } if(o.locked){ alert('잠긴 배치물은 수정할 수 없습니다. 잠금을 풀어주세요.'); return; } const id=($('bge-v40-apply')||{}).value || ($('bge-kid-apply-select')||{}).value || ''; if(!id||!getAsset(id)){ alert('적용할 이미지를 선택하세요.'); return; } setObjectAsset(o,id); const key=$('bge-obj-key'); if(key) key.value=o.key; saveEditor(); refreshCurrent(); forceRender(); toast('선택한 배치물에 이미지 적용 완료'); }
  function clearAsset(){ const o=selectedObject(); if(!o){ alert('먼저 배치물을 선택하세요.'); return; } setObjectAsset(o,''); const key=$('bge-obj-key'); if(key) key.value=o.key||''; saveEditor(); refreshCurrent(); forceRender(); toast('이미지 연결 해제 완료'); }
  function deleteAsset(){ const id=($('bge-v40-apply')||{}).value||''; const a=getAsset(id); if(!a){ alert('삭제할 이미지를 선택하세요.'); return; } if(!confirm('선택한 이미지를 삭제할까요?\n'+a.name)) return; state.assets=state.assets.filter(x=>x.id!==id); objects().forEach(o=>{ if(getObjectAssetId(o)===id) setObjectAsset(o,''); }); state.cache.clear(); saveAssets(); saveEditor(); refreshSelects(); forceRender(); }
  function createObjectAt(x,y){ const id=($('bge-v40-place-select')||{}).value||''; const a=getAsset(id); const st=stage(); if(!a){ alert('새 배치물로 만들 이미지를 선택하세요.'); return; } if(!st){ alert('현재 맵을 찾을 수 없습니다.'); return; } if(!Array.isArray(st.objects)) st.objects=[]; const o={_editorId:uid('obj'),id:uid('obj'),label:a.name||'새 배치물',type:'decoration',key:'asset:'+id,assetId:id,kidAssetId:id,customImage:true,visible:true,locked:false,rx:clamp01(x-.06),ry:clamp01(y-.06),rw:.12,rh:.12,cx:clamp01(x-.05),cy:clamp01(y+.02),cw:.10,ch:.04,interactable:'',dialogue:{speaker:'',text:'',portraitAssetId:'',style:'visual_novel'},quest:{id:'',title:'',memo:''}}; st.objects.push(o); const s=edState(); if(s){s.selectedIndex=st.objects.length-1;s.selectedPart='object';s.tool='select';} saveEditor(); refreshSelects(); forceRender(); toast('이미지를 새 배치물로 만들었습니다.'); }

  function viewportW(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=edState(); return fixed?fixed.w:(s&&s.enabled&&s.editorZoom?1/s.editorZoom:(typeof VIEWPORT_W!=='undefined'?VIEWPORT_W:1)); }
  function viewportH(){ const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); const s=edState(); return fixed?fixed.h:(s&&s.enabled&&s.editorZoom?1/s.editorZoom:(typeof VIEWPORT_H!=='undefined'?VIEWPORT_H:1)); }
  function mapToCanvas(mx,my){ const c=canvas(); if(!c)return{x:0,y:0}; const bw=(typeof BASE_W!=='undefined'?BASE_W:1920), bh=(typeof BASE_H!=='undefined'?BASE_H:1080), sc=(typeof currentScale!=='undefined'?currentScale:1); const cx=(typeof camX!=='undefined'?camX:.5), cy=(typeof camY!=='undefined'?camY:.5); const bx=((mx-cx)/viewportW()+.5)*bw, by=((my-cy)/viewportH()+.5)*bh; return {x:(bx-bw/2)*sc+c.width/2,y:(by-bh/2)*sc+c.height/2}; }
  function canvasToMap(clientX,clientY){ const c=canvas(); if(!c)return{x:.5,y:.5}; const r=c.getBoundingClientRect(); const sx=(clientX-r.left)*(c.width/r.width), sy=(clientY-r.top)*(c.height/r.height); const bw=(typeof BASE_W!=='undefined'?BASE_W:1920), bh=(typeof BASE_H!=='undefined'?BASE_H:1080), sc=(typeof currentScale!=='undefined'?currentScale:1); const bx=(sx-c.width/2)/sc+bw/2, by=(sy-c.height/2)/sc+bh/2; const cx=(typeof camX!=='undefined'?camX:.5), cy=(typeof camY!=='undefined'?camY:.5); return {x:clamp01((bx/bw-.5)*viewportW()+cx),y:clamp01((by/bh-.5)*viewportH()+cy)}; }
  function drawOverlay(ctx){ if(!ctx)return; objects().forEach(o=>{ if(o.visible===false||o.hidden===true)return; const id=getObjectAssetId(o); if(!id)return; const im=getImage(id); if(!im||!im.complete||im.naturalWidth<=0)return; const x=Number(o.rx||0), y=Number(o.ry||0), w=Number(o.rw||.1), h=Number(o.rh||.1); const p1=mapToCanvas(x,y), p2=mapToCanvas(x+w,y+h); ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(im,p1.x,p1.y,p2.x-p1.x,p2.y-p1.y); ctx.restore(); }); }
  function patchRender(){ if(state.renderPatched)return; if(typeof renderMap==='function'){ const old=renderMap; renderMap=function(targetCanvas){ old.apply(this,arguments); /* (v261) 이중 렌더 제거 */ }; state.renderPatched=true; } }

  function exportProject(){ const payload={version:'bongdam_project_v40',savedAt:new Date().toISOString(),stages:(typeof STAGES!=='undefined'?STAGES:{}),assets:state.assets,currentStage:(typeof currentStage!=='undefined'?currentStage:1)}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='bongdam_rpg_project_'+new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')+'.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('작업 파일 내보내기 완료'); }
  function importProject(file){ const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(String(r.result||'{}')); if(d.stages && typeof STAGES!=='undefined'){ Object.keys(STAGES).forEach(k=>delete STAGES[k]); Object.keys(d.stages).forEach(k=>STAGES[k]=d.stages[k]); } if(Array.isArray(d.assets)){ const m=new Map(state.assets.map(a=>[a.id,a])); d.assets.forEach(a=>{ if(a&&dataUrlOf(a)) m.set(a.id||uid('asset'),a); }); state.assets=Array.from(m.values()); } saveAssets(); saveEditor(); refreshSelects(); forceRender(); alert('작업 파일 가져오기 완료'); }catch(e){ alert('작업 파일 가져오기 실패: '+e.message); } }; r.readAsText(file,'utf-8'); }

  function bind(){
    ensurePanel();
    document.addEventListener('change',function(e){ const t=e.target; if(!t||t.tagName!=='INPUT'||t.type!=='file')return; if(t.id==='bge-myart-file')return; if(t.id==='bge-v40-upload'||t.id==='bge-kid-upload'||t.id==='bge-v37-files'||/image\//.test(t.accept||'')){ if(t.files&&t.files.length){ importFiles(t.files); e.stopPropagation(); } } }, true);
    const b=(id,fn)=>{ const el=$(id); if(el&&!el._v40){el._v40=true; el.addEventListener('click',fn);} };
    const ch=(id,fn)=>{ const el=$(id); if(el&&!el._v40){el._v40=true; el.addEventListener('change',fn);} };
    ch('bge-v40-apply',()=>{ refreshCurrent(); if(selectedObject() && $('bge-v40-apply').value) applyAsset(); });
    b('bge-v40-apply-btn',applyAsset); b('bge-v40-clear-btn',clearAsset); b('bge-v40-delete-btn',deleteAsset);
    b('bge-v40-place-btn',()=>{ state.placeMode=!state.placeMode; const el=$('bge-v40-place-btn'); if(el)el.textContent=state.placeMode?'배치 모드 끄기':'새 배치물 만들기'; toast(state.placeMode?'맵을 클릭하면 이미지가 새 배치물로 만들어집니다.':'배치 모드 종료'); });
    b('bge-v40-export',exportProject); b('bge-v40-import-btn',()=>{const i=$('bge-v40-import'); if(i)i.click();});
    ch('bge-v40-import',function(){const f=this.files&&this.files[0]; if(f)importProject(f); this.value='';});
    const c=canvas(); if(c&&!c._v40){ c._v40=true; c.addEventListener('mousedown',function(e){ const s=edState(); if(!s||!s.enabled||!state.placeMode||e.button!==0)return; e.preventDefault(); e.stopImmediatePropagation(); const p=canvasToMap(e.clientX,e.clientY); createObjectAt(p.x,p.y); state.placeMode=false; const el=$('bge-v40-place-btn'); if(el)el.textContent='새 배치물 만들기'; },true); }
  }
  function poll(){
    refreshPanelVisibility(); const s=edState(); const idx=s?s.selectedIndex:-1; if(idx!==state.lastSelected){state.lastSelected=idx;refreshCurrent();}
    // 파일 선택 이벤트가 브라우저/기존 패치와 충돌해도 자동으로 감지해서 가져오기
    ['bge-v40-upload','bge-kid-upload','bge-v37-files'].forEach(id=>{ const input=$(id); if(input && input.files && input.files.length){ const sig=id+':' + Array.from(input.files).map(f=>f.name+':'+f.size+':'+f.lastModified).join('|'); if(sig && sig!==state.lastFileSig){ state.lastFileSig=sig; importFiles(input.files); } } });
    requestAnimationFrame(poll);
  }
  function init(){
    if(!editor() || !canvas() || typeof STAGES==='undefined'){ setTimeout(init,100); return; }
    ensurePanel(); loadAssets(); refreshSelects(); bind(); patchRender(); forceRender();
    window.BongdamKidEditorV40={assets:state.assets,refresh:()=>{loadAssets();refreshSelects();forceRender();},importFiles,exportProject};
    toast('v4.0 이미지 업로드 안정화 패치 로드 완료'); poll();
  }
  /* (v268) 구세대 모듈 부트 차단 — v4.0 (v5.2 에디터로 일원화) */
})();
