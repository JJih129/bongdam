/* 로딩 화면 캡처 — 로드 직후 페이지 리로드를 걸고 이른 시점에 스크린샷 */
module.exports = async (h) => {
  const page = h.page;
  // 부트 로더/스플래시는 파싱 초반에만 존재 — reload 후 짧게 기다렸다 촬영
  await page.reload({ waitUntil: 'commit' }).catch(() => {});
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: 'D:/봉담/검수도구/shots_bd/loader_early.png' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'D:/봉담/검수도구/shots_bd/loader_mid.png' }).catch(() => {});
  h.say('done');
};
