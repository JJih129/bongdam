
/* ══ (v235) 문화의집 PC존 — 갤러그 미니게임 ══
   3층 PC존 책상 앞에서 F를 누르면 아케이드가 실행된다.
   적은 이 게임의 위험요소들(연기·쓰레기·유리…), 플레이어는 지킴이 배지. */
(function(){
  'use strict';
  var ST = 101;                        // 문화의집 3층
  var POS = { x: 0.515, y: 0.715 };    // PC존 책상 앞
  var NEAR = 0.11;

  /* ───────── 공통 유틸 ───────── */
  function el(id){ return document.getElementById(id); }
  function toScreen(mx, my){
    try{
      var cv = el('game-canvas'); if (!cv) return null;
      var rect = cv.getBoundingClientRect();
      var px = ((((mx-camX)/VIEWPORT_W + 0.5)*BASE_W) - BASE_W/2)*currentScale + cv.width/2;
      var py = ((((my-camY)/VIEWPORT_H + 0.5)*BASE_H) - BASE_H/2)*currentScale + cv.height/2;
      return { x: rect.left + px/(cv.width/rect.width), y: rect.top + py/(cv.height/rect.height) };
    }catch(e){ return null; }
  }
  function uiBusy(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.__bdGuideOpen) return true;
      if (window.BD_choiceOpen && BD_choiceOpen()) return true;
      var v = el('dialogue-box');
      if (v && v.offsetHeight > 0 && parseFloat(getComputedStyle(v).opacity) > 0.05) return true;
      if (window.__bdSceneActive) return true;
    }catch(e){}
    return false;
  }
  function near(){
    try{
      if (typeof currentStage === 'undefined' || currentStage !== ST) return false;
      return Math.hypot(heroX - POS.x, heroY - POS.y) <= NEAR;
    }catch(e){ return false; }
  }

  /* ───────── 입력 차단 연동 ───────── */
  window.__bdArcadeOpen = false;
  var _oldBlocked = window.BD_isInputBlocked;
  window.BD_isInputBlocked = function(){
    if (window.__bdArcadeOpen) return true;
    try{ return _oldBlocked ? _oldBlocked() : false; }catch(e){ return false; }
  };

  /* ───────── 안내 마커 / 프롬프트 ───────── */
  function prompt(){
    var d = el('bd-arcade-tip');
    if (!d){
      d = document.createElement('div');
      d.id = 'bd-arcade-tip';
      d.style.cssText = 'position:fixed;z-index:891;display:none;transform:translate(-50%,-100%);'
        + 'background:rgba(16,24,44,.95);color:#ffd76a;border:1px solid rgba(255,216,106,.55);'
        + 'border-radius:10px;padding:6px 12px;font-size:13px;font-weight:800;'
        + 'font-family:"Noto Serif KR",serif;white-space:nowrap;pointer-events:none;'
        + 'box-shadow:0 4px 14px rgba(0,0,0,.45);';
      document.body.appendChild(d);
    }
    return d;
  }
  window.BD_addTick(function(){
    var p = prompt();
    try{
      var gs = el('game-screen');
      if (!gs || gs.style.display !== 'block' || uiBusy() || window.__bdArcadeOpen){ p.style.display='none'; return; }
      if (typeof currentStage === 'undefined' || currentStage !== ST){ p.style.display='none'; return; }
      var isNear = near();
      var sp = toScreen(POS.x, POS.y - 0.055);
      if (!sp){ p.style.display='none'; return; }
      p.textContent = isNear ? '🕹 [F] 오락실 PC 켜기' : '🕹 오락용 PC';
      p.style.opacity = isNear ? '1' : '.55';
      p.style.left = sp.x + 'px';
      p.style.top = sp.y + 'px';
      p.style.display = 'block';
    }catch(e){ p.style.display='none'; }
  }, 300);

  /* F 상호작용 (캡처 — 다른 처리보다 먼저) */
  window.addEventListener('keydown', function(e){
    if (window.__bdArcadeOpen) return;
    if (e.key !== 'f' && e.key !== 'F') return;
    if (!near() || uiBusy()) return;
    /* (v147) 바로 옆에 주민이 서 있으면 대화를 먼저 양보한다.
       이 두 핸들러는 window 캡처라 주민 대화(document 캡처)보다 «먼저» 실행된다.
       그래서 PC존·노래방 반경 안에 서 있는 밴드부 4명 중 3명은
       F를 눌러도 대화 대신 게임/노래 선택창만 떠서 말을 걸 수가 없었다. */
    try{
      var __r = (window.BD_nearResident && window.BD_nearResident()) || null;
      if (__r){
        var __x0 = (__r.rx||0), __y0 = (__r.ry||0);
        var __x1 = __x0 + (__r.rw||0.05), __y1 = __y0 + (__r.rh||0.075);
        var __dx = Math.max(__x0 - heroX, 0, heroX - __x1);
        var __dy = Math.max(__y0 - heroY, 0, heroY - __y1);
        if (Math.sqrt(__dx*__dx + __dy*__dy) <= 0.035) return;   // 주민이 바로 옆이면 대화 우선
      }
    }catch(__e){}
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    // (v236) 바로 실행하지 않고 게임 선택창을 띄운다
    if (window.BD_openGameSelect) window.BD_openGameSelect();
    else openArcade();
  }, true);
  window.BD_openArcade = function(){ openArcade(); };

  /* ───────── 갤러그 ───────── */
  var W = 480, H = 720;                       // 논리 해상도
  var ov, cv, ctx, raf = null, last = 0;
  var G = null;                               // 게임 상태
  var keys = {};
  var HI_KEY = 'bd_arcade_hi';
  var REWARD_KEY = 'bd_arcade_reward';
  var FOES = [
    { icon:'💨', name:'연기',  hp:1, score:100 },
    { icon:'🗑️', name:'쓰레기', hp:1, score:120 },
    { icon:'🍾', name:'술병',  hp:1, score:150 },
    { icon:'🌑', name:'그림자', hp:2, score:200 },
  ];

  function buildUI(){
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'bd-arcade';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10090;display:none;background:rgba(3,5,12,.94);'
      + 'align-items:center;justify-content:center;flex-direction:column;gap:10px;'
      + '-webkit-tap-highlight-color:transparent;touch-action:none;';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;';
    cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.style.cssText = 'background:#04060f;border:2px solid rgba(120,150,220,.5);border-radius:12px;'
      + 'max-height:78vh;max-width:94vw;height:78vh;width:auto;image-rendering:pixelated;'
      + 'box-shadow:0 12px 40px rgba(0,0,0,.6);';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:10px;align-items:center;';
    var btnExit = document.createElement('button');
    btnExit.textContent = '나가기 (ESC)';
    btnExit.style.cssText = 'background:rgba(16,24,44,.95);border:1px solid rgba(180,200,255,.5);'
      + 'color:#dbe7ff;border-radius:10px;padding:10px 16px;font-size:14px;font-weight:800;cursor:pointer;'
      + 'min-height:44px;font-family:"Noto Serif KR",serif;';
    btnExit.onclick = function(e){ e.preventDefault(); closeArcade(); };
    btnExit.addEventListener('touchstart', function(e){ e.preventDefault(); closeArcade(); }, { passive:false });
    var hint = document.createElement('div');
    hint.id = 'bd-arcade-hint';
    hint.style.cssText = 'color:#9fb0d0;font-size:12.5px;font-family:"Noto Serif KR",serif;';
    hint.textContent = '← → 이동 · Space 발사 · (모바일: 화면을 끌어서 이동, 자동 발사)';
    bar.appendChild(btnExit); bar.appendChild(hint);
    wrap.appendChild(cv); wrap.appendChild(bar);
    ov.appendChild(wrap);
    document.body.appendChild(ov);
    ctx = cv.getContext('2d');

    /* 터치: 드래그 이동 + 자동 발사, 게임오버 시 탭으로 재시작 */
    function touchX(e){
      var t = e.touches && e.touches[0]; if (!t) return null;
      var r = cv.getBoundingClientRect();
      return (t.clientX - r.left) / r.width * W;
    }
    cv.addEventListener('touchstart', function(e){
      e.preventDefault();
      if (G && G.over){ restart(); return; }
      var x = touchX(e); if (x !== null && G) G.touchX = x;
    }, { passive:false });
    cv.addEventListener('touchmove', function(e){
      e.preventDefault();
      var x = touchX(e); if (x !== null && G) G.touchX = x;
    }, { passive:false });
    cv.addEventListener('touchend', function(e){ e.preventDefault(); if (G) G.touchX = null; }, { passive:false });
    cv.addEventListener('click', function(){ if (G && G.over) restart(); });
  }

  function hi(){ try{ return parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0; }catch(e){ return 0; } }
  function setHi(v){ try{ localStorage.setItem(HI_KEY, String(v)); }catch(e){} }

  function newState(){
    return { px: W/2, py: H - 70, pw: 30, vx: 0, cool: 0, autoCool: 0,
      bullets: [], foes: [], foeBullets: [], parts: [],
      wave: 1, score: 0, lives: 3, over: false, cleared: false,
      sway: 0, swayDir: 1, dive: 0, touchX: null, t: 0, msg: '', msgT: 0 };
  }
  function spawnWave(n){
    G.foes = [];
    var cols = 7, rows = Math.min(2 + n, 5);
    var kinds = FOES.slice(0, Math.min(FOES.length, 1 + Math.ceil(n / 2)));
    for (var r = 0; r < rows; r++){
      for (var c = 0; c < cols; c++){
        var k = kinds[Math.min(kinds.length - 1, r % kinds.length)];
        G.foes.push({ hx: 60 + c * 60, hy: 90 + r * 52, x: 0, y: 0, w: 30,
          hp: k.hp, icon: k.icon, score: k.score, diving: false, dvx: 0, dvy: 0, t: Math.random()*6 });
      }
    }
    G.msg = 'WAVE ' + n; G.msgT = 1.2;
  }
  function restart(){ G = newState(); spawnWave(1); }

  function fire(){
    if (G.cool > 0) return;
    G.cool = 0.22;
    G.bullets.push({ x: G.px, y: G.py - 18, vy: -560 });
    try{ if (window.BDSound && BDSound.select) BDSound.select(); }catch(e){}
  }
  function boom(x, y, color){
    for (var i = 0; i < 10; i++){
      var a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 130;
      G.parts.push({ x:x, y:y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.5, color: color || '#ffd76a' });
    }
  }

  function update(dt){
    if (!G || G.over) return;
    G.t += dt;
    if (G.msgT > 0) G.msgT -= dt;
    // 플레이어 이동
    var speed = 300;
    if (G.touchX !== null){
      var d = G.touchX - G.px;
      G.px += Math.max(-speed*dt, Math.min(speed*dt, d));
    } else {
      var dir = (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0);
      G.px += dir * speed * dt;
    }
    G.px = Math.max(22, Math.min(W - 22, G.px));
    // 발사
    G.cool -= dt;
    if (keys[' '] || keys['Space']) fire();
    G.autoCool -= dt;
    if (G.touchX !== null && G.autoCool <= 0){ G.autoCool = 0.24; fire(); }
    // 편대 좌우 스윙
    G.sway += G.swayDir * 26 * dt;
    if (Math.abs(G.sway) > 26) G.swayDir *= -1;
    // 적 갱신
    var alive = 0, reached = false;
    G.foes.forEach(function(f){
      if (f.hp <= 0) return;
      alive++;
      f.t += dt;
      if (!f.diving){
        f.x = f.hx + G.sway;
        f.y = f.hy + Math.sin(G.t * 1.6 + f.hx * 0.05) * 4;
      } else {
        f.x += f.dvx * dt; f.y += f.dvy * dt;
        f.dvx += Math.sign(G.px - f.x) * 60 * dt;
        if (f.y > H + 30){ f.diving = false; f.y = f.hy; f.x = f.hx; }
      }
      if (f.y > H - 96) reached = true;
      // 적 탄
      if (!G.over && Math.random() < dt * (0.08 + G.wave * 0.02) && f.y < H - 200){
        G.foeBullets.push({ x: f.x, y: f.y + 14, vy: 170 + G.wave * 18 });
      }
    });
    // 다이브 시작
    G.dive -= dt;
    if (G.dive <= 0 && alive){
      G.dive = Math.max(0.7, 2.4 - G.wave * 0.2);
      var cand = G.foes.filter(function(f){ return f.hp > 0 && !f.diving; });
      if (cand.length){
        var f = cand[Math.floor(Math.random() * cand.length)];
        f.diving = true; f.dvx = (G.px - f.x) * 0.4; f.dvy = 150 + G.wave * 20;
      }
    }
    // 내 탄
    G.bullets.forEach(function(b){ b.y += b.vy * dt; });
    G.bullets = G.bullets.filter(function(b){ return b.y > -20; });
    // 명중
    G.bullets.forEach(function(b){
      G.foes.forEach(function(f){
        if (f.hp <= 0 || b.dead) return;
        if (Math.abs(b.x - f.x) < 18 && Math.abs(b.y - f.y) < 18){
          f.hp--; b.dead = true;
          if (f.hp <= 0){ G.score += f.score; boom(f.x, f.y); }
          else boom(f.x, f.y, '#9fd0ff');
          try{ if (window.BDSound && BDSound.hit) BDSound.hit(); }catch(e){}
        }
      });
    });
    G.bullets = G.bullets.filter(function(b){ return !b.dead; });
    // 적 탄 / 피격
    G.foeBullets.forEach(function(b){ b.y += b.vy * dt; });
    G.foeBullets = G.foeBullets.filter(function(b){ return b.y < H + 20; });
    var hitIdx = -1;
    G.foeBullets.forEach(function(b, i){
      if (Math.abs(b.x - G.px) < 16 && Math.abs(b.y - G.py) < 18) hitIdx = i;
    });
    var crashed = G.foes.some(function(f){
      return f.hp > 0 && f.diving && Math.abs(f.x - G.px) < 22 && Math.abs(f.y - G.py) < 22;
    });
    if (hitIdx >= 0 || crashed || reached){
      if (hitIdx >= 0) G.foeBullets.splice(hitIdx, 1);
      G.foes.forEach(function(f){ if (f.diving){ f.diving = false; f.x = f.hx; f.y = f.hy; } });
      G.lives--;
      boom(G.px, G.py, '#ff8a6a');
      try{ if (window.BDSound && BDSound.hurt) BDSound.hurt(); }catch(e){}
      if (G.lives <= 0) gameOver();
    }
    // 파티클
    G.parts.forEach(function(p){ p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; });
    G.parts = G.parts.filter(function(p){ return p.life > 0; });
    // 웨이브 클리어
    if (!alive){
      G.wave++;
      G.score += 300;
      spawnWave(G.wave);
    }
  }

  function gameOver(){
    G.over = true;
    if (G.score > hi()) setHi(G.score);
    // 첫 1000점 돌파 보상 (1회)
    try{
      if (G.score >= 1000 && !localStorage.getItem(REWARD_KEY)){
        localStorage.setItem(REWARD_KEY, '1');
        if (window.BD && typeof BD.gold === 'number'){
          BD.gold += 50;
          if (typeof bdToast === 'function') bdToast('🕹 아케이드 보상! +50G');
          try { window.BD_Facility && BD_Facility.completeActivity('facility_youth_house', 'activity_pc_zone'); } catch (eF) { }
        }
      }
    }catch(e){}
  }

  function draw(){
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // 배경 별
    ctx.fillStyle = '#070b18'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(200,220,255,.5)';
    for (var i = 0; i < 40; i++){
      var sy = ((i * 97 + (G ? G.t * 40 : 0)) % H);
      ctx.fillRect((i * 53) % W, sy, 2, 2);
    }
    if (!G) return;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 적
    ctx.font = '26px serif';
    G.foes.forEach(function(f){ if (f.hp > 0) ctx.fillText(f.icon, f.x, f.y); });
    // 내 탄
    ctx.fillStyle = '#ffd76a';
    G.bullets.forEach(function(b){ ctx.fillRect(b.x - 2, b.y - 10, 4, 12); });
    // 적 탄
    ctx.fillStyle = '#ff7a7a';
    G.foeBullets.forEach(function(b){ ctx.fillRect(b.x - 2, b.y - 8, 4, 10); });
    // 파티클
    G.parts.forEach(function(p){
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    });
    // 플레이어(배지)
    ctx.font = '30px serif';
    ctx.fillText('🛡️', G.px, G.py);
    // HUD
    ctx.font = 'bold 15px "Noto Serif KR", serif';
    ctx.fillStyle = '#dbe7ff'; ctx.textAlign = 'left';
    ctx.fillText('점수 ' + G.score, 12, 20);
    ctx.textAlign = 'center';
    ctx.fillText('WAVE ' + G.wave, W/2, 20);
    ctx.textAlign = 'right';
    ctx.fillText('🛡️'.repeat(Math.max(0, G.lives)), W - 12, 20);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fb0d0'; ctx.font = '12px "Noto Serif KR", serif';
    ctx.fillText('최고 ' + hi(), 12, 40);
    // 웨이브 배너
    if (G.msgT > 0){
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,216,106,' + Math.min(1, G.msgT) + ')';
      ctx.font = 'bold 30px "Noto Serif KR", serif';
      ctx.fillText(G.msg, W/2, H/2 - 40);
    }
    // 게임 오버
    if (G.over){
      ctx.fillStyle = 'rgba(4,6,15,.82)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 34px "Noto Serif KR", serif';
      ctx.fillText('GAME OVER', W/2, H/2 - 50);
      ctx.fillStyle = '#dbe7ff'; ctx.font = 'bold 20px "Noto Serif KR", serif';
      ctx.fillText('점수 ' + G.score + '  ·  최고 ' + hi(), W/2, H/2);
      ctx.fillStyle = '#9fb0d0'; ctx.font = '15px "Noto Serif KR", serif';
      ctx.fillText('Space / 화면 탭 — 다시 하기', W/2, H/2 + 44);
      ctx.fillText('ESC — 나가기', W/2, H/2 + 70);
    }
  }

  function loop(ts){
    if (!window.__bdGalagaOpen) return;
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  function openArcade(){
    buildUI();
    window.__bdArcadeOpen = true;      // 본편 입력 차단(공용)
    window.__bdGalagaOpen = true;      // (v236) 갤러그 전용 — 키 핸들러 소유권
    keys = {};
    try{ moveKeys = { w:false, a:false, s:false, d:false }; }catch(e){}
    restart();
    ov.style.display = 'flex';
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function closeArcade(){
    window.__bdArcadeOpen = false;
    window.__bdGalagaOpen = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (ov) ov.style.display = 'none';
    keys = {};
  }
  window.BD_closeArcade = closeArcade;
  window.BD_arcadeState = function(){ return G; };   // 진단·검증용

  /* 키 입력 — 아케이드가 열려 있는 동안 게임 입력을 완전히 가로챈다 */
  // (v235) window 캡처 단계에 등록 — 게임의 ESC(일시정지) 등 기존 핸들러보다 먼저 가로챈다
  window.addEventListener('keydown', function(e){
    if (!window.__bdGalagaOpen) return;
    var k = e.key;
    if (k === 'Escape'){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); closeArcade(); return; }
    if (k === ' ' && G && G.over){ e.preventDefault(); e.stopImmediatePropagation(); restart(); return; }
    keys[k] = true;
    if (k === ' ' || k.indexOf('Arrow') === 0 || k === 'a' || k === 'd' || k === 'f' || k === 'e'){
      e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('keyup', function(e){
    if (!window.__bdGalagaOpen) return;
    keys[e.key] = false;
    e.stopPropagation(); e.stopImmediatePropagation();
  }, true);
})();
