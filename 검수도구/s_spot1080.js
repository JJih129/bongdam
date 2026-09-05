/* 위험요소 스포트라이트(obj:) 위치 검증 — 큰 해상도에서 강조 사각형과 실제 스프라이트 위치 비교 */
module.exports = async (h) => {
  const say = h.say;
  if (process.env.UIS) { await h.page.evaluate((v) => localStorage.setItem('bd_ui_scale_v353', v), process.env.UIS); await h.page.reload(); await h.wait(2500); }
  await h.click('#bd-title-start'); await h.wait(1500);
  for (let t = 0; t < 15; t++) {
    await h.page.evaluate(() => { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} });
    await h.wait(600);
    if (await h.page.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !(m && m.classList.contains('show')); })) break;
  }
  await h.wait(2000);
  // 프롤로그 건너뛰고 212 로 — 담이 튜토(hazard 스텝)는 남긴다
  await h.page.evaluate(() => { ['bd_tut2_done'].forEach(k => localStorage.setItem(k, '1')); });
  await h.page.evaluate(() => { try { fadeToStage(212, 0.40, 0.40); } catch (e) {} });
  await h.wait(2500);
  if (process.env.UIS) await h.page.evaluate((v) => { try { BD_setUiScale(v); } catch (e) {} }, process.env.UIS);
  await h.page.evaluate(() => { try { window.BD_startDamiTutorial && BD_startDamiTutorial(); } catch (e) {} });
  for (let i = 0; i < 40; i++) {
    const st = await h.page.evaluate(() => ({ step: window.__bdTutStepId, dlg: (() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); })(), modal: !!document.querySelector('.bd-modal.show'), card: !!document.getElementById('bd-place-card') }));
    if (st.step === 'hazard' || st.step === 'investigate') break;
    if (st.card) { await h.page.evaluate(() => { const b = document.getElementById('bd-place-card-ok'); b && b.click(); }); }
    else if (st.dlg) { await h.page.keyboard.press(' '); }
    else if (st.modal) { await h.page.evaluate(() => { const b = [...document.querySelectorAll('.bd-modal.show button')].find(x => /확인|닫기/.test(x.textContent)); b && b.click(); }); }
    else await h.page.keyboard.press('d');
    await h.wait(700);
  }
  await h.wait(800);
  const info = await h.page.evaluate(() => {
    const cv = document.getElementById('game-canvas'); const b = cv.getBoundingClientRect();
    const hole = document.getElementById('bd-spot-hole'); const hr = hole ? hole.getBoundingClientRect() : null;
    const r = BD_screenRectOfObject('방치된 쓰레기');
    return { vw: innerWidth, vh: innerHeight, zoom: getComputedStyle(document.body).zoom, dpr: devicePixelRatio,
      cv: [cv.width, cv.height, b.left, b.top, b.width, b.height], cvStyle: cv.style.cssText, cvCs: (() => { const c = getComputedStyle(cv); return c.width + ' ' + c.height + ' ' + c.transform + ' ' + c.objectFit + ' pos=' + c.position + ' l=' + c.left; })(),
      step: window.__bdTutStepId, objRect: r, hole: hr && [hr.left, hr.top, hr.width, hr.height], scale: currentScale, base: [BASE_W, BASE_H], vp: [VIEWPORT_W, VIEWPORT_H] };
  });
  say(JSON.stringify(info));
  await h.shot('spot1080');
};
