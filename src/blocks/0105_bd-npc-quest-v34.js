
/* (v34) 주민 부탁 시스템 + 정화 소멸
   · 정화 완료된 위험요소는 맵에서 사라진다 (정화 상태 스프라이트 대신 소멸)
   · 월드 NPC 머리 위 부탁 마커: ❗(부탁 있음) → 진행 중 표시 없음 → ✦(완료 — 다시 말 걸면 보상)
   · 보상: 지역 위험 요소 정화 후 해당 주민과 다시 대화하면 소지금 +60, 공격 +1 (1회) */
(function(){
  'use strict';
  var REGION_STAGE = { wawoo:212, sang:213, donghwa:211, suyeong:210 };
  var STAGE_REGION = { 212:'wawoo', 213:'sang', 211:'donghwa', 210:'suyeong' };
  var CLAIM_KEY = 'bd_npcq_claim_v34';
  var ACCEPT_KEY = 'bd_npcq_accept_v35';
  function accepts(){ try{ var a = JSON.parse(localStorage.getItem(ACCEPT_KEY)||'{}');
      a.wawoo = true;   // (v35) 와우리는 자동 수락 — 프롤로그·튜토 흐름 보존
      return a; }catch(e){ return { wawoo:true }; } }
  function saveAccepts(a){ try{ localStorage.setItem(ACCEPT_KEY, JSON.stringify(a)); }catch(e){} }
  function claims(){ try{ return JSON.parse(localStorage.getItem(CLAIM_KEY)||'{}'); }catch(e){ return {}; } }
  function saveClaims(c){ try{ localStorage.setItem(CLAIM_KEY, JSON.stringify(c)); }catch(e){} }

  /* ── 지역 완료 판정: 해당 스테이지의 비선택(bdOptional 아님) 위험요소가 전부 정화됐는가 ── */
  function regionDone(region){
    try{
      var sid = REGION_STAGE[region]; if (!sid) return false;
      var st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return false;
      var main = st.objects.filter(function(o){ return o && o.interactable==='hazard' && o.hazardId && !o.bdOptional; });
      // 소멸(hidden) 처리된 정화 완료분도 세야 하므로 BD.purified 기준
      var total = 0, done = 0;
      st.objects.forEach(function(o){
        if (!o || o.interactable!=='hazard' || !o.hazardId || o.bdOptional) return;
        if (o.isBoss || String(o.hazardId).indexOf('final_boss') === 0) return;   // (v34b) 보스는 주민 부탁 범위 밖
        total++;
        if (window.BD && BD.purified && BD.purified[o.hazardId]) done++;
      });
      return total > 0 && done >= total;
    }catch(e){ return false; }
  }

  /* ── 월드링크 NPC 찾기 ── */
  function questNpcs(stage){
    var out = [];
    try{
      (stage.objects||[]).forEach(function(o){
        if (!o || !o.resident) return;
        var id = String(o._editorId||'');
        if (id.indexOf('bdlink_ow_npc_') !== 0) return;
        var region = null;
        if (Number(currentStage) === 212) region = 'wawoo';
        else if (Number(currentStage) === 213) region = 'sang';
        else if (Number(currentStage) === 211) region = 'donghwa';
        else if (Number(currentStage) === 210) region = 'suyeong';
        if (!region) return;
        out.push({ o:o, region:region, id:id });
      });
    }catch(e){}
    return out;
  }

  /* ── 마커 렌더 (게임 루프 훅에서 호출) ── */
  window.BD_drawNpcQuestMarks = function(ctx, canvas, stage){
    try{
      if (!stage || stage.interior) return;
      if (window.HSR && HSR.active) return;
      var c = claims();
      questNpcs(stage).forEach(function(q){
        var done = regionDone(q.region);
        var claimed = !!c[q.id];
        if (claimed) return;                       // 보상까지 끝난 주민은 마커 없음
        var acc = accepts()[q.region];
        if (acc && !done) return;                  // (v35) 수락 후 진행 중엔 마커 없음
        var mark = done ? '✦' : '❗';
        var color = done ? 'rgba(140,255,180,.95)' : 'rgba(255,216,77,.95)';
        var x = toScreenX(q.o.rx + (q.o.rw||0)/2, canvas);
        var y = toScreenY(q.o.ry, canvas) - 14*currentScale
                - 3*currentScale*Math.abs(Math.sin(Date.now()/380));
        ctx.save();
        ctx.font = 'bold ' + Math.round(20*currentScale) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 6*currentScale;
        ctx.fillStyle = color;
        ctx.fillText(mark, x, y);
        ctx.restore();
      });
    }catch(e){}
  };

  /* ── 틱: 정화 소멸 + 보상 지급 감지 ── */
  function tick(){
    try{
      if (typeof STAGES === 'undefined') return;
      /* F 쿨다운 기준 시각 — 대화창이 떠 있는 동안 계속 갱신 (마우스로 닫아도 직후 F 차단) */
      try{
        var __b = document.getElementById('dialogue-box');
        if (__b && __b.offsetHeight > 0 && parseFloat(getComputedStyle(__b).opacity) > 0.05)
          window.__bdDlgWasUp = Date.now();
      }catch(eCd){}
      /* 정화된 위험요소 소멸 (렌더·충돌·상호작용 공통 제외) */
      Object.keys(STAGES).forEach(function(sid){
        var st = STAGES[sid]; if (!st || !Array.isArray(st.objects)) return;
        st.objects.forEach(function(o){
          if (!o || o.interactable!=='hazard' || o.hidden) return;
          // (v36) 정화 마킹 키 체인(hazardId → id → label)과 동일하게 판정 — hazardId 없이
          //  배치된 위험요소(유리조각 등)가 정화 후에도 남던 문제
          var __pk = o.hazardId || o.id || (o.label || 'hazard');
          if (window.BD && BD.purified && (BD.purified[__pk] || (o.hazardId && BD.purified[o.hazardId]))){
            // (v52) 정화 결과 그림(clean 스프라이트)이 있는 위험요소는 '해결 전 위치 그대로' 남겨
            //  깨끗해진 모습을 보여주고, 없는 것(담배 연기 등)만 소멸시킨다.
            /* (v392) 구버전은 BD_ASSETS.image() 로 «정화 그림 존재»를 판정했는데,
               이 함수는 이미지 로딩이 끝나기 전에는 null 을 주므로 그림이 있어도
               첫 판정 시점에 «없음»으로 오판돼 영구 소멸(__bdGone)되는 레이스가 있었다.
               이제 소멸은 기획 명시 목록 4종만: 담배·유리조각·갈라진길·술병.
               나머지는 제자리에 남아 정화 스프라이트로 교체된다(0017 렌더). */
            var __GONE = { cigarette:1, glass:1, road_crack:1, bottle:1 };
            // (v75) 에디터의 '숨김' 속성을 건드리지 않는 전용 플래그 사용
            if (!o.hazardVariant || o.isBoss || __GONE[o.hazardVariant]) o.__bdGone = true;   /* 보스는 정화 그림이 없다 */
          }
        });
      });
      /* 보상: 지역 완료 상태에서 해당 주민과 대화 중이면 1회 지급 */
      var nameEl = document.getElementById('dialogue-name');
      var box = document.getElementById('dialogue-box');
      if (!(nameEl && box && box.offsetHeight)) return;
      var speaking = String(nameEl.textContent||'').trim();
      if (!speaking) return;
      var st2 = STAGES[currentStage]; if (!st2) return;
      if (window.__bdHzQuestV57) return;   // (v57) 지역 단위 부탁·보상은 위험요소별 부탁 체계로 대체
      var c = claims();
      questNpcs(st2).forEach(function(q){
        if (String(q.o.npcName||q.o.label||'').trim() !== speaking) return;
        // (v35) 부탁 수락 — NPC와 첫 대화 시
        var a = accepts();
        if (!a[q.region]){
          a[q.region] = true; saveAccepts(a);
          var need = 0;
          try{ STAGES[REGION_STAGE[q.region]].objects.forEach(function(o){
            if (o && o.interactable==='hazard' && o.hazardId && !o.bdOptional
                && !(o.isBoss || String(o.hazardId).indexOf('final_boss')===0)) need++; }); }catch(e){}
          setTimeout(function(){
            try{ bdToast('📋 『' + speaking + '의 부탁』 수락 — 위험 요소 ' + (need||2) + '곳 정화'); }catch(e){}
          }, 500);
          setTimeout(function(){
            try{ if (window.BD_DAMI) BD_DAMI.show('부탁을 받았어요! 이 동네 위험 요소를 정화하러 가요. 발 앞 화살표를 따라가면 돼요.', { face:'base' }); }catch(e){}
          }, 2200);
        }
        if (c[q.id]) return;
        if (!regionDone(q.region)) return;
        c[q.id] = true; saveClaims(c);
        try{ if (typeof playerGold !== 'undefined') playerGold += 60; }catch(e){}
        try{ if (window.BD && typeof BD.atk === 'number'){ BD.atk += 1; if (typeof bdSave==='function') bdSave(); } }catch(e){}
        setTimeout(function(){
          try{ bdToast('🎁 ' + speaking + '의 감사 — 소지금 +60G · 공격력 +1'); }catch(e){}
        }, 600);
        setTimeout(function(){
          try{ if (window.BD_DAMI) BD_DAMI.show('주민의 부탁을 해결했어요! 이렇게 한 명씩, 동네가 안전해지는 거예요.', { face:'proud' }); }catch(e){}
        }, 2400);
      });
    }catch(e){}
  }
  setInterval(tick, 250);

  /* ── (v35) 전역 상태 노출 — 발 앞 화살표의 단계 목표 결정용 ── */
  window.BD_npcQuestState = function(region){
    try{
      var sid = REGION_STAGE[region]; if (!sid) return null;
      var st = STAGES[sid]; if (!st) return null;
      var npc = null;
      (st.objects||[]).forEach(function(o){
        if (npc || !o || !o.resident) return;
        if (String(o._editorId||'').indexOf('bdlink_ow_npc_') === 0) npc = o;
      });
      var c = claims(); var claimed = false;
      if (npc){ (function(){ var id = npc._editorId; claimed = !!c[id]; })(); }
      return { accepted: !!accepts()[region], done: regionDone(region), claimed: claimed,
               sid: sid, npc: npc ? { x: npc.rx + (npc.rw||0)/2, y: npc.ry + (npc.rh||0)/2 } : null };
    }catch(e){ return null; }
  };

  /* ── (v35) 조사 게이트 — 부탁 수락 전에는 전투 대신 안내 ── */
  (function hookChoice(){
    if (typeof window.BD_showInteractChoice !== 'function'){ setTimeout(hookChoice, 400); return; }
    if (window.BD_showInteractChoice.__v35) return;
    var orig = window.BD_showInteractChoice;
    window.BD_showInteractChoice = function(objName, onInvestigate, onBattle){
      var region = STAGE_REGION[Number(currentStage)];
      if (region && !accepts()[region]){
        var wrapped = function(){
          try{ bdToast('🙋 주민이 곤란해 보인다 — 먼저 이야기를 들어보자 (❗ 표시)'); }catch(e){}
          try{ if (window.BD_DAMI) BD_DAMI.show('이 동네 주민의 부탁을 먼저 들어봐요! ❗ 표시가 있는 분에게 말을 걸어요.', { face:'worry' }); }catch(e){}
        };
        return orig.call(this, objName, wrapped, wrapped);
      }
      return orig.apply(this, arguments);
    };
    window.BD_showInteractChoice.__v35 = true;
  })();
})();
