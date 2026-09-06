const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:240000 });
  await p.waitForTimeout(5000);
  const r = await p.evaluate(()=>{
    const V=['trash','bottle','glass','kickboard','cigarette','dark_alley','graffiti','bicycle'];
    const out={};
    for(const v of V){
      const key='field.hazard.'+v;
      let g=null; try{ g=BD_ASSETS.get(key); }catch(e){ g='ERR'; }
      out[v] = { 타입:typeof g, 길이: (typeof g==='string'? g.length : -1),
        앞: (typeof g==='string'? g.slice(0,40) : String(g)).slice(0,40) };
    }
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
