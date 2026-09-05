
/* (v67) 길안내 일원화 — "지금 해야 할 것 하나"만 가리킨다
   규칙: ① 부탁을 받지 않았으면 → 부탁할 주민(❗)  ② 부탁을 받았으면 → 그 위험요소
         ③ 정화했으면 → 보고할 주민  ④ 이미 끝난 목표·정화된 위험요소는 절대 가리키지 않음
   또한 바닥 점 안내는 화살표와 중복되므로 끈다(맵이 복잡해 보이던 문제). */
(function(){
  'use strict';
  function purified(hid){ try{ return !!(window.BD && BD.purified && BD.purified[hid]); }catch(e){ return false; } }
  function qstate(){ try{ return JSON.parse(localStorage.getItem('bd_hzquest_v57')||'{}'); }catch(e){ return {}; } }
  function center(o){ return { rx:o.rx, ry:o.ry, rw:o.rw||0.05, rh:o.rh||0.07 }; }

  window.BD_currentGuide = function(){
    try{
      var sid = Number(currentStage);
      var st = STAGES[sid]; if (!st || st.interior) return null;
      // (v116) 스토리에서 지목한 인물이 있으면 그 사람을 먼저 가리킨다.
      //  ("세아의 친구 서연이…" 라고 해 놓고 화살표는 다른 주민을 가리키던 문제)
      try{
        var want = window.__bdStoryTargetNpc;
        if (want){
          var wo = (st.objects||[]).find(function(o){
            return o && o.resident && (o.npcName === want) && !o.hidden; });
          if (wo){
            var s2 = qstate();
            var mp2 = (window.BD_hzQuestMap ? BD_hzQuestMap(sid) : []);
            var mine = mp2.find(function(m){ return m.npc === want; });
            // 아직 그 사람의 부탁을 안 받았을 때만 유효
            if (!mine || !s2[mine.id]) return { t: center(wo), label:'이야기 듣기' };
            window.__bdStoryTargetNpc = null;   // 받았으면 해제 → 원래 흐름
          }
        }
      }catch(eS){}
      // (v108) 최종장에서는 최종 보스를 가리킨다 — 그전까지는 주민·위험요소 흐름 그대로.
      //  (최종장인데 "이야기 듣기"로 주민을 가리켜 목표가 헷갈리던 문제)
      try{
        var Q = window.QUESTS || window.BD_QUESTS;
        var curId = Q && Q[BD.questIdx] && Q[BD.questIdx].id;
        if (curId === 'final'){
          var boss = (st.objects||[]).find(function(o){
            return o && o.isBoss && !o.hidden && !purified(o.hazardId);
          });
          if (boss && !(typeof window.BD_hazardLocked==='function' && BD_hazardLocked(boss))){
            return { t: center(boss), label:'마지막 상대' };
          }
        }
      }catch(eF){}
      var s = qstate();
      var hz = (st.objects||[]).filter(function(o){
        return o && o.interactable==='hazard' && o.hazardId && !o.hidden && !o.isBoss &&
               String(o.hazardId).indexOf('final_boss')!==0 && !purified(o.hazardId) &&
               !(typeof window.BD_hazardLocked==='function' && BD_hazardLocked(o));
      });
      // ③ 정화 완료 + 보상 미수령 → 보고할 주민
      var rep = null;
      Object.keys(s).forEach(function(hid){
        if (s[hid]==='a' && purified(hid) && !rep){
          var npc = (st.objects||[]).find(function(o){ return o && o.resident && o.__bdHzQuestLines &&
            String(o.__bdHzQuestLines).indexOf('thanks')===0; });
          if (npc) rep = { t: center(npc), label:'보고하기' };
        }
      });
      if (rep) return rep;
      // ② 수락한 위험요소
      for (var i=0;i<hz.length;i++) if (s[hz[i].hazardId]==='a') return { t:center(hz[i]), label:'정화하기' };
      // 튜토(첫 쓰레기)는 수락 없이도 목표
      var tut = hz.find(function(o){ return o.hazardId==='ow212_trash_1'; });
      if (tut && !purified('ow212_trash_1')) return { t:center(tut), label:'정화하기' };
      // ① 부탁 줄 주민(❗)
      var offer = (st.objects||[]).find(function(o){ return o && o.resident && o.__bdHzQuestLines &&
        String(o.__bdHzQuestLines).indexOf('offer')===0; });
      if (offer) return { t:center(offer), label:'이야기 듣기' };
      return null;
    }catch(e){ return null; }
  };

  // 기존 목표 해석기보다 우선하도록 getGuideTarget을 감싼다
  function wrap(){
    if (typeof window.getGuideTarget !== 'function' || window.__bdGuideWrapped) return;
    var orig = window.getGuideTarget;
    window.getGuideTarget = function(){
      try{
        var g = BD_currentGuide();
        if (g) return { rx:g.t.rx, ry:g.t.ry, rw:g.t.rw, rh:g.t.rh, _guideLabel:g.label };
      }catch(e){}
      return orig.apply(this, arguments);
    };
    window.__bdGuideWrapped = true;
  }
  var tries = 0;
  var iv = setInterval(function(){ wrap(); if (window.__bdGuideWrapped || ++tries > 40) clearInterval(iv); }, 300);

  // (v74) 화살표 목표를 최우선 주입 — 수락 후에도 퀘스트 준 NPC를 계속 가리키던 버그
  //  (기존엔 화살표가 다른 경로로 목표를 먼저 정해 이 규칙이 무시됐다)
  setInterval(function(){
    try{
      var cur = window.__bdNavOverride;
      if (cur && cur.__ele) return;                 // 엘리베이터 안내는 그대로 둔다
      if (cur && cur.__rest) return;                // (v78) 체력 회복 안내가 우선
      var g = BD_currentGuide();
      if (g && g.t){
        window.__bdNavOverride = { rx:g.t.rx, ry:g.t.ry, rw:g.t.rw, rh:g.t.rh,
                                   label:g.label, _guideLabel:g.label, __guide:true };
      } else if (cur && cur.__guide){
        window.__bdNavOverride = null;
      }
    }catch(e){}
  }, 500);

  // 바닥 점 안내 비활성 (화살표와 중복 → 화면 혼잡)
  setInterval(function(){
    try{
      document.querySelectorAll('.bd-path-dot, #bd-path-dots').forEach(function(e){ e.style.display='none'; });
    }catch(e){}
  }, 800);
})();
