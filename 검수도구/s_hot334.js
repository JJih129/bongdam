// 212 상단 핫 밴드 — 프레임당 드로우 부하 정량화
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
  });
  for (const pt of [[0.31, 0.15], [0.7, 0.15], [0.5, 0.52]]) {
    await h.page.evaluate((p) => { if (Number(currentStage) !== 212) fadeToStage(212, p[0], p[1]); else { heroX = p[0]; heroY = p[1]; camX = heroX; camY = heroY; } }, pt);
    await h.wait(1600);
    await h.page.keyboard.press(' '); await h.wait(250);
    const info = await h.page.evaluate(() => {
      const cv = document.getElementById('game-canvas');
      const out = { pt: [heroX.toFixed(2), heroY.toFixed(2)], canvas: cv ? [cv.width, cv.height] : null, inView: 0, drawnMP: 0, srcMP: 0, big: [] };
      try {
        const st = STAGES[212];
        (st.objects || []).forEach(o => {
          if (!o || o.hidden) return;
          const r = BD_screenRectOfWorld(o.rx || 0, o.ry || 0, Math.max(o.rw || 0, 0.005), Math.max(o.rh || 0, 0.005));
          if (!r) return;
          // 뷰포트 교차만
          if (r.left > innerWidth || r.top > innerHeight || r.left + r.width < 0 || r.top + r.height < 0) return;
          out.inView++;
          const mp = (r.width * r.height) / 1e6;
          out.drawnMP += mp;
          // 원본 픽셀 (에셋 이미지)
          let sw = 0, sh = 0;
          try {
            const id = String(o.key || '').startsWith('asset:') ? String(o.key).slice(6) : null;
            if (id && window.BD_ASSETS && BD_ASSETS.get) { const a = BD_ASSETS.get(id); if (a && a.img) { sw = a.img.naturalWidth; sh = a.img.naturalHeight; } }
            if (!sw && id && window.__BD_BAKED_ASSETS && __BD_BAKED_ASSETS[id]) { sw = -1; }
          } catch (e) { }
          const smp = sw > 0 ? (sw * sh) / 1e6 : 0;
          out.srcMP += smp;
          if (mp > 0.15 || smp > 1) out.big.push({ l: (o.label || '').slice(0, 12), scr: Math.round(r.width) + 'x' + Math.round(r.height), src: sw > 0 ? sw + 'x' + sh : '?', smp: +smp.toFixed(1) });
        });
        out.big.sort((a, b) => b.smp - a.smp);
        out.big = out.big.slice(0, 10);
        out.drawnMP = +out.drawnMP.toFixed(1);
        out.srcMP = +out.srcMP.toFixed(1);
      } catch (e) { out.err = String(e).slice(0, 80); }
      return out;
    });
    const fps = await h.page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function tick() { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(tick); else res(n); })(); }));
    say(`(${info.pt}) FPS=${fps} 뷰포트내 오브젝트=${info.inView} · 화면 드로우 ${info.drawnMP}MP/프레임 · 원본 리샘플 소스 ${info.srcMP}MP`);
    info.big.forEach(b => say('   · ' + JSON.stringify(b)));
  }
  await h.shot('hot334');
};
