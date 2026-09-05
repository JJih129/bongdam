// 에디터: 위험요소 자유 리사이즈 + 건물 콜라이더 이동/리사이즈 실동작 검증
module.exports = async (h) => {
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const { say } = h;
  await h.click('#bd-title-start');
  for (let i = 0; i < 80; i++) { const v = await h.page.evaluate(() => { const c = document.getElementById('bd-char-1'); return !!(c && getComputedStyle(c).display !== 'none' && c.offsetWidth > 40); }); if (v) break; await h.wait(200); }
  await h.page.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) { } });
  await h.wait(3000); await A.advance();
  await h.page.evaluate(() => { localStorage.setItem('bd_tut2_done', '1'); if (typeof fadeToStage === 'function') fadeToStage(212); });
  await h.wait(4500); await A.advance();

  say('▶ 에디터 열기');
  await h.page.click('#bge-toggle');
  await h.wait(1500);
  const edOn = await h.page.evaluate(() => !!(window.BongdamEditor && BongdamEditor.state && BongdamEditor.state.enabled));
  say('에디터 enabled=' + edOn);
  if (!edOn) return;
  await h.shot('ed_00_open');

  // 핸들 위치를 찾는 헬퍼 (hitHandle 스캔)
  const findHandle = async (want) => await h.page.evaluate((want) => {
    // 선택된 파트의 사각형 모서리를 화면 좌표로 «정확히» 계산한다
    const s = BongdamEditor.state;
    const o = STAGES[currentStage].objects[s.selectedIndex];
    const col = s.selectedPart === 'collider' && o.cx !== undefined;
    const R = col ? { x: +o.cx, y: +o.cy, w: +o.cw, h: +o.ch } : { x: +o.rx, y: +o.ry, w: +(o.rw || 0.05), h: +(o.rh || 0.05) };
    const P = {
      nw: [R.x, R.y], n: [R.x + R.w / 2, R.y], ne: [R.x + R.w, R.y],
      e: [R.x + R.w, R.y + R.h / 2], se: [R.x + R.w, R.y + R.h],
      s: [R.x + R.w / 2, R.y + R.h], sw: [R.x, R.y + R.h], w: [R.x, R.y + R.h / 2],
    }[want];
    const c = document.getElementById('game-canvas'); const rc = c.getBoundingClientRect();
    const fixed = window.BD_getEditorViewportV26 && BD_getEditorViewportV26();
    const vw = fixed ? fixed.w : 1 / s.editorZoom, vh = fixed ? fixed.h : 1 / s.editorZoom;
    const bx = ((P[0] - s.editorCamX) / vw + 0.5) * BASE_W;
    const by = ((P[1] - s.editorCamY) / vh + 0.5) * BASE_H;
    const px = (bx - BASE_W / 2) * currentScale + c.width / 2;
    const py = (by - BASE_H / 2) * currentScale + c.height / 2;
    const x = rc.left + px / (c.width / rc.width), y = rc.top + py / (c.height / rc.height);
    const hh = window.__bgeV34HandleAt ? window.__bgeV34HandleAt(x, y) : '?';
    return (hh === want) ? { x, y } : { x, y, warn: 'hitHandle=' + hh };
  }, want);

  const objInfo = async (i) => await h.page.evaluate((i) => {
    const o = STAGES[currentStage].objects[i];
    return { l: o.label, rx: +o.rx.toFixed(4), ry: +o.ry.toFixed(4), rw: +(o.rw || 0).toFixed(4), rh: +(o.rh || 0).toFixed(4), cx: o.cx != null ? +o.cx.toFixed(4) : null, cy: o.cy != null ? +o.cy.toFixed(4) : null, cw: o.cw != null ? +o.cw.toFixed(4) : null, ch: o.ch != null ? +o.ch.toFixed(4) : null };
  }, i);

  // ═══ ① 건물 콜라이더: 리사이즈 ═══
  say('═══ ① 건물(단지 1) 콜라이더 리사이즈 ═══');
  await h.page.evaluate(() => {
    const s = BongdamEditor.state;
    s.selectedIndex = 3; s.selectedPart = 'collider'; s.tool = 'select';
    // 대상이 화면에 보이게 카메라 이동
    const o = STAGES[currentStage].objects[3];
    s.editorViewMode = 'custom'; s.editorZoom = 2;
    s.editorCamX = o.rx + (o.rw || 0) / 2; s.editorCamY = o.ry + (o.rh || 0) / 2;
    BongdamEditor.refresh && BongdamEditor.refresh();
  });
  await h.wait(900);
  let before = await objInfo(3);
  say('  before: ' + JSON.stringify(before));
  let hp = await findHandle('se');
  say('  se 핸들: ' + JSON.stringify(hp));
  if (hp) {
    await h.page.mouse.move(hp.x, hp.y); await h.wait(150);
    await h.page.mouse.down(); await h.wait(150);
    await h.page.mouse.move(hp.x + 40, hp.y + 25, { steps: 8 }); await h.wait(200);
    await h.page.mouse.up(); await h.wait(2500);   // 앵커 동기화 900ms×2 를 지나도 유지되는지
    const after = await objInfo(3);
    say('  after:  ' + JSON.stringify(after));
    const dW = Math.abs(after.cw - before.cw) > 0.001, dH = Math.abs(after.ch - before.ch) > 0.001;
    const bodySame = Math.abs(after.rw - before.rw) < 0.0005;
    say(`  ${dW && dH && bodySame ? '✅' : '❌'} 콜라이더 리사이즈 (cw변화=${dW} ch변화=${dH} 본체불변=${bodySame})`);
  } else say('  ❌ 핸들을 찾지 못함');
  await h.shot('ed_01_col_resize');

  // ═══ ② 건물 콜라이더: 이동 (내부 드래그) ═══
  say('═══ ② 건물 콜라이더 이동 ═══');
  await h.page.evaluate(() => { const s = BongdamEditor.state; s.selectedIndex = 3; s.selectedPart = 'collider'; });
  await h.wait(300);
  before = await objInfo(3);
  const center = await h.page.evaluate(() => {
    const o = STAGES[currentStage].objects[3];
    const c = document.getElementById('game-canvas'); const r = c.getBoundingClientRect();
    // mapToCanvas는 내부 함수라 직접 계산 (v34와 동일 공식)
    const fixed = window.BD_getEditorViewportV26 && BD_getEditorViewportV26();
    const s = BongdamEditor.state;
    const vw = fixed ? fixed.w : 1 / s.editorZoom, vh = fixed ? fixed.h : 1 / s.editorZoom;
    const bx = ((o.cx + o.cw / 2 - s.editorCamX) / vw + 0.5) * BASE_W;
    const by = ((o.cy + o.ch / 2 - s.editorCamY) / vh + 0.5) * BASE_H;
    const px = (bx - BASE_W / 2) * currentScale + c.width / 2;
    const py = (by - BASE_H / 2) * currentScale + c.height / 2;
    return { x: r.left + px / (c.width / r.width), y: r.top + py / (c.height / r.height) };
  });
  say('  콜라이더 중심 화면좌표: ' + JSON.stringify({ x: Math.round(center.x), y: Math.round(center.y) }));
  await h.page.mouse.move(center.x, center.y); await h.wait(150);
  await h.page.mouse.down(); await h.wait(150);
  await h.page.mouse.move(center.x + 50, center.y + 30, { steps: 8 }); await h.wait(200);
  await h.page.mouse.up(); await h.wait(2500);
  let after = await objInfo(3);
  say('  after:  ' + JSON.stringify(after));
  const colMoved = Math.abs(after.cx - before.cx) > 0.001 || Math.abs(after.cy - before.cy) > 0.001;
  const bodyStill = Math.abs(after.rx - before.rx) < 0.0005;
  say(`  ${colMoved ? '✅' : '❌'} 콜라이더 이동 (이동=${colMoved} 본체불변=${bodyStill})`);
  await h.shot('ed_02_col_move');

  // ═══ ③ 위험요소 자유 리사이즈 (비율 자유) ═══
  say('═══ ③ 위험요소(쓰레기 더미) 리사이즈 ═══');
  const hzIdx = await h.page.evaluate(() => STAGES[currentStage].objects.findIndex(o => o && o.hazardId === 'ow212_trash_1'));
  await h.page.evaluate((i) => {
    const s = BongdamEditor.state;
    s.selectedIndex = i; s.selectedPart = 'object';
    const o = STAGES[currentStage].objects[i];
    s.editorCamX = o.rx + (o.rw || 0) / 2; s.editorCamY = o.ry + (o.rh || 0) / 2;
    BongdamEditor.refresh && BongdamEditor.refresh();
  }, hzIdx);
  await h.wait(900);
  before = await objInfo(hzIdx);
  say('  before: ' + JSON.stringify(before));
  hp = await findHandle('e');   // 동쪽 핸들 — 가로만 늘려 비율이 자유로운지
  say('  e 핸들: ' + JSON.stringify(hp));
  if (hp) {
    await h.page.mouse.move(hp.x, hp.y); await h.wait(150);
    await h.page.mouse.down(); await h.wait(150);
    await h.page.mouse.move(hp.x + 60, hp.y, { steps: 8 }); await h.wait(200);
    await h.page.mouse.up(); await h.wait(500);
    after = await objInfo(hzIdx);
    say('  after:  ' + JSON.stringify(after));
    const wGrew = after.rw - before.rw > 0.003;
    const hSame = Math.abs(after.rh - before.rh) < 0.0005;
    say(`  ${wGrew && hSame ? '✅ 비율 자유 (가로만 늘어남)' : '❌'} (rw+=${(after.rw - before.rw).toFixed(4)} rh변화=${(after.rh - before.rh).toFixed(4)})`);
  } else say('  ❌ 핸들을 찾지 못함');
  await h.shot('ed_03_hz_resize');
};
