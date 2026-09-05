// v304 로딩 오버레이 — 파싱 후 제거 확인
module.exports = async (h) => {
  const { say } = h;
  const st = await h.page.evaluate(() => ({
    loader: !!document.getElementById('bd-boot-loader'),
    title: (() => { const b = document.getElementById('bd-title-start'); return !!(b && b.offsetWidth > 0); })(),
  }));
  say('로드 후: ' + JSON.stringify(st));
  await h.shot('boot_after');
  say('콘솔 오류: ' + h.consoleErrors.length);
  say(!st.loader && st.title ? '✅ 로더 정상 제거' : '❌ 확인 필요');
};
