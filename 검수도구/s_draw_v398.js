/* (v398) 드로우콜 계측 — «면적은 같은데 왜 태블릿이 느린가»를 가른다.
 *
 * 배경: 픽셀 예산 0.85Mpx 적용 후
 *   폰    852x340  DPR3 → 60.0fps  jank 0
 *   태블릿 1280x800 DPR2 → 52.0fps  jank 34
 * 백버퍼 «면적»이 같으니 채우기 비용은 같다. 남는 후보는 «그리는 횟수»다.
 * zoom 이 다르면 화면에 들어오는 논리 영역이 달라져 그려야 할 오브젝트 수가 변한다.
 *
 * 주의: 「시작하기」는 purge 후 location.reload() 를 부른다. 계측 훅을 진입 «전»에
 *   설치하면 리로드로 전부 날아간다. 반드시 필드 진입 «후»에 설치한다.
 *
 * 사용: VW=1280 VH=800 DPR=2 TOUCH=1 node drive.js s_draw_v398.js --url=...
 */
'use strict';

module.exports = async (h) => {
  /* ── 게임 진입 ── */
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
  let stage = null;
  for (let i = 0; i < 30; i++) {
    await h.wait(1000);
    stage = await h.page.evaluate(() => { try { return typeof currentStage !== 'undefined' ? currentStage : null; } catch (e) { return null; } });
    if (stage && stage !== 1) break;
  }
  h.say('▶ 스테이지 ' + stage);

  /* ── 계측 훅 설치 (진입 후) ── */
  await h.page.evaluate(() => {
    if (window.__BD_DRAW) return;
    const C = CanvasRenderingContext2D.prototype;
    const cnt = { drawImage: 0, fillText: 0, strokeText: 0, fillRect: 0, save: 0 };
    const per = [];
    for (const k of ['drawImage', 'fillText', 'strokeText', 'fillRect', 'save']) {
      const o = C[k];
      C[k] = function () { cnt[k]++; return o.apply(this, arguments); };
    }
    let last = Object.assign({}, cnt);
    function tick() {
      per.push({
        d: cnt.drawImage - last.drawImage,
        t: (cnt.fillText - last.fillText) + (cnt.strokeText - last.strokeText),
        r: cnt.fillRect - last.fillRect,
        s: cnt.save - last.save
      });
      if (per.length > 900) per.shift();
      last = Object.assign({}, cnt);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    window.__BD_DRAW = {
      reset() { per.length = 0; },
      stats() {
        const g = per.slice(2);
        if (!g.length) return null;
        const avg = k => +(g.reduce((a, x) => a + x[k], 0) / g.length).toFixed(1);
        const mx = k => Math.max.apply(null, g.map(x => x[k]));
        return { frames: g.length, drawImage: avg('d'), drawImage_max: mx('d'),
                 text: avg('t'), fillRect: avg('r'), save: avg('s') };
      }
    };
  });

  await h.wait(1500);
  await h.page.evaluate(() => window.__BD_DRAW.reset());
  await h.wait(5000);
  const s = await h.page.evaluate(() => window.__BD_DRAW.stats());

  const env = await h.page.evaluate(() => {
    const c = document.getElementById('game-canvas');
    return {
      viewport: innerWidth + 'x' + innerHeight,
      zoom: parseFloat(getComputedStyle(document.body).zoom) || 1,
      논리: c ? (c.offsetWidth + 'x' + c.offsetHeight) : '-',
      백버퍼: c ? (c.width + 'x' + c.height) : '-',
      Mpx: c ? +((c.width * c.height) / 1e6).toFixed(2) : 0
    };
  });

  h.say('▶ ' + JSON.stringify(env));
  h.say('▶ 프레임당 호출: drawImage 평균 ' + (s && s.drawImage) + ' / 최대 ' + (s && s.drawImage_max)
    + ' · 텍스트 ' + (s && s.text) + ' · fillRect ' + (s && s.fillRect) + ' · save ' + (s && s.save)
    + '  (' + (s && s.frames) + '프레임)');
  h.say('콘솔에러 ' + h.consoleErrors.length);
};
