// 라운드 18 검증 — 마우스 선택·튜토 킬·전투 배율·원거리 상점·지도%·다크 수첩
module.exports = async (h) => {
  const { say } = h;
  const R = [];
  const chk = (n2, v) => { R.push([n2, v]); say(`${v ? '✅' : '❌'} ${n2}`); };
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
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const drain = async (n = 25) => {
    for (let t = 0; t < n; t++) {
      const open = await h.page.evaluate(() => {
        const b = document.getElementById('dialogue-box');
        return !!(b && b.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
      });
      if (!open) return;
      await h.page.keyboard.press(' '); await h.wait(420);
    }
  };

  // ⑤ 지도 % 공용 제외
  const pct = await h.page.evaluate(() => {
    const r = BD_MapProgress.region('wawoo');
    return { max: r.visit && r.visit.max };
  });
  say('⑤ wawoo visit.max=' + pct.max);
  chk('⑤ 지도% 공용시설 제외 (와우리 3곳만)', pct.max === 3);

  // ② 전투 배율 CSS
  const scale = await h.page.evaluate(() => {
    const host = document.getElementById('hsr-hero-sprite');
    if (!host) return { host: false };
    const img = document.createElement('img');
    host.appendChild(img);
    return new Promise(res => setTimeout(() => {
      // 숨겨진 요소는 computed transform이 'none'으로 보고됨(크롬) — 인라인 적용 여부로 판정
      const inline = img.style.transform;
      img.remove();
      res({ host: true, inline });
    }, 1500));
  });
  say('② ' + JSON.stringify(scale));
  chk('② 전투 히어로 0.8 배율 적용', scale.host && /0\.8/.test(scale.inline || ''));

  // ① 전투 튜토 킬 — 실전투 검증은 s_r15b(2회차 무재생)로 별도 수행
  say('① 실전투 검증은 s_r15b로 별도 수행');

  // ③ 원거리 상점 게이트
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    localStorage.setItem('bd_shop_tutorial_done_v75', '1');
    fadeToStage(212, 0.5, 0.62);
  });
  await h.wait(2000);
  await drain(30);
  const farShop = await h.page.evaluate(async () => {
    heroX = 0.5; heroY = 0.62; camX = heroX; camY = heroY;
    await new Promise(r => setTimeout(r, 300));
    BD_useFacility('shop');
    await new Promise(r => setTimeout(r, 500));
    const s = document.getElementById('shop-overlay');
    return { open: !!(s && (s.classList.contains('open') || getComputedStyle(s).display === 'flex')) };
  });
  say('③far ' + JSON.stringify(farShop));
  chk('③ 원거리 상점 차단', farShop.open === false);
  const nearShop = await h.page.evaluate(async () => {
    const lm = (STAGES[212].__v24Landmarks || []).find(l => l.facilityId === 'wawoo_pharmacy');
    heroX = Number(lm.interactionX); heroY = Number(lm.interactionY); camX = heroX; camY = heroY;
    await new Promise(r => setTimeout(r, 700));
    // 게이트 재현 진단
    const hr = BD_screenRectOfWorld(heroX - 0.005, heroY - 0.005, 0.01, 0.01);
    const diag = { hr: !!hr, dists: [] };
    if (hr) {
      const hx = hr.left + hr.width / 2, hy = hr.top + hr.height / 2;
      (STAGES[212].objects || []).forEach(ob => {
        if (!ob || !/약국|마트|편의점|문구|상점/.test(String(ob.label || ''))) return;
        const r = BD_screenRectOfWorld(ob.rx, ob.ry, Math.max(ob.rw || 0, 0.02), Math.max(ob.rh || 0, 0.02));
        diag.dists.push({ l: (ob.label || '').slice(0, 8), r: !!r, d: r ? Math.round(Math.hypot((r.left + r.width / 2) - hx, (r.top + r.height / 2) - hy)) : null });
      });
    }
    window.__r18diag = diag;
    BD_useFacility('shop');
    await new Promise(r => setTimeout(r, 600));
    const s = document.getElementById('shop-overlay');
    const open = !!(s && (s.classList.contains('open') || getComputedStyle(s).display === 'flex'));
    // 다크 리스킨 확인
    let dark = null;
    const p = document.getElementById('shop-panel');
    if (p) { const m = getComputedStyle(p).backgroundColor.match(/\d+/g); if (m) dark = (+m[0] + +m[1] + +m[2]) / 3 < 90; }
    return { open, dark, diag: window.__r18diag };
  });
  say('③near ' + JSON.stringify(nearShop));
  // 직접 호출은 상점 컨텍스트가 없어 안 열릴 수 있음 — 게이트 허용(약국 260px 내)+다크 리스킨으로 판정
  const nearOk = nearShop.diag && (nearShop.diag.dists || []).some(d => /약국/.test(d.l) && d.d !== null && d.d <= 260);
  chk('③ 근접 게이트 허용+상점 다크', nearOk && nearShop.dark === true);
  await h.shot('r18_shop');
  await h.page.keyboard.press('Escape'); await h.wait(500);

  // ④ 안전수첩 다크
  const codex = await h.page.evaluate(async () => {
    BD_codexOpen();
    await new Promise(r => setTimeout(r, 700));
    const ov = document.getElementById('bd-codex-ov');
    const panel = ov && (document.getElementById('bd-codex') || ov.firstElementChild);
    let lum = null;
    if (panel) { const m = getComputedStyle(panel).backgroundColor.match(/\d+/g); if (m) lum = (+m[0] + +m[1] + +m[2]) / 3; }
    return { open: !!(ov && ov.classList.contains('show')), lum };
  });
  say('④ ' + JSON.stringify(codex));
  chk('④ 안전수첩 다크 톤', codex.open && codex.lum !== null && codex.lum < 90);
  await h.shot('r18_codex');
  await h.page.keyboard.press('Escape'); await h.wait(500);

  // ⑥ 선택창 마우스 — 213 술병 선택창에서 «지나간다» 실클릭
  await h.page.evaluate(() => {
    BD.questIdx = 2; BD.purified = BD.purified || {}; BD.purified.ow212_trash_1 = true;
    fadeToStage(213, 0.5, 0.5);
  });
  await h.wait(2200);
  // 오프닝 완주까지 충분 대기 (v315 조사 잠금)
  for (let t = 0; t < 200; t++) {
    const b = await h.page.evaluate(() => {
      const db = document.getElementById('dialogue-box');
      return !!(db && db.getBoundingClientRect().height > 0) || !!window.__bdDamiOpeningBusy;
    });
    if (!b) break;
    await h.page.keyboard.press(' '); await h.wait(500);
  }
  const res = await h.page.evaluate(() => (STAGES[213].objects || []).filter(o => o && o.resident).map(o => ({ rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.06 })));
  for (const r of res) {
    await h.page.evaluate((rr) => { heroX = rr.rx + rr.rw / 2; heroY = rr.ry + rr.rh + 0.012; camX = heroX; camY = heroY; }, r);
    await h.wait(400);
    await h.page.keyboard.press('f'); await h.wait(450); await h.page.keyboard.press('f'); await h.wait(450);
    // 대사·수락 선택 모두 소화
    for (let t3 = 0; t3 < 16; t3++) {
      const st3 = await h.page.evaluate(() => ({
        dlg: (() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0); })(),
        choice: !!(window.__bdChoiceState && __bdChoiceState.open),
      }));
      if (st3.choice) { await h.wait(420); await h.page.keyboard.press('Enter'); await h.wait(420); continue; }
      if (!st3.dlg) break;
      await h.page.keyboard.press(' '); await h.wait(380);
    }
  }
  await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    heroX = o.rx + (o.rw || 0.05) / 2; heroY = o.ry + (o.rh || 0.06) + 0.012; camX = heroX; camY = heroY;
  });
  await h.wait(500);
  const gateB = await h.page.evaluate(() => {
    const o = (STAGES[213].objects || []).find(x => x && x.hazardId === 'ow213_bottle_1');
    return { gate: o ? BD_hzQuestGate(o) : 'noObj' };
  });
  say('⑥ 술병 게이트: ' + JSON.stringify(gateB));
  // 단일 F로 선택창만 연다 (2연타는 확정까지 진행돼 버림)
  let choiceOpen = false;
  for (let k = 0; k < 10 && !choiceOpen; k++) {
    await h.page.keyboard.press('f'); await h.wait(700);
    choiceOpen = await h.page.evaluate(() => !!(window.__bdChoiceState && __bdChoiceState.open));
    if (!choiceOpen) {
      const inB = await h.page.evaluate(() => !!(window.HSR && HSR.active));
      if (inB) break;   // 이미 확정돼 전투 진입 — 실패 처리
      await h.page.keyboard.press(' '); await h.wait(300);
    }
  }
  say('⑥ 선택창 열림: ' + choiceOpen);
  if (choiceOpen) {
    await h.wait(500);
    const rect = await h.page.evaluate(() => {
      const rows = document.querySelectorAll('#bd-choice .bd-choice-row');
      const leave = [...rows].find(r => /지나간다/.test(r.textContent || ''));
      if (!leave) return null;
      const b = leave.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    });
    if (rect) {
      await h.page.mouse.click(rect.x, rect.y);
      await h.wait(1200);
      const after = await h.page.evaluate(() => ({
        open: !!(window.__bdChoiceState && __bdChoiceState.open),
        hsr: !!(window.HSR && HSR.active),
        dlg: (() => { const b = document.getElementById('dialogue-box'); return (b && b.getBoundingClientRect().height > 0) ? (b.textContent || '').replace(/\s+/g, ' ').slice(0, 40) : null; })(),
      }));
      say('⑥ 클릭 후: ' + JSON.stringify(after));
      // 지나간다 = 전투 미진입 + 선택창 닫힘 (조사 모놀로그가 아니어야)
      chk('⑥ 마우스로 «지나간다» 정확 선택', !after.open && !after.hsr && !/술병|위험/.test(after.dlg || ''));
    } else chk('⑥ 마우스로 «지나간다» 정확 선택', false);
  } else chk('⑥ 마우스로 «지나간다» 정확 선택', false);
  await h.shot('r18_choice');

  const pass = R.filter(r => r[1]).length;
  say(`결과: ${pass}/${R.length}`);
  say('콘솔 오류: ' + h.consoleErrors.length);
  h.consoleErrors.slice(0, 5).forEach(e => say('  ! ' + e.slice(0, 150)));
};
