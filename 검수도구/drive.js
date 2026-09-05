// 봉담지킴이 QA driver
// usage: node drive.js <scenarioFile.js> [--headed] [--url=file:///...]
const pw = require('playwright');
// (v376) BROWSER=chromium|firefox|webkit — 크로스브라우저 매트릭스용. 기본 chromium.
const ENGINE = (process.env.BROWSER || 'chromium').toLowerCase();
const engine = pw[ENGINE] || pw.chromium;
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const scenarioFile = args.find(a => !a.startsWith('--'));
const headed = args.includes('--headed');
const urlArg = args.find(a => a.startsWith('--url='));
const GAME = urlArg ? urlArg.slice(6) : 'file:///D:/봉담/봉담지킴이_v147.html';
const SHOTS = path.join(__dirname, process.env.SHOTS_DIR || 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

(async () => {
  const launchOpts = { headless: !headed };
  if (ENGINE === 'chromium') launchOpts.args = ['--allow-file-access-from-files', '--disable-web-security'];
  const browser = await engine.launch(launchOpts);
  const VW = Number(process.env.VW || 1280), VH = Number(process.env.VH || 800);
  const TOUCH = process.env.TOUCH === '1';
  const ctxOpts = { viewport: { width: VW, height: VH }, deviceScaleFactor: Number(process.env.DPR || 1), hasTouch: TOUCH, userAgent: TOUCH ? 'Mozilla/5.0 (Linux; Android 13; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36' : undefined };
  if (ENGINE !== 'firefox') ctxOpts.isMobile = false;   // firefox 는 isMobile 옵션 미지원
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const consoleErrors = [];
  const consoleAll = [];
  page.on('console', m => {
    const t = `[${m.type()}] ${m.text()}`;
    consoleAll.push(t);
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  const log = [];
  const say = (...a) => { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); log.push(s); console.log(s); };

  const helpers = {
    page, say, SHOTS,
    async shot(name) {
      const p = path.join(SHOTS, name.endsWith('.png') ? name : name + '.png');
      await page.screenshot({ path: p });
      say('  📸 ' + path.basename(p));
      return p;
    },
    async state() {
      return await page.evaluate(() => {
        try { return JSON.parse(window.render_game_to_text()); } catch (e) { return { error: String(e) }; }
      });
    },
    async adv(ms) { await page.evaluate(m => { try { window.advanceTime && window.advanceTime(m); } catch (e) { } }, ms); },
    async wait(ms) { await page.waitForTimeout(ms); },
    async key(k, n = 1, delay = 60) { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(delay); } },
    async hold(k, ms) { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); },
    async click(sel) { await page.click(sel, { timeout: 3000 }); },
    consoleErrors, consoleAll,
  };

  say('▶ loading ' + GAME);
  const t0 = Date.now();
  await page.goto(GAME, { waitUntil: 'load', timeout: 180000 });
  say('  loaded in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
  await page.waitForTimeout(2500);

  try {
    const scen = require(path.resolve(scenarioFile));
    await scen(helpers);
  } catch (e) {
    say('❌ SCENARIO ERROR: ' + e.stack);
  }

  say('--- console errors (' + consoleErrors.length + ') ---');
  consoleErrors.slice(0, 30).forEach(e => say('  ! ' + e));
  fs.writeFileSync(path.join(SHOTS, '_log.txt'), log.join('\n'), 'utf8');
  fs.writeFileSync(path.join(SHOTS, '_console.txt'), consoleAll.join('\n'), 'utf8');
  await browser.close();
})();
