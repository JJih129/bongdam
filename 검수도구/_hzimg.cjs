const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless:true, channel:'chrome' });
  const p = await (await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })).newPage();
  await p.goto(process.argv[2], { waitUntil:'load', timeout:240000 });
  await p.waitForTimeout(4000);
  const r = await p.evaluate(()=>{
    const out={슬롯:{}};
    const V=['trash','cigarette','kickboard','bottle','glass','dark_alley','graffiti','bicycle',
             'noise_bat','road_crack','sign_ghost','streetlight','final_boss'];
    /* 에셋 조회 함수 찾기 */
    const getters=['BD_getAsset','bdAsset','BD_ASSETS'];
    out.전역 = getters.filter(g=>typeof window[g]!=='undefined');
    for(const v of V){
      let val=null;
      try{ if(window.BD_ASSETS) val=window.BD_ASSETS['field.hazard.'+v]; }catch(e){}
      if(val==null){ try{ if(typeof BD_getAsset==='function') val=BD_getAsset('field.hazard.'+v); }catch(e){} }
      out.슬롯[v] = val ? (typeof val==='string' ? (val.length>100?'데이터 '+Math.round(val.length/1024)+'KB':val.slice(0,40)) : typeof val) : '비어있음';
    }
    return out;
  });
  console.log(JSON.stringify(r,null,1));
  await b.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
