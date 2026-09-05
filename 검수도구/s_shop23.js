// 상점 실경로 실측 — F키로 실제 열리는 UI 확인 + 품목 컨테이너 덤프
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
  const drain = async (n = 20) => {
    for (let t = 0; t < n; t++) {
      const st = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        const c = !!(window.__bdChoiceState && __bdChoiceState.open);
        return { open: !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy || c, choice: c };
      });
      if (!st.open) return;
      if (st.choice) { await h.wait(400); await h.page.keyboard.press('Enter'); await h.wait(350); continue; }
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  };
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000); await drain(20);

  const dumpUI = async () => await h.page.evaluate(() => {
    const so = document.getElementById('shop-overlay');
    const sm = document.getElementById('bd-shop-modal');
    const anyModal = document.querySelector('.bd-modal.show');
    const items = document.getElementById('shop-items');
    return {
      overlay: so ? getComputedStyle(so).display : null,
      overlayCls: so ? String(so.className) : null,
      shopModal: sm ? sm.classList.contains('show') : null,
      facModal: anyModal ? (anyModal.id || anyModal.className) : null,
      itemsN: items ? items.children.length : null,
      title: (document.getElementById('shop-title') || {}).textContent || null,
      near: (() => { try { return window.getNearStore ? 'fn' : 'no-fn'; } catch (e) { return 'err'; } })(),
    };
  });

  const visit = async (sid, label) => {
    await h.page.evaluate((p) => { if (Number(currentStage) !== p) fadeToStage(p, 0.5, 0.5); }, sid);
    await h.wait(1500); await drain(15);
    await h.page.evaluate((p) => {
      const o = (STAGES[p.sid].objects || []).find(x => x && x.label === p.label);
      if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.05) + 0.008; camX = heroX; camY = heroY; }
    }, { sid, label });
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(900);
    // 시설 모달이 열렸으면 «물건 구경하기» 클릭
    await h.page.evaluate(() => {
      const m = document.querySelector('.bd-modal.show');
      if (m) { const b = [...m.querySelectorAll('button')].find(x => /구경|상점/.test(x.textContent || '')); if (b) b.click(); }
    });
    await h.wait(1200);
    const d = await dumpUI();
    say(`  ${label}: ` + JSON.stringify(d));
    await h.shot('shop_' + sid + '_' + label.slice(0, 4));
    // 품목 목록 텍스트
    const itemsTxt = await h.page.evaluate(() => {
      const its = document.getElementById('shop-items');
      if (its && its.children.length) return [...its.children].map(r => (r.textContent || '').replace(/\s+/g, ' ').slice(0, 24));
      const sm = document.getElementById('bd-shop-modal');
      if (sm && sm.classList.contains('show')) return [...sm.querySelectorAll('.bd-equip-row, [class*=row], li')].slice(0, 12).map(r => (r.textContent || '').replace(/\s+/g, ' ').slice(0, 24));
      return null;
    });
    say('    품목: ' + JSON.stringify(itemsTxt));
    await h.page.evaluate(() => { try { closeShop && closeShop(); } catch (e) { } try { const m = document.getElementById('bd-shop-modal'); m && m.classList.remove('show'); } catch (e) { } });
    await h.page.keyboard.press('Escape'); await h.wait(500);
  };
  await visit(212, '해피24 편의점');
  await visit(212, '와우약국');
  await visit(211, '또또마트 편의점');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
