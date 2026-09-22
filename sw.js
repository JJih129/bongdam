const CACHE="bongdam-2120915e83";
const CORE=["index.html","manifest.webmanifest","assets/0a0f65fe_game.a.js","assets/5dcd141f_game.b.js"];
// (v401) 설치 때 문서·매니페스트·게임 JS(splitjs 가 CORE 에 덧붙임)를 미리 담는다. 새 SW 는 «대기»하고, 페이지 배너가 skipWaiting 을 요청할 때 교체된다.
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));});
self.addEventListener("message",e=>{if(e.data&&e.data.type==="skipWaiting")self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// 문서(index.html): 캐시가 있으면 즉시 주고(재방문 0.1초·오프라인), 뒤에서 새로 받아 캐시를 갱신한다(stale-while-revalidate).
//   새 버전은 sw.js 자체가 바뀌므로 updatefound → 배너로 알려 준다. 캐시가 없으면(첫 방문) 네트워크.
// 에셋(해시 파일명): 캐시 우선, 없으면 네트워크 후 캐시.
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
 const nav=(e.request.mode==="navigate");
 e.respondWith(caches.open(CACHE).then(async c=>{
  if(nav){
   const cached=await c.match("index.html");
   const net=fetch(e.request).then(r=>{if(r&&r.ok){try{c.put("index.html",r.clone());}catch(_){}}return r;}).catch(()=>null);
   if(cached){e.waitUntil(net);return cached;}
   const r=await net;if(r)return r;
   return new Response("오프라인이에요 — 인터넷에 연결한 뒤 다시 열어 주세요.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  }
  const hit=await c.match(e.request,{ignoreSearch:true});
  if(hit)return hit;
  try{const r=await fetch(e.request);if(r.ok&&(new URL(e.request.url).origin===location.origin))c.put(e.request,r.clone());return r;}
  catch(err){throw err;}}));});
