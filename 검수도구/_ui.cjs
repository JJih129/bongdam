/* 모바일 UI 크기감 전수 측정 — 패널마다 «화면의 몇 %», 글자 몇 px, 서로 겹치는가.
   목적: «크기감이 제각각»을 눈이 아니라 수치로 잡아 통일 기준을 만든다.
   BD_UI_OPEN=bag|map|none 으로 무엇을 연 상태로 잴지 고른다. */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1') && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.evaluate(() => { const q = document.getElementById('char-card-1'); if (q) q.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2)
    .find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(3500);

  const what = process.env.BD_UI_OPEN || 'bag';
  if (what === 'bag') await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  if (what === 'map') await p.evaluate(() => { try { BD_openSafetyMap(); } catch (e) {} });
  await p.waitForTimeout(1800);

  const r = await p.evaluate(() => {
    const VW = innerWidth, VH = innerHeight;
    const vis = e => { const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.1) return false;
      const q = e.getBoundingClientRect(); return q.width > 8 && q.height > 8
        && q.right > 0 && q.left < VW && q.bottom > 0 && q.top < VH; };
    /* 화면에 보이는 «패널급» 요소 = 자기 배경이 있고 충분히 큰 것 */
    const panels = [...document.querySelectorAll('div,section,aside')].filter(e => {
      if (!vis(e)) return false;
      const q = e.getBoundingClientRect();
      if (q.width < 60 || q.height < 28) return false;
      if (q.width > VW * 0.985 && q.height > VH * 0.985) return false;   /* 전체 오버레이 제외 */
      const s = getComputedStyle(e);
      const hasBg = (s.backgroundImage && s.backgroundImage !== 'none')
        || (s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor));
      return hasBg;
    });
    /* 부모-자식이 거의 같은 크기면 자식만 남긴다(중복 제거) */
    const keep = panels.filter(e => !panels.some(o => o !== e && e.contains(o)
      && o.getBoundingClientRect().width > e.getBoundingClientRect().width * 0.9
      && o.getBoundingClientRect().height > e.getBoundingClientRect().height * 0.9));

    const scaleOf = el => { try { const z = []; for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const v = parseFloat(getComputedStyle(a).zoom); if (v > 0 && v !== 1) z.push(v); }
      return z.reduce((x, y) => x * y, 1); } catch (e) { return 1; } };

    const info = keep.map(e => {
      const q = e.getBoundingClientRect();
      /* 안쪽 글자 크기 범위 */
      let mn = Infinity, mx = 0, n = 0;
      e.querySelectorAll('*').forEach(c => { if (c.children.length) return;
        if (!(c.textContent || '').trim()) return;
        const cs = getComputedStyle(c); if (cs.display === 'none') return;
        const px = parseFloat(cs.fontSize) * scaleOf(c);
        if (px > 0) { n++; if (px < mn) mn = px; if (px > mx) mx = px; } });
      /* 세로로 쪼개진 글자 = 폭이 글자 하나 수준인데 높이가 여러 줄 */
      let split = 0;
      e.querySelectorAll('*').forEach(c => { if (c.children.length) return;
        const t = (c.textContent || '').trim(); if (t.length < 2) return;
        const cq = c.getBoundingClientRect(); if (cq.width < 4 || cq.height < 4) return;
        const fs = parseFloat(getComputedStyle(c).fontSize) * scaleOf(c);
        if (fs > 0 && cq.width < fs * 1.6 && cq.height > fs * 1.9) split++; });
      return { id: e.id || ('.' + String(e.className).split(' ')[0]).slice(0, 22),
        크기: Math.round(q.width) + 'x' + Math.round(q.height),
        '화면%': +((q.width * q.height) / (VW * VH) * 100).toFixed(1),
        위치: 'L' + Math.round(q.left) + ' T' + Math.round(q.top),
        글자: n ? (mn === Infinity ? '-' : mn.toFixed(1) + '~' + mx.toFixed(1) + 'px') : '없음',
        zoom: +scaleOf(e).toFixed(3), 세로쪼개짐: split };
    }).sort((a, b) => b['화면%'] - a['화면%']);

    /* 패널끼리 겹치는가 */
    const over = [];
    for (let i = 0; i < keep.length; i++) for (let j = i + 1; j < keep.length; j++) {
      const a = keep[i], c = keep[j];
      if (a.contains(c) || c.contains(a)) continue;
      const qa = a.getBoundingClientRect(), qc = c.getBoundingClientRect();
      const ow = Math.min(qa.right, qc.right) - Math.max(qa.left, qc.left);
      const oh = Math.min(qa.bottom, qc.bottom) - Math.max(qa.top, qc.top);
      if (ow > 8 && oh > 8) over.push((a.id || a.className).toString().slice(0, 18) + ' ↔ '
        + (c.id || c.className).toString().slice(0, 18) + '  ' + Math.round(ow) + 'x' + Math.round(oh));
    }
    return { 뷰포트: VW + 'x' + VH, 패널: info, 겹침: over };
  });

  console.log('■ ' + what + '  뷰포트 ' + r.뷰포트);
  console.log('  ' + '패널'.padEnd(24) + '크기'.padEnd(11) + '화면%'.padEnd(7) + '글자'.padEnd(15) + 'zoom  세로쪼개짐');
  r.패널.forEach(x => console.log('  ' + String(x.id).padEnd(24) + String(x.크기).padEnd(11)
    + String(x['화면%']).padEnd(7) + String(x.글자).padEnd(15) + String(x.zoom).padEnd(6)
    + (x.세로쪼개짐 ? '⚠ ' + x.세로쪼개짐 + '개' : '-')));
  console.log('■ 패널 겹침 ' + r.겹침.length + '건');
  r.겹침.forEach(x => console.log('   ⚠ ' + x));
  await p.screenshot({ path: '검수도구/_ui_' + what + '.png' });
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
