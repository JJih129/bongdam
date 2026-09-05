const CACHE="bongdam-eb0ecc8da2";
const CORE=["index.html","manifest.webmanifest"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// 에셋은 요청 시 캐시(런타임 캐싱) — 첫 설치를 가볍게, 재방문·오프라인은 빠르게.
// (v398) 다만 문서(index.html)만은 «네트워크 우선 + 2.5초 타임아웃»으로 가져온다.
//   캐시 우선이면 배포해도 기존 접속자가 계속 옛 버전을 본다. match 의 ignoreSearch
//   때문에 ?쿼리를 붙여도 캐시가 나와 강제 새로고침 수단이 없었다.
//   네트워크가 느리거나 끊기면 캐시로 떨어지므로 오프라인 동작은 그대로다.
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 const nav=(e.request.mode==="navigate");
 e.respondWith(caches.open(CACHE).then(async c=>{
  if(nav){
   try{
    const net=fetch(e.request);
    const r=await Promise.race([net,new Promise((_,rj)=>setTimeout(()=>rj(new Error("slow")),2500))]);
    if(r&&r.ok){try{c.put("index.html",r.clone());}catch(_){}return r;}
   }catch(_){}
   const idx=await c.match("index.html");if(idx)return idx;
   return fetch(e.request);
  }
  const hit=await c.match(e.request,{ignoreSearch:true});
  if(hit)return hit;
  try{const r=await fetch(e.request);if(r.ok&&(new URL(e.request.url).origin===location.origin))c.put(e.request,r.clone());return r;}
  catch(err){throw err;}}));});
