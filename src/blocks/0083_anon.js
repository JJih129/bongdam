
/* ══ (v237) 오락실 PC — 스네이크 ══
   지킴이 배지가 길어지며 쓰레기를 먹어 치운다. 벽·자기 몸에 부딪히면 끝. */
(function(){
  'use strict';
  var CELL = 24, COLS = 20, ROWS = 20;
  var W = CELL * COLS, H = CELL * ROWS;
  var HI_KEY = 'bd_snake_hi', REWARD_KEY = 'bd_snake_reward';
  var FOODS = ['🗑️', '🍾', '💨', '📄'];
  var IS_TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

  var ov, cv, ctx, raf = null, last = 0, acc = 0, S = null;

  function block(on){
    window.__bdArcadeOpen = !!on;                 // 본편 입력 차단(공용)
    if (on){ try{ moveKeys = { w:false, a:false, s:false, d:false }; }catch(e){} }
  }
  function hi(){ try{ return parseInt(localStorage.getItem(HI_KEY) || '0', 10) || 0; }catch(e){ return 0; } }
  function setHi(v){ try{ localStorage.setItem(HI_KEY, String(v)); }catch(e){} }

  function build(){
    if (ov) return;
    ov = document.createElement('div');
    ov.id = 'bd-snake';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10090;display:none;background:rgba(3,5,12,.95);'
      + 'align-items:center;justify-content:center;flex-direction:column;gap:10px;touch-action:none;'
      + '-webkit-tap-highlight-color:transparent;';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';
    cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.style.cssText = 'background:#0a1020;border:2px solid rgba(142,255,160,.45);border-radius:12px;'
      + 'height:min(74vh, 560px);width:auto;box-shadow:0 12px 40px rgba(0,0,0,.6);';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;';
    var exit = document.createElement('button');
    exit.textContent = '나가기 (ESC)';
    exit.style.cssText = 'background:rgba(16,24,44,.95);border:1px solid rgba(180,200,255,.5);color:#dbe7ff;'
      + 'border-radius:10px;padding:10px 16px;font-size:14px;font-weight:800;cursor:pointer;min-height:44px;'
      + 'font-family:"Noto Serif KR",serif;';
    function ego(e){ e.preventDefault(); close(); }
    exit.onclick = ego; exit.addEventListener('touchstart', ego, { passive:false });
    var hint = document.createElement('div');
    hint.style.cssText = 'color:#9fb0d0;font-size:12.5px;font-family:"Noto Serif KR",serif;';
    hint.textContent = '방향키 / WASD 이동 · (모바일: 화면을 밀거나 버튼으로 조작)';
    bar.appendChild(exit); bar.appendChild(hint);
    wrap.appendChild(cv); wrap.appendChild(bar);

    if (IS_TOUCH){
      var pad = document.createElement('div');
      pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,60px);gap:8px;justify-content:center;';
      function pb(label, dx, dy, col, rowN){
        var b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = 'grid-column:' + col + ';grid-row:' + rowN + ';width:60px;height:60px;'
          + 'background:rgba(16,24,44,.95);border:1px solid rgba(200,215,255,.45);color:#dbe7ff;'
          + 'border-radius:14px;font-size:22px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent;';
        function go(e){ e.preventDefault(); turn(dx, dy); }
        b.addEventListener('touchstart', go, { passive:false });
        b.onclick = go;
        return b;
      }
      pad.appendChild(pb('▲', 0, -1, 2, 1));
      pad.appendChild(pb('◀', -1, 0, 1, 2));
      pad.appendChild(pb('▶', 1, 0, 3, 2));
      pad.appendChild(pb('▼', 0, 1, 2, 3));
      wrap.appendChild(pad);
    }
    ov.appendChild(wrap);
    document.body.appendChild(ov);
    ctx = cv.getContext('2d');

    /* 스와이프 조작 + 게임오버 탭 재시작 */
    var sx = null, sy = null;
    cv.addEventListener('touchstart', function(e){
      e.preventDefault();
      if (S && S.over){ restart(); return; }
      var t = e.touches[0]; sx = t.clientX; sy = t.clientY;
    }, { passive:false });
    cv.addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive:false });
    cv.addEventListener('touchend', function(e){
      e.preventDefault();
      if (sx === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 24){
        if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
        else turn(0, dy > 0 ? 1 : -1);
      }
      sx = sy = null;
    }, { passive:false });
    cv.addEventListener('click', function(){ if (S && S.over) restart(); });
  }

  function spawnFood(){
    for (var i = 0; i < 500; i++){
      var x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS);
      var hit = S.body.some(function(b){ return b.x === x && b.y === y; });
      if (!hit) return { x:x, y:y, icon: FOODS[Math.floor(Math.random() * FOODS.length)] };
    }
    return { x:0, y:0, icon: FOODS[0] };
  }
  function newState(){
    var s = { body: [{ x:9, y:10 }, { x:8, y:10 }, { x:7, y:10 }],
      dx: 1, dy: 0, ndx: 1, ndy: 0, food: null, score: 0, eaten: 0,
      step: 0.16, over: false, msg: '', msgT: 0, pop: 0 };
    S = s; s.food = spawnFood();
    return s;
  }
  function restart(){ newState(); S.msg = '쓰레기를 먹어 치우자!'; S.msgT = 1.6; acc = 0; }
  function turn(dx, dy){
    if (!S || S.over) return;
    if (dx !== 0 && S.dx !== 0) return;    // 반대·같은 축 무시
    if (dy !== 0 && S.dy !== 0) return;
    S.ndx = dx; S.ndy = dy;
  }

  function tick(){
    if (!S || S.over) return;
    S.dx = S.ndx; S.dy = S.ndy;
    var head = S.body[0];
    var nx = head.x + S.dx, ny = head.y + S.dy;
    // 벽
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS){ gameOver(); return; }
    // 자기 몸
    if (S.body.some(function(b, i){ return i < S.body.length - 1 && b.x === nx && b.y === ny; })){ gameOver(); return; }
    S.body.unshift({ x:nx, y:ny });
    if (S.food && nx === S.food.x && ny === S.food.y){
      S.score += 50; S.eaten++;
      S.pop = 0.25;
      S.step = Math.max(0.07, 0.16 - S.eaten * 0.004);
      S.food = spawnFood();
      try{ if (window.BDSound && BDSound.hit) BDSound.hit(); }catch(e){}
      if (S.eaten % 5 === 0){ S.msg = '✨ ' + S.eaten + '개 정화!'; S.msgT = 1.1; }
    } else {
      S.body.pop();
    }
  }
  function gameOver(){
    S.over = true;
    if (S.score > hi()) setHi(S.score);
    try{ if (window.BDSound && BDSound.hurt) BDSound.hurt(); }catch(e){}
    try{
      if (S.eaten >= 15 && !localStorage.getItem(REWARD_KEY)){
        localStorage.setItem(REWARD_KEY, '1');
        if (window.BD && typeof BD.gold === 'number'){
          BD.gold += 60;
          if (typeof bdToast === 'function') bdToast('🐍 뱀 게임 보상! +60G');
          try { window.BD_Facility && BD_Facility.completeActivity('facility_youth_house', 'activity_pc_zone'); } catch (eF) { }
        }
      }
    }catch(e){}
  }

  function draw(){
    if (!ctx) return;
    ctx.fillStyle = '#0a1020'; ctx.fillRect(0, 0, W, H);
    // 격자
    ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 1;
    for (var i = 1; i < COLS; i++){
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
    }
    if (!S) return;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 먹이
    if (S.food){
      ctx.font = Math.round(CELL * 0.82) + 'px serif';
      ctx.fillText(S.food.icon, S.food.x * CELL + CELL/2, S.food.y * CELL + CELL/2);
    }
    // 몸
    S.body.forEach(function(b, i){
      if (i === 0) return;
      var t = 1 - i / (S.body.length + 4);
      ctx.fillStyle = 'rgba(142,255,160,' + (0.35 + t * 0.5) + ')';
      ctx.fillRect(b.x * CELL + 3, b.y * CELL + 3, CELL - 6, CELL - 6);
    });
    // 머리(배지)
    var hd = S.body[0];
    var sc = 1 + (S.pop > 0 ? S.pop : 0);
    ctx.font = Math.round(CELL * 0.9 * sc) + 'px serif';
    ctx.fillText('🛡️', hd.x * CELL + CELL/2, hd.y * CELL + CELL/2);
    // HUD
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 15px "Noto Serif KR", serif';
    ctx.fillStyle = '#dbe7ff'; ctx.fillText('점수 ' + S.score, 10, 22);
    ctx.fillStyle = '#8effa0'; ctx.fillText('정화 ' + S.eaten, 10, 42);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9fb0d0'; ctx.font = '13px "Noto Serif KR", serif';
    ctx.fillText('최고 ' + hi(), W - 10, 22);
    // 메시지
    if (S.msgT > 0){
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,216,106,' + Math.min(1, S.msgT) + ')';
      ctx.font = 'bold 20px "Noto Serif KR", serif';
      ctx.fillText(S.msg, W/2, 60);
    }
    // 결과
    if (S.over){
      ctx.fillStyle = 'rgba(4,6,15,.85)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 32px "Noto Serif KR", serif';
      ctx.fillText('GAME OVER', W/2, H/2 - 34);
      ctx.fillStyle = '#dbe7ff'; ctx.font = 'bold 18px "Noto Serif KR", serif';
      ctx.fillText('점수 ' + S.score + '  ·  정화 ' + S.eaten + '개', W/2, H/2 + 2);
      ctx.fillStyle = '#9fb0d0'; ctx.font = '14px "Noto Serif KR", serif';
      ctx.fillText('Space / 화면 탭 — 다시 하기   ·   ESC — 나가기', W/2, H/2 + 38);
    }
  }

  function loop(ts){
    if (!window.__bdSnakeOpen) return;
    var dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    if (S){
      if (S.msgT > 0) S.msgT -= dt;
      if (S.pop > 0) S.pop -= dt;
      if (!S.over){
        acc += dt;
        while (acc >= S.step){ acc -= S.step; tick(); }
      }
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function open(){
    build();
    window.__bdSnakeOpen = true;
    block(true);
    restart();
    ov.style.display = 'flex';
    last = performance.now(); acc = 0;
    raf = requestAnimationFrame(loop);
  }
  function close(){
    window.__bdSnakeOpen = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (ov) ov.style.display = 'none';
    block(false);
  }
  window.BD_openSnake = open;
  window.BD_closeSnake = close;
  window.BD_snakeState = function(){ return S; };

  window.addEventListener('keydown', function(e){
    if (!window.__bdSnakeOpen) return;
    var k = e.key;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (k === 'Escape'){ close(); return; }
    if (k === ' '){ if (S && S.over) restart(); return; }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') turn(0, -1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') turn(0, 1);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') turn(-1, 0);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') turn(1, 0);
  }, true);
  window.addEventListener('keyup', function(e){
    if (!window.__bdSnakeOpen) return;
    e.stopPropagation(); e.stopImmediatePropagation();
  }, true);
})();
