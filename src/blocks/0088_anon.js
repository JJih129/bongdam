
/* ══════════════════════════════════════════════════════════════════
   (v239) 전투 개편 모듈 — 미니게임 러너 / PP / 상성
   ------------------------------------------------------------------
   · BD_MG    : 스킬마다 다른 입력 미니게임 (ring / mash / hold / track / rhythm)
                판정은 항상 PERFECT ×1.5 · GOOD ×1.0 · MISS ×0.5 로 통일
   · BD_PP    : 스킬별 사용 횟수. 전투당 리셋, 브레이크 성공 시 +1 회복
   · BD_MATCH : 스킬 ↔ 위험요소 상성 조회 (카드 마크용)
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 공통 상수 ── */
  var MULT = { perfect: 1.5, good: 1.0, miss: 0.5 };
  var READY_MS = 400;

  function root() { return document.getElementById('hsr-battle') || document.body; }
  function ease() {
    // (v139) 스킬 미니게임이 어렵다는 의견 반영 — 판정 여유를 전반적으로 넓힌다.
    //  기본 1.0 → 1.35, 초반 보정도 더 후하게(첫 5전투).
    //  «잘 맞히는 재미»보다 «안전 행동을 배우는 것»이 목적이므로 관대한 편이 맞다.
    var m = 1.35;
    try { if (window.BD_AUG && BD_AUG.has('ac_ease')) m *= 1.4; } catch (e) { }
    try { if ((window.BD && (BD.battleCount || 0) < 5)) m *= 1.4; } catch (e) { }
    return m;
  }
  function beep(freq, dur, type, vol) {
    try {
      var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      if (!window.__bdMgAC) window.__bdMgAC = new C();
      var c = window.__bdMgAC, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.value = (vol == null ? 0.06 : vol);
      o.connect(g); g.connect(c.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.09));
      o.stop(c.currentTime + (dur || 0.09) + 0.02);
    } catch (e) { }
  }

  /* ── 스타일 ── */
  var css = ''
    + '#bd-mg{position:absolute;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;'
    + 'background:rgba(0,0,10,.28);cursor:pointer;touch-action:none;user-select:none}'
    + '#bd-mg-hint{position:absolute;left:50%;top:calc(50% + 96px);transform:translateX(-50%);'
    + 'color:#e8f2ff;font-weight:800;font-size:15px;text-shadow:0 2px 6px #000;white-space:nowrap}'
    + '.bd-mg-grade{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:30px;'
    + 'font-weight:900;text-shadow:0 2px 8px #000;animation:bdMgGrade .5s ease-out forwards;z-index:71}'
    + '@keyframes bdMgGrade{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}'
    + '30%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}'
    + '100%{opacity:0;transform:translate(-50%,-70%) scale(1)}}'
    + '.bd-mg-ready{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:26px;'
    + 'font-weight:900;color:#ffd86b;text-shadow:0 2px 8px #000;animation:bdMgReady .4s ease-out}'
    + '@keyframes bdMgReady{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}100%{opacity:1}}'
    /* ring */
    + '#bd-mg-ring{position:relative;width:120px;height:120px}'
    + '.bd-mg-target{position:absolute;inset:0;border:3px solid #ffd86b;border-radius:50%;box-shadow:0 0 14px rgba(255,216,107,.55)}'
    + '.bd-mg-shrink{position:absolute;inset:0;border:3px solid #7dd3fc;border-radius:50%;will-change:transform}'
    /* mash */
    + '#bd-mg-mash{width:280px;text-align:center}'
    + '.bd-mg-bar{position:relative;height:26px;border-radius:13px;background:rgba(255,255,255,.14);overflow:hidden;border:2px solid rgba(255,255,255,.3)}'
    + '.bd-mg-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:#7dd3fc;transition:width 60ms linear}'
    + '.bd-mg-fill.ok{background:#ffd86b}'
    + '.bd-mg-goal{position:absolute;top:-4px;bottom:-4px;width:3px;background:#fff;opacity:.9}'
    + '.bd-mg-count{margin-top:10px;font-size:28px;font-weight:900;color:#fff;text-shadow:0 2px 8px #000}'
    /* hold */
    + '#bd-mg-hold{position:relative;width:76px;height:345px;border-radius:38px;'
    + 'background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.32);overflow:hidden}'
    + '.bd-mg-zone{position:absolute;left:0;right:0;background:rgba(125,211,252,.34);border-top:2px solid #7dd3fc;border-bottom:2px solid #7dd3fc}'
    + '.bd-mg-marker{position:absolute;left:8px;right:8px;height:22px;border-radius:11px;background:#ffd86b;box-shadow:0 0 12px rgba(255,216,107,.7)}'
    + '.bd-mg-prog{position:absolute;left:0;bottom:0;height:5px;background:#9ef29e;width:0}'
    /* track */
    + '#bd-mg-track{position:relative;width:240px;height:240px}'
    + '.bd-mg-orbit{position:absolute;inset:20px;border:2px dashed rgba(255,255,255,.3);border-radius:50%}'
    + '.bd-mg-beam{position:absolute;left:50%;top:50%;width:100px;height:100px;margin:-50px 0 0 -50px;'
    + 'border-radius:50%;background:conic-gradient(from -25deg,rgba(255,216,107,.5) 0 50deg,transparent 50deg 360deg);'
    + 'transform-origin:50% 50%}'
    + '.bd-mg-goalpt{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;'
    + 'background:#ff8a65;box-shadow:0 0 12px rgba(255,138,101,.8)}'
    + '.bd-mg-goalpt.lit{background:#ffe08a;box-shadow:0 0 18px rgba(255,224,138,.95)}';

  (function () {
    var s = document.createElement('style'); s.id = 'bd-mg-style';
    s.textContent = css; document.head.appendChild(s);
  })();

  /* ══════════════ 러너 뼈대 ══════════════ */
  function makeHost() {
    var old = document.getElementById('bd-mg'); if (old) old.remove();
    var w = document.createElement('div'); w.id = 'bd-mg';
    root().appendChild(w);
    return w;
  }
  function showGrade(host, grade) {
    var g = document.createElement('div');
    g.className = 'bd-mg-grade';
    g.style.color = grade === 'PERFECT' ? '#ffd86b' : (grade === 'GOOD' ? '#e8f2ff' : '#9aa4b2');
    g.textContent = grade;
    host.appendChild(g);
    if (grade === 'PERFECT') beep(1180, .14, 'sine', .07);
    else if (grade === 'GOOD') beep(720, .1, 'triangle', .05);
    else beep(220, .13, 'sawtooth', .045);
  }
  function finish(host, grade, cb) {
    showGrade(host, grade);
    var mult = grade === 'PERFECT' ? MULT.perfect : (grade === 'GOOD' ? MULT.good : MULT.miss);
    setTimeout(function () {
      try { host.remove(); } catch (e) { }
      window.__bdMgGrade = grade;
      if (typeof cb === 'function') cb(mult, grade);
    }, 360);
  }
  function ready(host, text, then) {
    var r = document.createElement('div'); r.className = 'bd-mg-ready'; r.textContent = '준비!';
    host.appendChild(r);
    var hint = document.createElement('div'); hint.id = 'bd-mg-hint'; hint.textContent = text || '';
    host.appendChild(hint);
    beep(520, .07, 'sine', .04);
    setTimeout(function () { try { r.remove(); } catch (e) { } then(); }, READY_MS);
  }

  /* ══════════════ ① ring — 타이밍 링 ══════════════ */
  function runRing(host, opt, cb) {
    var DUR = 850, FROM = 2.3, TO = 0.25;
    var box = document.createElement('div'); box.id = 'bd-mg-ring';
    box.innerHTML = '<div class="bd-mg-target"></div><div class="bd-mg-shrink"></div>';
    host.appendChild(box);
    var shrink = box.querySelector('.bd-mg-shrink');
    var t0 = performance.now(), done = false, raf = 0, lastTick = 0;
    var wm = ease();

    function tick(now) {
      var p = Math.min(1, (now - t0) / DUR);
      var sc = FROM + (TO - FROM) * p;
      shrink.style.transform = 'scale(' + sc + ')';
      if (now - lastTick > Math.max(70, 240 * (1 - p))) { lastTick = now; beep(880, .03, 'square', .022); }
      if (p >= 1) { if (!done) { done = true; end('MISS'); } return; }
      raf = requestAnimationFrame(tick);
    }
    function press() {
      if (done) return; done = true;
      var p = (performance.now() - t0) / DUR;
      var sc = FROM + (TO - FROM) * p;
      var d = Math.abs(sc - 1);
      end(d <= 0.16 * wm ? 'PERFECT' : (d <= 0.45 * wm ? 'GOOD' : 'MISS'));
    }
    function end(grade) {
      cancelAnimationFrame(raf); detach(); finish(host, grade, cb);
    }
    var onKey = function (e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopPropagation(); press(); } };
    function detach() { document.removeEventListener('keydown', onKey, true); host.removeEventListener('pointerdown', press); }
    document.addEventListener('keydown', onKey, true);
    host.addEventListener('pointerdown', press);
    raf = requestAnimationFrame(tick);
  }

  /* ══════════════ ② mash — 연타 ══════════════ */
  function runMash(host, opt, cb) {
    var DUR = 1200;
    var goal = Math.max(3, Math.round(7 / ease()));   // 보정 시 목표가 낮아진다
    var good = Math.max(2, Math.round(goal * 0.6));
    var box = document.createElement('div'); box.id = 'bd-mg-mash';
    box.innerHTML = '<div class="bd-mg-bar"><div class="bd-mg-fill"></div>'
      + '<div class="bd-mg-goal" style="left:100%"></div></div>'
      + '<div class="bd-mg-count">0</div>';
    host.appendChild(box);
    var fill = box.querySelector('.bd-mg-fill');
    var cnt = box.querySelector('.bd-mg-count');
    var n = 0, done = false, t0 = performance.now(), raf = 0;

    function draw() {
      var pct = Math.min(100, (n / goal) * 100);
      fill.style.width = pct + '%';
      fill.classList.toggle('ok', n >= goal);
      cnt.textContent = String(n);
    }
    function hit() {
      if (done) return;
      n++; draw();
      beep(420 + n * 42, .04, 'triangle', .045);   // 누를수록 피치 상승
    }
    function tick(now) {
      if (done) return;
      if (now - t0 >= DUR) { done = true; cancelAnimationFrame(raf); detach();
        finish(host, n >= goal ? 'PERFECT' : (n >= good ? 'GOOD' : 'MISS'), cb); return; }
      raf = requestAnimationFrame(tick);
    }
    var onKey = function (e) {
      if (e.repeat) return;                                   // 꾹 누르기 무시
      if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopPropagation(); hit(); }
    };
    function detach() { document.removeEventListener('keydown', onKey, true); host.removeEventListener('pointerdown', hit); }
    document.addEventListener('keydown', onKey, true);
    host.addEventListener('pointerdown', hit);
    draw(); raf = requestAnimationFrame(tick);
  }

  /* ══════════════ ③ hold — 게이지 유지 ══════════════ */
  function runHold(host, opt, cb) {
    var DUR = 1600, H = 345, ZONE = 0.46 * (ease() > 1 ? 1.25 : 1);   // (v68) 물병 청소 완화 — 판정 바 확대(0.30→0.46)
    var box = document.createElement('div'); box.id = 'bd-mg-hold';
    box.innerHTML = '<div class="bd-mg-zone"></div><div class="bd-mg-marker"></div><div class="bd-mg-prog"></div>';
    host.appendChild(box);
    var zoneEl = box.querySelector('.bd-mg-zone');
    var mk = box.querySelector('.bd-mg-marker');
    var prog = box.querySelector('.bd-mg-prog');
    var pos = 0.5, vel = 0, holding = false, inTime = 0, done = false;
    var t0 = performance.now(), last = t0, raf = 0;

    function tick(now) {
      if (done) return;
      var dt = Math.min(40, now - last); last = now;
      var el = now - t0;
      vel += (holding ? 0.00070 : -0.00050) * dt;   // (v68) 가감속 추가 완화
      vel *= 0.90;                                   // (v68) 감쇠 강화 — 덜 미끄러지게
      pos = Math.max(0, Math.min(1, pos + vel * dt * 0.030));   // (v68) 이동 속도 하향(0.045→0.030)
      if (pos <= 0 || pos >= 1) vel = 0;
      var zc = 0.5 + Math.sin(el / 2600 * Math.PI * 2) * 0.11;   // (v68) 목표 존 이동 느리게·진폭 축소
      var zt = Math.max(0, zc - ZONE / 2), zb = Math.min(1, zc + ZONE / 2);
      zoneEl.style.top = (zt * H) + 'px';
      zoneEl.style.height = ((zb - zt) * H) + 'px';
      mk.style.top = (Math.max(0, Math.min(1, 1 - pos)) * (H - 22)) + 'px';
      var inside = (1 - pos) >= zt && (1 - pos) <= zb;
      if (inside) { inTime += dt; if (!tick._snd || now - tick._snd > 120) { tick._snd = now; beep(300, .05, 'sine', .03); } }
      var ratio = inTime / Math.max(1, el);
      prog.style.width = Math.min(100, ratio * 100) + '%';
      if (el >= DUR) {
        done = true; cancelAnimationFrame(raf); detach();
        finish(host, ratio >= 0.75 ? 'PERFECT' : (ratio >= 0.45 ? 'GOOD' : 'MISS'), cb); return;
      }
      raf = requestAnimationFrame(tick);
    }
    var kd = function (e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopPropagation(); holding = true; } };
    var ku = function (e) { if (e.key === ' ' || e.key === 'Spacebar') { holding = false; } };
    var pd = function () { holding = true; }, pu = function () { holding = false; };
    function detach() {
      document.removeEventListener('keydown', kd, true); document.removeEventListener('keyup', ku, true);
      host.removeEventListener('pointerdown', pd); window.removeEventListener('pointerup', pu);
    }
    document.addEventListener('keydown', kd, true); document.addEventListener('keyup', ku, true);
    host.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu);
    raf = requestAnimationFrame(tick);
  }

  /* ══════════════ ④ track — 원 궤도 추적 조준 ══════════════ */
  function runTrack(host, opt, cb) {
    /* (v121) 「안전 점검 라이트」 — 마우스로 어두운 곳을 비춘다.
       마우스를 움직이면 빛이 따라오고, 숨은 지점 위에 겹친 채 클릭하면 성공. */
    var DUR = 5600;                      // (v139) 조준 시간 확대
    var done = false, startAt = Date.now();

    var box = document.createElement('div');
    box.id = 'bd-mg-light';
    box.innerHTML =
      '<div class="lt-title">🔦 마우스로 어두운 곳을 비춰 위험을 찾아요</div>'
      + '<div class="lt-stage">'
      +   '<div class="lt-dark"></div>'
      +   '<div class="lt-spot"></div>'
      +   '<div class="lt-beam"></div>'
      +   '<div class="lt-target"><span>!</span></div>'
      +   '<div class="lt-hint">밝아지면 클릭!</div>'
      + '</div>'
      + '<div class="lt-bar"><span></span></div>';
    host.appendChild(box);

    var stage  = box.querySelector('.lt-stage');
    var spot   = box.querySelector('.lt-spot');
    var beam   = box.querySelector('.lt-beam');
    var target = box.querySelector('.lt-target');
    var hint   = box.querySelector('.lt-hint');
    var bar    = box.querySelector('.lt-bar span');

    /* 숨은 지점 위치 (가장자리 피해서) */
    var tx = 18 + Math.random() * 64;      // %
    var ty = 22 + Math.random() * 56;      // %
    target.style.left = tx + '%';
    target.style.top  = ty + '%';

    var mx = 50, my = 50, near = 0;

    function onMove(e){
      if (done) return;
      try{
        var r = stage.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width) * 100;
        my = ((e.clientY - r.top) / r.height) * 100;
        mx = Math.max(0, Math.min(100, mx));
        my = Math.max(0, Math.min(100, my));
        spot.style.left = mx + '%';
        spot.style.top  = my + '%';
        beam.style.left = mx + '%';
        beam.style.top  = my + '%';
        /* 가까울수록 밝아진다 — 찾는 재미 */
        var d = Math.hypot(mx - tx, my - ty);
        near = d;
        var warm = Math.max(0, 1 - d / 34);
        target.style.opacity = String(warm);
        target.style.transform = 'translate(-50%,-50%) scale(' + (0.7 + warm * 0.6) + ')';
        spot.style.boxShadow = '0 0 ' + (30 + warm * 40) + 'px ' + (14 + warm * 16) + 'px rgba(255,240,190,'
                             + (0.30 + warm * 0.45) + ')';
        hint.style.opacity = warm > 0.72 ? '1' : '0';
      }catch(err){}
    }
    /* (v388) 종료를 공통 경로(finish)로 넘긴다.
       (v341) 패치는 안쪽 상자(box)만 지우고 cb 를 직접 불렀다. 그래서 전체 화면을 덮는
       host(#bd-mg · position:absolute inset:0 · z-index:70)가 전투 화면에 그대로 남았고,
       z-index 가 없는 행동 버튼(.hsr-act)이 전부 그 아래 깔려 클릭이 먹히지 않았다.
       — 라이트 스킬을 쓴 뒤 전투가 멈춘 것처럼 보이던 현상(특히 최종 보스전).
       공통 finish 는 host 제거와 함께 __bdMgGrade 도 갱신하므로, 라이트만 판정을
       기록하지 않아 다음 스킬이 «직전 판정»을 물려받던 문제(환급·PERFECT 연출 오작동)도
       같이 해결된다. */
    function endLight(grade){
      if (done) return; done = true;
      try{ stage.removeEventListener('mousemove', onMove); }catch(e){}
      try{ stage.removeEventListener('click', onClick); }catch(e){}
      clearInterval(tick);
      if (grade !== 'MISS'){
        try{ target.classList.add('found'); }catch(e){}
      }
      setTimeout(function(){
        try{ box.remove(); }catch(eRm){}
        finish(host, grade, cb);          // 판정 표시 → host 제거 → cb
      }, 300);
    }
    function onClick(){
      if (done) return;
      var d = near;
      if (d < 9 * ease())       endLight('PERFECT');
      else if (d < 18 * ease()) endLight('GOOD');
      else {
        try{
          spot.classList.add('shake');
          setTimeout(function(){ try{ spot.classList.remove('shake'); }catch(e){} }, 240);
        }catch(e){}
      }
    }
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('click', onClick);

    var tick = setInterval(function(){
      if (done) return;
      var p = (Date.now() - startAt) / DUR;
      bar.style.width = Math.max(0, (1 - p) * 100) + '%';
      if (p >= 1) endLight('MISS');
    }, 60);
  }

  function runRhythm(host, opt, cb) {
    /* (v122) 「힘내라 봉담!」 — 대기열 슬라이드 방식
       · 가운데 판정칸에 화살표가 하나 들어온다.
       · 맞히면 오른쪽 대기열에서 다음 화살표가 슬라이드로 들어온다.
       · 제한 시간 안에 전부 맞히면 클리어. 빠를수록 좋은 판정. */
    var DIRS = [
      { k:'ArrowLeft',  ch:'◀' },
      { k:'ArrowDown',  ch:'▼' },
      { k:'ArrowUp',    ch:'▲' },
      { k:'ArrowRight', ch:'▶' }
    ];
    var TOTAL = 5;                       // (v139) 6 → 5 개로 완화
    var LIMIT = 3800 * ease();           // (v294) 유예 단축 — 약 5초
    var seq = [], idx = 0, done = false, hits = 0, startAt = Date.now();
    for (var s = 0; s < TOTAL; s++) seq.push(DIRS[(Math.random()*4)|0]);

    var box = document.createElement('div');
    box.id = 'bd-mg-ddr';
    box.innerHTML =
      '<div class="ddr-title">🎵 순서대로 방향키를 빠르게!</div>'
      + '<div class="ddr-row">'
      +   '<div class="ddr-slot"><div class="ddr-slot-in"></div></div>'
      +   '<div class="ddr-queue"></div>'
      + '</div>'
      + '<div class="ddr-judge"></div>'
      + '<div class="ddr-progress"><span></span></div>'
      + '<div class="ddr-count"><b>0</b> / ' + TOTAL + '</div>';
    host.appendChild(box);

    var slotIn = box.querySelector('.ddr-slot-in');
    var slot   = box.querySelector('.ddr-slot');
    var queue  = box.querySelector('.ddr-queue');
    var judgeEl= box.querySelector('.ddr-judge');
    var progEl = box.querySelector('.ddr-progress span');
    var cntEl  = box.querySelector('.ddr-count b');

    /* 대기열 만들기 — 다음에 올 화살표들이 오른쪽에 줄지어 보인다 */
    function paintQueue(){
      queue.innerHTML = '';
      for (var n = idx + 1; n < Math.min(idx + 5, TOTAL); n++){
        var q = document.createElement('div');
        q.className = 'ddr-q';
        q.textContent = seq[n].ch;
        q.style.opacity = String(Math.max(0.25, 1 - (n - idx - 1) * 0.22));
        queue.appendChild(q);
      }
    }
    function paintSlot(anim){
      slotIn.textContent = idx < TOTAL ? seq[idx].ch : '✓';
      if (anim){
        slotIn.classList.remove('slide');
        void slotIn.offsetWidth;
        slotIn.classList.add('slide');       // 오른쪽에서 미끄러져 들어옴
      }
    }
    function judge(txt, cls){
      judgeEl.textContent = txt;
      judgeEl.className = 'ddr-judge show ' + cls;
      setTimeout(function(){ try{ judgeEl.className = 'ddr-judge'; }catch(e){} }, 300);
    }
    function finish(){
      if (done) return; done = true;
      try{ document.removeEventListener('keydown', onKey, true); }catch(e){}
      clearInterval(tick);
      var mult, grade;
      if (hits >= TOTAL)            { mult = MULT.perfect; grade = 'PERFECT'; }
      else if (hits >= TOTAL * 0.6) { mult = MULT.good;    grade = 'GOOD'; }
      else                          { mult = MULT.miss;    grade = 'MISS'; }
      /* (v294) 완료 후 오버레이가 남던 문제 — 다른 러너와 동일하게 판정 표시 후 제거 */
      showGrade(host, grade);
      setTimeout(function(){
        try{ host.remove(); }catch(eR){}
        window.__bdMgGrade = grade;
        cb(mult, grade);
      }, 360);
    }

    paintSlot(false); paintQueue();

    function onKey(e){
      if (done) return;
      var d = DIRS.filter(function(x){ return x.k === e.key; })[0];
      if (!d) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (idx >= TOTAL) return;
      if (d.k === seq[idx].k){
        hits++; idx++;
        judge('GOOD!', 'good');
        try{
          slot.classList.add('ok');
          setTimeout(function(){ try{ slot.classList.remove('ok'); }catch(e2){} }, 180);
        }catch(e3){}
        cntEl.textContent = String(hits);
        if (idx >= TOTAL){ paintSlot(false); paintQueue(); finish(); return; }
        paintSlot(true); paintQueue();       // 다음 화살표가 슬라이드로 진입
      } else {
        judge('MISS', 'miss');
        try{
          slot.classList.add('ng');
          setTimeout(function(){ try{ slot.classList.remove('ng'); }catch(e4){} }, 220);
        }catch(e5){}
      }
    }
    document.addEventListener('keydown', onKey, true);

    var tick = setInterval(function(){
      if (done) return;
      var p = (Date.now() - startAt) / LIMIT;
      progEl.style.width = Math.max(0, (1 - p) * 100) + '%';
      if (p >= 1) finish();
    }, 60);
  }

  function runRingInline(container, widen, done) {
    var DUR = 550, FROM = 2.1, TO = 0.3, wm = ease() * (widen || 1);
    var box = document.createElement('div'); box.id = 'bd-mg-ring';
    box.innerHTML = '<div class="bd-mg-target"></div><div class="bd-mg-shrink"></div>';
    container.appendChild(box);
    var shrink = box.querySelector('.bd-mg-shrink');
    var t0 = performance.now(), fin = false, raf = 0;
    function tick(now) {
      var p = Math.min(1, (now - t0) / DUR);
      shrink.style.transform = 'scale(' + (FROM + (TO - FROM) * p) + ')';
      if (p >= 1) { if (!fin) { fin = true; end('MISS'); } return; }
      raf = requestAnimationFrame(tick);
    }
    function press() {
      if (fin) return; fin = true;
      var p = (performance.now() - t0) / DUR;
      var d = Math.abs((FROM + (TO - FROM) * p) - 1);
      end(d <= 0.18 * wm ? 'PERFECT' : (d <= 0.5 * wm ? 'GOOD' : 'MISS'));
    }
    function end(g) {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      container.removeEventListener('pointerdown', press);
      beep(g === 'PERFECT' ? 1100 : 700, .07, 'sine', .05);
      done(g);
    }
    var onKey = function (e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); e.stopPropagation(); press(); } };
    document.addEventListener('keydown', onKey, true);
    container.addEventListener('pointerdown', press);
    raf = requestAnimationFrame(tick);
  }

  /* ══════════════ 공개 API ══════════════ */
  var HINTS = {
    ring: '링이 겹치는 순간 Space (또는 화면 탭)!',
    mash: 'Space(또는 화면)를 최대한 빠르게 연타!',
    hold: 'Space(또는 화면)를 눌러 파란 구간에 유지!',
    track: '🔦 마우스로 어두운 곳을 비춰 위험을 찾아요!',
    rhythm: '가운데 칸에 오는 방향키를 순서대로! (5개)'
  };
  var RUNNERS = { ring: runRing, mash: runMash, hold: runHold, track: runTrack, rhythm: runRhythm };

  window.BD_MG = {
    MULT: MULT,
    TYPES: Object.keys(RUNNERS),
    /** 스킬 id → 미니게임 타입 */
    typeOf: function (skillId) {
      return ({ sticker: 'ring', fan: 'mash', wash: 'hold', light: 'track', cheer: 'rhythm' })[skillId] || 'ring';
    },
    badge: function (type) {
      return ({ ring: '⭕', mash: '💨', hold: '🎣', track: '🔦', rhythm: '🎵' })[type] || '⭕';
    },
    /** 미니게임 실행 — cb(mult, grade) */
    run: function (type, opts, cb) {
      opts = opts || {};
      // 접근성: 타이밍 게임 끄기 → 자동 GOOD
      try {
        if (window.BD && BD.mgOff) { setTimeout(function () { cb(MULT.good, 'GOOD'); }, 60); return; }
      } catch (e) { }
      var fn = RUNNERS[type] || runRing;
      var host = makeHost();
      window.__bdMgActive = true;
      var wrapped = function (m, g) { window.__bdMgActive = false; if (cb) cb(m, g); };
      if (type === 'rhythm') { fn(host, opts, wrapped); return; }
      ready(host, HINTS[type], function () { fn(host, opts, wrapped); });
    }
  };

  /* (v388) 안전망 — 러너 한 곳이 뒷정리를 빠뜨리면 #bd-mg 오버레이가 전투 화면에 남아
     행동 버튼 클릭을 전부 삼킨다(= 전투 먹통). 러너를 믿지 않고 한 번 더 확인한다.
     · __bdMgActive 는 run() 이 host 를 만든 직후 켜고, 러너 콜백에서 끈다 → 꺼져 있으면 잔재다
     · 전투가 끝났는데 남아 있으면 플래그까지 되돌려 다음 전투를 막지 않게 한다 */
  setInterval(function () {
    try {
      var h = document.getElementById('bd-mg');
      if (!h) return;
      var inBattle = !!(window.HSR && HSR.active);
      if (!window.__bdMgActive || !inBattle) {
        h.remove();
        window.__bdMgActive = false;
      }
    } catch (e) { }
  }, 500);

  /* ══════════════ BD_PP — 스킬 사용 횟수 ══════════════ */
  var PP_MAX = { sticker: Infinity, fan: 3, wash: 3, light: 3, cheer: 2 };
  var cur = {};
  window.BD_PP = {
    MAX: PP_MAX,
    max: function (id) {
      var v = PP_MAX[id];
      if (v == null) v = 3;
      if (v === Infinity) return v;
      try { if (window.BD_AUG && BD_AUG.has('pp_up')) v += 1; } catch (e) { }
      return v;
    },
    get: function (id) {
      if (this.max(id) === Infinity) return Infinity;
      if (cur[id] == null) cur[id] = this.max(id);
      return cur[id];
    },
    canUse: function (id) { return this.get(id) > 0; },
    consume: function (id) {
      if (this.max(id) === Infinity) return true;
      if (this.get(id) <= 0) return false;
      cur[id] = this.get(id) - 1;
      try { if (window.BD_refreshSkillCards) BD_refreshSkillCards(); } catch (e) { }
      return true;
    },
    /** 전투 시작 시 전액 리셋 */
    reset: function () {
      cur = {};
      Object.keys(PP_MAX).forEach(function (k) { if (PP_MAX[k] !== Infinity) cur[k] = PP_MAX[k]; });
      try { if (window.BD_refreshSkillCards) BD_refreshSkillCards(); } catch (e) { }
    },
    /** 약점을 PERFECT 로 맞히면 그 스킬 횟수를 환급 (브레이크 대체 보상) */
    refund: function (id) {
      if (this.max(id) === Infinity) return false;
      var c = this.get(id);
      if (c >= this.max(id)) return false;
      cur[id] = c + 1;
      try { if (window.BD_refreshSkillCards) BD_refreshSkillCards(); } catch (e) { }
      return true;
    },
    /** 전 스킬 +n 회복 */
    restoreAll: function (n) {
      var self = this, gained = [];
      Object.keys(PP_MAX).forEach(function (k) {
        if (PP_MAX[k] === Infinity) return;
        var before = self.get(k);
        if (before < PP_MAX[k]) { cur[k] = Math.min(PP_MAX[k], before + (n || 1)); gained.push(k); }
      });
      try { if (window.BD_refreshSkillCards) BD_refreshSkillCards(); } catch (e) { }
      return gained;
    },
    dots: function (id) {
      if (this.max(id) === Infinity) return '∞';
      var m = this.max(id), c = this.get(id), s = '';
      for (var i = 0; i < m; i++) s += (i < c ? '●' : '○');
      return s;
    }
  };

  /* ══════════════ BD_MATCH — 상성 조회 ══════════════ */
  var STRONG = { smoke: 'W', pollute: 'G', dark: 'M' };
  window.BD_MATCH = {
    /** 'strong' | 'normal' | 'weak'(역효과) | 'none'(무속성) */
    of: function (skillElem, family) {
      if (!skillElem || skillElem === 'N') return 'none';
      if (!family) return 'normal';
      if (STRONG[family] === skillElem) return 'strong';
      try {
        var w = window.BD_WRONG && window.BD_WRONG[family];
        if (w && w.elem === skillElem) return 'weak';
      } catch (e) { }
      return 'normal';
    },
    mark: function (m) {
      return ({ strong: '⬆', normal: '➖', weak: '⚠', none: '' })[m] || '';
    },
    color: function (m) {
      return ({ strong: '#ffd86b', normal: '#9aa4b2', weak: '#ff8a65', none: '#cbd5e1' })[m] || '#cbd5e1';
    }
  };
})();

