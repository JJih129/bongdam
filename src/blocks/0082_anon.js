
/* ══ (v236) 오락실 PC — 게임 선택창 + DOOM(레이캐스팅 FPS) ══ */
(function(){
  'use strict';

  /* ═════════ 공용 ═════════ */
  function el(id){ return document.getElementById(id); }
  function block(on){
    window.__bdArcadeOpen = !!on;
    if (on){ try{ moveKeys = { w:false, a:false, s:false, d:false }; }catch(e){} }
  }
  var IS_TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);

  /* ═════════ ① 게임 선택창 ═════════ */
  var selOv = null;
  function buildSelect(){
    if (selOv) return selOv;
    selOv = document.createElement('div');
    selOv.id = 'bd-gamesel';
    selOv.style.cssText = 'position:fixed;inset:0;z-index:10088;display:none;background:rgba(3,5,12,.9);'
      + 'align-items:center;justify-content:center;flex-direction:column;gap:18px;padding:20px;';
    var title = document.createElement('div');
    title.style.cssText = 'font-family:"Noto Serif KR",serif;font-weight:800;font-size:24px;color:#bcd4ff;';
    title.textContent = '🕹 어떤 게임을 할까요?';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;';
    function card(icon, name, desc, fn, color){
      var c = document.createElement('button');
      c.type = 'button';
      c.style.cssText = 'width:200px;min-height:180px;background:rgba(13,20,40,.98);cursor:pointer;'
        + 'border:1px solid ' + color + ';border-radius:16px;padding:20px 16px;color:#e8eefc;'
        + 'display:flex;flex-direction:column;align-items:center;gap:10px;'
        + 'font-family:"Noto Serif KR",serif;-webkit-tap-highlight-color:transparent;';
      c.innerHTML = '<div style="font-size:44px;line-height:1;">' + icon + '</div>'
        + '<div style="font-size:19px;font-weight:800;">' + name + '</div>'
        + '<div style="font-size:12.5px;color:#9fb0d0;line-height:1.6;">' + desc + '</div>';
      function go(e){ e.preventDefault(); closeSelect(true); setTimeout(fn, 120); }
      c.onclick = go;
      c.addEventListener('touchstart', go, { passive:false });
      return c;
    }
    row.appendChild(card('👾', '슈팅 게임', '위험요소를 쏘아 맞히는<br>클래식 슈팅 게임', function(){
      if (window.BD_openArcade) window.BD_openArcade();
    }, 'rgba(125,211,252,.55)'));
    row.appendChild(card('👹', '미로 게임', '3D 미로를 돌아다니며<br>그림자를 정화하는 FPS', function(){
      openDoom();
    }, 'rgba(255,120,90,.6)'));
    row.appendChild(card('🐍', '뱀 게임', '쓰레기를 먹어 치우며<br>길게 자라는 퍼즐 게임', function(){
      if (window.BD_openSnake) window.BD_openSnake();
    }, 'rgba(142,255,160,.55)'));
    // (v237 병합) v236 브랜치의 PC존 게임(INFERNO PROTOCOL)도 같은 선택창에서 실행한다.
    row.appendChild(card('🧟', '좀비 게임', '몰려오는 좀비 웨이브를<br>막아내는 탑다운 슈터', function(){
      var ok = false;
      try { ok = !!(window.BD_openComputerGame && window.BD_openComputerGame()); } catch(e){}
      if (!ok) block(false);   // 실행 실패 시 입력 차단 해제
    }, 'rgba(255,110,80,.6)'));
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = '그만두기 (ESC)';
    close.style.cssText = 'background:rgba(16,24,44,.95);border:1px solid rgba(180,200,255,.45);'
      + 'color:#dbe7ff;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:700;cursor:pointer;'
      + 'min-height:44px;font-family:"Noto Serif KR",serif;';
    function cgo(e){ e.preventDefault(); closeSelect(false); }
    close.onclick = cgo;
    close.addEventListener('touchstart', cgo, { passive:false });
    selOv.appendChild(title); selOv.appendChild(row); selOv.appendChild(close);
    document.body.appendChild(selOv);
    return selOv;
  }
  function openSelect(){
    buildSelect();
    block(true);
    selOv.style.display = 'flex';
    window.__bdSelectOpen = true;
  }
  function closeSelect(keepBlock){
    if (selOv) selOv.style.display = 'none';
    window.__bdSelectOpen = false;
    if (!keepBlock) block(false);
  }
  window.BD_openGameSelect = openSelect;
  window.addEventListener('keydown', function(e){
    if (!window.__bdSelectOpen) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (e.key === 'Escape') closeSelect(false);
    else if (e.key === '1'){ closeSelect(true); setTimeout(function(){ window.BD_openArcade && window.BD_openArcade(); }, 120); }
    else if (e.key === '2'){ closeSelect(true); setTimeout(openDoom, 120); }
    else if (e.key === '3'){ closeSelect(true); setTimeout(function(){ window.BD_openSnake && window.BD_openSnake(); }, 120); }
    else if (e.key === '4'){ closeSelect(true); setTimeout(function(){   // (v237 병합) INFERNO
      var ok = false;
      try { ok = !!(window.BD_openComputerGame && window.BD_openComputerGame()); } catch(err){}
      if (!ok) block(false);
    }, 120); }
  }, true);

  /* ═════════ ② DOOM (레이캐스팅) ═════════ */
  var W = 480, H = 360, FOV = Math.PI / 3;
  var MAP = [
    '################',
    '#..............#',
    '#.####.###..##.#',
    '#.#......#...#.#',
    '#.#.####.#.#.#.#',
    '#...#..#...#...#',
    '###.#..#####.###',
    '#......#.....#.#',
    '#.####.#.###.#.#',
    '#.#..........#.#',
    '#.#.########.#.#',
    '#.#........#...#',
    '#.######.#.#####',
    '#........#.....#',
    '#.####.###.###.#',
    '################',
  ];
  var MW = MAP[0].length, MH = MAP.length;
  function wall(x, y){
    if (x < 0 || y < 0 || x >= MW || y >= MH) return true;
    return MAP[y | 0][x | 0] === '#';
  }
  var FOE_KINDS = [
    { icon:'💨', name:'연기 그림자', hp:2, spd:1.1, color:'#cfe4ff' },
    { icon:'🗑️', name:'쓰레기 그림자', hp:3, spd:0.9, color:'#a6d6a6' },
    { icon:'🌑', name:'어둠의 그림자', hp:4, spd:1.35, color:'#c4a6ff' },
  ];

  var dOv, dCv, dCtx, dRaf = null, dLast = 0, D = null, dKeys = {};
  var touchState = { fwd:0, turn:0, fire:false };

  function buildDoom(){
    if (dOv) return;
    dOv = document.createElement('div');
    dOv.id = 'bd-doom';
    dOv.style.cssText = 'position:fixed;inset:0;z-index:10090;display:none;background:rgba(3,4,10,.97);'
      + 'align-items:center;justify-content:center;flex-direction:column;gap:10px;touch-action:none;'
      + '-webkit-tap-highlight-color:transparent;';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;';
    dCv = document.createElement('canvas');
    dCv.width = W; dCv.height = H;
    dCv.style.cssText = 'background:#000;border:2px solid rgba(255,120,90,.5);border-radius:10px;'
      + 'width:min(94vw, 900px);height:auto;image-rendering:pixelated;box-shadow:0 12px 40px rgba(0,0,0,.65);';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;';
    var exit = document.createElement('button');
    exit.textContent = '나가기 (ESC)';
    exit.style.cssText = 'background:rgba(16,24,44,.95);border:1px solid rgba(180,200,255,.5);color:#dbe7ff;'
      + 'border-radius:10px;padding:10px 16px;font-size:14px;font-weight:800;cursor:pointer;min-height:44px;'
      + 'font-family:"Noto Serif KR",serif;';
    function ego(e){ e.preventDefault(); closeDoom(); }
    exit.onclick = ego; exit.addEventListener('touchstart', ego, { passive:false });
    var hint = document.createElement('div');
    hint.style.cssText = 'color:#9fb0d0;font-size:12.5px;font-family:"Noto Serif KR",serif;';
    hint.textContent = 'W/S 이동 · A/D 회전 · Q/E 좌우 이동 · Space 발사';
    bar.appendChild(exit); bar.appendChild(hint);
    wrap.appendChild(dCv); wrap.appendChild(bar);

    /* 모바일 전용 조작 버튼 */
    if (IS_TOUCH){
      var pad = document.createElement('div');
      pad.style.cssText = 'display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;';
      function pbtn(label, on, off, big){
        var b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = 'background:rgba(16,24,44,.95);border:1px solid rgba(200,215,255,.45);color:#dbe7ff;'
          + 'border-radius:50%;width:' + (big?76:60) + 'px;height:' + (big?76:60) + 'px;font-size:'
          + (big?26:22) + 'px;font-weight:800;cursor:pointer;-webkit-tap-highlight-color:transparent;';
        b.addEventListener('touchstart', function(e){ e.preventDefault(); on(); }, { passive:false });
        b.addEventListener('touchend', function(e){ e.preventDefault(); off(); }, { passive:false });
        return b;
      }
      pad.appendChild(pbtn('◀', function(){ touchState.turn = -1; }, function(){ touchState.turn = 0; }));
      pad.appendChild(pbtn('▲', function(){ touchState.fwd = 1; }, function(){ touchState.fwd = 0; }));
      pad.appendChild(pbtn('▼', function(){ touchState.fwd = -1; }, function(){ touchState.fwd = 0; }));
      pad.appendChild(pbtn('▶', function(){ touchState.turn = 1; }, function(){ touchState.turn = 0; }));
      pad.appendChild(pbtn('🔫', function(){ touchState.fire = true; }, function(){ touchState.fire = false; }, true));
      wrap.appendChild(pad);
    }
    dOv.appendChild(wrap);
    document.body.appendChild(dOv);
    dCtx = dCv.getContext('2d');
    dCv.addEventListener('touchstart', function(e){
      e.preventDefault();
      if (D && (D.over || D.win)) restartDoom();
    }, { passive:false });
    dCv.addEventListener('click', function(){ if (D && (D.over || D.win)) restartDoom(); });
  }

  function freeSpot(){
    for (var i = 0; i < 400; i++){
      var x = 1 + Math.random() * (MW - 2), y = 1 + Math.random() * (MH - 2);
      if (!wall(x, y)) return { x:x, y:y };
    }
    return { x: 1.5, y: 1.5 };
  }
  function newDoom(){
    var foes = [];
    for (var i = 0; i < 8; i++){
      var k = FOE_KINDS[i % FOE_KINDS.length];
      var p = freeSpot();
      if (Math.hypot(p.x - 1.5, p.y - 1.5) < 4){ p = freeSpot(); }
      foes.push({ x:p.x, y:p.y, hp:k.hp, icon:k.icon, name:k.name, spd:k.spd, color:k.color,
        hurt:0, dead:false });
    }
    return { px: 1.5, py: 1.5, dir: 0, hp: 100, ammo: 40, foes: foes, kills: 0,
      flash: 0, cool: 0, over: false, win: false, t: 0, msg: '', msgT: 0, dmgFlash: 0 };
  }
  function restartDoom(){ D = newDoom(); D.msg = '그림자를 모두 정화하세요!'; D.msgT = 2.4; }

  function moveP(nx, ny){
    var pad = 0.22;
    if (!wall(nx + Math.sign(nx - D.px) * pad, D.py)) D.px = nx;
    if (!wall(D.px, ny + Math.sign(ny - D.py) * pad)) D.py = ny;
  }
  function los(ax, ay, bx, by){
    var dx = bx - ax, dy = by - ay, dist = Math.hypot(dx, dy);
    var steps = Math.ceil(dist * 8);
    for (var i = 1; i < steps; i++){
      var t = i / steps;
      if (wall(ax + dx * t, ay + dy * t)) return false;
    }
    return true;
  }
  function fire(){
    if (D.cool > 0 || D.over || D.win) return;
    D.cool = 0.35;
    D.flash = 0.12;
    if (D.ammo <= 0){ D.msg = '배지 에너지가 없어요! (적을 피해 다니면 회복)'; D.msgT = 1.4; return; }
    D.ammo--;
    var best = null, bestD = 99;
    D.foes.forEach(function(f){
      if (f.dead) return;
      var dx = f.x - D.px, dy = f.y - D.py;
      var dist = Math.hypot(dx, dy);
      if (dist > 14) return;
      var ang = Math.atan2(dy, dx) - D.dir;
      while (ang > Math.PI) ang -= Math.PI * 2;
      while (ang < -Math.PI) ang += Math.PI * 2;
      if (Math.abs(ang) > 0.16) return;
      if (!los(D.px, D.py, f.x, f.y)) return;
      if (dist < bestD){ bestD = dist; best = f; }
    });
    try{ if (window.BDSound && BDSound.select) BDSound.select(); }catch(e){}
    if (best){
      best.hp--; best.hurt = 0.25;
      if (best.hp <= 0){
        best.dead = true; D.kills++;
        D.msg = '✨ ' + best.name + ' 정화!'; D.msgT = 1.1;
        try{ if (window.BDSound && BDSound.hit) BDSound.hit(); }catch(e){}
        if (D.foes.every(function(f){ return f.dead; })){
          D.win = true;
          try{
            if (!localStorage.getItem('bd_doom_clear')){
              localStorage.setItem('bd_doom_clear', '1');
              if (window.BD && typeof BD.gold === 'number'){
                BD.gold += 80;
                if (typeof bdToast === 'function') bdToast('👹 미로 게임 클리어 보상! +80G');
                try { window.BD_Facility && BD_Facility.completeActivity('facility_youth_house', 'activity_pc_zone'); } catch (eF) { }
              }
            }
          }catch(e){}
        }
      }
    }
  }

  function updateDoom(dt){
    if (!D) return;
    D.t += dt;
    if (D.msgT > 0) D.msgT -= dt;
    if (D.flash > 0) D.flash -= dt;
    if (D.dmgFlash > 0) D.dmgFlash -= dt;
    D.cool -= dt;
    if (D.over || D.win) return;
    // 이동
    var mv = (dKeys['w'] || dKeys['ArrowUp'] ? 1 : 0) - (dKeys['s'] || dKeys['ArrowDown'] ? 1 : 0) + touchState.fwd;
    var tn = (dKeys['d'] || dKeys['ArrowRight'] ? 1 : 0) - (dKeys['a'] || dKeys['ArrowLeft'] ? 1 : 0) + touchState.turn;
    var st = (dKeys['e'] ? 1 : 0) - (dKeys['q'] ? 1 : 0);
    D.dir += tn * 2.2 * dt;
    var spd = 2.6 * dt;
    if (mv) moveP(D.px + Math.cos(D.dir) * spd * mv, D.py + Math.sin(D.dir) * spd * mv);
    if (st) moveP(D.px + Math.cos(D.dir + Math.PI/2) * spd * st, D.py + Math.sin(D.dir + Math.PI/2) * spd * st);
    if (dKeys[' '] || touchState.fire) fire();
    // 적
    D.foes.forEach(function(f){
      if (f.dead) return;
      if (f.hurt > 0) f.hurt -= dt;
      var dx = D.px - f.x, dy = D.py - f.y, dist = Math.hypot(dx, dy);
      if (dist < 9 && los(f.x, f.y, D.px, D.py)){
        if (dist > 0.75){
          var nx = f.x + (dx / dist) * f.spd * dt, ny = f.y + (dy / dist) * f.spd * dt;
          if (!wall(nx, f.y)) f.x = nx;
          if (!wall(f.x, ny)) f.y = ny;
        } else {
          // 접촉 피해
          if (!f.atkCd || f.atkCd <= 0){
            f.atkCd = 0.9;
            D.hp -= 8; D.dmgFlash = 0.3;
            try{ if (window.BDSound && BDSound.hurt) BDSound.hurt(); }catch(e){}
            if (D.hp <= 0){ D.hp = 0; D.over = true; }
          }
        }
      }
      if (f.atkCd > 0) f.atkCd -= dt;
    });
    // 에너지 서서히 회복
    if (D.ammo < 40 && D.t % 1 < dt) D.ammo = Math.min(40, D.ammo + 1);
  }

  function drawDoom(){
    if (!dCtx) return;
    var ctx = dCtx;
    // 천장/바닥
    var g1 = ctx.createLinearGradient(0, 0, 0, H/2);
    g1.addColorStop(0, '#0a0f22'); g1.addColorStop(1, '#1a2340');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H/2);
    var g2 = ctx.createLinearGradient(0, H/2, 0, H);
    g2.addColorStop(0, '#241d18'); g2.addColorStop(1, '#0d0a08');
    ctx.fillStyle = g2; ctx.fillRect(0, H/2, W, H/2);
    if (!D) return;
    var zbuf = new Float32Array(W);
    // 벽 레이캐스팅 (DDA)
    for (var x = 0; x < W; x++){
      var camX = 2 * x / W - 1;
      var ra = D.dir + Math.atan(camX * Math.tan(FOV / 2));
      var rdx = Math.cos(ra), rdy = Math.sin(ra);
      var mx = D.px | 0, my = D.py | 0;
      var ddx = Math.abs(1 / (rdx || 1e-6)), ddy = Math.abs(1 / (rdy || 1e-6));
      var sx, sy, sdx, sdy;
      if (rdx < 0){ sx = -1; sdx = (D.px - mx) * ddx; } else { sx = 1; sdx = (mx + 1 - D.px) * ddx; }
      if (rdy < 0){ sy = -1; sdy = (D.py - my) * ddy; } else { sy = 1; sdy = (my + 1 - D.py) * ddy; }
      var hit = false, side = 0, guard = 0;
      while (!hit && guard++ < 64){
        if (sdx < sdy){ sdx += ddx; mx += sx; side = 0; }
        else { sdy += ddy; my += sy; side = 1; }
        if (wall(mx, my)) hit = true;
      }
      var pdist = side === 0 ? (mx - D.px + (1 - sx) / 2) / (rdx || 1e-6)
                             : (my - D.py + (1 - sy) / 2) / (rdy || 1e-6);
      pdist = Math.max(0.05, pdist * Math.cos(ra - D.dir));
      zbuf[x] = pdist;
      var lh = Math.min(H * 3, H / pdist);
      var y0 = (H - lh) / 2;
      var shade = Math.max(0.15, 1 - pdist / 12) * (side ? 0.72 : 1);
      var r = Math.round(150 * shade), gg = Math.round(120 * shade), b = Math.round(105 * shade);
      // 벽돌 느낌: 세로 줄무늬
      if ((side === 0 ? my : mx) % 2 === 0){ r = Math.round(r * 0.92); gg = Math.round(gg * 0.92); }
      ctx.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')';
      ctx.fillRect(x, y0, 1, lh);
    }
    // 스프라이트(적) — 먼 것부터
    var list = D.foes.filter(function(f){ return !f.dead; }).map(function(f){
      return { f:f, d: Math.hypot(f.x - D.px, f.y - D.py) };
    }).sort(function(a, b){ return b.d - a.d; });
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    list.forEach(function(o){
      var f = o.f;
      var ang = Math.atan2(f.y - D.py, f.x - D.px) - D.dir;
      while (ang > Math.PI) ang -= Math.PI * 2;
      while (ang < -Math.PI) ang += Math.PI * 2;
      if (Math.abs(ang) > FOV / 2 + 0.4) return;
      var sx2 = (W / 2) * (1 + Math.tan(ang) / Math.tan(FOV / 2));
      var size = Math.min(H * 1.2, H / Math.max(0.3, o.d)) * 0.62;
      var col = Math.max(0, Math.min(W - 1, sx2 | 0));
      if (zbuf[col] < o.d) return;                   // 벽 뒤 가림
      ctx.globalAlpha = f.hurt > 0 ? 0.6 : 1;
      ctx.font = Math.round(size) + 'px serif';
      ctx.fillText(f.icon, sx2, H / 2 + size * 0.12);
      ctx.globalAlpha = 1;
      // 체력 바
      if (o.d < 8){
        var bw = size * 0.6;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(sx2 - bw/2, H/2 - size*0.5, bw, 4);
        ctx.fillStyle = f.hurt > 0 ? '#ff8a6a' : '#8effa0';
        var mx2 = (FOE_KINDS.filter(function(k){ return k.icon === f.icon; })[0] || { hp: 3 }).hp;
        ctx.fillRect(sx2 - bw/2, H/2 - size*0.5, bw * Math.max(0, f.hp) / mx2, 4);
      }
    });
    // 총(배지) + 발사 섬광
    if (D.flash > 0){
      ctx.fillStyle = 'rgba(255,220,120,' + (D.flash * 3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.font = '54px serif';
    ctx.fillText('🛡️', W / 2, H - 26);
    // 피격 화면
    if (D.dmgFlash > 0){
      ctx.fillStyle = 'rgba(220,40,40,' + (D.dmgFlash * 0.8) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // 미니맵
    var ms = 3.2, ox = W - MW * ms - 8, oy = 8;
    ctx.globalAlpha = 0.75;
    for (var yy = 0; yy < MH; yy++) for (var xx = 0; xx < MW; xx++){
      ctx.fillStyle = MAP[yy][xx] === '#' ? '#5a6a90' : '#131a2c';
      ctx.fillRect(ox + xx * ms, oy + yy * ms, ms - 0.5, ms - 0.5);
    }
    D.foes.forEach(function(f){
      if (f.dead) return;
      ctx.fillStyle = '#ff7a6a';
      ctx.fillRect(ox + f.x * ms - 1, oy + f.y * ms - 1, 3, 3);
    });
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(ox + D.px * ms - 1.5, oy + D.py * ms - 1.5, 3.5, 3.5);
    ctx.globalAlpha = 1;
    // HUD
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Noto Serif KR", serif';
    ctx.fillStyle = '#ff8a6a'; ctx.fillText('❤ ' + D.hp, 10, 18);
    ctx.fillStyle = '#ffd76a'; ctx.fillText('⚡ ' + D.ammo, 10, 38);
    ctx.fillStyle = '#8effa0';
    ctx.fillText('정화 ' + D.kills + ' / ' + D.foes.length, 10, 58);
    // 조준점
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W/2 - 8, H/2); ctx.lineTo(W/2 - 2, H/2);
    ctx.moveTo(W/2 + 2, H/2); ctx.lineTo(W/2 + 8, H/2);
    ctx.moveTo(W/2, H/2 - 8); ctx.lineTo(W/2, H/2 - 2);
    ctx.moveTo(W/2, H/2 + 2); ctx.lineTo(W/2, H/2 + 8);
    ctx.stroke();
    // 메시지
    if (D.msgT > 0){
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,216,106,' + Math.min(1, D.msgT) + ')';
      ctx.font = 'bold 18px "Noto Serif KR", serif';
      ctx.fillText(D.msg, W/2, H - 70);
    }
    // 결과
    if (D.over || D.win){
      ctx.fillStyle = 'rgba(4,6,15,.85)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = D.win ? '#8effa0' : '#ff8a6a';
      ctx.font = 'bold 32px "Noto Serif KR", serif';
      ctx.fillText(D.win ? '정화 완료!' : 'GAME OVER', W/2, H/2 - 30);
      ctx.fillStyle = '#dbe7ff'; ctx.font = 'bold 16px "Noto Serif KR", serif';
      ctx.fillText('정화한 그림자 ' + D.kills + '마리', W/2, H/2 + 5);
      ctx.fillStyle = '#9fb0d0'; ctx.font = '14px "Noto Serif KR", serif';
      ctx.fillText('Space / 화면 탭 — 다시 하기   ·   ESC — 나가기', W/2, H/2 + 40);
    }
  }

  function doomLoop(ts){
    if (!window.__bdDoomOpen) return;
    var dt = Math.min(0.05, (ts - dLast) / 1000 || 0);
    dLast = ts;
    updateDoom(dt); drawDoom();
    dRaf = requestAnimationFrame(doomLoop);
  }
  function openDoom(){
    buildDoom();
    window.__bdDoomOpen = true;
    block(true);
    dKeys = {}; touchState = { fwd:0, turn:0, fire:false };
    restartDoom();
    dOv.style.display = 'flex';
    dLast = performance.now();
    dRaf = requestAnimationFrame(doomLoop);
  }
  function closeDoom(){
    window.__bdDoomOpen = false;
    if (dRaf) cancelAnimationFrame(dRaf);
    dRaf = null;
    if (dOv) dOv.style.display = 'none';
    dKeys = {};
    block(false);
  }
  window.BD_openDoom = openDoom;
  window.BD_closeDoom = closeDoom;
  window.BD_doomState = function(){ return D; };

  window.addEventListener('keydown', function(e){
    if (!window.__bdDoomOpen) return;
    var k = e.key;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (k === 'Escape'){ closeDoom(); return; }
    if (k === ' ' && D && (D.over || D.win)){ restartDoom(); return; }
    dKeys[k] = true;
    if (k.length === 1) dKeys[k.toLowerCase()] = true;
  }, true);
  window.addEventListener('keyup', function(e){
    if (!window.__bdDoomOpen) return;
    e.stopPropagation(); e.stopImmediatePropagation();
    dKeys[e.key] = false;
    if (e.key.length === 1) dKeys[e.key.toLowerCase()] = false;
  }, true);
})();
