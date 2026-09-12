/* (v399) 부팅 경로 전송량 — «타이틀이 보일 때까지» 와 «프롤로그 필드(101)에 들어갈 때까지»
 * 요청 수·바이트를 센다. 최적화 전/후를 같은 서버·같은 조건으로 비교하기 위한 자.
 *
 *   node 검수도구/s_bootbytes_v399.cjs [--url=http://localhost:8788/new/] [--size=874x300] [--label=전]
 *
 * 바이트는 응답 본문 길이(압축 전 크기, Content-Length 가 없으면 body 길이) — 로컬 서버는 압축이 없어
 * 실제 전송량과 다르지만 전/후 «비교»에는 같은 자다.
 */
'use strict';
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const URL = opt('url', 'http://localhost:8788/new/');
const [W, H] = opt('size', '874x300').split('x').map(Number);
const LABEL = opt('label', '');

(async () => {
  const browser = await chromium.launch();
  const c = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await c.newPage();
  const reqs = [];
  p.on('response', async res => {
    try {
      const u = res.url(); if (!u.startsWith('http')) return;
      const h = res.headers(); let n = Number(h['content-length'] || 0);
      if (!n) { try { n = (await res.body()).length; } catch (e) { n = 0; } }
      reqs.push({ u: u.replace(/^.*\/(new|base)\//, ''), n, t: Date.now() });
    } catch (e) {}
  });
  const t0 = Date.now();
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  const tLoad = Date.now() - t0;
  for (let i = 0; i < 60; i++) { if (await p.evaluate(() => { const b = document.getElementById('bd-title-start'); return !!(b && b.offsetHeight > 0); })) break; await p.waitForTimeout(250); }
  const tTitle = Date.now() - t0;
  await p.waitForTimeout(500);
  const sum = list => ({ n: list.length, kb: Math.round(list.reduce((s, r) => s + r.n, 0) / 1024) });
  const atTitle = sum(reqs);
  const top = [...reqs].sort((a, b) => b.n - a.n).slice(0, 6).map(r => r.u + ' ' + Math.round(r.n / 1024) + 'KB');

  await p.evaluate(() => { const b = document.getElementById('bd-title-start'); if (b) b.click(); });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => { const m = document.getElementById('bd-startsetup-modal'); return !!(m && m.classList.contains('show')); }).catch(() => false)) break; }
  await p.evaluate(() => { try { window.BD_pickStartChar(1); window.BD_confirmStartSetup(); } catch (e) {} });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }).catch(() => null); if (s && s !== 1) break; }
  await p.waitForTimeout(1500);
  const atField = sum(reqs);
  const after = reqs.slice(atTitle.n).sort((a, b) => b.n - a.n).slice(0, 10).map(r => r.u + ' ' + Math.round(r.n / 1024) + 'KB');
  const stage = await p.evaluate(() => { try { return currentStage; } catch (e) { return '?'; } });
  const pending = await p.evaluate(() => { try { return window.__BD_LAZY ? __BD_LAZY.pending() : null; } catch (e) { return null; } });
  console.log((LABEL ? '[' + LABEL + '] ' : '') + URL + ' ' + W + 'x' + H);
  console.log('  load ' + tLoad + 'ms · 타이틀 ' + tTitle + 'ms');
  console.log('  타이틀까지: 요청 ' + atTitle.n + ' · ' + atTitle.kb + 'KB');
  console.log('  필드(' + stage + ')까지: 요청 ' + atField.n + ' · ' + atField.kb + 'KB · 지연 보류 ' + pending);
  console.log('  큰 응답: ' + top.join(' | '));
  console.log('  타이틀 이후 큰 응답: ' + after.join(' | '));
  await browser.close();
})().catch(e => { console.error('실패: ' + e.message); process.exit(2); });
