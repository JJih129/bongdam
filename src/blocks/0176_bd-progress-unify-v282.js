
/* (v282) 진행 축 단일화
   · BD_finaleOpen(): 최종장 개방 단일 판정 (questIdx>=5 || 스탬프6+조각4)
   · BD_MapProgress: 지역별 진행률(%) 파생 계산기 — 세이브 필드 추가 없음 (안전지도 UI 기반) */
(function(){
  'use strict';
  window.BD_finaleOpen = function(){
    try{
      if (window.BD && typeof BD.questIdx === 'number' && BD.questIdx >= 5) return true;
      if (window.BD_canStartFinale && BD_canStartFinale()) return true;
    }catch(e){}
    return false;
  };

  var REGION_SID = { wawoo:212, sang:213, donghwa:211, suyeong:210 };
  function reqState(){ try{ return JSON.parse(localStorage.getItem('bd_hzquest_v57')||'{}'); }catch(e){ return {}; } }
  function isPur(hid){ try{ return !!(window.BD && BD.purified && BD.purified[hid]); }catch(e){ return false; } }

  function regionCalc(regionId){
    var sid = REGION_SID[regionId];
    var out = { regionId:regionId, sid:sid, pct:0, core:false,
      req:{cur:0,max:0}, pur:{cur:0,max:0}, stamp:false, visit:{cur:0,max:0}, greet:{cur:0,max:0} };
    try{
      var st = (typeof STAGES!=='undefined') && STAGES[sid]; if(!st) return out;
      var s = reqState();
      var hazards = (st.objects||[]).filter(function(o){
        return o && o.interactable==='hazard' && o.hazardId && !o.isBoss
          && String(o.hazardId).indexOf('final_boss')!==0; });
      out.pur.max = hazards.length;
      out.pur.cur = hazards.filter(function(o){ return isPur(o.hazardId); }).length;
      var mains = hazards.filter(function(o){ return !o.bdOptional; });
      var mainsDone = mains.length>0 && mains.every(function(o){ return isPur(o.hazardId); });
      var pairs = [];
      try{ pairs = (window.BD_hzQuestMap ? BD_hzQuestMap(sid) : []) || []; }catch(eP){}
      out.req.max = pairs.length;
      out.req.cur = pairs.filter(function(p){ return s[p.id]==='r'; }).length;
      var CH = window.BD_REGISTRY_CHAPTERS && BD_REGISTRY_CHAPTERS[regionId];
      var FD = window.BD_REGISTRY && BD_REGISTRY.FACILITY_DEFINITIONS;
      if (CH && FD && window.BD_PROGRESS){
        out.stamp = (CH.stampAnyOf||[]).some(function(fid){
          var f = FD[fid]; return f && BD_PROGRESS.facility.facilityStampIds.indexOf(f.stampId)>=0; });
        var regionFids = Object.keys(FD).filter(function(fid){ return FD[fid].regionId===regionId; });
        out.visit.max = regionFids.length;
        out.visit.cur = regionFids.filter(function(fid){
          return BD_PROGRESS.facility.visitedFacilityIds.indexOf(fid)>=0; }).length;
      }
      var residents = (st.objects||[]).filter(function(o){ return o && o.resident && !o.hidden; });
      out.greet.max = residents.length;
      var greeted = (window.BD && Array.isArray(BD.greetedResidents)) ? BD.greetedResidents : [];
      out.greet.cur = residents.filter(function(o){
        var rid = o.residentId || o._editorId || o.npcName;
        return rid && greeted.indexOf(rid)>=0; }).length;
      /* 가중치 — 부탁 40 / 정화 25 / 스탬프 20 / 시설 방문 10 / 주민 인사 5 (없는 항목은 정규화) */
      var parts = [];
      if (out.req.max>0)   parts.push({ w:40, v:out.req.cur/out.req.max });
      if (out.pur.max>0)   parts.push({ w:25, v:out.pur.cur/out.pur.max });
      parts.push({ w:20, v:out.stamp?1:0 });
      if (out.visit.max>0) parts.push({ w:10, v:out.visit.cur/out.visit.max });
      if (out.greet.max>0) parts.push({ w:5,  v:out.greet.cur/out.greet.max });
      var tw=0, sc=0;
      parts.forEach(function(p){ tw+=p.w; sc+=p.w*p.v; });
      out.pct = tw>0 ? Math.round(sc/tw*100) : 0;
      /* 핵심 완료 = 배정된 부탁 전부 보고 + 메인 위험요소 전부 정화 + 스탬프 1개 이상 */
      out.core = (out.req.max===0 || out.req.cur>=out.req.max) && mainsDone && out.stamp;
    }catch(e){}
    return out;
  }
  window.BD_MapProgress = {
    region: regionCalc,
    all: function(){ return ['wawoo','sang','donghwa','suyeong'].map(regionCalc); },
    overall: function(){
      var a = this.all(); var t = a.reduce(function(s2,r){ return s2+r.pct; },0);
      return a.length ? Math.round(t/a.length) : 0;
    },
    cores: function(){ return this.all().filter(function(r){ return r.core; }).length; }
  };
})();
