
/* (v129) 효과음 보강
   기존 BDSound(hit/weakHit/heal/win/lose/select)에 없는 소리를 채운다.
   Web Audio 합성이라 음원 파일이 필요 없다.
   · 담이가 말을 시작할 때 주의를 끄는 «띵» 소리 (요청)
   · 대사 진행 · 정화 완료 · 아이템 획득 · 문/이동 · 미니게임 판정 */
(function(){
  'use strict';
  var ctx = null;
  function ac(){
    try{
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }catch(e){ return null; }
  }
  function on(){
    // (v132) 소리 끔이 반영되지 않던 문제 —
    //  BDSound.isEnabled 만 보다가, 설정에서 끈 상태(localStorage)를 놓쳤다.
    try{
      if (window.BDSound && typeof BDSound.isEnabled === 'function' && !BDSound.isEnabled()) return false;
    }catch(e){}
    try{
      var raw = localStorage.getItem('bd_sound_v1') || localStorage.getItem('bd_settings_v1');
      if (raw){
        var s = JSON.parse(raw);
        if (s && (s.muted === true || s.sfx === 0 || s.enabled === false)) return false;
      }
    }catch(e){}
    try{ if (window.__bdSfxOff) return false; }catch(e){}
    return true;
  }
  /** 한 음 — freq(Hz), dur(초), type, 시작 볼륨 */
  function tone(freq, dur, type, vol, delay, glideTo){
    var c = ac(); if (!c || !on()) return;
    var t0 = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, filterHz){
    var c = ac(); if (!c || !on()) return;
    var n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random()*2 - 1) * (1 - i/n);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterHz || 1200;
    var g = c.createGain(); g.gain.value = vol || 0.08;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start();
  }

  var SFX = {
    /* 담이가 말을 시작할 때 — 부드럽게 주의를 끄는 두 음 */
    damiTalk: function(){ tone(880, 0.13, 'sine', 0.13); tone(1320, 0.20, 'sine', 0.10, 0.09); },
    /* 대사 한 줄 넘길 때 — 아주 짧고 낮게 */
    dialogueNext: function(){ tone(520, 0.05, 'triangle', 0.05); },
    /* 정화 완료 — 상승하는 세 음 */
    purify: function(){
      tone(660, 0.14, 'sine', 0.12);
      tone(880, 0.14, 'sine', 0.12, 0.10);
      tone(1180, 0.34, 'sine', 0.13, 0.20);
    },
    /* 아이템 획득 · 구매 */
    item: function(){ tone(1046, 0.09, 'square', 0.07); tone(1568, 0.13, 'square', 0.06, 0.07); },
    /* 소지금 획득 */
    coin: function(){ tone(1318, 0.07, 'square', 0.06); tone(1760, 0.12, 'square', 0.05, 0.06); },
    /* 미니게임 판정 */
    perfect: function(){ tone(1046,0.09,'sine',0.12); tone(1568,0.09,'sine',0.11,0.07); tone(2093,0.22,'sine',0.10,0.14); },
    good:    function(){ tone(880, 0.10, 'sine', 0.10); tone(1174, 0.14, 'sine', 0.08, 0.07); },
    miss:    function(){ tone(300, 0.20, 'sawtooth', 0.07, 0, 180); },
    /* 이동·문 */
    step:    function(){ noise(0.05, 0.035, 700); },
    door:    function(){ tone(180, 0.20, 'sine', 0.09, 0, 120); noise(0.12, 0.05, 500); },
    /* 메뉴 */
    open:    function(){ tone(700, 0.09, 'triangle', 0.08); tone(950, 0.12, 'triangle', 0.07, 0.06); },
    close:   function(){ tone(700, 0.09, 'triangle', 0.07, 0, 480); },
    /* 레벨업·스킬 습득 */
    levelup: function(){
      [523, 659, 784, 1046].forEach(function(f, i){ tone(f, 0.22, 'sine', 0.11, i * 0.09); });
    }
  };
  window.BD_SFX = SFX;

  /* (v132a) 소리 끄기 연동 —
     BDSound.setEnabled 를 감싸 전역 플래그를 함께 갱신한다.
     (isEnabled 를 매번 조회하는 방식이 타이밍에 따라 어긋나 소리가 새어 나왔다) */
  (function bindMute(){
    try{
      if (!(window.BDSound && typeof BDSound.setEnabled === 'function')) { setTimeout(bindMute, 300); return; }
      if (BDSound.setEnabled.__bdBound) return;
      var orig = BDSound.setEnabled.bind(BDSound);
      BDSound.setEnabled = function(v){
        window.__bdSfxOff = !v;
        return orig(v);
      };
      BDSound.setEnabled.__bdBound = true;
      // 현재 상태를 즉시 반영
      try{ window.__bdSfxOff = !BDSound.isEnabled(); }catch(e){}
      // 설정 창에서 다른 경로로 바뀌는 경우도 주기적으로 동기화
      setInterval(function(){
        try{ window.__bdSfxOff = !BDSound.isEnabled(); }catch(e){}
      }, 500);
    }catch(e){}
  })();

  /* ── 자동 연결 ── */

  /* 담이가 말을 시작하는 순간 */
  try{
    var wait = setInterval(function(){
      if (!(window.BD_DAMI && BD_DAMI.show)) return;
      clearInterval(wait);
      var orig = BD_DAMI.show.bind(BD_DAMI);
      var lastAt = 0;
      BD_DAMI.show = function(text, opt){
        try{
          var now = Date.now();
          if (now - lastAt > 900){ SFX.damiTalk(); lastAt = now; }   // 연속 호출 시 한 번만
        }catch(e){}
        return orig(text, opt);
      };
    }, 200);
  }catch(e){}

  /* 대사 진행 — 대사창이 열려 있을 때 Space/F/클릭 */
  document.addEventListener('keydown', function(e){
    try{
      if (e.key !== ' ' && e.key !== 'f' && e.key !== 'F' && e.key !== 'Enter') return;
      var b = document.getElementById('dialogue-box');
      if (b && b.offsetHeight) SFX.dialogueNext();
    }catch(err){}
  }, true);

  /* 정화 완료 감지 */
  try{
    var prevPur = 0;
    setInterval(function(){
      try{
        var n = Object.keys((window.BD && BD.purified) || {}).length;
        if (prevPur && n > prevPur) SFX.purify();
        prevPur = n;
      }catch(e){}
    }, 400);
  }catch(e){}

  /* 소지금 증가 감지 */
  try{
    var prevGold = null;
    setInterval(function(){
      try{
        if (typeof playerGold === 'undefined') return;
        if (prevGold != null && playerGold > prevGold) SFX.coin();
        prevGold = playerGold;
      }catch(e){}
    }, 500);
  }catch(e){}

  /* (v143) 미니게임 판정음 —
     예전에는 BD_MG.run 을 다시 감쌌는데, 그러면 튜토리얼이 걸어 둔 배선
     (minigame_done 신호)을 덮어써서 «다음 단계로 못 넘어가는» 문제가 생겼다.
     → run 을 건드리지 않고, 판정 결과를 알리는 신호에만 소리를 붙인다. */
  try{
    var w2 = setInterval(function(){
      if (!(window.BD_TUTOR && BD_TUTOR.on)) return;
      clearInterval(w2);
      try{
        BD_TUTOR.on('minigame_done', function(d){
          try{
            var g = d && d.grade;
            if (g === 'PERFECT') SFX.perfect();
            else if (g === 'GOOD') SFX.good();
            else SFX.miss();
          }catch(e){}
        });
      }catch(e){}
    }, 300);
  }catch(e){}
})();
