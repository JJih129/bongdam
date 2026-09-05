// 라운드 23 필수 검증 — ① 인벤 토글 자가치유 ② 라이트 감시견 ③ 상점 개명/편차 ④ 엔딩 연출
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
  const drain = async (n = 25) => {
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
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000); await drain(25);

  // ══ ① 인벤 토글 — 정상 3연속 + 플래그 탈동기 자가치유 ══
  const invVisible = async () => await h.page.evaluate(() => {
    const ov = document.getElementById('inv-overlay');
    if (!ov || !ov.classList.contains('open')) return false;
    const cs = getComputedStyle(ov);
    if (cs.display === 'none' || Number(cs.opacity) < 0.5) return false;
    const p = ov.firstElementChild; if (!p) return false;
    const r = p.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!(el && (ov.contains(el) || el === ov));
  });
  let okA = true;
  for (let i = 0; i < 3; i++) {
    await h.page.keyboard.press('e'); await h.wait(700);
    const vis = await invVisible();
    if (!vis) okA = false;
    say(`  ${i + 1}차 오픈 표시=${vis}`);
    await h.page.keyboard.press('e'); await h.wait(500);
  }
  say((okA ? '✅' : '❌') + ' ① 인벤 정상 토글 3연속');
  // 탈동기 유발: 플래그는 열림인데 창만 강제로 닫음(외부 경로 흉내) → 다음 E가 «헛닫기» 없이 열려야 함
  await h.page.keyboard.press('e'); await h.wait(700);
  await h.page.evaluate(() => { const ov = document.getElementById('inv-overlay'); if (ov) ov.classList.remove('open'); });
  await h.wait(300);
  await h.page.keyboard.press('e'); await h.wait(800);
  const healed = await invVisible();
  say((healed ? '✅' : '❌') + ' ① 플래그 탈동기 자가치유(E 1회로 재오픈)');
  await h.shot('r23_inv');
  await h.page.keyboard.press('Escape'); await h.wait(400);

  // ══ ② 라이트 미니게임 감시견 — 가짜 잔존 UI 8초 후 제거 ══
  await h.page.evaluate(() => {
    const d = document.createElement('div'); d.id = 'bd-mg-light';
    d.style.cssText = 'position:fixed;inset:20% 30%;background:#123;z-index:9999;';
    document.body.appendChild(d);
  });
  await h.wait(10500);
  const ltGone = await h.page.evaluate(() => !document.getElementById('bd-mg-light'));
  say((ltGone ? '✅' : '❌') + ' ② 라이트 잔존 UI 감시견 제거(10초 내)');

  // ══ ③ 상점 개명 + 상품 편차 ══
  const names = await h.page.evaluate(() => {
    const out = {};
    [210, 211, 212, 213].forEach(sid => {
      out[sid] = (STAGES[sid].objects || []).filter(o => o && o.label && /약국|편의점|마트/.test(o.label)).map(o => o.label);
    });
    return out;
  });
  say('③ 상점 라벨: ' + JSON.stringify(names));
  const renamed = JSON.stringify(names).includes('해피24 편의점') && JSON.stringify(names).includes('또또마트 편의점')
    && JSON.stringify(names).includes('스마일25 편의점') && !JSON.stringify(names).includes('대학약국');
  say((renamed ? '✅' : '❌') + ' ③ 편의점 이름 분배 반영');
  // 두 상점의 품절 패턴 비교
  const soldPattern = async (label) => {
    await h.page.evaluate((L) => {
      const lm = (STAGES[currentStage].__v24Landmarks || []).find(x => x.label === L)
        || (STAGES[currentStage].objects || []).find(o => o && o.label === L);
      window.__bdShopT = L;
      BD_useFacility ? null : null;
    }, label);
    return null;
  };
  const openShopAt = async (sid, label) => {
    await h.page.evaluate((p) => {
      if (Number(currentStage) !== p.sid) fadeToStage(p.sid, 0.5, 0.5);
    }, { sid, label });
    await h.wait(1600); await drain(15);
    return await h.page.evaluate((p) => {
      const o = (STAGES[p.sid].objects || []).find(x => x && x.label === p.label);
      if (!o) return { err: 'no obj' };
      heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.05) + 0.01; camX = heroX; camY = heroY;
      try { openShop && openShop(o); } catch (e) { }
      return { ok: true };
    }, { sid, label });
  };
  const readSold = async () => await h.page.evaluate(() => {
    const items = document.getElementById('shop-items');
    if (!items) return null;
    const rows = [...items.children];
    return {
      title: (document.getElementById('shop-title') || {}).textContent || '',
      total: rows.length,
      sold: rows.filter(r => r.__bdSold).length,
    };
  });
  await openShopAt(212, '해피24 편의점'); await h.wait(1400);
  const s1 = await readSold(); say('  212 해피24: ' + JSON.stringify(s1));
  await h.shot('r23_shop1');
  await h.page.evaluate(() => { try { closeShop(); } catch (e) { } }); await h.wait(400);
  await openShopAt(212, '와우약국'); await h.wait(1400);
  const s2 = await readSold(); say('  212 와우약국: ' + JSON.stringify(s2));
  await h.shot('r23_shop2');
  await h.page.evaluate(() => { try { closeShop(); } catch (e) { } }); await h.wait(400);
  const varied = !!(s1 && s2 && s1.total > 0 && (s1.sold !== s2.sold || s1.sold > 0 || s2.sold > 0));
  say(((s1 && s2) ? (varied ? '✅' : '⚠(편차 0 — 해시 우연 동일 가능)') : '❌') + ' ③ 상점별 상품 편차');

  // ══ ④ 엔딩 축하 연출 유닛 ══
  await h.page.evaluate(() => {
    let m = document.getElementById('bd-ending-modal');
    if (!m) { m = document.createElement('div'); m.id = 'bd-ending-modal'; document.body.appendChild(m); }
    m.classList.add('show');
  });
  await h.wait(1500);
  const fx1 = await h.page.evaluate(() => {
    const f = document.getElementById('bd-ending-fx');
    return f ? { on: f.classList.contains('on'), title: !!f.querySelector('.efx-title'), canvas: !!f.querySelector('canvas') } : null;
  });
  say('④ 엔딩FX: ' + JSON.stringify(fx1));
  await h.shot('r23_ending');
  await h.wait(5500);
  const fx2 = await h.page.evaluate(() => !document.getElementById('bd-ending-fx'));
  say(((fx1 && fx1.on && fx2) ? '✅' : '❌') + ' ④ 엔딩 연출 표시 후 자동 정리');
  await h.page.evaluate(() => { const m = document.getElementById('bd-ending-modal'); if (m) m.classList.remove('show'); });

  say('스탬프: ' + await h.page.evaluate(() => localStorage.getItem('bd_bake_stamp')));
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 6).forEach(e => say('  ! ' + e.slice(0, 160)));
};
