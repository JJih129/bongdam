// (v336) 래퍼 재설치 폭풍 차단 검증
//  BD_drawNpcQuestMarks 최외곽 함수에 __v289 · __v293top 마커가 «동시에» 남아 있으면
//  wrapMarks/wrapTop 어느 쪽도 더는 재설치하지 않는다 = 폭풍 정지.
//  (v335까지는 서로 마커를 덮어 1.2~1.5초마다 무한 재래핑 → 히어로 중복 드로우)
module.exports = async (h) => {
  const { say } = h;
  const probe = () => h.page.evaluate(() => {
    const f = window.BD_drawNpcQuestMarks;
    return f ? { v289: !!f.__v289, v293top: !!f.__v293top } : { none: true };
  });
  await h.wait(4000);                       // 두 설치 틱(1.2s/1.5s) 모두 지난 뒤
  const a = await probe();
  say('4초: ' + JSON.stringify(a));
  await h.wait(8000);                       // 폭풍이 있다면 이 사이 재래핑으로 마커가 번갈아 사라짐
  const b = await probe();
  say('12초: ' + JSON.stringify(b));
  const ok = a.v289 && a.v293top && b.v289 && b.v293top;
  say(ok ? '✅ 마커 동시 유지 — 재설치 폭풍 정지' : '❌ 마커 유실 — 폭풍 지속');
};
