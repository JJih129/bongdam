
/* (v371) 실제 BGM 음원 적용 — Web Audio 기반 슬롯 재생기
   · 슬롯: title / house(실내) / field(야외·tension) / battle(인트로→메인) / boss(인트로→메인) / ending(=title)
   · 전투·보스는 «인트로 1회 → 정확히 그 끝 시각에 메인 루프 시작»(AudioBufferSourceNode 예약, 무간극)
   · 기존 BD_Bgm(0053) 인터페이스(play/stop/setVol/cur) 위에 덮어씀 — 리듬게임 음소거(0083)·설정 슬라이더 그대로 동작
   · BD_BGM_SLOTS 에 URL 이 채워지므로 칩튠 엔진(0070)은 스스로 조용해진다
   · 장면 자동 전환: 타이틀→title / 실내→house / 야외→field / 전투는 HSR.start 훅(0053)·종료(0050)가 지정 */
(function(){
  'use strict';
  /* (v376) 사파리 호환 — 사파리는 Ogg Vorbis 를 디코드하지 못해 BGM 전곡이 무음이었다.
     Ogg(무결 루프·용량 우위)를 기본으로 쓰되, 미지원 브라우저는 MP3 판으로 자동 전환한다.
     MP3 는 인코더 패딩(앞뒤 무음)이 루프 이음새·인트로→메인 연결에 틈을 만들므로 디코드 후 가장자리를 다듬는다. */
  var OGG_OK = (function(){
    try{
      if (localStorage.getItem('bd_force_mp3') === '1') return false;   /* 검수용 — MP3 경로 강제 */
      var a = document.createElement('audio'); return !!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"'));
    }catch(e){ return false; }
  })();
  var TRACKS_OGG = {
    title:        'data:audio/ogg;base64,@@B64:7957694a_title.ogg@@',
    field:        'data:audio/ogg;base64,@@B64:86bddce0_field.ogg@@',
    battle_intro: 'data:audio/ogg;base64,@@B64:18d87c3c_battle_intro.ogg@@',
    battle_main:  'data:audio/ogg;base64,@@B64:f94de4ab_battle_main.ogg@@',
    boss_intro:   'data:audio/ogg;base64,@@B64:1a0831fc_boss_intro.ogg@@',
    boss_main:    'data:audio/ogg;base64,@@B64:08ff937f_boss_main.ogg@@'
  };
  var TRACKS_MP3 = {
    title:        'data:audio/mpeg;base64,@@B64:fc0fd4c4_title.mp3@@',
    field:        'data:audio/mpeg;base64,@@B64:279aefc0_field.mp3@@',
    battle_intro: 'data:audio/mpeg;base64,@@B64:cbe91d0a_battle_intro.mp3@@',
    battle_main:  'data:audio/mpeg;base64,@@B64:7d5e1ddb_battle_main.mp3@@',
    boss_intro:   'data:audio/mpeg;base64,@@B64:aef9f7fb_boss_intro.mp3@@',
    boss_main:    'data:audio/mpeg;base64,@@B64:af2df2ee_boss_main.mp3@@'
  };
  var TRACKS = { house: 'data:audio/mpeg;base64,@@B64:7ebea9f6_house.mp3@@' };
  Object.keys(TRACKS_OGG).forEach(function(k){ TRACKS[k] = OGG_OK ? TRACKS_OGG[k] : TRACKS_MP3[k]; });
  var SLOT = {
    title:   { main:'title' },
    house:   { main:'house' },
    field:   { main:'field' },
    tension: { main:'field' },
    battle:  { intro:'battle_intro', main:'battle_main' },
    boss:    { intro:'boss_intro',   main:'boss_main' },
    ending:  { main:'title' }
  };
  window.BD_BGM_SLOTS = window.BD_BGM_SLOTS || {};
  Object.keys(SLOT).forEach(function(k){ window.BD_BGM_SLOTS[k] = TRACKS[SLOT[k].main]; });

  var ctx = null, master = null, unlocked = false, pending = null;
  var cur = null, gen = 0, playing = [];            // playing: 현재 슬롯의 소스 노드들
  var buffers = {}, loading = {}, lru = {}, lruTick = 0;
  /* (v377) 디코드 버퍼 LRU — 재생 중이 아닌 오래된 트랙 PCM 을 해제해 모바일 메모리를 지킨다 */
  function evict(){
    try{
      var KEEP = 4;
      var names = Object.keys(buffers);
      if (names.length <= KEEP) return;
      var inUse = {};
      try{ var def = SLOT[cur]; if (def){ inUse[def.main] = 1; if (def.intro) inUse[def.intro] = 1; } }catch(e){}
      names.filter(function(n){ return !inUse[n]; })
        .sort(function(a, b){ return (lru[a] || 0) - (lru[b] || 0); })
        .slice(0, Math.max(0, names.length - KEEP))
        .forEach(function(n){ delete buffers[n]; delete lru[n]; });
    }catch(e){}
  }
  var vol = 0.6;
  try{ var raw = localStorage.getItem('bongdam_settings_v160'); if (raw){ var o = JSON.parse(raw); if (o && typeof o.bgm === 'number') vol = o.bgm; } }catch(e){}

  function soundOn(){ try{ return !window.BDSound || BDSound.isEnabled(); }catch(e){ return true; } }
  function ac(){
    if (ctx) return ctx;
    try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ return null; }
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    return ctx;
  }
  function targetGain(){ return (cur && soundOn()) ? Math.max(0, Math.min(1, vol)) : 0; }
  function applyGain(fast){
    if (!ctx || !master) return;
    try{ master.gain.setTargetAtTime(targetGain(), ctx.currentTime, fast ? 0.05 : 0.25); }catch(e){}
  }
  /* MP3 인코더 패딩 제거 — 앞뒤 -54dB 이하 무음을 잘라 루프·인트로 연결 틈을 없앤다 */
  function trimEdges(buf){
    try{
      var th = 0.002, ch = buf.numberOfChannels, len = buf.length;
      var d0 = buf.getChannelData(0);
      var s = 0, e = len - 1;
      while (s < len && Math.abs(d0[s]) < th) s++;
      while (e > s && Math.abs(d0[e]) < th) e--;
      if (s <= 0 && e >= len - 1) return buf;
      var n = e - s + 1; if (n < 1000) return buf;
      var out = ctx.createBuffer(ch, n, buf.sampleRate);
      for (var c = 0; c < ch; c++) out.getChannelData(c).set(buf.getChannelData(c).subarray(s, e + 1));
      return out;
    }catch(err){ return buf; }
  }
  function decodeUrl(url){
    return fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(ab){
      /* 사파리 구버전은 프로미스형 decodeAudioData 미지원 — 콜백형 겸용 */
      return new Promise(function(res, rej){
        var p; try{ p = ctx.decodeAudioData(ab, res, rej); }catch(e){ rej(e); return; }
        if (p && p.then) p.then(res, rej);
      });
    });
  }
  function load(name, cb){
    if (buffers[name]){ lru[name] = ++lruTick; cb(buffers[name]); return; }
    if (!ac()) return;
    (loading[name] = loading[name] || []).push(cb);
    if (loading[name].length > 1) return;
    decodeUrl(TRACKS[name])
      .catch(function(err){
        /* Ogg 디코드 실패(예상 밖 미지원) → MP3 판 재시도 */
        if (TRACKS[name] !== TRACKS_MP3[name] && TRACKS_MP3[name]){ TRACKS[name] = TRACKS_MP3[name]; return decodeUrl(TRACKS[name]); }
        throw err;
      })
      .then(function(buf){
        if (TRACKS[name] === TRACKS_MP3[name]) buf = trimEdges(buf);
        buffers[name] = buf; lru[name] = ++lruTick; evict();
        var q = loading[name] || []; delete loading[name]; q.forEach(function(f){ try{ f(buf); }catch(e){} });
      })
      .catch(function(err){ delete loading[name]; try{ console.warn('[bgm] decode 실패', name, err); }catch(e){} });
  }
  function killPlaying(){
    playing.forEach(function(s){ try{ s.stop(); }catch(e){} try{ s.disconnect(); }catch(e){} });
    playing = [];
  }
  function schedule(slot, myGen){
    var def = SLOT[slot]; if (!def) return;
    var names = [def.main]; if (def.intro) names.unshift(def.intro);
    var got = {}, left = names.length;
    names.forEach(function(n){ load(n, function(buf){ got[n] = buf; if (--left === 0) go(); }); });
    function go(){
      if (myGen !== gen || !ctx) return;              // 그새 다른 슬롯으로 바뀜
      if (playing.length){                             // 이전 곡이 울리는 중이면 짧게 페이드아웃 후 교체
        try{ master.gain.setTargetAtTime(0, ctx.currentTime, 0.08); }catch(e){}
        setTimeout(function(){ if (myGen !== gen) return; killPlaying(); begin(); }, 320);
        return;
      }
      begin();
    }
    function begin(){
      if (myGen !== gen || !ctx) return;
      var t0 = ctx.currentTime + 0.05;
      var main = ctx.createBufferSource(); main.buffer = got[def.main]; main.loop = true; main.connect(master);
      if (def.intro){
        var intro = ctx.createBufferSource(); intro.buffer = got[def.intro]; intro.connect(master);
        intro.onended = function(){ var i = playing.indexOf(intro); if (i >= 0) playing.splice(i, 1); try{ intro.disconnect(); }catch(e){} };
        intro.start(t0);
        main.start(t0 + got[def.intro].duration);      // 인트로가 끝나는 정확한 시각에 메인 루프 시작
        playing.push(intro);
      } else {
        main.start(t0);
      }
      playing.push(main);
      applyGain(true);
    }
  }
  function play(slot){
    if (!SLOT[slot]) slot = 'field';
    if (cur === slot){ applyGain(); return; }
    cur = slot; gen++;
    if (!unlocked){ pending = slot; return; }
    if (!ac()) return;
    if (ctx.state === 'suspended'){ try{ ctx.resume(); }catch(e){} }
    schedule(slot, gen);                                // 버퍼 준비 → (이전 곡 페이드아웃) → 교체
  }
  function stop(){ cur = null; pending = null; gen++; applyGain(); setTimeout(function(){ if (!cur) killPlaying(); }, 400); }
  function setVol(v){ vol = Math.max(0, Math.min(1, Number(v) || 0)); applyGain(true); }

  function unlock(){
    if (unlocked) return;
    unlocked = true;
    var c = ac(); if (c && c.state === 'suspended'){ try{ c.resume(); }catch(e){} }
    if (pending){ var p = pending; pending = null; cur = null; play(p); }
    /* (v377) 전 트랙 프리로드 제거 — 7트랙 PCM(약 70~90MB)이 저사양 태블릿에서 탭 강제 리로드(메모리 초과)를 유발했다.
       필요한 슬롯만 그때 디코드하고, 최근 4개(필드↔전투 왕복 커버)만 유지한다. */
  }
  ['pointerdown','keydown','touchstart'].forEach(function(ev){ window.addEventListener(ev, unlock, { once:true, capture:true }); });
  /* (v378) iOS 사파리 — 탭 전환·홈 복귀 시 AudioContext 가 suspended 로 남아 무음이 되던 문제 */
  document.addEventListener('visibilitychange', function(){
    try{ if (!document.hidden && ctx && ctx.state === 'suspended') ctx.resume(); }catch(e){}
  });

  // ── BD_Bgm(0053) 덮어쓰기: 설정 저장(원본 setVol) 은 유지 ──
  function install(){
    var B = window.BD_Bgm; if (!B || B.__realV371) return false;
    var oSetVol = B.setVol;
    B.play = function(slot){ try{ play(slot); }catch(e){} };
    B.stop = function(){ try{ stop(); }catch(e){} };
    B.setVol = function(v){ try{ oSetVol.call(B, v); }catch(e){} setVol(v); };
    B.cur = function(){ return cur; };
    B.__realV371 = true;
    return true;
  }
  install();

  // ── 장면 자동 전환 (전투 중엔 HSR 훅이 지정한 battle/boss 유지) ──
  function tickScene(){
    try{
      install();
      applyGain();
      if (window.HSR && HSR.active) return;
      var t = document.getElementById('bd-title-screen') || document.getElementById('title-screen');
      var titleUp = !!(t && t.offsetHeight > 0 && getComputedStyle(t).display !== 'none');
      var g = document.getElementById('game-screen');
      var gameUp = !!(g && g.offsetHeight > 0);
      var want = null;
      if (titleUp) want = 'title';
      else if (gameUp){
        var st = (typeof STAGES !== 'undefined' && typeof currentStage !== 'undefined') ? STAGES[currentStage] : null;
        want = (st && st.interior) ? 'house' : 'field';
      }
      if (want && cur !== want) play(want);
    }catch(e){}
  }
  if (window.BD_addTick) window.BD_addTick(tickScene, 800); else setInterval(tickScene, 800);

  window.BD_BgmReal = { play:play, stop:stop, oggOK:OGG_OK, cur:function(){ return cur; }, ready:function(n){ return !!buffers[n]; }, _dbg:function(){ return { cur:cur, unlocked:unlocked, playing:playing.length, gain: master ? master.gain.value : null, buffers:Object.keys(buffers) }; } };
})();
