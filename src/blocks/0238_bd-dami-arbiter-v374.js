
/* (v374) 담이 발화 조정자 — «누가 말할 차례인가»를 한곳에서 정한다
   문제: 담이 대사 출처가 20여 곳(튜토·오프닝·길안내·수첩/지도 알림·휴식/여행 안내·전투 한마디…)이라
         튜토리얼 진행 중에도 다른 안내가 끼어들어 튜토 문장을 덮어썼고, 이미 지난 상황(엘리베이터로 나가기 등)의
         안내가 뒤늦게 재생됐다.
   규칙:
   · 채널: tut(튜토 단계) > story(각성·오프닝·컷신 연출) > guide(길안내·임무) > tip(그 외 알림) · battle(전투 중 한마디)
   · 튜토리얼(BD_TUTOR)·프롤로그 튜토(tut2) 진행 중: tut 만 즉시, 나머지는 보류(큐)
   · 오프닝/첫만남(story busy) 중: story·tut 만 즉시
   · 그 외: 앞 대사를 읽는 시간(글자수×85ms) 동안은 순서대로 대기 — 덮어쓰기 금지
   · 보류된 발화는 «지금도 유효한가»(opts.when 술어)·유효기간(opts.ttl, 기본 90초) 을 통과해야 나온다 → 지난 안내는 조용히 폐기
   · once 표식은 실제로 말한 순간에만 남긴다 (보류 중 폐기돼도 다음 기회에 다시 나올 수 있게)
   호출 규약: BD_DAMI.show(text, { face, once, channel:'tut'|'story'|'guide'|'tip'|'battle', when:fn, ttl:ms })
   기존 호출(채널 없음)은 tip 으로 취급된다. */
(function(){
  'use strict';
  window.__bdDamiArbiter = true;           /* 0179 구 큐 미설치 표식 */
  var Q = [], lastAt = 0, lastMs = 0, pumping = false, orig = null;
  var QMAX = 10;
  /* 채널별 유효기간 — 이야기(오프닝·컷신)는 반드시 나오고, 알림류는 오래 묵으면 폐기 */
  var TTL = { tut: 120000, story: 0, guide: 60000, tip: 45000, battle: 15000 };

  function tutRunning(){
    try{
      if (window.BD_TUTOR && BD_TUTOR.isRunning && BD_TUTOR.isRunning()) return true;
      /* 프롤로그(3층) 단계 머신 진행 중도 튜토로 본다 */
      if (typeof window.__bdTut2Step === 'number' && window.__bdTut2Step >= 0 && window.__bdTut2Step < 99){
        try{ if (localStorage.getItem('bd_tut2_done') !== '1') return true; }catch(e){}
      }
    }catch(e){}
    return false;
  }
  function storyBusy(){ return !!(window.__bdDamiOpeningBusy || window.__bdDamiIntroBusy || window.__bdSceneActive); }
  function chan(opts){
    var c = opts && opts.channel;
    return (c === 'tut' || c === 'story' || c === 'guide' || c === 'tip' || c === 'battle') ? c : 'tip';
  }
  function allowedNow(c){
    if (tutRunning()) return c === 'tut';
    if (storyBusy()) return c === 'story' || c === 'tut';
    return true;
  }
  function stillValid(it){
    try{
      if (it.opts.once && window.BD_DAMI.seen(it.opts.once)) return false;
      var ttl = (it.opts.ttl > 0) ? it.opts.ttl : TTL[it.ch];
      if (ttl > 0 && Date.now() - it.at > ttl) return false;
      if (typeof it.opts.when === 'function' && !it.opts.when()) return false;
      if (it.ch === 'battle' && !(window.HSR && HSR.active)) return false;
    }catch(e){ return false; }
    return true;
  }
  function readTime(text){ return Math.max(2600, String(text || '').length * 85) + 400; }
  var recent = {};   /* (v379) §6 — 같은 문장이 짧은 간격으로 중복 출력되던 문제 (여러 레이어가 같은 안내를 각자 발화) */
  function speakNow(text, opts){
    try{
      var c0 = chan(opts || {});
      if (c0 !== 'tut'){
        var t0 = recent[text];
        if (t0 && Date.now() - t0 < 45000) return false;
        recent[text] = Date.now();
      }
    }catch(e){}
    var ok = false;
    try{ ok = orig(text, opts); }catch(e){}
    if (!ok){ try{ delete recent[text]; }catch(e2){} }
    if (ok){ lastAt = Date.now(); lastMs = readTime(text); }
    return ok;
  }
  function enqueue(text, opts, c){
    if (Q.some(function(q){ return q.text === text; })) return;
    if (Q.length >= QMAX) Q.shift();
    Q.push({ text: text, opts: opts, ch: c, at: Date.now() });
    pump();
  }
  function pump(){
    if (pumping) return;
    pumping = true;
    (function loop(){
      try{
        /* 유효하지 않은 항목은 즉시 걸러낸다 */
        Q = Q.filter(stillValid);
        if (!Q.length){ pumping = false; return; }
        /* 채널 우선순위: tut > story > guide > tip > battle */
        var PR = { tut:0, story:1, guide:2, tip:3, battle:4 };
        Q.sort(function(a, b){ return (PR[a.ch] - PR[b.ch]) || (a.at - b.at); });
        var head = Q[0];
        if (!allowedNow(head.ch)) return setTimeout(loop, 500);          /* 튜토·오프닝이 끝날 때까지 대기 */
        var waitMs = (lastAt + lastMs) - Date.now();
        if (waitMs > 0) return setTimeout(loop, Math.min(waitMs + 80, 1200));
        Q.shift();
        speakNow(head.text, head.opts);
        return setTimeout(loop, 250);
      }catch(e){ pumping = false; }
    })();
  }

  var installed = false;
  function install(){
    /* 1회만 — 뒤에 다른 레이어(0153 효과음·0156 각성 가드)가 이 래퍼를 다시 감싸는 건 정상이며,
       재설치하면 모듈 변수 orig 가 «나를 포함한 체인»으로 바뀌어 무한 재귀(페이지 수 분 멈춤)가 난다 */
    if (installed || !window.BD_DAMI || !BD_DAMI.show) return;
    installed = true;
    orig = BD_DAMI.show.bind(BD_DAMI);
    BD_DAMI.show = function(text, opts){
      opts = opts || {};
      var c = chan(opts);
      try{
        if (opts.once && BD_DAMI.seen(opts.once)) return false;
        if (typeof opts.when === 'function' && !opts.when()) return false;   /* 이미 지난 상황 — 말하지 않는다 */
        if (!allowedNow(c)){ enqueue(text, opts, c); return true; }
        if (c !== 'tut' && Date.now() < lastAt + lastMs){ enqueue(text, opts, c); return true; }   /* 앞 대사 읽는 중 — 순서대로 */
      }catch(e){}
      return speakNow(text, opts);
    };
    BD_DAMI.show.__v374 = true;
    /* 튜토가 끝나면 보류분 재개 */
    setInterval(function(){ if (Q.length) pump(); }, 700);
    window.BD_DamiArbiter = { queue: function(){ return Q.map(function(q){ return q.ch + ':' + q.text.slice(0, 30); }); }, clear: function(){ Q.length = 0; },
      pending: function(ch){ return Q.filter(stillValid).some(function(q){ return !ch || q.ch === ch; }); } };
  }
  install();
  var iv = setInterval(function(){ install(); if (installed) clearInterval(iv); }, 300);
})();
