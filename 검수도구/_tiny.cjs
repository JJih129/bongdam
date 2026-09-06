/* 화면에 보이는 «너무 작은 글씨» 전수 조사 — 화면 기준 px(zoom 반영)으로 잰다. */
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

  /* 지역 HUD·미니맵은 «마을» 스테이지에만 나온다. 실내(101)에서는 안 보이므로 이동한다. */
  const stage = Number(process.env.BD_STAGE || 3);
  await p.evaluate(s => { try { fadeToStage(s, 0.5, 0.5); } catch (e) {} }, stage);
  await p.waitForTimeout(4000);
  console.log('현재 스테이지: ' + await p.evaluate(() => { try { return currentStage; } catch (e) { return '?'; } }));

  /* 모달 안의 글씨도 검사해야 한다 — 처음엔 열지 않고 재서 «0개»가 나왔는데,
     인벤토리를 열자 8.5px 짜리가 남아 있었다. 안 연 화면은 검사한 게 아니다. */
  const open = process.env.BD_UI_OPEN || 'bag';
  if (open === 'bag') await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  if (open === 'map') await p.evaluate(() => { try { BD_openSafetyMap(); } catch (e) {} });
  await p.waitForTimeout(1800);
  console.log('연 화면: ' + open);

  const r = await p.evaluate(() => {
    const MIN = 11;                       /* 화면 기준 이 아래면 읽기 어렵다 */
    const out = [];
    const seenBox = new Set();
    document.querySelectorAll('*').forEach(e => {
      if (e.children.length) return;                       /* 잎 노드만 */
      const t = (e.textContent || '').trim();
      if (!t) return;
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden') return;
      const q = e.getBoundingClientRect();
      if (q.width < 2 || q.height < 2) return;
      if (q.bottom < 0 || q.top > innerHeight || q.right < 0 || q.left > innerWidth) return;
      /* 선언 fontSize 는 zoom 을 모른다 — 실제 배율을 곱해 «화면에 보이는 크기»로 만든다 */
      const scale = e.offsetHeight ? (q.height / e.offsetHeight) : 1;
      const px = parseFloat(s.fontSize) * (scale || 1);
      if (!(px > 0) || px >= MIN) return;
      /* 조상 중 가장 가까운 id 를 소속으로 적는다 */
      let owner = '';
      for (let a = e; a; a = a.parentElement) { if (a.id) { owner = '#' + a.id; break; } }
      out.push({ 소속: owner || '?', 글: t.slice(0, 16), 크기: +px.toFixed(1) });
      seenBox.add(owner);
    });
    const byOwner = {};
    out.forEach(x => { (byOwner[x.소속] = byOwner[x.소속] || []).push(x.크기); });
    const 요약 = Object.keys(byOwner).map(k => ({ 소속: k, 개수: byOwner[k].length,
      최소: Math.min.apply(null, byOwner[k]), 최대: Math.max.apply(null, byOwner[k]) }))
      .sort((a, b) => b.개수 - a.개수);
    return { 총개수: out.length, 요약, 예시: out.slice(0, 10) };
  });
  console.log('11px 미만으로 보이는 글자: ' + r.총개수 + '개');
  r.요약.forEach(x => console.log('   ' + String(x.소속).padEnd(26) + ' ' + String(x.개수).padStart(3) + '개  ' + x.최소 + '~' + x.최대 + 'px'));
  console.log('예시: ' + r.예시.map(x => x.글 + '(' + x.크기 + ')').join(' · '));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
