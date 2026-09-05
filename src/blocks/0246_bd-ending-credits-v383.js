/* (v383) 지도 완성 엔딩 크레딧
   - 아래 BD_CREDITS_DATA의 sections[].entries만 수정하면 이름·역할·인원 수가 자동 반영된다.
   - View(마크업 생성)와 Controller(재생/정지/종료)를 분리하고, 닫을 때 이벤트와 RAF를 모두 정리한다. */
(function(){
  'use strict';

  var BACKGROUND_IMAGE = 'data:image/webp;base64,@@B64:30bec18b_BACKGROUND_IMAGE.webp@@';
  /* (v388d) 화성시여성가족청소년재단 로고 — 사용자 제공 원본(흰 배경)을
     투명 PNG 로 언믹스하고, 어두운 크레딧 배경에서 읽히도록 저채도 글자만
     밝은 회백색(#dadde4)으로 보정했다(마크 핑크/블루는 원색 유지).
     원본: assets/_원본팩/화성시여성가족청소년재단_로고_원본.png */
  var LOGO_HWASEONG = 'data:image/png;base64,@@B64:bd8f2a71_LOGO_HWASEONG.png@@';

  /* ── 크레딧 편집 영역: 개발자 정보가 정해지면 이 객체만 교체 ───────────── */
  var DEFAULT_CREDITS_DATA = {
    gameTitle: '봉담 안전지도 대작전',
    completionLabel: 'SAFETY MAP COMPLETE',
    endingTitle: '우리 동네를 지키는 작은 모험',
    endingCopy: '서로를 살피는 작은 마음들이 모여\n오늘의 봉담을 더 안전하게 만들었습니다.',
    sections: [
      {
        heading: 'CREATED BY',
        entries: [
          { name: 'AI플레이메이커스', role: '기획 · 개발 · 아트' }
        ]
      },
      /* (v388) 이름만 있는 항목(role 없음)은 name-only 로 렌더돼 간격이 좁아진다 — 인원 명단용 */
      {
        heading: '코딩팀',
        entries: [
          { name: '김세윤' },
          { name: '김유찬' },
          { name: '최민준' },
          { name: '최예준' }
        ]
      },
      {
        heading: '아트팀',
        entries: [
          { name: '강한성' },
          { name: '곽태준' },
          { name: '구가빈' },
          { name: '구영민' },
          { name: '김가연' },
          { name: '김동호' },
          { name: '김요환' },
          { name: '김재윤' },
          { name: '김정우' },
          { name: '윤다겸' },
          { name: '전온유' }
        ]
      },
      {
        heading: '미니게임',
        entries: [
          { name: '최민준' },
          { name: '김세윤' }
        ]
      },
      {
        heading: 'WITH',
        entries: [
          { name: '봉담청소년문화의집' }
        ],
        /* (v388) 섹션 하단 로고 — logo 가 있으면 명단 아래에 이미지가 붙는다 */
        logo: LOGO_HWASEONG,
        logoAlt: '화성시여성가족청소년재단'
      }
    ],
    specialThanksTitle: 'SPECIAL THANKS',
    specialThanks: [
      '봉담의 청소년과 지역 주민들',
      '끝까지 함께해 준 모든 지킴이'
    ],
    closingTitle: '플레이해 주셔서 감사합니다',
    closingCopy: '완성된 안전 지도는 우리 모두의 약속입니다.'
  };

  /* HTML보다 먼저 window.BD_CREDITS_DATA를 정의하면 외부 설정도 사용할 수 있다. */
  var creditsData = window.BD_CREDITS_DATA || DEFAULT_CREDITS_DATA;
  window.BD_CREDITS_DATA = creditsData;

  var active = null;

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function appendText(parent, tag, className, text){
    var el = document.createElement(tag);
    if(className) el.className = className;
    el.textContent = text == null ? '' : String(text);
    parent.appendChild(el);
    return el;
  }

  function ensureStyle(){
    if(document.getElementById('bd-ending-credits-style-v383')) return;
    var style = document.createElement('style');
    style.id = 'bd-ending-credits-style-v383';
    style.textContent = [
      '#bd-ending-credits{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:2147483600;overflow:hidden;background:#020203;color:#f7f7f5;font-family:inherit;isolation:isolate;opacity:0;transition:opacity .7s ease;}',
      '#bd-ending-credits.bd-cr-visible{opacity:1;}',
      '#bd-ending-credits *{box-sizing:border-box;}',
      '.bd-cr-bg{position:absolute;inset:-2%;z-index:-4;background-position:center;background-size:cover;transform:scale(1.035);opacity:0;filter:saturate(.55) brightness(.48);transition:opacity 2.4s ease;}',
      '.bd-cr-ended .bd-cr-bg,.bd-cr-reduced .bd-cr-bg{opacity:.14;}',
      '.bd-cr-shade{position:absolute;inset:0;z-index:-3;background:radial-gradient(circle at 50% 52%,rgba(13,14,18,.26),rgba(2,2,3,.94) 72%),linear-gradient(180deg,rgba(2,2,3,.5),rgba(2,2,3,.8));}',
      '.bd-cr-grain{position:absolute;inset:0;z-index:-2;pointer-events:none;opacity:.055;background-image:radial-gradient(rgba(255,255,255,.7) .45px,transparent .6px);background-size:4px 4px;mix-blend-mode:soft-light;}',
      '.bd-cr-top{position:absolute;z-index:5;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:max(16px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) 14px max(18px,env(safe-area-inset-left));background:linear-gradient(180deg,rgba(2,2,3,.82),transparent);}',
      '.bd-cr-mini-brand{font-size:clamp(10px,1.25vw,13px);font-weight:800;letter-spacing:.2em;color:rgba(247,247,245,.55);white-space:nowrap;}',
      '.bd-cr-actions{display:flex;gap:8px;align-items:center;}',
      '.bd-cr-control{appearance:none;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(10,10,12,.64);backdrop-filter:blur(9px);color:#f7f7f5;padding:9px 14px;min-height:38px;font:700 12px/1 inherit;cursor:pointer;transition:background .18s,border-color .18s,transform .18s;}',
      '.bd-cr-control:hover,.bd-cr-control:focus-visible{background:rgba(36,36,39,.9);border-color:rgba(255,255,255,.72);outline:none;transform:translateY(-1px);}',
      '.bd-cr-viewport{position:absolute;inset:0;overflow:hidden;mask-image:linear-gradient(transparent 0,#000 12%,#000 88%,transparent 100%);-webkit-mask-image:linear-gradient(transparent 0,#000 12%,#000 88%,transparent 100%);}',
      '.bd-cr-track{width:min(760px,calc(100vw - 44px));margin:0 auto;text-align:center;will-change:transform;transform:translate3d(0,80vh,0);padding:1px 0 20vh;}',
      '.bd-cr-opening{min-height:72vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10vh 0;}',
      '.bd-cr-complete{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border:1px solid rgba(255,255,255,.26);border-radius:999px;background:rgba(255,255,255,.035);color:rgba(255,255,255,.72);font-size:clamp(10px,1.4vw,13px);font-weight:800;letter-spacing:.2em;}',
      '.bd-cr-complete:before{content:"✦";font-size:.9em;}',
      '.bd-cr-title{margin:24px 0 0;font-size:clamp(34px,6vw,72px);line-height:1.08;font-weight:900;letter-spacing:-.045em;text-wrap:balance;text-shadow:0 3px 24px rgba(0,0,0,.9);}',
      '.bd-cr-kicker{margin-top:16px;color:rgba(255,255,255,.72);font-size:clamp(15px,2.2vw,24px);font-weight:800;letter-spacing:.02em;}',
      '.bd-cr-copy{white-space:pre-line;margin:18px auto 0;max-width:620px;color:rgba(255,255,255,.58);font-size:clamp(13px,1.75vw,17px);line-height:1.85;text-wrap:balance;}',
      '.bd-cr-section{padding:clamp(68px,12vh,132px) 0;}',
      '.bd-cr-heading{margin:0 0 36px;color:rgba(255,255,255,.5);font-size:clamp(11px,1.5vw,14px);font-weight:800;letter-spacing:.3em;}',
      '.bd-cr-entry+.bd-cr-entry{margin-top:34px;}',
      '.bd-cr-name{font-size:clamp(22px,3.5vw,38px);line-height:1.25;font-weight:850;letter-spacing:-.025em;}',
      /* (v388) 이름만 나열되는 팀 명단 — 간격·크기를 줄여 여러 명이어도 흐름이 끊기지 않게 */
      '.bd-cr-entry-name+.bd-cr-entry-name{margin-top:16px;}',
      '.bd-cr-entry-name .bd-cr-name{font-size:clamp(19px,2.7vw,30px);}',
      /* (v388) 섹션 하단 로고 — 어두운 배경 위 투명 PNG */
      '.bd-cr-logo{display:block;margin:26px auto 0;width:auto;max-width:min(300px,62vw);height:auto;object-fit:contain;}',
      '.bd-cr-role{margin-top:9px;color:rgba(255,255,255,.48);font-size:clamp(12px,1.8vw,16px);line-height:1.55;letter-spacing:.04em;}',
      '.bd-cr-thanks-list{display:flex;flex-direction:column;gap:14px;color:#f3f7ff;font-size:clamp(16px,2.5vw,24px);line-height:1.5;font-weight:800;}',
      '.bd-cr-final{min-height:76vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:11vh 0 8vh;}',
      '.bd-cr-final-mark{width:68px;height:68px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:rgba(255,255,255,.045);font-size:31px;box-shadow:0 10px 42px rgba(0,0,0,.4);}',
      '.bd-cr-final-title{margin-top:24px;font-size:clamp(29px,5vw,58px);font-weight:950;letter-spacing:-.04em;text-wrap:balance;text-shadow:0 4px 30px rgba(0,0,0,.76);}',
      '.bd-cr-final-copy{margin-top:15px;color:rgba(255,255,255,.58);font-size:clamp(13px,1.8vw,17px);line-height:1.7;}',
      '.bd-cr-final-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:32px;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .6s ease,transform .6s ease;}',
      '.bd-cr-ended .bd-cr-final-actions,.bd-cr-reduced .bd-cr-final-actions{opacity:1;transform:none;pointer-events:auto;}',
      '.bd-cr-final-btn{appearance:none;min-height:46px;border:1px solid rgba(255,255,255,.28);border-radius:10px;background:rgba(14,14,16,.76);color:#f7f7f5;padding:12px 18px;font:850 13px/1.2 inherit;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .18s,background .18s,border-color .18s;}',
      '.bd-cr-final-btn.bd-cr-primary{border-color:#f3f3f0;background:#f3f3f0;color:#111113;}',
      '.bd-cr-final-btn:not(.bd-cr-primary):hover,.bd-cr-final-btn:not(.bd-cr-primary):focus-visible{outline:none;transform:translateY(-2px);border-color:#fff;background-color:rgba(46,46,50,.94);}',
      '.bd-cr-final-btn.bd-cr-primary:hover,.bd-cr-final-btn.bd-cr-primary:focus-visible{outline:none;transform:translateY(-2px);background:#fff;color:#111113;box-shadow:0 0 0 3px rgba(255,255,255,.2),0 10px 26px rgba(0,0,0,.34);}',
      '.bd-cr-progress{position:absolute;z-index:6;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.08);}',
      '.bd-cr-progress>i{display:block;width:100%;height:100%;background:rgba(255,255,255,.8);transform:scaleX(0);transform-origin:left center;}',
      '.bd-cr-hint{position:absolute;z-index:4;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);color:rgba(236,243,255,.55);font-size:11px;letter-spacing:.04em;transition:opacity .5s;white-space:nowrap;}',
      '.bd-cr-ended .bd-cr-hint{opacity:0;}',
      '.bd-cr-reduced .bd-cr-viewport{overflow-y:auto;mask-image:none;-webkit-mask-image:none;scrollbar-color:rgba(255,224,124,.65) rgba(4,12,34,.4);}',
      '.bd-cr-reduced .bd-cr-track{transform:none!important;padding:12vh 0 max(12vh,env(safe-area-inset-bottom));will-change:auto;}',
      '.bd-cr-reduced .bd-cr-opening,.bd-cr-reduced .bd-cr-final{min-height:auto;padding:13vh 0;}',
      '.bd-cr-reduced .bd-cr-hint,.bd-cr-reduced [data-action="pause"]{display:none;}',
      '@media (max-width:600px){.bd-cr-mini-brand{max-width:38vw;overflow:hidden;text-overflow:ellipsis}.bd-cr-control{padding:8px 11px}.bd-cr-track{width:min(88vw,680px)}.bd-cr-opening{min-height:68vh}.bd-cr-section{padding:64px 0}.bd-cr-final-actions{flex-direction:column;width:min(330px,88vw)}.bd-cr-final-btn{width:100%}.bd-cr-bg{background-position:58% center}.bd-cr-copy br{display:none}}',
      '@media (max-height:560px) and (orientation:landscape){.bd-cr-top{padding-top:10px}.bd-cr-control{min-height:32px;padding:7px 11px}.bd-cr-opening{min-height:92vh}.bd-cr-final{min-height:92vh}.bd-cr-section{padding:74px 0}.bd-cr-final-actions{margin-top:20px}.bd-cr-hint{display:none}}',
      '@media (prefers-reduced-motion:reduce){#bd-ending-credits{transition:none}.bd-cr-bg{animation:none}.bd-cr-control,.bd-cr-final-btn,.bd-cr-final-actions{transition:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildSection(section){
    var wrap = document.createElement('section');
    wrap.className = 'bd-cr-section';
    appendText(wrap, 'h2', 'bd-cr-heading', section && section.heading);
    var entries = section && Array.isArray(section.entries) ? section.entries : [];
    entries.forEach(function(entry){
      var row = document.createElement('div');
      /* (v388) 역할 없이 이름만 있는 항목은 «명단»이므로 더 촘촘하게 — 인원이 늘어도 롤이 과하게 길어지지 않는다 */
      row.className = 'bd-cr-entry' + (entry && entry.role ? '' : ' bd-cr-entry-name');
      appendText(row, 'div', 'bd-cr-name', entry && entry.name);
      if(entry && entry.role) appendText(row, 'div', 'bd-cr-role', entry.role);
      wrap.appendChild(row);
    });
    /* (v388) 섹션 하단 로고 (선택) */
    if(section && section.logo){
      var logo = document.createElement('img');
      logo.className = 'bd-cr-logo';
      logo.src = section.logo;
      logo.alt = section.logoAlt || '';
      logo.decoding = 'async';
      wrap.appendChild(logo);
    }
    return wrap;
  }

  function buildView(data){
    ensureStyle();
    var root = document.createElement('div');
    root.id = 'bd-ending-credits';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', '게임 엔딩 크레딧');
    root.setAttribute('tabindex', '-1');

    var bg = document.createElement('div');
    bg.className = 'bd-cr-bg';
    bg.style.backgroundImage = 'url("' + BACKGROUND_IMAGE + '")';
    root.appendChild(bg);
    appendText(root, 'div', 'bd-cr-shade', '');
    appendText(root, 'div', 'bd-cr-grain', '');

    var top = document.createElement('div');
    top.className = 'bd-cr-top';
    appendText(top, 'div', 'bd-cr-mini-brand', data.gameTitle || '봉담 안전지도 대작전');
    var actions = document.createElement('div');
    actions.className = 'bd-cr-actions';
    var pauseButton = appendText(actions, 'button', 'bd-cr-control', '⏸ 일시정지');
    pauseButton.type = 'button';
    pauseButton.setAttribute('data-action', 'pause');
    pauseButton.setAttribute('aria-pressed', 'false');
    var skipButton = appendText(actions, 'button', 'bd-cr-control', '건너뛰기');
    skipButton.type = 'button';
    skipButton.setAttribute('data-action', 'skip');
    top.appendChild(actions);
    root.appendChild(top);

    var viewport = document.createElement('main');
    viewport.className = 'bd-cr-viewport';
    var track = document.createElement('div');
    track.className = 'bd-cr-track';

    var opening = document.createElement('section');
    opening.className = 'bd-cr-opening';
    appendText(opening, 'div', 'bd-cr-complete', data.completionLabel || 'SAFETY MAP COMPLETE');
    appendText(opening, 'h1', 'bd-cr-title', data.gameTitle || '봉담 안전지도 대작전');
    appendText(opening, 'div', 'bd-cr-kicker', data.endingTitle || '우리 동네를 지키는 작은 모험');
    appendText(opening, 'p', 'bd-cr-copy', data.endingCopy || '');
    track.appendChild(opening);

    (Array.isArray(data.sections) ? data.sections : []).forEach(function(section){
      track.appendChild(buildSection(section));
    });

    var thanks = document.createElement('section');
    thanks.className = 'bd-cr-section';
    appendText(thanks, 'h2', 'bd-cr-heading', data.specialThanksTitle || 'SPECIAL THANKS');
    var thanksList = document.createElement('div');
    thanksList.className = 'bd-cr-thanks-list';
    (Array.isArray(data.specialThanks) ? data.specialThanks : []).forEach(function(line){
      appendText(thanksList, 'div', '', line);
    });
    thanks.appendChild(thanksList);
    track.appendChild(thanks);

    var finalCard = document.createElement('section');
    finalCard.className = 'bd-cr-final';
    appendText(finalCard, 'div', 'bd-cr-final-mark', '🗺️');
    appendText(finalCard, 'div', 'bd-cr-final-title', data.closingTitle || '플레이해 주셔서 감사합니다');
    appendText(finalCard, 'div', 'bd-cr-final-copy', data.closingCopy || '');
    var finalActions = document.createElement('div');
    finalActions.className = 'bd-cr-final-actions';
    var mapButton = appendText(finalActions, 'button', 'bd-cr-final-btn bd-cr-primary', '안전 지도 계속 보기');
    mapButton.type = 'button';
    mapButton.setAttribute('data-action', 'map');
    var replayButton = appendText(finalActions, 'button', 'bd-cr-final-btn', '크레딧 다시 보기');
    replayButton.type = 'button';
    replayButton.setAttribute('data-action', 'replay');
    var titleButton = appendText(finalActions, 'button', 'bd-cr-final-btn', '타이틀로 돌아가기');
    titleButton.type = 'button';
    titleButton.setAttribute('data-action', 'title');
    finalCard.appendChild(finalActions);
    track.appendChild(finalCard);

    viewport.appendChild(track);
    root.appendChild(viewport);
    var progress = document.createElement('div');
    progress.className = 'bd-cr-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.appendChild(document.createElement('i'));
    root.appendChild(progress);
    appendText(root, 'div', 'bd-cr-hint', 'Space로 일시정지 · ESC는 크레딧을 종료하지 않습니다');

    return {
      root: root,
      viewport: viewport,
      track: track,
      opening: opening,
      finalCard: finalCard,
      pauseButton: pauseButton,
      skipButton: skipButton,
      progressBar: progress.firstChild
    };
  }

  function closeActive(destination){
    var state = active;
    if(!state) return;
    active = null;
    if(state.raf) cancelAnimationFrame(state.raf);
    document.removeEventListener('keydown', state.onKeyDown, true);
    document.removeEventListener('visibilitychange', state.onVisibilityChange, false);
    window.removeEventListener('resize', state.onResize, false);
    state.root.removeEventListener('click', state.onClick, false);
    state.root.classList.remove('bd-cr-visible');
    var removeRoot = function(){
      try{ state.root.remove(); }catch(e){}
      try{
        if(destination === 'map' && typeof window.BD_openSafetyMap === 'function'){
          if(window.BD_Bgm && typeof window.BD_Bgm.play === 'function') window.BD_Bgm.play('field');
          window.BD_openSafetyMap();
        }else if(destination === 'title' && typeof window.BD_showTitle === 'function'){
          window.BD_showTitle({ onStart:function(){}, onContinue:function(){} });
        }else if(destination === 'replay'){
          startCredits({ source:'replay' });
        }else if(state.previousFocus && document.contains(state.previousFocus)){
          state.previousFocus.focus();
        }
      }catch(e){}
    };
    setTimeout(removeRoot, 520);
  }

  function startCredits(options){
    options = options || {};
    if(active) closeActive();
    var endingModal = document.getElementById('bd-ending-modal');
    if(endingModal) endingModal.classList.remove('show');

    var view = buildView(window.BD_CREDITS_DATA || DEFAULT_CREDITS_DATA);
    /* 타이틀의 「개발진」 버튼으로 연 경우 마지막 주 동선을 안전지도가 아니라 타이틀 복귀로 바꾼다.
       (v388) 예전에는 「안전 지도 계속 보기」를 타이틀 복귀로 «개명»만 해서
       「타이틀로 돌아가기」 버튼이 두 개 나란히 생겼다 — 이제 지도 버튼을 없애고
       원래 있던 타이틀 버튼을 주 버튼으로 올린다. */
    if(options.source === 'title' || options.source === 'dev'){
      var mapBtn = view.root.querySelector('[data-action="map"]');
      var titleBtn = view.root.querySelector('[data-action="title"]');
      if(mapBtn && titleBtn){
        mapBtn.remove();
        titleBtn.classList.add('bd-cr-primary');
        if(titleBtn.parentNode) titleBtn.parentNode.insertBefore(titleBtn, titleBtn.parentNode.firstChild);
      } else if(mapBtn){
        mapBtn.setAttribute('data-action', 'title');
        mapBtn.textContent = '타이틀로 돌아가기';
      }
    }
    var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var state = {
      root: view.root,
      viewport: view.viewport,
      track: view.track,
      opening: view.opening,
      finalCard: view.finalCard,
      pauseButton: view.pauseButton,
      progressBar: view.progressBar,
      previousFocus: document.activeElement,
      raf: 0,
      startY: 0,
      endY: 0,
      duration: 48000,
      holdDuration: 3200,
      elapsed: 0,
      startedAt: 0,
      paused: false,
      autoPaused: false,
      ended: false,
      reduced: reduced
    };
    active = state;
    /* UI 배율 옵션은 body에 CSS zoom을 적용한다. 크레딧을 html 바로 아래에 두어
       95% 자동 배율인 4:3 태블릿에서도 화면 가장자리에 빈 띠가 생기지 않게 한다. */
    (document.documentElement || document.body).appendChild(state.root);
    if(reduced) state.root.classList.add('bd-cr-reduced', 'bd-cr-ended');

    function measure(keepProgress){
      if(state.reduced || active !== state) return;
      var priorProgress = keepProgress && state.duration ? clamp(state.elapsed / state.duration, 0, 1) : 0;
      var vh = state.viewport.clientHeight || window.innerHeight || 720;
      var openingCenter = state.opening.offsetTop + state.opening.offsetHeight * 0.5;
      /* 첫 프레임부터 타이틀을 중앙에 고정해 빈 검정 화면으로 시작하지 않는다. */
      state.startY = vh * 0.5 - openingCenter;
      var finalCenter = state.finalCard.offsetTop + state.finalCard.offsetHeight * 0.5;
      state.endY = vh * 0.5 - finalCenter;
      var distance = Math.max(1, state.startY - state.endY);
      /* (v388) 스크롤 속도 2배 — 24ms/px(≈42px/s)는 너무 느려 명단이 길어지면 지루했다.
         12ms/px(≈83px/s)는 일반적인 롤링 크레딧 속도. 상·하한도 같은 비율로 낮춘다. */
      state.duration = clamp(distance * 12, 20000, 44000) + state.holdDuration;
      state.elapsed = state.duration * priorProgress;
      state.startedAt = performance.now();
      render(priorProgress);
    }

    function render(progressValue){
      var progress = clamp(progressValue, 0, 1);
      /* 롤링 크레딧은 읽는 속도가 변하지 않도록 처음부터 끝까지 선형 이동한다. */
      var elapsed = progress * state.duration;
      var eased = clamp((elapsed - state.holdDuration) / Math.max(1, state.duration - state.holdDuration), 0, 1);
      var y = state.startY + (state.endY - state.startY) * eased;
      state.track.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
      state.progressBar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    }

    function finish(){
      if(state.ended || active !== state) return;
      state.ended = true;
      state.paused = false;
      state.elapsed = state.duration;
      render(1);
      state.root.classList.add('bd-cr-ended');
      state.pauseButton.textContent = '✓ 크레딧 완료';
      state.pauseButton.disabled = true;
      var primary = state.root.querySelector('[data-action="map"],[data-action="title"]');
      if(primary) setTimeout(function(){ try{ primary.focus(); }catch(e){} }, 650);
    }

    function tick(now){
      if(active !== state || state.reduced || state.ended) return;
      if(!state.paused){
        state.elapsed += Math.max(0, Math.min(80, now - state.startedAt));
        state.startedAt = now;
        render(state.elapsed / state.duration);
        if(state.elapsed >= state.duration){ finish(); return; }
      }else{
        state.startedAt = now;
      }
      state.raf = requestAnimationFrame(tick);
    }

    function setPaused(paused, automatic){
      if(state.ended || state.reduced) return;
      state.paused = !!paused;
      state.autoPaused = !!(automatic && paused);
      state.pauseButton.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
      state.pauseButton.textContent = state.paused ? '▶ 계속 보기' : '⏸ 일시정지';
      state.startedAt = performance.now();
    }

    state.onClick = function(event){
      var button = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
      if(!button) return;
      var action = button.getAttribute('data-action');
      if(action === 'pause') setPaused(!state.paused, false);
      else if(action === 'skip') finish();
      else if(action === 'map') closeActive('map');
      else if(action === 'title') closeActive('title');
      else if(action === 'replay') closeActive('replay');
    };

    state.onKeyDown = function(event){
      if(active !== state) return;
      if(event.key === 'Escape'){
        /* 브라우저 전체화면 ESC 정책은 웹에서 막을 수 없다. 게임의 종료 키로는 사용하지 않는다. */
        event.stopImmediatePropagation();
        return;
      }
      if(event.key === ' ' && !(event.target && /^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))){
        event.preventDefault();
        event.stopImmediatePropagation();
        setPaused(!state.paused, false);
        return;
      }
      if(event.key === 'Tab'){
        var focusable = Array.prototype.slice.call(state.root.querySelectorAll('button:not([disabled])'));
        if(!focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length - 1];
        if(event.shiftKey && document.activeElement === first){ event.preventDefault(); last.focus(); }
        else if(!event.shiftKey && document.activeElement === last){ event.preventDefault(); first.focus(); }
      }
    };

    state.onVisibilityChange = function(){
      if(document.hidden){ if(!state.paused) setPaused(true, true); }
      else if(state.autoPaused){ state.autoPaused = false; setPaused(false, false); }
    };
    var resizeTimer = 0;
    state.onResize = function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){ measure(true); }, 160);
    };

    state.root.addEventListener('click', state.onClick, false);
    document.addEventListener('keydown', state.onKeyDown, true);
    document.addEventListener('visibilitychange', state.onVisibilityChange, false);
    window.addEventListener('resize', state.onResize, false);

    try{
      if(window.BD_Bgm && typeof window.BD_Bgm.play === 'function') window.BD_Bgm.play('title');
    }catch(e){}

    requestAnimationFrame(function(){
      if(active !== state) return;
      state.root.classList.add('bd-cr-visible');
      if(state.reduced){
        state.progressBar.style.transform = 'scaleX(1)';
        var primary = state.root.querySelector('[data-action="map"],[data-action="title"]');
        if(primary) primary.focus();
        return;
      }
      measure(false);
      state.startedAt = performance.now();
      state.raf = requestAnimationFrame(tick);
      try{ state.pauseButton.focus(); }catch(e){}
    });
  }

  window.BD_showCredits = startCredits;
  window.BD_closeCredits = closeActive;
})();
