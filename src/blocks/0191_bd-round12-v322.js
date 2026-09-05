
/* (v322) QA 라운드 12
   · Shift+Z+X+C 동시 누름 → 에디터(개발) 모드로 리로드 (dev 중이면 해제 리로드)
   · 시설 선택 카드 키보드 조작(위/아래·Enter/Space 확정·숫자키)
   · 담이 동일 대사 8초 내 중복 억제(«인벤 확인 3번» 류) */
(function(){
  'use strict';

  /* ── 에디터 핫키 ── */
  var down = {};
  document.addEventListener('keydown', function(e){
    try{
      down[(e.key||'').toLowerCase()] = true;
      if (e.shiftKey && down['z'] && down['x'] && down['c']){
        down = {};
        var isDev = /[?&]dev=1/.test(location.search);
        var base = location.href.replace(/[?&]dev=1/, '').replace(/\?$/, '');
        if (isDev){ location.href = base; }
        else { location.href = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'dev=1'; }
      }
    }catch(err){}
  }, true);
  document.addEventListener('keyup', function(e){ try{ delete down[(e.key||'').toLowerCase()]; }catch(err){} }, true);
  window.addEventListener('blur', function(){ down = {}; });

  /* ── 시설 카드 키보드 조작 ── */
  var mIdx = 0, mOpenAt = 0;
  function modalBtns(){
    var m = document.getElementById('bd-district-facility-modal');
    if (!m || !m.classList.contains('open')) return null;
    var bs = [].slice.call(m.querySelectorAll('button')).filter(function(b){ return b.offsetHeight > 0; });
    return bs.length ? bs : null;
  }
  function paintFocus(bs){
    bs.forEach(function(b, i){
      b.style.outline = (i === mIdx) ? '3px solid #ffd86b' : '';
      b.style.outlineOffset = (i === mIdx) ? '2px' : '';
    });
  }
  setInterval(function(){
    var bs = modalBtns();
    if (!bs){ mIdx = 0; mOpenAt = 0; return; }
    if (!mOpenAt){ mOpenAt = Date.now(); mIdx = 0; }
    paintFocus(bs);
  }, 250);
  document.addEventListener('keydown', function(e){
    try{
      var bs = modalBtns(); if (!bs) return;
      var k = (e.key||'').toLowerCase();
      if (k === 'arrowdown' || k === 's'){ mIdx = (mIdx + 1) % bs.length; paintFocus(bs); }
      else if (k === 'arrowup' || k === 'w'){ mIdx = (mIdx - 1 + bs.length) % bs.length; paintFocus(bs); }
      else if (k === 'enter' || k === ' ' || k === 'f'){
        if (Date.now() - mOpenAt < 350) { e.preventDefault(); e.stopImmediatePropagation(); return; }   /* 잔상 확정 방지 */
        e.preventDefault(); e.stopImmediatePropagation(); bs[mIdx].click(); return;
      }
      else if (/^[1-9]$/.test(k)){ var n = Number(k) - 1; if (bs[n]){ e.preventDefault(); e.stopImmediatePropagation(); bs[n].click(); return; } }
      else return;
      e.preventDefault(); e.stopImmediatePropagation();
    }catch(err){}
  }, true);

  /* ── 담이 중복 대사 억제 ── */
  function wrapDami(){
    try{
      /* (v326) 함수 마커 → 전역 플래그: 다른 래퍼가 위에 덮여도 재설치하지 않는다.
         재진입 가드: 만약 이미 2겹으로 설치된 상태라도 안쪽 사본은 dedupe를 건너뛰어
         «자기 자신이 방금 기록한 lastText에 막히는» 전면 침묵을 원천 차단. */
      if (!window.BD_DAMI || !BD_DAMI.show || window.__bdDamiDedupeOn) return;
      window.__bdDamiDedupeOn = true;
      var orig = BD_DAMI.show;
      BD_DAMI.show = function(text, opts){
        try{
          if (!window.__bdDamiDedupeBusy){
            var t = String(text||'');
            if (t && window.__bdDamiLastText === t && Date.now() - (window.__bdDamiLastAt||0) < 8000) return false;
            window.__bdDamiLastText = t; window.__bdDamiLastAt = Date.now();
          }
        }catch(e2){}
        window.__bdDamiDedupeBusy = true;
        try { return orig.apply(this, arguments); } finally { window.__bdDamiDedupeBusy = false; }
      };
    }catch(e){}
  }
  setInterval(wrapDami, 800);
})();
