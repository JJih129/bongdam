/* 배포 — 빌드 산출물을 main 브랜치에 올린다.
 *
 * ── 이 저장소의 브랜치 구조 (헷갈리기 쉬워 적어 둔다) ──────────────
 *   source : 소스. src/ · assets/ · 검수도구/ 가 있고 산출물은 .gitignore 라 없다.
 *   main   : 배포 전용. 완성된 index.html · assets/ · sw.js 만 있고 src 가 없다.
 *
 *   GitHub Pages(https://jjih129.github.io/bongdam/) 가 main 을 «빌드 없이 그대로» 서빙한다.
 *   그래서 source 에 아무리 푸시해도 사이트는 바뀌지 않는다 —
 *   실제로 그렇게 여러 커밋을 올려 놓고 «배포가 안 된다»고 헤맨 적이 있다.
 *   (Netlify 도 같은 main 을 읽었지만 2026-09 크레딧 소진으로 멈췄고 더 쓰지 않는다.
 *    main 의 _headers 는 그 시절 캐시 규칙 — Pages 는 무시하지만 해가 없어 둔다.
 *    Pages 의 캐시 무효화는 sw.js 의 «문서 네트워크 우선» 규칙과 에셋 파일명 해시가 맡는다.)
 *
 *   배포는 사용자가 요청할 때만 한다. 검증을 통과했다고 자동으로 올리지 않는다.
 *
 * ── 하는 일 ───────────────────────────────────────────────────────
 *   1. build.js 로 dist/ 를 새로 만든다
 *   2. main 을 임시 워크트리로 꺼낸다
 *   3. index.html · sw.js · manifest.webmanifest · assets/ 만 교체한다
 *      (icon-192.png · icon-512.png · .nojekyll · _headers 는 main 에만 있고
 *       빌드가 만들지 않는다. manifest 가 아이콘을 참조하므로 지우면 안 된다.)
 *      README.md 는 source 의 main_README.md 를 복사한다 — main 의 안내문도 소스에서 관리한다.
 *   4. 커밋 후 push
 *
 * 사용: node publish.js "v398n — 무엇을 고쳤는지"
 *       node publish.js "..." --dry     (푸시까지 가지 않고 차이만 보여 준다)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const msg = process.argv.slice(2).filter(a => !a.startsWith('--'))[0];
const dry = process.argv.includes('--dry');

if (!msg) {
  console.error('사용: node publish.js "v398n — 무엇을 고쳤는지" [--dry]');
  process.exit(1);
}

const git = (args, cwd) =>
  execFileSync('git', args, { cwd: cwd || ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const run = (file, args, cwd) =>
  execFileSync(file, args, { cwd: cwd || ROOT, stdio: 'inherit' });

/* 빌드가 만드는 것 = main 에서 교체할 대상. 나머지는 건드리지 않는다. */
const BUILT = ['index.html', 'sw.js', 'manifest.webmanifest'];
const BUILT_DIR = 'assets';

console.log('[1] 빌드');
run(process.execPath, [path.join(ROOT, 'build.js')]);
const dist = path.join(ROOT, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('빌드 산출물이 없습니다'); process.exit(1);
}

console.log('[2] main 워크트리');
/* 서버가 폴더를 잡고 있으면 삭제가 실패한다. 매번 새 이름을 쓴다. */
const wt = path.join(os.tmpdir(), 'bd-pub-' + Date.now());
git(['fetch', 'origin', 'main']);
git(['worktree', 'add', '-q', '--detach', wt, 'origin/main']);

try {
  console.log('[3] 산출물 교체');
  fs.rmSync(path.join(wt, BUILT_DIR), { recursive: true, force: true });
  fs.cpSync(path.join(dist, BUILT_DIR), path.join(wt, BUILT_DIR), { recursive: true });
  for (const f of BUILT) fs.copyFileSync(path.join(dist, f), path.join(wt, f));

  /* main 의 README 는 소스(main_README.md)에서 관리한다 — 없으면 main 의 것을 그대로 둔다 */
  const mainReadme = path.join(ROOT, 'main_README.md');
  if (fs.existsSync(mainReadme)) fs.copyFileSync(mainReadme, path.join(wt, 'README.md'));

  /* 아이콘이 사라지지 않았는지 확인한다 — manifest 가 참조한다 */
  for (const keep of ['icon-192.png', 'icon-512.png']) {
    if (!fs.existsSync(path.join(wt, keep))) {
      console.error('보존해야 할 파일이 없습니다: ' + keep);
      process.exit(1);
    }
  }

  git(['add', '-A'], wt);
  const changed = git(['status', '--short'], wt).trim();
  if (!changed) { console.log('바뀐 것이 없습니다 — 배포 생략'); return finish(); }
  console.log(changed.split('\n').slice(0, 10).join('\n'));
  console.log('  총 ' + changed.split('\n').length + '개 파일');

  if (dry) { console.log('[--dry] 여기서 멈춥니다'); return finish(); }

  console.log('[4] 커밋 · 푸시');
  git(['commit', '-q', '-m', '웹 게시 ' + msg], wt);
  git(['push', 'origin', 'HEAD:main'], wt);
  console.log('배포 완료 — Netlify 가 main 을 받아 갑니다');
  finish();
} catch (e) {
  finish();
  throw e;
}

function finish() {
  try { git(['worktree', 'remove', '--force', wt]); } catch (e) {
    try { git(['worktree', 'prune']); } catch (e2) {}
  }
}
