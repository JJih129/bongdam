const CACHE="bongdam-a19ac74335";
const CORE=["index.html","manifest.webmanifest"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// 에셋은 요청 시 캐시(런타임 캐싱) — 첫 설치를 가볍게, 재방문·오프라인은 빠르게
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:true});
  if(hit)return hit;
  try{const r=await fetch(e.request);if(r.ok&&(new URL(e.request.url).origin===location.origin))c.put(e.request,r.clone());return r;}
  catch(err){if(e.request.mode==="navigate"){const idx=await c.match("index.html");if(idx)return idx;}throw err;}}));});
