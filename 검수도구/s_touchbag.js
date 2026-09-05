// 터치: 가방 열기 → 담이 대사 중 ✕ 탭이 먹는지 (elementFromPoint·닫힘 여부)
module.exports = async (h) => {
  const { say } = h;
  await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) { await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }); await h.wait(600); if (await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break; }
  await h.wait(2500);
  // 튜토 격리 없이 실제 흐름: 배지까지는 키보드로 빠르게 진행 (이미 검증됨), 가방 단계만 터치로
  await h.page.evaluate(() => { localStorage.setItem('bd_dami_awake', '0'); });
  const tap = async (x, y) => { await h.page.touchscreen.tap(x, y); };
  const tapDlg = async (n) => { for (let i = 0; i < n; i++) { const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); }); if (!d) return; await tap(640, 200); await h.wait(450); } };
  await tapDlg(12);
  // step0 이동
  await h.page.keyboard.down('a'); await h.wait(900); await h.page.keyboard.up('a'); await h.page.keyboard.down('d'); await h.wait(900); await h.page.keyboard.up('d');
  await tapDlg(8);
  // 선생님에게 (키보드 이동)
  for (let r = 0; r < 12; r++) { const p = await h.page.evaluate(() => [heroX, heroY]); const dx = 0.59 - p[0], dy = 0.33 - p[1]; if (Math.hypot(dx, dy) < 0.03) break; const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w'); await h.page.keyboard.down(k); await h.wait(400); await h.page.keyboard.up(k); }
  await tapDlg(8); await h.page.keyboard.press('f'); await h.wait(600); await h.page.keyboard.press('f'); await h.wait(800);
  for (let i = 0; i < 50; i++) { const s = await h.page.evaluate(() => ({ step: window.__bdTut2Step, cer: !!(document.getElementById('bd-badge-ov') && document.getElementById('bd-badge-ov').style.display === 'flex'), dlg: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() })); if (s.step >= 2) break; if (s.cer || s.dlg) await tap(640, 200); await h.wait(500); }
  say('step=' + await h.page.evaluate(() => window.__bdTut2Step));
  // 가방: 터치 E
  const eb = await h.page.evaluate(() => { const e = document.getElementById('tc-btn-e'); const r = e && e.getBoundingClientRect(); return r && r.height > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; });
  await tap(eb[0], eb[1]); await h.wait(1200);
  for (let i = 0; i < 12; i++) {
    const st = await h.page.evaluate(() => {
      const c = [...document.querySelectorAll('button,div,span')].filter(e => /^✕$/.test((e.textContent || '').trim()) && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== 'none');
      const x = c[c.length - 1]; const r = x && x.getBoundingClientRect(); const cx = r ? r.left + r.width / 2 : 0, cy = r ? r.top + r.height / 2 : 0;
      const top = document.elementFromPoint(cx, cy);
      const inv = document.getElementById('inv-overlay') || document.querySelector('[id*="inv"]');
      const invEl = document.getElementById('inv-overlay');
      return { xbtn: !!x, at: [Math.round(cx), Math.round(cy)], top: top && (top.id || top.className || top.tagName), invOpen: !!(invEl && getComputedStyle(invEl).display !== 'none' && invEl.getBoundingClientRect().height > 0), dami: (document.getElementById('bd-dami-hud') || {}).textContent, blocked: !!(BD_isInputBlocked && BD_isInputBlocked()), step: window.__bdTut2Step };
    });
    say('  t' + i + ' ' + JSON.stringify(st).slice(0, 220));
    if (!st.invOpen) break;
    if (st.xbtn) await tap(st.at[0], st.at[1]);
    await h.wait(900);
  }
  await tapDlg(10); await h.wait(1500);
  say('최종 step=' + await h.page.evaluate(() => window.__bdTut2Step) + ' invOpen=' + await h.page.evaluate(() => { const e = document.getElementById('inv-overlay'); return !!(e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0); }));
  await h.shot('tb_final');
  // 엘리베이터: 조이스틱 드래그 이동 → 조사 버튼
  const getJoy = () => h.page.evaluate(() => { const e = document.getElementById('tc-joy-base'); const r = e && e.getBoundingClientRect(); return (r && r.height > 0) ? [r.left + r.width / 2, r.top + r.height / 2] : null; });
  const drag = async (dx, dy, ms) => { const joy = await getJoy(); if (!joy) { say('  (조이스틱 숨김 — 대기)'); await h.wait(500); return; } const cdp = await h.page.context().newCDPSession(h.page); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: joy[0], y: joy[1], id: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: joy[0] + dx, y: joy[1] + dy, id: 1 }] }); await h.wait(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach(); };
  say('조이스틱 위 최상위 요소: ' + JSON.stringify(await h.page.evaluate(() => { const e = document.getElementById('tc-joy-base'); const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const cs = t && getComputedStyle(t); return { top: t && (t.id || t.className || t.tagName), pe: cs && cs.pointerEvents, z: cs && cs.zIndex, guideOpen: !!window.__bdGuideOpen, blocked: !!(BD_isInputBlocked && BD_isInputBlocked()), tcDisplay: getComputedStyle(document.getElementById('touch-controls')).display, spot: ['bd-spot', 'bd-spot2', 'bd-spot-block'].map(id => { const s = document.getElementById(id); return s ? id + ':' + getComputedStyle(s).display + '/' + getComputedStyle(s).pointerEvents : id + ':-'; }) }; })));
  for (let i = 0; i < 20; i++) {
    const sid = await h.page.evaluate(() => Number(currentStage)); if (sid === 212) break;
    await tapDlg(3);
    const p = await h.page.evaluate(() => [heroX, heroY]); const dx = 0.700 - p[0], dy = 0.185 - p[1];
    if (Math.hypot(dx, dy) < 0.03) { const fb = await h.page.evaluate(() => { const e = document.getElementById('tc-btn-f'); const r = e && e.getBoundingClientRect(); return r && r.height > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; }); if (fb) { await tap(fb[0], fb[1]); await h.wait(1800); } continue; }
    await drag(Math.abs(dx) > 0.012 ? Math.sign(dx) * 45 : 0, Math.abs(dy) > 0.012 ? Math.sign(dy) * 45 : 0, 500);
  }
  await h.wait(1500);
  const sidNow = await h.page.evaluate(() => Number(currentStage));
  say((sidNow === 212 ? '✅' : '❌') + ' 터치 월드 진출 stage=' + sidNow + ' hero=' + JSON.stringify(await h.page.evaluate(() => [+heroX.toFixed(3), +heroY.toFixed(3)])));
  await h.shot('tb_world');
};
