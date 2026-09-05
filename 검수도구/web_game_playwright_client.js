#!/usr/bin/env node
/* develop-web-game 스킬 규격 클라이언트 (봉담지킴이용)
   스킬이 가리키는 $WEB_GAME_CLIENT 는 이 환경에 설치돼 있지 않아(SKILL.md 만 존재)
   같은 인터페이스로 직접 만들었다.

   node web_game_playwright_client.js --url <URL> \
        [--actions-file f.json | --actions-json '{...}' | --click <sel>] \
        [--click-selector <sel>] [--iterations N] [--pause-ms N] \
        [--out shots] [--headed] [--viewport 1280x800] [--touch]

   각 step: { buttons:[...], frames:N, mouse_x, mouse_y, capture:true }
   frames 는 window.advanceTime(frames*16.67) 로 «결정적으로» 진행한다.
*/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};
const flag = (name) => argv.includes('--' + name);

const URL_ = arg('url', 'file:///D:/봉담/봉담지킴이_v147.html');
const OUT = path.resolve(arg('out', 'shots_client'));
const ITER = Number(arg('iterations', 1));
const PAUSE = Number(arg('pause-ms', 250));
const CLICK_SEL = arg('click-selector', arg('click', null));
const [VW, VH] = String(arg('viewport', '1280x800')).split('x').map(Number);

let actions = null;
const af = arg('actions-file', null);
const aj = arg('actions-json', null);
if (af) actions = JSON.parse(fs.readFileSync(af, 'utf8'));
else if (aj) actions = JSON.parse(aj);
if (!actions && !CLICK_SEL) {
  console.error('입력이 필요합니다: --actions-file / --actions-json / --click');
  process.exit(2);
}

const KEYMAP = {
  up: 'w', down: 's', left: 'a', right: 'd',
  w: 'w', a: 'a', s: 's', d: 'd',
  space: 'Space', enter: 'Enter', escape: 'Escape', esc: 'Escape',
  f: 'f', e: 'e', i: 'i', j: 'j', q: 'q', z: 'z', shift: 'Shift',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: !flag('headed'), args: ['--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, hasTouch: flag('touch') });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  const log = [];
  const say = (s) => { log.push(s); console.log(s); };

  say('▶ load ' + URL_);
  await page.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await page.waitForTimeout(2000);

  const hooks = await page.evaluate(() => ({
    render: typeof window.render_game_to_text === 'function',
    advance: typeof window.advanceTime === 'function',
    canvases: document.querySelectorAll('canvas').length,
  }));
  say('통합 지점: render_game_to_text=' + hooks.render + ' advanceTime=' + hooks.advance + ' canvas=' + hooks.canvases);
  if (!hooks.render || !hooks.advance) { say('❌ 필수 훅 누락'); }

  if (CLICK_SEL) {
    try { await page.click(CLICK_SEL, { timeout: 5000 }); say('클릭: ' + CLICK_SEL); }
    catch (e) { say('클릭 실패: ' + CLICK_SEL); }
    await page.waitForTimeout(PAUSE);
  }

  const shot = async (name) => {
    const p = path.join(OUT, name + '.png');
    await page.screenshot({ path: p });
    say('  📸 ' + name + '.png');
  };
  const state = async () => {
    try { return JSON.parse(await page.evaluate(() => window.render_game_to_text())); }
    catch (e) { return { error: String(e) }; }
  };

  let n = 0;
  for (let it = 0; it < ITER; it++) {
    const steps = (actions && actions.steps) || [];
    for (const st of steps) {
      const keys = (st.buttons || []).filter(b => b !== 'left_mouse_button' && b !== 'right_mouse_button')
        .map(b => KEYMAP[b] || b);
      if (st.mouse_x != null && st.mouse_y != null) await page.mouse.move(st.mouse_x, st.mouse_y);
      if ((st.buttons || []).includes('left_mouse_button')) {
        await page.mouse.click(st.mouse_x || VW / 2, st.mouse_y || VH / 2);
      }
      for (const k of keys) await page.keyboard.down(k);
      const frames = Math.max(1, st.frames || 1);
      // 결정적 진행 (advanceTime) + 실시간 타이머도 흐르도록 최소 대기
      await page.evaluate(f => { try { window.advanceTime(f * (1000 / 60)); } catch (e) { } }, frames);
      await page.waitForTimeout(Math.max(40, Math.round(frames * 16.7)));
      for (const k of keys) await page.keyboard.up(k);
      await page.waitForTimeout(PAUSE);

      const s = await state();
      say(`it${it} step${n} keys=[${keys.join(',')}] frames=${frames} → mode=${s.mode} stage=${s.stage && s.stage.id} hero=(${s.hero && s.hero.x},${s.hero && s.hero.y}) hp=${s.hero && s.hero.hp} guide=${s.guide}`);
      if (st.capture) await shot(`it${it}_step${n}`);
      n++;
    }
  }

  await shot('final');
  const s = await state();
  fs.writeFileSync(path.join(OUT, 'state.json'), JSON.stringify(s, null, 1), 'utf8');
  say('--- console errors (' + errors.length + ') ---');
  errors.slice(0, 20).forEach(e => say('  ! ' + e));
  fs.writeFileSync(path.join(OUT, 'log.txt'), log.join('\n'), 'utf8');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
