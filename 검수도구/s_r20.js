// 라운드 20 검증 — 가림 정밀·담이 2배·장난감
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
  await h.wait(2200);
  for (let i = 0; i < 8; i++) { await h.page.keyboard.press(' '); await h.wait(280); }

  // ① 가림 — 아파트 단지 뒤 부분 겹침 지점들 (스크린샷 재현: 건물 상단에 하반신만 겹치는 위치)
  const spots = await h.page.evaluate(() => {
    // 불투명 픽셀 위치를 스캔해 «건물 뒤» 지점을 구한다 (투명 갭 회피)
    const st = STAGES[212];
    const out = [];
    const apts = (st.objects || []).filter(o => o && /공동주택|아파트/.test(o.label || ''));
    const cv = document.createElement('canvas'); cv.width = 1; cv.height = 1;
    const sc = cv.getContext('2d', { willReadFrequently: true });
    for (const o of apts.slice(0, 3)) {
      const aid = o.assetId || (String(o.key || '').startsWith('asset:') ? String(o.key).slice(6) : null);
      const img = aid && window.BD_getAssetImage ? BD_getAssetImage(aid) : null;
      if (!img || !img.complete) continue;
      let found = null;
      for (let fx = 0.15; fx <= 0.85 && !found; fx += 0.05) {
        const u = Math.floor(fx * img.naturalWidth), v = Math.floor(0.25 * img.naturalHeight);
        sc.clearRect(0, 0, 1, 1);
        try { sc.drawImage(img, u, v, 1, 1, 0, 0, 1, 1); if (sc.getImageData(0, 0, 1, 1).data[3] > 100) found = fx; } catch (e) { }
      }
      if (found !== null) out.push({ x: o.rx + (o.rw || 0.1) * found, y: o.ry + (o.rh || 0.3) * 0.30, l: (o.label || '').slice(0, 10) });
      if (out.length >= 2) break;
    }
    return out;
  });
  say('가림 지점: ' + JSON.stringify(spots));
  let k = 0;
  for (const s of spots) {
    await h.page.evaluate((p) => { heroX = p.x; heroY = p.y; camX = heroX; camY = heroY; }, s);
    await h.wait(700);
    const occ = await h.page.evaluate(() => (window.__bdHeroDraw ? { occ: window.__bdHeroDraw.occ, rects: (window.__bdHeroDraw.occRects || []).length, y: +heroY.toFixed(3) } : null));
    say('  occ 상태: ' + JSON.stringify(occ));
    await h.shot('r20_occ' + (k++));
  }
  // 편의점 북측(지붕 밟기 재현 지점) — 부분 겹침에서 occ true 기대
  await h.page.evaluate(() => {
    const st = STAGES[212];
    const store = (st.objects || []).find(o => o && /편의점|CU|GS|스토어/.test(o.label || '')) || (st.objects || []).find(o => o && o.type === 'building');
    if (store) { heroX = store.rx + (store.rw || 0.1) * 0.2; heroY = store.ry + 0.008; camX = heroX; camY = heroY; }
  });
  await h.wait(700);
  const occ2 = await h.page.evaluate(() => (window.__bdHeroDraw ? { occ: window.__bdHeroDraw.occ, rects: (window.__bdHeroDraw.occRects || []).length } : null));
  say('편의점 북측 occ: ' + JSON.stringify(occ2));
  await h.shot('r20_store');
  say((occ2 && occ2.occ ? '✅' : '❌') + ' ① 부분 겹침 가림 인식');

  // ② 담이 2배
  await h.page.evaluate(() => { try { BD_DAMI.show('담이 UI 2배 스케일 확인용 대사입니다!', { face: 'proud' }); } catch (e) { } });
  await h.wait(800);
  const dami = await h.page.evaluate(() => {
    const el = document.getElementById('bd-dami-hud');
    const tr = el ? getComputedStyle(el).transform : null;
    const r = el ? el.getBoundingClientRect() : null;
    return { tr: String(tr).slice(0, 30), w: r && Math.round(r.width), h: r && Math.round(r.height) };
  });
  say('② ' + JSON.stringify(dami));
  say((/2/.test(dami.tr || '') && dami.h > 100 ? '✅' : '❌') + ' ② 담이 UI 2배');
  await h.shot('r20_dami');

  // ③ 장난감 — misc 아이템 구매 → 가방 → 놀기 버튼 → 버스트
  const toy = await h.page.evaluate(async () => {
    playerGold = 999;
    // 합성 장난감 아이템 주입 (문구·취미 탭과 동일 형태)
    const key = 'qa_toy';
    playerInventory[key] = { item: { id: key, name: '딱지', icon: '🃏', tab: 'misc' }, count: 1 };
    openInventory();
    await new Promise(r => setTimeout(r, 600));
    // 해당 아이템 슬롯 클릭
    selectInvItem && selectInvItem(key);
    await new Promise(r => setTimeout(r, 900));
    const btn = document.getElementById('bd-toy-btn');
    if (!btn) return { key, btn: false };
    btn.click();
    await new Promise(r => setTimeout(r, 500));
    const burst = !!document.querySelector('.bd-toy-burst');
    return { key, btn: true, burst };
  });
  say('③ ' + JSON.stringify(toy));
  say((toy.btn && toy.burst ? '✅' : '❌') + ' ③ 장난감 놀기');
  await h.shot('r20_toy');
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 140)));
};
