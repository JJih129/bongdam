/* 실서버(Netlify)와 같은 조건으로 재기 위한 정적 서버 — brotli 로 내보낸다.
   로컬 http-server 는 압축을 안 해 «압축 없이 3.5MB» 라는 과장된 수치가 나왔다. */
const http=require('http'), fs=require('fs'), path=require('path'), zlib=require('zlib');
const ROOT=process.argv[2]||'웹게시', PORT=Number(process.argv[3]||8911);
const TYPES={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp',
  '.png':'image/png','.woff2':'font/woff2','.json':'application/json','.webmanifest':'application/manifest+json'};
const COMPRESS=new Set(['.html','.js','.css','.json','.webmanifest']);
const cache=new Map();
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const f=path.join(ROOT,p);
  if(!f.startsWith(path.resolve(ROOT))&&!f.startsWith(ROOT)){res.writeHead(403).end();return;}
  fs.readFile(f,(e,buf)=>{
    if(e){res.writeHead(404).end('404');return;}
    const ext=path.extname(f).toLowerCase();
    const h={'Content-Type':TYPES[ext]||'application/octet-stream','Cache-Control':'no-store'};
    const ae=String(req.headers['accept-encoding']||'');
    if(COMPRESS.has(ext)&&/br/.test(ae)){
      /* 캐시 키에 «내용»을 넣는다. 경로만으로 캐시했더니 파일을 다시 빌드해도
         옛 압축 바이트를 계속 내보내, 새 코드가 반영 안 된 것처럼 보였다 —
         한참 엉뚱한 곳을 뒤졌다. 측정 도구가 거짓말을 하면 측정이 무의미해진다. */
      const key=f+':'+buf.length+':'+require('crypto').createHash('sha1').update(buf).digest('hex').slice(0,12);
      let z=cache.get(key);
      if(!z){ z=zlib.brotliCompressSync(buf,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11}}); cache.clear(); cache.set(key,z); }
      h['Content-Encoding']='br'; h['Content-Length']=z.length;
      res.writeHead(200,h); res.end(z); return;
    }
    h['Content-Length']=buf.length; res.writeHead(200,h); res.end(buf);
  });
}).listen(PORT,()=>console.log('brotli 서버 '+ROOT+' → http://127.0.0.1:'+PORT));
