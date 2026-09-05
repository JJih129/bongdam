// sparkSpots 빈 결과 진단
module.exports = async (h) => {
  const { say } = h;
  await h.wait(4000);
  const d = await h.page.evaluate(() => {
    const out = { cal: !!window.__BD_MAP_CAL, stages: typeof STAGES !== 'undefined', wstages: !!window.STAGES, spots: [], err: null };
    try {
      const CAL = window.__BD_MAP_CAL || {};
      [210, 211, 212, 213].forEach(sid => {
        const C = CAL[sid];
        out['st' + sid] = { hasCal: !!C, objs: (typeof STAGES !== 'undefined' && STAGES[sid]) ? (STAGES[sid].objects || []).filter(o => o && o.hazardId).length : 'no-stage' };
        if (!C || typeof STAGES === 'undefined' || !STAGES[sid]) return;
        (STAGES[sid].objects || []).forEach(o => {
          if (!o || !o.hazardId || String(o.hazardId).indexOf('final_boss') === 0) return;
          const cx = C.ax * ((Number(o.rx) || 0) + (Number(o.rw) || 0.04) / 2) + C.bx;
          const cy = C.ay * ((Number(o.ry) || 0) + (Number(o.rh) || 0.05) / 2) + C.by;
          out.spots.push([+cx.toFixed(3), +cy.toFixed(3)]);
        });
      });
    } catch (e) { out.err = String(e).slice(0, 200); }
    return out;
  });
  say(JSON.stringify(d));
};
