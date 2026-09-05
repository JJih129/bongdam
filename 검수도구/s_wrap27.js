// v360 검증 — 지도 와우리 3시설 수동 패치 + 터치 물러나기 44px
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
  await h.page.evaluate(() => { BD_openSafetyMap(); });
  await h.wait(1200);
  const d = await h.page.evaluate(() => {
    const b = document.getElementById('bd-map-v342-board');
    return {
      manual: [...b.querySelectorAll('[data-v360]')].map(x => x.getAttribute('data-v360') + ':' + x.className),
      dims: b.querySelectorAll('.m42-dimp').length,
    };
  });
  say('지도 수동 3건: ' + JSON.stringify(d));
  const ok = d.manual.length === 3;
  say((ok ? '✅' : '❌') + ' 파출소·드림문구·와우약국 표시');
  await h.shot('wrap_map');
  // 수동 패치 클릭 → 추적
  const t1 = await h.page.evaluate(() => {
    const el = document.querySelector('[data-v360="드림문구"]');
    if (el && el.classList.contains('m42-dimp')) { el.click(); return true; }
    return false;
  });
  await h.wait(800);
  const t2 = await h.page.evaluate(() => window.__bdTrack ? __bdTrack.label : null);
  say(((t1 && t2) ? '✅' : (t1 ? '❌' : '⚠(방문 상태)')) + ' 수동 패치 클릭 추적 (' + t2 + ')');
  await h.page.evaluate(() => { try { BD_mapTrackClear(); } catch (e) { } });
  say('콘솔 오류: ' + h.consoleErrors.length);
};
