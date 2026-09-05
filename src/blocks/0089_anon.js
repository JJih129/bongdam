
/* ══════════════════════════════════════════════════════════════════
   (v239) 담이 튜토리얼 시스템
   ------------------------------------------------------------------
   · BD_DAMI  : 지킴이 배지 '담이' 대화창 (기존 bd-tutorial 배너 전용)
                표정 4종 · 타이핑 연출 · 1회 노출 잠금 · 발화 빈도 제한
   · BD_TUTOR : 스텝 러너 + 스포트라이트
                강조 대상만 뚫고 나머지 차단, 조건 충족 시 자동 진행
   좌표를 쓰지 않는다 — 강조는 DOM 셀렉터, 진행은 이벤트로만 지정한다.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var FACE = { base: '🔰', surprise: '❗', proud: '✨', worry: '💦' };

  /* (v240c) 담이는 배지 수여식(awaken) 전에는 잠들어 있다.
     배지를 받기도 전에 좌하단에 배지 마크(담이 HUD)가 떠 있던 문제 —
     각성 전엔 HUD 를 숨기고 show() 도 무시한다. */
  var AWAKE = false;
  try { AWAKE = localStorage.getItem('bd_dami_awake') === '1'
             || localStorage.getItem('bd_tut2_done') === '1'; } catch (e) { }
  function wakeNow() {
    AWAKE = true;
    try { localStorage.setItem('bd_dami_awake', '1'); } catch (e) { }
    try {
      var h = document.getElementById('bd-dami-hud');
      if (h) h.style.display = isGameplayVisible() ? '' : 'none';
    } catch (e) { }
  }

  /* ── 스타일 ── */
  var css = ''
    /* 스포트라이트 */
    + '#bd-spot{position:fixed;inset:0;z-index:100000;pointer-events:none}'
    + '#bd-spot-hole{position:absolute;border-radius:12px;pointer-events:none;'
    + 'box-shadow:0 0 0 9999px rgba(0,0,0,.62);transition:all .28s cubic-bezier(.3,1.2,.4,1);'
    + 'border:3px solid #ffd86b;animation:bdSpotPulse 1.2s ease-in-out infinite}'
    + '@keyframes bdSpotPulse{0%,100%{border-color:rgba(255,216,107,.95);box-shadow:0 0 0 9999px rgba(0,0,0,.62),0 0 14px 2px rgba(255,216,107,.5)}'
    + '50%{border-color:rgba(255,216,107,.35);box-shadow:0 0 0 9999px rgba(0,0,0,.62),0 0 4px 0 rgba(255,216,107,.2)}}'
    + '#bd-spot-hand{position:absolute;font-size:30px;pointer-events:none;animation:bdSpotHand 1.1s ease-in-out infinite;'
    + 'text-shadow:0 2px 8px rgba(0,0,0,.7)}'
    + '@keyframes bdSpotHand{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}'
    + '#bd-spot-block{position:fixed;inset:0;z-index:99990}'
    /* 담이 대화창 (기존 배너 재활용 + 보강) */
    + '#bd-tutorial.bd-dami{z-index:99010 !important;transition:top .25s ease,bottom .25s ease}'
    + '#bd-tutorial.bd-dami-top{top:16px !important;bottom:auto !important}'
    + '#bd-tutorial .bd-tut-icon{font-size:30px;line-height:1.1}'
    + '#bd-tutorial .bd-tut-title{color:#ffd86b}'
    + '.bd-dami-caret{display:inline-block;width:8px;color:#ffd86b;animation:bdCaret .6s step-end infinite}'
    + '@keyframes bdCaret{50%{opacity:0}}'
    /* (v240b) 전투 중엔 필드 가이드·담이 말풍선을 띄우지 않음 (전투 팁은 bd-in-battle 클래스로 별도 표시) */
    + 'body.bd-battle-on #bd-guide-ov{display:none !important;}'
    + 'body.bd-battle-on #bd-dami-hud:not(.bd-in-battle) #bd-dami-bubble{opacity:0 !important;visibility:hidden !important;}'
    /* ── 상주 배지 HUD (좌하단) ── */
    + '#bd-dami-hud{position:fixed;left:14px;bottom:14px;z-index:100020;display:flex;align-items:flex-end;'
    +   'gap:10px;pointer-events:none;transition:bottom .25s ease,opacity .2s}'
    + '#bd-dami-hud.bd-dami-up{bottom:46%}'
    + '#bd-dami-hud.bd-in-battle{bottom:270px}'   /* (v239) 전투 액션바를 가리지 않게 */
    + '#bd-dami-hud.bd-dami-gone{opacity:0;pointer-events:none;visibility:hidden}'
    + '#bd-dami-face{width:54px;height:54px;flex:0 0 54px;border-radius:50%;display:flex;align-items:center;'
    +   'justify-content:center;font-size:26px;background:radial-gradient(circle at 35% 30%,#2a3350,#141a2c);'
    +   'border:2px solid #ffd86b;box-shadow:0 3px 14px rgba(0,0,0,.55),0 0 12px rgba(255,216,107,.25);'
    +   'animation:bdDamiFloat 3s ease-in-out infinite;pointer-events:auto;cursor:pointer;user-select:none}'
    + '@keyframes bdDamiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}'
    + '#bd-dami-face.talking{box-shadow:0 3px 14px rgba(0,0,0,.55),0 0 20px rgba(255,216,107,.65)}'
    + '#bd-dami-bubble{position:relative;max-width:min(460px,52vw);background:rgba(13,20,40,.96);'
    +   'border:1px solid rgba(255,216,107,.55);border-radius:14px;padding:10px 14px;color:#e8f2ff;'
    +   'font-size:14px;line-height:1.55;box-shadow:0 8px 26px rgba(0,0,0,.5);opacity:0;'
    +   'transform:translateX(-8px);transition:opacity .18s,transform .18s;'
    /* (v239) 말풍선은 읽기 전용 — 투명해진 뒤에도 아래 버튼 클릭을 삼키던 버그 */
    +   'pointer-events:none;visibility:hidden}'
    + '#bd-dami-bubble.on{visibility:visible}'
    + '#bd-dami-bubble.on{opacity:1;transform:translateX(0)}'
    + '#bd-dami-bubble::before{content:"";position:absolute;left:-7px;bottom:18px;width:12px;height:12px;'
    +   'background:rgba(13,20,40,.96);border-left:1px solid rgba(255,216,107,.55);'
    +   'border-bottom:1px solid rgba(255,216,107,.55);transform:rotate(45deg)}'
    + '#bd-dami-name{color:#ffd86b;font-weight:800;font-size:12px;margin-bottom:3px}'
    + '#bd-dami-skip{margin-left:10px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);'
    +   'color:#cbd5e1;border-radius:8px;padding:3px 9px;font-size:11px;cursor:pointer;pointer-events:auto}'
    + '#bd-dami-skip:hover{background:rgba(255,255,255,.2)}';

  (function () {
    var s = document.createElement('style'); s.id = 'bd-tutor-style';
    s.textContent = css; document.head.appendChild(s);
  })();

  /* ══════════════ 담이 ══════════════ */
  /* 담이는 실제 플레이 화면 전용 UI다.
     저장된 체력·각성 상태가 먼저 복원되어도 타이틀/캐릭터 선택 화면에서는 절대 노출하지 않는다. */
  function isGameplayVisible() {
    try {
      var game = document.getElementById('game-screen');
      if (!game) return false;
      var gameStyle = getComputedStyle(game);
      if (gameStyle.display === 'none' || gameStyle.visibility === 'hidden' || game.offsetHeight <= 0) return false;
      var title = document.getElementById('bd-title-screen');
      if (title) {
        var titleStyle = getComputedStyle(title);
        if (title.classList.contains('show') && titleStyle.display !== 'none' && titleStyle.visibility !== 'hidden') return false;
      }
      return true;
    } catch (e) { return false; }
  }

  /* 좌하단 상주 배지 HUD — 담이는 항상 여기 있고, 말할 때만 말풍선이 펼쳐진다 */
  function hud() {
    var el = document.getElementById('bd-dami-hud');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bd-dami-hud';
      el.innerHTML = '<div id="bd-dami-face">🔰</div>'
        + '<div id="bd-dami-bubble">'
        + '<div id="bd-dami-name">담이</div>'   /* (v120) 건너뛰기 제거 — 안내를 끝까지 보게 한다 */
        + '<div id="bd-dami-text"></div></div>';
      document.body.appendChild(el);
      if (!AWAKE || !isGameplayVisible()) el.style.display = 'none';
      /* (v147) v120에서 건너뛰기 버튼을 innerHTML에서 뺐는데 이 바인딩이 남아 있었다.
         querySelector가 null을 돌려주고 여기서 TypeError —
         그 아래의 «배지 클릭으로 다시 보기»와, 전투 중 말풍선 위치를 잡아 주는
         400ms 인터벌(bd-in-battle 토글)이 영영 설치되지 않았다.
         → 전투 중에는 body.bd-battle-on CSS가 말풍선을 숨기는데 bd-in-battle이
           안 붙으니, 전투 튜토리얼 대사가 «재생은 되는데 안 보이는» 상태가 됐다. */
      var _skipBtn = el.querySelector('#bd-dami-skip');
      if (_skipBtn) _skipBtn.onclick = function (e) {
        e.stopPropagation();
        if (window.BD_TUTOR && window.BD_TUTOR.isRunning()) window.BD_TUTOR.skip();
        else { window.__bdDamiCancelLines = true; DAMI.hide(); }   // (v240e) 오프닝·첫만남도 건너뛰기
      };
      // 배지를 누르면 하던 말을 다시 보여준다
      el.querySelector('#bd-dami-face').onclick = function () {
        if (DAMI._lastText) DAMI.show(DAMI._lastText, { face: DAMI._lastFace, instant: true });
      };
      // 모바일 조이스틱(좌하단)과 겹치지 않게 자리 회피
      setInterval(function () {
        var j = document.getElementById('tc-joystick');
        var on = !!(j && j.offsetHeight > 0 && getComputedStyle(j).display !== 'none');
        el.classList.toggle('bd-dami-up', on);
        // (v239) 전투 중에는 액션 버튼 위로 — 말풍선이 버튼을 덮어 읽기 어려웠다
        el.classList.toggle('bd-in-battle', !!(window.HSR && HSR.active));
      }, 400);
    }
    return el;
  }
  function bubbleOn(on) {
    var b = document.getElementById('bd-dami-bubble');
    var f = document.getElementById('bd-dami-face');
    if (b) b.classList.toggle('on', !!on);
    if (f) f.classList.toggle('talking', !!on);
  }

  var typeTimer = null;
  function typeOut(node, text, done) {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    node.textContent = '';
    var i = 0;
    var caret = document.createElement('span');
    caret.className = 'bd-dami-caret'; caret.textContent = '▌';
    node.appendChild(caret);
    typeTimer = setInterval(function () {
      if (i >= text.length) {
        clearInterval(typeTimer); typeTimer = null;
        try { caret.remove(); } catch (e) { }
        if (done) done();
        return;
      }
      caret.insertAdjacentText('beforebegin', text[i]); i++;
    }, 30);
  }
  function skipTyping(node, text) {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
    node.textContent = text;
  }

  var lastSpokeAt = 0, battleSpeaks = 0;

  var DAMI = {
    FACE: FACE,
    /** 이미 본 대사인지 */
    seen: function (id) {
      try { return !!(window.BD && Array.isArray(BD._damiSeen) && BD._damiSeen.indexOf(id) >= 0); }
      catch (e) { return false; }
    },
    markSeen: function (id) {
      try {
        if (!window.BD) return;
        if (!Array.isArray(BD._damiSeen)) BD._damiSeen = [];
        if (BD._damiSeen.indexOf(id) < 0) BD._damiSeen.push(id);
        if (typeof window.BD_save === 'function') window.BD_save();
      } catch (e) { }
    },
    enabled: function () {
      try { return !(window.BD && BD.damiOff); } catch (e) { return true; }
    },
    /** 대화창 표시. opts: {face, once:id, keep, atTop} */
    show: function (text, opts) {
      opts = opts || {};
      if (!AWAKE && !opts.forceAwake) return false;   // (v240c) 각성 전엔 발화 없음
      if (!isGameplayVisible()) return false;          // (v382) 타이틀·시작 설정 화면에서는 발화 없음
      if (!this.enabled()) return false;
      if (opts.once) {
        if (this.seen(opts.once)) return false;
        this.markSeen(opts.once);
      }
      if (opts.forceAwake) DAMI._forceVisible = true;
      var el = hud();
      el.style.display = '';
      el.classList.remove('bd-dami-gone');
      document.getElementById('bd-dami-face').textContent = FACE[opts.face || 'base'] || FACE.base;
      var skip = document.getElementById('bd-dami-skip');
      if (skip) skip.style.display = ((window.BD_TUTOR && window.BD_TUTOR.isRunning()) || window.__bdDamiOpeningBusy || window.__bdDamiIntroBusy) ? '' : 'none';   // (v26) 오프닝·첫만남도 건너뛰기 노출
      var body = document.getElementById('bd-dami-text');
      bubbleOn(true);
      if (opts.instant) skipTyping(body, text); else typeOut(body, text, opts.onTyped);
      DAMI._lastText = text;
      DAMI._lastFace = opts.face || 'base';
      DAMI._active = true;
      lastSpokeAt = Date.now();
      // 튜토리얼 중이 아니면 잠시 뒤 말풍선만 접는다 (배지는 계속 남는다)
      if (DAMI._autoFold) clearTimeout(DAMI._autoFold);
      if (!(window.BD_TUTOR && window.BD_TUTOR.isRunning())) {
        DAMI._autoFold = setTimeout(function () {
          bubbleOn(false);
          DAMI._active = false;
          if (!AWAKE && DAMI._forceVisible) {
            DAMI._forceVisible = false;
            DAMI.setVisible(false);
          }
        }, Math.max(5200, String(text || '').length * 85 + 1500));
      }
      return true;
    },
    /** 전투 중 제한 발화 — 최대 2회, 30초 쿨다운, 1회성 */
    sayInBattle: function (id, text, face) {
      if (!this.enabled()) return false;
      if (this.seen(id)) return false;
      if (battleSpeaks >= 2) return false;
      if (Date.now() - lastSpokeAt < 30000 && battleSpeaks > 0) return false;
      battleSpeaks++;
      this.show(text, { face: face || 'base', once: id, atTop: true, channel: 'battle', when: function(){ return !!(window.HSR && HSR.active); } });   /* (v374) 전투 밖에선 무의미 → 보류 시 폐기 */
      var self = this;
      /* (v375) 4.2초 뒤 자동 접기 — 그새 다른 대사(새 스킬 튜토 등)가 올라왔으면 접지 않는다
         (전투 한마디의 타이머가 뒤이어 뜬 스킬 튜토 문장을 가려 «담이를 눌러야 보이는» 문제) */
      setTimeout(function () { if (DAMI._lastText === text && !(window.BD_TUTOR && BD_TUTOR.isRunning())) self.hide(); }, 4200);
      return true;
    },
    resetBattleQuota: function () { battleSpeaks = 0; },
    hide: function () {
      DAMI._active = false;
      bubbleOn(false);
      if (!AWAKE && DAMI._forceVisible) {
        DAMI._forceVisible = false;
        DAMI.setVisible(false);
      }
    },
    /** 배지 자체를 숨기거나 되살린다 (컷신용) */
    setVisible: function (on) {
      var el = document.getElementById('bd-dami-hud');
      if (!el) return;
      var allowed = !!on && (AWAKE || DAMI._forceVisible) && isGameplayVisible();
      el.style.display = allowed ? '' : 'none';
      el.classList.toggle('bd-dami-gone', !allowed);
      if (!allowed) bubbleOn(false);
    },
    /** HUD 를 화면에 올려둔다 (게임 시작 시 1회) */
    mount: function () { hud(); },
    /** 다른 안내 모듈도 같은 화면 판정을 재사용한다. */
    isGameplayVisible: isGameplayVisible,
    /** 타이핑 중이면 즉시 완성, 아니면 false */
    fastForward: function () {
      if (!typeTimer) return false;
      skipTyping(document.getElementById('bd-dami-text'), DAMI._lastText || '');
      return true;
    },
    /** (v240c) 연출 없이 각성만 — 프롤로그 완료 시 안전망 */
    wake: function () { wakeNow(); },
    /** 담이 각성 연출 */
    awaken: function (done) {
      wakeNow();   // (v240c) 이 순간부터 담이 HUD·발화 허용
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:99050;background:#000;opacity:0;'
        + 'transition:opacity .4s;pointer-events:none';
      document.body.appendChild(ov);
      requestAnimationFrame(function () { ov.style.opacity = '1'; });
      setTimeout(function () {
        // 방사형 빛
        var burst = document.createElement('div');
        burst.style.cssText = 'position:fixed;left:50%;top:50%;width:10px;height:10px;z-index:99051;'
          + 'border-radius:50%;background:#ffd86b;box-shadow:0 0 60px 30px rgba(255,216,107,.8);'
          + 'transform:translate(-50%,-50%) scale(.2);transition:transform .55s ease-out,opacity .55s';
        document.body.appendChild(burst);
        requestAnimationFrame(function () {
          burst.style.transform = 'translate(-50%,-50%) scale(9)';
          burst.style.opacity = '0';
        });
        // 상승 3음
        [523, 659, 784].forEach(function (f, i) {
          setTimeout(function () {
            try {
              var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
              if (!window.__bdMgAC) window.__bdMgAC = new C();
              var c = window.__bdMgAC, o = c.createOscillator(), g = c.createGain();
              o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.07;
              o.connect(g); g.connect(c.destination); o.start();
              g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.22);
              o.stop(c.currentTime + 0.25);
            } catch (e) { }
          }, i * 90);
        });
        ov.style.opacity = '0';
        setTimeout(function () {
          try { ov.remove(); burst.remove(); } catch (e) { }
          DAMI.mount(); DAMI.setVisible(true);
          DAMI.show('…어? 들려요? 제 목소리, 들리는구나!', { face: 'surprise' });
          if (done) setTimeout(done, 2200);
        }, 550);
      }, 420);
    }
  };
  window.BD_DAMI = DAMI;

  /* (v239) 겹침 감시자 — 튜토리얼이 돌지 않을 때(프롤로그 등)도 항상 동작한다.
     다른 대화창이 뜨면 담이는 물러나고, 끝나면 하던 말을 다시 보여준다. */
  (function watchOverlap() {
    function vis(id) {
      var e = document.getElementById(id); if (!e) return false;
      var cs = getComputedStyle(e);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && e.offsetHeight > 0;
    }
    var last = '';
    setInterval(function () {
      var el = document.getElementById('bd-dami-hud');
      if (!el) return;
      // 게임 진입 직후 타이틀 레이어가 한 틱 늦게 남은 경우 먼저 정리한다.
      try {
        var gs = document.getElementById('game-screen');
        var ts = document.getElementById('bd-title-screen');
        if (gs && ts && gs.offsetHeight > 0 && ts.classList.contains('show')) ts.classList.remove('show');
      } catch (eTitle) { }
      // 타이틀·시작 설정·게임 종료 상태에서는 저장된 각성 여부와 무관하게 완전히 숨긴다.
      if (!isGameplayVisible()) {
        DAMI.setVisible(false);
        DAMI.hide();
        last = 'off';
        return;
      }
      // 풀스크린 VN(초상화가 좌측을 덮는다)·컷신 → 배지까지 숨김
      var fullVN = false;
      try { fullVN = !!window.__bdSceneActive || vis('dialogue-box'); } catch (e) { }
      // 중앙 간이 대화창 → 배지는 그대로, 말풍선만 접는다
      var midDlg = vis('bd-dialog');
      var state = fullVN ? 'full' : (midDlg ? 'mid' : 'free');
      // (v239) 상태 변화가 아니라 매 틱 강제한다 — 다른 코드가 건드려도 바로 교정된다
      if (state === 'full') { DAMI.setVisible(false); bubbleOn(false); }
      else if (state === 'mid') { DAMI.setVisible(true); if (state !== last) bubbleOn(false); }
      else {
        DAMI.setVisible(true);
        if (state !== last && DAMI._active && DAMI._lastText) {
          bubbleOn(true);
          var body = document.getElementById('bd-dami-text');
          if (body) body.textContent = DAMI._lastText;   // 재타이핑 없이 복원
        }
      }
      last = state;
    }, 180);
  })();

  /* ══════════════ 스포트라이트 ══════════════ */
  function spotEls() {
    var s = document.getElementById('bd-spot');
    if (!s) {
      s = document.createElement('div'); s.id = 'bd-spot';
      s.innerHTML = '<div id="bd-spot-hole"></div><div id="bd-spot-hand">👆</div>';
      document.body.appendChild(s);
    }
    return { wrap: s, hole: s.querySelector('#bd-spot-hole'), hand: s.querySelector('#bd-spot-hand') };
  }
  function clearSpot() {
    var s = document.getElementById('bd-spot'); if (s) s.remove();
    var b = document.getElementById('bd-spot-block'); if (b) b.remove();
  }
  /** rect 강조 + 강조 밖 입력 차단 */
  function spotlight(rect, opts) {
    opts = opts || {};
    var e = spotEls();
    /* (v320) 증강 선택 중에는 스포트라이트를 겹치지 않는다 */
    try{
      var __aug = document.getElementById('bd-aug-overlay');
      if (__aug && __aug.offsetHeight) { e.wrap.style.display = 'none'; return null; }
    }catch(eA){}
    if (!rect) { e.wrap.style.display = 'none'; return null; }
    e.wrap.style.display = '';
    var pad = opts.pad == null ? 8 : opts.pad;
    /* (v369) UI 배율(v353 body zoom, 자동 0.8~1.3)이 걸리면 화면 좌표(rect)를 배율 적용된 body 안 px 로 그대로 넣어
       강조 사각형이 (1-zoom) 만큼 좌상단으로 밀렸다(QA ISSUE-03). 좌표를 zoom 으로 나눠 보정한다. */
    var z = 1; try{ z = parseFloat(getComputedStyle(document.body).zoom) || 1; if (!(z > 0)) z = 1; }catch(eZ){}
    e.hole.style.left = ((rect.left - pad) / z) + 'px';
    e.hole.style.top = ((rect.top - pad) / z) + 'px';
    e.hole.style.width = ((rect.width + pad * 2) / z) + 'px';
    e.hole.style.height = ((rect.height + pad * 2) / z) + 'px';
    e.hand.style.left = ((rect.left + rect.width / 2 - 15) / z) + 'px';
    e.hand.style.top = ((rect.top + rect.height + 10) / z) + 'px';
    return rect;
  }
  function blockOutside(rect) {
    var b = document.getElementById('bd-spot-block');
    if (!b) {
      b = document.createElement('div'); b.id = 'bd-spot-block';
      document.body.appendChild(b);
      ['pointerdown', 'pointerup', 'click', 'mousedown', 'mouseup'].forEach(function (ev) {
        b.addEventListener(ev, function (e) {
          var r = b._rect;
          if (r && e.clientX >= r.left - 8 && e.clientX <= r.right + 8
            && e.clientY >= r.top - 8 && e.clientY <= r.bottom + 8) {
            // 구멍 안쪽 클릭은 통과시킨다
            b.style.pointerEvents = 'none';
            var t = document.elementFromPoint(e.clientX, e.clientY);
            b.style.pointerEvents = '';
            if (t && ev === 'click') t.click();
            return;
          }
          e.stopPropagation(); e.preventDefault();
        }, true);
      });
    }
    b._rect = rect;
    b.style.pointerEvents = rect ? '' : 'none';
  }

  /* ══════════════ 이벤트 버스 ══════════════ */
  var listeners = {};
  function emit(name, data) {
    (listeners[name] || []).slice().forEach(function (fn) { try { fn(data); } catch (e) { } });
  }
  function on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); }
  function off(name, fn) {
    if (!listeners[name]) return;
    listeners[name] = listeners[name].filter(function (f) { return f !== fn; });
  }

  /* ══════════════ 대화·컷신 감지 (겹침 방지) ══════════════ */
  function visible(id) {
    var e = document.getElementById(id);
    if (!e) return false;
    var cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    return e.offsetHeight > 0;
  }
  /** 다른 대화창·컷신이 화면을 쓰고 있는가 */
  function sceneBusy() {
    try { if (window.__bdSceneActive) return true; } catch (e) { }
    return visible('dialogue-box') || visible('bd-dialog');
  }
  window.BD_TUTOR_sceneBusy = sceneBusy;

  /* ══════════════ 스텝 러너 ══════════════ */
  var S = { steps: null, i: -1, running: false, cleanup: null, raf: 0, paused: false };

  /* (v240d) 전투 튜토리얼 핫키 게이트 — 안내 중 아무 키나 눌러 진행이 꼬이던 문제.
     스텝에 keys:['q'] 처럼 허용 키를 명시하면 그 키만 게임으로 전달된다.
     keys:'all' 이면 전부 허용. 필드 구간(비전투)은 게이트가 손대지 않는다.
     전투 단축키(window 버블)보다 먼저 도는 document 캡처 단계라 확실히 선점한다. */
  document.addEventListener('keydown', function (e) {
    if (!S.running) return;
    if (!(window.HSR && HSR.active)) return;
    var step = S.steps && S.steps[S.i];
    var allow = step && step.keys;
    if (allow === 'all') return;
    var k = (e.key || '').toLowerCase();
    if (['q', 'e', 'i', '1', 'escape', ' '].indexOf(k) < 0) return;
    if (allow && allow.indexOf(k) >= 0) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
  }, true);
  /* (v277) 전투 튜토리얼 클릭 게이트 — 키 게이트와 같은 원칙을 마우스·터치에 적용.
     안내 스텝(keys 미지정)에서는 전투 버튼(.hsr-act) 클릭 전부 차단 — 특히 '도망' 설명 중
     눌러서 나가버리는 사고 방지. 실습 스텝은 강조된 그 버튼만 허용. keys:'all'은 전부 허용. */
  ['click', 'pointerdown', 'touchstart'].forEach(function (evName) {
    document.addEventListener(evName, function (e) {
      try {
        if (!S.running) return;
        if (!(window.HSR && HSR.active)) return;
        var btn = e.target && e.target.closest ? e.target.closest('.hsr-act') : null;
        if (!btn) return;   // 전투 액션 버튼이 아니면 관여하지 않는다 (가이드 UI 등)
        var step = S.steps && S.steps[S.i];
        if (!step) return;
        if (step.keys === 'all') return;
        var ok = false;
        if (step.keys && step.target && typeof step.target === 'string') {
          try { if (btn.matches(step.target) || btn.closest(step.target)) ok = true; } catch (e2) { }
        }
        if (!ok) {
          e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
          try {
            btn.style.transition = 'transform .1s';
            btn.style.transform = 'translateX(3px)';
            setTimeout(function () { btn.style.transform = ''; }, 110);
          } catch (e3) { }
        }
      } catch (eG) { }
    }, true);
  });

  /** (v240d) 전투 핫키 핸들러(window 캡처)가 직접 물어보는 게이트 판정 */
  window.BD_TUTOR_keyBlocked = function (e) {
    if (!S.running) return false;
    if (!(window.HSR && HSR.active)) return false;
    var step = S.steps && S.steps[S.i];
    var allow = step && step.keys;
    if (allow === 'all') return false;
    var k = ((e && e.key) || '').toLowerCase();
    if (['q', 'e', 'i', '1', 'escape', ' '].indexOf(k) < 0) return false;
    return !(allow && allow.indexOf(k) >= 0);
  };

  function resolveTarget(step) {
    if (!step.target) return null;
    if (typeof step.target === 'function') { try { return step.target(); } catch (e) { return null; } }
    if (typeof step.target === 'string') {
      // "obj:이름표" → 맵 오브젝트 (화면 좌표 변환은 게임 쪽 헬퍼에 위임)
      if (step.target.indexOf('obj:') === 0) {
        var id = step.target.slice(4);
        try { return window.BD_screenRectOfObject ? window.BD_screenRectOfObject(id) : null; }
        catch (e) { return null; }
      }
      var el = document.querySelector(step.target);
      if (!el) return null;
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      return r;
    }
    return null;
  }

  function follow() {
    if (!S.running) return;
    // (v239) 다른 대화창이 떠 있으면 담이는 조용히 물러난다 — 겹침 방지
    var busy = sceneBusy();
    if (busy !== S.paused) {
      S.paused = busy;
      var sp = document.getElementById('bd-spot');
      var blk = document.getElementById('bd-spot-block');
      if (sp) sp.style.display = busy ? 'none' : '';
      if (blk) blk.style.pointerEvents = busy ? 'none' : '';
    }
    if (S.paused) { S.raf = requestAnimationFrame(follow); return; }
    // (v239) 조사 선택창이 열려 있으면 차단막을 비활성 — 선택지를 못 누르는 사고 방지
    try {
      var _blk = document.getElementById('bd-spot-block');
      if (_blk && window.BD_choiceOpen && window.BD_choiceOpen()) _blk.style.pointerEvents = 'none';
    } catch (e) { }
    var step = S.steps[S.i];
    /* (v369) 표시 중인 전투 전용 스텝도 전투가 끝나면 즉시 넘긴다 (finish/augment 제외 — 자체 조건으로 진행) */
    try {
      if (step && !(window.HSR && HSR.active) && { bars:1, weak:1, card:1, ring:1, judge:1, enemyturn:1, item:1, item_use:1, item_watch:1, skillbtn:1, flee:1 }[step.id]) {
        if (!S.__endSkipAt || Date.now() - S.__endSkipAt > 300) { S.__endSkipAt = Date.now(); next(); }
        S.raf = requestAnimationFrame(follow); return;
      }
    } catch (eF) { }
    if (step) {
      var rect = resolveTarget(step);
      spotlight(rect, step);
      blockOutside(step.block === false ? null : rect);
      // (v239) 담이는 좌하단 고정이라 배너 위치 전환이 필요 없어졌다
    }
    S.raf = requestAnimationFrame(follow);
  }

  function teardownStep() {
    if (S.cleanup) { try { S.cleanup(); } catch (e) { } S.cleanup = null; }
  }

  function next() {
    teardownStep();
    S.i++;
    if (!S.steps || S.i >= S.steps.length) { finish(); return; }
    var step = S.steps[S.i];
    window.__bdTutStepId = step.id || '';   /* (v315) 조사 잠금 판정용 현재 스텝 노출 */
    /* (v369) 전투 전용 스텝은 전투가 이미 끝났으면 건너뛴다 — 빠르게 이겨 버리면 남은 안내(스킬 카드·물러나기·마무리)가
       각 3.4초씩 필드에서 계속 재생되며 이후 대화를 방해했다. augment 스텝은 증강 창이 없으면 건너뛴다. */
    try {
      var __battleOnly = { bars:1, weak:1, card:1, ring:1, judge:1, enemyturn:1, item:1, item_use:1, item_watch:1, skillbtn:1, flee:1, finish:1 };
      var __inBattle = !!(window.HSR && HSR.active);
      if (__battleOnly[step.id] && !__inBattle) { next(); return; }
      if (step.id === 'augment' && !document.getElementById('bd-aug-overlay')) { next(); return; }
    } catch (e0) { }
    if (step.skipIf) { try { if (step.skipIf()) { next(); return; } } catch (e) { } }

    DAMI.show(step.text, { face: step.face || 'base', channel: 'tut' });   /* (v374) 튜토 채널 — 조정자(0239)가 다른 발화를 보류 */
    try { if (step.onEnter) step.onEnter(); } catch (e) { }

    var advanced = false;
    function advance() {
      if (advanced) return;
      if (sceneBusy()) return;              // (v239) 대화 중 입력은 튜토리얼 진행으로 치지 않는다
      advanced = true;
      setTimeout(next, step.delayAfter == null ? 450 : step.delayAfter);
    }
    // 폴백 타이머는 대화가 끝난 뒤부터 세도록 지연 시작
    function armDelay(ms, fn) {
      var t0 = Date.now(), acc = 0;
      var iv = setInterval(function () {
        if (!sceneBusy()) acc += 120;
        if (acc >= ms) { clearInterval(iv); fn(); }
      }, 120);
      return iv;
    }

    var timers = [], handlers = [];
    var w = step.waitFor || { delay: 2500 };

    if (w.delay != null) {
      timers.push(armDelay(w.delay, advance));
    }
    if (w.event) {
      var h = function (d) {
        if (w.match && !w.match(d)) return;
        advance();
      };
      on(w.event, h); handlers.push([w.event, h]);
    }
    if (w.key) {
      var kh = function (e) {
        var keys = Array.isArray(w.key) ? w.key : [w.key];
        if (keys.some(function (k) { return (e.key || '').toLowerCase() === k.toLowerCase(); })) advance();
      };
      document.addEventListener('keydown', kh, true);
      handlers.push(['__key', kh]);
    }
    if (w.clickTarget) {
      var ch = function () { advance(); };
      var poll = setInterval(function () {
        var r = resolveTarget(step);
        if (!r) return;
        var el = typeof step.target === 'string' && step.target.indexOf('obj:') !== 0
          ? document.querySelector(step.target) : null;
        if (el && !el._tutBound) { el._tutBound = true; el.addEventListener('click', ch, true); }
      }, 150);
      timers.push(poll);
      handlers.push(['__clickpoll', ch]);
    }
    if (w.predicate) {
      var pi = setInterval(function () {
        try { if (w.predicate()) advance(); } catch (e) { }
      }, 200);
      timers.push(pi);
    }

    S.cleanup = function () {
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      handlers.forEach(function (pair) {
        if (pair[0] === '__key') document.removeEventListener('keydown', pair[1], true);
        else if (pair[0] === '__clickpoll') { /* 폴링만 정리 */ }
        else off(pair[0], pair[1]);
      });
    };
  }

  function finish() {
    S.running = false;
    S.tag = null;   // (v281) 태그 정리
    cancelAnimationFrame(S.raf);
    teardownStep();
    clearSpot();
    DAMI.hide();
    try { localStorage.setItem('bd_dami_tutorial_done', '1'); } catch (e) { }
    // (v38) 전투 키 병행 마킹 철회 — 필드 스텝이 전투 진입 전에 타임아웃으로 소진돼도
    //  finish가 전투 키를 잠가 첫 전투 튜토가 영영 안 뜨던 문제. 마킹은 전투 진입 훅이 전담.
    emit('tutorial_finished', {});
  }

  window.BD_TUTOR = {
    on: on, off: off, emit: emit,
    isRunning: function () { return !!S.running; },
    done: function () { try { return localStorage.getItem('bd_dami_tutorial_done') === '1'; } catch (e) { return false; } },
    reset: function () { try { localStorage.removeItem('bd_dami_tutorial_done'); } catch (e) { } try { if (window.BD) BD._damiSeen = []; } catch (e) { } },
    /** 스텝 배열 실행. startId 를 주면 그 스텝부터 시작한다.
        (v281) tag: 실행 주체 식별용 — 'dami_main'(필드·전투 메인 튜토)과
        짧은 담이 안내(상점 안내 등)를 구분해, 전투 진입 훅이 기다릴지 양보할지 판단한다 */
    run: function (steps, startId, tag) {
      if (S.running) return false;
      var arr = steps || [];
      if (startId) {
        var k = arr.findIndex(function (s) { return s.id === startId; });
        if (k > 0) arr = arr.slice(k);
      }
      S.steps = arr; S.i = -1; S.running = true; S.tag = tag || null;
      follow(); next();
      return true;
    },
    /** (v281) 현재 실행 중인 튜토리얼의 태그 (없으면 null) */
    runningTag: function () { return S.running ? (S.tag || null) : null; },
    /** (v388) 이번 실행이 그 스텝까지 왔는가 — 단계 게이트(0252)가 «안내 전 선행 조작»을 막는 기준.
        건너뛴 스텝도 지나간 것으로 친다(S.i 가 이미 넘어갔으므로). */
    reached: function (stepId) {
      try {
        if (!S.running || !S.steps) return false;
        var k = S.steps.findIndex(function (s) { return s.id === stepId; });
        return k >= 0 && S.i >= k;
      } catch (e) { return false; }
    },
    /** (v388) 이번 실행에 그 스텝이 들어 있는가 (지도 튜토처럼 없는 실행과 구분) */
    hasStep: function (stepId) {
      try { return !!(S.steps && S.steps.some(function (s) { return s.id === stepId; })); }
      catch (e) { return false; }
    },
    skip: function () {
      if (!S.running) return;
      // 스킵해도 링·가드 안내는 1회 보장
      var must = (S.steps || []).filter(function (s) { return s.must && !DAMI.seen(s.id); });
      finish();
      if (must.length) {
        must.forEach(function (s) {
          DAMI.markSeen(s.id);
        });
      }
      try { if (typeof bdToast === 'function' && !window.__bdSilentSkip) bdToast('튜토리얼을 건너뛰었어요 — 설정에서 다시 볼 수 있어요'); } catch (e) { }
    },
    /** 현재 스텝 강제 진행 (디버그) */
    force: function () { if (S.running) next(); }
  };
})();

/* ══════════════════════════════════════════════════════════════════
   (v239) 담이 튜토리얼 — 스텝 정의 + 게임 이벤트 연결
   원본 전투 코드를 더 건드리지 않고, 기존 전역 함수를 감싸서 이벤트를 낸다.
   모든 스텝에는 폴백 타임아웃이 있어 조건이 안 걸려도 멈추지 않는다.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function T() { return window.BD_TUTOR; }
  function emit(n, d) { try { T().emit(n, d); } catch (e) { } }

  /* ══════════════ 게임 이벤트 연결 (래핑) ══════════════ */
  function wireEvents() {
    // 미니게임 시작·종료
    try {
      if (window.BD_MG && !BD_MG._tutWrapped) {
        BD_MG._tutWrapped = true;
        var origRun = BD_MG.run.bind(BD_MG);
        BD_MG.run = function (type, opts, cb) {
          emit('minigame_shown', { type: type });
          return origRun(type, opts, function (mult, grade) {
            emit('minigame_done', { type: type, mult: mult, grade: grade });
            if (cb) cb(mult, grade);
          });
        };
      }
    } catch (e) { }

    // 가드 창 열림
    try {
      if (window.BD_GUARD && !BD_GUARD._tutWrapped) {
        BD_GUARD._tutWrapped = true;
        var origArm = BD_GUARD.arm.bind(BD_GUARD);
        BD_GUARD.arm = function (ms) { emit('guard_window', { ms: ms }); return origArm(ms); };
      }
    } catch (e) { }

    // 증강 드래프트 열림
    try {
      if (window.BD_AUG && !BD_AUG._tutWrapped) {
        BD_AUG._tutWrapped = true;
        var origDraft = BD_AUG.draft.bind(BD_AUG);
        BD_AUG.draft = function (done) {
          emit('augment_open', {});
          return origDraft(done);
        };
      }
    } catch (e) { }

    // 전투 시작 / 승리 감시
    if (!window.__bdTutWatch) {
      window.__bdTutWatch = true;
      var wasActive = false, wasResult = false;
      setInterval(function () {
        var act = !!(window.HSR && HSR.active);
        if (act && !wasActive) {
          emit('battle_start', {});
          try { if (window.BD_DAMI) BD_DAMI.resetBattleQuota(); } catch (e) { }
          // (v239) 첫 전투인데 튜토리얼을 못 본 상태면 전투 구간부터 안내한다.
          //  프롤로그를 이미 끝낸 세이브에서는 markDone() 이 다시 불리지 않아
          //  전투 튜토리얼이 통째로 안 뜨던 문제.
          try {
            // (v34) 전투 튜토리얼은 전용 키로 1회만 — 필드 튜토와 키를 공유해
            //  (완주 못 하면 다음 전투마다 재등장 / 필드 완주자는 영영 못 보는) 문제 분리
            var __btDone = false;
            try { __btDone = localStorage.getItem('bd_battle_tutorial_done') === '1'; } catch (eB) { }
            // (v35) 필드 튜토리얼이 실행 중이면 그 흐름이 전투 스텝을 소화한다 — 이때도 마킹해
            //  다음 전투에서 전투 튜토가 또 뜨던 문제 차단
            // (v73) 필드 튜토가 실행 중이라고 해서 전투 튜토를 '봤음'으로 마킹하지 않는다 —
            //  오프닝을 건너뛴 플레이어가 전투 튜토리얼을 영영 못 보던 문제(진행 흐름 끊김)
            //  동시 실행만 피하고, 필드 튜토가 끝난 뒤 이 전투에서 이어서 안내한다.
            // (v105) 튜토리얼 2중 실행 수리
            //  필드 튜토는 'hazard' 스텝에서 전투 시작을 기다렸다가 스스로 bars 단계로 넘어간다.
            // (v281) '건너뛰기' → '기다렸다가 시작'으로 변경 —
            //  담이 전용 대사(상점 안내 등 짧은 안내)가 재생 중일 때 전투에 들어가면
            //  isRunning()에 걸려 전투 튜토리얼이 그 전투에서 통째로 안 뜨던 문제.
            //  · 메인 필드 튜토(dami_main)가 돌고 있으면: 그 흐름이 전투 스텝을 직접
            //    소화하므로 아무것도 하지 않는다 (v105 원칙 유지).
            //  · 그 외의 대사·안내가 돌고 있으면: 끝날 때까지 기다렸다가 이 전투에서 시작.
            //  · 기다리는 중 전투가 끝나면 포기 — 완료 마킹을 안 했으므로 다음 전투에서 재시도.
            if (!__btDone && window.BD_DAMI_STEPS) {
              setTimeout(function () {
                var __btWait = setInterval(function () {
                  try {
                    if (!(window.HSR && HSR.active)) { clearInterval(__btWait); return; }
                    if (window.BD_TUTOR.isRunning()) {
                      if (window.BD_TUTOR.runningTag && BD_TUTOR.runningTag() === 'dami_main') { clearInterval(__btWait); return; }
                      return;   // 짧은 담이 대사 — 끝날 때까지 대기
                    }
                    var __busy = !!window.__bdDamiIntroBusy || !!window.__bdDamiOpeningBusy;
                    try { var __dov = document.getElementById('dialogue-overlay'); if (__dov && __dov.offsetHeight) __busy = true; } catch (eD) { }
                    try { if (window.BD_choiceOpen && BD_choiceOpen()) __busy = true; } catch (eC) { }
                    if (__busy) return;   // 담이·일반 대화가 끝날 때까지 대기
                    clearInterval(__btWait);
                    console.log('[담이] 전투 구간 튜토리얼 시작');
                    try { localStorage.setItem('bd_battle_tutorial_done', '1'); } catch (eB2) { }
                    window.BD_TUTOR.run(window.BD_DAMI_STEPS(), 'bars', 'dami_main');
                  } catch (e) { clearInterval(__btWait); }
                }, 450);
              }, 900);
            }
            // (v239) 새로 배운 스킬이 있으면 이 전투에서 소개 + 강제 학습
            else if (window.BD && BD._pendingSkillIntro) {
              setTimeout(function () {
                if (window.HSR && HSR.active && !window.BD_TUTOR.isRunning()) {
                  console.log('[담이] 새 스킬 튜토리얼:', BD._pendingSkillIntro);
                  window.BD_runSkillIntro(BD._pendingSkillIntro);
                }
              }, 1400);
            }
          } catch (e) { }
        }
        if (!act && wasActive) emit('battle_end', {});
        wasActive = act;
        // (v239) 승리 결과창 폐지 — 증강 드래프트가 뜨거나 전투가 닫히면 '결과'로 본다
        var r = document.getElementById('hsr-result');
        var vis = !!(r && getComputedStyle(r).display !== 'none')
               || !!document.getElementById('bd-aug-overlay')
               || (!act && wasActive);
        if (vis && !wasResult) emit('battle_result', {});
        wasResult = vis;
      }, 220);
    }
  }

  /* ══════════════ 12스텝 ══════════════ */
  function steps() {
    return [
      { id: 'move', face: 'base',
        target: '#bd-keybar', block: false,   /* (v293) 강조+반투명 배경 */
        text: '이제 밖으로 나왔어요! W A S D 나 방향키로 움직여 봐요',
        // 프롤로그에서 이미 걸어봤다면 통째로 건너뛴다 (인사도 각성 때 끝냈다)
        skipIf: function () {
          try {
            if (window.__bdDamiMoved) return true;
            return localStorage.getItem('bd_tut2_done') === '1';
          } catch (e) { return false; }
        },
        waitFor: {
          key: ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'],
          predicate: function () { try { return !!window.__bdDamiMoved; } catch (e) { return false; } },
          delay: 9000
        },
        delayAfter: 250 },

      { id: 'guide', face: 'base',
        target: '#bd-quest-hud', block: false,   /* (v293) 강조+반투명 배경 */
        text: '왼쪽 위 「추적 중인 임무」에 지금 할 일이 떠 있어요. 어디부터 갈지는 자유!',
        waitFor: { delay: 3400 }, delayAfter: 400 },   // (v100) 진행 속도 완화

      { id: 'hazard', face: 'surprise',
        target: 'obj:방치된 쓰레기', block: false,   /* (v293) 월드 오브젝트 스포트라이트 */
        // (v66) 시간이 지나면 다음 안내로 넘어가 '전투에 들어가지도 않았는데 전투 설명이 흐르던' 문제 —
        //  전투가 실제로 시작될 때까지 기다린다 (타임아웃 사실상 없음)
        text: '앗, 저기 쓰레기가 방치돼 있어요. 가까이 가볼까요?',
        /* (v315) 이미 전투 중이거나 정화됐다면 건너뛴다 — 러시 시 영구 대기 방지 */
        skipIf: function () { try { return !!(window.HSR && HSR.active) || !!(BD.purified && BD.purified.ow212_trash_1); } catch (e) { return false; } },
        waitFor: { event: 'battle_start', delay: 3600000 } },

      { id: 'investigate', face: 'base',
        target: 'obj:방치된 쓰레기', block: false,
        text: '제가 반응하고 있어요! F 키를 눌러 조사해 주세요',
        skipIf: function () { try { return !!(window.HSR && HSR.active) || !!(BD.purified && BD.purified.ow212_trash_1); } catch (e) { return false; } },   /* (v315) */
        // 선택창이 뜨면 다음 단계로 (F 만 눌러도 넘어가면 선택창 안내를 놓친다)
        waitFor: {
          event: 'battle_start',
          predicate: function () { try { return !!(window.BD_choiceOpen && BD_choiceOpen()); } catch (e) { return false; } },
          delay: 3600000   // (v66) 조사 전 자동 진행 금지
        } },

      { id: 'choice', face: 'surprise', block: false, target: '#bd-ch-investigate',
        text: '「조사한다」를 고르면 정화가 시작돼요!',
        skipIf: function () { try { return !!(window.HSR && HSR.active) || !!(BD.purified && BD.purified.ow212_trash_1); } catch (e) { return false; } },   /* (v315) */
        waitFor: { event: 'battle_start', delay: 3600000 } },   // (v66) 전투 시작까지 대기

      /* ── (v240d) 단계 학습: 안내 스텝은 입력을 잠그고(keys 미지정),
             실습 스텝은 해당 조작만 허용(keys)해 "하나 배우고 → 해보고"로 진행 ── */
      { id: 'bars', face: 'base', target: '#hsr-u-enemy',
        text: '빨간 바가 오염도예요. 0으로 만들면 정화 완료!',
        // (v66) 전투 화면에서만 흐르도록 — 필드에서 시간만 지나 설명이 소모되던 문제
        waitFor: { predicate: function(){ try{ return !!(window.HSR && HSR.active); }catch(e){ return false; } }, delay: 3600000 },
        delayAfter: 3800 },   // (v100) 설명을 읽을 시간 확보 — 문구가 스쳐 지나가던 문제

      { id: 'weak', face: 'base', target: '#hsr-u-enemy',   // (v35) 약점 행만 뚫으면 HP UI와 어긋나 보임 — 패널 전체 강조
        text: '이름 아래 마크가 약점이에요. 맞는 속성으로 때리면 피해가 1.5배!',
        // (v75) 설명이 전투 진행과 어긋나지 않게 — 내 턴이 돌아온 뒤에만 다음으로 넘어간다
        waitFor: {
          predicate: (function () {
            var t0 = Date.now();
            return function () {
              if (Date.now() - t0 < 4000) return false;   // (v100) 최소 노출 시간 확대
              try { return !(window.HSR && HSR.active) || HSR.state === 'player'; } catch (e) { return true; }
            };
          })(),
          delay: 12000
        } },

      /* 실습 ①: 정화 스티커 — Q 또는 강조된 버튼만 허용 */
      { id: 'card', face: 'base', target: '.hsr-act.hsr-basic', keys: ['q'],
        text: '자, 직접 해봐요! 「정화 스티커」를 눌러요 (Q)',
        waitFor: { event: 'minigame_shown', delay: 22000 } },

      /* 실습 ②: 타이밍 링 — Space 만 */
      { id: 'ring', face: 'surprise', must: true, block: false, target: '#bd-mg', keys: [' '],
        text: '링이 하얀 원에 딱 겹치는 순간! 그때 Space를 눌러요',
        waitFor: { event: 'minigame_done', delay: 12000 } },

      { id: 'judge', face: 'proud',
        text: '잘했어요! 딱 맞으면 PERFECT 1.5배, 놓쳐도 절반은 들어가요',
        // (v75) 데미지 연출이 흐르는 동안 최소 1.6초는 유지하고, 전투가 다음 단계로 넘어가면 곧바로 진행
        waitFor: {
          predicate: (function () {
            var t0 = Date.now();
            return function () {
              if (Date.now() - t0 < 1600) return false;
              try { return !(window.HSR && HSR.active) || HSR.state !== 'anim'; } catch (e) { return true; }
            };
          })(),
          delay: 6000
        } },

      { id: 'enemyturn', face: 'worry', block: false,
        text: '이제 쓰레기 차례예요. 공격을 받으면 체력이 줄어요 — 잘 보고 있어요!',
        // 적 행동이 실제로 끝나 내 턴('player')이 돌아올 때까지 + 최소 1.8초는 보여준다
        waitFor: {
          predicate: (function () {
            var t0 = Date.now();
            return function () {
              if (Date.now() - t0 < 1800) return false;
              try { return window.HSR && HSR.state === 'player'; } catch (e) { return false; }
            };
          })(),
          delay: 7000
        },
        delayAfter: 600 },

      /* 실습 ③: 간식 열기 — 적에게 맞아 HP가 줄어든 직후 */
      { id: 'item', face: 'worry', target: '.hsr-act.hsr-item', block: false,   /* (v322) 안내만 — 강제 잠금 해제 */
        text: '선생님이 주신 간식이 있어요! I 로 열면 HP를 회복할 수 있어요 — 지금은 안 먹어도 괜찮아요',
        onEnter: function () {
          // (v240f) 안전망: 어떤 경로로든 간식이 없으면 담이가 챙겨준다
          try {
            if (window.BD) { BD.items = BD.items || {};
              if ((BD.items.snack||0) < 1) { BD.items.snack = 1;
                if (typeof bdToast === 'function') bdToast('🍪 선생님이 챙겨 주신 간식이에요!'); } }
          } catch (e) { }
        },
        waitFor: {
          predicate: function () { var m = document.getElementById('hsr-item-menu'); return !!(m && m.offsetHeight); },
          delay: 6500   /* (v322) 열지 않으면 잠시 후 자동 진행 */
        } },

      /* 실습 ③-2: 실제로 먹어본다 — 간식 버튼에만 스포트라이트(다른 곳 클릭 차단) */
      { id: 'item_use', face: 'base',
        target: function () {
          var b = document.querySelector('#hsr-item-menu .hsr-item-btn');
          if (!b) return null; var r = b.getBoundingClientRect();
          return (r.width || r.height) ? r : null;
        },
        text: '🍪 간식을 눌러 먹어요 — HP가 40 회복돼요!',
        skipIf: function () {
          // 메뉴가 안 열렸거나 간식이 없으면(이론상 없음) 건너뛴다
          var m = document.getElementById('hsr-item-menu');
          if (!m || !m.offsetHeight) return true;
          return !((window.BD && BD.items && BD.items.snack) > 0);
        },
        onEnter: function () {
          try { window.__bdTutSnack0 = (window.BD && BD.items && BD.items.snack) || 0; } catch (e) { }
        },
        waitFor: {
          predicate: function () {
            try {
              var used = ((window.BD && BD.items && BD.items.snack) || 0) < (window.__bdTutSnack0 || 0);
              /* (v320) 안 먹고 메뉴를 닫으면 바로 다음으로 — 닫힌 메뉴를 향해 입력을 잠근 채 기다리던 문제 */
              var m = document.getElementById('hsr-item-menu');
              var closed = !(m && m.offsetHeight);
              return used || closed;
            }
            catch (e) { return false; }
          },
          delay: 18000
        },
        delayAfter: 300 },

      /* 실습 ③-3: 회복 확인 + 아이템도 한 턴 — 적의 반격을 지켜본다 */
      { id: 'item_watch', face: 'proud', block: false,
        skipIf: function () { try { return ((window.BD && BD.items && BD.items.snack) || 0) >= (window.__bdTutSnack0 || 0); } catch (e) { return false; } },   /* (v320) 안 먹었으면 건너뛴다 */
        text: '냠— HP가 찼죠? 아이템도 한 턴을 써요. 이번엔 쓰레기 차례!',
        waitFor: {
          predicate: (function () {
            var t0 = Date.now();
            return function () {
              if (Date.now() - t0 < 2000) return false;
              try { return window.HSR && HSR.state === 'player'; } catch (e) { return false; }
            };
          })(),
          delay: 8000
        },
        delayAfter: 500 },

      { id: 'skillbtn', face: 'base', target: '.hsr-act.hsr-skill',
        text: '새 스킬을 얻으면 여기 카드로 쌓여요. 카드마다 쓸 수 있는 횟수가 있어요!',
        waitFor: { delay: 3400 } },

      { id: 'flee', face: 'base', target: '.hsr-act.hsr-flee',
        text: '너무 힘들면 물러나도 괜찮아요 (ESC). 안전이 제일 중요하니까요',
        waitFor: { delay: 3400 } },

      { id: 'finish', face: 'base', keys: 'all',
        text: '배울 건 다 배웠어요. 이제 자유롭게 — 오염도를 0으로 만들어 주세요!',
        waitFor: {
          event: 'battle_result',
          // (v239) 결과창을 폐지했으므로 증강 드래프트·전투 종료로도 넘어간다
          predicate: function () {
            try { return !!document.getElementById('bd-aug-overlay') || !(window.HSR && HSR.active); }
            catch (e) { return false; }
          },
          delay: 60000
        } },

      { id: 'augment', face: 'proud', target: '#bd-aug-overlay', block: false, keys: 'all',
        text: '정화의 힘이 남았어요. 이걸로 저를 강화할 수 있어요 — 하나 골라 주세요!',
        waitFor: { predicate: function () { return !document.getElementById('bd-aug-overlay'); }, delay: 30000 } },
    ];
  }

  /* ══════════════ 분산 튜토리얼 (스킬 획득·상황별) ══════════════ */
  var SKILL_TIPS = {
    fan: ['dami_mg_fan', '노트로 부채질! 이건 연타예요. 1.2초 동안 최대한 빠르게 눌러요!'],
    wash: ['dami_mg_wash', '물줄기를 얼룩에 계속 대고 있어야 해요. 누르면 올라가고, 떼면 내려가요'],
    light: ['dami_mg_light', '빛이 적 주위를 빙 돌아요. 좌우 키로 각도를 맞춰서 계속 비춰 주세요!'],
    cheer: ['dami_mg_cheer', '「봉! 담! 화이팅!」 세 박자에 맞춰 눌러요. 셋 다 맞추면 특별해요!']
  };

  window.BD_DAMI_TIPS = {
    /** 스킬을 처음 얻었을 때 */
    onSkillLearned: function (skillId) {
      var tip = SKILL_TIPS[skillId];
      if (tip) window.BD_DAMI.show(tip[1], { face: 'proud', once: tip[0] });
      // 두 번째 스킬이 생긴 시점에만 PP·상성 설명
      try {
        var n = (window.BD && BD.unlockedSkills) ? BD.unlockedSkills.length : 0;
        if (n === 2) {
          setTimeout(function () {
            window.BD_DAMI.show('카드 아래 점 세 개 보이죠? 한 판에서 쓸 수 있는 횟수예요. 다 쓰면 스티커로 버텨요',
              { face: 'base', once: 'dami_pp' });
          }, 4200);
          setTimeout(function () {
            window.BD_DAMI.show('카드에 ⬆ 표시가 있으면 특효, ⚠ 면 역효과예요. 잘 보고 골라요!',
              { face: 'base', once: 'dami_match' });
          }, 9000);
        }
      } catch (e) { }
    },
    /** 첫 오답 */
    onWrongHit: function (msg) {
      window.BD_DAMI.sayInBattle('dami_wrong', '앗! 그건 오히려 위험해요 — ' + (msg || '다른 방법을 찾아봐요'), 'worry');
    },
    /** 약점 + PERFECT 환급 안내 */
    onRefund: function () {
      window.BD_DAMI.sayInBattle('dami_refund', '약점을 정확히 맞히면 횟수를 돌려받아요 — 타이밍이 곧 실력이에요!', 'proud');
    },
    onBreak: function () { /* (v239) 인성·브레이크 폐지 */ },
    /** 엘리트 첫 조우 */
    onElite: function (e) {
      var msg = (e && e.id === 'shifty')
        ? '변덕스러운 상대예요! 약점 마크가 바뀌면 스킬도 바꿔 주세요'
        : '평소보다 강한 개체예요! 약점 마크를 잘 보고 침착하게!';
      window.BD_DAMI.sayInBattle('dami_elite_' + (e ? e.id : 'x'), msg, 'surprise');
    }
  };

  /* ══════════════ 시작 ══════════════ */
  window.BD_startDamiTutorial = function (force) {
    try{ if(window.BD_DAMI && BD_DAMI.wake) BD_DAMI.wake(); }catch(e){}   // (v240c) 이 시점엔 배지 수여 완료
    wireEvents();
    if (!force && window.BD_TUTOR.done()) return false;
    if (window.BD_TUTOR.isRunning()) return false;
    // (v239) 프롤로그 컷신·대화가 완전히 끝난 뒤에 시작한다.
    //  markDone() 은 '광장 도착' 시점이라 그 뒤에 컷신이 더 재생된다.
    var waited = 0;
    var gate = setInterval(function () {
      waited += 250;
      var busy = (window.BD_TUTOR_sceneBusy ? window.BD_TUTOR_sceneBusy() : false)
        || !!window.__bdDamiOpeningBusy || !!window.__bdDamiIntroBusy;   // (v240e) 담이 대사 재생 중 대기
      if (!busy) {
        // 대화가 끝난 뒤에도 0.8초 더 지켜본다 (연속 대사 사이의 빈틈 방지)
        clearInterval(gate);
        setTimeout(function () {
          if ((window.BD_TUTOR_sceneBusy && window.BD_TUTOR_sceneBusy())
            || window.__bdDamiOpeningBusy || window.__bdDamiIntroBusy) {
            window.BD_startDamiTutorial(force); return;    // 아직이면 다시 대기
          }
          /* (v315) 러시 내성 — 이미 첫 쓰레기를 정화했다면 전투 실습 스텝을 걷어낸 축약 안내 */
          var __list = steps();
          try{
            if (window.BD && BD.purified && BD.purified.ow212_trash_1){
              __list = [
                { id: 'rushdone', face: 'base',
                  text: '우와, 벌써 쓰레기를 정화했네요! 몸으로 먼저 배웠어요. 대단해요!',
                  waitFor: { delay: 3400 }, delayAfter: 300 },
                { id: 'guide', face: 'base', target: '#bd-quest-hud', block: false,
                  text: '왼쪽 위 「추적 중인 임무」를 봐요. \u2757 주민의 부탁과 시설 방문으로 지도를 채우면 돼요!',
                  waitFor: { delay: 4600 }, delayAfter: 400 },
              ];
            }
          }catch(eRS){}
          window.BD_TUTOR.run(__list, null, 'dami_main');   // (v281) 메인 튜토 태그
        }, 800);
      }
      if (waited > 180000) clearInterval(gate);            // 3분 넘으면 포기
    }, 250);
    return true;
  };
  window.BD_DAMI_STEPS = steps;

  // (v239) 실제 이동 감지 — 컷신 중 입력은 세지 않는다
  (function watchMove() {
    var keys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
    document.addEventListener('keydown', function (e) {
      if (window.BD_TUTOR_sceneBusy && window.BD_TUTOR_sceneBusy()) return;
      if (keys.indexOf((e.key || '').toLowerCase()) >= 0) window.__bdDamiMoved = true;
    }, true);
  })();

  // 배지 HUD 를 미리 만들어두고, 각성 전까지는 숨겨둔다
  setTimeout(function () {
    try {
      window.BD_DAMI.mount();
      var awakened = false;
      try { awakened = localStorage.getItem('bd_tut2_done') === '1'; } catch (e) { }
      window.BD_DAMI.setVisible(awakened);
    } catch (e) { }
  }, 1200);

  // 부팅 후 이벤트 배선만 미리 걸어둔다 (튜토리얼 시작은 프롤로그가 호출)
  setTimeout(wireEvents, 1500);

  // 설정에서 다시 보기
  /* ══════════════ (v239) 담이 세계관 오프닝 ══════════════
     선생님 VN 컷신 대신, 밖으로 나온 직후 담이가 좌하단에서 말을 건다.
     · 대화창이 뜨지 않으므로 플레이어는 처음부터 자유롭게 움직인다
     · 배지가 왜 말하는지 / 힘이 어디서 오는지 / 무엇을 하면 되는지를 흘린다 */
  /* (v240d) 첫 만남 — 배지 수여식 직후, 배지가 처음 말을 거는 순간 */
  var INTRO = [
    ['저는 담이예요. 이 배지에 깃든 마음이고요', 'base'],
    ['동네를 아끼는 마음들이 오래 모여서, 저처럼 말을 하게 됐대요', 'proud'],
    ['앞으로 잘 부탁해요. 위험한 건 제가 먼저 알려드릴게요!', 'proud'],
    ['우선 제가 가방 안에 잘 들어 있는지, E 키로 가방을 열어서 확인해 볼래요?', 'base'],   // (v34) 다음 행동 가이드
  ];
  /* 바깥 오프닝 — 밖으로 나온 감상 한 줄.
     (v388) 지도 이야기(「내 안에 지도가 있어요」·「같이 기록해 볼래요」·M 키·흑백·다 채우면 스킬)는
     전부 걷어냈다. 바로 뒤에 이어지는 0246 지도 튜토리얼이 실제로 «열어 보고 눌러 보며»
     같은 내용을 가르치기 때문에, 여기서 미리 말하면 플레이어가 두 번 듣게 된다. */
  var OPENING = [
    // (v271) 기획서 §7.5 — 담이 첫 각성 (야외 첫 이동 후 재생)
    ['우와…… 밖으로 나오니까 세상이 훨씬 크게 느껴져요!', 'surprise'],
  ];
  /* (v388) 지도 실습이 끝난 뒤 이어지는 이야기 — 배운 걸 첫 목적지로 연결한다 */
  var OPENING_OUTRO = [
    ['그럼 먼저 바로 이 건물부터 확인해 봐요. 1층과 2층은 봉담와우도서관이고, 우리가 있던 봉담청소년문화의집은 3층이에요.', 'proud'],
  ];
  /** (v240d) 라인 배열을 한 줄씩 재생 (전투 중엔 대기) */
  function playDamiLines(lines, after) {
    var i = 0;
    (function step() {
      // (v240e) 건너뛰기: 남은 줄을 버리고 종료 콜백만 부른다
      if (window.__bdDamiCancelLines) {
        window.__bdDamiCancelLines = false;
        if (after) { try { after(); } catch (e) { } }
        return;
      }
      var __uiBusy = (window.HSR && HSR.active)
        || (window.BD_TUTOR_sceneBusy && window.BD_TUTOR_sceneBusy())
        || (function(){ try{ var c=document.getElementById('bd-place-card'); return !!(c && c.offsetHeight); }catch(e){ return false; } })();
      if (__uiBusy) { setTimeout(step, 700); return; }   // (v27) 전투·대화·장소카드 동안 대기 — 대사 소실 방지
      if (i >= lines.length) { if (after) { try { after(); } catch (e) { } } return; }
      var line = lines[i++];
      try { if (window.BD_DAMI) BD_DAMI.show(line[0], { face: line[1], channel: 'story' }); } catch (e) { }   /* (v374) 이야기 채널 */
      setTimeout(step, Math.max(2600, line[0].length * 85));   // (v35) 라인이 너무 빨리 넘어가 끊겨 보이던 체감 보정
    })();
  }
  /** 첫 만남 재생 (수여식에서 호출). 재생 중엔 다른 담이 안내(damiOnce)가 대사를 덮지 않게 플래그를 든다 */
  window.BD_damiIntro = function (after) {
    try {
      if (window.BD_DAMI && BD_DAMI.seen('dami_intro')) { if (after) after(); return false; }
      if (window.BD_DAMI) BD_DAMI.markSeen('dami_intro');
    } catch (e) { }
    window.__bdDamiIntroBusy = true;
    playDamiLines(INTRO, function () {
      window.__bdDamiIntroBusy = false;
      if (after) { try { after(); } catch (e) { } }
    });
    return true;
  };

  /** 담이 오프닝 재생 (한 줄씩, 자유 이동을 막지 않는다)
      (v388) after — 오프닝이 다 끝난 뒤(또는 이미 봤던 경우 즉시) 호출된다.
      호출자가 이어서 지도 튜토리얼·메인 튜토리얼을 시작할 수 있도록 순서를 보장한다. */
  window.BD_damiOpening = function (force, after) {
    try { if (window.BD_DAMI && BD_DAMI.wake) BD_DAMI.wake(); } catch (e) { }   // (v240c) 오프닝 = 배지가 말을 거는 장면
    try {
      if (!force && window.BD_DAMI && BD_DAMI.seen('dami_opening')) {
        if (after) { try { after(); } catch (e2) { } }
        return false;
      }
      if (window.BD_DAMI) BD_DAMI.markSeen('dami_opening');
    } catch (e) { }
    // (v240e) 오프닝 재생 중엔 필드 튜토리얼이 대사를 덮지 않도록 플래그를 든다
    window.__bdDamiOpeningBusy = true;
    playDamiLines(OPENING, function () {
      window.__bdDamiOpeningBusy = false;
      // 첫 목표 안내는 튜토리얼('hazard' 스텝)이 같은 말을 하므로,
      // 튜토리얼이 이미 끝났거나 건너뛴 경우에만 여기서 짚어준다 (이중 발화 방지)
      setTimeout(function fireGoalTip() {
        if (window.HSR && HSR.active) { setTimeout(fireGoalTip, 900); return; }
        try {
          if (window.BD_TUTOR && (BD_TUTOR.isRunning() || !BD_TUTOR.done())) return;
          if (window.BD_DAMI) BD_DAMI.show('앗, 저기 문화의집 앞에 쓰레기가 쌓여 있어요. 가까이 가서 F 키!', { face: 'surprise' });
        } catch (e) { }
      }, 1400);
      if (after) { try { after(); } catch (e3) { } }
    });
    return true;
  };

  /** (v388) 지도 튜토리얼 직후의 이야기 마무리 — 0246 이 실습을 끝내고 호출한다.
      «지도 보는 법을 배웠으니 이제 이 건물부터» 로 다음 목적지에 연결한다. */
  window.BD_damiOpeningOutro = function (after) {
    try {
      if (window.BD_DAMI && BD_DAMI.seen('dami_opening_outro')) {
        if (after) { try { after(); } catch (e2) { } }
        return false;
      }
      if (window.BD_DAMI) BD_DAMI.markSeen('dami_opening_outro');
    } catch (e) { }
    window.__bdDamiOpeningBusy = true;
    playDamiLines(OPENING_OUTRO, function () {
      window.__bdDamiOpeningBusy = false;
      if (after) { try { after(); } catch (e3) { } }
    });
    return true;
  };

    /* ══════════════ (v239) 융합 궁극기 ══════════════
     최종 보스전에서 4속성(W·G·M·N)을 한 번씩 모두 사용하면
     「모두의 마음」이 해금된다. 해금 후에는 일반 전투에서도 쓸 수 있다. */
  window.BD_checkFusionUnlock = function () {
    try {
      if (!window.HSR || !HSR.active) return false;
      if (window.BD && BD._ultUnlocked) return false;          // 이미 해금
      if (!HSR._isBoss) return false;                          // 보스전에서만 해금
      var used = HSR._elemsUsed || {};
      var need = ['W', 'G', 'M', 'N'];
      for (var i = 0; i < need.length; i++) if (!used[need[i]]) return false;

      BD._ultUnlocked = true;
      try { document.body.classList.add('bd-ult-on'); } catch (e) { }
      try { HSR.ult = 100; HSR.ultReady = true; if (typeof window.BD_refreshUlt === 'function') BD_refreshUlt(); } catch (e) { }
      try { if (typeof window.BD_buildActions === 'function') window.BD_buildActions(); } catch (e) { }
      try { if (typeof bdSave === 'function') bdSave(); } catch (e) { }
      try {
        if (window.BD_DAMI) BD_DAMI.show('배운 정화법이 하나로 모였어요 — 「모두의 마음」! 1번 키로 써 봐요!', { face: 'proud' });
        if (typeof bdToast === 'function') bdToast('🌈 융합 궁극기 「모두의 마음」 해금!', 4000);
      } catch (e) { }
      return true;
    } catch (e) { return false; }
  };

  /** 저장된 해금 상태를 화면에 반영 (로드·전투 시작 시) */
  window.BD_syncUltUI = function () {
    try {
      var on = !!(window.BD && BD._ultUnlocked);
      document.body.classList.toggle('bd-ult-on', on);
    } catch (e) { }
  };

  /* ══════════════ (v239) 새 스킬 첫 전투 튜토리얼 ══════════════
     스킬을 얻으면 BD._pendingSkillIntro 에 예약되고, 다음 전투 첫 턴에
     ① 스킬 버튼에 NEW 배지 연출 ② 담이가 그 스킬의 미니게임 조작 설명
     ③ 실제로 한 번 써 볼 때까지 진행 (강제 학습)
     을 수행한 뒤 예약이 해제된다. */
  var SKILL_INTRO = {
    fan:   ['노트 부채질', '🌀', '이건 연타예요! 1.2초 동안 최대한 빠르게 눌러요'],
    wash:  ['물청소 정화', '💦', '물줄기를 얼룩에 계속 대고 있어야 해요. 누르면 올라가고, 떼면 내려가요'],
    light: ['안전 점검 라이트', '🔦', '빛이 적 주위를 빙 돌아요. 좌우 키로 각도를 맞춰 비춰 주세요'],
    cheer: ['힘내라 봉담!', '📣', '「봉! 담! 화이팅!」 세 박자에 맞춰 눌러요. 셋 다 맞추면 특별해요'],
  };

  function newBadgeFX(sel) {
    try {
      var el = document.querySelector(sel); if (!el) return;
      if (el.querySelector('.bd-new-badge')) return;
      var b = document.createElement('div');
      b.className = 'bd-new-badge';
      b.textContent = 'NEW';
      b.style.cssText = 'position:absolute;right:-6px;top:-8px;background:#ff5a4a;color:#fff;'
        + 'font-size:11px;font-weight:900;padding:2px 7px;border-radius:9px;z-index:5;'
        + 'box-shadow:0 2px 8px rgba(0,0,0,.5);animation:bdNewPop .5s cubic-bezier(.2,1.5,.4,1) both,'
        + 'bdNewGlow 1.4s ease-in-out .5s infinite;';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.appendChild(b);
    } catch (e) { }
  }
  function clearBadgeFX() {
    try { document.querySelectorAll('.bd-new-badge').forEach(function (n) { n.remove(); }); } catch (e) { }
  }
  (function () {
    var s = document.createElement('style');
    s.textContent = '@keyframes bdNewPop{0%{transform:scale(0) rotate(-30deg);opacity:0}100%{transform:scale(1);opacity:1}}'
      + '@keyframes bdNewGlow{0%,100%{box-shadow:0 2px 8px rgba(0,0,0,.5)}50%{box-shadow:0 0 16px 4px rgba(255,90,74,.85)}}';
    document.head.appendChild(s);
  })();

  /** 새 스킬 튜토리얼 실행 (전투 중에만) */
  window.BD_runSkillIntro = function (skillId) {
    skillId = skillId || (window.BD && BD._pendingSkillIntro);
    var info = SKILL_INTRO[skillId];
    if (!info || !window.HSR || !HSR.active) return false;
    if (window.BD_TUTOR.isRunning()) return false;

    newBadgeFX('.hsr-act.hsr-skill');
    var used = false;
    function onUsed(e) {
      if (e && e.detail && e.detail.id === skillId) used = true;
    }
    window.addEventListener('bd-skill-used', onUsed);

    window.BD_TUTOR.run([
      { id: 'newskill', face: 'proud', target: '.hsr-act.hsr-skill', block: false,
        text: '새 배지 스킬 「' + info[0] + '」 ' + info[1] + ' 을 배웠어요! 카드에서 골라 써 봐요',
        waitFor: { delay: 4200 } },
      { id: 'newskill_how', face: 'base', block: false,
        text: info[2],
        waitFor: { delay: 4600 } },
      { id: 'newskill_try', face: 'surprise', target: '.hsr-act.hsr-skill', block: false,
        keys: ['e', ' '],   // (v36) 실습 스텝 입력 허용 — E(카드 메뉴)+Space(미니게임). 미지정이라 전부 잠겨 스킬을 쓸 수 없던 문제
        text: '직접 한 번 써 봐요! 「' + info[0] + '」 를 골라 주세요',
        // 실제로 그 스킬을 쓸 때까지 기다린다 (강제 학습)
        waitFor: {
          predicate: function () { return used; },
          delay: 90000
        } },
      { id: 'newskill_done', face: 'proud', block: false,
        text: '잘했어요! 이제 이 스킬은 언제든 쓸 수 있어요',
        waitFor: { delay: 3000 } },
    ], null, 'skill_intro');   /* (v375) 태그 — 0158 전투 튜토 게이트가 «이미 본 전투 튜토»로 오인해 막던 문제 */

    // 정리
    var iv = setInterval(function () {
      if (!window.BD_TUTOR.isRunning()) {
        clearInterval(iv);
        window.removeEventListener('bd-skill-used', onUsed);
        clearBadgeFX();
        try { if (window.BD && BD._pendingSkillIntro === skillId) { BD._pendingSkillIntro = null; if (typeof bdSave === 'function') bdSave(); } } catch (e) { }
      }
    }, 600);
    return true;
  };

  window.BD_replayBattleTutorial = function () {
    try { window.BD_TUTOR.reset(); } catch (e) { }
    try { localStorage.removeItem('bd_battle_tutorial_done'); } catch (e) { }   // (v34)
    if (window.HSR && HSR.active) window.BD_TUTOR.run(window.BD_DAMI_STEPS(), 'bars', 'dami_main');
    else if (typeof bdToast === 'function') bdToast('전투에 들어가면 담이가 다시 안내해요');
  };
  window.BD_resetDamiTutorial = function () {
    window.BD_TUTOR.reset();
    try { if (typeof bdToast === 'function') bdToast('담이 튜토리얼을 다시 볼 수 있어요'); } catch (e) { }
  };
})();

