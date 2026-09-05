/* (v398) 좁은 가로 화면 HUD 가독성 점검 — 아이폰 가로(주소창 포함) 조건 재현.
 *
 * 브라우저 에뮬레이션은 폭 768 미만에서만 터치로 잡히지만, 실기기는 «폭 874 + 터치»다.
 * drive.js 는 VW/VH 와 TOUCH 를 따로 줄 수 있어 이 조합을 그대로 만들 수 있다.
 *
 * 사용: VW=874 VH=300 DPR=3 TOUCH=1 node drive.js s_hud_v398.js --url=...
 */
'use strict';

module.exports = async (h) => {
  /* 진입 */
  await h.page.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 30; i++) {
    await h.wait(700);
    const ok = await h.page.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2);
    if (ok) break;
  }
  await h.page.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await h.wait(1200);
  await h.page.evaluate(() => {
    const go = [...document.querySelectorAll('button, .modal-btn')]
      .filter(b => b.getBoundingClientRect().width > 2)
      .find(b => /모험|시작|확인/.test(b.textContent || ''));
    if (go) go.click();
  });
  for (let i = 0; i < 30; i++) {
    await h.wait(1000);
    const st = await h.page.evaluate(() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } });
    if (st && st !== 1) break;
  }
  await h.wait(3000);
  await h.shot('hud_iphone');

  const r = await h.page.evaluate(() => {
    const zoom = (() => { try { return parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) { return 1; } })();

    /* 요소의 «화면상 실제 글자 크기» = fontSize x 조상 zoom/scale 누적 */
    function shownFont(el) {
      const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
      let k = 1;
      for (let p = el; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        const z = parseFloat(s.zoom); if (z && z !== 1) k *= z;
        const m = (s.transform || '').match(/^matrix\(([-\d.]+)/);
        if (m && parseFloat(m[1]) && parseFloat(m[1]) !== 1) k *= parseFloat(m[1]);
      }
      return +(fs * k).toFixed(1);
    }
    function info(sel) {
      const el = document.querySelector(sel);
      if (!el) return { sel, 상태: '없음' };
      const cs = getComputedStyle(el), q = el.getBoundingClientRect();
      if (cs.display === 'none') return { sel, 상태: '숨김' };
      return {
        sel,
        표시크기: Math.round(q.width) + 'x' + Math.round(q.height),
        화면상_글자: shownFont(el) + 'px',
        선언_글자: cs.fontSize,
        넘침_좌: Math.round(Math.max(0, -q.left)),
        넘침_우: Math.round(Math.max(0, q.right - innerWidth)),
        인라인: (el.getAttribute('style') || '').slice(0, 40),
        nowrap: cs.whiteSpace === 'nowrap'
      };
    }
    /* 화면에 실제로 보이는 «고정 HUD 텍스트»를 전수 조사해 작은 순으로 나열한다 */
    const small = [];
    document.querySelectorAll('div,span,p,button,b').forEach(el => {
      const cs = getComputedStyle(el), q = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) return;
      if (q.width < 8 || q.height < 6) return;
      if (q.top > innerHeight || q.bottom < 0 || q.left > innerWidth || q.right < 0) return;
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length > 60) return;
      if (el.children.length > 2) return;                 /* 잎 노드 위주 */
      const px = shownFont(el);
      if (px && px < 12) small.push({
        px, 글: txt.slice(0, 22),
        sel: (el.id ? '#' + el.id : '.' + (el.className || '').toString().trim().split(/\s+/)[0]).slice(0, 26),
        pos: cs.position
      });
    });
    small.sort((a, b) => a.px - b.px);

    /* 확대 보정이 새로운 잘림을 만들지 않았는지 */
    const over = [];
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el), q = el.getBoundingClientRect();
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return;
      if (q.width < 6 || q.height < 6 || q.top >= innerHeight || q.bottom <= 0) return;
      const cl = Math.round(Math.max(0, -q.left)), cr = Math.round(Math.max(0, q.right - innerWidth));
      const cb = Math.round(Math.max(0, q.bottom - innerHeight));
      if (cl > 2 || cr > 2 || cb > 2) over.push({
        sel: (el.id ? '#' + el.id : '.' + (el.className || '').toString().trim().split(/\s+/)[0]).slice(0, 26),
        좌: cl, 우: cr, 아래: cb, 글: (el.textContent || '').trim().slice(0, 20)
      });
    });

    return {
      viewport: innerWidth + 'x' + innerHeight,
      zoom, touch: navigator.maxTouchPoints,
      keybar: info('#bd-keybar'),
      '12px_미만_텍스트수': small.length,
      '가장_작은_것들': small.slice(0, 8),
      '화면밖_요소수': over.length,
      '화면밖_목록': over.slice(0, 6)
    };
  });

  h.say('▶ ' + JSON.stringify(r, null, 1));
  h.say('콘솔에러 ' + h.consoleErrors.length);
};
