const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:240000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(()=>{
    const V=['trash','cigarette','kickboard','bottle','glass','dark_alley','graffiti','bicycle',
             'noise_bat','road_crack','sign_ghost','streetlight','final_boss'];
    const out={};
    for(const v of V){
      const key='field.hazard.'+v;
      let has=false, img=null;
      try{ has = !!(BD_ASSETS.has && BD_ASSETS.has(key)); }catch(e){}
      try{ const g = BD_ASSETS.get && BD_ASSETS.get(key); img = g ? (typeof g==='string' ? Math.round(g.length/1024)+'KB' : typeof g) : null; }catch(e){}
      let im=null;
      try{ const x = BD_getAssetImage && BD_getAssetImage(key); im = x ? (x.complete? (x.naturalWidth+'x'+x.naturalHeight) : '로딩중') : null; }catch(e){}
      out[v] = { has, get: img||'없음', image: im||'없음' };
    }
    out['__슬롯목록'] = (()=>{ try{ const s=BD_ASSETS.slots && BD_ASSETS.slots(); 
      return Array.isArray(s)? s.filter(k=>/hazard/.test(k)).slice(0,16) : typeof s; }catch(e){ return 'ERR'; } })();
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
