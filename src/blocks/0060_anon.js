
/* ══ (v217) 문화의집 3층 프롤로그 튜토리얼 — 단계 머신 ══
   0 이동(WASD 카드·거리 검증) → 1 데스크 F(펄스 안내) → 배지 수여 연출
   → 2 가방 E(열기·닫기 검증)+메뉴 안내 → 3 계단 안내 → 광장 도착 시 완료·프롤로그 재생 */
(function(){
  'use strict';
  const DONE_KEY = 'bd_tut2_done';
  const CULT = 101;
  const P = {
    desk: { x:0.565, y:0.270 },    // 안내데스크 카운터 앞 (v229 새 맵)
    exit: { x:0.700, y:0.170 },    // 상단 엘리베이터
  };
  const S = { step:-1, afterPrologue:null, introShown:false, walked:0, lastX:null, lastY:null,
              moveDone:false, badgeGiven:false, bagOpened:false, ceremonyUp:false };
  function done(){ try{ return localStorage.getItem(DONE_KEY)==='1'; }catch(e){ return false; } }
  function markDone(){
    try{ localStorage.setItem(DONE_KEY,'1'); }catch(e){}
    try{ if(window.BD_DAMI && BD_DAMI.wake) BD_DAMI.wake(); }catch(e){}   // (v240c) 수여식 누락 안전망
    /* (v388) 담이 튜토리얼 시작은 더 이상 여기서 독립 타이머로 걸지 않는다 —
       바깥 오프닝(BD_damiOpening)이 끝난 뒤 이어서 호출한다 (아래 exit 지점 참고).
       예전엔 오프닝과 동시에 타이머가 돌아, 오프닝 대사가 지도 튜토리얼 중에
       밀렸다가 끝난 뒤 한꺼번에 재생되며 지도 설명이 두 번 들리는 문제가 있었다. */
  }
  function el(id){ return document.getElementById(id); }
  function ensure(id){ let d=el(id); if(!d){ d=document.createElement('div'); d.id=id; document.body.appendChild(d);} return d; }
  function dist(x,y){ const dx=heroX-x, dy=heroY-y; return Math.sqrt(dx*dx+dy*dy); }
  function toScreen(mx,my){
    try{
      const cv=el('game-canvas'); if(!cv) return null;
      const rect=cv.getBoundingClientRect();
      const px=((((mx-camX)/VIEWPORT_W+0.5)*BASE_W)-BASE_W/2)*currentScale+cv.width/2;
      const py=((((my-camY)/VIEWPORT_H+0.5)*BASE_H)-BASE_H/2)*currentScale+cv.height/2;
      return { x:rect.left+px/(cv.width/rect.width), y:rect.top+py/(cv.height/rect.height) };
    }catch(e){ return null; }
  }
  function dlgOpen(){
    const d=el('bd-dialog'); if(d&&d.classList.contains('show')) return true;
    const vn=el('dialogue-box');
    if(vn&&vn.offsetHeight>0&&parseFloat(getComputedStyle(vn).opacity)>0.05) return true;
    return false;
  }
  function invIsOpen(){
    const o=el('inv-overlay'); return !!(o && o.classList.contains('open'));
  }
  function say(name, lines, cb){
    /* (v374) 프롤로그 대사는 3층(101) 한정 — 플레이어가 먼저 나갔으면 뒤늦게 재생하지 않는다 */
    try{ if (typeof currentStage !== 'undefined' && Number(currentStage) !== CULT){ if (cb) cb(); return; } }catch(eS){}
    /* (v147) «대화 중 다른 NPC 대사가 갑자기 등장» — 튜토리얼 독백이 타이머로 발화되면서
       진행 중이던 주민 대화를 덮어쓰던 문제. 대화창이 닫힌 뒤에 말하도록 미룬다. */
    try{
      if (dlgOpen() || window.__bdSceneActive){
        if (say.__pending) return;              // 중복 예약 방지
        say.__pending = true;
        var waited = 0;
        var iv = setInterval(function(){
          waited += 200;
          if (waited > 40000){ clearInterval(iv); say.__pending = false; return; }
          try{ if (dlgOpen() || window.__bdSceneActive) return; }catch(e2){}
          clearInterval(iv); say.__pending = false;
          setTimeout(function(){ say(name, lines, cb); }, 500);
        }, 200);
        return;
      }
    }catch(e){}
    try{ if(typeof showDialog==='function'){ showDialog(name, lines, cb||null); return; } }catch(e){}
    if(cb) cb();
  }

  /* ── 하단 안내 카드 (키캡 스타일) ── */
  var _damiSaid = {};
  function damiOnce(k, text, face){
    if (window.__bdDamiIntroBusy) return;   // (v240d) 첫 만남 대사 재생 중엔 보류 — 덮어쓰기 방지
    if (_damiSaid[k]) return;
    _damiSaid[k] = true;
    try{ if (window.BD_DAMI) window.BD_DAMI.show(text, { face: face || 'base', channel: 'tut', when: function(){ return Number(currentStage) === CULT; } }); }catch(e){}   /* (v374) 3층을 떠났으면 폐기 */
  }
  function card(html){
    const c = ensure('bd-tut-card');
    c.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:2100;'
      + 'background:rgba(14,20,38,.94);border:1px solid rgba(255,216,77,.75);border-radius:14px;'
      + 'padding:12px 22px;color:#ffe9a8;font-family:"Noto Serif KR",serif;font-size:17px;font-weight:700;'
      + 'box-shadow:0 8px 26px rgba(0,0,0,.55);text-align:center;line-height:1.9;pointer-events:none;';
    c.innerHTML = html;
    c.style.display = 'block';
  }
  function cardOff(){ const c=el('bd-tut-card'); if(c) c.style.display='none'; }
  function key(k){ return '<span style="display:inline-block;min-width:26px;padding:2px 8px;margin:0 2px;'
    + 'border:1px solid #ffd84d;border-radius:7px;background:rgba(255,216,77,.14);color:#ffd84d;">'+k+'</span>'; }

  /* ── 배지 수여 연출 ── */
  function badgeCeremony(cb){
    S.ceremonyUp = true;
    const ov = ensure('bd-badge-ov');
    ov.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(4,8,18,.86);'
      + 'display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;';
    ov.innerHTML =
      '<style>@keyframes bdBadgeIn{0%{transform:scale(.15) rotate(-25deg);opacity:0}60%{transform:scale(1.25) rotate(6deg)}100%{transform:scale(1) rotate(0)}}'
      + '@keyframes bdBadgeGlow{0%,100%{box-shadow:0 0 34px 10px rgba(255,216,77,.45)}50%{box-shadow:0 0 60px 22px rgba(255,216,77,.75)}}'
      + '@keyframes bdBadgeTxt{0%{transform:translateY(16px);opacity:0}100%{transform:translateY(0);opacity:1}}</style>'
      + '<div style="width:150px;height:150px;border-radius:50%;display:flex;align-items:center;justify-content:center;'
      + 'background:radial-gradient(circle at 35% 30%, #ffe9a0, #e0a92e 62%, #9a6d12);border:5px solid #fff3c4;'
      + 'font-size:76px;animation:bdBadgeIn .9s cubic-bezier(.2,1.4,.4,1) both, bdBadgeGlow 1.6s ease-in-out .9s infinite;">\uD83D\uDEE1\uFE0F</div>'
      + '<div style="margin-top:26px;font-family:\'Noto Serif KR\',serif;font-size:26px;font-weight:800;color:#ffe9a8;'
      + 'animation:bdBadgeTxt .6s .5s both;">\uD83D\uDEE1 \uC9C0\uD0B4\uC774 \uBC30\uC9C0\uB97C \uBC1B\uC558\uB2E4!</div>'
      + '<div style="margin-top:12px;font-size:14px;color:#9fb0d0;animation:bdBadgeTxt .6s 1s both;">Space \uB610\uB294 \uD074\uB9AD\uC73C\uB85C \uACC4\uC18D</div>';
    ov.style.display = 'flex';
    try{ if(window.BDSound && BDSound.win) BDSound.win(); }catch(e){}
    function close(){
      if (!S.ceremonyUp) return;
      S.ceremonyUp = false;
      ov.style.display = 'none';
      document.removeEventListener('keydown', onKey, true);
      if (cb) setTimeout(cb, 250);
    }
    // (v221fix) 리스너는 즉시 등록하되 700ms 동안은 무시 — 지연 등록 시
    //  연출을 먼저 닫으면 리스너가 남아 Space/Enter가 영구 잠기는 레이스가 있었다.
    var t0 = Date.now();
    function onKey(e){
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault(); e.stopPropagation();
      if (Date.now() - t0 < 700) return;
      close();
    }
    ov.onclick = close;
    document.addEventListener('keydown', onKey, true);
  }

  window.BD_badgeCeremony = badgeCeremony;   // (v25통합) 수여식 연출 외부 노출 — v278 이관 때 호출이 끊긴 연출 복원용

  window.BD_TUT2_START = function(){
    if (done()) return 1;
    S.step = 0; S.introShown = false; S.walked = 0; S.lastX = null; S.moveDone = false;
    S.badgeGiven = false; S.bagOpened = false;
    return CULT;
  };
  window.BD_TUT2_DEFER = function(after){
    if (done() || S.step < 0) return false;
    S.afterPrologue = after;
    return true;
  };
  const _oldNew = window.BD_startNewGame;
  if (_oldNew) window.BD_startNewGame = function(){
    try{ localStorage.removeItem(DONE_KEY); }catch(e){}
    try{ if (window.BD_resetTips) BD_resetTips(); }catch(e){}   // (v226) 안내·문자 1회성 리셋
    S.step = -1; S.afterPrologue = null;
    return _oldNew.apply(this, arguments);
  };

  /* 안내데스크 직원 스프라이트 주입 */
  function ensureNpc(){
    try{
      const st = STAGES[CULT]; if(!st) return;
      if (st.objects.some(o=>o && o._tut2npc)) return;
      const src = (STAGES[1].objects||[]).find(o=>o && o.resident && /\uC548\uB0B4\uB370\uC2A4\uD06C|\uC218\uC9C4/.test(o.label||''));
      const o = src ? JSON.parse(JSON.stringify(src)) : { type:'prop', label:'\uC548\uB0B4\uB370\uC2A4\uD06C \uC9C1\uC6D0' };
      delete o.residentId;
      // (v41) 문화의집 선생님 전용 도트 — 수진·서연이 쓰는 culture_npc_03과 분리
      o.assetId = 'culture_teacher_v41'; o.key = 'asset:culture_teacher_v41'; o.customImage = true;
      o._tut2npc = true; o.interactable = '';
      // (v271) 기획서 §7.2 — 안내데스크 선생님: 기존 주민 대화 시스템 재사용
      o.resident = true;
      o.npcName = '문화의집 선생님';
      o.label = '문화의집 선생님';
      o.npcLines = [
        '왔구나. 오늘도 와 줘서 고마워.',
        '네가 그동안 문화의집 활동에도 꾸준히 참여하고, 봉사활동도 열심히 해 줬잖아.',
        '새로 온 친구들이 어색하지 않게 챙겨 준 것도 선생님들이 다 알고 있어.',
        '그래서 작은 선물을 준비했어. 「봉담 활동 배지」야.',
        '실은 부탁도 하나 있어. 요즘 봉담 곳곳에 손이 덜 간 곳이 늘어서, 문화의집이 «봉담 안전지도 만들기»를 시작했거든.',
        '동네를 돌면서 위험한 곳은 정리하고, 좋은 시설은 직접 가서 확인해 지도를 채워 줬으면 해.',
        '네가 완성한 지도는 다음 지킴이들에게 물려줄, 봉담의 안전 교과서가 될 거야.',
        '특별한 물건은 아니야. …아마도. 지금까지 열심히 참여했다는 표시니까 잘 간직해 줘.',   /* (v370) 담이 각성 복선 */
        '온 김에 바로 가지 말고 놀다가 가. PC존이나 노래연습실도 들렀다 가도 돼.'   /* (v370) 도입 템포 — 2줄→1줄 */
      ];
      // (v266) 에디터에서 옮겨 저장한 위치가 있으면 그 위치로 생성 (기본 0.545/0.100)
      var __tp = window.__bdTutorPos;
      // (v54) 기본 위치 교정 — 구값(0.545, 0.100)은 상단 벽 위(화장실 구역)에 떠 보이던 원인.
      //  안내데스크 앞으로 이동 (에디터로 옮겨 저장하면 그 위치가 우선)
      o.rx = (__tp && isFinite(__tp.x)) ? __tp.x : 0.575;
      o.ry = (__tp && isFinite(__tp.y)) ? __tp.y : 0.235;
      o.rw = 0.045; o.rh = 0.095;
      delete o.cx; delete o.cy; delete o.cw; delete o.ch;
      st.objects.push(o);
    }catch(e){}
  }
  function removeNpc(){
    try{
      const st = STAGES[CULT]; if(!st) return;
      st.objects = st.objects.filter(o=>!(o && o._tut2npc));
    }catch(e){}
  }

  const HINTS = {
    0: '\uD83C\uDFC3 \uC6C0\uC9C1\uC774\uB294 \uC5F0\uC2B5\uC744 \uD574\uBD10\uC694',
    1: '💁 문화의집 선생님께 다가가 F 키로 말을 걸어요',   /* (v367) 강조 대상과 문구 일치 */
    2: '\uD83C\uDF92 E \uD0A4\uB85C \uAC00\uBC29\uC744 \uC5F4\uC5B4 \uBC30\uC9C0\uB97C \uD655\uC778\uD574\uC694',
    3: '\uD83D\uDEAA \uC0C1\uB2E8 \uC5D8\uB9AC\uBCA0\uC774\uD130\uB85C \uAC78\uC5B4\uAC00\uC694',
  };

  /* ── (v278) 데스크 대화 정본 통일 — 대화·수여식·실내 각성은 신규 프롤로그(주민 대화 §7.2)가 담당.
        구 시스템은 '후속 처리'만 맡는다: 배지 실물·간식 지급 + 단계 전진(엘리베이터 안내로).
        (이전엔 F 한 번에 수진 대화와 선생님 대화가 동시에 떠 겹치고, 담이가 실내에서 깨어나던 문제) ── */
  window.BD_addTick(function(){
    if (done() || S.step < 0 || S.step >= 2) return;   // (v278b) 이동 안내(0)·데스크 안내(1) 어느 단계든 수용
    if (!(window.BD_PROGRESS && BD_PROGRESS.story && BD_PROGRESS.story.tutorialFlags && BD_PROGRESS.story.tutorialFlags.badgeGiven)) return;
    if (localStorage.getItem('bd_dami_awake') !== '1') return;   /* (v287) 수여식·각성이 끝난 뒤에만 진행 */
    cardOff();
    S.badgeGiven = true;
    // 가방에 실물 지급 — E 가방 튜토리얼에서 바로 보이도록
    try {
      var pool = window.ITEM_POOL || (typeof ITEM_POOL !== 'undefined' ? ITEM_POOL : null);
      var bd = pool && pool.find(function(it){ return it.id === 'guardian_badge'; });
      if (!bd) bd = { id:'guardian_badge', tab:'misc', icon:'🛡️', name:'지킴이 배지',
                      desc:'문화의집에서 자원봉사를 성실히 한 청소년에게 주어지는 배지.' };
      var addFn = window.addToInventory || (typeof addToInventory==='function'? addToInventory : null);
      if (addFn && !(window.playerInventory && playerInventory.guardian_badge)) addFn(bd, 1);
    } catch(e){ try{ window.__tut2ItemErr = String(e); }catch(e2){} }
    // 간식 1개 — 첫 전투 '먹어보기' 실습용 (전투 메뉴 BD.items + 필드 인벤 양쪽)
    try {
      if (window.BD) { BD.items = BD.items || {}; if ((BD.items.snack||0) < 1) BD.items.snack = 1; }
      var addFn2 = window.addToInventory || (typeof addToInventory==='function'? addToInventory : null);
      if (addFn2 && !(window.playerInventory && playerInventory.snack))
        addFn2({ id:'snack', name:'문화의집 간식', icon:'🍪',
                 heal:'hp', amount:40, price:30, desc:'HP 40 회복' }, 1);
    } catch(e){}
    S.step = 2;
  }, 700);

  /* ── 마스터 틱: 단계 진행·마커·카드 ── */
  window.BD_addTick(function(){
    const mark = ensure('bd-tut2-mark');
    const active = !done() && S.step >= 0 &&
      typeof currentStage !== 'undefined' && currentStage === CULT;

    // 광장/와우리 도착 → 완료 + 미뤄둔 프롤로그 VN (v25통합: 신맵 212 도착 인정)
    if (!done() && S.step >= 0 && typeof currentStage !== 'undefined' && (currentStage === 1 || currentStage === 212)){
      markDone(); removeNpc(); cardOff();
      mark.style.display='none';
      window.BD_TUT2_HINT = null;
      const after = S.afterPrologue; S.afterPrologue = null; S.step = -1;
      // (v239) 밖으로 나오면 대화창으로 붙잡지 않는다.
      //  선생님 VN 컷신을 걷어내고, 담이가 좌하단에서 말을 걸며 세계관을 흘린다.
      //  플레이어는 처음부터 자유롭게 움직일 수 있다.
      window.__bdTut2ProloguePlayed = true;
      /* (v388) 오프닝이 끝난 뒤에야 담이 메인 튜토리얼(지도 튜토리얼 포함)을 시작한다 —
         동시에 돌리면 지도 튜토리얼 중 오프닝 대사가 밀렸다가 끝난 뒤 몰아서 재생됐다. */
      try{
        if (typeof window.BD_damiOpening === 'function'){
          window.BD_damiOpening(false, function(){
            try{ if (window.BD_startDamiTutorial) window.BD_startDamiTutorial(); }catch(e){}
          });
        } else if (window.BD_startDamiTutorial) window.BD_startDamiTutorial();
      }catch(e){}
      if (after) { try{ after(); }catch(e){} }
      return;
    }
    if (!active){
      mark.style.display='none'; cardOff();
      window.BD_TUT2_HINT = null;
      return;
    }
    ensureNpc();

    // (v218) 대화창·연출이 떠 있는 동안엔 안내 카드를 숨겨 UI 겹침 방지
    if (dlgOpen() || S.ceremonyUp) cardOff();

    // 오프닝 독백 → 이동 튜토리얼 시작
    if (!S.introShown && !dlgOpen()){
      const gs = el('game-screen');
      if (gs && gs.offsetHeight > 0){
        S.introShown = true;
        setTimeout(function(){
          say('\uB098', [
            '(\uBC29\uACFC \uD6C4, \uC624\uB298\uB3C4 \uBB38\uD654\uC758\uC9D1\uC5D0 \uB4E4\uB800\uB2E4.)',
            '(\uADF8\uB7F0\uB370 \uC624\uB298\uC740 \uBB38\uD654\uC758\uC9D1 \uC120\uC0DD\uB2D8\uC774 3\uCE35\uC73C\uB85C \uB098\uB97C \uBD80\uB974\uC168\uB2E4\u2026 \uBB34\uC2A8 \uC77C\uC77C\uAE4C?)',
          ]);
        }, 900);
      }
    }

    // step 0: 이동 검증 — (v231) 실제로 3초 이상 움직여야 완료
    if (S.step === 0 && S.introShown && !dlgOpen()){
      if (S.lastX !== null){
        const moved = Math.abs(heroX - S.lastX) + Math.abs(heroY - S.lastY);
        S.walked += moved;
        if (moved > 0.0015) S.moveTime = (S.moveTime || 0) + 0.25;   // 움직인 틱만 누적
      }
      S.lastX = heroX; S.lastY = heroY;
      if (!S.moveDone){
        if ((S.moveTime || 0) >= 1.2){   // (v239) 3초는 너무 길어 답답했다
          S.moveDone = true;
          card('\u2705 \uC798\uD588\uC5B4\uC694!');
          try{ if(window.BDSound && BDSound.select) BDSound.select(); }catch(e){}
          setTimeout(function(){
            cardOff(); S.step = 1;
            say('\uB098', ['(\uC88B\uC544, \uC774\uC81C \uC548\uB0B4\uB370\uC2A4\uD06C \uC120\uC0DD\uB2D8\uAED8 \uAC00 \uBCF4\uC790.)']);
          }, 1100);
        } else {
          card(key('W')+key('A')+key('S')+key('D')+' \uB610\uB294 \uBC29\uD5A5\uD0A4\uB85C \uC6C0\uC9C1\uC5EC \uBCF4\uC138\uC694'
            + '<div style="font-size:13px;color:#9fb0d0;margin-top:2px;">\uB300\uD654\uB294 '+key('Space')+' \uB85C \uB118\uACA8\uC694</div>');
        }
      }
    }

    // step 1: F 안내 (근접 시 펄스 카드)
    if (S.step === 1 && !dlgOpen() && !S.ceremonyUp){
      if (dist(P.desk.x, P.desk.y) <= 0.11){
        card(key('F')+' \uD0A4\uB85C \uBB38\uD654\uC758\uC9D1 \uC120\uC0DD\uB2D8\uAED8 \uB9D0\uC744 \uAC78\uC5B4\uC694');
      } else cardOff();
    }

    // step 2: 가방 열기 → 닫기 → 메뉴 안내 → step 3
    if (S.step === 2 && !dlgOpen() && !S.ceremonyUp){
      if (!S.bagOpened){
        if (invIsOpen()){
          S.bagOpened = true;
          cardOff();
          damiOnce('bag_close', '\uD655\uC778\uD588\uC73C\uBA74 E \uB098 ESC \uB85C \uAC00\uBC29\uC744 \uB2EB\uC544\uC694', 'base');
        } else {
          cardOff();
          damiOnce('bag_open', '\uC81C\uAC00 \uAC00\uBC29 \uC548\uC5D0 \uB4E4\uC5B4\uAC00 \uC788\uC5B4\uC694! E \uD0A4\uB85C \uC5F4\uC5B4\uC11C \uD655\uC778\uD574 \uBCFC\uAE4C\uC694?', 'proud');
        }
      } else if (!invIsOpen()){
        cardOff();
        S.step = 3;
        try{ if (window.BD_DAMI)
          window.BD_DAMI.show('\uC704\uCABD \uBA54\uB274\uC5D0\uC11C \uC7A5\uBE44\u00B7\uCE74\uB4DC\u00B7\uC548\uC804\uC9C0\uB3C4\uB97C \uBCFC \uC218 \uC788\uC5B4\uC694', { face:'base', once:'dami_menu', channel:'tut', when:function(){ return Number(currentStage) === CULT; } }); }catch(e){}
        setTimeout(function(){
          say('\uBB38\uD654\uC758\uC9D1 \uC120\uC0DD\uB2D8', [
            '\uC870\uC2EC\uD788 \uB2E4\uB140\uC640\uC694.',
          ], function(){
            if (window.BD_DAMI) {
              window.BD_DAMI.show('\uC704\uCABD \uC5D8\uB9AC\uBCA0\uC774\uD130\uB97C \uD0C0\uACE0 \uB0B4\uB824\uAC00\uC694. \uC81C\uAC00 \uAE38\uC744 \uC54C\uB824\uB4DC\uB9B4\uAC8C\uC694!', { face:'base', channel:'tut', when:function(){ return Number(currentStage) === CULT; } });   /* (v374) 이미 나갔으면 생략 */
            }
          });
        }, 1400);
      }
    }

    // 마커·힌트
    const goal = (S.step === 1) ? P.desk : (S.step === 3 ? P.exit : null);
    window.BD_TUT2_HINT = HINTS[S.step] || null;
    // (v232) 외부 노출: 엘리베이터 게이트·바닥 길안내가 진행 단계를 알 수 있게
    window.__bdTut2Step = done() ? 99 : S.step;
    window.__bdTut2Goal = (active && goal)
      ? { cx: goal.x, cy: goal.y, d: Math.hypot(heroX - goal.x, heroY - goal.y) } : null;
    if (goal){
      const p = toScreen(goal.x, goal.y);
      if (p){ mark.textContent='\u25BC'; mark.style.display='block';
              mark.style.left=p.x+'px'; mark.style.top=(p.y-34)+'px'; }
    } else mark.style.display='none';
  }, 250);
})();
