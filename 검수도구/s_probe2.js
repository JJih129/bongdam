// 엔딩 모달 내용·터치 힌트 오탐 조사
module.exports = async function ({ page, say, wait, shot }) {
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
  // 터치 판정 확인
  const touch = await page.evaluate(() => ({
    maxTouchPoints: navigator.maxTouchPoints,
    ontouch: 'ontouchstart' in window,
    keybarText: (document.getElementById('bd-keybar') || {}).textContent || null,
    touchHintVisible: (() => { const els = [...document.querySelectorAll('div')].filter(d => /조이스틱으로 움직여/.test(d.textContent || '') && d.children.length === 0); return els.length; })(),
  }));
  say('터치 판정:', JSON.stringify(touch));

  // 엔딩 강제 재현 → 모달 상태 덤프
  await page.evaluate(() => { BD.questIdx = 5; BD.purified['final_boss_1'] = true; window.__bdQPLast = 0; BD_questProgress(); });
  for (let t = 0; t < 90; t++) {
    await wait(600);
    const done = await page.evaluate(() => {
      const box = document.getElementById('bd-dialog');
      if (box && box.classList.contains('show')) { try { advanceDialog(); } catch (e) { box.click(); } return false; }
      const vn = document.getElementById('dialogue-overlay');
      if (vn && document.getElementById('dialogue-box') && document.getElementById('dialogue-box').offsetHeight > 0) { vn.click(); return false; }
      return [...document.querySelectorAll('.bd-modal.show')].length > 0;
    });
    if (done) break;
  }
  await wait(1500);
  const modal = await page.evaluate(() => {
    return [...document.querySelectorAll('.bd-modal.show, .bd-modal')].filter(m => m.classList.contains('show') || getComputedStyle(m).display !== 'none').map(m => ({
      id: m.id, show: m.classList.contains('show'),
      htmlLen: (m.innerHTML || '').length,
      text: (m.textContent || '').replace(/\s+/g, ' ').slice(0, 120),
    }));
  });
  say('보이는 모달:', JSON.stringify(modal, null, 1));
  await shot('probe2_modal');
};
