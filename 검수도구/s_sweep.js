// 모든 상호작용 대상에 F를 눌러 «열리는가 / 닫히는가 / 다시 움직일 수 있는가» 전수 점검
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  const SID = Number(process.env.SWEEP_SID || 101);

  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate((sid) => {
    localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_battle_tutorial_seen', '1');
    try { BD.purified = BD.purified || {}; BD.purified['ow212_trash_1'] = true; } catch (e) { }
    if (Number(sid) !== 101 && typeof fadeToStage === 'function') fadeToStage(Number(sid));
  }, SID);
  await h.wait(5000); await A.advance();
  await A.P.install();

  const targets = await h.page.evaluate((sid) => {
    const st = STAGES[sid]; if (!st) return [];
    const out = [];
    (st.objects || []).forEach((o, i) => {
      if (!o || o.hidden) return;
      const kind = o.resident ? '주민' : (o.interactable || '');
      if (!kind) return;
      if (kind === 'hazard') return;   // 전투는 별도 검증
      out.push({ i, kind, label: o.npcName || o.label || '(무명)', rx: o.rx, ry: o.ry, rw: o.rw || 0.05, rh: o.rh || 0.06 });
    });
    // 시설 랜드마크(주요시설 F 캡처)도 포함
    (st.__v24Landmarks || []).forEach((l, i) => {
      if (!l || l.hidden || !l.majorFacility) return;
      out.push({ i: 'lm' + i, kind: '시설', label: l.name || '주요시설', rx: l.interactionX - 0.01, ry: l.interactionY - 0.01, rw: 0.02, rh: 0.02 });
    });
    return out;
  }, SID);

  say(`[${SID}] 상호작용 대상 ${targets.length}개`);
  const results = [];
  for (const t of targets) {
    const aimX = t.rx + t.rw / 2, aimY = t.ry + t.rh + 0.012;
    const w = await A.P.walk(aimX, aimY, L);
    const before = await A.probe();
    if (!w.ok) { results.push({ t, r: '도달못함(' + (w.reason || '') + ' d=' + (w.dist || '?') + ')' }); say(`  ✖ ${t.kind} ${t.label} — 도달 못함 ${w.reason || ''}`); continue; }
    await L.press('f', 1, 700);
    await h.wait(900);
    const after = await h.page.evaluate(() => {
      const on = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 60 && r.height > 30; };
      const ids = ['dialogue-overlay', 'bd-dialog', 'bd-place-card', 'shop-overlay', 'inv-overlay', 'bd-district-facility-modal', 'bd-bus-modal', 'bd-gamesel', 'bd-songsel', 'bd-arcade-ov', 'bd-rhythm-ov', 'bd-choice'];
      const opened = ids.filter(id => on(document.getElementById(id)));
      const modal = [...document.querySelectorAll('.bd-modal.show')].filter(on).map(m => m.id);
      const iframes = [...document.querySelectorAll('iframe')].filter(on).map(f => f.id || f.src.slice(0, 40));
      const txt = (() => { const e = document.getElementById('dialogue-box'); return on(e) ? (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : null; })();
      return { opened, modal, iframes, txt, blocked: !!(window.BD_isInputBlocked && window.BD_isInputBlocked()) };
    });
    const openedAny = after.opened.length || after.modal.length || after.iframes.length;
    // 닫기: Space 로 대사 넘기고, 안 되면 ESC
    let closed = 'n/a';
    if (openedAny) {
      for (let k = 0; k < 25; k++) { const b = await L.blocked(); if (!b.b) break; await h.page.keyboard.press('Space'); await h.wait(230); }
      let still = await h.page.evaluate(() => !!(window.BD_isInputBlocked && window.BD_isInputBlocked()));
      if (still) { for (let k = 0; k < 6; k++) { await h.page.keyboard.press('Escape'); await h.wait(550); } still = await h.page.evaluate(() => !!(window.BD_isInputBlocked && window.BD_isInputBlocked())); }
      if (still) { await h.page.evaluate(() => { try { if (window.__bdSelectOpen && window.BD_openGameSelect) { const o = document.getElementById('bd-gamesel'); if (o) { o.style.display = 'none'; window.__bdSelectOpen = false; } } } catch (e) { } }); await h.wait(400); still = await h.page.evaluate(() => !!(window.BD_isInputBlocked && window.BD_isInputBlocked())); }
      closed = still ? '❌닫기실패' : '닫힘';
    }
    // 다시 움직일 수 있는가
    const p0 = await h.page.evaluate(() => [heroX, heroY]);
    await h.hold('s', 350); await h.hold('d', 350);
    const p1 = await h.page.evaluate(() => [heroX, heroY]);
    const moved = Math.abs(p1[0] - p0[0]) + Math.abs(p1[1] - p0[1]) > 0.002;
    const line = `${openedAny ? '열림' : '반응없음'} [${[...after.opened, ...after.modal, ...after.iframes].join(',') || '-'}] ${closed} 이동복구=${moved ? 'OK' : '❌'}${after.txt ? ' 「' + after.txt + '」' : ''}`;
    results.push({ t, r: line, bad: !openedAny || closed === '❌닫기실패' || !moved });
    say(`  ${(!openedAny || closed === '❌닫기실패' || !moved) ? '⚠' : '·'} ${t.kind} ${t.label} → ${line}`);
    if (!moved || closed === '❌닫기실패') await h.shot('sw_BAD_' + SID + '_' + String(t.i).replace(/\W/g, ''));
  }
  const bad = results.filter(r => r.bad);
  say(`\n[${SID}] 요약: 전체 ${results.length} · 문제 ${bad.length}`);
  bad.forEach(b => say(`   ⚠ ${b.t.kind} ${b.t.label}: ${b.r}`));
};
