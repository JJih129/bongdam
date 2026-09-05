/* (v398) 실기기 성능 계측 HUD — 주소 끝에 ?perf=1 을 붙이면 켜진다.
 *
 * 왜 필요한가:
 *   데스크탑 브라우저의 모바일 에뮬레이션으로는 실제 폰/태블릿의 GPU·발열·메모리를
 *   재현할 수 없다. 특히 이 게임은 캔버스 백버퍼가 «고정 논리 해상도 1200px x DPR»
 *   로 잡히고 body 의 zoom 으로 축소 표시되는 구조라, 화면 크기와 렌더 비용이
 *   비례하지 않는다. 어디서 프레임이 무너지는지는 실기기에서만 알 수 있다.
 *
 * 쓰는 법:
 *   1) 기기 브라우저에서  <주소>?perf=1  로 접속
 *   2) 평소처럼 플레이 (전투·지역 이동·안전지도 열기 등 버벅이는 구간을 지나간다)
 *   3) 좌상단 HUD 를 «길게 눌러» 전체 보고서를 클립보드로 복사 → 붙여넣어 공유
 *
 * 지표:
 *   FPS      최근 1초 프레임 수
 *   p95      느린 쪽 5% 프레임 시간 — 평균 FPS 가 60이어도 이 값이 크면 «툭툭» 끊긴다
 *   jank     33ms(=30fps) 초과 프레임 수 / 100ms 초과(심각) 수
 *   px       캔버스 백버퍼 픽셀 수 — 채우기 비용의 직접 지표
 */
(function () {
  'use strict';
  try {
    if (!/[?&]perf=1/.test(location.search)) return;
  } catch (e) { return; }

  var samples = [];          // 최근 프레임 간격
  var marks = [];            // 구간별 스냅샷
  var jank33 = 0, jank100 = 0, total = 0, worst = 0;
  var last = performance.now(), t0 = last, lastMark = last;

  var el = document.createElement('div');
  el.id = 'bd-perf-hud';
  el.style.cssText =
    'position:fixed;left:6px;top:6px;z-index:2147483000;' +
    'background:rgba(0,0,0,.72);color:#7CFFB2;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;' +
    'padding:6px 8px;border-radius:8px;white-space:pre;pointer-events:auto;' +
    'min-width:132px;border:1px solid rgba(124,255,178,.35);touch-action:none;';
  el.textContent = 'perf 측정 준비...';

  function mount() {
    if (document.body && !document.getElementById('bd-perf-hud')) document.body.appendChild(el);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount); else mount();
  addEventListener('load', mount);

  function pct(arr, p) {
    if (!arr.length) return 0;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    return s[Math.min(s.length - 1, Math.floor(s.length * p))];
  }

  function canvasPx() {
    var n = 0;
    var cs = document.querySelectorAll('canvas');
    for (var i = 0; i < cs.length; i++) n += cs[i].width * cs[i].height;
    return n;
  }

  function stageId() {
    try { return (typeof currentStage !== 'undefined') ? currentStage : '?'; } catch (e) { return '?'; }
  }

  function env() {
    var c = document.getElementById('game-canvas');
    var r = c && c.getBoundingClientRect();
    var zoom = 1;
    try { zoom = parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) {}
    return {
      ua: navigator.userAgent,
      화면: innerWidth + 'x' + innerHeight + ' dpr' + (window.devicePixelRatio || 1),
      zoom: zoom,
      캔버스백버퍼: c ? (c.width + 'x' + c.height) : '-',
      캔버스표시: r ? (Math.round(r.width) + 'x' + Math.round(r.height)) : '-',
      /* 표시 크기가 0이면(캔버스 숨김 상태) 비율은 의미가 없다 */
      백버퍼_대비_표시배율: (c && r && r.width > 1)
        ? +(c.width / (r.width * (window.devicePixelRatio || 1))).toFixed(2) : '-',
      코어: navigator.hardwareConcurrency || '?',
      메모리GB: navigator.deviceMemory || '?',
      터치포인트: navigator.maxTouchPoints || 0
    };
  }

  function tick(now) {
    var d = now - last; last = now;
    if (total > 0) {
      samples.push(d);
      if (samples.length > 600) samples.shift();
      if (d > worst) worst = d;
      if (d > 33) jank33++;
      if (d > 100) jank100++;
    }
    total++;

    if (now - lastMark >= 1000) {
      var recent = samples.slice(-Math.min(samples.length, 120));
      var fps = recent.length ? Math.round(1000 / (recent.reduce(function (a, b) { return a + b; }, 0) / recent.length)) : 0;
      var p95 = Math.round(pct(recent, 0.95));
      var mp = +(canvasPx() / 1e6).toFixed(2);
      el.textContent =
        'FPS ' + fps + '   p95 ' + p95 + 'ms\n' +
        'jank ' + jank33 + ' / 심각 ' + jank100 + '\n' +
        'stage ' + stageId() + '   ' + mp + 'Mpx\n' +
        '최악 ' + Math.round(worst) + 'ms  ' + Math.round((now - t0) / 1000) + 's';
      marks.push({ t: Math.round((now - t0) / 1000), fps: fps, p95: p95, stage: stageId(), mpx: mp });
      if (marks.length > 900) marks.shift();
      lastMark = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function report() {
    var e = env();
    var all = samples.slice();
    var lines = [];
    lines.push('=== 봉담 안전지도 성능 보고서 ===');
    lines.push('측정시간: ' + Math.round((performance.now() - t0) / 1000) + '초, 프레임 ' + total + '개');
    lines.push('평균FPS: ' + (all.length ? Math.round(1000 / (all.reduce(function (a, b) { return a + b; }, 0) / all.length)) : 0));
    lines.push('p50/p95/p99 프레임: ' + Math.round(pct(all, .5)) + ' / ' + Math.round(pct(all, .95)) + ' / ' + Math.round(pct(all, .99)) + ' ms');
    lines.push('최악 프레임: ' + Math.round(worst) + 'ms');
    lines.push('jank(>33ms): ' + jank33 + '   심각(>100ms): ' + jank100);
    lines.push('');
    Object.keys(e).forEach(function (k) { lines.push(k + ': ' + e[k]); });
    if (performance.memory) lines.push('JS힙: ' + Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB');
    lines.push('');
    lines.push('--- 초당 기록 (t초, fps, p95ms, stage, Mpx) ---');
    marks.forEach(function (m) { lines.push([m.t, m.fps, m.p95, m.stage, m.mpx].join(', ')); });
    return lines.join('\n');
  }

  /* 길게 눌러 복사 (탭은 게임 조작을 방해하지 않도록 무시) */
  var pressT = 0;
  el.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); pressT = Date.now(); });
  el.addEventListener('pointerup', function (ev) {
    ev.stopPropagation();
    if (Date.now() - pressT < 500) return;
    var txt = report();
    function done(ok) {
      var old = el.style.borderColor;
      el.style.borderColor = ok ? '#7CFFB2' : '#ff8a8a';
      el.textContent = ok ? '보고서 복사됨\n붙여넣어 공유하세요' : '복사 실패\n콘솔에 출력함';
      setTimeout(function () { el.style.borderColor = old; }, 1500);
    }
    try {
      navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { console.log(txt); done(false); });
    } catch (err) { console.log(txt); done(false); }
  });

  window.BD_PERF = { report: report, env: env, marks: function () { return marks; } };
})();
