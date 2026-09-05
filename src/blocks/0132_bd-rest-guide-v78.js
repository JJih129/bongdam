
/* (v78) 회복 동선
   ① 문화시설(문화의집·도서관 등) 건물 상호작용 → "휴식을 즐겼다!" 전체 회복
   ② 전투 후 체력이 50% 아래로 떨어지면 담이가 가장 가까운 문화시설로 안내
      — 진행 중이던 안내는 잠시 멈추고 먼저 출력한 뒤, 원래 안내를 복구한다 */
(function(){
  'use strict';
  // (v87) 회복 가능한 문화시설 인식 확대 — 지역에 따라 시설이 없어 회복 안내가 뜨지 않던 문제
  var REST_RX = /문화의집|청소년문화의집|도서관|문화센터|어린이문화센터|체육센터|체육관|주민센터|복지관|문화회관|생활문화|캠퍼스|보건소/;   /* (v332) 카페 제외 — 대형 문화·공공만 */
  function maxHP(){ try{ if (typeof getMaxHP === 'function') return getMaxHP(); if (window.BD && BD.maxHp) return BD.maxHp; }catch(e){} return 100; }
  function toast(t, d){
    // (v96) 이 빌드의 토스트 정식 이름은 BD_toast — bdToast만 쓰면 안내가 아예 안 떴다
    try{ if (typeof window.BD_toast === 'function'){ window.BD_toast(t, d||3200); return; } }catch(e){}
    try{ if (typeof bdToast === 'function'){ bdToast(t, d||3200); return; } }catch(e){}
    banner(t, d||3600);
  }
  /* (v109) 담이 대사창 형태 말풍선 — 필드 안내용 (전투 튜토와 같은 모양) */
  var _bub = null;
  function damiBubble(text, ms){
    try{
      if (!_bub){
        _bub = document.createElement('div');
        _bub.id = 'bd-dami-field-bubble';
        _bub.style.cssText = 'position:fixed;left:24px;bottom:16%;z-index:1650;'
          + 'max-width:min(520px,74vw);display:flex;align-items:flex-end;gap:10px;'
          + 'opacity:0;transition:opacity .2s ease;pointer-events:none;';
        _bub.innerHTML =
          '<div style="width:44px;height:44px;border-radius:50%;flex:0 0 44px;'
          + 'background:radial-gradient(circle at 35% 30%, #ffe9a8, #f0a93c);'
          + 'box-shadow:0 0 16px rgba(255,200,90,.7);display:flex;align-items:center;'
          + 'justify-content:center;font-size:22px;">🔰</div>'
          + '<div style="background:rgba(252,248,236,.97);border:2px solid #e4c98a;'
          + 'border-radius:14px;padding:11px 16px;color:#2a2418;font-size:14px;font-weight:700;'
          + 'line-height:1.5;box-shadow:0 8px 20px rgba(0,0,0,.35);">'
          + '<div style="font-size:11px;color:#9a7b3a;margin-bottom:3px;">담이</div>'
          + '<div id="bd-dfb-text"></div></div>';
        document.body.appendChild(_bub);
      }
      var t = document.getElementById('bd-dfb-text');
      if (t) t.textContent = text;
      _bub.style.opacity = '1';
      clearTimeout(_bub.__t);
      _bub.__t = setTimeout(function(){ try{ _bub.style.opacity='0'; }catch(e){} }, ms || 5200);
    }catch(e){}
  }

  /* (v96) 담이 안내 배너 — 담이 말풍선이 표시되지 않는 상황에서도 안내가 보이도록 */
  function banner(text, ms){
    try{
      var el = document.getElementById('bd-rest-banner');
      if (!el){
        el = document.createElement('div');
        el.id = 'bd-rest-banner';
        el.style.cssText = 'position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:1650;'
          + 'max-width:min(680px,92vw);padding:12px 18px;border-radius:14px;'
          + 'background:rgba(20,24,36,.95);border:1px solid rgba(255,216,107,.5);color:#ffe9a8;'
          + 'font-size:14px;font-weight:700;box-shadow:0 8px 22px rgba(0,0,0,.45);'
          + 'opacity:0;transition:opacity .2s ease;pointer-events:none;display:flex;gap:10px;align-items:center;';
        document.body.appendChild(el);
      }
      el.innerHTML = '<span style="font-size:18px;">💗</span><span>' + text + '</span>';
      el.style.opacity = '1';
      clearTimeout(el.__t);
      el.__t = setTimeout(function(){ try{ el.style.opacity = '0'; }catch(e){} }, ms || 3600);
    }catch(e){}
  }

  var REST_FALLBACK_RX = /약국|마트|편의점|슈퍼/;   // (v87) 문화시설이 없는 지역의 대체 휴식처
  function restSpots(sid){
    try{
      var st = STAGES[sid]; if (!st) return [];
      var main = (st.objects||[]).filter(function(o){
        /* (v332) canRest 데이터 플래그 우선, 없으면 대형 문화·공공 라벨 */
        if (!o || o.hidden) return false;
        /* (v368) 주민 NPC·위험요소는 휴식 대상이 아니다 — «문화의집 선생님»(주민)이 라벨 정규식(문화의집)에 걸려
           대화 반경 살짝 밖에서 F 를 누르면 대화 대신 «선생님에서 잠시 쉬었다»가 나오던 문제 (터치 조사 버튼에서 재현) */
        if (o.resident || o.npcName || o.hazardId || o.interactable === 'hazard') return false;
        return window.BD_canRestAt ? BD_canRestAt(o) : REST_RX.test(String(o.label||''));
      });
      return main;   /* (v332) 약국·마트 폴백 제거 — 소규모 시설 휴식 금지 */
    }catch(e){ return []; }
  }
  window.BD_nearestRest = function(){
    try{
      var list = restSpots(Number(currentStage)); if (!list.length) return null;
      var best=null, bd=1e9;
      list.forEach(function(o){
        var cx=(o.rx||0)+(o.rw||0)/2, cy=(o.ry||0)+(o.rh||0);
        var d=Math.hypot(heroX-cx, heroY-cy);
        if (d<bd){ bd=d; best=o; }
      });
      return best ? { obj:best, dist:bd } : null;
    }catch(e){ return null; }
  };

  /* ── ① 문화시설 앞에서 F → 휴식(전체 회복) ── */
  document.addEventListener('keydown', function(e){
    if (e.key !== 'f' && e.key !== 'F') return;
    try{
      if (window.HSR && HSR.active) return;
      var d = document.getElementById('dialogue-overlay');
      if (d && d.offsetHeight) return;
      // (v281) v24 시설 모달이 잡을 수 있는 시설이면 F를 모달에 양보 — 이중 발동 방지.
      //  (승격된 보조 시설의 휴식은 모달의 '💗 잠시 쉬어 가기' 버튼이 담당한다)
      try{
        var v24m = document.getElementById('bd-district-facility-modal');
        if (v24m && v24m.classList.contains('open')) return;
        if (window.BD_v24NearestFacility && BD_v24NearestFacility()) return;
      }catch(eV){}
      var n = BD_nearestRest();
      if (!n) return;
      var R = (typeof HERO_WR !== 'undefined' ? HERO_WR : 0.022) * 2 * 1.2;
      var o = n.obj;
      // (v85) 위험요소·주민이 더 가까우면 그쪽에 양보 — 문화시설 근처의 위험요소를
      //  조사하려는데 휴식이 먼저 잡혀 조사가 아예 안 되던 문제
      try{
        var oc = { x:(o.rx||0)+(o.rw||0)/2, y:(o.ry||0)+(o.rh||0) };
        var myD = Math.hypot(heroX-oc.x, heroY-oc.y);
        var st2 = STAGES[Number(currentStage)];
        var closer = false;
        (st2 && st2.objects || []).forEach(function(x){
          if (closer || !x || x.hidden) return;
          var isTarget = (x.interactable === 'hazard' && x.hazardId) || x.resident;
          if (!isTarget) return;
          var cx = (x.rx||0)+(x.rw||0)/2, cy = (x.ry||0)+(x.rh||0);
          if (Math.hypot(heroX-cx, heroY-cy) < myD) closer = true;
        });
        if (closer) return;
      }catch(eY){}
      var inX = heroX >= (o.rx||0) - R && heroX <= (o.rx||0) + (o.rw||0) + R;
      var dy  = heroY - ((o.ry||0) + (o.rh||0));
      if (!(inX && dy >= -0.02 && dy < R * 2.6)) return;
      if (typeof heroHP === 'undefined') return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      var full = heroHP >= maxHP();
      // (v120) 문화시설을 이용할 때 먼저 '시설 안내 카드'를 띄운다.
      //  (어떤 곳인지·무엇을 할 수 있는지 알려 준 뒤 휴식 결과를 보여 주는 흐름)
      try{
        var fid = null;
        // (v120a) 배치의 facilityId 는 건물 단위(wawoo_complex 등)라 시설 정의와 키가 다르다.
        //  실제 시설 정의로 이어 주는 표를 먼저 본다.
        var MAPF = {
          'wawoo_complex':'facility_youth_house',
          'bongdam_library':'facility_bongdam_library',
          'wawoo_library':'facility_wawoo_library',
          'children_culture':'facility_children_culture',
          'national_sports':'facility_national_sports'
        };
        try{
          var raw = o.facilityId || o._facilityId || null;
          if (raw && MAPF[raw]) fid = MAPF[raw];
        }catch(eM){}
        if (!fid && window.BD_REGISTRY && BD_REGISTRY.FACILITY_DEFINITIONS){
          var nm = String(o.label||'').replace(/\s/g,'');
          Object.keys(BD_REGISTRY.FACILITY_DEFINITIONS).forEach(function(k){
            if (fid) return;
            var d = BD_REGISTRY.FACILITY_DEFINITIONS[k];
            var dn = String(d.displayName || d.officialName || '').replace(/\s/g,'');
            if (dn && (dn === nm || nm.indexOf(dn) >= 0 || dn.indexOf(nm) >= 0)) fid = k;
          });
        }
        if (fid && typeof window.BD_showPlaceCard === 'function'){
          BD_showPlaceCard(fid, { rest: true });
        }
      }catch(eFC){}

      if (typeof showDialog === 'function'){
        var isShopRest = /약국|마트|편의점|슈퍼/.test(String(o.label||''));
        showDialog('나', full
          ? ['(' + (o.label||'문화시설') + '에서 잠시 쉬었다. 몸도 마음도 가뿐해!)']
          : (isShopRest
              ? ['(' + o.label + ' 앞 의자에서 잠깐 숨을 돌렸다.)', '(사장님이 물 한 잔을 건네주셨다 — 체력이 모두 회복됐다!)']
              : ['(' + (o.label||'문화시설') + '에서 휴식을 즐겼다!)', '(체력이 모두 회복됐다!)']));
        // (v83) 안내성 독백은 오래 떠 있을 이유가 없다 — 6초 뒤 스스로 정리
        setTimeout(function(){
          try{
            var ov = document.getElementById('dialogue-overlay');
            if (ov && ov.offsetHeight && !(window.HSR && HSR.active)) ov.click();
          }catch(eA){}
        }, 6000);
      }
      if (!full){
        heroHP = maxHP();
        try{ if (typeof window.BD_syncHP==='function') BD_syncHP(heroHP, true); }catch(e2){}
        try{ if (typeof bdSave==='function') bdSave(); }catch(e3){}
        toast('💚 체력이 모두 회복됐어요! (' + heroHP + '/' + maxHP() + ')');
      }
    }catch(err){}
  }, true);

  /* ── ② HP 50% 미만 → 담이 우선 안내 (진행 중 안내는 잠시 멈춤) ── */
  var warned = false, savedOvr = null;
  function gameplayVisible(){
    try{
      if (window.BD_DAMI && typeof BD_DAMI.isGameplayVisible === 'function') return BD_DAMI.isGameplayVisible();
      var gs = document.getElementById('game-screen');
      var ts = document.getElementById('bd-title-screen');
      return !!(gs && getComputedStyle(gs).display !== 'none' && gs.offsetHeight > 0
        && !(ts && ts.classList.contains('show') && getComputedStyle(ts).display !== 'none'));
    }catch(e){ return false; }
  }
  function restoreGuide(){
    if (!warned) return;
    warned = false;
    if (savedOvr !== null){ window.__bdNavOverride = savedOvr; savedOvr = null; }
    else if (window.__bdNavOverride && window.__bdNavOverride.__rest) window.__bdNavOverride = null;
  }
  setInterval(function(){
    try{
      /* 저장된 저체력 값은 타이틀에서도 이미 메모리에 있을 수 있다.
         실제 플레이 중이 아니면 대사·토스트·길안내를 만들지 않는다. */
      if (!gameplayVisible()){ restoreGuide(); return; }
      if (typeof heroHP === 'undefined') return;
      if (window.HSR && HSR.active) return;
      var st = STAGES[Number(currentStage)];
      if (!st || st.interior) return;
      var ratio = heroHP / maxHP();
      if (ratio >= 0.5){ 
        restoreGuide();                  // 회복되면 원래 안내 복구
        return;
      }
      if (warned) return;
      var n = BD_nearestRest(); if (!n) return;
      warned = true;
      // 진행 중이던 화살표 목표를 저장해 두고, 회복 안내를 우선 표시
      savedOvr = window.__bdNavOverride || null;
      var o = n.obj;
      /* (v368) 폭 넓은 건물은 화살표가 «문(지정 상호작용 지점)»을 가리키게 — 사각형 중앙은 문이 아닐 수 있다 */
      var tgt = { rx:o.rx, ry:o.ry, rw:o.rw, rh:o.rh };
      try{
        var lm = ((st.__v24Landmarks)||[]).find(function(l){ return l && ((o.facilityId && l.facilityId === o.facilityId) || (l.label && o.label && l.label === o.label)); });
        if (lm && isFinite(Number(lm.interactionX)) && isFinite(Number(lm.interactionY))){
          tgt = { rx:Number(lm.interactionX) - 0.02, ry:Number(lm.interactionY) - 0.03, rw:0.04, rh:0.04 };
        }
      }catch(eLm){}
      window.__bdNavOverride = { rx:tgt.rx, ry:tgt.ry, rw:tgt.rw, rh:tgt.rh,
                                label:(o.label||'문화시설'), _guideLabel:'여기서 쉬어 가기', __rest:true };
      var say = ['체력이 절반 아래로 떨어졌어요!',
                 '가까운 ' + (o.label||'문화시설') + '에 들러 F로 잠깐 쉬면 모두 회복돼요.'];
      // (v109) 담이 대사창 형태로 안내 —
      //  BD_DAMI.show 는 필드에서 실제로 렌더되지 않는 경우가 있어(호출만 되고 화면에 안 보임)
      //  v104 이후 안내가 통째로 사라졌다. 정식 경로도 부르되, 화면 표시는 담이 말풍선 UI로 보장한다.
      /* (v284) 3중 출력 정리 — 담이 말풍선 하나로 통일 (표시 실패 시에만 토스트 폴백) */
      var __shown284 = false;
      try{
        if (window.BD_DAMI && BD_DAMI.show) {
          __shown284 = !!BD_DAMI.show(say.join(' '), { face:'worry', channel:'guide', when:gameplayVisible });
        }
      }catch(e4){}
      if (!__shown284) toast('💗 ' + (o.label||'문화시설') + '에서 쉬어 갈 수 있어요', 4200);
    }catch(e){}
  }, 900);
})();
