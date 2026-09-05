
/* (v345) 엔딩 전용신 — 상세는 패치 주석 */
(function(){
  'use strict';
  var fxDone = false;
  function stats(){
    var pur = 0, stamp = 0, min = 0;
    try{ Object.keys((window.BD && BD.purified) || {}).forEach(function(k){ if (BD.purified[k]) pur++; }); }catch(e){}
    try{ stamp = (window.BD_PROGRESS && BD_PROGRESS.facility.facilityStampIds || []).length; }catch(e){}
    try{ var t0 = Number(localStorage.getItem('bd_play_started') || 0); if (t0) min = Math.max(1, Math.round((Date.now() - t0) / 60000)); }catch(e){}
    return { pur: pur, stamp: stamp, min: min };
  }
  /* 위험요소 자리 → 지도 % 좌표 (v343 정합 재사용) */
  function sparkSpots(){
    var out = [];
    try{
      var CAL = window.__BD_MAP_CAL || {};
      [210,211,212,213].forEach(function(sid){
        var C = CAL[sid]; if (!C || typeof STAGES === 'undefined' || !STAGES[sid]) return;
        (STAGES[sid].objects || []).forEach(function(o){
          if (!o || !o.hazardId || String(o.hazardId).indexOf('final_boss') === 0) return;
          var cx = C.ax * ((Number(o.rx)||0) + (Number(o.rw)||0.04)/2) + C.bx;
          var cy = C.ay * ((Number(o.ry)||0) + (Number(o.rh)||0.05)/2) + C.by;
          if (cx > 0 && cx < 1 && cy > 0 && cy < 1) out.push([cx*100, cy*100]);
        });
      });
    }catch(e){}
    return out;
  }
  /* (v346) 엔딩: 네 리가 차례로 스카이블루로 밝아진다 */
  function endDone(){
    var D = window.__BD_MAP_DONE || {};
    var R = { 210:[0,0,272/1166,688/1168], 211:[272/1166,0,586/1166,688/1168],
              212:[858/1166,0,308/1166,688/1168], 213:[0,688/1168,1,480/1168] };
    var s = '', i = 0;
    [212,211,213,210].forEach(function(sid){
      if (!D[sid]) return;
      var r = R[sid];
      s += '<img class="e2-done" src="'+D[sid]+'" style="left:'+(r[0]*100).toFixed(3)+'%;top:'+(r[1]*100).toFixed(3)
        + '%;width:'+(r[2]*100).toFixed(3)+'%;height:'+(r[3]*100).toFixed(3)+'%;transition-delay:'+(1.0 + i*0.45).toFixed(2)+'s">';
      i++;
    });
    return s;
  }
  /* 불꽃놀이 + 콘페티 */
  function pyro(cv, ms){
    var ctx = cv.getContext('2d');
    var W = cv.width = cv.offsetWidth, H = cv.height = cv.offsetHeight;
    var COLORS = ['#ffd86b','#7cc4ff','#ff8fa0','#8effa0','#e8b4ff','#ffe9a8','#7df0d8'];
    var parts = [], rockets = [], confetti = [];
    for (var i = 0; i < 90; i++) confetti.push({ x:Math.random()*W, y:-20-Math.random()*H*.5, w:6+Math.random()*7, h:8+Math.random()*8,
      vy:1.4+Math.random()*2.4, vx:-1+Math.random()*2, rot:Math.random()*6.28, vr:-.12+Math.random()*.24, c:COLORS[i%COLORS.length] });
    var t0 = Date.now(), lastRocket = 0;
    (function frame(){
      var t = Date.now() - t0;
      if (t > ms){ ctx.clearRect(0,0,W,H); return; }
      ctx.clearRect(0,0,W,H);
      if (t < ms - 1600 && Date.now() - lastRocket > 420 + Math.random()*380){
        lastRocket = Date.now();
        rockets.push({ x:W*(.12+Math.random()*.76), y:H+10, ty:H*(.12+Math.random()*.3), c:COLORS[(Math.random()*COLORS.length)|0] });
      }
      rockets = rockets.filter(function(r){
        r.y -= 13;
        ctx.fillStyle = r.c; ctx.fillRect(r.x-2, r.y, 4, 12);
        if (r.y <= r.ty){
          for (var k = 0; k < 46; k++){
            var a = Math.random()*6.283, sp = 2 + Math.random()*4.4;
            parts.push({ x:r.x, y:r.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1, c:r.c });
          }
          return false;
        }
        return true;
      });
      parts = parts.filter(function(p){
        p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .985; p.life -= .014;
        if (p.life <= 0) return false;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.283); ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;
      confetti.forEach(function(p){
        p.y += p.vy; p.x += p.vx + Math.sin((p.y+p.w)/26); p.rot += p.vr;
        if (p.y > H+20){ p.y = -20; p.x = Math.random()*W; }
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
      });
      requestAnimationFrame(frame);
    })();
  }
  function show(){
    var s = stats();
    var A = window.__BD_MAP_ASSETS || { mark:{} };
    var BOARD = window.__BD_MAP_BOARD || '';
    var fx = document.createElement('div');
    fx.id = 'bd-ending-fx2';
    var sparks = '';
    sparkSpots().forEach(function(p, i){
      sparks += '<div class="e2-spark" style="left:'+p[0].toFixed(1)+'%;top:'+p[1].toFixed(1)+'%;animation-delay:'+(1.1 + i*0.14).toFixed(2)+'s">'
        + '<img src="'+(A.mark['정화완료']||'')+'" alt=""></div>';
    });
    fx.innerHTML =
        '<div class="e2-rays"></div>'
      + '<canvas></canvas>'
      + '<div class="e2-mapwrap" style="background-image:url('+BOARD+')">'
      +   endDone()
      +   '<div class="e2-sheen"></div>' + sparks
      + '</div>'
      + '<div class="e2-title">🗺️ 봉담 안전지도 완성!</div>'
      + '<div class="e2-sub">지킴이와 담이의 손으로, 봉담의 온 동네가 다시 안전해졌어요</div>'
      + '<div class="e2-stats">'
      +   '<div>🧹 위험요소 정화 ' + s.pur + '곳</div>'
      +   '<div>🏅 시설 스탬프 ' + s.stamp + '개</div>'
      +   (s.min ? '<div>⏱ ' + s.min + '분의 모험</div>' : '')
      + '</div>'
      + '<div class="e2-hint">화면을 누르면 넘어가요</div>';
    document.body.appendChild(fx);
    requestAnimationFrame(function(){ fx.classList.add('on'); });
    pyro(fx.querySelector('canvas'), 9000);
    try{ if (window.BDSound && BDSound.clear) BDSound.clear(); else if (window.BDSound && BDSound.select) BDSound.select(); }catch(e){}
    var over = false;
    function finish(){
      if (over) return; over = true;
      fx.classList.remove('on');
      setTimeout(function(){ try{ fx.remove(); }catch(e){} }, 700);
    }
    fx.addEventListener('click', finish);
    setTimeout(finish, 9500);
  }
  setInterval(function(){
    try{
      if (fxDone) return;
      var m = document.getElementById('bd-ending-modal');
      if (!m || !m.classList.contains('show')) return;
      fxDone = true;
      show();
    }catch(e){}
  }, 600);
})();
