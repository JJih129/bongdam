
/* ══ (v199) 건물 팔레트 — 배치·드래그 이동·휠 크기·Del 삭제·Ctrl+Z 통합 언두·자동 저장 ══ */
(function(){
  'use strict';
  const KEY = 'bongdam_rpg_editor_data_v5_2_quest';
  const AR = 1086/1448;
  const TOPDOWN = { bld_apt1:1, bld_apt2:1, bld_apt3:1, bld_apt4:1 };  // 탑다운 단지: 전체 충돌
  const NOCOLL  = { bld_plaza:1 };                                      // 광장: 충돌 없음
  const S = { on:false, sel:null, rh:0.20, inter:'', drag:null, hover:null,
              armedAt:0, stack:[], lastResize:null };

  function meta(id){ return (window.BD_V198_META && BD_V198_META[id]) || null; }
  function rwOf(id, rh){ const m = meta(id); return m ? rh*(m[0]/m[1])*AR : rh; }
  function stg(){ return (typeof STAGES !== 'undefined') ? STAGES[currentStage] : null; }
  function toast(t){ try{ if(typeof bdToast==='function') bdToast(t); }catch(e){} }
  function snapRect(o){ return { rx:o.rx, ry:o.ry, rw:o.rw, rh:o.rh, cx:o.cx, cy:o.cy, cw:o.cw, ch:o.ch }; }

  function applyCollider(o){
    const id = o.assetId;
    if (NOCOLL[id] || o.type === 'prop'){ delete o.cx; delete o.cy; delete o.cw; delete o.ch; return; }
    if (TOPDOWN[id]){ o.cx=o.rx+o.rw*0.02; o.cy=o.ry+o.rh*0.03; o.cw=o.rw*0.96; o.ch=o.rh*0.93; }
    else            { o.cx=o.rx+o.rw*0.05; o.cy=o.ry+o.rh*0.45; o.cw=o.rw*0.90; o.ch=o.rh*0.52; }
  }
  function mapFromEvent(e, cv){
    try{
      const rect = cv.getBoundingClientRect();
      const px = (e.clientX-rect.left)*(cv.width/rect.width);
      const py = (e.clientY-rect.top)*(cv.height/rect.height);
      return { x: camX + VIEWPORT_W*(((px-cv.width/2)/currentScale + BASE_W/2)/BASE_W - 0.5),
               y: camY + VIEWPORT_H*(((py-cv.height/2)/currentScale + BASE_H/2)/BASE_H - 0.5) };
    }catch(err){ return null; }
  }
  function bldAt(x, y){
    const st = stg(); if(!st || !st.objects) return null;
    for (let i = st.objects.length-1; i >= 0; i--){
      const o = st.objects[i];
      if (o && o.assetId && String(o.assetId).indexOf('bld_') === 0 &&
          x >= o.rx && x <= o.rx+o.rw && y >= o.ry && y <= o.ry+o.rh) return o;
    }
    return null;
  }

  /* ── 통합 언두 스택 + 자동 저장 ── */
  function push(a){ S.stack.push(a); if (S.stack.length > 50) S.stack.shift(); }
  let saveT = null;
  function save(now){
    clearTimeout(saveT);
    const doIt = function(){
      try{
        // (v269) 저장 일원화 — v5.2 표준 직렬화(exportableData: stages+npcPos+정리)를 사용.
        //  예전엔 stages만 담아 저장해, 팔레트로 건물을 놓을 때마다 NPC 위치가 소실됐다.
        var payload = (typeof window.__bdExportableData === 'function')
          ? window.__bdExportableData()
          : { version:2, savedAt:new Date().toISOString(), stages:STAGES };
        localStorage.setItem(KEY, JSON.stringify(payload));
        toast('\uD83D\uDCBE 맵 저장됨');
      }catch(err){ toast('\u26A0 저장 실패 (용량 확인)'); }
    };
    if (now) doIt(); else saveT = setTimeout(doIt, 700);
  }
  window.BD_editUndo = function(){
    const a = S.stack.pop();
    const st = a && STAGES[a.sid];
    if (!a || !st){ toast('되돌릴 작업이 없어요'); return false; }
    if (a.type === 'place'){ const i = st.objects.indexOf(a.obj); if (i >= 0) st.objects.splice(i, 1); }
    else if (a.type === 'delete'){ st.objects.splice(Math.min(a.idx, st.objects.length), 0, a.obj); }
    else { Object.assign(a.obj, a.before); }
    save(); toast('\u21A9 되돌렸어요'); return true;
  };
  // 기존 위험요소 언두 버튼 → 통합 스택 우선, 비어 있으면 구식 동작 폴백
  const _oldUndo = window.BD_undoHazard;
  window.BD_undoHazard = function(){ if (S.stack.length) return window.BD_editUndo(); if (_oldUndo) return _oldUndo(); };
  // 위험요소 배치도 통합 스택·자동 저장에 편입 (기존엔 리로드 시 유실되던 문제 해결)
  const _oldPlace = window.BD_placeHazardAt;
  if (_oldPlace) window.BD_placeHazardAt = function(rx, ry){
    const st = stg(); const n = st ? st.objects.length : 0;
    _oldPlace(rx, ry);
    if (st && st.objects.length > n){ push({ type:'place', sid:currentStage, obj:st.objects[st.objects.length-1] }); save(); }
  };

  /* ── UI ── */
  let panel = null, btn = null;
  function buildUI(){
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'bd-pal-panel';
    let thumbs = '';
    const A = Object.assign({}, window.BD_BUILTIN_ASSETS || {}, window.__BD_BAKED_ASSETS || {});
    // (v256) 새 건물(nb_) 24종 포함
    const NB_LABELS = {"nb_park3": "공원3", "nb_sang_library": "상리_봉담도서관", "nb_park4": "공원4", "nb_parking_bld": "주차빌딩", "nb_dong_center": "동화리_화성시어린이문화센터", "nb_park2": "공원2", "nb_park1": "공원1", "nb_parking1": "주차장1", "nb_culture_bld": "문화의집_문화의집", "fb_conv_store": "안전거점_편의점", "fb_cafe_malgeun": "카페_맑은샘", "fb_bongdam_library": "봉담도서관", "fb_citizen_campus": "시민캠퍼스·창작소", "fb_cafe_board": "보드게임카페", "fb_park_lake": "봉담호수공원", "fb_park_sambong": "삼봉근린공원", "fb_park_oullim": "어울림공원", "fb_park_deulnyeok": "들녘오름공원", "fb_park_eco_sports": "생태체육공원", "fb_park_doran": "도란도란어린이공원", "fb_park_forest": "웃음만발놀이숲", "fb_park_fountain": "분수대광장", "fb_park_donghwa": "동화마을생태공원", "fb_park_wawoo": "와우리문화공원", "fb_wawoo_complex": "와우도서관·문화의집", "fb_playground": "청소년놀터_솜사탕", "fb_children_culture": "어린이문화센터", "fb_sports_center": "국민체육센터", "fb_green_center": "그린환경센터", "fb_police": "봉담파출소", "fb_eom_museum": "엄미술관", "fb_yeokmal_hall": "역말문화회관", "fb_classe_art": "클라쎄아트홀"};
    Object.keys(A).forEach(function(id){ if(NB_LABELS[id] && !A[id].label) A[id] = Object.assign({}, A[id], {label: NB_LABELS[id]}); });
    Object.keys(A).filter(id => id.indexOf('bld_') === 0 || id.indexOf('nb_') === 0 || id.indexOf('fb_') === 0).forEach(id => {
      thumbs += '<div class="bd-pal-item" data-id="'+id+'"><img src="'+A[id].dataUrl+'" alt=""><div>'+(A[id].name||A[id].label||NB_LABELS[id]||id)+'</div></div>';
    });
    panel.innerHTML =
      '<h3>\uD83C\uDFE2 건물 팔레트</h3>'
      + '<div class="bd-pal-row">크기 <span id="bd-pal-rh">0.20</span>'
      + '<input type="range" id="bd-pal-size" min="0.06" max="0.45" step="0.01" value="0.20"></div>'
      + '<div class="bd-pal-row">상호작용 <select id="bd-pal-inter">'
      + '<option value="">없음</option><option value="shop">상점</option><option value="info">안내 대사</option></select></div>'
      + '<div class="bd-pal-row">이름 <input type="text" id="bd-pal-label" placeholder="(비우면 에셋 이름)"></div>'
      + '<div id="bd-pal-grid">'+thumbs+'</div>'
      + '<button id="bd-pal-save">\uD83D\uDCBE 지금 저장</button>'
      + '<div id="bd-pal-hint">썸네일 선택 → 맵 클릭 = 배치<br>건물 드래그 = 이동 · 휠 = 크기<br>Del = 삭제 · Ctrl+Z = 되돌리기 · ESC = 종료</div>';
    document.body.appendChild(panel);
    panel.querySelector('#bd-pal-size').addEventListener('input', function(){
      // (v249) 손상값 가드 — 빈 값/음수/이상값이 그대로 배치 크기가 되어
      //  높이 -0.1 같은 '보이지 않는 건물'을 만들던 문제
      var v = parseFloat(this.value);
      if (isNaN(v)) v = 0.15;
      S.rh = Math.min(0.5, Math.max(0.05, v));
      panel.querySelector('#bd-pal-rh').textContent = S.rh.toFixed(2);
    });
    panel.querySelector('#bd-pal-inter').addEventListener('change', function(){ S.inter = this.value; });
    panel.querySelector('#bd-pal-save').addEventListener('click', function(){ save(true); });
    panel.querySelector('#bd-pal-grid').addEventListener('click', function(e){
      const it = e.target.closest('.bd-pal-item'); if (!it) return;
      panel.querySelectorAll('.bd-pal-item').forEach(x => x.classList.remove('sel'));
      if (S.sel === it.dataset.id){ S.sel = null; toast('선택 해제'); }
      else { S.sel = it.dataset.id; it.classList.add('sel'); toast('\uD83C\uDFE2 ' + ((A[S.sel]||{}).name||S.sel) + ' — 맵을 클릭해 배치'); }
    });
    // 상단 메뉴 버튼 (위험요소 배치 버튼 옆)
    const menu = document.getElementById('bd-menu-btns');
    const hzBtn = document.getElementById('bd-hazard-place-btn');
    btn = document.createElement('button');
    btn.id = 'bd-building-pal-btn';
    btn.textContent = '\uD83C\uDFE2 건물';
    btn.addEventListener('click', toggle);
    if (menu){ menu.insertBefore(btn, hzBtn || null); }
  }
  function toggle(){
    buildUI();
    S.on = !S.on; S.armedAt = Date.now(); S.sel = null; S.drag = null;
    if (S.on && window.__bdHazardPlaceMode && typeof window.BD_toggleHazardPlace === 'function') window.BD_toggleHazardPlace();
    panel.style.display = S.on ? 'block' : 'none';
    panel.querySelectorAll('.bd-pal-item').forEach(x => x.classList.remove('sel'));
    btn.classList.toggle('bd-on', S.on);
    btn.textContent = S.on ? '\uD83C\uDFE2 배치중' : '\uD83C\uDFE2 건물';
    const cv = document.getElementById('game-canvas'); if (cv) cv.style.cursor = S.on ? 'copy' : '';
    toast(S.on ? '\uD83C\uDFE2 건물 모드 — 썸네일 선택 후 맵 클릭' : '건물 모드 종료');
  }
  window.BD_toggleBuildingPalette = toggle;
  // 상호 배타 반대 방향: 위험요소 배치를 켜면 건물 모드 끔
  const _oldHz = window.BD_toggleHazardPlace;
  if (_oldHz) window.BD_toggleHazardPlace = function(){
    if (!window.__bdHazardPlaceMode && S.on) toggle();
    return _oldHz.apply(this, arguments);
  };

  /* ── 배치 ── */
  function placeAt(id, x, y){
    const st = stg(); if (!st) return;
    const rh = S.rh, rw = rwOf(id, rh);
    const label = (panel.querySelector('#bd-pal-label').value || '').trim()
                  || ((window.BD_BUILTIN_ASSETS[id]||{}).name
                      || (typeof NB_LABELS !== 'undefined' && NB_LABELS[id])   // (v279) 시설 에셋 한글명
                      || id);
    const o = { type:'building', key:'asset:'+id, assetId:id, customImage:true,
                rx: Math.max(0, Math.min(1-rw, x-rw/2)),
                ry: Math.max(0, Math.min(1-rh, y-rh)),
                rw: rw, rh: rh, label: label, interactable: S.inter,
                _editorId: 'pal_' + Date.now().toString(36) };
    if (S.inter === 'info') o.infoLines = [label + '입니다.'];
    applyCollider(o);
    // 기존 bld_ 그룹 뒤에 삽입 → 주민·위험요소보다 아래에 그려지는 v198 규칙 유지
    let idx = -1;
    for (let i = 0; i < st.objects.length; i++){
      const t = st.objects[i];
      if (t && t.assetId && String(t.assetId).indexOf('bld_') === 0) idx = i;
    }
    st.objects.splice(idx + 1, 0, o);
    push({ type:'place', sid:currentStage, obj:o });
    save();
    toast('\u2705 ' + label + ' 배치됨');
  }

  /* ── 마우스 (캡처 단계: 평타 공격 핸들러 선점) ── */
  document.addEventListener('mousedown', function(e){
    if (!S.on || e.button !== 0) return;
    const cv = document.getElementById('game-canvas');
    const onUi = e.target && e.target.closest &&
      e.target.closest('button, input, select, a, label, .bd-modal, #bd-pal-panel, [id^="bd-"], [id^="bge-"], [id^="tc-"]');
    const armed = (Date.now() - S.armedAt) > 300;
    if (!cv || e.target !== cv || onUi || !armed) return;
    const p = mapFromEvent(e, cv); if (!p) return;
    e.preventDefault(); e.stopPropagation();
    const hit = bldAt(p.x, p.y);
    if (hit){ S.drag = { o:hit, dx:p.x-hit.rx, dy:p.y-hit.ry, before:snapRect(hit), moved:false }; cv.style.cursor='grabbing'; return; }
    if (S.sel) placeAt(S.sel, p.x, p.y);
    else toast('썸네일을 먼저 선택하거나, 기존 건물을 드래그하세요');
  }, true);

  document.addEventListener('mousemove', function(e){
    if (!S.on) return;
    const cv = document.getElementById('game-canvas'); if (!cv) return;
    const p = mapFromEvent(e, cv); if (!p) return;
    if (S.drag){
      const o = S.drag.o;
      o.rx = Math.max(0, Math.min(1-o.rw, p.x - S.drag.dx));
      o.ry = Math.max(0, Math.min(1-o.rh, p.y - S.drag.dy));
      applyCollider(o); S.drag.moved = true;
      return;
    }
    if (e.target === cv){
      S.hover = bldAt(p.x, p.y);
      cv.style.cursor = S.hover ? 'move' : (S.sel ? 'copy' : 'default');
    } else S.hover = null;
  }, true);

  document.addEventListener('mouseup', function(){
    if (!S.on || !S.drag) return;
    const d = S.drag; S.drag = null;
    const cv = document.getElementById('game-canvas'); if (cv) cv.style.cursor = 'move';
    if (d.moved){ push({ type:'move', sid:currentStage, obj:d.o, before:d.before }); save(); }
  }, true);

  /* ── 휠 크기 조절 (하단 중앙 고정, 비율 유지) ── */
  document.addEventListener('wheel', function(e){
    if (!S.on) return;
    const cv = document.getElementById('game-canvas');
    if (!cv || e.target !== cv) return;
    const p = mapFromEvent(e, cv); if (!p) return;
    const o = (S.drag && S.drag.o) || bldAt(p.x, p.y); if (!o) return;
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    if (!S.lastResize || S.lastResize.o !== o || now - S.lastResize.at > 800){
      push({ type:'resize', sid:currentStage, obj:o, before:snapRect(o) });
      S.lastResize = { o:o, at:now };
    } else S.lastResize.at = now;
    const f = e.deltaY < 0 ? 1.06 : 1/1.06;
    const cx = o.rx + o.rw/2, by = o.ry + o.rh;
    o.rh = Math.max(0.05, Math.min(0.5, o.rh * f));
    o.rw = rwOf(o.assetId, o.rh);
    o.rx = Math.max(0, Math.min(1-o.rw, cx - o.rw/2));
    o.ry = Math.max(0, Math.min(1-o.rh, by - o.rh));
    applyCollider(o); save();
  }, { capture:true, passive:false });

  /* ── 키 ── */
  document.addEventListener('keydown', function(e){
    if (!S.on) return;
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); toggle(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){
      e.preventDefault(); e.stopPropagation(); window.BD_editUndo(); return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace'){
      const o = S.hover; if (!o) return;
      e.preventDefault(); e.stopPropagation();
      const st = stg(); const i = st.objects.indexOf(o);
      if (i >= 0){
        st.objects.splice(i, 1);
        push({ type:'delete', sid:currentStage, obj:o, idx:i });
        S.hover = null; save(); toast('\uD83D\uDDD1 ' + (o.label||'건물') + ' 삭제됨 (Ctrl+Z 복구)');
      }
    }
  }, true);

  /* 게임 화면이 뜨면 버튼 미리 생성 */
  const bootT = setInterval(function(){
    const menu = document.getElementById('bd-menu-btns');
    if (menu && window.BD_BUILTIN_ASSETS){ clearInterval(bootT); buildUI(); }
  }, 800);
})();
