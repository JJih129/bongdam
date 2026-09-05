module.exports = async (h) => {
  const { say } = h;
  const r = await h.page.evaluate(() => {
    const out = { collisionOn: !!window.BD_MAP_COLLISION, stages: {} };
    for (const sid of Object.keys(STAGES)) {
      const st = STAGES[sid];
      if (!st) continue;
      const bad = [];
      (st.objects || []).forEach((o, i) => {
        if (!o) return;
        const hasC = o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined;
        if (!hasC) return;
        // 콜라이더가 본체 사각형에서 크게 벗어났는가?
        const dx = Math.abs(o.cx - (o.rx || 0));
        const dy = Math.abs(o.cy - (o.ry || 0));
        const offX = dx > Math.max(0.06, (o.rw || 0) * 0.8);
        const offY = dy > Math.max(0.06, (o.rh || 0) * 0.8);
        if (offX || offY) bad.push({ i, l: o.label, type: o.type, r: [+(o.rx || 0).toFixed(3), +(o.ry || 0).toFixed(3), +(o.rw || 0).toFixed(3), +(o.rh || 0).toFixed(3)], c: [+o.cx.toFixed(3), +o.cy.toFixed(3), +o.cw.toFixed(3), +o.ch.toFixed(3)], d: [+dx.toFixed(3), +dy.toFixed(3)], hz: o.hazardId, boss: !!o.isBoss, hid: !!o.hidden });
      });
      out.stages[sid] = { name: st.name, collision: !!st.collision, walk: st.walk || null, n: (st.objects || []).length, bad };
    }
    return out;
  });
  say('BD_MAP_COLLISION=' + r.collisionOn);
  for (const sid of Object.keys(r.stages)) {
    const s = r.stages[sid];
    say(`\n[${sid}] ${s.name}  collision=${s.collision} walk=${JSON.stringify(s.walk)} objs=${s.n}`);
    if (s.bad.length) s.bad.forEach(b => say(`   ⚠ #${b.i} ${b.l} type=${b.type} hz=${b.hz || '-'} boss=${b.boss} hidden=${b.hid}\n       본체 r=${JSON.stringify(b.r)}\n       콜라이더 c=${JSON.stringify(b.c)}  어긋남=${JSON.stringify(b.d)}`));
  }
};
