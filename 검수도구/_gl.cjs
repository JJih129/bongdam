const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:874,height:300}, deviceScaleFactor:3, hasTouch:true, isMobile:true })).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,100)));
  await p.goto(process.argv[2], { waitUntil:'load', timeout:180000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(()=>({
    selectCharacter: typeof window.selectCharacter,
    showTitle: typeof window.BD_showTitle,
    openInventory: typeof window.openInventory,
    heroX: typeof window.heroX,
    startNewGame: typeof window.BD_startNewGame
  }));
  console.log(JSON.stringify(r));
  console.log('로드 중 에러 '+errs.length+(errs.length?': '+errs.slice(0,3).join(' | '):''));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
