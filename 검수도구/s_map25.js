// v346 지도 개선 검증 — 클린보드·채도0패치·클릭추적·완성패널·엔딩 점등
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }

  // ① 지도: 클린보드 + 채도0 패치 + 정화 부유
  await h.page.evaluate(() => {
    const hz = (STAGES[212].objects || []).find(o => o && o.hazardId && !o.isBoss);
    if (hz) { BD.purified = BD.purified || {}; BD.purified[hz.hazardId] = true; }
    BD_openSafetyMap();
  });
  await h.wait(900);
  const d1 = await h.page.evaluate(() => {
    const b = document.getElementById('bd-map-v342-board');
    const dimp = b.querySelector('.m42-dimp');
    const cs = dimp ? getComputedStyle(dimp) : null;
    return {
      done: !!window.__BD_MAP_DONE && Object.keys(window.__BD_MAP_DONE).length,
      dims: b.querySelectorAll('.m42-dimp').length,
      filt: cs ? (cs.backdropFilter || cs.webkitBackdropFilter) : null,
      bg: cs ? cs.backgroundColor : null,
      click: dimp ? (dimp.getAttribute('onclick') || '').slice(0, 40) : null,
      float: b.querySelectorAll('.m42-pure.m42-float, .m42-mk.m42-float').length,
      hz: b.querySelectorAll('.m42-hz').length,
    };
  });
  say('① ' + JSON.stringify(d1));
  const ok1 = d1.done === 4 && d1.dims > 0 && /saturate/.test(d1.filt || '') && !/brightness/.test(d1.filt || '')
    && /BD_mapTrackStart/.test(d1.click || '') && d1.float >= 1;
  say((ok1 ? '✅' : '❌') + ' ① 채도0 패치 + 클릭 핸들러 + 정화 부유 + 완성패널 4종 로드');
  await h.shot('m25_map');

  // ② 클릭 → 추적 시작 → 지도 닫힘 + 칩 표시 + 화살표 회전 → 접근 시 자동 해제
  const target = await h.page.evaluate(() => {
    const b = document.getElementById('bd-map-v342-board');
    const dimp = [...b.querySelectorAll('.m42-dimp')][0];
    if (!dimp) return null;
    const r = dimp.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: dimp.title };
  });
  say('② 클릭 대상: ' + JSON.stringify(target));
  if (target) {
    const hit = await h.page.evaluate((p) => {
      const el = document.elementFromPoint(p.x, p.y);
      return el ? (el.className || el.id || el.tagName).toString().slice(0, 40) : null;
    }, target);
    say('② 히트테스트: ' + hit);
    await h.page.mouse.click(target.x, target.y);
    await h.wait(600);
    const viaMouse = await h.page.evaluate(() => !!window.__bdTrack);
    if (!viaMouse) {
      say('② 마우스 직격 실패 → 요소 클릭으로 재시도');
      await h.page.evaluate(() => { const d = document.querySelector('#bd-map-v342-board .m42-dimp'); if (d) d.click(); });
    }
    await h.wait(900);
    const t1 = await h.page.evaluate(() => ({
      track: window.__bdTrack ? { sid: __bdTrack.sid, label: __bdTrack.label } : null,
      mapClosed: !document.getElementById('bd-map-v342').classList.contains('show'),
      chip: (() => { const c = document.getElementById('bd-track-chip'); return c && c.classList.contains('on'); })(),
      chipText: (document.getElementById('bd-track-chip') || {}).textContent || '',
    }));
    say('② 추적 상태: ' + JSON.stringify(t1).slice(0, 200));
    say(((t1.track && t1.mapClosed && t1.chip) ? '✅' : '❌') + ' ② 클릭→추적 시작·지도 닫힘·칩 표시');
    await h.shot('m25_track');
    // 해당 리로 이동 후 대상 위치 접근 → 도착 자동 해제
    await h.page.evaluate(() => { if (window.__bdTrack) fadeToStage(__bdTrack.sid, 0.5, 0.5); });
    await h.wait(1800);
    await h.page.evaluate(() => { if (window.__bdTrack) { heroX = __bdTrack.wx + 0.01; heroY = __bdTrack.wy; camX = heroX; camY = heroY; } });
    await h.wait(1200);
    const t2 = await h.page.evaluate(() => ({ track: !!window.__bdTrack, chipOn: (() => { const c = document.getElementById('bd-track-chip'); return c && c.classList.contains('on'); })() }));
    say(((!t2.track && !t2.chipOn) ? '✅' : '❌') + ' ② 도착 시 자동 해제 ' + JSON.stringify(t2));
  }

  // ③ 완성 리 → 스카이블루 패널 (region calc 오버라이드로 강제)
  await h.page.evaluate(() => {
    if (!window.__origRegion) window.__origRegion = BD_MapProgress.region;
    BD_MapProgress.region = function (id) { const r = window.__origRegion(id); if (id === 'wawoo') r.core = true; return r; };
    BD_openSafetyMap();
  });
  await h.wait(900);
  const d3 = await h.page.evaluate(() => {
    const b = document.getElementById('bd-map-v342-board');
    const im = b.querySelector('.m42-donebg');
    return { n: b.querySelectorAll('.m42-donebg').length, src: im ? im.src.slice(0, 22) : null };
  });
  say(((d3.n === 1 && (d3.src || '').startsWith('data:image/webp')) ? '✅' : '❌') + ' ③ 완성 리 스카이블루 패널 ' + JSON.stringify(d3));
  await h.shot('m25_done');
  await h.page.evaluate(() => { BD_MapProgress.region = window.__origRegion; });
  await h.page.keyboard.press('Escape'); await h.wait(400);

  // ④ 엔딩 — 점등 연출
  await h.page.evaluate(() => {
    BD.purified = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1, j: 1, k: 1, l: 1, m: 1 };
    try { localStorage.setItem('bd_play_started', String(Date.now() - 15 * 60000)); } catch (e) { }
    let m = document.getElementById('bd-ending-modal');
    if (!m) { m = document.createElement('div'); m.id = 'bd-ending-modal'; document.body.appendChild(m); }
    m.classList.add('show');
  });
  await h.wait(1000);
  await h.shot('m25_end1');
  const e1 = await h.page.evaluate(() => {
    const f = document.getElementById('bd-ending-fx2');
    return f ? { dones: f.querySelectorAll('.e2-done').length, sparks: f.querySelectorAll('.e2-spark').length } : null;
  });
  say(((e1 && e1.dones === 4 && e1.sparks > 10) ? '✅' : '❌') + ' ④ 엔딩 점등 패널 4 + 반짝 ' + JSON.stringify(e1));
  await h.wait(2600);
  await h.shot('m25_end2');
  await h.wait(2500);
  await h.shot('m25_end3');
  await h.wait(5000);
  const e2 = await h.page.evaluate(() => !document.getElementById('bd-ending-fx2'));
  say((e2 ? '✅' : '❌') + ' ④ 자동 정리');

  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 8).forEach(e => say('  ! ' + e.slice(0, 160)));
};
