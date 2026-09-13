/* (v399e) 엔딩 가드 — 완주 런 v399h 에서 확인된 두 가지
 *  ① 최종 보스를 정화한 직후 체력이 절반 아래면 0132 회복 안내(«체력이 절반 아래로 떨어졌어요! … F로 잠깐 쉬면»)가
 *     엔딩 대사 사이에 끼어들어 화살표가 문화의집을 가리켰다. 마지막 장면의 톤을 깨고, 플레이어를 시설 창으로 끌어들인다.
 *     → 보스 정화 뒤(= 엔딩 연출 구간)와 클리어 후에는 회복 안내를 만들지 않는다 (BD_nearestRest 가 null).
 *  ② 그 결과 시설 선택 창(봉담와우도서관·봉담청소년문화의집)이 열린 채로 엔딩 모달이 떠서 «엔딩 크레딧 보기» 가 가려졌다.
 *     → 엔딩 모달이 show 되는 순간 열려 있는 시설·버스·상점·가방·임무·지도·스킬 창을 모두 닫는다.
 *  기존 함수 재정의 없음(래퍼·옵저버만). */
(function(){
  'use strict';
  function finaleBusy(){
    try{
      if (window.BD && BD.gameCleared) return true;
      if (window.BD && BD.purified && BD.purified['final_boss_1']) return true;
      var m = document.getElementById('bd-ending-modal');
      if (m && m.classList.contains('show')) return true;
    }catch(e){}
    return false;
  }
  /* ① 회복 안내 억제 */
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    try{
      var o = window.BD_nearestRest;
      if (typeof o !== 'function'){ if (tries > 300) clearInterval(iv); return; }
      if (o.__v399guard) { clearInterval(iv); return; }
      var wrapped = function(){ if (finaleBusy()) return null; return o.apply(this, arguments); };
      wrapped.__v399guard = true;
      window.BD_nearestRest = wrapped;
      clearInterval(iv);
    }catch(e){}
  }, 250);
  /* ② 엔딩 모달 위의 다른 창 정리 */
  function closePanels(){
    try{
      var on = function(e){ if (!e) return false; var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; var r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      ['bd-district-facility-modal', 'bd-bus-modal', 'shop-overlay', 'inv-overlay', 'quest-overlay', 'bd-map-v342', 'hsr-skill-menu', 'bd-place-card'].forEach(function(id){
        var el = document.getElementById(id); if (!on(el)) return;
        var btn = null;
        try{ btn = [].slice.call(el.querySelectorAll('button')).filter(function(b){ return /닫기|✕|✖/.test(b.textContent || ''); })[0]; }catch(e0){}
        if (btn){ btn.click(); }
        else { el.classList.remove('open', 'show'); el.style.display = 'none'; }
      });
      try{ if (window.BD_closeSafetyMap) BD_closeSafetyMap(); }catch(e1){}
      try{ if (window.BD_closeSkillMenu) BD_closeSkillMenu(); }catch(e2){}
      try{ if (window.__bdNavOverride && window.__bdNavOverride.__rest) window.__bdNavOverride = null; }catch(e3){}
    }catch(e){}
  }
  var lastShown = false;
  setInterval(function(){
    try{
      var m = document.getElementById('bd-ending-modal');
      var shown = !!(m && m.classList.contains('show'));
      if (shown && !lastShown){ closePanels(); setTimeout(closePanels, 400); }
      lastShown = shown;
    }catch(e){}
  }, 300);
})();
