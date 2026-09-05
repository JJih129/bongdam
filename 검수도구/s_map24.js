// 안전지도 v343(배치도 원판+오버레이) 검증
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

  const dump = async () => await h.page.evaluate(() => {
    const d = document.getElementById('bd-map-v342');
    if (!d) return null;
    const b = document.getElementById('bd-map-v342-board');
    return {
      show: d.classList.contains('show'),
      bg: (b.style.backgroundImage || '').length > 100,
      names: [...b.querySelectorAll('.m42-rname')].map(x => x.textContent),
      locks: b.querySelectorAll('.m42-lockov').length,
      dims: b.querySelectorAll('.m42-dimp').length,
      chks: b.querySelectorAll('.m42-vchk').length,
      hz: b.querySelectorAll('.m42-hz').length,
      pure: b.querySelectorAll('.m42-pure').length,
      stats: (document.getElementById('bd-map-v342-stats') || {}).textContent,
    };
  });

  await h.page.evaluate(() => { BD_openSafetyMap(); });
  await h.wait(900);
  const d1 = await dump();
  say('① 초기: ' + JSON.stringify(d1));
  const ok1 = d1 && d1.show && d1.bg && d1.names.length === 4 && d1.locks === 3 && d1.hz > 0 && d1.dims > 0;
  say((ok1 ? '✅' : '❌') + ' ① 원판 배경 + 4구획 + 잠금3 + 어둠패치 + ⚠마커');
  await h.shot('board_init');

  const blocked = await h.page.evaluate(() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } });
  say((blocked === true ? '✅' : '❌') + ' ② 입력 차단');

  await h.page.keyboard.press('Escape'); await h.wait(500);
  const escd = await h.page.evaluate(() => !document.getElementById('bd-map-v342').classList.contains('show'));
  await h.page.keyboard.press('m'); await h.wait(600);
  const mo = await h.page.evaluate(() => document.getElementById('bd-map-v342').classList.contains('show'));
  await h.page.keyboard.press('m'); await h.wait(500);
  const mc = await h.page.evaluate(() => !document.getElementById('bd-map-v342').classList.contains('show'));
  say(((escd && mo && mc) ? '✅' : '❌') + ` ③ ESC/M (${escd}/${mo}/${mc})`);

  await h.page.evaluate(() => {
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
  say('④ 전이 후: ' + JSON.stringify(d2));
  const ok4 = d2 && d2.pure > (d1.pure || 0) && d2.chks > d1.chks && d2.locks === 2;
  say((ok4 ? '✅' : '❌') + ' ④ 정화 마커 · 방문 ✓ · 동화리 해금');
  await h.shot('board_progress');
  await h.page.keyboard.press('Escape'); await h.wait(300);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
