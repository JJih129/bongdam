
/* ══════════════════════════════════════════════════════════════════
   (v238) 전투 개선 팩 — 타격 연출 / 액션 커맨드 / 타이밍 가드 / 증강 드래프트
   ------------------------------------------------------------------
   · BD_FX    : 화면 흔들림·플래시·파티클·임팩트 펀치 (에셋 0, 코드 드로잉)
   · BD_AC    : 공격 타이밍 판정 — 줄어드는 링에 맞춰 SPACE/탭
                PERFECT ×1.5 / GOOD ×1.2 / MISS ×0.8
   · BD_GUARD : 적 공격 직전 SPACE/탭 → "가드!" 피해 55% 경감
   · BD_AUG   : 전투 승리마다 증강 3개 중 1개 선택 (세이브에 저장)
   · BD_WRONG : 오답 대처 속성 — 잘못된 속성으로 공격하면 역효과
   기존 전투 스크립트의 calcDamage / hitEnemy / enemyTurn 등에
   (v238) 표시된 최소 패치로 연결된다.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── 스타일 주입 ── */
  var css = ''
    + '@keyframes bdFxShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-3px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(3px,2px)}}'
    + '@keyframes bdFxShakeHard{0%,100%{transform:translate(0,0)}15%{transform:translate(-9px,5px)}30%{transform:translate(9px,-6px)}45%{transform:translate(-7px,-4px)}60%{transform:translate(7px,5px)}80%{transform:translate(-4px,2px)}}'
    + '.bd-fx-shake{animation:bdFxShake .28s linear}'
    + '.bd-fx-shake-hard{animation:bdFxShakeHard .38s linear}'
    + '.bd-fx-flash{position:absolute;inset:0;pointer-events:none;z-index:60;transition:opacity .18s}'
    + '.bd-fx-part{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:59;'
    +   'animation:bdFxPart .55s ease-out forwards}'
    + '@keyframes bdFxPart{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}'
    + '.bd-fx-punch{transition:transform 70ms ease-out !important;transform:scale(1.035)}'
    /* 액션 커맨드 링 */
    + '#bd-ac-wrap{position:absolute;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;'
    +   'background:rgba(0,0,10,.25);cursor:pointer}'
    + '#bd-ac-ring{position:relative;width:120px;height:120px}'
    + '.bd-ac-target{position:absolute;inset:0;border:3px solid #ffd86b;border-radius:50%;'
    +   'box-shadow:0 0 14px rgba(255,216,107,.55)}'
    + '.bd-ac-shrink{position:absolute;inset:0;border:3px solid #7dd3fc;border-radius:50%;will-change:transform}'
    + '#bd-ac-label{position:absolute;left:50%;top:calc(50% + 84px);transform:translateX(-50%);'
    +   'color:#e8f2ff;font-weight:800;font-size:15px;text-shadow:0 2px 6px #000;white-space:nowrap}'
    + '.bd-ac-grade{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:30px;font-weight:900;'
    +   'text-shadow:0 2px 8px #000;animation:bdAcGrade .5s ease-out forwards;white-space:nowrap;z-index:71}'
    + '@keyframes bdAcGrade{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}'
    +   '100%{opacity:0;transform:translate(-50%,-70%) scale(1)}}'
    /* 가드 프롬프트 */
    + '#bd-guard-tip{position:absolute;z-index:66;font-size:15px;font-weight:800;color:#9ff0ff;'
    +   'text-shadow:0 2px 6px #000;pointer-events:none;animation:bdGuardPulse2 .45s infinite alternate}'
    + '@keyframes bdGuardPulse2{from{transform:scale(1);opacity:.75}to{transform:scale(1.18);opacity:1}}'
    /* 오답 피해 팝업 */
    + '.hsr-dmg.wrong{color:#ff6b6b;font-size:26px}'
    /* 증강 드래프트 */
    + '#bd-aug-overlay{position:absolute;inset:0;z-index:120;'
      +   'background:radial-gradient(ellipse at 50% 35%, rgba(30,40,80,.92), rgba(4,6,18,.96));'
      +   'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;'
      +   'animation:hsrFadeIn .3s;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}'
      + '#bd-aug-title{color:#ffd86b;font-size:26px;font-weight:900;letter-spacing:1px;'
      +   'text-shadow:0 3px 16px rgba(255,200,90,.5),0 2px 6px #000;margin-bottom:2px}'
      + '#bd-aug-sub{color:#b8c6e6;font-size:14px;font-weight:700;margin-bottom:20px;'
      +   'padding:6px 16px;border-radius:99px;background:rgba(255,255,255,.06);'
      +   'border:1px solid rgba(255,255,255,.10)}'
      + '#bd-aug-row{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;padding:0 16px}'
      + '.bd-aug-card{position:relative;width:212px;min-height:206px;border-radius:20px;'
      +   'padding:22px 16px 18px;cursor:pointer;text-align:center;overflow:hidden;'
      +   'background:linear-gradient(165deg,#1e2744 0%,#141a2e 55%,#0d1120 100%);'
      +   'border:2px solid rgba(150,180,255,.28);'
      +   'box-shadow:0 10px 30px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.08);'
      +   'transition:transform .18s cubic-bezier(.2,.9,.3,1), box-shadow .18s, border-color .18s;'
      +   'color:#dfe8ff;display:flex;flex-direction:column;align-items:center}'
      + '.bd-aug-card::before{content:\'\';position:absolute;left:0;right:0;top:0;height:4px;'
      +   'background:linear-gradient(90deg,#ffd86b,#ff9f43,#ffd86b);opacity:.55;transition:opacity .18s}'
      + '.bd-aug-card:hover{transform:translateY(-10px) scale(1.03);border-color:#ffd86b;'
      +   'box-shadow:0 18px 42px rgba(255,190,80,.30), inset 0 1px 0 rgba(255,255,255,.12)}'
      + '.bd-aug-card:hover::before{opacity:1}'
      + '.bd-aug-card:active{transform:translateY(-4px) scale(1.0)}'
      + '.bd-aug-icon{font-size:48px;line-height:1;margin-bottom:12px;'
      +   'filter:drop-shadow(0 4px 12px rgba(255,200,90,.45))}'
      + '.bd-aug-name{font-weight:900;font-size:18px;margin-bottom:10px;color:#ffe9a8;letter-spacing:.5px}'
      + '.bd-aug-desc{font-size:13.5px;line-height:1.65;color:#c3d0ec;flex:1;'
      +   'display:flex;align-items:center;justify-content:center;padding:0 4px}'
      + '.bd-aug-key{margin-top:12px;font-size:12px;font-weight:800;color:#0e1424;'
      +   'background:linear-gradient(180deg,#ffe9a8,#f5c46a);padding:5px 14px;border-radius:99px;'
      +   'box-shadow:0 3px 10px rgba(0,0,0,.35)}';
  var st = document.createElement('style');
  st.id = 'bd-combat-plus-style';
  st.textContent = css;
  document.head.appendChild(st);

  function arena(){ return document.getElementById('hsr-arena'); }
  function root(){ return document.getElementById('hsr-battle'); }

  /* ══════════════ ① BD_FX — 타격 연출 ══════════════ */
  var FX = {
    shake: function(hard){
      var a = arena(); if(!a) return;
      var cls = hard ? 'bd-fx-shake-hard' : 'bd-fx-shake';
      a.classList.remove('bd-fx-shake','bd-fx-shake-hard'); void a.offsetWidth;
      a.classList.add(cls);
      setTimeout(function(){ a.classList.remove(cls); }, 420);
    },
    flash: function(color, opacity, ms){
      var a = arena(); if(!a) return;
      var f = document.createElement('div');
      f.className = 'bd-fx-flash';
      f.style.background = color; f.style.opacity = opacity;
      a.appendChild(f);
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ f.style.opacity = 0; }); });
      setTimeout(function(){ f.remove(); }, (ms||200) + 200);
    },
    punch: function(){   // 임팩트 순간 화면이 살짝 커졌다 돌아오는 히트스톱 느낌
      var a = arena(); if(!a) return;
      a.classList.add('bd-fx-punch');
      setTimeout(function(){ a.classList.remove('bd-fx-punch'); }, 85);
    },
    particles: function(targetEl, kind){
      var a = arena(); if(!a || !targetEl) return;
      var r = targetEl.getBoundingClientRect(), ar = a.getBoundingClientRect();
      var cx = r.left - ar.left + r.width/2, cy = r.top - ar.top + r.height/2;
      var color = kind==='crit' ? '#ffffff' : kind==='weakhit' ? '#ffd86b'
                : kind==='wrong' ? '#ff6b6b' : '#9fc2ff';
      var n = kind==='crit' || kind==='weakhit' ? 12 : 7;
      for(var i=0;i<n;i++){
        var p = document.createElement('span');
        p.className = 'bd-fx-part';
        var ang = Math.random()*Math.PI*2, dist = 34 + Math.random()*46;
        p.style.setProperty('--dx', Math.cos(ang)*dist + 'px');
        p.style.setProperty('--dy', Math.sin(ang)*dist + 'px');
        p.style.left = cx+'px'; p.style.top = cy+'px'; p.style.background = color;
        a.appendChild(p);
        setTimeout(function(el){ return function(){ el.remove(); }; }(p), 650);
      }
    },
    onHit: function(kind, targetEl){
      try{
        if(kind === 'crit'){ this.flash('#ffffff', .38, 160); this.shake(true); this.punch(); }
        else if(kind === 'weakhit'){ this.flash('#ffd86b', .22, 160); this.shake(false); this.punch(); }
        else if(kind === 'wrong'){ this.flash('#ff4d4d', .25, 220); }
        else { this.shake(false); }
        this.particles(targetEl, kind);
      }catch(e){}
    }
  };
  window.BD_FX = FX;

  /* ══════════ (v240h) 스프라이트 시트 이펙트 확장 ══════════
     납품 이펙트(fx.skill.* / fx.hit.* / fx.judge.perfect / fx.purify)를
     BD_ASSETS 슬롯에서 읽어 재생한다. 미등록이면 조용히 무시(기존 절차 연출만). */
  FX.SHEETS = {
    'fx.skill.sticker': { n: 8,  fps: 14 }, 'fx.skill.fan':   { n: 8,  fps: 15 },
    'fx.skill.wash':    { n: 8,  fps: 13 }, 'fx.skill.light': { n: 8,  fps: 14 },
    'fx.skill.cheer':   { n: 8,  fps: 13 }, 'fx.skill.ult':   { n: 12, fps: 14 },
    'fx.hit.W': { n: 6, fps: 18 }, 'fx.hit.G': { n: 6, fps: 18 },
    'fx.hit.M': { n: 6, fps: 18 }, 'fx.hit.N': { n: 6, fps: 18 },
    'fx.hit.crit': { n: 6, fps: 18 }, 'fx.purify': { n: 12, fps: 13 },
  };
  /** key 시트를 host(기본: 적 스프라이트 박스) 중앙에 size(px)로 재생 */
  FX.sheet = function (key, host, size, opt) {
    try {
      opt = opt || {};
      var url = window.BD_ASSETS && BD_ASSETS.get(key);
      var meta = this.SHEETS[key];
      if (!url || !meta) return false;
      host = host || (typeof el !== 'undefined' && el.enemySprite) || document.getElementById('hsr-u-enemy');
      if (!host) return false;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var d = document.createElement('div');
      d.className = 'bd-fx-sheet';
      d.style.cssText = 'position:absolute;left:50%;top:' + (opt.top || '50%') + ';'
        + 'transform:translate(-50%,-50%);pointer-events:none;z-index:' + (opt.z || 45) + ';'
        + 'width:' + size + 'px;height:' + size + 'px;'
        + 'background-image:url(' + url + ');background-size:' + (meta.n * 100) + '% 100%;'
        + 'background-repeat:no-repeat;background-position:0% 0;'
        + (opt.blend === false ? '' : 'mix-blend-mode:screen;');
      host.appendChild(d);
      var i = 0, n = meta.n;
      var iv = setInterval(function () {
        i++;
        if (i >= n) { clearInterval(iv); try { d.remove(); } catch (e) { } return; }
        d.style.backgroundPosition = (i / (n - 1) * 100) + '% 0';
      }, Math.round(1000 / meta.fps));
      return true;
    } catch (e) { return false; }
  };
  /** 스킬 시전 이펙트 (적 위) */
  FX.skillSheet = function (skillId) {
    var size = skillId === 'ult' ? 620 : 460;
    return this.sheet('fx.skill.' + skillId, null, size);
  };
  /** 피격 이펙트 — isWeak 면 크리티컬판 */
  FX.hitSheet = function (elem, isWeak) {
    var key = isWeak ? 'fx.hit.crit' : ('fx.hit.' + (elem || 'N'));
    if (!this.SHEETS[key]) key = 'fx.hit.N';
    return this.sheet(key, null, isWeak ? 400 : 330);
  };
  /** PERFECT 판정 링 플레어 (정지컷 확대·페이드) */
  FX.perfectFlare = function () {
    try {
      var url = window.BD_ASSETS && BD_ASSETS.get('fx.judge.perfect');
      if (!url) return false;
      var host = (typeof el !== 'undefined' && el.enemySprite) || document.getElementById('hsr-u-enemy');
      if (!host) return false;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);'
        + 'pointer-events:none;z-index:46;width:380px;height:380px;opacity:0;'
        + 'background:url(' + url + ') center/contain no-repeat;mix-blend-mode:screen;'
        + 'transition:transform .32s ease-out, opacity .32s ease-out;';
      host.appendChild(d);
      requestAnimationFrame(function () {
        d.style.opacity = '1'; d.style.transform = 'translate(-50%,-50%) scale(1.15)';
      });
      setTimeout(function () { d.style.opacity = '0'; }, 300);
      setTimeout(function () { try { d.remove(); } catch (e) { } }, 640);
      return true;
    } catch (e) { return false; }
  };

  /* ══════════════ ③ BD_WRONG — 오답 대처 속성 ══════════════ */
  //  각 위험요소 계열마다 "잘못된 대처" 속성이 하나 있다.
  //  이 속성으로 공격하면 피해 70% 감소 + 적 인성 회복(+12) — 안전 지식이 곧 공략.
  window.BD_WRONG = {
    smoke:   { elem:'M', msg:'⚠ 잘못된 대처! 금속 도구를 휘둘러도 연기·소음은 잡히지 않는다 — 오히려 커졌다!' },
    pollute: { elem:'W', msg:'⚠ 잘못된 대처! 부채질하자 오염 물질이 사방으로 퍼졌다!' },
    dark:    { elem:'G', msg:'⚠ 잘못된 대처! 파손된 시설 근처의 물기는 감전 위험이 있다!' },
  };

  /* ══════════════ ② BD_AC — 공격 타이밍 판정 ══════════════ */
  var AC = {
    _busy:false,
    windowMult: function(){ return (window.BD_AUG && BD_AUG.has('ac_ease')) ? 1.4 : 1; },
    run: function(opts, cb){
      var a = arena();
      if(!a || this._busy){ cb(1); return; }
      this._busy = true;
      var self = this;
      var wrap = document.createElement('div'); wrap.id = 'bd-ac-wrap';
      wrap.innerHTML = '<div id="bd-ac-ring">'
        + '<div class="bd-ac-target"></div>'
        + '<div class="bd-ac-shrink"></div></div>'
        + '<div id="bd-ac-label">링이 겹칠 때 SPACE / 탭!</div>';
      a.appendChild(wrap);
      var ring = wrap.querySelector('.bd-ac-shrink');
      var DUR = 850, start = performance.now(), done = false;
      var wm = this.windowMult();
      function scaleAt(t){ // 2.3 → 0.25 선형 축소
        var k = Math.min(1, (t - start) / DUR);
        return 2.3 + (0.25 - 2.3) * k;
      }
      function frame(t){
        if(done) return;
        ring.style.transform = 'scale(' + scaleAt(t).toFixed(3) + ')';
        if(t - start >= DUR){ finish(0.8, 'MISS…', '#8a93ab'); return; }
        requestAnimationFrame(frame);
      }
      function finish(mult, label, color){
        if(done) return; done = true;
        document.removeEventListener('keydown', onKey, true);
        wrap.removeEventListener('pointerdown', onTap, true);
        var g = document.createElement('div');
        g.className = 'bd-ac-grade'; g.textContent = label; g.style.color = color;
        a.appendChild(g);
        setTimeout(function(){ g.remove(); }, 520);
        wrap.remove();
        self._busy = false;
        cb(mult);
      }
      function judge(){
        var s = scaleAt(performance.now());
        var d = Math.abs(s - 1);              // 목표 링(scale 1)과의 차이
        if(d <= 0.16 * wm)      finish(1.5, 'PERFECT!', '#ffd86b');
        else if(d <= 0.45 * wm) finish(1.2, 'GOOD!',    '#7dd3fc');
        else                    finish(0.8, 'MISS…',    '#8a93ab');
      }
      function onKey(e){
        if(e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter'){
          e.preventDefault(); e.stopPropagation(); judge();
        }
      }
      function onTap(e){ e.preventDefault(); e.stopPropagation(); judge(); }
      document.addEventListener('keydown', onKey, true);
      wrap.addEventListener('pointerdown', onTap, true);
      requestAnimationFrame(frame);
    }
  };
  window.BD_AC = AC;
  // 다음 한 번의 타격에 적용될 배율 (hitEnemy / HSR_hitEnemyRaw 가 소비)
  window.__bdAcMult = 0;
  window.BD_consumeAcMult = function(){
    var m = window.__bdAcMult || 0;
    window.__bdAcMult = 0;
    return m > 0 ? m : 1;
  };

  /* ══════════════ ② BD_GUARD — 타이밍 방어 ══════════════ */
  var GUARD = {
    _active:false, _impactAt:0, _pressAt:0, _tip:null,
    disabled: true,   // (v239) 타이밍 가드 제거 — 조작만 늘고 재미가 없었다
    arm: function(msUntilImpact){
      if(this.disabled) return;
      try{
        this._active = true;
        this._impactAt = performance.now() + msUntilImpact;
        this._pressAt = 0;
        var a = arena(); if(!a) return;
        this._clearTip();
        var hero = document.getElementById('hsr-u-hero');
        var tip = document.createElement('div');
        tip.id = 'bd-guard-tip'; tip.textContent = '🛡 SPACE!';
        if(hero){
          var r = hero.getBoundingClientRect(), ar = a.getBoundingClientRect();
          tip.style.left = (r.left - ar.left + r.width/2 - 34) + 'px';
          tip.style.top  = (r.top - ar.top - 26) + 'px';
        } else { tip.style.left = '20%'; tip.style.top = '40%'; }
        a.appendChild(tip);
        this._tip = tip;
        var self = this;
        setTimeout(function(){ self._clearTip(); self._active = false; }, msUntilImpact + 260);
      }catch(e){}
    },
    _clearTip: function(){ if(this._tip){ this._tip.remove(); this._tip = null; } },
    press: function(){ if(this.disabled) return; if(this._active && !this._pressAt){ this._pressAt = performance.now(); } },
    // 영웅이 피해를 받기 직전 호출 — 성공 시 피해 55% 경감 (+반격 증강)
    consume: function(dmg){
      if(this.disabled) return dmg;
      var ok = false;
      var win = 230 * ((window.BD_AUG && BD_AUG.has('ac_ease')) ? 1.4 : 1);
      if(this._pressAt && Math.abs(this._pressAt - this._impactAt) <= win) ok = true;
      this._pressAt = 0; this._active = false; this._clearTip();
      if(!ok) return dmg;
      var reduced = Math.max(1, Math.round(dmg * 0.45));
      try{
        var heroEl = document.getElementById('hsr-u-hero');
        if(typeof popDmg === 'function' && heroEl) popDmg(heroEl, '🛡 가드!', 'heal');
        if(window.BD_FX) BD_FX.flash('#7dd3fc', .22, 160);
        // 증강: 반격 태세 — 가드 성공 시 공격력 40%로 반격
        if(window.BD_AUG && BD_AUG.has('guard_counter') && window.HSR && HSR.enemy && HSR.enemy.hp > 0){
          setTimeout(function(){
            try{
              var c = Math.max(1, Math.round((HSR.hero.atk || 12) * 0.4));
              HSR.enemy.hp = Math.max(0, HSR.enemy.hp - c);
              var en = document.getElementById('hsr-u-enemy');
              if(typeof popDmg === 'function' && en) popDmg(en, c, 'normal');
              if(typeof say === 'function') say('⚔ 반격! 가드와 동시에 되받아쳤다!');
              if(typeof refreshEnemyUI === 'function') refreshEnemyUI();
              if(HSR.enemy.hp <= 0 && typeof checkEnemyDead === 'function') checkEnemyDead();
            }catch(e){}
          }, 300);
        }
      }catch(e){}
      return reduced;
    }
  };
  window.BD_GUARD = GUARD;
  document.addEventListener('keydown', function(e){
    if(!window.HSR || !HSR.active) return;
    if(e.key === ' ' || e.key === 'Spacebar'){
      if(GUARD._active){ e.preventDefault(); e.stopPropagation(); GUARD.press(); }
    }
  }, true);
  document.addEventListener('pointerdown', function(){
    if(window.HSR && HSR.active && GUARD._active) GUARD.press();
  }, true);

  /* ══════════════ ④ BD_AUG — 승리 증강 드래프트 ══════════════ */
  var POOL = [
    { id:'atk_up',        icon:'💪', name:'단단한 배지',   desc:'모든 공격 피해 +12%' },
    { id:'crit_ch',       icon:'🎯', name:'날카로운 눈',   desc:'치명타 확률 +10%p' },
    { id:'crit_dm',       icon:'💥', name:'결정타',       desc:'치명타 피해 +35%p' },
    { id:'weak_up',       icon:'🔍', name:'약점 분석',     desc:'약점 공격 피해 보너스 +25%p' },
    { id:'pp_up',         icon:'🎒', name:'넉넉한 준비',   desc:'속성 스킬 사용 횟수 +1' },
    { id:'win_heal',      icon:'💖', name:'정화의 온기',   desc:'전투 승리 시 HP 12 회복' },
    { id:'refund_luck',   icon:'🍀', name:'알뜰한 손',     desc:'GOOD 판정도 35% 확률로 횟수 환급' },
    { id:'ac_ease',       icon:'🧘', name:'집중력',       desc:'타이밍 판정(공격·가드) 범위 +40%' },
    { id:'iron_skin',     icon:'🛡️', name:'두꺼운 장갑',   desc:'받는 피해 -10%' },
    /* (v124) 현재 시스템에 맞게 정리 —
       · '열정 충전(필살 게이지 +25%)' 제거: 궁극기가 보스전 1회 지급으로 바뀌어 게이지 개념이 없음
       · 실제로 작동하는 시스템(아이템·소지금·브레이크·미니게임)에 붙는 증강으로 교체·추가 */
    { id:'item_boost',    icon:'🧃', name:'든든한 간식',   desc:'회복 아이템 효과 +50%' },
    { id:'gold_up',       icon:'💰', name:'알뜰 살림',     desc:'주민 보상 소지금 +30%' },
    { id:'first_strike',  icon:'🌅', name:'선제 정화',     desc:'전투 첫 공격 피해 +40%' },
  ];
  function owned(){
    if(!window.BD) return [];
    if(!Array.isArray(BD._augments)) BD._augments = [];
    return BD._augments;
  }
  var AUG = {
    POOL: POOL,
    has: function(id){ return owned().indexOf(id) >= 0; },
    add: function(id){
      if(!this.has(id)) owned().push(id);
      try{ if(typeof window.BD_save === 'function') window.BD_save(); }catch(e){}
    },
    remaining: function(){
      var o = owned();
      return POOL.filter(function(p){ return o.indexOf(p.id) < 0; });
    },
    canDraft: function(){ return this.remaining().length > 0; },
    /* 효과 조회 — 전투 코드의 (v238) 패치 지점들이 호출 */
    dmgMult:      function(){ return this.has('atk_up')   ? 1.12 : 1; },
    critChance:   function(){ return this.has('crit_ch')  ? 0.10 : 0; },
    critMult:     function(){ return this.has('crit_dm')  ? 0.35 : 0; },
    weakBonus:    function(){ return this.has('weak_up')  ? 0.25 : 0; },
    breakBonus:   function(){ return 0; },   // (v291) 브레이크 시스템 제거
    startMp:      function(){ return 0; },   // (v74) 'mp_start' 증강 제거 — SP 시스템 폐지로 효과가 없었음
    incomingMult: function(){ return this.has('iron_skin')? 0.90 : 1; },
    ultGainMult:  function(){ return 1; },   // (v124) 게이지 시스템 폐지 — 항상 1
    /* (v124) 새 증강 효과 */
    itemMult:     function(){ return this.has('item_boost') ? 1.5 : 1; },
    goldMult:     function(){ return this.has('gold_up')    ? 1.3 : 1; },
    firstMult:    function(){ return this.has('first_strike') ? 1.4 : 1; },
    onWin: function(){
      if(!this.has('win_heal')) return;
      try{
        if(window.HSR && HSR.hero){
          HSR.hero.hp = Math.min(HSR.hero.maxhp, HSR.hero.hp + 12);
          if(typeof syncSharedHP === 'function') syncSharedHP(HSR.hero.hp, false);
          else if(window.BD) BD.hp = Math.min(BD.maxHp || 100, (BD.hp || 0) + 12);
        }
      }catch(e){}
    },
    /* 정화 완료 후 3택 드래프트 */
    draft: function(onDone){
      var host = root() || document.body;
      var pool = this.remaining();
      if(!pool.length){ if(typeof onDone==='function') onDone(); return; }
      // 무작위 3개 뽑기
      var picks = pool.slice().sort(function(){ return Math.random() - 0.5; }).slice(0, 3);
      window.__bdAugOpen = true;
      var ov = document.createElement('div'); ov.id = 'bd-aug-overlay';
      ov.innerHTML = '<div id="bd-aug-title">🔧 지킴이 강화</div>'
        + '<div id="bd-aug-sub">정화의 힘이 응축됐다 — 하나를 골라 배지를 강화하세요</div>'
        + '<div id="bd-aug-row"></div>';
      var row = ov.querySelector('#bd-aug-row');
      var self = this;
      function choose(p){
        self.add(p.id);
        window.__bdAugOpen = false;
        document.removeEventListener('keydown', onKey, true);
        ov.remove();
        try{ if(typeof bdToast === 'function') bdToast(p.icon + ' ' + p.name + ' 획득! — ' + p.desc); }catch(e){}
        if(typeof onDone==='function') onDone();
      }
      picks.forEach(function(p, i){
        var c = document.createElement('div');
        c.className = 'bd-aug-card';
        c.innerHTML = '<div class="bd-aug-icon">' + p.icon + '</div>'
          + '<div class="bd-aug-name">' + p.name + '</div>'
          + '<div class="bd-aug-desc">' + p.desc + '</div>'
          + '<div class="bd-aug-key">[' + (i + 1) + ']</div>';
        c.onclick = function(){ choose(p); };
        row.appendChild(c);
      });
      function onKey(e){
        var n = parseInt(e.key, 10);
        if(n >= 1 && n <= picks.length){
          e.preventDefault(); e.stopPropagation(); choose(picks[n - 1]);
        }
      }
      document.addEventListener('keydown', onKey, true);
      host.appendChild(ov);
    }
  };
  window.BD_AUG = AUG;
})();

