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
