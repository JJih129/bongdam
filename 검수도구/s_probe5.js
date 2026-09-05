// 시설 F 실패·오매핑 원인 진단 — 앵커 거리 비교
module.exports = async function ({ page, say, wait }) {
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
  const CASES = [
    { sid: 213, id: 'sangri_pharmacy' }, { sid: 213, id: 'bongdam_admin_pharmacy' }, { sid: 213, id: 'alpha_stationery' },
    { sid: 211, id: 'donghwa_pharmacy' }, { sid: 210, id: 'tongtoon' }, { sid: 210, id: 'uri_home_mart' },
  ];
  for (const c of CASES) {
    const r = await page.evaluate((cc) => {
      if (Number(currentStage) !== cc.sid) fadeToStage(cc.sid, 0.5, 0.5, 50);
      return null;
    }, c);
    await wait(1200);
    const d = await page.evaluate((cc) => {
      const st = STAGES[cc.sid];
      const lm = (st.__v24Landmarks || []).find(l => l && l.facilityId === cc.id);
      if (!lm) return { err: '랜드마크 없음' };
      heroX = Number(lm.interactionX); heroY = Number(lm.interactionY) + 0.004; camX = heroX; camY = heroY;
      const bw = Number(st.bgW || 1448), bh = Number(st.bgH || 1086);
      // 반경 170px 내 모든 시설과 거리
      const near = (st.__v24Landmarks || []).filter(l => l && l.majorFacility && !l.hidden).map(l => {
        const dx = (heroX - Number(l.interactionX)) * bw, dy = (heroY - Number(l.interactionY)) * bh;
        return { id: l.facilityId, d: Math.round(Math.sqrt(dx * dx + dy * dy)) };
      }).filter(x => x.d <= 220).sort((a, b) => a.d - b.d).slice(0, 4);
      // 주민 거리
      let resD = 1e9, resNm = null;
      (st.objects || []).forEach(o => {
        if (!o || !o.resident || o.hidden) return;
        const x0 = o.rx, y0 = o.ry, x1 = x0 + (o.rw || 0.05), y1 = y0 + (o.rh || 0.075);
        const dx = Math.max(x0 - heroX, 0, heroX - x1) * bw, dy = Math.max(y0 - heroY, 0, heroY - y1) * bh;
        const dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < resD) { resD = dd; resNm = o.npcName; }
      });
      return { target: cc.id, ix: +Number(lm.interactionX).toFixed(3), iy: +Number(lm.interactionY).toFixed(3), near, resD: Math.round(resD), resNm };
    }, c);
    say(c.sid + '/' + c.id + ':', JSON.stringify(d));
  }
};
