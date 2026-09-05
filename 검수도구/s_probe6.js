// sangri/donghwa 약국 F 소비자 특정
module.exports = async function ({ page, say, wait, shot }) {
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
  for (const c of [{ sid: 213, id: 'sangri_pharmacy' }, { sid: 211, id: 'donghwa_pharmacy' }]) {
    await page.evaluate((sid) => { if (Number(currentStage) !== sid) fadeToStage(sid, 0.5, 0.5, 50); }, c.sid);
    await wait(1300);
    await page.keyboard.press('Escape'); await wait(400);
    const pre = await page.evaluate((cc) => {
      const st = STAGES[cc.sid];
      const lm = (st.__v24Landmarks || []).find(l => l && l.facilityId === cc.id);
      heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.004; camX = heroX; camY = heroY;
      // 067 판정 직접 실행
      const fac = window.BD_v24NearestFacility ? BD_v24NearestFacility() : null;
      return { fac: fac ? fac.facilityId : null };
    }, c);
    await wait(400);
    await page.keyboard.press('f');
    await wait(1000);
    const r = await page.evaluate(() => ({
      vn: (() => { const v = document.getElementById('dialogue-box'); return v && v.offsetHeight > 0 ? (v.textContent || '').replace(/\s+/g, ' ').slice(0, 80) : null; })(),
      modal: !!document.querySelector('#bd-district-facility-modal.open'),
      restOv: (() => { const d = [...document.querySelectorAll('div')].find(x => /쉬었다|숨을 돌렸다/.test(x.textContent || '') && x.children.length === 0); return d ? d.textContent.slice(0, 50) : null; })(),
    }));
    say(c.id + ': nearestFac=' + pre.fac + ' →', JSON.stringify(r));
    await shot('p6_' + c.id);
    await page.keyboard.press('Escape'); await wait(400);
    // VN 소화
    for (let i = 0; i < 6; i++) { await page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov) ov.click(); }); await wait(350); }
  }
};
