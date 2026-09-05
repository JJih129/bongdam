
(function(){
'use strict';
const ASSET_KEY='bongdam_rpg_editor_assets_v3';
const $=id=>document.getElementById(id);
const v35={assets:[],cache:new Map(),renderPatched:false,bound:false,place:false};
function ed(){return window.BongdamEditor||null}function stt(){return ed()?ed().state:null}function cv(){return $('game-canvas')}function stage(){return typeof STAGES!=='undefined'&&typeof currentStage!=='undefined'?STAGES[currentStage]:null}function objs(){const s=stage();return s&&Array.isArray(s.objects)?s.objects:[]}function obj(){const s=stt(),l=objs();return s&&s.selectedIndex>=0&&s.selectedIndex<l.length?l[s.selectedIndex]:null}function clamp(v,a,b){v=Number(v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):a}function clamp01(v){return clamp(v,0,1)}function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(m){const t=$('bge-toast');if(t){t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',1800)}else console.log(m)}
function loadAssets(){try{const raw=localStorage.getItem(ASSET_KEY)||'[]';v35.assets=JSON.parse(raw);if(!Array.isArray(v35.assets))v35.assets=[]}catch(e){v35.assets=[]}}
function saveAssets(){try{localStorage.setItem(ASSET_KEY,JSON.stringify(v35.assets))}catch(e){alert('에셋 저장 실패: 이미지 용량이 너무 큽니다. 큰 이미지는 업로드 저장 대신 assets 폴더 상대경로 방식으로 등록하세요.')}}
function asset(id){return v35.assets.find(a=>a.id===id)||null}
function normalizeAsset(a){if(!a)return null;return{ id:a.id||('asset_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6)), name:a.name||a.fileName||a.id||'이미지', dataUrl:a.dataUrl||'', url:a.url||a.path||'' }}
function assetIdFromObject(o){if(!o)return'';if(o.assetId)return o.assetId;if(typeof o.key==='string'&&o.key.startsWith('asset:'))return o.key.slice(6);if(typeof o.key==='string'&&asset(o.key))return o.key;return''}
function setObjectAsset(o,id){if(!o)return;if(id){o.assetId=id;o.key='asset:'+id;o.customImage=true}else{delete o.assetId;delete o.customImage;if(String(o.key||'').startsWith('asset:'))o.key=''}}
function imageSrc(a){return a?(a.dataUrl||a.url||''):''}
function getImage(id){const a=asset(id);const src=imageSrc(a);if(!src)return null;const cacheKey=id+'|'+src;if(v35.cache.has(cacheKey))return v35.cache.get(cacheKey);const im=new Image();im.onload=()=>{if(ed())ed().refresh()};im.onerror=()=>{console.warn('이미지 로드 실패:',src)};im.src=src;v35.cache.set(cacheKey,im);return im}
function viewportW(){const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26();const s=stt();return fixed?fixed.w:(s&&s.enabled?1/s.editorZoom:(typeof VIEWPORT_W!=='undefined'?VIEWPORT_W:1))}function viewportH(){const fixed=window.BD_getEditorViewportV26&&window.BD_getEditorViewportV26();const s=stt();return fixed?fixed.h:(s&&s.enabled?1/s.editorZoom:(typeof VIEWPORT_H!=='undefined'?VIEWPORT_H:1))}
function mapToCanvas(mx,my){const c=cv(),vw=viewportW(),vh=viewportH();const bx=((mx-camX)/vw+.5)*BASE_W,by=((my-camY)/vh+.5)*BASE_H;return{x:(bx-BASE_W/2)*currentScale+c.width/2,y:(by-BASE_H/2)*currentScale+c.height/2}}
function canvasToMap(cx,cy){const c=cv(),r=c.getBoundingClientRect();const sx=(cx-r.left)*(c.width/r.width),sy=(cy-r.top)*(c.height/r.height);const bx=(sx-c.width/2)/currentScale+BASE_W/2,by=(sy-c.height/2)/currentScale+BASE_H/2;return{x:clamp01((bx/BASE_W-.5)*viewportW()+camX),y:clamp01((by/BASE_H-.5)*viewportH()+camY)}}
function rect(o){return{x:Number(o.rx||0),y:Number(o.ry||0),w:Number(o.rw||.08),h:Number(o.rh||.08)}}
function drawAssets(ctx){objs().forEach(o=>{const id=assetIdFromObject(o);if(!id||o.hidden)return;const im=getImage(id);if(!im||!im.complete||im.naturalWidth<=0)return;const r=rect(o),p1=mapToCanvas(r.x,r.y),p2=mapToCanvas(r.x+r.w,r.y+r.h);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);ctx.restore()})}
function patchRender(){if(v35.renderPatched||typeof renderMap!=='function')return;const prev=renderMap;renderMap=function(c){prev(c);/* (v261) 이중 렌더 제거 */};v35.renderPatched=true}
function makePanel(){if($('bge-v35-asset-panel'))return;const host=$('bge-panel')||document.body;const box=document.createElement('div');box.id='bge-v35-asset-panel';box.innerHTML=`
<h4>이미지 / 스프라이트 적용 v3.5</h4>
<div id="bge-v35-current">오브젝트를 선택하면 현재 이미지 상태가 표시됩니다.</div>
<label>업로드 이미지 여러 개 가져오기</label><input id="bge-v35-files" type="file" accept="image/*" multiple>
<div class="row"><div><label>상대경로 이미지 등록</label><input id="bge-v35-path" type="text" placeholder="assets/sprites/npc_teacher.png"></div><div><label>에셋 이름</label><input id="bge-v35-path-name" type="text" placeholder="예: 안내 선생님"></div></div>
<div class="btnrow"><button id="bge-v35-add-path" type="button">상대경로 등록</button></div>
<div class="row"><div><label>선택 오브젝트에 적용할 이미지</label><select id="bge-v35-asset"></select></div><div><label>씬에 배치할 이미지</label><select id="bge-v35-place-asset"></select></div></div>
<div class="btnrow"><button id="bge-v35-apply" type="button">선택 오브젝트에 적용</button><button id="bge-v35-clear" class="warn" type="button">이미지 해제</button><button id="bge-v35-place" class="warn" type="button">씬에 배치 시작</button></div>
<div class="btnrow"><button id="bge-v35-export" type="button">에셋팩 내보내기</button><button id="bge-v35-import-btn" type="button">에셋팩 가져오기</button><button id="bge-v35-delete" class="danger" type="button">선택 에셋 삭제</button></div><input id="bge-v35-import" type="file" accept="application/json,.json" style="display:none">
<div id="bge-v35-help">현업식 권장: HTML 옆에 <b>assets/sprites/</b>, <b>assets/maps/</b> 폴더를 두고 상대경로로 등록하세요. 빠른 시연용은 파일 업로드 방식도 가능합니다.</div>`;
const h=host.querySelector('h3'); if(h&&h.nextSibling)host.insertBefore(box,h.nextSibling); else host.appendChild(box);
$('bge-v35-files').addEventListener('change',function(){importImages(this.files);this.value=''});
$('bge-v35-add-path').addEventListener('click',addPathAsset);
$('bge-v35-asset').addEventListener('change',applyAsset);
$('bge-v35-apply').addEventListener('click',applyAsset);
$('bge-v35-clear').addEventListener('click',clearAsset);
$('bge-v35-place').addEventListener('click',()=>{v35.place=!v35.place;const s=stt();if(s)s.tool='select';updatePlaceButton();toast(v35.place?'맵을 클릭하면 선택 이미지가 배치됩니다.':'이미지 배치 종료')});
$('bge-v35-export').addEventListener('click',exportPack);
$('bge-v35-import-btn').addEventListener('click',()=>$('bge-v35-import').click());
$('bge-v35-import').addEventListener('change',function(){const f=this.files&&this.files[0];if(f)importPack(f);this.value=''});
$('bge-v35-delete').addEventListener('click',deleteSelectedAsset);
}
function refreshSelects(){['bge-v35-asset','bge-v35-place-asset'].forEach(id=>{const sel=$(id);if(!sel)return;const prev=sel.value;sel.innerHTML='<option value="">이미지 선택</option>';v35.assets.forEach(a=>{const op=document.createElement('option');op.value=a.id;op.textContent=(a.name||a.id)+(a.url?'  [경로]':'');sel.appendChild(op)});if(prev&&asset(prev))sel.value=prev});refreshPanel()}
function refreshPanel(){const o=obj(),cur=$('bge-v35-current'),sel=$('bge-v35-asset');if(!cur)return;if(!o){cur.textContent='오브젝트를 선택하면 현재 이미지 상태가 표시됩니다.';if(sel)sel.value='';return}const id=assetIdFromObject(o),a=asset(id);if(sel)sel.value=id||'';if(a){const src=imageSrc(a);cur.innerHTML='<img src="'+src+'"><div><b>'+esc(a.name||a.id)+'</b><br>'+(a.url?'상대경로: '+esc(a.url):'업로드 이미지')+'<br>오브젝트 Key: '+esc(o.key||'')+'</div>'}else cur.innerHTML='<div><b>현재 업로드/경로 이미지 없음</b><br>기본 Key: '+esc(o.key||'없음')+'<br>아래에서 이미지를 선택하면 즉시 적용됩니다.</div>'}
function importImages(files){const list=Array.from(files||[]).filter(f=>f.type&&f.type.startsWith('image/'));if(!list.length)return alert('이미지 파일을 선택하세요.');let done=0;list.forEach(f=>{const r=new FileReader();r.onload=()=>{const id='asset_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);v35.assets.push({id,name:f.name.replace(/\.[^.]+$/,''),dataUrl:String(r.result||''),url:''});if(++done===list.length){saveAssets();refreshSelects();toast(list.length+'개 이미지 등록 완료')}};r.readAsDataURL(f)});}
function addPathAsset(){const path=($('bge-v35-path').value||'').trim();if(!path)return alert('assets/sprites/name.png 같은 상대경로를 입력하세요.');const name=($('bge-v35-path-name').value||path.split('/').pop()||'경로 이미지').trim();const id='path_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);v35.assets.push({id,name,dataUrl:'',url:path});$('bge-v35-path').value='';$('bge-v35-path-name').value='';saveAssets();refreshSelects();$('bge-v35-asset').value=id;toast('상대경로 이미지 등록 완료')}
function applyAsset(){const o=obj();if(!o)return alert('오브젝트를 먼저 선택하세요.');const id=$('bge-v35-asset').value;if(!id)return;setObjectAsset(o,id);const key=$('bge-obj-key');if(key)key.value='asset:'+id;if(ed()){ed().save(false);ed().refresh()}refreshPanel();toast('스프라이트 적용 완료')}
function clearAsset(){const o=obj();if(!o)return alert('오브젝트를 먼저 선택하세요.');setObjectAsset(o,'');const key=$('bge-obj-key');if(key)key.value=o.key||'';if(ed()){ed().save(false);ed().refresh()}refreshPanel();toast('스프라이트 해제 완료')}
function createAt(mx,my){const st=stage(),id=$('bge-v35-place-asset').value,a=asset(id);if(!st||!a)return alert('배치할 이미지를 선택하세요.');if(!Array.isArray(st.objects))st.objects=[];const o={_editorId:'v35_asset_'+Date.now().toString(36),type:'prop',label:a.name||'스프라이트',key:'asset:'+id,assetId:id,customImage:true,rx:clamp01(mx-.05),ry:clamp01(my-.05),rw:.1,rh:.1,cx:clamp01(mx-.05),cy:clamp01(my+.01),cw:.1,ch:.035,interactable:'',note:''};st.objects.push(o);const s=stt();if(s){s.selectedIndex=st.objects.length-1;s.selectedPart='object';s.tool='select'}v35.place=false;updatePlaceButton();if(ed()){ed().save(false);ed().refresh()}refreshPanel();toast('이미지를 씬에 배치했습니다')}
function updatePlaceButton(){const b=$('bge-v35-place');if(b){b.textContent=v35.place?'씬 배치 중지':'씬에 배치 시작';b.classList.toggle('danger',v35.place)}}
function exportPack(){const blob=new Blob([JSON.stringify({version:'bongdam_asset_pack_v35',savedAt:new Date().toISOString(),assets:v35.assets},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bongdam_asset_library_pack_v35.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function importPack(file){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(String(r.result||'{}')),arr=Array.isArray(d.assets)?d.assets:[];if(!arr.length)throw Error('assets 배열이 없습니다.');const ids=new Set(v35.assets.map(a=>a.id));arr.forEach(raw=>{const a=normalizeAsset(raw);if(!a||(!a.dataUrl&&!a.url))return;let id=a.id;if(ids.has(id))id+='_'+Math.random().toString(36).slice(2,5);ids.add(id);a.id=id;v35.assets.push(a)});saveAssets();refreshSelects();if(ed())ed().refresh();toast('에셋팩 가져오기 완료')}catch(e){alert('에셋팩 가져오기 실패: '+e.message)}};r.readAsText(file,'utf-8')}
function deleteSelectedAsset(){const sel=$('bge-v35-asset'),id=sel&&sel.value;if(!id)return;const a=asset(id);if(!a)return;if(!confirm('선택 에셋을 삭제할까요?\n'+(a.name||id)))return;v35.assets=v35.assets.filter(x=>x.id!==id);v35.cache.clear();saveAssets();refreshSelects();if(ed())ed().refresh();toast('에셋 삭제 완료')}
function bindCanvas(){const c=cv();if(!c||v35.bound)return;v35.bound=true;c.addEventListener('mousedown',e=>{const s=stt();if(!s||!s.enabled||!v35.place||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();const p=canvasToMap(e.clientX,e.clientY);createAt(p.x,p.y)},true)}
function patchRefresh(){const E=ed();if(!E||E._v35RefreshPatched)return;const old=E.refresh;E.refresh=function(){old();refreshPanel()};E._v35RefreshPatched=true}
function poll(){const s=stt(),panel=$('bge-v35-asset-panel');if(panel&&s)panel.style.display=s.enabled?'block':'none';refreshPanel();requestAnimationFrame(poll)}
function init(){if(!ed()||typeof STAGES==='undefined'||!cv())return setTimeout(init,150);loadAssets();makePanel();refreshSelects();patchRender();patchRefresh();bindCanvas();poll();window.BongdamEditorV35={assets:v35.assets,refresh:()=>{loadAssets();refreshSelects();if(ed())ed().refresh()}};toast('v3.5 스프라이트 패치 로드 완료')}
/* (v268) 구세대 모듈 부트 차단 — v3.5 (v5.2 에디터로 일원화) */
})();
