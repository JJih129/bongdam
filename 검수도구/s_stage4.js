// 단계 4 검증 — 텍스트/기능 패치 스모크
module.exports = async function ({ page, say, wait, consoleErrors }) {
  await wait(3500);
  const r = await page.evaluate(() => {
    const out = {};
    out.josa = window.BD_josaN ? [BD_josaN('{n}가 나타났다!', '유리 조각'), BD_josaN('{n}가 나타났다!', '먼지 회오리')] : 'missing';
    out.touchKeybar = (document.getElementById('bd-keybar') || {}).textContent || null;
    out.coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    out.maxHP = (typeof getMaxHP === 'function') ? '있음' : '없음';
    // 개발 메모 잔존 확인 (배치 데이터)
    const raw = localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest') || '';
    out.devMemoLeft = (raw.match(/비수집/g) || []).length;
    out.jeongDohyunLeft = (raw.match(/사서 정도현/g) || []).length;
    return out;
  });
  say('스모크:', JSON.stringify(r, null, 1));
  const pass = Array.isArray(r.josa) && r.josa[0] === '유리 조각이 나타났다!' && r.josa[1] === '먼지 회오리가 나타났다!'
    && r.devMemoLeft === 0 && r.jeongDohyunLeft === 0
    && r.touchKeybar && r.touchKeybar.indexOf('조이스틱') < 0;
  say(pass ? '✅ 단계 4 스모크 통과' : '❌ 단계 4 스모크 실패');
  say('콘솔 오류:', consoleErrors.length);
};
