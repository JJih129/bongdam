# 봉담지킴이 자동 검수 도구 (v147)

Playwright(Node) 기반. 게임의 `_collidesAt` 을 그대로 재사용해
**실제 플레이어가 갈 수 있는 길**을 BFS로 계산하고, 화살표를 따라 자동으로 플레이한다.

## 준비
```bash
npm i playwright@1.49.1
npx playwright install chromium
```

## 실행
```bash
node drive.js s_auto.js          # 처음~엔딩 무인 완주
node drive.js s_panels.js        # 모든 UI 패널 개폐 검증
node drive.js s_save.js          # 저장 → 새로고침 → 이어하기
node drive.js s_wall2.js         # 투명벽(콜라이더 이탈) 스캔
node drive.js s_quest.js         # 주민↔위험요소 부탁 매칭 점검
node drive.js s_boss2.js         # 최종 보스 진입 시퀀스
node drive.js s_defeat.js        # 패배 → 부활 → 복귀
node drive.js s_visual.js        # 주요 화면 스크린샷
```
환경변수: `SHOTS_DIR`(스크린샷 폴더) · `STEPS`(오토파일럿 최대 스텝) ·
`VW`/`VH`(해상도) · `--headed`(브라우저 표시)

스크린샷은 `shots/`(또는 SHOTS_DIR)에 저장되고,
막힌 지점은 `BLOCK_*.png` / `WALL_*.png` / `NOGUIDE_*.png` 로 남는다.

## 파일 수정 도구
```bash
node patch.js <패치정의.js>   # 92MB 파일에 대해 «정확히 1곳» 매칭될 때만 치환
node find.js "정규식" 3        # base64 줄을 건너뛰고 검색 (\uXXXX 도 해독)
```
