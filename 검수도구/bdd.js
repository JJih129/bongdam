// 봉담지킴이 검수 데몬 — 게임을 한 번 띄워 두고 HTTP로 명령을 받는다 (bd.js가 클라이언트)
// 사용: node bdd.js [--headed] [--url=file:///...] [--port=47811]
// 게임 파일은 손대지 않는다. lib.js / auto.js / path.js 를 그대로 재사용.
const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const urlArg = args.find(a => a.startsWith('--url='));
const portArg = args.find(a => a.startsWith('--port='));
const GAME = urlArg ? urlArg.slice(6) : 'file:///D:/봉담/봉담지킴이_게시용_v338_final.html';
const PORT = portArg ? Number(portArg.slice(7)) : Number(process.env.BDD_PORT || 47811);
const SHOTS = path.join(__dirname, process.env.SHOTS_DIR || 'shots_bd');
const SNAPS = path.join(__dirname, 'snaps');
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(SNAPS, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: !headed, args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const VW = Number(process.env.VW || 1280), VH = Number(process.env.VH || 800);
  const TOUCH = process.env.TOUCH === '1';
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, hasTouch: TOUCH, isMobile: false, userAgent: TOUCH ? 'Mozilla/5.0 (Linux; Android 13; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36' : undefined });
  const page = await ctx.newPage();
  // ── 결정론 모드 (BDD_DET=1): 게임 파일 무수정 — Playwright 가상 시계 + 시드 RNG 주입 ──
  //    Date/setTimeout/setInterval/RAF/performance 가 가상 시간으로만 흐르고, h.wait(ms)=clock.runFor(ms).
  //    같은 명령 순서 → 같은 결과. 실시간 대기가 사라져 프로브도 빨라진다.
  const DET = process.env.BDD_DET === '1';
  const SEED = Number(process.env.BDD_SEED || 20260814);
  const T0 = new Date('2026-08-14T10:00:00+09:00');
  if (DET) {
    await ctx.addInitScript((seed) => {
      let s = seed >>> 0;                                   // mulberry32
      Math.random = function () { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      window.__bdSeed = seed;
    }, SEED);
    await page.clock.install({ time: T0 });
    await page.clock.pauseAt(new Date(T0.getTime() + 1000));   // 로드 전부터 정지 — 부팅 타이머도 runFor 로만 흐른다
  }
  const consoleErrors = [], consoleAll = [];
  page.on('console', m => { const t = `[${m.type()}] ${m.text()}`; consoleAll.push(t); if (consoleAll.length > 4000) consoleAll.shift(); if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  let log = [];
  const say = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); log.push(s); if (log.length > 500) log.shift(); };
  const h = {
    page, say, SHOTS, consoleErrors, consoleAll,
    async shot(name) { const p = path.join(SHOTS, (name || 'shot').replace(/\.png$/, '') + '.png'); await page.screenshot({ path: p }); say('📸 ' + path.basename(p)); return p; },
    async state() { return await page.evaluate(() => { try { return JSON.parse(window.render_game_to_text()); } catch (e) { return { error: String(e) }; } }); },
    async adv(ms) { await page.evaluate(m => { try { window.advanceTime && window.advanceTime(m); } catch (e) { } }, ms); },
    async wait(ms) { if (DET && loaded) await page.clock.runFor(Math.max(1, Math.round(ms))); else await page.waitForTimeout(ms); },
    async key(k, n = 1, delay = 60) { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await h.wait(delay); } },
    async hold(k, ms) { await page.keyboard.down(k); await h.wait(ms); await page.keyboard.up(k); },
    async click(sel) { await page.click(sel, { timeout: 3000 }); },
  };
  const L = require('./lib')(h);
  const A = require('./auto')(h, L);
  const P = A.P;

  let loaded = false;
  // src/ 가 빌드 HTML 보다 새로우면 자동 bundle (훅 누락 방어) — 기본 빌드를 열 때만
  const autoBundle = () => {
    try {
      const HTML = 'D:/봉담/봉담지킴이_게시용_v338_final.html', SRCD = 'D:/봉담/src';
      if (!(GAME.endsWith('/봉담지킴이_게시용_v338_final.html') || GAME.endsWith('/%EB%B4%89%EB%8B%B4%EC%A7%80%ED%82%B4%EC%9D%B4_%EA%B2%8C%EC%8B%9C%EC%9A%A9_v338_final.html'))) return null;
      const hm = fs.statSync(HTML).mtimeMs;
      let newest = 0, nf = null;
      const scan = d => { for (const f of fs.readdirSync(d)) { const p = d + '/' + f; const st = fs.statSync(p); if (st.isDirectory()) { if (f !== 'assets') scan(p); } else if (st.mtimeMs > newest) { newest = st.mtimeMs; nf = p; } } };
      scan(SRCD);
      if (newest > hm + 500) {
        require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'tools', 'bundle.js'), SRCD, HTML], { stdio: 'ignore' });
        return 'src가 더 새로워 자동 bundle: ' + path.basename(nf);
      }
    } catch (e) { return 'autoBundle 실패: ' + e.message; }
    return null;
  };
  const open = async (url) => {
    const t0 = Date.now();
    loaded = false;
    const ab = (!url || url === GAME) ? autoBundle() : null; if (ab) say(ab);
    await page.goto(url || GAME, { waitUntil: 'load', timeout: 180000 });
    if (DET) { loaded = true; await h.wait(2500); }   // 정지된 시계 → runFor 로 부팅 타이머 소화
    else { await page.waitForTimeout(2000); loaded = true; }
    return { loadedIn: ((Date.now() - t0) / 1000).toFixed(1) + 's', det: DET, seed: DET ? SEED : null };
  };

  // ── 공통 원시 동작 ─────────────────────────────────────────
  const dlgOpen = () => page.evaluate(() => { const x = document.getElementById('dialogue-box'); return !!(x && x.getBoundingClientRect().height > 0); });
  const startSetup = async (char) => {
    await page.click('#bd-title-start', { timeout: 5000 }); await h.wait(1200);
    for (let t = 0; t < 20; t++) {
      const st = await page.evaluate((c) => {
        const m = document.getElementById('bd-startsetup-modal');
        if (m && m.classList.contains('show')) { try { BD_pickStartChar(c); BD_confirmStartSetup(); } catch (e) { } return true; }
        return false;
      }, char);
      if (!st && t > 2) break;
      await h.wait(500);
    }
    await h.wait(2000);
  };
  const setFlags = (flags) => page.evaluate((fl) => { fl.forEach(k => localStorage.setItem(k, '1')); }, flags);
  const TUT_FLAGS = ['bd_dami_awake', 'bd_tut2_done', 'bd_dami_tutorial_done', 'bd_battle_tutorial_done', 'bd_shop_tutorial_done_v75', 'bd_map_tuto_done'];
  const waitOpening = async (ms = 45000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const busy = await page.evaluate(() => !!(window.__bdDamiOpeningBusy || window.__bdDamiIntroBusy));
      if (!busy) return true;
      await page.keyboard.press(' '); await h.wait(500);
    }
    return false;
  };
  const findObj = (q) => page.evaluate((q) => {
    const st = STAGES[currentStage]; const list = (st.objects || []).filter(o => o && !o.hidden);
    const norm = s => String(s || '').replace(/\s+/g, '');
    const hit = list.find(o => o.hazardId === q || o.id === q) || list.find(o => norm(o.label).includes(norm(q)) || norm(o.name).includes(norm(q)) || norm(o.hazardId).includes(norm(q)));
    if (!hit) return null;
    return { label: hit.label || hit.name, hazardId: hit.hazardId, resident: !!hit.resident, type: hit.type, rx: hit.rx, ry: hit.ry, rw: hit.rw || 0.04, rh: hit.rh || 0.06, purified: !!(BD.purified || {})[hit.hazardId] };
  }, q);
  const gotoObj = async (o, walk) => {
    const ax = o.rx + o.rw / 2, ay = o.ry + o.rh + 0.012;
    if (walk) { await P.install(); const mv = await P.walk(ax, ay, L); if (mv.ok) return { walked: true }; say('도보 실패 ' + mv.reason + ' → 텔레포트'); }
    await page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [ax, ay]);
    await h.wait(300);
    return { walked: false };
  };
  const confirmChoiceToBattle = async (max = 16) => {
    for (let k = 0; k < max; k++) {
      const st = await page.evaluate(() => ({ b: !!(window.HSR && HSR.active), c: !!(window.__bdChoiceState && __bdChoiceState.open) }));
      if (st.b) return 'battle';
      if (st.c) { await h.wait(430); await page.keyboard.press('Enter'); await h.wait(450); continue; }
      if (await dlgOpen()) { await page.keyboard.press(' '); await h.wait(380); continue; }
      await h.wait(300);
    }
    return 'no-battle';
  };

  // ── 명령 테이블 ────────────────────────────────────────────
  const CMD = {
    async help() { return { cmds: Object.keys(CMD) }; },
    async status() { return { loaded, det: DET, seed: DET ? SEED : null, url: GAME, port: PORT, errors: consoleErrors.length, shots: SHOTS }; },
    // adv: 가상 시간 전진(결정론 모드) / 실시간 대기(일반 모드)
    async adv(a) { await h.wait(Number(a.ms || 1000)); return { now: await page.evaluate(() => Date.now()), probe: await A.probe() }; },
    async open(a) { return await open(a.url); },
    async reload() { return await open(); },
    // boot: 타이틀→캐릭터→(옵션)튜토 격리→(옵션)스테이지 이동. skip=1이면 튜토 플래그 5종 설정
    async boot(a) {
      if (!loaded) await open();
      await startSetup(Number(a.char || 1));
      // 실제 필드 진입(프롤로그 101 등, stage>=100)까지 대기 — 시작 시퀀스는 에셋 디코드 등 비가상 비동기를 포함
      for (let t = 0; t < 120; t++) {
        const s = await page.evaluate(() => { try { return Number(currentStage); } catch (e) { return 0; } });
        if (s >= 100) break;
        await h.wait(300);
      }
      if (a.skip) { await setFlags(TUT_FLAGS); }
      if (a.to) {
        await page.evaluate(([s, x, y]) => fadeToStage(Number(s), Number(x), Number(y)), [a.to, a.x || 0.5, a.y || 0.5]);
        await h.wait(1500);
      }
      if (a.drain !== 0) await A.advance(30);
      if (a.opening) await waitOpening();
      return await A.probe();
    },
    async state() { return await h.state(); },
    async probe() { return await A.probe(); },
    async blocked() { return await L.blocked(); },
    async battleinfo() { return await A.battleInfo(); },
    // eval: 표현식이면 그 값을, 문장(세미콜론/return 으로 시작)이면 그대로 실행 (문장은 return 필요)
    async eval(a) {
      let js = String(a.js || '').trim();
      const isStmt = /^\s*(return|const|let|var|if|for|while|try)\b/.test(js) || /;\s*\S/.test(js);
      if (isStmt && !/\breturn\b/.test(js)) {   // 문장열이면 마지막 표현식을 자동 return
        const i = js.lastIndexOf(';'); const head = js.slice(0, i + 1), last = js.slice(i + 1).trim().replace(/;$/, '');
        js = last ? head + ' return (' + last + ');' : head;
      }
      return await page.evaluate(new Function('return (async()=>{' + (isStmt ? js : 'return (' + js + ')') + '})()'));
    },
    async click(a) { await page.mouse.click(Number(a.x), Number(a.y)); await h.wait(Number(a.wait || 300)); return { ok: true }; },
    async press(a) { await L.press(a.key || ' ', Number(a.n || 1), Number(a.delay || 150)); return { ok: true }; },
    async hold(a) { await h.hold(a.key, Number(a.ms || 400)); return await A.probe(); },
    async walk(a) { await P.install(); const r = await P.walk(Number(a.x), Number(a.y), L); return { ok: r.ok, reason: r.reason, hero: (await A.probe()).hero }; },
    async tp(a) {
      if (a.stage) { await page.evaluate(([s, x, y]) => fadeToStage(Number(s), Number(x), Number(y)), [a.stage, a.x || 0.5, a.y || 0.5]); await h.wait(1500); }
      else { await page.evaluate(([x, y]) => { heroX = x; heroY = y; camX = x; camY = y; }, [Number(a.x), Number(a.y)]); await h.wait(200); }
      return await A.probe();
    },
    async advance(a) { const r = await A.advance(Number(a.max || 60)); return { result: r, probe: await A.probe() }; },
    async battle(a) { const ok = await A.doBattle(Number(a.sec || 120)); return { ok, probe: await A.probe() }; },
    async run(a) { const r = await A.run(Number(a.steps || 20)); return { r, probe: await A.probe(), script: A.script.slice(-30) }; },
    async opening() { return { done: await waitOpening() }; },
    // initjs: 파일의 JS를 «페이지 로드 전» 주입(addInitScript) 후 리로드 — RAF/타이머 스파이 등
    async initjs(a) { await ctx.addInitScript({ path: path.resolve(a.file) }); return await open(); },
    // profile: CDP CPU 프로파일 sec 초 → 함수별 self-time 상위 N (URL 은 인라인이라 함수명+줄만)
    async profile(a) {
      if (!page.__cdp) page.__cdp = await ctx.newCDPSession(page);
      const c = page.__cdp; const sec = Number(a.sec || 5);
      await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval: 200 }); await c.send('Profiler.start');
      await h.wait(sec * 1000);
      const { profile } = await c.send('Profiler.stop'); await c.send('Profiler.disable');
      const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
      const dt = profile.timeDeltas; let total = 0;
      for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const d = (dt[i] || 0) / 1000; total += d; const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ' :' + (cf.lineNumber + 1); self.set(k, (self.get(k) || 0) + d); }
      const rows = [...self.entries()].map(([k, ms]) => ({ k, ms: +ms.toFixed(1), pct: +(100 * ms / total).toFixed(1) })).sort((a, b) => b.ms - a.ms).slice(0, Number(a.top || 25));
      return { totalMs: +total.toFixed(0), rows };
    },
    // throttle: CDP CPU 스로틀 (rate=4 ≈ 중급 모바일, 6 ≈ 저가 기기). rate=1 해제
    async throttle(a) {
      if (!page.__cdp) page.__cdp = await ctx.newCDPSession(page);
      await page.__cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(a.rate || 1) });
      return { rate: Number(a.rate || 1) };
    },
    // perf: sec 초 동안 RAF 프레임 간격·롱태스크·힙·DOM 규모 계측 (장면별 비교용)
    async perf(a) {
      const sec = Number(a.sec || 5);
      const r = await page.evaluate((sec) => new Promise(res => {
        const dts = []; let last = performance.now(); const t0 = last;
        const lt = []; let po = null;
        try { po = new PerformanceObserver(l => l.getEntries().forEach(e => lt.push(+e.duration.toFixed(1)))); po.observe({ entryTypes: ['longtask'] }); } catch (e) { }
        (function f() {
          const now = performance.now(); dts.push(now - last); last = now;
          if (now - t0 < sec * 1000) requestAnimationFrame(f); else done();
        })();
        function done() {
          try { po && po.disconnect(); } catch (e) { }
          dts.shift();
          const s = dts.slice().sort((x, y) => x - y); const q = p => +(s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0).toFixed(1);
          const mean = dts.reduce((x, y) => x + y, 0) / (dts.length || 1);
          const mem = performance.memory ? { usedMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), totalMB: +(performance.memory.totalJSHeapSize / 1048576).toFixed(1) } : null;
          res({
            frames: dts.length, fps: +(1000 / mean).toFixed(1), frameMs: { mean: +mean.toFixed(1), p50: q(0.5), p95: q(0.95), max: q(1) },
            over33ms: dts.filter(d => d > 33).length, over100ms: dts.filter(d => d > 100).length,
            longTasks: { n: lt.length, totalMs: +lt.reduce((x, y) => x + y, 0).toFixed(0), max: lt.length ? Math.max(...lt) : 0 },
            mem, dom: document.getElementsByTagName('*').length, canvases: document.getElementsByTagName('canvas').length,
            imgs: document.images.length, stage: (() => { try { return Number(currentStage); } catch (e) { return null; } })(), hsr: !!(window.HSR && HSR.active),
          });
        }
      }), sec);
      return r;
    },
    // until: 오토파일럿을 청크로 돌리며 조건(js)이 참이 될 때까지. 예) until js="BD.questIdx>=1" chunks=30
    async until(a) {
      for (let c = 0; c < Number(a.chunks || 30); c++) {
        if (await page.evaluate(s => { try { return (new Function('return !!(' + s + ')'))(); } catch (e) { return false; } }, a.js)) return { met: true, chunks: c, probe: await A.probe() };
        const r = await A.run(Number(a.steps || 4));
        if (r && r.ok === false) return { met: false, stuck: r.reason, chunks: c, probe: await A.probe() };
      }
      return { met: false, chunks: Number(a.chunks || 30), probe: await A.probe() };
    },
    async find(a) { return await findObj(a.q); },
    async objects(a) {
      return await page.evaluate((f) => (STAGES[currentStage].objects || []).filter(o => o && !o.hidden && (!f || o.hazardId || o.resident || o.type === 'facility' || o.shop))
        .map(o => ({ l: o.label || o.name, hz: o.hazardId, res: !!o.resident, t: o.type, rx: +o.rx.toFixed(3), ry: +o.ry.toFixed(3), pur: !!(BD.purified || {})[o.hazardId] })), a.filter !== 0);
    },
    // hazard: 위험요소 앞으로 가서 F→선택 확정→(옵션)전투까지
    async hazard(a) {
      const o = await findObj(a.q); if (!o) return { error: '없음: ' + a.q };
      await waitOpening(20000);
      await A.advance(30);                       // 도착 대사·모달 등 입력 잠금 해제까지
      const g = await gotoObj(o, a.walk !== 0);
      let choice = null, gate = null;
      for (let t = 0; t < 3 && !choice; t++) {   // 첫 F는 캡처 가드·쿨다운에 먹힐 수 있다
        await page.keyboard.press('f'); await h.wait(450); await page.keyboard.press('f'); await h.wait(750);
        const st = await page.evaluate(() => {
          const on = e => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
          const c = document.getElementById('bd-choice');
          return {
            choice: (window.__bdChoiceState && __bdChoiceState.open) ? (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : null,
            dlg: on(document.getElementById('dialogue-box')) ? (document.getElementById('dialogue-box').textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100) : null,
            dami: on(document.getElementById('bd-dami-hud')) ? (document.getElementById('bd-dami-hud').textContent || '').replace(/\s+/g, ' ').trim().slice(0, 100) : null,
          };
        });
        choice = st.choice; if (!choice) { gate = st.dlg || st.dami || gate; await A.advance(8); }
      }
      let r = { obj: o, ...g, choice, gate: choice ? null : gate };
      if (a.confirm !== 0) r.after = await confirmChoiceToBattle();
      if (a.fight && r.after === 'battle') { r.battle = await A.doBattle(); await h.wait(1200); r.drain = await A.advance(20); }
      r.probe = await A.probe();
      return r;
    },
    // npc: 주민 앞으로 가서 F→대화 드레인
    async npc(a) {
      const o = await findObj(a.q); if (!o) return { error: '없음: ' + a.q };
      await waitOpening(20000);
      await A.advance(30);
      const g = await gotoObj(o, a.walk !== 0);
      await page.keyboard.press('f'); await h.wait(500); await page.keyboard.press('f'); await h.wait(600);
      const lines = []; A.script.length = 0;
      const r = await A.advance(Number(a.max || 40));
      A.script.forEach(s => lines.push(s.t));
      return { obj: o, ...g, result: r, lines, probe: await A.probe() };
    },
    async shot(a) { return { path: await h.shot(a.name || ('shot_' + Date.now())) }; },
    // save/load: 게임 슬롯2 저장 + localStorage 전체를 파일로 (진행 지점 즉시 재현)
    async save(a) {
      const name = a.name || 'last';
      const dump = await page.evaluate(() => { try { BD_saveToSlot(2); } catch (e) { } const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
      fs.writeFileSync(path.join(SNAPS, name + '.json'), JSON.stringify(dump));
      return { saved: name, keys: Object.keys(dump).length, probe: await A.probe() };
    },
    async load(a) {
      const name = a.name || 'last';
      const p = path.join(SNAPS, name + '.json'); if (!fs.existsSync(p)) return { error: '스냅샷 없음: ' + name };
      const dump = JSON.parse(fs.readFileSync(p, 'utf8'));
      // 스냅샷은 «페이지 스크립트 실행 전»에 주입해야 한다 — 부팅 후 덮어쓰면 메모리 상태(시설 방문 등)가 다시 저장돼 스냅샷을 지운다.
      // 토큰: 나중 것만 적용, 일반 reload 에서는 재적용하지 않음.
      snapTok++;
      await ctx.addInitScript(({ d, tok }) => {
        try {
          if ((Number(localStorage.getItem('__bdSnapTok')) || 0) >= tok) return;
          localStorage.clear(); Object.keys(d).forEach(k => localStorage.setItem(k, d[k])); localStorage.setItem('__bdSnapTok', String(tok));
        } catch (e) { }
      }, { d: dump, tok: snapTok });
      await open();
      await h.wait(500);
      await page.evaluate(() => { try { BD_slotAction('load', 2); } catch (e) { } });
      await h.wait(2500);
      await A.advance(20);
      return { loaded: name, probe: await A.probe() };
    },
    async snaps() { return { snaps: fs.readdirSync(SNAPS).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)) }; },
    async errors(a) { const e = consoleErrors.slice(); if (a.clear) consoleErrors.length = 0; return { count: e.length, errors: e.slice(0, 30) }; },
    async log() { const l = log.slice(); log = []; return { log: l }; },
    async console(a) { return { tail: consoleAll.slice(-Number(a.n || 40)) }; },
    async quit() { setTimeout(async () => { try { await browser.close(); } catch (e) { } process.exit(0); }, 150); return { bye: true }; },
  };

  let busy = false, busyCmd = null, busySince = 0, snapTok = 0;
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      let m; try { m = JSON.parse(body || '{}'); } catch (e) { res.end(JSON.stringify({ error: 'bad json' })); return; }
      const fn = CMD[m.cmd];
      if (!fn) { res.end(JSON.stringify({ error: 'unknown cmd', cmds: Object.keys(CMD) })); return; }
      const t0 = Date.now();
      if (m.cmd === 'status' || m.cmd === 'quit') { // busy 무시 (진단·종료는 항상 가능)
        if (m.cmd === 'quit') { try { server.close(); } catch (e) { } }
        const out = await fn(m.args || {}); res.end(JSON.stringify({ ok: true, ms: Date.now() - t0, out: Object.assign({ busy, busyCmd, busySince }, out) })); return;
      }
      if (busy && Date.now() - busySince < 3600000) { res.end(JSON.stringify({ error: 'busy', busyCmd, busyForMs: Date.now() - busySince })); return; }
      busy = true; busyCmd = m.cmd; busySince = Date.now(); log = [];
      try {
        const out = await fn(m.args || {});
        res.end(JSON.stringify({ ok: true, ms: Date.now() - t0, log, out }));
      } catch (e) { res.end(JSON.stringify({ ok: false, ms: Date.now() - t0, log, error: String(e && e.stack || e) })); }
      busy = false;
    });
  });
  server.on('error', async (e) => { console.log('listen error: ' + e.code + ' — 다른 데몬이 이미 떠 있음. 종료'); try { await browser.close(); } catch (e2) { } process.exit(3); });
  server.listen(PORT, '127.0.0.1', () => { console.log('bdd listening on ' + PORT + ' → ' + GAME); });
  if (process.env.BDD_AUTOOPEN !== '0') {
    busy = true; busyCmd = 'autoopen'; busySince = Date.now();   // 기동 중 open 과 클라이언트 명령의 경합 방지
    try { console.log(JSON.stringify(await open())); } catch (e) { console.log('open failed: ' + e.message); }
    busy = false;
  }
})();
