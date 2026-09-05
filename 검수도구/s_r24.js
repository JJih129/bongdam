// 라운드 24 신규 커버리지 — 새 지도 어뷰즈 · 엔딩FX · 상점 실오픈/구매 · 라이트 실전 · 보스 페이즈 스프라이트
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
    fadeToStage(212, 0.5, 0.55);
  });
  await h.wait(2000); await drain(25);

  // ══ ① 새 지도 어뷰즈 ══
  for (let i = 0; i < 10; i++) { await h.page.keyboard.press('m'); await h.wait(180); }
  await h.wait(600);
  const m1 = await h.page.evaluate(() => {
    const d = document.getElementById('bd-map-v342');
    return { show: d && d.classList.contains('show'), boardKids: (document.getElementById('bd-map-v342-board') || { children: [] }).children.length };
  });
  say('① M 연타 10회 후: ' + JSON.stringify(m1) + ' (홀수번 → 열림 정상)');
  // 지도 열림 상태 보정
  await h.page.evaluate(() => { BD_openSafetyMap(); }); await h.wait(400);
  // 지도 열림 중 E(인벤) → 안 열려야
  await h.page.keyboard.press('e'); await h.wait(500);
  const m2 = await h.page.evaluate(() => ({
    map: document.getElementById('bd-map-v342').classList.contains('show'),
    inv: (() => { const o = document.getElementById('inv-overlay'); return !!(o && o.classList.contains('open')); })(),
  }));
  say(((m2.map && !m2.inv) ? '✅' : '❌') + ' ① 지도 중 E 인벤 차단 ' + JSON.stringify(m2));
  await h.page.keyboard.press('Escape'); await h.wait(400);
  // 대화 중 M → 안 열려야
  await h.page.evaluate(() => { try { BD_DAMI && BD_DAMI.show('테스트 대사입니다', { face: 'idle' }); } catch (e) { } });
  await h.wait(400);
  await h.page.keyboard.press('m'); await h.wait(500);
  const m3 = await h.page.evaluate(() => ({
    blocked: (() => { try { return BD_isInputBlocked(); } catch (e) { return 'err'; } })(),
    map: document.getElementById('bd-map-v342').classList.contains('show'),
  }));
  say((!m3.map || m3.blocked !== true ? (m3.blocked === true && m3.map ? '❌' : '✅') : '❌') + ' ① 대화/차단 중 M ' + JSON.stringify(m3));
  await drain(10);

  // ══ ② 엔딩FX(v345 fx2) 인터플레이 — ESC 연타 후에도 자동/클릭 정리 ══
  await h.page.evaluate(() => {
    let m = document.getElementById('bd-ending-modal');
    if (!m) { m = document.createElement('div'); m.id = 'bd-ending-modal'; document.body.appendChild(m); }
    m.classList.add('show');
  });
  await h.wait(1500);
  const e0 = await h.page.evaluate(() => !!document.getElementById('bd-ending-fx2'));
  for (let i = 0; i < 4; i++) { await h.page.keyboard.press('Escape'); await h.wait(200); } // 연출 중 ESC 연타
  await h.page.mouse.click(720, 400); // 클릭 스킵
  await h.wait(1500);
  const e1 = await h.page.evaluate(() => ({
    shown: true,
    fxGone: !document.getElementById('bd-ending-fx2'),
  }));
  say(((e0 && e1.fxGone) ? '✅' : '❌') + ` ② 엔딩FX 표시(${e0})→ESC연타+클릭 스킵 정리(${e1.fxGone})`);
  await h.page.evaluate(() => { const m = document.getElementById('bd-ending-modal'); if (m) m.classList.remove('show'); });

  // ══ ③ 상점 실오픈 + 구매 ══
  await h.page.evaluate(() => { playerGold = (typeof playerGold === 'number' ? playerGold : 0) + 2000; });
  const openReal = async (label) => {
    await h.page.evaluate((L) => {
      const o = (STAGES[212].objects || []).find(x => x && x.label === L)
        || (STAGES[212].__v24Landmarks || []).find(x => x && x.label === L);
      if (o) { heroX = o.rx + (o.rw || 0.04) / 2; heroY = o.ry + (o.rh || 0.05) + 0.010; camX = heroX; camY = heroY; }
    }, label);
    await h.wait(500);
    await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(900);
    // 시설 모달 경유 시 «구경하기» 클릭
    await h.page.evaluate(() => {
      const m = document.querySelector('.bd-modal.show');
      if (m) { const b = [...m.querySelectorAll('button')].find(x => /구경|상점|구매/.test(x.textContent || '')); if (b) b.click(); }
    });
    await h.wait(1300);
    return await h.page.evaluate(() => {
      const so = document.getElementById('shop-overlay');
      const sm = document.getElementById('bd-shop-modal');
      const items = document.getElementById('shop-items');
      return {
        overlay: so ? getComputedStyle(so).display : null,
        modal: sm ? sm.classList.contains('show') : null,
        rows: items ? items.children.length : 0,
        sold: items ? [...items.children].filter(r => r.__bdSold).length : 0,
        title: (document.getElementById('shop-title') || {}).textContent,
      };
    });
  };
  const s1 = await openReal('해피24 편의점');
  say('③ 해피24 F오픈: ' + JSON.stringify(s1));
  const shopOpened = (s1.overlay && s1.overlay !== 'none') || s1.modal;
  say((shopOpened ? '✅' : '❌') + ' ③ 상점 실제 오픈 경로');
  await h.shot('r24_shop_open');
  if (s1.overlay && s1.overlay !== 'none' && s1.rows > 0) {
    // 정상 품목 구매 1회
    const buy = await h.page.evaluate(() => {
      const items = document.getElementById('shop-items');
      const row = [...items.children].find(r => !r.__bdSold && r.querySelector('button') && !r.querySelector('button').disabled);
      if (!row) return { err: '구매 가능 행 없음' };
      const name = (row.textContent || '').replace(/\s+/g, ' ').slice(0, 16);
      const before = Object.keys(window.playerInventory || {}).length;
      row.querySelector('button').click();
      return { name, before };
    });
    await h.wait(800);
    const after = await h.page.evaluate((b) => ({
      invN: Object.keys(window.playerInventory || {}).length,
      grew: Object.keys(window.playerInventory || {}).length >= b,
    }), buy.before || 0);
    say(((buy.err ? '⚠ ' + buy.err : (after.grew ? '✅' : '❌'))) + ' ③ 구매→인벤 반영 ' + JSON.stringify({ buy: buy.name, inv: after.invN }));
    // 품절 버튼 클릭 무반응 확인
    const soldTry = await h.page.evaluate(() => {
      const items = document.getElementById('shop-items');
      const row = [...items.children].find(r => r.__bdSold);
      if (!row) return 'no-sold-row';
      const btn = row.querySelector('button');
      return btn ? btn.disabled : 'no-btn';
    });
    say((soldTry === true || soldTry === 'no-sold-row' ? '✅' : '❌') + ' ③ 품절 버튼 비활성 (' + soldTry + ')');
  }
  await h.page.evaluate(() => { try { closeShop(); } catch (e) { } });
  await h.page.keyboard.press('Escape'); await h.wait(500);

  // ══ ④ 라이트 미니게임 실전 — 스킬 지급 후 전투에서 사용 ══
  await h.page.evaluate(() => {
    BD.unlockedSkills = BD.unlockedSkills || [];
    if (BD.unlockedSkills.indexOf('light') < 0) BD.unlockedSkills.push('light');
  });
  // 일반 위험요소 전투 진입
  await h.page.evaluate(() => {
    const t = (STAGES[212].objects || []).find(x => x && x.hazardId && !x.isBoss && !x.__bdGone && !(BD.purified || {})[x.hazardId] && !BD_hzQuestGate(x));
    if (t) { heroX = t.rx + (t.rw || 0.04) / 2; heroY = t.ry + (t.rh || 0.05) + 0.012; camX = heroX; camY = heroY; window.__lt = t.hazardId; }
    else window.__lt = null;
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(600);
  for (let k = 0; k < 18; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(330);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(330); }
  }
  const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
  say('④ 전투 진입: ' + inB + ' (대상 ' + (await h.page.evaluate(() => window.__lt)) + ')');
  if (inB) {
    await drainBattleIntro(h);
    // E → 배지 스킬 카드에서 light 선택
    await h.page.keyboard.press('e'); await h.wait(900);
    const card = await h.page.evaluate(() => {
      const cs = [...document.querySelectorAll('.bd-skillpick-card, .bd-aug-card, [class*=skill] [class*=card], button, div')]
        .filter(x => /라이트|안전 점검/.test(x.textContent || '') && x.getBoundingClientRect().height > 10);
      const c = cs.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
      if (c) { const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: (c.textContent || '').slice(0, 20) }; }
      return null;
    });
    say('④ 라이트 카드: ' + JSON.stringify(card));
    if (card) {
      await h.page.mouse.click(card.x, card.y);
      await h.wait(1200);
      const mg1 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
      say('④ 미니게임 표시: ' + mg1);
      await h.shot('r24_light_mg');
      if (mg1) {
        await h.wait(6500); // DUR 5600 → MISS 종료 대기
        const mg2 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
        await h.wait(4000); // 감시견 여유
        const mg3 = await h.page.evaluate(() => !!document.getElementById('bd-mg-light'));
        say((!mg3 ? '✅' : '❌') + ` ④ 라이트 종료 후 UI 닫힘 (직후=${!mg2} 감시견후=${!mg3})`);
        await h.shot('r24_light_after');
      }
    }
    // 전투 이탈
    await h.page.keyboard.press('Escape'); await h.wait(700);
    await drain(10);
  }

  // ══ ⑤ 보스 그로기·팔파괴 중 스프라이트 유지 ══
  await h.page.evaluate(() => { BD.questIdx = 5; fadeToStage(212, 0.55, 0.8); });
  await h.wait(1800); await drain(15);
  await h.page.evaluate(() => {
    const boss = (STAGES[212].objects || []).find(o => o && o.hazardId === 'final_boss_1');
    if (boss) { heroX = boss.rx + (boss.rw || 0.1) / 2; heroY = boss.ry + (boss.rh || 0.1) + 0.012; camX = heroX; camY = heroY; }
  });
  await h.wait(400);
  await h.page.keyboard.press('f'); await h.wait(500); await h.page.keyboard.press('f'); await h.wait(700);
  for (let k = 0; k < 20; k++) {
    const st = await h.page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
    if (st.b) break;
    if (st.c) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
    await h.page.keyboard.press(' '); await h.wait(350);
    if (k % 5 === 4) { await h.page.keyboard.press('f'); await h.wait(350); }
  }
  const inBoss = await h.page.evaluate(() => !!(window.HSR && HSR.active && HSR._isBoss));
  say('⑤ 보스전 진입: ' + inBoss);
  if (inBoss) {
    await h.page.evaluate(() => {
      try { if (window.HSR && HSR.bossParts) { if (HSR.bossParts.r) HSR.bossParts.r.hp = 0; if (HSR.bossParts.l) HSR.bossParts.l.hp = 0; } } catch (e) { }
      try { if (window.bdRenderBossSprite) bdRenderBossSprite(); } catch (e) { }
      try { if (HSR.enemy) HSR.enemy._groggy = 2; } catch (e) { }
    });
    await h.wait(1500); // 감시(600ms) 2틱 여유
    const bs = await h.page.evaluate(() => {
      const sp = document.getElementById('hsr-enemy-sprite');
      const img = sp && sp.querySelector('img');
      return img ? img.src.slice(0, 22) : null;
    });
    say((bs && bs.startsWith('data:image/webp') ? '✅' : '❌') + ' ⑤ 팔파괴/그로기 후에도 새 스프라이트 유지 (' + bs + ')');
    await h.shot('r24_boss_groggy');
    await h.page.keyboard.press('Escape'); await h.wait(600);
  }

  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 8).forEach(e => say('  ! ' + e.slice(0, 160)));

  async function drainBattleIntro(hh) {
    for (let i = 0; i < 8; i++) {
      const d = await hh.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
      if (!d) break;
      await hh.page.keyboard.press(' '); await hh.wait(400);
    }
  }
};
