
/* (v284) 컷신·담이 흐름 통합
   · 사장돼 있던 지역 도입 컷신(ch2~ch4_intro)·최종장 도입(final_intro)을 첫 진입 시 1회 재생
   · 담이 발화 큐 — 타이핑 중 새 발화가 앞 대사를 덮어쓰지 않게 순차 재생 (튜토리얼은 자체 페이싱 유지)
   · 챕터는 지났는데 스탬프가 없는 지역 → 지도 완성 리마인더 1회 */
(function(){
  'use strict';

  /* ── 담이 발화 큐 ── */
  var Q = [], lastAt = 0, lastMs = 0, flushing = false;
  function installQueue(){
    /* (v326) 함수 마커는 나중 래퍼가 덮으면 사라져 1100ms tick이 무한 재설치했다 — 전역 플래그로 1회 고정 */
    if (!window.BD_DAMI || !BD_DAMI.show || window.__bdDamiQOn) return;
    window.__bdDamiQOn = true;
    var orig = BD_DAMI.show.bind(BD_DAMI);
    function doShow(text, opts){
      var ok = orig(text, opts || {});
      if (ok){ lastAt = Date.now(); lastMs = Math.max(2600, String(text || '').length * 85) + 400; }
      return ok;
    }
    BD_DAMI.show = function(text, opts){
      opts = opts || {};
      try{
        if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()) return doShow(text, opts);
        if (opts.once && BD_DAMI.seen && BD_DAMI.seen(opts.once)) return false;
        if (Date.now() < lastAt + lastMs){
          if (Q.length < 3 && !Q.some(function(q){ return q.text === text; })) Q.push({ text: text, opts: opts });
          pump();
          return true;
        }
      }catch(e){}
      return doShow(text, opts);
    };
    BD_DAMI.show.__v284q = true;
    function pump(){
      if (flushing) return;
      flushing = true;
      (function loop(){
        var waitMs = (lastAt + lastMs) - Date.now();
        if (waitMs > 0) return setTimeout(loop, Math.min(waitMs + 80, 1200));
        var it = Q.shift();
        if (it){ try{ doShow(it.text, it.opts); }catch(e){} }
        if (Q.length) return setTimeout(loop, 250);
        flushing = false;
      })();
    }
  }

  /* ── 공통 busy 판정 ── */
  function busy(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.__bdSceneActive) return true;
      if (window.__bdDamiOpeningBusy || window.__bdDamiIntroBusy) return true;
      var vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) return true;
      var dlg = document.getElementById('bd-dialog');
      if (dlg && dlg.classList.contains('show')) return true;
      if (window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled) return true;
      if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()) return true;
      var gs = document.getElementById('game-screen');
      if (!gs || gs.style.display !== 'block') return true;
    }catch(e){}
    return false;
  }
  function seen(id){ try{ return !!(window.BD_DAMI && BD_DAMI.seen(id)); }catch(e){ return true; } }
  function mark(id){ try{ window.BD_DAMI && BD_DAMI.markSeen(id); }catch(e){} }

  /* ── 지역 도입 컷신 부활 — 첫 진입 1회 ── */
  var INTROS = [ { sid:213, key:'ch2_intro' }, { sid:211, key:'ch3_intro' }, { sid:210, key:'ch4_intro' } ];
  function introTick(){
    try{
      if (busy()) return;
      if (typeof currentStage === 'undefined') return;
      var tut2 = false;
      try{ tut2 = localStorage.getItem('bd_tut2_done') === '1'; }catch(eT){}
      if (!tut2) return;
      var sid = Number(currentStage);
      for (var i = 0; i < INTROS.length; i++){
        var it = INTROS[i];
        if (it.sid !== sid) continue;
        var k = 'cs_' + it.key;
        if (seen(k)) return;
        mark(k);
        setTimeout(function(key){ return function(){ try{ window.BD_playScene && BD_playScene(key); }catch(e){} }; }(it.key), 650);
        return;
      }
      /* 최종장 도입 — 최종장 개방 후 문화의집(101) 첫 방문 시 */
      if (sid === 101 && window.BD_finaleOpen && BD_finaleOpen() && !(window.BD && BD.gameCleared) && !seen('cs_final_intro')){
        mark('cs_final_intro');
        setTimeout(function(){ try{ window.BD_playScene && BD_playScene('final_intro'); }catch(e){} }, 650);
      }
    }catch(e){}
  }

  /* ── 스탬프 리마인더 — 챕터는 지났는데 지도(스탬프)가 비어 있는 지역 ── */
  var REGQ = [ { id:'wawoo', name:'와우리', qi:2 }, { id:'sang', name:'상리', qi:3 },
               { id:'donghwa', name:'동화리', qi:4 }, { id:'suyeong', name:'수영리', qi:5 } ];
  function stampTick(){
    try{
      if (busy()) return;
      if (!window.BD || !window.BD_MapProgress || !window.BD_REGISTRY_CHAPTERS) return;
      for (var i = 0; i < REGQ.length; i++){
        var r = REGQ[i];
        if ((BD.questIdx || 0) < r.qi) continue;
        var k = 'map_stamp_hint_' + r.id;
        if (seen(k)) continue;
        var data = BD_MapProgress.region(r.id);
        if (data.stamp) { mark(k); continue; }
        var CH = BD_REGISTRY_CHAPTERS[r.id];
        var names = [];
        try{
          names = (CH.stampAnyOf || []).map(function(fid){
            var f = BD_REGISTRY.FACILITY_DEFINITIONS[fid];
            return f ? f.displayName : null;
          }).filter(Boolean);
        }catch(eN){}
        mark(k);
        if (window.BD_DAMI) BD_DAMI.show(r.name + ' 지도를 완성하려면 시설 체험이 남았어요! ' +
          (names.length ? names.join('이나 ') + '에 들러 봐요.' : '핵심 시설에 들러 봐요.'), { face:'base' });
        return;
      }
    }catch(e){}
  }

  function tick(){ if (!window.__bdDamiArbiter) installQueue(); introTick(); }   /* (v374) 조정자(0239)가 있으면 구 큐 미설치 */   /* (v287) 스탬프 리마인더는 지도 100% 체계로 대체 */
  if (window.BD_addTick) BD_addTick(tick, 1100);
  else setInterval(tick, 1100);
})();
