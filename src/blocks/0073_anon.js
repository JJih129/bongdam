
/* ══ (v227) 친구 현지 — 약속 서사 전 장 (1~4장 + 최종장 빌드업) ══
   장마다 현지가 다음 약속 장소에서 기다린다. 문자 → 이동 → 길목의 곤란(위험요소)
   → 현지 대화(미완이면 부탁, 완료면 다음 약속). 정화 순서는 언제나 자유. */
(function(){
  'use strict';
  /* (v70) 신맵(4개 리) 전환 후에는 이 구맵 서사를 사용하지 않는다.
     현지는 현재 맵에 존재하지 않는 인물인데 '현지의 문자'만 도착해 흐름이 어긋나던 문제.
     (구맵 스테이지 2~5가 실제로 사용될 때만 동작) */
  try{
    var __newMap = (typeof STAGES !== 'undefined') && STAGES[212] && STAGES[213];
    if (__newMap) return;
  }catch(e){}
  const CH = {
    1: { st:2, pos:{ x:0.50, y:0.16 },
      sms: { id:'sms_ch1', title:'현지의 문자',
        text:'「배지 받았다며? 축하해!<br>나 지금 <b>북쪽 길 끝</b>에 있어. 이쪽으로 와!<br>같이 와우도서관 가자! 📚」' },
      pending: ['왔구나! 근데 오는 길 괜찮았어?',
        '아까 아이들이 담배 연기 때문에 콜록거리던데…',
        '길 막는 킥보드도 있고. 네 배지로 어떻게 안 될까?',
        '정리되면 같이 도서관 가자!'],
      done: ['역시 지킴이라니까! 길이 훤해졌어.', '이제 같이 도서관 가자! 📚'] },
    2: { st:3, pos:{ x:0.50, y:0.20 },
      sms: { id:'sms_ch2', title:'현지의 문자',
        text:'「어제 재밌었어! 나 봉담도서관에 <b>책 반납</b>하러 가야 하는데…<br><b>남쪽 공원길</b>로 같이 갈래? 기다릴게! 🌳」' },
      pending: ['공원길에 왔구나! 근데 좀 걱정이야…',
        '벤치 옆에 깨진 유리병이 있더라. 강아지 산책하던 아주머니가 발을 동동 구르셨어.',
        '어두운 산책로도 좀 무섭고… 배지로 봐 줄 수 있어?',
        '정리되면 도서관 가서 반납하고 오자!'],
      done: ['덕분에 공원길이 안전해졌어!', '반납 끝~ 이제 마음 놓고 산책해도 되겠다. 🌳'] },
    3: { st:4, pos:{ x:0.72, y:0.35 },
      sms: { id:'sms_ch3', title:'현지의 문자',
        text:'「대박! <b>어린이문화센터</b>에서 오늘 공연 한대! 🎭<br><b>서쪽 길</b>로 와! 같이 보러 가자!」' },
      pending: ['공연 시간 얼마 안 남았어!',
        '그런데 센터 가는 벽이 온통 낙서야… 직원분이 속상해하시더라.',
        '어디선가 시끄러운 소리도 나서 애기들이 귀를 막고 있어.',
        '정리해 주면 다 같이 기분 좋게 공연 볼 수 있을 것 같아!'],
      done: ['공연 완전 재밌었다! 🎭', '깨끗해진 거리에서 보니까 더 좋았어. 고마워!'] },
    4: { st:5, pos:{ x:0.28, y:0.35 },
      sms: { id:'sms_ch4', title:'현지의 문자',
        text:'「공연 보다 보니 벌써 <b>해가 저물었네</b>… 🌙<br>집에 가는 길, <b>동쪽 골목</b>이 너무 어두워서 무서워.<br>같이 가 줄래?」' },
      pending: ['와 줬구나… 이 골목 너무 어둡지?',
        '가로등이 다 꺼져 있고, 길도 갈라져 있어서 아까 넘어질 뻔했어.',
        '초등학생 동생들도 무서워서 못 지나가고 있대.',
        '네 배지로 밝혀 줄 수 있을까?'],
      done: ['우와, 환해졌다! 이제 하나도 안 무서워.',
        '오늘 하루 종일 고마웠어. 내일 학교에서 보자! 👋'] },
  };
  const FINAL_SMS = { id:'sms_final', title:'현지의 문자',
    text:'「집에 잘 들어갔어? 오늘 진짜 고마웠어!<br>근데 아까부터 네 <b>배지가 반짝이던데</b>… 🛡✨<br><b>문화의집 쪽</b>에서 빛나는 것 같았어. 가 봐야 하는 거 아니야?」' };

  function el(id){ return document.getElementById(id); }
  function toScreen(mx, my){
    try{
      const cv = el('game-canvas'); if (!cv) return null;
      const rect = cv.getBoundingClientRect();
      const px = ((((mx-camX)/VIEWPORT_W + 0.5)*BASE_W) - BASE_W/2)*currentScale + cv.width/2;
      const py = ((((my-camY)/VIEWPORT_H + 0.5)*BASE_H) - BASE_H/2)*currentScale + cv.height/2;
      return { x: rect.left + px/(cv.width/rect.width), y: rect.top + py/(cv.height/rect.height) };
    }catch(e){ return null; }
  }
  function dlgOpen(){
    const vn = el('dialogue-box');
    if (vn && vn.offsetHeight > 0 && parseFloat(getComputedStyle(vn).opacity) > 0.05) return true;
    if (window.__bdSceneActive) return true;
    const d = el('bd-dialog'); if (d && d.classList.contains('show')) return true;
    return false;
  }
  function say(name, lines){
    try{ if (typeof showDialog === 'function'){ showDialog(name, lines); return; } }catch(e){}
  }
  function qIdx(){ return (window.BD && typeof BD.questIdx === 'number') ? BD.questIdx : 0; }
  function chCleared(n){
    try{
      const pfx = 'ch' + n + '_';
      let cnt = 0;
      Object.keys(STAGES).forEach(function(sid){
        const s2 = STAGES[sid]; if (!s2 || !s2.objects) return;
        s2.objects.forEach(function(o){
          if (o && o.hazardId && !o.bdOptional && String(o.hazardId).indexOf(pfx) === 0
            && ((BD.purified && BD.purified[o.hazardId]) || o._purified)) cnt++;
        });
      });
      return cnt >= 2;
    }catch(e){ return false; }
  }
  function syncNpc(){
    try{
      const q = qIdx();
      const cur = CH[q] || null;
      Object.keys(CH).forEach(function(n){
        const c = CH[n];
        const st = STAGES[c.st]; if (!st || !st.objects) return;
        const has = st.objects.some(function(o){ return o && o._hyunji; });
        if (cur && +n === q){
          if (!has){
            const src = (STAGES[1].objects || []).find(function(o){ return o && o.resident; });
            const o = src ? JSON.parse(JSON.stringify(src)) : { type:'prop' };
            delete o.resident; delete o.npcLines; delete o.residentId; delete o.npcName;
            o._hyunji = true; o.interactable = '';
            o.label = '현지';
            o.rx = c.pos.x - 0.022; o.ry = c.pos.y - 0.045;
            o.rw = 0.044; o.rh = 0.09;
            delete o.cx; delete o.cy; delete o.cw; delete o.ch;
            st.objects.push(o);
          }
        } else if (has){
          st.objects = st.objects.filter(function(o){ return !(o && o._hyunji); });
        }
      });
    }catch(e){}
  }
  /* F 대화 (캡처) — 현재 장의 현지에게만 */
  document.addEventListener('keydown', function(e){
    if (e.key !== 'f' && e.key !== 'F') return;
    const c = CH[qIdx()]; if (!c) return;
    if (typeof currentStage === 'undefined' || currentStage !== c.st) return;
    if (dlgOpen()) return;
    if (window.BD_choiceOpen && BD_choiceOpen()) return;
    const dx = heroX - c.pos.x, dy = heroY - c.pos.y;
    if (Math.sqrt(dx*dx + dy*dy) > 0.12) return;
    e.preventDefault(); e.stopPropagation();
    // (v240e) 현지의 '부탁'을 들으면 그 장의 위험요소 정화가 해금된다 (damiSeen으로 영속)
    try{ if(window.BD_DAMI && BD_DAMI.markSeen) BD_DAMI.markSeen('hzok_ch' + qIdx()); }catch(e2){}
    say('현지', chCleared(qIdx()) ? c.done : c.pending);
  }, true);
  /* 문자·배치·마커 틱 */
  window.BD_addTick(function(){
    const mark = (function(){
      let d = el('bd-hyunji-mark');
      if (!d){ d = document.createElement('div'); d.id = 'bd-hyunji-mark';
        d.textContent = '\u2757';
        d.style.cssText = 'position:fixed;z-index:893;display:none;font-size:22px;'
          + 'text-shadow:0 0 6px rgba(0,0,0,.7);pointer-events:none;'
          + 'animation:bdGoalPulse 1.2s ease-in-out infinite;';
        document.body.appendChild(d); }
      return d;
    })();
    try{
      syncNpc();
      const q = qIdx();
      const gs = el('game-screen');
      const inGame = gs && gs.style.display === 'block';
      // (v239) 문자 이벤트 폐지 — 풀스크린 카드가 흐름을 끊고 입력까지 잠갔다.
      //  길 안내는 담이가 좌하단에서 대신한다.
      const SMS_DISABLED = true;
      if (!SMS_DISABLED && inGame && !dlgOpen() && !window.__bdGuideOpen && window.BD_tip){
        const c = CH[q];
        if (c && !window.BD_tipSeen(c.sms.id))
          BD_tip(c.sms.id, { icon:'\uD83D\uDCF1', title:c.sms.title, text:c.sms.text });
        else if (q === 5 && !window.BD_tipSeen(FINAL_SMS.id))
          BD_tip(FINAL_SMS.id, { icon:'\uD83D\uDCF1', title:FINAL_SMS.title, text:FINAL_SMS.text });
      }
      // ❗ 마커: 현재 장 스테이지 + 미완일 때
      const c = CH[q];
      if (inGame && c && typeof currentStage !== 'undefined' && currentStage === c.st
          && !dlgOpen() && !chCleared(q)){
        const p = toScreen(c.pos.x, c.pos.y - 0.06);
        if (p){ mark.style.display = 'block'; mark.style.left = (p.x - 10) + 'px'; mark.style.top = (p.y - 20) + 'px'; }
        else mark.style.display = 'none';
      } else mark.style.display = 'none';
    }catch(e){ mark.style.display = 'none'; }
  }, 400);
})();
