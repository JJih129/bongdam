/* UI/UX 종합 진단 — 크기·정렬·대비·탭타겟·정보밀도를 «수치»로 뽑는다.
   BD_MODE=phone|tablet|pc */
const { chromium } = require('playwright');
const MODES = {
  phone:  { 이름: '폰 874x300',    w: 874,  h: 300, dpr: 3, touch: true },
  tablet: { 이름: '태블릿 1280x800', w: 1280, h: 800, dpr: 2, touch: true },
  pc:     { 이름: 'PC 1440x900',   w: 1440, h: 900, dpr: 1, touch: false }
};
const M = MODES[process.env.BD_MODE || 'phone'] || MODES.phone;
const OPEN = process.env.BD_UI_OPEN || 'none';
(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: M.w, height: M.h }, deviceScaleFactor: M.dpr, hasTouch: M.touch, isMobile: M.touch });
  const p = await ctx.newPage();
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1') && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.evaluate(() => { const q = document.getElementById('char-card-1'); if (q) q.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')].filter(x => x.getBoundingClientRect().width > 2).find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(3500);
  if (OPEN === 'bag') await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  if (OPEN === 'map') await p.evaluate(() => { try { BD_openSafetyMap(); } catch (e) {} });
  await p.waitForTimeout(1600);

  const r = await p.evaluate(touch => {
    const VW = innerWidth, VH = innerHeight;
    const sc = el => { let k = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
      const v = parseFloat(getComputedStyle(a).zoom); if (v > 0 && v !== 1) k *= v; } return k; };
    const on = el => { const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.15) return false;
      const q = el.getBoundingClientRect();
      return q.width > 4 && q.height > 4 && q.right > 0 && q.left < VW && q.bottom > 0 && q.top < VH; };

    /* 1. 탭 타겟 — 터치에서 44px 미만 */
    const small = [];
    document.querySelectorAll('button,[role=button],a,.inv-tab,.modal-btn,.bd-card').forEach(e => {
      if (!on(e)) return;
      const q = e.getBoundingClientRect();
      const m = Math.min(q.width, q.height);
      if (m < 44) small.push({ id: e.id || '.' + String(e.className).split(' ')[0],
        글: (e.textContent || '').trim().slice(0, 10), 크기: Math.round(q.width) + 'x' + Math.round(q.height) });
    });

    /* 2. 대비 — 배경 대비 글자색이 충분한가 (WCAG 근사) */
    const lum = c => { const m = String(c).match(/[\d.]+/g); if (!m) return null;
      const f = m.slice(0,3).map(v => { v = v/255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
      return .2126*f[0] + .7152*f[1] + .0722*f[2]; };
    const bgOf = el => { for (let a = el; a; a = a.parentElement) {
      const c = getComputedStyle(a).backgroundColor;
      if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return 'rgb(15,21,38)'; };
    const lowContrast = [];
    document.querySelectorAll('*').forEach(e => {
      if (e.children.length) return; const t = (e.textContent||'').trim(); if (!t) return;
      if (!on(e)) return;
      const fg = lum(getComputedStyle(e).color), bg = lum(bgOf(e));
      if (fg == null || bg == null) return;
      const ratio = (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
      if (ratio < 3.0) lowContrast.push(t.slice(0,12) + '(' + ratio.toFixed(1) + ':1)');
    });

    /* 3. 정보 밀도 — 화면에 보이는 글자 수 */
    let chars = 0, nodes = 0;
    document.querySelectorAll('*').forEach(e => { if (e.children.length) return;
      const t = (e.textContent||'').trim(); if (!t || !on(e)) return; chars += t.length; nodes++; });

    /* 4. 가장자리 여백 — 화면 끝에 붙은 UI (노치·모서리 위험) */
    const edge = [];
    document.querySelectorAll('button,[role=button],div').forEach(e => {
      if (!on(e)) return; const s = getComputedStyle(e);
      if (s.position !== 'fixed' && s.position !== 'absolute') return;
      const q = e.getBoundingClientRect();
      if (q.width > VW*0.9 || q.height > VH*0.9) return;
      const gap = Math.min(q.left, q.top, VW - q.right, VH - q.bottom);
      if (gap < 8) edge.push((e.id || '.' + String(e.className).split(' ')[0]) + ' ' + Math.round(gap) + 'px');
    });

    return { 뷰포트: VW + 'x' + VH,
      탭타겟44미만: { 수: small.length, 예: small.slice(0, 8) },
      저대비: { 수: lowContrast.length, 예: [...new Set(lowContrast)].slice(0, 8) },
      정보밀도: { 글자수: chars, 요소수: nodes, '글자/1000px²': +(chars/(VW*VH/1000)).toFixed(2) },
      가장자리밀착: [...new Set(edge)].slice(0, 8) };
  }, M.touch);
  console.log('■ ' + M.이름 + ' / ' + OPEN);
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
