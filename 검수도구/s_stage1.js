// 단계 1 검증 — 진행 축 단일화
module.exports = async function ({ page, say, shot, wait, consoleErrors }) {
  await wait(3000);
  // 새 게임 진입 (프롤로그 101)
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

  // 1) 신규 API 존재·초기값
  const api = await page.evaluate(() => ({
    finaleOpen: typeof window.BD_finaleOpen === 'function' ? BD_finaleOpen() : 'missing',
    map: window.BD_MapProgress ? BD_MapProgress.all().map(r => ({
      id: r.regionId, pct: r.pct, core: r.core, req: r.req, pur: r.pur, stamp: r.stamp
    })) : 'missing',
  }));
  say('API:', JSON.stringify(api));

  // 2) 상점 크래시 수정 — BD_openShop이 예외 없이 열리는지
  const shop = await page.evaluate(() => {
    try {
      window.BD_openShop();
      const m = document.getElementById('bd-shop-modal');
      const ok = !!(m && m.classList.contains('show') && /간식/.test(m.textContent || ''));
      if (m) m.classList.remove('show');
      return { ok, err: null };
    } catch (e) { return { ok: false, err: String(e) }; }
  });
  say('상점 열기:', JSON.stringify(shop));

  // 3) 보스 미처치 상태에서 final 완료 시도 → 엔딩 차단 확인
  await page.evaluate(() => { BD.questIdx = 5; window.__bdQPLast = 0; BD_questProgress(); });
  await wait(2200);
  const guard = await page.evaluate(() => ({
    endingShown: !!document.querySelector('#bd-ending-modal.show, .bd-ending.show'),
    cutsceneShown: !!(document.getElementById('bd-dialog') && document.getElementById('bd-dialog').classList.contains('show')),
    cur: (window.BD_QUESTS || QUESTS).find(q => q.id === 'final').objectives[0].cur,
    questIdx: BD.questIdx,
  }));
  say('보스 미처치 가드:', JSON.stringify(guard), guard.endingShown || guard.cutsceneShown ? '❌ 엔딩 새어나감' : '✅ 차단됨');

  // 4) 보스 정화 후 → 엔딩 단일 경로 재생 확인
  await page.evaluate(() => {
    BD.purified['final_boss_1'] = true;
    window.__bdQPLast = 0;
    BD_questProgress();
  });
  // 컷신 자동 진행 (Space 연타로 대사 넘기기)
  let sawEpilogue = false, sawEnding = false, dlgLines = [];
  for (let t = 0; t < 90 && !sawEnding; t++) {
    await wait(700);
    const r = await page.evaluate(() => {
      const out = { dlg: null, ending: false };
      const box = document.getElementById('bd-dialog');
      if (box && box.classList.contains('show')) {
        out.dlg = (box.textContent || '').slice(0, 90);
        try { if (typeof advanceDialog === 'function') advanceDialog(); else box.click(); } catch (e) { box.click && box.click(); }
      }
      const vn = document.getElementById('dialogue-box');
      if (!out.dlg && vn && vn.offsetHeight > 0) {
        out.dlg = (vn.textContent || '').slice(0, 90);
        const ov = document.getElementById('dialogue-overlay');
        if (ov) ov.click();
      }
      out.ending = !!document.querySelector('#bd-ending-modal.show') ||
        [...document.querySelectorAll('.bd-modal.show')].some(m => /안전 지도 완성/.test(m.textContent || ''));
      return out;
    });
    if (r.dlg) { dlgLines.push(r.dlg); if (/앞으로도 잘 부탁해, 담이/.test(r.dlg)) sawEpilogue = true; }
    if (r.ending) sawEnding = true;
  }
  say('컷신 줄 수집:', dlgLines.length, '· 에필로그 병합 확인:', sawEpilogue, '· 엔딩 모달:', sawEnding);
  await shot('s1_ending');
  say('콘솔 오류:', consoleErrors.length);
};
