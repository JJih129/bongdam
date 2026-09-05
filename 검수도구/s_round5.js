// 라운드 5 검증 — 지도 시설 칩 → 카메라 팬 → 추적
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
  await wait(3500);
  await page.click('#bd-title-start', { timeout: 5000 });
  for (let t = 0; t < 20; t++) {
    await wait(700);
    const ok = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
    if (ok) break;
  }
  // 프롤로그 통과 → 와우리
  for (let i = 0; i < 4; i++) { await page.keyboard.press(' '); await wait(450); }
  await page.keyboard.down('a'); await wait(1500); await page.keyboard.up('a'); await wait(1300);
  await page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await wait(500);
  let talking = false;
  for (let t = 0; t < 10 && !talking; t++) {
    await page.keyboard.press('f'); await wait(700);
    talking = await page.evaluate(() => { const vn = document.getElementById('dialogue-box'); return !!(vn && vn.offsetHeight > 0 && /문화의집 선생님/.test(vn.textContent || '')); });
    if (!talking) { await page.keyboard.press(' '); await wait(400); }
  }
  for (let i = 0; i < 16; i++) { await page.keyboard.press(' '); await wait(500); }
  await wait(1800); await page.keyboard.press(' '); await wait(3500);
  await page.evaluate(() => { heroX = 0.700; heroY = 0.15; camX = heroX; camY = heroY; });
  await wait(3000);
  for (let i = 0; i < 14; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(400); }

  // 지도 열기 → 칩 확인
  await page.keyboard.press('m'); await wait(900);
  const chips = await page.evaluate(() => [...document.querySelectorAll('#bd-map-v283 button[data-bd-fac]')].map(b => b.getAttribute('data-bd-fac')));
  say('미방문 시설 칩:', JSON.stringify(chips));
  await shot('r5_01_map_chips');

  // 파출소 칩 호버 → 설명 툴팁
  await page.hover('#bd-map-v283 button[data-bd-fac="bongdam_police"]');
  await wait(500);
  const tipHover = await page.evaluate(() => {
    const t = document.getElementById('bd-map-tip');
    return t && t.style.display === 'block' ? (t.textContent || '').replace(/\s+/g, ' ').slice(0, 100) : null;
  });
  say('호버 툴팁:', JSON.stringify(tipHover));
  await shot('r5_02_hover_tooltip');

  // 클릭 → 추적 지정 (카메라 이동 없음)
  await page.click('#bd-map-v283 button[data-bd-fac="bongdam_police"]');
  await wait(2000);
  const after = await page.evaluate(() => ({
    mapClosed: document.getElementById('bd-map-v283').style.display === 'none',
    tipHidden: (document.getElementById('bd-map-tip') || {}).style ? document.getElementById('bd-map-tip').style.display === 'none' : null,
    track: window.__bdMapTrackFid,
    noPan: !window.__bdCamPan,
    navLabel: window.__bdNavOverride ? window.__bdNavOverride.label : null,
  }));
  say('클릭 후:', JSON.stringify(after));
  await shot('r5_03_tracking');

  const pass = chips.length > 0 && tipHover && /치안 거점/.test(tipHover)
    && after.mapClosed && after.tipHidden && after.track === 'bongdam_police' && after.noPan
    && after.navLabel && after.navLabel.indexOf('📍') === 0;
  say(pass ? '✅ 라운드 5 검증 통과' : '❌ 실패: ' + JSON.stringify(after));

  // ── 게이트 차단 대화창 (조작 잠금 독백) ──
  await page.evaluate(() => { fadeToStage(212, 0.48, 0.93, 80); });
  await wait(1400);
  await page.keyboard.down('s'); await wait(2000); await page.keyboard.up('s');
  await wait(700);
  const gate = await page.evaluate(() => ({
    stage: Number(currentStage),
    y: +heroY.toFixed(3),
    vn: (() => { const v = document.getElementById('dialogue-box'); return v && v.offsetHeight > 0 ? (v.textContent || '').replace(/\s+/g, ' ').slice(0, 70) : null; })(),
  }));
  say('게이트 독백:', JSON.stringify(gate), gate.stage === 212 && gate.vn && /할 일이 남은 것 같아/.test(gate.vn) ? '✅' : '❌');
  await shot('r5_04_gate_dialog');
  say('콘솔 오류:', consoleErrors.length);
};
