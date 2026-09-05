
/* ══ (v225) 곤란 말풍선 — 위험요소 근처에서 자동 재생되는 곤란한 목소리 ══
   플레이어가 미정화 위험요소에 다가가면 말풍선이 떠서 자연스럽게 시선을 끈다.
   정화하면 사라진다. (자연 동선: "곤란한 사람을 지나치지 못한다") */
(function(){
  'use strict';
  const LINES = {
    cigarette:  '\uCF5C\uB85D\uCF5C\uB85D\u2026 \uC5F0\uAE30 \uB54C\uBB38\uC5D0 \uBABB \uC9C0\uB098\uAC00\uACA0\uC5B4',
    trash:      '\uC73C, \uB0C4\uC0C8\u2026 \uC5EC\uAE30 \uC9C0\uB098\uAC00\uAE30 \uC2EB\uB2E4\u2026',
    glass:      '\uC870\uC2EC\uD574! \uC720\uB9AC \uC870\uAC01\uC774\uC57C\u2026',
    bottle:     '\uBCD1\uC774 \uAD74\uB7EC\uB2E4\uB2C8\uB294\uB370 \uAE68\uC9C0\uBA74 \uC5B4\uB5A1\uD558\uC9C0\u2026',
    graffiti:   '\uBCBD\uC774 \uC65C \uC774\uB807\uAC8C \uB410\uC9C0\u2026 \uBCF4\uAE30 \uC548 \uC88B\uC544',
    kickboard:  '\uAE38\uC774 \uB9C9\uD614\uC5B4\u2026 \uC9C0\uB098\uAC08 \uC218\uAC00 \uC5C6\uB124',
    bicycle:    '\uC790\uC804\uAC70\uC5D0 \uAC78\uB824 \uB118\uC5B4\uC9C8 \uBFB0\uD588\uC5B4\u2026',
    noise_bat:  '\uC2DC\uB044\uB7EC\uC6CC\uC11C \uADC0\uAC00 \uC544\uD30C\u2026',
    streetlight:'\uB108\uBB34 \uC5B4\uB450\uC6CC\uC11C \uBB34\uC11C\uC6CC\u2026',
    dark_alley: '\uC774 \uAE38\uC740 \uCEB4\uCEB4\uD574\uC11C \uBABB \uAC00\uACA0\uC5B4\u2026',
    road_crack: '\uAE38\uC774 \uAC08\uB77C\uC838\uC11C \uB118\uC5B4\uC9C8 \uBFB0\uD588\uC5B4\u2026',
    sign_ghost: '\uD45C\uC9C0\uD310\uC774 \uC774\uC0C1\uD574\u2026 \uBD88\uC548\uD574',
  };
  const FAMILY_LINE = {
    smoke: '\uCF5C\uB85D\u2026 \uC228\uC26C\uAE30\uAC00 \uD798\uB4E4\uC5B4',
    pollute: '\uC5EC\uAE30 \uC9C0\uC800\uBD84\uD574\uC11C \uACE4\uB780\uD574\u2026',
    dark: '\uC5B4\uB450\uC6CC\uC11C \uBB34\uC11C\uC6CC\u2026',
  };
  function el(id){ return document.getElementById(id); }
  function toScreen(mx, my){
    try{
      const cv = el('game-canvas'); if (!cv) return null;
      const rect = cv.getBoundingClientRect();
      const px = ((((mx-camX)/VIEWPORT_W + 0.5)*BASE_W) - BASE_W/2)*currentScale + cv.width/2;
      const py = ((((my-camY)/VIEWPORT_H + 0.5)*BASE_H) - BASE_H/2)*currentScale + cv.height/2;
      return { x: rect.left + px/(cv.width/rect.width), y: rect.top + py/(cv.height/rect.height) };
    }catch(e){ return null; }
  }
  function bubble(){
    let d = el('bd-worry');
    if (!d){
      d = document.createElement('div');
      d.id = 'bd-worry';
      d.style.cssText = 'position:fixed;z-index:40;display:none;transform:translate(-50%,-100%);'   /* (v62) 말풍선이 HUD·임무창을 가리지 않게 */
        + 'background:rgba(255,255,255,.96);color:#333;border-radius:12px;padding:7px 12px;'
        + 'font-size:13px;font-weight:700;font-family:"Noto Serif KR",serif;max-width:220px;'
        + 'box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none;';
      const tail = document.createElement('div');
      tail.style.cssText = 'position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);'
        + 'width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;'
        + 'border-top:8px solid rgba(255,255,255,.96);';
      d.appendChild(tail);
      const span = document.createElement('span'); span.id = 'bd-worry-text';
      d.insertBefore(span, tail);
      document.body.appendChild(d);
    }
    return d;
  }
  function uiBusy(){
    try{
      if (window.HSR && HSR.active) return true;
      if (window.__bdGuideOpen) return true;
      if (window.BD_choiceOpen && BD_choiceOpen()) return true;
      const v = el('dialogue-box');
      if (v && v.offsetHeight > 0 && parseFloat(getComputedStyle(v).opacity) > 0.05) return true;
      if (window.__bdSceneActive) return true;
    }catch(e){}
    return false;
  }
  window.BD_addTick(function(){
    const d = bubble();
    try{
      const gs = el('game-screen');
      if (!gs || gs.style.display !== 'block' || uiBusy()){ d.style.display = 'none'; return; }
      const st = STAGES[currentStage];
      if (!st || !st.objects){ d.style.display = 'none'; return; }
      let best = null, bd2 = 1e9;
      st.objects.forEach(function(o){
        if (!o || o.interactable !== 'hazard' || !o.hazardId) return;
        if ((window.BD && BD.purified && BD.purified[o.hazardId]) || o._purified) return;
        if (window.BD_hazardLocked && BD_hazardLocked(o)) return;
        const cx = o.rx + (o.rw||0.08)/2, cy = o.ry + (o.rh||0.08)/2;
        const d2 = (cx-heroX)*(cx-heroX) + (cy-heroY)*(cy-heroY);
        if (d2 < bd2){ bd2 = d2; best = { o:o, cx:cx, cy:cy }; }
      });
      if (!best || bd2 > 0.24*0.24){ d.style.display = 'none'; return; }
      const o = best.o;
      // (v276) 위험요소가 스스로 말하지 않는다 — 근처 '주민'이 곤란해하는 목소리를 낸다.
      //  반경 안에 주민이 없으면 말풍선을 띄우지 않는다. (자연스러운 연출: 지나가던 사람의 반응)
      let spk = null, sd2 = 0.30*0.30;
      st.objects.forEach(function(o2){
        if (!o2 || !o2.resident) return;
        const rx2 = o2.rx + (o2.rw||0.05)/2, ry2 = o2.ry + (o2.rh||0.075)/2;
        const dd = (rx2-best.cx)*(rx2-best.cx) + (ry2-best.cy)*(ry2-best.cy);
        if (dd < sd2){ sd2 = dd; spk = { cx: rx2, topY: o2.ry }; }
      });
      if (!spk){ d.style.display = 'none'; return; }
      const line = LINES[o.hazardVariant] || FAMILY_LINE[o.hazardFamily] || '\uB204\uAD70\uAC00 \uACE4\uB780\uD574\uD558\uB294 \uAC83 \uAC19\uB2E4\u2026';
      const p = toScreen(spk.cx, spk.topY);
      if (!p){ d.style.display = 'none'; return; }
      el('bd-worry-text').textContent = '\uD83D\uDCAC ' + line;
      d.style.left = p.x + 'px';
      d.style.top = (p.y - 12) + 'px';
      d.style.display = 'block';
    }catch(e){ d.style.display = 'none'; }
  }, 33);   // (v27) 400→33ms — 카메라 이동 중에도 캐릭터 머리 위에 붙어 보이도록
})();
