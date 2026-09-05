// 봉담지킴이 원커맨드 릴리스: 일치검사 → restamp → 스모크 테스트(데몬) → 배포(배포/Drive) → git 커밋
// 사용: node tools/release.js --msg="v368: 무엇" [--from=src|html] [--no-smoke] [--no-deploy] [--no-commit]
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const ROOT = 'D:/봉담', SRC = ROOT + '/src', HTML = ROOT + '/봉담지킴이_게시용_v338_final.html';
const TOOLS = __dirname, QA = path.resolve(TOOLS, '..');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const flag = k => process.argv.includes('--' + k);
const sha = p => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const node = (args, opts = {}) => execFileSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts });
const step = (n, s) => console.log(`\n[${n}] ${s}`);
const fail = m => { console.error('✖ ' + m); process.exit(1); };
const tmp = path.join(process.env.TEMP || QA, 'bd_release_tmp.html');

step(1, 'src ↔ HTML 일치 검사');
node([path.join(TOOLS, 'bundle.js'), SRC, tmp]);
const fromSrc = sha(tmp), cur = sha(HTML);
if (fromSrc !== cur) {
  const from = arg('from');
  if (from === 'src') { fs.copyFileSync(tmp, HTML); console.log('  → src 기준으로 HTML 갱신'); }
  else if (from === 'html') { node([path.join(TOOLS, 'unbundle.js'), HTML, SRC]); console.log('  → HTML 기준으로 src 재생성'); }
  else fail('src와 HTML이 다릅니다. --from=src (src가 진실) 또는 --from=html (HTML이 진실) 을 지정하세요.');
} else console.log('  ✔ 일치 ' + cur.slice(0, 8));

step(2, 'restamp (베이크 해시 스탬프)');
const before = sha(HTML);
console.log('  ' + node([path.join(QA, 'restamp.js'), HTML, HTML]).trim().replace(/\n/g, ' · '));
if (sha(HTML) !== before) { node([path.join(TOOLS, 'unbundle.js'), HTML, SRC]); console.log('  → 스탬프 변경됨 → src 재동기화'); } else console.log('  ✔ 스탬프 변화 없음');

if (!flag('no-smoke')) {
  step(3, '스모크 테스트 (전용 데몬 :47813)');
  const env = { ...process.env, BDD_PORT: '47813', BDD_URL: 'file:///' + HTML.replace(/\\/g, '/'), SHOTS_DIR: 'shots_release' };
  const bd = (...a) => { const r = spawnSync(process.execPath, [path.join(QA, 'bd.js'), ...a], { encoding: 'utf8', env, cwd: QA }); try { return JSON.parse((r.stdout || '').trim().split('\n').pop()); } catch (e) { return { error: 'bad reply', raw: (r.stdout || '') + (r.stderr || '') }; } };
  try {
    bd('quit');
    const b = bd('boot', 'skip=1', 'to=212', 'x=0.4', 'y=0.5');
    if (!b.ok || !b.out || b.out.stage !== 212) fail('부팅 실패: ' + JSON.stringify(b).slice(0, 300));
    console.log('  ✔ 부팅 → 212');
    const hz = bd('hazard', 'q=쓰레기', 'fight=1', 'walk=0');
    if (!hz.ok || !hz.out || hz.out.after !== 'battle' || hz.out.battle !== true) fail('위험요소 전투 실패: ' + JSON.stringify(hz.out && { choice: hz.out.choice, gate: hz.out.gate, after: hz.out.after, battle: hz.out.battle }));
    console.log('  ✔ 쓰레기 조사→전투→정화 ' + (hz.out.probe && hz.out.probe.purified));
    const er = bd('errors');
    if (!er.ok || er.out.count !== 0) fail('콘솔 오류 ' + JSON.stringify(er.out).slice(0, 400));
    console.log('  ✔ 콘솔 오류 0');
    bd('shot', 'name=release_smoke');
  } finally { bd('quit'); }
  step('3b', '데이터 무결성 유닛 (tools/unit_data.js)');
  const u = spawnSync(process.execPath, [path.join(TOOLS, 'unit_data.js')], { encoding: 'utf8', env, cwd: QA });
  const last = (u.stdout || '').trim().split('\n').filter(l => /결과:/.test(l)).pop() || '(출력 없음)';
  console.log('  ' + last);
  if (u.status !== 0) { console.log((u.stdout || '').split('\n').filter(l => /✖/.test(l)).join('\n')); fail('유닛 테스트 실패'); }
}

if (!flag('no-deploy')) {
  step(4, '배포 (D:\\봉담\\배포 + Google Drive) — 패치마다 버전명 파일');
  /* 버전: --ver=v368e 또는 --msg 의 첫 vNNN 토큰. 사용자 지시(2026-08-18): 매 패치마다 다른 버전명으로 올린다 */
  const ver = arg('ver') || ((arg('msg') || '').match(/v\d{3,}[a-z]?/) || [])[0];
  if (!ver) fail('버전명을 알 수 없음 — --ver=v369 또는 --msg="v369: …" 로 지정');
  const outName = '봉담지킴이_게시용_' + ver + '.html';
  fs.copyFileSync(HTML, ROOT + '/배포/' + outName);
  const drv = fs.existsSync('G:/내 드라이브/버전관리') ? 'G:/내 드라이브/버전관리' : 'G:/내 드라이브/봉담지킴이_작업물';
  try { fs.copyFileSync(HTML, drv + '/' + outName); console.log('  ✔ ' + drv + '/' + outName); } catch (e) { console.log('  ⚠ Drive 복사 실패: ' + e.message); }
  console.log('  ✔ 배포 폴더/' + outName);
}

if (!flag('no-commit')) {
  step(5, 'git 커밋');
  const msg = arg('msg') || ('릴리스 ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
  spawnSync('git', ['add', '-A'], { cwd: ROOT, stdio: 'inherit' });
  const r = spawnSync('git', ['commit', '-q', '-m', msg], { cwd: ROOT, encoding: 'utf8' });
  console.log(r.status === 0 ? '  ✔ ' + msg : '  (변경 없음 또는 실패) ' + (r.stderr || '').trim());
}
/* (v384) [6] 웹 게시 — https://jjih129.github.io/bongdam/ (공개 저장소 JJih129/bongdam)
   웹판은 4MB HTML+외부 에셋 구조라 일반 커밋으로도 저장소가 과도하게 커지지 않는다.
   원격 main을 부모로 둔 커밋을 만들어 이력을 보존하고, 강제 푸시는 사용하지 않는다.
   실패해도 릴리스는 유효 — 경고만 남긴다. --web 지정 시에만 실행. */
/* (v377) 웹 게시는 명시 요청 시에만(--web) — 평소 릴리스는 작업용(에디터 포함) 빌드만 갱신 */
if (flag('web')) {
  step(6, '웹 게시 (GitHub Pages)');
  try {
    const WEB = ROOT + '/웹게시';
    /* (v378) 웹판은 단일 파일이 아니라 «작은 HTML + 외부 assets» 구조로 빌드 (로딩·메모리·캐시 최적) */
    const wb = spawnSync(process.execPath, [path.join(TOOLS, 'webbuild.js'), SRC, WEB], { encoding: 'utf8' });
    if (wb.status !== 0) throw new Error('웹판 빌드 실패: ' + (wb.stderr || wb.stdout || '').slice(0, 200));
    console.log('  ' + (wb.stdout || '').trim());
    const msg6 = '봉담지킴이 웹 게시 ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
    const g = (a) => spawnSync('git', a, { cwd: WEB, encoding: 'utf8' });
    const fr = g(['fetch', '-q', 'origin', 'main']);
    if (fr.status !== 0) throw new Error('원격 이력 확인 실패: ' + (fr.stderr || '').trim().slice(0, 160));
    g(['add', '-A']);
    const tree = (g(['write-tree']).stdout || '').trim();
    const parent = (g(['rev-parse', 'FETCH_HEAD']).stdout || '').trim();
    if (!tree || !parent) throw new Error('게시 트리 또는 원격 부모 확인 실패');
    const cr = spawnSync('git', ['-c', 'user.name=JJih129', '-c', 'user.email=sjh012916@gmail.com',
      'commit-tree', tree, '-p', parent, '-m', msg6], { cwd: WEB, encoding: 'utf8' });
    const commit = (cr.stdout || '').trim();
    if (cr.status !== 0 || !commit) throw new Error('게시 커밋 생성 실패: ' + (cr.stderr || '').trim().slice(0, 160));
    const pr = g(['push', '-q', 'origin', commit + ':main']);
    if (pr.status === 0) console.log('  ✔ https://jjih129.github.io/bongdam/ (반영까지 1~3분)');
    else console.log('  ⚠ 웹 게시 실패: ' + (pr.stderr || '').trim().slice(0, 200));
  } catch (e) { console.log('  ⚠ 웹 게시 실패: ' + e.message); }
}
console.log('\n✅ 릴리스 완료 sha1 ' + sha(HTML).slice(0, 8));
