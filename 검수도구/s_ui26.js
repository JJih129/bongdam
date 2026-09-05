// v353 검증 — UI 배율 설정 + 실전 상점 지점명·품절 편차
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

  // ══ ① UI 배율 ══
  await h.page.evaluate(() => { BD_openTitleOptions(); });
  await h.wait(700);
  const s1 = await h.page.evaluate(() => {
    const row = document.querySelector('#bd-settings-modal .bd-uiscale-row');
    return { row: !!row, btns: row ? row.querySelectorAll('button').length : 0 };
  });
  say('① 설정 행: ' + JSON.stringify(s1));
  await h.shot('ui26_settings');
  await h.page.evaluate(() => { BD_setUiScale('130'); });
  await h.wait(600);
  const s2 = await h.page.evaluate(() => ({
    zoom: document.body.style.zoom, saved: localStorage.getItem('bd_ui_scale_v353'),
    on: (() => { const b = document.querySelector('.bd-uiscale-row button[data-uis="130"]'); return b && b.classList.contains('on'); })(),
  }));
  say(((s1.row && s1.btns === 6 && s2.zoom === '1.3' && s2.saved === '130' && s2.on) ? '✅' : '❌') + ' ① UI 크기 130% 적용·저장·하이라이트 ' + JSON.stringify(s2));
  await h.shot('ui26_130');
  await h.page.evaluate(() => { BD_setUiScale('auto'); });
  await h.wait(400);
  const s3 = await h.page.evaluate(() => document.body.style.zoom);
  say((s3 === '' ? '✅' : '⚠') + ' ① 자동(현 해상도=100%) 복귀 zoom="' + s3 + '"');
  await h.page.evaluate(() => { document.getElementById('bd-settings-modal').classList.remove('show'); });
  await h.wait(300);

  // ══ ② 상점 지점화 ══
  await h.page.evaluate(() => { BD.questIdx = 4; try { bdSave(); } catch (e) { } });
  const visit = async (sid, label) => {
    await h.page.evaluate((p) => { if (Number(currentStage) !== p) fadeToStage(p, 0.5, 0.5); }, sid);
    await h.wait(1600); await drain(20);
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
    const diag = await h.page.evaluate(() => {
      const out = { wrapped: !!(window.BD_openShop && BD_openShop.__v353), err: null, clicked: null };
      try {
        const m = document.querySelector('.bd-modal.show');
        if (m) {
          const b = [...m.querySelectorAll('button')].find(x => /상점|구경|물건/.test(x.textContent || ''));
          if (b) { out.clicked = (b.textContent || '').slice(0, 14); b.click(); }
        }
        if (!out.clicked) { out.direct = true; window.BD_openShop && BD_openShop(); }
      } catch (e) { out.err = String(e).slice(0, 160); }
      return out;
    });
    say('    진단: ' + JSON.stringify(diag));
    await h.wait(1000);
    const post = await h.page.evaluate(() => ({
      shopShow: (() => { const m = document.getElementById('bd-shop-modal'); return m ? m.className : 'no-el'; })(),
      anyModals: [...document.querySelectorAll('.bd-modal')].map(x => x.id + ':' + (x.classList.contains('show') ? 'show' : '-')).slice(0, 6),
    }));
    say('    사후: ' + JSON.stringify(post));
    const d = await h.page.evaluate(() => {
      const m = document.getElementById('bd-shop-modal');
      if (!m || !m.classList.contains('show')) return { open: false };
      const btns = [...m.querySelectorAll('button.bd-equip-up')];
      return {
        open: true,
        head: ([...m.querySelectorAll('div,strong,span')].map(x => x.textContent).find(t => /소지금/.test(t || '')) || '').slice(0, 40),
        items: btns.length,
        sold: btns.filter(b => b.disabled && /품절/.test(b.textContent)).length,
        soldIdx: btns.map((b, i) => (b.disabled ? i : -1)).filter(i => i >= 0),
      };
    });
    say(`  ${sid} ${label}: ` + JSON.stringify(d));
    await h.shot('ui26_shop' + sid);
    await h.page.evaluate(() => { const m = document.getElementById('bd-shop-modal'); if (m) m.classList.remove('show'); });
    await h.page.keyboard.press('Escape'); await h.wait(400);
    return d;
  };
  const a = await visit(212, '해피24 편의점');
  const b = await visit(213, '스마일25 편의점');
  const c = await visit(210, '우리홈마트 수영점');
  const opened = [a, b, c].filter(x => x.open).length;
  say((opened === 3 ? '✅' : '❌') + ` ② 3개 지점 상점 모달 오픈 (${opened}/3)`);
  const branded = [a, b, c].every(x => !x.open || /편의점|마트/.test(x.head || ''));
  say((branded ? '✅' : '⚠') + ' ② 지점명 제목 표기');
  const pats = [a, b, c].filter(x => x.open && x.items >= 2).map(x => JSON.stringify(x.soldIdx));
  say((new Set(pats).size >= 2 || pats.length < 2 ? '✅' : '⚠') + ' ② 지점별 품절 패턴 (' + pats.join(' vs ') + ')');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
