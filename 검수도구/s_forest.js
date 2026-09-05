// 놀이숲 방문 루프 원인 실측
module.exports = async (h) => {
  const { say } = h;
  await h.click('#bd-title-start'); await h.wait(1500);
  // (v326 부팅) 리로드+자동클릭 흐름 — 타이틀 버튼이 사라질 때까지 대기
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
    if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) { } }).catch(() => { });   // 퍼지 훅 우회 직접 시작
    await h.wait(700);
  }
  // 전환 프레임(타이틀 숨김→모달 표시 사이) 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
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
  await h.page.evaluate(() => {
    localStorage.setItem('bd_dami_awake', '1'); localStorage.setItem('bd_tut2_done', '1');
    localStorage.setItem('bd_dami_tutorial_done', '1'); localStorage.setItem('bd_battle_tutorial_done', '1');
    if (window.fadeToStage) fadeToStage(211, 0.386, 0.336);
  });
  await h.wait(2500);
  for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(300); }
  const info = await h.page.evaluate(() => {
    heroX = 0.386; heroY = 0.336; camX = heroX; camY = heroY;
    const st = STAGES[211];
    const lm = (st.__v24Landmarks || []).find(l => /웃음만발/.test(l.label || ''));
    const near = window.BD_v24NearestFacility && BD_v24NearestFacility();
    return {
      bg: [st.bgW, st.bgH],
      lm: lm ? { fid: lm.facilityId, major: !!lm.majorFacility, r: [lm.rx, lm.ry, lm.rw, lm.rh].map(v => +Number(v).toFixed(3)), ix: +Number(lm.interactionX).toFixed(3), iy: +Number(lm.interactionY).toFixed(3) } : null,
      near: near ? near.label : null,
    };
  });
  say('실측: ' + JSON.stringify(info));
  const walls = await h.page.evaluate(() => (STAGES[211].objects || []).filter(o => o && /웃음만발놀이숲 부지/.test(o.label || '')).map(o => ({ l: o.label.replace('웃음만발놀이숲 부지 ', ''), rx: +Number(o.rx).toFixed(3), rw: +Number(o.rw).toFixed(3), ry: +Number(o.ry).toFixed(3) })));
  say('담장 실체: ' + JSON.stringify(walls));
  const col = await h.page.evaluate(() => {
    const out = [];
    for (let y = 0.345; y > 0.30; y -= 0.005) out.push([+y.toFixed(3), _collidesAt(0.386, y)]);
    return out;
  });
  say('북진 충돌 스캔(0.386,y): ' + JSON.stringify(col));
  // 입구로 북진 — 공원 안(iy 부근)까지 들어가는지
  await h.page.evaluate(() => { heroX = 0.386; heroY = 0.345; camX = heroX; camY = heroY; });
  for (let t = 0; t < 10; t++) {
    await h.hold('w', 400);
    const y = await h.page.evaluate(() => Number(heroY));
    if (y < 0.315) break;
  }
  const pos = await h.page.evaluate(() => [Number(heroX).toFixed(3), Number(heroY).toFixed(3)]);
  say('북진 후 위치: ' + JSON.stringify(pos) + (Number(pos[1]) < 0.32 ? ' ✅ 공원 진입' : ' ⛔ 진입 실패'));
  const calc = await h.page.evaluate(() => {
    const st = STAGES[211]; const bw = st.bgW, bh = st.bgH;
    const out = {};
    ['웃음만발', '더홀릭'].forEach(key => {
      const lm = (st.__v24Landmarks || []).find(l => l && (l.label || '').includes(key));
      if (!lm) { out[key] = null; return; }
      const px = heroX * bw, py = heroY * bh;
      const rl = lm.rx * bw, rt = lm.ry * bh, rr = rl + lm.rw * bw, rb = rt + lm.rh * bh;
      const dx = Math.max(rl - px, 0, px - rr), dy = Math.max(rt - py, 0, py - rb);
      const rect = Math.sqrt(dx * dx + dy * dy);
      const pt = Math.hypot((heroX - lm.interactionX) * bw, (heroY - lm.interactionY) * bh);
      out[key] = { rect: Math.round(rect), pt: Math.round(pt), ix: +Number(lm.interactionX).toFixed(3), iy: +Number(lm.interactionY).toFixed(3) };
    });
    out.near = (window.BD_v24NearestFacility() || {}).label;
    return out;
  });
  say('거리 계산: ' + JSON.stringify(calc));
  const yieldCalc = await h.page.evaluate(() => {
    const st = STAGES[211]; const bw = st.bgW, bh = st.bgH;
    let objD = Infinity, objL = null;
    (st.objects || []).forEach(o => {
      if (!o || o.hidden) return;
      const isHz = o.hazardId && !o.__bdGone && !o._purified;
      if (!isHz && !o.resident) return;
      const x0 = Number(o.rx || 0), y0 = Number(o.ry || 0);
      const x1 = x0 + Number(o.rw || 0.05), y1 = y0 + Number(o.rh || 0.075);
      const dxp = Math.max(x0 - heroX, 0, heroX - x1) * bw;
      const dyp = Math.max(y0 - heroY, 0, heroY - y1) * bh;
      const d = Math.sqrt(dxp * dxp + dyp * dyp);
      if (d < objD) { objD = d; objL = o.label; }
    });
    return { objD: Math.round(objD), objL };
  });
  say('양보 후보: ' + JSON.stringify(yieldCalc));
  for (let k = 0; k < 3; k++) {
    await h.wait(900);
    await h.key('f', 1, 300); await h.wait(900);
    const after = await h.page.evaluate(() => ({
      modalTitle: (() => { const m = document.getElementById('bd-district-facility-modal'); return m && m.classList.contains('open') ? (m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) : null; })(),
      dlg: (() => { const e = document.getElementById('dialogue-box'); return e && e.getBoundingClientRect().height > 0 ? (e.textContent || '').trim().slice(0, 40) : null; })(),
      visits: (() => { try { return JSON.parse(localStorage.getItem('bd_concept_facility_visits_v1')).visitedFacilityIds; } catch (e) { return []; } })(),
    }));
    say(`F#${k + 1} 후: ` + JSON.stringify(after));
    if (after.modalTitle || after.dlg) break;
  }
  await h.shot('forest');
};
