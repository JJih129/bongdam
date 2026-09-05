
/* (v57) 위험요소별 주민 부탁 퀘스트 체계
   · 첫 정화(튜토 쓰레기)를 제외한 모든 위험요소는 근처 주민의 부탁을 수락해야 조사·전투 가능
   · 매칭은 거리 기반 동적(각 위험요소 → 최근접 주민/NPC) — 에디터로 배치를 옮겨도 따라간다
   · 루프: ❗ 부탁 → 자동 수락 → 정화 → ? 마커 → 재대화 시 보상(소지금+안전 포인트) + 다음 유도
   · 동료(세아·재이·재현)는 친구 말투 / v34 지역 단위 부탁·보상 대체 */
(function(){
  'use strict';
  var SIDS = [212, 213, 211, 210];
  var TUT = 'ow212_trash_1';
  var KEY = 'bd_hzquest_v57';
  window.__bdHzQuestV57 = true;

  function state(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  function purified(hid){ try{ return !!(window.BD && BD.purified && BD.purified[hid]); }catch(e){ return false; } }
  function tutoDone(){
    /* (v322) 구 빌드 세이브의 레거시 id·진행도도 인정 — 이 판정이 막히면 전 지역 조사가 잠긴다 */
    try{ return purified(TUT) || purified('tutorial_trash') || ((window.BD && BD.questIdx) || 0) >= 1; }
    catch(e){ return purified(TUT); }
  }   // (v60) 첫 쓰레기 정화 완료 = 부탁 체계 개방

  var ASK = {
    kickboard:  '길을 막은 킥보드 때문에 유모차랑 휠체어가 못 지나가서 다들 차도로 돌아가고 있어.',
    trash:      '방치된 쓰레기 더미 때문에 악취랑 벌레가 심해서 창문도 못 열어.',
    cigarette:  '떠도는 담배 연기 때문에 골목을 지날 때마다 숨이 턱 막혀.',
    bicycle:    '쓰러진 자전거 때문에 어젯밤에 지나가던 분이 걸려 넘어질 뻔했어.',
    glass:      '깨진 유리 조각 때문에 아이들이 놀다가 다칠까 봐 조마조마해.',
    bottle:     '나뒹구는 술병 때문에 밤길이 무섭고 언제 깨질지 몰라 불안해.',
    noise_bat:  '밤마다 울리는 소음 때문에 잠을 통 못 자겠어.',
    dark_alley: '캄캄한 산책로 때문에 해가 지면 그 길로는 다닐 수가 없어.',
    streetlight:'고장 난 가로등 때문에 밤길이 너무 어두워서 넘어질 뻔했지 뭐야.',
    road_crack: '갈라진 길바닥 때문에 유모차 바퀴가 자꾸 걸려서 위험해.',
    sign_ghost: '낡아서 떨어질 듯한 표지판 때문에 그 밑을 지나기가 겁나.',
    _default:   '{hz} 때문에 요즘 다들 그 근처를 피해 다녀.'
  };
  var THANK = {
    kickboard:  '킥보드 치워 줘서 길이 뻥 뚫렸어! 다들 좋아하더라.',
    trash:      '쓰레기가 사라지니까 공기부터 달라졌어!',
    cigarette:  '연기가 걷히니까 이제 창문을 활짝 열 수 있어!',
    bicycle:    '자전거 정리해 줘서 이제 밤길도 안심이야!',
    glass:      '유리 조각을 다 치워 줬구나. 아이들이 마음껏 뛰어놀 수 있겠어!',
    bottle:     '술병이 없어지니까 골목이 훤해졌어!',
    noise_bat:  '이제 밤이 조용해! 오랜만에 푹 잘 수 있겠다.',
    dark_alley: '산책로가 다시 환해졌어! 저녁 산책도 할 수 있겠는걸.',
    streetlight:'가로등이 다시 켜지니까 밤길이 든든해!',
    road_crack: '길이 반듯해져서 유모차도 문제없어!',
    sign_ghost: '표지판이 단단해졌네! 이제 마음 놓고 지나다닐 수 있어.',
    _default:   '「{hz}」 해결해 줘서 정말 고마워!'
  };

  function isFriend(o){ return String(o._editorId||'').indexOf('bdnpc_') === 0; }
  function npcName(o){ return String(o.npcName || o.label || '').trim(); }
  function npcsOf(st){
    return (st.objects||[]).filter(function(o){
      return o && o.resident && !o.hidden && npcName(o) && !o._hyunji && !o._tut2npc;
    });
  }
  function hazardsOf(st){
    return (st.objects||[]).filter(function(o){
      if (!o || o.interactable!=='hazard' || !o.hazardId) return false;
      if (o.isBoss || String(o.hazardId).indexOf('final_boss')===0 || o.hazardId === TUT) return false;
      if (o.bdOptional) return false;   // (v284) 선택 목표는 부탁 배정 제외 — 직접 조사용(자유 목표)으로 유지
      // (v62) 정화로 소멸(hidden)된 위험요소도 매칭 유지 — 감사·보상·완료 대사가 성립해야 한다
      if (o.hidden && !purified(o.hazardId)) return false;
      return true;
    });
  }
  function center(o){ return { x:(o.rx||0)+(o.rw||0)/2, y:(o.ry||0)+(o.rh||0)/2 }; }

  function buildMap(sid){
    var st = (typeof STAGES!=='undefined') && STAGES[sid]; if(!st) return [];
    var ns = npcsOf(st), hzs = hazardsOf(st), out = [];
    /* (v370) 고정 짝: 주민 오브젝트의 hzTarget(hazardId) 이 있으면 거리와 무관하게 그 위험요소를 맡는다(에디터로 옮겨도 유지).
       선택 위험요소(bdOptional)라도 hzTarget 으로 지목되면 부탁 대상에 포함한다. */
    var usedHz = [], usedNpc = [];
    ns.forEach(function(n){
      var tid = n.hzTarget; if (!tid) return;
      var hz = (st.objects||[]).find(function(o){ return o && o.hazardId === tid && !o.isBoss; });
      if (!hz || usedHz.indexOf(hz) >= 0) return;
      if (hz.hidden && !purified(hz.hazardId)) return;
      usedHz.push(hz); usedNpc.push(n);
      var hc = center(hz), nc = center(n);
      out.push({ hz: hz, npc: n, d: Math.hypot(hc.x - nc.x, hc.y - nc.y), fixed: true });
    });
    hzs = hzs.filter(function(h){ return usedHz.indexOf(h) < 0; });
    ns = ns.filter(function(n){ return usedNpc.indexOf(n) < 0; });
    if (!ns.length || !hzs.length) return out;
    // (v75) NPC 1명당 부탁 1개 — 모든 (위험요소, 주민) 짝을 거리순으로 훑으며
    //  아직 배정되지 않은 쪽끼리만 맺는다. 한 사람이 여러 부탁을 연달아 주던 문제 해소.
    var pairs = [];
    hzs.forEach(function(hz){
      var hc = center(hz);
      ns.forEach(function(n){
        var nc = center(n);
        pairs.push({ hz: hz, npc: n, d: Math.hypot(hc.x - nc.x, hc.y - nc.y) });
      });
    });
    pairs.sort(function(a, b){ return a.d - b.d; });
    pairs.forEach(function(p){
      if (usedHz.indexOf(p.hz) >= 0 || usedNpc.indexOf(p.npc) >= 0) return;
      usedHz.push(p.hz); usedNpc.push(p.npc);
      out.push(p);
    });
    return out;
  }
  window.BD_hzQuestMap = function(sid){
    return buildMap(sid).map(function(m){ return { hazard:m.hz.label, id:m.hz.hazardId, npc:npcName(m.npc), d:+m.d.toFixed(3) }; });
  };

  function npcRoles(sid){
    var map = buildMap(sid), s = state(), roles = [];
    map.sort(function(a,b){ return a.d-b.d; });
    map.forEach(function(m){
      var key = m.npc._editorId || npcName(m.npc);
      var r = null;
      for (var i=0;i<roles.length;i++){ if (roles[i].key===key){ r = roles[i]; break; } }
      if (!r){ r = { key:key, npc:m.npc, offer:null, thanks:null, active:null }; roles.push(r); }
      var hid = m.hz.hazardId, stq = s[hid];
      if (stq==='a' && purified(hid)){ if(!r.thanks) r.thanks = m.hz; }
      else if (stq==='a' && !purified(hid)){ if(!r.active) r.active = m.hz; }
      else if (!stq && !purified(hid)){ if(!r.offer) r.offer = m.hz; }
    });
    return roles;
  }
  function nextHint(roles, exceptKey, friend){
    for (var i=0;i<roles.length;i++){
      var r = roles[i];
      if (r.key===exceptKey || (!r.offer)) continue;
      var nm = npcName(r.npc);
      // (v107) 한글 조사 자동 선택 — "재현이(가)" 같은 어색한 표기 제거
      var __hasJong = (function(w){
        try{
          var t = String(w||'').trim(); if (!t) return false;
          var c = t.charCodeAt(t.length-1);
          if (isNaN(c) || c < 0xAC00 || c > 0xD7A3) return false;
          return ((c - 0xAC00) % 28) !== 0;
        }catch(e){ return false; }
      })(nm);
      var __sub = nm + (__hasJong ? '이' : '가');
      return friend ? ('참, ' + __sub + ' 너 찾던데? 한번 가 봐!')
                    : ('아, 그리고 ' + nm + '도 뭔가 걱정이 있어 보이던데 한번 들러 봐.');
    }
    return '덕분에 이 동네가 한결 안전해졌어. 정말 고마워!';
  }
  /* (v370) 화자 톤 레이어 — 부탁·감사 대사가 위험요소별 템플릿뿐이라 누가 말해도 같던 문제.
     주민 이름별 접두/접미 1줄을 붙인다(없으면 기본). 에디터에서 주민 이름을 바꾸면 기본 톤으로 돌아간다. */
  var TONE = {
    '은지':      { ask_pre:'있잖아, 요즘 좀 신경 쓰이는 게 있어.', ask_post:'너 배지 받았다며? 그럼 부탁해도 되지?', thank_pre:'역시 너야!' },
    '세아':      { ask_pre:'야, 마침 잘 왔다!', ask_post:'네가 좀 도와줄래? 나도 나중에 꼭 갚을게!', thank_pre:'내가 갚는다고 했지? 자, 받아!' },
    '서연':      { ask_pre:'지킴이! 나 부탁 하나만!', ask_post:'어른한테 말해도 잘 안 들어줘…', thank_pre:'우와, 진짜 해냈다!' },
    '재이':      { ask_pre:'…사건이다. 기록해 둔 게 있어.', ask_post:'단서는 충분해. 해결은 네 몫이야.', thank_pre:'사건 종결. 보고서에 네 이름을 적어 두지.' },
    '사서 도현': { ask_pre:'도서관 이용자분들이 자꾸 말씀하셔서요.', ask_post:'부탁드려도 될까요?', thank_pre:'이용자분들도 안심하실 거예요.' },
    '재현':      { ask_pre:'…딱히 부탁은 아닌데.', ask_post:'네가 지나가는 김에 봐 주면 되지. 걱정하는 건 아니고.', thank_pre:'…고맙다. 두 번 말 안 한다.' },
    '하늘':      { ask_pre:'아이들 프로그램 때문에 이 길을 자주 오가거든요.', ask_post:'아이들 안전이니까 부탁드릴게요.', thank_pre:'아이들이 제일 좋아하네요!' },
    '은지 어머니': { ask_pre:'은지 친구구나. 어른으로서 미안한 부탁인데,', ask_post:'위험하면 절대 무리하지 말고.', thank_pre:'은지 친구라 그런지 든든하네.' },
    '약사 도윤': { ask_pre:'약국에 다친 분이 자꾸 오세요.', ask_post:'다치기 전에 막는 게 약보다 낫죠.', thank_pre:'오늘은 반창고 손님이 없겠네요.' },
    /* 신규 주민(v370) */
    '박 반장':   { ask_pre:'경비실 박 반장이야. 애들 지나가는 길인데 말이야,', ask_post:'내가 매번 말릴 수도 없고… 부탁 좀 하자.', thank_pre:'오늘 밤엔 창문 열어야겠다!' },
    '순임 할머니': { ask_pre:'아이고, 지킴이 학생이구나.', ask_post:'늙은이가 부탁해도 되겠니?', thank_pre:'이제 손주랑 저녁 산책하마.' },
    '영자':      { ask_pre:'치워도 치워도 또 쌓이네…', ask_post:'같이 봐 줄래? 혼자는 벅차서.', thank_pre:'네 덕에 오늘은 일찍 끝나겠네.' },
    '준호':      { ask_pre:'형… 아니 누나… 아니 지킴이!', ask_post:'엄마가 이 골목으로 다니지 말래. 근데 지름길인데…', thank_pre:'이제 엄마한테 말해도 되겠다!' }
  };
  /* (v370) 감사 뒤 «우리도 앞으로» 학습 한 줄 (위험요소별) */
  var LEARN = {
    kickboard:'우리도 킥보드는 꼭 정해진 곳에 세우자.', trash:'쓰레기는 분리해서 버리고, 큰 건 어른께 알리자.',
    cigarette:'담배 연기는 피하고, 어른께 말해서 옮겨 달라고 하자.', bicycle:'자전거는 거치대에, 넘어진 건 세워 두자.',
    glass:'깨진 유리는 만지지 말고 표시해서 알리자.', bottle:'병은 밟기 전에 표시하고, 밤길은 밝은 길로.',
    noise_bat:'밤에는 서로 조용히, 소음은 어른께 알리자.', dark_alley:'어두운 길보단 밝은 길로 조금 돌아가자.',
    streetlight:'꺼진 가로등은 번호를 보고 신고할 수 있어.', road_crack:'갈라진 길은 표시해 두고 돌아가자.',
    sign_ghost:'흔들리는 표지판 밑은 지나가지 말자.', _default:'위험한 건 먼저 알아채고, 먼저 말하자.'
  };
  function toneOf(o){ try{ return TONE[npcName(o)] || null; }catch(e){ return null; } }
  function askLines(r){
    var v = r.offer.hazardVariant;
    var body = (ASK[v] || ASK._default).replace('{hz}', r.offer.label || '위험요소');
    var t = toneOf(r.npc);
    if (t) return [t.ask_pre, body, t.ask_post];
    if (isFriend(r.npc)) return ['야, 마침 잘 왔다!', body, '네가 좀 도와줄래? 나도 나중에 꼭 갚을게!'];
    return [body, '혹시 네가 도와줄 수 있을까?'];
  }
  function thankLines(roles, r){
    var v = r.thanks.hazardVariant;
    var head = (THANK[v] || THANK._default).replace('{hz}', r.thanks.label || '위험요소');
    var t = toneOf(r.npc);
    var learn = LEARN[v] || LEARN._default;
    var out = [];
    if (t && t.thank_pre) out.push(t.thank_pre);
    out.push(head, '정말 고마워! 약소하지만 이거 받아 줘.', learn, nextHint(roles, r.key, isFriend(r.npc)));
    return out;
  }

  function applyLines(){
    if (typeof STAGES==='undefined' || typeof currentStage==='undefined') return;
    // (v84) 대화가 진행 중일 때는 대사 배열을 바꾸지 않는다 —
    //  말하는 도중 상태가 바뀌면 다음 줄부터 다른 대사가 튀어나와 '끼어든' 것처럼 보인다
    try{
      var __ov = document.getElementById('dialogue-overlay');
      if (__ov && __ov.offsetHeight) return;
      if (window.HSR && HSR.active) return;
    }catch(eL){}
    if (!tutoDone()) return;   // (v60) 튜토리얼(첫 쓰레기 정화) 전에는 부탁 대사로 바꾸지 않는다
    var sid = Number(currentStage); if (SIDS.indexOf(sid)<0) return;
    try{ if (window.BD_regionLocked && BD_regionLocked(sid)) return; }catch(eR){}   // (v75) 다른 리는 부탁 없음
    var roles = npcRoles(sid);
    roles.forEach(function(r){
      var o = r.npc;
      if (!o.__bdOrigLines && Array.isArray(o.npcLines)) o.__bdOrigLines = o.npcLines.slice();
      var lines = null, tag = null;
      if (r.thanks){ lines = thankLines(roles, r); tag = 'thanks:' + r.thanks.hazardId; }
      else if (r.offer){ lines = askLines(r); tag = 'offer:' + r.offer.hazardId;
        /* (v370) 첫 만남 개성 대사 1줄 보존 — 부탁 상태가 되면 원대사가 통째로 덮여 개성이 사라지던 문제 */
        try{ if (o.__bdOrigLines && o.__bdOrigLines[0] && !o.__bdOrigTold) lines = [o.__bdOrigLines[0]].concat(lines); }catch(eO){} }
      else if (r.active){ lines = ['「' + r.active.label + '」 부탁한 거, 잘 부탁해!', '가까이 가서 F로 조사하면 돼.']; tag = 'active'; }
      if (!lines){
        // (v62) 담당 부탁을 전부 완료(보상까지)한 주민은 원대사 대신 감사 일상 대사 — 정화 후에도
        //  "위험요소가 방치돼 있어요" 같은 원대사가 남아 맥락이 깨지던 문제
        var s2 = state(), hadAny = false, allDone = true;
        buildMap(sid).forEach(function(m2){
          if (m2.npc !== o) return;
          hadAny = true;
          if (s2[m2.hz.hazardId] !== 'r') allDone = false;
        });
        if (hadAny && allDone){
          lines = isFriend(o)
            ? ['네 덕분에 이 근처가 훨씬 안전해졌어!', '또 무슨 일 생기면 제일 먼저 부를게!']
            : ['덕분에 이 근처는 이제 안심이에요.', '지킴이가 있어서 든든해요. 고마워요!'];
          tag = 'alldone';
        }
      }
      if (lines){
        if (o.__bdHzQuestLines !== tag){ o.npcLines = lines; o.__bdHzQuestLines = tag; }
      } else if (o.__bdHzQuestLines){
        o.npcLines = o.__bdOrigLines ? o.__bdOrigLines.slice() : o.npcLines;
        o.__bdHzQuestLines = null;
      }
    });
  }

  var lastSpoke = null;
  function detect(){
    if (!tutoDone()) return;   // (v60) 튜토리얼 전에는 수락·보상 없음
    var nameEl = document.getElementById('dialogue-name');
    var box = document.getElementById('dialogue-box');
    if (!(nameEl && box && box.offsetHeight)){ lastSpoke = null; return; }
    var speaking = String(nameEl.textContent||'').trim();
    if (!speaking || lastSpoke === speaking) return;
    var sid = Number(currentStage); if (SIDS.indexOf(sid)<0) return;
    var roles = npcRoles(sid);
    for (var i=0;i<roles.length;i++){
      var r = roles[i];
      if (npcName(r.npc) !== speaking) continue;
      lastSpoke = speaking;
      var s = state();
      if (r.thanks && s[r.thanks.hazardId] === 'a'){
        s[r.thanks.hazardId] = 'r'; save(s);
        try{ if (typeof playerGold !== 'undefined') playerGold += Math.round(60 * (window.BD_AUG ? BD_AUG.goldMult() : 1)); }catch(e){}
        try{ if (window.BD_addSafetyXP) BD_addSafetyXP(10); }catch(e){}
        setTimeout(function(){ try{ bdToast('🎁 보상: 소지금 +60G · 안전 포인트 +10'); }catch(e){} }, 700);
        // (v73) 메인 임무 "주민의 부탁 해결"은 보고까지 마쳐야 1건으로 인정 —
        //  정화만 하고 목표가 올라 장이 넘어가던 흐름을 부탁 완결(보고·보상)에 맞춘다.
        try{ if (window.BD_questProgress) BD_questProgress(); }catch(eQP){}
        try{ if (window.bdSave) bdSave(); }catch(e){}
      } else if (r.offer && !s[r.offer.hazardId]){
        (function(hz){
          s[hz.hazardId] = 'a'; save(s);
          setTimeout(function(){ try{ bdToast('📋 부탁 수락: 「' + (hz.label||'위험요소') + '」 — 이제 조사·정화할 수 있어요'); }catch(e){} }, 700);
          // (v58) 임무창 등록 + 추적 중인 임무가 없으면 자동 추적 (발 앞 화살표가 위험요소로 안내)
          try{
            syncQuestLog();
            if (window.BD && !BD.trackedQuest){ BD.trackedQuest = questIdOf(hz.hazardId); if (window.bdSave) bdSave(); }
          }catch(eQ){}
        })(r.offer);
      }
      break;
    }
  }

  /* ── (v58) 임무창(J) 등록 + 추적 화살표 가이드 ── */
  function questIdOf(hid){ return 'hzq_' + hid; }
  function findHazardAnywhere(hid){
    for (var i=0;i<SIDS.length;i++){
      var st = (typeof STAGES!=='undefined') && STAGES[SIDS[i]]; if (!st) continue;
      var o = (st.objects||[]).find(function(x){ return x && x.hazardId === hid; });
      if (o) return { sid: SIDS[i], o: o };
    }
    return null;
  }
  function npcOfHazard(hid){
    for (var i=0;i<SIDS.length;i++){
      var mp = buildMap(SIDS[i]);
      for (var j=0;j<mp.length;j++) if (mp[j].hz.hazardId === hid) return { sid: SIDS[i], o: mp[j].npc };
    }
    return null;
  }
  function syncQuestLog(){
    if (typeof window.BD_NPC_QUESTS === 'undefined' || !Array.isArray(window.BD_NPC_QUESTS)) return;
    var s = state();
    SIDS.forEach(function(sid){
      buildMap(sid).forEach(function(m){
        var hid = m.hz.hazardId, stq = s[hid];
        if (!stq) return;   // 수락 전에는 임무창 미등록
        var qid = questIdOf(hid);
        var q = window.BD_NPC_QUESTS.find(function(x){ return x && x.id === qid; });
        if (!q){
          q = { id: qid, type: 'npc', giver: npcName(m.npc), title: npcName(m.npc) + '의 부탁', accepted: true,
                desc: '"' + (ASK[m.hz.hazardVariant] || ASK._default).replace('{hz}', m.hz.label || '위험요소') + '"',
                objectives: [{ t: '「' + (m.hz.label || '위험요소') + '」 정화', need: 1, cur: 0 }], reward: {} };
          window.BD_NPC_QUESTS.push(q);   // 끝에 결정적 순서로 추가 — 저장 인덱스 호환
        }
        q.accepted = true;
        var done = purified(hid) ? 1 : 0;
        if (q.objectives && q.objectives[0] && q.objectives[0].cur !== done) q.objectives[0].cur = done;
      });
    });
  }
  window.BD_hzQuestGuide = function(qid){
    try{
      var hid = String(qid).replace(/^hzq_/, '');
      var s = state(); if (!s[hid]) return null;
      if (!purified(hid)){
        var h = findHazardAnywhere(hid); if (!h) return null;
        return { sid: h.sid, rect: { rx: h.o.rx, ry: h.o.ry, rw: h.o.rw, rh: h.o.rh, _guideLabel: '가까이 가서 F로 조사!' } };
      }
      if (s[hid] === 'a'){
        var n = npcOfHazard(hid); if (!n) return null;
        return { sid: n.sid, rect: { rx: n.o.rx, ry: n.o.ry, rw: n.o.rw||0.05, rh: n.o.rh||0.08, _guideLabel: (npcName(n.o) || '주민') + '에게 보고하기!' } };
      }
      return null;   // 보상까지 완료
    }catch(e){ return null; }
  };
  window.BD_hzQuestGate = function(obj){
    try{
      if (!obj || obj.interactable !== 'hazard' || !obj.hazardId) return false;
      if (obj.isBoss || String(obj.hazardId).indexOf('final_boss')===0) return false;
      if (obj.hazardId === TUT) return false;
      var sid = Number(typeof currentStage!=='undefined' ? currentStage : -1);
      if (SIDS.indexOf(sid)<0) return false;
      if (purified(obj.hazardId)) return false;
      if (!tutoDone()) return 'tuto';   // (v60) 튜토리얼 전 — 쓰레기부터
      // (v75) 진행 중인 리가 아니면 잠금 — 지역이 순서대로 열린다
      try{ if (window.BD_regionLocked && BD_regionLocked(sid)) return 'region'; }catch(eR){}
      if (state()[obj.hazardId]) return false;      // 이미 부탁을 받았다
      /* (v287) 주민 부탁을 전부 해결(보고까지)한 리에서는 남은 위험요소를 자유롭게 정화 */
      try{
        var __s57 = state();
        var __pairs57 = buildMap(sid) || [];
        if (__pairs57.length && __pairs57.every(function(m){ return __s57[m.hz.hazardId] === 'r'; })) return false;
      }catch(eFree){}
      /* (v147) 주민 수가 위험요소보다 적으면 «부탁해 줄 사람이 없는» 위험요소가 남는다.
         (실측: 와우리 담배 연기 · 동화리 방치된 쓰레기 · 수영리 어두운 골목)
         이 위험요소들은 영원히 잠긴 채로 남아 정화율 100%가 불가능했다.
         → 배정된 주민이 없는 위험요소는 부탁 없이도 직접 조사할 수 있게 한다. */
      try{
        var __map = buildMap(sid) || [];
        var __owned = __map.some(function(m){
          return m && m.hz && m.hz.hazardId === obj.hazardId; });
        if (!__owned) return false;
      }catch(eOrphan){}
      return true;
    }catch(e){ return false; }
  };

  /* v34 마커 대체: ❗ 부탁 / ? 보상 대기 */
  window.BD_drawNpcQuestMarks = function(ctx, canvas, stage){
    try{
      if (!stage || stage.interior) return;
      if (window.HSR && HSR.active) return;
      if (!tutoDone()) return;   // (v60) 튜토리얼 전에는 마커 없음
      var sid = Number(currentStage); if (SIDS.indexOf(sid)<0) return;
      try{ if (window.BD_regionLocked && BD_regionLocked(sid)) return; }catch(eR2){}   // (v75)
      var roles = npcRoles(sid);
      roles.forEach(function(r){
        var mark = null, color = null;
        if (r.thanks){ mark = '?'; color = 'rgba(140,255,180,.95)'; }
        else if (r.offer){ mark = '❗'; color = 'rgba(255,216,77,.95)'; }
        if (!mark) return;
        var o = r.npc;
        var x = toScreenX(o.rx + (o.rw||0)/2, canvas);
        var y = toScreenY(o.ry, canvas) - 14*currentScale - 3*currentScale*Math.abs(Math.sin(Date.now()/380));
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

  /* (v66) 구 NPC 부탁(정도현·서연·하늘·준호·영자·순임 등)은 새 위험요소 부탁 체계로 대체 —
     자동 수락돼 임무창·추적 화살표를 가로채면서 "만난 적 없는 사람의 부탁"이 진행되던 문제.
     hzq_ 항목만 남기고 구 항목은 미수락 상태로 되돌린다. */
  var LEGACY_Q = ['npc_hyunji','npc_dohyun','npc_seoyeon','npc_haneul','npc_junho','npc_yeongja','npc_sunim'];
  function purgeLegacyQuests(){
    try{
      if (!Array.isArray(window.BD_NPC_QUESTS)) return;
      window.BD_NPC_QUESTS.forEach(function(q){
        if (!q || LEGACY_Q.indexOf(q.id) < 0) return;
        if (q.accepted){ q.accepted = false; q.__bdLegacyOff = true; }
        if (q.objectives && q.objectives[0]) q.objectives[0].cur = 0;
      });
      if (window.BD && LEGACY_Q.indexOf(BD.trackedQuest) >= 0){
        BD.trackedQuest = null;   // 추적도 해제 — 엉뚱한 NPC를 가리키던 화살표 정리
        try{ if (window.bdSave) bdSave(); }catch(eS){}
      }
    }catch(e){}
  }
  setInterval(function(){ try{ applyLines(); detect(); syncQuestLog(); purgeLegacyQuests(); }catch(e){} }, 500);
  /* (v369) 수락·보고 감지는 100ms — 1줄짜리 부탁 대사를 빠르게 넘기면(연타) 500ms 폴링이 화자 이름을 놓쳐
     부탁이 «수락되지 않은 채» 조사가 게이트에 막히던 사례(완주 런 재현). 대화창이 떠 있는 동안만 비용 발생 */
  setInterval(function(){ try{ detect(); }catch(e){} }, 100);
})();
