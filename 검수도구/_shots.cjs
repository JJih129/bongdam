/* 보고서용 비교 스크린샷 일괄 촬영.
   사용: node _shots.cjs <url> <라벨(before|after)> [tier]
   tier: phone(874x300) | tablet(1280x800) | pc(1440x900)
   결과: 검수도구/보고서/<tier>_<화면>_<라벨>.png */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const URL = process.argv[2], LABEL = process.argv[3] || 'after';
const TIER = process.argv[4] || 'phone';
const MODES = {
  phone:  { w: 874,  h: 300, dpr: 3, touch: true },
  tablet: { w: 1280, h: 800, dpr: 2, touch: true },
  pc:     { w: 1440, h: 900, dpr: 1, touch: false }
};
const M = MODES[TIER];
const OUT = path.join('검수도구', '보고서');
fs.mkdirSync(OUT, { recursive: true });
const shot = (p, name) => p.screenshot({ path: path.join(OUT, TIER + '_' + name + '_' + LABEL + '.png') });

(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: M.w, height: M.h }, deviceScaleFactor: M.dpr,
    hasTouch: M.touch, isMobile: M.touch });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'load', timeout: 240000 });
  await p.waitForTimeout(4000);
  await shot(p, '1타이틀');

  await p.evaluate(() => { const x = document.getElementById('bd-title-start'); if (x) x.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(700);
    if (await p.evaluate(() => !!document.getElementById('char-card-1')
      && document.getElementById('char-card-1').getBoundingClientRect().width > 2)) break; }
  await p.waitForTimeout(1500);
  await shot(p, '2캐릭터선택');

  await p.evaluate(() => { const q = document.getElementById('char-card-1'); if (q) q.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { const g = [...document.querySelectorAll('button,.modal-btn')]
    .filter(x => x.getBoundingClientRect().width > 2).find(x => /모험\s*시작/.test(x.textContent || '')); if (g) g.click(); });
  for (let i = 0; i < 25; i++) { await p.waitForTimeout(900);
    const s = await p.evaluate(() => { try { return currentStage; } catch (e) { return null; } }); if (s && s !== 1) break; }
  await p.waitForTimeout(4000);
  await shot(p, '3게임화면');

  await p.evaluate(() => { try { openInventory(); } catch (e) {} });
  await p.waitForTimeout(1800);
  await shot(p, '4인벤토리');
  await p.evaluate(() => { try { const v = document.getElementById('inv-overlay'); if (v) v.classList.remove('open'); } catch (e) {} });
  await p.waitForTimeout(600);

  await p.evaluate(() => { try { BD_openSafetyMap(); } catch (e) {} });
  await p.waitForTimeout(1800);
  await shot(p, '5안전지도');
  await p.evaluate(() => { try { BD_closeSafetyMap(); } catch (e) {} });
  await p.waitForTimeout(600);

  await p.evaluate(() => { try { BD_openAchievements(); } catch (e) {} });
  await p.waitForTimeout(1600);
  await shot(p, '6업적');

  console.log(TIER + '/' + LABEL + ' 6장 촬영 완료');
  await b.close();
})().catch(e => { console.error(TIER + '/' + LABEL + ' 실패: ' + e.message); process.exit(1); });
