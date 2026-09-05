
(function(){
  'use strict';
  const VERSION = 'v4.3';
  const ASSET_KEY = 'bongdam_rpg_assets_v42';
  const PROJECT_KEY = 'bongdam_rpg_editor_project_v5_2_quest';
  const SETTINGS_KEY = 'bongdam_rpg_image_settings_v5_2_quest';
  const OLD_ASSET_KEYS = ['bongdam_rpg_assets_v41','bongdam_rpg_assets_v40','bge_asset_library_v37','bongdam_rpg_assets_v39','bongdam_rpg_assets_v35'];
  const $ = id => document.getElementById(id);
  const imageCache = new Map();
  let assets = {};
  let settings = { builtinOverrides:{}, builtinHidden:{} };

  function log(msg, data){
    console.log('[BongdamImage '+VERSION+'] '+msg, data||'');
    const el=$('bge-v43-status'); if(el) el.textContent=msg;
    const cnt=$('bge-v43-count'); if(cnt) cnt.textContent=String(Object.keys(assets).length);
  }
  function toast(msg){ log(msg); const t=$('bge-toast'); if(t){ t.textContent=msg; t.style.display='block'; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.display='none',1800); } }
  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function makeId(prefix='img'){ return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7); }
  function stageObj(){ try { return STAGES[currentStage]; } catch(e){ return null; } }
  function objects(){ const st=stageObj(); return st && Array.isArray(st.objects) ? st.objects : []; }
  function allObjects(){
    const out=[];
    try{ Object.values(STAGES||{}).forEach(st=>{ if(st&&Array.isArray(st.objects)) st.objects.forEach(o=>out.push(o)); }); }catch(e){}
    return out;
  }
  function getSelectedIndex(){
    const s = (typeof window.__bgeEditorState==='function') ? window.__bgeEditorState() : null;
    if(s && Number.isInteger(s.selectedIndex) && s.selectedIndex>=0 && s.selectedIndex<objects().length) return s.selectedIndex;
    const active = document.querySelector('#bge-object-list .bge-object-item.active');
    if(active){
      let text = active.textContent || '';
      if(active.classList.contains('bge-child') && active.previousElementSibling) text = active.previousElementSibling.textContent || '';
      const m = text.match(/(\d+)\s*\./);
      if(m){ const idx=Number(m[1])-1; if(idx>=0 && idx<objects().length) return idx; }
    }
    return -1;
  }
  function selectedObject(){ const idx=getSelectedIndex(); return idx>=0 ? objects()[idx] : null; }
  function selectedName(){ const o=selectedObject(); return o ? (o.label||o.name||o.type||o._editorId||'선택 배치물') : '선택된 배치물 없음'; }
  function assetIdOf(o){ return o ? (o.assetId || o.kidAssetId || (String(o.key||'').startsWith('asset:') ? String(o.key).slice(6) : '')) : ''; }
  function keyOf(o){ return String(o && o.key || ''); }
  function normalizeAssetMap(raw){
    const source = raw && (raw.assets || raw);
    if(!source) return {};
    if(Array.isArray(source)){
      const map={}; source.forEach(a=>{ if(a&&a.id) map[a.id]=a; }); return map;
    }
    if(typeof source==='object') return source;
    return {};
  }
  function loadAssets(){
    assets = {};
    try{ const raw=localStorage.getItem(ASSET_KEY); if(raw) assets = normalizeAssetMap(JSON.parse(raw)); }catch(e){ console.warn('그림 자료 로드 실패', e); }
    if(!Object.keys(assets).length){
      for(const k of OLD_ASSET_KEYS){ try{ const raw=localStorage.getItem(k); if(!raw) continue; const a=normalizeAssetMap(JSON.parse(raw)); if(Object.keys(a).length){ assets=a; break; } }catch(e){} }
    }
    preloadAssets().then(refreshAll);
  }
  function loadSettings(){
    try{ const raw=localStorage.getItem(SETTINGS_KEY); if(raw) settings = Object.assign({builtinOverrides:{},builtinHidden:{}}, JSON.parse(raw)); }catch(e){}
    settings.builtinOverrides = settings.builtinOverrides || {};
    settings.builtinHidden = settings.builtinHidden || {};
  }
  function saveAssets(){
    try{ localStorage.setItem(ASSET_KEY, JSON.stringify({version:VERSION,savedAt:new Date().toISOString(),assets})); }
    catch(e){ alert('브라우저 자동 저장 공간이 부족합니다. 작업 파일 내보내기로 백업하세요.'); console.warn(e); }
  }
  function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){} }
  function saveProject(){
    try{ const data={version:VERSION,savedAt:new Date().toISOString(),assets, imageSettings:settings}   /* (v265) stages는 메인 키 전담 — 레거시 재생산 차단 */; localStorage.setItem(PROJECT_KEY, JSON.stringify(data)); }catch(e){ console.warn('작업 저장 실패', e); }
  }
  function loadProject(){
    try{
      const raw=localStorage.getItem(PROJECT_KEY); if(!raw) return;
      const data=JSON.parse(raw);
      if(data.assets) assets=normalizeAssetMap(data.assets);
      if(data.imageSettings) settings=Object.assign({builtinOverrides:{},builtinHidden:{}},data.imageSettings);
      // (v265) [진범 수정] 구형 프로젝트의 stages 자동복원 제거 —
      //  시간 비교 없이 옛 배치를 STAGES에 덮어써 '저장·게시가 안 되는 것처럼' 보이던
      //  증상의 주원인. 맵은 메인 키 하나만 사용, 이 모듈은 이미지·설정만 복원.
      // (v125) 프로젝트 복원이 옛 맵으로 덮어써도 퀘스트 위험요소는 즉시 재주입
      try { if (typeof window.BD_ensureQuestHazards === 'function') window.BD_ensureQuestHazards(); } catch(e){}
    }catch(e){ console.warn('작업 로드 실패', e); }
  }
  function preloadAssets(){
    const jobs=Object.values(assets).map(a=>new Promise(resolve=>{
      if(!a || !a.dataUrl) return resolve();
      if(imageCache.has(a.id)) return resolve();
      const img=new Image();
      img.onload=()=>{ imageCache.set(a.id,img); resolve(); };
      img.onerror=()=>{ console.warn('이미지 로딩 실패:', a.name); resolve(); };
      img.src=a.dataUrl;
    }));
    return Promise.all(jobs);
  }
  function readImageFile(file, keepId){
    return new Promise((resolve,reject)=>{
      if(!file || (!/^image\//i.test(file.type||'') && !/\.(png|jpe?g|webp|gif)$/i.test(file.name||''))) return reject(new Error('이미지 파일만 등록할 수 있습니다.'));
      const reader=new FileReader();
      reader.onload=()=>{
        const dataUrl=String(reader.result||'');
        const img=new Image();
        img.onload=()=>resolve({ id: keepId || makeId('img'), name:file.name||keepId||'새 이미지', type:'image', sourceType:'embedded', dataUrl, width:img.naturalWidth||img.width||0, height:img.naturalHeight||img.height||0, updatedAt:Date.now(), createdAt:assets[keepId]?.createdAt || Date.now() });
        img.onerror=()=>reject(new Error('이미지 읽기에 실패했습니다: '+file.name));
        img.src=dataUrl;
      };
      reader.onerror=()=>reject(new Error('파일 읽기에 실패했습니다: '+file.name));
      reader.readAsDataURL(file);
    });
  }
  async function uploadFiles(fileList){
    const files=Array.from(fileList||[]).filter(f=>/^image\//i.test(f.type||'') || /\.(png|jpe?g|webp|gif)$/i.test(f.name||''));
    if(!files.length){ toast('이미지 파일을 선택하세요.'); return; }
    let ok=0;
    for(const f of files){ try{ const a=await readImageFile(f); assets[a.id]=a; const img=new Image(); img.onload=()=>imageCache.set(a.id,img); img.src=a.dataUrl; ok++; }catch(e){ console.error(e); } }
    saveAssets(); saveProject(); refreshAll(); toast('이미지 '+ok+'개 등록 완료');
  }
  function getAsset(id){ return id && assets[id] ? assets[id] : null; }
  function getImage(id){
    const a=getAsset(id); if(!a||!a.dataUrl) return null;
    if(imageCache.has(id)) return imageCache.get(id);
    const img=new Image(); img.onload=()=>imageCache.set(id,img); img.src=a.dataUrl; imageCache.set(id,img); return img;
  }
  function fillSelect(sel, includeEmpty){
    if(!sel) return;
    const prev=sel.value; sel.innerHTML='';
    if(includeEmpty){ const o=document.createElement('option'); o.value=''; o.textContent='이미지 선택'; sel.appendChild(o); }
    Object.values(assets).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(a=>{ const o=document.createElement('option'); o.value=a.id; o.textContent=(a.name||a.id)+(a.width?` (${a.width}×${a.height})`:''); sel.appendChild(o); });
    if(prev && assets[prev]) sel.value=prev;
  }
  function getBuiltinKeys(){
    const keys=new Set();
    allObjects().forEach(o=>{ const k=keyOf(o); if(k && !k.startsWith('asset:') && k !== 'custom_asset' && k !== '__empty__') keys.add(k); });
    document.querySelectorAll('select[id*="key"],select[id*="Key"],#bge-obj-key').forEach(sel=>{ Array.from(sel.options||[]).forEach(op=>{ if(op.value && !op.value.startsWith('asset:')) keys.add(op.value); }); });
    return Array.from(keys).sort((a,b)=>a.localeCompare(b));
  }
  function fillBuiltinSelect(){
    const sel=$('bge-v43-builtin-key'); if(!sel) return;
    const prev=sel.value; sel.innerHTML='<option value="">내장 이미지 키 선택</option>';
    getBuiltinKeys().forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=k + (settings.builtinOverrides[k]?' [교체됨]':'') + (settings.builtinHidden[k]?' [숨김]':''); sel.appendChild(o); });
    if(prev) sel.value=prev;
  }
  function refreshAll(){
    ['bge-v43-apply-select','bge-v43-place-select','bge-v43-manage-select','bge-v43-replace-select','bge-v43-builtin-asset'].forEach(id=>fillSelect($(id), true));
    ['bge-v42-apply-select','bge-v42-place-select','bge-v37-asset','bge-v37-place-asset'].forEach(id=>fillSelect($(id), true));
    fillBuiltinSelect(); refreshCurrentInfo(); refreshManageInfo();
    const cnt=$('bge-v43-count'); if(cnt) cnt.textContent=String(Object.keys(assets).length);
  }
  function refreshCurrentInfo(){
    const info=$('bge-v43-current'); if(!info) return;
    const obj=selectedObject();
    if(!obj){ info.textContent='현재 선택된 배치물이 없습니다. 왼쪽 배치 목록이나 맵에서 배치물을 선택하세요.'; return; }
    const id=assetIdOf(obj), asset=getAsset(id);
    const key=keyOf(obj), over=settings.builtinOverrides[key] ? getAsset(settings.builtinOverrides[key]) : null;
    info.textContent='선택 배치물: '+selectedName()+' / 현재 그림: '+(asset?asset.name:(over?'내장 이미지 교체됨: '+over.name:(key||'없음')));
    const sel=$('bge-v43-apply-select'); if(sel && id && assets[id]) sel.value=id;
  }
  function refreshManageInfo(){
    const sel=$('bge-v43-manage-select'), box=$('bge-v43-manage-info'); if(!sel||!box) return;
    const a=getAsset(sel.value);
    if(!a){ box.innerHTML='관리할 이미지를 선택하세요.'; return; }
    const used=allObjects().filter(o=>assetIdOf(o)===a.id || settings.builtinOverrides[keyOf(o)]===a.id).length;
    box.innerHTML='<div style="display:flex;gap:8px;align-items:center"><img src="'+a.dataUrl+'" style="width:54px;height:54px;object-fit:cover;border:1px solid #74d9ff;border-radius:6px;background:#111"><div><b>'+escapeHtml(a.name||a.id)+'</b><br>'+escapeHtml(a.id)+'<br>'+((a.width||'?')+'×'+(a.height||'?'))+' / 사용 배치물 '+used+'개</div></div>';
    const name=$('bge-v43-rename-input'); if(name) name.value=a.name||'';
  }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function applyAssetToObject(obj, assetId){
    if(!obj){ toast('먼저 배치물을 선택하세요.'); return false; }
    if(!assetId || !assets[assetId]){ toast('적용할 이미지를 선택하세요.'); return false; }
    obj.assetId=assetId; obj.kidAssetId=assetId; obj.key='asset:'+assetId; obj.customImageDataUrl=assets[assetId].dataUrl;
    if(!obj.label) obj.label=(assets[assetId].name||'이미지').replace(/\.[^.]+$/,'');
    saveAssets(); saveSettings(); saveProject(); clickSave(); refreshAll(); forceRender(); toast('선택한 배치물에 이미지 적용 완료'); return true;
  }
  function placeAsset(assetId){
    if(!assetId || !assets[assetId]){ toast('새로 만들 이미지를 선택하세요.'); return; }
    const st=stageObj(); if(!st){ toast('현재 맵을 찾을 수 없습니다.'); return; }
    if(!Array.isArray(st.objects)) st.objects=[];
    const a=assets[assetId];
    const obj={type:'decoration', key:'asset:'+assetId, assetId, kidAssetId:assetId, customImageDataUrl:a.dataUrl, rx:0.45, ry:0.45, rw:0.12, rh:0.12, label:(a.name||'새 이미지').replace(/\.[^.]+$/,''), interactable:'', note:'', _editorId:'obj_v43_'+Date.now().toString(36)};
    st.objects.push(obj); saveProject(); clickSave(); refreshAll(); forceRender(); toast('이미지를 새 배치물로 만들었습니다.');
  }
  function clearAsset(){
    const obj=selectedObject(); if(!obj){ toast('먼저 배치물을 선택하세요.'); return; }
    delete obj.assetId; delete obj.kidAssetId; delete obj.customImageDataUrl; if(String(obj.key||'').startsWith('asset:')) obj.key='small';
    saveProject(); clickSave(); refreshAll(); forceRender(); toast('선택 배치물의 업로드 이미지 연결을 해제했습니다.');
  }
  function deleteAssetById(id){
    if(!id || !assets[id]){ toast('삭제할 이미지를 선택하세요.'); return; }
    const used=allObjects().filter(o=>assetIdOf(o)===id || Object.values(settings.builtinOverrides).includes(id)).length;
    if(!confirm('선택한 그림 자료를 삭제할까요?\n'+assets[id].name+'\n사용 중인 배치물: '+used+'개\n\n삭제하면 연결된 배치물은 내장 이미지로 돌아갑니다.')) return;
    delete assets[id]; imageCache.delete(id);
    allObjects().forEach(o=>{ if(assetIdOf(o)===id){ delete o.assetId; delete o.kidAssetId; delete o.customImageDataUrl; if(String(o.key||'')==='asset:'+id) o.key='small'; } });
    Object.keys(settings.builtinOverrides).forEach(k=>{ if(settings.builtinOverrides[k]===id) delete settings.builtinOverrides[k]; });
    saveAssets(); saveSettings(); saveProject(); clickSave(); refreshAll(); forceRender(); toast('그림 자료 삭제 완료');
  }
  async function replaceAssetFile(id, file){
    if(!id || !assets[id]){ toast('교체할 이미지를 선택하세요.'); return; }
    if(!file){ toast('새 이미지 파일을 선택하세요.'); return; }
    try{
      const oldName=assets[id].name;
      const a=await readImageFile(file, id);
      a.name = file.name || oldName || id;
      assets[id]=Object.assign({},assets[id],a,{id,updatedAt:Date.now()});
      imageCache.delete(id); const img=new Image(); img.onload=()=>imageCache.set(id,img); img.src=assets[id].dataUrl;
      allObjects().forEach(o=>{ if(assetIdOf(o)===id) o.customImageDataUrl=assets[id].dataUrl; });
      saveAssets(); saveProject(); refreshAll(); forceRender(); toast('이미지를 새 파일로 교체했습니다.');
    }catch(e){ alert('이미지 교체 실패: '+e.message); }
  }
  function renameAsset(id, name){
    if(!id||!assets[id]){ toast('이름을 바꿀 이미지를 선택하세요.'); return; }
    assets[id].name=(name||'').trim()||assets[id].name||id; assets[id].updatedAt=Date.now(); saveAssets(); saveProject(); refreshAll(); toast('이미지 이름을 변경했습니다.');
  }
  function deleteUnusedAssets(){
    const used=new Set();
    allObjects().forEach(o=>{ const id=assetIdOf(o); if(id) used.add(id); });
    Object.values(settings.builtinOverrides).forEach(id=>id&&used.add(id));
    const unused=Object.keys(assets).filter(id=>!used.has(id));
    if(!unused.length){ toast('사용하지 않는 이미지가 없습니다.'); return; }
    if(!confirm('사용하지 않는 이미지 '+unused.length+'개를 삭제할까요?')) return;
    unused.forEach(id=>{ delete assets[id]; imageCache.delete(id); }); saveAssets(); saveProject(); refreshAll(); toast('사용하지 않는 이미지 '+unused.length+'개 삭제 완료');
  }
  function applyBuiltinOverride(){
    const key=$('bge-v43-builtin-key')?.value||'', assetId=$('bge-v43-builtin-asset')?.value||'';
    if(!key){ toast('교체할 내장 이미지 키를 선택하세요.'); return; }
    if(!assetId || !assets[assetId]){ toast('교체에 사용할 업로드 이미지를 선택하세요.'); return; }
    settings.builtinOverrides[key]=assetId; delete settings.builtinHidden[key];
    // Ensure previously hidden objects are restored when replacing.
    allObjects().forEach(o=>{ if(keyOf(o)===key && o.__v43_hiddenByKey){ delete o.__v43_hiddenByKey; o.visible=true; o.hidden=false; } });
    saveSettings(); saveProject(); clickSave(); refreshAll(); forceRender(); toast('내장 이미지 키 '+key+'를 교체했습니다.');
  }
  function clearBuiltinOverride(){
    const key=$('bge-v43-builtin-key')?.value||''; if(!key){ toast('내장 이미지 키를 선택하세요.'); return; }
    delete settings.builtinOverrides[key]; saveSettings(); saveProject(); refreshAll(); forceRender(); toast('내장 이미지 교체를 해제했습니다.');
  }
  function hideBuiltinKey(){
    const key=$('bge-v43-builtin-key')?.value||''; if(!key){ toast('숨길 내장 이미지 키를 선택하세요.'); return; }
    if(!confirm('현재 맵/다른 맵에서 이 키를 쓰는 배치물을 숨길까요?\n키: '+key+'\n\n주의: 배치물 자체가 숨김 처리됩니다.')) return;
    settings.builtinHidden[key]=true;
    allObjects().forEach(o=>{ if(keyOf(o)===key){ o.__v43_hiddenByKey=true; o.visible=false; o.hidden=true; } });
    saveSettings(); saveProject(); clickSave(); refreshAll(); forceRender(); toast('내장 이미지 키 '+key+'를 쓰는 배치물을 숨겼습니다.');
  }
  function restoreBuiltinKey(){
    const key=$('bge-v43-builtin-key')?.value||''; if(!key){ toast('복구할 내장 이미지 키를 선택하세요.'); return; }
    delete settings.builtinHidden[key];
    allObjects().forEach(o=>{ if(keyOf(o)===key && o.__v43_hiddenByKey){ delete o.__v43_hiddenByKey; o.visible=true; o.hidden=false; } });
    saveSettings(); saveProject(); clickSave(); refreshAll(); forceRender(); toast('내장 이미지 키 '+key+' 배치물을 다시 보이게 했습니다.');
  }
  function exportJson(data, name){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function stamp(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes()); }
  function exportProject(){ exportJson({version:VERSION,savedAt:new Date().toISOString(),stages:clone(typeof STAGES!=='undefined'?STAGES:{}),assets,imageSettings:settings}, 'bongdam_rpg_project_'+stamp()+'.json'); }
  async function importProjectFile(file){
    if(!file) return;
    try{ const data=JSON.parse(await file.text()); if(data.assets) assets=normalizeAssetMap(data.assets); if(data.imageSettings) settings=Object.assign({builtinOverrides:{},builtinHidden:{}},data.imageSettings); if(data.stages&&typeof STAGES!=='undefined'){ Object.keys(STAGES).forEach(k=>delete STAGES[k]); Object.keys(data.stages).forEach(k=>STAGES[k]=data.stages[k]); } await preloadAssets(); saveAssets(); saveSettings(); saveProject(); refreshAll(); forceRender(); toast('작업 파일 가져오기 완료'); }catch(e){ alert('작업 파일을 가져오지 못했습니다: '+e.message); }
  }
  function exportAssetPack(){ exportJson({version:VERSION,savedAt:new Date().toISOString(),assets}, 'bongdam_image_pack_'+stamp()+'.json'); }
  async function importAssetPackFile(file){
    if(!file) return;
    try{ const data=JSON.parse(await file.text()); const pack=normalizeAssetMap(data); Object.values(pack).forEach(a=>{ if(a&&a.dataUrl){ const id=assets[a.id]?makeId('img'):a.id; assets[id]=Object.assign({},a,{id}); }}); await preloadAssets(); saveAssets(); refreshAll(); toast('그림 자료 묶음 가져오기 완료'); }catch(e){ alert('그림 자료 묶음을 가져오지 못했습니다: '+e.message); }
  }
  function clickSave(){ try{ const btn=$('bge-save'); if(btn) btn.click(); }catch(e){} }
  function forceRender(){ try{ if(typeof gameLoop==='function') gameLoop(); if(window.__bgeEditor && typeof window.__bgeEditor.refresh==='function') window.__bgeEditor.refresh(); }catch(e){} }
  function toCanvasPos(x,y,canvas){
    try{ return {x: toScreenX(x,canvas), y: toScreenY(y,canvas)}; }catch(e){ return {x:x*canvas.width,y:y*canvas.height}; }
  }
  function toCanvasSize(w,h,canvas){
    try{ return {w: toScreenW(w,canvas), h: toScreenH(h,canvas)}; }catch(e){ return {w:w*canvas.width,h:h*canvas.height}; }
  }
  function drawAssetOverlays(canvas){
    let st; try{ st=STAGES[currentStage]; }catch(e){ return; }
    if(!st || !Array.isArray(st.objects)) return;
    const ctx=canvas.getContext('2d');
    st.objects.forEach(o=>{
      if(o.visible===false || o.hidden===true) return;
      let id=assetIdOf(o);
      if(!id){ const key=keyOf(o); if(settings.builtinOverrides[key]) id=settings.builtinOverrides[key]; }
      if(!id) return;
      let img=getImage(id);
      if(!img && o.customImageDataUrl){ img=new Image(); img.onload=()=>imageCache.set(id,img); img.src=o.customImageDataUrl; }
      if(!img || !img.complete || img.naturalWidth<=0) return;
      try{ const p=toCanvasPos(Number(o.rx||0),Number(o.ry||0),canvas), s=toCanvasSize(Number(o.rw||0.1),Number(o.rh||0.1),canvas); ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(img,p.x,p.y,s.w,s.h); ctx.restore(); }catch(e){}
    });
  }
  function patchRenderer(){
    try{ if(typeof renderMap==='function' && !renderMap.__v43patched){ const original=renderMap; renderMap=function(canvas){ original(canvas); /* (v255) 이중 렌더 제거 — 본체 renderMap 전담 */ }; renderMap.__v43patched=true; log('이미지 화면 표시 연결 완료'); } }
    catch(e){ console.warn('렌더러 연결 실패', e); }
  }
  function ensureDom(){
    let style=$('bge-v43-style');
    if(!style){ style=document.createElement('style'); style.id='bge-v43-style'; style.textContent=`
      #bge-v37-asset-panel,#bge-v40-asset-panel,#bge-v41-asset-panel,#bge-v42-panel{display:none!important}
      #bge-v43-panel{margin:8px 0 12px!important;padding:12px!important;border:2px solid rgba(116,217,255,.95)!important;border-radius:12px!important;background:rgba(4,18,31,.97)!important;box-shadow:0 0 18px rgba(0,200,255,.22) inset,0 0 8px rgba(0,0,0,.45)!important;color:#eaf6ff!important;font-family:'Noto Serif KR',serif!important}
      #bge-v43-panel h4{margin:0 0 8px!important;color:#7ee2ff!important;font-size:15px!important}#bge-v43-panel h5{margin:14px 0 5px!important;color:#ffe8a3!important;font-size:13px!important;border-top:1px solid rgba(255,209,92,.25);padding-top:10px!important}
      #bge-v43-panel label{display:block!important;margin:8px 0 4px!important;color:#d8ecff!important;font-size:12px!important;font-weight:700!important}
      #bge-v43-panel select,#bge-v43-panel input[type=file],#bge-v43-panel input[type=text]{width:100%!important;border:1px solid rgba(116,217,255,.75)!important;border-radius:8px!important;background:#071420!important;color:#fff!important;padding:8px!important;min-height:36px!important}
      #bge-v43-panel .v43-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}#bge-v43-panel .v43-row3{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:8px!important}
      #bge-v43-panel button{border:1px solid #c8902a!important;border-radius:9px!important;background:rgba(70,42,5,.92)!important;color:#ffe8a3!important;padding:8px 10px!important;font-weight:800!important;cursor:pointer!important;margin-top:8px!important}#bge-v43-panel button.danger{background:rgba(110,20,12,.96)!important;color:#ffd8d2!important}#bge-v43-panel button.blue{background:rgba(13,53,78,.96)!important;color:#d9f7ff!important;border-color:#74d9ff!important}
      #bge-v43-current,#bge-v43-status,#bge-v43-manage-info,#bge-v43-help{background:rgba(255,255,255,.06)!important;border-radius:8px!important;padding:8px!important;margin:8px 0!important;font-size:12px!important;line-height:1.45!important;color:#dbeeff!important}
    `; document.head.appendChild(style); }
    let panel=$('bge-v43-panel'); if(panel) return;
    panel=document.createElement('div'); panel.id='bge-v43-panel'; panel.innerHTML=`
      <h4>그림 자료함 / 이미지 적용 v4.3</h4>
      <div id="bge-v43-current">현재 선택된 배치물이 없습니다.</div>
      <label>이미지 업로드</label><input id="bge-v43-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple>
      <div class="v43-row"><div><label>적용할 이미지</label><select id="bge-v43-apply-select"><option value="">이미지 선택</option></select></div><div><label>새로 만들 이미지</label><select id="bge-v43-place-select"><option value="">이미지 선택</option></select></div></div>
      <div class="v43-row"><button id="bge-v43-apply" type="button">선택 배치물에 적용</button><button id="bge-v43-place" type="button">이미지를 새 배치물로 만들기</button></div>
      <button id="bge-v43-clear" class="danger" type="button">선택 배치물 이미지 해제</button>
      <h5>업로드 이미지 관리</h5>
      <label>관리할 이미지</label><select id="bge-v43-manage-select"><option value="">이미지 선택</option></select><div id="bge-v43-manage-info">관리할 이미지를 선택하세요.</div>
      <label>이미지 이름 변경</label><input id="bge-v43-rename-input" type="text" placeholder="이미지 이름"><button id="bge-v43-rename" type="button">이름 변경</button>
      <label>선택 이미지를 새 파일로 교체</label><input id="bge-v43-replace-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><button id="bge-v43-replace" class="blue" type="button">선택 이미지를 새 파일로 교체</button>
      <div class="v43-row"><button id="bge-v43-delete-asset" class="danger" type="button">선택 이미지 삭제</button><button id="bge-v43-delete-unused" class="danger" type="button">사용하지 않는 이미지 정리</button></div>
      <h5>HTML 안의 기본 이미지 교체/숨김</h5>
      <div id="bge-v43-help">기본 이미지는 HTML 코드에 박혀 있어서 실제 파일을 지우지는 않고, 제작 데이터에서 교체/숨김 처리합니다. 교체는 같은 키를 쓰는 배치물 위에 새 이미지를 덮어 그립니다.</div>
      <label>교체하거나 숨길 기본 이미지 키</label><select id="bge-v43-builtin-key"><option value="">내장 이미지 키 선택</option></select>
      <label>교체에 사용할 업로드 이미지</label><select id="bge-v43-builtin-asset"><option value="">이미지 선택</option></select>
      <div class="v43-row"><button id="bge-v43-override-builtin" class="blue" type="button">기본 이미지 교체 적용</button><button id="bge-v43-clear-builtin" type="button">교체 해제</button></div>
      <div class="v43-row"><button id="bge-v43-hide-builtin" class="danger" type="button">이 키를 쓰는 배치물 숨김</button><button id="bge-v43-restore-builtin" type="button">숨김 복구</button></div>
      <h5>백업 / 이동</h5>
      <div class="v43-row"><button id="bge-v43-export-project" type="button">작업 파일 내보내기</button><button id="bge-v43-import-project-btn" type="button">작업 파일 가져오기</button></div>
      <div class="v43-row"><button id="bge-v43-export-assets" type="button">그림 자료 묶음 내보내기</button><button id="bge-v43-import-assets-btn" type="button">그림 자료 묶음 가져오기</button></div>
      <input id="bge-v43-import-project" type="file" accept="application/json,.json" style="display:none"><input id="bge-v43-import-assets" type="file" accept="application/json,.json" style="display:none">
      <div id="bge-v43-status">등록된 이미지: <span id="bge-v43-count">0</span>개</div>
    `;
    const host=$('bge-panel') || $('inspectorPanel') || document.querySelector('.bge-panel') || document.body; host.insertBefore(panel, host.firstChild); bindEvents();
  }
  function bindEvents(){
    const upload=$('bge-v43-upload'); if(upload&&!upload.__v43){ upload.addEventListener('change',e=>{uploadFiles(e.target.files); upload.value='';}); upload.__v43=true; }
    const apply=$('bge-v43-apply'); if(apply&&!apply.__v43){ apply.addEventListener('click',()=>applyAssetToObject(selectedObject(), $('bge-v43-apply-select').value)); apply.__v43=true; }
    const applySel=$('bge-v43-apply-select'); if(applySel&&!applySel.__v43){ applySel.addEventListener('change',()=>{ const o=selectedObject(); if(o&&applySel.value) applyAssetToObject(o,applySel.value); }); applySel.__v43=true; }
    const place=$('bge-v43-place'); if(place&&!place.__v43){ place.addEventListener('click',()=>placeAsset($('bge-v43-place-select').value)); place.__v43=true; }
    const clear=$('bge-v43-clear'); if(clear&&!clear.__v43){ clear.addEventListener('click',clearAsset); clear.__v43=true; }
    const man=$('bge-v43-manage-select'); if(man&&!man.__v43){ man.addEventListener('change',refreshManageInfo); man.__v43=true; }
    const ren=$('bge-v43-rename'); if(ren&&!ren.__v43){ ren.addEventListener('click',()=>renameAsset($('bge-v43-manage-select').value,$('bge-v43-rename-input').value)); ren.__v43=true; }
    const rep=$('bge-v43-replace'); if(rep&&!rep.__v43){ rep.addEventListener('click',()=>replaceAssetFile($('bge-v43-manage-select').value, $('bge-v43-replace-file').files[0])); rep.__v43=true; }
    const del=$('bge-v43-delete-asset'); if(del&&!del.__v43){ del.addEventListener('click',()=>deleteAssetById($('bge-v43-manage-select').value || $('bge-v43-apply-select').value)); del.__v43=true; }
    const du=$('bge-v43-delete-unused'); if(du&&!du.__v43){ du.addEventListener('click',deleteUnusedAssets); du.__v43=true; }
    const bo=$('bge-v43-override-builtin'); if(bo&&!bo.__v43){ bo.addEventListener('click',applyBuiltinOverride); bo.__v43=true; }
    const bc=$('bge-v43-clear-builtin'); if(bc&&!bc.__v43){ bc.addEventListener('click',clearBuiltinOverride); bc.__v43=true; }
    const bh=$('bge-v43-hide-builtin'); if(bh&&!bh.__v43){ bh.addEventListener('click',hideBuiltinKey); bh.__v43=true; }
    const br=$('bge-v43-restore-builtin'); if(br&&!br.__v43){ br.addEventListener('click',restoreBuiltinKey); br.__v43=true; }
    const ep=$('bge-v43-export-project'); if(ep&&!ep.__v43){ ep.addEventListener('click',exportProject); ep.__v43=true; }
    const ipb=$('bge-v43-import-project-btn'); if(ipb&&!ipb.__v43){ ipb.addEventListener('click',()=>$('bge-v43-import-project').click()); ipb.__v43=true; }
    const ip=$('bge-v43-import-project'); if(ip&&!ip.__v43){ ip.addEventListener('change',e=>{importProjectFile(e.target.files[0]); ip.value='';}); ip.__v43=true; }
    const ea=$('bge-v43-export-assets'); if(ea&&!ea.__v43){ ea.addEventListener('click',exportAssetPack); ea.__v43=true; }
    const iab=$('bge-v43-import-assets-btn'); if(iab&&!iab.__v43){ iab.addEventListener('click',()=>$('bge-v43-import-assets').click()); iab.__v43=true; }
    const ia=$('bge-v43-import-assets'); if(ia&&!ia.__v43){ ia.addEventListener('change',e=>{importAssetPackFile(e.target.files[0]); ia.value='';}); ia.__v43=true; }
    document.addEventListener('click',()=>setTimeout(refreshCurrentInfo,0),true);
    document.addEventListener('keyup',()=>setTimeout(refreshCurrentInfo,0),true);
  }
  function init(){
    loadProject(); loadSettings(); loadAssets(); ensureDom(); refreshAll(); patchRenderer();
    window.BongdamV43ImageManagement = {
      refresh:function(){ loadSettings(); loadAssets(); refreshAll(); patchRenderer(); forceRender(); },
      getAssets:function(){ return clone(assets); },
      setAssets:function(nextAssets){ assets = normalizeAssetMap(nextAssets); saveAssets(); refreshAll(); forceRender(); },
      getSettings:function(){ return clone(settings); },
      setSettings:function(nextSettings){ settings = Object.assign({builtinOverrides:{},builtinHidden:{}}, nextSettings || {}); saveSettings(); refreshAll(); forceRender(); }
    };
    setInterval(()=>{ const _p=document.getElementById('bge-panel'); if(!_p || !_p.classList.contains('bge-open')) return; ensureDom(); refreshAll(); patchRenderer(); }, 1500);
    toast('v4.3 그림 자료 관리 준비 완료');
  }
  /* (v268) 구세대 모듈 부트 차단 — v4.3 (v5.2 에디터로 일원화) */
})();
