// equip/codex id + 약국 원거리 F 재현(거리별)
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      const modal = !!(m && m.classList.contains('show'));
      if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return { onTitle, modal };
    }).catch(() => ({ onTitle: true, modal: false }));
    if (!st.onTitle && !st.modal) break;
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  for (let t2 = 0; t2 < 14; t2++) {
    const m2 = await h.page.evaluate(() => {
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } return true; }
      return false;
    }).catch(() => false);
    if (!m2 && t2 > 2) break;
    await h.wait(600);
  }
  await h.wait(2500);
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(280); }
  const ids = await h.page.evaluate(() => {
    const out = {};
    try { BD_openEquipModal(); } catch (e) { }
    const eq = document.querySelector('.bd-modal.show, [id*=equip-modal].show');
    out.equip = eq ? { id: eq.id, cls: String(eq.className).slice(0, 50) } : null;
    document.querySelectorAll('.bd-modal.show').forEach(m => m.classList.remove('show'));
    try { BD_codexOpen(); } catch (e) { }
    const cx = [...document.querySelectorAll('div')].find(d => d.offsetWidth > 400 && /안전수첩|위험요소 도감/.test(d.textContent || '') && (getComputedStyle(d).position === 'fixed'));
    out.codex = cx ? { id: cx.id, cls: String(cx.className).slice(0, 50) } : null;
    if (cx) { cx.classList.remove('show'); cx.style.display = 'none'; }
    return out;
  });
  say('ids: ' + JSON.stringify(ids));
  // 약국 원거리 F — 거리 단계별
  const ph = await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
    return lm ? { x: Number(lm.interactionX || lm.rx), y: Number(lm.interactionY || lm.ry) } : null;
  });
  say('약국 지점: ' + JSON.stringify(ph));
  for (const d of [0.05, 0.09, 0.14, 0.2]) {
    await h.page.evaluate((p) => {
      heroX = p.x; heroY = p.y + p.d; camX = heroX; camY = heroY;
      const s = document.getElementById('shop-overlay'); if (s) s.classList.remove('open');
      const m = document.getElementById('bd-district-facility-modal'); if (m) m.classList.remove('open');
    }, { ...ph, d });
    await h.wait(450);
    await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(800);
    const r = await h.page.evaluate(() => ({
      shop: (() => { const s = document.getElementById('shop-overlay'); return !!(s && (s.classList.contains('open') || getComputedStyle(s).display !== 'none')); })(),
      card: (() => { const m = document.getElementById('bd-district-facility-modal'); return !!(m && m.classList.contains('open')); })(),
    }));
    say('거리 ' + d + ' → ' + JSON.stringify(r));
    if (r.shop) await h.shot('far_shop_' + d);
    await h.page.keyboard.press('Escape'); await h.wait(400);
  }
};
