// 건물 가림(occlusion) 검증
//  v331: 히어로가 건물 «위»(북쪽)에 서도 항상 최상위에 그려져 지붕을 밟는 것처럼 보임 (버그 재현)
//  v332: 건물 발선보다 위(뒤)에 서면 Y정렬로 가려지고, 실루엣만 표시 (__bdHeroDraw.occ === true)
module.exports = async (h) => {
  const { say } = h;
  // ── 표준 부팅 프리앰블 (v326+) ──
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }

  // ── 튜토 격리 + 필드 진입 ──
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
  });

  // ── 건물 후보 탐색: «신월드(구운 배치) 스테이지(200번대)» 중 가장 큰 시각 오브젝트(건물/에셋) ──
  //  (스테이지 1 등 레거시 맵은 실플레이 동선이 아니므로 제외 — 구버전 배치로 오인 방지)
  const pick = await h.page.evaluate(() => {
    const SKIP = { wall: 1, park: 1, library: 1, stair: 1, platform: 1 };
    const best = { area: 0, sid: null, o: null };
    for (const k of Object.keys(STAGES)) {
      if (Number(k) < 200 || Number(k) >= 300) continue;
      const st = STAGES[k];
      if (!st || st.interior || !st.objects) continue;
      for (const o of st.objects) {
        if (!o || SKIP[o.type] || o.resident) continue;
        const isVisual = o.type === 'building' || o.assetId || String(o.key || '').indexOf('asset:') === 0;
        if (!isVisual) continue;
        const area = (o.rw || 0) * (o.rh || 0);
        if (area > best.area && (o.rh || 0) > 0.08) { best.area = area; best.sid = Number(k); best.o = o; }
      }
    }
    const o = best.o;
    return o ? { sid: best.sid, rx: o.rx, ry: o.ry, rw: o.rw, rh: o.rh, label: o.label || o.key || o.assetId || '?' }
             : { none: true };
  });
  say('대상 건물: ' + JSON.stringify(pick));
  if (pick.none) { say('❌ 건물 후보 없음'); return; }

  const behindX = pick.rx + pick.rw / 2;
  const behindY = pick.ry + pick.rh - 0.03;   // 발선보다 살짝 위 = 건물 «뒤»
  const frontY  = pick.ry + pick.rh + 0.10;   // 발선 아래 = 건물 «앞»

  await h.page.evaluate((p) => { fadeToStage(p.sid, p.x, p.y); }, { sid: pick.sid, x: behindX, y: behindY });
  await h.wait(2200);

  // 대사 드레인
  for (let d = 0; d < 12; d++) {
    const busy = await h.page.evaluate(() => {
      const b = document.getElementById('dialogue-box');
      return !!((b && b.getBoundingClientRect().height > 0) || window.__bdDamiOpeningBusy);
    });
    if (!busy) break;
    await h.page.keyboard.press(' '); await h.wait(600);
  }

  // 좌표 강제(스폰 보정 대비) 후 관측
  const obsBehind = await h.page.evaluate((p) => {
    heroX = p.x; heroY = p.y;
    return new Promise(res => setTimeout(() => {
      const hd = window.__bdHeroDraw || null;
      res({ hx: +heroX.toFixed(3), hy: +heroY.toFixed(3),
            occ: hd ? hd.occ : 'no-field', hasDraw: !!hd, stage: Number(currentStage) });
    }, 400));
  }, { x: behindX, y: behindY });
  say('뒤(가림 기대): ' + JSON.stringify(obsBehind));
  await h.shot('heroocc_behind');

  const obsFront = await h.page.evaluate((p) => {
    heroX = p.x; heroY = p.y;
    return new Promise(res => setTimeout(() => {
      const hd = window.__bdHeroDraw || null;
      res({ hx: +heroX.toFixed(3), hy: +heroY.toFixed(3), occ: hd ? hd.occ : 'no-field' });
    }, 400));
  }, { x: behindX, y: frontY });
  say('앞(비가림 기대): ' + JSON.stringify(obsFront));
  await h.shot('heroocc_front');

  say('콘솔 에러 수: ' + h.consoleErrors.length);
};
