module.exports = async (h) => {
  const { say } = h;
  const r = await h.page.evaluate(() => {
    const out = {};
    [212, 213, 211, 210].forEach(sid => {
      const st = STAGES[sid]; if (!st) return;
      const npcs = (st.objects || []).filter(o => o && o.resident && !o.hidden && (o.npcName || o.label) && !o._hyunji && !o._tut2npc)
        .map(o => ({ n: o.npcName || o.label, x: +(o.rx || 0).toFixed(3), y: +(o.ry || 0).toFixed(3) }));
      const hz = (st.objects || []).filter(o => o && o.interactable === 'hazard' && o.hazardId)
        .map(o => ({ id: o.hazardId, l: o.label, boss: !!o.isBoss, hid: !!o.hidden, x: +(o.rx || 0).toFixed(3), y: +(o.ry || 0).toFixed(3) }));
      let map = [];
      try { map = window.BD_hzQuestMap(sid) || []; } catch (e) { map = ['ERR:' + e]; }
      const mapped = new Set(map.map(m => m.id));
      const orphans = hz.filter(x => !x.boss && x.id.indexOf('final_boss') !== 0 && x.id !== 'ow212_trash_1' && !mapped.has(x.id));
      out[sid] = { name: st.name, npcs, hz, map, orphans };
    });
    // 최종 보스 잠금 조건
    try {
      const b = (STAGES[212].objects || []).find(o => o && o.hazardId === 'final_boss_1');
      out.bossLocked = b ? (typeof window.BD_hazardLocked === 'function' ? window.BD_hazardLocked(b) : 'n/a') : 'no-boss';
    } catch (e) { out.bossErr = String(e); }
    try { out.regionLocked = [212, 213, 211, 210].map(s => [s, window.BD_regionLocked ? window.BD_regionLocked(s) : 'n/a']); } catch (e) { }
    return out;
  });
  for (const sid of [212, 213, 211, 210]) {
    const s = r[sid]; if (!s) continue;
    say(`\n═══ [${sid}] ${s.name} ═══`);
    say(`  주민 ${s.npcs.length}명: ${s.npcs.map(n => n.n).join(', ')}`);
    say(`  위험요소 ${s.hz.length}개: ${s.hz.map(x => x.l + '(' + x.id + (x.boss ? '/BOSS' : '') + (x.hid ? '/숨김' : '') + ')').join(', ')}`);
    say(`  부탁 매칭 ${s.map.length}건:`);
    s.map.forEach(m => say(`     · ${m.npc} → ${m.hazard} [${m.id}] d=${m.d}`));
    if (s.orphans.length) say(`  ⚠ 담당 주민 없는 위험요소 ${s.orphans.length}개: ${s.orphans.map(o => o.l + '(' + o.id + ')').join(', ')}`);
    else say('  ✅ 고아 위험요소 없음');
  }
  say('\nbossLocked=' + JSON.stringify(r.bossLocked) + ' regionLocked=' + JSON.stringify(r.regionLocked));
};
