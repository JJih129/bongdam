
/* ══ (v231) 바닥 길안내 — 목표까지 직각(4방향) 경로를 바닥 점으로 표시 ══
   목표는 기존 목표 시스템(goalHazard)을 그대로 사용한다. 벽을 피해 BFS로 찾은
   격자 경로라 대각선 없이 ㄱ자 꺾임으로만 이어진다. */
(function(){
  'use strict';
  const GW = 36, GH = 27;              // 격자 해상도
  let dots = [], lastKey = '';
  function el(id){ return document.getElementById(id); }
  function toScreen(mx, my){
    try{
      const cv = el('game-canvas'); if (!cv) return null;
      const rect = cv.getBoundingClientRect();
      const px = ((((mx-camX)/VIEWPORT_W + 0.5)*BASE_W) - BASE_W/2)*currentScale + cv.width/2;
      const py = ((((my-camY)/VIEWPORT_H + 0.5)*BASE_H) - BASE_H/2)*currentScale + cv.height/2;
      return { x: rect.left + px/(cv.width/rect.width), y: rect.top + py/(cv.height/rect.height) };
    }catch(e){ return null; }
  }
  function container(){
    let d = el('bd-navpath');
    if (!d){ d = document.createElement('div'); d.id = 'bd-navpath';
      d.style.cssText = 'position:fixed;inset:0;z-index:880;pointer-events:none;';
      document.body.appendChild(d); }
    return d;
  }
  function blockedGrid(){
    // (v231) 게임의 실제 충돌 판정(_collidesAt)을 그대로 사용 — 걸을 수 있는 곳 = 길
    const g = new Uint8Array(GW * GH);
    try{
      if (typeof _collidesAt !== 'function') return g;
      for (let y = 0; y < GH; y++)
        for (let x = 0; x < GW; x++)
          if (_collidesAt((x + 0.5) / GW, (y + 0.5) / GH)) g[y * GW + x] = 1;
    }catch(e){}
    return g;
  }
  function bfs(sx, sy, tx, ty, g){
    const S = sy * GW + sx, T = ty * GW + tx;
    if (S === T) return [];
    const prev = new Int32Array(GW * GH).fill(-1);
    const q = [S]; prev[S] = S;
    const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];
    while (q.length){
      const c = q.shift();
      if (c === T) break;
      const cx = c % GW, cy = (c / GW) | 0;
      for (let d = 0; d < 4; d++){
        const nx = cx + DX[d], ny = cy + DY[d];
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const n = ny * GW + nx;
        if (prev[n] !== -1) continue;
        if (g[n] && n !== T) continue;
        prev[n] = c; q.push(n);
      }
    }
    if (prev[T] === -1) return null;
    const path = [];
    let c = T;
    while (c !== S){ path.push(c); c = prev[c]; }
    return path.reverse();
  }
  function clear(){ dots.forEach(function(d){ d.remove(); }); dots = []; lastKey = ''; }
  function uiBusy(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.BD_resultOpen && BD_resultOpen()) return true;
      if (window.__bdGuideOpen) return true;
      if (window.BD_choiceOpen && BD_choiceOpen()) return true;
      const v = el('dialogue-box');
      if (v && v.offsetHeight > 0 && parseFloat(getComputedStyle(v).opacity) > 0.05) return true;
      if (window.__bdSceneActive) return true;
    }catch(e){}
    return false;
  }
  window.BD_addTick(function(){
    window.__bdNavT = (window.__bdNavT || 0) + 1;   // 진단: 틱 수
    try{
      // (v281) 바닥 점 길안내(내비 점선) 비활성 — 발 앞 회전 화살표(BD_drawNavArrow)로
      //  안내를 일원화한다. 다시 켜려면 콘솔에서 window.__BD_NAVPATH_ON = true.
      if (!window.__BD_NAVPATH_ON){ window.__bdNavW = 'off'; clear(); return; }
      const gs = el('game-screen');
      if (!gs || gs.style.display !== 'block' || uiBusy()){ window.__bdNavW = 'busy'; clear(); return; }
      // (v232) 프롤로그 중엔 튜토리얼 목표(데스크→엘리베이터)를 길안내
      let goal = window.__bdTut2Goal || (window.__bdGoalDbg ? window.__bdGoalDbg() : null);
      if (!goal || goal.d < 0.14){ window.__bdNavW = 'nogoal'; clear(); return; }
      window.__bdNavW = 'run';
      const g = blockedGrid();
      const sx = Math.max(0, Math.min(GW - 1, Math.floor(heroX * GW)));
      const sy = Math.max(0, Math.min(GH - 1, Math.floor(heroY * GH)));
      const tx = Math.max(0, Math.min(GW - 1, Math.floor(goal.cx * GW)));
      const ty = Math.max(0, Math.min(GH - 1, Math.floor(goal.cy * GH)));
      if (g[sy * GW + sx]) g[sy * GW + sx] = 0;   // 자기 칸은 통행 취급
      const path = bfs(sx, sy, tx, ty, g);
      if (!path || !path.length){ clear(); return; }
      const key = currentStage + ':' + sx + ',' + sy + '>' + tx + ',' + ty;
      const c = container();
      if (key !== lastKey){
        clear(); lastKey = key;
        const step = Math.max(1, Math.floor(path.length / 26));   // 최대 ~26개 점
        for (let i = 0; i < path.length - 1; i += step){
          const d = document.createElement('div');
          d.className = 'bd-nav-dot';
          d.style.cssText = 'position:fixed;width:9px;height:9px;border-radius:50%;'
            + 'background:rgba(255,216,77,.85);box-shadow:0 0 7px rgba(255,216,77,.8);'
            + 'transform:translate(-50%,-50%);pointer-events:none;'
            + 'animation:bdGoalPulse 1.3s ease-in-out infinite;'
            + 'animation-delay:' + ((i % 8) * 0.1) + 's;';
          d.dataset.cell = path[i];
          c.appendChild(d); dots.push(d);
        }
      }
      // 카메라 이동 반영: 매 틱 위치 갱신
      dots.forEach(function(d){
        const cell = +d.dataset.cell;
        const wx = (cell % GW + 0.5) / GW, wy = (((cell / GW) | 0) + 0.5) / GH;
        const p = toScreen(wx, wy);
        if (p){ d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; d.style.display = 'block'; }
        else d.style.display = 'none';
      });
    }catch(e){ clear(); }
  }, 350);
})();
