/* (v399) PC 웹(데스크톱 · 키보드+마우스) 결함 감사 — 화면을 순서대로 열며 스크린샷 + 수치 측정.
 *
 *   node 검수도구/s_pcaudit_v399.cjs --size=1920x1080 [--url=http://localhost:8788/new/] [--headed] [--nofs]
 *
 *   --nofs : requestFullscreen 을 거부(reject)하도록 스텁 — 헤드리스에서 자동 전체화면이 창 상태를 바꿔
 *            setViewportSize 가 실패하는 것을 막는다. (전체화면 동작 자체는 --nofs 없이 1회 관찰)
 *
 *   순서: 타이틀 → 종료하기 확인창 → 설정(UI 크기 전 단계) → 이어하기 → 캐릭터 선택 → 프롤로그(101) HUD/대화창
 *         → 212 와우리: 필드 HUD·트래커·미니맵 → M 안전지도 → J 퀘스트 → E 가방(전 탭) → N / 안전수첩 버튼
 *         → 플레이 중 설정(ESC 로 닫히는가) → 시설 모달 → 상점 → 주민 대화 → 위험요소 조사 선택 → 전투(HSR) → 결과
 *         → 마우스 전용 / 키보드 전용 점검 → UI 크기 130% 필드 → 리사이즈(1366·1280·2560x1080) → 20초 성능
 *   스크린샷: 검수도구/shots_pcaudit/<size>_<step>.png,  보고: shots_pcaudit/report_<size>.json
 */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const URL = opt('url') || 'http://localhost:8788/new/';
const SIZE = opt('size') || '1920x1080';
const [VW, VH] = SIZE.split('x').map(Number);
const NOFS = args.includes('--nofs');
const SHOTS = path.join(__dirname, 'shots_pcaudit'); fs.mkdirSync(SHOTS, { recursive: true });
const log = s => console.log(s);
const report = { size: SIZE, nofs: NOFS, steps: [], console: [], notes: [] };

/* ── 페이지 안 프로브: 잘림·작은 글자·저대비·넘침·placeholder ── */
const PROBE = `(() => {
  const zoomOf = el => { let k = 1;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p);
      const z = parseFloat(s.zoom); if (z && z !== 1) k *= z;
      const m = (s.transform || '').match(/^matrix\\(([-\\d.]+)/);
      if (m && parseFloat(m[1]) && Math.abs(parseFloat(m[1])) !== 1) k *= Math.abs(parseFloat(m[1])); }
    return k; };
  const seen = el => { const s = getComputedStyle(el), r = el.getBoundingClientRect();
    if (s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)<0.15) return false;
    if (r.width < 3 || r.height < 3) return false;
    for (let p = el.parentElement; p; p = p.parentElement) { const ps = getComputedStyle(p);
      if (ps.display==='none'||ps.visibility==='hidden'||parseFloat(ps.opacity)<0.15) return false; }
    return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; };
  const name = el => (el.id ? '#'+el.id : el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'&&el.className.trim()? '.'+el.className.trim().split(/\\s+/)[0]:'')).slice(0,40);
  const parseRGB = s => { const m = (s||'').match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?/); return m ? [+m[1],+m[2],+m[3], m[4]===undefined?1:+m[4]] : null; };
  const lum = c => { const f = v => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); };
  const ratio = (a,b) => { const la=lum(a), lb=lum(b); return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05); };
  const bgOf = el => { for (let p = el; p; p = p.parentElement) { const c = parseRGB(getComputedStyle(p).backgroundColor); if (c && c[3] >= 0.85) return c; const bi = getComputedStyle(p).backgroundImage; if (bi && bi !== 'none') return null; } return null; };
  const isEmoji = t => /^[\\p{Extended_Pictographic}\\s\\uFE0F]+$/u.test(t);

  const cut = [], tiny = [], lowc = [], overflow = [], placeholder = [];
  const bad = /undefined|NaN|\\[object |null\\b|TODO|FIXME|lorem|디버그|debug|테스트용/i;
  document.querySelectorAll('body *').forEach(el => {
    if (!seen(el)) return;
    if (/^(SCRIPT|STYLE|CANVAS|SVG|PATH)$/.test(el.tagName)) return;
    const r = el.getBoundingClientRect();
    const cl = Math.round(Math.max(0,-r.left)), cr = Math.round(Math.max(0,r.right-innerWidth));
    const cb = Math.round(Math.max(0,r.bottom-innerHeight)), ct = Math.round(Math.max(0,-r.top));
    if ((cl>2||cr>2||cb>2||ct>2) && !(el.id==='game-canvas')) cut.push({el:name(el), 좌:cl, 우:cr, 위:ct, 아래:cb, 글:(el.textContent||'').trim().slice(0,18)});
    const own = [...el.childNodes].filter(n => n.nodeType===3).map(n=>n.textContent).join('').trim();
    if (own) {
      const cs = getComputedStyle(el);
      const px = +(parseFloat(cs.fontSize) * zoomOf(el)).toFixed(1);
      if (px && px < 12 && !isEmoji(own)) tiny.push({px, el:name(el), 글: own.slice(0,20)});
      const fg = parseRGB(cs.color), bg = bgOf(el);
      if (fg && bg && fg[3] > 0.5 && !isEmoji(own)) { const rt = +ratio(fg,bg).toFixed(2); const big = px >= 18 || (px >= 14 && +cs.fontWeight >= 700);
        if (rt < (big ? 3 : 4.5)) lowc.push({대비: rt, px, el:name(el), 글: own.slice(0,20), fg: cs.color, bg: 'rgb('+bg.slice(0,3).join(',')+')'}); }
      if (bad.test(own)) placeholder.push({el:name(el), 글: own.slice(0,40)});
    }
    const cs2 = getComputedStyle(el);
    if ((cs2.overflow==='hidden'||cs2.overflowX==='hidden'||cs2.textOverflow==='ellipsis') && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && (el.textContent||'').trim())
      overflow.push({el:name(el), scrollW: el.scrollWidth, clientW: el.clientWidth, 글:(el.textContent||'').trim().slice(0,24)});
  });
  tiny.sort((a,b)=>a.px-b.px); lowc.sort((a,b)=>a.대비-b.대비);
  const uniq = (arr, k) => { const s = new Set(); return arr.filter(x => { const key = k(x); if (s.has(key)) return false; s.add(key); return true; }); };
  return { 잘림: cut.length, 잘림상세: cut.slice(0,6),
           작은글자: tiny.length, 작은글자상세: uniq(tiny, x=>x.px+x.글).slice(0,10),
           저대비: lowc.length, 저대비상세: uniq(lowc, x=>x.대비+x.글).slice(0,8),
           넘침: overflow.length, 넘침상세: overflow.slice(0,6),
           placeholder: placeholder.slice(0,6),
           zoom: (() => { try { return parseFloat(getComputedStyle(document.body).zoom) || 1; } catch (e) { return 1; } })(),
           fs: !!document.fullscreenElement };
})()`;

const rectsOf = sels => `(() => { const out = {}; for (const s of ${JSON.stringify(sels)}) { const el = document.querySelector(s); if (!el) { out[s] = null; continue; }
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  if (cs.display === 'none' || r.width < 1) { out[s] = { hidden: true }; continue; }
  out[s] = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), font: cs.fontSize, op: cs.opacity, text: (el.textContent||'').trim().replace(/\\s+/g,' ').slice(0,80) }; } return out; })()`;
/* 텍스트를 가진 자손들의 글자 크기 분포 */
const fontsIn = sel => `(() => { const root = document.querySelector(${JSON.stringify(sel)}); if (!root) return null; const out = []; root.querySelectorAll('*').forEach(el => { const own=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(); if(!own) return; const cs=getComputedStyle(el); if(cs.display==='none'||el.getBoundingClientRect().width<1) return; out.push({px:+parseFloat(cs.fontSize).toFixed(1), 글: own.slice(0,24), color: cs.color}); }); out.sort((a,b)=>a.px-b.px); const r=root.getBoundingClientRect(); return { rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, zoom: getComputedStyle(root).zoom, transform: getComputedStyle(root).transform, n: out.length, smallest: out.slice(0,10), largest: out.slice(-3) }; })()`;

async function main() {
  const browser = await chromium.launch({ headless: !args.includes('--headed') });
  const c = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, hasTouch: false, isMobile: false });
  if (NOFS) await c.addInitScript(() => { try { const rej = function () { return Promise.reject(new DOMException('stub', 'NotAllowedError')); }; Element.prototype.requestFullscreen = rej; Element.prototype.webkitRequestFullscreen = undefined; } catch (e) {} });
  const p = await c.newPage();
  /* rAF 기준 주기 보정 (빈 페이지) */
  await p.goto('about:blank');
  report.rafBaseline = await p.evaluate(async () => { const gaps = []; let last = performance.now(); const t0 = last; await new Promise(res => { function tick(now) { gaps.push(now - last); last = now; if (now - t0 < 3000) requestAnimationFrame(tick); else res(); } requestAnimationFrame(tick); }); const g = gaps.slice(1).sort((a, b) => a - b); return { fps: +(g.length / 3).toFixed(1), p50: +g[Math.floor(g.length / 2)].toFixed(1) }; });
  log('  rAF baseline(about:blank): ' + JSON.stringify(report.rafBaseline));
  p.on('pageerror', e => report.console.push({ t: 'pageerror', m: String(e.message || e).slice(0, 200) }));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') report.console.push({ t: m.type(), m: m.text().slice(0, 200) }); });

  const shot = async (n, clip) => { const f = path.join(SHOTS, SIZE + '_' + n + '.png'); await p.screenshot(clip ? { path: f, clip } : { path: f }); return f; };
  const ev = (s) => p.evaluate(s).catch(e => ({ 오류: String(e.message).slice(0, 80) }));
  async function step(name, fn, sels) {
    const rec = { name };
    try { const r = await fn(); if (r !== undefined) rec.result = r; } catch (e) { rec.error = String(e.message).split('\n')[0]; }
    await p.waitForTimeout(900);
    rec.shot = await shot(name);
    rec.probe = await ev(PROBE);
    if (sels) rec.rects = await ev(rectsOf(sels));
    report.steps.push(rec);
    const pr = rec.probe || {};
    log(`  [${name}] 잘림 ${pr.잘림} · 12px미만 ${pr.작은글자} · 저대비 ${pr.저대비} · 넘침 ${pr.넘침} · placeholder ${(pr.placeholder||[]).length}` + (pr.fs ? ' · FULLSCREEN' : '') + (rec.error ? ' · 오류 ' + rec.error : ''));
    return rec;
  }
  const isDialogueOpen = () => p.evaluate(() => { const b = document.getElementById('dialogue-box'); return !!(b && b.getBoundingClientRect().height > 0 && getComputedStyle(b).display !== 'none') || !!window.__bdDamiOpeningBusy; }).catch(() => false);
  const openThings = () => p.evaluate(() => {
    const vis = id => { const e = document.getElementById(id); return !!(e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 2); };
    const b = document.getElementById('dialogue-box');
    return { d: !!(b && b.getBoundingClientRect().height > 0 && getComputedStyle(b).display !== 'none'), c: vis('bd-choice') || !!(window.__bdChoiceState && __bdChoiceState.open),
      modal: (document.querySelector('.bd-modal.show') || {}).id || null, settings: vis('bd-settings-modal'), pause: vis('bd-pause-modal'),
      overlays: ['inv-overlay', 'quest-overlay', 'notebook-overlay', 'bd-map-v342', 'bd-shop-modal', 'bd-district-facility-modal', 'bd-qlog2', 'bd-codex'].filter(vis), busy: !!window.__bdDamiOpeningBusy, blocked: !!(window.BD_isInputBlocked && BD_isInputBlocked()) };
  }).catch(() => ({}));
  /* 열린 것을 전부 닫는다 — ESC 를 무작정 누르지 않고(ESC 는 필드에서 일시정지를 «연다») 상태를 보고 처리 */
  const closeAll = async () => {
    for (let i = 0; i < 10; i++) {
      const st = await openThings();
      if (st.settings) { await p.evaluate(() => { const m = document.getElementById('bd-settings-modal'); const b = [...m.querySelectorAll('button')].find(x => /^닫기/.test((x.textContent || '').trim())); if (b) b.click(); else { m.classList.remove('show'); m.style.display = 'none'; } }); await p.waitForTimeout(300); continue; }
      if (st.pause) { await p.evaluate(() => { const m = document.getElementById('bd-pause-modal'); const b = [...m.querySelectorAll('button')].find(x => /계속/.test(x.textContent || '')); if (b) b.click(); }); await p.waitForTimeout(300); continue; }
      if (st.c) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); continue; }
      if (st.modal || st.overlays.length) { await p.keyboard.press('Escape'); await p.waitForTimeout(350); const st2 = await openThings(); if (st2.modal === st.modal && st2.overlays.join() === st.overlays.join()) { await p.evaluate(() => { document.querySelectorAll('.bd-modal.show').forEach(m => { const b = [...m.querySelectorAll('button')].find(x => /닫기|✕|×/.test(x.textContent || '')); if (b) b.click(); }); }); await p.waitForTimeout(300); } continue; }
      if (st.d) { await p.keyboard.press(' '); await p.waitForTimeout(300); continue; }
      return true;
    }
    return false;
  };
  const drain = async (n = 25) => { for (let t = 0; t < n; t++) { const st = await openThings(); if (!st.d && !st.c && !st.busy && !st.blocked && !st.modal) return true; if (st.modal || st.c) { await closeAll(); continue; } await p.keyboard.press(' '); await p.waitForTimeout(400); } return false; };
  const moveTo = (x, y) => p.evaluate(([x, y]) => { heroX = x; heroY = y; if (typeof camX !== 'undefined') { camX = x; camY = y; } }, [x, y]);
  const objAt = (pred) => p.evaluate((src) => { const f = new Function('o', 'return ' + src); const o = (STAGES[currentStage].objects || []).find(o => o && f(o)); return o ? { rx: o.rx, ry: o.ry, rw: o.rw || 0.04, rh: o.rh || 0.05, label: o.label, type: o.type, resident: !!o.resident, hazardId: o.hazardId, npcName: o.npcName } : null; }, pred);
  const gotoObj = async (o, dy = 0.012) => { await moveTo(o.rx + o.rw / 2, o.ry + o.rh + dy); await p.waitForTimeout(500); };
  const focusSeq = async (n) => { const seq = []; for (let i = 0; i < n; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(90); seq.push(await ev(`(() => { const a=document.activeElement; if(!a) return null; const r=a.getBoundingClientRect(); const vis=getComputedStyle(a).display!=='none'&&r.width>1&&getComputedStyle(a).visibility!=='hidden'&&parseFloat(getComputedStyle(a).opacity)>0.1; return (a.id?'#'+a.id: a.tagName+'.'+(a.className||'').toString().split(' ')[0])+' «'+(a.textContent||'').trim().slice(0,12)+'»'+(vis?'':' [INVISIBLE]'); })()`)); } return seq; };

  /* ═════ 1. 타이틀 ═════ */
  log('1. 타이틀 (' + SIZE + (NOFS ? ', nofs' : '') + ')');
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await step('01_title', async () => ev(`(() => { const ids=['bd-title-screen','bd-title-start','bd-title-continue','bd-title-options','bd-title-reset','bd-settings-btn','bd-fullscreen-return','bd-codex-btn','bd-mb-equip','bd-mb-map'];
    const out={}; for (const id of ids){ const el=document.getElementById(id); if(!el){out[id]=null;continue;} const r=el.getBoundingClientRect(); const cs=getComputedStyle(el); out[id]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),text:(el.textContent||'').trim().slice(0,30),cursor:cs.cursor,display:cs.display,vis:cs.visibility,op:cs.opacity,tag:el.tagName,tabindex:el.tabIndex,disabled:el.disabled,aria:el.getAttribute('aria-label'),title:el.title}; }
    const noSave=[...document.querySelectorAll('body *')].filter(e=>!/^(SCRIPT|STYLE)$/.test(e.tagName)&&e.children.length===0&&/저장.{0,3}없|세이브/.test(e.textContent||'')).map(e=>{const r=e.getBoundingClientRect();return {el:e.id||e.className,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),font:getComputedStyle(e).fontSize,color:getComputedStyle(e).color,op:getComputedStyle(e).opacity,text:e.textContent.trim()};});
    const cv=document.getElementById('game-canvas'); const cr=cv&&cv.getBoundingClientRect();
    return {btns:out,noSaveLabel:noSave,canvas:cr?{x:Math.round(cr.x),y:Math.round(cr.y),w:Math.round(cr.width),h:Math.round(cr.height)}:null,bodyBg:getComputedStyle(document.body).backgroundColor,vw:innerWidth,vh:innerHeight,title:document.title,foot:(document.querySelector('.bd-title-foot')||{}).textContent}; })()`));
  await step('01b_title_tab', async () => ({ tabSeq: await focusSeq(7) }));
  await p.mouse.click(5, 5); await p.waitForTimeout(400);
  /* hover 상태 */
  await step('01c_title_hover_start', async () => { const r = await ev(`(() => { const b=document.getElementById('bd-title-start'); const q=b.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); await p.mouse.move(r.x, r.y); await p.waitForTimeout(400); return r; });
  /* 종료하기 */
  await step('01d_title_quit', async () => { await ev(`(() => { const b=document.getElementById('bd-title-reset'); if(b) b.click(); })()`); await p.waitForTimeout(700); return ev(`(() => { const m=document.querySelector('.bd-modal.show'); const q=document.getElementById('modal-quit'); const pick=(m&&m.id!=='bd-title-screen')?m:(q&&getComputedStyle(q).display!=='none'?q:null); if(!pick) return {modal:null, shown:[...document.querySelectorAll('.bd-modal.show')].map(x=>x.id)}; return {modal:pick.id, text:(pick.innerText||'').replace(/\\s+/g,' ').slice(0,300), btns:[...pick.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>(b.textContent||'').trim().slice(0,16))}; })()`); });
  await closeAll(); await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  /* 설정 (타이틀) — UI 크기 단계별 */
  await step('02_settings_title', async () => { await ev(`(() => { const b=document.getElementById('bd-title-options'); if(b) b.click(); })()`); await p.waitForTimeout(800); return ev(`(() => { const m=document.getElementById('bd-settings-modal'); if(!m) return 'no modal'; const box=m.querySelector('.bd-modal-box')||m; const r=box.getBoundingClientRect(); const rows=[...m.querySelectorAll('.bd-set-row')].map(x=>({label:(x.querySelector('span')||{}).textContent, labelColor:getComputedStyle(x.querySelector('span')||x).color, labelFont:getComputedStyle(x.querySelector('span')||x).fontSize, ctl:[...x.querySelectorAll('button')].map(b=>(b.textContent||'').trim())})); return {show:m.classList.contains('show'), box:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, boxBg:getComputedStyle(box).backgroundColor, boxBgImg:getComputedStyle(box).backgroundImage.slice(0,60), rows}; })()`); }, ['#bd-settings-modal']);
  for (const pct of ['80%', '130%', '자동']) {
    await step('02_settings_uiscale_' + pct.replace('%', 'p'), async () => { await p.evaluate((t) => { const m = document.getElementById('bd-settings-modal'); const b = [...m.querySelectorAll('button')].find(x => (x.textContent || '').trim() === t); if (b) b.click(); }, pct); await p.waitForTimeout(600); return ev(`(() => { const ts=document.getElementById('bd-title-screen'); const r=ts.getBoundingClientRect(); return {bodyZoom:getComputedStyle(document.body).zoom, titleRect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, vh:innerHeight, vw:innerWidth, ls: localStorage.getItem('bd_ui_scale_v353')}; })()`); });
  }
  await closeAll();

  /* 이어하기 */
  await step('03_continue', async () => { await ev(`(() => { const b=document.getElementById('bd-title-continue'); if(b) b.click(); })()`); await p.waitForTimeout(900); return ev(`(() => { const m=document.getElementById('modal-continue'); const shown=[...document.querySelectorAll('.bd-modal.show')].map(x=>x.id); const sl=document.getElementById('continue-slots'); const b=document.getElementById('bd-title-continue'); return {shown, continueDisplay: m?getComputedStyle(m).display:null, continueShow: m?m.classList.contains('show'):null, slots: sl? [...sl.children].map(x=>(x.textContent||'').trim().replace(/\\s+/g,' ').slice(0,60)) : null, btn: b?{cursor:getComputedStyle(b).cursor, opacity:getComputedStyle(b).opacity, disabled:b.disabled, ariaDisabled:b.getAttribute('aria-disabled'), cls:b.className}:null}; })()`); });
  await closeAll(); await p.keyboard.press('Escape');

  /* 캐릭터 선택 */
  log('2. 캐릭터 선택 → 프롤로그');
  await p.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const ok = await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); const c = document.getElementById('char-card-1'); return !!(m && m.classList.contains('show')) || !!(c && c.getBoundingClientRect().width > 2); }).catch(() => false); if (ok) break; }
  await p.waitForTimeout(800);
  await step('04_charselect', async () => ev(`(() => { const m=document.getElementById('bd-startsetup-modal'); const box=m&&(m.querySelector('.bd-modal-box')||m); const bx=box&&box.getBoundingClientRect(); const cards=[1,2].map(i=>{const c=document.getElementById('char-card-'+i); if(!c) return null; const r=c.getBoundingClientRect(); const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2); const chain=[]; for(let h=hit;h&&chain.length<4;h=h.parentElement) chain.push(h.tagName+(h.id?'#'+h.id:'')+(h.className&&typeof h.className==='string'?'.'+h.className.split(' ')[0]:'')); return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),cursor:getComputedStyle(c).cursor,tabindex:c.tabIndex,tag:c.tagName,role:c.getAttribute('role'),hitOk: hit===c||c.contains(hit), hitChain: chain};});
    const btns=[...(m?m.querySelectorAll('button,.modal-btn'):[])].filter(b=>b.getBoundingClientRect().width>2).map(b=>({t:(b.textContent||'').trim().slice(0,16),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),disabled:b.disabled,font:getComputedStyle(b).fontSize}));
    const over=[...document.querySelectorAll('body > *')].filter(x=>x!==m && getComputedStyle(x).display!=='none' && x.getBoundingClientRect().height>2 && /전체화면|탭하면|눌러/.test(x.innerText||'')).map(x=>({id:x.id, cls:x.className.toString().slice(0,30), text:(x.innerText||'').replace(/\\s+/g,' ').slice(0,120), z:getComputedStyle(x).zIndex}));
    return {show:!!(m&&m.classList.contains('show')), box: bx?{x:Math.round(bx.x),y:Math.round(bx.y),w:Math.round(bx.width),h:Math.round(bx.height)}:null, cards, btns, fsOverlay: over, text:(m?m.innerText:'').replace(/\\s+/g,' ').slice(0,300)}; })()`), ['#bd-startsetup-modal', '#char-card-1', '#char-card-2']);
  await step('04b_charselect_hover', async () => { const r = await ev(`(() => { const c=document.getElementById('char-card-2'); const q=c.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); if (r && r.x) await p.mouse.move(r.x, r.y); await p.waitForTimeout(400); return r; });
  await step('04c_charselect_tab', async () => ({ tabSeq: await focusSeq(5) }));
  /* 마우스로 카드 2 클릭 → 선택 표시? */
  await step('04d_charselect_click2', async () => { const r = await ev(`(() => { const c=document.getElementById('char-card-2'); const q=c.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); if (r && r.x) await p.mouse.click(r.x, r.y); await p.waitForTimeout(400); return ev(`(() => { const c=[1,2].map(i=>{const e=document.getElementById('char-card-'+i); return {cls:e.className, border:getComputedStyle(e).borderColor, outline:getComputedStyle(e).outline, ariaSel:e.getAttribute('aria-selected')};}); return c; })()`); });

  await p.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) {} });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(700); const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await p.waitForTimeout(2500);

  /* ═════ 프롤로그 101 ═════ */
  const HUD = ['#bd-hp-dom', '#bd-quest-hud', '#bd-keybar', '#key-hint', '#bd-dami-field-bubble', '#bd-dami-hud', '#dialogue-box', '#dialogue-name', '#dialogue-portrait', '#dialogue-text', '#dialogue-next', '#bd-settings-btn', '#bd-fullscreen-return', '#bd-district-hud', '#bd-district-minimap', '#bd-mb-toggle', '#bd-codex-btn', '#bd-mb-equip', '#bd-mb-map', '#bd-toast', '#bd-worry', '#bd-goal-down'];
  await step('05_prologue_first', async () => ({ stage: await ev('currentStage') }), HUD);
  /* 캔버스 상단 텍스트 확대 */
  await shot('05_prologue_topcenter_zoom', { x: Math.round(VW * 0.35), y: 40, width: Math.round(VW * 0.3), height: 80 });
  await p.keyboard.press(' '); await p.waitForTimeout(700);
  await step('05b_prologue_dialogue', async () => ({ dialogueOpen: await isDialogueOpen(), dlg: await ev(`(() => { const t=document.getElementById('dialogue-text'); const n=document.getElementById('dialogue-name'); const b=document.getElementById('dialogue-box'); const po=document.getElementById('dialogue-portrait'); const nx=document.getElementById('dialogue-next'); const cs=t&&getComputedStyle(t); const bcs=b&&getComputedStyle(b); const tr=t&&t.getBoundingClientRect(); const nr=n&&n.getBoundingClientRect(); return {text:t?t.textContent.slice(0,120):null, font:cs?cs.fontSize:null, lineH:cs?cs.lineHeight:null, color:cs?cs.color:null, boxBg:bcs?bcs.backgroundColor:null, textRect:tr?{x:Math.round(tr.x),y:Math.round(tr.y),w:Math.round(tr.width),h:Math.round(tr.height)}:null, textMaxW:cs?cs.maxWidth:null, name:n?n.textContent:null, nameFont:n?getComputedStyle(n).fontSize:null, nameRect:nr?{x:Math.round(nr.x),y:Math.round(nr.y),w:Math.round(nr.width),h:Math.round(nr.height)}:null, portrait:po?{x:Math.round(po.getBoundingClientRect().x),w:Math.round(po.getBoundingClientRect().width),h:Math.round(po.getBoundingClientRect().height)}:null, boxRect:b?(q=>({x:Math.round(q.x),y:Math.round(q.y),w:Math.round(q.width),h:Math.round(q.height)}))(b.getBoundingClientRect()):null, next: nx?{display:getComputedStyle(nx).display, text:nx.textContent, w:Math.round(nx.getBoundingClientRect().width), h:Math.round(nx.getBoundingClientRect().height), cursor:getComputedStyle(nx).cursor}:null, boxCursor:bcs?bcs.cursor:null}; })()`) }), HUD);
  /* 대화 넘기기: 마우스 클릭 (대화창 위 / 다음 표시 / 화면 아무 데나) */
  await step('05c_prologue_click_next', async () => {
    const out = {};
    const txt = () => ev(`document.getElementById('dialogue-text')?document.getElementById('dialogue-text').textContent.slice(0,60):null`);
    const tryClick = async (label, sel, fallback) => { const before = await txt(); const r = await ev(`(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const q=e.getBoundingClientRect(); if(q.width<1) return null; return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); const pt = r && r.x ? r : fallback; if (!pt) { out[label] = 'no target'; return; } await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(700); const after = await txt(); out[label] = { at: [Math.round(pt.x), Math.round(pt.y)], advanced: before !== after, before, after }; };
    await p.waitForTimeout(2000);
    await tryClick('dialogueBox_after2s', '#dialogue-box');
    await p.waitForTimeout(2000);
    await tryClick('dialogueText_after2s', '#dialogue-text');
    await p.waitForTimeout(2000);
    await tryClick('canvasCenter_after2s', '#nonexistent', { x: VW / 2, y: VH * 0.4 });
    return out;
  });
  report.notes.push({ keybar: await ev(`(() => { const k=document.getElementById('bd-keybar'); return k?{html:k.innerHTML.slice(0,300), text:k.innerText, font:getComputedStyle(k).fontSize, kbdFont:(q=>q?getComputedStyle(q).fontSize:null)(k.querySelector('kbd')), rect:(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(k.getBoundingClientRect())}:null; })()`) });
  await drain(40); await p.waitForTimeout(800);
  await step('05d_prologue_field', async () => ({ hud: await ev(`(() => { const ids=['bd-hp-dom','bd-quest-hud','bd-keybar','key-hint','bd-dami-field-bubble','bd-settings-btn','bd-fullscreen-return','bd-district-hud','bd-district-minimap','bd-codex-btn','bd-mb-equip','bd-mb-map','bd-menu-btns']; const out={}; const els=[]; for(const id of ids){const el=document.getElementById(id); if(!el||getComputedStyle(el).display==='none'||el.getBoundingClientRect().width<2) continue; const r=el.getBoundingClientRect(); els.push({id,r}); out[id]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),font:getComputedStyle(el).fontSize,cursor:getComputedStyle(el).cursor,text:(el.innerText||'').replace(/\\s+/g,' ').slice(0,60)};}
    const ov=[]; for(let i=0;i<els.length;i++) for(let j=i+1;j<els.length;j++){const a=els[i].r,b=els[j].r; const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left), iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if(ix>4&&iy>4) ov.push(els[i].id+'×'+els[j].id+' '+Math.round(ix)+'x'+Math.round(iy));}
    const tut=[...document.querySelectorAll('body > *')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&/방향키로 움직여|Space/.test(x.innerText||'')&&x.id!=='bd-keybar').map(x=>({id:x.id,rect:(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(x.getBoundingClientRect()),text:(x.innerText||'').replace(/\\s+/g,' ').slice(0,80)}));
    /* 트래커(길안내) 패널 찾기 */
    let tr=null; const cands=[...document.querySelectorAll('body div')].filter(x=>/길안내/.test(x.innerText||'')&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>100&&x.getBoundingClientRect().width<600); if(cands.length){ const t=cands.reduce((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height<=b.getBoundingClientRect().width*b.getBoundingClientRect().height?a:b); tr={id:t.id, cls:t.className.toString().slice(0,40)}; }
    return {hud:out, overlaps:ov, tutorialHint:tut, tracker:tr}; })()`) }), HUD);
  const trackerSel = await ev(`(() => { const cands=[...document.querySelectorAll('body div')].filter(x=>/길안내/.test(x.innerText||'')&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>100&&x.getBoundingClientRect().width<600); if(!cands.length) return null; const t=cands.reduce((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height<=b.getBoundingClientRect().width*b.getBoundingClientRect().height?a:b); if(!t.id) t.id='__tracker_probe'; return '#'+t.id; })()`);
  report.notes.push({ trackerFonts: trackerSel && typeof trackerSel === 'string' ? await ev(fontsIn(trackerSel)) : null, hpFonts: await ev(fontsIn('#bd-hp-dom')), keybarFonts: await ev(fontsIn('#bd-keybar')) });
  await p.keyboard.down('d'); await p.waitForTimeout(1200); await p.keyboard.up('d');
  await step('05e_prologue_moved', async () => ({ pos: await ev('[heroX,heroY]') }), HUD);

  /* ═════ 212 와우리 ═════ */
  log('3. 212 와우리');
  await p.evaluate(() => { ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75'].forEach(k => localStorage.setItem(k, '1')); if (typeof fadeToStage === 'function') fadeToStage(212, 0.5, 0.55); });
  await p.waitForTimeout(2500);
  for (let t = 0; t < 30; t++) { const busy = await ev('!!window.__bdDamiOpeningBusy'); if (!busy) break; await p.waitForTimeout(1000); }
  await step('06_district_arrive', async () => ({ stage: await ev('currentStage'), open: await openThings(), controlsPopup: await ev(`(() => { const x=[...document.querySelectorAll('body > *')].find(e=>getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>2&&/조작 방법/.test(e.innerText||'')); return x?{id:x.id, text:(x.innerText||'').replace(/\\s+/g,' ').slice(0,200)}:null; })()`) }), HUD);
  await p.keyboard.press(' '); await p.waitForTimeout(500); await drain(40);
  await step('06b_district_field', async () => ({ hud: await ev(`(() => { const ids=['bd-hp-dom','bd-quest-hud','bd-keybar','bd-dami-field-bubble','bd-settings-btn','bd-fullscreen-return','bd-district-hud','bd-district-minimap','bd-codex-btn','bd-mb-equip','bd-mb-map','bd-menu-btns','bd-worry','bd-goal-down','bd-dami-hud']; const out={}; const els=[]; for(const id of ids){const el=document.getElementById(id); if(!el||getComputedStyle(el).display==='none'||el.getBoundingClientRect().width<2) continue; const r=el.getBoundingClientRect(); els.push({id,r}); out[id]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),font:getComputedStyle(el).fontSize,cursor:getComputedStyle(el).cursor,title:el.title,text:(el.innerText||'').replace(/\\s+/g,' ').slice(0,100)};}
    const ov=[]; for(let i=0;i<els.length;i++) for(let j=i+1;j<els.length;j++){const a=els[i].r,b=els[j].r; const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left), iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if(ix>4&&iy>4) ov.push(els[i].id+'×'+els[j].id+' '+Math.round(ix)+'x'+Math.round(iy));}
    const cv=document.getElementById('game-canvas'); const cr=cv.getBoundingClientRect();
    return {hud:out, overlaps:ov, canvas:{x:Math.round(cr.x),y:Math.round(cr.y),w:Math.round(cr.width),h:Math.round(cr.height),bw:cv.width,bh:cv.height}, questIdx: (window.BD&&BD.questIdx)}; })()`), minimapFonts: await ev(fontsIn('#bd-district-minimap')), trackerFonts: trackerSel && typeof trackerSel === 'string' ? await ev(fontsIn(trackerSel)) : null }), HUD);
  await shot('06c_district_tracker_zoom', { x: Math.max(0, VW - 330), y: 90, width: 330, height: 330 });
  await shot('06d_district_minimap_zoom', { x: Math.max(0, VW - 250), y: Math.max(0, VH - 150), width: 250, height: 150 });

  /* M 안전지도 */
  await p.keyboard.press('m'); await p.waitForTimeout(1200);
  await step('07_safetymap_M', async () => ev(`(() => { const root=document.getElementById('bd-map-v342'); if(!root) return {open:false, things: null}; const r=root.getBoundingClientRect(); const cl=[...root.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().width>2 && (x.tagName==='BUTTON'||x.onclick||getComputedStyle(x).cursor==='pointer'||x.title)).map(x=>({t:(x.textContent||'').trim().slice(0,14),w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height),cursor:getComputedStyle(x).cursor,title:x.title||'',tag:x.tagName,tabindex:x.tabIndex})); const markers=cl.filter(x=>x.title); const noTitle=[...root.querySelectorAll('.m42-fac, .m42-hz, [class*=m42-]')].filter(x=>x.getBoundingClientRect().width>2 && !x.title && x.getBoundingClientRect().width<80).length; return {open: getComputedStyle(root).display!=='flex'?getComputedStyle(root).display:'flex', rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, clickable: cl.length, withTitle: markers.length, sampleTitles: markers.slice(0,6), text:(root.innerText||'').replace(/\\s+/g,' ').slice(0,200)}; })()`), ['#bd-map-v342', '#bd-map-v342-board', '#bd-map-v342-stats', '#bd-map-v342-tip']);
  await step('07b_safetymap_hover_marker', async () => { const r = await ev(`(() => { const root=document.getElementById('bd-map-v342'); const m=[...root.querySelectorAll('[title]')].find(x=>x.getBoundingClientRect().width>2 && /길찾기/.test(x.title)); if(!m) return null; const q=m.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,title:m.title}; })()`); if (r && r.x) { await p.mouse.move(r.x, r.y); await p.waitForTimeout(900); } const tip = await ev(`(() => { const t=[...document.querySelectorAll('body *')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&/길찾기 추적|누르면/.test(x.innerText||'')&&x.children.length<3).map(x=>({id:x.id,cls:x.className.toString().slice(0,30),text:x.innerText.slice(0,60)})); return t; })()`); return { marker: r, customTooltip: tip }; });
  await step('07c_safetymap_click_marker', async () => { const r = await ev(`(() => { const root=document.getElementById('bd-map-v342'); const m=[...root.querySelectorAll('[title]')].find(x=>x.getBoundingClientRect().width>2 && /길찾기/.test(x.title)); if(!m) return null; const q=m.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,title:m.title}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(900); } return { marker: r, after: await openThings(), toast: await ev(`(() => { const t=[...document.querySelectorAll('[id*=toast]')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2).map(x=>x.innerText.slice(0,80)); return t; })()`) }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  report.notes.push({ mapClosedByEsc: await ev(`(() => { const el=document.getElementById('bd-map-v342'); return !el || getComputedStyle(el).display==='none'; })()`) });
  await closeAll();

  /* J 퀘스트 로그 */
  await p.keyboard.press('j'); await p.waitForTimeout(900);
  await step('08_questlog_J', async () => ev(`(() => { const roots=[...document.querySelectorAll('body > *')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&/진행 중|메인 임무|임무 추적/.test(x.innerText||'')); const root=roots[0]; if(!root) return {open:false}; const r=root.getBoundingClientRect(); const btns=[...root.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>({t:(b.textContent||'').trim().slice(0,14),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize})); const items=[...root.querySelectorAll('[class*=item]')].filter(x=>x.getBoundingClientRect().height>10).map(x=>({cls:x.className.toString().slice(0,30),t:(x.innerText||'').replace(/\\s+/g,' ').slice(0,30),cursor:getComputedStyle(x).cursor,tabindex:x.tabIndex,tag:x.tagName})); return {id:root.id, cls:root.className.toString().slice(0,40), rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, btns, items:items.slice(0,6), text:(root.innerText||'').replace(/\\s+/g,' ').slice(0,500), 없음:((root.innerText||'').match(/없음|없습니다|비어/g)||[]).length}; })()`));
  await step('08b_questlog_tab', async () => ({ tabSeq: await focusSeq(4) }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  report.notes.push({ questClosedByEsc: await ev(`(() => { const roots=[...document.querySelectorAll('body > *')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&/메인 임무|임무 추적/.test(x.innerText||'')); return roots.length===0; })()`) });
  await closeAll();

  /* E 가방 전 탭 */
  await p.keyboard.press('e'); await p.waitForTimeout(900);
  await step('09_bag_E', async () => ev(`(() => { const ov=document.getElementById('inv-overlay'); const pn=document.getElementById('inv-panel'); const tabs=[...document.querySelectorAll('#inv-tabs button, #inv-tabs .inv-tab')].map(x=>({t:(x.textContent||'').trim().slice(0,12),w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height),font:getComputedStyle(x).fontSize, lines: Math.round(x.getBoundingClientRect().height/parseFloat(getComputedStyle(x).lineHeight||getComputedStyle(x).fontSize)), ws:getComputedStyle(x).whiteSpace, tabindex:x.tabIndex})); const grid=document.getElementById('inv-grid'); const emp=document.querySelector('.inv-empty'); return {open: !!(ov && getComputedStyle(ov).display!=='none'), panel: pn?(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(pn.getBoundingClientRect()):null, panelBg: pn?getComputedStyle(pn).backgroundColor:null, tabs, gridItems: grid?grid.children.length:0, gold:(document.getElementById('inv-gold')||{}).textContent, empty: emp?{text:emp.textContent.trim(), color:getComputedStyle(emp).color, font:getComputedStyle(emp).fontSize}:null, footer:(q=>q?{text:q.textContent.trim(),font:getComputedStyle(q).fontSize,color:getComputedStyle(q).color}:null)(document.getElementById('inv-footer'))}; })()`), ['#inv-panel', '#inv-tabs', '#inv-grid', '#inv-detail', '#inv-use-btn', '#inv-close-btn', '#inv-footer']);
  {
    const tabs = await ev(`[...document.querySelectorAll('#inv-tabs button, #inv-tabs .inv-tab')].map(x=>(x.textContent||'').trim().slice(0,12))`);
    for (let i = 1; i < Math.min((tabs || []).length, 7); i++) {
      await step('09_bag_tab' + i + '_' + String(tabs[i]).replace(/[^가-힣A-Za-z0-9]/g, ''), async () => { await p.evaluate((i) => { const b = document.querySelectorAll('#inv-tabs button, #inv-tabs .inv-tab')[i]; if (b) b.click(); }, i); await p.waitForTimeout(500); return ev(`(() => { const pn=document.getElementById('inv-panel'); const vis=[...pn.querySelectorAll('#inv-body,#inv-safety-panel,#inv-skill-panel,#inv-achieve-panel')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2).map(x=>({id:x.id, scrollH:x.scrollHeight, clientH:x.clientHeight, overflowY:getComputedStyle(x).overflowY, bg:getComputedStyle(x).backgroundColor})); const cards=[...pn.querySelectorAll('.achieve-card,.safety-skill')].slice(0,2).map(x=>({cls:x.className, bg:getComputedStyle(x).backgroundColor, bgImg:getComputedStyle(x).backgroundImage.slice(0,50), nameColor:(q=>q?getComputedStyle(q).color:null)(x.querySelector('.achieve-name,.safety-skill-name')), descColor:(q=>q?getComputedStyle(q).color:null)(x.querySelector('.achieve-desc,.safety-skill-desc')), descFont:(q=>q?getComputedStyle(q).fontSize:null)(x.querySelector('.achieve-desc,.safety-skill-desc'))})); return {visiblePanels:vis, cards, text:(pn.innerText||'').replace(/\\s+/g,' ').slice(0,300)}; })()`); });
    }
    await step('09_bag_item_click', async () => { await p.evaluate(() => { const b = document.querySelectorAll('#inv-tabs button, #inv-tabs .inv-tab')[0]; if (b) b.click(); }); await p.waitForTimeout(300); const r = await ev(`(() => { const g=document.getElementById('inv-grid'); const it=g&&[...g.children].find(x=>x.getBoundingClientRect().width>2); if(!it) return null; const q=it.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,w:Math.round(q.width),h:Math.round(q.height),cursor:getComputedStyle(it).cursor,text:(it.textContent||'').trim().slice(0,20),cls:it.className}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(500); } return { item: r, detail: await ev(`(document.getElementById('inv-detail')||{}).innerText`), useBtn: await ev(`(() => { const b=document.getElementById('inv-use-btn'); return b?{t:b.textContent.trim(),disabled:b.disabled,display:getComputedStyle(b).display}:null; })()`) }; });
    await step('09_bag_keyboard', async () => { const seq = await focusSeq(6); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200); const sel = await ev(`(() => { const g=document.getElementById('inv-grid'); const s=g&&g.querySelector('.selected,[class*=sel],[aria-selected=true]'); return s? s.textContent.trim().slice(0,20):null; })()`); return { tabSeq: seq, arrowSelected: sel }; });
  }
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  report.notes.push({ bagClosedByEsc: await ev(`(() => { const ov=document.getElementById('inv-overlay'); return !ov || getComputedStyle(ov).display==='none'; })()`) });
  await closeAll();

  /* N 키 / 안전수첩 버튼 */
  await p.keyboard.press('n'); await p.waitForTimeout(900);
  await step('10_N_key', async () => ({ open: await openThings(), visibleTop: await ev(`[...document.querySelectorAll('body > *')].filter(x=>x.id&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&getComputedStyle(x).position==='fixed'&&x.getBoundingClientRect().width>300).map(x=>x.id).slice(0,20)`) }));
  await closeAll();
  await step('10b_codex_btn', async () => { const r = await ev(`(() => { const b=document.getElementById('bd-codex-btn'); if(!b||getComputedStyle(b).display==='none') return null; const q=b.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,text:b.innerText,title:b.title,w:Math.round(q.width),h:Math.round(q.height)}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(1000); } const closeBtn = await ev(`(() => { const b=document.getElementById('bd-codex-close'); if(!b) return null; const cs=getComputedStyle(b); const q=b.getBoundingClientRect(); return {text:b.textContent.trim(), color:cs.color, font:cs.fontSize, bgImg:cs.backgroundImage.slice(0,90), textIndent:cs.textIndent, rect:{x:Math.round(q.x),y:Math.round(q.y),w:Math.round(q.width),h:Math.round(q.height)}, onclick: (b.getAttribute('onclick')||'').slice(0,80)}; })()`); if (closeBtn && closeBtn.rect) await shot('10b_codex_close_zoom', { x: closeBtn.rect.x, y: closeBtn.rect.y, width: closeBtn.rect.w, height: closeBtn.rect.h }); return { btn: r, open: await openThings(), closeBtn, codex: await ev(`(() => { const e=document.getElementById('bd-codex-ov')||document.getElementById('bd-codex'); if(!e) return null; return {id:e.id, text:(e.innerText||'').replace(/\\s+/g,' ').slice(0,200), cards: e.querySelectorAll('.bd-cdx-card').length}; })()`), codexFonts: await ev(fontsIn('#bd-codex-ov')) }; });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  report.notes.push({ codexClosedByEsc: (await openThings()) });
  await closeAll();
  await step('10c_equip_btn', async () => { const r = await ev(`(() => { const b=document.getElementById('bd-mb-equip'); if(!b||getComputedStyle(b).display==='none') return null; const q=b.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,text:b.innerText}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(1000); } return { btn: r, open: await openThings() }; });
  await closeAll();

  /* 플레이 중 설정 (⚙) → ESC 로 닫히는가 */
  await step('11_settings_ingame', async () => { const r = await ev(`(() => { const b=document.getElementById('bd-settings-btn'); if(!b) return 'no btn'; const q=b.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,w:Math.round(q.width),h:Math.round(q.height),cursor:getComputedStyle(b).cursor,title:b.title}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(800); } return { btn: r, modal: await ev(`(() => { const m=document.getElementById('bd-settings-modal'); if(!m) return null; const box=m.querySelector('.bd-modal-box')||m; const r=box.getBoundingClientRect(); return {show:m.classList.contains('show'), box:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, btns:[...m.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>(b.textContent||'').trim().slice(0,16)), sliders:[...m.querySelectorAll('input[type=range]')].length, text:(m.innerText||'').replace(/\\s+/g,' ').slice(0,300)}; })()`), blocked: await ev('!!(window.BD_isInputBlocked && BD_isInputBlocked())') }; }, ['#bd-settings-modal']);
  await step('11b_settings_esc', async () => { const before0 = await openThings(); await p.keyboard.press('Escape'); await p.waitForTimeout(600); const st = await openThings(); const settingsVis = await ev(`(() => { const m=document.getElementById('bd-settings-modal'); return m? {display:getComputedStyle(m).display, show:m.classList.contains('show'), h:Math.round(m.getBoundingClientRect().height), z:getComputedStyle(m).zIndex} : null; })()`); const pauseVis = await ev(`(() => { const m=document.getElementById('bd-pause-modal'); return m? {display:getComputedStyle(m).display, h:Math.round(m.getBoundingClientRect().height), z:getComputedStyle(m).zIndex} : null; })()`); return { beforeEsc: before0, afterEsc: st, settingsVis, pauseVis }; });
  await step('11c_settings_tab', async () => ({ tabSeq: await focusSeq(5) }));
  await step('11c2_settings_close_btn', async () => { const r = await ev(`(() => { const m=document.getElementById('bd-settings-modal'); const b=m&&[...m.querySelectorAll('button')].find(x=>/^닫기/.test((x.textContent||'').trim())); if(!b) return null; const q=b.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(500); } return { open: await openThings() }; });
  await closeAll();
  await step('11d_esc_pause', async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(700); return { open: await openThings(), pause: await ev(`(() => { const m=document.getElementById('bd-pause-modal'); if(!m) return null; const btns=[...m.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>({t:(b.textContent||'').trim(),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize})); return {display:getComputedStyle(m).display, btns}; })()`), tabSeq: await focusSeq(5) }; });
  await step('11e_pause_esc_again', async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); return { open: await openThings() }; });
  await closeAll();
  /* 저장하기 → 슬롯 */
  await step('11f_save_slots', async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); await ev(`(() => { const m=document.getElementById('bd-pause-modal'); const b=m&&[...m.querySelectorAll('button')].find(x=>/저장/.test(x.textContent||'')); if(b) b.click(); })()`); await p.waitForTimeout(800); return { open: await openThings(), slot: await ev(`(() => { const m=document.getElementById('modal-save-slot'); if(!m||getComputedStyle(m).display==='none') return null; const r=(m.querySelector('.modal-box,.bd-modal-box')||m).getBoundingClientRect(); return {rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, text:(m.innerText||'').replace(/\\s+/g,' ').slice(0,400), btns:[...m.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>({t:(b.textContent||'').trim().slice(0,30),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize}))}; })()`) }; }, ['#modal-save-slot']);
  await closeAll(); await p.keyboard.press('Escape'); await p.waitForTimeout(300); await closeAll();

  /* 시설 모달 */
  log('4. 시설 · 상점 · 주민 · 위험요소');
  const fac = await objAt(`o.label && /문화의집|주민센터|도서관|보건|행정|센터|학교/.test(String(o.label)) && !o.resident && !o.hazardId`);
  await step('12_facility_modal', async () => { if (!fac) return 'no facility obj'; await gotoObj(fac); await p.keyboard.press('f'); await p.waitForTimeout(800); const get = () => ev(`(() => { const m=document.getElementById('bd-district-facility-modal'); if(!m||getComputedStyle(m).display==='none') return null; const box=m.querySelector('.bd-modal-box,[class*=box]')||m; const r=box.getBoundingClientRect(); return {box:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, btns:[...m.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>({t:(b.textContent||'').trim().slice(0,24),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize,tabindex:b.tabIndex,cursor:getComputedStyle(b).cursor})), text:(m.innerText||'').replace(/\\s+/g,' ').slice(0,300)}; })()`); let m = await get(); if (!m) { await p.keyboard.press('f'); await p.waitForTimeout(800); m = await get(); } return { fac, modal: m, open: await openThings() }; }, ['#bd-district-facility-modal']);
  await step('12b_facility_tab', async () => ({ tabSeq: await focusSeq(5) }));
  await step('12c_facility_arrowkeys', async () => { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(200); return ev(`(() => { const m=document.getElementById('bd-district-facility-modal'); if(!m) return null; const f=[...m.querySelectorAll('button')].map((b,i)=>({i, focused: document.activeElement===b, cls:b.className, outline:getComputedStyle(b).outlineStyle, border:getComputedStyle(b).borderColor})); return f; })()`); });
  await closeAll(); await drain(15);

  /* 상점 */
  const shop = await objAt(`o.label && /편의점|약국|마트|슈퍼/.test(String(o.label)) && !o.resident && !o.hazardId`);
  await step('13_shop_modal', async () => { if (!shop) return 'no shop obj'; await gotoObj(shop); await p.keyboard.press('f'); await p.waitForTimeout(800); let r = await ev(`(() => { const m=document.getElementById('bd-district-facility-modal'); if(!m||getComputedStyle(m).display==='none') return {noModal:true}; const b=[...m.querySelectorAll('button')].find(x=>/구경|물건|상점|구매/.test(x.textContent||'')); const all=[...m.querySelectorAll('button')].map(x=>(x.textContent||'').trim().slice(0,16)); if(b){b.click(); return {clicked:b.textContent.trim(), all};} return {clicked:null, all}; })()`); if (r && r.noModal) { await p.keyboard.press('f'); await p.waitForTimeout(800); r = await ev(`(() => { const m=document.getElementById('bd-district-facility-modal'); if(!m||getComputedStyle(m).display==='none') return {noModal:true}; const b=[...m.querySelectorAll('button')].find(x=>/구경|물건|상점|구매/.test(x.textContent||'')); const all=[...m.querySelectorAll('button')].map(x=>(x.textContent||'').trim().slice(0,16)); if(b){b.click(); return {clicked:b.textContent.trim(), all};} return {clicked:null, all}; })()`); } await p.waitForTimeout(900); return { shop, r, shopModal: await ev(`(() => { const m=document.getElementById('bd-shop-modal'); if(!m) return null; const box=m.querySelector('.bd-modal-box')||m; const r=box.getBoundingClientRect(); const rows=[...m.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().width>2).map(x=>({t:(x.textContent||'').trim().replace(/\\s+/g,' ').slice(0,30),w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height),font:getComputedStyle(x).fontSize,disabled:x.disabled,cursor:getComputedStyle(x).cursor,tabindex:x.tabIndex})); return {show:m.classList.contains('show'), box:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, scrollH: box.scrollHeight, clientH: box.clientHeight, rows, text:(m.innerText||'').replace(/\\s+/g,' ').slice(0,400)}; })()`) }; }, ['#bd-shop-modal', '#bd-shop-close']);
  await step('13b_shop_hover_buy', async () => { const r = await ev(`(() => { const m=document.getElementById('bd-shop-modal'); if(!m) return null; const it=[...m.querySelectorAll('button')].find(x=>x.getBoundingClientRect().width>2 && /구매/.test(x.textContent)); if(!it) return null; const q=it.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,t:it.textContent.trim().slice(0,20),cursor:getComputedStyle(it).cursor,title:it.title}; })()`); if (r && r.x) { await p.mouse.move(r.x, r.y); await p.waitForTimeout(500); } return r; });
  await step('13c_shop_buy_click', async () => { const gold0 = await ev('window.BD && (BD.gold)'); const r = await ev(`(() => { const m=document.getElementById('bd-shop-modal'); const it=m&&[...m.querySelectorAll('button')].find(x=>x.getBoundingClientRect().width>2 && /구매/.test(x.textContent)); if(!it) return null; const q=it.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(900); } return { gold0, gold1: await ev('window.BD && (BD.gold)'), open: await openThings(), toast: await ev(`[...document.querySelectorAll('[id*=toast]')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2).map(x=>({id:x.id,text:x.innerText.slice(0,80),font:getComputedStyle(x).fontSize}))`) }; }, ['#bd-shop-modal', '#bd-toast', '#bd-generic-toast']);
  await step('13c2_shop_click_leak', async () => { await closeAll(); await drain(5); /* 다시 상점 열기 */ if (shop) { await gotoObj(shop); await p.keyboard.press('f'); await p.waitForTimeout(800); await ev(`(() => { const m=document.getElementById('bd-district-facility-modal'); const b=m&&[...m.querySelectorAll('button')].find(x=>/구경|물건|상점/.test(x.textContent||'')); if(b) b.click(); })()`); await p.waitForTimeout(800); } const box = await ev(`(() => { const m=document.getElementById('bd-shop-modal'); const box=m&&(m.querySelector('.bd-modal-box')||m); if(!box) return null; const q=box.getBoundingClientRect(); return {x:q.x+q.width/2, y:q.y+18, w:Math.round(q.width), h:Math.round(q.height)}; })()`); const before = await openThings(); if (box) { await p.mouse.click(box.x, box.y); await p.waitForTimeout(700); } const after = await openThings(); /* 모달 바깥(dim) 클릭 */ await p.mouse.click(60, Math.round(VH / 2)); await p.waitForTimeout(700); const afterDim = await openThings(); return { clickAt: box, before, afterHeaderClick: after, afterDimClick: afterDim, choiceText: await ev(`(document.getElementById('bd-choice')||{}).innerText`) }; }, ['#bd-shop-modal', '#bd-choice']);
  await step('13d_shop_esc', async () => { await ev(`(() => { try { if (window.__bdChoiceState && __bdChoiceState.open && typeof BD_choiceCancel==='function') BD_choiceCancel(); } catch(e){} })()`); await p.keyboard.press('Escape'); await p.waitForTimeout(500); const a = await openThings(); await p.keyboard.press('Escape'); await p.waitForTimeout(500); return { afterEsc1: a, afterEsc2: await openThings() }; });
  await closeAll(); await drain(15);

  /* 주민 대화 */
  const res = await objAt(`o.resident`);
  await step('14_resident_dialogue', async () => { if (!res) return 'no resident'; await gotoObj(res); await p.keyboard.press('f'); await p.waitForTimeout(700); if (!(await isDialogueOpen())) { await p.keyboard.press('f'); await p.waitForTimeout(700); } return { res, dlg: await ev(`(() => { const t=document.getElementById('dialogue-text'); const n=document.getElementById('dialogue-name'); const po=document.getElementById('dialogue-portrait'); return {name:n?n.textContent:null, text:t?t.textContent.slice(0,100):null, font:t?getComputedStyle(t).fontSize:null, portrait:po?{x:Math.round(po.getBoundingClientRect().x),w:Math.round(po.getBoundingClientRect().width),h:Math.round(po.getBoundingClientRect().height),display:getComputedStyle(po).display}:null}; })()`) }; }, HUD.concat(['#bd-choice-pop']));
  /* 마우스 클릭으로 주민 대화 넘기기 */
  await step('14b_resident_click_advance', async () => { const before = await ev(`(document.getElementById('dialogue-text')||{}).textContent`); await p.mouse.click(Math.round(VW / 2), Math.round(VH * 0.9)); await p.waitForTimeout(600); const after = await ev(`(document.getElementById('dialogue-text')||{}).textContent`); return { advancedByClickOnBox: before !== after, choice: await ev(`(() => { const c=document.getElementById('bd-choice-pop'); return c? {text:(c.innerText||'').replace(/\\s+/g,' ').slice(0,200)} : null; })()`) }; }, ['#bd-choice-pop', '#dialogue-box']);
  await drain(30); await closeAll();

  /* 위험요소: 튜토리얼 쓰레기부터 (게이트 tuto) */
  const hz = await objAt(`o.hazardId === 'ow212_trash_1'`) || await objAt(`o.hazardId && !o.isBoss`);
  const CHOICE_SELS = ['#bd-choice-pop', '#bd-choice', '#dialogue-box'];
  await step('15_hazard_choice', async () => { if (!hz) return 'no hazard'; await gotoObj(hz); await p.keyboard.press('f'); await p.waitForTimeout(800); for (let i = 0; i < 12; i++) { const st = await openThings(); if (st.c) break; if (st.d) { await p.keyboard.press(' '); } else { await p.keyboard.press('f'); } await p.waitForTimeout(500); } return { hz, gate: await ev(`(() => { try { const o=(STAGES[currentStage].objects||[]).find(x=>x&&x.hazardId===${JSON.stringify(hz.hazardId)}); return window.BD_hzQuestGate? BD_hzQuestGate(o): 'n/a'; } catch(e){ return String(e); } })()`), choice: await ev(`(() => { const root=document.getElementById('bd-choice'); if(!root) return null; const rows=[...root.querySelectorAll('.bd-choice-row')].map(b=>({t:b.textContent.trim().slice(0,20),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize,cursor:getComputedStyle(b).cursor,tabindex:b.tabIndex,sel:b.className})); const r=root.getBoundingClientRect(); return {rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, rows, text:(root.innerText||'').replace(/\\s+/g,' ').slice(0,200), bg:getComputedStyle(root).backgroundColor, idx: window.__bdChoiceState&&__bdChoiceState.idx}; })()`) }; }, CHOICE_SELS);
  /* 선택 UI: 화살표 키 / 마우스 hover */
  await step('15b_choice_arrow_hover', async () => { await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250); const afterArrow = await ev(`(() => ({idx: window.__bdChoiceState&&__bdChoiceState.idx, rows:[...document.querySelectorAll('#bd-choice .bd-choice-row')].map(x=>x.className)}))()`); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(200); const r = await ev(`(() => { const el=[...document.querySelectorAll('#bd-choice .bd-choice-row')].find(x=>/지나간다/.test(x.textContent||'')); if(!el) return null; const q=el.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2, cursor:getComputedStyle(el).cursor}; })()`); if (r && r.x) { await p.mouse.move(r.x, r.y); await p.waitForTimeout(400); } return { afterArrow, hoverTarget: r, afterHover: await ev(`(() => ({idx: window.__bdChoiceState&&__bdChoiceState.idx}))()`) }; }, CHOICE_SELS);
  /* 조사한다 → 마우스 클릭 */
  let battle = false;
  for (let k = 0; k < 20 && !battle; k++) {
    const st = await ev(`(() => { const c=document.getElementById('bd-choice'); return {choice: !!(c && getComputedStyle(c).display!=='none' && c.getBoundingClientRect().height>2) || !!(window.__bdChoiceState&&__bdChoiceState.open), battle: !!(window.HSR&&HSR.active), dlg: !!document.getElementById('dialogue-box')&&document.getElementById('dialogue-box').getBoundingClientRect().height>0}; })()`);
    if (st.battle) { battle = true; break; }
    if (st.choice) { const r = await ev(`(() => { const root=document.getElementById('bd-choice'); const el=[...root.querySelectorAll('.bd-choice-row')].find(x=>/조사/.test(x.textContent||'')); if(!el) return null; const q=el.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2}; })()`); if (r && r.x) { await p.mouse.click(r.x, r.y); await p.waitForTimeout(900); const st2 = await ev(`!!(window.__bdChoiceState&&__bdChoiceState.open)`); report.notes.push({ choiceMouseClick: { at: r, stillOpen: st2 } }); if (st2) await p.keyboard.press('Enter'); } else await p.keyboard.press('Enter'); await p.waitForTimeout(700); continue; }
    if (st.dlg) { await p.keyboard.press(' '); await p.waitForTimeout(400); continue; }
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(1800);
  const HSR_SELS = ['#hsr-battle', '#hsr-arena', '#hsr-cmd', '#hsr-hero-hptext', '#hsr-enemy-hptext', '#hsr-enemy-lv', '#hsr-u-hero', '#hsr-u-enemy', '#hsr-skill-menu', '#hsr-item-menu', '#hsr-result', '#hsr-result-title', '#hsr-result-btn'];
  const hsrDump = () => ev(`(() => { const H=window.HSR; if(!H) return null; const cmd=document.getElementById('hsr-cmd'); const btns=cmd?[...cmd.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>2).map(b=>({t:b.textContent.trim().slice(0,14),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize,disabled:b.disabled,tabindex:b.tabIndex,cursor:getComputedStyle(b).cursor})):[]; const vis=[...document.querySelectorAll('#hsr-battle *')].filter(x=>x.id&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2).map(x=>x.id).slice(0,40); return {active:H.active, state:H.state, turnOwner:H.turnOwner, btns, enemy: H.enemy? {name:H.enemy.name, hp:H.enemy.hp, max:H.enemy.maxHp||H.enemy.hpMax||H.enemy.max} : null, hero: H.hero? {hp:H.hero.hp} : null, visIds: vis, text:(document.getElementById('hsr-battle')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,300)}; })()`);
  await step('16_battle', async () => ({ battle, hsr: await hsrDump(), hsrFonts: await ev(fontsIn('#hsr-battle')) }), HSR_SELS);
  if (battle) {
    const actClick = async (re) => { const r = await ev(`(() => { const el=[...document.querySelectorAll('#hsr-actions .hsr-act, #hsr-actions > div, #hsr-actions button')].find(x=>${re}.test(x.textContent||'')); if(!el) return null; const q=el.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,t:(x=>x.textContent.trim().slice(0,20))(el),w:Math.round(q.width),h:Math.round(q.height),cursor:getComputedStyle(el).cursor,tag:el.tagName,tabindex:el.tabIndex}; })()`); if (r && r.x) await p.mouse.click(r.x, r.y); return r; };
    const overlays = () => ev(`[...document.querySelectorAll('body > *')].filter(x=>x.id&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&x.getBoundingClientRect().width>120&&getComputedStyle(x).position==='fixed'&&!/canvas|game-screen|particles|bd-hp-dom|bd-keybar|^modal-|bd-menu-btns|bd-settings-btn|bd-quest-hud|bd-dami|bd-fullscreen|bd-district-minimap|bd-toast|bd-generic|bd-interact|bd-locked|bd-guide/.test(x.id)).map(x=>({id:x.id,text:(x.innerText||'').replace(/\\s+/g,' ').slice(0,160),z:getComputedStyle(x).zIndex}))`);
    /* ESC = 물러나기 프롬프트 */
    await step('16a_battle_esc', async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(700); const o = await overlays(); const st = await openThings(); const cancel = await ev(`(() => { const c=document.getElementById('bd-choice'); const rows=c?[...c.querySelectorAll('.bd-choice-row')]:[]; const b=rows.find(x=>/취소|계속|아니|싸운다|남는다/.test(x.textContent||''))||[...document.querySelectorAll('.bd-modal.show button, [id*=flee] button')].find(x=>/취소|계속|아니/.test(x.textContent||'')); if(b){ b.click(); return b.textContent.trim(); } return null; })()`); await p.waitForTimeout(600); return { overlaysAfterEsc: o, open: st, cancelClicked: cancel, hsrActive: await ev('!!(window.HSR&&HSR.active)') }; }, HSR_SELS);
    if (!(await ev('!!(window.HSR&&HSR.active)'))) { await p.keyboard.press('Escape'); await p.waitForTimeout(500); }
    await step('16b_battle_attack', async () => { const r = await actClick('/정화 스티커/'); await p.waitForTimeout(600); return { clicked: r, overlays: await overlays(), hsr: await hsrDump(), ring: await ev(`(() => { const cands=[...document.querySelectorAll('body *')].filter(x=>x.id&&/ring|timing|qte|mini|gauge/i.test(x.id)&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>2).map(x=>({id:x.id,rect:(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(x.getBoundingClientRect()),text:(x.innerText||'').replace(/\\s+/g,' ').slice(0,80)})); return cands.slice(0,10); })()`) }; }, HSR_SELS);
    await p.waitForTimeout(500);
    await step('16c_battle_minigame', async () => ({ overlays: await overlays(), hsr: await hsrDump(), hint: await ev(`(() => { const t=[...document.querySelectorAll('body *')].filter(x=>x.children.length<3&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().width>2&&/Space|스페이스|클릭|누르|타이밍/.test(x.innerText||'')).map(x=>({id:x.id,cls:(x.className||'').toString().slice(0,30),text:x.innerText.slice(0,80),font:getComputedStyle(x).fontSize})); return t.slice(0,8); })()`) }), HSR_SELS);
    for (let i = 0; i < 4; i++) { await p.keyboard.press(' '); await p.waitForTimeout(350); }
    await p.waitForTimeout(2500);
    await step('16d_battle_after_turn', async () => ({ hsr: await hsrDump(), overlays: await overlays() }), HSR_SELS);
    await step('16e_battle_mouse_only', async () => { const hp0 = await ev('HSR.enemy&&HSR.enemy.hp'); for (let t = 0; t < 12; t++) { const st = await ev('HSR.state'); if (st === 'player') break; await p.waitForTimeout(500); } const r = await actClick('/정화 스티커/'); await p.waitForTimeout(700); for (let i = 0; i < 4; i++) { await p.mouse.click(Math.round(VW / 2), Math.round(VH / 2)); await p.waitForTimeout(350); } await p.waitForTimeout(2500); return { clicked: r, hp0, hp1: await ev('HSR.enemy&&HSR.enemy.hp'), state: await ev('HSR.state') }; }, HSR_SELS);
    await ev(`(() => { try { if (HSR.enemy) { HSR.enemy.hp = 1; } } catch(e){} })()`);
    let result = false;
    for (let i = 0; i < 10 && !result; i++) {
      const st = await ev(`(() => ({active: !!(window.HSR&&HSR.active), state: HSR.state, result: (()=>{const r=document.getElementById('hsr-result'); return !!(r && getComputedStyle(r).display!=='none' && r.getBoundingClientRect().height>2);})()}))()`);
      if (st.result || !st.active) { result = true; break; }
      if (st.state === 'player') { await actClick('/정화 스티커/'); await p.waitForTimeout(600); for (let j = 0; j < 4; j++) { await p.keyboard.press(' '); await p.waitForTimeout(350); } }
      await p.waitForTimeout(1500);
    }
    await step('17_battle_result', async () => ev(`(() => { const r=document.getElementById('hsr-result'); const t=document.getElementById('hsr-result-title'); const b=document.getElementById('hsr-result-btn'); return {resultShown: !!(r && getComputedStyle(r).display!=='none' && r.getBoundingClientRect().height>2), title:t?t.textContent:null, btn:b?{t:b.textContent.trim(),w:Math.round(b.getBoundingClientRect().width),h:Math.round(b.getBoundingClientRect().height),font:getComputedStyle(b).fontSize,tabindex:b.tabIndex, focused: document.activeElement===b}:null, text:r?(r.innerText||'').replace(/\\s+/g,' ').slice(0,400):null, active: !!(window.HSR&&HSR.active), state: HSR.state}; })()`), HSR_SELS);
    await step('17b_result_enter', async () => { await p.keyboard.press('Enter'); await p.waitForTimeout(900); const shown = await ev(`(() => { const r=document.getElementById('hsr-result'); return !!(r && getComputedStyle(r).display!=='none' && r.getBoundingClientRect().height>2); })()`); if (shown) { await ev(`(() => { const b=document.getElementById('hsr-result-btn'); if(b) b.click(); })()`); await p.waitForTimeout(900); } return { closedByEnter: !shown, active: await ev('!!(window.HSR&&HSR.active)') }; });
    for (let t = 0; t < 20; t++) { if (!(await ev('!!(window.HSR&&HSR.active)'))) break; await p.keyboard.press(' '); await p.waitForTimeout(600); }
    report.notes.push({ battleEndedActive: await ev('!!(window.HSR&&HSR.active)') });
    await step('17c_after_result', async () => ev(`(() => { const vis=[...document.querySelectorAll('body > *')].filter(x=>x.id&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&!/canvas|game-screen|particles/.test(x.id)&&getComputedStyle(x).position==='fixed').map(x=>({id:x.id,text:(x.innerText||'').replace(/\\s+/g,' ').slice(0,80),font:getComputedStyle(x).fontSize})); return {visibleTop:vis.slice(0,25), hp: window.BD&&BD.hp, lv: window.BD&&(BD.level||BD.lv), xp: window.BD&&BD.xp}; })()`), HUD.concat(['#bd-toast', '#bd-generic-toast', '#hsr-result']));
    await p.waitForTimeout(1500);
    await step('17d_after_result_2s', async () => ({ open: await openThings(), toasts: await ev(`[...document.querySelectorAll('[id*=toast],[class*=toast],[id*=levelup],[class*=levelup]')].filter(x=>getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2).map(x=>({id:x.id,cls:x.className.toString().slice(0,30),text:x.innerText.slice(0,80),font:getComputedStyle(x).fontSize,rect:(r=>({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(x.getBoundingClientRect())}))`) }), HUD);
    await drain(30);
  }
  await closeAll(); await drain(10);

  /* ═════ 마우스 전용 ═════ */
  log('5. 마우스 전용 / 키보드 전용');
  report.notes.push({ hsrActiveBeforeMouseTests: await ev('!!(window.HSR&&HSR.active)') });
  await ev(`(() => { try { if (window.HSR && HSR.active && typeof HSR_end === 'function') HSR_end(false); } catch(e){} })()`);
  await step('18_mouse_click_to_move', async () => { const before = await ev('[heroX,heroY]'); await p.mouse.click(Math.round(VW / 2 + 350), Math.round(VH / 2)); await p.waitForTimeout(1500); const after = await ev('[heroX,heroY]'); return { before, after, moved: before && after && (Math.abs(before[0] - after[0]) + Math.abs(before[1] - after[1])) > 0.003, travel: await ev(`(() => { try { return { hasTravel: !!window.BD_TRAVEL, coarse: matchMedia('(pointer: coarse)').matches }; } catch(e) { return String(e); } })()`), canvasCursor: await ev(`getComputedStyle(document.getElementById('game-canvas')).cursor`) }; }, HUD);
  await step('18b_mouse_click_npc', async () => { if (!res) return 'no resident'; await gotoObj(res, 0.05); await p.waitForTimeout(400); const sp = await ev(`(() => { try { const cv=document.getElementById('game-canvas'); const r=cv.getBoundingClientRect(); const o=(STAGES[currentStage].objects||[]).find(x=>x&&x.resident); const mx=o.rx+o.rw/2, my=o.ry+o.rh/2; const px=(((mx-camX)/VIEWPORT_W+.5)*BASE_W-BASE_W/2)*currentScale+cv.width/2; const py=(((my-camY)/VIEWPORT_H+.5)*BASE_H-BASE_H/2)*currentScale+cv.height/2; return {x:r.x+px*(r.width/cv.width), y:r.y+py*(r.height/cv.height)}; } catch(e){ return {err:String(e)}; } })()`); if (!sp || !sp.x) return { sp }; await p.mouse.move(sp.x, sp.y); await p.waitForTimeout(600); const cursor = await ev(`getComputedStyle(document.elementFromPoint(${Math.round(sp.x)},${Math.round(sp.y)})).cursor`); const hoverEls = await ev(`[...document.querySelectorAll('body > *')].filter(x=>x.id&&getComputedStyle(x).display!=='none'&&x.getBoundingClientRect().height>2&&/tooltip|hint|label/i.test(x.id)).map(x=>({id:x.id,text:x.innerText.slice(0,40)}))`); const dBefore = await isDialogueOpen(); await p.mouse.click(sp.x, sp.y); await p.waitForTimeout(800); const dAfter = await isDialogueOpen(); await p.mouse.dblclick(sp.x, sp.y); await p.waitForTimeout(800); const dAfter2 = await isDialogueOpen(); return { screenPos: { x: Math.round(sp.x), y: Math.round(sp.y) }, cursorOverNpc: cursor, hoverEls, dialogueBefore: dBefore, dialogueAfterClick: dAfter, dialogueAfterDblClick: dAfter2 }; }, HUD);
  await drain(20); await closeAll();
  await step('18c_mouse_hud_click', async () => { const out = {}; for (const id of ['bd-district-minimap', 'bd-hp-dom', '__tracker_probe', 'bd-worry', 'bd-goal-down']) { const r = await ev(`(() => { const el=document.getElementById('${id}'); if(!el||getComputedStyle(el).display==='none'||el.getBoundingClientRect().width<2) return null; const q=el.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,cursor:getComputedStyle(el).cursor,title:el.title,onclick:!!el.onclick}; })()`); if (!r) { out[id] = null; continue; } await p.mouse.click(r.x, r.y); await p.waitForTimeout(700); out[id] = { cursor: r.cursor, title: r.title, opened: await openThings() }; await closeAll(); } return out; });
  await step('18d_mouse_hover_top_buttons', async () => { const out = []; for (const id of ['bd-codex-btn', 'bd-mb-equip', 'bd-mb-map', 'bd-settings-btn']) { const r = await ev(`(() => { const el=document.getElementById('${id}'); if(!el||getComputedStyle(el).display==='none') return null; const q=el.getBoundingClientRect(); return {x:q.x+q.width/2,y:q.y+q.height/2,title:el.title,aria:el.getAttribute('aria-label'),text:el.innerText}; })()`); if (!r) { out.push({ id, missing: true }); continue; } await p.mouse.move(r.x, r.y); await p.waitForTimeout(500); out.push({ id, title: r.title, aria: r.aria, text: r.text }); } return out; });

  /* ═════ UI 크기 130% 필드 ═════ */
  await step('19_uiscale_130_field', async () => { await ev(`(() => { try { BD_openTitleOptions(); } catch(e){} })()`); await p.waitForTimeout(500); await ev(`(() => { const m=document.getElementById('bd-settings-modal'); const b=m&&[...m.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='130%'); if(b) b.click(); })()`); await p.waitForTimeout(500); await closeAll(); await p.waitForTimeout(1500); return { zoom: await ev(`getComputedStyle(document.body).zoom`), ls: await ev(`localStorage.getItem('bd_ui_scale_v353')`), hud: await ev(`(() => { const ids=['bd-hp-dom','bd-keybar','bd-settings-btn','bd-district-minimap','bd-codex-btn','bd-mb-map','__tracker_probe']; const out={}; for(const id of ids){const el=document.getElementById(id); if(!el||getComputedStyle(el).display==='none') continue; const q=el.getBoundingClientRect(); out[id]={x:Math.round(q.x),y:Math.round(q.y),w:Math.round(q.width),h:Math.round(q.height),right:Math.round(q.right),bottom:Math.round(q.bottom)};} const cv=document.getElementById('game-canvas').getBoundingClientRect(); return {vw:innerWidth,vh:innerHeight,hud:out,canvas:{w:Math.round(cv.width),h:Math.round(cv.height)}}; })()`) }; }, HUD);
  await ev(`(() => { try { BD_openTitleOptions(); } catch(e){} })()`); await p.waitForTimeout(400); await ev(`(() => { const m=document.getElementById('bd-settings-modal'); const b=m&&[...m.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='자동'); if(b) b.click(); })()`); await p.waitForTimeout(300); await closeAll();

  /* ═════ 리사이즈 ═════ */
  log('6. 리사이즈');
  for (const [w, h] of [[1366, 768], [1280, 720], [2560, 1080], [1024, 600], [VW, VH]]) {
    try { await p.setViewportSize({ width: w, height: h }); } catch (e) { report.notes.push({ resizeError: String(e.message).slice(0, 120) }); break; }
    await p.waitForTimeout(1300);
    await step('20_resize_' + w + 'x' + h, async () => ev(`(() => { const cv=document.getElementById('game-canvas'); const r=cv.getBoundingClientRect(); const bz=parseFloat(getComputedStyle(document.body).zoom)||1; const letter={left:Math.round(r.x),right:Math.round(innerWidth-r.right),top:Math.round(r.y),bottom:Math.round(innerHeight-r.bottom)}; const ids=['bd-hp-dom','bd-keybar','bd-settings-btn','bd-district-minimap','bd-codex-btn','bd-mb-map','__tracker_probe','bd-dami-field-bubble']; const hud={}; for(const id of ids){const el=document.getElementById(id); if(!el||getComputedStyle(el).display==='none') continue; const q=el.getBoundingClientRect(); hud[id]={x:Math.round(q.x),y:Math.round(q.y),w:Math.round(q.width),h:Math.round(q.height)};} return {vw:innerWidth,vh:innerHeight,bodyZoom:bz,html:document.documentElement.className.slice(0,80),canvas:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bw:cv.width,bh:cv.height,aspect:+(r.width/r.height).toFixed(3)},letterbox:letter,scrollH:document.documentElement.scrollHeight,scrollW:document.documentElement.scrollWidth,hud, VIEWPORT_W:(typeof VIEWPORT_W!=='undefined')?VIEWPORT_W:undefined, VIEWPORT_H:(typeof VIEWPORT_H!=='undefined')?VIEWPORT_H:undefined, currentScale:(typeof currentScale!=='undefined')?currentScale:undefined}; })()`), HUD);
  }

  /* ═════ 성능 20초 ═════ */
  log('7. 성능');
  /* gameLoop 본체 소요 시간 측정 래퍼 */
  const wrapped = await ev(`(() => { try { if (typeof gameLoop !== 'function') return 'no gameLoop'; const orig = gameLoop; window.__auditLoopMs = []; window.gameLoop = function (a) { const t = performance.now(); const r = orig.apply(this, arguments); window.__auditLoopMs.push(performance.now() - t); return r; }; return typeof gameLoop === 'function' && gameLoop !== orig ? 'wrapped' : 'not-rebindable'; } catch (e) { return String(e); } })()`);
  report.notes.push({ loopWrap: wrapped });
  const idle = await p.evaluate(async (ms) => { const gaps = []; let last = performance.now(); const t0 = last; await new Promise(res => { function tick(now) { gaps.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(tick); else res(); } requestAnimationFrame(tick); }); const g = gaps.slice(1); const srt = g.slice().sort((a, b) => a - b); const lm = (window.__auditLoopMs || []).slice(); window.__auditLoopMs = []; const ls = lm.slice().sort((a, b) => a - b); return { fps: +(g.length / ((performance.now() - t0) / 1000)).toFixed(1), p50: +srt[Math.floor(srt.length / 2)].toFixed(1), loopCalls: lm.length, loopP50: ls.length ? +ls[Math.floor(ls.length / 2)].toFixed(2) : null, loopP95: ls.length ? +ls[Math.floor(ls.length * .95)].toFixed(2) : null, loopMax: ls.length ? +ls[ls.length - 1].toFixed(1) : null }; }, 5000);
  report.perfIdle = idle; log('  idle 5s: ' + JSON.stringify(idle));
  const perfP = p.evaluate(async (ms) => {
    const gaps = []; let last = performance.now(); const t0 = last; let longTasks = 0, longMax = 0;
    let po = null; try { po = new PerformanceObserver(l => { l.getEntries().forEach(e => { longTasks++; longMax = Math.max(longMax, e.duration); }); }); po.observe({ entryTypes: ['longtask'] }); } catch (e) {}
    await new Promise(res => { function tick(now) { gaps.push(now - last); last = now; if (now - t0 < ms) requestAnimationFrame(tick); else res(); } requestAnimationFrame(tick); setTimeout(res, ms + 3000); });
    if (po) po.disconnect();
    const el = performance.now() - t0; const g = gaps.slice(1); const srt = g.slice().sort((a, b) => a - b); const q = x => srt.length ? srt[Math.min(srt.length - 1, Math.floor(srt.length * x))] : 0;
    const cv = document.getElementById('game-canvas');
    const lm = (window.__auditLoopMs || []).slice(); const ls = lm.slice().sort((a, b) => a - b);
    return { seconds: +(el / 1000).toFixed(1), frames: g.length, fps: +(g.length / (el / 1000)).toFixed(1), p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), p99: +q(.99).toFixed(1), worst: +(srt[srt.length - 1] || 0).toFixed(1), jank33: g.filter(x => x > 33).length, jank100: g.filter(x => x > 100).length, longTasks, longMax: Math.round(longMax), loopCalls: lm.length, loopP50: ls.length ? +ls[Math.floor(ls.length / 2)].toFixed(2) : null, loopP95: ls.length ? +ls[Math.floor(ls.length * .95)].toFixed(2) : null, loopMax: ls.length ? +ls[ls.length - 1].toFixed(1) : null, canvas: cv ? cv.width + 'x' + cv.height : '-', heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, bdPerf: window.__bdPerf || null, dpr: devicePixelRatio, stage: currentStage };
  }, 20000);
  for (let i = 0; i < 4; i++) { for (const k of ['d', 's', 'a', 'w']) { await p.keyboard.down(k); await p.waitForTimeout(1200); await p.keyboard.up(k); } }
  const perf = await perfP;
  report.perf = perf;
  log('  perf: ' + JSON.stringify(perf));
  await shot('21_perf_end');

  await c.close(); await browser.close();
  const rf = path.join(SHOTS, 'report_' + SIZE + (NOFS ? '' : '_fs') + '.json');
  fs.writeFileSync(rf, JSON.stringify(report, null, 1));
  log('보고: ' + rf + '  콘솔 오류/경고 ' + report.console.length);
}
main().catch(e => { console.error('FATAL', e); fs.writeFileSync(path.join(SHOTS, 'report_' + SIZE + (NOFS ? '' : '_fs') + '_partial.json'), JSON.stringify(report, null, 1)); process.exit(1); });
