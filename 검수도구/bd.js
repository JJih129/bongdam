// 봉담지킴이 검수 CLI — bdd.js 데몬에 명령을 보낸다 (없으면 자동 기동)
// 사용:  node bd.js <cmd> [key=value ...]     예) node bd.js boot skip=1 to=213 x=0.3 y=0.5
//        node bd.js hazard q=술병 fight=1      node bd.js npc q=은지     node bd.js save name=sangri
//        node bd.js eval js="heroX+','+heroY"  node bd.js shot name=x   node bd.js quit
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = Number(process.env.BDD_PORT || 47811);
const [cmd, ...rest] = process.argv.slice(2);
if (!cmd) { console.log('usage: node bd.js <cmd> [k=v ...]   (node bd.js help)'); process.exit(1); }
const args = {};
for (const r of rest) {
  const i = r.indexOf('=');
  if (i < 0) { args[r] = 1; continue; }
  const k = r.slice(0, i); let v = r.slice(i + 1);
  if (/^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
  args[k] = v;
}

const call = () => new Promise((resolve, reject) => {
  const body = JSON.stringify({ cmd, args });
  const req = http.request({ host: '127.0.0.1', port: PORT, method: 'POST', path: '/', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 3600000 }, res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('bad reply: ' + d.slice(0, 200))); } });
  });
  req.on('error', reject); req.on('timeout', () => { req.destroy(new Error('timeout')); });
  req.end(body);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let out;
  try { out = await call(); }
  catch (e) {
    if (cmd === 'quit') { console.log('{"ok":true,"note":"not running"}'); return; }
    if (!/ECONNREFUSED/.test(String(e && e.message))) { console.log(JSON.stringify({ error: String(e && e.message || e) })); process.exit(2); }  // 타임아웃 등은 재시도·재기동 금지 (명령 중복 방지)
    // 데몬 자동 기동
    const logf = path.join(__dirname, 'bdd.log');
    const child = spawn(process.execPath, [path.join(__dirname, 'bdd.js'), ...(process.env.BDD_HEADED ? ['--headed'] : []), ...(process.env.BDD_URL ? ['--url=' + process.env.BDD_URL] : [])],
      { detached: true, stdio: ['ignore', fs.openSync(logf, 'a'), fs.openSync(logf, 'a')], env: process.env, windowsHide: true });
    child.unref();
    process.stderr.write('bdd 기동 중…');
    for (let t = 0; t < 120; t++) {
      await sleep(1000);
      try { out = await call(); break; } catch (e2) { process.stderr.write('.'); }
    }
    process.stderr.write('\n');
    if (!out) { console.log(JSON.stringify({ error: 'daemon start failed — see ' + logf })); process.exit(2); }
  }
  // 데몬이 기동 중(autoopen)이면 끝날 때까지 기다렸다가 재전송
  for (let t = 0; t < 360 && out && out.error === 'busy' && out.busyCmd === 'autoopen'; t++) { await sleep(500); try { out = await call(); } catch (e) { } }
  if (cmd === 'quit') { // 포트가 실제로 비워질 때까지 기다린다 (즉시 재기동 레이스 방지)
    for (let t = 0; t < 30; t++) { await sleep(300); try { await call(); } catch (e) { break; } }
  }
  if (out.log && out.log.length) out.log.forEach(l => process.stderr.write('  ' + l + '\n'));
  delete out.log;
  console.log(JSON.stringify(out, null, args.pretty ? 2 : 0));
})();
