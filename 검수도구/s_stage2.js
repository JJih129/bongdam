// 단계 2 검증 — 안전지도 UI + 지역 완성 스킬 재배선
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

  // 1) 지도 열기 (버튼 함수 대체 확인)
  const open1 = await page.evaluate(() => {
    window.BD_openSafetyMap();
    const d = document.getElementById('bd-map-v283');
    return {
      visible: !!(d && d.style.display === 'flex'),
      regions: d ? (d.querySelectorAll('svg g').length) : 0,
      header: d ? (document.getElementById('bd-map-v283-dami').textContent || '').slice(0, 60) : null,
      boss: d ? /\?|❔/.test(d.querySelector('svg').textContent) : false,
      replayHidden: d ? document.getElementById('bd-map-v283-replay').style.display === 'none' : null,
    };
  });
  say('지도 초기:', JSON.stringify(open1));
  await shot('s2_map_initial');

  // 2) ESC 닫기 + M 토글
  await page.keyboard.press('Escape'); await wait(400);
  const closed = await page.evaluate(() => document.getElementById('bd-map-v283').style.display === 'none');
  await page.keyboard.press('m'); await wait(400);
  const reopened = await page.evaluate(() => document.getElementById('bd-map-v283').style.display === 'flex');
  await page.keyboard.press('m'); await wait(400);
  say('ESC 닫기:', closed, '· M 토글:', reopened);

  // 3) 와우리 core 시뮬레이션 → 스킬 fan 지급 확인
  const sim = await page.evaluate(() => {
    // 부탁 전부 보고 상태
    const pairs = BD_hzQuestMap(212) || [];
    const s = {};
    pairs.forEach(p => { s[p.id] = 'r'; });
    localStorage.setItem('bd_hzquest_v57', JSON.stringify(s));
    // 메인 위험요소 전부 정화
    (STAGES[212].objects || []).forEach(o => {
      if (o && o.interactable === 'hazard' && o.hazardId && !o.isBoss && String(o.hazardId).indexOf('final_boss') !== 0 && !o.bdOptional) {
        BD.purified[o.hazardId] = true;
      }
    });
    // 스탬프
    BD_Facility.grantStamp('facility_youth_house');
    return { pairs: pairs.map(p => p.id) };
  });
  say('시뮬 세팅:', JSON.stringify(sim));
  await wait(3500);   // 감시자 틱 대기
  const after = await page.evaluate(() => ({
    fan: BD.unlockedSkills.filter(s => s === 'fan').length,
    mapWawoo: BD_MapProgress.region('wawoo'),
    grants: JSON.parse(localStorage.getItem('bd_map_skill_v283') || '{}'),
    skillMode: window.__bdMapSkillMode,
  }));
  say('core 후:', JSON.stringify({ fanCount: after.fan, pct: after.mapWawoo.pct, core: after.mapWawoo.core, grants: after.grants, skillMode: after.skillMode }));

  // 4) 지도 재확인 (와우리 채도 상승 + ✔ 지도 완성)
  await page.evaluate(() => window.BD_openSafetyMap());
  await wait(600);
  const map2 = await page.evaluate(() => {
    const svg = document.querySelector('#bd-map-v283 svg');
    return { doneMark: /지도 완성/.test(svg.textContent), stampMark: /🏅/.test(svg.textContent) };
  });
  say('지도 갱신:', JSON.stringify(map2));
  await shot('s2_map_wawoo_done');

  const pass = open1.visible && open1.regions >= 4 && open1.boss && closed && reopened &&
    after.fan === 1 && after.mapWawoo.core === true && map2.doneMark;
  say(pass ? '✅ 단계 2 검증 통과' : '❌ 단계 2 검증 실패');
  say('콘솔 오류:', consoleErrors.length);
};
