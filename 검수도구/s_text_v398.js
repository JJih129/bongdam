/* (v398) 대사·안내 텍스트 표시 검증 — 담이 말풍선과 대화창을 실제로 띄워 스크린샷·측정.
 *
 * 확인하는 것:
 *   · 긴 대사가 상자 밖으로 넘치는가
 *   · 화면상 글자 크기가 읽을 만한가
 *   · 키보드 문구가 터치 문구로 바뀌어 나오는가(0259)
 *
 * 사용: VW=874 VH=300 DPR=3 TOUCH=1 SHOTS_DIR=_text \
 *       node drive.js s_text_v398.js --url=...
 */
'use strict';

const MEASURE = `(() => {
  const zoomOf = el => { let k = 1;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p);
      const z = parseFloat(s.zoom); if (z && z !== 1) k *= z;
      const m = (s.transform || '').match(/^matrix\\(([-\\d.]+)/);
      if (m && parseFloat(m[1]) && parseFloat(m[1]) !== 1) k *= parseFloat(m[1]); }
    return k; };
  const pick = sel => { const el = document.querySelector(sel); if (!el) return null;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return null;
    return { sel, 크기: Math.round(r.width) + 'x' + Math.round(r.height),
      위치: Math.round(r.left) + ',' + Math.round(r.top),
      넘침_아래: Math.round(Math.max(0, r.bottom - innerHeight)),
      넘침_우: Math.round(Math.max(0, r.right - innerWidth)),
      넘침_좌: Math.round(Math.max(0, -r.left)),
      화면상글자: +(parseFloat(cs.fontSize) * zoomOf(el)).toFixed(1) + 'px',
      스크롤넘침: el.scrollHeight > el.clientHeight + 2,
      글: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 60) }; };
  return { 담이: pick('#bd-dami-hud'),
           대화창: pick('#dialogue-overlay, #dialogue-box, .dlg-box'),
           토스트: pick('#bd-toast, .bd-toast') };
})()`;

module.exports = async (h) => {
  /* 진입 */
  await h.page.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 25; i++) {
    await h.wait(700);
    const ok = await h.page.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2);
    if (ok) break;
  }
  await h.page.evaluate(() => { const c = document.getElementById('char-card-1'); if (c) c.click(); });
  await h.wait(900);
  await h.page.evaluate(() => {
    const g = [...document.querySelectorAll('button,.modal-btn')].filter(b => b.getBoundingClientRect().width > 2)
      .find(b => /모험\s*시작/.test(b.textContent || '')); if (g) g.click();
  });
  for (let i = 0; i < 25; i++) {
    await h.wait(900);
    const st = await h.page.evaluate(() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } });
    if (st && st !== 1) break;
  }
  await h.wait(2500);
  h.say('▶ 진입 완료');

  /* 실제 게임에 있는 «가장 긴» 대사들로 시험한다 */
  const LINES = [
    '문화의집에서 자원봉사를 성실히 한 청소년에게 주어지는 배지. 위험 속에 쌓인 \'불안의 그림자\'를 볼 수 있게 해 준다. 배지는 그림자를 정화하는 힘을 준다.',
    '🧭 새 동네 도착! 미니맵의 붉은 점이 위험요소예요. 자유롭게 돌아다니며 F 키로 조사해 보세요',
    '네 동네의 안전 조각이 모두 모였어요! 근처 🚌 버스정류장에서 와우리로 돌아가면, 마지막 정리를 시작할 수 있어요!'
  ];

  for (let i = 0; i < LINES.length; i++) {
    const shown = await h.page.evaluate(t => {
      try {
        if (window.BD_DAMI && typeof BD_DAMI.show === 'function') { BD_DAMI.show(t, { face: 'normal', channel: 'story' }); return 'BD_DAMI'; }
        if (typeof window.bdToast === 'function') { bdToast(t); return 'toast'; }
        return '표시 수단 없음';
      } catch (e) { return '오류: ' + e.message; }
    }, LINES[i]);
    await h.wait(2200);
    await h.shot('text_' + (i + 1));
    const m = await h.page.evaluate(MEASURE);
    h.say('  [' + (i + 1) + '] via ' + shown + ' → ' + JSON.stringify(m.담이 || m.토스트 || m.대화창 || '요소 못 찾음'));
    await h.wait(900);
  }

  /* 키보드 문구가 실제 화면에서 바뀌는지 */
  const conv = await h.page.evaluate(() => {
    const box = document.createElement('div');
    box.id = '__t'; box.style.cssText = 'position:fixed;left:-9999px';
    ['🧭 자유롭게 돌아다니며 F 키로 조사해 보세요', '💾 Z키로 스킬을 사용하세요!', 'J 키로 언제든 확인하고 추적할 수 있어요.']
      .forEach(t => { const p = document.createElement('p'); p.textContent = t; box.appendChild(p); });
    document.body.appendChild(box);
    if (window.BD_GUIDE) BD_GUIDE.run();
    const out = [...box.querySelectorAll('p')].map(p => p.textContent);
    box.remove();
    return { BD_GUIDE: !!window.BD_GUIDE, 결과: out };
  });
  h.say('▶ 키보드 문구 치환: ' + JSON.stringify(conv, null, 1));
  h.say('콘솔에러 ' + h.consoleErrors.length);
};
