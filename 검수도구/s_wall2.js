module.exports = async (h) => {
  const { say } = h;
  const r = await h.page.evaluate(() => {
    const out = [];
    [101, 201, 210, 211, 212, 213].forEach(sid => {
      const st = STAGES[sid]; if (!st) return;
      (st.objects || []).forEach((o, i) => {
        if (!o) return;
        const hasC = o.cx !== undefined && o.cy !== undefined && o.cw !== undefined && o.ch !== undefined;
        if (!hasC) return;
        if (!(o.cw > 0) || !(o.ch > 0)) return;   // 의도적으로 끈 콜라이더는 제외
        const rx = o.rx || 0, ry = o.ry || 0, rw = o.rw || 0, rh = o.rh || 0;
        const overlap = (o.cx < rx + rw) && (o.cx + o.cw > rx) && (o.cy < ry + rh) && (o.cy + o.ch > ry);
        if (!overlap) out.push({ sid, i, l: o.label, r: [+rx.toFixed(3), +ry.toFixed(3)], c: [+o.cx.toFixed(3), +o.cy.toFixed(3)] });
      });
    });
    return out;
  });
  say(r.length ? ('❌ 남은 투명벽 ' + r.length + '건: ' + JSON.stringify(r)) : '✅ 실제 사용 맵 투명벽 0건 (콜라이더가 본체에서 떨어진 오브젝트 없음)');
};
