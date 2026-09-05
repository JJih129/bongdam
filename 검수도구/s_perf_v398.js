/* (v398) 런타임 성능 측정 시나리오 — 로딩이 아니라 «플레이 중» 프레임을 잰다.
 *
 * 왜 이 시나리오가 필요한가:
 *   인앱 브라우저 패널이 숨겨지면 requestAnimationFrame 이 멈춰 0 프레임이 나온다.
 *   drive.js 는 Playwright 라 rAF 가 정상 동작하고 VW/VH/DPR/TOUCH 까지 지정된다.
 *
 * 사용:
 *   VW=852 VH=340 DPR=3 TOUCH=1 node drive.js s_perf_v398.js --url=http://localhost:8788/new/
 *   VW=1280 VH=800 DPR=2      node drive.js s_perf_v398.js --url=http://localhost:8788/base/
 *
 * 보는 지표: 평균 FPS 는 참고용이고 «p95 프레임 시간»이 체감을 결정한다.
 */
'use strict';

/* 페이지 안에서 rAF 로 프레임 간격을 모은다 */
async function sample(h, ms, label) {
  const r = await h.page.evaluate(async (ms) => {
    const gaps = [];
    let last = performance.now();
    const t0 = last;
    await new Promise(res => {
      function tick(now) {
        gaps.push(now - last); last = now;
        if (now - t0 < ms) requestAnimationFrame(tick); else res();
      }
      requestAnimationFrame(tick);
      setTimeout(res, ms + 3000);          /* rAF 가 아예 안 돌 때 탈출 */
    });
    const el = performance.now() - t0;
    const g = gaps.slice(1);               /* 첫 간격은 측정 시작 오차 */
    const srt = g.slice().sort((a, b) => a - b);
    const p = q => srt.length ? srt[Math.min(srt.length - 1, Math.floor(srt.length * q))] : 0;
    const c = document.getElementById('game-canvas');
    const rect = c && c.getBoundingClientRect();
    return {
      frames: g.length,
      seconds: +(el / 1000).toFixed(1),
      fps: g.length ? +(g.length / (el / 1000)).toFixed(1) : 0,
      p50: Math.round(p(.5)), p95: Math.round(p(.95)), p99: Math.round(p(.99)),
      worst: Math.round(srt.length ? srt[srt.length - 1] : 0),
      jank33: g.filter(x => x > 33).length,
      jank100: g.filter(x => x > 100).length,
      canvas: c ? (c.width + 'x' + c.height) : '-',
      canvasMpx: c ? +((c.width * c.height) / 1e6).toFixed(2) : 0,
      표시: rect ? (Math.round(rect.width) + 'x' + Math.round(rect.height)) : '-',
      백버퍼배율: (c && rect && rect.width > 1)
        ? +(c.width / (rect.width * (window.devicePixelRatio || 1))).toFixed(2) : '-',
      zoom: (() => { try { return parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) { return 1; } })(),
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      stage: (() => { try { return typeof currentStage !== 'undefined' ? currentStage : '?'; } catch (e) { return '?'; } })()
    };
  }, ms);
  h.say(`  [${label}] fps ${r.fps}  p50/p95/p99 ${r.p50}/${r.p95}/${r.p99}ms  worst ${r.worst}ms`
    + `  jank ${r.jank33}(심각 ${r.jank100})  frames ${r.frames}`);
  return Object.assign({ label }, r);
}

module.exports = async (h) => {
  const out = [];

  const env = await h.page.evaluate(() => ({
    viewport: innerWidth + 'x' + innerHeight,
    dpr: window.devicePixelRatio,
    touch: navigator.maxTouchPoints,
    ua: navigator.userAgent.slice(0, 60),
    lazy: !!window.__BD_LAZY, tap: !!window.BD_TAP, fit: !!window.BD_FIT, guide: !!window.BD_GUIDE
  }));
  h.say('▶ 환경 ' + JSON.stringify(env));

  /* ── 타이틀에서 측정 (기준선) ── */
  out.push(await sample(h, 5000, '타이틀'));

  /* ── 게임 진입 ── */
  h.say('▶ 진입 시도');
  const clicked = await h.page.evaluate(() => {
    function tap(el) {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
        el.dispatchEvent(new (t.startsWith('pointer') ? PointerEvent : MouseEvent)(t,
          { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 1, isPrimary: true }));
    }
    const byId = document.getElementById('bd-title-start');
    if (byId && byId.offsetHeight > 0) { tap(byId); return '#bd-title-start'; }
    const hits = [...document.querySelectorAll('.bd-title-hit')]
      .map(e => ({ e, y: e.getBoundingClientRect().y })).sort((a, b) => a.y - b.y);
    if (hits[0]) { tap(hits[0].e); return '.bd-title-hit[0]'; }
    return null;
  });
  h.say('  클릭: ' + clicked);

  /* v325+ 는 시작 시 purge→reload→자동 재진입이 일어난다. 모달이 뜰 때까지 기다린다. */
  let modal = false;
  for (let i = 0; i < 30; i++) {
    await h.wait(700);
    modal = await h.page.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2);
    if (modal) break;
  }
  h.say('  캐릭터 모달: ' + (modal ? '표시됨' : '못 찾음'));

  if (modal) {
    /* 카드 선택 → 모달이 다시 그려질 시간을 준 뒤에 버튼을 찾는다.
       (같은 evaluate 안에서 바로 찾으면 재렌더 전이라 «버튼 없음»이 된다) */
    await h.page.evaluate(() => {
      const el = document.getElementById('char-card-1'); if (!el) return;
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
        el.dispatchEvent(new (t.startsWith('pointer') ? PointerEvent : MouseEvent)(t,
          { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 1, isPrimary: true }));
    });
    await h.wait(1200);

    const started = await h.page.evaluate(() => {
      const btns = [...document.querySelectorAll('button, .modal-btn, [role=button]')]
        .filter(b => b.getBoundingClientRect().width > 2);
      const go = btns.find(b => /모험|시작|확인|다음/.test(b.textContent || ''));
      if (!go) return { ok: false, 후보: btns.map(b => (b.textContent || '').trim().slice(0, 12)) };
      const r = go.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      const reachable = hit === go || go.contains(hit);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
        go.dispatchEvent(new (t.startsWith('pointer') ? PointerEvent : MouseEvent)(t,
          { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0, pointerId: 1, isPrimary: true }));
      return { ok: true, 텍스트: (go.textContent || '').trim().slice(0, 14), 도달성: reachable };
    });
    h.say('  ' + JSON.stringify(started));
  }

  /* 필드 진입 대기 */
  let stage = null;
  for (let i = 0; i < 30; i++) {
    await h.wait(1000);
    stage = await h.page.evaluate(() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } });
    if (stage && stage !== 1) break;
  }
  h.say('▶ 스테이지 ' + stage);
  await h.shot('perf_field');

  /* ── 필드 정지 상태 ── */
  out.push(await sample(h, 6000, '필드-정지'));

  /* ── 이동 중 (키 입력을 붙잡고 측정) ── */
  h.say('▶ 이동 중 측정');
  await h.page.keyboard.down('KeyD');
  out.push(await sample(h, 6000, '필드-이동'));
  await h.page.keyboard.up('KeyD');

  /* ── 픽셀 예산 스윕 (SWEEP=1) ──
     렌더 루프가 매 프레임 window.BD_PX_BUDGET 을 읽으므로 재부팅 없이 값만 바꿔 잰다.
     «부드러움 ↔ 선명도» 곡선을 한 번의 부팅으로 확인하기 위한 것. */
  if (process.env.SWEEP === '1') {
    h.say('');
    h.say('▶ 픽셀 예산 스윕 (이동 중)');
    await h.page.keyboard.down('KeyD');
    const list = (process.env.SWEEP_LIST || '1.6,1.3,1.05,0.85,0.7')
      .split(',').map(s => parseFloat(s) * 1e6).filter(n => n > 0);
    for (const b of list) {
      await h.page.evaluate(v => { window.BD_PX_BUDGET = v; }, b);
      await h.wait(900);                      /* 새 백버퍼로 안정될 시간 */
      const r = await sample(h, 4500, (b / 1e6).toFixed(2) + 'Mpx');
      out.push(r);
    }
    await h.page.keyboard.up('KeyD');
  }

  /* ── 결과 ── */
  h.say('');
  h.say('════ 결과 ════');
  h.say('구간         fps    p50   p95   p99  worst  jank  Mpx');
  for (const r of out) {
    h.say(String(r.label).padEnd(12)
      + String(r.fps).padStart(5) + String(r.p50).padStart(7) + String(r.p95).padStart(6)
      + String(r.p99).padStart(6) + String(r.worst).padStart(7) + String(r.jank33).padStart(6)
      + String(r.canvasMpx).padStart(6));
  }
  const last = out[out.length - 1];
  h.say('');
  h.say('캔버스 ' + last.canvas + ' / 표시 ' + last.표시 + ' / 백버퍼배율 ' + last.백버퍼배율 + ' / zoom ' + last.zoom);
  if (last.heapMB != null) h.say('JS힙 ' + last.heapMB + 'MB');
  h.say('콘솔 에러 ' + h.consoleErrors.length + '건');
  if (h.consoleErrors.length) h.say('  ' + h.consoleErrors.slice(0, 3).join(' | '));
};
