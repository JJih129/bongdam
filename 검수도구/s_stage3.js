// 단계 3 검증 — 인터리브 컷신·도입 컷신 부활·부탁 매칭·담이 큐
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
  await wait(3000);
  await page.click('#bd-title-start', { timeout: 5000 });
  let inGame = false;
  for (let t = 0; t < 25 && !inGame; t++) {
    await wait(800);
    inGame = await page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { const b = m.querySelector('button'); if (b) b.click(); }
      return typeof currentStage !== 'undefined' && Number(currentStage) === 101;
    });
  }
  say('게임 진입:', inGame);

  // 1) 부탁 매칭 — 상리에 선택 목표(산책로) 제외 확인
  const pairs = await page.evaluate(() => BD_hzQuestMap(213).map(p => p.id + '→' + p.npc));
  const noAlley = !pairs.some(p => p.indexOf('alley') >= 0);
  say('상리 부탁 매칭:', JSON.stringify(pairs), noAlley ? '✅ 산책로 제외됨' : '❌ 산책로 배정됨');

  // 2) 프롤로그 완료 처리 후 상리 진입 → ch2_intro 자동 재생 확인
  await page.evaluate(() => {
    localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_awake', '1');
    try { BD_PROGRESS.story.tutorialFlags.badgeGiven = true; BD_PROGRESS.story.badgeAwakened = true; } catch (e) { }
    try { BD.purified['ow212_trash_1'] = true; } catch (e) { }   // 튜토 완료 상태
    fadeToStage(213, 0.66, 0.30, 100);
  });
  let sawIntro = false, sawDamiLine = false, introLog = [];
  for (let t = 0; t < 40; t++) {
    await wait(600);
    const r = await page.evaluate(() => {
      const out = { vn: null, dami: null };
      const vn = document.getElementById('dialogue-box');
      if (vn && vn.offsetHeight > 0) {
        out.vn = (vn.textContent || '').replace(/\s+/g, ' ').slice(0, 70);
        const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click();
      }
      const dm = document.getElementById('bd-dami-text');
      if (dm && dm.textContent) out.dami = dm.textContent.slice(0, 60);
      return out;
    });
    if (r.vn) { introLog.push('VN: ' + r.vn); if (/상리\. 도서관과 공원길/.test(r.vn)) sawIntro = true; }
    if (r.dami && /벤치 쪽에서 차가운 기운/.test(r.dami)) sawDamiLine = true;
    if (sawIntro && sawDamiLine && t > 12) break;
  }
  say('ch2_intro 재생:', sawIntro, '· 담이 인터리브 줄:', sawDamiLine);
  say('로그 표본:', JSON.stringify(introLog.slice(0, 4)));
  await shot('s3_ch2intro');

  // 3) 재진입 시 1회성 확인
  await page.evaluate(() => { fadeToStage(212, 0.3, 0.3, 80); });
  await wait(1500);
  await page.evaluate(() => { fadeToStage(213, 0.66, 0.30, 80); });
  await wait(2500);
  const replay = await page.evaluate(() => {
    const vn = document.getElementById('dialogue-box');
    return !!(vn && vn.offsetHeight > 0 && /상리\. 도서관과/.test(vn.textContent || ''));
  });
  say('재진입 시 재재생 없음:', !replay ? '✅' : '❌');

  // 4) 담이 큐 — 연속 발화가 덮어쓰지 않고 순차 재생되는지
  const q = await page.evaluate(() => {
    const seen = [];
    BD_DAMI.show('첫 번째 안내 문장이에요.', { face: 'base' });
    BD_DAMI.show('두 번째 안내 문장이에요.', { face: 'base' });
    return new Promise(res => {
      let n = 0;
      const iv = setInterval(() => {
        const t = (document.getElementById('bd-dami-text') || {}).textContent || '';
        if (t && seen[seen.length - 1] !== t) seen.push(t);
        if (++n > 24) { clearInterval(iv); res(seen); }
      }, 350);
    });
  });
  const joined = q.join('|');
  const queued = /첫 번째 안내 문장/.test(joined) && /두 번째 안내 문장/.test(joined);
  say('담이 큐 순차 재생:', queued ? '✅' : '❌', JSON.stringify(q.slice(-3)));

  say('콘솔 오류:', consoleErrors.length);
  const pass = noAlley && sawIntro && sawDamiLine && !replay && queued;
  say(pass ? '✅ 단계 3 검증 통과' : '❌ 단계 3 검증 실패');
};
