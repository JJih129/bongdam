// 터치 진행 프로브: 조이스틱 드래그로 이동, 조사 버튼(F)으로 대화, 화면 탭으로 대사 넘김 — 진행 막힘만 검사 (TOUCH=1, 가로)
module.exports = async (h) => {
  const { say } = h;
  await h.wait(2500);
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) { await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) { } }); await h.wait(600); if (await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break; }
  await h.wait(2500);
  const tap = async (x, y) => { await h.page.touchscreen.tap(x, y); };
  /* (v370) 장소 카드(«새 장소 발견»)가 떠 있으면 실제 사용자처럼 «확인»을 탭해 닫는다 */
  const tapCard = async () => { const c = await h.page.evaluate(() => { const b = document.getElementById('bd-place-card-ok'); if (!b) return null; const r = b.getBoundingClientRect(); return r.height > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; }); if (c) { await tap(c[0], c[1]); await h.wait(400); return true; } return false; };
  const tapDlg = async (n) => { for (let i = 0; i < n; i++) { if (await tapCard()) continue; const d = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); }); if (!d) return; await tap(640, 200); await h.wait(500); } };
  await tapDlg(12);
  const st0 = await h.page.evaluate(() => ({ tc: (() => { const e = document.getElementById('touch-controls'); return e ? getComputedStyle(e).display : 'none'; })(), joy: (() => { const e = document.getElementById('tc-joy-base'); const r = e && e.getBoundingClientRect(); return r ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] : null; })(), f: (() => { const e = document.getElementById('tc-btn-f'); const r = e && e.getBoundingClientRect(); return r ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), getComputedStyle(e).display] : null; })(), hero: [heroX, heroY] }));
  say('터치 컨트롤: ' + JSON.stringify(st0));
  if (!st0.joy) { say('❌ 조이스틱 없음'); return; }
  // 조이스틱 드래그: 왼쪽으로 1.2초 (CDP touch 이벤트 시퀀스)
  const drag = async (dx, dy, ms) => {
    const [cx, cy] = st0.joy;
    const cdp = await h.page.context().newCDPSession(h.page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + dx, y: cy + dy, id: 1 }] });
    await h.wait(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  };
  const p0 = await h.page.evaluate(() => [heroX, heroY]);
  await drag(-45, 0, 1200);
  const p1 = await h.page.evaluate(() => [heroX, heroY]);
  const moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  say((moved > 0.01 ? '✅' : '❌') + ' 조이스틱 이동 dx=' + (p1[0] - p0[0]).toFixed(3));
  // 선생님(0.575,0.235) 발치로 이동: 조이스틱으로 대략 접근 (왼쪽·아래)
  for (let i = 0; i < 6; i++) {
    const p = await h.page.evaluate(() => [heroX, heroY]);
    const dx = 0.585 - p[0], dy = 0.36 - p[1];
    if (Math.hypot(dx, dy) < 0.035) break;
    await drag(Math.sign(dx) * 45 * (Math.abs(dx) > 0.01 ? 1 : 0), Math.sign(dy) * 45 * (Math.abs(dy) > 0.01 ? 1 : 0), 700);
  }
  const p2 = await h.page.evaluate(() => [heroX, heroY]);
  say('선생님 근처: ' + JSON.stringify(p2.map(v => +v.toFixed(3))));
  await h.shot('tp_near_teacher');
  // 조사 버튼 탭 → 대화 열림?
  const fb = await h.page.evaluate(() => { const e = document.getElementById('tc-btn-f'); const r = e && e.getBoundingClientRect(); return r && r.height > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; });
  if (!fb) { say('❌ 조사 버튼 없음/숨김'); await h.shot('tp_nofbtn'); return; }
  let dlg = null;
  for (let r = 0; r < 4; r++) {
    await tapDlg(12); await h.wait(700);   // 떠 있는 독백을 먼저 소진 (안 그러면 F 가 «다음 대사»로 소비된다)
    await tap(fb[0], fb[1]); await h.wait(500); await tap(fb[0], fb[1]); await h.wait(900);
    dlg = await h.page.evaluate(() => { const x = document.getElementById('dialogue-box'); return { open: !!(x && x.getBoundingClientRect().height > 0), spk: (document.getElementById('dialogue-name') || {}).textContent, txt: ((document.getElementById('dialogue-text') || {}).textContent || '').slice(0, 40) }; });
    if (dlg.open && /선생님/.test(dlg.spk || '')) break;
    // 선생님 쪽으로 조금 더 접근
    const p = await h.page.evaluate(() => [heroX, heroY]); const dx = 0.59 - p[0], dy = 0.33 - p[1];
    await drag(Math.abs(dx) > 0.01 ? Math.sign(dx) * 45 : 0, Math.abs(dy) > 0.01 ? Math.sign(dy) * 45 : 0, 500);
  }
  say((dlg.open ? '✅' : '❌') + ' 조사 버튼 → 대화: ' + JSON.stringify(dlg));
  await h.shot('tp_dialog');
  // 화면 탭으로 대사 넘김
  await tapDlg(20);
  const after = await h.page.evaluate(() => ({ step: window.__bdTut2Step, badge: !!(BD_PROGRESS.story.tutorialFlags && BD_PROGRESS.story.tutorialFlags.badgeGiven), dlg: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
  say('대사 넘김 후: ' + JSON.stringify(after));
  // 수여식(Space=탭) 처리 후 step 2 대기
  for (let i = 0; i < 40; i++) {
    const s = await h.page.evaluate(() => ({ step: window.__bdTut2Step, cer: !!(document.getElementById('bd-badge-ov') && document.getElementById('bd-badge-ov').style.display === 'flex'), dlg: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })() }));
    if (s.step >= 2) break;
    if (s.cer || s.dlg) { await tap(640, 200); }
    await h.wait(600);
  }
  say('step=' + await h.page.evaluate(() => window.__bdTut2Step));
  // 가방 버튼 E 열고 닫기
  const eb = await h.page.evaluate(() => { const e = document.getElementById('tc-btn-e'); const r = e && e.getBoundingClientRect(); return r && r.height > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; });
  if (eb) {
    await tap(eb[0], eb[1]); await h.wait(1000); await h.shot('tp_bag');
    // 인벤 열림 중엔 터치 컨트롤이 숨겨진다(정상) → 실제 사용자처럼 ✕ 버튼으로 닫기
    const xb = await h.page.evaluate(() => { const c = [...document.querySelectorAll('button,div,span')].filter(e => /^✕$/.test((e.textContent || '').trim()) && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== 'none'); const e = c[c.length - 1]; if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    say('✕ 후보: ' + JSON.stringify(await h.page.evaluate(() => [...document.querySelectorAll('button,div,span')].filter(e => /^✕$/.test((e.textContent || '').trim()) && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== 'none').map(e => { const r = e.getBoundingClientRect(); return e.tagName + '#' + e.id + '.' + e.className + ' ' + Math.round(r.x) + ',' + Math.round(r.y) + ' top=' + (() => { const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t ? t.tagName + '#' + t.id + '.' + t.className : null; })(); }))));
    await tapCard();
    if (xb) await tap(xb[0], xb[1]); else await h.page.keyboard.press('Escape');
    await h.wait(900);
    say('가방 닫힘? ' + JSON.stringify(await h.page.evaluate(() => ({ inv: !!(document.getElementById('inv-overlay') && document.getElementById('inv-overlay').classList.contains('open')), intro: !!window.__bdDamiIntroBusy, blocked: !!(window.BD_isInputBlocked && BD_isInputBlocked()) }))));
    await tapDlg(10);
  }
  say('가방 후 step=' + await h.page.evaluate(() => window.__bdTut2Step));
  // 엘리베이터(0.700,0.185)로 조이스틱 이동 → 조사 버튼
  for (let i = 0; i < 30; i++) {
    const sid = await h.page.evaluate(() => Number(currentStage)); if (sid === 212) break;
    if (i === 14) say('  (14회 후 위치 ' + JSON.stringify(await h.page.evaluate(() => [heroX.toFixed(3), heroY.toFixed(3), Number(currentStage), !!(document.getElementById('bd-place-card')), (document.querySelector('.bd-modal.show') || {}).id || null])) + ')');
    const p = await h.page.evaluate(() => [heroX, heroY]);
    /* (v370) 엘리베이터 좌측 벽(rx 0.663~0.675, ry ~0.02~0.21)을 피해 아래(0.700,0.25)로 먼저 간 뒤 위로 올라간다 */
    const wp = (p[0] < 0.69 && p[1] < 0.24) ? [0.700, 0.255] : [0.700, 0.185];
    const dx = wp[0] - p[0], dy = wp[1] - p[1];
    if (wp[1] > 0.2 && Math.hypot(dx, dy) < 0.02) { continue; }
    if (wp[1] < 0.2 && Math.hypot(dx, dy) < 0.03) { const fb2 = await h.page.evaluate(() => { const e = document.getElementById('tc-btn-f'); const r = e && e.getBoundingClientRect(); return r && r.height > 0 ? [r.left + r.width / 2, r.top + r.height / 2] : null; }); if (fb2) { await tap(fb2[0], fb2[1]); await h.wait(1500); } await tapDlg(6); continue; }
    await drag(Math.abs(dx) > 0.012 ? Math.sign(dx) * 45 : 0, Math.abs(dy) > 0.012 ? Math.sign(dy) * 45 : 0, 600);
    await tapDlg(3);
  }
  await h.wait(1500);
  const sidNow = await h.page.evaluate(() => Number(currentStage));
  say((sidNow === 212 ? '✅' : '❌') + ' 월드 진출 stage=' + sidNow);
  await h.shot('tp_world');
  say('콘솔 오류: ' + h.consoleErrors.filter(e => !/Permissions check/.test(e)).length);
  say('오류 종류: ' + JSON.stringify([...new Set(h.consoleErrors.map(e => String(e).slice(0, 140)))].slice(0, 6)));
};
