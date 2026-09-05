// 상리(213) 유리 조각 접근 불가 진단 — 경로상 콜라이더 전수 덤프
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
  // 213으로 강제 이동 + 막힘 지점으로 텔레포트
  await page.evaluate(() => { fadeToStage(213, 0.370, 0.646, 100); });
  await wait(1600);

  const diag = await page.evaluate(() => {
    const st = STAGES[213];
    const out = { stage: Number(currentStage), hero: [heroX, heroY], glass: null, blockers: [], collideProbe: {} };
    const glass = (st.objects || []).find(o => o && o.hazardId === 'ow213_glass_1');
    if (glass) out.glass = { rx: glass.rx, ry: glass.ry, rw: glass.rw, rh: glass.rh, cw: glass.cw, ch: glass.ch, solid: glass.solid, hidden: glass.hidden };
    // 히어로→유리 경로 직사각형 안의 콜라이더 있는 오브젝트 나열
    const x0 = Math.min(0.298, 0.375) - 0.05, x1 = Math.max(0.298, 0.375) + 0.05;
    const y0 = Math.min(0.400, 0.650) - 0.05, y1 = Math.max(0.400, 0.650) + 0.05;
    (st.objects || []).forEach(o => {
      if (!o) return;
      const cx = (o.cx != null ? o.cx : o.rx), cy = (o.cy != null ? o.cy : o.ry);
      const cw = (o.cw != null ? o.cw : o.rw), ch = (o.ch != null ? o.ch : o.rh);
      if (!(cw > 0 && ch > 0)) return;
      if (cx > x1 || cx + cw < x0 || cy > y1 || cy + ch < y0) return;
      out.blockers.push({ l: o.label, t: o.type, id: o._editorId, r: [+cx.toFixed(3), +cy.toFixed(3), +cw.toFixed(3), +ch.toFixed(3)] });
    });
    // _collidesAt 샘플: 세로로 이동 시도 경로
    if (typeof _collidesAt === 'function') {
      const samples = [];
      for (let yy = 0.64; yy >= 0.40; yy -= 0.02) {
        samples.push([+yy.toFixed(2), ['0.30', '0.34', '0.37'].map(xx => _collidesAt(Number(xx), yy) ? 'X' : '.').join('')]);
      }
      out.collideProbe = samples;
    }
    return out;
  });
  say('진단:', JSON.stringify(diag, null, 1));
  await shot('probe3_213');

  // 실제로 W키로 위로 이동해 보기 (2초)
  await page.keyboard.down('w'); await wait(2000); await page.keyboard.up('w');
  const pos1 = await page.evaluate(() => [heroX.toFixed(3), heroY.toFixed(3)]);
  await page.keyboard.down('a'); await wait(1200); await page.keyboard.up('a');
  await page.keyboard.down('w'); await wait(2000); await page.keyboard.up('w');
  const pos2 = await page.evaluate(() => [heroX.toFixed(3), heroY.toFixed(3)]);
  say('W 후:', JSON.stringify(pos1), '· A+W 후:', JSON.stringify(pos2));
  await shot('probe3_after_move');
};
