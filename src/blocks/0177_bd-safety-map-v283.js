
/* (v283) 봉담 안전지도 대작전 — 지도 UI + 지역 완성 보상
   · 지도는 담이가 품고 있다는 설정: 담이 얼굴 + 추천 목표가 헤더
   · 지역 % = BD_MapProgress (부탁40/정화25/스탬프20/방문10/인사5)
   · 지역 core(부탁+정화+스탬프) 완성 → 배지 스킬 지급 (기존 챕터 보상에서 이관)
   · 열기: 상단 🗺️ 버튼 / M 키 · 닫기: ESC/버튼 */
(function(){
  'use strict';
  window.__bdMapSkillMode = true;

  var REGION = [
    { id:'wawoo',   sid:212, name:'와우리',  skill:'fan',   x:478, y:44,  w:222, h:186 },
    { id:'donghwa', sid:211, name:'동화리',  skill:'cheer', x:250, y:44,  w:206, h:186 },
    { id:'suyeong', sid:210, name:'수영리',  skill:'light', x:22,  y:44,  w:206, h:186 },
    { id:'sang',    sid:213, name:'상리',    skill:'wash',  x:22,  y:296, w:678, h:170 },
  ];
  var SKILL_NAME = { fan:'노트 부채질', wash:'물청소 정화', cheer:'힘내라 봉담!', light:'안전 점검 라이트' };
  var GRANT_KEY = 'bd_map_skill_v283';
  function grants(){ try{ return JSON.parse(localStorage.getItem(GRANT_KEY)||'{}'); }catch(e){ return {}; } }
  function saveGrants(g){ try{ localStorage.setItem(GRANT_KEY, JSON.stringify(g)); }catch(e){} }
  function save(){ try{ (window.bdSave||window.BD_save||function(){})(); }catch(e){} }

  /* ── 지역 완성 감시: core 도달 → 스킬 지급 ── */
  function watchCores(){
    try{
      if (!window.BD_MapProgress || !window.BD) return;
      var g = grants();
      BD_MapProgress.all().forEach(function(r){
        var reg = null;
        for (var i=0;i<REGION.length;i++) if (REGION[i].id===r.regionId) reg = REGION[i];
        if (!reg) return;
        if (g[r.regionId]) return;
        if (BD.unlockedSkills && BD.unlockedSkills.indexOf(reg.skill)>=0){ g[r.regionId]=1; saveGrants(g); return; }
        if (!r.core) return;
        g[r.regionId] = 1; saveGrants(g);
        try{ BD.unlockedSkills.push(reg.skill); BD._pendingSkillIntro = reg.skill; }catch(eS){}
        try{ bdToast('🗺️ ' + reg.name + ' 안전지도 완성!'); }catch(eT){}
        setTimeout(function(){ try{ bdToast('🎁 새 배지 스킬 획득: ' + SKILL_NAME[reg.skill] + ' — E 가방에서 장착할 수 있어요'); }catch(e){} }, 1600);
        setTimeout(function(){ try{ if(window.BD_DAMI) BD_DAMI.show('제 지도의 ' + reg.name + ' 칸이 전부 밝아졌어요! 그 마음이 「' + SKILL_NAME[reg.skill] + '」 스킬이 됐어요.', { face:'proud' }); }catch(e){} }, 2600);
        save();
      });
    }catch(e){}
  }

  /* ── 시설 스탬프·안전 조각 → 담이 발화 보강 ── */
  function wrapProgressSpeech(){
    try{
      if (window.BD_Facility && !BD_Facility.__v283Wrap){
        var og = BD_Facility.grantStamp.bind(BD_Facility);
        BD_Facility.grantStamp = function(fid){
          var ok = og(fid);
          if (ok){
            try{
              var f = BD_REGISTRY.FACILITY_DEFINITIONS[fid];
              var n = BD_PROGRESS.facility.facilityStampIds.length;
              setTimeout(function(){ try{ if(window.BD_DAMI && window.BD_PROGRESS && BD_PROGRESS.story.badgeAwakened) BD_DAMI.show('제 지도에 「' + (f?f.displayName:fid) + '」 스탬프가 새겨졌어요! (' + n + '개째)', { face:'proud', once:'stamp_' + fid }); }catch(e){} }, 1400);
            }catch(e2){}
          }
          return ok;
        };
        BD_Facility.__v283Wrap = true;
      }
      if (window.BD_Chapter && !BD_Chapter.__v283Wrap){
        var oc = BD_Chapter.check.bind(BD_Chapter);
        BD_Chapter.check = function(){
          var before = 0;
          try{ before = BD_PROGRESS.safety.collectedSafetyFragmentIds.length; }catch(e){}
          var rv = oc();
          try{
            var after = BD_PROGRESS.safety.collectedSafetyFragmentIds.length;
            if (after > before){
              setTimeout(function(){ try{ if(window.BD_DAMI && window.BD_PROGRESS && BD_PROGRESS.story.badgeAwakened) BD_DAMI.show('안전 조각이 지도에 끼워졌어요! (' + after + '/4) 지도가 점점 완성돼 가요.', { face:'proud' }); }catch(e){} }, 2400);
            }
          }catch(e3){}
          return rv;
        };
        BD_Chapter.__v283Wrap = true;
      }
    }catch(e){}
  }

  /* ── 지도 렌더 ── */
  function el(id){ return document.getElementById(id); }
  function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
  function recommend(){
    try{
      if (window.BD && BD.gameCleared) return { t:'봉담 안전지도 완성! 이제 어디든 자유롭게 다녀요.', f:'✨' };
      var all = BD_MapProgress.all();
      var unlocked = (window.BD_PROGRESS && BD_PROGRESS.story.unlockedRegionIds) || ['wawoo'];
      for (var i=0;i<all.length;i++){
        var r = all[i];
        if (unlocked.indexOf(r.regionId) < 0) continue;
        if (r.core) continue;
        var reg = REGION.filter(function(x){ return x.id===r.regionId; })[0];
        if (r.req.max>0 && r.req.cur<r.req.max) return { t: reg.name + ' 주민의 부탁이 ' + (r.req.max-r.req.cur) + '건 남았어요. ❗ 주민을 찾아가 봐요!', f:'🔰' };
        if (r.pur.cur<r.pur.max) return { t: reg.name + '에 정화할 위험요소가 ' + (r.pur.max-r.pur.cur) + '곳 남았어요.', f:'💦' };
        if (!r.stamp) return { t: reg.name + '의 핵심 시설을 체험하고 스탬프를 받으면 지도가 완성돼요!', f:'🔰' };
      }
      if (window.BD_finaleOpen && BD_finaleOpen()) return { t:'네 지역의 지도가 모두 밝아졌어요…! 와우리 광장의 큰 그림자에 가 봐요.', f:'❗' };
      return { t:'버스를 타고 다음 동네로 가서 지도를 넓혀 봐요!', f:'🔰' };
    }catch(e){ return { t:'지도를 살펴봐요!', f:'🔰' }; }
  }

  function regionSvg(r, data, unlocked){
    var p = Math.max(0, Math.min(100, data.pct)) / 100;
    var sat = (0.15 + 0.85*p).toFixed(2);
    var bri = (0.55 + 0.45*p).toFixed(2);
    var fill = { wawoo:'#8fce7f', donghwa:'#e8b86f', suyeong:'#7fb8e0', sang:'#caa1dd' }[r.id] || '#999';
    var dots = '';
    var dx = r.x + 14, dy = r.y + r.h - 40;
    for (var i=0;i<data.pur.max;i++){
      var done = i < data.pur.cur;
      dots += '<circle cx="'+(dx+i*20)+'" cy="'+dy+'" r="6" fill="'+(done?'#ffe27a':'#c0392b')+'" stroke="rgba(0,0,0,.35)"/>' +
              (done ? '<text x="'+(dx+i*20)+'" y="'+(dy+4)+'" font-size="9" text-anchor="middle">✦</text>' : '');
    }
    var facs = '';
    for (var j=0;j<data.visit.max;j++){
      var vs = j < data.visit.cur;
      facs += '<text x="'+(dx+j*22)+'" y="'+(dy+22)+'" font-size="14" text-anchor="middle" opacity="'+(vs?'1':'0.28')+'">🏛️</text>';
    }
    var ringR = 20, cx2 = r.x + r.w - 34, cy2 = r.y + 34;
    var circ = 2*Math.PI*ringR;
    var ring = '<circle cx="'+cx2+'" cy="'+cy2+'" r="'+ringR+'" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.25)" stroke-width="4"/>' +
      '<circle cx="'+cx2+'" cy="'+cy2+'" r="'+ringR+'" fill="none" stroke="#ffd86b" stroke-width="4" stroke-linecap="round" ' +
      'stroke-dasharray="'+(circ*p).toFixed(1)+' '+circ.toFixed(1)+'" transform="rotate(-90 '+cx2+' '+cy2+')"/>' +
      '<text x="'+cx2+'" y="'+(cy2+4)+'" font-size="12" font-weight="800" text-anchor="middle" fill="#fff">'+data.pct+'%</text>';
    var extra = '';
    if (r.id === 'wawoo') extra = '<text x="'+(r.x+26)+'" y="'+(r.y+34)+'" font-size="18">🏠</text><text x="'+(r.x+46)+'" y="'+(r.y+36)+'" font-size="10" fill="#fff">문화의집</text>';
    var lock = unlocked ? '' :
      '<rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" rx="14" fill="rgba(8,10,18,.55)"/>' +
      '<text x="'+(r.x+r.w/2)+'" y="'+(r.y+r.h/2+8)+'" font-size="26" text-anchor="middle">🔒</text>';
    var stampMark = data.stamp ? '<text x="'+(r.x+r.w-58)+'" y="'+(r.y+r.h-14)+'" font-size="16">🏅</text>' : '';
    var doneMark = data.core ? '<text x="'+(r.x+14)+'" y="'+(r.y+r.h-52)+'" font-size="13" fill="#c9f7c9" font-weight="800">✔ 지도 완성</text>' : '';
    return '<g style="filter:saturate('+sat+') brightness('+bri+');">' +
      '<rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" rx="14" fill="'+fill+'" stroke="rgba(255,255,255,.4)" stroke-width="2"/>' +
      '<text x="'+(r.x+14)+'" y="'+(r.y+(r.id==='wawoo'?58:30))+'" font-size="17" font-weight="800" fill="#1c2430">'+r.name+'</text>' +
      extra + dots + facs + ring + stampMark + doneMark +
      '</g>' + lock;
  }

  function render() { /* (v381) 구 v283 지도 UI 제거 — 신 지도(v343)가 담당 */ }

  function build(){
    if (el('bd-map-v283')) return;
    var d = document.createElement('div');
    d.id = 'bd-map-v283';
    d.style.cssText = 'position:fixed;inset:0;z-index:10055;display:none;align-items:center;justify-content:center;background:rgba(8,10,18,.72);';
    d.innerHTML =
      '<style>#bd-map-v283 .bd-map-pulse{animation:bdMapPulse 1.4s ease-in-out infinite;transform-origin:360px 255px;}@keyframes bdMapPulse{0%,100%{opacity:1}50%{opacity:.55}}</style>' +
      '<div style="width:min(760px,94vw);max-height:92vh;overflow:auto;background:#141a2c;border:2px solid #b8862f;border-radius:16px;padding:16px 18px;box-shadow:0 12px 48px rgba(0,0,0,.6);">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
        '<div style="font-size:18px;font-weight:800;color:#f0d492;">🗺️ 봉담 안전지도</div>' +
        '<div style="font-size:11px;color:#9fb3d9;">담이가 기록하는 우리 동네 지도</div>' +
        '<div style="flex:1"></div>' +
        '<button id="bd-map-v283-replay" style="display:none;background:#3a2c12;color:#f0d492;border:1px solid #b8862f;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">🎬 엔딩 다시 보기</button>' +
        '<button id="bd-map-v283-close" style="background:#b8862f;color:#141a2c;border:0;border-radius:8px;padding:6px 14px;font-weight:800;cursor:pointer;">닫기</button>' +
      '</div>' +
      '<div id="bd-map-v283-dami" style="display:flex;align-items:center;background:rgba(13,20,40,.9);border:1px solid rgba(255,216,107,.4);border-radius:10px;padding:9px 12px;font-size:13px;color:#e8eefc;margin-bottom:10px;"></div>' +
      '<div id="bd-map-v283-body"></div>' +
      '<div style="margin-top:8px;font-size:11px;color:#8ea0c0;">● 위험요소 (✦ 정화됨) · 🏛️ 시설 방문 · 🏅 활동 스탬프 · 지역의 색은 지도를 채울수록 살아나요 · M 키로 언제든 열 수 있어요</div>' +
      '</div>';
    document.body.appendChild(d);
    el('bd-map-v283-close').addEventListener('click', close);
    d.addEventListener('click', function(ev){ if (ev.target === d) close(); });
    /* (v290) 시설 설명 툴팁 — 커서를 올리면 해당 시설 설명 팝업 */
    var tip = document.getElementById('bd-map-tip');
    if (!tip){
      tip = document.createElement('div');
      tip.id = 'bd-map-tip';
      tip.style.cssText = 'position:fixed;z-index:10060;display:none;max-width:270px;background:#0f1526;'
        + 'border:1px solid #b8862f;border-radius:10px;padding:10px 12px;color:#e8eefc;font-size:12px;'
        + 'line-height:1.55;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.5);';
      document.body.appendChild(tip);
    }
    d.addEventListener('mouseover', function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('button[data-bd-fac]') : null;
      if (!b){ tip.style.display = 'none'; return; }
      var info = (window.__bdMapChipInfo || {})[b.getAttribute('data-bd-fac')];
      if (!info){ tip.style.display = 'none'; return; }
      tip.innerHTML = '<div style="font-weight:800;color:#ffd86b;margin-bottom:4px;">' + info.name + '</div>'
        + (info.sum ? '<div>' + info.sum + '</div>' : '')
        + (info.act ? '<div style="margin-top:4px;color:#9fd08f;">🙌 ' + info.act + '</div>' : '')
        + (info.addr ? '<div style="margin-top:4px;color:#8ea0c0;font-size:11px;">📍 ' + info.addr + '</div>' : '');
      tip.style.display = 'block';
    });
    d.addEventListener('mousemove', function(ev){
      if (tip.style.display === 'none') return;
      tip.style.left = Math.min(ev.clientX + 14, innerWidth - 290) + 'px';
      tip.style.top = Math.min(ev.clientY + 14, innerHeight - 140) + 'px';
    });
    d.addEventListener('mouseout', function(){ tip.style.display = 'none'; });
    /* 클릭 → 추적 지정 */
    d.addEventListener('click', function(ev){
      var b = ev.target && ev.target.closest ? ev.target.closest('button[data-bd-fac]') : null;
      if (!b) return;
      var fid = b.getAttribute('data-bd-fac');
      close();
      tip.style.display = 'none';
      window.__bdMapTrackFid = fid;
      try{ bdToast('📍 ' + (b.textContent||'').replace('📍','').trim() + ' — 화살표를 따라가요'); }catch(eT2){}
      try{ if (window.BD_DAMI) BD_DAMI.show('발 앞 화살표가 그곳을 가리키고 있어요!', { face:'base' }); }catch(eD2){}
    });
    var rp = el('bd-map-v283-replay');
    if (rp) rp.addEventListener('click', function(){ close(); try{ window.BD_showEnding && BD_showEnding(); }catch(e){} });
  }
  function isOpen(){ try{ var m=document.getElementById('bd-map-v342'); return !!(m&&m.classList.contains('show')); }catch(e){ return false; } }
  function open() { /* (v381) 신 지도 위임 */ try { if (window.BD_openSafetyMap && window.BD_openSafetyMap !== open) return window.BD_openSafetyMap(); } catch (e) {} }
  function close() { try { if (window.BD_closeSafetyMap) BD_closeSafetyMap(); } catch (e) {} }
  window.BD_openSafetyMap = open;          // 상단 🗺️ 버튼 대체 (구 안전지도 모달 대신)
  window.BD_openSafetyMapV283 = open;

  document.addEventListener('keydown', function(e){
    try{
      if (e.key === 'Escape' && isOpen()){ e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
      if ((e.key === 'm' || e.key === 'M') && !e.repeat){
        if (document.querySelector('.bd-modal.show')) return;   /* (v381) 일시정지 등 모달 위에서 지도 열림 방지 */
        var tag = (e.target && e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (window.HSR && HSR.active) return;
        if (window.__bdSceneActive) return;
        var vn = document.getElementById('dialogue-box');
        if (vn && vn.offsetHeight > 0) return;
        var gs = document.getElementById('game-screen');
        if (!gs || gs.style.display !== 'block') return;
        if (isOpen()) close(); else open();
      }
    }catch(e2){}
  }, true);

  /* 열려 있는 동안 주기 갱신 + 감시자 */
  function tick(){ wrapProgressSpeech(); watchCores(); if (isOpen()) render(); }
  if (window.BD_addTick) BD_addTick(tick, 1300);
  else setInterval(tick, 1300);
})();
