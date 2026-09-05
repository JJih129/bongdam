
/* ══════════════════════════════════════════════════════════════════
   (v240) 위험요소 필드 스프라이트 + 정화 연출
   ------------------------------------------------------------------
   업로드된 픽셀아트 21종을 원형 데칼로 가공(원본 23MB → 169KB)해
   field.hazard.<id>(정화 전) / field.hazard_clean.<id>(정화 후)로 등록.
   승리 후 필드로 돌아오면 해당 자리에서 빛 번짐 + 반짝이 연출과 함께
   깨끗해진 그림으로 바뀐다. bottle·graffiti 는 그림이 없어 기존 표시 유지.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var IMGS = {"field.hazard.bicycle": "data:image/webp;base64,@@B64:c4cc621a_bicycle.webp@@", "field.hazard_clean.bicycle": "data:image/webp;base64,@@B64:f509d44b_bicycle.webp@@", "field.hazard.cigarette": "data:image/webp;base64,@@B64:a7021db4_cigarette.webp@@", "field.hazard_clean.cigarette": "data:image/webp;base64,@@B64:02992e6e_cigarette.webp@@", "field.hazard.dark_alley": "data:image/webp;base64,@@B64:38555ca9_dark_alley.webp@@", "field.hazard_clean.dark_alley": "data:image/webp;base64,@@B64:f61d2c12_dark_alley.webp@@", "field.hazard.glass": "data:image/webp;base64,@@B64:7c4d1295_glass.webp@@", "field.hazard_clean.glass": "data:image/webp;base64,@@B64:76d3da0b_glass.webp@@", "field.hazard.kickboard": "data:image/webp;base64,@@B64:7e28bccb_kickboard.webp@@", "field.hazard_clean.kickboard": "data:image/webp;base64,@@B64:c2bdf246_kickboard.webp@@", "field.hazard.noise_bat": "data:image/webp;base64,@@B64:25785cb5_noise_bat.webp@@", "field.hazard_clean.noise_bat": "data:image/webp;base64,@@B64:1ea9b7e5_noise_bat.webp@@", "field.hazard.road_crack": "data:image/webp;base64,@@B64:8454e82e_road_crack.webp@@", "field.hazard_clean.road_crack": "data:image/webp;base64,@@B64:38858329_road_crack.webp@@", "field.hazard.sign_ghost": "data:image/webp;base64,@@B64:99adf139_sign_ghost.webp@@", "field.hazard_clean.sign_ghost": "data:image/webp;base64,@@B64:f22f7d48_sign_ghost.webp@@", "field.hazard.streetlight": "data:image/webp;base64,@@B64:73c49dfe_streetlight.webp@@", "field.hazard_clean.streetlight": "data:image/webp;base64,@@B64:0ed943a4_streetlight.webp@@", "field.hazard.trash": "data:image/webp;base64,@@B64:d9a044c9_trash.webp@@", "field.hazard_clean.trash": "data:image/webp;base64,@@B64:42c31254_trash.webp@@", "field.hazard.graffiti": "data:image/webp;base64,@@B64:bf15ae0f_graffiti.webp@@", "field.hazard_clean.graffiti": "data:image/webp;base64,@@B64:adf574ea_graffiti.webp@@", "field.hazard.bottle": "data:image/webp;base64,@@B64:649555ea_bottle.webp@@"};
  function reg(){
    if(!window.BD_ASSETS){ setTimeout(reg, 300); return; }
    BD_ASSETS.setMany(IMGS);
  }
  reg();

  /* ── 정화 연출: 오브젝트 화면 좌표에 빛 번짐 + 반짝이 ── */
  var css = ''
    + '.bd-purify-fx{position:fixed;pointer-events:none;z-index:9500;'
    +   'transform:translate(-50%,-50%);}'
    + '.bd-purify-ring{position:absolute;left:50%;top:50%;width:20px;height:20px;border-radius:50%;'
    +   'transform:translate(-50%,-50%);border:3px solid rgba(160,255,190,.95);'
    +   'box-shadow:0 0 18px rgba(120,230,150,.8);animation:bdPfRing .9s ease-out forwards;}'
    + '@keyframes bdPfRing{0%{width:14px;height:14px;opacity:1}100%{width:170px;height:170px;opacity:0}}'
    + '.bd-purify-flash{position:absolute;left:50%;top:50%;width:120px;height:120px;border-radius:50%;'
    +   'transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,255,240,.95),rgba(160,255,190,.5) 55%,transparent 75%);'
    +   'animation:bdPfFlash .7s ease-out forwards;}'
    + '@keyframes bdPfFlash{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}'
    +   '30%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}'
    + '.bd-purify-sp{position:absolute;left:50%;top:50%;font-size:18px;'
    +   'animation:bdPfSp 1.05s ease-out forwards;text-shadow:0 0 8px rgba(180,255,200,.9);}'
    + '@keyframes bdPfSp{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}'
    +   '25%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.15)}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /** 정규좌표(rx,ry,rw,rh)의 중심에 정화 연출 재생 */
  window.BD_purifyFX = function (obj) {
    try{
      var cv = document.getElementById('game-canvas') || document.querySelector('canvas');
      if(!cv || !obj) return;
      var r = cv.getBoundingClientRect();
      /* (v322) 카메라·줌을 무시한 비례 매핑이라 화면 중앙 밖에선 엉뚱한 곳에 떴다 — 정변환 사용 */
      var x, y;
      var __wr = (typeof window.BD_screenRectOfWorld === 'function')
        ? BD_screenRectOfWorld(Number(obj.rx||0), Number(obj.ry||0), Number(obj.rw||0.04), Number(obj.rh||0.04)) : null;
      if (__wr){ x = __wr.left + __wr.width/2; y = __wr.top + __wr.height/2; }
      else {
        x = r.left + ((obj.rx||0) + (obj.rw||0)/2) * r.width;
        y = r.top  + ((obj.ry||0) + (obj.rh||0)/2) * r.height;
      }
      /* (v372) body zoom(UI 배율) 보정 — 배율≠100% 에서 정화 연출이 자리에서 벗어나던 문제 */
      try{ var __z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (__z > 0 && __z !== 1){ x /= __z; y /= __z; } }catch(eZ){}
      // (v240h) 납품 소멸 시트가 있으면 그걸로 (12프레임, 그림자→빛 입자→새싹)
      try{
        var _pu = window.BD_ASSETS && BD_ASSETS.get('fx.purify');
        if(_pu){
          var _sz = Math.max(140, Math.min(210, r.width * 0.17));
          var _d = document.createElement('div');
          _d.style.cssText = 'position:fixed;left:'+(x-_sz/2)+'px;top:'+(y-_sz/2)+'px;'
            + 'width:'+_sz+'px;height:'+_sz+'px;pointer-events:none;z-index:9990;'
            + 'background-image:url('+_pu+');background-size:1200% 100%;'
            + 'background-repeat:no-repeat;background-position:0% 0;mix-blend-mode:screen;';
          document.body.appendChild(_d);
          var _i = 0;
          var _iv = setInterval(function(){
            _i++;
            if(_i >= 12){ clearInterval(_iv); try{ _d.remove(); }catch(e){} return; }
            _d.style.backgroundPosition = (_i / 11 * 100) + '% 0';
          }, 78);
          return;
        }
      }catch(e){}
      var host = document.createElement('div');
      host.className = 'bd-purify-fx';
      host.style.left = x + 'px'; host.style.top = y + 'px';
      var html = '<div class="bd-purify-flash"></div><div class="bd-purify-ring"></div>';
      var SPARKS = ['✨','⭐','💫','✨','🌟','✨'];
      for(var i=0;i<6;i++){
        var ang = Math.PI*2*i/6 + Math.random()*0.7;
        var dist = 42 + Math.random()*30;
        html += '<span class="bd-purify-sp" style="--dx:' + Math.round(Math.cos(ang)*dist)
              + 'px;--dy:' + Math.round(Math.sin(ang)*dist) + 'px;animation-delay:' + (i*45) + 'ms">'
              + SPARKS[i] + '</span>';
      }
      host.innerHTML = html;
      document.body.appendChild(host);
      setTimeout(function(){ try{ host.remove(); }catch(e){} }, 1400);
      try{ if(window.bdSfx) bdSfx('purify'); }catch(e){}
    }catch(e){}
  };
})();

