/* (v390) 모바일 메뉴줄 단일 관리자
   같은 #bd-menu-btns 를 0078(☰ 접기)·0219(zoom 배율)·0245(safe-area)가 나눠 만지던 것을
   여기 한 곳으로 통합한다. 0078 은 «화면 탭=대화 진행»만, 0219 는 퀘스트 HUD·트랙 칩·담이만 남고,
   safe-area 여백은 기기 공통 관심사라 0245 에 그대로 둔다. 데스크톱은 이 블록이 아무것도 하지 않는다. */
(function(){
  'use strict';
  var IS_TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if (!IS_TOUCH) return;

  function el(id){ return document.getElementById(id); }

  /* ── ① ☰ 접기 (구 0078 ①②) ── */
  var open = false;
  function ensureToggle(){
    var t = el('bd-mb-toggle');
    if (t) return t;
    var bar = el('bd-menu-btns');
    if (!bar) return null;
    t = document.createElement('button');
    t.id = 'bd-mb-toggle';
    t.type = 'button';
    t.textContent = '☰';
    t.style.cssText = 'background:rgba(16,24,44,.94);border:1px solid rgba(180,200,255,.55);'
      + 'color:#dbe7ff;border-radius:12px;width:44px;height:44px;font-size:20px;font-weight:700;'
      + 'cursor:pointer;-webkit-tap-highlight-color:transparent;';
    t.addEventListener('touchstart', function(e){ e.preventDefault(); toggle(); }, { passive:false });
    t.addEventListener('click', function(e){ e.preventDefault(); });
    bar.appendChild(t);
    return t;
  }
  function apply(){
    var bar = el('bd-menu-btns');
    if (!bar) return;
    Array.prototype.forEach.call(bar.children, function(c){
      if (c.id === 'bd-mb-toggle' || c.id === 'bd-bag-top') return;  /* 가방(0253)은 자체 표시 규칙 */
      if (c.getAttribute('data-bdmb') === 'dev'){ c.style.display = 'none'; return; }  /* 개발용은 모바일 상시 숨김 */
      c.style.display = open ? '' : 'none';
    });
    bar.style.flexWrap = 'wrap';
    bar.style.justifyContent = 'flex-end';
    bar.style.maxWidth = '76vw';
  }
  function toggle(){ open = !open; apply(); }

  /* ── ② 메뉴줄 zoom 배율 (구 0219 의 bd-menu-btns 항목) ── */
  function zoomFactor(){
    try{
      if (!document.documentElement.classList.contains('bd-touch-mode')) return 1;
      if ((localStorage.getItem('bd_ui_scale_v353') || 'auto') !== 'auto') return 1;  /* 수동 배율 선택 시 개입 안 함 */
    }catch(e){ return 1; }
    var w = window.innerWidth || 1280;
    if (w <= 420) return 1.45;
    if (w <= 600) return 1.35;
    if (w <= 900) return 1.2;
    return 1;
  }
  function applyZoom(){
    var bar = el('bd-menu-btns');
    if (!bar) return;
    var f = zoomFactor();
    var z = (f === 1) ? '' : String(f);
    if (bar.style.zoom !== z) bar.style.zoom = z;
  }

  /* ── ③ 에디터 토글은 모바일 숨김 (구 0078 hideDevUI) ── */
  function hideDevUI(){
    ['bge-toggle', 'bge-panel'].forEach(function(id){
      var d = el(id);
      if (d) d.style.display = 'none';
    });
  }

  function tick(){
    try{
      if (ensureToggle()) apply();
      applyZoom();
      hideDevUI();
    }catch(e){}
  }
  window.addEventListener('resize', function(){ try{ applyZoom(); }catch(e){} });
  if (window.BD_addTick) BD_addTick(tick, 700); else setInterval(tick, 700);
})();
