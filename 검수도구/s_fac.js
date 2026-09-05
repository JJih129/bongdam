// 시설 방문 기록 · 실내 회복 · 보스 그림 검증
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();

  // 보스 스프라이트 등록 확인
  const boss = await h.page.evaluate(() => {
    const o = (STAGES[212].objects || []).find(x => x && x.isBoss);
    const im = window.BD_ASSETS && BD_ASSETS.image('field.hazard.final_boss');
    return { variant: o && o.hazardVariant, registered: !!(window.BD_ASSETS && BD_ASSETS.has('field.hazard.final_boss')), imgOk: !!(im && (im.complete || im.width)) };
  });
  say('보스 그림: ' + JSON.stringify(boss));

  // 실내 회복
  await h.page.evaluate(() => { heroHP = 40; if (window.BD_syncHP) BD_syncHP(40, false); });
  await h.wait(6000);
  const hp = await h.page.evaluate(() => heroHP);
  say('실내 6초 후 HP (40 → 증가하면 정상): ' + hp);

  // 시설 방문 기록
  const fac = await h.page.evaluate(() => {
    const fp = window.BD_PROGRESS && BD_PROGRESS.facility;
    return { visited: fp.visitedFacilityIds.slice(), stamps: fp.facilityStampIds.slice(), guided: fp.readFacilityGuideIds.slice() };
  });
  say('문화의집 진입 기록: ' + JSON.stringify(fac));

  // 와우리로 나가서 문화의집 앞에서 휴식
  await h.page.evaluate(() => { if (typeof fadeToStage === 'function') fadeToStage(212); localStorage.setItem('bd_tut2_done', '1'); BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; });
  await h.wait(5000); await A.advance();
  await h.page.evaluate(() => { heroHP = 30; if (window.BD_syncHP) BD_syncHP(30, false); });
  const f = await h.page.evaluate(() => {
    const st = STAGES[212];
    const o = (st.objects || []).find(x => x && /봉담문화의집/.test(String(x.label || '')));
    return o ? { rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh } : null;
  });
  say('문화의집 오브젝트: ' + JSON.stringify(f));
  await h.page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [f.rx + f.rw / 2, f.ry + f.rh + 0.02]);
  await h.wait(1200);
  await L.press('f', 2, 900);
  await h.wait(2500);
  await A.advance();
  const fac2 = await h.page.evaluate(() => {
    const fp = window.BD_PROGRESS && BD_PROGRESS.facility;
    return { visited: fp.visitedFacilityIds.slice(), stamps: fp.facilityStampIds.slice() };
  });
  say('휴식 후 기록: ' + JSON.stringify(fac2));
  await h.shot('fac_01');
  // 보스 그림 확인용 스샷
  await h.page.evaluate(() => {
    const Q = window.QUESTS || window.BD_QUESTS; BD.questIdx = Q.findIndex(q => q.id === 'final');
    const o = (STAGES[212].objects || []).find(x => x && x.isBoss);
    heroX = o.rx + o.rw / 2; heroY = o.ry + o.rh + 0.05; camX = heroX; camY = heroY;
  });
  await h.wait(1600);
  await h.shot('fac_02_boss');
};
