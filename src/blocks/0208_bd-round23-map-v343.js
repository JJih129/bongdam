
/* (v343) 안전지도 — 배치도 원판 + 상태 오버레이. 상세는 패치 주석 */
(function(){
  'use strict';
  var A = window.__BD_MAP_ASSETS || { bg:{}, icon:{}, mark:{} };
  var BOARD = window.__BD_MAP_BOARD || '';
  /* 배치도 콜라주 구획 (1166×1168 기준 비율) */
  var RG = {
    suyeong:{ sid:210, name:'수영리', x:0,        y:0,        w:272/1166,  h:688/1168 },
    donghwa:{ sid:211, name:'동화리', x:272/1166, y:0,        w:586/1166,  h:688/1168 },
    wawoo:  { sid:212, name:'와우리', x:858/1166, y:0,        w:308/1166,  h:688/1168 },
    sang:   { sid:213, name:'상리',   x:0,        y:688/1168, w:1,         h:480/1168 },
  };
  window.__BD_MAP_RG = RG;   /* (v373) 0226 등에서 칸 좌표 공유 */
  var ORDER = ['suyeong','donghwa','wawoo','sang'];
  /* v343cal — 배치도 ⚠ 위치와 게임 위험요소 좌표의 최소제곱 정합 (스크립트 산출) */
  var CAL = {
 "210": {
  "ax": 0.2440292705123892,
  "bx": -0.002723103665724731,
  "ay": 0.5313302971354927,
  "by": 0.019364578254257622,
  "res": 3.9
 },
 "211": {
  "ax": 0.4940620025360731,
  "bx": 0.23080656886527487,
  "ay": 0.5180774307167815,
  "by": 0.011348143049359773,
  "res": 0.5
 },
 "212": {
  "ax": 0.227738895350578,
  "bx": 0.7405360035495013,
  "ay": 0.5454424720936895,
  "by": 0.0007281732297442287,
  "res": 6.3
 },
 "213": {
  "ax": 0.9436595111005747,
  "bx": 0.0013482782941519732,
  "ay": 0.40535804015602517,
  "by": 0.6005172556207024,
  "res": 8.7
 }
};
  window.__BD_MAP_CAL = CAL;
  function calOf(reg){ return CAL[reg.sid] || { ax:reg.w, bx:reg.x, ay:reg.h, by:reg.y }; }
  /* v343blob — 배치도 그림에서 추출한 건물 블롭 사각형 (라벨 정규화 키) */
  var PATCH = {"210":{"우리홈마트수영점":[0.0635,0.0402,0.0446,0.0334],"수영약국":[0.1432,0.0993,0.0695,0.0693],"통툰화성봉담점":[0,0.1027,0.1184,0.095],"수영리공동주택단지1":[0.1595,0.1096,0.0455,0.0351]},"211":{"역말문화회관":[0.6201,0,0.1081,0.095],"또또마트편의점":[0.6201,0.2072,0.0455,0.0351],"웃음만발놀이숲":[0.3774,0.2877,0.0901,0.0805],"화성시민캠퍼스생활문화창작소":[0.2479,0.0034,0.0866,0.0788],"화성시어린이문화센터":[0.3559,0.2757,0.1201,0.2175],"화성국민체육센터":[0.3756,0.0137,0.1175,0.0608],"봉담1지구분수광장":[0.6184,0.369,0.1063,0.1062],"클라쎄아트홀":[0.253,0.3981,0.0557,0.0736],"동화약국":[0.5472,0.2209,0.0334,0.0325],"동화리공동주택단지2":[0.6029,0.1969,0.0703,0.0693],"동화리공동주택단지1":[0.6364,0.0034,0.0798,0.0719],"보드킹보드게임카페봉담점":[0.3774,0.4024,0.0901,0.0591]},"212":{"와우리문화공원":[0.7581,0.0043,0.0695,0.0676],"봉담와우도서관청소년문화의집":[0.7479,0.1079,0.0858,0.0514],"해피24편의점":[0.9314,0.2098,0.0463,0.0351]},"213":{"청소년놀터‘솜사탕’봉담점":[0.0146,0.607,0.0798,0.0788],"삼봉근린공원":[0.5026,0.6344,0.0455,0.0308],"들녘오름공원":[0.012,0.8099,0.0892,0.1712],"봉담커피앤북작은도서관노노카페":[0.1407,0.6062,0.084,0.0839],"스마일25편의점":[0.6278,0.7286,0.0472,0.036],"봉담호수공원":[0.3756,0.6156,0.1003,0.0659],"화성시립봉담도서관희망카페":[0.2401,0.6199,0.1003,0.0616],"알파문구봉담점":[0.7401,0.6147,0.0866,0.0865],"상리공동주택단지3":[0.7633,0.6387,0.0489,0.0377],"상리공동주택단지1":[0.1501,0.6122,0.0652,0.0728],"화성그린환경센터":[0.5437,0.7217,0.0334,0.0325],"봉담2생태체육공원":[0.4923,0.6096,0.0883,0.0753]}};
  function inReg(reg, fx, fy){
    var m = 0.01;
    return fx >= reg.x - m && fx <= reg.x + reg.w + m && fy >= reg.y - m && fy <= reg.y + reg.h + m;
  }
  function norm(s){ return String(s||'').replace(/[\s_()\-·]/g,''); }
  function pc(v){ return (v*100).toFixed(2)+'%'; }
  /* (v385) 지도 원판은 항상 무채색으로 두고, 실제로 방문한 시설의 사각형만
     같은 원판 좌표를 다시 잘라 올려 색을 복원한다. CSS 변수에 원판을 한 번만
     보관하므로 방문 시설 수만큼 큰 data URI 문자열을 DOM에 복제하지 않는다. */
  function colorPatchStyle(left, top, width, height){
    var w = Math.max(0.001, Math.min(0.999, Number(width) || 0.001));
    var h = Math.max(0.001, Math.min(0.999, Number(height) || 0.001));
    var x = Math.max(0, Math.min(1 - w, Number(left) || 0));
    var y = Math.max(0, Math.min(1 - h, Number(top) || 0));
    var px = x / Math.max(0.001, 1 - w) * 100;
    var py = y / Math.max(0.001, 1 - h) * 100;
    return 'left:'+pc(x)+';top:'+pc(y)+';width:'+pc(w)+';height:'+pc(h)+';'
      + 'background-size:'+(100/w).toFixed(3)+'% '+(100/h).toFixed(3)+'%;'
      + 'background-position:'+px.toFixed(3)+'% '+py.toFixed(3)+'%;';
  }
  window.__BD_MAP_COLOR_PATCH_STYLE = colorPatchStyle;

  /* (v373) 실제 상호작용(시설 창 열림) 기록 — 0099 가 facilityId 로 남기는 bd_concept_facility_visits_v1.
     BD_PROGRESS.facility 쪽은 FMAP(0100)에 있는 일부 시설만 들어가서, «한 번 들어가 본 건물»이 지도에서 계속 회색으로 남았다 */
  function conceptVisited(){
    try{
      var s = window.BD_CONCEPT_FACILITY_STATE || JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1') || '{}');
      return (s && s.visitedFacilityIds) || [];
    }catch(e){ return []; }
  }
  window.BD_mapConceptVisited = conceptVisited;
  function fdVisitMap(){
    var out = {};
    try{
      var FD = BD_REGISTRY.FACILITY_DEFINITIONS;
      var vis = BD_PROGRESS.facility.visitedFacilityIds || [];
      Object.keys(FD).forEach(function(fid){
        out[norm(FD[fid].displayName)] = vis.indexOf(fid)>=0;
      });
    }catch(e){}
    return out;
  }

  function regionNodes(key){
    var reg = RG[key];
    var mp = null; try{ mp = BD_MapProgress.region(key); }catch(e){}
    var unlockedIds = (window.BD_PROGRESS && BD_PROGRESS.story.unlockedRegionIds) || ['wawoo'];
    var unlocked = unlockedIds.indexOf(key)>=0;
    var html = '';
    /* 이름·% 칩 */
    html += '<div class="m42-rname" style="left:'+pc(reg.x+0.008)+';top:'+pc(reg.y+0.010)+'">'+reg.name+'</div>';
    html += '<div class="m42-pct" style="left:'+pc(reg.x+reg.w-0.055)+';top:'+pc(reg.y+0.010)+'">'+(mp?mp.pct:0)+'%</div>';
    if (mp && mp.core) html += '<div class="m42-done" style="left:'+pc(reg.x+0.008)+';top:'+pc(reg.y+reg.h-0.035)+'">✔ 지도 완성</div>';
    if (!unlocked){
      html += '<div class="m42-lockov" style="left:'+pc(reg.x)+';top:'+pc(reg.y)+';width:'+pc(reg.w)+';height:'+pc(reg.h)+'">🔒</div>';
      return html;
    }
    /* (v346) 지도 완성 리 = 스카이블루 «활성» 합성 패널 */
    var DONE = window.__BD_MAP_DONE || {};
    if (mp && mp.core && DONE[reg.sid]){
      html += '<img class="m42-donebg" src="'+DONE[reg.sid]+'" style="left:'+pc(reg.x)+';top:'+pc(reg.y)+';width:'+pc(reg.w)+';height:'+pc(reg.h)+'">';
    }
    try{
      var st = STAGES[reg.sid] || {};
      var vmap = fdVisitMap();
      var cvis = conceptVisited();
      var coreDone = !!(mp && mp.core);
      var seen = {};
      /* 시설(랜드마크): 미방문=어둡게 패치 / 방문=✓ */
      var lms = st.__v24Landmarks || [];
      for (var i=0;i<lms.length;i++){
        var o = lms[i]; if (!o || !o.label) continue;
        var nn = norm(o.label); if (seen[nn]) continue; seen[nn] = 1;
        var tracked = (nn in vmap) ? vmap[nn]
          : (function(){ for (var k in vmap){ if (k.indexOf(nn)>=0 || nn.indexOf(k)>=0) return vmap[k]; } return null; })();
        /* (v373) 방문 판정 = 시설 창을 한 번이라도 연 기록(facilityId) ∪ 장소수첩 기록(이름 매칭).
           facilityId 가 있는데 두 기록에 다 없으면 «미방문(회색)» — 리 완성 여부로 뭉뚱그리지 않는다 */
        var byId = !!(o.facilityId && cvis.indexOf(o.facilityId) >= 0);
        var visited = byId || (tracked===null ? (o.facilityId ? false : coreDone) : tracked);
        var pt = (PATCH[reg.sid]||{})[nn];
        if (!pt) continue;                          /* 배치도 그림에 없는 건물 — 표시 생략 */
        var pd = 0.004;
        var L = pt[0]-pd, T = pt[1]-pd, W = pt[2]+pd*2, H = pt[3]+pd*2;
        if (visited){
          /* (v368) ✅ 이모지가 이웃 건물을 가리던 문제(QA ISSUE-05) → 건물 외곽 글로우 + 모서리 작은 ✓ 배지 */
          html += '<div class="m42-colorpatch m42-vok" style="'+colorPatchStyle(L,T,W,H)+'" title="'+String(o.label).replace(/['"]/g,'')+' (방문)"><span class="m42-vbadge">✓</span></div>';
        } else {
          var wx46 = (Number(o.rx)||0) + (Number(o.rw)||0.04)/2;
          var wy46 = (Number(o.ry)||0) + (Number(o.rh)||0.05)/2;
          var lb46 = String(o.label).replace(/['"]/g, '');
          html += '<div class="m42-dimp" style="left:'+pc(L)+';top:'+pc(T)+';width:'+pc(W)+';height:'+pc(H)+'"'
            + ' title="'+lb46+' — 누르면 길찾기 추적"'
            + ' onclick="BD_mapTrackStart('+reg.sid+',\''+lb46+'\','+wx46.toFixed(4)+','+wy46.toFixed(4)+')"></div>';
        }
      }
      /* 위험요소: ⚠(원판 아이콘 덮기) / 정화완료 */
      (st.objects||[]).forEach(function(o){
        if (!o || !o.hazardId || o.isBoss || String(o.hazardId).indexOf('final_boss')===0) return;
        var pure = !!(window.BD && BD.purified && BD.purified[o.hazardId]);
        var C2 = calOf(reg);
        var cx = C2.ax*((Number(o.rx)||0) + (Number(o.rw)||0.04)/2)+C2.bx;
        var cy = C2.ay*((Number(o.ry)||0) + (Number(o.rh)||0.05)/2)+C2.by;
        if (!inReg(reg, cx, cy)) return;
        var drop = (cy - reg.y) < 0.045;   /* (v368) 칸 상단에 붙은 마커는 핀 대신 아래로 매달아 잘림 방지 */
        html += '<div class="m42-mk '+(pure?'m42-pure m42-float':'m42-hz')+(drop?' m42-drop':'')+'" style="left:'+pc(cx)+';top:'+pc(cy)+'">'
          + '<img src="'+(pure?A.mark['정화완료']:A.mark['위험요소'])+'" alt=""></div>';
      });
      /* (v369) 내 위치 마커 — 현재 스테이지 리에 히어로 좌표를 CAL 정합으로 표시 (열려 있는 동안 갱신은 아래 인터벌) */
      if (Number(currentStage) === reg.sid){
        var CH = calOf(reg);
        var hx = CH.ax*Number(heroX)+CH.bx, hy = CH.ay*Number(heroY)+CH.by;
        if (inReg(reg, hx, hy)) html += '<div class="m42-hero" id="m42-hero" data-sid="'+reg.sid+'" style="left:'+pc(hx)+';top:'+pc(hy)+'" title="내 위치"><span class="m42-hero-ring"></span><span class="m42-hero-dot"></span><span class="m42-hero-lb">나</span></div>';
      }
    }catch(e){}
    return html;
  }

  /* (v369) 지도가 열려 있는 동안 내 위치 마커 갱신 (이동 중 열림·터치 등) */
  setInterval(function(){
    try{
      var el = document.getElementById('m42-hero'); if (!el) return;
      var reg = null; for (var k in RG){ if (RG[k].sid === Number(currentStage)) reg = RG[k]; }
      if (!reg || Number(el.getAttribute('data-sid')) !== reg.sid){ el.style.display = 'none'; return; }
      var C = calOf(reg); var hx = C.ax*Number(heroX)+C.bx, hy = C.ay*Number(heroY)+C.by;
      el.style.display = ''; el.style.left = pc(hx); el.style.top = pc(hy);
    }catch(e){}
  }, 250);

  function tipText(){
    try{
      if (window.BD && BD.gameCleared) return '✨ 봉담 안전지도 완성! 이제 어디든 자유롭게 다녀요.';
      if (window.BD && (BD.questIdx || 0) === 0) return '🔰 먼저 문화의집에서 배지를 받고, 엘리베이터를 타고 밖으로 나가요!';
      var all = BD_MapProgress.all();
      var unlocked = (window.BD_PROGRESS && BD_PROGRESS.story.unlockedRegionIds) || ['wawoo'];
      var NAME = { wawoo:'와우리', donghwa:'동화리', suyeong:'수영리', sang:'상리' };
      for (var i=0;i<all.length;i++){
        var r = all[i];
        if (unlocked.indexOf(r.regionId)<0 || r.core) continue;
        if (r.req.max>0 && r.req.cur<r.req.max) return '🔰 '+NAME[r.regionId]+' 주민의 부탁이 '+(r.req.max-r.req.cur)+'건 남았어요!';
        if (r.pur.cur<r.pur.max) return '💦 '+NAME[r.regionId]+'에 정화할 위험요소가 '+(r.pur.max-r.pur.cur)+'곳 남았어요.';
        if (!r.stamp) return '🔰 '+NAME[r.regionId]+' 핵심 시설을 체험하고 스탬프를 받아요!';
      }
      if (window.BD_finaleOpen && BD_finaleOpen()) return '❗ 네 지역이 모두 밝아졌어요! 와우리 광장의 큰 그림자에 가 봐요.';
      return '🔰 버스를 타고 다음 동네로 가서 지도를 넓혀 봐요!';
    }catch(e){ return '지도를 살펴봐요!'; }
  }

  function render(){
    var board = document.getElementById('bd-map-v342-board'); if (!board) return;
    /* 색이 들어간 완성 원판을 직접 배경으로 쓰면 0%에서도 전부 활성화돼 보인다.
       무채색 원판을 별도 레이어로 먼저 깔고 진행 요소만 위에서 색을 되살린다. */
    var html = '<div class="m42-base" aria-hidden="true"></div>';
    ORDER.forEach(function(k){ html += regionNodes(k); });
    board.innerHTML = html;
    try{
      var all = BD_MapProgress.all();
      var pur = {c:0,m:0}, vis = {c:0,m:0}, stamps = 0, tot = 0;
      all.forEach(function(r){ pur.c+=r.pur.cur; pur.m+=r.pur.max; vis.c+=r.visit.cur; vis.m+=r.visit.max; if(r.stamp) stamps++; tot+=r.pct; });
      var f = document.getElementById('bd-map-v342-stats');
      if (f) f.innerHTML = '전체 <b>'+Math.round(tot/all.length)+'%</b>'
        + ' · 정화 <b>'+pur.c+'/'+pur.m+'</b> · 시설 방문 <b>'+vis.c+'/'+vis.m+'</b> · 스탬프 <b>'+stamps+'/4</b>';
      var t = document.getElementById('bd-map-v342-tip');
      if (t) t.textContent = tipText();
    }catch(e){}
  }

  function ensure(){
    var d = document.getElementById('bd-map-v342');
    if (d) return d;
    d = document.createElement('div');
    d.id = 'bd-map-v342';
    d.className = 'bd-modal';
    d.innerHTML = '<div class="m42-panel">'
      + '<div class="m42-head">'
      +   '<div class="m42-title">🗺️ 봉담 안전지도</div>'
      +   '<div class="m42-tip" id="bd-map-v342-tip"></div>'
      +   '<button class="m42-x" style="margin-right:8px;background:#2c2412;color:#ffd86b;" onclick="BD_closeSafetyMap();window.BD_openCardCollection&&BD_openCardCollection()">🏷️ 도장수첩</button>' // (v390) 메뉴줄 장소수첩 버튼 흡수
      +   '<button class="m42-x" onclick="BD_closeSafetyMap()">닫기 (ESC)</button>'
      + '</div>'
      + '<div class="m42-board" id="bd-map-v342-board" style="--m42-board:url('+BOARD+')"></div>'
      + '<div class="m42-foot">'
      +   '<span id="bd-map-v342-stats"></span>'
      +   '<span style="flex:1"></span>'
      +   '<span class="m42-leg"><img src="'+(A.mark['위험요소']||'')+'">위험요소</span>'
      +   '<span class="m42-leg"><img src="'+(A.mark['정화완료']||'')+'">정화 완료</span>'
      +   '<span class="m42-leg">🌑 어두운 곳 = 아직 해결 전</span>'
      + '</div>'
      + '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', function(ev){
      if (ev.target !== d) return;
      if (Date.now() - (window.__bdMapOpenAt||0) < 300) return;   /* (v391) 터치 고스트 클릭 가드 */
      close();
    });
    return d;
  }
  var refreshTimer = null;
  function open(){
    window.__bdMapOpenAt = Date.now();
    var d = ensure();
    render();
    d.classList.add('show');
    clearInterval(refreshTimer);
    refreshTimer = setInterval(function(){ if (d.classList.contains('show')) render(); else clearInterval(refreshTimer); }, 1500);
  }
  function close(){
    var d = document.getElementById('bd-map-v342');
    if (d) d.classList.remove('show');
    clearInterval(refreshTimer);
  }
  window.BD_openSafetyMap = open;
  window.BD_closeSafetyMap = close;
  /* M키·ESC — window 캡처로 선점 */
  window.addEventListener('keydown', function(e){
    if (e.repeat) return;   /* (v391) 키 자동 반복이 열림/닫힘을 수십 번 토글 — 누르고 있으면 꺼지는 증상의 원인 */
    var k = (e.key||'').toLowerCase();
    var d = document.getElementById('bd-map-v342');
    var isOpen = !!(d && d.classList.contains('show'));
    if (k==='escape' && isOpen){ e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    if (k!=='m') return;
    if (isOpen){ e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
    try{ if (window.BD_isInputBlocked && BD_isInputBlocked()) return; }catch(e2){}
    e.preventDefault(); e.stopImmediatePropagation(); open();
  }, true);
  /* 구 v283 지도가 다른 경로로 뜨면 대체 */
  setInterval(function(){
    try{
      var old = document.getElementById('bd-map-v283');
      if (old && getComputedStyle(old).display !== 'none'){ old.style.display = 'none'; open(); }
    }catch(e){}
  }, 800);
})();
