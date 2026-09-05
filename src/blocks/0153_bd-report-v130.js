
/* (v130) 플레이 결과 리포트 (통계 통합)
   · 엔딩이 끝난 «뒤에» 뜬다 — 이벤트 조정자로 겹침 방지
   · 아무 때나 볼 수 있게 안전수첩 옆 버튼도 제공
   · 교육 현장에서 학습 결과물로 쓰이도록 «무엇을 배웠는지»를 함께 보여 준다 */
(function(){
  'use strict';

  function stats(){
    var s = { purified:0, hazardTotal:0, codex:0, codexTotal:12,
              cards:0, cardTotal:9, residents:0, gold:0, level:1, augments:0, playMin:0 };
    try{
      var pur = (window.BD && BD.purified) || {};
      s.purified = Object.keys(pur).filter(function(k){ return k.indexOf('final_boss')<0; }).length;
      var seen = {};
      [212,213,211,210].forEach(function(sid){
        var st = STAGES[sid]; if (!st) return;
        (st.objects||[]).forEach(function(o){
          if (o && o.interactable==='hazard' && o.hazardId && !o.isBoss) seen[o.hazardId]=1; });
      });
      s.hazardTotal = Object.keys(seen).length;
    }catch(e){}
    try{ s.codex = Object.keys((BD.codex)||{}).length; }catch(e){}
    try{ s.cards = (BD_PROGRESS.facility.facilityStampIds||[]).length; }catch(e){}
    try{
      var r = {};
      [212,213,211,210].forEach(function(sid){
        var st = STAGES[sid]; if (!st) return;
        (st.objects||[]).forEach(function(o){ if (o && o.resident) r[o.npcName]=1; });
      });
      s.residents = Object.keys(r).length;
    }catch(e){}
    try{ s.gold = playerGold; }catch(e){}
    try{ s.level = safetyLevel; }catch(e){}
    try{ s.augments = (BD._augments||[]).length; }catch(e){}
    try{
      var t0 = Number(localStorage.getItem('bd_play_started') || 0);
      if (!t0){ t0 = Date.now(); localStorage.setItem('bd_play_started', String(t0)); }
      s.playMin = Math.max(1, Math.round((Date.now() - t0) / 60000));
    }catch(e){}
    return s;
  }

  /** 수첩에 기록된 안전 지식 목록 — 학습 결과물 */
  function lessons(){
    var out = [];
    try{
      var V = window.HAZARD_VARIANTS || {};
      var got = (window.BD && BD.codex) || {};
      Object.keys(got).forEach(function(k){
        var v = V[k]; if (!v) return;
        out.push({ name: v.name || k, edu: (v.edu || '').slice(0, 60) });
      });
    }catch(e){}
    return out;
  }

  function css(){
    if (document.getElementById('bd-report-css')) return;
    var st = document.createElement('style'); st.id = 'bd-report-css';
    st.textContent =
      '#bd-report{position:fixed;inset:0;z-index:6200;display:none;align-items:center;justify-content:center;'
      + 'background:radial-gradient(ellipse at 50% 30%, rgba(28,38,72,.95), rgba(6,8,18,.97));'
      + '-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)animation:bdRepIn .35s ease;}'
      + '#bd-report.on{display:flex;}'
      + '@keyframes bdRepIn{from{opacity:0}to{opacity:1}}'
      + '#bd-report .rp{width:min(720px,92vw);max-height:88vh;overflow:auto;border-radius:22px;'
      + 'padding:28px 30px 22px;background:linear-gradient(165deg,#1b2440,#111629);'
      + 'border:2px solid rgba(255,216,107,.45);box-shadow:0 24px 60px rgba(0,0,0,.6);color:#e8f0ff;}'
      + '#bd-report h2{margin:0 0 4px;font-size:26px;color:#ffd86b;text-align:center;letter-spacing:1px;}'
      + '#bd-report .sub{text-align:center;color:#a9b8d8;font-size:13px;margin-bottom:22px;}'
      + '#bd-report .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:22px;}'
      + '#bd-report .cell{background:rgba(255,255,255,.05);border:1px solid rgba(150,180,255,.20);'
      + 'border-radius:14px;padding:14px 12px;text-align:center;}'
      + '#bd-report .cell .k{font-size:12px;color:#9fb2d8;margin-bottom:6px;}'
      + '#bd-report .cell .v{font-size:24px;font-weight:900;color:#ffe9a8;}'
      + '#bd-report .cell .v small{font-size:13px;color:#8fa4c8;font-weight:700;}'
      + '#bd-report h3{margin:18px 0 10px;font-size:15px;color:#ffd86b;}'
      + '#bd-report .les{background:rgba(255,255,255,.04);border-radius:12px;padding:12px 14px;'
      + 'margin-bottom:8px;border-left:3px solid #ffd86b;}'
      + '#bd-report .les b{color:#ffe9a8;font-size:13.5px;}'
      + '#bd-report .les p{margin:5px 0 0;font-size:12.5px;color:#c2d0ec;line-height:1.6;}'
      + '#bd-report .empty{color:#8fa4c8;font-size:13px;padding:10px 0;}'
      + '#bd-report .btns{display:flex;gap:10px;justify-content:center;margin-top:20px;}'
      + '#bd-report button{padding:11px 26px;border-radius:12px;border:1px solid rgba(255,216,107,.5);'
      + 'background:linear-gradient(180deg,#ffe9a8,#f0b93c);color:#1a1206;font-weight:900;font-size:14px;cursor:pointer;}'
      + '#bd-report button.ghost{background:transparent;color:#c8d6f0;border-color:rgba(200,214,240,.3);}';
    document.head.appendChild(st);
  }

  function build(){
    css();
    var el = document.getElementById('bd-report');
    if (!el){ el = document.createElement('div'); el.id = 'bd-report'; document.body.appendChild(el); }
    var s = stats(), L = lessons();
    var cells = [
      ['정화한 위험요소', s.purified + '<small> / ' + (s.hazardTotal||12) + '</small>'],
      ['배운 안전 지식',  s.codex    + '<small> / ' + s.codexTotal + '</small>'],
      ['방문한 시설',    s.cards    + '<small> / ' + s.cardTotal + '</small>'],
      ['만난 주민',      s.residents + '<small> 명</small>'],
      ['안전 등급',      'Lv.' + s.level],
      ['플레이 시간',    s.playMin + '<small> 분</small>']
    ].map(function(c){
      return '<div class="cell"><div class="k">'+c[0]+'</div><div class="v">'+c[1]+'</div></div>';
    }).join('');

    var lesHtml = L.length
      ? L.map(function(l){ return '<div class="les"><b>'+l.name+'</b><p>'+l.edu+'</p></div>'; }).join('')
      : '<div class="empty">아직 기록된 안전 지식이 없어요. 위험요소를 정화하면 수첩에 쌓입니다.</div>';

    el.innerHTML =
      '<div class="rp">'
      + '<h2>🛡️ 봉담 안전 지도 기록</h2>'
      + '<div class="sub">지금까지 걸어온 길을 정리했어요</div>'
      + '<div class="grid">' + cells + '</div>'
      + '<h3>📔 배운 안전 지식</h3>' + lesHtml
      + '<div class="btns">'
      +   '<button id="bd-rp-close">닫기</button>'
      + '</div></div>';
    el.querySelector('#bd-rp-close').onclick = function(){ hide(); };
    return el;
  }

  function show(){
    try{
      // 다른 연출이 진행 중이면 그것이 끝난 뒤에 뜨도록 양보한다
      if (window.BD_EVENTS && !BD_EVENTS.canRun('scene')){
        BD_EVENTS.claim('scene', { resume: show });
        return;
      }
      if (window.BD_EVENTS) BD_EVENTS.claim('scene', { resume: null });
      var el = build();
      el.classList.add('on');
      try{ if (window.BD_SFX && BD_SFX.levelup) BD_SFX.levelup(); }catch(e){}
    }catch(e){}
  }
  function hide(){
    try{
      var el = document.getElementById('bd-report');
      if (el) el.classList.remove('on');
      if (window.BD_EVENTS) BD_EVENTS.release('scene');
    }catch(e){}
  }
  window.BD_showReport = show;
  window.BD_hideReport = hide;
  window.BD_reportStats = stats;

  /* 엔딩이 «완전히 끝난 뒤»에 자동 표시 — 대사창이 닫히고 3초 조용할 때 */
  (function watchEnding(){
    var quietSince = 0, shown = false;
    setInterval(function(){
      try{
        if (shown) return;
        if (!(window.BD && BD.gameCleared)) return;
        /* (v375) 엔딩 연출(bd-ending-modal)이 먼저 — 엔딩을 보기 전엔 리포트를 띄우지 않는다 (리포트가 엔딩·마지막 대사를 가리던 문제) */
        if (!window.__bdEndingShown) return;
        try{ var em = document.getElementById('bd-ending-modal'); if (em && em.classList.contains('show')) { quietSince = 0; return; } }catch(eE){}
        var dlgUp = false;
        try{
          var b = document.getElementById('dialogue-box');
          dlgUp = !!(b && b.offsetHeight);
        }catch(e){}
        var sceneOn = false;
        try{ sceneOn = !!window.__bdSceneActive; }catch(e){}
        if (dlgUp || sceneOn){ quietSince = 0; return; }
        if (!quietSince){ quietSince = Date.now(); return; }
        if (Date.now() - quietSince > 3000){ shown = true; show(); }
      }catch(e){}
    }, 500);
  })();
})();
