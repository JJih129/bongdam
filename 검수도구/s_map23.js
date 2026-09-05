// 안전지도 v342 리디자인 검증 — 패널·아이콘·상태 전이·키 조작
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(350); }

  const dump = async () => await h.page.evaluate(() => {
    const d = document.getElementById('bd-map-v342');
    if (!d) return null;
    const regions = [...d.querySelectorAll('.m42-region')].map(r => ({
      name: (r.querySelector('.m42-rname') || {}).textContent,
      pct: (r.querySelector('.m42-pct') || {}).textContent,
      locked: r.classList.contains('m42-locked'),
      bgOn: (r.style.backgroundImage || '').length > 50,
      fac: r.querySelectorAll('.m42-fac').length,
      lit: r.querySelectorAll('.m42-lit').length,
      hz: r.querySelectorAll('.m42-hz').length,
      pure: r.querySelectorAll('.m42-pure').length,
      shop: r.querySelectorAll('.m42-shop').length,
      imgs: r.querySelectorAll('.m42-fac img').length,
    }));
    return { show: d.classList.contains('show'), regions, tip: (document.getElementById('bd-map-v342-tip') || {}).textContent, stats: (document.getElementById('bd-map-v342-stats') || {}).textContent };
  });

  // ① 열기 (전역 호출 = 상단 버튼 경로)
  await h.page.evaluate(() => { BD_openSafetyMap(); });
  await h.wait(900);
  const d1 = await dump();
  say('① 초기: ' + JSON.stringify(d1, null, 0).slice(0, 700));
  const ok1 = d1 && d1.show && d1.regions.length === 4 && d1.regions.every(r => r.bgOn);
  say((ok1 ? '✅' : '❌') + ' ① 4패널 + 배경 에셋');
  const iconed = d1 && d1.regions.reduce((a, r) => a + r.imgs, 0);
  say('  시설 아이콘 이미지 수: ' + iconed);
  await h.shot('map_init');

  // ② 입력 차단 (이동 잠금)
  const blocked = await h.page.evaluate(() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } });
  say((blocked === true ? '✅' : '❌') + ' ② 지도 열림 중 입력 차단 (' + blocked + ')');

  // ③ ESC 닫기 → M 키 열기/닫기
  await h.page.keyboard.press('Escape'); await h.wait(500);
  const closed = await h.page.evaluate(() => !document.getElementById('bd-map-v342').classList.contains('show'));
  await h.page.keyboard.press('m'); await h.wait(600);
  const mOpen = await h.page.evaluate(() => document.getElementById('bd-map-v342').classList.contains('show'));
  await h.page.keyboard.press('m'); await h.wait(500);
  const mClosed = await h.page.evaluate(() => !document.getElementById('bd-map-v342').classList.contains('show'));
  say(((closed && mOpen && mClosed) ? '✅' : '❌') + ` ③ ESC/M 토글 (esc=${closed} m열기=${mOpen} m닫기=${mClosed})`);

  // ④ 상태 전이 — 정화·방문·해금 반영
  await h.page.evaluate(() => {
    // 와우리 위험요소 하나 정화 + 시설 하나 방문 + 동화리 해금
    const st = STAGES[212];
    const hz = (st.objects || []).find(o => o && o.hazardId && !o.isBoss);
    if (hz) { BD.purified = BD.purified || {}; BD.purified[hz.hazardId] = true; }
    const FD = BD_REGISTRY.FACILITY_DEFINITIONS;
    Object.keys(FD).filter(k => FD[k].regionId === 'wawoo').forEach(fid => {
      if (BD_PROGRESS.facility.visitedFacilityIds.indexOf(fid) < 0) BD_PROGRESS.facility.visitedFacilityIds.push(fid);
    });
    if (BD_PROGRESS.story.unlockedRegionIds.indexOf('donghwa') < 0) BD_PROGRESS.story.unlockedRegionIds.push('donghwa');
  });
  await h.page.evaluate(() => { BD_openSafetyMap(); });
  await h.wait(900);
  const d2 = await dump();
  say('④ 전이 후: ' + JSON.stringify(d2 && d2.regions, null, 0).slice(0, 600));
  const waw1 = d1.regions.find(r => r.name === '와우리'), waw2 = d2.regions.find(r => r.name === '와우리');
  const don2 = d2.regions.find(r => r.name === '동화리');
  const ok4 = waw2 && waw1 && waw2.pure > waw1.pure && waw2.lit > waw1.lit && don2 && !don2.locked;
  say((ok4 ? '✅' : '❌') + ' ④ 정화→마커 교체 · 방문→밝아짐 · 해금→잠금 해제');
  await h.shot('map_progress');
  await h.page.keyboard.press('Escape'); await h.wait(400);

  // ⑤ 구 v283 지도 뜨면 자동 전환
  await h.page.evaluate(() => { const old = document.getElementById('bd-map-v283'); if (old) old.style.display = 'flex'; });
  await h.wait(1200);
  const swapped = await h.page.evaluate(() => {
    const old = document.getElementById('bd-map-v283');
    const neo = document.getElementById('bd-map-v342');
    return { oldHidden: !old || old.style.display === 'none', neoShown: neo && neo.classList.contains('show') };
  });
  say(((swapped.oldHidden && swapped.neoShown) ? '✅' : '❌') + ' ⑤ 구지도 억제·신지도 대체 ' + JSON.stringify(swapped));
  await h.page.keyboard.press('Escape'); await h.wait(300);

  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
