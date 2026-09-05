---
name: bongdam-qa-loop
description: 봉담지킴이(단일 HTML 게임)의 버그 리포트를 재현→원인 확정→최소 수정→검증→회귀로 처리하는 QA 루프. 게임 버그 수정, QA 리포트 처리, 완주/회귀 검증, 새 빌드 패치 작업에 사용.
---

# 봉담지킴이 QA 루프

버그 리포트 하나를 받았을 때부터 최종 빌드 확정까지의 표준 경로. **추측 금지 — 모든 판단은 관측으로.**

## 0. 절대 규칙
1. **재현 없이 수정하지 않는다.** 재현 시나리오(검수도구/s_*.js)를 먼저 만들어 증상을 수치·스크린샷으로 잡는다.
2. **원인은 계측으로 확정한다.** 후보가 여럿이면: 함수 스파이(래핑해 호출 카운트/스택 기록) → 상태 덤프(1초 간격) → 빌드 이분 탐색(버전별 재실행) 순.
3. **수정은 최소·주석 필수.** `<script id="bd-기능-vNN">` 레이어 추가 또는 문자열 패치(매치 수 검사 필수). 한국어로 «무엇을 왜».
4. **수정 직후 유닛 → 회귀 → 완주.** 유닛(해당 술어/함수 직접 호출) 통과 후에만 무거운 검증.
5. **데이터(배치)를 고쳤으면 반드시 `node 검수도구/restamp.js <빌드.html>`** — 스탬프가 안 바뀌면 기존 PC들에 영영 미적용.
6. **엣지 스위트는 단독 실행.** 완주 런과 병행하면 CPU 기아로 타이밍 판정이 전부 오탐난다(실측 1/7→단독 7/7).

## 1. 하네스 사용법

### 1-0. 상주 데몬 CLI (2026-08-14 도입 — 프로브의 기본값)
게임을 한 번 띄워 두고 명령을 초 단위로 던진다. 새 s_*.js는 «데몬 명령 조합으로 안 될 때만» 쓴다.
```bash
cd D:\봉담\검수도구
node bd.js boot skip=1 to=213 x=0.3 y=0.5     # 튜토 격리 부팅 + 스테이지 이동 (~10s)
node bd.js load name=ch1_start                # 체크포인트 복원 (~6s)  snaps/: ch1_start·ch2_start·ch3_start·ch4_start·…
node bd.js hazard q=술병 fight=1               # 위험요소 F→선택 확정→전투 완료. choice=null이면 gate에 «막힌 이유 대사»
node bd.js npc q=은지                          # 주민 대화 드레인 → lines
node bd.js until js="BD.questIdx>=2" chunks=30 # 오토파일럿으로 조건까지 진행 (stuck 사유 반환)
node bd.js probe | state | blocked | battleinfo | objects | find q=약국
node bd.js walk x=0.4 y=0.5 | tp stage=212 x=.. y=.. | press key=f n=2 | hold key=a ms=600
node bd.js eval js="heroX+','+heroY"          # 페이지 컨텍스트 즉석 평가
node bd.js shot name=x | save name=x | errors clear=1 | console n=40 | reload | quit
```
- 데몬 없으면 bd.js가 자동 기동(bdd.log). 헤디드: `$env:BDD_HEADED=1`, 다른 빌드: `$env:BDD_URL=file:///...`. 빌드를 패치한 뒤엔 `node bd.js reload`(또는 quit 후 재기동).
- 명령은 순차(busy면 거절). stderr에 진행 로그, stdout에 JSON 한 줄.
- 게임 코드는 손대지 않는다 — lib.js/auto.js/path.js 재사용.
- 결정론 모드 `BDD_DET=1`(Playwright 가상 시계+시드 RNG)은 **실험용·비권장**: 실측 가상 1초=실시간 7.7초(가상 RAF가 16ms마다 41MB 캔버스 렌더를 강제), 시작 시퀀스(에셋 디코드)와 어긋나 부팅 미완. 타이밍 오탐은 체크포인트+`until`+넉넉한 실시간 예산으로 대응한다.
- 장시간 명령(until 등)은 1시간까지 대기. 클라이언트는 ECONNREFUSED일 때만 데몬을 자동 기동한다(타임아웃 시 재시도 금지 — 명령 중복 방지).

### 1-1. 시나리오 파일 실행 (완주·엣지 스위트 등 장시간 런)
```bash
cd D:\봉담\검수도구
node drive.js <시나리오>.js --url=file:///D:/봉담/<빌드>.html
```
- 환경변수: `SHOTS_DIR`(스크린샷 폴더) · `VW`/`VH`(해상도) · `TOUCH=1`(터치 UA+이벤트)
- 시나리오 시그니처: `module.exports = async (h) => {}` — h.page(playwright), h.say, h.shot, h.wait, h.key, h.hold, h.consoleErrors
- 게임 관측 API: `render_game_to_text()` `BD_isInputBlocked()` `BD_v24NearestFacility()` `BD_hzQuestGate(obj)` `BD_screenRectOfWorld(rx,ry,rw,rh)` `BD_DAMI_STEPS()` `BD_Message._q` `BongdamEditor.state/save`
- 오토파일럿: `require('./auto')(h, require('./lib')(h))` — A.run(스텝수)=목표 추적 완주, A.doBattle(), A.probe()

## 2. 표준 부팅 프리앰블 (시나리오 첫머리) — v326+ 필수판
v325+ 빌드는 «시작하기» 클릭이 **purge→reload→자동 재진입**을 유발한다(v326부터 원 클릭은 전파 차단).
따라서 «타이틀 버튼이 사라질 때까지» 기다리고, 전환 프레임 오판(타이틀 숨김↔모달 표시 사이) 보정까지 넣는다.
```js
await h.click('#bd-title-start'); await h.wait(1500);
for (let t = 0; t < 40; t++) {
  const st = await h.page.evaluate(() => {
    const btn = document.getElementById('bd-title-start');
    const onTitle = !!(btn && btn.offsetHeight > 0);
    const m = document.getElementById('bd-startsetup-modal');
    const modal = !!(m && m.classList.contains('show'));
    if (modal) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} }
    return { onTitle, modal };
  }).catch(() => ({ onTitle: true, modal: false }));      // 리로드 중이면 재시도
  if (!st.onTitle && !st.modal) break;
  if (st.onTitle && !st.modal && t > 3) await h.page.evaluate(() => { try { window.BD_startNewGame && BD_startNewGame(); } catch (e) {} }).catch(() => {});   // 퍼지 훅 우회 직접 시작
  await h.wait(700);
}
// 전환 프레임 조기 탈출 보정 — 늦게 뜬 캐릭터 선택 정리
for (let t2 = 0; t2 < 14; t2++) {
  const m2 = await h.page.evaluate(() => {
    const m = document.getElementById('bd-startsetup-modal');
    if (m && m.classList.contains('show')) { try { BD_pickStartChar(1); BD_confirmStartSetup(); } catch (e) {} return true; }
    return false;
  }).catch(() => false);
  if (!m2 && t2 > 2) break;
  await h.wait(600);
}
await h.wait(2500);
for (let i = 0; i < 6; i++) { await h.page.keyboard.press(' '); await h.wait(400); }
// 튜토 격리(필요 시): bd_dami_awake·bd_tut2_done·bd_dami_tutorial_done·bd_battle_tutorial_done·bd_shop_tutorial_done_v75 = '1'
// 그 후 fadeToStage(212, x, y) — «212 진입 후» 플래그 설정은 이미 대기열에 걸린 튜토를 못 막는다!
// 위험요소 F·이동 측정 전에는 대사 드레인: dialogue-box height>0 || __bdDamiOpeningBusy 인 동안 Space
```

## 3. 실전에서 시간을 태운 함정 (반드시 먼저 읽기)
- `offsetParent`로 표시 판정 금지(fixed=null) — `getComputedStyle().display`+rect로.
- 선택창은 닫혀도 `#bd-choice` DOM이 남는다 — `__bdChoiceState.open`으로 판정. **`BD_choiceConfirm()`은 전역이 아니다(클로저 내부 — ReferenceError가 try/catch에 먹혀 «조용히 무시»로 보인다!)** — 확정은 키보드(Enter/Space, F는 keyup 무장 필요)나 행 클릭으로. 열림 직후 250ms 가드 → 0.4초 대기 후 키 입력.
- **첫 F 1회는 캡처 가드에 먹힐 수 있다** — 프로브는 F 2연타.
- 대사 직후 600ms/550ms 재상호작용 쿨다운 존재.
- 담이 대사는 `#bd-dami-hud`(전용 말풍선), VN은 `#dialogue-box`. 문자 시스템(BD_Message)은 v76에서 **폐기**(no-op) — 장 완료 연출은 `bd-story-call-v76`의 showDialog.
- 전투 종료는 증강 3택까지: `HSR.active`가 참인 동안 `.bd-aug-card`/증강 오버레이 처리 필요.
- 시설 F는 067 캡처 리스너가 최우선 — 사각형距離+지정지점×0.8, 미방문 우선(+500), 반경은 `landmark.interactionRadius`(기본 110px).
- 좌표 변환은 반드시 `BD_screenRectOfWorld`(카메라·줌 정변환) — rx×canvas폭 비례 매핑은 틀린다.
- 파생 캐시 주의: 배치 수정 시 `objects`와 `__v24Landmarks` **두 사본** + JSON 파일까지 동기화.
- 게이트(지역 이동)는 `stage.districtGates`(side 기반) — 텔레포트가 아니라 **걸어서** 경계에 닿아야 폴이 잡는다.
- 에디터가 켜져 있으면 배치 저장에 런타임 오염이 박제될 수 있다(v322 세탁기가 방어) — 그래도 새 오염 키가 생기면 세탁 목록에 추가.
- **런타임 함수 래퍼는 «함수 프로퍼티 마커 + 주기 재설치» 금지.** 나중 래퍼가 위에 덮이면 마커가 사라져 재설치 폭풍 → dedupe류 래퍼가 2겹이면 «바깥이 기록한 것을 안쪽이 중복으로 오인»해 전면 차단(담이 전면 침묵 사건, v326에서 전역 플래그+재진입 가드로 수정). 설치 여부는 **전역 플래그**로.
- **세이브는 3계열이다**: `fantasyRPG_save`(엔진 auto/slot 통합) · `bongdam_guardian_v160`(+레거시 v1, `bongdam_guardian_slot_*`) — **bdSave/bdLoad는 이쪽** · `bd_*` 진행 플래그. 초기화·소거 로직은 셋 다 다뤄야 한다(에디터 키 `bongdam_rpg_editor_*`는 보존).
- 저장 동결(`__bdFreezeStore`)은 sessionStorage에도 걸린다 — 리로드 넘어로 전달할 플래그(bd_auto_open_start 등)는 동결 **전에** 쓰거나 예외 목록에.
- 시나리오 계측에 `h.page.addInitScript()`를 쓰면 **다음 내비게이션부터** 적용 — 리로드 전 페이지를 계측하려면 시나리오 첫머리에서 미리 등록.
- `BD_screenRectOfWorld`는 결과 사각형이 **화면 4px 미만이면 null** — 점 좌표 변환은 엡실론 0.01 사각형으로.
- `QUESTS`·`NPC_QUESTS`·`renderQuestHud`·`BD_choiceConfirm`은 전역이 아니다(클로저). 퀘스트 HUD 강제 렌더는 v332의 `window.__bdRQH()`.
- CPU 스로틀 실측은 CDP: `(await h.page.context().newCDPSession(h.page)).send('Emulation.setCPUThrottlingRate',{rate:4})` — deltaTime·저사양 검증에 사용.
- v332+: 이동은 deltaTime 기반(`getMoveSpeed` 래핑 ×`__bdFrameK` 0.5~2.0) — 이속 측정은 60fps에서 기존과 동일.

## 4. 검증 사다리 (아래로 갈수록 비싸다 — 위부터)
1. **유닛**: 페이지 내 술어/함수 직접 호출 (`BD_DAMI_STEPS()`에서 스텝 찾아 skipIf/waitFor.predicate 검사 등)
2. **표적 프로브**: 해당 상황만 재현하는 s_*.js (1~2분)
3. **엣지 스위트**: `s_edge.js` — 단독 실행, 7항목 (연타·겹침·이탈)
4. **회귀 표본**: `s_round9`(리듬) `s_rush`(러시 잠금) `s_round10`(구조·툴팁) `s_qa12`(라운드12 9종) `s_touchbattle`(TOUCH=1) `s_stamp`(스탬프) `s_dirty` `s_boot`
5. **완주**: `s_fullrun.js`(일반 25분) + `s_demorun.js`(시연 6분) — 백그라운드, cleared=true 확인
6. **스크린샷 육안**: 실패 지점·신규 UI는 반드시 이미지로 직접 확인

## 5. 빌드·패치 규칙
- **소스 트리 D:\봉담\src (2026-08-14 도입) — 편집은 여기서, 빌드 HTML은 산출물.**
  - `src/shell.html`(HTML 뼈대, `@@BLOCK:NNNN@@` 토큰) · `src/blocks/NNNN_<id>.js|css`(script/style 레이어 234개, 순서=번호) · `src/assets/<hash>_<hint>.<ext>`(base64 에셋 474개, 본문엔 `@@B64:<name>@@`) · `manifest.json`.
  - 재조립: `node 검수도구/tools/bundle.js D:\봉담\src D:\봉담\봉담지킴이_게시용_v338_final.html` (1초). 배치 데이터를 바꿨으면 이어서 restamp. 데몬은 `node bd.js reload`.
  - 새 레이어: `node 검수도구/tools/newlayer.js D:\봉담\src bd-foo-vNNN js patch.js` (번호 자동·shell 태그 자동). 에셋 교체: assets/에 파일 넣고 블록에서 `@@B64:이름@@` 참조.
  - HTML을 직접 고쳤다면 `node 검수도구/tools/unbundle.js <html> D:\봉담\src` 로 src 재생성(기계적, 손실 없음; 왕복 sha1 동일 검증됨). **src와 HTML이 어긋난 채 커밋 금지.**
  - 엔진 본체는 `blocks/0002_anon.js`(1.3MB) — Grep 줄번호=Read 줄번호. peek.js 바이트 오프셋은 이제 불필요.
  - **자동 동기화 훅**(.claude/settings.json PostToolUse Edit|Write → .claude/hooks/bundle.js): src/** 편집 시 bundle. **단, 세션 중 간헐적으로 발화하지 않는 사례가 관측됨**(검수도구/hook_debug.log 로 확인 가능). 따라서 검증 전에는 `node bd.js reload`(src가 더 새로우면 자동 bundle) 또는 명시적 bundle 을 반드시 거친다. release.js 의 src↔HTML 일치검사가 최종 방어선.
  - **원커맨드 릴리스**: `node 검수도구/tools/release.js --msg="vNNN: 무엇"` = 일치검사(src↔HTML, 불일치면 --from=src|html 요구) → restamp(멱등) → 스모크(전용 데몬 :47813, 212 부팅+쓰레기 전투+콘솔0) → 배포(배포/ + Drive, **패치마다 봉담지킴이_게시용_vNNN[x].html 버전명 파일**) → git 커밋. 옵션 --no-smoke/--no-deploy/--no-commit. 확정 빌드는 이 명령으로만 내보낸다.
- **git (2026-08-14 도입, D:\봉담)**: 빌드 확정(검증 통과·배포)마다 `git add -A && git commit -m "vNNN: 무엇"`. autocrlf=false·`.gitattributes * -text`로 바이트 그대로 저장(restamp·peek 오프셋 보존). 원인 추적은 복사본 뒤지기 대신 `git bisect`/`git diff vA vB`. 구버전_보관·배포·shots·zip은 .gitignore.
- 패치 스크립트: scratchpad에 `stageNN_patch.js` — `split(old)`로 매치 수 검증(≠기대 → throw), 출력은 새 버전 파일.
- 에디터 진입: 게시 모드에서 **Shift+Z+X+C** 동시 누름 → `?dev=1` 리로드 토글.
- 최종 확정 전 체크리스트: 엣지 7/7(단독) · 완주 2종 cleared · 콘솔 0(무해 터치 경고 제외) · restamp 여부 · progress.md/출시노트.md 기록.

