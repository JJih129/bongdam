/* 배포 빌드 진입점.
 *
 * Netlify 는 리포를 받아 이 파일 하나만 실행한다. 실제 빌드는 검수도구/tools/webbuild.js 가
 * 한다 — 여기서는 «어디서 읽어 어디에 쓸지»만 정한다.
 *
 * 왜 이 파일이 따로 있나:
 *   1) netlify.toml 의 command 에 한글 경로가 들어가지 않게 한다.
 *      빌드 이미지의 셸 인코딩에 따라 «검수도구/tools/...» 인자가 깨질 여지를 없앤다.
 *      (JS 소스 안의 한글은 Node 가 UTF-8 로 읽으므로 안전하다.)
 *   2) 출력 폴더 이름도 ASCII(dist) 로 통일한다.
 *
 * 산출물은 리포에 커밋하지 않는다(.gitignore). 리포에는 소스만 두고 배포 때마다 새로 만든다.
 * 빌드에 필요한 것은 Node 내장 모듈뿐이라 npm 설치가 없다.
 */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
const builder = path.join(root, '검수도구', 'tools', 'webbuild.js');
const srcDir = path.join(root, 'src');
const outDir = path.join(root, process.argv[2] || 'dist');

console.log('빌드 시작');
console.log('  소스 : ' + srcDir);
console.log('  출력 : ' + outDir);

execFileSync(process.execPath, [builder, srcDir, outDir], { stdio: 'inherit', cwd: root });

/* 인라인 JS 최소화 — 주석·들여쓰기 제거. terser 가 없으면 조용히 넘어간다.
   («배포는 이 PC 에서 만든 산출물을 main 에 올리는» 방식이라 서버에는 terser 가 필요 없다.) */
try {
  execFileSync(process.execPath, [path.join(root, '검수도구', 'tools', 'minify.js'), outDir],
    { stdio: 'inherit', cwd: root });
} catch (e) {
  console.error('최소화 단계에서 오류 — 최소화 없이 진행합니다: ' + e.message);
}

/* (v398) JS 외부 분리(splitjs)는 «기본 꺼짐».
   내려받는 양과 재방문 캐시에는 분명히 이득이지만(index.html 3579→275KB), 실행 순서가
   바뀌면서 회귀가 두 번 났다.
     · defer 없이 첫 자리에서 막으면 → 뒤쪽 블록이 자기 앞 마크업보다 먼저 돌아
       appendChild(null). 원래 인라인 블록들은 문서에 흩어져 있어 그 순서가 보장됐다.
     · defer 로 넣으면 → 순서는 맞지만 «마크업은 있는데 핸들러는 아직»인 창이 생긴다.
       shell.html 의 캐릭터 카드가 onclick 을 마크업에 들고 있어 그 사이에 누르면 터진다.
   부팅 잠금(pointer-events)으로 실사용자는 막았지만 검증이 계속 걸려, 지금은 끈다.
   최소화(-886KB)만으로도 brotli 600→427KB 를 얻는다 — 위험 없는 이득만 취한다.
   BD_SPLIT=1 로 켜서 다시 다듬을 수 있다. */
if (process.env.BD_SPLIT === '1') {
  try {
    execFileSync(process.execPath, [path.join(root, '검수도구', 'tools', 'splitjs.js'), outDir],
      { stdio: 'inherit', cwd: root });
  } catch (e) {
    console.error('JS 외부 분리에서 오류 — 인라인 그대로 진행합니다: ' + e.message);
  }
}

/* 산출물이 실제로 생겼는지 확인한다 — 빌드가 조용히 실패하면 Netlify 는
   «성공했지만 빈 사이트»를 배포해 버린다. 여기서 끊는 편이 낫다. */
const fs = require('fs');
const index = path.join(outDir, 'index.html');
if (!fs.existsSync(index)) {
  console.error('빌드 실패: ' + index + ' 가 만들어지지 않았습니다');
  process.exit(1);
}
const kb = Math.round(fs.statSync(index).size / 1024);
if (kb < 200) {
  console.error('빌드 실패: index.html 이 ' + kb + 'KB 로 너무 작습니다');
  process.exit(1);
}
console.log('빌드 완료 — index.html ' + kb + 'KB');
