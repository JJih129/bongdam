
(function () {
  'use strict';
  var STATE = { ready:false };
  window.__BD_NAV_MSG_V26 = STATE;

  /* ══════════ A. 발 앞 회전 네비 화살표 ══════════ */
  var smoothA = null;
  // 추적 임무 → 신맵 목적 스테이지 (장 무대)
  var QUEST_STAGE = { prologue:212, ch1:212, ch2:213, ch3:211, ch4:210, final:212 };
  function districtCfgStage(sid){
    var cfg = window.__BD_DISTRICT_WORLD_V24_CONFIG;
    if (!cfg) return null;
    for (var i=0;i<cfg.stages.length;i++) if (Number(cfg.stages[i].id)===Number(sid)) return cfg.stages[i];
    return null;
  }
  function gateEdgePoint(g){
    var at = Number(g.at)||0.5;
    if (g.side==='left')   return {x:0.03, y:at};
    if (g.side==='right')  return {x:0.97, y:at};
    if (g.side==='top')    return {x:at, y:0.03};
    return {x:at, y:0.97};
  }
  // 게이트 그래프 BFS: 현재 신맵 스테이지 → pref 스테이지로 가는 첫 게이트 지점
  function navGateTargetSafe(pref){
    try{
      var cur = Number(currentStage);
      var s0 = districtCfgStage(cur);
      if (!s0 || pref==null || Number(pref)===cur) return null;
      var visited = {}; visited[cur]=true;
      var queue = [];
      (s0.gates||[]).forEach(function(g){
        var n = Number(g.nextStage);
        if (!visited[n]) { visited[n]=true; queue.push({sid:n, first:g}); }
      });
      while (queue.length){
        var q = queue.shift();
        if (q.sid === Number(pref)){
          var pt = gateEdgePoint(q.first);
          return { rx:pt.x-0.02, ry:pt.y-0.02, rw:0.04, rh:0.04, _gate:true };
        }
        var sc = districtCfgStage(q.sid);
        ((sc&&sc.gates)||[]).forEach(function(g2){
          var n2 = Number(g2.nextStage);
          if (!visited[n2]) { visited[n2]=true; queue.push({sid:n2, first:q.first}); }
        });
      }
    }catch(e){}
    return null;
  }
  window.BD_drawNavArrow = function(ctx, canvas, stage){
    try{
      var __ovr = window.__bdNavOverride || null;   // (v37) 튜토리얼 임시 목표 — 임무 추적 없이도 안내
      if (!__ovr && (!window.BD || !BD.trackedQuest)){ smoothA=null; window.__bdNavArrowInfo=null; return; }
      if (stage && stage.interior && !__ovr) return;   // (v53) 임시 목표(엘리베이터 안내 등)는 실내에서도 표시
      if (window.HSR && HSR.active) return;
      var gt = __ovr;
      var pref = (window.BD && BD.trackedQuest) ? QUEST_STAGE[BD.trackedQuest] : null;
      var onDistrict = !!districtCfgStage(currentStage);
      // 추적 중인 장의 무대가 다른 신맵이면 게이트 방향을 우선 안내
      if (!gt && onDistrict && pref!=null && Number(currentStage)!==Number(pref)){
        gt = navGateTargetSafe(pref);
      }
      // (v35) 같은 무대에 있을 때 — 부탁 단계에 따라 목표 전환: 미수락→NPC, 완료(보상 대기)→NPC
      if (!gt && onDistrict && pref!=null && Number(currentStage)===Number(pref)
          && typeof window.BD_npcQuestState === 'function'){
        try{
          var REG = { 212:'wawoo', 213:'sang', 211:'donghwa', 210:'suyeong' };
          var qs = BD_npcQuestState(REG[Number(pref)]);
          if (qs && qs.npc && ((!qs.accepted) || (qs.done && !qs.claimed))){
            gt = { rx: qs.npc.x - 0.02, ry: qs.npc.y - 0.02, rw: 0.04, rh: 0.04, _npc: true };
          }
        }catch(e){}
      }
      if (!gt){ try{ gt = getGuideTarget(); }catch(e){} }
      if (!gt && onDistrict && pref!=null) gt = navGateTargetSafe(pref);
      if (!gt){ window.__bdNavArrowInfo=null; return; }
      var tx=(gt.rx||0)+(gt.rw||0)/2, ty=(gt.ry||0)+(gt.rh||0)/2;
      var psx=toScreenX(heroX,canvas), psy=toScreenY(heroY,canvas);
      var tsx=toScreenX(tx,canvas), tsy=toScreenY(ty,canvas);
      var dx=tsx-psx, dy=tsy-psy, dist=Math.hypot(dx,dy);
      if (dist < 70*currentScale){ smoothA=null; window.__bdNavArrowInfo={dist:Math.round(dist),near:true}; return; }
      var a = Math.atan2(dy,dx);
      if (smoothA==null) smoothA=a;
      else { var d=a-smoothA; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; smoothA += d*0.16; }
      window.__bdNavArrowInfo = { a:+smoothA.toFixed(3), dist:Math.round(dist), gate:!!gt._gate };
      var s = currentScale;
      var footY = psy + 14*s;
      var r = 34*s + 3*s*Math.sin(Date.now()/260);
      var ax = psx + Math.cos(smoothA)*r;
      var ay = footY + Math.sin(smoothA)*r*0.62;   // 살짝 눌린 궤도 — 탑다운 원근감
      ctx.save();
      ctx.translate(ax, ay); ctx.rotate(smoothA);
      ctx.shadowColor='rgba(255,216,77,.8)'; ctx.shadowBlur=10*s;
      ctx.fillStyle='rgba(255,216,77,.96)';
      ctx.strokeStyle='rgba(92,62,0,.9)'; ctx.lineWidth=1.5*s;
      ctx.beginPath();
      ctx.moveTo(11*s,0); ctx.lineTo(-7*s,7.5*s); ctx.lineTo(-3*s,0); ctx.lineTo(-7*s,-7.5*s);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }catch(e){}
  };

  /* ══════════ B. 추적 변경 시 좌측 HUD 플래시 ══════════ */
  function hookTrack(){
    if (typeof window.BD_trackQuest !== 'function' || window.BD_trackQuest.__v26) return false;
    var orig = window.BD_trackQuest;
    window.BD_trackQuest = function(qid){
      var r = orig.apply(this, arguments);
      try{
        var hud = document.getElementById('bd-quest-hud');
        if (hud){ hud.classList.remove('bd-hud-flash'); void hud.offsetWidth; hud.classList.add('bd-hud-flash');
          setTimeout(function(){ hud.classList.remove('bd-hud-flash'); }, 950); }
      }catch(e){}
      smoothA = null;   // 새 목표로 즉시 방향 재계산
      return r;
    };
    window.BD_trackQuest.__v26 = true;
    return true;
  }

  /* ══════════ C. 문자(전화) 메시지 UI ══════════ */
  var MSGQ = [], msgBusy = false;
  function msgTone(){
    try{
      var A = new (window.AudioContext||window.webkitAudioContext)();
      [[880,0],[1320,0.12]].forEach(function(t){
        var o=A.createOscillator(), g=A.createGain();
        o.type='sine'; o.frequency.value=t[0];
        g.gain.setValueAtTime(0.0001, A.currentTime+t[1]);
        g.gain.exponentialRampToValueAtTime(0.13, A.currentTime+t[1]+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime+t[1]+0.5);
        o.connect(g); g.connect(A.destination);
        o.start(A.currentTime+t[1]); o.stop(A.currentTime+t[1]+0.55);
      });
      setTimeout(function(){ try{A.close();}catch(e){} }, 1400);
    }catch(e){}
  }
  function msgEl(){
    var el = document.getElementById('bd-msg');
    if (!el){
      el = document.createElement('div');
      el.id = 'bd-msg';
      el.innerHTML = '<div class="bd-msg-head"><span class="bd-msg-ic">📱</span>'
        + '<span class="bd-msg-from"></span><span class="bd-msg-hint">클릭해서 닫기</span></div>'
        + '<div class="bd-msg-body" style="display:flex;gap:10px;align-items:flex-start;">'
        +   '<img class="bd-msg-face" alt="" style="display:none;width:46px;height:46px;border-radius:50%;'
        +     'object-fit:cover;object-position:50% 4%;flex:0 0 auto;background:rgba(255,255,255,.12);'
        +     'border:1px solid rgba(255,255,255,.25);">'
        +   '<div class="bd-msg-text" style="flex:1 1 auto;"></div>'
        + '</div>';
      el.addEventListener('click', function(){ hideMsg(true); });
      document.body.appendChild(el);
    }
    return el;
  }
  var msgTimers = [];
  function clearMsgTimers(){ msgTimers.forEach(clearTimeout); msgTimers = []; }
  function hideMsg(user){
    var el = document.getElementById('bd-msg');
    clearMsgTimers();
    if (el) el.classList.remove('show');
    msgTimers.push(setTimeout(function(){
      msgBusy = false;
      // 첫 문자 이후 담이 한마디 (튜토리얼·대화와 안 겹칠 때만)
      try{
        if (!window.__bdMsgReacted && window.BD_DAMI
            && !(window.BD_TUTOR && BD_TUTOR.isRunning())
            && !(window.BD_TUTOR_sceneBusy && BD_TUTOR_sceneBusy())){
          window.__bdMsgReacted = true;
          BD_DAMI.show('친구들이 소식을 보내줬어요! 다음 동네도 같이 가봐요.', { face:'proud' });
        }
      }catch(e){}
      pump();
    }, 380));
  }
  function pump(){
    if (msgBusy || !MSGQ.length) return;
    try{ if (window.HSR && HSR.active) return; }catch(eB){}   /* (v320) 전투 중 보류 */
    msgBusy = true;
    var m = MSGQ.shift();
    var el = msgEl();
    // (v74) 발신자 얼굴 — 대화창과 같은 LD를 원형으로 잘라 보여준다 (대화·문자 UI 톤 통일)
    try{
      var face = el.querySelector('.bd-msg-face');
      var src = (typeof window.bdSpeakerPortrait === 'function') ? window.bdSpeakerPortrait(m.from) : null;
      if (face){
        if (src){ face.src = src; face.style.display = 'block'; }
        else { face.removeAttribute('src'); face.style.display = 'none'; }
      }
    }catch(eF){}
    el.style.borderLeftColor = m.color || '#fb923c';
    el.querySelector('.bd-msg-from').textContent = m.from || '';
    var body = el.querySelector('.bd-msg-text');
    body.textContent = '';
    msgTone();
    el.classList.add('show');
    var text = String(m.text||''), i = 0;
    (function type(){
      if (!el.classList.contains('show')) return;   // 사용자가 닫음
      if (i < text.length){
        body.textContent = text.slice(0, ++i);
        msgTimers.push(setTimeout(type, 26));
      } else {
        msgTimers.push(setTimeout(function(){ hideMsg(false); }, 4200));
      }
    })();
  }
  setInterval(pump, 1600);   /* (v320) 전투 종료 후 보류 문자 재개 */
  window.BD_Message = {
    show: function(m){ if (m && m.text){ MSGQ.push(m); pump(); } },
    _q: MSGQ
  };

  /* ══════════ D. 장 완료 → 친구 문자 ══════════ */
  var MSG_BY_FRAGMENT = {
    fragment_wawoo: { from:'세아', color:'#fb923c',
      text:'와우리 소문 벌써 다 났어! 다음은 상리래. 도서관 앞이 요즘 연기 때문에 난리라더라. 버스 정류장에서 상리행 타면 금방이야!' },
    fragment_sang: { from:'재이', color:'#a78bfa',
      text:'탐정의 촉이 발동했다… 다음 사건 현장은 동화리. 낙서에 소음까지, 냄새가 아주 진해. 문화센터 쪽에서 만나.' },
    fragment_donghwa: { from:'재현', color:'#60a5fa',
      text:'…수영리 밤길이 요즘 어둡다더라. 가로등도 나갔고. 조심해서 가. 걱정하는 건 아니고.' }
  };
  function hookChapter(){
    if (!window.BD_Chapter || typeof BD_Chapter.check !== 'function' || BD_Chapter.__v26msg) return false;
    var orig = BD_Chapter.check;
    BD_Chapter.check = function(){
      var before = [];
      try{ before = (BD_PROGRESS.safety.collectedSafetyFragmentIds||[]).slice(); }catch(e){}
      var r = orig.apply(this, arguments);
      try{
        (BD_PROGRESS.safety.collectedSafetyFragmentIds||[]).forEach(function(fid){
          if (before.indexOf(fid) < 0 && MSG_BY_FRAGMENT[fid]){
            setTimeout(function(){ try{ window.BD_Message.show(MSG_BY_FRAGMENT[fid]); }catch(e){} }, 3200);
          }
        });
      }catch(e){}
      return r;
    };
    BD_Chapter.__v26msg = true;
    return true;
  }

  /* ══════════ 부트 ══════════ */
  var tries = 0;
  var boot = setInterval(function(){
    tries++;
    var a = hookTrack(), b = hookChapter();
    var trackOk = (typeof window.BD_trackQuest === 'function' && window.BD_trackQuest.__v26);
    var chOk = (window.BD_Chapter && BD_Chapter.__v26msg);
    if ((trackOk && chOk) || tries > 400){
      clearInterval(boot);
      STATE.ready = trackOk && chOk;
    }
  }, 250);
})();
