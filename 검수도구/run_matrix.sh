#!/bin/sh
# (v376) 3엔진 × 해상도 매트릭스 — http 서빙(사파리 file:// 저장 문제 회피) 후 s_compat 스모크
cd "$(dirname "$0")"
python -m http.server 47821 --bind 127.0.0.1 --directory D:/봉담 >/dev/null 2>&1 &
SRV=$!
sleep 1
URL="http://127.0.0.1:47821/%EB%B4%89%EB%8B%B4%EC%A7%80%ED%82%B4%EC%9D%B4_%EA%B2%8C%EC%8B%9C%EC%9A%A9_v338_final.html"
for BR in chromium firefox webkit; do
  for RES in "1920 1080 0" "1366 768 0" "1024 768 1" "844 390 1" "2560 1080 0"; do
    set -- $RES
    VW=$1 VH=$2 TOUCH=$3 BROWSER=$BR SHOTS_DIR=shots_matrix node drive.js s_compat.js --url="$URL" 2>&1 | grep -E "^RESULT|Error|실패" | head -3
  done
done
kill $SRV 2>/dev/null
