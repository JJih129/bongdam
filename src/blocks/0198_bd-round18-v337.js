
(function(){
  'use strict';

  /* ── ⑥ 선택창 마우스 오클릭 — 어떤 확정 핸들러보다 먼저(pointerdown) 클릭한 행으로 인덱스 고정 ── */
  function pinIdx(e){
    try{
      var S = window.__bdChoiceState;
      if (!S || !S.open) return;
      var row = e.target && e.target.closest && e.target.closest('.bd-choice-row');
      if (!row || row.dataset.i === undefined) return;
      S.idx = +row.dataset.i;
      window.__bdPinIdx = { i: +row.dataset.i, t: Date.now() };   /* 확정 원천(P6)이 최종 반영 */
      if (typeof window.BD_choiceRender === 'function') BD_choiceRender();
    }catch(err){}
  }
  document.addEventListener('pointerdown', pinIdx, true);
  document.addEventListener('mousedown', pinIdx, true);
  document.addEventListener('touchstart', pinIdx, true);

  /* ── ① 전투 튜토 완전 1회 — 전투가 끝나면 러너를 정리해 전투 밖 재생·다음 전투 재개를 막는다 ── */
  var wasBattle = false;
  setInterval(function(){
    try{
      var inb = !!(window.HSR && HSR.active);
      if (wasBattle && !inb){
        try{ localStorage.setItem('bd_battle_tutorial_done', '1'); }catch(e1){}
        setTimeout(function(){
          try{
            /* (v374) 전투 튜토(태그 없음/dami_main)만 정리 — 전투 직후 시작한 가게 튜토(shop_tuto)는 건드리지 않는다 */
            var __tg = null; try{ __tg = BD_TUTOR.runningTag && BD_TUTOR.runningTag(); }catch(eTg){}
            if (!(window.HSR && HSR.active) && window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning() && __tg !== 'shop_tuto'){
              try{ window.__bdSilentSkip = true; (BD_TUTOR.__skipReal || BD_TUTOR.skip).call(BD_TUTOR); }catch(eS1){}finally{ window.__bdSilentSkip = false; }
              /* skip이 없거나 안 먹는 빌드 대비 — 공식 종료 API 순차 시도 */
              try{ if (BD_TUTOR.isRunning() && BD_TUTOR.stop) BD_TUTOR.stop(); }catch(eS2){}
              try{ if (BD_TUTOR.isRunning() && BD_TUTOR.end) BD_TUTOR.end(); }catch(eS3){}
              try{ if (BD_TUTOR.isRunning() && BD_TUTOR.reset) BD_TUTOR.reset(); }catch(eS4){}
              try{ console.info('[v337] 전투 종료 — 잔여 튜토 스텝 정리(1회 재생 원칙)'); }catch(e2){}
            }
          }catch(e3){}
        }, 1200);
      }
      wasBattle = inb;
    }catch(e){}
  }, 400);

  /* ── ② 전투 플레이어 0.8 — CSS가 다른 규칙에 밀리는 환경 대비, 인라인로도 보강 ── */
  setInterval(function(){
    try{
      var host = document.getElementById('hsr-hero-sprite');
      if (!host) return;
      [].forEach.call(host.children, function(c){
        if (c.__bdScaled) return;
        c.__bdScaled = true;
        c.style.setProperty('transform', 'scale(0.8)', 'important');
        c.style.setProperty('transform-origin', 'bottom center', 'important');
      });
    }catch(e){}
  }, 600);

  /* ── ③ 원거리 구버전 상점 차단 — 상점류 시설이 화면 260px 안에 있을 때만 허용 ── */
  var wireShop = setInterval(function(){
    if (typeof window.BD_useFacility !== 'function' || window.BD_useFacility.__v337) return;
    clearInterval(wireShop);
    var o = window.BD_useFacility;
    window.BD_useFacility = function(type){
      try{
        if (type === 'shop'){
          var near = false;
          try{
            var hr = BD_screenRectOfWorld(heroX - 0.005, heroY - 0.005, 0.01, 0.01);
            var hx = hr ? hr.left + hr.width / 2 : null, hy = hr ? hr.top + hr.height / 2 : null;
            if (hx != null){
              var st = STAGES[Number(currentStage)];
              ((st && st.objects) || []).some(function(ob){
                if (!ob || ob.hidden) return false;
                var shopish = ob.facilityType === 'shop' || /약국|마트|편의점|문구|상점/.test(String(ob.label || ''));
                if (!shopish) return false;
                var r = BD_screenRectOfWorld(ob.rx, ob.ry, Math.max(ob.rw || 0, 0.02), Math.max(ob.rh || 0, 0.02));
                if (!r) return false;
                var dx = (r.left + r.width / 2) - hx, dy = (r.top + r.height / 2) - hy;
                if (Math.hypot(dx, dy) <= 260 + Math.max(r.width, r.height) / 2){ near = true; return true; }
                return false;
              });
            }
          }catch(eN){ near = true; /* 판정 실패 시 기존 동작 유지 */ }
          if (!near){
            try{ (window.BD_toast || window.bdToast)('🏪 상점은 가게 앞에서 이용할 수 있어요', 2200); }catch(eT){}
            return;
          }
        }
      }catch(e){}
      return o.apply(this, arguments);
    };
    window.BD_useFacility.__v337 = true;
  }, 300);

  /* ── ④ 수첩·장비·장소수첩·상점 자동 다크 톤앤매너 — 밝은(아이보리) 배경을 다크 패널로 변환 ── */
  function darken(root){
    try{
      if (!root) return;
      var all = [root].concat([].slice.call(root.querySelectorAll('*')));
      all.forEach(function(el){
        if (el.tagName === 'IMG' || el.tagName === 'CANVAS') return;
        var cs = getComputedStyle(el);
        var m = String(cs.backgroundColor).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/);
        if (m && (m[4] === undefined || parseFloat(m[4]) > 0.4)){
          var lum = (+m[1] + +m[2] + +m[3]) / 3;
          if (lum > 200){ el.style.setProperty('background-color', '#0e1526', 'important'); el.style.setProperty('border-color', 'rgba(122,150,210,.32)', 'important'); }
          else if (lum > 150){ el.style.setProperty('background-color', '#121a2e', 'important'); el.style.setProperty('border-color', 'rgba(122,150,210,.25)', 'important'); }
        }
        var mc = String(cs.color).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (mc){
          var lum2 = (+mc[1] + +mc[2] + +mc[3]) / 3;
          if (lum2 < 95) el.style.setProperty('color', '#e6ebf7', 'important');
        }
      });
    }catch(e){}
  }
  window.__bdDarken = darken;
  function wrapOpen(fnName, rootId){
    var iv = setInterval(function(){
      if (typeof window[fnName] !== 'function' || window[fnName].__v337) return;
      clearInterval(iv);
      var o = window[fnName];
      window[fnName] = function(){
        var r = o.apply(this, arguments);
        setTimeout(function(){ darken(document.getElementById(rootId)); }, 60);
        setTimeout(function(){ darken(document.getElementById(rootId)); }, 400);
        return r;
      };
      window[fnName].__v337 = true;
    }, 400);
  }
  wrapOpen('BD_codexOpen', 'bd-codex-ov');
  wrapOpen('BD_openEquipModal', 'bd-equip-modal');
  wrapOpen('BD_openCardCollection', 'bd-card-modal');
  wrapOpen('BD_openShop', 'shop-overlay');
  /* 상점은 탭 전환마다 재렌더 — 열려 있는 동안 주기 보정 */
  setInterval(function(){
    try{
      var s = document.getElementById('shop-overlay');
      if (s && getComputedStyle(s).display !== 'none') darken(document.getElementById('shop-panel'));
      var cx = document.getElementById('bd-codex-ov');
      if (cx && cx.classList.contains('show')) darken(cx);
    }catch(e){}
  }, 800);
})();
