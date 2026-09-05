
/* (v98) 플레이어 캐릭터 크기·비율을 에디터에서 직접 조절
   · 스테이지별로 따로 저장(문화의집처럼 배율이 다른 맵을 개별 조정)
   · 렌더 시 적용되는 HERO_BASE_W/H에 배율을 곱한다 */
(function(){
  'use strict';
  var KEY = 'bd_hero_scale_v98';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  function sid(){ try{ return String(Number(currentStage)); }catch(e){ return '0'; } }
  // (v101) 맵별 기본 배율 — 문화의집 실내는 50%, 바깥 지역은 175%
  var DEFAULTS = { '101': 50, '201': 50, '212': 75, '213': 75, '211': 75, '210': 75 };   /* (v339) 사용자 조정치(리별 ~75) 기본 반영 */
  function cur(){
    var s = load(); var v = s[sid()] || {};
    var def = (DEFAULTS[sid()] != null) ? DEFAULTS[sid()] : 100;
    return { scale: (v.scale != null ? v.scale : def), w: (v.w != null ? v.w : 100) };
  }
  window.BD_heroScale = function(){ return cur(); };

  /* 렌더 배율 적용 — 원본 상수를 보존하고 매 프레임 곱해 준다 */
  var BASE_W = null, BASE_H = null;
  setInterval(function(){
    try{
      if (typeof HERO_BASE_H === 'undefined') return;
      if (BASE_H == null){ BASE_H = HERO_BASE_H; BASE_W = HERO_BASE_W; }
      // (v98a) HERO_BASE_*는 const라 재할당 불가 — 렌더 시점에서 배율을 곱하는 방식으로 적용한다
    }catch(e){}
  }, 300);

  /* 에디터 패널 */
  var panel = null;
  function editorOn(){
    // (v106) 에디터 버튼은 항상 DOM에 있어 [id^="bge-"] 만으로는 늘 true가 된다 →
    //  타이틀·캐릭터 선택 화면에서도 패널이 뜨던 문제. 실제 에디터 창이 열렸을 때만 true.
    try{
      // (v106b) 에디터가 열리면 bge- 도구 버튼이 화면에 나타난다 — 이것만으로 판정한다.
      //  (game-screen 표시 여부는 검수·에디터 모드에서 다르게 잡혀 오판을 만들었다)
      var els = document.querySelectorAll('#bge-tool-select, #bge-zoom-in, #bge-tab-hierarchy, #bge-overview');
      for (var i = 0; i < els.length; i++){ if (els[i].offsetParent !== null) return true; }
      return false;
    }catch(e){ return false; }
  }
  function ensure(){
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'bd-hero-scale';
    panel.style.cssText = 'position:fixed;left:16px;bottom:320px;z-index:100000;display:none;'
      + 'width:250px;padding:12px 14px;border-radius:12px;background:rgba(18,22,34,.96);'
      + 'border:1px solid rgba(120,200,255,.5);color:#fff;font-size:12px;'
      + 'box-shadow:0 10px 26px rgba(0,0,0,.5);';
    panel.innerHTML =
      '<div style="font-weight:800;color:#8fd0ff;margin-bottom:8px;">🧍 플레이어 크기</div>'
      + '<div id="bd-hs-info" style="margin-bottom:8px;color:#c9d2e6;"></div>'
      + '<label style="display:block;margin:6px 0 2px;">전체 크기 <span id="bd-hs-sv">100%</span></label>'
      + '<input id="bd-hs-scale" type="range" min="40" max="300" value="100" style="width:100%">'
      + '<label style="display:block;margin:8px 0 2px;">가로 비율 <span id="bd-hs-wv">100%</span></label>'
      + '<input id="bd-hs-w" type="range" min="50" max="200" value="100" style="width:100%">'
      + '<button id="bd-hs-reset" style="margin-top:10px;width:100%;padding:7px;border-radius:8px;'
      + 'border:1px solid rgba(255,255,255,.2);background:#2b3550;color:#fff;cursor:pointer;">이 맵 기본값으로</button>';
    document.body.appendChild(panel);
    function apply(){
      var s = load();
      s[sid()] = { scale: Number(document.getElementById('bd-hs-scale').value),
                   w: Number(document.getElementById('bd-hs-w').value) };
      save(s);
      document.getElementById('bd-hs-sv').textContent = s[sid()].scale + '%';
      document.getElementById('bd-hs-wv').textContent = s[sid()].w + '%';
    }
    ['bd-hs-scale','bd-hs-w'].forEach(function(id){
      panel.querySelector('#'+id).addEventListener('input', apply);
    });
    panel.querySelector('#bd-hs-reset').onclick = function(){
      var s = load(); delete s[sid()]; save(s);
      document.getElementById('bd-hs-scale').value = 100;
      document.getElementById('bd-hs-w').value = 100;
      apply();
    };
    return panel;
  }
  setInterval(function(){
    try{
      var p = ensure();
      if (!editorOn()){ p.style.display='none'; return; }
      p.style.display = 'block';
      var c = cur();
      if (document.activeElement !== document.getElementById('bd-hs-scale')){
        document.getElementById('bd-hs-scale').value = c.scale;
        document.getElementById('bd-hs-w').value = c.w;
        document.getElementById('bd-hs-sv').textContent = c.scale + '%';
        document.getElementById('bd-hs-wv').textContent = c.w + '%';
      }
      var px = (typeof HERO_BASE_H !== 'undefined' && typeof currentScale !== 'undefined')
        ? Math.round(HERO_BASE_H * currentScale) : 0;
      document.getElementById('bd-hs-info').textContent =
        '현재 맵: ' + sid() + '  ·  화면 높이 ' + px + 'px';
    }catch(e){}
  }, 400);
})();
