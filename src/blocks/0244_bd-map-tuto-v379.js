
/* (v379) §7 안전지도 튜토리얼 — 문화의집에서 나온 직후 1회.
   흐름: M키로 지도 열기(실습) → 내 위치·위험요소·시설 설명 → 미방문 흑백 설명 → 문화의집 클릭(실습, 길찾기 추적 시작)
        → 화살표 안내 확인 → 종료. 이후 기존 담이 메인 튜토리얼로 이어진다.
   완료 키 bd_map_tuto_done — 재방문 시 재생 안 함. */
(function(){
  'use strict';
  var KEY = 'bd_map_tuto_done';
  function done(){ try{ return localStorage.getItem(KEY) === '1'; }catch(e){ return false; } }
  function mapOpen(){ try{ var m = document.getElementById('bd-map-v342'); return !!(m && m.classList.contains('show')); }catch(e){ return false; } }
  function cultureRect(){
    try{
      var b = document.getElementById('bd-map-v342-board'); if (!b) return null;
      var el = [...b.querySelectorAll('.m42-dimp,.m42-vok')].find(function(x){ return /문화의집|도서관/.test(x.title || ''); });
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return (r.width > 2) ? r : null;
    }catch(e){ return null; }
  }
  function run(after){
    try{ localStorage.setItem(KEY, '1'); }catch(e){}
    /* (v386) 지도 모달이 평상시 담이 말풍선을 숨기더라도, 지도 튜토리얼 대사는
       반드시 지도보다 위에서 보이도록 전용 상태 클래스를 유지한다. */
    try{ document.body.classList.add('bd-map-tuto-speaking'); }catch(e){}
    var fin = function(){
      try{ document.body.classList.remove('bd-map-tuto-speaking'); }catch(e){}
      /* (v388) 지도 실습이 끝나면 이야기를 이어 붙인 뒤 메인 튜토리얼로 넘긴다.
         예전엔 여기서 곧장 메인 튜토리얼로 갔고, 밀려 있던 오프닝 지도 설명이
         뒤늦게 재생되며 «지도 얘기를 두 번» 듣게 됐다. */
      var next = function(){ try{ if (after) after(); }catch(e){} };
      try{
        if (typeof window.BD_damiOpeningOutro === 'function'){ window.BD_damiOpeningOutro(next); return; }
      }catch(e){}
      next();
    };
    if (!window.BD_TUTOR || typeof BD_TUTOR.run !== 'function'){ fin(); return; }
    window.BD_TUTOR.run([
      /* (v388) 「제 안에 지도가 있어요」는 오프닝에서 걷어내고 유도 대사가 직접 꺼낸다 —
         지도를 여는 이 순간에 소개해야 설명이 한 번만 나가고 흐름도 끊기지 않는다. */
      { id: 'map_open', face: 'proud', block: false,
        target: '#bd-dami-hud',
        text: '제 안에는 봉담 지도가 있어요! M 키(또는 왼쪽 아래 저를 클릭)를 눌러 「봉담 안전지도」를 열어봐요',
        skipIf: mapOpen,
        waitFor: { predicate: mapOpen, delay: 45000 } },
      { id: 'map_info', face: 'base', block: false,
        text: '여기서 내 위치(파란 점 「나」), 위험요소(⚠), 주요 시설을 한눈에 볼 수 있어요',
        waitFor: { delay: 5200 } },
      { id: 'map_gray', face: 'base', block: false,
        text: '아직 가 보지 않은 시설은 흑백으로 보여요. 직접 방문하면 색이 켜지고 ✓ 가 붙어요!',
        waitFor: { delay: 5200 } },
      { id: 'map_click', face: 'surprise', block: false,
        target: cultureRect,
        text: '가고 싶은 시설을 누르면 길을 안내해 줘요. 지금 「문화의집」을 눌러 봐요!',
        skipIf: function(){ return !mapOpen() && !!window.__bdTrack; },
        waitFor: { predicate: function(){ return !!window.__bdTrack; }, delay: 45000 } },
      { id: 'map_done', face: 'proud', block: false,
        text: '좋아요! 이제 발밑 화살표가 고른 곳까지 안내해요. 지도는 언제든 M 키!',
        waitFor: { delay: 4500 } },
    ], null, 'map_tuto');
    var iv = setInterval(function(){
      try{ if (!BD_TUTOR.isRunning()){ clearInterval(iv); setTimeout(fin, 400); } }catch(e){ clearInterval(iv); }
    }, 500);
  }
  window.BD_runMapTutorial = run;
  /* 메인 담이 튜토리얼 앞에 삽입 — 문화의집을 나서면 0059 가 BD_startDamiTutorial 을 부른다 */
  var wire = setInterval(function(){
    try{
      var o = window.BD_startDamiTutorial;
      if (typeof o !== 'function' || o.__v379map) return;
      clearInterval(wire);
      window.BD_startDamiTutorial = function(){
        var args = arguments, self = this;
        if (!done() && Number(currentStage) === 212 && !(window.BD_TUTOR && BD_TUTOR.isRunning())){
          run(function(){ try{ o.apply(self, args); }catch(e){} });
          return;
        }
        return o.apply(self, args);
      };
      window.BD_startDamiTutorial.__v379map = true;
    }catch(e){}
  }, 400);
})();
