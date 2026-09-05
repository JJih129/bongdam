
/* (v287) 안전지도 100% 체계
   · % = (정화한 위험요소 + 방문한 시설) / (전체 위험요소 + 전체 시설) — 보스 제외
   · 시설 방문 = 시설 앞 F(모달 열람) 기준 (bd_concept_facility_visits_v1)
   · 지역 100% → 장 완료(전화·컷신) + 안전 조각 + 다음 리 개방 + 배지 스킬
   · 프롤로그 보류 큐: 배지 수여 전의 스탬프·업적 알림을 수여 후로 미룸 */
(function(){
  'use strict';
  var SID = { wawoo:212, sang:213, donghwa:211, suyeong:210 };
  var CHQ = [ {qid:'ch1', id:'wawoo'}, {qid:'ch2', id:'sang'}, {qid:'ch3', id:'donghwa'}, {qid:'ch4', id:'suyeong'} ];
  function visits(){
    try{ return (JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1')||'{}').visitedFacilityIds)||[]; }
    catch(e){ return []; }
  }
  function isPur(hid){ try{ return !!(window.BD && BD.purified && BD.purified[hid]); }catch(e){ return false; } }
  function badgeGiven(){
    try{ return !!(window.BD_PROGRESS && BD_PROGRESS.story.tutorialFlags && BD_PROGRESS.story.tutorialFlags.badgeGiven); }catch(e){ return false; }
  }
  function damiAwake(){ try{ return localStorage.getItem('bd_dami_awake') === '1'; }catch(e){ return false; } }

  function regionCalc(regionId){
    var sid = SID[regionId];
    var out = { regionId:regionId, sid:sid, pct:0, core:false, stamp:false,
      req:{cur:0,max:0}, pur:{cur:0,max:0}, visit:{cur:0,max:0}, greet:{cur:0,max:0} };
    try{
      var st = (typeof STAGES!=='undefined') && STAGES[sid]; if(!st) return out;
      var hazards = (st.objects||[]).filter(function(o){
        return o && o.interactable==='hazard' && o.hazardId && !o.isBoss
          && String(o.hazardId).indexOf('final_boss')!==0; });
      out.pur.max = hazards.length;
      out.pur.cur = hazards.filter(function(o){ return isPur(o.hazardId); }).length;
      var facs = (st.__v24Landmarks||[]).filter(function(l){
        /* (v337) 리마다 반복되는 공용 상업시설(약국·마트·편의점·문구)은 지도 %와 진행 요건에서 제외 */
        if (!l || !l.facilityId || !l.majorFacility || l.hidden) return false;
        if (/pharmacy|home_mart|tongtoon|stationery/.test(String(l.facilityId))) return false;
        return true; });
      var vis = visits();
      out.visit.max = facs.length;
      out.visit.cur = facs.filter(function(l){ return vis.indexOf(l.facilityId) >= 0; }).length;
      try{
        var s57 = JSON.parse(localStorage.getItem('bd_hzquest_v57')||'{}');
        var pairs = (window.BD_hzQuestMap ? BD_hzQuestMap(sid) : []) || [];
        out.req.max = pairs.length;
        out.req.cur = pairs.filter(function(p){ return s57[p.id]==='r'; }).length;
      }catch(eP){}
      try{
        var CH = window.BD_REGISTRY_CHAPTERS && BD_REGISTRY_CHAPTERS[regionId];
        var FD = window.BD_REGISTRY && BD_REGISTRY.FACILITY_DEFINITIONS;
        if (CH && FD && window.BD_PROGRESS) out.stamp = (CH.stampAnyOf||[]).some(function(fid){
          var f = FD[fid]; return f && BD_PROGRESS.facility.facilityStampIds.indexOf(f.stampId)>=0; });
      }catch(eS){}
      var total = out.pur.max + out.visit.max;
      out.pct = total > 0 ? Math.floor((out.pur.cur + out.visit.cur) / total * 100) : 0;
      if (out.pur.cur >= out.pur.max && out.visit.cur >= out.visit.max && total > 0) out.pct = 100;
      out.core = out.pct >= 100;
    }catch(e){}
    return out;
  }
  window.BD_MapProgress = {
    region: regionCalc,
    all: function(){ return ['wawoo','sang','donghwa','suyeong'].map(regionCalc); },
    overall: function(){
      var a = this.all(); var t = a.reduce(function(s,r){ return s+r.pct; },0);
      return a.length ? Math.round(t/a.length) : 0;
    },
    cores: function(){ return this.all().filter(function(r){ return r.core; }).length; }
  };

  /* ── 챕터 완료 감시: 현재 장의 리가 100%면 장 완료(전화·컷신·보상) 트리거 ── */
  function chapterWatch(){
    try{
      if (!window.BD || typeof BD.questIdx !== 'number') return;
      var Q = window.BD_QUESTS || window.QUESTS; if (!Q) return;
      for (var i=0;i<CHQ.length;i++){
        var c = CHQ[i];
        var qi = Q.findIndex(function(x){ return x && x.id === c.qid; });
        if (qi !== BD.questIdx) continue;
        var mp = regionCalc(c.id);
        if (mp.pct < 100) return;
        try{ window.BD_Chapter && BD_Chapter.check(); }catch(eCk){}   /* 조각·노선 개방 확정 */
        var q = Q[qi];
        if (q && q.objectives && q.objectives[0] && q.objectives[0].cur < q.objectives[0].need){
          q.objectives[0].cur = q.objectives[0].need - 1;
          window.__bdQPLast = 0;
          try{ window.BD_questProgress && BD_questProgress(); }catch(eQP){}
        }
        return;
      }
    }catch(e){}
  }

  /* (v368) 부팅 후 1회 화해 — 이어하기 시 «장 완료 → 조각/개방» 사이에 저장이 끊긴 상태를 복구 (BD_Chapter.check 는 멱등) */
  setTimeout(function(){ try{ if (window.BD_Chapter && window.BD && typeof BD.questIdx === 'number') BD_Chapter.check(); }catch(e){} }, 6000);

  /* ── 프롤로그 보류 큐: 배지 수여 전의 스탬프·업적 알림을 수여 뒤로 ── */
  var pendingStamps = [], heldToasts = [];
  function installHolds(){
    try{
      if (window.BD_Facility && BD_Facility.grantStamp && !BD_Facility.grantStamp.__v287){
        var inner = BD_Facility.grantStamp.bind(BD_Facility);
        BD_Facility.grantStamp = function(fid){
          if (!damiAwake()){ if (pendingStamps.indexOf(fid)<0) pendingStamps.push(fid); return false; }
          return inner(fid);
        };
        BD_Facility.grantStamp.__v287 = true;
        BD_Facility.__grantInner287 = inner;
      }
      if (typeof window.bdToast === 'function' && !window.bdToast.__v287){
        var ot = window.bdToast;
        window.bdToast = function(msg){
          try{
            var tut2 = localStorage.getItem('bd_tut2_done') === '1';
            if (!tut2 && /업적 달성/.test(String(msg||''))){ heldToasts.push(arguments); return; }
          }catch(eT){}
          return ot.apply(this, arguments);
        };
        window.bdToast.__v287 = true;
        window.__bdToastInner287 = ot;
      }
    }catch(e){}
  }
  function flushHolds(){
    try{
      if (damiAwake() && pendingStamps.length && BD_Facility.__grantInner287){
        var fid = pendingStamps.shift();
        setTimeout(function(){ try{ BD_Facility.__grantInner287(fid); }catch(e){} }, 2600);
      }
      var tut2 = false;
      try{ tut2 = localStorage.getItem('bd_tut2_done') === '1'; }catch(eT2){}
      if (tut2 && heldToasts.length && window.__bdToastInner287){
        var a = heldToasts.shift();
        window.__bdToastInner287.apply(null, a);
      }
    }catch(e){}
  }

  /* ── 프롤로그: 문화의집 방문을 지도에 기록 (배지 수여 후) ── */
  function recordHome(){
    try{
      if (!badgeGiven()) return;
      var st = JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1')||'{"visitedFacilityIds":[],"visitCounts":{}}');
      st.visitedFacilityIds = st.visitedFacilityIds || [];
      if (st.visitedFacilityIds.indexOf('wawoo_youth_house') < 0){
        st.visitedFacilityIds.push('wawoo_youth_house');
        st.visitCounts = st.visitCounts || {};
        st.visitCounts.wawoo_youth_house = 1;
        localStorage.setItem('bd_concept_facility_visits_v1', JSON.stringify(st));
      }
    }catch(e){}
  }

  /* ── 배지 수여 후 임무 HUD 재표시 ── */
  function hudRestore(){
    try{
      if (!badgeGiven()) return;
      var hud = document.getElementById('bd-quest-hud');
      var gs = document.getElementById('game-screen');
      if (hud && gs && gs.style.display === 'block' && hud.style.display === 'none'
          && !(window.HSR && HSR.active)) hud.style.display = 'block';
    }catch(e){}
  }

  /* ── 지역 상점 아이템 ↔ 가방 동기화 ── */
  var REG = {
    snack:  { id:'snack',  tab:'consumable', icon:'🍪', name:'간식',   desc:'체력을 40 회복합니다.' },
    drink:  { id:'drink',  tab:'consumable', icon:'☕', name:'음료',   desc:'체력을 25 회복합니다.' },
    potion: { id:'potion', tab:'consumable', icon:'🧪', name:'회복약', desc:'체력을 60 회복합니다.' }
  };
  window.BD_addItem = function(key){ /* 카운트는 BD.items가 진실 — 동기화 틱이 반영 */ };
  function syncBag(){
    try{
      if (!window.BD || !BD.items || typeof playerInventory === 'undefined') return;
      var changed = false;
      Object.keys(REG).forEach(function(k){
        var cnt = Number(BD.items[k] || 0);
        var entry = playerInventory[k];
        if (cnt > 0){
          if (!entry){ playerInventory[k] = { item: REG[k], count: cnt }; changed = true; }
          else if (entry.count !== cnt){ entry.count = cnt; changed = true; }
        } else if (entry){ delete playerInventory[k]; changed = true; }
      });
      if (changed){
        var panel = document.getElementById('inv-panel');
        if (panel && panel.offsetHeight > 0){
          var act = document.querySelector('.inv-tab.active');
          if (act) act.click();   /* 현재 탭 재렌더 */
        }
      }
    }catch(e){}
  }

  /* ── 지도 첫 오픈 안내 ── */
  function wrapMapOpen(){
    try{
      if (!window.BD_openSafetyMap || window.BD_openSafetyMap.__v287) return;
      var om = window.BD_openSafetyMap;
      window.BD_openSafetyMap = function(){
        var r = om.apply(this, arguments);
        try{
          if (window.BD_tip) BD_tip('map_intro_v287', { icon:'🗺️', title:'봉담 안전지도',
            text:'회색 칸은 아직 못 가 본 곳이에요.<br>위험요소를 <b>정화</b>하고 시설을 <b>방문</b>하면 지도가 채워지고,<br>한 동네를 100% 채우면 <b>새 배지 스킬</b>을 얻어요!' });
        }catch(eT){}
        return r;
      };
      window.BD_openSafetyMap.__v287 = true;
    }catch(e){}
  }

  function tick(){ installHolds(); flushHolds(); recordHome(); hudRestore(); syncBag(); wrapMapOpen(); chapterWatch(); }
  if (window.BD_addTick) BD_addTick(tick, 900);
  else setInterval(tick, 900);
})();
