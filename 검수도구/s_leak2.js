// 경로② 시설 휴식 잠금 누수 — 원인 분해 (어떤 조건이 true 인가)
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start');
  await h.wait(1500);
  for (let t = 0; t < 15; t++) {
    await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
    await h.wait(600);
    const gone = await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); });
    if (gone) break;
  }
  await h.wait(2500);
  // 프롤로그 독백 소진 후 스킵 플래그 + 이동
  for (let i = 0; i < 5; i++) { await h.page.keyboard.press(' '); await h.wait(450); }
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    if (window.fadeToStage) fadeToStage(212, 0.5, 0.5);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }

  const diag = async (tag) => {
    const d = await h.page.evaluate(() => {
      const out = { blk: !!(window.BD_isInputBlocked && BD_isInputBlocked()) };
      const vis = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 100 && r.height > 100; };
      out.panels = ['shop-overlay', 'inv-overlay', 'quest-overlay', 'notebook-overlay', 'place-overlay', 'safety-map-overlay', 'equip-overlay', 'bag-overlay', 'bd-gamesel', 'bd-songsel', 'bd-district-facility-modal', 'bd-bus-modal'].filter(id => vis(document.getElementById(id)));
      out.flags = { sel: !!window.__bdSelectOpen, song: !!window.__bdSongSelOpen, arcade: !!window.__bdArcadeOpen, scene: !!window.__bdSceneActive, mg: !!window.__bdMgActive };
      out.boss = (() => { const b = document.getElementById('bd-boss-dlg'); return !!(b && b.classList.contains('on')); })();
      out.ovl = (() => { const e = document.getElementById('dialogue-overlay'); return e ? getComputedStyle(e).display : '-'; })();
      out.choiceLike = [...document.querySelectorAll('div')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.position === 'fixed' && cs.display !== 'none' && r.width > 200 && r.height > 150 && +cs.opacity > 0.5 && (e.id || e.className); }).slice(0, 8).map(e => (e.id || String(e.className).slice(0, 25)) + '@' + Math.round(e.getBoundingClientRect().width));
      out.hsr = !!(window.HSR && HSR.active);
      out.fade = (() => { const f = document.getElementById('bd-fade') || document.getElementById('fade-overlay'); return f ? getComputedStyle(f).opacity : '-'; })();
      return out;
    });
    say(`[${tag}] ` + JSON.stringify(d));
    return d;
  };

  await diag('기준');
  // 약국으로 이동 → F → 「잠시 쉬어 가기」
  await h.page.evaluate(() => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
    if (lm) { heroX = Number(lm.rx) + Number(lm.rw) / 2; heroY = Number(lm.ry) + Number(lm.rh) + 0.005; camX = heroX; camY = heroY; }
  });
  await h.wait(500);
  await h.key('f', 1, 300); await h.wait(1200);
  await diag('F직후');
  await h.shot('L2_card');
  const restClicked = await h.page.evaluate(() => {
    const btns = [...document.querySelectorAll('button,div')].filter(e => /잠시 쉬어 가기/.test(e.textContent || '') && e.getBoundingClientRect().height > 10 && e.getBoundingClientRect().height < 90);
    const b = btns[btns.length - 1]; if (b) { b.click(); return true; } return false;
  });
  say('휴식 클릭: ' + restClicked);
  for (let t = 0; t < 12; t++) {
    await h.wait(1000);
    const d = await diag('휴식+' + (t + 1) + 's');
    if (!d.blk) { say('✅ 잠금 해제'); break; }
    if (t === 5) await h.shot('L2_stuck');
    // 도중에 뜨는 카드/대화 소진
    await h.page.evaluate(() => { const ov = document.getElementById('dialogue-overlay'); if (ov && getComputedStyle(ov).display !== 'none') ov.click(); });
  }
  await h.shot('L2_end');
  say('콘솔 오류: ' + h.consoleErrors.length);
};
