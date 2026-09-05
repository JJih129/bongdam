/* (v376) 크로스브라우저·해상도 스모크 — 부팅→캐릭터 선택→월드 진입→BGM 디코드→지도 열기→스크린샷
   실행: BROWSER=webkit VW=844 VH=390 SHOTS_DIR=shots_matrix node drive.js s_compat.js --url=http://127.0.0.1:47821/... */
module.exports = async (h) => {
  const say = h.say, page = h.page;
  const tag = (process.env.BROWSER || 'chromium') + '_' + (process.env.VW || 1280) + 'x' + (process.env.VH || 800) + (process.env.TOUCH === '1' ? '_touch' : '');
  const R = { tag };
  // 타이틀
  await h.wait(1500);
  R.title = await page.evaluate(() => !!document.getElementById('bd-title-start'));
  await h.click('#bd-title-start'); await h.wait(1200);
  for (let t = 0; t < 15; t++) {
    await page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} });
    await h.wait(500);
    if (await page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break;
  }
  for (let t = 0; t < 60; t++) { const s = await page.evaluate(() => { try { return Number(currentStage); } catch (e) { return 0; } }); if (s >= 100) break; await h.wait(300); }
  R.stage101 = await page.evaluate(() => Number(currentStage));
  // 월드로
  await page.evaluate(() => { ['bd_dami_awake','bd_tut2_done','bd_dami_tutorial_done','bd_battle_tutorial_done','bd_shop_tutorial_done_v75'].forEach(k => { try { localStorage.setItem(k, '1'); } catch (e) {} }); });
  await page.evaluate(() => { try { fadeToStage(212, 0.4, 0.4); } catch (e) {} });
  await h.wait(2000);
  // 오프닝 대사 드레인 (입력 잠금 해제까지)
  for (let t = 0; t < 20; t++) {
    const busy = await page.evaluate(() => { try { return (window.BD_isInputBlocked && BD_isInputBlocked()) || !!window.__bdDamiOpeningBusy; } catch (e) { return false; } });
    if (!busy) break;
    await page.keyboard.press(' '); await h.wait(600);
  }
  // 오디오 디코드 확인 (mp3 폴백 포함) — 하네스 웹킷엔 AudioContext 가 없어 N/A 처리
  const hasAC = await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext));
  if (!hasAC) R.bgm = 'NA_headless_webkit';
  else for (let t = 0; t < 12; t++) {
    R.bgm = await page.evaluate(() => { try { const d = BD_BgmReal._dbg(); return { ogg: BD_BgmReal.oggOK, cur: d.cur, n: d.buffers.length, playing: d.playing }; } catch (e) { return { err: String(e) }; } });
    if (R.bgm && R.bgm.n >= 1) break;
    await h.wait(700);
  }
  // 이동 확인
  const p0 = await page.evaluate(() => [heroX, heroY]);
  await h.hold('d', 700);
  const p1 = await page.evaluate(() => [heroX, heroY]);
  R.moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 0.005;
  // UI 상태
  R.ui = await page.evaluate(() => ({
    zoomOK: window.__bdZoomOK !== false,
    zoom: getComputedStyle(document.body).zoom || '',
    canvas: (function(){ const c = document.getElementById('game-canvas'); return c ? c.width + 'x' + c.height : null; })(),
    keybar: (function(){ const k = document.getElementById('bd-keybar'); return !!(k && k.offsetHeight); })(),
    touchCtl: (function(){ const t = document.getElementById('bd-touch-controls'); return !!(t && t.offsetHeight); })(),
    errors: 0
  }));
  await h.shot('mx_' + tag + '_field');
  // 지도 (backdrop-filter 경로)
  await page.evaluate(() => { try { BD_openSafetyMap(); } catch (e) {} });
  await h.wait(900);
  R.map = await page.evaluate(() => !!(document.getElementById('bd-map-v342') && document.getElementById('bd-map-v342').classList.contains('show')));
  await h.shot('mx_' + tag + '_map');
  R.consoleErrors = h.consoleErrors.filter(e => !/Permissions check|Ignored attempt|자동 재생|play\(\) failed|NotAllowedError/i.test(e)).slice(0, 4);
  say('RESULT ' + JSON.stringify(R));
};
