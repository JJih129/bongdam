/* (v398) 탭 이동 — 멀리 있는 건물·NPC·위험요소를 누르면 그 앞까지 알아서 걸어간다.
 *
 * 왜:
 *   모바일은 드래그로만 이동해서, 화면 반대편 목표까지 손가락을 계속 끌어야 한다.
 *   보이는 것을 눌러 «거기로 가는» 조작이 훨씬 자연스럽다.
 *
 * 0249 와의 역할 분담:
 *   0249(플로팅 조이스틱)는 «상호작용 거리 «안»의 대상»을 짧게 탭하면 F 를 보낸다.
 *   이 블록은 «거리 «밖»의 대상»만 맡는다. 서로 겹치지 않는다.
 *
 * 길찾기:
 *   검수도구/path.js 가 쓰던 방식을 그대로 가져왔다 — 게임 자신의 _collidesAt 으로
 *   BFS 를 돌려 «실제 플레이어가 돌아가는 경로»를 재현한다. 별도 맵 데이터가 필요 없다.
 *   실측: 충돌 판정 6,400회에 5ms → 160x160 전면 탐색도 20ms 수준이라 탭마다 한 번 돌려도 된다.
 *
 * 대상 선택 방식:
 *   처음에는 «어느 오브젝트를 눌렀나»를 맞히려 했으나 버렸다. 스테이지 101 은 오브젝트
 *   61개가 전부 wall/prop 이고 interactable 이 하나도 없다 — 건물·NPC·위험요소가 서로
 *   다른 시스템에 흩어져 있어 한 곳을 훑어서는 대상을 못 찾는다.
 *   대신 «누른 지점으로 걸어간다». 보이는 것을 누르면 그 앞으로 가므로 결과는 같고,
 *   어떤 시스템의 대상이든 똑같이 동작한다.
 *   canvasToMap 이 전역이 아니라, BD_screenRectOfWorld 가 선형이라는 점을 이용해
 *   두 표본으로 역변환을 유도한다.
 */
(function () {
  'use strict';

  if (!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;

  var N = 128;            /* 격자 해상도 — path.js 의 160 보다 낮춰 폰에서 더 가볍게 */
  var ARRIVE = 0.055;     /* 이 거리 안에 들면 도착으로 보고 F 를 보낸다 */
  var STEP_AHEAD = 0.035; /* 다음 목표점을 이 정도 앞에서 잡는다 */
  var MAX_MS = 20000;     /* 안전장치 — 이보다 오래 걸리면 포기 */
  var STUCK_MS = 2200;    /* 진행이 없으면 포기 */
  var TAP_MOVE = 12, TAP_TIME = 350;

  var travel = null;      /* { path, i, t0, lastMoveAt, lastX, lastY, target } */

  function g(n) { try { return eval(n); } catch (e) { return undefined; } }
  function playable() {
    try {
      var s = document.getElementById('game-screen');
      if (!s || s.style.display !== 'block') return false;
      if (window.BD_isInputBlocked && BD_isInputBlocked()) return false;
      return typeof heroX === 'number' && typeof _collidesAt === 'function' && typeof moveKeys === 'object';
    } catch (e) { return false; }
  }
  function setMove(w, a, s, d) {
    try { if (typeof moveKeys === 'undefined') return; moveKeys.w = !!w; moveKeys.a = !!a; moveKeys.s = !!s; moveKeys.d = !!d; } catch (e) {}
  }

  /* ── 길찾기 (path.js 이식) ── */
  function findPath(tx, ty) {
    try {
      var wk = (STAGES[currentStage] && STAGES[currentStage].walk) || {};
      var x0 = isFinite(wk.x0) ? wk.x0 : 0.01, y0 = isFinite(wk.y0) ? wk.y0 : 0.01;
      var x1 = isFinite(wk.x1) ? wk.x1 : 0.99, y1 = isFinite(wk.y1) ? wk.y1 : 0.99;
      var EDGE = 0.036;
      var tgtEdge = (tx < EDGE || tx > 1 - EDGE || ty < EDGE || ty > 1 - EDGE);
      var sx0 = heroX, sy0 = heroY;
      function blocked(x, y) {
        /* 지역 게이트 밴드는 목표가 그 안일 때만 지난다 — 가장자리를 지름길로 잡아
           엉뚱한 지역으로 넘어가 버리는 것을 막는다(path.js 의 v368 대응과 같은 이유). */
        if (!tgtEdge && (x < EDGE || x > 1 - EDGE || y < EDGE || y > 1 - EDGE)
            && Math.hypot(x - sx0, y - sy0) > 0.08) return true;
        try { return _collidesAt(x, y); } catch (e) { return false; }
      }
      var cv = function (i) { return i / N; }, ci = function (v) { return Math.max(0, Math.min(N - 1, Math.round(v * N))); };
      var key = function (i, j) { return i * N + j; };
      var si = ci(heroX), sj = ci(heroY);
      var prev = new Map(), q = [], head = 0;
      if (!blocked(cv(si), cv(sj))) { prev.set(key(si, sj), null); q.push([si, sj]); }
      else {
        for (var r = 1; r <= 4 && !q.length; r++)
          for (var di = -r; di <= r; di++) for (var dj = -r; dj <= r; dj++) {
            if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
            var i2 = si + di, j2 = sj + dj;
            if (i2 < 0 || j2 < 0 || i2 >= N || j2 >= N || blocked(cv(i2), cv(j2)) || prev.has(key(i2, j2))) continue;
            prev.set(key(i2, j2), null); q.push([i2, j2]);
          }
      }
      if (!q.length) return null;
      var D = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      while (head < q.length) {
        var cur = q[head++], i = cur[0], j = cur[1];
        for (var k = 0; k < D.length; k++) {
          var ni = i + D[k][0], nj = j + D[k][1];
          if (ni < 0 || nj < 0 || ni >= N || nj >= N || prev.has(key(ni, nj))) continue;
          var px = cv(ni), py = cv(nj);
          if (px < x0 || px > x1 || py < y0 || py > y1 || blocked(px, py)) continue;
          /* 대각선은 양옆이 다 열려 있을 때만 — 벽 모서리를 뚫고 지나가지 않게 */
          if (D[k][0] && D[k][1] && (blocked(cv(i + D[k][0]), cv(j)) || blocked(cv(i), cv(j + D[k][1])))) continue;
          prev.set(key(ni, nj), [i, j]); q.push([ni, nj]);
        }
      }
      /* 목표에 가장 가까운 «닿을 수 있는» 칸 */
      var best = null, bestD = Infinity;
      prev.forEach(function (_, kk) {
        var i = Math.floor(kk / N), j = kk % N;
        var d = Math.hypot(cv(i) - tx, cv(j) - ty);
        if (d < bestD) { bestD = d; best = [i, j]; }
      });
      if (!best || bestD > 0.25) return null;
      var out = [], node = best;
      while (node) { out.push([cv(node[0]), cv(node[1])]); node = prev.get(key(node[0], node[1])); }
      out.reverse();
      return out;
    } catch (e) { return null; }
  }

  /* ── 화면 좌표 → 월드 좌표 ──
     canvasToMap 은 전역이 아니라 쓸 수 없다. 대신 BD_screenRectOfWorld 가 선형 변환이라는
     점을 이용해 두 지점을 표본으로 역변환을 유도한다. 같은 크기의 사각형을 쓰므로
     사각형 크기에서 오는 치우침은 상쇄된다.
     («어느 오브젝트를 눌렀나»를 맞히는 방식은 쓰지 않는다 — 스테이지 101 은 61개가 전부
       wall/prop 이고 interactable 이 하나도 없어, 대상이 여러 시스템에 흩어져 있다.
       «누른 지점으로 걸어간다»가 더 단순하고 건물·NPC·위험요소를 한꺼번에 다룬다.) */
  function screenToWorld(sx, sy) {
    try {
      if (typeof window.BD_screenRectOfWorld !== 'function') return null;
      var S = 0.02;
      var a = BD_screenRectOfWorld(0.20, 0.20, S, S);
      var b = BD_screenRectOfWorld(0.80, 0.80, S, S);
      if (!a || !b) return null;
      var kx = (b.left - a.left) / 0.6, ky = (b.top - a.top) / 0.6;
      if (!isFinite(kx) || !isFinite(ky) || Math.abs(kx) < 1e-6 || Math.abs(ky) < 1e-6) return null;
      return { x: 0.20 + (sx - a.left) / kx, y: 0.20 + (sy - a.top) / ky };
    } catch (e) { return null; }
  }

  /* ── 목적지 표시 ── */
  var mark = null;
  function showMark(on) {
    try {
      if (!mark) {
        mark = document.createElement('div');
        mark.id = 'bd-travel-mark-v398';
        mark.style.cssText = 'position:fixed;z-index:838;pointer-events:none;display:none;'
          + 'width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;'
          + 'border:3px solid rgba(255,216,107,.95);box-shadow:0 0 14px rgba(255,216,107,.6);';
        document.body.appendChild(mark);
      }
      if (!on || !travel) { mark.style.display = 'none'; return; }
      var z = 1; try { z = parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) {}
      var r = BD_screenRectOfWorld(travel.tx - 0.005, travel.ty - 0.005, 0.01, 0.01);
      if (!r) { mark.style.display = 'none'; return; }
      mark.style.left = ((r.left + r.width / 2) / z) + 'px';
      mark.style.top = ((r.top + r.height / 2) / z) + 'px';
      mark.style.display = 'block';
    } catch (e) {}
  }

  /* 조종 타이머는 «이동 중에만» 돈다.
     상시 33ms 로 돌리면 아무것도 안 할 때도 초당 30회를 깨우게 된다 —
     이 게임은 이미 폴링 루프가 159개(초당 약 560회)라 한 개라도 줄이는 편이 낫다. */
  var ticker = null;
  function startTicker() { if (!ticker) ticker = setInterval(step, 33); }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  function stop(sendF, why) {
    stopTicker();
    setMove(false, false, false, false);
    var t = travel; travel = null;
    window.__bdTravelLastStop = why || (sendF ? '도착' : '중단');
    showMark(false);
    if (sendF && t) {
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', keyCode: 70, which: 70, bubbles: true }));
        setTimeout(function () {
          document.dispatchEvent(new KeyboardEvent('keyup', { key: 'f', code: 'KeyF', keyCode: 70, which: 70, bubbles: true }));
        }, 60);
      } catch (e) {}
    }
  }

  /* ── 매 프레임 조종 ── */
  function step() {
    try {
      if (!travel) return;
      if (!playable()) { stop(false, 'playable=false'); return; }
      var now = Date.now();
      if (now - travel.t0 > MAX_MS) { stop(false, '시간초과'); return; }

      var d = Math.hypot(heroX - travel.tx, heroY - travel.ty);
      if (d <= ARRIVE) { stop(true, '도착'); return; }

      /* 진행이 없으면 포기 — 벽에 끼었거나 경로가 막힌 경우 */
      if (Math.hypot(heroX - travel.lastX, heroY - travel.lastY) > 0.004) {
        travel.lastX = heroX; travel.lastY = heroY; travel.lastMoveAt = now;
      } else if (now - travel.lastMoveAt > STUCK_MS) { stop(false, '진행없음'); return; }

      /* 다음 경유점 — 이미 지난 점은 건너뛴다 */
      var p = travel.path;
      while (travel.i < p.length - 1 && Math.hypot(heroX - p[travel.i][0], heroY - p[travel.i][1]) < STEP_AHEAD) travel.i++;
      var wp = p[travel.i];
      var dx = wp[0] - heroX, dy = wp[1] - heroY;
      var TH = 0.006;
      setMove(dy < -TH, dx < -TH, dy > TH, dx > TH);
      showMark(true);
    } catch (e) { stop(false, 'step 예외: ' + e.message); }
  }

  /* ── 탭 감지 ── */
  var sx = 0, sy = 0, st0 = 0, armed = false;

  function interactiveTarget(el) {
    for (var e = el; e && e !== document.body; e = e.parentElement) {
      if (!e.tagName) break;
      var t = e.tagName.toLowerCase();
      if (t === 'button' || t === 'a' || t === 'input' || t === 'select') return true;
      if (e.className && /\b(btn|tc-btn|modal|bd-modal|tc-joy)\b/.test(String(e.className))) return true;
    }
    return false;
  }

  addEventListener('pointerdown', function (e) {
    if (!e.isPrimary) { armed = false; return; }
    /* 조작을 시작하면 진행 중인 자동 이동은 즉시 멈춘다 — 조종권은 항상 사용자에게 */
    if (travel) stop(false);
    sx = e.clientX; sy = e.clientY; st0 = Date.now();
    armed = playable() && !interactiveTarget(e.target);
  }, true);

  addEventListener('pointerup', function (e) {
    if (!armed || !e.isPrimary) return;
    armed = false;
    if (Date.now() - st0 > TAP_TIME) return;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > TAP_MOVE) return;   /* 드래그는 이동 조작 */
    if (!playable()) return;

    var w = screenToWorld(e.clientX, e.clientY);
    if (!w) return;
    if (w.x < 0 || w.x > 1 || w.y < 0 || w.y > 1) return;
    /* 사거리 «안»이면 0249 가 F 를 보낸다 — 여기서는 손대지 않는다 */
    if (Math.hypot(heroX - w.x, heroY - w.y) <= ARRIVE * 1.4) return;

    var path = findPath(w.x, w.y);
    if (!path || path.length < 2) return;
    travel = { path: path, i: 0, tx: w.x, ty: w.y, t0: Date.now(),
               lastX: heroX, lastY: heroY, lastMoveAt: Date.now() };
    startTicker();
    showMark(true);
  }, true);

  addEventListener('pointercancel', function () { armed = false; if (travel) stop(false); }, true);


  window.BD_TRAVEL = {
    active: function () { return !!travel; },
    stop: function () { stop(false); },
    to: function (x, y) { var p = findPath(x, y); if (!p) return false;
      travel = { path: p, i: 0, tx: x, ty: y, t0: Date.now(), lastX: heroX, lastY: heroY, lastMoveAt: Date.now() };
      startTicker();
      return true; },
    toScreen: screenToWorld, path: findPath
  };
})();
