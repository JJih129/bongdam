// 상점 확충 검증 — 4개 리 상점 F 오픈 + 품목/품절 편차
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 40; t++) {
    const st = await h.page.evaluate(() => {
      const btn = document.getElementById('bd-title-start');
      const onTitle = !!(btn && btn.offsetHeight > 0);
      const m = document.getElementById('bd-startsetup-modal');
      if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }
      return onTitle || (m && m.classList.contains('show'));
    }).catch(() => true);
    if (!st) break;
    if (t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });
    await h.wait(700);
  }
  await h.wait(2500);
  const drain = async (n = 20) => {
    for (let t = 0; t < n; t++) {
      const st = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        const m = document.querySelector('.bd-modal.show');
        return { open: !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c || !!m, choice: c, modal: !!m };
      });
      if (!st.open) return;
      if (st.modal) { await h.page.keyboard.press('Escape'); await h.wait(400); continue; }
      if (st.choice) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  };
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });
  const visit = async (sid, label) => {
    await h.page.evaluate((p) => { if (Number(currentStage) !== p) fadeToStage(p, 0.5, 0.5); }, sid);
    await h.wait(1600); await drain(20);
    // 오프닝 대기
    for (let t = 0; t < 35; t++) {
      const busy = await h.page.evaluate(() => !!window.__bdDamiOpeningBusy);
      if (!busy) break;
      await h.wait(1000);
    }
    await h.page.evaluate((p) => {
      const o = (STAGES[p.sid].objects || []).find(x => x && x.label === p.label);
      if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.05) + 0.010; camX = heroX; camY = heroY; }
    }, { sid, label });
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(700); await h.page.keyboard.press('f'); await h.wait(900);
    // 시설 모달이 뜨면 상점 버튼 클릭
    const modal = await h.page.evaluate(() => {
      const m = document.querySelector('#bd-district-facility-modal, .bd-modal.show');
      if (!m || getComputedStyle(m).display === 'none') return null;
      const b = [...m.querySelectorAll('button')].find(x => /상점|구경|물건|구매/.test(x.textContent || ''));
      if (b) { b.click(); return { clicked: (b.textContent || '').slice(0, 16) }; }
      return { clicked: null, btns: [...m.querySelectorAll('button')].map(x => (x.textContent || '').slice(0, 12)) };
    });
    say('    모달: ' + JSON.stringify(modal));
    await h.wait(1100);
    const d = await h.page.evaluate(() => {
      const so = document.getElementById('shop-overlay');
      const items = document.getElementById('shop-items');
      const rows = items ? [...items.children] : [];
      return {
        open: so ? getComputedStyle(so).display !== 'none' : false,
        title: (document.getElementById('shop-title') || {}).textContent,
        rows: rows.length,
        sold: rows.filter(r => r.__bdSold).length,
        names: rows.map(r => (r.textContent || '').replace(/\s+/g, ' ').slice(0, 12)),
      };
    });
    say(`  ${sid} ${label}: ` + JSON.stringify(d));
    await h.shot('shop26_' + sid);
    await h.page.evaluate(() => { try { closeShop(); } catch (e) { } });
    await h.page.keyboard.press('Escape'); await h.wait(400);
    return d;
  };
  const r1 = await visit(210, '우리홈마트 수영점');
  const r2 = await visit(211, '또또마트 편의점');
  const r3 = await visit(212, '해피24 편의점');
  const r4 = await visit(213, '스마일25 편의점');
  const all = [r1, r2, r3, r4];
  const okOpen = all.every(r => r.open && r.rows > 0);
  say((okOpen ? '✅' : '❌') + ' 4개 리 상점 F 오픈 + 품목 표시');
  const sets = all.map(r => JSON.stringify(r.names));
  const varied = new Set(sets).size >= 3;
  say((varied ? '✅' : '⚠') + ' 상점별 품목 구성 차이 (' + new Set(sets).size + '/4 종류)');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
