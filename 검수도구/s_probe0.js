// 단계 0 프로브 — '복사' 잔존 위치와 캐릭터 선택 모달 구조 확인
module.exports = async function ({ page, say, wait }) {
  await wait(3000);
  const r = await page.evaluate(() => {
    const out = {};
    // '복사'가 남은 위치 추적
    const raw = localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest') || '';
    const hits = [];
    let idx = -1;
    while ((idx = raw.indexOf(' 복사"', idx + 1)) !== -1 && hits.length < 10) {
      hits.push(raw.slice(Math.max(0, idx - 90), idx + 8));
    }
    out.copyHits = hits;
    // 다른 키에도 있는지
    out.keysWithCopy = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      if (v.indexOf(' 복사') >= 0) out.keysWithCopy.push(k + ' (' + v.length + ')');
    }
    return out;
  });
  say('복사 잔존:', JSON.stringify(r, null, 1));

  // 캐릭터 선택 진입 후 모달 구조
  await page.click('#bd-title-start', { timeout: 5000 });
  await wait(1200);
  const m = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null || getComputedStyle(b).position === 'fixed');
    return btns.filter(b => {
      const r2 = b.getBoundingClientRect();
      return r2.width > 0 && r2.height > 0 && getComputedStyle(b).visibility !== 'hidden';
    }).map(b => ({ id: b.id, txt: (b.textContent || '').trim().slice(0, 30) })).slice(0, 25);
  });
  say('보이는 버튼:', JSON.stringify(m));
};
