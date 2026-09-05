module.exports = async (h) => {
  const { say } = h;
  const ids = (process.env.SIDS || '212').split(',').map(Number);
  const info = await h.page.evaluate((ids) => {
    const out = {};
    for (const sid of ids) {
      const st = STAGES[sid]; if (!st) continue;
      out[sid] = {
        name: st.name, bgW: st.bgW, bgH: st.bgH,
        objs: (st.objects || []).map(x => ({
          l: x.label, npc: x.npcName, i: x.interactable, res: !!x.resident, hz: x.hazardId,
          rx: x.rx != null ? +x.rx.toFixed(3) : null, ry: x.ry != null ? +x.ry.toFixed(3) : null,
          rw: x.rw != null ? +x.rw.toFixed(3) : null, rh: x.rh != null ? +x.rh.toFixed(3) : null,
          cx: x.cx, cy: x.cy, cw: x.cw, ch: x.ch, solid: x.solid, hid: !!x.hidden, boss: !!x.isBoss,
          type: x.type,
        })),
        lm: (st.__v24Landmarks || []).map(l => ({ n: l.name, x: l.interactionX, y: l.interactionY, major: !!l.majorFacility, hid: !!l.hidden })),
      };
    }
    return out;
  }, ids);
  say(JSON.stringify(info));
};
