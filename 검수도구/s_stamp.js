// 베이크 스탬프 검증 — ①신규 PC ②구 빌드를 열었던 PC(오염) ③같은 빌드 재오픈(에디터 보존)
module.exports = async (h) => {
  const { say } = h;
  const bikeRx = async () => await h.page.evaluate(() => {
    try { const d = JSON.parse(localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest')); const st = (d.stages || d)[212]; const o = (st.objects || []).find(x => x && x.hazardId === 'ow212_bicycle_1'); return o ? +Number(o.rx).toFixed(3) : null; } catch (e) { return 'ERR'; }
  });
  const stamp = async () => await h.page.evaluate(() => localStorage.getItem('bd_bake_stamp'));

  // ① 신규 PC (드라이버가 새 프로필)
  await h.wait(1500);
  say('① 신규: stamp=' + await stamp() + ' bikeRx=' + await bikeRx());

  // ② 구 빌드를 열었던 PC 시뮬: 자전거를 옛 위치로 오염 + 옛 스탬프
  await h.page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest'));
    const st = (d.stages || d)[212];
    const o = (st.objects || []).find(x => x && x.hazardId === 'ow212_bicycle_1');
    o.rx = 0.5767; o.ry = 0.0114;   // 옛(접근 불가) 위치
    localStorage.setItem('bongdam_rpg_editor_data_v5_2_quest', JSON.stringify(d));
    localStorage.setItem('bd_bake_stamp', 'bd-build-v117');   // 구 빌드 스탬프
  });
  say('② 오염 주입: bikeRx=' + await bikeRx());
  await h.page.reload({ waitUntil: 'load', timeout: 180000 });
  await h.wait(2500);
  const s2 = await stamp(), r2 = await bikeRx();
  say('② 리로드 후: stamp=' + s2 + ' bikeRx=' + r2 + (r2 === 0.553 ? ' ✅ 새 배치 적용' : ' ❌ 옛 배치 잔존'));

  // ③ 같은 빌드 재오픈: 에디터 수정 보존 (스탬프 유지 상태에서 값 수정 → 리로드 → 유지돼야)
  await h.page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('bongdam_rpg_editor_data_v5_2_quest'));
    const st = (d.stages || d)[212];
    const o = (st.objects || []).find(x => x && x.hazardId === 'ow212_bicycle_1');
    o.rx = 0.611;   // 에디터에서 옮겼다고 가정
    localStorage.setItem('bongdam_rpg_editor_data_v5_2_quest', JSON.stringify(d));
  });
  await h.page.reload({ waitUntil: 'load', timeout: 180000 });
  await h.wait(2500);
  const r3 = await bikeRx();
  say('③ 재오픈 후: bikeRx=' + r3 + (r3 === 0.611 ? ' ✅ 에디터 수정 보존' : ' ❌ 수정 소실'));
  say('콘솔 오류: ' + h.consoleErrors.length);
  say((r2 === 0.553 && r3 === 0.611) ? '✅ 스탬프 검증 통과' : '❌ 확인 필요');
};
