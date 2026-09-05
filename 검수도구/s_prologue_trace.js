// 프롤로그 이벤트 타임라인 추적 — 배지/담이가 선생님 대화보다 먼저 나오는지
module.exports = async function ({ page, say, shot, wait }) {
  await wait(3000);
  await page.click('#bd-title-start', { timeout: 5000 });
  let inGame = false;
  for (let t = 0; t < 25 && !inGame; t++) {
    await wait(700);
    inGame = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
  }
  say('진입:', inGame);
  await shot('pt_00_spawn');

  // 이벤트 로거 설치
  await page.evaluate(() => {
    window.__tl = [];
    const t0 = Date.now();
    const log = (e) => window.__tl.push(((Date.now() - t0) / 1000).toFixed(1) + 's ' + e);
    // 담이 발화 후킹
    const os = BD_DAMI.show.bind(BD_DAMI);
    BD_DAMI.show = function (t, o) { const r = os(t, o); if (r) log('담이: ' + String(t).slice(0, 40)); return r; };
    // 수여식 후킹
    if (window.BD_badgeCeremony) { const ob = window.BD_badgeCeremony; window.BD_badgeCeremony = function (cb) { log('★수여식 연출 시작'); return ob(cb); }; }
    // 토스트 후킹
    if (window.bdToast) { const ot = window.bdToast; window.bdToast = function (m) { log('토스트: ' + String(m).slice(0, 40)); return ot.apply(this, arguments); }; }
    // VN 대사 감시
    setInterval(() => {
      const vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) {
        const t = (vn.textContent || '').replace(/\s+/g, ' ').slice(0, 50);
        if (t && window.__lastVN !== t) { window.__lastVN = t; log('VN: ' + t); }
      }
    }, 250);
  });

  // 자동 진행: 오프닝 독백 넘기기 → 이동 → 데스크로 → F
  for (let i = 0; i < 6; i++) { await page.keyboard.press(' '); await wait(500); }
  await shot('pt_01_after_monologue');
  // 이동 튜토 통과 (잠깐 걷기)
  await page.keyboard.down('a'); await wait(1400); await page.keyboard.up('a');
  await wait(1200);
  await shot('pt_02_after_move');
  // 데스크(0.565,0.270)로 이동
  await page.evaluate(() => { heroX = 0.565; heroY = 0.30; camX = heroX; camY = heroY; });
  await wait(800);
  await shot('pt_03_at_desk');
  // F로 선생님 대화
  await page.keyboard.press('f');
  await wait(700);
  await shot('pt_04_talk_start');
  // 대사 넘기기 (7줄) — 중간마다 스크린샷
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press(' ');
    await wait(650);
    if (i === 2) await shot('pt_05_mid_dialog');
  }
  await shot('pt_06_after_dialog');
  await wait(3000);
  await shot('pt_07_ceremony_window');
  await page.keyboard.press(' ');
  await wait(2500);
  await shot('pt_08_dami_intro');

  const tl = await page.evaluate(() => window.__tl);
  say('타임라인:\n' + tl.join('\n'));
};
