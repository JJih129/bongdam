# 봉담 안전지도 대작전 — 개발 소스

봉담읍 청소년 안전교육용 웹 RPG. **단일 HTML 파일**로 빌드되는 브라우저 게임입니다.

- 🎮 **플레이(웹)**: https://bongdam-safety.netlify.app
- 📦 **웹 게시본 소스**: 이 저장소의 `main` 브랜치 (빌드 산출물)
- 🛠 **개발 소스**: 이 저장소의 `source` 브랜치 ← **지금 보고 있는 곳**

현재 버전: **v397** (Ver. 1.0.0 · Build 397)

---

## 1. 다른 PC에서 시작하기

```bash
git clone -b source https://github.com/JJih129/bongdam.git 봉담
cd 봉담
node 검수도구/tools/bundle.js src 봉담지킴이_게시용_v338_final.html
```

마지막 명령이 `src/` 트리를 **단일 HTML(약 45MB)로 재조립**합니다(1초). 그 파일을 브라우저로 열면 바로 플레이됩니다.

> 빌드 산출물 HTML은 용량이 커서 저장소에 넣지 않습니다. 항상 위 명령으로 만드세요.

필요 환경: **Node.js 18+** 만 있으면 됩니다. QA 하네스를 쓰려면 `cd 검수도구 && npm install` (Playwright).

---

## 2. 저장소 구조

| 경로 | 설명 |
|---|---|
| `src/shell.html` | HTML 뼈대. `@@BLOCK:NNNN@@` 토큰 자리에 블록이 들어감 |
| `src/blocks/NNNN_<id>.js\|css` | 스크립트·스타일 레이어 (번호 = 로드 순서) |
| `src/assets/<hash>_<name>.<ext>` | 이미지·오디오. 본문에서 `@@B64:<이름>@@` 로 참조 |
| `src/manifest.json` | 블록·에셋 목록 |
| `검수도구/` | QA 하네스(Playwright)와 빌드 도구 |
| `검수도구/tools/bundle.js` | src → 단일 HTML 재조립 |
| `검수도구/tools/unbundle.js` | 단일 HTML → src 역분해 (왕복 무손실) |
| `검수도구/tools/webbuild.js` | 웹 게시판 빌드(경량 HTML + 외부 assets, 에디터 제외) |
| `검수도구/tools/release.js` | 원커맨드 릴리스(일치검사→스탬프→스모크→배포→커밋) |
| `봉담지킴이_인수인계.md` | 상세 인수인계 문서 (구버전 기준, 구조 설명은 유효) |
| `progress.md` / `출시노트.md` | 작업 이력 |
| `.claude/skills/bongdam-qa-loop/` | QA 루프 작업 절차서 |

### 엔진 본체
`src/blocks/0002_anon.js` (약 0.9MB) — 배치 데이터(베이크)와 엔진.
`src/blocks/0017_anon.js`, `0051_anon.js`(전투), `0053_anon.js`(퀘스트·상태)가 핵심입니다.

---

## 3. 개발 워크플로

### 코드 수정
1. `src/blocks/` 에서 편집 (**HTML을 직접 고치지 말 것**)
2. `node 검수도구/tools/bundle.js src 봉담지킴이_게시용_v338_final.html`
3. 브라우저로 열어 확인

새 기능은 **새 레이어 블록**으로 추가하는 것이 관례입니다:
```bash
node 검수도구/tools/newlayer.js src bd-기능이름-v398 js patch.js
```

### 배치(맵) 수정
게임 안에 **에디터**가 내장돼 있습니다. 게시 모드에서 `Shift+Z+X+C` 동시 입력 → `?dev=1` 로 전환.
배치 데이터를 바꾼 뒤에는 반드시:
```bash
node 검수도구/restamp.js 봉담지킴이_게시용_v338_final.html
```
(스탬프가 안 바뀌면 기존 접속자에게 새 배치가 영영 적용되지 않습니다.)

### QA
```bash
cd 검수도구
node bd.js boot skip=1 to=212 x=0.4 y=0.5   # 상주 데몬으로 즉시 부팅
node bd.js hazard q=쓰레기 fight=1           # 위험요소 조사→전투
node drive.js s_edge.js --url=file:///D:/봉담/봉담지킴이_게시용_v338_final.html
node drive.js s_fullrun.js --url=...        # 전체 완주(약 30분)
```
자세한 절차는 `.claude/skills/bongdam-qa-loop/SKILL.md` 참고.

---

## 4. 배포

### 웹 게시 (Netlify — 현재 주 채널)
```bash
node 검수도구/tools/webbuild.js src 웹게시
# 웹게시/ 에서 index.html·sw.js 가 참조하는 파일만 추려 폴더/zip 으로 만든 뒤
npx netlify-cli deploy --prod --dir <폴더> --site 635ca57c-abca-4f28-9ab5-0f2230057aa9
```
웹판은 **인게임 에디터가 제외**되어 가볍습니다(index 약 3.3MB). 작업용 빌드에는 에디터가 그대로 남습니다.

### GitHub Pages (병행 채널)
이 저장소 `main` 브랜치 = https://jjih129.github.io/bongdam/

---

## 5. 게임 흐름 요약

타이틀 → 캐릭터 선택 → 프롤로그(문화의집 3층, 스테이지 101) → 배지 수여 → 엘리베이터
→ **와우리(212)** → 상리(213) → 동화리(211) → 수영리(210) → 최종 보스(212) → 엔딩

- 핵심 루프: 주민 부탁 → 위험요소 조사(F) → 전투(미니게임) → 정화 → 보고·보상
- 지역 이동: 도로 끝까지 **걸어가면** 옆 리로 넘어감 / 정류장에서 **버스 이동**도 가능
- 안전지도(M): 지역 100% 채우면 안전 조각 획득 → 4개 모으면 최종장 개방

---

## 6. 주의사항 (실수 방지)

- `src`와 빌드 HTML이 **어긋난 채 커밋 금지** — `release.js` 의 일치검사가 최종 방어선
- 배치 데이터 수정 후 **restamp 필수**
- 블록 번호는 **로드 순서**입니다. 중간에 끼워 넣으면 이후 번호가 밀립니다(`newlayer.js` 사용)
- 세이브는 3계열: `fantasyRPG_save` / `bongdam_guardian_v160` / `bd_*` 플래그 — 초기화 로직은 셋 다 다뤄야 합니다
- 에디터 관련 코드는 **제거 금지** (웹 빌드에서만 자동 제외됩니다)
