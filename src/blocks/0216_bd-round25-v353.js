
/* (v353) UI 배율 + 실전 상점 지점화 — 상세는 패치 주석 */
(function(){
  'use strict';

  /* ── ① UI 배율 ── */
  var KEY = 'bd_ui_scale_v353';
  function autoPct(){
    var hgt = window.innerHeight || 800;
    if (hgt < 480) return 65;   /* (v391) 스마트폰 가로(높이 360~430) 전용 티어 — 태블릿 75%로는 시야가 부족 */
    if (hgt < 620) return 75;
    if (hgt < 730) return 85;
    if (hgt < 860) return 95;
    if (hgt > 1250) return 115;
    return 100;
  }
  function cur(){ try{ return localStorage.getItem(KEY) || 'auto'; }catch(e){ return 'auto'; } }
  /* (v376) CSS zoom 미지원(파이어폭스 126 미만) 감지 — 미지원이면 배율을 100% 로 고정한다.
     좌표 보정 코드는 computed zoom 을 ||1 로 읽으므로 z=1 경로로 안전하게 동작한다. */
  var ZOOM_OK = (function(){ try{ var el = document.createElement('div'); el.style.zoom = '0.5'; return el.style.zoom !== ''; }catch(e){ return false; } })();
  window.__bdZoomOK = ZOOM_OK;
  function apply(){
    if (!ZOOM_OK) return 100;
    var v = cur();
    var pct = (v === 'auto') ? autoPct() : (parseInt(v, 10) || 100);
    try{ document.body.style.zoom = (pct === 100) ? '' : String(pct / 100); }catch(e){}
    return pct;
  }
  window.BD_setUiScale = function(v){
    try{ localStorage.setItem(KEY, String(v)); }catch(e){}
    var pct = apply();
    try{ bdToast('🖥 UI 크기: ' + (v === 'auto' ? ('자동(' + pct + '%)') : v + '%')); }catch(e){}
    highlight();
  };
  function highlight(){
    try{
      var row = document.querySelector('#bd-settings-modal .bd-uiscale-row');
      if (!row) return;
      var v = cur();
      row.querySelectorAll('button').forEach(function(b){
        b.classList.toggle('on', b.getAttribute('data-uis') === v);
      });
    }catch(e){}
  }
  window.addEventListener('resize', function(){ if (cur() === 'auto') apply(); });
  var boot = setInterval(function(){
    if (!document.body) return;
    clearInterval(boot); apply();
  }, 300);
  /* 설정 모달에 행 주입 */
  var wireSet = setInterval(function(){
    if (typeof window.BD_openTitleOptions !== 'function' || window.BD_openTitleOptions.__v353) return;
    clearInterval(wireSet);
    var o = window.BD_openTitleOptions;
    window.BD_openTitleOptions = function(){
      var r = o.apply(this, arguments);
      try{
        var m = document.getElementById('bd-settings-modal');
        if (m && !m.querySelector('.bd-uiscale-row')){
          var close = m.querySelector('.bd-modal-close');
          var html = '<div class="bd-set-row bd-uiscale-row"><span>🖥 UI 크기</span>'
            + ['auto','80','90','100','115','130'].map(function(v){
                return '<button data-uis="' + v + '" onclick="BD_setUiScale(\'' + v + '\')">' + (v === 'auto' ? '자동' : v + '%') + '</button>';
              }).join('')
            + '</div>';
          if (close) close.insertAdjacentHTML('beforebegin', html);
          else m.firstElementChild && m.firstElementChild.insertAdjacentHTML('beforeend', html);
        }
      }catch(e){}
      highlight();
      return r;
    };
    window.BD_openTitleOptions.__v353 = true;
  }, 400);

  /* ── ② 실전 상점 지점화 ── */
  function hashStr(s){ var x = 0; for (var i = 0; i < s.length; i++){ x = ((x << 5) - x + s.charCodeAt(i)) | 0; } return Math.abs(x); }
  function decorate(){
    try{
      var m = document.getElementById('bd-shop-modal');
      if (!m || !m.classList.contains('show')) return;
      var store = window.__bdShopStore || '';
      /* 제목에 지점명 */
      if (store){
        var head = [...m.querySelectorAll('div,h2,h3,strong,span')].find(function(x){
          return /상점\s*·/.test(x.textContent || '') && x.children.length === 0;
        });
        if (head && head.textContent.indexOf(store) < 0){
          head.textContent = head.textContent.replace(/상점/, store);
        }
      }
      /* 지점별 품절 편차 (첫 품목 보존) */
      var btns = [...m.querySelectorAll('button.bd-equip-up')];
      if (btns.length >= 2 && store){
        var hs = hashStr(store);
        btns.forEach(function(b, i){
          if (i === 0) return;
          var row = b.parentElement;
          if (!row || row.__bd353) return;
          if (((hs + i * 7) % 10) < 3){
            row.__bd353 = true;
            row.style.opacity = '0.45';
            row.style.filter = 'grayscale(0.8)';
            b.disabled = true;
            b.textContent = '오늘은 품절';
          }
        });
      }
    }catch(e){}
  }
  var wireShop = setInterval(function(){
    if (typeof window.BD_openShop !== 'function' || window.BD_openShop.__v353) return;
    clearInterval(wireShop);
    var o2 = window.BD_openShop;
    window.BD_openShop = function(){
      try{
        var nf = (typeof window.BD_v24NearestFacility === 'function') ? BD_v24NearestFacility() : null;
        if (nf && nf.label) window.__bdShopStore = nf.label;
      }catch(e){}
      var r = o2.apply(this, arguments);
      setTimeout(decorate, 60);
      return r;
    };
    window.BD_openShop.__v353 = true;
  }, 400);
  setInterval(decorate, 900);
})();
