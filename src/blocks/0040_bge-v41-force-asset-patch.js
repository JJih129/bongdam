
(function(){
  if (window.BongdamV41ForceAssetPatch) return;
  window.BongdamV41ForceAssetPatch = true;
  'use strict';

  var ASSET_KEY = 'bongdam_rpg_editor_assets_v41';
  var LEGACY_KEYS = [
    'bongdam_rpg_editor_assets_v40',
    'bongdam_rpg_kid_assets_v40',
    'bongdam_rpg_editor_assets_v3_9',
    'bongdam_rpg_editor_assets_v37',
    'bongdam_rpg_editor_assets_v3_7',
    'bongdam_rpg_editor_assets_v35',
    'bongdam_rpg_editor_assets_v3'
  ];
  var assets = [];
  var cache = {};
  var lastFileSig = '';
  var placeMode = false;
  var renderPatched = false;
  var selectedWatcher = -9999;

  function $(id){ return document.getElementById(id); }
  function editor(){ return window.BongdamEditor || null; }
  function editorState(){ return editor() ? editor().state : null; }
  function canvas(){ return $('game-canvas') || document.querySelector('canvas'); }
  function stage(){ try { return (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null; } catch(e) { return null; } }
  function objects(){ var s = stage(); return s && Array.isArray(s.objects) ? s.objects : []; }
  function selectedObject(){ var s = editorState(); var arr = objects(); var i = s ? Number(s.selectedIndex) : -1; return (i >= 0 && i < arr.length) ? arr[i] : null; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function uid(prefix){ return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8); }
  function dataUrlOf(a){ return a && (a.dataUrl || a.data || a.url || a.path || '') || ''; }
  function isImageFile(f){ return !!f && ((f.type || '').indexOf('image/') === 0 || /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name || '')); }
  function status(msg){ var el = $('bge-v37-current'); if (el) el.innerHTML = '<b>상태:</b> ' + esc(msg); console.log('[봉담 v4.1]', msg); }
  function toast(msg){ status(msg); try { if (typeof window.toast === 'function') window.toast(msg); } catch(e){} }
  function clamp(v,a,b){ v=Number(v); if(!isFinite(v)) v=a; return Math.max(a, Math.min(b, v)); }
  function clamp01(v){ return clamp(v,0,1); }

  function normalizeAsset(raw){
    if (!raw) return null;
    var src = dataUrlOf(raw);
    if (!src) return null;
    return {
      id: raw.id || uid('asset'),
      name: raw.name || raw.fileName || raw.id || '이미지',
      type: 'image',
      sourceType: raw.sourceType || 'embedded',
      dataUrl: src,
      width: raw.width || 0,
      height: raw.height || 0,
      createdAt: raw.createdAt || Date.now()
    };
  }

  function loadAssets(){
    var map = {};
    function add(raw){ var a = normalizeAsset(raw); if(a) map[a.id] = a; }
    try { JSON.parse(localStorage.getItem(ASSET_KEY) || '[]').forEach(add); } catch(e){}
    for (var i=0;i<LEGACY_KEYS.length;i++) {
      try {
        var arr = JSON.parse(localStorage.getItem(LEGACY_KEYS[i]) || '[]');
        if (Array.isArray(arr)) arr.forEach(add);
      } catch(e){}
    }
    try { if (window.BongdamKidEditorV40 && Array.isArray(window.BongdamKidEditorV40.assets)) window.BongdamKidEditorV40.assets.forEach(add); } catch(e){}
    try { if (window.BongdamKidEditorV39 && Array.isArray(window.BongdamKidEditorV39.assets)) window.BongdamKidEditorV39.assets.forEach(add); } catch(e){}
    assets = Object.keys(map).map(function(k){ return map[k]; });
  }

  function saveAssets(){
    try { localStorage.setItem(ASSET_KEY, JSON.stringify(assets)); } catch(e) { alert('브라우저 저장 공간이 부족합니다. 작업 파일 내보내기로 백업하세요.'); }
    try { localStorage.setItem('bongdam_rpg_editor_assets_v40', JSON.stringify(assets)); } catch(e){}
    try { localStorage.setItem('bongdam_rpg_kid_assets_v40', JSON.stringify(assets)); } catch(e){}
    try { localStorage.setItem('bongdam_rpg_editor_assets_v3_9', JSON.stringify(assets)); } catch(e){}
    try { localStorage.setItem('bongdam_rpg_editor_assets_v37', JSON.stringify(assets)); } catch(e){}
    updateDebugCount();
  }

  function getAsset(id){ for(var i=0;i<assets.length;i++){ if(assets[i].id === id) return assets[i]; } return null; }
  function getObjectAssetId(o){ if(!o) return ''; if(o.assetId) return o.assetId; if(o.kidAssetId) return o.kidAssetId; var k=String(o.key||''); return k.indexOf('asset:')===0 ? k.slice(6) : ''; }
  function setObjectAsset(o,id){
    if(!o) return;
    if(id){ o.assetId=id; o.kidAssetId=id; o.key='asset:'+id; o.customImage=true; }
    else { delete o.assetId; delete o.kidAssetId; delete o.customImage; if(String(o.key||'').indexOf('asset:')===0) o.key=''; }
  }
  function getImage(id){
    var a = getAsset(id); var src = dataUrlOf(a); if(!src) return null;
    var key = id + '|' + src.length;
    if(cache[key]) return cache[key];
    var img = new Image();
    img.onload = function(){ if(a){ a.width = img.naturalWidth || a.width || 0; a.height = img.naturalHeight || a.height || 0; } refreshSelects(); forceRender(); };
    img.onerror = function(){ console.warn('[봉담 v4.1] 이미지 로드 실패', a && a.name); };
    img.src = src;
    cache[key] = img;
    return img;
  }

  function ensureUi(){
    var panel = $('bge-v37-asset-panel');
    if (!panel) {
      var parent = $('bge-panel') || document.body;
      panel = document.createElement('div');
      panel.id = 'bge-v37-asset-panel';
      panel.className = 'bge-v37-panel';
      parent.insertBefore(panel, parent.firstChild);
    }
    panel.style.display = 'block';
    panel.innerHTML = '' +
      '<h4>그림 자료함 / 이미지 적용 v4.1</h4>' +
      '<div class="bge-v37-help">외부 폴더는 필요 없습니다. PNG/JPG/WEBP 이미지를 선택하면 아래 목록에 바로 등록됩니다.</div>' +
      '<div id="bge-v37-current" class="bge-v37-current">이미지를 업로드하거나 배치물을 선택하세요.</div>' +
      '<label>이미지 업로드</label>' +
      '<input id="bge-v37-files" type="file" accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif" multiple>' +
      '<div class="bge-row">' +
        '<div><label>적용할 이미지</label><select id="bge-v37-asset"><option value="">이미지 선택</option></select></div>' +
        '<div><label>새로 만들 이미지</label><select id="bge-v37-place-asset"><option value="">이미지 선택</option></select></div>' +
      '</div>' +
      '<div class="bge-btn-row">' +
        '<button class="bge-btn" id="bge-v37-apply" type="button">선택 배치물에 적용</button>' +
        '<button class="bge-btn secondary" id="bge-v37-place" type="button">이미지로 새 배치물 만들기</button>' +
        '<button class="bge-btn danger" id="bge-v37-clear" type="button">이미지 해제</button>' +
      '</div>' +
      '<div class="bge-btn-row">' +
        '<button class="bge-btn secondary" id="bge-v37-export" type="button">작업 파일 내보내기</button>' +
        '<button class="bge-btn secondary" id="bge-v37-import-btn" type="button">작업 파일 가져오기</button>' +
        '<button class="bge-btn danger" id="bge-v37-delete" type="button">선택 이미지 삭제</button>' +
      '</div>' +
      '<input id="bge-v37-import" type="file" accept="application/json,.json" style="display:none">' +
      '<div class="bge-v37-help">다른 PC로 옮길 때는 작업 파일 내보내기를 사용하세요. 같은 PC에서는 자동 저장됩니다.</div>';

    // 다른 패치 패널이 있으면 혼동 방지를 위해 숨김
    var oldIds = ['bge-v40-panel','bge-kid-panel'];
    for (var i=0;i<oldIds.length;i++){ var old=$(oldIds[i]); if(old) old.style.display='none'; }
  }

  function refreshSelects(){
    loadAssets();
    var ids = ['bge-v37-asset','bge-v37-place-asset','bge-v40-apply','bge-v40-place-select','bge-kid-apply-select','bge-kid-place-select'];
    for(var j=0;j<ids.length;j++){
      var sel = $(ids[j]); if(!sel) continue;
      var prev = sel.value;
      sel.innerHTML = '<option value="">이미지 선택</option>';
      for(var i=0;i<assets.length;i++){
        var a = assets[i];
        var op = document.createElement('option');
        op.value = a.id;
        op.textContent = (a.name || a.id) + (a.width && a.height ? ' ('+a.width+'x'+a.height+')' : '');
        sel.appendChild(op);
      }
      if(prev && getAsset(prev)) sel.value = prev;
    }
    refreshCurrent();
    updateDebugCount();
  }

  function refreshCurrent(){
    var el = $('bge-v37-current'); if(!el) return;
    var o = selectedObject(); var apply = $('bge-v37-asset');
    if(!o){ el.innerHTML = '배치물을 선택하면 현재 이미지 상태가 표시됩니다.<br>등록된 이미지 수: <b>'+assets.length+'</b>'; if(apply) apply.value=''; return; }
    var id = getObjectAssetId(o); var a = getAsset(id); if(apply) apply.value = id || '';
    if(a){
      el.innerHTML = '<div style="display:flex;gap:8px;align-items:center"><img src="'+esc(dataUrlOf(a))+'" style="width:56px;height:56px;object-fit:contain;border:1px solid #76d9ff;border-radius:6px"><div><b>선택 배치물:</b> '+esc(o.label||o.name||o.id||'이름 없음')+'<br><b>현재 이미지:</b> '+esc(a.name)+'<br><b>저장 키:</b> '+esc(o.key||'')+'</div></div>';
    } else {
      el.innerHTML = '<b>선택 배치물:</b> '+esc(o.label||o.name||o.id||'이름 없음')+'<br><b>현재 이미지:</b> '+esc(o.key||'기본 이미지 또는 없음')+'<br>아래 목록에서 이미지를 선택해 적용할 수 있습니다.';
    }
  }

  function updateDebugCount(){ var e=$('debugAssetCount'); if(e) e.textContent=String(assets.length); }

  function importFiles(fileList){
    var files = Array.prototype.slice.call(fileList || []).filter(isImageFile);
    if(!files.length){ alert('PNG, JPG, WEBP 같은 이미지 파일을 선택하세요.'); return; }
    status('이미지 읽는 중... '+files.length+'개');
    var done = 0, added = 0;
    function finish(){
      done++;
      if(done >= files.length){
        saveAssets();
        refreshSelects();
        forceRender();
        toast('이미지 '+added+'개 등록 완료');
        var up=$('bge-v37-files'); if(up) up.value='';
      }
    }
    files.forEach(function(file){
      var reader = new FileReader();
      reader.onload = function(){
        var dataUrl = String(reader.result || '');
        var img = new Image();
        img.onload = function(){
          var a = { id:uid('asset'), name:file.name || '이미지', type:'image', sourceType:'embedded', dataUrl:dataUrl, width:img.naturalWidth||0, height:img.naturalHeight||0, createdAt:Date.now() };
          assets.push(a); cache[a.id+'|'+dataUrl.length] = img; added++; finish();
        };
        img.onerror = function(){
          var a = { id:uid('asset'), name:file.name || '이미지', type:'image', sourceType:'embedded', dataUrl:dataUrl, width:0, height:0, createdAt:Date.now() };
          assets.push(a); added++; finish();
        };
        img.src = dataUrl;
      };
      reader.onerror = finish;
      reader.readAsDataURL(file);
    });
  }

  function saveEditor(){ try { if(editor()){ editor().save(false); editor().refresh(); } } catch(e){ console.warn('[봉담 v4.1] 저장 실패', e); } }
  function forceRender(){ try { if(editor()) editor().refresh(); if(typeof gameLoop === 'function') gameLoop(); } catch(e){} }

  function applySelected(){
    var o = selectedObject();
    if(!o){ alert('먼저 맵이나 배치 목록에서 배치물을 선택하세요.'); return; }
    if(o.locked){ alert('잠긴 배치물은 수정할 수 없습니다. 잠금을 풀어주세요.'); return; }
    var sel = $('bge-v37-asset');
    var id = sel ? sel.value : '';
    if(!id || !getAsset(id)){ alert('적용할 이미지를 선택하세요.'); return; }
    setObjectAsset(o,id);
    var key = $('bge-obj-key'); if(key) key.value = o.key;
    saveEditor(); refreshCurrent(); forceRender(); toast('선택 배치물에 이미지 적용 완료');
  }

  function clearSelected(){
    var o = selectedObject(); if(!o){ alert('먼저 배치물을 선택하세요.'); return; }
    setObjectAsset(o,''); var key=$('bge-obj-key'); if(key) key.value=o.key||'';
    saveEditor(); refreshCurrent(); forceRender(); toast('이미지 연결 해제 완료');
  }

  function deleteSelectedAsset(){
    var sel=$('bge-v37-asset'); var id=sel?sel.value:''; var a=getAsset(id);
    if(!a){ alert('삭제할 이미지를 선택하세요.'); return; }
    if(!confirm('선택한 이미지를 삭제할까요?\n'+a.name)) return;
    assets = assets.filter(function(x){ return x.id !== id; });
    var arr = objects(); for(var i=0;i<arr.length;i++){ if(getObjectAssetId(arr[i])===id) setObjectAsset(arr[i],''); }
    cache = {}; saveAssets(); saveEditor(); refreshSelects(); forceRender();
  }

  function createSpriteAt(mx,my){
    var sel=$('bge-v37-place-asset'); var id=sel?sel.value:''; var a=getAsset(id); var st=stage();
    if(!a){ alert('새 배치물로 만들 이미지를 선택하세요.'); return; }
    if(!st){ alert('현재 맵을 찾을 수 없습니다.'); return; }
    if(!Array.isArray(st.objects)) st.objects = [];
    var o = { _editorId:uid('obj'), id:uid('obj'), label:a.name||'새 배치물', type:'decoration', key:'asset:'+id, assetId:id, kidAssetId:id, customImage:true, visible:true, locked:false, rx:clamp01(mx-.06), ry:clamp01(my-.06), rw:.12, rh:.12, cx:clamp01(mx-.05), cy:clamp01(my+.02), cw:.10, ch:.04, interactable:'', note:'', dialogue:{speaker:'',text:'',portraitAssetId:'',style:'visual_novel'}, quest:{id:'',title:'',memo:''} };
    st.objects.push(o);
    var s=editorState(); if(s){ s.selectedIndex=st.objects.length-1; s.selectedPart='object'; s.tool='select'; }
    saveEditor(); refreshSelects(); forceRender(); toast('이미지를 새 배치물로 만들었습니다.');
  }

  function viewportW(){ var fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); var s=editorState(); return fixed ? fixed.w : (s && s.enabled && s.editorZoom ? 1/s.editorZoom : (typeof VIEWPORT_W !== 'undefined' ? VIEWPORT_W : 1)); }
  function viewportH(){ var fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26(); var s=editorState(); return fixed ? fixed.h : (s && s.enabled && s.editorZoom ? 1/s.editorZoom : (typeof VIEWPORT_H !== 'undefined' ? VIEWPORT_H : 1)); }
  function mapToCanvas(mx,my){
    var c=canvas(); if(!c) return {x:0,y:0};
    var bw=(typeof BASE_W !== 'undefined' ? BASE_W : 1920), bh=(typeof BASE_H !== 'undefined' ? BASE_H : 1080), sc=(typeof currentScale !== 'undefined' ? currentScale : 1);
    var cx=(typeof camX !== 'undefined' ? camX : .5), cy=(typeof camY !== 'undefined' ? camY : .5);
    var bx=((mx-cx)/viewportW()+.5)*bw, by=((my-cy)/viewportH()+.5)*bh;
    return {x:(bx-bw/2)*sc+c.width/2, y:(by-bh/2)*sc+c.height/2};
  }
  function canvasToMap(clientX,clientY){
    var c=canvas(); if(!c) return {x:.5,y:.5};
    var r=c.getBoundingClientRect();
    var sx=(clientX-r.left)*(c.width/r.width), sy=(clientY-r.top)*(c.height/r.height);
    var bw=(typeof BASE_W !== 'undefined' ? BASE_W : 1920), bh=(typeof BASE_H !== 'undefined' ? BASE_H : 1080), sc=(typeof currentScale !== 'undefined' ? currentScale : 1);
    var bx=(sx-c.width/2)/sc+bw/2, by=(sy-c.height/2)/sc+bh/2;
    var cx=(typeof camX !== 'undefined' ? camX : .5), cy=(typeof camY !== 'undefined' ? camY : .5);
    return {x:clamp01((bx/bw-.5)*viewportW()+cx), y:clamp01((by/bh-.5)*viewportH()+cy)};
  }

  function drawOverlay(ctx){
    if(!ctx) return;
    var arr=objects();
    for(var i=0;i<arr.length;i++){
      var o=arr[i]; if(o.visible===false || o.hidden===true) continue;
      var id=getObjectAssetId(o); if(!id) continue;
      var img=getImage(id); if(!img || !img.complete || img.naturalWidth <= 0) continue;
      var x=Number(o.rx||0), y=Number(o.ry||0), w=Number(o.rw||.1), h=Number(o.rh||.1);
      var p1=mapToCanvas(x,y), p2=mapToCanvas(x+w,y+h);
      ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(img,p1.x,p1.y,p2.x-p1.x,p2.y-p1.y); ctx.restore();
    }
  }
  function patchRender(){
    if(renderPatched) return;
    if(typeof renderMap === 'function'){
      var old = renderMap;
      renderMap = function(targetCanvas){
        old.apply(this, arguments);
        /* (v261) 이중 렌더 제거 */
      };
      renderPatched = true;
    }
  }

  function exportProject(){
    var payload = { version:'bongdam_project_v41', savedAt:new Date().toISOString(), stages:(typeof STAGES !== 'undefined' ? STAGES : {}), assets:assets, currentStage:(typeof currentStage !== 'undefined' ? currentStage : 1) };
    var blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    var url = URL.createObjectURL(blob); var a=document.createElement('a');
    a.href=url; a.download='bongdam_rpg_project_v41_'+new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')+'.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('작업 파일 내보내기 완료');
  }
  function importProject(file){
    var reader = new FileReader();
    reader.onload = function(){
      try{
        var d=JSON.parse(String(reader.result||'{}'));
        if(d.stages && typeof STAGES !== 'undefined'){
          Object.keys(STAGES).forEach(function(k){ delete STAGES[k]; });
          Object.keys(d.stages).forEach(function(k){ STAGES[k]=d.stages[k]; });
        }
        if(Array.isArray(d.assets)){
          var map={}; assets.forEach(function(a){map[a.id]=a;});
          d.assets.forEach(function(raw){ var a=normalizeAsset(raw); if(a) map[a.id]=a; });
          assets=Object.keys(map).map(function(k){return map[k];});
        }
        saveAssets(); saveEditor(); refreshSelects(); forceRender(); alert('작업 파일 가져오기 완료');
      }catch(e){ alert('작업 파일 가져오기 실패: '+e.message); }
    };
    reader.readAsText(file,'utf-8');
  }

  function bind(){
    var input=$('bge-v37-files');
    if(input && !input._v41){ input._v41=true; input.addEventListener('change', function(e){ if(this.files && this.files.length) importFiles(this.files); e.stopPropagation(); }, true); }
    var applySel=$('bge-v37-asset');
    if(applySel && !applySel._v41){ applySel._v41=true; applySel.addEventListener('change', function(){ refreshCurrent(); if(selectedObject() && this.value) applySelected(); }); }
    var btn=$('bge-v37-apply'); if(btn && !btn._v41){ btn._v41=true; btn.addEventListener('click', applySelected); }
    var clear=$('bge-v37-clear'); if(clear && !clear._v41){ clear._v41=true; clear.addEventListener('click', clearSelected); }
    var del=$('bge-v37-delete'); if(del && !del._v41){ del._v41=true; del.addEventListener('click', deleteSelectedAsset); }
    var exp=$('bge-v37-export'); if(exp && !exp._v41){ exp._v41=true; exp.addEventListener('click', exportProject); }
    var ib=$('bge-v37-import-btn'); var ii=$('bge-v37-import'); if(ib && !ib._v41){ ib._v41=true; ib.addEventListener('click', function(){ if(ii) ii.click(); }); }
    if(ii && !ii._v41){ ii._v41=true; ii.addEventListener('change', function(){ var f=this.files && this.files[0]; if(f) importProject(f); this.value=''; }); }
    var place=$('bge-v37-place');
    if(place && !place._v41){ place._v41=true; place.addEventListener('click', function(){ placeMode=!placeMode; place.textContent=placeMode?'배치 모드 끄기':'이미지로 새 배치물 만들기'; toast(placeMode?'맵을 클릭하면 이미지가 새 배치물로 만들어집니다.':'배치 모드 종료'); }); }
    var c=canvas();
    if(c && !c._v41){ c._v41=true; c.addEventListener('mousedown', function(e){ var s=editorState(); if(!s || !s.enabled || !placeMode || e.button!==0) return; e.preventDefault(); e.stopImmediatePropagation(); var p=canvasToMap(e.clientX,e.clientY); createSpriteAt(p.x,p.y); placeMode=false; var b=$('bge-v37-place'); if(b) b.textContent='이미지로 새 배치물 만들기'; }, true); }
  }

  function poll(){
    var s=editorState(); var panel=$('bge-v37-asset-panel'); if(panel && s) panel.style.display=s.enabled?'block':'none';
    var idx=s?s.selectedIndex:-1; if(idx!==selectedWatcher){ selectedWatcher=idx; refreshCurrent(); }
    var input=$('bge-v37-files');
    if(input && input.files && input.files.length){
      var sig = Array.prototype.slice.call(input.files).map(function(f){return f.name+':'+f.size+':'+f.lastModified;}).join('|');
      if(sig && sig !== lastFileSig){ lastFileSig = sig; importFiles(input.files); }
    }
    requestAnimationFrame(poll);
  }

  function init(){
    if(!editor() || !canvas() || typeof STAGES === 'undefined'){ setTimeout(init,100); return; }
    ensureUi(); loadAssets(); refreshSelects(); bind(); patchRender(); forceRender();
    window.BongdamV41Assets = { get assets(){ return assets; }, refresh:function(){ loadAssets(); refreshSelects(); forceRender(); }, importFiles:importFiles, exportProject:exportProject };
    toast('v4.1 그림 자료함 패치 로드 완료'); poll();
  }
  /* (v268) 구세대 모듈 부트 차단 — v4.1 (v5.2 에디터로 일원화) */
})();
