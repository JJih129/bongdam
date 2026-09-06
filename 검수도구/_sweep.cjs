/* 모든 UI 화면을 하나씩 열어 «좁은 가로 화면에서 쓸 만한가»를 한 번에 잰다.
 *
 * 보는 것:
 *   글자   화면 기준 최소/최대 — 11px 미만이 있으면 안 읽힌다
 *   잘림   scrollHeight > clientHeight 인데 스크롤 단서가 없거나, 화면 밖으로 나간 것
 *   쪼개짐 폭이 글자 하나 수준인데 여러 줄 — «전 체» 처럼 세로로 갈라진 글자
 *   쌓임   열었는데 다른 UI 가 위에 그려지는가
 *   크기   화면을 얼마나 쓰는가(너무 작으면 좁은 화면을 낭비하는 것)
 */
const { chromium } = require('playwright');

const SCREENS = [
  { key: 'none',    이름: '기본 화면',   open: null },
  { key: 'bag',     이름: '인벤토리',     open: 'openInventory()' },
  { key: 'map',     이름: '안전지도',     open: 'BD_openSafetyMap()' },
  { key: 'quest',   이름: '퀘스트 로그',  open: 'BD_openQuestLog()' },
  { key: 'equip',   이름: '장비',        open: 'BD_openEquipModal()' },
  { key: 'achieve', 이름: '업적',        open: 'BD_openAchievements()' },
  { key: 'card',    이름: '도장수첩',     open: 'BD_openCardCollection()' },
  { key: 'shop',    이름: '상점',        open: 'BD_openShop()' },
  { key: 'options', 이름: '설정',        open: 'BD_openTitleOptions()' },
  { key: 'quit',    이름: '종료 확인',    open: 'BD_openQuitConfirm()' },
  { key: 'game',    이름: '미니게임 선택', open: 'BD_openGameSelect()' }
];

const MEASURE = `(() => {
  const VW = innerWidth, VH = innerHeight;
  const scaleOf = el => { let k = 1; for (let a = el; a && a.nodeType === 1; a = a.parentElement) {
    const v = parseFloat(getComputedStyle(a).zoom); if (v > 0 && v !== 1) k *= v; } return k; };
  const shown = el => { const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.1) return false;
    const q = el.getBoundingClientRect();
    return q.width > 8 && q.height > 8 && q.right > 0 && q.left < VW && q.bottom > 0 && q.top < VH; };

  /* 작은 글씨 + 세로 쪼개짐 */
  let minPx = Infinity, tiny = [], split = [];
  document.querySelectorAll('*').forEach(e => {
    if (e.children.length) return;
    const t = (e.textContent || '').trim(); if (!t) return;
    if (!shown(e)) return;
    const k = scaleOf(e), px = parseFloat(getComputedStyle(e).fontSize) * k;
    if (px > 0) {
      if (px < minPx) minPx = px;
      if (px < 11) {
        let owner = '';
        for (let a = e; a; a = a.parentElement) { if (a.id) { owner = '#' + a.id; break; } }
        tiny.push(t.slice(0, 10) + '(' + px.toFixed(1) + ' @' + (owner || '?') + ')');
      }
      const q = e.getBoundingClientRect();
      if (t.length > 1 && q.width < px * 1.6 && q.height > px * 1.9) split.push(t.slice(0, 8));
    }
  });

  /* 화면 밖으로 나가거나 잘린 패널 */
  const clipped = [];
  document.querySelectorAll('div,section,ul').forEach(e => {
    if (!shown(e)) return;
    const q = e.getBoundingClientRect();
    if (q.width < 80 || q.height < 40) return;
    const hid = e.scrollHeight - e.clientHeight;
    const s = getComputedStyle(e);
    const scrollable = /(auto|scroll)/.test(s.overflowY + ' ' + s.overflow);
    if (hid > 12 && !scrollable) clipped.push((e.id || '.' + String(e.className).split(' ')[0]) + ' 숨음' + hid);
    /* 스크롤되는 조상 안에 있으면 «아래에 더 있다»는 뜻이지 잘린 게 아니다.
       그걸 구분하지 않아 모달에 스크롤을 준 뒤에도 계속 «화면밖»으로 잡혔다. */
    let inScroll = false;
    for (let a = e.parentElement; a; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (/(auto|scroll)/.test(as.overflowY + ' ' + as.overflow)) { inScroll = true; break; }
    }
    if (!inScroll && (q.bottom > VH + 4 || q.top < -4)) clipped.push((e.id || '.' + String(e.className).split(' ')[0]) + ' 화면밖');
  });

  /* 열린 패널 중 가장 큰 것 */
  let big = null;
  document.querySelectorAll('div,section').forEach(e => {
    if (!shown(e)) return;
    const s = getComputedStyle(e);
    const hasBg = (s.backgroundImage && s.backgroundImage !== 'none')
      || (s.backgroundColor && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(s.backgroundColor));
    if (!hasBg) return;
    const q = e.getBoundingClientRect();
    if (q.width > VW * 0.985 && q.height > VH * 0.985) return;
    const a = q.width * q.height;
    if (!big || a > big.a) big = { a, id: e.id || '.' + String(e.className).split(' ')[0],
      w: Math.round(q.width), h: Math.round(q.height), z: s.zIndex };
  });

  return { 최소글자: minPx === Infinity ? null : +minPx.toFixed(1),
    작은글씨: [...new Set(tiny)].slice(0, 6), 작은글씨수: tiny.length,
    세로쪼개짐: [...new Set(split)].slice(0, 6), 쪼개짐수: split.length,
    잘림: [...new Set(clipped)].slice(0, 5),
    최대패널: big ? big.id + ' ' + big.w + 'x' + big.h + ' (화면의 ' + (big.a/(VW*VH)*100).toFixed(0) + '%) z' + big.z : '없음' };
})()`;

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  /* BD_MODE=pc 로 데스크톱 환경에서도 같은 검사를 돌린다 —
     «모바일만 바꾸고 PC 는 그대로»를 주장하려면 PC 도 재 봐야 한다. */
  const PC = process.env.BD_MODE === 'pc';
  const ctx = PC
    ? await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    : await b.newContext({ viewport: { width: 874, height: 300 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  console.log(PC ? '▶ PC 1440x900 (마우스)' : '▶ 폰 874x300 (터치)');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
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

  for (const sc of SCREENS) {
    /* 이전 화면을 닫는다 */
    await p.evaluate(() => {
      try { document.querySelectorAll('.bd-modal.show,.bd-modal.open').forEach(x => x.classList.remove('show', 'open')); } catch (e) {}
      try { const v = document.getElementById('inv-overlay'); if (v) v.classList.remove('open'); } catch (e) {}
      try { const q = document.getElementById('quest-overlay'); if (q) q.classList.remove('open', 'show'); } catch (e) {}
      try { if (window.BD_closeSafetyMap) BD_closeSafetyMap(); } catch (e) {}
    });
    await p.waitForTimeout(500);

    let opened = true, why = '';
    if (sc.open) {
      const res = await p.evaluate(code => {
        try { const f = eval(code); return 'ok'; } catch (e) { return 'ERR ' + e.message.slice(0, 60); }
      }, sc.open);
      if (res !== 'ok') { opened = false; why = res; }
      await p.waitForTimeout(1600);
    }
    if (!opened) { console.log('── ' + sc.이름.padEnd(12) + ' 열지 못함: ' + why); continue; }

    const r = await p.evaluate(MEASURE);
    const flags = [];
    if (r.작은글씨수) flags.push('작은글씨 ' + r.작은글씨수 + '개(최소 ' + r.최소글자 + 'px)');
    if (r.쪼개짐수) flags.push('세로쪼개짐 ' + r.쪼개짐수 + '개');
    if (r.잘림.length) flags.push('잘림 ' + r.잘림.length + '건');
    console.log('── ' + sc.이름.padEnd(12) + (flags.length ? '⚠ ' + flags.join(' · ') : '✅ 이상 없음'));
    console.log('     ' + r.최대패널);
    if (r.작은글씨수) console.log('     작은글씨: ' + r.작은글씨.join(' '));
    if (r.쪼개짐수) console.log('     쪼개짐: ' + r.세로쪼개짐.join(' '));
    if (r.잘림.length) console.log('     잘림: ' + r.잘림.join(' · '));
    await p.screenshot({ path: '검수도구/_sw_' + sc.key + '.png' });
  }
  /* 모바일 규칙이 실제로 «켜졌는지 / 꺼졌는지» */
  const mode = await p.evaluate(() => ({
    'html.bd-mobile-ui': document.documentElement.classList.contains('bd-mobile-ui'),
    '모바일 전용 스타일': ['bd-mobile-mode-v398-style', 'bd-mobile-uiscale-v398-style',
      'bd-mobile-vn-v398-style', 'bd-mobile-map-v398-style', 'bd-mobile-inv-v398-style']
      .filter(i => document.getElementById(i)).length + '개 주입됨',
    'BD_MOBILE_ZOOM': window.BD_MOBILE_ZOOM || 1,
    '0259 키보드문구 변환': !!window.BD_GUIDE
  }));
  console.log('■ 모드: ' + JSON.stringify(mode));
  console.log('콘솔에러 ' + errs.length + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
